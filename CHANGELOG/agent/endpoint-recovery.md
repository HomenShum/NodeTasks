# Optional endpoint recovery

A catalog user now receives the existing cited local answer when an optional NodeAgent endpoint fails, together with a saved failure notice. Previously HTTP errors became the entire answer, and a JSON array could crash before saving an assistant turn. The bridge now separates admitted answer strings from errors and preserves valid `answer`, `text`, `finalText` and `message.content` responses.

Actual filtered DataFrame rows now serialize missing costs as JSON null with fifteen-digit numeric precision; strict request encoding rejects NaN and infinity. Direct HTTP(S) destinations remain editable for trusted local use, including private/local bridges. Invalid hosts/ports, credentials, fragments and redirects are rejected. This is not a shared-server SSRF guarantee.

Fixed bounds are 4,096 prompt characters, 128 KiB encoded requests, 64 KiB response bodies and fifty completed conversation pairs. The existing twenty-second blocking-operation timeout is unchanged and is not a hard total deadline. No retries, new dependencies, model calls, catalog/receipt regeneration or visual redesign are included.

Standard-library Python 3.11 socket scenarios join CI alongside the unchanged corpus checks. They exercise malformed/failed responses, recovery, request/response limits, destination restrictions, a finite slow endpoint, four concurrent callers and twelve alternating failure/recovery turns. Full-app retention and rendered browser evidence remain separate from CI coverage; accepting external answer text does not certify model quality or benchmark scores.
