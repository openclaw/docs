---
read_when:
    - Anda memerlukan semantik atau default konfigurasi yang tepat pada tingkat kolom
    - Anda sedang memvalidasi blok konfigurasi channel, model, Gateway, atau tool
summary: Referensi konfigurasi Gateway untuk kunci inti OpenClaw, nilai default, dan tautan ke referensi subsistem khusus
title: Referensi konfigurasi
x-i18n:
    generated_at: "2026-07-02T08:50:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referensi konfigurasi inti untuk `~/.openclaw/openclaw.json`. Untuk ikhtisar berorientasi tugas, lihat [Konfigurasi](/id/gateway/configuration).

Mencakup permukaan konfigurasi utama OpenClaw dan menautkan keluar ketika sebuah subsistem memiliki referensi yang lebih mendalam. Katalog perintah milik kanal dan Plugin serta tombol memori/QMD mendalam berada di halaman masing-masing, bukan di halaman ini.

Kebenaran kode:

- `openclaw config schema` mencetak JSON Schema langsung yang digunakan untuk validasi dan Control UI, dengan metadata bawaan/Plugin/kanal digabungkan saat tersedia
- `config.schema.lookup` mengembalikan satu node skema bercakupan jalur untuk alat drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` memvalidasi hash baseline dokumen konfigurasi terhadap permukaan skema saat ini

Jalur lookup agen: gunakan aksi alat `gateway` `config.schema.lookup` untuk
dokumentasi dan batasan tingkat-field yang persis sebelum pengeditan. Gunakan
[Konfigurasi](/id/gateway/configuration) untuk panduan berorientasi tugas dan halaman ini
untuk peta field yang lebih luas, default, dan tautan ke referensi subsistem.

Referensi mendalam khusus:

- [Referensi konfigurasi memori](/id/reference/memory-config) untuk `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, dan konfigurasi dreaming di bawah `plugins.entries.memory-core.config.dreaming`
- [Perintah slash](/id/tools/slash-commands) untuk katalog perintah bawaan + bundel saat ini
- halaman kanal/Plugin pemilik untuk permukaan perintah spesifik kanal

Format konfigurasi adalah **JSON5** (komentar + koma akhir diizinkan). Semua field bersifat opsional - OpenClaw menggunakan default aman saat dihilangkan.

---

## Kanal

Kunci konfigurasi per kanal dipindahkan ke halaman khusus - lihat
[Konfigurasi - kanal](/id/gateway/config-channels) untuk `channels.*`,
termasuk Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan kanal
bundel lainnya (auth, kontrol akses, multi-akun, gating mention).

## Default agen, multi-agen, sesi, dan pesan

Dipindahkan ke halaman khusus - lihat
[Konfigurasi - agen](/id/gateway/config-agents) untuk:

- `agents.defaults.*` (workspace, model, pemikiran, Heartbeat, memori, media, Skills, sandbox)
- `multiAgent.*` (routing dan binding multi-agen)
- `session.*` (siklus hidup sesi, Compaction, pruning)
- `messages.*` (pengiriman pesan, TTS, rendering markdown)
- `talk.*` (mode Talk)
  - `talk.consultThinkingLevel`: override tingkat pemikiran untuk seluruh run agen OpenClaw di balik konsultasi realtime Talk Control UI
  - `talk.consultFastMode`: override mode cepat sekali pakai untuk konsultasi realtime Talk Control UI
  - `talk.speechLocale`: id locale BCP 47 opsional untuk pengenalan ucapan Talk di iOS/macOS
  - `talk.silenceTimeoutMs`: saat tidak disetel, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback relay Gateway untuk transkrip Talk realtime final yang melewati `openclaw_agent_consult`

## Alat dan penyedia kustom

Kebijakan alat, toggle eksperimental, konfigurasi alat berbasis penyedia, dan
penyiapan penyedia kustom / base-URL dipindahkan ke halaman khusus - lihat
[Konfigurasi - alat dan penyedia kustom](/id/gateway/config-tools).

## Model

Definisi penyedia, allowlist model, dan penyiapan penyedia kustom berada di
[Konfigurasi - alat dan penyedia kustom](/id/gateway/config-tools#custom-providers-and-base-urls).
Root `models` juga memiliki perilaku katalog model global.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: perilaku katalog penyedia (`merge` atau `replace`).
- `models.providers`: peta penyedia kustom yang dikunci menurut id penyedia.
- `models.providers.*.localService`: manajer proses sesuai permintaan opsional untuk
  server model lokal. OpenClaw memeriksa endpoint health yang dikonfigurasi, memulai
  `command` absolut saat diperlukan, menunggu kesiapan, lalu mengirim permintaan
  model. Lihat [Layanan model lokal](/id/gateway/local-model-services).
- `models.pricing.enabled`: mengontrol bootstrap harga latar belakang yang
  dimulai setelah sidecar dan kanal mencapai jalur siap Gateway. Saat `false`,
  Gateway melewati fetch katalog harga OpenRouter dan LiteLLM; nilai
  `models.providers.*.models[].cost` yang dikonfigurasi tetap berfungsi untuk estimasi biaya lokal.

## MCP

Definisi server MCP yang dikelola OpenClaw berada di bawah `mcp.servers` dan
dikonsumsi oleh OpenClaw tertanam serta adapter runtime lain. Perintah `openclaw mcp list`,
`show`, `set`, dan `unset` mengelola blok ini tanpa terhubung ke
server target selama pengeditan konfigurasi.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        timeout: 20,
        connectTimeout: 5,
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
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: definisi server MCP stdio atau remote bernama untuk runtime yang
  mengekspos alat MCP yang dikonfigurasi.
  Entri remote menggunakan `transport: "streamable-http"` atau `transport: "sse"`;
  `type: "http"` adalah alias native CLI yang dinormalisasi oleh `openclaw mcp set` dan
  `openclaw doctor --fix` ke field `transport` kanonis.
- `mcp.servers.<name>.enabled`: setel `false` untuk mempertahankan definisi server yang tersimpan
  sambil mengecualikannya dari discovery MCP OpenClaw tertanam dan proyeksi alat.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout permintaan MCP per server
  dalam detik atau milidetik.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout koneksi per server
  dalam detik atau milidetik.
- `mcp.servers.<name>.supportsParallelToolCalls`: petunjuk konkurensi opsional untuk
  adapter yang dapat memilih apakah akan menerbitkan panggilan alat MCP paralel.
- `mcp.servers.<name>.auth`: setel `"oauth"` untuk server MCP HTTP yang memerlukan
  OAuth. Jalankan `openclaw mcp login <name>` untuk menyimpan token di bawah state OpenClaw.
- `mcp.servers.<name>.oauth`: override scope OAuth, URL redirect, dan URL metadata
  client opsional.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: kontrol TLS HTTP
  untuk endpoint privat dan mutual TLS.
- `mcp.servers.<name>.toolFilter`: pemilihan alat per server opsional. `include`
  membatasi alat MCP yang ditemukan ke nama yang cocok; `exclude` menyembunyikan nama
  yang cocok. Entri adalah nama alat MCP persis atau glob `*` sederhana. Server dengan
  resource atau prompt juga menghasilkan nama alat utilitas (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), dan nama tersebut menggunakan
  filter yang sama.
- `mcp.servers.<name>.codex`: kontrol proyeksi app-server Codex opsional.
  Blok ini adalah metadata OpenClaw hanya untuk thread app-server Codex; blok ini tidak
  memengaruhi sesi ACP, konfigurasi harness Codex generik, atau adapter runtime lain.
  `codex.agents` yang tidak kosong membatasi server ke id agen OpenClaw yang dicantumkan.
  Daftar agen bercakupan yang kosong, blank, atau tidak valid ditolak oleh validasi konfigurasi
  dan dihilangkan oleh jalur proyeksi runtime, bukan menjadi global.
  `codex.defaultToolsApprovalMode` memancarkan
  `default_tools_approval_mode` native Codex untuk server tersebut. OpenClaw menghapus blok `codex`
  sebelum meneruskan konfigurasi `mcp_servers` native ke Codex. Hilangkan blok untuk
  mempertahankan server diproyeksikan bagi setiap agen app-server Codex dengan
  perilaku persetujuan MCP default Codex.
- `mcp.sessionIdleTtlMs`: TTL idle untuk runtime MCP bundel bercakupan sesi.
  Run tertanam sekali pakai meminta cleanup akhir-run; TTL ini adalah backstop untuk
  sesi jangka panjang dan caller masa depan.
- Perubahan di bawah `mcp.*` berlaku panas dengan membuang runtime MCP sesi yang di-cache.
  Discovery/penggunaan alat berikutnya membuat ulang dari konfigurasi baru, sehingga entri
  `mcp.servers` yang dihapus langsung direap tanpa menunggu TTL idle.
- Discovery runtime juga menghormati notifikasi perubahan daftar alat MCP dengan membuang
  katalog yang di-cache untuk sesi tersebut. Server yang mengiklankan resource atau
  prompt mendapatkan alat utilitas untuk mencantumkan/membaca resource dan mencantumkan/mengambil
  prompt. Kegagalan panggilan alat berulang menjeda server yang terdampak sebentar sebelum
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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opsional hanya untuk skills bundel (skills terkelola/workspace tidak terdampak).
- `load.extraDirs`: root skill bersama tambahan (prioritas terendah).
- `load.allowSymlinkTargets`: root target nyata tepercaya yang dapat menjadi tujuan resolve symlink skill
  saat tautan berada di luar root sumber yang dikonfigurasi.
- `workshop.allowSymlinkTargetWrites`: mengizinkan Skill Workshop apply menulis
  melalui target symlink yang sudah tepercaya (default: false).
- `install.preferBrew`: saat true, prioritaskan installer Homebrew ketika `brew` tersedia
  sebelum fallback ke jenis installer lain.
- `install.nodeManager`: preferensi installer node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: izinkan client Gateway `operator.admin` tepercaya
  menginstal arsip zip privat yang distaging melalui `skills.upload.*`
  (default: false). Ini hanya mengaktifkan jalur arsip unggahan; instal ClawHub normal
  tidak memerlukannya.
- `entries.<skillKey>.enabled: false` menonaktifkan skill meskipun dibundel/diinstal.
- `entries.<skillKey>.apiKey`: kemudahan untuk skills yang mendeklarasikan env var primer (string plaintext atau objek SecretRef).

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

- Dimuat dari direktori paket atau bundel di bawah `~/.openclaw/extensions` dan `<workspace>/.openclaw/extensions`, ditambah file atau direktori yang tercantum dalam `plugins.load.paths`.
- Letakkan file Plugin mandiri di `plugins.load.paths`; root ekstensi yang ditemukan otomatis mengabaikan file `.js`, `.mjs`, dan `.ts` tingkat atas sehingga skrip pembantu di root tersebut tidak memblokir startup.
- Penemuan menerima Plugin OpenClaw native serta bundel Codex dan bundel Claude yang kompatibel, termasuk bundel tata letak default Claude tanpa manifest.
- **Perubahan konfigurasi memerlukan restart Gateway.**
- `allow`: daftar izin opsional (hanya Plugin yang tercantum yang dimuat). `deny` menang.
- `plugins.entries.<id>.apiKey`: field kemudahan kunci API tingkat Plugin (jika didukung oleh Plugin).
- `plugins.entries.<id>.env`: peta variabel env berskup Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: ketika `false`, core memblokir `before_prompt_build` dan mengabaikan field pengubah prompt dari `before_agent_start` lama, sambil mempertahankan `modelOverride` dan `providerOverride` lama. Berlaku untuk hook Plugin native dan direktori hook yang disediakan bundel yang didukung.
- `plugins.entries.<id>.hooks.allowConversationAccess`: ketika `true`, Plugin tepercaya non-bundel dapat membaca konten percakapan mentah dari hook bertipe seperti `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, dan `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: percayai Plugin ini secara eksplisit untuk meminta override `provider` dan `model` per run untuk run subagent latar belakang.
- `plugins.entries.<id>.subagent.allowedModels`: daftar izin opsional target `provider/model` kanonis untuk override subagent tepercaya. Gunakan `"*"` hanya ketika Anda sengaja ingin mengizinkan model apa pun.
- `plugins.entries.<id>.llm.allowModelOverride`: percayai Plugin ini secara eksplisit untuk meminta override model untuk `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: daftar izin opsional target `provider/model` kanonis untuk override penyelesaian LLM Plugin tepercaya. Gunakan `"*"` hanya ketika Anda sengaja ingin mengizinkan model apa pun.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: percayai Plugin ini secara eksplisit untuk menjalankan `api.runtime.llm.complete` terhadap id agen non-default.
- `plugins.entries.<id>.config`: objek konfigurasi yang ditentukan Plugin (divalidasi oleh skema Plugin OpenClaw native jika tersedia).
- Pengaturan akun/runtime Plugin kanal berada di bawah `channels.<id>` dan harus dideskripsikan oleh metadata `channelConfigs` manifest Plugin pemiliknya, bukan oleh registri opsi OpenClaw pusat.

### Konfigurasi Plugin harness Codex

Plugin `codex` yang dibundel memiliki pengaturan harness app-server Codex native di bawah
`plugins.entries.codex.config`. Lihat
[referensi harness Codex](/id/plugins/codex-harness-reference) untuk seluruh permukaan konfigurasi
dan [harness Codex](/id/plugins/codex-harness) untuk model runtime.

`codexPlugins` hanya berlaku untuk sesi yang memilih harness Codex native.
Ini tidak mengaktifkan Plugin Codex untuk run provider OpenClaw, binding percakapan
ACP, atau harness non-Codex apa pun.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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
  Plugin/aplikasi Codex native untuk harness Codex. Default: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  kebijakan tindakan destruktif default untuk elisitasi aplikasi Plugin yang dimigrasikan.
  Gunakan `true` untuk menerima skema persetujuan Codex yang aman tanpa prompt, `false`
  untuk menolaknya, `"auto"` untuk merutekan persetujuan yang diwajibkan Codex melalui
  persetujuan Plugin OpenClaw, atau `"ask"` untuk meminta prompt pada setiap tindakan
  tulis/destruktif Plugin tanpa persetujuan tahan lama. Mode `"ask"` menghapus override
  persetujuan per-tool Codex tahan lama untuk aplikasi yang terdampak dan memilih reviewer
  persetujuan manusia untuk aplikasi tersebut sebelum thread Codex dimulai.
  Default: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: mengaktifkan
  entri Plugin yang dimigrasikan ketika `codexPlugins.enabled` global juga true.
  Default: `true` untuk entri eksplisit.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identitas marketplace yang stabil. V1 hanya mendukung `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identitas
  Plugin Codex stabil dari migrasi, misalnya `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override tindakan destruktif per Plugin. Ketika dihilangkan, nilai
  `allow_destructive_actions` global digunakan. Nilai per Plugin menerima kebijakan
  `true`, `false`, `"auto"`, atau `"ask"` yang sama.

Setiap aplikasi Plugin yang diterima yang menggunakan `"ask"` merutekan permintaan
persetujuan aplikasi tersebut ke reviewer manusia. Aplikasi lain dan persetujuan thread
non-aplikasi mempertahankan reviewer yang dikonfigurasi, sehingga kebijakan Plugin
campuran tidak mewarisi perilaku `"ask"`.

`codexPlugins.enabled` adalah arahan pengaktifan global. Entri Plugin eksplisit
yang ditulis oleh migrasi adalah set kelayakan instalasi dan perbaikan tahan lama.
`plugins["*"]` tidak didukung, tidak ada switch `install`, dan nilai
`marketplacePath` lokal sengaja bukan field konfigurasi karena bersifat khusus host.

Pemeriksaan kesiapan `app/list` di-cache selama satu jam dan disegarkan
secara asinkron ketika usang. Konfigurasi aplikasi thread Codex dihitung saat
pembentukan sesi harness Codex, bukan pada setiap giliran; gunakan `/new`, `/reset`,
atau restart Gateway setelah mengubah konfigurasi Plugin native.

- `plugins.entries.firecrawl.config.webFetch`: pengaturan provider web-fetch Firecrawl.
  - `apiKey`: Kunci API Firecrawl opsional untuk batas yang lebih tinggi (menerima SecretRef). Melakukan fallback ke `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` lama, atau variabel env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL dasar API Firecrawl (default: `https://api.firecrawl.dev`; override self-hosted harus menargetkan endpoint privat/internal).
  - `onlyMainContent`: ekstrak hanya konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: timeout permintaan scrape dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan provider X Search.
  - `model`: model Grok yang akan digunakan untuk pencarian (mis. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan ambang batas.
  - `enabled`: switch utama Dreaming (default `false`).
  - `frequency`: cadence cron untuk setiap sweep Dreaming penuh (`"0 3 * * *"` secara default).
  - `model`: override model subagent Dream Diary opsional. Memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`; pasangkan dengan `allowedModels` untuk membatasi target. Error model tidak tersedia mencoba ulang sekali dengan model default sesi; kegagalan trust atau daftar izin tidak melakukan fallback secara diam-diam.
  - kebijakan fase dan ambang batas adalah detail implementasi (bukan key konfigurasi yang terlihat pengguna).
- Konfigurasi memori lengkap berada di [referensi konfigurasi memori](/id/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundel Claude yang diaktifkan juga dapat menyumbangkan default OpenClaw tertanam dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agen yang disanitasi, bukan sebagai patch konfigurasi OpenClaw mentah.
- `plugins.slots.memory`: pilih id Plugin memori aktif, atau `"none"` untuk menonaktifkan Plugin memori.
- `plugins.slots.contextEngine`: pilih id Plugin context engine aktif; default ke `"legacy"` kecuali Anda menginstal dan memilih engine lain.

Lihat [Plugin](/id/tools/plugin).

---

## Komitmen

`commitments` mengontrol memori tindak lanjut yang disimpulkan: OpenClaw dapat mendeteksi check-in dari giliran percakapan dan mengirimkannya melalui run Heartbeat.

- `commitments.enabled`: aktifkan ekstraksi LLM tersembunyi, penyimpanan, dan pengiriman Heartbeat untuk komitmen tindak lanjut yang disimpulkan. Default: `false`.
- `commitments.maxPerDay`: jumlah maksimum komitmen tindak lanjut yang disimpulkan yang dikirim per sesi agen dalam satu hari bergulir. Default: `3`.

Lihat [komitmen yang disimpulkan](/id/concepts/commitments).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
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
- `tabCleanup` mengambil kembali tab agen primer yang dilacak setelah waktu idle atau saat
  sesi melampaui batasnya. Atur `idleMinutes: 0` atau `maxTabsPerSession: 0` untuk
  menonaktifkan mode pembersihan individual tersebut.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan saat tidak disetel, sehingga navigasi browser tetap ketat secara default.
- Setel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` hanya saat Anda sengaja memercayai navigasi browser jaringan privat.
- Dalam mode ketat, endpoint profil CDP jarak jauh (`profiles.*.cdpUrl`) tunduk pada pemblokiran jaringan privat yang sama selama pemeriksaan keterjangkauan/penemuan.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil jarak jauh hanya untuk dilampirkan (mulai/berhenti/reset dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) saat Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  saat penyedia Anda memberi URL WebSocket DevTools langsung.
- `remoteCdpTimeoutMs` dan `remoteCdpHandshakeTimeoutMs` berlaku untuk keterjangkauan CDP jarak jauh dan
  `attachOnly` serta permintaan pembukaan tab. Profil local loopback terkelola
  mempertahankan default CDP lokal.
- Jika layanan CDP yang dikelola secara eksternal dapat dijangkau melalui loopback, setel
  `attachOnly: true` pada profil tersebut; jika tidak, OpenClaw memperlakukan port loopback sebagai
  profil browser terkelola lokal dan dapat melaporkan kesalahan kepemilikan port lokal.
- Profil `existing-session` menggunakan Chrome MCP, bukan CDP, dan dapat dilampirkan pada
  host yang dipilih atau melalui node browser yang terhubung.
- Profil `existing-session` dapat menyetel `userDataDir` untuk menargetkan profil browser
  berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` dapat menyetel `cdpUrl` saat Chrome sudah berjalan
  di belakang endpoint penemuan HTTP(S) DevTools atau endpoint WS(S) langsung. Dalam
  mode itu, OpenClaw meneruskan endpoint ke Chrome MCP alih-alih menggunakan koneksi otomatis;
  `userDataDir` diabaikan untuk argumen peluncuran Chrome MCP.
- Profil `existing-session` mempertahankan batas rute Chrome MCP saat ini:
  tindakan berbasis snapshot/ref, bukan penargetan pemilih CSS, hook unggah satu berkas,
  tanpa penggantian batas waktu dialog, tanpa `wait --load networkidle`, dan tanpa
  `responsebody`, ekspor PDF, intersepsi unduhan, atau tindakan batch.
- Profil `openclaw` terkelola lokal menetapkan `cdpPort` dan `cdpUrl` secara otomatis; setel
  `cdpUrl` secara eksplisit hanya untuk profil CDP jarak jauh atau pelampiran endpoint existing-session.
- Profil terkelola lokal dapat menyetel `executablePath` untuk mengganti
  `browser.executablePath` global bagi profil tersebut. Gunakan ini untuk menjalankan satu profil di
  Chrome dan profil lain di Brave.
- Profil terkelola lokal menggunakan `browser.localLaunchTimeoutMs` untuk penemuan HTTP Chrome CDP
  setelah proses dimulai dan `browser.localCdpReadyTimeoutMs` untuk
  kesiapan websocket CDP pascapeluncuran. Naikkan nilainya pada host yang lebih lambat tempat Chrome
  berhasil dimulai tetapi pemeriksaan kesiapan berpacu dengan startup. Kedua nilai harus berupa
  bilangan bulat positif hingga `120000` ms; nilai konfigurasi yang tidak valid ditolak.
- Urutan deteksi otomatis: browser default jika berbasis Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` dan `browser.profiles.<name>.executablePath` keduanya
  menerima `~` dan `~/...` untuk direktori home OS Anda sebelum peluncuran Chromium.
  `userDataDir` per profil pada profil `existing-session` juga diperluas dari tilde.
- Layanan kontrol: hanya loopback (port diturunkan dari `gateway.port`, default `18791`).
- `extraArgs` menambahkan flag peluncuran tambahan ke startup Chromium lokal (misalnya
  `--disable-gpu`, ukuran jendela, atau flag debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: warna aksen untuk chrome UI aplikasi native (warna gelembung Mode Bicara, dll.).
- `assistant`: penggantian identitas UI Kontrol. Kembali ke identitas agen aktif jika tidak ada.

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
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
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
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list for owner/admin callers
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

- `mode`: `local` (menjalankan gateway) atau `remote` (terhubung ke gateway jarak jauh). Gateway menolak untuk dimulai kecuali `local`.
- `port`: satu port multipleks untuk WS + HTTP. Presedensi: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (bawaan), `lan` (`0.0.0.0`), `tailnet` (hanya IP Tailscale), atau `custom`.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind bawaan `loopback` mendengarkan pada `127.0.0.1` di dalam kontainer. Dengan jaringan bridge Docker (`-p 18789:18789`), lalu lintas masuk melalui `eth0`, sehingga gateway tidak dapat dijangkau. Gunakan `--network host`, atau atur `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) untuk mendengarkan di semua antarmuka.
- **Autentikasi**: diwajibkan secara bawaan. Bind non-loopback memerlukan autentikasi gateway. Dalam praktiknya, ini berarti token/kata sandi bersama atau reverse proxy sadar-identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wisaya onboarding menghasilkan token secara bawaan.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRefs), tetapkan `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Alur startup dan instal/perbaikan layanan gagal ketika keduanya dikonfigurasi dan mode belum ditetapkan.
- `gateway.auth.mode: "none"`: mode tanpa autentikasi yang eksplisit. Gunakan hanya untuk penyiapan local loopback tepercaya; ini sengaja tidak ditawarkan oleh prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan autentikasi browser/pengguna ke reverse proxy sadar-identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth)). Mode ini mengharapkan sumber proxy **non-loopback** secara bawaan; reverse proxy loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit. Pemanggil internal pada host yang sama dapat menggunakan `gateway.auth.password` sebagai fallback langsung lokal; `gateway.auth.token` tetap saling eksklusif dengan mode trusted-proxy.
- `gateway.auth.allowTailscale`: ketika `true`, header identitas Tailscale Serve dapat memenuhi autentikasi Control UI/WebSocket (diverifikasi melalui `tailscale whois`). Endpoint API HTTP **tidak** menggunakan autentikasi header Tailscale tersebut; endpoint tersebut mengikuti mode autentikasi HTTP normal gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Bawaan ke `true` ketika `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: pembatas gagal-autentikasi opsional. Berlaku per IP klien dan per cakupan autentikasi (shared-secret dan device-token dilacak secara independen). Upaya yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada jalur Control UI Tailscale Serve asinkron, upaya gagal untuk `{scope, clientIp}` yang sama diserialkan sebelum penulisan kegagalan. Karena itu, upaya buruk bersamaan dari klien yang sama dapat memicu pembatas pada permintaan kedua alih-alih keduanya berlomba lolos sebagai ketidakcocokan biasa.
  - `gateway.auth.rateLimit.exemptLoopback` bawaan ke `true`; atur `false` ketika Anda sengaja ingin lalu lintas localhost juga dibatasi lajunya (untuk penyiapan pengujian atau deployment proxy ketat).
- Upaya autentikasi WS asal-browser selalu dibatasi lajunya dengan pengecualian loopback dinonaktifkan (pertahanan berlapis terhadap brute force localhost berbasis browser).
- Pada loopback, penguncian asal-browser tersebut diisolasi per nilai `Origin`
  yang dinormalisasi, sehingga kegagalan berulang dari satu origin localhost tidak otomatis
  mengunci origin lain.
- `tailscale.mode`: `serve` (hanya tailnet, bind loopback) atau `funnel` (publik, memerlukan autentikasi).
- `tailscale.serviceName`: nama Layanan Tailscale opsional untuk mode Serve, seperti
  `svc:openclaw`. Ketika ditetapkan, OpenClaw meneruskannya ke `tailscale serve
--service` sehingga Control UI dapat diekspos melalui Layanan bernama alih-alih
  hostname perangkat. Nilainya harus menggunakan format nama Layanan `svc:<dns-label>`
  milik Tailscale; startup melaporkan URL Layanan turunan.
- `tailscale.preserveFunnel`: ketika `true` dan `tailscale.mode = "serve"`, OpenClaw
  memeriksa `tailscale funnel status` sebelum menerapkan ulang Serve saat startup dan melewatinya
  jika rute Funnel yang dikonfigurasi secara eksternal sudah mencakup port gateway.
  Bawaan `false`.
- `controlUi.allowedOrigins`: daftar izin asal-browser eksplisit untuk koneksi WebSocket Gateway. Diperlukan untuk origin browser non-loopback publik. Pemuatan UI LAN/Tailnet privat same-origin dari loopback, RFC1918/link-local, `.local`, `.ts.net`, atau host CGNAT Tailscale diterima tanpa mengaktifkan fallback header Host.
- `controlUi.chatMessageMaxWidth`: lebar-maks opsional untuk pesan chat Control UI yang dikelompokkan. Menerima nilai lebar CSS terbatas seperti `960px`, `82%`, `min(1280px, 82%)`, dan `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan fallback origin header Host untuk deployment yang sengaja mengandalkan kebijakan origin header Host.
- `remote.transport`: `ssh` (bawaan) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus berupa `wss://` untuk host publik; plaintext `ws://` hanya diterima untuk loopback, LAN, link-local, `.local`, `.ts.net`, dan host CGNAT Tailscale.
- `remote.remotePort`: port gateway pada host SSH jarak jauh. Bawaan ke `18789`; gunakan ini ketika port tunnel lokal berbeda dari port gateway jarak jauh.
- `gateway.remote.token` / `.password` adalah kolom kredensial klien-jarak-jauh. Keduanya tidak mengonfigurasi autentikasi gateway dengan sendirinya.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS dasar untuk relay APNs eksternal yang digunakan setelah build iOS berbasis relay menerbitkan registrasi ke gateway. Build App Store publik menggunakan relay OpenClaw yang dihosting. URL relay kustom harus cocok dengan jalur build/deployment iOS yang sengaja terpisah dan URL relay-nya mengarah ke relay tersebut.
- `gateway.push.apns.relay.timeoutMs`: waktu habis pengiriman gateway-ke-relay dalam milidetik. Bawaan ke `10000`.
- Registrasi berbasis relay didelegasikan ke identitas gateway tertentu. Aplikasi iOS yang dipasangkan mengambil `gateway.identity.get`, menyertakan identitas tersebut dalam registrasi relay, dan meneruskan grant pengiriman bercakupan-registrasi ke gateway. Gateway lain tidak dapat menggunakan ulang registrasi tersimpan tersebut.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env sementara untuk konfigurasi relay di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: pintasan khusus pengembangan untuk URL relay HTTP loopback. URL relay produksi sebaiknya tetap menggunakan HTTPS.
- `gateway.handshakeTimeoutMs`: waktu habis handshake WebSocket Gateway pra-autentikasi dalam milidetik. Bawaan: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` memiliki presedensi ketika ditetapkan. Tingkatkan ini pada host yang terbebani atau berdaya rendah ketika klien lokal dapat terhubung sementara pemanasan startup masih stabil.
- `gateway.channelHealthCheckMinutes`: interval pemantau kesehatan channel dalam menit. Atur `0` untuk menonaktifkan restart pemantau kesehatan secara global. Bawaan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ambang soket usang dalam menit. Pertahankan ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`. Bawaan: `30`.
- `gateway.channelMaxRestartsPerHour`: restart pemantau kesehatan maksimum per channel/akun dalam satu jam bergulir. Bawaan: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per channel untuk restart pemantau kesehatan sambil tetap mengaktifkan pemantau global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per akun untuk channel multi-akun. Ketika ditetapkan, ini memiliki presedensi atas override tingkat channel.
- Jalur panggilan gateway lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` belum ditetapkan.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tanpa masking fallback jarak jauh).
- `trustedProxies`: IP reverse proxy yang menghentikan TLS atau menyuntikkan header klien-terusan. Hanya cantumkan proxy yang Anda kendalikan. Entri loopback tetap valid untuk penyiapan proxy/deteksi-lokal pada host yang sama (misalnya Tailscale Serve atau reverse proxy lokal), tetapi entri tersebut **tidak** membuat permintaan loopback memenuhi syarat untuk `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: ketika `true`, gateway menerima `X-Real-IP` jika `X-Forwarded-For` tidak ada. Bawaan `false` untuk perilaku gagal tertutup.
- `gateway.nodes.pairing.autoApproveCidrs`: daftar izin CIDR/IP opsional untuk menyetujui otomatis pemasangan perangkat node pertama kali tanpa cakupan yang diminta. Ini dinonaktifkan ketika belum ditetapkan. Ini tidak menyetujui otomatis pemasangan operator/browser/Control UI/WebChat, dan tidak menyetujui otomatis peningkatan peran, cakupan, metadata, atau kunci publik.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pembentukan izin/tolak global untuk perintah node yang dideklarasikan setelah pemasangan dan evaluasi daftar izin platform. Gunakan `allowCommands` untuk ikut mengaktifkan perintah node berbahaya seperti `camera.snap`, `camera.clip`, dan `screen.record`; `denyCommands` menghapus perintah meskipun bawaan platform atau izin eksplisit sebaliknya akan menyertakannya. Setelah node mengubah daftar perintah yang dideklarasikannya, tolak dan setujui ulang pemasangan perangkat tersebut agar gateway menyimpan snapshot perintah yang diperbarui.
- `gateway.tools.deny`: nama tool tambahan yang diblokir untuk HTTP `POST /tools/invoke` (memperluas daftar tolak bawaan).
- `gateway.tools.allow`: hapus nama tool dari daftar tolak HTTP bawaan untuk
  pemanggil owner/admin. Ini tidak meningkatkan pemanggil `operator.write`
  yang membawa identitas menjadi akses owner/admin; `cron`, `gateway`, dan `nodes` tetap
  tidak tersedia bagi pemanggil non-owner meskipun masuk daftar izin.

</Accordion>

### Endpoint yang kompatibel dengan OpenAI

- RPC HTTP Admin: nonaktif secara bawaan sebagai Plugin `admin-http-rpc`. Aktifkan Plugin untuk mendaftarkan `POST /api/v1/admin/rpc`. Lihat [RPC HTTP Admin](/id/plugins/admin-http-rpc).
- Chat Completions: dinonaktifkan secara bawaan. Aktifkan dengan `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Pengerasan input URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Daftar izin kosong diperlakukan sebagai belum ditetapkan; gunakan `gateway.http.endpoints.responses.files.allowUrl=false`
    dan/atau `gateway.http.endpoints.responses.images.allowUrl=false` untuk menonaktifkan pengambilan URL.
- Header pengerasan respons opsional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (tetapkan hanya untuk origin HTTPS yang Anda kendalikan; lihat [Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolasi multi-instans

Jalankan beberapa gateway pada satu host dengan port dan direktori state yang unik:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag kemudahan: `--dev` (menggunakan `~/.openclaw-dev` + port `19001`), `--profile <name>` (menggunakan `~/.openclaw-<name>`).

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

- `enabled`: mengaktifkan terminasi TLS pada listener gateway (HTTPS/WSS) (bawaan: `false`).
- `autoGenerate`: menghasilkan otomatis pasangan sertifikat/kunci self-signed lokal ketika file eksplisit tidak dikonfigurasi; hanya untuk penggunaan lokal/dev.
- `certPath`: path sistem file ke file sertifikat TLS.
- `keyPath`: path sistem file ke file kunci privat TLS; jaga agar izinnya dibatasi.
- `caPath`: path bundle CA opsional untuk verifikasi klien atau rantai kepercayaan kustom.

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

- `mode`: mengontrol bagaimana pengeditan config diterapkan saat runtime.
  - `"off"`: abaikan pengeditan live; perubahan memerlukan restart eksplisit.
  - `"restart"`: selalu restart proses Gateway saat config berubah.
  - `"hot"`: terapkan perubahan di dalam proses tanpa restart.
  - `"hybrid"` (default): coba hot reload terlebih dahulu; fallback ke restart jika diperlukan.
- `debounceMs`: jendela debounce dalam ms sebelum perubahan config diterapkan (bilangan bulat non-negatif).
- `deferralTimeoutMs`: waktu maksimum opsional dalam ms untuk menunggu operasi yang sedang berjalan sebelum memaksa restart atau hot reload channel. Hilangkan untuk menggunakan waktu tunggu berbatas default (`300000`); atur `0` untuk menunggu tanpa batas waktu dan mencatat peringatan berkala bahwa masih ada yang tertunda.

---

## Hook

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
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
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` atau `x-openclaw-token: <token>`.
Token hook query-string ditolak.

Catatan validasi dan keamanan:

- `hooks.enabled=true` memerlukan `hooks.token` yang tidak kosong.
- `hooks.token` harus berbeda dari auth shared-secret Gateway aktif (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); startup mencatat peringatan keamanan non-fatal saat mendeteksi penggunaan ulang.
- `openclaw security audit` menandai penggunaan ulang auth hook/Gateway sebagai temuan kritis, termasuk auth kata sandi Gateway yang diberikan hanya saat audit (`--auth password --password <password>`). Jalankan `openclaw doctor --fix` untuk merotasi `hooks.token` yang tersimpan dan digunakan ulang, lalu perbarui pengirim hook eksternal agar menggunakan token hook baru.
- `hooks.path` tidak boleh `/`; gunakan subpath khusus seperti `/hooks`.
- Jika `hooks.allowRequestSessionKey=true`, batasi `hooks.allowedSessionKeyPrefixes` (misalnya `["hook:"]`).
- Jika mapping atau preset menggunakan `sessionKey` bertemplat, atur `hooks.allowedSessionKeyPrefixes` dan `hooks.allowRequestSessionKey=true`. Kunci mapping statis tidak memerlukan opt-in tersebut.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dari payload permintaan hanya diterima saat `hooks.allowRequestSessionKey=true` (default: `false`).
- `POST /hooks/<name>` → diselesaikan melalui `hooks.mappings`
  - Nilai mapping `sessionKey` yang dirender template diperlakukan sebagai dipasok secara eksternal dan juga memerlukan `hooks.allowRequestSessionKey=true`.

<Accordion title="Detail mapping">

- `match.path` mencocokkan sub-path setelah `/hooks` (mis. `/hooks/gmail` → `gmail`).
- `match.source` mencocokkan field payload untuk path generik.
- Template seperti `{{messages[0].subject}}` membaca dari payload.
- `transform` dapat menunjuk ke modul JS/TS yang mengembalikan tindakan hook.
  - `transform.module` harus berupa path relatif dan tetap berada di dalam `hooks.transformsDir` (path absolut dan traversal ditolak).
  - Simpan `hooks.transformsDir` di bawah `~/.openclaw/hooks/transforms`; direktori skill workspace ditolak. Jika `openclaw doctor` melaporkan path ini tidak valid, pindahkan modul transform ke direktori transform hook atau hapus `hooks.transformsDir`.
- `agentId` merutekan ke agen tertentu; ID yang tidak dikenal fallback ke agen default.
- `allowedAgentIds`: membatasi routing agen efektif, termasuk path agen default saat `agentId` dihilangkan (`*` atau dihilangkan = izinkan semua, `[]` = tolak semua).
- `defaultSessionKey`: kunci sesi tetap opsional untuk run agen hook tanpa `sessionKey` eksplisit.
- `allowRequestSessionKey`: izinkan pemanggil `/hooks/agent` dan kunci sesi mapping berbasis template untuk mengatur `sessionKey` (default: `false`).
- `allowedSessionKeyPrefixes`: allowlist prefiks opsional untuk nilai `sessionKey` eksplisit (permintaan + mapping), mis. `["hook:"]`. Ini menjadi wajib saat mapping atau preset mana pun menggunakan `sessionKey` bertemplat.
- `deliver: true` mengirim balasan akhir ke channel; `channel` default ke `last`.
- `model` mengganti LLM untuk run hook ini (harus diizinkan jika katalog model diatur).

</Accordion>

### Integrasi Gmail

- Preset Gmail bawaan menggunakan `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jika Anda mempertahankan routing per pesan tersebut, atur `hooks.allowRequestSessionKey: true` dan batasi `hooks.allowedSessionKeyPrefixes` agar cocok dengan namespace Gmail, misalnya `["hook:", "hook:gmail:"]`.
- Jika Anda memerlukan `hooks.allowRequestSessionKey: false`, timpa preset dengan `sessionKey` statis alih-alih default bertemplat.

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
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway otomatis memulai `gog gmail watch serve` saat boot jika dikonfigurasi. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkan.
- Jangan jalankan `gog gmail watch serve` terpisah bersama Gateway.

---

## Host Plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Menyajikan HTML/CSS/JS yang dapat diedit agen dan A2UI melalui HTTP di bawah port Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Hanya lokal: pertahankan `gateway.bind: "loopback"` (default).
- Bind non-loopback: rute canvas memerlukan auth Gateway (token/password/trusted-proxy), sama seperti permukaan HTTP Gateway lainnya.
- Node WebViews biasanya tidak mengirim header auth; setelah node dipasangkan dan terhubung, Gateway mengiklankan URL kemampuan berskala node untuk akses canvas/A2UI.
- URL kemampuan terikat ke sesi WS node aktif dan kedaluwarsa dengan cepat. Fallback berbasis IP tidak digunakan.
- Menyuntikkan klien live-reload ke HTML yang disajikan.
- Otomatis membuat `index.html` awal saat kosong.
- Juga menyajikan A2UI di `/__openclaw__/a2ui/`.
- Perubahan memerlukan restart gateway.
- Nonaktifkan live reload untuk direktori besar atau error `EMFILE`.

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

- `minimal` (default saat Plugin `bonjour` bundel diaktifkan): hilangkan `cliPath` + `sshPort` dari rekaman TXT.
- `full`: sertakan `cliPath` + `sshPort`; iklan multicast LAN masih memerlukan Plugin `bonjour` bundel untuk diaktifkan.
- `off`: cegah iklan multicast LAN tanpa mengubah pengaktifan Plugin.
- Plugin `bonjour` bundel otomatis dimulai pada host macOS dan bersifat opt-in pada Linux, Windows, dan deployment Gateway dalam container.
- Hostname default ke hostname sistem saat berupa label DNS yang valid, dengan fallback ke `openclaw`. Timpa dengan `OPENCLAW_MDNS_HOSTNAME`.

### Area luas (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Menulis zona DNS-SD unicast di bawah `~/.openclaw/dns/`. Untuk penemuan lintas jaringan, sandingkan dengan server DNS (CoreDNS direkomendasikan) + split DNS Tailscale.

Penyiapan: `openclaw dns setup --apply`.

---

## Lingkungan

### `env` (variabel env inline)

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

- Variabel env inline hanya diterapkan jika env proses tidak memiliki kunci tersebut.
- File `.env`: `.env` CWD + `~/.openclaw/.env` (keduanya tidak menimpa variabel yang sudah ada).
- `shellEnv`: mengimpor kunci yang diharapkan tetapi belum ada dari profil shell login Anda.
- Lihat [Lingkungan](/id/help/environment) untuk presedensi lengkap.

### Substitusi variabel env

Rujuk variabel env dalam string konfigurasi apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Hanya nama huruf besar yang dicocokkan: `[A-Z_][A-Z0-9_]*`.
- Variabel yang hilang/kosong menyebabkan error saat konfigurasi dimuat.
- Escape dengan `$${VAR}` untuk literal `${VAR}`.
- Berfungsi dengan `$include`.

---

## Rahasia

Ref rahasia bersifat aditif: nilai plaintext tetap berfungsi.

### `SecretRef`

Gunakan satu bentuk objek:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validasi:

- Pola `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Pola id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id `source: "file"`: pointer JSON absolut (misalnya `"/providers/openai/apiKey"`)
- Pola id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (mendukung selector bergaya AWS `secret#json_key`)
- id `source: "exec"` tidak boleh berisi segmen jalur berbatas slash `.` atau `..` (misalnya `a/../b` ditolak)

### Permukaan kredensial yang didukung

- Matriks kanonis: [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)
- `secrets apply` menargetkan jalur kredensial `openclaw.json` yang didukung.
- Ref `auth-profiles.json` disertakan dalam resolusi runtime dan cakupan audit.

### Konfigurasi penyedia rahasia

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
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
- Jalur penyedia file dan exec gagal tertutup saat verifikasi ACL Windows tidak tersedia. Tetapkan `allowInsecurePath: true` hanya untuk jalur tepercaya yang tidak dapat diverifikasi.
- Penyedia `exec` memerlukan jalur `command` absolut dan menggunakan payload protokol pada stdin/stdout.
- Secara default, jalur perintah symlink ditolak. Tetapkan `allowSymlinkCommand: true` untuk mengizinkan jalur symlink sambil memvalidasi jalur target yang telah di-resolve.
- Jika `trustedDirs` dikonfigurasi, pemeriksaan direktori tepercaya diterapkan pada jalur target yang telah di-resolve.
- Lingkungan child `exec` minimal secara default; teruskan variabel yang diperlukan secara eksplisit dengan `passEnv`.
- Ref rahasia di-resolve pada waktu aktivasi menjadi snapshot dalam memori, lalu jalur permintaan hanya membaca snapshot tersebut.
- Pemfilteran permukaan aktif diterapkan selama aktivasi: ref yang belum di-resolve pada permukaan yang diaktifkan menggagalkan startup/reload, sedangkan permukaan tidak aktif dilewati dengan diagnostik.

---

## Penyimpanan auth

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
- `auth-profiles.json` mendukung ref tingkat nilai (`keyRef` untuk `api_key`, `tokenRef` untuk `token`) untuk mode kredensial statis.
- Peta datar lama `auth-profiles.json` seperti `{ "provider": { "apiKey": "..." } }` bukan format runtime; `openclaw doctor --fix` menulis ulang peta tersebut menjadi profil kunci API kanonis `provider:default` dengan cadangan `.legacy-flat.*.bak`.
- Profil mode OAuth (`auth.profiles.<id>.mode = "oauth"`) tidak mendukung kredensial auth-profile berbasis SecretRef.
- Kredensial runtime statis berasal dari snapshot terselesaikan dalam memori; entri statis lama `auth.json` dibersihkan saat ditemukan.
- Impor OAuth lama berasal dari `~/.openclaw/credentials/oauth.json`.
- Lihat [OAuth](/id/concepts/oauth).
- Perilaku runtime rahasia dan tooling `audit/configure/apply`: [Manajemen Rahasia](/id/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: backoff dasar dalam jam saat profil gagal karena galat
  penagihan/kredit-tidak-cukup yang sebenarnya (default: `5`). Teks penagihan eksplisit masih dapat
  masuk ke sini bahkan pada respons `401`/`403`, tetapi pencocok teks spesifik penyedia
  tetap dibatasi ke penyedia yang memilikinya (misalnya OpenRouter
  `Key limit exceeded`). Pesan HTTP `402` yang dapat dicoba ulang untuk jendela penggunaan atau
  batas pengeluaran organisasi/workspace tetap berada di jalur `rate_limit`
  sebagai gantinya.
- `billingBackoffHoursByProvider`: override opsional per penyedia untuk jam backoff penagihan.
- `billingMaxHours`: batas dalam jam untuk pertumbuhan eksponensial backoff penagihan (default: `24`).
- `authPermanentBackoffMinutes`: backoff dasar dalam menit untuk kegagalan `auth_permanent` berkeyakinan tinggi (default: `10`).
- `authPermanentMaxMinutes`: batas dalam menit untuk pertumbuhan backoff `auth_permanent` (default: `60`).
- `failureWindowHours`: jendela bergulir dalam jam yang digunakan untuk penghitung backoff (default: `24`).
- `overloadedProfileRotations`: rotasi auth-profile penyedia yang sama maksimum untuk galat overloaded sebelum beralih ke fallback model (default: `1`). Bentuk penyedia-sibuk seperti `ModelNotReadyException` masuk ke sini.
- `overloadedBackoffMs`: jeda tetap sebelum mencoba ulang rotasi penyedia/profil yang overloaded (default: `0`).
- `rateLimitedProfileRotations`: rotasi auth-profile penyedia yang sama maksimum untuk galat batas laju sebelum beralih ke fallback model (default: `1`). Bucket batas laju tersebut mencakup teks berbentuk penyedia seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, dan `resource exhausted`.

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

- File log default: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Tetapkan `logging.file` untuk jalur yang stabil.
- `consoleLevel` naik ke `debug` saat `--verbose`.
- `maxFileBytes`: ukuran file log aktif maksimum dalam byte sebelum rotasi (bilangan bulat positif; default: `104857600` = 100 MB). OpenClaw menyimpan hingga lima arsip bernomor di samping file aktif.
- `redactSensitive` / `redactPatterns`: masking upaya terbaik untuk output konsol, log file, catatan log OTLP, dan teks transkrip sesi yang dipersistenkan. `redactSensitive: "off"` hanya menonaktifkan kebijakan umum log/transkrip ini; permukaan keselamatan UI/tool/diagnostik tetap menyunting rahasia sebelum emisi.

---

## Diagnostik

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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

- `enabled`: toggle utama untuk output instrumentasi (default: `true`).
- `flags`: array string flag yang mengaktifkan output log tertarget (mendukung wildcard seperti `"telegram.*"` atau `"*"`).
- `stuckSessionWarnMs`: ambang usia tanpa progres dalam ms untuk mengklasifikasikan sesi pemrosesan berjalan lama sebagai `session.long_running`, `session.stalled`, atau `session.stuck`. Balasan, tool, status, blok, dan progres ACP mereset timer; diagnostik `session.stuck` berulang melakukan backoff selama tidak berubah.
- `stuckSessionAbortMs`: ambang usia tanpa progres dalam ms sebelum pekerjaan aktif yang macet dan memenuhi syarat dapat di-abort-drain untuk pemulihan. Jika tidak disetel, OpenClaw menggunakan jendela embedded-run diperpanjang yang lebih aman, minimal 5 menit dan 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: menangkap snapshot stabilitas pra-OOM yang disunting saat tekanan memori mencapai `critical` (default: `false`). Setel ke `true` untuk menambahkan pemindaian/penulisan file bundle stabilitas sambil tetap mempertahankan peristiwa tekanan memori normal.
- `otel.enabled`: mengaktifkan pipeline ekspor OpenTelemetry (default: `false`). Untuk konfigurasi lengkap, katalog sinyal, dan model privasi, lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- `otel.endpoint`: URL kolektor untuk ekspor OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP opsional spesifik sinyal. Saat disetel, endpoint ini menggantikan `otel.endpoint` hanya untuk sinyal tersebut.
- `otel.protocol`: `"http/protobuf"` (default) atau `"grpc"`.
- `otel.headers`: header metadata HTTP/gRPC ekstra yang dikirim bersama permintaan ekspor OTel.
- `otel.serviceName`: nama layanan untuk atribut resource.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktifkan ekspor trace, metrik, atau log.
- `otel.logsExporter`: sink ekspor log: `"otlp"` (default), `"stdout"` untuk satu objek JSON per baris stdout, atau `"both"`.
- `otel.sampleRate`: laju sampling trace `0`-`1`.
- `otel.flushIntervalMs`: interval flush telemetri berkala dalam ms.
- `otel.captureContent`: pengambilan konten mentah opt-in untuk atribut span OTEL. Defaultnya nonaktif. Boolean `true` menangkap konten pesan/tool non-sistem; bentuk objek memungkinkan Anda mengaktifkan `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt`, dan `toolDefinitions` secara eksplisit.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: toggle lingkungan untuk bentuk span inferensi GenAI eksperimental terbaru, termasuk nama span `{gen_ai.operation.name} {gen_ai.request.model}`, jenis span `CLIENT`, dan `gen_ai.provider.name` alih-alih `gen_ai.system` lama. Secara default, span mempertahankan `openclaw.model.call` dan `gen_ai.system` untuk kompatibilitas; metrik GenAI menggunakan atribut semantik terbatas.
- `OPENCLAW_OTEL_PRELOADED=1`: toggle lingkungan untuk host yang sudah mendaftarkan SDK OpenTelemetry global. OpenClaw kemudian melewati startup/shutdown SDK milik plugin sambil tetap menjaga listener diagnostik aktif.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, dan `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabel env endpoint spesifik sinyal yang digunakan saat kunci konfigurasi yang sesuai tidak disetel.
- `cacheTrace.enabled`: catat snapshot trace cache untuk embedded run (default: `false`).
- `cacheTrace.filePath`: jalur output untuk JSONL trace cache (default: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: mengontrol apa yang disertakan dalam output trace cache (semua default: `true`).

---

## Pembaruan

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: kanal rilis untuk instalasi npm/git - `"stable"`, `"beta"`, atau `"dev"`.
- `checkOnStart`: periksa pembaruan npm saat gateway dimulai (default: `true`).
- `auto.enabled`: aktifkan pembaruan otomatis latar belakang untuk instalasi paket (default: `false`).
- `auto.stableDelayHours`: jeda minimum dalam jam sebelum auto-apply kanal stabil (default: `6`; maks: `168`).
- `auto.stableJitterHours`: jendela sebaran rollout kanal stabil ekstra dalam jam (default: `12`; maks: `168`).
- `auto.betaCheckIntervalHours`: seberapa sering pemeriksaan kanal beta berjalan dalam jam (default: `1`; maks: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: gerbang fitur ACP global (default: `true`; setel `false` untuk menyembunyikan dispatch ACP dan affordance spawn).
- `dispatch.enabled`: gerbang independen untuk dispatch giliran sesi ACP (default: `true`). Setel `false` untuk mempertahankan perintah ACP tersedia sambil memblokir eksekusi.
- `backend`: id backend runtime ACP default (harus cocok dengan plugin runtime ACP terdaftar).
  Instal plugin backend terlebih dahulu, dan jika `plugins.allow` disetel, sertakan id plugin backend (misalnya `acpx`) atau backend ACP tidak akan dimuat.
- `defaultAgent`: id agen target ACP fallback saat spawn tidak menentukan target eksplisit.
- `allowedAgents`: allowlist id agen yang diizinkan untuk sesi runtime ACP; kosong berarti tidak ada pembatasan tambahan.
- `maxConcurrentSessions`: jumlah maksimum sesi ACP aktif secara bersamaan.
- `stream.coalesceIdleMs`: jendela flush idle dalam ms untuk teks yang di-stream.
- `stream.maxChunkChars`: ukuran chunk maksimum sebelum memecah proyeksi blok yang di-stream.
- `stream.repeatSuppression`: tekan baris status/tool berulang per giliran (default: `true`).
- `stream.deliveryMode`: `"live"` melakukan stream secara inkremental; `"final_only"` melakukan buffer hingga peristiwa terminal giliran.
- `stream.hiddenBoundarySeparator`: pemisah sebelum teks terlihat setelah peristiwa tool tersembunyi (default: `"paragraph"`).
- `stream.maxOutputChars`: karakter output asisten maksimum yang diproyeksikan per giliran ACP.
- `stream.maxSessionUpdateChars`: karakter maksimum untuk baris status/pembaruan ACP yang diproyeksikan.
- `stream.tagVisibility`: rekaman nama tag ke override visibilitas boolean untuk peristiwa yang di-stream.
- `runtime.ttlMinutes`: TTL idle dalam menit untuk pekerja sesi ACP sebelum memenuhi syarat untuk cleanup.
- `runtime.installCommand`: perintah instal opsional untuk dijalankan saat bootstrap lingkungan runtime ACP.

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

## Panduan

Metadata yang ditulis oleh alur penyiapan terpandu CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Identitas

Lihat bidang identitas `agents.list` di bawah [Default agen](/id/gateway/config-agents#agent-defaults).

---

## Jembatan (legacy, dihapus)

Build saat ini tidak lagi menyertakan jembatan TCP. Node terhubung melalui Gateway WebSocket. Key `bridge.*` tidak lagi menjadi bagian dari skema konfigurasi (validasi gagal sampai key tersebut dihapus; `openclaw doctor --fix` dapat menghapus key yang tidak dikenal).

<Accordion title="Konfigurasi jembatan legacy (referensi historis)">

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: berapa lama sesi cron terisolasi yang selesai dipertahankan sebelum dipangkas dari `sessions.json`. Ini juga mengontrol pembersihan transkrip cron terhapus yang diarsipkan. Default: `24h`; atur `false` untuk menonaktifkan.
- `runLog.maxBytes`: diterima untuk kompatibilitas dengan log eksekusi cron lama yang berbasis file. Default: `2_000_000` byte.
- `runLog.keepLines`: baris riwayat eksekusi SQLite terbaru yang dipertahankan per job. Default: `2000`.
- `webhookToken`: token bearer yang digunakan untuk pengiriman POST Webhook cron (`delivery.mode = "webhook"`); jika dihilangkan, tidak ada header auth yang dikirim.
- `webhook`: URL Webhook fallback legacy yang sudah tidak digunakan (http/https), digunakan oleh `openclaw doctor --fix` untuk memigrasikan job tersimpan yang masih memiliki `notify: true`; pengiriman runtime menggunakan `delivery.mode="webhook"` per job ditambah `delivery.to`, atau `delivery.completionDestination` saat mempertahankan pengiriman pengumuman.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: retry maksimum untuk job cron pada error sementara (default: `3`; rentang: `0`-`10`).
- `backoffMs`: array jeda backoff dalam ms untuk setiap percobaan retry (default: `[30000, 60000, 300000]`; 1-10 entri).
- `retryOn`: jenis error yang memicu retry - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Hilangkan untuk melakukan retry pada semua jenis sementara.

Job sekali jalan tetap aktif sampai percobaan retry habis, lalu dinonaktifkan sambil mempertahankan status error akhir. Job berulang menggunakan kebijakan retry sementara yang sama untuk berjalan lagi setelah backoff sebelum slot terjadwal berikutnya; error permanen atau retry sementara yang habis kembali ke jadwal berulang normal dengan backoff error.

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

- `enabled`: aktifkan peringatan kegagalan untuk job cron (default: `false`).
- `after`: kegagalan berturut-turut sebelum peringatan dikirim (bilangan bulat positif, min: `1`).
- `cooldownMs`: milidetik minimum antara peringatan berulang untuk job yang sama (bilangan bulat non-negatif).
- `includeSkipped`: hitung eksekusi yang dilewati secara berturut-turut terhadap ambang peringatan (default: `false`). Eksekusi yang dilewati dilacak terpisah dan tidak memengaruhi backoff error eksekusi.
- `mode`: mode pengiriman - `"announce"` mengirim melalui pesan channel; `"webhook"` memposting ke Webhook yang dikonfigurasi.
- `accountId`: akun atau id channel opsional untuk membatasi cakupan pengiriman peringatan.

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

- Tujuan default untuk notifikasi kegagalan cron di semua job.
- `mode`: `"announce"` atau `"webhook"`; default ke `"announce"` saat data target yang cukup tersedia.
- `channel`: override channel untuk pengiriman pengumuman. `"last"` menggunakan ulang channel pengiriman terakhir yang diketahui.
- `to`: target pengumuman eksplisit atau URL Webhook. Wajib untuk mode Webhook.
- `accountId`: override akun opsional untuk pengiriman.
- `delivery.failureDestination` per job mengesampingkan default global ini.
- Saat tujuan kegagalan global maupun per job tidak diatur, job yang sudah mengirim melalui `announce` kembali ke target pengumuman utama tersebut saat gagal.
- `delivery.failureDestination` hanya didukung untuk job `sessionTarget="isolated"` kecuali `delivery.mode` utama job adalah `"webhook"`.

Lihat [Job Cron](/id/automation/cron-jobs). Eksekusi cron terisolasi dilacak sebagai [tugas latar belakang](/id/automation/tasks).

---

## Variabel templat model media

Placeholder templat yang diperluas di `tools.media.models[].args`:

| Variabel           | Deskripsi                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Isi lengkap pesan masuk                           |
| `{{RawBody}}`      | Isi mentah (tanpa pembungkus riwayat/pengirim)    |
| `{{BodyStripped}}` | Isi dengan mention grup dihapus                   |
| `{{From}}`         | Pengidentifikasi pengirim                         |
| `{{To}}`           | Pengidentifikasi tujuan                           |
| `{{MessageSid}}`   | id pesan channel                                  |
| `{{SessionId}}`    | UUID sesi saat ini                                |
| `{{IsNewSession}}` | `"true"` saat sesi baru dibuat                    |
| `{{MediaUrl}}`     | URL semu media masuk                              |
| `{{MediaPath}}`    | Path media lokal                                  |
| `{{MediaType}}`    | Jenis media (gambar/audio/dokumen/…)              |
| `{{Transcript}}`   | Transkrip audio                                   |
| `{{Prompt}}`       | Prompt media yang diselesaikan untuk entri CLI    |
| `{{MaxChars}}`     | Karakter output maks yang diselesaikan untuk entri CLI |
| `{{ChatType}}`     | `"direct"` atau `"group"`                         |
| `{{GroupSubject}}` | Subjek grup (upaya terbaik)                       |
| `{{GroupMembers}}` | Pratinjau anggota grup (upaya terbaik)            |
| `{{SenderName}}`   | Nama tampilan pengirim (upaya terbaik)            |
| `{{SenderE164}}`   | Nomor telepon pengirim (upaya terbaik)            |
| `{{Provider}}`     | Petunjuk provider (whatsapp, telegram, discord, dll.) |

---

## Penyertaan konfigurasi (`$include`)

Bagi konfigurasi ke beberapa file:

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

**Perilaku merge:**

- Satu file: menggantikan objek yang memuatnya.
- Array file: di-deep-merge sesuai urutan (yang belakangan mengesampingkan yang lebih awal).
- Key saudara: digabung setelah include (mengesampingkan nilai yang disertakan).
- Include bersarang: hingga kedalaman 10 level.
- Path: diselesaikan relatif terhadap file yang menyertakan, tetapi harus tetap berada di dalam direktori konfigurasi tingkat atas (`dirname` dari `openclaw.json`). Bentuk absolut/`../` hanya diizinkan saat masih diselesaikan di dalam batas tersebut. Path tidak boleh berisi byte null dan harus benar-benar lebih pendek dari 4096 karakter sebelum dan sesudah resolusi.
- Penulisan milik OpenClaw yang hanya mengubah satu bagian tingkat atas yang didukung oleh include satu file menulis langsung ke file yang disertakan tersebut. Misalnya, `plugins install` memperbarui `plugins: { $include: "./plugins.json5" }` di `plugins.json5` dan membiarkan `openclaw.json` tetap utuh.
- Include root, array include, dan include dengan override saudara bersifat hanya-baca untuk penulisan milik OpenClaw; penulisan tersebut gagal tertutup alih-alih meratakan konfigurasi.
- Error: pesan jelas untuk file yang hilang, error parse, include melingkar, format path tidak valid, dan panjang berlebihan.

---

_Terkait: [Konfigurasi](/id/gateway/configuration) · [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
