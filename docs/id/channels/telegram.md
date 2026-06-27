---
read_when:
    - Bekerja pada fitur Telegram atau webhook
summary: Status dukungan, kemampuan, dan konfigurasi bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-06-27T17:12:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

Siap produksi untuk DM bot dan grup melalui grammY. Long polling adalah mode default; mode webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel dan playbook perbaikan.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi channel lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Create the bot token in BotFather">
    Buka Telegram dan chat dengan **@BotFather** (pastikan handle persis `@BotFather`).

    Jalankan `/newbot`, ikuti prompt, dan simpan token.

  </Step>

  <Step title="Configure token and DM policy">

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

    Fallback env: `TELEGRAM_BOT_TOKEN=...` (hanya akun default).
    Telegram **tidak** menggunakan `openclaw channels login telegram`; konfigurasikan token di config/env, lalu mulai gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kode pairing kedaluwarsa setelah 1 jam.

  </Step>

  <Step title="Add the bot to a group">
    Tambahkan bot ke grup Anda, lalu dapatkan kedua ID yang dibutuhkan akses grup:

    - ID pengguna Telegram Anda, digunakan di `allowFrom` / `groupAllowFrom`
    - ID chat grup Telegram, digunakan sebagai kunci di bawah `channels.telegram.groups`

    Untuk penyiapan pertama kali, dapatkan ID chat grup dari `openclaw logs --follow`, bot ID-terusan, atau Bot API `getUpdates`. Setelah grup diizinkan, `/whoami@<bot_username>` dapat mengonfirmasi ID pengguna dan grup.

    ID supergroup Telegram negatif yang diawali `-100` adalah ID chat grup. Letakkan di bawah `channels.telegram.groups`, bukan di bawah `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Urutan resolusi token sadar-akun. Dalam praktiknya, nilai config menang atas fallback env, dan `TELEGRAM_BOT_TOKEN` hanya berlaku untuk akun default.
Setelah startup berhasil, OpenClaw menyimpan identitas bot dalam cache di direktori state hingga 24 jam agar restart dapat menghindari panggilan Telegram `getMe` tambahan; mengubah atau menghapus token akan membersihkan cache tersebut.
</Note>

## Pengaturan sisi Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Bot Telegram default menggunakan **Privacy Mode**, yang membatasi pesan grup yang mereka terima.

    Jika bot harus melihat semua pesan grup, lakukan salah satu:

    - nonaktifkan privacy mode melalui `/setprivacy`, atau
    - jadikan bot sebagai admin grup.

    Saat mengubah privacy mode, hapus + tambahkan kembali bot di setiap grup agar Telegram menerapkan perubahan.

  </Accordion>

  <Accordion title="Group permissions">
    Status admin dikontrol di pengaturan grup Telegram.

    Bot admin menerima semua pesan grup, yang berguna untuk perilaku grup yang selalu aktif.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` untuk mengizinkan/menolak penambahan ke grup
    - `/setprivacy` untuk perilaku visibilitas grup

  </Accordion>
</AccordionGroup>

## Kontrol akses dan aktivasi

### Identitas bot grup

Di grup dan topik forum Telegram, mention eksplisit ke handle bot yang dikonfigurasi (misalnya `@my_bot`) diperlakukan sebagai mengalamatkan agen OpenClaw yang dipilih, bahkan ketika nama persona agen berbeda dari username Telegram. Kebijakan senyap grup tetap berlaku untuk traffic grup yang tidak terkait, tetapi handle bot itu sendiri tidak dianggap sebagai "orang lain."

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` mengontrol akses pesan langsung:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu ID pengirim di `allowFrom`)
    - `open` (memerlukan `allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    `dmPolicy: "open"` dengan `allowFrom: ["*"]` memungkinkan akun Telegram apa pun yang menemukan atau menebak username bot untuk memerintah bot. Gunakan hanya untuk bot publik yang memang disengaja dengan alat yang sangat dibatasi; bot satu-pemilik sebaiknya menggunakan `allowlist` dengan ID pengguna numerik.

    `channels.telegram.allowFrom` menerima ID pengguna Telegram numerik. Prefiks `telegram:` / `tg:` diterima dan dinormalisasi.
    Dalam config multi-akun, `channels.telegram.allowFrom` tingkat atas yang restriktif diperlakukan sebagai batas keselamatan: entri tingkat-akun `allowFrom: ["*"]` tidak membuat akun tersebut publik kecuali allowlist akun efektif masih berisi wildcard eksplisit setelah penggabungan.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi config.
    Penyiapan hanya meminta ID pengguna numerik.
    Jika Anda melakukan upgrade dan config Anda berisi entri allowlist `@username`, jalankan `openclaw doctor --fix` untuk menyelesaikannya (upaya terbaik; memerlukan token bot Telegram).
    Jika sebelumnya Anda mengandalkan file allowlist pairing-store, `openclaw doctor --fix` dapat memulihkan entri ke `channels.telegram.allowFrom` dalam flow allowlist (misalnya ketika `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot satu-pemilik, pilih `dmPolicy: "allowlist"` dengan ID `allowFrom` numerik eksplisit agar kebijakan akses bertahan di config (alih-alih bergantung pada persetujuan pairing sebelumnya).

    Kebingungan umum: persetujuan pairing DM tidak berarti "pengirim ini diotorisasi di semua tempat".
    Pairing memberikan akses DM. Jika belum ada pemilik perintah, pairing pertama yang disetujui juga mengatur `commands.ownerAllowFrom` agar perintah khusus pemilik dan persetujuan exec memiliki akun operator eksplisit.
    Otorisasi pengirim grup tetap berasal dari allowlist config eksplisit.
    Jika Anda ingin "saya diotorisasi sekali dan DM serta perintah grup sama-sama berfungsi", letakkan ID pengguna Telegram numerik Anda di `channels.telegram.allowFrom`; untuk perintah khusus pemilik, pastikan `commands.ownerAllowFrom` berisi `telegram:<your user id>`.

    ### Menemukan ID pengguna Telegram Anda

    Lebih aman (tanpa bot pihak ketiga):

    1. DM bot Anda.
    2. Jalankan `openclaw logs --follow`.
    3. Baca `from.id`.

    Metode Bot API resmi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metode pihak ketiga (kurang privat): `@userinfobot` atau `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    Dua kontrol berlaku bersama:

    1. **Grup mana yang diizinkan** (`channels.telegram.groups`)
       - tanpa config `groups`:
         - dengan `groupPolicy: "open"`: grup apa pun dapat lolos pemeriksaan ID-grup
         - dengan `groupPolicy: "allowlist"` (default): grup diblokir sampai Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: bertindak sebagai allowlist (ID eksplisit atau `"*"`)

    2. **Pengirim mana yang diizinkan dalam grup** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` digunakan untuk pemfilteran pengirim grup. Jika tidak diatur, Telegram fallback ke `allowFrom`.
    Entri `groupAllowFrom` harus berupa ID pengguna Telegram numerik (prefiks `telegram:` / `tg:` dinormalisasi).
    Jangan letakkan ID chat grup atau supergroup Telegram di `groupAllowFrom`. ID chat negatif berada di bawah `channels.telegram.groups`.
    Entri non-numerik diabaikan untuk otorisasi pengirim.
    Batas keamanan (`2026.2.25+`): auth pengirim grup **tidak** mewarisi persetujuan pairing-store DM.
    Pairing tetap hanya untuk DM. Untuk grup, atur `groupAllowFrom` atau `allowFrom` per-grup/per-topik.
    Jika `groupAllowFrom` tidak diatur, Telegram fallback ke config `allowFrom`, bukan pairing store.
    Pola praktis untuk bot satu-pemilik: atur ID pengguna Anda di `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak diatur, dan izinkan grup target di bawah `channels.telegram.groups`.
    Catatan runtime: jika `channels.telegram` benar-benar tidak ada, runtime default ke fail-closed `groupPolicy="allowlist"` kecuali `channels.defaults.groupPolicy` diatur secara eksplisit.

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

    Contoh: izinkan anggota mana pun dalam satu grup tertentu:

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

    Contoh: izinkan hanya pengguna tertentu di dalam satu grup tertentu:

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
      Kesalahan umum: `groupAllowFrom` bukan allowlist grup Telegram.

      - Letakkan ID chat grup atau supergroup Telegram negatif seperti `-1001234567890` di bawah `channels.telegram.groups`.
      - Letakkan ID pengguna Telegram seperti `8734062810` di bawah `groupAllowFrom` ketika Anda ingin membatasi orang mana di dalam grup yang diizinkan dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya ketika Anda ingin anggota mana pun dari grup yang diizinkan dapat berbicara dengan bot.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Balasan grup memerlukan mention secara default.

    Mention dapat berasal dari:

    - mention native `@botusername`, atau
    - pola mention di:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Toggle perintah tingkat-sesi:

    - `/activation always`
    - `/activation mention`

    Ini hanya memperbarui state sesi. Gunakan config untuk persistensi.

    Contoh config persisten:

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

    Konteks riwayat grup default ke `mention-only`: pesan grup sebelumnya
    disertakan hanya ketika pesan tersebut dialamatkan ke bot, merupakan balasan ke bot,
    atau merupakan pesan bot sendiri. Atur `includeGroupHistoryContext: "recent"` untuk
    menyertakan riwayat room terbaru untuk grup tepercaya. Atur
    `includeGroupHistoryContext: "none"` untuk tidak mengirim riwayat grup Telegram sebelumnya
    pada turn berikutnya.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Mendapatkan ID chat grup:

    - teruskan pesan grup ke `@userinfobot` / `@getidsbot`
    - atau baca `chat.id` dari `openclaw logs --follow`
    - atau periksa Bot API `getUpdates`
    - setelah grup diizinkan, jalankan `/whoami@<bot_username>` jika perintah native diaktifkan

  </Tab>
</Tabs>

## Perilaku runtime

- Telegram dimiliki oleh proses gateway.
- Perutean bersifat deterministik: balasan masuk Telegram kembali ke Telegram (model tidak memilih saluran).
- Pesan masuk dinormalisasi ke dalam amplop saluran bersama dengan metadata balasan, placeholder media, dan konteks rantai balasan yang dipertahankan untuk balasan Telegram yang telah diamati gateway.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>` agar topik tetap terisolasi.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw mempertahankannya untuk balasan. Sesi topik DM hanya dipisah ketika Telegram `getMe` melaporkan `has_topics_enabled: true` untuk bot; jika tidak, DM tetap berada pada sesi datar.
- Long polling menggunakan runner grammY dengan pengurutan per-chat/per-thread. Konkurensi sink runner keseluruhan menggunakan `agents.defaults.maxConcurrent`.
- Startup multi-akun membatasi probe Telegram `getMe` bersamaan agar armada bot besar tidak menjalankan probe semua akun sekaligus.
- Long polling dijaga di dalam setiap proses gateway sehingga hanya satu poller aktif yang dapat menggunakan token bot pada satu waktu. Jika Anda masih melihat konflik `getUpdates` 409, kemungkinan gateway OpenClaw lain, skrip, atau poller eksternal menggunakan token yang sama.
- Restart watchdog long-polling dipicu setelah 120 detik tanpa liveness `getUpdates` yang selesai secara default. Naikkan `channels.telegram.pollingStallThresholdMs` hanya jika deployment Anda masih melihat restart polling-stall palsu selama pekerjaan yang berjalan lama. Nilainya dalam milidetik dan diizinkan dari `30000` hingga `600000`; override per-akun didukung.
- Telegram Bot API tidak memiliki dukungan tanda terima baca (`sendReadReceipts` tidak berlaku).

<Note>
  `channels.telegram.dm.threadReplies` dan `channels.telegram.direct.<chatId>.threadReplies` telah dihapus. Jalankan `openclaw doctor --fix` setelah upgrade jika konfigurasi Anda masih memiliki kunci tersebut. Perutean topik DM sekarang mengikuti kapabilitas bot dari Telegram `getMe.has_topics_enabled`, yang dikendalikan oleh mode ber-thread BotFather: bot dengan topik aktif menggunakan sesi DM berlingkup thread ketika Telegram mengirim `message_thread_id`; DM lain tetap berada pada sesi datar.
</Note>

## Referensi fitur

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw dapat melakukan streaming balasan parsial secara real time:

    - chat langsung: pesan pratinjau + `editMessageText`
    - grup/topik: pesan pratinjau + `editMessageText`

    Persyaratan:

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - pratinjau jawaban awal yang pendek diberi debounce, lalu diwujudkan setelah jeda terbatas jika run masih aktif
    - `progress` mempertahankan satu draf status yang dapat diedit untuk progres alat, menampilkan label status stabil ketika aktivitas jawaban datang sebelum progres alat, menghapusnya saat selesai, dan mengirim jawaban akhir sebagai pesan normal
    - `streaming.preview.toolProgress` mengontrol apakah pembaruan alat/progres menggunakan ulang pesan pratinjau yang diedit yang sama (default: `true` ketika streaming pratinjau aktif)
    - `streaming.preview.commandText` mengontrol detail command/exec di dalam baris progres alat tersebut: `raw` (default, mempertahankan perilaku rilis) atau `status` (hanya label alat)
    - `streaming.progress.commentary` (default: `false`) ikut mengaktifkan teks komentar/preambule asisten dalam draf progres sementara
    - legacy `channels.telegram.streamMode`, nilai boolean `streaming`, dan kunci pratinjau draf native yang sudah dihentikan dideteksi; jalankan `openclaw doctor --fix` untuk memigrasikannya ke konfigurasi streaming saat ini

    Pembaruan pratinjau progres alat adalah baris status pendek yang ditampilkan saat alat berjalan, misalnya eksekusi perintah, pembacaan file, pembaruan perencanaan, ringkasan patch, atau teks preambule/komentar Codex dalam mode app-server Codex. Telegram tetap mengaktifkannya secara default agar sesuai dengan perilaku OpenClaw yang dirilis dari `v2026.4.22` dan setelahnya.

    Untuk mempertahankan pratinjau yang diedit untuk teks jawaban tetapi menyembunyikan baris progres alat, tetapkan:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Untuk tetap menampilkan progres alat tetapi menyembunyikan teks command/exec, tetapkan:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Gunakan mode `progress` ketika Anda menginginkan progres alat yang terlihat tanpa mengedit jawaban akhir ke dalam pesan yang sama. Letakkan kebijakan teks perintah di bawah `streaming.progress`:

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

    Gunakan `streaming.mode: "off"` hanya ketika Anda menginginkan pengiriman final saja: edit pratinjau Telegram dinonaktifkan dan obrolan alat/progres generik ditekan alih-alih dikirim sebagai pesan status mandiri. Prompt persetujuan, payload media, dan error tetap dirutekan melalui pengiriman final normal. Gunakan `streaming.preview.toolProgress: false` ketika Anda hanya ingin mempertahankan edit pratinjau jawaban sambil menyembunyikan baris status progres alat.

    <Note>
      Balasan kutipan terpilih Telegram adalah pengecualian. Ketika `replyToMode` adalah `"first"`, `"all"`, atau `"batched"` dan pesan masuk menyertakan teks kutipan terpilih, OpenClaw mengirim jawaban akhir melalui jalur quote-reply native Telegram alih-alih mengedit pratinjau jawaban, sehingga `streaming.preview.toolProgress` tidak dapat menampilkan baris status pendek untuk giliran tersebut. Balasan pesan saat ini tanpa teks kutipan terpilih tetap mempertahankan streaming pratinjau. Tetapkan `replyToMode: "off"` ketika visibilitas progres alat lebih penting daripada balasan kutipan native, atau tetapkan `streaming.preview.toolProgress: false` untuk mengakui trade-off tersebut.
    </Note>

    Untuk balasan khusus teks:

    - pratinjau DM/grup/topik pendek: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan edit final di tempat
    - final teks panjang yang dipecah menjadi beberapa pesan Telegram menggunakan ulang pratinjau yang ada sebagai potongan final pertama bila memungkinkan, lalu hanya mengirim potongan yang tersisa
    - final mode progres menghapus draf status dan menggunakan pengiriman final normal alih-alih mengedit draf menjadi jawaban
    - jika edit final gagal sebelum teks selesai dikonfirmasi, OpenClaw menggunakan pengiriman final normal dan membersihkan pratinjau yang usang

    Untuk balasan kompleks (misalnya payload media), OpenClaw fallback ke pengiriman final normal lalu membersihkan pesan pratinjau.

    Streaming pratinjau terpisah dari streaming blok. Ketika streaming blok diaktifkan secara eksplisit untuk Telegram, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

    Perilaku stream penalaran:

    - `/reasoning stream` menggunakan jalur pratinjau penalaran saluran yang didukung; di Telegram, ini men-stream penalaran ke pratinjau live saat menghasilkan
    - pratinjau penalaran dihapus setelah pengiriman final; gunakan `/reasoning on` ketika penalaran harus tetap terlihat
    - jawaban akhir dikirim tanpa teks penalaran

  </Accordion>

  <Accordion title="Rich message formatting">
    Teks keluar menggunakan pesan HTML Telegram standar secara default agar balasan tetap dapat dibaca di seluruh klien Telegram saat ini. Mode kompatibilitas ini mendukung bold, italic, tautan, kode, spoiler, dan kutipan normal, tetapi tidak mendukung blok khusus-rich Bot API 10.1 seperti tabel native, detail, rich media, dan formula.

    Tetapkan `channels.telegram.richMessages: true` untuk ikut menggunakan pesan rich Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Ketika diaktifkan:

    - Agen diberi tahu bahwa pesan rich Telegram tersedia untuk bot/akun ini.
    - Teks Markdown dirender melalui IR Markdown OpenClaw dan dikirim sebagai HTML rich Telegram.
    - Payload HTML rich eksplisit mempertahankan tag Bot API 10.1 yang didukung seperti heading, tabel, detail, rich media, dan formula.
    - Caption media tetap menggunakan caption HTML Telegram karena pesan rich tidak menggantikan caption.

    Ini menjaga teks model tetap jauh dari sigil Telegram Rich Markdown, sehingga mata uang seperti `$400-600K` tidak diurai sebagai matematika. Teks rich yang panjang dipecah otomatis sesuai batas teks rich dan blok rich Telegram. Tabel yang melebihi batas kolom Telegram dikirim sebagai blok kode.

    Default: nonaktif untuk kompatibilitas klien. Pesan rich memerlukan klien Telegram yang kompatibel; beberapa klien Desktop, Web, Android, dan pihak ketiga saat ini menampilkan pesan rich yang diterima sebagai tidak didukung. Biarkan opsi ini dinonaktifkan kecuali setiap klien yang digunakan dengan bot dapat merendernya. `/status` menampilkan apakah sesi Telegram saat ini mengaktifkan atau menonaktifkan pesan rich.

    Pratinjau tautan diaktifkan secara default. `channels.telegram.linkPreview: false` melewati deteksi entitas otomatis untuk teks rich.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Registrasi menu perintah Telegram ditangani saat startup dengan `setMyCommands`.

    Default perintah native:

    - `commands.native: "auto"` mengaktifkan perintah native untuk Telegram

    Tambahkan entri menu perintah kustom:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Aturan:

    - nama dinormalisasi (hapus `/` di awal, huruf kecil)
    - pola valid: `a-z`, `0-9`, `_`, panjang `1..32`
    - perintah kustom tidak dapat mengganti perintah native
    - konflik/duplikat dilewati dan dicatat di log

    Catatan:

    - perintah kustom hanya berupa entri menu; tidak otomatis mengimplementasikan perilaku
    - perintah plugin/skill tetap dapat berfungsi ketika diketik meskipun tidak ditampilkan di menu Telegram

    Jika perintah native dinonaktifkan, bawaan dihapus. Perintah kustom/plugin masih dapat didaftarkan jika dikonfigurasi.

    Kegagalan penyiapan umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu Telegram masih meluap setelah pemangkasan; kurangi perintah plugin/skill/kustom atau nonaktifkan `channels.telegram.commands.native`.
    - kegagalan `deleteWebhook`, `deleteMyCommands`, atau `setMyCommands` dengan `404: Not Found` sementara perintah curl Bot API langsung berfungsi dapat berarti `channels.telegram.apiRoot` diatur ke endpoint `/bot<TOKEN>` lengkap. `apiRoot` harus hanya root Bot API, dan `openclaw doctor --fix` menghapus `/bot<TOKEN>` di akhir yang tidak disengaja.
    - `getMe returned 401` berarti Telegram menolak token bot yang dikonfigurasi. Perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` dengan token BotFather saat ini; OpenClaw berhenti sebelum polling sehingga ini tidak dilaporkan sebagai kegagalan pembersihan webhook.
    - `setMyCommands failed` dengan error jaringan/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah pemasangan perangkat (plugin `device-pair`)

    Ketika plugin `device-pair` terinstal:

    1. `/pair` menghasilkan kode penyiapan
    2. tempel kode di aplikasi iOS
    3. `/pair pending` mencantumkan permintaan tertunda (termasuk peran/cakupan)
    4. setujui permintaan:
       - `/pair approve <requestId>` untuk persetujuan eksplisit
       - `/pair approve` ketika hanya ada satu permintaan tertunda
       - `/pair approve latest` untuk yang paling baru

    Kode penyiapan membawa token bootstrap berumur pendek. Bootstrap kode penyiapan bawaan hanya untuk node: koneksi pertama membuat permintaan node tertunda, dan setelah persetujuan Gateway mengembalikan token node tahan lama dengan `scopes: []`. Ini tidak mengembalikan token operator yang diserahkan; akses operator memerlukan pairing operator terpisah yang disetujui atau alur token.

    Jika perangkat mencoba ulang dengan detail auth yang berubah (misalnya peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan permintaan baru menggunakan `requestId` yang berbeda. Jalankan ulang `/pair pending` sebelum menyetujui.

    Detail selengkapnya: [Penyandingan](/id/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Tombol inline">
    Konfigurasikan cakupan keyboard inline:

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

    Override per akun:

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

    Cakupan:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (default)

    Legacy `capabilities: ["inlineButtons"]` dipetakan ke `inlineButtons: "all"`.

    Contoh aksi pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Contoh tombol Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Tombol `web_app` Telegram hanya berfungsi dalam obrolan pribadi antara pengguna dan
    bot.

    Klik callback diteruskan ke agen sebagai teks:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Aksi pesan Telegram untuk agen dan otomatisasi">
    Aksi alat Telegram mencakup:

    - `sendMessage` (`to`, `content`, opsional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` atau `caption`, tombol inline `presentation` opsional; pengeditan hanya tombol memperbarui markup balasan)
    - `createForumTopic` (`chatId`, `name`, opsional `iconColor`, `iconCustomEmojiId`)

    Aksi pesan channel mengekspos alias ergonomis (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrol gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (default: dinonaktifkan)

    Catatan: `edit` dan `topic-create` saat ini diaktifkan secara default dan tidak memiliki toggle `channels.telegram.actions.*` terpisah.
    Pengiriman runtime menggunakan snapshot config/secrets aktif (startup/reload), sehingga jalur aksi tidak melakukan resolusi ulang SecretRef ad-hoc per pengiriman.

    Semantik penghapusan reaksi: [/tools/reactions](/id/tools/reactions)

  </Accordion>

  <Accordion title="Tag threading balasan">
    Telegram mendukung tag threading balasan eksplisit dalam output yang dihasilkan:

    - `[[reply_to_current]]` membalas pesan pemicu
    - `[[reply_to:<id>]]` membalas ID pesan Telegram tertentu

    `channels.telegram.replyToMode` mengontrol penanganan:

    - `off` (default)
    - `first`
    - `all`

    Saat threading balasan diaktifkan dan teks atau caption Telegram asli tersedia, OpenClaw otomatis menyertakan kutipan asli Telegram. Telegram membatasi teks kutipan asli hingga 1024 unit kode UTF-16, sehingga pesan yang lebih panjang dikutip dari awal dan fallback ke balasan biasa jika Telegram menolak kutipan tersebut.

    Catatan: `off` menonaktifkan threading balasan implisit. Tag eksplisit `[[reply_to_*]]` tetap dihormati.

  </Accordion>

  <Accordion title="Topik forum dan perilaku thread">
    Supergroup forum:

    - kunci sesi topik menambahkan `:topic:<threadId>`
    - balasan dan status mengetik menargetkan thread topik
    - jalur config topik:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Kasus khusus topik umum (`threadId=1`):

    - pengiriman pesan menghilangkan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)`)
    - aksi mengetik tetap menyertakan `message_thread_id`

    Pewarisan topik: entri topik mewarisi pengaturan grup kecuali dioverride (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` hanya untuk topik dan tidak diwarisi dari default grup.
    `topics."*"` menetapkan default untuk setiap topik dalam grup tersebut; ID topik persis tetap mengungguli `"*"`.

    **Perutean agen per topik**: Setiap topik dapat dirutekan ke agen berbeda dengan menetapkan `agentId` dalam config topik. Ini memberi setiap topik workspace, memori, dan sesi terisolasi miliknya sendiri. Contoh:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Setiap topik kemudian memiliki kunci sesinya sendiri: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Pengikatan topik ACP persisten**: Topik forum dapat menyematkan sesi harness ACP melalui binding ACP bertipe tingkat atas (`bindings[]` dengan `type: "acp"` dan `match.channel: "telegram"`, `peer.kind: "group"`, serta id berkualifikasi topik seperti `-1001234567890:topic:42`). Saat ini dicakup untuk topik forum dalam grup/supergroup. Lihat [Agen ACP](/id/tools/acp-agents).

    **Spawn ACP terikat thread dari obrolan**: `/acp spawn <agent> --thread here|auto` mengikat topik saat ini ke sesi ACP baru; tindak lanjut dirutekan langsung ke sana. OpenClaw menyematkan konfirmasi spawn dalam topik. Mengharuskan `channels.telegram.threadBindings.spawnSessions` tetap diaktifkan (default: `true`).

    Konteks templat mengekspos `MessageThreadId` dan `IsForum`. Obrolan DM dengan `message_thread_id` mempertahankan metadata balasan; obrolan tersebut hanya menggunakan kunci sesi sadar thread saat `getMe` Telegram melaporkan `has_topics_enabled: true` untuk bot.
    Override lama `dm.threadReplies` dan `direct.*.threadReplies` sengaja dipensiunkan; gunakan mode threaded BotFather sebagai satu-satunya sumber kebenaran dan jalankan `openclaw doctor --fix` untuk menghapus kunci config usang.

  </Accordion>

  <Accordion title="Audio, video, dan stiker">
    ### Pesan audio

    Telegram membedakan catatan suara dan file audio.

    - default: perilaku file audio
    - tag `[[audio_as_voice]]` dalam balasan agen untuk memaksa pengiriman catatan suara
    - transkrip catatan suara masuk dibingkai sebagai teks yang dihasilkan mesin
      dan tidak tepercaya dalam konteks agen; deteksi mention tetap menggunakan transkrip
      mentah sehingga pesan suara yang digating mention tetap berfungsi.

    Contoh aksi pesan:

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

    Telegram membedakan file video dan catatan video.

    Contoh tindakan pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Catatan video tidak mendukung keterangan; teks pesan yang diberikan dikirim secara terpisah.

    ### Stiker

    Penanganan stiker masuk:

    - WEBP statis: diunduh dan diproses (placeholder `<media:sticker>`)
    - TGS animasi: dilewati
    - WEBM video: dilewati

    Kolom konteks stiker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Deskripsi stiker disimpan dalam cache di status Plugin SQLite OpenClaw untuk mengurangi panggilan vision berulang.

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

    Tindakan kirim stiker:

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
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction notifications">
    Reaksi Telegram tiba sebagai pembaruan `message_reaction` (terpisah dari payload pesan).

    Saat diaktifkan, OpenClaw mengantrekan peristiwa sistem seperti:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfigurasi:

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    Catatan:

    - `own` berarti hanya reaksi pengguna terhadap pesan yang dikirim bot (upaya terbaik melalui cache pesan terkirim).
    - Peristiwa reaksi tetap mematuhi kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim tidak sah akan dibuang.
    - Telegram tidak menyediakan ID utas dalam pembaruan reaksi.
      - grup non-forum diarahkan ke sesi chat grup
      - grup forum diarahkan ke sesi topik umum grup (`:topic:1`), bukan topik asal yang tepat

    `allowed_updates` untuk polling/Webhook menyertakan `message_reaction` secara otomatis.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk. `ackReactionScope` menentukan *kapan* emoji itu benar-benar dikirim.

    **Urutan resolusi emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada "👀")

    Catatan:

    - Telegram mengharapkan emoji unicode (misalnya "👀").
    - Gunakan `""` untuk menonaktifkan reaksi untuk channel atau akun.

    **Cakupan (`messages.ackReactionScope`):**

    Penyedia Telegram membaca cakupan dari `messages.ackReactionScope` (default `"group-mentions"`). Saat ini tidak ada penimpaan tingkat akun Telegram atau tingkat channel Telegram.

    Nilai: `"all"` (DM + grup), `"direct"` (hanya DM), `"group-all"` (setiap pesan grup, tanpa DM), `"group-mentions"` (grup saat bot disebut; **tanpa DM** — ini adalah default), `"off"` / `"none"` (dinonaktifkan).

    <Note>
    Cakupan default (`"group-mentions"`) tidak memicu reaksi ack dalam pesan langsung. Untuk mendapatkan reaksi ack pada DM Telegram masuk, atur `messages.ackReactionScope` ke `"direct"` atau `"all"`. Nilai dibaca saat penyedia Telegram dimulai, jadi restart Gateway diperlukan agar perubahan berlaku.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Penulisan konfigurasi channel diaktifkan secara default (`configWrites !== false`).

    Penulisan yang dipicu Telegram mencakup:

    - peristiwa migrasi grup (`migrate_to_chat_id`) untuk memperbarui `channels.telegram.groups`
    - `/config set` dan `/config unset` (memerlukan pengaktifan perintah)

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

  <Accordion title="Long polling vs webhook">
    Default-nya adalah long polling. Untuk mode Webhook, atur `channels.telegram.webhookUrl` dan `channels.telegram.webhookSecret`; opsional `webhookPath`, `webhookHost`, `webhookPort` (default `/telegram-webhook`, `127.0.0.1`, `8787`).

    Dalam mode long-polling, OpenClaw mempertahankan watermark restart hanya setelah sebuah pembaruan berhasil dikirim. Jika handler gagal, pembaruan itu tetap dapat dicoba ulang dalam proses yang sama dan tidak ditulis sebagai selesai untuk deduplikasi restart.

    Listener lokal bind ke `127.0.0.1:8787`. Untuk ingress publik, letakkan reverse proxy di depan port lokal atau atur `webhookHost: "0.0.0.0"` secara sengaja.

    Mode Webhook memvalidasi penjaga permintaan, token rahasia Telegram, dan body JSON sebelum mengembalikan `200` ke Telegram.
    OpenClaw kemudian memproses pembaruan secara asinkron melalui jalur bot per-chat/per-topic yang sama dengan long polling, sehingga giliran agen yang lambat tidak menahan ACK pengiriman Telegram.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - Default `channels.telegram.textChunkLimit` adalah 4000.
    - `channels.telegram.chunkMode="newline"` mengutamakan batas paragraf (baris kosong) sebelum pemisahan berdasarkan panjang.
    - `channels.telegram.mediaMaxMb` (default 100) membatasi ukuran media Telegram masuk dan keluar.
    - `channels.telegram.mediaGroupFlushMs` (default 500) mengontrol berapa lama album/grup media Telegram ditahan sebelum OpenClaw mengirimkannya sebagai satu pesan masuk. Naikkan jika bagian album datang terlambat; turunkan untuk mengurangi latensi balasan album.
    - `channels.telegram.timeoutSeconds` menimpa timeout klien API Telegram (jika tidak diatur, default grammY berlaku). Klien bot membatasi nilai yang dikonfigurasi di bawah penjaga permintaan teks/pengetikan keluar 60 detik agar grammY tidak membatalkan pengiriman balasan yang terlihat sebelum penjaga transport dan fallback OpenClaw dapat berjalan. Long polling tetap menggunakan penjaga permintaan `getUpdates` 45 detik agar polling idle tidak ditinggalkan tanpa batas.
    - `channels.telegram.pollingStallThresholdMs` default ke `120000`; sesuaikan antara `30000` dan `600000` hanya untuk restart polling-stall positif palsu.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (default 50); `0` menonaktifkan.
    - konteks tambahan balasan/kutipan/terusan dinormalisasi menjadi satu jendela konteks percakapan terpilih saat gateway telah mengamati pesan induk; cache pesan yang diamati berada di status Plugin SQLite OpenClaw, dan `openclaw doctor --fix` mengimpor sidecar lama. Telegram hanya menyertakan satu `reply_to_message` dangkal dalam pembaruan, jadi rantai yang lebih lama dari cache dibatasi oleh payload pembaruan Telegram saat ini.
    - allowlist Telegram terutama membatasi siapa yang dapat memicu agent, bukan batas redaksi konteks tambahan penuh.
    - Kontrol riwayat DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfigurasi `channels.telegram.retry` berlaku untuk helper pengiriman Telegram (CLI/tools/actions) untuk galat API keluar yang dapat dipulihkan. Pengiriman balasan akhir masuk juga menggunakan retry safe-send terbatas untuk kegagalan pra-koneksi Telegram, tetapi tidak mengulang envelope jaringan pasca-kirim yang ambigu karena dapat menduplikasi pesan yang terlihat.

    Target pengiriman CLI dan message-tool dapat berupa ID chat numerik, nama pengguna, atau target topik forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Poll Telegram menggunakan `openclaw message poll` dan mendukung topik forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag poll khusus Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` untuk topik forum (atau gunakan target `:topic:`)

    Pengiriman Telegram juga mendukung:

    - `--presentation` dengan blok `buttons` untuk keyboard inline saat `channels.telegram.capabilities.inlineButtons` mengizinkannya
    - `--pin` atau `--delivery '{"pin":true}'` untuk meminta pengiriman yang dipin saat bot dapat melakukan pin di chat tersebut
    - `--force-document` untuk mengirim gambar, GIF, dan video keluar sebagai dokumen, bukan sebagai unggahan foto terkompresi, media animasi, atau video

    Pembatasan aksi:

    - `channels.telegram.actions.sendMessage=false` menonaktifkan pesan Telegram keluar, termasuk poll
    - `channels.telegram.actions.poll=false` menonaktifkan pembuatan poll Telegram sambil tetap mengaktifkan pengiriman biasa

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram mendukung persetujuan exec di DM pemberi persetujuan dan dapat secara opsional memposting prompt di chat atau topik asal. Pemberi persetujuan harus berupa ID pengguna Telegram numerik.

    Jalur konfigurasi:

    - `channels.telegram.execApprovals.enabled` (aktif otomatis saat setidaknya satu pemberi persetujuan dapat di-resolve)
    - `channels.telegram.execApprovals.approvers` (fallback ke ID owner numerik dari `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (default) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, dan `defaultTo` mengontrol siapa yang dapat berbicara dengan bot dan ke mana bot mengirim balasan normal. Itu tidak menjadikan seseorang sebagai pemberi persetujuan exec. Pemasangan DM pertama yang disetujui mem-bootstrap `commands.ownerAllowFrom` saat belum ada owner perintah, sehingga penyiapan satu owner tetap bekerja tanpa menduplikasi ID di bawah `execApprovals.approvers`.

    Pengiriman channel menampilkan teks perintah di chat; aktifkan `channel` atau `both` hanya di grup/topik tepercaya. Saat prompt masuk ke topik forum, OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjut. Persetujuan exec kedaluwarsa setelah 30 menit secara default.

    Tombol persetujuan inline juga mengharuskan `channels.telegram.capabilities.inlineButtons` mengizinkan permukaan target (`dm`, `group`, atau `all`). ID persetujuan berprefiks `plugin:` di-resolve melalui persetujuan plugin; yang lain di-resolve melalui persetujuan exec terlebih dahulu.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrol balasan galat

Saat agent mengalami galat pengiriman atau provider, Telegram dapat membalas dengan teks galat atau menekannya. Dua kunci konfigurasi mengontrol perilaku ini:

| Kunci                               | Nilai             | Default | Deskripsi                                                                                 |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` mengirim pesan galat yang ramah ke chat. `silent` menekan balasan galat sepenuhnya. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Waktu minimum antarbalasan galat ke chat yang sama. Mencegah spam galat selama gangguan. |

Override per akun, per grup, dan per topik didukung (pewarisan yang sama seperti kunci konfigurasi Telegram lainnya).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bot does not respond to non mention group messages">

    - Jika `requireMention=false`, mode privasi Telegram harus mengizinkan visibilitas penuh.
      - BotFather: `/setprivacy` -> Disable
      - lalu hapus + tambahkan ulang bot ke grup
    - `openclaw channels status` memperingatkan saat konfigurasi mengharapkan pesan grup tanpa mention.
    - `openclaw channels status --probe` dapat memeriksa ID grup numerik eksplisit; wildcard `"*"` tidak dapat diperiksa keanggotaannya.
    - uji sesi cepat: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - saat `channels.telegram.groups` ada, grup harus dicantumkan (atau menyertakan `"*"`)
    - verifikasi keanggotaan bot di grup
    - tinjau log: `openclaw logs --follow` untuk alasan skip

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - otorisasi identitas pengirim Anda (pairing dan/atau `allowFrom` numerik)
    - otorisasi perintah tetap berlaku bahkan saat kebijakan grup adalah `open`
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu native memiliki terlalu banyak entri; kurangi perintah plugin/skill/kustom atau nonaktifkan menu native
    - panggilan startup `deleteMyCommands` / `setMyCommands` dan panggilan pengetikan `sendChatAction` dibatasi dan di-retry sekali melalui fallback transport Telegram saat timeout permintaan. Galat jaringan/fetch yang persisten biasanya menunjukkan masalah keterjangkauan DNS/HTTPS ke `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` adalah kegagalan autentikasi Telegram untuk token bot yang dikonfigurasi.
    - Salin ulang atau buat ulang token bot di BotFather, lalu perbarui `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, atau `TELEGRAM_BOT_TOKEN` untuk akun default.
    - `deleteWebhook 401 Unauthorized` selama startup juga merupakan kegagalan autentikasi; memperlakukannya sebagai "tidak ada webhook" hanya akan menunda kegagalan token buruk yang sama ke panggilan API berikutnya.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ + fetch/proxy kustom dapat memicu perilaku abort langsung jika tipe AbortSignal tidak cocok.
    - Beberapa host me-resolve `api.telegram.org` ke IPv6 terlebih dahulu; egress IPv6 yang rusak dapat menyebabkan kegagalan API Telegram intermiten.
    - Jika log menyertakan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!`, OpenClaw kini mengulangnya sebagai galat jaringan yang dapat dipulihkan.
    - Selama startup polling, OpenClaw menggunakan kembali probe startup `getMe` yang berhasil untuk grammY sehingga runner tidak memerlukan `getMe` kedua sebelum `getUpdates` pertama.
    - Jika `deleteWebhook` gagal dengan galat jaringan sementara selama startup polling, OpenClaw melanjutkan ke long polling alih-alih membuat panggilan control-plane pra-poll lain. Webhook yang masih aktif muncul sebagai konflik `getUpdates`; OpenClaw kemudian membangun ulang transport Telegram dan mengulang pembersihan webhook.
    - Jika soket Telegram didaur ulang pada interval tetap yang pendek, periksa `channels.telegram.timeoutSeconds` yang rendah; klien bot membatasi nilai yang dikonfigurasi di bawah penjaga permintaan keluar dan `getUpdates`, tetapi rilis lama dapat membatalkan setiap poll atau balasan saat nilai ini diatur di bawah penjaga tersebut.
    - Jika log menyertakan `Polling stall detected`, OpenClaw memulai ulang polling dan membangun ulang transport Telegram setelah 120 detik tanpa liveness long-poll yang selesai secara default.
    - `openclaw channels status --probe` dan `openclaw doctor` memperingatkan saat akun polling yang berjalan belum menyelesaikan `getUpdates` setelah grace startup, saat akun webhook yang berjalan belum menyelesaikan `setWebhook` setelah grace startup, atau saat aktivitas transport polling terakhir yang berhasil sudah stale.
    - Naikkan `channels.telegram.pollingStallThresholdMs` hanya saat panggilan `getUpdates` yang berjalan lama sehat tetapi host Anda masih melaporkan restart polling-stall positif palsu. Stall persisten biasanya mengarah ke masalah proxy, DNS, IPv6, atau egress TLS antara host dan `api.telegram.org`.
    - Telegram juga menghormati env proxy proses untuk transport Bot API, termasuk `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan varian huruf kecilnya. `NO_PROXY` / `no_proxy` tetap dapat melewati `api.telegram.org`.
    - Jika proxy terkelola OpenClaw dikonfigurasi melalui `OPENCLAW_PROXY_URL` untuk lingkungan layanan dan tidak ada env proxy standar, Telegram juga menggunakan URL tersebut untuk transport Bot API.
    - Pada host VPS dengan egress/TLS langsung yang tidak stabil, rutekan panggilan API Telegram melalui `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ default ke `autoSelectFamily=true` (kecuali WSL2). Urutan hasil DNS Telegram menghormati `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, lalu `channels.telegram.network.dnsResultOrder`, lalu default proses seperti `NODE_OPTIONS=--dns-result-order=ipv4first`; jika tidak ada yang berlaku, Node 22+ fallback ke `ipv4first`.
    - Jika host Anda adalah WSL2 atau secara eksplisit bekerja lebih baik dengan perilaku hanya IPv4, paksa pemilihan family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang benchmark RFC 2544 (`198.18.0.0/15`) sudah diizinkan
      untuk unduhan media Telegram secara default. Jika fake-IP tepercaya atau
      proxy transparan menulis ulang `api.telegram.org` ke alamat
      privat/internal/penggunaan-khusus lain selama unduhan media, Anda dapat ikut serta
      dalam bypass khusus Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Opt-in yang sama tersedia per akun di
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jika proxy Anda me-resolve host media Telegram ke `198.18.x.x`, biarkan
      flag berbahaya tetap nonaktif terlebih dahulu. Media Telegram sudah mengizinkan
      rentang benchmark RFC 2544 secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` melemahkan perlindungan
      SSRF media Telegram. Gunakan hanya untuk lingkungan proxy tepercaya yang dikendalikan
      operator seperti routing fake-IP Clash, Mihomo, atau Surge saat lingkungan tersebut
      menyintesis jawaban privat atau penggunaan-khusus di luar rentang benchmark RFC 2544.
      Biarkan nonaktif untuk akses Telegram internet publik normal.
    </Warning>

    - Override lingkungan (sementara):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
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

<Accordion title="High-signal Telegram fields">

- startup/autentikasi: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` harus menunjuk ke file reguler; symlink ditolak)
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` tingkat atas (`type: "acp"`)
- default topik: `groups.<chatId>.topics."*"` berlaku untuk topik forum yang tidak cocok; ID topik persis menimpanya
- persetujuan eksekusi: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/balasan: `replyToMode`
- streaming: `streaming` (pratinjau), `streaming.preview.toolProgress`, `blockStreaming`
- pemformatan/pengiriman: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API kustom: `apiRoot` (hanya root Bot API; jangan sertakan `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- aksi/kapabilitas: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaksi: `reactionNotifications`, `reactionLevel`
- kesalahan: `errorPolicy`, `errorCooldownMs`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Presedensi multi-akun: saat dua atau lebih ID akun dikonfigurasi, atur `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) agar routing default eksplisit. Jika tidak, OpenClaw akan fallback ke ID akun ternormalisasi pertama dan `openclaw doctor` akan memperingatkan. Akun bernama mewarisi nilai `channels.telegram.allowFrom` / `groupAllowFrom`, tetapi tidak mewarisi nilai `accounts.default.*`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Telegram ke Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/id/channels/groups">
    Perilaku allowlist grup dan topik.
  </Card>
  <Card title="Channel routing" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Security" icon="shield" href="/id/gateway/security">
    Model ancaman dan hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan grup dan topik ke agen.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal.
  </Card>
</CardGroup>
