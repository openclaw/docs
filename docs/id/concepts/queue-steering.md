---
read_when:
    - Menjelaskan bagaimana steer berperilaku saat agen menggunakan alat
    - Mengubah perilaku antrean proses aktif atau integrasi pengarahan waktu jalan
    - Membandingkan mode steer, queue, collect, dan followup
summary: Cara pengarahan run aktif mengantrekan pesan di batas runtime
title: Antrean arahan
x-i18n:
    generated_at: "2026-04-30T09:45:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Ketika sebuah pesan tiba saat run sesi sudah melakukan streaming, OpenClaw dapat
mengirim pesan itu ke runtime aktif alih-alih memulai run lain untuk sesi yang
sama. Mode publik bersifat netral terhadap runtime; Pi dan harness app-server
Codex native mengimplementasikan detail pengirimannya secara berbeda.

## Batas Runtime

Pengarahan tidak menginterupsi pemanggilan alat yang sudah berjalan. Pi memeriksa
pesan pengarahan yang mengantre pada batas model:

1. Asisten meminta pemanggilan alat.
2. Pi mengeksekusi batch pemanggilan alat pesan asisten saat ini.
3. Pi memancarkan peristiwa akhir giliran.
4. Pi menguras pesan pengarahan yang mengantre.
5. Pi menambahkan pesan tersebut sebagai pesan pengguna sebelum panggilan LLM berikutnya.

Ini menjaga hasil alat tetap berpasangan dengan pesan asisten yang memintanya,
lalu memungkinkan panggilan model berikutnya melihat input pengguna terbaru.

Harness app-server Codex native mengekspos `turn/steer`, bukan antrean
pengarahan internal Pi. OpenClaw menyesuaikan mode yang sama di sana:

- `steer` membatch pesan yang mengantre selama jendela senyap yang dikonfigurasi, lalu mengirim
  satu permintaan `turn/steer` dengan semua input pengguna yang dikumpulkan dalam urutan kedatangan.
- `queue` mempertahankan bentuk berseri legacy dengan mengirim permintaan `turn/steer`
  terpisah.
- `followup`, `collect`, `steer-backlog`, dan `interrupt` tetap menjadi perilaku
  antrean milik OpenClaw di sekitar giliran Codex yang aktif.

Giliran peninjauan Codex dan Compaction manual menolak pengarahan dalam giliran
yang sama. Ketika runtime tidak dapat menerima pengarahan, OpenClaw beralih ke antrean followup jika
mode tersebut mengizinkannya.

## Mode

| Mode            | Perilaku run aktif                                                                                                          | Perilaku followup berikutnya                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Menyuntikkan semua pesan pengarahan yang mengantre bersama-sama pada batas runtime berikutnya. Ini adalah default.                             | Beralih ke followup hanya ketika pengarahan tidak tersedia.                           |
| `queue`         | Pengarahan legacy satu per satu. Pi menyuntikkan satu pesan yang mengantre per batas model; Codex mengirim permintaan `turn/steer` terpisah. | Beralih ke followup hanya ketika pengarahan tidak tersedia.                           |
| `steer-backlog` | Perilaku pengarahan run aktif yang sama seperti `steer`.                                                                                | Juga mempertahankan pesan yang sama untuk giliran followup nanti.                              |
| `followup`      | Tidak mengarahkan run saat ini.                                                                                              | Menjalankan pesan yang mengantre nanti.                                                         |
| `collect`       | Tidak mengarahkan run saat ini.                                                                                              | Menggabungkan pesan yang mengantre dan kompatibel menjadi satu giliran nanti setelah jendela debounce. |
| `interrupt`     | Membatalkan run aktif, lalu memulai pesan terbaru.                                                                       | Tidak ada.                                                                               |

## Contoh Lonjakan

Jika empat pengguna mengirim pesan saat agen sedang mengeksekusi pemanggilan alat:

- `steer`: runtime aktif menerima keempat pesan dalam urutan kedatangan sebelum
  keputusan model berikutnya. Pi mengurasnya pada batas model berikutnya; Codex
  menerimanya sebagai satu `turn/steer` yang dibatch.
- `queue`: pengarahan berseri legacy. Pi menyuntikkan satu pesan yang mengantre pada satu waktu;
  Codex menerima permintaan `turn/steer` terpisah.
- `collect`: OpenClaw menunggu hingga run aktif berakhir, lalu membuat giliran followup
  dengan pesan yang mengantre dan kompatibel setelah jendela debounce.

## Cakupan

Pengarahan selalu menargetkan run sesi aktif saat ini. Itu tidak membuat sesi
baru, mengubah kebijakan alat run aktif, atau memisahkan pesan berdasarkan pengirim. Di
kanal multi-pengguna, prompt masuk sudah menyertakan konteks pengirim dan rute, sehingga
panggilan model berikutnya dapat melihat siapa yang mengirim setiap pesan.

Gunakan `collect` ketika Anda ingin OpenClaw membangun giliran followup nanti yang dapat
menggabungkan pesan yang kompatibel dan mempertahankan kebijakan penghapusan antrean followup. Gunakan
`queue` hanya ketika Anda memerlukan perilaku pengarahan lama satu per satu.

## Debounce

`messages.queue.debounceMs` berlaku untuk pengiriman followup, termasuk `collect`,
`followup`, `steer-backlog`, dan fallback `steer` ketika pengarahan run aktif tidak
tersedia. Untuk Pi, `steer` aktif itu sendiri tidak menggunakan timer debounce karena
Pi secara alami membatch pesan hingga batas model berikutnya. Untuk harness
Codex native, OpenClaw menggunakan nilai debounce yang sama sebagai jendela senyap sebelum
mengirim `turn/steer` yang dibatch.

## Terkait

- [Antrean perintah](/id/concepts/queue)
- [Pesan](/id/concepts/messages)
- [Loop agen](/id/concepts/agent-loop)
