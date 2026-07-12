---
read_when:
    - Menggunakan /steer atau /tell saat agen sedang berjalan
    - Membandingkan /steer dengan mode /queue
    - Menentukan apakah akan mengarahkan proses yang sedang berjalan atau sesi ACP
sidebarTitle: Steer
summary: Arahkan proses aktif tanpa mengubah mode antrean
title: Kendalikan
x-i18n:
    generated_at: "2026-07-12T14:48:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` terlebih dahulu mencoba mengirim panduan ke proses yang sudah aktif. Perintah ini digunakan untuk
momen “sesuaikan proses ini selagi masih berjalan”. Jika runtime saat ini
tidak dapat menerima pengarahan, OpenClaw akan mengirim pesan tersebut sebagai prompt biasa
alih-alih membuangnya.

## Sesi saat ini

Gunakan `/steer` tingkat atas untuk menargetkan proses aktif pada sesi saat ini:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Perilaku:

- Hanya menargetkan proses aktif pada sesi saat ini.
- Berfungsi secara independen dari mode `/queue` sesi.
- Memulai giliran biasa dengan pesan yang sama ketika sesi sedang menganggur atau
  proses aktif tidak dapat menerima pengarahan.
- Menggunakan jalur pengarahan runtime aktif, sehingga model melihat panduan pada
  batas runtime berikutnya yang didukung.

## Pengarahan dibandingkan antrean

`/queue steer` membuat pesan masuk biasa mencoba mengarahkan proses aktif ketika
pesan tersebut tiba saat proses sedang aktif. `/steer <message>` adalah perintah eksplisit
yang mencoba menyuntikkan pesan perintah tersebut ke dalam proses aktif pada batas
runtime berikutnya yang didukung, terlepas dari pengaturan `/queue` yang tersimpan. Ketika
penyuntikan tersebut tidak tersedia, awalan perintah dihapus dan `<message>`
dilanjutkan sebagai prompt biasa.

Gunakan:

- `/steer <message>` ketika Anda ingin mengarahkan proses aktif sekarang juga.
- `/queue steer` ketika Anda ingin pesan biasa berikutnya mengarahkan proses aktif secara
  bawaan.
- `/queue collect` atau `/queue followup` ketika pesan biasa berikutnya harus menunggu
  giliran selanjutnya alih-alih mengarahkan proses aktif.
- `/queue interrupt` ketika pesan terbaru harus menggantikan proses aktif
  alih-alih mengarahkannya.

Untuk mode antrean dan batas pengarahan, lihat [Antrean perintah](/id/concepts/queue) dan
[Antrean pengarahan](/id/concepts/queue-steering).

## Subagen

`/steer` tingkat atas menargetkan proses aktif pada sesi saat ini. Subagen melaporkan
kembali ke sesi induk/pemintanya; `/subagents` hanya untuk visibilitas.

## Sesi ACP

Gunakan `/acp steer` ketika targetnya adalah sesi harness ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Lihat [Agen ACP](/id/tools/acp-agents) untuk pemilihan sesi ACP dan perilaku
runtime.

## Terkait

- [Perintah garis miring](/id/tools/slash-commands)
- [Antrean perintah](/id/concepts/queue)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Subagen](/id/tools/subagents)
