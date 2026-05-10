---
read_when:
    - Menyiapkan OpenClaw untuk pertama kalinya
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-05-10T19:34:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023ce17d31ed16e061516a2026ac6c31fd8716548e230d27a7965b9a2d8c59c1
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw membaca config <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.
Path config aktif harus berupa file biasa. Tata letak `openclaw.json`
berupa symlink tidak didukung untuk penulisan milik OpenClaw; penulisan atomik dapat mengganti
path tersebut alih-alih mempertahankan symlink. Jika Anda menyimpan config di luar
direktori state default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file sebenarnya.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan config:

- Menghubungkan channel dan mengontrol siapa yang dapat mengirim pesan ke bot
- Menetapkan model, tool, sandboxing, atau otomasi (cron, hook)
- Menyesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap field yang tersedia.

Agent dan otomasi harus menggunakan `config.schema.lookup` untuk dokumentasi tingkat field yang tepat
sebelum mengedit config. Gunakan halaman ini untuk panduan berorientasi tugas dan
[Referensi konfigurasi](/id/gateway/configuration-reference) untuk peta field dan default
yang lebih luas.

<Tip>
**Baru mengenal konfigurasi?** Mulai dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Contoh Konfigurasi](/id/gateway/configuration-examples) untuk config lengkap yang dapat disalin-tempel.
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
  <Tab title="UI Kontrol">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Config**.
    UI Kontrol merender formulir dari skema config live, termasuk metadata dokumentasi field
    `title` / `description` beserta skema plugin dan channel jika
    tersedia, dengan editor **Raw JSON** sebagai jalan keluar. Untuk UI
    telusur detail dan tooling lainnya, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema dengan cakupan path beserta ringkasan child langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file tersebut dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Key tidak dikenal, tipe yang salah bentuk, atau nilai tidak valid menyebabkan Gateway **menolak untuk memulai**. Satu-satunya pengecualian tingkat root adalah `$schema` (string), agar editor dapat melampirkan metadata JSON Schema.
</Warning>

`openclaw config schema` mencetak JSON Schema kanonis yang digunakan oleh UI Kontrol
dan validasi. `config.schema.lookup` mengambil satu node dengan cakupan path beserta
ringkasan child untuk tooling telusur detail. Metadata dokumentasi field `title`/`description`
diteruskan melalui objek bertingkat, wildcard (`*`), item array (`[]`), dan cabang `anyOf`/
`oneOf`/`allOf`. Skema plugin dan channel runtime digabungkan saat
registri manifest dimuat.

Saat validasi gagal:

- Gateway tidak melakukan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah yang tepat
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

Gateway menyimpan salinan tepercaya terakhir yang diketahui baik setelah setiap startup berhasil,
tetapi startup dan hot reload tidak memulihkannya secara otomatis. Jika `openclaw.json`
gagal validasi (termasuk validasi lokal plugin), startup Gateway gagal atau
reload dilewati dan runtime saat ini mempertahankan config terakhir yang diterima.
Jalankan `openclaw doctor --fix` (atau `--yes`) untuk memperbaiki config yang diberi prefiks/tertindih atau
memulihkan salinan terakhir yang diketahui baik. Promosi ke terakhir yang diketahui baik dilewati saat
kandidat berisi placeholder secret yang disensor seperti `***`.

## Tugas umum

<AccordionGroup>
  <Accordion title="Menyiapkan channel (WhatsApp, Telegram, Discord, dll.)">
    Setiap channel memiliki bagian config sendiri di bawah `channels.<provider>`. Lihat halaman channel khusus untuk langkah penyiapan:

    - [WhatsApp](/id/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/id/channels/telegram) - `channels.telegram`
    - [Discord](/id/channels/discord) - `channels.discord`
    - [Feishu](/id/channels/feishu) - `channels.feishu`
    - [Google Chat](/id/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/id/channels/msteams) - `channels.msteams`
    - [Slack](/id/channels/slack) - `channels.slack`
    - [Signal](/id/channels/signal) - `channels.signal`
    - [iMessage](/id/channels/imessage) - `channels.imessage`
    - [Mattermost](/id/channels/mattermost) - `channels.mattermost`

    Semua channel memiliki pola kebijakan DM yang sama:

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

    - `agents.defaults.models` mendefinisikan katalog model dan bertindak sebagai allowlist untuk `/model`; entri `provider/*` memfilter `/model`, `/models`, dan pemilih model ke provider yang dipilih sambil tetap menggunakan penemuan model dinamis.
    - Gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri allowlist tanpa menghapus model yang ada. Penggantian biasa yang akan menghapus entri ditolak kecuali Anda meneruskan `--replace`.
    - Referensi model menggunakan format `provider/model` (mis. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol downscaling gambar transcript/tool (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan vision-token pada proses yang banyak memakai screenshot.
    - Lihat [CLI Model](/id/concepts/models) untuk mengganti model dalam chat dan [Failover Model](/id/concepts/model-failover) untuk rotasi auth dan perilaku fallback.
    - Untuk provider custom/self-hosted, lihat [Provider custom](/id/gateway/config-tools#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Mengontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikontrol per channel melalui `dmPolicy`:

    - `"pairing"` (default): pengirim tidak dikenal mendapatkan kode pairing sekali pakai untuk disetujui
    - `"allowlist"`: hanya pengirim di `allowFrom` (atau penyimpanan izin yang sudah dipairing)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus channel.

    Lihat [referensi lengkap](/id/gateway/config-channels#dm-and-group-access) untuk detail per channel.

  </Accordion>

  <Accordion title="Menyiapkan gating mention chat grup">
    Pesan grup secara default **memerlukan mention**. Konfigurasikan pola pemicu per agent, dan pertahankan balasan room yang terlihat pada path tool pesan default kecuali Anda sengaja menginginkan balasan final otomatis legacy:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
        },
      },
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

    - **Mention metadata**: @-mention native (tap-to-mention WhatsApp, @bot Telegram, dll.)
    - **Pola teks**: pola regex aman di `mentionPatterns`
    - **Balasan terlihat**: `messages.visibleReplies` dapat mewajibkan pengiriman tool pesan secara global; `messages.groupChat.visibleReplies` menimpanya untuk grup/channel.
    - Lihat [referensi lengkap](/id/gateway/config-channels#group-chat-mention-gating) untuk mode balasan terlihat, override per channel, dan mode chat mandiri.

  </Accordion>

  <Accordion title="Membatasi skills per agent">
    Gunakan `agents.defaults.skills` untuk baseline bersama, lalu override agent
    tertentu dengan `agents.list[].skills`:

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

    - Hilangkan `agents.defaults.skills` untuk skills yang tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi default.
    - Tetapkan `agents.list[].skills: []` untuk tanpa skills.
    - Lihat [Skills](/id/tools/skills), [Config Skills](/id/tools/skills-config), dan
      [Referensi Konfigurasi](/id/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Menyesuaikan pemantauan kesehatan channel gateway">
    Kontrol seberapa agresif gateway memulai ulang channel yang tampak stale:

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
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan auto-restart untuk satu channel atau akun tanpa menonaktifkan monitor global.
    - Lihat [Pemeriksaan Kesehatan](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua field.

  </Accordion>

  <Accordion title="Menyesuaikan timeout handshake WebSocket gateway">
    Beri klien lokal lebih banyak waktu untuk menyelesaikan handshake WebSocket pra-auth pada
    host yang sibuk atau bertenaga rendah:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Default adalah `15000` milidetik.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tetap memiliki prioritas untuk override layanan atau shell sekali pakai.
    - Utamakan memperbaiki stall startup/event-loop terlebih dahulu; knob ini untuk host yang sehat tetapi lambat saat warmup.

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
    - `threadBindings`: default global untuk perutean sesi yang terikat utas (Discord mendukung `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age`).
    - Lihat [Manajemen Sesi](/id/concepts/session) untuk cakupan, tautan identitas, dan kebijakan pengiriman.
    - Lihat [referensi lengkap](/id/gateway/config-agents#session) untuk semua bidang.

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

    Bangun image terlebih dahulu - dari checkout sumber jalankan `scripts/sandbox-setup.sh`, atau dari instalasi npm lihat perintah inline `docker build` di [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup).

    Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/id/gateway/config-agents#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Aktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay dikonfigurasi di `openclaw.json`.

    Tetapkan ini dalam konfigurasi gateway:

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

    - Memungkinkan gateway mengirim `push.test`, dorongan bangun, dan bangun ulang koneksi melalui relay eksternal.
    - Menggunakan izin pengiriman bercakupan pendaftaran yang diteruskan oleh aplikasi iOS yang dipasangkan. Gateway tidak memerlukan token relay untuk seluruh deployment.
    - Mengikat setiap pendaftaran berbasis relay ke identitas gateway yang dipasangkan dengan aplikasi iOS, sehingga gateway lain tidak dapat menggunakan kembali pendaftaran yang tersimpan.
    - Mempertahankan build iOS lokal/manual pada APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build distribusi resmi yang mendaftar melalui relay.
    - Harus cocok dengan URL dasar relay yang dibenamkan dalam build iOS resmi/TestFlight, sehingga lalu lintas pendaftaran dan pengiriman mencapai deployment relay yang sama.

    Alur menyeluruh:

    1. Instal build iOS resmi/TestFlight yang dikompilasi dengan URL dasar relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway.
    3. Pasangkan aplikasi iOS ke gateway dan biarkan sesi node serta operator tersambung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus tanda terima aplikasi, lalu menerbitkan payload `push.apns.register` berbasis relay ke gateway yang dipasangkan.
    5. Gateway menyimpan handle relay dan izin pengiriman, lalu menggunakannya untuk `push.test`, dorongan bangun, dan bangun ulang koneksi.

    Catatan operasional:

    - Jika Anda mengalihkan aplikasi iOS ke gateway berbeda, sambungkan ulang aplikasi agar dapat menerbitkan pendaftaran relay baru yang terikat ke gateway tersebut.
    - Jika Anda mengirim build iOS baru yang mengarah ke deployment relay berbeda, aplikasi menyegarkan pendaftaran relay yang di-cache alih-alih menggunakan ulang asal relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` masih berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi jalan keluar pengembangan khusus loopback; jangan simpan URL relay HTTP dalam konfigurasi.

    Lihat [Aplikasi iOS](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur menyeluruh dan [Autentikasi dan alur kepercayaan](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

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

    - `every`: string durasi (`30m`, `2h`). Tetapkan `0m` untuk menonaktifkan.
    - `target`: `last` | `none` | `<channel-id>` (misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`)
    - `directPolicy`: `allow` (default) atau `block` untuk target heartbeat bergaya DM
    - Lihat [Heartbeat](/id/gateway/heartbeat) untuk panduan lengkap.

  </Accordion>

  <Accordion title="Konfigurasikan tugas cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: pangkas sesi eksekusi terisolasi yang selesai dari `sessions.json` (default `24h`; tetapkan `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan baris yang dipertahankan.
    - Lihat [Tugas Cron](/id/automation/cron-jobs) untuk ringkasan fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Siapkan webhook (hook)">
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
    - Autentikasi hook hanya melalui header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query string ditolak.
    - `hooks.path` tidak boleh berupa `/`; pertahankan ingress webhook pada subpath khusus seperti `/hooks`.
    - Biarkan flag bypass konten tidak aman tetap nonaktif (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali saat melakukan debugging dengan cakupan ketat.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agen yang digerakkan hook, utamakan tier model modern yang kuat dan kebijakan alat yang ketat (misalnya hanya perpesanan plus sandboxing jika memungkinkan).

    Lihat [referensi lengkap](/id/gateway/configuration-reference#hooks) untuk semua opsi pemetaan dan integrasi Gmail.

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

    Lihat [Multi-Agen](/id/concepts/multi-agent) dan [referensi lengkap](/id/gateway/config-agents#multi-agent-routing) untuk aturan binding dan profil akses per agen.

  </Accordion>

  <Accordion title="Pisahkan konfigurasi menjadi beberapa file ($include)">
    Gunakan `$include` untuk mengatur konfigurasi besar:

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

    - **File tunggal**: menggantikan objek yang memuatnya
    - **Array file**: digabung secara mendalam sesuai urutan (yang belakangan menang)
    - **Kunci saudara**: digabung setelah include (menimpa nilai yang di-include)
    - **Include bertingkat**: didukung hingga kedalaman 10 level
    - **Path relatif**: di-resolve relatif terhadap file yang meng-include
    - **Penulisan milik OpenClaw**: saat penulisan hanya mengubah satu bagian level atas
      yang didukung oleh include file tunggal seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui file yang di-include tersebut dan membiarkan `openclaw.json` tetap utuh
    - **Write-through yang tidak didukung**: include root, array include, dan include
      dengan override saudara gagal tertutup untuk penulisan milik OpenClaw alih-alih
      meratakan konfigurasi
    - **Pengurungan**: path `$include` harus di-resolve di bawah direktori yang memuat
      `openclaw.json`. Untuk berbagi tree antar mesin atau pengguna, tetapkan
      `OPENCLAW_INCLUDE_ROOTS` ke daftar path (`:` di POSIX, `;` di Windows) berisi
      direktori tambahan yang dapat dirujuk oleh include. Symlink di-resolve
      dan diperiksa ulang, sehingga path yang secara leksikal berada di dir konfigurasi tetapi
      target aslinya keluar dari setiap root yang diizinkan tetap ditolak.
    - **Penanganan galat**: galat yang jelas untuk file yang hilang, galat parse, dan include melingkar

  </Accordion>
</AccordionGroup>

## Hot reload konfigurasi

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis - restart manual tidak diperlukan untuk sebagian besar pengaturan.

Edit file langsung diperlakukan sebagai tidak tepercaya sampai lolos validasi. Watcher menunggu
pergantian tulis-sementara/rename dari editor reda, membaca file final, dan menolak
edit eksternal yang tidak valid tanpa menulis ulang `openclaw.json`. Penulisan konfigurasi
milik OpenClaw menggunakan gerbang skema yang sama sebelum menulis; clobber destruktif seperti
menghapus `gateway.mode` atau mengecilkan file lebih dari setengahnya ditolak dan
disimpan sebagai `.rejected.*` untuk inspeksi.

Jika Anda melihat `config reload skipped (invalid config)` atau startup melaporkan `Invalid
config`, periksa konfigurasi, jalankan `openclaw config validate`, lalu jalankan `openclaw
doctor --fix` untuk perbaikan. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config)
untuk checklist.

### Mode reload

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan perubahan aman secara hot dengan segera. Otomatis restart untuk perubahan kritis. |
| **`hot`**              | Hanya menerapkan perubahan aman secara hot. Mencatat peringatan saat restart diperlukan - Anda yang menanganinya. |
| **`restart`**          | Me-restart Gateway pada perubahan konfigurasi apa pun, aman atau tidak.                 |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada restart manual berikutnya.        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Yang diterapkan secara hot vs yang memerlukan restart

Sebagian besar bidang diterapkan secara hot tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani secara otomatis.

| Kategori            | Bidang                                                            | Perlu restart? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channel             | `channels.*`, `web` (WhatsApp) - semua channel bawaan dan plugin  | Tidak           |
| Agen & model        | `agent`, `agents`, `models`, `routing`                            | Tidak           |
| Otomasi             | `hooks`, `cron`, `agent.heartbeat`                                | Tidak           |
| Sesi & pesan        | `session`, `messages`                                             | Tidak           |
| Alat & media        | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Tidak           |
| UI & lain-lain      | `ui`, `logging`, `identity`, `bindings`                           | Tidak           |
| Server Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Ya**          |
| Infrastruktur       | `discovery`, `plugins`                                            | **Ya**          |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian - mengubahnya **tidak** memicu restart.
</Note>

### Perencanaan reload

Saat Anda mengedit file sumber yang dirujuk melalui `$include`, OpenClaw merencanakan
reload dari tata letak yang ditulis di sumber, bukan tampilan memori yang sudah diratakan.
Hal ini menjaga keputusan hot-reload (hot-apply vs restart) tetap dapat diprediksi meskipun
satu bagian tingkat atas berada di file terinclude miliknya sendiri seperti
`plugins: { $include: "./plugins.json5" }`. Perencanaan reload gagal secara tertutup jika
tata letak sumber ambigu.

## Config RPC (pembaruan programatis)

Untuk tooling yang menulis konfigurasi melalui API Gateway, gunakan alur ini:

- `config.schema.lookup` untuk memeriksa satu subtree (node skema dangkal + ringkasan
  anak)
- `config.get` untuk mengambil snapshot saat ini plus `hash`
- `config.patch` untuk pembaruan parsial (JSON merge patch: objek digabung, `null`
  menghapus, array mengganti)
- `config.apply` hanya saat Anda bermaksud mengganti seluruh konfigurasi
- `update.run` untuk self-update eksplisit plus restart; sertakan `continuationMessage` saat sesi pasca-restart harus menjalankan satu giliran lanjutan
- `update.status` untuk memeriksa sentinel restart pembaruan terbaru dan memverifikasi versi yang berjalan setelah restart

Agent harus memperlakukan `config.schema.lookup` sebagai tempat pertama untuk dokumentasi
dan batasan tingkat-field yang persis. Gunakan [Referensi konfigurasi](/id/gateway/configuration-reference)
saat mereka membutuhkan peta konfigurasi yang lebih luas, default, atau tautan ke referensi
subsistem khusus.

<Note>
Penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi
lajunya menjadi 3 permintaan per 60 detik per `deviceId+clientIp`. Permintaan
restart digabungkan, lalu memberlakukan cooldown 30 detik antar siklus restart.
`update.status` bersifat hanya-baca tetapi berada dalam cakupan admin karena sentinel restart dapat
menyertakan ringkasan langkah pembaruan dan ekor output perintah.
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
`note`, dan `restartDelayMs`. `baseHash` wajib untuk kedua metode saat
konfigurasi sudah ada.

## Variabel lingkungan

OpenClaw membaca env vars dari proses induk plus:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Tidak satu pun file menimpa env vars yang sudah ada. Anda juga dapat mengatur env vars inline dalam konfigurasi:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Impor env shell (opsional)">
  Jika diaktifkan dan kunci yang diharapkan belum diatur, OpenClaw menjalankan shell login Anda dan hanya mengimpor kunci yang hilang:

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
  Rujuk env vars dalam nilai string konfigurasi apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Aturan:

- Hanya nama huruf besar yang cocok: `[A-Z_][A-Z0-9_]*`
- Var yang hilang/kosong menimbulkan error saat waktu muat
- Escape dengan `$${VAR}` untuk output literal
- Berfungsi di dalam file `$include`
- Substitusi inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referensi rahasia (env, file, exec)">
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

Detail SecretRef (termasuk `secrets.providers` untuk `env`/`file`/`exec`) ada di [Manajemen Rahasia](/id/gateway/secrets).
Jalur kredensial yang didukung tercantum di [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Accordion>

Lihat [Lingkungan](/id/help/environment) untuk prioritas dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap field demi field, lihat **[Referensi Konfigurasi](/id/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Referensi Konfigurasi](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
- [Runbook Gateway](/id/gateway)
