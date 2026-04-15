---
read_when:
    - Anda memerlukan semantik konfigurasi atau nilai default yang tepat di tingkat field
    - Anda sedang memvalidasi blok konfigurasi channel, model, Gateway, atau tool
summary: Referensi konfigurasi Gateway untuk kunci OpenClaw inti, nilai default, dan tautan ke referensi subsistem khusus
title: Referensi Konfigurasi
x-i18n:
    generated_at: "2026-04-15T19:41:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bdb0f3e56e4a4d767fb4d6150526ae9b3926ef5b213b458001f41d02762436d
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Referensi Konfigurasi

Referensi konfigurasi inti untuk `~/.openclaw/openclaw.json`. Untuk gambaran umum yang berorientasi tugas, lihat [Konfigurasi](/id/gateway/configuration).

Halaman ini membahas permukaan konfigurasi utama OpenClaw dan menautkan ke luar ketika suatu subsistem memiliki referensi mendalamnya sendiri. Halaman ini **tidak** mencoba menyisipkan setiap katalog perintah milik channel/plugin atau setiap knob memori/QMD mendalam dalam satu halaman.

Sumber kebenaran kode:

- `openclaw config schema` mencetak JSON Schema live yang digunakan untuk validasi dan Control UI, dengan metadata bundled/plugin/channel digabungkan saat tersedia
- `config.schema.lookup` mengembalikan satu node skema dengan cakupan path untuk tooling penelusuran mendalam
- `pnpm config:docs:check` / `pnpm config:docs:gen` memvalidasi hash baseline dokumen konfigurasi terhadap permukaan skema saat ini

Referensi mendalam khusus:

- [Referensi konfigurasi memori](/id/reference/memory-config) untuk `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, dan konfigurasi Dreaming di bawah `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/id/tools/slash-commands) untuk katalog perintah built-in + bundled saat ini
- halaman channel/plugin pemilik untuk permukaan perintah khusus channel

Format konfigurasi adalah **JSON5** (komentar + trailing comma diperbolehkan). Semua field bersifat opsional — OpenClaw menggunakan nilai default yang aman saat dihilangkan.

---

## Channel

Setiap channel dimulai secara otomatis ketika bagian konfigurasinya ada (kecuali `enabled: false`).

### Akses DM dan grup

Semua channel mendukung kebijakan DM dan kebijakan grup:

| Kebijakan DM        | Perilaku                                                      |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (default) | Pengirim tidak dikenal mendapatkan kode pairing satu kali; pemilik harus menyetujui |
| `allowlist`         | Hanya pengirim dalam `allowFrom` (atau penyimpanan izin hasil pairing) |
| `open`              | Izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)        |
| `disabled`          | Abaikan semua DM masuk                                        |

| Kebijakan grup        | Perilaku                                             |
| --------------------- | ---------------------------------------------------- |
| `allowlist` (default) | Hanya grup yang cocok dengan allowlist yang dikonfigurasi |
| `open`                | Lewati allowlist grup (gating mention tetap berlaku) |
| `disabled`            | Blokir semua pesan grup/room                         |

<Note>
`channels.defaults.groupPolicy` menetapkan default ketika `groupPolicy` milik provider tidak diatur.
Kode pairing kedaluwarsa setelah 1 jam. Permintaan pairing DM yang tertunda dibatasi hingga **3 per channel**.
Jika blok provider sama sekali tidak ada (`channels.<provider>` tidak ada), kebijakan grup runtime akan fallback ke `allowlist` (fail-closed) dengan peringatan saat startup.
</Note>

### Override model channel

Gunakan `channels.modelByChannel` untuk menetapkan ID channel tertentu ke sebuah model. Nilai menerima `provider/model` atau alias model yang dikonfigurasi. Pemetaan channel diterapkan ketika sebuah sesi belum memiliki override model (misalnya, diatur melalui `/model`).

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

- `channels.defaults.groupPolicy`: kebijakan grup fallback ketika `groupPolicy` tingkat provider tidak diatur.
- `channels.defaults.contextVisibility`: mode visibilitas konteks tambahan default untuk semua channel. Nilai: `all` (default, sertakan semua konteks kutipan/thread/riwayat), `allowlist` (hanya sertakan konteks dari pengirim yang ada di allowlist), `allowlist_quote` (sama seperti allowlist tetapi pertahankan konteks kutipan/balasan eksplisit). Override per-channel: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sertakan status channel yang sehat dalam output Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: sertakan status yang menurun/error dalam output Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: render output Heartbeat bergaya indikator yang ringkas.

### WhatsApp

WhatsApp berjalan melalui channel web Gateway (Baileys Web). Channel ini dimulai secara otomatis ketika sesi yang tertaut ada.

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

- Perintah keluar default ke akun `default` jika ada; jika tidak, ke ID akun terkonfigurasi pertama (diurutkan).
- `channels.whatsapp.defaultAccount` opsional menggantikan pemilihan akun default fallback tersebut ketika nilainya cocok dengan ID akun yang dikonfigurasi.
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bot: `channels.telegram.botToken` atau `channels.telegram.tokenFile` (hanya file biasa; symlink ditolak), dengan `TELEGRAM_BOT_TOKEN` sebagai fallback untuk akun default.
- `channels.telegram.defaultAccount` opsional menggantikan pemilihan akun default ketika nilainya cocok dengan ID akun yang dikonfigurasi.
- Dalam pengaturan multi-akun (2+ ID akun), atur default eksplisit (`channels.telegram.defaultAccount` atau `channels.telegram.accounts.default`) untuk menghindari perutean fallback; `openclaw doctor` memberikan peringatan ketika ini tidak ada atau tidak valid.
- `configWrites: false` memblokir penulisan konfigurasi yang dimulai dari Telegram (migrasi ID supergroup, `/config set|unset`).
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk topik forum (gunakan `chatId:topic:topicId` kanonis dalam `match.peer.id`). Semantik field dibagikan di [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- Pratinjau stream Telegram menggunakan `sendMessage` + `editMessageText` (berfungsi dalam chat langsung dan grup).
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
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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
- Panggilan outbound langsung yang memberikan `token` Discord eksplisit menggunakan token tersebut untuk panggilan; pengaturan retry/kebijakan akun tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
- `channels.discord.defaultAccount` opsional menggantikan pemilihan akun default ketika nilainya cocok dengan ID akun yang dikonfigurasi.
- Gunakan `user:<id>` (DM) atau `channel:<id>` (channel guild) untuk target pengiriman; ID numerik polos ditolak.
- Slug guild menggunakan huruf kecil dengan spasi diganti `-`; kunci channel menggunakan nama yang sudah di-slug (tanpa `#`). Sebaiknya gunakan ID guild.
- Pesan yang ditulis bot diabaikan secara default. `allowBots: true` mengaktifkannya; gunakan `allowBots: "mentions"` untuk hanya menerima pesan bot yang menyebut bot (pesan milik sendiri tetap difilter).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (dan override channel) menghapus pesan yang menyebut pengguna atau role lain tetapi tidak menyebut bot (tidak termasuk @everyone/@here).
- `maxLinesPerMessage` (default 17) memecah pesan yang tinggi bahkan ketika jumlahnya di bawah 2000 karakter.
- `channels.discord.threadBindings` mengontrol perutean terikat thread Discord:
  - `enabled`: override Discord untuk fitur sesi terikat thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan pengiriman/perutean terikat)
  - `idleHours`: override Discord untuk auto-unfocus karena tidak aktif dalam satuan jam (`0` menonaktifkan)
  - `maxAgeHours`: override Discord untuk usia maksimum keras dalam satuan jam (`0` menonaktifkan)
  - `spawnSubagentSessions`: sakelar opt-in untuk pembuatan/pengikatan thread otomatis `sessions_spawn({ thread: true })`
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk channel dan thread (gunakan id channel/thread dalam `match.peer.id`). Semantik field dibagikan di [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` menetapkan warna aksen untuk kontainer komponen Discord v2.
- `channels.discord.voice` mengaktifkan percakapan channel suara Discord dan override auto-join + TTS opsional.
- `channels.discord.voice.daveEncryption` dan `channels.discord.voice.decryptionFailureTolerance` diteruskan ke opsi DAVE `@discordjs/voice` (`true` dan `24` secara default).
- OpenClaw juga mencoba pemulihan penerimaan suara dengan keluar/bergabung ulang ke sesi suara setelah kegagalan dekripsi berulang.
- `channels.discord.streaming` adalah kunci mode stream kanonis. Nilai lama `streamMode` dan nilai boolean `streaming` dimigrasikan secara otomatis.
- `channels.discord.autoPresence` memetakan ketersediaan runtime ke presence bot (healthy => online, degraded => idle, exhausted => dnd) dan memungkinkan override teks status opsional.
- `channels.discord.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan nama/tag yang dapat berubah (mode kompatibilitas break-glass).
- `channels.discord.execApprovals`: pengiriman persetujuan exec native Discord dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, persetujuan exec aktif ketika pemberi persetujuan dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Discord yang diizinkan menyetujui permintaan exec. Menggunakan fallback ke `commands.ownerAllowFrom` jika dihilangkan.
  - `agentFilter`: allowlist ID agen opsional. Hilangkan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default) mengirim ke DM pemberi persetujuan, `"channel"` mengirim ke channel asal, `"both"` mengirim ke keduanya. Ketika target mencakup `"channel"`, tombol hanya bisa digunakan oleh pemberi persetujuan yang berhasil di-resolve.
  - `cleanupAfterResolve`: ketika `true`, menghapus DM persetujuan setelah disetujui, ditolak, atau timeout.

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
- `channels.googlechat.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan principal email yang dapat berubah (mode kompatibilitas break-glass).

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
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string plaintext atau objek SecretRef.
- Snapshot akun Slack menampilkan field sumber/status per kredensial seperti `botTokenSource`, `botTokenStatus`, `appTokenStatus`, dan, dalam mode HTTP, `signingSecretStatus`. `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef tetapi path perintah/runtime saat ini tidak dapat me-resolve nilai secret.
- `configWrites: false` memblokir penulisan konfigurasi yang dimulai dari Slack.
- `channels.slack.defaultAccount` opsional menggantikan pemilihan akun default ketika nilainya cocok dengan ID akun yang dikonfigurasi.
- `channels.slack.streaming.mode` adalah kunci mode stream Slack kanonis. `channels.slack.streaming.nativeTransport` mengontrol transport streaming native Slack. Nilai lama `streamMode`, nilai boolean `streaming`, dan `nativeStreaming` dimigrasikan secara otomatis.
- Gunakan `user:<id>` (DM) atau `channel:<id>` untuk target pengiriman.

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

**Isolasi sesi thread:** `thread.historyScope` bersifat per-thread (default) atau dibagikan di seluruh channel. `thread.inheritParent` menyalin transkrip channel induk ke thread baru.

- Streaming native Slack ditambah status thread gaya asisten Slack "is typing..." memerlukan target thread balasan. DM tingkat atas tetap di luar thread secara default, sehingga menggunakan `typingReaction` atau pengiriman normal alih-alih pratinjau bergaya thread.
- `typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat balasan sedang berjalan, lalu menghapusnya saat selesai. Gunakan shortcode emoji Slack seperti `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: pengiriman persetujuan exec native Slack dan otorisasi pemberi persetujuan. Skema yang sama seperti Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID pengguna Slack), `agentFilter`, `sessionFilter`, dan `target` (`"dm"`, `"channel"`, atau `"both"`).

| Grup aksi   | Default  | Catatan                 |
| ----------- | -------- | ----------------------- |
| reactions   | enabled  | Bereaksi + daftar reaksi |
| messages    | enabled  | Baca/kirim/edit/hapus   |
| pins        | enabled  | Sematkan/lepas/list     |
| memberInfo  | enabled  | Info anggota            |
| emojiList   | enabled  | Daftar emoji kustom     |

### Mattermost

Mattermost tersedia sebagai Plugin: `openclaw plugins install @openclaw/mattermost`.

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

Mode chat: `oncall` (merespons pada @-mention, default), `onmessage` (setiap pesan), `onchar` (pesan yang diawali prefix pemicu).

Ketika perintah native Mattermost diaktifkan:

- `commands.callbackPath` harus berupa path (misalnya `/api/channels/mattermost/command`), bukan URL lengkap.
- `commands.callbackUrl` harus me-resolve ke endpoint Gateway OpenClaw dan dapat dijangkau dari server Mattermost.
- Callback slash native diautentikasi dengan token per-perintah yang dikembalikan oleh Mattermost selama registrasi slash command. Jika registrasi gagal atau tidak ada perintah yang diaktifkan, OpenClaw menolak callback dengan `Unauthorized: invalid command token.`
- Untuk host callback privat/tailnet/internal, Mattermost mungkin memerlukan `ServiceSettings.AllowedUntrustedInternalConnections` untuk menyertakan host/domain callback.
  Gunakan nilai host/domain, bukan URL lengkap.
- `channels.mattermost.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai dari Mattermost.
- `channels.mattermost.requireMention`: wajibkan `@mention` sebelum membalas di channel.
- `channels.mattermost.groups.<channelId>.requireMention`: override gating mention per-channel (`"*"` untuk default).
- `channels.mattermost.defaultAccount` opsional menggantikan pemilihan akun default ketika nilainya cocok dengan ID akun yang dikonfigurasi.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // pengikatan akun opsional
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

- `channels.signal.account`: sematkan startup channel ke identitas akun Signal tertentu.
- `channels.signal.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai dari Signal.
- `channels.signal.defaultAccount` opsional menggantikan pemilihan akun default ketika nilainya cocok dengan ID akun yang dikonfigurasi.

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

- Path kunci inti yang dicakup di sini: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opsional menggantikan pemilihan akun default ketika nilainya cocok dengan ID akun yang dikonfigurasi.
- Entri `bindings[]` tingkat atas dengan `type: "acp"` dapat mengikat percakapan BlueBubbles ke sesi ACP persisten. Gunakan handle BlueBubbles atau string target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) dalam `match.peer.id`. Semantik field bersama: [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
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

- `channels.imessage.defaultAccount` opsional menggantikan pemilihan akun default ketika nilainya cocok dengan ID akun yang dikonfigurasi.

- Memerlukan Full Disk Access ke DB Messages.
- Sebaiknya gunakan target `chat_id:<id>`. Gunakan `imsg chats --limit 20` untuk mencantumkan chat.
- `cliPath` dapat menunjuk ke wrapper SSH; atur `remoteHost` (`host` atau `user@host`) untuk pengambilan lampiran SCP.
- `attachmentRoots` dan `remoteAttachmentRoots` membatasi path lampiran masuk (default: `/Users/*/Library/Messages/Attachments`).
- SCP menggunakan pemeriksaan host-key ketat, jadi pastikan host key relay sudah ada di `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai dari iMessage.
- Entri `bindings[]` tingkat atas dengan `type: "acp"` dapat mengikat percakapan iMessage ke sesi ACP persisten. Gunakan handle yang dinormalisasi atau target chat eksplisit (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) dalam `match.peer.id`. Semantik field bersama: [ACP Agents](/id/tools/acp-agents#channel-specific-settings).

<Accordion title="Contoh wrapper SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix didukung extension dan dikonfigurasi di bawah `channels.matrix`.

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
- `channels.matrix.proxy` merutekan lalu lintas HTTP Matrix melalui proxy HTTP(S) eksplisit. Akun bernama dapat menggantinya dengan `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` mengizinkan homeserver privat/internal. `proxy` dan opt-in jaringan ini adalah kontrol yang independen.
- `channels.matrix.defaultAccount` memilih akun yang diutamakan dalam pengaturan multi-akun.
- `channels.matrix.autoJoin` default-nya `off`, sehingga room undangan dan undangan bergaya DM baru diabaikan sampai Anda menetapkan `autoJoin: "allowlist"` dengan `autoJoinAllowlist` atau `autoJoin: "always"`.
- `channels.matrix.execApprovals`: pengiriman persetujuan exec native Matrix dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, persetujuan exec aktif ketika pemberi persetujuan dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Matrix (mis. `@owner:example.org`) yang diizinkan menyetujui permintaan exec.
  - `agentFilter`: allowlist ID agen opsional. Hilangkan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default), `"channel"` (room asal), atau `"both"`.
  - Override per akun: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` mengontrol cara DM Matrix dikelompokkan ke dalam sesi: `per-user` (default) berbagi berdasarkan peer yang dirutekan, sedangkan `per-room` mengisolasi setiap room DM.
- Probe status Matrix dan pencarian direktori live menggunakan kebijakan proxy yang sama dengan lalu lintas runtime.
- Konfigurasi Matrix lengkap, aturan penargetan, dan contoh penyiapan didokumentasikan di [Matrix](/id/channels/matrix).

### Microsoft Teams

Microsoft Teams didukung extension dan dikonfigurasi di bawah `channels.msteams`.

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
- Konfigurasi Teams lengkap (kredensial, Webhook, kebijakan DM/grup, override per-team/per-channel) didokumentasikan di [Microsoft Teams](/id/channels/msteams).

### IRC

IRC didukung extension dan dikonfigurasi di bawah `channels.irc`.

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
- `channels.irc.defaultAccount` opsional menggantikan pemilihan akun default ketika nilainya cocok dengan ID akun yang dikonfigurasi.
- Konfigurasi channel IRC lengkap (host/port/TLS/channel/allowlist/gating mention) didokumentasikan di [IRC](/id/channels/irc).

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
- Pengaturan channel dasar berlaku untuk semua akun kecuali dioverride per akun.
- Gunakan `bindings[].match.accountId` untuk merutekan setiap akun ke agen yang berbeda.
- Jika Anda menambahkan akun non-default melalui `openclaw channels add` (atau onboarding channel) saat masih berada pada konfigurasi channel tingkat atas akun tunggal, OpenClaw terlebih dahulu mempromosikan nilai akun tunggal tingkat atas yang dicakup akun ke dalam map akun channel agar akun asli tetap berfungsi. Sebagian besar channel memindahkannya ke `channels.<channel>.accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah cocok.
- Binding channel-only yang ada (tanpa `accountId`) tetap cocok dengan akun default; binding yang dicakup akun tetap opsional.
- `openclaw doctor --fix` juga memperbaiki bentuk campuran dengan memindahkan nilai akun tunggal tingkat atas yang dicakup akun ke akun hasil promosi yang dipilih untuk channel tersebut. Sebagian besar channel menggunakan `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah cocok.

### Channel extension lainnya

Banyak channel extension dikonfigurasi sebagai `channels.<id>` dan didokumentasikan di halaman channel khususnya (misalnya Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, dan Twitch).
Lihat indeks channel lengkap: [Channels](/id/channels).

### Gating mention chat grup

Pesan grup default-nya **wajib mention** (metadata mention atau pola regex aman). Berlaku untuk chat grup WhatsApp, Telegram, Discord, Google Chat, dan iMessage.

**Jenis mention:**

- **Metadata mention**: @-mention native platform. Diabaikan dalam mode self-chat WhatsApp.
- **Pola teks**: pola regex aman dalam `agents.list[].groupChat.mentionPatterns`. Pola tidak valid dan pengulangan bersarang yang tidak aman diabaikan.
- Gating mention hanya diterapkan ketika deteksi memungkinkan (mention native atau setidaknya satu pola).

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

`messages.groupChat.historyLimit` menetapkan default global. Channel dapat menggantinya dengan `channels.<channel>.historyLimit` (atau per akun). Tetapkan `0` untuk menonaktifkan.

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

Sertakan nomor Anda sendiri dalam `allowFrom` untuk mengaktifkan mode self-chat (mengabaikan @-mention native, hanya merespons pola teks):

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

- Blok ini mengonfigurasi permukaan perintah. Untuk katalog perintah built-in + bundled saat ini, lihat [Slash Commands](/id/tools/slash-commands).
- Halaman ini adalah **referensi kunci konfigurasi**, bukan katalog perintah lengkap. Perintah milik channel/plugin seperti QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memori `/dreaming`, phone-control `/phone`, dan Talk `/voice` didokumentasikan di halaman channel/plugin masing-masing serta [Slash Commands](/id/tools/slash-commands).
- Perintah teks harus berupa pesan **mandiri** dengan awalan `/`.
- `native: "auto"` mengaktifkan perintah native untuk Discord/Telegram, dan membiarkan Slack nonaktif.
- `nativeSkills: "auto"` mengaktifkan perintah skill native untuk Discord/Telegram, dan membiarkan Slack nonaktif.
- Override per channel: `channels.discord.commands.native` (bool atau `"auto"`). `false` menghapus perintah yang sebelumnya terdaftar.
- Override pendaftaran skill native per channel dengan `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` menambahkan entri menu bot Telegram tambahan.
- `bash: true` mengaktifkan `! <cmd>` untuk shell host. Memerlukan `tools.elevated.enabled` dan pengirim ada dalam `tools.elevated.allowFrom.<channel>`.
- `config: true` mengaktifkan `/config` (membaca/menulis `openclaw.json`). Untuk klien gateway `chat.send`, penulisan persisten `/config set|unset` juga memerlukan `operator.admin`; `/config show` yang hanya-baca tetap tersedia untuk klien operator biasa yang memiliki cakupan tulis.
- `mcp: true` mengaktifkan `/mcp` untuk konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`.
- `plugins: true` mengaktifkan `/plugins` untuk penemuan Plugin, pemasangan, dan kontrol aktif/nonaktif.
- `channels.<provider>.configWrites` mengatur mutasi konfigurasi per channel (default: true).
- Untuk channel multi-akun, `channels.<provider>.accounts.<id>.configWrites` juga mengatur penulisan yang menargetkan akun tersebut (misalnya `/allowlist --config --account <id>` atau `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` menonaktifkan `/restart` dan aksi tool restart Gateway. Default: `true`.
- `ownerAllowFrom` adalah allowlist pemilik eksplisit untuk perintah/tool khusus pemilik. Ini terpisah dari `allowFrom`.
- `ownerDisplay: "hash"` melakukan hash pada ID pemilik di system prompt. Tetapkan `ownerDisplaySecret` untuk mengontrol hashing.
- `allowFrom` bersifat per-provider. Jika diatur, ini adalah **satu-satunya** sumber otorisasi (allowlist/pairing channel dan `useAccessGroups` diabaikan).
- `useAccessGroups: false` memungkinkan perintah melewati kebijakan grup akses saat `allowFrom` tidak diatur.
- Peta dokumentasi perintah:
  - katalog built-in + bundled: [Slash Commands](/id/tools/slash-commands)
  - permukaan perintah khusus channel: [Channels](/id/channels)
  - perintah QQ Bot: [QQ Bot](/id/channels/qqbot)
  - perintah pairing: [Pairing](/id/channels/pairing)
  - perintah kartu LINE: [LINE](/id/channels/line)
  - Dreaming memori: [Dreaming](/id/concepts/dreaming)

</Accordion>

---

## Default agen

### `agents.defaults.workspace`

Default: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Root repositori opsional yang ditampilkan dalam baris Runtime pada system prompt. Jika tidak diatur, OpenClaw mendeteksi otomatis dengan menelusuri ke atas dari workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist Skills default opsional untuk agen yang tidak menetapkan
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // mewarisi github, weather
      { id: "docs", skills: ["docs-search"] }, // menggantikan default
      { id: "locked-down", skills: [] }, // tanpa Skills
    ],
  },
}
```

- Hilangkan `agents.defaults.skills` untuk Skills tanpa pembatasan secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi default.
- Tetapkan `agents.list[].skills: []` untuk tanpa Skills.
- Daftar `agents.list[].skills` yang tidak kosong adalah himpunan final untuk agen tersebut; daftar ini
  tidak digabungkan dengan default.

### `agents.defaults.skipBootstrap`

Menonaktifkan pembuatan otomatis file bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Mengontrol kapan file bootstrap workspace disuntikkan ke system prompt. Default: `"always"`.

- `"continuation-skip"`: giliran lanjutan yang aman (setelah respons asisten selesai) melewati penyuntikan ulang bootstrap workspace, sehingga mengurangi ukuran prompt. Eksekusi Heartbeat dan percobaan ulang pasca-Compaction tetap membangun ulang konteks.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Jumlah karakter maksimum per file bootstrap workspace sebelum dipotong. Default: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Jumlah total karakter maksimum yang disuntikkan di seluruh file bootstrap workspace. Default: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Mengontrol teks peringatan yang terlihat oleh agen ketika konteks bootstrap dipotong.
Default: `"once"`.

- `"off"`: jangan pernah menyuntikkan teks peringatan ke system prompt.
- `"once"`: suntikkan peringatan sekali per signature pemotongan unik (disarankan).
- `"always"`: suntikkan peringatan pada setiap eksekusi ketika ada pemotongan.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Peta kepemilikan anggaran konteks

OpenClaw memiliki beberapa anggaran prompt/konteks berukuran besar, dan anggaran tersebut
sengaja dipisahkan per subsistem alih-alih semuanya mengalir melalui satu
knob generik.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  penyuntikan bootstrap workspace normal.
- `agents.defaults.startupContext.*`:
  prelude startup satu kali untuk `/new` dan `/reset`, termasuk file
  `memory/*.md` harian terbaru.
- `skills.limits.*`:
  daftar Skills ringkas yang disuntikkan ke system prompt.
- `agents.defaults.contextLimits.*`:
  kutipan runtime yang dibatasi dan blok milik runtime yang disuntikkan.
- `memory.qmd.limits.*`:
  cuplikan pencarian memori terindeks dan ukuran penyuntikan.

Gunakan override per-agen yang sesuai hanya ketika satu agen memerlukan
anggaran yang berbeda:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Mengontrol prelude startup giliran pertama yang disuntikkan pada eksekusi
`/new` dan `/reset` tanpa konteks.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Default bersama untuk permukaan konteks runtime yang dibatasi.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: batas cuplikan default `memory_get` sebelum metadata
  pemotongan dan pemberitahuan kelanjutan ditambahkan.
- `memoryGetDefaultLines`: jendela baris default `memory_get` saat `lines`
  dihilangkan.
- `toolResultMaxChars`: batas hasil tool live yang digunakan untuk hasil
  persisten dan pemulihan overflow.
- `postCompactionMaxChars`: batas cuplikan AGENTS.md yang digunakan selama
  penyuntikan refresh pasca-Compaction.

#### `agents.list[].contextLimits`

Override per-agen untuk knob `contextLimits` bersama. Field yang dihilangkan mewarisi
dari `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Batas global untuk daftar Skills ringkas yang disuntikkan ke system prompt. Ini
tidak memengaruhi pembacaan file `SKILL.md` sesuai permintaan.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Override per-agen untuk anggaran prompt Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Ukuran piksel maksimum untuk sisi gambar terpanjang dalam blok gambar transcript/tool sebelum pemanggilan provider.
Default: `1200`.

Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload permintaan untuk eksekusi yang banyak menggunakan tangkapan layar.
Nilai yang lebih tinggi mempertahankan lebih banyak detail visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zona waktu untuk konteks system prompt (bukan stempel waktu pesan). Fallback ke zona waktu host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format waktu dalam system prompt. Default: `auto` (preferensi OS).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // default parameter provider global
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Bentuk string hanya menetapkan model primary.
  - Bentuk objek menetapkan primary plus model failover terurut.
- `imageModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh path tool `image` sebagai konfigurasi model vision-nya.
  - Juga digunakan sebagai perutean fallback ketika model yang dipilih/default tidak dapat menerima input gambar.
- `imageGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan gambar bersama dan permukaan tool/plugin mendatang yang menghasilkan gambar.
  - Nilai umum: `google/gemini-3.1-flash-image-preview` untuk pembuatan gambar Gemini native, `fal/fal-ai/flux/dev` untuk fal, atau `openai/gpt-image-1` untuk OpenAI Images.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga auth/API key provider yang sesuai (misalnya `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk `google/*`, `OPENAI_API_KEY` untuk `openai/*`, `FAL_KEY` untuk `fal/*`).
  - Jika dihilangkan, `image_generate` tetap dapat menyimpulkan default provider yang didukung auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan gambar terdaftar lainnya dalam urutan provider-id.
- `musicGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan musik bersama dan tool built-in `music_generate`.
  - Nilai umum: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, atau `minimax/music-2.5+`.
  - Jika dihilangkan, `music_generate` tetap dapat menyimpulkan default provider yang didukung auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan musik terdaftar lainnya dalam urutan provider-id.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga auth/API key provider yang sesuai.
- `videoGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan video bersama dan tool built-in `video_generate`.
  - Nilai umum: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, atau `qwen/wan2.7-r2v`.
  - Jika dihilangkan, `video_generate` tetap dapat menyimpulkan default provider yang didukung auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan video terdaftar lainnya dalam urutan provider-id.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga auth/API key provider yang sesuai.
  - Provider pembuatan video Qwen bawaan mendukung hingga 1 video output, 1 gambar input, 4 video input, durasi 10 detik, dan opsi tingkat provider `size`, `aspectRatio`, `resolution`, `audio`, serta `watermark`.
- `pdfModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh tool `pdf` untuk perutean model.
  - Jika dihilangkan, tool PDF akan fallback ke `imageModel`, lalu ke model sesi/default yang telah di-resolve.
- `pdfMaxBytesMb`: batas ukuran PDF default untuk tool `pdf` ketika `maxBytesMb` tidak diberikan saat pemanggilan.
- `pdfMaxPages`: jumlah halaman maksimum default yang dipertimbangkan oleh mode fallback ekstraksi dalam tool `pdf`.
- `verboseDefault`: level verbose default untuk agen. Nilai: `"off"`, `"on"`, `"full"`. Default: `"off"`.
- `elevatedDefault`: level output elevated default untuk agen. Nilai: `"off"`, `"on"`, `"ask"`, `"full"`. Default: `"on"`.
- `model.primary`: format `provider/model` (mis. `openai/gpt-5.4`). Jika Anda menghilangkan provider, OpenClaw akan mencoba alias terlebih dahulu, lalu kecocokan configured-provider unik untuk model id persis tersebut, dan baru setelah itu fallback ke provider default yang dikonfigurasi (perilaku kompatibilitas lama yang sudah deprecated, jadi sebaiknya gunakan `provider/model` eksplisit). Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw fallback ke provider/model terkonfigurasi pertama alih-alih menampilkan default provider yang basi dan sudah dihapus.
- `models`: katalog model terkonfigurasi dan allowlist untuk `/model`. Setiap entri dapat menyertakan `alias` (shortcut) dan `params` (khusus provider, misalnya `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parameter provider default global yang diterapkan ke semua model. Atur di `agents.defaults.params` (mis. `{ cacheRetention: "long" }`).
- Urutan prioritas penggabungan `params` (konfigurasi): `agents.defaults.params` (basis global) dioverride oleh `agents.defaults.models["provider/model"].params` (per-model), lalu `agents.list[].params` (ID agen yang cocok) mengoverride per key. Lihat [Prompt Caching](/id/reference/prompt-caching) untuk detail.
- `embeddedHarness`: kebijakan runtime agen tertanam tingkat rendah default. Gunakan `runtime: "auto"` agar harness plugin terdaftar dapat mengambil model yang didukung, `runtime: "pi"` untuk memaksa harness PI bawaan, atau id harness terdaftar seperti `runtime: "codex"`. Tetapkan `fallback: "none"` untuk menonaktifkan fallback PI otomatis.
- Penulis konfigurasi yang memutasi field ini (misalnya `/models set`, `/models set-image`, dan perintah tambah/hapus fallback) menyimpan bentuk objek kanonis dan mempertahankan daftar fallback yang sudah ada bila memungkinkan.
- `maxConcurrent`: jumlah maksimum eksekusi agen paralel lintas sesi (setiap sesi tetap diserialkan). Default: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` mengontrol eksekutor tingkat rendah mana yang menjalankan giliran agen tertanam.
Sebagian besar deployment sebaiknya mempertahankan default `{ runtime: "auto", fallback: "pi" }`.
Gunakan ini ketika plugin tepercaya menyediakan harness native, seperti harness
server-aplikasi Codex bawaan.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"`, atau id harness plugin terdaftar. Plugin Codex bawaan mendaftarkan `codex`.
- `fallback`: `"pi"` atau `"none"`. `"pi"` mempertahankan harness PI bawaan sebagai fallback kompatibilitas. `"none"` membuat pemilihan harness plugin yang hilang atau tidak didukung gagal alih-alih diam-diam menggunakan PI.
- Override lingkungan: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` mengoverride `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` menonaktifkan fallback PI untuk proses tersebut.
- Untuk deployment khusus Codex, atur `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"`, dan `embeddedHarness.fallback: "none"`.
- Ini hanya mengontrol harness chat tertanam. Pembuatan media, vision, PDF, musik, video, dan TTS tetap menggunakan pengaturan provider/model masing-masing.

**Shorthand alias bawaan** (hanya berlaku ketika model ada dalam `agents.defaults.models`):

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Alias yang Anda konfigurasi selalu mengungguli default.

Model Z.AI GLM-4.x otomatis mengaktifkan mode thinking kecuali Anda menetapkan `--thinking off` atau mendefinisikan sendiri `agents.defaults.models["zai/<model>"].params.thinking`.
Model Z.AI mengaktifkan `tool_stream` secara default untuk streaming pemanggilan tool. Tetapkan `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
Model Anthropic Claude 4.6 default ke thinking `adaptive` ketika tidak ada level thinking eksplisit yang ditetapkan.

### `agents.defaults.cliBackends`

Backend CLI opsional untuk eksekusi fallback hanya-teks (tanpa pemanggilan tool). Berguna sebagai cadangan ketika provider API gagal.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backend CLI berfokus pada teks; tool selalu dinonaktifkan.
- Sesi didukung ketika `sessionArg` diatur.
- Pass-through gambar didukung ketika `imageArg` menerima path file.

### `agents.defaults.systemPromptOverride`

Ganti seluruh system prompt yang dirangkai OpenClaw dengan string tetap. Atur di level default (`agents.defaults.systemPromptOverride`) atau per agen (`agents.list[].systemPromptOverride`). Nilai per-agen memiliki prioritas lebih tinggi; nilai kosong atau hanya whitespace diabaikan. Berguna untuk eksperimen prompt yang terkontrol.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

Eksekusi Heartbeat berkala.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: string durasi (ms/s/m/h). Default: `30m` (auth API-key) atau `1h` (auth OAuth). Tetapkan `0m` untuk menonaktifkan.
- `includeSystemPromptSection`: ketika false, menghilangkan bagian Heartbeat dari system prompt dan melewati penyuntikan `HEARTBEAT.md` ke konteks bootstrap. Default: `true`.
- `suppressToolErrorWarnings`: ketika true, menekan payload peringatan error tool selama eksekusi Heartbeat.
- `timeoutSeconds`: waktu maksimum dalam detik yang diizinkan untuk satu giliran agen Heartbeat sebelum dibatalkan. Biarkan tidak diatur untuk menggunakan `agents.defaults.timeoutSeconds`.
- `directPolicy`: kebijakan pengiriman langsung/DM. `allow` (default) mengizinkan pengiriman target langsung. `block` menekan pengiriman target langsung dan mengeluarkan `reason=dm-blocked`.
- `lightContext`: ketika true, eksekusi Heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
- `isolatedSession`: ketika true, setiap Heartbeat dijalankan dalam sesi baru tanpa riwayat percakapan sebelumnya. Pola isolasi yang sama seperti Cron `sessionTarget: "isolated"`. Mengurangi biaya token per Heartbeat dari ~100K menjadi ~2-5K token.
- Per agen: atur `agents.list[].heartbeat`. Ketika ada agen yang mendefinisikan `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat.
- Heartbeat menjalankan giliran agen penuh — interval yang lebih pendek membakar lebih banyak token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send a brief notice when compaction starts (default: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` atau `safeguard` (peringkasan bertahap untuk riwayat panjang). Lihat [Compaction](/id/concepts/compaction).
- `provider`: id dari plugin provider Compaction terdaftar. Saat diatur, `summarize()` milik provider dipanggil alih-alih peringkasan LLM bawaan. Fallback ke bawaan jika gagal. Menetapkan provider memaksa `mode: "safeguard"`. Lihat [Compaction](/id/concepts/compaction).
- `timeoutSeconds`: jumlah detik maksimum yang diizinkan untuk satu operasi Compaction sebelum OpenClaw membatalkannya. Default: `900`.
- `identifierPolicy`: `strict` (default), `off`, atau `custom`. `strict` menambahkan panduan bawaan untuk mempertahankan identifier opak selama peringkasan Compaction.
- `identifierInstructions`: teks kustom opsional untuk preservasi identifier yang digunakan saat `identifierPolicy=custom`.
- `postCompactionSections`: nama bagian H2/H3 AGENTS.md opsional yang akan disuntikkan ulang setelah Compaction. Default ke `["Session Startup", "Red Lines"]`; tetapkan `[]` untuk menonaktifkan penyuntikan ulang. Saat tidak diatur atau secara eksplisit diatur ke pasangan default tersebut, heading lama `Every Session`/`Safety` juga diterima sebagai fallback lama.
- `model`: override opsional `provider/model-id` khusus untuk peringkasan Compaction. Gunakan ini ketika sesi utama harus tetap memakai satu model tetapi ringkasan Compaction harus dijalankan pada model lain; saat tidak diatur, Compaction menggunakan model primary sesi.
- `notifyUser`: saat `true`, mengirim pemberitahuan singkat kepada pengguna ketika Compaction dimulai (misalnya, "Memadatkan konteks..."). Dinonaktifkan secara default agar Compaction tetap senyap.
- `memoryFlush`: giliran agentic senyap sebelum auto-Compaction untuk menyimpan memori yang tahan lama. Dilewati ketika workspace bersifat hanya-baca.

### `agents.defaults.contextPruning`

Memangkas **hasil tool lama** dari konteks dalam memori sebelum dikirim ke LLM. **Tidak** memodifikasi riwayat sesi di disk.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Perilaku mode cache-ttl">

- `mode: "cache-ttl"` mengaktifkan proses pemangkasan.
- `ttl` mengontrol seberapa sering pemangkasan dapat dijalankan lagi (setelah sentuhan cache terakhir).
- Pemangkasan melakukan pemotongan lunak pada hasil tool yang terlalu besar terlebih dahulu, lalu menghapus keras hasil tool yang lebih lama jika diperlukan.

**Soft-trim** mempertahankan bagian awal + akhir dan menyisipkan `...` di tengah.

**Hard-clear** mengganti seluruh hasil tool dengan placeholder.

Catatan:

- Blok gambar tidak pernah dipotong/dihapus.
- Rasio berbasis karakter (perkiraan), bukan hitungan token yang persis.
- Jika ada kurang dari `keepLastAssistants` pesan asisten, pemangkasan dilewati.

</Accordion>

Lihat [Session Pruning](/id/concepts/session-pruning) untuk detail perilaku.

### Streaming blok

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Channel non-Telegram memerlukan `*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
- Override channel: `channels.<channel>.blockStreamingCoalesce` (dan varian per-akun). Signal/Slack/Discord/Google Chat default `minChars: 1500`.
- `humanDelay`: jeda acak di antara balasan blok. `natural` = 800–2500ms. Override per-agen: `agents.list[].humanDelay`.

Lihat [Streaming](/id/concepts/streaming) untuk detail perilaku + chunking.

### Indikator mengetik

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Default: `instant` untuk chat langsung/mention, `message` untuk chat grup tanpa mention.
- Override per-sesi: `session.typingMode`, `session.typingIntervalSeconds`.

Lihat [Typing Indicators](/id/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opsional untuk agen tertanam. Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Detail sandbox">

**Backend:**

- `docker`: runtime Docker lokal (default)
- `ssh`: runtime jarak jauh umum berbasis SSH
- `openshell`: runtime OpenShell

Saat `backend: "openshell"` dipilih, pengaturan khusus runtime dipindahkan ke
`plugins.entries.openshell.config`.

**Konfigurasi backend SSH:**

- `target`: target SSH dalam bentuk `user@host[:port]`
- `command`: perintah klien SSH (default: `ssh`)
- `workspaceRoot`: root jarak jauh absolut yang digunakan untuk workspace per-scope
- `identityFile` / `certificateFile` / `knownHostsFile`: file lokal yang sudah ada dan diteruskan ke OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: konten inline atau SecretRef yang dimaterialisasi OpenClaw menjadi file sementara saat runtime
- `strictHostKeyChecking` / `updateHostKeys`: knob kebijakan host-key OpenSSH

**Prioritas auth SSH:**

- `identityData` menang atas `identityFile`
- `certificateData` menang atas `certificateFile`
- `knownHostsData` menang atas `knownHostsFile`
- Nilai `*Data` berbasis SecretRef di-resolve dari snapshot runtime secrets aktif sebelum sesi sandbox dimulai

**Perilaku backend SSH:**

- menanam workspace jarak jauh sekali setelah pembuatan atau pembuatan ulang
- lalu mempertahankan workspace SSH jarak jauh sebagai kanonis
- merutekan `exec`, tool file, dan path media melalui SSH
- tidak menyinkronkan perubahan jarak jauh kembali ke host secara otomatis
- tidak mendukung container browser sandbox

**Akses workspace:**

- `none`: workspace sandbox per-scope di bawah `~/.openclaw/sandboxes`
- `ro`: workspace sandbox di `/workspace`, workspace agen di-mount hanya-baca di `/agent`
- `rw`: workspace agen di-mount baca/tulis di `/workspace`

**Scope:**

- `session`: container + workspace per-sesi
- `agent`: satu container + workspace per agen (default)
- `shared`: container dan workspace bersama (tanpa isolasi lintas sesi)

**Konfigurasi plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Mode OpenShell:**

- `mirror`: tanam jarak jauh dari lokal sebelum exec, sinkronkan balik setelah exec; workspace lokal tetap kanonis
- `remote`: tanam jarak jauh sekali saat sandbox dibuat, lalu pertahankan workspace jarak jauh sebagai kanonis

Dalam mode `remote`, edit lokal host yang dibuat di luar OpenClaw tidak disinkronkan ke sandbox secara otomatis setelah langkah seed.
Transport menggunakan SSH ke sandbox OpenShell, tetapi plugin memiliki siklus hidup sandbox dan sinkronisasi mirror opsional.

**`setupCommand`** dijalankan sekali setelah pembuatan container (melalui `sh -lc`). Memerlukan network egress, root yang dapat ditulis, dan pengguna root.

**Container default ke `network: "none"`** — atur ke `"bridge"` (atau jaringan bridge kustom) jika agen memerlukan akses keluar.
`"host"` diblokir. `"container:<id>"` diblokir secara default kecuali Anda secara eksplisit menetapkan
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Lampiran masuk** dipentaskan ke `media/inbound/*` di workspace aktif.

**`docker.binds`** me-mount direktori host tambahan; bind global dan per-agen digabungkan.

**Browser sandbox** (`sandbox.browser.enabled`): Chromium + CDP dalam container. URL noVNC disuntikkan ke system prompt. Tidak memerlukan `browser.enabled` di `openclaw.json`.
Akses pengamat noVNC menggunakan autentikasi VNC secara default dan OpenClaw mengeluarkan URL token berumur pendek (alih-alih mengekspos kata sandi dalam URL bersama).

- `allowHostControl: false` (default) memblokir sesi sandbox agar tidak menargetkan browser host.
- `network` default ke `openclaw-sandbox-browser` (jaringan bridge khusus). Atur ke `bridge` hanya ketika Anda secara eksplisit menginginkan konektivitas bridge global.
- `cdpSourceRange` secara opsional membatasi ingress CDP di tepi container ke rentang CIDR (misalnya `172.21.0.1/32`).
- `sandbox.browser.binds` me-mount direktori host tambahan hanya ke container browser sandbox. Saat diatur (termasuk `[]`), ini menggantikan `docker.binds` untuk container browser.
- Default peluncuran didefinisikan di `scripts/sandbox-browser-entrypoint.sh` dan disetel untuk host container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (diaktifkan secara default)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, dan `--disable-gpu` diaktifkan
    secara default dan dapat dinonaktifkan dengan
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika penggunaan WebGL/3D memerlukannya.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` mengaktifkan kembali ekstensi jika alur kerja Anda
    bergantung padanya.
  - `--renderer-process-limit=2` dapat diubah dengan
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; tetapkan `0` untuk menggunakan
    batas proses default Chromium.
  - plus `--no-sandbox` dan `--disable-setuid-sandbox` ketika `noSandbox` diaktifkan.
  - Default adalah baseline image container; gunakan image browser kustom dengan
    entrypoint kustom untuk mengubah default container.

</Accordion>

Browser sandboxing dan `sandbox.docker.binds` hanya untuk Docker.

Bangun image:

```bash
scripts/sandbox-setup.sh           # image sandbox utama
scripts/sandbox-browser-setup.sh   # image browser opsional
```

### `agents.list` (override per-agen)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id agen stabil (wajib).
- `default`: saat ada beberapa yang diatur, yang pertama menang (peringatan dicatat). Jika tidak ada yang diatur, entri daftar pertama adalah default.
- `model`: bentuk string hanya mengoverride `primary`; bentuk objek `{ primary, fallbacks }` mengoverride keduanya (`[]` menonaktifkan fallback global). Pekerjaan Cron yang hanya mengoverride `primary` tetap mewarisi fallback default kecuali Anda menetapkan `fallbacks: []`.
- `params`: parameter stream per-agen yang digabungkan di atas entri model terpilih dalam `agents.defaults.models`. Gunakan ini untuk override khusus agen seperti `cacheRetention`, `temperature`, atau `maxTokens` tanpa menduplikasi seluruh katalog model.
- `skills`: allowlist Skills opsional per agen. Jika dihilangkan, agen mewarisi `agents.defaults.skills` jika diatur; daftar eksplisit menggantikan default alih-alih digabungkan, dan `[]` berarti tanpa Skills.
- `thinkingDefault`: default tingkat thinking opsional per agen (`off | minimal | low | medium | high | xhigh | adaptive`). Mengoverride `agents.defaults.thinkingDefault` untuk agen ini ketika tidak ada override per-pesan atau sesi.
- `reasoningDefault`: default visibilitas reasoning opsional per agen (`on | off | stream`). Berlaku ketika tidak ada override reasoning per-pesan atau sesi.
- `fastModeDefault`: default opsional per agen untuk fast mode (`true | false`). Berlaku ketika tidak ada override fast-mode per-pesan atau sesi.
- `embeddedHarness`: override kebijakan harness tingkat rendah opsional per agen. Gunakan `{ runtime: "codex", fallback: "none" }` untuk menjadikan satu agen hanya-Codex sementara agen lain tetap menggunakan fallback PI default.
- `runtime`: deskriptor runtime opsional per agen. Gunakan `type: "acp"` dengan default `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) ketika agen tersebut harus default ke sesi harness ACP.
- `identity.avatar`: path relatif workspace, URL `http(s)`, atau URI `data:`.
- `identity` menurunkan default: `ackReaction` dari `emoji`, `mentionPatterns` dari `name`/`emoji`.
- `subagents.allowAgents`: allowlist id agen untuk `sessions_spawn` (`["*"]` = agen apa pun; default: hanya agen yang sama).
- Guard pewarisan sandbox: jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `subagents.requireAgentId`: saat true, blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit; default: false).

---

## Perutean multi-agen

Jalankan beberapa agen terisolasi di dalam satu Gateway. Lihat [Multi-Agent](/id/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Field kecocokan binding

- `type` (opsional): `route` untuk perutean normal (jika type tidak ada, default ke route), `acp` untuk binding percakapan ACP persisten.
- `match.channel` (wajib)
- `match.accountId` (opsional; `*` = akun apa pun; dihilangkan = akun default)
- `match.peer` (opsional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opsional; khusus channel)
- `acp` (opsional; hanya untuk entri `type: "acp"`): `{ mode, label, cwd, backend }`

**Urutan kecocokan deterministik:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (persis, tanpa peer/guild/team)
5. `match.accountId: "*"` (seluruh channel)
6. Agen default

Dalam setiap tingkat, entri `bindings` pertama yang cocok akan menang.

Untuk entri `type: "acp"`, OpenClaw me-resolve berdasarkan identitas percakapan persis (`match.channel` + akun + `match.peer.id`) dan tidak menggunakan urutan tingkat binding route di atas.

### Profil akses per agen

<Accordion title="Akses penuh (tanpa sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Tool + workspace hanya-baca">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Tanpa akses filesystem (hanya perpesanan)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Lihat [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) untuk detail prioritas.

---

## Sesi

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detail field sesi">

- **`scope`**: strategi pengelompokan sesi dasar untuk konteks chat grup.
  - `per-sender` (default): setiap pengirim mendapatkan sesi terisolasi dalam konteks channel.
  - `global`: semua peserta dalam konteks channel berbagi satu sesi tunggal (gunakan hanya ketika konteks bersama memang diinginkan).
- **`dmScope`**: cara DM dikelompokkan.
  - `main`: semua DM berbagi sesi utama.
  - `per-peer`: isolasi berdasarkan id pengirim lintas channel.
  - `per-channel-peer`: isolasi per channel + pengirim (disarankan untuk inbox multi-pengguna).
  - `per-account-channel-peer`: isolasi per akun + channel + pengirim (disarankan untuk multi-akun).
- **`identityLinks`**: memetakan id kanonis ke peer berprefiks provider untuk berbagi sesi lintas channel.
- **`reset`**: kebijakan reset utama. `daily` melakukan reset pada `atHour` waktu lokal; `idle` melakukan reset setelah `idleMinutes`. Jika keduanya dikonfigurasi, yang kedaluwarsa lebih dahulu akan menang.
- **`resetByType`**: override per tipe (`direct`, `group`, `thread`). `dm` lama diterima sebagai alias untuk `direct`.
- **`parentForkMaxTokens`**: maksimum `totalTokens` sesi induk yang diizinkan saat membuat sesi thread bercabang (default `100000`).
  - Jika `totalTokens` induk berada di atas nilai ini, OpenClaw memulai sesi thread baru alih-alih mewarisi riwayat transkrip induk.
  - Tetapkan `0` untuk menonaktifkan guard ini dan selalu mengizinkan fork dari induk.
- **`mainKey`**: field lama. Runtime selalu menggunakan `"main"` untuk bucket chat langsung utama.
- **`agentToAgent.maxPingPongTurns`**: jumlah maksimum giliran balas-balik antar agen selama pertukaran agent-to-agent (integer, rentang: `0`–`5`). `0` menonaktifkan rantai ping-pong.
- **`sendPolicy`**: cocokkan berdasarkan `channel`, `chatType` (`direct|group|channel`, dengan alias lama `dm`), `keyPrefix`, atau `rawKeyPrefix`. Penolakan pertama yang cocok akan menang.
- **`maintenance`**: kontrol pembersihan + retensi penyimpanan sesi.
  - `mode`: `warn` hanya mengeluarkan peringatan; `enforce` menerapkan pembersihan.
  - `pruneAfter`: batas usia untuk entri usang (default `30d`).
  - `maxEntries`: jumlah maksimum entri dalam `sessions.json` (default `500`).
  - `rotateBytes`: rotasi `sessions.json` ketika melebihi ukuran ini (default `10mb`).
  - `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>`. Default ke `pruneAfter`; tetapkan `false` untuk menonaktifkan.
  - `maxDiskBytes`: anggaran disk direktori sesi opsional. Dalam mode `warn` ini mencatat peringatan; dalam mode `enforce` ini menghapus artefak/sesi tertua terlebih dahulu.
  - `highWaterBytes`: target opsional setelah pembersihan anggaran. Default ke `80%` dari `maxDiskBytes`.
- **`threadBindings`**: default global untuk fitur sesi terikat thread.
  - `enabled`: sakelar default utama (provider dapat mengoverride; Discord menggunakan `channels.discord.threadBindings.enabled`)
  - `idleHours`: default auto-unfocus karena tidak aktif dalam satuan jam (`0` menonaktifkan; provider dapat mengoverride)
  - `maxAgeHours`: default usia maksimum keras dalam satuan jam (`0` menonaktifkan; provider dapat mengoverride)

</Accordion>

---

## Pesan

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefiks respons

Override per channel/akun: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolusi (yang paling spesifik menang): akun → channel → global. `""` menonaktifkan dan menghentikan cascade. `"auto"` menurunkan `[{identity.name}]`.

**Variabel template:**

| Variable          | Deskripsi              | Contoh                      |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nama model singkat     | `claude-opus-4-6`           |
| `{modelFull}`     | Identifier model penuh | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nama provider          | `anthropic`                 |
| `{thinkingLevel}` | Tingkat thinking saat ini | `high`, `low`, `off`     |
| `{identity.name}` | Nama identitas agen    | (sama seperti `"auto"`)     |

Variabel tidak peka huruf besar/kecil. `{think}` adalah alias untuk `{thinkingLevel}`.

### Reaksi ack

- Default ke `identity.emoji` agen aktif, jika tidak ada maka `"👀"`. Tetapkan `""` untuk menonaktifkan.
- Override per channel: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Urutan resolusi: akun → channel → `messages.ackReaction` → fallback identitas.
- Scope: `group-mentions` (default), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: menghapus ack setelah balasan di Slack, Discord, dan Telegram.
- `messages.statusReactions.enabled`: mengaktifkan reaksi status siklus hidup di Slack, Discord, dan Telegram.
  Di Slack dan Discord, jika tidak diatur maka reaksi status tetap aktif ketika reaksi ack aktif.
  Di Telegram, tetapkan secara eksplisit ke `true` untuk mengaktifkan reaksi status siklus hidup.

### Debounce inbound

Mengelompokkan pesan cepat berbasis teks saja dari pengirim yang sama ke dalam satu giliran agen. Media/lampiran langsung mem-flush. Perintah kontrol melewati debouncing.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` mengontrol mode auto-TTS default: `off`, `always`, `inbound`, atau `tagged`. `/tts on|off` dapat mengoverride preferensi lokal, dan `/tts status` menampilkan status efektif.
- `summaryModel` mengoverride `agents.defaults.model.primary` untuk ringkasan otomatis.
- `modelOverrides` aktif secara default; `modelOverrides.allowProvider` default ke `false` (opt-in).
- API key menggunakan fallback ke `ELEVENLABS_API_KEY`/`XI_API_KEY` dan `OPENAI_API_KEY`.
- `openai.baseUrl` mengoverride endpoint OpenAI TTS. Urutan resolusi adalah konfigurasi, lalu `OPENAI_TTS_BASE_URL`, lalu `https://api.openai.com/v1`.
- Ketika `openai.baseUrl` menunjuk ke endpoint non-OpenAI, OpenClaw menganggapnya sebagai server TTS kompatibel OpenAI dan melonggarkan validasi model/suara.

---

## Talk

Default untuk mode Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` harus cocok dengan kunci di `talk.providers` saat beberapa provider Talk dikonfigurasi.
- Kunci Talk datar lama (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) hanya untuk kompatibilitas dan dimigrasikan otomatis ke `talk.providers.<provider>`.
- ID suara menggunakan fallback ke `ELEVENLABS_VOICE_ID` atau `SAG_VOICE_ID`.
- `providers.*.apiKey` menerima string plaintext atau objek SecretRef.
- Fallback `ELEVENLABS_API_KEY` hanya berlaku ketika tidak ada API key Talk yang dikonfigurasi.
- `providers.*.voiceAliases` memungkinkan direktif Talk menggunakan nama yang ramah.
- `silenceTimeoutMs` mengontrol berapa lama mode Talk menunggu setelah pengguna diam sebelum mengirim transkrip. Jika tidak diatur, jendela jeda default platform tetap digunakan (`700 ms di macOS dan Android, 900 ms di iOS`).

---

## Tool

### Profil tool

`tools.profile` menetapkan allowlist dasar sebelum `tools.allow`/`tools.deny`:

Onboarding lokal menetapkan default konfigurasi lokal baru ke `tools.profile: "coding"` ketika tidak diatur (profil eksplisit yang sudah ada dipertahankan).

| Profil      | Mencakup                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | hanya `session_status`                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                   |
| `full`      | Tidak ada pembatasan (sama seperti tidak diatur)                                                                             |

### Grup tool

| Grup               | Tool                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` diterima sebagai alias untuk `exec`)                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Semua tool built-in (tidak termasuk plugin provider)                                                                    |

### `tools.allow` / `tools.deny`

Kebijakan izinkan/tolak tool global (deny menang). Tidak peka huruf besar/kecil, mendukung wildcard `*`. Diterapkan bahkan saat sandbox Docker nonaktif.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Membatasi tool lebih lanjut untuk provider atau model tertentu. Urutan: profil dasar → profil provider → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Mengontrol akses exec elevated di luar sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Override per-agen (`agents.list[].tools.elevated`) hanya dapat membatasi lebih lanjut.
- `/elevated on|off|ask|full` menyimpan status per sesi; direktif inline berlaku untuk satu pesan.
- `exec` elevated melewati sandboxing dan menggunakan jalur escape yang dikonfigurasi (`gateway` secara default, atau `node` ketika target exec adalah `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Pemeriksaan keamanan loop tool **dinonaktifkan secara default**. Tetapkan `enabled: true` untuk mengaktifkan deteksi.
Pengaturan dapat didefinisikan secara global di `tools.loopDetection` dan dioverride per agen di `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: jumlah maksimum riwayat pemanggilan tool yang dipertahankan untuk analisis loop.
- `warningThreshold`: ambang pola berulang tanpa progres untuk peringatan.
- `criticalThreshold`: ambang berulang yang lebih tinggi untuk memblokir loop kritis.
- `globalCircuitBreakerThreshold`: ambang hard stop untuk eksekusi tanpa progres apa pun.
- `detectors.genericRepeat`: beri peringatan pada pemanggilan berulang tool yang sama dengan argumen yang sama.
- `detectors.knownPollNoProgress`: beri peringatan/blokir pada tool polling yang dikenal (`process.poll`, `command_status`, dll.).
- `detectors.pingPong`: beri peringatan/blokir pada pola pasangan bolak-balik tanpa progres.
- Jika `warningThreshold >= criticalThreshold` atau `criticalThreshold >= globalCircuitBreakerThreshold`, validasi gagal.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Mengonfigurasi pemahaman media masuk (gambar/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Field entri model media">

**Entri provider** (`type: "provider"` atau dihilangkan):

- `provider`: id provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, dll.)
- `model`: override id model
- `profile` / `preferredProfile`: pemilihan profil `auth-profiles.json`

**Entri CLI** (`type: "cli"`):

- `command`: executable yang akan dijalankan
- `args`: argumen bertemplat (mendukung `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, dll.)

**Field umum:**

- `capabilities`: daftar opsional (`image`, `audio`, `video`). Default: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per entri.
- Kegagalan akan fallback ke entri berikutnya.

Auth provider mengikuti urutan standar: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

**Field penyelesaian async:**

- `asyncCompletion.directSend`: ketika `true`, tugas `music_generate`
  dan `video_generate` async yang selesai mencoba pengiriman langsung ke channel terlebih dahulu. Default: `false`
  (jalur lama requester-session wake/model-delivery).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Mengontrol sesi mana yang dapat ditargetkan oleh tool sesi (`sessions_list`, `sessions_history`, `sessions_send`).

Default: `tree` (sesi saat ini + sesi yang dihasilkan olehnya, seperti subagen).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Catatan:

- `self`: hanya key sesi saat ini.
- `tree`: sesi saat ini + sesi yang dihasilkan oleh sesi saat ini (subagen).
- `agent`: sesi apa pun yang dimiliki oleh id agen saat ini (dapat mencakup pengguna lain jika Anda menjalankan sesi per-pengirim di bawah id agen yang sama).
- `all`: sesi apa pun. Penargetan lintas agen tetap memerlukan `tools.agentToAgent`.
- Clamp sandbox: ketika sesi saat ini berada dalam sandbox dan `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, visibilitas dipaksa ke `tree` meskipun `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Mengontrol dukungan lampiran inline untuk `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

Catatan:

- Lampiran hanya didukung untuk `runtime: "subagent"`. Runtime ACP menolaknya.
- File dimaterialisasi ke workspace child di `.openclaw/attachments/<uuid>/` dengan `.manifest.json`.
- Konten lampiran secara otomatis disensor dari persistensi transkrip.
- Input Base64 divalidasi dengan pemeriksaan alfabet/padding yang ketat dan guard ukuran pra-decode.
- Izin file adalah `0700` untuk direktori dan `0600` untuk file.
- Pembersihan mengikuti kebijakan `cleanup`: `delete` selalu menghapus lampiran; `keep` mempertahankannya hanya ketika `retainOnSessionKeep: true`.

### `tools.experimental`

Flag tool built-in eksperimental. Default nonaktif kecuali ada aturan auto-enable GPT-5 agentic ketat yang berlaku.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

Catatan:

- `planTool`: mengaktifkan tool `update_plan` terstruktur eksperimental untuk pelacakan pekerjaan multi-langkah yang tidak sepele.
- Default: `false` kecuali `agents.defaults.embeddedPi.executionContract` (atau override per-agen) ditetapkan ke `"strict-agentic"` untuk eksekusi keluarga GPT-5 OpenAI atau OpenAI Codex. Tetapkan `true` untuk memaksa tool aktif di luar cakupan tersebut, atau `false` untuk tetap menonaktifkannya bahkan untuk eksekusi GPT-5 strict-agentic.
- Saat diaktifkan, system prompt juga menambahkan panduan penggunaan sehingga model hanya menggunakannya untuk pekerjaan yang substansial dan mempertahankan paling banyak satu langkah `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: model default untuk subagen yang dihasilkan. Jika dihilangkan, subagen mewarisi model pemanggil.
- `allowAgents`: allowlist default id agen target untuk `sessions_spawn` ketika agen peminta tidak menetapkan `subagents.allowAgents` sendiri (`["*"]` = agen apa pun; default: hanya agen yang sama).
- `runTimeoutSeconds`: timeout default (detik) untuk `sessions_spawn` ketika pemanggilan tool menghilangkan `runTimeoutSeconds`. `0` berarti tanpa timeout.
- Kebijakan tool per-subagen: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider kustom dan base URL

OpenClaw menggunakan katalog model bawaan. Tambahkan provider kustom melalui `models.providers` di konfigurasi atau `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Gunakan `authHeader: true` + `headers` untuk kebutuhan auth kustom.
- Override root konfigurasi agen dengan `OPENCLAW_AGENT_DIR` (atau `PI_CODING_AGENT_DIR`, alias variabel lingkungan lama).
- Prioritas penggabungan untuk id provider yang cocok:
  - Nilai `baseUrl` `models.json` agen yang tidak kosong menang.
  - Nilai `apiKey` agen yang tidak kosong menang hanya ketika provider tersebut tidak dikelola SecretRef dalam konteks config/auth-profile saat ini.
  - Nilai `apiKey` provider yang dikelola SecretRef disegarkan dari marker sumber (`ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec) alih-alih mempersistenkan secret yang telah di-resolve.
  - Nilai header provider yang dikelola SecretRef disegarkan dari marker sumber (`secretref-env:ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec).
  - `apiKey`/`baseUrl` agen yang kosong atau tidak ada menggunakan fallback ke `models.providers` dalam konfigurasi.
  - `contextWindow`/`maxTokens` model yang cocok menggunakan nilai yang lebih tinggi antara konfigurasi eksplisit dan nilai katalog implisit.
  - `contextTokens` model yang cocok mempertahankan batas runtime eksplisit jika ada; gunakan ini untuk membatasi konteks efektif tanpa mengubah metadata model native.
  - Gunakan `models.mode: "replace"` ketika Anda ingin konfigurasi menulis ulang `models.json` sepenuhnya.
  - Persistensi marker bersifat source-authoritative: marker ditulis dari snapshot konfigurasi sumber aktif (pra-resolusi), bukan dari nilai secret runtime yang telah di-resolve.

### Detail field provider

- `models.mode`: perilaku katalog provider (`merge` atau `replace`).
- `models.providers`: map provider kustom yang dikunci oleh id provider.
- `models.providers.*.api`: adapter permintaan (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, dll).
- `models.providers.*.apiKey`: kredensial provider (sebaiknya gunakan substitusi SecretRef/env).
- `models.providers.*.auth`: strategi auth (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: untuk Ollama + `openai-completions`, suntikkan `options.num_ctx` ke dalam permintaan (default: `true`).
- `models.providers.*.authHeader`: paksa transport kredensial di header `Authorization` bila diperlukan.
- `models.providers.*.baseUrl`: base URL API upstream.
- `models.providers.*.headers`: header statis tambahan untuk perutean proxy/tenant.
- `models.providers.*.request`: override transport untuk permintaan HTTP model-provider.
  - `request.headers`: header tambahan (digabungkan dengan default provider). Nilai menerima SecretRef.
  - `request.auth`: override strategi auth. Mode: `"provider-default"` (gunakan auth bawaan provider), `"authorization-bearer"` (dengan `token`), `"header"` (dengan `headerName`, `value`, opsional `prefix`).
  - `request.proxy`: override proxy HTTP. Mode: `"env-proxy"` (gunakan env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (dengan `url`). Kedua mode menerima sub-objek `tls` opsional.
  - `request.tls`: override TLS untuk koneksi langsung. Field: `ca`, `cert`, `key`, `passphrase` (semuanya menerima SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: ketika `true`, izinkan HTTPS ke `baseUrl` saat DNS di-resolve ke rentang privat, CGNAT, atau rentang serupa, melalui guard fetch HTTP provider (opt-in operator untuk endpoint OpenAI-compatible self-hosted tepercaya). WebSocket menggunakan `request` yang sama untuk header/TLS tetapi tidak untuk gate SSRF fetch tersebut. Default `false`.
- `models.providers.*.models`: entri katalog model provider eksplisit.
- `models.providers.*.models.*.contextWindow`: metadata jendela konteks model native.
- `models.providers.*.models.*.contextTokens`: batas konteks runtime opsional. Gunakan ini ketika Anda menginginkan anggaran konteks efektif yang lebih kecil daripada `contextWindow` native model.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: petunjuk kompatibilitas opsional. Untuk `api: "openai-completions"` dengan `baseUrl` non-native yang tidak kosong (host bukan `api.openai.com`), OpenClaw memaksanya menjadi `false` saat runtime. `baseUrl` kosong/tidak ada mempertahankan perilaku default OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: petunjuk kompatibilitas opsional untuk endpoint chat OpenAI-compatible yang hanya menerima string. Ketika `true`, OpenClaw meratakan array `messages[].content` yang murni teks menjadi string biasa sebelum mengirim permintaan.
- `plugins.entries.amazon-bedrock.config.discovery`: root pengaturan auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: aktifkan/nonaktifkan discovery implisit.
- `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS untuk discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filter provider-id opsional untuk discovery yang ditargetkan.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interval polling untuk penyegaran discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: fallback context window untuk model yang ditemukan.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: fallback token output maksimum untuk model yang ditemukan.

### Contoh provider

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Gunakan `cerebras/zai-glm-4.7` untuk Cerebras; `zai/glm-4.7` untuk Z.AI langsung.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Tetapkan `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`). Gunakan referensi `opencode/...` untuk katalog Zen atau referensi `opencode-go/...` untuk katalog Go. Pintasan: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Tetapkan `ZAI_API_KEY`. `z.ai/*` dan `z-ai/*` diterima sebagai alias. Pintasan: `openclaw onboard --auth-choice zai-api-key`.

- Endpoint umum: `https://api.z.ai/api/paas/v4`
- Endpoint coding (default): `https://api.z.ai/api/coding/paas/v4`
- Untuk endpoint umum, definisikan provider kustom dengan override base URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Untuk endpoint China: `baseUrl: "https://api.moonshot.cn/v1"` atau `openclaw onboard --auth-choice moonshot-api-key-cn`.

Endpoint Moonshot native mengiklankan kompatibilitas penggunaan streaming pada transport bersama
`openai-completions`, dan OpenClaw menguncinya berdasarkan kapabilitas endpoint
alih-alih hanya berdasarkan id provider bawaan.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Kompatibel dengan Anthropic, provider bawaan. Pintasan: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (kompatibel Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL sebaiknya tidak menyertakan `/v1` (klien Anthropic akan menambahkannya). Pintasan: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (langsung)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Tetapkan `MINIMAX_API_KEY`. Pintasan:
`openclaw onboard --auth-choice minimax-global-api` atau
`openclaw onboard --auth-choice minimax-cn-api`.
Katalog model default hanya ke M2.7.
Pada path streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking MiniMax
secara default kecuali Anda secara eksplisit menetapkan `thinking` sendiri. `/fast on` atau
`params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Model lokal (LM Studio)">

Lihat [Local Models](/id/gateway/local-models). Singkatnya: jalankan model lokal besar melalui LM Studio Responses API pada perangkat keras yang memadai; pertahankan model hosted tetap digabungkan sebagai fallback.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opsional hanya untuk Skills bawaan (Skills terkelola/workspace tidak terpengaruh).
- `load.extraDirs`: root Skills bersama tambahan (prioritas terendah).
- `install.preferBrew`: ketika true, utamakan installer Homebrew saat `brew`
  tersedia sebelum fallback ke jenis installer lainnya.
- `install.nodeManager`: preferensi installer node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` menonaktifkan suatu Skills meskipun dibundel/terpasang.
- `entries.<skillKey>.apiKey`: kemudahan untuk Skills yang mendeklarasikan env var utama (string plaintext atau objek SecretRef).

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Dimuat dari `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, ditambah `plugins.load.paths`.
- Discovery menerima plugin OpenClaw native plus bundle Codex yang kompatibel dan bundle Claude, termasuk bundle tata letak default Claude tanpa manifest.
- **Perubahan konfigurasi memerlukan restart Gateway.**
- `allow`: allowlist opsional (hanya plugin yang tercantum yang dimuat). `deny` menang.
- `plugins.entries.<id>.apiKey`: field kemudahan API key tingkat plugin (saat didukung oleh plugin).
- `plugins.entries.<id>.env`: map env var dengan cakupan plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: saat `false`, core memblokir `before_prompt_build` dan mengabaikan field pemodifikasi prompt dari `before_agent_start` lama, sambil mempertahankan `modelOverride` dan `providerOverride` lama. Berlaku untuk hook plugin native dan direktori hook yang disediakan bundle yang didukung.
- `plugins.entries.<id>.subagent.allowModelOverride`: secara eksplisit memercayai plugin ini untuk meminta override `provider` dan `model` per-eksekusi untuk eksekusi subagen latar belakang.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opsional target kanonis `provider/model` untuk override subagen tepercaya. Gunakan `"*"` hanya jika Anda memang sengaja ingin mengizinkan model apa pun.
- `plugins.entries.<id>.config`: objek konfigurasi yang didefinisikan plugin (divalidasi oleh skema plugin OpenClaw native saat tersedia).
- `plugins.entries.firecrawl.config.webFetch`: pengaturan provider web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (menerima SecretRef). Menggunakan fallback ke `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` lama, atau env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: base URL API Firecrawl (default: `https://api.firecrawl.dev`).
  - `onlyMainContent`: ekstrak hanya konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: timeout permintaan scrape dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan provider X Search.
  - `model`: model Grok yang digunakan untuk pencarian (mis. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan ambang.
  - `enabled`: sakelar Dreaming utama (default `false`).
  - `frequency`: cadence Cron untuk setiap penyapuan Dreaming penuh (default `"0 3 * * *"`).
  - kebijakan fase dan ambang adalah detail implementasi (bukan kunci konfigurasi yang ditampilkan ke pengguna).
- Konfigurasi memori lengkap ada di [Referensi konfigurasi memori](/id/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundle Claude yang diaktifkan juga dapat menyumbangkan default Pi tertanam dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agen yang telah disanitasi, bukan sebagai patch konfigurasi OpenClaw mentah.
- `plugins.slots.memory`: pilih id plugin memori aktif, atau `"none"` untuk menonaktifkan plugin memori.
- `plugins.slots.contextEngine`: pilih id plugin mesin konteks aktif; default ke `"legacy"` kecuali Anda memasang dan memilih mesin lain.
- `plugins.installs`: metadata pemasangan yang dikelola CLI dan digunakan oleh `openclaw plugins update`.
  - Mencakup `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Perlakukan `plugins.installs.*` sebagai status yang dikelola; sebaiknya gunakan perintah CLI daripada edit manual.

Lihat [Plugin](/id/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` menonaktifkan `act:evaluate` dan `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan ketika tidak diatur, sehingga navigasi browser tetap ketat secara default.
- Tetapkan `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` hanya ketika Anda memang sengaja memercayai navigasi browser jaringan privat.
- Dalam mode ketat, endpoint profil CDP jarak jauh (`profiles.*.cdpUrl`) tunduk pada pemblokiran jaringan privat yang sama selama pemeriksaan keterjangkauan/discovery.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil jarak jauh bersifat attach-only (start/stop/reset dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) ketika Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  ketika provider Anda memberikan URL WebSocket DevTools langsung.
- Profil `existing-session` hanya untuk host dan menggunakan Chrome MCP alih-alih CDP.
- Profil `existing-session` dapat menetapkan `userDataDir` untuk menargetkan profil
  browser berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` mempertahankan batas rute Chrome MCP saat ini:
  aksi berbasis snapshot/ref alih-alih penargetan selector CSS, hook upload satu file,
  tanpa override timeout dialog, dan tanpa `wait --load networkidle`,
  `responsebody`, ekspor PDF, intersepsi unduhan, atau aksi batch.
- Profil `openclaw` terkelola lokal otomatis menetapkan `cdpPort` dan `cdpUrl`; hanya
  tetapkan `cdpUrl` secara eksplisit untuk CDP jarak jauh.
- Urutan deteksi otomatis: browser default jika berbasis Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Layanan kontrol: hanya loopback (port diturunkan dari `gateway.port`, default `18791`).
- `extraArgs` menambahkan flag peluncuran tambahan ke startup Chromium lokal (misalnya
  `--disable-gpu`, pengaturan ukuran jendela, atau flag debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: warna aksen untuk chrome UI aplikasi native (warna gelembung mode Talk, dll.).
- `assistant`: override identitas Control UI. Menggunakan fallback ke identitas agen aktif.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detail field Gateway">

- `mode`: `local` (menjalankan gateway) atau `remote` (terhubung ke gateway jarak jauh). Gateway menolak untuk memulai kecuali `local`.
- `port`: satu port termultipleks untuk WS + HTTP. Prioritas: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (default), `lan` (`0.0.0.0`), `tailnet` (hanya IP Tailscale), atau `custom`.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind default `loopback` mendengarkan pada `127.0.0.1` di dalam container. Dengan jaringan bridge Docker (`-p 18789:18789`), trafik datang pada `eth0`, sehingga gateway tidak dapat dijangkau. Gunakan `--network host`, atau tetapkan `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) agar mendengarkan di semua interface.
- **Auth**: wajib secara default. Bind non-loopback memerlukan auth gateway. Dalam praktiknya ini berarti token/password bersama atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wizard onboarding menghasilkan token secara default.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRef), tetapkan `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Startup dan alur install/perbaikan layanan gagal ketika keduanya dikonfigurasi dan mode tidak diatur.
- `gateway.auth.mode: "none"`: mode tanpa auth eksplisit. Gunakan hanya untuk setup local loopback tepercaya; ini sengaja tidak ditawarkan oleh prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan auth ke reverse proxy yang sadar identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)). Mode ini mengharapkan sumber proxy **non-loopback**; reverse proxy loopback pada host yang sama tidak memenuhi syarat trusted-proxy auth.
- `gateway.auth.allowTailscale`: ketika `true`, header identitas Tailscale Serve dapat memenuhi auth Control UI/WebSocket (diverifikasi melalui `tailscale whois`). Endpoint HTTP API **tidak** menggunakan auth header Tailscale tersebut; mereka mengikuti mode auth HTTP normal gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Default ke `true` saat `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limiter auth gagal opsional. Berlaku per IP klien dan per cakupan auth (shared-secret dan device-token dilacak secara independen). Percobaan yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada path async Tailscale Serve Control UI, percobaan gagal untuk `{scope, clientIp}` yang sama diserialkan sebelum penulisan kegagalan. Karena itu, percobaan buruk konkuren dari klien yang sama dapat memicu limiter pada permintaan kedua alih-alih keduanya berlomba lolos sebagai mismatch biasa.
  - `gateway.auth.rateLimit.exemptLoopback` default ke `true`; tetapkan `false` ketika Anda memang sengaja ingin trafik localhost juga dibatasi lajunya (untuk setup pengujian atau deployment proxy ketat).
- Percobaan auth WS yang berasal dari browser selalu dibatasi lajunya dengan pengecualian loopback dinonaktifkan (defense-in-depth terhadap brute force localhost berbasis browser).
- Pada loopback, lockout asal browser tersebut diisolasi per nilai `Origin`
  yang telah dinormalisasi, sehingga kegagalan berulang dari satu origin localhost tidak otomatis
  mengunci origin yang berbeda.
- `tailscale.mode`: `serve` (hanya tailnet, bind loopback) atau `funnel` (publik, memerlukan auth).
- `controlUi.allowedOrigins`: allowlist origin browser eksplisit untuk koneksi WebSocket Gateway. Wajib ketika klien browser diharapkan berasal dari origin non-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan fallback origin berbasis Host-header untuk deployment yang memang sengaja mengandalkan kebijakan origin Host-header.
- `remote.transport`: `ssh` (default) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus berupa `ws://` atau `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass sisi klien yang mengizinkan `ws://` plaintext ke IP jaringan privat tepercaya; default tetap hanya loopback untuk plaintext.
- `gateway.remote.token` / `.password` adalah field kredensial klien remote. Field ini tidak mengonfigurasi auth gateway dengan sendirinya.
- `gateway.push.apns.relay.baseUrl`: base URL HTTPS untuk relay APNs eksternal yang digunakan oleh build iOS resmi/TestFlight setelah mereka memublikasikan registrasi berbasis relay ke gateway. URL ini harus cocok dengan URL relay yang dikompilasi ke dalam build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout pengiriman gateway-ke-relay dalam milidetik. Default ke `10000`.
- Registrasi berbasis relay didelegasikan ke identitas gateway tertentu. Aplikasi iOS yang dipasangkan mengambil `gateway.identity.get`, menyertakan identitas tersebut dalam registrasi relay, dan meneruskan grant pengiriman yang dicakup registrasi ke gateway. Gateway lain tidak dapat menggunakan ulang registrasi yang tersimpan itu.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env sementara untuk konfigurasi relay di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch khusus pengembangan untuk URL relay HTTP loopback. URL relay produksi harus tetap menggunakan HTTPS.
- `gateway.channelHealthCheckMinutes`: interval monitor kesehatan channel dalam menit. Tetapkan `0` untuk menonaktifkan restart monitor kesehatan secara global. Default: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ambang socket basi dalam menit. Pertahankan nilai ini lebih besar atau sama dengan `gateway.channelHealthCheckMinutes`. Default: `30`.
- `gateway.channelMaxRestartsPerHour`: jumlah maksimum restart monitor kesehatan per channel/akun dalam satu jam berjalan. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per-channel untuk restart monitor kesehatan sambil tetap mempertahankan monitor global aktif.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per-akun untuk channel multi-akun. Jika diatur, ini memiliki prioritas lebih tinggi daripada override tingkat channel.
- Path pemanggilan gateway lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak diatur.
- Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan tidak berhasil di-resolve, resolusi gagal tertutup (tanpa fallback remote yang menutupi).
- `trustedProxies`: IP reverse proxy yang melakukan terminasi TLS atau menyuntikkan header klien yang diteruskan. Cantumkan hanya proxy yang Anda kendalikan. Entri loopback tetap valid untuk setup deteksi proxy/lokal di host yang sama (misalnya Tailscale Serve atau reverse proxy lokal), tetapi entri tersebut **tidak** membuat permintaan loopback memenuhi syarat untuk `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: ketika `true`, gateway menerima `X-Real-IP` jika `X-Forwarded-For` tidak ada. Default `false` untuk perilaku fail-closed.
- `gateway.tools.deny`: nama tool tambahan yang diblokir untuk HTTP `POST /tools/invoke` (memperluas daftar deny default).
- `gateway.tools.allow`: hapus nama tool dari daftar deny HTTP default.

</Accordion>

### Endpoint kompatibel OpenAI

- Chat Completions: dinonaktifkan secara default. Aktifkan dengan `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening input-URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlist kosong diperlakukan sebagai tidak diatur; gunakan `gateway.http.endpoints.responses.files.allowUrl=false`
    dan/atau `gateway.http.endpoints.responses.images.allowUrl=false` untuk menonaktifkan pengambilan URL.
- Header hardening respons opsional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (tetapkan hanya untuk origin HTTPS yang Anda kendalikan; lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolasi multi-instance

Jalankan beberapa gateway pada satu host dengan port dan direktori state unik:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag praktis: `--dev` (menggunakan `~/.openclaw-dev` + port `19001`), `--profile <name>` (menggunakan `~/.openclaw-<name>`).

Lihat [Multiple Gateways](/id/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: mengaktifkan terminasi TLS pada listener gateway (HTTPS/WSS) (default: `false`).
- `autoGenerate`: otomatis membuat pasangan sertifikat/kunci self-signed lokal ketika file eksplisit tidak dikonfigurasi; hanya untuk penggunaan lokal/dev.
- `certPath`: path filesystem ke file sertifikat TLS.
- `keyPath`: path filesystem ke file private key TLS; pertahankan izin yang dibatasi.
- `caPath`: path bundle CA opsional untuk verifikasi klien atau rantai kepercayaan kustom.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: mengontrol cara edit konfigurasi diterapkan saat runtime.
  - `"off"`: abaikan edit live; perubahan memerlukan restart eksplisit.
  - `"restart"`: selalu restart proses gateway saat konfigurasi berubah.
  - `"hot"`: terapkan perubahan dalam proses tanpa restart.
  - `"hybrid"` (default): coba hot reload terlebih dahulu; fallback ke restart bila diperlukan.
- `debounceMs`: jendela debounce dalam ms sebelum perubahan konfigurasi diterapkan (integer non-negatif).
- `deferralTimeoutMs`: waktu maksimum dalam ms untuk menunggu operasi yang sedang berjalan sebelum memaksa restart (default: `300000` = 5 menit).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` atau `x-openclaw-token: <token>`.
Token hook query-string ditolak.

Catatan validasi dan keamanan:

- `hooks.enabled=true` memerlukan `hooks.token` yang tidak kosong.
- `hooks.token` harus **berbeda** dari `gateway.auth.token`; penggunaan ulang token Gateway ditolak.
- `hooks.path` tidak boleh `/`; gunakan subpath khusus seperti `/hooks`.
- Jika `hooks.allowRequestSessionKey=true`, batasi `hooks.allowedSessionKeyPrefixes` (misalnya `["hook:"]`).

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dari payload permintaan diterima hanya ketika `hooks.allowRequestSessionKey=true` (default: `false`).
- `POST /hooks/<name>` → di-resolve melalui `hooks.mappings`

<Accordion title="Detail mapping">

- `match.path` mencocokkan sub-path setelah `/hooks` (mis. `/hooks/gmail` → `gmail`).
- `match.source` mencocokkan field payload untuk path generik.
- Template seperti `{{messages[0].subject}}` membaca dari payload.
- `transform` dapat menunjuk ke modul JS/TS yang mengembalikan aksi hook.
  - `transform.module` harus berupa path relatif dan tetap berada di dalam `hooks.transformsDir` (path absolut dan traversal ditolak).
- `agentId` merutekan ke agen tertentu; ID yang tidak dikenal menggunakan fallback ke default.
- `allowedAgentIds`: membatasi perutean eksplisit (`*` atau dihilangkan = izinkan semua, `[]` = tolak semua).
- `defaultSessionKey`: key sesi tetap opsional untuk eksekusi agen hook tanpa `sessionKey` eksplisit.
- `allowRequestSessionKey`: izinkan pemanggil `/hooks/agent` menetapkan `sessionKey` (default: `false`).
- `allowedSessionKeyPrefixes`: allowlist prefiks opsional untuk nilai `sessionKey` eksplisit (permintaan + mapping), mis. `["hook:"]`.
- `deliver: true` mengirim balasan akhir ke channel; `channel` default ke `last`.
- `model` mengoverride LLM untuk eksekusi hook ini (harus diizinkan jika katalog model diatur).

</Accordion>

### Integrasi Gmail

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway otomatis memulai `gog gmail watch serve` saat boot ketika dikonfigurasi. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkan.
- Jangan menjalankan `gog gmail watch serve` terpisah bersamaan dengan Gateway.

---

## Host canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Menyajikan HTML/CSS/JS yang dapat diedit agen dan A2UI melalui HTTP di bawah port Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Hanya lokal: pertahankan `gateway.bind: "loopback"` (default).
- Bind non-loopback: rute canvas memerlukan auth Gateway (token/password/trusted-proxy), sama seperti permukaan HTTP Gateway lainnya.
- Node WebViews biasanya tidak mengirim header auth; setelah sebuah node dipasangkan dan terhubung, Gateway mengiklankan URL kapabilitas bercakupan node untuk akses canvas/A2UI.
- URL kapabilitas terikat ke sesi WS node aktif dan cepat kedaluwarsa. Fallback berbasis IP tidak digunakan.
- Menyuntikkan klien live-reload ke HTML yang disajikan.
- Otomatis membuat `index.html` awal ketika kosong.
- Juga menyajikan A2UI di `/__openclaw__/a2ui/`.
- Perubahan memerlukan restart gateway.
- Nonaktifkan live reload untuk direktori besar atau error `EMFILE`.

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (default): hilangkan `cliPath` + `sshPort` dari record TXT.
- `full`: sertakan `cliPath` + `sshPort`.
- Hostname default ke `openclaw`. Override dengan `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Menulis zona DNS-SD unicast di bawah `~/.openclaw/dns/`. Untuk discovery lintas jaringan, pasangkan dengan server DNS (disarankan CoreDNS) + split DNS Tailscale.

Penyiapan: `openclaw dns setup --apply`.

---

## Environment

### `env` (env var inline)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Env var inline hanya diterapkan jika env proses tidak memiliki key tersebut.
- File `.env`: `.env` CWD + `~/.openclaw/.env` (keduanya tidak mengoverride variabel yang sudah ada).
- `shellEnv`: mengimpor key yang diharapkan tetapi belum ada dari profil shell login Anda.
- Lihat [Environment](/id/help/environment) untuk prioritas lengkap.

### Substitusi env var

Rujuk env var di string konfigurasi mana pun dengan `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Hanya nama huruf besar yang dicocokkan: `[A-Z_][A-Z0-9_]*`.
- Variabel yang hilang/kosong menimbulkan error saat pemuatan konfigurasi.
- Escape dengan `$${VAR}` untuk `${VAR}` literal.
- Bekerja dengan `$include`.

---

## Secrets

Ref secret bersifat aditif: nilai plaintext tetap berfungsi.

### `SecretRef`

Gunakan satu bentuk objek:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validasi:

- pola `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- pola id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id `source: "file"`: pointer JSON absolut (misalnya `"/providers/openai/apiKey"`)
- pola id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id `source: "exec"` tidak boleh mengandung segmen path `.` atau `..` yang dipisahkan slash (misalnya `a/../b` ditolak)

### Permukaan kredensial yang didukung

- Matriks kanonis: [SecretRef Credential Surface](/id/reference/secretref-credential-surface)
- `secrets apply` menargetkan path kredensial `openclaw.json` yang didukung.
- Ref `auth-profiles.json` disertakan dalam cakupan resolusi runtime dan audit.

### Konfigurasi provider secret

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Catatan:

- Provider `file` mendukung `mode: "json"` dan `mode: "singleValue"` (`id` harus `"value"` dalam mode singleValue).
- Provider `exec` memerlukan path `command` absolut dan menggunakan payload protokol pada stdin/stdout.
- Secara default, path perintah symlink ditolak. Tetapkan `allowSymlinkCommand: true` untuk mengizinkan path symlink sambil tetap memvalidasi path target yang telah di-resolve.
- Jika `trustedDirs` dikonfigurasi, pemeriksaan direktori tepercaya berlaku pada path target yang telah di-resolve.
- Environment child `exec` minimal secara default; teruskan variabel yang diperlukan secara eksplisit dengan `passEnv`.
- Ref secret di-resolve pada saat aktivasi ke dalam snapshot dalam memori, lalu path permintaan hanya membaca snapshot tersebut.
- Pemfilteran permukaan aktif berlaku saat aktivasi: ref yang tidak berhasil di-resolve pada permukaan yang aktif menyebabkan startup/reload gagal, sementara permukaan yang tidak aktif dilewati dengan diagnostik.

---

## Penyimpanan auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Profil per agen disimpan di `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` mendukung ref tingkat nilai (`keyRef` untuk `api_key`, `tokenRef` untuk `token`) untuk mode kredensial statis.
- Profil mode OAuth (`auth.profiles.<id>.mode = "oauth"`) tidak mendukung kredensial auth-profile berbasis SecretRef.
- Kredensial runtime statis berasal dari snapshot yang telah di-resolve di memori; entri `auth.json` statis lama dibersihkan saat ditemukan.
- Impor OAuth lama dari `~/.openclaw/credentials/oauth.json`.
- Lihat [OAuth](/id/concepts/oauth).
- Perilaku runtime secrets dan tooling `audit/configure/apply`: [Secrets Management](/id/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: backoff dasar dalam jam ketika sebuah profil gagal karena error penagihan/kredit tidak cukup yang benar-benar terjadi (default: `5`). Teks penagihan eksplisit masih dapat masuk ke sini bahkan pada respons `401`/`403`, tetapi matcher teks khusus provider tetap dibatasi pada provider yang memilikinya (misalnya OpenRouter `Key limit exceeded`). Pesan `402` retryable terkait jendela penggunaan atau batas pengeluaran organisasi/workspace tetap berada di jalur `rate_limit`.
- `billingBackoffHoursByProvider`: override per-provider opsional untuk jam backoff penagihan.
- `billingMaxHours`: batas maksimum dalam jam untuk pertumbuhan eksponensial backoff penagihan (default: `24`).
- `authPermanentBackoffMinutes`: backoff dasar dalam menit untuk kegagalan `auth_permanent` dengan keyakinan tinggi (default: `10`).
- `authPermanentMaxMinutes`: batas maksimum dalam menit untuk pertumbuhan backoff `auth_permanent` (default: `60`).
- `failureWindowHours`: jendela berjalan dalam jam yang digunakan untuk penghitung backoff (default: `24`).
- `overloadedProfileRotations`: jumlah maksimum rotasi auth-profile provider yang sama untuk error overload sebelum beralih ke fallback model (default: `1`). Bentuk provider-busy seperti `ModelNotReadyException` masuk ke sini.
- `overloadedBackoffMs`: jeda tetap sebelum mencoba ulang rotasi provider/profil yang overload (default: `0`).
- `rateLimitedProfileRotations`: jumlah maksimum rotasi auth-profile provider yang sama untuk error rate-limit sebelum beralih ke fallback model (default: `1`). Bucket rate-limit tersebut mencakup teks berbentuk provider seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, dan `resource exhausted`.

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- File log default: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Tetapkan `logging.file` untuk path yang stabil.
- `consoleLevel` naik ke `debug` ketika `--verbose`.
- `maxFileBytes`: ukuran file log maksimum dalam byte sebelum penulisan ditekan (integer positif; default: `524288000` = 500 MB). Gunakan rotasi log eksternal untuk deployment produksi.

---

## Diagnostik

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: sakelar utama untuk output instrumentasi (default: `true`).
- `flags`: array string flag yang mengaktifkan output log terarah (mendukung wildcard seperti `"telegram.*"` atau `"*"`).
- `stuckSessionWarnMs`: ambang usia dalam ms untuk mengeluarkan peringatan sesi macet saat sesi tetap berada dalam status pemrosesan.
- `otel.enabled`: mengaktifkan pipeline ekspor OpenTelemetry (default: `false`).
- `otel.endpoint`: URL collector untuk ekspor OTel.
- `otel.protocol`: `"http/protobuf"` (default) atau `"grpc"`.
- `otel.headers`: header metadata HTTP/gRPC tambahan yang dikirim bersama permintaan ekspor OTel.
- `otel.serviceName`: nama layanan untuk atribut resource.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktifkan ekspor trace, metrics, atau log.
- `otel.sampleRate`: tingkat sampling trace `0`–`1`.
- `otel.flushIntervalMs`: interval flush telemetri periodik dalam ms.
- `cacheTrace.enabled`: catat snapshot cache trace untuk eksekusi tertanam (default: `false`).
- `cacheTrace.filePath`: path output untuk JSONL cache trace (default: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: mengontrol apa yang disertakan dalam output cache trace (semuanya default: `true`).

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: channel rilis untuk instalasi npm/git — `"stable"`, `"beta"`, atau `"dev"`.
- `checkOnStart`: periksa pembaruan npm saat gateway dimulai (default: `true`).
- `auto.enabled`: aktifkan auto-update latar belakang untuk instalasi paket (default: `false`).
- `auto.stableDelayHours`: jeda minimum dalam jam sebelum auto-apply channel stable (default: `6`; maks: `168`).
- `auto.stableJitterHours`: jendela penyebaran rollout channel stable tambahan dalam jam (default: `12`; maks: `168`).
- `auto.betaCheckIntervalHours`: seberapa sering pemeriksaan channel beta dijalankan dalam jam (default: `1`; maks: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: gate fitur ACP global (default: `false`).
- `dispatch.enabled`: gate independen untuk dispatch giliran sesi ACP (default: `true`). Tetapkan `false` agar perintah ACP tetap tersedia sambil memblokir eksekusi.
- `backend`: id backend runtime ACP default (harus cocok dengan plugin runtime ACP terdaftar).
- `defaultAgent`: id agen target ACP fallback ketika spawn tidak menentukan target eksplisit.
- `allowedAgents`: allowlist id agen yang diizinkan untuk sesi runtime ACP; kosong berarti tidak ada pembatasan tambahan.
- `maxConcurrentSessions`: jumlah maksimum sesi ACP yang aktif secara bersamaan.
- `stream.coalesceIdleMs`: jendela flush idle dalam ms untuk teks terstream.
- `stream.maxChunkChars`: ukuran chunk maksimum sebelum proyeksi blok terstream dipecah.
- `stream.repeatSuppression`: tekan baris status/tool yang berulang per giliran (default: `true`).
- `stream.deliveryMode`: `"live"` melakukan streaming bertahap; `"final_only"` melakukan buffer hingga kejadian terminal giliran.
- `stream.hiddenBoundarySeparator`: pemisah sebelum teks yang terlihat setelah kejadian tool tersembunyi (default: `"paragraph"`).
- `stream.maxOutputChars`: karakter output asisten maksimum yang diproyeksikan per giliran ACP.
- `stream.maxSessionUpdateChars`: jumlah karakter maksimum untuk baris status/pembaruan ACP yang diproyeksikan.
- `stream.tagVisibility`: catatan nama tag ke override visibilitas boolean untuk kejadian terstream.
- `runtime.ttlMinutes`: TTL idle dalam menit untuk worker sesi ACP sebelum memenuhi syarat untuk dibersihkan.
- `runtime.installCommand`: perintah install opsional yang dijalankan saat bootstrap environment runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` mengontrol gaya tagline banner:
  - `"random"` (default): tagline lucu/musiman yang bergilir.
  - `"default"`: tagline netral tetap (`All your chats, one OpenClaw.`).
  - `"off"`: tanpa teks tagline (judul/versi banner tetap ditampilkan).
- Untuk menyembunyikan seluruh banner (bukan hanya tagline), tetapkan env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadata yang ditulis oleh alur setup terpandu CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identitas

Lihat field identitas `agents.list` di bawah [Default agen](#agent-defaults).

---

## Bridge (lama, dihapus)

Build saat ini tidak lagi menyertakan bridge TCP. Node terhubung melalui WebSocket Gateway. Kunci `bridge.*` tidak lagi menjadi bagian dari skema konfigurasi (validasi gagal sampai kunci tersebut dihapus; `openclaw doctor --fix` dapat menghapus kunci yang tidak dikenal).

<Accordion title="Konfigurasi bridge lama (referensi historis)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback deprecated untuk job tersimpan notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer opsional untuk auth webhook outbound
    sessionRetention: "24h", // string durasi atau false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 byte
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: berapa lama menyimpan sesi eksekusi cron terisolasi yang telah selesai sebelum dipangkas dari `sessions.json`. Juga mengontrol pembersihan arsip transkrip cron yang dihapus. Default: `24h`; tetapkan `false` untuk menonaktifkan.
- `runLog.maxBytes`: ukuran maksimum per file log eksekusi (`cron/runs/<jobId>.jsonl`) sebelum dipangkas. Default: `2_000_000` byte.
- `runLog.keepLines`: baris terbaru yang dipertahankan ketika pemangkasan log eksekusi dipicu. Default: `2000`.
- `webhookToken`: token bearer yang digunakan untuk pengiriman POST webhook Cron (`delivery.mode = "webhook"`), jika dihilangkan tidak ada header auth yang dikirim.
- `webhook`: URL webhook fallback lama yang sudah deprecated (http/https) dan hanya digunakan untuk job tersimpan yang masih memiliki `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: jumlah retry maksimum untuk job one-shot pada error sementara (default: `3`; rentang: `0`–`10`).
- `backoffMs`: array jeda backoff dalam ms untuk setiap percobaan retry (default: `[30000, 60000, 300000]`; 1–10 entri).
- `retryOn`: jenis error yang memicu retry — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Hilangkan untuk me-retry semua jenis sementara.

Hanya berlaku untuk job Cron one-shot. Job berulang menggunakan penanganan kegagalan terpisah.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: aktifkan peringatan kegagalan untuk job Cron (default: `false`).
- `after`: jumlah kegagalan beruntun sebelum peringatan dikirim (integer positif, min: `1`).
- `cooldownMs`: jumlah milidetik minimum di antara peringatan berulang untuk job yang sama (integer non-negatif).
- `mode`: mode pengiriman — `"announce"` mengirim melalui pesan channel; `"webhook"` mem-post ke webhook yang dikonfigurasi.
- `accountId`: id akun atau channel opsional untuk mencakup pengiriman peringatan.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Tujuan default untuk notifikasi kegagalan Cron di semua job.
- `mode`: `"announce"` atau `"webhook"`; default ke `"announce"` ketika data target yang cukup tersedia.
- `channel`: override channel untuk pengiriman announce. `"last"` menggunakan ulang channel pengiriman terakhir yang diketahui.
- `to`: target announce eksplisit atau URL webhook. Wajib untuk mode webhook.
- `accountId`: override akun opsional untuk pengiriman.
- `delivery.failureDestination` per-job mengoverride default global ini.
- Ketika tujuan kegagalan global maupun per-job tidak diatur, job yang sudah mengirim melalui `announce` akan fallback ke target announce utama tersebut saat gagal.
- `delivery.failureDestination` hanya didukung untuk job `sessionTarget="isolated"` kecuali `delivery.mode` utama job adalah `"webhook"`.

Lihat [Cron Jobs](/id/automation/cron-jobs). Eksekusi Cron terisolasi dilacak sebagai [background tasks](/id/automation/tasks).

---

## Variabel template model media

Placeholder template yang diperluas dalam `tools.media.models[].args`:

| Variable           | Deskripsi                                        |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Isi penuh pesan masuk                            |
| `{{RawBody}}`      | Isi mentah (tanpa wrapper riwayat/pengirim)      |
| `{{BodyStripped}}` | Isi dengan mention grup dihapus                  |
| `{{From}}`         | Identifier pengirim                              |
| `{{To}}`           | Identifier tujuan                                |
| `{{MessageSid}}`   | id pesan channel                                 |
| `{{SessionId}}`    | UUID sesi saat ini                               |
| `{{IsNewSession}}` | `"true"` ketika sesi baru dibuat                 |
| `{{MediaUrl}}`     | pseudo-URL media masuk                           |
| `{{MediaPath}}`    | path media lokal                                 |
| `{{MediaType}}`    | tipe media (image/audio/document/…)              |
| `{{Transcript}}`   | transkrip audio                                  |
| `{{Prompt}}`       | prompt media yang telah di-resolve untuk entri CLI |
| `{{MaxChars}}`     | jumlah karakter output maksimum yang telah di-resolve untuk entri CLI |
| `{{ChatType}}`     | `"direct"` atau `"group"`                        |
| `{{GroupSubject}}` | subjek grup (best effort)                        |
| `{{GroupMembers}}` | pratinjau anggota grup (best effort)             |
| `{{SenderName}}`   | nama tampilan pengirim (best effort)             |
| `{{SenderE164}}`   | nomor telepon pengirim (best effort)             |
| `{{Provider}}`     | petunjuk provider (whatsapp, telegram, discord, dll.) |

---

## Include konfigurasi (`$include`)

Pisahkan konfigurasi ke dalam beberapa file:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Perilaku penggabungan:**

- Satu file: menggantikan objek yang memuatnya.
- Array file: digabungkan secara mendalam sesuai urutan (yang belakangan mengoverride yang sebelumnya).
- Kunci sibling: digabungkan setelah include (mengoverride nilai yang di-include).
- Include bertingkat: hingga kedalaman 10 level.
- Path: di-resolve relatif terhadap file yang meng-include, tetapi harus tetap berada di dalam direktori konfigurasi tingkat atas (`dirname` dari `openclaw.json`). Bentuk absolut/`../` hanya diizinkan jika tetap di-resolve di dalam batas tersebut.
- Error: pesan yang jelas untuk file yang hilang, error parse, dan include melingkar.

---

_Terkait: [Konfigurasi](/id/gateway/configuration) · [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Doctor](/id/gateway/doctor)_
