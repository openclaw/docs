---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami penemuan Plugin dan aturan pemuatan
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-10T19:56:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: channel, penyedia model,
harness agen, alat, skills, ucapan, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, pencarian
web, dan lainnya. Sebagian plugin bersifat **core** (dikirim bersama OpenClaw),
sebagian lainnya bersifat **eksternal**. Sebagian besar plugin eksternal
dipublikasikan dan ditemukan melalui [ClawHub](/id/clawhub). Npm tetap didukung
untuk instalasi langsung dan untuk sekumpulan sementara paket plugin milik
OpenClaw selama migrasi tersebut diselesaikan.

## Mulai cepat

Untuk contoh instalasi, daftar, penghapusan instalasi, pembaruan, dan publikasi
yang bisa disalin-tempel, lihat [Kelola plugin](/id/plugins/manage-plugins).

<Steps>
  <Step title="Lihat apa yang dimuat">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instal plugin">
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

  <Step title="Manajemen native chat">
    Dalam Gateway yang sedang berjalan, `/plugins enable` dan `/plugins disable`
    yang hanya untuk pemilik memicu pemuat ulang konfigurasi Gateway. Gateway memuat ulang permukaan runtime plugin
    di dalam proses, dan giliran agen baru membangun ulang daftar alatnya dari
    registry yang telah disegarkan. `/plugins install` mengubah kode sumber plugin, sehingga
    Gateway meminta mulai ulang alih-alih berpura-pura bahwa proses saat ini dapat
    memuat ulang modul yang sudah diimpor dengan aman.

  </Step>

  <Step title="Verifikasi plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gunakan `--runtime` saat Anda perlu membuktikan alat, layanan, metode gateway,
    hook, atau perintah CLI milik plugin yang terdaftar. `inspect` biasa adalah
    pemeriksaan manifest/registry dingin dan sengaja menghindari pengimporan runtime plugin.

  </Step>
</Steps>

Jika Anda lebih memilih kontrol native chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Jalur instalasi menggunakan resolver yang sama seperti CLI: path/arsip lokal, eksplisit
`clawhub:<pkg>`, eksplisit `npm:<pkg>`, eksplisit `npm-pack:<path.tgz>`,
eksplisit `git:<repo>`, atau spesifikasi paket polos melalui npm.

Jika konfigurasi tidak valid, instalasi biasanya gagal tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur sempit
instalasi ulang plugin bundel untuk plugin yang ikut serta dalam
`openclaw.install.allowInvalidConfigRecovery`.
Selama startup Gateway, konfigurasi plugin yang tidak valid gagal tertutup seperti konfigurasi
tidak valid lainnya. Jalankan `openclaw doctor --fix` untuk mengarantina konfigurasi plugin yang buruk dengan
menonaktifkan entri plugin tersebut dan menghapus payload konfigurasinya yang tidak valid; cadangan
konfigurasi normal menyimpan nilai sebelumnya.
Ketika konfigurasi channel merujuk plugin yang tidak lagi dapat ditemukan tetapi
id plugin usang yang sama tetap ada dalam konfigurasi plugin atau catatan instalasi, startup Gateway
mencatat peringatan dan melewati channel tersebut alih-alih memblokir setiap channel lain.
Jalankan `openclaw doctor --fix` untuk menghapus entri channel/plugin yang usang; kunci
channel yang tidak dikenal tanpa bukti plugin usang tetap gagal validasi sehingga typo tetap
terlihat.
Jika `plugins.enabled: false` disetel, referensi plugin usang diperlakukan sebagai inert:
startup Gateway melewati pekerjaan penemuan/pemuatan plugin dan `openclaw doctor` mempertahankan
konfigurasi plugin yang dinonaktifkan alih-alih menghapusnya otomatis. Aktifkan kembali plugin sebelum
menjalankan pembersihan doctor jika Anda ingin id plugin usang dihapus.

Instalasi dependensi plugin hanya terjadi selama alur instalasi/pembaruan eksplisit atau
perbaikan doctor. Startup Gateway, pemuatan ulang konfigurasi, dan inspeksi runtime tidak
menjalankan package manager atau memperbaiki pohon dependensi. Plugin lokal harus sudah
memiliki dependensinya terinstal, sementara plugin npm, git, dan ClawHub
diinstal di bawah root plugin terkelola OpenClaw. Dependensi npm dapat di-hoist
di dalam root npm terkelola OpenClaw; instalasi/pembaruan memindai root terkelola tersebut sebelum
trust dan penghapusan instalasi menghapus paket terkelola npm melalui npm. Plugin eksternal
dan path pemuatan khusus tetap harus diinstal melalui `openclaw plugins install`.
Gunakan `openclaw plugins list --json` untuk melihat `dependencyStatus` statis untuk setiap
plugin yang terlihat tanpa mengimpor kode runtime atau memperbaiki dependensi.
Lihat [Resolusi dependensi plugin](/id/plugins/dependency-resolution) untuk siklus hidup
saat instalasi.

### Kepemilikan path plugin yang diblokir

Jika diagnostik plugin mengatakan
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
dan validasi konfigurasi berlanjut dengan `plugin present but blocked`, OpenClaw menemukan
file plugin yang dimiliki oleh pengguna Unix yang berbeda dari proses yang memuatnya.
Biarkan konfigurasi plugin tetap ada; perbaiki kepemilikan filesystem atau jalankan
OpenClaw sebagai pengguna yang sama dengan pemilik direktori state.

Untuk instalasi Docker, image resmi berjalan sebagai `node` (uid `1000`), sehingga
direktori konfigurasi dan workspace OpenClaw yang di-bind mount dari host biasanya harus
dimiliki oleh uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jika Anda sengaja menjalankan OpenClaw sebagai root, perbaiki root plugin terkelola menjadi
kepemilikan root sebagai gantinya:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Setelah memperbaiki kepemilikan, jalankan ulang `openclaw doctor --fix` atau
`openclaw plugins registry --refresh` agar registry plugin persisten sesuai dengan
file yang telah diperbaiki.

Untuk instalasi npm, selector mutable seperti `latest` atau dist-tag di-resolve
sebelum instalasi lalu di-pin ke versi terverifikasi yang persis di root npm
terkelola OpenClaw. Setelah npm selesai, OpenClaw memverifikasi bahwa entri
`package-lock.json` yang terinstal masih cocok dengan versi dan integritas yang di-resolve. Jika
npm menulis metadata paket yang berbeda, instalasi gagal dan paket terkelola
di-rollback alih-alih menerima artefak plugin yang berbeda.
Root npm terkelola juga mewarisi `overrides` npm tingkat paket OpenClaw, sehingga
pin keamanan yang melindungi host terpaket juga berlaku untuk dependensi
plugin eksternal yang di-hoist.

Checkout sumber adalah workspace pnpm. Jika Anda meng-clone OpenClaw untuk mengerjakan plugin
bundel, jalankan `pnpm install`; OpenClaw kemudian memuat plugin bundel dari
`extensions/<id>` sehingga edit dan dependensi lokal paket digunakan langsung.
Instalasi root npm biasa ditujukan untuk OpenClaw terpaket, bukan pengembangan
checkout sumber.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                      | Contoh                                                 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi dalam proses    | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak yang kompatibel dengan Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundel Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entrypoint paket

Paket npm plugin native harus mendeklarasikan `openclaw.extensions` dalam `package.json`.
Setiap entri harus tetap berada di dalam direktori paket dan di-resolve ke file
runtime yang dapat dibaca, atau ke file sumber TypeScript dengan peer JavaScript
terbangun yang disimpulkan seperti `src/index.ts` ke `dist/index.js`.
Instalasi terpaket harus mengirimkan output runtime JavaScript tersebut. Fallback
sumber TypeScript ditujukan untuk checkout sumber dan path pengembangan lokal, bukan untuk
paket npm yang diinstal ke root plugin terkelola OpenClaw.

Jika peringatan paket terkelola mengatakan bahwa paket tersebut `requires compiled runtime output for
TypeScript entry ...`, paket dipublikasikan tanpa file JavaScript yang
dibutuhkan OpenClaw saat runtime. Itu adalah masalah pengemasan plugin, bukan masalah konfigurasi
lokal. Perbarui atau instal ulang plugin setelah penerbit memublikasikan ulang JavaScript
terkompilasi, atau nonaktifkan/hapus instalasi plugin tersebut sampai paket yang diperbaiki tersedia.

Gunakan `openclaw.runtimeExtensions` saat file runtime yang dipublikasikan tidak berada di
path yang sama dengan entri sumber. Jika ada, `runtimeExtensions` harus berisi
tepat satu entri untuk setiap entri `extensions`. Daftar yang tidak cocok menggagalkan instalasi dan
penemuan plugin alih-alih diam-diam fallback ke path sumber. Jika Anda juga
memublikasikan `openclaw.setupEntry`, gunakan `openclaw.runtimeSetupEntry` untuk peer
JavaScript terbangunnya; file tersebut wajib ada saat dideklarasikan.

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

ClawHub adalah jalur distribusi utama untuk sebagian besar plugin. Rilis OpenClaw terpaket saat ini
sudah membundel banyak plugin resmi, sehingga plugin tersebut tidak memerlukan
instalasi npm terpisah dalam setup normal. Hingga setiap plugin milik OpenClaw
telah bermigrasi ke ClawHub, OpenClaw masih mengirimkan beberapa paket plugin `@openclaw/*` di
npm untuk instalasi lama/khusus dan workflow npm langsung.

Jika npm melaporkan paket plugin `@openclaw/*` sebagai deprecated, versi paket tersebut
berasal dari rangkaian paket eksternal yang lebih lama. Gunakan plugin bundel dari
OpenClaw saat ini atau checkout lokal sampai paket npm yang lebih baru dipublikasikan.

| Plugin          | Paket                      | Dokumentasi                                |
| --------------- | -------------------------- | ------------------------------------------ |
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

### Core (dikirim bersama OpenClaw)

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
    - `memory-lancedb` - memori jangka panjang berbasis LanceDB dengan ingat/perekaman otomatis (atur `plugins.slots.memory = "memory-lancedb"`)

    Lihat [Memory LanceDB](/id/plugins/memory-lancedb) untuk penyiapan embedding yang kompatibel dengan OpenAI, contoh Ollama, batas ingat, dan pemecahan masalah.

  </Accordion>

  <Accordion title="Penyedia ucapan (diaktifkan secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` - Plugin browser bawaan untuk alat browser, CLI `openclaw browser`, metode gateway `browser.request`, runtime browser, dan layanan kontrol browser default (diaktifkan secara default; nonaktifkan sebelum menggantinya)
    - `copilot-proxy` - bridge VS Code Copilot Proxy (dinonaktifkan secara default)

  </Accordion>
</AccordionGroup>

Mencari plugin pihak ketiga? Lihat [ClawHub](/id/clawhub).

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
| `allow`            | Allowlist Plugin (opsional)                               |
| `bundledDiscovery` | Mode penemuan Plugin bawaan (`allowlist` secara default)  |
| `deny`             | Denylist Plugin (opsional; deny menang)                   |
| `load.paths`       | File/direktori Plugin tambahan                            |
| `slots`            | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>`   | Sakelar per Plugin + konfigurasi                          |

`plugins.allow` bersifat eksklusif. Jika tidak kosong, hanya plugin yang tercantum yang dapat dimuat atau mengekspos alat, meskipun `tools.allow` berisi `"*"` atau nama alat milik plugin tertentu. Jika allowlist alat merujuk ke alat plugin, tambahkan id plugin pemilik ke `plugins.allow` atau hapus `plugins.allow`; `openclaw doctor` memperingatkan tentang bentuk ini.

`plugins.bundledDiscovery` bernilai default `"allowlist"` untuk konfigurasi baru, sehingga inventaris `plugins.allow` yang ketat juga memblokir plugin penyedia bawaan yang dihilangkan, termasuk penemuan penyedia pencarian web runtime. Doctor menandai konfigurasi allowlist ketat yang lebih lama dengan `"compat"` selama migrasi sehingga peningkatan tetap mempertahankan perilaku penyedia bawaan lama sampai operator memilih mode yang lebih ketat. `plugins.allow` kosong tetap diperlakukan sebagai belum diatur/terbuka.

Perubahan konfigurasi yang dibuat melalui `/plugins enable` atau `/plugins disable` memicu pemuatan ulang Plugin Gateway di dalam proses. Giliran agen baru membangun ulang daftar alatnya dari registri Plugin yang telah disegarkan. Operasi yang mengubah sumber seperti install, update, dan uninstall tetap memulai ulang proses Gateway karena modul Plugin yang sudah diimpor tidak dapat diganti dengan aman di tempat.

`openclaw plugins list` adalah snapshot registri/konfigurasi Plugin lokal. Plugin `enabled` di sana berarti registri tersimpan dan konfigurasi saat ini mengizinkan Plugin untuk berpartisipasi. Ini tidak membuktikan bahwa Gateway jarak jauh yang sudah berjalan telah dimuat ulang atau dimulai ulang ke kode Plugin yang sama. Pada penyiapan VPS/container dengan proses wrapper, kirim restart atau penulisan yang memicu reload ke proses `openclaw gateway run` yang sebenarnya, atau gunakan `openclaw gateway restart` terhadap Gateway yang berjalan ketika reload melaporkan kegagalan.

<Accordion title="Status Plugin: dinonaktifkan vs hilang vs tidak valid">
  - **Dinonaktifkan**: Plugin ada tetapi aturan pengaktifan mematikannya. Konfigurasi dipertahankan.
  - **Hilang**: konfigurasi merujuk ke id Plugin yang tidak ditemukan oleh penemuan.
  - **Tidak valid**: Plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan. Startup Gateway hanya melewati Plugin tersebut; `openclaw doctor --fix` dapat mengarantina entri yang tidak valid dengan menonaktifkannya dan menghapus payload konfigurasinya.

</Accordion>

## Penemuan dan prioritas

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Jalur konfigurasi">
    `plugins.load.paths` - jalur file atau direktori eksplisit. Jalur yang menunjuk kembali ke direktori Plugin bawaan dalam paket OpenClaw sendiri diabaikan; jalankan `openclaw doctor --fix` untuk menghapus alias usang tersebut.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (penyedia model, ucapan). Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

Instalasi paket dan image Docker biasanya menyelesaikan Plugin bawaan dari pohon `dist/extensions` yang dikompilasi. Jika direktori sumber Plugin bawaan di-bind-mount di atas jalur sumber paket yang cocok, misalnya `/app/extensions/synology-chat`, OpenClaw memperlakukan direktori sumber yang di-mount tersebut sebagai overlay sumber bawaan dan menemukannya sebelum bundle `/app/dist/extensions/synology-chat` yang dipaketkan. Ini menjaga loop container maintainer tetap berfungsi tanpa mengalihkan setiap Plugin bawaan kembali ke sumber TypeScript. Atur `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk memaksa bundle dist paket meskipun mount overlay sumber ada.

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua plugin dan melewati pekerjaan penemuan/pemuatan Plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan Plugin tersebut
- Plugin asal workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set default-aktif bawaan kecuali ditimpa
- Slot eksklusif dapat memaksa aktif Plugin yang dipilih untuk slot tersebut
- Beberapa Plugin bawaan opt-in diaktifkan secara otomatis ketika konfigurasi menamai surface milik Plugin, seperti ref model penyedia, konfigurasi channel, atau runtime harness
- Konfigurasi Plugin usang dipertahankan selama `plugins.enabled: false` aktif; aktifkan ulang plugin sebelum menjalankan pembersihan doctor jika Anda ingin id usang dihapus
- Rute Codex keluarga OpenAI mempertahankan batas Plugin terpisah:
  `openai-codex/*` milik Plugin OpenAI, sedangkan Plugin app-server Codex bawaan dipilih oleh ref agen `openai/*` kanonis, `agentRuntime.id: "codex"` penyedia/model eksplisit, atau ref model `codex/*` lama

## Memecahkan masalah hook runtime

Jika sebuah Plugin muncul di `plugins list` tetapi efek samping atau hook `register(api)` tidak berjalan dalam lalu lintas chat live, periksa ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan pastikan URL Gateway aktif, profil, jalur konfigurasi, dan proses adalah yang sedang Anda edit.
- Mulai ulang Gateway live setelah perubahan install/konfigurasi/kode Plugin. Di container wrapper, PID 1 mungkin hanya supervisor; mulai ulang atau kirim sinyal ke proses anak `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --runtime --json` untuk mengonfirmasi pendaftaran hook dan diagnostik. Hook percakapan non-bawaan seperti `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`, `before_agent_finalize`, dan `agent_end` memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk pengalihan model, pilih `before_model_resolve`. Ini berjalan sebelum resolusi model untuk giliran agen; `llm_output` hanya berjalan setelah percobaan model menghasilkan output asisten.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau surface sesi/status Gateway dan, ketika men-debug payload penyedia, mulai Gateway dengan `--raw-stream --raw-stream-path <path>`.

### Penyiapan alat Plugin lambat

Jika giliran agen tampak tersendat saat menyiapkan alat, aktifkan logging trace dan periksa baris timing factory alat Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cari:

```text
[trace:plugin-tools] factory timings ...
```

Ringkasan mencantumkan total waktu factory dan factory alat Plugin paling lambat, termasuk id Plugin, nama alat yang dideklarasikan, bentuk hasil, dan apakah alat tersebut opsional. Baris lambat dinaikkan menjadi peringatan ketika satu factory memerlukan setidaknya 1 dtk atau total persiapan factory alat Plugin memerlukan setidaknya 5 dtk.

OpenClaw menyimpan hasil factory alat Plugin yang berhasil dalam cache untuk resolusi berulang dengan konteks permintaan efektif yang sama. Kunci cache mencakup konfigurasi runtime efektif, workspace, id agen/sesi, kebijakan sandbox, pengaturan browser, konteks pengiriman, identitas peminta, dan status kepemilikan, sehingga factory yang bergantung pada bidang tepercaya tersebut dijalankan ulang ketika konteks berubah.

Jika satu Plugin mendominasi timing, periksa pendaftaran runtimenya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Lalu perbarui, pasang ulang, atau nonaktifkan Plugin tersebut. Penulis Plugin sebaiknya memindahkan pemuatan dependensi yang mahal ke balik jalur eksekusi alat, bukan melakukannya di dalam factory alat.

### Kepemilikan channel atau alat duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu Plugin aktif mencoba memiliki channel, alur penyiapan, atau nama alat yang sama. Penyebab paling umum adalah Plugin channel eksternal yang dipasang berdampingan dengan Plugin bawaan yang sekarang menyediakan id channel yang sama.

Langkah debug:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap Plugin aktif dan asalnya.
- Jalankan `openclaw plugins inspect <id> --runtime --json` untuk setiap Plugin yang dicurigai dan bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah memasang atau menghapus paket Plugin agar metadata tersimpan mencerminkan instalasi saat ini.
- Mulai ulang Gateway setelah perubahan install, registri, atau konfigurasi.

Opsi perbaikan:

- Jika satu Plugin sengaja menggantikan yang lain untuk id channel yang sama, Plugin pilihan harus mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan id Plugin berprioritas lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikat tidak disengaja, nonaktifkan salah satu sisi dengan `plugins.entries.<plugin-id>.enabled: false` atau hapus instalasi Plugin usang.
- Jika Anda mengaktifkan kedua Plugin secara eksplisit, OpenClaw mempertahankan permintaan tersebut dan melaporkan konflik. Pilih satu pemilik untuk channel atau ganti nama alat milik Plugin agar surface runtime tidak ambigu.

## Slot Plugin (kategori eksklusif)

Beberapa kategori bersifat eksklusif (hanya satu aktif pada satu waktu):

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
penyedia model bawaan, penyedia ucapan bawaan, dan plugin peramban
bawaan). Plugin bawaan lainnya masih memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin atau paket hook terpasang yang sudah ada di tempatnya. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk pemutakhiran rutin Plugin npm yang dilacak.
Ini tidak didukung bersama `--link`, yang menggunakan ulang jalur sumber alih-alih
menyalin ke target pemasangan terkelola.

Saat `plugins.allow` sudah ditetapkan, `openclaw plugins install` menambahkan
id plugin yang dipasang ke daftar izin tersebut sebelum mengaktifkannya. Jika id plugin yang sama
ada di `plugins.deny`, pemasangan menghapus entri penolakan lama tersebut sehingga
pemasangan eksplisit langsung dapat dimuat setelah dimulai ulang.

OpenClaw menyimpan registri Plugin lokal yang dipersistenkan sebagai model baca dingin untuk
inventaris plugin, kepemilikan kontribusi, dan perencanaan startup. Alur pemasangan, pemutakhiran,
penghapusan pemasangan, pengaktifan, dan penonaktifan menyegarkan registri tersebut setelah mengubah status plugin. File `plugins/installs.json` yang sama menyimpan metadata pemasangan tahan lama di
`installRecords` tingkat atas dan metadata manifes yang dapat dibangun ulang di `plugins`. Jika
registri hilang, usang, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifesnya dari catatan pemasangan, kebijakan config, dan
metadata manifes/paket tanpa memuat modul runtime plugin.

Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), mutator siklus hidup plugin dinonaktifkan.
Kelola pemilihan paket plugin dan config melalui sumber Nix untuk
pemasangan sebagai gantinya; untuk nix-openclaw, mulai dengan
[Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang berfokus pada agen.
`openclaw plugins update <id-or-npm-spec>` berlaku untuk pemasangan yang dilacak. Memberikan
spec paket npm dengan dist-tag atau versi eksak menyelesaikan nama paket
kembali ke catatan plugin yang dilacak dan mencatat spec baru untuk pemutakhiran berikutnya.
Memberikan nama paket tanpa versi memindahkan pemasangan yang dipin secara eksak kembali ke
jalur rilis default registri. Jika Plugin npm yang terpasang sudah cocok dengan
versi yang diselesaikan dan identitas artefak yang tercatat, OpenClaw melewati pemutakhiran
tanpa mengunduh, memasang ulang, atau menulis ulang config.
Saat `openclaw update` berjalan pada kanal beta, catatan plugin npm dan ClawHub
jalur default mencoba `@beta` terlebih dahulu dan kembali ke default/latest saat tidak ada rilis
beta plugin. Versi eksak dan tag eksplisit tetap dipin.

`--pin` hanya untuk npm. Ini tidak didukung bersama `--marketplace`, karena
pemasangan marketplace mempertahankan metadata sumber marketplace alih-alih spec npm.

`--dangerously-force-unsafe-install` adalah override darurat untuk false positive
dari pemindai kode berbahaya bawaan. Ini memungkinkan pemasangan plugin
dan pemutakhiran plugin berlanjut melewati temuan `critical` bawaan, tetapi tetap
tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian.
Pemindaian pemasangan mengabaikan file dan direktori pengujian umum seperti `tests/`,
`__tests__/`, `*.test.*`, dan `*.spec.*` untuk menghindari pemblokiran mock pengujian yang dikemas;
entrypoint runtime plugin yang dideklarasikan tetap dipindai meskipun menggunakan salah satu
nama tersebut.

Flag CLI ini hanya berlaku untuk alur pemasangan/pemutakhiran plugin. Pemasangan dependensi skill
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai
sebagai gantinya, sedangkan `openclaw skills install` tetap menjadi alur terpisah untuk
pengunduhan/pemasangan skill ClawHub.

Jika plugin yang Anda publikasikan di ClawHub disembunyikan atau diblokir oleh pemindaian, buka
dasbor ClawHub atau jalankan `clawhub package rescan <name>` untuk meminta ClawHub memeriksanya lagi.
`--dangerously-force-unsafe-install` hanya memengaruhi pemasangan di mesin Anda sendiri;
ini tidak meminta ClawHub memindai ulang plugin atau membuat rilis yang diblokir
menjadi publik.

Bundle yang kompatibel berpartisipasi dalam alur daftar/periksa/aktifkan/nonaktifkan plugin yang sama.
Dukungan runtime saat ini mencakup skill bundle, command-skill Claude,
default `settings.json` Claude, default `.lsp.json` Claude dan
`lspServers` yang dideklarasikan manifes, command-skill Cursor, dan direktori hook
Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kemampuan bundle yang terdeteksi beserta
entri server MCP dan LSP yang didukung atau tidak didukung untuk plugin yang didukung bundle.

Sumber marketplace dapat berupa nama known-marketplace Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau
jalur `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo
GitHub, atau URL git. Untuk marketplace jarak jauh, entri plugin harus tetap berada di dalam
repo marketplace yang dikloning dan hanya menggunakan sumber jalur relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ikhtisar API Plugin

Plugin native mengekspor objek entri yang mengekspos `register(api)`. Plugin lama
mungkin masih menggunakan `activate(api)` sebagai alias lama, tetapi plugin baru sebaiknya
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

OpenClaw memuat objek entri dan memanggil `register(api)` selama aktivasi
plugin. Loader masih fallback ke `activate(api)` untuk plugin lama,
tetapi plugin bawaan dan plugin eksternal baru sebaiknya memperlakukan `register` sebagai
kontrak publik.

`api.registrationMode` memberi tahu plugin mengapa entrinya dimuat:

| Mode            | Makna                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan tool, hook, layanan, perintah, route, dan efek samping aktif lainnya.                                |
| `discovery`     | Penemuan kemampuan hanya baca. Daftarkan penyedia dan metadata; kode entri plugin tepercaya dapat dimuat, tetapi lewati efek samping aktif. |
| `setup-only`    | Pemuatan metadata penyiapan kanal melalui entri penyiapan ringan.                                                                |
| `setup-runtime` | Pemuatan penyiapan kanal yang juga memerlukan entri runtime.                                                                     |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                         |

Entri plugin yang membuka soket, database, worker latar belakang, atau klien
berumur panjang sebaiknya membatasi efek samping tersebut dengan `api.registrationMode === "full"`.
Pemuatan discovery di-cache secara terpisah dari pemuatan aktivasi dan tidak menggantikan
registri Gateway yang sedang berjalan. Discovery bersifat tidak mengaktifkan, bukan bebas impor:
OpenClaw dapat mengevaluasi entri plugin tepercaya atau modul plugin kanal untuk membangun
snapshot. Jaga tingkat teratas modul tetap ringan dan bebas efek samping, dan pindahkan
klien jaringan, subprocess, listener, pembacaan kredensial, dan startup layanan
ke balik jalur runtime penuh.

Metode pendaftaran umum:

| Metode                                  | Yang didaftarkan             |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Penyedia model (LLM)         |
| `registerChannel`                       | Kanal chat                   |
| `registerTool`                          | Tool agen                    |
| `registerHook` / `on(...)`              | Hook siklus hidup            |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | STT streaming                |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks       |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio        |
| `registerImageGenerationProvider`       | Pembuatan gambar             |
| `registerMusicGenerationProvider`       | Pembuatan musik              |
| `registerVideoGenerationProvider`       | Pembuatan video              |
| `registerWebFetchProvider`              | Penyedia fetch / scrape web  |
| `registerWebSearchProvider`             | Pencarian web                |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Perintah CLI                 |
| `registerContextEngine`                 | Mesin konteks                |
| `registerService`                       | Layanan latar belakang       |

Perilaku penjaga hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

Server aplikasi Codex bawaan menjembatani peristiwa alat bawaan Codex kembali ke permukaan kait ini. Plugin dapat memblokir alat bawaan Codex melalui `before_tool_call`, mengamati hasil melalui `after_tool_call`, dan berpartisipasi dalam persetujuan `PermissionRequest` Codex. Jembatan belum menulis ulang argumen alat bawaan Codex. Batas dukungan runtime Codex yang tepat ada dalam
[kontrak dukungan Codex harness v1](/id/plugins/codex-harness-runtime#v1-support-contract).

Untuk perilaku kait bertipe lengkap, lihat [ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins) - buat Plugin Anda sendiri
- [Bundel Plugin](/id/plugins/bundles) - kompatibilitas bundel Codex/Claude/Cursor
- [Manifes Plugin](/id/plugins/manifest) - skema manifes
- [Mendaftarkan alat](/id/plugins/building-plugins#registering-agent-tools) - tambahkan alat agen di Plugin
- [Internal Plugin](/id/plugins/architecture) - model kapabilitas dan alur pemuatan
- [ClawHub](/id/clawhub) - penemuan Plugin pihak ketiga
