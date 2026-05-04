---
read_when:
    - Menjelaskan cara pengarahan berperilaku saat agen menggunakan alat
    - Mengubah perilaku antrean proses aktif atau integrasi pengarahan lingkungan eksekusi
    - Membandingkan mode steer, queue, collect, dan followup
summary: Bagaimana pengarahan proses aktif mengantrekan pesan pada batas runtime
title: Antrean pengarahan
x-i18n:
    generated_at: "2026-05-04T02:23:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Saat pesan tiba ketika proses sesi sudah melakukan streaming, OpenClaw dapat
mengirim pesan itu ke runtime aktif alih-alih memulai proses lain untuk sesi
yang sama. Mode publik bersifat netral terhadap runtime; Pi dan harness app-server
Codex native menerapkan detail pengirimannya secara berbeda.

## Batas runtime

Steering tidak menghentikan panggilan alat yang sudah berjalan. Pi memeriksa
pesan steering yang mengantre pada batas model:

1. Asisten meminta panggilan alat.
2. Pi menjalankan batch panggilan alat dari pesan asisten saat ini.
3. Pi memancarkan peristiwa akhir giliran.
4. Pi menguras pesan steering yang mengantre.
5. Pi menambahkan pesan tersebut sebagai pesan pengguna sebelum panggilan LLM berikutnya.

Ini menjaga hasil alat tetap berpasangan dengan pesan asisten yang memintanya,
lalu memungkinkan panggilan model berikutnya melihat masukan pengguna terbaru.

Harness app-server Codex native mengekspos `turn/steer` alih-alih antrean
steering internal Pi. OpenClaw mengadaptasi mode yang sama di sana:

- `steer` mengelompokkan pesan yang mengantre selama jendela hening yang
  dikonfigurasi, lalu mengirim satu permintaan `turn/steer` dengan semua masukan
  pengguna yang terkumpul sesuai urutan kedatangan.
- `queue` mempertahankan bentuk serialisasi lama dengan mengirim permintaan
  `turn/steer` terpisah.
- `followup`, `collect`, `steer-backlog`, dan `interrupt` tetap menjadi perilaku
  antrean milik OpenClaw di sekitar giliran Codex yang aktif.

Giliran peninjauan Codex dan compaction manual menolak steering dalam giliran
yang sama. Ketika runtime tidak dapat menerima steering, OpenClaw kembali ke
antrean tindak lanjut jika mode tersebut mengizinkannya.

Halaman ini menjelaskan steering mode antrean untuk pesan masuk normal. Untuk
perintah eksplisit `/steer <message>`, lihat [Steer](/tools/steer).

## Mode

| Mode            | Perilaku proses aktif                                                                                                        | Perilaku tindak lanjut berikutnya                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `steer`         | Menyisipkan semua pesan steering yang mengantre secara bersama-sama pada batas runtime berikutnya. Ini adalah default.        | Kembali ke tindak lanjut hanya ketika steering tidak tersedia.                          |
| `queue`         | Steering lama satu per satu. Pi menyisipkan satu pesan antrean per batas model; Codex mengirim permintaan `turn/steer` terpisah. | Kembali ke tindak lanjut hanya ketika steering tidak tersedia.                          |
| `steer-backlog` | Perilaku steering proses aktif yang sama seperti `steer`.                                                                    | Juga mempertahankan pesan yang sama untuk giliran tindak lanjut berikutnya.             |
| `followup`      | Tidak melakukan steering pada proses saat ini.                                                                               | Menjalankan pesan yang mengantre nanti.                                                 |
| `collect`       | Tidak melakukan steering pada proses saat ini.                                                                               | Menggabungkan pesan antrean yang kompatibel ke satu giliran berikutnya setelah jendela debounce. |
| `interrupt`     | Membatalkan proses aktif, lalu memulai pesan terbaru.                                                                        | Tidak ada.                                                                              |

## Contoh lonjakan

Jika empat pengguna mengirim pesan saat agen sedang menjalankan panggilan alat:

- `steer`: runtime aktif menerima keempat pesan sesuai urutan kedatangan sebelum
  keputusan model berikutnya. Pi mengurasnya pada batas model berikutnya; Codex
  menerimanya sebagai satu `turn/steer` yang dibatch.
- `queue`: steering serialisasi lama. Pi menyisipkan satu pesan antrean dalam
  satu waktu; Codex menerima permintaan `turn/steer` terpisah.
- `collect`: OpenClaw menunggu sampai proses aktif berakhir, lalu membuat giliran
  tindak lanjut dengan pesan antrean yang kompatibel setelah jendela debounce.

## Cakupan

Steering selalu menargetkan proses sesi aktif saat ini. Ini tidak membuat sesi
baru, mengubah kebijakan alat proses aktif, atau memisahkan pesan berdasarkan
pengirim. Di kanal multipengguna, prompt masuk sudah menyertakan konteks
pengirim dan rute, sehingga panggilan model berikutnya dapat melihat siapa yang
mengirim setiap pesan.

Gunakan `collect` saat Anda ingin OpenClaw membuat giliran tindak lanjut nanti
yang dapat menggabungkan pesan yang kompatibel dan mempertahankan kebijakan
penghapusan antrean tindak lanjut. Gunakan `queue` hanya saat Anda memerlukan
perilaku steering lama satu per satu.

## Debounce

`messages.queue.debounceMs` berlaku untuk pengiriman tindak lanjut, termasuk
`collect`, `followup`, `steer-backlog`, dan fallback `steer` ketika steering
proses aktif tidak tersedia. Untuk Pi, `steer` aktif itu sendiri tidak menggunakan
timer debounce karena Pi secara alami membatch pesan sampai batas model
berikutnya. Untuk harness Codex native, OpenClaw menggunakan nilai debounce yang
sama sebagai jendela hening sebelum mengirim `turn/steer` yang dibatch.

## Terkait

- [Antrean perintah](/id/concepts/queue)
- [Steer](/tools/steer)
- [Pesan](/id/concepts/messages)
- [Loop agen](/id/concepts/agent-loop)
