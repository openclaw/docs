---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami aturan penemuan dan pemuatan Plugin
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasi, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-03T21:38:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: channel, penyedia model,
harness agen, alat, Skills, ucapan, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, pencarian
web, dan lainnya. Beberapa plugin bersifat **inti** (dikirim bersama OpenClaw),
sementara yang lain bersifat **eksternal**. Sebagian besar plugin eksternal
dipublikasikan dan ditemukan melalui [ClawHub](/id/tools/clawhub). Npm tetap
didukung untuk pemasangan langsung dan untuk kumpulan sementara paket plugin
milik OpenClaw hingga migrasi tersebut selesai.

## Mulai cepat

Untuk contoh pemasangan, daftar, pencopotan, pembaruan, dan penerbitan yang
dapat disalin-tempel, lihat [Kelola plugin](/id/plugins/manage-plugins).

<Steps>
  <Step title="Lihat apa yang dimuat">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Pasang plugin">
    ```bash
    # Cari plugin ClawHub
    openclaw plugins search "calendar"

    # Dari ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # Dari npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # Dari git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # Dari direktori atau arsip lokal
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
    khusus pemilik memicu pemuat ulang konfigurasi Gateway. Gateway memuat ulang
    permukaan runtime plugin dalam proses, dan giliran agen baru membangun ulang
    daftar alatnya dari registri yang telah disegarkan. `/plugins install`
    mengubah kode sumber plugin, sehingga Gateway meminta mulai ulang alih-alih
    berpura-pura bahwa proses saat ini dapat memuat ulang modul yang sudah
    diimpor dengan aman.

  </Step>

  <Step title="Verifikasi plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # Jika plugin mendaftarkan root CLI, jalankan satu perintah dari root tersebut.
    openclaw <plugin-command> --help
    ```

    Gunakan `--runtime` ketika Anda perlu membuktikan alat, layanan, metode
    gateway, hook, atau perintah CLI milik plugin yang terdaftar. `inspect` biasa
    adalah pemeriksaan manifes/registri dingin dan sengaja menghindari pengimporan
    runtime plugin.

  </Step>
</Steps>

Jika Anda lebih memilih kontrol native chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Jalur pemasangan menggunakan resolver yang sama dengan CLI: path/arsip lokal,
`clawhub:<pkg>` eksplisit, `npm:<pkg>` eksplisit, `git:<repo>` eksplisit, atau
spesifikasi paket polos melalui npm.

Jika konfigurasi tidak valid, pemasangan biasanya gagal tertutup dan mengarahkan
Anda ke `openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur
pemasangan ulang plugin bawaan yang sempit untuk plugin yang memilih ikut
`openclaw.install.allowInvalidConfigRecovery`.
Selama startup Gateway, konfigurasi plugin yang tidak valid gagal tertutup seperti
konfigurasi tidak valid lainnya. Jalankan `openclaw doctor --fix` untuk
mengarantina konfigurasi plugin yang bermasalah dengan menonaktifkan entri plugin
tersebut dan menghapus payload konfigurasi yang tidak valid; cadangan konfigurasi
normal mempertahankan nilai sebelumnya.
Ketika konfigurasi channel merujuk ke plugin yang tidak lagi dapat ditemukan tetapi
id plugin usang yang sama tetap ada dalam konfigurasi plugin atau catatan
pemasangan, startup Gateway mencatat peringatan dan melewati channel tersebut
alih-alih memblokir semua channel lain.
Jalankan `openclaw doctor --fix` untuk menghapus entri channel/plugin yang usang;
kunci channel yang tidak dikenal tanpa bukti plugin usang tetap gagal divalidasi
agar salah ketik tetap terlihat.
Jika `plugins.enabled: false` disetel, referensi plugin usang diperlakukan sebagai
tidak aktif: startup Gateway melewati pekerjaan penemuan/pemuatan plugin dan
`openclaw doctor` mempertahankan konfigurasi plugin yang dinonaktifkan alih-alih
menghapusnya otomatis. Aktifkan kembali plugin sebelum menjalankan pembersihan
doctor jika Anda ingin id plugin usang dihapus.

Pemasangan dependensi plugin hanya terjadi selama alur pemasangan/pembaruan
eksplisit atau perbaikan doctor. Startup Gateway, pemuatan ulang konfigurasi, dan
inspeksi runtime tidak menjalankan pengelola paket atau memperbaiki pohon
dependensi. Plugin lokal harus sudah memiliki dependensinya terpasang, sementara
plugin npm, git, dan ClawHub dipasang di bawah root plugin terkelola OpenClaw.
Dependensi npm dapat di-hoist dalam root npm terkelola OpenClaw; pemasangan/
pembaruan memindai root terkelola tersebut sebelum mempercayai dan pencopotan
menghapus paket yang dikelola npm melalui npm. Plugin eksternal dan path muat
khusus tetap harus dipasang melalui `openclaw plugins install`.
Gunakan `openclaw plugins list --json` untuk melihat `dependencyStatus` statis
untuk setiap plugin yang terlihat tanpa mengimpor kode runtime atau memperbaiki
dependensi.
Lihat [Resolusi dependensi Plugin](/id/plugins/dependency-resolution) untuk siklus
hidup saat pemasangan.

Untuk pemasangan npm, selector yang dapat berubah seperti `latest` atau dist-tag
diresolusi sebelum pemasangan lalu dipinkan ke versi persis yang telah diverifikasi
dalam root npm terkelola OpenClaw. Setelah npm selesai, OpenClaw memverifikasi
bahwa entri `package-lock.json` yang terpasang masih cocok dengan versi dan
integritas yang diresolusi. Jika npm menulis metadata paket yang berbeda,
pemasangan gagal dan paket terkelola di-rollback alih-alih menerima artefak
plugin yang berbeda.

Checkout sumber adalah workspace pnpm. Jika Anda mengkloning OpenClaw untuk
mengutak-atik plugin bawaan, jalankan `pnpm install`; OpenClaw kemudian memuat
plugin bawaan dari `extensions/<id>` sehingga perubahan dan dependensi lokal
paket digunakan langsung.
Pemasangan root npm biasa ditujukan untuk OpenClaw terpaket, bukan pengembangan
checkout sumber.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                      | Contoh                                                 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi dalam proses    | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak kompatibel Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundle Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entry point paket

Paket npm plugin native harus mendeklarasikan `openclaw.extensions` dalam `package.json`.
Setiap entri harus tetap berada di dalam direktori paket dan meresolusi ke file
runtime yang dapat dibaca, atau ke file sumber TypeScript dengan peer JavaScript
terbangun yang diinferensikan seperti `src/index.ts` ke `dist/index.js`.
Pemasangan terpaket harus mengirimkan output runtime JavaScript tersebut. Fallback
sumber TypeScript ditujukan untuk checkout sumber dan path pengembangan lokal,
bukan untuk paket npm yang dipasang ke root plugin terkelola OpenClaw.

Gunakan `openclaw.runtimeExtensions` ketika file runtime yang dipublikasikan tidak
berada di path yang sama dengan entri sumber. Saat ada, `runtimeExtensions` harus
berisi tepat satu entri untuk setiap entri `extensions`. Daftar yang tidak cocok
membuat pemasangan dan penemuan plugin gagal alih-alih diam-diam fallback ke path
sumber. Jika Anda juga memublikasikan `openclaw.setupEntry`, gunakan
`openclaw.runtimeSetupEntry` untuk peer JavaScript terbangunnya; file tersebut
wajib ada ketika dideklarasikan.

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

ClawHub adalah jalur distribusi utama untuk sebagian besar plugin. Rilis OpenClaw
terpaket saat ini sudah membundel banyak plugin resmi, sehingga plugin tersebut
tidak memerlukan pemasangan npm terpisah dalam penyiapan normal. Hingga setiap
plugin milik OpenClaw bermigrasi ke ClawHub, OpenClaw masih mengirimkan beberapa
paket plugin `@openclaw/*` di npm untuk pemasangan lama/khusus dan alur kerja npm
langsung.

Jika npm melaporkan paket plugin `@openclaw/*` sebagai deprecated, versi paket
tersebut berasal dari rangkaian paket eksternal yang lebih lama. Gunakan plugin
bawaan dari OpenClaw saat ini atau checkout lokal hingga paket npm yang lebih baru
dipublikasikan.

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
    - `memory-core` — pencarian memori bawaan (default melalui `plugins.slots.memory`)
    - `memory-lancedb` — memori jangka panjang berbasis LanceDB dengan auto-recall/capture (setel `plugins.slots.memory = "memory-lancedb"`)

    Lihat [Memory LanceDB](/id/plugins/memory-lancedb) untuk penyiapan embedding
    kompatibel OpenAI, contoh Ollama, batas recall, dan pemecahan masalah.

  </Accordion>

  <Accordion title="Penyedia ucapan (diaktifkan secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` — plugin browser bawaan untuk alat browser, CLI `openclaw browser`, metode gateway `browser.request`, runtime browser, dan layanan kontrol browser default (diaktifkan secara default; nonaktifkan sebelum menggantinya)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (dinonaktifkan secara default)

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

| Bidang          | Deskripsi                                                 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Sakelar utama (default: `true`)                           |
| `allow`          | Daftar izin Plugin (opsional)                             |
| `deny`           | Daftar tolak Plugin (opsional; tolak menang)              |
| `load.paths`     | File/direktori Plugin tambahan                            |
| `slots`          | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>` | Sakelar per-Plugin + konfigurasi                          |

`plugins.allow` bersifat eksklusif. Saat tidak kosong, hanya Plugin yang
tercantum yang dapat dimuat atau mengekspos alat, bahkan jika `tools.allow`
berisi `"*"` atau nama alat milik Plugin tertentu. Jika daftar izin alat
mereferensikan alat Plugin, tambahkan id Plugin pemilik ke `plugins.allow` atau
hapus `plugins.allow`; `openclaw doctor` memperingatkan bentuk ini.

Perubahan konfigurasi yang dibuat melalui `/plugins enable` atau
`/plugins disable` memicu pemuatan ulang Plugin Gateway di dalam proses. Giliran
agen baru membangun ulang daftar alatnya dari registri Plugin yang sudah
diperbarui. Operasi yang mengubah sumber seperti install, update, dan uninstall
tetap memulai ulang proses Gateway karena modul Plugin yang sudah diimpor tidak
dapat diganti di tempat dengan aman.

`openclaw plugins list` adalah snapshot registri/konfigurasi Plugin lokal.
Plugin `enabled` di sana berarti registri tersimpan dan konfigurasi saat ini
mengizinkan Plugin ikut berpartisipasi. Itu tidak membuktikan bahwa Gateway
jarak jauh yang sudah berjalan telah dimuat ulang atau dimulai ulang ke kode
Plugin yang sama. Pada penyiapan VPS/container dengan proses pembungkus, kirim
restart atau penulisan yang memicu pemuatan ulang ke proses
`openclaw gateway run` yang sebenarnya, atau gunakan `openclaw gateway restart`
terhadap Gateway yang sedang berjalan saat pemuatan ulang melaporkan kegagalan.

<Accordion title="Status Plugin: dinonaktifkan vs hilang vs tidak valid">
  - **Dinonaktifkan**: Plugin ada tetapi aturan pengaktifan mematikannya. Konfigurasi dipertahankan.
  - **Hilang**: konfigurasi mereferensikan id Plugin yang tidak ditemukan oleh discovery.
  - **Tidak valid**: Plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan. Startup Gateway hanya melewati Plugin tersebut; `openclaw doctor --fix` dapat mengarantina entri yang tidak valid dengan menonaktifkannya dan menghapus payload konfigurasinya.

</Accordion>

## Discovery dan presedensi

OpenClaw memindai Plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Path konfigurasi">
    `plugins.load.paths` — path file atau direktori eksplisit. Path yang
    menunjuk kembali ke direktori Plugin bawaan paket OpenClaw sendiri diabaikan;
    jalankan `openclaw doctor --fix` untuk menghapus alias usang tersebut.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (penyedia model, ucapan).
    Lainnya memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

Instalasi paket dan image Docker biasanya me-resolve Plugin bawaan dari pohon
`dist/extensions` terkompilasi. Jika direktori sumber Plugin bawaan di-bind-mount
di atas path sumber paket yang cocok, misalnya `/app/extensions/synology-chat`,
OpenClaw memperlakukan direktori sumber yang di-mount itu sebagai overlay sumber
bawaan dan menemukannya sebelum bundle `/app/dist/extensions/synology-chat`
terpaket. Ini membuat loop container maintainer tetap berjalan tanpa mengalihkan
setiap Plugin bawaan kembali ke sumber TypeScript. Set
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk memaksa bundle dist terpaket
meskipun mount overlay sumber ada.

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua Plugin dan melewati pekerjaan discovery/muat Plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan Plugin tersebut
- Plugin asal workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set default-aktif bawaan kecuali dioverride
- Slot eksklusif dapat memaksa pengaktifan Plugin yang dipilih untuk slot tersebut
- Beberapa Plugin bawaan opt-in diaktifkan secara otomatis saat konfigurasi menamai
  permukaan milik Plugin, seperti referensi model penyedia, konfigurasi channel, atau runtime
  harness
- Konfigurasi Plugin usang dipertahankan selama `plugins.enabled: false` aktif;
  aktifkan kembali Plugin sebelum menjalankan pembersihan doctor jika Anda ingin id usang dihapus
- Rute Codex keluarga OpenAI menjaga batas Plugin terpisah:
  `openai-codex/*` milik Plugin OpenAI, sedangkan Plugin app-server Codex bawaan
  dipilih oleh `agentRuntime.id: "codex"` atau referensi model lama `codex/*`

## Memecahkan masalah hook runtime

Jika sebuah Plugin muncul di `plugins list` tetapi efek samping atau hook
`register(api)` tidak berjalan di lalu lintas chat live, periksa ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan pastikan URL
  Gateway aktif, profil, path konfigurasi, dan proses adalah yang sedang Anda edit.
- Mulai ulang Gateway live setelah perubahan install/konfigurasi/kode Plugin. Di container
  pembungkus, PID 1 mungkin hanya supervisor; mulai ulang atau beri sinyal ke proses anak
  `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --runtime --json` untuk mengonfirmasi registrasi hook dan
  diagnostik. Hook percakapan non-bawaan seperti `llm_input`,
  `llm_output`, `before_agent_finalize`, dan `agent_end` memerlukan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk perpindahan model, utamakan `before_model_resolve`. Itu berjalan sebelum
  resolusi model untuk giliran agen; `llm_output` hanya berjalan setelah percobaan model
  menghasilkan output asisten.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau permukaan
  sesi/status Gateway dan, saat men-debug payload penyedia, mulai
  Gateway dengan `--raw-stream --raw-stream-path <path>`.

### Penyiapan alat Plugin lambat

Jika giliran agen tampak berhenti saat menyiapkan alat, aktifkan logging trace dan
periksa baris timing factory alat Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cari:

```text
[trace:plugin-tools] factory timings ...
```

Ringkasan mencantumkan total waktu factory dan factory alat Plugin paling lambat,
termasuk id Plugin, nama alat yang dideklarasikan, bentuk hasil, dan apakah alat
bersifat opsional. Baris lambat dinaikkan menjadi peringatan saat satu factory
memakan waktu setidaknya 1 dtk atau total persiapan factory alat Plugin memakan
waktu setidaknya 5 dtk.

OpenClaw menyimpan cache hasil factory alat Plugin yang berhasil untuk resolusi
berulang dengan konteks permintaan efektif yang sama. Kunci cache mencakup
konfigurasi runtime efektif, workspace, id agen/sesi, kebijakan sandbox,
pengaturan browser, konteks pengiriman, identitas peminta, dan status
kepemilikan, sehingga factory yang bergantung pada field tepercaya tersebut
dijalankan ulang saat konteks berubah.

Jika satu Plugin mendominasi timing, periksa registrasi runtime-nya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Lalu update, install ulang, atau nonaktifkan Plugin tersebut. Penulis Plugin
sebaiknya memindahkan pemuatan dependensi yang mahal ke balik jalur eksekusi
alat alih-alih melakukannya di dalam factory alat.

### Kepemilikan channel atau alat duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu Plugin aktif mencoba memiliki channel, alur
penyiapan, atau nama alat yang sama. Penyebab paling umum adalah Plugin channel
eksternal yang diinstal berdampingan dengan Plugin bawaan yang sekarang
menyediakan id channel yang sama.

Langkah debug:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap Plugin
  yang aktif dan asalnya.
- Jalankan `openclaw plugins inspect <id> --runtime --json` untuk setiap Plugin yang dicurigai dan
  bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah menginstal atau menghapus
  paket Plugin agar metadata tersimpan mencerminkan instalasi saat ini.
- Mulai ulang Gateway setelah perubahan install, registri, atau konfigurasi.

Opsi perbaikan:

- Jika satu Plugin sengaja menggantikan Plugin lain untuk id channel yang sama, Plugin
  pilihan sebaiknya mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan
  id Plugin prioritas lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikat tidak disengaja, nonaktifkan salah satu sisi dengan
  `plugins.entries.<plugin-id>.enabled: false` atau hapus instalasi Plugin
  yang usang.
- Jika Anda secara eksplisit mengaktifkan kedua Plugin, OpenClaw mempertahankan permintaan itu dan
  melaporkan konflik. Pilih satu pemilik untuk channel atau ganti nama alat milik
  Plugin agar permukaan runtime tidak ambigu.

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

| Slot            | Yang dikendalikan     | Default             |
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

Plugin bawaan dikirimkan bersama OpenClaw. Banyak yang diaktifkan secara default (misalnya
penyedia model bawaan, penyedia ucapan bawaan, dan Plugin browser bawaan).
Plugin bawaan lainnya tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa Plugin atau paket hook terpasang yang sudah ada di tempatnya. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk peningkatan rutin Plugin npm
yang terlacak. Ini tidak didukung bersama `--link`, yang menggunakan ulang jalur sumber alih-alih
menyalin ke target pemasangan terkelola.

Ketika `plugins.allow` sudah disetel, `openclaw plugins install` menambahkan id
Plugin yang dipasang ke allowlist tersebut sebelum mengaktifkannya. Jika id Plugin yang sama
ada di `plugins.deny`, pemasangan menghapus entri deny yang usang itu sehingga
pemasangan eksplisit dapat langsung dimuat setelah restart.

OpenClaw menyimpan registri Plugin lokal yang dipersistenkan sebagai model baca dingin untuk
inventaris Plugin, kepemilikan kontribusi, dan perencanaan startup. Alur pemasangan, pembaruan,
pencopotan, pengaktifan, dan penonaktifan menyegarkan registri tersebut setelah mengubah status
Plugin. File `plugins/installs.json` yang sama menyimpan metadata pemasangan yang tahan lama di
`installRecords` tingkat atas dan metadata manifes yang dapat dibangun ulang di `plugins`. Jika
registri hilang, usang, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifesnya dari catatan pemasangan, kebijakan konfigurasi, dan
metadata manifes/paket tanpa memuat modul runtime Plugin.
`openclaw plugins update <id-or-npm-spec>` berlaku untuk pemasangan terlacak. Memberikan
spesifikasi paket npm dengan dist-tag atau versi persis menyelesaikan nama paket
kembali ke catatan Plugin terlacak dan mencatat spesifikasi baru untuk pembaruan mendatang.
Memberikan nama paket tanpa versi memindahkan pemasangan yang dipin persis kembali ke
jalur rilis default registri. Jika Plugin npm yang terpasang sudah cocok dengan
versi yang diselesaikan dan identitas artefak yang tercatat, OpenClaw melewati pembaruan
tanpa mengunduh, memasang ulang, atau menulis ulang konfigurasi.
Ketika `openclaw update` berjalan di kanal beta, catatan Plugin npm dan ClawHub
jalur default mencoba `@beta` terlebih dahulu dan kembali ke default/latest ketika tidak ada rilis
beta Plugin. Versi persis dan tag eksplisit tetap dipin.

`--pin` hanya untuk npm. Ini tidak didukung bersama `--marketplace`, karena
pemasangan marketplace mempertahankan metadata sumber marketplace alih-alih spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override darurat untuk false positive
dari pemindai kode berbahaya bawaan. Ini memungkinkan pemasangan Plugin
dan pembaruan Plugin terus berjalan melewati temuan bawaan `critical`, tetapi tetap
tidak melewati blok kebijakan `before_install` Plugin atau pemblokiran kegagalan pemindaian.
Pemindaian pemasangan mengabaikan file dan direktori pengujian umum seperti `tests/`,
`__tests__/`, `*.test.*`, dan `*.spec.*` untuk menghindari pemblokiran mock pengujian yang dipaketkan;
entrypoint runtime Plugin yang dideklarasikan tetap dipindai meskipun menggunakan salah satu
nama tersebut.

Flag CLI ini hanya berlaku untuk alur pemasangan/pembaruan Plugin. Pemasangan dependensi Skills
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall`
yang sesuai, sedangkan `openclaw skills install` tetap menjadi alur unduh/pasang skill ClawHub
yang terpisah.

Jika Plugin yang Anda terbitkan di ClawHub disembunyikan atau diblokir oleh pemindaian, buka
dasbor ClawHub atau jalankan `clawhub package rescan <name>` untuk meminta ClawHub memeriksanya
lagi. `--dangerously-force-unsafe-install` hanya memengaruhi pemasangan di mesin Anda sendiri;
itu tidak meminta ClawHub memindai ulang Plugin atau membuat rilis yang diblokir menjadi publik.

Bundle yang kompatibel berpartisipasi dalam alur daftar/inspeksi/aktifkan/nonaktifkan Plugin yang sama.
Dukungan runtime saat ini mencakup bundle Skills, command-skills Claude,
default Claude `settings.json`, default Claude `.lsp.json` dan `lspServers` yang dideklarasikan manifes,
command-skills Cursor, dan direktori hook Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kapabilitas bundle yang terdeteksi plus
entri server MCP dan LSP yang didukung atau tidak didukung untuk Plugin berbasis bundle.

Sumber marketplace dapat berupa nama marketplace Claude yang dikenal dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau jalur
`marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. Untuk
marketplace jarak jauh, entri Plugin harus tetap berada di dalam repo marketplace yang dikloning
dan hanya menggunakan sumber jalur relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ikhtisar API Plugin

Plugin native mengekspor objek entri yang mengekspos `register(api)`. Plugin lama
mungkin masih menggunakan `activate(api)` sebagai alias legacy, tetapi Plugin baru sebaiknya
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
Plugin. Loader tetap fallback ke `activate(api)` untuk Plugin lama,
tetapi Plugin bawaan dan Plugin eksternal baru sebaiknya menganggap `register` sebagai
kontrak publik.

`api.registrationMode` memberi tahu Plugin mengapa entrinya sedang dimuat:

| Mode            | Arti                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan tool, hook, layanan, perintah, route, dan efek samping aktif lainnya.                              |
| `discovery`     | Penemuan kapabilitas hanya-baca. Daftarkan penyedia dan metadata; kode entri Plugin tepercaya dapat dimuat, tetapi lewati efek samping aktif. |
| `setup-only`    | Pemuatan metadata penyiapan kanal melalui entri penyiapan ringan.                                                                |
| `setup-runtime` | Pemuatan penyiapan kanal yang juga memerlukan entri runtime.                                                                         |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                            |

Entri Plugin yang membuka soket, database, worker latar belakang, atau klien berumur panjang
sebaiknya menjaga efek samping tersebut dengan `api.registrationMode === "full"`.
Pemuatan discovery di-cache secara terpisah dari pemuatan aktivasi dan tidak menggantikan
registri Gateway yang sedang berjalan. Discovery bersifat tidak mengaktifkan, bukan bebas impor:
OpenClaw dapat mengevaluasi entri Plugin tepercaya atau modul Plugin kanal untuk membangun
snapshot. Jaga tingkat atas modul tetap ringan dan bebas efek samping, serta pindahkan
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
| `registerWebFetchProvider`              | Penyedia web fetch / scrape  |
| `registerWebSearchProvider`             | Pencarian web                |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Perintah CLI                 |
| `registerContextEngine`                 | Mesin konteks                |
| `registerService`                       | Layanan latar belakang       |

Perilaku guard hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

App-server Codex native menjembatani event tool Codex-native kembali ke permukaan
hook ini. Plugin dapat memblokir tool Codex native melalui `before_tool_call`,
mengamati hasil melalui `after_tool_call`, dan berpartisipasi dalam persetujuan
`PermissionRequest` Codex. Bridge belum menulis ulang argumen tool Codex-native.
Batas dukungan runtime Codex yang persis berada di
[kontrak dukungan Codex harness v1](/id/plugins/codex-harness#v1-support-contract).

Untuk perilaku hook bertipe lengkap, lihat [ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — buat Plugin Anda sendiri
- [Bundle Plugin](/id/plugins/bundles) — kompatibilitas bundle Codex/Claude/Cursor
- [Manifes Plugin](/id/plugins/manifest) — skema manifes
- [Mendaftarkan tool](/id/plugins/building-plugins#registering-agent-tools) — tambahkan tool agen dalam Plugin
- [Internal Plugin](/id/plugins/architecture) — model kapabilitas dan pipeline pemuatan
- [Plugin komunitas](/id/plugins/community) — daftar pihak ketiga
