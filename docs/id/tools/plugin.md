---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami aturan penemuan dan pemuatan Plugin
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-02T09:34:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: channel, penyedia model,
harness agen, alat, Skills, ucapan, transkripsi waktu nyata, suara waktu nyata,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, pencarian
web, dan lainnya. Beberapa Plugin adalah **inti** (dikirim bersama OpenClaw),
yang lain adalah **eksternal**. Sebagian besar Plugin eksternal diterbitkan dan
ditemukan melalui [ClawHub](/id/tools/clawhub). Npm tetap didukung untuk instalasi
langsung dan untuk sekumpulan sementara paket Plugin milik OpenClaw selama
migrasi tersebut selesai.

## Mulai cepat

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

  <Step title="Verifikasi Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gunakan `--runtime` saat Anda perlu membuktikan alat terdaftar, layanan,
    metode Gateway, hook, atau perintah CLI milik Plugin. `inspect` biasa adalah
    pemeriksaan manifest/registri dingin dan sengaja menghindari impor runtime Plugin.

  </Step>
</Steps>

Jika Anda lebih memilih kontrol native chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Jalur instalasi menggunakan resolver yang sama seperti CLI: path/arsip lokal,
`clawhub:<pkg>` eksplisit, `npm:<pkg>` eksplisit, `git:<repo>` eksplisit, atau
spesifikasi paket polos (ClawHub lebih dulu, lalu fallback npm).

Jika konfigurasi tidak valid, instalasi biasanya gagal tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur instal
ulang Plugin bawaan yang sempit untuk Plugin yang memilih ikut
`openclaw.install.allowInvalidConfigRecovery`.
Saat Gateway mulai, konfigurasi tidak valid untuk satu Plugin diisolasi ke Plugin tersebut:
startup mencatat masalah `plugins.entries.<id>.config`, melewati Plugin tersebut saat
pemuatan, dan menjaga Plugin serta channel lain tetap online. Jalankan `openclaw doctor --fix`
untuk mengarantina konfigurasi Plugin yang buruk dengan menonaktifkan entri Plugin tersebut
dan menghapus payload konfigurasi yang tidak valid; cadangan konfigurasi normal menyimpan nilai
sebelumnya. Saat konfigurasi channel merujuk ke Plugin yang tidak lagi dapat ditemukan tetapi
id Plugin basi yang sama tetap ada dalam konfigurasi Plugin atau catatan instalasi, startup Gateway
mencatat peringatan dan melewati channel tersebut alih-alih memblokir semua channel lain.
Jalankan `openclaw doctor --fix` untuk menghapus entri channel/Plugin yang basi; kunci
channel yang tidak dikenal tanpa bukti Plugin basi tetap menggagalkan validasi agar salah ketik tetap
terlihat.
Jika `plugins.enabled: false` disetel, referensi Plugin basi diperlakukan sebagai inert:
startup Gateway melewati pekerjaan penemuan/pemuatan Plugin dan `openclaw doctor` mempertahankan
konfigurasi Plugin yang dinonaktifkan alih-alih menghapusnya otomatis. Aktifkan kembali Plugin sebelum
menjalankan pembersihan doctor jika Anda ingin id Plugin basi dihapus.

Instalasi dependensi Plugin hanya terjadi selama alur instalasi/pembaruan eksplisit atau
perbaikan doctor. Startup Gateway, pemuatan ulang konfigurasi, dan inspeksi runtime tidak
menjalankan package manager atau memperbaiki pohon dependensi. Plugin lokal harus sudah
memiliki dependensi yang terinstal, sementara Plugin npm, git, dan ClawHub diinstal di bawah root
Plugin terkelola OpenClaw. Dependensi npm dapat di-hoist dalam root npm terkelola OpenClaw;
instalasi/pembaruan memindai root terkelola tersebut sebelum trust dan uninstall menghapus paket
terkelola npm melalui npm. Plugin eksternal dan path muat kustom tetap harus diinstal melalui
`openclaw plugins install`. Lihat [Resolusi dependensi Plugin](/id/plugins/dependency-resolution) untuk
siklus hidup saat instalasi.

Checkout sumber adalah workspace pnpm. Jika Anda mengkloning OpenClaw untuk mengutak-atik Plugin
bawaan, jalankan `pnpm install`; OpenClaw lalu memuat Plugin bawaan dari
`extensions/<id>` sehingga edit dan dependensi lokal paket digunakan secara langsung.
Instalasi root npm biasa ditujukan untuk OpenClaw terpaket, bukan pengembangan checkout
sumber.

## Jenis Plugin

OpenClaw mengenali dua format Plugin:

| Format     | Cara kerjanya                                                       | Contoh                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dijalankan dalam proses       | Plugin resmi, paket npm komunitas               |
| **Bundle** | Tata letak yang kompatibel dengan Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundle Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis Plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entry point paket

Paket npm Plugin native harus mendeklarasikan `openclaw.extensions` di `package.json`.
Setiap entri harus tetap berada di dalam direktori paket dan di-resolve ke file runtime
yang dapat dibaca, atau ke file sumber TypeScript dengan peer JavaScript hasil build yang diinferensikan
seperti `src/index.ts` ke `dist/index.js`.

Gunakan `openclaw.runtimeExtensions` saat file runtime yang diterbitkan tidak berada di
path yang sama dengan entri sumber. Saat ada, `runtimeExtensions` harus berisi
tepat satu entri untuk setiap entri `extensions`. Daftar yang tidak cocok menggagalkan instalasi dan
penemuan Plugin alih-alih diam-diam fallback ke path sumber. Jika Anda juga
menerbitkan `openclaw.setupEntry`, gunakan `openclaw.runtimeSetupEntry` untuk peer
JavaScript hasil build-nya; file tersebut wajib ada saat dideklarasikan.

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

ClawHub adalah jalur distribusi utama untuk sebagian besar Plugin. Rilis OpenClaw
terpaket saat ini sudah menyertakan banyak Plugin resmi, sehingga Plugin tersebut tidak memerlukan
instalasi npm terpisah dalam setup normal. Hingga setiap Plugin milik OpenClaw
bermigrasi ke ClawHub, OpenClaw masih mengirimkan beberapa paket Plugin `@openclaw/*` di
npm untuk instalasi lama/kustom dan alur kerja npm langsung.

Jika npm melaporkan paket Plugin `@openclaw/*` sebagai deprecated, versi paket tersebut
berasal dari rangkaian paket eksternal yang lebih lama. Gunakan Plugin bawaan dari
OpenClaw saat ini atau checkout lokal hingga paket npm yang lebih baru diterbitkan.

| Plugin          | Paket                    | Dokumentasi                                       |
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

    Lihat [Memory LanceDB](/id/plugins/memory-lancedb) untuk setup embedding yang kompatibel dengan OpenAI,
    contoh Ollama, batas recall, dan pemecahan masalah.

  </Accordion>

  <Accordion title="Penyedia ucapan (diaktifkan secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` — Plugin browser bawaan untuk alat browser, CLI `openclaw browser`, metode Gateway `browser.request`, runtime browser, dan layanan kontrol browser default (diaktifkan secara default; nonaktifkan sebelum menggantinya)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (dinonaktifkan secara default)

  </Accordion>
</AccordionGroup>

Mencari Plugin pihak ketiga? Lihat [Plugin Komunitas](/id/plugins/community).

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

| Bidang            | Deskripsi                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Toggle utama (default: `true`)                           |
| `allow`          | Allowlist Plugin (opsional)                               |
| `deny`           | Denylist Plugin (opsional; deny menang)                     |
| `load.paths`     | File/direktori Plugin tambahan                            |
| `slots`          | Selektor slot eksklusif (mis. `memory`, `contextEngine`) |
| `entries.\<id\>` | Toggle + konfigurasi per Plugin                               |

`plugins.allow` bersifat eksklusif. Saat tidak kosong, hanya Plugin yang terdaftar yang dapat dimuat
atau mengekspos alat, bahkan jika `tools.allow` berisi `"*"` atau nama alat milik Plugin
tertentu. Jika allowlist alat merujuk ke alat Plugin, tambahkan id Plugin pemilik
ke `plugins.allow` atau hapus `plugins.allow`; `openclaw doctor` memperingatkan tentang bentuk ini.

Perubahan konfigurasi **memerlukan restart Gateway**. Jika Gateway berjalan dengan config
watch + restart dalam proses diaktifkan (path default `openclaw gateway`), restart tersebut
biasanya dilakukan otomatis sesaat setelah penulisan konfigurasi masuk.
Tidak ada jalur hot-reload yang didukung untuk kode runtime Plugin native atau hook siklus hidup;
mulai ulang proses Gateway yang melayani channel live sebelum
mengharapkan kode `register(api)` yang diperbarui, hook `api.on(...)`, alat, layanan, atau
hook penyedia/runtime berjalan.

`openclaw plugins list` adalah snapshot registri/konfigurasi plugin lokal. Plugin
`enabled` di sana berarti registri yang dipertahankan dan konfigurasi saat ini
mengizinkan plugin untuk berpartisipasi. Ini tidak membuktikan bahwa child
Gateway jarak jauh yang sudah berjalan telah dimulai ulang ke kode plugin yang
sama. Pada penyiapan VPS/kontainer dengan proses wrapper, kirim restart ke
proses `openclaw gateway run` yang sebenarnya, atau gunakan
`openclaw gateway restart` terhadap Gateway yang sedang berjalan.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Dinonaktifkan**: plugin ada tetapi aturan pengaktifan mematikannya. Konfigurasi dipertahankan.
  - **Hilang**: konfigurasi mereferensikan id plugin yang tidak ditemukan oleh discovery.
  - **Tidak valid**: plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan. Startup Gateway hanya melewati plugin tersebut; `openclaw doctor --fix` dapat mengarantina entri yang tidak valid dengan menonaktifkannya dan menghapus payload konfigurasinya.

</Accordion>

## Discovery dan prioritas

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — path file atau direktori eksplisit. Path yang menunjuk
    kembali ke direktori plugin bawaan terpaket milik OpenClaw sendiri diabaikan;
    jalankan `openclaw doctor --fix` untuk menghapus alias usang tersebut.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (penyedia model, ucapan).
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

Instalasi terpaket dan image Docker biasanya menyelesaikan plugin bawaan dari
pohon `dist/extensions` yang telah dikompilasi. Jika direktori sumber plugin
bawaan di-bind-mount di atas path sumber terpaket yang cocok, misalnya
`/app/extensions/synology-chat`, OpenClaw memperlakukan direktori sumber yang
di-mount tersebut sebagai overlay sumber bawaan dan menemukannya sebelum bundle
terpaket `/app/dist/extensions/synology-chat`. Ini menjaga loop kontainer
maintainer tetap berjalan tanpa mengalihkan setiap plugin bawaan kembali ke
sumber TypeScript. Tetapkan `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk
memaksa bundle dist terpaket meskipun mount overlay sumber ada.

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua plugin dan melewati pekerjaan discovery/load plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin asal workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti kumpulan default aktif bawaan kecuali ditimpa
- Slot eksklusif dapat memaksa plugin yang dipilih untuk slot tersebut aktif
- Beberapa plugin bawaan opt-in diaktifkan secara otomatis ketika konfigurasi
  menamai surface milik plugin, seperti ref model penyedia, konfigurasi channel, atau runtime harness
- Konfigurasi plugin usang dipertahankan selama `plugins.enabled: false` aktif;
  aktifkan kembali plugin sebelum menjalankan pembersihan doctor jika Anda ingin id usang dihapus
- Rute Codex keluarga OpenAI mempertahankan batas plugin terpisah:
  `openai-codex/*` milik plugin OpenAI, sedangkan plugin app-server Codex
  bawaan dipilih oleh `agentRuntime.id: "codex"` atau ref model
  `codex/*` lama

## Memecahkan masalah hook runtime

Jika plugin muncul di `plugins list` tetapi efek samping atau hook
`register(api)` tidak berjalan pada trafik chat live, periksa hal berikut lebih dulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan pastikan URL
  Gateway aktif, profil, path konfigurasi, dan proses adalah yang sedang Anda edit.
- Mulai ulang Gateway live setelah perubahan instalasi/konfigurasi/kode plugin. Dalam
  kontainer wrapper, PID 1 mungkin hanya supervisor; mulai ulang atau kirim sinyal ke child
  proses `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --runtime --json` untuk mengonfirmasi registrasi hook dan
  diagnostik. Hook percakapan non-bawaan seperti `llm_input`,
  `llm_output`, `before_agent_finalize`, dan `agent_end` memerlukan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk penggantian model, pilih `before_model_resolve`. Ini berjalan sebelum
  resolusi model untuk giliran agent; `llm_output` hanya berjalan setelah percobaan model
  menghasilkan output assistant.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau surface
  sesi/status Gateway dan, saat men-debug payload penyedia, mulai
  Gateway dengan `--raw-stream --raw-stream-path <path>`.

### Penyiapan tool plugin lambat

Jika giliran agent tampak berhenti saat menyiapkan tool, aktifkan logging trace dan
periksa baris timing factory tool plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cari:

```text
[trace:plugin-tools] factory timings ...
```

Ringkasan mencantumkan total waktu factory dan factory tool plugin paling lambat,
termasuk id plugin, nama tool yang dideklarasikan, bentuk hasil, dan apakah tool
bersifat opsional. Baris lambat dipromosikan menjadi warning ketika satu factory
memerlukan setidaknya 1 dtk atau total persiapan factory tool plugin memerlukan setidaknya 5 dtk.

Jika satu plugin mendominasi timing, periksa registrasi runtime-nya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Lalu perbarui, instal ulang, atau nonaktifkan plugin tersebut. Penulis plugin harus memindahkan
pemuatan dependensi yang mahal ke belakang jalur eksekusi tool alih-alih melakukannya
di dalam factory tool.

### Kepemilikan channel atau tool duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu plugin yang diaktifkan mencoba memiliki channel,
alur penyiapan, atau nama tool yang sama. Penyebab paling umum adalah plugin channel eksternal
yang diinstal berdampingan dengan plugin bawaan yang kini menyediakan id channel yang sama.

Langkah debug:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap plugin
  yang diaktifkan dan asalnya.
- Jalankan `openclaw plugins inspect <id> --runtime --json` untuk setiap plugin yang dicurigai dan
  bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah menginstal atau menghapus
  paket plugin agar metadata yang dipertahankan mencerminkan instalasi saat ini.
- Mulai ulang Gateway setelah perubahan instalasi, registri, atau konfigurasi.

Opsi perbaikan:

- Jika satu plugin secara sengaja menggantikan plugin lain untuk id channel yang sama, plugin
  yang dipilih sebaiknya mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan
  id plugin prioritas lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikat tidak disengaja, nonaktifkan salah satu sisi dengan
  `plugins.entries.<plugin-id>.enabled: false` atau hapus instalasi plugin
  yang usang.
- Jika Anda secara eksplisit mengaktifkan kedua plugin, OpenClaw mempertahankan permintaan tersebut dan
  melaporkan konflik. Pilih satu pemilik untuk channel atau ubah nama tool milik plugin
  agar surface runtime tidak ambigu.

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
| `contextEngine` | Mesin konteks aktif   | `legacy` (bawaan) |

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

openclaw plugins install <package>         # install (ClawHub first, then npm)
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
penyedia model bawaan, penyedia ucapan bawaan, dan plugin browser bawaan).
Plugin bawaan lain masih memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin terinstal atau hook pack yang sudah ada di tempat. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk peningkatan rutin plugin npm
yang dilacak. Ini tidak didukung dengan `--link`, yang menggunakan kembali path sumber alih-alih
menyalin ke target instalasi terkelola.

Ketika `plugins.allow` sudah ditetapkan, `openclaw plugins install` menambahkan
id plugin yang diinstal ke allowlist tersebut sebelum mengaktifkannya. Jika id plugin yang sama
ada di `plugins.deny`, install menghapus entri deny usang tersebut sehingga
instalasi eksplisit langsung dapat dimuat setelah restart.

OpenClaw mempertahankan registri plugin lokal yang dipersistenkan sebagai model baca dingin untuk
inventaris plugin, kepemilikan kontribusi, dan perencanaan startup. Alur install, update,
uninstall, enable, dan disable menyegarkan registri tersebut setelah mengubah status plugin.
File `plugins/installs.json` yang sama menyimpan metadata instalasi tahan lama di
`installRecords` tingkat atas dan metadata manifes yang dapat dibangun ulang di `plugins`. Jika
registri hilang, usang, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifesnya dari catatan instalasi, kebijakan konfigurasi, dan
metadata manifes/paket tanpa memuat modul runtime plugin.
`openclaw plugins update <id-or-npm-spec>` berlaku untuk instalasi yang dilacak. Memberikan
spec paket npm dengan dist-tag atau versi persis menyelesaikan nama paket
kembali ke catatan plugin yang dilacak dan mencatat spec baru untuk update mendatang.
Memberikan nama paket tanpa versi memindahkan instalasi yang dipin secara persis kembali ke
jalur rilis default registri. Jika plugin npm yang terinstal sudah cocok dengan
versi yang diselesaikan dan identitas artefak yang dicatat, OpenClaw melewati update
tanpa mengunduh, menginstal ulang, atau menulis ulang konfigurasi.

`--pin` hanya untuk npm. Opsi ini tidak didukung bersama `--marketplace`, karena
instalasi marketplace menyimpan metadata sumber marketplace, bukan spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override darurat untuk positif palsu
dari pemindai kode berbahaya bawaan. Opsi ini memungkinkan instalasi plugin
dan pembaruan plugin tetap berlanjut melewati temuan `critical` bawaan, tetapi
tetap tidak melewati pemblokiran kebijakan `before_install` plugin atau
pemblokiran karena kegagalan pemindaian. Pemindaian instalasi mengabaikan file
dan direktori pengujian umum seperti `tests/`, `__tests__/`, `*.test.*`, dan
`*.spec.*` agar tidak memblokir mock pengujian yang dikemas; entrypoint runtime
plugin yang dideklarasikan tetap dipindai meskipun menggunakan salah satu nama
tersebut.

Flag CLI ini hanya berlaku untuk alur instalasi/pembaruan plugin. Instalasi
dependensi skill yang didukung Gateway menggunakan override permintaan
`dangerouslyForceUnsafeInstall` yang sesuai, sedangkan `openclaw skills install`
tetap menjadi alur unduh/instal skill ClawHub yang terpisah.

Jika plugin yang Anda publikasikan di ClawHub disembunyikan atau diblokir oleh
pemindaian, buka dasbor ClawHub atau jalankan `clawhub package rescan <name>`
untuk meminta ClawHub memeriksanya lagi. `--dangerously-force-unsafe-install`
hanya memengaruhi instalasi di mesin Anda sendiri; opsi ini tidak meminta ClawHub
memindai ulang plugin atau membuat rilis yang diblokir menjadi publik.

Bundle yang kompatibel ikut dalam alur daftar/inspeksi/aktifkan/nonaktifkan
plugin yang sama. Dukungan runtime saat ini mencakup bundle skills, command-skills
Claude, default `settings.json` Claude, default `.lsp.json` Claude dan
`lspServers` yang dideklarasikan manifest, command-skills Cursor, serta direktori
hook Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kapabilitas bundle yang terdeteksi
serta entri server MCP dan LSP yang didukung atau tidak didukung untuk plugin
berbasis bundle.

Sumber marketplace dapat berupa nama known-marketplace Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau path
`marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau
URL git. Untuk marketplace jarak jauh, entri plugin harus tetap berada di dalam
repo marketplace yang dikloning dan hanya menggunakan sumber path relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ikhtisar API Plugin

Plugin native mengekspor objek entri yang mengekspos `register(api)`. Plugin
lama mungkin masih menggunakan `activate(api)` sebagai alias legacy, tetapi plugin
baru sebaiknya menggunakan `register`.

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

OpenClaw memuat objek entri dan memanggil `register(api)` selama aktivasi plugin.
Loader masih fallback ke `activate(api)` untuk plugin lama, tetapi plugin bawaan
dan plugin eksternal baru sebaiknya memperlakukan `register` sebagai kontrak
publik.

`api.registrationMode` memberi tahu plugin mengapa entrinya sedang dimuat:

| Mode            | Arti                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan tools, hook, layanan, perintah, rute, dan efek samping live lainnya.                                  |
| `discovery`     | Penemuan kapabilitas baca-saja. Daftarkan provider dan metadata; kode entri plugin tepercaya dapat dimuat, tetapi lewati efek samping live. |
| `setup-only`    | Pemuatan metadata penyiapan channel melalui entri penyiapan ringan.                                                                |
| `setup-runtime` | Pemuatan penyiapan channel yang juga membutuhkan entri runtime.                                                                    |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                           |

Entri plugin yang membuka socket, database, worker latar belakang, atau client
berumur panjang harus menjaga efek samping tersebut dengan
`api.registrationMode === "full"`. Pemuatan discovery di-cache terpisah dari
pemuatan aktivasi dan tidak menggantikan registry Gateway yang sedang berjalan.
Discovery tidak mengaktifkan, tetapi bukan tanpa impor: OpenClaw dapat mengevaluasi
entri plugin tepercaya atau modul plugin channel untuk membangun snapshot. Jaga
top level modul tetap ringan dan bebas efek samping, serta pindahkan client
jaringan, subprocess, listener, pembacaan kredensial, dan startup layanan ke
balik path runtime penuh.

Metode pendaftaran umum:

| Metode                                  | Yang didaftarkan              |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Provider model (LLM)          |
| `registerChannel`                       | Channel chat                  |
| `registerTool`                          | Tool agen                     |
| `registerHook` / `on(...)`              | Hook lifecycle                |
| `registerSpeechProvider`                | Text-to-speech / STT          |
| `registerRealtimeTranscriptionProvider` | STT streaming                 |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks        |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio         |
| `registerImageGenerationProvider`       | Pembuatan gambar              |
| `registerMusicGenerationProvider`       | Pembuatan musik               |
| `registerVideoGenerationProvider`       | Pembuatan video               |
| `registerWebFetchProvider`              | Provider web fetch / scrape   |
| `registerWebSearchProvider`             | Web search                    |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Perintah CLI                  |
| `registerContextEngine`                 | Mesin konteks                 |
| `registerService`                       | Layanan latar belakang        |

Perilaku guard hook untuk hook lifecycle bertipe:

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
Batas dukungan runtime Codex yang tepat berada di
[kontrak dukungan Codex harness v1](/id/plugins/codex-harness#v1-support-contract).

Untuk perilaku hook bertipe lengkap, lihat [ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins) — buat plugin Anda sendiri
- [Bundle plugin](/id/plugins/bundles) — kompatibilitas bundle Codex/Claude/Cursor
- [Manifest plugin](/id/plugins/manifest) — skema manifest
- [Mendaftarkan tool](/id/plugins/building-plugins#registering-agent-tools) — tambahkan tool agen di plugin
- [Internal plugin](/id/plugins/architecture) — model kapabilitas dan pipeline pemuatan
- [Plugin komunitas](/id/plugins/community) — daftar pihak ketiga
