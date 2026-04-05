---
read_when:
    - Anda ingin menggunakan model Grok di OpenClaw
    - Anda sedang mengonfigurasi auth xAI atau id model
summary: Gunakan model Grok xAI di OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-05T14:04:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d11f27b48c69eed6324595977bca3506c7709424eef64cc73899f8d049148b82
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw menyertakan plugin provider `xai` bawaan untuk model Grok.

## Setup

1. Buat API key di konsol xAI.
2. Setel `XAI_API_KEY`, atau jalankan:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Pilih model seperti:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw sekarang menggunakan xAI Responses API sebagai transport xAI bawaan. `XAI_API_KEY`
yang sama juga dapat digunakan untuk `web_search` berbasis Grok, `x_search`
kelas satu, dan `code_execution` jarak jauh.
Jika Anda menyimpan kunci xAI di bawah `plugins.entries.xai.config.webSearch.apiKey`,
provider model xAI bawaan sekarang juga menggunakan ulang kunci itu sebagai fallback.
Penyesuaian `code_execution` ada di bawah `plugins.entries.xai.config.codeExecution`.

## Katalog model bawaan saat ini

OpenClaw sekarang menyertakan family model xAI berikut secara bawaan:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Plugin ini juga meneruskan resolusi id `grok-4*` dan `grok-code-fast*` yang lebih baru saat
mengikuti bentuk API yang sama.

Catatan model cepat:

- `grok-4-fast`, `grok-4-1-fast`, dan varian `grok-4.20-beta-*` adalah
  ref Grok yang saat ini mendukung gambar dalam katalog bawaan.
- `/fast on` atau `agents.defaults.models["xai/<model>"].params.fastMode: true`
  menulis ulang permintaan xAI native sebagai berikut:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Alias kompatibilitas lama masih dinormalisasi ke id bawaan kanonis. Sebagai
contoh:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Pencarian web

Provider pencarian web `grok` bawaan juga menggunakan `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Batasan yang diketahui

- Auth saat ini hanya API key. Belum ada alur OAuth/device-code xAI di OpenClaw.
- `grok-4.20-multi-agent-experimental-beta-0304` tidak didukung pada jalur provider xAI normal karena memerlukan permukaan API upstream yang berbeda dari transport xAI OpenClaw standar.

## Catatan

- OpenClaw menerapkan perbaikan kompatibilitas tool-schema dan tool-call khusus xAI secara otomatis pada jalur runner bersama.
- Permintaan xAI native secara default menggunakan `tool_stream: true`. Setel
  `agents.defaults.models["xai/<model>"].params.tool_stream` ke `false` untuk
  menonaktifkannya.
- Wrapper xAI bawaan menghapus flag strict tool-schema yang tidak didukung dan
  kunci payload reasoning sebelum mengirim permintaan xAI native.
- `web_search`, `x_search`, dan `code_execution` diekspos sebagai tool OpenClaw. OpenClaw mengaktifkan built-in xAI spesifik yang dibutuhkannya di dalam setiap permintaan tool alih-alih melampirkan semua tool native ke setiap giliran chat.
- `x_search` dan `code_execution` dimiliki oleh plugin xAI bawaan, bukan di-hardcode ke runtime model inti.
- `code_execution` adalah eksekusi sandbox xAI jarak jauh, bukan [`exec`](/tools/exec) lokal.
- Untuk ikhtisar provider yang lebih luas, lihat [Model providers](/providers/index).
