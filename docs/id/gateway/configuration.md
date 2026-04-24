---
read_when:
    - Menyiapkan OpenClaw untuk pertama kalinya
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian config tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Configuration
x-i18n:
    generated_at: "2026-04-24T09:07:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw membaca config <Tooltip tip="JSON5 mendukung komentar dan koma di akhir">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.
Path config aktif harus berupa file reguler. Tata letak `openclaw.json` yang
bersymlink tidak didukung untuk penulisan yang dimiliki OpenClaw; penulisan atomik dapat mengganti
path tersebut alih-alih mempertahankan symlink. Jika Anda menyimpan config di luar
direktori state default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file sebenarnya.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan config:

- Hubungkan channel dan kontrol siapa yang dapat mengirim pesan ke bot
- Setel model, alat, sandboxing, atau otomasi (Cron, hooks)
- Sesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap field yang tersedia.

<Tip>
**Baru dalam konfigurasi?** Mulai dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Configuration Examples](/id/gateway/configuration-examples) untuk config lengkap yang bisa langsung disalin-tempel.
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
  <Tab title="CLI (satu baris)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI Control">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Config**.
    UI Control merender formulir dari skema config live, termasuk metadata dokumen field
    `title` / `description` serta skema Plugin dan channel saat
    tersedia, dengan editor **Raw JSON** sebagai jalan keluar. Untuk UI
    drill-down dan tooling lain, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema yang dibatasi path plus ringkasan child langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file tersebut dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Kunci yang tidak dikenal, tipe yang salah bentuk, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk memulai**. Satu-satunya pengecualian tingkat root adalah `$schema` (string), sehingga editor dapat melampirkan metadata JSON Schema.
</Warning>

`openclaw config schema` mencetak JSON Schema kanonis yang digunakan oleh UI Control
dan validasi. `config.schema.lookup` mengambil satu node yang dibatasi path plus
ringkasan child untuk tooling drill-down. Metadata dokumen field `title`/`description`
dibawa ke objek bertingkat, wildcard (`*`), item array (`[]`), dan cabang `anyOf`/
`oneOf`/`allOf`. Skema Plugin dan channel runtime digabungkan saat
registry manifes dimuat.

Saat validasi gagal:

- Gateway tidak dapat boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah yang tepat
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

Gateway menyimpan salinan tepercaya terakhir yang diketahui baik setelah setiap startup yang berhasil.
Jika `openclaw.json` kemudian gagal validasi (atau menghilangkan `gateway.mode`, menyusut
tajam, atau memiliki baris log asing yang ditambahkan di awal), OpenClaw mempertahankan file rusak
sebagai `.clobbered.*`, memulihkan salinan terakhir yang diketahui baik, dan mencatat alasan pemulihan
ke log. Giliran agen berikutnya juga menerima peringatan event sistem agar agen utama
tidak secara buta menulis ulang config yang dipulihkan. Promosi ke salinan terakhir yang diketahui baik
dilewati ketika kandidat berisi placeholder secret yang disunting seperti `***`.

## Tugas umum

<AccordionGroup>
  <Accordion title="Siapkan channel (WhatsApp, Telegram, Discord, dll.)">
    Setiap channel memiliki bagian config sendiri di bawah `channels.<provider>`. Lihat halaman channel khusus untuk langkah penyiapan:

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
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Pilih dan konfigurasikan model">
    Setel model utama dan fallback opsional:

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
    - Gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri allowlist tanpa menghapus model yang ada. Penggantian biasa yang akan menghapus entri ditolak kecuali Anda memberikan `--replace`.
    - Ref model menggunakan format `provider/model` (misalnya `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol downscaling gambar transkrip/alat (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan vision-token pada run yang banyak tangkapan layar.
    - Lihat [Models CLI](/id/concepts/models) untuk mengganti model di chat dan [Model Failover](/id/concepts/model-failover) untuk perilaku rotasi auth dan fallback.
    - Untuk penyedia kustom/self-hosted, lihat [Custom providers](/id/gateway/config-tools#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Kontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikontrol per channel melalui `dmPolicy`:

    - `"pairing"` (default): pengirim yang tidak dikenal mendapatkan kode pairing satu kali untuk disetujui
    - `"allowlist"`: hanya pengirim di `allowFrom` (atau paired allow store)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus channel.

    Lihat [referensi lengkap](/id/gateway/config-channels#dm-and-group-access) untuk detail per-channel.

  </Accordion>

  <Accordion title="Siapkan pembatasan mention chat grup">
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

    - **Metadata mention**: @-mention native (tap-to-mention WhatsApp, @bot Telegram, dll.)
    - **Pola teks**: pola regex aman di `mentionPatterns`
    - Lihat [referensi lengkap](/id/gateway/config-channels#group-chat-mention-gating) untuk override per-channel dan mode self-chat.

  </Accordion>

  <Accordion title="Batasi Skills per agen">
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

    - Hilangkan `agents.defaults.skills` agar Skills tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi default.
    - Setel `agents.list[].skills: []` agar tanpa Skills.
    - Lihat [Skills](/id/tools/skills), [Skills config](/id/tools/skills-config), dan
      [Configuration Reference](/id/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Sesuaikan pemantauan kesehatan channel Gateway">
    Kontrol seberapa agresif gateway me-restart channel yang tampak basi:

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
    - `channelStaleEventThresholdMinutes` harus lebih besar dari atau sama dengan interval pemeriksaan.
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan restart otomatis untuk satu channel atau akun tanpa menonaktifkan monitor global.
    - Lihat [Health Checks](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua field.

  </Accordion>

  <Accordion title="Konfigurasikan sesi dan reset">
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

    - `dmScope`: `main` (dibagikan) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: default global untuk perutean sesi terikat thread (Discord mendukung `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age`).
    - Lihat [Session Management](/id/concepts/session) untuk scoping, tautan identitas, dan kebijakan pengiriman.
    - Lihat [referensi lengkap](/id/gateway/config-agents#session) untuk semua field.

  </Accordion>

  <Accordion title="Aktifkan sandboxing">
    Jalankan sesi agen dalam runtime sandbox yang terisolasi:

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

    Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/id/gateway/config-agents#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Aktifkan push berbasis relay untuk build iOS resmi">
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
    - Menggunakan izin kirim yang dibatasi pendaftaran yang diteruskan oleh aplikasi iOS yang dipasangkan. Gateway tidak memerlukan token relay tingkat deployment.
    - Mengikat setiap pendaftaran berbasis relay ke identitas gateway yang dipasangkan oleh aplikasi iOS, sehingga gateway lain tidak dapat menggunakan ulang pendaftaran yang disimpan.
    - Menjaga build iOS lokal/manual tetap pada APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build resmi terdistribusi yang mendaftar melalui relay.
    - Harus cocok dengan URL dasar relay yang ditanamkan ke build iOS resmi/TestFlight, sehingga lalu lintas pendaftaran dan pengiriman mencapai deployment relay yang sama.

    Alur end-to-end:

    1. Instal build iOS resmi/TestFlight yang dikompilasi dengan URL dasar relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway.
    3. Pasangkan aplikasi iOS ke gateway dan biarkan sesi Node serta operator terhubung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus receipt aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang dipasangkan.
    5. Gateway menyimpan handle relay dan izin kirim, lalu menggunakannya untuk `push.test`, wake nudge, dan reconnect wake.

    Catatan operasional:

    - Jika Anda memindahkan aplikasi iOS ke gateway yang berbeda, hubungkan ulang aplikasi agar dapat memublikasikan pendaftaran relay baru yang terikat ke gateway tersebut.
    - Jika Anda merilis build iOS baru yang mengarah ke deployment relay berbeda, aplikasi menyegarkan pendaftaran relay yang di-cache alih-alih menggunakan ulang origin relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` masih berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi jalan keluar pengembangan khusus loopback; jangan persistensikan URL relay HTTP di config.

    Lihat [iOS App](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur end-to-end dan [Authentication and trust flow](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

  </Accordion>

  <Accordion title="Siapkan heartbeat (check-in berkala)">
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
    - Lihat [Heartbeat](/id/gateway/heartbeat) untuk panduan lengkap.

  </Accordion>

  <Accordion title="Konfigurasikan job Cron">
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

    - `sessionRetention`: pangkas sesi run terisolasi yang selesai dari `sessions.json` (default `24h`; setel `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan jumlah baris yang dipertahankan.
    - Lihat [Cron jobs](/id/automation/cron-jobs) untuk ikhtisar fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Siapkan Webhook (hooks)">
    Aktifkan endpoint Webhook HTTP di Gateway:

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
    - Perlakukan semua konten payload hook/Webhook sebagai input yang tidak tepercaya.
    - Gunakan `hooks.token` khusus; jangan gunakan ulang token Gateway bersama.
    - Auth hook hanya lewat header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query-string ditolak.
    - `hooks.path` tidak boleh `/`; pertahankan ingress Webhook pada subpath khusus seperti `/hooks`.
    - Biarkan flag bypass konten tidak aman tetap nonaktif (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali untuk debugging yang sangat terbatas.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, setel juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agen yang digerakkan hook, pilih tier model modern yang kuat dan kebijakan alat yang ketat (misalnya hanya perpesanan plus sandboxing jika memungkinkan).

    Lihat [referensi lengkap](/id/gateway/configuration-reference#hooks) untuk semua opsi mapping dan integrasi Gmail.

  </Accordion>

  <Accordion title="Konfigurasikan perutean multi-agen">
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

    Lihat [Multi-Agent](/id/concepts/multi-agent) dan [referensi lengkap](/id/gateway/config-agents#multi-agent-routing) untuk aturan binding dan profil akses per agen.

  </Accordion>

  <Accordion title="Pisahkan config ke beberapa file ($include)">
    Gunakan `$include` untuk mengatur config besar:

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
    - **Array file**: di-deep-merge secara berurutan (yang belakangan menang)
    - **Kunci sibling**: digabungkan setelah include (menimpa nilai hasil include)
    - **Include bertingkat**: didukung hingga 10 level
    - **Path relatif**: diresolusikan relatif terhadap file yang menyertakan
    - **Penulisan milik OpenClaw**: saat penulisan hanya mengubah satu bagian tingkat atas
      yang didukung oleh include satu file seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui file include tersebut dan membiarkan `openclaw.json` tetap utuh
    - **Write-through yang tidak didukung**: include root, array include, dan include
      dengan override sibling gagal tertutup untuk penulisan milik OpenClaw alih-alih
      meratakan config
    - **Penanganan galat**: galat yang jelas untuk file hilang, galat parse, dan include melingkar

  </Accordion>
</AccordionGroup>

## Hot reload config

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis — tidak perlu restart manual untuk sebagian besar pengaturan.

Edit file langsung diperlakukan sebagai tidak tepercaya sampai tervalidasi. Watcher menunggu
churn temp-write/rename editor mereda, membaca file akhir, dan menolak
edit eksternal yang tidak valid dengan memulihkan config terakhir yang diketahui baik. Penulisan config
milik OpenClaw menggunakan gerbang skema yang sama sebelum menulis; clobber destruktif seperti
menghapus `gateway.mode` atau menyusutkan file lebih dari setengah akan ditolak
dan disimpan sebagai `.rejected.*` untuk diperiksa.

Jika Anda melihat `Config auto-restored from last-known-good` atau
`config reload restored last-known-good config` di log, periksa file
`.clobbered.*` yang sesuai di samping `openclaw.json`, perbaiki payload yang ditolak, lalu jalankan
`openclaw config validate`. Lihat [Gateway troubleshooting](/id/gateway/troubleshooting#gateway-restored-last-known-good-config)
untuk daftar periksa pemulihan.

### Mode reload

| Mode                   | Behavior                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan perubahan aman secara langsung. Secara otomatis restart untuk perubahan kritis. |
| **`hot`**              | Hanya menerapkan perubahan aman secara langsung. Mencatat peringatan saat restart diperlukan — Anda yang menanganinya. |
| **`restart`**          | Me-restart Gateway pada setiap perubahan config, aman atau tidak.                       |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada restart manual berikutnya.        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Apa yang diterapkan langsung vs apa yang memerlukan restart

Sebagian besar field diterapkan langsung tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani secara otomatis.

| Category            | Fields                                                            | Restart needed? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channels            | `channels.*`, `web` (WhatsApp) — semua channel bawaan dan Plugin  | Tidak           |
| Agent & models      | `agent`, `agents`, `models`, `routing`                            | Tidak           |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                | Tidak           |
| Sessions & messages | `session`, `messages`                                             | Tidak           |
| Tools & media       | `tools`, `browser`, `skills`, `audio`, `talk`                     | Tidak           |
| UI & misc           | `ui`, `logging`, `identity`, `bindings`                           | Tidak           |
| Gateway server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Ya**          |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                              | **Ya**          |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian — mengubahnya **tidak** memicu restart.
</Note>

### Perencanaan reload

Saat Anda mengedit file sumber yang direferensikan melalui `$include`, OpenClaw merencanakan
reload dari tata letak sumber yang ditulis, bukan tampilan in-memory yang diratakan.
Itu menjaga keputusan hot-reload (terapkan langsung vs restart) tetap dapat diprediksi bahkan ketika
satu bagian tingkat atas hidup di file include sendiri seperti
`plugins: { $include: "./plugins.json5" }`. Perencanaan reload gagal tertutup jika
tata letak sumber ambigu.

## RPC config (pembaruan terprogram)

Untuk tooling yang menulis config melalui API gateway, pilih alur ini:

- `config.schema.lookup` untuk memeriksa satu subtree (node skema dangkal + ringkasan child)
- `config.get` untuk mengambil snapshot saat ini plus `hash`
- `config.patch` untuk pembaruan parsial (JSON merge patch: objek digabungkan, `null`
  menghapus, array menggantikan)
- `config.apply` hanya saat Anda memang ingin mengganti seluruh config
- `update.run` untuk self-update eksplisit plus restart

<Note>
Penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi lajunya ke
3 permintaan per 60 detik per `deviceId+clientIp`. Permintaan restart
digabungkan lalu menerapkan cooldown 30 detik antar-siklus restart.
</Note>

Contoh patch parsial:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Baik `config.apply` maupun `config.patch` menerima `raw`, `baseHash`, `sessionKey`,
`note`, dan `restartDelayMs`. `baseHash` wajib untuk kedua metode saat sebuah
config sudah ada.

## Variabel environment

OpenClaw membaca var env dari proses induk ditambah:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua file tidak menimpa var env yang sudah ada. Anda juga dapat menyetel var env inline di config:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Impor env shell (opsional)">
  Jika diaktifkan dan kunci yang diharapkan belum disetel, OpenClaw menjalankan shell login Anda dan hanya mengimpor kunci yang hilang:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Padanan var env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitusi var env dalam nilai config">
  Referensikan var env di nilai string config apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Aturan:

- Hanya nama huruf besar yang cocok: `[A-Z_][A-Z0-9_]*`
- Var yang hilang/kosong memunculkan galat saat load time
- Escape dengan `$${VAR}` untuk output literal
- Berfungsi di dalam file `$include`
- Substitusi inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Ref secret (env, file, exec)">
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

Detail SecretRef (termasuk `secrets.providers` untuk `env`/`file`/`exec`) ada di [Secrets Management](/id/gateway/secrets).
Path kredensial yang didukung tercantum di [SecretRef Credential Surface](/id/reference/secretref-credential-surface).
</Accordion>

Lihat [Environment](/id/help/environment) untuk prioritas dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap field demi field, lihat **[Configuration Reference](/id/gateway/configuration-reference)**.

---

_Terkait: [Configuration Examples](/id/gateway/configuration-examples) · [Configuration Reference](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Configuration reference](/id/gateway/configuration-reference)
- [Configuration examples](/id/gateway/configuration-examples)
- [Gateway runbook](/id/gateway)
