---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami aturan penemuan dan pemuatan Plugin
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-02T21:01:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: kanal, penyedia model,
harness agen, alat, Skills, ucapan, transkripsi waktu nyata, suara waktu nyata,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, pencarian
web, dan lainnya. Sebagian Plugin bersifat **inti** (dikirimkan bersama OpenClaw),
sebagian lainnya **eksternal**. Sebagian besar Plugin eksternal diterbitkan dan
ditemukan melalui [ClawHub](/id/tools/clawhub). Npm tetap didukung untuk pemasangan
langsung dan untuk sekumpulan sementara paket Plugin milik OpenClaw selama
migrasi itu diselesaikan.

## Mulai cepat

Untuk contoh pemasangan salin-tempel, daftar, pencopotan, pembaruan, dan
penerbitan, lihat [Kelola Plugin](/id/plugins/manage-plugins).

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

  <Step title="Pengelolaan native chat">
    Dalam Gateway yang berjalan, `/plugins enable` dan `/plugins disable` yang
    hanya untuk pemilik memicu pemuat ulang konfigurasi Gateway. Gateway memuat
    ulang permukaan runtime Plugin dalam proses, dan giliran agen baru membangun
    ulang daftar alatnya dari registri yang telah disegarkan. `/plugins install`
    mengubah kode sumber Plugin, sehingga Gateway meminta mulai ulang alih-alih
    berpura-pura bahwa proses saat ini dapat memuat ulang modul yang sudah
    diimpor dengan aman.

  </Step>

  <Step title="Verifikasi Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gunakan `--runtime` saat Anda perlu membuktikan alat, layanan, metode
    gateway, hook, atau perintah CLI milik Plugin yang terdaftar. `inspect` biasa
    adalah pemeriksaan manifes/registri dingin dan dengan sengaja menghindari
    impor runtime Plugin.

  </Step>
</Steps>

Jika Anda lebih menyukai kontrol native chat, aktifkan `commands.plugins: true` dan gunakan:

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
pemasangan ulang Plugin bawaan yang sempit untuk Plugin yang ikut serta dalam
`openclaw.install.allowInvalidConfigRecovery`.
Selama startup Gateway, konfigurasi tidak valid untuk satu Plugin diisolasi ke
Plugin tersebut: startup mencatat masalah `plugins.entries.<id>.config`,
melewati Plugin itu selama pemuatan, dan menjaga Plugin serta kanal lain tetap
online. Jalankan `openclaw doctor --fix` untuk mengarantina konfigurasi Plugin
yang buruk dengan menonaktifkan entri Plugin tersebut dan menghapus payload
konfigurasi tidak validnya; cadangan konfigurasi normal menyimpan nilai
sebelumnya.
Saat konfigurasi kanal merujuk ke Plugin yang tidak lagi dapat ditemukan tetapi
id Plugin usang yang sama tetap ada dalam konfigurasi Plugin atau catatan
pemasangan, startup Gateway mencatat peringatan dan melewati kanal tersebut
alih-alih memblokir setiap kanal lain.
Jalankan `openclaw doctor --fix` untuk menghapus entri kanal/Plugin yang usang;
kunci kanal yang tidak dikenal tanpa bukti Plugin usang tetap gagal validasi agar
salah ketik tetap terlihat.
Jika `plugins.enabled: false` disetel, referensi Plugin usang diperlakukan
sebagai inert: startup Gateway melewati pekerjaan penemuan/pemuatan Plugin dan
`openclaw doctor` mempertahankan konfigurasi Plugin yang dinonaktifkan
alih-alih menghapusnya secara otomatis. Aktifkan kembali Plugin sebelum
menjalankan pembersihan doctor jika Anda ingin id Plugin usang dihapus.

Instalasi dependensi Plugin hanya terjadi selama alur pemasangan/pembaruan
eksplisit atau perbaikan doctor. Startup Gateway, pemuatan ulang konfigurasi, dan
inspeksi runtime tidak menjalankan manajer paket atau memperbaiki pohon
dependensi. Plugin lokal harus sudah memasang dependensinya, sementara Plugin
npm, git, dan ClawHub dipasang di bawah root Plugin terkelola OpenClaw. Dependensi
npm dapat di-hoist dalam root npm terkelola OpenClaw; pemasangan/pembaruan
memindai root terkelola itu sebelum trust dan pencopotan menghapus paket
terkelola npm melalui npm. Plugin eksternal dan path pemuatan khusus tetap harus
dipasang melalui `openclaw plugins install`.
Gunakan `openclaw plugins list --json` untuk melihat `dependencyStatus` statis
untuk setiap Plugin yang terlihat tanpa mengimpor kode runtime atau memperbaiki
dependensi.
Lihat [Resolusi dependensi Plugin](/id/plugins/dependency-resolution) untuk siklus
hidup saat pemasangan.

Checkout sumber adalah workspace pnpm. Jika Anda mengkloning OpenClaw untuk
mengutak-atik Plugin bawaan, jalankan `pnpm install`; OpenClaw lalu memuat Plugin
bawaan dari `extensions/<id>` sehingga perubahan dan dependensi lokal paket
digunakan langsung.
Pemasangan root npm biasa adalah untuk OpenClaw terpaket, bukan pengembangan
checkout sumber.

## Jenis Plugin

OpenClaw mengenali dua format Plugin:

| Format     | Cara kerjanya                                                     | Contoh                                                 |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi dalam proses   | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak kompatibel Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundle Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis Plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Titik masuk paket

Paket npm Plugin native harus mendeklarasikan `openclaw.extensions` dalam
`package.json`. Setiap entri harus tetap berada di dalam direktori paket dan
di-resolve ke file runtime yang dapat dibaca, atau ke file sumber TypeScript
dengan pasangan JavaScript hasil build yang diinferensikan seperti `src/index.ts`
ke `dist/index.js`.

Gunakan `openclaw.runtimeExtensions` saat file runtime yang diterbitkan tidak
berada di path yang sama dengan entri sumber. Jika ada, `runtimeExtensions` harus
berisi tepat satu entri untuk setiap entri `extensions`. Daftar yang tidak cocok
menggagalkan pemasangan dan penemuan Plugin alih-alih diam-diam kembali ke path
sumber. Jika Anda juga menerbitkan `openclaw.setupEntry`, gunakan
`openclaw.runtimeSetupEntry` untuk pasangan JavaScript hasil build-nya; file itu
wajib ada saat dideklarasikan.

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
terpaket saat ini sudah membundel banyak Plugin resmi, sehingga Plugin tersebut
tidak memerlukan pemasangan npm terpisah dalam penyiapan normal. Sampai setiap
Plugin milik OpenClaw bermigrasi ke ClawHub, OpenClaw masih mengirimkan beberapa
paket Plugin `@openclaw/*` di npm untuk pemasangan lama/khusus dan workflow npm
langsung.

Jika npm melaporkan paket Plugin `@openclaw/*` sebagai deprecated, versi paket
itu berasal dari rangkaian paket eksternal yang lebih lama. Gunakan Plugin bawaan
dari OpenClaw saat ini atau checkout lokal hingga paket npm yang lebih baru
diterbitkan.

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

### Inti (dikirimkan bersama OpenClaw)

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
    - `memory-lancedb` — memori jangka panjang berbasis LanceDB dengan recall/capture otomatis (setel `plugins.slots.memory = "memory-lancedb"`)

    Lihat [Memory LanceDB](/id/plugins/memory-lancedb) untuk penyiapan embedding
    kompatibel OpenAI, contoh Ollama, batas recall, dan pemecahan masalah.

  </Accordion>

  <Accordion title="Penyedia ucapan (diaktifkan secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` — Plugin browser bawaan untuk alat browser, CLI `openclaw browser`, metode gateway `browser.request`, runtime browser, dan layanan kontrol browser default (diaktifkan secara default; nonaktifkan sebelum menggantinya)
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

| Bidang           | Deskripsi                                                 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Toggle utama (default: `true`)                            |
| `allow`          | Daftar izin Plugin (opsional)                             |
| `deny`           | Daftar tolak Plugin (opsional; deny menang)               |
| `load.paths`     | File/direktori Plugin tambahan                            |
| `slots`          | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>` | Toggle + konfigurasi per Plugin                           |

`plugins.allow` bersifat eksklusif. Saat nilainya tidak kosong, hanya Plugin
yang tercantum yang dapat dimuat atau mengekspos alat, meskipun `tools.allow`
berisi `"*"` atau nama alat tertentu milik Plugin. Jika daftar izin alat merujuk
ke alat Plugin, tambahkan id Plugin pemiliknya ke `plugins.allow` atau hapus
`plugins.allow`; `openclaw doctor` memperingatkan tentang bentuk ini.

Perubahan konfigurasi yang dibuat melalui `/plugins enable` atau `/plugins disable` memicu
pemuatan ulang plugin Gateway di dalam proses. Giliran agen baru membangun ulang daftar alatnya dari
registri plugin yang telah disegarkan. Operasi yang mengubah sumber seperti pemasangan,
pembaruan, dan penghapusan pemasangan tetap memulai ulang proses Gateway karena modul
plugin yang sudah diimpor tidak dapat diganti di tempat secara aman.

`openclaw plugins list` adalah cuplikan registri/konfigurasi plugin lokal. Plugin
`enabled` di sana berarti registri persisten dan konfigurasi saat ini mengizinkan
plugin untuk berpartisipasi. Itu tidak membuktikan bahwa Gateway jarak jauh yang sudah berjalan
telah dimuat ulang atau dimulai ulang ke kode plugin yang sama. Pada penyiapan VPS/kontainer
dengan proses pembungkus, arahkan mulai ulang atau penulisan yang memicu pemuatan ulang ke proses
`openclaw gateway run` yang sebenarnya, atau gunakan `openclaw gateway restart` terhadap
Gateway yang berjalan ketika pemuatan ulang melaporkan kegagalan.

<Accordion title="Status Plugin: dinonaktifkan vs hilang vs tidak valid">
  - **Dinonaktifkan**: plugin ada tetapi aturan pengaktifan mematikannya. Konfigurasi dipertahankan.
  - **Hilang**: konfigurasi mereferensikan ID plugin yang tidak ditemukan oleh penemuan.
  - **Tidak valid**: plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan. Saat Gateway dimulai, hanya plugin tersebut yang dilewati; `openclaw doctor --fix` dapat mengarantina entri tidak valid dengan menonaktifkannya dan menghapus muatan konfigurasinya.

</Accordion>

## Penemuan dan prioritas

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama yang digunakan):

<Steps>
  <Step title="Jalur konfigurasi">
    `plugins.load.paths` — jalur file atau direktori eksplisit. Jalur yang mengarah
    kembali ke direktori plugin bawaan terpaket milik OpenClaw sendiri diabaikan;
    jalankan `openclaw doctor --fix` untuk menghapus alias usang tersebut.
  </Step>

  <Step title="Plugin ruang kerja">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Disertakan bersama OpenClaw. Banyak yang diaktifkan secara bawaan (penyedia model, ucapan).
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

Instalasi terpaket dan image Docker biasanya menyelesaikan plugin bawaan dari
pohon `dist/extensions` yang dikompilasi. Jika direktori sumber plugin bawaan
dipasang dengan bind mount di atas jalur sumber terpaket yang cocok, misalnya
`/app/extensions/synology-chat`, OpenClaw memperlakukan direktori sumber yang dipasang itu
sebagai overlay sumber bawaan dan menemukannya sebelum bundle
`/app/dist/extensions/synology-chat` terpaket. Ini menjaga loop kontainer pemelihara
tetap berjalan tanpa mengalihkan setiap plugin bawaan kembali ke sumber TypeScript.
Setel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk memaksa bundle dist terpaket
meskipun mount overlay sumber ada.

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua plugin dan melewati pekerjaan penemuan/pemuatan plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin yang berasal dari ruang kerja **dinonaktifkan secara bawaan** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti kumpulan aktif-bawaan internal kecuali ditimpa
- Slot eksklusif dapat memaksa aktif plugin yang dipilih untuk slot tersebut
- Sebagian plugin bawaan yang perlu diikutsertakan diaktifkan otomatis ketika konfigurasi menamai
  permukaan milik plugin, seperti referensi model penyedia, konfigurasi kanal, atau runtime
  harness
- Konfigurasi plugin usang dipertahankan selama `plugins.enabled: false` aktif;
  aktifkan ulang plugin sebelum menjalankan pembersihan doctor jika Anda ingin ID usang dihapus
- Rute Codex keluarga OpenAI menjaga batas plugin terpisah:
  `openai-codex/*` milik plugin OpenAI, sedangkan plugin app-server Codex
  bawaan dipilih oleh `agentRuntime.id: "codex"` atau referensi model lama
  `codex/*`

## Memecahkan masalah hook waktu jalan

Jika plugin muncul di `plugins list` tetapi efek samping atau hook `register(api)`
tidak berjalan dalam trafik percakapan langsung, periksa ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan pastikan URL
  Gateway aktif, profil, jalur konfigurasi, dan prosesnya adalah yang sedang Anda edit.
- Mulai ulang Gateway yang sedang aktif setelah perubahan pemasangan/konfigurasi/kode plugin. Dalam kontainer
  pembungkus, PID 1 mungkin hanya supervisor; mulai ulang atau beri sinyal proses anak
  `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --runtime --json` untuk memastikan pendaftaran hook dan
  diagnostik. Hook percakapan non-bawaan seperti `llm_input`,
  `llm_output`, `before_agent_finalize`, dan `agent_end` memerlukan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk pergantian model, utamakan `before_model_resolve`. Ini berjalan sebelum penyelesaian model
  untuk giliran agen; `llm_output` hanya berjalan setelah percobaan model
  menghasilkan keluaran asisten.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau
  permukaan sesi/status Gateway dan, ketika men-debug muatan penyedia, mulai
  Gateway dengan `--raw-stream --raw-stream-path <path>`.

### Penyiapan alat plugin lambat

Jika giliran agen tampak macet saat menyiapkan alat, aktifkan pencatatan trace dan
periksa baris waktu pembuat alat plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cari:

```text
[trace:plugin-tools] factory timings ...
```

Ringkasan mencantumkan total waktu pembuat dan pembuat alat plugin paling lambat,
termasuk ID plugin, nama alat yang dideklarasikan, bentuk hasil, dan apakah alat tersebut
opsional. Baris lambat dinaikkan menjadi peringatan ketika satu pembuat memerlukan
setidaknya 1 dtk atau total persiapan pembuat alat plugin memerlukan setidaknya 5 dtk.

OpenClaw menyimpan cache hasil pembuat alat plugin yang berhasil untuk penyelesaian berulang
dengan konteks permintaan efektif yang sama. Kunci cache mencakup konfigurasi
waktu jalan efektif, ruang kerja, ID agen/sesi, kebijakan sandbox, pengaturan peramban,
konteks pengiriman, identitas peminta, dan status kepemilikan, sehingga pembuat yang
bergantung pada bidang tepercaya tersebut dijalankan ulang ketika konteks berubah.

Jika satu plugin mendominasi waktu, periksa pendaftaran waktu jalannya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Lalu perbarui, pasang ulang, atau nonaktifkan plugin tersebut. Penulis plugin sebaiknya memindahkan
pemuatan dependensi berat ke balik jalur eksekusi alat alih-alih melakukannya
di dalam pembuat alat.

### Kepemilikan kanal atau alat duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu plugin aktif mencoba memiliki kanal,
alur penyiapan, atau nama alat yang sama. Penyebab paling umum adalah plugin kanal eksternal
yang dipasang berdampingan dengan plugin bawaan yang kini menyediakan ID kanal yang sama.

Langkah penelusuran masalah:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap plugin aktif
  dan asalnya.
- Jalankan `openclaw plugins inspect <id> --runtime --json` untuk setiap plugin yang dicurigai dan
  bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah memasang atau menghapus
  paket plugin agar metadata persisten mencerminkan instalasi saat ini.
- Mulai ulang Gateway setelah perubahan pemasangan, registri, atau konfigurasi.

Opsi perbaikan:

- Jika satu plugin sengaja menggantikan plugin lain untuk ID kanal yang sama, plugin
  yang diutamakan harus mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan
  ID plugin yang prioritasnya lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikasi tidak disengaja, nonaktifkan salah satu pihak dengan
  `plugins.entries.<plugin-id>.enabled: false` atau hapus instalasi plugin
  usang.
- Jika Anda mengaktifkan kedua plugin secara eksplisit, OpenClaw mempertahankan permintaan itu dan
  melaporkan konflik. Pilih satu pemilik untuk kanal atau ganti nama alat milik plugin
  agar permukaan waktu jalan tidak ambigu.

## Slot Plugin (kategori eksklusif)

Sebagian kategori bersifat eksklusif (hanya satu yang aktif pada satu waktu):

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

| Slot            | Yang dikendalikan     | Bawaan              |
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

Plugin bawaan dikirim bersama OpenClaw. Banyak yang diaktifkan secara bawaan (misalnya
penyedia model bawaan, penyedia ucapan bawaan, dan plugin peramban
bawaan). Plugin bawaan lain tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin atau paket hook yang sudah dipasang di tempat. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk pemutakhiran rutin plugin npm
yang dilacak. Ini tidak didukung dengan `--link`, yang menggunakan ulang jalur sumber alih-alih
menyalin ke atas target instalasi terkelola.

Ketika `plugins.allow` sudah disetel, `openclaw plugins install` menambahkan
ID plugin yang dipasang ke daftar izin tersebut sebelum mengaktifkannya. Jika ID plugin yang sama
ada dalam `plugins.deny`, pemasangan menghapus entri deny usang itu agar
pemasangan eksplisit segera dapat dimuat setelah mulai ulang.

OpenClaw menyimpan registri Plugin lokal persisten sebagai model baca awal untuk
inventaris Plugin, kepemilikan kontribusi, dan perencanaan startup. Alur install,
update, uninstall, enable, dan disable menyegarkan registri tersebut setelah mengubah
status Plugin. File `plugins/installs.json` yang sama menyimpan metadata install tahan lama di
`installRecords` tingkat atas dan metadata manifes yang dapat dibangun ulang di `plugins`. Jika
registri hilang, usang, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifesnya dari catatan install, kebijakan konfigurasi, dan
metadata manifes/paket tanpa memuat modul runtime Plugin.
`openclaw plugins update <id-or-npm-spec>` berlaku untuk install yang dilacak. Meneruskan
spesifikasi paket npm dengan dist-tag atau versi pasti menyelesaikan nama paket
kembali ke catatan Plugin yang dilacak dan mencatat spesifikasi baru untuk update berikutnya.
Meneruskan nama paket tanpa versi memindahkan install yang dipin tepat kembali ke
jalur rilis default registri. Jika Plugin npm yang terinstal sudah cocok dengan
versi yang diselesaikan dan identitas artefak yang tercatat, OpenClaw melewati update
tanpa mengunduh, menginstal ulang, atau menulis ulang konfigurasi.
Saat `openclaw update` berjalan di kanal beta, catatan Plugin npm dan ClawHub
pada jalur default mencoba `@beta` terlebih dahulu dan kembali ke default/latest saat tidak ada
rilis beta Plugin. Versi pasti dan tag eksplisit tetap dipin.

`--pin` hanya untuk npm. Ini tidak didukung dengan `--marketplace`, karena
install marketplace mempertahankan metadata sumber marketplace alih-alih spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override darurat untuk positif palsu
dari pemindai kode berbahaya bawaan. Ini memungkinkan install Plugin
dan update Plugin untuk terus berjalan melewati temuan `critical` bawaan, tetapi tetap
tidak melewati pemblokiran kebijakan `before_install` Plugin atau pemblokiran kegagalan pemindaian.
Pemindaian install mengabaikan file dan direktori pengujian umum seperti `tests/`,
`__tests__/`, `*.test.*`, dan `*.spec.*` agar tidak memblokir mock pengujian yang dipaketkan;
entrypoint runtime Plugin yang dideklarasikan tetap dipindai meskipun menggunakan salah satu
nama tersebut.

Flag CLI ini hanya berlaku untuk alur install/update Plugin. Install dependensi Skills
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall`
yang sesuai, sedangkan `openclaw skills install` tetap menjadi alur download/install Skills
ClawHub yang terpisah.

Jika Plugin yang Anda publikasikan di ClawHub disembunyikan atau diblokir oleh pemindaian, buka
dasbor ClawHub atau jalankan `clawhub package rescan <name>` untuk meminta ClawHub memeriksanya
lagi. `--dangerously-force-unsafe-install` hanya memengaruhi install di mesin Anda sendiri;
ini tidak meminta ClawHub memindai ulang Plugin atau membuat rilis yang diblokir
menjadi publik.

Bundel yang kompatibel berpartisipasi dalam alur daftar/inspeksi/enable/disable
Plugin yang sama. Dukungan runtime saat ini mencakup Skills bundel, Skills perintah Claude,
default `settings.json` Claude, default Claude `.lsp.json` dan `lspServers`
yang dideklarasikan manifes, Skills perintah Cursor, serta direktori hook Codex
yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kapabilitas bundel yang terdeteksi serta
entri server MCP dan LSP yang didukung atau tidak didukung untuk Plugin berbasis bundel.

Sumber marketplace dapat berupa nama marketplace dikenal Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau path
`marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub,
atau URL git. Untuk marketplace jarak jauh, entri Plugin harus tetap berada di dalam
repo marketplace yang dikloning dan hanya menggunakan sumber path relatif.

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
Plugin. Loader masih kembali ke `activate(api)` untuk Plugin lama,
tetapi Plugin bundel dan Plugin eksternal baru sebaiknya memperlakukan `register` sebagai
kontrak publik.

`api.registrationMode` memberi tahu Plugin alasan entrinya sedang dimuat:

| Mode            | Arti                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan alat, hook, layanan, perintah, route, dan efek samping live lainnya.                                 |
| `discovery`     | Penemuan kapabilitas baca-saja. Daftarkan provider dan metadata; kode entri Plugin tepercaya dapat dimuat, tetapi lewati efek samping live. |
| `setup-only`    | Pemuatan metadata setup kanal melalui entri setup ringan.                                                                        |
| `setup-runtime` | Pemuatan setup kanal yang juga membutuhkan entri runtime.                                                                        |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                         |

Entri Plugin yang membuka socket, database, worker latar belakang, atau klien berumur panjang
sebaiknya melindungi efek samping tersebut dengan `api.registrationMode === "full"`.
Pemuatan discovery di-cache terpisah dari pemuatan aktivasi dan tidak menggantikan
registri Gateway yang sedang berjalan. Discovery bersifat nonaktif, bukan bebas impor:
OpenClaw dapat mengevaluasi entri Plugin tepercaya atau modul Plugin kanal untuk membangun
snapshot. Jaga level atas modul tetap ringan dan bebas efek samping, serta pindahkan
klien jaringan, subproses, listener, pembacaan kredensial, dan startup layanan
ke balik path runtime penuh.

Metode registrasi umum:

| Metode                                  | Yang didaftarkan              |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Provider model (LLM)          |
| `registerChannel`                       | Kanal chat                    |
| `registerTool`                          | Alat agen                     |
| `registerHook` / `on(...)`              | Hook siklus hidup             |
| `registerSpeechProvider`                | Text-to-speech / STT          |
| `registerRealtimeTranscriptionProvider` | STT streaming                 |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks        |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio         |
| `registerImageGenerationProvider`       | Pembuatan gambar              |
| `registerMusicGenerationProvider`       | Pembuatan musik               |
| `registerVideoGenerationProvider`       | Pembuatan video               |
| `registerWebFetchProvider`              | Provider web fetch / scrape   |
| `registerWebSearchProvider`             | Pencarian web                 |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Perintah CLI                  |
| `registerContextEngine`                 | Mesin konteks                 |
| `registerService`                       | Layanan latar belakang        |

Perilaku guard hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

App-server Codex native menjembatani event alat Codex-native kembali ke permukaan
hook ini. Plugin dapat memblokir alat Codex native melalui `before_tool_call`,
mengamati hasil melalui `after_tool_call`, dan berpartisipasi dalam persetujuan Codex
`PermissionRequest`. Bridge belum menulis ulang argumen alat Codex-native.
Batas dukungan runtime Codex yang tepat berada di
[kontrak dukungan harness Codex v1](/id/plugins/codex-harness#v1-support-contract).

Untuk perilaku hook bertipe lengkap, lihat [ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — buat Plugin Anda sendiri
- [Bundel Plugin](/id/plugins/bundles) — kompatibilitas bundel Codex/Claude/Cursor
- [Manifes Plugin](/id/plugins/manifest) — skema manifes
- [Mendaftarkan alat](/id/plugins/building-plugins#registering-agent-tools) — tambahkan alat agen di Plugin
- [Internal Plugin](/id/plugins/architecture) — model kapabilitas dan pipeline pemuatan
- [Plugin komunitas](/id/plugins/community) — daftar pihak ketiga
