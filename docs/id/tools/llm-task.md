---
read_when:
    - Anda menginginkan langkah LLM khusus JSON di dalam alur kerja
    - Anda memerlukan keluaran LLM yang divalidasi berdasarkan skema untuk otomatisasi
summary: Tugas LLM khusus JSON untuk alur kerja (alat plugin opsional)
title: Tugas LLM
x-i18n:
    generated_at: "2026-07-12T14:44:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` adalah **alat Plugin opsional** bawaan yang menjalankan satu panggilan LLM khusus JSON dan mengembalikan keluaran terstruktur, yang secara opsional divalidasi terhadap JSON Schema. Alat ini menyediakan langkah LLM bagi mesin alur kerja seperti Lobster tanpa memerlukan kode OpenClaw khusus untuk setiap alur kerja.

## Mengaktifkan

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

2. Izinkan alat:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` menambahkan `llm-task` di atas profil alat aktif tanpa membatasi alat inti lainnya. Gunakan `tools.allow` hanya jika Anda menginginkan mode daftar izin yang restriktif.

## Konfigurasi (opsional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` adalah daftar izin berisi string `provider/model`; permintaan untuk model lain akan ditolak. Semua kunci lainnya merupakan nilai cadangan per panggilan yang digunakan ketika panggilan alat tidak menyertakan parameter tersebut.

## Parameter alat

| Parameter       | Jenis  | Catatan                                                                                                                                                        |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | Wajib. Instruksi tugas untuk LLM.                                                                                                                              |
| `input`         | any    | Muatan opsional; diserialisasi menjadi JSON dan ditambahkan ke perintah.                                                                                       |
| `schema`        | object | JSON Schema opsional yang harus dipenuhi oleh keluaran yang telah diuraikan.                                                                                   |
| `provider`      | string | Menggantikan `defaultProvider` / penyedia default agen.                                                                                                        |
| `model`         | string | Menggantikan `defaultModel`; menerima ID model biasa, alias, atau referensi `provider/model` (prefiks penyedia yang terduplikasi dihapus secara otomatis).     |
| `thinking`      | string | Tingkat penalaran (misalnya `low`, `medium`); harus termasuk tingkat yang didukung oleh model yang ditentukan.                                                  |
| `authProfileId` | string | Menggantikan `defaultAuthProfileId`.                                                                                                                           |
| `temperature`   | number | Upaya terbaik; tidak semua penyedia mendukungnya.                                                                                                              |
| `maxTokens`     | number | Batas upaya terbaik untuk token keluaran.                                                                                                                      |
| `timeoutMs`     | number | Batas waktu eksekusi; default `30000`.                                                                                                                         |

## Keluaran

Mengembalikan `details.json` (JSON yang telah diuraikan dan divalidasi terhadap skema), beserta `details.provider` dan `details.model` yang menunjukkan penyedia dan model yang benar-benar dijalankan.

## Contoh: langkah alur kerja Lobster

### Batasan penting

Contoh di bawah ini mengasumsikan bahwa **CLI Lobster mandiri** berjalan di lingkungan tempat `openclaw.invoke` telah memiliki konteks URL Gateway/autentikasi yang benar.

Untuk pelaksana Lobster **tertanam** bawaan di dalam OpenClaw, pola CLI bertingkat ini **saat ini belum andal**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Hingga Lobster tertanam memiliki jembatan yang didukung untuk alur ini, sebaiknya gunakan salah satu dari berikut:

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

- **Khusus JSON**: model diinstruksikan untuk hanya mengembalikan nilai JSON, tanpa pagar kode dan tanpa komentar.
- **Tanpa alat**: eksekusi yang mendasarinya menonaktifkan alat, sehingga model tidak dapat melakukan panggilan keluar di tengah tugas.
- Perlakukan keluaran sebagai tidak tepercaya kecuali Anda memvalidasinya menggunakan `schema`.
- Tempatkan persetujuan sebelum setiap langkah yang menimbulkan efek samping (mengirim, memposting, mengeksekusi) dan menggunakan keluaran ini.

## Terkait

- [Tingkat penalaran](/id/tools/thinking)
- [Subagen](/id/tools/subagents)
- [Perintah garis miring](/id/tools/slash-commands)
