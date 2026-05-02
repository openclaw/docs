---
read_when:
    - Menyiapkan OpenClaw untuk pertama kalinya
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-05-02T09:20:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 mendukung komentar dan koma di akhir">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.
Path konfigurasi aktif harus berupa file biasa. Tata letak `openclaw.json`
berupa symlink tidak didukung untuk penulisan yang dimiliki OpenClaw; penulisan atomik dapat mengganti
path alih-alih mempertahankan symlink. Jika Anda menyimpan konfigurasi di luar
direktori state default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file sebenarnya.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan konfigurasi:

- Menghubungkan channel dan mengontrol siapa yang dapat mengirim pesan ke bot
- Menetapkan model, tool, sandboxing, atau otomasi (cron, hook)
- Menyesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap field yang tersedia.

Agent dan otomasi sebaiknya menggunakan `config.schema.lookup` untuk dokumentasi tingkat field yang
tepat sebelum mengedit konfigurasi. Gunakan halaman ini untuk panduan berorientasi tugas dan
[Referensi konfigurasi](/id/gateway/configuration-reference) untuk peta field dan default
yang lebih luas.

<Tip>
**Baru menggunakan konfigurasi?** Mulai dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Contoh Konfigurasi](/id/gateway/configuration-examples) untuk konfigurasi lengkap yang dapat disalin-tempel.
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
  <Tab title="Control UI">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Config**.
    Control UI merender formulir dari skema konfigurasi langsung, termasuk metadata dokumentasi
    `title` / `description` field serta skema plugin dan channel saat
    tersedia, dengan editor **Raw JSON** sebagai jalan keluar. Untuk UI
    pendalaman dan tooling lain, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema yang dibatasi path beserta ringkasan turunan langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Key yang tidak dikenal, tipe yang salah bentuk, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk dimulai**. Satu-satunya pengecualian tingkat root adalah `$schema` (string), sehingga editor dapat melampirkan metadata JSON Schema.
</Warning>

`openclaw config schema` mencetak JSON Schema kanonis yang digunakan oleh Control UI
dan validasi. `config.schema.lookup` mengambil satu node yang dibatasi path beserta
ringkasan turunan untuk tooling pendalaman. Metadata dokumentasi field `title`/`description`
diteruskan melalui objek bersarang, wildcard (`*`), item array (`[]`), dan cabang `anyOf`/
`oneOf`/`allOf`. Skema plugin runtime dan channel digabungkan saat
registri manifest dimuat.

Saat validasi gagal:

- Gateway tidak melakukan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah yang tepat
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

Gateway menyimpan salinan terpercaya terakhir yang diketahui baik setelah setiap startup berhasil.
Jika `openclaw.json` kemudian gagal validasi (atau menghapus `gateway.mode`, menyusut
tajam, atau memiliki baris log terselip di awal), OpenClaw mempertahankan file yang rusak
sebagai `.clobbered.*`, memulihkan salinan terakhir yang diketahui baik, dan mencatat alasan
pemulihan. Giliran agent berikutnya juga menerima peringatan system-event sehingga agent utama
tidak menulis ulang konfigurasi yang dipulihkan secara membabi buta. Promosi ke terakhir yang diketahui baik
dilewati saat kandidat berisi placeholder rahasia yang disamarkan seperti `***`.
Saat setiap masalah validasi dibatasi ke `plugins.entries.<id>...`, OpenClaw
tidak melakukan pemulihan seluruh file. Ia mempertahankan konfigurasi saat ini tetap aktif dan
menampilkan kegagalan lokal plugin sehingga ketidakcocokan skema plugin atau versi host
tidak dapat mengembalikan pengaturan pengguna yang tidak terkait.

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
    - Gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri allowlist tanpa menghapus model yang sudah ada. Penggantian biasa yang akan menghapus entri ditolak kecuali Anda meneruskan `--replace`.
    - Referensi model menggunakan format `provider/model` (mis. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol downscaling gambar transkrip/tool (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan token vision pada run yang banyak tangkapan layar.
    - Lihat [CLI Model](/id/concepts/models) untuk mengganti model di chat dan [Failover Model](/id/concepts/model-failover) untuk rotasi auth dan perilaku fallback.
    - Untuk provider kustom/self-hosted, lihat [Provider kustom](/id/gateway/config-tools#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Mengontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikontrol per channel melalui `dmPolicy`:

    - `"pairing"` (default): pengirim tidak dikenal mendapatkan kode pairing sekali pakai untuk disetujui
    - `"allowlist"`: hanya pengirim di `allowFrom` (atau penyimpanan allow yang sudah dipasangkan)
    - `"open"`: mengizinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: mengabaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus channel.

    Lihat [referensi lengkap](/id/gateway/config-channels#dm-and-group-access) untuk detail per channel.

  </Accordion>

  <Accordion title="Menyiapkan pembatasan mention chat grup">
    Pesan grup defaultnya **memerlukan mention**. Konfigurasikan pola pemicu per agent, dan pertahankan balasan ruang yang terlihat pada path message-tool default kecuali Anda sengaja menginginkan balasan final otomatis lama:

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
    - **Balasan terlihat**: `messages.visibleReplies` dapat mewajibkan pengiriman message-tool secara global; `messages.groupChat.visibleReplies` menimpanya untuk grup/channel.
    - Lihat [referensi lengkap](/id/gateway/config-channels#group-chat-mention-gating) untuk mode balasan terlihat, override per channel, dan mode self-chat.

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
    - Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan
      [Referensi Konfigurasi](/id/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Menyesuaikan pemantauan kesehatan channel gateway">
    Kontrol seberapa agresif gateway me-restart channel yang tampak stale:

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
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan restart otomatis untuk satu channel atau akun tanpa menonaktifkan monitor global.
    - Lihat [Health Checks](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua field.

  </Accordion>

  <Accordion title="Menyesuaikan timeout handshake WebSocket gateway">
    Berikan klien lokal lebih banyak waktu untuk menyelesaikan handshake WebSocket pra-auth pada
    host yang terbebani atau berdaya rendah:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Default adalah `15000` milidetik.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tetap diprioritaskan untuk override layanan atau shell sekali pakai.
    - Lebih baik perbaiki stall startup/event-loop terlebih dahulu; knob ini untuk host yang sehat tetapi lambat saat warmup.

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
    - `threadBindings`: default global untuk perutean sesi berbasis utas (Discord mendukung `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age`).
    - Lihat [Manajemen Sesi](/id/concepts/session) untuk cakupan, tautan identitas, dan kebijakan kirim.
    - Lihat [referensi lengkap](/id/gateway/config-agents#session) untuk semua bidang.

  </Accordion>

  <Accordion title="Aktifkan isolasi sandbox">
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

    Build image terlebih dahulu — dari checkout sumber jalankan `scripts/sandbox-setup.sh`, atau dari instalasi npm lihat perintah inline `docker build` di [Isolasi sandbox § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup).

    Lihat [Isolasi sandbox](/id/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/id/gateway/config-agents#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Aktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay dikonfigurasi di `openclaw.json`.

    Tetapkan ini di konfigurasi Gateway:

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

    - Memungkinkan gateway mengirim `push.test`, dorongan bangun, dan bangun sambung ulang melalui relay eksternal.
    - Menggunakan izin kirim bercakupan pendaftaran yang diteruskan oleh aplikasi iOS yang dipasangkan. Gateway tidak memerlukan token relay seluruh deployment.
    - Mengikat setiap pendaftaran berbasis relay ke identitas gateway yang dipasangkan dengan aplikasi iOS, sehingga gateway lain tidak dapat memakai ulang pendaftaran yang tersimpan.
    - Mempertahankan build iOS lokal/manual pada APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build terdistribusi resmi yang mendaftar melalui relay.
    - Harus cocok dengan URL dasar relay yang disematkan ke build iOS resmi/TestFlight, sehingga lalu lintas pendaftaran dan kirim mencapai deployment relay yang sama.

    Alur menyeluruh:

    1. Instal build iOS resmi/TestFlight yang dikompilasi dengan URL dasar relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway.
    3. Pasangkan aplikasi iOS ke gateway dan biarkan sesi node serta operator tersambung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus receipt aplikasi, lalu menerbitkan payload `push.apns.register` berbasis relay ke gateway yang dipasangkan.
    5. Gateway menyimpan handle relay dan izin kirim, lalu menggunakannya untuk `push.test`, dorongan bangun, dan bangun sambung ulang.

    Catatan operasional:

    - Jika Anda mengalihkan aplikasi iOS ke gateway lain, sambungkan ulang aplikasi agar dapat menerbitkan pendaftaran relay baru yang terikat ke gateway tersebut.
    - Jika Anda mengirim build iOS baru yang menunjuk ke deployment relay lain, aplikasi menyegarkan pendaftaran relay yang di-cache alih-alih memakai ulang asal relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` masih berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi jalan keluar pengembangan khusus loopback; jangan simpan URL relay HTTP secara permanen di konfigurasi.

    Lihat [Aplikasi iOS](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur menyeluruh dan [Alur autentikasi dan kepercayaan](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

  </Accordion>

  <Accordion title="Siapkan Heartbeat (check-in berkala)">
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

  <Accordion title="Konfigurasikan pekerjaan Cron">
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

    - `sessionRetention`: pangkas sesi run terisolasi yang selesai dari `sessions.json` (default `24h`; tetapkan `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan baris yang dipertahankan.
    - Lihat [Pekerjaan Cron](/id/automation/cron-jobs) untuk gambaran umum fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Siapkan webhooks (hook)">
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
    - Perlakukan semua konten payload hook/webhook sebagai input yang tidak tepercaya.
    - Gunakan `hooks.token` khusus; jangan pakai ulang token Gateway bersama.
    - Autentikasi hook hanya melalui header (`Authorization: Bearer ...` atau `x-openclaw-token`); token string kueri ditolak.
    - `hooks.path` tidak boleh berupa `/`; pertahankan ingress webhook pada subpath khusus seperti `/hooks`.
    - Biarkan flag bypass konten tidak aman nonaktif (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali untuk debugging dengan cakupan ketat.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agen berbasis hook, pilih tingkat model modern yang kuat dan kebijakan alat yang ketat (misalnya hanya pesan plus isolasi sandbox jika memungkinkan).

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

  <Accordion title="Pisahkan konfigurasi ke beberapa file ($include)">
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
    - **Array file**: di-deep-merge sesuai urutan (yang belakangan menang)
    - **Kunci saudara**: digabung setelah include (menimpa nilai yang di-include)
    - **Include bertingkat**: didukung hingga 10 tingkat kedalaman
    - **Path relatif**: diselesaikan relatif terhadap file yang meng-include
    - **Penulisan milik OpenClaw**: ketika penulisan hanya mengubah satu bagian tingkat atas
      yang didukung oleh include file tunggal seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui file yang di-include itu dan membiarkan `openclaw.json` tetap utuh
    - **Write-through tidak didukung**: include root, array include, dan include
      dengan override kunci saudara gagal secara tertutup untuk penulisan milik OpenClaw alih-alih
      meratakan konfigurasi
    - **Pembatasan**: path `$include` harus terselesaikan di bawah direktori yang berisi
      `openclaw.json`. Untuk berbagi pohon lintas mesin atau pengguna, tetapkan
      `OPENCLAW_INCLUDE_ROOTS` ke daftar path (`:` pada POSIX, `;` pada Windows) berisi
      direktori tambahan yang boleh dirujuk oleh include. Symlink diselesaikan
      dan diperiksa ulang, sehingga path yang secara leksikal berada di direktori konfigurasi tetapi
      target sebenarnya keluar dari setiap root yang diizinkan tetap ditolak.
    - **Penanganan galat**: galat yang jelas untuk file yang hilang, galat parse, dan include melingkar

  </Accordion>
</AccordionGroup>

## Hot reload konfigurasi

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis — restart manual tidak diperlukan untuk sebagian besar pengaturan.

Edit file langsung diperlakukan sebagai tidak tepercaya sampai tervalidasi. Watcher menunggu
gejolak tulis-sementara/ganti-nama editor mereda, membaca file final, dan menolak
edit eksternal yang tidak valid dengan memulihkan konfigurasi baik-terakhir-diketahui. Penulisan
konfigurasi milik OpenClaw menggunakan gerbang skema yang sama sebelum menulis; clobber destruktif
seperti menghapus `gateway.mode` atau mengecilkan file lebih dari setengahnya ditolak
dan disimpan sebagai `.rejected.*` untuk inspeksi.

Kegagalan validasi lokal Plugin adalah pengecualian: jika semua masalah berada di bawah
`plugins.entries.<id>...`, reload mempertahankan konfigurasi saat ini dan melaporkan masalah plugin
alih-alih memulihkan `.last-good`.

Jika Anda melihat `Config auto-restored from last-known-good` atau
`config reload restored last-known-good config` di log, periksa file
`.clobbered.*` yang sesuai di sebelah `openclaw.json`, perbaiki payload yang ditolak, lalu jalankan
`openclaw config validate`. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config)
untuk checklist pemulihan.

### Mode reload

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan perubahan aman secara hot seketika. Otomatis restart untuk perubahan kritis. |
| **`hot`**              | Hanya menerapkan perubahan aman secara hot. Mencatat peringatan saat restart diperlukan — Anda yang menanganinya. |
| **`restart`**          | Me-restart Gateway pada perubahan konfigurasi apa pun, aman atau tidak.                 |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada restart manual berikutnya.        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Apa yang diterapkan secara hot vs apa yang memerlukan restart

Sebagian besar bidang diterapkan secara hot tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani secara otomatis.

| Kategori            | Bidang                                                            | Perlu mulai ulang? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Saluran             | `channels.*`, `web` (WhatsApp) — semua saluran bawaan dan Plugin | Tidak           |
| Agen & model        | `agent`, `agents`, `models`, `routing`                            | Tidak           |
| Otomasi             | `hooks`, `cron`, `agent.heartbeat`                                | Tidak           |
| Sesi & pesan        | `session`, `messages`                                             | Tidak           |
| Alat & media        | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Tidak           |
| UI & lain-lain      | `ui`, `logging`, `identity`, `bindings`                           | Tidak           |
| Server Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Ya**          |
| Infrastruktur       | `discovery`, `canvasHost`, `plugins`                              | **Ya**          |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian — mengubahnya **tidak** memicu mulai ulang.
</Note>

### Perencanaan muat ulang

Saat Anda mengedit file sumber yang dirujuk melalui `$include`, OpenClaw merencanakan
muat ulang dari tata letak yang dibuat di sumber, bukan tampilan dalam memori yang diratakan.
Ini menjaga keputusan hot-reload (terapkan langsung vs mulai ulang) tetap dapat diprediksi bahkan ketika
satu bagian tingkat atas berada dalam file yang disertakan sendiri seperti
`plugins: { $include: "./plugins.json5" }`. Perencanaan muat ulang gagal secara tertutup jika
tata letak sumber ambigu.

## RPC konfigurasi (pembaruan terprogram)

Untuk perkakas yang menulis konfigurasi melalui API Gateway, gunakan alur ini:

- `config.schema.lookup` untuk memeriksa satu subtree (node skema dangkal + ringkasan
  anak)
- `config.get` untuk mengambil snapshot saat ini beserta `hash`
- `config.patch` untuk pembaruan parsial (JSON merge patch: objek digabung, `null`
  menghapus, array diganti)
- `config.apply` hanya saat Anda ingin mengganti seluruh konfigurasi
- `update.run` untuk pembaruan mandiri eksplisit beserta mulai ulang
- `update.status` untuk memeriksa sentinel mulai ulang pembaruan terbaru dan memverifikasi versi yang berjalan setelah mulai ulang

Agen harus memperlakukan `config.schema.lookup` sebagai tempat pertama untuk dokumentasi
dan batasan tingkat bidang yang tepat. Gunakan [Referensi konfigurasi](/id/gateway/configuration-reference)
saat mereka membutuhkan peta konfigurasi yang lebih luas, default, atau tautan ke referensi
subsistem khusus.

<Note>
Penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi lajunya
menjadi 3 permintaan per 60 detik per `deviceId+clientIp`. Permintaan mulai ulang
digabung lalu menerapkan cooldown 30 detik antar siklus mulai ulang.
`update.status` bersifat hanya-baca tetapi berada dalam cakupan admin karena sentinel mulai ulang dapat
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

OpenClaw membaca env vars dari proses induk ditambah:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua file tidak menimpa env vars yang sudah ada. Anda juga dapat menetapkan env vars inline dalam konfigurasi:

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
- Vars yang hilang/kosong memunculkan kesalahan saat waktu muat
- Escape dengan `$${VAR}` untuk output literal
- Berfungsi di dalam file `$include`
- Substitusi inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  Untuk bidang yang mendukung objek SecretRef, Anda dapat menggunakan:

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

Untuk referensi lengkap bidang demi bidang, lihat **[Referensi Konfigurasi](/id/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Referensi Konfigurasi](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
- [Runbook Gateway](/id/gateway)
