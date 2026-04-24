---
read_when:
    - Mengonfigurasi Plugin channel (auth, kontrol akses, multi-akun)
    - Men-debug kunci config per-channel
    - Mengaudit kebijakan DM, kebijakan grup, atau gerbang mention
summary: 'Konfigurasi channel: kontrol akses, pairing, kunci per-channel di Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan lainnya'
title: Konfigurasi — channel
x-i18n:
    generated_at: "2026-04-24T09:06:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 449275b8eef0ae841157f57baa9e04d35d9e62605726de8ee4ec098c18eb62e2
    source_path: gateway/config-channels.md
    workflow: 15
---

Kunci konfigurasi per-channel di bawah `channels.*`. Mencakup akses DM dan grup,
penyiapan multi-akun, gerbang mention, dan kunci per-channel untuk Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage, dan Plugin channel bawaan lainnya.

Untuk agen, tool, runtime gateway, dan kunci level atas lainnya, lihat
[Referensi konfigurasi](/id/gateway/configuration-reference).

## Channel

Setiap channel dimulai secara otomatis saat bagian config-nya ada (kecuali `enabled: false`).

### Akses DM dan grup

Semua channel mendukung kebijakan DM dan kebijakan grup:

| Kebijakan DM        | Perilaku                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | Pengirim yang tidak dikenal mendapat kode pairing sekali pakai; pemilik harus menyetujuinya |
| `allowlist`         | Hanya pengirim dalam `allowFrom` (atau store allow berpasangan) |
| `open`              | Izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)          |
| `disabled`          | Abaikan semua DM masuk                                          |

| Kebijakan grup        | Perilaku                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | Hanya grup yang cocok dengan allowlist yang dikonfigurasi |
| `open`                | Lewati allowlist grup (gerbang mention tetap berlaku) |
| `disabled`            | Blokir semua pesan grup/room                           |

<Note>
`channels.defaults.groupPolicy` menetapkan default saat `groupPolicy` provider tidak diatur.
Kode pairing kedaluwarsa setelah 1 jam. Permintaan pairing DM yang tertunda dibatasi hingga **3 per channel**.
Jika blok provider sama sekali tidak ada (`channels.<provider>` tidak ada), kebijakan grup runtime fallback ke `allowlist` (fail-closed) dengan peringatan saat startup.
</Note>

### Override model channel

Gunakan `channels.modelByChannel` untuk menetapkan ID channel tertentu ke sebuah model. Nilai menerima `provider/model` atau alias model yang dikonfigurasi. Pemetaan channel diterapkan saat sesi belum memiliki override model (misalnya, diatur melalui `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Default channel dan Heartbeat

Gunakan `channels.defaults` untuk kebijakan grup bersama dan perilaku Heartbeat di seluruh provider:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: fallback kebijakan grup saat `groupPolicy` level provider tidak diatur.
- `channels.defaults.contextVisibility`: mode visibilitas konteks tambahan default untuk semua channel. Nilai: `all` (default, sertakan semua konteks kutipan/thread/riwayat), `allowlist` (hanya sertakan konteks dari pengirim yang ada di allowlist), `allowlist_quote` (sama seperti allowlist tetapi pertahankan konteks kutip/balas eksplisit). Override per-channel: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sertakan status channel sehat dalam output Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: sertakan status terdegradasi/error dalam output Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: render output Heartbeat bergaya indikator yang ringkas.

### WhatsApp

WhatsApp berjalan melalui channel web gateway (Baileys Web). Ini dimulai secara otomatis saat sesi yang ditautkan ada.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // centang biru (false dalam mode self-chat)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp multi-akun">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Perintah keluar secara default menggunakan akun `default` jika ada; jika tidak, id akun terkonfigurasi pertama (diurutkan).
- `channels.whatsapp.defaultAccount` opsional menimpa pemilihan akun default fallback itu jika cocok dengan id akun yang dikonfigurasi.
- Direktori auth Baileys single-account lama dimigrasikan oleh `openclaw doctor` ke `whatsapp/default`.
- Override per-akun: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; aktifkan secara eksplisit untuk menghindari rate limit edit pratinjau)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bot: `channels.telegram.botToken` atau `channels.telegram.tokenFile` (hanya file biasa; symlink ditolak), dengan `TELEGRAM_BOT_TOKEN` sebagai fallback untuk akun default.
- `channels.telegram.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Dalam penyiapan multi-akun (2+ id akun), atur default eksplisit (`channels.telegram.defaultAccount` atau `channels.telegram.accounts.default`) untuk menghindari perutean fallback; `openclaw doctor` memperingatkan jika ini hilang atau tidak valid.
- `configWrites: false` memblokir penulisan config yang diprakarsai Telegram (migrasi ID supergroup, `/config set|unset`).
- Entri `bindings[]` level atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk topik forum (gunakan `chatId:topic:topicId` kanonis dalam `match.peer.id`). Semantik field dibagikan di [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- Pratinjau stream Telegram menggunakan `sendMessage` + `editMessageText` (berfungsi di chat langsung maupun grup).
- Kebijakan retry: lihat [Kebijakan retry](/id/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress dipetakan ke partial di Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in untuk sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, dengan `DISCORD_BOT_TOKEN` sebagai fallback untuk akun default.
- Panggilan keluar langsung yang memberikan `token` Discord eksplisit akan menggunakan token tersebut untuk panggilan itu; pengaturan retry/kebijakan akun tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
- `channels.discord.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Gunakan `user:<id>` (DM) atau `channel:<id>` (channel guild) untuk target pengiriman; ID numerik tanpa prefiks ditolak.
- Slug guild menggunakan huruf kecil dengan spasi diganti `-`; kunci channel menggunakan nama yang sudah di-slug (tanpa `#`). Lebih baik gunakan ID guild.
- Pesan yang ditulis bot diabaikan secara default. `allowBots: true` mengaktifkannya; gunakan `allowBots: "mentions"` untuk hanya menerima pesan bot yang menyebut bot (pesan milik sendiri tetap difilter).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (dan override channel) membuang pesan yang menyebut pengguna atau role lain tetapi tidak menyebut bot (tidak termasuk @everyone/@here).
- `maxLinesPerMessage` (default 17) membagi pesan yang tinggi bahkan saat panjangnya di bawah 2000 karakter.
- `channels.discord.threadBindings` mengontrol perutean terikat thread Discord:
  - `enabled`: override Discord untuk fitur sesi terikat thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan pengiriman/perutean terikat)
  - `idleHours`: override Discord untuk auto-unfocus karena tidak aktif dalam jam (`0` menonaktifkan)
  - `maxAgeHours`: override Discord untuk usia maksimum keras dalam jam (`0` menonaktifkan)
  - `spawnSubagentSessions`: sakelar opt-in untuk pembuatan/binding thread otomatis `sessions_spawn({ thread: true })`
- Entri `bindings[]` level atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk channel dan thread (gunakan id channel/thread di `match.peer.id`). Semantik field dibagikan di [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` menetapkan warna aksen untuk container Discord components v2.
- `channels.discord.voice` mengaktifkan percakapan channel suara Discord dan override auto-join + TTS opsional.
- `channels.discord.voice.daveEncryption` dan `channels.discord.voice.decryptionFailureTolerance` diteruskan ke opsi DAVE `@discordjs/voice` (default `true` dan `24`).
- OpenClaw juga berupaya memulihkan penerimaan suara dengan keluar/masuk kembali ke sesi suara setelah kegagalan dekripsi berulang.
- `channels.discord.streaming` adalah kunci mode stream kanonis. Nilai `streamMode` lama dan boolean `streaming` dimigrasikan otomatis.
- `channels.discord.autoPresence` memetakan ketersediaan runtime ke presence bot (sehat => online, terdegradasi => idle, habis => dnd) dan mengizinkan override teks status opsional.
- `channels.discord.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan nama/tag yang dapat berubah (mode kompatibilitas darurat).
- `channels.discord.execApprovals`: pengiriman persetujuan exec native Discord dan otorisasi penyetuju.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, persetujuan exec aktif saat penyetuju dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Discord yang diizinkan menyetujui permintaan exec. Fallback ke `commands.ownerAllowFrom` saat dihilangkan.
  - `agentFilter`: allowlist ID agen opsional. Hilangkan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default) mengirim ke DM penyetuju, `"channel"` mengirim ke channel asal, `"both"` mengirim ke keduanya. Saat target mencakup `"channel"`, tombol hanya dapat digunakan oleh penyetuju yang berhasil di-resolve.
  - `cleanupAfterResolve`: saat `true`, menghapus DM persetujuan setelah persetujuan, penolakan, atau timeout.

**Mode notifikasi reaksi:** `off` (tidak ada), `own` (pesan bot, default), `all` (semua pesan), `allowlist` (dari `guilds.<id>.users` pada semua pesan).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON service account: inline (`serviceAccount`) atau berbasis file (`serviceAccountFile`).
- SecretRef service account juga didukung (`serviceAccountRef`).
- Fallback env: `GOOGLE_CHAT_SERVICE_ACCOUNT` atau `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Gunakan `spaces/<spaceId>` atau `users/<userId>` untuk target pengiriman.
- `channels.googlechat.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan principal email yang dapat berubah (mode kompatibilitas darurat).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // gunakan API streaming native Slack saat mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode** memerlukan `botToken` dan `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` untuk fallback env akun default).
- **HTTP mode** memerlukan `botToken` plus `signingSecret` (di root atau per akun).
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string
  plaintext atau objek SecretRef.
- Snapshot akun Slack mengekspos field sumber/status per-kredensial seperti
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, dan, dalam mode HTTP,
  `signingSecretStatus`. `configured_unavailable` berarti akun
  dikonfigurasi melalui SecretRef tetapi jalur perintah/runtime saat ini tidak
  dapat me-resolve nilai secret.
- `configWrites: false` memblokir penulisan config yang diprakarsai Slack.
- `channels.slack.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- `channels.slack.streaming.mode` adalah kunci mode stream Slack kanonis. `channels.slack.streaming.nativeTransport` mengontrol transport streaming native Slack. Nilai lama `streamMode`, boolean `streaming`, dan `nativeStreaming` dimigrasikan otomatis.
- Gunakan `user:<id>` (DM) atau `channel:<id>` untuk target pengiriman.

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

**Isolasi sesi thread:** `thread.historyScope` bersifat per-thread (default) atau dibagikan di seluruh channel. `thread.inheritParent` menyalin transkrip channel induk ke thread baru.

- Streaming native Slack plus status thread gaya asisten Slack "is typing..." memerlukan target balasan thread. DM level atas tetap off-thread secara default, jadi menggunakan `typingReaction` atau pengiriman normal alih-alih pratinjau bergaya thread.
- `typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat balasan sedang berjalan, lalu menghapusnya saat selesai. Gunakan shortcode emoji Slack seperti `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: pengiriman persetujuan exec native Slack dan otorisasi penyetuju. Skemanya sama seperti Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID pengguna Slack), `agentFilter`, `sessionFilter`, dan `target` (`"dm"`, `"channel"`, atau `"both"`).

| Grup aksi   | Default   | Catatan                 |
| ----------- | --------- | ----------------------- |
| reactions   | enabled   | React + daftar reaksi   |
| messages    | enabled   | Baca/kirim/edit/hapus   |
| pins        | enabled   | Pin/unpin/daftar        |
| memberInfo  | enabled   | Info anggota            |
| emojiList   | enabled   | Daftar emoji kustom     |

### Mattermost

Mattermost dikirim sebagai Plugin: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL eksplisit opsional untuk deployment reverse-proxy/publik
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Mode chat: `oncall` (merespons pada @-mention, default), `onmessage` (setiap pesan), `onchar` (pesan yang dimulai dengan prefiks pemicu).

Saat command native Mattermost diaktifkan:

- `commands.callbackPath` harus berupa path (misalnya `/api/channels/mattermost/command`), bukan URL lengkap.
- `commands.callbackUrl` harus di-resolve ke endpoint gateway OpenClaw dan dapat dijangkau dari server Mattermost.
- Callback slash native diautentikasi dengan token per-command yang dikembalikan
  oleh Mattermost selama pendaftaran slash command. Jika pendaftaran gagal atau tidak ada
  command yang diaktifkan, OpenClaw menolak callback dengan
  `Unauthorized: invalid command token.`
- Untuk host callback privat/tailnet/internal, Mattermost mungkin memerlukan
  `ServiceSettings.AllowedUntrustedInternalConnections` untuk menyertakan host/domain callback.
  Gunakan nilai host/domain, bukan URL lengkap.
- `channels.mattermost.configWrites`: izinkan atau tolak penulisan config yang diprakarsai Mattermost.
- `channels.mattermost.requireMention`: memerlukan `@mention` sebelum membalas di channel.
- `channels.mattermost.groups.<channelId>.requireMention`: override gerbang mention per-channel (`"*"` untuk default).
- `channels.mattermost.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // binding akun opsional
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

- `channels.signal.account`: tetapkan startup channel ke identitas akun Signal tertentu.
- `channels.signal.configWrites`: izinkan atau tolak penulisan config yang diprakarsai Signal.
- `channels.signal.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

### BlueBubbles

BlueBubbles adalah jalur iMessage yang direkomendasikan (didukung Plugin, dikonfigurasi di bawah `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, kontrol grup, dan aksi lanjutan:
      // lihat /channels/bluebubbles
    },
  },
}
```

- Path kunci inti yang dicakup di sini: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Entri `bindings[]` level atas dengan `type: "acp"` dapat mengikat percakapan BlueBubbles ke sesi ACP persisten. Gunakan handle atau string target BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik field bersama: [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- Konfigurasi channel BlueBubbles lengkap didokumentasikan di [BlueBubbles](/id/channels/bluebubbles).

### iMessage

OpenClaw menjalankan `imsg rpc` (JSON-RPC melalui stdio). Tidak memerlukan daemon atau port.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- `channels.imessage.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

- Memerlukan Full Disk Access ke DB Messages.
- Lebih baik gunakan target `chat_id:<id>`. Gunakan `imsg chats --limit 20` untuk mencantumkan chat.
- `cliPath` dapat menunjuk ke wrapper SSH; atur `remoteHost` (`host` atau `user@host`) untuk pengambilan lampiran SCP.
- `attachmentRoots` dan `remoteAttachmentRoots` membatasi path lampiran masuk (default: `/Users/*/Library/Messages/Attachments`).
- SCP menggunakan strict host-key checking, jadi pastikan host key relay sudah ada di `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: izinkan atau tolak penulisan config yang diprakarsai iMessage.
- Entri `bindings[]` level atas dengan `type: "acp"` dapat mengikat percakapan iMessage ke sesi ACP persisten. Gunakan handle yang dinormalisasi atau target chat eksplisit (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik field bersama: [ACP Agents](/id/tools/acp-agents#channel-specific-settings).

<Accordion title="Contoh wrapper SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix didukung Plugin dan dikonfigurasi di bawah `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Auth token menggunakan `accessToken`; auth password menggunakan `userId` + `password`.
- `channels.matrix.proxy` merutekan traffic HTTP Matrix melalui proxy HTTP(S) eksplisit. Akun bernama dapat menimpanya dengan `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` mengizinkan homeserver privat/internal. `proxy` dan opt-in jaringan ini adalah kontrol yang terpisah.
- `channels.matrix.defaultAccount` memilih akun yang diutamakan dalam penyiapan multi-akun.
- `channels.matrix.autoJoin` default-nya `off`, sehingga room yang diundang dan undangan gaya DM baru diabaikan sampai Anda mengatur `autoJoin: "allowlist"` dengan `autoJoinAllowlist` atau `autoJoin: "always"`.
- `channels.matrix.execApprovals`: pengiriman persetujuan exec native Matrix dan otorisasi penyetuju.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, persetujuan exec aktif saat penyetuju dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Matrix (misalnya `@owner:example.org`) yang diizinkan menyetujui permintaan exec.
  - `agentFilter`: allowlist ID agen opsional. Hilangkan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default), `"channel"` (room asal), atau `"both"`.
  - Override per-akun: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` mengontrol cara DM Matrix dikelompokkan ke dalam sesi: `per-user` (default) dibagikan menurut peer yang dirutekan, sedangkan `per-room` mengisolasi setiap room DM.
- Probe status Matrix dan pencarian direktori live menggunakan kebijakan proxy yang sama dengan traffic runtime.
- Konfigurasi Matrix lengkap, aturan penargetan, dan contoh penyiapan didokumentasikan di [Matrix](/id/channels/matrix).

### Microsoft Teams

Microsoft Teams didukung Plugin dan dikonfigurasi di bawah `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, kebijakan tim/channel:
      // lihat /channels/msteams
    },
  },
}
```

- Path kunci inti yang dicakup di sini: `channels.msteams`, `channels.msteams.configWrites`.
- Config Teams lengkap (kredensial, webhook, kebijakan DM/grup, override per-tim/per-channel) didokumentasikan di [Microsoft Teams](/id/channels/msteams).

### IRC

IRC didukung Plugin dan dikonfigurasi di bawah `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Path kunci inti yang dicakup di sini: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Konfigurasi channel IRC lengkap (host/port/TLS/channel/allowlist/gerbang mention) didokumentasikan di [IRC](/id/channels/irc).

### Multi-akun (semua channel)

Jalankan beberapa akun per channel (masing-masing dengan `accountId` sendiri):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` digunakan saat `accountId` dihilangkan (CLI + perutean).
- Token env hanya berlaku untuk akun **default**.
- Pengaturan channel dasar berlaku untuk semua akun kecuali ditimpa per akun.
- Gunakan `bindings[].match.accountId` untuk merutekan setiap akun ke agen yang berbeda.
- Jika Anda menambahkan akun non-default melalui `openclaw channels add` (atau onboarding channel) saat masih berada pada config channel level atas single-account, OpenClaw terlebih dahulu mempromosikan nilai single-account level atas yang dicakup akun ke peta akun channel agar akun asli tetap berfungsi. Sebagian besar channel memindahkannya ke `channels.<channel>.accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada dan cocok.
- Binding khusus channel yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default; binding yang dicakup akun tetap opsional.
- `openclaw doctor --fix` juga memperbaiki bentuk campuran dengan memindahkan nilai single-account level atas yang dicakup akun ke akun hasil promosi yang dipilih untuk channel tersebut. Sebagian besar channel menggunakan `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada dan cocok.

### Channel Plugin lainnya

Banyak channel Plugin dikonfigurasi sebagai `channels.<id>` dan didokumentasikan pada halaman channel khususnya masing-masing (misalnya Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, dan Twitch).
Lihat indeks channel lengkap: [Channels](/id/channels).

### Gerbang mention chat grup

Pesan grup secara default **memerlukan mention** (mention metadata atau pola regex aman). Berlaku untuk chat grup WhatsApp, Telegram, Discord, Google Chat, dan iMessage.

**Tipe mention:**

- **Mention metadata**: @-mention native platform. Diabaikan dalam mode self-chat WhatsApp.
- **Pola teks**: pola regex aman di `agents.list[].groupChat.mentionPatterns`. Pola tidak valid dan pengulangan bertingkat yang tidak aman diabaikan.
- Gerbang mention hanya diterapkan saat deteksi dimungkinkan (mention native atau setidaknya satu pola).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` menetapkan default global. Channel dapat menimpanya dengan `channels.<channel>.historyLimit` (atau per-akun). Atur `0` untuk menonaktifkan.

#### Batas riwayat DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Resolusi: override per-DM → default provider → tanpa batas (semua dipertahankan).

Didukung: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Mode self-chat

Sertakan nomor Anda sendiri di `allowFrom` untuk mengaktifkan mode self-chat (mengabaikan @-mention native, hanya merespons pola teks):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Perintah (penanganan perintah chat)

```json5
{
  commands: {
    native: "auto", // daftarkan perintah native saat didukung
    nativeSkills: "auto", // daftarkan perintah Skills native saat didukung
    text: true, // parse /commands dalam pesan chat
    bash: false, // izinkan ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // izinkan /config
    mcp: false, // izinkan /mcp
    plugins: false, // izinkan /plugins
    debug: false, // izinkan /debug
    restart: true, // izinkan /restart + tool restart gateway
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Detail perintah">

- Blok ini mengonfigurasi surface perintah. Untuk katalog perintah bawaan + Plugin bawaan saat ini, lihat [Slash Commands](/id/tools/slash-commands).
- Halaman ini adalah **referensi kunci config**, bukan katalog perintah lengkap. Perintah milik channel/Plugin seperti QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone`, dan Talk `/voice` didokumentasikan di halaman channel/Plugin masing-masing serta [Slash Commands](/id/tools/slash-commands).
- Perintah teks harus berupa pesan **mandiri** dengan awalan `/`.
- `native: "auto"` menyalakan perintah native untuk Discord/Telegram, membiarkan Slack nonaktif.
- `nativeSkills: "auto"` menyalakan perintah Skills native untuk Discord/Telegram, membiarkan Slack nonaktif.
- Override per channel: `channels.discord.commands.native` (bool atau `"auto"`). `false` menghapus perintah yang sebelumnya terdaftar.
- Override pendaftaran skill native per channel dengan `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` menambahkan entri menu bot Telegram tambahan.
- `bash: true` mengaktifkan `! <cmd>` untuk shell host. Memerlukan `tools.elevated.enabled` dan pengirim ada di `tools.elevated.allowFrom.<channel>`.
- `config: true` mengaktifkan `/config` (membaca/menulis `openclaw.json`). Untuk klien gateway `chat.send`, penulisan persisten `/config set|unset` juga memerlukan `operator.admin`; `/config show` yang read-only tetap tersedia bagi klien operator normal dengan cakupan tulis.
- `mcp: true` mengaktifkan `/mcp` untuk config server MCP yang dikelola OpenClaw di bawah `mcp.servers`.
- `plugins: true` mengaktifkan `/plugins` untuk penemuan Plugin, instalasi, dan kontrol aktif/nonaktif.
- `channels.<provider>.configWrites` membatasi mutasi config per channel (default: true).
- Untuk channel multi-akun, `channels.<provider>.accounts.<id>.configWrites` juga membatasi penulisan yang menargetkan akun tersebut (misalnya `/allowlist --config --account <id>` atau `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` menonaktifkan `/restart` dan aksi tool restart gateway. Default: `true`.
- `ownerAllowFrom` adalah allowlist pemilik eksplisit untuk perintah/tool khusus pemilik. Ini terpisah dari `allowFrom`.
- `ownerDisplay: "hash"` meng-hash id pemilik dalam prompt sistem. Atur `ownerDisplaySecret` untuk mengontrol hashing.
- `allowFrom` bersifat per-provider. Saat diatur, ini menjadi **satu-satunya** sumber otorisasi (allowlist/pairing channel dan `useAccessGroups` diabaikan).
- `useAccessGroups: false` memungkinkan perintah melewati kebijakan grup akses saat `allowFrom` tidak diatur.
- Peta dokumentasi perintah:
  - katalog bawaan + Plugin bawaan: [Slash Commands](/id/tools/slash-commands)
  - surface perintah khusus channel: [Channels](/id/channels)
  - perintah QQ Bot: [QQ Bot](/id/channels/qqbot)
  - perintah pairing: [Pairing](/id/channels/pairing)
  - perintah kartu LINE: [LINE](/id/channels/line)
  - Dreaming memory: [Dreaming](/id/concepts/dreaming)

</Accordion>

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — kunci level atas
- [Konfigurasi — agen](/id/gateway/config-agents)
- [Ikhtisar channel](/id/channels)
