---
read_when:
    - Anda menginginkan langkah LLM khusus JSON di dalam alur kerja
    - Anda memerlukan keluaran LLM yang divalidasi skema untuk otomatisasi
summary: Tugas LLM khusus JSON untuk alur kerja (alat Plugin opsional)
title: Tugas LLM
x-i18n:
    generated_at: "2026-06-27T18:19:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` adalah **alat Plugin opsional** yang menjalankan tugas LLM khusus JSON dan
mengembalikan keluaran terstruktur (opsional divalidasi terhadap JSON Schema).

Ini ideal untuk mesin alur kerja seperti Lobster: Anda dapat menambahkan satu langkah LLM
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
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` adalah daftar izin string `provider/model`. Jika diatur, permintaan apa pun
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

## Keluaran

Mengembalikan `details.json` yang berisi JSON yang telah diurai (dan memvalidasi terhadap
`schema` jika disediakan).

## Contoh: langkah alur kerja Lobster

### Batasan penting

Contoh di bawah mengasumsikan **CLI Lobster mandiri** berjalan di lingkungan tempat `openclaw.invoke` sudah memiliki URL Gateway/konteks autentikasi yang benar.

Untuk runner Lobster **tertanam** yang dibundel di dalam OpenClaw, pola CLI bertingkat ini **saat ini belum andal**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Sampai Lobster tertanam memiliki bridge yang didukung untuk alur ini, sebaiknya gunakan salah satu dari:

- panggilan alat `llm-task` langsung di luar Lobster, atau
- langkah Lobster yang tidak bergantung pada panggilan `openclaw.invoke` bertingkat.

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
- Tidak ada alat yang diekspos ke model untuk proses ini.
- Perlakukan keluaran sebagai tidak tepercaya kecuali Anda memvalidasinya dengan `schema`.
- Tempatkan persetujuan sebelum langkah apa pun yang memiliki efek samping (send, post, exec).

## Terkait

- [Tingkat thinking](/id/tools/thinking)
- [Sub-agen](/id/tools/subagents)
- [Perintah slash](/id/tools/slash-commands)
