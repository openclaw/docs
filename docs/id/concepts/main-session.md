---
read_when:
    - Anda ingin memahami di mana agen Anda "berada"
    - Anda mengharapkan konteks yang sama baik saat menulis di Telegram, WhatsApp, maupun web
    - Anda ingin agen Anda mengetahui apa yang terjadi dalam grup dan utas sampingan
summary: 'Satu percakapan berkelanjutan di seluruh channel Anda: default agen pribadi'
title: Sesi utama
x-i18n:
    generated_at: "2026-07-19T16:36:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb77382ebdce269a05a03ab6fa39b44b1e9f1856166f1d9cb79111dccb547f69
    source_path: concepts/main-session.md
    workflow: 16
---

OpenClaw adalah agen pribadi pertama-tama. Secara bawaan, setiap pesan langsung yang Anda
kirim kepadanya — dari Telegram, WhatsApp, iMessage, DM Slack, aplikasi web, di mana pun —
masuk ke dalam **satu percakapan berkelanjutan**: sesi utama. Tanyakan sesuatu melalui
ponsel Anda, lanjutkan dari laptop, dan agen memiliki konteks yang sama di kedua
tempat. Hanya ada satu otak, dan di sinilah ia berpikir.

Di balik layar, sesi utama adalah sesi biasa dengan kunci
`agent:<agentId>:main` (misalnya `agent:main:main`). Yang membuatnya istimewa
adalah cakupan DM bawaan menggabungkan semua pesan langsung ke dalamnya, dan
bagian sistem lainnya memperlakukannya sebagai akar agen: heartbeat membangunkannya,
pekerjaan latar belakang melaporkan kembali kepadanya, dan aktivitas di tempat lain mengalir kepadanya.

## Beranda

Di aplikasi web, sesi utama adalah halaman **Beranda** — entri pertama di
bilah sisi. Baris identitas di bagian atas adalah agen Anda (klik untuk membuka menu
agen); Beranda adalah tempat Anda berbicara dengannya. Sesi yang bercabang dari
percakapan utama muncul di bawah **Utas**, percakapan grup di bawah **Grup**, dan
sesi pengodean/CLI di bawah **Pengodean**.

## Yang mengalir ke sesi utama

Sesi utama bukan sekadar log percakapan; ini adalah tempat dunia agen Anda
berpadu:

- **Aktivitas grup.** Sesi grup dan ruang tetap terisolasi (lihat di bawah), tetapi
  dalam cakupan DM bawaan, sesi utama secara otomatis memantaunya.
  Aktivitas mengantre sebagai pemberitahuan ringkas — digabungkan per percakapan, tidak pernah
  satu kali membangunkan per pesan — dan agen melihatnya saat dijalankan berikutnya: ketika
  Anda mengirim pesan berikutnya atau saat heartbeat terjadwal. Agen juga dapat membaca
  sesi yang dipantaunya, sehingga pertanyaan "apa yang saya lewatkan di grup keluarga?" dapat dijawab.
- **Pekerjaan latar belakang.** Subagen dan sesi yang dibuat mengumumkan hasilnya
  kembali ke sesi yang memulainya, sehingga pekerjaan yang dimulai agen dari
  Beranda dilaporkan kembali ke Beranda.
- **Heartbeat.** Heartbeat terjadwal menargetkan sesi utama, yang
  mengubah pemberitahuan dalam antrean menjadi kesadaran bahkan ketika Anda belum menulis apa pun.

## Memori lintas pengaturan ulang dan percakapan

Percakapan berkelanjutan dibatasi oleh jendela konteks model, sehingga
kesinambungan berasal dari lapisan-lapisan di sekitarnya:

- `MEMORY.md`, memori jangka panjang yang dikurasi oleh agen, dimuat ke setiap
  sesi baru. Catatan harian (`memory/YYYY-MM-DD.md`) dapat dicari sesuai kebutuhan
  dan catatan terbaru dimuat kembali setelah `/new` atau `/reset`. Sebelum Compaction,
  agen menyimpan fakta yang perlu dipertahankan ke dalam catatan harian agar percakapan panjang
  tidak kehilangannya tanpa disadari.
- **Pengingatan memori lintas percakapan** memungkinkan agen mengingat konten dari
  sesi privat lainnya. Pada konfigurasi pribadi — `session.dmScope`
  global yang ditetapkan menjadi `main` tanpa penggantian DM per pengikatan — fitur ini
  diaktifkan secara bawaan; setiap isolasi DM yang dikonfigurasi akan menonaktifkannya kecuali Anda
  mengaktifkannya secara eksplisit. Lihat [Konfigurasi memori](/id/reference/memory-config).

## Sesi berkelanjutan dengan riwayat yang tahan lama

Sesi utama terus berlanjut melalui pengaturan ulang dan Compaction, alih-alih
membuat model membawa seluruh riwayatnya sekaligus:

- Secara bawaan, tidak ada pengaturan ulang otomatis; Compaction menjaga konteks aktif
  tetap terbatas sambil mempertahankan sesi berkelanjutan. Pengaturan ulang harian dan saat menganggur
  bersifat opsional (lihat [Pengelolaan sesi](/id/concepts/session)). Pada `/new` dan `/reset`,
  bagian akhir percakapan yang berakhir disimpan ke catatan memori harian, dan
  sesi berikutnya memuat kembali catatan terbaru. Pengaturan ulang menetapkan id sesi aktif baru, tetapi
  menjaga transkrip SQLite sebelumnya tetap dapat dicari dengan kunci sesi utama
  yang sama.
- Saat percakapan mendekati jendela konteks, Compaction merangkum
  dan melanjutkan di tempat — riwayat transkrip tetap berada di penyimpanan sesi.
- Daftar sesi menampilkan percakapan aktif saat ini, bukan setiap id sesi
  historis di baliknya.
- Saat basis data fisik, WAL, dan artefak sesi dalam penyimpanan per agen
  melampaui batas disk (bawaan 10 GB), OpenClaw mengekstrak riwayat tanpa referensi
  yang paling lama ke arsip terkompresi terverifikasi sebelum menghapus baris
  basis datanya. Sesi aktif, yang dirutekan, dan yang sedang berlangsung tidak pernah menjadi korban batas anggaran.

## Saat Anda menginginkan isolasi

Sesi utama bersama merupakan pilihan bawaan yang tepat untuk agen yang hanya berkomunikasi
dengan Anda. Jika beberapa orang dapat mengirim pesan kepada agen Anda, isolasikan DM:

```json5
{
  session: {
    dmScope: "per-channel-peer",
  },
}
```

Dengan cakupan yang mengisolasi, setiap pengirim mendapatkan sesinya sendiri, pemantauan grup
dari sesi utama dinonaktifkan, dan pengingatan memori lintas percakapan
dinonaktifkan secara bawaan. `openclaw security audit` merekomendasikan isolasi ketika mendeteksi
beberapa pengirim DM. Matriks cakupan lengkap, penautan identitas, dan penggantian
per rute dibahas dalam [Pengelolaan sesi](/id/concepts/session) dan
[Perutean saluran](/id/channels/channel-routing).

## Terkait

- [Pengelolaan sesi](/id/concepts/session) — perutean, cakupan, pengaturan ulang
- [Perutean saluran](/id/channels/channel-routing) — cara agen dan sesi dipilih
- [Memori](/id/concepts/memory) — lapisan memori yang tahan lama
- [Multiagen](/id/concepts/multi-agent) — menjalankan beberapa agen terisolasi
