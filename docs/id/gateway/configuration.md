---
read_when:
    - Menyiapkan OpenClaw untuk pertama kalinya
    - Mencari pola konfigurasi yang umum
    - Menavigasi ke bagian config tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-05T13:54:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a39a7de09c5f9540785ec67f37d435a7a86201f0f5f640dae663054f35976712
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfigurasi

OpenClaw membaca config <Tooltip tip="JSON5 mendukung komentar dan koma di akhir">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan config:

- Menghubungkan channel dan mengontrol siapa yang dapat mengirim pesan ke bot
- Menetapkan model, tool, sandboxing, atau otomatisasi (cron, hooks)
- Menyesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/gateway/configuration-reference) untuk setiap field yang tersedia.

<Tip>
**Baru mengenal konfigurasi?** Mulailah dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Contoh Konfigurasi](/gateway/configuration-examples) untuk config lengkap yang siap salin-tempel.
</Tip>

## Config minimal

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Mengedit config

<Tabs>
  <Tab title="Wizard interaktif">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liner)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Config**.
    Control UI merender formulir dari skema config live, termasuk metadata docs `title` / `description` pada field serta skema plugin dan channel saat
    tersedia, dengan editor **Raw JSON** sebagai jalan keluar. Untuk UI
    drill-down dan tooling lainnya, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema yang dicakup path beserta ringkasan child langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file tersebut dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Key yang tidak dikenal, tipe yang salah format, atau nilai yang tidak valid akan membuat Gateway **menolak untuk memulai**. Satu-satunya pengecualian di level root adalah `$schema` (string), sehingga editor dapat melampirkan metadata JSON Schema.
</Warning>

Catatan tooling skema:

- `openclaw config schema` mencetak keluarga JSON Schema yang sama yang digunakan oleh Control UI
  dan validasi config.
- Nilai field `title` dan `description` dibawa ke output skema untuk
  tooling editor dan formulir.
- Entri nested object, wildcard (`*`), dan array-item (`[]`) mewarisi metadata
  docs yang sama ketika dokumentasi field yang cocok tersedia.
- Branch komposisi `anyOf` / `oneOf` / `allOf` juga mewarisi metadata docs
  yang sama, sehingga varian union/intersection tetap memiliki bantuan field yang sama.
- `config.schema.lookup` mengembalikan satu path config yang dinormalisasi dengan node
  skema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum,
  dan field validasi serupa), metadata petunjuk UI yang cocok, dan ringkasan child langsung
  untuk tooling drill-down.
- Skema plugin/channel runtime digabungkan saat gateway dapat memuat
  registri manifest saat ini.

Saat validasi gagal:

- Gateway tidak melakukan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah yang tepat
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

## Tugas umum

<AccordionGroup>
  <Accordion title="Menyiapkan channel (WhatsApp, Telegram, Discord, dll.)">
    Setiap channel memiliki bagian config sendiri di bawah `channels.<provider>`. Lihat halaman channel khusus untuk langkah penyiapan:

    - [WhatsApp](/id/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/id/channels/discord) — `channels.discord`
    - [Feishu](/id/channels/feishu) — `channels.feishu`
    - [Google Chat](/id/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/id/channels/msteams) — `channels.msteams`
    - [Slack](/id/channels/slack) — `channels.slack`
    - [Signal](/id/channels/signal) — `channels.signal`
    - [iMessage](/id/channels/imessage) — `channels.imessage`
    - [Mattermost](/id/channels/mattermost) — `channels.mattermost`

    Semua channel berbagi pola kebijakan DM yang sama:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Memilih dan mengonfigurasi model">
    Tetapkan model utama dan fallback opsional:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` mendefinisikan katalog model dan bertindak sebagai allowlist untuk `/model`.
    - Ref model menggunakan format `provider/model` (misalnya `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol downscaling gambar transkrip/tool (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan vision-token pada eksekusi yang banyak screenshot.
    - Lihat [Models CLI](/concepts/models) untuk mengganti model di chat dan [Failover Model](/concepts/model-failover) untuk perilaku rotasi auth dan fallback.
    - Untuk provider kustom/self-hosted, lihat [Provider kustom](/gateway/configuration-reference#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Mengontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikontrol per channel melalui `dmPolicy`:

    - `"pairing"` (default): pengirim yang tidak dikenal mendapatkan pairing code satu kali untuk disetujui
    - `"allowlist"`: hanya pengirim di `allowFrom` (atau penyimpanan allow berpasangan)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus channel.

    Lihat [referensi lengkap](/gateway/configuration-reference#dm-and-group-access) untuk detail per channel.

  </Accordion>

  <Accordion title="Menyiapkan mention gating obrolan grup">
    Pesan grup secara default **memerlukan mention**. Konfigurasikan pola per agen:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Mention metadata**: @-mention native (WhatsApp tap-to-mention, Telegram @bot, dll.)
    - **Pola teks**: pola regex aman dalam `mentionPatterns`
    - Lihat [referensi lengkap](/gateway/configuration-reference#group-chat-mention-gating) untuk override per channel dan mode self-chat.

  </Accordion>

  <Accordion title="Membatasi Skills per agen">
    Gunakan `agents.defaults.skills` untuk baseline bersama, lalu override agen tertentu
    dengan `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Hilangkan `agents.defaults.skills` untuk Skills tak terbatas secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi default.
    - Setel `agents.list[].skills: []` untuk tanpa Skills.
    - Lihat [Skills](/tools/skills), [Config Skills](/tools/skills-config), dan
      [Referensi Konfigurasi](/gateway/configuration-reference#agentsdefaultsskills).

  </Accordion>

  <Accordion title="Menyesuaikan pemantauan kesehatan channel gateway">
    Kendalikan seberapa agresif gateway memulai ulang channel yang terlihat usang:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Setel `gateway.channelHealthCheckMinutes: 0` untuk menonaktifkan restart health-monitor secara global.
    - `channelStaleEventThresholdMinutes` harus lebih besar atau sama dengan interval pemeriksaan.
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan auto-restart bagi satu channel atau akun tanpa menonaktifkan monitor global.
    - Lihat [Pemeriksaan Kesehatan](/gateway/health) untuk pen-debug-an operasional dan [referensi lengkap](/gateway/configuration-reference#gateway) untuk semua field.

  </Accordion>

  <Accordion title="Mengonfigurasi sesi dan reset">
    Sesi mengontrol kontinuitas dan isolasi percakapan:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (bersama) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: default global untuk perutean sesi yang terikat thread (Discord mendukung `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age`).
    - Lihat [Manajemen Sesi](/concepts/session) untuk cakupan, tautan identitas, dan kebijakan pengiriman.
    - Lihat [referensi lengkap](/gateway/configuration-reference#session) untuk semua field.

  </Accordion>

  <Accordion title="Mengaktifkan sandboxing">
    Jalankan sesi agen di container Docker yang terisolasi:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Bangun image terlebih dahulu: `scripts/sandbox-setup.sh`

    Lihat [Sandboxing](/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/gateway/configuration-reference#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Mengaktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay dikonfigurasi di `openclaw.json`.

    Setel ini di config gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Padanan CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Yang dilakukan ini:

    - Memungkinkan gateway mengirim `push.test`, wake nudge, dan reconnect wake melalui relay eksternal.
    - Menggunakan izin kirim yang dicakup registrasi dan diteruskan oleh app iOS yang dipasangkan. Gateway tidak memerlukan token relay untuk seluruh deployment.
    - Mengikat setiap registrasi berbasis relay ke identitas gateway yang dipasangkan oleh app iOS, sehingga gateway lain tidak dapat menggunakan kembali registrasi yang tersimpan.
    - Mempertahankan build iOS lokal/manual pada APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build terdistribusi resmi yang mendaftar melalui relay.
    - Harus cocok dengan URL dasar relay yang ditanamkan ke dalam build iOS resmi/TestFlight, sehingga lalu lintas registrasi dan pengiriman mencapai deployment relay yang sama.

    Alur end-to-end:

    1. Instal build iOS resmi/TestFlight yang dikompilasi dengan URL dasar relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway.
    3. Pasangkan app iOS ke gateway dan biarkan sesi node serta operator sama-sama terhubung.
    4. App iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus app receipt, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang dipasangkan.
    5. Gateway menyimpan handle relay dan izin kirim, lalu menggunakannya untuk `push.test`, wake nudge, dan reconnect wake.

    Catatan operasional:

    - Jika Anda memindahkan app iOS ke gateway yang berbeda, sambungkan kembali app agar dapat memublikasikan registrasi relay baru yang terikat ke gateway tersebut.
    - Jika Anda merilis build iOS baru yang mengarah ke deployment relay berbeda, app akan menyegarkan registrasi relay cache alih-alih menggunakan kembali asal relay yang lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` masih berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi jalan keluar pengembangan khusus loopback; jangan simpan URL relay HTTP dalam config.

    Lihat [App iOS](/platforms/ios#relay-backed-push-for-official-builds) untuk alur end-to-end dan [Alur autentikasi dan kepercayaan](/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

  </Accordion>

  <Accordion title="Menyiapkan heartbeat (check-in berkala)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: string durasi (`30m`, `2h`). Setel `0m` untuk menonaktifkan.
    - `target`: `last` | `none` | `<channel-id>` (misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`)
    - `directPolicy`: `allow` (default) atau `block` untuk target heartbeat bergaya DM
    - Lihat [Heartbeat](/gateway/heartbeat) untuk panduan lengkap.

  </Accordion>

  <Accordion title="Mengonfigurasi tugas cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: pangkas sesi eksekusi terisolasi yang telah selesai dari `sessions.json` (default `24h`; setel `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan jumlah baris yang dipertahankan.
    - Lihat [Tugas cron](/id/automation/cron-jobs) untuk ikhtisar fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Menyiapkan webhook (hooks)">
    Aktifkan endpoint webhook HTTP pada Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Catatan keamanan:
    - Perlakukan semua konten payload hook/webhook sebagai input yang tidak tepercaya.
    - Gunakan `hooks.token` khusus; jangan gunakan ulang token Gateway bersama.
    - Auth hook hanya melalui header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query-string ditolak.
    - `hooks.path` tidak boleh berupa `/`; pertahankan ingress webhook pada subpath khusus seperti `/hooks`.
    - Biarkan flag bypass konten tidak aman tetap nonaktif (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali saat melakukan pen-debug-an yang sangat terbatas.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, setel juga `hooks.allowedSessionKeyPrefixes` untuk membatasi session key yang dipilih pemanggil.
    - Untuk agen yang digerakkan hook, utamakan tier model modern yang kuat dan kebijakan tool yang ketat (misalnya hanya messaging plus sandboxing jika memungkinkan).

    Lihat [referensi lengkap](/gateway/configuration-reference#hooks) untuk semua opsi pemetaan dan integrasi Gmail.

  </Accordion>

  <Accordion title="Mengonfigurasi perutean multi-agen">
    Jalankan beberapa agen terisolasi dengan workspace dan sesi terpisah:

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

    Lihat [Multi-Agent](/concepts/multi-agent) dan [referensi lengkap](/gateway/configuration-reference#multi-agent-routing) untuk aturan binding dan profil akses per agen.

  </Accordion>

  <Accordion title="Membagi config ke beberapa file ($include)">
    Gunakan `$include` untuk mengatur config yang besar:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Satu file**: menggantikan object yang memuatnya
    - **Array file**: di-deep-merge secara berurutan (yang belakangan menang)
    - **Key saudara**: digabungkan setelah include (menimpa nilai yang di-include)
    - **Include bertingkat**: didukung hingga 10 level
    - **Path relatif**: diresolusikan relatif terhadap file yang meng-include
    - **Penanganan error**: error yang jelas untuk file yang hilang, parse error, dan include melingkar

  </Accordion>
</AccordionGroup>

## Hot reload config

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis — tidak perlu mulai ulang manual untuk sebagian besar pengaturan.

### Mode reload

| Mode                   | Perilaku                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan perubahan aman secara hot seketika. Secara otomatis memulai ulang untuk perubahan kritis. |
| **`hot`**              | Hanya menerapkan perubahan aman secara hot. Mencatat peringatan saat perlu mulai ulang — Anda yang menanganinya. |
| **`restart`**          | Memulai ulang Gateway pada setiap perubahan config, aman atau tidak.                   |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada mulai ulang manual berikutnya.  |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Apa yang diterapkan secara hot vs apa yang perlu mulai ulang

Sebagian besar field diterapkan secara hot tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan mulai ulang ditangani secara otomatis.

| Kategori            | Fields                                                               | Perlu mulai ulang? |
| ------------------- | -------------------------------------------------------------------- | ------------------ |
| Channel             | `channels.*`, `web` (WhatsApp) — semua channel bawaan dan extension  | Tidak              |
| Agen & model        | `agent`, `agents`, `models`, `routing`                               | Tidak              |
| Otomatisasi         | `hooks`, `cron`, `agent.heartbeat`                                   | Tidak              |
| Sesi & pesan        | `session`, `messages`                                                | Tidak              |
| Tool & media        | `tools`, `browser`, `skills`, `audio`, `talk`                        | Tidak              |
| UI & lain-lain      | `ui`, `logging`, `identity`, `bindings`                              | Tidak              |
| Server gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Ya**             |
| Infrastruktur       | `discovery`, `canvasHost`, `plugins`                                 | **Ya**             |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian — mengubahnya **tidak** memicu mulai ulang.
</Note>

## RPC config (pembaruan terprogram)

<Note>
RPC penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi lajunya hingga **3 permintaan per 60 detik** per `deviceId+clientIp`. Saat dibatasi, RPC mengembalikan `UNAVAILABLE` dengan `retryAfterMs`.
</Note>

Alur aman/default:

- `config.schema.lookup`: periksa satu subtree config yang dicakup path dengan node
  skema dangkal, metadata petunjuk yang cocok, dan ringkasan child langsung
- `config.get`: ambil snapshot + hash saat ini
- `config.patch`: jalur pembaruan parsial yang disarankan
- `config.apply`: hanya untuk penggantian config penuh
- `update.run`: pembaruan mandiri + mulai ulang eksplisit

Saat Anda tidak mengganti seluruh config, utamakan `config.schema.lookup`
lalu `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (ganti penuh)">
    Memvalidasi + menulis seluruh config dan memulai ulang Gateway dalam satu langkah.

    <Warning>
    `config.apply` mengganti **seluruh config**. Gunakan `config.patch` untuk pembaruan parsial, atau `openclaw config set` untuk key tunggal.
    </Warning>

    Parameter:

    - `raw` (string) — payload JSON5 untuk seluruh config
    - `baseHash` (opsional) — hash config dari `config.get` (wajib saat config sudah ada)
    - `sessionKey` (opsional) — session key untuk ping bangun pasca-mulai-ulang
    - `note` (opsional) — catatan untuk sentinel mulai ulang
    - `restartDelayMs` (opsional) — penundaan sebelum mulai ulang (default 2000)

    Permintaan mulai ulang digabungkan saat satu permintaan sudah tertunda/sedang berlangsung, dan cooldown 30 detik berlaku antar siklus mulai ulang.

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (pembaruan parsial)">
    Menggabungkan pembaruan parsial ke dalam config yang ada (semantik JSON merge patch):

    - Object digabungkan secara rekursif
    - `null` menghapus key
    - Array menggantikan

    Parameter:

    - `raw` (string) — JSON5 yang hanya berisi key yang diubah
    - `baseHash` (wajib) — hash config dari `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — sama seperti `config.apply`

    Perilaku mulai ulang cocok dengan `config.apply`: mulai ulang tertunda yang digabungkan plus cooldown 30 detik antar siklus mulai ulang.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Environment variable

OpenClaw membaca env vars dari parent process ditambah:

- `.env` dari current working directory (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua file tidak menimpa env vars yang sudah ada. Anda juga dapat menetapkan env vars inline dalam config:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Impor env shell (opsional)">
  Jika diaktifkan dan key yang diharapkan belum disetel, OpenClaw menjalankan login shell Anda dan hanya mengimpor key yang hilang:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Padanan env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitusi env var dalam nilai config">
  Referensikan env vars dalam nilai string config mana pun dengan `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Aturan:

- Hanya nama huruf besar yang cocok: `[A-Z_][A-Z0-9_]*`
- Env var yang hilang/kosong memunculkan error saat waktu muat
- Escape dengan `$${VAR}` untuk output literal
- Berfungsi di dalam file `$include`
- Substitusi inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  Untuk field yang mendukung object SecretRef, Anda dapat menggunakan:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Detail SecretRef (termasuk `secrets.providers` untuk `env`/`file`/`exec`) ada di [Manajemen Secret](/gateway/secrets).
Path kredensial yang didukung tercantum di [Permukaan Kredensial SecretRef](/reference/secretref-credential-surface).
</Accordion>

Lihat [Environment](/help/environment) untuk prioritas dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap per field, lihat **[Referensi Konfigurasi](/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/gateway/configuration-examples) · [Referensi Konfigurasi](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
