---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami penemuan Plugin dan aturan pemuatan
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-30T10:17:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: channel, penyedia model,
harness agen, tool, Skills, ucapan, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, pencarian
web, dan lainnya. Sebagian plugin bersifat **core** (dikirim bersama OpenClaw),
sementara yang lain bersifat **eksternal**. Sebagian besar plugin eksternal
dipublikasikan dan ditemukan melalui [ClawHub](/id/tools/clawhub). Npm tetap
didukung untuk instalasi langsung dan untuk sekumpulan sementara paket plugin
milik OpenClaw selama migrasi tersebut diselesaikan.

## Mulai cepat

<Steps>
  <Step title="Lihat apa yang dimuat">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instal plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Mulai ulang Gateway">
    ```bash
    openclaw gateway restart
    ```

    Lalu konfigurasi di bawah `plugins.entries.\<id\>.config` dalam file konfigurasi Anda.

  </Step>
</Steps>

Jika Anda lebih memilih kontrol bawaan chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Jalur instalasi menggunakan resolver yang sama dengan CLI: jalur/arsip lokal,
`clawhub:<pkg>` eksplisit, `npm:<pkg>` eksplisit, atau spesifikasi paket biasa
(ClawHub terlebih dahulu, lalu fallback npm).

Jika konfigurasi tidak valid, instalasi biasanya gagal tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur
reinstalasi plugin bawaan yang sempit untuk plugin yang ikut memakai
`openclaw.install.allowInvalidConfigRecovery`.
Selama startup Gateway, konfigurasi yang tidak valid untuk satu plugin diisolasi ke plugin tersebut:
startup mencatat masalah `plugins.entries.<id>.config`, melewati plugin tersebut selama
pemuatan, dan menjaga plugin serta channel lain tetap online. Jalankan `openclaw doctor --fix`
untuk mengarantina konfigurasi plugin yang buruk dengan menonaktifkan entri plugin tersebut dan menghapus
payload konfigurasi yang tidak valid; cadangan konfigurasi normal mempertahankan nilai sebelumnya.
Ketika konfigurasi channel merujuk ke plugin yang tidak lagi dapat ditemukan tetapi
id plugin basi yang sama tetap ada dalam konfigurasi plugin atau catatan instalasi, startup Gateway
mencatat peringatan dan melewati channel tersebut alih-alih memblokir setiap channel lain.
Jalankan `openclaw doctor --fix` untuk menghapus entri channel/plugin yang basi; key
channel yang tidak dikenal tanpa bukti plugin basi tetap gagal validasi sehingga salah ketik tetap
terlihat.
Jika `plugins.enabled: false` diatur, referensi plugin basi diperlakukan sebagai inert:
startup Gateway melewati pekerjaan penemuan/pemuatan plugin dan `openclaw doctor` mempertahankan
konfigurasi plugin yang dinonaktifkan alih-alih menghapusnya secara otomatis. Aktifkan kembali plugin sebelum
menjalankan pembersihan doctor jika Anda ingin id plugin basi dihapus.

Instalasi OpenClaw dalam paket tidak langsung menginstal setiap pohon dependensi
runtime plugin bawaan. Ketika plugin bawaan milik OpenClaw aktif dari
konfigurasi plugin, konfigurasi channel lama, atau manifest yang aktif secara default, startup
hanya memperbaiki dependensi runtime yang dideklarasikan plugin tersebut sebelum mengimpornya.
Status autentikasi channel yang tersimpan saja tidak mengaktifkan channel bawaan untuk
perbaikan dependensi runtime startup Gateway.
Penonaktifan eksplisit tetap menang: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, dan `channels.<id>.enabled: false`
mencegah perbaikan dependensi runtime bawaan otomatis untuk plugin/channel tersebut.
`plugins.allow` yang tidak kosong juga membatasi perbaikan dependensi runtime bawaan
yang aktif secara default; pengaktifan channel bawaan eksplisit (`channels.<id>.enabled: true`) tetap dapat
memperbaiki dependensi plugin channel tersebut.
Plugin eksternal dan jalur muat kustom tetap harus diinstal melalui
`openclaw plugins install`.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                     | Contoh                                                 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dijalankan dalam proses    | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak kompatibel Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundle Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ringkasan Plugin SDK](/id/plugins/sdk-overview).

## Entrypoint paket

Paket npm plugin native harus mendeklarasikan `openclaw.extensions` dalam `package.json`.
Setiap entri harus tetap berada di dalam direktori paket dan di-resolve ke file
runtime yang dapat dibaca, atau ke file sumber TypeScript dengan peer JavaScript
hasil build yang disimpulkan seperti `src/index.ts` ke `dist/index.js`.

Gunakan `openclaw.runtimeExtensions` ketika file runtime yang dipublikasikan tidak berada di
jalur yang sama dengan entri sumber. Jika ada, `runtimeExtensions` harus berisi
tepat satu entri untuk setiap entri `extensions`. Daftar yang tidak cocok menggagalkan instalasi dan
penemuan plugin alih-alih diam-diam fallback ke jalur sumber.

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
berpaket saat ini sudah menyertakan banyak plugin resmi, jadi plugin tersebut tidak memerlukan
instalasi npm terpisah dalam penyiapan normal. Hingga setiap plugin milik OpenClaw
telah bermigrasi ke ClawHub, OpenClaw masih mengirim beberapa paket plugin `@openclaw/*` di
npm untuk instalasi lama/kustom dan workflow npm langsung.

Jika npm melaporkan paket plugin `@openclaw/*` sebagai usang, versi paket tersebut
berasal dari rangkaian paket eksternal yang lebih lama. Gunakan plugin bawaan dari
OpenClaw saat ini atau checkout lokal hingga paket npm yang lebih baru dipublikasikan.

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
    - `memory-core` — pencarian memori bawaan (default melalui `plugins.slots.memory`)
    - `memory-lancedb` — memori jangka panjang install-on-demand dengan auto-recall/capture (atur `plugins.slots.memory = "memory-lancedb"`)

    Lihat [Memory LanceDB](/id/plugins/memory-lancedb) untuk penyiapan embedding kompatibel OpenAI,
    contoh Ollama, batas recall, dan pemecahan masalah.

  </Accordion>

  <Accordion title="Penyedia ucapan (diaktifkan secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` — plugin browser bawaan untuk tool browser, CLI `openclaw browser`, metode gateway `browser.request`, runtime browser, dan layanan kontrol browser default (diaktifkan secara default; nonaktifkan sebelum menggantinya)
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

| Bidang           | Deskripsi                                                 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Toggle utama (default: `true`)                            |
| `allow`          | Allowlist plugin (opsional)                               |
| `deny`           | Denylist plugin (opsional; deny menang)                   |
| `load.paths`     | File/direktori plugin tambahan                            |
| `slots`          | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>` | Toggle + konfigurasi per plugin                           |

Perubahan konfigurasi **memerlukan restart gateway**. Jika Gateway berjalan dengan watch konfigurasi
+ restart dalam proses yang diaktifkan (jalur default `openclaw gateway`), restart tersebut
biasanya dilakukan otomatis beberapa saat setelah penulisan konfigurasi masuk.
Tidak ada jalur hot-reload yang didukung untuk kode runtime plugin native atau hook lifecycle;
mulai ulang proses Gateway yang melayani channel live sebelum
mengharapkan kode `register(api)` yang diperbarui, hook `api.on(...)`, tool, layanan, atau
hook penyedia/runtime berjalan.

`openclaw plugins list` adalah snapshot registry/konfigurasi plugin lokal. Plugin
`enabled` di sana berarti registry tersimpan dan konfigurasi saat ini mengizinkan
plugin untuk berpartisipasi. Itu tidak membuktikan bahwa child Gateway jarak jauh yang sudah berjalan
telah dimulai ulang ke kode plugin yang sama. Pada penyiapan VPS/container dengan
proses wrapper, kirim restart ke proses `openclaw gateway run` yang sebenarnya,
atau gunakan `openclaw gateway restart` terhadap Gateway yang sedang berjalan.

<Accordion title="Status plugin: dinonaktifkan vs hilang vs tidak valid">
  - **Dinonaktifkan**: plugin ada tetapi aturan pengaktifan mematikannya. Konfigurasi dipertahankan.
  - **Hilang**: konfigurasi merujuk ke id plugin yang tidak ditemukan oleh penemuan.
  - **Tidak valid**: plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan. Startup Gateway hanya melewati plugin tersebut; `openclaw doctor --fix` dapat mengarantina entri yang tidak valid dengan menonaktifkannya dan menghapus payload konfigurasinya.

</Accordion>

## Penemuan dan presedensi

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Jalur konfigurasi">
    `plugins.load.paths` — jalur file atau direktori eksplisit. Jalur yang menunjuk
    kembali ke direktori plugin bawaan berpaket milik OpenClaw sendiri diabaikan;
    jalankan `openclaw doctor --fix` untuk menghapus alias basi tersebut.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (penyedia model, ucapan).
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

Instalasi terpaket dan image Docker biasanya menyelesaikan Plugin bawaan dari
pohon `dist/extensions` yang dikompilasi. Jika direktori sumber Plugin bawaan
di-bind-mount di atas jalur sumber terpaket yang cocok, misalnya
`/app/extensions/synology-chat`, OpenClaw memperlakukan direktori sumber yang
di-mount itu sebagai overlay sumber bawaan dan menemukannya sebelum bundle
`/app/dist/extensions/synology-chat` terpaket. Ini menjaga loop kontainer
maintainer tetap bekerja tanpa mengalihkan setiap Plugin bawaan kembali ke sumber TypeScript.
Atur `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk memaksa bundle dist terpaket
bahkan ketika mount overlay sumber ada.

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua Plugin dan melewati pekerjaan penemuan/pemuatan Plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan Plugin tersebut
- Plugin asal workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set default-aktif bawaan kecuali ditimpa
- Slot eksklusif dapat memaksa pengaktifan Plugin yang dipilih untuk slot tersebut
- Beberapa Plugin bawaan opt-in diaktifkan secara otomatis ketika konfigurasi menamai
  permukaan milik Plugin, seperti referensi model penyedia, konfigurasi channel, atau runtime
  harness
- Konfigurasi Plugin usang dipertahankan selama `plugins.enabled: false` aktif;
  aktifkan kembali Plugin sebelum menjalankan pembersihan doctor jika Anda ingin id usang dihapus
- Rute Codex keluarga OpenAI menjaga batas Plugin terpisah:
  `openai-codex/*` milik Plugin OpenAI, sedangkan Plugin app-server Codex
  bawaan dipilih oleh `agentRuntime.id: "codex"` atau referensi model
  `codex/*` lama

## Memecahkan masalah hook runtime

Jika sebuah Plugin muncul di `plugins list` tetapi efek samping atau hook
`register(api)` tidak berjalan dalam trafik chat langsung, periksa ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan pastikan URL
  Gateway aktif, profil, jalur konfigurasi, dan proses adalah yang sedang Anda edit.
- Mulai ulang Gateway langsung setelah perubahan instalasi/konfigurasi/kode Plugin. Dalam kontainer
  wrapper, PID 1 mungkin hanya supervisor; mulai ulang atau kirim sinyal ke proses anak
  `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --json` untuk memastikan pendaftaran hook dan
  diagnostik. Hook percakapan non-bawaan seperti `llm_input`,
  `llm_output`, `before_agent_finalize`, dan `agent_end` membutuhkan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk peralihan model, lebih baik gunakan `before_model_resolve`. Ini berjalan sebelum resolusi model
  untuk giliran agen; `llm_output` hanya berjalan setelah upaya model
  menghasilkan keluaran asisten.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau permukaan
  sesi/status Gateway dan, saat men-debug payload penyedia, mulai
  Gateway dengan `--raw-stream --raw-stream-path <path>`.

### Kepemilikan channel atau tool duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu Plugin yang diaktifkan mencoba memiliki channel,
alur penyiapan, atau nama tool yang sama. Penyebab paling umum adalah Plugin channel eksternal
yang diinstal berdampingan dengan Plugin bawaan yang kini menyediakan id channel yang sama.

Langkah debug:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap Plugin
  yang diaktifkan dan asalnya.
- Jalankan `openclaw plugins inspect <id> --json` untuk setiap Plugin yang dicurigai dan
  bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah menginstal atau menghapus
  paket Plugin agar metadata tersimpan mencerminkan instalasi saat ini.
- Mulai ulang Gateway setelah perubahan instalasi, registry, atau konfigurasi.

Opsi perbaikan:

- Jika satu Plugin sengaja menggantikan yang lain untuk id channel yang sama, Plugin
  yang dipilih sebaiknya mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan
  id Plugin berprioritas lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikat tidak disengaja, nonaktifkan salah satu pihak dengan
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
| `memory`        | Plugin active memory  | `memory-core`       |
| `contextEngine` | Mesin konteks aktif   | `legacy` (bawaan)   |

## Referensi CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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
Plugin bawaan lain tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa Plugin terinstal atau hook pack yang sudah ada di tempatnya. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk peningkatan rutin Plugin npm
yang dilacak. Ini tidak didukung dengan `--link`, yang menggunakan kembali jalur sumber alih-alih
menyalin ke target instalasi terkelola.

Ketika `plugins.allow` sudah diatur, `openclaw plugins install` menambahkan
id Plugin yang diinstal ke allowlist tersebut sebelum mengaktifkannya. Jika id Plugin yang sama
ada di `plugins.deny`, instalasi menghapus entri deny usang itu sehingga
instalasi eksplisit langsung dapat dimuat setelah restart.

OpenClaw menyimpan registry Plugin lokal persisten sebagai model baca dingin untuk
inventaris Plugin, kepemilikan kontribusi, dan perencanaan startup. Alur instalasi, pembaruan,
uninstal, pengaktifan, dan penonaktifan me-refresh registry tersebut setelah mengubah status Plugin.
File `plugins/installs.json` yang sama menyimpan metadata instalasi tahan lama dalam
`installRecords` tingkat atas dan metadata manifest yang dapat dibangun ulang dalam `plugins`. Jika
registry hilang, usang, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifestnya dari catatan instalasi, kebijakan konfigurasi, dan
metadata manifest/paket tanpa memuat modul runtime Plugin.
`openclaw plugins update <id-or-npm-spec>` berlaku untuk instalasi yang dilacak. Memberikan
spec paket npm dengan dist-tag atau versi persis menyelesaikan nama paket
kembali ke catatan Plugin yang dilacak dan mencatat spec baru untuk pembaruan mendatang.
Memberikan nama paket tanpa versi memindahkan instalasi yang dipin persis kembali ke
jalur rilis default registry. Jika Plugin npm yang diinstal sudah cocok dengan
versi yang diselesaikan dan identitas artefak tercatat, OpenClaw melewati pembaruan
tanpa mengunduh, menginstal ulang, atau menulis ulang konfigurasi.

`--pin` hanya untuk npm. Ini tidak didukung dengan `--marketplace`, karena
instalasi marketplace mempertahankan metadata sumber marketplace alih-alih spec npm.

`--dangerously-force-unsafe-install` adalah override darurat untuk false positive
dari pemindai kode berbahaya bawaan. Ini memungkinkan instalasi Plugin
dan pembaruan Plugin untuk melewati temuan `critical` bawaan, tetapi tetap
tidak melewati blok kebijakan `before_install` Plugin atau pemblokiran kegagalan pemindaian.
Pemindaian instalasi mengabaikan file dan direktori pengujian umum seperti `tests/`,
`__tests__/`, `*.test.*`, dan `*.spec.*` agar tidak memblokir mock pengujian terpaket;
entrypoint runtime Plugin yang dideklarasikan tetap dipindai meskipun menggunakan salah satu
nama tersebut.

Flag CLI ini hanya berlaku untuk alur instalasi/pembaruan Plugin. Instalasi dependensi skill
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang cocok
sebagai gantinya, sedangkan `openclaw skills install` tetap menjadi alur unduh/instal skill
ClawHub yang terpisah.

Jika Plugin yang Anda publikasikan di ClawHub disembunyikan atau diblokir oleh pemindaian, buka
dasbor ClawHub atau jalankan `clawhub package rescan <name>` untuk meminta ClawHub memeriksanya
lagi. `--dangerously-force-unsafe-install` hanya memengaruhi instalasi di mesin Anda sendiri;
ini tidak meminta ClawHub memindai ulang Plugin atau membuat rilis yang diblokir menjadi
publik.

Bundle kompatibel ikut serta dalam alur daftar/periksa/aktifkan/nonaktifkan Plugin yang sama.
Dukungan runtime saat ini mencakup bundle Skills, command-skills Claude,
default `settings.json` Claude, default `.lsp.json` Claude dan `lspServers`
yang dideklarasikan manifest, command-skills Cursor, dan direktori hook Codex
yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kapabilitas bundle yang terdeteksi plus
entri server MCP dan LSP yang didukung atau tidak didukung untuk Plugin yang didukung bundle.

Sumber marketplace dapat berupa nama marketplace dikenal Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau
jalur `marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo
GitHub, atau URL git. Untuk marketplace jarak jauh, entri Plugin harus tetap berada di dalam
repo marketplace yang dikloning dan hanya menggunakan sumber jalur relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ringkasan API Plugin

Plugin native mengekspor objek entri yang mengekspos `register(api)`. Plugin lama
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

OpenClaw memuat objek entri dan memanggil `register(api)` selama aktivasi
Plugin. Loader masih fallback ke `activate(api)` untuk Plugin lama,
tetapi Plugin bawaan dan Plugin eksternal baru sebaiknya memperlakukan `register` sebagai
kontrak publik.

`api.registrationMode` memberi tahu Plugin mengapa entrinya sedang dimuat:

| Mode            | Makna                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan alat, hook, layanan, perintah, rute, dan efek samping langsung lainnya.                              |
| `discovery`     | Penemuan kapabilitas baca-saja. Daftarkan penyedia dan metadata; kode entri plugin tepercaya dapat dimuat, tetapi lewati efek samping langsung. |
| `setup-only`    | Pemuatan metadata penyiapan saluran melalui entri penyiapan ringan.                                                                |
| `setup-runtime` | Pemuatan penyiapan saluran yang juga memerlukan entri runtime.                                                                         |
| `cli-metadata`  | Pengumpulan metadata perintah CLI saja.                                                                                            |

Entri Plugin yang membuka soket, basis data, worker latar belakang, atau klien
berumur panjang harus menjaga efek samping tersebut dengan `api.registrationMode === "full"`.
Pemuatan discovery di-cache secara terpisah dari pemuatan aktivasi dan tidak menggantikan
registri Gateway yang sedang berjalan. Discovery tidak mengaktifkan, bukan bebas impor:
OpenClaw dapat mengevaluasi entri plugin tepercaya atau modul plugin saluran untuk membangun
snapshot. Jaga tingkat atas modul tetap ringan dan bebas efek samping, dan pindahkan
klien jaringan, subproses, listener, pembacaan kredensial, dan startup layanan
ke balik jalur runtime penuh.

Metode pendaftaran umum:

| Metode                                  | Yang didaftarkan           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Penyedia model (LLM)        |
| `registerChannel`                       | Saluran chat                |
| `registerTool`                          | Alat agen                  |
| `registerHook` / `on(...)`              | Hook siklus hidup             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT streaming               |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks       |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio        |
| `registerImageGenerationProvider`       | Pembuatan gambar            |
| `registerMusicGenerationProvider`       | Pembuatan musik            |
| `registerVideoGenerationProvider`       | Pembuatan video            |
| `registerWebFetchProvider`              | Penyedia pengambilan / scrape web |
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

App-server Codex native menjalankan bridge event alat Codex-native kembali ke
permukaan hook ini. Plugin dapat memblokir alat Codex native melalui `before_tool_call`,
mengamati hasil melalui `after_tool_call`, dan berpartisipasi dalam persetujuan
`PermissionRequest` Codex. Bridge belum menulis ulang argumen alat Codex-native.
Batas dukungan runtime Codex yang tepat berada dalam
[kontrak dukungan harness Codex v1](/id/plugins/codex-harness#v1-support-contract).

Untuk perilaku hook bertipe lengkap, lihat [gambaran umum SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins) — buat plugin Anda sendiri
- [Bundle Plugin](/id/plugins/bundles) — kompatibilitas bundle Codex/Claude/Cursor
- [Manifes Plugin](/id/plugins/manifest) — skema manifes
- [Mendaftarkan alat](/id/plugins/building-plugins#registering-agent-tools) — tambahkan alat agen dalam plugin
- [Internal Plugin](/id/plugins/architecture) — model kapabilitas dan pipeline pemuatan
- [Plugin komunitas](/id/plugins/community) — daftar pihak ketiga
