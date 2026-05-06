---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami penemuan Plugin dan aturan pemuatan
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-06T18:00:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: saluran, penyedia model,
harness agen, alat, Skills, ucapan, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, pencarian
web, dan lainnya. Sebagian Plugin bersifat **inti** (dikirim bersama OpenClaw),
sebagian lainnya bersifat **eksternal**. Sebagian besar Plugin eksternal
dipublikasikan dan ditemukan melalui [ClawHub](/id/tools/clawhub). Npm tetap
didukung untuk instalasi langsung dan untuk sekumpulan sementara paket Plugin
milik OpenClaw selama migrasi tersebut selesai.

## Mulai cepat

Untuk contoh instalasi, daftar, penghapusan, pembaruan, dan publikasi yang bisa
disalin-tempel, lihat [Kelola Plugin](/id/plugins/manage-plugins).

<Steps>
  <Step title="Lihat apa yang dimuat">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instal Plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Mulai ulang Gateway">
    ```bash
    openclaw gateway restart
    ```

    Lalu konfigurasikan di bawah `plugins.entries.\<id\>.config` dalam file konfigurasi Anda.

  </Step>

  <Step title="Pengelolaan native chat">
    Dalam Gateway yang sedang berjalan, `/plugins enable` dan `/plugins disable`
    yang hanya untuk pemilik memicu pemuat ulang konfigurasi Gateway. Gateway
    memuat ulang permukaan runtime Plugin dalam proses, dan giliran agen baru
    membangun ulang daftar alatnya dari registry yang disegarkan. `/plugins install`
    mengubah kode sumber Plugin, sehingga Gateway meminta mulai ulang alih-alih
    berpura-pura bahwa proses saat ini dapat memuat ulang modul yang sudah diimpor
    dengan aman.

  </Step>

  <Step title="Verifikasi Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gunakan `--runtime` ketika Anda perlu membuktikan alat, layanan, metode Gateway,
    hook, atau perintah CLI milik Plugin yang terdaftar. `inspect` biasa adalah
    pemeriksaan manifest/registry dingin dan sengaja menghindari pengimporan runtime Plugin.

  </Step>
</Steps>

Jika Anda lebih memilih kontrol native chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Jalur instalasi menggunakan resolver yang sama dengan CLI: path/arsip lokal, eksplisit
`clawhub:<pkg>`, eksplisit `npm:<pkg>`, eksplisit `npm-pack:<path.tgz>`,
eksplisit `git:<repo>`, atau spesifikasi paket polos melalui npm.

Jika konfigurasi tidak valid, instalasi biasanya gagal tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur instal ulang
Plugin bawaan yang sempit untuk Plugin yang ikut serta dalam
`openclaw.install.allowInvalidConfigRecovery`.
Selama startup Gateway, konfigurasi Plugin yang tidak valid gagal tertutup seperti
konfigurasi tidak valid lainnya. Jalankan `openclaw doctor --fix` untuk mengarantina
konfigurasi Plugin yang buruk dengan menonaktifkan entri Plugin tersebut dan menghapus
payload konfigurasi tidak validnya; cadangan konfigurasi normal mempertahankan nilai sebelumnya.
Ketika konfigurasi saluran merujuk ke Plugin yang tidak lagi dapat ditemukan tetapi id
Plugin basi yang sama tetap ada dalam konfigurasi Plugin atau catatan instalasi, startup
Gateway mencatat peringatan dan melewati saluran tersebut alih-alih memblokir semua saluran lain.
Jalankan `openclaw doctor --fix` untuk menghapus entri saluran/Plugin yang basi; kunci
saluran yang tidak dikenal tanpa bukti Plugin basi tetap gagal validasi agar salah ketik
tetap terlihat.
Jika `plugins.enabled: false` disetel, referensi Plugin basi diperlakukan sebagai inert:
startup Gateway melewati pekerjaan penemuan/pemuatan Plugin dan `openclaw doctor`
mempertahankan konfigurasi Plugin yang dinonaktifkan alih-alih menghapusnya otomatis.
Aktifkan kembali Plugin sebelum menjalankan pembersihan doctor jika Anda ingin id Plugin
basi dihapus.

Instalasi dependensi Plugin hanya terjadi selama alur instalasi/pembaruan eksplisit atau
perbaikan doctor. Startup Gateway, pemuatan ulang konfigurasi, dan inspeksi runtime tidak
menjalankan pengelola paket atau memperbaiki pohon dependensi. Plugin lokal harus sudah
memiliki dependensinya terinstal, sementara Plugin npm, git, dan ClawHub diinstal di bawah
root Plugin terkelola OpenClaw. Dependensi npm dapat di-hoist di dalam root npm terkelola
OpenClaw; instalasi/pembaruan memindai root terkelola tersebut sebelum kepercayaan dan
penghapusan instalasi menghapus paket terkelola npm melalui npm. Plugin eksternal dan path
pemuatan kustom tetap harus diinstal melalui `openclaw plugins install`.
Gunakan `openclaw plugins list --json` untuk melihat `dependencyStatus` statis bagi setiap
Plugin yang terlihat tanpa mengimpor kode runtime atau memperbaiki dependensi.
Lihat [Resolusi dependensi Plugin](/id/plugins/dependency-resolution) untuk siklus hidup saat instalasi.

### Kepemilikan path Plugin yang diblokir

Jika diagnostik Plugin mengatakan
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
dan validasi konfigurasi dilanjutkan dengan `plugin present but blocked`, OpenClaw menemukan
file Plugin yang dimiliki oleh pengguna Unix berbeda dari proses yang memuatnya. Biarkan
konfigurasi Plugin tetap ada; perbaiki kepemilikan sistem file atau jalankan OpenClaw
sebagai pengguna yang sama yang memiliki direktori state.

Untuk instalasi Docker, image resmi berjalan sebagai `node` (uid `1000`), jadi direktori
konfigurasi dan workspace OpenClaw yang di-bind-mount dari host biasanya harus dimiliki
oleh uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jika Anda sengaja menjalankan OpenClaw sebagai root, perbaiki root Plugin terkelola menjadi
kepemilikan root sebagai gantinya:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Setelah memperbaiki kepemilikan, jalankan ulang `openclaw doctor --fix` atau
`openclaw plugins registry --refresh` agar registry Plugin yang dipersistensikan sesuai
dengan file yang telah diperbaiki.

Untuk instalasi npm, selector yang dapat berubah seperti `latest` atau dist-tag diselesaikan
sebelum instalasi lalu dipatok ke versi terverifikasi yang tepat dalam root npm terkelola
OpenClaw. Setelah npm selesai, OpenClaw memverifikasi bahwa entri `package-lock.json` yang
terinstal masih cocok dengan versi dan integritas yang diselesaikan. Jika npm menulis metadata
paket yang berbeda, instalasi gagal dan paket terkelola di-rollback alih-alih menerima artefak
Plugin yang berbeda.
Root npm terkelola juga mewarisi `overrides` npm tingkat paket milik OpenClaw, sehingga pin
keamanan yang melindungi host terpaket juga berlaku untuk dependensi Plugin eksternal yang di-hoist.

Checkout sumber adalah workspace pnpm. Jika Anda mengkloning OpenClaw untuk mengutak-atik
Plugin bawaan, jalankan `pnpm install`; OpenClaw lalu memuat Plugin bawaan dari
`extensions/<id>` sehingga edit dan dependensi lokal paket digunakan secara langsung.
Instalasi root npm biasa ditujukan untuk OpenClaw terpaket, bukan pengembangan checkout sumber.

## Jenis Plugin

OpenClaw mengenali dua format Plugin:

| Format     | Cara kerjanya                                                    | Contoh                                                 |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi dalam proses  | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak kompatibel Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundle Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis Plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar Plugin SDK](/id/plugins/sdk-overview).

## Entrypoint paket

Paket npm Plugin native harus mendeklarasikan `openclaw.extensions` dalam `package.json`.
Setiap entri harus tetap berada di dalam direktori paket dan diselesaikan ke file runtime
yang dapat dibaca, atau ke file sumber TypeScript dengan peer JavaScript hasil build yang
disimpulkan seperti `src/index.ts` ke `dist/index.js`.
Instalasi terpaket harus mengirimkan output runtime JavaScript tersebut. Fallback sumber
TypeScript ditujukan untuk checkout sumber dan path pengembangan lokal, bukan untuk paket
npm yang diinstal ke root Plugin terkelola OpenClaw.

Jika peringatan paket terkelola mengatakan bahwa paket itu `requires compiled runtime output for
TypeScript entry ...`, paket tersebut dipublikasikan tanpa file JavaScript yang dibutuhkan
OpenClaw saat runtime. Itu adalah masalah pengemasan Plugin, bukan masalah konfigurasi lokal.
Perbarui atau instal ulang Plugin setelah penerbit memublikasikan ulang JavaScript terkompilasi,
atau nonaktifkan/hapus instalasi Plugin tersebut sampai paket yang sudah diperbaiki tersedia.

Gunakan `openclaw.runtimeExtensions` ketika file runtime yang dipublikasikan tidak berada di
path yang sama dengan entri sumber. Saat ada, `runtimeExtensions` harus berisi tepat satu entri
untuk setiap entri `extensions`. Daftar yang tidak cocok menggagalkan instalasi dan penemuan
Plugin alih-alih diam-diam kembali ke path sumber. Jika Anda juga memublikasikan
`openclaw.setupEntry`, gunakan `openclaw.runtimeSetupEntry` untuk peer JavaScript hasil build-nya;
file tersebut wajib ada ketika dideklarasikan.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugin resmi

### Paket npm milik OpenClaw selama migrasi

ClawHub adalah jalur distribusi utama untuk sebagian besar Plugin. Rilis OpenClaw terpaket
saat ini sudah membundel banyak Plugin resmi, sehingga Plugin tersebut tidak memerlukan
instalasi npm terpisah dalam setup normal. Hingga setiap Plugin milik OpenClaw bermigrasi
ke ClawHub, OpenClaw masih mengirimkan beberapa paket Plugin `@openclaw/*` di npm untuk
instalasi lama/kustom dan alur kerja npm langsung.

Jika npm melaporkan paket Plugin `@openclaw/*` sebagai deprecated, versi paket tersebut
berasal dari rangkaian paket eksternal yang lebih lama. Gunakan Plugin bawaan dari OpenClaw
saat ini atau checkout lokal sampai paket npm yang lebih baru dipublikasikan.

| Plugin          | Paket                      | Dokumentasi                                |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/id/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/id/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/id/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/id/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/id/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/id/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/id/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/id/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/id/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/id/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/id/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/id/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/id/plugins/zalouser)         |

### Inti (dikirim bersama OpenClaw)

<AccordionGroup>
  <Accordion title="Penyedia model (diaktifkan secara default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin memori">
    - `memory-core` - pencarian memori bawaan (default melalui `plugins.slots.memory`)
    - `memory-lancedb` - memori jangka panjang berbasis LanceDB dengan auto-recall/capture (atur `plugins.slots.memory = "memory-lancedb"`)

    Lihat [Memory LanceDB](/id/plugins/memory-lancedb) untuk penyiapan embedding
    yang kompatibel dengan OpenAI, contoh Ollama, batas recall, dan pemecahan masalah.

  </Accordion>

  <Accordion title="Penyedia ucapan (diaktifkan secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` - plugin browser bawaan untuk alat browser, CLI `openclaw browser`, metode gateway `browser.request`, runtime browser, dan layanan kontrol browser default (diaktifkan secara default; nonaktifkan sebelum menggantinya)
    - `copilot-proxy` - bridge VS Code Copilot Proxy (dinonaktifkan secara default)

  </Accordion>
</AccordionGroup>

Mencari plugin pihak ketiga? Lihat [Plugin Komunitas](/id/plugins/community).

## Konfigurasi

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Bidang             | Deskripsi                                                 |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Sakelar utama (default: `true`)                           |
| `allow`            | allowlist plugin (opsional)                               |
| `bundledDiscovery` | Mode penemuan plugin bawaan (`allowlist` secara default)  |
| `deny`             | denylist plugin (opsional; deny lebih diutamakan)         |
| `load.paths`       | File/direktori plugin tambahan                            |
| `slots`            | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>`   | Sakelar + konfigurasi per plugin                          |

`plugins.allow` bersifat eksklusif. Saat tidak kosong, hanya plugin yang
tercantum yang dapat dimuat atau mengekspos alat, meskipun `tools.allow`
berisi `"*"` atau nama alat milik plugin tertentu. Jika allowlist alat merujuk
alat plugin, tambahkan id plugin pemiliknya ke `plugins.allow` atau hapus
`plugins.allow`; `openclaw doctor` memperingatkan bentuk ini.

`plugins.bundledDiscovery` bernilai default `"allowlist"` untuk konfigurasi baru,
sehingga inventaris `plugins.allow` yang restriktif juga memblokir plugin
penyedia bawaan yang dihilangkan, termasuk penemuan penyedia web-search runtime.
Doctor menandai konfigurasi allowlist restriktif yang lebih lama dengan `"compat"`
selama migrasi sehingga upgrade mempertahankan perilaku penyedia bawaan lama
hingga operator memilih mode yang lebih ketat. `plugins.allow` kosong tetap
diperlakukan sebagai tidak disetel/terbuka.

Perubahan konfigurasi yang dibuat melalui `/plugins enable` atau `/plugins disable`
memicu pemuatan ulang plugin Gateway dalam proses. Giliran agen baru membangun
ulang daftar alatnya dari registry plugin yang telah disegarkan. Operasi yang
mengubah sumber seperti install, update, dan uninstall tetap memulai ulang proses
Gateway karena modul plugin yang sudah diimpor tidak dapat diganti dengan aman di
tempat.

`openclaw plugins list` adalah snapshot konfigurasi/registry plugin lokal. Plugin
`enabled` di sana berarti registry tersimpan dan konfigurasi saat ini mengizinkan
plugin untuk berpartisipasi. Itu tidak membuktikan bahwa Gateway jarak jauh yang
sudah berjalan telah dimuat ulang atau dimulai ulang ke kode plugin yang sama.
Pada penyiapan VPS/container dengan proses wrapper, kirim restart atau penulisan
pemicu reload ke proses `openclaw gateway run` yang sebenarnya, atau gunakan
`openclaw gateway restart` terhadap Gateway yang berjalan saat reload melaporkan
kegagalan.

<Accordion title="Status Plugin: dinonaktifkan vs hilang vs tidak valid">
  - **Dinonaktifkan**: plugin ada tetapi aturan pengaktifan mematikannya. Konfigurasi dipertahankan.
  - **Hilang**: konfigurasi merujuk id plugin yang tidak ditemukan oleh penemuan.
  - **Tidak valid**: plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan. Startup Gateway hanya melewati plugin tersebut; `openclaw doctor --fix` dapat mengarantina entri tidak valid dengan menonaktifkannya dan menghapus payload konfigurasinya.

</Accordion>

## Penemuan dan prioritas

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Jalur konfigurasi">
    `plugins.load.paths` - jalur file atau direktori eksplisit. Jalur yang
    menunjuk kembali ke direktori plugin bawaan paket milik OpenClaw sendiri
    diabaikan; jalankan `openclaw doctor --fix` untuk menghapus alias usang itu.
  </Step>

  <Step title="Plugin ruang kerja">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (penyedia model, ucapan).
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

Install paket dan image Docker biasanya menyelesaikan plugin bawaan dari pohon
`dist/extensions` yang dikompilasi. Jika direktori sumber plugin bawaan
di-bind-mount di atas jalur sumber paket yang cocok, misalnya
`/app/extensions/synology-chat`, OpenClaw memperlakukan direktori sumber yang
di-mount tersebut sebagai overlay sumber bawaan dan menemukannya sebelum bundle
paket `/app/dist/extensions/synology-chat`. Ini menjaga loop container
maintainer tetap berfungsi tanpa mengalihkan setiap plugin bawaan kembali ke
sumber TypeScript. Atur `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk
memaksa bundle dist paket meskipun mount overlay sumber ada.

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua plugin dan melewati pekerjaan penemuan/pemuatan plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin asal ruang kerja **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set default aktif bawaan kecuali ditimpa
- Slot eksklusif dapat memaksa pengaktifan plugin yang dipilih untuk slot tersebut
- Beberapa plugin bawaan opt-in diaktifkan otomatis saat konfigurasi menamai
  surface milik plugin, seperti ref model penyedia, konfigurasi channel, atau
  runtime harness
- Konfigurasi plugin usang dipertahankan saat `plugins.enabled: false` aktif;
  aktifkan kembali plugin sebelum menjalankan pembersihan doctor jika Anda ingin
  id usang dihapus
- Rute Codex keluarga OpenAI mempertahankan batas plugin terpisah:
  `openai-codex/*` milik plugin OpenAI, sedangkan plugin app-server Codex bawaan
  dipilih oleh `agentRuntime.id: "codex"` atau ref model lama `codex/*`

## Memecahkan masalah hook runtime

Jika plugin muncul di `plugins list` tetapi efek samping atau hook `register(api)`
tidak berjalan dalam lalu lintas chat live, periksa ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan pastikan URL
  Gateway aktif, profil, jalur konfigurasi, dan proses adalah yang sedang Anda edit.
- Mulai ulang Gateway live setelah perubahan install/konfigurasi/kode plugin. Dalam
  container wrapper, PID 1 mungkin hanya supervisor; mulai ulang atau kirim sinyal
  ke proses anak `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --runtime --json` untuk memastikan registrasi hook dan
  diagnostik. Hook percakapan non-bawaan seperti `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize`, dan `agent_end` memerlukan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk pengalihan model, pilih `before_model_resolve`. Hook ini berjalan sebelum
  resolusi model untuk giliran agen; `llm_output` hanya berjalan setelah percobaan
  model menghasilkan output asisten.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau surface
  sesi/status Gateway dan, saat men-debug payload penyedia, mulai Gateway dengan
  `--raw-stream --raw-stream-path <path>`.

### Penyiapan alat plugin yang lambat

Jika giliran agen tampak macet saat menyiapkan alat, aktifkan pencatatan trace dan
periksa baris timing factory alat plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cari:

```text
[trace:plugin-tools] factory timings ...
```

Ringkasan mencantumkan total waktu factory dan factory alat plugin paling lambat,
termasuk id plugin, nama alat yang dideklarasikan, bentuk hasil, dan apakah alat
bersifat opsional. Baris lambat dipromosikan menjadi peringatan saat satu factory
memakan waktu setidaknya 1 dtk atau total persiapan factory alat plugin memakan
waktu setidaknya 5 dtk.

OpenClaw meng-cache hasil factory alat plugin yang berhasil untuk resolusi
berulang dengan konteks permintaan efektif yang sama. Kunci cache mencakup
konfigurasi runtime efektif, workspace, id agen/sesi, kebijakan sandbox,
pengaturan browser, konteks pengiriman, identitas peminta, dan status kepemilikan,
sehingga factory yang bergantung pada bidang tepercaya tersebut dijalankan ulang
saat konteks berubah.

Jika satu plugin mendominasi timing, periksa registrasi runtimenya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Lalu update, install ulang, atau nonaktifkan plugin tersebut. Penulis plugin
sebaiknya memindahkan pemuatan dependensi mahal ke belakang jalur eksekusi alat,
bukan melakukannya di dalam factory alat.

### Kepemilikan channel atau alat duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu plugin yang diaktifkan mencoba memiliki channel,
alur penyiapan, atau nama alat yang sama. Penyebab paling umum adalah plugin
channel eksternal yang diinstal berdampingan dengan plugin bawaan yang sekarang
menyediakan id channel yang sama.

Langkah debug:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap plugin
  yang diaktifkan dan asalnya.
- Jalankan `openclaw plugins inspect <id> --runtime --json` untuk setiap plugin yang dicurigai dan
  bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah menginstal atau menghapus
  paket plugin agar metadata tersimpan mencerminkan install saat ini.
- Mulai ulang Gateway setelah perubahan install, registry, atau konfigurasi.

Opsi perbaikan:

- Jika satu plugin sengaja menggantikan plugin lain untuk id channel yang sama,
  plugin yang dipilih sebaiknya mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan
  id plugin prioritas lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikatnya tidak disengaja, nonaktifkan salah satu sisi dengan
  `plugins.entries.<plugin-id>.enabled: false` atau hapus install plugin usang.
- Jika Anda secara eksplisit mengaktifkan kedua plugin, OpenClaw mempertahankan
  permintaan tersebut dan melaporkan konflik. Pilih satu pemilik untuk channel
  atau ubah nama alat milik plugin agar surface runtime tidak ambigu.

## Slot plugin (kategori eksklusif)

Beberapa kategori bersifat eksklusif (hanya satu yang aktif pada satu waktu):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | Yang dikontrol        | Default             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin memori aktif   | `memory-core`       |
| `contextEngine` | Mesin konteks aktif   | `legacy` (bawaan)   |

## Referensi CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin bawaan dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (misalnya
penyedia model bawaan, penyedia ucapan bawaan, dan Plugin browser
bawaan). Plugin bawaan lainnya tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa Plugin terpasang atau paket hook yang sudah ada di tempatnya. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk peningkatan rutin Plugin npm
yang dilacak. Ini tidak didukung dengan `--link`, yang menggunakan ulang jalur sumber alih-alih
menyalin ke target pemasangan terkelola.

Ketika `plugins.allow` sudah diatur, `openclaw plugins install` menambahkan id
Plugin yang dipasang ke allowlist tersebut sebelum mengaktifkannya. Jika id Plugin yang sama
ada di `plugins.deny`, pemasangan menghapus entri deny usang tersebut sehingga
pemasangan eksplisit dapat langsung dimuat setelah mulai ulang.

OpenClaw menyimpan registry Plugin lokal yang dipertahankan sebagai model baca awal untuk
inventaris Plugin, kepemilikan kontribusi, dan perencanaan startup. Alur pemasangan, pembaruan,
pencopotan, pengaktifan, dan penonaktifan menyegarkan registry tersebut setelah mengubah status
Plugin. File `plugins/installs.json` yang sama menyimpan metadata pemasangan tahan lama dalam
`installRecords` tingkat atas dan metadata manifes yang dapat dibangun ulang dalam `plugins`. Jika
registry hilang, usang, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifesnya dari catatan pemasangan, kebijakan konfigurasi, dan
metadata manifes/paket tanpa memuat modul runtime Plugin.

Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), mutator siklus hidup Plugin dinonaktifkan.
Kelola pemilihan paket Plugin dan konfigurasi melalui sumber Nix untuk
pemasangan sebagai gantinya; untuk nix-openclaw, mulai dari
[Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen.
`openclaw plugins update <id-or-npm-spec>` berlaku untuk pemasangan yang dilacak. Meneruskan
spesifikasi paket npm dengan dist-tag atau versi tepat menyelesaikan nama paket
kembali ke catatan Plugin yang dilacak dan mencatat spesifikasi baru untuk pembaruan berikutnya.
Meneruskan nama paket tanpa versi memindahkan pemasangan yang dipin tepat kembali ke
lini rilis default registry. Jika Plugin npm yang terpasang sudah cocok dengan
versi yang diselesaikan dan identitas artefak yang tercatat, OpenClaw melewati pembaruan
tanpa mengunduh, memasang ulang, atau menulis ulang konfigurasi.
Ketika `openclaw update` berjalan pada kanal beta, catatan Plugin npm dan ClawHub
lini default mencoba `@beta` terlebih dahulu dan kembali ke default/latest ketika tidak ada rilis
beta Plugin. Versi tepat dan tag eksplisit tetap dipin.

`--pin` hanya untuk npm. Ini tidak didukung dengan `--marketplace`, karena
pemasangan marketplace mempertahankan metadata sumber marketplace alih-alih spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override darurat untuk false positive
dari pemindai kode berbahaya bawaan. Ini memungkinkan pemasangan Plugin
dan pembaruan Plugin berlanjut melewati temuan `critical` bawaan, tetapi tetap
tidak melewati blok kebijakan `before_install` Plugin atau pemblokiran kegagalan pemindaian.
Pemindaian pemasangan mengabaikan file dan direktori pengujian umum seperti `tests/`,
`__tests__/`, `*.test.*`, dan `*.spec.*` untuk menghindari pemblokiran mock pengujian yang dikemas;
entrypoint runtime Plugin yang dideklarasikan tetap dipindai meskipun menggunakan salah satu
nama tersebut.

Flag CLI ini hanya berlaku untuk alur pemasangan/pembaruan Plugin. Pemasangan dependensi skill
berbasis Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai
sebagai gantinya, sementara `openclaw skills install` tetap menjadi alur unduh/pasang Skills
ClawHub yang terpisah.

Jika Plugin yang Anda publikasikan di ClawHub disembunyikan atau diblokir oleh pemindaian, buka
dashboard ClawHub atau jalankan `clawhub package rescan <name>` untuk meminta ClawHub memeriksanya
lagi. `--dangerously-force-unsafe-install` hanya memengaruhi pemasangan di mesin Anda sendiri;
ini tidak meminta ClawHub memindai ulang Plugin atau membuat rilis yang diblokir
menjadi publik.

Bundle yang kompatibel berpartisipasi dalam alur daftar/periksa/aktifkan/nonaktifkan Plugin
yang sama. Dukungan runtime saat ini mencakup Skills bundle, command-skills Claude,
default `settings.json` Claude, default `.lsp.json` Claude dan
`lspServers` yang dideklarasikan manifes, command-skills Cursor, serta direktori hook
Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kapabilitas bundle yang terdeteksi beserta
entri server MCP dan LSP yang didukung atau tidak didukung untuk Plugin berbasis bundle.

Sumber marketplace dapat berupa nama marketplace yang dikenal Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau
jalur `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo
GitHub, atau URL git. Untuk marketplace jarak jauh, entri Plugin harus tetap berada di dalam
repo marketplace yang dikloning dan hanya menggunakan sumber jalur relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ringkasan API Plugin

Plugin native mengekspor objek entri yang mengekspos `register(api)`. Plugin yang lebih lama
mungkin masih menggunakan `activate(api)` sebagai alias lama, tetapi Plugin baru sebaiknya
menggunakan `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw memuat objek entri dan memanggil `register(api)` selama aktivasi Plugin.
Loader tetap fallback ke `activate(api)` untuk Plugin yang lebih lama,
tetapi Plugin bawaan dan Plugin eksternal baru sebaiknya memperlakukan `register` sebagai
kontrak publik.

`api.registrationMode` memberi tahu Plugin mengapa entrinya sedang dimuat:

| Mode            | Arti                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan alat, hook, layanan, perintah, rute, dan efek samping langsung lainnya.                              |
| `discovery`     | Penemuan kapabilitas hanya-baca. Daftarkan penyedia dan metadata; kode entri Plugin tepercaya dapat dimuat, tetapi lewati efek samping langsung. |
| `setup-only`    | Pemuatan metadata penyiapan kanal melalui entri penyiapan ringan.                                                                |
| `setup-runtime` | Pemuatan penyiapan kanal yang juga membutuhkan entri runtime.                                                                         |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                            |

Entri Plugin yang membuka soket, basis data, worker latar belakang, atau klien berumur panjang
sebaiknya menjaga efek samping tersebut dengan `api.registrationMode === "full"`.
Pemuatan penemuan dicache terpisah dari pemuatan aktivasi dan tidak menggantikan
registry Gateway yang sedang berjalan. Penemuan bersifat non-aktif, bukan bebas impor:
OpenClaw dapat mengevaluasi entri Plugin tepercaya atau modul Plugin kanal untuk membangun
snapshot. Jaga tingkat atas modul tetap ringan dan bebas efek samping, serta pindahkan
klien jaringan, subprocess, listener, pembacaan kredensial, dan startup layanan
ke balik jalur runtime penuh.

Metode pendaftaran umum:

| Metode                                  | Yang didaftarkan           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Penyedia model (LLM)        |
| `registerChannel`                       | Kanal chat                |
| `registerTool`                          | Alat agen                  |
| `registerHook` / `on(...)`              | Hook siklus hidup             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT streaming               |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks       |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio        |
| `registerImageGenerationProvider`       | Pembuatan gambar            |
| `registerMusicGenerationProvider`       | Pembuatan musik            |
| `registerVideoGenerationProvider`       | Pembuatan video            |
| `registerWebFetchProvider`              | Penyedia fetch / scrape web |
| `registerWebSearchProvider`             | Pencarian web                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Perintah CLI                |
| `registerContextEngine`                 | Mesin konteks              |
| `registerService`                       | Layanan latar belakang          |

Perilaku guard hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

app-server Codex native menjalankan peristiwa alat native Codex melalui bridge kembali ke
permukaan hook ini. Plugin dapat memblokir alat Codex native melalui `before_tool_call`,
mengamati hasil melalui `after_tool_call`, dan berpartisipasi dalam persetujuan
`PermissionRequest` Codex. Bridge belum menulis ulang argumen alat native Codex.
Batas dukungan runtime Codex yang tepat ada dalam
[kontrak dukungan Codex harness v1](/id/plugins/codex-harness#v1-support-contract).

Untuk perilaku hook bertipe lengkap, lihat [ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins) - buat plugin Anda sendiri
- [Bundle Plugin](/id/plugins/bundles) - kompatibilitas bundle Codex/Claude/Cursor
- [Manifest Plugin](/id/plugins/manifest) - skema manifest
- [Mendaftarkan alat](/id/plugins/building-plugins#registering-agent-tools) - tambahkan alat agen dalam plugin
- [Internal Plugin](/id/plugins/architecture) - model kapabilitas dan pipeline pemuatan
- [Plugin komunitas](/id/plugins/community) - daftar pihak ketiga
