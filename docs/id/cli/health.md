---
read_when:
    - Anda ingin dengan cepat memeriksa kesehatan Gateway yang sedang berjalan
summary: Referensi CLI untuk `openclaw health` (snapshot kesehatan gateway melalui RPC)
title: Kesehatan
x-i18n:
    generated_at: "2026-04-24T09:01:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Ambil status kesehatan dari Gateway yang sedang berjalan.

Opsi:

- `--json`: output yang dapat dibaca mesin
- `--timeout <ms>`: batas waktu koneksi dalam milidetik (default `10000`)
- `--verbose`: logging verbose
- `--debug`: alias untuk `--verbose`

Contoh:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Catatan:

- `openclaw health` default meminta snapshot kesehatan dari gateway yang sedang berjalan. Saat
  gateway sudah memiliki snapshot cache yang masih segar, gateway dapat mengembalikan payload cache tersebut dan
  menyegarkan di latar belakang.
- `--verbose` memaksa probe langsung, mencetak detail koneksi gateway, dan memperluas
  output yang dapat dibaca manusia ke semua akun dan agen yang dikonfigurasi.
- Output mencakup penyimpanan sesi per agen saat beberapa agen dikonfigurasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Kesehatan Gateway](/id/gateway/health)
