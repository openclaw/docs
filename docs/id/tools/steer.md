---
read_when:
    - Menggunakan /steer atau /tell saat agen sudah berjalan
    - Membandingkan /steer dengan /queue steer
    - Menentukan apakah akan mengarahkan proses saat ini, sub-agen, atau sesi ACP
sidebarTitle: Steer
summary: Arahkan eksekusi aktif tanpa mengubah mode antrean
title: Arahkan
x-i18n:
    generated_at: "2026-05-04T07:08:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer` mengirim panduan ke eksekusi yang sudah aktif. Ini untuk momen "sesuaikan
eksekusi ini saat masih bekerja", bukan untuk memulai giliran baru.

## Sesi saat ini

Gunakan `/steer` tingkat atas untuk menargetkan eksekusi aktif untuk sesi saat ini:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Perilaku:

- Hanya menargetkan eksekusi aktif sesi saat ini.
- Bekerja secara independen dari mode `/queue` sesi.
- Tidak memulai eksekusi baru ketika sesi sedang menganggur.
- Membalas dengan peringatan ketika tidak ada eksekusi aktif untuk diarahkan.
- Menggunakan jalur pengarahan runtime aktif, sehingga model melihat panduan pada
  batas runtime berikutnya yang didukung.

## Pengarahan vs antrean

`/queue steer` mengubah perilaku pesan masuk normal ketika pesan tersebut tiba
saat eksekusi sedang aktif. `/steer <message>` adalah perintah eksplisit yang mencoba
menyuntikkan pesan perintah tersebut ke eksekusi aktif pada batas runtime berikutnya
yang didukung, terlepas dari pengaturan `/queue` yang tersimpan.

Gunakan:

- `/steer <message>` ketika Anda ingin memandu eksekusi aktif sekarang.
- `/queue steer` ketika Anda ingin pesan normal berikutnya mengarahkan eksekusi aktif
  secara default.
- `/queue collect` atau `/queue followup` ketika pesan baru harus menunggu giliran
  berikutnya alih-alih mengarahkan eksekusi aktif.

Untuk mode antrean dan perilaku fallback, lihat [Antrean perintah](/id/concepts/queue) dan
[Antrean pengarahan](/id/concepts/queue-steering).

## Sub-agen

Gunakan `/subagents steer` ketika targetnya adalah eksekusi anak:

```text
/subagents steer 2 focus only on the API surface
```

`/steer` tingkat atas tidak memilih sub-agen berdasarkan id atau indeks daftar. Perintah ini selalu
menargetkan eksekusi aktif sesi saat ini. Lihat [Sub-agen](/id/tools/subagents) untuk
id, label, dan perintah kontrol sub-agen.

## Sesi ACP

Gunakan `/acp steer` ketika targetnya adalah sesi harness ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Lihat [Agen ACP](/id/tools/acp-agents) untuk pemilihan sesi ACP dan perilaku
runtime.

## Terkait

- [Perintah slash](/id/tools/slash-commands)
- [Antrean perintah](/id/concepts/queue)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Sub-agen](/id/tools/subagents)
