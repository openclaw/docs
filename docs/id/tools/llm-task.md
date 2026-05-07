---
read_when:
    - Anda menginginkan langkah LLM khusus JSON di dalam alur kerja
    - Anda memerlukan keluaran LLM yang divalidasi skema untuk otomatisasi
summary: Tugas LLM khusus JSON untuk alur kerja (alat Plugin opsional)
title: Tugas LLM
x-i18n:
    generated_at: "2026-05-07T13:26:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` adalah **alat Plugin opsional** yang menjalankan tugas LLM khusus JSON dan
mengembalikan output terstruktur (opsional divalidasi terhadap JSON Schema).

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

Gunakan `tools.allow` hanya ketika Anda menginginkan mode allowlist yang restriktif.

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

`allowedModels` adalah allowlist string `provider/model`. Jika diatur, setiap permintaan
di luar daftar akan ditolak.

## Parameter alat

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

Mengembalikan `details.json` yang berisi JSON yang telah diurai (dan memvalidasinya terhadap
`schema` jika disediakan).

## Contoh: langkah alur kerja Lobster

### Batasan penting

Contoh di bawah mengasumsikan **CLI Lobster mandiri** berjalan di lingkungan tempat `openclaw.invoke` sudah memiliki URL Gateway/konteks autentikasi yang benar.

Untuk runner Lobster **tersemat** yang dibundel di dalam OpenClaw, pola CLI bersarang ini **saat ini belum andal**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Sampai Lobster tersemat memiliki bridge yang didukung untuk alur ini, sebaiknya gunakan salah satu dari:

- panggilan alat `llm-task` langsung di luar Lobster, atau
- langkah Lobster yang tidak bergantung pada panggilan `openclaw.invoke` bersarang.

Contoh CLI Lobster mandiri:

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
- Tidak ada alat yang diekspos ke model untuk eksekusi ini.
- Perlakukan output sebagai tidak tepercaya kecuali Anda memvalidasinya dengan `schema`.
- Letakkan persetujuan sebelum langkah apa pun yang memiliki efek samping (kirim, posting, exec).

## Terkait

- [Tingkat thinking](/id/tools/thinking)
- [Sub-agen](/id/tools/subagents)
- [Perintah slash](/id/tools/slash-commands)
