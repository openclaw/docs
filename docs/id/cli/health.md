---
read_when:
    - Anda ingin memeriksa kesehatan Gateway yang sedang berjalan dengan cepat
summary: Referensi CLI untuk `openclaw health` (snapshot kesehatan Gateway melalui RPC)
title: Kesehatan
x-i18n:
    generated_at: "2026-07-19T04:51:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51cc0e3dd61af3e6fa460dd646bfa1c3e5bd1a52da860eac26c12101151d081d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Ambil snapshot kesehatan dari Gateway yang sedang berjalan melalui RPC WebSocket (tanpa soket saluran langsung dari CLI).

## Opsi

| Flag             | Default | Deskripsi                                                                       |
| ---------------- | ------- | --------------------------------------------------------------------------------- |
| `--json`         | `false` | Cetak JSON yang dapat dibaca mesin alih-alih teks.                                      |
| `--timeout <ms>` | `10000` | Batas waktu koneksi dalam milidetik.                                               |
| `--verbose`      | `false` | Memaksa pemeriksaan langsung dan memperluas output ke semua akun dan agen yang dikonfigurasi. |
| `--debug`        | `false` | Alias untuk `--verbose`.                                                            |

Contoh:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Perilaku

- Tanpa `--verbose`, Gateway dapat mengembalikan snapshot yang di-cache (tetap baru hingga 60 detik dan tidak berubah dari status runtime saluran langsung) serta memperbaruinya di latar belakang untuk pemanggil berikutnya.
- `--verbose` memaksa pemeriksaan langsung (pemeriksaan akun per saluran), mencetak detail koneksi Gateway, dan memperluas output yang dapat dibaca manusia ke semua akun dan agen yang dikonfigurasi, bukan hanya agen default.
- `--json` selalu mengembalikan snapshot lengkap: saluran, pemeriksaan per akun, status pemuatan plugin, status karantina mesin konteks, status cache harga model, kesehatan perulangan peristiwa, surat gagal antrean pengiriman, dan penyimpanan sesi per agen.
- Ketika pengiriman keluar atau peristiwa saluran masuk dimasukkan ke antrean surat gagal, output teks melaporkan jumlahnya dan usia kegagalan tertua. Jumlah masuk dikelompokkan berdasarkan akun saluran; periksa atau pulihkan peristiwa individual dengan [`openclaw channels dead-letters`](/id/cli/channels#inbound-dead-letters).

## Terkait

- [Referensi CLI](/id/cli)
- [`openclaw status`](/id/cli/status) — diagnosis lokal dan pemeriksaan saluran tanpa snapshot kesehatan lengkap
- [Kesehatan Gateway](/id/gateway/health)
