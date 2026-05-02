---
read_when:
    - Anda memerlukan semantik konfigurasi tingkat bidang atau nilai default yang tepat
    - Anda sedang memvalidasi blok konfigurasi saluran, model, Gateway, atau alat
summary: Referensi konfigurasi Gateway untuk kunci inti OpenClaw, nilai default, dan tautan ke referensi subsistem khusus
title: Referensi konfigurasi
x-i18n:
    generated_at: "2026-05-02T09:20:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: afdbe56195982130603f02ff2350f253c32db4d72723035bba52d630a971602a
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referensi konfigurasi inti untuk `~/.openclaw/openclaw.json`. Untuk gambaran umum berorientasi tugas, lihat [Konfigurasi](/id/gateway/configuration).

Mencakup permukaan konfigurasi utama OpenClaw dan menautkan keluar ketika subsistem memiliki referensi yang lebih mendalam sendiri. Katalog perintah milik channel dan Plugin serta pengaturan lanjutan memori/QMD berada di halaman tersendiri, bukan di halaman ini.

Kebenaran kode:

- `openclaw config schema` mencetak JSON Schema live yang digunakan untuk validasi dan Control UI, dengan metadata bawaan/Plugin/channel digabungkan saat tersedia
- `config.schema.lookup` mengembalikan satu node skema berbasis path untuk tooling penelusuran mendalam
- `pnpm config:docs:check` / `pnpm config:docs:gen` memvalidasi hash baseline dokumen konfigurasi terhadap permukaan skema saat ini

Path pencarian agen: gunakan aksi tool `gateway` `config.schema.lookup` untuk
dokumentasi dan batasan tingkat field yang tepat sebelum mengedit. Gunakan
[Konfigurasi](/id/gateway/configuration) untuk panduan berorientasi tugas dan halaman ini
untuk peta field yang lebih luas, default, dan tautan ke referensi subsistem.

Referensi mendalam khusus:

- [Referensi konfigurasi memori](/id/reference/memory-config) untuk `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, dan konfigurasi dreaming di bawah `plugins.entries.memory-core.config.dreaming`
- [Perintah slash](/id/tools/slash-commands) untuk katalog perintah bawaan + bundel saat ini
- halaman channel/Plugin pemilik untuk permukaan perintah khusus channel

Format konfigurasi adalah **JSON5** (komentar + koma akhir diizinkan). Semua field bersifat opsional — OpenClaw menggunakan default yang aman saat dihilangkan.

---

## Channel

Kunci konfigurasi per channel dipindahkan ke halaman khusus — lihat
[Konfigurasi — channel](/id/gateway/config-channels) untuk `channels.*`,
termasuk Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan channel
bundel lainnya (auth, kontrol akses, multi-akun, gating mention).

## Default agen, multi-agen, sesi, dan pesan

Dipindahkan ke halaman khusus — lihat
[Konfigurasi — agen](/id/gateway/config-agents) untuk:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, memori, media, Skills, sandbox)
- `multiAgent.*` (routing dan binding multi-agen)
- `session.*` (siklus hidup sesi, Compaction, pruning)
- `messages.*` (pengiriman pesan, TTS, rendering markdown)
- `talk.*` (mode Talk)
  - `talk.speechLocale`: id locale BCP 47 opsional untuk pengenalan ucapan Talk di iOS/macOS
  - `talk.silenceTimeoutMs`: saat tidak diatur, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms on macOS and Android, 900 ms on iOS`)

## Tool dan penyedia kustom

Kebijakan tool, toggle eksperimental, konfigurasi tool berbasis penyedia, dan penyiapan
penyedia kustom / URL dasar dipindahkan ke halaman khusus — lihat
[Konfigurasi — tool dan penyedia kustom](/id/gateway/config-tools).

## Model

Definisi penyedia, allowlist model, dan penyiapan penyedia kustom berada di
[Konfigurasi — tool dan penyedia kustom](/id/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers`: peta penyedia kustom dengan kunci id penyedia.
- `models.pricing.enabled`: mengontrol bootstrap harga latar belakang. Saat
  `false`, startup Gateway melewati pengambilan katalog harga OpenRouter dan LiteLLM;
  nilai `models.providers.*.models[].cost` yang dikonfigurasi tetap berfungsi untuk
  estimasi biaya lokal.

## MCP

Definisi server MCP yang dikelola OpenClaw berada di bawah `mcp.servers` dan
dikonsumsi oleh Pi tersemat serta adapter runtime lainnya. Perintah `openclaw mcp list`,
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

- `mcp.servers`: definisi server MCP bernama stdio atau remote untuk runtime yang
  mengekspos tool MCP yang dikonfigurasi.
  Entri remote menggunakan `transport: "streamable-http"` atau `transport: "sse"`;
  `type: "http"` adalah alias native CLI yang dinormalisasi oleh `openclaw mcp set` dan
  `openclaw doctor --fix` ke dalam field `transport` kanonis.
- `mcp.sessionIdleTtlMs`: TTL idle untuk runtime MCP bundel berbasis sesi.
  Eksekusi tersemat sekali jalan meminta pembersihan akhir eksekusi; TTL ini adalah cadangan untuk
  sesi berumur panjang dan pemanggil masa depan.
- Perubahan di bawah `mcp.*` diterapkan secara hot dengan membuang runtime MCP sesi yang di-cache.
  Penemuan/penggunaan tool berikutnya membuat ulang dari konfigurasi baru, sehingga entri
  `mcp.servers` yang dihapus langsung dibersihkan alih-alih menunggu TTL idle.

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

- `allowBundled`: allowlist opsional hanya untuk Skills bundel (Skills terkelola/workspace tidak terpengaruh).
- `load.extraDirs`: root skill bersama tambahan (prioritas terendah).
- `install.preferBrew`: saat true, utamakan installer Homebrew ketika `brew` tersedia
  sebelum fallback ke jenis installer lain.
- `install.nodeManager`: preferensi installer Node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` menonaktifkan skill meskipun dibundel/diinstal.
- `entries.<skillKey>.apiKey`: kemudahan untuk Skills yang mendeklarasikan env var utama (string plaintext atau objek SecretRef).

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

- Dimuat dari `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, ditambah `plugins.load.paths`.
- Penemuan menerima Plugin OpenClaw native plus bundel Codex yang kompatibel dan bundel Claude, termasuk bundel tata letak default Claude tanpa manifest.
- **Perubahan konfigurasi memerlukan restart gateway.**
- `allow`: allowlist opsional (hanya Plugin yang tercantum yang dimuat). `deny` menang.
- `plugins.entries.<id>.apiKey`: field kemudahan kunci API tingkat Plugin (saat didukung oleh Plugin).
- `plugins.entries.<id>.env`: peta env var berskala Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: saat `false`, core memblokir `before_prompt_build` dan mengabaikan field yang mengubah prompt dari `before_agent_start` legacy, sambil mempertahankan `modelOverride` dan `providerOverride` legacy. Berlaku untuk hook Plugin native dan direktori hook yang disediakan bundel yang didukung.
- `plugins.entries.<id>.hooks.allowConversationAccess`: saat `true`, Plugin non-bundel tepercaya dapat membaca konten percakapan mentah dari hook bertipe seperti `llm_input`, `llm_output`, `before_agent_finalize`, dan `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: secara eksplisit memercayai Plugin ini untuk meminta override `provider` dan `model` per eksekusi untuk eksekusi subagen latar belakang.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opsional target `provider/model` kanonis untuk override subagen tepercaya. Gunakan `"*"` hanya ketika Anda sengaja ingin mengizinkan model apa pun.
- `plugins.entries.<id>.config`: objek konfigurasi yang ditentukan Plugin (divalidasi oleh skema Plugin OpenClaw native saat tersedia).
- Pengaturan akun/runtime Plugin channel berada di bawah `channels.<id>` dan harus dijelaskan oleh metadata `channelConfigs` manifest Plugin pemilik, bukan oleh registri opsi OpenClaw pusat.
- `plugins.entries.firecrawl.config.webFetch`: pengaturan penyedia web-fetch Firecrawl.
  - `apiKey`: kunci API Firecrawl (menerima SecretRef). Fallback ke `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey`, atau env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL dasar API Firecrawl (default: `https://api.firecrawl.dev`; override self-hosted harus menargetkan endpoint privat/internal).
  - `onlyMainContent`: ekstrak hanya konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: timeout permintaan scrape dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan penyedia X Search.
  - `model`: model Grok yang digunakan untuk pencarian (misalnya `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan memory dreaming. Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan threshold.
  - `enabled`: switch utama dreaming (default `false`).
  - `frequency`: cadence Cron untuk setiap sweep dreaming penuh (`"0 3 * * *"` secara default).
  - `model`: override model subagen Dream Diary opsional. Memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`; pasangkan dengan `allowedModels` untuk membatasi target. Error model tidak tersedia mencoba ulang sekali dengan model default sesi; kegagalan trust atau allowlist tidak fallback secara diam-diam.
  - kebijakan fase dan threshold adalah detail implementasi (bukan kunci konfigurasi yang menghadap pengguna).
- Konfigurasi memori lengkap berada di [Referensi konfigurasi memori](/id/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundel Claude yang diaktifkan juga dapat menyumbangkan default Pi tersemat dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agen yang disanitasi, bukan sebagai patch konfigurasi OpenClaw mentah.
- `plugins.slots.memory`: pilih id Plugin memori aktif, atau `"none"` untuk menonaktifkan Plugin memori.
- `plugins.slots.contextEngine`: pilih id Plugin mesin konteks aktif; default ke `"legacy"` kecuali Anda menginstal dan memilih mesin lain.

Lihat [Plugin](/id/tools/plugin).

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
- `tabCleanup` mengambil kembali tab agen utama yang dilacak setelah waktu idle atau ketika sebuah
  sesi melebihi batasnya. Atur `idleMinutes: 0` atau `maxTabsPerSession: 0` untuk
  menonaktifkan mode pembersihan individual tersebut.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan saat tidak disetel, sehingga navigasi browser tetap ketat secara default.
- Setel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` hanya ketika Anda sengaja memercayai navigasi browser jaringan privat.
- Dalam mode ketat, endpoint profil CDP jarak jauh (`profiles.*.cdpUrl`) tunduk pada pemblokiran jaringan privat yang sama selama pemeriksaan keterjangkauan/penemuan.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil jarak jauh hanya dapat dilampirkan (mulai/hentikan/reset dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) ketika Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  ketika penyedia Anda memberi Anda URL DevTools WebSocket langsung.
- `remoteCdpTimeoutMs` dan `remoteCdpHandshakeTimeoutMs` berlaku untuk keterjangkauan CDP jarak jauh dan
  `attachOnly` serta permintaan pembukaan tab. Profil local loopback
  terkelola tetap memakai default CDP lokal.
- Jika layanan CDP yang dikelola secara eksternal dapat dijangkau melalui loopback, setel
  `attachOnly: true` pada profil tersebut; jika tidak, OpenClaw memperlakukan port loopback sebagai
  profil browser lokal terkelola dan dapat melaporkan kesalahan kepemilikan port lokal.
- Profil `existing-session` menggunakan Chrome MCP alih-alih CDP dan dapat dilampirkan pada
  host yang dipilih atau melalui node browser yang terhubung.
- Profil `existing-session` dapat menyetel `userDataDir` untuk menargetkan profil browser
  berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` mempertahankan batas rute Chrome MCP saat ini:
  tindakan berbasis snapshot/ref alih-alih penargetan pemilih CSS, hook unggah satu file,
  tanpa penggantian batas waktu dialog, tanpa `wait --load networkidle`, dan tanpa
  `responsebody`, ekspor PDF, intersepsi unduhan, atau tindakan batch.
- Profil `openclaw` lokal terkelola menetapkan `cdpPort` dan `cdpUrl` otomatis; hanya
  setel `cdpUrl` secara eksplisit untuk CDP jarak jauh.
- Profil lokal terkelola dapat menyetel `executablePath` untuk mengganti
  `browser.executablePath` global bagi profil tersebut. Gunakan ini untuk menjalankan satu profil di
  Chrome dan profil lain di Brave.
- Profil lokal terkelola menggunakan `browser.localLaunchTimeoutMs` untuk penemuan HTTP CDP Chrome
  setelah proses dimulai dan `browser.localCdpReadyTimeoutMs` untuk
  kesiapan websocket CDP pascapeluncuran. Naikkan nilainya pada host yang lebih lambat ketika Chrome
  berhasil dimulai tetapi pemeriksaan kesiapan berpacu dengan startup. Kedua nilai harus berupa
  bilangan bulat positif hingga `120000` md; nilai konfigurasi tidak valid ditolak.
- Urutan deteksi otomatis: browser default jika berbasis Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` dan `browser.profiles.<name>.executablePath` sama-sama
  menerima `~` dan `~/...` untuk direktori home OS Anda sebelum peluncuran Chromium.
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

- `seamColor`: warna aksen untuk chrome UI aplikasi native (warna gelembung Talk Mode, dll.).
- `assistant`: penggantian identitas Control UI. Kembali ke identitas agen aktif jika tidak ada.

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

- `mode`: `local` (jalankan gateway) atau `remote` (hubungkan ke gateway jarak jauh). Gateway menolak untuk dimulai kecuali `local`.
- `port`: port tunggal termultipleks untuk WS + HTTP. Prioritas: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (default), `lan` (`0.0.0.0`), `tailnet` (hanya IP Tailscale), atau `custom`.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind `loopback` default mendengarkan di `127.0.0.1` di dalam kontainer. Dengan jaringan bridge Docker (`-p 18789:18789`), trafik masuk melalui `eth0`, sehingga gateway tidak dapat dijangkau. Gunakan `--network host`, atau atur `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) untuk mendengarkan di semua antarmuka.
- **Autentikasi**: diwajibkan secara default. Bind non-loopback memerlukan autentikasi gateway. Dalam praktiknya, ini berarti token/kata sandi bersama atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wizard onboarding menghasilkan token secara default.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRefs), atur `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Alur startup dan instalasi/perbaikan layanan gagal ketika keduanya dikonfigurasi dan mode belum diatur.
- `gateway.auth.mode: "none"`: mode tanpa autentikasi eksplisit. Gunakan hanya untuk penyiapan local loopback tepercaya; ini sengaja tidak ditawarkan oleh prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan autentikasi browser/pengguna ke reverse proxy yang sadar identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth)). Mode ini mengharapkan sumber proxy **non-loopback** secara default; reverse proxy loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit. Pemanggil internal pada host yang sama dapat menggunakan `gateway.auth.password` sebagai fallback langsung lokal; `gateway.auth.token` tetap saling eksklusif dengan mode trusted-proxy.
- `gateway.auth.allowTailscale`: ketika `true`, header identitas Tailscale Serve dapat memenuhi autentikasi Control UI/WebSocket (diverifikasi melalui `tailscale whois`). Endpoint HTTP API **tidak** menggunakan autentikasi header Tailscale tersebut; endpoint itu mengikuti mode autentikasi HTTP normal milik gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Default ke `true` ketika `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: pembatas gagal-autentikasi opsional. Berlaku per IP klien dan per cakupan autentikasi (shared-secret dan device-token dilacak secara independen). Percobaan yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada jalur Control UI Tailscale Serve asinkron, percobaan gagal untuk `{scope, clientIp}` yang sama diserialisasi sebelum penulisan kegagalan. Karena itu, percobaan buruk serentak dari klien yang sama dapat memicu pembatas pada permintaan kedua, alih-alih keduanya berlomba lewat sebagai ketidakcocokan biasa.
  - `gateway.auth.rateLimit.exemptLoopback` default ke `true`; atur `false` ketika Anda sengaja ingin trafik localhost juga dibatasi lajunya (untuk penyiapan pengujian atau penerapan proxy ketat).
- Percobaan autentikasi WS asal-browser selalu dibatasi dengan pengecualian loopback dinonaktifkan (pertahanan berlapis terhadap brute force localhost berbasis browser).
- Pada loopback, penguncian asal-browser tersebut diisolasi per nilai `Origin`
  yang dinormalisasi, sehingga kegagalan berulang dari satu asal localhost tidak otomatis
  mengunci asal lain.
- `tailscale.mode`: `serve` (hanya tailnet, bind loopback) atau `funnel` (publik, memerlukan autentikasi).
- `controlUi.allowedOrigins`: allowlist asal browser eksplisit untuk koneksi WebSocket Gateway. Wajib ketika klien browser diharapkan dari asal non-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan fallback asal header Host untuk penerapan yang sengaja mengandalkan kebijakan asal header Host.
- `remote.transport`: `ssh` (default) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus berupa `ws://` atau `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override darurat lingkungan proses sisi klien
  yang mengizinkan `ws://` plaintext ke IP jaringan privat tepercaya; default tetap hanya loopback
  untuk plaintext. Tidak ada padanan `openclaw.json`,
  dan konfigurasi jaringan privat browser seperti
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tidak memengaruhi klien WebSocket
  Gateway.
- `gateway.remote.token` / `.password` adalah kolom kredensial klien jarak jauh. Keduanya tidak mengonfigurasi autentikasi gateway sendiri.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS dasar untuk relay APNs eksternal yang digunakan oleh build iOS resmi/TestFlight setelah build itu menerbitkan registrasi berbasis relay ke gateway. URL ini harus cocok dengan URL relay yang dikompilasi ke dalam build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout pengiriman gateway-ke-relay dalam milidetik. Default ke `10000`.
- Registrasi berbasis relay didelegasikan ke identitas gateway tertentu. Aplikasi iOS yang dipasangkan mengambil `gateway.identity.get`, menyertakan identitas tersebut dalam registrasi relay, dan meneruskan izin kirim bercakupan registrasi ke gateway. Gateway lain tidak dapat menggunakan ulang registrasi tersimpan tersebut.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env sementara untuk konfigurasi relay di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch khusus pengembangan untuk URL relay HTTP loopback. URL relay produksi harus tetap menggunakan HTTPS.
- `gateway.handshakeTimeoutMs`: timeout handshake WebSocket Gateway pra-autentikasi dalam milidetik. Default: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` diprioritaskan ketika diatur. Naikkan ini pada host yang terbebani atau berdaya rendah ketika klien lokal dapat terhubung sementara pemanasan startup masih stabil.
- `gateway.channelHealthCheckMinutes`: interval pemantau kesehatan channel dalam menit. Atur `0` untuk menonaktifkan restart pemantau kesehatan secara global. Default: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ambang soket stale dalam menit. Pertahankan ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`. Default: `30`.
- `gateway.channelMaxRestartsPerHour`: restart pemantau kesehatan maksimum per channel/akun dalam satu jam bergulir. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: penonaktifan per-channel untuk restart pemantau kesehatan sambil tetap mengaktifkan pemantau global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per-akun untuk channel multi-akun. Ketika diatur, ini diprioritaskan atas override tingkat channel.
- Jalur panggilan gateway lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` belum diatur.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tanpa masking fallback jarak jauh).
- `trustedProxies`: IP reverse proxy yang menghentikan TLS atau menyuntikkan header klien-terusan. Cantumkan hanya proxy yang Anda kendalikan. Entri loopback tetap valid untuk penyiapan proxy/deteksi-lokal pada host yang sama (misalnya Tailscale Serve atau reverse proxy lokal), tetapi entri tersebut **tidak** membuat permintaan loopback memenuhi syarat untuk `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: ketika `true`, gateway menerima `X-Real-IP` jika `X-Forwarded-For` tidak ada. Default `false` untuk perilaku gagal tertutup.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP opsional untuk menyetujui otomatis pemasangan perangkat node pertama kali tanpa cakupan yang diminta. Ini dinonaktifkan ketika tidak diatur. Ini tidak menyetujui otomatis pemasangan operator/browser/Control UI/WebChat, dan tidak menyetujui otomatis peningkatan peran, cakupan, metadata, atau kunci publik.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pembentukan allow/deny global untuk perintah node yang dideklarasikan setelah pemasangan dan evaluasi allowlist platform. Gunakan `allowCommands` untuk memilih ikut perintah node berbahaya seperti `camera.snap`, `camera.clip`, dan `screen.record`; `denyCommands` menghapus perintah meskipun default platform atau allow eksplisit seharusnya menyertakannya. Setelah node mengubah daftar perintah yang dideklarasikannya, tolak dan setujui ulang pemasangan perangkat tersebut agar gateway menyimpan snapshot perintah yang diperbarui.
- `gateway.tools.deny`: nama alat tambahan yang diblokir untuk HTTP `POST /tools/invoke` (memperluas daftar deny default).
- `gateway.tools.allow`: hapus nama alat dari daftar deny HTTP default.

</Accordion>

### Endpoint yang kompatibel dengan OpenAI

- Chat Completions: dinonaktifkan secara default. Aktifkan dengan `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Penguatan input URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlist kosong diperlakukan sebagai belum diatur; gunakan `gateway.http.endpoints.responses.files.allowUrl=false`
    dan/atau `gateway.http.endpoints.responses.images.allowUrl=false` untuk menonaktifkan pengambilan URL.
- Header penguatan respons opsional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (atur hanya untuk asal HTTPS yang Anda kendalikan; lihat [Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolasi multi-instans

Jalankan beberapa gateway pada satu host dengan port dan direktori state unik:

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
- `autoGenerate`: menghasilkan otomatis pasangan sertifikat/kunci self-signed lokal ketika file eksplisit tidak dikonfigurasi; hanya untuk penggunaan lokal/dev.
- `certPath`: path sistem file ke file sertifikat TLS.
- `keyPath`: path sistem file ke file kunci privat TLS; batasi izinnya.
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

- `mode`: mengontrol cara edit konfigurasi diterapkan saat runtime.
  - `"off"`: abaikan edit langsung; perubahan memerlukan restart eksplisit.
  - `"restart"`: selalu restart proses gateway saat konfigurasi berubah.
  - `"hot"`: terapkan perubahan dalam proses tanpa restart.
  - `"hybrid"` (default): coba hot reload terlebih dahulu; fallback ke restart jika diperlukan.
- `debounceMs`: jendela debounce dalam ms sebelum perubahan konfigurasi diterapkan (bilangan bulat non-negatif).
- `deferralTimeoutMs`: waktu maksimum opsional dalam ms untuk menunggu operasi yang sedang berjalan sebelum memaksa restart. Hilangkan untuk menggunakan tunggu berbatas default (`300000`); atur `0` untuk menunggu tanpa batas dan mencatat peringatan masih-tertunda secara berkala.

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

Autentikasi: `Authorization: Bearer <token>` atau `x-openclaw-token: <token>`.
Token hook string kueri ditolak.

Catatan validasi dan keamanan:

- `hooks.enabled=true` memerlukan `hooks.token` yang tidak kosong.
- `hooks.token` harus **berbeda** dari `gateway.auth.token`; penggunaan ulang token Gateway akan ditolak.
- `hooks.path` tidak boleh berupa `/`; gunakan subpath khusus seperti `/hooks`.
- Jika `hooks.allowRequestSessionKey=true`, batasi `hooks.allowedSessionKeyPrefixes` (misalnya `["hook:"]`).
- Jika pemetaan atau preset menggunakan `sessionKey` bertemplat, tetapkan `hooks.allowedSessionKeyPrefixes` dan `hooks.allowRequestSessionKey=true`. Kunci pemetaan statis tidak memerlukan ikut-serta tersebut.

**Titik akhir:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dari payload permintaan hanya diterima saat `hooks.allowRequestSessionKey=true` (default: `false`).
- `POST /hooks/<name>` → diselesaikan melalui `hooks.mappings`
  - Nilai `sessionKey` pemetaan yang dirender dari templat diperlakukan sebagai dipasok secara eksternal dan juga memerlukan `hooks.allowRequestSessionKey=true`.

<Accordion title="Detail pemetaan">

- `match.path` mencocokkan subpath setelah `/hooks` (mis. `/hooks/gmail` → `gmail`).
- `match.source` mencocokkan kolom payload untuk path generik.
- Templat seperti `{{messages[0].subject}}` membaca dari payload.
- `transform` dapat menunjuk ke modul JS/TS yang mengembalikan aksi hook.
  - `transform.module` harus berupa path relatif dan tetap berada dalam `hooks.transformsDir` (path absolut dan traversal ditolak).
- `agentId` merutekan ke agen tertentu; ID yang tidak dikenal kembali ke default.
- `allowedAgentIds`: membatasi perutean eksplisit (`*` atau dihilangkan = izinkan semua, `[]` = tolak semua).
- `defaultSessionKey`: kunci sesi tetap opsional untuk hook yang menjalankan agen tanpa `sessionKey` eksplisit.
- `allowRequestSessionKey`: mengizinkan pemanggil `/hooks/agent` dan kunci sesi pemetaan berbasis templat untuk menetapkan `sessionKey` (default: `false`).
- `allowedSessionKeyPrefixes`: daftar izin prefiks opsional untuk nilai `sessionKey` eksplisit (permintaan + pemetaan), mis. `["hook:"]`. Ini menjadi wajib saat pemetaan atau preset apa pun menggunakan `sessionKey` bertemplat.
- `deliver: true` mengirim balasan akhir ke kanal; `channel` default ke `last`.
- `model` menimpa LLM untuk eksekusi hook ini (harus diizinkan jika katalog model ditetapkan).

</Accordion>

### Integrasi Gmail

- Preset Gmail bawaan menggunakan `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jika Anda mempertahankan perutean per pesan tersebut, tetapkan `hooks.allowRequestSessionKey: true` dan batasi `hooks.allowedSessionKeyPrefixes` agar sesuai dengan namespace Gmail, misalnya `["hook:", "hook:gmail:"]`.
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

- Gateway memulai otomatis `gog gmail watch serve` saat boot ketika dikonfigurasi. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkan.
- Jangan jalankan `gog gmail watch serve` terpisah bersama Gateway.

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
- Bind non-loopback: rute canvas memerlukan auth Gateway (token/password/trusted-proxy), sama seperti permukaan HTTP Gateway lainnya.
- Node WebViews biasanya tidak mengirim header auth; setelah node dipasangkan dan tersambung, Gateway mengiklankan URL kapabilitas bercakupan node untuk akses canvas/A2UI.
- URL kapabilitas terikat ke sesi WS node aktif dan kedaluwarsa dengan cepat. Fallback berbasis IP tidak digunakan.
- Menyuntikkan klien muat ulang langsung ke HTML yang disajikan.
- Membuat otomatis `index.html` awal saat kosong.
- Juga menyajikan A2UI di `/__openclaw__/a2ui/`.
- Perubahan memerlukan restart gateway.
- Nonaktifkan muat ulang langsung untuk direktori besar atau kesalahan `EMFILE`.

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
- `full`: sertakan `cliPath` + `sshPort`.
- Nama host default ke nama host sistem saat berupa label DNS yang valid, dengan fallback ke `openclaw`. Timpa dengan `OPENCLAW_MDNS_HOSTNAME`.

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

- Env var inline hanya diterapkan jika env proses tidak memiliki key tersebut.
- File `.env`: CWD `.env` + `~/.openclaw/.env` (keduanya tidak menimpa var yang sudah ada).
- `shellEnv`: mengimpor key yang diharapkan tetapi belum ada dari profil shell login Anda.
- Lihat [Lingkungan](/id/help/environment) untuk urutan prioritas lengkap.

### Substitusi env var

Rujuk env var dalam string konfigurasi apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Hanya nama huruf besar yang cocok: `[A-Z_][A-Z0-9_]*`.
- Var yang hilang/kosong memunculkan error saat konfigurasi dimuat.
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
- Pola id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id `source: "exec"` tidak boleh berisi segmen path berbatas slash `.` atau `..` (misalnya `a/../b` ditolak)

### Permukaan kredensial yang didukung

- Matriks kanonis: [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)
- `secrets apply` menargetkan path kredensial `openclaw.json` yang didukung.
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
- Path penyedia file dan exec gagal tertutup ketika verifikasi ACL Windows tidak tersedia. Tetapkan `allowInsecurePath: true` hanya untuk path tepercaya yang tidak dapat diverifikasi.
- Penyedia `exec` memerlukan path `command` absolut dan menggunakan payload protokol pada stdin/stdout.
- Secara default, path perintah symlink ditolak. Tetapkan `allowSymlinkCommand: true` untuk mengizinkan path symlink sambil memvalidasi path target yang sudah di-resolve.
- Jika `trustedDirs` dikonfigurasi, pemeriksaan direktori tepercaya diterapkan pada path target yang sudah di-resolve.
- Lingkungan child `exec` minimal secara default; teruskan variabel yang diperlukan secara eksplisit dengan `passEnv`.
- Ref rahasia di-resolve pada waktu aktivasi menjadi snapshot dalam memori, lalu path request hanya membaca snapshot tersebut.
- Pemfilteran permukaan aktif diterapkan selama aktivasi: ref yang belum ter-resolve pada permukaan aktif membuat startup/reload gagal, sementara permukaan tidak aktif dilewati dengan diagnostik.

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
- `auth-profiles.json` mendukung ref tingkat nilai (`keyRef` untuk `api_key`, `tokenRef` untuk `token`) untuk mode kredensial statis.
- Peta datar lama `auth-profiles.json` seperti `{ "provider": { "apiKey": "..." } }` bukan format runtime; `openclaw doctor --fix` menulis ulangnya menjadi profil API-key `provider:default` kanonis dengan backup `.legacy-flat.*.bak`.
- Profil mode OAuth (`auth.profiles.<id>.mode = "oauth"`) tidak mendukung kredensial auth-profile berbasis SecretRef.
- Kredensial runtime statis berasal dari snapshot ter-resolve dalam memori; entri `auth.json` statis lama dibersihkan ketika ditemukan.
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

- `billingBackoffHours`: backoff dasar dalam jam ketika profil gagal karena error
  billing/kredit-tidak-mencukupi yang sebenarnya (default: `5`). Teks billing eksplisit dapat
  tetap masuk ke sini bahkan pada respons `401`/`403`, tetapi pencocok teks spesifik penyedia
  tetap dibatasi pada penyedia yang memilikinya (misalnya OpenRouter
  `Key limit exceeded`). Pesan HTTP `402` usage-window yang dapat dicoba ulang atau
  batas belanja organisasi/workspace tetap berada di path `rate_limit`
  sebagai gantinya.
- `billingBackoffHoursByProvider`: override opsional per penyedia untuk jam backoff billing.
- `billingMaxHours`: batas dalam jam untuk pertumbuhan eksponensial backoff billing (default: `24`).
- `authPermanentBackoffMinutes`: backoff dasar dalam menit untuk kegagalan `auth_permanent` dengan keyakinan tinggi (default: `10`).
- `authPermanentMaxMinutes`: batas dalam menit untuk pertumbuhan backoff `auth_permanent` (default: `60`).
- `failureWindowHours`: jendela bergulir dalam jam yang digunakan untuk penghitung backoff (default: `24`).
- `overloadedProfileRotations`: rotasi auth-profile penyedia yang sama maksimum untuk error overloaded sebelum beralih ke fallback model (default: `1`). Bentuk provider-busy seperti `ModelNotReadyException` masuk ke sini.
- `overloadedBackoffMs`: jeda tetap sebelum mencoba ulang rotasi penyedia/profil yang overloaded (default: `0`).
- `rateLimitedProfileRotations`: rotasi auth-profile penyedia yang sama maksimum untuk error rate-limit sebelum beralih ke fallback model (default: `1`). Bucket rate-limit tersebut mencakup teks berbentuk penyedia seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, dan `resource exhausted`.

---

## Pencatatan log

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
- Atur `logging.file` untuk jalur yang stabil.
- `consoleLevel` naik ke `debug` ketika `--verbose`.
- `maxFileBytes`: ukuran maksimum file log aktif dalam byte sebelum rotasi (bilangan bulat positif; default: `104857600` = 100 MB). OpenClaw menyimpan hingga lima arsip bernomor di sebelah file aktif.
- `redactSensitive` / `redactPatterns`: penyamaran upaya terbaik untuk output konsol, log file, rekaman log OTLP, dan teks transkrip sesi yang dipersistenkan. `redactSensitive: "off"` hanya menonaktifkan kebijakan log/transkrip umum ini; permukaan keamanan UI/alat/diagnostik tetap menyamarkan rahasia sebelum emisi.

---

## Diagnostik

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

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
- `flags`: array string flag yang mengaktifkan output log tertarget (mendukung wildcard seperti `"telegram.*"` atau `"*"`).
- `stuckSessionWarnMs`: ambang usia tanpa progres dalam ms untuk mengklasifikasikan sesi pemrosesan yang berjalan lama sebagai `session.long_running`, `session.stalled`, atau `session.stuck`. Balasan, alat, status, blok, dan progres ACP mereset timer; diagnostik `session.stuck` berulang melakukan backoff selama tidak berubah.
- `otel.enabled`: mengaktifkan pipeline ekspor OpenTelemetry (default: `false`). Untuk konfigurasi lengkap, katalog sinyal, dan model privasi, lihat [ekspor OpenTelemetry](/id/gateway/opentelemetry).
- `otel.endpoint`: URL kolektor untuk ekspor OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP opsional khusus sinyal. Jika diatur, nilai ini menggantikan `otel.endpoint` hanya untuk sinyal tersebut.
- `otel.protocol`: `"http/protobuf"` (default) atau `"grpc"`.
- `otel.headers`: header metadata HTTP/gRPC tambahan yang dikirim bersama permintaan ekspor OTel.
- `otel.serviceName`: nama layanan untuk atribut sumber daya.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktifkan ekspor trace, metrik, atau log.
- `otel.sampleRate`: laju sampling trace `0`–`1`.
- `otel.flushIntervalMs`: interval flush telemetri berkala dalam ms.
- `otel.captureContent`: pengambilan konten mentah opt-in untuk atribut span OTEL. Default mati. Boolean `true` mengambil konten pesan/alat non-sistem; bentuk objek memungkinkan Anda mengaktifkan `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, dan `systemPrompt` secara eksplisit.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: toggle lingkungan untuk atribut penyedia span GenAI eksperimental terbaru. Secara default span mempertahankan atribut lama `gen_ai.system` untuk kompatibilitas; metrik GenAI menggunakan atribut semantik terbatas.
- `OPENCLAW_OTEL_PRELOADED=1`: toggle lingkungan untuk host yang sudah mendaftarkan SDK OpenTelemetry global. OpenClaw lalu melewati startup/shutdown SDK milik Plugin sambil menjaga listener diagnostik tetap aktif.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, dan `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabel env endpoint khusus sinyal yang digunakan ketika kunci konfigurasi yang cocok belum diatur.
- `cacheTrace.enabled`: catat snapshot trace cache untuk run tertanam (default: `false`).
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

- `channel`: kanal rilis untuk instalasi npm/git — `"stable"`, `"beta"`, atau `"dev"`.
- `checkOnStart`: periksa pembaruan npm ketika Gateway dimulai (default: `true`).
- `auto.enabled`: aktifkan pembaruan otomatis latar belakang untuk instalasi paket (default: `false`).
- `auto.stableDelayHours`: jeda minimum dalam jam sebelum penerapan otomatis kanal stable (default: `6`; maks: `168`).
- `auto.stableJitterHours`: jendela sebaran rollout tambahan kanal stable dalam jam (default: `12`; maks: `168`).
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

- `enabled`: gerbang fitur ACP global (default: `true`; atur `false` untuk menyembunyikan dispatch ACP dan affordance spawn).
- `dispatch.enabled`: gerbang independen untuk dispatch giliran sesi ACP (default: `true`). Atur `false` agar perintah ACP tetap tersedia sambil memblokir eksekusi.
- `backend`: id backend runtime ACP default (harus cocok dengan Plugin runtime ACP yang terdaftar).
  Instal Plugin backend terlebih dahulu, dan jika `plugins.allow` diatur, sertakan id Plugin backend (misalnya `acpx`) atau backend ACP tidak akan dimuat.
- `defaultAgent`: id agen target ACP fallback ketika spawn tidak menentukan target eksplisit.
- `allowedAgents`: allowlist id agen yang diizinkan untuk sesi runtime ACP; kosong berarti tidak ada pembatasan tambahan.
- `maxConcurrentSessions`: jumlah maksimum sesi ACP yang aktif secara bersamaan.
- `stream.coalesceIdleMs`: jendela flush idle dalam ms untuk teks streaming.
- `stream.maxChunkChars`: ukuran chunk maksimum sebelum memecah proyeksi blok streaming.
- `stream.repeatSuppression`: tekan baris status/alat berulang per giliran (default: `true`).
- `stream.deliveryMode`: `"live"` melakukan streaming bertahap; `"final_only"` menyangga hingga peristiwa terminal giliran.
- `stream.hiddenBoundarySeparator`: pemisah sebelum teks terlihat setelah peristiwa alat tersembunyi (default: `"paragraph"`).
- `stream.maxOutputChars`: karakter output asisten maksimum yang diproyeksikan per giliran ACP.
- `stream.maxSessionUpdateChars`: karakter maksimum untuk baris status/pembaruan ACP yang diproyeksikan.
- `stream.tagVisibility`: rekaman nama tag ke override visibilitas boolean untuk peristiwa streaming.
- `runtime.ttlMinutes`: TTL idle dalam menit untuk pekerja sesi ACP sebelum memenuhi syarat pembersihan.
- `runtime.installCommand`: perintah instal opsional untuk dijalankan ketika bootstrap lingkungan runtime ACP.

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
  - `"random"` (default): tagline lucu/musiman yang berputar.
  - `"default"`: tagline netral tetap (`All your chats, one OpenClaw.`).
  - `"off"`: tanpa teks tagline (judul/versi banner tetap ditampilkan).
- Untuk menyembunyikan seluruh banner (bukan hanya tagline), atur env `OPENCLAW_HIDE_BANNER=1`.

---

## Pemandu

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

Lihat field identitas `agents.list` di bawah [Default agen](/id/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, dihapus)

Build saat ini tidak lagi menyertakan jembatan TCP. Node terhubung melalui WebSocket Gateway. Kunci `bridge.*` tidak lagi menjadi bagian dari skema konfigurasi (validasi gagal hingga dihapus; `openclaw doctor --fix` dapat menghapus kunci yang tidak dikenal).

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

- `sessionRetention`: berapa lama menyimpan sesi run cron terisolasi yang selesai sebelum dipangkas dari `sessions.json`. Juga mengontrol pembersihan transkrip cron terhapus yang diarsipkan. Default: `24h`; atur `false` untuk menonaktifkan.
- `runLog.maxBytes`: ukuran maksimum per file log run (`cron/runs/<jobId>.jsonl`) sebelum pemangkasan. Default: `2_000_000` byte.
- `runLog.keepLines`: baris terbaru yang dipertahankan ketika pemangkasan log run dipicu. Default: `2000`.
- `webhookToken`: token bearer yang digunakan untuk pengiriman POST Webhook cron (`delivery.mode = "webhook"`), jika dihilangkan tidak ada header auth yang dikirim.
- `webhook`: URL Webhook fallback legacy yang sudah tidak digunakan (http/https), hanya digunakan untuk job tersimpan yang masih memiliki `notify: true`.

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

- `maxAttempts`: retry maksimum untuk job sekali jalan pada error sementara (default: `3`; rentang: `0`–`10`).
- `backoffMs`: array jeda backoff dalam ms untuk setiap percobaan retry (default: `[30000, 60000, 300000]`; 1–10 entri).
- `retryOn`: jenis error yang memicu retry — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Hilangkan untuk retry semua jenis sementara.

Berlaku hanya untuk job cron sekali jalan. Job berulang menggunakan penanganan kegagalan terpisah.

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
- `after`: kegagalan berturut-turut sebelum peringatan dipicu (bilangan bulat positif, min: `1`).
- `cooldownMs`: milidetik minimum antara peringatan berulang untuk job yang sama (bilangan bulat non-negatif).
- `includeSkipped`: hitung run yang dilewati berturut-turut ke ambang peringatan (default: `false`). Run yang dilewati dilacak secara terpisah dan tidak memengaruhi backoff error eksekusi.
- `mode`: mode pengiriman — `"announce"` mengirim melalui pesan kanal; `"webhook"` mem-posting ke Webhook yang dikonfigurasi.
- `accountId`: akun atau id kanal opsional untuk membatasi cakupan pengiriman peringatan.

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

- Tujuan default untuk notifikasi kegagalan Cron di semua pekerjaan.
- `mode`: `"announce"` atau `"webhook"`; default ke `"announce"` ketika data target yang memadai tersedia.
- `channel`: penimpaan saluran untuk pengiriman announce. `"last"` menggunakan kembali saluran pengiriman terakhir yang diketahui.
- `to`: target announce eksplisit atau URL Webhook. Wajib untuk mode Webhook.
- `accountId`: penimpaan akun opsional untuk pengiriman.
- `delivery.failureDestination` per pekerjaan menimpa default global ini.
- Ketika tujuan kegagalan global maupun per pekerjaan tidak ditetapkan, pekerjaan yang sudah mengirim melalui `announce` akan kembali menggunakan target announce utama tersebut saat gagal.
- `delivery.failureDestination` hanya didukung untuk pekerjaan `sessionTarget="isolated"` kecuali `delivery.mode` utama pekerjaan adalah `"webhook"`.

Lihat [Pekerjaan Cron](/id/automation/cron-jobs). Eksekusi Cron terisolasi dilacak sebagai [tugas latar belakang](/id/automation/tasks).

---

## Variabel templat model media

Placeholder templat yang diperluas di `tools.media.models[].args`:

| Variabel           | Deskripsi                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Isi lengkap pesan masuk                           |
| `{{RawBody}}`      | Isi mentah (tanpa pembungkus riwayat/pengirim)    |
| `{{BodyStripped}}` | Isi dengan sebutan grup dihapus                   |
| `{{From}}`         | Pengidentifikasi pengirim                         |
| `{{To}}`           | Pengidentifikasi tujuan                           |
| `{{MessageSid}}`   | ID pesan saluran                                  |
| `{{SessionId}}`    | UUID sesi saat ini                                |
| `{{IsNewSession}}` | `"true"` ketika sesi baru dibuat                  |
| `{{MediaUrl}}`     | URL semu media masuk                              |
| `{{MediaPath}}`    | Jalur media lokal                                 |
| `{{MediaType}}`    | Jenis media (gambar/audio/dokumen/…)              |
| `{{Transcript}}`   | Transkrip audio                                   |
| `{{Prompt}}`       | Prompt media yang diresolusikan untuk entri CLI   |
| `{{MaxChars}}`     | Jumlah karakter output maks. yang diresolusikan untuk entri CLI |
| `{{ChatType}}`     | `"direct"` atau `"group"`                         |
| `{{GroupSubject}}` | Subjek grup (upaya terbaik)                       |
| `{{GroupMembers}}` | Pratinjau anggota grup (upaya terbaik)            |
| `{{SenderName}}`   | Nama tampilan pengirim (upaya terbaik)            |
| `{{SenderE164}}`   | Nomor telepon pengirim (upaya terbaik)            |
| `{{Provider}}`     | Petunjuk penyedia (whatsapp, telegram, discord, dll.) |

---

## Penyertaan konfigurasi (`$include`)

Pisahkan konfigurasi ke dalam beberapa berkas:

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

- Satu berkas: menggantikan objek yang memuatnya.
- Array berkas: digabungkan secara mendalam sesuai urutan (yang belakangan menimpa yang lebih awal).
- Kunci sejajar: digabungkan setelah penyertaan (menimpa nilai yang disertakan).
- Penyertaan bersarang: hingga kedalaman 10 tingkat.
- Jalur: diselesaikan relatif terhadap berkas yang menyertakan, tetapi harus tetap berada di dalam direktori konfigurasi tingkat atas (`dirname` dari `openclaw.json`). Bentuk absolut/`../` hanya diizinkan jika tetap diselesaikan di dalam batas tersebut.
- Penulisan milik OpenClaw yang hanya mengubah satu bagian tingkat atas yang didukung oleh penyertaan satu berkas akan ditulis langsung ke berkas yang disertakan tersebut. Misalnya, `plugins install` memperbarui `plugins: { $include: "./plugins.json5" }` di `plugins.json5` dan membiarkan `openclaw.json` tetap utuh.
- Penyertaan root, array penyertaan, dan penyertaan dengan penimpaan kunci sejajar bersifat hanya-baca untuk penulisan milik OpenClaw; penulisan tersebut gagal tertutup alih-alih meratakan konfigurasi.
- Kesalahan: pesan yang jelas untuk berkas yang hilang, kesalahan parsing, dan penyertaan sirkular.

---

_Terkait: [Konfigurasi](/id/gateway/configuration) · [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
