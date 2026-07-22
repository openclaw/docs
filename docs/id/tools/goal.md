---
doc-schema-version: 1
read_when:
    - Anda ingin OpenClaw menjaga satu tujuan tetap terlihat sepanjang sesi yang panjang
    - Anda perlu menjeda, melanjutkan, memblokir, menyelesaikan, atau menghapus sasaran sesi
    - Anda ingin memahami alat get_goal, create_goal, dan update_goal
    - Anda ingin melihat bagaimana tujuan ditampilkan di TUI
summary: 'Tujuan sesi: sasaran persisten per sesi, kontrol /goal, alat tujuan model, anggaran token, dan status TUI'
title: Tujuan
x-i18n:
    generated_at: "2026-07-22T01:27:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8bfe25eb9901394b32b61729fbcb6a7bd711ed859d284fa39b637000ed7f0a18
    source_path: tools/goal.md
    workflow: 16
---

# Sasaran

**Sasaran** adalah satu tujuan berkelanjutan yang ditautkan ke sesi OpenClaw saat ini.
Sasaran memberi agen dan operator target bersama untuk pekerjaan jangka panjang,
tanpa mengubah target tersebut menjadi tugas latar belakang, pengingat, tugas Cron, atau
perintah tetap.

Sasaran merupakan status sesi: sasaran berpindah bersama kunci sesi, bertahan setelah
proses dimulai ulang, dan muncul di `/goal`, alat sasaran yang diakses model, serta footer TUI.

Penyelesaian perintah terpisah kembali ke utas yang ditampilkan kepada pengguna tempat perintah berasal, sehingga
giliran berikutnya tetap melihat sasaran yang sama meskipun eksekusi perintah menggunakan
sesi dengan kebijakan sandbox terpisah.

## Mulai cepat

```text
/goal start buat CI berhasil untuk PR 87469 dan push perbaikannya
/goal
/goal edit buat CI berhasil untuk PR 87469, push perbaikannya, dan perbarui dokumentasi
/goal pause menunggu CI
/goal resume
/goal complete sudah di-push dan diverifikasi
/goal clear
```

`start` bersifat opsional: `/goal get CI green for PR 87469` juga membuat sasaran,
karena teks apa pun setelah `/goal` yang bukan kata tindakan yang dikenal akan diperlakukan sebagai
tujuan baru.

## Kegunaan sasaran

Gunakan sasaran ketika suatu sesi memiliki hasil konkret yang harus tetap terlihat
selama banyak giliran:

- Penyelesaian PR: perbaiki, verifikasi, lakukan review otomatis, push, serta buka atau perbarui PR.
- Proses debug: reproduksi bug, identifikasi permukaan pemiliknya, terapkan patch, dan
  buktikan perbaikannya.
- Penyempurnaan dokumentasi: baca dokumentasi yang relevan, tulis halaman baru, tambahkan tautan silang, dan
  verifikasi build dokumentasi.
- Tugas pemeliharaan: periksa status saat ini, buat perubahan terbatas, jalankan
  pemeriksaan yang tepat, dan laporkan perubahan yang dibuat.

Sasaran bukan antrean tugas. Gunakan [Task Flow](/id/automation/taskflow),
[tugas](/id/automation/tasks), [tugas Cron](/id/automation/cron-jobs), atau
[perintah tetap](/id/automation/standing-orders) ketika pekerjaan harus berjalan secara terpisah,
diulang sesuai jadwal, dibagi menjadi subpekerjaan terkelola, atau dipertahankan sebagai kebijakan.

## Referensi perintah

`/goal` tanpa argumen menampilkan ringkasan sasaran saat ini:

```text
Sasaran
Status: aktif
Tujuan: buat CI berhasil untuk PR 87469 dan push perbaikannya
Token yang digunakan: 12k
Anggaran token: 12k/50k

Perintah: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Perintah                                            | Efek                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` atau `/goal status`                           | Tampilkan sasaran saat ini.                                              |
| `/goal start <objective>`                           | Buat sasaran baru untuk sesi saat ini.                                   |
| `/goal set <objective>`, `/goal create <objective>` | Alias untuk `start`.                                                     |
| `/goal <objective>`                                 | Juga membuat sasaran baru (teks apa pun yang bukan kata tindakan yang dikenali). |
| `/goal edit <objective>`                            | Susun ulang kata-kata tujuan saat ini; status dan penghitungan token tetap sama. |
| `/goal pause [note]`                                | Jeda sasaran aktif.                                                       |
| `/goal resume [note]`                               | Lanjutkan sasaran yang dijeda, terblokir, dibatasi penggunaan, atau dibatasi anggaran. |
| `/goal complete [note]`                             | Tandai sasaran sebagai tercapai.                                         |
| `/goal done [note]`                                 | Alias untuk `complete`.                                                    |
| `/goal block [note]`                                | Tandai sasaran sebagai terblokir.                                        |
| `/goal blocked [note]`                              | Alias untuk `block`.                                                       |
| `/goal clear`                                       | Hapus sasaran dari sesi.                                                  |

Hanya satu sasaran yang dapat ada dalam satu sesi pada satu waktu. Memulai sasaran kedua akan gagal
dengan `Goal error: goal already exists` hingga sasaran saat ini dihapus.

`/goal start` tidak menerima flag anggaran token; anggaran hanya dapat ditetapkan
melalui alat `create_goal` yang diakses model.

## Status

- `active`: sesi sedang mengupayakan sasaran.
- `paused`: operator menjeda sasaran; `/goal resume` membuatnya aktif
  kembali.
- `blocked`: agen atau operator melaporkan penghambat nyata; `/goal resume`
  membuatnya aktif kembali ketika informasi atau status baru tersedia.
- `budget_limited`: anggaran token yang dikonfigurasi telah tercapai; `/goal resume`
  memulai ulang upaya dari tujuan yang sama dengan jendela anggaran baru.
- `usage_limited`: dicadangkan untuk status penghentian karena batas penggunaan di masa mendatang; `/goal
resume` memulai ulang upaya dengan cara yang sama.
- `complete`: sasaran telah tercapai. Sasaran yang selesai bersifat terminal; gunakan `/goal
clear` sebelum memulai sasaran lain.

`/new` dan `/reset` menghapus sasaran sesi saat ini karena keduanya sengaja
memulai konteks sesi baru.

## Anggaran token

Sasaran dapat memiliki anggaran token positif opsional, yang ditetapkan melalui
parameter `token_budget` milik alat `create_goal`. Anggaran diukur mulai dari
jumlah token terbaru sesi pada saat sasaran dibuat. Jika sesi hanya memiliki
snapshot token usang atau tidak diketahui saat sasaran dimulai, OpenClaw menunggu
snapshot terbaru berikutnya dan menggunakannya sebagai patokan, sehingga token yang digunakan sebelum
sasaran ada tidak dibebankan kepadanya.

Ketika penggunaan mencapai anggaran, sasaran beralih ke `budget_limited`. Hal ini tidak
menghapus sasaran atau tujuan; hal ini memberi tahu operator dan
agen bahwa sasaran tidak lagi diupayakan secara aktif hingga dilanjutkan atau
dihapus. Melanjutkan sasaran akan memulai jendela anggaran baru pada jumlah token terbaru
saat ini.

Anggaran token adalah batas pengaman sasaran sesi, bukan batas tagihan. Kuota
penyedia, pelaporan biaya, dan perilaku jendela konteks tetap menggunakan kontrol
penggunaan dan model OpenClaw yang normal.

## Alat model

OpenClaw menyediakan tiga alat sasaran kepada harness agen:

| Alat          | Tujuan                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Baca sasaran sesi saat ini: status, tujuan, penggunaan token, dan anggaran token.                                        |
| `create_goal` | Buat sasaran hanya ketika pengguna atau instruksi sistem memintanya secara eksplisit. Gagal jika sesi sudah memiliki sasaran. |
| `update_goal` | Tandai sasaran sebagai `complete` atau `blocked`.                                                                                   |

Model tidak dapat secara diam-diam menjeda, melanjutkan, menghapus, atau mengganti sasaran. Tindakan tersebut tetap
menjadi kontrol operator/sesi melalui `/goal` dan perintah reset, sehingga agen
dapat melaporkan pencapaian atau penghambat nyata tanpa diam-diam mengubah
target.

`update_goal` hanya boleh menandai sasaran sebagai `complete` ketika tujuannya
benar-benar tercapai. Alat tersebut hanya boleh menandai sasaran sebagai `blocked` setelah kondisi
penghambat yang sama berulang selama setidaknya tiga giliran sasaran berturut-turut, bukan karena
kesulitan biasa atau penyempurnaan yang belum dilakukan.

## Konteks sasaran pada setiap giliran

Setiap giliran pengguna/chat dengan sasaran aktif menyertakan baris konteks peran pengguna berikut:

```text
Sasaran aktif: <objective> — lanjutkan atau perbarui statusnya (get_goal/update_goal).
```

OpenClaw menjaga agar baris tersebut tetap ringkas dengan memotong tujuan yang panjang. Sasaran yang dijeda,
terblokir, dibatasi anggaran, dibatasi penggunaan, dan selesai tidak disisipkan,
sehingga penghentian oleh operator tetap berlaku hingga sasaran dilanjutkan.

## UI Kontrol

UI Kontrol web menampilkan sasaran sebagai pil ringkas di atas penulis chat:
ikon status, label status (misalnya `Pursuing goal`), tujuan yang dipotong,
dan pewaktu berlalu langsung.

Pil tersebut menyediakan kontrol sebaris:

- **Pensil** mengisi penulis terlebih dahulu dengan `/goal edit <objective>` agar
  tujuan dapat disusun ulang dan dikirim.
- **Jeda / lanjutkan** beralih antara `/goal pause` dan `/goal resume` berdasarkan
  status saat ini.
- **Tempat sampah** mengirim `/goal clear`.
- **Chevron** memperluas pil untuk menampilkan tujuan lengkap, catatan status
  terbaru, penggunaan token, dan waktu berlalu.

Tombol tindakan disembunyikan ketika penulis tidak dapat mengirim (misalnya
ketika koneksi Gateway terputus); chevron perluasan tetap berfungsi.

## TUI

Footer TUI menjaga agar sasaran sesi aktif tetap terlihat di samping bidang agen,
sesi, dan model, sebelum indikator token/mode.

Contoh footer:

- `Pursuing goal (12k/50k)` untuk sasaran aktif dengan anggaran token.
- `Goal paused (/goal resume)` untuk sasaran yang dijeda.
- `Goal blocked (/goal resume)` untuk sasaran yang terblokir.
- `Goal hit usage limits (/goal resume)` untuk sasaran yang dibatasi penggunaan.
- `Goal unmet (50k/50k)` untuk sasaran yang dibatasi anggaran.
- `Goal achieved (42k)` untuk sasaran yang selesai.

Footer sengaja dibuat ringkas. Gunakan `/goal` untuk tujuan lengkap,
catatan, anggaran token, dan perintah yang tersedia.

## Perilaku kanal

`/goal` berfungsi dalam sesi OpenClaw yang mendukung perintah, termasuk TUI dan
permukaan chat yang mengizinkan perintah teks. Status sasaran ditautkan ke
kunci sesi, bukan transportasi, sehingga dua permukaan yang menggunakan kunci sesi yang sama akan melihat
sasaran yang sama.

Status sasaran bukan arahan pengiriman: status tersebut tidak memaksa balasan melalui
kanal, mengubah perilaku antrean, menyetujui alat, atau menjadwalkan pekerjaan.

## Pemecahan masalah

| Pesan                                  | Arti                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | Sesi sudah memiliki sasaran. Gunakan `/goal` untuk memeriksanya, `/goal complete` jika sudah selesai, atau `/goal clear` sebelum memulai tujuan lain. |
| `Goal error: goal not found`           | Sesi belum memiliki sasaran. Mulai sasaran dengan `/goal start <objective>`.                                                               |
| `Goal error: goal is already complete` | Sasaran bersifat terminal. Hapus sasaran sebelum memulai atau melanjutkan tujuan lain.                                                        |

Jika penggunaan token menampilkan `0` atau tampak usang, sesi aktif mungkin belum memiliki
snapshot token terbaru. Penggunaan diperbarui saat OpenClaw mencatat penggunaan sesi
dan total yang diperoleh dari transkrip.

## Terkait

- [Perintah garis miring](/id/tools/slash-commands)
- [TUI](/id/web/tui)
- [Alat sesi](/id/concepts/session-tool)
- [Compaction](/id/concepts/compaction)
- [Task Flow](/id/automation/taskflow)
- [Perintah tetap](/id/automation/standing-orders)
