---
read_when:
    - Anda menginginkan langkah LLM khusus JSON di dalam alur kerja
    - Anda memerlukan output LLM yang divalidasi skema untuk otomatisasi
summary: Tugas LLM khusus JSON untuk alur kerja (alat Plugin opsional)
title: Tugas LLM
x-i18n:
    generated_at: "2026-04-24T09:31:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` adalah **alat Plugin opsional** yang menjalankan tugas LLM khusus JSON dan
mengembalikan output terstruktur (opsional divalidasi terhadap JSON Schema).

Ini ideal untuk engine alur kerja seperti Lobster: Anda dapat menambahkan satu langkah LLM
tanpa menulis kode OpenClaw kustom untuk setiap alur kerja.

## Aktifkan Plugin

1. Aktifkan Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Allowlist alat tersebut (alat ini terdaftar dengan `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## Konfigurasi (opsional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` adalah allowlist string `provider/model`. Jika ditetapkan, permintaan apa pun
di luar daftar akan ditolak.

## Parameter alat

- `prompt` (string, wajib)
- `input` (apa pun, opsional)
- `schema` (object, JSON Schema opsional)
- `provider` (string, opsional)
- `model` (string, opsional)
- `thinking` (string, opsional)
- `authProfileId` (string, opsional)
- `temperature` (number, opsional)
- `maxTokens` (number, opsional)
- `timeoutMs` (number, opsional)

`thinking` menerima preset reasoning OpenClaw standar, seperti `low` atau `medium`.

## Output

Mengembalikan `details.json` yang berisi JSON yang telah di-parse (dan memvalidasi terhadap
`schema` saat disediakan).

## Contoh: langkah alur kerja Lobster

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## Catatan keamanan

- Alat ini **khusus JSON** dan menginstruksikan model untuk hanya menghasilkan JSON (tanpa
  code fence, tanpa komentar).
- Tidak ada alat yang diekspos ke model untuk run ini.
- Perlakukan output sebagai tidak tepercaya kecuali Anda memvalidasinya dengan `schema`.
- Letakkan persetujuan sebelum langkah apa pun yang memiliki efek samping (send, post, exec).

## Terkait

- [Tingkat thinking](/id/tools/thinking)
- [Sub-agen](/id/tools/subagents)
- [Slash command](/id/tools/slash-commands)
