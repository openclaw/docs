---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami aturan penemuan dan pemuatan Plugin
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-01T09:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2df8aca086aafbd8f268820f1ccc2425079c69f1a673a4c2ea163aba1358ff51
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: saluran, penyedia model,
harness agen, alat, Skills, ucapan, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, pencarian
web, dan lainnya. Sebagian Plugin bersifat **inti** (dikirimkan bersama OpenClaw),
sementara yang lain bersifat **eksternal**. Sebagian besar Plugin eksternal
dipublikasikan dan ditemukan melalui [ClawHub](/id/tools/clawhub). Npm tetap
didukung untuk instalasi langsung dan untuk serangkaian sementara paket Plugin
milik OpenClaw selagi migrasi tersebut diselesaikan.

## Mulai cepat

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Lalu konfigurasikan di bawah `plugins.entries.\<id\>.config` dalam file konfigurasi Anda.

  </Step>
</Steps>

Jika Anda lebih memilih kontrol asli chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Jalur instalasi menggunakan resolver yang sama dengan CLI: jalur/arsip lokal,
`clawhub:<pkg>` eksplisit, `npm:<pkg>` eksplisit, atau spesifikasi paket polos
(ClawHub terlebih dahulu, lalu fallback npm).

Jika konfigurasi tidak valid, instalasi biasanya gagal tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur sempit
instalasi ulang Plugin bawaan untuk Plugin yang ikut serta dalam
`openclaw.install.allowInvalidConfigRecovery`.
Selama startup Gateway, konfigurasi tidak valid untuk satu Plugin diisolasi ke Plugin itu:
startup mencatat masalah `plugins.entries.<id>.config`, melewati Plugin tersebut saat
memuat, dan menjaga Plugin serta saluran lain tetap online. Jalankan `openclaw doctor --fix`
untuk mengarantina konfigurasi Plugin yang buruk dengan menonaktifkan entri Plugin tersebut
dan menghapus payload konfigurasi yang tidak valid; cadangan konfigurasi normal mempertahankan
nilai sebelumnya.
Ketika konfigurasi saluran merujuk ke Plugin yang tidak lagi dapat ditemukan tetapi id
Plugin usang yang sama tetap ada dalam konfigurasi Plugin atau catatan instalasi, startup Gateway
mencatat peringatan dan melewati saluran tersebut alih-alih memblokir setiap saluran lain.
Jalankan `openclaw doctor --fix` untuk menghapus entri saluran/Plugin usang; kunci
saluran yang tidak dikenal tanpa bukti Plugin usang tetap menggagalkan validasi agar salah ketik
tetap terlihat.
Jika `plugins.enabled: false` ditetapkan, referensi Plugin usang diperlakukan sebagai inert:
startup Gateway melewati pekerjaan penemuan/pemuatan Plugin dan `openclaw doctor` mempertahankan
konfigurasi Plugin yang dinonaktifkan alih-alih menghapusnya otomatis. Aktifkan kembali Plugin sebelum
menjalankan pembersihan doctor jika Anda ingin id Plugin usang dihapus.

Instalasi OpenClaw terpaket tidak secara bersemangat menginstal seluruh pohon dependensi runtime
setiap Plugin bawaan. Ketika Plugin milik OpenClaw bawaan aktif dari
konfigurasi Plugin, konfigurasi saluran lama, atau manifes yang diaktifkan secara default, startup
hanya memperbaiki dependensi runtime yang dideklarasikan Plugin tersebut sebelum mengimpornya.
Status auth saluran yang dipersisten saja tidak mengaktifkan saluran bawaan untuk
perbaikan dependensi runtime startup Gateway.
Penonaktifan eksplisit tetap menang: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, dan `channels.<id>.enabled: false`
mencegah perbaikan dependensi runtime bawaan otomatis untuk Plugin/saluran tersebut.
`plugins.allow` yang tidak kosong juga membatasi perbaikan dependensi runtime bawaan
yang diaktifkan secara default; pengaktifan saluran bawaan eksplisit (`channels.<id>.enabled: true`) tetap dapat
memperbaiki dependensi Plugin saluran tersebut.
Plugin eksternal dan jalur muat khusus tetap harus diinstal melalui
`openclaw plugins install`.
Lihat [Resolusi dependensi Plugin](/id/plugins/dependency-resolution) untuk siklus hidup
perencanaan dan staging lengkap.

## Jenis Plugin

OpenClaw mengenali dua format Plugin:

| Format     | Cara kerjanya                                                      | Contoh                                                 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dijalankan dalam proses    | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak kompatibel Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundle Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis Plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entrypoint paket

Paket npm Plugin native harus mendeklarasikan `openclaw.extensions` dalam `package.json`.
Setiap entri harus tetap berada di dalam direktori paket dan di-resolve ke file runtime
yang dapat dibaca, atau ke file sumber TypeScript dengan peer JavaScript hasil build yang
diinferensikan seperti `src/index.ts` ke `dist/index.js`.

Gunakan `openclaw.runtimeExtensions` ketika file runtime yang dipublikasikan tidak berada di
jalur yang sama dengan entri sumber. Ketika ada, `runtimeExtensions` harus berisi
tepat satu entri untuk setiap entri `extensions`. Daftar yang tidak cocok menggagalkan instalasi dan
penemuan Plugin alih-alih diam-diam fallback ke jalur sumber.

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
terpaket saat ini sudah membundel banyak Plugin resmi, sehingga Plugin tersebut tidak memerlukan
instalasi npm terpisah dalam penyiapan normal. Hingga setiap Plugin milik OpenClaw
telah bermigrasi ke ClawHub, OpenClaw masih mengirimkan beberapa paket Plugin `@openclaw/*` di
npm untuk instalasi lama/khusus dan alur kerja npm langsung.

Jika npm melaporkan paket Plugin `@openclaw/*` sebagai deprecated, versi paket tersebut
berasal dari rangkaian paket eksternal yang lebih lama. Gunakan Plugin bawaan dari
OpenClaw saat ini atau checkout lokal hingga paket npm yang lebih baru dipublikasikan.

| Plugin          | Paket                      | Dokumen                                    |
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
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — pencarian memori bawaan (default melalui `plugins.slots.memory`)
    - `memory-lancedb` — memori jangka panjang instal-saat-dibutuhkan dengan recall/capture otomatis (atur `plugins.slots.memory = "memory-lancedb"`)

    Lihat [Memory LanceDB](/id/plugins/memory-lancedb) untuk penyiapan embedding yang kompatibel
    OpenAI, contoh Ollama, batas recall, dan pemecahan masalah.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
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
| `allow`          | Allowlist Plugin (opsional)                               |
| `deny`           | Denylist Plugin (opsional; deny menang)                   |
| `load.paths`     | File/direktori Plugin tambahan                            |
| `slots`          | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>` | Toggle + konfigurasi per Plugin                           |

`plugins.allow` bersifat eksklusif. Ketika tidak kosong, hanya Plugin yang tercantum yang dapat dimuat
atau mengekspos alat, bahkan jika `tools.allow` berisi `"*"` atau nama alat milik Plugin
tertentu. Jika allowlist alat merujuk ke alat Plugin, tambahkan id Plugin pemilik
ke `plugins.allow` atau hapus `plugins.allow`; `openclaw doctor` memperingatkan tentang
bentuk ini.

Perubahan konfigurasi **memerlukan restart Gateway**. Jika Gateway berjalan dengan config
watch + restart dalam-proses diaktifkan (jalur default `openclaw gateway`), restart tersebut
biasanya dilakukan otomatis beberapa saat setelah penulisan konfigurasi masuk.
Tidak ada jalur hot-reload yang didukung untuk kode runtime Plugin native atau hook lifecycle;
restart proses Gateway yang melayani saluran live sebelum
mengharapkan kode `register(api)` yang diperbarui, hook `api.on(...)`, alat, layanan, atau
hook provider/runtime berjalan.

`openclaw plugins list` adalah snapshot registri/konfigurasi Plugin lokal. Plugin
`enabled` di sana berarti registri yang dipersisten dan konfigurasi saat ini mengizinkan
Plugin untuk berpartisipasi. Itu tidak membuktikan bahwa anak Gateway jarak jauh yang sudah berjalan
telah direstart ke kode Plugin yang sama. Pada penyiapan VPS/kontainer dengan
proses wrapper, kirim restart ke proses `openclaw gateway run` yang sebenarnya,
atau gunakan `openclaw gateway restart` terhadap Gateway yang sedang berjalan.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Dinonaktifkan**: Plugin ada tetapi aturan pengaktifan mematikannya. Konfigurasi dipertahankan.
  - **Hilang**: konfigurasi merujuk ke id Plugin yang tidak ditemukan oleh penemuan.
  - **Tidak valid**: Plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan. Startup Gateway hanya melewati Plugin tersebut; `openclaw doctor --fix` dapat mengarantina entri yang tidak valid dengan menonaktifkannya dan menghapus payload konfigurasinya.

</Accordion>

## Penemuan dan presedensi

OpenClaw memindai Plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Jalur konfigurasi">
    `plugins.load.paths` — jalur file atau direktori eksplisit. Jalur yang mengarah
    kembali ke direktori Plugin bawaan yang dipaketkan milik OpenClaw sendiri akan diabaikan;
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
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

Instalasi paket dan image Docker biasanya menyelesaikan Plugin bawaan dari pohon
`dist/extensions` yang telah dikompilasi. Jika direktori sumber Plugin bawaan
di-bind-mount di atas jalur sumber paket yang sesuai, misalnya
`/app/extensions/synology-chat`, OpenClaw memperlakukan direktori sumber yang
dipasang tersebut sebagai overlay sumber bawaan dan menemukannya sebelum bundle
paket `/app/dist/extensions/synology-chat`. Ini menjaga loop kontainer maintainer
tetap berfungsi tanpa mengalihkan setiap Plugin bawaan kembali ke sumber TypeScript.
Tetapkan `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk memaksa bundle dist paket
bahkan ketika mount overlay sumber ada.

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua Plugin dan melewati pekerjaan penemuan/pemuatan Plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan Plugin tersebut
- Plugin yang berasal dari workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set default aktif bawaan kecuali ditimpa
- Slot eksklusif dapat memaksa pengaktifan Plugin yang dipilih untuk slot tersebut
- Beberapa Plugin opt-in bawaan diaktifkan otomatis ketika konfigurasi menyebutkan
  permukaan milik Plugin, seperti referensi model penyedia, konfigurasi channel, atau runtime
  harness
- Konfigurasi Plugin usang dipertahankan saat `plugins.enabled: false` aktif;
  aktifkan kembali Plugin sebelum menjalankan pembersihan doctor jika Anda ingin id usang dihapus
- Rute Codex keluarga OpenAI mempertahankan batas Plugin terpisah:
  `openai-codex/*` milik Plugin OpenAI, sedangkan Plugin app-server Codex bawaan
  dipilih oleh `agentRuntime.id: "codex"` atau referensi model lama `codex/*`

## Memecahkan masalah hook runtime

Jika sebuah Plugin muncul di `plugins list` tetapi efek samping atau hook `register(api)`
tidak berjalan pada lalu lintas chat langsung, periksa hal-hal berikut terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan pastikan URL
  Gateway aktif, profil, jalur konfigurasi, dan proses adalah yang sedang Anda edit.
- Mulai ulang Gateway langsung setelah perubahan instalasi/konfigurasi/kode Plugin. Di kontainer
  wrapper, PID 1 mungkin hanya supervisor; mulai ulang atau kirim sinyal ke proses anak
  `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --runtime --json` untuk memastikan pendaftaran hook dan
  diagnostik. Hook percakapan non-bawaan seperti `llm_input`,
  `llm_output`, `before_agent_finalize`, dan `agent_end` memerlukan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk pengalihan model, lebih baik gunakan `before_model_resolve`. Ini berjalan sebelum resolusi model
  untuk giliran agen; `llm_output` hanya berjalan setelah percobaan model
  menghasilkan keluaran asisten.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau permukaan
  sesi/status Gateway dan, saat men-debug payload penyedia, mulai
  Gateway dengan `--raw-stream --raw-stream-path <path>`.

### Kepemilikan channel atau tool duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu Plugin aktif mencoba memiliki channel yang sama,
alur penyiapan, atau nama tool. Penyebab paling umum adalah Plugin channel eksternal
yang dipasang berdampingan dengan Plugin bawaan yang kini menyediakan id channel yang sama.

Langkah debug:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap Plugin yang aktif
  dan asalnya.
- Jalankan `openclaw plugins inspect <id> --runtime --json` untuk setiap Plugin yang dicurigai dan
  bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah memasang atau menghapus
  paket Plugin agar metadata tersimpan mencerminkan instalasi saat ini.
- Mulai ulang Gateway setelah perubahan instalasi, registry, atau konfigurasi.

Opsi perbaikan:

- Jika satu Plugin secara sengaja menggantikan yang lain untuk id channel yang sama, Plugin
  pilihan harus mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan
  id Plugin berprioritas lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikasi tidak disengaja, nonaktifkan salah satu sisi dengan
  `plugins.entries.<plugin-id>.enabled: false` atau hapus instalasi Plugin
  usang.
- Jika Anda secara eksplisit mengaktifkan kedua Plugin, OpenClaw mempertahankan permintaan itu dan
  melaporkan konflik. Pilih satu pemilik untuk channel atau ganti nama tool milik Plugin
  agar permukaan runtime tidak ambigu.

## Slot Plugin (kategori eksklusif)

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
| `contextEngine` | Mesin konteks aktif   | `legacy` (built-in) |

## Referensi CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/diagnostics
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin bawaan dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (misalnya
penyedia model bawaan, penyedia ucapan bawaan, dan Plugin browser bawaan).
Plugin bawaan lainnya tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa Plugin terpasang atau hook pack yang sudah ada di tempat. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk peningkatan rutin Plugin npm
yang dilacak. Ini tidak didukung dengan `--link`, yang menggunakan ulang jalur sumber
alih-alih menyalin ke target instalasi terkelola.

Ketika `plugins.allow` sudah ditetapkan, `openclaw plugins install` menambahkan
id Plugin yang dipasang ke allowlist tersebut sebelum mengaktifkannya. Jika id Plugin yang sama
ada di `plugins.deny`, install menghapus entri deny usang itu sehingga
instalasi eksplisit segera dapat dimuat setelah restart.

OpenClaw menyimpan registry Plugin lokal persisten sebagai model baca dingin untuk
inventaris Plugin, kepemilikan kontribusi, dan perencanaan startup. Alur install, update,
uninstall, enable, dan disable menyegarkan registry tersebut setelah mengubah status Plugin.
File `plugins/installs.json` yang sama menyimpan metadata instalasi yang tahan lama di
`installRecords` tingkat atas dan metadata manifes yang dapat dibangun ulang di `plugins`. Jika
registry hilang, usang, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifesnya dari catatan instalasi, kebijakan konfigurasi, dan
metadata manifes/paket tanpa memuat modul runtime Plugin.
`openclaw plugins update <id-or-npm-spec>` berlaku untuk instalasi yang dilacak. Memberikan
spec paket npm dengan dist-tag atau versi persis akan menyelesaikan nama paket
kembali ke catatan Plugin yang dilacak dan mencatat spec baru untuk update berikutnya.
Memberikan nama paket tanpa versi memindahkan instalasi exact pinned kembali ke
jalur rilis default registry. Jika Plugin npm yang terpasang sudah cocok dengan
versi yang diselesaikan dan identitas artefak yang tercatat, OpenClaw melewati update
tanpa mengunduh, memasang ulang, atau menulis ulang konfigurasi.

`--pin` hanya untuk npm. Ini tidak didukung dengan `--marketplace`, karena
instalasi marketplace mempertahankan metadata sumber marketplace alih-alih spec npm.

`--dangerously-force-unsafe-install` adalah override darurat untuk false positive
dari pemindai kode berbahaya bawaan. Ini memungkinkan instalasi Plugin
dan update Plugin melewati temuan `critical` bawaan, tetapi tetap
tidak melewati blok kebijakan `before_install` Plugin atau pemblokiran kegagalan pemindaian.
Pemindaian instalasi mengabaikan file dan direktori pengujian umum seperti `tests/`,
`__tests__/`, `*.test.*`, dan `*.spec.*` untuk menghindari pemblokiran mock pengujian paket;
entrypoint runtime Plugin yang dideklarasikan tetap dipindai meskipun menggunakan salah satu
nama tersebut.

Flag CLI ini hanya berlaku untuk alur install/update Plugin. Instalasi dependensi skill
berbasis Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai
sebagai gantinya, sementara `openclaw skills install` tetap menjadi alur unduh/install skill
ClawHub yang terpisah.

Jika Plugin yang Anda publikasikan di ClawHub disembunyikan atau diblokir oleh pemindaian, buka
dasbor ClawHub atau jalankan `clawhub package rescan <name>` untuk meminta ClawHub memeriksanya
lagi. `--dangerously-force-unsafe-install` hanya memengaruhi instalasi di mesin Anda sendiri;
ini tidak meminta ClawHub memindai ulang Plugin atau menjadikan rilis yang diblokir
publik.

Bundle yang kompatibel berpartisipasi dalam alur list/inspect/enable/disable Plugin yang sama.
Dukungan runtime saat ini mencakup bundle Skills, command-skills Claude,
default `settings.json` Claude, default `.lsp.json` Claude dan `lspServers`
yang dideklarasikan manifes, command-skills Cursor, dan direktori hook
Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kapabilitas bundle yang terdeteksi plus
entri server MCP dan LSP yang didukung atau tidak didukung untuk Plugin berbasis bundle.

Sumber marketplace dapat berupa nama marketplace Claude yang dikenal dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau
jalur `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo
GitHub, atau URL git. Untuk marketplace jarak jauh, entri Plugin harus tetap berada di dalam
repo marketplace yang dikloning dan hanya menggunakan sumber jalur relatif.

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
Plugin. Loader masih melakukan fallback ke `activate(api)` untuk Plugin lama,
tetapi Plugin bawaan dan Plugin eksternal baru sebaiknya memperlakukan `register` sebagai
kontrak publik.

`api.registrationMode` memberi tahu Plugin mengapa entrinya sedang dimuat:

| Mode            | Makna                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan alat, hook, layanan, perintah, rute, dan efek samping live lainnya.                                  |
| `discovery`     | Penemuan kapabilitas read-only. Daftarkan penyedia dan metadata; kode entri Plugin tepercaya dapat dimuat, tetapi lewati efek samping live. |
| `setup-only`    | Pemuatan metadata penyiapan channel melalui entri penyiapan yang ringan.                                                         |
| `setup-runtime` | Pemuatan penyiapan channel yang juga memerlukan entri runtime.                                                                   |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                         |

Entri Plugin yang membuka soket, database, background worker, atau klien berumur panjang
harus menjaga efek samping tersebut dengan `api.registrationMode === "full"`.
Pemuatan discovery di-cache secara terpisah dari pemuatan aktivasi dan tidak menggantikan
registry Gateway yang sedang berjalan. Discovery bersifat non-aktivasi, bukan bebas impor:
OpenClaw dapat mengevaluasi entri Plugin tepercaya atau modul Plugin channel untuk membangun
snapshot. Jaga tingkat atas modul tetap ringan dan bebas efek samping, dan pindahkan
klien jaringan, subprocess, listener, pembacaan kredensial, dan startup layanan
ke balik jalur full-runtime.

Metode registrasi umum:

| Metode                                  | Yang didaftarkan             |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Penyedia model (LLM)         |
| `registerChannel`                       | Channel chat                 |
| `registerTool`                          | Alat agen                    |
| `registerHook` / `on(...)`              | Hook lifecycle               |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | STT streaming                |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks       |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio        |
| `registerImageGenerationProvider`       | Generasi gambar              |
| `registerMusicGenerationProvider`       | Generasi musik               |
| `registerVideoGenerationProvider`       | Generasi video               |
| `registerWebFetchProvider`              | Penyedia fetch / scrape web  |
| `registerWebSearchProvider`             | Pencarian web                |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Perintah CLI                 |
| `registerContextEngine`                 | Mesin konteks                |
| `registerService`                       | Layanan latar belakang       |

Perilaku guard hook untuk hook lifecycle bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus block sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus block sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus cancel sebelumnya.

Native Codex app-server menjalankan bridge peristiwa alat native Codex kembali ke
permukaan hook ini. Plugin dapat memblokir alat native Codex melalui `before_tool_call`,
mengamati hasil melalui `after_tool_call`, dan berpartisipasi dalam persetujuan
`PermissionRequest` Codex. Bridge belum menulis ulang argumen alat native Codex.
Batas dukungan runtime Codex yang tepat berada dalam
[Kontrak dukungan Codex harness v1](/id/plugins/codex-harness#v1-support-contract).

Untuk perilaku hook bertipe lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — buat Plugin Anda sendiri
- [Bundle Plugin](/id/plugins/bundles) — kompatibilitas bundle Codex/Claude/Cursor
- [Manifest Plugin](/id/plugins/manifest) — skema manifest
- [Mendaftarkan alat](/id/plugins/building-plugins#registering-agent-tools) — tambahkan alat agen dalam Plugin
- [Internal Plugin](/id/plugins/architecture) — model kapabilitas dan pipeline pemuatan
- [Plugin komunitas](/id/plugins/community) — daftar pihak ketiga
