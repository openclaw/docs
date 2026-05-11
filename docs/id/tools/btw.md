---
read_when:
    - Anda ingin mengajukan pertanyaan sampingan singkat tentang sesi saat ini
    - Anda sedang mengimplementasikan atau men-debug perilaku BTW di berbagai klien
summary: Pertanyaan sampingan sementara dengan /btw
title: Omong-omong, pertanyaan sampingan
x-i18n:
    generated_at: "2026-05-11T20:36:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` memungkinkan Anda mengajukan pertanyaan sampingan singkat tentang **sesi saat ini** tanpa
mengubah pertanyaan itu menjadi riwayat percakapan normal. `/side` adalah aliasnya.

Perilaku ini dimodelkan dari perilaku `/btw` milik Claude Code, tetapi disesuaikan dengan
Gateway dan arsitektur multi-kanal OpenClaw.

## Yang dilakukannya

Ketika Anda mengirim:

```text
/btw what changed?
```

OpenClaw:

1. mengambil snapshot konteks sesi saat ini,
2. menjalankan kueri sampingan sementara yang terpisah,
3. hanya menjawab pertanyaan sampingan,
4. membiarkan run utama tetap berjalan,
5. **tidak** menulis pertanyaan atau jawaban BTW ke riwayat sesi,
6. memancarkan jawaban sebagai **hasil sampingan langsung**, bukan pesan asisten normal.

Model mental yang penting adalah:

- konteks sesi yang sama
- kueri sampingan satu kali yang terpisah
- transport harness native yang sama saat sesi menggunakan harness native
- tidak ada pencemaran konteks di masa mendatang
- tidak ada persistensi transkrip

Untuk sesi harness Codex, BTW tetap berada di dalam Codex dengan melakukan fork pada thread
app-server aktif sebagai thread sampingan sementara. Ini menjaga perilaku OAuth Codex dan
thread native tetap utuh sekaligus tetap mengisolasi jawaban sampingan dari transkrip induk.
Seperti `/side` Codex, thread sampingan mempertahankan izin Codex saat ini dan permukaan tool
native, dengan guardrail yang memberi tahu model agar tidak memperlakukan pekerjaan thread induk
yang diwariskan sebagai instruksi aktif. Runtime non-Codex tetap menggunakan jalur satu kali
langsung yang lebih lama.

## Yang tidak dilakukannya

`/btw` **tidak**:

- membuat sesi tahan lama baru,
- melanjutkan tugas utama yang belum selesai,
- menulis data pertanyaan/jawaban BTW ke riwayat transkrip,
- muncul di `chat.history`,
- bertahan setelah reload.

Ini sengaja bersifat **sementara**.

## Cara kerja konteks

BTW menggunakan sesi saat ini hanya sebagai **konteks latar belakang**.

Jika run utama sedang aktif, OpenClaw mengambil snapshot status pesan saat ini dan menyertakan
prompt utama yang sedang berjalan sebagai konteks latar belakang, sambil secara eksplisit memberi
tahu model:

- hanya jawab pertanyaan sampingan,
- jangan lanjutkan atau selesaikan tugas utama yang belum selesai,
- jangan mengarahkan percakapan induk.

Ini menjaga BTW tetap terisolasi dari run utama sekaligus tetap membuatnya mengetahui isi sesi.

## Model pengiriman

BTW **tidak** dikirim sebagai pesan transkrip asisten normal.

Pada level protokol Gateway:

- chat asisten normal menggunakan event `chat`
- BTW menggunakan event `chat.side_result`

Pemisahan ini disengaja. Jika BTW menggunakan kembali jalur event `chat` normal,
klien akan memperlakukannya seperti riwayat percakapan reguler.

Karena BTW menggunakan event langsung yang terpisah dan tidak diputar ulang dari
`chat.history`, ia hilang setelah reload.

## Perilaku permukaan

### TUI

Di TUI, BTW dirender inline dalam tampilan sesi saat ini, tetapi tetap bersifat
sementara:

- tampak berbeda dari balasan asisten normal
- dapat ditutup dengan `Enter` atau `Esc`
- tidak diputar ulang saat reload

### Kanal eksternal

Pada kanal seperti Telegram, WhatsApp, dan Discord, BTW dikirim sebagai balasan satu kali
yang diberi label jelas karena permukaan tersebut tidak memiliki konsep overlay sementara
lokal.

Jawaban tetap diperlakukan sebagai hasil sampingan, bukan riwayat sesi normal.

### UI Kontrol / web

Gateway memancarkan BTW dengan benar sebagai `chat.side_result`, dan BTW tidak disertakan
dalam `chat.history`, sehingga kontrak persistensi sudah benar untuk web.

UI Kontrol saat ini masih membutuhkan konsumen `chat.side_result` khusus untuk
merender BTW secara langsung di browser. Hingga dukungan sisi klien itu tersedia, BTW adalah
fitur level Gateway dengan perilaku TUI dan kanal eksternal yang lengkap, tetapi belum
menjadi UX browser yang lengkap.

## Kapan menggunakan BTW

Gunakan `/btw` saat Anda menginginkan:

- klarifikasi singkat tentang pekerjaan saat ini,
- jawaban faktual sampingan saat run panjang masih berlangsung,
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

Dalam kasus itu, ajukan pertanyaan secara normal di sesi utama alih-alih menggunakan BTW.

## Terkait

<CardGroup cols={2}>
  <Card title="Perintah slash" href="/id/tools/slash-commands" icon="terminal">
    Katalog perintah native dan direktif chat.
  </Card>
  <Card title="Level berpikir" href="/id/tools/thinking" icon="brain">
    Level upaya penalaran untuk panggilan model pertanyaan sampingan.
  </Card>
  <Card title="Sesi" href="/id/concepts/session" icon="comments">
    Kunci sesi, riwayat, dan semantik persistensi.
  </Card>
  <Card title="Perintah steer" href="/id/tools/steer" icon="arrow-right">
    Sisipkan pesan pengarah ke run aktif tanpa mengakhirinya.
  </Card>
</CardGroup>
