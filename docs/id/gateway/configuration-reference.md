---
read_when:
    - Anda memerlukan semantik atau nilai default konfigurasi tingkat bidang yang tepat
    - Anda sedang memvalidasi blok konfigurasi saluran, model, Gateway, atau alat
summary: Referensi konfigurasi Gateway untuk kunci inti OpenClaw, nilai bawaan, dan tautan ke referensi subsistem khusus
title: Referensi konfigurasi
x-i18n:
    generated_at: "2026-05-12T00:58:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referensi konfigurasi inti untuk `~/.openclaw/openclaw.json`. Untuk ikhtisar berorientasi tugas, lihat [Konfigurasi](/id/gateway/configuration).

Mencakup permukaan konfigurasi utama OpenClaw dan menautkan keluar ketika suatu subsistem memiliki referensi yang lebih mendalam. Katalog perintah milik kanal dan plugin serta knob memori/QMD mendalam berada di halaman masing-masing, bukan di halaman ini.

Kebenaran kode:

- `openclaw config schema` mencetak JSON Schema aktif yang digunakan untuk validasi dan Control UI, dengan metadata bundled/plugin/kanal digabungkan saat tersedia
- `config.schema.lookup` mengembalikan satu node skema yang dibatasi path untuk alat drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` memvalidasi hash baseline dokumentasi konfigurasi terhadap permukaan skema saat ini

Path pencarian agen: gunakan aksi alat `gateway` `config.schema.lookup` untuk
dokumentasi dan batasan tingkat field yang tepat sebelum pengeditan. Gunakan
[Konfigurasi](/id/gateway/configuration) untuk panduan berorientasi tugas dan halaman ini
untuk peta field yang lebih luas, default, dan tautan ke referensi subsistem.

Referensi mendalam khusus:

- [Referensi konfigurasi memori](/id/reference/memory-config) untuk `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, dan konfigurasi dreaming di bawah `plugins.entries.memory-core.config.dreaming`
- [Perintah slash](/id/tools/slash-commands) untuk katalog perintah bawaan + bundled saat ini
- halaman kanal/plugin pemilik untuk permukaan perintah khusus kanal

Format konfigurasi adalah **JSON5** (komentar + koma akhir diizinkan). Semua field bersifat opsional - OpenClaw menggunakan default aman saat dihilangkan.

---

## Kanal

Kunci konfigurasi per kanal dipindahkan ke halaman khusus - lihat
[Konfigurasi - kanal](/id/gateway/config-channels) untuk `channels.*`,
termasuk Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan kanal
bundled lainnya (auth, kontrol akses, multi-akun, mention gating).

## Default agen, multi-agen, sesi, dan pesan

Dipindahkan ke halaman khusus - lihat
[Konfigurasi - agen](/id/gateway/config-agents) untuk:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memori, media, skills, sandbox)
- `multiAgent.*` (routing dan binding multi-agen)
- `session.*` (siklus hidup sesi, compaction, pruning)
- `messages.*` (pengiriman pesan, TTS, rendering markdown)
- `talk.*` (mode Talk)
  - `talk.consultThinkingLevel`: override tingkat thinking untuk seluruh run agen OpenClaw di balik konsultasi realtime Control UI Talk
  - `talk.consultFastMode`: override fast-mode sekali pakai untuk konsultasi realtime Control UI Talk
  - `talk.speechLocale`: id locale BCP 47 opsional untuk pengenalan ucapan Talk di iOS/macOS
  - `talk.silenceTimeoutMs`: saat tidak disetel, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms on macOS and Android, 900 ms on iOS`)

## Alat dan penyedia kustom

Kebijakan alat, toggle eksperimental, konfigurasi alat berbasis penyedia, dan penyiapan
penyedia kustom / base-URL dipindahkan ke halaman khusus - lihat
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
- `models.providers`: peta penyedia kustom yang dikunci berdasarkan id penyedia.
- `models.providers.*.localService`: manajer proses sesuai permintaan opsional untuk
  server model lokal. OpenClaw memeriksa endpoint kesehatan yang dikonfigurasi, memulai
  `command` absolut saat diperlukan, menunggu kesiapan, lalu mengirim permintaan
  model. Lihat [Layanan model lokal](/id/gateway/local-model-services).
- `models.pricing.enabled`: mengontrol bootstrap pricing latar belakang yang
  dimulai setelah sidecar dan kanal mencapai path Gateway siap. Saat `false`,
  Gateway melewati fetch katalog pricing OpenRouter dan LiteLLM; nilai
  `models.providers.*.models[].cost` yang dikonfigurasi tetap berfungsi untuk estimasi biaya lokal.

## MCP

Definisi server MCP yang dikelola OpenClaw berada di bawah `mcp.servers` dan
dikonsumsi oleh Pi tertanam serta adaptor runtime lainnya. Perintah `openclaw mcp list`,
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
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: definisi server MCP stdio atau jarak jauh bernama untuk runtime yang
  mengekspos alat MCP yang dikonfigurasi.
  Entri jarak jauh menggunakan `transport: "streamable-http"` atau `transport: "sse"`;
  `type: "http"` adalah alias native CLI yang dinormalisasi oleh `openclaw mcp set` dan
  `openclaw doctor --fix` ke field `transport` kanonis.
- `mcp.sessionIdleTtlMs`: TTL idle untuk runtime MCP bundled yang dibatasi sesi.
  Run tertanam sekali pakai meminta pembersihan akhir run; TTL ini adalah penopang untuk
  sesi berumur panjang dan pemanggil masa depan.
- Perubahan di bawah `mcp.*` diterapkan panas dengan membuang runtime MCP sesi yang di-cache.
  Penemuan/penggunaan alat berikutnya membuatnya ulang dari konfigurasi baru, sehingga entri
  `mcp.servers` yang dihapus dipanen segera alih-alih menunggu TTL idle.

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

- `allowBundled`: allowlist opsional hanya untuk Skills bundled (Skills terkelola/workspace tidak terpengaruh).
- `load.extraDirs`: root skill bersama tambahan (presedensi terendah).
- `load.allowSymlinkTargets`: root target nyata tepercaya yang dapat menjadi tujuan
  resolusi symlink skill ketika link berada di luar root sumber yang dikonfigurasi.
- `install.preferBrew`: saat true, pilih installer Homebrew ketika `brew` tersedia
  sebelum fallback ke jenis installer lain.
- `install.nodeManager`: preferensi installer node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: izinkan klien Gateway `operator.admin` tepercaya
  menginstal arsip zip privat yang disiapkan melalui `skills.upload.*`
  (default: false). Ini hanya mengaktifkan path arsip terunggah; instalasi ClawHub
  normal tidak memerlukannya.
- `entries.<skillKey>.enabled: false` menonaktifkan skill meskipun bundled/terinstal.
- `entries.<skillKey>.apiKey`: kemudahan untuk Skills yang mendeklarasikan env var utama (string plaintext atau objek SecretRef).

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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

- Dimuat dari `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, ditambah `plugins.load.paths`.
- Discovery menerima plugin native OpenClaw serta bundle Codex dan bundle Claude yang kompatibel, termasuk bundle layout default Claude tanpa manifest.
- **Perubahan konfigurasi memerlukan restart gateway.**
- `allow`: allowlist opsional (hanya plugin yang terdaftar dimuat). `deny` menang.
- `bundledDiscovery`: default ke `"allowlist"` untuk konfigurasi baru, sehingga
  `plugins.allow` yang tidak kosong juga membatasi plugin penyedia bundled, termasuk penyedia
  runtime web-search. Doctor menulis `"compat"` untuk konfigurasi allowlist legacy yang
  dimigrasikan untuk mempertahankan perilaku penyedia bundled yang ada sampai Anda ikut serta.
- `plugins.entries.<id>.apiKey`: field kemudahan kunci API tingkat plugin (ketika didukung oleh plugin).
- `plugins.entries.<id>.env`: peta env var yang dibatasi plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: saat `false`, core memblokir `before_prompt_build` dan mengabaikan field yang mengubah prompt dari `before_agent_start` legacy, sambil mempertahankan `modelOverride` dan `providerOverride` legacy. Berlaku untuk hook plugin native dan direktori hook yang disediakan bundle dan didukung.
- `plugins.entries.<id>.hooks.allowConversationAccess`: saat `true`, plugin non-bundled tepercaya dapat membaca konten percakapan mentah dari hook bertipe seperti `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, dan `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: secara eksplisit mempercayai plugin ini untuk meminta override `provider` dan `model` per run untuk run subagen latar belakang.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opsional target `provider/model` kanonis untuk override subagen tepercaya. Gunakan `"*"` hanya saat Anda sengaja ingin mengizinkan model apa pun.
- `plugins.entries.<id>.llm.allowModelOverride`: secara eksplisit mempercayai plugin ini untuk meminta override model bagi `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: allowlist opsional target `provider/model` kanonis untuk override completion LLM plugin tepercaya. Gunakan `"*"` hanya saat Anda sengaja ingin mengizinkan model apa pun.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: secara eksplisit mempercayai plugin ini untuk menjalankan `api.runtime.llm.complete` terhadap id agen non-default.
- `plugins.entries.<id>.config`: objek konfigurasi yang didefinisikan plugin (divalidasi oleh skema plugin native OpenClaw saat tersedia).
- Pengaturan akun/runtime plugin kanal berada di bawah `channels.<id>` dan harus dijelaskan oleh metadata `channelConfigs` manifest plugin pemiliknya, bukan oleh registry opsi OpenClaw pusat.

### Konfigurasi plugin Codex harness

Plugin `codex` bundled memiliki pengaturan harness app-server native Codex di bawah
`plugins.entries.codex.config`. Lihat
[Referensi Codex harness](/id/plugins/codex-harness-reference) untuk seluruh permukaan
konfigurasi dan [Codex harness](/id/plugins/codex-harness) untuk model runtime.

`codexPlugins` hanya berlaku untuk sesi yang memilih native Codex harness.
Ini tidak mengaktifkan plugin Codex untuk Pi, run penyedia OpenAI normal, binding
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
  plugin/aplikasi Codex native untuk harness Codex. Default: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  kebijakan default tindakan destruktif untuk elisitasi aplikasi plugin yang dimigrasikan.
  Default: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: mengaktifkan
  entri plugin yang dimigrasikan saat `codexPlugins.enabled` global juga bernilai true.
  Default: `true` untuk entri eksplisit.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identitas marketplace yang stabil. V1 hanya mendukung `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identitas
  plugin Codex stabil dari migrasi, misalnya `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override tindakan destruktif per plugin. Jika dihilangkan, nilai
  `allow_destructive_actions` global digunakan.

`codexPlugins.enabled` adalah direktif pengaktifan global. Entri plugin eksplisit
yang ditulis oleh migrasi adalah set kelayakan instalasi dan perbaikan yang tahan lama.
`plugins["*"]` tidak didukung, tidak ada sakelar `install`, dan nilai
`marketplacePath` lokal sengaja tidak menjadi bidang konfigurasi karena bersifat
spesifik host.

Pemeriksaan kesiapan `app/list` di-cache selama satu jam dan disegarkan
secara asinkron saat basi. Konfigurasi aplikasi thread Codex dihitung saat
sesi harness Codex dibuat, bukan pada setiap giliran; gunakan `/new`, `/reset`, atau restart
gateway setelah mengubah konfigurasi plugin native.

- `plugins.entries.firecrawl.config.webFetch`: pengaturan penyedia web-fetch Firecrawl.
  - `apiKey`: kunci API Firecrawl (menerima SecretRef). Beralih ke `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` lama, atau variabel env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL dasar API Firecrawl (default: `https://api.firecrawl.dev`; override self-hosted harus menargetkan endpoint privat/internal).
  - `onlyMainContent`: ekstrak hanya konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: timeout permintaan scrape dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan penyedia X Search.
  - `model`: model Grok yang digunakan untuk pencarian (misalnya `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan memory dreaming. Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan ambang batas.
  - `enabled`: sakelar utama dreaming (default `false`).
  - `frequency`: cadence cron untuk setiap sweep dreaming penuh (`"0 3 * * *"` secara default).
  - `model`: override model subagen Dream Diary opsional. Memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`; pasangkan dengan `allowedModels` untuk membatasi target. Error model tidak tersedia dicoba ulang satu kali dengan model default sesi; kegagalan trust atau allowlist tidak melakukan fallback diam-diam.
  - kebijakan fase dan ambang batas adalah detail implementasi (bukan kunci konfigurasi yang terlihat pengguna).
- Konfigurasi memori lengkap ada di [Referensi konfigurasi memori](/id/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundle Claude yang diaktifkan juga dapat menyumbangkan default Pi tertanam dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agen yang disanitasi, bukan sebagai patch konfigurasi OpenClaw mentah.
- `plugins.slots.memory`: pilih id plugin memori aktif, atau `"none"` untuk menonaktifkan plugin memori.
- `plugins.slots.contextEngine`: pilih id plugin mesin konteks aktif; default ke `"legacy"` kecuali Anda menginstal dan memilih mesin lain.

Lihat [Plugins](/id/tools/plugin).

---

## Komitmen

`commitments` mengontrol memori tindak lanjut yang diinferensi: OpenClaw dapat mendeteksi check-in dari giliran percakapan dan mengirimkannya melalui run Heartbeat.

- `commitments.enabled`: aktifkan ekstraksi LLM tersembunyi, penyimpanan, dan pengiriman Heartbeat untuk komitmen tindak lanjut yang diinferensi. Default: `false`.
- `commitments.maxPerDay`: jumlah maksimum komitmen tindak lanjut yang diinferensi yang dikirim per sesi agen dalam satu hari bergulir. Default: `3`.

Lihat [Komitmen inferensial](/id/concepts/commitments).

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
  sesi melebihi batasnya. Atur `idleMinutes: 0` atau `maxTabsPerSession: 0` untuk
  menonaktifkan mode pembersihan individual tersebut.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan saat tidak diatur, sehingga navigasi browser tetap ketat secara default.
- Atur `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` hanya saat Anda secara sengaja mempercayai navigasi browser jaringan privat.
- Dalam mode ketat, endpoint profil CDP jarak jauh (`profiles.*.cdpUrl`) tunduk pada pemblokiran jaringan privat yang sama selama pemeriksaan keterjangkauan/penemuan.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil jarak jauh bersifat attach-only (start/stop/reset dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) saat Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  saat penyedia Anda memberi Anda URL DevTools WebSocket langsung.
- `remoteCdpTimeoutMs` dan `remoteCdpHandshakeTimeoutMs` berlaku untuk keterjangkauan CDP jarak jauh dan
  `attachOnly` plus permintaan pembukaan tab. Profil loopback terkelola
  mempertahankan default CDP lokal.
- Jika layanan CDP yang dikelola secara eksternal dapat dijangkau melalui loopback, atur
  `attachOnly: true` pada profil tersebut; jika tidak, OpenClaw memperlakukan port loopback sebagai
  profil browser terkelola lokal dan dapat melaporkan error kepemilikan port lokal.
- Profil `existing-session` menggunakan Chrome MCP alih-alih CDP dan dapat melakukan attach pada
  host yang dipilih atau melalui node browser yang terhubung.
- Profil `existing-session` dapat mengatur `userDataDir` untuk menargetkan profil browser
  berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` mempertahankan batas rute Chrome MCP saat ini:
  tindakan berbasis snapshot/ref alih-alih penargetan CSS-selector, hook unggah satu file,
  tanpa override timeout dialog, tanpa `wait --load networkidle`, dan tanpa
  `responsebody`, ekspor PDF, intersepsi unduhan, atau tindakan batch.
- Profil `openclaw` terkelola lokal menetapkan `cdpPort` dan `cdpUrl` secara otomatis; hanya
  atur `cdpUrl` secara eksplisit untuk CDP jarak jauh.
- Profil terkelola lokal dapat mengatur `executablePath` untuk mengoverride
  `browser.executablePath` global untuk profil tersebut. Gunakan ini untuk menjalankan satu profil di
  Chrome dan profil lain di Brave.
- Profil terkelola lokal menggunakan `browser.localLaunchTimeoutMs` untuk penemuan HTTP Chrome CDP
  setelah proses dimulai dan `browser.localCdpReadyTimeoutMs` untuk
  kesiapan websocket CDP pascapeluncuran. Naikkan nilainya pada host yang lebih lambat saat Chrome
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

- `seamColor`: warna aksen untuk chrome UI aplikasi native (tint gelembung Talk Mode, dll.).
- `assistant`: override identitas UI Kontrol. Beralih ke identitas agen aktif.

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
      url: "ws://gateway.tailnet:18789",
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
      // Remove tools from the default HTTP deny list
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
- `bind`: `auto`, `loopback` (default), `lan` (`0.0.0.0`), `tailnet` (hanya IP Tailscale), atau `custom`.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind `loopback` default mendengarkan pada `127.0.0.1` di dalam kontainer. Dengan jaringan bridge Docker (`-p 18789:18789`), lalu lintas tiba di `eth0`, sehingga gateway tidak dapat dijangkau. Gunakan `--network host`, atau atur `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) untuk mendengarkan pada semua antarmuka.
- **Auth**: wajib secara default. Bind non-loopback memerlukan auth gateway. Dalam praktiknya, ini berarti token/kata sandi bersama atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wizard onboarding menghasilkan token secara default.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRefs), atur `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Alur startup dan pemasangan/perbaikan layanan gagal ketika keduanya dikonfigurasi dan mode belum diatur.
- `gateway.auth.mode: "none"`: mode tanpa auth eksplisit. Gunakan hanya untuk penyiapan local loopback tepercaya; ini sengaja tidak ditawarkan oleh prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan auth browser/pengguna ke reverse proxy yang sadar identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth)). Mode ini mengharapkan sumber proxy **non-loopback** secara default; reverse proxy loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` eksplisit. Pemanggil internal pada host yang sama dapat menggunakan `gateway.auth.password` sebagai fallback langsung lokal; `gateway.auth.token` tetap saling eksklusif dengan mode trusted-proxy.
- `gateway.auth.allowTailscale`: ketika `true`, header identitas Tailscale Serve dapat memenuhi auth Control UI/WebSocket (diverifikasi melalui `tailscale whois`). Endpoint HTTP API **tidak** menggunakan auth header Tailscale tersebut; endpoint tersebut mengikuti mode auth HTTP normal gateway sebagai gantinya. Alur tanpa token ini mengasumsikan host gateway tepercaya. Default ke `true` ketika `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: pembatas auth-gagal opsional. Berlaku per IP klien dan per cakupan auth (shared-secret dan device-token dilacak secara independen). Upaya yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada jalur Control UI Tailscale Serve async, upaya gagal untuk `{scope, clientIp}` yang sama diserialkan sebelum penulisan kegagalan. Karena itu, upaya buruk bersamaan dari klien yang sama dapat memicu pembatas pada permintaan kedua alih-alih keduanya berlomba sebagai ketidakcocokan biasa.
  - `gateway.auth.rateLimit.exemptLoopback` default ke `true`; atur `false` ketika Anda memang ingin lalu lintas localhost juga dibatasi lajunya (untuk penyiapan pengujian atau deployment proxy yang ketat).
- Upaya auth WS dari origin browser selalu dibatasi lajunya dengan pengecualian loopback dinonaktifkan (defense-in-depth terhadap brute force localhost berbasis browser).
- Pada loopback, penguncian dari origin browser tersebut diisolasi per nilai `Origin`
  yang dinormalisasi, sehingga kegagalan berulang dari satu origin localhost tidak otomatis
  mengunci origin yang berbeda.
- `tailscale.mode`: `serve` (hanya tailnet, bind loopback) atau `funnel` (publik, memerlukan auth).
- `tailscale.preserveFunnel`: ketika `true` dan `tailscale.mode = "serve"`, OpenClaw
  memeriksa `tailscale funnel status` sebelum menerapkan ulang Serve saat startup dan melewatinya
  jika rute Funnel yang dikonfigurasi secara eksternal sudah mencakup port gateway.
  Default `false`.
- `controlUi.allowedOrigins`: allowlist origin browser eksplisit untuk koneksi WebSocket Gateway. Wajib ketika klien browser diharapkan berasal dari origin non-loopback.
- `controlUi.chatMessageMaxWidth`: max-width opsional untuk pesan chat Control UI yang dikelompokkan. Menerima nilai lebar CSS terbatas seperti `960px`, `82%`, `min(1280px, 82%)`, dan `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan fallback origin header Host untuk deployment yang sengaja bergantung pada kebijakan origin header Host.
- `remote.transport`: `ssh` (default) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus berupa `ws://` atau `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override darurat lingkungan proses
  sisi klien yang mengizinkan plaintext `ws://` ke IP jaringan privat
  tepercaya; default tetap hanya loopback untuk plaintext. Tidak ada padanan
  `openclaw.json`, dan konfigurasi jaringan privat browser seperti
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tidak memengaruhi klien WebSocket
  Gateway.
- `gateway.remote.token` / `.password` adalah kolom kredensial klien jarak jauh. Keduanya tidak mengonfigurasi auth gateway dengan sendirinya.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS dasar untuk relay APNs eksternal yang digunakan oleh build iOS resmi/TestFlight setelah build tersebut menerbitkan registrasi berbasis relay ke gateway. URL ini harus cocok dengan URL relay yang dikompilasi ke dalam build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout pengiriman gateway-ke-relay dalam milidetik. Default ke `10000`.
- Registrasi berbasis relay didelegasikan ke identitas gateway tertentu. Aplikasi iOS yang dipasangkan mengambil `gateway.identity.get`, menyertakan identitas tersebut dalam registrasi relay, dan meneruskan grant pengiriman bercakupan registrasi ke gateway. Gateway lain tidak dapat menggunakan ulang registrasi tersimpan tersebut.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env sementara untuk konfigurasi relay di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: celah khusus pengembangan untuk URL relay HTTP loopback. URL relay produksi sebaiknya tetap menggunakan HTTPS.
- `gateway.handshakeTimeoutMs`: timeout handshake WebSocket Gateway pra-auth dalam milidetik. Default: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` diprioritaskan ketika diatur. Tingkatkan ini pada host yang terbebani atau berdaya rendah ketika klien lokal dapat terhubung sementara pemanasan startup masih stabil.
- `gateway.channelHealthCheckMinutes`: interval monitor kesehatan channel dalam menit. Atur `0` untuk menonaktifkan restart monitor kesehatan secara global. Default: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ambang soket basi dalam menit. Jaga ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`. Default: `30`.
- `gateway.channelMaxRestartsPerHour`: restart monitor kesehatan maksimum per channel/akun dalam satu jam bergulir. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per channel untuk restart monitor kesehatan sambil tetap mengaktifkan monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per akun untuk channel multi-akun. Ketika diatur, ini diprioritaskan dibanding override tingkat channel.
- Jalur panggilan gateway lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` belum diatur.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tidak ada fallback jarak jauh yang menutupi).
- `trustedProxies`: IP reverse proxy yang menghentikan TLS atau menyuntikkan header klien yang diteruskan. Hanya cantumkan proxy yang Anda kendalikan. Entri loopback tetap valid untuk penyiapan proxy/deteksi lokal pada host yang sama (misalnya Tailscale Serve atau reverse proxy lokal), tetapi entri tersebut **tidak** membuat permintaan loopback memenuhi syarat untuk `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: ketika `true`, gateway menerima `X-Real-IP` jika `X-Forwarded-For` tidak ada. Default `false` untuk perilaku gagal tertutup.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP opsional untuk menyetujui otomatis pairing perangkat node pertama kali tanpa cakupan yang diminta. Ini dinonaktifkan ketika tidak diatur. Ini tidak menyetujui otomatis pairing operator/browser/Control UI/WebChat, dan tidak menyetujui otomatis peningkatan peran, cakupan, metadata, atau kunci publik.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pembentukan allow/deny global untuk perintah node yang dideklarasikan setelah pairing dan evaluasi allowlist platform. Gunakan `allowCommands` untuk memilih ikut memakai perintah node berbahaya seperti `camera.snap`, `camera.clip`, dan `screen.record`; `denyCommands` menghapus perintah meskipun default platform atau allow eksplisit semestinya menyertakannya. Setelah node mengubah daftar perintah yang dideklarasikannya, tolak dan setujui ulang pairing perangkat tersebut agar gateway menyimpan snapshot perintah yang diperbarui.
- `gateway.tools.deny`: nama alat tambahan yang diblokir untuk HTTP `POST /tools/invoke` (memperluas daftar deny default).
- `gateway.tools.allow`: hapus nama alat dari daftar deny HTTP default.

</Accordion>

### Endpoint kompatibel OpenAI

- Chat Completions: dinonaktifkan secara default. Aktifkan dengan `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Penguatan input URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlist kosong diperlakukan sebagai belum diatur; gunakan `gateway.http.endpoints.responses.files.allowUrl=false`
    dan/atau `gateway.http.endpoints.responses.images.allowUrl=false` untuk menonaktifkan pengambilan URL.
- Header penguatan respons opsional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (atur hanya untuk origin HTTPS yang Anda kendalikan; lihat [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolasi multi-instans

Jalankan beberapa gateway pada satu host dengan port dan direktori state yang unik:

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

- `enabled`: mengaktifkan terminasi TLS pada listener gateway (HTTPS/WSS) (default: `false`).
- `autoGenerate`: menghasilkan otomatis pasangan cert/key self-signed lokal ketika file eksplisit tidak dikonfigurasi; hanya untuk penggunaan lokal/dev.
- `certPath`: path filesystem ke file sertifikat TLS.
- `keyPath`: path filesystem ke file kunci privat TLS; batasi izinnya.
- `caPath`: path bundle CA opsional untuk verifikasi klien atau rantai trust khusus.

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

- `mode`: mengontrol bagaimana edit konfigurasi diterapkan saat runtime.
  - `"off"`: abaikan edit langsung; perubahan memerlukan restart eksplisit.
  - `"restart"`: selalu restart proses gateway saat konfigurasi berubah.
  - `"hot"`: terapkan perubahan dalam proses tanpa restart.
  - `"hybrid"` (default): coba hot reload terlebih dahulu; fallback ke restart jika diperlukan.
- `debounceMs`: jendela debounce dalam ms sebelum perubahan konfigurasi diterapkan (bilangan bulat non-negatif).
- `deferralTimeoutMs`: waktu maksimum opsional dalam ms untuk menunggu operasi yang masih berjalan sebelum memaksa restart atau hot reload channel. Hilangkan untuk menggunakan tunggu berbatas default (`300000`); atur `0` untuk menunggu tanpa batas dan mencatat peringatan masih-tertunda secara berkala.

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
Token hook string kueri ditolak.

Catatan validasi dan keamanan:

- `hooks.enabled=true` memerlukan `hooks.token` yang tidak kosong.
- `hooks.token` harus **berbeda** dari `gateway.auth.token`; penggunaan ulang token Gateway ditolak.
- `hooks.path` tidak boleh `/`; gunakan subjalur khusus seperti `/hooks`.
- Jika `hooks.allowRequestSessionKey=true`, batasi `hooks.allowedSessionKeyPrefixes` (misalnya `["hook:"]`).
- Jika mapping atau preset menggunakan `sessionKey` bertemplat, atur `hooks.allowedSessionKeyPrefixes` dan `hooks.allowRequestSessionKey=true`. Kunci mapping statis tidak memerlukan opt-in tersebut.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dari payload permintaan hanya diterima ketika `hooks.allowRequestSessionKey=true` (default: `false`).
- `POST /hooks/<name>` → diselesaikan melalui `hooks.mappings`
  - Nilai `sessionKey` mapping yang dirender dari templat diperlakukan sebagai dipasok secara eksternal dan juga memerlukan `hooks.allowRequestSessionKey=true`.

<Accordion title="Detail mapping">

- `match.path` mencocokkan subjalur setelah `/hooks` (mis. `/hooks/gmail` → `gmail`).
- `match.source` mencocokkan field payload untuk jalur generik.
- Templat seperti `{{messages[0].subject}}` membaca dari payload.
- `transform` dapat menunjuk ke modul JS/TS yang mengembalikan aksi hook.
  - `transform.module` harus berupa jalur relatif dan tetap berada di dalam `hooks.transformsDir` (jalur absolut dan traversal ditolak).
  - Simpan `hooks.transformsDir` di bawah `~/.openclaw/hooks/transforms`; direktori skill workspace ditolak. Jika `openclaw doctor` melaporkan jalur ini tidak valid, pindahkan modul transform ke direktori transform hook atau hapus `hooks.transformsDir`.
- `agentId` merutekan ke agen tertentu; ID yang tidak dikenal kembali ke default.
- `allowedAgentIds`: membatasi perutean eksplisit (`*` atau dihilangkan = izinkan semua, `[]` = tolak semua).
- `defaultSessionKey`: kunci sesi tetap opsional untuk eksekusi agen hook tanpa `sessionKey` eksplisit.
- `allowRequestSessionKey`: mengizinkan pemanggil `/hooks/agent` dan kunci sesi mapping berbasis templat untuk mengatur `sessionKey` (default: `false`).
- `allowedSessionKeyPrefixes`: daftar izin prefiks opsional untuk nilai `sessionKey` eksplisit (permintaan + mapping), mis. `["hook:"]`. Ini menjadi wajib ketika mapping atau preset apa pun menggunakan `sessionKey` bertemplat.
- `deliver: true` mengirim balasan akhir ke kanal; `channel` default ke `last`.
- `model` menimpa LLM untuk eksekusi hook ini (harus diizinkan jika katalog model diatur).

</Accordion>

### Integrasi Gmail

- Preset Gmail bawaan menggunakan `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jika Anda mempertahankan perutean per pesan tersebut, atur `hooks.allowRequestSessionKey: true` dan batasi `hooks.allowedSessionKeyPrefixes` agar cocok dengan namespace Gmail, misalnya `["hook:", "hook:gmail:"]`.
- Jika Anda memerlukan `hooks.allowRequestSessionKey: false`, timpa preset dengan `sessionKey` statis, bukan default bertemplat.

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

- Gateway memulai otomatis `gog gmail watch serve` saat boot ketika dikonfigurasi. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkan.
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
- Node WebViews biasanya tidak mengirim header auth; setelah node dipasangkan dan terhubung, Gateway mengiklankan URL kapabilitas bercakupan node untuk akses canvas/A2UI.
- URL kapabilitas terikat ke sesi WS node aktif dan cepat kedaluwarsa. Fallback berbasis IP tidak digunakan.
- Menyuntikkan klien live-reload ke HTML yang disajikan.
- Membuat otomatis `index.html` awal saat kosong.
- Juga menyajikan A2UI di `/__openclaw__/a2ui/`.
- Perubahan memerlukan restart Gateway.
- Nonaktifkan live reload untuk direktori besar atau kesalahan `EMFILE`.

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

- `minimal` (default ketika plugin `bonjour` bawaan diaktifkan): hilangkan `cliPath` + `sshPort` dari catatan TXT.
- `full`: sertakan `cliPath` + `sshPort`; iklan multicast LAN tetap memerlukan plugin `bonjour` bawaan untuk diaktifkan.
- `off`: menekan iklan multicast LAN tanpa mengubah pengaktifan plugin.
- Plugin `bonjour` bawaan memulai otomatis di host macOS dan bersifat opt-in di deployment Gateway Linux, Windows, dan terkontainerisasi.
- Hostname default ke hostname sistem ketika berupa label DNS yang valid, dengan fallback ke `openclaw`. Timpa dengan `OPENCLAW_MDNS_HOSTNAME`.

### Area luas (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Menulis zona DNS-SD unicast di bawah `~/.openclaw/dns/`. Untuk penemuan lintas jaringan, pasangkan dengan server DNS (CoreDNS direkomendasikan) + Tailscale split DNS.

Penyiapan: `openclaw dns setup --apply`.

---

## Lingkungan

### `env` (variabel env sebaris)

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

- Variabel env sebaris hanya diterapkan jika env proses tidak memiliki kunci tersebut.
- File `.env`: CWD `.env` + `~/.openclaw/.env` (keduanya tidak menimpa variabel yang sudah ada).
- `shellEnv`: mengimpor kunci yang diharapkan tetapi belum ada dari profil shell login Anda.
- Lihat [Lingkungan](/id/help/environment) untuk urutan prioritas lengkap.

### Substitusi variabel env

Referensikan variabel env dalam string konfigurasi apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Hanya nama huruf besar yang dicocokkan: `[A-Z_][A-Z0-9_]*`.
- Variabel yang hilang/kosong memunculkan kesalahan saat pemuatan konfigurasi.
- Escape dengan `$${VAR}` untuk literal `${VAR}`.
- Berfungsi dengan `$include`.

---

## Rahasia

Referensi rahasia bersifat aditif: nilai plaintext tetap berfungsi.

### `SecretRef`

Gunakan satu bentuk objek:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validasi:

- Pola `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Pola id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Id `source: "file"`: pointer JSON absolut (misalnya `"/providers/openai/apiKey"`)
- Pola id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Id `source: "exec"` tidak boleh berisi segmen jalur berbatas slash berupa `.` atau `..` (misalnya `a/../b` ditolak)

### Permukaan kredensial yang didukung

- Matriks kanonis: [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)
- Target `secrets apply` mendukung jalur kredensial `openclaw.json`.
- Referensi `auth-profiles.json` disertakan dalam resolusi runtime dan cakupan audit.

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
- Jalur penyedia file dan exec gagal tertutup ketika verifikasi ACL Windows tidak tersedia. Tetapkan `allowInsecurePath: true` hanya untuk jalur tepercaya yang tidak dapat diverifikasi.
- Penyedia `exec` memerlukan jalur `command` absolut dan menggunakan payload protokol pada stdin/stdout.
- Secara default, jalur perintah symlink ditolak. Tetapkan `allowSymlinkCommand: true` untuk mengizinkan jalur symlink sambil memvalidasi jalur target yang di-resolve.
- Jika `trustedDirs` dikonfigurasi, pemeriksaan direktori tepercaya diterapkan pada jalur target yang di-resolve.
- Lingkungan child `exec` bersifat minimal secara default; teruskan variabel yang diperlukan secara eksplisit dengan `passEnv`.
- Referensi rahasia di-resolve pada waktu aktivasi menjadi snapshot dalam memori, lalu jalur permintaan hanya membaca snapshot tersebut.
- Pemfilteran permukaan aktif diterapkan selama aktivasi: referensi yang belum di-resolve pada permukaan yang diaktifkan menggagalkan startup/reload, sementara permukaan tidak aktif dilewati dengan diagnostik.

---

## Penyimpanan auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Profil per agen disimpan di `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` mendukung referensi tingkat nilai (`keyRef` untuk `api_key`, `tokenRef` untuk `token`) untuk mode kredensial statis.
- Pemetaan datar lama `auth-profiles.json` seperti `{ "provider": { "apiKey": "..." } }` bukan format runtime; `openclaw doctor --fix` menulis ulangnya menjadi profil API-key `provider:default` kanonis dengan cadangan `.legacy-flat.*.bak`.
- Profil mode OAuth (`auth.profiles.<id>.mode = "oauth"`) tidak mendukung kredensial profil-auth berbasis SecretRef.
- Kredensial runtime statis berasal dari snapshot yang telah di-resolve dalam memori; entri `auth.json` statis lama dibersihkan saat ditemukan.
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

- `billingBackoffHours`: backoff dasar dalam jam ketika sebuah profil gagal karena kesalahan
  penagihan/kredit-tidak-mencukupi yang sebenarnya (default: `5`). Teks penagihan eksplisit
  tetap dapat masuk di sini bahkan pada respons `401`/`403`, tetapi pencocok teks khusus penyedia
  tetap dibatasi pada penyedia yang memilikinya (misalnya OpenRouter
  `Key limit exceeded`). Pesan HTTP `402` yang dapat dicoba ulang untuk jendela penggunaan atau
  batas belanja organisasi/workspace tetap berada di jalur `rate_limit`
  sebagai gantinya.
- `billingBackoffHoursByProvider`: override opsional per penyedia untuk jam backoff penagihan.
- `billingMaxHours`: batas dalam jam untuk pertumbuhan eksponensial backoff penagihan (default: `24`).
- `authPermanentBackoffMinutes`: backoff dasar dalam menit untuk kegagalan `auth_permanent` berkeyakinan tinggi (default: `10`).
- `authPermanentMaxMinutes`: batas dalam menit untuk pertumbuhan backoff `auth_permanent` (default: `60`).
- `failureWindowHours`: jendela bergulir dalam jam yang digunakan untuk penghitung backoff (default: `24`).
- `overloadedProfileRotations`: rotasi profil autentikasi penyedia-yang-sama maksimum untuk kesalahan kelebihan beban sebelum beralih ke fallback model (default: `1`). Bentuk penyedia-sibuk seperti `ModelNotReadyException` masuk di sini.
- `overloadedBackoffMs`: jeda tetap sebelum mencoba ulang rotasi penyedia/profil yang kelebihan beban (default: `0`).
- `rateLimitedProfileRotations`: rotasi profil autentikasi penyedia-yang-sama maksimum untuk kesalahan batas laju sebelum beralih ke fallback model (default: `1`). Bucket batas laju tersebut mencakup teks berpola penyedia seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, dan `resource exhausted`.

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
- Tetapkan `logging.file` untuk jalur stabil.
- `consoleLevel` naik menjadi `debug` ketika `--verbose`.
- `maxFileBytes`: ukuran file log aktif maksimum dalam byte sebelum rotasi (bilangan bulat positif; default: `104857600` = 100 MB). OpenClaw menyimpan hingga lima arsip bernomor di samping file aktif.
- `redactSensitive` / `redactPatterns`: penyamaran upaya-terbaik untuk output konsol, log file, rekaman log OTLP, dan teks transkrip sesi yang dipersistenkan. `redactSensitive: "off"` hanya menonaktifkan kebijakan log/transkrip umum ini; permukaan keamanan UI/tool/diagnostik tetap menyensor rahasia sebelum emisi.

---

## Diagnostik

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

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
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
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
- `flags`: array string flag yang mengaktifkan output log bertarget (mendukung wildcard seperti `"telegram.*"` atau `"*"`).
- `stuckSessionWarnMs`: ambang usia tanpa-kemajuan dalam ms untuk mengklasifikasikan sesi pemrosesan berjalan-lama sebagai `session.long_running`, `session.stalled`, atau `session.stuck`. Balasan, tool, status, blok, dan progres ACP mengatur ulang timer; diagnostik `session.stuck` berulang melakukan backoff selama tidak berubah.
- `stuckSessionAbortMs`: ambang usia tanpa-kemajuan dalam ms sebelum pekerjaan aktif terhenti yang memenuhi syarat dapat di-abort-drain untuk pemulihan. Jika tidak ditetapkan, OpenClaw menggunakan jendela embedded-run diperpanjang yang lebih aman, minimal 10 menit dan 5x `stuckSessionWarnMs`.
- `otel.enabled`: mengaktifkan pipeline ekspor OpenTelemetry (default: `false`). Untuk konfigurasi lengkap, katalog sinyal, dan model privasi, lihat [ekspor OpenTelemetry](/id/gateway/opentelemetry).
- `otel.endpoint`: URL collector untuk ekspor OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP opsional khusus sinyal. Ketika ditetapkan, endpoint tersebut menggantikan `otel.endpoint` hanya untuk sinyal itu.
- `otel.protocol`: `"http/protobuf"` (default) atau `"grpc"`.
- `otel.headers`: header metadata HTTP/gRPC ekstra yang dikirim dengan permintaan ekspor OTel.
- `otel.serviceName`: nama layanan untuk atribut resource.
- `otel.traces` / `otel.metrics` / `otel.logs`: mengaktifkan ekspor trace, metrik, atau log.
- `otel.sampleRate`: laju sampling trace `0`-`1`.
- `otel.flushIntervalMs`: interval flush telemetri berkala dalam ms.
- `otel.captureContent`: pengambilan konten mentah opt-in untuk atribut span OTEL. Default nonaktif. Boolean `true` menangkap konten pesan/tool non-sistem; bentuk objek memungkinkan Anda mengaktifkan `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, dan `systemPrompt` secara eksplisit.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: toggle lingkungan untuk atribut penyedia span GenAI eksperimental terbaru. Secara default, span mempertahankan atribut legacy `gen_ai.system` untuk kompatibilitas; metrik GenAI menggunakan atribut semantik berbatas.
- `OPENCLAW_OTEL_PRELOADED=1`: toggle lingkungan untuk host yang sudah mendaftarkan SDK OpenTelemetry global. OpenClaw kemudian melewati startup/shutdown SDK milik Plugin sambil tetap menjaga listener diagnostik aktif.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, dan `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabel lingkungan endpoint khusus sinyal yang digunakan ketika kunci konfigurasi yang sesuai tidak ditetapkan.
- `cacheTrace.enabled`: mencatat snapshot trace cache untuk run tertanam (default: `false`).
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

- `channel`: channel rilis untuk instalasi npm/git - `"stable"`, `"beta"`, atau `"dev"`.
- `checkOnStart`: memeriksa pembaruan npm ketika gateway dimulai (default: `true`).
- `auto.enabled`: mengaktifkan pembaruan otomatis latar belakang untuk instalasi paket (default: `false`).
- `auto.stableDelayHours`: jeda minimum dalam jam sebelum penerapan otomatis channel stabil (default: `6`; maks: `168`).
- `auto.stableJitterHours`: jendela sebaran rollout channel stabil ekstra dalam jam (default: `12`; maks: `168`).
- `auto.betaCheckIntervalHours`: seberapa sering pemeriksaan channel beta berjalan dalam jam (default: `1`; maks: `24`).

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

- `enabled`: gate fitur ACP global (default: `true`; tetapkan `false` untuk menyembunyikan dispatch ACP dan affordance spawn).
- `dispatch.enabled`: gate independen untuk dispatch giliran sesi ACP (default: `true`). Tetapkan `false` untuk menjaga perintah ACP tetap tersedia sambil memblokir eksekusi.
- `backend`: id backend runtime ACP default (harus cocok dengan Plugin runtime ACP yang terdaftar).
  Instal Plugin backend terlebih dahulu, dan jika `plugins.allow` ditetapkan, sertakan id Plugin backend (misalnya `acpx`) atau backend ACP tidak akan dimuat.
- `defaultAgent`: id agent target fallback ACP ketika spawn tidak menentukan target eksplisit.
- `allowedAgents`: allowlist id agent yang diizinkan untuk sesi runtime ACP; kosong berarti tidak ada pembatasan tambahan.
- `maxConcurrentSessions`: jumlah maksimum sesi ACP aktif secara bersamaan.
- `stream.coalesceIdleMs`: jendela flush idle dalam ms untuk teks yang di-stream.
- `stream.maxChunkChars`: ukuran chunk maksimum sebelum memecah proyeksi blok yang di-stream.
- `stream.repeatSuppression`: menekan baris status/tool berulang per giliran (default: `true`).
- `stream.deliveryMode`: `"live"` melakukan stream secara inkremental; `"final_only"` melakukan buffering hingga event terminal giliran.
- `stream.hiddenBoundarySeparator`: pemisah sebelum teks terlihat setelah event tool tersembunyi (default: `"paragraph"`).
- `stream.maxOutputChars`: karakter output asisten maksimum yang diproyeksikan per giliran ACP.
- `stream.maxSessionUpdateChars`: karakter maksimum untuk baris status/pembaruan ACP yang diproyeksikan.
- `stream.tagVisibility`: rekaman nama tag ke override visibilitas boolean untuk event yang di-stream.
- `runtime.ttlMinutes`: TTL idle dalam menit untuk worker sesi ACP sebelum memenuhi syarat untuk pembersihan.
- `runtime.installCommand`: perintah instalasi opsional untuk dijalankan saat bootstrap lingkungan runtime ACP.

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

- `cli.banner.taglineMode` mengontrol gaya tagline banner:
  - `"random"` (default): tagline lucu/musiman yang berotasi.
  - `"default"`: tagline netral tetap (`All your chats, one OpenClaw.`).
  - `"off"`: tanpa teks tagline (judul/versi banner tetap ditampilkan).
- Untuk menyembunyikan seluruh banner (bukan hanya tagline), tetapkan env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadata yang ditulis oleh alur penyiapan terpandu CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identitas

Lihat field identitas `agents.list` di bawah [default Agent](/id/gateway/config-agents#agent-defaults).

---

## Jembatan (legacy, dihapus)

Build saat ini tidak lagi menyertakan jembatan TCP. Node terhubung melalui WebSocket Gateway. Kunci `bridge.*` tidak lagi menjadi bagian dari skema konfigurasi (validasi gagal hingga dihapus; `openclaw doctor --fix` dapat menghapus kunci yang tidak dikenal).

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
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: berapa lama menyimpan sesi eksekusi Cron terisolasi yang selesai sebelum dipangkas dari `sessions.json`. Juga mengontrol pembersihan transkrip Cron terhapus yang diarsipkan. Bawaan: `24h`; atur `false` untuk menonaktifkan.
- `runLog.maxBytes`: ukuran maksimum per file log eksekusi (`cron/runs/<jobId>.jsonl`) sebelum pemangkasan. Bawaan: `2_000_000` byte.
- `runLog.keepLines`: baris terbaru yang dipertahankan saat pemangkasan log eksekusi dipicu. Bawaan: `2000`.
- `webhookToken`: token Bearer yang digunakan untuk pengiriman POST Webhook Cron (`delivery.mode = "webhook"`), jika dihilangkan tidak ada header autentikasi yang dikirim.
- `webhook`: URL Webhook cadangan lama yang sudah tidak digunakan (http/https), hanya digunakan untuk tugas tersimpan yang masih memiliki `notify: true`.

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

- `maxAttempts`: percobaan ulang maksimum untuk tugas sekali jalan pada kesalahan sementara (bawaan: `3`; rentang: `0`-`10`).
- `backoffMs`: array jeda percobaan ulang dalam ms untuk setiap percobaan ulang (bawaan: `[30000, 60000, 300000]`; 1-10 entri).
- `retryOn`: jenis kesalahan yang memicu percobaan ulang - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Hilangkan untuk mencoba ulang semua jenis sementara.

Berlaku hanya untuk tugas Cron sekali jalan. Tugas berulang menggunakan penanganan kegagalan terpisah.

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

- `enabled`: aktifkan peringatan kegagalan untuk tugas Cron (bawaan: `false`).
- `after`: jumlah kegagalan beruntun sebelum peringatan dipicu (bilangan bulat positif, min: `1`).
- `cooldownMs`: jumlah milidetik minimum antara peringatan berulang untuk tugas yang sama (bilangan bulat non-negatif).
- `includeSkipped`: hitung eksekusi yang dilewati secara beruntun terhadap ambang peringatan (bawaan: `false`). Eksekusi yang dilewati dilacak secara terpisah dan tidak memengaruhi jeda percobaan ulang kesalahan eksekusi.
- `mode`: mode pengiriman - `"announce"` mengirim melalui pesan kanal; `"webhook"` memposting ke Webhook yang dikonfigurasi.
- `accountId`: akun atau ID kanal opsional untuk membatasi cakupan pengiriman peringatan.

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

- Tujuan bawaan untuk notifikasi kegagalan Cron di semua tugas.
- `mode`: `"announce"` atau `"webhook"`; default ke `"announce"` ketika data target yang cukup tersedia.
- `channel`: penggantian kanal untuk pengiriman announce. `"last"` menggunakan kembali kanal pengiriman terakhir yang diketahui.
- `to`: target announce eksplisit atau URL Webhook. Wajib untuk mode Webhook.
- `accountId`: penggantian akun opsional untuk pengiriman.
- `delivery.failureDestination` per tugas menimpa default global ini.
- Ketika tujuan kegagalan global maupun per tugas tidak ditetapkan, tugas yang sudah mengirim melalui `announce` kembali ke target announce utama tersebut saat gagal.
- `delivery.failureDestination` hanya didukung untuk tugas `sessionTarget="isolated"` kecuali `delivery.mode` utama tugas adalah `"webhook"`.

Lihat [Tugas Cron](/id/automation/cron-jobs). Eksekusi Cron terisolasi dilacak sebagai [tugas latar belakang](/id/automation/tasks).

---

## Variabel templat model media

Penanda tempat templat yang diekspansi dalam `tools.media.models[].args`:

| Variabel           | Deskripsi                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Isi lengkap pesan masuk                           |
| `{{RawBody}}`      | Isi mentah (tanpa pembungkus riwayat/pengirim)    |
| `{{BodyStripped}}` | Isi dengan penyebutan grup dihapus                |
| `{{From}}`         | Pengenal pengirim                                 |
| `{{To}}`           | Pengenal tujuan                                   |
| `{{MessageSid}}`   | ID pesan kanal                                    |
| `{{SessionId}}`    | UUID sesi saat ini                                |
| `{{IsNewSession}}` | `"true"` ketika sesi baru dibuat                  |
| `{{MediaUrl}}`     | URL semu media masuk                              |
| `{{MediaPath}}`    | Jalur media lokal                                 |
| `{{MediaType}}`    | Jenis media (gambar/audio/dokumen/…)              |
| `{{Transcript}}`   | Transkrip audio                                   |
| `{{Prompt}}`       | Instruksi media hasil resolusi untuk entri CLI    |
| `{{MaxChars}}`     | Karakter keluaran maksimum hasil resolusi untuk entri CLI |
| `{{ChatType}}`     | `"direct"` atau `"group"`                         |
| `{{GroupSubject}}` | Subjek grup (upaya terbaik)                       |
| `{{GroupMembers}}` | Pratinjau anggota grup (upaya terbaik)            |
| `{{SenderName}}`   | Nama tampilan pengirim (upaya terbaik)            |
| `{{SenderE164}}`   | Nomor telepon pengirim (upaya terbaik)            |
| `{{Provider}}`     | Petunjuk penyedia (WhatsApp, Telegram, Discord, dll.) |

---

## Penyertaan konfigurasi (`$include`)

Pecah konfigurasi menjadi beberapa file:

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

- File tunggal: menggantikan objek yang memuatnya.
- Array file: digabungkan secara mendalam sesuai urutan (yang belakangan menimpa yang lebih awal).
- Kunci sejajar: digabungkan setelah penyertaan (menimpa nilai yang disertakan).
- Penyertaan bersarang: hingga kedalaman 10 tingkat.
- Jalur: diresolusikan relatif terhadap file yang menyertakan, tetapi harus tetap berada di dalam direktori konfigurasi tingkat atas (`dirname` dari `openclaw.json`). Bentuk absolut/`../` hanya diizinkan ketika masih teresolusi di dalam batas tersebut.
- Penulisan yang dilakukan OpenClaw yang hanya mengubah satu bagian tingkat atas yang didukung oleh penyertaan file tunggal akan menulis langsung ke file yang disertakan tersebut. Misalnya, `plugins install` memperbarui `plugins: { $include: "./plugins.json5" }` di `plugins.json5` dan membiarkan `openclaw.json` tetap utuh.
- Penyertaan root, array penyertaan, dan penyertaan dengan penggantian kunci sejajar bersifat hanya baca untuk penulisan yang dilakukan OpenClaw; penulisan tersebut gagal tertutup alih-alih meratakan konfigurasi.
- Kesalahan: pesan jelas untuk file yang hilang, kesalahan penguraian, dan penyertaan melingkar.

---

_Terkait: [Konfigurasi](/id/gateway/configuration) · [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
