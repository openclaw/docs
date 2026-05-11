---
read_when:
    - Mengonfigurasi Plugin kanal (autentikasi, kontrol akses, multi-akun)
    - Pemecahan masalah kunci konfigurasi per channel
    - Mengaudit kebijakan DM, kebijakan grup, atau pembatasan penyebutan
summary: 'Konfigurasi saluran: kontrol akses, penyandingan, kunci per saluran di Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan lainnya'
title: Konfigurasi — saluran
x-i18n:
    generated_at: "2026-05-11T20:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

Per-channel kunci konfigurasi di bawah `channels.*`. Mencakup akses DM dan grup,
penyiapan multi-akun, gating mention, dan kunci per kanal untuk Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage, serta Plugin kanal bawaan lainnya.

Untuk agen, alat, runtime Gateway, dan kunci tingkat atas lainnya, lihat
[Referensi konfigurasi](/id/gateway/configuration-reference).

## Kanal

Setiap kanal dimulai otomatis ketika bagian konfigurasinya ada (kecuali `enabled: false`).

### Akses DM dan grup

Semua kanal mendukung kebijakan DM dan kebijakan grup:

| Kebijakan DM        | Perilaku                                                       |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (default) | Pengirim tidak dikenal mendapat kode pairing sekali pakai; pemilik harus menyetujui |
| `allowlist`         | Hanya pengirim dalam `allowFrom` (atau penyimpanan izin yang sudah dipairing) |
| `open`              | Izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)         |
| `disabled`          | Abaikan semua DM masuk                                         |

| Kebijakan grup        | Perilaku                                             |
| --------------------- | ---------------------------------------------------- |
| `allowlist` (default) | Hanya grup yang cocok dengan daftar izin yang dikonfigurasi |
| `open`                | Lewati daftar izin grup (gating mention tetap berlaku) |
| `disabled`            | Blokir semua pesan grup/room                         |

<Note>
`channels.defaults.groupPolicy` menetapkan default ketika `groupPolicy` milik penyedia tidak diatur.
Kode pairing kedaluwarsa setelah 1 jam. Permintaan pairing DM yang tertunda dibatasi **3 per kanal**.
Jika blok penyedia tidak ada sama sekali (`channels.<provider>` tidak ada), kebijakan grup runtime kembali ke `allowlist` (fail-closed) dengan peringatan saat startup.
</Note>

### Override model kanal

Gunakan `channels.modelByChannel` untuk menyematkan ID kanal tertentu ke sebuah model. Nilai menerima `provider/model` atau alias model yang dikonfigurasi. Pemetaan kanal berlaku ketika sebuah sesi belum memiliki override model (misalnya, diatur melalui `/model`).

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

### Default kanal dan Heartbeat

Gunakan `channels.defaults` untuk kebijakan grup bersama dan perilaku Heartbeat lintas penyedia:

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

- `channels.defaults.groupPolicy`: kebijakan grup fallback ketika `groupPolicy` tingkat penyedia tidak diatur.
- `channels.defaults.contextVisibility`: mode visibilitas konteks tambahan default untuk semua kanal. Nilai: `all` (default, sertakan semua konteks kutipan/thread/riwayat), `allowlist` (hanya sertakan konteks dari pengirim yang diizinkan), `allowlist_quote` (sama seperti allowlist tetapi pertahankan konteks kutipan/balasan eksplisit). Override per kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sertakan status kanal sehat dalam output Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: sertakan status terdegradasi/error dalam output Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: render output Heartbeat ringkas bergaya indikator.

### WhatsApp

WhatsApp berjalan melalui kanal web Gateway (Baileys Web). Ini dimulai otomatis ketika sesi tertaut ada.

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

<Accordion title="WhatsApp Multi-akun">

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

- Perintah keluar menggunakan akun `default` secara default jika ada; jika tidak, ID akun pertama yang dikonfigurasi (diurutkan).
- Opsional `channels.whatsapp.defaultAccount` meng-override pilihan akun default fallback tersebut ketika cocok dengan ID akun yang dikonfigurasi.
- Direktori auth Baileys akun tunggal lama dimigrasikan oleh `openclaw doctor` ke `whatsapp/default`.
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
- `apiRoot` hanya root Telegram Bot API. Gunakan `https://api.telegram.org` atau root self-hosted/proxy Anda, bukan `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` menghapus akhiran `/bot<TOKEN>` yang tidak sengaja tertinggal.
- Opsional `channels.telegram.defaultAccount` meng-override pilihan akun default ketika cocok dengan ID akun yang dikonfigurasi.
- Dalam penyiapan multi-akun (2+ ID akun), tetapkan default eksplisit (`channels.telegram.defaultAccount` atau `channels.telegram.accounts.default`) untuk menghindari routing fallback; `openclaw doctor` memperingatkan ketika ini hilang atau tidak valid.
- `configWrites: false` memblokir penulisan konfigurasi yang dimulai Telegram (migrasi ID supergroup, `/config set|unset`).
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk topik forum (gunakan `chatId:topic:topicId` kanonis dalam `match.peer.id`). Semantik field dibagikan di [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).
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
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
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
- Panggilan keluar langsung yang menyediakan Discord `token` eksplisit menggunakan token tersebut untuk panggilan itu; pengaturan percobaan ulang/kebijakan akun tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
- `channels.discord.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Gunakan `user:<id>` (DM) atau `channel:<id>` (saluran guild) untuk target pengiriman; ID numerik polos ditolak.
- Slug guild menggunakan huruf kecil dengan spasi diganti `-`; kunci saluran menggunakan nama yang sudah dijadikan slug (tanpa `#`). Sebaiknya gunakan ID guild.
- Pesan yang ditulis bot diabaikan secara default. `allowBots: true` mengaktifkannya; gunakan `allowBots: "mentions"` untuk hanya menerima pesan bot yang menyebut bot tersebut (pesan sendiri tetap difilter).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (dan penimpaan saluran) membuang pesan yang menyebut pengguna atau peran lain tetapi bukan bot tersebut (tidak termasuk @everyone/@here).
- `channels.discord.mentionAliases` memetakan teks `@handle` keluar yang stabil ke ID pengguna Discord sebelum dikirim, sehingga rekan tim yang dikenal dapat disebut secara deterministik bahkan saat cache direktori sementara kosong. Penimpaan per akun berada di bawah `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (default 17) membagi pesan tinggi meskipun kurang dari 2000 karakter.
- `channels.discord.threadBindings` mengontrol perutean terikat thread Discord:
  - `enabled`: penimpaan Discord untuk fitur sesi terikat thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, serta pengiriman/perutean terikat)
  - `idleHours`: penimpaan Discord untuk auto-unfocus karena tidak aktif dalam jam (`0` menonaktifkan)
  - `maxAgeHours`: penimpaan Discord untuk usia maksimum keras dalam jam (`0` menonaktifkan)
  - `spawnSessions`: sakelar untuk `sessions_spawn({ thread: true })` dan pembuatan/pengikatan thread otomatis dari ACP thread-spawn (default: `true`)
  - `defaultSpawnContext`: konteks subagen native untuk spawn terikat thread (`"fork"` secara default)
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi pengikatan ACP persisten untuk saluran dan thread (gunakan id saluran/thread di `match.peer.id`). Semantik bidang dibagikan di [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` mengatur warna aksen untuk kontainer Discord components v2.
- `channels.discord.voice` mengaktifkan percakapan saluran suara Discord serta penimpaan auto-join + LLM + TTS opsional. Konfigurasi Discord khusus teks membiarkan suara nonaktif secara default; atur `channels.discord.voice.enabled=true` untuk ikut mengaktifkan.
- `channels.discord.voice.model` secara opsional menimpa model LLM yang digunakan untuk respons saluran suara Discord.
- `channels.discord.voice.daveEncryption` dan `channels.discord.voice.decryptionFailureTolerance` diteruskan ke opsi DAVE `@discordjs/voice` (`true` dan `24` secara default).
- `channels.discord.voice.connectTimeoutMs` mengontrol penantian Ready awal `@discordjs/voice` untuk `/vc join` dan percobaan auto-join (`30000` secara default).
- `channels.discord.voice.reconnectGraceMs` mengontrol berapa lama sesi suara yang terputus boleh memasuki pensinyalan reconnect sebelum OpenClaw menghancurkannya (`15000` secara default).
- Pemutaran suara Discord tidak disela oleh event speaking-start pengguna lain. Untuk menghindari loop umpan balik, OpenClaw mengabaikan tangkapan suara baru saat TTS sedang diputar.
- OpenClaw juga mencoba pemulihan penerimaan suara dengan keluar/bergabung ulang ke sesi suara setelah kegagalan dekripsi berulang.
- `channels.discord.streaming` adalah kunci mode stream kanonis. Discord secara default menggunakan `streaming.mode: "progress"` sehingga progres tool/kerja muncul dalam satu pesan pratinjau yang diedit; atur `streaming.mode: "off"` untuk menonaktifkannya. Nilai legacy `streamMode` dan boolean `streaming` tetap menjadi alias runtime; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi persisten.
- `channels.discord.autoPresence` memetakan ketersediaan runtime ke presence bot (sehat => online, terdegradasi => idle, habis => dnd) dan mengizinkan penimpaan teks status opsional.
- `channels.discord.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan nama/tag yang dapat berubah (mode kompatibilitas break-glass).
- `channels.discord.execApprovals`: pengiriman persetujuan exec native Discord dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, persetujuan exec aktif saat pemberi persetujuan dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Discord yang diizinkan menyetujui permintaan exec. Fallback ke `commands.ownerAllowFrom` saat dihilangkan.
  - `agentFilter`: allowlist ID agen opsional. Hilangkan untuk meneruskan persetujuan untuk semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default) mengirim ke DM pemberi persetujuan, `"channel"` mengirim ke saluran asal, `"both"` mengirim ke keduanya. Saat target mencakup `"channel"`, tombol hanya dapat digunakan oleh pemberi persetujuan yang berhasil di-resolve.
  - `cleanupAfterResolve`: saat `true`, menghapus DM persetujuan setelah disetujui, ditolak, atau timeout.

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
- `channels.googlechat.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan prinsipal email yang dapat berubah (mode kompatibilitas break-glass).

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
- `socketMode` meneruskan penyetelan transport Socket Mode Slack SDK ke API penerima Bolt publik. Gunakan hanya saat menyelidiki timeout ping/pong atau perilaku websocket kedaluwarsa.
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string plaintext atau objek SecretRef.
- Snapshot akun Slack mengekspos bidang sumber/status per kredensial seperti `botTokenSource`, `botTokenStatus`, `appTokenStatus`, dan, dalam mode HTTP, `signingSecretStatus`. `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef tetapi jalur perintah/runtime saat ini tidak dapat me-resolve nilai secret.
- `configWrites: false` memblokir penulisan konfigurasi yang diinisiasi Slack.
- `channels.slack.defaultAccount` opsional menimpa pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- `channels.slack.streaming.mode` adalah kunci mode stream Slack kanonis. `channels.slack.streaming.nativeTransport` mengontrol transport streaming native Slack. Nilai legacy `streamMode`, boolean `streaming`, dan `nativeStreaming` tetap menjadi alias runtime; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi persisten.
- `unfurlLinks` dan `unfurlMedia` meneruskan boolean unfurl tautan dan media `chat.postMessage` Slack untuk balasan bot. Hilangkan untuk mempertahankan perilaku default Slack; atur di `channels.slack.accounts.<accountId>` untuk menimpa default tingkat atas bagi satu akun.
- Gunakan `user:<id>` (DM) atau `channel:<id>` untuk target pengiriman.

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

**Isolasi sesi thread:** `thread.historyScope` bersifat per-thread (default) atau dibagikan di seluruh saluran. `thread.inheritParent` menyalin transkrip saluran induk ke thread baru.

- Streaming native Slack plus status thread "is typing..." bergaya asisten Slack memerlukan target thread balasan. DM tingkat atas tetap berada di luar thread secara default, sehingga masih dapat melakukan streaming melalui pratinjau draf post-and-edit Slack alih-alih menampilkan pratinjau stream/status native bergaya thread.
- `typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat balasan sedang berjalan, lalu menghapusnya saat selesai. Gunakan shortcode emoji Slack seperti `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: pengiriman persetujuan exec native Slack dan otorisasi pemberi persetujuan. Skema sama seperti Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID pengguna Slack), `agentFilter`, `sessionFilter`, dan `target` (`"dm"`, `"channel"`, atau `"both"`).

| Grup aksi | Default | Catatan                  |
| ------------ | ------- | ---------------------- |
| reactions    | aktif | Bereaksi + mencantumkan reaksi |
| messages     | aktif | Baca/kirim/edit/hapus  |
| pins         | aktif | Pin/lepas pin/daftar         |
| memberInfo   | aktif | Info anggota            |
| emojiList    | aktif | Daftar emoji kustom      |

### Mattermost

Mattermost dikirim sebagai Plugin bundel dalam rilis OpenClaw saat ini. Build lama atau kustom dapat menginstal paket npm saat ini dengan `openclaw plugins install @openclaw/mattermost`. Periksa [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) untuk dist-tag saat ini sebelum melakukan pin versi.

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

Mode chat: `oncall` (merespons pada @-mention, default), `onmessage` (setiap pesan), `onchar` (pesan yang diawali prefiks pemicu).

Saat perintah native Mattermost diaktifkan:

- `commands.callbackPath` harus berupa path (misalnya `/api/channels/mattermost/command`), bukan URL lengkap.
- `commands.callbackUrl` harus mengarah ke endpoint Gateway OpenClaw dan dapat dijangkau dari server Mattermost.
- Callback slash native diautentikasi dengan token per perintah yang dikembalikan
  oleh Mattermost selama pendaftaran slash command. Jika pendaftaran gagal atau tidak ada
  perintah yang diaktifkan, OpenClaw menolak callback dengan
  `Unauthorized: invalid command token.`
- Untuk host callback privat/tailnet/internal, Mattermost mungkin mengharuskan
  `ServiceSettings.AllowedUntrustedInternalConnections` menyertakan host/domain callback.
  Gunakan nilai host/domain, bukan URL lengkap.
- `channels.mattermost.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai Mattermost.
- `channels.mattermost.requireMention`: wajibkan `@mention` sebelum membalas di saluran.
- `channels.mattermost.groups.<channelId>.requireMention`: override per saluran untuk gerbang mention (`"*"` untuk default).
- `channels.mattermost.defaultAccount` opsional meng-override pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

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

- `channels.signal.account`: sematkan startup saluran ke identitas akun Signal tertentu.
- `channels.signal.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai Signal.
- `channels.signal.defaultAccount` opsional meng-override pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

### iMessage

OpenClaw menjalankan `imsg rpc` (JSON-RPC melalui stdio). Tidak memerlukan daemon atau port. Ini adalah jalur yang disarankan untuk setup iMessage OpenClaw baru saat host dapat memberikan izin database Messages dan Automation.

Dukungan BlueBubbles telah dihapus. `channels.bluebubbles` bukan permukaan konfigurasi runtime yang didukung pada OpenClaw saat ini. Migrasikan konfigurasi lama ke `channels.imessage`; gunakan [Penghapusan BlueBubbles dan jalur imsg iMessage](/id/announcements/bluebubbles-imessage) untuk versi singkat dan [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) untuk tabel terjemahan lengkap.

Jika Gateway tidak berjalan di Mac Messages yang sudah masuk, pertahankan `channels.imessage.enabled=true` dan atur `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg "$@"` di Mac tersebut. Path lokal default `imsg` hanya untuk macOS.

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- `channels.imessage.defaultAccount` opsional meng-override pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

- Memerlukan Full Disk Access ke DB Messages.
- Utamakan target `chat_id:<id>`. Gunakan `imsg chats --limit 20` untuk mencantumkan chat.
- `cliPath` dapat menunjuk ke wrapper SSH; atur `remoteHost` (`host` atau `user@host`) untuk pengambilan lampiran melalui SCP.
- `attachmentRoots` dan `remoteAttachmentRoots` membatasi path lampiran masuk (default: `/Users/*/Library/Messages/Attachments`).
- SCP menggunakan pemeriksaan host-key ketat, jadi pastikan kunci host relay sudah ada di `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai iMessage.
- `channels.imessage.actions.*`: aktifkan tindakan API privat yang juga dibatasi oleh `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` nonaktif secara default; atur ke `true` sebelum mengharapkan media masuk dalam giliran agen.
- `channels.imessage.catchup.enabled`: ikut serta untuk memutar ulang pesan masuk yang tiba saat Gateway tidak aktif.
- `channels.imessage.groups`: registri grup dan pengaturan per grup. Dengan `groupPolicy: "allowlist"`, konfigurasikan kunci `chat_id` eksplisit atau entri wildcard `"*"` agar pesan grup dapat melewati gerbang registri.
- Entri `bindings[]` tingkat atas dengan `type: "acp"` dapat mengikat percakapan iMessage ke sesi ACP persisten. Gunakan handle yang dinormalisasi atau target chat eksplisit (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik field bersama: [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).

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

- Autentikasi token menggunakan `accessToken`; autentikasi kata sandi menggunakan `userId` + `password`.
- `channels.matrix.proxy` merutekan lalu lintas HTTP Matrix melalui proxy HTTP(S) eksplisit. Akun bernama dapat meng-override-nya dengan `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` mengizinkan homeserver privat/internal. `proxy` dan opt-in jaringan ini adalah kontrol independen.
- `channels.matrix.defaultAccount` memilih akun yang disukai dalam setup multi-akun.
- `channels.matrix.autoJoin` default ke `off`, sehingga room undangan dan undangan baru bergaya DM diabaikan sampai Anda mengatur `autoJoin: "allowlist"` dengan `autoJoinAllowlist` atau `autoJoin: "always"`.
- `channels.matrix.execApprovals`: pengiriman persetujuan exec native Matrix dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, persetujuan exec aktif saat pemberi persetujuan dapat diselesaikan dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Matrix (misalnya `@owner:example.org`) yang diizinkan menyetujui permintaan exec.
  - `agentFilter`: allowlist ID agen opsional. Abaikan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default), `"channel"` (room asal), atau `"both"`.
  - Override per akun: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` mengontrol cara DM Matrix dikelompokkan ke sesi: `per-user` (default) berbagi berdasarkan peer yang dirutekan, sedangkan `per-room` mengisolasi setiap room DM.
- Probe status Matrix dan lookup direktori live menggunakan kebijakan proxy yang sama dengan lalu lintas runtime.
- Konfigurasi Matrix lengkap, aturan penargetan, dan contoh setup didokumentasikan di [Matrix](/id/channels/matrix).

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

- Path kunci inti yang dicakup di sini: `channels.msteams`, `channels.msteams.configWrites`.
- Konfigurasi Teams lengkap (kredensial, webhook, kebijakan DM/grup, override per tim/per saluran) didokumentasikan di [Microsoft Teams](/id/channels/msteams).

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
- `channels.irc.defaultAccount` opsional meng-override pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Konfigurasi saluran IRC lengkap (host/port/TLS/saluran/allowlist/gerbang mention) didokumentasikan di [IRC](/id/channels/irc).

### Multi-akun (semua saluran)

Jalankan beberapa akun per saluran (masing-masing dengan `accountId` sendiri):

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
- Pengaturan saluran dasar berlaku untuk semua akun kecuali di-override per akun.
- Gunakan `bindings[].match.accountId` untuk merutekan setiap akun ke agen yang berbeda.
- Jika Anda menambahkan akun non-default melalui `openclaw channels add` (atau onboarding saluran) saat masih menggunakan konfigurasi saluran tingkat atas akun tunggal, OpenClaw terlebih dahulu mempromosikan nilai akun tunggal tingkat atas bercakupan akun ke peta akun saluran agar akun asli tetap berfungsi. Sebagian besar saluran memindahkannya ke `channels.<channel>.accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada.
- Binding khusus saluran yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default; binding bercakupan akun tetap opsional.
- `openclaw doctor --fix` juga memperbaiki bentuk campuran dengan memindahkan nilai akun tunggal tingkat atas bercakupan akun ke akun yang dipromosikan dan dipilih untuk saluran tersebut. Sebagian besar saluran menggunakan `accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada.

### Saluran Plugin lainnya

Banyak saluran Plugin dikonfigurasi sebagai `channels.<id>` dan didokumentasikan di halaman saluran khususnya (misalnya Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, dan Twitch).
Lihat indeks saluran lengkap: [Saluran](/id/channels).

### Gerbang mention chat grup

Pesan grup default ke **wajib mention** (mention metadata atau pola regex aman). Berlaku untuk chat grup WhatsApp, Telegram, Discord, Google Chat, dan iMessage.

Balasan terlihat dikendalikan secara terpisah. Ruang grup/channel secara default menggunakan `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw tetap memproses giliran, tetapi balasan akhir normal tetap privat dan keluaran ruang yang terlihat memerlukan `message(action=send)`. Atur `"automatic"` hanya saat Anda menginginkan perilaku lama, yaitu balasan normal diposting kembali ke ruang. Untuk menerapkan perilaku balasan terlihat khusus alat yang sama ke chat langsung juga, atur `messages.visibleReplies: "message_tool"`; harness Codex juga menggunakan perilaku khusus alat itu sebagai default chat langsung yang tidak disetel.

Balasan terlihat khusus alat memerlukan model/runtime yang andal memanggil alat. Jika
log sesi menampilkan teks asisten dengan `didSendViaMessagingTool: false`, berarti
model menghasilkan jawaban akhir privat alih-alih memanggil alat pesan.
Beralihlah ke model pemanggil alat yang lebih kuat untuk channel tersebut, atau atur
`messages.groupChat.visibleReplies: "automatic"` untuk memulihkan balasan akhir terlihat
lama.

Jika alat pesan tidak tersedia di bawah kebijakan alat aktif, OpenClaw kembali ke balasan terlihat otomatis alih-alih menekan respons secara diam-diam. `openclaw doctor` memperingatkan ketidakcocokan ini.

Gateway memuat ulang panas konfigurasi `messages` setelah file disimpan. Mulai ulang hanya saat pemantauan file atau pemuatan ulang konfigurasi dinonaktifkan dalam deployment.

**Jenis mention:**

- **Mention metadata**: @-mention platform native. Diabaikan dalam mode self-chat WhatsApp.
- **Pola teks**: Pola regex aman di `agents.list[].groupChat.mentionPatterns`. Pola tidak valid dan pengulangan bersarang yang tidak aman diabaikan.
- Pembatasan mention diterapkan hanya saat deteksi memungkinkan (mention native atau setidaknya satu pola).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` menetapkan default global. Channel dapat menimpa dengan `channels.<channel>.historyLimit` (atau per akun). Atur `0` untuk menonaktifkan.

`messages.visibleReplies` adalah default giliran sumber global; `messages.groupChat.visibleReplies` menimpanya untuk giliran sumber grup/channel. Saat `messages.visibleReplies` tidak disetel, harness dapat menyediakan default langsung/sumbernya sendiri; harness Codex default ke `message_tool`. Allowlist channel dan pembatasan mention tetap menentukan apakah suatu giliran diproses.

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

Resolusi: override per-DM → default penyedia → tanpa batas (semua dipertahankan).

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

- Blok ini mengonfigurasi permukaan perintah. Untuk katalog perintah bawaan + paket saat ini, lihat [Slash Commands](/id/tools/slash-commands).
- Halaman ini adalah **referensi kunci konfigurasi**, bukan katalog perintah lengkap. Perintah milik channel/plugin seperti QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone`, dan Talk `/voice` didokumentasikan di halaman channel/plugin masing-masing ditambah [Slash Commands](/id/tools/slash-commands).
- Perintah teks harus berupa pesan **mandiri** dengan awalan `/`.
- `native: "auto"` mengaktifkan perintah native untuk Discord/Telegram, membiarkan Slack nonaktif.
- `nativeSkills: "auto"` mengaktifkan perintah skill native untuk Discord/Telegram, membiarkan Slack nonaktif.
- Override per channel: `channels.discord.commands.native` (bool atau `"auto"`). Untuk Discord, `false` melewati pendaftaran perintah native dan pembersihan saat startup.
- Override pendaftaran skill native per channel dengan `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` menambahkan entri menu bot Telegram tambahan.
- `bash: true` mengaktifkan `! <cmd>` untuk shell host. Memerlukan `tools.elevated.enabled` dan pengirim di `tools.elevated.allowFrom.<channel>`.
- `config: true` mengaktifkan `/config` (membaca/menulis `openclaw.json`). Untuk klien Gateway `chat.send`, penulisan persisten `/config set|unset` juga memerlukan `operator.admin`; `/config show` baca-saja tetap tersedia untuk klien operator berscope tulis normal.
- `mcp: true` mengaktifkan `/mcp` untuk konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`.
- `plugins: true` mengaktifkan `/plugins` untuk penemuan Plugin, instalasi, serta kontrol aktif/nonaktif.
- `channels.<provider>.configWrites` membatasi mutasi konfigurasi per channel (default: true).
- Untuk channel multi-akun, `channels.<provider>.accounts.<id>.configWrites` juga membatasi penulisan yang menargetkan akun tersebut (misalnya `/allowlist --config --account <id>` atau `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` menonaktifkan tindakan `/restart` dan alat restart Gateway. Default: `true`.
- `ownerAllowFrom` adalah allowlist pemilik eksplisit untuk perintah/alat khusus pemilik. Ini terpisah dari `allowFrom`.
- `ownerDisplay: "hash"` melakukan hash id pemilik dalam prompt sistem. Atur `ownerDisplaySecret` untuk mengontrol hashing.
- `allowFrom` bersifat per penyedia. Saat disetel, ini adalah **satu-satunya** sumber otorisasi (allowlist/pairing channel dan `useAccessGroups` diabaikan).
- `useAccessGroups: false` memungkinkan perintah melewati kebijakan grup akses saat `allowFrom` tidak disetel.
- Peta dokumentasi perintah:
  - katalog bawaan + paket: [Slash Commands](/id/tools/slash-commands)
  - permukaan perintah khusus channel: [Channel](/id/channels)
  - perintah QQ Bot: [QQ Bot](/id/channels/qqbot)
  - perintah pairing: [Pairing](/id/channels/pairing)
  - perintah kartu LINE: [LINE](/id/channels/line)
  - dreaming memory: [Dreaming](/id/concepts/dreaming)

</Accordion>

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — kunci tingkat atas
- [Konfigurasi — agents](/id/gateway/config-agents)
- [Ikhtisar channel](/id/channels)
