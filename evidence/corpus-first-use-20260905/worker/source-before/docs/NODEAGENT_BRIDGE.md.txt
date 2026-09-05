# NodeTasks NodeAgent Bridge

The Streamlit app can answer catalog questions in two modes:

- Local catalog mode: deterministic, offline, and source-cited from the ranked catalog.
- Endpoint mode: set `NODEAGENT_ENDPOINT` to a POST endpoint that accepts the bridge payload below.

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

## Response

Return one of these shapes:

```json
{ "answer": "Start with ..." }
```

```json
{ "text": "Start with ..." }
```

```json
{ "message": { "content": "Start with ..." } }
```

The answer should cite task ids and keep proxy/product-path proof separate from official benchmark scoring. If the endpoint is unavailable or returns an unexpected shape, Streamlit falls back to local catalog mode and reports the endpoint failure inline.

## Local Smoke

```bash
npm run streamlit
```

Then open:

```text
http://127.0.0.1:8502/?view=cheap-spreadsheetbench-models&persona=Model%20evaluator&ask=Which%20cheap%20SpreadsheetBench%20model%20attempts%20should%20I%20run%20first%3F
```
