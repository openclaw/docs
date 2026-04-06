---
read_when:
    - Anda membutuhkan semantik config atau nilai bawaan yang tepat di tingkat field
    - Anda sedang memvalidasi blok config channel, model, gateway, atau tool
summary: Referensi lengkap untuk setiap kunci config OpenClaw, nilai bawaan, dan pengaturan channel
title: Referensi Konfigurasi
x-i18n:
    generated_at: "2026-04-06T09:18:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ae6c19666f65433361e1c8b100ae710448c8aa055a60c140241a8aea09b98a5
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Referensi Konfigurasi

Setiap field yang tersedia di `~/.openclaw/openclaw.json`. Untuk gambaran umum yang berorientasi tugas, lihat [Configuration](/id/gateway/configuration).

Format config adalah **JSON5** (komentar + koma di akhir diperbolehkan). Semua field bersifat opsional — OpenClaw menggunakan nilai bawaan yang aman saat dihilangkan.

---

## Channel

Setiap channel dimulai secara otomatis ketika bagian config-nya ada (kecuali `enabled: false`).

### Akses DM dan grup

Semua channel mendukung kebijakan DM dan kebijakan grup:

| Kebijakan DM        | Perilaku                                                      |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (default) | Pengirim yang tidak dikenal mendapat kode pairing satu kali; owner harus menyetujui |
| `allowlist`         | Hanya pengirim di `allowFrom` (atau paired allow store)       |
| `open`              | Izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)        |
| `disabled`          | Abaikan semua DM masuk                                        |

| Kebijakan grup        | Perilaku                                             |
| --------------------- | ---------------------------------------------------- |
| `allowlist` (default) | Hanya grup yang cocok dengan allowlist yang dikonfigurasi |
| `open`                | Lewati allowlist grup (mention-gating tetap berlaku) |
| `disabled`            | Blokir semua pesan grup/room                         |

<Note>
`channels.defaults.groupPolicy` menetapkan default ketika `groupPolicy` milik provider tidak diatur.
Kode pairing kedaluwarsa setelah 1 jam. Permintaan pairing DM yang tertunda dibatasi hingga **3 per channel**.
Jika blok provider tidak ada sama sekali (`channels.<provider>` tidak ada), kebijakan grup runtime akan fallback ke `allowlist` (fail-closed) dengan peringatan saat startup.
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

### Default channel dan heartbeat

Gunakan `channels.defaults` untuk perilaku group-policy dan heartbeat bersama di seluruh provider:

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

- `channels.defaults.groupPolicy`: kebijakan grup fallback saat `groupPolicy` tingkat provider tidak diatur.
- `channels.defaults.contextVisibility`: mode visibilitas konteks tambahan default untuk semua channel. Nilai: `all` (default, sertakan semua konteks kutipan/thread/riwayat), `allowlist` (hanya sertakan konteks dari pengirim yang ada di allowlist), `allowlist_quote` (sama seperti allowlist tetapi pertahankan konteks kutipan/balasan eksplisit). Override per-channel: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sertakan status channel yang sehat dalam output heartbeat.
- `channels.defaults.heartbeat.showAlerts`: sertakan status yang menurun/error dalam output heartbeat.
- `channels.defaults.heartbeat.useIndicator`: render output heartbeat bergaya indikator yang ringkas.

### WhatsApp

WhatsApp berjalan melalui channel web gateway (Baileys Web). Channel ini dimulai secara otomatis saat sesi yang tertaut sudah ada.

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

<Accordion title="WhatsApp multi-account">

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

- Perintah outbound default ke akun `default` jika ada; jika tidak, ke id akun pertama yang dikonfigurasi (diurutkan).
- `channels.whatsapp.defaultAccount` opsional menggantikan pemilihan akun default fallback tersebut ketika cocok dengan id akun yang dikonfigurasi.
- Auth dir Baileys lama untuk single-account dimigrasikan oleh `openclaw doctor` ke `whatsapp/default`.
- Override per-account: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Jaga jawaban tetap singkat.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Tetap fokus pada topik.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Backup Git" },
        { command: "generate", description: "Buat gambar" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; aktifkan secara eksplisit untuk menghindari rate limit pratinjau-edit)
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
- `channels.telegram.defaultAccount` opsional menggantikan pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Dalam pengaturan multi-account (2+ id akun), tetapkan default eksplisit (`channels.telegram.defaultAccount` atau `channels.telegram.accounts.default`) untuk menghindari fallback routing; `openclaw doctor` memberi peringatan saat ini tidak ada atau tidak valid.
- `configWrites: false` memblokir penulisan config yang dipicu Telegram (migrasi ID supergroup, `/config set|unset`).
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk topik forum (gunakan `chatId:topic:topicId` kanonis di `match.peer.id`). Semantik field dibagikan di [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- Pratinjau stream Telegram menggunakan `sendMessage` + `editMessageText` (berfungsi di chat langsung dan grup).
- Kebijakan retry: lihat [Retry policy](/id/concepts/retry).

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
              systemPrompt: "Hanya jawaban singkat.",
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
- Panggilan outbound langsung yang menyediakan `token` Discord eksplisit menggunakan token tersebut untuk panggilan; pengaturan retry/kebijakan akun tetap berasal dari akun terpilih dalam snapshot runtime aktif.
- `channels.discord.defaultAccount` opsional menggantikan pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Gunakan `user:<id>` (DM) atau `channel:<id>` (channel guild) untuk target pengiriman; ID numerik biasa ditolak.
- Slug guild menggunakan huruf kecil dengan spasi diganti `-`; kunci channel menggunakan nama yang di-slug (tanpa `#`). Utamakan ID guild.
- Pesan yang ditulis bot diabaikan secara default. `allowBots: true` mengaktifkannya; gunakan `allowBots: "mentions"` untuk hanya menerima pesan bot yang menyebut bot (pesan sendiri tetap difilter).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (dan override channel) membuang pesan yang menyebut pengguna atau role lain tetapi tidak menyebut bot (tidak termasuk @everyone/@here).
- `maxLinesPerMessage` (default 17) membagi pesan yang tinggi meskipun di bawah 2000 karakter.
- `channels.discord.threadBindings` mengontrol routing yang terikat thread Discord:
  - `enabled`: override Discord untuk fitur sesi terikat thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan pengiriman/routing terikat)
  - `idleHours`: override Discord untuk auto-unfocus karena tidak aktif dalam jam (`0` menonaktifkan)
  - `maxAgeHours`: override Discord untuk usia maksimum keras dalam jam (`0` menonaktifkan)
  - `spawnSubagentSessions`: sakelar opt-in untuk pembuatan/pengikatan thread otomatis `sessions_spawn({ thread: true })`
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk channel dan thread (gunakan id channel/thread di `match.peer.id`). Semantik field dibagikan di [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` menetapkan warna aksen untuk container Discord components v2.
- `channels.discord.voice` mengaktifkan percakapan channel suara Discord dan override auto-join + TTS opsional.
- `channels.discord.voice.daveEncryption` dan `channels.discord.voice.decryptionFailureTolerance` diteruskan ke opsi DAVE `@discordjs/voice` (`true` dan `24` secara default).
- OpenClaw juga mencoba pemulihan voice receive dengan meninggalkan/bergabung kembali ke sesi suara setelah kegagalan dekripsi berulang.
- `channels.discord.streaming` adalah kunci mode stream kanonis. Nilai lama `streamMode` dan boolean `streaming` dimigrasikan otomatis.
- `channels.discord.autoPresence` memetakan ketersediaan runtime ke presence bot (healthy => online, degraded => idle, exhausted => dnd) dan memungkinkan override teks status opsional.
- `channels.discord.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan nama/tag yang dapat berubah (mode kompatibilitas break-glass).
- `channels.discord.execApprovals`: pengiriman approval exec native Discord dan otorisasi approver.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, approval exec aktif ketika approver dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Discord yang diizinkan menyetujui permintaan exec. Fallback ke `commands.ownerAllowFrom` ketika dihilangkan.
  - `agentFilter`: allowlist ID agent opsional. Hilangkan untuk meneruskan approval untuk semua agent.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt approval. `"dm"` (default) mengirim ke DM approver, `"channel"` mengirim ke channel asal, `"both"` mengirim ke keduanya. Saat target mencakup `"channel"`, tombol hanya bisa digunakan oleh approver yang berhasil di-resolve.
  - `cleanupAfterResolve`: ketika `true`, menghapus DM approval setelah approval, penolakan, atau timeout.

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
          systemPrompt: "Hanya jawaban singkat.",
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
      streaming: "partial", // off | partial | block | progress (mode pratinjau)
      nativeStreaming: true, // gunakan API streaming native Slack saat streaming=partial
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
- **HTTP mode** memerlukan `botToken` plus `signingSecret` (di root atau per-account).
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string plaintext
  atau objek SecretRef.
- Snapshot akun Slack mengekspos field sumber/status per-kredensial seperti
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, dan, dalam HTTP mode,
  `signingSecretStatus`. `configured_unavailable` berarti akun tersebut
  dikonfigurasi melalui SecretRef tetapi jalur command/runtime saat ini tidak dapat
  me-resolve nilai secret.
- `configWrites: false` memblokir penulisan config yang dipicu Slack.
- `channels.slack.defaultAccount` opsional menggantikan pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- `channels.slack.streaming` adalah kunci mode stream kanonis. Nilai lama `streamMode` dan boolean `streaming` dimigrasikan otomatis.
- Gunakan `user:<id>` (DM) atau `channel:<id>` untuk target pengiriman.

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

**Isolasi sesi thread:** `thread.historyScope` bersifat per-thread (default) atau dibagikan di seluruh channel. `thread.inheritParent` menyalin transkrip channel induk ke thread baru.

- `typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat balasan sedang berjalan, lalu menghapusnya saat selesai. Gunakan shortcode emoji Slack seperti `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: pengiriman approval exec native Slack dan otorisasi approver. Skema sama seperti Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID pengguna Slack), `agentFilter`, `sessionFilter`, dan `target` (`"dm"`, `"channel"`, atau `"both"`).

| Grup tindakan | Default | Catatan                |
| ------------- | ------- | ---------------------- |
| reactions     | enabled | React + daftar reaksi  |
| messages      | enabled | Baca/kirim/edit/hapus  |
| pins          | enabled | Pin/unpin/daftar       |
| memberInfo    | enabled | Info anggota           |
| emojiList     | enabled | Daftar emoji kustom    |

### Mattermost

Mattermost dikirim sebagai plugin: `openclaw plugins install @openclaw/mattermost`.

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

Mode chat: `oncall` (merespons saat @-mention, default), `onmessage` (setiap pesan), `onchar` (pesan yang diawali dengan prefiks pemicu).

Saat perintah native Mattermost diaktifkan:

- `commands.callbackPath` harus berupa path (misalnya `/api/channels/mattermost/command`), bukan URL lengkap.
- `commands.callbackUrl` harus me-resolve ke endpoint gateway OpenClaw dan dapat dijangkau dari server Mattermost.
- Callback slash native diautentikasi dengan token per-perintah yang dikembalikan
  oleh Mattermost saat pendaftaran slash command. Jika pendaftaran gagal atau tidak
  ada perintah yang diaktifkan, OpenClaw menolak callback dengan
  `Unauthorized: invalid command token.`
- Untuk host callback private/tailnet/internal, Mattermost mungkin memerlukan
  `ServiceSettings.AllowedUntrustedInternalConnections` untuk menyertakan host/domain callback.
  Gunakan nilai host/domain, bukan URL lengkap.
- `channels.mattermost.configWrites`: izinkan atau tolak penulisan config yang dipicu Mattermost.
- `channels.mattermost.requireMention`: memerlukan `@mention` sebelum membalas di channel.
- `channels.mattermost.groups.<channelId>.requireMention`: override mention-gating per-channel (`"*"` untuk default).
- `channels.mattermost.defaultAccount` opsional menggantikan pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

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

- `channels.signal.account`: pin startup channel ke identitas akun Signal tertentu.
- `channels.signal.configWrites`: izinkan atau tolak penulisan config yang dipicu Signal.
- `channels.signal.defaultAccount` opsional menggantikan pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

### BlueBubbles

BlueBubbles adalah jalur iMessage yang direkomendasikan (berbasis plugin, dikonfigurasi di bawah `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, kontrol grup, dan tindakan lanjutan:
      // lihat /channels/bluebubbles
    },
  },
}
```

- Jalur kunci inti yang dicakup di sini: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opsional menggantikan pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Entri `bindings[]` tingkat atas dengan `type: "acp"` dapat mengikat percakapan BlueBubbles ke sesi ACP persisten. Gunakan handle atau string target BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik field bersama: [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- Konfigurasi lengkap channel BlueBubbles didokumentasikan di [BlueBubbles](/id/channels/bluebubbles).

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

- `channels.imessage.defaultAccount` opsional menggantikan pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.

- Memerlukan Full Disk Access ke DB Messages.
- Utamakan target `chat_id:<id>`. Gunakan `imsg chats --limit 20` untuk melihat daftar chat.
- `cliPath` dapat menunjuk ke wrapper SSH; atur `remoteHost` (`host` atau `user@host`) untuk pengambilan lampiran SCP.
- `attachmentRoots` dan `remoteAttachmentRoots` membatasi path lampiran masuk (default: `/Users/*/Library/Messages/Attachments`).
- SCP menggunakan strict host-key checking, jadi pastikan host key relay sudah ada di `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: izinkan atau tolak penulisan config yang dipicu iMessage.
- Entri `bindings[]` tingkat atas dengan `type: "acp"` dapat mengikat percakapan iMessage ke sesi ACP persisten. Gunakan handle yang dinormalisasi atau target chat eksplisit (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik field bersama: [ACP Agents](/id/tools/acp-agents#channel-specific-settings).

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

- Auth token menggunakan `accessToken`; auth password menggunakan `userId` + `password`.
- `channels.matrix.proxy` merutekan traffic HTTP Matrix melalui proxy HTTP(S) eksplisit. Akun bernama dapat meng-override-nya dengan `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.allowPrivateNetwork` mengizinkan homeserver private/internal. `proxy` dan `allowPrivateNetwork` adalah kontrol yang independen.
- `channels.matrix.defaultAccount` memilih akun yang diprioritaskan dalam setup multi-account.
- `channels.matrix.execApprovals`: pengiriman approval exec native Matrix dan otorisasi approver.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, approval exec aktif ketika approver dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Matrix (mis. `@owner:example.org`) yang diizinkan menyetujui permintaan exec.
  - `agentFilter`: allowlist ID agent opsional. Hilangkan untuk meneruskan approval untuk semua agent.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt approval. `"dm"` (default), `"channel"` (room asal), atau `"both"`.
  - Override per-account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` mengontrol bagaimana DM Matrix dikelompokkan ke dalam sesi: `per-user` (default) dibagikan menurut peer yang dirutekan, sedangkan `per-room` mengisolasi setiap room DM.
- Probe status Matrix dan pencarian direktori live menggunakan kebijakan proxy yang sama dengan traffic runtime.
- Konfigurasi Matrix lengkap, aturan targeting, dan contoh setup didokumentasikan di [Matrix](/id/channels/matrix).

### Microsoft Teams

Microsoft Teams didukung extension dan dikonfigurasi di bawah `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, kebijakan team/channel:
      // lihat /channels/msteams
    },
  },
}
```

- Jalur kunci inti yang dicakup di sini: `channels.msteams`, `channels.msteams.configWrites`.
- Config Teams lengkap (kredensial, webhook, kebijakan DM/grup, override per-team/per-channel) didokumentasikan di [Microsoft Teams](/id/channels/msteams).

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

- Jalur kunci inti yang dicakup di sini: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` opsional menggantikan pemilihan akun default saat cocok dengan id akun yang dikonfigurasi.
- Konfigurasi channel IRC lengkap (host/port/TLS/channel/allowlist/mention gating) didokumentasikan di [IRC](/id/channels/irc).

### Multi-account (semua channel)

Jalankan beberapa akun per channel (masing-masing dengan `accountId` sendiri):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Bot utama",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Bot alert",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` digunakan saat `accountId` dihilangkan (CLI + routing).
- Token env hanya berlaku untuk akun **default**.
- Pengaturan channel dasar berlaku untuk semua akun kecuali dioverride per-account.
- Gunakan `bindings[].match.accountId` untuk merutekan setiap akun ke agent yang berbeda.
- Jika Anda menambahkan akun non-default melalui `openclaw channels add` (atau onboarding channel) saat masih berada pada config channel tingkat atas single-account, OpenClaw terlebih dahulu mempromosikan nilai single-account tingkat atas yang bersifat account-scoped ke peta akun channel agar akun asli tetap berfungsi. Sebagian besar channel memindahkannya ke `channels.<channel>.accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok.
- Binding channel-only yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default; binding account-scoped tetap opsional.
- `openclaw doctor --fix` juga memperbaiki bentuk campuran dengan memindahkan nilai single-account tingkat atas yang account-scoped ke akun hasil promosi yang dipilih untuk channel tersebut. Sebagian besar channel menggunakan `accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok.

### Channel extension lainnya

Banyak channel extension dikonfigurasi sebagai `channels.<id>` dan didokumentasikan di halaman channel khusus mereka (misalnya Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, dan Twitch).
Lihat indeks channel lengkap: [Channels](/id/channels).

### Mention gating chat grup

Pesan grup secara default **memerlukan mention** (mention metadata atau pola regex aman). Berlaku untuk chat grup WhatsApp, Telegram, Discord, Google Chat, dan iMessage.

**Jenis mention:**

- **Mention metadata**: @-mention native platform. Diabaikan dalam mode self-chat WhatsApp.
- **Pola teks**: pola regex aman di `agents.list[].groupChat.mentionPatterns`. Pola tidak valid dan repetisi bertingkat yang tidak aman diabaikan.
- Mention gating hanya ditegakkan ketika deteksi memungkinkan (mention native atau setidaknya satu pola).

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

`messages.groupChat.historyLimit` menetapkan default global. Channel dapat meng-override dengan `channels.<channel>.historyLimit` (atau per-account). Atur `0` untuk menonaktifkan.

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

Masukkan nomor Anda sendiri ke `allowFrom` untuk mengaktifkan mode self-chat (mengabaikan @-mention native, hanya merespons pola teks):

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

### Commands (penanganan chat command)

```json5
{
  commands: {
    native: "auto", // daftarkan perintah native saat didukung
    text: true, // parse /commands dalam pesan chat
    bash: false, // izinkan ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // izinkan /config
    debug: false, // izinkan /debug
    restart: false, // izinkan /restart + tool restart gateway
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Detail command">

- Text command harus berupa pesan **mandiri** dengan awalan `/`.
- `native: "auto"` mengaktifkan perintah native untuk Discord/Telegram, membiarkan Slack nonaktif.
- Override per channel: `channels.discord.commands.native` (bool atau `"auto"`). `false` menghapus perintah yang sebelumnya terdaftar.
- `channels.telegram.customCommands` menambahkan entri menu bot Telegram tambahan.
- `bash: true` mengaktifkan `! <cmd>` untuk shell host. Memerlukan `tools.elevated.enabled` dan pengirim ada di `tools.elevated.allowFrom.<channel>`.
- `config: true` mengaktifkan `/config` (membaca/menulis `openclaw.json`). Untuk klien gateway `chat.send`, penulisan persisten `/config set|unset` juga memerlukan `operator.admin`; `/config show` yang read-only tetap tersedia untuk klien operator normal dengan cakupan write.
- `channels.<provider>.configWrites` mengendalikan mutasi config per channel (default: true).
- Untuk channel multi-account, `channels.<provider>.accounts.<id>.configWrites` juga mengendalikan penulisan yang menargetkan akun tersebut (misalnya `/allowlist --config --account <id>` atau `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` bersifat per-provider. Saat diatur, ini adalah **satu-satunya** sumber otorisasi (allowlist/pairing channel dan `useAccessGroups` diabaikan).
- `useAccessGroups: false` memungkinkan command melewati kebijakan access-group ketika `allowFrom` tidak diatur.

</Accordion>

---

## Default agent

### `agents.defaults.workspace`

Default: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Root repositori opsional yang ditampilkan di baris Runtime pada system prompt. Jika tidak diatur, OpenClaw mendeteksi otomatis dengan menelusuri ke atas dari workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist skill default opsional untuk agent yang tidak menetapkan
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // mewarisi github, weather
      { id: "docs", skills: ["docs-search"] }, // menggantikan default
      { id: "locked-down", skills: [] }, // tanpa skill
    ],
  },
}
```

- Hilangkan `agents.defaults.skills` agar skill default tidak dibatasi.
- Hilangkan `agents.list[].skills` untuk mewarisi default.
- Atur `agents.list[].skills: []` untuk tanpa skill.
- Daftar `agents.list[].skills` yang tidak kosong adalah set final untuk agent tersebut; tidak digabung dengan default.

### `agents.defaults.skipBootstrap`

Menonaktifkan pembuatan otomatis file bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Mengontrol kapan file bootstrap workspace disuntikkan ke system prompt. Default: `"always"`.

- `"continuation-skip"`: giliran kelanjutan yang aman (setelah respons assistant selesai) melewati injeksi ulang bootstrap workspace, sehingga ukuran prompt berkurang. Jalankan heartbeat dan retry pasca-compaction tetap membangun ulang konteks.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Karakter maksimum per file bootstrap workspace sebelum dipotong. Default: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Total karakter maksimum yang disuntikkan di seluruh file bootstrap workspace. Default: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Mengontrol teks peringatan yang terlihat oleh agent saat konteks bootstrap dipotong.
Default: `"once"`.

- `"off"`: jangan pernah menyuntikkan teks peringatan ke system prompt.
- `"once"`: suntikkan peringatan sekali per signature pemotongan unik (direkomendasikan).
- `"always"`: suntikkan peringatan pada setiap eksekusi saat ada pemotongan.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Ukuran piksel maksimum untuk sisi gambar terpanjang pada blok gambar transkrip/tool sebelum pemanggilan provider.
Default: `1200`.

Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload permintaan untuk eksekusi yang banyak screenshot.
Nilai yang lebih tinggi mempertahankan detail visual lebih banyak.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Timezone untuk konteks system prompt (bukan timestamp pesan). Fallback ke timezone host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format waktu di system prompt. Default: `auto` (preferensi OS).

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
      params: { cacheRetention: "long" }, // param provider default global
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
  - Bentuk objek menetapkan primary plus model failover berurutan.
- `imageModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh jalur tool `image` sebagai config model vision-nya.
  - Juga digunakan sebagai routing fallback saat model yang dipilih/default tidak dapat menerima input gambar.
- `imageGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kemampuan pembuatan gambar bersama dan setiap permukaan tool/plugin masa depan yang menghasilkan gambar.
  - Nilai umum: `google/gemini-3.1-flash-image-preview` untuk pembuatan gambar Gemini native, `fal/fal-ai/flux/dev` untuk fal, atau `openai/gpt-image-1` untuk OpenAI Images.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga auth/API key provider yang sesuai (misalnya `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk `google/*`, `OPENAI_API_KEY` untuk `openai/*`, `FAL_KEY` untuk `fal/*`).
  - Jika dihilangkan, `image_generate` tetap dapat menyimpulkan default provider yang memiliki auth. Ia mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan gambar terdaftar lainnya dalam urutan provider-id.
- `musicGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kemampuan pembuatan musik bersama dan tool bawaan `music_generate`.
  - Nilai umum: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, atau `minimax/music-2.5+`.
  - Jika dihilangkan, `music_generate` tetap dapat menyimpulkan default provider yang memiliki auth. Ia mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan musik terdaftar lainnya dalam urutan provider-id.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga auth/API key provider yang sesuai.
- `videoGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kemampuan pembuatan video bersama dan tool bawaan `video_generate`.
  - Nilai umum: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, atau `qwen/wan2.7-r2v`.
  - Jika dihilangkan, `video_generate` tetap dapat menyimpulkan default provider yang memiliki auth. Ia mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan video terdaftar lainnya dalam urutan provider-id.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga auth/API key provider yang sesuai.
  - Provider pembuatan video Qwen bawaan saat ini mendukung hingga 1 video output, 1 gambar input, 4 video input, durasi 10 detik, serta opsi tingkat provider `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`.
- `pdfModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh tool `pdf` untuk routing model.
  - Jika dihilangkan, tool PDF fallback ke `imageModel`, lalu ke model sesi/default yang berhasil di-resolve.
- `pdfMaxBytesMb`: batas ukuran PDF default untuk tool `pdf` saat `maxBytesMb` tidak diberikan pada waktu pemanggilan.
- `pdfMaxPages`: jumlah halaman maksimum default yang dipertimbangkan oleh mode fallback ekstraksi di tool `pdf`.
- `verboseDefault`: level verbose default untuk agent. Nilai: `"off"`, `"on"`, `"full"`. Default: `"off"`.
- `elevatedDefault`: level output elevated default untuk agent. Nilai: `"off"`, `"on"`, `"ask"`, `"full"`. Default: `"on"`.
- `model.primary`: format `provider/model` (mis. `openai/gpt-5.4`). Jika Anda menghilangkan provider, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan unik configured-provider untuk model id persis tersebut, dan baru setelah itu fallback ke provider default yang dikonfigurasi (perilaku kompatibilitas lama yang tidak dianjurkan, jadi utamakan `provider/model` eksplisit). Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw fallback ke provider/model terkonfigurasi pertama alih-alih menampilkan default provider lama yang sudah dihapus.
- `models`: katalog model yang dikonfigurasi dan allowlist untuk `/model`. Setiap entri dapat menyertakan `alias` (shortcut) dan `params` (khusus provider, misalnya `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parameter provider default global yang diterapkan ke semua model. Diatur di `agents.defaults.params` (mis. `{ cacheRetention: "long" }`).
- Prioritas penggabungan `params` (config): `agents.defaults.params` (basis global) dioverride oleh `agents.defaults.models["provider/model"].params` (per-model), lalu `agents.list[].params` (id agent yang cocok) mengoverride berdasarkan key. Lihat [Prompt Caching](/id/reference/prompt-caching) untuk detail.
- Penulis config yang memutasi field ini (misalnya `/models set`, `/models set-image`, dan perintah tambah/hapus fallback) menyimpan bentuk objek kanonis dan mempertahankan daftar fallback yang ada bila memungkinkan.
- `maxConcurrent`: jumlah maksimum eksekusi agent paralel di seluruh sesi (setiap sesi tetap diserialisasi). Default: 4.

**Singkatan alias bawaan** (hanya berlaku saat model ada di `agents.defaults.models`):

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

Alias yang Anda konfigurasi selalu menang atas default.

Model Z.AI GLM-4.x otomatis mengaktifkan mode thinking kecuali Anda menetapkan `--thinking off` atau mendefinisikan sendiri `agents.defaults.models["zai/<model>"].params.thinking`.
Model Z.AI mengaktifkan `tool_stream` secara default untuk streaming tool call. Atur `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
Model Anthropic Claude 4.6 secara default menggunakan thinking `adaptive` ketika tidak ada level thinking eksplisit yang ditetapkan.

- Sesi didukung saat `sessionArg` diatur.
- Pass-through gambar didukung saat `imageArg` menerima path file.

### `agents.defaults.heartbeat`

Eksekusi heartbeat periodik.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m menonaktifkan
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true hanya menyimpan HEARTBEAT.md dari file bootstrap workspace
        isolatedSession: false, // default: false; true menjalankan setiap heartbeat dalam sesi baru (tanpa riwayat percakapan)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | opsi: last | whatsapp | telegram | discord | ...
        prompt: "Baca HEARTBEAT.md jika ada...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: string durasi (ms/s/m/h). Default: `30m` (auth API-key) atau `1h` (auth OAuth). Atur ke `0m` untuk menonaktifkan.
- `suppressToolErrorWarnings`: ketika true, menekan payload peringatan error tool selama eksekusi heartbeat.
- `directPolicy`: kebijakan pengiriman direct/DM. `allow` (default) mengizinkan pengiriman direct-target. `block` menekan pengiriman direct-target dan mengeluarkan `reason=dm-blocked`.
- `lightContext`: ketika true, eksekusi heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
- `isolatedSession`: ketika true, setiap heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Pola isolasi sama seperti cron `sessionTarget: "isolated"`. Mengurangi biaya token per-heartbeat dari ~100K menjadi ~2-5K token.
- Per-agent: atur `agents.list[].heartbeat`. Ketika ada agent yang mendefinisikan `heartbeat`, **hanya agent tersebut** yang menjalankan heartbeat.
- Heartbeat menjalankan giliran agent penuh — interval yang lebih pendek membakar lebih banyak token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Pertahankan deployment ID, ticket ID, dan pasangan host:port persis seperti aslinya.", // digunakan saat identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] menonaktifkan reinjeksi
        model: "openrouter/anthropic/claude-sonnet-4-6", // override model khusus compaction opsional
        notifyUser: true, // kirim pemberitahuan singkat saat compaction dimulai (default: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Sesi mendekati compaction. Simpan memori yang tahan lama sekarang.",
          prompt: "Tulis catatan yang bertahan lama ke memory/YYYY-MM-DD.md; balas dengan token senyap persis NO_REPLY jika tidak ada yang perlu disimpan.",
        },
      },
    },
  },
}
```

- `mode`: `default` atau `safeguard` (ringkasan bertahap untuk riwayat panjang). Lihat [Compaction](/id/concepts/compaction).
- `timeoutSeconds`: maksimum detik yang diizinkan untuk satu operasi compaction sebelum OpenClaw membatalkannya. Default: `900`.
- `identifierPolicy`: `strict` (default), `off`, atau `custom`. `strict` menambahkan panduan bawaan untuk mempertahankan identifier opak selama ringkasan compaction.
- `identifierInstructions`: teks khusus opsional untuk mempertahankan identifier saat `identifierPolicy=custom`.
- `postCompactionSections`: nama bagian H2/H3 `AGENTS.md` opsional untuk diinjeksi ulang setelah compaction. Default ke `["Session Startup", "Red Lines"]`; atur `[]` untuk menonaktifkan reinjeksi. Ketika tidak diatur atau secara eksplisit diatur ke pasangan default tersebut, heading lama `Every Session`/`Safety` juga diterima sebagai fallback lama.
- `model`: override `provider/model-id` opsional khusus untuk ringkasan compaction. Gunakan ini ketika sesi utama harus tetap menggunakan satu model tetapi ringkasan compaction harus berjalan pada model lain; jika tidak diatur, compaction menggunakan model primary sesi.
- `notifyUser`: ketika `true`, mengirim pemberitahuan singkat ke pengguna saat compaction dimulai (misalnya, "Compacting context..."). Dinonaktifkan secara default agar compaction tetap senyap.
- `memoryFlush`: giliran agentic senyap sebelum auto-compaction untuk menyimpan memori yang tahan lama. Dilewati saat workspace bersifat read-only.

### `agents.defaults.contextPruning`

Memangkas **hasil tool lama** dari konteks in-memory sebelum dikirim ke LLM. **Tidak** memodifikasi riwayat sesi di disk.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // durasi (ms/s/m/h), satuan default: menit
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Konten hasil tool lama dibersihkan]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Perilaku mode cache-ttl">

- `mode: "cache-ttl"` mengaktifkan proses pruning.
- `ttl` mengontrol seberapa sering pruning dapat berjalan lagi (setelah sentuhan cache terakhir).
- Pruning terlebih dahulu melakukan soft-trim pada hasil tool yang terlalu besar, lalu hard-clear pada hasil tool lama jika diperlukan.

**Soft-trim** mempertahankan awal + akhir dan menyisipkan `...` di tengah.

**Hard-clear** mengganti seluruh hasil tool dengan placeholder.

Catatan:

- Blok gambar tidak pernah dipangkas/dibersihkan.
- Rasio berbasis karakter (perkiraan), bukan jumlah token yang presisi.
- Jika ada lebih sedikit dari `keepLastAssistants` pesan assistant, pruning dilewati.

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
      humanDelay: { mode: "natural" }, // off | natural | custom (gunakan minMs/maxMs)
    },
  },
}
```

- Channel non-Telegram memerlukan `*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
- Override channel: `channels.<channel>.blockStreamingCoalesce` (dan varian per-account). Signal/Slack/Discord/Google Chat default `minChars: 1500`.
- `humanDelay`: jeda acak antara balasan blok. `natural` = 800–2500 ms. Override per-agent: `agents.list[].humanDelay`.

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

- Default: `instant` untuk chat langsung/mention, `message` untuk grup tanpa mention.
- Override per-sesi: `session.typingMode`, `session.typingIntervalSeconds`.

Lihat [Typing Indicators](/id/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opsional untuk embedded agent. Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap.

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
          // SecretRef / konten inline juga didukung:
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
- `ssh`: runtime remote berbasis SSH generik
- `openshell`: runtime OpenShell

Ketika `backend: "openshell"` dipilih, pengaturan khusus runtime dipindahkan ke
`plugins.entries.openshell.config`.

**Config backend SSH:**

- `target`: target SSH dalam bentuk `user@host[:port]`
- `command`: perintah klien SSH (default: `ssh`)
- `workspaceRoot`: root remote absolut yang digunakan untuk workspace per-scope
- `identityFile` / `certificateFile` / `knownHostsFile`: file lokal yang sudah ada dan diteruskan ke OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: konten inline atau SecretRef yang dimaterialisasi OpenClaw menjadi file sementara saat runtime
- `strictHostKeyChecking` / `updateHostKeys`: knob kebijakan host-key OpenSSH

**Prioritas auth SSH:**

- `identityData` menang atas `identityFile`
- `certificateData` menang atas `certificateFile`
- `knownHostsData` menang atas `knownHostsFile`
- Nilai `*Data` berbasis SecretRef di-resolve dari snapshot runtime secret aktif sebelum sesi sandbox dimulai

**Perilaku backend SSH:**

- melakukan seed workspace remote sekali setelah pembuatan atau pembuatan ulang
- lalu mempertahankan workspace SSH remote sebagai kanonis
- merutekan `exec`, file tool, dan path media melalui SSH
- tidak menyinkronkan perubahan remote kembali ke host secara otomatis
- tidak mendukung container browser sandbox

**Akses workspace:**

- `none`: workspace sandbox per-scope di bawah `~/.openclaw/sandboxes`
- `ro`: workspace sandbox di `/workspace`, workspace agent di-mount read-only di `/agent`
- `rw`: workspace agent di-mount baca/tulis di `/workspace`

**Scope:**

- `session`: container + workspace per-sesi
- `agent`: satu container + workspace per-agent (default)
- `shared`: container dan workspace bersama (tanpa isolasi lintas sesi)

**Config plugin OpenShell:**

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
          gateway: "lab", // opsional
          gatewayEndpoint: "https://lab.example", // opsional
          policy: "strict", // id kebijakan OpenShell opsional
          providers: ["openai"], // opsional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Mode OpenShell:**

- `mirror`: seed remote dari lokal sebelum exec, sinkronkan kembali setelah exec; workspace lokal tetap kanonis
- `remote`: seed remote sekali saat sandbox dibuat, lalu pertahankan workspace remote sebagai kanonis

Dalam mode `remote`, edit host-lokal yang dibuat di luar OpenClaw tidak disinkronkan ke sandbox secara otomatis setelah langkah seed.
Transport menggunakan SSH ke sandbox OpenShell, tetapi plugin yang memiliki lifecycle sandbox dan sinkronisasi mirror opsional.

**`setupCommand`** berjalan sekali setelah pembuatan container (melalui `sh -lc`). Memerlukan network egress, root yang dapat ditulis, dan user root.

**Container default ke `network: "none"`** — atur ke `"bridge"` (atau jaringan bridge kustom) jika agent memerlukan akses keluar.
`"host"` diblokir. `"container:<id>"` diblokir secara default kecuali Anda secara eksplisit mengatur
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Lampiran masuk** di-stage ke `media/inbound/*` di workspace aktif.

**`docker.binds`** me-mount direktori host tambahan; bind global dan per-agent digabungkan.

**Browser tersandbox** (`sandbox.browser.enabled`): Chromium + CDP di dalam container. URL noVNC disuntikkan ke system prompt. Tidak memerlukan `browser.enabled` di `openclaw.json`.
Akses pengamat noVNC menggunakan auth VNC secara default dan OpenClaw mengeluarkan URL token jangka pendek (bukan mengekspos password di URL bersama).

- `allowHostControl: false` (default) memblokir sesi tersandbox agar tidak menargetkan browser host.
- `network` default ke `openclaw-sandbox-browser` (jaringan bridge khusus). Atur ke `bridge` hanya bila Anda memang ingin konektivitas bridge global.
- `cdpSourceRange` secara opsional membatasi ingress CDP di tepi container ke rentang CIDR (misalnya `172.21.0.1/32`).
- `sandbox.browser.binds` me-mount direktori host tambahan hanya ke container browser sandbox. Saat diatur (termasuk `[]`), ia menggantikan `docker.binds` untuk container browser.
- Default peluncuran didefinisikan di `scripts/sandbox-browser-entrypoint.sh` dan di-tune untuk host container:
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
  - `--disable-extensions` (default diaktifkan)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, dan `--disable-gpu`
    diaktifkan secara default dan dapat dinonaktifkan dengan
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika penggunaan WebGL/3D membutuhkannya.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` mengaktifkan kembali extension jika alur kerja Anda
    bergantung padanya.
  - `--renderer-process-limit=2` dapat diubah dengan
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; atur `0` untuk menggunakan
    batas proses default Chromium.
  - plus `--no-sandbox` dan `--disable-setuid-sandbox` saat `noSandbox` diaktifkan.
  - Default adalah baseline image container; gunakan image browser kustom dengan
    entrypoint kustom untuk mengubah default container.

</Accordion>

Browser sandboxing dan `sandbox.docker.binds` saat ini hanya untuk Docker.

Build image:

```bash
scripts/sandbox-setup.sh           # image sandbox utama
scripts/sandbox-browser-setup.sh   # image browser opsional
```

### `agents.list` (override per-agent)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Agent Utama",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // atau { primary, fallbacks }
        thinkingDefault: "high", // override level thinking per-agent
        reasoningDefault: "on", // override visibilitas reasoning per-agent
        fastModeDefault: false, // override fast mode per-agent
        params: { cacheRetention: "none" }, // mengoverride matching defaults.models params berdasarkan key
        skills: ["docs-search"], // menggantikan agents.defaults.skills saat diatur
        identity: {
          name: "Samantha",
          theme: "sloth yang membantu",
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

- `id`: id agent stabil (wajib).
- `default`: saat ada beberapa yang diatur, yang pertama menang (peringatan dicatat). Jika tidak ada yang diatur, entri daftar pertama adalah default.
- `model`: bentuk string hanya mengoverride `primary`; bentuk objek `{ primary, fallbacks }` mengoverride keduanya (`[]` menonaktifkan fallback global). Cron job yang hanya mengoverride `primary` tetap mewarisi fallback default kecuali Anda menetapkan `fallbacks: []`.
- `params`: stream params per-agent yang digabungkan di atas entri model terpilih dalam `agents.defaults.models`. Gunakan ini untuk override khusus agent seperti `cacheRetention`, `temperature`, atau `maxTokens` tanpa menduplikasi seluruh katalog model.
- `skills`: allowlist skill per-agent opsional. Jika dihilangkan, agent mewarisi `agents.defaults.skills` bila diatur; daftar eksplisit menggantikan default alih-alih digabung, dan `[]` berarti tanpa skill.
- `thinkingDefault`: default level thinking per-agent opsional (`off | minimal | low | medium | high | xhigh | adaptive`). Mengoverride `agents.defaults.thinkingDefault` untuk agent ini saat tidak ada override per-pesan atau per-sesi.
- `reasoningDefault`: default visibilitas reasoning per-agent opsional (`on | off | stream`). Berlaku saat tidak ada override reasoning per-pesan atau per-sesi.
- `fastModeDefault`: default fast mode per-agent opsional (`true | false`). Berlaku saat tidak ada override fast-mode per-pesan atau per-sesi.
- `runtime`: deskriptor runtime per-agent opsional. Gunakan `type: "acp"` dengan default `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) saat agent harus default ke sesi harness ACP.
- `identity.avatar`: path relatif workspace, URL `http(s)`, atau URI `data:`.
- `identity` menurunkan default: `ackReaction` dari `emoji`, `mentionPatterns` dari `name`/`emoji`.
- `subagents.allowAgents`: allowlist id agent untuk `sessions_spawn` (`["*"]` = apa saja; default: hanya agent yang sama).
- Guard pewarisan sandbox: jika sesi peminta disandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `subagents.requireAgentId`: ketika true, blokir pemanggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit; default: false).

---

## Routing multi-agent

Jalankan beberapa agent terisolasi di dalam satu Gateway. Lihat [Multi-Agent](/id/concepts/multi-agent).

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

- `type` (opsional): `route` untuk routing normal (type yang hilang default ke route), `acp` untuk binding percakapan ACP persisten.
- `match.channel` (wajib)
- `match.accountId` (opsional; `*` = akun apa saja; dihilangkan = akun default)
- `match.peer` (opsional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opsional; khusus channel)
- `acp` (opsional; hanya untuk entri `type: "acp"`): `{ mode, label, cwd, backend }`

**Urutan kecocokan deterministik:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (persis, tanpa peer/guild/team)
5. `match.accountId: "*"` (cakupan seluruh channel)
6. Agent default

Di dalam setiap tingkat, entri `bindings` pertama yang cocok akan menang.

Untuk entri `type: "acp"`, OpenClaw me-resolve berdasarkan identitas percakapan yang persis (`match.channel` + akun + `match.peer.id`) dan tidak menggunakan urutan tingkat route binding di atas.

### Profil akses per-agent

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

<Accordion title="Tool + workspace read-only">

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

<Accordion title="Tanpa akses filesystem (hanya messaging)">

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
    parentForkMaxTokens: 100000, // lewati fork parent-thread di atas jumlah token ini (0 menonaktifkan)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durasi atau false
      maxDiskBytes: "500mb", // hard budget opsional
      highWaterBytes: "400mb", // target cleanup opsional
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default auto-unfocus karena tidak aktif dalam jam (`0` menonaktifkan)
      maxAgeHours: 0, // default usia maksimum keras dalam jam (`0` menonaktifkan)
    },
    mainKey: "main", // lama (runtime selalu menggunakan "main")
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
  - `per-sender` (default): setiap pengirim mendapat sesi terisolasi di dalam konteks channel.
  - `global`: semua peserta dalam konteks channel berbagi satu sesi (gunakan hanya bila konteks bersama memang diinginkan).
- **`dmScope`**: bagaimana DM dikelompokkan.
  - `main`: semua DM berbagi sesi utama.
  - `per-peer`: diisolasi berdasarkan id pengirim lintas channel.
  - `per-channel-peer`: diisolasi per channel + pengirim (direkomendasikan untuk inbox multi-pengguna).
  - `per-account-channel-peer`: diisolasi per akun + channel + pengirim (direkomendasikan untuk multi-account).
- **`identityLinks`**: peta id kanonis ke peer berawalan provider untuk berbagi sesi lintas channel.
- **`reset`**: kebijakan reset utama. `daily` melakukan reset pada `atHour` waktu lokal; `idle` melakukan reset setelah `idleMinutes`. Saat keduanya dikonfigurasi, yang kedaluwarsa lebih dulu akan menang.
- **`resetByType`**: override per-jenis (`direct`, `group`, `thread`). `dm` lama diterima sebagai alias untuk `direct`.
- **`parentForkMaxTokens`**: jumlah maksimum `totalTokens` sesi induk yang diizinkan saat membuat sesi thread bercabang (default `100000`).
  - Jika `totalTokens` parent di atas nilai ini, OpenClaw memulai sesi thread baru alih-alih mewarisi riwayat transkrip parent.
  - Atur `0` untuk menonaktifkan guard ini dan selalu mengizinkan fork parent.
- **`mainKey`**: field lama. Runtime sekarang selalu menggunakan `"main"` untuk bucket chat langsung utama.
- **`agentToAgent.maxPingPongTurns`**: jumlah maksimum giliran balas-balik antar agent selama pertukaran agent-ke-agent (integer, rentang: `0`–`5`). `0` menonaktifkan rantai ping-pong.
- **`sendPolicy`**: cocokkan berdasarkan `channel`, `chatType` (`direct|group|channel`, dengan alias lama `dm`), `keyPrefix`, atau `rawKeyPrefix`. Deny pertama menang.
- **`maintenance`**: kontrol cleanup + retensi session-store.
  - `mode`: `warn` hanya mengeluarkan peringatan; `enforce` menerapkan cleanup.
  - `pruneAfter`: batas usia untuk entri basi (default `30d`).
  - `maxEntries`: jumlah maksimum entri di `sessions.json` (default `500`).
  - `rotateBytes`: rotasi `sessions.json` saat melebihi ukuran ini (default `10mb`).
  - `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>`. Default ke `pruneAfter`; atur `false` untuk menonaktifkan.
  - `maxDiskBytes`: budget disk direktori sesi opsional. Dalam mode `warn` akan mencatat peringatan; dalam mode `enforce` akan menghapus artefak/sesi paling lama terlebih dahulu.
  - `highWaterBytes`: target opsional setelah cleanup budget. Default ke `80%` dari `maxDiskBytes`.
- **`threadBindings`**: default global untuk fitur sesi terikat thread.
  - `enabled`: sakelar default utama (provider dapat mengoverride; Discord menggunakan `channels.discord.threadBindings.enabled`)
  - `idleHours`: default auto-unfocus karena tidak aktif dalam jam (`0` menonaktifkan; provider dapat mengoverride)
  - `maxAgeHours`: default usia maksimum keras dalam jam (`0` menonaktifkan; provider dapat mengoverride)

</Accordion>

---

## Pesan

```json5
{
  messages: {
    responsePrefix: "🦞", // atau "auto"
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
      debounceMs: 2000, // 0 menonaktifkan
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefiks respons

Override per-channel/account: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolusi (yang paling spesifik menang): account → channel → global. `""` menonaktifkan dan menghentikan cascade. `"auto"` menurunkan `[{identity.name}]`.

**Variabel template:**

| Variabel          | Deskripsi              | Contoh                      |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nama model singkat     | `claude-opus-4-6`           |
| `{modelFull}`     | Identifier model penuh | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nama provider          | `anthropic`                 |
| `{thinkingLevel}` | Level thinking saat ini | `high`, `low`, `off`       |
| `{identity.name}` | Nama identitas agent   | (sama seperti `"auto"`)     |

Variabel tidak peka huruf besar/kecil. `{think}` adalah alias untuk `{thinkingLevel}`.

### Reaksi ack

- Default ke `identity.emoji` agent aktif, jika tidak `"👀"`. Atur `""` untuk menonaktifkan.
- Override per-channel: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Urutan resolusi: account → channel → `messages.ackReaction` → fallback identity.
- Scope: `group-mentions` (default), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: menghapus ack setelah balasan pada Slack, Discord, dan Telegram.
- `messages.statusReactions.enabled`: mengaktifkan reaksi status siklus hidup pada Slack, Discord, dan Telegram.
  Pada Slack dan Discord, saat tidak diatur, status reaction tetap aktif ketika ack reaction aktif.
  Pada Telegram, atur secara eksplisit ke `true` untuk mengaktifkan reaksi status siklus hidup.

### Debounce inbound

Menggabungkan pesan teks cepat dari pengirim yang sama menjadi satu giliran agent. Media/lampiran langsung melakukan flush. Command kontrol melewati debouncing.

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

- `auto` mengontrol auto-TTS. `/tts off|always|inbound|tagged` mengoverride per sesi.
- `summaryModel` mengoverride `agents.defaults.model.primary` untuk ringkasan otomatis.
- `modelOverrides` diaktifkan secara default; `modelOverrides.allowProvider` default ke `false` (opt-in).
- API key fallback ke `ELEVENLABS_API_KEY`/`XI_API_KEY` dan `OPENAI_API_KEY`.
- `openai.baseUrl` mengoverride endpoint OpenAI TTS. Urutan resolusi adalah config, lalu `OPENAI_TTS_BASE_URL`, lalu `https://api.openai.com/v1`.
- Saat `openai.baseUrl` mengarah ke endpoint non-OpenAI, OpenClaw memperlakukannya sebagai server TTS kompatibel OpenAI dan melonggarkan validasi model/voice.

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
- Kunci Talk flat lama (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) hanya untuk kompatibilitas dan dimigrasikan otomatis ke `talk.providers.<provider>`.
- Voice ID fallback ke `ELEVENLABS_VOICE_ID` atau `SAG_VOICE_ID`.
- `providers.*.apiKey` menerima string plaintext atau objek SecretRef.
- Fallback `ELEVENLABS_API_KEY` hanya berlaku ketika tidak ada API key Talk yang dikonfigurasi.
- `providers.*.voiceAliases` memungkinkan directive Talk menggunakan nama yang ramah.
- `silenceTimeoutMs` mengontrol berapa lama mode Talk menunggu setelah pengguna diam sebelum mengirim transkrip. Jika tidak diatur, jendela jeda default platform tetap dipakai (`700 ms di macOS dan Android, 900 ms di iOS`).

---

## Tool

### Profil tool

`tools.profile` menetapkan allowlist dasar sebelum `tools.allow`/`tools.deny`:

Onboarding lokal secara default mengatur config lokal baru ke `tools.profile: "coding"` saat tidak diatur (profil eksplisit yang sudah ada dipertahankan).

| Profil      | Mencakup                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | hanya `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Tidak ada pembatasan (sama seperti tidak diatur)                                                                                |

### Grup tool

| Grup               | Tool                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` diterima sebagai alias untuk `exec`)                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | Semua tool bawaan (tidak termasuk plugin provider)                                                                     |

### `tools.allow` / `tools.deny`

Kebijakan global izinkan/tolak tool (deny menang). Tidak peka huruf besar/kecil, mendukung wildcard `*`. Diterapkan bahkan saat sandbox Docker nonaktif.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Lebih lanjut membatasi tool untuk provider atau model tertentu. Urutan: profil dasar → profil provider → allow/deny.

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

- Override per-agent (`agents.list[].tools.elevated`) hanya dapat membatasi lebih jauh.
- `/elevated on|off|ask|full` menyimpan status per sesi; directive inline berlaku untuk satu pesan.
- `exec` elevated melewati sandboxing dan menggunakan jalur escape yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).

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

Pemeriksaan keamanan loop tool **dinonaktifkan secara default**. Atur `enabled: true` untuk mengaktifkan deteksi.
Pengaturan dapat didefinisikan secara global di `tools.loopDetection` dan dioverride per-agent di `agents.list[].tools.loopDetection`.

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

- `historySize`: jumlah maksimum riwayat tool-call yang disimpan untuk analisis loop.
- `warningThreshold`: ambang pola tanpa progres berulang untuk peringatan.
- `criticalThreshold`: ambang berulang yang lebih tinggi untuk memblokir loop kritis.
- `globalCircuitBreakerThreshold`: ambang hard stop untuk setiap eksekusi tanpa progres.
- `detectors.genericRepeat`: peringatkan pada panggilan tool/argumen yang sama berulang.
- `detectors.knownPollNoProgress`: peringatkan/blokir pada tool poll yang dikenal (`process.poll`, `command_status`, dll.).
- `detectors.pingPong`: peringatkan/blokir pada pola pasangan bergantian tanpa progres.
- Jika `warningThreshold >= criticalThreshold` atau `criticalThreshold >= globalCircuitBreakerThreshold`, validasi gagal.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // atau env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opsional; hilangkan untuk auto-detect
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
        directSend: false, // opt-in: kirim musik/video async yang selesai langsung ke channel
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
- `model`: override model id
- `profile` / `preferredProfile`: pemilihan profil `auth-profiles.json`

**Entri CLI** (`type: "cli"`):

- `command`: executable yang dijalankan
- `args`: argumen bertemplate (mendukung `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, dll.)

**Field umum:**

- `capabilities`: daftar opsional (`image`, `audio`, `video`). Default: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per-entri.
- Kegagalan akan fallback ke entri berikutnya.

Auth provider mengikuti urutan standar: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

**Field async completion:**

- `asyncCompletion.directSend`: saat `true`, tugas `music_generate`
  dan `video_generate` async yang selesai mencoba pengiriman channel langsung terlebih dahulu. Default: `false`
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

Mengontrol sesi mana yang dapat ditargetkan oleh session tools (`sessions_list`, `sessions_history`, `sessions_send`).

Default: `tree` (sesi saat ini + sesi yang dibuat darinya, seperti subagent).

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

- `self`: hanya kunci sesi saat ini.
- `tree`: sesi saat ini + sesi yang dibuat dari sesi saat ini (subagent).
- `agent`: sesi apa pun yang dimiliki id agent saat ini (dapat mencakup pengguna lain jika Anda menjalankan sesi per-sender di bawah id agent yang sama).
- `all`: sesi apa pun. Penargetan lintas agent tetap memerlukan `tools.agentToAgent`.
- Clamp sandbox: saat sesi saat ini disandbox dan `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, visibilitas dipaksa ke `tree` meskipun `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Mengontrol dukungan lampiran inline untuk `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: atur true untuk mengizinkan lampiran file inline
        maxTotalBytes: 5242880, // total 5 MB untuk semua file
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // pertahankan lampiran saat cleanup="keep"
      },
    },
  },
}
```

Catatan:

- Lampiran hanya didukung untuk `runtime: "subagent"`. Runtime ACP menolaknya.
- File dimaterialisasi ke child workspace di `.openclaw/attachments/<uuid>/` dengan `.manifest.json`.
- Konten lampiran otomatis disensor dari persistensi transkrip.
- Input Base64 divalidasi dengan pemeriksaan alfabet/padding yang ketat dan guard ukuran sebelum decode.
- Izin file adalah `0700` untuk direktori dan `0600` untuk file.
- Cleanup mengikuti kebijakan `cleanup`: `delete` selalu menghapus lampiran; `keep` mempertahankannya hanya ketika `retainOnSessionKeep: true`.

### `tools.experimental`

Flag tool bawaan eksperimental. Default mati kecuali aturan auto-enable khusus runtime berlaku.

```json5
{
  tools: {
    experimental: {
      planTool: true, // aktifkan update_plan eksperimental
    },
  },
}
```

Catatan:

- `planTool`: mengaktifkan tool `update_plan` terstruktur untuk pelacakan pekerjaan multi-langkah yang tidak sepele.
- Default: `false` untuk provider non-OpenAI. Eksekusi OpenAI dan OpenAI Codex mengaktifkannya secara otomatis.
- Saat diaktifkan, system prompt juga menambahkan panduan penggunaan sehingga model hanya menggunakannya untuk pekerjaan yang substansial dan menjaga maksimal satu langkah `in_progress`.

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

- `model`: model default untuk sub-agent yang di-spawn. Jika dihilangkan, sub-agent mewarisi model pemanggil.
- `allowAgents`: allowlist default id agent target untuk `sessions_spawn` saat agent peminta tidak menetapkan `subagents.allowAgents` sendiri (`["*"]` = apa saja; default: hanya agent yang sama).
- `runTimeoutSeconds`: timeout default (detik) untuk `sessions_spawn` saat pemanggilan tool menghilangkan `runTimeoutSeconds`. `0` berarti tanpa timeout.
- Kebijakan tool per-subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider kustom dan base URL

OpenClaw menggunakan katalog model bawaan. Tambahkan provider kustom melalui `models.providers` di config atau `~/.openclaw/agents/<agentId>/agent/models.json`.

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
- Override root config agent dengan `OPENCLAW_AGENT_DIR` (atau `PI_CODING_AGENT_DIR`, alias environment variable lama).
- Prioritas penggabungan untuk provider ID yang cocok:
  - Nilai `baseUrl` `models.json` agent yang tidak kosong menang.
  - Nilai `apiKey` agent yang tidak kosong menang hanya ketika provider tersebut tidak dikelola SecretRef dalam konteks config/auth-profile saat ini.
  - Nilai `apiKey` provider yang dikelola SecretRef disegarkan dari penanda sumber (`ENV_VAR_NAME` untuk env ref, `secretref-managed` untuk file/exec ref) alih-alih menyimpan secret yang telah di-resolve.
  - Nilai header provider yang dikelola SecretRef disegarkan dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk env ref, `secretref-managed` untuk file/exec ref).
  - `apiKey`/`baseUrl` agent yang kosong atau hilang fallback ke `models.providers` di config.
  - `contextWindow`/`maxTokens` model yang cocok menggunakan nilai lebih tinggi antara config eksplisit dan nilai katalog implisit.
  - `contextTokens` model yang cocok mempertahankan batas runtime eksplisit bila ada; gunakan untuk membatasi konteks efektif tanpa mengubah metadata model native.
  - Gunakan `models.mode: "replace"` bila Anda ingin config menulis ulang `models.json` sepenuhnya.
  - Persistensi penanda bersifat source-authoritative: penanda ditulis dari snapshot config sumber aktif (pra-resolusi), bukan dari nilai secret runtime yang telah di-resolve.

### Detail field provider

- `models.mode`: perilaku katalog provider (`merge` atau `replace`).
- `models.providers`: peta provider kustom yang dikunci dengan provider id.
- `models.providers.*.api`: adapter request (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, dll).
- `models.providers.*.apiKey`: kredensial provider (utamakan SecretRef/substitusi env).
- `models.providers.*.auth`: strategi auth (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: untuk Ollama + `openai-completions`, suntikkan `options.num_ctx` ke request (default: `true`).
- `models.providers.*.authHeader`: paksa transport kredensial di header `Authorization` bila diperlukan.
- `models.providers.*.baseUrl`: base URL API upstream.
- `models.providers.*.headers`: header statis tambahan untuk routing proxy/tenant.
- `models.providers.*.request`: override transport untuk request HTTP model-provider.
  - `request.headers`: header tambahan (digabungkan dengan default provider). Nilai menerima SecretRef.
  - `request.auth`: override strategi auth. Mode: `"provider-default"` (gunakan auth bawaan provider), `"authorization-bearer"` (dengan `token`), `"header"` (dengan `headerName`, `value`, `prefix` opsional).
  - `request.proxy`: override proxy HTTP. Mode: `"env-proxy"` (gunakan env var `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (dengan `url`). Kedua mode menerima sub-objek `tls` opsional.
  - `request.tls`: override TLS untuk koneksi langsung. Field: `ca`, `cert`, `key`, `passphrase` (semuanya menerima SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: entri katalog model provider eksplisit.
- `models.providers.*.models.*.contextWindow`: metadata context window model native.
- `models.providers.*.models.*.contextTokens`: batas konteks runtime opsional. Gunakan ini ketika Anda ingin anggaran konteks efektif yang lebih kecil daripada `contextWindow` native model.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: petunjuk kompatibilitas opsional. Untuk `api: "openai-completions"` dengan `baseUrl` non-native yang tidak kosong (host bukan `api.openai.com`), OpenClaw memaksanya menjadi `false` saat runtime. `baseUrl` kosong/tidak diatur mempertahankan perilaku OpenAI default.
- `plugins.entries.amazon-bedrock.config.discovery`: root pengaturan auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: nyalakan/matikan implicit discovery.
- `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS untuk discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filter provider-id opsional untuk discovery terarah.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interval polling untuk refresh discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: context window fallback untuk model yang ditemukan.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token output maksimum fallback untuk model yang ditemukan.

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

Atur `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`). Gunakan referensi `opencode/...` untuk katalog Zen atau referensi `opencode-go/...` untuk katalog Go. Shortcut: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`.

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

Atur `ZAI_API_KEY`. `z.ai/*` dan `z-ai/*` adalah alias yang diterima. Shortcut: `openclaw onboard --auth-choice zai-api-key`.

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

Endpoint Moonshot native mengiklankan kompatibilitas penggunaan streaming pada
transport bersama `openai-completions`, dan OpenClaw sekarang menguncinya pada
kapabilitas endpoint, bukan hanya provider id bawaan.

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

Kompatibel dengan Anthropic, provider bawaan. Shortcut: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (kompatibel dengan Anthropic)">

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

Base URL harus menghilangkan `/v1` (klien Anthropic menambahkannya). Shortcut: `openclaw onboard --auth-choice synthetic-api-key`.

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

Atur `MINIMAX_API_KEY`. Shortcut:
`openclaw onboard --auth-choice minimax-global-api` atau
`openclaw onboard --auth-choice minimax-cn-api`.
Katalog model sekarang default hanya ke M2.7.
Pada jalur streaming kompatibel Anthropic, OpenClaw menonaktifkan thinking MiniMax
secara default kecuali Anda secara eksplisit menetapkan `thinking` sendiri. `/fast on` atau
`params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Model lokal (LM Studio)">

Lihat [Local Models](/id/gateway/local-models). Singkatnya: jalankan model lokal besar melalui LM Studio Responses API pada hardware yang serius; pertahankan model hosted yang digabungkan untuk fallback.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // atau string plaintext
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opsional hanya untuk bundled skill (skill managed/workspace tidak terpengaruh).
- `load.extraDirs`: root skill bersama tambahan (prioritas terendah).
- `install.preferBrew`: ketika true, utamakan installer Homebrew ketika `brew`
  tersedia sebelum fallback ke jenis installer lain.
- `install.nodeManager`: preferensi installer node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` menonaktifkan skill meskipun bundled/installed.
- `entries.<skillKey>.apiKey`: field kenyamanan API key tingkat skill (saat didukung oleh skill).

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

- Dimuat dari `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, plus `plugins.load.paths`.
- Discovery menerima plugin OpenClaw native plus bundle Codex dan bundle Claude yang kompatibel, termasuk bundle Claude dengan tata letak default tanpa manifest.
- **Perubahan config memerlukan restart gateway.**
- `allow`: allowlist opsional (hanya plugin yang tercantum yang dimuat). `deny` menang.
- `plugins.entries.<id>.apiKey`: field kenyamanan API key tingkat plugin (jika didukung oleh plugin).
- `plugins.entries.<id>.env`: peta env var khusus plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: ketika `false`, inti memblokir `before_prompt_build` dan mengabaikan field mutasi prompt dari `before_agent_start` lama, sambil mempertahankan `modelOverride` dan `providerOverride` lama. Berlaku untuk hook plugin native dan direktori hook yang disediakan bundle yang didukung.
- `plugins.entries.<id>.subagent.allowModelOverride`: secara eksplisit mempercayai plugin ini untuk meminta override `provider` dan `model` per-eksekusi bagi subagent background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opsional target `provider/model` kanonis untuk override subagent tepercaya. Gunakan `"*"` hanya jika Anda memang ingin mengizinkan model apa pun.
- `plugins.entries.<id>.config`: objek config yang didefinisikan plugin (divalidasi oleh skema plugin OpenClaw native bila tersedia).
- `plugins.entries.firecrawl.config.webFetch`: pengaturan provider web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (menerima SecretRef). Fallback ke `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` lama, atau env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: base URL API Firecrawl (default: `https://api.firecrawl.dev`).
  - `onlyMainContent`: ekstrak hanya konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: timeout request scrape dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan provider X Search.
  - `model`: model Grok yang digunakan untuk pencarian (mis. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan memory dreaming (eksperimental). Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan ambang.
  - `enabled`: sakelar utama dreaming (default `false`).
  - `frequency`: cadence cron untuk setiap sweep dreaming penuh (default `"0 3 * * *"`).
  - kebijakan fase dan ambang adalah detail implementasi (bukan kunci config yang terlihat oleh pengguna).
- Plugin bundle Claude yang diaktifkan juga dapat menyumbangkan default Pi tertanam dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agent yang telah disanitasi, bukan sebagai patch config OpenClaw mentah.
- `plugins.slots.memory`: pilih id plugin memori aktif, atau `"none"` untuk menonaktifkan plugin memori.
- `plugins.slots.contextEngine`: pilih id plugin engine konteks aktif; default ke `"legacy"` kecuali Anda menginstal dan memilih engine lain.
- `plugins.installs`: metadata instalasi yang dikelola CLI dan digunakan oleh `openclaw plugins update`.
  - Mencakup `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Perlakukan `plugins.installs.*` sebagai state yang dikelola; utamakan perintah CLI daripada edit manual.

Lihat [Plugins](/id/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // mode trusted-network default
      // allowPrivateNetwork: true, // alias lama
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` default ke `true` saat tidak diatur (model trusted-network).
- Atur `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` untuk navigasi browser ketat yang hanya publik.
- Dalam mode ketat, endpoint profil CDP remote (`profiles.*.cdpUrl`) tunduk pada pemblokiran jaringan privat yang sama saat pemeriksaan reachability/discovery.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil remote bersifat attach-only (start/stop/reset dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) ketika Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  ketika provider Anda memberi URL WebSocket DevTools langsung.
- Profil `existing-session` hanya untuk host dan menggunakan Chrome MCP, bukan CDP.
- Profil `existing-session` dapat menetapkan `userDataDir` untuk menargetkan profil
  browser berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` mempertahankan batas route Chrome MCP saat ini:
  tindakan berbasis snapshot/ref alih-alih penargetan CSS-selector, hook upload satu file,
  tidak ada override timeout dialog, tidak ada `wait --load networkidle`, dan tidak ada
  `responsebody`, ekspor PDF, intersepsi download, atau tindakan batch.
- Profil `openclaw` lokal yang dikelola secara otomatis menetapkan `cdpPort` dan `cdpUrl`; hanya
  atur `cdpUrl` secara eksplisit untuk CDP remote.
- Urutan auto-detect: browser default jika berbasis Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control service: hanya loopback (port diturunkan dari `gateway.port`, default `18791`).
- `extraArgs` menambahkan flag peluncuran tambahan ke startup Chromium lokal (misalnya
  `--disable-gpu`, ukuran jendela, atau flag debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, teks pendek, URL gambar, atau data URI
    },
  },
}
```

- `seamColor`: warna aksen untuk UI chrome aplikasi native (tint bubble Talk Mode, dll.).
- `assistant`: override identitas Control UI. Fallback ke identitas agent aktif.

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
      // password: "your-password", // atau OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // untuk mode=trusted-proxy; lihat /gateway/trusted-proxy-auth
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
      // allowedOrigins: ["https://control.example.com"], // wajib untuk Control UI non-loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // mode fallback origin header Host yang berbahaya
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
    // Opsional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Penolakan HTTP /tools/invoke tambahan
      deny: ["browser"],
      // Hapus tool dari daftar deny HTTP default
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

<Accordion title="Detail field gateway">

- `mode`: `local` (jalankan gateway) atau `remote` (hubungkan ke gateway remote). Gateway menolak start kecuali `local`.
- `port`: satu port multipleks untuk WS + HTTP. Prioritas: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (default), `lan` (`0.0.0.0`), `tailnet` (hanya IP Tailscale), atau `custom`.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind default `loopback` mendengarkan di `127.0.0.1` di dalam container. Dengan Docker bridge networking (`-p 18789:18789`), traffic datang melalui `eth0`, sehingga gateway tidak dapat dijangkau. Gunakan `--network host`, atau atur `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) agar mendengarkan di semua interface.
- **Auth**: wajib secara default. Bind non-loopback memerlukan auth gateway. Dalam praktiknya itu berarti token/password bersama atau reverse proxy sadar-identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wizard onboarding menghasilkan token secara default.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi (termasuk SecretRef), tetapkan `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Startup dan alur install/repair service gagal ketika keduanya dikonfigurasi dan mode tidak diatur.
- `gateway.auth.mode: "none"`: mode tanpa auth yang eksplisit. Gunakan hanya untuk setup loopback lokal tepercaya; ini sengaja tidak ditawarkan oleh prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan auth ke reverse proxy sadar-identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)). Mode ini mengharapkan sumber proxy **non-loopback**; reverse proxy loopback pada host yang sama tidak memenuhi trusted-proxy auth.
- `gateway.auth.allowTailscale`: saat `true`, header identitas Tailscale Serve dapat memenuhi auth Control UI/WebSocket (diverifikasi melalui `tailscale whois`). Endpoint HTTP API **tidak** menggunakan auth header Tailscale tersebut; mereka mengikuti mode auth HTTP normal gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Default ke `true` saat `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limiter auth gagal opsional. Berlaku per IP klien dan per scope auth (shared-secret dan device-token dilacak secara independen). Percobaan yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada jalur async Tailscale Serve Control UI, percobaan gagal untuk `{scope, clientIp}` yang sama diserialisasikan sebelum penulisan kegagalan. Karena itu, percobaan buruk yang bersamaan dari klien yang sama dapat memicu limiter pada request kedua alih-alih keduanya lolos sebagai mismatch biasa.
  - `gateway.auth.rateLimit.exemptLoopback` default ke `true`; atur `false` bila Anda sengaja ingin traffic localhost juga dikenai rate limit (untuk setup pengujian atau deployment proxy yang ketat).
- Percobaan auth WS asal browser selalu dibatasi dengan pengecualian loopback dinonaktifkan (pertahanan berlapis terhadap brute force localhost berbasis browser).
- Pada loopback, lockout asal browser tersebut diisolasi per nilai `Origin`
  yang dinormalisasi, sehingga kegagalan berulang dari satu origin localhost tidak otomatis
  mengunci origin yang berbeda.
- `tailscale.mode`: `serve` (hanya tailnet, bind loopback) atau `funnel` (publik, memerlukan auth).
- `controlUi.allowedOrigins`: allowlist browser-origin eksplisit untuk koneksi WebSocket Gateway. Wajib ketika klien browser diharapkan dari origin non-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan fallback origin header Host untuk deployment yang sengaja bergantung pada kebijakan origin header Host.
- `remote.transport`: `ssh` (default) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus berupa `ws://` atau `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass sisi klien yang mengizinkan `ws://` plaintext ke IP jaringan privat tepercaya; default tetap hanya loopback untuk plaintext.
- `gateway.remote.token` / `.password` adalah field kredensial klien remote. Keduanya tidak mengonfigurasi auth gateway dengan sendirinya.
- `gateway.push.apns.relay.baseUrl`: base HTTPS URL untuk relay APNs eksternal yang digunakan oleh build iOS resmi/TestFlight setelah memublikasikan pendaftaran berbasis relay ke gateway. URL ini harus cocok dengan URL relay yang dikompilasi ke build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout kirim dari gateway ke relay dalam milidetik. Default: `10000`.
- Pendaftaran berbasis relay didelegasikan ke identitas gateway tertentu. Aplikasi iOS yang dipasangkan mengambil `gateway.identity.get`, menyertakan identitas itu dalam pendaftaran relay, dan meneruskan grant pengiriman berskala pendaftaran ke gateway. Gateway lain tidak dapat menggunakan kembali pendaftaran yang tersimpan itu.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env sementara untuk config relay di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: jalur keluar khusus development untuk URL relay HTTP loopback. URL relay produksi sebaiknya tetap HTTPS.
- `gateway.channelHealthCheckMinutes`: interval monitor kesehatan channel dalam menit. Atur `0` untuk menonaktifkan restart health-monitor secara global. Default: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ambang socket basi dalam menit. Pertahankan nilai ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`. Default: `30`.
- `gateway.channelMaxRestartsPerHour`: maksimum restart health-monitor per channel/account dalam satu jam bergulir. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per-channel untuk restart health-monitor sambil tetap menjaga monitor global tetap aktif.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per-account untuk channel multi-account. Saat diatur, ia mengambil prioritas atas override tingkat channel.
- Jalur pemanggilan gateway lokal dapat menggunakan fallback `gateway.remote.*` hanya ketika `gateway.auth.*` tidak diatur.
- Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan tidak dapat di-resolve, resolusi gagal secara fail-closed (tanpa fallback remote yang menyamarkan).
- `trustedProxies`: IP reverse proxy yang mengakhiri TLS atau menyuntikkan header forwarded-client. Cantumkan hanya proxy yang Anda kendalikan. Entri loopback tetap valid untuk setup proxy/deteksi lokal pada host yang sama (misalnya Tailscale Serve atau reverse proxy lokal), tetapi entri tersebut **tidak** membuat request loopback memenuhi syarat untuk `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: ketika `true`, gateway menerima `X-Real-IP` jika `X-Forwarded-For` tidak ada. Default `false` untuk perilaku fail-closed.
- `gateway.tools.deny`: nama tool tambahan yang diblokir untuk HTTP `POST /tools/invoke` (memperluas daftar deny default).
- `gateway.tools.allow`: hapus nama tool dari daftar deny HTTP default.

</Accordion>

### Endpoint yang kompatibel dengan OpenAI

- Chat Completions: dinonaktifkan secara default. Aktifkan dengan `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening input URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlist kosong diperlakukan sebagai tidak diatur; gunakan `gateway.http.endpoints.responses.files.allowUrl=false`
    dan/atau `gateway.http.endpoints.responses.images.allowUrl=false` untuk menonaktifkan pengambilan URL.
- Header hardening respons opsional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (atur hanya untuk origin HTTPS yang Anda kendalikan; lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolasi multi-instance

Jalankan beberapa gateway pada satu host dengan port dan state dir yang unik:

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

- `enabled`: mengaktifkan terminasi TLS di listener gateway (HTTPS/WSS) (default: `false`).
- `autoGenerate`: menghasilkan otomatis pasangan cert/key self-signed lokal ketika file eksplisit tidak dikonfigurasi; hanya untuk penggunaan lokal/dev.
- `certPath`: path filesystem ke file sertifikat TLS.
- `keyPath`: path filesystem ke file private key TLS; pertahankan izin yang terbatas.
- `caPath`: path bundle CA opsional untuk verifikasi klien atau rantai trust kustom.

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

- `mode`: mengontrol bagaimana edit config diterapkan saat runtime.
  - `"off"`: abaikan edit live; perubahan memerlukan restart eksplisit.
  - `"restart"`: selalu restart proses gateway saat config berubah.
  - `"hot"`: terapkan perubahan di dalam proses tanpa restart.
  - `"hybrid"` (default): coba hot reload terlebih dahulu; fallback ke restart jika diperlukan.
- `debounceMs`: jendela debounce dalam ms sebelum perubahan config diterapkan (integer non-negatif).
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
        messageTemplate: "Dari: {{messages[0].from}}\nSubjek: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` atau `x-openclaw-token: <token>`.
Token hook di query string ditolak.

Catatan validasi dan keamanan:

- `hooks.enabled=true` memerlukan `hooks.token` yang tidak kosong.
- `hooks.token` harus **berbeda** dari `gateway.auth.token`; penggunaan ulang token Gateway ditolak.
- `hooks.path` tidak boleh `/`; gunakan subpath khusus seperti `/hooks`.
- Jika `hooks.allowRequestSessionKey=true`, batasi `hooks.allowedSessionKeyPrefixes` (misalnya `["hook:"]`).

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dari payload request hanya diterima ketika `hooks.allowRequestSessionKey=true` (default: `false`).
- `POST /hooks/<name>` → di-resolve melalui `hooks.mappings`

<Accordion title="Detail mapping">

- `match.path` cocok dengan sub-path setelah `/hooks` (mis. `/hooks/gmail` → `gmail`).
- `match.source` cocok dengan field payload untuk path generik.
- Template seperti `{{messages[0].subject}}` membaca