---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami penemuan Plugin dan aturan pemuatannya
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:54:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: kanal, penyedia model,
harness agen, alat, Skills, ucapan, transkripsi realtime, suara realtime,
pemahaman-media, pembuatan gambar, pembuatan video, pengambilan web, pencarian
web, dan lainnya. Sebagian plugin bersifat **inti** (dikirim bersama OpenClaw),
sebagian lainnya **eksternal**. Sebagian besar plugin eksternal dipublikasikan
dan ditemukan melalui [ClawHub](/id/tools/clawhub). Npm tetap didukung untuk
instalasi langsung dan untuk sekumpulan sementara paket plugin milik OpenClaw
selama migrasi tersebut selesai.

## Mulai cepat

Untuk contoh instalasi, daftar, hapus instalasi, pembaruan, dan publikasi yang
dapat disalin-tempel, lihat [Kelola plugin](/id/plugins/manage-plugins).

<Steps>
  <Step title="Lihat yang dimuat">
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

  <Step title="Pengelolaan asli obrolan">
    Dalam Gateway yang sedang berjalan, `/plugins enable` dan `/plugins disable`
    khusus pemilik memicu pemuat ulang konfigurasi Gateway. Gateway memuat ulang
    permukaan runtime plugin di dalam proses, dan giliran agen baru membangun ulang
    daftar alatnya dari registry yang telah disegarkan. `/plugins install`
    mengubah kode sumber plugin, sehingga Gateway meminta mulai ulang alih-alih
    berpura-pura proses saat ini dapat memuat ulang modul yang sudah diimpor
    dengan aman.

  </Step>

  <Step title="Verifikasi plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gunakan `--runtime` saat Anda perlu membuktikan alat terdaftar, layanan,
    metode gateway, hook, atau perintah CLI milik plugin. `inspect` biasa adalah
    pemeriksaan manifes/registry dingin dan sengaja menghindari impor runtime
    plugin.

  </Step>
</Steps>

Jika Anda lebih suka kontrol asli obrolan, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Jalur instalasi menggunakan resolver yang sama seperti CLI: path/arsip lokal,
`clawhub:<pkg>` eksplisit, `npm:<pkg>` eksplisit, `npm-pack:<path.tgz>`
eksplisit, `git:<repo>` eksplisit, atau spesifikasi paket polos melalui npm.

Jika konfigurasi tidak valid, instalasi biasanya gagal tertutup dan mengarahkan
Anda ke `openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur
instal ulang plugin bawaan yang sempit untuk plugin yang memilih ikut ke
`openclaw.install.allowInvalidConfigRecovery`.
Selama startup Gateway, konfigurasi plugin yang tidak valid gagal tertutup
seperti konfigurasi tidak valid lainnya. Jalankan `openclaw doctor --fix` untuk
mengarantina konfigurasi plugin yang buruk dengan menonaktifkan entri plugin
tersebut dan menghapus payload konfigurasi tidak validnya; cadangan konfigurasi
normal menyimpan nilai sebelumnya.
Saat konfigurasi kanal merujuk ke plugin yang tidak lagi dapat ditemukan tetapi
id plugin usang yang sama tetap ada dalam konfigurasi plugin atau catatan
instalasi, startup Gateway mencatat peringatan dan melewati kanal tersebut
alih-alih memblokir setiap kanal lainnya. Jalankan `openclaw doctor --fix` untuk
menghapus entri kanal/plugin usang; kunci kanal yang tidak dikenal tanpa bukti
plugin usang tetap menggagalkan validasi agar salah ketik tetap terlihat.
Jika `plugins.enabled: false` ditetapkan, referensi plugin usang diperlakukan
sebagai inert: startup Gateway melewati pekerjaan penemuan/pemuatan plugin dan
`openclaw doctor` mempertahankan konfigurasi plugin yang dinonaktifkan alih-alih
menghapusnya otomatis. Aktifkan kembali plugin sebelum menjalankan pembersihan
doctor jika Anda ingin id plugin usang dihapus.

Instalasi dependensi plugin hanya terjadi selama alur instalasi/pembaruan
eksplisit atau perbaikan doctor. Startup Gateway, pemuatan ulang konfigurasi, dan
inspeksi runtime tidak menjalankan manajer paket atau memperbaiki pohon
dependensi. Plugin lokal harus sudah memasang dependensinya, sedangkan plugin
npm, git, dan ClawHub dipasang di bawah root plugin terkelola OpenClaw. Dependensi
npm dapat di-hoist dalam root npm terkelola OpenClaw; instalasi/pembaruan memindai
root terkelola tersebut sebelum trust dan penghapusan instalasi menghapus paket
terkelola npm melalui npm. Plugin eksternal dan path muat kustom tetap harus
dipasang melalui `openclaw plugins install`. Gunakan
`openclaw plugins list --json` untuk melihat `dependencyStatus` statis bagi
setiap plugin yang terlihat tanpa mengimpor kode runtime atau memperbaiki
dependensi. Lihat [Resolusi dependensi plugin](/id/plugins/dependency-resolution)
untuk siklus hidup saat instalasi.

### Kepemilikan path plugin yang diblokir

Jika diagnostik plugin mengatakan
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
dan validasi konfigurasi diikuti dengan `plugin present but blocked`, OpenClaw
menemukan file plugin yang dimiliki oleh pengguna Unix berbeda dari proses yang
memuatnya. Biarkan konfigurasi plugin tetap ada; perbaiki kepemilikan sistem
file atau jalankan OpenClaw sebagai pengguna yang sama yang memiliki direktori
state.

Untuk instalasi Docker, image resmi berjalan sebagai `node` (uid `1000`), jadi
direktori konfigurasi dan workspace OpenClaw yang di-bind mount dari host
biasanya harus dimiliki oleh uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jika Anda sengaja menjalankan OpenClaw sebagai root, perbaiki root plugin
terkelola agar dimiliki root sebagai gantinya:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Setelah memperbaiki kepemilikan, jalankan ulang `openclaw doctor --fix` atau
`openclaw plugins registry --refresh` agar registry plugin yang tersimpan sesuai
dengan file yang telah diperbaiki.

Untuk instalasi npm, selector mutable seperti `latest` atau dist-tag di-resolve
sebelum instalasi lalu dipin ke versi terverifikasi yang tepat dalam root npm
terkelola OpenClaw. Setelah npm selesai, OpenClaw memverifikasi entri
`package-lock.json` yang terpasang masih cocok dengan versi dan integritas yang
di-resolve. Jika npm menulis metadata paket yang berbeda, instalasi gagal dan
paket terkelola dikembalikan alih-alih menerima artefak plugin yang berbeda.
Root npm terkelola juga mewarisi `overrides` npm tingkat paket OpenClaw, sehingga
pin keamanan yang melindungi host terpaketkan juga berlaku pada dependensi
plugin eksternal yang di-hoist.

Checkout sumber adalah workspace pnpm. Jika Anda mengkloning OpenClaw untuk
mengutak-atik plugin bawaan, jalankan `pnpm install`; OpenClaw kemudian memuat
plugin bawaan dari `extensions/<id>` sehingga edit dan dependensi lokal paket
digunakan langsung. Instalasi root npm biasa ditujukan untuk OpenClaw terpaketkan,
bukan pengembangan checkout sumber.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                     | Contoh                                                 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi dalam proses    | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak kompatibel Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundle Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entry point paket

Paket npm plugin native harus mendeklarasikan `openclaw.extensions` dalam
`package.json`. Setiap entri harus tetap berada di dalam direktori paket dan
di-resolve ke file runtime yang dapat dibaca, atau ke file sumber TypeScript
dengan pasangan JavaScript hasil build yang diinferensi seperti `src/index.ts`
ke `dist/index.js`.
Instalasi terpaketkan harus mengirimkan output runtime JavaScript tersebut.
Fallback sumber TypeScript ditujukan untuk checkout sumber dan path pengembangan
lokal, bukan untuk paket npm yang dipasang ke root plugin terkelola OpenClaw.

Jika peringatan paket terkelola mengatakan paket tersebut `requires compiled
runtime output for TypeScript entry ...`, paket dipublikasikan tanpa file
JavaScript yang dibutuhkan OpenClaw saat runtime. Itu adalah masalah pengemasan
plugin, bukan masalah konfigurasi lokal. Perbarui atau instal ulang plugin
setelah penerbit memublikasikan ulang JavaScript terkompilasi, atau nonaktifkan/
hapus instalasi plugin tersebut sampai paket yang diperbaiki tersedia.

Gunakan `openclaw.runtimeExtensions` saat file runtime yang dipublikasikan tidak
berada pada path yang sama seperti entri sumber. Jika ada, `runtimeExtensions`
harus berisi tepat satu entri untuk setiap entri `extensions`. Daftar yang tidak
cocok menggagalkan instalasi dan penemuan plugin alih-alih diam-diam fallback ke
path sumber. Jika Anda juga memublikasikan `openclaw.setupEntry`, gunakan
`openclaw.runtimeSetupEntry` untuk pasangan JavaScript hasil build-nya; file itu
wajib saat dideklarasikan.

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
terpaketkan saat ini sudah membundel banyak plugin resmi, sehingga plugin
tersebut tidak memerlukan instalasi npm terpisah dalam setup normal. Sampai
setiap plugin milik OpenClaw bermigrasi ke ClawHub, OpenClaw masih mengirimkan
beberapa paket plugin `@openclaw/*` di npm untuk instalasi lama/kustom dan alur
kerja npm langsung.

Jika npm melaporkan paket plugin `@openclaw/*` sebagai deprecated, versi paket
tersebut berasal dari rangkaian paket eksternal yang lebih lama. Gunakan plugin
bawaan dari OpenClaw saat ini atau checkout lokal sampai paket npm yang lebih
baru dipublikasikan.

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
    - `memory-lancedb` - memori jangka panjang berbasis LanceDB dengan recall/capture otomatis (atur `plugins.slots.memory = "memory-lancedb"`)

    Lihat [Memory LanceDB](/id/plugins/memory-lancedb) untuk penyiapan embedding yang kompatibel dengan OpenAI, contoh Ollama, batas recall, dan pemecahan masalah.

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
| `enabled`          | Toggle utama (default: `true`)                            |
| `allow`            | Allowlist plugin (opsional)                               |
| `bundledDiscovery` | Mode penemuan plugin bawaan (`allowlist` secara default)  |
| `deny`             | Denylist plugin (opsional; deny menang)                   |
| `load.paths`       | File/direktori plugin tambahan                            |
| `slots`            | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>`   | Toggle + konfigurasi per plugin                           |

`plugins.allow` bersifat eksklusif. Saat nilainya tidak kosong, hanya plugin yang tercantum yang dapat dimuat atau mengekspos alat, meskipun `tools.allow` berisi `"*"` atau nama alat milik plugin tertentu. Jika allowlist alat mereferensikan alat plugin, tambahkan id plugin pemilik ke `plugins.allow` atau hapus `plugins.allow`; `openclaw doctor` memperingatkan bentuk ini.

`plugins.bundledDiscovery` default ke `"allowlist"` untuk konfigurasi baru, sehingga inventaris `plugins.allow` yang restriktif juga memblokir plugin penyedia bawaan yang dihilangkan, termasuk penemuan penyedia pencarian web runtime. Doctor memberi cap konfigurasi allowlist restriktif lama dengan `"compat"` selama migrasi agar upgrade mempertahankan perilaku penyedia bawaan lama sampai operator memilih mode yang lebih ketat. `plugins.allow` kosong tetap diperlakukan sebagai belum diatur/terbuka.

Perubahan konfigurasi yang dibuat melalui `/plugins enable` atau `/plugins disable` memicu pemuatan ulang plugin Gateway dalam proses. Giliran agen baru membangun ulang daftar alatnya dari registri plugin yang disegarkan. Operasi yang mengubah sumber seperti install, update, dan uninstall tetap me-restart proses Gateway karena modul plugin yang sudah diimpor tidak dapat diganti dengan aman di tempat.

`openclaw plugins list` adalah snapshot registri/konfigurasi plugin lokal. Plugin `enabled` di sana berarti registri yang dipersistenkan dan konfigurasi saat ini mengizinkan plugin untuk berpartisipasi. Itu tidak membuktikan bahwa Gateway jarak jauh yang sudah berjalan telah memuat ulang atau me-restart ke kode plugin yang sama. Pada penyiapan VPS/kontainer dengan proses wrapper, kirim restart atau penulisan yang memicu pemuatan ulang ke proses `openclaw gateway run` yang sebenarnya, atau gunakan `openclaw gateway restart` terhadap Gateway yang berjalan saat laporan pemuatan ulang gagal.

<Accordion title="Status plugin: dinonaktifkan vs hilang vs tidak valid">
  - **Dinonaktifkan**: plugin ada tetapi aturan pengaktifan mematikannya. Konfigurasi dipertahankan.
  - **Hilang**: konfigurasi mereferensikan id plugin yang tidak ditemukan oleh penemuan.
  - **Tidak valid**: plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan. Startup Gateway hanya melewati plugin tersebut; `openclaw doctor --fix` dapat mengarantina entri yang tidak valid dengan menonaktifkannya dan menghapus payload konfigurasinya.

</Accordion>

## Penemuan dan presedensi

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Path konfigurasi">
    `plugins.load.paths` - path file atau direktori eksplisit. Path yang menunjuk kembali ke direktori plugin bawaan terpaket milik OpenClaw sendiri diabaikan; jalankan `openclaw doctor --fix` untuk menghapus alias usang tersebut.
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

Instalasi terpaket dan image Docker biasanya menyelesaikan plugin bawaan dari pohon `dist/extensions` yang dikompilasi. Jika direktori sumber plugin bawaan di-bind-mount di atas path sumber terpaket yang cocok, misalnya `/app/extensions/synology-chat`, OpenClaw memperlakukan direktori sumber yang di-mount tersebut sebagai overlay sumber bawaan dan menemukannya sebelum bundle `/app/dist/extensions/synology-chat` terpaket. Ini menjaga loop kontainer maintainer tetap berfungsi tanpa mengalihkan setiap plugin bawaan kembali ke sumber TypeScript. Atur `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk memaksa bundle dist terpaket meskipun mount overlay sumber ada.

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua plugin dan melewati pekerjaan penemuan/pemuatan plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin asal workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti kumpulan default aktif bawaan kecuali ditimpa
- Slot eksklusif dapat memaksa pengaktifan plugin yang dipilih untuk slot tersebut
- Beberapa plugin bawaan opt-in diaktifkan otomatis saat konfigurasi menamai surface milik plugin, seperti ref model penyedia, konfigurasi kanal, atau runtime harness
- Konfigurasi plugin usang dipertahankan saat `plugins.enabled: false` aktif; aktifkan ulang plugin sebelum menjalankan pembersihan doctor jika Anda ingin id usang dihapus
- Rute Codex keluarga OpenAI mempertahankan batas plugin terpisah: `openai-codex/*` milik plugin OpenAI, sementara plugin app-server Codex bawaan dipilih oleh `agentRuntime.id: "codex"` atau ref model lama `codex/*`

## Memecahkan masalah hook runtime

Jika plugin muncul di `plugins list` tetapi efek samping atau hook `register(api)` tidak berjalan dalam traffic chat langsung, periksa ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan konfirmasikan URL Gateway aktif, profil, path konfigurasi, dan proses adalah yang sedang Anda edit.
- Restart Gateway langsung setelah perubahan install/konfigurasi/kode plugin. Dalam kontainer wrapper, PID 1 mungkin hanya supervisor; restart atau kirim sinyal ke proses anak `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --runtime --json` untuk mengonfirmasi registrasi hook dan diagnostik. Hook percakapan non-bawaan seperti `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`, `before_agent_finalize`, dan `agent_end` memerlukan `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk pengalihan model, utamakan `before_model_resolve`. Ini berjalan sebelum resolusi model untuk giliran agen; `llm_output` hanya berjalan setelah percobaan model menghasilkan output asisten.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau surface sesi/status Gateway dan, saat men-debug payload penyedia, mulai Gateway dengan `--raw-stream --raw-stream-path <path>`.

### Penyiapan alat plugin yang lambat

Jika giliran agen tampak tersendat saat menyiapkan alat, aktifkan logging trace dan periksa baris timing factory alat plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cari:

```text
[trace:plugin-tools] factory timings ...
```

Ringkasan mencantumkan total waktu factory dan factory alat plugin terlambat, termasuk id plugin, nama alat yang dideklarasikan, bentuk hasil, dan apakah alat tersebut opsional. Baris lambat dipromosikan menjadi peringatan saat satu factory membutuhkan setidaknya 1 dtk atau total persiapan factory alat plugin membutuhkan setidaknya 5 dtk.

OpenClaw menyimpan cache hasil factory alat plugin yang berhasil untuk resolusi berulang dengan konteks permintaan efektif yang sama. Kunci cache mencakup konfigurasi runtime efektif, workspace, id agen/sesi, kebijakan sandbox, pengaturan browser, konteks pengiriman, identitas peminta, dan status kepemilikan, sehingga factory yang bergantung pada bidang tepercaya tersebut dijalankan ulang saat konteks berubah.

Jika satu plugin mendominasi timing, periksa registrasi runtime-nya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Lalu update, install ulang, atau nonaktifkan plugin tersebut. Penulis plugin sebaiknya memindahkan pemuatan dependensi yang mahal ke balik path eksekusi alat, bukan melakukannya di dalam factory alat.

### Kepemilikan kanal atau alat duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu plugin yang diaktifkan mencoba memiliki kanal, alur penyiapan, atau nama alat yang sama. Penyebab paling umum adalah plugin kanal eksternal yang dipasang berdampingan dengan plugin bawaan yang kini menyediakan id kanal yang sama.

Langkah debug:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap plugin yang diaktifkan dan asalnya.
- Jalankan `openclaw plugins inspect <id> --runtime --json` untuk setiap plugin yang dicurigai dan bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah memasang atau menghapus paket plugin agar metadata yang dipersistenkan mencerminkan instalasi saat ini.
- Restart Gateway setelah perubahan install, registri, atau konfigurasi.

Opsi perbaikan:

- Jika satu plugin sengaja menggantikan yang lain untuk id kanal yang sama, plugin yang diutamakan harus mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan id plugin berprioritas lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikat terjadi tidak sengaja, nonaktifkan salah satu sisi dengan `plugins.entries.<plugin-id>.enabled: false` atau hapus instalasi plugin usang.
- Jika Anda secara eksplisit mengaktifkan kedua plugin, OpenClaw mempertahankan permintaan itu dan melaporkan konflik. Pilih satu pemilik untuk kanal atau ganti nama alat milik plugin agar surface runtime tidak ambigu.

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

| Slot            | Yang dikontrol       | Default             |
| --------------- | -------------------- | ------------------- |
| `memory`        | Plugin memori aktif  | `memory-core`       |
| `contextEngine` | Mesin konteks aktif  | `legacy` (bawaan)   |

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

Plugin bawaan dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (misalnya penyedia model bawaan, penyedia ucapan bawaan, dan Plugin browser bawaan). Plugin bawaan lain masih memerlukan `openclaw plugins enable <id>`.

`--force` menimpa Plugin terpasang atau paket hook yang sudah ada di tempatnya. Gunakan `openclaw plugins update <id-or-npm-spec>` untuk peningkatan rutin Plugin npm yang dilacak. Ini tidak didukung dengan `--link`, yang menggunakan ulang jalur sumber alih-alih menyalin ke target pemasangan terkelola.

Ketika `plugins.allow` sudah ditetapkan, `openclaw plugins install` menambahkan id Plugin yang dipasang ke allowlist tersebut sebelum mengaktifkannya. Jika id Plugin yang sama ada di `plugins.deny`, pemasangan menghapus entri deny yang usang itu sehingga pemasangan eksplisit langsung dapat dimuat setelah restart.

OpenClaw mempertahankan registri Plugin lokal persisten sebagai model baca awal untuk inventaris Plugin, kepemilikan kontribusi, dan perencanaan startup. Alur pemasangan, pembaruan, pencopotan, pengaktifan, dan penonaktifan menyegarkan registri tersebut setelah mengubah status Plugin. File `plugins/installs.json` yang sama menyimpan metadata pemasangan tahan lama di `installRecords` tingkat atas dan metadata manifes yang dapat dibangun ulang di `plugins`. Jika registri hilang, usang, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifesnya dari catatan pemasangan, kebijakan konfigurasi, dan metadata manifes/paket tanpa memuat modul runtime Plugin.

Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), mutator siklus hidup Plugin dinonaktifkan. Kelola pilihan paket Plugin dan konfigurasi melalui sumber Nix untuk pemasangan tersebut; untuk nix-openclaw, mulai dengan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agent. `openclaw plugins update <id-or-npm-spec>` berlaku untuk pemasangan yang dilacak. Memberikan spesifikasi paket npm dengan dist-tag atau versi persis akan menyelesaikan nama paket kembali ke catatan Plugin yang dilacak dan mencatat spesifikasi baru untuk pembaruan mendatang. Memberikan nama paket tanpa versi memindahkan pemasangan yang dipin persis kembali ke lini rilis default registri. Jika Plugin npm yang terpasang sudah cocok dengan versi yang diselesaikan dan identitas artefak yang tercatat, OpenClaw melewati pembaruan tanpa mengunduh, memasang ulang, atau menulis ulang konfigurasi.
Ketika `openclaw update` berjalan pada kanal beta, catatan Plugin npm dan ClawHub lini default mencoba `@beta` terlebih dahulu dan kembali ke default/latest ketika tidak ada rilis beta Plugin. Versi persis dan tag eksplisit tetap dipin.

OpenClaw belum mengekspos kanal Plugin dukungan LTS atau bulanan. Pekerjaan lini dukungan bulanan yang direncanakan akan memerlukan tag npm dan ClawHub Plugin untuk mengikuti lini dukungan yang sama dengan paket inti, alih-alih diam-diam menggunakan `latest`.

`--pin` hanya untuk npm. Ini tidak didukung dengan `--marketplace`, karena pemasangan marketplace mempertahankan metadata sumber marketplace alih-alih spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override darurat untuk positif palsu dari pemindai kode berbahaya bawaan. Ini memungkinkan pemasangan Plugin dan pembaruan Plugin berlanjut melewati temuan `critical` bawaan, tetapi tetap tidak melewati blok kebijakan `before_install` Plugin atau pemblokiran kegagalan pemindaian. Pemindaian pemasangan mengabaikan file dan direktori pengujian umum seperti `tests/`, `__tests__/`, `*.test.*`, dan `*.spec.*` agar tidak memblokir mock pengujian yang dipaketkan; entrypoint runtime Plugin yang dideklarasikan tetap dipindai meskipun menggunakan salah satu nama tersebut.

Flag CLI ini hanya berlaku untuk alur pemasangan/pembaruan Plugin. Pemasangan dependensi skill yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sedangkan `openclaw skills install` tetap menjadi alur unduh/pasang skill ClawHub yang terpisah.

Jika Plugin yang Anda terbitkan di ClawHub disembunyikan atau diblokir oleh pemindaian, buka dasbor ClawHub atau jalankan `clawhub package rescan <name>` untuk meminta ClawHub memeriksanya lagi. `--dangerously-force-unsafe-install` hanya memengaruhi pemasangan di mesin Anda sendiri; ini tidak meminta ClawHub memindai ulang Plugin atau membuat rilis yang diblokir menjadi publik.

Bundle yang kompatibel berpartisipasi dalam alur daftar/periksa/aktifkan/nonaktifkan Plugin yang sama. Dukungan runtime saat ini mencakup Skills bundle, command-skills Claude, default `settings.json` Claude, default `.lsp.json` Claude dan `lspServers` yang dideklarasikan manifes, command-skills Cursor, dan direktori hook Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kapabilitas bundle yang terdeteksi serta entri server MCP dan LSP yang didukung atau tidak didukung untuk Plugin berbasis bundle.

Sumber marketplace dapat berupa nama marketplace Claude yang dikenal dari `~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau jalur `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. Untuk marketplace jarak jauh, entri Plugin harus tetap berada di dalam repo marketplace yang dikloning dan hanya menggunakan sumber jalur relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Gambaran umum API Plugin

Plugin native mengekspor objek entri yang mengekspos `register(api)`. Plugin lama mungkin masih menggunakan `activate(api)` sebagai alias lama, tetapi Plugin baru sebaiknya menggunakan `register`.

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

OpenClaw memuat objek entri dan memanggil `register(api)` selama aktivasi Plugin. Loader masih kembali ke `activate(api)` untuk Plugin lama, tetapi Plugin bawaan dan Plugin eksternal baru sebaiknya memperlakukan `register` sebagai kontrak publik.

`api.registrationMode` memberi tahu Plugin mengapa entrinya sedang dimuat:

| Mode            | Makna                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan tool, hook, layanan, perintah, rute, dan efek samping live lainnya.                                    |
| `discovery`     | Penemuan kapabilitas hanya-baca. Daftarkan penyedia dan metadata; kode entri Plugin tepercaya dapat dimuat, tetapi lewati efek samping live. |
| `setup-only`    | Pemuatan metadata penyiapan kanal melalui entri penyiapan ringan.                                                                  |
| `setup-runtime` | Pemuatan penyiapan kanal yang juga memerlukan entri runtime.                                                                       |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                            |

Entri Plugin yang membuka soket, basis data, pekerja latar belakang, atau klien berumur panjang sebaiknya menjaga efek samping tersebut dengan `api.registrationMode === "full"`. Muatan discovery di-cache terpisah dari muatan aktivasi dan tidak menggantikan registri Gateway yang berjalan. Discovery bersifat non-aktif, bukan bebas-impor: OpenClaw dapat mengevaluasi entri Plugin tepercaya atau modul Plugin kanal untuk membangun snapshot. Jaga level atas modul tetap ringan dan bebas efek samping, serta pindahkan klien jaringan, subprocess, listener, pembacaan kredensial, dan startup layanan ke balik jalur runtime penuh.

Metode registrasi umum:

| Metode                                  | Yang didaftarkan             |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Penyedia model (LLM)         |
| `registerChannel`                       | Kanal chat                   |
| `registerTool`                          | Tool agent                   |
| `registerHook` / `on(...)`              | Hook siklus hidup            |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | STT streaming                |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks       |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio        |
| `registerImageGenerationProvider`       | Pembuatan gambar             |
| `registerMusicGenerationProvider`       | Pembuatan musik              |
| `registerVideoGenerationProvider`       | Pembuatan video              |
| `registerWebFetchProvider`              | Penyedia fetch/scrape web    |
| `registerWebSearchProvider`             | Pencarian web                |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Perintah CLI                 |
| `registerContextEngine`                 | Mesin konteks                |
| `registerService`                       | Layanan latar belakang       |

Perilaku guard hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus block sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus block sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus cancel sebelumnya.

Server aplikasi native Codex menjalankan peristiwa alat native Codex melalui bridge kembali ke permukaan hook ini. Plugin dapat memblokir alat native Codex melalui `before_tool_call`, mengamati hasil melalui `after_tool_call`, dan berpartisipasi dalam persetujuan `PermissionRequest` Codex. Bridge belum menulis ulang argumen alat native Codex. Batas dukungan runtime Codex yang tepat berada di [kontrak dukungan harness Codex v1](/id/plugins/codex-harness#v1-support-contract).

Untuk perilaku hook bertipe penuh, lihat [ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) - buat Plugin Anda sendiri
- [Bundel Plugin](/id/plugins/bundles) - kompatibilitas bundel Codex/Claude/Cursor
- [Manifes Plugin](/id/plugins/manifest) - skema manifes
- [Mendaftarkan alat](/id/plugins/building-plugins#registering-agent-tools) - tambahkan alat agen dalam Plugin
- [Internal Plugin](/id/plugins/architecture) - model kapabilitas dan pipeline pemuatan
- [Plugin komunitas](/id/plugins/community) - daftar pihak ketiga
