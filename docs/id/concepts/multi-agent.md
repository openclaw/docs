---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Routing multi-agen: agen terisolasi, akun kanal, dan binding'
title: Routing multi-agen
x-i18n:
    generated_at: "2026-04-24T09:04:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

Jalankan beberapa agen _terisolasi_ — masing-masing dengan workspace, direktori status (`agentDir`), dan riwayat sesi sendiri — ditambah beberapa akun kanal (mis. dua WhatsApp) dalam satu Gateway yang sedang berjalan. Pesan masuk dirutekan ke agen yang tepat melalui binding.

Yang dimaksud dengan **agen** di sini adalah cakupan penuh per persona: file workspace, profil autentikasi, registry model, dan penyimpanan sesi. `agentDir` adalah direktori status di disk yang menyimpan konfigurasi per agen ini di `~/.openclaw/agents/<agentId>/`. Sebuah **binding** memetakan akun kanal (mis. workspace Slack atau nomor WhatsApp) ke salah satu agen tersebut.

## Apa itu "satu agen"?

Sebuah **agen** adalah otak bercakupan penuh dengan miliknya sendiri:

- **Workspace** (file, AGENTS.md/SOUL.md/USER.md, catatan lokal, aturan persona).
- **Direktori status** (`agentDir`) untuk profil autentikasi, registry model, dan konfigurasi per agen.
- **Penyimpanan sesi** (riwayat obrolan + status routing) di bawah `~/.openclaw/agents/<agentId>/sessions`.

Profil autentikasi bersifat **per agen**. Setiap agen membaca dari file miliknya sendiri:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` juga merupakan jalur recall lintas sesi yang lebih aman di sini: jalur ini mengembalikan
tampilan yang dibatasi dan disanitasi, bukan dump transkrip mentah. Recall asisten
menghapus tag thinking, scaffolding `<relevant-memories>`, payload XML tool-call
teks biasa (termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok tool-call yang terpotong),
scaffolding tool-call yang diturunkan, token kontrol model ASCII/full-width yang bocor,
dan XML tool-call MiniMax yang malformed sebelum redaksi/pemotongan.

Kredensial agen utama **tidak** dibagikan secara otomatis. Jangan pernah menggunakan ulang `agentDir`
antar agen (ini menyebabkan benturan autentikasi/sesi). Jika Anda ingin membagikan kredensial,
salin `auth-profiles.json` ke `agentDir` agen lainnya.

Skills dimuat dari setiap workspace agen ditambah root bersama seperti
`~/.openclaw/skills`, lalu difilter oleh allowlist skill agen efektif ketika
dikonfigurasi. Gunakan `agents.defaults.skills` untuk baseline bersama dan
`agents.list[].skills` untuk penggantian per agen. Lihat
[Skills: per-agent vs shared](/id/tools/skills#per-agent-vs-shared-skills) dan
[Skills: agent skill allowlists](/id/tools/skills#agent-skill-allowlists).

Gateway dapat meng-host **satu agen** (default) atau **banyak agen** berdampingan.

**Catatan workspace:** workspace setiap agen adalah **cwd default**, bukan
sandbox keras. Path relatif diselesaikan di dalam workspace, tetapi path absolut dapat
menjangkau lokasi host lain kecuali sandboxing diaktifkan. Lihat
[Sandboxing](/id/gateway/sandboxing).

## Path (peta cepat)

- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori status: `~/.openclaw` (atau `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (atau `~/.openclaw/workspace-<agentId>`)
- Direktori agen: `~/.openclaw/agents/<agentId>/agent` (atau `agents.list[].agentDir`)
- Sesi: `~/.openclaw/agents/<agentId>/sessions`

### Mode satu agen (default)

Jika Anda tidak melakukan apa pun, OpenClaw menjalankan satu agen:

- `agentId` default adalah **`main`**.
- Sesi dikey sebagai `agent:main:<mainKey>`.
- Workspace default adalah `~/.openclaw/workspace` (atau `~/.openclaw/workspace-<profile>` saat `OPENCLAW_PROFILE` diatur).
- Status default adalah `~/.openclaw/agents/main/agent`.

## Helper agen

Gunakan wizard agen untuk menambahkan agen terisolasi baru:

```bash
openclaw agents add work
```

Lalu tambahkan `bindings` (atau biarkan wizard melakukannya) untuk merutekan pesan masuk.

Verifikasi dengan:

```bash
openclaw agents list --bindings
```

## Mulai cepat

<Steps>
  <Step title="Buat setiap workspace agen">

Gunakan wizard atau buat workspace secara manual:

```bash
openclaw agents add coding
openclaw agents add social
```

Setiap agen mendapatkan workspace sendiri dengan `SOUL.md`, `AGENTS.md`, dan `USER.md` opsional, ditambah `agentDir` khusus dan penyimpanan sesi di bawah `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Buat akun kanal">

Buat satu akun per agen pada kanal pilihan Anda:

- Discord: satu bot per agen, aktifkan Message Content Intent, salin setiap token.
- Telegram: satu bot per agen melalui BotFather, salin setiap token.
- WhatsApp: tautkan setiap nomor telepon per akun.

```bash
openclaw channels login --channel whatsapp --account work
```

Lihat panduan kanal: [Discord](/id/channels/discord), [Telegram](/id/channels/telegram), [WhatsApp](/id/channels/whatsapp).

  </Step>

  <Step title="Tambahkan agen, akun, dan binding">

Tambahkan agen di bawah `agents.list`, akun kanal di bawah `channels.<channel>.accounts`, dan hubungkan keduanya dengan `bindings` (contoh di bawah).

  </Step>

  <Step title="Mulai ulang dan verifikasi">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Banyak agen = banyak orang, banyak kepribadian

Dengan **banyak agen**, setiap `agentId` menjadi **persona yang sepenuhnya terisolasi**:

- **Nomor telepon/akun berbeda** (per kanal `accountId`).
- **Kepribadian berbeda** (per file workspace agen seperti `AGENTS.md` dan `SOUL.md`).
- **Autentikasi + sesi terpisah** (tanpa cross-talk kecuali diaktifkan secara eksplisit).

Ini memungkinkan **banyak orang** berbagi satu server Gateway sambil menjaga “otak” AI dan data mereka tetap terisolasi.

## Pencarian memory QMD lintas agen

Jika satu agen harus menelusuri transkrip sesi QMD agen lain, tambahkan
koleksi ekstra di bawah `agents.list[].memorySearch.qmd.extraCollections`.
Gunakan `agents.defaults.memorySearch.qmd.extraCollections` hanya ketika setiap agen
harus mewarisi koleksi transkrip bersama yang sama.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // diselesaikan di dalam workspace -> koleksi bernama "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Path koleksi ekstra dapat dibagikan antar agen, tetapi nama koleksi
tetap eksplisit ketika path berada di luar workspace agen. Path di dalam
workspace tetap bercakupan agen sehingga setiap agen mempertahankan set pencarian transkripnya sendiri.

## Satu nomor WhatsApp, banyak orang (pemisahan DM)

Anda dapat merutekan **DM WhatsApp yang berbeda** ke agen yang berbeda sambil tetap menggunakan **satu akun WhatsApp**. Cocokkan pada E.164 pengirim (seperti `+15551234567`) dengan `peer.kind: "direct"`. Balasan tetap datang dari nomor WhatsApp yang sama (tanpa identitas pengirim per agen).

Detail penting: obrolan langsung digabungkan ke **main session key** milik agen, jadi isolasi sejati memerlukan **satu agen per orang**.

Contoh:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Catatan:

- Kontrol akses DM bersifat **global per akun WhatsApp** (pairing/allowlist), bukan per agen.
- Untuk grup bersama, bind grup ke satu agen atau gunakan [Broadcast groups](/id/channels/broadcast-groups).

## Aturan routing (bagaimana pesan memilih agen)

Binding bersifat **deterministik** dan **yang paling spesifik menang**:

1. kecocokan `peer` (id DM/grup/kanal yang tepat)
2. kecocokan `parentPeer` (pewarisan thread)
3. `guildId + roles` (routing peran Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. kecocokan `accountId` untuk sebuah kanal
7. kecocokan tingkat kanal (`accountId: "*"`)
8. fallback ke agen default (`agents.list[].default`, jika tidak entri daftar pertama, default: `main`)

Jika beberapa binding cocok pada tingkat yang sama, yang pertama dalam urutan konfigurasi akan menang.
Jika sebuah binding menetapkan beberapa field kecocokan (misalnya `peer` + `guildId`), semua field yang ditentukan wajib cocok (semantik `AND`).

Detail penting cakupan akun:

- Binding yang menghilangkan `accountId` hanya cocok dengan akun default.
- Gunakan `accountId: "*"` untuk fallback seluruh kanal di semua akun.
- Jika nanti Anda menambahkan binding yang sama untuk agen yang sama dengan id akun eksplisit, OpenClaw akan meningkatkan binding khusus kanal yang ada menjadi bercakupan akun alih-alih menduplikasinya.

## Banyak akun / nomor telepon

Kanal yang mendukung **banyak akun** (mis. WhatsApp) menggunakan `accountId` untuk mengidentifikasi
setiap login. Setiap `accountId` dapat dirutekan ke agen yang berbeda, sehingga satu server dapat meng-host
banyak nomor telepon tanpa mencampur sesi.

Jika Anda menginginkan akun default tingkat kanal saat `accountId` dihilangkan, setel
`channels.<channel>.defaultAccount` (opsional). Jika tidak diatur, OpenClaw fallback
ke `default` jika ada, jika tidak ke id akun pertama yang dikonfigurasi (diurutkan).

Kanal umum yang mendukung pola ini mencakup:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Konsep

- `agentId`: satu “otak” (workspace, autentikasi per agen, penyimpanan sesi per agen).
- `accountId`: satu instans akun kanal (mis. akun WhatsApp `"personal"` vs `"biz"`).
- `binding`: merutekan pesan masuk ke `agentId` berdasarkan `(channel, accountId, peer)` dan opsional id guild/team.
- Obrolan langsung digabungkan ke `agent:<agentId>:<mainKey>` (“main” per agen; `session.mainKey`).

## Contoh platform

### Bot Discord per agen

Setiap akun bot Discord dipetakan ke `accountId` unik. Bind setiap akun ke agen dan pertahankan allowlist per bot.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Catatan:

- Undang setiap bot ke guild dan aktifkan Message Content Intent.
- Token berada di `channels.discord.accounts.<id>.token` (akun default dapat menggunakan `DISCORD_BOT_TOKEN`).

### Bot Telegram per agen

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Catatan:

- Buat satu bot per agen dengan BotFather dan salin setiap token.
- Token berada di `channels.telegram.accounts.<id>.botToken` (akun default dapat menggunakan `TELEGRAM_BOT_TOKEN`).

### Nomor WhatsApp per agen

Tautkan setiap akun sebelum memulai gateway:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Routing deterministik: kecocokan pertama menang (yang paling spesifik terlebih dahulu).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Override per-peer opsional (contoh: kirim grup tertentu ke agen work).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Nonaktif secara default: pesan antar agen harus diaktifkan + di-allowlist secara eksplisit.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Override opsional. Default: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Override opsional. Default: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Contoh: obrolan harian WhatsApp + deep work Telegram

Pisahkan berdasarkan kanal: rute WhatsApp ke agen harian cepat dan Telegram ke agen Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Catatan:

- Jika Anda memiliki beberapa akun untuk satu kanal, tambahkan `accountId` ke binding (misalnya `{ channel: "whatsapp", accountId: "personal" }`).
- Untuk merutekan satu DM/grup ke Opus sambil mempertahankan sisanya tetap ke chat, tambahkan binding `match.peer` untuk peer tersebut; kecocokan peer selalu menang atas aturan seluruh kanal.

## Contoh: kanal yang sama, satu peer ke Opus

Biarkan WhatsApp berada di agen cepat, tetapi rute satu DM ke Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Binding peer selalu menang, jadi letakkan di atas aturan seluruh kanal.

## Agen family yang di-bind ke grup WhatsApp

Bind agen family khusus ke satu grup WhatsApp, dengan gating mention
dan kebijakan tool yang lebih ketat:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Catatan:

- Daftar allow/deny tool adalah **tool**, bukan skill. Jika suatu skill perlu menjalankan
  binary, pastikan `exec` diizinkan dan binary tersebut ada di sandbox.
- Untuk gating yang lebih ketat, setel `agents.list[].groupChat.mentionPatterns` dan pertahankan
  allowlist grup tetap aktif untuk kanal tersebut.

## Konfigurasi Sandbox dan Tool Per Agen

Setiap agen dapat memiliki sandbox dan pembatasan tool sendiri:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Tanpa sandbox untuk agen personal
        },
        // Tanpa pembatasan tool - semua tool tersedia
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Selalu menggunakan sandbox
          scope: "agent",  // Satu container per agen
          docker: {
            // Penyiapan satu kali opsional setelah pembuatan container
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Hanya tool read
          deny: ["exec", "write", "edit", "apply_patch"],    // Tolak yang lain
        },
      },
    ],
  },
}
```

Catatan: `setupCommand` berada di bawah `sandbox.docker` dan berjalan sekali saat pembuatan container.
Override per agen `sandbox.docker.*` diabaikan ketika scope yang diselesaikan adalah `"shared"`.

**Manfaat:**

- **Isolasi keamanan**: Batasi tool untuk agen yang tidak tepercaya
- **Kontrol sumber daya**: Sandbox agen tertentu sambil mempertahankan yang lain di host
- **Kebijakan fleksibel**: Izin berbeda per agen

Catatan: `tools.elevated` bersifat **global** dan berbasis pengirim; ini tidak dapat dikonfigurasi per agen.
Jika Anda memerlukan batasan per agen, gunakan `agents.list[].tools` untuk menolak `exec`.
Untuk penargetan grup, gunakan `agents.list[].groupChat.mentionPatterns` agar @mention dipetakan dengan jelas ke agen yang dimaksud.

Lihat [Sandbox & Tools Multi-Agen](/id/tools/multi-agent-sandbox-tools) untuk contoh yang lebih rinci.

## Terkait

- [Routing Kanal](/id/channels/channel-routing) — bagaimana pesan dirutekan ke agen
- [Sub-Agen](/id/tools/subagents) — menjalankan run agen latar belakang
- [Agen ACP](/id/tools/acp-agents) — menjalankan coding harness eksternal
- [Presence](/id/concepts/presence) — presence dan ketersediaan agen
- [Sesi](/id/concepts/session) — isolasi dan routing sesi
