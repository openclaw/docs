---
read_when:
    - Anda memerlukan semantik konfigurasi tingkat bidang atau nilai bawaan yang tepat
    - Anda sedang memvalidasi blok konfigurasi saluran, model, Gateway, atau alat
summary: Referensi konfigurasi Gateway untuk kunci inti OpenClaw, nilai default, dan tautan ke referensi subsistem khusus
title: Referensi konfigurasi
x-i18n:
    generated_at: "2026-05-06T17:55:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e5f7c2246b28f801d527437ae6242686998f1e8b75fd3977723d240a760d859
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referensi konfigurasi inti untuk `~/.openclaw/openclaw.json`. Untuk ikhtisar berorientasi tugas, lihat [Konfigurasi](/id/gateway/configuration).

Mencakup permukaan konfigurasi utama OpenClaw dan menautkan ke luar saat sebuah subsistem memiliki referensi yang lebih mendalam. Katalog perintah milik channel dan plugin serta pengaturan mendalam memory/QMD berada di halaman masing-masing, bukan di halaman ini.

Kebenaran kode:

- `openclaw config schema` mencetak JSON Schema langsung yang digunakan untuk validasi dan Control UI, dengan metadata bawaan/plugin/channel digabungkan saat tersedia
- `config.schema.lookup` mengembalikan satu node schema bercakupan path untuk tooling drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` memvalidasi hash baseline dokumen konfigurasi terhadap permukaan schema saat ini

Path pencarian agen: gunakan aksi tool `gateway` `config.schema.lookup` untuk
dokumentasi dan batasan tingkat field yang tepat sebelum mengedit. Gunakan
[Konfigurasi](/id/gateway/configuration) untuk panduan berorientasi tugas dan halaman ini
untuk peta field yang lebih luas, default, dan tautan ke referensi subsistem.

Referensi mendalam khusus:

- [Referensi konfigurasi memori](/id/reference/memory-config) untuk `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, dan konfigurasi dreaming di bawah `plugins.entries.memory-core.config.dreaming`
- [Perintah slash](/id/tools/slash-commands) untuk katalog perintah bawaan + terbundel saat ini
- halaman channel/plugin pemilik untuk permukaan perintah khusus channel

Format konfigurasi adalah **JSON5** (komentar + koma akhir diizinkan). Semua field bersifat opsional - OpenClaw menggunakan default aman saat dihilangkan.

---

## Channel

Kunci konfigurasi per channel dipindahkan ke halaman khusus - lihat
[Konfigurasi - channel](/id/gateway/config-channels) untuk `channels.*`,
termasuk Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan channel
terbundel lainnya (auth, kontrol akses, multi-akun, gating mention).

## Default agen, multi-agen, sesi, dan pesan

Dipindahkan ke halaman khusus - lihat
[Konfigurasi - agen](/id/gateway/config-agents) untuk:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memori, media, skills, sandbox)
- `multiAgent.*` (routing dan binding multi-agen)
- `session.*` (siklus hidup sesi, compaction, pruning)
- `messages.*` (pengiriman pesan, TTS, rendering markdown)
- `talk.*` (mode Talk)
  - `talk.speechLocale`: id lokal BCP 47 opsional untuk pengenalan ucapan Talk di iOS/macOS
  - `talk.silenceTimeoutMs`: saat tidak diatur, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms on macOS and Android, 900 ms on iOS`)

## Tool dan provider khusus

Kebijakan tool, toggle eksperimental, konfigurasi tool berbasis provider, dan penyiapan
provider / base-URL khusus dipindahkan ke halaman khusus - lihat
[Konfigurasi - tool dan provider khusus](/id/gateway/config-tools).

## Model

Definisi provider, allowlist model, dan penyiapan provider khusus berada di
[Konfigurasi - tool dan provider khusus](/id/gateway/config-tools#custom-providers-and-base-urls).
Root `models` juga mengelola perilaku katalog model global.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: perilaku katalog provider (`merge` atau `replace`).
- `models.providers`: map provider khusus yang dikunci berdasarkan id provider.
- `models.pricing.enabled`: mengontrol bootstrap pricing latar belakang yang
  dimulai setelah sidecar dan channel mencapai path siap Gateway. Saat `false`,
  Gateway melewati fetch katalog pricing OpenRouter dan LiteLLM; nilai
  `models.providers.*.models[].cost` yang dikonfigurasi tetap berfungsi untuk estimasi biaya lokal.

## MCP

Definisi server MCP yang dikelola OpenClaw berada di bawah `mcp.servers` dan
digunakan oleh Pi tertanam serta adaptor runtime lainnya. Perintah `openclaw mcp list`,
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

- `mcp.servers`: definisi server MCP stdio atau remote bernama untuk runtime yang
  mengekspos tool MCP yang dikonfigurasi.
  Entri remote menggunakan `transport: "streamable-http"` atau `transport: "sse"`;
  `type: "http"` adalah alias native CLI yang dinormalisasi oleh `openclaw mcp set` dan
  `openclaw doctor --fix` menjadi field `transport` kanonis.
- `mcp.sessionIdleTtlMs`: TTL idle untuk runtime MCP terbundel bercakupan sesi.
  Run tertanam sekali pakai meminta pembersihan akhir run; TTL ini adalah backstop untuk
  sesi berumur panjang dan pemanggil mendatang.
- Perubahan di bawah `mcp.*` diterapkan panas dengan membuang runtime MCP sesi yang di-cache.
  Penemuan/penggunaan tool berikutnya membuatnya ulang dari konfigurasi baru, sehingga entri
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
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
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

- `allowBundled`: allowlist opsional hanya untuk skills terbundel (skills terkelola/workspace tidak terpengaruh).
- `load.extraDirs`: root skill bersama tambahan (presedensi terendah).
- `install.preferBrew`: saat true, utamakan installer Homebrew ketika `brew` tersedia
  sebelum fallback ke jenis installer lain.
- `install.nodeManager`: preferensi installer node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` menonaktifkan skill meskipun terbundel/terinstal.
- `entries.<skillKey>.apiKey`: kemudahan untuk skill yang mendeklarasikan env var utama (string plaintext atau objek SecretRef).

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

- Dimuat dari `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, plus `plugins.load.paths`.
- Discovery menerima plugin native OpenClaw plus bundle Codex yang kompatibel dan bundle Claude, termasuk bundle layout default Claude tanpa manifest.
- **Perubahan konfigurasi memerlukan restart gateway.**
- `allow`: allowlist opsional (hanya plugin yang terdaftar yang dimuat). `deny` menang.
- `bundledDiscovery`: default ke `"allowlist"` untuk konfigurasi baru, sehingga
  `plugins.allow` yang tidak kosong juga membatasi plugin provider terbundel, termasuk provider runtime web-search.
  Doctor menulis `"compat"` untuk konfigurasi allowlist legacy yang dimigrasikan
  agar perilaku provider terbundel yang ada tetap dipertahankan sampai Anda ikut serta.
- `plugins.entries.<id>.apiKey`: field kemudahan kunci API tingkat plugin (saat didukung oleh plugin).
- `plugins.entries.<id>.env`: map env var bercakupan plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: saat `false`, core memblokir `before_prompt_build` dan mengabaikan field yang memutasi prompt dari `before_agent_start` legacy, sambil mempertahankan `modelOverride` dan `providerOverride` legacy. Berlaku untuk hook plugin native dan direktori hook yang disediakan bundle yang didukung.
- `plugins.entries.<id>.hooks.allowConversationAccess`: saat `true`, plugin non-terbundel tepercaya dapat membaca konten percakapan mentah dari hook bertipe seperti `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, dan `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: percayai plugin ini secara eksplisit untuk meminta override `provider` dan `model` per run untuk run subagen latar belakang.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opsional target `provider/model` kanonis untuk override subagen tepercaya. Gunakan `"*"` hanya saat Anda memang ingin mengizinkan model apa pun.
- `plugins.entries.<id>.config`: objek konfigurasi yang didefinisikan plugin (divalidasi oleh schema plugin native OpenClaw saat tersedia).
- Pengaturan akun/runtime plugin channel berada di bawah `channels.<id>` dan harus dijelaskan oleh metadata `channelConfigs` manifest milik plugin pemilik, bukan oleh registry opsi OpenClaw pusat.
- `plugins.entries.firecrawl.config.webFetch`: pengaturan provider web-fetch Firecrawl.
  - `apiKey`: kunci API Firecrawl (menerima SecretRef). Fallback ke `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey`, atau env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base API Firecrawl (default: `https://api.firecrawl.dev`; override self-hosted harus menargetkan endpoint privat/internal).
  - `onlyMainContent`: ekstrak hanya konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: timeout permintaan scrape dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan provider X Search.
  - `model`: model Grok yang digunakan untuk pencarian (misalnya `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan memory dreaming. Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan ambang batas.
  - `enabled`: sakelar dreaming utama (default `false`).
  - `frequency`: cadence cron untuk setiap sweep dreaming penuh (`"0 3 * * *"` secara default).
  - `model`: override model subagen Dream Diary opsional. Memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`; padukan dengan `allowedModels` untuk membatasi target. Error model tidak tersedia mencoba ulang sekali dengan model default sesi; kegagalan trust atau allowlist tidak fallback secara diam-diam.
  - kebijakan fase dan ambang batas adalah detail implementasi (bukan kunci konfigurasi yang menghadap pengguna).
- Konfigurasi memori lengkap berada di [Referensi konfigurasi memori](/id/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundle Claude yang diaktifkan juga dapat menyumbangkan default Pi tertanam dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agen yang disanitasi, bukan sebagai patch konfigurasi OpenClaw mentah.
- `plugins.slots.memory`: pilih id plugin memori aktif, atau `"none"` untuk menonaktifkan plugin memori.
- `plugins.slots.contextEngine`: pilih id plugin mesin konteks aktif; default ke `"legacy"` kecuali Anda menginstal dan memilih mesin lain.

Lihat [Plugin](/id/tools/plugin).

---

## Komitmen

`commitments` mengontrol memori tindak lanjut yang disimpulkan: OpenClaw dapat mendeteksi check-in dari giliran percakapan dan mengirimkannya melalui run heartbeat.

- `commitments.enabled`: aktifkan ekstraksi LLM tersembunyi, penyimpanan, dan pengiriman heartbeat untuk komitmen tindak lanjut yang disimpulkan. Default: `false`.
- `commitments.maxPerDay`: jumlah maksimum komitmen tindak lanjut yang disimpulkan yang dikirim per sesi agen dalam hari bergulir. Default: `3`.

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
- `tabCleanup` mengambil kembali tab agen utama terlacak setelah waktu menganggur atau ketika sebuah sesi melampaui batasnya. Atur `idleMinutes: 0` atau `maxTabsPerSession: 0` untuk menonaktifkan mode pembersihan individual tersebut.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan saat tidak diatur, sehingga navigasi browser tetap ketat secara default.
- Atur `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` hanya ketika Anda sengaja memercayai navigasi browser jaringan privat.
- Dalam mode ketat, endpoint profil CDP jarak jauh (`profiles.*.cdpUrl`) tunduk pada pemblokiran jaringan privat yang sama selama pemeriksaan keterjangkauan/penemuan.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil jarak jauh bersifat hanya lampirkan (mulai/hentikan/reset dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) ketika Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  ketika penyedia Anda memberi Anda URL WebSocket DevTools langsung.
- `remoteCdpTimeoutMs` dan `remoteCdpHandshakeTimeoutMs` berlaku untuk keterjangkauan CDP jarak jauh dan
  `attachOnly` serta permintaan pembukaan tab. Profil loopback terkelola
  mempertahankan default CDP lokal.
- Jika layanan CDP yang dikelola secara eksternal dapat dijangkau melalui loopback, atur
  `attachOnly: true` pada profil tersebut; jika tidak, OpenClaw memperlakukan port loopback sebagai
  profil browser lokal terkelola dan dapat melaporkan kesalahan kepemilikan port lokal.
- Profil `existing-session` menggunakan Chrome MCP alih-alih CDP dan dapat melampirkan pada
  host yang dipilih atau melalui node browser yang terhubung.
- Profil `existing-session` dapat mengatur `userDataDir` untuk menargetkan profil browser
  berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` mempertahankan batas rute Chrome MCP saat ini:
  tindakan berbasis snapshot/ref alih-alih penargetan pemilih CSS, hook unggahan satu file,
  tanpa penggantian batas waktu dialog, tanpa `wait --load networkidle`, dan tanpa
  `responsebody`, ekspor PDF, intersepsi unduhan, atau tindakan batch.
- Profil `openclaw` lokal terkelola menetapkan otomatis `cdpPort` dan `cdpUrl`; hanya
  atur `cdpUrl` secara eksplisit untuk CDP jarak jauh.
- Profil lokal terkelola dapat mengatur `executablePath` untuk menggantikan
  `browser.executablePath` global bagi profil tersebut. Gunakan ini untuk menjalankan satu profil di
  Chrome dan profil lain di Brave.
- Profil lokal terkelola menggunakan `browser.localLaunchTimeoutMs` untuk penemuan HTTP CDP Chrome
  setelah proses dimulai dan `browser.localCdpReadyTimeoutMs` untuk
  kesiapan websocket CDP pascapeluncuran. Naikkan nilainya pada host yang lebih lambat ketika Chrome
  berhasil dimulai tetapi pemeriksaan kesiapan berlomba dengan startup. Kedua nilai harus berupa
  bilangan bulat positif hingga `120000` md; nilai konfigurasi yang tidak valid ditolak.
- Urutan deteksi otomatis: browser default jika berbasis Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` dan `browser.profiles.<name>.executablePath` keduanya
  menerima `~` dan `~/...` untuk direktori beranda OS Anda sebelum peluncuran Chromium.
  `userDataDir` per profil pada profil `existing-session` juga diperluas dari tilde.
- Layanan kontrol: hanya loopback (port diturunkan dari `gateway.port`, default `18791`).
- `extraArgs` menambahkan flag peluncuran ekstra ke startup Chromium lokal (misalnya
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
- `assistant`: penggantian identitas UI Kontrol. Beralih ke identitas agen aktif jika tidak diatur.

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

<Accordion title="Gateway field details">

- `mode`: `local` (jalankan gateway) atau `remote` (hubungkan ke gateway jarak jauh). Gateway menolak untuk mulai kecuali `local`.
- `port`: port tunggal yang dimultipleks untuk WS + HTTP. Prioritas: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (default), `lan` (`0.0.0.0`), `tailnet` (hanya IP Tailscale), atau `custom`.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind default `loopback` mendengarkan pada `127.0.0.1` di dalam kontainer. Dengan jaringan bridge Docker (`-p 18789:18789`), lalu lintas masuk melalui `eth0`, sehingga gateway tidak dapat dijangkau. Gunakan `--network host`, atau tetapkan `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) untuk mendengarkan pada semua antarmuka.
- **Auth**: diperlukan secara default. Bind non-loopback memerlukan auth gateway. Dalam praktiknya, ini berarti token/kata sandi bersama atau reverse proxy sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wisaya onboarding menghasilkan token secara default.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRefs), tetapkan `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Alur startup dan instalasi/perbaikan layanan gagal ketika keduanya dikonfigurasi dan mode belum ditetapkan.
- `gateway.auth.mode: "none"`: mode tanpa auth yang eksplisit. Gunakan hanya untuk setup local loopback tepercaya; ini sengaja tidak ditawarkan oleh prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan auth browser/pengguna ke reverse proxy sadar identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth)). Mode ini secara default mengharapkan sumber proxy **non-loopback**; reverse proxy loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` yang eksplisit. Pemanggil internal pada host yang sama dapat menggunakan `gateway.auth.password` sebagai fallback langsung lokal; `gateway.auth.token` tetap saling eksklusif dengan mode trusted-proxy.
- `gateway.auth.allowTailscale`: ketika `true`, header identitas Tailscale Serve dapat memenuhi auth Control UI/WebSocket (diverifikasi melalui `tailscale whois`). Titik akhir HTTP API **tidak** menggunakan auth header Tailscale tersebut; mereka mengikuti mode auth HTTP normal gateway sebagai gantinya. Alur tanpa token ini mengasumsikan host gateway tepercaya. Default ke `true` ketika `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: pembatas auth-gagal opsional. Berlaku per IP klien dan per cakupan auth (shared-secret dan device-token dilacak secara independen). Percobaan yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada jalur Control UI Tailscale Serve asinkron, percobaan gagal untuk `{scope, clientIp}` yang sama diserialkan sebelum penulisan kegagalan. Karena itu, percobaan buruk bersamaan dari klien yang sama dapat memicu pembatas pada permintaan kedua, alih-alih keduanya berlomba lolos sebagai ketidakcocokan biasa.
  - `gateway.auth.rateLimit.exemptLoopback` default ke `true`; tetapkan `false` ketika Anda sengaja ingin lalu lintas localhost juga dibatasi lajunya (untuk setup pengujian atau deployment proxy ketat).
- Percobaan auth WS asal-browser selalu dibatasi lajunya dengan pengecualian loopback dinonaktifkan (defense-in-depth terhadap brute force localhost berbasis browser).
- Pada loopback, lockout asal-browser tersebut diisolasi per nilai `Origin`
  yang dinormalisasi, sehingga kegagalan berulang dari satu origin localhost tidak otomatis
  mengunci origin lain.
- `tailscale.mode`: `serve` (hanya tailnet, bind loopback) atau `funnel` (publik, memerlukan auth).
- `controlUi.allowedOrigins`: allowlist asal-browser eksplisit untuk koneksi WebSocket Gateway. Diperlukan ketika klien browser diharapkan berasal dari origin non-loopback.
- `controlUi.chatMessageMaxWidth`: max-width opsional untuk pesan chat Control UI yang dikelompokkan. Menerima nilai lebar CSS terbatas seperti `960px`, `82%`, `min(1280px, 82%)`, dan `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan fallback origin header Host untuk deployment yang sengaja mengandalkan kebijakan origin header Host.
- `remote.transport`: `ssh` (default) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus berupa `ws://` atau `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override darurat lingkungan proses sisi klien
  yang mengizinkan plaintext `ws://` ke IP jaringan privat tepercaya; default tetap hanya loopback untuk plaintext. Tidak ada padanan `openclaw.json`,
  dan konfigurasi jaringan privat browser seperti
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tidak memengaruhi klien WebSocket
  Gateway.
- `gateway.remote.token` / `.password` adalah bidang kredensial klien jarak jauh. Keduanya tidak mengonfigurasi auth gateway dengan sendirinya.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS dasar untuk relay APNs eksternal yang digunakan oleh build iOS resmi/TestFlight setelah mereka memublikasikan registrasi berbasis relay ke gateway. URL ini harus cocok dengan URL relay yang dikompilasi ke dalam build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout kirim gateway-ke-relay dalam milidetik. Default ke `10000`.
- Registrasi berbasis relay didelegasikan ke identitas gateway tertentu. Aplikasi iOS yang dipasangkan mengambil `gateway.identity.get`, menyertakan identitas tersebut dalam registrasi relay, dan meneruskan grant kirim bercakupan registrasi ke gateway. Gateway lain tidak dapat menggunakan ulang registrasi tersimpan tersebut.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env sementara untuk konfigurasi relay di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: celah keluar khusus pengembangan untuk URL relay HTTP loopback. URL relay produksi sebaiknya tetap menggunakan HTTPS.
- `gateway.handshakeTimeoutMs`: timeout handshake WebSocket Gateway pra-auth dalam milidetik. Default: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` diprioritaskan ketika ditetapkan. Tingkatkan ini pada host yang terbebani atau berdaya rendah tempat klien lokal dapat terhubung saat pemanasan startup masih stabil.
- `gateway.channelHealthCheckMinutes`: interval monitor kesehatan kanal dalam menit. Tetapkan `0` untuk menonaktifkan restart monitor kesehatan secara global. Default: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ambang soket basi dalam menit. Jaga agar ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`. Default: `30`.
- `gateway.channelMaxRestartsPerHour`: restart monitor kesehatan maksimum per kanal/akun dalam satu jam bergulir. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per kanal untuk restart monitor kesehatan sambil tetap mengaktifkan monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per akun untuk kanal multi-akun. Ketika ditetapkan, ini diprioritaskan atas override tingkat kanal.
- Jalur panggilan gateway lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` belum ditetapkan.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tanpa penyamaran fallback jarak jauh).
- `trustedProxies`: IP reverse proxy yang mengakhiri TLS atau menyisipkan header klien-terusan. Hanya cantumkan proxy yang Anda kendalikan. Entri loopback tetap valid untuk setup proxy/deteksi-lokal pada host yang sama (misalnya Tailscale Serve atau reverse proxy lokal), tetapi entri tersebut **tidak** membuat permintaan loopback memenuhi syarat untuk `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: ketika `true`, gateway menerima `X-Real-IP` jika `X-Forwarded-For` tidak ada. Default `false` untuk perilaku fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP opsional untuk menyetujui otomatis pairing perangkat node pertama kali tanpa cakupan yang diminta. Ini dinonaktifkan ketika belum ditetapkan. Ini tidak menyetujui otomatis pairing operator/browser/Control UI/WebChat, dan tidak menyetujui otomatis peningkatan peran, cakupan, metadata, atau kunci publik.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pembentukan allow/deny global untuk perintah node yang dideklarasikan setelah pairing dan evaluasi allowlist platform. Gunakan `allowCommands` untuk mengaktifkan perintah node berbahaya seperti `camera.snap`, `camera.clip`, dan `screen.record`; `denyCommands` menghapus sebuah perintah meskipun default platform atau allow eksplisit seharusnya menyertakannya. Setelah node mengubah daftar perintah yang dideklarasikan, tolak dan setujui ulang pairing perangkat tersebut agar gateway menyimpan snapshot perintah yang diperbarui.
- `gateway.tools.deny`: nama alat tambahan yang diblokir untuk HTTP `POST /tools/invoke` (memperluas daftar deny default).
- `gateway.tools.allow`: hapus nama alat dari daftar deny HTTP default.

</Accordion>

### Titik akhir yang kompatibel dengan OpenAI

- Chat Completions: dinonaktifkan secara default. Aktifkan dengan `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Penguatan input URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlist kosong diperlakukan sebagai belum ditetapkan; gunakan `gateway.http.endpoints.responses.files.allowUrl=false`
    dan/atau `gateway.http.endpoints.responses.images.allowUrl=false` untuk menonaktifkan pengambilan URL.
- Header penguatan respons opsional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (tetapkan hanya untuk origin HTTPS yang Anda kendalikan; lihat [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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

- `enabled`: mengaktifkan terminasi TLS pada listener gateway (HTTPS/WSS) (default: `false`).
- `autoGenerate`: menghasilkan otomatis pasangan sertifikat/kunci lokal yang ditandatangani sendiri ketika file eksplisit tidak dikonfigurasi; hanya untuk penggunaan lokal/dev.
- `certPath`: path filesystem ke file sertifikat TLS.
- `keyPath`: path filesystem ke file kunci privat TLS; jaga agar izin tetap dibatasi.
- `caPath`: path bundel CA opsional untuk verifikasi klien atau rantai kepercayaan kustom.

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

- `mode`: mengontrol bagaimana pengeditan konfigurasi diterapkan saat runtime.
  - `"off"`: abaikan pengeditan langsung; perubahan memerlukan restart eksplisit.
  - `"restart"`: selalu restart proses gateway saat konfigurasi berubah.
  - `"hot"`: terapkan perubahan dalam proses tanpa restart.
  - `"hybrid"` (default): coba hot reload terlebih dahulu; fallback ke restart jika diperlukan.
- `debounceMs`: jendela debounce dalam ms sebelum perubahan konfigurasi diterapkan (bilangan bulat non-negatif).
- `deferralTimeoutMs`: waktu maksimum opsional dalam ms untuk menunggu operasi yang sedang berjalan sebelum memaksa restart. Hilangkan untuk menggunakan waktu tunggu berbatas default (`300000`); tetapkan `0` untuk menunggu tanpa batas dan mencatat peringatan masih-tertunda secara berkala.

---

## Kait

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

Autentikasi: `Authorization: Bearer <token>` atau `x-openclaw-token: <token>`.
Token hook dalam string kueri ditolak.

Catatan validasi dan keamanan:

- `hooks.enabled=true` memerlukan `hooks.token` yang tidak kosong.
- `hooks.token` harus **berbeda** dari `gateway.auth.token`; penggunaan ulang token Gateway ditolak.
- `hooks.path` tidak boleh berupa `/`; gunakan subpath khusus seperti `/hooks`.
- Jika `hooks.allowRequestSessionKey=true`, batasi `hooks.allowedSessionKeyPrefixes` (misalnya `["hook:"]`).
- Jika pemetaan atau preset menggunakan `sessionKey` bertemplat, atur `hooks.allowedSessionKeyPrefixes` dan `hooks.allowRequestSessionKey=true`. Kunci pemetaan statis tidak memerlukan opt-in tersebut.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dari payload permintaan hanya diterima ketika `hooks.allowRequestSessionKey=true` (default: `false`).
- `POST /hooks/<name>` → diselesaikan melalui `hooks.mappings`
  - Nilai `sessionKey` pemetaan yang dirender dari templat diperlakukan sebagai disediakan secara eksternal dan juga memerlukan `hooks.allowRequestSessionKey=true`.

<Accordion title="Detail pemetaan">

- `match.path` mencocokkan subpath setelah `/hooks` (mis. `/hooks/gmail` → `gmail`).
- `match.source` mencocokkan kolom payload untuk path generik.
- Templat seperti `{{messages[0].subject}}` membaca dari payload.
- `transform` dapat menunjuk ke modul JS/TS yang mengembalikan aksi hook.
  - `transform.module` harus berupa path relatif dan tetap berada di dalam `hooks.transformsDir` (path absolut dan traversal ditolak).
  - Pertahankan `hooks.transformsDir` di bawah `~/.openclaw/hooks/transforms`; direktori skill workspace ditolak. Jika `openclaw doctor` melaporkan path ini sebagai tidak valid, pindahkan modul transformasi ke direktori transformasi hooks atau hapus `hooks.transformsDir`.
- `agentId` merutekan ke agen tertentu; ID yang tidak dikenal kembali ke default.
- `allowedAgentIds`: membatasi perutean eksplisit (`*` atau dihilangkan = izinkan semua, `[]` = tolak semua).
- `defaultSessionKey`: kunci sesi tetap opsional untuk eksekusi agen hook tanpa `sessionKey` eksplisit.
- `allowRequestSessionKey`: mengizinkan pemanggil `/hooks/agent` dan kunci sesi pemetaan berbasis templat untuk mengatur `sessionKey` (default: `false`).
- `allowedSessionKeyPrefixes`: allowlist prefiks opsional untuk nilai `sessionKey` eksplisit (permintaan + pemetaan), mis. `["hook:"]`. Ini menjadi wajib ketika pemetaan atau preset apa pun menggunakan `sessionKey` bertemplat.
- `deliver: true` mengirim balasan akhir ke sebuah saluran; `channel` default ke `last`.
- `model` menimpa LLM untuk eksekusi hook ini (harus diizinkan jika katalog model diatur).

</Accordion>

### Integrasi Gmail

- Preset Gmail bawaan menggunakan `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jika Anda mempertahankan perutean per pesan tersebut, atur `hooks.allowRequestSessionKey: true` dan batasi `hooks.allowedSessionKeyPrefixes` agar cocok dengan namespace Gmail, misalnya `["hook:", "hook:gmail:"]`.
- Jika Anda memerlukan `hooks.allowRequestSessionKey: false`, timpa preset dengan `sessionKey` statis sebagai pengganti default bertemplat.

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

- Gateway otomatis memulai `gog gmail watch serve` saat boot ketika dikonfigurasi. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkan.
- Jangan menjalankan `gog gmail watch serve` terpisah bersama Gateway.

---

## Host canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Menyajikan HTML/CSS/JS yang dapat diedit agen dan A2UI melalui HTTP di bawah port Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Hanya lokal: pertahankan `gateway.bind: "loopback"` (default).
- Bind non-loopback: rute canvas memerlukan autentikasi Gateway (token/kata sandi/trusted-proxy), sama seperti permukaan HTTP Gateway lainnya.
- Node WebViews biasanya tidak mengirim header autentikasi; setelah sebuah Node dipasangkan dan terhubung, Gateway mengiklankan URL kapabilitas berskup Node untuk akses canvas/A2UI.
- URL kapabilitas terikat ke sesi WS Node aktif dan kedaluwarsa dengan cepat. Fallback berbasis IP tidak digunakan.
- Menyuntikkan klien live-reload ke HTML yang disajikan.
- Otomatis membuat `index.html` awal saat kosong.
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

- `minimal` (default ketika Plugin `bonjour` bawaan diaktifkan): hilangkan `cliPath` + `sshPort` dari catatan TXT.
- `full`: sertakan `cliPath` + `sshPort`; iklan multicast LAN tetap memerlukan Plugin `bonjour` bawaan untuk diaktifkan.
- `off`: tekan iklan multicast LAN tanpa mengubah pengaktifan Plugin.
- Plugin `bonjour` bawaan otomatis dimulai pada host macOS dan bersifat opt-in pada Linux, Windows, serta deployment Gateway dalam kontainer.
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
- File `.env`: CWD `.env` + `~/.openclaw/.env` (keduanya tidak menimpa variabel yang sudah ada).
- `shellEnv`: mengimpor kunci yang diharapkan tetapi belum ada dari profil shell login Anda.
- Lihat [Lingkungan](/id/help/environment) untuk urutan prioritas lengkap.

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
- Variabel yang tidak ada/kosong akan memunculkan error saat konfigurasi dimuat.
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
- id `source: "file"`: pointer JSON absolut (misalnya `"/providers/openai/apiKey"`)
- Pola id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id `source: "exec"` tidak boleh berisi segmen path yang dibatasi slash berupa `.` atau `..` (misalnya `a/../b` ditolak)

### Permukaan kredensial yang didukung

- Matriks kanonis: [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)
- `secrets apply` menargetkan path kredensial `openclaw.json` yang didukung.
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
- Path penyedia file dan exec gagal secara tertutup ketika verifikasi ACL Windows tidak tersedia. Tetapkan `allowInsecurePath: true` hanya untuk path tepercaya yang tidak dapat diverifikasi.
- Penyedia `exec` memerlukan path `command` absolut dan menggunakan payload protokol pada stdin/stdout.
- Secara default, path perintah symlink ditolak. Tetapkan `allowSymlinkCommand: true` untuk mengizinkan path symlink sambil memvalidasi path target yang telah di-resolve.
- Jika `trustedDirs` dikonfigurasi, pemeriksaan direktori tepercaya diterapkan pada path target yang telah di-resolve.
- Lingkungan child `exec` minimal secara default; teruskan variabel yang diperlukan secara eksplisit dengan `passEnv`.
- Referensi rahasia di-resolve saat aktivasi menjadi snapshot dalam memori, lalu path permintaan hanya membaca snapshot tersebut.
- Pemfilteran permukaan aktif diterapkan selama aktivasi: referensi yang belum di-resolve pada permukaan yang diaktifkan menggagalkan startup/reload, sementara permukaan tidak aktif dilewati dengan diagnostik.

---

## Penyimpanan autentikasi

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
- Peta flat lama `auth-profiles.json` seperti `{ "provider": { "apiKey": "..." } }` bukan format runtime; `openclaw doctor --fix` menulis ulangnya menjadi profil kunci API kanonis `provider:default` dengan cadangan `.legacy-flat.*.bak`.
- Profil mode OAuth (`auth.profiles.<id>.mode = "oauth"`) tidak mendukung kredensial auth-profile berbasis SecretRef.
- Kredensial runtime statis berasal dari snapshot yang telah di-resolve dalam memori; entri `auth.json` statis lama dihapus saat ditemukan.
- Impor OAuth lama dari `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: backoff dasar dalam jam saat sebuah profil gagal karena galat
  billing/kredit-tidak-mencukupi yang benar-benar terjadi (default: `5`). Teks billing eksplisit
  masih dapat masuk ke sini bahkan pada respons `401`/`403`, tetapi pencocok teks khusus provider
  tetap dibatasi pada provider yang memilikinya (misalnya OpenRouter
  `Key limit exceeded`). Pesan HTTP `402` usage-window yang dapat dicoba ulang atau
  batas pengeluaran organisasi/workspace tetap berada di jalur `rate_limit`
  sebagai gantinya.
- `billingBackoffHoursByProvider`: override opsional per provider untuk jam backoff billing.
- `billingMaxHours`: batas dalam jam untuk pertumbuhan eksponensial backoff billing (default: `24`).
- `authPermanentBackoffMinutes`: backoff dasar dalam menit untuk kegagalan `auth_permanent` dengan keyakinan tinggi (default: `10`).
- `authPermanentMaxMinutes`: batas dalam menit untuk pertumbuhan backoff `auth_permanent` (default: `60`).
- `failureWindowHours`: jendela bergulir dalam jam yang digunakan untuk penghitung backoff (default: `24`).
- `overloadedProfileRotations`: rotasi auth-profile maksimum pada provider yang sama untuk galat overloaded sebelum beralih ke fallback model (default: `1`). Bentuk provider-sibuk seperti `ModelNotReadyException` masuk ke sini.
- `overloadedBackoffMs`: jeda tetap sebelum mencoba ulang rotasi provider/profil yang overloaded (default: `0`).
- `rateLimitedProfileRotations`: rotasi auth-profile maksimum pada provider yang sama untuk galat rate-limit sebelum beralih ke fallback model (default: `1`). Bucket rate-limit tersebut mencakup teks berbentuk provider seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, dan `resource exhausted`.

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
- Atur `logging.file` untuk path yang stabil.
- `consoleLevel` naik ke `debug` saat `--verbose`.
- `maxFileBytes`: ukuran file log aktif maksimum dalam byte sebelum rotasi (bilangan bulat positif; default: `104857600` = 100 MB). OpenClaw menyimpan hingga lima arsip bernomor di samping file aktif.
- `redactSensitive` / `redactPatterns`: penyamaran best-effort untuk output konsol, log file, catatan log OTLP, dan teks transkrip sesi yang disimpan. `redactSensitive: "off"` hanya menonaktifkan kebijakan log/transkrip umum ini; permukaan keamanan UI/tool/diagnostik tetap meredaksi rahasia sebelum emisi.

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
- `stuckSessionWarnMs`: ambang usia tanpa progres dalam ms untuk mengklasifikasikan sesi pemrosesan berjalan lama sebagai `session.long_running`, `session.stalled`, atau `session.stuck`. Balasan, tool, status, blok, dan progres ACP mereset timer; diagnostik `session.stuck` berulang melakukan backoff selama tidak berubah.
- `stuckSessionAbortMs`: ambang usia tanpa progres dalam ms sebelum pekerjaan aktif macet yang memenuhi syarat dapat di-abort-drain untuk pemulihan. Jika tidak diatur, OpenClaw menggunakan jendela embedded-run yang diperpanjang dan lebih aman, setidaknya 10 menit dan 5x `stuckSessionWarnMs`.
- `otel.enabled`: mengaktifkan pipeline ekspor OpenTelemetry (default: `false`). Untuk konfigurasi lengkap, katalog sinyal, dan model privasi, lihat [ekspor OpenTelemetry](/id/gateway/opentelemetry).
- `otel.endpoint`: URL collector untuk ekspor OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP opsional khusus sinyal. Saat diatur, ini mengesampingkan `otel.endpoint` hanya untuk sinyal tersebut.
- `otel.protocol`: `"http/protobuf"` (default) atau `"grpc"`.
- `otel.headers`: header metadata HTTP/gRPC tambahan yang dikirim bersama permintaan ekspor OTel.
- `otel.serviceName`: nama layanan untuk atribut resource.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktifkan ekspor trace, metrik, atau log.
- `otel.sampleRate`: laju sampling trace `0`-`1`.
- `otel.flushIntervalMs`: interval flush telemetri berkala dalam ms.
- `otel.captureContent`: keikutsertaan eksplisit untuk penangkapan konten mentah pada atribut span OTEL. Default nonaktif. Boolean `true` menangkap konten pesan/tool non-sistem; bentuk objek memungkinkan Anda mengaktifkan `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, dan `systemPrompt` secara eksplisit.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: toggle environment untuk atribut provider span GenAI eksperimental terbaru. Secara default span mempertahankan atribut lama `gen_ai.system` untuk kompatibilitas; metrik GenAI menggunakan atribut semantik terbatas.
- `OPENCLAW_OTEL_PRELOADED=1`: toggle environment untuk host yang sudah mendaftarkan SDK OpenTelemetry global. OpenClaw lalu melewati startup/shutdown SDK milik plugin sambil mempertahankan listener diagnostik tetap aktif.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, dan `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env var endpoint khusus sinyal yang digunakan saat key config yang sesuai tidak diatur.
- `cacheTrace.enabled`: catat snapshot trace cache untuk embedded run (default: `false`).
- `cacheTrace.filePath`: path output untuk JSONL trace cache (default: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
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
- `checkOnStart`: periksa pembaruan npm saat gateway dimulai (default: `true`).
- `auto.enabled`: aktifkan auto-update latar belakang untuk instalasi paket (default: `false`).
- `auto.stableDelayHours`: jeda minimum dalam jam sebelum auto-apply channel stable (default: `6`; maks: `168`).
- `auto.stableJitterHours`: jendela sebaran rollout tambahan channel stable dalam jam (default: `12`; maks: `168`).
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

- `enabled`: gate fitur ACP global (default: `true`; atur `false` untuk menyembunyikan affordance dispatch dan spawn ACP).
- `dispatch.enabled`: gate independen untuk dispatch turn sesi ACP (default: `true`). Atur `false` agar perintah ACP tetap tersedia sambil memblokir eksekusi.
- `backend`: id backend runtime ACP default (harus cocok dengan plugin runtime ACP terdaftar).
  Instal plugin backend terlebih dahulu, dan jika `plugins.allow` diatur, sertakan id plugin backend (misalnya `acpx`) atau backend ACP tidak akan dimuat.
- `defaultAgent`: id agent target ACP fallback saat spawn tidak menentukan target eksplisit.
- `allowedAgents`: allowlist id agent yang diizinkan untuk sesi runtime ACP; kosong berarti tidak ada pembatasan tambahan.
- `maxConcurrentSessions`: jumlah maksimum sesi ACP aktif secara bersamaan.
- `stream.coalesceIdleMs`: jendela flush idle dalam ms untuk teks streamed.
- `stream.maxChunkChars`: ukuran chunk maksimum sebelum memecah proyeksi blok streamed.
- `stream.repeatSuppression`: tekan baris status/tool yang berulang per turn (default: `true`).
- `stream.deliveryMode`: `"live"` melakukan streaming bertahap; `"final_only"` men-buffer hingga event terminal turn.
- `stream.hiddenBoundarySeparator`: pemisah sebelum teks terlihat setelah event tool tersembunyi (default: `"paragraph"`).
- `stream.maxOutputChars`: karakter output assistant maksimum yang diproyeksikan per turn ACP.
- `stream.maxSessionUpdateChars`: karakter maksimum untuk baris status/pembaruan ACP yang diproyeksikan.
- `stream.tagVisibility`: catatan nama tag ke override visibilitas boolean untuk event streamed.
- `runtime.ttlMinutes`: TTL idle dalam menit untuk worker sesi ACP sebelum memenuhi syarat cleanup.
- `runtime.installCommand`: perintah instal opsional untuk dijalankan saat bootstrap environment runtime ACP.

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
- Untuk menyembunyikan seluruh banner (bukan hanya tagline), atur env `OPENCLAW_HIDE_BANNER=1`.

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
  },
}
```

---

## Identitas

Lihat field identitas `agents.list` di bawah [default Agent](/id/gateway/config-agents#agent-defaults).

---

## Jembatan (legasi, dihapus)

Build saat ini tidak lagi menyertakan jembatan TCP. Node terhubung melalui WebSocket Gateway. Key `bridge.*` tidak lagi menjadi bagian dari skema config (validasi gagal hingga dihapus; `openclaw doctor --fix` dapat menghapus key yang tidak dikenal).

<Accordion title="Legacy bridge config (historical reference)">

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

- `sessionRetention`: berapa lama menyimpan sesi eksekusi cron terisolasi yang sudah selesai sebelum dipangkas dari `sessions.json`. Juga mengontrol pembersihan transkrip cron terhapus yang diarsipkan. Default: `24h`; atur `false` untuk menonaktifkan.
- `runLog.maxBytes`: ukuran maksimum per file log eksekusi (`cron/runs/<jobId>.jsonl`) sebelum dipangkas. Default: `2_000_000` byte.
- `runLog.keepLines`: baris terbaru yang dipertahankan saat pemangkasan log eksekusi dipicu. Default: `2000`.
- `webhookToken`: token bearer yang digunakan untuk pengiriman POST Webhook cron (`delivery.mode = "webhook"`), jika dihilangkan tidak ada header auth yang dikirim.
- `webhook`: URL Webhook fallback lama yang sudah usang (http/https) yang hanya digunakan untuk tugas tersimpan yang masih memiliki `notify: true`.

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

- `maxAttempts`: percobaan ulang maksimum untuk tugas sekali jalan pada error sementara (default: `3`; rentang: `0`-`10`).
- `backoffMs`: array penundaan backoff dalam ms untuk setiap percobaan ulang (default: `[30000, 60000, 300000]`; 1-10 entri).
- `retryOn`: jenis error yang memicu percobaan ulang - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Hilangkan untuk mencoba ulang semua jenis sementara.

Hanya berlaku untuk tugas cron sekali jalan. Tugas berulang menggunakan penanganan kegagalan terpisah.

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
- `after`: kegagalan berturut-turut sebelum peringatan dipicu (bilangan bulat positif, min: `1`).
- `cooldownMs`: milidetik minimum antara peringatan berulang untuk tugas yang sama (bilangan bulat non-negatif).
- `includeSkipped`: hitung eksekusi yang dilewati berturut-turut terhadap ambang peringatan (default: `false`). Eksekusi yang dilewati dilacak secara terpisah dan tidak memengaruhi backoff error eksekusi.
- `mode`: mode pengiriman - `"announce"` mengirim melalui pesan saluran; `"webhook"` memposting ke Webhook yang dikonfigurasi.
- `accountId`: akun opsional atau id saluran untuk membatasi cakupan pengiriman peringatan.

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

- Tujuan default untuk notifikasi kegagalan cron di semua tugas.
- `mode`: `"announce"` atau `"webhook"`; default ke `"announce"` saat data target cukup tersedia.
- `channel`: pengganti saluran untuk pengiriman announce. `"last"` menggunakan kembali saluran pengiriman terakhir yang diketahui.
- `to`: target announce eksplisit atau URL Webhook. Wajib untuk mode Webhook.
- `accountId`: pengganti akun opsional untuk pengiriman.
- `delivery.failureDestination` per tugas menggantikan default global ini.
- Saat tujuan kegagalan global maupun per tugas tidak diatur, tugas yang sudah dikirim melalui `announce` akan fallback ke target announce utama tersebut saat gagal.
- `delivery.failureDestination` hanya didukung untuk tugas `sessionTarget="isolated"` kecuali `delivery.mode` utama tugas adalah `"webhook"`.

Lihat [Tugas Cron](/id/automation/cron-jobs). Eksekusi cron terisolasi dilacak sebagai [tugas latar belakang](/id/automation/tasks).

---

## Variabel templat model media

Placeholder templat yang diperluas di `tools.media.models[].args`:

| Variabel           | Deskripsi                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Isi lengkap pesan masuk                           |
| `{{RawBody}}`      | Isi mentah (tanpa wrapper riwayat/pengirim)       |
| `{{BodyStripped}}` | Isi dengan mention grup dihapus                   |
| `{{From}}`         | Pengidentifikasi pengirim                         |
| `{{To}}`           | Pengidentifikasi tujuan                           |
| `{{MessageSid}}`   | id pesan saluran                                  |
| `{{SessionId}}`    | UUID sesi saat ini                                |
| `{{IsNewSession}}` | `"true"` saat sesi baru dibuat                    |
| `{{MediaUrl}}`     | pseudo-URL media masuk                            |
| `{{MediaPath}}`    | Path media lokal                                  |
| `{{MediaType}}`    | Jenis media (gambar/audio/dokumen/…)              |
| `{{Transcript}}`   | Transkrip audio                                   |
| `{{Prompt}}`       | Prompt media yang di-resolve untuk entri CLI      |
| `{{MaxChars}}`     | Jumlah karakter output maks yang di-resolve untuk entri CLI |
| `{{ChatType}}`     | `"direct"` atau `"group"`                         |
| `{{GroupSubject}}` | Subjek grup (upaya terbaik)                       |
| `{{GroupMembers}}` | Pratinjau anggota grup (upaya terbaik)            |
| `{{SenderName}}`   | Nama tampilan pengirim (upaya terbaik)            |
| `{{SenderE164}}`   | Nomor telepon pengirim (upaya terbaik)            |
| `{{Provider}}`     | Petunjuk penyedia (whatsapp, telegram, discord, dll.) |

---

## Include config (`$include`)

Pisahkan config menjadi beberapa file:

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

- File tunggal: menggantikan objek yang memuatnya.
- Array file: di-deep-merge secara berurutan (yang belakangan menggantikan yang sebelumnya).
- Key saudara: di-merge setelah include (mengganti nilai yang di-include).
- Include bersarang: hingga kedalaman 10 level.
- Path: di-resolve relatif terhadap file yang meng-include, tetapi harus tetap berada di dalam direktori config tingkat atas (`dirname` dari `openclaw.json`). Bentuk absolut/`../` hanya diizinkan jika masih di-resolve di dalam batas tersebut.
- Penulisan milik OpenClaw yang hanya mengubah satu bagian tingkat atas yang didukung oleh include file tunggal akan menulis langsung ke file yang di-include tersebut. Misalnya, `plugins install` memperbarui `plugins: { $include: "./plugins.json5" }` di `plugins.json5` dan membiarkan `openclaw.json` tetap utuh.
- Include root, array include, dan include dengan pengganti key saudara bersifat hanya-baca untuk penulisan milik OpenClaw; penulisan tersebut gagal secara tertutup alih-alih meratakan config.
- Error: pesan jelas untuk file yang hilang, error parse, dan include melingkar.

---

_Terkait: [Configuration](/id/gateway/configuration) · [Contoh konfigurasi](/id/gateway/configuration-examples) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Configuration](/id/gateway/configuration)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
