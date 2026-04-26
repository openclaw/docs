---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Perutean multi-agent: agen terisolasi, akun kanal, dan binding'
title: Perutean multi-agent
x-i18n:
    generated_at: "2026-04-26T11:27:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

Jalankan beberapa agen _terisolasi_ — masing-masing dengan workspace, direktori state (`agentDir`), dan riwayat sesi sendiri — plus beberapa akun kanal (misalnya dua akun WhatsApp) dalam satu Gateway yang berjalan. Pesan masuk dirutekan ke agen yang tepat melalui binding.

Yang dimaksud **agen** di sini adalah cakupan penuh per persona: file workspace, profil auth, registri model, dan penyimpanan sesi. `agentDir` adalah direktori state di disk yang menyimpan config per agen ini di `~/.openclaw/agents/<agentId>/`. Sebuah **binding** memetakan akun kanal (misalnya workspace Slack atau nomor WhatsApp) ke salah satu agen tersebut.

## Apa itu "satu agen"?

Sebuah **agen** adalah brain yang sepenuhnya memiliki cakupan sendiri dengan:

- **Workspace** (file, AGENTS.md/SOUL.md/USER.md, catatan lokal, aturan persona).
- **Direktori state** (`agentDir`) untuk profil auth, registri model, dan config per agen.
- **Penyimpanan sesi** (riwayat chat + state perutean) di bawah `~/.openclaw/agents/<agentId>/sessions`.

Profil auth bersifat **per agen**. Setiap agen membaca dari:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` juga merupakan jalur recall lintas-sesi yang lebih aman di sini: ini mengembalikan tampilan yang dibatasi dan disanitasi, bukan dump transkrip mentah. Recall asisten menghapus thinking tag, scaffolding `<relevant-memories>`, payload XML tool-call teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), scaffolding tool-call yang diturunkan, token kontrol model ASCII/full-width yang bocor, dan XML tool-call MiniMax yang malformed sebelum redaksi/pemotongan.
</Note>

<Warning>
Kredensial agen utama **tidak** dibagikan secara otomatis. Jangan pernah menggunakan kembali `agentDir` di beberapa agen (ini menyebabkan benturan auth/sesi). Jika Anda ingin berbagi kredensial, salin `auth-profiles.json` ke `agentDir` agen lainnya.
</Warning>

Skills dimuat dari setiap workspace agen plus root bersama seperti `~/.openclaw/skills`, lalu difilter oleh allowlist skill agen efektif saat dikonfigurasi. Gunakan `agents.defaults.skills` untuk baseline bersama dan `agents.list[].skills` untuk penggantian per agen. Lihat [Skills: per-agent vs shared](/id/tools/skills#per-agent-vs-shared-skills) dan [Skills: agent skill allowlists](/id/tools/skills#agent-skill-allowlists).

Gateway dapat menampung **satu agen** (default) atau **banyak agen** berdampingan.

<Note>
**Catatan workspace:** workspace setiap agen adalah **cwd default**, bukan sandbox keras. Path relatif di-resolve di dalam workspace, tetapi path absolut dapat menjangkau lokasi host lain kecuali sandboxing diaktifkan. Lihat [Sandboxing](/id/gateway/sandboxing).
</Note>

## Path (peta cepat)

- Config: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori state: `~/.openclaw` (atau `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (atau `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (atau `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### Mode agen tunggal (default)

Jika Anda tidak melakukan apa pun, OpenClaw menjalankan satu agen:

- `agentId` default ke **`main`**.
- Sesi diberi kunci sebagai `agent:main:<mainKey>`.
- Workspace default ke `~/.openclaw/workspace` (atau `~/.openclaw/workspace-<profile>` saat `OPENCLAW_PROFILE` disetel).
- State default ke `~/.openclaw/agents/main/agent`.

## Helper agen

Gunakan wizard agen untuk menambahkan agen terisolasi baru:

```bash
openclaw agents add work
```

Lalu tambahkan `bindings` (atau biarkan wizard yang melakukannya) untuk merutekan pesan masuk.

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
    Tambahkan agen di bawah `agents.list`, akun kanal di bawah `channels.<channel>.accounts`, lalu hubungkan dengan `bindings` (contoh di bawah).
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

- **Nomor telepon/akun berbeda** (`accountId` per kanal).
- **Kepribadian berbeda** (file workspace per agen seperti `AGENTS.md` dan `SOUL.md`).
- **Auth + sesi terpisah** (tanpa cross-talk kecuali diaktifkan secara eksplisit).

Ini memungkinkan **banyak orang** berbagi satu server Gateway sambil menjaga "brain" AI dan data mereka tetap terisolasi.

## Pencarian memori QMD lintas agen

Jika satu agen harus menelusuri transkrip sesi QMD agen lain, tambahkan collection tambahan di bawah `agents.list[].memorySearch.qmd.extraCollections`. Gunakan `agents.defaults.memorySearch.qmd.extraCollections` hanya ketika setiap agen harus mewarisi collection transkrip bersama yang sama.

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
            extraCollections: [{ path: "notes" }], // di-resolve di dalam workspace -> collection bernama "notes-main"
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

Path collection tambahan dapat dibagikan di beberapa agen, tetapi nama collection tetap eksplisit saat path berada di luar workspace agen. Path di dalam workspace tetap berada dalam cakupan agen sehingga setiap agen mempertahankan set pencarian transkripnya sendiri.

## Satu nomor WhatsApp, banyak orang (pemisahan DM)

Anda dapat merutekan **DM WhatsApp yang berbeda** ke agen yang berbeda sambil tetap memakai **satu akun WhatsApp**. Cocokkan pada E.164 pengirim (seperti `+15551234567`) dengan `peer.kind: "direct"`. Balasan tetap berasal dari nomor WhatsApp yang sama (tanpa identitas pengirim per agen).

<Note>
Chat langsung digabungkan ke **main session key** agen, jadi isolasi sejati memerlukan **satu agen per orang**.
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
- Untuk grup bersama, bind grup ke satu agen atau gunakan [Broadcast groups](/id/channels/broadcast-groups).

## Aturan perutean (bagaimana pesan memilih agen)

Binding bersifat **deterministik** dan **yang paling spesifik menang**:

<Steps>
  <Step title="Pencocokan peer">
    DM/id grup/kanal yang persis sama.
  </Step>
  <Step title="Pencocokan parentPeer">
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
  <Step title="Pencocokan accountId untuk kanal">
    Fallback per akun.
  </Step>
  <Step title="Pencocokan tingkat kanal">
    `accountId: "*"`.
  </Step>
  <Step title="Agen default">
    Fallback ke `agents.list[].default`, jika tidak entri daftar pertama, default: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Tie-breaking dan semantik AND">
    - Jika beberapa binding cocok di tingkat yang sama, yang pertama dalam urutan config menang.
    - Jika sebuah binding menetapkan beberapa field pencocokan (misalnya `peer` + `guildId`), semua field yang ditentukan wajib cocok (semantik `AND`).
  </Accordion>
  <Accordion title="Detail cakupan akun">
    - Binding yang menghilangkan `accountId` hanya cocok dengan akun default.
    - Gunakan `accountId: "*"` untuk fallback tingkat kanal di semua akun.
    - Jika nantinya Anda menambahkan binding yang sama untuk agen yang sama dengan id akun eksplisit, OpenClaw akan meningkatkan binding khusus kanal yang ada menjadi bercakupan akun alih-alih menduplikasinya.
  </Accordion>
</AccordionGroup>

## Banyak akun / nomor telepon

Kanal yang mendukung **banyak akun** (misalnya WhatsApp) menggunakan `accountId` untuk mengidentifikasi setiap login. Setiap `accountId` dapat dirutekan ke agen yang berbeda, sehingga satu server dapat menampung beberapa nomor telepon tanpa mencampur sesi.

Jika Anda menginginkan akun default tingkat kanal saat `accountId` dihilangkan, setel `channels.<channel>.defaultAccount` (opsional). Jika tidak disetel, OpenClaw fallback ke `default` jika ada, jika tidak ke id akun terkonfigurasi pertama (diurutkan).

Kanal umum yang mendukung pola ini mencakup:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Konsep

- `agentId`: satu "brain" (workspace, auth per agen, penyimpanan sesi per agen).
- `accountId`: satu instans akun kanal (misalnya akun WhatsApp `"personal"` vs `"biz"`).
- `binding`: merutekan pesan masuk ke `agentId` berdasarkan `(channel, accountId, peer)` dan opsional id guild/team.
- Chat langsung digabungkan ke `agent:<agentId>:<mainKey>` (main per agen; `session.mainKey`).

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
    - Token disimpan di `channels.discord.accounts.<id>.token` (akun default dapat menggunakan `DISCORD_BOT_TOKEN`).

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
    - Token disimpan di `channels.telegram.accounts.<id>.botToken` (akun default dapat menggunakan `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Nomor WhatsApp per agen">
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

      // Perutean deterministik: kecocokan pertama menang (paling spesifik lebih dulu).
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

      // Mati secara default: pengiriman pesan antar-agen harus diaktifkan + di-allowlist secara eksplisit.
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

  </Accordion>
</AccordionGroup>

## Pola umum

<Tabs>
  <Tab title="WhatsApp harian + pekerjaan mendalam Telegram">
    Pisahkan berdasarkan kanal: rute WhatsApp ke agen harian yang cepat dan Telegram ke agen Opus.

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

    - Jika Anda memiliki banyak akun untuk suatu kanal, tambahkan `accountId` ke binding (misalnya `{ channel: "whatsapp", accountId: "personal" }`).
    - Untuk merutekan satu DM/grup ke Opus sambil mempertahankan sisanya di chat, tambahkan binding `match.peer` untuk peer tersebut; kecocokan peer selalu menang atas aturan tingkat kanal.

  </Tab>
  <Tab title="Kanal yang sama, satu peer ke Opus">
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

    Binding peer selalu menang, jadi letakkan di atas aturan tingkat kanal.

  </Tab>
  <Tab title="Agen keluarga terikat ke grup WhatsApp">
    Ikat agen keluarga khusus ke satu grup WhatsApp, dengan penyaringan mention dan kebijakan tool yang lebih ketat:

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

    - Daftar allow/deny tool adalah **tool**, bukan skill. Jika sebuah skill perlu menjalankan biner, pastikan `exec` diizinkan dan biner tersebut ada di sandbox.
    - Untuk penyaringan yang lebih ketat, setel `agents.list[].groupChat.mentionPatterns` dan pertahankan allowlist grup tetap aktif untuk kanal tersebut.

  </Tab>
</Tabs>

## Sandbox per agen dan konfigurasi tool

Setiap agen dapat memiliki sandbox dan pembatasan tool sendiri:

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
        // Tidak ada pembatasan tool - semua tool tersedia
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Selalu disandbox
          scope: "agent",  // Satu container per agen
          docker: {
            // Penyiapan opsional satu kali setelah pembuatan container
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

<Note>
`setupCommand` berada di bawah `sandbox.docker` dan berjalan sekali saat pembuatan container. Override `sandbox.docker.*` per agen diabaikan saat scope yang di-resolve adalah `"shared"`.
</Note>

**Manfaat:**

- **Isolasi keamanan**: batasi tool untuk agen yang tidak tepercaya.
- **Kontrol sumber daya**: sandbox agen tertentu sambil mempertahankan yang lain di host.
- **Kebijakan fleksibel**: izin berbeda per agen.

<Note>
`tools.elevated` bersifat **global** dan berbasis pengirim; ini tidak dapat dikonfigurasi per agen. Jika Anda memerlukan batas per agen, gunakan `agents.list[].tools` untuk menolak `exec`. Untuk penargetan grup, gunakan `agents.list[].groupChat.mentionPatterns` agar @mention dipetakan dengan bersih ke agen yang dituju.
</Note>

Lihat [Multi-agent sandbox and tools](/id/tools/multi-agent-sandbox-tools) untuk contoh terperinci.

## Terkait

- [ACP agents](/id/tools/acp-agents) — menjalankan harness coding eksternal
- [Channel routing](/id/channels/channel-routing) — bagaimana pesan dirutekan ke agen
- [Presence](/id/concepts/presence) — presence dan ketersediaan agen
- [Session](/id/concepts/session) — isolasi dan perutean sesi
- [Sub-agents](/id/tools/subagents) — memunculkan eksekusi agen latar belakang
