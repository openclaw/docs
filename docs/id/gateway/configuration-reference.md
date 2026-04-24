---
read_when:
    - Anda memerlukan semantik atau default konfigurasi yang tepat di tingkat field
    - Anda sedang memvalidasi blok konfigurasi channel, model, Gateway, atau tool
summary: Referensi konfigurasi Gateway untuk kunci inti OpenClaw, default, dan tautan ke referensi subsistem khusus
title: Referensi konfigurasi
x-i18n:
    generated_at: "2026-04-24T09:07:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc0d9feea2f2707f267d50ec83aa664ef503db8f9132762345cc80305f8bef73
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Referensi konfigurasi inti untuk `~/.openclaw/openclaw.json`. Untuk ikhtisar berbasis tugas, lihat [Konfigurasi](/id/gateway/configuration).

Halaman ini mencakup permukaan konfigurasi utama OpenClaw dan menautkan ke luar ketika sebuah subsistem memiliki referensi mendalamnya sendiri. Halaman ini **tidak** mencoba menyisipkan setiap katalog perintah milik channel/Plugin atau setiap knob memori/QMD mendalam ke dalam satu halaman.

Sumber kebenaran kode:

- `openclaw config schema` mencetak JSON Schema live yang digunakan untuk validasi dan UI Control, dengan metadata bundled/Plugin/channel digabungkan bila tersedia
- `config.schema.lookup` mengembalikan satu node skema bercakupan path untuk tool drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` memvalidasi hash baseline dokumen konfigurasi terhadap permukaan skema saat ini

Referensi mendalam khusus:

- [Referensi konfigurasi Memory](/id/reference/memory-config) untuk `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, dan konfigurasi Dreaming di bawah `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/id/tools/slash-commands) untuk katalog perintah built-in + bundled saat ini
- halaman channel/Plugin pemilik untuk permukaan perintah khusus channel

Format konfigurasi adalah **JSON5** (komentar + trailing comma diperbolehkan). Semua field bersifat opsional — OpenClaw menggunakan default aman saat field dihilangkan.

---

## Channels

Kunci konfigurasi per channel dipindahkan ke halaman khusus — lihat
[Konfigurasi — channels](/id/gateway/config-channels) untuk `channels.*`,
termasuk Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, dan channel
bundled lainnya (auth, kontrol akses, multi-akun, pembatasan mention).

## Default agen, multi-agen, sesi, dan pesan

Dipindahkan ke halaman khusus — lihat
[Konfigurasi — agen](/id/gateway/config-agents) untuk:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, memori, media, Skills, sandbox)
- `multiAgent.*` (routing multi-agen dan binding)
- `session.*` (siklus hidup sesi, Compaction, pemangkasan)
- `messages.*` (pengiriman pesan, TTS, rendering markdown)
- `talk.*` (mode Talk)
  - `talk.silenceTimeoutMs`: saat tidak disetel, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms di macOS dan Android, 900 ms di iOS`)

## Tools dan provider kustom

Kebijakan tool, toggle eksperimental, konfigurasi tool berbasis provider, dan
penyiapan provider kustom / base-URL dipindahkan ke halaman khusus — lihat
[Konfigurasi — tools dan provider kustom](/id/gateway/config-tools).

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

- `allowBundled`: allowlist opsional hanya untuk Skills bundled (Skills managed/workspace tidak terpengaruh).
- `load.extraDirs`: root skill bersama tambahan (prioritas terendah).
- `install.preferBrew`: saat true, utamakan installer Homebrew ketika `brew`
  tersedia sebelum kembali ke jenis installer lain.
- `install.nodeManager`: preferensi installer node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` menonaktifkan sebuah skill meskipun bundled/terinstal.
- `entries.<skillKey>.apiKey`: field kenyamanan untuk skill yang mendeklarasikan env var utama (string plaintext atau objek SecretRef).

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
- Discovery menerima Plugin OpenClaw native plus bundle Codex dan bundle Claude yang kompatibel, termasuk bundle Claude tata letak default tanpa manifest.
- **Perubahan konfigurasi memerlukan restart Gateway.**
- `allow`: allowlist opsional (hanya Plugin yang tercantum yang dimuat). `deny` menang.
- `plugins.entries.<id>.apiKey`: field kenyamanan API key tingkat Plugin (bila didukung oleh Plugin).
- `plugins.entries.<id>.env`: peta env var bercakupan Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: saat `false`, inti memblokir `before_prompt_build` dan mengabaikan field legacy `before_agent_start` yang memutasi prompt, sambil mempertahankan `modelOverride` dan `providerOverride` lama. Berlaku untuk hook Plugin native dan direktori hook yang disediakan bundle yang didukung.
- `plugins.entries.<id>.subagent.allowModelOverride`: secara eksplisit mempercayai Plugin ini untuk meminta override `provider` dan `model` per eksekusi untuk eksekusi sub-agen latar belakang.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opsional target kanonis `provider/model` untuk override sub-agen yang tepercaya. Gunakan `"*"` hanya ketika Anda memang ingin mengizinkan model apa pun.
- `plugins.entries.<id>.config`: objek konfigurasi yang didefinisikan Plugin (divalidasi oleh skema Plugin OpenClaw native bila tersedia).
- `plugins.entries.firecrawl.config.webFetch`: pengaturan provider web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (menerima SecretRef). Kembali ke `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey`, atau env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL dasar API Firecrawl (default: `https://api.firecrawl.dev`).
  - `onlyMainContent`: ekstrak hanya konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: batas waktu permintaan scrape dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan provider X Search.
  - `model`: model Grok yang digunakan untuk pencarian (mis. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan ambang batas.
  - `enabled`: sakelar utama Dreaming (default `false`).
  - `frequency`: kadens Cron untuk setiap sapuan Dreaming penuh (default `"0 3 * * *"`).
  - kebijakan fase dan ambang batas adalah detail implementasi (bukan kunci konfigurasi yang ditujukan untuk pengguna).
- Konfigurasi memori lengkap ada di [Referensi konfigurasi Memory](/id/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundle Claude yang diaktifkan juga dapat menyumbangkan default Pi tersemat dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agen yang telah disanitasi, bukan sebagai patch konfigurasi OpenClaw mentah.
- `plugins.slots.memory`: pilih id Plugin memori aktif, atau `"none"` untuk menonaktifkan Plugin memori.
- `plugins.slots.contextEngine`: pilih id Plugin context engine aktif; default ke `"legacy"` kecuali Anda menginstal dan memilih engine lain.
- `plugins.installs`: metadata instalasi yang dikelola CLI dan digunakan oleh `openclaw plugins update`.
  - Mencakup `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Perlakukan `plugins.installs.*` sebagai status terkelola; utamakan perintah CLI daripada edit manual.

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
      // dangerouslyAllowPrivateNetwork: true, // hanya aktifkan untuk akses jaringan privat tepercaya
      // allowPrivateNetwork: true, // alias legacy
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan saat tidak disetel, sehingga navigasi browser tetap ketat secara default.
- Setel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` hanya ketika Anda memang mempercayai navigasi browser jaringan privat.
- Dalam mode ketat, endpoint profil CDP remote (`profiles.*.cdpUrl`) tunduk pada pemblokiran jaringan privat yang sama selama pemeriksaan keterjangkauan/discovery.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias legacy.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil remote bersifat attach-only (start/stop/reset dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) saat Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  saat provider Anda memberi URL WebSocket DevTools langsung.
- Profil `existing-session` menggunakan Chrome MCP alih-alih CDP dan dapat melampirkan pada
  host yang dipilih atau melalui browser node yang terhubung.
- Profil `existing-session` dapat menyetel `userDataDir` untuk menargetkan profil browser
  berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` mempertahankan batas route Chrome MCP saat ini:
  aksi berbasis snapshot/ref alih-alih penargetan CSS selector, hook upload satu file,
  tanpa override batas waktu dialog, tanpa `wait --load networkidle`, dan tanpa
  `responsebody`, ekspor PDF, intersepsi unduhan, atau aksi batch.
- Profil `openclaw` terkelola lokal secara otomatis menetapkan `cdpPort` dan `cdpUrl`; hanya
  setel `cdpUrl` secara eksplisit untuk CDP remote.
- Urutan deteksi otomatis: browser default jika berbasis Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Layanan control: hanya loopback (port diturunkan dari `gateway.port`, default `18791`).
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
      avatar: "CB", // emoji, teks pendek, URL gambar, atau data URI
    },
  },
}
```

- `seamColor`: warna aksen untuk chrome UI aplikasi native (tint gelembung mode Talk, dll.).
- `assistant`: override identitas UI Control. Kembali ke identitas agen aktif.

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
      // allowedOrigins: ["https://control.example.com"], // wajib untuk UI Control non-loopback
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
    tools: {
      // Penolakan HTTP /tools/invoke tambahan
      deny: ["browser"],
      // Hapus tool dari daftar tolak HTTP default
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

- `mode`: `local` (jalankan Gateway) atau `remote` (hubungkan ke Gateway remote). Gateway menolak untuk memulai kecuali `local`.
- `port`: satu port termultipleks untuk WS + HTTP. Prioritas: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (default), `lan` (`0.0.0.0`), `tailnet` (hanya IP Tailscale), atau `custom`.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind `loopback` default mendengarkan di `127.0.0.1` di dalam container. Dengan Docker bridge networking (`-p 18789:18789`), trafik tiba di `eth0`, sehingga Gateway tidak dapat dijangkau. Gunakan `--network host`, atau setel `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) untuk mendengarkan di semua antarmuka.
- **Auth**: wajib secara default. Bind non-loopback memerlukan auth Gateway. Dalam praktiknya itu berarti token/kata sandi bersama atau reverse proxy sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wizard onboarding menghasilkan token secara default.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi (termasuk SecretRef), setel `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Alur startup dan instalasi/perbaikan layanan gagal ketika keduanya dikonfigurasi dan mode tidak disetel.
- `gateway.auth.mode: "none"`: mode tanpa auth yang eksplisit. Gunakan hanya untuk penyiapan local loopback tepercaya; ini sengaja tidak ditawarkan oleh prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan auth ke reverse proxy sadar identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)). Mode ini mengharapkan sumber proxy **non-loopback**; reverse proxy loopback pada host yang sama tidak memenuhi trusted-proxy auth.
- `gateway.auth.allowTailscale`: saat `true`, header identitas Tailscale Serve dapat memenuhi auth UI Control/WebSocket (diverifikasi melalui `tailscale whois`). Endpoint HTTP API **tidak** menggunakan auth header Tailscale itu; endpoint tersebut mengikuti mode auth HTTP Gateway normal. Alur tanpa token ini mengasumsikan host Gateway tepercaya. Default ke `true` saat `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: pembatas auth gagal opsional. Berlaku per IP klien dan per cakupan auth (shared-secret dan device-token dilacak secara independen). Upaya yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada jalur UI Control async Tailscale Serve, upaya gagal untuk `{scope, clientIp}` yang sama diserialkan sebelum penulisan kegagalan. Karena itu, upaya buruk serentak dari klien yang sama dapat memicu limiter pada permintaan kedua alih-alih keduanya lolos sebagai mismatch biasa.
  - `gateway.auth.rateLimit.exemptLoopback` default-nya `true`; setel `false` saat Anda memang ingin trafik localhost juga dibatasi lajunya (untuk penyiapan pengujian atau deployment proxy ketat).
- Upaya auth WS yang berasal dari browser selalu dibatasi lajunya dengan pengecualian loopback dinonaktifkan (pertahanan berlapis terhadap brute force localhost berbasis browser).
- Pada loopback, lockout yang berasal dari browser tersebut diisolasi per nilai `Origin`
  yang dinormalkan, sehingga kegagalan berulang dari satu origin localhost tidak otomatis
  mengunci origin lain.
- `tailscale.mode`: `serve` (hanya tailnet, bind loopback) atau `funnel` (publik, memerlukan auth).
- `controlUi.allowedOrigins`: allowlist origin browser eksplisit untuk koneksi WebSocket Gateway. Wajib saat klien browser diharapkan berasal dari origin non-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan fallback origin Host-header untuk deployment yang sengaja mengandalkan kebijakan origin Host-header.
- `remote.transport`: `ssh` (default) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus `ws://` atau `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override darurat lingkungan proses sisi klien
  yang mengizinkan `ws://` plaintext ke IP jaringan privat tepercaya; default tetap hanya loopback untuk plaintext. Tidak ada padanan `openclaw.json`,
  dan konfigurasi jaringan privat browser seperti
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tidak memengaruhi klien
  WebSocket Gateway.
- `gateway.remote.token` / `.password` adalah field kredensial klien remote. Field ini tidak mengonfigurasi auth Gateway dengan sendirinya.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS dasar untuk relay APNs eksternal yang digunakan oleh build iOS resmi/TestFlight setelah build tersebut menerbitkan registrasi berbasis relay ke Gateway. URL ini harus cocok dengan URL relay yang dikompilasi ke dalam build iOS.
- `gateway.push.apns.relay.timeoutMs`: batas waktu kirim gateway-ke-relay dalam milidetik. Default ke `10000`.
- Registrasi berbasis relay didelegasikan ke identitas Gateway tertentu. Aplikasi iOS yang dipairing mengambil `gateway.identity.get`, menyertakan identitas itu dalam registrasi relay, dan meneruskan grant pengiriman bercakupan registrasi ke Gateway. Gateway lain tidak dapat menggunakan ulang registrasi tersimpan itu.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env sementara untuk konfigurasi relay di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: mekanisme darurat khusus pengembangan untuk URL relay HTTP loopback. URL relay produksi sebaiknya tetap menggunakan HTTPS.
- `gateway.channelHealthCheckMinutes`: interval monitor kesehatan channel dalam menit. Setel `0` untuk menonaktifkan restart monitor kesehatan secara global. Default: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ambang socket basi dalam menit. Pertahankan nilai ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`. Default: `30`.
- `gateway.channelMaxRestartsPerHour`: jumlah maksimum restart monitor kesehatan per channel/akun dalam satu jam bergulir. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per channel untuk restart monitor kesehatan sambil tetap menjaga monitor global aktif.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per akun untuk channel multi-akun. Saat disetel, ini diprioritaskan atas override tingkat channel.
- Jalur panggilan Gateway lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak disetel.
- Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan tidak ter-resolve, resolve gagal secara fail-closed (tanpa fallback remote yang menyamarkan).
- `trustedProxies`: IP reverse proxy yang mengakhiri TLS atau menyuntikkan header forwarded-client. Hanya cantumkan proxy yang Anda kendalikan. Entri loopback tetap valid untuk penyiapan proxy pada host yang sama/deteksi lokal (misalnya Tailscale Serve atau reverse proxy lokal), tetapi entri tersebut **tidak** membuat permintaan loopback memenuhi syarat untuk `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: saat `true`, Gateway menerima `X-Real-IP` jika `X-Forwarded-For` tidak ada. Default `false` untuk perilaku fail-closed.
- `gateway.tools.deny`: nama tool tambahan yang diblokir untuk HTTP `POST /tools/invoke` (memperluas daftar tolak default).
- `gateway.tools.allow`: hapus nama tool dari daftar tolak HTTP default.

</Accordion>

### Endpoint yang kompatibel dengan OpenAI

- Chat Completions: dinonaktifkan secara default. Aktifkan dengan `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Penguatan input URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlist kosong diperlakukan sebagai tidak disetel; gunakan `gateway.http.endpoints.responses.files.allowUrl=false`
    dan/atau `gateway.http.endpoints.responses.images.allowUrl=false` untuk menonaktifkan pengambilan URL.
- Header penguatan respons opsional:
  - `gateway.http.securityHeaders.strictTransportSecurity` (setel hanya untuk origin HTTPS yang Anda kendalikan; lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolasi multi-instance

Jalankan beberapa Gateway pada satu host dengan port dan direktori status yang unik:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag kenyamanan: `--dev` (menggunakan `~/.openclaw-dev` + port `19001`), `--profile <name>` (menggunakan `~/.openclaw-<name>`).

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

- `enabled`: mengaktifkan terminasi TLS pada listener Gateway (HTTPS/WSS) (default: `false`).
- `autoGenerate`: menghasilkan otomatis pasangan sertifikat/key self-signed lokal ketika file eksplisit tidak dikonfigurasi; hanya untuk penggunaan lokal/dev.
- `certPath`: path filesystem ke file sertifikat TLS.
- `keyPath`: path filesystem ke file private key TLS; batasi izinnya.
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

- `mode`: mengontrol cara edit konfigurasi diterapkan saat runtime.
  - `"off"`: abaikan edit live; perubahan memerlukan restart eksplisit.
  - `"restart"`: selalu restart proses Gateway saat konfigurasi berubah.
  - `"hot"`: terapkan perubahan di dalam proses tanpa restart.
  - `"hybrid"` (default): coba hot reload terlebih dahulu; kembali ke restart jika diperlukan.
- `debounceMs`: jendela debounce dalam ms sebelum perubahan konfigurasi diterapkan (bilangan bulat non-negatif).
- `deferralTimeoutMs`: waktu maksimum dalam ms untuk menunggu operasi yang sedang berjalan sebelum memaksa restart (default: `300000` = 5 menit).

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
Token hook di query-string ditolak.

Catatan validasi dan keamanan:

- `hooks.enabled=true` memerlukan `hooks.token` yang tidak kosong.
- `hooks.token` harus **berbeda** dari `gateway.auth.token`; penggunaan ulang token Gateway ditolak.
- `hooks.path` tidak boleh `/`; gunakan subpath khusus seperti `/hooks`.
- Jika `hooks.allowRequestSessionKey=true`, batasi `hooks.allowedSessionKeyPrefixes` (misalnya `["hook:"]`).
- Jika sebuah mapping atau preset menggunakan `sessionKey` bertemplate, setel `hooks.allowedSessionKeyPrefixes` dan `hooks.allowRequestSessionKey=true`. Mapping key statis tidak memerlukan opt-in tersebut.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dari payload permintaan hanya diterima saat `hooks.allowRequestSessionKey=true` (default: `false`).
- `POST /hooks/<name>` → di-resolve melalui `hooks.mappings`
  - Nilai `sessionKey` mapping yang dirender dari template diperlakukan sebagai disuplai secara eksternal dan juga memerlukan `hooks.allowRequestSessionKey=true`.

<Accordion title="Detail mapping">

- `match.path` mencocokkan sub-path setelah `/hooks` (mis. `/hooks/gmail` → `gmail`).
- `match.source` mencocokkan field payload untuk path generik.
- Template seperti `{{messages[0].subject}}` dibaca dari payload.
- `transform` dapat menunjuk ke modul JS/TS yang mengembalikan aksi hook.
  - `transform.module` harus berupa path relatif dan tetap berada di dalam `hooks.transformsDir` (path absolut dan traversal ditolak).
- `agentId` merutekan ke agen tertentu; ID yang tidak dikenal kembali ke default.
- `allowedAgentIds`: membatasi routing eksplisit (`*` atau dihilangkan = izinkan semua, `[]` = tolak semua).
- `defaultSessionKey`: session key tetap opsional untuk eksekusi agen hook tanpa `sessionKey` eksplisit.
- `allowRequestSessionKey`: izinkan pemanggil `/hooks/agent` dan session key mapping yang digerakkan template untuk menyetel `sessionKey` (default: `false`).
- `allowedSessionKeyPrefixes`: allowlist prefiks opsional untuk nilai `sessionKey` eksplisit (permintaan + mapping), mis. `["hook:"]`. Ini menjadi wajib saat mapping atau preset mana pun menggunakan `sessionKey` bertemplate.
- `deliver: true` mengirim balasan final ke channel; `channel` default ke `last`.
- `model` menimpa LLM untuk eksekusi hook ini (harus diizinkan jika katalog model disetel).

</Accordion>

### Integrasi Gmail

- Preset Gmail bawaan menggunakan `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jika Anda mempertahankan routing per pesan itu, setel `hooks.allowRequestSessionKey: true` dan batasi `hooks.allowedSessionKeyPrefixes` agar cocok dengan namespace Gmail, misalnya `["hook:", "hook:gmail:"]`.
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

- Gateway memulai otomatis `gog gmail watch serve` saat boot jika dikonfigurasi. Setel `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkan.
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

- Menyajikan HTML/CSS/JS dan A2UI yang dapat diedit agen melalui HTTP di bawah port Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Hanya lokal: pertahankan `gateway.bind: "loopback"` (default).
- Bind non-loopback: rute canvas memerlukan auth Gateway (token/password/trusted-proxy), sama seperti permukaan HTTP Gateway lainnya.
- WebView node biasanya tidak mengirim header auth; setelah sebuah node dipairing dan terhubung, Gateway mengiklankan URL kapabilitas bercakupan node untuk akses canvas/A2UI.
- URL kapabilitas terikat ke sesi WS node aktif dan cepat kedaluwarsa. Fallback berbasis IP tidak digunakan.
- Menyuntikkan klien live-reload ke HTML yang disajikan.
- Membuat otomatis `index.html` awal saat kosong.
- Juga menyajikan A2UI di `/__openclaw__/a2ui/`.
- Perubahan memerlukan restart Gateway.
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

Menulis zona DNS-SD unicast di bawah `~/.openclaw/dns/`. Untuk discovery lintas jaringan, pasangkan dengan server DNS (CoreDNS direkomendasikan) + Tailscale split DNS.

Penyiapan: `openclaw dns setup --apply`.

---

## Lingkungan

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
- File `.env`: `.env` CWD + `~/.openclaw/.env` (keduanya tidak menimpa var yang sudah ada).
- `shellEnv`: mengimpor key yang hilang dan diharapkan dari profil login shell Anda.
- Lihat [Environment](/id/help/environment) untuk prioritas lengkap.

### Substitusi env var

Rujuk env var di string konfigurasi apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Hanya nama huruf besar yang dicocokkan: `[A-Z_][A-Z0-9_]*`.
- Var yang hilang/kosong melempar error saat pemuatan konfigurasi.
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

- pola `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- pola id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id `source: "file"`: pointer JSON absolut (misalnya `"/providers/openai/apiKey"`)
- pola id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id `source: "exec"` tidak boleh mengandung segmen path `.` atau `..` yang dipisah slash (misalnya `a/../b` ditolak)

### Permukaan kredensial yang didukung

- Matriks kanonis: [SecretRef Credential Surface](/id/reference/secretref-credential-surface)
- `secrets apply` menargetkan path kredensial `openclaw.json` yang didukung.
- Ref `auth-profiles.json` disertakan dalam resolusi runtime dan cakupan audit.

### Konfigurasi provider secret

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
- Path provider file dan exec gagal secara fail-closed ketika verifikasi ACL Windows tidak tersedia. Setel `allowInsecurePath: true` hanya untuk path tepercaya yang tidak dapat diverifikasi.
- Provider `exec` memerlukan path `command` absolut dan menggunakan payload protokol di stdin/stdout.
- Secara default, path perintah symlink ditolak. Setel `allowSymlinkCommand: true` untuk mengizinkan path symlink sambil memvalidasi path target yang telah di-resolve.
- Jika `trustedDirs` dikonfigurasi, pemeriksaan trusted-dir berlaku untuk path target yang telah di-resolve.
- Lingkungan child `exec` minimal secara default; teruskan variabel yang diperlukan secara eksplisit dengan `passEnv`.
- Ref secret di-resolve pada waktu aktivasi ke snapshot dalam memori, lalu jalur permintaan hanya membaca snapshot tersebut.
- Pemfilteran permukaan aktif berlaku selama aktivasi: ref yang tidak ter-resolve pada permukaan yang diaktifkan menyebabkan startup/reload gagal, sementara permukaan yang tidak aktif dilewati dengan diagnostik.

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

- Profile per agen disimpan di `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` mendukung ref tingkat nilai (`keyRef` untuk `api_key`, `tokenRef` untuk `token`) untuk mode kredensial statis.
- Profile mode OAuth (`auth.profiles.<id>.mode = "oauth"`) tidak mendukung kredensial auth-profile yang didukung SecretRef.
- Kredensial runtime statis berasal dari snapshot hasil resolve dalam memori; entri statis `auth.json` lama dibersihkan saat ditemukan.
- Impor OAuth lama dari `~/.openclaw/credentials/oauth.json`.
- Lihat [OAuth](/id/concepts/oauth).
- Perilaku runtime Secrets dan tool `audit/configure/apply`: [Secrets Management](/id/gateway/secrets).

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

- `billingBackoffHours`: backoff dasar dalam jam ketika sebuah profile gagal karena error billing/kredit tidak cukup yang benar-benar terjadi (default: `5`). Teks billing yang eksplisit masih dapat masuk ke sini bahkan pada respons `401`/`403`, tetapi matcher teks khusus provider tetap dibatasi ke provider yang memilikinya (misalnya OpenRouter `Key limit exceeded`). Pesan batas pengeluaran usage-window atau organization/workspace HTTP `402` yang dapat dicoba ulang tetap berada di jalur `rate_limit`.
- `billingBackoffHoursByProvider`: override opsional per provider untuk jam backoff billing.
- `billingMaxHours`: batas dalam jam untuk pertumbuhan eksponensial backoff billing (default: `24`).
- `authPermanentBackoffMinutes`: backoff dasar dalam menit untuk kegagalan `auth_permanent` dengan keyakinan tinggi (default: `10`).
- `authPermanentMaxMinutes`: batas dalam menit untuk pertumbuhan backoff `auth_permanent` (default: `60`).
- `failureWindowHours`: jendela bergulir dalam jam yang digunakan untuk penghitung backoff (default: `24`).
- `overloadedProfileRotations`: jumlah maksimum rotasi auth-profile provider yang sama untuk error overload sebelum beralih ke fallback model (default: `1`). Bentuk provider-sibuk seperti `ModelNotReadyException` masuk ke sini.
- `overloadedBackoffMs`: penundaan tetap sebelum mencoba ulang rotasi provider/profile yang overload (default: `0`).
- `rateLimitedProfileRotations`: jumlah maksimum rotasi auth-profile provider yang sama untuk error rate limit sebelum beralih ke fallback model (default: `1`). Bucket rate limit itu mencakup teks berbentuk provider seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, dan `resource exhausted`.

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
- Setel `logging.file` untuk path yang stabil.
- `consoleLevel` naik menjadi `debug` saat `--verbose`.
- `maxFileBytes`: ukuran file log maksimum dalam byte sebelum penulisan ditekan (bilangan bulat positif; default: `524288000` = 500 MB). Gunakan rotasi log eksternal untuk deployment produksi.

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
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
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
- `flags`: array string flag yang mengaktifkan output log tertarget (mendukung wildcard seperti `"telegram.*"` atau `"*"`).
- `stuckSessionWarnMs`: ambang usia dalam ms untuk mengeluarkan peringatan sesi macet saat sebuah sesi tetap berada dalam status pemrosesan.
- `otel.enabled`: mengaktifkan pipeline ekspor OpenTelemetry (default: `false`).
- `otel.endpoint`: URL kolektor untuk ekspor OTel.
- `otel.protocol`: `"http/protobuf"` (default) atau `"grpc"`.
- `otel.headers`: header metadata HTTP/gRPC tambahan yang dikirim bersama permintaan ekspor OTel.
- `otel.serviceName`: nama layanan untuk atribut resource.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktifkan ekspor trace, metrics, atau log.
- `otel.sampleRate`: tingkat sampling trace `0`–`1`.
- `otel.flushIntervalMs`: interval flush telemetri periodik dalam ms.
- `cacheTrace.enabled`: catat snapshot jejak cache untuk eksekusi tersemat (default: `false`).
- `cacheTrace.filePath`: path output untuk JSONL jejak cache (default: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: mengontrol apa yang disertakan dalam output jejak cache (semuanya default: `true`).

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
- `checkOnStart`: periksa pembaruan npm saat Gateway dimulai (default: `true`).
- `auto.enabled`: aktifkan auto-update latar belakang untuk instalasi paket (default: `false`).
- `auto.stableDelayHours`: penundaan minimum dalam jam sebelum auto-apply channel stable (default: `6`; maks: `168`).
- `auto.stableJitterHours`: jendela sebaran rollout channel stable tambahan dalam jam (default: `12`; maks: `168`).
- `auto.betaCheckIntervalHours`: seberapa sering pemeriksaan channel beta berjalan dalam jam (default: `1`; maks: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled`: gate fitur ACP global (default: `false`).
- `dispatch.enabled`: gate independen untuk dispatch giliran sesi ACP (default: `true`). Setel `false` untuk menjaga perintah ACP tetap tersedia sambil memblokir eksekusi.
- `backend`: id backend runtime ACP default (harus cocok dengan Plugin runtime ACP yang terdaftar).
- `defaultAgent`: id agen target ACP fallback ketika spawn tidak menentukan target eksplisit.
- `allowedAgents`: allowlist id agen yang diizinkan untuk sesi runtime ACP; kosong berarti tidak ada pembatasan tambahan.
- `maxConcurrentSessions`: jumlah maksimum sesi ACP aktif secara bersamaan.
- `stream.coalesceIdleMs`: jendela flush idle dalam ms untuk teks yang di-stream.
- `stream.maxChunkChars`: ukuran chunk maksimum sebelum memecah proyeksi blok streaming.
- `stream.repeatSuppression`: tekan baris status/tool yang berulang per giliran (default: `true`).
- `stream.deliveryMode`: `"live"` men-stream secara inkremental; `"final_only"` membuffer hingga event terminal giliran.
- `stream.hiddenBoundarySeparator`: pemisah sebelum teks terlihat setelah event tool tersembunyi (default: `"paragraph"`).
- `stream.maxOutputChars`: jumlah karakter output asisten maksimum yang diproyeksikan per giliran ACP.
- `stream.maxSessionUpdateChars`: jumlah karakter maksimum untuk baris status/pembaruan ACP yang diproyeksikan.
- `stream.tagVisibility`: catatan nama tag ke override visibilitas boolean untuk event yang di-stream.
- `runtime.ttlMinutes`: TTL idle dalam menit untuk worker sesi ACP sebelum memenuhi syarat untuk cleanup.
- `runtime.installCommand`: perintah instalasi opsional yang dijalankan saat bootstrap lingkungan runtime ACP.

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
- Untuk menyembunyikan seluruh banner (bukan hanya taglinenya), setel env `OPENCLAW_HIDE_BANNER=1`.

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

## Identity

Lihat field identitas `agents.list` di bawah [Default agen](/id/gateway/config-agents#agent-defaults).

---

## Bridge (lama, dihapus)

Build saat ini tidak lagi menyertakan bridge TCP. Node terhubung melalui WebSocket Gateway. Kunci `bridge.*` tidak lagi menjadi bagian dari skema konfigurasi (validasi gagal sampai dihapus; `openclaw doctor --fix` dapat menghapus kunci yang tidak dikenal).

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
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback deprecated untuk job notify:true yang tersimpan
    webhookToken: "replace-with-dedicated-token", // bearer token opsional untuk auth Webhook keluar
    sessionRetention: "24h", // string durasi atau false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 byte
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: berapa lama menyimpan sesi eksekusi Cron terisolasi yang selesai sebelum dipangkas dari `sessions.json`. Juga mengontrol cleanup transkrip Cron terhapus yang diarsipkan. Default: `24h`; setel `false` untuk menonaktifkan.
- `runLog.maxBytes`: ukuran maksimum per file log eksekusi (`cron/runs/<jobId>.jsonl`) sebelum dipangkas. Default: `2_000_000` byte.
- `runLog.keepLines`: baris terbaru yang dipertahankan saat pemangkasan log eksekusi dipicu. Default: `2000`.
- `webhookToken`: bearer token yang digunakan untuk pengiriman POST Webhook Cron (`delivery.mode = "webhook"`), jika dihilangkan tidak ada header auth yang dikirim.
- `webhook`: URL Webhook fallback lama yang deprecated (http/https) yang hanya digunakan untuk job tersimpan yang masih memiliki `notify: true`.

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

- `maxAttempts`: jumlah retry maksimum untuk job sekali jalan pada error transien (default: `3`; rentang: `0`–`10`).
- `backoffMs`: array delay backoff dalam ms untuk setiap upaya retry (default: `[30000, 60000, 300000]`; 1–10 entri).
- `retryOn`: jenis error yang memicu retry — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Hilangkan untuk mencoba ulang semua jenis transien.

Hanya berlaku untuk Cron job sekali jalan. Job berulang menggunakan penanganan kegagalan yang terpisah.

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

- `enabled`: aktifkan peringatan kegagalan untuk Cron job (default: `false`).
- `after`: jumlah kegagalan beruntun sebelum peringatan dipicu (bilangan bulat positif, min: `1`).
- `cooldownMs`: milidetik minimum antara peringatan berulang untuk job yang sama (bilangan bulat non-negatif).
- `mode`: mode pengiriman — `"announce"` mengirim melalui pesan channel; `"webhook"` memposting ke Webhook yang dikonfigurasi.
- `accountId`: akun opsional atau id channel untuk mencakup pengiriman peringatan.

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

- Tujuan default untuk notifikasi kegagalan Cron di semua job.
- `mode`: `"announce"` atau `"webhook"`; default ke `"announce"` ketika data target yang cukup tersedia.
- `channel`: override channel untuk pengiriman announce. `"last"` menggunakan ulang channel pengiriman terakhir yang diketahui.
- `to`: target announce eksplisit atau URL Webhook. Wajib untuk mode Webhook.
- `accountId`: override akun opsional untuk pengiriman.
- `delivery.failureDestination` per job menimpa default global ini.
- Saat tidak ada tujuan kegagalan global maupun per job yang disetel, job yang sudah mengirim melalui `announce` akan kembali ke target announce utama tersebut saat gagal.
- `delivery.failureDestination` hanya didukung untuk job `sessionTarget="isolated"` kecuali `delivery.mode` utama job adalah `"webhook"`.

Lihat [Cron Jobs](/id/automation/cron-jobs). Eksekusi Cron terisolasi dilacak sebagai [tugas latar belakang](/id/automation/tasks).

---

## Variabel template model media

Placeholder template yang diekspansi di `tools.media.models[].args`:

| Variable           | Deskripsi                                         |
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
| `{{MediaType}}`    | Jenis media (gambar/audio/dokumen/…)              |
| `{{Transcript}}`   | Transkrip audio                                   |
| `{{Prompt}}`       | Prompt media hasil resolve untuk entri CLI        |
| `{{MaxChars}}`     | Karakter output maksimum hasil resolve untuk entri CLI |
| `{{ChatType}}`     | `"direct"` atau `"group"`                         |
| `{{GroupSubject}}` | Subjek grup (best effort)                         |
| `{{GroupMembers}}` | Pratinjau anggota grup (best effort)              |
| `{{SenderName}}`   | Nama tampilan pengirim (best effort)              |
| `{{SenderE164}}`   | Nomor telepon pengirim (best effort)              |
| `{{Provider}}`     | Petunjuk provider (whatsapp, telegram, discord, dll.) |

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

**Perilaku merge:**

- Satu file: menggantikan objek yang memuatnya.
- Array file: di-deep-merge secara berurutan (yang lebih akhir menimpa yang lebih awal).
- Kunci sibling: digabungkan setelah include (menimpa nilai yang di-include).
- Include bertingkat: hingga 10 level kedalaman.
- Path: di-resolve relatif terhadap file yang meng-include, tetapi harus tetap berada di dalam direktori konfigurasi tingkat atas (`dirname` dari `openclaw.json`). Bentuk absolut/`../` hanya diizinkan jika tetap di-resolve di dalam batas tersebut.
- Penulisan yang dimiliki OpenClaw yang hanya mengubah satu bagian tingkat atas yang didukung oleh include satu file akan diteruskan ke file include tersebut. Misalnya, `plugins install` memperbarui `plugins: { $include: "./plugins.json5" }` di `plugins.json5` dan membiarkan `openclaw.json` tetap utuh.
- Include root, array include, dan include dengan override sibling bersifat read-only untuk penulisan yang dimiliki OpenClaw; penulisan tersebut gagal secara fail-closed alih-alih meratakan konfigurasi.
- Error: pesan yang jelas untuk file yang hilang, error parse, dan include sirkular.

---

_Terkait: [Konfigurasi](/id/gateway/configuration) · [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
