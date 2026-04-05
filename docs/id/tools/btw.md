---
read_when:
    - Anda ingin mengajukan pertanyaan sampingan singkat tentang sesi saat ini
    - Anda sedang menerapkan atau men-debug perilaku BTW di berbagai klien
summary: Pertanyaan sampingan sementara dengan /btw
title: Pertanyaan Sampingan BTW
x-i18n:
    generated_at: "2026-04-05T14:07:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: aeef33ba19eb0561693fecea9dd39d6922df93be0b9a89446ed17277bcee58aa
    source_path: tools/btw.md
    workflow: 15
---

# Pertanyaan Sampingan BTW

`/btw` memungkinkan Anda mengajukan pertanyaan sampingan singkat tentang **sesi saat ini** tanpa
mengubah pertanyaan itu menjadi riwayat percakapan normal.

Fitur ini dimodelkan berdasarkan perilaku `/btw` milik Claude Code, tetapi diadaptasi ke arsitektur
Gateway dan multi-channel OpenClaw.

## Apa yang dilakukannya

Saat Anda mengirim:

```text
/btw what changed?
```

OpenClaw:

1. mengambil snapshot konteks sesi saat ini,
2. menjalankan panggilan model **tanpa tool** yang terpisah,
3. menjawab hanya pertanyaan sampingan tersebut,
4. membiarkan run utama tetap berjalan,
5. **tidak** menulis pertanyaan atau jawaban BTW ke riwayat sesi,
6. mengirim jawaban sebagai **hasil sampingan langsung** alih-alih pesan asisten normal.

Model mental pentingnya adalah:

- konteks sesi yang sama
- kueri sampingan sekali jalan yang terpisah
- tanpa panggilan tool
- tanpa mencemari konteks masa depan
- tanpa persistensi transkrip

## Apa yang tidak dilakukannya

`/btw` **tidak**:

- membuat sesi permanen baru,
- melanjutkan tugas utama yang belum selesai,
- menjalankan tool atau loop tool agen,
- menulis data pertanyaan/jawaban BTW ke riwayat transkrip,
- muncul di `chat.history`,
- bertahan setelah reload.

Fitur ini sengaja **sementara**.

## Cara kerja konteks

BTW menggunakan sesi saat ini hanya sebagai **konteks latar belakang**.

Jika run utama sedang aktif, OpenClaw mengambil snapshot keadaan pesan saat ini
dan menyertakan prompt utama yang sedang berjalan sebagai konteks latar belakang, sambil
secara eksplisit memberi tahu model:

- jawab hanya pertanyaan sampingan,
- jangan melanjutkan atau menyelesaikan tugas utama yang belum selesai,
- jangan mengirim panggilan tool atau pseudo-tool call.

Itu menjaga BTW tetap terisolasi dari run utama sambil tetap membuatnya sadar
tentang topik sesi.

## Model pengiriman

BTW **tidak** dikirim sebagai pesan transkrip asisten normal.

Pada level protokol Gateway:

- chat asisten normal menggunakan event `chat`
- BTW menggunakan event `chat.side_result`

Pemisahan ini disengaja. Jika BTW menggunakan kembali jalur event `chat` normal,
klien akan memperlakukannya seperti riwayat percakapan biasa.

Karena BTW menggunakan event langsung yang terpisah dan tidak diputar ulang dari
`chat.history`, hasilnya menghilang setelah reload.

## Perilaku permukaan

### TUI

Di TUI, BTW dirender inline dalam tampilan sesi saat ini, tetapi tetap
sementara:

- tampak berbeda secara jelas dari balasan asisten normal
- dapat ditutup dengan `Enter` atau `Esc`
- tidak diputar ulang saat reload

### Channel eksternal

Di channel seperti Telegram, WhatsApp, dan Discord, BTW dikirim sebagai
balasan sekali jalan yang diberi label dengan jelas karena permukaan tersebut tidak memiliki konsep
overlay sementara lokal.

Jawaban tetap diperlakukan sebagai hasil sampingan, bukan riwayat sesi normal.

### Control UI / web

Gateway mengirim BTW dengan benar sebagai `chat.side_result`, dan BTW tidak disertakan
dalam `chat.history`, jadi kontrak persistensi untuk web sudah benar.

Control UI saat ini masih membutuhkan consumer `chat.side_result` khusus untuk
merender BTW secara langsung di browser. Sampai dukungan sisi klien itu tersedia, BTW adalah fitur
level Gateway dengan perilaku TUI dan channel eksternal yang lengkap, tetapi belum menjadi
UX browser yang sepenuhnya lengkap.

## Kapan menggunakan BTW

Gunakan `/btw` ketika Anda menginginkan:

- klarifikasi singkat tentang pekerjaan saat ini,
- jawaban sampingan faktual saat run panjang masih berlangsung,
- jawaban sementara yang tidak boleh menjadi bagian dari konteks sesi masa depan.

Contoh:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Kapan tidak menggunakan BTW

Jangan gunakan `/btw` jika Anda ingin jawaban itu menjadi bagian dari
konteks kerja sesi di masa depan.

Dalam kasus tersebut, tanyakan seperti biasa di sesi utama alih-alih menggunakan BTW.

## Terkait

- [Slash commands](/tools/slash-commands)
- [Thinking Levels](/tools/thinking)
- [Sesi](/id/concepts/session)
