---
read_when:
    - Mengonfigurasi Plugin saluran (autentikasi, kontrol akses, multi-akun)
    - Pemecahan masalah kunci konfigurasi per saluran
    - Mengaudit kebijakan DM, kebijakan grup, atau pembatasan penyebutan
summary: 'Konfigurasi saluran: kontrol akses, pemasangan, kunci per saluran di Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan lainnya'
title: Konfigurasi — saluran
x-i18n:
    generated_at: "2026-05-06T17:55:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9be70fd706bcf5acfd06b99632c97f4affb854c6aed02558f70c0403247c448
    source_path: gateway/config-channels.md
    workflow: 16
---

Kunci konfigurasi per kanal di bawah `channels.*`. Mencakup akses DM dan grup,
penyiapan multi-akun, pembatasan mention, dan kunci per kanal untuk Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage, dan Plugin kanal bawaan lainnya.

Untuk agen, alat, runtime gateway, dan kunci tingkat atas lainnya, lihat
[Referensi konfigurasi](/id/gateway/configuration-reference).

## Kanal

Setiap kanal dimulai otomatis ketika bagian konfigurasinya ada (kecuali `enabled: false`).

### Akses DM dan grup

Semua kanal mendukung kebijakan DM dan kebijakan grup:

| Kebijakan DM        | Perilaku                                                       |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (default) | Pengirim tidak dikenal mendapat kode pairing sekali pakai; pemilik harus menyetujui |
| `allowlist`         | Hanya pengirim di `allowFrom` (atau penyimpanan izin yang sudah dipairing) |
| `open`              | Izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)         |
| `disabled`          | Abaikan semua DM masuk                                         |

| Kebijakan grup        | Perilaku                                             |
| --------------------- | ---------------------------------------------------- |
| `allowlist` (default) | Hanya grup yang cocok dengan allowlist terkonfigurasi |
| `open`                | Lewati allowlist grup (pembatasan mention tetap berlaku) |
| `disabled`            | Blokir semua pesan grup/ruang                        |

<Note>
`channels.defaults.groupPolicy` menetapkan default ketika `groupPolicy` suatu penyedia belum diatur.
Kode pairing kedaluwarsa setelah 1 jam. Permintaan pairing DM yang tertunda dibatasi hingga **3 per kanal**.
Jika blok penyedia tidak ada sama sekali (`channels.<provider>` tidak ada), kebijakan grup runtime kembali ke `allowlist` (fail-closed) dengan peringatan saat startup.
</Note>

### Override model kanal

Gunakan `channels.modelByChannel` untuk menyematkan ID kanal tertentu ke sebuah model. Nilai menerima `provider/model` atau alias model yang dikonfigurasi. Pemetaan kanal berlaku ketika sesi belum memiliki override model (misalnya, diatur melalui `/model`).

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

- `channels.defaults.groupPolicy`: kebijakan grup fallback ketika `groupPolicy` tingkat penyedia belum diatur.
- `channels.defaults.contextVisibility`: mode visibilitas konteks tambahan default untuk semua kanal. Nilai: `all` (default, sertakan semua konteks kutipan/thread/riwayat), `allowlist` (hanya sertakan konteks dari pengirim dalam allowlist), `allowlist_quote` (sama seperti allowlist tetapi pertahankan konteks kutipan/balasan eksplisit). Override per kanal: `channels.<channel>.contextVisibility`.
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

<Accordion title="Multi-account WhatsApp">

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

- Perintah keluar secara default menggunakan akun `default` jika ada; jika tidak, menggunakan id akun terkonfigurasi pertama (diurutkan).
- `channels.whatsapp.defaultAccount` opsional meng-override pilihan akun default fallback tersebut ketika cocok dengan id akun terkonfigurasi.
- Direktori auth Baileys satu akun lama dimigrasikan oleh `openclaw doctor` ke `whatsapp/default`.
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
- `apiRoot` hanya root Telegram Bot API. Gunakan `https://api.telegram.org` atau root self-hosted/proxy Anda, bukan `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` menghapus sufiks `/bot<TOKEN>` di akhir yang tidak sengaja.
- `channels.telegram.defaultAccount` opsional meng-override pilihan akun default ketika cocok dengan id akun terkonfigurasi.
- Dalam penyiapan multi-akun (2+ id akun), tetapkan default eksplisit (`channels.telegram.defaultAccount` atau `channels.telegram.accounts.default`) untuk menghindari routing fallback; `openclaw doctor` memperingatkan ketika ini hilang atau tidak valid.
- `configWrites: false` memblokir penulisan konfigurasi yang dipicu Telegram (migrasi ID supergroup, `/config set|unset`).
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk topik forum (gunakan `chatId:topic:topicId` kanonis di `match.peer.id`). Semantik field dibagikan di [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).
- Pratinjau streaming Telegram menggunakan `sendMessage` + `editMessageText` (berfungsi di chat langsung dan grup).
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
      streaming: "off", // off | partial | block | progress
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
- `channels.discord.defaultAccount` opsional menimpa pemilihan akun default ketika cocok dengan id akun yang dikonfigurasi.
- Gunakan `user:<id>` (DM) atau `channel:<id>` (kanal guild) untuk target pengiriman; ID numerik polos ditolak.
- Slug guild memakai huruf kecil dengan spasi diganti `-`; kunci kanal menggunakan nama berslug (tanpa `#`). Lebih disarankan memakai ID guild.
- Pesan yang dibuat bot diabaikan secara default. `allowBots: true` mengaktifkannya; gunakan `allowBots: "mentions"` untuk hanya menerima pesan bot yang menyebut bot (pesan sendiri tetap difilter).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (dan override kanal) membuang pesan yang menyebut pengguna atau peran lain tetapi tidak menyebut bot (tidak termasuk @everyone/@here).
- `channels.discord.mentionAliases` memetakan teks keluar `@handle` yang stabil ke ID pengguna Discord sebelum mengirim, sehingga rekan tim yang dikenal dapat disebut secara deterministik bahkan ketika cache direktori sementara kosong. Override per akun berada di bawah `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (default 17) membagi pesan yang tinggi meskipun masih di bawah 2000 karakter.
- `channels.discord.threadBindings` mengontrol perutean Discord yang terikat thread:
  - `enabled`: override Discord untuk fitur sesi terikat thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, serta pengiriman/perutean terikat)
  - `idleHours`: override Discord untuk auto-unfocus karena tidak aktif dalam jam (`0` menonaktifkan)
  - `maxAgeHours`: override Discord untuk batas usia maksimum keras dalam jam (`0` menonaktifkan)
  - `spawnSessions`: sakelar untuk `sessions_spawn({ thread: true })` dan pembuatan/pengikatan thread otomatis ACP thread-spawn (default: `true`)
  - `defaultSpawnContext`: konteks subagen native untuk spawn terikat thread (`"fork"` secara default)
- Entri tingkat atas `bindings[]` dengan `type: "acp"` mengonfigurasi pengikatan ACP persisten untuk kanal dan thread (gunakan id kanal/thread di `match.peer.id`). Semantik bidang dibagikan di [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` menetapkan warna aksen untuk kontainer komponen Discord v2.
- `channels.discord.voice` mengaktifkan percakapan kanal suara Discord dan override auto-join + LLM + TTS opsional. Konfigurasi Discord teks saja menonaktifkan suara secara default; setel `channels.discord.voice.enabled=true` untuk ikut mengaktifkan.
- `channels.discord.voice.model` secara opsional menimpa model LLM yang digunakan untuk respons kanal suara Discord.
- `channels.discord.voice.daveEncryption` dan `channels.discord.voice.decryptionFailureTolerance` diteruskan ke opsi DAVE `@discordjs/voice` (`true` dan `24` secara default).
- `channels.discord.voice.connectTimeoutMs` mengontrol penantian Ready awal `@discordjs/voice` untuk `/vc join` dan upaya auto-join (`30000` secara default).
- `channels.discord.voice.reconnectGraceMs` mengontrol berapa lama sesi suara yang terputus boleh masuk ke pensinyalan reconnect sebelum OpenClaw menghancurkannya (`15000` secara default).
- OpenClaw juga mencoba pemulihan penerimaan suara dengan keluar/bergabung ulang ke sesi suara setelah kegagalan decrypt berulang.
- `channels.discord.streaming` adalah kunci mode stream kanonis. Nilai lama `streamMode` dan boolean `streaming` tetap menjadi alias runtime; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan.
- `channels.discord.autoPresence` memetakan ketersediaan runtime ke presence bot (sehat => online, menurun => idle, habis => dnd) dan mengizinkan override teks status opsional.
- `channels.discord.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan nama/tag yang dapat berubah (mode kompatibilitas darurat).
- `channels.discord.execApprovals`: pengiriman persetujuan exec native Discord dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, persetujuan exec aktif ketika pemberi persetujuan dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Discord yang diizinkan menyetujui permintaan exec. Fallback ke `commands.ownerAllowFrom` ketika dihilangkan.
  - `agentFilter`: allowlist ID agen opsional. Hilangkan untuk meneruskan persetujuan untuk semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default) mengirim ke DM pemberi persetujuan, `"channel"` mengirim ke kanal asal, `"both"` mengirim ke keduanya. Ketika target menyertakan `"channel"`, tombol hanya dapat digunakan oleh pemberi persetujuan yang di-resolve.
  - `cleanupAfterResolve`: ketika `true`, menghapus DM persetujuan setelah persetujuan, penolakan, atau timeout.

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
- `channels.googlechat.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan prinsipal email yang dapat berubah (mode kompatibilitas darurat).

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
- Snapshot akun Slack mengekspos bidang sumber/status per kredensial seperti `botTokenSource`, `botTokenStatus`, `appTokenStatus`, dan, dalam mode HTTP, `signingSecretStatus`. `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef tetapi jalur perintah/runtime saat ini tidak dapat me-resolve nilai rahasia.
- `configWrites: false` memblokir penulisan konfigurasi yang dimulai Slack.
- `channels.slack.defaultAccount` opsional menimpa pemilihan akun default ketika cocok dengan id akun yang dikonfigurasi.
- `channels.slack.streaming.mode` adalah kunci mode stream Slack kanonis. `channels.slack.streaming.nativeTransport` mengontrol transport streaming native Slack. Nilai lama `streamMode`, boolean `streaming`, dan `nativeStreaming` tetap menjadi alias runtime; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan.
- Gunakan `user:<id>` (DM) atau `channel:<id>` untuk target pengiriman.

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

**Isolasi sesi thread:** `thread.historyScope` bersifat per-thread (default) atau dibagikan di seluruh kanal. `thread.inheritParent` menyalin transkrip kanal induk ke thread baru.

- Streaming native Slack plus status thread gaya asisten Slack "sedang mengetik..." memerlukan target thread balasan. DM tingkat atas tetap di luar thread secara default, sehingga tetap dapat melakukan stream melalui pratinjau draft post-and-edit Slack alih-alih menampilkan pratinjau stream/status native bergaya thread.
- `typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat balasan sedang berjalan, lalu menghapusnya setelah selesai. Gunakan shortcode emoji Slack seperti `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: pengiriman persetujuan exec native Slack dan otorisasi pemberi persetujuan. Skema sama seperti Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID pengguna Slack), `agentFilter`, `sessionFilter`, dan `target` (`"dm"`, `"channel"`, atau `"both"`).

| Grup aksi    | Default     | Catatan                 |
| ------------ | ----------- | ----------------------- |
| reactions    | diaktifkan  | React + daftar reaksi   |
| messages     | diaktifkan  | Baca/kirim/edit/hapus   |
| pins         | diaktifkan  | Pin/unpin/daftar        |
| memberInfo   | diaktifkan  | Info anggota            |
| emojiList    | diaktifkan  | Daftar emoji khusus     |

### Mattermost

Mattermost dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini. Build lama atau kustom dapat memasang paket npm saat ini dengan `openclaw plugins install @openclaw/mattermost`. Periksa [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) untuk dist-tag saat ini sebelum memasang pin versi.

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

Mode chat: `oncall` (merespons saat @-mention, default), `onmessage` (setiap pesan), `onchar` (pesan yang dimulai dengan prefiks pemicu).

Ketika perintah native Mattermost diaktifkan:

- `commands.callbackPath` harus berupa path (misalnya `/api/channels/mattermost/command`), bukan URL lengkap.
- `commands.callbackUrl` harus mengarah ke endpoint Gateway OpenClaw dan dapat dijangkau dari server Mattermost.
- Callback slash native diautentikasi dengan token per perintah yang dikembalikan
  oleh Mattermost saat pendaftaran perintah slash. Jika pendaftaran gagal atau tidak ada
  perintah yang diaktifkan, OpenClaw menolak callback dengan
  `Unauthorized: invalid command token.`
- Untuk host callback privat/tailnet/internal, Mattermost mungkin mengharuskan
  `ServiceSettings.AllowedUntrustedInternalConnections` menyertakan host/domain callback.
  Gunakan nilai host/domain, bukan URL lengkap.
- `channels.mattermost.configWrites`: izinkan atau tolak penulisan konfigurasi yang diprakarsai Mattermost.
- `channels.mattermost.requireMention`: wajibkan `@mention` sebelum membalas di saluran.
- `channels.mattermost.groups.<channelId>.requireMention`: penggantian gating mention per saluran (`"*"` untuk default).
- `channels.mattermost.defaultAccount` opsional mengganti pilihan akun default saat cocok dengan id akun yang dikonfigurasi.

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

- `channels.signal.account`: kunci startup saluran ke identitas akun Signal tertentu.
- `channels.signal.configWrites`: izinkan atau tolak penulisan konfigurasi yang diprakarsai Signal.
- `channels.signal.defaultAccount` opsional mengganti pilihan akun default saat cocok dengan id akun yang dikonfigurasi.

### BlueBubbles

BlueBubbles adalah jalur iMessage yang direkomendasikan (didukung Plugin, dikonfigurasi di bawah `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Jalur kunci inti yang dibahas di sini: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opsional mengganti pilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Entri `bindings[]` level atas dengan `type: "acp"` dapat mengikat percakapan BlueBubbles ke sesi ACP persisten. Gunakan handle BlueBubbles atau string target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik bidang bersama: [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).
- Konfigurasi lengkap saluran BlueBubbles didokumentasikan di [BlueBubbles](/id/channels/bluebubbles).

### iMessage

OpenClaw menjalankan `imsg rpc` (JSON-RPC melalui stdio). Tidak diperlukan daemon atau port.

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

- `channels.imessage.defaultAccount` opsional mengganti pilihan akun default saat cocok dengan id akun yang dikonfigurasi.

- Memerlukan Full Disk Access ke DB Messages.
- Utamakan target `chat_id:<id>`. Gunakan `imsg chats --limit 20` untuk mencantumkan chat.
- `cliPath` dapat menunjuk ke wrapper SSH; tetapkan `remoteHost` (`host` atau `user@host`) untuk pengambilan lampiran SCP.
- `attachmentRoots` dan `remoteAttachmentRoots` membatasi path lampiran masuk (default: `/Users/*/Library/Messages/Attachments`).
- SCP menggunakan pemeriksaan host-key yang ketat, jadi pastikan kunci host relay sudah ada di `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: izinkan atau tolak penulisan konfigurasi yang diprakarsai iMessage.
- Entri `bindings[]` level atas dengan `type: "acp"` dapat mengikat percakapan iMessage ke sesi ACP persisten. Gunakan handle yang dinormalisasi atau target chat eksplisit (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik bidang bersama: [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).

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

- Auth token menggunakan `accessToken`; auth kata sandi menggunakan `userId` + `password`.
- `channels.matrix.proxy` merutekan lalu lintas HTTP Matrix melalui proxy HTTP(S) eksplisit. Akun bernama dapat menggantinya dengan `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` mengizinkan homeserver privat/internal. `proxy` dan opt-in jaringan ini adalah kontrol yang terpisah.
- `channels.matrix.defaultAccount` memilih akun yang disukai dalam setup multi-akun.
- `channels.matrix.autoJoin` default ke `off`, jadi room undangan dan undangan baru bergaya DM diabaikan sampai Anda menetapkan `autoJoin: "allowlist"` dengan `autoJoinAllowlist` atau `autoJoin: "always"`.
- `channels.matrix.execApprovals`: pengiriman persetujuan exec native Matrix dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, persetujuan exec aktif saat pemberi persetujuan dapat diselesaikan dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Matrix (mis. `@owner:example.org`) yang diizinkan menyetujui permintaan exec.
  - `agentFilter`: allowlist ID agen opsional. Abaikan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default), `"channel"` (room asal), atau `"both"`.
  - Penggantian per akun: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` mengontrol cara DM Matrix dikelompokkan menjadi sesi: `per-user` (default) berbagi berdasarkan peer yang dirutekan, sementara `per-room` mengisolasi setiap room DM.
- Probe status Matrix dan pencarian direktori live menggunakan kebijakan proxy yang sama seperti lalu lintas runtime.
- Konfigurasi lengkap Matrix, aturan penargetan, dan contoh setup didokumentasikan di [Matrix](/id/channels/matrix).

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

- Jalur kunci inti yang dibahas di sini: `channels.msteams`, `channels.msteams.configWrites`.
- Konfigurasi lengkap Teams (kredensial, Webhook, kebijakan DM/grup, penggantian per tim/per saluran) didokumentasikan di [Microsoft Teams](/id/channels/msteams).

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

- Jalur kunci inti yang dibahas di sini: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` opsional mengganti pilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Konfigurasi lengkap saluran IRC (host/port/TLS/saluran/allowlist/gating mention) didokumentasikan di [IRC](/id/channels/irc).

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

- `default` digunakan saat `accountId` diabaikan (CLI + perutean).
- Token env hanya berlaku untuk akun **default**.
- Pengaturan saluran dasar berlaku untuk semua akun kecuali diganti per akun.
- Gunakan `bindings[].match.accountId` untuk merutekan setiap akun ke agen yang berbeda.
- Jika Anda menambahkan akun non-default melalui `openclaw channels add` (atau onboarding saluran) saat masih memakai konfigurasi saluran level atas akun tunggal, OpenClaw terlebih dahulu mempromosikan nilai akun tunggal level atas yang berskup akun ke peta akun saluran sehingga akun asli tetap berfungsi. Sebagian besar saluran memindahkannya ke `channels.<channel>.accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok jika sudah ada.
- Binding hanya saluran yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default; binding berskup akun tetap opsional.
- `openclaw doctor --fix` juga memperbaiki bentuk campuran dengan memindahkan nilai akun tunggal level atas yang berskup akun ke akun yang dipromosikan dan dipilih untuk saluran tersebut. Sebagian besar saluran menggunakan `accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok jika sudah ada.

### Saluran Plugin lainnya

Banyak saluran Plugin dikonfigurasi sebagai `channels.<id>` dan didokumentasikan di halaman saluran khususnya (misalnya Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, dan Twitch).
Lihat indeks saluran lengkap: [Saluran](/id/channels).

### Gating mention chat grup

Pesan grup default ke **wajib mention** (mention metadata atau pola regex aman). Berlaku untuk chat grup WhatsApp, Telegram, Discord, Google Chat, dan iMessage.

Balasan terlihat dikontrol secara terpisah. Room grup/saluran default ke `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw tetap memproses turn, tetapi balasan akhir normal tetap privat dan output room yang terlihat memerlukan `message(action=send)`. Tetapkan `"automatic"` hanya saat Anda menginginkan perilaku lama di mana balasan normal diposting kembali ke room. Untuk menerapkan perilaku balasan terlihat khusus tool yang sama ke chat langsung juga, tetapkan `messages.visibleReplies: "message_tool"`; harness Codex juga menggunakan perilaku khusus tool itu sebagai default chat langsung yang tidak ditetapkan.

Balasan terlihat khusus tool memerlukan model/runtime yang andal memanggil tool. Jika
log sesi menampilkan teks asisten dengan `didSendViaMessagingTool: false`, berarti
model menghasilkan jawaban akhir privat alih-alih memanggil tool pesan.
Beralih ke model pemanggil tool yang lebih kuat untuk saluran tersebut, atau tetapkan
`messages.groupChat.visibleReplies: "automatic"` untuk memulihkan balasan akhir terlihat
legacy.

Jika tool pesan tidak tersedia di bawah kebijakan tool aktif, OpenClaw beralih ke balasan terlihat otomatis alih-alih menekan respons secara diam-diam. `openclaw doctor` memperingatkan tentang ketidakcocokan ini.

Gateway melakukan hot-reload konfigurasi `messages` setelah file disimpan. Mulai ulang hanya saat pemantauan file atau reload konfigurasi dinonaktifkan dalam deployment.

**Jenis mention:**

- **Penyebutan metadata**: Penyebutan @ platform native. Diabaikan dalam mode obrolan mandiri WhatsApp.
- **Pola teks**: Pola regex yang aman di `agents.list[].groupChat.mentionPatterns`. Pola tidak valid dan pengulangan bersarang yang tidak aman diabaikan.
- Pembatasan penyebutan hanya diterapkan saat deteksi memungkinkan (penyebutan native atau setidaknya satu pola).

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

`messages.groupChat.historyLimit` menetapkan default global. Saluran dapat menimpa dengan `channels.<channel>.historyLimit` (atau per akun). Atur `0` untuk menonaktifkan.

`messages.visibleReplies` adalah default global untuk giliran sumber; `messages.groupChat.visibleReplies` menimpanya untuk giliran sumber grup/saluran. Saat `messages.visibleReplies` tidak diatur, harness dapat menyediakan default langsung/sumbernya sendiri; harness Codex default ke `message_tool`. Daftar izin saluran dan pembatasan penyebutan tetap menentukan apakah suatu giliran diproses.

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

Sertakan nomor Anda sendiri di `allowFrom` untuk mengaktifkan mode obrolan mandiri (mengabaikan penyebutan @ native, hanya merespons pola teks):

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

### Perintah (penanganan perintah obrolan)

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

- Blok ini mengonfigurasi permukaan perintah. Untuk katalog perintah bawaan + bundel saat ini, lihat [Perintah Slash](/id/tools/slash-commands).
- Halaman ini adalah **referensi kunci konfigurasi**, bukan katalog perintah lengkap. Perintah milik saluran/Plugin seperti QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, pemasangan perangkat `/pair`, memori `/dreaming`, kontrol ponsel `/phone`, dan Talk `/voice` didokumentasikan di halaman saluran/Plugin masing-masing ditambah [Perintah Slash](/id/tools/slash-commands).
- Perintah teks harus berupa pesan **mandiri** dengan awalan `/`.
- `native: "auto"` mengaktifkan perintah native untuk Discord/Telegram, membiarkan Slack nonaktif.
- `nativeSkills: "auto"` mengaktifkan perintah Skills native untuk Discord/Telegram, membiarkan Slack nonaktif.
- Timpa per saluran: `channels.discord.commands.native` (bool atau `"auto"`). Untuk Discord, `false` melewati pendaftaran dan pembersihan perintah native saat startup.
- Timpa pendaftaran Skills native per saluran dengan `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` menambahkan entri menu bot Telegram ekstra.
- `bash: true` mengaktifkan `! <cmd>` untuk shell host. Memerlukan `tools.elevated.enabled` dan pengirim di `tools.elevated.allowFrom.<channel>`.
- `config: true` mengaktifkan `/config` (membaca/menulis `openclaw.json`). Untuk klien Gateway `chat.send`, penulisan persisten `/config set|unset` juga memerlukan `operator.admin`; `/config show` baca-saja tetap tersedia untuk klien operator dengan cakupan tulis normal.
- `mcp: true` mengaktifkan `/mcp` untuk konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`.
- `plugins: true` mengaktifkan `/plugins` untuk penemuan, instalasi, serta kontrol aktif/nonaktif Plugin.
- `channels.<provider>.configWrites` membatasi mutasi konfigurasi per saluran (default: true).
- Untuk saluran multi-akun, `channels.<provider>.accounts.<id>.configWrites` juga membatasi penulisan yang menargetkan akun tersebut (misalnya `/allowlist --config --account <id>` atau `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` menonaktifkan `/restart` dan tindakan alat restart Gateway. Default: `true`.
- `ownerAllowFrom` adalah daftar izin pemilik eksplisit untuk perintah/alat khusus pemilik. Ini terpisah dari `allowFrom`.
- `ownerDisplay: "hash"` melakukan hash id pemilik di prompt sistem. Atur `ownerDisplaySecret` untuk mengontrol hashing.
- `allowFrom` bersifat per penyedia. Saat diatur, ini adalah **satu-satunya** sumber otorisasi (daftar izin/pemasangan saluran dan `useAccessGroups` diabaikan).
- `useAccessGroups: false` memungkinkan perintah melewati kebijakan grup akses saat `allowFrom` tidak diatur.
- Peta dokumen perintah:
  - katalog bawaan + bundel: [Perintah Slash](/id/tools/slash-commands)
  - permukaan perintah khusus saluran: [Saluran](/id/channels)
  - perintah QQ Bot: [QQ Bot](/id/channels/qqbot)
  - perintah pemasangan: [Pemasangan](/id/channels/pairing)
  - perintah kartu LINE: [LINE](/id/channels/line)
  - dreaming memori: [Dreaming](/id/concepts/dreaming)

</Accordion>

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — kunci tingkat atas
- [Konfigurasi — agen](/id/gateway/config-agents)
- [Ikhtisar saluran](/id/channels)
