---
read_when:
    - Anda ingin memeriksa kesehatan Gateway yang sedang berjalan dengan cepat
summary: Referensi CLI untuk `openclaw health` (snapshot kesehatan Gateway melalui RPC)
title: Kesehatan
x-i18n:
    generated_at: "2026-05-06T09:04:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Ambil status kesehatan dari Gateway yang sedang berjalan.

Opsi:

- `--json`: keluaran yang dapat dibaca mesin
- `--timeout <ms>`: tenggat waktu koneksi dalam milidetik (default `10000`)
- `--verbose`: pencatatan log mendetail
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

- Default `openclaw health` meminta snapshot kesehatan dari Gateway yang sedang berjalan. Ketika
  Gateway sudah memiliki snapshot cache yang masih segar, Gateway dapat mengembalikan payload cache tersebut dan
  melakukan penyegaran di latar belakang.
- `--verbose` memaksa probe langsung, mencetak detail koneksi Gateway, dan memperluas
  keluaran yang dapat dibaca manusia di semua akun dan agen yang dikonfigurasi.
- Keluaran menyertakan penyimpanan sesi per agen ketika beberapa agen dikonfigurasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Kesehatan Gateway](/id/gateway/health)
