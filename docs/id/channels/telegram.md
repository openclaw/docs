---
read_when:
    - Mengerjakan fitur Telegram atau webhook
summary: Status dukungan, kemampuan, dan konfigurasi bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:46:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

Siap produksi untuk DM dan grup bot melalui grammY. Long polling adalah mode default; mode webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah penyandingan.
  </Card>
  <Card title="Pemecahan masalah channel" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel dan playbook perbaikan.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi channel lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Buat token bot di BotFather">
    Buka Telegram dan chat dengan **@BotFather** (pastikan handle persis `@BotFather`).

    Jalankan `/newbot`, ikuti prompt, dan simpan tokennya.

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

    Fallback env: `TELEGRAM_BOT_TOKEN=...` (hanya akun default).
    Telegram **tidak** menggunakan `openclaw channels login telegram`; konfigurasikan token di config/env, lalu mulai gateway.

  </Step>

  <Step title="Mulai gateway dan setujui DM pertama">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kode penyandingan kedaluwarsa setelah 1 jam.

  </Step>

  <Step title="Tambahkan bot ke grup">
    Tambahkan bot ke grup Anda, lalu dapatkan kedua ID yang diperlukan akses grup:

    - ID pengguna Telegram Anda, digunakan di `allowFrom` / `groupAllowFrom`
    - ID chat grup Telegram, digunakan sebagai kunci di bawah `channels.telegram.groups`

    Untuk penyiapan pertama kali, dapatkan ID chat grup dari `openclaw logs --follow`, bot ID-terusan, atau Bot API `getUpdates`. Setelah grup diizinkan, `/whoami@<bot_username>` dapat mengonfirmasi ID pengguna dan grup.

    ID supergrup Telegram negatif yang dimulai dengan `-100` adalah ID chat grup. Letakkan di bawah `channels.telegram.groups`, bukan di bawah `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Urutan resolusi token sadar akun. Dalam praktiknya, nilai config mengalahkan fallback env, dan `TELEGRAM_BOT_TOKEN` hanya berlaku untuk akun default.
Setelah startup berhasil, OpenClaw menyimpan cache identitas bot di direktori state hingga 24 jam sehingga restart dapat menghindari panggilan Telegram `getMe` tambahan; mengubah atau menghapus token akan menghapus cache tersebut.
</Note>

## Pengaturan sisi Telegram

<AccordionGroup>
  <Accordion title="Mode privasi dan visibilitas grup">
    Bot Telegram default ke **Mode Privasi**, yang membatasi pesan grup yang mereka terima.

    Jika bot harus melihat semua pesan grup, lakukan salah satu:

    - nonaktifkan mode privasi melalui `/setprivacy`, atau
    - jadikan bot sebagai admin grup.

    Saat mengubah mode privasi, hapus + tambahkan kembali bot di setiap grup agar Telegram menerapkan perubahan.

  </Accordion>

  <Accordion title="Izin grup">
    Status admin dikontrol di pengaturan grup Telegram.

    Bot admin menerima semua pesan grup, yang berguna untuk perilaku grup yang selalu aktif.

  </Accordion>

  <Accordion title="Toggle BotFather yang berguna">

    - `/setjoingroups` untuk mengizinkan/menolak penambahan ke grup
    - `/setprivacy` untuk perilaku visibilitas grup

  </Accordion>
</AccordionGroup>

## Kontrol akses dan aktivasi

### Identitas bot grup

Di grup Telegram dan topik forum, penyebutan eksplisit handle bot yang dikonfigurasi (misalnya `@my_bot`) diperlakukan sebagai mengalamatkan agent OpenClaw yang dipilih, meskipun nama persona agent berbeda dari username Telegram. Kebijakan senyap grup tetap berlaku untuk trafik grup yang tidak terkait, tetapi handle bot itu sendiri tidak dianggap "orang lain."

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.telegram.dmPolicy` mengontrol akses pesan langsung:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu ID pengirim di `allowFrom`)
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `dmPolicy: "open"` dengan `allowFrom: ["*"]` memungkinkan akun Telegram mana pun yang menemukan atau menebak username bot untuk memberi perintah ke bot. Gunakan hanya untuk bot yang memang dimaksudkan publik dengan alat yang sangat dibatasi; bot satu pemilik sebaiknya menggunakan `allowlist` dengan ID pengguna numerik.

    `channels.telegram.allowFrom` menerima ID pengguna Telegram numerik. Prefiks `telegram:` / `tg:` diterima dan dinormalisasi.
    Dalam config multi-akun, `channels.telegram.allowFrom` tingkat atas yang restriktif diperlakukan sebagai batas keamanan: entri `allowFrom: ["*"]` tingkat akun tidak membuat akun tersebut publik kecuali allowlist akun efektif masih berisi wildcard eksplisit setelah penggabungan.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi config.
    Penyiapan hanya meminta ID pengguna numerik.
    Jika Anda memutakhirkan dan config Anda berisi entri allowlist `@username`, jalankan `openclaw doctor --fix` untuk menyelesaikannya (upaya terbaik; memerlukan token bot Telegram).
    Jika sebelumnya Anda mengandalkan file allowlist pairing-store, `openclaw doctor --fix` dapat memulihkan entri ke `channels.telegram.allowFrom` dalam alur allowlist (misalnya ketika `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot satu pemilik, pilih `dmPolicy: "allowlist"` dengan ID `allowFrom` numerik eksplisit agar kebijakan akses tetap tahan lama di config (alih-alih bergantung pada persetujuan penyandingan sebelumnya).

    Kebingungan umum: persetujuan penyandingan DM tidak berarti "pengirim ini diotorisasi di mana saja".
    Penyandingan memberikan akses DM. Jika belum ada pemilik perintah, penyandingan pertama yang disetujui juga menetapkan `commands.ownerAllowFrom` sehingga perintah khusus pemilik dan persetujuan exec memiliki akun operator eksplisit.
    Otorisasi pengirim grup tetap berasal dari allowlist config eksplisit.
    Jika Anda ingin "Saya diotorisasi sekali dan DM serta perintah grup sama-sama berfungsi", letakkan ID pengguna Telegram numerik Anda di `channels.telegram.allowFrom`; untuk perintah khusus pemilik, pastikan `commands.ownerAllowFrom` berisi `telegram:<your user id>`.

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

  <Tab title="Kebijakan grup dan allowlist">
    Dua kontrol berlaku bersama:

    1. **Grup mana yang diizinkan** (`channels.telegram.groups`)
       - tanpa config `groups`:
         - dengan `groupPolicy: "open"`: grup apa pun dapat lolos pemeriksaan ID grup
         - dengan `groupPolicy: "allowlist"` (default): grup diblokir hingga Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: bertindak sebagai allowlist (ID eksplisit atau `"*"`)

    2. **Pengirim mana yang diizinkan di grup** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` digunakan untuk pemfilteran pengirim grup. Jika tidak disetel, Telegram fallback ke `allowFrom`.
    Entri `groupAllowFrom` sebaiknya berupa ID pengguna Telegram numerik (prefiks `telegram:` / `tg:` dinormalisasi).
    Jangan letakkan ID chat grup atau supergrup Telegram di `groupAllowFrom`. ID chat negatif berada di bawah `channels.telegram.groups`.
    Entri non-numerik diabaikan untuk otorisasi pengirim.
    Batas keamanan (`2026.2.25+`): auth pengirim grup **tidak** mewarisi persetujuan pairing-store DM.
    Penyandingan tetap hanya untuk DM. Untuk grup, setel `groupAllowFrom` atau `allowFrom` per grup/per topik.
    Jika `groupAllowFrom` tidak disetel, Telegram fallback ke config `allowFrom`, bukan pairing store.
    Pola praktis untuk bot satu pemilik: setel ID pengguna Anda di `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak disetel, dan izinkan grup target di bawah `channels.telegram.groups`.
    Catatan runtime: jika `channels.telegram` benar-benar tidak ada, runtime default ke fail-closed `groupPolicy="allowlist"` kecuali `channels.defaults.groupPolicy` disetel eksplisit.

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

    Contoh: izinkan anggota mana pun di satu grup tertentu:

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

      - Letakkan ID chat grup atau supergrup Telegram negatif seperti `-1001234567890` di bawah `channels.telegram.groups`.
      - Letakkan ID pengguna Telegram seperti `8734062810` di bawah `groupAllowFrom` ketika Anda ingin membatasi siapa di dalam grup yang diizinkan dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya ketika Anda ingin anggota mana pun dari grup yang diizinkan dapat berbicara dengan bot.

    </Warning>

  </Tab>

  <Tab title="Perilaku mention">
    Balasan grup memerlukan mention secara default.

    Mention dapat berasal dari:

    - mention native `@botusername`, atau
    - pola mention di:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Toggle perintah tingkat sesi:

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

    Konteks riwayat grup selalu aktif untuk grup dan dibatasi oleh
    `historyLimit`. Setel `channels.telegram.historyLimit: 0` untuk menonaktifkan
    jendela riwayat grup Telegram. Kunci pensiun `includeGroupHistoryContext`
    dihapus oleh `openclaw doctor --fix`.

    Mendapatkan ID chat grup:

    - teruskan pesan grup ke `@userinfobot` / `@getidsbot`
    - atau baca `chat.id` dari `openclaw logs --follow`
    - atau periksa Bot API `getUpdates`
    - setelah grup diizinkan, jalankan `/whoami@<bot_username>` jika perintah native diaktifkan

  </Tab>
</Tabs>

## Perilaku runtime

- Telegram dimiliki oleh proses Gateway.
- Routing bersifat deterministik: balasan masuk Telegram kembali ke Telegram (model tidak memilih saluran).
- Pesan masuk dinormalisasi ke dalam envelope saluran bersama dengan metadata balasan, placeholder media, dan konteks rantai balasan yang dipersistenkan untuk balasan Telegram yang telah diamati Gateway.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>` agar topik tetap terisolasi.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw mempertahankannya untuk balasan. Sesi topik DM dipisahkan hanya ketika Telegram `getMe` melaporkan `has_topics_enabled: true` untuk bot; jika tidak, DM tetap berada pada sesi datar.
- Long polling menggunakan runner grammY dengan pengurutan per-obrolan/per-utas. Konkurensi sink runner keseluruhan menggunakan `agents.defaults.maxConcurrent`.
- Startup multi-akun membatasi probe Telegram `getMe` yang berjalan bersamaan sehingga armada bot besar tidak menjalankan probe semua akun sekaligus.
- Long polling dijaga di dalam setiap proses Gateway sehingga hanya satu poller aktif yang dapat menggunakan token bot pada satu waktu. Jika Anda masih melihat konflik `getUpdates` 409, kemungkinan Gateway OpenClaw lain, skrip, atau poller eksternal sedang menggunakan token yang sama.
- Restart watchdog long-polling secara default dipicu setelah 120 detik tanpa liveness `getUpdates` yang selesai. Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya jika deployment Anda masih mengalami restart polling-stall palsu selama pekerjaan berjalan lama. Nilainya dalam milidetik dan diizinkan dari `30000` hingga `600000`; override per-akun didukung.
- Telegram Bot API tidak memiliki dukungan tanda-terima baca (`sendReadReceipts` tidak berlaku).

<Note>
  `channels.telegram.dm.threadReplies` dan `channels.telegram.direct.<chatId>.threadReplies` telah dihapus. Jalankan `openclaw doctor --fix` setelah memutakhirkan jika konfigurasi Anda masih memiliki kunci tersebut. Routing topik DM sekarang mengikuti kapabilitas bot dari Telegram `getMe.has_topics_enabled`, yang dikendalikan oleh mode berutas BotFather: bot dengan topik aktif menggunakan sesi DM berlingkup utas saat Telegram mengirim `message_thread_id`; DM lain tetap berada pada sesi datar.
</Note>

## Referensi fitur

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw dapat melakukan streaming balasan parsial secara real time:

    - obrolan langsung: pesan pratinjau + `editMessageText`
    - grup/topik: pesan pratinjau + `editMessageText`

    Persyaratan:

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - pratinjau jawaban awal yang pendek di-debounce, lalu dimaterialisasi setelah jeda terbatas jika run masih aktif
    - `progress` mempertahankan satu draf status yang dapat diedit untuk progres tool, menampilkan label status stabil saat aktivitas jawaban tiba sebelum progres tool, menghapusnya saat selesai, dan mengirim jawaban akhir sebagai pesan normal
    - `streaming.preview.toolProgress` mengontrol apakah pembaruan tool/progres menggunakan ulang pesan pratinjau yang sama yang diedit (default: `true` saat streaming pratinjau aktif)
    - `streaming.preview.commandText` mengontrol detail command/exec di dalam baris progres tool tersebut: `raw` (default, mempertahankan perilaku yang telah dirilis) atau `status` (hanya label tool)
    - `streaming.progress.commentary` (default: `false`) ikut menyertakan teks komentar/preambule asisten dalam draf progres sementara
    - `channels.telegram.streamMode` lama, nilai boolean `streaming`, dan kunci pratinjau draf native yang sudah dihentikan dideteksi; jalankan `openclaw doctor --fix` untuk memigrasikannya ke konfigurasi streaming saat ini

    Pembaruan pratinjau progres tool adalah baris status pendek yang ditampilkan saat tool berjalan, misalnya eksekusi perintah, pembacaan file, pembaruan perencanaan, ringkasan patch, atau teks preambule/komentar Codex dalam mode app-server Codex. Telegram mengaktifkannya secara default agar cocok dengan perilaku OpenClaw yang dirilis sejak `v2026.4.22` dan setelahnya.

    Untuk mempertahankan pratinjau yang diedit untuk teks jawaban tetapi menyembunyikan baris progres tool, atur:

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

    Untuk mempertahankan progres tool tetap terlihat tetapi menyembunyikan teks command/exec, atur:

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

    Gunakan mode `progress` saat Anda menginginkan progres tool yang terlihat tanpa mengedit jawaban akhir ke dalam pesan yang sama. Letakkan kebijakan teks perintah di bawah `streaming.progress`:

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

    Gunakan `streaming.mode: "off"` hanya saat Anda menginginkan pengiriman hanya-akhir: edit pratinjau Telegram dinonaktifkan dan obrolan tool/progres generik ditekan alih-alih dikirim sebagai pesan status mandiri. Prompt persetujuan, payload media, dan error tetap dirutekan melalui pengiriman akhir normal. Gunakan `streaming.preview.toolProgress: false` saat Anda hanya ingin mempertahankan edit pratinjau jawaban sambil menyembunyikan baris status progres tool.

    <Note>
      Balasan kutipan terpilih Telegram adalah pengecualian. Saat `replyToMode` adalah `"first"`, `"all"`, atau `"batched"` dan pesan masuk menyertakan teks kutipan terpilih, OpenClaw mengirim jawaban akhir melalui jalur quote-reply native Telegram alih-alih mengedit pratinjau jawaban, sehingga `streaming.preview.toolProgress` tidak dapat menampilkan baris status pendek untuk giliran tersebut. Balasan pesan saat ini tanpa teks kutipan terpilih tetap mempertahankan streaming pratinjau. Atur `replyToMode: "off"` saat visibilitas progres tool lebih penting daripada balasan kutipan native, atau atur `streaming.preview.toolProgress: false` untuk menerima trade-off tersebut.
    </Note>

    Untuk balasan hanya teks:

    - pratinjau DM/grup/topik pendek: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan edit akhir di tempat
    - final teks panjang yang dipecah menjadi beberapa pesan Telegram menggunakan ulang pratinjau yang ada sebagai potongan final pertama jika memungkinkan, lalu hanya mengirim potongan yang tersisa
    - final mode progres menghapus draf status dan menggunakan pengiriman akhir normal alih-alih mengedit draf menjadi jawaban
    - jika edit akhir gagal sebelum teks selesai dikonfirmasi, OpenClaw menggunakan pengiriman akhir normal dan membersihkan pratinjau usang

    Untuk balasan kompleks (misalnya payload media), OpenClaw kembali ke pengiriman akhir normal lalu membersihkan pesan pratinjau.

    Streaming pratinjau terpisah dari streaming blok. Saat streaming blok diaktifkan secara eksplisit untuk Telegram, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

    Perilaku stream penalaran:

    - `/reasoning stream` menggunakan jalur pratinjau penalaran saluran yang didukung; di Telegram, ini melakukan streaming penalaran ke pratinjau langsung saat menghasilkan
    - pratinjau penalaran dihapus setelah pengiriman akhir; gunakan `/reasoning on` saat penalaran harus tetap terlihat
    - jawaban akhir dikirim tanpa teks penalaran

  </Accordion>

  <Accordion title="Rich message formatting">
    Teks keluar menggunakan pesan HTML Telegram standar secara default sehingga balasan tetap mudah dibaca di seluruh klien Telegram saat ini. Mode kompatibilitas ini mendukung bold, italic, tautan, kode, spoiler, dan kutipan normal, tetapi tidak mendukung blok khusus rich Bot API 10.1 seperti tabel native, details, rich media, dan formula.

    Atur `channels.telegram.richMessages: true` untuk ikut menggunakan rich messages Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Saat diaktifkan:

    - Agen diberi tahu bahwa rich messages Telegram tersedia untuk bot/akun ini.
    - Teks Markdown dirender melalui IR Markdown OpenClaw dan dikirim sebagai HTML kaya Telegram.
    - Payload HTML kaya eksplisit mempertahankan tag Bot API 10.1 yang didukung seperti heading, tabel, details, rich media, dan formula.
    - Caption media tetap menggunakan caption HTML Telegram karena rich messages tidak menggantikan caption.

    Ini menjauhkan teks model dari sigil Telegram Rich Markdown, sehingga mata uang seperti `$400-600K` tidak diparse sebagai matematika. Teks kaya panjang dipecah otomatis melintasi batas teks kaya dan blok kaya Telegram. Tabel yang melebihi batas kolom Telegram dikirim sebagai blok kode.

    Default: nonaktif demi kompatibilitas klien. Rich messages memerlukan klien Telegram yang kompatibel; beberapa klien Desktop, Web, Android, dan pihak ketiga saat ini menampilkan rich messages yang diterima sebagai tidak didukung. Biarkan opsi ini dinonaktifkan kecuali setiap klien yang digunakan dengan bot dapat merendernya. `/status` menunjukkan apakah sesi Telegram saat ini mengaktifkan atau menonaktifkan rich messages.

    Pratinjau tautan diaktifkan secara default. `channels.telegram.linkPreview: false` melewati deteksi entitas otomatis untuk teks kaya.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Pendaftaran menu perintah Telegram ditangani saat startup dengan `setMyCommands`.

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

    - nama dinormalisasi (menghapus `/` di awal, huruf kecil)
    - pola valid: `a-z`, `0-9`, `_`, panjang `1..32`
    - perintah kustom tidak dapat menimpa perintah native
    - konflik/duplikat dilewati dan dicatat di log

    Catatan:

    - perintah kustom hanya entri menu; perintah tersebut tidak otomatis mengimplementasikan perilaku
    - perintah plugin/skill tetap dapat bekerja saat diketik meskipun tidak ditampilkan di menu Telegram

    Jika perintah native dinonaktifkan, bawaan dihapus. Perintah kustom/plugin masih dapat mendaftar jika dikonfigurasi.

    Kegagalan setup umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu Telegram masih melampaui batas setelah dipangkas; kurangi perintah plugin/skill/kustom atau nonaktifkan `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands`, atau `setMyCommands` gagal dengan `404: Not Found` sementara perintah curl Bot API langsung berfungsi dapat berarti `channels.telegram.apiRoot` diatur ke endpoint penuh `/bot<TOKEN>`. `apiRoot` harus hanya root Bot API, dan `openclaw doctor --fix` menghapus akhiran `/bot<TOKEN>` yang tidak sengaja.
    - `getMe returned 401` berarti Telegram menolak token bot yang dikonfigurasi. Perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` dengan token BotFather saat ini; OpenClaw berhenti sebelum polling sehingga ini tidak dilaporkan sebagai kegagalan pembersihan Webhook.
    - `setMyCommands failed` dengan error jaringan/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah pemasangan perangkat (plugin `device-pair`)

    Saat plugin `device-pair` terpasang:

    1. `/pair` menghasilkan kode setup
    2. tempel kode di aplikasi iOS
    3. `/pair pending` mencantumkan permintaan tertunda (termasuk role/scope)
    4. setujui permintaan:
       - `/pair approve <requestId>` untuk persetujuan eksplisit
       - `/pair approve` saat hanya ada satu permintaan tertunda
       - `/pair approve latest` untuk yang paling baru

    Kode setup membawa token bootstrap berumur pendek. Bootstrap kode setup bawaan hanya untuk node: koneksi pertama membuat permintaan node tertunda, dan setelah persetujuan Gateway mengembalikan token node tahan lama dengan `scopes: []`. Ini tidak mengembalikan token operator yang dialihkan; akses operator memerlukan pemasangan operator terpisah yang disetujui atau alur token.

    Jika perangkat mencoba lagi dengan detail auth yang berubah (misalnya role/scope/kunci publik), permintaan tertunda sebelumnya digantikan dan permintaan baru menggunakan `requestId` yang berbeda. Jalankan ulang `/pair pending` sebelum menyetujui.

    Detail selengkapnya: [Pemasangan](/id/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
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

    Penimpaan per akun:

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

    `capabilities: ["inlineButtons"]` lama dipetakan ke `inlineButtons: "all"`.

    Contoh tindakan pesan:

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

    Klik callback yang tidak diklaim oleh handler interaktif plugin terdaftar
    diteruskan ke agen sebagai teks:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Tindakan alat Telegram mencakup:

    - `sendMessage` (`to`, `content`, `mediaUrl` opsional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` atau `caption`, tombol inline `presentation` opsional; pengeditan khusus tombol memperbarui markup balasan)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opsional, `iconCustomEmojiId`)

    Tindakan pesan channel mengekspos alias yang ergonomis (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrol gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (default: dinonaktifkan)

    Catatan: `edit` dan `topic-create` saat ini diaktifkan secara default dan tidak memiliki toggle `channels.telegram.actions.*` terpisah.
    Pengiriman runtime menggunakan snapshot konfigurasi/rahasia aktif (startup/reload), sehingga jalur tindakan tidak melakukan resolusi ulang SecretRef ad-hoc per pengiriman.

    Semantik penghapusan reaksi: [/tools/reactions](/id/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram mendukung tag threading balasan eksplisit dalam output yang dihasilkan:

    - `[[reply_to_current]]` membalas pesan pemicu
    - `[[reply_to:<id>]]` membalas ID pesan Telegram tertentu

    `channels.telegram.replyToMode` mengontrol penanganan:

    - `off` (default)
    - `first`
    - `all`

    Saat threading balasan diaktifkan dan teks atau caption Telegram asli tersedia, OpenClaw menyertakan kutipan native Telegram secara otomatis. Telegram membatasi teks kutipan native hingga 1024 unit kode UTF-16, sehingga pesan yang lebih panjang dikutip dari awal dan kembali ke balasan biasa jika Telegram menolak kutipan tersebut.

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Supergroup forum:

    - kunci sesi topik menambahkan `:topic:<threadId>`
    - balasan dan pengetikan menargetkan thread topik
    - jalur konfigurasi topik:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Kasus khusus topik umum (`threadId=1`):

    - pengiriman pesan menghilangkan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)`)
    - tindakan pengetikan tetap menyertakan `message_thread_id`

    Pewarisan topik: entri topik mewarisi pengaturan grup kecuali ditimpa (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` hanya berlaku untuk topik dan tidak diwarisi dari default grup.
    `topics."*"` menetapkan default untuk setiap topik dalam grup tersebut; ID topik persis tetap mengungguli `"*"`.

    **Perutean agen per topik**: Setiap topik dapat diarahkan ke agen berbeda dengan menetapkan `agentId` dalam konfigurasi topik. Ini memberi setiap topik workspace, memory, dan sesi terisolasinya sendiri. Contoh:

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

    **Pengikatan topik ACP persisten**: Topik forum dapat menyematkan sesi harness ACP melalui pengikatan ACP bertipe tingkat atas (`bindings[]` dengan `type: "acp"` dan `match.channel: "telegram"`, `peer.kind: "group"`, serta id berkualifikasi topik seperti `-1001234567890:topic:42`). Saat ini dicakupkan ke topik forum dalam grup/supergroup. Lihat [Agen ACP](/id/tools/acp-agents).

    **Spawn ACP yang terikat thread dari obrolan**: `/acp spawn <agent> --thread here|auto` mengikat topik saat ini ke sesi ACP baru; tindak lanjut diarahkan langsung ke sana. OpenClaw menyematkan konfirmasi spawn di dalam topik. Mengharuskan `channels.telegram.threadBindings.spawnSessions` tetap diaktifkan (default: `true`).

    Konteks template mengekspos `MessageThreadId` dan `IsForum`. Obrolan DM dengan `message_thread_id` mempertahankan metadata balasan; obrolan tersebut hanya menggunakan kunci sesi yang sadar thread saat `getMe` Telegram melaporkan `has_topics_enabled: true` untuk bot.
    Penimpaan `dm.threadReplies` dan `direct.*.threadReplies` lama sengaja dihentikan; gunakan mode ber-thread BotFather sebagai satu-satunya sumber kebenaran dan jalankan `openclaw doctor --fix` untuk menghapus kunci konfigurasi usang.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Pesan audio

    Telegram membedakan voice note dan file audio.

    - default: perilaku file audio
    - tag `[[audio_as_voice]]` dalam balasan agen untuk memaksa pengiriman voice note
    - transkrip voice note masuk dibingkai sebagai teks yang dihasilkan mesin,
      tidak tepercaya dalam konteks agen; deteksi mention tetap menggunakan transkrip
      mentah sehingga pesan suara yang digate oleh mention terus berfungsi.

    Contoh tindakan pesan:

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

    Contoh aksi pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Catatan video tidak mendukung caption; teks pesan yang diberikan dikirim secara terpisah.

    ### Stiker

    Penanganan stiker masuk:

    - WEBP statis: diunduh dan diproses (placeholder `<media:sticker>`)
    - TGS animasi: dilewati
    - WEBM video: dilewati

    Field konteks stiker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Deskripsi stiker di-cache dalam state Plugin SQLite OpenClaw untuk mengurangi panggilan visi berulang.

    Aktifkan aksi stiker:

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

    Aksi kirim stiker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Cari stiker yang di-cache:

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

    Saat diaktifkan, OpenClaw mengantrekan event sistem seperti:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfigurasi:

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    Catatan:

    - `own` berarti hanya reaksi pengguna terhadap pesan yang dikirim bot (upaya terbaik melalui cache pesan terkirim).
    - Event reaksi tetap mematuhi kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim tanpa izin akan dibuang.
    - Telegram tidak menyediakan ID thread dalam pembaruan reaksi.
      - grup non-forum diarahkan ke sesi chat grup
      - grup forum diarahkan ke sesi topik umum grup (`:topic:1`), bukan topik asal yang persis

    `allowed_updates` untuk polling/webhook menyertakan `message_reaction` secara otomatis.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` mengirim emoji tanda terima saat OpenClaw memproses pesan masuk. `ackReactionScope` menentukan *kapan* emoji itu benar-benar dikirim.

    **Urutan resolusi emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada "👀")

    Catatan:

    - Telegram mengharapkan emoji unicode (misalnya "👀").
    - Gunakan `""` untuk menonaktifkan reaksi untuk channel atau akun.

    **Cakupan (`messages.ackReactionScope`):**

    Provider Telegram membaca cakupan dari `messages.ackReactionScope` (default `"group-mentions"`). Saat ini tidak ada override tingkat akun Telegram atau tingkat channel Telegram.

    Nilai: `"all"` (DM + grup), `"direct"` (hanya DM), `"group-all"` (setiap pesan grup, tanpa DM), `"group-mentions"` (grup saat bot disebut; **tanpa DM** — ini adalah default), `"off"` / `"none"` (dinonaktifkan).

    <Note>
    Cakupan default (`"group-mentions"`) tidak memicu reaksi ack dalam pesan langsung. Untuk mendapatkan reaksi ack pada DM Telegram masuk, atur `messages.ackReactionScope` ke `"direct"` atau `"all"`. Nilai dibaca saat startup provider Telegram, sehingga restart gateway diperlukan agar perubahan berlaku.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Penulisan konfigurasi channel diaktifkan secara default (`configWrites !== false`).

    Penulisan yang dipicu Telegram mencakup:

    - event migrasi grup (`migrate_to_chat_id`) untuk memperbarui `channels.telegram.groups`
    - `/config set` dan `/config unset` (memerlukan pengaktifan command)

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
    Default-nya adalah long polling. Untuk mode webhook, atur `channels.telegram.webhookUrl` dan `channels.telegram.webhookSecret`; opsional `webhookPath`, `webhookHost`, `webhookPort` (default `/telegram-webhook`, `127.0.0.1`, `8787`).

    Dalam mode long-polling, OpenClaw mempertahankan watermark restart-nya hanya setelah sebuah pembaruan berhasil didispatch. Jika handler gagal, pembaruan itu tetap dapat dicoba ulang dalam proses yang sama dan tidak ditulis sebagai selesai untuk dedupe restart.

    Listener lokal bind ke `127.0.0.1:8787`. Untuk ingress publik, tempatkan reverse proxy di depan port lokal atau atur `webhookHost: "0.0.0.0"` secara sengaja.

    Mode Webhook memvalidasi guard request, token rahasia Telegram, dan body JSON sebelum mengembalikan `200` ke Telegram.
    OpenClaw kemudian memproses pembaruan secara asinkron melalui lane bot per-chat/per-topik yang sama seperti yang digunakan long polling, sehingga giliran agen yang lambat tidak menahan ACK pengiriman Telegram.

  </Accordion>

  <Accordion title="Batas, percobaan ulang, dan target CLI">
    - Default `channels.telegram.textChunkLimit` adalah 4000.
    - `channels.telegram.chunkMode="newline"` mengutamakan batas paragraf (baris kosong) sebelum pemisahan berdasarkan panjang.
    - `channels.telegram.mediaMaxMb` (default 100) membatasi ukuran media Telegram masuk dan keluar.
    - `channels.telegram.mediaGroupFlushMs` (default 500) mengontrol berapa lama album/grup media Telegram ditampung sebelum OpenClaw mengirimkannya sebagai satu pesan masuk. Naikkan jika bagian album terlambat tiba; turunkan untuk mengurangi latensi balasan album.
    - `channels.telegram.timeoutSeconds` menimpa timeout klien API Telegram (jika tidak diatur, default grammY berlaku). Klien bot menjepit nilai yang dikonfigurasi di bawah penjaga permintaan teks/pengetikan keluar 60 detik agar grammY tidak membatalkan pengiriman balasan yang terlihat sebelum penjaga transport dan fallback OpenClaw dapat berjalan. Long polling tetap menggunakan penjaga permintaan `getUpdates` 45 detik agar polling menganggur tidak ditinggalkan tanpa batas.
    - `channels.telegram.pollingStallThresholdMs` default ke `120000`; sesuaikan antara `30000` dan `600000` hanya untuk restart polling-stall positif palsu.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (default 50); `0` menonaktifkan.
    - konteks tambahan balasan/kutipan/terusan dinormalisasi ke dalam satu jendela konteks percakapan terpilih saat gateway telah mengamati pesan induk; cache pesan yang diamati berada di status Plugin SQLite OpenClaw, dan `openclaw doctor --fix` mengimpor sidecar lama. Telegram hanya menyertakan satu `reply_to_message` dangkal dalam update, sehingga rantai yang lebih lama dari cache terbatas pada payload update Telegram saat ini.
    - allowlist Telegram terutama membatasi siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan penuh.
    - Kontrol riwayat DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfigurasi `channels.telegram.retry` berlaku untuk helper kirim Telegram (CLI/tools/actions) untuk error API keluar yang dapat dipulihkan. Pengiriman balasan akhir masuk juga menggunakan percobaan ulang safe-send terbatas untuk kegagalan pra-koneksi Telegram, tetapi tidak mencoba ulang amplop jaringan pasca-kirim yang ambigu yang dapat menggandakan pesan yang terlihat.

    Target kirim CLI dan message-tool dapat berupa ID chat numerik, nama pengguna, atau target topik forum:

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

    Kirim Telegram juga mendukung:

    - `--presentation` dengan blok `buttons` untuk keyboard inline saat `channels.telegram.capabilities.inlineButtons` mengizinkannya
    - `--pin` atau `--delivery '{"pin":true}'` untuk meminta pengiriman yang disematkan saat bot dapat menyematkan di chat tersebut
    - `--force-document` untuk mengirim gambar, GIF, dan video keluar sebagai dokumen, bukan unggahan foto terkompresi, media animasi, atau video

    Pembatasan tindakan:

    - `channels.telegram.actions.sendMessage=false` menonaktifkan pesan Telegram keluar, termasuk poll
    - `channels.telegram.actions.poll=false` menonaktifkan pembuatan poll Telegram sambil tetap mengaktifkan kiriman reguler

  </Accordion>

  <Accordion title="Persetujuan exec di Telegram">
    Telegram mendukung persetujuan exec di DM pemberi persetujuan dan secara opsional dapat memposting prompt di chat atau topik asal. Pemberi persetujuan harus berupa ID pengguna Telegram numerik.

    Jalur konfigurasi:

    - `channels.telegram.execApprovals.enabled` (aktif otomatis saat setidaknya satu pemberi persetujuan dapat diresolusikan)
    - `channels.telegram.execApprovals.approvers` (fallback ke ID pemilik numerik dari `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (default) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, dan `defaultTo` mengontrol siapa yang dapat berbicara dengan bot dan ke mana bot mengirim balasan normal. Mereka tidak membuat seseorang menjadi pemberi persetujuan exec. Pemasangan DM pertama yang disetujui mem-bootstrap `commands.ownerAllowFrom` saat belum ada pemilik perintah, sehingga penyiapan satu pemilik tetap berfungsi tanpa menggandakan ID di bawah `execApprovals.approvers`.

    Pengiriman channel menampilkan teks perintah di chat; aktifkan `channel` atau `both` hanya di grup/topik tepercaya. Saat prompt masuk ke topik forum, OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjutnya. Persetujuan exec kedaluwarsa setelah 30 menit secara default.

    Tombol persetujuan inline juga memerlukan `channels.telegram.capabilities.inlineButtons` untuk mengizinkan permukaan target (`dm`, `group`, atau `all`). ID persetujuan yang diawali `plugin:` diresolusikan melalui persetujuan Plugin; lainnya diresolusikan melalui persetujuan exec terlebih dahulu.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrol balasan error

Saat agen mengalami error pengiriman atau provider, kebijakan error mengontrol apakah pesan error dikirim ke chat Telegram:

| Kunci                               | Nilai                      | Default         | Deskripsi                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — kirim setiap pesan error ke chat. `once` — kirim setiap pesan error unik sekali per jendela cooldown (menekan error identik berulang). `silent` — jangan pernah kirim pesan error ke chat.     |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | Jendela cooldown untuk kebijakan `once`. Setelah error dikirim, pesan error yang sama ditekan hingga interval ini berlalu. Mencegah spam error selama gangguan.                                             |

Override per akun, per grup, dan per topik didukung (pewarisan yang sama seperti kunci konfigurasi Telegram lainnya).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
  <Accordion title="Bot tidak merespons pesan grup yang bukan mention">

    - Jika `requireMention=false`, mode privasi Telegram harus mengizinkan visibilitas penuh.
      - BotFather: `/setprivacy` -> Disable
      - lalu hapus + tambahkan ulang bot ke grup
    - `openclaw channels status` memperingatkan saat konfigurasi mengharapkan pesan grup tanpa mention.
    - `openclaw channels status --probe` dapat memeriksa ID grup numerik eksplisit; wildcard `"*"` tidak dapat diperiksa keanggotaannya.
    - tes sesi cepat: `/activation always`.

  </Accordion>

  <Accordion title="Bot sama sekali tidak melihat pesan grup">

    - saat `channels.telegram.groups` ada, grup harus tercantum (atau menyertakan `"*"`)
    - verifikasi keanggotaan bot di grup
    - tinjau log: `openclaw logs --follow` untuk alasan skip

  </Accordion>

  <Accordion title="Perintah berfungsi sebagian atau tidak sama sekali">

    - otorisasi identitas pengirim Anda (pemasangan dan/atau `allowFrom` numerik)
    - otorisasi perintah tetap berlaku meskipun kebijakan grup adalah `open`
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu native memiliki terlalu banyak entri; kurangi perintah Plugin/skill/kustom atau nonaktifkan menu native
    - Panggilan startup `deleteMyCommands` / `setMyCommands` dan panggilan pengetikan `sendChatAction` dibatasi dan dicoba ulang sekali melalui fallback transport Telegram pada timeout permintaan. Error jaringan/fetch yang menetap biasanya menunjukkan masalah keterjangkauan DNS/HTTPS ke `api.telegram.org`

  </Accordion>

  <Accordion title="Startup melaporkan token tidak sah">

    - `getMe returned 401` adalah kegagalan autentikasi Telegram untuk token bot yang dikonfigurasi.
    - Salin ulang atau buat ulang token bot di BotFather, lalu perbarui `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, atau `TELEGRAM_BOT_TOKEN` untuk akun default.
    - `deleteWebhook 401 Unauthorized` selama startup juga merupakan kegagalan auth; memperlakukannya sebagai "tidak ada webhook" hanya akan menunda kegagalan token buruk yang sama ke panggilan API berikutnya.

  </Accordion>

  <Accordion title="Polling atau ketidakstabilan jaringan">

    - Node 22+ + fetch/proxy kustom dapat memicu perilaku abort langsung jika tipe AbortSignal tidak cocok.
    - Beberapa host meresolusikan `api.telegram.org` ke IPv6 terlebih dahulu; egress IPv6 yang rusak dapat menyebabkan kegagalan API Telegram intermiten.
    - Jika log menyertakan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!`, OpenClaw kini mencoba ulang ini sebagai error jaringan yang dapat dipulihkan.
    - Selama startup polling, OpenClaw menggunakan ulang probe startup `getMe` yang berhasil untuk grammY sehingga runner tidak memerlukan `getMe` kedua sebelum `getUpdates` pertama.
    - Jika `deleteWebhook` gagal dengan error jaringan sementara selama startup polling, OpenClaw melanjutkan ke long polling alih-alih membuat panggilan control-plane pra-poll lainnya. Webhook yang masih aktif muncul sebagai konflik `getUpdates`; OpenClaw kemudian membangun ulang transport Telegram dan mencoba ulang pembersihan webhook.
    - Jika soket Telegram didaur ulang pada irama tetap yang pendek, periksa `channels.telegram.timeoutSeconds` yang rendah; klien bot menjepit nilai yang dikonfigurasi di bawah penjaga permintaan keluar dan `getUpdates`, tetapi rilis lama dapat membatalkan setiap poll atau balasan saat ini diatur di bawah penjaga tersebut.
    - Jika log menyertakan `Polling stall detected`, OpenClaw memulai ulang polling dan membangun ulang transport Telegram setelah 120 detik tanpa liveness long-poll yang selesai secara default.
    - `openclaw channels status --probe` dan `openclaw doctor` memperingatkan saat akun polling yang berjalan belum menyelesaikan `getUpdates` setelah grace startup, saat akun webhook yang berjalan belum menyelesaikan `setWebhook` setelah grace startup, atau saat aktivitas transport polling terakhir yang berhasil sudah basi.
    - Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya saat panggilan `getUpdates` yang berjalan lama sehat tetapi host Anda masih melaporkan restart polling-stall positif palsu. Stall yang menetap biasanya mengarah ke masalah proxy, DNS, IPv6, atau egress TLS antara host dan `api.telegram.org`.
    - Telegram juga menghormati env proxy proses untuk transport Bot API, termasuk `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan varian huruf kecilnya. `NO_PROXY` / `no_proxy` tetap dapat melewati `api.telegram.org`.
    - Jika proxy terkelola OpenClaw dikonfigurasi melalui `OPENCLAW_PROXY_URL` untuk lingkungan layanan dan tidak ada env proxy standar, Telegram juga menggunakan URL tersebut untuk transport Bot API.
    - Pada host VPS dengan egress/TLS langsung yang tidak stabil, rutekan panggilan API Telegram melalui `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ secara default menggunakan `autoSelectFamily=true` (kecuali WSL2). Urutan hasil DNS Telegram mengikuti `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, lalu `channels.telegram.network.dnsResultOrder`, lalu default proses seperti `NODE_OPTIONS=--dns-result-order=ipv4first`; jika tidak ada yang berlaku, Node 22+ kembali ke `ipv4first`.
    - Jika host Anda adalah WSL2 atau secara eksplisit bekerja lebih baik dengan perilaku khusus IPv4, paksa pemilihan famili alamat:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang benchmark RFC 2544 (`198.18.0.0/15`) sudah diizinkan
      untuk unduhan media Telegram secara default. Jika fake-IP tepercaya atau
      proksi transparan menulis ulang `api.telegram.org` ke alamat
      privat/internal/penggunaan-khusus lain selama unduhan media, Anda dapat memilih
      bypass khusus Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Pilihan ikut serta yang sama tersedia per akun di
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jika proksi Anda me-resolve host media Telegram ke `198.18.x.x`, biarkan
      flag berbahaya mati terlebih dahulu. Media Telegram sudah mengizinkan
      rentang benchmark RFC 2544 secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` melemahkan
      perlindungan SSRF media Telegram. Gunakan hanya untuk lingkungan proksi
      tepercaya yang dikendalikan operator seperti routing fake-IP Clash, Mihomo,
      atau Surge ketika lingkungan tersebut menyintesis jawaban privat atau
      penggunaan-khusus di luar rentang benchmark RFC 2544. Biarkan mati untuk
      akses Telegram internet publik normal.
    </Warning>

    - Penggantian lingkungan (sementara):
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

Bantuan lainnya: [Pemecahan masalah channel](/id/channels/troubleshooting).

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Telegram](/id/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` harus menunjuk ke file reguler; symlink ditolak)
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` tingkat atas (`type: "acp"`)
- default topik: `groups.<chatId>.topics."*"` berlaku untuk topik forum yang tidak cocok; ID topik persis akan menimpanya
- persetujuan exec: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/balasan: `replyToMode`
- streaming: `streaming` (pratinjau), `streaming.preview.toolProgress`, `blockStreaming`
- pemformatan/pengiriman: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API kustom: `apiRoot` (hanya root Bot API; jangan sertakan `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- tindakan/kapabilitas: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaksi: `reactionNotifications`, `reactionLevel`
- kesalahan: `errorPolicy`, `errorCooldownMs`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Prioritas multi-akun: ketika dua atau lebih ID akun dikonfigurasi, atur `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) agar routing default eksplisit. Jika tidak, OpenClaw kembali ke ID akun ternormalisasi pertama dan `openclaw doctor` memberi peringatan. Akun bernama mewarisi nilai `channels.telegram.allowFrom` / `groupAllowFrom`, tetapi tidak mewarisi nilai `accounts.default.*`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Telegram ke gateway.
  </Card>
  <Card title="Groups" icon="users" href="/id/channels/groups">
    Perilaku allowlist grup dan topik.
  </Card>
  <Card title="Channel routing" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Security" icon="shield" href="/id/gateway/security">
    Model ancaman dan pengerasan.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan grup dan topik ke agen.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas-channel.
  </Card>
</CardGroup>
