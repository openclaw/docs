---
read_when:
    - Mengonfigurasi Plugin saluran (autentikasi, kontrol akses, multiakun)
    - Pemecahan masalah kunci konfigurasi per kanal
    - Mengaudit kebijakan DM, kebijakan grup, atau pembatasan penyebutan
summary: 'Konfigurasi channel: kontrol akses, pemasangan, kunci per channel di Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan lainnya'
title: Konfigurasi — saluran
x-i18n:
    generated_at: "2026-07-20T03:48:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e1c32077ec770c04bdf3c49aa187572a271a954bccec7b31fef776f768a6ed9b
    source_path: gateway/config-channels.md
    workflow: 16
---

Kunci konfigurasi per kanal di bawah `channels.*`: akses DM dan grup, penyiapan multiakun, pembatasan berdasarkan penyebutan, serta kunci per kanal untuk Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan Plugin kanal lainnya.

Untuk agen, alat, runtime gateway, dan kunci tingkat teratas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Kanal

Setiap kanal dimulai secara otomatis saat bagian konfigurasinya tersedia (kecuali `enabled: false`). Telegram dan iMessage disertakan dalam paket inti `openclaw`. Kanal resmi lainnya (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost, dan lainnya) dipasang sebagai Plugin terpisah dengan `openclaw plugins install <spec>`; lihat [Kanal](/id/channels) untuk daftar lengkap dan spesifikasi pemasangan.

### Akses DM dan grup

Semua kanal mendukung kebijakan DM dan kebijakan grup:

| Kebijakan DM           | Perilaku                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (bawaan) | Pengirim tak dikenal menerima kode pemasangan satu kali; pemilik harus menyetujuinya |
| `allowlist`         | Hanya pengirim dalam `allowFrom` (atau penyimpanan izin yang telah dipasangkan)             |
| `open`              | Izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)             |
| `disabled`          | Abaikan semua DM masuk                                          |

| Kebijakan grup          | Perilaku                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (bawaan) | Hanya grup yang cocok dengan daftar izin yang dikonfigurasi          |
| `open`                | Lewati daftar izin grup (pembatasan berdasarkan penyebutan tetap berlaku) |
| `disabled`            | Blokir semua pesan grup/ruang                          |

<Note>
`channels.defaults.groupPolicy` menetapkan nilai bawaan saat `groupPolicy` milik penyedia belum ditetapkan.
Kode pemasangan kedaluwarsa setelah 1 jam. Permintaan pemasangan tertunda dibatasi hingga **3 per akun** (dibatasi berdasarkan kanal dan ID akun).
Jika blok penyedia sama sekali tidak ada (`channels.<provider>` tidak tersedia), kebijakan grup runtime kembali ke `allowlist` (gagal tertutup) dengan peringatan saat dimulai.
</Note>

### Penggantian model kanal

Gunakan `channels.modelByChannel` untuk menetapkan ID kanal tertentu atau rekan pesan langsung ke suatu model. Nilai menerima `provider/model` atau alias model yang dikonfigurasi. Pemetaan kanal hanya berlaku saat sesi belum memiliki penggantian model aktif (misalnya, yang ditetapkan melalui `/model`).

Untuk percakapan grup/utas, kuncinya berupa ID grup, ID topik, atau nama kanal yang spesifik untuk kanal tersebut. Untuk percakapan pesan langsung (DM), kuncinya berupa pengidentifikasi rekan yang berasal dari identitas pengirim kanal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From`, atau `SenderId`). Bentuk kunci yang tepat bergantung pada kanal:

| Kanal  | Bentuk kunci DM         | Contoh                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | ID pengguna mentah         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | ID pengguna Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ID pengguna mentah         | `123456789`                                  |
| WhatsApp | nomor telepon atau JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

Kunci khusus DM hanya cocok dalam percakapan pesan langsung; kunci tersebut tidak memengaruhi perutean grup/utas.

### Nilai bawaan kanal dan heartbeat

Gunakan `channels.defaults` untuk perilaku kebijakan grup, penyebutan implisit, dan heartbeat bersama di seluruh penyedia:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      implicitMentions: {
        replyToBot: true,
        quotedBot: true,
        threadParticipation: true,
      },
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: kebijakan grup cadangan saat `groupPolicy` tingkat penyedia belum ditetapkan.
- `channels.defaults.contextVisibility`: mode visibilitas konteks tambahan bawaan untuk semua kanal. Nilai: `all` (bawaan, sertakan semua konteks kutipan/utas/riwayat), `allowlist` (hanya sertakan konteks dari pengirim dalam daftar izin), `allowlist_quote` (sama seperti daftar izin, tetapi pertahankan konteks kutipan/balasan eksplisit). Penggantian per kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.implicitMentions`: mengontrol fakta masuk yang didukung dan dianggap sebagai penyebutan. `replyToBot`, `quotedBot`, dan `threadParticipation` masing-masing memiliki nilai bawaan `true`, sehingga mempertahankan perilaku saat ini. Ganti per kanal dengan `channels.<channel>.implicitMentions` atau per akun dengan `channels.<channel>.accounts.<id>.implicitMentions`; setiap tanda diselesaikan secara independen dalam urutan akun -> kanal -> nilai bawaan. Namanya bersifat positif: tetapkan tanda ke `false` agar fakta tersebut tidak lagi melewati pembatasan berdasarkan penyebutan. Penyebutan eksplisit native selalu diizinkan, dan suatu tanda tidak berpengaruh jika kanal tidak menghasilkan fakta tersebut. Lihat [Pembatasan berdasarkan penyebutan](/id/channels/groups#mention-gating-default) untuk matriks penghasil saat ini. Pengaturan ini tidak mengubah mode balasan/utas keluar atau penanganan perintah yang diotorisasi.
- `channels.defaults.heartbeat.showOk`: sertakan status kanal yang sehat dalam keluaran heartbeat (bawaan `false`).
- `channels.defaults.heartbeat.showAlerts`: sertakan status terdegradasi/kesalahan dalam keluaran heartbeat (bawaan `true`).
- `channels.defaults.heartbeat.useIndicator`: render keluaran heartbeat ringkas bergaya indikator (bawaan `true`).

### WhatsApp

WhatsApp berjalan melalui kanal web gateway (Baileys Web). Kanal ini dimulai secara otomatis saat tersedia sesi tertaut.

```json5
{
  web: {
    enabled: true,
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // centang biru (false dalam mode obrolan mandiri)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- Entri `bindings[]` tingkat teratas dengan `type: "acp"` mengonfigurasi pengikatan ACP persisten untuk DM dan grup WhatsApp. Gunakan nomor langsung E.164 atau JID grup WhatsApp dalam `match.peer.id`. Semantik bidang digunakan bersama dalam [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).

<Accordion title="WhatsApp multiakun">

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

- Perintah keluar menggunakan akun `default` secara bawaan jika tersedia; jika tidak, ID akun pertama yang dikonfigurasi (diurutkan).
- `channels.whatsapp.defaultAccount` opsional mengganti pemilihan akun bawaan cadangan tersebut jika cocok dengan ID akun yang dikonfigurasi.
- Direktori autentikasi Baileys satu akun lama dimigrasikan oleh `openclaw doctor` ke `whatsapp/default`.
- Penggantian per akun: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bot: `channels.telegram.botToken` atau `channels.telegram.tokenFile` (hanya berkas biasa; symlink ditolak), dengan `TELEGRAM_BOT_TOKEN` sebagai cadangan untuk akun bawaan.
- `apiRoot` hanya merupakan root Telegram Bot API. Gunakan `https://api.telegram.org` atau root yang dihosting sendiri/proksi Anda, bukan `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` menghapus akhiran `/bot<TOKEN>` yang ditambahkan tanpa sengaja.
- Untuk server Bot API yang dihosting sendiri dalam mode `--local`, `trustedLocalFileRoots` mencantumkan jalur host yang boleh dibaca OpenClaw. Kaitkan volume data server pada host OpenClaw dan konfigurasikan root datanya atau direktori per token; jalur kontainer di bawah `/var/lib/telegram-bot-api` dipetakan ke root tersebut. Jalur absolut lainnya tetap ditolak.
- `channels.telegram.defaultAccount` opsional mengganti pemilihan akun bawaan jika cocok dengan ID akun yang dikonfigurasi.
- Dalam penyiapan multiakun (2+ ID akun), tetapkan akun bawaan eksplisit (`channels.telegram.defaultAccount` atau `channels.telegram.accounts.default`) untuk menghindari perutean cadangan; `openclaw doctor` memberikan peringatan jika nilai ini tidak ada atau tidak valid.
- `configWrites: false` memblokir penulisan konfigurasi yang dimulai oleh Telegram (migrasi ID supergrup, `/config set|unset`).
- Entri `bindings[]` tingkat teratas dengan `type: "acp"` mengonfigurasi pengikatan ACP persisten untuk topik forum (gunakan `chatId:topic:topicId` kanonis dalam `match.peer.id`). Semantik bidang digunakan bersama dalam [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).
- Pratinjau streaming Telegram menggunakan `sendMessage` + `editMessageText` (berfungsi dalam obrolan langsung dan grup).
- `network.dnsResultOrder` memiliki nilai bawaan `"ipv4first"` untuk menghindari kegagalan pengambilan IPv6 yang umum.
- Kebijakan percobaan ulang: lihat [Kebijakan percobaan ulang](/id/concepts/retry).

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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        chunkMode: "length", // length | newline
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

- Token: `channels.discord.token`, dengan `DISCORD_BOT_TOKEN` sebagai cadangan untuk akun default.
- Panggilan keluar langsung yang menyediakan `token` Discord secara eksplisit menggunakan token tersebut untuk panggilan; pengaturan percobaan ulang/kebijakan akun tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
- `channels.discord.defaultAccount` opsional mengganti pemilihan akun default saat cocok dengan ID akun yang dikonfigurasi.
- Gunakan `user:<id>` (DM) atau `channel:<id>` (kanal guild) untuk target pengiriman; ID numerik tanpa awalan ditolak.
- Slug guild menggunakan huruf kecil dengan spasi diganti oleh `-`; kunci kanal menggunakan nama yang dijadikan slug (tanpa `#`). Utamakan ID guild.
- Pesan yang dibuat bot diabaikan secara default. `allowBots: true` mengaktifkannya; gunakan `allowBots: "mentions"` agar hanya menerima pesan bot yang menyebut bot tersebut (pesan sendiri tetap difilter).
- Kanal yang mendukung pesan masuk buatan bot dapat menggunakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Tetapkan `channels.defaults.botLoopProtection` untuk anggaran pasangan dasar, lalu ganti pada kanal atau akun hanya ketika satu permukaan memerlukan batas yang berbeda.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (dan penggantian pada kanal) membuang pesan yang menyebut pengguna atau peran lain tetapi tidak menyebut bot (kecuali @everyone/@here).
- `channels.discord.mentionAliases` memetakan teks `@handle` keluar yang stabil ke ID pengguna Discord sebelum dikirim, sehingga rekan tim yang dikenal dapat disebut secara deterministik bahkan saat cache direktori sementara kosong. Penggantian per akun berada di bawah `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (default `17`) membagi pesan yang tinggi meskipun panjangnya di bawah 2000 karakter.
- `channels.discord.suppressEmbeds` secara default bernilai `true`, sehingga URL keluar tidak diperluas menjadi pratinjau tautan Discord kecuali dinonaktifkan. Payload `embeds` eksplisit tetap dikirim seperti biasa; panggilan alat per pesan dapat menggantinya dengan `suppressEmbeds`.
- `channels.discord.threadBindings` mengontrol perutean Discord yang terikat ke utas:
  - `enabled`: penggantian Discord untuk fitur sesi yang terikat ke utas (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, serta pengiriman/perutean terikat)
  - `idleHours`: penggantian Discord untuk pelepasan fokus otomatis akibat ketidakaktifan dalam jam (`0` menonaktifkan)
  - `maxAgeHours`: penggantian Discord untuk usia maksimum absolut dalam jam (`0` menonaktifkan)
  - `spawnSessions`: sakelar untuk pembuatan/pengikatan utas otomatis oleh `sessions_spawn({ thread: true })` dan pemunculan utas ACP (default: `true`)
  - `defaultSpawnContext`: konteks subagen native untuk pemunculan yang terikat ke utas (default `"fork"`)
- Entri `bindings[]` tingkat teratas dengan `type: "acp"` mengonfigurasi pengikatan ACP persisten untuk kanal dan utas (gunakan ID kanal/utas dalam `match.peer.id`). Semantik bidang digunakan bersama dalam [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` menetapkan warna aksen untuk kontainer komponen Discord v2.
- `channels.discord.agentComponents.ttlMs` mengontrol berapa lama callback komponen Discord yang dikirim tetap terdaftar. Default `1800000` (30 menit), maksimum `86400000` (24 jam). Penggantian per akun berada di bawah `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Utamakan TTL terpendek yang sesuai dengan alur kerja.
- `channels.discord.voice` mengaktifkan percakapan kanal suara Discord serta penggantian opsional untuk bergabung otomatis + LLM + TTS. Konfigurasi Discord khusus teks menonaktifkan suara secara default; tetapkan `channels.discord.voice.enabled=true` untuk mengaktifkannya.
- `channels.discord.voice.model` secara opsional mengganti model LLM yang digunakan untuk respons kanal suara Discord.
- `channels.discord.voice.daveEncryption` (default `true`) dan `channels.discord.voice.decryptionFailureTolerance` (default `24`) diteruskan ke opsi DAVE `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` mengontrol waktu tunggu Ready `@discordjs/voice` awal untuk `/vc join` dan upaya bergabung otomatis (default `30000`).
- `channels.discord.voice.reconnectGraceMs` mengontrol berapa lama sesi suara yang terputus boleh memerlukan waktu untuk memasuki pensinyalan penyambungan ulang sebelum OpenClaw menghancurkannya (default `15000`).
- Pemutaran suara Discord tidak dihentikan oleh peristiwa mulai berbicara pengguna lain. Untuk menghindari loop umpan balik, OpenClaw mengabaikan tangkapan suara baru saat TTS sedang diputar.
- OpenClaw juga mencoba memulihkan penerimaan suara dengan keluar dari lalu bergabung kembali ke sesi suara setelah kegagalan dekripsi berulang.
- `channels.discord.streaming` adalah kunci mode streaming kanonis. Discord secara default menggunakan `streaming.mode: "progress"` agar progres alat/pekerjaan muncul dalam satu pesan pratinjau yang diedit; tetapkan `streaming.mode: "off"` untuk menonaktifkannya. Kunci datar lama (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) tidak lagi dibaca saat runtime; jalankan `openclaw doctor --fix` untuk memigrasikan konfigurasi persisten.
- `channels.discord.autoPresence` memetakan ketersediaan runtime ke kehadiran bot (sehat => online, terdegradasi => idle, habis => dnd) dan memungkinkan penggantian teks status opsional.
- `channels.discord.guilds.<id>.presenceEvents` merutekan kedatangan ketersediaan manusia ke satu kanal Discord yang dikonfigurasi sebagai peristiwa sistem agen. Anggota yang memenuhi syarat harus dapat melihat `channelId`; utas publik mewarisi visibilitas induk, sedangkan utas privat juga memerlukan keanggotaan atau Manage Threads. `users` dapat semakin mempersempit audiens tersebut. Fitur ini mengisi anggota yang sedang online dari snapshot `GUILD_CREATE` lengkap, merutekan transisi offline-ke-online yang teramati, dan memperlakukan sinyal online pertama yang muncul kemudian bagi anggota yang belum pernah terlihat sebagai baru tersedia tanpa menyatakan apakah mereka menjadi online atau bergabung setelah snapshot. Guild yang melampaui batas snapshot Discord sebesar 75.000 anggota memerlukan pembaruan offline eksplisit terlebih dahulu. Pengaturan pembatasan: `reconnectSuppressSeconds` (jendela hening setelah sesi Gateway baru saat status kehadiran guild dibangun ulang, default 300, `0` menonaktifkan) dan `burstLimit`/`burstWindowSeconds` (batas laju per guild untuk peristiwa yang berhasil dimasukkan ke antrean, default 8 peristiwa per jendela geser 60 detik). Sesi yang dilanjutkan tidak memulai jendela penekanan penyambungan ulang. Masa jeda penyambutan ulang per pengguna yang ada tetap delapan jam. Fitur ini memerlukan `channels.discord.intents.presence=true`, Presence Intent dengan hak istimewa di Developer Portal Discord, serta Heartbeat agen yang diaktifkan.
- `channels.discord.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan nama/tag yang dapat berubah (mode kompatibilitas darurat).
- `channels.discord.execApprovals`: pengiriman persetujuan eksekusi native Discord dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode otomatis, persetujuan eksekusi aktif ketika pemberi persetujuan dapat ditentukan dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Discord yang diizinkan menyetujui permintaan eksekusi. Menggunakan `commands.ownerAllowFrom` sebagai cadangan jika dihilangkan.
  - `agentFilter`: daftar izin ID agen opsional. Hilangkan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default) mengirim ke DM pemberi persetujuan, `"channel"` mengirim ke kanal asal, `"both"` mengirim ke keduanya. Ketika target mencakup `"channel"`, tombol hanya dapat digunakan oleh pemberi persetujuan yang telah ditentukan.
  - `cleanupAfterResolve`: ketika `true`, menghapus DM persetujuan setelah disetujui, ditolak, atau waktu habis.

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

- JSON akun layanan: inline (`serviceAccount`) atau berbasis berkas (`serviceAccountFile`).
- SecretRef akun layanan juga didukung (`serviceAccountRef`).
- Cadangan variabel lingkungan: `GOOGLE_CHAT_SERVICE_ACCOUNT` atau `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (khusus akun default).
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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
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
      replyToMode: "off", // nonaktif | pertama | semua | dikelompokkan
      thread: {
        historyScope: "thread", // utas | kanal
        inheritParent: false,
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // nonaktif | sebagian | blok | progres
        chunkMode: "length", // panjang | baris baru
        nativeTransport: true, // gunakan API streaming native Slack saat mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | kanal | keduanya
      },
    },
  },
}
```

- **Mode Socket** memerlukan `botToken` dan `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` untuk fallback lingkungan akun default).
- **Mode HTTP** memerlukan `botToken` serta `signingSecret` (di tingkat root atau per akun).
- **Identitas pengguna** (`identity: "user"`) mengirim dan membaca sebagai manusia yang memberikan otorisasi. Ini memerlukan `userToken` serta `appToken` dalam Mode Socket, atau `userToken` serta `signingSecret` dalam mode HTTP. Token bot atau pengguna bot tidak diperlukan. Lihat [Identitas pengguna](/id/channels/slack#user-identity-post-as-a-real-person) untuk cakupan pengguna dan langganan peristiwa.
- `enterpriseOrgInstall: true` mengikutsertakan akun ke jalur peristiwa
  tingkat organisasi Slack Enterprise Grid. Saat dimulai, token bot diverifikasi dengan `auth.test` dan
  proses gagal ketika mode yang dikonfigurasi tidak cocok dengan identitas instalasi Slack.
  DM Enterprise harus dinonaktifkan atau menggunakan `dmPolicy: "open"` dengan
  `allowFrom: ["*"]` yang efektif. Kebijakan kanal dan pengguna harus menggunakan ID Slack yang stabil;
  nama yang dapat berubah dan prefiks kanal yang tidak didukung akan menggagalkan proses awal. V1 hanya menangani
  peristiwa Mode Socket langsung atau HTTP `message` dan `app_mention` dengan balasan
  langsung; relai, perintah, interaksi, App Home, listener peristiwa reaksi,
  pin, alat tindakan, persetujuan native, pengikatan, pengiriman tertunda, dan
  pengiriman proaktif tidak tersedia. Pengakuan, indikator pengetikan, dan
  reaksi status yang dimiliki listener tetap tersedia dengan `reactions:write`; notifikasi reaksi
  masuk dan alat tindakan reaksi tidak tersedia. Lihat
  [Instalasi tingkat organisasi Enterprise Grid](/id/channels/slack#enterprise-grid-org-wide-installs)
  untuk manifes dengan hak akses paling rendah, alur kerja penyiapan, dan batasan lengkap.
- `socketMode` meneruskan penyetelan transportasi Mode Socket SDK Slack ke API receiver Bolt publik. Gunakan hanya saat menyelidiki batas waktu ping/pong atau perilaku websocket yang kedaluwarsa. `clientPingTimeout` secara default menggunakan `15000`; `serverPingTimeout` dan `pingPongLoggingEnabled` hanya diteruskan saat dikonfigurasi.
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string
  teks biasa atau objek SecretRef.
- Snapshot akun Slack menampilkan bidang sumber/status per kredensial seperti
  `botTokenSource`, `botTokenStatus`, `userTokenSource`, `userTokenStatus`,
  `appTokenStatus`, dan, dalam mode HTTP, `signingSecretStatus`.
  `configured_unavailable` berarti akun tersebut
  dikonfigurasi melalui SecretRef, tetapi jalur perintah/runtime saat ini tidak dapat
  memperoleh nilai rahasia.
- `configWrites: false` memblokir penulisan konfigurasi yang dimulai oleh Slack.
- `channels.slack.defaultAccount` opsional mengganti pemilihan akun default ketika cocok dengan ID akun yang dikonfigurasi.
- `channels.slack.streaming.mode` adalah kunci mode streaming Slack kanonis (default `"partial"`). `channels.slack.streaming.nativeTransport` mengontrol transportasi streaming native Slack (default `true`). Nilai lama `streamMode`, boolean `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce`, dan `nativeStreaming` tidak lagi dibaca saat runtime; jalankan `openclaw doctor --fix` untuk memigrasikan konfigurasi tersimpan ke `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` dan `unfurlMedia` meneruskan boolean penguraian pratinjau tautan dan media `chat.postMessage` milik Slack untuk balasan bot. `unfurlLinks` secara default menggunakan `false` agar tautan bot keluar tidak diperluas secara inline kecuali diaktifkan; `unfurlMedia` dihilangkan kecuali dikonfigurasi. Tetapkan salah satu nilai pada `channels.slack.accounts.<accountId>` untuk mengganti nilai tingkat atas bagi satu akun.
- Gunakan `user:<id>` (DM) atau `channel:<id>` untuk target pengiriman.

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

**Isolasi sesi utas:** `thread.historyScope` bersifat per utas (default) atau dibagikan di seluruh kanal. `thread.inheritParent` menyalin transkrip kanal induk ke utas baru. `thread.initialHistoryLimit` (default `20`) membatasi jumlah pesan utas yang sudah ada yang diambil saat sesi utas baru dimulai; `0` menonaktifkan pengambilan riwayat utas.

- Streaming native Slack serta status utas bergaya asisten Slack "sedang mengetik..." memerlukan target utas balasan. DM tingkat atas secara default tetap berada di luar utas, sehingga masih dapat melakukan streaming melalui pratinjau draf kirim-dan-edit Slack alih-alih menampilkan pratinjau streaming/status native bergaya utas.
- `typingReaction` menambahkan reaksi sementara ke pesan Slack masuk selama balasan diproses, lalu menghapusnya setelah selesai. Gunakan kode pendek emoji Slack seperti `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: pengiriman klien persetujuan native Slack dan otorisasi pemberi persetujuan eksekusi. Skemanya sama seperti Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID pengguna Slack), `agentFilter`, `sessionFilter`, dan `target` (`"dm"`, `"channel"`, atau `"both"`). Persetujuan Plugin dapat menggunakan jalur klien native ini untuk permintaan yang berasal dari Slack ketika pemberi persetujuan Plugin Slack berhasil ditentukan; pengiriman persetujuan Plugin native Slack juga dapat diaktifkan melalui `approvals.plugin` untuk sesi yang berasal dari Slack atau target Slack. Persetujuan Plugin menggunakan pemberi persetujuan Plugin Slack dari `allowFrom` dan perutean default, bukan pemberi persetujuan eksekusi.

| Grup tindakan | Default | Catatan                  |
| ------------ | ------- | ---------------------- |
| reactions    | diaktifkan | Bereaksi + mencantumkan reaksi |
| messages     | diaktifkan | Membaca/mengirim/mengedit/menghapus  |
| pins         | diaktifkan | Menyematkan/melepas sematan/mencantumkan         |
| memberInfo   | diaktifkan | Informasi anggota            |
| emojiList    | diaktifkan | Daftar emoji khusus      |

### Mattermost

Mattermost diinstal sebagai Plugin terpisah, dengan cara yang sama seperti Discord, Slack, dan WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Periksa [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) untuk dist-tag saat ini sebelum menetapkan versi tertentu.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // saat dipanggil | setiap pesan | berdasarkan karakter
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // harus diaktifkan secara eksplisit
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL eksplisit opsional untuk deployment reverse-proxy/publik
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Mode obrolan: `oncall` (merespons saat @-mention, default), `onmessage` (setiap pesan), `onchar` (pesan yang diawali prefiks pemicu).

Saat perintah native Mattermost diaktifkan:

- `commands.callbackPath` harus berupa jalur (misalnya `/api/channels/mattermost/command`), bukan URL lengkap.
- `commands.callbackUrl` harus mengarah ke endpoint Gateway OpenClaw dan dapat dijangkau dari server Mattermost.
- Callback slash native diautentikasi dengan token per perintah yang dikembalikan
  oleh Mattermost saat pendaftaran perintah slash. Jika pendaftaran gagal atau tidak ada
  perintah yang diaktifkan, OpenClaw menolak callback dengan
  `Unauthorized: invalid command token.`
- Untuk host callback privat/tailnet/internal, Mattermost mungkin mengharuskan
  `ServiceSettings.AllowedUntrustedInternalConnections` menyertakan host/domain callback.
  Gunakan nilai host/domain, bukan URL lengkap.
- `channels.mattermost.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai oleh Mattermost.
- `channels.mattermost.requireMention`: wajibkan `@mention` sebelum membalas di kanal.
- `channels.mattermost.groups.<channelId>.requireMention`: penggantian persyaratan mention per kanal (`"*"` untuk default).
- `channels.mattermost.defaultAccount` opsional mengganti pemilihan akun default ketika cocok dengan ID akun yang dikonfigurasi.

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
      reactionNotifications: "own", // nonaktif | milik sendiri | semua | daftar izin
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

- `channels.signal.account`: tetapkan proses awal kanal ke identitas akun Signal tertentu.
- `channels.signal.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai oleh Signal.
- `channels.signal.defaultAccount` opsional mengganti pemilihan akun default ketika cocok dengan ID akun yang dikonfigurasi.

### iMessage

OpenClaw menjalankan `imsg rpc` (JSON-RPC melalui stdio). Tidak memerlukan daemon atau port. Ini adalah jalur yang disarankan untuk penyiapan baru OpenClaw iMessage ketika host dapat memberikan izin basis data Messages dan Automation.

Dukungan BlueBubbles telah dihapus. `channels.bluebubbles` bukan permukaan konfigurasi runtime yang didukung pada OpenClaw saat ini. Migrasikan konfigurasi lama ke `channels.imessage`; gunakan [Penghapusan BlueBubbles dan jalur imsg iMessage](/id/announcements/bluebubbles-imessage) untuk versi singkat dan [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) untuk tabel terjemahan lengkap.

Jika Gateway tidak berjalan di Mac Messages yang sedang masuk, pertahankan `channels.imessage.enabled=true` dan tetapkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg "$@"` di Mac tersebut. Jalur lokal default `imsg` hanya tersedia di macOS.

Sebelum mengandalkan wrapper SSH untuk pengiriman produksi, verifikasi `imsg send` keluar melalui wrapper yang persis sama. Beberapa status TCC macOS menetapkan Automasi Messages ke `/usr/libexec/sshd-keygen-wrapper`, yang dapat membuat pembacaan dan pemeriksaan berfungsi sementara pengiriman gagal dengan AppleEvents `-1743`; lihat bagian pemecahan masalah wrapper SSH di [iMessage](/id/channels/imessage).

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

- `channels.imessage.defaultAccount` opsional menggantikan pemilihan akun bawaan jika cocok dengan id akun yang dikonfigurasi.
- Memerlukan Akses Disk Penuh ke DB Messages.
- Utamakan target `chat_id:<id>`. Gunakan `imsg chats --limit 20` untuk mencantumkan obrolan.
- `cliPath` dapat mengarah ke wrapper SSH; atur `remoteHost` (`host` atau `user@host`) untuk mengambil lampiran melalui SCP.
- `attachmentRoots` dan `remoteAttachmentRoots` membatasi jalur lampiran masuk (bawaan: `/Users/*/Library/Messages/Attachments`).
- SCP menggunakan pemeriksaan ketat kunci host, jadi pastikan kunci host relai sudah ada di `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai dari iMessage.
- `channels.imessage.sendTransport`: transportasi pengiriman RPC `imsg` yang diutamakan untuk balasan keluar normal. `auto` (bawaan) menggunakan jembatan IMCore untuk obrolan yang sudah ada ketika jembatan berjalan, lalu beralih ke AppleScript sebagai cadangan; `bridge` memerlukan pengiriman melalui API privat; `applescript` memaksa jalur automasi Messages publik.
- `channels.imessage.actions.*`: aktifkan tindakan API privat yang juga dibatasi oleh `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` dinonaktifkan secara bawaan; atur ke `true` sebelum mengharapkan media masuk dalam giliran agen.
- Pemulihan pesan masuk setelah jembatan/gateway dimulai ulang berlangsung otomatis (deduplikasi GUID ditambah batas usia backlog lama). Konfigurasi `channels.imessage.catchup.enabled: true` yang sudah ada masih dihormati sebagai profil kompatibilitas yang tidak digunakan lagi; `catchup` dinonaktifkan secara bawaan.
- `channels.imessage.groups`: registri grup dan pengaturan per grup. Dengan `groupPolicy: "allowlist"`, konfigurasikan kunci `chat_id` eksplisit atau entri wildcard `"*"` agar pesan grup dapat melewati gerbang registri.
- Entri `bindings[]` tingkat atas dengan `type: "acp"` dapat mengikat percakapan iMessage ke sesi ACP persisten. Gunakan handle yang dinormalisasi atau target obrolan eksplisit (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik bidang bersama: [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Contoh wrapper SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix didukung oleh plugin dan dikonfigurasi di bawah `channels.matrix`.

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
- `channels.matrix.proxy` merutekan lalu lintas HTTP Matrix melalui proksi HTTP(S) eksplisit. Akun bernama dapat menggantikannya dengan `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` mengizinkan homeserver privat/internal. `proxy` dan persetujuan jaringan ini merupakan kontrol yang independen.
- `channels.matrix.defaultAccount` memilih akun yang diutamakan dalam penyiapan multi-akun.
- `channels.matrix.autoJoin` secara bawaan bernilai `"off"`, sehingga ruang yang mengundang dan undangan baru bergaya DM diabaikan sampai Anda mengatur `autoJoin: "allowlist"` dengan `autoJoinAllowlist` atau `autoJoin: "always"`.
- `channels.matrix.execApprovals`: pengiriman persetujuan eksekusi native Matrix dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (bawaan). Dalam mode otomatis, persetujuan eksekusi diaktifkan ketika pemberi persetujuan dapat ditentukan dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Matrix (misalnya `@owner:example.org`) yang diizinkan menyetujui permintaan eksekusi.
  - `agentFilter`: daftar izin ID agen opsional. Hilangkan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tujuan pengiriman permintaan persetujuan. `"dm"` (bawaan), `"channel"` (ruang asal), atau `"both"`.
  - Penggantian per akun: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` mengontrol cara DM Matrix dikelompokkan ke dalam sesi: `per-user` (bawaan) berbagi berdasarkan rekan yang dirutekan, sedangkan `per-room` mengisolasi setiap ruang DM.
- Pemeriksaan status Matrix dan pencarian direktori langsung menggunakan kebijakan proksi yang sama dengan lalu lintas runtime.
- Konfigurasi Matrix lengkap, aturan penargetan, dan contoh penyiapan didokumentasikan di [Matrix](/id/channels/matrix).

### Microsoft Teams

Microsoft Teams didukung oleh plugin dan dikonfigurasi di bawah `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, kebijakan tim/saluran:
      // lihat /channels/msteams
    },
  },
}
```

- Jalur kunci inti yang dibahas di sini: `channels.msteams`, `channels.msteams.configWrites`.
- Konfigurasi Teams lengkap (kredensial, webhook, kebijakan DM/grup, penggantian per tim/per saluran) didokumentasikan di [Microsoft Teams](/id/channels/msteams).

### IRC

IRC didukung oleh plugin dan dikonfigurasi di bawah `channels.irc`.

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
- `channels.irc.defaultAccount` opsional menggantikan pemilihan akun bawaan jika cocok dengan id akun yang dikonfigurasi.
- Konfigurasi saluran IRC lengkap (host/port/TLS/saluran/daftar izin/pembatasan penyebutan) didokumentasikan di [IRC](/id/channels/irc).

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

- `default` digunakan ketika `accountId` dihilangkan (CLI + perutean).
- Token lingkungan hanya berlaku untuk akun **bawaan**.
- Pengaturan saluran dasar berlaku untuk semua akun kecuali diganti per akun.
- Gunakan `bindings[].match.accountId` untuk merutekan setiap akun ke agen yang berbeda.
- Jika Anda menambahkan akun nonbawaan melalui `openclaw channels add` (atau orientasi saluran) saat masih menggunakan konfigurasi saluran tingkat atas akun tunggal, OpenClaw terlebih dahulu mempromosikan nilai akun tunggal tingkat atas yang tercakup pada akun ke dalam peta akun saluran agar akun asli tetap berfungsi. Sebagian besar saluran memindahkannya ke `channels.<channel>.accounts.default`; Matrix dapat mempertahankan target bernama/bawaan yang sudah ada dan cocok.
- Pengikatan khusus saluran yang sudah ada (tanpa `accountId`) tetap cocok dengan akun bawaan; pengikatan yang tercakup pada akun tetap opsional.
- `openclaw doctor --fix` juga memperbaiki bentuk campuran dengan memindahkan nilai akun tunggal tingkat atas yang tercakup pada akun ke akun yang dipromosikan dan dipilih untuk saluran tersebut. Sebagian besar saluran menggunakan `accounts.default`; Matrix dapat mempertahankan target bernama/bawaan yang sudah ada dan cocok.

### Saluran plugin lainnya

Banyak saluran plugin dikonfigurasi sebagai `channels.<id>` dan didokumentasikan pada halaman saluran khusus masing-masing (misalnya Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch, dan Zalo).
Lihat indeks saluran lengkap: [Saluran](/id/channels).

### Pembatasan penyebutan dalam obrolan grup

Pesan grup secara bawaan **memerlukan penyebutan** (penyebutan metadata atau pola regex aman). Berlaku untuk obrolan grup WhatsApp, Telegram, Discord, Google Chat, dan iMessage.

Balasan yang terlihat dikontrol secara terpisah. Permintaan langsung grup, saluran, dan WebChat internal normal secara bawaan mengirimkan hasil akhir secara otomatis: teks akhir asisten dikirim melalui jalur balasan terlihat lama. Aktifkan `messages.visibleReplies: "message_tool"` atau `messages.groupChat.visibleReplies: "message_tool"` ketika balasan sumber yang ditulis model hanya boleh dikirim setelah agen memanggil `message(action=send)`. Jika model mengembalikan jawaban akhir substantif tanpa memanggil alat pesan dalam mode khusus alat yang telah diaktifkan, teks akhir tersebut tetap privat, log verbose gateway mencatat metadata payload yang ditekan, dan OpenClaw mengantrekan satu percobaan ulang pemulihan yang meminta model mengirimkan balasan yang sama melalui `message(action=send)`.

Kebijakan khusus alat mengatur balasan sumber asisten dan media alat generik. Kebijakan ini tidak menekan keluaran terminal milik runtime seperti respons perintah yang diotorisasi, pemberitahuan penyelesaian persisten, atau artefak native penyedia yang secara eksplisit diklasifikasikan sebagai milik host oleh harness pemiliknya. Artefak milik host dikirim melalui jalur pengiriman saluran normal dan tetap mematuhi penolakan `sendPolicy` keluar. Giliran `room_event` ambien tetap senyap kecuali berupa perintah eksplisit, bahkan ketika keluaran runtime ditandai sebagai milik host.

Balasan terlihat khusus alat memerlukan model/runtime yang dapat memanggil alat secara andal, dan direkomendasikan untuk ruang ambien bersama pada model generasi terbaru seperti GPT-5.6 Sol. Beberapa model yang lebih lemah dapat menjawab dengan teks akhir, tetapi gagal memahami bahwa keluaran yang terlihat oleh sumber harus dikirim dengan `message(action=send)`. OpenClaw secara bawaan memulihkan kasus umum jawaban akhir yang tertahan hanya jika jawaban akhir tersebut substantif, giliran sumber bukan peristiwa ruang, kebijakan pengiriman tidak menolak pengiriman, dan belum ada balasan sumber yang dikirim. Pemulihan dibatasi pada satu percobaan ulang; pemulihan ini menekan persistensi untuk permintaan percobaan ulang sintetis dan mengecualikan percobaan ulang tersebut dari pengelompokan pengumpulan agar tidak dapat digabungkan dengan permintaan antrean lain yang tidak terkait. Jika percobaan ulang juga tertahan atau tidak dapat dimasukkan ke antrean, OpenClaw hanya mengirimkan diagnostik yang telah disanitasi seperti "Saya menghasilkan balasan, tetapi tidak dapat mengirimkannya ke obrolan ini. Silakan coba lagi." Teks akhir privat yang asli tidak pernah ditandai untuk pengiriman otomatis ke sumber. Untuk model yang berulang kali menahan balasan, gunakan `"automatic"` agar giliran akhir asisten menjadi jalur balasan terlihat, beralihlah ke model pemanggil alat yang lebih kuat, periksa log verbose gateway untuk ringkasan payload yang ditekan, atau atur `messages.groupChat.visibleReplies: "automatic"` agar menggunakan balasan akhir terlihat untuk setiap permintaan grup/saluran.

Jika alat pesan tidak tersedia berdasarkan kebijakan alat yang aktif, OpenClaw beralih ke balasan terlihat otomatis alih-alih menyembunyikan respons secara diam-diam. `openclaw doctor` memperingatkan tentang ketidaksesuaian ini.

Aturan ini berlaku untuk teks akhir agen normal. Pengikatan percakapan milik Plugin menggunakan balasan yang dikembalikan Plugin pemilik sebagai respons terlihat untuk giliran utas terikat yang diklaim; Plugin tidak perlu memanggil `message(action=send)` untuk balasan pengikatan tersebut.

**Pemecahan masalah: @mention grup memicu indikator mengetik lalu hening (tanpa kesalahan)**

Gejala: @mention grup/saluran menampilkan indikator mengetik dan log Gateway melaporkan `dispatch complete (queuedFinal=false, replies=0)`, tetapi tidak ada pesan yang masuk ke ruang. DM kepada agen yang sama dibalas secara normal.

Penyebab: mode balasan terlihat grup/saluran diselesaikan menjadi `"message_tool"`, sehingga OpenClaw menjalankan giliran tetapi menyembunyikan teks akhir asisten kecuali agen memanggil `message(action=send)`. Tidak ada kontrak `NO_REPLY` dalam mode ini; tanpa panggilan alat pesan, teks akhir asli bersifat privat. Untuk giliran sumber yang substantif, OpenClaw kini mencoba satu percobaan ulang pemulihan yang dilindungi; catatan singkat, keheningan eksplisit, peristiwa ruang, giliran yang ditolak oleh kebijakan pengiriman, dan giliran yang sudah terkirim tidak dicoba ulang. Giliran grup dan saluran normal secara default menggunakan `"automatic"`, sehingga gejala ini hanya muncul ketika `messages.groupChat.visibleReplies` (atau `messages.visibleReplies` global) secara eksplisit ditetapkan ke `"message_tool"`. `defaultVisibleReplies` harness tidak berlaku di sini — resolver grup/saluran mengabaikannya; pengaturan ini hanya memengaruhi obrolan langsung/sumber (harness Codex menyembunyikan hasil akhir obrolan langsung dengan cara tersebut).

Perbaikan: pilih model pemanggil alat yang lebih kuat, hapus penggantian eksplisit `"message_tool"` agar kembali ke default `"automatic"`, atau tetapkan `messages.groupChat.visibleReplies: "automatic"` untuk memaksakan balasan terlihat bagi setiap permintaan grup/saluran. Hasil akhir substantif yang terdampar seharusnya tidak lagi berakhir sebagai keberhasilan tanpa keluaran; hasil tersebut harus dipulihkan melalui satu percobaan ulang `message(action=send)` atau menampilkan diagnostik kegagalan pengiriman yang telah disanitasi. Gateway memuat ulang konfigurasi `messages` secara langsung setelah berkas disimpan; mulai ulang Gateway hanya ketika pemantauan berkas atau pemuatan ulang konfigurasi dinonaktifkan dalam deployment.

**Jenis sebutan:**

- **Sebutan metadata**: @mention native platform. Diabaikan dalam mode obrolan mandiri WhatsApp.
- **Pola teks**: Pola regex aman dalam `agents.list[].groupChat.mentionPatterns`. Pola yang tidak valid dan pengulangan bertingkat yang tidak aman diabaikan.
- Pembatasan sebutan hanya diberlakukan ketika deteksi dimungkinkan (sebutan native atau setidaknya satu pola).

```json5
{
  messages: {
    visibleReplies: "automatic", // paksa balasan akhir otomatis lama untuk obrolan langsung/sumber
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // percakapan ruang tanpa sebutan yang selalu aktif menjadi konteks senyap
      visibleReplies: "message_tool", // ikut serta; wajibkan message(action=send) untuk balasan ruang yang terlihat
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` menetapkan default global. Saluran dapat menggantinya dengan `channels.<channel>.historyLimit` (atau per akun). Tetapkan `0` untuk menonaktifkannya.

`messages.groupChat.unmentionedInbound: "room_event"` mengirimkan pesan grup/saluran tanpa sebutan yang selalu aktif sebagai konteks ruang senyap pada saluran yang didukung. Pesan yang menyebut, perintah, dan pesan langsung tetap menjadi permintaan pengguna. Lihat [Peristiwa ruang ambien](/id/channels/ambient-room-events) untuk contoh lengkap Discord, Slack, dan Telegram.

`messages.visibleReplies` adalah default peristiwa sumber global; `messages.groupChat.visibleReplies` menggantikannya untuk peristiwa sumber grup/saluran. Ketika `messages.visibleReplies` tidak ditetapkan, obrolan langsung/sumber menggunakan default runtime atau harness yang dipilih, tetapi giliran langsung WebChat internal menggunakan pengiriman akhir otomatis untuk paritas prompt Pi/Codex. Tetapkan `messages.visibleReplies: "message_tool"` untuk secara sengaja mewajibkan `message(action=send)` bagi keluaran terlihat. Daftar izin saluran dan pembatasan sebutan tetap menentukan apakah suatu peristiwa diproses.

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

Resolusi: penggantian per DM → default penyedia → tanpa batas (semuanya dipertahankan).

Resolver ini membaca `channels.<provider>.dmHistoryLimit` dan `channels.<provider>.dms.<id>.historyLimit` untuk setiap saluran yang kunci sesinya mengikuti bentuk standar `provider:direct:<id>` (atau bentuk lama `provider:dm:<id>`), sehingga resolver ini berfungsi pada saluran bawaan maupun saluran Plugin, bukan hanya daftar tetap.

#### Mode obrolan mandiri

Sertakan nomor Anda sendiri dalam `allowFrom` untuk mengaktifkan mode obrolan mandiri (mengabaikan @mention native, hanya merespons pola teks):

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
    native: "auto", // daftarkan perintah native jika didukung
    nativeSkills: "auto", // daftarkan perintah skill native jika didukung
    text: true, // uraikan /commands dalam pesan obrolan
    bash: false, // izinkan ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // izinkan /config
    mcp: false, // izinkan /mcp
    plugins: false, // izinkan /plugins
    debug: false, // izinkan /debug
    restart: true, // izinkan /restart + permintaan mulai ulang SIGUSR1 eksternal
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

- Blok ini mengonfigurasi permukaan perintah. Untuk katalog perintah bawaan + terbundel saat ini, lihat [Perintah Slash](/id/tools/slash-commands).
- Halaman ini adalah **referensi kunci konfigurasi**, bukan katalog perintah lengkap. Perintah milik saluran/Plugin seperti QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, pemasangan perangkat `/pair`, memori `/dreaming`, kontrol telepon `/phone`, dan Talk `/voice` didokumentasikan dalam halaman saluran/Plugin masing-masing serta [Perintah Slash](/id/tools/slash-commands).
- Perintah teks harus berupa pesan **mandiri** dengan `/` di awal.
- `native: "auto"` mengaktifkan perintah native untuk Discord/Telegram dan membiarkannya nonaktif untuk Slack.
- `nativeSkills: "auto"` mengaktifkan perintah Skills native untuk Discord/Telegram dan membiarkannya nonaktif untuk Slack.
- Ganti per saluran: `channels.discord.commands.native` (boolean atau `"auto"`). Untuk Discord, `false` melewati pendaftaran dan pembersihan perintah native selama startup.
- Ganti pendaftaran Skills native per saluran dengan `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` menambahkan entri menu bot Telegram tambahan.
- `bash: true` mengaktifkan `! <cmd>` untuk shell host. Memerlukan `tools.elevated.enabled` dan pengirim dalam `tools.elevated.allowFrom.<channel>`.
- `config: true` mengaktifkan `/config` (membaca/menulis `openclaw.json`). Untuk klien `chat.send` Gateway, penulisan persisten `/config set|unset` juga memerlukan `operator.admin`; `/config show` hanya-baca tetap tersedia bagi klien operator normal dengan cakupan tulis.
- `mcp: true` mengaktifkan `/mcp` untuk konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`.
- `plugins: true` mengaktifkan `/plugins` untuk penemuan, instalasi, serta kontrol aktif/nonaktif Plugin.
- `channels.<provider>.configWrites` membatasi mutasi konfigurasi per saluran (default: true).
- Untuk saluran multiakun, `channels.<provider>.accounts.<id>.configWrites` juga membatasi penulisan yang menargetkan akun tersebut (misalnya `/allowlist --config --account <id>` atau `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` menonaktifkan `/restart` dan permintaan mulai ulang `SIGUSR1` eksternal. Default: `true`.
- `ownerAllowFrom` adalah daftar izin pemilik eksplisit untuk perintah khusus pemilik dan tindakan saluran yang dibatasi untuk pemilik. Daftar ini terpisah dari `allowFrom`.
- `ownerDisplay: "hash"` meng-hash ID pemilik dalam prompt sistem. Tetapkan `ownerDisplaySecret` untuk mengontrol hashing.
- `allowFrom` berlaku per penyedia. Ketika ditetapkan, nilai ini menjadi **satu-satunya** sumber otorisasi (daftar izin/pemasangan saluran dan `useAccessGroups` diabaikan).
- `useAccessGroups: false` memungkinkan perintah melewati kebijakan grup akses ketika `allowFrom` tidak ditetapkan.
- Peta dokumentasi perintah:
  - katalog bawaan + terbundel: [Perintah Slash](/id/tools/slash-commands)
  - permukaan perintah khusus saluran: [Saluran](/id/channels)
  - perintah QQ Bot: [QQ Bot](/id/channels/qqbot)
  - perintah pemasangan: [Pemasangan](/id/channels/pairing)
  - perintah kartu LINE: [LINE](/id/channels/line)
  - Dreaming memori: [Dreaming](/id/concepts/dreaming)

</Accordion>

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — kunci tingkat atas
- [Konfigurasi — agen](/id/gateway/config-agents)
- [Ikhtisar saluran](/id/channels)
