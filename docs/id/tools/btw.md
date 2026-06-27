---
read_when:
    - Anda ingin mengajukan pertanyaan sampingan singkat tentang sesi saat ini
    - Anda sedang mengimplementasikan atau men-debug perilaku BTW di seluruh klien
summary: Pertanyaan sampingan sementara dengan /btw
title: Omong-omong, pertanyaan sampingan
x-i18n:
    generated_at: "2026-06-27T18:16:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` memungkinkan Anda mengajukan pertanyaan sampingan cepat tentang **sesi saat ini** tanpa
mengubah pertanyaan itu menjadi riwayat percakapan normal. `/side` adalah alias.

Ini dimodelkan berdasarkan perilaku `/btw` milik Claude Code, tetapi disesuaikan dengan
Gateway dan arsitektur multi-saluran OpenClaw.

## Apa yang dilakukannya

Saat Anda mengirim:

```text
/btw what changed?
```

OpenClaw:

1. mengambil snapshot konteks sesi saat ini,
2. menjalankan kueri sampingan sementara yang terpisah,
3. menjawab hanya pertanyaan sampingan,
4. membiarkan run utama tetap berjalan,
5. **tidak** menulis pertanyaan atau jawaban BTW ke riwayat sesi,
6. memancarkan jawaban sebagai **hasil samping langsung**, bukan pesan asisten normal.

Model mental yang penting adalah:

- konteks sesi yang sama
- kueri sampingan sekali jalan yang terpisah
- transport harness native yang sama saat sesi menggunakan harness native
- tidak ada pencemaran konteks di masa mendatang
- tidak ada persistensi transkrip

Untuk sesi harness Codex, BTW tetap berada di dalam Codex dengan melakukan fork thread
app-server aktif sebagai thread sampingan sementara. Ini menjaga OAuth Codex dan perilaku
thread native tetap utuh sambil tetap mengisolasi jawaban sampingan dari transkrip induk.
Seperti `/side` Codex, thread sampingan mempertahankan izin Codex saat ini dan permukaan
alat native, dengan guardrail yang memberi tahu model agar tidak memperlakukan pekerjaan
thread induk yang diwarisi sebagai instruksi aktif.

Untuk alias runtime CLI, BTW menggunakan backend CLI pemilik dalam mode pertanyaan sampingan
alih-alih kembali ke panggilan provider langsung. OpenClaw menanamkan konteks percakapan
yang telah disanitasi ke dalam invocation CLI sekali jalan yang baru, menonaktifkan pembundelan
alat MCP OpenClaw dan state sesi CLI yang dapat digunakan ulang untuk invocation tersebut,
dan membiarkan backend menambahkan flag no-resume atau no-tools native CLI apa pun yang
didukungnya. Runtime non-CLI langsung tetap menggunakan jalur sekali jalan langsung.

## Apa yang tidak dilakukannya

`/btw` **tidak**:

- membuat sesi tahan lama baru,
- melanjutkan tugas utama yang belum selesai,
- menulis data pertanyaan/jawaban BTW ke riwayat transkrip,
- muncul di `chat.history`,
- bertahan setelah reload.

Ini sengaja bersifat **sementara**.

## Cara kerja konteks

BTW menggunakan sesi saat ini hanya sebagai **konteks latar belakang**.

Jika run utama saat ini aktif, OpenClaw mengambil snapshot state pesan saat ini
dan menyertakan prompt utama yang sedang berjalan sebagai konteks latar belakang, sambil
secara eksplisit memberi tahu model:

- jawab hanya pertanyaan sampingan,
- jangan melanjutkan atau menyelesaikan tugas utama yang belum selesai,
- jangan mengarahkan percakapan induk.

Ini menjaga BTW tetap terisolasi dari run utama sambil tetap membuatnya memahami tentang apa
sesi tersebut.

## Model pengiriman

BTW **tidak** dikirim sebagai pesan transkrip asisten normal.

Pada tingkat protokol Gateway:

- chat asisten normal menggunakan event `chat`
- BTW menggunakan event `chat.side_result`

Pemisahan ini disengaja. Jika BTW menggunakan ulang jalur event `chat` normal,
klien akan memperlakukannya seperti riwayat percakapan biasa.

Karena BTW menggunakan event langsung terpisah dan tidak diputar ulang dari
`chat.history`, ini menghilang setelah reload.

## Perilaku permukaan

### TUI

Di TUI, BTW dirender inline dalam tampilan sesi saat ini, tetapi tetap
sementara:

- tampak berbeda dari balasan asisten normal
- dapat ditutup dengan `Enter` atau `Esc`
- tidak diputar ulang saat reload

### Saluran eksternal

Pada saluran seperti Telegram, WhatsApp, dan Discord, BTW dikirim sebagai
balasan sekali saja yang diberi label jelas karena permukaan tersebut tidak memiliki konsep
overlay sementara lokal.

Jawaban tetap diperlakukan sebagai hasil samping, bukan riwayat sesi normal.

### Control UI / web

Gateway memancarkan BTW dengan benar sebagai `chat.side_result`, dan BTW tidak disertakan
dalam `chat.history`, sehingga kontrak persistensi sudah benar untuk web.

Control UI saat ini masih membutuhkan consumer `chat.side_result` khusus untuk
merender BTW secara langsung di browser. Sampai dukungan sisi klien itu tersedia, BTW adalah
fitur tingkat Gateway dengan perilaku TUI dan saluran eksternal penuh, tetapi belum menjadi
UX browser yang lengkap.

## Kapan menggunakan BTW

Gunakan `/btw` saat Anda menginginkan:

- klarifikasi cepat tentang pekerjaan saat ini,
- jawaban sampingan faktual saat run panjang masih berlangsung,
- jawaban sementara yang tidak boleh menjadi bagian dari konteks sesi di masa mendatang.

Contoh:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Kapan tidak menggunakan BTW

Jangan gunakan `/btw` saat Anda ingin jawaban menjadi bagian dari konteks kerja
sesi di masa mendatang.

Dalam kasus tersebut, tanyakan secara normal di sesi utama alih-alih menggunakan BTW.

## Terkait

<CardGroup cols={2}>
  <Card title="Slash commands" href="/id/tools/slash-commands" icon="terminal">
    Katalog perintah native dan direktif chat.
  </Card>
  <Card title="Thinking levels" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran untuk panggilan model pertanyaan sampingan.
  </Card>
  <Card title="Session" href="/id/concepts/session" icon="comments">
    Kunci sesi, riwayat, dan semantik persistensi.
  </Card>
  <Card title="Steer command" href="/id/tools/steer" icon="arrow-right">
    Sisipkan pesan pengarahan ke dalam run aktif tanpa mengakhirinya.
  </Card>
</CardGroup>
