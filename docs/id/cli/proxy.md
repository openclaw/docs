---
read_when:
    - Anda perlu memvalidasi perutean proksi yang dikelola operator sebelum penerapan
    - Anda perlu menangkap lalu lintas transport OpenClaw secara lokal untuk proses debug
    - Anda ingin memeriksa sesi proksi debug, blob, atau preset kueri bawaan
summary: Referensi CLI untuk `openclaw proxy`, termasuk validasi proksi yang dikelola operator dan pemeriksa tangkapan proksi debug lokal
title: Proksi
x-i18n:
    generated_at: "2026-07-12T14:06:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validasi perutean proksi yang dikelola operator, atau jalankan proksi debug eksplisit lokal dan periksa lalu lintas yang ditangkap.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` melakukan pemeriksaan awal terhadap proksi penerusan yang dikelola operator. Perintah lainnya merupakan alat debug untuk investigasi tingkat transport: memulai proksi penangkap lokal, menjalankan perintah anak melaluinya, mencantumkan sesi penangkapan, mengkueri pola lalu lintas, membaca blob yang ditangkap, dan menghapus data penangkapan lokal.

## Validasi

Memeriksa URL proksi efektif yang dikelola operator dari `--proxy-url`, konfigurasi (`proxy.proxyUrl`), atau `OPENCLAW_PROXY_URL`, sesuai urutan prioritas tersebut. Melaporkan masalah konfigurasi jika tidak ada proksi yang diaktifkan dan dikonfigurasi; teruskan `--proxy-url` untuk pemeriksaan awal sekali pakai tanpa mengubah konfigurasi.

URL proksi terkelola menggunakan `http://` untuk listener proksi penerusan biasa, atau `https://` ketika OpenClaw harus membuka TLS ke titik akhir proksi itu sendiri sebelum mengirim permintaan proksi. Gunakan `--proxy-ca-file` untuk memercayai CA privat bagi koneksi TLS tersebut.

Secara default, perintah ini menjalankan:

- satu pemeriksaan **diizinkan** terhadap `https://example.com/` (timpa/tambahkan dengan `--allowed-url`, dapat diulang)
- satu pemeriksaan **ditolak** terhadap canary loopback sementara (timpa dengan `--denied-url`, dapat diulang)

Target `--denied-url` khusus bersifat gagal-tertutup: baik respons HTTP maupun kegagalan transport yang ambigu dianggap sebagai kegagalan, kecuali Anda dapat memverifikasi secara independen sinyal penolakan khusus deployment. Canary loopback bawaan adalah satu-satunya target yang menganggap kesalahan transport sebagai bukti pemblokiran.

Tambahkan `--apns-reachable` untuk turut membuka tunnel CONNECT HTTP/2 APNs melalui proksi dan mengonfirmasi bahwa APNs sandbox merespons. Probe mengirim token penyedia yang sengaja dibuat tidak valid, sehingga respons APNs `403 InvalidProviderToken` dianggap sebagai sinyal keterjangkauan yang berhasil (bukan kegagalan).

### Opsi

| Flag                     | Efek                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | mencetak JSON yang dapat dibaca mesin                                                                                           |
| `--proxy-url <url>`      | memvalidasi URL proksi `http://`/`https://` ini, bukan konfigurasi atau variabel lingkungan                                      |
| `--proxy-ca-file <path>` | memercayai berkas CA PEM ini untuk verifikasi TLS terhadap titik akhir proksi HTTPS                                              |
| `--allowed-url <url>`    | tujuan yang diharapkan berhasil melalui proksi (dapat diulang)                                                                  |
| `--denied-url <url>`     | tujuan yang diharapkan diblokir oleh proksi (dapat diulang)                                                                     |
| `--apns-reachable`       | turut memverifikasi bahwa HTTP/2 APNs sandbox dapat dijangkau melalui proksi                                                     |
| `--apns-authority <url>` | otoritas APNs yang akan diperiksa (default `https://api.sandbox.push.apple.com`; produksi adalah `https://api.push.apple.com`)   |
| `--timeout-ms <ms>`      | batas waktu per permintaan                                                                                                      |

Keluar dengan kode 1 ketika konfigurasi proksi atau pemeriksaan tujuan gagal.

Lihat [Proksi Jaringan](/id/security/network-proxy) untuk panduan deployment dan semantik penolakan.

## Proksi debug

`start` meluncurkan proksi penangkap lokal dan mencetak URL, jalur sertifikat CA, serta jalur basis data penangkapannya; hentikan dengan Ctrl+C. Secara default mengikat ke `127.0.0.1`, kecuali `--host` ditetapkan.

`run` memulai proksi debug lokal, lalu menjalankan `<cmd...>` (setelah `--`) dengan variabel lingkungan proksi diterapkan, dalam sesi penangkapannya sendiri.

Penerusan upstream langsung milik proksi debug membuka soket upstream untuk diagnostik. Ketika mode proksi terkelola OpenClaw aktif, penerusan langsung untuk permintaan proksi dan tunnel CONNECT dinonaktifkan secara default; tetapkan `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` hanya untuk diagnostik lokal yang disetujui.

`coverage` mencetak laporan JSON (`summary` + `entries` per transport) mengenai transport mana yang ditangkap, hanya melalui proksi, atau tidak tercakup.

`sessions` mencantumkan sesi penangkapan terbaru (`--limit`, default 20).

`query --preset <name>` menjalankan kueri bawaan terhadap lalu lintas yang ditangkap, dengan cakupan opsional ke `--session <id>`. Preset:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` mencetak konten mentah blob muatan yang ditangkap.

`purge` menghapus semua metadata dan blob lalu lintas yang ditangkap. Hasil penangkapan merupakan data debug lokal; hapus setelah selesai.

## Terkait

- [Referensi CLI](/id/cli)
- [Proksi Jaringan](/id/security/network-proxy)
- [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth)
