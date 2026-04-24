---
read_when:
    - Mengerjakan fitur Telegram atau Webhook
summary: Status dukungan bot Telegram, kapabilitas, dan konfigurasi
title: Telegram
x-i18n:
    generated_at: "2026-04-24T08:59:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdd6ea0277e074f90306f91d51fd329c6914de85dde0ae09a731713f1bba98d9
    source_path: channels/telegram.md
    workflow: 15
---

Siap produksi untuk DM bot dan grup melalui grammY. Mode default adalah long polling; mode Webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran dan playbook perbaikan.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/id/gateway/configuration">
    Pola konfigurasi saluran lengkap dan contohnya.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Create the bot token in BotFather">
    Buka Telegram dan chat dengan **@BotFather** (pastikan handle-nya tepat `@BotFather`).

    Jalankan `/newbot`, ikuti prompt, lalu simpan token-nya.

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
    Telegram **tidak** menggunakan `openclaw channels login telegram`; konfigurasikan token di config/env, lalu jalankan gateway.

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
    Tambahkan bot ke grup Anda, lalu setel `channels.telegram.groups` dan `groupPolicy` agar sesuai dengan model akses Anda.
  </Step>
</Steps>

<Note>
Urutan resolusi token memperhatikan akun. Dalam praktiknya, nilai config lebih diutamakan daripada fallback env, dan `TELEGRAM_BOT_TOKEN` hanya berlaku untuk akun default.
</Note>

## Pengaturan sisi Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Bot Telegram secara default menggunakan **Privacy Mode**, yang membatasi pesan grup yang dapat mereka terima.

    Jika bot harus melihat semua pesan grup, lakukan salah satu berikut:

    - nonaktifkan privacy mode melalui `/setprivacy`, atau
    - jadikan bot admin grup.

    Saat mengubah privacy mode, keluarkan + tambahkan kembali bot di setiap grup agar Telegram menerapkan perubahan tersebut.

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

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` mengontrol akses pesan langsung:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu ID pengirim di `allowFrom`)
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` menerima ID pengguna Telegram numerik. Prefiks `telegram:` / `tg:` diterima dan dinormalisasi.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi config.
    Penyiapan hanya meminta ID pengguna numerik.
    Jika Anda melakukan upgrade dan config Anda berisi entri allowlist `@username`, jalankan `openclaw doctor --fix` untuk menyelesaikannya (best-effort; memerlukan token bot Telegram).
    Jika sebelumnya Anda mengandalkan file allowlist pairing-store, `openclaw doctor --fix` dapat memulihkan entri ke `channels.telegram.allowFrom` dalam alur allowlist (misalnya saat `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot satu pemilik, gunakan `dmPolicy: "allowlist"` dengan `allowFrom` ID numerik yang eksplisit agar kebijakan akses tetap tahan lama di config (bukan bergantung pada persetujuan pairing sebelumnya).

    Kebingungan umum: persetujuan pairing DM tidak berarti "pengirim ini diotorisasi di mana-mana".
    Pairing hanya memberikan akses DM. Otorisasi pengirim grup tetap berasal dari allowlist config eksplisit.
    Jika Anda ingin "saya diotorisasi sekali dan DM serta perintah grup sama-sama berfungsi", masukkan ID pengguna Telegram numerik Anda ke `channels.telegram.allowFrom`.

    ### Menemukan ID pengguna Telegram Anda

    Lebih aman (tanpa bot pihak ketiga):

    1. Kirim DM ke bot Anda.
    2. Jalankan `openclaw logs --follow`.
    3. Baca `from.id`.

    Metode Bot API resmi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metode pihak ketiga (kurang privat): `@userinfobot` atau `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    Dua kontrol diterapkan bersama:

    1. **Grup mana yang diizinkan** (`channels.telegram.groups`)
       - tidak ada config `groups`:
         - dengan `groupPolicy: "open"`: grup mana pun dapat lolos pemeriksaan group-ID
         - dengan `groupPolicy: "allowlist"` (default): grup diblokir sampai Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: bertindak sebagai allowlist (ID eksplisit atau `"*"`)

    2. **Pengirim mana yang diizinkan di grup** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` digunakan untuk pemfilteran pengirim grup. Jika tidak disetel, Telegram fallback ke `allowFrom`.
    Entri `groupAllowFrom` harus berupa ID pengguna Telegram numerik (prefiks `telegram:` / `tg:` dinormalisasi).
    Jangan masukkan ID chat grup atau supergrup Telegram ke `groupAllowFrom`. ID chat negatif harus ditempatkan di `channels.telegram.groups`.
    Entri nonnumerik diabaikan untuk otorisasi pengirim.
    Batas keamanan (`2026.2.25+`): autentikasi pengirim grup **tidak** mewarisi persetujuan pairing-store DM.
    Pairing tetap hanya untuk DM. Untuk grup, setel `groupAllowFrom` atau `allowFrom` per-grup/per-topik.
    Jika `groupAllowFrom` tidak disetel, Telegram fallback ke config `allowFrom`, bukan pairing store.
    Pola praktis untuk bot satu pemilik: setel ID pengguna Anda di `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak disetel, dan izinkan grup target di bawah `channels.telegram.groups`.
    Catatan runtime: jika `channels.telegram` sama sekali tidak ada, runtime secara default fail-closed `groupPolicy="allowlist"` kecuali `channels.defaults.groupPolicy` disetel secara eksplisit.

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

      - Letakkan ID grup atau supergrup Telegram negatif seperti `-1001234567890` di bawah `channels.telegram.groups`.
      - Letakkan ID pengguna Telegram seperti `8734062810` di bawah `groupAllowFrom` saat Anda ingin membatasi siapa saja di dalam grup yang diizinkan yang dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya saat Anda ingin anggota mana pun dari grup yang diizinkan dapat berbicara dengan bot.
    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Balasan grup secara default memerlukan mention.

    Mention dapat berasal dari:

    - mention bawaan `@botusername`, atau
    - pola mention di:
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
    - atau periksa `getUpdates` Bot API

  </Tab>
</Tabs>

## Perilaku runtime

- Telegram dimiliki oleh proses gateway.
- Perutean bersifat deterministik: pesan masuk Telegram dibalas kembali ke Telegram (model tidak memilih saluran).
- Pesan masuk dinormalisasi ke amplop saluran bersama dengan metadata balasan dan placeholder media.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>` agar topik tetap terisolasi.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw merutekannya dengan session key yang sadar thread dan mempertahankan thread ID untuk balasan.
- Long polling menggunakan grammY runner dengan pengurutan per-chat/per-thread. Konkruensi sink runner keseluruhan menggunakan `agents.defaults.maxConcurrent`.
- Restart watchdog long-polling dipicu secara default setelah 120 detik tanpa liveness `getUpdates` yang selesai. Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya jika deployment Anda masih melihat restart polling-stall palsu selama pekerjaan yang berjalan lama. Nilainya dalam milidetik dan diperbolehkan dari `30000` hingga `600000`; override per akun didukung.
- Telegram Bot API tidak memiliki dukungan read-receipt (`sendReadReceipts` tidak berlaku).

## Referensi fitur

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw dapat melakukan streaming balasan parsial secara real time:

    - chat langsung: preview message + `editMessageText`
    - grup/topik: preview message + `editMessageText`

    Persyaratan:

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - `progress` dipetakan ke `partial` di Telegram (kompatibel dengan penamaan lintas saluran)
    - `streaming.preview.toolProgress` mengontrol apakah pembaruan tool/progress menggunakan kembali preview message yang sama yang diedit (default: `true`). Setel `false` untuk mempertahankan pesan tool/progress terpisah.
    - nilai boolean `channels.telegram.streamMode` dan `streaming` lama dipetakan secara otomatis

    Untuk balasan hanya teks:

    - DM: OpenClaw mempertahankan preview message yang sama dan melakukan edit final di tempat (tanpa pesan kedua)
    - grup/topik: OpenClaw mempertahankan preview message yang sama dan melakukan edit final di tempat (tanpa pesan kedua)

    Untuk balasan kompleks (misalnya payload media), OpenClaw fallback ke pengiriman final normal lalu membersihkan preview message.

    Streaming preview terpisah dari block streaming. Saat block streaming diaktifkan secara eksplisit untuk Telegram, OpenClaw melewati streaming preview untuk menghindari streaming ganda.

    Jika transport draft bawaan tidak tersedia/ditolak, OpenClaw secara otomatis fallback ke `sendMessage` + `editMessageText`.

    Streaming reasoning khusus Telegram:

    - `/reasoning stream` mengirim reasoning ke preview live selama proses pembuatan
    - jawaban akhir dikirim tanpa teks reasoning

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    Teks keluar menggunakan Telegram `parse_mode: "HTML"`.

    - Teks bergaya Markdown dirender ke HTML aman untuk Telegram.
    - HTML mentah model di-escape untuk mengurangi kegagalan parse Telegram.
    - Jika Telegram menolak HTML yang sudah di-parse, OpenClaw mencoba ulang sebagai teks biasa.

    Preview tautan diaktifkan secara default dan dapat dinonaktifkan dengan `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Pendaftaran menu perintah Telegram ditangani saat startup dengan `setMyCommands`.

    Default perintah bawaan:

    - `commands.native: "auto"` mengaktifkan perintah bawaan untuk Telegram

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
    - perintah kustom tidak dapat menggantikan perintah bawaan
    - konflik/duplikat dilewati dan dicatat

    Catatan:

    - perintah kustom hanyalah entri menu; perintah tersebut tidak otomatis mengimplementasikan perilaku
    - perintah plugin/skill tetap dapat berfungsi saat diketik meskipun tidak ditampilkan di menu Telegram

    Jika perintah bawaan dinonaktifkan, perintah bawaan akan dihapus. Perintah kustom/plugin mungkin tetap didaftarkan jika dikonfigurasi.

    Kegagalan penyiapan umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu Telegram masih meluap setelah dipangkas; kurangi perintah plugin/skill/kustom atau nonaktifkan `channels.telegram.commands.native`.
    - `setMyCommands failed` dengan error network/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah pairing perangkat (plugin `device-pair`)

    Saat plugin `device-pair` terinstal:

    1. `/pair` menghasilkan kode penyiapan
    2. tempelkan kode di aplikasi iOS
    3. `/pair pending` menampilkan daftar permintaan yang tertunda (termasuk role/scopes)
    4. setujui permintaan:
       - `/pair approve <requestId>` untuk persetujuan eksplisit
       - `/pair approve` ketika hanya ada satu permintaan tertunda
       - `/pair approve latest` untuk yang terbaru

    Kode penyiapan membawa bootstrap token berumur pendek. Bootstrap handoff bawaan menjaga token node utama pada `scopes: []`; token operator yang diserahkan tetap dibatasi pada `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`. Pemeriksaan cakupan bootstrap menggunakan prefiks role, sehingga allowlist operator tersebut hanya memenuhi permintaan operator; role non-operator tetap memerlukan scopes di bawah prefiks role mereka sendiri.

    Jika perangkat mencoba lagi dengan detail auth yang berubah (misalnya role/scopes/public key), permintaan tertunda sebelumnya akan digantikan dan permintaan baru menggunakan `requestId` yang berbeda. Jalankan ulang `/pair pending` sebelum menyetujui.

    Detail lebih lanjut: [Pairing](/id/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
    Konfigurasikan cakupan inline keyboard:

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

    Klik callback diteruskan ke agen sebagai teks:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Tindakan alat Telegram mencakup:

    - `sendMessage` (`to`, `content`, opsional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opsional `iconColor`, `iconCustomEmojiId`)

    Tindakan pesan saluran mengekspos alias ergonomis (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrol pembatasan:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (default: disabled)

    Catatan: `edit` dan `topic-create` saat ini diaktifkan secara default dan tidak memiliki toggle `channels.telegram.actions.*` terpisah.
    Pengiriman runtime menggunakan snapshot config/secrets aktif (startup/reload), sehingga jalur tindakan tidak melakukan re-resolve SecretRef ad-hoc per pengiriman.

    Semantik penghapusan reaksi: [/tools/reactions](/id/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram mendukung tag reply threading eksplisit dalam output yang dihasilkan:

    - `[[reply_to_current]]` membalas pesan pemicu
    - `[[reply_to:<id>]]` membalas ID pesan Telegram tertentu

    `channels.telegram.replyToMode` mengontrol penanganan:

    - `off` (default)
    - `first`
    - `all`

    Catatan: `off` menonaktifkan reply threading implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Supergrup forum:

    - session key topik menambahkan `:topic:<threadId>`
    - balasan dan typing menargetkan thread topik
    - path config topik:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Kasus khusus topik umum (`threadId=1`):

    - pengiriman pesan menghilangkan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)`)
    - tindakan typing tetap menyertakan `message_thread_id`

    Pewarisan topik: entri topik mewarisi pengaturan grup kecuali di-override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` hanya untuk topik dan tidak diwarisi dari default grup.

    **Perutean agen per topik**: Setiap topik dapat dirutekan ke agen yang berbeda dengan menetapkan `agentId` di config topik. Ini memberi setiap topik workspace, memori, dan sesi terisolasi sendiri. Contoh:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Topik umum → agen main
                "3": { agentId: "zu" },        // Topik dev → agen zu
                "5": { agentId: "coder" }      // Code review → agen coder
              }
            }
          }
        }
      }
    }
    ```

    Setiap topik kemudian memiliki session key sendiri: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Binding topik ACP persisten**: Topik forum dapat menyematkan sesi harness ACP melalui binding ACP bertipe tingkat atas (`bindings[]` dengan `type: "acp"` dan `match.channel: "telegram"`, `peer.kind: "group"`, dan id berkualifikasi topik seperti `-1001234567890:topic:42`). Saat ini dibatasi untuk topik forum di grup/supergrup. Lihat [ACP Agents](/id/tools/acp-agents).

    **Spawn ACP terikat thread dari chat**: `/acp spawn <agent> --thread here|auto` mengikat topik saat ini ke sesi ACP baru; tindak lanjut dirutekan langsung ke sana. OpenClaw menyematkan konfirmasi spawn di dalam topik. Memerlukan `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Konteks template mengekspos `MessageThreadId` dan `IsForum`. Chat DM dengan `message_thread_id` tetap menggunakan perutean DM tetapi memakai session key yang sadar thread.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Pesan audio

    Telegram membedakan voice note dan file audio.

    - default: perilaku file audio
    - tag `[[audio_as_voice]]` dalam balasan agen untuk memaksa pengiriman sebagai voice note

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

    Telegram membedakan file video dan video note.

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

    Video note tidak mendukung caption; teks pesan yang diberikan dikirim secara terpisah.

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

    File cache stiker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stiker dideskripsikan sekali (jika memungkinkan) dan di-cache untuk mengurangi panggilan vision berulang.

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

    Saat diaktifkan, OpenClaw mengantrekan system event seperti:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfigurasi:

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    Catatan:

    - `own` berarti hanya reaksi pengguna terhadap pesan yang dikirim bot (best-effort melalui cache pesan terkirim).
    - Peristiwa reaksi tetap mematuhi kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim yang tidak diotorisasi akan dibuang.
    - Telegram tidak menyediakan ID thread dalam pembaruan reaksi.
      - grup non-forum dirutekan ke sesi chat grup
      - grup forum dirutekan ke sesi topik umum grup (`:topic:1`), bukan ke topik asal yang tepat

    `allowed_updates` untuk polling/Webhook otomatis menyertakan `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` mengirim emoji konfirmasi saat OpenClaw sedang memproses pesan masuk.

    Urutan resolusi:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, atau "👀")

    Catatan:

    - Telegram mengharapkan emoji Unicode (misalnya "👀").
    - Gunakan `""` untuk menonaktifkan reaksi pada saluran atau akun.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Penulisan config saluran diaktifkan secara default (`configWrites !== false`).

    Penulisan yang dipicu Telegram mencakup:

    - peristiwa migrasi grup (`migrate_to_chat_id`) untuk memperbarui `channels.telegram.groups`
    - `/config set` dan `/config unset` (memerlukan perintah diaktifkan)

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
    Default-nya adalah long polling. Untuk mode Webhook setel `channels.telegram.webhookUrl` dan `channels.telegram.webhookSecret`; opsional `webhookPath`, `webhookHost`, `webhookPort` (default `/telegram-webhook`, `127.0.0.1`, `8787`).

    Listener lokal melakukan bind ke `127.0.0.1:8787`. Untuk ingress publik, letakkan reverse proxy di depan port lokal atau setel `webhookHost: "0.0.0.0"` secara sengaja.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - default `channels.telegram.textChunkLimit` adalah 4000.
    - `channels.telegram.chunkMode="newline"` lebih mengutamakan batas paragraf (baris kosong) sebelum pemisahan berdasarkan panjang.
    - `channels.telegram.mediaMaxMb` (default 100) membatasi ukuran media Telegram masuk dan keluar.
    - `channels.telegram.timeoutSeconds` menimpa timeout klien API Telegram (jika tidak disetel, default grammY berlaku).
    - default `channels.telegram.pollingStallThresholdMs` adalah `120000`; setel antara `30000` dan `600000` hanya untuk restart polling-stall false-positive.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (default 50); `0` menonaktifkan.
    - konteks tambahan reply/quote/forward saat ini diteruskan sebagaimana diterima.
    - allowlist Telegram terutama membatasi siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan penuh.
    - kontrol riwayat DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` berlaku untuk helper pengiriman Telegram (CLI/tools/actions) untuk error API keluar yang dapat dipulihkan.

    Target pengiriman CLI dapat berupa ID chat numerik atau username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Polling Telegram menggunakan `openclaw message poll` dan mendukung topik forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag polling khusus Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` untuk topik forum (atau gunakan target `:topic:`)

    Pengiriman Telegram juga mendukung:

    - `--presentation` dengan blok `buttons` untuk inline keyboard saat `channels.telegram.capabilities.inlineButtons` mengizinkannya
    - `--pin` atau `--delivery '{"pin":true}'` untuk meminta pengiriman yang disematkan saat bot dapat menyematkan di chat tersebut
    - `--force-document` untuk mengirim gambar dan GIF keluar sebagai dokumen alih-alih unggahan foto terkompresi atau media animasi

    Pembatasan tindakan:

    - `channels.telegram.actions.sendMessage=false` menonaktifkan pesan Telegram keluar, termasuk polling
    - `channels.telegram.actions.poll=false` menonaktifkan pembuatan polling Telegram sambil tetap membiarkan pengiriman biasa aktif

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram mendukung persetujuan exec di DM approver dan secara opsional dapat memposting prompt di chat atau topik asal. Approver harus berupa ID pengguna Telegram numerik.

    Path config:

    - `channels.telegram.execApprovals.enabled` (aktif otomatis saat setidaknya satu approver dapat diselesaikan)
    - `channels.telegram.execApprovals.approvers` (fallback ke ID pemilik numerik dari `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (default) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Pengiriman saluran menampilkan teks perintah di chat; hanya aktifkan `channel` atau `both` di grup/topik tepercaya. Saat prompt mendarat di topik forum, OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjutnya. Persetujuan exec kedaluwarsa setelah 30 menit secara default.

    Tombol persetujuan inline juga memerlukan `channels.telegram.capabilities.inlineButtons` untuk mengizinkan permukaan target (`dm`, `group`, atau `all`). ID persetujuan dengan prefiks `plugin:` diselesaikan melalui persetujuan plugin; yang lain diselesaikan melalui persetujuan exec terlebih dahulu.

    Lihat [Exec approvals](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrol balasan error

Saat agen mengalami error pengiriman atau provider, Telegram dapat membalas dengan teks error atau menekannya. Dua kunci config mengontrol perilaku ini:

| Kunci                               | Nilai             | Default | Deskripsi                                                                                      |
| ----------------------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` mengirim pesan error yang ramah ke chat. `silent` menekan seluruh balasan error.      |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Waktu minimum antar balasan error ke chat yang sama. Mencegah spam error selama gangguan.     |

Override per akun, per grup, dan per topik didukung (pewarisan yang sama seperti kunci config Telegram lainnya).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // tekan error di grup ini
        },
      },
    },
  },
}
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bot does not respond to non mention group messages">

    - Jika `requireMention=false`, privacy mode Telegram harus mengizinkan visibilitas penuh.
      - BotFather: `/setprivacy` -> Disable
      - lalu keluarkan + tambahkan kembali bot ke grup
    - `openclaw channels status` memperingatkan saat config mengharapkan pesan grup tanpa mention.
    - `openclaw channels status --probe` dapat memeriksa ID grup numerik eksplisit; wildcard `"*"` tidak dapat diperiksa keanggotaannya.
    - uji sesi cepat: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - saat `channels.telegram.groups` ada, grup harus terdaftar (atau menyertakan `"*"`)
    - verifikasi keanggotaan bot di grup
    - tinjau log: `openclaw logs --follow` untuk alasan pengabaian

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - otorisasi identitas pengirim Anda (pairing dan/atau `allowFrom` numerik)
    - otorisasi perintah tetap berlaku bahkan saat kebijakan grup adalah `open`
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu bawaan memiliki terlalu banyak entri; kurangi perintah plugin/skill/kustom atau nonaktifkan menu bawaan
    - `setMyCommands failed` dengan error network/fetch biasanya menunjukkan masalah keterjangkauan DNS/HTTPS ke `api.telegram.org`

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ + fetch/proxy kustom dapat memicu perilaku abort langsung jika tipe AbortSignal tidak cocok.
    - Beberapa host menyelesaikan `api.telegram.org` ke IPv6 terlebih dahulu; egress IPv6 yang rusak dapat menyebabkan kegagalan API Telegram yang intermiten.
    - Jika log menyertakan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!`, OpenClaw sekarang mencoba ulang ini sebagai error jaringan yang dapat dipulihkan.
    - Jika log menyertakan `Polling stall detected`, OpenClaw me-restart polling dan membangun ulang transport Telegram setelah 120 detik tanpa liveness long-poll yang selesai secara default.
    - Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya ketika panggilan `getUpdates` yang berjalan lama sehat tetapi host Anda masih melaporkan restart polling-stall false-positive. Stall persisten biasanya menunjukkan masalah proxy, DNS, IPv6, atau TLS egress antara host dan `api.telegram.org`.
    - Pada host VPS dengan egress/TLS langsung yang tidak stabil, rutekan panggilan API Telegram melalui `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Default Node 22+ adalah `autoSelectFamily=true` (kecuali WSL2) dan `dnsResultOrder=ipv4first`.
    - Jika host Anda adalah WSL2 atau secara eksplisit bekerja lebih baik dengan perilaku hanya IPv4, paksa pemilihan family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang benchmark RFC 2544 (`198.18.0.0/15`) sudah diizinkan
      untuk unduhan media Telegram secara default. Jika fake-IP atau
      proxy transparan tepercaya menulis ulang `api.telegram.org` ke alamat
      private/internal/special-use lain selama unduhan media, Anda dapat memilih
      bypass khusus Telegram ini:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Opt-in yang sama tersedia per akun di
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jika proxy Anda menyelesaikan host media Telegram ke `198.18.x.x`, biarkan
      flag berbahaya tetap nonaktif terlebih dahulu. Media Telegram sudah
      mengizinkan rentang benchmark RFC 2544 secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` melemahkan
      perlindungan SSRF media Telegram. Gunakan hanya untuk lingkungan proxy
      tepercaya yang dikendalikan operator seperti Clash, Mihomo, atau Surge fake-IP routing saat mereka
      mensintesis jawaban private atau special-use di luar rentang benchmark RFC 2544.
      Biarkan nonaktif untuk akses Telegram internet publik normal.
    </Warning>

    - Override environment (sementara):
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

Bantuan lebih lanjut: [Pemecahan masalah saluran](/id/channels/troubleshooting).

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Telegram](/id/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` harus menunjuk ke file biasa; symlink ditolak)
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, tingkat atas `bindings[]` (`type: "acp"`)
- persetujuan exec: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/balasan: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- formatting/pengiriman: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- tindakan/kapabilitas: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaksi: `reactionNotifications`, `reactionLevel`
- error: `errorPolicy`, `errorCooldownMs`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Prioritas multi-akun: saat dua atau lebih ID akun dikonfigurasi, setel `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) agar perutean default eksplisit. Jika tidak, OpenClaw fallback ke ID akun ternormalisasi pertama dan `openclaw doctor` akan memperingatkan. Akun bernama mewarisi `channels.telegram.allowFrom` / `groupAllowFrom`, tetapi tidak mewarisi nilai `accounts.default.*`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pair pengguna Telegram ke gateway.
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
    Diagnostik lintas saluran.
  </Card>
</CardGroup>
