---
read_when:
    - Menyiapkan OpenClaw untuk pertama kali
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-26T11:28:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc1148b93c00d30e34aad0ffb5e1d4dae5438a195a531f5247bbc9a261142350
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 mendukung komentar dan trailing comma">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.
Path konfigurasi aktif harus berupa file biasa. Tata letak `openclaw.json`
yang berupa symlink tidak didukung untuk penulisan yang dimiliki OpenClaw; penulisan atomik dapat mengganti
path tersebut alih-alih mempertahankan symlink. Jika Anda menyimpan konfigurasi di luar
direktori status default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file sebenarnya.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan konfigurasi:

- Menghubungkan channel dan mengontrol siapa yang dapat mengirim pesan ke bot
- Mengatur model, tool, sandboxing, atau otomasi (Cron, hook)
- Menyesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap field yang tersedia.

Agen dan otomasi sebaiknya menggunakan `config.schema.lookup` untuk dokumentasi
tingkat field yang tepat sebelum mengedit konfigurasi. Gunakan halaman ini untuk panduan berbasis tugas dan
[Configuration reference](/id/gateway/configuration-reference) untuk peta field dan default yang lebih luas.

<Tip>
**Baru dalam konfigurasi?** Mulailah dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Configuration Examples](/id/gateway/configuration-examples) untuk konfigurasi lengkap yang siap salin-tempel.
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
    openclaw onboard       # alur onboarding penuh
    openclaw configure     # wizard konfigurasi
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
    Control UI merender form dari skema konfigurasi live, termasuk metadata dokumentasi field
    `title` / `description` plus skema plugin dan channel saat
    tersedia, dengan editor **Raw JSON** sebagai jalan keluar. Untuk UI
    drill-down dan tool lainnya, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema bercakupan path plus ringkasan child langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file tersebut dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya sesuai dengan skema. Kunci yang tidak dikenal, tipe yang salah bentuk, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk memulai**. Satu-satunya pengecualian tingkat root adalah `$schema` (string), sehingga editor dapat melampirkan metadata JSON Schema.
</Warning>

`openclaw config schema` mencetak JSON Schema kanonis yang digunakan oleh Control UI
dan validasi. `config.schema.lookup` mengambil satu node bercakupan path beserta
ringkasan child untuk tooling drill-down. Metadata dokumentasi field `title`/`description`
diteruskan melalui objek bertingkat, wildcard (`*`), item array (`[]`), dan cabang `anyOf`/
`oneOf`/`allOf`. Skema plugin dan channel runtime digabungkan saat registry
manifest dimuat.

Saat validasi gagal:

- Gateway tidak melakukan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah yang tepat
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

Gateway menyimpan salinan terpercaya terakhir yang diketahui baik setelah setiap startup yang berhasil.
Jika `openclaw.json` kemudian gagal validasi (atau menghapus `gateway.mode`, menyusut
tajam, atau memiliki baris log nyasar yang ditambahkan di awal), OpenClaw mempertahankan file yang rusak
sebagai `.clobbered.*`, memulihkan salinan terpercaya terakhir yang diketahui baik, dan mencatat alasan
pemulihan. Giliran agen berikutnya juga menerima peringatan system-event agar agen utama
tidak menulis ulang konfigurasi yang dipulihkan secara membabi buta. Promosi ke salinan terpercaya terakhir yang diketahui baik
dilewati ketika kandidat berisi placeholder secret yang telah disamarkan seperti `***`.
Ketika setiap masalah validasi dibatasi ke `plugins.entries.<id>...`, OpenClaw
tidak melakukan pemulihan seluruh file. OpenClaw mempertahankan konfigurasi saat ini tetap aktif dan
menampilkan kegagalan lokal plugin sehingga ketidakcocokan skema plugin atau versi host
tidak dapat mengembalikan pengaturan pengguna lain yang tidak terkait.

## Tugas umum

<AccordionGroup>
  <Accordion title="Menyiapkan channel (WhatsApp, Telegram, Discord, dll.)">
    Setiap channel memiliki bagian konfigurasinya sendiri di bawah `channels.<provider>`. Lihat halaman channel khusus untuk langkah penyiapan:

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
    Atur model utama dan fallback opsional:

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
    - Gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri allowlist tanpa menghapus model yang sudah ada. Penggantian biasa yang akan menghapus entri ditolak kecuali Anda memberikan `--replace`.
    - Referensi model menggunakan format `provider/model` (mis. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol downscaling gambar transkrip/tool (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan vision-token pada proses yang banyak screenshot.
    - Lihat [Models CLI](/id/concepts/models) untuk mengganti model di chat dan [Model Failover](/id/concepts/model-failover) untuk rotasi autentikasi dan perilaku fallback.
    - Untuk provider kustom/self-hosted, lihat [Custom providers](/id/gateway/config-tools#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Mengontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikontrol per channel melalui `dmPolicy`:

    - `"pairing"` (default): pengirim yang tidak dikenal mendapatkan kode pairing satu kali untuk disetujui
    - `"allowlist"`: hanya pengirim di `allowFrom` (atau penyimpanan allow hasil pairing)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus channel.

    Lihat [referensi lengkap](/id/gateway/config-channels#dm-and-group-access) untuk detail per channel.

  </Accordion>

  <Accordion title="Menyiapkan mention gating chat grup">
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

    - **Mention metadata**: @-mention native (@-mention ketuk WhatsApp, Telegram @bot, dll.)
    - **Pola teks**: pola regex aman di `mentionPatterns`
    - Lihat [referensi lengkap](/id/gateway/config-channels#group-chat-mention-gating) untuk override per channel dan mode self-chat.

  </Accordion>

  <Accordion title="Membatasi skill per agen">
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
          { id: "locked-down", skills: [] }, // tanpa skill
        ],
      },
    }
    ```

    - Hilangkan `agents.defaults.skills` untuk skill tak terbatas secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi default.
    - Atur `agents.list[].skills: []` untuk tanpa skill.
    - Lihat [Skills](/id/tools/skills), [Skills config](/id/tools/skills-config), dan
      [Configuration Reference](/id/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Menyesuaikan pemantauan kesehatan channel gateway">
    Kontrol seberapa agresif gateway memulai ulang channel yang tampak basi:

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

    - Atur `gateway.channelHealthCheckMinutes: 0` untuk menonaktifkan restart health-monitor secara global.
    - `channelStaleEventThresholdMinutes` harus lebih besar dari atau sama dengan interval pemeriksaan.
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan auto-restart untuk satu channel atau akun tanpa menonaktifkan monitor global.
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
    - `threadBindings`: default global untuk perutean sesi terikat thread (Discord mendukung `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age`).
    - Lihat [Session Management](/id/concepts/session) untuk scoping, tautan identitas, dan kebijakan pengiriman.
    - Lihat [referensi lengkap](/id/gateway/config-agents#session) untuk semua field.

  </Accordion>

  <Accordion title="Mengaktifkan sandboxing">
    Jalankan sesi agen dalam runtime sandbox terisolasi:

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

  <Accordion title="Mengaktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay dikonfigurasi di `openclaw.json`.

    Atur ini di konfigurasi gateway:

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

    Fungsinya:

    - Memungkinkan gateway mengirim `push.test`, dorongan wake, dan wake reconnect melalui relay eksternal.
    - Menggunakan grant pengiriman bercakupan registrasi yang diteruskan oleh aplikasi iOS yang di-pairing. Gateway tidak memerlukan token relay tingkat deployment.
    - Mengikat setiap registrasi berbasis relay ke identitas gateway yang di-pairing oleh aplikasi iOS, sehingga gateway lain tidak dapat menggunakan ulang registrasi yang tersimpan.
    - Mempertahankan build iOS lokal/manual pada APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build resmi yang didistribusikan yang mendaftar melalui relay.
    - Harus cocok dengan base URL relay yang dibundel ke dalam build iOS resmi/TestFlight, sehingga lalu lintas registrasi dan pengiriman mencapai deployment relay yang sama.

    Alur end-to-end:

    1. Pasang build iOS resmi/TestFlight yang dikompilasi dengan base URL relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway.
    3. Pairing aplikasi iOS ke gateway dan biarkan sesi node maupun operator terhubung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus receipt aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang di-pairing.
    5. Gateway menyimpan handle relay dan grant pengiriman, lalu menggunakannya untuk `push.test`, dorongan wake, dan wake reconnect.

    Catatan operasional:

    - Jika Anda mengganti aplikasi iOS ke gateway lain, hubungkan ulang aplikasi agar dapat memublikasikan registrasi relay baru yang terikat ke gateway tersebut.
    - Jika Anda mengirim build iOS baru yang menunjuk ke deployment relay lain, aplikasi menyegarkan registrasi relay yang di-cache alih-alih menggunakan ulang asal relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` masih berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi escape hatch pengembangan khusus loopback; jangan mempertahankan URL relay HTTP di konfigurasi.

    Lihat [Aplikasi iOS](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur end-to-end dan [Alur autentikasi dan trust](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

  </Accordion>

  <Accordion title="Menyiapkan Heartbeat (check-in berkala)">
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

    - `every`: string durasi (`30m`, `2h`). Atur `0m` untuk menonaktifkan.
    - `target`: `last` | `none` | `<channel-id>` (misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`)
    - `directPolicy`: `allow` (default) atau `block` untuk target Heartbeat bergaya DM
    - Lihat [Heartbeat](/id/gateway/heartbeat) untuk panduan lengkap.

  </Accordion>

  <Accordion title="Mengonfigurasi job Cron">
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

    - `sessionRetention`: pangkas sesi proses terisolasi yang sudah selesai dari `sessions.json` (default `24h`; atur `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan jumlah baris yang dipertahankan.
    - Lihat [Cron jobs](/id/automation/cron-jobs) untuk ikhtisar fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Menyiapkan Webhook (hook)">
    Aktifkan endpoint Webhook HTTP pada Gateway:

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
    - Autentikasi hook hanya melalui header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query string ditolak.
    - `hooks.path` tidak boleh `/`; pertahankan ingress Webhook pada subpath khusus seperti `/hooks`.
    - Pertahankan flag bypass konten tidak aman tetap dinonaktifkan (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali untuk debugging yang sangat terbatas.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, atur juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agen yang digerakkan oleh hook, sebaiknya gunakan tier model modern yang kuat dan kebijakan tool yang ketat (misalnya hanya pesan plus sandboxing bila memungkinkan).

    Lihat [referensi lengkap](/id/gateway/configuration-reference#hooks) untuk semua opsi mapping dan integrasi Gmail.

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

    Lihat [Multi-Agent](/id/concepts/multi-agent) dan [referensi lengkap](/id/gateway/config-agents#multi-agent-routing) untuk aturan binding dan profil akses per agen.

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
    - **Array file**: di-deep-merge secara berurutan (yang belakangan menang)
    - **Kunci sibling**: di-merge setelah include (menimpa nilai yang di-include)
    - **Include bertingkat**: didukung hingga 10 level
    - **Path relatif**: di-resolve relatif terhadap file yang menyertakan
    - **Penulisan milik OpenClaw**: ketika sebuah penulisan hanya mengubah satu bagian tingkat atas
      yang didukung oleh include satu file seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui file yang di-include tersebut dan membiarkan `openclaw.json` tetap utuh
    - **Write-through yang tidak didukung**: include root, array include, dan include
      dengan override sibling gagal tertutup untuk penulisan milik OpenClaw alih-alih
      meratakan konfigurasi
    - **Penanganan error**: error yang jelas untuk file yang hilang, parse error, dan include melingkar

  </Accordion>
</AccordionGroup>

## Hot reload konfigurasi

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis — sebagian besar pengaturan tidak memerlukan restart manual.

Edit file langsung diperlakukan sebagai tidak tepercaya sampai lolos validasi. Watcher menunggu
hingga churn temp-write/rename editor mereda, membaca file akhir, dan menolak
edit eksternal yang tidak valid dengan memulihkan konfigurasi terpercaya terakhir yang diketahui baik. Penulisan konfigurasi
milik OpenClaw menggunakan gerbang skema yang sama sebelum menulis; clobber destruktif seperti
menghapus `gateway.mode` atau mengecilkan file lebih dari setengah akan ditolak
dan disimpan sebagai `.rejected.*` untuk diperiksa.

Kegagalan validasi lokal plugin adalah pengecualian: jika semua masalah berada di bawah
`plugins.entries.<id>...`, reload mempertahankan konfigurasi saat ini dan melaporkan masalah plugin
alih-alih memulihkan `.last-good`.

Jika Anda melihat `Config auto-restored from last-known-good` atau
`config reload restored last-known-good config` di log, periksa file
`.clobbered.*` yang sesuai di samping `openclaw.json`, perbaiki payload yang ditolak, lalu jalankan
`openclaw config validate`. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config)
untuk checklist pemulihan.

### Mode reload

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan perubahan aman secara hot langsung. Otomatis restart untuk perubahan kritis. |
| **`hot`**              | Hanya menerapkan perubahan aman secara hot. Mencatat peringatan saat restart diperlukan — Anda yang menanganinya. |
| **`restart`**          | Merestart Gateway pada setiap perubahan konfigurasi, aman atau tidak.                   |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada restart manual berikutnya.        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Apa yang diterapkan secara hot vs apa yang memerlukan restart

Sebagian besar field diterapkan secara hot tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani secara otomatis.

| Kategori               | Fields                                                            | Perlu restart? |
| ---------------------- | ----------------------------------------------------------------- | -------------- |
| Channels               | `channels.*`, `web` (WhatsApp) — semua channel bawaan dan Plugin | Tidak          |
| Agen & model           | `agent`, `agents`, `models`, `routing`                            | Tidak          |
| Otomasi                | `hooks`, `cron`, `agent.heartbeat`                                | Tidak          |
| Sesi & pesan           | `session`, `messages`                                             | Tidak          |
| Tool & media           | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Tidak          |
| UI & lain-lain         | `ui`, `logging`, `identity`, `bindings`                           | Tidak          |
| Server Gateway         | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Ya**         |
| Infrastruktur          | `discovery`, `canvasHost`, `plugins`                              | **Ya**         |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian — mengubah keduanya **tidak** memicu restart.
</Note>

### Perencanaan reload

Saat Anda mengedit file sumber yang dirujuk melalui `$include`, OpenClaw merencanakan
reload dari tata letak yang ditulis di sumber, bukan dari tampilan in-memory yang telah diratakan.
Itu menjaga keputusan hot-reload (hot-apply vs restart) tetap dapat diprediksi bahkan ketika
satu bagian tingkat atas hidup di file include terpisah seperti
`plugins: { $include: "./plugins.json5" }`. Perencanaan reload gagal tertutup jika
tata letak sumber ambigu.

## RPC konfigurasi (pembaruan terprogram)

Untuk tooling yang menulis konfigurasi melalui API gateway, sebaiknya gunakan alur ini:

- `config.schema.lookup` untuk memeriksa satu subtree (node skema dangkal + ringkasan
  child)
- `config.get` untuk mengambil snapshot saat ini plus `hash`
- `config.patch` untuk pembaruan parsial (JSON merge patch: objek merge, `null`
  menghapus, array mengganti)
- `config.apply` hanya saat Anda memang berniat mengganti seluruh konfigurasi
- `update.run` untuk self-update eksplisit plus restart

Agen sebaiknya memperlakukan `config.schema.lookup` sebagai perhentian pertama untuk dokumentasi dan batasan
tingkat field yang tepat. Gunakan [Configuration reference](/id/gateway/configuration-reference)
saat mereka memerlukan peta konfigurasi yang lebih luas, default, atau tautan ke referensi
subsistem khusus.

<Note>
Penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi lajunya
hingga 3 permintaan per 60 detik per `deviceId+clientIp`. Permintaan restart
digabungkan lalu menerapkan cooldown 30 detik antar siklus restart.
</Note>

Contoh patch parsial:

```bash
openclaw gateway call config.get --params '{}'  # ambil payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Baik `config.apply` maupun `config.patch` menerima `raw`, `baseHash`, `sessionKey`,
`note`, dan `restartDelayMs`. `baseHash` wajib untuk kedua metode saat sebuah
konfigurasi sudah ada.

## Variabel lingkungan

OpenClaw membaca env var dari proses induk ditambah:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua file tersebut tidak menimpa env var yang sudah ada. Anda juga dapat menetapkan env var inline di konfigurasi:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Impor env shell (opsional)">
  Jika diaktifkan dan kunci yang diharapkan belum diatur, OpenClaw menjalankan login shell Anda dan hanya mengimpor kunci yang belum ada:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Padanan env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitusi env var dalam nilai konfigurasi">
  Rujuk env var di nilai string konfigurasi mana pun dengan `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Aturan:

- Hanya nama huruf besar yang cocok: `[A-Z_][A-Z0-9_]*`
- Env var yang hilang/kosong melempar error saat load time
- Escape dengan `$${VAR}` untuk output literal
- Berfungsi di dalam file `$include`
- Substitusi inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef (env, file, exec)">
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

Untuk referensi lengkap per field, lihat **[Configuration Reference](/id/gateway/configuration-reference)**.

---

_Terkait: [Configuration Examples](/id/gateway/configuration-examples) · [Configuration Reference](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Configuration reference](/id/gateway/configuration-reference)
- [Configuration examples](/id/gateway/configuration-examples)
- [Gateway runbook](/id/gateway)
