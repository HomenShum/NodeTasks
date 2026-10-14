"""Offline catalog-user scenarios against finite, real loopback HTTP servers."""

import json
import sys
import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps"))
from nodeagent_bridge import (  # noqa: E402
    MAX_PROMPT_CHARS,
    MAX_REQUEST_BYTES,
    MAX_RESPONSE_BYTES,
    call_nodeagent,
)


def strict_json(raw):
    def reject_constant(value):
        raise ValueError(value)
    return json.loads(raw, parse_constant=reject_constant)


@contextmanager
def endpoint(respond):
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_POST(self):
            raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            requests.append((self.path, raw))
            status, headers, body, delay = respond(self.path, raw)
            # Every fixture expires, including the one exercising the real 20 s timeout.
            if delay:
                time.sleep(delay)
            try:
                self.send_response(status)
                for name, value in headers.items():
                    self.send_header(name, value)
                self.end_headers()
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                pass

        do_GET = do_POST  # Detect any redirected GET, not just a repeated POST.

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    server.daemon_threads = False
    thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.02})
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}", requests
    finally:
        server.shutdown()
        server.server_close()  # Wait for our finite request handlers as well.
        thread.join(2)
        assert not thread.is_alive(), "owned endpoint did not stop"


def reply(body=b'{"answer":"Inspect task-1; proxy proof is not an official score."}', status=200):
    return lambda path, raw: (status, {}, body, 0)


class CatalogUserRecovery(unittest.TestCase):
    def ask(self, url, question="Which task should a new contributor inspect?", context=None):
        if context is None:
            context = [{"id": "task-1", "estimated_cost_usd": None, "score_status": "proxy-only"}]
        return call_nodeagent(url, question, context, "New contributor", "public-node-repo-proofs")

    def assert_failure(self, result):
        self.assertIsNone(result.answer)
        self.assertIsInstance(result.error, str)
        self.assertTrue(result.error)

    def test_local_user_and_all_supported_external_answers_preserve_the_contract(self):
        with endpoint(reply()) as (url, requests):
            local = self.ask("")
            self.assertEqual((local.answer, local.error), (None, None))
            self.assertEqual(requests, [])
        for shape in [{"answer": "task-1"}, {"text": "task-1"}, {"finalText": "task-1"},
                      {"message": {"content": "task-1"}}]:
            with self.subTest(shape=shape), endpoint(reply(json.dumps(shape).encode())) as (url, requests):
                result = self.ask(url, context=[{"id": "task-1", "estimated_cost_usd": None},
                                                {"id": "task-0", "estimated_cost_usd": 0},
                                                {"id": "task-f", "estimated_cost_usd": 0.123456789012345}])
                self.assertEqual((result.answer, result.error), ("task-1", None))
                payload = strict_json(requests[0][1])
                self.assertEqual(payload["schema"], "nodetasks-nodeagent-bridge-v1")
                self.assertEqual(payload["mode"], "catalog_qa")
                self.assertEqual(payload["message"], payload["question"])
                self.assertEqual(payload["catalogContext"], payload["context"])
                self.assertEqual([r["estimated_cost_usd"] for r in payload["context"]],
                                 [None, 0, 0.123456789012345])
                self.assertEqual(payload["persona"], "New contributor")
                self.assertEqual(payload["savedView"], "public-node-repo-proofs")
                self.assertEqual(payload["responseContract"], {"answerField": "answer",
                    "mustCiteTaskIds": True, "mustPreserveScoreBoundary": True})

    def test_unavailable_or_malformed_endpoint_never_impersonates_an_answer_then_recovers(self):
        bodies = [b"not-json", b"\xff", b"[]", b"null", b"{}", b'{"answer":"  "}',
                  b'{"answer":false}', b'{"text":42}', b'{"finalText":[]}',
                  b'{"message":{"content":{}}}', b'{"message":"wrong"}',
                  b'{"answer":NaN}', b'"a bare answer"']
        for body in bodies:
            with self.subTest(body=body), endpoint(reply(body)) as (url, _):
                self.assert_failure(self.ask(url))
        with endpoint(reply(status=503)) as (url, _):
            self.assert_failure(self.ask(url))
        # The closed, once-owned port is a real refused connection, not a mocked transport.
        self.assert_failure(self.ask(url))
        with endpoint(reply()) as (url, _):
            self.assertIn("task-1", self.ask(url).answer)

    def test_developer_endpoint_authority_rejects_malformed_urls_and_redirect_targets(self):
        with endpoint(reply()) as (target, target_requests):
            invalid = ["file:///tmp/catalog", "ftp://localhost/", "http:///missing", "http://",
                       "http://bad host/", "http://-bad/", "http://host:0/", "http://host:65536/",
                       "http://host:no/", "http://[bad/", "http://[::1]unparsed-tail/",
                       "http://host:/", " http://localhost/",
                       target + "#fragment", target.replace("http://", "http://user:password@"),
                       target + "\n"]
            for url in invalid:
                with self.subTest(url=url):
                    self.assert_failure(self.ask(url))
            self.assertEqual(target_requests, [])
            for status in [301, 302, 303, 307, 308]:
                with self.subTest(status=status), endpoint(
                    lambda path, raw: (status, {"Location": target}, b"redirect", 0)
                ) as (url, source_requests):
                    self.assert_failure(self.ask(url))
                    self.assertEqual(len(source_requests), 1)
                    self.assertEqual(target_requests, [])
            self.assertIsNone(self.ask(target).error)  # Intended local endpoints still work.
            self.assertEqual(len(target_requests), 1)

    def test_large_prompts_context_and_responses_are_bounded_before_admission(self):
        with endpoint(reply()) as (url, requests):
            self.assertIsNone(self.ask(url, "x" * MAX_PROMPT_CHARS).error)
            self.assertEqual(len(requests), 1)
            for question, context in [("x" * (MAX_PROMPT_CHARS + 1), []),
                                      ("small", [{"note": "é" * MAX_REQUEST_BYTES}]),
                                      ("small", [{"estimated_cost_usd": float("nan")}]),
                                      ("small", [{"estimated_cost_usd": float("inf")}])]:
                with self.subTest(questionLength=len(question), contextType=type(context).__name__):
                    self.assert_failure(self.ask(url, question, context))
                    self.assertEqual(len(requests), 1)
        # A valid JSON string at exactly the byte cap is allowed; one byte more is not.
        prefix, suffix = b'{"answer":"', b'"}'
        body = prefix + b"x" * (MAX_RESPONSE_BYTES - len(prefix) - len(suffix)) + suffix
        with endpoint(reply(body)) as (url, _):
            self.assertIsNone(self.ask(url).error)
        with endpoint(reply(body + b" ")) as (url, _):
            self.assert_failure(self.ask(url))

    def test_slow_local_bridge_hits_existing_socket_timeout_and_next_question_recovers(self):
        with endpoint(lambda path, raw: (200, {}, b'{"answer":"too late"}', 21)) as (url, requests):
            started = time.monotonic()
            self.assert_failure(self.ask(url))
            elapsed = time.monotonic() - started
            self.assertGreaterEqual(elapsed, 19)
            self.assertLess(elapsed, 24)
            self.assertEqual(len(requests), 1)
        with endpoint(reply()) as (url, _):
            self.assertIsNone(self.ask(url).error)

    def test_escaped_invalid_unicode_cannot_poison_chat_and_valid_unicode_recovers(self):
        valid = "Inspect task-1: café 東京 🧭; proxy evidence only."
        for field in ["answer", "text", "finalText", "message"]:
            for invalid in ["\ud800", "\udfff"]:
                shape = {field: {"content": invalid} if field == "message" else invalid}
                bodies = iter([json.dumps(shape).encode(), json.dumps({"answer": valid}).encode()])
                with self.subTest(field=field, invalid=repr(invalid)), endpoint(
                    lambda path, raw: (200, {}, next(bodies), 0)
                ) as (url, requests):
                    self.assert_failure(self.ask(url, "Recover from malformed Unicode."))
                    recovered = self.ask(url, "Now provide valid Unicode text.")
                    self.assertEqual((recovered.answer, recovered.error), (valid, None))
                    self.assertEqual(len(requests), 2)

    def test_four_concurrent_people_keep_context_isolated_then_twelve_turns_recover(self):
        def respond(path, raw):
            payload = strict_json(raw)
            question = payload["question"]
            status = 503 if question.startswith("failure-") else 200
            body = json.dumps({"answer": f"{question}:{payload['context'][0]['id']}"}).encode()
            return status, {}, body, 0

        with endpoint(respond) as (url, requests):
            def person(index):
                return self.ask(url, f"person-{index}", [{"id": f"task-{index}"}])
            with ThreadPoolExecutor(max_workers=4) as workers:
                results = list(workers.map(person, range(4)))
            for index, result in enumerate(results):
                self.assertEqual((result.answer, result.error), (f"person-{index}:task-{index}", None))
            for turn in range(12):
                question = f"{'failure' if turn % 2 == 0 else 'recovery'}-{turn}"
                result = self.ask(url, question, [{"id": f"turn-{turn}", "estimated_cost_usd": None}])
                if turn % 2 == 0:
                    self.assert_failure(result)
                else:
                    self.assertEqual((result.answer, result.error), (f"{question}:turn-{turn}", None))
            self.assertEqual(len(requests), 16)
            self.assertEqual(len({strict_json(raw)["question"] for _, raw in requests}), 16)


if __name__ == "__main__":
    unittest.main(verbosity=2)
