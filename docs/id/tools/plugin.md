---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami aturan penemuan dan pemuatan Plugin
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-12T08:46:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: saluran, penyedia model,
harness agen, alat, skills, ucapan, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, pencarian web,
dan banyak lagi. Beberapa plugin bersifat **inti** (disertakan bersama OpenClaw), yang lain
bersifat **eksternal**. Sebagian besar plugin eksternal dipublikasikan dan ditemukan melalui
[ClawHub](/id/clawhub). Npm tetap didukung untuk instalasi langsung dan untuk
sekumpulan sementara paket plugin milik OpenClaw selama migrasi tersebut selesai.

## Mulai cepat

Untuk contoh instalasi, daftar, hapus instalasi, pembaruan, dan publikasi yang dapat disalin-tempel, lihat
[Kelola plugin](/id/plugins/manage-plugins).

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

  <Step title="Manajemen native-chat">
    Dalam Gateway yang sedang berjalan, `/plugins enable` dan `/plugins disable` khusus pemilik
    memicu pemuat ulang konfigurasi Gateway. Gateway memuat ulang permukaan runtime plugin
    dalam proses, dan giliran agen baru membangun ulang daftar alatnya dari
    registry yang disegarkan. `/plugins install` mengubah kode sumber plugin, jadi
    Gateway meminta mulai ulang alih-alih berpura-pura bahwa proses saat ini dapat
    memuat ulang modul yang sudah diimpor dengan aman.

  </Step>

  <Step title="Verifikasi plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gunakan `--runtime` saat Anda perlu membuktikan alat terdaftar, layanan, metode gateway,
    hook, atau perintah CLI milik plugin. `inspect` biasa adalah pemeriksaan dingin
    manifest/registry dan sengaja menghindari impor runtime plugin.

  </Step>
</Steps>

Jika Anda lebih suka kontrol native-chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Jalur instalasi menggunakan resolver yang sama seperti CLI: path/arsip lokal, eksplisit
`clawhub:<pkg>`, eksplisit `npm:<pkg>`, eksplisit `npm-pack:<path.tgz>`,
eksplisit `git:<repo>`, atau spesifikasi paket polos melalui npm.

Jika konfigurasi tidak valid, instalasi biasanya gagal tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur instal ulang
plugin bawaan yang sempit untuk plugin yang ikut serta dalam
`openclaw.install.allowInvalidConfigRecovery`.
Saat startup Gateway, konfigurasi plugin yang tidak valid gagal tertutup seperti konfigurasi
tidak valid lainnya. Jalankan `openclaw doctor --fix` untuk mengarantina konfigurasi plugin
yang buruk dengan menonaktifkan entri plugin tersebut dan menghapus payload konfigurasi
yang tidak valid; cadangan konfigurasi normal mempertahankan nilai sebelumnya.
Saat konfigurasi saluran mereferensikan plugin yang tidak lagi dapat ditemukan tetapi
id plugin usang yang sama tetap ada dalam konfigurasi plugin atau catatan instalasi, startup
Gateway mencatat peringatan dan melewati saluran tersebut alih-alih memblokir setiap saluran lain.
Jalankan `openclaw doctor --fix` untuk menghapus entri saluran/plugin usang; kunci saluran
tidak dikenal tanpa bukti plugin usang tetap gagal validasi sehingga salah ketik tetap
terlihat.
Jika `plugins.enabled: false` diatur, referensi plugin usang diperlakukan sebagai inert:
startup Gateway melewati pekerjaan penemuan/pemuatan plugin dan `openclaw doctor` mempertahankan
konfigurasi plugin yang dinonaktifkan alih-alih menghapusnya otomatis. Aktifkan kembali plugin sebelum
menjalankan pembersihan doctor jika Anda ingin id plugin usang dihapus.

Instalasi dependensi plugin hanya terjadi selama alur instalasi/pembaruan eksplisit atau
perbaikan doctor. Startup Gateway, pemuatan ulang konfigurasi, dan inspeksi runtime tidak
menjalankan manajer paket atau memperbaiki pohon dependensi. Plugin lokal harus sudah
memiliki dependensinya terinstal, sementara plugin npm, git, dan ClawHub diinstal
di bawah root plugin terkelola OpenClaw. Dependensi npm dapat di-hoist
dalam root npm terkelola OpenClaw; instalasi/pembaruan memindai root terkelola tersebut sebelum
kepercayaan dan hapus instalasi menghapus paket terkelola npm melalui npm. Plugin eksternal
dan path pemuatan khusus tetap harus diinstal melalui `openclaw plugins install`.
Gunakan `openclaw plugins list --json` untuk melihat `dependencyStatus` statis untuk setiap
plugin yang terlihat tanpa mengimpor kode runtime atau memperbaiki dependensi.
Lihat [Resolusi dependensi plugin](/id/plugins/dependency-resolution) untuk
siklus hidup waktu instalasi.

### Kepemilikan path plugin yang diblokir

Jika diagnostik plugin mengatakan
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
dan validasi konfigurasi diikuti dengan `plugin present but blocked`, OpenClaw menemukan
file plugin yang dimiliki oleh pengguna Unix berbeda dari proses yang memuatnya.
Pertahankan konfigurasi plugin; perbaiki kepemilikan sistem file atau jalankan
OpenClaw sebagai pengguna yang sama yang memiliki direktori state.

Untuk instalasi Docker, image resmi berjalan sebagai `node` (uid `1000`), jadi direktori
konfigurasi OpenClaw dan workspace yang di-bind-mount dari host biasanya harus
dimiliki oleh uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jika Anda sengaja menjalankan OpenClaw sebagai root, perbaiki root plugin terkelola agar
dimiliki root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Setelah memperbaiki kepemilikan, jalankan ulang `openclaw doctor --fix` atau
`openclaw plugins registry --refresh` agar registry plugin yang dipersistenkan cocok
dengan file yang diperbaiki.

Untuk instalasi npm, selector yang dapat berubah seperti `latest` atau dist-tag diselesaikan
sebelum instalasi lalu dipin ke versi terverifikasi yang tepat dalam root npm
terkelola OpenClaw. Setelah npm selesai, OpenClaw memverifikasi bahwa entri
`package-lock.json` yang terinstal masih cocok dengan versi dan integritas yang diselesaikan. Jika
npm menulis metadata paket yang berbeda, instalasi gagal dan paket terkelola
di-rollback alih-alih menerima artefak plugin yang berbeda.
Root npm terkelola juga mewarisi `overrides` npm tingkat paket OpenClaw, jadi
pin keamanan yang melindungi host terpaket juga berlaku untuk dependensi plugin eksternal
yang di-hoist.

Checkout sumber adalah workspace pnpm. Jika Anda meng-clone OpenClaw untuk mengerjakan plugin
bawaan, jalankan `pnpm install`; OpenClaw kemudian memuat plugin bawaan dari
`extensions/<id>` sehingga edit dan dependensi lokal paket digunakan langsung.
Instalasi root npm biasa ditujukan untuk OpenClaw terpaket, bukan pengembangan
checkout sumber.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                       | Contoh                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi dalam proses       | Plugin resmi, paket npm komunitas               |
| **Bundle** | Layout kompatibel Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundle Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entrypoint paket

Paket npm plugin native harus mendeklarasikan `openclaw.extensions` dalam `package.json`.
Setiap entri harus tetap berada di dalam direktori paket dan di-resolve ke file runtime
yang dapat dibaca, atau ke file sumber TypeScript dengan pasangan JavaScript terbangun yang diinferensikan
seperti `src/index.ts` ke `dist/index.js`.
Instalasi terpaket harus menyertakan output runtime JavaScript tersebut. Fallback sumber
TypeScript ditujukan untuk checkout sumber dan path pengembangan lokal, bukan untuk
paket npm yang diinstal ke root plugin terkelola OpenClaw.

Direktori tak terlacak yang diletakkan ke root ekstensi global diperlakukan sebagai
checkout sumber lokal dan dapat memuat entri TypeScript secara langsung. Direktori
yang masih dinamai oleh catatan instalasi, termasuk `installPath` atau `sourcePath`, tetap
terkelola dan mempertahankan persyaratan output terkompilasi bahkan saat pemindaian global melihatnya.
Jika Anda sengaja mengonversi instalasi terkelola menjadi checkout lokal tak terlacak,
hapus catatan instalasi usang terlebih dahulu dengan uninstall atau pembersihan doctor.

Jika peringatan paket terkelola mengatakan bahwa paket tersebut `requires compiled runtime output for
TypeScript entry ...`, paket diterbitkan tanpa file JavaScript yang
dibutuhkan OpenClaw pada runtime. Itu adalah masalah pengemasan plugin, bukan masalah konfigurasi
lokal. Perbarui atau instal ulang plugin setelah penerbit menerbitkan ulang JavaScript
terkompilasi, atau nonaktifkan/hapus instalasi plugin tersebut hingga paket yang diperbaiki tersedia.

Gunakan `openclaw.runtimeExtensions` saat file runtime yang diterbitkan tidak berada di
path yang sama dengan entri sumber. Jika ada, `runtimeExtensions` harus berisi
tepat satu entri untuk setiap entri `extensions`. Daftar yang tidak cocok menggagalkan instalasi dan
penemuan plugin alih-alih diam-diam fallback ke path sumber. Jika Anda juga
menerbitkan `openclaw.setupEntry`, gunakan `openclaw.runtimeSetupEntry` untuk pasangan
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

ClawHub adalah jalur distribusi utama untuk sebagian besar plugin. Rilis OpenClaw
terpaket saat ini sudah membundel banyak plugin resmi, sehingga plugin tersebut tidak memerlukan
instalasi npm terpisah dalam setup normal. Sampai setiap plugin milik OpenClaw
bermigrasi ke ClawHub, OpenClaw masih mengirimkan beberapa paket plugin `@openclaw/*`
di npm untuk instalasi lama/kustom dan alur kerja npm langsung.

Jika npm melaporkan paket plugin `@openclaw/*` sebagai deprecated, versi paket tersebut
berasal dari rangkaian paket eksternal yang lebih lama. Gunakan plugin bawaan dari
OpenClaw saat ini atau checkout lokal sampai paket npm yang lebih baru diterbitkan.

| Plugin          | Paket                    | Dokumen                                       |
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

### Inti (disertakan bersama OpenClaw)

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
| `enabled`          | Toggle utama (default: `true`)                            |
| `allow`            | Allowlist plugin (opsional)                               |
| `bundledDiscovery` | Mode penemuan plugin bawaan (`allowlist` secara default)  |
| `deny`             | Denylist plugin (opsional; deny menang)                   |
| `load.paths`       | File/direktori plugin tambahan                            |
| `slots`            | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>`   | Toggle + konfigurasi per plugin                           |

`plugins.allow` bersifat eksklusif. Saat tidak kosong, hanya plugin yang
terdaftar yang dapat dimuat atau mengekspos alat, meskipun `tools.allow`
berisi `"*"` atau nama alat tertentu yang dimiliki plugin. Jika allowlist alat
merujuk ke alat plugin, tambahkan id plugin pemiliknya ke `plugins.allow` atau
hapus `plugins.allow`; `openclaw doctor` memperingatkan bentuk ini.

`plugins.bundledDiscovery` default ke `"allowlist"` untuk konfigurasi baru,
sehingga inventaris `plugins.allow` yang restriktif juga memblokir plugin
penyedia bawaan yang dihilangkan, termasuk penemuan penyedia web-search runtime.
Doctor menandai konfigurasi allowlist restriktif lama dengan `"compat"` selama
migrasi sehingga peningkatan tetap mempertahankan perilaku penyedia bawaan lama
hingga operator memilih mode yang lebih ketat. `plugins.allow` kosong tetap
diperlakukan sebagai tidak diatur/terbuka.

Perubahan konfigurasi yang dibuat melalui `/plugins enable` atau `/plugins disable`
memicu pemuatan ulang plugin Gateway dalam proses. Giliran agen baru membangun
ulang daftar alatnya dari registri plugin yang telah disegarkan. Operasi yang
mengubah sumber seperti install, update, dan uninstall tetap memulai ulang
proses Gateway karena modul plugin yang sudah diimpor tidak dapat diganti di
tempat dengan aman.

`openclaw plugins list` adalah snapshot registri/konfigurasi plugin lokal.
Plugin yang `enabled` di sana berarti registri tersimpan dan konfigurasi saat ini
mengizinkan plugin untuk berpartisipasi. Itu tidak membuktikan bahwa Gateway
jarak jauh yang sudah berjalan telah memuat ulang atau memulai ulang ke kode
plugin yang sama. Pada penyiapan VPS/container dengan proses wrapper, kirim
restart atau penulisan pemicu reload ke proses `openclaw gateway run` yang
sebenarnya, atau gunakan `openclaw gateway restart` terhadap Gateway yang
berjalan saat reload melaporkan kegagalan.

<Accordion title="Status plugin: dinonaktifkan vs hilang vs tidak valid">
  - **Dinonaktifkan**: plugin ada tetapi aturan enablement mematikannya. Konfigurasi dipertahankan.
  - **Hilang**: konfigurasi merujuk ke id plugin yang tidak ditemukan oleh penemuan.
  - **Tidak valid**: plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan. Startup Gateway hanya melewati plugin itu; `openclaw doctor --fix` dapat mengarantina entri tidak valid dengan menonaktifkannya dan menghapus payload konfigurasinya.

</Accordion>

## Penemuan dan presedensi

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Path konfigurasi">
    `plugins.load.paths` - path file atau direktori eksplisit. Path yang menunjuk
    kembali ke direktori plugin bawaan paket OpenClaw sendiri akan diabaikan;
    jalankan `openclaw doctor --fix` untuk menghapus alias lama tersebut.
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

Instalasi paket dan image Docker biasanya menyelesaikan plugin bawaan dari
pohon `dist/extensions` yang dikompilasi. Jika direktori sumber plugin bawaan
di-bind-mount di atas path sumber paket yang cocok, misalnya
`/app/extensions/synology-chat`, OpenClaw memperlakukan direktori sumber yang
di-mount tersebut sebagai overlay sumber bawaan dan menemukannya sebelum bundle
`/app/dist/extensions/synology-chat` yang dipaketkan. Ini membuat loop container
maintainer tetap berjalan tanpa mengalihkan setiap plugin bawaan kembali ke
sumber TypeScript. Atur `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk
memaksa bundle dist paket bahkan saat mount overlay sumber ada.

### Aturan enablement

- `plugins.enabled: false` menonaktifkan semua plugin dan melewati pekerjaan penemuan/pemuatan plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin itu
- Plugin asal workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti kumpulan default-on bawaan kecuali ditimpa
- Slot eksklusif dapat memaksa pengaktifan plugin yang dipilih untuk slot tersebut
- Sebagian plugin bawaan opt-in diaktifkan otomatis saat konfigurasi menamai
  surface milik plugin, seperti ref model penyedia, konfigurasi channel, atau
  runtime harness
- Konfigurasi plugin lama dipertahankan saat `plugins.enabled: false` aktif;
  aktifkan kembali plugin sebelum menjalankan pembersihan doctor jika Anda ingin id lama dihapus
- Rute Codex keluarga OpenAI mempertahankan batas plugin terpisah:
  `openai-codex/*` milik plugin OpenAI, sedangkan plugin app-server Codex
  bawaan dipilih oleh ref agen kanonis `openai/*`, provider/model eksplisit
  `agentRuntime.id: "codex"`, atau ref model legacy `codex/*`

## Memecahkan masalah hook runtime

Jika plugin muncul di `plugins list` tetapi efek samping atau hook
`register(api)` tidak berjalan di lalu lintas chat live, periksa ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan konfirmasi bahwa URL
  Gateway aktif, profil, path konfigurasi, dan proses adalah yang sedang Anda edit.
- Mulai ulang Gateway live setelah perubahan install/config/kode plugin. Dalam
  container wrapper, PID 1 mungkin hanya supervisor; mulai ulang atau kirim sinyal
  ke proses anak `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --runtime --json` untuk mengonfirmasi pendaftaran hook dan
  diagnostik. Hook percakapan non-bawaan seperti `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize`, dan `agent_end` memerlukan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk pergantian model, pilih `before_model_resolve`. Ini berjalan sebelum
  resolusi model untuk giliran agen; `llm_output` hanya berjalan setelah upaya
  model menghasilkan output asisten.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau surface
  sesi/status Gateway dan, saat men-debug payload penyedia, mulai Gateway dengan
  `--raw-stream --raw-stream-path <path>`.

### Penyiapan alat plugin lambat

Jika giliran agen tampak berhenti saat menyiapkan alat, aktifkan logging trace dan
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
bersifat opsional. Baris lambat dinaikkan menjadi peringatan saat satu factory
memakan setidaknya 1 dtk atau total persiapan factory alat plugin memakan
setidaknya 5 dtk.

OpenClaw menyimpan cache hasil factory alat plugin yang berhasil untuk resolusi
berulang dengan konteks permintaan efektif yang sama. Kunci cache mencakup
konfigurasi runtime efektif, workspace, id agen/sesi, kebijakan sandbox,
pengaturan browser, konteks pengiriman, identitas peminta, dan status
kepemilikan, sehingga factory yang bergantung pada bidang tepercaya tersebut
dijalankan ulang saat konteks berubah.

Jika satu plugin mendominasi timing, periksa pendaftaran runtime-nya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Kemudian perbarui, pasang ulang, atau nonaktifkan plugin itu. Penulis plugin
sebaiknya memindahkan pemuatan dependensi yang mahal ke balik path eksekusi alat,
bukan melakukannya di dalam factory alat.

### Kepemilikan channel atau alat duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu plugin yang diaktifkan mencoba memiliki channel,
alur penyiapan, atau nama alat yang sama. Penyebab paling umum adalah plugin
channel eksternal yang dipasang berdampingan dengan plugin bawaan yang sekarang
menyediakan id channel yang sama.

Langkah debug:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap plugin
  yang diaktifkan dan asalnya.
- Jalankan `openclaw plugins inspect <id> --runtime --json` untuk setiap plugin yang dicurigai dan
  bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah memasang atau menghapus
  paket plugin agar metadata tersimpan mencerminkan instalasi saat ini.
- Mulai ulang Gateway setelah perubahan install, registry, atau konfigurasi.

Opsi perbaikan:

- Jika satu plugin sengaja menggantikan yang lain untuk id channel yang sama,
  plugin yang dipilih sebaiknya mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan
  id plugin prioritas lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikat tidak disengaja, nonaktifkan satu sisi dengan
  `plugins.entries.<plugin-id>.enabled: false` atau hapus instalasi plugin lama.
- Jika Anda mengaktifkan kedua plugin secara eksplisit, OpenClaw mempertahankan permintaan itu dan
  melaporkan konflik. Pilih satu pemilik untuk channel atau ganti nama alat milik plugin
  sehingga surface runtime tidak ambigu.

## Slot plugin (kategori eksklusif)

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
penyedia model bawaan, penyedia ucapan bawaan, dan plugin browser
bawaan). Plugin bawaan lainnya masih memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin terpasang atau paket hook yang sudah ada di tempat. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk peningkatan rutin plugin npm
yang dilacak. Ini tidak didukung dengan `--link`, yang menggunakan ulang jalur sumber alih-alih
menyalin ke target pemasangan terkelola.

Ketika `plugins.allow` sudah disetel, `openclaw plugins install` menambahkan id
plugin yang dipasang ke allowlist tersebut sebelum mengaktifkannya. Jika id plugin yang sama
ada di `plugins.deny`, pemasangan menghapus entri deny lama tersebut agar
pemasangan eksplisit dapat langsung dimuat setelah mulai ulang.

OpenClaw menyimpan registry plugin lokal persisten sebagai model baca dingin untuk
inventaris plugin, kepemilikan kontribusi, dan perencanaan startup. Alur pemasangan, pembaruan,
penghapusan pemasangan, pengaktifan, dan penonaktifan menyegarkan registry tersebut setelah mengubah status
plugin. File `plugins/installs.json` yang sama menyimpan metadata pemasangan tahan lama dalam
`installRecords` tingkat atas dan metadata manifes yang dapat dibangun ulang dalam `plugins`. Jika
registry hilang, usang, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifesnya dari catatan pemasangan, kebijakan konfigurasi, dan
metadata manifes/paket tanpa memuat modul runtime plugin.

Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), mutator siklus hidup plugin dinonaktifkan.
Kelola pemilihan paket plugin dan konfigurasi melalui sumber Nix untuk
pemasangan; untuk nix-openclaw, mulai dengan
[Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agent.
`openclaw plugins update <id-or-npm-spec>` berlaku untuk pemasangan yang dilacak. Memberikan
spec paket npm dengan dist-tag atau versi persis menyelesaikan nama paket
kembali ke catatan plugin yang dilacak dan mencatat spec baru untuk pembaruan mendatang.
Memberikan nama paket tanpa versi memindahkan pemasangan yang dipin persis kembali ke
lini rilis default registry. Jika plugin npm yang terpasang sudah cocok dengan
versi yang diselesaikan dan identitas artefak yang dicatat, OpenClaw melewati pembaruan
tanpa mengunduh, memasang ulang, atau menulis ulang konfigurasi.
Ketika `openclaw update` berjalan di channel beta, catatan plugin npm dan ClawHub
lini default mencoba `@beta` terlebih dahulu dan kembali ke default/latest ketika tidak ada rilis
beta plugin. Versi persis dan tag eksplisit tetap dipin.

`--pin` hanya untuk npm. Ini tidak didukung dengan `--marketplace`, karena
pemasangan marketplace mempertahankan metadata sumber marketplace alih-alih spec npm.

`--dangerously-force-unsafe-install` adalah override darurat untuk false positive
dari pemindai kode berbahaya bawaan. Ini memungkinkan pemasangan plugin
dan pembaruan plugin melanjutkan melewati temuan `critical` bawaan, tetapi tetap
tidak melewati blok kebijakan `before_install` plugin atau pemblokiran kegagalan pemindaian.
Pemindaian pemasangan mengabaikan file dan direktori pengujian umum seperti `tests/`,
`__tests__/`, `*.test.*`, dan `*.spec.*` untuk menghindari pemblokiran mock pengujian yang dikemas;
entrypoint runtime plugin yang dideklarasikan tetap dipindai meskipun menggunakan salah satu
nama tersebut.

Flag CLI ini hanya berlaku untuk alur pemasangan/pembaruan plugin. Pemasangan dependensi Skills
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall`
yang sesuai, sementara `openclaw skills install` tetap menjadi alur pengunduhan/pemasangan Skills
ClawHub yang terpisah.

Jika plugin yang Anda publikasikan di ClawHub disembunyikan atau diblokir oleh pemindaian, buka
dasbor ClawHub atau jalankan `clawhub package rescan <name>` untuk meminta ClawHub memeriksanya
lagi. `--dangerously-force-unsafe-install` hanya memengaruhi pemasangan di mesin Anda sendiri;
ini tidak meminta ClawHub memindai ulang plugin atau membuat rilis yang diblokir
menjadi publik.

Bundel yang kompatibel berpartisipasi dalam alur daftar/inspeksi/pengaktifan/penonaktifan plugin
yang sama. Dukungan runtime saat ini mencakup Skills bundel, command-skills Claude,
default `settings.json` Claude, default Claude `.lsp.json` dan
`lspServers` yang dideklarasikan manifes, command-skills Cursor, dan direktori hook
Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kapabilitas bundel yang terdeteksi serta
entri server MCP dan LSP yang didukung atau tidak didukung untuk plugin yang didukung bundel.

Sumber marketplace dapat berupa nama marketplace yang dikenal Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau jalur
`marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub,
atau URL git. Untuk marketplace jarak jauh, entri plugin harus tetap berada di dalam
repo marketplace yang dikloning dan hanya menggunakan sumber jalur relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ikhtisar API Plugin

Plugin native mengekspor objek entry yang mengekspos `register(api)`. Plugin
lama mungkin masih menggunakan `activate(api)` sebagai alias legacy, tetapi plugin baru sebaiknya
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

OpenClaw memuat objek entry dan memanggil `register(api)` selama aktivasi
plugin. Loader masih kembali ke `activate(api)` untuk plugin lama,
tetapi plugin bawaan dan plugin eksternal baru sebaiknya memperlakukan `register` sebagai
kontrak publik.

`api.registrationMode` memberi tahu plugin mengapa entry-nya sedang dimuat:

| Mode            | Arti                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan tool, hook, layanan, perintah, route, dan efek samping live lainnya.                                   |
| `discovery`     | Penemuan kapabilitas baca-saja. Daftarkan penyedia dan metadata; kode entry plugin tepercaya dapat dimuat, tetapi lewati efek samping live. |
| `setup-only`    | Pemuatan metadata penyiapan channel melalui entry penyiapan ringan.                                                                |
| `setup-runtime` | Pemuatan penyiapan channel yang juga memerlukan entry runtime.                                                                     |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                           |

Entry plugin yang membuka socket, database, worker latar belakang, atau client berumur panjang
sebaiknya melindungi efek samping tersebut dengan `api.registrationMode === "full"`.
Pemuatan penemuan di-cache secara terpisah dari pemuatan aktivasi dan tidak menggantikan
registry Gateway yang sedang berjalan. Penemuan bersifat tidak mengaktifkan, bukan bebas impor:
OpenClaw dapat mengevaluasi entry plugin tepercaya atau modul plugin channel untuk membangun
snapshot. Jaga top level modul tetap ringan dan bebas efek samping, serta pindahkan
client jaringan, subprocess, listener, pembacaan kredensial, dan startup layanan
ke balik jalur runtime penuh.

Metode registrasi umum:

| Metode                                  | Yang didaftarkan              |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Penyedia model (LLM)          |
| `registerChannel`                       | Channel chat                  |
| `registerTool`                          | Tool agent                    |
| `registerHook` / `on(...)`              | Hook siklus hidup             |
| `registerSpeechProvider`                | Text-to-speech / STT          |
| `registerRealtimeTranscriptionProvider` | Streaming STT                 |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks        |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio         |
| `registerImageGenerationProvider`       | Pembuatan gambar              |
| `registerMusicGenerationProvider`       | Pembuatan musik               |
| `registerVideoGenerationProvider`       | Pembuatan video               |
| `registerWebFetchProvider`              | Penyedia fetch / scrape web   |
| `registerWebSearchProvider`             | Pencarian web                 |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Perintah CLI                  |
| `registerContextEngine`                 | Mesin konteks                 |
| `registerService`                       | Layanan latar belakang        |

Perilaku guard hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

app-server Codex native menjalankan bridge untuk mengembalikan event tool Codex-native ke permukaan hook ini. Plugin dapat memblokir tool Codex native melalui `before_tool_call`, mengamati hasil melalui `after_tool_call`, dan berpartisipasi dalam persetujuan `PermissionRequest` Codex. Bridge belum menulis ulang argumen tool Codex-native. Batas dukungan runtime Codex yang tepat berada di [kontrak dukungan Codex harness v1](/id/plugins/codex-harness-runtime#v1-support-contract).

Untuk perilaku hook bertipe lengkap, lihat [ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) - buat Plugin Anda sendiri
- [Bundle Plugin](/id/plugins/bundles) - kompatibilitas bundle Codex/Claude/Cursor
- [Manifest Plugin](/id/plugins/manifest) - skema manifest
- [Mendaftarkan tool](/id/plugins/building-plugins#registering-agent-tools) - tambahkan tool agen dalam Plugin
- [Internal Plugin](/id/plugins/architecture) - model kapabilitas dan pipeline pemuatan
- [ClawHub](/id/clawhub) - penemuan Plugin pihak ketiga
