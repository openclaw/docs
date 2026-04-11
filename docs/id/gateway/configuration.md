---
read_when:
    - Menyiapkan OpenClaw untuk pertama kalinya
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-11T02:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e874be80d11b9123cac6ce597ec02667fbc798f622a076f68535a1af1f0e399c
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfigurasi

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 mendukung komentar dan koma di akhir">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan konfigurasi:

- Menghubungkan channel dan mengontrol siapa yang dapat mengirim pesan ke bot
- Menetapkan model, alat, sandboxing, atau otomasi (cron, hook)
- Menyesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap field yang tersedia.

<Tip>
**Baru mengenal konfigurasi?** Mulailah dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Contoh Konfigurasi](/id/gateway/configuration-examples) untuk konfigurasi lengkap yang siap salin-tempel.
</Tip>

## Konfigurasi minimal

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Mengedit konfigurasi

<Tabs>
  <Tab title="Wizard interaktif">
    ```bash
    openclaw onboard       # alur onboarding lengkap
    openclaw configure     # wizard konfigurasi
    ```
  </Tab>
  <Tab title="CLI (satu baris)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Config**.
    Control UI merender formulir dari skema konfigurasi langsung, termasuk metadata dokumentasi field
    `title` / `description` serta skema plugin dan channel saat
    tersedia, dengan editor **Raw JSON** sebagai jalan keluar. Untuk UI
    penelusuran mendalam dan alat lainnya, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema yang dibatasi ke jalur beserta ringkasan anak langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file tersebut dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Kunci yang tidak dikenal, tipe yang salah bentuk, atau nilai yang tidak valid akan menyebabkan Gateway **menolak untuk memulai**. Satu-satunya pengecualian di level root adalah `$schema` (string), sehingga editor dapat melampirkan metadata JSON Schema.
</Warning>

Catatan alat skema:

- `openclaw config schema` mencetak keluarga JSON Schema yang sama yang digunakan oleh Control UI
  dan validasi konfigurasi.
- Perlakukan keluaran skema tersebut sebagai kontrak kanonis yang dapat dibaca mesin untuk
  `openclaw.json`; ringkasan ini dan referensi konfigurasi merangkumnya.
- Nilai field `title` dan `description` dibawa ke keluaran skema untuk
  alat editor dan formulir.
- Entri objek bersarang, wildcard (`*`), dan item array (`[]`) mewarisi metadata
  dokumentasi yang sama ketika dokumentasi field yang cocok tersedia.
- Cabang komposisi `anyOf` / `oneOf` / `allOf` juga mewarisi metadata
  dokumentasi yang sama, sehingga varian union/intersection tetap memiliki bantuan field yang sama.
- `config.schema.lookup` mengembalikan satu jalur konfigurasi yang dinormalisasi dengan node skema dangkal
  (`title`, `description`, `type`, `enum`, `const`, batas umum,
  dan field validasi serupa), metadata petunjuk UI yang cocok, dan ringkasan anak langsung
  untuk alat penelusuran mendalam.
- Skema plugin/channel runtime digabungkan ketika gateway dapat memuat
  registri manifes saat ini.
- `pnpm config:docs:check` mendeteksi drift antara artefak baseline konfigurasi yang menghadap dokumen
  dan permukaan skema saat ini.

Saat validasi gagal:

- Gateway tidak akan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah secara persis
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

## Tugas umum

<AccordionGroup>
  <Accordion title="Menyiapkan channel (WhatsApp, Telegram, Discord, dll.)">
    Setiap channel memiliki bagian konfigurasi sendiri di bawah `channels.<provider>`. Lihat halaman channel khusus untuk langkah penyiapan:

    - [WhatsApp](/id/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/id/channels/telegram) — `channels.telegram`
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
          allowFrom: ["tg:123"], // hanya untuk allowlist/open
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
    - `agents.defaults.imageMaxDimensionPx` mengontrol penskalaan turun gambar transkrip/alat (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan vision-token pada proses yang banyak tangkapan layar.
    - Lihat [Models CLI](/id/concepts/models) untuk mengganti model di chat dan [Model Failover](/id/concepts/model-failover) untuk perilaku rotasi auth dan fallback.
    - Untuk provider kustom/self-hosted, lihat [Custom providers](/id/gateway/configuration-reference#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Mengontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikontrol per channel melalui `dmPolicy`:

    - `"pairing"` (default): pengirim yang tidak dikenal mendapatkan kode pairing sekali pakai untuk disetujui
    - `"allowlist"`: hanya pengirim di `allowFrom` (atau penyimpanan allow berpasangan)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus channel.

    Lihat [referensi lengkap](/id/gateway/configuration-reference#dm-and-group-access) untuk detail per channel.

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

    - **Metadata mention**: @-mention native (WhatsApp ketuk-untuk-mention, Telegram @bot, dll.)
    - **Pola teks**: pola regex aman di `mentionPatterns`
    - Lihat [referensi lengkap](/id/gateway/configuration-reference#group-chat-mention-gating) untuk override per channel dan mode self-chat.

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
          { id: "writer" }, // mewarisi github, weather
          { id: "docs", skills: ["docs-search"] }, // menggantikan default
          { id: "locked-down", skills: [] }, // tanpa Skills
        ],
      },
    }
    ```

    - Hilangkan `agents.defaults.skills` agar Skills tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi default.
    - Tetapkan `agents.list[].skills: []` untuk tanpa Skills.
    - Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan
      [Referensi Konfigurasi](/id/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Menyesuaikan pemantauan kesehatan channel gateway">
    Kendalikan seberapa agresif gateway me-restart channel yang tampak basi:

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

    - Tetapkan `gateway.channelHealthCheckMinutes: 0` untuk menonaktifkan restart health-monitor secara global.
    - `channelStaleEventThresholdMinutes` harus lebih besar dari atau sama dengan interval pemeriksaan.
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan restart otomatis bagi satu channel atau akun tanpa menonaktifkan monitor global.
    - Lihat [Health Checks](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua field.

  </Accordion>

  <Accordion title="Mengonfigurasi sesi dan reset">
    Sesi mengontrol kesinambungan dan isolasi percakapan:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // direkomendasikan untuk multi-pengguna
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
    - Lihat [Manajemen Sesi](/id/concepts/session) untuk cakupan, tautan identitas, dan kebijakan pengiriman.
    - Lihat [referensi lengkap](/id/gateway/configuration-reference#session) untuk semua field.

  </Accordion>

  <Accordion title="Mengaktifkan sandboxing">
    Jalankan sesi agen dalam container Docker yang terisolasi:

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

    Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/id/gateway/configuration-reference#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Mengaktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay dikonfigurasi di `openclaw.json`.

    Tetapkan ini di konfigurasi gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opsional. Default: 10000
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

    - Memungkinkan gateway mengirim `push.test`, dorongan bangun, dan bangun reconnect melalui relay eksternal.
    - Menggunakan grant pengiriman yang dicakup registrasi dan diteruskan oleh aplikasi iOS yang dipasangkan. Gateway tidak memerlukan token relay untuk seluruh deployment.
    - Mengikat setiap registrasi berbasis relay ke identitas gateway yang dipasangkan dengan aplikasi iOS, sehingga gateway lain tidak dapat menggunakan ulang registrasi yang tersimpan.
    - Menjaga build iOS lokal/manual tetap menggunakan APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build resmi terdistribusi yang mendaftar melalui relay.
    - Harus cocok dengan URL dasar relay yang ditanamkan ke dalam build iOS resmi/TestFlight, sehingga lalu lintas registrasi dan pengiriman mencapai deployment relay yang sama.

    Alur end-to-end:

    1. Instal build iOS resmi/TestFlight yang dikompilasi dengan URL dasar relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway.
    3. Pasangkan aplikasi iOS ke gateway dan biarkan sesi node serta operator sama-sama terhubung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus receipt aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang dipasangkan.
    5. Gateway menyimpan handle relay dan grant pengiriman, lalu menggunakannya untuk `push.test`, dorongan bangun, dan bangun reconnect.

    Catatan operasional:

    - Jika Anda memindahkan aplikasi iOS ke gateway yang berbeda, sambungkan ulang aplikasi agar dapat memublikasikan registrasi relay baru yang terikat ke gateway tersebut.
    - Jika Anda merilis build iOS baru yang mengarah ke deployment relay yang berbeda, aplikasi menyegarkan registrasi relay cache-nya alih-alih menggunakan ulang origin relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` tetap berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi jalan keluar pengembangan khusus loopback; jangan simpan URL relay HTTP di konfigurasi.

    Lihat [Aplikasi iOS](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur end-to-end dan [Alur autentikasi dan kepercayaan](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

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

    - `every`: string durasi (`30m`, `2h`). Tetapkan `0m` untuk menonaktifkan.
    - `target`: `last` | `none` | `<channel-id>` (misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`)
    - `directPolicy`: `allow` (default) atau `block` untuk target heartbeat bergaya DM
    - Lihat [Heartbeat](/id/gateway/heartbeat) untuk panduan lengkap.

  </Accordion>

  <Accordion title="Mengonfigurasi pekerjaan cron">
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

    - `sessionRetention`: pangkas sesi run terisolasi yang selesai dari `sessions.json` (default `24h`; tetapkan `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan jumlah baris yang dipertahankan.
    - Lihat [Pekerjaan cron](/id/automation/cron-jobs) untuk ikhtisar fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Menyiapkan webhook (hook)">
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
    - Autentikasi hook hanya melalui header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query-string ditolak.
    - `hooks.path` tidak boleh berupa `/`; pertahankan ingress webhook pada subjalur khusus seperti `/hooks`.
    - Biarkan flag bypass konten tidak aman dinonaktifkan (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali saat melakukan debugging yang sangat terbatas.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agen yang didorong hook, utamakan tier model modern yang kuat dan kebijakan alat yang ketat (misalnya hanya pesan ditambah sandboxing jika memungkinkan).

    Lihat [referensi lengkap](/id/gateway/configuration-reference#hooks) untuk semua opsi pemetaan dan integrasi Gmail.

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

    Lihat [Multi-Agent](/id/concepts/multi-agent) dan [referensi lengkap](/id/gateway/configuration-reference#multi-agent-routing) untuk aturan binding dan profil akses per agen.

  </Accordion>

  <Accordion title="Membagi konfigurasi ke beberapa file ($include)">
    Gunakan `$include` untuk mengatur konfigurasi yang besar:

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

    - **Satu file**: menggantikan objek yang memuatnya
    - **Array file**: di-deep-merge sesuai urutan (yang belakangan menang)
    - **Kunci saudara**: digabungkan setelah include (menimpa nilai yang disertakan)
    - **Include bersarang**: didukung hingga 10 level kedalaman
    - **Path relatif**: diresolusikan relatif terhadap file yang menyertakan
    - **Penanganan kesalahan**: kesalahan yang jelas untuk file hilang, kesalahan parse, dan include melingkar

  </Accordion>
</AccordionGroup>

## Hot reload konfigurasi

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis — tidak perlu restart manual untuk sebagian besar pengaturan.

### Mode reload

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan perubahan aman secara hot seketika. Secara otomatis me-restart untuk perubahan kritis.           |
| **`hot`**              | Hanya menerapkan perubahan aman secara hot. Mencatat peringatan saat restart diperlukan — Anda yang menanganinya. |
| **`restart`**          | Me-restart Gateway pada setiap perubahan konfigurasi, aman atau tidak.                                 |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada restart manual berikutnya.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Yang diterapkan secara hot vs yang memerlukan restart

Sebagian besar field diterapkan secara hot tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani secara otomatis.

| Category            | Fields                                                               | Restart needed? |
| ------------------- | -------------------------------------------------------------------- | --------------- |
| Channels            | `channels.*`, `web` (WhatsApp) — semua channel bawaan dan ekstensi | Tidak              |
| Agent & models      | `agent`, `agents`, `models`, `routing`                               | Tidak              |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                   | Tidak              |
| Sessions & messages | `session`, `messages`                                                | Tidak              |
| Tools & media       | `tools`, `browser`, `skills`, `audio`, `talk`                        | Tidak              |
| UI & misc           | `ui`, `logging`, `identity`, `bindings`                              | Tidak              |
| Gateway server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Ya**         |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                                 | **Ya**         |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian — mengubahnya **tidak** memicu restart.
</Note>

## RPC konfigurasi (pembaruan terprogram)

<Note>
RPC penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi hingga **3 permintaan per 60 detik** per `deviceId+clientIp`. Saat dibatasi, RPC mengembalikan `UNAVAILABLE` dengan `retryAfterMs`.
</Note>

Alur aman/default:

- `config.schema.lookup`: periksa satu subtree konfigurasi yang dibatasi jalur dengan node skema dangkal,
  metadata petunjuk yang cocok, dan ringkasan anak langsung
- `config.get`: ambil snapshot + hash saat ini
- `config.patch`: jalur pembaruan parsial yang disukai
- `config.apply`: hanya untuk penggantian konfigurasi penuh
- `update.run`: self-update + restart eksplisit

Saat Anda tidak mengganti seluruh konfigurasi, utamakan `config.schema.lookup`
lalu `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (penggantian penuh)">
    Memvalidasi + menulis konfigurasi penuh dan me-restart Gateway dalam satu langkah.

    <Warning>
    `config.apply` menggantikan **seluruh konfigurasi**. Gunakan `config.patch` untuk pembaruan parsial, atau `openclaw config set` untuk kunci tunggal.
    </Warning>

    Parameter:

    - `raw` (string) — payload JSON5 untuk seluruh konfigurasi
    - `baseHash` (opsional) — hash konfigurasi dari `config.get` (wajib saat konfigurasi ada)
    - `sessionKey` (opsional) — kunci sesi untuk ping wake-up pasca-restart
    - `note` (opsional) — catatan untuk sentinel restart
    - `restartDelayMs` (opsional) — jeda sebelum restart (default 2000)

    Permintaan restart digabungkan saat satu restart lain sudah tertunda/dalam proses, dan cooldown 30 detik berlaku di antara siklus restart.

    ```bash
    openclaw gateway call config.get --params '{}'  # ambil payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (pembaruan parsial)">
    Menggabungkan pembaruan parsial ke dalam konfigurasi yang ada (semantik JSON merge patch):

    - Objek digabungkan secara rekursif
    - `null` menghapus kunci
    - Array menggantikan

    Parameter:

    - `raw` (string) — JSON5 hanya dengan kunci yang akan diubah
    - `baseHash` (wajib) — hash konfigurasi dari `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — sama seperti `config.apply`

    Perilaku restart sama dengan `config.apply`: restart tertunda digabungkan ditambah cooldown 30 detik di antara siklus restart.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variabel lingkungan

OpenClaw membaca variabel env dari proses induk serta:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua file tidak menimpa variabel env yang sudah ada. Anda juga dapat menetapkan variabel env inline di konfigurasi:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Impor env shell (opsional)">
  Jika diaktifkan dan kunci yang diharapkan belum ditetapkan, OpenClaw menjalankan shell login Anda dan hanya mengimpor kunci yang hilang:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Padanan variabel env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitusi variabel env dalam nilai konfigurasi">
  Referensikan variabel env dalam nilai string konfigurasi apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Aturan:

- Hanya nama huruf besar yang cocok: `[A-Z_][A-Z0-9_]*`
- Variabel yang hilang/kosong memunculkan error saat waktu muat
- Escape dengan `$${VAR}` untuk keluaran literal
- Berfungsi di dalam file `$include`
- Substitusi inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret ref (env, file, exec)">
  Untuk field yang mendukung objek SecretRef, Anda dapat menggunakan:

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

Detail SecretRef (termasuk `secrets.providers` untuk `env`/`file`/`exec`) ada di [Manajemen Secret](/id/gateway/secrets).
Path kredensial yang didukung tercantum di [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Accordion>

Lihat [Environment](/id/help/environment) untuk prioritas dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap per field, lihat **[Referensi Konfigurasi](/id/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Referensi Konfigurasi](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_
