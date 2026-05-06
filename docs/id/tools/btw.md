---
read_when:
    - Anda ingin mengajukan pertanyaan sampingan singkat tentang sesi saat ini
    - Anda sedang mengimplementasikan atau men-debug perilaku BTW di seluruh klien
summary: Pertanyaan sampingan sementara dengan /btw
title: Ngomong-ngomong, pertanyaan sampingan
x-i18n:
    generated_at: "2026-05-06T09:29:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw` memungkinkan Anda mengajukan pertanyaan sampingan singkat tentang **sesi saat ini** tanpa
mengubah pertanyaan tersebut menjadi riwayat percakapan normal. `/side` adalah alias.

Ini dimodelkan setelah perilaku `/btw` milik Claude Code, tetapi disesuaikan dengan
arsitektur Gateway dan multi-channel OpenClaw.

## Apa yang dilakukannya

Saat Anda mengirim:

```text
/btw what changed?
```

OpenClaw:

1. mengambil snapshot konteks sesi saat ini,
2. menjalankan panggilan model **tanpa alat** yang terpisah,
3. menjawab hanya pertanyaan sampingan,
4. membiarkan proses utama tetap berjalan sendiri,
5. **tidak** menulis pertanyaan atau jawaban BTW ke riwayat sesi,
6. mengirim jawabannya sebagai **hasil sampingan langsung**, bukan sebagai pesan asisten normal.

Model mental yang penting adalah:

- konteks sesi yang sama
- kueri sampingan satu kali yang terpisah
- tanpa panggilan alat
- tanpa pencemaran konteks masa depan
- tanpa persistensi transkrip

## Apa yang tidak dilakukannya

`/btw` **tidak**:

- membuat sesi tahan lama baru,
- melanjutkan tugas utama yang belum selesai,
- menjalankan alat atau loop alat agent,
- menulis data pertanyaan/jawaban BTW ke riwayat transkrip,
- muncul di `chat.history`,
- bertahan setelah pemuatan ulang.

Ini sengaja dibuat **sementara**.

## Cara kerja konteks

BTW menggunakan sesi saat ini hanya sebagai **konteks latar belakang**.

Jika proses utama sedang aktif, OpenClaw mengambil snapshot status pesan saat ini
dan menyertakan prompt utama yang sedang berjalan sebagai konteks latar belakang, sambil
secara eksplisit memberi tahu model:

- jawab hanya pertanyaan sampingan,
- jangan melanjutkan atau menyelesaikan tugas utama yang belum selesai,
- jangan mengeluarkan panggilan alat atau panggilan alat semu.

Ini menjaga BTW tetap terisolasi dari proses utama sambil tetap membuatnya memahami
tentang apa sesi tersebut.

## Model pengiriman

BTW **tidak** dikirim sebagai pesan transkrip asisten normal.

Pada tingkat protokol Gateway:

- chat asisten normal menggunakan event `chat`
- BTW menggunakan event `chat.side_result`

Pemisahan ini disengaja. Jika BTW menggunakan kembali jalur event `chat` normal,
klien akan memperlakukannya seperti riwayat percakapan biasa.

Karena BTW menggunakan event langsung terpisah dan tidak diputar ulang dari
`chat.history`, BTW menghilang setelah pemuatan ulang.

## Perilaku surface

### TUI

Di TUI, BTW dirender inline dalam tampilan sesi saat ini, tetapi tetap
sementara:

- tampak berbeda dari balasan asisten normal
- dapat ditutup dengan `Enter` atau `Esc`
- tidak diputar ulang saat pemuatan ulang

### Channel eksternal

Pada channel seperti Telegram, WhatsApp, dan Discord, BTW dikirim sebagai
balasan satu kali yang diberi label jelas karena surface tersebut tidak memiliki konsep
overlay sementara lokal.

Jawabannya tetap diperlakukan sebagai hasil sampingan, bukan riwayat sesi normal.

### Control UI / web

Gateway mengirim BTW dengan benar sebagai `chat.side_result`, dan BTW tidak disertakan
dalam `chat.history`, sehingga kontrak persistensi sudah benar untuk web.

Control UI saat ini masih memerlukan konsumen khusus `chat.side_result` untuk
merender BTW secara langsung di browser. Sampai dukungan sisi klien tersebut hadir, BTW adalah
fitur tingkat Gateway dengan perilaku TUI dan channel eksternal penuh, tetapi belum menjadi
UX browser yang lengkap.

## Kapan menggunakan BTW

Gunakan `/btw` saat Anda menginginkan:

- klarifikasi singkat tentang pekerjaan saat ini,
- jawaban faktual sampingan saat proses panjang masih berlangsung,
- jawaban sementara yang tidak seharusnya menjadi bagian dari konteks sesi masa depan.

Contoh:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Kapan tidak menggunakan BTW

Jangan gunakan `/btw` saat Anda ingin jawabannya menjadi bagian dari konteks kerja
masa depan sesi.

Dalam kasus tersebut, bertanyalah secara normal di sesi utama alih-alih menggunakan BTW.

## Terkait

<CardGroup cols={2}>
  <Card title="Perintah slash" href="/id/tools/slash-commands" icon="terminal">
    Katalog perintah native dan direktif chat.
  </Card>
  <Card title="Tingkat berpikir" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran untuk panggilan model pertanyaan sampingan.
  </Card>
  <Card title="Sesi" href="/id/concepts/session" icon="comments">
    Kunci sesi, riwayat, dan semantik persistensi.
  </Card>
  <Card title="Perintah steer" href="/id/tools/steer" icon="arrow-right">
    Menyuntikkan pesan pengarah ke proses aktif tanpa mengakhirinya.
  </Card>
</CardGroup>
