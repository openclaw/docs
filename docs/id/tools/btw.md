---
read_when:
    - Anda ingin mengajukan pertanyaan sampingan singkat tentang sesi saat ini
    - Anda sedang mengimplementasikan atau men-debug perilaku BTW di berbagai klien
summary: Pertanyaan sampingan sementara dengan /btw
title: Sebagai tambahan, pertanyaan sampingan
x-i18n:
    generated_at: "2026-05-03T21:37:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` memungkinkan Anda mengajukan pertanyaan sampingan cepat tentang **sesi saat ini** tanpa
mengubah pertanyaan itu menjadi riwayat percakapan normal. `/side` adalah alias.

Ini dimodelkan setelah perilaku `/btw` milik Claude Code, tetapi disesuaikan dengan
Gateway dan arsitektur multi-kanal OpenClaw.

## Apa yang dilakukannya

Saat Anda mengirim:

```text
/btw what changed?
```

OpenClaw:

1. mengambil snapshot konteks sesi saat ini,
2. menjalankan panggilan model **tanpa alat** terpisah,
3. menjawab hanya pertanyaan sampingan,
4. membiarkan eksekusi utama tetap berjalan,
5. **tidak** menulis pertanyaan atau jawaban BTW ke riwayat sesi,
6. memancarkan jawaban sebagai **hasil samping langsung**, bukan pesan asisten normal.

Model mental yang penting adalah:

- konteks sesi yang sama
- kueri sampingan sekali jalan yang terpisah
- tanpa panggilan alat
- tanpa pencemaran konteks mendatang
- tanpa persistensi transkrip

## Apa yang tidak dilakukannya

`/btw` **tidak**:

- membuat sesi persisten baru,
- melanjutkan tugas utama yang belum selesai,
- menjalankan alat atau loop alat agen,
- menulis data pertanyaan/jawaban BTW ke riwayat transkrip,
- muncul di `chat.history`,
- bertahan setelah muat ulang.

Ini sengaja dibuat **sementara**.

## Cara kerja konteks

BTW menggunakan sesi saat ini hanya sebagai **konteks latar belakang**.

Jika eksekusi utama sedang aktif, OpenClaw mengambil snapshot status pesan saat ini
dan menyertakan prompt utama yang sedang berjalan sebagai konteks latar belakang, sambil
secara eksplisit memberi tahu model:

- jawab hanya pertanyaan sampingan,
- jangan melanjutkan atau menyelesaikan tugas utama yang belum selesai,
- jangan memancarkan panggilan alat atau panggilan alat semu.

Itu menjaga BTW tetap terisolasi dari eksekusi utama sambil tetap membuatnya mengetahui
topik sesi.

## Model pengiriman

BTW **tidak** dikirim sebagai pesan transkrip asisten normal.

Pada tingkat protokol Gateway:

- chat asisten normal menggunakan event `chat`
- BTW menggunakan event `chat.side_result`

Pemisahan ini disengaja. Jika BTW menggunakan ulang jalur event `chat` normal,
klien akan memperlakukannya seperti riwayat percakapan reguler.

Karena BTW menggunakan event langsung terpisah dan tidak diputar ulang dari
`chat.history`, ia menghilang setelah muat ulang.

## Perilaku permukaan

### TUI

Di TUI, BTW dirender inline di tampilan sesi saat ini, tetapi tetap
sementara:

- terlihat berbeda dari balasan asisten normal
- dapat ditutup dengan `Enter` atau `Esc`
- tidak diputar ulang saat muat ulang

### Kanal eksternal

Pada kanal seperti Telegram, WhatsApp, dan Discord, BTW dikirim sebagai
balasan sekali pakai yang diberi label jelas karena permukaan tersebut tidak memiliki konsep
overlay sementara lokal.

Jawaban tetap diperlakukan sebagai hasil samping, bukan riwayat sesi normal.

### UI Kontrol / web

Gateway memancarkan BTW dengan benar sebagai `chat.side_result`, dan BTW tidak disertakan
dalam `chat.history`, sehingga kontrak persistensi sudah benar untuk web.

UI Kontrol saat ini masih memerlukan konsumen `chat.side_result` khusus untuk
merender BTW secara langsung di browser. Sampai dukungan sisi klien tersebut hadir, BTW adalah
fitur tingkat Gateway dengan perilaku TUI dan kanal eksternal penuh, tetapi belum
menjadi UX browser yang lengkap.

## Kapan menggunakan BTW

Gunakan `/btw` saat Anda menginginkan:

- klarifikasi cepat tentang pekerjaan saat ini,
- jawaban sampingan faktual sementara eksekusi panjang masih berlangsung,
- jawaban sementara yang tidak boleh menjadi bagian dari konteks sesi mendatang.

Contoh:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Kapan tidak menggunakan BTW

Jangan gunakan `/btw` saat Anda ingin jawaban menjadi bagian dari
konteks kerja mendatang sesi.

Dalam kasus itu, ajukan pertanyaan secara normal di sesi utama alih-alih menggunakan BTW.

## Terkait

- [Perintah slash](/id/tools/slash-commands)
- [Tingkat Berpikir](/id/tools/thinking)
- [Sesi](/id/concepts/session)
