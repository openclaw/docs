---
read_when:
    - Menyiapkan OpenClaw untuk pertama kalinya
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-07-19T04:56:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0fa0f0cd54052ebb3a2aa4cd5600d7bdcb65a0a499a07d7e62496ee23464afdd
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 mendukung komentar dan koma di akhir">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`. Jika file tersebut tidak ada, OpenClaw menggunakan nilai default yang aman.

Jalur konfigurasi aktif harus berupa file biasa. Penulisan milik OpenClaw menggantinya secara atomik (mengganti nama ke jalur tersebut), sehingga target `openclaw.json` yang berupa tautan simbolis akan diganti alih-alih ditulisi melalui tautan tersebut—hindari tata letak konfigurasi dengan tautan simbolis. Jika konfigurasi disimpan di luar direktori status default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file sebenarnya.

Alasan umum untuk menambahkan konfigurasi:

- Hubungkan kanal dan kendalikan siapa yang dapat mengirim pesan ke bot
- Atur model, alat, sandboxing, atau otomatisasi (cron, hook)
- Sesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap kolom yang tersedia.

Agen dan otomatisasi harus menggunakan `config.schema.lookup` untuk dokumentasi
tingkat kolom yang presisi sebelum mengedit konfigurasi. Gunakan halaman ini untuk panduan berorientasi tugas dan
[Referensi konfigurasi](/id/gateway/configuration-reference) untuk pemetaan kolom
dan nilai default yang lebih luas.

<Tip>
**Baru mengenal konfigurasi?** Mulailah dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Contoh Konfigurasi](/id/gateway/configuration-examples) untuk konfigurasi lengkap yang siap disalin dan ditempel.
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
    kolom `title` / `description` serta skema plugin dan kanal jika
    tersedia, dengan editor **JSON Mentah** sebagai jalan keluar. Untuk UI
    penelusuran mendalam dan alat lainnya, Gateway juga menyediakan `config.schema.lookup` untuk
    mengambil satu node skema bercakupan jalur beserta ringkasan anak langsungnya.
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
dan validasi. `config.schema.lookup` mengambil satu node bercakupan jalur beserta
ringkasan anak untuk alat penelusuran mendalam. Metadata dokumentasi kolom `title`/`description`
diteruskan melalui objek bersarang, wildcard (`*`), item larik (`[]`), dan cabang `anyOf`/
`oneOf`/`allOf`. Skema plugin dan kanal waktu proses digabungkan ketika
registri manifes dimuat.

Ketika validasi gagal:

- Gateway tidak melakukan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah secara presisi
- Jalankan `openclaw doctor --fix` (`--repair` adalah flag yang sama; `--yes` melewati perintah konfirmasi) untuk menerapkan perbaikan

Gateway menyimpan salinan tepercaya terakhir yang diketahui baik setelah setiap proses mulai yang berhasil,
tetapi proses mulai dan pemuatan ulang langsung tidak memulihkannya secara otomatis—hanya `openclaw doctor --fix`
yang melakukannya. Jika `openclaw.json` gagal divalidasi (termasuk validasi lokal plugin), proses
mulai Gateway gagal atau pemuatan ulang dilewati dan waktu proses saat ini mempertahankan
konfigurasi terakhir yang diterima. Penulisan yang ditolak juga disimpan sebagai `<path>.rejected.<timestamp>` untuk diperiksa.
Gateway memblokir penulisan yang tampak seperti penimpaan tidak disengaja—menghapus `gateway.mode`,
menghilangkan blok `meta`, atau memperkecil file lebih dari setengah—kecuali penulisan tersebut
secara eksplisit mengizinkan perubahan destruktif. Promosi menjadi salinan terakhir yang diketahui baik dilewati ketika
kandidat berisi placeholder rahasia yang disunting seperti `***` atau `[redacted]`.

## Tugas umum

<AccordionGroup>
  <Accordion title="Siapkan kanal (WhatsApp, Telegram, Discord, dan sebagainya)">
    Setiap kanal memiliki bagian konfigurasinya sendiri di bawah `channels.<provider>`. Lihat halaman khusus kanal untuk langkah penyiapan:

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

    Semua kanal menggunakan pola kebijakan DM yang sama:

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

  <Accordion title="Pilih dan konfigurasikan model">
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
    - `agents.defaults.modelPolicy.allow` adalah daftar izin eksplisit untuk penggantian dan pemilih model. Kolom ini menerima referensi persis dan wildcard `provider/*`; hilangkan atau gunakan `[]` untuk mengizinkan model apa pun.
    - Referensi model menggunakan format `provider/model` (misalnya `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengendalikan penurunan skala gambar transkrip/alat (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan token visi pada proses yang sarat tangkapan layar.
    - Lihat [CLI Model](/id/concepts/models) untuk beralih model dalam obrolan dan [Failover Model](/id/concepts/model-failover) untuk rotasi autentikasi dan perilaku fallback.
    - Untuk penyedia khusus/yang dihosting sendiri, lihat [Penyedia khusus](/id/gateway/config-tools#custom-providers-and-base-urls) dalam referensi.

  </Accordion>

  <Accordion title="Kendalikan siapa yang dapat mengirim pesan ke bot">
    Akses DM dikendalikan per kanal melalui `dmPolicy` (default `"pairing"`):

    - `"pairing"`: pengirim yang tidak dikenal mendapatkan kode pemasangan satu kali untuk disetujui
    - `"allowlist"`: hanya pengirim dalam `allowFrom` (atau penyimpanan izin yang telah dipasangkan)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` (`"allowlist" | "open" | "disabled"`) beserta `groupAllowFrom` atau daftar izin khusus kanal.

    Lihat [referensi lengkap](/id/gateway/config-channels#dm-and-group-access) untuk detail per kanal.

  </Accordion>

  <Accordion title="Siapkan pembatasan penyebutan dalam obrolan grup">
    Pesan grup secara default **memerlukan penyebutan**. Konfigurasikan pola pemicu per agen. Balasan grup/kanal normal dikirim secara otomatis; aktifkan jalur alat pesan untuk ruang bersama tempat agen harus menentukan kapan perlu berbicara:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // atur "message_tool" untuk mewajibkan pengiriman dengan alat pesan di semua tempat
        groupChat: {
          visibleReplies: "message_tool", // ikut serta; keluaran yang terlihat memerlukan message(action=send)
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

    - **Penyebutan metadata**: @-mention native (ketuk untuk menyebut di WhatsApp, @bot di Telegram, dan sebagainya)
    - **Pola teks**: pola regex aman dalam `mentionPatterns`
    - **Balasan yang terlihat**: `messages.visibleReplies` dapat mewajibkan pengiriman dengan alat pesan secara global; `messages.groupChat.visibleReplies` menggantikannya untuk grup/kanal.
    - Lihat [referensi lengkap](/id/gateway/config-channels#group-chat-mention-gating) untuk mode balasan yang terlihat, penggantian per kanal, dan mode obrolan mandiri.

  </Accordion>

  <Accordion title="Batasi Skills per agen">
    Gunakan `agents.defaults.skills` untuk dasar bersama, lalu ganti untuk agen
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

  <Accordion title="Sesuaikan pemantauan kesehatan kanal Gateway">
    Kendalikan seberapa agresif Gateway memulai ulang kanal yang tampak tidak aktif:

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

    - Nilai yang ditampilkan adalah nilai default. Atur `gateway.channelHealthCheckMinutes: 0` untuk menonaktifkan proses mulai ulang oleh pemantau kesehatan secara global.
    - `channelStaleEventThresholdMinutes` harus lebih besar dari atau sama dengan interval pemeriksaan.
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan proses mulai ulang otomatis bagi satu kanal atau akun tanpa menonaktifkan pemantau global.
    - Lihat [Pemeriksaan Kesehatan](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua kolom.

  </Accordion>

  <Accordion title="Sesuaikan batas waktu handshake WebSocket Gateway">
    Berikan waktu lebih lama kepada klien lokal untuk menyelesaikan handshake WebSocket praautentikasi pada
    host yang sibuk atau berdaya rendah:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Nilai default adalah `15000` milidetik.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tetap diutamakan untuk penggantian sementara pada layanan atau shell.
    - Utamakan memperbaiki kemacetan startup/event loop terlebih dahulu; pengaturan ini ditujukan bagi host yang sehat tetapi lambat selama pemanasan.

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
    - `threadBindings`: default global untuk perutean sesi yang terikat ke utas. `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age` mengikat, melepas ikatan, mencantumkan, dan menyesuaikan ini per sesi (Discord mengikat utas, Telegram mengikat topik/percakapan).
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

    Buat image terlebih dahulu - dari checkout sumber, jalankan `scripts/sandbox-setup.sh`, atau dari instalasi npm, lihat perintah inline `docker build` di [Sandbox § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup).

    Lihat [Sandbox](/id/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/id/gateway/config-agents#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Aktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay untuk build App Store publik menggunakan relay OpenClaw yang di-host: `https://ios-push-relay.openclaw.ai`.

    Deployment relay khusus memerlukan jalur build/deployment iOS terpisah yang sengaja dibuat dan URL relay-nya cocok dengan URL relay gateway. Jika menggunakan build relay khusus, tetapkan ini dalam konfigurasi gateway:

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

    - Memungkinkan gateway mengirim `push.test`, dorongan bangun, dan perintah bangun untuk menyambung kembali melalui relay eksternal.
    - Menggunakan izin pengiriman dengan cakupan pendaftaran yang diteruskan oleh aplikasi iOS yang dipasangkan. Gateway tidak memerlukan token relay untuk seluruh deployment.
    - Mengikat setiap pendaftaran berbasis relay ke identitas gateway yang dipasangkan dengan aplikasi iOS, sehingga gateway lain tidak dapat menggunakan kembali pendaftaran yang tersimpan.
    - Mempertahankan penggunaan APNs langsung pada build iOS lokal/manual. Pengiriman berbasis relay hanya berlaku untuk build resmi yang didistribusikan dan didaftarkan melalui relay.
    - Harus cocok dengan URL dasar relay yang disematkan dalam build iOS agar lalu lintas pendaftaran dan pengiriman mencapai deployment relay yang sama.

    Alur menyeluruh:

    1. Instal aplikasi iOS resmi.
    2. Opsional: konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway hanya saat menggunakan build relay khusus yang sengaja dibuat terpisah.
    3. Pasangkan aplikasi iOS dengan gateway dan izinkan sesi node maupun operator terhubung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest beserta tanda terima aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang dipasangkan.
    5. Gateway menyimpan handel relay dan izin pengiriman, lalu menggunakannya untuk `push.test`, dorongan bangun, dan perintah bangun untuk menyambung kembali.

    Catatan operasional:

    - Jika Anda mengalihkan aplikasi iOS ke gateway lain, sambungkan kembali aplikasi agar dapat memublikasikan pendaftaran relay baru yang terikat ke gateway tersebut.
    - Jika Anda merilis build iOS baru yang mengarah ke deployment relay lain, aplikasi memperbarui pendaftaran relay yang di-cache dan tidak menggunakan kembali asal relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` tetap berfungsi sebagai penggantian sementara melalui variabel lingkungan.
    - URL relay gateway khusus harus cocok dengan URL dasar relay yang disematkan dalam build iOS; jalur rilis App Store publik menolak penggantian URL relay iOS khusus.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi jalur darurat pengembangan khusus loopback; jangan simpan URL relay HTTP dalam konfigurasi.

    Lihat [Aplikasi iOS](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur menyeluruh dan [Alur autentikasi dan kepercayaan](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

  </Accordion>

  <Accordion title="Siapkan Heartbeat (pemeriksaan berkala)">
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

    - `every`: string durasi (`30m`, `2h`). Tetapkan `0m` untuk menonaktifkan. Default: `30m`.
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

    - `sessionRetention`: pangkas sesi proses terisolasi yang telah selesai dari baris sesi SQLite (default `24h`; tetapkan `false` untuk menonaktifkan).
    - Riwayat proses secara otomatis menyimpan 2000 baris terminal terbaru per tugas; baris yang hilang tetap memiliki jangka waktu pembersihan 24 jam.
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
    - Pertahankan flag pengabaian konten tidak aman dalam keadaan nonaktif (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali saat melakukan debugging dengan cakupan sangat terbatas.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agen yang digerakkan oleh hook, utamakan tingkat model modern yang kuat dan kebijakan alat yang ketat (misalnya hanya olah pesan ditambah sandbox jika memungkinkan).

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

  <Accordion title="Pisahkan konfigurasi menjadi beberapa berkas ($include)">
    Gunakan `$include` untuk menata konfigurasi besar:

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

    - **Satu berkas**: menggantikan objek yang memuatnya
    - **Larik berkas**: digabungkan secara mendalam sesuai urutan (yang terakhir berlaku), hingga kedalaman 10 tingkat bertumpuk
    - **Kunci sejajar**: digabungkan setelah penyertaan (menggantikan nilai yang disertakan)
    - **Jalur relatif**: diselesaikan relatif terhadap berkas yang menyertakan
    - **Format jalur**: jalur penyertaan tidak boleh mengandung byte null dan panjangnya harus benar-benar kurang dari 4096 karakter sebelum dan sesudah resolusi
    - **Penulisan milik OpenClaw**: ketika suatu penulisan hanya mengubah satu bagian tingkat teratas
      yang didukung oleh penyertaan satu berkas seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui berkas yang disertakan tersebut dan membiarkan `openclaw.json` tetap utuh
    - **Penulisan tembus yang tidak didukung**: penyertaan root, larik penyertaan, dan penyertaan
      dengan penggantian sejajar akan gagal secara tertutup untuk penulisan milik OpenClaw alih-alih
      meratakan konfigurasi
    - **Pembatasan**: jalur `$include` harus diselesaikan di bawah direktori yang menyimpan
      `openclaw.json`. Untuk berbagi suatu pohon antarmesin atau pengguna, tetapkan
      `OPENCLAW_INCLUDE_ROOTS` ke daftar jalur (`:` pada POSIX, `;` pada Windows) berisi
      direktori tambahan yang dapat dirujuk oleh penyertaan. Symlink diselesaikan
      dan diperiksa ulang, sehingga jalur yang secara leksikal berada dalam direktori konfigurasi tetapi
      target sebenarnya keluar dari semua root yang diizinkan tetap ditolak.
    - **Penanganan kesalahan**: kesalahan yang jelas untuk berkas yang hilang, kesalahan penguraian, penyertaan melingkar, format jalur yang tidak valid, dan panjang yang berlebihan

  </Accordion>
</AccordionGroup>

## Muat ulang konfigurasi secara langsung

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis - sebagian besar pengaturan tidak memerlukan mulai ulang manual.

Pengeditan berkas secara langsung dianggap tidak tepercaya sampai berhasil divalidasi. Pemantau menunggu
aktivitas penulisan sementara/penggantian nama oleh editor mereda, membaca berkas akhir, dan menolak
pengeditan eksternal yang tidak valid tanpa menulis ulang `openclaw.json`. Penulisan konfigurasi
milik OpenClaw menggunakan pemeriksaan skema yang sama sebelum menulis (lihat [Validasi ketat](#strict-validation)
untuk aturan penimpaan/pemulihan yang berlaku pada setiap penulisan).

Jika Anda melihat `config reload skipped (invalid config)` atau startup melaporkan `Invalid
config`, periksa konfigurasi, jalankan `openclaw config validate`, lalu jalankan `openclaw
doctor --fix` untuk memperbaikinya. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config)
untuk daftar periksa.

### Mode muat ulang

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan perubahan aman secara langsung tanpa restart. Otomatis memulai ulang untuk perubahan kritis.           |
| **`hot`**              | Hanya menerapkan perubahan aman secara langsung tanpa restart. Mencatat peringatan saat restart diperlukan—Anda yang menanganinya. |
| **`restart`**          | Memulai ulang Gateway pada setiap perubahan konfigurasi, baik aman maupun tidak.                                 |
| **`off`**              | Menonaktifkan pemantauan berkas. Perubahan berlaku pada restart manual berikutnya.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Perubahan yang langsung diterapkan dan yang memerlukan restart

Sebagian besar kolom langsung diterapkan tanpa waktu henti; beberapa bagian yang langsung diterapkan hanya memulai ulang
subsistem tersebut (kanal, cron, heartbeat, pemantau kesehatan), bukan seluruh Gateway. Dalam
mode `hybrid`, perubahan yang mengharuskan restart Gateway ditangani secara otomatis.

| Kategori            | Kolom                                                                  | Perlu restart Gateway?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Kanal            | `channels.*`, `web` (WhatsApp)—semua kanal bawaan dan plugin       | Tidak (memulai ulang kanal tersebut)   |
| Agen & model      | `agent`, `agents`, `models`, `routing`                                  | Tidak                           |
| Otomatisasi          | `hooks`, `cron`, `agent.heartbeat`                                      | Tidak (memulai ulang subsistem tersebut) |
| Sesi & pesan | `session`, `messages`                                                   | Tidak                           |
| Alat & media       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Tidak                           |
| Konfigurasi plugin       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Tidak (memuat ulang runtime plugin)  |
| UI & lain-lain           | `ui`, `logging`, `identity`, `bindings`                                 | Tidak                           |
| Server Gateway      | `gateway.*` (port, pengikatan, autentikasi, tailscale, TLS, HTTP, push)              | **Ya**                      |
| Infrastruktur      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Ya**                      |

<Note>
`gateway.reload` dan `gateway.remote` merupakan pengecualian dalam `gateway.*`—mengubahnya **tidak** memicu restart. Setiap plugin juga dapat mengganti ketentuan tabel ini: plugin yang dimuat dapat mendeklarasikan prefiks konfigurasinya sendiri yang memicu restart (misalnya, plugin Canvas bawaan memulai ulang Gateway untuk `plugins.enabled`, `plugins.allow`, dan `plugins.deny`, bukan hanya `plugins.entries.canvas` miliknya sendiri), sehingga perilaku sebenarnya bergantung pada plugin yang aktif.
</Note>

### Perencanaan pemuatan ulang

Saat Anda mengedit berkas sumber yang dirujuk melalui `$include`, OpenClaw merencanakan
pemuatan ulang berdasarkan tata letak yang dibuat dalam sumber, bukan tampilan dalam memori yang telah diratakan.
Hal ini menjaga keputusan pemuatan ulang langsung (langsung diterapkan atau restart) tetap dapat diprediksi, bahkan ketika
satu bagian tingkat atas berada dalam berkas tersertakan tersendiri seperti
`plugins: { $include: "./plugins.json5" }`. Perencanaan pemuatan ulang gagal secara tertutup jika
tata letak sumber bersifat ambigu.

## RPC konfigurasi (pembaruan terprogram)

Untuk alat yang menulis konfigurasi melalui API Gateway, utamakan alur berikut:

- `config.schema.lookup` untuk memeriksa satu subpohon (simpul skema dangkal + ringkasan
  anak)
- `config.get` untuk mengambil snapshot saat ini beserta `hash`
- `config.patch` untuk pembaruan parsial (patch penggabungan JSON: objek digabungkan, `null`
  menghapus, array diganti jika dikonfirmasi secara eksplisit dengan `replacePaths` apabila
  entri akan dihapus)
- `config.apply` hanya jika Anda bermaksud mengganti seluruh konfigurasi
- `update.run` untuk pembaruan mandiri eksplisit beserta restart; sertakan `continuationMessage` jika sesi setelah restart harus menjalankan satu giliran tindak lanjut
- `update.status` untuk memeriksa sentinel restart pembaruan terbaru dan memverifikasi versi yang berjalan setelah restart

Agen harus menggunakan `config.schema.lookup` sebagai rujukan pertama untuk dokumentasi dan batasan
tingkat kolom yang tepat. Gunakan [Referensi konfigurasi](/id/gateway/configuration-reference)
ketika memerlukan peta konfigurasi yang lebih luas, nilai default, atau tautan ke referensi
subsistem khusus.

<Note>
Penulisan bidang kontrol (`config.apply`, `config.patch`, `update.run`)
dibatasi hingga 30 permintaan per 60 detik, per metode, per
`deviceId+clientIp`; lihat [Pembatasan laju](/gateway/security/rate-limiting). Permintaan restart
digabungkan, lalu menerapkan masa tunggu 30 detik di antara siklus restart.
`update.status` hanya-baca, tetapi dibatasi untuk admin karena sentinel restart dapat
mencakup ringkasan langkah pembaruan dan bagian akhir keluaran perintah.
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
berkas konfigurasi sudah ada (penulisan pertama tanpa konfigurasi yang sudah ada melewati pemeriksaan).

`config.patch` juga menerima `replacePaths`, yaitu array jalur konfigurasi yang penggantian
array-nya disengaja. Jika patch akan mengganti atau menghapus array yang sudah ada
dengan entri yang lebih sedikit, Gateway menolak penulisan kecuali jalur persis tersebut tercantum
dalam `replacePaths`; array bertingkat di bawah entri array menggunakan `[]`, seperti
`agents.list[].skills`. Hal ini mencegah snapshot `config.get` yang terpotong
menimpa array perutean atau daftar yang diizinkan secara diam-diam. Gunakan `config.apply` jika Anda
bermaksud mengganti seluruh konfigurasi.

## Variabel lingkungan

OpenClaw membaca variabel lingkungan dari proses induk serta:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua berkas tersebut tidak mengganti variabel lingkungan yang sudah ada. Anda juga dapat menetapkan variabel lingkungan sebaris dalam konfigurasi:

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

Variabel lingkungan yang setara: `OPENCLAW_LOAD_SHELL_ENV=1`. `timeoutMs` default: `15000`.
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
- Variabel yang tidak ada/kosong memunculkan galat saat pemuatan
- Loloskan dengan `$${VAR}` untuk keluaran literal
- Berfungsi di dalam berkas `$include`
- Substitusi sebaris: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referensi rahasia (lingkungan, berkas, eksekusi)">
  Untuk kolom yang mendukung objek SecretRef, Anda dapat menggunakan:

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

Lihat [Lingkungan](/id/help/environment) untuk urutan prioritas dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap setiap kolom, lihat **[Referensi Konfigurasi](/id/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Referensi Konfigurasi](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
- [Panduan operasional Gateway](/id/gateway)
