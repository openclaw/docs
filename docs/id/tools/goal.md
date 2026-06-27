---
doc-schema-version: 1
read_when:
    - Anda ingin OpenClaw tetap menampilkan satu tujuan sepanjang sesi yang panjang
    - Anda perlu menjeda, melanjutkan, memblokir, menyelesaikan, atau menghapus tujuan sesi
    - Anda ingin memahami alat get_goal, create_goal, dan update_goal
    - Anda ingin melihat bagaimana tujuan muncul di TUI
summary: 'Tujuan sesi: sasaran per sesi yang persisten, kontrol /goal, alat tujuan model, anggaran token, dan status TUI'
title: Tujuan
x-i18n:
    generated_at: "2026-06-27T18:19:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# Tujuan

**Tujuan** adalah satu sasaran tahan lama yang melekat pada sesi OpenClaw saat ini.
Ini memberi agen dan operator target bersama untuk pekerjaan jangka panjang,
tanpa mengubah target tersebut menjadi tugas latar belakang, pengingat, tugas cron, atau
perintah tetap.

Tujuan adalah status sesi. Tujuan berpindah bersama kunci sesi, bertahan setelah
proses dimulai ulang, muncul di `/goal`, tersedia bagi model melalui alat tujuan,
dan muncul di footer TUI saat sesi aktif memilikinya.

## Mulai cepat

Tetapkan tujuan:

```text
/goal start get CI green for PR 87469 and push the fix
```

Periksa:

```text
/goal
```

Jeda saat pekerjaan memang sedang menunggu:

```text
/goal pause waiting for CI
```

Lanjutkan:

```text
/goal resume
```

Tandai selesai:

```text
/goal complete pushed and verified
```

Hapus:

```text
/goal clear
```

## Kegunaan tujuan

Gunakan tujuan saat sebuah sesi memiliki hasil konkret yang harus tetap terlihat
di banyak giliran:

- Penutupan PR: perbaiki, verifikasi, autoreview, push, dan buka atau perbarui PR.
- Sesi debug: reproduksi bug, identifikasi surface pemiliknya, tambal, dan buktikan
  perbaikannya.
- Pemeriksaan docs: baca docs yang relevan, tulis halaman baru, tautkan silang, dan
  verifikasi build docs.
- Tugas pemeliharaan: periksa status saat ini, buat perubahan terbatas, jalankan
  pemeriksaan yang tepat, dan laporkan apa yang berubah.

Tujuan bukan antrean tugas. Gunakan [Task Flow](/id/automation/taskflow),
[tugas](/id/automation/tasks), [pekerjaan Cron](/id/automation/cron-jobs), atau
[perintah tetap](/id/automation/standing-orders) saat pekerjaan harus berjalan terlepas,
berulang sesuai jadwal, bercabang menjadi sub-pekerjaan terkelola, atau bertahan sebagai kebijakan.

## Referensi perintah

`/goal` tanpa argumen mencetak ringkasan tujuan saat ini:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

Perintah:

- `/goal` atau `/goal status` menampilkan tujuan saat ini.
- `/goal start <objective>` membuat tujuan baru untuk sesi saat ini.
- `/goal set <objective>` dan `/goal create <objective>` adalah alias untuk
  `start`.
- `/goal pause [note]` menjeda tujuan aktif.
- `/goal resume [note]` melanjutkan tujuan yang dijeda, terblokir, dibatasi penggunaan, atau
  dibatasi anggaran.
- `/goal complete [note]` menandai tujuan telah tercapai.
- `/goal done [note]` adalah alias untuk `complete`.
- `/goal block [note]` menandai tujuan terblokir.
- `/goal blocked [note]` adalah alias untuk `block`.
- `/goal clear` menghapus tujuan dari sesi.

Hanya satu tujuan yang dapat ada pada satu sesi dalam satu waktu. Memulai tujuan kedua akan gagal
hingga tujuan saat ini dihapus.

## Status

Tujuan menggunakan kumpulan status kecil:

- `active`: sesi sedang mengejar tujuan.
- `paused`: operator menjeda tujuan; `/goal resume` membuatnya aktif lagi.
- `blocked`: agen atau operator melaporkan penghambat nyata; `/goal resume`
  membuatnya aktif lagi saat informasi atau status baru tersedia.
- `budget_limited`: anggaran token yang dikonfigurasi telah tercapai; `/goal resume`
  memulai ulang pengejaran dari objektif yang sama.
- `usage_limited`: dicadangkan untuk status berhenti batas penggunaan; `/goal resume`
  memulai ulang pengejaran saat diizinkan.
- `complete`: tujuan telah tercapai. Tujuan selesai bersifat terminal; gunakan
  `/goal clear` sebelum memulai tujuan lain.

`/new` dan `/reset` menghapus tujuan sesi saat ini karena keduanya sengaja
memulai konteks sesi baru.

## Anggaran token

Tujuan dapat memiliki anggaran token positif opsional. Anggaran disimpan bersama
tujuan dan diukur dari hitungan token baru sesi pada waktu pembuatan. Jika
sesi saat ini hanya memiliki penggunaan token yang usang atau tidak diketahui saat tujuan dimulai,
OpenClaw menunggu snapshot token sesi baru berikutnya dan menggunakannya sebagai
baseline, sehingga token yang digunakan sebelum tujuan ada tidak dibebankan ke tujuan.

Saat penggunaan token mencapai anggaran, tujuan berubah menjadi `budget_limited`. Ini
tidak menghapus tujuan atau menghapus objektif. Ini memberi tahu operator dan
agen bahwa tujuan tidak lagi dikejar secara aktif hingga dilanjutkan atau
dihapus.

Anggaran token adalah pembatas untuk tujuan sesi, bukan batas penagihan. Kuota penyedia,
pelaporan biaya, dan perilaku jendela konteks tetap menggunakan kontrol penggunaan
dan model OpenClaw normal.

## Alat model

OpenClaw mengekspos tiga alat tujuan inti ke harness agen:

- `get_goal`: membaca tujuan sesi saat ini, termasuk status, objektif, penggunaan
  token, dan anggaran token.
- `create_goal`: membuat tujuan hanya saat instruksi pengguna, sistem, atau developer
  secara eksplisit memintanya. Ini gagal jika sesi sudah memiliki
  tujuan.
- `update_goal`: menandai tujuan `complete` atau `blocked`.

Model tidak dapat diam-diam menjeda, melanjutkan, menghapus, atau mengganti tujuan. Itu adalah
kontrol operator/sesi melalui `/goal` dan perintah reset. Ini mencegah
agen mengubah target secara diam-diam sambil mempertahankan jalur bersih bagi
agen untuk melaporkan pencapaian atau penghambat sungguhan.

Alat `update_goal` harus menandai tujuan `complete` hanya saat objektif
benar-benar tercapai. Alat ini harus menandai tujuan `blocked` hanya saat kondisi
penghambat yang sama telah berulang dan agen tidak dapat membuat kemajuan bermakna tanpa
input pengguna baru atau perubahan status eksternal.

## TUI

TUI menjaga tujuan sesi aktif tetap terlihat di footer di sebelah
agen, sesi, model, kontrol run, dan hitungan token.

Contoh footer:

- `Pursuing goal (12k/50k)` untuk tujuan aktif dengan anggaran token.
- `Goal paused (/goal resume)` untuk tujuan yang dijeda.
- `Goal blocked (/goal resume)` untuk tujuan yang terblokir.
- `Goal hit usage limits (/goal resume)` untuk tujuan yang dibatasi penggunaan.
- `Goal unmet (50k/50k)` untuk tujuan yang dibatasi anggaran.
- `Goal achieved (42k)` untuk tujuan yang selesai.

Footer sengaja ringkas. Gunakan `/goal` untuk objektif lengkap, catatan,
anggaran token, dan perintah yang tersedia.

## Perilaku channel

Perintah `/goal` berfungsi dalam sesi OpenClaw yang mendukung perintah, termasuk
TUI dan surface chat yang mengizinkan perintah teks. Status tujuan melekat pada
kunci sesi, bukan transport. Jika dua surface menggunakan sesi yang sama, keduanya melihat
tujuan yang sama.

Status tujuan bukan direktif pengiriman. Ini tidak memaksa balasan melalui sebuah
channel, mengubah perilaku antrean, menyetujui alat, atau menjadwalkan pekerjaan.

## Pemecahan masalah

`Goal error: goal already exists` berarti sesi sudah memiliki tujuan. Gunakan
`/goal` untuk memeriksanya, `/goal complete` jika sudah selesai, atau `/goal clear` sebelum
memulai objektif lain.

`Goal error: goal not found` berarti sesi belum memiliki tujuan. Mulai satu dengan
`/goal start <objective>`.

`Goal error: goal is already complete` berarti tujuan bersifat terminal. Hapus
sebelum memulai atau melanjutkan objektif lain.

Jika penggunaan token terlihat seperti `0` atau usang, sesi aktif mungkin belum memiliki
snapshot token baru. Penggunaan diperbarui saat OpenClaw mencatat penggunaan sesi dan
total turunan transkrip.

## Terkait

- [Perintah slash](/id/tools/slash-commands)
- [TUI](/id/web/tui)
- [Alat sesi](/id/concepts/session-tool)
- [Compaction](/id/concepts/compaction)
- [Task Flow](/id/automation/taskflow)
- [Perintah tetap](/id/automation/standing-orders)
