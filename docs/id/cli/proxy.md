---
read_when:
    - Anda perlu memvalidasi perutean proksi yang dikelola operator sebelum penerapan
    - Anda perlu menangkap lalu lintas transport OpenClaw secara lokal untuk penelusuran kesalahan
    - Anda ingin memeriksa sesi proksi awakutu, blob, atau preset kueri bawaan
summary: Referensi CLI untuk `openclaw proxy`, termasuk validasi proxy yang dikelola operator dan pemeriksa tangkapan proxy debug lokal
title: Proksi
x-i18n:
    generated_at: "2026-05-01T09:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validasi perutean proksi yang dikelola operator, atau jalankan proksi debug eksplisit lokal
dan periksa lalu lintas yang ditangkap.

Gunakan `validate` untuk melakukan preflight pada proksi penerusan yang dikelola operator sebelum mengaktifkan
perutean proksi OpenClaw. Perintah lainnya adalah alat debugging untuk
investigasi tingkat transport: perintah tersebut dapat memulai proksi lokal, menjalankan perintah anak
dengan penangkapan diaktifkan, mencantumkan sesi penangkapan, membuat kueri pola lalu lintas umum, membaca
blob yang ditangkap, dan membersihkan data penangkapan lokal.

## Perintah

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validasi

`openclaw proxy validate` memeriksa URL proksi efektif yang dikelola operator dari
`--proxy-url`, konfigurasi, atau `OPENCLAW_PROXY_URL`. Perintah ini melaporkan masalah konfigurasi ketika
tidak ada proksi yang diaktifkan dan dikonfigurasi; gunakan `--proxy-url` untuk preflight sekali pakai
sebelum mengubah konfigurasi. Secara default, perintah ini memverifikasi bahwa tujuan publik berhasil
melalui proksi dan bahwa proksi tidak dapat menjangkau canary loopback sementara.
Tujuan ditolak kustom bersifat gagal-tertutup: respons HTTP dan kegagalan
transport yang ambigu sama-sama gagal kecuali Anda dapat memverifikasi sinyal penolakan khusus deployment
secara terpisah.

Opsi:

- `--json`: cetak JSON yang dapat dibaca mesin.
- `--proxy-url <url>`: validasi URL proksi ini alih-alih konfigurasi atau env.
- `--allowed-url <url>`: tambahkan tujuan yang diharapkan berhasil melalui proksi. Ulangi untuk memeriksa beberapa tujuan.
- `--denied-url <url>`: tambahkan tujuan yang diharapkan diblokir oleh proksi. Ulangi untuk memeriksa beberapa tujuan.
- `--timeout-ms <ms>`: batas waktu per permintaan dalam milidetik.

Lihat [Proksi Jaringan](/id/security/network-proxy) untuk panduan deployment dan semantik penolakan.

## Preset kueri

`openclaw proxy query --preset <name>` menerima:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Catatan

- `start` default ke `127.0.0.1` kecuali `--host` ditetapkan.
- `run` memulai proksi debug lokal lalu menjalankan perintah setelah `--`.
- `validate` keluar dengan kode 1 ketika konfigurasi proksi atau pemeriksaan tujuan gagal.
- Penangkapan adalah data debugging lokal; gunakan `openclaw proxy purge` setelah selesai.

## Terkait

- [Referensi CLI](/id/cli)
- [Proksi Jaringan](/id/security/network-proxy)
- [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth)
