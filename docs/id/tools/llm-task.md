---
read_when:
    - Anda menginginkan langkah LLM khusus JSON di dalam alur kerja
    - Anda memerlukan keluaran LLM yang tervalidasi skema untuk otomatisasi
summary: Tugas LLM khusus JSON untuk alur kerja (alat Plugin opsional)
title: Tugas LLM
x-i18n:
    generated_at: "2026-05-04T07:08:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` adalah **alat Plugin opsional** yang menjalankan tugas LLM khusus JSON dan
mengembalikan output terstruktur (secara opsional divalidasi terhadap JSON Schema).

Ini ideal untuk mesin alur kerja seperti Lobster: Anda dapat menambahkan satu langkah LLM
tanpa menulis kode OpenClaw khusus untuk setiap alur kerja.

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

2. Izinkan alat opsional:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Gunakan `tools.allow` hanya ketika Anda menginginkan mode daftar izin yang restriktif.

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

`allowedModels` adalah daftar izin untuk string `provider/model`. Jika disetel, permintaan apa pun
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

`thinking` menerima preset penalaran standar OpenClaw, seperti `low` atau `medium`.

## Output

Mengembalikan `details.json` yang berisi JSON yang telah diuraikan (dan memvalidasi terhadap
`schema` ketika disediakan).

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

- Alat ini **khusus JSON** dan menginstruksikan model untuk hanya mengeluarkan JSON (tanpa
  code fence, tanpa komentar).
- Tidak ada alat yang diekspos ke model untuk eksekusi ini.
- Perlakukan output sebagai tidak tepercaya kecuali Anda memvalidasinya dengan `schema`.
- Letakkan persetujuan sebelum langkah apa pun yang menimbulkan efek samping (send, post, exec).

## Terkait

- [Tingkat thinking](/id/tools/thinking)
- [Sub-agen](/id/tools/subagents)
- [Perintah slash](/id/tools/slash-commands)
