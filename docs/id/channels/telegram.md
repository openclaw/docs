---
read_when:
    - Mengerjakan fitur Telegram atau Webhook
summary: Status dukungan bot Telegram, kapabilitas, dan konfigurasi
title: Telegram
x-i18n:
    generated_at: "2026-04-30T09:36:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ffc0c1a6bb94fbab81ede0f08b0e3a165f06c599d4d06d4b9e70c8ba41121f7
    source_path: channels/telegram.md
    workflow: 16
---

Siap produksi untuk DM bot dan grup melalui grammY. Long polling adalah mode default; mode webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah pemasangan.
  </Card>
  <Card title="Pemecahan masalah kanal" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal dan panduan perbaikan.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi kanal lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Buat token bot di BotFather">
    Buka Telegram dan chat dengan **@BotFather** (pastikan handle persis `@BotFather`).

    Jalankan `/newbot`, ikuti prompt, dan simpan token.

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

    Kode pemasangan kedaluwarsa setelah 1 jam.

  </Step>

  <Step title="Tambahkan bot ke grup">
    Tambahkan bot ke grup Anda, lalu atur `channels.telegram.groups` dan `groupPolicy` agar sesuai dengan model akses Anda.
  </Step>
</Steps>

<Note>
Urutan resolusi token sadar akun. Dalam praktiknya, nilai config mengalahkan fallback env, dan `TELEGRAM_BOT_TOKEN` hanya berlaku untuk akun default.
</Note>

## Pengaturan sisi Telegram

<AccordionGroup>
  <Accordion title="Mode privasi dan visibilitas grup">
    Bot Telegram default ke **Mode Privasi**, yang membatasi pesan grup yang mereka terima.

    Jika bot harus melihat semua pesan grup, lakukan salah satu dari berikut:

    - nonaktifkan mode privasi melalui `/setprivacy`, atau
    - jadikan bot admin grup.

    Saat mengubah mode privasi, hapus + tambahkan ulang bot di setiap grup agar Telegram menerapkan perubahan.

  </Accordion>

  <Accordion title="Izin grup">
    Status admin dikontrol di pengaturan grup Telegram.

    Bot admin menerima semua pesan grup, yang berguna untuk perilaku grup yang selalu aktif.

  </Accordion>

  <Accordion title="Toggle BotFather yang berguna">

    - `/setjoingroups` untuk mengizinkan/menolak penambahan grup
    - `/setprivacy` untuk perilaku visibilitas grup

  </Accordion>
</AccordionGroup>

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.telegram.dmPolicy` mengontrol akses pesan langsung:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu ID pengirim di `allowFrom`)
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `dmPolicy: "open"` dengan `allowFrom: ["*"]` memungkinkan akun Telegram apa pun yang menemukan atau menebak nama pengguna bot untuk memberi perintah ke bot. Gunakan hanya untuk bot yang memang bersifat publik dengan alat yang sangat dibatasi; bot satu pemilik sebaiknya menggunakan `allowlist` dengan ID pengguna numerik.

    `channels.telegram.allowFrom` menerima ID pengguna Telegram numerik. Prefiks `telegram:` / `tg:` diterima dan dinormalisasi.
    Dalam config multi-akun, `channels.telegram.allowFrom` tingkat atas yang restriktif diperlakukan sebagai batas keamanan: entri `allowFrom: ["*"]` tingkat akun tidak menjadikan akun tersebut publik kecuali allowlist akun efektif masih berisi wildcard eksplisit setelah penggabungan.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi config.
    Penyiapan hanya meminta ID pengguna numerik.
    Jika Anda melakukan upgrade dan config Anda berisi entri allowlist `@username`, jalankan `openclaw doctor --fix` untuk menyelesaikannya (upaya terbaik; memerlukan token bot Telegram).
    Jika sebelumnya Anda mengandalkan file allowlist penyimpanan pemasangan, `openclaw doctor --fix` dapat memulihkan entri ke `channels.telegram.allowFrom` dalam alur allowlist (misalnya saat `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot satu pemilik, pilih `dmPolicy: "allowlist"` dengan ID `allowFrom` numerik eksplisit agar kebijakan akses bertahan di config (bukan bergantung pada persetujuan pemasangan sebelumnya).

    Kebingungan umum: persetujuan pemasangan DM tidak berarti "pengirim ini diotorisasi di semua tempat".
    Pemasangan memberikan akses DM. Jika belum ada pemilik perintah, pemasangan pertama yang disetujui juga mengatur `commands.ownerAllowFrom` sehingga perintah khusus pemilik dan persetujuan exec memiliki akun operator eksplisit.
    Otorisasi pengirim grup tetap berasal dari allowlist config eksplisit.
    Jika Anda ingin "saya diotorisasi sekali dan DM serta perintah grup berfungsi", masukkan ID pengguna Telegram numerik Anda di `channels.telegram.allowFrom`; untuk perintah khusus pemilik, pastikan `commands.ownerAllowFrom` berisi `telegram:<your user id>`.

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
         - dengan `groupPolicy: "open"`: grup mana pun dapat lolos pemeriksaan ID grup
         - dengan `groupPolicy: "allowlist"` (default): grup diblokir sampai Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: bertindak sebagai allowlist (ID eksplisit atau `"*"`)

    2. **Pengirim mana yang diizinkan di grup** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` digunakan untuk pemfilteran pengirim grup. Jika tidak diatur, Telegram fallback ke `allowFrom`.
    Entri `groupAllowFrom` harus berupa ID pengguna Telegram numerik (prefiks `telegram:` / `tg:` dinormalisasi).
    Jangan masukkan ID chat grup atau supergrup Telegram di `groupAllowFrom`. ID chat negatif berada di bawah `channels.telegram.groups`.
    Entri non-numerik diabaikan untuk otorisasi pengirim.
    Batas keamanan (`2026.2.25+`): auth pengirim grup **tidak** mewarisi persetujuan penyimpanan pemasangan DM.
    Pemasangan tetap khusus DM. Untuk grup, atur `groupAllowFrom` atau `allowFrom` per grup/per topik.
    Jika `groupAllowFrom` tidak diatur, Telegram fallback ke config `allowFrom`, bukan penyimpanan pemasangan.
    Pola praktis untuk bot satu pemilik: atur ID pengguna Anda di `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak diatur, dan izinkan grup target di bawah `channels.telegram.groups`.
    Catatan runtime: jika `channels.telegram` sepenuhnya hilang, runtime default ke fail-closed `groupPolicy="allowlist"` kecuali `channels.defaults.groupPolicy` diatur secara eksplisit.

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
      - Letakkan ID pengguna Telegram seperti `8734062810` di bawah `groupAllowFrom` saat Anda ingin membatasi orang mana di dalam grup yang diizinkan dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya saat Anda ingin anggota mana pun dari grup yang diizinkan dapat berbicara dengan bot.

    </Warning>

  </Tab>

  <Tab title="Perilaku penyebutan">
    Balasan grup secara default memerlukan penyebutan.

    Penyebutan dapat berasal dari:

    - penyebutan native `@botusername`, atau
    - pola penyebutan di:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Toggle perintah tingkat sesi:

    - `/activation always`
    - `/activation mention`

    Ini hanya memperbarui status sesi. Gunakan config untuk persistensi.

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

    Mendapatkan ID chat grup:

    - teruskan pesan grup ke `@userinfobot` / `@getidsbot`
    - atau baca `chat.id` dari `openclaw logs --follow`
    - atau periksa Bot API `getUpdates`

  </Tab>
</Tabs>

## Perilaku runtime

- Telegram dimiliki oleh proses gateway.
- Routing bersifat deterministik: pesan masuk Telegram dibalas kembali ke Telegram (model tidak memilih kanal).
- Pesan masuk dinormalisasi ke envelope kanal bersama dengan metadata balasan dan placeholder media.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>` agar topik tetap terisolasi.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw merutekannya dengan kunci sesi sadar thread dan mempertahankan ID thread untuk balasan.
- Long polling menggunakan runner grammY dengan pengurutan per chat/per thread. Konkurensi sink runner keseluruhan menggunakan `agents.defaults.maxConcurrent`.
- Long polling dijaga di dalam setiap proses gateway sehingga hanya satu poller aktif yang dapat menggunakan token bot pada satu waktu. Jika Anda masih melihat konflik `getUpdates` 409, kemungkinan gateway OpenClaw lain, skrip, atau poller eksternal menggunakan token yang sama.
- Restart watchdog long-polling dipicu setelah 120 detik tanpa liveness `getUpdates` yang selesai secara default. Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya jika deployment Anda masih melihat restart polling-stall palsu selama pekerjaan berjalan lama. Nilainya dalam milidetik dan diizinkan dari `30000` hingga `600000`; override per akun didukung.
- Telegram Bot API tidak memiliki dukungan tanda baca (`sendReadReceipts` tidak berlaku).

## Referensi fitur

<AccordionGroup>
  <Accordion title="Pratinjau live stream (edit pesan)">
    OpenClaw dapat melakukan stream balasan parsial secara real time:

    - chat langsung: pesan pratinjau + `editMessageText`
    - grup/topik: pesan pratinjau + `editMessageText`

    Persyaratan:

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - `progress` dipetakan ke `partial` di Telegram (kompat dengan penamaan lintas kanal)
    - `streaming.preview.toolProgress` mengontrol apakah pembaruan alat/progres menggunakan kembali pesan pratinjau yang sama yang diedit (default: `true` saat streaming pratinjau aktif)
    - `channels.telegram.streamMode` legacy dan nilai boolean `streaming` terdeteksi; jalankan `openclaw doctor --fix` untuk memigrasikannya ke `channels.telegram.streaming.mode`

    Pembaruan pratinjau progres alat adalah baris pendek "Working..." yang ditampilkan saat alat berjalan, misalnya eksekusi perintah, pembacaan file, pembaruan perencanaan, atau ringkasan patch. Telegram mengaktifkan ini secara default agar sesuai dengan perilaku OpenClaw yang dirilis dari `v2026.4.22` dan setelahnya. Untuk mempertahankan pratinjau yang diedit untuk teks jawaban tetapi menyembunyikan baris progres alat, atur:

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

    Gunakan `streaming.mode: "off"` hanya saat Anda menginginkan pengiriman final saja: edit pratinjau Telegram dinonaktifkan dan obrolan alat/progres generik ditekan alih-alih dikirim sebagai pesan "Working..." mandiri. Prompt persetujuan, payload media, dan error tetap dirutekan melalui pengiriman final normal. Gunakan `streaming.preview.toolProgress: false` saat Anda hanya ingin mempertahankan edit pratinjau jawaban sambil menyembunyikan baris status progres alat.

    Untuk balasan hanya teks:

    - pratinjau DM/grup/topik singkat: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan edit final di tempat
    - pratinjau yang lebih lama dari sekitar satu menit: OpenClaw mengirim balasan lengkap sebagai pesan final baru lalu membersihkan pratinjau, sehingga stempel waktu yang terlihat di Telegram mencerminkan waktu penyelesaian, bukan waktu pembuatan pratinjau

    Untuk balasan kompleks (misalnya payload media), OpenClaw kembali ke pengiriman final normal lalu membersihkan pesan pratinjau.

    Streaming pratinjau terpisah dari streaming blok. Saat streaming blok diaktifkan secara eksplisit untuk Telegram, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

    Jika transport draf native tidak tersedia/ditolak, OpenClaw otomatis kembali ke `sendMessage` + `editMessageText`.

    Stream penalaran khusus Telegram:

    - `/reasoning stream` mengirim penalaran ke pratinjau langsung saat menghasilkan
    - jawaban final dikirim tanpa teks penalaran

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    Teks keluar menggunakan Telegram `parse_mode: "HTML"`.

    - Teks mirip Markdown dirender menjadi HTML yang aman untuk Telegram.
    - HTML model mentah di-escape untuk mengurangi kegagalan parsing Telegram.
    - Jika Telegram menolak HTML yang diparsing, OpenClaw mencoba lagi sebagai teks biasa.

    Pratinjau tautan diaktifkan secara default dan dapat dinonaktifkan dengan `channels.telegram.linkPreview: false`.

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

    - nama dinormalisasi (hapus `/` di awal, huruf kecil)
    - pola valid: `a-z`, `0-9`, `_`, panjang `1..32`
    - perintah kustom tidak dapat menimpa perintah native
    - konflik/duplikat dilewati dan dicatat di log

    Catatan:

    - perintah kustom hanya entri menu; perintah tersebut tidak otomatis mengimplementasikan perilaku
    - perintah plugin/skill tetap dapat berfungsi saat diketik meskipun tidak ditampilkan di menu Telegram

    Jika perintah native dinonaktifkan, bawaan akan dihapus. Perintah kustom/plugin mungkin tetap didaftarkan jika dikonfigurasi.

    Kegagalan penyiapan umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu Telegram masih melebihi batas setelah pemangkasan; kurangi perintah plugin/skill/kustom atau nonaktifkan `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands`, atau `setMyCommands` gagal dengan `404: Not Found` sementara perintah curl Bot API langsung berfungsi dapat berarti `channels.telegram.apiRoot` disetel ke endpoint lengkap `/bot<TOKEN>`. `apiRoot` harus hanya root Bot API, dan `openclaw doctor --fix` menghapus akhiran `/bot<TOKEN>` yang tidak sengaja.
    - `getMe returned 401` berarti Telegram menolak token bot yang dikonfigurasi. Perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` dengan token BotFather saat ini; OpenClaw berhenti sebelum polling sehingga ini tidak dilaporkan sebagai kegagalan pembersihan webhook.
    - `setMyCommands failed` dengan error jaringan/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah pemasangan perangkat (Plugin `device-pair`)

    Saat Plugin `device-pair` diinstal:

    1. `/pair` menghasilkan kode penyiapan
    2. tempel kode di aplikasi iOS
    3. `/pair pending` mencantumkan permintaan yang tertunda (termasuk peran/cakupan)
    4. setujui permintaan:
       - `/pair approve <requestId>` untuk persetujuan eksplisit
       - `/pair approve` saat hanya ada satu permintaan tertunda
       - `/pair approve latest` untuk yang paling baru

    Kode penyiapan membawa token bootstrap berumur pendek. Serah terima bootstrap bawaan mempertahankan token node utama di `scopes: []`; token operator yang diserahterimakan tetap dibatasi pada `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`. Pemeriksaan cakupan bootstrap diberi prefiks peran, sehingga allowlist operator tersebut hanya memenuhi permintaan operator; peran non-operator tetap membutuhkan cakupan di bawah prefiks perannya sendiri.

    Jika perangkat mencoba lagi dengan detail auth yang berubah (misalnya peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan permintaan baru menggunakan `requestId` yang berbeda. Jalankan ulang `/pair pending` sebelum menyetujui.

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

    `capabilities: ["inlineButtons"]` legacy dipetakan ke `inlineButtons: "all"`.

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

    Klik callback diteruskan ke agen sebagai teks:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Tindakan tool Telegram mencakup:

    - `sendMessage` (`to`, `content`, `mediaUrl` opsional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opsional, `iconCustomEmojiId`)

    Tindakan pesan channel mengekspos alias ergonomis (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrol gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (default: dinonaktifkan)

    Catatan: `edit` dan `topic-create` saat ini diaktifkan secara default dan tidak memiliki toggle `channels.telegram.actions.*` terpisah.
    Pengiriman runtime menggunakan snapshot konfigurasi/secrets aktif (startup/reload), sehingga jalur tindakan tidak melakukan resolusi ulang SecretRef ad-hoc per pengiriman.

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

    Saat threading balasan diaktifkan dan teks atau keterangan Telegram asli tersedia, OpenClaw otomatis menyertakan kutipan native Telegram. Telegram membatasi teks kutipan native pada 1024 unit kode UTF-16, sehingga pesan yang lebih panjang dikutip dari awal dan kembali ke balasan biasa jika Telegram menolak kutipan.

    Catatan: `off` menonaktifkan threading balasan implisit. Tag eksplisit `[[reply_to_*]]` tetap dipatuhi.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Supergrup forum:

    - kunci sesi topik menambahkan `:topic:<threadId>`
    - balasan dan pengetikan menargetkan thread topik
    - jalur konfigurasi topik:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Kasus khusus topik umum (`threadId=1`):

    - pengiriman pesan menghilangkan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)`)
    - tindakan pengetikan tetap menyertakan `message_thread_id`

    Pewarisan topik: entri topik mewarisi pengaturan grup kecuali dioverride (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` hanya untuk topik dan tidak mewarisi dari default grup.

    **Perutean agen per topik**: Setiap topik dapat dirutekan ke agen berbeda dengan menyetel `agentId` di konfigurasi topik. Ini memberi setiap topik workspace, memori, dan sesi terisolasi sendiri. Contoh:

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

    Setiap topik kemudian memiliki kunci sesi sendiri: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Pengikatan topik ACP persisten**: Topik forum dapat mem-pin sesi harness ACP melalui pengikatan ACP bertipe tingkat atas (`bindings[]` dengan `type: "acp"` dan `match.channel: "telegram"`, `peer.kind: "group"`, serta id berkualifikasi topik seperti `-1001234567890:topic:42`). Saat ini dicakup untuk topik forum di grup/supergrup. Lihat [Agen ACP](/id/tools/acp-agents).

    **Spawn ACP terikat thread dari chat**: `/acp spawn <agent> --thread here|auto` mengikat topik saat ini ke sesi ACP baru; tindak lanjut dirutekan langsung ke sana. OpenClaw mem-pin konfirmasi spawn di dalam topik. Memerlukan `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Konteks template mengekspos `MessageThreadId` dan `IsForum`. Chat DM dengan `message_thread_id` mempertahankan perutean DM tetapi menggunakan kunci sesi yang sadar thread.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Pesan audio

    Telegram membedakan catatan suara vs file audio.

    - default: perilaku file audio
    - tag `[[audio_as_voice]]` dalam balasan agen untuk memaksa pengiriman catatan suara
    - transkrip catatan suara masuk dibingkai sebagai teks yang dihasilkan mesin dan tidak tepercaya dalam konteks agen; deteksi mention tetap menggunakan transkrip mentah sehingga pesan suara yang dibatasi mention tetap berfungsi.

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

    Telegram membedakan file video vs catatan video.

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

    Catatan video tidak mendukung keterangan; teks pesan yang diberikan dikirim terpisah.

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

    File cache stiker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stiker dideskripsikan sekali (jika memungkinkan) dan disimpan dalam cache untuk mengurangi panggilan vision berulang.

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
    Reaksi Telegram datang sebagai pembaruan `message_reaction` (terpisah dari payload pesan).

    Saat diaktifkan, OpenClaw mengantrekan peristiwa sistem seperti:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfigurasi:

    - `channels.telegram.reactionNotifications`: `off | own | all` (bawaan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (bawaan: `minimal`)

    Catatan:

    - `own` berarti reaksi pengguna hanya pada pesan yang dikirim bot (upaya terbaik melalui cache pesan terkirim).
    - Peristiwa reaksi tetap mematuhi kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim yang tidak berwenang akan dibuang.
    - Telegram tidak menyediakan ID utas dalam pembaruan reaksi.
      - grup non-forum diarahkan ke sesi chat grup
      - grup forum diarahkan ke sesi topik umum grup (`:topic:1`), bukan topik asal yang persis

    `allowed_updates` untuk polling/webhook menyertakan `message_reaction` secara otomatis.

  </Accordion>

  <Accordion title="Reaksi ack">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk.

    Urutan resolusi:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada "👀")

    Catatan:

    - Telegram mengharapkan emoji unicode (misalnya "👀").
    - Gunakan `""` untuk menonaktifkan reaksi bagi kanal atau akun.

  </Accordion>

  <Accordion title="Penulisan konfigurasi dari peristiwa dan perintah Telegram">
    Penulisan konfigurasi kanal diaktifkan secara bawaan (`configWrites !== false`).

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
    Bawaan adalah long polling. Untuk mode webhook, atur `channels.telegram.webhookUrl` dan `channels.telegram.webhookSecret`; opsional `webhookPath`, `webhookHost`, `webhookPort` (bawaan `/telegram-webhook`, `127.0.0.1`, `8787`).

    Listener lokal mengikat ke `127.0.0.1:8787`. Untuk ingress publik, letakkan reverse proxy di depan port lokal atau atur `webhookHost: "0.0.0.0"` secara sengaja.

    Mode webhook memvalidasi guard permintaan, token rahasia Telegram, dan isi JSON sebelum mengembalikan `200` ke Telegram.
    OpenClaw kemudian memproses pembaruan secara asinkron melalui lane bot per-chat/per-topik yang sama dengan yang digunakan long polling, sehingga giliran agen yang lambat tidak menahan ACK pengiriman Telegram.

  </Accordion>

  <Accordion title="Batas, percobaan ulang, dan target CLI">
    - Bawaan `channels.telegram.textChunkLimit` adalah 4000.
    - `channels.telegram.chunkMode="newline"` lebih memilih batas paragraf (baris kosong) sebelum pemisahan berdasarkan panjang.
    - `channels.telegram.mediaMaxMb` (bawaan 100) membatasi ukuran media Telegram masuk dan keluar.
    - `channels.telegram.timeoutSeconds` menimpa timeout klien API Telegram (jika tidak diatur, bawaan grammY berlaku).
    - `channels.telegram.pollingStallThresholdMs` bawaan ke `120000`; sesuaikan antara `30000` dan `600000` hanya untuk restart polling-stall positif palsu.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (bawaan 50); `0` menonaktifkan.
    - konteks tambahan balasan/kutipan/terusan saat ini diteruskan sebagaimana diterima.
    - allowlist Telegram terutama membatasi siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan penuh.
    - Kontrol riwayat DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfigurasi `channels.telegram.retry` berlaku untuk helper pengiriman Telegram (CLI/tools/actions) untuk galat API keluar yang dapat dipulihkan. Pengiriman balasan akhir masuk juga menggunakan percobaan ulang safe-send terbatas untuk kegagalan pra-koneksi Telegram, tetapi tidak mencoba ulang amplop jaringan pasca-kirim yang ambigu yang dapat menggandakan pesan yang terlihat.

    Target pengiriman CLI dapat berupa ID chat numerik atau username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
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
    - `--pin` atau `--delivery '{"pin":true}'` untuk meminta pengiriman yang disematkan saat bot dapat menyematkan di chat tersebut
    - `--force-document` untuk mengirim gambar dan GIF keluar sebagai dokumen, bukan unggahan foto terkompresi atau media animasi

    Gating tindakan:

    - `channels.telegram.actions.sendMessage=false` menonaktifkan pesan Telegram keluar, termasuk poll
    - `channels.telegram.actions.poll=false` menonaktifkan pembuatan poll Telegram sambil tetap mengaktifkan pengiriman reguler

  </Accordion>

  <Accordion title="Persetujuan exec di Telegram">
    Telegram mendukung persetujuan exec di DM pemberi persetujuan dan secara opsional dapat memposting prompt di chat atau topik asal. Pemberi persetujuan harus berupa ID pengguna Telegram numerik.

    Path konfigurasi:

    - `channels.telegram.execApprovals.enabled` (aktif otomatis saat setidaknya satu pemberi persetujuan dapat di-resolve)
    - `channels.telegram.execApprovals.approvers` (fallback ke ID pemilik numerik dari `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (bawaan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, dan `defaultTo` mengontrol siapa yang dapat berbicara dengan bot dan ke mana bot mengirim balasan normal. Kunci tersebut tidak menjadikan seseorang sebagai pemberi persetujuan exec. Pemasangan DM pertama yang disetujui melakukan bootstrap `commands.ownerAllowFrom` saat belum ada pemilik perintah, sehingga setup satu pemilik tetap berfungsi tanpa menduplikasi ID di bawah `execApprovals.approvers`.

    Pengiriman kanal menampilkan teks perintah di chat; hanya aktifkan `channel` atau `both` di grup/topik tepercaya. Saat prompt masuk ke topik forum, OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjut. Persetujuan exec kedaluwarsa setelah 30 menit secara bawaan.

    Tombol persetujuan inline juga memerlukan `channels.telegram.capabilities.inlineButtons` untuk mengizinkan permukaan target (`dm`, `group`, atau `all`). ID persetujuan yang diawali `plugin:` di-resolve melalui persetujuan plugin; yang lain di-resolve melalui persetujuan exec terlebih dahulu.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrol balasan galat

Saat agen mengalami galat pengiriman atau penyedia, Telegram dapat membalas dengan teks galat atau menyembunyikannya. Dua kunci konfigurasi mengontrol perilaku ini:

| Kunci                               | Nilai             | Bawaan  | Deskripsi                                                                                       |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` mengirim pesan galat yang ramah ke chat. `silent` menyembunyikan balasan galat sepenuhnya. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Waktu minimum antar balasan galat ke chat yang sama. Mencegah spam galat selama gangguan.        |

Override per-akun, per-grup, dan per-topik didukung (pewarisan yang sama seperti kunci konfigurasi Telegram lainnya).

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
  <Accordion title="Bot tidak merespons pesan grup tanpa mention">

    - Jika `requireMention=false`, mode privasi Telegram harus mengizinkan visibilitas penuh.
      - BotFather: `/setprivacy` -> Disable
      - lalu hapus + tambahkan ulang bot ke grup
    - `openclaw channels status` memperingatkan saat konfigurasi mengharapkan pesan grup tanpa mention.
    - `openclaw channels status --probe` dapat memeriksa ID grup numerik eksplisit; wildcard `"*"` tidak dapat diperiksa keanggotaannya.
    - uji sesi cepat: `/activation always`.

  </Accordion>

  <Accordion title="Bot sama sekali tidak melihat pesan grup">

    - saat `channels.telegram.groups` ada, grup harus dicantumkan (atau menyertakan `"*"`)
    - verifikasi keanggotaan bot di grup
    - tinjau log: `openclaw logs --follow` untuk alasan skip

  </Accordion>

  <Accordion title="Perintah berfungsi sebagian atau tidak sama sekali">

    - beri otorisasi identitas pengirim Anda (pemasangan dan/atau `allowFrom` numerik)
    - otorisasi perintah tetap berlaku bahkan ketika kebijakan grup adalah `open`
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu native memiliki terlalu banyak entri; kurangi perintah plugin/skill/kustom atau nonaktifkan menu native
    - Panggilan startup `deleteMyCommands` / `setMyCommands` dibatasi dan dicoba ulang sekali melalui fallback transport Telegram pada timeout permintaan. Galat jaringan/fetch persisten biasanya menunjukkan masalah keterjangkauan DNS/HTTPS ke `api.telegram.org`

  </Accordion>

  <Accordion title="Startup melaporkan token tidak sah">

    - `getMe returned 401` adalah kegagalan autentikasi Telegram untuk token bot yang dikonfigurasi.
    - Salin ulang atau buat ulang token bot di BotFather, lalu perbarui `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, atau `TELEGRAM_BOT_TOKEN` untuk akun bawaan.
    - `deleteWebhook 401 Unauthorized` selama startup juga merupakan kegagalan autentikasi; memperlakukannya sebagai "tidak ada webhook" hanya akan menunda kegagalan token buruk yang sama ke panggilan API berikutnya.
    - Jika `deleteWebhook` gagal dengan galat jaringan sementara selama startup polling, OpenClaw memeriksa `getWebhookInfo`; saat Telegram melaporkan URL webhook kosong, polling berlanjut karena pembersihan sudah terpenuhi.

  </Accordion>

  <Accordion title="Ketidakstabilan polling atau jaringan">

    - Node 22+ + fetch/proxy kustom dapat memicu perilaku pembatalan langsung jika tipe AbortSignal tidak cocok.
    - Sebagian host me-resolve `api.telegram.org` ke IPv6 lebih dulu; egress IPv6 yang rusak dapat menyebabkan kegagalan API Telegram yang intermiten.
    - Jika log menyertakan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!`, OpenClaw kini mencoba ulang ini sebagai galat jaringan yang dapat dipulihkan.
    - Jika log menyertakan `Polling stall detected`, OpenClaw memulai ulang polling dan membangun ulang transport Telegram setelah 120 detik tanpa liveness long-poll yang selesai secara default.
    - `openclaw channels status --probe` dan `openclaw doctor` memberi peringatan saat akun polling yang berjalan belum menyelesaikan `getUpdates` setelah masa tenggang startup, saat akun webhook yang berjalan belum menyelesaikan `setWebhook` setelah masa tenggang startup, atau saat aktivitas transport polling terakhir yang berhasil sudah usang.
    - Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya ketika panggilan `getUpdates` yang berjalan lama sehat tetapi host Anda masih melaporkan restart polling-stall palsu. Stall persisten biasanya mengarah ke masalah proxy, DNS, IPv6, atau egress TLS antara host dan `api.telegram.org`.
    - Telegram juga menghormati env proxy proses untuk transport Bot API, termasuk `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan varian huruf kecilnya. `NO_PROXY` / `no_proxy` masih dapat melewati `api.telegram.org`.
    - Jika proxy terkelola OpenClaw dikonfigurasi melalui `OPENCLAW_PROXY_URL` untuk lingkungan layanan dan tidak ada env proxy standar, Telegram juga menggunakan URL tersebut untuk transport Bot API.
    - Pada host VPS dengan egress/TLS langsung yang tidak stabil, rutekan panggilan API Telegram melalui `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ default ke `autoSelectFamily=true` (kecuali WSL2) dan `dnsResultOrder=ipv4first`.
    - Jika host Anda adalah WSL2 atau secara eksplisit bekerja lebih baik dengan perilaku khusus IPv4, paksa pemilihan family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang benchmark RFC 2544 (`198.18.0.0/15`) sudah diizinkan
      untuk unduhan media Telegram secara default. Jika fake-IP tepercaya atau
      proxy transparan menulis ulang `api.telegram.org` ke alamat
      privat/internal/special-use lain saat unduhan media, Anda dapat ikut serta
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
      flag berbahaya tetap nonaktif terlebih dahulu. Media Telegram sudah mengizinkan rentang
      benchmark RFC 2544 secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` melemahkan perlindungan SSRF media
      Telegram. Gunakan hanya untuk lingkungan proxy tepercaya yang dikendalikan operator
      seperti perutean fake-IP Clash, Mihomo, atau Surge ketika mereka
      mensintesis jawaban privat atau special-use di luar rentang benchmark
      RFC 2544. Biarkan nonaktif untuk akses Telegram internet publik normal.
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

Bantuan lainnya: [Pemecahan masalah channel](/id/channels/troubleshooting).

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Telegram](/id/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- startup/autentikasi: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` harus menunjuk ke file reguler; symlink ditolak)
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` tingkat teratas (`type: "acp"`)
- persetujuan eksekusi: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/balasan: `replyToMode`
- streaming: `streaming` (pratinjau), `streaming.preview.toolProgress`, `blockStreaming`
- pemformatan/pengiriman: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API kustom: `apiRoot` (hanya root Bot API; jangan sertakan `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- tindakan/kapabilitas: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaksi: `reactionNotifications`, `reactionLevel`
- galat: `errorPolicy`, `errorCooldownMs`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Prioritas multi-akun: ketika dua atau lebih ID akun dikonfigurasi, atur `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) untuk membuat perutean default eksplisit. Jika tidak, OpenClaw kembali ke ID akun ternormalisasi pertama dan `openclaw doctor` memberi peringatan. Akun bernama mewarisi `channels.telegram.allowFrom` / `groupAllowFrom`, tetapi tidak nilai `accounts.default.*`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Telegram ke gateway.
  </Card>
  <Card title="Groups" icon="users" href="/id/channels/groups">
    Perilaku daftar izin grup dan topik.
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
