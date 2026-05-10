---
read_when:
    - Anda ingin cepat memeriksa kesehatan Gateway yang sedang berjalan
summary: Referensi CLI untuk `openclaw health` (cuplikan kesehatan Gateway melalui RPC)
title: Kesehatan
x-i18n:
    generated_at: "2026-05-10T19:28:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Mengambil status kesehatan dari Gateway yang sedang berjalan.

## Opsi

| Flag             | Bawaan | Deskripsi                                                        |
| ---------------- | ------- | ------------------------------------------------------------------ |
| `--json`         | `false` | Mencetak JSON yang dapat dibaca mesin, bukan teks.                       |
| `--timeout <ms>` | `10000` | Tenggat waktu koneksi dalam milidetik.                                |
| `--verbose`      | `false` | Pencatatan log verbose. Memaksa probe langsung dan memperluas output per agen. |
| `--debug`        | `false` | Alias untuk `--verbose`.                                             |

Contoh:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Catatan:

- `openclaw health` bawaan meminta snapshot kesehatan dari gateway yang sedang berjalan. Ketika
  gateway sudah memiliki snapshot cache yang masih segar, perintah ini dapat mengembalikan payload cache tersebut dan
  menyegarkan di latar belakang.
- `--verbose` memaksa probe langsung, mencetak detail koneksi gateway, dan memperluas
  output yang dapat dibaca manusia di semua akun dan agen yang dikonfigurasi.
- Output mencakup penyimpanan sesi per agen ketika beberapa agen dikonfigurasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Kesehatan Gateway](/id/gateway/health)
