---
read_when:
    - Anda ingin mengajukan pertanyaan sampingan cepat tentang sesi saat ini
    - Anda sedang mengimplementasikan atau men-debug perilaku BTW di berbagai klien
summary: Pertanyaan sampingan sementara dengan /btw
title: Pertanyaan sampingan BTW
x-i18n:
    generated_at: "2026-04-24T09:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 15
---

`/btw` memungkinkan Anda mengajukan pertanyaan sampingan cepat tentang **sesi saat ini** tanpa
mengubah pertanyaan itu menjadi bagian dari riwayat percakapan normal.

Fitur ini dimodelkan berdasarkan perilaku `/btw` Claude Code, tetapi diadaptasi untuk
arsitektur Gateway dan multi-kanal milik OpenClaw.

## Apa yang dilakukan

Ketika Anda mengirim:

```text
/btw what changed?
```

OpenClaw:

1. mengambil snapshot konteks sesi saat ini,
2. menjalankan panggilan model **tanpa tool** yang terpisah,
3. menjawab hanya pertanyaan sampingan itu,
4. membiarkan run utama tetap berjalan,
5. **tidak** menulis pertanyaan atau jawaban BTW ke riwayat sesi,
6. mengeluarkan jawaban sebagai **hasil sampingan live** alih-alih pesan asisten normal.

Model mental yang penting adalah:

- konteks sesi yang sama
- kueri sampingan satu kali yang terpisah
- tanpa panggilan tool
- tanpa mencemari konteks masa depan
- tanpa persistensi transkrip

## Apa yang tidak dilakukan

`/btw` **tidak**:

- membuat sesi tahan lama baru,
- melanjutkan tugas utama yang belum selesai,
- menjalankan tool atau loop tool agen,
- menulis data pertanyaan/jawaban BTW ke riwayat transkrip,
- muncul di `chat.history`,
- bertahan setelah reload.

Fitur ini sengaja bersifat **sementara**.

## Cara kerja konteks

BTW menggunakan sesi saat ini hanya sebagai **konteks latar belakang**.

Jika run utama sedang aktif, OpenClaw mengambil snapshot status pesan saat ini
dan menyertakan prompt utama yang sedang berjalan sebagai konteks latar belakang, sambil
secara eksplisit memberi tahu model:

- jawab hanya pertanyaan sampingan,
- jangan melanjutkan atau menyelesaikan tugas utama yang belum selesai,
- jangan mengeluarkan panggilan tool atau pseudo-tool call.

Ini menjaga BTW tetap terisolasi dari run utama sambil tetap menyadari topik sesi tersebut.

## Model pengiriman

BTW **tidak** dikirim sebagai pesan transkrip asisten normal.

Pada tingkat protokol Gateway:

- obrolan asisten normal menggunakan event `chat`
- BTW menggunakan event `chat.side_result`

Pemisahan ini disengaja. Jika BTW menggunakan ulang jalur event `chat` normal,
klien akan memperlakukannya seperti riwayat percakapan biasa.

Karena BTW menggunakan event live terpisah dan tidak diputar ulang dari
`chat.history`, BTW akan hilang setelah reload.

## Perilaku permukaan

### TUI

Di TUI, BTW dirender inline dalam tampilan sesi saat ini, tetapi tetap
bersifat sementara:

- tampak berbeda jelas dari balasan asisten normal
- dapat ditutup dengan `Enter` atau `Esc`
- tidak diputar ulang saat reload

### Kanal eksternal

Pada kanal seperti Telegram, WhatsApp, dan Discord, BTW dikirim sebagai
balasan satu kali yang diberi label jelas karena permukaan tersebut tidak memiliki
konsep overlay sementara lokal.

Jawaban tetap diperlakukan sebagai hasil sampingan, bukan riwayat sesi normal.

### Control UI / web

Gateway mengeluarkan BTW dengan benar sebagai `chat.side_result`, dan BTW tidak disertakan
dalam `chat.history`, sehingga kontrak persistensinya sudah benar untuk web.

Control UI saat ini masih memerlukan consumer `chat.side_result` khusus untuk
merender BTW secara live di browser. Sampai dukungan sisi klien itu hadir, BTW adalah
fitur tingkat Gateway dengan perilaku TUI dan kanal eksternal yang lengkap, tetapi
belum menjadi UX browser yang lengkap.

## Kapan menggunakan BTW

Gunakan `/btw` ketika Anda menginginkan:

- klarifikasi cepat tentang pekerjaan saat ini,
- jawaban faktual sampingan saat run panjang masih berlangsung,
- jawaban sementara yang tidak boleh menjadi bagian dari konteks sesi di masa depan.

Contoh:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Kapan tidak menggunakan BTW

Jangan gunakan `/btw` ketika Anda ingin jawaban tersebut menjadi bagian dari
konteks kerja sesi di masa depan.

Dalam kasus itu, tanyakan secara normal di sesi utama alih-alih menggunakan BTW.

## Terkait

- [Perintah slash](/id/tools/slash-commands)
- [Thinking Levels](/id/tools/thinking)
- [Sesi](/id/concepts/session)
