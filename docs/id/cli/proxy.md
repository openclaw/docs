---
read_when:
    - Anda perlu memvalidasi perutean proxy yang dikelola operator sebelum deployment
    - Anda perlu menangkap lalu lintas transportasi OpenClaw secara lokal untuk pemecahan masalah
    - Anda ingin memeriksa sesi proksi debug, blob, atau preset kueri bawaan
summary: Referensi CLI untuk `openclaw proxy`, termasuk validasi proxy yang dikelola operator dan pemeriksa tangkapan proxy debug lokal
title: Proksi
x-i18n:
    generated_at: "2026-06-27T17:20:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validasi perutean proxy yang dikelola operator, atau jalankan proxy debug eksplisit lokal
dan periksa lalu lintas yang ditangkap.

Gunakan `validate` untuk memeriksa awal proxy penerus yang dikelola operator sebelum mengaktifkan
perutean proxy OpenClaw. Perintah lainnya adalah alat debugging untuk
investigasi tingkat transport: perintah tersebut dapat memulai proxy lokal, menjalankan perintah anak
dengan penangkapan diaktifkan, mencantumkan sesi penangkapan, membuat kueri pola lalu lintas umum, membaca
blob yang ditangkap, dan menghapus data penangkapan lokal.

## Perintah

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validasi

`openclaw proxy validate` memeriksa URL proxy efektif yang dikelola operator dari
`--proxy-url`, konfigurasi, atau `OPENCLAW_PROXY_URL`. URL proxy terkelola dapat menggunakan
`http://` untuk listener proxy penerus biasa atau `https://` ketika OpenClaw harus
membuka TLS ke endpoint proxy sebelum mengirim permintaan proxy. Ini melaporkan
masalah konfigurasi ketika tidak ada proxy yang diaktifkan dan dikonfigurasi; gunakan `--proxy-url` untuk
pemeriksaan awal sekali pakai sebelum mengubah konfigurasi. Tambahkan `--proxy-ca-file` untuk memercayai
CA privat untuk koneksi TLS ke endpoint proxy HTTPS. Secara default, ini
memverifikasi bahwa tujuan publik berhasil melalui proxy dan bahwa proxy
tidak dapat menjangkau kanari loopback sementara. Tujuan ditolak kustom bersifat
gagal-tertutup: respons HTTP dan kegagalan transport ambigu sama-sama gagal kecuali
Anda dapat memverifikasi sinyal penolakan khusus deployment secara terpisah. Tambahkan
`--apns-reachable` untuk juga membuka tunnel CONNECT HTTP/2 APNs melalui proxy
dan mengonfirmasi APNs sandbox merespons; probe menggunakan token penyedia yang sengaja tidak valid,
sehingga respons APNs `403 InvalidProviderToken` adalah sinyal keterjangkauan yang berhasil.

Opsi:

- `--json`: cetak JSON yang dapat dibaca mesin.
- `--proxy-url <url>`: validasi URL proxy `http://` atau `https://` ini alih-alih konfigurasi atau env.
- `--proxy-ca-file <path>`: percayai file CA PEM ini untuk verifikasi TLS endpoint proxy HTTPS.
- `--allowed-url <url>`: tambahkan tujuan yang diharapkan berhasil melalui proxy. Ulangi untuk memeriksa beberapa tujuan.
- `--denied-url <url>`: tambahkan tujuan yang diharapkan diblokir oleh proxy. Ulangi untuk memeriksa beberapa tujuan.
- `--apns-reachable`: verifikasi juga bahwa HTTP/2 APNs sandbox dapat dijangkau melalui proxy.
- `--apns-authority <url>`: otoritas APNs untuk diprobe dengan `--apns-reachable` (`https://api.sandbox.push.apple.com` secara default; produksi adalah `https://api.push.apple.com`).
- `--timeout-ms <ms>`: batas waktu per permintaan dalam milidetik.

Lihat [Proxy Jaringan](/id/security/network-proxy) untuk panduan deployment dan semantik penolakan.

## Preset kueri

`openclaw proxy query --preset <name>` menerima:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Catatan

- `start` secara default menggunakan `127.0.0.1` kecuali `--host` disetel.
- `run` memulai proxy debug lokal lalu menjalankan perintah setelah `--`.
- Penerusan upstream langsung proxy debug membuka soket upstream untuk diagnostik. Ketika mode proxy terkelola OpenClaw aktif, penerusan langsung untuk permintaan proxy dan tunnel CONNECT dinonaktifkan secara default; setel `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` hanya untuk diagnostik lokal yang disetujui.
- `validate` keluar dengan kode 1 ketika konfigurasi proxy atau pemeriksaan tujuan gagal.
- Penangkapan adalah data debugging lokal; gunakan `openclaw proxy purge` setelah selesai.

## Terkait

- [Referensi CLI](/id/cli)
- [Proxy Jaringan](/id/security/network-proxy)
- [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth)
