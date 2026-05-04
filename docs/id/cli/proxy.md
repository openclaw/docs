---
read_when:
    - Anda perlu memvalidasi perutean proxy yang dikelola operator sebelum penerapan
    - Anda perlu menangkap lalu lintas transport OpenClaw secara lokal untuk pemecahan masalah
    - Anda ingin memeriksa sesi proksi debug, blob, atau preset kueri bawaan
summary: Referensi CLI untuk `openclaw proxy`, termasuk validasi proxy yang dikelola operator dan pemeriksa tangkapan proxy debug lokal
title: Proksi
x-i18n:
    generated_at: "2026-05-04T07:02:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9589bedafb97c31bcb6536a04307cd0c6550e1f307693bd4401785d79f34a1eb
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validasi perutean proxy yang dikelola operator, atau jalankan proxy debug eksplisit lokal
dan periksa lalu lintas yang ditangkap.

Gunakan `validate` untuk melakukan preflight pada proxy forward yang dikelola operator sebelum mengaktifkan
perutean proxy OpenClaw. Perintah lainnya adalah alat debug untuk
investigasi tingkat transport: alat tersebut dapat memulai proxy lokal, menjalankan perintah turunan
dengan penangkapan diaktifkan, mencantumkan sesi penangkapan, mengkueri pola lalu lintas umum, membaca
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

`openclaw proxy validate` memeriksa URL proxy yang dikelola operator yang efektif dari
`--proxy-url`, konfigurasi, atau `OPENCLAW_PROXY_URL`. Perintah ini melaporkan masalah konfigurasi ketika
tidak ada proxy yang diaktifkan dan dikonfigurasi; gunakan `--proxy-url` untuk preflight sekali jalan
sebelum mengubah konfigurasi. Secara default, perintah ini memverifikasi bahwa tujuan publik berhasil
melalui proxy dan bahwa proxy tidak dapat menjangkau canary loopback sementara.
Tujuan khusus yang ditolak bersifat fail-closed: respons HTTP dan kegagalan
transport yang ambigu sama-sama gagal kecuali Anda dapat memverifikasi sinyal penolakan khusus deployment
secara terpisah.

Opsi:

- `--json`: cetak JSON yang dapat dibaca mesin.
- `--proxy-url <url>`: validasi URL proxy ini alih-alih konfigurasi atau env.
- `--allowed-url <url>`: tambahkan tujuan yang diharapkan berhasil melalui proxy. Ulangi untuk memeriksa beberapa tujuan.
- `--denied-url <url>`: tambahkan tujuan yang diharapkan diblokir oleh proxy. Ulangi untuk memeriksa beberapa tujuan.
- `--timeout-ms <ms>`: batas waktu per permintaan dalam milidetik.

Lihat [Proxy Jaringan](/id/security/network-proxy) untuk panduan deployment dan semantik
penolakan.

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
- `run` memulai proxy debug lokal lalu menjalankan perintah setelah `--`.
- Penerusan upstream langsung milik proxy debug membuka soket upstream untuk diagnostik. Ketika mode proxy terkelola OpenClaw aktif, penerusan langsung untuk permintaan proxy dan tunnel CONNECT dinonaktifkan secara default; tetapkan `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` hanya untuk diagnostik lokal yang disetujui.
- `validate` keluar dengan kode 1 ketika konfigurasi proxy atau pemeriksaan tujuan gagal.
- Penangkapan adalah data debug lokal; gunakan `openclaw proxy purge` setelah selesai.

## Terkait

- [Referensi CLI](/id/cli)
- [Proxy Jaringan](/id/security/network-proxy)
- [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth)
