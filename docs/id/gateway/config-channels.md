---
read_when:
    - Mengonfigurasi Plugin saluran (autentikasi, kontrol akses, multi-akun)
    - Pemecahan masalah kunci konfigurasi per saluran
    - Mengaudit kebijakan DM, kebijakan grup, atau pembatasan mention
summary: 'Konfigurasi saluran: kontrol akses, penyandingan, kunci per saluran di Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan lainnya'
title: Konfigurasi — saluran
x-i18n:
    generated_at: "2026-06-27T17:28:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

Kunci konfigurasi per saluran di bawah `channels.*`. Mencakup akses DM dan grup,
setup multi-akun, pembatasan mention, dan kunci per saluran untuk Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage, serta Plugin saluran bawaan lainnya.

Untuk agent, tools, runtime Gateway, dan kunci tingkat atas lainnya, lihat
[Referensi konfigurasi](/id/gateway/configuration-reference).

## Saluran

Setiap saluran dimulai otomatis saat bagian konfigurasinya ada (kecuali `enabled: false`).

### Akses DM dan grup

Semua saluran mendukung kebijakan DM dan kebijakan grup:

| Kebijakan DM        | Perilaku                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | Pengirim tidak dikenal mendapat kode pairing sekali pakai; owner harus menyetujui |
| `allowlist`         | Hanya pengirim dalam `allowFrom` (atau penyimpanan allow pasangan) |
| `open`              | Izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)          |
| `disabled`          | Abaikan semua DM masuk                                          |

| Kebijakan grup        | Perilaku                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | Hanya grup yang cocok dengan allowlist yang dikonfigurasi |
| `open`                | Lewati allowlist grup (pembatasan mention tetap berlaku) |
| `disabled`            | Blokir semua pesan grup/ruang                          |

<Note>
`channels.defaults.groupPolicy` menetapkan default saat `groupPolicy` milik provider belum diatur.
Kode pairing kedaluwarsa setelah 1 jam. Permintaan pairing DM tertunda dibatasi hingga **3 per saluran**.
Jika blok provider sepenuhnya hilang (`channels.<provider>` tidak ada), kebijakan grup runtime kembali ke `allowlist` (fail-closed) dengan peringatan saat startup.
</Note>

### Override model saluran

Gunakan `channels.modelByChannel` untuk mengunci ID saluran tertentu atau peer pesan langsung ke suatu model. Nilai menerima `provider/model` atau alias model yang dikonfigurasi. Pemetaan saluran berlaku saat sesi belum memiliki override model (misalnya, diatur melalui `/model`).

Untuk percakapan grup/thread, kunci adalah ID grup khusus saluran, ID topik, atau nama saluran. Untuk percakapan pesan langsung (DM), kunci adalah pengenal peer yang diturunkan dari identitas pengirim saluran (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From`, atau `SenderId`). Bentuk kunci persisnya bergantung pada saluran:

| Saluran  | Bentuk kunci DM     | Contoh                                       |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ID pengguna mentah  | `123456789`                                  |
| Discord  | ID pengguna mentah  | `987654321`                                  |
| WhatsApp | nomor telepon atau JID | `15551234567`                             |
| Matrix   | ID pengguna Matrix  | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

Kunci khusus DM hanya cocok dalam percakapan pesan langsung; kunci tersebut tidak memengaruhi routing grup/thread.

### Default saluran dan Heartbeat

Gunakan `channels.defaults` untuk perilaku kebijakan grup dan Heartbeat bersama di seluruh provider:

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

- `channels.defaults.groupPolicy`: kebijakan grup fallback saat `groupPolicy` tingkat provider belum diatur.
- `channels.defaults.contextVisibility`: mode visibilitas konteks tambahan default untuk semua saluran. Nilai: `all` (default, sertakan semua konteks kutipan/thread/riwayat), `allowlist` (hanya sertakan konteks dari pengirim yang di-allowlist), `allowlist_quote` (sama seperti allowlist tetapi pertahankan konteks kutipan/balasan eksplisit). Override per saluran: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sertakan status saluran yang sehat dalam output Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: sertakan status terdegradasi/error dalam output Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: render output Heartbeat bergaya indikator ringkas.

### WhatsApp

WhatsApp berjalan melalui saluran web Gateway (Baileys Web). Ini dimulai otomatis saat sesi tertaut ada.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk DM dan grup WhatsApp. Gunakan nomor langsung E.164 atau JID grup WhatsApp di `match.peer.id`. Semantik field dibagikan di [Agent ACP](/id/tools/acp-agents#persistent-channel-bindings).

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

- Perintah outbound menggunakan akun `default` secara default jika ada; jika tidak, id akun pertama yang dikonfigurasi (diurutkan).
- `channels.whatsapp.defaultAccount` opsional meng-override pemilihan akun default fallback tersebut saat cocok dengan id akun yang dikonfigurasi.
- Direktori auth Baileys akun tunggal legacy dimigrasikan oleh `openclaw doctor` ke `whatsapp/default`.
- Override per akun: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
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
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bot: `channels.telegram.botToken` atau `channels.telegram.tokenFile` (hanya file reguler; symlink ditolak), dengan `TELEGRAM_BOT_TOKEN` sebagai fallback untuk akun default.
- `apiRoot` hanya root Telegram Bot API. Gunakan `https://api.telegram.org` atau root self-hosted/proxy Anda, bukan `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` menghapus sufiks `/bot<TOKEN>` yang tidak sengaja tertinggal.
- `channels.telegram.defaultAccount` opsional meng-override pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Dalam setup multi-akun (2+ id akun), tetapkan default eksplisit (`channels.telegram.defaultAccount` atau `channels.telegram.accounts.default`) untuk menghindari routing fallback; `openclaw doctor` memperingatkan saat ini hilang atau tidak valid.
- `configWrites: false` memblokir penulisan konfigurasi yang diinisiasi Telegram (migrasi ID supergroup, `/config set|unset`).
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk topik forum (gunakan `chatId:topic:topicId` kanonis di `match.peer.id`). Semantik field dibagikan di [Agent ACP](/id/tools/acp-agents#persistent-channel-bindings).
- Pratinjau stream Telegram menggunakan `sendMessage` + `editMessageText` (berfungsi di chat langsung dan grup).
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
        },
      },
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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
- Panggilan keluar langsung yang menyediakan Discord `token` eksplisit menggunakan token tersebut untuk panggilan; pengaturan percobaan ulang/kebijakan akun tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
- `channels.discord.defaultAccount` opsional mengganti pilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Gunakan `user:<id>` (DM) atau `channel:<id>` (kanal guild) untuk target pengiriman; ID numerik polos ditolak.
- Slug guild berupa huruf kecil dengan spasi diganti `-`; kunci kanal menggunakan nama yang sudah dibuat slug (tanpa `#`). Utamakan ID guild.
- Pesan yang dibuat bot diabaikan secara default. `allowBots: true` mengaktifkannya; gunakan `allowBots: "mentions"` untuk hanya menerima pesan bot yang menyebut bot (pesan sendiri tetap difilter).
- Kanal yang mendukung pesan masuk buatan bot dapat menggunakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Tetapkan `channels.defaults.botLoopProtection` untuk anggaran pasangan dasar, lalu timpa kanal atau akun hanya saat satu permukaan membutuhkan batas berbeda.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (dan override kanal) membuang pesan yang menyebut pengguna atau peran lain tetapi bukan bot (mengecualikan @everyone/@here).
- `channels.discord.mentionAliases` memetakan teks keluar `@handle` yang stabil ke ID pengguna Discord sebelum pengiriman, sehingga rekan tim yang dikenal dapat disebut secara deterministik bahkan saat cache direktori sementara kosong. Override per akun berada di `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (default 17) memecah pesan yang tinggi bahkan saat di bawah 2000 karakter.
- `channels.discord.suppressEmbeds` default ke `true`, sehingga URL keluar tidak diperluas menjadi pratinjau tautan Discord kecuali dinonaktifkan. Payload `embeds` eksplisit tetap dikirim seperti biasa; pemanggilan alat per pesan dapat mengganti dengan `suppressEmbeds`.
- `channels.discord.threadBindings` mengontrol routing terikat thread Discord:
  - `enabled`: override Discord untuk fitur sesi terikat thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan pengiriman/routing terikat)
  - `idleHours`: override Discord untuk auto-unfocus karena tidak aktif dalam jam (`0` menonaktifkan)
  - `maxAgeHours`: override Discord untuk batas usia maksimum keras dalam jam (`0` menonaktifkan)
  - `spawnSessions`: sakelar untuk `sessions_spawn({ thread: true })` dan pembuatan/pengikatan thread otomatis ACP thread-spawn (default: `true`)
  - `defaultSpawnContext`: konteks subagen native untuk spawn terikat thread (`"fork"` secara default)
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk kanal dan thread (gunakan id kanal/thread di `match.peer.id`). Semantik bidang dibagikan di [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` menetapkan warna aksen untuk kontainer komponen Discord v2.
- `channels.discord.agentComponents.ttlMs` mengontrol berapa lama callback komponen Discord yang dikirim tetap terdaftar. Defaultnya `1800000` (30 menit), maksimumnya `86400000` (24 jam), dan override per akun berada di `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Nilai yang lebih panjang membuat tombol/pilihan/formulir lama dapat digunakan lebih lama, jadi utamakan TTL tersingkat yang sesuai dengan alur kerja.
- `channels.discord.voice` mengaktifkan percakapan kanal suara Discord serta override auto-join + LLM + TTS opsional. Konfigurasi Discord teks-saja menonaktifkan suara secara default; tetapkan `channels.discord.voice.enabled=true` untuk ikut serta.
- `channels.discord.voice.model` secara opsional mengganti model LLM yang digunakan untuk respons kanal suara Discord.
- `channels.discord.voice.daveEncryption` dan `channels.discord.voice.decryptionFailureTolerance` diteruskan ke opsi DAVE `@discordjs/voice` (`true` dan `24` secara default).
- `channels.discord.voice.connectTimeoutMs` mengontrol penantian Ready awal `@discordjs/voice` untuk `/vc join` dan upaya auto-join (`30000` secara default).
- `channels.discord.voice.reconnectGraceMs` mengontrol berapa lama sesi suara yang terputus boleh memasuki sinyal reconnect sebelum OpenClaw menghancurkannya (`15000` secara default).
- Pemutaran suara Discord tidak diinterupsi oleh peristiwa speaking-start pengguna lain. Untuk menghindari loop umpan balik, OpenClaw mengabaikan tangkapan suara baru saat TTS sedang diputar.
- OpenClaw juga mencoba pemulihan penerimaan suara dengan meninggalkan/bergabung kembali ke sesi suara setelah kegagalan dekripsi berulang.
- `channels.discord.streaming` adalah kunci mode stream kanonis. Discord default ke `streaming.mode: "progress"` sehingga progres alat/kerja muncul dalam satu pesan pratinjau yang diedit; tetapkan `streaming.mode: "off"` untuk menonaktifkannya. Nilai legacy `streamMode` dan boolean `streaming` tetap menjadi alias runtime; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi yang tersimpan.
- `channels.discord.autoPresence` memetakan ketersediaan runtime ke presence bot (healthy => online, degraded => idle, exhausted => dnd) dan mengizinkan override teks status opsional.
- `channels.discord.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan nama/tag yang dapat berubah (mode kompatibilitas darurat).
- `channels.discord.execApprovals`: pengiriman persetujuan exec native Discord dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode otomatis, persetujuan exec aktif saat pemberi persetujuan dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Discord yang diizinkan menyetujui permintaan exec. Fallback ke `commands.ownerAllowFrom` saat dihilangkan.
  - `agentFilter`: allowlist ID agen opsional. Hilangkan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default) mengirim ke DM pemberi persetujuan, `"channel"` mengirim ke kanal asal, `"both"` mengirim ke keduanya. Saat target menyertakan `"channel"`, tombol hanya dapat digunakan oleh pemberi persetujuan yang di-resolve.
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

- JSON akun layanan: inline (`serviceAccount`) atau berbasis file (`serviceAccountFile`).
- SecretRef akun layanan juga didukung (`serviceAccountRef`).
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
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
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
      unfurlLinks: false,
      unfurlMedia: false,
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
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

- **Mode socket** memerlukan `botToken` dan `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` untuk fallback env akun default).
- **Mode HTTP** memerlukan `botToken` plus `signingSecret` (di root atau per akun).
- `socketMode` meneruskan penyesuaian transport Socket Mode Slack SDK ke API receiver Bolt publik. Gunakan hanya saat menyelidiki timeout ping/pong atau perilaku websocket usang. `clientPingTimeout` default-nya `15000`; `serverPingTimeout` dan `pingPongLoggingEnabled` hanya diteruskan jika dikonfigurasi.
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string teks biasa
  atau objek SecretRef.
- Snapshot akun Slack mengekspos field sumber/status per kredensial seperti
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, dan, dalam mode HTTP,
  `signingSecretStatus`. `configured_unavailable` berarti akun
  dikonfigurasi melalui SecretRef tetapi path perintah/runtime saat ini tidak dapat
  menyelesaikan nilai rahasia.
- `configWrites: false` memblokir penulisan konfigurasi yang dimulai Slack.
- `channels.slack.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- `channels.slack.streaming.mode` adalah kunci mode stream Slack kanonis. `channels.slack.streaming.nativeTransport` mengontrol transport streaming native Slack. Nilai lama `streamMode`, boolean `streaming`, dan `nativeStreaming` tetap menjadi alias runtime; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi yang tersimpan.
- `unfurlLinks` dan `unfurlMedia` meneruskan boolean unfurl tautan dan media `chat.postMessage` Slack untuk balasan bot. Default `unfurlLinks` adalah `false` sehingga tautan bot keluar tidak diperluas secara inline kecuali diaktifkan; `unfurlMedia` dihilangkan kecuali dikonfigurasi. Atur salah satu nilai di `channels.slack.accounts.<accountId>` untuk menimpa nilai tingkat atas untuk satu akun.
- Gunakan `user:<id>` (DM) atau `channel:<id>` untuk target pengiriman.

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

**Isolasi sesi thread:** `thread.historyScope` bersifat per-thread (default) atau dibagikan di seluruh saluran. `thread.inheritParent` menyalin transkrip saluran induk ke thread baru.

- Streaming native Slack plus status thread "sedang mengetik..." bergaya asisten Slack memerlukan target thread balasan. DM tingkat atas tetap di luar thread secara default, sehingga masih dapat melakukan streaming melalui pratinjau draft post-and-edit Slack alih-alih menampilkan pratinjau stream/status native bergaya thread.
- `typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat balasan berjalan, lalu menghapusnya saat selesai. Gunakan shortcode emoji Slack seperti `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: pengiriman klien persetujuan native Slack dan otorisasi pemberi persetujuan exec. Skema yang sama seperti Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID pengguna Slack), `agentFilter`, `sessionFilter`, dan `target` (`"dm"`, `"channel"`, atau `"both"`). Persetujuan Plugin dapat menggunakan path klien native ini untuk permintaan asal Slack saat pemberi persetujuan plugin Slack terselesaikan; pengiriman persetujuan Plugin native Slack juga dapat diaktifkan melalui `approvals.plugin` untuk sesi asal Slack atau target Slack. Persetujuan Plugin menggunakan pemberi persetujuan plugin Slack dari `allowFrom` dan routing default, bukan pemberi persetujuan exec.

| Grup tindakan | Default | Catatan                  |
| ------------ | ------- | ---------------------- |
| reactions    | diaktifkan | Bereaksi + daftar reaksi |
| messages     | diaktifkan | Baca/kirim/edit/hapus  |
| pins         | diaktifkan | Pin/lepas pin/daftar         |
| memberInfo   | diaktifkan | Info anggota            |
| emojiList    | diaktifkan | Daftar emoji kustom      |

### Mattermost

Mattermost dikirim sebagai plugin bundel dalam rilis OpenClaw saat ini. Build lama atau
kustom dapat memasang paket npm saat ini dengan
`openclaw plugins install @openclaw/mattermost`. Periksa
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
untuk dist-tags saat ini sebelum menyematkan versi.

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
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Mode chat: `oncall` (merespons pada @-mention, default), `onmessage` (setiap pesan), `onchar` (pesan yang dimulai dengan prefiks pemicu).

Saat perintah native Mattermost diaktifkan:

- `commands.callbackPath` harus berupa path (misalnya `/api/channels/mattermost/command`), bukan URL lengkap.
- `commands.callbackUrl` harus mengarah ke endpoint gateway OpenClaw dan dapat dijangkau dari server Mattermost.
- Callback slash native diautentikasi dengan token per perintah yang dikembalikan
  oleh Mattermost selama pendaftaran perintah slash. Jika pendaftaran gagal atau tidak ada
  perintah yang diaktifkan, OpenClaw menolak callback dengan
  `Unauthorized: invalid command token.`
- Untuk host callback privat/tailnet/internal, Mattermost mungkin memerlukan
  `ServiceSettings.AllowedUntrustedInternalConnections` untuk menyertakan host/domain callback.
  Gunakan nilai host/domain, bukan URL lengkap.
- `channels.mattermost.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai Mattermost.
- `channels.mattermost.requireMention`: wajibkan `@mention` sebelum membalas di saluran.
- `channels.mattermost.groups.<channelId>.requireMention`: penimpaan mention-gating per saluran (`"*"` untuk default).
- `channels.mattermost.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
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

- `channels.signal.account`: pin startup saluran ke identitas akun Signal tertentu.
- `channels.signal.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai Signal.
- `channels.signal.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

### iMessage

OpenClaw menjalankan `imsg rpc` (JSON-RPC melalui stdio). Tidak diperlukan daemon atau port. Ini adalah path yang disukai untuk setup iMessage OpenClaw baru saat host dapat memberikan izin database Messages dan Automation.

Dukungan BlueBubbles telah dihapus. `channels.bluebubbles` bukan permukaan konfigurasi runtime yang didukung pada OpenClaw saat ini. Migrasikan konfigurasi lama ke `channels.imessage`; gunakan [Penghapusan BlueBubbles dan path imsg iMessage](/id/announcements/bluebubbles-imessage) untuk versi singkat dan [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) untuk tabel terjemahan lengkap.

Jika Gateway tidak berjalan di Mac Messages yang sedang masuk, pertahankan `channels.imessage.enabled=true` dan atur `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg "$@"` di Mac tersebut. Path `imsg` lokal default hanya untuk macOS.

Sebelum mengandalkan wrapper SSH untuk pengiriman produksi, verifikasi `imsg send` keluar melalui wrapper yang persis itu. Beberapa status TCC macOS menetapkan Automation Messages ke `/usr/libexec/sshd-keygen-wrapper`, yang dapat membuat pembacaan dan probe berfungsi sementara pengiriman gagal dengan AppleEvents `-1743`; lihat [Pengiriman wrapper SSH gagal dengan AppleEvents -1743](/id/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- `channels.imessage.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

- Memerlukan Full Disk Access ke DB Messages.
- Utamakan target `chat_id:<id>`. Gunakan `imsg chats --limit 20` untuk mencantumkan chat.
- `cliPath` dapat menunjuk ke wrapper SSH; atur `remoteHost` (`host` atau `user@host`) untuk mengambil lampiran dengan SCP.
- `attachmentRoots` dan `remoteAttachmentRoots` membatasi path lampiran masuk (default: `/Users/*/Library/Messages/Attachments`).
- SCP menggunakan pemeriksaan host-key ketat, jadi pastikan kunci host relay sudah ada di `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai iMessage.
- `channels.imessage.sendTransport`: transport pengiriman RPC `imsg` yang disukai untuk balasan keluar normal. `auto` (default) menggunakan bridge IMCore untuk chat yang sudah ada saat sedang berjalan, lalu fallback ke AppleScript; `bridge` memerlukan pengiriman private-API; `applescript` memaksa path automation Messages publik.
- `channels.imessage.actions.*`: aktifkan tindakan API privat yang juga dibatasi oleh `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` nonaktif secara default; atur ke `true` sebelum mengharapkan media masuk dalam giliran agen.
- Pemulihan masuk setelah restart bridge/gateway bersifat otomatis (dedupe GUID plus pembatas usia backlog usang). Konfigurasi `channels.imessage.catchup.enabled: true` yang sudah ada tetap dihormati sebagai profil kompatibilitas yang usang.
- `channels.imessage.groups`: registry grup dan pengaturan per grup. Dengan `groupPolicy: "allowlist"`, konfigurasikan kunci `chat_id` eksplisit atau entri wildcard `"*"` agar pesan grup dapat melewati gerbang registry.
- Entri `bindings[]` tingkat atas dengan `type: "acp"` dapat mengikat percakapan iMessage ke sesi ACP persisten. Gunakan handle yang dinormalisasi atau target chat eksplisit (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik field bersama: [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Contoh wrapper SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix didukung plugin dan dikonfigurasi di bawah `channels.matrix`.

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

- Autentikasi token menggunakan `accessToken`; autentikasi kata sandi menggunakan `userId` + `password`.
- `channels.matrix.proxy` merutekan lalu lintas HTTP Matrix melalui proksi HTTP(S) eksplisit. Akun bernama dapat menimpanya dengan `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` mengizinkan homeserver privat/internal. `proxy` dan pilihan jaringan ini adalah kontrol yang independen.
- `channels.matrix.defaultAccount` memilih akun yang diutamakan dalam penyiapan multi-akun.
- `channels.matrix.autoJoin` default ke `off`, jadi ruangan undangan dan undangan baru bergaya DM diabaikan sampai Anda menetapkan `autoJoin: "allowlist"` dengan `autoJoinAllowlist` atau `autoJoin: "always"`.
- `channels.matrix.execApprovals`: pengiriman persetujuan eksekusi native Matrix dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode otomatis, persetujuan eksekusi aktif ketika pemberi persetujuan dapat diselesaikan dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Matrix (mis. `@owner:example.org`) yang diizinkan menyetujui permintaan eksekusi.
  - `agentFilter`: allowlist ID agen opsional. Hilangkan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default), `"channel"` (ruangan asal), atau `"both"`.
  - Penimpaan per akun: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` mengontrol bagaimana DM Matrix dikelompokkan ke dalam sesi: `per-user` (default) berbagi berdasarkan peer yang dirutekan, sedangkan `per-room` mengisolasi setiap ruangan DM.
- Probe status Matrix dan pencarian direktori langsung menggunakan kebijakan proksi yang sama dengan lalu lintas runtime.
- Konfigurasi Matrix lengkap, aturan penargetan, dan contoh penyiapan didokumentasikan di [Matrix](/id/channels/matrix).

### Microsoft Teams

Microsoft Teams didukung Plugin dan dikonfigurasi di bawah `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Jalur kunci inti yang dicakup di sini: `channels.msteams`, `channels.msteams.configWrites`.
- Konfigurasi Teams lengkap (kredensial, webhook, kebijakan DM/grup, penimpaan per-tim/per-channel) didokumentasikan di [Microsoft Teams](/id/channels/msteams).

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

- Jalur kunci inti yang dicakup di sini: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` opsional menimpa pemilihan akun default ketika cocok dengan id akun yang dikonfigurasi.
- Konfigurasi channel IRC lengkap (host/port/TLS/channel/allowlist/gating penyebutan) didokumentasikan di [IRC](/id/channels/irc).

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

- `default` digunakan ketika `accountId` dihilangkan (CLI + perutean).
- Token env hanya berlaku untuk akun **default**.
- Pengaturan channel dasar berlaku untuk semua akun kecuali ditimpa per akun.
- Gunakan `bindings[].match.accountId` untuk merutekan setiap akun ke agen yang berbeda.
- Jika Anda menambahkan akun non-default melalui `openclaw channels add` (atau onboarding channel) saat masih menggunakan konfigurasi channel tingkat atas akun tunggal, OpenClaw terlebih dahulu mempromosikan nilai akun tunggal tingkat atas yang bercakupan akun ke peta akun channel sehingga akun asli tetap berfungsi. Sebagian besar channel memindahkannya ke `channels.<channel>.accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada sebagai gantinya.
- Binding khusus channel yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default; binding bercakupan akun tetap opsional.
- `openclaw doctor --fix` juga memperbaiki bentuk campuran dengan memindahkan nilai akun tunggal tingkat atas yang bercakupan akun ke akun yang dipromosikan yang dipilih untuk channel tersebut. Sebagian besar channel menggunakan `accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada sebagai gantinya.

### Channel Plugin lainnya

Banyak channel Plugin dikonfigurasi sebagai `channels.<id>` dan didokumentasikan di halaman channel khusus masing-masing (misalnya Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, dan Twitch).
Lihat indeks channel lengkap: [Channel](/id/channels).

### Gating penyebutan obrolan grup

Pesan grup default ke **wajib menyebut** (penyebutan metadata atau pola regex aman). Berlaku untuk obrolan grup WhatsApp, Telegram, Discord, Google Chat, dan iMessage.

Balasan terlihat dikontrol secara terpisah. Permintaan langsung grup normal, channel, dan WebChat internal default ke pengiriman final otomatis: teks asisten final diposting melalui jalur balasan terlihat lama. Pilih `messages.visibleReplies: "message_tool"` atau `messages.groupChat.visibleReplies: "message_tool"` ketika keluaran terlihat hanya boleh diposting setelah agen memanggil `message(action=send)`. Jika model mengembalikan teks final tanpa memanggil alat pesan dalam mode khusus-alat yang dipilih, teks final itu tetap privat dan log verbose gateway mencatat metadata payload yang disupresi.

Balasan terlihat khusus-alat memerlukan model/runtime yang andal memanggil alat, dan direkomendasikan untuk ruangan ambient bersama pada model generasi terbaru seperti GPT 5.5. Beberapa model yang lebih lemah dapat menjawab teks final tetapi gagal memahami bahwa keluaran yang terlihat sumber harus dikirim dengan `message(action=send)`. Untuk model tersebut, gunakan `"automatic"` sehingga giliran asisten final menjadi jalur balasan terlihat. Jika log sesi menampilkan teks asisten dengan `didSendViaMessagingTool: false`, model menghasilkan teks final privat alih-alih memanggil alat pesan. Beralihlah ke model pemanggil alat yang lebih kuat untuk channel tersebut, periksa log verbose gateway untuk ringkasan payload yang disupresi, atau tetapkan `messages.groupChat.visibleReplies: "automatic"` untuk menggunakan balasan final terlihat bagi setiap permintaan grup/channel.

Jika alat pesan tidak tersedia di bawah kebijakan alat aktif, OpenClaw kembali ke balasan terlihat otomatis alih-alih menyupresi respons secara diam-diam. `openclaw doctor` memperingatkan tentang ketidakcocokan ini.

Aturan ini berlaku untuk teks final agen normal. Binding percakapan milik Plugin menggunakan balasan yang dikembalikan Plugin pemilik sebagai respons terlihat untuk giliran thread-terikat yang diklaim; Plugin tidak perlu memanggil `message(action=send)` untuk balasan binding tersebut.

**Pemecahan masalah: @mention grup memicu pengetikan lalu diam (tanpa error)**

Gejala: @mention grup/channel menampilkan indikator mengetik dan log gateway melaporkan `dispatch complete (queuedFinal=false, replies=0)`, tetapi tidak ada pesan yang masuk ke ruangan. DM ke agen yang sama membalas normal.

Penyebab: mode balasan terlihat grup/channel diselesaikan menjadi `"message_tool"`, sehingga OpenClaw menjalankan giliran tetapi menyupresi teks asisten final kecuali agen memanggil `message(action=send)`. Tidak ada kontrak `NO_REPLY` dalam mode ini; tidak ada panggilan alat pesan berarti tidak ada balasan sumber. Tidak ada error karena supresi adalah perilaku yang dikonfigurasi. Giliran grup dan channel normal default ke `"automatic"`, jadi gejala ini hanya muncul ketika `messages.groupChat.visibleReplies` (atau `messages.visibleReplies` global) secara eksplisit ditetapkan ke `"message_tool"`. Harness `defaultVisibleReplies` tidak berlaku di sini — resolver grup/channel mengabaikannya; itu hanya memengaruhi obrolan langsung/sumber (harness Codex menyupresi final obrolan langsung dengan cara itu).

Perbaikan: pilih model pemanggil alat yang lebih kuat, hapus penimpaan eksplisit `"message_tool"` untuk kembali ke default `"automatic"`, atau tetapkan `messages.groupChat.visibleReplies: "automatic"` untuk memaksa balasan terlihat bagi setiap permintaan grup/channel. Gateway memuat ulang konfigurasi `messages` secara hot reload setelah file disimpan; hanya mulai ulang gateway ketika pengawasan file atau muat ulang konfigurasi dinonaktifkan dalam deployment.

**Jenis penyebutan:**

- **Penyebutan metadata**: @-mention platform native. Diabaikan dalam mode obrolan mandiri WhatsApp.
- **Pola teks**: Pola regex aman di `agents.list[].groupChat.mentionPatterns`. Pola tidak valid dan pengulangan bersarang yang tidak aman diabaikan.
- Gating penyebutan diberlakukan hanya ketika deteksi memungkinkan (penyebutan native atau setidaknya satu pola).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` menetapkan default global. Channel dapat menimpa dengan `channels.<channel>.historyLimit` (atau per-akun). Tetapkan `0` untuk menonaktifkan.

`messages.groupChat.unmentionedInbound: "room_event"` mengirimkan pesan grup/channel always-on yang tidak menyebut sebagai konteks ruangan senyap pada channel yang didukung. Pesan yang menyebut, perintah, dan pesan langsung tetap menjadi permintaan pengguna. Lihat [Peristiwa ruangan ambient](/id/channels/ambient-room-events) untuk contoh lengkap Discord, Slack, dan Telegram.

`messages.visibleReplies` adalah default peristiwa sumber global; `messages.groupChat.visibleReplies` menimpanya untuk peristiwa sumber grup/channel. Ketika `messages.visibleReplies` tidak disetel, obrolan langsung/sumber menggunakan default runtime atau harness yang dipilih, tetapi giliran langsung WebChat internal menggunakan pengiriman final otomatis untuk paritas prompt Pi/Codex. Tetapkan `messages.visibleReplies: "message_tool"` untuk secara sengaja mewajibkan `message(action=send)` bagi keluaran terlihat. Allowlist channel dan gating penyebutan tetap menentukan apakah suatu peristiwa diproses.

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

Resolusi: penimpaan per-DM → default penyedia → tanpa batas (semua dipertahankan).

Didukung: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Mode obrolan mandiri

Sertakan nomor Anda sendiri di `allowFrom` untuk mengaktifkan mode obrolan mandiri (mengabaikan @-mention native, hanya merespons pola teks):

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
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
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

- Blok ini mengonfigurasi permukaan perintah. Untuk katalog perintah bawaan + terpaket saat ini, lihat [Perintah Slash](/id/tools/slash-commands).
- Halaman ini adalah **referensi kunci konfigurasi**, bukan katalog perintah lengkap. Perintah milik channel/Plugin seperti QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, pemasangan perangkat `/pair`, memori `/dreaming`, kontrol ponsel `/phone`, dan Talk `/voice` didokumentasikan di halaman channel/Plugin masing-masing serta [Perintah Slash](/id/tools/slash-commands).
- Perintah teks harus berupa pesan **mandiri** dengan awalan `/`.
- `native: "auto"` mengaktifkan perintah asli untuk Discord/Telegram, membiarkan Slack nonaktif.
- `nativeSkills: "auto"` mengaktifkan perintah Skills asli untuk Discord/Telegram, membiarkan Slack nonaktif.
- Timpa per channel: `channels.discord.commands.native` (bool atau `"auto"`). Untuk Discord, `false` melewati pendaftaran dan pembersihan perintah asli saat startup.
- Timpa pendaftaran Skills asli per channel dengan `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` menambahkan entri menu bot Telegram tambahan.
- `bash: true` mengaktifkan `! <cmd>` untuk shell host. Memerlukan `tools.elevated.enabled` dan pengirim di `tools.elevated.allowFrom.<channel>`.
- `config: true` mengaktifkan `/config` (membaca/menulis `openclaw.json`). Untuk klien Gateway `chat.send`, penulisan persisten `/config set|unset` juga memerlukan `operator.admin`; `/config show` yang hanya-baca tetap tersedia untuk klien operator normal dengan cakupan tulis.
- `mcp: true` mengaktifkan `/mcp` untuk konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`.
- `plugins: true` mengaktifkan `/plugins` untuk penemuan, pemasangan, dan kontrol aktifkan/nonaktifkan Plugin.
- `channels.<provider>.configWrites` membatasi mutasi konfigurasi per channel (bawaan: true).
- Untuk channel multi-akun, `channels.<provider>.accounts.<id>.configWrites` juga membatasi penulisan yang menargetkan akun tersebut (misalnya `/allowlist --config --account <id>` atau `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` menonaktifkan `/restart` dan aksi alat restart Gateway. Bawaan: `true`.
- `ownerAllowFrom` adalah daftar izin pemilik eksplisit untuk perintah khusus pemilik dan aksi channel yang dibatasi pemilik. Ini terpisah dari `allowFrom`.
- `ownerDisplay: "hash"` melakukan hash pada id pemilik di prompt sistem. Atur `ownerDisplaySecret` untuk mengontrol hashing.
- `allowFrom` bersifat per-provider. Saat diatur, ini adalah **satu-satunya** sumber otorisasi (daftar izin/pemasangan channel dan `useAccessGroups` diabaikan).
- `useAccessGroups: false` mengizinkan perintah melewati kebijakan grup akses saat `allowFrom` tidak diatur.
- Peta dokumentasi perintah:
  - katalog bawaan + terpaket: [Perintah Slash](/id/tools/slash-commands)
  - permukaan perintah khusus channel: [Channel](/id/channels)
  - perintah QQ Bot: [QQ Bot](/id/channels/qqbot)
  - perintah pemasangan: [Pemasangan](/id/channels/pairing)
  - perintah kartu LINE: [LINE](/id/channels/line)
  - dreaming memori: [Dreaming](/id/concepts/dreaming)

</Accordion>

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — kunci tingkat atas
- [Konfigurasi — agen](/id/gateway/config-agents)
- [Ikhtisar channel](/id/channels)
