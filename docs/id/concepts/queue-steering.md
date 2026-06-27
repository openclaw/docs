---
read_when:
    - Menjelaskan bagaimana steer berperilaku saat agen menggunakan alat
    - Mengubah perilaku antrean active-run atau integrasi pengarahan runtime
    - Membandingkan pengarahan dengan mode antrean tindak lanjut, pengumpulan, dan interupsi
summary: Cara pengarahan active-run mengantrekan pesan pada batas runtime
title: Antrean pengarah
x-i18n:
    generated_at: "2026-06-27T17:26:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

Saat prompt normal tiba ketika run sesi sudah streaming, OpenClaw
mencoba mengirim prompt tersebut ke runtime aktif secara default saat mode antrean
adalah `steer`. Tidak diperlukan entri konfigurasi maupun direktif antrean untuk perilaku
default tersebut. OpenClaw dan harness app-server Codex native menerapkan detail
pengiriman dengan cara berbeda.

## Batas runtime

Steering tidak menginterupsi pemanggilan alat yang sudah berjalan. OpenClaw memeriksa
pesan steering yang diantrekan pada batas model:

1. Asisten meminta pemanggilan alat.
2. OpenClaw menjalankan batch pemanggilan alat dari pesan asisten saat ini.
3. OpenClaw memancarkan peristiwa akhir giliran.
4. OpenClaw mengosongkan pesan steering yang diantrekan.
5. OpenClaw menambahkan pesan tersebut sebagai pesan pengguna sebelum pemanggilan LLM berikutnya.

Ini menjaga hasil alat tetap berpasangan dengan pesan asisten yang memintanya,
lalu memungkinkan pemanggilan model berikutnya melihat input pengguna terbaru.

Harness app-server Codex native mengekspos `turn/steer`, bukan antrean steering internal
runtime OpenClaw. OpenClaw mengelompokkan prompt yang diantrekan selama jendela
hening yang dikonfigurasi, lalu mengirim satu permintaan `turn/steer` dengan semua input
pengguna yang terkumpul dalam urutan kedatangan.

Giliran tinjauan Codex dan Compaction manual menolak steering pada giliran yang sama. Saat
runtime tidak dapat menerima steering dalam mode `steer`, OpenClaw menunggu run aktif
selesai sebelum memulai prompt.

Halaman ini menjelaskan steering mode antrean untuk pesan masuk normal saat modenya
adalah `steer`. Jika modenya `followup` atau `collect`, pesan normal tidak masuk ke
jalur steering ini; pesan tersebut menunggu hingga run aktif selesai. Untuk perintah eksplisit
`/steer <message>`, lihat [Steer](/id/tools/steer).

## Mode

| Mode        | Perilaku run aktif                                    | Perilaku berikutnya                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | Mengarahkan prompt ke runtime aktif jika memungkinkan. | Menunggu run aktif selesai jika steering tidak tersedia.                      |
| `followup`  | Tidak melakukan steering.                                        | Menjalankan pesan yang diantrekan nanti setelah run aktif berakhir.                               |
| `collect`   | Tidak melakukan steering.                                        | Menggabungkan pesan antrean yang kompatibel ke dalam satu giliran berikutnya setelah jendela debounce. |
| `interrupt` | Membatalkan run aktif alih-alih melakukan steering.          | Memulai pesan terbaru setelah pembatalan.                                           |

## Contoh burst

Jika empat pengguna mengirim pesan saat agen sedang menjalankan pemanggilan alat:

- Dengan perilaku default, runtime aktif menerima keempat pesan dalam
  urutan kedatangan sebelum keputusan model berikutnya. OpenClaw mengosongkannya pada batas model berikutnya;
  Codex menerimanya sebagai satu `turn/steer` yang dibatch.
- Dengan `/queue collect`, OpenClaw tidak melakukan steering. OpenClaw menunggu hingga run aktif
  berakhir, lalu membuat giliran tindak lanjut dengan pesan antrean yang kompatibel setelah
  jendela debounce.
- Dengan `/queue interrupt`, OpenClaw membatalkan run aktif dan memulai pesan terbaru
  alih-alih melakukan steering.

## Cakupan

Steering selalu menargetkan run sesi aktif saat ini. Ini tidak membuat sesi baru,
mengubah kebijakan alat run aktif, atau memisahkan pesan berdasarkan pengirim. Dalam
kanal multi-pengguna, prompt masuk sudah menyertakan konteks pengirim dan rute, sehingga
pemanggilan model berikutnya dapat melihat siapa yang mengirim setiap pesan.

Gunakan `followup` atau `collect` jika Anda ingin pesan diantrekan secara default alih-alih
melakukan steering pada run aktif. Gunakan `interrupt` saat prompt terbaru harus
menggantikan run aktif.

## Debounce

`messages.queue.debounceMs` berlaku untuk pengiriman `followup` dan `collect` yang diantrekan.
Dalam mode `steer` dengan harness Codex native, ini juga menetapkan jendela hening
sebelum mengirim `turn/steer` yang dibatch. Untuk OpenClaw, steering aktif itu sendiri tidak menggunakan
timer debounce karena OpenClaw secara alami membatch pesan hingga batas model berikutnya.

## Terkait

- [Antrean perintah](/id/concepts/queue)
- [Steer](/id/tools/steer)
- [Pesan](/id/concepts/messages)
- [Loop agen](/id/concepts/agent-loop)
