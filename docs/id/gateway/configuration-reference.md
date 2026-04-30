---
read_when:
    - Anda memerlukan semantik konfigurasi tingkat bidang atau nilai bawaan yang tepat
    - Anda sedang memvalidasi blok konfigurasi saluran, model, Gateway, atau alat
summary: Referensi konfigurasi Gateway untuk kunci inti OpenClaw, nilai default, dan tautan ke referensi subsistem khusus
title: Referensi konfigurasi
x-i18n:
    generated_at: "2026-04-30T09:47:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fd28b7d6a2e670ab97aac206bb14343bd887da3236c6135d7958cc6e97b735
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referensi konfigurasi inti untuk `~/.openclaw/openclaw.json`. Untuk ikhtisar berorientasi tugas, lihat [Konfigurasi](/id/gateway/configuration).

Mencakup permukaan konfigurasi utama OpenClaw dan menautkan keluar saat suatu subsistem memiliki referensi yang lebih mendalam. Katalog perintah milik saluran dan Plugin serta pengaturan memori mendalam/QMD berada di halaman masing-masing, bukan di halaman ini.

Kebenaran kode:

- `openclaw config schema` mencetak JSON Schema aktif yang digunakan untuk validasi dan Control UI, dengan metadata bawaan/Plugin/saluran digabungkan jika tersedia
- `config.schema.lookup` mengembalikan satu node skema berbasis path untuk tooling penelusuran mendalam
- `pnpm config:docs:check` / `pnpm config:docs:gen` memvalidasi hash baseline dokumen konfigurasi terhadap permukaan skema saat ini

Path pencarian agen: gunakan aksi alat `gateway` `config.schema.lookup` untuk
dokumentasi dan batasan tingkat-field yang tepat sebelum mengedit. Gunakan
[Konfigurasi](/id/gateway/configuration) untuk panduan berorientasi tugas dan halaman ini
untuk peta field yang lebih luas, default, dan tautan ke referensi subsistem.

Referensi mendalam khusus:

- [Referensi konfigurasi memori](/id/reference/memory-config) untuk `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, dan konfigurasi dreaming di bawah `plugins.entries.memory-core.config.dreaming`
- [Perintah slash](/id/tools/slash-commands) untuk katalog perintah bawaan + terbundel saat ini
- halaman saluran/Plugin pemilik untuk permukaan perintah khusus saluran

Format konfigurasi adalah **JSON5** (komentar + koma penutup diizinkan). Semua field bersifat opsional — OpenClaw menggunakan default aman saat dihilangkan.

---

## Saluran

Kunci konfigurasi per saluran dipindahkan ke halaman khusus — lihat
[Konfigurasi — saluran](/id/gateway/config-channels) untuk `channels.*`,
termasuk Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan saluran
terbundel lainnya (auth, kontrol akses, multi-akun, gating mention).

## Default agen, multi-agen, sesi, dan pesan

Dipindahkan ke halaman khusus — lihat
[Konfigurasi — agen](/id/gateway/config-agents) untuk:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, memori, media, Skills, sandbox)
- `multiAgent.*` (routing dan binding multi-agen)
- `session.*` (siklus hidup sesi, Compaction, pruning)
- `messages.*` (pengiriman pesan, TTS, rendering markdown)
- `talk.*` (mode Talk)
  - `talk.speechLocale`: id locale BCP 47 opsional untuk pengenalan ucapan Talk di iOS/macOS
  - `talk.silenceTimeoutMs`: saat tidak disetel, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms on macOS and Android, 900 ms on iOS`)

## Alat dan penyedia kustom

Kebijakan alat, toggle eksperimental, konfigurasi alat berbasis penyedia, dan penyiapan
penyedia kustom / base-URL dipindahkan ke halaman khusus — lihat
[Konfigurasi — alat dan penyedia kustom](/id/gateway/config-tools).

## Model

Definisi penyedia, allowlist model, dan penyiapan penyedia kustom berada di
[Konfigurasi — alat dan penyedia kustom](/id/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.pricing.enabled`: mengontrol bootstrap harga latar belakang. Saat
  `false`, startup Gateway melewati pengambilan katalog harga OpenRouter dan LiteLLM;
  nilai `models.providers.*.models[].cost` yang dikonfigurasi tetap berfungsi untuk
  estimasi biaya lokal.

## MCP

Definisi server MCP yang dikelola OpenClaw berada di bawah `mcp.servers` dan
dikonsumsi oleh Pi tertanam serta adapter runtime lainnya. Perintah `openclaw mcp list`,
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
  mengekspos alat MCP terkonfigurasi.
  Entri jarak jauh menggunakan `transport: "streamable-http"` atau `transport: "sse"`;
  `type: "http"` adalah alias native CLI yang dinormalisasi oleh `openclaw mcp set` dan
  `openclaw doctor --fix` ke dalam field kanonis `transport`.
- `mcp.sessionIdleTtlMs`: TTL idle untuk runtime MCP terbundel berbasis sesi.
  Run tertanam satu kali meminta pembersihan akhir-run; TTL ini adalah penahan untuk
  sesi berumur panjang dan pemanggil mendatang.
- Perubahan di bawah `mcp.*` diterapkan panas dengan membuang runtime MCP sesi yang di-cache.
  Penemuan/penggunaan alat berikutnya membuatnya ulang dari konfigurasi baru, sehingga entri
  `mcp.servers` yang dihapus segera dipanen alih-alih menunggu TTL idle.

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

- `allowBundled`: allowlist opsional hanya untuk Skills terbundel (Skills terkelola/workspace tidak terpengaruh).
- `load.extraDirs`: root skill bersama tambahan (presedensi terendah).
- `install.preferBrew`: saat true, utamakan installer Homebrew saat `brew` tersedia
  sebelum fallback ke jenis installer lain.
- `install.nodeManager`: preferensi installer Node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` menonaktifkan skill meskipun terbundel/terinstal.
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

- Dimuat dari `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, plus `plugins.load.paths`.
- Discovery menerima Plugin native OpenClaw plus bundle Codex yang kompatibel dan bundle Claude, termasuk bundle layout default Claude tanpa manifest.
- **Perubahan konfigurasi memerlukan restart gateway.**
- `allow`: allowlist opsional (hanya Plugin yang tercantum dimuat). `deny` menang.
- `plugins.entries.<id>.apiKey`: field kemudahan kunci API tingkat Plugin (jika didukung oleh Plugin).
- `plugins.entries.<id>.env`: peta env var berbasis Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: saat `false`, inti memblokir `before_prompt_build` dan mengabaikan field yang memutasi prompt dari `before_agent_start` lama, sembari mempertahankan `modelOverride` dan `providerOverride` lama. Berlaku untuk hook Plugin native dan direktori hook yang disediakan bundle yang didukung.
- `plugins.entries.<id>.hooks.allowConversationAccess`: saat `true`, Plugin non-terbundel tepercaya dapat membaca konten percakapan mentah dari hook bertipe seperti `llm_input`, `llm_output`, `before_agent_finalize`, dan `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: secara eksplisit memercayai Plugin ini untuk meminta override `provider` dan `model` per-run bagi run subagen latar belakang.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opsional target `provider/model` kanonis untuk override subagen tepercaya. Gunakan `"*"` hanya saat Anda sengaja ingin mengizinkan model apa pun.
- `plugins.entries.<id>.config`: objek konfigurasi yang didefinisikan Plugin (divalidasi oleh skema Plugin native OpenClaw jika tersedia).
- Pengaturan akun/runtime Plugin saluran berada di bawah `channels.<id>` dan harus dijelaskan oleh metadata `channelConfigs` manifest Plugin pemilik, bukan oleh registry opsi pusat OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: pengaturan penyedia web-fetch Firecrawl.
  - `apiKey`: kunci API Firecrawl (menerima SecretRef). Fallback ke `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` lama, atau env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL dasar API Firecrawl (default: `https://api.firecrawl.dev`).
  - `onlyMainContent`: ekstrak hanya konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: timeout permintaan scrape dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan penyedia X Search.
  - `model`: model Grok yang digunakan untuk pencarian (mis. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan dreaming memori. Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan ambang.
  - `enabled`: sakelar utama dreaming (default `false`).
  - `frequency`: cadence Cron untuk setiap sweep dreaming penuh (`"0 3 * * *"` secara default).
  - `model`: override model subagen Dream Diary opsional. Memerlukan `plugins.entries.memory-core.subagent.allowModelOverride: true`; pasangkan dengan `allowedModels` untuk membatasi target. Error model-tidak-tersedia mencoba ulang sekali dengan model default sesi; kegagalan trust atau allowlist tidak fallback secara diam-diam.
  - kebijakan fase dan ambang adalah detail implementasi (bukan kunci konfigurasi yang menghadap pengguna).
- Konfigurasi memori lengkap berada di [Referensi konfigurasi memori](/id/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundle Claude yang diaktifkan juga dapat menyumbang default Pi tertanam dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agen yang disanitasi, bukan sebagai patch konfigurasi OpenClaw mentah.
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
- `tabCleanup` mengambil kembali tab agen utama yang dilacak setelah waktu idle atau ketika
  sesi melampaui batasnya. Atur `idleMinutes: 0` atau `maxTabsPerSession: 0` untuk
  menonaktifkan mode pembersihan individual tersebut.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan ketika tidak diatur, sehingga navigasi browser tetap ketat secara bawaan.
- Atur `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` hanya ketika Anda secara sengaja memercayai navigasi browser jaringan privat.
- Dalam mode ketat, endpoint profil CDP jarak jauh (`profiles.*.cdpUrl`) tunduk pada pemblokiran jaringan privat yang sama selama pemeriksaan keterjangkauan/penemuan.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil jarak jauh hanya dapat dilampirkan (start/stop/reset dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) ketika Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  ketika penyedia Anda memberi Anda URL DevTools WebSocket langsung.
- `remoteCdpTimeoutMs` dan `remoteCdpHandshakeTimeoutMs` berlaku untuk keterjangkauan CDP jarak jauh dan
  `attachOnly` serta permintaan pembukaan tab. Profil loopback terkelola
  mempertahankan bawaan CDP lokal.
- Jika layanan CDP yang dikelola secara eksternal dapat dijangkau melalui loopback, atur
  `attachOnly: true` pada profil tersebut; jika tidak, OpenClaw memperlakukan port loopback sebagai
  profil browser terkelola lokal dan dapat melaporkan galat kepemilikan port lokal.
- Profil `existing-session` menggunakan Chrome MCP alih-alih CDP dan dapat dilampirkan pada
  host yang dipilih atau melalui node browser yang terhubung.
- Profil `existing-session` dapat mengatur `userDataDir` untuk menargetkan profil browser
  berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` mempertahankan batas rute Chrome MCP saat ini:
  tindakan berbasis snapshot/ref alih-alih penargetan selektor CSS, hook unggah satu berkas,
  tanpa penggantian batas waktu dialog, tanpa `wait --load networkidle`, dan tanpa
  `responsebody`, ekspor PDF, intersepsi unduhan, atau tindakan batch.
- Profil `openclaw` terkelola lokal menetapkan `cdpPort` dan `cdpUrl` secara otomatis; hanya
  atur `cdpUrl` secara eksplisit untuk CDP jarak jauh.
- Profil terkelola lokal dapat mengatur `executablePath` untuk mengganti
  `browser.executablePath` global bagi profil tersebut. Gunakan ini untuk menjalankan satu profil di
  Chrome dan profil lain di Brave.
- Profil terkelola lokal menggunakan `browser.localLaunchTimeoutMs` untuk penemuan HTTP CDP Chrome
  setelah proses dimulai dan `browser.localCdpReadyTimeoutMs` untuk
  kesiapan websocket CDP pascapeluncuran. Naikkan nilainya pada host yang lebih lambat ketika Chrome
  berhasil dimulai tetapi pemeriksaan kesiapan berpacu dengan startup. Kedua nilai harus berupa
  bilangan bulat positif hingga `120000` ms; nilai konfigurasi yang tidak valid ditolak.
- Urutan deteksi otomatis: browser bawaan jika berbasis Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` dan `browser.profiles.<name>.executablePath` keduanya
  menerima `~` dan `~/...` untuk direktori home OS Anda sebelum peluncuran Chromium.
  `userDataDir` per profil pada profil `existing-session` juga diperluas dari tilde.
- Layanan kontrol: hanya loopback (port diturunkan dari `gateway.port`, bawaan `18791`).
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
- `assistant`: penggantian identitas Control UI. Kembali ke identitas agen aktif jika tidak diatur.

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

<Accordion title="Detail kolom Gateway">

- `mode`: `local` (jalankan Gateway) atau `remote` (hubungkan ke Gateway jarak jauh). Gateway menolak memulai kecuali bernilai `local`.
- `port`: port tunggal yang dimultipleks untuk WS + HTTP. Urutan prioritas: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (default), `lan` (`0.0.0.0`), `tailnet` (hanya IP Tailscale), atau `custom`.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind `loopback` default mendengarkan pada `127.0.0.1` di dalam kontainer. Dengan jaringan bridge Docker (`-p 18789:18789`), trafik masuk melalui `eth0`, sehingga Gateway tidak dapat dijangkau. Gunakan `--network host`, atau setel `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) untuk mendengarkan pada semua antarmuka.
- **Autentikasi**: wajib secara default. Bind non-loopback memerlukan autentikasi Gateway. Dalam praktiknya, ini berarti token/kata sandi bersama atau proksi balik sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wizard penyiapan awal menghasilkan token secara default.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRefs), setel `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Alur saat memulai dan pemasangan/perbaikan layanan gagal ketika keduanya dikonfigurasi dan mode belum disetel.
- `gateway.auth.mode: "none"`: mode eksplisit tanpa autentikasi. Gunakan hanya untuk penyiapan local loopback tepercaya; ini sengaja tidak ditawarkan oleh permintaan penyiapan awal.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan autentikasi peramban/pengguna ke proksi balik sadar identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth)). Mode ini mengharapkan sumber proksi **non-loopback** secara default; proksi balik loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit. Pemanggil internal pada host yang sama dapat menggunakan `gateway.auth.password` sebagai cadangan langsung lokal; `gateway.auth.token` tetap saling eksklusif dengan mode trusted-proxy.
- `gateway.auth.allowTailscale`: saat `true`, header identitas Tailscale Serve dapat memenuhi autentikasi UI Kontrol/WebSocket (diverifikasi melalui `tailscale whois`). Endpoint API HTTP **tidak** menggunakan autentikasi header Tailscale tersebut; endpoint mengikuti mode autentikasi HTTP normal Gateway. Alur tanpa token ini mengasumsikan host Gateway tepercaya. Defaultnya `true` saat `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: pembatas autentikasi gagal opsional. Berlaku per IP klien dan per cakupan autentikasi (shared-secret dan device-token dilacak secara independen). Upaya yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada jalur asinkron UI Kontrol Tailscale Serve, upaya gagal untuk `{scope, clientIp}` yang sama dijalankan secara serial sebelum penulisan kegagalan. Karena itu, upaya buruk serentak dari klien yang sama dapat memicu pembatas pada permintaan kedua, alih-alih keduanya lolos bersamaan sebagai ketidakcocokan biasa.
  - `gateway.auth.rateLimit.exemptLoopback` defaultnya `true`; setel `false` saat Anda sengaja ingin trafik localhost juga dibatasi lajunya (untuk penyiapan pengujian atau penerapan proksi ketat).
- Upaya autentikasi WS dari asal peramban selalu dibatasi lajunya dengan pengecualian loopback dinonaktifkan (pertahanan berlapis terhadap tebak paksa localhost berbasis peramban).
- Pada loopback, penguncian dari asal peramban tersebut diisolasi per nilai
  `Origin` yang dinormalisasi, sehingga kegagalan berulang dari satu asal localhost
  tidak otomatis mengunci asal yang berbeda.
- `tailscale.mode`: `serve` (hanya tailnet, bind loopback) atau `funnel` (publik, memerlukan autentikasi).
- `controlUi.allowedOrigins`: daftar izin eksplisit asal peramban untuk koneksi WebSocket Gateway. Wajib saat klien peramban diharapkan berasal dari asal non-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan mekanisme cadangan asal header Host untuk penerapan yang sengaja mengandalkan kebijakan asal header Host.
- `remote.transport`: `ssh` (default) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus berupa `ws://` atau `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: penggantian darurat lingkungan proses sisi klien
  yang mengizinkan `ws://` teks polos ke IP jaringan privat tepercaya; default tetap hanya loopback
  untuk teks polos. Tidak ada padanan `openclaw.json`, dan konfigurasi jaringan privat peramban seperti
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tidak memengaruhi klien WebSocket
  Gateway.
- `gateway.remote.token` / `.password` adalah kolom kredensial klien jarak jauh. Keduanya tidak mengonfigurasi autentikasi Gateway dengan sendirinya.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS dasar untuk relai APNs eksternal yang digunakan oleh binaan iOS resmi/TestFlight setelah memublikasikan pendaftaran berbasis relai ke Gateway. URL ini harus cocok dengan URL relai yang dikompilasi ke dalam binaan iOS.
- `gateway.push.apns.relay.timeoutMs`: batas waktu pengiriman Gateway-ke-relai dalam milidetik. Defaultnya `10000`.
- Pendaftaran berbasis relai didelegasikan ke identitas Gateway tertentu. Aplikasi iOS yang dipasangkan mengambil `gateway.identity.get`, menyertakan identitas tersebut dalam pendaftaran relai, dan meneruskan izin pengiriman bercakupan pendaftaran ke Gateway. Gateway lain tidak dapat menggunakan ulang pendaftaran tersimpan tersebut.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: penggantian variabel lingkungan sementara untuk konfigurasi relai di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: jalan keluar khusus pengembangan untuk URL relai HTTP loopback. URL relai produksi harus tetap menggunakan HTTPS.
- `gateway.handshakeTimeoutMs`: batas waktu jabat tangan WebSocket Gateway sebelum autentikasi dalam milidetik. Default: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` diprioritaskan saat disetel. Tingkatkan ini pada host yang sibuk atau berdaya rendah, saat klien lokal dapat terhubung sementara pemanasan awal saat mulai masih berlangsung.
- `gateway.channelHealthCheckMinutes`: interval pemantau kesehatan kanal dalam menit. Setel `0` untuk menonaktifkan mulai ulang pemantau kesehatan secara global. Default: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ambang soket basi dalam menit. Pertahankan agar lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`. Default: `30`.
- `gateway.channelMaxRestartsPerHour`: jumlah maksimum mulai ulang pemantau kesehatan per kanal/akun dalam satu jam bergulir. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: penonaktifan per kanal untuk mulai ulang pemantau kesehatan sambil mempertahankan pemantau global tetap aktif.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: penggantian per akun untuk kanal multi-akun. Saat disetel, ini diprioritaskan atas penggantian tingkat kanal.
- Jalur panggilan Gateway lokal dapat menggunakan `gateway.remote.*` sebagai cadangan hanya saat `gateway.auth.*` belum disetel.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tanpa penyamaran cadangan jarak jauh).
- `trustedProxies`: IP proksi balik yang mengakhiri TLS atau menyisipkan header klien yang diteruskan. Cantumkan hanya proksi yang Anda kendalikan. Entri loopback tetap valid untuk penyiapan proksi/deteksi lokal pada host yang sama (misalnya Tailscale Serve atau proksi balik lokal), tetapi entri tersebut **tidak** membuat permintaan loopback memenuhi syarat untuk `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: saat `true`, Gateway menerima `X-Real-IP` jika `X-Forwarded-For` tidak ada. Default `false` untuk perilaku gagal tertutup.
- `gateway.nodes.pairing.autoApproveCidrs`: daftar izin CIDR/IP opsional untuk menyetujui otomatis penyandingan perangkat Node pertama kali tanpa cakupan yang diminta. Ini dinonaktifkan saat tidak disetel. Ini tidak menyetujui otomatis penyandingan operator/peramban/UI Kontrol/WebChat, dan tidak menyetujui otomatis peningkatan peran, cakupan, metadata, atau kunci publik.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pembentukan izin/tolak global untuk perintah Node yang dideklarasikan setelah penyandingan dan evaluasi daftar izin platform. Gunakan `allowCommands` untuk ikut mengaktifkan perintah Node berbahaya seperti `camera.snap`, `camera.clip`, dan `screen.record`; `denyCommands` menghapus perintah meskipun default platform atau izin eksplisit seharusnya menyertakannya. Setelah Node mengubah daftar perintah yang dideklarasikannya, tolak dan setujui ulang penyandingan perangkat tersebut agar Gateway menyimpan cuplikan perintah terbaru.
- `gateway.tools.deny`: nama alat tambahan yang diblokir untuk HTTP `POST /tools/invoke` (memperluas daftar tolak default).
- `gateway.tools.allow`: hapus nama alat dari daftar tolak HTTP default.

</Accordion>

### Endpoint yang kompatibel dengan OpenAI

- Chat Completions: dinonaktifkan secara default. Aktifkan dengan `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Pengerasan input URL untuk Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Daftar izin kosong diperlakukan sebagai belum disetel; gunakan `gateway.http.endpoints.responses.files.allowUrl=false`
    dan/atau `gateway.http.endpoints.responses.images.allowUrl=false` untuk menonaktifkan pengambilan URL.
- Header pengerasan respons opsional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (setel hanya untuk asal HTTPS yang Anda kendalikan; lihat [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolasi multi-instans

Jalankan beberapa Gateway pada satu host dengan port dan direktori keadaan yang unik:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Opsi praktis: `--dev` (menggunakan `~/.openclaw-dev` + port `19001`), `--profile <name>` (menggunakan `~/.openclaw-<name>`).

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

- `enabled`: mengaktifkan terminasi TLS pada pendengar Gateway (HTTPS/WSS) (default: `false`).
- `autoGenerate`: menghasilkan otomatis pasangan sertifikat/kunci lokal yang ditandatangani sendiri saat file eksplisit tidak dikonfigurasi; hanya untuk penggunaan lokal/pengembangan.
- `certPath`: jalur sistem berkas ke file sertifikat TLS.
- `keyPath`: jalur sistem berkas ke file kunci privat TLS; batasi izinnya.
- `caPath`: jalur bundle CA opsional untuk verifikasi klien atau rantai kepercayaan khusus.

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

- `mode`: mengontrol cara perubahan konfigurasi diterapkan pada waktu eksekusi.
  - `"off"`: abaikan perubahan langsung; perubahan memerlukan mulai ulang eksplisit.
  - `"restart"`: selalu mulai ulang proses Gateway saat konfigurasi berubah.
  - `"hot"`: terapkan perubahan di dalam proses tanpa memulai ulang.
  - `"hybrid"` (default): coba pemuatan ulang langsung terlebih dahulu; kembali ke mulai ulang jika diperlukan.
- `debounceMs`: jendela penundaan dalam ms sebelum perubahan konfigurasi diterapkan (bilangan bulat non-negatif).
- `deferralTimeoutMs`: waktu maksimum opsional dalam ms untuk menunggu operasi yang sedang berjalan sebelum memaksa mulai ulang. Hilangkan untuk menggunakan waktu tunggu berbatas default (`300000`); setel `0` untuk menunggu tanpa batas dan mencatat peringatan masih tertunda secara berkala.

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
Token kait dalam string kueri ditolak.

Catatan validasi dan keamanan:

- `hooks.enabled=true` memerlukan `hooks.token` yang tidak kosong.
- `hooks.token` harus **berbeda** dari `gateway.auth.token`; penggunaan ulang token Gateway akan ditolak.
- `hooks.path` tidak boleh `/`; gunakan subpath khusus seperti `/hooks`.
- Jika `hooks.allowRequestSessionKey=true`, batasi `hooks.allowedSessionKeyPrefixes` (misalnya `["hook:"]`).
- Jika pemetaan atau preset menggunakan `sessionKey` bertemplat, tetapkan `hooks.allowedSessionKeyPrefixes` dan `hooks.allowRequestSessionKey=true`. Kunci pemetaan statis tidak memerlukan opt-in tersebut.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dari payload permintaan hanya diterima jika `hooks.allowRequestSessionKey=true` (default: `false`).
- `POST /hooks/<name>` → diselesaikan melalui `hooks.mappings`
  - Nilai `sessionKey` pemetaan yang dirender dari templat diperlakukan sebagai dipasok dari luar dan juga memerlukan `hooks.allowRequestSessionKey=true`.

<Accordion title="Detail pemetaan">

- `match.path` mencocokkan subpath setelah `/hooks` (mis. `/hooks/gmail` → `gmail`).
- `match.source` mencocokkan field payload untuk path generik.
- Templat seperti `{{messages[0].subject}}` membaca dari payload.
- `transform` dapat menunjuk ke modul JS/TS yang mengembalikan tindakan hook.
  - `transform.module` harus berupa path relatif dan tetap berada di dalam `hooks.transformsDir` (path absolut dan traversal ditolak).
- `agentId` merutekan ke agen tertentu; ID yang tidak dikenal kembali ke default.
- `allowedAgentIds`: membatasi perutean eksplisit (`*` atau dihilangkan = izinkan semua, `[]` = tolak semua).
- `defaultSessionKey`: kunci sesi tetap opsional untuk proses agen hook tanpa `sessionKey` eksplisit.
- `allowRequestSessionKey`: mengizinkan pemanggil `/hooks/agent` dan kunci sesi pemetaan berbasis templat untuk menetapkan `sessionKey` (default: `false`).
- `allowedSessionKeyPrefixes`: daftar izin prefiks opsional untuk nilai `sessionKey` eksplisit (permintaan + pemetaan), mis. `["hook:"]`. Ini menjadi wajib ketika pemetaan atau preset apa pun menggunakan `sessionKey` bertemplat.
- `deliver: true` mengirim balasan akhir ke kanal; `channel` default ke `last`.
- `model` mengganti LLM untuk proses hook ini (harus diizinkan jika katalog model ditetapkan).

</Accordion>

### Integrasi Gmail

- Preset Gmail bawaan menggunakan `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jika Anda mempertahankan perutean per pesan tersebut, tetapkan `hooks.allowRequestSessionKey: true` dan batasi `hooks.allowedSessionKeyPrefixes` agar cocok dengan namespace Gmail, misalnya `["hook:", "hook:gmail:"]`.
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

- Gateway otomatis memulai `gog gmail watch serve` saat boot ketika dikonfigurasi. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkan.
- Jangan jalankan `gog gmail watch serve` terpisah berdampingan dengan Gateway.

---

## Host kanvas

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
- Khusus lokal: pertahankan `gateway.bind: "loopback"` (default).
- Bind non-loopback: rute kanvas memerlukan autentikasi Gateway (token/password/trusted-proxy), sama seperti permukaan HTTP Gateway lainnya.
- Node WebViews biasanya tidak mengirim header autentikasi; setelah sebuah node dipasangkan dan terhubung, Gateway mengiklankan URL kapabilitas berskup node untuk akses kanvas/A2UI.
- URL kapabilitas terikat ke sesi WS node aktif dan cepat kedaluwarsa. Fallback berbasis IP tidak digunakan.
- Menyuntikkan klien live-reload ke HTML yang disajikan.
- Otomatis membuat `index.html` awal saat kosong.
- Juga menyajikan A2UI di `/__openclaw__/a2ui/`.
- Perubahan memerlukan restart gateway.
- Nonaktifkan live reload untuk direktori besar atau error `EMFILE`.

---

## Discovery

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
- Hostname default ke hostname sistem ketika merupakan label DNS yang valid, dengan fallback ke `openclaw`. Timpa dengan `OPENCLAW_MDNS_HOSTNAME`.

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

- Variabel env inline hanya diterapkan jika env proses tidak memiliki key tersebut.
- File `.env`: `.env` CWD + `~/.openclaw/.env` (keduanya tidak menimpa variabel yang sudah ada).
- `shellEnv`: mengimpor key yang diharapkan tetapi belum ada dari profil shell login Anda.
- Lihat [Lingkungan](/id/help/environment) untuk urutan prioritas lengkap.

### Substitusi variabel env

Rujuk variabel env di string config apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Hanya nama huruf besar yang dicocokkan: `[A-Z_][A-Z0-9_]*`.
- Variabel yang hilang/kosong memunculkan error saat config dimuat.
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

### Config penyedia rahasia

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
- Secara default, path command symlink ditolak. Tetapkan `allowSymlinkCommand: true` untuk mengizinkan path symlink sambil memvalidasi path target yang di-resolve.
- Jika `trustedDirs` dikonfigurasi, pemeriksaan direktori tepercaya diterapkan pada path target yang di-resolve.
- Environment child `exec` secara default minimal; teruskan variabel yang diperlukan secara eksplisit dengan `passEnv`.
- Referensi rahasia di-resolve saat aktivasi menjadi snapshot dalam memori, lalu path request hanya membaca snapshot tersebut.
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

- Profil per-agent disimpan di `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` mendukung referensi tingkat nilai (`keyRef` untuk `api_key`, `tokenRef` untuk `token`) untuk mode kredensial statis.
- Map flat lama `auth-profiles.json` seperti `{ "provider": { "apiKey": "..." } }` bukan format runtime; `openclaw doctor --fix` menulis ulangnya menjadi profil API-key `provider:default` kanonis dengan cadangan `.legacy-flat.*.bak`.
- Profil mode OAuth (`auth.profiles.<id>.mode = "oauth"`) tidak mendukung kredensial auth-profile berbasis SecretRef.
- Kredensial runtime statis berasal dari snapshot yang telah di-resolve dalam memori; entri statis lama `auth.json` dibersihkan ketika ditemukan.
- Import OAuth lama berasal dari `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: backoff dasar dalam jam ketika sebuah profil gagal karena error
  penagihan/kredit-tidak-mencukupi yang benar (default: `5`). Teks penagihan eksplisit
  masih dapat masuk ke sini bahkan pada respons `401`/`403`, tetapi pencocok teks
  khusus penyedia tetap dibatasi pada penyedia yang memilikinya (misalnya OpenRouter
  `Key limit exceeded`). Pesan HTTP `402` yang dapat dicoba ulang untuk jendela penggunaan atau
  batas belanja organisasi/workspace tetap berada di path `rate_limit`
  sebagai gantinya.
- `billingBackoffHoursByProvider`: override opsional per penyedia untuk jam backoff penagihan.
- `billingMaxHours`: batas dalam jam untuk pertumbuhan eksponensial backoff penagihan (default: `24`).
- `authPermanentBackoffMinutes`: backoff dasar dalam menit untuk kegagalan `auth_permanent` dengan keyakinan tinggi (default: `10`).
- `authPermanentMaxMinutes`: batas dalam menit untuk pertumbuhan backoff `auth_permanent` (default: `60`).
- `failureWindowHours`: jendela bergulir dalam jam yang digunakan untuk penghitung backoff (default: `24`).
- `overloadedProfileRotations`: rotasi auth-profile penyedia yang sama maksimum untuk error overload sebelum beralih ke fallback model (default: `1`). Bentuk penyedia-sibuk seperti `ModelNotReadyException` masuk ke sini.
- `overloadedBackoffMs`: penundaan tetap sebelum mencoba ulang rotasi penyedia/profil yang overload (default: `0`).
- `rateLimitedProfileRotations`: rotasi auth-profile penyedia yang sama maksimum untuk error batas laju sebelum beralih ke fallback model (default: `1`). Bucket batas laju tersebut mencakup teks berbentuk penyedia seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, dan `resource exhausted`.

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
- Atur `logging.file` untuk jalur stabil.
- `consoleLevel` naik ke `debug` saat `--verbose`.
- `maxFileBytes`: ukuran maksimum file log aktif dalam byte sebelum rotasi (bilangan bulat positif; default: `104857600` = 100 MB). OpenClaw menyimpan hingga lima arsip bernomor di samping file aktif.
- `redactSensitive` / `redactPatterns`: penyamaran upaya terbaik untuk output konsol, log file, rekaman log OTLP, dan teks transkrip sesi yang dipersistenkan. `redactSensitive: "off"` hanya menonaktifkan kebijakan log/transkrip umum ini; permukaan keamanan UI/tool/diagnostik tetap menyunting rahasia sebelum emisi.

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
- `flags`: array string flag yang mengaktifkan output log bertarget (mendukung wildcard seperti `"telegram.*"` atau `"*"`).
- `stuckSessionWarnMs`: ambang usia dalam ms untuk mengeluarkan peringatan sesi-macet saat sesi tetap dalam status pemrosesan.
- `otel.enabled`: mengaktifkan pipeline ekspor OpenTelemetry (default: `false`). Untuk konfigurasi lengkap, katalog sinyal, dan model privasi, lihat [ekspor OpenTelemetry](/id/gateway/opentelemetry).
- `otel.endpoint`: URL kolektor untuk ekspor OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP opsional khusus sinyal. Saat diatur, ini menggantikan `otel.endpoint` hanya untuk sinyal tersebut.
- `otel.protocol`: `"http/protobuf"` (default) atau `"grpc"`.
- `otel.headers`: header metadata HTTP/gRPC tambahan yang dikirim bersama permintaan ekspor OTel.
- `otel.serviceName`: nama layanan untuk atribut resource.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktifkan ekspor trace, metrik, atau log.
- `otel.sampleRate`: laju sampling trace `0`–`1`.
- `otel.flushIntervalMs`: interval flush telemetri berkala dalam ms.
- `otel.captureContent`: pengambilan konten mentah berbasis opt-in untuk atribut span OTEL. Default nonaktif. Boolean `true` menangkap konten pesan/tool non-sistem; bentuk objek memungkinkan Anda mengaktifkan `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, dan `systemPrompt` secara eksplisit.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: toggle lingkungan untuk atribut penyedia span GenAI eksperimental terbaru. Secara default, span mempertahankan atribut lama `gen_ai.system` untuk kompatibilitas; metrik GenAI menggunakan atribut semantik terbatas.
- `OPENCLAW_OTEL_PRELOADED=1`: toggle lingkungan untuk host yang sudah mendaftarkan SDK OpenTelemetry global. OpenClaw kemudian melewati startup/shutdown SDK milik Plugin sambil menjaga listener diagnostik tetap aktif.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, dan `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabel env endpoint khusus sinyal yang digunakan saat kunci konfigurasi yang sesuai belum diatur.
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
- `checkOnStart`: periksa pembaruan npm saat gateway dimulai (default: `true`).
- `auto.enabled`: aktifkan pembaruan otomatis latar belakang untuk instalasi paket (default: `false`).
- `auto.stableDelayHours`: penundaan minimum dalam jam sebelum penerapan otomatis kanal stable (default: `6`; maks: `168`).
- `auto.stableJitterHours`: jendela sebaran rollout tambahan untuk kanal stable dalam jam (default: `12`; maks: `168`).
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

- `enabled`: gate fitur ACP global (default: `true`; atur `false` untuk menyembunyikan dispatch ACP dan affordance spawn).
- `dispatch.enabled`: gate independen untuk dispatch giliran sesi ACP (default: `true`). Atur `false` untuk menjaga perintah ACP tetap tersedia sambil memblokir eksekusi.
- `backend`: id backend runtime ACP default (harus cocok dengan Plugin runtime ACP yang terdaftar).
  Jika `plugins.allow` diatur, sertakan id Plugin backend (misalnya `acpx`) atau Plugin default bawaan tidak akan dimuat.
- `defaultAgent`: id agen target ACP fallback saat spawn tidak menentukan target eksplisit.
- `allowedAgents`: allowlist id agen yang diizinkan untuk sesi runtime ACP; kosong berarti tidak ada pembatasan tambahan.
- `maxConcurrentSessions`: jumlah maksimum sesi ACP aktif secara bersamaan.
- `stream.coalesceIdleMs`: jendela flush idle dalam ms untuk teks yang di-stream.
- `stream.maxChunkChars`: ukuran chunk maksimum sebelum membagi proyeksi blok yang di-stream.
- `stream.repeatSuppression`: tekan baris status/tool yang berulang per giliran (default: `true`).
- `stream.deliveryMode`: `"live"` melakukan streaming secara inkremental; `"final_only"` melakukan buffering hingga event terminal giliran.
- `stream.hiddenBoundarySeparator`: pemisah sebelum teks terlihat setelah event tool tersembunyi (default: `"paragraph"`).
- `stream.maxOutputChars`: jumlah karakter output asisten maksimum yang diproyeksikan per giliran ACP.
- `stream.maxSessionUpdateChars`: jumlah karakter maksimum untuk baris status/pembaruan ACP yang diproyeksikan.
- `stream.tagVisibility`: rekaman nama tag ke override visibilitas boolean untuk event yang di-stream.
- `runtime.ttlMinutes`: TTL idle dalam menit untuk worker sesi ACP sebelum memenuhi syarat untuk pembersihan.
- `runtime.installCommand`: perintah instalasi opsional untuk dijalankan saat melakukan bootstrap lingkungan runtime ACP.

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
  - `"random"` (default): tagline lucu/musiman yang bergilir.
  - `"default"`: tagline netral tetap (`All your chats, one OpenClaw.`).
  - `"off"`: tanpa teks tagline (judul/versi banner tetap ditampilkan).
- Untuk menyembunyikan seluruh banner (bukan hanya tagline), atur env `OPENCLAW_HIDE_BANNER=1`.

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

Lihat kolom identitas `agents.list` di bawah [Default agen](/id/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, dihapus)

Build saat ini tidak lagi menyertakan bridge TCP. Node terhubung melalui Gateway WebSocket. Kunci `bridge.*` tidak lagi menjadi bagian dari skema konfigurasi (validasi gagal hingga dihapus; `openclaw doctor --fix` dapat menghapus kunci yang tidak dikenal).

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

- `sessionRetention`: berapa lama menyimpan sesi run Cron terisolasi yang selesai sebelum dipangkas dari `sessions.json`. Juga mengontrol pembersihan transkrip Cron terhapus yang diarsipkan. Default: `24h`; atur `false` untuk menonaktifkan.
- `runLog.maxBytes`: ukuran maksimum per file log run (`cron/runs/<jobId>.jsonl`) sebelum dipangkas. Default: `2_000_000` byte.
- `runLog.keepLines`: baris terbaru yang dipertahankan saat pemangkasan log run dipicu. Default: `2000`.
- `webhookToken`: token bearer yang digunakan untuk pengiriman POST Webhook Cron (`delivery.mode = "webhook"`), jika dihilangkan tidak ada header auth yang dikirim.
- `webhook`: URL Webhook fallback legacy yang tidak digunakan lagi (http/https), hanya digunakan untuk job tersimpan yang masih memiliki `notify: true`.

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

- `maxAttempts`: percobaan ulang maksimum untuk job sekali jalan pada error sementara (default: `3`; rentang: `0`–`10`).
- `backoffMs`: array penundaan backoff dalam ms untuk setiap percobaan ulang (default: `[30000, 60000, 300000]`; 1–10 entri).
- `retryOn`: jenis error yang memicu percobaan ulang — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Hilangkan untuk mencoba ulang semua jenis sementara.

Berlaku hanya untuk job Cron sekali jalan. Job berulang menggunakan penanganan kegagalan terpisah.

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

- `enabled`: aktifkan alert kegagalan untuk job Cron (default: `false`).
- `after`: kegagalan berturut-turut sebelum alert dikirim (bilangan bulat positif, min: `1`).
- `cooldownMs`: milidetik minimum antara alert berulang untuk job yang sama (bilangan bulat non-negatif).
- `includeSkipped`: hitung run yang dilewati berturut-turut terhadap ambang alert (default: `false`). Run yang dilewati dilacak secara terpisah dan tidak memengaruhi backoff error eksekusi.
- `mode`: mode pengiriman — `"announce"` mengirim melalui pesan kanal; `"webhook"` mem-post ke Webhook yang dikonfigurasi.
- `accountId`: akun atau id kanal opsional untuk mencakupkan pengiriman alert.

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
- `channel`: pengganti kanal untuk pengiriman announce. `"last"` menggunakan kembali kanal pengiriman terakhir yang diketahui.
- `to`: target announce eksplisit atau URL webhook. Wajib untuk mode webhook.
- `accountId`: pengganti akun opsional untuk pengiriman.
- `delivery.failureDestination` per pekerjaan mengesampingkan default global ini.
- Ketika tujuan kegagalan global maupun per pekerjaan tidak diatur, pekerjaan yang sudah mengirim melalui `announce` kembali menggunakan target announce utama tersebut saat gagal.
- `delivery.failureDestination` hanya didukung untuk pekerjaan `sessionTarget="isolated"` kecuali `delivery.mode` utama pekerjaan adalah `"webhook"`.

Lihat [Pekerjaan Cron](/id/automation/cron-jobs). Eksekusi cron terisolasi dilacak sebagai [tugas latar belakang](/id/automation/tasks).

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
| `{{MessageSid}}`   | Id pesan kanal                                    |
| `{{SessionId}}`    | UUID sesi saat ini                                |
| `{{IsNewSession}}` | `"true"` saat sesi baru dibuat                    |
| `{{MediaUrl}}`     | URL semu media masuk                              |
| `{{MediaPath}}`    | Jalur media lokal                                 |
| `{{MediaType}}`    | Jenis media (gambar/audio/dokumen/…)              |
| `{{Transcript}}`   | Transkrip audio                                   |
| `{{Prompt}}`       | Prompt media yang diselesaikan untuk entri CLI    |
| `{{MaxChars}}`     | Jumlah karakter output maksimum yang diselesaikan untuk entri CLI |
| `{{ChatType}}`     | `"direct"` atau `"group"`                         |
| `{{GroupSubject}}` | Subjek grup (upaya terbaik)                       |
| `{{GroupMembers}}` | Pratinjau anggota grup (upaya terbaik)            |
| `{{SenderName}}`   | Nama tampilan pengirim (upaya terbaik)            |
| `{{SenderE164}}`   | Nomor telepon pengirim (upaya terbaik)            |
| `{{Provider}}`     | Petunjuk penyedia (WhatsApp, Telegram, Discord, dll.) |

---

## Include konfigurasi (`$include`)

Pisahkan konfigurasi ke beberapa file:

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
- Array file: digabungkan secara mendalam sesuai urutan (yang lebih akhir mengesampingkan yang lebih awal).
- Kunci saudara: digabungkan setelah include (mengesampingkan nilai yang disertakan).
- Include bersarang: hingga kedalaman 10 level.
- Jalur: diselesaikan relatif terhadap file yang menyertakan, tetapi harus tetap berada di dalam direktori konfigurasi tingkat atas (`dirname` dari `openclaw.json`). Bentuk absolut/`../` hanya diizinkan ketika tetap terselesaikan di dalam batas tersebut.
- Penulisan milik OpenClaw yang hanya mengubah satu bagian tingkat atas yang didukung oleh include file tunggal menulis langsung ke file yang disertakan tersebut. Misalnya, `plugins install` memperbarui `plugins: { $include: "./plugins.json5" }` di `plugins.json5` dan membiarkan `openclaw.json` tetap utuh.
- Include root, array include, dan include dengan pengganti kunci saudara bersifat hanya-baca untuk penulisan milik OpenClaw; penulisan tersebut gagal tertutup alih-alih meratakan konfigurasi.
- Kesalahan: pesan yang jelas untuk file yang hilang, kesalahan parsing, dan include melingkar.

---

_Terkait: [Konfigurasi](/id/gateway/configuration) · [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
