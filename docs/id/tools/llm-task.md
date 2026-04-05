---
read_when:
    - Anda menginginkan langkah LLM khusus JSON di dalam alur kerja
    - Anda memerlukan output LLM tervalidasi schema untuk otomatisasi
summary: Tugas LLM khusus JSON untuk alur kerja (tool plugin opsional)
title: LLM Task
x-i18n:
    generated_at: "2026-04-05T14:08:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# LLM Task

`llm-task` adalah **tool plugin opsional** yang menjalankan tugas LLM khusus JSON dan
mengembalikan output terstruktur (secara opsional divalidasi terhadap JSON Schema).

Ini ideal untuk mesin alur kerja seperti Lobster: Anda dapat menambahkan satu langkah LLM
tanpa menulis kode OpenClaw kustom untuk setiap alur kerja.

## Aktifkan plugin

1. Aktifkan plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Masukkan tool ke allowlist (tool ini terdaftar dengan `optional: true`):

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

## Config (opsional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` adalah allowlist string `provider/model`. Jika disetel, permintaan apa pun
di luar daftar akan ditolak.

## Parameter tool

- `prompt` (string, wajib)
- `input` (apa pun, opsional)
- `schema` (objek, JSON Schema opsional)
- `provider` (string, opsional)
- `model` (string, opsional)
- `thinking` (string, opsional)
- `authProfileId` (string, opsional)
- `temperature` (angka, opsional)
- `maxTokens` (angka, opsional)
- `timeoutMs` (angka, opsional)

`thinking` menerima preset penalaran OpenClaw standar, seperti `low` atau `medium`.

## Output

Mengembalikan `details.json` yang berisi JSON yang sudah diparse (dan divalidasi terhadap
`schema` jika diberikan).

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

- Tool ini **khusus JSON** dan menginstruksikan model untuk hanya menghasilkan JSON (tanpa
  code fence, tanpa komentar).
- Tidak ada tool yang diekspos ke model untuk eksekusi ini.
- Perlakukan output sebagai tidak tepercaya kecuali Anda memvalidasinya dengan `schema`.
- Tempatkan persetujuan sebelum langkah apa pun yang memiliki efek samping (kirim, posting, exec).
