---
read_when:
    - Mengonfigurasi Plugin saluran (autentikasi, kontrol akses, multiakun)
    - Pemecahan masalah kunci konfigurasi per saluran
    - Mengaudit kebijakan DM, kebijakan grup, atau pembatasan penyebutan
summary: 'Konfigurasi channel: kontrol akses, pemasangan, kunci per channel di Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan lainnya'
title: Konfigurasi — saluran
x-i18n:
    generated_at: "2026-07-19T05:05:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c140baf821ecf9ebabebb365d3105d69fad742cd0cce1b6a8b9d8d46bb5e7642
    source_path: gateway/config-channels.md
    workflow: 16
---

Kunci konfigurasi per saluran di bawah `channels.*`: akses DM dan grup, penyiapan multi-akun, pembatasan berdasarkan sebutan, serta kunci per saluran untuk Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan Plugin saluran lainnya.

Untuk agen, alat, runtime Gateway, dan kunci tingkat atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Saluran

Setiap saluran dimulai secara otomatis saat bagian konfigurasinya tersedia (kecuali `enabled: false`). Telegram dan iMessage disertakan dalam paket inti `openclaw`. Saluran resmi lainnya (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost, dan lainnya) dipasang sebagai Plugin terpisah dengan `openclaw plugins install <spec>`; lihat [Saluran](/id/channels) untuk daftar lengkap dan spesifikasi pemasangan.

### Akses DM dan grup

Semua saluran mendukung kebijakan DM dan kebijakan grup:

| Kebijakan DM           | Perilaku                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (bawaan) | Pengirim tidak dikenal mendapatkan kode pemasangan satu kali; pemilik harus menyetujuinya |
| `allowlist`         | Hanya pengirim di `allowFrom` (atau penyimpanan izin yang telah dipasangkan)             |
| `open`              | Izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)             |
| `disabled`          | Abaikan semua DM masuk                                          |

| Kebijakan grup          | Perilaku                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (bawaan) | Hanya grup yang cocok dengan daftar izin yang dikonfigurasi          |
| `open`                | Abaikan daftar izin grup (pembatasan berdasarkan sebutan tetap berlaku) |
| `disabled`            | Blokir semua pesan grup/ruang                          |

<Note>
`channels.defaults.groupPolicy` menetapkan nilai bawaan saat `groupPolicy` milik penyedia tidak ditetapkan.
Kode pemasangan kedaluwarsa setelah 1 jam. Permintaan pemasangan yang tertunda dibatasi hingga **3 per akun** (dibatasi menurut saluran dan id akun).
Jika blok penyedia tidak ada sama sekali (`channels.<provider>` tidak tersedia), kebijakan grup runtime kembali ke `allowlist` (gagal secara tertutup) dengan peringatan saat dimulai.
</Note>

### Penggantian model saluran

Gunakan `channels.modelByChannel` untuk menetapkan ID saluran tertentu atau rekan pesan langsung ke suatu model. Nilai menerima `provider/model` atau alias model yang dikonfigurasi. Pemetaan saluran hanya berlaku saat sesi belum memiliki penggantian model aktif (misalnya, yang ditetapkan melalui `/model`).

Untuk percakapan grup/utas, kuncinya berupa ID grup, ID topik, atau nama saluran yang khusus untuk saluran tersebut. Untuk percakapan pesan langsung (DM), kuncinya berupa pengidentifikasi rekan yang berasal dari identitas pengirim saluran (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From`, atau `SenderId`). Bentuk kunci yang tepat bergantung pada saluran:

| Saluran  | Bentuk kunci DM         | Contoh                                      |
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

### Nilai bawaan saluran dan Heartbeat

Gunakan `channels.defaults` untuk perilaku kebijakan grup, sebutan implisit, dan Heartbeat bersama di seluruh penyedia:

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

- `channels.defaults.groupPolicy`: kebijakan grup cadangan saat `groupPolicy` tingkat penyedia tidak ditetapkan.
- `channels.defaults.contextVisibility`: mode visibilitas konteks tambahan bawaan untuk semua saluran. Nilai: `all` (bawaan, sertakan semua konteks kutipan/utas/riwayat), `allowlist` (hanya sertakan konteks dari pengirim dalam daftar izin), `allowlist_quote` (sama seperti daftar izin, tetapi pertahankan konteks kutipan/balasan eksplisit). Penggantian per saluran: `channels.<channel>.contextVisibility`.
- `channels.defaults.implicitMentions`: mengontrol fakta masuk yang didukung mana yang dianggap sebagai sebutan. `replyToBot`, `quotedBot`, dan `threadParticipation` masing-masing secara bawaan bernilai `true`, sehingga mempertahankan perilaku saat ini. Ganti per saluran dengan `channels.<channel>.implicitMentions` atau per akun dengan `channels.<channel>.accounts.<id>.implicitMentions`; setiap tanda diselesaikan secara independen dengan urutan akun -> saluran -> nilai bawaan. Namanya bersifat positif: tetapkan tanda ke `false` agar fakta tersebut tidak melewati pembatasan berdasarkan sebutan. Sebutan eksplisit asli selalu diizinkan, dan tanda tidak berpengaruh jika saluran tidak menghasilkan fakta tersebut. Lihat [Pembatasan berdasarkan sebutan](/id/channels/groups#mention-gating-default) untuk matriks penghasil saat ini. Pengaturan ini tidak mengubah mode balasan/utas keluar atau penanganan perintah yang diotorisasi.
- `channels.defaults.heartbeat.showOk`: sertakan status saluran yang sehat dalam keluaran Heartbeat (bawaan `false`).
- `channels.defaults.heartbeat.showAlerts`: sertakan status terdegradasi/kesalahan dalam keluaran Heartbeat (bawaan `true`).
- `channels.defaults.heartbeat.useIndicator`: render keluaran Heartbeat bergaya indikator ringkas (bawaan `true`).

### WhatsApp

WhatsApp berjalan melalui saluran web Gateway (Baileys Web). Saluran ini dimulai secara otomatis saat tersedia sesi yang ditautkan.

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = retry forever
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
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

- `web.whatsapp.keepAliveIntervalMs` (bawaan `25000`), `connectTimeoutMs` (bawaan `60000`), dan `defaultQueryTimeoutMs` (bawaan `60000`) menyetel soket Baileys.
- Nilai bawaan `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0` mencoba kembali selamanya alih-alih menyerah.
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi pengikatan ACP persisten untuk DM dan grup WhatsApp. Gunakan nomor langsung E.164 atau JID grup WhatsApp dalam `match.peer.id`. Semantik bidang digunakan bersama dalam [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).

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

- Perintah keluar secara bawaan menggunakan akun `default` jika tersedia; jika tidak, ID akun pertama yang dikonfigurasi (diurutkan).
- `channels.whatsapp.defaultAccount` opsional menggantikan pemilihan akun bawaan cadangan tersebut jika cocok dengan ID akun yang dikonfigurasi.
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

- Token bot: `channels.telegram.botToken` atau `channels.telegram.tokenFile` (hanya berkas biasa; symlink ditolak), dengan `TELEGRAM_BOT_TOKEN` sebagai fallback untuk akun default.
- `apiRoot` hanya merupakan root Telegram Bot API. Gunakan `https://api.telegram.org` atau root yang dihosting sendiri/proksi Anda, bukan `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` menghapus akhiran `/bot<TOKEN>` yang tidak sengaja ditambahkan.
- Untuk server Bot API yang dihosting sendiri dalam mode `--local`, `trustedLocalFileRoots` mencantumkan path host yang dapat dibaca OpenClaw. Pasang volume data server pada host OpenClaw dan konfigurasikan root datanya atau direktori per token; path kontainer di bawah `/var/lib/telegram-bot-api` dipetakan ke root tersebut. Path absolut lainnya tetap ditolak.
- `channels.telegram.defaultAccount` opsional mengganti pemilihan akun default ketika nilainya cocok dengan id akun yang dikonfigurasi.
- Dalam penyiapan multiakun (2+ id akun), tetapkan default secara eksplisit (`channels.telegram.defaultAccount` atau `channels.telegram.accounts.default`) untuk menghindari perutean fallback; `openclaw doctor` memperingatkan ketika nilai ini tidak ada atau tidak valid.
- `configWrites: false` memblokir penulisan konfigurasi yang dimulai dari Telegram (migrasi ID supergrup, `/config set|unset`).
- Entri `bindings[]` tingkat teratas dengan `type: "acp"` mengonfigurasi pengikatan ACP persisten untuk topik forum (gunakan `chatId:topic:topicId` kanonis di `match.peer.id`). Semantik bidang dijelaskan bersama dalam [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).
- Pratinjau streaming Telegram menggunakan `sendMessage` + `editMessageText` (berfungsi dalam obrolan langsung dan grup).
- `network.dnsResultOrder` secara default bernilai `"ipv4first"` untuk menghindari kegagalan pengambilan IPv6 yang umum.
- Kebijakan percobaan ulang: lihat [Kebijakan percobaan ulang](/id/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "token-bot-Anda",
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
      replyToMode: "off", // nonaktif | pertama | semua | kelompok
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
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // nonaktif | parsial | blok | progres (default Discord: progres)
        chunkMode: "length", // panjang | baris baru
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
        target: "dm", // dm | saluran | keduanya
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
- Panggilan keluar langsung yang memberikan `token` Discord eksplisit menggunakan token tersebut untuk panggilan; pengaturan percobaan ulang/kebijakan akun tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
- `channels.discord.defaultAccount` opsional menggantikan pemilihan akun default ketika cocok dengan id akun yang dikonfigurasi.
- Gunakan `user:<id>` (DM) atau `channel:<id>` (kanal guild) untuk target pengiriman; ID numerik tanpa awalan ditolak.
- Slug guild menggunakan huruf kecil dengan spasi diganti oleh `-`; kunci kanal menggunakan nama yang dijadikan slug (tanpa `#`). Utamakan ID guild.
- Pesan yang dibuat bot diabaikan secara default. `allowBots: true` mengaktifkannya; gunakan `allowBots: "mentions"` untuk hanya menerima pesan bot yang menyebut bot tersebut (pesannya sendiri tetap difilter).
- Kanal yang mendukung pesan masuk buatan bot dapat menggunakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Tetapkan `channels.defaults.botLoopProtection` untuk anggaran pasangan dasar, lalu ganti pada kanal atau akun hanya ketika satu permukaan memerlukan batas yang berbeda.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (dan penggantian kanal) membuang pesan yang menyebut pengguna atau peran lain tetapi tidak menyebut bot (kecuali @everyone/@here).
- `channels.discord.mentionAliases` memetakan teks `@handle` keluar yang stabil ke ID pengguna Discord sebelum mengirim, sehingga rekan tim yang dikenal dapat disebut secara deterministik bahkan ketika cache direktori sementara kosong. Penggantian per akun berada di bawah `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (default `17`) membagi pesan yang panjang secara vertikal meskipun kurang dari 2000 karakter.
- `channels.discord.suppressEmbeds` secara default bernilai `true`, sehingga URL keluar tidak diperluas menjadi pratinjau tautan Discord kecuali dinonaktifkan. Payload `embeds` eksplisit tetap dikirim secara normal; panggilan alat per pesan dapat menggantinya dengan `suppressEmbeds`.
- `channels.discord.threadBindings` mengontrol perutean yang terikat ke utas Discord:
  - `enabled`: penggantian Discord untuk fitur sesi yang terikat ke utas (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, serta pengiriman/perutean terikat)
  - `idleHours`: penggantian Discord untuk pelepasan fokus otomatis akibat tidak aktif dalam jam (`0` menonaktifkan)
  - `maxAgeHours`: penggantian Discord untuk usia maksimum mutlak dalam jam (`0` menonaktifkan)
  - `spawnSessions`: sakelar untuk pembuatan/pengikatan utas otomatis `sessions_spawn({ thread: true })` dan pemunculan utas ACP (default: `true`)
  - `defaultSpawnContext`: konteks subagen native untuk pemunculan yang terikat ke utas (`"fork"` secara default)
- Entri `bindings[]` tingkat atas dengan `type: "acp"` mengonfigurasi pengikatan ACP persisten untuk kanal dan utas (gunakan id kanal/utas di `match.peer.id`). Semantik bidang digunakan bersama dalam [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` menetapkan warna aksen untuk kontainer komponen Discord v2.
- `channels.discord.agentComponents.ttlMs` mengontrol berapa lama callback komponen Discord yang dikirim tetap terdaftar. Default `1800000` (30 menit), maksimum `86400000` (24 jam). Penggantian per akun berada di bawah `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Utamakan TTL terpendek yang sesuai dengan alur kerja.
- `channels.discord.voice` mengaktifkan percakapan kanal suara Discord serta penggantian opsional untuk bergabung otomatis + LLM + TTS. Konfigurasi Discord khusus teks menonaktifkan suara secara default; tetapkan `channels.discord.voice.enabled=true` untuk mengaktifkannya.
- `channels.discord.voice.model` secara opsional menggantikan model LLM yang digunakan untuk respons kanal suara Discord.
- `channels.discord.voice.daveEncryption` (default `true`) dan `channels.discord.voice.decryptionFailureTolerance` (default `24`) diteruskan ke opsi DAVE `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` mengontrol waktu tunggu Ready `@discordjs/voice` awal untuk `/vc join` dan upaya bergabung otomatis (default `30000`).
- `channels.discord.voice.reconnectGraceMs` mengontrol berapa lama sesi suara yang terputus boleh memasuki pensinyalan penyambungan ulang sebelum OpenClaw menghancurkannya (default `15000`).
- Pemutaran suara Discord tidak diinterupsi oleh peristiwa mulai berbicara dari pengguna lain. Untuk menghindari loop umpan balik, OpenClaw mengabaikan perekaman suara baru saat TTS sedang diputar.
- OpenClaw juga mencoba memulihkan penerimaan suara dengan keluar dan bergabung kembali ke sesi suara setelah kegagalan dekripsi berulang.
- `channels.discord.streaming` adalah kunci mode aliran kanonis. Discord secara default menggunakan `streaming.mode: "progress"` agar progres alat/pekerjaan muncul dalam satu pesan pratinjau yang diedit; tetapkan `streaming.mode: "off"` untuk menonaktifkannya. Kunci datar lama (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) tidak lagi dibaca saat runtime; jalankan `openclaw doctor --fix` untuk memigrasikan konfigurasi persisten.
- `channels.discord.autoPresence` memetakan ketersediaan runtime ke kehadiran bot (sehat => daring, menurun => menganggur, habis => dnd) dan memungkinkan penggantian teks status opsional.
- `channels.discord.guilds.<id>.presenceEvents` merutekan kedatangan ketersediaan manusia ke satu kanal Discord yang dikonfigurasi sebagai peristiwa sistem agen. Anggota yang memenuhi syarat harus dapat melihat `channelId`; utas publik mewarisi visibilitas induk, sedangkan utas privat juga memerlukan keanggotaan atau Manage Threads. `users` dapat mempersempit audiens tersebut lebih lanjut. Fitur ini menginisialisasi anggota yang sedang daring dari snapshot `GUILD_CREATE` lengkap, merutekan transisi luring-ke-daring yang diamati, dan memperlakukan sinyal daring pertama di kemudian hari untuk anggota yang belum terlihat sebagai baru tersedia tanpa menyatakan apakah mereka menjadi daring atau bergabung setelah snapshot. Guild yang melebihi batas snapshot 75.000 anggota Discord memerlukan pembaruan luring eksplisit terlebih dahulu. Pengaturan pembatasan: `reconnectSuppressSeconds` (jendela tenang setelah sesi Gateway baru sementara status kehadiran guild dibangun ulang, default 300, `0` menonaktifkan) dan `burstLimit`/`burstWindowSeconds` (batas laju per guild untuk peristiwa yang berhasil dimasukkan ke antrean, default 8 peristiwa per jendela bergulir 60d). Sesi yang dilanjutkan tidak memulai jendela penekanan penyambungan ulang. Masa tunggu penyambutan ulang per pengguna yang ada tetap delapan jam. Fitur ini memerlukan `channels.discord.intents.presence=true`, Presence Intent berhak istimewa di Developer Portal Discord, serta heartbeat agen yang diaktifkan.
- `channels.discord.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan nama/tag yang dapat berubah (mode kompatibilitas darurat).
- `channels.discord.execApprovals`: pengiriman persetujuan eksekusi native Discord dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode otomatis, persetujuan eksekusi aktif ketika pemberi persetujuan dapat ditentukan dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Discord yang diizinkan menyetujui permintaan eksekusi. Menggunakan `commands.ownerAllowFrom` sebagai fallback jika dihilangkan.
  - `agentFilter`: daftar izin ID agen opsional. Hilangkan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim permintaan persetujuan. `"dm"` (default) mengirim ke DM pemberi persetujuan, `"channel"` mengirim ke kanal asal, `"both"` mengirim ke keduanya. Ketika target menyertakan `"channel"`, tombol hanya dapat digunakan oleh pemberi persetujuan yang telah ditentukan.
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

- JSON akun layanan: sebaris (`serviceAccount`) atau berbasis berkas (`serviceAccountFile`).
- SecretRef akun layanan juga didukung (`serviceAccountRef`).
- Fallback variabel lingkungan: `GOOGLE_CHAT_SERVICE_ACCOUNT` atau `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (hanya akun default).
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
          systemPrompt: "Jawaban singkat saja.",
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
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // gunakan API streaming native Slack ketika mode=partial
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

- **Mode Socket** memerlukan `botToken` dan `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` untuk fallback env akun default).
- **Mode HTTP** memerlukan `botToken` ditambah `signingSecret` (di root atau per akun).
- **Identitas pengguna** (`identity: "user"`) memposting dan membaca sebagai manusia yang memberikan otorisasi. Ini memerlukan `userToken` ditambah `appToken` dalam Mode Socket, atau `userToken` ditambah `signingSecret` dalam mode HTTP. Token bot atau pengguna bot tidak diperlukan. Lihat [Identitas pengguna](/id/channels/slack#user-identity-post-as-a-real-person) untuk cakupan pengguna dan langganan peristiwa.
- `enterpriseOrgInstall: true` mengikutsertakan akun dalam jalur peristiwa
  seluruh organisasi Slack Enterprise Grid. Saat dimulai, token bot diverifikasi dengan `auth.test` dan
  proses gagal ketika mode yang dikonfigurasi tidak cocok dengan identitas instalasi Slack.
  DM Enterprise harus dinonaktifkan atau menggunakan `dmPolicy: "open"` dengan
  `allowFrom: ["*"]` yang efektif. Kebijakan saluran dan pengguna harus menggunakan ID Slack yang stabil;
  nama yang dapat berubah dan prefiks saluran yang tidak didukung menyebabkan proses awal gagal. V1 hanya menangani
  peristiwa Mode Socket langsung atau HTTP `message` dan `app_mention` dengan balasan
  langsung; relai, perintah, interaksi, App Home, pemroses peristiwa reaksi,
  pin, alat tindakan, persetujuan native, pengikatan, pengiriman tertunda, dan
  pengiriman proaktif tidak tersedia. Pengakuan, indikator pengetikan, dan
  reaksi status yang dimiliki pemroses tetap tersedia dengan `reactions:write`; notifikasi reaksi
  masuk dan alat tindakan reaksi tidak tersedia. Lihat
  [Instalasi seluruh organisasi Enterprise Grid](/id/channels/slack#enterprise-grid-org-wide-installs)
  untuk manifes dengan hak akses minimum, alur kerja penyiapan, dan batasan lengkap.
- `socketMode` meneruskan penyetelan transportasi Mode Socket SDK Slack ke API receiver Bolt publik. Gunakan hanya saat menyelidiki batas waktu ping/pong atau perilaku websocket yang usang. `clientPingTimeout` secara default bernilai `15000`; `serverPingTimeout` dan `pingPongLoggingEnabled` hanya diteruskan jika dikonfigurasi.
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string
  teks biasa atau objek SecretRef.
- Snapshot akun Slack mengekspos bidang sumber/status per kredensial seperti
  `botTokenSource`, `botTokenStatus`, `userTokenSource`, `userTokenStatus`,
  `appTokenStatus`, dan, dalam mode HTTP, `signingSecretStatus`.
  `configured_unavailable` berarti akun
  dikonfigurasi melalui SecretRef, tetapi jalur perintah/runtime saat ini tidak dapat
  menyelesaikan nilai rahasia tersebut.
- `configWrites: false` memblokir penulisan konfigurasi yang dimulai oleh Slack.
- `channels.slack.defaultAccount` opsional mengganti pemilihan akun default jika cocok dengan ID akun yang dikonfigurasi.
- `channels.slack.streaming.mode` adalah kunci mode stream Slack kanonis (default `"partial"`). `channels.slack.streaming.nativeTransport` mengontrol transportasi streaming native Slack (default `true`). Nilai lama `streamMode`, boolean `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce`, dan `nativeStreaming` tidak lagi dibaca saat runtime; jalankan `openclaw doctor --fix` untuk memigrasikan konfigurasi tersimpan ke `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` dan `unfurlMedia` meneruskan boolean pembentangan tautan dan media `chat.postMessage` milik Slack untuk balasan bot. `unfurlLinks` secara default bernilai `false` agar tautan bot keluar tidak diperluas sebaris kecuali diaktifkan; `unfurlMedia` dihilangkan kecuali dikonfigurasi. Tetapkan salah satu nilai di `channels.slack.accounts.<accountId>` untuk mengganti nilai tingkat atas bagi satu akun.
- Gunakan `user:<id>` (DM) atau `channel:<id>` untuk target pengiriman.

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

**Isolasi sesi utas:** `thread.historyScope` bersifat per utas (default) atau dibagikan di seluruh saluran. `thread.inheritParent` menyalin transkrip saluran induk ke utas baru. `thread.initialHistoryLimit` (default `20`) membatasi jumlah pesan utas yang sudah ada yang diambil saat sesi utas baru dimulai; `0` menonaktifkan pengambilan riwayat utas.

- Streaming native Slack ditambah status utas bergaya asisten Slack "sedang mengetik..." memerlukan target utas balasan. DM tingkat atas tetap berada di luar utas secara default, sehingga masih dapat melakukan streaming melalui pratinjau draf Slack dengan metode posting lalu penyuntingan, alih-alih menampilkan pratinjau stream/status native bergaya utas.
- `typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat balasan sedang diproses, lalu menghapusnya setelah selesai. Gunakan kode pendek emoji Slack seperti `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: pengiriman klien persetujuan native Slack dan otorisasi penyetuju eksekusi. Skemanya sama dengan Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID pengguna Slack), `agentFilter`, `sessionFilter`, dan `target` (`"dm"`, `"channel"`, atau `"both"`). Persetujuan Plugin dapat menggunakan jalur klien native ini untuk permintaan yang berasal dari Slack ketika penyetuju Plugin Slack berhasil ditentukan; pengiriman persetujuan Plugin native Slack juga dapat diaktifkan melalui `approvals.plugin` untuk sesi yang berasal dari Slack atau target Slack. Persetujuan Plugin menggunakan penyetuju Plugin Slack dari `allowFrom` dan perutean default, bukan penyetuju eksekusi.

| Grup tindakan | Default | Catatan                  |
| ------------ | ------- | ---------------------- |
| reactions    | diaktifkan | Bereaksi + cantumkan reaksi |
| messages     | diaktifkan | Baca/kirim/edit/hapus  |
| pins         | diaktifkan | Sematkan/lepas sematan/cantumkan |
| memberInfo   | diaktifkan | Informasi anggota            |
| emojiList    | diaktifkan | Daftar emoji khusus      |

### Mattermost

Mattermost diinstal sebagai Plugin terpisah, sama seperti Discord, Slack, dan WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Periksa [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) untuk dist-tag saat ini sebelum menyematkan versi.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // saat dipanggil | saat ada pesan | saat ada karakter
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // ikut serta
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

Mode obrolan: `oncall` (merespons saat @-mention, default), `onmessage` (setiap pesan), `onchar` (pesan yang dimulai dengan prefiks pemicu).

Saat perintah native Mattermost diaktifkan:

- `commands.callbackPath` harus berupa jalur (misalnya `/api/channels/mattermost/command`), bukan URL lengkap.
- `commands.callbackUrl` harus mengarah ke endpoint Gateway OpenClaw dan dapat dijangkau dari server Mattermost.
- Callback slash native diautentikasi dengan token per perintah yang dikembalikan
  oleh Mattermost selama pendaftaran perintah slash. Jika pendaftaran gagal atau tidak ada
  perintah yang diaktifkan, OpenClaw menolak callback dengan
  `Unauthorized: invalid command token.`
- Untuk host callback privat/tailnet/internal, Mattermost mungkin mengharuskan
  `ServiceSettings.AllowedUntrustedInternalConnections` menyertakan host/domain callback.
  Gunakan nilai host/domain, bukan URL lengkap.
- `channels.mattermost.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai oleh Mattermost.
- `channels.mattermost.requireMention`: wajibkan `@mention` sebelum membalas di saluran.
- `channels.mattermost.groups.<channelId>.requireMention`: penggantian pembatasan berbasis mention per saluran (`"*"` untuk default).
- `channels.mattermost.defaultAccount` opsional mengganti pemilihan akun default jika cocok dengan ID akun yang dikonfigurasi.

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

- `channels.signal.account`: sematkan proses awal saluran ke identitas akun Signal tertentu.
- `channels.signal.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai oleh Signal.
- `channels.signal.defaultAccount` opsional mengganti pemilihan akun default jika cocok dengan ID akun yang dikonfigurasi.

### iMessage

OpenClaw menjalankan `imsg rpc` (JSON-RPC melalui stdio). Tidak memerlukan daemon atau port. Ini adalah jalur yang disarankan untuk penyiapan iMessage OpenClaw baru ketika host dapat memberikan izin basis data Messages dan Automation.

Dukungan BlueBubbles telah dihapus. `channels.bluebubbles` bukan permukaan konfigurasi runtime yang didukung pada OpenClaw saat ini. Migrasikan konfigurasi lama ke `channels.imessage`; gunakan [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) untuk versi singkat dan [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) untuk tabel translasi lengkap.

Jika Gateway tidak berjalan di Mac Messages yang sedang masuk, pertahankan `channels.imessage.enabled=true` dan tetapkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg "$@"` di Mac tersebut. Jalur lokal default `imsg` hanya tersedia di macOS.

Sebelum mengandalkan wrapper SSH untuk pengiriman produksi, verifikasi `imsg send` keluar melalui wrapper tersebut secara persis. Beberapa status TCC macOS menetapkan Messages Automation ke `/usr/libexec/sshd-keygen-wrapper`, yang dapat membuat pembacaan dan pemeriksaan berfungsi sementara pengiriman gagal dengan AppleEvents `-1743`; lihat bagian pemecahan masalah wrapper SSH di [iMessage](/id/channels/imessage).

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

- `channels.imessage.defaultAccount` opsional mengganti pemilihan akun default jika cocok dengan id akun yang dikonfigurasi.
- Memerlukan Full Disk Access ke basis data Messages.
- Utamakan target `chat_id:<id>`. Gunakan `imsg chats --limit 20` untuk mencantumkan obrolan.
- `cliPath` dapat mengarah ke pembungkus SSH; tetapkan `remoteHost` (`host` atau `user@host`) untuk mengambil lampiran melalui SCP.
- `attachmentRoots` dan `remoteAttachmentRoots` membatasi jalur lampiran masuk (default: `/Users/*/Library/Messages/Attachments`).
- SCP menggunakan pemeriksaan kunci host yang ketat, jadi pastikan kunci host relai sudah ada di `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: izinkan atau tolak penulisan konfigurasi yang dimulai dari iMessage.
- `channels.imessage.sendTransport`: transportasi pengiriman RPC `imsg` yang diutamakan untuk balasan keluar normal. `auto` (default) menggunakan jembatan IMCore untuk obrolan yang sudah ada ketika jembatan tersebut berjalan, lalu beralih ke AppleScript sebagai fallback; `bridge` memerlukan pengiriman melalui API privat; `applescript` memaksa penggunaan jalur otomatisasi Messages publik.
- `channels.imessage.actions.*`: aktifkan tindakan API privat yang juga dibatasi oleh `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` dinonaktifkan secara default; tetapkan ke `true` sebelum mengharapkan media masuk dalam giliran agen.
- Pemulihan pesan masuk setelah jembatan/gateway dimulai ulang berlangsung otomatis (deduplikasi GUID ditambah batas usia backlog lama). Konfigurasi `channels.imessage.catchup.enabled: true` yang sudah ada masih dipatuhi sebagai profil kompatibilitas yang tidak digunakan lagi; `catchup` dinonaktifkan secara default.
- `channels.imessage.groups`: registri grup dan pengaturan per grup. Dengan `groupPolicy: "allowlist"`, konfigurasikan kunci `chat_id` eksplisit atau entri wildcard `"*"` agar pesan grup dapat melewati gerbang registri.
- Entri `bindings[]` tingkat atas dengan `type: "acp"` dapat mengikat percakapan iMessage ke sesi ACP persisten. Gunakan handle yang dinormalisasi atau target obrolan eksplisit (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) dalam `match.peer.id`. Semantik kolom bersama: [Agen ACP](/id/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Contoh pembungkus SSH iMessage">

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
- `channels.matrix.proxy` merutekan lalu lintas HTTP Matrix melalui proksi HTTP(S) eksplisit. Akun bernama dapat menggantinya dengan `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` mengizinkan homeserver privat/internal. `proxy` dan persetujuan jaringan ini merupakan kontrol yang independen.
- `channels.matrix.defaultAccount` memilih akun yang diutamakan dalam penyiapan multiakun.
- `channels.matrix.autoJoin` menggunakan `"off"` secara default, sehingga ruang yang mengundang dan undangan baru bergaya DM diabaikan sampai Anda menetapkan `autoJoin: "allowlist"` dengan `autoJoinAllowlist` atau `autoJoin: "always"`.
- `channels.matrix.execApprovals`: pengiriman persetujuan eksekusi asli Matrix dan otorisasi pemberi persetujuan.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode otomatis, persetujuan eksekusi diaktifkan ketika pemberi persetujuan dapat ditentukan dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Matrix (misalnya `@owner:example.org`) yang diizinkan untuk menyetujui permintaan eksekusi.
  - `agentFilter`: daftar izin ID agen opsional. Hilangkan untuk meneruskan persetujuan bagi semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tujuan pengiriman permintaan persetujuan. `"dm"` (default), `"channel"` (ruang asal), atau `"both"`.
  - Penggantian per akun: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` mengontrol cara DM Matrix dikelompokkan menjadi sesi: `per-user` (default) berbagi berdasarkan rekan yang dirutekan, sedangkan `per-room` mengisolasi setiap ruang DM.
- Probe status Matrix dan pencarian direktori langsung menggunakan kebijakan proksi yang sama dengan lalu lintas runtime.
- Konfigurasi lengkap Matrix, aturan penargetan, dan contoh penyiapan didokumentasikan dalam [Matrix](/id/channels/matrix).

### Microsoft Teams

Microsoft Teams didukung oleh plugin dan dikonfigurasi di bawah `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // lihat /channels/msteams
    },
  },
}
```

- Jalur kunci inti yang dibahas di sini: `channels.msteams`, `channels.msteams.configWrites`.
- Konfigurasi lengkap Teams (kredensial, webhook, kebijakan DM/grup, penggantian per tim/per saluran) didokumentasikan dalam [Microsoft Teams](/id/channels/msteams).

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
- `channels.irc.defaultAccount` opsional mengganti pemilihan akun default jika cocok dengan id akun yang dikonfigurasi.
- Konfigurasi lengkap saluran IRC (host/port/TLS/saluran/daftar izin/pembatasan penyebutan) didokumentasikan dalam [IRC](/id/channels/irc).

### Multiakun (semua saluran)

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
- Token lingkungan hanya berlaku untuk akun **default**.
- Pengaturan saluran dasar berlaku untuk semua akun kecuali diganti per akun.
- Gunakan `bindings[].match.accountId` untuk merutekan setiap akun ke agen yang berbeda.
- Jika Anda menambahkan akun non-default melalui `openclaw channels add` (atau orientasi saluran) saat masih menggunakan konfigurasi saluran tingkat atas satu akun, OpenClaw terlebih dahulu memindahkan nilai satu akun tingkat atas yang tercakup pada akun ke dalam peta akun saluran agar akun asli tetap berfungsi. Sebagian besar saluran memindahkannya ke `channels.<channel>.accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada dan cocok.
- Pengikatan khusus saluran yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default; pengikatan yang tercakup pada akun tetap opsional.
- `openclaw doctor --fix` juga memperbaiki bentuk campuran dengan memindahkan nilai satu akun tingkat atas yang tercakup pada akun ke dalam akun hasil pemindahan yang dipilih untuk saluran tersebut. Sebagian besar saluran menggunakan `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada dan cocok.

### Saluran plugin lainnya

Banyak saluran plugin dikonfigurasi sebagai `channels.<id>` dan didokumentasikan di halaman khusus salurannya (misalnya Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch, dan Zalo).
Lihat indeks saluran lengkap: [Saluran](/id/channels).

### Pembatasan penyebutan dalam obrolan grup

Pesan grup secara default **memerlukan penyebutan** (penyebutan metadata atau pola regex yang aman). Berlaku untuk obrolan grup WhatsApp, Telegram, Discord, Google Chat, dan iMessage.

Balasan yang terlihat dikontrol secara terpisah. Permintaan langsung dari grup, saluran, dan WebChat internal normal menggunakan pengiriman akhir otomatis secara default: teks akhir asisten dikirim melalui jalur balasan terlihat lama. Aktifkan `messages.visibleReplies: "message_tool"` atau `messages.groupChat.visibleReplies: "message_tool"` ketika balasan sumber yang ditulis model hanya boleh dikirim setelah agen memanggil `message(action=send)`. Jika model mengembalikan jawaban akhir substantif tanpa memanggil alat pesan dalam mode khusus alat yang telah diaktifkan, teks akhir tersebut tetap privat, log verbose gateway mencatat metadata payload yang disembunyikan, dan OpenClaw mengantrekan satu percobaan ulang pemulihan yang meminta model mengirimkan balasan yang sama melalui `message(action=send)`.

Kebijakan khusus alat mengatur balasan sumber asisten dan media alat generik. Kebijakan ini tidak menyembunyikan keluaran terminal milik runtime seperti respons perintah yang diotorisasi, pemberitahuan penyelesaian persisten, atau artefak asli penyedia yang secara eksplisit diklasifikasikan oleh harness pemilik sebagai milik host. Artefak milik host dikirim melalui jalur dispatch saluran normal dan tetap mematuhi penolakan `sendPolicy` keluar. Giliran `room_event` sekitar tetap senyap kecuali merupakan perintah eksplisit, bahkan ketika keluaran runtime ditandai sebagai milik host.

Balasan terlihat khusus alat memerlukan model/runtime yang memanggil alat secara andal dan direkomendasikan untuk ruang bersama sekitar pada model generasi terbaru seperti GPT-5.6 Sol. Beberapa model yang lebih lemah dapat menghasilkan teks akhir, tetapi gagal memahami bahwa keluaran yang terlihat oleh sumber harus dikirim dengan `message(action=send)`. Secara default, OpenClaw memulihkan kasus umum jawaban akhir yang tertahan hanya ketika jawaban akhir tersebut substantif, giliran sumber bukan peristiwa ruang, kebijakan pengiriman tidak menolak pengiriman, dan belum ada balasan sumber yang dikirim. Pemulihan dibatasi pada satu percobaan ulang; pemulihan ini mencegah persistensi untuk prompt percobaan ulang sintetis dan mengecualikan percobaan ulang tersebut dari batching collect agar tidak dapat digabungkan dengan prompt antrean lain yang tidak terkait. Jika percobaan ulang juga tertahan atau tidak dapat diantrekan, OpenClaw hanya mengirimkan diagnostik yang telah disanitasi seperti "Saya menghasilkan balasan tetapi tidak dapat mengirimkannya ke obrolan ini. Silakan coba lagi." Teks akhir privat yang asli tidak pernah ditandai untuk pengiriman sumber otomatis. Untuk model yang berulang kali menahan balasan, gunakan `"automatic"` agar giliran akhir asisten menjadi jalur balasan terlihat, beralihlah ke model pemanggil alat yang lebih kuat, periksa log verbose gateway untuk ringkasan payload yang disembunyikan, atau tetapkan `messages.groupChat.visibleReplies: "automatic"` untuk menggunakan balasan akhir terlihat bagi setiap permintaan grup/saluran.

Jika alat pesan tidak tersedia berdasarkan kebijakan alat aktif, OpenClaw beralih ke balasan terlihat otomatis alih-alih menyembunyikan respons secara diam-diam. `openclaw doctor` memperingatkan ketidakcocokan ini.

Aturan ini berlaku untuk teks akhir agen normal. Pengikatan percakapan milik plugin menggunakan balasan yang dikembalikan oleh plugin pemilik sebagai respons terlihat untuk giliran utas terikat yang diklaim; plugin tidak perlu memanggil `message(action=send)` untuk balasan pengikatan tersebut.

**Pemecahan masalah: @mention grup memicu indikator mengetik lalu tidak ada respons (tanpa kesalahan)**

Gejala: @mention grup/saluran menampilkan indikator mengetik dan log gateway melaporkan `dispatch complete (queuedFinal=false, replies=0)`, tetapi tidak ada pesan yang masuk ke ruang. DM ke agen yang sama dibalas secara normal.

Penyebab: mode balasan terlihat grup/channel diresolusikan menjadi `"message_tool"`, sehingga OpenClaw menjalankan giliran tetapi menyembunyikan teks akhir asisten kecuali agen memanggil `message(action=send)`. Tidak ada kontrak `NO_REPLY` dalam mode ini; tanpa pemanggilan alat pesan, teks akhir asli bersifat privat. Untuk giliran sumber yang substantif, OpenClaw kini mencoba satu percobaan ulang pemulihan yang dilindungi; catatan singkat, pembungkaman eksplisit, peristiwa ruang, giliran yang ditolak kebijakan pengiriman, dan giliran yang sudah dikirim tidak dicoba ulang. Giliran grup dan channel normal secara default menggunakan `"automatic"`, sehingga gejala ini hanya muncul ketika `messages.groupChat.visibleReplies` (atau `messages.visibleReplies` global) secara eksplisit diatur ke `"message_tool"`. `defaultVisibleReplies` harness tidak berlaku di sini — resolver grup/channel mengabaikannya; ini hanya memengaruhi obrolan langsung/sumber (harness Codex menyembunyikan hasil akhir obrolan langsung dengan cara tersebut).

Perbaikan: pilih model pemanggil alat yang lebih kuat, hapus penggantian eksplisit `"message_tool"` agar kembali ke default `"automatic"`, atau atur `messages.groupChat.visibleReplies: "automatic"` untuk memaksakan balasan terlihat bagi setiap permintaan grup/channel. Hasil akhir substantif yang terlantar seharusnya tidak lagi berakhir sebagai keberhasilan tanpa keluaran; hasil tersebut harus pulih melalui satu percobaan ulang `message(action=send)` atau menampilkan diagnostik kegagalan pengiriman yang telah disanitasi. Gateway memuat ulang secara langsung konfigurasi `messages` setelah file disimpan; mulai ulang gateway hanya jika pemantauan file atau pemuatan ulang konfigurasi dinonaktifkan dalam deployment.

**Jenis mention:**

- **Mention metadata**: @-mention native platform. Diabaikan dalam mode obrolan mandiri WhatsApp.
- **Pola teks**: Pola regex aman dalam `agents.list[].groupChat.mentionPatterns`. Pola yang tidak valid dan pengulangan bertingkat yang tidak aman diabaikan.
- Pembatasan mention hanya diberlakukan jika deteksi memungkinkan (mention native atau setidaknya satu pola).

```json5
{
  messages: {
    visibleReplies: "automatic", // paksa balasan akhir otomatis lama untuk obrolan langsung/sumber
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // percakapan ruang tanpa mention yang selalu aktif menjadi konteks senyap
      visibleReplies: "message_tool", // ikut serta; wajibkan message(action=send) untuk balasan ruang yang terlihat
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` menetapkan default global. Channel dapat menggantinya dengan `channels.<channel>.historyLimit` (atau per akun). Atur `0` untuk menonaktifkannya.

`messages.groupChat.unmentionedInbound: "room_event"` mengirimkan pesan grup/channel tanpa mention yang selalu aktif sebagai konteks ruang senyap pada channel yang didukung. Pesan dengan mention, perintah, dan pesan langsung tetap menjadi permintaan pengguna. Lihat [Peristiwa ruang ambien](/id/channels/ambient-room-events) untuk contoh lengkap Discord, Slack, dan Telegram.

`messages.visibleReplies` adalah default peristiwa sumber global; `messages.groupChat.visibleReplies` menggantikannya untuk peristiwa sumber grup/channel. Ketika `messages.visibleReplies` tidak diatur, obrolan langsung/sumber menggunakan default runtime atau harness yang dipilih, tetapi giliran langsung WebChat internal menggunakan pengiriman akhir otomatis demi kesetaraan prompt Pi/Codex. Atur `messages.visibleReplies: "message_tool"` agar secara sengaja mewajibkan `message(action=send)` untuk keluaran yang terlihat. Daftar izin channel dan pembatasan mention tetap menentukan apakah suatu peristiwa diproses.

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

Resolver ini membaca `channels.<provider>.dmHistoryLimit` dan `channels.<provider>.dms.<id>.historyLimit` untuk channel apa pun yang kunci sesinya mengikuti bentuk standar `provider:direct:<id>` (atau bentuk lama `provider:dm:<id>`), sehingga dapat digunakan pada channel bawaan maupun channel Plugin, bukan hanya daftar tetap.

#### Mode obrolan mandiri

Sertakan nomor Anda sendiri dalam `allowFrom` untuk mengaktifkan mode obrolan mandiri (mengabaikan @-mention native dan hanya merespons pola teks):

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
    nativeSkills: "auto", // daftarkan perintah Skills native jika didukung
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
- Halaman ini adalah **referensi kunci konfigurasi**, bukan katalog perintah lengkap. Perintah milik channel/Plugin seperti QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, pasangan perangkat `/pair`, memori `/dreaming`, kontrol telepon `/phone`, dan Talk `/voice` didokumentasikan di halaman channel/Plugin masing-masing serta [Perintah Slash](/id/tools/slash-commands).
- Perintah teks harus berupa pesan **mandiri** dengan awalan `/`.
- `native: "auto"` mengaktifkan perintah native untuk Discord/Telegram dan membiarkannya nonaktif untuk Slack.
- `nativeSkills: "auto"` mengaktifkan perintah Skills native untuk Discord/Telegram dan membiarkannya nonaktif untuk Slack.
- Ganti per channel: `channels.discord.commands.native` (boolean atau `"auto"`). Untuk Discord, `false` melewati pendaftaran dan pembersihan perintah native selama startup.
- Ganti pendaftaran Skills native per channel dengan `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` menambahkan entri menu bot Telegram tambahan.
- `bash: true` mengaktifkan `! <cmd>` untuk shell host. Memerlukan `tools.elevated.enabled` dan pengirim yang terdapat dalam `tools.elevated.allowFrom.<channel>`.
- `config: true` mengaktifkan `/config` (membaca/menulis `openclaw.json`). Untuk klien `chat.send` gateway, penulisan persisten `/config set|unset` juga memerlukan `operator.admin`; `/config show` hanya-baca tetap tersedia bagi klien operator normal dengan cakupan tulis.
- `mcp: true` mengaktifkan `/mcp` untuk konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`.
- `plugins: true` mengaktifkan `/plugins` untuk penemuan, instalasi, serta kontrol aktif/nonaktif Plugin.
- `channels.<provider>.configWrites` membatasi mutasi konfigurasi per channel (default: true).
- Untuk channel multiakun, `channels.<provider>.accounts.<id>.configWrites` juga membatasi penulisan yang menargetkan akun tersebut (misalnya `/allowlist --config --account <id>` atau `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` menonaktifkan `/restart` dan permintaan mulai ulang `SIGUSR1` eksternal. Default: `true`.
- `ownerAllowFrom` adalah daftar izin pemilik eksplisit untuk perintah khusus pemilik dan tindakan channel yang dibatasi bagi pemilik. Daftar ini terpisah dari `allowFrom`.
- `ownerDisplay: "hash"` melakukan hash pada id pemilik dalam prompt sistem. Atur `ownerDisplaySecret` untuk mengontrol hashing.
- `allowFrom` berlaku per penyedia. Jika diatur, ini menjadi **satu-satunya** sumber otorisasi (daftar izin/pemasangan channel dan `useAccessGroups` diabaikan).
- `useAccessGroups: false` memungkinkan perintah melewati kebijakan grup akses ketika `allowFrom` tidak diatur.
- Peta dokumentasi perintah:
  - katalog bawaan + terbundel: [Perintah Slash](/id/tools/slash-commands)
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
