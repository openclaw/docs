---
read_when:
    - Anda perlu memvalidasi perutean proksi yang dikelola operator sebelum penerapan
    - Anda perlu menangkap lalu lintas transport OpenClaw secara lokal untuk pemecahan masalah
    - Anda ingin memeriksa sesi proksi pengawakutuan, blob, atau prasetel kueri bawaan
summary: Referensi CLI untuk `openclaw proxy`, termasuk validasi proksi yang dikelola operator dan pemeriksa tangkapan proksi awakutu lokal
title: Proksi
x-i18n:
    generated_at: "2026-05-04T18:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092c4e946dcab5e78e37d6fc77bb067b7a649368f8571fa127e462a85fa14ce5
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validasi perutean proksi yang dikelola operator, atau jalankan proksi debug eksplisit lokal
dan periksa lalu lintas yang ditangkap.

Gunakan `validate` untuk melakukan preflight pada proksi maju yang dikelola operator sebelum mengaktifkan
perutean proksi OpenClaw. Perintah lainnya adalah alat debugging untuk
investigasi tingkat transport: alat tersebut dapat memulai proksi lokal, menjalankan perintah turunan
dengan penangkapan diaktifkan, mencantumkan sesi penangkapan, mengkueri pola lalu lintas umum, membaca
blob yang ditangkap, dan menghapus data penangkapan lokal.

## Perintah

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validasi

`openclaw proxy validate` memeriksa URL proksi efektif yang dikelola operator dari
`--proxy-url`, config, atau `OPENCLAW_PROXY_URL`. Perintah ini melaporkan masalah config ketika
tidak ada proksi yang diaktifkan dan dikonfigurasi; gunakan `--proxy-url` untuk preflight satu kali
sebelum mengubah config. Secara default, perintah ini memverifikasi bahwa tujuan publik berhasil
melalui proksi dan bahwa proksi tidak dapat menjangkau canary loopback sementara.
Tujuan khusus yang ditolak bersifat fail-closed: respons HTTP dan kegagalan
transport yang ambigu sama-sama gagal kecuali Anda dapat memverifikasi sinyal penolakan khusus deployment
secara terpisah. Tambahkan `--apns-reachable` untuk juga membuka tunnel APNs HTTP/2 CONNECT
melalui proksi dan mengonfirmasi bahwa sandbox APNs merespons; probe menggunakan token penyedia
yang sengaja tidak valid, sehingga respons APNs `403 InvalidProviderToken`
adalah sinyal keterjangkauan yang berhasil.

Opsi:

- `--json`: cetak JSON yang dapat dibaca mesin.
- `--proxy-url <url>`: validasi URL proksi ini, bukan config atau env.
- `--allowed-url <url>`: tambahkan tujuan yang diharapkan berhasil melalui proksi. Ulangi untuk memeriksa beberapa tujuan.
- `--denied-url <url>`: tambahkan tujuan yang diharapkan diblokir oleh proksi. Ulangi untuk memeriksa beberapa tujuan.
- `--apns-reachable`: juga verifikasi bahwa sandbox APNs HTTP/2 dapat dijangkau melalui proksi.
- `--apns-authority <url>`: otoritas APNs untuk diprobe dengan `--apns-reachable` (`https://api.sandbox.push.apple.com` secara default; produksi adalah `https://api.push.apple.com`).
- `--timeout-ms <ms>`: batas waktu per permintaan dalam milidetik.

Lihat [Proksi Jaringan](/id/security/network-proxy) untuk panduan deployment dan
semantik penolakan.

## Preset kueri

`openclaw proxy query --preset <name>` menerima:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Catatan

- `start` menggunakan default `127.0.0.1` kecuali `--host` ditetapkan.
- `run` memulai proksi debug lokal lalu menjalankan perintah setelah `--`.
- Penerusan upstream langsung milik proksi debug membuka soket upstream untuk diagnostik. Saat mode proksi terkelola OpenClaw aktif, penerusan langsung untuk permintaan proksi dan tunnel CONNECT dinonaktifkan secara default; tetapkan `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` hanya untuk diagnostik lokal yang disetujui.
- `validate` keluar dengan kode 1 saat config proksi atau pemeriksaan tujuan gagal.
- Tangkapan adalah data debugging lokal; gunakan `openclaw proxy purge` saat selesai.

## Terkait

- [Referensi CLI](/id/cli)
- [Proksi Jaringan](/id/security/network-proxy)
- [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth)
