---
title: Judge0 Code Execution API
emoji: 🚀
colorFrom: indigo
colorTo: purple
sdk: docker
sdk_version: ""
app_file: Dockerfile
pinned: false
---

# Judge0 CE - Free Code Execution API

Execute code in 60+ programming languages.

## Quick Start

```bash
curl -X POST "https://YOUR-USERNAME-judge0.hf.space/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"Hello World\")","language_id":71}'
```

## Response

```json
{
  "stdout": "Hello World\n",
  "time": "0.001",
  "memory": 3456,
  "status": {"id": 3, "description": "Accepted"}
}
```

## Language Examples

| Language | language_id |
|----------|-------------|
| Python 3.8.1 | 71 |
| JavaScript (Node.js) | 63 |
| Java (OpenJDK 13) | 62 |
| C++ (GCC 9.2.0) | 54 |
| C (GCC 9.2.0) | 50 |
| Go (1.13.5) | 60 |
| Rust (1.40.0) | 73 |
| PHP (7.4.1) | 68 |
| Ruby (2.7.0) | 72 |
| Python 2.7.17 | 70 |

[Full language list](https://judge0.com/docs/1.13.0/ce/languages/)

## API Documentation

Full API docs: https://judge0.com/docs/

## Credits

- Powered by [Judge0](https://github.com/judge0/judge0)
- Hosted on [Hugging Face Spaces](https://huggingface.co/spaces)
