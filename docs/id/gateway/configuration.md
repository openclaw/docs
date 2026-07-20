---
read_when:
    - Menyiapkan OpenClaw untuk pertama kalinya
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-07-20T03:48:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d48a4ebb9a8ca212917ce4fe12a0670a44bf1030657bd1334343a91eef8ff742
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 mendukung komentar dan koma di akhir">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`. Jika file tidak ada, OpenClaw menggunakan nilai default yang aman.

Jalur konfigurasi aktif harus berupa file biasa. Penulisan yang dilakukan OpenClaw menggantinya secara atomik (mengganti nama ke jalur tersebut), sehingga target `openclaw.json` yang berupa symlink akan diganti, bukan ditulisi melalui symlink tersebut - hindari tata letak konfigurasi yang menggunakan symlink. Jika Anda menyimpan konfigurasi di luar direktori status default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file sebenarnya.

Alasan umum untuk menambahkan konfigurasi:

- Hubungkan channel dan kendalikan siapa yang dapat mengirim pesan kepada bot
- Atur model, alat, sandboxing, atau otomatisasi (cron, hook)
- Sesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap bidang yang tersedia.

Agen dan otomatisasi harus menggunakan `config.schema.lookup` untuk dokumentasi
tingkat bidang yang tepat sebelum mengedit konfigurasi. Gunakan halaman ini untuk panduan berorientasi tugas dan
[Referensi konfigurasi](/id/gateway/configuration-reference) untuk peta
bidang dan nilai default yang lebih luas.

<Tip>
**Baru mengenal konfigurasi?** Mulailah dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Contoh Konfigurasi](/id/gateway/configuration-examples) untuk konfigurasi lengkap yang dapat langsung disalin dan ditempel.
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
    openclaw onboard       # alur orientasi lengkap
    openclaw configure     # wizard konfigurasi
    ```
  </Tab>
  <Tab title="CLI (perintah satu baris)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI Kontrol">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Konfigurasi**.
    UI Kontrol merender formulir dari skema konfigurasi aktif, termasuk metadata dokumentasi
    bidang `title` / `description` serta skema plugin dan channel jika
    tersedia, dengan editor **JSON Mentah** sebagai jalan keluar. Untuk UI
    penelusuran mendetail dan alat lainnya, gateway juga menyediakan `config.schema.lookup` untuk
    mengambil satu node skema dengan cakupan jalur beserta ringkasan turunan langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file tersebut dan menerapkan perubahan secara otomatis (lihat [pemuatan ulang langsung](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Kunci yang tidak dikenal, tipe yang salah format, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk dimulai**. Satu-satunya pengecualian pada tingkat root adalah `$schema` (string), sehingga editor dapat melampirkan metadata Skema JSON.
</Warning>

`openclaw config schema` mencetak Skema JSON kanonis yang digunakan oleh UI Kontrol
dan validasi. `config.schema.lookup` mengambil satu node dengan cakupan jalur beserta
ringkasan turunannya untuk alat penelusuran mendetail. Metadata dokumentasi bidang `title`/`description`
diteruskan melalui objek bertingkat, wildcard (`*`), item array (`[]`), dan cabang `anyOf`/
`oneOf`/`allOf`. Skema plugin dan channel runtime digabungkan saat
registri manifes dimuat.

Ketika validasi gagal:

- Gateway tidak dimulai
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah secara tepat
- Jalankan `openclaw doctor --fix` (`--repair` adalah flag yang sama; `--yes` melewati prompt) untuk menerapkan perbaikan

Gateway menyimpan salinan tepercaya terakhir yang diketahui baik setelah setiap proses mulai yang berhasil,
tetapi proses mulai dan pemuatan ulang langsung tidak memulihkannya secara otomatis - hanya `openclaw doctor --fix`
yang melakukannya. Jika `openclaw.json` gagal divalidasi (termasuk validasi lokal plugin), proses
mulai Gateway gagal atau pemuatan ulang dilewati dan runtime saat ini mempertahankan konfigurasi terakhir
yang diterima. Penulisan yang ditolak juga disimpan sebagai `<path>.rejected.<timestamp>` untuk diperiksa.
Gateway memblokir penulisan yang tampak seperti penimpaan tidak disengaja - menghapus `gateway.mode`,
menghilangkan blok `meta`, atau memperkecil file lebih dari separuh - kecuali penulisan tersebut
secara eksplisit mengizinkan perubahan destruktif. Promosi menjadi salinan terakhir yang diketahui baik dilewati ketika
kandidat berisi placeholder rahasia yang disamarkan seperti `***` atau `[redacted]`.

## Tugas umum

<AccordionGroup>
  <Accordion title="Menyiapkan channel (WhatsApp, Telegram, Discord, dll.)">
    Setiap channel memiliki bagian konfigurasinya sendiri di bawah `channels.<provider>`. Lihat halaman khusus channel untuk langkah-langkah penyiapan:

    - [Discord](/id/channels/discord) - `channels.discord`
    - [Feishu](/id/channels/feishu) - `channels.feishu`
    - [Google Chat](/id/channels/googlechat) - `channels.googlechat`
    - [iMessage](/id/channels/imessage) - `channels.imessage`
    - [Mattermost](/id/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/id/channels/msteams) - `channels.msteams`
    - [Signal](/id/channels/signal) - `channels.signal`
    - [Slack](/id/channels/slack) - `channels.slack`
    - [Telegram](/id/channels/telegram) - `channels.telegram`
    - [WhatsApp](/id/channels/whatsapp) - `channels.whatsapp`

    Semua channel menggunakan pola kebijakan DM yang sama:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pemasangan | daftar izin | terbuka | dinonaktifkan
          allowFrom: ["tg:123"], // hanya untuk daftar izin/terbuka
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

    - `agents.defaults.models` menyimpan alias dan pengaturan per model; menambahkan entri tidak pernah membatasi penggantian `/model` atau `--model`.
    - `agents.defaults.modelPolicy.allow` adalah daftar izin eksplisit untuk penggantian dan pemilih model. Ini menerima referensi persis dan wildcard `provider/*`; hilangkan atau gunakan `[]` untuk mengizinkan model apa pun.
    - Referensi model menggunakan format `provider/model` (misalnya `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol penurunan skala gambar transkrip/alat (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan token visi pada proses yang sarat tangkapan layar.
    - Lihat [CLI Model](/id/concepts/models) untuk mengganti model dalam obrolan dan [Failover Model](/id/concepts/model-failover) untuk rotasi autentikasi dan perilaku fallback.
    - Untuk penyedia khusus/yang dihosting sendiri, lihat [Penyedia khusus](/id/gateway/config-tools#custom-providers-and-base-urls) dalam referensi.

  </Accordion>

  <Accordion title="Mengendalikan siapa yang dapat mengirim pesan kepada bot">
    Akses DM dikendalikan per channel melalui `dmPolicy` (default `"pairing"`):

    - `"pairing"`: pengirim tidak dikenal mendapatkan kode pemasangan sekali pakai untuk disetujui
    - `"allowlist"`: hanya pengirim dalam `allowFrom` (atau penyimpanan izin yang telah dipasangkan)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` (`"allowlist" | "open" | "disabled"`) bersama `groupAllowFrom` atau daftar izin khusus channel.

    Lihat [referensi lengkap](/id/gateway/config-channels#dm-and-group-access) untuk detail per channel.

  </Accordion>

  <Accordion title="Menyiapkan gerbang penyebutan obrolan grup">
    Pesan grup secara default **memerlukan penyebutan**. Konfigurasikan pola pemicu per agen. Balasan grup/channel normal dikirim secara otomatis; aktifkan jalur alat pesan untuk ruang bersama tempat agen harus memutuskan kapan akan berbicara:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // atur "message_tool" agar pengiriman alat pesan diwajibkan di mana saja
        groupChat: {
          visibleReplies: "message_tool", // ikut serta; keluaran terlihat memerlukan message(action=send)
          unmentionedInbound: "room_event", // percakapan grup selalu aktif tanpa penyebutan menjadi konteks senyap
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

    - **Penyebutan metadata**: @-mention native (ketuk untuk menyebut di WhatsApp, @bot di Telegram, dll.)
    - **Pola teks**: pola regex aman dalam `mentionPatterns`
    - **Balasan terlihat**: `messages.visibleReplies` dapat mewajibkan pengiriman alat pesan secara global; `messages.groupChat.visibleReplies` menggantikannya untuk grup/channel.
    - Lihat [referensi lengkap](/id/gateway/config-channels#group-chat-mention-gating) untuk mode balasan terlihat, penggantian per channel, dan mode obrolan dengan diri sendiri.

  </Accordion>

  <Accordion title="Membatasi Skills per agen">
    Gunakan `agents.defaults.skills` untuk baseline bersama, lalu ganti untuk agen
    tertentu dengan `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // mewarisi github, weather
          { id: "docs", skills: ["docs-search"] }, // menggantikan nilai default
          { id: "locked-down", skills: [] }, // tanpa skills
        ],
      },
    }
    ```

    - Hilangkan `agents.defaults.skills` agar Skills tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi nilai default.
    - Atur `agents.list[].skills: []` agar tidak ada Skills.
    - Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan
      [Referensi Konfigurasi](/id/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Mengonfigurasi pemantauan kesehatan per channel">
    Nonaktifkan atau aktifkan mulai ulang kesehatan otomatis untuk channel atau akun:

    ```json5
    {
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

    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk mengontrol mulai ulang otomatis bagi satu channel atau akun.
    - Lihat [Pemeriksaan Kesehatan](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua bidang.

  </Accordion>

  <Accordion title="Mengonfigurasi sesi dan pengaturan ulang">
    Sesi mengontrol kesinambungan dan isolasi percakapan:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // direkomendasikan untuk banyak pengguna
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
    - `threadBindings`: nilai default global untuk perutean sesi yang terikat ke utas. `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age` mengikat, melepas ikatan, mencantumkan, dan menyesuaikan ini per sesi (Discord mengikat utas, Telegram mengikat topik/percakapan).
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
            mode: "non-main",  // nonaktif | non-main | semua
            scope: "agent",    // sesi | agen | bersama
          },
        },
      },
    }
    ```

    Buat image terlebih dahulu—dari checkout sumber, jalankan `scripts/sandbox-setup.sh`, atau dari instalasi npm, lihat perintah inline `docker build` di [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup).

    Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/id/gateway/config-agents#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Aktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay untuk build App Store publik menggunakan relay OpenClaw yang dihosting: `https://ios-push-relay.openclaw.ai`.

    Deployment relay khusus memerlukan jalur build/deployment iOS yang sengaja dipisahkan, dengan URL relay yang cocok dengan URL relay gateway. Jika Anda menggunakan build relay khusus, atur ini dalam konfigurasi gateway:

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

    - Memungkinkan gateway mengirim `push.test`, dorongan untuk membangunkan, dan pembangkitan koneksi ulang melalui relay eksternal.
    - Menggunakan izin pengiriman dengan cakupan pendaftaran yang diteruskan oleh aplikasi iOS yang dipasangkan. Gateway tidak memerlukan token relay untuk seluruh deployment.
    - Mengikat setiap pendaftaran berbasis relay ke identitas gateway yang dipasangkan dengan aplikasi iOS, sehingga gateway lain tidak dapat menggunakan kembali pendaftaran yang tersimpan.
    - Mempertahankan penggunaan APNs langsung untuk build iOS lokal/manual. Pengiriman berbasis relay hanya berlaku untuk build resmi yang didistribusikan dan didaftarkan melalui relay.
    - Harus cocok dengan URL dasar relay yang disematkan dalam build iOS agar lalu lintas pendaftaran dan pengiriman mencapai deployment relay yang sama.

    Alur menyeluruh:

    1. Instal aplikasi iOS resmi.
    2. Opsional: konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway hanya saat menggunakan build relay khusus yang sengaja dipisahkan.
    3. Pasangkan aplikasi iOS dengan gateway dan biarkan sesi node maupun operator terhubung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest beserta tanda terima aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang dipasangkan.
    5. Gateway menyimpan handle relay dan izin pengiriman, lalu menggunakannya untuk `push.test`, dorongan untuk membangunkan, dan pembangkitan koneksi ulang.

    Catatan operasional:

    - Jika Anda mengalihkan aplikasi iOS ke gateway lain, hubungkan kembali aplikasi agar dapat memublikasikan pendaftaran relay baru yang terikat ke gateway tersebut.
    - Jika Anda merilis build iOS baru yang mengarah ke deployment relay lain, aplikasi memperbarui pendaftaran relay yang di-cache alih-alih menggunakan kembali asal relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` tetap berfungsi sebagai penggantian sementara melalui variabel lingkungan.
    - URL relay gateway khusus harus cocok dengan URL dasar relay yang disematkan dalam build iOS; jalur rilis App Store publik menolak penggantian URL relay iOS khusus.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi jalur darurat pengembangan khusus loopback; jangan simpan URL relay HTTP dalam konfigurasi.

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

    - `every`: string durasi (`30m`, `2h`). Atur `0m` untuk menonaktifkan. Default: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`)
    - `directPolicy`: `allow` (default) atau `block` untuk target Heartbeat bergaya DM
    - Lihat [Heartbeat](/id/gateway/heartbeat) untuk panduan lengkap.

  </Accordion>

  <Accordion title="Konfigurasikan tugas Cron">
    ```json5
    {
      cron: {
        enabled: true,
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: pangkas sesi eksekusi terisolasi yang telah selesai dari baris sesi SQLite (default `24h`; atur `false` untuk menonaktifkan).
    - Riwayat eksekusi secara otomatis menyimpan 2000 baris terminal terbaru per tugas; baris yang hilang tetap mempertahankan jangka waktu pembersihan 24 jam.
    - Lihat [Tugas Cron](/id/automation/cron-jobs) untuk ikhtisar fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Siapkan Webhook (hook)">
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
    - Gunakan `hooks.token` khusus; jangan gunakan kembali rahasia autentikasi Gateway yang aktif (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Autentikasi hook hanya melalui header (`Authorization: Bearer ...` atau `x-openclaw-token`); token string kueri ditolak.
    - `hooks.path` tidak boleh berupa `/`; pertahankan ingress Webhook pada subjalur khusus seperti `/hooks`.
    - Biarkan flag pengabaian konten tidak aman tetap dinonaktifkan (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), kecuali saat melakukan debugging dengan cakupan yang sangat ketat.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, atur juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agen yang digerakkan oleh hook, utamakan tingkat model modern yang kuat dan kebijakan alat yang ketat (misalnya hanya olah pesan ditambah sandboxing jika memungkinkan).

    Lihat [referensi lengkap](/id/gateway/configuration-reference#hooks) untuk semua opsi pemetaan dan integrasi Gmail.

  </Accordion>

  <Accordion title="Konfigurasikan perutean multiagen">
    Jalankan beberapa agen terisolasi dengan ruang kerja dan sesi terpisah:

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

    Lihat [Multiagen](/id/concepts/multi-agent) dan [referensi lengkap](/id/gateway/config-agents#multi-agent-routing) untuk aturan pengikatan dan profil akses per agen.

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

    - **Satu file**: menggantikan objek yang memuatnya
    - **Array file**: digabungkan secara mendalam sesuai urutan (yang lebih akhir menang), hingga kedalaman 10 tingkat bertingkat
    - **Kunci sejajar**: digabungkan setelah penyertaan (menimpa nilai yang disertakan)
    - **Jalur relatif**: diresolusikan relatif terhadap file yang menyertakan
    - **Format jalur**: jalur penyertaan tidak boleh berisi byte null dan panjangnya harus benar-benar kurang dari 4096 karakter sebelum maupun sesudah resolusi
    - **Penulisan milik OpenClaw**: ketika suatu penulisan hanya mengubah satu bagian tingkat teratas
      yang didukung oleh penyertaan satu file seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui file yang disertakan tersebut dan membiarkan `openclaw.json` tetap utuh
    - **Penulisan tembus yang tidak didukung**: penyertaan root, array penyertaan, dan penyertaan
      dengan penggantian sejajar akan gagal secara tertutup untuk penulisan milik OpenClaw, alih-alih
      meratakan konfigurasi
    - **Pembatasan**: jalur `$include` harus diresolusikan di bawah direktori yang menyimpan
      `openclaw.json`. Untuk berbagi struktur direktori antar mesin atau pengguna, atur
      `OPENCLAW_INCLUDE_ROOTS` ke daftar jalur (`:` di POSIX, `;` di Windows) berisi
      direktori tambahan yang boleh dirujuk oleh penyertaan. Symlink diresolusikan
      dan diperiksa kembali, sehingga jalur yang secara leksikal berada dalam direktori konfigurasi tetapi
      target sebenarnya keluar dari setiap root yang diizinkan tetap ditolak.
    - **Penanganan kesalahan**: kesalahan yang jelas untuk file yang tidak ditemukan, kesalahan penguraian, penyertaan melingkar, format jalur tidak valid, dan panjang berlebihan

  </Accordion>
</AccordionGroup>

## Muat ulang konfigurasi secara langsung

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis—sebagian besar pengaturan tidak memerlukan mulai ulang manual.

Pengeditan file langsung dianggap tidak tepercaya hingga berhasil divalidasi. Pemantau menunggu
aktivitas penulisan sementara/penggantian nama oleh editor mereda, membaca file akhir, dan menolak
pengeditan eksternal yang tidak valid tanpa menulis ulang `openclaw.json`. Penulisan konfigurasi
milik OpenClaw menggunakan gerbang skema yang sama sebelum menulis (lihat [Validasi ketat](#strict-validation)
untuk aturan penimpaan/pemulihan yang berlaku pada setiap penulisan).

Jika Anda melihat `config reload skipped (invalid config)` atau proses mulai melaporkan `Invalid
config`, periksa konfigurasi, jalankan `openclaw config validate`, lalu jalankan `openclaw
doctor --fix` untuk memperbaikinya. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config)
untuk daftar periksa.

### Mode muat ulang

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Langsung menerapkan perubahan aman. Secara otomatis memulai ulang untuk perubahan kritis.           |
| **`hot`**              | Hanya menerapkan perubahan aman secara langsung. Mencatat peringatan saat mulai ulang diperlukan—Anda yang menanganinya. |
| **`restart`**          | Memulai ulang Gateway pada setiap perubahan konfigurasi, baik aman maupun tidak.                                 |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada mulai ulang manual berikutnya.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Yang diterapkan langsung dibandingkan yang memerlukan mulai ulang

Sebagian besar bidang menerapkan perubahan secara langsung tanpa waktu henti; beberapa bagian yang diterapkan langsung hanya memulai ulang
subsistem tersebut (saluran, cron, heartbeat, pemantau kesehatan), bukan seluruh Gateway. Dalam
mode `hybrid`, perubahan yang memerlukan mulai ulang Gateway ditangani secara otomatis.

| Kategori            | Bidang                                                                  | Perlu memulai ulang Gateway?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Saluran            | `channels.*`, `web` (WhatsApp) - semua saluran bawaan dan Plugin       | Tidak (memulai ulang saluran tersebut)   |
| Agen & model      | `agent`, `agents`, `models`, `routing`                                  | Tidak                           |
| Otomatisasi          | `hooks`, `cron`, `agent.heartbeat`                                      | Tidak (memulai ulang subsistem tersebut) |
| Sesi & pesan | `session`, `messages`                                                   | Tidak                           |
| Alat & media       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Tidak                           |
| Konfigurasi Plugin       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Tidak (memuat ulang runtime Plugin)  |
| UI & lainnya           | `ui`, `logging`, `identity`, `bindings`                                 | Tidak                           |
| Server Gateway      | `gateway.*` (port, pengikatan, autentikasi, tailscale, TLS, HTTP, push)              | **Ya**                      |
| Infrastruktur      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Ya**                      |

<Note>
`gateway.reload` dan `gateway.remote` merupakan pengecualian dalam `gateway.*` - mengubahnya **tidak** memicu mulai ulang. Setiap Plugin juga dapat mengesampingkan tabel ini: Plugin yang dimuat dapat mendeklarasikan prefiks konfigurasinya sendiri yang memicu mulai ulang (misalnya, Plugin Canvas yang disertakan memulai ulang Gateway untuk `plugins.enabled`, `plugins.allow`, dan `plugins.deny`, bukan hanya `plugins.entries.canvas` miliknya sendiri), sehingga perilaku sebenarnya bergantung pada Plugin yang aktif.
</Note>

### Perencanaan pemuatan ulang

Saat Anda mengedit berkas sumber yang dirujuk melalui `$include`, OpenClaw merencanakan
pemuatan ulang berdasarkan tata letak yang dibuat di sumber, bukan tampilan dalam memori yang telah diratakan.
Hal ini menjaga keputusan pemuatan ulang langsung (penerapan langsung dibandingkan mulai ulang) tetap dapat diprediksi, bahkan saat
satu bagian tingkat atas berada dalam berkas penyertaan tersendiri seperti
`plugins: { $include: "./plugins.json5" }`. Perencanaan pemuatan ulang gagal secara tertutup jika
tata letak sumber ambigu.

## RPC konfigurasi (pembaruan terprogram)

Untuk alat yang menulis konfigurasi melalui API gateway, utamakan alur berikut:

- `config.schema.lookup` untuk memeriksa satu subpohon (simpul skema dangkal + ringkasan
  turunan)
- `config.get` untuk mengambil snapshot saat ini beserta `hash`
- `config.patch` untuk pembaruan parsial (patch penggabungan JSON: objek digabungkan, `null`
  menghapus, array diganti saat dikonfirmasi secara eksplisit dengan `replacePaths` jika
  entri akan dihapus)
- `config.apply` hanya saat Anda bermaksud mengganti seluruh konfigurasi
- `update.run` untuk pembaruan mandiri eksplisit beserta mulai ulang; sertakan `continuationMessage` jika sesi setelah mulai ulang harus menjalankan satu giliran tindak lanjut
- `update.status` untuk memeriksa sentinel mulai ulang pembaruan terbaru dan memverifikasi versi yang berjalan setelah mulai ulang

Agen harus menggunakan `config.schema.lookup` sebagai tujuan pertama untuk dokumentasi
dan batasan tingkat bidang yang tepat. Gunakan [Referensi konfigurasi](/id/gateway/configuration-reference)
saat memerlukan peta konfigurasi yang lebih luas, nilai default, atau tautan ke referensi
subsistem khusus.

<Note>
Penulisan bidang kontrol (`config.apply`, `config.patch`, `update.run`)
dibatasi hingga 30 permintaan per 60 detik, per metode, per
`deviceId+clientIp`; lihat [Pembatasan laju](/id/gateway/security/rate-limiting). Permintaan mulai ulang
digabungkan, lalu memberlakukan masa tunggu 30 detik di antara siklus mulai ulang.
`update.status` bersifat hanya-baca tetapi terbatas untuk admin karena sentinel mulai ulang dapat
menyertakan ringkasan langkah pembaruan dan bagian akhir keluaran perintah.
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
`note`, dan `restartDelayMs`. `baseHash` diperlukan untuk kedua metode setelah
berkas konfigurasi sudah tersedia (penulisan pertama tanpa konfigurasi yang sudah ada melewati pemeriksaan).

`config.patch` juga menerima `replacePaths`, yaitu array jalur konfigurasi yang penggantian
array-nya disengaja. Jika patch akan mengganti atau menghapus array yang sudah ada
dengan entri lebih sedikit, Gateway menolak penulisan kecuali jalur yang tepat tersebut tercantum
dalam `replacePaths`; array bertingkat di bawah entri array menggunakan `[]`, seperti
`agents.list[].skills`. Hal ini mencegah snapshot `config.get` yang terpotong
menimpa array perutean atau daftar izin secara diam-diam. Gunakan `config.apply` saat Anda
bermaksud mengganti seluruh konfigurasi.

## Variabel lingkungan

OpenClaw membaca variabel lingkungan dari proses induk serta:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua berkas tersebut tidak mengesampingkan variabel lingkungan yang sudah ada. Anda juga dapat menetapkan variabel lingkungan sebaris dalam konfigurasi:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Impor lingkungan shell (opsional)">
  Jika diaktifkan dan kunci yang diharapkan belum ditetapkan, OpenClaw menjalankan shell login Anda dan hanya mengimpor kunci yang belum ada:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Padanan variabel lingkungan: `OPENCLAW_LOAD_SHELL_ENV=1`. `timeoutMs` default: `15000`.
</Accordion>

<Accordion title="Substitusi variabel lingkungan dalam nilai konfigurasi">
  Rujuk variabel lingkungan dalam nilai string konfigurasi apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Aturan:

- Hanya nama huruf besar yang dicocokkan: `[A-Z_][A-Z0-9_]*`
- Variabel yang tidak ada/kosong memunculkan kesalahan saat pemuatan
- Loloskan dengan `$${VAR}` untuk keluaran literal
- Berfungsi di dalam berkas `$include`
- Substitusi sebaris: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referensi rahasia (lingkungan, berkas, eksekusi)">
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

Detail SecretRef (termasuk `secrets.providers` untuk `env`/`file`/`exec`) tersedia di [Pengelolaan rahasia](/id/gateway/secrets).
Jalur kredensial yang didukung tercantum di [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Accordion>

Lihat [Lingkungan](/id/help/environment) untuk presedensi dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap setiap bidang, lihat **[Referensi Konfigurasi](/id/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Referensi Konfigurasi](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
- [Panduan operasional Gateway](/id/gateway)
