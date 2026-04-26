---
read_when:
    - Anda memerlukan semantik atau nilai default config yang tepat pada level field
    - Anda sedang memvalidasi blok config channel, model, gateway, atau tool
summary: Referensi config Gateway untuk key inti OpenClaw, nilai default, dan tautan ke referensi subsistem khusus
title: Referensi config
x-i18n:
    generated_at: "2026-04-26T11:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c6e12c328cfc3de71e401ae48b44343769c4f6b063479c8ffa4d0e690a2433
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Referensi config inti untuk `~/.openclaw/openclaw.json`. Untuk ikhtisar berbasis tugas, lihat [Configuration](/id/gateway/configuration).

Mencakup surface config utama OpenClaw dan memberikan tautan keluar saat sebuah subsistem memiliki referensi mendalamnya sendiri. Katalog perintah milik channel dan Plugin, serta pengaturan memori/QMD mendalam, ada di halaman masing-masing, bukan di halaman ini.

Sumber kebenaran kode:

- `openclaw config schema` mencetak JSON Schema live yang digunakan untuk validasi dan Control UI, dengan metadata bawaan/Plugin/channel digabungkan saat tersedia
- `config.schema.lookup` mengembalikan satu node schema dengan cakupan path untuk tooling drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` memvalidasi hash baseline dokumen config terhadap surface schema saat ini

Path lookup agen: gunakan aksi tool `gateway` `config.schema.lookup` untuk
mendapatkan dokumentasi dan batasan level field yang tepat sebelum melakukan edit. Gunakan
[Configuration](/id/gateway/configuration) untuk panduan berbasis tugas dan halaman ini
untuk peta field yang lebih luas, nilai default, dan tautan ke referensi subsistem.

Referensi mendalam khusus:

- [Referensi config memori](/id/reference/memory-config) untuk `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, dan config dreaming di bawah `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/id/tools/slash-commands) untuk katalog perintah bawaan + bawaan terkini
- halaman channel/Plugin pemilik untuk surface perintah khusus channel

Format config adalah **JSON5** (komentar + trailing comma diperbolehkan). Semua field bersifat opsional — OpenClaw menggunakan nilai default yang aman bila dihilangkan.

---

## Channel

Key config per channel dipindahkan ke halaman khusus — lihat
[Configuration — channel](/id/gateway/config-channels) untuk `channels.*`,
termasuk Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan channel
bawaan lainnya (auth, kontrol akses, multi-akun, pembatasan mention).

## Default agen, multi-agen, sesi, dan pesan

Dipindahkan ke halaman khusus — lihat
[Configuration — agents](/id/gateway/config-agents) untuk:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, memori, media, Skills, sandbox)
- `multiAgent.*` (routing dan binding multi-agen)
- `session.*` (siklus hidup sesi, Compaction, pemangkasan)
- `messages.*` (pengiriman pesan, TTS, rendering markdown)
- `talk.*` (mode Talk)
  - `talk.speechLocale`: id locale BCP 47 opsional untuk pengenalan ucapan Talk di iOS/macOS
  - `talk.silenceTimeoutMs`: bila tidak diatur, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms di macOS dan Android, 900 ms di iOS`)

## Tool dan provider kustom

Kebijakan tool, toggle eksperimental, config tool berbasis provider, dan penyiapan
provider kustom / base-URL dipindahkan ke halaman khusus — lihat
[Configuration — tools and custom providers](/id/gateway/config-tools).

## MCP

Definisi server MCP yang dikelola OpenClaw berada di bawah `mcp.servers` dan
dikonsumsi oleh Pi tertanam serta adaptor runtime lainnya. Perintah `openclaw mcp list`,
`show`, `set`, dan `unset` mengelola blok ini tanpa terhubung ke
server target selama pengeditan config.

```json5
{
  mcp: {
    // Opsional. Default: 600000 ms (10 menit). Atur 0 untuk menonaktifkan penghapusan idle.
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
- `mcp.sessionIdleTtlMs`: TTL idle untuk runtime MCP bawaan dengan cakupan sesi.
  Eksekusi tertanam sekali jalan meminta pembersihan akhir eksekusi; TTL ini adalah penopang
  untuk sesi jangka panjang dan pemanggil di masa mendatang.
- Perubahan di bawah `mcp.*` diterapkan secara hot dengan membuang runtime MCP sesi yang di-cache.
  Penemuan/penggunaan tool berikutnya akan membuat ulang dari config baru, sehingga entri
  `mcp.servers` yang dihapus langsung dibersihkan alih-alih menunggu TTL idle.

Lihat [MCP](/id/cli/mcp#openclaw-as-an-mcp-client-registry) dan
[CLI backends](/id/gateway/cli-backends#bundle-mcp-overlays) untuk perilaku runtime.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // atau string plaintext
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opsional hanya untuk Skills bawaan (Skills terkelola/workspace tidak terpengaruh).
- `load.extraDirs`: root Skills bersama tambahan (prioritas terendah).
- `install.preferBrew`: saat true, utamakan installer Homebrew saat `brew`
  tersedia sebelum fallback ke jenis installer lain.
- `install.nodeManager`: preferensi installer node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` menonaktifkan Skill meskipun dibundel/diinstal.
- `entries.<skillKey>.apiKey`: field kemudahan API key untuk Skills yang mendeklarasikan env var utama (string plaintext atau objek SecretRef).

---

## Plugins

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
- Discovery menerima Plugin OpenClaw native plus bundel Codex dan Claude yang kompatibel, termasuk bundel Claude tata letak default tanpa manifest.
- **Perubahan config memerlukan restart gateway.**
- `allow`: allowlist opsional (hanya Plugin yang terdaftar yang dimuat). `deny` menang.
- `plugins.entries.<id>.apiKey`: field kemudahan API key level Plugin (jika didukung oleh Plugin).
- `plugins.entries.<id>.env`: map env var dengan cakupan Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: saat `false`, core memblokir `before_prompt_build` dan mengabaikan field yang memodifikasi prompt dari `before_agent_start` lama, sambil mempertahankan `modelOverride` dan `providerOverride` lama. Berlaku untuk hook Plugin native dan direktori hook dari bundel yang didukung.
- `plugins.entries.<id>.hooks.allowConversationAccess`: saat `true`, Plugin tepercaya non-bawaan dapat membaca konten percakapan mentah dari hook bertipe seperti `llm_input`, `llm_output`, `before_agent_finalize`, dan `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: secara eksplisit memercayai Plugin ini untuk meminta override `provider` dan `model` per-eksekusi untuk eksekusi subagen latar belakang.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opsional target kanonis `provider/model` untuk override subagen tepercaya. Gunakan `"*"` hanya bila Anda memang ingin mengizinkan model apa pun.
- `plugins.entries.<id>.config`: objek config yang didefinisikan Plugin (divalidasi oleh schema Plugin OpenClaw native bila tersedia).
- Pengaturan akun/runtime Plugin channel berada di bawah `channels.<id>` dan harus dijelaskan oleh metadata `channelConfigs` manifest Plugin pemilik, bukan oleh registry opsi OpenClaw pusat.
- `plugins.entries.firecrawl.config.webFetch`: pengaturan provider web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (menerima SecretRef). Fallback ke `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` lama, atau env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: base URL API Firecrawl (default: `https://api.firecrawl.dev`).
  - `onlyMainContent`: ekstrak hanya konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: timeout permintaan scrape dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan provider X Search.
  - `model`: model Grok yang digunakan untuk pencarian (misalnya `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan dreaming memori. Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan ambang batas.
  - `enabled`: sakelar utama dreaming (default `false`).
  - `frequency`: cadence Cron untuk setiap sapuan dreaming penuh (default `"0 3 * * *"`).
  - kebijakan fase dan ambang batas adalah detail implementasi (bukan key config yang ditujukan ke pengguna).
- Config memori lengkap ada di [Referensi config memori](/id/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundel Claude yang aktif juga dapat menyumbangkan default Pi tertanam dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agen yang telah disanitasi, bukan sebagai patch config OpenClaw mentah.
- `plugins.slots.memory`: pilih id Plugin memori aktif, atau `"none"` untuk menonaktifkan Plugin memori.
- `plugins.slots.contextEngine`: pilih id Plugin mesin konteks aktif; default ke `"legacy"` kecuali Anda memasang dan memilih mesin lain.

Lihat [Plugins](/id/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // ikut gunakan hanya untuk akses private-network tepercaya
      // allowPrivateNetwork: true, // alias lama
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
- `tabCleanup` mereklamasi tab agen utama yang dilacak setelah waktu idle atau saat sebuah
  sesi melebihi batasnya. Atur `idleMinutes: 0` atau `maxTabsPerSession: 0` untuk
  menonaktifkan mode pembersihan individual tersebut.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan saat tidak diatur, sehingga navigasi browser tetap ketat secara default.
- Atur `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` hanya saat Anda memang memercayai navigasi browser ke private-network.
- Dalam mode ketat, endpoint profil CDP remote (`profiles.*.cdpUrl`) tunduk pada pemblokiran private-network yang sama selama pemeriksaan keterjangkauan/discovery.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil remote bersifat attach-only (start/stop/reset dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) saat Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  saat provider Anda memberi URL WebSocket DevTools langsung.
- `remoteCdpTimeoutMs` dan `remoteCdpHandshakeTimeoutMs` berlaku untuk keterjangkauan CDP remote dan
  `attachOnly` serta permintaan pembukaan tab. Profil loopback terkelola
  mempertahankan default CDP lokal.
- Jika layanan CDP yang dikelola eksternal dapat dijangkau melalui loopback, atur
  `attachOnly: true` pada profil tersebut; jika tidak, OpenClaw memperlakukan port loopback itu sebagai
  profil browser lokal terkelola dan dapat melaporkan error kepemilikan port lokal.
- Profil `existing-session` menggunakan Chrome MCP alih-alih CDP dan dapat attach pada
  host yang dipilih atau melalui browser Node yang terhubung.
- Profil `existing-session` dapat menetapkan `userDataDir` untuk menargetkan profil
  browser berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` mempertahankan batas rute Chrome MCP saat ini:
  aksi berbasis snapshot/ref alih-alih penargetan selector CSS, hook upload satu file,
  tanpa override timeout dialog, tanpa `wait --load networkidle`, dan tanpa
  `responsebody`, ekspor PDF, intersepsi unduhan, atau aksi batch.
- Profil `openclaw` lokal terkelola otomatis menetapkan `cdpPort` dan `cdpUrl`; atur
  `cdpUrl` secara eksplisit hanya untuk CDP remote.
- Profil lokal terkelola dapat menetapkan `executablePath` untuk menimpa
  `browser.executablePath` global untuk profil tersebut. Gunakan ini untuk menjalankan satu profil di
  Chrome dan profil lain di Brave.
- Profil lokal terkelola menggunakan `browser.localLaunchTimeoutMs` untuk discovery HTTP Chrome CDP lokal
  setelah proses dimulai dan `browser.localCdpReadyTimeoutMs` untuk
  kesiapan websocket CDP pasca-peluncuran. Naikkan nilainya pada host yang lebih lambat saat Chrome
  berhasil start tetapi pemeriksaan kesiapan mendahului startup. Kedua nilai harus berupa
  bilangan bulat positif hingga `120000` ms; nilai config yang tidak valid ditolak.
- Urutan deteksi otomatis: browser default jika berbasis Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` dan `browser.profiles.<name>.executablePath` keduanya
  menerima `~` dan `~/...` untuk direktori home OS Anda sebelum peluncuran Chromium.
  `userDataDir` per profil pada profil `existing-session` juga diperluas dari tilde.
- Service Control: hanya loopback (port diturunkan dari `gateway.port`, default `18791`).
- `extraArgs` menambahkan flag peluncuran ekstra ke startup Chromium lokal (misalnya
  `--disable-gpu`, pengaturan ukuran jendela, atau flag debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, teks singkat, URL gambar, atau URI data
    },
  },
}
```

- `seamColor`: warna aksen untuk chrome UI aplikasi native (tint bubble mode Talk, dll.).
- `assistant`: override identitas Control UI. Fallback ke identitas agen aktif.

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
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // berbahaya: izinkan URL embed http(s) eksternal absolut
      // allowedOrigins: ["https://control.example.com"], // wajib untuk Control UI non-loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // mode fallback origin Host-header yang berbahaya
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
    // Opsional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Opsional. Default tidak diatur/dinonaktifkan.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Penolakan HTTP /tools/invoke tambahan
      deny: ["browser"],
      // Hapus tools dari daftar penolakan HTTP default
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

<Accordion title="Detail field Gateway">

- `mode`: `local` (jalankan gateway) atau `remote` (terhubung ke gateway remote). Gateway menolak start kecuali `local`.
- `port`: satu port termultipleks untuk WS + HTTP. Prioritas: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (default), `lan` (`0.0.0.0`), `tailnet` (hanya IP Tailscale), atau `custom`.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind `loopback` default mendengarkan pada `127.0.0.1` di dalam container. Dengan networking bridge Docker (`-p 18789:18789`), lalu lintas datang ke `eth0`, sehingga gateway tidak dapat dijangkau. Gunakan `--network host`, atau atur `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) agar mendengarkan di semua interface.
- **Auth**: wajib secara default. Bind non-loopback memerlukan auth gateway. Dalam praktiknya itu berarti token/password bersama atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wizard onboarding menghasilkan token secara default.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi (termasuk SecretRef), atur `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Alur startup dan install/perbaikan service gagal saat keduanya dikonfigurasi dan mode tidak diatur.
- `gateway.auth.mode: "none"`: mode tanpa auth yang eksplisit. Gunakan hanya untuk penyiapan loopback lokal yang tepercaya; ini sengaja tidak ditawarkan oleh prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan auth ke reverse proxy yang sadar identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)). Mode ini mengharapkan sumber proxy **non-loopback**; reverse proxy loopback pada host yang sama tidak memenuhi auth trusted-proxy.
- `gateway.auth.allowTailscale`: saat `true`, header identitas Tailscale Serve dapat memenuhi auth Control UI/WebSocket (diverifikasi melalui `tailscale whois`). Endpoint HTTP API **tidak** menggunakan auth header Tailscale itu; endpoint tersebut mengikuti mode auth HTTP normal gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Default ke `true` saat `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limiter kegagalan auth opsional. Berlaku per IP klien dan per scope auth (shared-secret dan device-token dilacak secara independen). Percobaan yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada jalur Control UI Tailscale Serve async, percobaan gagal untuk `{scope, clientIp}` yang sama diserialkan sebelum penulisan kegagalan. Karena itu, percobaan buruk bersamaan dari klien yang sama dapat memicu limiter pada permintaan kedua alih-alih keduanya lolos sebagai mismatch biasa.
  - `gateway.auth.rateLimit.exemptLoopback` default-nya `true`; atur ke `false` saat Anda memang ingin lalu lintas localhost juga dibatasi (untuk penyiapan pengujian atau deployment proxy yang ketat).
- Percobaan auth WS dari origin browser selalu di-throttle dengan pengecualian loopback dinonaktifkan (defense-in-depth terhadap brute force localhost berbasis browser).
- Pada loopback, lockout dari origin browser tersebut diisolasi per nilai `Origin`
  yang dinormalisasi, sehingga kegagalan berulang dari satu origin localhost tidak otomatis
  mengunci origin lain.
- `tailscale.mode`: `serve` (hanya tailnet, bind loopback) atau `funnel` (publik, memerlukan auth).
- `controlUi.allowedOrigins`: allowlist origin browser eksplisit untuk koneksi Gateway WebSocket. Wajib saat klien browser diharapkan berasal dari origin non-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan fallback origin Host-header untuk deployment yang memang mengandalkan kebijakan origin Host-header.
- `remote.transport`: `ssh` (default) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus berupa `ws://` atau `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override darurat environment proses sisi klien
  yang mengizinkan `ws://` plaintext ke IP private-network tepercaya; default tetap hanya loopback untuk plaintext. Tidak ada padanan `openclaw.json`,
  dan config private-network browser seperti
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tidak memengaruhi klien Gateway
  WebSocket.
- `gateway.remote.token` / `.password` adalah field kredensial klien remote. Keduanya tidak mengonfigurasi auth gateway dengan sendirinya.
- `gateway.push.apns.relay.baseUrl`: base URL HTTPS untuk relay APNs eksternal yang digunakan oleh build iOS resmi/TestFlight setelah mereka memublikasikan registrasi berbasis relay ke gateway. URL ini harus cocok dengan URL relay yang dikompilasi ke dalam build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout pengiriman gateway-ke-relay dalam milidetik. Default ke `10000`.
- Registrasi berbasis relay didelegasikan ke identitas gateway tertentu. Aplikasi iOS yang sudah di-pairing mengambil `gateway.identity.get`, menyertakan identitas itu dalam registrasi relay, dan meneruskan grant kirim dengan cakupan registrasi ke gateway. Gateway lain tidak dapat menggunakan ulang registrasi tersimpan itu.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env sementara untuk config relay di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch khusus pengembangan untuk URL relay HTTP loopback. URL relay produksi harus tetap memakai HTTPS.
- `gateway.channelHealthCheckMinutes`: interval monitor kesehatan channel dalam menit. Atur `0` untuk menonaktifkan restart health-monitor secara global. Default: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ambang socket basi dalam menit. Pertahankan ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`. Default: `30`.
- `gateway.channelMaxRestartsPerHour`: jumlah maksimum restart health-monitor per channel/akun dalam satu jam bergulir. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per channel untuk restart health-monitor sambil tetap mengaktifkan monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per akun untuk channel multi-akun. Jika diatur, ini memiliki prioritas atas override level channel.
- Jalur pemanggilan gateway lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak diatur.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak dapat di-resolve, resolusi gagal secara tertutup (tanpa fallback remote yang menyamarkan).
- `trustedProxies`: IP reverse proxy yang mengakhiri TLS atau menyisipkan header klien-terusan. Hanya cantumkan proxy yang Anda kendalikan. Entri loopback tetap valid untuk penyiapan proxy pada host yang sama/deteksi lokal (misalnya Tailscale Serve atau reverse proxy lokal), tetapi **tidak** membuat permintaan loopback memenuhi syarat untuk `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: saat `true`, gateway menerima `X-Real-IP` jika `X-Forwarded-For` tidak ada. Default `false` untuk perilaku gagal-tertutup.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP opsional untuk auto-approve pairing device Node pertama kali tanpa scope yang diminta. Dinonaktifkan saat tidak diatur. Ini tidak meng-auto-approve pairing operator/browser/Control UI/WebChat, dan tidak meng-auto-approve upgrade role, scope, metadata, atau public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pembentukan allow/deny global untuk perintah Node yang dideklarasikan setelah pairing dan evaluasi allowlist.
- `gateway.tools.deny`: nama tool tambahan yang diblokir untuk HTTP `POST /tools/invoke` (memperluas daftar deny default).
- `gateway.tools.allow`: hapus nama tool dari daftar deny HTTP default.

</Accordion>

### Endpoint yang kompatibel dengan OpenAI

- Chat Completions: dinonaktifkan secara default. Aktifkan dengan `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening input URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlist kosong diperlakukan sebagai tidak diatur; gunakan `gateway.http.endpoints.responses.files.allowUrl=false`
    dan/atau `gateway.http.endpoints.responses.images.allowUrl=false` untuk menonaktifkan pengambilan URL.
- Header hardening respons opsional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (atur hanya untuk origin HTTPS yang Anda kendalikan; lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolasi multi-instance

Jalankan beberapa gateway pada satu host dengan port dan direktori status yang unik:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag kemudahan: `--dev` (menggunakan `~/.openclaw-dev` + port `19001`), `--profile <name>` (menggunakan `~/.openclaw-<name>`).

Lihat [Multiple Gateways](/id/gateway/multiple-gateways).

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
- `autoGenerate`: membuat pasangan cert/key self-signed lokal secara otomatis saat file eksplisit tidak dikonfigurasi; hanya untuk penggunaan lokal/dev.
- `certPath`: path filesystem ke file sertifikat TLS.
- `keyPath`: path filesystem ke file private key TLS; pertahankan izin akses yang dibatasi.
- `caPath`: path bundle CA opsional untuk verifikasi klien atau rantai trust kustom.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: mengontrol bagaimana edit config diterapkan saat runtime.
  - `"off"`: abaikan edit live; perubahan memerlukan restart eksplisit.
  - `"restart"`: selalu restart proses gateway saat config berubah.
  - `"hot"`: terapkan perubahan in-process tanpa restart.
  - `"hybrid"` (default): coba hot reload terlebih dahulu; fallback ke restart jika diperlukan.
- `debounceMs`: jendela debounce dalam ms sebelum perubahan config diterapkan (bilangan bulat non-negatif).
- `deferralTimeoutMs`: waktu maksimum opsional dalam ms untuk menunggu operasi yang masih berjalan sebelum memaksa restart. Hilangkan atau atur `0` untuk menunggu tanpa batas dan mencatat peringatan berkala yang masih tertunda.

---

## Hooks

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
- `hooks.token` harus **berbeda** dari `gateway.auth.token`; penggunaan ulang token Gateway ditolak.
- `hooks.path` tidak boleh `/`; gunakan subpath khusus seperti `/hooks`.
- Jika `hooks.allowRequestSessionKey=true`, batasi `hooks.allowedSessionKeyPrefixes` (misalnya `["hook:"]`).
- Jika mapping atau preset menggunakan `sessionKey` bertemplate, atur `hooks.allowedSessionKeyPrefixes` dan `hooks.allowRequestSessionKey=true`. Key mapping statis tidak memerlukan opt-in tersebut.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dari payload permintaan hanya diterima saat `hooks.allowRequestSessionKey=true` (default: `false`).
- `POST /hooks/<name>` → diselesaikan melalui `hooks.mappings`
  - Nilai `sessionKey` mapping yang dirender dari template diperlakukan sebagai disuplai secara eksternal dan juga memerlukan `hooks.allowRequestSessionKey=true`.

<Accordion title="Detail mapping">

- `match.path` mencocokkan subpath setelah `/hooks` (misalnya `/hooks/gmail` → `gmail`).
- `match.source` mencocokkan field payload untuk path generik.
- Template seperti `{{messages[0].subject}}` membaca dari payload.
- `transform` dapat menunjuk ke modul JS/TS yang mengembalikan aksi hook.
  - `transform.module` harus berupa path relatif dan tetap berada di dalam `hooks.transformsDir` (path absolut dan traversal ditolak).
- `agentId` merutekan ke agen tertentu; ID yang tidak dikenal akan fallback ke default.
- `allowedAgentIds`: membatasi routing eksplisit (`*` atau dihilangkan = izinkan semua, `[]` = tolak semua).
- `defaultSessionKey`: session key tetap opsional untuk eksekusi agen hook tanpa `sessionKey` eksplisit.
- `allowRequestSessionKey`: izinkan pemanggil `/hooks/agent` dan session key mapping berbasis template untuk menetapkan `sessionKey` (default: `false`).
- `allowedSessionKeyPrefixes`: allowlist prefix opsional untuk nilai `sessionKey` eksplisit (permintaan + mapping), misalnya `["hook:"]`. Ini menjadi wajib saat mapping atau preset apa pun menggunakan `sessionKey` bertemplate.
- `deliver: true` mengirim balasan akhir ke channel; `channel` default ke `last`.
- `model` menimpa LLM untuk eksekusi hook ini (harus diizinkan jika katalog model diatur).

</Accordion>

### Integrasi Gmail

- Preset Gmail bawaan menggunakan `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jika Anda mempertahankan routing per-pesan tersebut, atur `hooks.allowRequestSessionKey: true` dan batasi `hooks.allowedSessionKeyPrefixes` agar cocok dengan namespace Gmail, misalnya `["hook:", "hook:gmail:"]`.
- Jika Anda memerlukan `hooks.allowRequestSessionKey: false`, timpa preset dengan `sessionKey` statis alih-alih default bertemplate.

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
- Jangan menjalankan `gog gmail watch serve` terpisah bersamaan dengan Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // atau OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Menyajikan HTML/CSS/JS yang dapat diedit agen dan A2UI melalui HTTP di bawah port Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Hanya lokal: pertahankan `gateway.bind: "loopback"` (default).
- Bind non-loopback: rute canvas memerlukan auth Gateway (token/password/trusted-proxy), sama seperti surface HTTP Gateway lainnya.
- WebView Node biasanya tidak mengirim header auth; setelah sebuah Node di-pairing dan terhubung, Gateway mengiklankan URL kapabilitas dengan cakupan Node untuk akses canvas/A2UI.
- URL kapabilitas terikat ke sesi WS Node yang aktif dan cepat kedaluwarsa. Fallback berbasis IP tidak digunakan.
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

- `minimal` (default): hilangkan `cliPath` + `sshPort` dari record TXT.
- `full`: sertakan `cliPath` + `sshPort`.
- Hostname default ke `openclaw`. Timpa dengan `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Menulis zona DNS-SD unicast di bawah `~/.openclaw/dns/`. Untuk discovery lintas jaringan, padukan dengan server DNS (CoreDNS disarankan) + split DNS Tailscale.

Penyiapan: `openclaw dns setup --apply`.

---

## Environment

### `env` (env var inline)

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
- `shellEnv`: mengimpor key yang diharapkan namun belum ada dari profil shell login Anda.
- Lihat [Environment](/id/help/environment) untuk prioritas lengkap.

### Substitusi env var

Rujuk env var dalam string config apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Hanya nama huruf besar yang dicocokkan: `[A-Z_][A-Z0-9_]*`.
- Var yang hilang/kosong memunculkan error saat pemuatan config.
- Escape dengan `$${VAR}` untuk literal `${VAR}`.
- Bekerja dengan `$include`.

---

## Secrets

Ref secret bersifat aditif: nilai plaintext tetap berfungsi.

### `SecretRef`

Gunakan satu bentuk objek:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validasi:

- Pola `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Pola id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: pointer JSON absolut (misalnya `"/providers/openai/apiKey"`)
- Pola id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id `source: "exec"` tidak boleh mengandung segmen path `.` atau `..` yang dipisahkan slash (misalnya `a/../b` ditolak)

### Surface kredensial yang didukung

- Matriks kanonis: [SecretRef Credential Surface](/id/reference/secretref-credential-surface)
- Target `secrets apply` mendukung path kredensial `openclaw.json` yang didukung.
- Ref `auth-profiles.json` disertakan dalam cakupan resolusi runtime dan audit.

### Config provider secret

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // provider env eksplisit opsional
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

- Provider `file` mendukung `mode: "json"` dan `mode: "singleValue"` (`id` harus `"value"` dalam mode singleValue).
- Path provider file dan exec gagal secara tertutup saat verifikasi ACL Windows tidak tersedia. Atur `allowInsecurePath: true` hanya untuk path tepercaya yang tidak dapat diverifikasi.
- Provider `exec` memerlukan path `command` absolut dan menggunakan payload protokol pada stdin/stdout.
- Secara default, path perintah symlink ditolak. Atur `allowSymlinkCommand: true` untuk mengizinkan path symlink sambil memvalidasi path target yang telah di-resolve.
- Jika `trustedDirs` dikonfigurasi, pemeriksaan direktori tepercaya berlaku pada path target yang telah di-resolve.
- Environment child `exec` minimal secara default; teruskan variabel yang diperlukan secara eksplisit dengan `passEnv`.
- Ref secret di-resolve pada waktu aktivasi ke dalam snapshot in-memory, lalu path permintaan hanya membaca snapshot tersebut.
- Pemfilteran surface aktif berlaku selama aktivasi: ref yang tidak dapat di-resolve pada surface aktif menyebabkan startup/reload gagal, sementara surface tidak aktif dilewati dengan diagnostik.

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
- `auth-profiles.json` mendukung ref level nilai (`keyRef` untuk `api_key`, `tokenRef` untuk `token`) untuk mode kredensial statis.
- Profil mode OAuth (`auth.profiles.<id>.mode = "oauth"`) tidak mendukung kredensial profil auth yang didukung SecretRef.
- Kredensial runtime statis berasal dari snapshot hasil resolusi in-memory; entri `auth.json` statis lama dibersihkan saat ditemukan.
- Impor OAuth lama dari `~/.openclaw/credentials/oauth.json`.
- Lihat [OAuth](/id/concepts/oauth).
- Perilaku runtime Secrets dan tooling `audit/configure/apply`: [Manajemen Secrets](/id/gateway/secrets).

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

- `billingBackoffHours`: backoff dasar dalam jam saat profil gagal karena error
  billing/kredit tidak cukup yang benar (default: `5`). Teks billing eksplisit
  tetap bisa masuk ke sini bahkan pada respons `401`/`403`, tetapi pencocok teks
  khusus provider tetap dibatasi pada provider pemiliknya (misalnya OpenRouter
  `Key limit exceeded`). Pesan penggunaan-window HTTP `402` yang dapat dicoba ulang atau
  batas pengeluaran organisasi/workspace tetap berada di jalur `rate_limit`
  sebagai gantinya.
- `billingBackoffHoursByProvider`: override per-provider opsional untuk jam backoff billing.
- `billingMaxHours`: batas dalam jam untuk pertumbuhan eksponensial backoff billing (default: `24`).
- `authPermanentBackoffMinutes`: backoff dasar dalam menit untuk kegagalan `auth_permanent` dengan keyakinan tinggi (default: `10`).
- `authPermanentMaxMinutes`: batas dalam menit untuk pertumbuhan backoff `auth_permanent` (default: `60`).
- `failureWindowHours`: jendela bergulir dalam jam yang digunakan untuk penghitung backoff (default: `24`).
- `overloadedProfileRotations`: jumlah maksimum rotasi auth-profile provider yang sama untuk error overload sebelum beralih ke fallback model (default: `1`). Bentuk provider-sibuk seperti `ModelNotReadyException` masuk ke sini.
- `overloadedBackoffMs`: jeda tetap sebelum mencoba ulang rotasi provider/profil yang overload (default: `0`).
- `rateLimitedProfileRotations`: jumlah maksimum rotasi auth-profile provider yang sama untuk error batas laju sebelum beralih ke fallback model (default: `1`). Bucket rate-limit tersebut mencakup teks berbentuk provider seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, dan `resource exhausted`.

---

## Logging

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
- `consoleLevel` dinaikkan ke `debug` saat `--verbose`.
- `maxFileBytes`: ukuran file log aktif maksimum dalam byte sebelum rotasi (bilangan bulat positif; default: `104857600` = 100 MB). OpenClaw menyimpan hingga lima arsip bernomor di samping file aktif.

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

- `enabled`: sakelar utama untuk output instrumentasi (default: `true`).
- `flags`: array string flag yang mengaktifkan output log terarah (mendukung wildcard seperti `"telegram.*"` atau `"*"`).
- `stuckSessionWarnMs`: ambang usia dalam ms untuk mengeluarkan peringatan sesi macet saat sebuah sesi tetap berada dalam status pemrosesan.
- `otel.enabled`: mengaktifkan pipeline ekspor OpenTelemetry (default: `false`). Untuk konfigurasi lengkap, katalog sinyal, dan model privasi, lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
- `otel.endpoint`: URL collector untuk ekspor OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP opsional khusus sinyal. Saat diatur, endpoint ini menimpa `otel.endpoint` hanya untuk sinyal terkait.
- `otel.protocol`: `"http/protobuf"` (default) atau `"grpc"`.
- `otel.headers`: header metadata HTTP/gRPC tambahan yang dikirim bersama permintaan ekspor OTel.
- `otel.serviceName`: nama service untuk atribut resource.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktifkan ekspor trace, metrik, atau log.
- `otel.sampleRate`: tingkat sampling trace `0`–`1`.
- `otel.flushIntervalMs`: interval flush telemetri berkala dalam ms.
- `otel.captureContent`: ikut gunakan penangkapan konten mentah untuk atribut span OTEL. Default-nya nonaktif. Nilai boolean `true` menangkap konten pesan/tool non-system; bentuk objek memungkinkan Anda secara eksplisit mengaktifkan `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, dan `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: toggle environment untuk atribut provider span GenAI eksperimental terbaru. Secara default span mempertahankan atribut lama `gen_ai.system` demi kompatibilitas; metrik GenAI menggunakan atribut semantik yang dibatasi.
- `OPENCLAW_OTEL_PRELOADED=1`: toggle environment untuk host yang sudah mendaftarkan SDK OpenTelemetry global. OpenClaw kemudian melewati startup/shutdown SDK milik Plugin sambil tetap menjaga listener diagnostik tetap aktif.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, dan `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env var endpoint khusus sinyal yang digunakan saat key config yang sesuai tidak diatur.
- `cacheTrace.enabled`: catat snapshot jejak cache untuk eksekusi tertanam (default: `false`).
- `cacheTrace.filePath`: path output untuk cache trace JSONL (default: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: mengontrol apa saja yang disertakan dalam output cache trace (semuanya default: `true`).

---

## Update

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

- `channel`: channel rilis untuk instalasi npm/git — `"stable"`, `"beta"`, atau `"dev"`.
- `checkOnStart`: periksa pembaruan npm saat gateway mulai (default: `true`).
- `auto.enabled`: aktifkan auto-update latar belakang untuk instalasi package (default: `false`).
- `auto.stableDelayHours`: penundaan minimum dalam jam sebelum penerapan otomatis channel stabil (default: `6`; maks: `168`).
- `auto.stableJitterHours`: jendela penyebaran rollout channel stabil tambahan dalam jam (default: `12`; maks: `168`).
- `auto.betaCheckIntervalHours`: seberapa sering pemeriksaan channel beta dijalankan dalam jam (default: `1`; maks: `24`).

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

- `enabled`: gerbang fitur ACP global (default: `true`; atur `false` untuk menyembunyikan affordance dispatch dan spawn ACP).
- `dispatch.enabled`: gerbang independen untuk dispatch giliran sesi ACP (default: `true`). Atur `false` agar perintah ACP tetap tersedia sambil memblokir eksekusi.
- `backend`: id backend runtime ACP default (harus cocok dengan Plugin runtime ACP yang terdaftar).
  Jika `plugins.allow` diatur, sertakan id Plugin backend (misalnya `acpx`) atau Plugin default bawaan tidak akan dimuat.
- `defaultAgent`: id agen target ACP fallback saat spawn tidak menentukan target eksplisit.
- `allowedAgents`: allowlist id agen yang diizinkan untuk sesi runtime ACP; kosong berarti tidak ada pembatasan tambahan.
- `maxConcurrentSessions`: jumlah maksimum sesi ACP aktif secara bersamaan.
- `stream.coalesceIdleMs`: jendela flush idle dalam ms untuk teks yang di-stream.
- `stream.maxChunkChars`: ukuran chunk maksimum sebelum memecah proyeksi blok yang di-stream.
- `stream.repeatSuppression`: tekan baris status/tool yang berulang per giliran (default: `true`).
- `stream.deliveryMode`: `"live"` mengalirkan secara inkremental; `"final_only"` men-buffer hingga peristiwa terminal giliran.
- `stream.hiddenBoundarySeparator`: pemisah sebelum teks terlihat setelah peristiwa tool tersembunyi (default: `"paragraph"`).
- `stream.maxOutputChars`: jumlah karakter output asisten maksimum yang diproyeksikan per giliran ACP.
- `stream.maxSessionUpdateChars`: jumlah karakter maksimum untuk baris status/pembaruan ACP yang diproyeksikan.
- `stream.tagVisibility`: rekaman nama tag ke override visibilitas boolean untuk peristiwa yang di-stream.
- `runtime.ttlMinutes`: TTL idle dalam menit untuk worker sesi ACP sebelum layak dibersihkan.
- `runtime.installCommand`: perintah instalasi opsional untuk dijalankan saat melakukan bootstrap environment runtime ACP.

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

Metadata yang ditulis oleh alur guided setup CLI (`onboard`, `configure`, `doctor`):

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

## Bridge (lama, dihapus)

Build saat ini tidak lagi menyertakan bridge TCP. Node terhubung melalui Gateway WebSocket. Key `bridge.*` bukan lagi bagian dari schema config (validasi gagal sampai dihapus; `openclaw doctor --fix` dapat menghapus key yang tidak dikenal).

<Accordion title="Config bridge lama (referensi historis)">

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
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback usang untuk job tersimpan notify:true
    webhookToken: "replace-with-dedicated-token", // bearer token opsional untuk auth Webhook outbound
    sessionRetention: "24h", // string durasi atau false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 byte
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: berapa lama menyimpan sesi eksekusi cron terisolasi yang telah selesai sebelum dipangkas dari `sessions.json`. Juga mengontrol pembersihan transcript cron terhapus yang diarsipkan. Default: `24h`; atur `false` untuk menonaktifkan.
- `runLog.maxBytes`: ukuran maksimum per file log eksekusi (`cron/runs/<jobId>.jsonl`) sebelum dipangkas. Default: `2_000_000` byte.
- `runLog.keepLines`: baris terbaru yang dipertahankan saat pemangkasan run-log dipicu. Default: `2000`.
- `webhookToken`: bearer token yang digunakan untuk pengiriman POST Webhook cron (`delivery.mode = "webhook"`), jika dihilangkan tidak ada header auth yang dikirim.
- `webhook`: URL Webhook fallback lama yang sudah usang (http/https) yang hanya digunakan untuk job tersimpan yang masih memiliki `notify: true`.

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

- `maxAttempts`: jumlah maksimum percobaan ulang untuk job sekali jalan pada error sementara (default: `3`; rentang: `0`–`10`).
- `backoffMs`: array penundaan backoff dalam ms untuk setiap percobaan ulang (default: `[30000, 60000, 300000]`; 1–10 entri).
- `retryOn`: jenis error yang memicu percobaan ulang — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Hilangkan untuk mencoba ulang semua jenis sementara.

Hanya berlaku untuk job cron sekali jalan. Job berulang menggunakan penanganan kegagalan terpisah.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: aktifkan alert kegagalan untuk job cron (default: `false`).
- `after`: jumlah kegagalan berturut-turut sebelum alert dipicu (bilangan bulat positif, min: `1`).
- `cooldownMs`: milidetik minimum di antara alert berulang untuk job yang sama (bilangan bulat non-negatif).
- `mode`: mode pengiriman — `"announce"` mengirim melalui pesan channel; `"webhook"` mem-post ke Webhook yang dikonfigurasi.
- `accountId`: id akun atau channel opsional untuk membatasi pengiriman alert.

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
- `mode`: `"announce"` atau `"webhook"`; default ke `"announce"` bila data target yang cukup tersedia.
- `channel`: override channel untuk pengiriman announce. `"last"` menggunakan ulang channel pengiriman terakhir yang diketahui.
- `to`: target announce eksplisit atau URL Webhook. Wajib untuk mode Webhook.
- `accountId`: override akun opsional untuk pengiriman.
- `delivery.failureDestination` per-job menimpa default global ini.
- Saat tujuan kegagalan global maupun per-job tidak diatur, job yang sudah mengirim melalui `announce` akan fallback ke target announce utama itu saat gagal.
- `delivery.failureDestination` hanya didukung untuk job `sessionTarget="isolated"` kecuali `delivery.mode` utama job adalah `"webhook"`.

Lihat [Cron Jobs](/id/automation/cron-jobs). Eksekusi cron terisolasi dilacak sebagai [background tasks](/id/automation/tasks).

---

## Variabel template model media

Placeholder template yang diperluas dalam `tools.media.models[].args`:

| Variabel           | Deskripsi                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Isi penuh pesan masuk                             |
| `{{RawBody}}`      | Isi mentah (tanpa wrapper riwayat/pengirim)       |
| `{{BodyStripped}}` | Isi dengan mention grup dihapus                   |
| `{{From}}`         | Pengenal pengirim                                 |
| `{{To}}`           | Pengenal tujuan                                   |
| `{{MessageSid}}`   | id pesan channel                                  |
| `{{SessionId}}`    | UUID sesi saat ini                                |
| `{{IsNewSession}}` | `"true"` saat sesi baru dibuat                    |
| `{{MediaUrl}}`     | pseudo-URL media masuk                            |
| `{{MediaPath}}`    | path media lokal                                  |
| `{{MediaType}}`    | jenis media (gambar/audio/dokumen/…)              |
| `{{Transcript}}`   | transkrip audio                                   |
| `{{Prompt}}`       | prompt media yang telah di-resolve untuk entri CLI |
| `{{MaxChars}}`     | jumlah karakter output maksimum yang telah di-resolve untuk entri CLI |
| `{{ChatType}}`     | `"direct"` atau `"group"`                         |
| `{{GroupSubject}}` | subjek grup (best effort)                         |
| `{{GroupMembers}}` | pratinjau anggota grup (best effort)              |
| `{{SenderName}}`   | nama tampilan pengirim (best effort)              |
| `{{SenderE164}}`   | nomor telepon pengirim (best effort)              |
| `{{Provider}}`     | petunjuk provider (whatsapp, telegram, discord, dll.) |

---

## Config includes (`$include`)

Pisahkan config ke beberapa file:

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

- Satu file: menggantikan objek yang menampungnya.
- Array file: di-deep-merge berurutan (yang lebih akhir menimpa yang lebih awal).
- Key saudara: di-merge setelah include (menimpa nilai yang di-include).
- Include bertingkat: hingga kedalaman 10 level.
- Path: di-resolve relatif ke file yang meng-include, tetapi harus tetap berada di dalam direktori config tingkat atas (`dirname` dari `openclaw.json`). Bentuk absolut/`../` hanya diizinkan jika tetap di-resolve di dalam batas tersebut.
- Penulisan milik OpenClaw yang hanya mengubah satu bagian tingkat atas yang didukung oleh include satu file akan menulis langsung ke file include tersebut. Misalnya, `plugins install` memperbarui `plugins: { $include: "./plugins.json5" }` di `plugins.json5` dan membiarkan `openclaw.json` tetap utuh.
- Include root, array include, dan include dengan override saudara bersifat read-only untuk penulisan milik OpenClaw; penulisan tersebut gagal secara tertutup alih-alih meratakan config.
- Error: pesan yang jelas untuk file yang hilang, error parse, dan include melingkar.

---

_Terkait: [Configuration](/id/gateway/configuration) · [Contoh config](/id/gateway/configuration-examples) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Configuration](/id/gateway/configuration)
- [Contoh config](/id/gateway/configuration-examples)
