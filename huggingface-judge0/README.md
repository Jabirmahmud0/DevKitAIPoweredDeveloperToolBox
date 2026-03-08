# Judge0 CE on Hugging Face Spaces

Free code execution API.

## Usage

```bash
curl -X POST "https://YOUR-USERNAME-judge0.hf.space/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"Hello World\")","language_id":71}'
```
