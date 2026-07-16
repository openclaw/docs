---
read_when:
    - Menyiapkan OpenClaw untuk pertama kalinya
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-07-16T18:04:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 mendukung komentar dan koma di akhir">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`. Jika file tidak ada, OpenClaw menggunakan nilai default yang aman.

Jalur konfigurasi aktif harus berupa file biasa. Penulisan yang dimiliki OpenClaw menggantinya secara atomik (mengganti nama ke jalur tersebut), sehingga target `openclaw.json` yang berupa symlink akan diganti alih-alih ditulisi melalui symlink tersebut—hindari tata letak konfigurasi yang menggunakan symlink. Jika Anda menyimpan konfigurasi di luar direktori status default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file sebenarnya.

Alasan umum untuk menambahkan konfigurasi:

- Hubungkan channel dan kendalikan siapa yang dapat mengirim pesan ke bot
- Atur model, alat, sandboxing, atau otomatisasi (cron, hook)
- Sesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap bidang yang tersedia.

Agen dan otomatisasi harus menggunakan `config.schema.lookup` untuk dokumentasi
tingkat bidang yang tepat sebelum mengedit konfigurasi. Gunakan halaman ini untuk panduan berorientasi tugas dan
[Referensi konfigurasi](/id/gateway/configuration-reference) untuk peta bidang dan nilai default
yang lebih luas.

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
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Config**.
    UI Kontrol merender formulir dari skema konfigurasi aktif, termasuk metadata dokumentasi bidang
    `title` / `description` serta skema plugin dan channel jika
    tersedia, dengan editor **Raw JSON** sebagai jalan keluar. Untuk UI
    penelusuran mendalam dan alat lainnya, Gateway juga menyediakan `config.schema.lookup` untuk
    mengambil satu node skema yang dibatasi jalur beserta ringkasan turunan langsungnya.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file tersebut dan menerapkan perubahan secara otomatis (lihat [pemuatan ulang langsung](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Kunci yang tidak dikenal, tipe yang salah format, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk dimulai**. Satu-satunya pengecualian tingkat akar adalah `$schema` (string), sehingga editor dapat melampirkan metadata Skema JSON.
</Warning>

`openclaw config schema` mencetak Skema JSON kanonis yang digunakan oleh UI Kontrol
dan validasi. `config.schema.lookup` mengambil satu node yang dibatasi jalur beserta
ringkasan turunannya untuk alat penelusuran mendalam. Metadata dokumentasi bidang `title`/`description`
diteruskan melalui objek bertingkat, wildcard (`*`), item larik (`[]`), dan cabang `anyOf`/
`oneOf`/`allOf`. Skema plugin dan channel runtime digabungkan saat
registri manifes dimuat.

Ketika validasi gagal:

- Gateway tidak melakukan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah yang tepat
- Jalankan `openclaw doctor --fix` (`--repair` adalah flag yang sama; `--yes` melewati prompt) untuk menerapkan perbaikan

Gateway menyimpan salinan tepercaya terakhir yang diketahui baik setelah setiap startup yang berhasil,
tetapi startup dan pemuatan ulang langsung tidak memulihkannya secara otomatis—hanya `openclaw doctor --fix`
yang melakukannya. Jika `openclaw.json` gagal dalam validasi (termasuk validasi lokal plugin), startup
Gateway gagal atau pemuatan ulang dilewati dan runtime saat ini tetap menggunakan konfigurasi terakhir yang
diterima. Penulisan yang ditolak juga disimpan sebagai `<path>.rejected.<timestamp>` untuk diperiksa.
Gateway memblokir penulisan yang tampak seperti penimpaan tidak sengaja—menghapus `gateway.mode`,
kehilangan blok `meta`, atau mengecilkan file lebih dari setengah—kecuali penulisan tersebut
secara eksplisit mengizinkan perubahan destruktif. Promosi menjadi salinan terakhir yang diketahui baik dilewati ketika
kandidat berisi placeholder rahasia yang telah disunting seperti `***` atau `[redacted]`.

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

    - `agents.defaults.models` menentukan katalog model dan berfungsi sebagai daftar izin untuk `/model`; entri `provider/*` memfilter `/model`, `/models`, dan pemilih model ke penyedia yang dipilih sambil tetap menggunakan penemuan model dinamis.
    - Gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri daftar izin tanpa menghapus model yang ada. Penggantian biasa yang akan menghapus entri ditolak kecuali Anda meneruskan `--replace`.
    - Referensi model menggunakan format `provider/model` (misalnya `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol penurunan skala gambar transkrip/alat (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan token visi pada proses yang banyak menggunakan tangkapan layar.
    - Lihat [CLI Model](/id/concepts/models) untuk mengganti model dalam chat dan [Failover Model](/id/concepts/model-failover) untuk rotasi autentikasi dan perilaku fallback.
    - Untuk penyedia khusus/yang di-host sendiri, lihat [Penyedia khusus](/id/gateway/config-tools#custom-providers-and-base-urls) dalam referensi.

  </Accordion>

  <Accordion title="Mengendalikan siapa yang dapat mengirim pesan ke bot">
    Akses DM dikendalikan per channel melalui `dmPolicy` (default `"pairing"`):

    - `"pairing"`: pengirim yang tidak dikenal mendapatkan kode pemasangan satu kali untuk disetujui
    - `"allowlist"`: hanya pengirim dalam `allowFrom` (atau penyimpanan izin yang telah dipasangkan)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` (`"allowlist" | "open" | "disabled"`) serta `groupAllowFrom` atau daftar izin khusus channel.

    Lihat [referensi lengkap](/id/gateway/config-channels#dm-and-group-access) untuk detail per channel.

  </Accordion>

  <Accordion title="Menyiapkan gerbang sebutan chat grup">
    Pesan grup secara default **memerlukan sebutan**. Konfigurasikan pola pemicu per agen. Balasan grup/channel normal diposting secara otomatis; pilih jalur alat pesan untuk ruang bersama tempat agen harus memutuskan kapan akan berbicara:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // atur "message_tool" agar pengiriman alat pesan diwajibkan di semua tempat
        groupChat: {
          visibleReplies: "message_tool", // pilihan aktif; keluaran yang terlihat memerlukan message(action=send)
          unmentionedInbound: "room_event", // percakapan grup selalu aktif tanpa sebutan menjadi konteks senyap
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

    - **Sebutan metadata**: @-mention native (ketuk untuk menyebut di WhatsApp, @bot di Telegram, dll.)
    - **Pola teks**: pola regex aman dalam `mentionPatterns`
    - **Balasan terlihat**: `messages.visibleReplies` dapat mewajibkan pengiriman alat pesan secara global; `messages.groupChat.visibleReplies` menimpanya untuk grup/channel.
    - Lihat [referensi lengkap](/id/gateway/config-channels#group-chat-mention-gating) untuk mode balasan terlihat, penggantian per channel, dan mode chat mandiri.

  </Accordion>

  <Accordion title="Membatasi Skills per agen">
    Gunakan `agents.defaults.skills` untuk acuan bersama, lalu timpa agen tertentu
    dengan `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // mewarisi github, weather
          { id: "docs", skills: ["docs-search"] }, // mengganti nilai default
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

  <Accordion title="Menyesuaikan pemantauan kesehatan channel Gateway">
    Kendalikan seberapa agresif Gateway memulai ulang channel yang tampak tidak aktif:

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

    - Nilai yang ditampilkan adalah nilai default. Atur `gateway.channelHealthCheckMinutes: 0` untuk menonaktifkan mulai ulang pemantau kesehatan secara global.
    - `channelStaleEventThresholdMinutes` harus lebih besar dari atau sama dengan interval pemeriksaan.
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan mulai ulang otomatis bagi satu channel atau akun tanpa menonaktifkan pemantau global.
    - Lihat [Pemeriksaan Kesehatan](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua bidang.

  </Accordion>

  <Accordion title="Menyesuaikan batas waktu handshake WebSocket Gateway">
    Beri klien lokal lebih banyak waktu untuk menyelesaikan handshake WebSocket praautentikasi pada
    host yang sedang terbebani atau berdaya rendah:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Nilai default adalah `15000` milidetik.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tetap diprioritaskan untuk penggantian sementara per layanan atau shell.
    - Utamakan memperbaiki kemacetan saat startup/loop peristiwa terlebih dahulu; pengaturan ini ditujukan untuk host yang sehat tetapi lambat selama pemanasan.

  </Accordion>

  <Accordion title="Konfigurasikan sesi dan pengaturan ulang">
    Sesi mengontrol kontinuitas dan isolasi percakapan:

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
    - Lihat [Pengelolaan Sesi](/id/concepts/session) untuk cakupan, tautan identitas, dan kebijakan pengiriman.
    - Lihat [referensi lengkap](/id/gateway/config-agents#session) untuk semua bidang.

  </Accordion>

  <Accordion title="Aktifkan sandbox">
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

    Bangun citra terlebih dahulu—dari checkout sumber, jalankan `scripts/sandbox-setup.sh`, atau dari instalasi npm, lihat perintah inline `docker build` di [Sandbox § Citra dan penyiapan](/id/gateway/sandboxing#images-and-setup).

    Lihat [Sandbox](/id/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/id/gateway/config-agents#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Aktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay untuk build App Store publik menggunakan relay OpenClaw yang di-host: `https://ios-push-relay.openclaw.ai`.

    Deployment relay khusus memerlukan jalur build/deployment iOS yang sengaja dipisahkan dan URL relay-nya cocok dengan URL relay gateway. Jika menggunakan build relay khusus, atur ini dalam konfigurasi gateway:

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

    - Memungkinkan gateway mengirim `push.test`, dorongan untuk membangunkan, dan pembangkitan saat penyambungan ulang melalui relay eksternal.
    - Menggunakan izin pengiriman dengan cakupan pendaftaran yang diteruskan oleh aplikasi iOS yang dipasangkan. Gateway tidak memerlukan token relay untuk seluruh deployment.
    - Mengikat setiap pendaftaran berbasis relay ke identitas gateway yang dipasangkan dengan aplikasi iOS, sehingga gateway lain tidak dapat menggunakan kembali pendaftaran yang tersimpan.
    - Mempertahankan APNs langsung untuk build iOS lokal/manual. Pengiriman berbasis relay hanya berlaku untuk build yang didistribusikan secara resmi dan didaftarkan melalui relay.
    - Harus cocok dengan URL dasar relay yang ditanamkan dalam build iOS agar lalu lintas pendaftaran dan pengiriman mencapai deployment relay yang sama.

    Alur menyeluruh:

    1. Instal aplikasi iOS resmi.
    2. Opsional: konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway hanya saat menggunakan build relay khusus yang sengaja dipisahkan.
    3. Pasangkan aplikasi iOS dengan gateway dan biarkan sesi node maupun operator terhubung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest beserta tanda terima aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang dipasangkan.
    5. Gateway menyimpan handel relay dan izin pengiriman, lalu menggunakannya untuk `push.test`, dorongan untuk membangunkan, dan pembangkitan saat penyambungan ulang.

    Catatan operasional:

    - Jika aplikasi iOS dialihkan ke gateway lain, sambungkan kembali aplikasi agar dapat memublikasikan pendaftaran relay baru yang terikat ke gateway tersebut.
    - Jika Anda merilis build iOS baru yang mengarah ke deployment relay lain, aplikasi akan menyegarkan pendaftaran relay dalam cache alih-alih menggunakan kembali asal relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` tetap berfungsi sebagai penggantian sementara melalui variabel lingkungan.
    - URL relay gateway khusus harus cocok dengan URL dasar relay yang ditanamkan dalam build iOS; jalur rilis App Store publik menolak penggantian URL relay iOS khusus.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi jalan keluar pengembangan khusus loopback; jangan simpan URL relay HTTP dalam konfigurasi.

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
        maxConcurrentRuns: 8, // default; pengiriman cron + eksekusi giliran agen cron yang terisolasi
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: pangkas sesi eksekusi terisolasi yang telah selesai dari baris sesi SQLite (default `24h`; atur `false` untuk menonaktifkan).
    - Riwayat eksekusi secara otomatis menyimpan 2000 baris terminal terbaru per tugas; baris yang hilang tetap mempertahankan jendela pembersihan 24 jam.
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
    - Biarkan flag pengabaian konten tidak aman tetap dinonaktifkan (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), kecuali saat melakukan debug dengan cakupan ketat.
    - Jika mengaktifkan `hooks.allowRequestSessionKey`, atur juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agen yang dipicu oleh hook, utamakan tingkatan model modern yang tangguh dan kebijakan alat yang ketat (misalnya hanya perpesanan ditambah sandbox jika memungkinkan).

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

    - **File tunggal**: menggantikan objek yang memuatnya
    - **Larik file**: digabungkan secara mendalam sesuai urutan (yang belakangan menang), hingga kedalaman 10 tingkat bersarang
    - **Kunci sejajar**: digabungkan setelah penyertaan (menggantikan nilai yang disertakan)
    - **Jalur relatif**: diuraikan relatif terhadap file yang menyertakan
    - **Format jalur**: jalur penyertaan tidak boleh memuat byte null dan panjangnya harus benar-benar kurang dari 4096 karakter sebelum maupun sesudah resolusi
    - **Penulisan milik OpenClaw**: ketika suatu penulisan hanya mengubah satu bagian tingkat teratas
      yang didukung oleh penyertaan satu file seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui file yang disertakan tersebut dan membiarkan `openclaw.json` tetap utuh
    - **Penerusan penulisan yang tidak didukung**: penyertaan root, larik penyertaan, dan penyertaan
      dengan penggantian sejajar akan gagal secara tertutup untuk penulisan milik OpenClaw alih-alih
      meratakan konfigurasi
    - **Pembatasan**: jalur `$include` harus diuraikan di bawah direktori yang memuat
      `openclaw.json`. Untuk berbagi hierarki antar mesin atau pengguna, atur
      `OPENCLAW_INCLUDE_ROOTS` ke daftar jalur (`:` pada POSIX, `;` pada Windows) berisi
      direktori tambahan yang boleh dirujuk oleh penyertaan. Symlink diuraikan
      dan diperiksa ulang, sehingga jalur yang secara leksikal berada dalam direktori konfigurasi tetapi
      target sebenarnya keluar dari setiap root yang diizinkan tetap ditolak.
    - **Penanganan kesalahan**: kesalahan yang jelas untuk file yang tidak ada, kesalahan penguraian, penyertaan melingkar, format jalur tidak valid, dan panjang berlebihan

  </Accordion>
</AccordionGroup>

## Muat ulang konfigurasi secara langsung

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis—sebagian besar pengaturan tidak memerlukan mulai ulang manual.

Pengeditan file secara langsung dianggap tidak tepercaya hingga lolos validasi. Pemantau menunggu
perubahan file sementara/penggantian nama dari editor mereda, membaca file akhir, dan menolak
pengeditan eksternal yang tidak valid tanpa menulis ulang `openclaw.json`. Penulisan konfigurasi
milik OpenClaw menggunakan gerbang skema yang sama sebelum menulis (lihat [Validasi ketat](#strict-validation)
untuk aturan penimpaan/pemulihan yang berlaku pada setiap penulisan).

Jika Anda melihat `config reload skipped (invalid config)` atau startup melaporkan `Invalid
config`, periksa konfigurasi, jalankan `openclaw config validate`, lalu jalankan `openclaw
doctor --fix` untuk memperbaikinya. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config)
untuk daftar periksa.

### Mode muat ulang

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (bawaan) | Menerapkan perubahan aman secara langsung tanpa restart. Memulai ulang secara otomatis untuk perubahan kritis.           |
| **`hot`**              | Hanya menerapkan perubahan aman secara langsung tanpa restart. Mencatat peringatan ketika restart diperlukan—Anda yang menanganinya. |
| **`restart`**          | Memulai ulang Gateway setiap kali ada perubahan konfigurasi, baik aman maupun tidak.                                 |
| **`off`**              | Menonaktifkan pemantauan berkas. Perubahan berlaku pada restart manual berikutnya.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Perubahan yang langsung diterapkan vs. yang memerlukan restart

Sebagian besar bidang langsung diterapkan tanpa waktu henti; beberapa bagian yang langsung diterapkan hanya memulai ulang
subsistem tersebut (saluran, cron, heartbeat, pemantau kesehatan), bukan seluruh Gateway. Dalam
mode `hybrid`, perubahan yang memerlukan restart Gateway ditangani secara otomatis.

| Kategori            | Bidang                                                                  | Perlu restart Gateway?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Saluran            | `channels.*`, `web` (WhatsApp)—semua saluran bawaan dan Plugin       | Tidak (memulai ulang saluran tersebut)   |
| Agen & model      | `agent`, `agents`, `models`, `routing`                                  | Tidak                           |
| Otomatisasi          | `hooks`, `cron`, `agent.heartbeat`                                      | Tidak (memulai ulang subsistem tersebut) |
| Sesi & pesan | `session`, `messages`                                                   | Tidak                           |
| Alat & media       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Tidak                           |
| Konfigurasi Plugin       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Tidak (memuat ulang runtime Plugin)  |
| UI & lain-lain           | `ui`, `logging`, `identity`, `bindings`                                 | Tidak                           |
| Server Gateway      | `gateway.*` (port, pengikatan, autentikasi, tailscale, TLS, HTTP, push)              | **Ya**                      |
| Infrastruktur      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Ya**                      |

<Note>
`gateway.reload` dan `gateway.remote` merupakan pengecualian di bawah `gateway.*`—mengubahnya **tidak** memicu restart. Setiap Plugin juga dapat mengganti tabel ini: Plugin yang dimuat dapat mendeklarasikan prefiks konfigurasinya sendiri yang memicu restart (misalnya, Plugin Canvas bawaan memulai ulang Gateway untuk `plugins.enabled`, `plugins.allow`, dan `plugins.deny`, bukan hanya `plugins.entries.canvas` miliknya sendiri), sehingga perilaku sebenarnya bergantung pada Plugin yang aktif.
</Note>

### Perencanaan pemuatan ulang

Saat Anda mengedit berkas sumber yang dirujuk melalui `$include`, OpenClaw merencanakan
pemuatan ulang berdasarkan tata letak yang ditulis dalam sumber, bukan tampilan dalam memori yang telah diratakan.
Hal ini menjaga agar keputusan pemuatan ulang langsung (penerapan langsung vs. restart) tetap dapat diprediksi, bahkan ketika
satu bagian tingkat atas berada dalam berkas tersertakan tersendiri seperti
`plugins: { $include: "./plugins.json5" }`. Perencanaan pemuatan ulang gagal secara tertutup jika
tata letak sumber ambigu.

## RPC konfigurasi (pembaruan terprogram)

Untuk alat yang menulis konfigurasi melalui API Gateway, utamakan alur berikut:

- `config.schema.lookup` untuk memeriksa satu subpohon (Node skema dangkal + ringkasan
  turunan)
- `config.get` untuk mengambil snapshot saat ini beserta `hash`
- `config.patch` untuk pembaruan parsial (patch penggabungan JSON: objek digabungkan, `null`
  menghapus, array diganti ketika dikonfirmasi secara eksplisit dengan `replacePaths` jika
  entri akan dihapus)
- `config.apply` hanya ketika Anda bermaksud mengganti seluruh konfigurasi
- `update.run` untuk pembaruan mandiri eksplisit beserta restart; sertakan `continuationMessage` ketika sesi setelah restart harus menjalankan satu giliran tindak lanjut
- `update.status` untuk memeriksa penanda restart pembaruan terbaru dan memverifikasi versi yang berjalan setelah restart

Agen harus menggunakan `config.schema.lookup` sebagai rujukan pertama untuk dokumentasi dan batasan
tingkat bidang yang tepat. Gunakan [referensi konfigurasi](/id/gateway/configuration-reference)
ketika memerlukan peta konfigurasi yang lebih luas, nilai bawaan, atau tautan ke referensi
subsistem khusus.

<Note>
Penulisan bidang kendali (`config.apply`, `config.patch`, `update.run`)
dibatasi hingga 3 permintaan per 60 detik per `deviceId+clientIp`. Permintaan
restart digabungkan lalu memberlakukan masa jeda 30 detik di antara siklus restart.
`update.status` hanya-baca, tetapi dibatasi untuk admin karena penanda restart dapat
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
`note`, dan `restartDelayMs`. `baseHash` diwajibkan untuk kedua metode setelah
berkas konfigurasi sudah ada (penulisan pertama tanpa konfigurasi yang sudah ada melewati pemeriksaan tersebut).

`config.patch` juga menerima `replacePaths`, sebuah array berisi jalur konfigurasi yang penggantian
array-nya disengaja. Jika patch akan mengganti atau menghapus array yang sudah ada
dengan jumlah entri lebih sedikit, Gateway menolak penulisan kecuali jalur yang tepat tersebut tercantum
dalam `replacePaths`; array bersarang di bawah entri array menggunakan `[]`, seperti
`agents.list[].skills`. Hal ini mencegah snapshot `config.get` yang terpotong
menimpa array perutean atau daftar izin secara diam-diam. Gunakan `config.apply` ketika Anda
bermaksud mengganti seluruh konfigurasi.

## Variabel lingkungan

OpenClaw membaca variabel lingkungan dari proses induk serta:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua berkas tersebut tidak mengganti variabel lingkungan yang sudah ada. Anda juga dapat menetapkan variabel lingkungan langsung dalam konfigurasi:

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

Variabel lingkungan yang setara: `OPENCLAW_LOAD_SHELL_ENV=1`. `timeoutMs` bawaan: `15000`.
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
- Substitusi langsung: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Detail SecretRef (termasuk `secrets.providers` untuk `env`/`file`/`exec`) tersedia di [Pengelolaan Rahasia](/id/gateway/secrets).
Jalur kredensial yang didukung tercantum dalam [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Accordion>

Lihat [Lingkungan](/id/help/environment) untuk presedensi dan sumber selengkapnya.

## Referensi lengkap

Untuk referensi lengkap setiap bidang, lihat **[Referensi Konfigurasi](/id/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Referensi Konfigurasi](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
- [Panduan operasional Gateway](/id/gateway)
