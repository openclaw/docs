---
read_when:
    - Anda memerlukan semantik atau nilai default konfigurasi yang tepat pada tingkat bidang
    - Anda sedang memvalidasi blok konfigurasi channel, model, Gateway, atau alat
summary: Referensi konfigurasi Gateway untuk kunci inti OpenClaw, nilai default, dan tautan ke referensi subsistem khusus
title: Referensi konfigurasi
x-i18n:
    generated_at: "2026-07-20T14:06:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc847d29653f3457b44ba6d3b7059329ac760e039f858ef7df5e081586b2e6f6
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referensi tingkat bidang untuk `~/.openclaw/openclaw.json`: kunci, nilai default, dan tautan ke halaman subsistem yang lebih mendalam. Untuk panduan penyiapan berorientasi tugas, lihat [Konfigurasi](/id/gateway/configuration). Katalog perintah milik saluran dan plugin serta pengaturan memori/QMD mendalam tersedia di halamannya masing-masing, bukan di sini.

Format konfigurasi adalah **JSON5** (komentar + koma di akhir diperbolehkan). Semua bidang bersifat opsional; OpenClaw menggunakan nilai default yang aman jika dihilangkan.

Kode adalah acuan yang lebih kuat daripada halaman ini:

- `openclaw config schema` mencetak JSON Schema aktif yang digunakan untuk validasi dan Control UI, dengan metadata bawaan/plugin/saluran yang digabungkan.
- Agen harus memanggil tindakan alat `gateway` `config.schema.lookup` untuk satu node skema persis yang dibatasi berdasarkan jalur sebelum mengedit konfigurasi.
- `pnpm config:docs:check` / `pnpm config:docs:gen` memvalidasi hash garis dasar dokumen ini terhadap permukaan skema saat ini.

Referensi mendalam khusus:

- [Referensi konfigurasi memori](/id/reference/memory-config) untuk `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, dan konfigurasi dreaming di bawah `plugins.entries.memory-core.config.dreaming`.
- [Perintah garis miring](/id/tools/slash-commands) untuk katalog perintah bawaan + terbundel saat ini.
- Halaman saluran/plugin pemilik untuk permukaan perintah khusus saluran.

---

## Saluran

Kunci konfigurasi per saluran tersedia di [Konfigurasi - saluran](/id/gateway/config-channels): `channels.*` untuk Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan saluran terbundel lainnya (autentikasi, kontrol akses, multiakun, pembatasan penyebutan).

## Nilai default agen, multiagen, sesi, dan pesan

Lihat [Konfigurasi - agen](/id/gateway/config-agents) untuk:

- `agents.defaults.*` (ruang kerja, model, penalaran, Heartbeat, memori, media, Skills, sandbox)
- `multiAgent.*` (perutean dan pengikatan multiagen)
- `session.*` (siklus hidup sesi, Compaction, pemangkasan)
- `messages.*` (pengiriman pesan, TTS, perenderan markdown)
- `talk.*` (mode Bicara)
  - `talk.consultThinkingLevel`: penggantian tingkat penalaran untuk seluruh proses agen OpenClaw di balik konsultasi waktu nyata Bicara pada Control UI
  - `talk.consultFastMode`: penggantian mode cepat sekali pakai untuk konsultasi waktu nyata Bicara pada Control UI
  - `talk.speechLocale`: ID lokal BCP 47 opsional untuk pengenalan ucapan Bicara di Android, iOS, dan macOS
  - `talk.silenceTimeoutMs`: jika tidak ditetapkan, Bicara mempertahankan rentang jeda default platform sebelum mengirim transkrip (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: mekanisme cadangan relai Gateway untuk transkrip Bicara waktu nyata yang telah difinalisasi dan melewati `openclaw_agent_consult`

## Alat dan penyedia khusus

Kebijakan alat, pengalih eksperimental, konfigurasi alat berbasis penyedia, serta penyiapan
penyedia / URL dasar khusus tersedia di
[Konfigurasi - alat dan penyedia khusus](/id/gateway/config-tools).

## Model

Definisi penyedia, daftar model yang diizinkan, dan penyiapan penyedia khusus tersedia di
[Konfigurasi - alat dan penyedia khusus](/id/gateway/config-tools#custom-providers-and-base-urls).
Root `models` juga mengelola perilaku katalog model global.

```json5
{
  models: {
    // Opsional. Default: true. Memerlukan mulai ulang Gateway saat diubah.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: perilaku katalog penyedia (`merge` atau `replace`).
- `models.providers`: peta penyedia khusus dengan kunci berupa ID penyedia.
- `models.providers.*.localService`: pengelola proses sesuai permintaan opsional untuk
  server model lokal. OpenClaw memeriksa endpoint kesehatan yang dikonfigurasi, memulai
  `command` absolut saat diperlukan, menunggu kesiapan, lalu mengirim permintaan
  model. Lihat [Layanan model lokal](/id/gateway/local-model-services).
- `models.pricing.enabled`: mengontrol bootstrap harga latar belakang yang
  dimulai setelah sidecar dan saluran mencapai jalur siap Gateway. Saat `false`,
  Gateway melewati pengambilan katalog harga OpenRouter dan LiteLLM; nilai
  `models.providers.*.models[].cost` yang dikonfigurasi tetap berfungsi untuk estimasi biaya lokal.

## MCP

Definisi server MCP yang dikelola OpenClaw tersedia di bawah `mcp.servers` dan
digunakan oleh OpenClaw tertanam serta adaptor runtime lainnya. Perintah `openclaw mcp list`,
`show`, `set`, dan `unset` mengelola blok ini tanpa terhubung ke
server tujuan selama pengeditan konfigurasi.

```json5
{
  mcp: {
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        requestTimeoutMs: 20000,
        connectionTimeoutMs: 5000,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Kontrol proyeksi server aplikasi Codex opsional.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: definisi server MCP bernama berbasis stdio atau jarak jauh untuk runtime yang
  mengekspos alat MCP yang dikonfigurasi.
  Entri jarak jauh menggunakan `transport: "streamable-http"` atau `transport: "sse"`;
  `type: "http"` adalah alias bawaan CLI yang dinormalisasi oleh `openclaw mcp set` dan
  `openclaw doctor --fix` menjadi bidang kanonis `transport`.
- `mcp.servers.<name>.enabled`: tetapkan `false` untuk mempertahankan definisi server yang tersimpan
  sekaligus mengecualikannya dari penemuan MCP OpenClaw tertanam dan proyeksi alat.
- `mcp.servers.<name>.requestTimeoutMs`: batas waktu permintaan MCP per server dalam milidetik.
- `mcp.servers.<name>.connectionTimeoutMs`: batas waktu koneksi per server dalam milidetik.
- `mcp.servers.<name>.supportsParallelToolCalls`: petunjuk konkurensi opsional bagi
  adaptor yang dapat memilih apakah akan menjalankan panggilan alat MCP secara paralel.
- `mcp.servers.<name>.auth`: tetapkan `"oauth"` untuk server MCP HTTP yang memerlukan
  OAuth. Jalankan `openclaw mcp login <name>` untuk menyimpan token di bawah status OpenClaw.
- `mcp.servers.<name>.oauth`: penggantian opsional untuk cakupan OAuth, URL pengalihan, dan URL
  metadata klien.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: kontrol TLS HTTP
  untuk endpoint privat dan TLS timbal balik.
- `mcp.servers.<name>.toolFilter`: pemilihan alat per server opsional. `include`
  membatasi alat MCP yang ditemukan ke nama yang cocok; `exclude` menyembunyikan nama yang
  cocok. Entri berupa nama alat MCP persis atau glob `*` sederhana. Server dengan
  sumber daya atau prompt juga menghasilkan nama alat utilitas (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), dan nama-nama tersebut menggunakan
  filter yang sama.
- `mcp.servers.<name>.codex`: kontrol proyeksi server aplikasi Codex opsional.
  Blok ini merupakan metadata OpenClaw khusus untuk utas server aplikasi Codex; blok ini tidak
  memengaruhi sesi ACP, konfigurasi harness Codex generik, atau adaptor runtime lainnya.
  `codex.agents` yang tidak kosong membatasi server ke ID agen OpenClaw yang tercantum.
  Daftar agen bercakupan yang kosong, hanya berisi spasi, atau tidak valid ditolak oleh validasi konfigurasi
  dan dihilangkan oleh jalur proyeksi runtime alih-alih menjadi global.
  `codex.defaultToolsApprovalMode` menghasilkan
  `default_tools_approval_mode` bawaan Codex untuk server tersebut. OpenClaw menghapus blok `codex`
  sebelum meneruskan konfigurasi bawaan `mcp_servers` ke Codex. Hilangkan blok tersebut untuk
  mempertahankan proyeksi server bagi setiap agen server aplikasi Codex dengan perilaku
  persetujuan MCP default Codex.
- Runtime MCP terbundel yang dibatasi per sesi menggunakan TTL menganggur bawaan selama 10 menit.
  Proses tertanam sekali pakai meminta pembersihan pada akhir proses; TTL menjadi pengaman terakhir untuk sesi berumur panjang dan pemanggil mendatang.
- Perubahan di bawah `mcp.*` diterapkan langsung dengan membuang runtime MCP sesi yang di-cache.
  Penemuan/penggunaan alat berikutnya membuat ulang runtime tersebut dari konfigurasi baru, sehingga entri
  `mcp.servers` yang dihapus langsung dibersihkan alih-alih menunggu TTL menganggur.
- Penemuan runtime juga mematuhi notifikasi perubahan daftar alat MCP dengan menghapus
  katalog yang di-cache untuk sesi tersebut. Server yang mengiklankan sumber daya atau
  prompt memperoleh alat utilitas untuk mencantumkan/membaca sumber daya serta mencantumkan/mengambil
  prompt. Kegagalan panggilan alat berulang menjeda server yang terdampak untuk sementara sebelum
  panggilan lain dicoba.

Lihat [MCP](/id/cli/mcp#openclaw-as-an-mcp-client-registry) dan
[Backend CLI](/id/gateway/cli-backends#bundle-mcp-overlays) untuk perilaku runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // atau string teks biasa
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: daftar izin opsional khusus untuk skill terbundel (skill terkelola/ruang kerja tidak terpengaruh).
- `load.extraDirs`: root skill bersama tambahan (prioritas terendah).
- `load.allowSymlinkTargets`: root target nyata tepercaya yang dapat
  menjadi tujuan resolusi symlink skill saat tautan berada di luar root sumber yang dikonfigurasi.
- `workshop.allowSymlinkTargetWrites`: mengizinkan penerapan Skill Workshop untuk menulis
  melalui target symlink yang sudah dipercaya (default: false).
- `install.preferBrew`: jika true, utamakan penginstal Homebrew saat `brew`
  tersedia sebelum beralih ke jenis penginstal lainnya.
- `install.nodeManager`: preferensi penginstal node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: mengizinkan klien Gateway `operator.admin` tepercaya
  untuk menginstal arsip zip privat yang disiapkan melalui `skills.upload.*`
  (default: false). Ini hanya mengaktifkan jalur arsip yang diunggah; penginstalan ClawHub
  normal tidak memerlukannya.
- `entries.<skillKey>.enabled: false` menonaktifkan sebuah skill meskipun terbundel/terinstal.
- `entries.<skillKey>.apiKey`: kemudahan bagi skill yang mendeklarasikan variabel lingkungan utama (string teks biasa atau objek SecretRef).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: membatasi penemuan skill dan prompt skill yang ditampilkan kepada model.
- Pengaturan otonomi/persetujuan Skill Workshop (`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`) didokumentasikan dalam [Konfigurasi Skills](/id/tools/skills-config).

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Dimuat dari direktori paket atau bundel di bawah `~/.openclaw/extensions` dan `<workspace>/.openclaw/extensions`, serta file atau direktori yang tercantum dalam `plugins.load.paths`.
- Letakkan file plugin mandiri di `plugins.load.paths`; root ekstensi yang ditemukan secara otomatis mengabaikan file `.js`, `.mjs`, dan `.ts` tingkat teratas agar skrip pembantu di root tersebut tidak menghalangi proses mulai.
- Penemuan menerima plugin OpenClaw native serta bundel Codex dan bundel Claude yang kompatibel, termasuk bundel tata letak default Claude tanpa manifes.
- **Perubahan konfigurasi memerlukan dimulainya ulang Gateway.**
- `allow`: daftar izin opsional (hanya plugin yang tercantum yang dimuat). `deny` diprioritaskan.
- `plugins.entries.<id>.apiKey`: kolom praktis untuk kunci API tingkat plugin (jika didukung oleh plugin).
- `plugins.entries.<id>.env`: peta variabel lingkungan dengan cakupan plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: ketika `false`, core memblokir hook yang mengubah prompt seperti `before_prompt_build`. Berlaku untuk hook plugin native dan direktori hook yang disediakan bundel dan didukung.
- `plugins.entries.<id>.hooks.allowConversationAccess`: ketika `true`, plugin tepercaya yang tidak dibundel dapat membaca konten percakapan mentah dari hook bertipe seperti `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, dan `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: secara eksplisit percayai plugin ini untuk meminta penggantian `provider` dan `model` per eksekusi bagi eksekusi subagen latar belakang.
- `plugins.entries.<id>.subagent.allowedModels`: daftar izin opsional untuk target `provider/model` kanonis bagi penggantian subagen tepercaya. Gunakan `"*"` hanya jika Anda sengaja ingin mengizinkan model apa pun.
- `plugins.entries.<id>.llm.allowModelOverride`: secara eksplisit percayai plugin ini untuk meminta penggantian model bagi `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: daftar izin opsional untuk target `provider/model` kanonis bagi penggantian penyelesaian LLM plugin tepercaya. Gunakan `"*"` hanya jika Anda sengaja ingin mengizinkan model apa pun.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: secara eksplisit percayai plugin ini untuk menjalankan `api.runtime.llm.complete` terhadap id agen non-default.
- `plugins.entries.<id>.config`: objek konfigurasi yang ditentukan plugin (divalidasi oleh skema plugin OpenClaw native jika tersedia).
- Pengaturan akun/runtime plugin saluran berada di bawah `channels.<id>` dan harus dijelaskan oleh metadata `channelConfigs` manifes plugin pemiliknya, bukan oleh registri opsi OpenClaw pusat.

### Konfigurasi plugin harness Codex

Plugin `codex` yang dibundel memiliki pengaturan harness app-server Codex native di bawah
`plugins.entries.codex.config`. Lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference) untuk seluruh permukaan konfigurasi
dan [Harness Codex](/id/plugins/codex-harness) untuk model runtime.

`codexPlugins` hanya berlaku untuk sesi yang memilih harness Codex native.
Ini tidak mengaktifkan plugin Codex untuk eksekusi penyedia OpenClaw, pengikatan
percakapan ACP, atau harness non-Codex apa pun.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: mengaktifkan dukungan
  plugin/aplikasi Codex native untuk harness Codex. Default: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: mengekspos setiap
  aplikasi yang saat ini dapat diakses dan terhubung ke akun Codex terautentikasi dalam
  setiap thread Codex native baru. Default: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  kebijakan tindakan destruktif default untuk elisitasi aplikasi plugin yang dikonfigurasi.
  Gunakan `true` untuk menerima skema persetujuan Codex yang aman tanpa meminta konfirmasi, `false`
  untuk menolaknya, `"auto"` untuk merutekan persetujuan yang diwajibkan Codex melalui
  persetujuan plugin OpenClaw, atau `"ask"` untuk meminta konfirmasi bagi setiap tindakan
  tulis/destruktif plugin tanpa persetujuan permanen. Mode `"ask"` menghapus
  penggantian persetujuan Codex per alat yang permanen untuk aplikasi terkait dan memilih
  peninjau persetujuan manusia untuk aplikasi tersebut sebelum thread Codex dimulai.
  Default: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: mengaktifkan
  entri plugin yang dikonfigurasi ketika `codexPlugins.enabled` global juga bernilai true.
  Default: `true` untuk entri eksplisit.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identitas marketplace stabil, diwajibkan bersama `pluginName` untuk setiap entri yang
  diresolusi. Mendukung `"openai-curated"` dan `"workspace-directory"`. Entri
  yang tidak memiliki salah satu kolom identitas akan diabaikan.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identitas
  plugin Codex stabil, diwajibkan bersama `marketplaceName`. Entri
  `workspace-directory` harus menggunakan `summary.id` berkualifikasi marketplace persis
  yang dikembalikan oleh `plugin/list`, misalnya
  `"example-plugin@workspace-directory"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  penggantian tindakan destruktif per plugin. Jika dihilangkan, nilai
  `allow_destructive_actions` global digunakan. Nilai per plugin menerima kebijakan
  `true`, `false`, `"auto"`, atau `"ask"` yang sama.

Setiap aplikasi plugin yang diterima dan menggunakan `"ask"` merutekan permintaan
persetujuan aplikasi tersebut kepada peninjau manusia. Aplikasi lain dan persetujuan thread
non-aplikasi mempertahankan peninjau yang dikonfigurasi, sehingga kebijakan plugin campuran
tidak mewarisi perilaku `"ask"`.

`codexPlugins.enabled` adalah direktif pengaktifan global. Entri plugin eksplisit
yang ditulis oleh migrasi merupakan kumpulan kelayakan penginstalan dan perbaikan terkurasi
yang permanen. Entri `workspace-directory` yang dikonfigurasi secara manual harus sudah
diinstal dan diaktifkan, serta aplikasi miliknya harus dapat diakses; OpenClaw
tidak menginstal atau mengautentikasinya. Jika Codex menolak permintaan katalog workspace
eksplisit, entri workspace yang diaktifkan gagal secara tertutup dengan
`marketplace_missing`, sedangkan entri terkurasi dari katalog default tetap
tersedia. `plugins["*"]` tidak didukung, tidak ada sakelar `install`, dan
nilai `marketplacePath` lokal sengaja tidak dijadikan kolom konfigurasi karena
bersifat spesifik host. Lihat
[Plugin Codex native](/id/plugins/codex-native-plugins) untuk persyaratan versi app-server dan
kesiapan.

Pemeriksaan kesiapan `app/list` di-cache selama satu jam dan disegarkan
secara asinkron ketika usang. Konfigurasi aplikasi thread Codex dihitung saat pembentukan
sesi harness Codex, bukan pada setiap giliran; gunakan `/new`, `/reset`, atau mulai ulang Gateway
setelah mengubah konfigurasi plugin native.

`codexPlugins.allow_all_plugins` mengambil snapshot setiap aplikasi akun yang saat ini dapat diakses
ke dalam setiap thread Codex native baru. Ini tidak menginstal plugin atau aplikasi, dan
aplikasi yang tidak dapat diakses tetap dikecualikan. Aplikasi akun menggunakan kebijakan
`codexPlugins.allow_destructive_actions` global. Entri plugin eksplisit lebih diprioritaskan
ketika aplikasi yang sama tersedia di kedua jalur. Jika `app/list` tidak dapat
dibaca, eksposur seluruh akun gagal secara tertutup.

- `plugins.entries.firecrawl.config.webFetch`: pengaturan penyedia pengambilan web Firecrawl.
  - `apiKey`: Kunci API Firecrawl opsional untuk batas yang lebih tinggi (menerima SecretRef). Beralih ke variabel lingkungan `plugins.entries.firecrawl.config.webSearch.apiKey` atau `FIRECRAWL_API_KEY` jika tidak tersedia.
  - `baseUrl`: URL dasar API Firecrawl (default: `https://api.firecrawl.dev`; penggantian yang di-host sendiri harus menargetkan endpoint privat/internal).
  - `onlyMainContent`: hanya ekstrak konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: batas waktu permintaan scraping dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan penyedia X Search.
  - `model`: model Grok yang digunakan untuk pencarian (misalnya `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan ambang batas.
  - `enabled`: sakelar utama Dreaming (default `false`).
  - `frequency`: irama Cron untuk setiap penyisiran Dreaming penuh (default `"0 3 * * *"`).
  - `model`: penggantian model subagen Dream Diary opsional. Memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`; pasangkan dengan `allowedModels` untuk membatasi target. Kesalahan model tidak tersedia mencoba kembali satu kali dengan model default sesi; kegagalan kepercayaan atau daftar izin tidak beralih secara diam-diam.
  - kebijakan dan ambang batas fase merupakan detail implementasi (bukan kunci konfigurasi yang ditampilkan kepada pengguna).
- Konfigurasi memori lengkap tersedia di [Referensi konfigurasi memori](/id/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundel Claude yang diaktifkan juga dapat menyumbangkan default OpenClaw tersemat dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agen yang disanitasi, bukan sebagai patch konfigurasi OpenClaw mentah.
- `plugins.slots.memory`: pilih id plugin memori aktif, atau `"none"` untuk menonaktifkan plugin memori.
- `plugins.slots.contextEngine`: pilih id plugin mesin konteks aktif; default-nya `"legacy"` kecuali Anda menginstal dan memilih mesin lain.

Lihat [Plugin](/id/tools/plugin).

---

## Komitmen

`commitments` mengontrol memori tindak lanjut yang disimpulkan: OpenClaw dapat mendeteksi check-in dari giliran percakapan dan mengirimkannya melalui eksekusi Heartbeat.

- `commitments.enabled`: aktifkan ekstraksi LLM tersembunyi, penyimpanan, dan pengiriman Heartbeat untuk komitmen tindak lanjut yang disimpulkan. Default: `false`.
- `commitments.maxPerDay`: jumlah maksimum komitmen tindak lanjut yang disimpulkan dan dikirim per sesi agen dalam satu hari berjalan. Default: `3`.

Lihat [Komitmen yang disimpulkan](/id/concepts/commitments).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // izinkan jaringan privat secara berbahaya: true, // aktifkan hanya untuk akses jaringan privat tepercaya
      // izinkan jaringan privat: true, // alias lama
      // daftar izin nama host: ["*.example.com", "example.com"],
      // nama host yang diizinkan: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` menonaktifkan `act:evaluate` dan `wait --fn`.
- `tabCleanup` mengontrol pembersihan berkala dengan upaya terbaik untuk tab agen utama
  yang dilacak setelah waktu idle atau ketika sesi melampaui batasnya. Pelacakan hanya berlaku
  untuk tab yang dibuat oleh alat browser `action: "open"`; tab yang dibuka oleh pengguna atau
  yang kepemilikannya tidak diketahui tidak pernah diambil alih. Menonaktifkan `tabCleanup` tidak menonaktifkan pembersihan siklus hidup sesi secara eksplisit.
- Pembukaan lokal-host dengan target CDP native dan identitas browser yang stabil
  disimpan dalam status SQLite bersama dan tetap memenuhi syarat setelah Gateway dimulai ulang untuk
  `/new` dan pembersihan siklus hidup sesi. Target CDP native yang tersedia bagi alat juga
  tetap memenuhi syarat untuk pembersihan idle dan batas setelah dimulai ulang. Chrome MCP menggunakan
  handle target lokal-proses, sehingga catatan sesi yang sudah ada dalam kondisi dingin menunggu
  pembersihan siklus hidup alih-alih berisiko mengalami pembersihan idle terhadap aktivitas
  setelah dimulai ulang yang tidak dapat diatribusikan. OpenClaw memverifikasi profil dan instans browser
  sebelum menutupnya. Sambungan otomatis Chrome MCP, identitas browser
  `/json/version` yang tidak ada, dan target native yang belum terselesaikan tetap sepenuhnya lokal-proses, sehingga
  tidak ditutup secara otomatis setelah dimulai ulang. Tab lama yang tidak dilacak harus
  ditutup secara manual. Kegagalan sementara tetap tertunda untuk dicoba lagi nanti. Lihat
  [Kepemilikan pembersihan tab](/id/tools/browser#tab-cleanup-ownership).
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan jika tidak ditetapkan, sehingga navigasi browser tetap ketat secara default.
- Tetapkan `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` hanya jika Anda secara sengaja memercayai navigasi browser jaringan privat.
- Dalam mode ketat, endpoint profil CDP jarak jauh (`profiles.*.cdpUrl`) dikenai pemblokiran jaringan privat yang sama selama pemeriksaan keterjangkauan/penemuan.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil jarak jauh hanya dapat dilampirkan (mulai/hentikan/atur ulang dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) jika Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  jika penyedia Anda memberikan URL WebSocket DevTools langsung.
- Jika layanan CDP yang dikelola secara eksternal dapat dijangkau melalui loopback, tetapkan
  `attachOnly: true` profil tersebut; jika tidak, OpenClaw memperlakukan port loopback sebagai
  profil browser lokal terkelola dan dapat melaporkan kesalahan kepemilikan port lokal.
- Profil `existing-session` menggunakan Chrome MCP alih-alih CDP dan dapat dilampirkan pada
  host yang dipilih atau melalui node browser yang terhubung.
- Profil `existing-session` dapat menetapkan `userDataDir` untuk menargetkan profil
  browser berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` dapat menetapkan `cdpUrl` ketika Chrome sudah berjalan
  di balik endpoint penemuan HTTP(S) DevTools atau endpoint WS(S) langsung. Dalam
  mode tersebut, OpenClaw meneruskan endpoint ke Chrome MCP alih-alih menggunakan sambungan otomatis;
  `userDataDir` diabaikan untuk argumen peluncuran Chrome MCP.
- Profil `existing-session` mempertahankan batas rute Chrome MCP saat ini:
  tindakan berbasis snapshot/referensi alih-alih penargetan selektor CSS, hook unggahan
  satu file, tanpa penggantian batas waktu dialog, tanpa `wait --load networkidle`, dan tanpa
  `responsebody`, ekspor PDF, intersepsi unduhan, atau tindakan batch.
- Profil `openclaw` lokal terkelola secara otomatis menetapkan `cdpPort` dan `cdpUrl`; tetapkan
  `cdpUrl` secara eksplisit hanya untuk profil CDP jarak jauh atau pelampiran endpoint
  sesi yang sudah ada.
- Profil lokal terkelola dapat menetapkan `executablePath` untuk mengganti
  `browser.executablePath` global bagi profil tersebut. Gunakan ini untuk menjalankan satu profil di
  Chrome dan profil lainnya di Brave.
- Urutan deteksi otomatis: browser default jika berbasis Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` dan `browser.profiles.<name>.executablePath` keduanya
  menerima `~` dan `~/...` untuk direktori beranda OS Anda sebelum Chromium diluncurkan.
  `userDataDir` per profil pada profil `existing-session` juga diperluas dari tilde.
- Layanan kontrol: hanya loopback (port diturunkan dari `gateway.port`, default `18791`).
- `extraArgs` menambahkan flag peluncuran tambahan ke proses mulai Chromium lokal (misalnya
  `--disable-gpu`, ukuran jendela, atau flag debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, teks pendek, URL gambar, atau URI data
    },
    prefs: {
      theme: "claw", // claw | knot | dash | custom
      themeMode: "system", // light | dark | system
      textScale: 100, // 90 | 100 | 110 | 125 | 140
      locale: "en",
      chatShowThinking: true,
      chatShowToolCalls: true,
      chatPersistCommentary: true, // Pertahankan komentar setelah proses dijalankan di UI Kontrol; tidak mengirimkannya ke kanal
      chatSendShortcut: "enter", // enter | modifier-enter
      chatFollowUpMode: "steer", // steer | queue; hilangkan untuk menggunakan mode antrean server
    },
  },
}
```

- `seamColor`: warna aksen untuk krom UI aplikasi native (warna gelembung Mode Bicara, dan sebagainya).
- `assistant`: penggantian identitas UI Kontrol. Beralih ke identitas agen aktif jika tidak ditetapkan.
- `prefs`: preferensi tampilan operator. Ini adalah lokasi kanonis agar agen dapat
  mengubahnya melalui gerbang persetujuan dan setiap klien UI Kontrol tetap
  tersinkronisasi; browser mencerminkan nilai tersebut ke penyimpanan lokal untuk proses mulai instan dan menyimpan
  salinan lokal-perangkat ketika tidak dapat menulis konfigurasi (cakupan penampil, luring).
  `chatPersistCommentary` secara default bernilai `true`. Menetapkannya ke `false` membuat komentar langsung
  tetap terlihat selama proses berjalan, tetapi menghapusnya saat selesai dan mencegah komentar
  Codex baru masuk ke cerminan transkrip persisten. Pengiriman melalui kanal perpesanan
  tetap terpisah dan tidak berubah.
  Klien yang terhubung menerapkan perubahan sisi server secara langsung: gateway menyiarkan
  peristiwa `config.changed` yang hanya berisi hash setelah setiap penulisan konfigurasi persisten dan
  klien menyegarkan snapshot mereka (dilewati saat draf pengaturan lokal memiliki
  pengeditan yang belum disimpan). Klien yang terhubung kembali melakukan rekonsiliasi saat tersambung.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // atau OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // untuk mode=trusted-proxy; lihat /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // judul tujuan AI opsional untuk pemanggilan alat (menggunakan token model utilitas)
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // berbahaya: izinkan URL sematan http(s) eksternal absolut
      // chatMessageMaxWidth: "min(1280px, 82%)", // lebar maksimum opsional untuk transkrip obrolan yang dipusatkan
      // allowedOrigins: ["https://control.example.com"], // diwajibkan untuk UI Kontrol non-loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // mode fallback origin header Host yang berbahaya
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Opsional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Opsional. Default tidak ditetapkan/dinonaktifkan.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // Persetujuan otomatis yang diverifikasi SSH. Default: diaktifkan (true).
        // Tetapkan false untuk menonaktifkan verifikasi SSH saja; hal ini tidak memengaruhi
        // autoApproveCidrs di atas. Untuk pemasangan node secara manual saja, tetapkan false DAN
        // hapus autoApproveCidrs. Teruskan objek untuk menyesuaikan: { user, identity,
        // timeoutMs, cidrs }.
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Penolakan HTTP /tools/invoke tambahan
      deny: ["browser"],
      // Hapus alat dari daftar penolakan HTTP default untuk pemanggil pemilik/admin
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detail bidang Gateway">

- `mode`: `local` (jalankan gateway) atau `remote` (hubungkan ke gateway jarak jauh). Gateway menolak untuk dimulai kecuali `local`.
- `port`: satu port multipleks untuk WS + HTTP. Prioritas: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (default), `lan` (`0.0.0.0`), `tailnet` (IPv4 Tailscale jika tersedia, jika tidak loopback), atau `custom` (satu alamat IPv4). Alamat `tailnet` yang diresolusi dan alamat `custom` apa pun selain `127.0.0.1` atau `0.0.0.0` memerlukan `127.0.0.1` pada port yang sama untuk klien pada host yang sama; proses mulai gagal jika salah satu listener tidak dapat melakukan bind. Eksposur non-loopback tetap terbatas pada antarmuka yang dipilih.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind `loopback` default mendengarkan pada `127.0.0.1` di dalam kontainer. Dengan jaringan bridge Docker (`-p 18789:18789`), lalu lintas tiba pada `eth0`, sehingga gateway tidak dapat dijangkau. Gunakan `--network host`, atau atur `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) agar mendengarkan pada semua antarmuka.
- **Autentikasi**: diperlukan secara default. Bind non-loopback memerlukan autentikasi gateway. Dalam praktiknya, ini berarti token/kata sandi bersama atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wizard onboarding menghasilkan token secara default.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRef), atur `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Proses mulai serta alur pemasangan/perbaikan layanan gagal jika keduanya dikonfigurasi dan mode belum diatur.
- `gateway.auth.mode: "none"`: mode tanpa autentikasi eksplisit. Gunakan hanya untuk penyiapan loopback lokal tepercaya; opsi ini sengaja tidak ditawarkan oleh prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan autentikasi browser/pengguna ke reverse proxy yang sadar identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth)). Secara default, mode ini mengharapkan sumber proxy **non-loopback**; reverse proxy loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` eksplisit. Pemanggil internal pada host yang sama dapat menggunakan `gateway.auth.password` sebagai fallback langsung lokal; `gateway.auth.token` tetap saling eksklusif dengan mode proxy tepercaya.
- `gateway.auth.allowTailscale`: saat `true`, header identitas Tailscale Serve dapat memenuhi autentikasi UI Kontrol/WebSocket (diverifikasi melalui `tailscale whois`). Endpoint API HTTP **tidak** menggunakan autentikasi header Tailscale tersebut; endpoint itu mengikuti mode autentikasi HTTP normal gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Default ke `true` saat `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: pembatas opsional untuk autentikasi yang gagal. Berlaku per IP klien dan per cakupan autentikasi (rahasia bersama dan token perangkat dilacak secara terpisah). Percobaan yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada jalur asinkron UI Kontrol Tailscale Serve, percobaan yang gagal untuk `{scope, clientIp}` yang sama diserialkan sebelum kegagalan ditulis. Oleh karena itu, percobaan buruk serentak dari klien yang sama dapat memicu pembatas pada permintaan kedua, alih-alih keduanya berlomba lolos sebagai ketidakcocokan biasa.
  - `gateway.auth.rateLimit.exemptLoopback` memiliki default `true`; atur `false` jika Anda memang ingin lalu lintas localhost juga dibatasi lajunya (untuk penyiapan pengujian atau deployment proxy yang ketat).
- Percobaan autentikasi WS yang berasal dari browser selalu dibatasi lajunya dengan pengecualian loopback dinonaktifkan (pertahanan berlapis terhadap brute force localhost berbasis browser).
- Pada loopback, penguncian yang berasal dari browser tersebut diisolasi per nilai `Origin`
  yang dinormalisasi, sehingga kegagalan berulang dari satu origin localhost tidak secara otomatis
  mengunci origin lain.
- `tailscale.mode`: `serve` (hanya tailnet, bind loopback) atau `funnel` (publik, memerlukan autentikasi).
- `tailscale.serviceName`: nama Layanan Tailscale opsional untuk mode Serve, seperti
  `svc:openclaw`. Saat diatur, OpenClaw meneruskannya ke `tailscale serve
--service` agar UI Kontrol dapat diekspos melalui Layanan bernama
  alih-alih nama host perangkat. Nilainya harus menggunakan format nama Layanan `svc:<dns-label>`
  milik Tailscale; proses mulai melaporkan URL Layanan yang diturunkan.
- `tailscale.preserveFunnel`: saat `true` dan `tailscale.mode = "serve"`, OpenClaw
  memeriksa `tailscale funnel status` sebelum menerapkan ulang Serve saat dimulai dan melewatinya
  jika rute Funnel yang dikonfigurasi secara eksternal sudah mencakup port gateway.
  Default `false`.
- `controlUi.allowedOrigins`: daftar izin origin browser eksplisit untuk koneksi WebSocket Gateway. Diperlukan untuk origin browser non-loopback publik. Pemuatan UI LAN/Tailnet privat dengan origin yang sama dari host loopback, RFC1918/link-local, `.local`, `.ts.net`, atau CGNAT Tailscale diterima tanpa mengaktifkan fallback header Host.
- `controlUi.toolTitles`: ikut serta menggunakan judul tujuan yang dihasilkan AI untuk pemanggilan alat dalam obrolan UI Kontrol. Default: `false` (perenderan alat tetap sepenuhnya deterministik tanpa pemanggilan model di latar belakang). Saat diaktifkan, metode `chat.toolTitles` memberi label pada pemanggilan kompleks melalui perutean model utilitas standar — `utilityModel` agen (keputusan operator yang dapat mengirim argumen alat terbatas ke penyedia yang dipilih, seperti setiap tugas utilitas), atau default model kecil yang dinyatakan penyedia sesi (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`) — dan menyimpan hasil dalam cache di basis data status per agen agar tampilan berulang tidak pernah ditagih ulang. `utilityModel: \"\"` menonaktifkan judul seperti pada setiap tugas utilitas lainnya; judul tidak pernah beralih ke model utama sebagai fallback.
- `controlUi.chatMessageMaxWidth`: lebar maksimum opsional untuk transkrip obrolan UI Kontrol yang dipusatkan. Menerima nilai lebar CSS terbatas seperti `960px`, `82%`, `min(1280px, 82%)`, dan `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan fallback origin header Host untuk deployment yang secara sengaja mengandalkan kebijakan origin header Host.
- `terminal.enabled`: ikut serta menggunakan terminal operator dengan cakupan admin. Default: `false`. Terminal memulai PTY host di ruang kerja agen yang dipilih, mewarisi lingkungan proses Gateway, dan ditolak untuk agen dengan `sandbox.mode: "all"`. Aktifkan hanya untuk deployment operator tepercaya; mengubahnya akan memulai ulang Gateway dan memperbarui kebijakan keamanan konten UI Kontrol.
- `terminal.shell`: executable shell opsional. Jika tidak diatur, OpenClaw menggunakan `$SHELL` di Unix dan `%ComSpec%` di Windows.
- `terminal.detachedSessionTimeoutSeconds`: berapa lama sesi terminal bertahan setelah koneksinya terputus (pemuatan ulang halaman, laptop tidur), tetap dapat disambungkan kembali melalui `terminal.attach` dengan output terbarunya diputar ulang. Default: `300`. Atur `0` untuk menghentikan sesi saat koneksinya terputus. Sesi yang terlepas tetap menjalankan perintahnya, jadi persingkat durasi ini pada host bersama atau yang terekspos.
- `remote.transport`: `ssh` (default) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus berupa `wss://` untuk host publik; `ws://` teks biasa hanya diterima untuk host loopback, LAN, link-local, `.local`, `.ts.net`, dan CGNAT Tailscale.
- `remote.remotePort`: port gateway pada host SSH jarak jauh. Default ke `18789`; gunakan ini saat port tunnel lokal berbeda dari port gateway jarak jauh.
- `remote.sshHostKeyPolicy`: kebijakan kunci host tunnel SSH macOS. `strict` adalah default dan memerlukan kunci yang sudah tepercaya. `openssh` adalah pilihan eksplisit untuk menggunakan konfigurasi OpenSSH efektif bagi alias terkelola; tinjau pengaturan SSH pengguna dan sistem yang cocok sebelum menggunakannya. Aplikasi macOS dan `configure-remote` mereset kebijakan ini ke `strict` saat mengganti target, kecuali dipilih kembali secara eksplisit.
- `gateway.remote.token` / `.password` adalah bidang kredensial klien jarak jauh. Keduanya tidak mengonfigurasi autentikasi gateway dengan sendirinya.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS dasar untuk relai APNs eksternal yang digunakan setelah build iOS berbasis relai memublikasikan pendaftaran ke gateway. Build App Store publik menggunakan relai OpenClaw yang dihosting. URL relai kustom harus sesuai dengan jalur build/deployment iOS yang sengaja dipisahkan dan URL relainya mengarah ke relai tersebut.
- `gateway.push.apns.relay.timeoutMs`: batas waktu pengiriman dari gateway ke relai dalam milidetik. Default ke `10000`.
- Pendaftaran berbasis relai didelegasikan kepada identitas gateway tertentu. Aplikasi iOS yang dipasangkan mengambil `gateway.identity.get`, menyertakan identitas tersebut dalam pendaftaran relai, dan meneruskan izin pengiriman dengan cakupan pendaftaran ke gateway. Gateway lain tidak dapat menggunakan kembali pendaftaran tersimpan tersebut.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: penggantian sementara melalui variabel lingkungan untuk konfigurasi relai di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: jalan keluar khusus pengembangan untuk URL relai HTTP loopback. URL relai produksi harus tetap menggunakan HTTPS.
- `OPENCLAW_HANDSHAKE_TIMEOUT_MS`: penggantian lingkungan opsional untuk batas waktu handshake WebSocket Gateway pra-autentikasi bawaan.
- `channels.<provider>.healthMonitor.enabled`: pilihan untuk menonaktifkan per kanal bagi proses mulai ulang monitor kesehatan sambil tetap mengaktifkan monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: penggantian per akun untuk kanal multi-akun. Saat diatur, nilainya memiliki prioritas atas penggantian tingkat kanal.
- Jalur pemanggilan gateway lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya saat `gateway.auth.*` tidak diatur.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak dapat diresolusi, resolusi gagal secara tertutup (tanpa fallback jarak jauh yang menyamarkan kegagalan).
- `trustedProxies`: IP reverse proxy yang mengakhiri TLS atau menyuntikkan header klien yang diteruskan. Cantumkan hanya proxy yang Anda kendalikan. Entri loopback tetap valid untuk penyiapan proxy/deteksi lokal pada host yang sama (misalnya Tailscale Serve atau reverse proxy lokal), tetapi entri tersebut **tidak** membuat permintaan loopback memenuhi syarat untuk `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: saat `true`, gateway menerima `X-Real-IP` jika `X-Forwarded-For` tidak ada. Default `false` untuk perilaku gagal tertutup.
- `gateway.nodes.pairing.autoApproveCidrs`: daftar izin CIDR/IP opsional untuk menyetujui secara otomatis pemasangan perangkat Node pertama kali tanpa cakupan yang diminta. Fitur ini dinonaktifkan jika tidak diatur. Ini tidak menyetujui secara otomatis pemasangan operator/browser/UI Kontrol/WebChat, dan tidak menyetujui secara otomatis peningkatan peran, cakupan, metadata, atau kunci publik.
- `gateway.nodes.pairing.sshVerify`: persetujuan otomatis yang diverifikasi SSH untuk pemasangan perangkat Node pertama kali (default: diaktifkan). Gateway melakukan SSH kembali ke host pemasangan (BatchMode, kunci host ketat) dan hanya menyetujui jika kunci perangkat `openclaw node identity` benar-benar cocok. Batas kelayakan sama seperti `autoApproveCidrs`; pemeriksaan dibatasi pada alamat sumber privat/CGNAT kecuali `cidrs` menggantikannya. Atur `false` untuk menonaktifkan, atau `{ user, identity, timeoutMs, cidrs }` untuk menyesuaikan. Lihat [Pemasangan Node](/id/gateway/pairing#ssh-verified-device-auto-approval-default).
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pembentukan izin/tolak global untuk perintah node yang dideklarasikan setelah evaluasi pemasangan dan daftar izin platform. Gunakan `allowCommands` untuk mengaktifkan perintah node berbahaya seperti `camera.snap`, `camera.clip`, `screen.record`, `health.summary`, `sms.search`, dan `sms.send`; `denyCommands` menghapus perintah meskipun perintah tersebut seharusnya disertakan oleh pengaturan default platform atau izin eksplisit. Izin Health iOS, izin SMS Android, dan otorisasi perintah Gateway bersifat independen. Setelah node mengubah daftar perintah yang dideklarasikannya, tolak lalu setujui kembali pemasangan perangkat tersebut agar gateway menyimpan snapshot perintah yang telah diperbarui.
- `gateway.tools.deny`: nama alat tambahan yang diblokir untuk HTTP `POST /tools/invoke` (memperluas daftar penolakan default).
- `gateway.tools.allow`: hapus nama alat dari daftar penolakan HTTP default untuk
  pemanggil pemilik/admin. Hal ini tidak meningkatkan pemanggil `operator.write`
  yang membawa identitas menjadi memiliki akses pemilik/admin; `cron`, `gateway`, dan `nodes` tetap
  tidak tersedia bagi pemanggil nonpemilik meskipun dimasukkan ke daftar izin.

</Accordion>

### Endpoint yang kompatibel dengan OpenAI

- RPC HTTP Admin: dinonaktifkan secara default sebagai plugin `admin-http-rpc`. Aktifkan plugin untuk mendaftarkan `POST /api/v1/admin/rpc`. Lihat [RPC HTTP Admin](/id/plugins/admin-http-rpc).
- Chat Completions: dinonaktifkan secara default. Aktifkan dengan `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Penguatan input URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Daftar izin kosong dianggap belum ditetapkan; gunakan `gateway.http.endpoints.responses.files.allowUrl=false`
    dan/atau `gateway.http.endpoints.responses.images.allowUrl=false` untuk menonaktifkan pengambilan URL.
- Header penguatan respons opsional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (tetapkan hanya untuk origin HTTPS yang Anda kendalikan; lihat [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolasi multi-instans

Jalankan beberapa Gateway pada satu host dengan port dan direktori status yang unik:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag praktis: `--dev` (menggunakan `~/.openclaw-dev` + port `19001`), `--profile <name>` (menggunakan `~/.openclaw-<name>`).

Lihat [Beberapa Gateway](/id/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: mengaktifkan terminasi TLS pada listener Gateway (HTTPS/WSS) (default: `false`).
- `autoGenerate`: membuat otomatis pasangan sertifikat/kunci lokal yang ditandatangani sendiri saat file eksplisit tidak dikonfigurasi; hanya untuk penggunaan lokal/pengembangan.
- `certPath`: jalur sistem berkas ke file sertifikat TLS.
- `keyPath`: jalur sistem berkas ke file kunci privat TLS; batasi izinnya.
- `caPath`: jalur bundel CA opsional untuk verifikasi klien atau rantai kepercayaan khusus.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: mengontrol cara perubahan konfigurasi diterapkan saat runtime.
  - `"off"`: abaikan perubahan langsung; perubahan memerlukan pemulaian ulang eksplisit.
  - `"restart"`: selalu mulai ulang proses Gateway saat konfigurasi berubah.
  - `"hot"`: terapkan perubahan di dalam proses tanpa memulai ulang.
  - `"hybrid"` (default): coba pemuatan ulang panas terlebih dahulu; kembali ke pemulaian ulang jika diperlukan.
- `debounceMs`: jendela debounce dalam ms sebelum perubahan konfigurasi diterapkan (bilangan bulat nonnegatif; default: `300`).
- `deferralTimeoutMs`: waktu maksimum opsional dalam ms untuk menunggu operasi yang sedang berlangsung sebelum memaksa pemulaian ulang atau pemuatan ulang panas kanal. Hilangkan untuk menggunakan waktu tunggu terbatas default (`300000`); tetapkan `0` untuk menunggu tanpa batas dan mencatat peringatan berkala bahwa operasi masih tertunda.

---

## Lingkungan worker cloud

Worker cloud bersifat ikut serta. Jika `cloudWorkers` tidak ada, atau `profiles` kosong, OpenClaw tidak menerima pembuatan worker baru. Rekaman persisten yang dibuat sebelumnya tetap direkonsiliasi dan terlihat; proyeksi Gateway/Node yang ada tidak berubah.

Setiap penyedia worker harus mengembalikan `hostKey` SSH dari output penyediaan tepercaya tepat sebagai `algorithm base64`, tanpa nama host atau komentar. Bootstrap menulis kunci tersebut ke file `known_hosts` yang terisolasi, menggunakan `StrictHostKeyChecking=yes`, dan gagal sebelum membuka koneksi jika penyedia tidak menyertakannya. Tidak ada fallback percaya-pada-penggunaan-pertama.

Penyiapan tunnel dilakukan sesuai permintaan, bukan sebagai bagian dari penyediaan. Saat dimulai, Gateway meneruskan balik soket Unix lokal worker ke endpoint WebSocket loopback-nya. Soket berada dalam direktori jarak jauh khusus pemilik yang dialokasikan secara acak; tidak seperti port TCP loopback, soket tersebut tidak dapat dijangkau oleh akun lain pada worker multipengguna dan tidak dapat bertabrakan dengan port lingkungan lain. Keepalive SSH dan backoff koneksi ulang berbatas hanya berjalan selama pemilik tunnel tetap aktif. Menghentikan tunnel membatasi koneksi ulang sebelum menutup proses SSH.

Lalu lintas kontrol dan transfer ruang kerja menggunakan koneksi SSH terpisah. Keduanya menggunakan kembali identitas terselesaikan dan file `known_hosts` tersemat yang sama, tetapi transfer ruang kerja tidak berbagi multipleks koneksi SSH dengan tunnel berumur panjang, sehingga rsync tidak dapat memblokir lalu lintas kontrol.

### Profil Crabbox

Penyedia `crabbox` yang dibundel menyediakan lease berkemampuan SSH melalui CLI Crabbox lokal. `settings.provider` bagian dalam memilih backend Crabbox; ini terpisah dari id penyedia OpenClaw bagian luar.

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // Default; use "npm" only for a released gateway version.
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // Optional absolute path. Default: sibling ../crabbox/bin/crabbox, then PATH.
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider` (wajib): backend Crabbox yang diteruskan melalui `--provider`. Gunakan backend yang output pemeriksaannya menyertakan endpoint SSH; `aws` memilih backend AWS langsung.
- `settings.class` (wajib): kelas mesin Crabbox yang diteruskan ke `--class`.
- `settings.ttl` dan `settings.idleTimeout` (wajib): string durasi Go positif yang diteruskan ke `--ttl` dan `--idle-timeout`. Pengaman sisi penyedia ini berbeda dari kebijakan `lifetime` tersimpan milik OpenClaw di bawah.
- `settings.binary`: jalur absolut opsional ke executable Crabbox. Tanpanya, OpenClaw memeriksa checkout Crabbox yang bersebelahan, lalu entri executable pada `PATH`, dan terakhir menjalankan `crabbox` agar CLI yang tidak ada tetap menjadi galat penyedia yang terlihat.

Pengaturan yang tidak dikenal ditolak. Kredensial Crabbox dan konfigurasi akun khusus backend tetap dimiliki oleh Crabbox; jangan tempatkan keduanya dalam `settings`. OpenClaw hanya menjalankan CLI lokal dan tidak melakukan panggilan jaringan penyedia dari plugin ini. Penyediaan selalu meneruskan `--keep=true`; OpenClaw memiliki siklus hidup eksternal dan menghancurkan lease dengan `crabbox stop`.

<Note>
  OpenClaw menyelesaikan jalur `sshKey` lokal lease milik Crabbox melalui penyelesai secret milik penyedia dan menyematkan `sshHostKey` otoritatif yang dikembalikan oleh `crabbox inspect --json`. Penerimaan AWS juga memerlukan `providerMetadata.instanceProfileAttached`. Instal Crabbox 0.38.1 atau yang lebih baru untuk kontrak pemeriksaan tertutup ini.
</Note>

### Profil pengembangan SSH statis

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles`: profil worker bernama dengan id yang tidak kosong dan spasi tepi yang dipangkas. Setiap profil memilih penyedia yang didaftarkan oleh plugin.
- `provider`: id penyedia worker yang tidak kosong. Contoh menggunakan penyedia `crabbox` yang dibundel dan penyedia QA Lab `static-ssh`.
- `install`: metode instalasi worker. `"bundle"` (default) mentransfer bundel dengan hash konten dari build Gateway yang terinstal serta mendukung versi rilis, pengembangan, dan belum dirilis. `"npm"` adalah optimisasi opsional untuk rilis paket yang tidak dimodifikasi; metode ini menginstal `openclaw@<exact gateway version>` dari registri npm publik dan tidak pernah menginstal `latest`.
- Plugin penyedia yang dibundel dipilih secara otomatis saat dikonfigurasi, tetapi penonaktifan eksplisit dan `plugins.allow` tetap berlaku. Sertakan id penyedia (misalnya, `crabbox`) saat daftar izin dikonfigurasi. Plugin penyedia eksternal juga harus diinstal dan diaktifkan secara eksplisit.
- `settings`: JSON terbatas milik penyedia. Plugin yang dipilih menentukan dan memvalidasi kuncinya; gunakan [objek SecretRef](/id/gateway/secrets) untuk nilai yang mengandung secret. Penyedia SSH statis memerlukan `host`, `user`, `hostKey`, dan `keyRef`; `port` memiliki default `22`. `hostKey` harus berupa satu baris kunci host publik OpenSSH (`algorithm base64`) yang diperoleh dari host yang diketahui atau kanal tepercaya lainnya, tanpa prefiks opsi.
- `lifetime.idleTimeoutMinutes`: menit berupa bilangan bulat positif yang disimpan untuk kebijakan pengambilan kembali saat tidak aktif di kemudian hari.
- `lifetime.maxLifetimeMinutes`: menit berupa bilangan bulat positif yang disimpan untuk kebijakan siklus hidup di kemudian hari.

Runtime Node yang didukung (22.22.3+, 24.15+, atau 25.9+) dengan SQLite yang aman terhadap reset WAL harus sudah terinstal pada worker. Metode opsional `"npm"` juga memerlukan `npm` dan akses HTTPS keluar ke registri npm publik. Penyiapan toolchain berjaringan merupakan kebijakan penyedia; bootstrap melaporkan galat yang dapat ditindaklanjuti alih-alih menginstal toolchain itu sendiri.

Fondasi ini menginstal dan memverifikasi build Gateway serta menyediakan siklus hidup mulai/henti tunnel, tetapi tidak menjalankan CLI OpenClaw umum. Entri worker mandiri dan loop hadir pada tonggak worker cloud berikutnya.

Setiap rekaman lingkungan persisten mempertahankan pengaturan penyedia yang telah divalidasi, metode instalasi yang terselesaikan, dan kebijakan masa pakainya dalam snapshot profil saat pembuatan. Mengubah atau menghapus profil bernama memengaruhi pembuatan baru; rekaman yang ada melanjutkan rekonsiliasi siklus hidup dengan snapshot tersebut, selama plugin pemilik tetap tersedia.

Nilai masa pakai hanya berupa data dalam rilis worker cloud pertama; penerapan otomatis hadir bersama pekerjaan siklus hidup berikutnya. Perubahan profil memerlukan pemulaian ulang Gateway.

<Warning>
  Penyedia `static-ssh` adalah harness pengembangan QA Lab pohon sumber dan dikecualikan dari distribusi paket. Worker yang berjalan pada host bersamanya dapat membaca data host yang tidak terkait, jadi jangan gunakan penyedia ini sebagai batas isolasi produksi.
  Operatornya harus menyediakan `hostKey` yang diharapkan; OpenClaw tidak akan mempelajari atau menerima kunci dari koneksi pertama.
  Menghancurkan lease-nya hanya melepaskan rekaman logis OpenClaw; tindakan tersebut tidak menghentikan atau membersihkan host.
</Warning>

---

## Hook

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

Autentikasi: `Authorization: Bearer <token>` atau `x-openclaw-token: <token>`.
Token hook dalam string kueri ditolak.

Catatan validasi dan keamanan:

- `hooks.enabled=true` memerlukan `hooks.token` yang tidak kosong.
- `hooks.token` harus berbeda dari autentikasi rahasia bersama Gateway yang aktif (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); saat mendeteksi penggunaan ulang, proses startup mencatat peringatan keamanan yang tidak fatal.
- `openclaw security audit` menandai penggunaan ulang autentikasi hook/Gateway sebagai temuan kritis, termasuk autentikasi kata sandi Gateway yang hanya diberikan pada waktu audit (`--auth password --password <password>`). Jalankan `openclaw doctor --fix` untuk merotasi `hooks.token` tersimpan yang digunakan ulang, lalu perbarui pengirim hook eksternal agar menggunakan token hook baru.
- `hooks.path` tidak boleh berupa `/`; gunakan subjalur khusus seperti `/hooks`.
- Jika `hooks.allowRequestSessionKey=true`, batasi `hooks.allowedSessionKeyPrefixes` (misalnya `["hook:"]`).
- Jika pemetaan atau preset menggunakan `sessionKey` bertemplat, atur `hooks.allowedSessionKeyPrefixes` dan `hooks.allowRequestSessionKey=true`. Kunci pemetaan statis tidak memerlukan keikutsertaan tersebut.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dari payload permintaan hanya diterima jika `hooks.allowRequestSessionKey=true` (default: `false`).
- `POST /hooks/<name>` → diselesaikan melalui `hooks.mappings`
  - Nilai `sessionKey` pemetaan yang dirender dari templat dianggap berasal dari luar dan juga memerlukan `hooks.allowRequestSessionKey=true`.

<Accordion title="Detail pemetaan">

- `match.path` mencocokkan subjalur setelah `/hooks` (misalnya `/hooks/gmail` → `gmail`).
- `match.source` mencocokkan bidang payload untuk jalur generik.
- Templat seperti `{{messages[0].subject}}` membaca dari payload.
- `transform` dapat menunjuk ke modul JS/TS yang mengembalikan tindakan hook.
  - `transform.module` harus berupa jalur relatif dan tetap berada di dalam `hooks.transformsDir` (jalur absolut dan penelusuran direktori ditolak).
  - Simpan `hooks.transformsDir` di bawah `~/.openclaw/hooks/transforms`; direktori skill ruang kerja ditolak. Jika `openclaw doctor` melaporkan jalur ini sebagai tidak valid, pindahkan modul transformasi ke direktori transformasi hook atau hapus `hooks.transformsDir`.
- `agentId` merutekan ke agen tertentu; ID yang tidak dikenal kembali ke agen default.
- `allowedAgentIds`: membatasi perutean agen efektif, termasuk jalur agen default saat `agentId` dihilangkan (`*` atau dihilangkan = izinkan semua, `[]` = tolak semua).
- `defaultSessionKey`: kunci sesi tetap opsional untuk proses agen hook tanpa `sessionKey` eksplisit.
- `allowRequestSessionKey`: mengizinkan pemanggil `/hooks/agent` dan kunci sesi pemetaan berbasis templat untuk mengatur `sessionKey` (default: `false`).
- `allowedSessionKeyPrefixes`: daftar izin awalan opsional untuk nilai `sessionKey` eksplisit (permintaan + pemetaan), misalnya `["hook:"]`. Ini menjadi wajib saat pemetaan atau preset mana pun menggunakan `sessionKey` bertemplat.
- `deliver: true` mengirim balasan akhir ke saluran; `channel` secara default menggunakan `last`.
- `model` mengganti LLM untuk proses hook ini (harus diizinkan jika katalog model ditetapkan).

</Accordion>

### Integrasi Gmail

- Preset Gmail bawaan menggunakan `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Kunci per pesan ini mengisolasi konteks percakapan, bukan alat atau akses ruang kerja. Tanpa pemetaan khusus yang mengatur `agentId`, preset menggunakan agen default.
- Untuk kotak masuk yang tidak tepercaya, rutekan Gmail ke agen pembaca khusus dan batasi agen tersebut dengan [sandbox dan kebijakan alat per agen](/id/tools/multi-agent-sandbox-tools). Jika pembaca harus memberi tahu agen utama, batasi serah terima dengan [`tools.agentToAgent`](/id/gateway/config-tools#toolsagenttoagent). Lihat [Injeksi prompt](/id/gateway/security#prompt-injection) untuk model ancaman dan tingkat model yang direkomendasikan.
- Jika Anda mempertahankan perutean per pesan tersebut, atur `hooks.allowRequestSessionKey: true` dan batasi `hooks.allowedSessionKeyPrefixes` agar cocok dengan namespace Gmail, misalnya `["hook:", "hook:gmail:"]`.
- Jika Anda memerlukan `hooks.allowRequestSessionKey: false`, ganti preset dengan `sessionKey` statis alih-alih default bertemplat.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

- Gateway secara otomatis memulai `gog gmail watch serve` saat boot ketika dikonfigurasi. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkannya.
- Jangan jalankan `gog gmail watch serve` terpisah bersama Gateway.

---

## Host plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // atau OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Menyajikan HTML/CSS/JS yang dapat diedit agen dan A2UI melalui HTTP pada port Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Hanya lokal: pertahankan `gateway.bind: "loopback"` (default).
- Bind non-loopback: rute canvas memerlukan autentikasi Gateway (token/kata sandi/proksi tepercaya), sama seperti permukaan HTTP Gateway lainnya.
- WebView Node biasanya tidak mengirim header autentikasi; setelah suatu node dipasangkan dan terhubung, Gateway mengiklankan URL kapabilitas yang tercakup untuk node tersebut guna mengakses canvas/A2UI.
- URL kapabilitas terikat pada sesi WS node yang aktif dan cepat kedaluwarsa. Fallback berbasis IP tidak digunakan.
- Menyisipkan klien muat ulang langsung ke dalam HTML yang disajikan.
- Secara otomatis membuat `index.html` awal saat kosong.
- Juga menyajikan A2UI di `/__openclaw__/a2ui/`.
- Perubahan memerlukan restart Gateway.
- Nonaktifkan muat ulang langsung untuk direktori besar atau galat `EMFILE`.

---

## Penemuan

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (default): hilangkan `cliPath` + `sshPort` dari catatan TXT.
- `full`: sertakan `cliPath` + `sshPort`; pengiklanan multicast LAN tetap mengharuskan plugin `bonjour` bawaan diaktifkan.
- `off`: hentikan pengiklanan multicast LAN tanpa mengubah status pengaktifan plugin.
- Plugin `bonjour` bawaan dimulai secara otomatis pada host macOS dan bersifat opsional pada penerapan Gateway di Linux, Windows, dan lingkungan terkontainerisasi.
- Nama host secara default menggunakan nama host sistem jika merupakan label DNS yang valid, dengan fallback ke `openclaw`. Ganti dengan `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan pengiklanan mDNS sepenuhnya, dengan mengesampingkan `discovery.mdns.mode`.

### Area luas (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Menulis zona DNS-SD unicast di bawah `~/.openclaw/dns/`. Untuk penemuan lintas jaringan, pasangkan dengan server DNS (CoreDNS direkomendasikan) + DNS terbagi Tailscale.

Penyiapan: `openclaw dns setup --apply`.

---

## Lingkungan

### `env` (variabel lingkungan sebaris)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Variabel lingkungan sebaris hanya diterapkan jika lingkungan proses tidak memiliki kunci tersebut.
- File `.env`: `.env` CWD + `~/.openclaw/.env` (keduanya tidak mengganti variabel yang sudah ada).
- `shellEnv`: mengimpor kunci yang diharapkan tetapi belum ada dari profil shell login Anda.
- Lihat [Lingkungan](/id/help/environment) untuk urutan prioritas lengkap.

### Substitusi variabel lingkungan

Referensikan variabel lingkungan dalam string konfigurasi apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Hanya nama huruf besar yang dicocokkan: `[A-Z_][A-Z0-9_]*`.
- Variabel yang hilang/kosong memicu galat saat konfigurasi dimuat.
- Loloskan dengan `$${VAR}` untuk `${VAR}` literal.
- Berfungsi dengan `$include`.

---

## Rahasia

Referensi rahasia bersifat aditif: nilai teks biasa tetap berfungsi.

### `SecretRef`

Gunakan satu bentuk objek:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validasi:

- Pola `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Pola ID `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- ID `source: "file"`: penunjuk JSON absolut (misalnya `"/providers/openai/apiKey"`)
- Pola ID `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (mendukung pemilih `secret#json_key` bergaya AWS)
- ID `source: "exec"` tidak boleh berisi segmen jalur yang dipisahkan garis miring berupa `.` atau `..` (misalnya `a/../b` ditolak)

### Permukaan kredensial yang didukung

- Matriks kanonis: [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)
- `secrets apply` menargetkan jalur kredensial `openclaw.json` yang didukung.
- Referensi `auth-profiles.json` disertakan dalam resolusi waktu proses dan cakupan audit.

### Konfigurasi penyedia rahasia

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // penyedia env eksplisit opsional
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Catatan:

- Penyedia `file` mendukung `mode: "json"` dan `mode: "singleValue"` (`id` harus berupa `"value"` dalam mode singleValue).
- Jalur penyedia file dan exec gagal secara tertutup saat verifikasi ACL Windows tidak tersedia. Atur `allowInsecurePath: true` hanya untuk jalur tepercaya yang tidak dapat diverifikasi.
- Penyedia `exec` memerlukan jalur `command` absolut dan menggunakan payload protokol pada stdin/stdout.
- Secara default, jalur perintah symlink ditolak. Atur `allowSymlinkCommand: true` untuk mengizinkan jalur symlink sembari memvalidasi jalur target yang telah diselesaikan.
- Jika `trustedDirs` dikonfigurasi, pemeriksaan direktori tepercaya berlaku pada jalur target yang telah diselesaikan.
- Lingkungan anak `exec` secara default bersifat minimal; teruskan variabel yang diperlukan secara eksplisit dengan `passEnv`.
- Referensi rahasia diselesaikan saat aktivasi menjadi snapshot dalam memori, lalu jalur permintaan hanya membaca snapshot tersebut.
- Pemfilteran permukaan aktif diterapkan selama aktivasi: referensi yang tidak dapat diselesaikan pada permukaan aktif menggagalkan startup/muat ulang, sedangkan permukaan tidak aktif dilewati dengan diagnostik.

---

## Penyimpanan autentikasi

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Profil per agen disimpan di `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` mendukung referensi tingkat nilai (`keyRef` untuk `api_key`, `tokenRef` untuk `token`) bagi mode kredensial statis.
- Peta datar `auth-profiles.json` lama seperti `{ "provider": { "apiKey": "..." } }` bukan format runtime; `openclaw doctor --fix` menulis ulang peta tersebut menjadi profil kunci API `provider:default` kanonis dengan cadangan `.legacy-flat.*.bak`.
- Profil mode OAuth (`auth.profiles.<id>.mode = "oauth"`) tidak mendukung kredensial profil autentikasi yang didukung SecretRef.
- Kredensial runtime statis berasal dari snapshot terselesaikan dalam memori; entri statis `auth.json` lama dibersihkan saat ditemukan.
- Impor OAuth lama dari `~/.openclaw/credentials/oauth.json`.
- Lihat [OAuth](/id/concepts/oauth).
- Perilaku runtime rahasia dan perkakas `audit/configure/apply`: [Pengelolaan Rahasia](/id/gateway/secrets).

---

## Audit

```json5
{
  audit: {
    enabled: true,
    messages: "off", // off | direct | all
  },
}
```

Gateway mencatat peristiwa audit **khusus metadata** untuk eksekusi agen dan
tindakan alat ke dalam basis data status bersama. Metadata siklus hidup pesan
merupakan pilihan keikutsertaan yang terpisah. Buku besar menyimpan identitas,
waktu, nama alat, dan hasil yang dinormalisasi, tetapi tidak pernah menyimpan
prompt, isi pesan, argumen alat, hasil, atau teks galat mentah. Baris pesan
tidak menyimpan id akun platform, percakapan, pesan, dan target mentah. Kunci
sesi eksekusi/alat tetap tersedia untuk korelasi dan kunci tersebut sendiri
dapat berisi id akun platform atau rekan. Catatan kedaluwarsa setelah 30 hari
dan buku besar dibatasi hingga 100.000 baris. Kueri catatan tersebut dengan
[`openclaw audit`](/id/cli/audit) atau RPC Gateway
[`audit.activity.list`](/id/gateway/protocol#audit-ledger-rpc). Lihat
[Riwayat audit](/id/gateway/audit) untuk model data lengkap, semantik privasi,
dan batas cakupan.

- `enabled`: catat peristiwa audit baru (default: `true`). Buku besar aktif
  secara default karena jejak audit yang baru diaktifkan setelah insiden tidak
  dapat menjelaskan insiden tersebut. Menyetel `false` menghentikan penyisipan peristiwa baru setelah Gateway dimulai ulang;
  catatan yang ada tetap dapat dibaca hingga kedaluwarsa. Mengaktifkannya
  kembali melanjutkan pencatatan sejak titik tersebut—kesenjangannya tidak
  diisi ulang.
- `messages`: cakupan metadata pesan (default: `"off"`). `"direct"` hanya mencatat
  percakapan langsung yang diketahui. `"all"` juga mencatat jenis percakapan grup, kanal,
  dan yang tidak diketahui. Kedua mode tetap bebas konten dan mengganti
  pengidentifikasi mentah dengan pseudonim berkunci lokal instalasi jika
  korelasi tersedia. Ini merupakan alat bantu korelasi, bukan anonimisasi;
  basis data status menyimpan kunci derivasi, tetapi ekspor RPC dan CLI tidak.

Gateway yang berjalan mengambil `audit.enabled` dan `audit.messages` saat dimulai;
mulai ulang Gateway setelah mengubah salah satu pengaturan. Cakupan pesan saat
ini mencakup pesan masuk yang diterima dan mencapai pengiriman inti serta satu
baris terminal per muatan balasan keluar logis asli yang mencapai pengiriman
tahan lama bersama. Jalur lokal Plugin dan pengiriman langsung yang melewati
batas bersama tersebut belum tercakup. Penulis latar belakang berbatas ini
bersifat upaya terbaik, bukan arsip kepatuhan tanpa kehilangan.

---

## Pencatatan Log

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Berkas log default: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Setel `logging.file` untuk jalur yang stabil.
- `consoleLevel` dinaikkan menjadi `debug` saat `--verbose`.
- `maxFileBytes`: ukuran maksimum berkas log aktif dalam byte sebelum rotasi (bilangan bulat positif; default: `104857600` = 100 MB). OpenClaw menyimpan hingga lima arsip bernomor di samping berkas aktif.
- `redactSensitive` / `redactPatterns`: penyamaran upaya terbaik untuk keluaran konsol, log berkas, catatan log OTLP, dan teks transkrip sesi yang dipersistenkan. `redactSensitive: "off"` hanya menonaktifkan kebijakan umum log/transkrip ini; permukaan keamanan UI/alat/diagnostik tetap menyunting rahasia sebelum dipancarkan.

---

## Diagnostik

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: sakelar utama untuk keluaran instrumentasi (default: `true`).
- `flags`: larik string flag yang mengaktifkan keluaran log tertarget (mendukung karakter pengganti seperti `"telegram.*"` atau `"*"`).
- `otel.enabled`: mengaktifkan pipeline ekspor OpenTelemetry (default: `false`). Untuk konfigurasi lengkap, katalog sinyal, dan model privasi, lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- `otel.endpoint`: URL kolektor untuk ekspor OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP khusus sinyal opsional. Jika disetel, nilai tersebut menggantikan `otel.endpoint` hanya untuk sinyal terkait.
- `otel.protocol`: `"http/protobuf"` (default) atau `"grpc"`.
- `otel.headers`: header metadata HTTP/gRPC tambahan yang dikirim bersama permintaan ekspor OTel.
- `otel.serviceName`: nama layanan untuk atribut sumber daya.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktifkan ekspor jejak, metrik, atau log.
- `otel.logsExporter`: tujuan ekspor log: `"otlp"` (default), `"stdout"` untuk satu objek JSON per baris stdout, atau `"both"`.
- `otel.sampleRate`: tingkat pengambilan sampel jejak `0`-`1`.
- `otel.flushIntervalMs`: interval pengosongan telemetri berkala dalam ms.
- `otel.captureContent`: pengambilan konten mentah yang bersifat pilihan untuk atribut span OTEL. Default-nya nonaktif. Boolean `true` mengambil konten pesan/alat non-sistem; bentuk objek memungkinkan Anda mengaktifkan `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt`, dan `toolDefinitions` secara eksplisit.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: sakelar lingkungan untuk bentuk span inferensi GenAI eksperimental terbaru, termasuk nama span `{gen_ai.operation.name} {gen_ai.request.model}`, jenis span `CLIENT`, dan `gen_ai.provider.name` sebagai pengganti `gen_ai.system` lama. Secara default, span mempertahankan `openclaw.model.call` dan `gen_ai.system` demi kompatibilitas; metrik GenAI menggunakan atribut semantik berbatas.
- `OPENCLAW_OTEL_PRELOADED=1`: sakelar lingkungan untuk host yang telah mendaftarkan SDK OpenTelemetry global. OpenClaw kemudian melewati pengaktifan/penonaktifan SDK milik Plugin sambil tetap mempertahankan listener diagnostik aktif.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, dan `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabel lingkungan endpoint khusus sinyal yang digunakan saat kunci konfigurasi terkait tidak disetel.
- `cacheTrace.enabled`: catat snapshot jejak cache untuk eksekusi tertanam (default: `false`).
- `cacheTrace.filePath`: jalur keluaran untuk JSONL jejak cache (default: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kendalikan apa yang disertakan dalam keluaran jejak cache (semua default: `true`).

---

## Pembaruan

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
    },
  },
}
```

- `channel`: kanal rilis—`"stable"`, `"extended-stable"`, `"beta"`, atau `"dev"`. Extended-stable hanya untuk paket: perintah latar depan menangani instalasi, sedangkan Gateway dapat memancarkan petunjuk pembaruan hanya-baca.
- `checkOnStart`: periksa pembaruan npm saat Gateway dimulai (default: `true`). Pilihan extended-stable yang tersimpan menggunakan petunjuk hanya-baca dan jadwal petunjuk 24 jam yang sama.
- `auto.enabled`: aktifkan pembaruan otomatis latar belakang untuk instalasi paket stable dan beta (default: `false`). Extended-stable tidak pernah diterapkan secara otomatis.

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    stream: {
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
    },
  },
}
```

- `enabled`: gerbang fitur ACP global (default: `true`; setel `false` untuk menyembunyikan kemampuan pengiriman dan pembuatan ACP).
- `dispatch.enabled`: gerbang independen untuk pengiriman giliran sesi ACP (default: `true`). Setel `false` agar perintah ACP tetap tersedia sekaligus memblokir eksekusi.
- `backend`: id backend runtime ACP default (harus cocok dengan Plugin runtime ACP yang terdaftar).
  Instal Plugin backend terlebih dahulu, dan jika `plugins.allow` disetel, sertakan id Plugin backend (misalnya `acpx`) atau backend ACP tidak akan dimuat.
- `fallbacks`: daftar berurutan id backend ACP cadangan yang dicoba saat backend utama gagal lebih awal dengan galat yang tampak sementara (tidak tersedia, dibatasi laju, kuota habis, atau kelebihan beban) sebelum menghasilkan keluaran apa pun. Setiap entri harus cocok dengan backend Plugin runtime ACP yang terdaftar.
- `defaultAgent`: id agen target ACP cadangan saat pembuatan tidak menentukan target eksplisit.
- `allowedAgents`: daftar yang diizinkan berisi id agen yang diperbolehkan untuk sesi runtime ACP; kosong berarti tidak ada pembatasan tambahan.
- `stream.repeatSuppression`: sembunyikan baris status/alat berulang per giliran (default: `true`).
- `stream.deliveryMode`: `"live"` mengalirkan secara bertahap; `"final_only"` menyangga hingga peristiwa terminal giliran.
- `stream.tagVisibility`: catatan nama tag ke penggantian visibilitas boolean untuk peristiwa yang dialirkan.
- `runtime.installCommand`: perintah instalasi opsional yang dijalankan saat melakukan bootstrap lingkungan runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` mengontrol gaya slogan banner:
  - `"random"` (default): slogan lucu/musiman yang berganti-ganti.
  - `"default"`: slogan netral tetap (`All your chats, one OpenClaw.`).
  - `"off"`: tanpa teks slogan (judul/versi banner tetap ditampilkan).
- Untuk menyembunyikan seluruh banner (bukan hanya slogan), atur env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Perilaku dan metadata untuk alur penyiapan terpandu CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    accessMode: "full",
    appRecommendations: true,
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

- `wizard.accessMode`: persetujuan penemuan yang dipilih pada awal onboarding terpandu. `"full"` (direkomendasikan) memungkinkan penyiapan mencari aplikasi AI, kunci, dan runtime lokal secara otomatis; `"guarded"` membuat penyiapan bertanya sekali sebelum melakukan pencarian dan menawarkan konfigurasi manual sebagai gantinya.

- `wizard.appRecommendations` secara default bernilai `true`. Atur ke `false` untuk menonaktifkan rekomendasi aplikasi terinstal selama onboarding terpandu atau klasik dan memblokir akses `device.apps` Gateway. Host Node tetap memerlukan flag berbagi aplikasi terinstal terpisah miliknya, yang secara default nonaktif, sebelum mengiklankan perintah tersebut.

---

## Identitas

Lihat kolom identitas `agents.list` pada [Default agen](/id/gateway/config-agents#agent-defaults).

---

## Bridge (lama, telah dihapus)

Build saat ini tidak lagi menyertakan bridge TCP. Node terhubung melalui WebSocket Gateway. Kunci `bridge.*` tidak lagi menjadi bagian dari skema konfigurasi (validasi gagal hingga kunci tersebut dihapus; `openclaw doctor --fix` dapat menghapus kunci yang tidak dikenal).

<Accordion title="Konfigurasi bridge lama (referensi historis)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    webhook: "https://example.invalid/legacy", // fallback lama yang tidak digunakan lagi untuk tugas tersimpan dengan notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer opsional untuk autentikasi webhook keluar
    sessionRetention: "24h", // string durasi atau false
  },
}
```

- `sessionRetention`: lamanya menyimpan sesi eksekusi cron terisolasi yang telah selesai sebelum memangkas baris sesi SQLite. Juga mengontrol pembersihan transkrip cron terhapus yang diarsipkan. Default: `24h`; atur `false` untuk menonaktifkannya.
- Riwayat eksekusi secara otomatis menyimpan 2000 baris terminal terbaru per tugas. Baris yang hilang tetap memiliki jangka waktu pembersihan 24 jam.
- `webhookToken`: token bearer yang digunakan untuk pengiriman POST webhook cron (`delivery.mode = "webhook"`); jika dihilangkan, tidak ada header autentikasi yang dikirim.
- `webhook`: URL webhook fallback lama yang tidak digunakan lagi (http/https), yang digunakan oleh `openclaw doctor --fix` untuk memigrasikan tugas tersimpan yang masih memiliki `notify: true`; pengiriman runtime menggunakan `delivery.mode="webhook"` per tugas ditambah `delivery.to`, atau `delivery.completionDestination` saat mempertahankan pengiriman pengumuman.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: aktifkan peringatan kegagalan untuk tugas cron (default: `false`).
- `after`: jumlah kegagalan berturut-turut sebelum peringatan dipicu (bilangan bulat positif, min: `1`).
- `cooldownMs`: jumlah minimum milidetik antara peringatan berulang untuk tugas yang sama (bilangan bulat nonnegatif).
- `includeSkipped`: hitung eksekusi berturut-turut yang dilewati terhadap ambang peringatan (default: `false`). Eksekusi yang dilewati dilacak secara terpisah dan tidak memengaruhi backoff kesalahan eksekusi.
- `mode`: mode pengiriman - `"announce"` mengirim melalui pesan kanal; `"webhook"` melakukan POST ke webhook yang dikonfigurasi.
- `accountId`: ID akun atau kanal opsional untuk membatasi cakupan pengiriman peringatan.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Tujuan default untuk notifikasi kegagalan cron pada semua tugas.
- `mode`: `"announce"` atau `"webhook"`; secara default menggunakan `"announce"` jika tersedia cukup data target.
- `channel`: penggantian kanal untuk pengiriman pengumuman. `"last"` menggunakan kembali kanal pengiriman terakhir yang diketahui.
- `to`: target pengumuman eksplisit atau URL webhook. Wajib untuk mode webhook.
- `accountId`: penggantian akun opsional untuk pengiriman.
- `delivery.failureDestination` per tugas menggantikan default global ini.
- Jika tujuan kegagalan global maupun per tugas tidak ditetapkan, tugas yang telah melakukan pengiriman melalui `announce` akan menggunakan target pengumuman utama tersebut sebagai fallback saat gagal.
- `delivery.failureDestination` hanya didukung untuk tugas `sessionTarget="isolated"`, kecuali `delivery.mode` utama tugas tersebut adalah `"webhook"`.

Lihat [Tugas Cron](/id/automation/cron-jobs). Eksekusi cron terisolasi dilacak sebagai [tugas latar belakang](/id/automation/tasks).

## Variabel templat model media

Placeholder templat yang diperluas dalam `tools.media.models[].args`:

| Variabel           | Deskripsi                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Isi lengkap pesan masuk                         |
| `{{RawBody}}`      | Isi mentah (tanpa pembungkus riwayat/pengirim)             |
| `{{BodyStripped}}` | Isi dengan penyebutan grup dihapus                 |
| `{{From}}`         | Pengidentifikasi pengirim                                 |
| `{{To}}`           | Pengidentifikasi tujuan                            |
| `{{MessageSid}}`   | ID pesan kanal                                |
| `{{SessionId}}`    | UUID sesi saat ini                              |
| `{{IsNewSession}}` | `"true"` saat sesi baru dibuat                 |
| `{{MediaUrl}}`     | URL semu media masuk                          |
| `{{MediaPath}}`    | Jalur media lokal                                  |
| `{{MediaType}}`    | Jenis media (gambar/audio/dokumen/…)               |
| `{{Transcript}}`   | Transkrip audio                                  |
| `{{Prompt}}`       | Prompt media yang telah diuraikan untuk entri CLI             |
| `{{MaxChars}}`     | Jumlah maksimum karakter keluaran yang telah diuraikan untuk entri CLI         |
| `{{ChatType}}`     | `"direct"` atau `"group"`                           |
| `{{GroupSubject}}` | Subjek grup (upaya terbaik)                       |
| `{{GroupMembers}}` | Pratinjau anggota grup (upaya terbaik)               |
| `{{SenderName}}`   | Nama tampilan pengirim (upaya terbaik)                 |
| `{{SenderE164}}`   | Nomor telepon pengirim (upaya terbaik)                |
| `{{Provider}}`     | Petunjuk penyedia (whatsapp, telegram, discord, dll.) |

---

## Penyertaan konfigurasi (`$include`)

Pisahkan konfigurasi menjadi beberapa file:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Perilaku penggabungan:**

- Satu file: menggantikan objek yang memuatnya.
- Array file: digabungkan secara mendalam sesuai urutan (yang belakangan menggantikan yang sebelumnya).
- Kunci saudara: digabungkan setelah penyertaan (menggantikan nilai yang disertakan).
- Penyertaan bersarang: hingga kedalaman 10 tingkat.
- Jalur: diuraikan relatif terhadap file yang menyertakan, tetapi harus tetap berada di dalam direktori konfigurasi tingkat atas (`dirname` dari `openclaw.json`). Bentuk absolut/`../` hanya diizinkan jika hasil penguraiannya tetap berada di dalam batas tersebut. Atur `OPENCLAW_INCLUDE_ROOTS` (jalur absolut) untuk mengizinkan root tambahan di luar direktori konfigurasi.
- Batas: jalur tidak boleh mengandung byte null dan panjangnya harus benar-benar kurang dari 4096 karakter sebelum dan sesudah penguraian; setiap file yang disertakan dibatasi hingga 2 MB.
- Penulisan milik OpenClaw yang hanya mengubah satu bagian tingkat atas yang didukung oleh penyertaan satu file akan ditulis langsung ke file yang disertakan tersebut. Misalnya, `plugins install` memperbarui `plugins: { $include: "./plugins.json5" }` dalam `plugins.json5` dan membiarkan `openclaw.json` tetap utuh.
- Penyertaan root, array penyertaan, dan penyertaan dengan penggantian saudara bersifat hanya-baca untuk penulisan milik OpenClaw; penulisan tersebut gagal secara tertutup alih-alih meratakan konfigurasi.
- Kesalahan: pesan yang jelas untuk file yang tidak ditemukan, kesalahan penguraian, penyertaan melingkar, format jalur tidak valid, dan panjang berlebihan.

---

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
- [Doctor](/id/gateway/doctor)
