---
doc-schema-version: 1
read_when:
    - Anda ingin OpenClaw tetap menampilkan satu tujuan sepanjang sesi yang panjang
    - Anda perlu menjeda, melanjutkan, memblokir, menyelesaikan, atau menghapus sasaran sesi
    - Anda ingin memahami alat `get_goal`, `create_goal`, dan `update_goal`
    - Anda ingin melihat bagaimana sasaran ditampilkan di TUI
summary: 'Tujuan sesi: sasaran per sesi yang persisten, kontrol /goal, alat tujuan model, anggaran token, dan status TUI'
title: Tujuan
x-i18n:
    generated_at: "2026-07-12T14:41:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Sasaran

**Sasaran** adalah satu tujuan tetap yang dilampirkan ke sesi OpenClaw saat ini.
Sasaran memberi agen dan operator target bersama untuk pekerjaan jangka panjang,
tanpa mengubah target tersebut menjadi tugas latar belakang, pengingat, tugas Cron, atau
perintah tetap.

Sasaran merupakan status sesi: sasaran mengikuti kunci sesi, tetap tersedia setelah
proses dimulai ulang, dan muncul di `/goal`, alat sasaran yang diakses model, serta
bagian bawah TUI.

## Mulai cepat

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal edit get CI green for PR 87469, push the fix, and update docs
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` bersifat opsional: `/goal get CI green for PR 87469` juga membuat sasaran,
karena teks apa pun setelah `/goal` yang bukan kata tindakan yang dikenal akan dianggap sebagai
tujuan baru.

## Kegunaan sasaran

Gunakan sasaran ketika sesi memiliki hasil konkret yang harus tetap terlihat
selama banyak giliran:

- Penyelesaian PR: perbaiki, verifikasi, lakukan peninjauan otomatis, dorong perubahan, lalu buka atau perbarui PR.
- Proses pengawakutuan: reproduksi bug, identifikasi permukaan pemiliknya, tambal, lalu
  buktikan perbaikannya.
- Peninjauan dokumentasi: baca dokumentasi yang relevan, tulis halaman baru, tambahkan tautan silang, lalu
  verifikasi pembangunan dokumentasi.
- Tugas pemeliharaan: periksa status saat ini, buat perubahan terbatas, jalankan
  pemeriksaan yang tepat, lalu laporkan perubahan yang dibuat.

Sasaran bukan antrean tugas. Gunakan [Alur Tugas](/id/automation/taskflow),
[tugas](/id/automation/tasks), [tugas Cron](/id/automation/cron-jobs), atau
[perintah tetap](/id/automation/standing-orders) ketika pekerjaan harus berjalan secara terpisah,
berulang sesuai jadwal, dikembangkan menjadi subpekerjaan terkelola, atau dipertahankan sebagai kebijakan.

## Referensi perintah

`/goal` tanpa argumen menampilkan ringkasan sasaran saat ini:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Perintah                                            | Efek                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `/goal` atau `/goal status`                         | Tampilkan sasaran saat ini.                                                |
| `/goal start <objective>`                           | Buat sasaran baru untuk sesi saat ini.                                     |
| `/goal set <objective>`, `/goal create <objective>` | Alias untuk `start`.                                                       |
| `/goal <objective>`                                 | Juga membuat sasaran baru (teks apa pun yang bukan kata tindakan yang dikenal). |
| `/goal edit <objective>`                            | Ubah redaksi tujuan saat ini; status dan penghitungan token tetap sama.    |
| `/goal pause [note]`                                | Jeda sasaran aktif.                                                        |
| `/goal resume [note]`                               | Lanjutkan sasaran yang dijeda, terblokir, dibatasi penggunaan, atau dibatasi anggaran. |
| `/goal complete [note]`                             | Tandai sasaran sebagai tercapai.                                           |
| `/goal done [note]`                                 | Alias untuk `complete`.                                                    |
| `/goal block [note]`                                | Tandai sasaran sebagai terblokir.                                          |
| `/goal blocked [note]`                              | Alias untuk `block`.                                                       |
| `/goal clear`                                       | Hapus sasaran dari sesi.                                                   |

Hanya satu sasaran yang dapat ada dalam satu sesi pada suatu waktu. Memulai sasaran kedua akan gagal
dengan `Goal error: goal already exists` sampai sasaran saat ini dihapus.

`/goal start` tidak menerima flag anggaran token; anggaran hanya dapat ditetapkan
melalui alat `create_goal` yang diakses model.

## Status

- `active`: sesi sedang mengupayakan sasaran.
- `paused`: operator menjeda sasaran; `/goal resume` membuatnya aktif
  kembali.
- `blocked`: agen atau operator melaporkan penghambat nyata; `/goal resume`
  membuatnya aktif kembali saat informasi atau status baru tersedia.
- `budget_limited`: anggaran token yang dikonfigurasi telah tercapai; `/goal resume`
  memulai ulang upaya untuk tujuan yang sama dengan jendela anggaran baru.
- `usage_limited`: disediakan untuk status penghentian karena batas penggunaan di masa mendatang; `/goal
resume` memulai ulang upaya dengan cara yang sama.
- `complete`: sasaran telah tercapai. Sasaran yang selesai bersifat terminal; gunakan `/goal
clear` sebelum memulai sasaran lain.

`/new` dan `/reset` menghapus sasaran sesi saat ini karena keduanya memang
memulai konteks sesi baru.

## Anggaran token

Sasaran dapat memiliki anggaran token positif opsional yang ditetapkan melalui
parameter `token_budget` pada alat `create_goal`. Anggaran diukur dari
jumlah token baru sesi pada saat sasaran dibuat. Jika sesi hanya memiliki
rekam cuplikan token yang usang atau tidak diketahui saat sasaran dimulai, OpenClaw menunggu
rekam cuplikan baru berikutnya dan menggunakannya sebagai nilai dasar, sehingga token yang digunakan sebelum
sasaran dibuat tidak dibebankan kepadanya.

Ketika penggunaan mencapai anggaran, sasaran berpindah ke `budget_limited`. Hal ini
tidak menghapus sasaran atau tujuan; status ini memberi tahu operator dan
agen bahwa sasaran tidak lagi diupayakan secara aktif sampai dilanjutkan atau
dihapus. Melanjutkannya akan memulai jendela anggaran baru berdasarkan jumlah token baru
saat ini.

Anggaran token adalah batas pengaman sasaran sesi, bukan batas penagihan. Kuota
penyedia, pelaporan biaya, dan perilaku jendela konteks tetap menggunakan
kontrol penggunaan dan model OpenClaw yang normal.

## Alat model

OpenClaw menyediakan tiga alat sasaran untuk kerangka agen:

| Alat          | Tujuan                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `get_goal`    | Baca sasaran sesi saat ini: status, tujuan, penggunaan token, dan anggaran token.                                            |
| `create_goal` | Buat sasaran hanya ketika pengguna atau instruksi sistem memintanya secara eksplisit. Gagal jika sesi sudah memiliki sasaran. |
| `update_goal` | Tandai sasaran sebagai `complete` atau `blocked`.                                                                            |

Model tidak dapat secara diam-diam menjeda, melanjutkan, menghapus, atau mengganti sasaran. Tindakan tersebut tetap menjadi
kontrol operator/sesi melalui `/goal` dan perintah pengaturan ulang, sehingga agen
dapat melaporkan pencapaian atau penghambat nyata tanpa diam-diam mengubah
target.

`update_goal` hanya boleh menandai sasaran sebagai `complete` ketika tujuan
benar-benar tercapai. Alat ini hanya boleh menandai sasaran sebagai `blocked` setelah kondisi
penghambat yang sama berulang selama setidaknya tiga giliran sasaran berturut-turut, bukan karena
kesulitan biasa atau penyempurnaan yang belum selesai.

## Konteks sasaran pada setiap giliran

Setiap giliran pengguna/obrolan dengan sasaran aktif menyertakan baris konteks peran pengguna berikut:

```text
Active goal: <objective> — advance it or update its status (get_goal/update_goal).
```

OpenClaw menjaga baris tetap ringkas dengan memotong tujuan yang panjang. Sasaran yang dijeda,
terblokir, dibatasi anggaran, dibatasi penggunaan, dan selesai tidak disisipkan,
sehingga penghentian oleh operator tetap berlaku sampai sasaran dilanjutkan.

## UI Kontrol

UI Kontrol web menampilkan sasaran sebagai pil ringkas di atas penyusun obrolan:
ikon status, label status (misalnya `Pursuing goal`), tujuan yang dipotong,
dan pengatur waktu berjalan langsung.

Pil tersebut memiliki kontrol sebaris:

- **Pensil** mengisi penyusun terlebih dahulu dengan `/goal edit <objective>` agar
  tujuan dapat dirumuskan ulang dan dikirim.
- **Jeda / lanjutkan** beralih antara `/goal pause` dan `/goal resume` berdasarkan
  status saat ini.
- **Tempat sampah** mengirim `/goal clear`.
- **Chevron** memperluas pil untuk menampilkan tujuan lengkap, catatan status
  terbaru, penggunaan token, dan waktu yang telah berlalu.

Tombol tindakan disembunyikan saat penyusun tidak dapat mengirim (misalnya
ketika koneksi Gateway terputus); chevron perluasan tetap berfungsi.

## TUI

Bagian bawah TUI menjaga sasaran sesi aktif tetap terlihat di samping bidang agen,
sesi, dan model, sebelum indikator token/mode.

Contoh bagian bawah:

- `Pursuing goal (12k/50k)` untuk sasaran aktif dengan anggaran token.
- `Goal paused (/goal resume)` untuk sasaran yang dijeda.
- `Goal blocked (/goal resume)` untuk sasaran yang terblokir.
- `Goal hit usage limits (/goal resume)` untuk sasaran yang dibatasi penggunaan.
- `Goal unmet (50k/50k)` untuk sasaran yang dibatasi anggaran.
- `Goal achieved (42k)` untuk sasaran yang selesai.

Bagian bawah sengaja dibuat ringkas. Gunakan `/goal` untuk melihat tujuan lengkap,
catatan, anggaran token, dan perintah yang tersedia.

## Perilaku kanal

`/goal` berfungsi dalam sesi OpenClaw yang mendukung perintah, termasuk TUI dan
permukaan obrolan yang mengizinkan perintah teks. Status sasaran dilampirkan ke
kunci sesi, bukan transportasi, sehingga dua permukaan yang menggunakan kunci sesi yang sama akan melihat
sasaran yang sama.

Status sasaran bukan arahan pengiriman: status tersebut tidak memaksa balasan melalui
kanal, mengubah perilaku antrean, menyetujui alat, atau menjadwalkan pekerjaan.

## Pemecahan masalah

| Pesan                                  | Arti                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | Sesi sudah memiliki sasaran. Gunakan `/goal` untuk memeriksanya, `/goal complete` jika sudah selesai, atau `/goal clear` sebelum memulai tujuan lain. |
| `Goal error: goal not found`           | Sesi belum memiliki sasaran. Mulai dengan `/goal start <objective>`.                                                                                  |
| `Goal error: goal is already complete` | Sasaran bersifat terminal. Hapus sasaran tersebut sebelum memulai atau melanjutkan tujuan lain.                                                        |

Jika penggunaan token menampilkan `0` atau terlihat usang, sesi aktif mungkin belum memiliki
rekam cuplikan token baru. Penggunaan diperbarui saat OpenClaw mencatat penggunaan sesi
dan total yang berasal dari transkrip.

## Terkait

- [Perintah garis miring](/id/tools/slash-commands)
- [TUI](/id/web/tui)
- [Alat sesi](/id/concepts/session-tool)
- [Compaction](/id/concepts/compaction)
- [Alur Tugas](/id/automation/taskflow)
- [Perintah tetap](/id/automation/standing-orders)
