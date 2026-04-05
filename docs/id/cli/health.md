---
read_when:
    - Anda ingin cepat memeriksa kesehatan Gateway yang sedang berjalan
summary: Referensi CLI untuk `openclaw health` (snapshot kesehatan gateway melalui RPC)
title: health
x-i18n:
    generated_at: "2026-04-05T13:45:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Ambil status kesehatan dari Gateway yang sedang berjalan.

Opsi:

- `--json`: output yang dapat dibaca mesin
- `--timeout <ms>`: timeout koneksi dalam milidetik (default `10000`)
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
  gateway sudah memiliki snapshot cache yang masih baru, gateway dapat mengembalikan payload cache tersebut dan
  melakukan refresh di latar belakang.
- `--verbose` memaksa probe live, mencetak detail koneksi gateway, dan memperluas
  output yang dapat dibaca manusia ke semua akun dan agen yang dikonfigurasi.
- Output menyertakan penyimpanan sesi per agen saat beberapa agen dikonfigurasi.
