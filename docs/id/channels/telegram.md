---
read_when:
    - Mengerjakan fitur Telegram atau webhook
summary: Status, kemampuan, dan konfigurasi bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-20T03:49:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2d8fafa5a525aab0b6a79b76a10548423d147f6ec333b03b18fdacacacee34e3
    source_path: channels/telegram.md
    workflow: 16
---

Siap produksi untuk DM dan grup bot melalui grammY. Long polling adalah transport default; mode webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah pemasangan.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Panduan diagnostik dan perbaikan lintas saluran.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi saluran lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Buat token bot di BotFather">
    Kedua alur menghasilkan token yang ditempelkan ke OpenClaw — pilih salah satu:

    - **Alur obrolan**: buka Telegram, mengobrollah dengan **@BotFather** (pastikan handle-nya persis `@BotFather`), jalankan `/newbot`, ikuti petunjuknya, dan simpan token tersebut.
    - **Alur web**: buka [aplikasi web BotFather](https://t.me/BotFather?startapp) — aplikasi ini berjalan di setiap klien Telegram, termasuk [web.telegram.org](https://web.telegram.org) — buat bot di UI, lalu salin tokennya.

  </Step>

  <Step title="Konfigurasikan token dan kebijakan DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Fallback lingkungan: `TELEGRAM_BOT_TOKEN` (hanya akun default; akun bernama harus menggunakan `botToken` atau `tokenFile`).
    Telegram **tidak** menggunakan `openclaw channels login telegram`; atur token dalam konfigurasi/lingkungan, lalu mulai Gateway.

  </Step>

  <Step title="Mulai Gateway dan setujui DM pertama">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kode pemasangan kedaluwarsa setelah 1 jam.

  </Step>

  <Step title="Tambahkan bot ke grup">
    Tambahkan bot ke grup, lalu dapatkan dua ID yang diperlukan untuk akses grup:

    - ID pengguna Telegram Anda, untuk `allowFrom` / `groupAllowFrom`
    - ID obrolan grup Telegram, sebagai kunci di bawah `channels.telegram.groups`

    Dapatkan ID obrolan grup dari `openclaw logs --follow`, bot ID pesan yang diteruskan, atau `getUpdates` Bot API. Setelah grup diizinkan, `/whoami@<bot_username>` mengonfirmasi ID pengguna dan grup.

    ID supergrup negatif yang diawali dengan `-100` adalah ID obrolan grup. ID tersebut ditempatkan di bawah `channels.telegram.groups`, bukan `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Resolusi token memperhitungkan akun: `tokenFile` mengungguli `botToken`, yang mengungguli lingkungan, dan konfigurasi selalu mengungguli `TELEGRAM_BOT_TOKEN` (yang hanya diresolusi untuk akun default). Setelah startup berhasil, OpenClaw menyimpan identitas bot dalam cache hingga 24 jam agar restart melewati panggilan tambahan `getMe`; mengubah atau menghapus token akan menghapus cache tersebut.
</Note>

## Pengaturan sisi Telegram

<AccordionGroup>
  <Accordion title="Mode privasi dan visibilitas grup">
    Bot Telegram secara default menggunakan **Privacy Mode**, yang membatasi pesan grup yang diterimanya.

    Untuk melihat semua pesan grup, lakukan salah satu dari berikut:

    - nonaktifkan mode privasi melalui `/setprivacy`, atau
    - jadikan bot sebagai admin grup.

    Setelah mengubah mode privasi, hapus lalu tambahkan kembali bot di setiap grup agar Telegram menerapkan perubahan tersebut.

  </Accordion>

  <Accordion title="Izin grup">
    Status admin dikontrol dalam pengaturan grup Telegram. Bot admin menerima semua pesan grup, yang berguna untuk perilaku grup yang selalu aktif.
  </Accordion>

  <Accordion title="Toggle BotFather yang berguna">

    - `/setjoingroups` — izinkan/tolak penambahan ke grup
    - `/setprivacy` — perilaku visibilitas grup

    Pengaturan yang sama tersedia di [aplikasi web BotFather](https://t.me/BotFather?startapp) jika Anda lebih memilih UI daripada perintah obrolan.

  </Accordion>
</AccordionGroup>

## Mini App dasbor

Jalankan `/dashboard` dalam DM dengan bot untuk membuka dasbor OpenClaw di dalam Telegram.

Persyaratan:

- `gateway.tailscale.mode: "serve"` atau `"funnel"` untuk URL HTTPS Mini App yang dipublikasikan.
- ID pengguna Telegram numerik Anda harus berada dalam `allowFrom` efektif milik akun yang dipilih atau dalam `commands.ownerAllowFrom`.
- Gunakan DM. Dalam grup, `/dashboard` membalas dengan `open this in a DM with the bot` dan tidak mengirim tombol.
- Instalasi Docker: Mode Serve/Funnel mengharuskan Gateway mengikat loopback di samping `tailscaled`, yang tidak dapat dipenuhi oleh jaringan bridge dengan port yang dipublikasikan. Jalankan kontainer Gateway dengan `network_mode: host` dan pasang soket `tailscaled` host (`/var/run/tailscale`) beserta CLI `tailscale` ke dalam kontainer.

Mini App adalah jalur v1 khusus Tailscale dan tidak mendukung iframe Telegram Web.

## Kontrol akses dan aktivasi

### Identitas bot grup

Dalam grup dan topik forum, penyebutan eksplisit handle bot yang dikonfigurasi (misalnya `@my_bot`) ditujukan kepada agen OpenClaw yang dipilih, bahkan ketika nama persona agen berbeda dari nama pengguna Telegram. Kebijakan diam grup tetap berlaku untuk lalu lintas yang tidak terkait, tetapi handle bot itu sendiri tidak pernah dianggap sebagai "orang lain."

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.telegram.dmPolicy` mengontrol akses pesan langsung:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu ID pengirim dalam `allowFrom`)
    - `open` (mengharuskan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `dmPolicy: "open"` dengan `allowFrom: ["*"]` memungkinkan akun Telegram mana pun yang menemukan atau menebak nama pengguna bot untuk memerintah bot tersebut. Gunakan hanya untuk bot yang sengaja dibuat publik dengan alat yang dibatasi secara ketat; bot dengan satu pemilik sebaiknya menggunakan `allowlist` dengan ID pengguna numerik.

    `channels.telegram.allowFrom` menerima ID pengguna Telegram numerik. Prefiks `telegram:` / `tg:` diterima dan dinormalisasi.
    Dalam konfigurasi multiakun, `channels.telegram.allowFrom` tingkat atas yang ketat merupakan batas keamanan: `allowFrom: ["*"]` tingkat akun tidak membuat akun tersebut publik kecuali daftar izin efektif hasil penggabungan tetap berisi wildcard eksplisit.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi konfigurasi.
    Penyiapan hanya meminta ID pengguna numerik. Jika konfigurasi Anda memiliki entri daftar izin `@username` dari penyiapan lama, jalankan `openclaw doctor --fix` untuk meresolusinya menjadi ID numerik (upaya terbaik; memerlukan token bot Telegram).
    Jika sebelumnya Anda mengandalkan file daftar izin penyimpanan pemasangan, `openclaw doctor --fix` dapat memulihkan entri ke dalam `channels.telegram.allowFrom` untuk alur daftar izin (misalnya ketika `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot dengan satu pemilik, utamakan `dmPolicy: "allowlist"` dengan ID `allowFrom` numerik eksplisit daripada bergantung pada persetujuan pemasangan sebelumnya.

    Kebingungan umum: persetujuan pemasangan DM tidak berarti "pengirim ini diotorisasi di mana saja." Pemasangan hanya memberikan akses DM. Jika belum ada pemilik perintah, pemasangan pertama yang disetujui juga menetapkan `commands.ownerAllowFrom`, sehingga perintah khusus pemilik dan persetujuan eksekusi memiliki akun operator eksplisit. Otorisasi pengirim grup tetap berasal dari daftar izin konfigurasi eksplisit.
    Agar diotorisasi untuk DM dan perintah grup dengan satu identitas: masukkan ID pengguna Telegram numerik Anda dalam `channels.telegram.allowFrom`, dan untuk perintah khusus pemilik, pastikan `commands.ownerAllowFrom` berisi `telegram:<your user id>`.

    ### Menemukan ID pengguna Telegram Anda

    Lebih aman (tanpa bot pihak ketiga): kirim DM ke bot Anda, jalankan `openclaw logs --follow`, lalu baca `from.id`.

    Metode Bot API resmi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Pihak ketiga (kurang privat): `@userinfobot` atau `@getidsbot`.

  </Tab>

  <Tab title="Kebijakan grup dan daftar izin">
    Dua kontrol berlaku bersamaan:

    1. **Grup yang diizinkan** (`channels.telegram.groups`)
       - tanpa konfigurasi `groups`, `groupPolicy: "open"`: grup mana pun lolos pemeriksaan ID grup
       - tanpa konfigurasi `groups`, `groupPolicy: "allowlist"` (default): semua grup diblokir hingga Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: berfungsi sebagai daftar izin (ID eksplisit atau `"*"`)

    2. **Pengirim yang diizinkan dalam grup** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (default) / `disabled`

    `groupAllowFrom` memfilter pengirim grup; jika tidak diatur, Telegram kembali menggunakan `allowFrom` (bukan penyimpanan pemasangan — autentikasi pengirim grup tidak pernah mewarisi persetujuan penyimpanan pemasangan DM, sebuah batas keamanan sejak `2026.2.25`).
    Entri `groupAllowFrom` harus berupa ID pengguna Telegram numerik (prefiks `telegram:` / `tg:` dinormalisasi); entri nonnumerik diabaikan. Jangan tempatkan ID obrolan grup atau supergrup di sini — ID obrolan negatif berada di bawah `channels.telegram.groups`.
    Pola praktis untuk bot dengan satu pemilik: tetapkan ID pengguna Anda dalam `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak diatur, dan izinkan grup target di bawah `channels.telegram.groups`.
    Jika `channels.telegram` sama sekali tidak ada dalam konfigurasi, runtime menggunakan default fail-closed `groupPolicy="allowlist"`, kecuali `channels.defaults.groupPolicy` ditetapkan secara eksplisit.

    Penyiapan grup khusus pemilik:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Uji dari grup dengan `@<bot_username> ping`. Pesan grup biasa tidak memicu bot selama `requireMention: true`.

    Izinkan anggota mana pun dalam satu grup tertentu:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Izinkan hanya pengguna tertentu dalam satu grup tertentu:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Kesalahan umum: `groupAllowFrom` bukan daftar izin grup.

      - ID obrolan grup/supergrup Telegram negatif (`-1001234567890`) ditempatkan di bawah `channels.telegram.groups`.
      - ID pengguna Telegram (`8734062810`) ditempatkan di bawah `groupAllowFrom` untuk membatasi orang dalam grup yang diizinkan yang dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya untuk mengizinkan anggota mana pun dalam grup yang diizinkan berbicara dengan bot.

    </Warning>

  </Tab>

  <Tab title="Perilaku penyebutan">
    Balasan grup secara default memerlukan penyebutan. Penyebutan dapat berasal dari:

    - penyebutan `@botusername` native, atau
    - pola penyebutan dalam `agents.list[].groupChat.mentionPatterns` atau `messages.groupChat.mentionPatterns`

    Toggle tingkat sesi (hanya status, tidak dipersistenkan): `/activation always`, `/activation mention`. Gunakan konfigurasi untuk persistensi:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Konteks riwayat grup selalu aktif dan dibatasi oleh `historyLimit`. Tetapkan `channels.telegram.historyLimit: 0` untuk menonaktifkan jendela riwayat grup. `openclaw doctor --fix` menghapus kunci `includeGroupHistoryContext` yang telah dihentikan.

    Mendapatkan ID obrolan grup: teruskan pesan grup ke `@userinfobot` / `@getidsbot`, baca `chat.id` dari `openclaw logs --follow`, periksa `getUpdates` Bot API, atau (setelah grup diizinkan) jalankan `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Perilaku runtime

- Telegram berjalan di dalam proses Gateway.
- Perutean bersifat deterministik: balasan masuk Telegram dikirim kembali ke Telegram (model tidak memilih kanal).
- Pesan masuk dinormalisasi ke dalam amplop kanal bersama dengan metadata balasan, placeholder media, dan konteks rantai balasan yang dipertahankan untuk balasan yang telah diamati Gateway.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>`.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw mempertahankannya untuk balasan. Sesi topik DM dipisahkan hanya ketika `getMe` Telegram melaporkan `has_topics_enabled: true` untuk bot; jika tidak, DM tetap berada pada sesi datar.
- Long polling menggunakan runner grammY dengan pengurutan per obrolan/per utas. Konkurensi sink runner menggunakan `agents.defaults.maxConcurrent`.
- Startup multiakun membatasi probe `getMe` yang berjalan bersamaan agar armada bot besar tidak menjalankan probe setiap akun sekaligus.
- Setiap proses Gateway mengamankan long polling sehingga hanya satu poller aktif yang dapat menggunakan token bot pada satu waktu. Konflik 409 `getUpdates` yang terus terjadi menunjukkan bahwa Gateway OpenClaw lain, skrip, atau poller eksternal menggunakan token yang sama.
- Watchdog polling dimulai ulang setelah 120 detik tanpa liveness `getUpdates` yang selesai.
- Telegram Bot API tidak mendukung tanda telah dibaca (`sendReadReceipts` tidak berlaku).

<Note>
  `channels.telegram.dm.threadReplies` dan `channels.telegram.direct.<chatId>.threadReplies` telah dihapus. Jalankan `openclaw doctor --fix` setelah melakukan upgrade jika konfigurasi Anda masih memiliki kunci tersebut. Perutean topik DM kini mengikuti `getMe.has_topics_enabled` Telegram (dikontrol oleh mode berutas BotFather): bot dengan topik diaktifkan menggunakan sesi DM yang dicakup per utas ketika Telegram mengirim `message_thread_id`; DM lainnya tetap berada pada sesi datar.
</Note>

## Referensi fitur

<AccordionGroup>
  <Accordion title="Pratinjau streaming langsung (pengeditan pesan)">
    OpenClaw melakukan streaming balasan parsial secara waktu nyata dalam obrolan langsung, grup, dan topik: mengirim pesan pratinjau, lalu menjalankan `editMessageText` berulang kali, dan menyelesaikannya di tempat.

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - pratinjau jawaban awal yang singkat di-debounce, lalu diwujudkan setelah penundaan terbatas jika proses masih aktif
    - `progress` mempertahankan satu draf status yang dapat diedit untuk progres alat, menampilkan label status stabil ketika aktivitas jawaban tiba sebelum progres alat, menghapusnya saat selesai, dan mengirim jawaban akhir sebagai pesan biasa
    - `streaming.preview.toolProgress` mengontrol apakah pembaruan alat/progres menggunakan kembali pesan pratinjau yang diedit yang sama (default: `true` ketika streaming pratinjau aktif)
    - `streaming.preview.commandText` mengontrol detail perintah/eksekusi di dalam baris tersebut: `raw` (default) atau `status` (hanya label alat)
    - `streaming.progress.commentary` (default: `false`) mengaktifkan teks komentar/pembuka asisten dalam draf progres sementara
    - `channels.telegram.streamMode` lama, nilai boolean `streaming`, dan kunci pratinjau draf native yang telah dihentikan akan terdeteksi; jalankan `openclaw doctor --fix` untuk memigrasikannya

    Baris progres alat adalah pembaruan status singkat yang ditampilkan saat alat berjalan (eksekusi perintah, pembacaan berkas, pembaruan perencanaan, ringkasan patch, pembuka/komentar Codex dalam mode app-server). Telegram tetap mengaktifkannya secara default (sesuai dengan perilaku rilis sejak `v2026.4.22`+).

    Pertahankan pengeditan pratinjau jawaban, tetapi sembunyikan baris progres alat:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Pertahankan progres alat tetap terlihat, tetapi sembunyikan teks perintah/eksekusi:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    Mode `progress` menampilkan progres alat tanpa mengedit jawaban akhir ke dalam pesan tersebut. Tempatkan kebijakan teks perintah di bawah `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    `streaming.mode: "off"` menonaktifkan pengeditan pratinjau dan menekan obrolan umum alat/progres alih-alih mengirimkannya sebagai pesan status mandiri; permintaan persetujuan, media, dan kesalahan tetap dirutekan melalui pengiriman akhir normal. `streaming.preview.toolProgress: false` hanya mempertahankan pengeditan pratinjau jawaban.

    <Note>
      Balasan kutipan terpilih merupakan pengecualian. Ketika `replyToMode` adalah `first`, `all`, atau `batched` dan pesan masuk memiliki teks kutipan terpilih, OpenClaw mengirim jawaban akhir melalui jalur balasan kutipan native Telegram alih-alih mengedit pratinjau jawaban, sehingga `streaming.preview.toolProgress` tidak dapat menampilkan baris status pada giliran tersebut. Balasan untuk pesan saat ini tanpa teks kutipan terpilih tetap melakukan streaming. Atur `replyToMode: "off"` ketika visibilitas progres alat lebih penting daripada balasan kutipan native, atau `streaming.preview.toolProgress: false` untuk menerima kompromi tersebut.
    </Note>

    Untuk balasan yang hanya berisi teks: pratinjau singkat mendapatkan pengeditan akhir di tempat; jawaban akhir panjang yang dibagi menjadi beberapa pesan menggunakan kembali pratinjau sebagai potongan pertama, lalu hanya mengirim sisanya; jawaban akhir mode progres menghapus draf status dan menggunakan pengiriman akhir normal; jika pengeditan akhir gagal sebelum penyelesaian dikonfirmasi, OpenClaw kembali ke pengiriman akhir normal dan membersihkan pratinjau usang. Untuk balasan kompleks (payload media), OpenClaw selalu kembali ke pengiriman akhir normal dan membersihkan pratinjau.

    Streaming pratinjau dan streaming blok bersifat saling eksklusif — ketika streaming blok diaktifkan secara eksplisit, OpenClaw melewati streaming pratinjau untuk menghindari streaming ganda.

    Penalaran: `/reasoning stream` melakukan streaming penalaran ke pratinjau langsung selama pembuatan, lalu menghapus pratinjau penalaran setelah pengiriman akhir (gunakan `/reasoning on` agar tetap terlihat). Jawaban akhir dikirim tanpa teks penalaran.

  </Accordion>

  <Accordion title="Pemformatan pesan kaya">
    Teks keluar menggunakan pesan HTML Telegram standar secara default, yang dapat dibaca di seluruh klien saat ini: tebal, miring, tautan, kode, spoiler, kutipan — bukan blok khusus kaya Bot API 10.2 (tabel native, detail, media kaya, rumus).

    Aktifkan pesan kaya Bot API 10.2:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Saat diaktifkan: agen diberi tahu bahwa pesan kaya tersedia untuk bot/akun ini (dengan kontrak penulisan Markdown + pulau HTML yang didukung); teks Markdown dirender melalui IR Markdown OpenClaw sebagai blok kaya Bot API 10.2 bertipe (judul, tabel, detail, daftar periksa, media kaya, rumus, peta, kolase); keterangan media tetap menggunakan keterangan HTML Telegram (pesan kaya tidak menggantikan keterangan, dan keterangan dibatasi hingga 1024 karakter).

    Hal ini menjauhkan teks model dari sigil Markdown kaya Telegram, sehingga mata uang seperti `$400-600K` tidak diurai sebagai matematika. Teks kaya yang panjang secara otomatis dibagi sesuai batas Telegram. Tabel yang melebihi batas 20 kolom kembali menjadi blok kode.

    Default: nonaktif, demi kompatibilitas klien — beberapa klien Desktop, Web, Android, dan pihak ketiga saat ini merender pesan kaya yang diterima sebagai tidak didukung. Biarkan tetap nonaktif kecuali setiap klien yang digunakan dengan bot dapat merendernya. `/status` menunjukkan apakah pesan kaya aktif atau nonaktif untuk sesi saat ini.

    Pratinjau tautan aktif secara default. `channels.telegram.linkPreview: false` menonaktifkan deteksi entitas otomatis untuk teks kaya.

  </Accordion>

  <Accordion title="Perintah native dan perintah khusus">
    Menu perintah Telegram didaftarkan saat startup dengan `setMyCommands`. `commands.native: "auto"` mengaktifkan perintah native untuk Telegram.

    Tambahkan entri menu perintah khusus:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Pencadangan Git" },
        { command: "generate", description: "Buat gambar" },
      ],
    },
  },
}
```

    Aturan: nama dinormalisasi (menghapus `/` di awal, menjadi huruf kecil); pola valid `a-z`, `0-9`, `_`, panjang 1-32; perintah khusus tidak dapat menimpa perintah native; konflik/duplikat dilewati dan dicatat.

    Perintah khusus hanyalah entri menu — perintah tersebut tidak mengimplementasikan perilaku secara otomatis. Perintah Plugin/skill tetap dapat berfungsi ketika diketik meskipun tidak ditampilkan dalam menu Telegram. Jika perintah native dinonaktifkan, perintah bawaan dihapus; perintah khusus/Plugin mungkin masih didaftarkan jika dikonfigurasi.

    Kegagalan penyiapan umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` setelah percobaan pemangkasan ulang berarti menu masih melampaui batas; kurangi perintah Plugin/skill/khusus atau nonaktifkan `channels.telegram.commands.native`.
    - Kegagalan `deleteWebhook`, `deleteMyCommands`, atau `setMyCommands` dengan `404: Not Found` ketika perintah curl Bot API langsung berfungsi biasanya berarti `channels.telegram.apiRoot` diatur ke endpoint `/bot<TOKEN>` lengkap. `apiRoot` harus hanya berupa root Bot API; `openclaw doctor --fix` menghapus `/bot<TOKEN>` di bagian akhir yang tidak disengaja.
    - `getMe returned 401` berarti Telegram menolak token bot yang dikonfigurasi. Perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` (akun default) dengan token BotFather saat ini; OpenClaw berhenti sebelum polling sehingga hal ini tidak dilaporkan sebagai kegagalan pembersihan Webhook.
    - `setMyCommands failed` dengan kesalahan jaringan/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah penyandingan perangkat (Plugin `device-pair`)

    Saat diinstal:

    1. `/pair` menghasilkan kode penyiapan
    2. tempelkan kode tersebut di aplikasi iOS
    3. `/pair pending` mencantumkan permintaan yang tertunda (termasuk peran/cakupan)
    4. setujui: `/pair approve <requestId>`, `/pair approve` (hanya permintaan tertunda), atau `/pair approve latest`

    Jika perangkat mencoba kembali dengan detail autentikasi yang berubah (peran, cakupan, kunci publik), permintaan tertunda sebelumnya digantikan dengan `requestId` baru; jalankan ulang `/pair pending` sebelum menyetujui.

    Detail selengkapnya: [Penyandingan](/id/channels/pairing#pair-via-telegram).

  </Accordion>

  <Accordion title="Tombol sebaris">
    Konfigurasikan cakupan papan ketik sebaris:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Penggantian per akun:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Cakupan: `off`, `dm`, `group`, `all`, `allowlist` (default). `capabilities: ["inlineButtons"]` lama dipetakan ke `"all"`.

    Contoh tindakan pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Pilih opsi:",
  buttons: [
    [
      { text: "Ya", callback_data: "yes" },
      { text: "Tidak", callback_data: "no" },
    ],
    [{ text: "Batal", callback_data: "cancel" }],
  ],
}
```

    Contoh tombol Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Buka aplikasi:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Luncurkan", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Tombol `web_app` hanya berfungsi dalam obrolan privat antara pengguna dan bot.

    Klik callback yang tidak diklaim oleh pengendali interaktif Plugin terdaftar diteruskan ke agen sebagai teks: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Tindakan pesan Telegram untuk agen dan otomatisasi">
    Tindakan:

    - `sendMessage` (`to`, `content`, `mediaUrl` opsional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` atau `caption`, tombol sebaris `presentation` opsional; pengeditan yang hanya mengubah tombol akan memperbarui markup balasan)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opsional, `iconCustomEmojiId`)

    Alias ergonomis: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Pembatasan: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (default: dinonaktifkan). `edit`, `createForumTopic`, dan `editForumTopic` diaktifkan secara default tanpa sakelar khusus.
    Pengiriman runtime menggunakan snapshot konfigurasi/rahasia aktif dari saat startup/muat ulang, sehingga jalur tindakan tidak menyelesaikan ulang nilai `SecretRef` pada setiap pengiriman.

    Semantik penghapusan reaksi: [/tools/reactions](/id/tools/reactions).

  </Accordion>

  <Accordion title="Tag pengaitan utas balasan">
    Tag pengaitan utas balasan eksplisit dalam keluaran yang dihasilkan:

    - `[[reply_to_current]]` — membalas pesan pemicu
    - `[[reply_to:<id>]]` — membalas ID pesan tertentu

    `channels.telegram.replyToMode`: `off` (default), `first`, `all`.

    Saat pengaitan utas balasan diaktifkan dan teks/keterangan asli tersedia, OpenClaw otomatis menambahkan kutipan native. Telegram membatasi teks kutipan native hingga 1024 unit kode UTF-16; pesan yang lebih panjang dikutip dari awal dan beralih ke balasan biasa jika Telegram menolak kutipan tersebut.

    `off` hanya menonaktifkan pengaitan utas balasan implisit; tag `[[reply_to_*]]` eksplisit tetap dipatuhi.

  </Accordion>

  <Accordion title="Topik forum dan perilaku utas">
    Supergrup forum: kunci sesi topik menambahkan `:topic:<threadId>`; balasan dan indikator mengetik ditujukan ke utas topik; jalur konfigurasi topik adalah `channels.telegram.groups.<chatId>.topics.<threadId>`.

    Topik umum (`threadId=1`) merupakan kasus khusus: pengiriman pesan tidak menyertakan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)` dengan "thread not found"), tetapi tindakan mengetik tetap menyertakan `message_thread_id` (secara empiris diperlukan agar indikator mengetik muncul).

    Entri topik mewarisi pengaturan grup kecuali ditimpa (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` hanya berlaku untuk topik dan tidak mewarisi default grup. `topics."*"` menetapkan default untuk setiap topik dalam grup tersebut; ID topik yang tepat tetap mengalahkan `"*"`.

    **Perutean agen per topik**: setiap topik dapat dirutekan ke agen yang berbeda melalui `agentId` dalam konfigurasi topik, sehingga memiliki ruang kerja, memori, dan sesi tersendiri:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Topik umum -> agen utama
                "3": { agentId: "zu" },        // Topik pengembangan -> agen zu
                "5": { agentId: "coder" }      // Review kode -> agen coder
              }
            }
          }
        }
      }
    }
    ```

    Setiap topik kemudian memiliki kunci sesinya sendiri, misalnya `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Pengikatan topik ACP persisten**: topik forum dapat menyematkan sesi harness ACP melalui pengikatan bertipe tingkat atas (`bindings[]` dengan `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"`, dan ID berkualifikasi topik seperti `-1001234567890:topic:42`). Saat ini cakupannya terbatas pada topik forum dalam grup/supergrup. Lihat [Agen ACP](/id/tools/acp-agents).

    **Peluncuran ACP terikat utas dari obrolan**: `/acp spawn <agent> --thread here|auto` mengikat topik saat ini ke sesi ACP baru; tindak lanjut dirutekan langsung ke sana, dan OpenClaw menyematkan konfirmasi peluncuran dalam topik. Memerlukan `channels.telegram.threadBindings.spawnSessions` (default: `true`).

    Konteks templat mengekspos `MessageThreadId` dan `IsForum`. Obrolan DM dengan `message_thread_id` mempertahankan metadata balasan, tetapi hanya menggunakan kunci sesi yang memperhitungkan utas saat `getMe` Telegram melaporkan `has_topics_enabled: true`.
    Penimpaan `dm.threadReplies` dan `direct.*.threadReplies` yang telah dihentikan kini sudah tidak ada; mode berutas BotFather menjadi satu-satunya sumber kebenaran. Jalankan `openclaw doctor --fix` untuk menghapus kunci konfigurasi usang.

  </Accordion>

  <Accordion title="Audio, video, dan stiker">
    ### Pesan audio

    Telegram membedakan catatan suara dari berkas audio. Default: perilaku berkas audio; beri tag `[[audio_as_voice]]` dalam balasan agen untuk memaksa pengiriman sebagai catatan suara. Transkrip catatan suara masuk dibingkai sebagai teks buatan mesin yang tidak tepercaya dalam konteks agen, tetapi deteksi penyebutan tetap menggunakan transkrip mentah agar pesan suara yang dibatasi penyebutan tetap berfungsi.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Pesan video

    Telegram membedakan berkas video dari catatan video. Catatan video tidak mendukung keterangan; teks pesan yang diberikan dikirim secara terpisah.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Lokasi dan tempat

    Gunakan tindakan `send` yang sudah ada dengan satu objek `location` mandiri. Koordinat mengirim pin native; menambahkan `name` dan `address` akan mengirim kartu tempat native. Pengiriman lokasi tidak dapat digabungkan dengan teks pesan atau media.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Menara Eiffel",
    address: "Champ de Mars, Paris",
  },
}
```

    ### Stiker

    Masuk: WEBP statis diunduh dan diproses (placeholder `<media:sticker>`); TGS animasi dan WEBM video dilewati.

    Bidang konteks stiker: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Deskripsi disimpan dalam cache di status plugin SQLite OpenClaw untuk mengurangi panggilan visi berulang.

    Aktifkan tindakan stiker:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Kirim:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Cari stiker yang tersimpan dalam cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "kucing melambaikan tangan",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifikasi reaksi">
    Reaksi Telegram diterima sebagai pembaruan `message_reaction`, terpisah dari payload pesan. Saat diaktifkan, OpenClaw mengantrekan peristiwa sistem seperti `Telegram reaction added: 👍 by Alice (@alice) on msg 42`.

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    `own` berarti hanya reaksi pengguna terhadap pesan yang dikirim bot (upaya terbaik melalui cache pesan terkirim). Peristiwa reaksi tetap mematuhi kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim tanpa otorisasi akan diabaikan.

    Telegram tidak menyediakan ID utas dalam pembaruan reaksi: grup nonforum dirutekan ke sesi obrolan grup; grup forum dirutekan ke sesi topik umum (`:topic:1`), bukan ke topik asal yang tepat.

    `allowed_updates` untuk polling/webhook otomatis menyertakan `message_reaction`.

  </Accordion>

  <Accordion title="Reaksi tanda terima">
    `ackReaction` mengirim emoji tanda terima saat OpenClaw memproses pesan masuk. `messages.ackReactionScope` menentukan *kapan* emoji tersebut dikirim.

    **Urutan resolusi emoji:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji identitas agen sebagai fallback (`agents.list[].identity.emoji`, jika tidak "👀")

    Telegram mengharapkan emoji unicode (misalnya "👀"); gunakan `""` untuk menonaktifkan reaksi bagi suatu kanal atau akun.

    **Cakupan (`messages.ackReactionScope`, default `"group-mentions"`; saat ini tidak ada penimpaan per akun Telegram atau kanal Telegram):**

    `all` (DM + grup, termasuk peristiwa ruang sekitar), `direct` (hanya DM), `group-all` (setiap pesan grup kecuali peristiwa ruang sekitar, tanpa DM), `group-mentions` (grup saat bot disebut; **tanpa DM** — default), `off` / `none` (dinonaktifkan).

    <Note>
    Cakupan default (`group-mentions`) tidak memicu reaksi tanda terima dalam DM atau peristiwa ruang sekitar. Gunakan `direct` atau `all` untuk DM; hanya `all` yang memberikan tanda terima untuk peristiwa ruang sekitar. Nilai ini dibaca saat startup penyedia Telegram, sehingga Gateway perlu dimulai ulang agar perubahan diterapkan.
    </Note>

  </Accordion>

  <Accordion title="Penulisan konfigurasi dari peristiwa dan perintah Telegram">
    Penulisan konfigurasi kanal diaktifkan secara default (`configWrites !== false`). Penulisan yang dipicu Telegram mencakup peristiwa migrasi grup (`migrate_to_chat_id`, memperbarui `channels.telegram.groups`) dan `/config set` / `/config unset` (memerlukan pengaktifan perintah).

    Nonaktifkan:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling versus webhook">
    Defaultnya adalah long polling. Untuk mode webhook, tetapkan `channels.telegram.webhookUrl` dan `channels.telegram.webhookSecret`; `webhookPath` opsional (default `/telegram-webhook`), `webhookHost` (default `127.0.0.1`), `webhookPort` (default `8787`), `webhookCertPath` (PEM sertifikat yang ditandatangani sendiri untuk penyiapan IP langsung atau tanpa domain).

    Dalam mode long polling, OpenClaw menyimpan watermark mulai ulangnya hanya setelah pembaruan berhasil didistribusikan; handler yang gagal membiarkan pembaruan tersebut dapat dicoba kembali dalam proses yang sama, alih-alih menandainya selesai.

    Listener lokal secara default melakukan bind ke `127.0.0.1:8787`. Untuk ingress publik, tempatkan proksi terbalik di depan port lokal, atau tetapkan `webhookHost: "0.0.0.0"` secara sengaja.

    Mode webhook memvalidasi pelindung permintaan, token rahasia Telegram, dan isi JSON, lalu melakukan commit pembaruan ke antrean ingress durabel sebelum mengembalikan `200` kosong. Adopsi durabel yang berhasil menyertakan `x-openclaw-delivery-accepted: durable`; respons kesehatan, perutean, autentikasi, validasi, dan kesalahan penyimpanan tidak menyertakan header ini. Proksi terbalik dan pengontrol host dapat mewajibkan header tersebut untuk membedakan adopsi OpenClaw dari `200` kosong generik tanpa menyimpulkan penerimaan berdasarkan waktu respons.

    Setelah penulisan durabel, OpenClaw mengklaim dan memproses pembaruan melalui penguras ingress kanal inti (jalur per obrolan/per topik, selesai saat adopsi giliran, batas waktu macet sebelum adopsi). Giliran agen yang lambat tidak menahan ACK pengiriman Telegram.

  </Accordion>

  <Accordion title="Batas dan target CLI">
    - `channels.telegram.textChunkLimit` default 4000; `streaming.chunkMode="newline"` mengutamakan batas paragraf (baris kosong) sebelum pemisahan berdasarkan panjang.
    - `channels.telegram.mediaMaxMb` (default 100) membatasi ukuran media masuk dan keluar.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (default 50); `0` menonaktifkannya.
    - konteks tambahan balasan/kutipan/penerusan dinormalisasi menjadi satu jendela konteks percakapan yang dipilih ketika Gateway telah mengamati pesan induk; cache pesan yang diamati berada dalam status plugin SQLite OpenClaw, dan `openclaw doctor --fix` mengimpor sidecar lama. Telegram hanya menyertakan satu `reply_to_message` dangkal per pembaruan, sehingga rantai yang lebih lama daripada cache terbatas pada payload tersebut.
    - daftar izin Telegram terutama membatasi siapa yang dapat memicu agen, bukan batas penyuntingan konteks tambahan secara menyeluruh.
    - riwayat DM: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.

    Target pengiriman CLI dan alat pesan menerima ID obrolan numerik, nama pengguna, atau target topik forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Jajak pendapat menggunakan `openclaw message poll` dan mendukung topik forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag jajak pendapat khusus Telegram: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (atau target `:topic:`). `--poll-option` diulang 2-12 kali (batas opsi Telegram).

    Pengiriman Telegram juga mendukung `--presentation` dengan blok `buttons` untuk papan ketik sebaris (ketika `channels.telegram.capabilities.inlineButtons` mengizinkannya), `--pin` atau `--delivery '{"pin":true}'` untuk meminta pengiriman yang disematkan ketika bot dapat menyematkan pesan dalam obrolan tersebut, dan `--force-document` untuk mengirim gambar, GIF, dan video keluar sebagai dokumen alih-alih unggahan terkompresi/animasi/video.

    Pembatasan tindakan: `channels.telegram.actions.sendMessage=false` menonaktifkan semua pesan keluar termasuk jajak pendapat; `channels.telegram.actions.poll=false` menonaktifkan pembuatan jajak pendapat, tetapi tetap mengaktifkan pengiriman biasa.

  </Accordion>

  <Accordion title="Persetujuan eksekusi di Telegram">
    Telegram mendukung persetujuan eksekusi dalam DM pemberi persetujuan dan secara opsional dapat memposting perintah di obrolan atau topik asal. Pemberi persetujuan harus berupa ID pengguna Telegram numerik.

    - `channels.telegram.execApprovals.enabled` (`"auto"` mengaktifkan ketika setidaknya satu pemberi persetujuan dapat ditemukan)
    - `channels.telegram.execApprovals.approvers` (beralih ke ID pemilik numerik dari `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (default) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, dan `defaultTo` mengontrol siapa yang dapat berbicara dengan bot dan ke mana bot mengirim balasan normal — pengaturan tersebut tidak menjadikan seseorang sebagai pemberi persetujuan eksekusi. Pemasangan DM pertama yang disetujui menginisialisasi `commands.ownerAllowFrom` ketika belum ada pemilik perintah, sehingga konfigurasi dengan satu pemilik dapat berfungsi tanpa menduplikasi ID di bawah `execApprovals.approvers`.

    Pengiriman kanal menampilkan teks perintah dalam obrolan; aktifkan `channel` atau `both` hanya dalam grup/topik tepercaya. Ketika perintah muncul dalam topik forum, OpenClaw mempertahankan topik tersebut untuk perintah persetujuan dan tindak lanjut. Persetujuan eksekusi kedaluwarsa setelah 30 menit secara default.

    Tombol persetujuan sebaris juga mengharuskan `channels.telegram.capabilities.inlineButtons` mengizinkan permukaan target (`dm`, `group`, atau `all`). ID persetujuan dengan prefiks `plugin:` diselesaikan melalui persetujuan plugin; ID lainnya diselesaikan terlebih dahulu melalui persetujuan eksekusi.

    Lihat [Persetujuan eksekusi](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrol balasan kesalahan

Ketika agen mengalami kesalahan pengiriman atau penyedia, kebijakan kesalahan mengontrol apakah pesan kesalahan diteruskan ke obrolan Telegram:

| Kunci                             | Nilai                     | Default  | Deskripsi                                                                                                                                                                |
| ------------------------------- | -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy` | `always`, `once`, `silent` | `always` | `always` mengirim setiap pesan kesalahan ke obrolan. `once` mengirim setiap pesan kesalahan unik satu kali per jendela cooldown bawaan. `silent` tidak pernah mengirim pesan kesalahan ke obrolan. |

Penggantian per akun, per grup, dan per topik didukung (pewarisan yang sama seperti kunci konfigurasi Telegram lainnya).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // cegah kesalahan dalam grup ini
        },
      },
    },
  },
}
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bot tidak merespons pesan grup tanpa penyebutan">

    - Jika `requireMention=false`, mode privasi Telegram harus mengizinkan visibilitas penuh: BotFather `/setprivacy` -> Disable, lalu hapus dan tambahkan kembali bot ke grup.
    - `openclaw channels status` memperingatkan ketika konfigurasi mengharapkan pesan grup tanpa penyebutan.
    - `openclaw channels status --probe` memeriksa ID grup numerik eksplisit; wildcard `"*"` tidak dapat diperiksa keanggotaannya.
    - Pengujian sesi cepat: `/activation always`.

  </Accordion>

  <Accordion title="Bot sama sekali tidak melihat pesan grup">

    - Ketika `channels.telegram.groups` ada, grup harus dicantumkan (atau menyertakan `"*"`).
    - Verifikasi keanggotaan bot dalam grup.
    - Tinjau `openclaw logs --follow` untuk mengetahui alasan pesan dilewati.

  </Accordion>

  <Accordion title="Perintah berfungsi sebagian atau sama sekali tidak berfungsi">

    - Otorisasi identitas pengirim Anda (pemasangan dan/atau `allowFrom` numerik); otorisasi perintah tetap berlaku meskipun kebijakan grup adalah `open`.
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu native memiliki terlalu banyak entri; kurangi perintah plugin/skill/kustom atau nonaktifkan menu native.
    - Panggilan startup `deleteMyCommands` / `setMyCommands` dan panggilan pengetikan `sendChatAction` dibatasi dan dicoba ulang satu kali melalui fallback transport Telegram ketika permintaan kehabisan waktu. Kesalahan jaringan/fetch yang terus terjadi biasanya berarti DNS/HTTPS ke `api.telegram.org` tidak dapat dijangkau.

  </Accordion>

  <Accordion title="Startup melaporkan token yang tidak sah">

    - `getMe returned 401` adalah kegagalan autentikasi Telegram untuk token bot yang dikonfigurasi. Salin ulang atau buat ulang token di BotFather, lalu perbarui `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken`, atau `TELEGRAM_BOT_TOKEN` (akun default).
    - `deleteWebhook 401 Unauthorized` selama startup juga merupakan kegagalan autentikasi; memperlakukannya sebagai "tidak ada webhook" hanya akan menunda kegagalan token buruk yang sama hingga panggilan API berikutnya.

  </Accordion>

  <Accordion title="Ketidakstabilan polling atau jaringan">

    - Node 22+ dengan fetch/proxy kustom dapat memicu perilaku pembatalan langsung jika tipe `AbortSignal` tidak cocok.
    - Beberapa host me-resolve `api.telegram.org` ke IPv6 terlebih dahulu; egress IPv6 yang rusak menyebabkan kegagalan API yang terjadi sesekali.
    - Log dengan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!` dicoba ulang sebagai kesalahan jaringan yang dapat dipulihkan.
    - Selama startup polling, OpenClaw menggunakan kembali probe startup `getMe` yang berhasil untuk grammY agar runner tidak memerlukan `getMe` kedua sebelum `getUpdates` pertama.
    - Jika `deleteWebhook` gagal karena kesalahan jaringan sementara selama startup polling, OpenClaw melanjutkan ke long polling alih-alih melakukan panggilan bidang kontrol prapolling lainnya. Webhook yang masih aktif kemudian muncul sebagai konflik `getUpdates`; OpenClaw membangun ulang transport dan mencoba ulang pembersihan webhook.
    - `Polling stall detected` dalam log berarti OpenClaw memulai ulang polling dan membangun ulang transport setelah secara default selama 120 detik tidak ada pemeriksaan keaktifan long-poll yang selesai.
    - `openclaw channels status --probe` dan `openclaw doctor` memperingatkan ketika akun polling yang sedang berjalan belum menyelesaikan `getUpdates` setelah masa tenggang startup, akun webhook yang sedang berjalan belum menyelesaikan `setWebhook` setelah masa tenggang startup, atau aktivitas transport polling terakhir yang berhasil sudah usang.
    - Telegram mematuhi env proxy proses untuk transport Bot API: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan varian huruf kecil. `NO_PROXY` / `no_proxy` masih dapat melewati `api.telegram.org`.
    - Jika `OPENCLAW_PROXY_URL` ditetapkan untuk lingkungan layanan dan tidak ada env proxy standar, Telegram juga menggunakan URL tersebut untuk transport Bot API.
    - Pada host VPS dengan egress langsung/TLS yang tidak stabil, rutekan panggilan API Telegram melalui proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ menggunakan `autoSelectFamily=true` secara default (kecuali WSL2). Urutan hasil DNS Telegram mematuhi `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, lalu `channels.telegram.network.dnsResultOrder`, kemudian default proses (misalnya `NODE_OPTIONS=--dns-result-order=ipv4first`), dan beralih ke `ipv4first` pada Node 22+ jika tidak ada yang berlaku.
    - Pada WSL2, atau ketika perilaku khusus IPv4 berfungsi lebih baik, paksa pemilihan famili:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang tolok ukur RFC 2544 (`198.18.0.0/15`) sudah diizinkan untuk pengunduhan media Telegram secara default. Jika fake-IP tepercaya atau proxy transparan menulis ulang `api.telegram.org` menjadi alamat privat/internal/penggunaan khusus lain selama pengunduhan media, ikut sertakan bypass khusus Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Keikutsertaan yang sama tersedia per akun di `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jika proxy Anda me-resolve host media Telegram ke `198.18.x.x`, biarkan flag berbahaya dinonaktifkan terlebih dahulu — rentang tersebut sudah diizinkan secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` memperlemah perlindungan SSRF media Telegram. Gunakan hanya untuk lingkungan proxy tepercaya yang dikontrol operator (perutean fake-IP Clash, Mihomo, Surge) yang menyintesis jawaban privat atau penggunaan khusus di luar rentang tolok ukur RFC 2544. Biarkan dinonaktifkan untuk akses Telegram melalui internet publik biasa.
    </Warning>

    - Penggantian lingkungan sementara: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - Validasi jawaban DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Bantuan lainnya: [Pemecahan masalah kanal](/id/channels/troubleshooting).

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Telegram](/id/gateway/config-channels#telegram).

<Accordion title="Kolom Telegram dengan sinyal tinggi">

- startup/auth: `enabled`, `botToken`, `tokenFile` (harus berupa berkas biasa; symlink ditolak), `accounts.*`
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` tingkat teratas (`type: "acp"`)
- default topik: `groups.<chatId>.topics."*"` berlaku untuk topik forum yang tidak cocok; ID topik yang tepat akan menimpanya
- persetujuan eksekusi: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- utas/balasan: `replyToMode`, `threadBindings`
- streaming: `streaming` (mode `off | partial | block | progress`), `streaming.preview.toolProgress`
- pemformatan/pengiriman: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API kustom: `apiRoot` (hanya root Bot API; jangan sertakan `/bot<TOKEN>`), `trustedLocalFileRoots` (root `file_path` absolut untuk Bot API yang di-host sendiri)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- tindakan/kemampuan: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- reaksi: `reactionNotifications`, `reactionLevel`
- kesalahan: `errorPolicy`, `silentErrorReplies`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Prioritas multi-akun: jika dua atau lebih ID akun dikonfigurasi, tetapkan `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) agar perutean default ditentukan secara eksplisit. Jika tidak, OpenClaw menggunakan ID akun pertama yang telah dinormalisasi dan `openclaw doctor` memberikan peringatan. Akun bernama mewarisi `channels.telegram.allowFrom` / `groupAllowFrom`, tetapi tidak mewarisi nilai `accounts.default.*`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Telegram ke gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku daftar izin grup dan topik.
  </Card>
  <Card title="Perutean saluran" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan penguatan keamanan.
  </Card>
  <Card title="Perutean multi-agen" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan grup dan topik ke agen.
  </Card>
  <Card title="Pemecahan masalah" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran.
  </Card>
</CardGroup>
