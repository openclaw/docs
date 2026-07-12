---
read_when:
    - Anda ingin memeriksa kondisi Gateway yang sedang berjalan dengan cepat
summary: Referensi CLI untuk `openclaw health` (snapshot kesehatan Gateway melalui RPC)
title: Kesehatan
x-i18n:
    generated_at: "2026-07-12T14:04:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Ambil cuplikan kesehatan dari Gateway yang sedang berjalan melalui RPC WebSocket (tanpa soket saluran langsung dari CLI).

## Opsi

| Flag             | Default | Deskripsi                                                                                         |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `--json`         | `false` | Cetak JSON yang dapat dibaca mesin, bukan teks.                                                    |
| `--timeout <ms>` | `10000` | Batas waktu koneksi dalam milidetik.                                                               |
| `--verbose`      | `false` | Memaksa pemeriksaan langsung dan memperluas keluaran untuk semua akun dan agen yang dikonfigurasi. |
| `--debug`        | `false` | Alias untuk `--verbose`.                                                                           |

Contoh:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Perilaku

- Tanpa `--verbose`, Gateway dapat mengembalikan cuplikan yang disimpan dalam cache (tetap baru hingga 60 detik dan tidak berubah dari status runtime saluran langsung), lalu memperbaruinya di latar belakang untuk pemanggil berikutnya.
- `--verbose` memaksa pemeriksaan langsung (pemeriksaan akun per saluran), mencetak detail koneksi Gateway, dan memperluas keluaran yang dapat dibaca manusia untuk semua akun dan agen yang dikonfigurasi, bukan hanya agen default.
- `--json` selalu mengembalikan cuplikan lengkap: saluran, pemeriksaan per akun, status pemuatan plugin, status karantina mesin konteks, status cache harga model, kesehatan loop peristiwa, dan penyimpanan sesi per agen.

## Terkait

- [Referensi CLI](/id/cli)
- [`openclaw status`](/id/cli/status) — diagnosis lokal dan pemeriksaan saluran tanpa cuplikan kesehatan lengkap
- [Kesehatan Gateway](/id/gateway/health)
