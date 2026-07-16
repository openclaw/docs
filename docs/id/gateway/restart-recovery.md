---
read_when:
    - Anda ingin mengetahui apakah memulai ulang Gateway akan menghilangkan pekerjaan agen yang sedang berlangsung
    - Proses agen terhenti akibat mulai ulang, kerusakan, atau pemuatan ulang konfigurasi
    - Anda sedang men-debug pemulihan sesi otomatis setelah Gateway kembali aktif
summary: 'Yang tetap bertahan setelah Gateway dimulai ulang atau mengalami crash: giliran agen yang terputus dilanjutkan secara otomatis, subagen dan tugas latar belakang dipulihkan, serta antrean pengiriman diselesaikan'
title: Pemulihan setelah mulai ulang
x-i18n:
    generated_at: "2026-07-16T18:10:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2fc0263d792e78e75fb97be44671b44287d469b949e11640f11b6ff651dafb9
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Memulai ulang gateway tidak menghilangkan status agen. Percakapan, transkrip,
pekerjaan terjadwal, catatan tugas latar belakang, dan pesan keluar dalam antrean
semuanya tersimpan di disk, dan pekerjaan yang terinterupsi di tengah giliran
dideteksi dan dilanjutkan secara otomatis setelah gateway aktif kembali. Tidak
diperlukan intervensi manual, dan tidak ada yang perlu dikonfigurasi: pemulihan
selalu aktif.

Halaman ini menjelaskan apa yang tetap bertahan setelah mulai ulang, bagaimana
pekerjaan yang terinterupsi dideteksi, dan seperti apa proses pelanjutan otomatisnya.

## Apa yang bertahan setelah mulai ulang

| Status                        | Penyimpanan                                 | Perilaku setelah mulai ulang                                            |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Riwayat percakapan            | Basis data SQLite per agen                  | Tidak berubah; sesi berlanjut dari transkrip yang tersimpan             |
| Giliran sesi utama terinterupsi | Baris sesi dan transkrip SQLite per agen  | Dilanjutkan atau direkonsiliasi secara otomatis beberapa detik setelah dimulai |
| Proses subagen                | SQLite (basis data status bersama)          | Registri dipulihkan saat boot; proses yang terinterupsi dilanjutkan      |
| Tugas latar belakang          | SQLite (basis data status bersama)          | Direkonsiliasi saat boot; proses tanpa pemilik dipulihkan atau ditandai hilang |
| Pengiriman keluar dalam antrean | Antrean pengiriman SQLite                 | Dikosongkan setelah mulai ulang; balasan yang belum terkirim dicoba lagi |
| Pekerjaan terjadwal (cron)    | Penyimpanan cron SQLite                     | Jadwal tetap bertahan; penjadwal diaktifkan kembali saat boot           |
| Kelanjutan mulai ulang        | Sentinel mulai ulang SQLite                 | Tindak lanjut sekali jalan dikirim ke sesi yang meminta mulai ulang     |

## Mulai ulang yang anggun mengosongkan pekerjaan terlebih dahulu

Mulai ulang yang diminta (`openclaw gateway restart`, perubahan konfigurasi yang memerlukan
mulai ulang, atau pembaruan gateway) tidak langsung menghentikan pekerjaan yang
sedang berlangsung. Gateway berhenti menerima pekerjaan baru, lalu menunggu
giliran agen aktif dan tugas latar belakang selesai, hingga batas waktu pengosongan
(5 menit secara default). Karena itu, sebagian besar mulai ulang sama sekali tidak
menginterupsi apa pun.

Hanya pekerjaan yang tidak dapat selesai dalam batas waktu pengosongan (atau
proses yang terinterupsi oleh mulai ulang paksa atau crash) yang dibatalkan —
dan sebelum itu terjadi, setiap sesi yang terdampak ditandai untuk pemulihan.

## Cara pekerjaan yang terinterupsi dideteksi

Tiga mekanisme yang saling melengkapi menandai sesi yang gilirannya tidak selesai:

- **Saat penerimaan giliran:** untuk giliran teks biasa pada sesi utama yang sudah ada,
  gateway menambahkan pesan pengguna, menandai sesi sebagai berjalan, dan mencatat
  klaim pengiriman pemulihannya dalam satu transaksi SQLite sebelum eksekusi model
  atau hook `before_agent_reply`. Control UI melakukan ini sebelum mengembalikan
  konfirmasi `started`; pengiriman kanal melakukannya ketika giliran yang
  telah disiapkan mengadopsi proses agen.
  Perintah, lampiran, penggantian pengaturan per giliran, pengiriman tertunda,
  petunjuk pembatalan sebelumnya, sesi milik plugin, dan giliran dengan hook
  eksekusi tetap menggunakan jalur penerimaan khususnya.
  Jika hook `before_agent_reply` terpasang, penerimaan juga mencatat fasenya.
  Pemulihan tidak pernah memutar ulang hook yang terinterupsi di tengah pemanggilan.
  Setelah hook yang tidak ditangani selesai, titik pemeriksaannya mencatat hasil
  tersebut, tetapi pemulihan tetap gagal secara tertutup selama hook itu masih
  aktif: titik pemeriksaan tidak dapat membuktikan bahwa kode plugin dan konfigurasi
  yang sama dimuat setelah mulai ulang. Hasil teks yang ditangani dan hasil senyap
  dicatat pada titik pemeriksaan secara terpisah agar penyelesaian deterministik.
  Klaim pemulihan tahan lama yang ditulis oleh versi lama tidak memiliki penanda
  kepemilikan sumber, sehingga klaim tersebut menjalani pemeriksaan hook gagal
  tertutup yang sama selama peningkatan versi.
- **Saat dimatikan:** selama pengosongan mulai ulang, setiap sesi dengan proses aktif
  diberi penanda pemulihan dalam penyimpanan sesi sebelum proses tersebut
  dibatalkan.
- **Saat dimulai:** gateway memindai penyimpanan sesi untuk mencari sesi yang masih
  mengklaim sedang berjalan tetapi tidak memiliki pemilik aktif dalam proses baru.
  Ini mendeteksi crash keras dan penghentian ketika tidak ada kode pematian yang
  sempat berjalan. File kunci transkrip yang usang dibersihkan pada saat yang sama.

## Pelanjutan otomatis

Beberapa detik setelah dimulai, gateway mengirim ulang setiap sesi yang ditandai
dengan pesan sistem sintetis yang memberi tahu agen bahwa giliran sebelumnya
terinterupsi oleh mulai ulang dan memintanya melanjutkan dari transkrip yang ada.
Jika balasan akhir sudah dibuat tetapi belum dikirim, teksnya disertakan agar agen
dapat mengirimkannya alih-alih mengulangi pekerjaan. Pemulihan mencoba ulang hingga
3 kali dengan backoff eksponensial. Setiap percobaan ulang menggunakan kembali satu
pengidentifikasi pengiriman tahan lama, sehingga kegagalan koneksi yang ambigu tidak
dapat memulai pemulihan yang sama dua kali. Giliran Control UI yang selesai dan yang
tidak dapat dilanjutkan juga mempertahankan tombstone idempotensi tahan lama yang
terbatas, sehingga outbox yang tersambung kembali dapat menghentikannya tanpa
mengeksekusi ulang permintaan.

Balasan yang hanya menggunakan alat pesan memakai korelasi tahan lama kedua.
Sebelum pengiriman terminal dalam percakapan yang sama mencapai kanal, gateway
mencatat intensi pengiriman yang belum terselesaikan pada sesi dan giliran sumber
yang tepat. Keberhasilan penyedia yang dikonfirmasi menyelesaikannya menjadi tanda
terima pengiriman tahan lama; kegagalan yang dikonfirmasi menghapusnya. Pemulihan
menyelesaikan tanda terima terkirim tanpa menjalankan ulang alat. Jika crash membuat
hasil dari penyedia tidak diketahui, pemulihan gagal secara tertutup alih-alih
memutar ulang efek eksternal.

Balasan yang terkirim juga dicerminkan ke dalam transkrip beserta ID pesan
sumbernya. Cerminan terminal menggunakan kunci tanda terima tersendiri, sehingga
pengiriman progres dengan kunci idempotensi penyedia yang sama tidak dapat menutupi
penanda terminal. Pengiriman progres dan tanda terima dari giliran lama tidak dapat
menyelesaikan giliran saat ini. Hanya klaim masuk kanal yang tahan lama yang dapat
memulihkan otoritas tindakan pesan. Proses yang dilanjutkan mempertahankan mode
pengiriman sumber dan korelasi sumber asli, termasuk identitas pemohon serta
pembatasan kanal/utas yang sama, sehingga tanda terima yang sama tetap berwenang
meskipun mulai ulang kembali terjadi selama pemulihan. Giliran yang hanya menggunakan
alat pesan tanpa otoritas kanal yang dapat direkonstruksi gagal secara tertutup dan
menerima pemberitahuan kirim ulang satu kali.

Sebelum melanjutkan, gateway memeriksa apakah bagian akhir transkrip aman untuk
dilanjutkan. Jika tidak (misalnya, giliran berakhir pada persetujuan tertunda yang
usang), sesi tidak dijalankan ulang secara membabi buta; sebagai gantinya, agen
mengirim pemberitahuan singkat yang meminta pengguna mengirim ulang permintaan
terakhir. Untuk WebChat, pemberitahuan tersebut ditulis langsung ke riwayat sesi
agar tetap terlihat setelah tersambung kembali.

OpenClaw juga dapat merekonstruksi pekerjaan [Mode Kode](/id/reference/code-mode)
hanya-baca yang terinterupsi. Mode Kode menandai proses ini sebagai aman untuk
mulai ulang dan menolak alat katalog atau namespace plugin yang menimbulkan efek
samping sebelum dieksekusi. Jika mulai ulang terjadi pada kontrol
`wait`, gateway baru merekonstruksi giliran dari transkripnya dan
memaksa eksekusi yang direkonstruksi untuk tetap aman terhadap mulai ulang meskipun
model menghilangkan atau menghapus tanda tersebut. Host memfilter seluruh giliran
yang direkonstruksi agar hanya menggunakan alat inti hanya-baca yang telah diaudit
dan alat plugin yang secara eksplisit aman diputar ulang, termasuk ketika Mode Kode
dinonaktifkan setelah mulai ulang. Pekerjaan yang menimbulkan efek samping tetap
dilindungi oleh pemberitahuan kirim ulang alih-alih mengambil risiko penulisan
duplikat.

### Subagen

Proses subagen dipertahankan dalam basis data status SQLite bersama, sehingga
registri subagen bertahan setelah proses berakhir. Saat boot, registri dipulihkan
dan sesi subagen yang terinterupsi dilanjutkan dengan konteks tugas aslinya.
Dua mekanisme pengaman berlaku:

- Proses yang terinterupsi lebih dari 2 jam lalu diselesaikan alih-alih dilanjutkan,
  sehingga gateway yang tidak aktif semalaman tidak menghidupkan kembali pekerjaan
  usang.
- Sesi yang berulang kali gagal dipulihkan diberi tombstone sebagai macet agar
  pemulihan tidak berulang tanpa batas.

### Tugas latar belakang

[Registri tugas latar belakang](/id/automation/tasks) didukung oleh SQLite dan
direkonsiliasi saat boot serta secara berkala: hasil tahan lama yang dicatat oleh
proses yang telah selesai dipulihkan, dan proses yang pemiliknya telah menghilang
ditandai hilang setelah masa tenggang alih-alih terus menggantung tanpa batas.

### Mulai ulang yang diminta agen

Ketika agen sendiri memicu mulai ulang (menerapkan perubahan konfigurasi,
memperbarui gateway, atau melalui permintaan mulai ulang eksplisit), sentinel
mulai ulang ditulis ke SQLite sebelum proses keluar. Setelah boot, gateway
mengirimkan hasilnya kembali ke chat asal dan mengirim giliran kelanjutan sekali
jalan agar agen melanjutkan tepat dari tempat terakhirnya, pada kanal dan utas
yang sama.

## Mekanisme pengaman dan observabilitas

- **Pemutus loop crash:** 3 boot tidak bersih dalam 5 menit memicu pemutus yang
  menekan layanan samping yang dimulai otomatis pada boot berikutnya, sehingga
  gateway yang mengalami crash tidak memperparah dirinya sendiri. Pemutus pulih
  setelah jendela boot tidak bersih berakhir.
- **Metrik:** aktivitas pemulihan diekspor melalui
  [Prometheus](/id/gateway/prometheus) sebagai `openclaw_session_recovery_total` dan
  `openclaw_session_recovery_age_seconds`.
- **Log:** keputusan pemulihan dicatat dalam subsistem
  `main-session-restart-recovery` dan `subagent-interrupted-resume`.

## Yang tidak dilanjutkan

- Sesi yang dikecualikan dari pemulihan sesi utama karena sudah ditangani oleh
  pemilik lain: sesi subagen (pemulihan subagen), sesi cron (penjadwal menjalankannya
  kembali sesuai jadwal), dan sesi yang dikelola ACP (IDE atau klien yang terhubung
  memiliki tanggung jawab untuk melanjutkannya).
- Sesi yang bagian akhir transkripnya tidak dapat dilanjutkan dengan aman; sesi ini
  menerima pemberitahuan kirim ulang yang dijelaskan di atas alih-alih dijalankan
  ulang secara senyap.
- Pekerjaan yang tidak pernah diterima: pesan yang tiba selama jendela pengosongan
  ditolak dengan kesalahan mulai ulang eksplisit alih-alih dimasukkan secara senyap
  ke antrean proses yang sedang berhenti.
