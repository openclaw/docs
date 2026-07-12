---
read_when:
    - Anda sedang membangun aplikasi eksternal, skrip, dasbor, tugas CI, atau ekstensi IDE yang berkomunikasi dengan OpenClaw
    - Anda sedang memilih antara RPC Gateway dan SDK Plugin
    - Anda berintegrasi dengan proses agen Gateway, sesi, peristiwa, persetujuan, model, atau alat
    - Anda memasangkan pengontrol hosting dengan penjadwal pengaktifan eksternal
sidebarTitle: External apps
summary: Jalur integrasi saat ini untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
title: Integrasi Gateway untuk aplikasi eksternal
x-i18n:
    generated_at: "2026-07-12T14:10:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Aplikasi eksternal berkomunikasi dengan OpenClaw melalui protokol Gateway: transportasi WebSocket serta metode RPC. Gunakan protokol ini saat skrip, dasbor, tugas CI, ekstensi IDE, atau proses lain ingin memulai eksekusi agen, melakukan streaming peristiwa, menunggu hasil, membatalkan pekerjaan, atau memeriksa sumber daya Gateway.

<Warning>
  Belum ada paket klien npm publik. Jangan tambahkan nama paket klien OpenClaw sebagai dependensi aplikasi hingga catatan rilis mengumumkan paket yang telah dipublikasikan dan halaman ini menyertakan petunjuk instalasi.
</Warning>

<Note>
  Halaman ini ditujukan untuk kode di luar proses OpenClaw. Kode Plugin yang berjalan di dalam OpenClaw sebaiknya menggunakan subjalur `openclaw/plugin-sdk/*` yang terdokumentasi.
</Note>

## Yang tersedia saat ini

| Antarmuka                              | Status | Kegunaan                                                                                                    |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| [Protokol Gateway](/id/gateway/protocol)  | Siap   | Transportasi WebSocket, jabat tangan koneksi, cakupan autentikasi, pembuatan versi protokol, dan peristiwa. |
| [Referensi RPC Gateway](/id/reference/rpc) | Siap  | Metode Gateway saat ini untuk agen, sesi, tugas, model, alat, artefak, dan persetujuan.                      |
| [`openclaw agent`](/id/cli/agent)         | Siap   | Integrasi skrip sekali jalan ketika menjalankan CLI melalui shell sudah memadai.                            |
| [`openclaw message`](/id/cli/message)     | Siap   | Mengirim pesan atau tindakan saluran dari skrip.                                                            |

Paket pustaka klien mendatang sedang dikembangkan secara internal, tetapi belum menjadi antarmuka instalasi publik. Perlakukan paket tersebut sebagai detail implementasi pratinjau hingga rilis mengumumkan paket yang dipublikasikan dan memiliki versi.

## Jalur yang direkomendasikan

1. Jalankan atau temukan Gateway.
2. Hubungkan melalui [protokol Gateway](/id/gateway/protocol).
3. Panggil metode RPC yang terdokumentasi dari [referensi RPC Gateway](/id/reference/rpc).
4. Sematkan versi OpenClaw yang menjadi target pengujian Anda.
5. Periksa kembali referensi RPC saat meningkatkan OpenClaw.

Untuk eksekusi agen, mulai dengan RPC `agent` dan pasangkan dengan `agent.wait` untuk mendapatkan hasil terminal. Untuk status percakapan yang persisten, gunakan metode `sessions.*`. Untuk integrasi UI, berlangganan peristiwa Gateway dan render hanya kelompok peristiwa yang dipahami aplikasi Anda.

## Penangguhan host secara kooperatif

Pengontrol hosting yang membekukan atau membuat snapshot proses yang sedang berjalan dapat menggunakan jabat tangan penangguhan yang netral terhadap host:

1. Hentikan penerimaan trafik masuk eksternal yang dikendalikan oleh host.
2. Panggil `gateway.suspend.prepare` dengan `requestId` yang stabil dan unik.
3. Jika responsnya `busy`, biarkan proses tetap berjalan dan coba lagi nanti.
4. Jika responsnya `ready`, simpan `suspensionId` yang dikembalikan, lalu bekukan atau buat snapshot proses sebelum `expiresAtMs`.
5. Setelah proses dicairkan, atau jika penangguhan dibatalkan, panggil `gateway.suspend.resume` dengan `suspensionId` tersebut melalui WebSocket yang sudah ada atau jalur kontrol Admin HTTP.

Gateway yang telah disiapkan menolak jabat tangan WebSocket baru. Pengontrol WebSocket harus mempertahankan koneksi terautentikasinya tetap terbuka selama operasi host. Jika hal itu tidak dapat dijamin, aktifkan dan gunakan [Plugin RPC Admin HTTP](/id/plugins/admin-http-rpc) sebelum melakukan persiapan. Jika jalur kontrol terputus, tunggu hingga sewa dua menit berakhir sebelum menyambungkan kembali; berakhirnya masa sewa akan membuka kembali penerimaan secara otomatis.

Kontrak RPC-nya adalah:

- `gateway.suspend.prepare` — `operator.admin`; parameter
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; parameter
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; parameter
  `{ "suspensionId": "id-from-prepare" }`

Spasi di awal dan akhir ID dihapus, ID harus mengandung karakter selain spasi, dan dibatasi hingga 128 karakter. Hasil persiapan sibuk memiliki `status: "busy"`, `reason`, `retryAfterMs`, `activeCount`, dan `blockers`. Hasil siap memiliki bentuk berikut:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

Status mengembalikan `{"status":"running"}` atau hasil siap dengan `expiresAtMs`. Pelanjutan mengembalikan `{"ok":true,"status":"running","resumed":true}`; mengulanginya setelah pelanjutan berhasil akan mengembalikan `resumed: false`.

ID permintaan yang bersaing atau kegagalan sementara dalam melanjutkan penjadwal akan mengembalikan `UNAVAILABLE` yang dapat dicoba ulang beserta `retryAfterMs`. Selama pemulihan penjadwal, persiapan, status, dan pelanjutan semuanya mengembalikan galat tersebut, Gateway tetap tidak siap dan gagal secara tertutup, serta host tidak boleh membekukan atau membuat snapshot-nya. OpenClaw mencoba kembali penjadwal secara otomatis dan hanya membuka kembali penerimaan setelah pemulihan berhasil. ID pelanjutan yang tidak cocok mengembalikan `INVALID_REQUEST`. Persiapan berbagi anggaran penulisan bidang kontrol Gateway sebanyak tiga percobaan per menit; patuhi penundaan percobaan ulang yang dikembalikan. Klien WebSocket dikelompokkan berdasarkan perangkat dan IP. Pengontrol Admin HTTP dikelompokkan berdasarkan IP klien yang telah diurai, sehingga pengontrol di balik satu proksi dapat berbagi anggaran.

Persiapan hanya melakukan penolakan: OpenClaw menutup penerimaan root/sesi/perintah baru, menjeda tick cron otomatis, dan memeriksa pekerjaan secara sinkron. Jika ada sesuatu yang aktif, OpenClaw melanjutkan penjadwal dan membuka kembali penerimaan sebelum mengembalikan `busy`; OpenClaw tidak menginterupsi atau menguras pekerjaan tersebut. Sewa siap berlangsung selama dua menit. Mengulangi `prepare` dengan `requestId` yang sama akan memperbaruinya; berakhirnya masa sewa akan melanjutkan penjadwal sebelum membuka kembali penerimaan.
Emisi mulai ulang yang jatuh tempo selama sewa siap akan menunggu hingga sewa dilanjutkan; mulai ulang yang sedang berlangsung menyebabkan persiapan mengembalikan `busy`.

Saat siap, `/healthz` tetap aktif dan `/readyz` mengembalikan `503`. Respons kesiapan lokal atau terautentikasi menyertakan `gateway-draining`; pemeriksaan jarak jauh tanpa autentikasi hanya menerima `{ "ready": false }`. Pemeriksaan kesehatan HTTP, metode penangguhan pada koneksi WebSocket yang sudah ada, dan rute RPC Admin HTTP yang telah diaktifkan tetap tersedia. RPC lainnya mengembalikan `UNAVAILABLE` yang dapat dicoba ulang. Rute HTTP pekerjaan pengguna bawaan dan rute HTTP Plugin biasa, termasuk API yang kompatibel dengan OpenAI, operasi alat/sesi, pemantauan Node, dan hook yang dikonfigurasi, mengembalikan `503` dengan `error.code: "gateway_unavailable"`. Peningkatan WebSocket baru yang dimiliki Plugin juga mengembalikan `503`; ini mencakup kepemilikan peningkatan, bukan pekerjaan yang kemudian dilakukan melalui soket Plugin yang telah terbentuk.

Jabat tangan ini tidak mempersistenkan pesan masuk, menghentikan transportasi saluran pihak ketiga, atau mengendalikan platform hosting. Host harus membatasi trafik masuknya sebelum persiapan dan tetap bertanggung jawab atas pengaktifan, snapshot/pembekuan, dan penghentian. `activeCount` adalah jumlah agregat pekerjaan terlacak, sedangkan `blockers` berisi jumlah kategori yang tidak nol dan detail tugas yang dibatasi. Ini bukan penghalang ketenangan proses umum. Pemblokir `background-exec` hanya bersifat agregat: teks perintah, ID proses, keluaran, serta pengidentifikasi sesi atau cakupan tidak pernah melintasi protokol. Kesehatan saluran, pemeliharaan, penyegaran cache, sesi WebSocket Plugin yang telah terbentuk, dan pekerjaan latar belakang milik Plugin yang tidak terdaftar dapat tetap aktif.
Platform hosting harus membekukan atau membuat snapshot seluruh pohon proses dan sistem berkasnya secara konsisten; pekerjaan yang tidak terdaftar tidak dapat dibuktikan sedang menganggur oleh kontrak pertama ini.

<Tip>
  Untuk penjadwalan pengaktifan host, tempatkan bagian yang berhadapan dengan OpenClaw di dalam Plugin dalam proses dan proyeksikan snapshot lengkap yang idempoten ke adaptor host eksternal. Pengontrol hosting tidak boleh mengimpor SDK Plugin atau merekonstruksi status cron dari delta peristiwa. Lihat [Proyeksi cron eksternal yang aman](/id/plugins/hooks#safe-external-cron-projection).
</Tip>

## Kode aplikasi vs kode Plugin

Gunakan RPC Gateway saat kode berada di luar OpenClaw:

- Skrip Node yang memulai atau mengamati eksekusi agen
- Tugas CI yang memanggil Gateway
- dasbor dan panel admin
- ekstensi IDE
- jembatan eksternal yang tidak perlu menjadi Plugin saluran
- pengujian integrasi dengan transportasi Gateway palsu atau nyata

Gunakan SDK Plugin saat kode berjalan di dalam OpenClaw:

- Plugin penyedia
- Plugin saluran
- hook alat atau siklus hidup
- Plugin harness agen
- pembantu runtime tepercaya

Aplikasi eksternal tidak boleh mengimpor `openclaw/plugin-sdk/*`; subjalur tersebut ditujukan untuk Plugin yang dimuat oleh OpenClaw.

## Terkait

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
