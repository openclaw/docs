---
read_when:
    - Menyiapkan OpenClaw untuk pertama kalinya
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-30T09:47:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eaad06dff8ec777adc881edbabc45048a376078d2814f2d3f7e7035abb2e8d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.
Jalur konfigurasi aktif harus berupa file reguler. Tata letak `openclaw.json`
berupa symlink tidak didukung untuk penulisan yang dimiliki OpenClaw; penulisan
atomik dapat mengganti jalur tersebut alih-alih mempertahankan symlink. Jika Anda
menyimpan konfigurasi di luar direktori status default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file sebenarnya.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan konfigurasi:

- Menghubungkan saluran dan mengontrol siapa yang dapat mengirim pesan ke bot
- Mengatur model, alat, sandboxing, atau automasi (cron, hook)
- Menyesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap bidang yang tersedia.

Agen dan automasi sebaiknya menggunakan `config.schema.lookup` untuk dokumentasi
tingkat bidang yang persis sebelum mengedit konfigurasi. Gunakan halaman ini
untuk panduan berorientasi tugas dan [Referensi konfigurasi](/id/gateway/configuration-reference)
untuk peta bidang dan default yang lebih luas.

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
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Konfigurasi**.
    UI Kontrol merender formulir dari skema konfigurasi langsung, termasuk
    metadata dokumentasi bidang `title` / `description` serta skema plugin dan
    saluran saat tersedia, dengan editor **JSON Mentah** sebagai jalur keluar.
    Untuk UI penelusuran mendalam dan alat lain, Gateway juga mengekspos
    `config.schema.lookup` untuk mengambil satu node skema dengan cakupan jalur
    beserta ringkasan turunan langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file tersebut dan menerapkan perubahan secara otomatis (lihat [muat ulang panas](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Kunci yang tidak dikenal, tipe yang salah bentuk, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk memulai**. Satu-satunya pengecualian tingkat root adalah `$schema` (string), agar editor dapat melampirkan metadata Skema JSON.
</Warning>

`openclaw config schema` mencetak Skema JSON kanonis yang digunakan oleh UI Kontrol
dan validasi. `config.schema.lookup` mengambil satu node dengan cakupan jalur
beserta ringkasan turunan untuk alat penelusuran mendalam. Metadata dokumentasi
bidang `title`/`description` diteruskan melalui objek bertingkat, wildcard (`*`),
item array (`[]`), dan cabang `anyOf`/`oneOf`/`allOf`. Skema runtime plugin dan
saluran digabungkan saat registri manifes dimuat.

Saat validasi gagal:

- Gateway tidak melakukan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah persisnya
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

Gateway menyimpan salinan tepercaya terakhir yang diketahui baik setelah setiap
startup berhasil. Jika `openclaw.json` kemudian gagal validasi (atau menghapus
`gateway.mode`, menyusut tajam, atau memiliki baris log terselip di awal),
OpenClaw mempertahankan file yang rusak sebagai `.clobbered.*`, memulihkan
salinan terakhir yang diketahui baik, dan mencatat alasan pemulihan. Giliran agen
berikutnya juga menerima peringatan peristiwa sistem agar agen utama tidak
membabi buta menulis ulang konfigurasi yang dipulihkan. Promosi ke terakhir yang
diketahui baik dilewati saat kandidat berisi placeholder rahasia yang telah
direduksi seperti `***`. Saat setiap masalah validasi dibatasi ke
`plugins.entries.<id>...`, OpenClaw tidak melakukan pemulihan seluruh file.
OpenClaw mempertahankan konfigurasi saat ini tetap aktif dan menampilkan
kegagalan lokal plugin agar ketidakcocokan skema plugin atau versi host tidak
dapat mengembalikan pengaturan pengguna yang tidak terkait.

## Tugas umum

<AccordionGroup>
  <Accordion title="Menyiapkan saluran (WhatsApp, Telegram, Discord, dll.)">
    Setiap saluran memiliki bagian konfigurasinya sendiri di bawah `channels.<provider>`. Lihat halaman saluran khusus untuk langkah penyiapan:

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

    Semua saluran berbagi pola kebijakan DM yang sama:

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
    - Gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri allowlist tanpa menghapus model yang ada. Penggantian biasa yang akan menghapus entri ditolak kecuali Anda meneruskan `--replace`.
    - Referensi model menggunakan format `provider/model` (misalnya `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol penskalaan turun gambar transkrip/alat (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan token visi pada proses yang banyak memakai tangkapan layar.
    - Lihat [CLI Model](/id/concepts/models) untuk beralih model di chat dan [Failover Model](/id/concepts/model-failover) untuk rotasi autentikasi dan perilaku fallback.
    - Untuk penyedia kustom/self-hosted, lihat [Penyedia kustom](/id/gateway/config-tools#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Mengontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikontrol per saluran melalui `dmPolicy`:

    - `"pairing"` (default): pengirim tidak dikenal mendapat kode pairing sekali pakai untuk disetujui
    - `"allowlist"`: hanya pengirim dalam `allowFrom` (atau penyimpanan izin yang telah dipairing)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus saluran.

    Lihat [referensi lengkap](/id/gateway/config-channels#dm-and-group-access) untuk detail per saluran.

  </Accordion>

  <Accordion title="Menyiapkan gerbang mention chat grup">
    Pesan grup secara default **memerlukan mention**. Konfigurasikan pola pemicu per agen, dan pertahankan balasan ruang yang terlihat pada jalur alat pesan default kecuali Anda sengaja menginginkan balasan final otomatis lama:

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

    - **Mention metadata**: @-mention native (WhatsApp tap-to-mention, Telegram @bot, dll.)
    - **Pola teks**: pola regex aman di `mentionPatterns`
    - **Balasan terlihat**: `messages.visibleReplies` dapat mewajibkan pengiriman alat pesan secara global; `messages.groupChat.visibleReplies` menimpanya untuk grup/saluran.
    - Lihat [referensi lengkap](/id/gateway/config-channels#group-chat-mention-gating) untuk mode balasan terlihat, penimpaan per saluran, dan mode self-chat.

  </Accordion>

  <Accordion title="Membatasi Skills per agen">
    Gunakan `agents.defaults.skills` untuk baseline bersama, lalu timpa agen
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

    - Hilangkan `agents.defaults.skills` agar Skills tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi default.
    - Atur `agents.list[].skills: []` agar tidak ada Skills.
    - Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan
      [Referensi Konfigurasi](/id/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Menyesuaikan pemantauan kesehatan saluran gateway">
    Kontrol seberapa agresif gateway memulai ulang saluran yang tampak stale:

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

    - Atur `gateway.channelHealthCheckMinutes: 0` untuk menonaktifkan restart monitor kesehatan secara global.
    - `channelStaleEventThresholdMinutes` sebaiknya lebih besar dari atau sama dengan interval pemeriksaan.
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan restart otomatis bagi satu saluran atau akun tanpa menonaktifkan monitor global.
    - Lihat [Pemeriksaan Kesehatan](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua bidang.

  </Accordion>

  <Accordion title="Menyesuaikan timeout handshake WebSocket gateway">
    Berikan klien lokal lebih banyak waktu untuk menyelesaikan handshake WebSocket pra-autentikasi pada
    host yang sibuk atau berdaya rendah:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Default adalah `15000` milidetik.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tetap diprioritaskan untuk penimpaan layanan atau shell sekali pakai.
    - Lebih baik perbaiki kemacetan startup/event-loop terlebih dahulu; kenop ini untuk host yang sehat tetapi lambat saat warmup.

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

    - `dmScope`: `main` (dibagikan) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: default global untuk perutean sesi yang terikat thread (Discord mendukung `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age`).
    - Lihat [Manajemen Sesi](/id/concepts/session) untuk cakupan, tautan identitas, dan kebijakan pengiriman.
    - Lihat [referensi lengkap](/id/gateway/config-agents#session) untuk semua kolom.

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

    Atur ini dalam konfigurasi gateway:

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
    - Menggunakan izin kirim yang tercakup pada pendaftaran dan diteruskan oleh aplikasi iOS yang dipasangkan. Gateway tidak memerlukan token relay untuk seluruh deployment.
    - Mengikat setiap pendaftaran berbasis relay ke identitas gateway yang dipasangkan dengan aplikasi iOS, sehingga gateway lain tidak dapat menggunakan ulang pendaftaran yang tersimpan.
    - Mempertahankan build iOS lokal/manual pada APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build distribusi resmi yang terdaftar melalui relay.
    - Harus cocok dengan URL dasar relay yang disertakan dalam build iOS resmi/TestFlight, sehingga lalu lintas pendaftaran dan pengiriman mencapai deployment relay yang sama.

    Alur ujung ke ujung:

    1. Instal build iOS resmi/TestFlight yang dikompilasi dengan URL dasar relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway.
    3. Pasangkan aplikasi iOS ke gateway dan biarkan sesi node serta operator tersambung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus tanda terima aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang dipasangkan.
    5. Gateway menyimpan handle relay dan izin kirim, lalu menggunakannya untuk `push.test`, dorongan bangun, dan bangun sambung ulang.

    Catatan operasional:

    - Jika Anda mengalihkan aplikasi iOS ke gateway berbeda, sambungkan ulang aplikasi agar dapat memublikasikan pendaftaran relay baru yang terikat ke gateway tersebut.
    - Jika Anda merilis build iOS baru yang mengarah ke deployment relay berbeda, aplikasi menyegarkan pendaftaran relay dalam cache alih-alih menggunakan ulang origin relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` masih berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi jalan keluar pengembangan khusus loopback; jangan simpan URL relay HTTP dalam konfigurasi.

    Lihat [Aplikasi iOS](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur ujung ke ujung dan [Alur autentikasi dan kepercayaan](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

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

  <Accordion title="Konfigurasikan tugas Cron">
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

    - `sessionRetention`: pangkas sesi run terisolasi yang selesai dari `sessions.json` (default `24h`; atur `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan baris yang dipertahankan.
    - Lihat [Tugas Cron](/id/automation/cron-jobs) untuk ringkasan fitur dan contoh CLI.

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
    - Perlakukan semua konten payload hook/Webhook sebagai input tidak tepercaya.
    - Gunakan `hooks.token` khusus; jangan gunakan ulang token Gateway bersama.
    - Autentikasi hook hanya melalui header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query-string ditolak.
    - `hooks.path` tidak boleh `/`; pertahankan ingress Webhook pada subpath khusus seperti `/hooks`.
    - Biarkan flag bypass konten tidak aman tetap nonaktif (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali untuk debugging dengan cakupan sangat ketat.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agen yang digerakkan hook, utamakan tingkat model modern yang kuat dan kebijakan tool yang ketat (misalnya hanya messaging plus sandboxing jika memungkinkan).

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

    - **File tunggal**: mengganti objek yang memuatnya
    - **Array file**: digabung secara mendalam sesuai urutan (yang belakangan menang)
    - **Kunci saudara**: digabung setelah include (menimpa nilai yang disertakan)
    - **Include bersarang**: didukung hingga 10 level
    - **Path relatif**: diselesaikan relatif terhadap file yang menyertakan
    - **Penulisan milik OpenClaw**: ketika penulisan hanya mengubah satu bagian tingkat atas
      yang didukung oleh include file tunggal seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui file yang disertakan tersebut dan membiarkan `openclaw.json` tetap utuh
    - **Write-through yang tidak didukung**: include root, array include, dan include
      dengan override saudara gagal tertutup untuk penulisan milik OpenClaw alih-alih
      meratakan konfigurasi
    - **Penanganan kesalahan**: kesalahan yang jelas untuk file hilang, kesalahan parse, dan include melingkar

  </Accordion>
</AccordionGroup>

## Muat ulang konfigurasi secara hot

Gateway mengawasi `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis — tidak diperlukan restart manual untuk sebagian besar pengaturan.

Edit file langsung diperlakukan sebagai tidak tepercaya sampai lolos validasi. Watcher menunggu
gejolak penulisan sementara/penggantian nama dari editor mereda, membaca file final, dan menolak
edit eksternal yang tidak valid dengan memulihkan konfigurasi terakhir yang diketahui baik. Penulisan
konfigurasi milik OpenClaw menggunakan gerbang skema yang sama sebelum menulis; clobber destruktif seperti
menghapus `gateway.mode` atau mengecilkan file lebih dari setengah ditolak
dan disimpan sebagai `.rejected.*` untuk diperiksa.

Kegagalan validasi lokal Plugin adalah pengecualian: jika semua masalah berada di bawah
`plugins.entries.<id>...`, muat ulang mempertahankan konfigurasi saat ini dan melaporkan masalah Plugin
alih-alih memulihkan `.last-good`.

Jika Anda melihat `Config auto-restored from last-known-good` atau
`config reload restored last-known-good config` di log, periksa file
`.clobbered.*` yang sesuai di sebelah `openclaw.json`, perbaiki payload yang ditolak, lalu jalankan
`openclaw config validate`. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config)
untuk checklist pemulihan.

### Mode muat ulang

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan perubahan aman secara hot seketika. Otomatis melakukan restart untuk perubahan kritis. |
| **`hot`**              | Hanya menerapkan perubahan aman secara hot. Mencatat peringatan saat restart diperlukan — Anda yang menanganinya. |
| **`restart`**          | Melakukan restart Gateway pada setiap perubahan konfigurasi, aman atau tidak.                                 |
| **`off`**              | Menonaktifkan pengawasan file. Perubahan berlaku pada restart manual berikutnya.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Yang diterapkan secara hot vs yang memerlukan restart

Sebagian besar kolom diterapkan secara hot tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani otomatis.

| Kategori            | Kolom                                                            | Perlu restart? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channel             | `channels.*`, `web` (WhatsApp) — semua channel bawaan dan Plugin | Tidak           |
| Agen & model        | `agent`, `agents`, `models`, `routing`                            | Tidak           |
| Otomatisasi         | `hooks`, `cron`, `agent.heartbeat`                                | Tidak           |
| Sesi & pesan        | `session`, `messages`                                             | Tidak           |
| Tool & media        | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Tidak           |
| UI & lainnya        | `ui`, `logging`, `identity`, `bindings`                           | Tidak           |
| Server Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Ya**          |
| Infrastruktur       | `discovery`, `canvasHost`, `plugins`                              | **Ya**          |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian — mengubahnya **tidak** memicu restart.
</Note>

### Perencanaan muat ulang

Saat Anda mengedit file sumber yang dirujuk melalui `$include`, OpenClaw merencanakan
muat ulang dari tata letak yang ditulis di sumber, bukan tampilan dalam memori
yang sudah diratakan. Ini menjaga keputusan hot-reload (hot-apply vs restart)
tetap dapat diprediksi meskipun satu bagian tingkat atas berada dalam file
include-nya sendiri seperti `plugins: { $include: "./plugins.json5" }`.
Perencanaan muat ulang gagal secara tertutup jika tata letak sumber bersifat ambigu.

## RPC Konfigurasi (pembaruan terprogram)

Untuk tooling yang menulis konfigurasi melalui API Gateway, gunakan alur ini:

- `config.schema.lookup` untuk memeriksa satu subtree (node skema dangkal + ringkasan
  anak)
- `config.get` untuk mengambil snapshot saat ini plus `hash`
- `config.patch` untuk pembaruan parsial (JSON merge patch: objek digabungkan, `null`
  menghapus, array mengganti)
- `config.apply` hanya ketika Anda bermaksud mengganti seluruh konfigurasi
- `update.run` untuk self-update eksplisit plus restart
- `update.status` untuk memeriksa sentinel restart pembaruan terbaru dan memverifikasi versi yang berjalan setelah restart

Agen sebaiknya memperlakukan `config.schema.lookup` sebagai tempat pertama untuk dokumentasi
dan batasan tingkat-field yang persis. Gunakan [Referensi konfigurasi](/id/gateway/configuration-reference)
ketika mereka memerlukan peta konfigurasi yang lebih luas, default, atau tautan ke
referensi subsistem khusus.

<Note>
Penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi
lajunya menjadi 3 permintaan per 60 detik per `deviceId+clientIp`. Permintaan
restart digabungkan lalu menerapkan cooldown 30 detik antar siklus restart.
`update.status` bersifat read-only tetapi berada dalam cakupan admin karena sentinel
restart dapat menyertakan ringkasan langkah pembaruan dan ekor output perintah.
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
`note`, dan `restartDelayMs`. `baseHash` wajib untuk kedua metode ketika
konfigurasi sudah ada.

## Variabel lingkungan

OpenClaw membaca env vars dari proses induk plus:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Tidak satu pun file menimpa env vars yang sudah ada. Anda juga dapat menetapkan inline env vars dalam konfigurasi:

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

- Hanya nama huruf besar yang dicocokkan: `[A-Z_][A-Z0-9_]*`
- Vars yang hilang/kosong memunculkan error saat load
- Escape dengan `$${VAR}` untuk output literal
- Berfungsi di dalam file `$include`
- Substitusi inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Ref rahasia (env, file, exec)">
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
