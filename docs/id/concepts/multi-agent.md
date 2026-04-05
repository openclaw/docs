---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Perutean multi-agen: agen terisolasi, akun channel, dan binding'
title: Perutean Multi-Agen
x-i18n:
    generated_at: "2026-04-05T13:52:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e8bc48f229d01aa793ca4137e5a59f2a5ceb0ba65841710aaf69f53a672be60
    source_path: concepts/multi-agent.md
    workflow: 15
---

# Perutean Multi-Agen

Tujuan: beberapa agen yang _terisolasi_ (ruang kerja + `agentDir` + sesi terpisah), ditambah beberapa akun channel (misalnya dua WhatsApp) dalam satu Gateway yang berjalan. Lalu lintas masuk dirutekan ke agen melalui binding.

## Apa itu "satu agen"?

Sebuah **agen** adalah otak yang sepenuhnya tercakup dengan miliknya sendiri:

- **Ruang kerja** (file, AGENTS.md/SOUL.md/USER.md, catatan lokal, aturan persona).
- **Direktori status** (`agentDir`) untuk profil autentikasi, registri model, dan konfigurasi per agen.
- **Penyimpanan sesi** (riwayat chat + status perutean) di bawah `~/.openclaw/agents/<agentId>/sessions`.

Profil autentikasi bersifat **per agen**. Setiap agen membaca dari file miliknya sendiri:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` juga merupakan jalur recall lintas sesi yang lebih aman di sini: ini mengembalikan
tampilan yang dibatasi dan disanitasi, bukan dump transkrip mentah. Recall asisten menghapus
tag thinking, scaffolding `<relevant-memories>`, payload XML pemanggilan alat teks biasa
(termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok pemanggilan alat yang dipotong),
scaffolding pemanggilan alat yang diturunkan, token kontrol model ASCII/lebar penuh yang bocor,
dan XML pemanggilan alat MiniMax yang tidak valid sebelum redaksi/pemotongan.

Kredensial agen utama **tidak** dibagikan secara otomatis. Jangan pernah menggunakan kembali `agentDir`
antar agen (ini menyebabkan benturan autentikasi/sesi). Jika Anda ingin berbagi kredensial,
salin `auth-profiles.json` ke `agentDir` agen lain.

Skills dimuat dari ruang kerja setiap agen ditambah root bersama seperti
`~/.openclaw/skills`, lalu difilter oleh allowlist skill agen efektif saat
dikonfigurasi. Gunakan `agents.defaults.skills` untuk baseline bersama dan
`agents.list[].skills` untuk penggantian per agen. Lihat
[Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills) dan
[Skills: agent skill allowlists](/tools/skills#agent-skill-allowlists).

Gateway dapat menampung **satu agen** (default) atau **banyak agen** berdampingan.

**Catatan ruang kerja:** ruang kerja setiap agen adalah **cwd default**, bukan
sandbox kaku. Path relatif diselesaikan di dalam ruang kerja, tetapi path absolut dapat
menjangkau lokasi host lain kecuali sandboxing diaktifkan. Lihat
[Sandboxing](/gateway/sandboxing).

## Path (peta singkat)

- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori status: `~/.openclaw` (atau `OPENCLAW_STATE_DIR`)
- Ruang kerja: `~/.openclaw/workspace` (atau `~/.openclaw/workspace-<agentId>`)
- Direktori agen: `~/.openclaw/agents/<agentId>/agent` (atau `agents.list[].agentDir`)
- Sesi: `~/.openclaw/agents/<agentId>/sessions`

### Mode satu agen (default)

Jika Anda tidak melakukan apa pun, OpenClaw menjalankan satu agen:

- `agentId` secara default adalah **`main`**.
- Sesi diberi kunci sebagai `agent:main:<mainKey>`.
- Ruang kerja secara default adalah `~/.openclaw/workspace` (atau `~/.openclaw/workspace-<profile>` saat `OPENCLAW_PROFILE` disetel).
- Status secara default adalah `~/.openclaw/agents/main/agent`.

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
  <Step title="Buat setiap ruang kerja agen">

Gunakan wizard atau buat ruang kerja secara manual:

```bash
openclaw agents add coding
openclaw agents add social
```

Setiap agen mendapatkan ruang kerjanya sendiri dengan `SOUL.md`, `AGENTS.md`, dan `USER.md` opsional, ditambah `agentDir` khusus dan penyimpanan sesi di bawah `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Buat akun channel">

Buat satu akun per agen pada channel pilihan Anda:

- Discord: satu bot per agen, aktifkan Message Content Intent, salin setiap token.
- Telegram: satu bot per agen melalui BotFather, salin setiap token.
- WhatsApp: tautkan setiap nomor telepon per akun.

```bash
openclaw channels login --channel whatsapp --account work
```

Lihat panduan channel: [Discord](/id/channels/discord), [Telegram](/channels/telegram), [WhatsApp](/id/channels/whatsapp).

  </Step>

  <Step title="Tambahkan agen, akun, dan binding">

Tambahkan agen di bawah `agents.list`, akun channel di bawah `channels.<channel>.accounts`, dan hubungkan keduanya dengan `bindings` (contoh di bawah).

  </Step>

  <Step title="Mulai ulang dan verifikasi">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Beberapa agen = beberapa orang, beberapa kepribadian

Dengan **beberapa agen**, setiap `agentId` menjadi **persona yang sepenuhnya terisolasi**:

- **Nomor telepon/akun berbeda** (per channel `accountId`).
- **Kepribadian berbeda** (melalui file ruang kerja per agen seperti `AGENTS.md` dan `SOUL.md`).
- **Autentikasi + sesi terpisah** (tidak ada cross-talk kecuali diaktifkan secara eksplisit).

Ini memungkinkan **beberapa orang** berbagi satu server Gateway sambil menjaga “otak” AI dan data mereka tetap terisolasi.

## Pencarian memori QMD lintas agen

Jika satu agen harus mencari transkrip sesi QMD agen lain, tambahkan
koleksi tambahan di bawah `agents.list[].memorySearch.qmd.extraCollections`.
Gunakan `agents.defaults.memorySearch.qmd.extraCollections` hanya jika setiap agen
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
            extraCollections: [{ path: "notes" }], // diselesaikan di dalam ruang kerja -> koleksi bernama "notes-main"
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

Path koleksi tambahan dapat dibagikan antar agen, tetapi nama koleksi
tetap eksplisit saat path berada di luar ruang kerja agen. Path di dalam
ruang kerja tetap tercakup per agen sehingga setiap agen mempertahankan set pencarian transkripnya sendiri.

## Satu nomor WhatsApp, beberapa orang (pemisahan DM)

Anda dapat merutekan **DM WhatsApp yang berbeda** ke agen yang berbeda sambil tetap menggunakan **satu akun WhatsApp**. Cocokkan pada E.164 pengirim (seperti `+15551234567`) dengan `peer.kind: "direct"`. Balasan tetap berasal dari nomor WhatsApp yang sama (tidak ada identitas pengirim per agen).

Detail penting: chat langsung digabungkan ke **kunci sesi utama** agen, jadi isolasi sejati memerlukan **satu agen per orang**.

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

## Aturan perutean (bagaimana pesan memilih agen)

Binding bersifat **deterministik** dan **yang paling spesifik menang**:

1. kecocokan `peer` (id DM/grup/channel yang persis)
2. kecocokan `parentPeer` (pewarisan thread)
3. `guildId + roles` (perutean peran Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. kecocokan `accountId` untuk sebuah channel
7. kecocokan tingkat channel (`accountId: "*"`)
8. fallback ke agen default (`agents.list[].default`, jika tidak entri daftar pertama, default: `main`)

Jika beberapa binding cocok pada tingkat yang sama, yang pertama dalam urutan konfigurasi yang menang.
Jika sebuah binding menetapkan beberapa field kecocokan (misalnya `peer` + `guildId`), semua field yang ditentukan wajib cocok (semantik `AND`).

Detail penting cakupan akun:

- Binding yang menghilangkan `accountId` cocok dengan akun default saja.
- Gunakan `accountId: "*"` untuk fallback tingkat channel di semua akun.
- Jika nanti Anda menambahkan binding yang sama untuk agen yang sama dengan id akun eksplisit, OpenClaw meningkatkan binding khusus channel yang ada menjadi tercakup akun alih-alih menduplikasinya.

## Beberapa akun / nomor telepon

Channel yang mendukung **beberapa akun** (misalnya WhatsApp) menggunakan `accountId` untuk mengidentifikasi
setiap login. Setiap `accountId` dapat dirutekan ke agen yang berbeda, sehingga satu server dapat menampung
beberapa nomor telepon tanpa mencampur sesi.

Jika Anda menginginkan akun default tingkat channel saat `accountId` dihilangkan, setel
`channels.<channel>.defaultAccount` (opsional). Saat tidak disetel, OpenClaw akan fallback
ke `default` jika ada, atau ke id akun terkonfigurasi pertama (diurutkan).

Channel umum yang mendukung pola ini mencakup:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Konsep

- `agentId`: satu “otak” (ruang kerja, autentikasi per agen, penyimpanan sesi per agen).
- `accountId`: satu instans akun channel (misalnya akun WhatsApp `"personal"` vs `"biz"`).
- `binding`: merutekan pesan masuk ke sebuah `agentId` berdasarkan `(channel, accountId, peer)` dan opsional id guild/team.
- Chat langsung digabungkan ke `agent:<agentId>:<mainKey>` (`main` per agen; `session.mainKey`).

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

  // Perutean deterministik: kecocokan pertama menang (paling spesifik dulu).
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

  // Nonaktif secara default: pengiriman pesan antar agen harus diaktifkan secara eksplisit + di-allowlist.
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

## Contoh: chat harian WhatsApp + deep work Telegram

Pisahkan berdasarkan channel: rute WhatsApp ke agen harian yang cepat dan Telegram ke agen Opus.

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

- Jika Anda memiliki beberapa akun untuk sebuah channel, tambahkan `accountId` ke binding (misalnya `{ channel: "whatsapp", accountId: "personal" }`).
- Untuk merutekan satu DM/grup ke Opus sambil mempertahankan sisanya di chat, tambahkan binding `match.peer` untuk peer tersebut; kecocokan peer selalu menang atas aturan tingkat channel.

## Contoh: channel yang sama, satu peer ke Opus

Pertahankan WhatsApp pada agen cepat, tetapi rute satu DM ke Opus:

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

Binding peer selalu menang, jadi letakkan di atas aturan tingkat channel.

## Agen family yang di-bind ke grup WhatsApp

Bind agen family khusus ke satu grup WhatsApp, dengan gating mention
dan kebijakan alat yang lebih ketat:

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

- Daftar allow/deny alat adalah **alat**, bukan Skills. Jika sebuah skill perlu menjalankan
  biner, pastikan `exec` diizinkan dan biner tersebut ada di dalam sandbox.
- Untuk gating yang lebih ketat, setel `agents.list[].groupChat.mentionPatterns` dan tetap aktifkan
  allowlist grup untuk channel tersebut.

## Konfigurasi Sandbox dan Alat Per Agen

Setiap agen dapat memiliki pembatasan sandbox dan alatnya sendiri:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Tidak ada sandbox untuk agen personal
        },
        // Tidak ada pembatasan alat - semua alat tersedia
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Selalu di-sandbox
          scope: "agent",  // Satu kontainer per agen
          docker: {
            // Penyiapan satu kali opsional setelah pembuatan kontainer
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Hanya alat read
          deny: ["exec", "write", "edit", "apply_patch"],    // Tolak yang lain
        },
      },
    ],
  },
}
```

Catatan: `setupCommand` berada di bawah `sandbox.docker` dan dijalankan sekali saat pembuatan kontainer.
Override per agen `sandbox.docker.*` diabaikan saat cakupan yang diselesaikan adalah `"shared"`.

**Manfaat:**

- **Isolasi keamanan**: Batasi alat untuk agen yang tidak tepercaya
- **Kontrol sumber daya**: Sandbox agen tertentu sambil mempertahankan yang lain di host
- **Kebijakan fleksibel**: Izin berbeda per agen

Catatan: `tools.elevated` bersifat **global** dan berbasis pengirim; ini tidak dapat dikonfigurasi per agen.
Jika Anda memerlukan batas per agen, gunakan `agents.list[].tools` untuk menolak `exec`.
Untuk penargetan grup, gunakan `agents.list[].groupChat.mentionPatterns` agar @mention dipetakan dengan jelas ke agen yang dituju.

Lihat [Sandbox & Tools Multi-Agen](/tools/multi-agent-sandbox-tools) untuk contoh detail.

## Terkait

- [Channel Routing](/id/channels/channel-routing) — bagaimana pesan dirutekan ke agen
- [Sub-Agents](/tools/subagents) — menjalankan proses agen latar belakang
- [ACP Agents](/tools/acp-agents) — menjalankan harness coding eksternal
- [Presence](/concepts/presence) — presence dan ketersediaan agen
- [Session](/concepts/session) — isolasi sesi dan perutean
