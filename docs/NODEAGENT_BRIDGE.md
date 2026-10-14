# NodeTasks NodeAgent Bridge

The Streamlit app can answer catalog questions in two modes:

- Local catalog mode: deterministic, offline, and source-cited from the ranked catalog.
- Endpoint mode: set `NODEAGENT_ENDPOINT` or the sidebar endpoint field to a POST endpoint that accepts the bridge payload below.

This editable destination is intended for a trusted local developer app. Direct HTTP(S) endpoints, including local and private addresses, are supported. The bridge rejects invalid hosts/ports, embedded credentials and fragments, and does not follow redirects. These restrictions do not make a shared server safe for untrusted visitors: that deployment needs a separate operator-controlled endpoint authority policy before exposing this field.

## Request

```json
{
  "schema": "nodetasks-nodeagent-bridge-v1",
  "mode": "catalog_qa",
  "question": "Which cheap SpreadsheetBench model attempts should I run first?",
  "message": "Which cheap SpreadsheetBench model attempts should I run first?",
  "persona": "Model evaluator",
  "savedView": "cheap-spreadsheetbench-models",
  "catalogContext": [
    {
      "id": "model-attempt.poolside-laguna-xs-2-1.spreadsheetbench-v1-full-912.102-20",
      "title": "Run poolside/laguna-xs-2.1 on SpreadsheetBench task 102-20",
      "domain": "Spreadsheet & Office Automation",
      "difficulty": "advanced",
      "cost_tier": "provider-low",
      "verifier_type": "model-proxy-receipt",
      "score_status": "official-boundary-blocked"
    }
  ],
  "responseContract": {
    "answerField": "answer",
    "mustCiteTaskIds": true,
    "mustPreserveScoreBoundary": true
  }
}
```

`context` is also sent as the legacy alias of `catalogContext`; `message` remains the alias of `question`. The app sends up to twelve currently filtered rows. Missing numeric values such as unknown `estimated_cost_usd` are JSON `null`, distinct from a known zero. Pandas serializes records with fifteen-digit precision, and the bridge rejects non-JSON numbers rather than sending `NaN` or infinity.

## Response

Return one of these shapes:

```json
{ "answer": "Start with ..." }
```

```json
{ "text": "Start with ..." }
```

```json
{ "finalText": "Start with ..." }
```

```json
{ "message": { "content": "Start with ..." } }
```

The answer must be a nonempty, UTF-8-encodable string in one of these fields. The answer should cite task ids and keep proxy/product-path proof separate from official benchmark scoring; accepting external prose does not independently verify those claims. HTTP/transport failures, invalid UTF-8/JSON, unsupported response shapes and exceeded byte limits return an explicit error. Streamlit then uses its existing local answer for the current filters and saves the failure disclosure with that answer, including across reruns. An empty endpoint uses local mode without a failure notice or network request.

Questions are limited to 4,096 characters before chat retention or transmission. Encoded requests are capped at 128 KiB; response bodies are read only up to 64 KiB plus one overflow-detection byte before decoding. The existing twenty-second blocking-operation timeout remains: it is not cancellation or a hard deadline for the whole request, and a slowly progressing response may take longer. There is no automatic retry.

Chat keeps the latest fifty completed user/assistant pairs in the current Streamlit session. Each pair is completed before old pairs are evicted. This is bounded session history, not durable or lifetime storage.

## Offline regression checks

```bash
python -m unittest discover -s test -p 'test_nodeagent_bridge.py' -v
npm run check
```

CI runs the bridge scenarios on Python 3.11 with standard-library dependencies only. Finite local HTTP servers cover supported answers, failure/recovery, strict request data, direct URL/redirect restrictions, byte/prompt bounds, the blocking timeout, four concurrent callers and twelve alternating failed/successful turns. These checks do not run a provider, the Streamlit UI, or a browser. Local AppTest and Chrome checks are separate evidence layers.

## Local Smoke

```bash
npm run streamlit -- --server.address 127.0.0.1 --server.port 8502
```

Then open:

```text
http://127.0.0.1:8502/?view=cheap-spreadsheetbench-models&persona=Model%20evaluator&ask=Which%20cheap%20SpreadsheetBench%20model%20attempts%20should%20I%20run%20first%3F
```
