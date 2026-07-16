---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Perutean multiagen: batas agen, akun saluran, dan pengikatan'
title: Perutean multiagen
x-i18n:
    generated_at: "2026-07-16T18:00:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Jalankan beberapa agen yang _terisolasi_ dalam satu proses Gateway, masing-masing dengan ruang kerja, direktori status (`agentDir`), dan riwayat sesi berbasis SQLite sendiri, serta beberapa akun saluran (misalnya dua nomor WhatsApp). Pesan masuk dirutekan ke agen yang tepat melalui **pengikatan**.

Sebuah **agen** adalah cakupan lengkap per persona: berkas ruang kerja, profil autentikasi, registri model, dan penyimpanan sesi. Sebuah **pengikatan** memetakan akun saluran (ruang kerja Slack, nomor WhatsApp, dan sebagainya) ke salah satu agen tersebut.

## Apa yang dimaksud dengan satu agen

Setiap agen memiliki:

- **Ruang kerja**: berkas, `AGENTS.md`/`SOUL.md`/`USER.md`, catatan lokal, aturan persona.
- **Direktori status** (`agentDir`): profil autentikasi, registri model, konfigurasi per agen.
- **Penyimpanan sesi**: riwayat percakapan dan status perutean di `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Profil autentikasi bersifat per agen dan dibaca dari:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` adalah jalur pemanggilan kembali lintas sesi yang lebih aman: jalur ini mengembalikan tampilan terbatas dan tersunting, bukan dump transkrip mentah. Jalur ini menghapus tanda tangan blok pemikiran, detail muatan hasil alat, perancah `<relevant-memories>`, tag XML panggilan alat (`<tool_call>`, `<function_call>`, serta bentuk jamak/versi turunannya), dan XML panggilan alat MiniMax, lalu memotong dan membatasi keluaran berdasarkan ukuran byte.
</Note>

<Warning>
Jangan pernah menggunakan kembali `agentDir` pada beberapa agen — hal ini menyebabkan benturan status autentikasi/sesi. Ketika kredensial OAuth lokal agen sekunder kedaluwarsa atau penyegarannya gagal, OpenClaw membaca kredensial agen default/utama untuk id profil yang sama dan menggunakan token mana pun yang paling baru, tanpa menyalin token penyegaran ke penyimpanan agen sekunder. Jika Anda menginginkan akun OAuth yang sepenuhnya independen, masuklah dari agen tersebut. Jika Anda menyalin kredensial secara manual, salin hanya profil statis portabel `api_key` atau `token` — materi penyegaran OAuth secara default tidak portabel (`copyToAgents` dapat secara eksplisit mengaktifkannya untuk suatu profil).
</Warning>

Skills dimuat dari setiap ruang kerja agen serta akar bersama seperti `~/.openclaw/skills`, lalu difilter berdasarkan daftar izin Skills agen yang berlaku. Gunakan `agents.defaults.skills` untuk dasar bersama dan `agents.list[].skills` untuk pengganti per agen (entri eksplisit menggantikan nilai default, bukan digabungkan). Lihat [Skills: per agen versus bersama](/id/tools/skills#per-agent-vs-shared-skills) dan [Skills: daftar izin agen](/id/tools/skills#agent-allowlists).

Penyimpanan milik Plugin mengikuti konfigurasi Plugin tersebut; menambahkan agen kedua
tidak secara otomatis memisahkan setiap penyimpanan Plugin global. Misalnya, konfigurasikan
[vault Memory Wiki per agen](/id/concepts/multi-agent#per-agent-memory-wiki-vaults)
ketika persona tidak boleh berbagi pengetahuan wiki yang telah dikompilasi.

<Note>
**Catatan ruang kerja:** ruang kerja setiap agen merupakan **cwd default**, bukan sandbox ketat. Jalur relatif diselesaikan di dalam ruang kerja, tetapi jalur absolut dapat menjangkau lokasi host lain kecuali sandbox diaktifkan. Lihat [Sandbox](/id/gateway/sandboxing).
</Note>

## Jalur

| Hal                              | Default                                                                                | Penggantian                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Konfigurasi                      | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Direktori status                 | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Ruang kerja agen default         | `~/.openclaw/workspace` (atau `workspace-<profile>` ketika `OPENCLAW_PROFILE` ditetapkan)      | `agents.list[].workspace`, lalu `agents.defaults.workspace`, atau `OPENCLAW_WORKSPACE_DIR` |
| Ruang kerja agen lain            | `<stateDir>/workspace-<agentId>` (atau `<agents.defaults.workspace>/<agentId>` ketika ditetapkan) | `agents.list[].workspace`                                                                |
| Direktori agen                   | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Sesi dan transkrip               | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Artefak sesi lama/arsip          | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Mode agen tunggal (default)

Jika Anda tidak mengonfigurasi apa pun, OpenClaw menjalankan satu agen:

- `agentId` secara default adalah `main`.
- Kunci sesi berupa `agent:main:<mainKey>` (`mainKey` default adalah `main`).
- Ruang kerja secara default adalah `~/.openclaw/workspace` (atau `workspace-<profile>` ketika `OPENCLAW_PROFILE` ditetapkan ke sesuatu selain `default`).
- Status secara default adalah `~/.openclaw/agents/main/agent`.

## Pembantu agen

Tambahkan agen terisolasi baru:

```bash
openclaw agents add work
```

Flag: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (dapat diulang), `--non-interactive` (memerlukan `--workspace`).

Tambahkan `bindings` untuk merutekan pesan masuk (wizard menawarkan untuk melakukannya bagi Anda), lalu verifikasi:

```bash
openclaw agents list --bindings
```

## Mulai cepat

<Steps>
  <Step title="Buat ruang kerja setiap agen">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Setiap agen memperoleh ruang kerja sendiri dengan `SOUL.md`, `AGENTS.md`, dan `USER.md` opsional, serta `agentDir` khusus dan penyimpanan sesi di bawah `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Buat akun saluran">
    Buat satu akun per agen pada saluran pilihan Anda:

    - Discord: satu bot per agen, aktifkan Message Content Intent, salin setiap token.
    - Telegram: satu bot per agen melalui BotFather, salin setiap token.
    - WhatsApp: tautkan setiap nomor telepon per akun.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Lihat panduan saluran: [Discord](/id/channels/discord), [Telegram](/id/channels/telegram), [WhatsApp](/id/channels/whatsapp).

  </Step>
  <Step title="Tambahkan agen, akun, dan pengikatan">
    Tambahkan agen di bawah `agents.list`, akun saluran di bawah `channels.<channel>.accounts`, dan hubungkan keduanya dengan `bindings` (contoh di bawah).
  </Step>
  <Step title="Mulai ulang dan verifikasi">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Beberapa agen, beberapa persona

Setiap `agentId` yang dikonfigurasi merupakan batas persona terpisah untuk status inti agen:

- Akun berbeda per saluran (per `accountId`).
- Kepribadian berbeda (`AGENTS.md`/`SOUL.md` per agen).
- Autentikasi dan sesi terpisah, dengan akses lintas agen yang hanya diaktifkan melalui fitur eksplisit atau konfigurasi Plugin.

Hal ini memungkinkan beberapa orang berbagi satu Gateway sambil menjaga status inti agen tetap terpisah.

## Vault Memory Wiki per agen

Memory Wiki menggunakan satu vault global secara default. Untuk memisahkan
pengetahuan yang telah dikompilasi milik agen dukungan dari milik agen pemasaran, tetapkan
`plugins.entries.memory-wiki.config.vault.scope` ke `agent`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

Jalur yang dikonfigurasi merupakan direktori induk. OpenClaw menambahkan id
agen yang dinormalisasi, sehingga menghasilkan jalur seperti `~/.openclaw/wiki/support` dan
`~/.openclaw/wiki/marketing`. Operasi CLI dan Gateway yang tercakup per agen memerlukan
agen eksplisit ketika beberapa agen dikonfigurasi. Lihat
[vault Memory Wiki per agen](/id/plugins/memory-wiki#per-agent-vaults) untuk detail
pemfilteran jembatan, migrasi, dan batas kepercayaan.

## Pencarian memori QMD lintas agen

Agar satu agen dapat mencari transkrip sesi QMD agen lain, tambahkan koleksi tambahan di bawah `agents.list[].memorySearch.qmd.extraCollections`. Gunakan `agents.defaults.memorySearch.qmd.extraCollections` ketika setiap agen harus berbagi koleksi yang sama.

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

Jalur koleksi tambahan dapat dibagikan antaragen, tetapi `name` tetap eksplisit ketika jalur berada di luar ruang kerja agen. Jalur di dalam ruang kerja tetap tercakup per agen sehingga setiap agen mempertahankan kumpulan pencarian transkripnya sendiri.

## Satu nomor WhatsApp, beberapa orang (pemisahan DM)

Rutekan DM WhatsApp yang berbeda ke agen berbeda pada **satu** akun WhatsApp dengan mencocokkan E.164 pengirim (`+15551234567`) menggunakan `peer.kind: "direct"`. Balasan tetap berasal dari nomor WhatsApp yang sama — tidak ada identitas pengirim per agen.

<Note>
Percakapan langsung secara default digabungkan ke kunci sesi utama agen, sehingga isolasi sebenarnya memerlukan satu agen per orang.
</Note>

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

Kontrol akses DM (pemasangan/daftar izin) bersifat global per akun WhatsApp, bukan per agen. Untuk grup bersama, ikat grup ke satu agen atau gunakan [Grup siaran](/id/channels/broadcast-groups).

## Aturan perutean

Pengikatan bersifat deterministik dan kecocokan paling spesifik akan menang. Lihat [Perutean saluran](/id/channels/channel-routing#routing-rules-how-an-agent-is-chosen) untuk urutan tingkat lengkap (peer persis, peer induk, wildcard peer, guild+peran, guild, tim, akun, saluran, agen default). Beberapa aturan yang perlu disoroti di sini:

- Jika beberapa pengikatan cocok dalam tingkat yang sama, pengikatan pertama dalam urutan konfigurasi akan menang.
- Jika suatu pengikatan menetapkan beberapa bidang kecocokan (misalnya `peer` + `guildId`), semua bidang yang ditentukan harus cocok (semantik `AND`).
- Pengikatan yang tidak menyertakan `accountId` hanya cocok dengan akun default, bukan setiap akun. Gunakan `accountId: "*"` untuk fallback seluruh saluran, atau `accountId: "<name>"` untuk satu akun. Menambahkan kembali pengikatan yang sama dengan id akun eksplisit akan meningkatkan pengikatan khusus saluran yang ada, bukan menduplikasinya.

## Beberapa akun/nomor telepon

Saluran yang mendukung beberapa akun (misalnya WhatsApp) menggunakan `accountId` untuk mengidentifikasi setiap proses masuk. Setiap `accountId` dirutekan ke agennya sendiri, sehingga satu server dapat menghosting beberapa nomor telepon tanpa mencampur sesi.

Tetapkan `channels.<channel>.defaultAccount` untuk memilih akun yang digunakan ketika `accountId` tidak dicantumkan. Jika tidak ditetapkan, OpenClaw akan menggunakan `default` jika tersedia; jika tidak, id akun pertama yang dikonfigurasi (diurutkan).

Saluran yang mendukung beberapa akun: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Konsep

- `agentId`: satu "otak" (ruang kerja, autentikasi per agen, penyimpanan sesi per agen).
- `accountId`: satu instans akun saluran (misalnya akun WhatsApp `personal` dibandingkan dengan `biz`).
- `binding`: merutekan pesan masuk ke `agentId` berdasarkan `(channel, accountId, peer)`, dan secara opsional id guild/tim.
- Percakapan langsung digabungkan ke `agent:<agentId>:<mainKey>` ("utama" per agen; lihat `session.mainKey`).

## Contoh platform

<AccordionGroup>
  <Accordion title="Bot Discord per agen">
    Setiap akun bot Discord dipetakan ke `accountId` yang unik. Ikat setiap akun ke satu agen dan pertahankan daftar izin per bot.

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
    - Untuk beberapa bot dalam grup Telegram yang sama, undang setiap bot dan sebut bot yang harus menjawab.
    - Nonaktifkan Privacy Mode BotFather untuk setiap bot grup (`/setprivacy` -> Disable), lalu hapus dan tambahkan kembali bot tersebut agar Telegram menerapkan pengaturan itu.
    - Izinkan grup dengan `channels.telegram.groups`, atau gunakan `groupPolicy: "open"` hanya untuk penerapan grup tepercaya.
    - Masukkan ID pengguna pengirim ke `groupAllowFrom`. ID grup dan supergrup berada di `channels.telegram.groups`, bukan `groupAllowFrom`.
    - Ikat berdasarkan `accountId` agar setiap bot dirutekan ke agennya sendiri.

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

      // Perutean deterministik: kecocokan pertama menang (yang paling spesifik terlebih dahulu).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Penggantian opsional per rekan (contoh: kirim grup tertentu ke agen kerja).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Nonaktif secara default: perpesanan antaragen harus diaktifkan dan dimasukkan ke daftar izin secara eksplisit.
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
              // Penggantian opsional. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Penggantian opsional. Default: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp sehari-hari + pekerjaan mendalam di Telegram">
    Pisahkan berdasarkan saluran: rutekan WhatsApp ke agen cepat untuk penggunaan sehari-hari dan Telegram ke agen Opus.

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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    Contoh-contoh ini menggunakan `accountId: "*"` agar pengikatan tetap berfungsi jika Anda menambahkan akun nanti. Untuk merutekan satu DM/grup ke Opus sambil mempertahankan sisanya di chat, tambahkan pengikatan `match.peer` untuk rekan tersebut — kecocokan rekan selalu mengungguli aturan seluruh saluran.

  </Tab>
  <Tab title="Saluran yang sama, satu rekan ke Opus">
    Pertahankan WhatsApp pada agen cepat, tetapi rutekan satu DM ke Opus:

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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Pengikatan rekan selalu menang, jadi letakkan di atas aturan seluruh saluran.

  </Tab>
  <Tab title="Agen keluarga yang diikat ke grup WhatsApp">
    Ikat agen keluarga khusus ke satu grup WhatsApp, dengan persyaratan penyebutan dan kebijakan alat yang lebih ketat:

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

    Daftar izin/tolak alat adalah **alat**, bukan keterampilan. Jika suatu keterampilan perlu menjalankan biner, pastikan `exec` diizinkan dan biner tersebut tersedia di sandbox. Untuk pembatasan yang lebih ketat, tetapkan `agents.list[].groupChat.mentionPatterns` dan pertahankan daftar izin grup tetap aktif untuk saluran tersebut.

  </Tab>
</Tabs>

## Konfigurasi sandbox dan alat per agen

Setiap agen dapat memiliki sandbox dan pembatasan alatnya sendiri:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Tanpa sandbox untuk agen pribadi
        },
        // Tanpa pembatasan alat - semua alat tersedia
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Selalu berada dalam sandbox
          scope: "agent",  // Satu kontainer per agen
          docker: {
            // Penyiapan satu kali opsional setelah kontainer dibuat
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Hanya alat baca
          deny: ["exec", "write", "edit", "apply_patch"],    // Tolak yang lain
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` berada di bawah `sandbox.docker` dan dijalankan sekali saat kontainer dibuat. Penggantian `sandbox.docker.*` per agen diabaikan ketika cakupan yang ditetapkan adalah `"shared"`.
</Note>

Ini memberikan:

- **Isolasi keamanan**: batasi alat untuk agen yang tidak tepercaya.
- **Kontrol sumber daya**: tempatkan agen tertentu dalam sandbox sambil mempertahankan agen lain di host.
- **Kebijakan fleksibel**: izin yang berbeda untuk setiap agen.

<Note>
`tools.elevated` memiliki gerbang global (`tools.elevated.enabled`/`allowFrom`) dan gerbang per agen (`agents.list[].tools.elevated.enabled`/`allowFrom`). Gerbang per agen hanya dapat membatasi gerbang global lebih lanjut — keduanya harus mengizinkan pengirim agar perintah dengan hak istimewa dapat dijalankan. Untuk penargetan grup, gunakan `agents.list[].groupChat.mentionPatterns` agar @mention dipetakan dengan tepat ke agen yang dimaksud.
</Note>

Lihat [Sandbox dan alat multiagen](/id/tools/multi-agent-sandbox-tools) untuk contoh terperinci.

## Terkait

- [Agen ACP](/id/tools/acp-agents) — menjalankan harness pengodean eksternal
- [Perutean saluran](/id/channels/channel-routing) — cara pesan dirutekan ke agen
- [Kehadiran](/id/concepts/presence) — kehadiran dan ketersediaan agen
- [Sesi](/id/concepts/session) — isolasi dan perutean sesi
- [Subagen](/id/tools/subagents) — menjalankan proses agen latar belakang
