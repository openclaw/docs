---
read_when:
    - Menggunakan /steer atau /tell saat agen sudah berjalan
    - Membandingkan mode /steer dengan /queue
    - Memutuskan apakah akan mengarahkan proses saat ini atau sesi ACP
sidebarTitle: Steer
summary: Arahkan proses aktif tanpa mengubah mode antrean
title: Kendalikan
x-i18n:
    generated_at: "2026-07-19T05:13:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d420e14982d52520e415103ffa6d86923fad6f13c43ff7741ebbd8dde0d0073f
    source_path: tools/steer.md
    workflow: 16
---

`/steer` terlebih dahulu mencoba mengirim panduan ke proses yang sudah aktif. Ini ditujukan untuk
momen "sesuaikan proses ini saat masih berjalan". Jika runtime saat ini
tidak dapat menerima pengarahan, OpenClaw akan mengirim pesan tersebut sebagai prompt normal
alih-alih mengabaikannya.

## Sesi saat ini

Gunakan `/steer` tingkat teratas untuk menargetkan proses aktif bagi sesi saat ini:

```text
/steer prioritaskan patch yang lebih kecil dan pertahankan fokus pengujian
/tell buat ringkasan sebelum melakukan panggilan alat berikutnya
```

Perilaku:

- Hanya menargetkan proses aktif dalam sesi saat ini.
- Berfungsi secara independen dari mode `/queue` sesi.
- Memulai giliran normal dengan pesan yang sama saat sesi tidak aktif atau
  proses aktif tidak dapat menerima pengarahan.
- Menggunakan jalur pengarahan runtime aktif, sehingga model melihat panduan tersebut pada
  batas runtime berikutnya yang didukung.

## Pengarahan vs antrean

`/queue steer` membuat pesan masuk normal mencoba mengarahkan proses aktif ketika
pesan tersebut tiba saat suatu proses sedang aktif. `/steer <message>` adalah perintah eksplisit
yang mencoba menyisipkan pesan perintah tersebut ke proses aktif pada batas
runtime berikutnya yang didukung, terlepas dari pengaturan `/queue` yang tersimpan. Jika
penyisipan tersebut tidak tersedia, prefiks perintah dihapus dan `<message>`
dilanjutkan sebagai prompt normal.

Perintah eksplisit `/steer` (dan `/tell`) didukung oleh Gateway. Di
`openclaw chat` atau `openclaw tui --local`, pilih `/queue steer` dan kirim
panduan sebagai pesan normal; runtime tertanam menerapkan kebijakan pengarahan
yang sama tanpa meneruskan perintah Gateway.

Gunakan:

- `/steer <message>` ketika Anda ingin memandu proses aktif sekarang juga.
- `/queue steer` ketika Anda ingin pesan normal berikutnya mengarahkan proses aktif secara
  default.
- `/queue collect` atau `/queue followup` ketika pesan normal berikutnya harus menunggu
  giliran selanjutnya alih-alih mengarahkan proses aktif.
- `/queue interrupt` ketika pesan terbaru harus menggantikan proses aktif
  alih-alih mengarahkannya.

Untuk mode antrean dan batas pengarahan, lihat [Antrean perintah](/id/concepts/queue) dan
[Antrean pengarahan](/id/concepts/queue-steering).

## Subagen

`/steer` tingkat teratas menargetkan proses aktif dalam sesi saat ini. Subagen melapor
kembali ke sesi induk/pemintanya; `/subagents` hanya untuk visibilitas.

## Sesi ACP

Gunakan `/acp steer` jika targetnya adalah sesi harness ACP:

```text
/acp steer --session agent:main:acp:codex persempit reproduksinya
```

Lihat [Agen ACP](/id/tools/acp-agents) untuk pemilihan sesi ACP dan perilaku
runtime.

## Terkait

- [Perintah garis miring](/id/tools/slash-commands)
- [Antrean perintah](/id/concepts/queue)
- [Antrean pengarahan](/id/concepts/queue-steering)
- [Subagen](/id/tools/subagents)
