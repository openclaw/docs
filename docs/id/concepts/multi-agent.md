---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Perutean multi-agen: agen terisolasi, akun kanal, dan pengikatan'
title: Perutean multi-agen
x-i18n:
    generated_at: "2026-05-10T19:31:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

Jalankan beberapa agen _terisolasi_ — masing-masing dengan workspace, direktori state (`agentDir`), dan riwayat sesi sendiri — plus beberapa akun kanal (misalnya dua WhatsApp) dalam satu Gateway yang berjalan. Pesan masuk dirutekan ke agen yang tepat melalui binding.

Sebuah **agen** di sini adalah cakupan penuh per persona: file workspace, profil autentikasi, registri model, dan penyimpanan sesi. `agentDir` adalah direktori state di disk yang menyimpan konfigurasi per agen ini di `~/.openclaw/agents/<agentId>/`. Sebuah **binding** memetakan akun kanal (misalnya workspace Slack atau nomor WhatsApp) ke salah satu agen tersebut.

## Apa itu "satu agen"?

Sebuah **agen** adalah otak dengan cakupan penuh yang memiliki:

- **Workspace** (file, AGENTS.md/SOUL.md/USER.md, catatan lokal, aturan persona).
- **Direktori state** (`agentDir`) untuk profil autentikasi, registri model, dan konfigurasi per agen.
- **Penyimpanan sesi** (riwayat chat + state perutean) di bawah `~/.openclaw/agents/<agentId>/sessions`.

Profil autentikasi bersifat **per agen**. Setiap agen membaca dari miliknya sendiri:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` juga merupakan jalur recall lintas sesi yang lebih aman di sini: ia mengembalikan tampilan terbatas dan tersanitasi, bukan dump transkrip mentah. Recall asisten menghapus tag thinking, scaffolding `<relevant-memories>`, payload XML tool-call teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), scaffolding tool-call yang diturunkan, token kontrol model ASCII/full-width yang bocor, dan XML tool-call MiniMax yang cacat sebelum redaksi/pemotongan.
</Note>

<Warning>
Jangan pernah menggunakan ulang `agentDir` antar agen (ini menyebabkan tabrakan autentikasi/sesi). Agen
dapat membaca hingga profil autentikasi agen default/utama saat mereka tidak memiliki
profil lokal, tetapi OpenClaw tidak mengkloning token refresh OAuth ke dalam
penyimpanan agen sekunder. Jika Anda menginginkan akun OAuth independen, masuk dari
agen tersebut; jika Anda menyalin kredensial secara manual, salin hanya profil statis portabel
`api_key` atau `token`.
</Warning>

Skills dimuat dari setiap workspace agen plus root bersama seperti `~/.openclaw/skills`, lalu difilter berdasarkan allowlist skill agen efektif saat dikonfigurasi. Gunakan `agents.defaults.skills` untuk baseline bersama dan `agents.list[].skills` untuk penggantian per agen. Lihat [Skills: per agen vs bersama](/id/tools/skills#per-agent-vs-shared-skills) dan [Skills: allowlist skill agen](/id/tools/skills#agent-skill-allowlists).

Gateway dapat menghosting **satu agen** (default) atau **banyak agen** berdampingan.

<Note>
**Catatan workspace:** workspace setiap agen adalah **cwd default**, bukan sandbox keras. Path relatif diselesaikan di dalam workspace, tetapi path absolut dapat menjangkau lokasi host lain kecuali sandboxing diaktifkan. Lihat [Sandboxing](/id/gateway/sandboxing).
</Note>

## Path (peta cepat)

- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori state: `~/.openclaw` (atau `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (atau `~/.openclaw/workspace-<agentId>`)
- Direktori agen: `~/.openclaw/agents/<agentId>/agent` (atau `agents.list[].agentDir`)
- Sesi: `~/.openclaw/agents/<agentId>/sessions`

### Mode satu agen (default)

Jika Anda tidak melakukan apa pun, OpenClaw menjalankan satu agen:

- `agentId` default ke **`main`**.
- Sesi diberi key sebagai `agent:main:<mainKey>`.
- Workspace default ke `~/.openclaw/workspace` (atau `~/.openclaw/workspace-<profile>` saat `OPENCLAW_PROFILE` disetel).
- State default ke `~/.openclaw/agents/main/agent`.

## Pembantu agen

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

    Setiap agen mendapatkan workspace sendiri dengan `SOUL.md`, `AGENTS.md`, dan `USER.md` opsional, plus `agentDir` khusus dan penyimpanan sesi di bawah `~/.openclaw/agents/<agentId>`.

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

## Beberapa agen = beberapa orang, beberapa kepribadian

Dengan **beberapa agen**, setiap `agentId` menjadi **persona yang sepenuhnya terisolasi**:

- **Nomor telepon/akun berbeda** (per kanal `accountId`).
- **Kepribadian berbeda** (file workspace per agen seperti `AGENTS.md` dan `SOUL.md`).
- **Autentikasi + sesi terpisah** (tidak ada percakapan silang kecuali diaktifkan secara eksplisit).

Ini memungkinkan **beberapa orang** berbagi satu server Gateway sambil menjaga "otak" AI dan data mereka tetap terisolasi.

## Pencarian memori QMD lintas agen

Jika satu agen harus mencari transkrip sesi QMD agen lain, tambahkan koleksi ekstra di bawah `agents.list[].memorySearch.qmd.extraCollections`. Gunakan `agents.defaults.memorySearch.qmd.extraCollections` hanya saat setiap agen harus mewarisi koleksi transkrip bersama yang sama.

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
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
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

Path koleksi ekstra dapat dibagikan antar agen, tetapi nama koleksi tetap eksplisit saat path berada di luar workspace agen. Path di dalam workspace tetap bercakupan agen sehingga setiap agen mempertahankan set pencarian transkripnya sendiri.

## Satu nomor WhatsApp, beberapa orang (pemisahan DM)

Anda dapat merutekan **DM WhatsApp yang berbeda** ke agen yang berbeda sambil tetap berada pada **satu akun WhatsApp**. Cocokkan berdasarkan pengirim E.164 (seperti `+15551234567`) dengan `peer.kind: "direct"`. Balasan tetap berasal dari nomor WhatsApp yang sama (tidak ada identitas pengirim per agen).

<Note>
Chat langsung diciutkan ke **key sesi utama** agen, sehingga isolasi sejati memerlukan **satu agen per orang**.
</Note>

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
- Untuk grup bersama, bind grup ke satu agen atau gunakan [Grup broadcast](/id/channels/broadcast-groups).

## Aturan perutean (bagaimana pesan memilih agen)

Binding bersifat **deterministik** dan **yang paling spesifik menang**:

<Steps>
  <Step title="kecocokan peer">
    ID DM/grup/kanal persis.
  </Step>
  <Step title="kecocokan parentPeer">
    Pewarisan thread.
  </Step>
  <Step title="guildId + roles">
    Perutean role Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="kecocokan accountId untuk kanal">
    Fallback per akun.
  </Step>
  <Step title="Kecocokan tingkat kanal">
    `accountId: "*"`.
  </Step>
  <Step title="Agen default">
    Fallback ke `agents.list[].default`, jika tidak ada entri daftar pertama, default: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Pemecahan seri dan semantik AND">
    - Jika beberapa binding cocok pada tingkat yang sama, yang pertama dalam urutan konfigurasi menang.
    - Jika binding menetapkan beberapa field kecocokan (misalnya `peer` + `guildId`), semua field yang ditentukan diperlukan (semantik `AND`).

  </Accordion>
  <Accordion title="Detail cakupan akun">
    - Binding yang menghilangkan `accountId` hanya cocok dengan akun default.
    - Gunakan `accountId: "*"` untuk fallback seluruh kanal di semua akun.
    - Jika nanti Anda menambahkan binding yang sama untuk agen yang sama dengan id akun eksplisit, OpenClaw meningkatkan binding khusus kanal yang ada menjadi bercakupan akun alih-alih menduplikasinya.

  </Accordion>
</AccordionGroup>

## Beberapa akun / nomor telepon

Kanal yang mendukung **beberapa akun** (misalnya WhatsApp) menggunakan `accountId` untuk mengidentifikasi setiap login. Setiap `accountId` dapat dirutekan ke agen yang berbeda, sehingga satu server dapat menghosting beberapa nomor telepon tanpa mencampur sesi.

Jika Anda menginginkan akun default seluruh kanal saat `accountId` dihilangkan, setel `channels.<channel>.defaultAccount` (opsional). Saat tidak disetel, OpenClaw fallback ke `default` jika ada, jika tidak ke id akun terkonfigurasi pertama (diurutkan).

Kanal umum yang mendukung pola ini meliputi:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Konsep

- `agentId`: satu "otak" (workspace, autentikasi per agen, penyimpanan sesi per agen).
- `accountId`: satu instance akun kanal (misalnya akun WhatsApp `"personal"` vs `"biz"`).
- `binding`: merutekan pesan masuk ke `agentId` berdasarkan `(channel, accountId, peer)` dan secara opsional id guild/team.
- Chat langsung diciutkan ke `agent:<agentId>:<mainKey>` ("main" per agen; `session.mainKey`).

## Contoh platform

<AccordionGroup>
  <Accordion title="Bot Discord per agen">
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

    - Undang setiap bot ke guild dan aktifkan Message Content Intent.
    - Token berada di `channels.discord.accounts.<id>.token` (akun default dapat menggunakan `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Bot Telegram per agen">
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

    - Buat satu bot per agen dengan BotFather dan salin setiap token.
    - Token berada di `channels.telegram.accounts.<id>.botToken` (akun default dapat menggunakan `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Nomor WhatsApp per agen">
    Tautkan setiap akun sebelum memulai Gateway:

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

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Pola umum

<Tabs>
  <Tab title="WhatsApp harian + kerja mendalam Telegram">
    Bagi berdasarkan kanal: arahkan WhatsApp ke agen harian yang cepat dan Telegram ke agen Opus.

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
    - Untuk mengarahkan satu DM/grup ke Opus sambil menjaga sisanya tetap di chat, tambahkan binding `match.peer` untuk peer tersebut; kecocokan peer selalu menang atas aturan seluruh kanal.

  </Tab>
  <Tab title="Kanal yang sama, satu peer ke Opus">
    Pertahankan WhatsApp pada agen cepat, tetapi arahkan satu DM ke Opus:

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

  </Tab>
  <Tab title="Agen keluarga yang diikat ke grup WhatsApp">
    Ikat agen keluarga khusus ke satu grup WhatsApp, dengan gating mention dan kebijakan tool yang lebih ketat:

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

    - Daftar allow/deny tool adalah **tool**, bukan skills. Jika sebuah skill perlu menjalankan binary, pastikan `exec` diizinkan dan binary ada di sandbox.
    - Untuk gating yang lebih ketat, atur `agents.list[].groupChat.mentionPatterns` dan tetap aktifkan allowlist grup untuk kanal tersebut.

  </Tab>
</Tabs>

## Konfigurasi sandbox dan tool per agen

Setiap agen dapat memiliki sandbox dan pembatasan tool sendiri:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` berada di bawah `sandbox.docker` dan berjalan sekali saat pembuatan container. Override `sandbox.docker.*` per agen diabaikan ketika scope yang diselesaikan adalah `"shared"`.
</Note>

**Manfaat:**

- **Isolasi keamanan**: batasi tool untuk agen yang tidak tepercaya.
- **Kontrol sumber daya**: sandbox-kan agen tertentu sambil tetap menjalankan yang lain di host.
- **Kebijakan fleksibel**: izin berbeda per agen.

<Note>
`tools.elevated` bersifat **global** dan berbasis pengirim; ini tidak dapat dikonfigurasi per agen. Jika Anda memerlukan batasan per agen, gunakan `agents.list[].tools` untuk menolak `exec`. Untuk penargetan grup, gunakan `agents.list[].groupChat.mentionPatterns` agar @mention dipetakan dengan jelas ke agen yang dimaksud.
</Note>

Lihat [Sandbox dan tool multi-agen](/id/tools/multi-agent-sandbox-tools) untuk contoh terperinci.

## Terkait

- [Agen ACP](/id/tools/acp-agents) — menjalankan harness pengodean eksternal
- [Perutean kanal](/id/channels/channel-routing) — cara pesan dirutekan ke agen
- [Presence](/id/concepts/presence) — presence dan ketersediaan agen
- [Session](/id/concepts/session) — isolasi dan perutean session
- [Sub-agen](/id/tools/subagents) — memulai proses agen latar belakang
