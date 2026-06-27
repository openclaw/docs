---
read_when:
    - Menyiapkan OpenClaw untuk pertama kalinya
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Gambaran umum konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-06-27T17:28:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.
Path konfigurasi aktif harus berupa file reguler. Tata letak `openclaw.json`
yang berupa symlink tidak didukung untuk penulisan yang dimiliki OpenClaw; penulisan atomik dapat mengganti
path tersebut alih-alih mempertahankan symlink. Jika Anda menyimpan konfigurasi di luar
direktori state default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file yang sebenarnya.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan konfigurasi:

- Menghubungkan channel dan mengontrol siapa yang dapat mengirim pesan ke bot
- Mengatur model, alat, sandboxing, atau otomatisasi (cron, hook)
- Menyetel sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap field yang tersedia.

Agen dan otomatisasi sebaiknya menggunakan `config.schema.lookup` untuk dokumentasi
tingkat field yang tepat sebelum mengedit konfigurasi. Gunakan halaman ini untuk panduan berbasis tugas dan
[Referensi konfigurasi](/id/gateway/configuration-reference) untuk peta field dan default
yang lebih luas.

<Tip>
**Baru mengenal konfigurasi?** Mulai dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Contoh Konfigurasi](/id/gateway/configuration-examples) untuk konfigurasi lengkap yang siap disalin-tempel.
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
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Config**.
    Control UI merender formulir dari skema konfigurasi langsung, termasuk metadata dokumentasi
    `title` / `description` field serta skema plugin dan channel jika
    tersedia, dengan editor **Raw JSON** sebagai jalan keluar. Untuk UI
    penelusuran mendalam dan alat lainnya, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema berbasis path beserta ringkasan child langsungnya.
  </Tab>
  <Tab title="Direct edit">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file tersebut dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Key yang tidak dikenal, tipe yang salah bentuk, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk memulai**. Satu-satunya pengecualian tingkat root adalah `$schema` (string), sehingga editor dapat melampirkan metadata JSON Schema.
</Warning>

`openclaw config schema` mencetak JSON Schema kanonis yang digunakan oleh Control UI
dan validasi. `config.schema.lookup` mengambil satu node berbasis path beserta
ringkasan child untuk alat penelusuran mendalam. Metadata dokumentasi `title`/`description` field
diteruskan melalui objek bertingkat, wildcard (`*`), item array (`[]`), dan cabang `anyOf`/
`oneOf`/`allOf`. Skema plugin dan channel runtime digabungkan saat
registry manifes dimuat.

Saat validasi gagal:

- Gateway tidak melakukan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah persisnya
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

Gateway menyimpan salinan last-known-good tepercaya setelah setiap startup yang berhasil,
tetapi startup dan hot reload tidak memulihkannya secara otomatis. Jika `openclaw.json`
gagal validasi (termasuk validasi lokal plugin), startup Gateway gagal atau
reload dilewati dan runtime saat ini mempertahankan konfigurasi terakhir yang diterima.
Jalankan `openclaw doctor --fix` (atau `--yes`) untuk memperbaiki konfigurasi yang diberi prefiks/tertindih atau
memulihkan salinan last-known-good. Promosi ke last-known-good dilewati saat sebuah
kandidat berisi placeholder secret yang disamarkan seperti `***`.

## Tugas umum

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Setiap channel memiliki bagian konfigurasinya sendiri di bawah `channels.<provider>`. Lihat halaman channel khusus untuk langkah penyiapan:

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

  <Accordion title="Choose and configure models">
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

    - `agents.defaults.models` mendefinisikan katalog model dan bertindak sebagai allowlist untuk `/model`; entri `provider/*` memfilter `/model`, `/models`, dan pemilih model ke provider yang dipilih sambil tetap menggunakan penemuan model dinamis.
    - Gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri allowlist tanpa menghapus model yang sudah ada. Penggantian biasa yang akan menghapus entri ditolak kecuali Anda meneruskan `--replace`.
    - Referensi model menggunakan format `provider/model` (misalnya `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol downscaling gambar transkrip/alat (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan token visi pada run yang banyak berisi screenshot.
    - Lihat [CLI Model](/id/concepts/models) untuk mengganti model di chat dan [Failover Model](/id/concepts/model-failover) untuk rotasi auth dan perilaku fallback.
    - Untuk provider kustom/self-hosted, lihat [Provider kustom](/id/gateway/config-tools#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Akses DM dikontrol per channel melalui `dmPolicy`:

    - `"pairing"` (default): pengirim tidak dikenal mendapat kode pairing sekali pakai untuk disetujui
    - `"allowlist"`: hanya pengirim di `allowFrom` (atau penyimpanan allow hasil pairing)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus channel.

    Lihat [referensi lengkap](/id/gateway/config-channels#dm-and-group-access) untuk detail per channel.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Pesan grup secara default **memerlukan mention**. Konfigurasikan pola pemicu per agen. Balasan grup/channel normal dikirim otomatis; ikut serta ke jalur message-tool untuk ruang bersama ketika agen harus memutuskan kapan berbicara:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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

    - **Mention metadata**: @-mention native (WhatsApp tap-to-mention, Telegram @bot, dll.)
    - **Pola teks**: pola regex aman di `mentionPatterns`
    - **Balasan terlihat**: `messages.visibleReplies` dapat mewajibkan pengiriman message-tool secara global; `messages.groupChat.visibleReplies` menimpanya untuk grup/channel.
    - Lihat [referensi lengkap](/id/gateway/config-channels#group-chat-mention-gating) untuk mode balasan terlihat, override per channel, dan mode self-chat.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Gunakan `agents.defaults.skills` untuk baseline bersama, lalu override agen
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
    - Atur `agents.list[].skills: []` agar tidak ada skills.
    - Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan
      [Referensi Konfigurasi](/id/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
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

    - Atur `gateway.channelHealthCheckMinutes: 0` untuk menonaktifkan restart health-monitor secara global.
    - `channelStaleEventThresholdMinutes` sebaiknya lebih besar dari atau sama dengan interval pemeriksaan.
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan restart otomatis bagi satu channel atau akun tanpa menonaktifkan monitor global.
    - Lihat [Health Checks](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua field.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Beri klien lokal lebih banyak waktu untuk menyelesaikan handshake WebSocket pra-auth pada
    host yang sibuk atau berdaya rendah:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Default adalah `15000` milidetik.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tetap diprioritaskan untuk override layanan atau shell sekali pakai.
    - Sebaiknya perbaiki stall startup/event-loop terlebih dahulu; knob ini untuk host yang sehat tetapi lambat saat warmup.

  </Accordion>

  <Accordion title="Configure sessions and resets">
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

    Bangun image terlebih dahulu - dari checkout sumber jalankan `scripts/sandbox-setup.sh`, atau dari instalasi npm lihat perintah inline `docker build` di [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup).

    Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/id/gateway/config-agents#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Aktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay untuk build App Store/TestFlight publik menggunakan relay OpenClaw terhosting: `https://ios-push-relay.openclaw.ai`.

    Deployment relay kustom memerlukan jalur build/deployment iOS yang sengaja dipisahkan dengan URL relay yang cocok dengan URL relay gateway. Jika Anda menggunakan build relay kustom, atur ini di konfigurasi gateway:

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
    - Menggunakan izin kirim bercakupan registrasi yang diteruskan oleh aplikasi iOS yang dipasangkan. Gateway tidak memerlukan token relay untuk seluruh deployment.
    - Mengikat setiap registrasi berbasis relay ke identitas gateway yang dipasangkan dengan aplikasi iOS, sehingga gateway lain tidak dapat menggunakan ulang registrasi tersimpan.
    - Mempertahankan build iOS lokal/manual pada APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build terdistribusi resmi yang mendaftar melalui relay.
    - Harus cocok dengan URL dasar relay yang tertanam dalam build iOS, sehingga lalu lintas registrasi dan pengiriman mencapai deployment relay yang sama.

    Alur menyeluruh:

    1. Instal build iOS resmi/TestFlight.
    2. Opsional: konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway hanya saat menggunakan build relay kustom yang sengaja dipisahkan.
    3. Pasangkan aplikasi iOS ke gateway dan biarkan sesi node serta operator terhubung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus tanda terima aplikasi, lalu menerbitkan payload `push.apns.register` berbasis relay ke gateway yang dipasangkan.
    5. Gateway menyimpan handle relay dan izin kirim, lalu menggunakannya untuk `push.test`, dorongan bangun, dan bangun sambung ulang.

    Catatan operasional:

    - Jika Anda mengalihkan aplikasi iOS ke gateway lain, sambungkan ulang aplikasi agar dapat menerbitkan registrasi relay baru yang terikat ke gateway tersebut.
    - Jika Anda merilis build iOS baru yang menunjuk ke deployment relay lain, aplikasi akan menyegarkan registrasi relay yang di-cache alih-alih menggunakan ulang asal relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` masih berfungsi sebagai override env sementara.
    - URL relay gateway kustom harus cocok dengan URL dasar relay yang tertanam dalam build iOS. Jalur rilis App Store publik menolak override URL relay iOS kustom.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap merupakan escape hatch pengembangan khusus loopback; jangan persistensikan URL relay HTTP dalam konfigurasi.

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

    - `every`: string durasi (`30m`, `2h`). Atur `0m` untuk menonaktifkan.
    - `target`: `last` | `none` | `<channel-id>` (misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`)
    - `directPolicy`: `allow` (default) atau `block` untuk target Heartbeat bergaya DM
    - Lihat [Heartbeat](/id/gateway/heartbeat) untuk panduan lengkap.

  </Accordion>

  <Accordion title="Konfigurasikan job Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: pangkas sesi run terisolasi yang selesai dari `sessions.json` (default `24h`; atur `false` untuk menonaktifkan).
    - `runLog`: pangkas baris riwayat run cron yang dipertahankan per job. `maxBytes` tetap diterima untuk log run lama berbasis file.
    - Lihat [job Cron](/id/automation/cron-jobs) untuk ikhtisar fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Siapkan webhook (hook)">
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
    - Gunakan `hooks.token` khusus; jangan gunakan ulang rahasia auth Gateway aktif (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Auth hook hanya melalui header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query-string ditolak.
    - `hooks.path` tidak boleh `/`; pertahankan ingress webhook pada subpath khusus seperti `/hooks`.
    - Biarkan flag bypass konten tidak aman dinonaktifkan (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali untuk debugging dengan cakupan ketat.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agen yang digerakkan hook, pilih tier model modern yang kuat dan kebijakan tool yang ketat (misalnya hanya perpesanan plus sandboxing bila memungkinkan).

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
    - **Array file**: digabungkan secara mendalam sesuai urutan (yang belakangan menang)
    - **Kunci saudara**: digabungkan setelah include (menimpa nilai yang di-include)
    - **Include bersarang**: didukung hingga kedalaman 10 level
    - **Path relatif**: di-resolve relatif terhadap file yang melakukan include
    - **Format path**: path include tidak boleh berisi byte null dan harus benar-benar lebih pendek dari 4096 karakter sebelum dan sesudah resolusi
    - **Penulisan milik OpenClaw**: ketika penulisan hanya mengubah satu bagian tingkat atas
      yang didukung oleh include file tunggal seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui file yang di-include tersebut dan membiarkan `openclaw.json` tetap utuh
    - **Write-through tidak didukung**: include root, array include, dan include
      dengan override saudara gagal tertutup untuk penulisan milik OpenClaw alih-alih
      meratakan konfigurasi
    - **Pengurungan**: path `$include` harus di-resolve di bawah direktori yang berisi
      `openclaw.json`. Untuk berbagi pohon antar mesin atau pengguna, atur
      `OPENCLAW_INCLUDE_ROOTS` ke daftar path (`:` di POSIX, `;` di Windows) dari
      direktori tambahan yang boleh direferensikan oleh include. Symlink di-resolve
      dan diperiksa ulang, sehingga path yang secara leksikal berada di direktori konfigurasi tetapi
      target aslinya keluar dari setiap root yang diizinkan tetap ditolak.
    - **Penanganan kesalahan**: kesalahan yang jelas untuk file hilang, kesalahan parse, include melingkar, format path tidak valid, dan panjang berlebihan

  </Accordion>
</AccordionGroup>

## Reload panas konfigurasi

Gateway mengawasi `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis - restart manual tidak diperlukan untuk sebagian besar pengaturan.

Edit file langsung diperlakukan sebagai tidak tepercaya hingga lolos validasi. Watcher menunggu
churn temp-write/rename editor mereda, membaca file akhir, dan menolak
edit eksternal yang tidak valid tanpa menulis ulang `openclaw.json`. Penulisan konfigurasi
milik OpenClaw menggunakan gerbang skema yang sama sebelum menulis; clobber destruktif seperti
menghapus `gateway.mode` atau mengecilkan file lebih dari setengah ditolak dan
disimpan sebagai `.rejected.*` untuk inspeksi.

Jika Anda melihat `config reload skipped (invalid config)` atau startup melaporkan `Invalid
config`, periksa konfigurasi, jalankan `openclaw config validate`, lalu jalankan `openclaw
doctor --fix` untuk perbaikan. Lihat [pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config)
untuk checklist.

### Mode reload

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan perubahan aman secara panas seketika. Otomatis restart untuk yang kritis.    |
| **`hot`**              | Hanya menerapkan perubahan aman secara panas. Mencatat peringatan saat restart diperlukan - Anda menanganinya. |
| **`restart`**          | Me-restart Gateway pada setiap perubahan konfigurasi, aman maupun tidak.                |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada restart manual berikutnya.        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Apa yang diterapkan secara panas vs apa yang memerlukan restart

Sebagian besar bidang diterapkan secara panas tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani secara otomatis.

| Kategori            | Bidang                                                            | Perlu mulai ulang? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channel             | `channels.*`, `web` (WhatsApp) - semua channel bawaan dan Plugin | Tidak              |
| Agent & model      | `agent`, `agents`, `models`, `routing`                            | Tidak              |
| Otomasi          | `hooks`, `cron`, `agent.heartbeat`                                | Tidak              |
| Sesi & pesan | `session`, `messages`                                             | Tidak              |
| Alat & media       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Tidak              |
| UI & lainnya           | `ui`, `logging`, `identity`, `bindings`                           | Tidak              |
| Server Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Ya**         |
| Infrastruktur      | `discovery`, `plugins`                                            | **Ya**         |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian - mengubahnya **tidak** memicu mulai ulang.
</Note>

### Perencanaan muat ulang

Saat Anda mengedit file sumber yang dirujuk melalui `$include`, OpenClaw merencanakan
muat ulang dari tata letak yang ditulis di sumber, bukan tampilan dalam memori yang sudah diratakan.
Ini membuat keputusan hot-reload (hot-apply vs mulai ulang) tetap dapat diprediksi bahkan saat
satu bagian tingkat atas berada di file yang disertakan sendiri seperti
`plugins: { $include: "./plugins.json5" }`. Perencanaan muat ulang gagal tertutup jika
tata letak sumber ambigu.

## RPC konfigurasi (pembaruan terprogram)

Untuk tooling yang menulis konfigurasi melalui API Gateway, gunakan alur ini:

- `config.schema.lookup` untuk memeriksa satu subtree (node skema dangkal + ringkasan
  anak)
- `config.get` untuk mengambil snapshot saat ini beserta `hash`
- `config.patch` untuk pembaruan parsial (JSON merge patch: objek digabungkan, `null`
  menghapus, array diganti saat dikonfirmasi secara eksplisit dengan `replacePaths` jika
  entri akan dihapus)
- `config.apply` hanya saat Anda bermaksud mengganti seluruh konfigurasi
- `update.run` untuk self-update eksplisit beserta mulai ulang; sertakan `continuationMessage` saat sesi pasca-mulai-ulang harus menjalankan satu giliran lanjutan
- `update.status` untuk memeriksa sentinel mulai ulang pembaruan terbaru dan memverifikasi versi yang berjalan setelah mulai ulang

Agent harus memperlakukan `config.schema.lookup` sebagai tempat pertama untuk dokumentasi dan batasan
tingkat-bidang yang tepat. Gunakan [Referensi konfigurasi](/id/gateway/configuration-reference)
saat mereka membutuhkan peta konfigurasi yang lebih luas, default, atau tautan ke referensi
subsistem khusus.

<Note>
Penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi lajunya
hingga 3 permintaan per 60 detik per `deviceId+clientIp`. Permintaan mulai ulang
digabungkan lalu menerapkan cooldown 30 detik di antara siklus mulai ulang.
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

`config.apply` dan `config.patch` sama-sama menerima `raw`, `baseHash`, `sessionKey`,
`note`, dan `restartDelayMs`. `baseHash` wajib untuk kedua metode saat
konfigurasi sudah ada.

`config.patch` juga menerima `replacePaths`, array path konfigurasi yang penggantian array-nya
disengaja. Jika sebuah patch akan mengganti atau menghapus array yang ada
dengan entri lebih sedikit, Gateway menolak penulisan kecuali path persis tersebut muncul
di `replacePaths`; array bertingkat di bawah entri array menggunakan `[]`, seperti
`agents.list[].skills`. Ini mencegah snapshot `config.get` yang terpotong
diam-diam menimpa array routing atau allowlist. Gunakan `config.apply` saat Anda
bermaksud mengganti konfigurasi lengkap.

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

<Accordion title="Shell env import (optional)">
  Jika diaktifkan dan kunci yang diharapkan belum ditetapkan, OpenClaw menjalankan shell login Anda dan hanya mengimpor kunci yang hilang:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Padanan env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  Rujuk env vars dalam nilai string konfigurasi apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Aturan:

- Hanya nama huruf besar yang cocok: `[A-Z_][A-Z0-9_]*`
- Vars yang hilang/kosong memunculkan error saat waktu muat
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
Path kredensial yang didukung tercantum di [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Accordion>

Lihat [Lingkungan](/id/help/environment) untuk presedensi dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap bidang demi bidang, lihat **[Referensi Konfigurasi](/id/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Referensi Konfigurasi](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
- [Runbook Gateway](/id/gateway)
