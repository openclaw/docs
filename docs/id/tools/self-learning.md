---
read_when:
    - Anda ingin OpenClaw mempelajari prosedur yang dapat digunakan kembali dari percakapan yang telah selesai
    - Anda sedang memutuskan apakah akan mengaktifkan usulan skill secara otonom
    - Anda perlu memahami keamanan, biaya, kelayakan, atau pemecahan masalah pembelajaran mandiri
sidebarTitle: Self-learning
summary: Biarkan OpenClaw mengusulkan Skills yang dapat digunakan kembali berdasarkan koreksi dan pekerjaan substansial yang telah diselesaikan
title: Belajar mandiri
x-i18n:
    generated_at: "2026-07-16T18:49:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

Pembelajaran mandiri memungkinkan OpenClaw mengubah bukti yang berguna dari percakapan menjadi proposal
[Skill Workshop](/id/tools/skill-workshop) yang tertunda. Fitur ini tidak melatih bobot
model, mengedit Skills aktif, atau secara diam-diam mengubah perilaku agen. Setiap prosedur yang
dipelajari tetap tertunda hingga operator meninjau dan menerapkannya.

Pembelajaran mandiri **dinonaktifkan secara default**. Aktifkan hanya jika satu proses model
latar belakang tambahan dan peninjauan transkrip sesuai untuk ruang kerja Anda.

## Mengaktifkan pembelajaran mandiri

Di Control UI, buka **Plugins → Workshop** dan aktifkan **Self-learning**. Perubahan
langsung berlaku; ketika penulis konfigurasi lain telah memperbarui
file, Control UI menyegarkan snapshot konfigurasi dan mencoba kembali pengaktifan tanpa
memuat ulang halaman atau Gateway.

Gunakan CLI:

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

Atau edit `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

Nonaktifkan kembali dengan:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Pembuatan skill atas permintaan pengguna, `/learn`, dan operasi Skill Workshop manual
tetap berfungsi saat pembelajaran mandiri dinonaktifkan.

## Meninjau sesi sebelumnya secara manual

Peninjauan riwayat manual merupakan alternatif konservatif untuk pengambilan otonom.
Buka **Plugins → Workshop** di Control UI dan pilih **Find skill ideas**.
Tindakan ini tidak mengubah `skills.workshop.autonomous.enabled`.

Setiap pemindaian:

- dimulai dari sesi terbaru yang belum ditinjau lalu bergerak mundur;
- meninjau hingga 20 sesi substansial dengan sedikitnya enam giliran model;
- melewati sesi cron, heartbeat, hook, subagen, ACP, milik plugin, dan peninjauan
  internal;
- menyamarkan rahasia yang dikenali dan membatasi bundel transkrip sebelum mengirimkannya
  ke model terkonfigurasi milik agen yang dipilih;
- menggunakan standar tinggi yang sama seperti peninjauan pengalaman otonom; dan
- dapat membuat atau merevisi paling banyak tiga proposal tertunda, tidak pernah Skills aktif.

Workshop melaporkan jumlah sesi kumulatif, cakupan tanggal, dan ide yang ditemukan.
Pilih **Scan earlier work** untuk jendela lama berikutnya. Ketika kursor mencapai
awal riwayat yang memenuhi syarat, tindakan berubah menjadi **Scan new work**.
OpenClaw hanya menyimpan metadata kursor dan cakupan dalam basis data status bersama;
OpenClaw tidak membuat arsip transkrip kedua.

Sesi hanya dipindai ketika OpenClaw dapat membuktikan kepemilikannya dan mengecualikan
konten hook eksternal. Setelah peningkatan, transkrip pra-peningkatan saat ini dapat
diklasifikasikan secara lokal, tetapi transkrip pra-peningkatan yang telah dirotasi tanpa asal-usul
per proses dilewati. Transkrip baru mempertahankan asal-usul ini setelah rotasi.

Pemindaian manual tetap menimbulkan biaya penyedia model dan mengirimkan konten
percakapan yang memenuhi syarat kepada penyedia terkonfigurasi. Gunakan hanya ketika peninjauan tersebut sesuai dengan
persyaratan privasi dan penanganan data ruang kerja.

## Hal yang dapat dipelajari OpenClaw

Pembelajaran mandiri memiliki dua jalur konservatif:

1. **Instruksi dan koreksi langsung.** OpenClaw mendeteksi bahasa yang berlaku berkelanjutan
   seperti “mulai sekarang,” “lain kali,” dan koreksi terhadap pendekatan yang gagal.
   Dengan pembelajaran mandiri diaktifkan, OpenClaw dapat mengubah sinyal tersebut menjadi proposal tertunda
   tanpa menunggu prompt lain. Jalur deterministik ini dapat mengelompokkan instruksi terkait
   menjadi hingga tiga proposal, menargetkan skill ruang kerja yang dapat ditulis,
   atau merevisi proposal tertunda terkait miliknya sendiri. Jalur ini juga berjalan setelah giliran yang gagal
   karena menangkap instruksi pengguna, bukan menilai penyelesaian.
2. **Peninjauan pengalaman.** Setelah giliran latar depan yang berhasil dan substansial,
   OpenClaw dapat meninjau pekerjaan yang telah selesai untuk menemukan teknik pemulihan yang dapat digunakan kembali atau
   prosedur stabil yang akan menghilangkan sedikitnya dua siklus model atau alat
   di masa mendatang.

Kandidat yang baik meliputi:

- pemulihan andal setelah kegagalan alat atau model berulang;
- batasan urutan yang tidak jelas yang mencegah kesalahan berulang;
- alur kerja multi-langkah stabil yang memerlukan penemuan berulang; atau
- pemeriksaan awal yang dapat digunakan kembali dan akan menghindari beberapa panggilan di masa mendatang.

Peninjau harus tidak mengambil tindakan untuk pekerjaan rutin yang berhasil, permintaan satu kali,
fakta pribadi, preferensi sederhana, kegagalan lingkungan sementara, saran
umum, klaim negatif yang tidak didukung, dan rahasia.

## Waktu peninjauan pengalaman berjalan

Peninjauan pengalaman sengaja ditunda dan dibatasi:

- Giliran latar depan harus selesai dengan berhasil.
- Giliran saat ini harus berisi sedikitnya sepuluh iterasi model.
- Sesi Cron, heartbeat, memori, overflow, hook, subagen, dan peninjauan
  dikecualikan.
- Proses latar depan harus telah menentukan penyedia dan model serta benar-benar
  memiliki akses ke `skill_workshop`.
- OpenClaw menunggu 30 detik setelah penyelesaian. Penyelesaian latar depan berikutnya dalam
  sesi yang sama memulai ulang periode hening tersebut.
- Jika proses agen atau balasan masih aktif, peninjauan menunggu 30 detik lagi.
- Hanya satu peninjauan pengalaman yang berjalan pada satu waktu.
- Peninjauan tertunda merupakan pekerjaan Gateway yang bersifat lokal bagi proses. Gateway harus tetap berjalan
  selama jendela menganggur; runtime lokal sekali jalan dan yang didukung CLI tidak menyimpan
  cukup konteks lintasan dan ketersediaan alat untuk menjadwalkannya.

Jawaban latar depan tidak pernah ditunda demi pembelajaran. Giliran yang gagal atau tidak memenuhi syarat
tidak memulai peninjauan pengalaman, meskipun koreksi langsung dari pengguna masih dapat
ditawarkan sebagai saran ketika otonomi dinonaktifkan.

## Hal yang diterima peninjau

Peninjau latar belakang hanya menerima giliran saat ini, dimulai dari
pesan pengguna terbarunya. Lintasan yang dirender dibatasi hingga 60.000 karakter;
bila perlu, OpenClaw mempertahankan pesan pertama dan bukti terbaru serta
menandai bagian tengah yang dihilangkan.

Peninjau menggunakan kembali penyedia dan model yang telah ditentukan. Peninjau menggunakan kembali
profil autentikasi latar depan ketika identitas tersebut tersedia dan menonaktifkan fallback model. Oleh
karena itu, peninjauan memulai satu proses model tambahan pada penyedia terkonfigurasi.
Proses tersebut dapat membuat lebih dari satu permintaan ke penyedia ketika memeriksa atau menyusun
proposal. Harga dan ketentuan penanganan data penyedia berlaku sebagaimana pada
giliran latar depan.

Sebelum memulai, OpenClaw memuat ulang konfigurasi runtime saat ini dan memeriksa kembali
sandbox efektif serta kebijakan alat untuk percakapan asal. Jika proses
berada dalam sandbox, kebijakan tidak lagi mengizinkan `skill_workshop`, atau fakta runtime yang diperlukan
tidak tersedia, peninjauan gagal secara tertutup dan tidak membuat apa pun.

<Warning>
  Mengaktifkan pembelajaran mandiri mengizinkan konten percakapan yang memenuhi syarat, termasuk input
  dan hasil alat dari giliran saat ini, dikirim ke penyedia model yang dipilih
  untuk satu peninjauan tambahan. Jangan aktifkan fitur ini di ruang kerja apabila
  peninjauan tersebut akan melanggar persyaratan penanganan data.
</Warning>

## Keamanan proposal

Peninjau berjalan dalam sesi terisolasi dengan cakupan alat yang sengaja
dibatasi:

- Peninjau hanya dapat mencantumkan atau memeriksa proposal Workshop serta membuat atau merevisi satu
  proposal tertunda.
- Peninjau tidak dapat memperbarui skill aktif, menerapkan proposal, menolak proposal, mengarantina
  proposal, mengirim pesan, atau menggunakan alat agen umum.
- Satu anggaran mutasi digunakan bersama di seluruh percobaan ulang model, sehingga peninjauan dapat membuat atau
  merevisi paling banyak satu proposal.
- Lintasan yang ditinjau diperlakukan sebagai bukti yang tidak tepercaya, bukan sebagai instruksi
  bagi agen latar belakang.
- Skill Workshop memindai konten proposal dan menolak kredensial literal yang dikenali
  sebelum status proposal ditulis.

Batas normal Workshop tetap berlaku, termasuk `maxPending`, `maxSkillBytes`,
batasan file pendukung, pemeriksaan pemindai, dan penulisan khusus ruang kerja. Pengaturan
`approvalPolicy: "auto"` tidak memberikan akses kepada peninjau latar belakang
ke tindakan siklus hidup.

## Meninjau proposal yang dipelajari

Pembelajaran mandiri menghasilkan proposal tertunda yang sama seperti penggunaan Workshop manual.
Periksa proposal sebelum menerapkannya:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Revisi, tolak, atau karantina proposal yang berguna tetapi belum siap:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Terlalu spesifik"
openclaw skills workshop quarantine <proposal-id> --reason "Memerlukan peninjauan keamanan"
```

Penerapan adalah satu-satunya operasi yang menulis `SKILL.md` aktif. Lihat
[Skill Workshop](/id/tools/skill-workshop) untuk model siklus hidup dan penyimpanan
lengkap.

## Konfigurasi

| Pengaturan                                 | Default  | Dampak pembelajaran mandiri                                                                                                       |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Mengaktifkan pengambilan koreksi langsung dan peninjauan pengalaman tertunda.                                                      |
| `skills.workshop.approvalPolicy`           | `"auto"` | Mengontrol prompt persetujuan untuk tindakan siklus hidup normal yang dimulai agen; pengaturan ini tidak memperluas izin peninjau latar belakang. |
| `skills.workshop.maxPending`               | `50`     | Membatasi proposal tertunda dan dikarantina per ruang kerja.                                                                      |
| `skills.workshop.maxSkillBytes`            | `40000`  | Membatasi ukuran isi proposal dalam byte.                                                                                          |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Hanya memengaruhi perilaku penerapan; pembelajaran mandiri itu sendiri menulis status proposal, bukan target skill aktif.          |

Untuk skema lengkap, rentang, dan pengaturan skill terkait, lihat
[Konfigurasi Skills](/id/tools/skills-config#workshop-skills-workshop).

## Pemecahan masalah

### Tidak ada proposal yang muncul setelah giliran panjang

Periksa semua hal berikut:

1. `skills.workshop.autonomous.enabled` bernilai `true` dalam konfigurasi Gateway aktif.
2. Giliran berhasil dan menyertakan sedikitnya sepuluh iterasi model setelah pesan
   pengguna terbaru.
3. Percakapan merupakan proses latar depan normal, bukan proses terjadwal, memori,
   hook, atau subagen.
4. Proses asal memiliki akses ke `skill_workshop` dan tidak berada dalam sandbox.
5. Sistem tetap menganggur cukup lama agar peninjauan tertunda dapat berjalan.
6. Proses Gateway berjangka panjang tetap aktif selama jendela menganggur; perintah
   lokal sekali jalan tidak menunggu peninjauan tertunda.

Peninjauan yang memenuhi syarat tetap mungkin tidak menghasilkan proposal. Tidak mengambil tindakan merupakan hasil yang
diharapkan ketika bukti tidak memenuhi standar prosedur yang dapat digunakan kembali.

### Doctor melaporkan bahwa alat Workshop disembunyikan

Ketika pembelajaran mandiri diaktifkan, `openclaw doctor` memeriksa apakah kebijakan
alat efektif milik agen default mengizinkan `skill_workshop`. Ikuti perubahan
`tools.allow` atau `tools.alsoAllow` yang dilaporkan, atau nonaktifkan pembelajaran mandiri.

### Terlalu banyak proposal bernilai rendah muncul

Nonaktifkan pembelajaran mandiri dan lanjutkan menggunakan `/learn` atau permintaan Workshop eksplisit:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Proposal tertunda tetap dapat ditinjau setelah fitur dinonaktifkan. Menonaktifkan
pembelajaran mandiri tidak menerapkan, menolak, atau menghapus proposal tersebut.

## Terkait

- [Lokakarya Skill](/id/tools/skill-workshop) untuk peninjauan proposal, persetujuan, dan
  penyimpanan
- [Membuat skill](/id/tools/creating-skills) untuk skill yang dibuat secara manual dan
  struktur `SKILL.md`
- [Konfigurasi Skills](/id/tools/skills-config) untuk semua pengaturan `skills.*`
- [CLI Skills](/id/cli/skills) untuk perintah Lokakarya dan kurator
