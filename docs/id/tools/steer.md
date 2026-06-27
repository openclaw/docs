---
read_when:
    - Menggunakan /steer atau /tell saat agen sudah berjalan
    - Membandingkan mode /steer dengan /queue
    - Memutuskan apakah akan mengarahkan proses berjalan saat ini atau sesi ACP
sidebarTitle: Steer
summary: Arahkan proses aktif tanpa mengubah mode antrean
title: Arahkan
x-i18n:
    generated_at: "2026-06-27T18:21:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` pertama-tama mencoba mengirim panduan ke eksekusi yang sudah aktif. Ini untuk momen
"sesuaikan eksekusi ini saat masih bekerja". Jika runtime saat ini
tidak dapat menerima pengarahan, OpenClaw mengirim pesan sebagai masukan normal sebagai gantinya,
bukan membuangnya.

## Sesi saat ini

Gunakan `/steer` tingkat atas untuk menargetkan eksekusi aktif untuk sesi saat ini:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Perilaku:

- Hanya menargetkan eksekusi aktif sesi saat ini.
- Bekerja secara independen dari mode `/queue` sesi.
- Memulai giliran normal dengan pesan yang sama saat sesi sedang idle atau
  eksekusi aktif tidak dapat menerima pengarahan.
- Menggunakan jalur pengarahan runtime aktif, sehingga model melihat panduan pada
  batas runtime berikutnya yang didukung.

## Steer vs antrean

`/queue steer` membuat pesan masuk normal mencoba mengarahkan eksekusi aktif saat
pesan tiba ketika eksekusi sedang aktif. `/steer <message>` adalah perintah eksplisit
yang mencoba menyuntikkan pesan perintah tersebut ke eksekusi aktif pada batas
runtime berikutnya yang didukung, terlepas dari pengaturan `/queue` yang tersimpan. Saat
penyuntikan itu tidak tersedia, prefiks perintah dihapus dan `<message>`
berlanjut sebagai masukan normal.

Gunakan:

- `/steer <message>` saat Anda ingin memandu eksekusi aktif sekarang.
- `/queue steer` saat Anda ingin pesan normal berikutnya mengarahkan eksekusi aktif secara
  default.
- `/queue collect` atau `/queue followup` saat pesan normal berikutnya harus menunggu
  giliran berikutnya alih-alih mengarahkan eksekusi aktif.
- `/queue interrupt` saat pesan terbaru harus menggantikan eksekusi aktif
  alih-alih mengarahkannya.

Untuk mode antrean dan batas pengarahan, lihat [Antrean perintah](/id/concepts/queue) dan
[Antrean pengarahan](/id/concepts/queue-steering).

## Sub-agen

`/steer` tingkat atas menargetkan eksekusi aktif sesi saat ini. Sub-agen melapor
kembali ke sesi induk/peminta mereka; `/subagents` hanya untuk visibilitas.

## Sesi ACP

Gunakan `/acp steer` saat targetnya adalah sesi harness ACP:

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
