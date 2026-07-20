---
read_when:
    - Anda sedang membangun aplikasi eksternal, skrip, dasbor, tugas CI, atau ekstensi IDE yang berkomunikasi dengan OpenClaw
    - Anda sedang memilih antara RPC Gateway dan SDK Plugin
    - Anda berintegrasi dengan proses agen Gateway, sesi, peristiwa, persetujuan, model, atau alat
    - Anda memasangkan pengontrol hosting dengan penjadwal pengaktifan eksternal
sidebarTitle: External apps
summary: Jalur integrasi saat ini untuk aplikasi eksternal, skrip, dasbor, tugas CI, dan ekstensi IDE
title: Integrasi Gateway untuk aplikasi eksternal
x-i18n:
    generated_at: "2026-07-20T14:05:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 276c6f4173197683a60770327e131e6ab2fa4d33f416ba96c170539df7246f83
    source_path: gateway/external-apps.md
    workflow: 16
---

Aplikasi eksternal berkomunikasi dengan OpenClaw melalui protokol Gateway: transportasi
WebSocket beserta metode RPC. Gunakan saat skrip, dasbor, tugas CI, ekstensi IDE,
atau proses lain ingin memulai eksekusi agen, mengalirkan peristiwa, menunggu
hasil, membatalkan pekerjaan, atau memeriksa sumber daya Gateway.

<Note>
  Untuk paket npm, pemasangan perangkat, pemulihan koneksi ulang, riwayat, langganan,
  dan persetujuan, mulailah dengan
  [Membangun klien Gateway](https://docs.openclaw.ai/gateway/clients). Jika
  aplikasi Anda mengawasi Gateway sebagai proses anak, baca juga
  [Menyematkan OpenClaw](https://docs.openclaw.ai/gateway/embedding). Selama
  peluncuran awal paket, npm mungkin mengembalikan `E404` hingga rilis OpenClaw
  pertama yang menyertakan paket diterbitkan.
</Note>

<Note>
  Halaman ini ditujukan untuk kode di luar proses OpenClaw. Kode Plugin yang berjalan
  di dalam OpenClaw sebaiknya menggunakan subjalur `openclaw/plugin-sdk/*` yang terdokumentasi.
</Note>

## Yang tersedia saat ini

| Permukaan                                                        | Status         | Kegunaan                                                                                          |
| ---------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| [Panduan klien Gateway](https://docs.openclaw.ai/gateway/clients) | Siklus rilis   | Paket npm, autentikasi, koneksi ulang, riwayat, peristiwa, persetujuan, dan kebijakan versi.      |
| [Panduan penyematan](https://docs.openclaw.ai/gateway/embedding) | Siklus rilis   | Lingkungan proses anak, kesiapan, siklus hidup, pemulihan, kepemilikan RPC, dan pengemasan.       |
| [Protokol Gateway](/id/gateway/protocol)                            | Siap           | Transportasi WebSocket, jabat tangan koneksi, cakupan autentikasi, penentuan versi protokol, dan peristiwa. |
| [Referensi RPC Gateway](/id/reference/rpc)                          | Siap           | Metode Gateway saat ini untuk agen, sesi, tugas, model, alat, artefak, dan persetujuan.           |
| [`openclaw agent`](/id/cli/agent)                                 | Siap           | Integrasi skrip sekali jalan ketika menjalankan CLI melalui shell sudah memadai.                  |
| [`openclaw message`](/id/cli/message)                               | Siap           | Mengirim pesan atau tindakan saluran dari skrip.                                                  |

## Jalur yang disarankan

1. Jalankan atau temukan Gateway.
2. Hubungkan melalui [protokol Gateway](/id/gateway/protocol).
3. Panggil metode RPC yang terdokumentasi dari [referensi RPC Gateway](/id/reference/rpc).
4. Tetapkan versi OpenClaw yang Anda uji.
5. Periksa kembali referensi RPC saat meningkatkan OpenClaw.

Untuk eksekusi agen, mulailah dengan RPC `agent` dan pasangkan dengan `agent.wait` untuk
hasil terminal. Untuk status percakapan yang persisten, gunakan metode `sessions.*`.
Untuk integrasi UI, berlanggananlah ke peristiwa Gateway dan render hanya
kelompok peristiwa yang dipahami aplikasi Anda.

## Penangguhan host kooperatif

Pengontrol hosting yang membekukan atau membuat snapshot proses yang sedang berjalan dapat menggunakan
jabat tangan penangguhan yang netral terhadap host:

1. Hentikan penerimaan ingress eksternal yang dikendalikan oleh host.
2. Panggil `gateway.suspend.prepare` dengan `requestId` yang stabil dan unik.
3. Jika responsnya adalah `busy`, biarkan proses tetap berjalan dan coba lagi nanti.
4. Jika responsnya adalah `ready`, simpan `suspensionId` yang dikembalikan, lalu bekukan atau buat snapshot
   proses sebelum `expiresAtMs`.
5. Setelah pencairan, atau jika penangguhan dibatalkan, panggil `gateway.suspend.resume`
   dengan `suspensionId` tersebut melalui WebSocket yang ada atau jalur kontrol Admin HTTP.

Gateway yang telah disiapkan menolak jabat tangan WebSocket baru. Pengontrol WebSocket
harus menjaga koneksi terautentikasinya tetap terbuka selama operasi host. Jika hal itu
tidak dapat dijamin, aktifkan dan gunakan
[Plugin RPC Admin HTTP](/id/plugins/admin-http-rpc) sebelum melakukan persiapan. Jika
jalur kontrol terputus, tunggu hingga sewa dua menit berakhir sebelum
menghubungkan kembali; berakhirnya sewa secara otomatis membuka kembali penerimaan.

Kontrak RPC-nya adalah:

- `gateway.suspend.prepare` — `operator.admin`; parameter
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; parameter
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; parameter
  `{ "suspensionId": "id-from-prepare" }`

ID dipangkas, harus memuat karakter selain spasi, dan dibatasi hingga
128 karakter. Hasil persiapan sibuk memiliki `status: "busy"`, `reason`,
`retryAfterMs`, `activeCount`, dan `blockers`. Hasil siap memiliki bentuk berikut:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

Status mengembalikan `{"status":"running"}` atau hasil siap dengan `expiresAtMs`.
Pelanjutan mengembalikan `{"ok":true,"status":"running","resumed":true}`; mengulanginya
setelah pelanjutan berhasil akan mengembalikan `resumed: false`.

ID permintaan yang bersaing atau kegagalan sementara pelanjutan penjadwal mengembalikan
`UNAVAILABLE` yang dapat dicoba ulang dengan `retryAfterMs`. Selama pemulihan penjadwal, persiapan, status,
dan pelanjutan semuanya mengembalikan galat tersebut, Gateway tetap tidak siap dan
tertutup saat gagal, serta host tidak boleh membekukan atau membuat snapshot-nya. OpenClaw mencoba kembali
penjadwal secara otomatis dan hanya membuka kembali penerimaan setelah pemulihan berhasil. ID
pelanjutan yang tidak cocok mengembalikan `INVALID_REQUEST`. Persiapan berbagi anggaran penulisan bidang kontrol Gateway
sebanyak tiga upaya per menit; patuhi waktu tunda percobaan ulang yang dikembalikan.
Klien WebSocket dikelompokkan berdasarkan perangkat dan IP. Pengontrol Admin HTTP
dikelompokkan berdasarkan IP klien yang diresolusikan, sehingga pengontrol di belakang satu
proksi dapat berbagi anggaran.

Persiapan hanya bersifat menolak: OpenClaw menutup penerimaan root/sesi/perintah baru,
menjeda tick cron otomatis, dan memeriksa pekerjaan secara sinkron. Jika ada sesuatu yang
aktif, OpenClaw melanjutkan penjadwal dan membuka kembali penerimaan sebelum mengembalikan
`busy`; OpenClaw tidak menginterupsi atau menguras pekerjaan tersebut. Sewa siap berlangsung selama dua
menit. Mengulangi `prepare` dengan `requestId` yang sama memperbaruinya; berakhirnya sewa melanjutkan
penjadwal sebelum membuka kembali penerimaan.
Emisi mulai ulang yang jatuh tempo selama sewa siap menunggu hingga sewa
dilanjutkan; mulai ulang yang sedang berlangsung menyebabkan persiapan mengembalikan `busy`.

Selagi siap, `/healthz` tetap aktif dan `/readyz` mengembalikan `503`. Respons kesiapan
lokal atau terautentikasi menyertakan `gateway-draining`; probe jarak jauh yang tidak terautentikasi
hanya menerima `{ "ready": false }`. Probe kesehatan HTTP,
metode penangguhan pada koneksi WebSocket yang ada, dan rute RPC Admin HTTP
yang sudah diaktifkan tetap tersedia. RPC lainnya mengembalikan
`UNAVAILABLE` yang dapat dicoba ulang. Rute pekerjaan pengguna HTTP bawaan dan rute HTTP Plugin biasa,
termasuk API yang kompatibel dengan OpenAI, operasi alat/sesi, pemantauan node, serta
hook yang dikonfigurasi, mengembalikan `503` dengan `error.code: "gateway_unavailable"`. Upgrade
WebSocket baru milik Plugin juga mengembalikan `503`; ini mencakup kepemilikan
upgrade, bukan pekerjaan yang kemudian dilakukan melalui soket Plugin yang telah tersambung.

Jabat tangan ini tidak mempertahankan pesan masuk, menghentikan transportasi saluran
pihak ketiga, atau mengendalikan platform hosting. Host harus membatasi ingress-nya
sebelum persiapan dan tetap bertanggung jawab atas membangunkan, snapshot/pembekuan, dan
penghentian. `activeCount` adalah jumlah agregat pekerjaan yang dilacak, sedangkan `blockers`
memuat jumlah kategori bukan nol dan detail tugas yang dibatasi. Ini bukan
penghalang ketenangan proses umum. Pemblokir `background-exec` hanya bersifat agregat:
teks perintah, ID proses, keluaran, serta pengidentifikasi sesi atau cakupan tidak pernah
melintasi protokol. Kesehatan saluran, pemeliharaan, penyegaran cache, sesi
WebSocket Plugin yang telah tersambung, dan pekerjaan latar belakang milik Plugin yang tidak terdaftar dapat
tetap aktif.
Platform hosting harus membekukan atau membuat snapshot seluruh pohon proses dan
sistem berkasnya secara konsisten; kontrak pertama ini tidak dapat membuktikan bahwa pekerjaan
yang tidak terdaftar sedang menganggur.

<Tip>
  Untuk penjadwalan membangunkan host, pertahankan bagian yang berhadapan dengan OpenClaw di dalam
  Plugin dalam proses dan proyeksikan snapshot lengkap yang idempoten ke adaptor host eksternal.
  Pengontrol hosting sebaiknya tidak mengimpor SDK Plugin atau merekonstruksi status cron
  dari delta peristiwa. Lihat [Proyeksi cron eksternal yang
  aman](/id/plugins/hooks#safe-external-cron-projection).
</Tip>

## Kode aplikasi vs kode Plugin

Gunakan RPC Gateway ketika kode berada di luar OpenClaw:

- Skrip Node yang memulai atau mengamati eksekusi agen
- Tugas CI yang memanggil Gateway
- dasbor dan panel admin
- ekstensi IDE
- jembatan eksternal yang tidak perlu menjadi Plugin saluran
- pengujian integrasi dengan transportasi Gateway palsu atau nyata

Gunakan SDK Plugin ketika kode berjalan di dalam OpenClaw:

- Plugin penyedia
- Plugin saluran
- hook alat atau siklus hidup
- Plugin harness agen
- pembantu runtime tepercaya

Aplikasi eksternal tidak boleh mengimpor `openclaw/plugin-sdk/*`; subjalur tersebut ditujukan untuk
Plugin yang dimuat oleh OpenClaw.

## Terkait

- [Membangun klien Gateway](https://docs.openclaw.ai/gateway/clients)
- [Menyematkan OpenClaw](https://docs.openclaw.ai/gateway/embedding)
- [Protokol Gateway](/id/gateway/protocol)
- [Referensi RPC Gateway](/id/reference/rpc)
- [Perintah agen CLI](/id/cli/agent)
- [Perintah pesan CLI](/id/cli/message)
- [Loop agen](/id/concepts/agent-loop)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Sesi](/id/concepts/session)
- [Tugas latar belakang](/id/automation/tasks)
- [Agen ACP](/id/tools/acp-agents)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
