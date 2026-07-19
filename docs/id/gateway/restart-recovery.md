---
read_when:
    - Anda ingin mengetahui apakah memulai ulang Gateway akan menghilangkan pekerjaan agen yang sedang berlangsung
    - Proses agen terhenti akibat mulai ulang, crash, atau pemuatan ulang konfigurasi
    - Anda sedang men-debug pemulihan sesi otomatis setelah Gateway kembali aktif
summary: 'Yang tetap bertahan setelah Gateway dimulai ulang atau mengalami crash: giliran agen yang terputus dilanjutkan secara otomatis, subagen dan tugas latar belakang dipulihkan, pengiriman yang mengantre diselesaikan'
title: Pemulihan setelah dimulai ulang
x-i18n:
    generated_at: "2026-07-19T04:55:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdea30f3a90697951f4f63a06897d2c1d936e5145138b47fed7d8ebd8b7187ad
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Memulai ulang gateway tidak menghilangkan status agen. Percakapan, transkrip,
pekerjaan terjadwal, catatan tugas latar belakang, dan pesan keluar dalam antrean
semuanya tersimpan di disk, dan pekerjaan yang terinterupsi di tengah giliran
dideteksi serta dilanjutkan secara otomatis setelah gateway kembali aktif.
Pemulihan selalu aktif dan biasanya tidak memerlukan intervensi manual.
Pemulihan yang berulang kali gagal dibatasi dan dapat mengarantina satu sesi
hingga Anda memeriksa atau menggantinya.

Halaman ini menjelaskan apa yang tetap bertahan setelah mulai ulang, bagaimana
pekerjaan yang terinterupsi dideteksi, dan seperti apa pelanjutan otomatisnya.

## Yang bertahan setelah mulai ulang

| Status                        | Penyimpanan                                 | Perilaku setelah mulai ulang                                             |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Riwayat percakapan            | Basis data SQLite per agen                  | Tidak berubah; sesi berlanjut dari transkrip yang tersimpan             |
| Giliran sesi utama yang terinterupsi | Baris sesi dan transkrip SQLite per agen | Dilanjutkan atau direkonsiliasi secara otomatis beberapa detik setelah dimulai |
| Eksekusi subagen              | SQLite (basis data status bersama)          | Registri dipulihkan saat boot; eksekusi yang terinterupsi dilanjutkan   |
| Tugas latar belakang          | SQLite (basis data status bersama)          | Direkonsiliasi saat boot; eksekusi tanpa induk dipulihkan atau ditandai hilang |
| Pengiriman keluar dalam antrean | Antrean pengiriman SQLite                 | Diproses setelah mulai ulang; balasan yang belum terkirim dicoba kembali |
| Pekerjaan terjadwal (cron)    | Penyimpanan cron SQLite                     | Jadwal tetap tersimpan; penjadwal diaktifkan kembali saat boot          |
| Kelanjutan mulai ulang        | Sentinel mulai ulang SQLite                 | Tindak lanjut sekali jalan dikirim ke sesi yang meminta mulai ulang     |

## Mulai ulang yang tertib melakukan pengosongan terlebih dahulu

Mulai ulang yang diminta (`openclaw gateway restart`, perubahan konfigurasi yang
memerlukan mulai ulang, atau pembaruan gateway) tidak langsung menghentikan
pekerjaan yang sedang berlangsung. Gateway berhenti menerima pekerjaan baru,
lalu menunggu giliran agen aktif dan tugas latar belakang selesai, hingga batas
waktu pengosongan (5 menit secara default). Karena itu, sebagian besar mulai
ulang tidak menginterupsi apa pun.

Hanya pekerjaan yang tidak dapat selesai dalam batas waktu pengosongan (atau
eksekusi apa pun yang terinterupsi oleh mulai ulang paksa atau crash) yang
dibatalkan—dan sebelum itu terjadi, setiap sesi yang terdampak ditandai untuk
pemulihan.

## Cara pekerjaan yang terinterupsi dideteksi

Tiga mekanisme yang saling melengkapi menandai sesi yang gilirannya tidak selesai:

- **Saat penerimaan giliran:** untuk giliran teks biasa pada sesi utama yang sudah ada,
  gateway menambahkan pesan pengguna, menandai sesi sebagai sedang berjalan,
  dan mencatat klaim pengiriman pemulihannya dalam satu transaksi SQLite sebelum
  eksekusi model atau hook `before_agent_reply`. Control UI melakukan ini sebelum
  mengembalikan konfirmasi `started`; pengiriman kanal melakukannya saat
  giliran yang telah disiapkan mengambil alih eksekusi agen.
  Perintah, lampiran, penimpaan per giliran, pengiriman tertunda, petunjuk
  pembatalan sebelumnya, sesi milik plugin, dan giliran dengan hook eksekusi
  tetap menggunakan jalur penerimaan khususnya.
  Jika hook `before_agent_reply` terpasang, penerimaan juga mencatat fasenya.
  Pemulihan tidak pernah memutar ulang hook yang terinterupsi di tengah
  pemanggilan. Setelah hook yang tidak ditangani selesai, titik pemeriksaannya
  mencatat hasil tersebut, tetapi pemulihan tetap gagal secara tertutup selama
  hook itu masih aktif: titik pemeriksaan tidak dapat membuktikan bahwa kode
  plugin dan konfigurasi yang sama dimuat setelah mulai ulang. Hasil teks yang
  ditangani dan hasil senyap diberi titik pemeriksaan secara terpisah untuk
  penyelesaian deterministik.
  Klaim pemulihan tahan lama yang ditulis oleh versi lama tidak memiliki penanda
  kepemilikan sumber, sehingga klaim tersebut menerima pemeriksaan hook gagal
  tertutup yang sama selama peningkatan.
- **Saat penghentian:** selama pengosongan sebelum mulai ulang, setiap sesi dengan
  eksekusi aktif diberi penanda pemulihan dalam penyimpanan sesi sebelum eksekusi
  dibatalkan.
- **Saat dimulai:** gateway memindai penyimpanan sesi untuk menemukan sesi yang masih
  mengklaim sedang berjalan tetapi tidak memiliki pemilik aktif dalam proses
  baru. Ini mendeteksi crash keras dan penghentian saat tidak ada kode
  penghentian yang dijalankan. File kunci transkrip yang kedaluwarsa juga
  dibersihkan pada saat yang sama.

## Pelanjutan otomatis

Beberapa detik setelah dimulai, gateway mengirim ulang setiap sesi yang ditandai
dengan pesan sistem sintetis yang memberi tahu agen bahwa giliran sebelumnya
terinterupsi oleh mulai ulang dan agar melanjutkan dari transkrip yang ada. Jika
balasan akhir sudah dihasilkan tetapi belum dikirim, teksnya disertakan agar
agen dapat mengirimkannya alih-alih mengulang pekerjaan.

Rekonsiliasi saat dimulai mencoba kembali kegagalan sementara hingga tiga kali
dengan backoff eksponensial. Secara terpisah, setiap siklus sesi utama yang
terinterupsi memiliki batas tahan lama sebanyak tiga percobaan pengiriman
otomatis yang dikenakan, dan batas ini dipertahankan di seluruh mulai ulang
gateway. OpenClaw mengenakan satu percobaan sebelum pengiriman, mengembalikannya
ketika gateway secara eksplisit menolak permintaan sebelum diterima, dan
mempertahankan pengenaan tersebut ketika hasil setelah pengiriman tidak pasti
untuk menghindari pemutaran ulang pekerjaan. Pekerjaan latar depan yang sudah
memiliki sesi mencegah pemulihan otomatis masuk hingga pekerjaan tersebut
selesai.

Setelah batas tahan lama habis, sesi diberi tombstone alih-alih berulang
selamanya. Periksa sesi yang gagal dan gunakan `/new` atau `/reset` untuk memulai
penggantinya. `openclaw doctor --fix` dapat memperbaiki tanda dibatalkan kedaluwarsa
yang berkonflik dengan tombstone, tetapi tidak mengaktifkan kembali siklus
pemulihan tersebut.

Setiap percobaan ulang menggunakan kembali satu pengidentifikasi pengiriman tahan
lama, sehingga kegagalan koneksi yang ambigu tidak dapat memulai pemulihan yang
sama dua kali. Giliran Control UI yang selesai dan tidak dapat dilanjutkan juga
mempertahankan tombstone idempotensi tahan lama yang dibatasi, sehingga outbox
yang tersambung kembali dapat menghentikannya tanpa mengeksekusi ulang
permintaan.

Balasan yang hanya menggunakan alat pesan memakai korelasi tahan lama kedua.
Sebelum pengiriman terminal dalam percakapan yang sama mencapai kanal, gateway
mencatat maksud pengiriman yang belum terselesaikan pada sesi dan giliran sumber
yang tepat. Keberhasilan penyedia yang dikonfirmasi mengubahnya menjadi tanda
terima terkirim yang tahan lama; kegagalan yang dikonfirmasi menghapusnya.
Pemulihan menyelesaikan tanda terima terkirim tanpa menjalankan ulang alat. Jika
crash membuat hasil penyedia tidak diketahui, pemulihan gagal secara tertutup
alih-alih memutar ulang efek eksternal.

Balasan yang terkirim juga dicerminkan ke dalam transkrip beserta ID pesan
sumbernya. Cerminan terminal menggunakan kunci tanda terima yang berbeda,
sehingga pengiriman progres dengan kunci idempotensi penyedia yang sama tidak
dapat menyamarkan penanda terminal. Pengiriman progres dan tanda terima dari
giliran lama tidak dapat menyelesaikan giliran saat ini. Hanya klaim masuk kanal
yang tahan lama yang dapat memulihkan kewenangan tindakan pesan. Eksekusi yang
dilanjutkan mempertahankan mode pengiriman sumber dan korelasi sumber asli,
termasuk identitas pemohon dan pembatasan kanal/utas yang sama, sehingga tanda
terima yang sama tetap berwenang meskipun mulai ulang lain terjadi selama
pemulihan. Giliran yang hanya menggunakan alat pesan tanpa kewenangan kanal yang
dapat direkonstruksi akan gagal secara tertutup dan menerima pemberitahuan
kirim ulang satu kali.

Sebelum melanjutkan, gateway memeriksa apakah bagian akhir transkrip aman untuk
dilanjutkan. Jika tidak (misalnya, giliran berakhir pada persetujuan tertunda
yang kedaluwarsa), sesi tidak dijalankan ulang secara membabi buta; agen justru
mengirim pemberitahuan singkat yang meminta pengguna mengirim ulang permintaan
terakhir. Untuk WebChat, pemberitahuan tersebut ditulis langsung ke riwayat sesi
agar tetap terlihat setelah tersambung kembali.

OpenClaw juga dapat merekonstruksi pekerjaan [Code Mode](/tools/code-mode)
hanya-baca yang terinterupsi. Code Mode menandai eksekusi ini sebagai aman untuk
mulai ulang dan menolak alat katalog atau namespace plugin yang memiliki efek
samping sebelum dieksekusi. Jika mulai ulang terjadi pada kontrol
`wait`, gateway baru merekonstruksi giliran dari transkripnya dan
memaksa eksekusi yang direkonstruksi tetap aman untuk mulai ulang meskipun model
menghilangkan atau menghapus tanda tersebut. Host memfilter seluruh giliran yang
direkonstruksi agar hanya menggunakan alat inti hanya-baca yang diaudit dan alat
plugin yang secara eksplisit aman untuk diputar ulang, termasuk ketika Code Mode
dinonaktifkan setelah mulai ulang. Pekerjaan yang memiliki efek samping tetap
dilindungi oleh pemberitahuan kirim ulang alih-alih mengambil risiko penulisan
duplikat.

### Subagen

Eksekusi subagen dipertahankan dalam basis data status SQLite bersama, sehingga
registri subagen tetap bertahan setelah proses berakhir. Saat boot, registri
dipulihkan dan sesi subagen yang terinterupsi dilanjutkan dengan konteks tugas
aslinya. Dua mekanisme pengaman berlaku:

- Eksekusi yang terinterupsi lebih dari 2 jam lalu diselesaikan alih-alih
  dilanjutkan, sehingga gateway yang tidak aktif semalaman tidak menghidupkan
  kembali pekerjaan kedaluwarsa.
- Sesi yang berulang kali gagal dipulihkan diberi tombstone sebagai macet agar
  pemulihan tidak dapat berulang selamanya.

### Tugas latar belakang

[Registri tugas latar belakang](/id/automation/tasks) didukung SQLite dan
direkonsiliasi saat boot serta dalam interval berkala: hasil tahan lama yang
dicatat oleh eksekusi yang selesai dipulihkan, dan eksekusi yang proses
pemiliknya menghilang ditandai hilang setelah masa tenggang alih-alih menggantung
selamanya.

### Mulai ulang yang diminta agen

Ketika agen sendiri memicu mulai ulang (menerapkan perubahan konfigurasi,
memperbarui gateway, atau melalui permintaan mulai ulang eksplisit), sentinel
mulai ulang ditulis ke SQLite sebelum proses berhenti. Setelah boot, gateway
mengirimkan hasil kembali ke percakapan asal dan mengirim giliran kelanjutan
sekali jalan agar agen melanjutkan tepat dari titik terakhirnya, pada kanal dan
utas yang sama.

Kolom SQLite bertipe milik sentinel bersifat otoritatif untuk penanganan mulai
ulang; nilai `payload_json` miliknya hanya merupakan bayangan pemutaran
ulang/debug. Runtime membaca, menulis, dan menghapus status SQLite tanpa fallback
file. Selama peralihan penyimpanan, migrasi status yang dibatasi dijalankan saat
dimulai dan melalui Doctor untuk mempertahankan `restart-sentinel.json` tervalidasi
yang ditinggalkan oleh proses lama setelah pembaruan. Migrasi memverifikasi baris
bertipe tersebut dan menghapus file sumber sebelum penanganan mulai ulang normal
berlanjut.

## Mekanisme pengaman dan observabilitas

- **Pemutus perulangan crash:** 3 boot tidak bersih dalam 5 menit memicu pemutus yang
  menekan layanan samping yang dimulai otomatis pada boot berikutnya, sehingga
  gateway yang mengalami crash tidak memperparah dirinya sendiri. Pemutus
  pulih setelah jendela boot tidak bersih berakhir.
- **Batas percobaan sesi utama:** tiga percobaan pengiriman otomatis yang dikenakan
  per siklus terinterupsi; ketika habis, sesi tersebut diberi tombstone hingga
  diperiksa dan diganti.
- **Metrik:** aktivitas pemulihan diekspor melalui
  [Prometheus](/id/gateway/prometheus) sebagai `openclaw_session_recovery_total` dan
  `openclaw_session_recovery_age_seconds`.
- **Log:** keputusan pemulihan dicatat dalam subsistem
  `main-session-restart-recovery` dan `subagent-interrupted-resume`.

## Yang tidak dilanjutkan

- Sesi yang dikecualikan dari pemulihan sesi utama karena sudah ditangani oleh
  pemilik lain: sesi subagen (pemulihan subagen), sesi cron (penjadwal
  menjalankannya kembali sesuai jadwal), dan sesi yang dikelola ACP (IDE atau
  klien yang terhubung memiliki kendali atas pelanjutan).
- Sesi yang bagian akhir transkripnya tidak dapat dilanjutkan dengan aman; sesi
  ini menerima pemberitahuan kirim ulang yang dijelaskan di atas alih-alih
  dijalankan ulang secara diam-diam.
- Pekerjaan yang tidak pernah diterima: pesan yang tiba selama jendela
  pengosongan ditolak dengan kesalahan mulai ulang eksplisit alih-alih diam-diam
  dimasukkan ke antrean proses yang sedang berhenti.
- Giliran tertanam mandiri tidak dapat mengambil alih sesi utama yang memiliki
  pemulihan mulai ulang tertunda karena tidak berbagi pemilik siklus hidup
  gateway. Jalankan giliran melalui gateway atau atur ulang di sana dengan
  `/new` atau `/reset`.
