---
read_when:
    - Menjelaskan cara kerja steer saat agen menggunakan alat
    - Mengubah perilaku antrean proses aktif atau integrasi pengarah runtime
    - Membandingkan steering dengan mode antrean followup, collect, dan interrupt
summary: Cara pengarahan proses aktif mengantrekan pesan pada batas runtime
title: Antrean pengarahan
x-i18n:
    generated_at: "2026-07-20T03:50:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 131f04f19934b9b1f6dd8ffb2cf2428950c319483abdc2ccdecec741809cda2a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Ketika prompt normal tiba saat proses sesi sudah melakukan streaming dan mode antrean adalah `steer` (bawaan, tidak memerlukan konfigurasi), OpenClaw mencoba mengirimkan prompt tersebut ke runtime aktif. OpenClaw dan harness app-server Codex native menerapkan detail pengiriman secara berbeda.

Halaman ini membahas pengarahan mode antrean untuk pesan masuk normal dalam mode `steer`. Dalam mode `followup` atau `collect`, pesan normal melewati jalur ini dan menunggu hingga proses aktif selesai. Untuk perintah eksplisit `/steer <message>`, lihat [Arahkan](/id/tools/steer).

## Batas runtime

Pengarahan tidak menginterupsi panggilan alat yang sudah berjalan. OpenClaw memeriksa pesan pengarahan yang mengantre pada batas model:

1. Asisten meminta panggilan alat.
2. OpenClaw mengeksekusi batch panggilan alat dari pesan asisten saat ini.
3. OpenClaw memancarkan peristiwa akhir giliran.
4. OpenClaw menguras pesan pengarahan yang mengantre.
5. OpenClaw menambahkan pesan tersebut sebagai pesan pengguna sebelum panggilan LLM berikutnya.

Ini menjaga agar hasil alat tetap berpasangan dengan pesan asisten yang memintanya, lalu memungkinkan panggilan model berikutnya melihat masukan pengguna terbaru.

Harness app-server Codex native menyediakan `turn/steer`, bukan antrean pengarahan internal runtime OpenClaw. OpenClaw mengelompokkan prompt yang mengantre selama jendela hening yang dikonfigurasi, lalu mengirim satu permintaan `turn/steer` dengan seluruh masukan pengguna yang terkumpul sesuai urutan kedatangan.

Giliran review Codex dan compaction manual menolak pengarahan pada giliran yang sama. Ketika runtime tidak dapat menerima pengarahan dalam mode `steer`, OpenClaw menunggu proses aktif selesai sebelum memulai prompt.

## Mode

| Mode        | Perilaku proses aktif                                  | Perilaku selanjutnya                                                                 |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | Mengarahkan prompt ke runtime aktif jika memungkinkan. | Menunggu proses aktif selesai jika pengarahan tidak tersedia.                       |
| `followup`  | Tidak mengarahkan.                                     | Menjalankan pesan yang mengantre nanti setelah proses aktif berakhir.               |
| `collect`   | Tidak mengarahkan.                                     | Menggabungkan pesan antrean yang kompatibel menjadi satu giliran berikutnya setelah jendela debounce. |
| `interrupt` | Membatalkan proses aktif alih-alih mengarahkannya.     | Memulai pesan terbaru setelah pembatalan.                                           |

## Contoh rentetan

Jika empat pengguna mengirim pesan saat agen sedang mengeksekusi panggilan alat:

- Dengan perilaku bawaan, runtime aktif menerima keempat pesan sesuai urutan kedatangan sebelum keputusan model berikutnya. OpenClaw mengurasnya pada batas model berikutnya; Codex menerimanya sebagai satu `turn/steer` yang dikelompokkan.
- Dengan `/queue collect`, OpenClaw tidak mengarahkan. OpenClaw menunggu hingga proses aktif berakhir, lalu membuat giliran tindak lanjut berisi pesan antrean yang kompatibel setelah jendela debounce.
- Dengan `/queue interrupt`, OpenClaw membatalkan proses aktif dan memulai pesan terbaru alih-alih mengarahkan.

## Cakupan

Pengarahan selalu menargetkan proses sesi aktif saat ini. Tindakan ini tidak membuat sesi baru, mengubah kebijakan alat proses aktif, atau memisahkan pesan berdasarkan pengirim. Di saluran multipengguna, prompt masuk sudah menyertakan konteks pengirim dan rute, sehingga panggilan model berikutnya dapat melihat siapa yang mengirim setiap pesan.

Gunakan `followup` atau `collect` jika Anda ingin pesan mengantre secara bawaan, alih-alih mengarahkan proses aktif. Gunakan `interrupt` jika prompt terbaru harus menggantikan proses aktif.

## Debounce

Debounce antrean bawaan berlaku untuk pengiriman `followup` dan `collect` yang mengantre. Dalam mode `steer` dengan harness Codex native, debounce ini juga menetapkan jendela hening sebelum mengirim `turn/steer` yang dikelompokkan. Untuk OpenClaw, pengarahan aktif itu sendiri tidak menggunakan pengatur waktu debounce karena OpenClaw secara alami mengelompokkan pesan hingga batas model berikutnya.

## Terkait

- [Antrean perintah](/id/concepts/queue)
- [Arahkan](/id/tools/steer)
- [Pesan](/id/concepts/messages)
- [Perulangan agen](/id/concepts/agent-loop)
