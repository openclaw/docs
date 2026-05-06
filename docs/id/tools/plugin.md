---
read_when:
    - Menginstal atau mengonfigurasi plugin
    - Memahami aturan penemuan dan pemuatan Plugin
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-06T09:32:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: kanal, penyedia model,
harness agen, alat, Skills, ucapan, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, pencarian
web, dan lainnya. Sebagian plugin adalah **inti** (dikirim bersama OpenClaw),
sedangkan yang lain **eksternal**. Sebagian besar plugin eksternal diterbitkan
dan ditemukan melalui [ClawHub](/id/tools/clawhub). Npm tetap didukung untuk
instalasi langsung dan untuk sekumpulan sementara paket plugin milik OpenClaw
selama migrasi tersebut diselesaikan.

## Mulai cepat

Untuk contoh instalasi, daftar, penghapusan instalasi, pembaruan, dan penerbitan
yang dapat disalin-tempel, lihat [Kelola plugin](/id/plugins/manage-plugins).

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

  <Step title="Manajemen bawaan chat">
    Dalam Gateway yang sedang berjalan, `/plugins enable` dan `/plugins disable`
    khusus pemilik memicu pemuat ulang konfigurasi Gateway. Gateway memuat
    ulang permukaan runtime plugin di dalam proses, dan giliran agen baru
    membangun ulang daftar alatnya dari registri yang sudah diperbarui. `/plugins install`
    mengubah kode sumber plugin, sehingga Gateway meminta mulai ulang alih-alih
    berpura-pura bahwa proses saat ini dapat memuat ulang modul yang sudah
    diimpor dengan aman.

  </Step>

  <Step title="Verifikasi plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gunakan `--runtime` saat Anda perlu membuktikan alat, layanan, metode gateway,
    hook, atau perintah CLI milik plugin yang terdaftar. `inspect` biasa adalah
    pemeriksaan manifest/registri dingin dan dengan sengaja menghindari impor
    runtime plugin.

  </Step>
</Steps>

Jika Anda lebih suka kontrol bawaan chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Jalur instalasi menggunakan resolver yang sama seperti CLI: jalur/arsip lokal,
`clawhub:<pkg>` eksplisit, `npm:<pkg>` eksplisit, `npm-pack:<path.tgz>` eksplisit,
`git:<repo>` eksplisit, atau spesifikasi paket polos melalui npm.

Jika konfigurasi tidak valid, instalasi biasanya gagal tertutup dan mengarahkan
Anda ke `openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur
instal ulang plugin bundel yang sempit untuk plugin yang memilih ikut
`openclaw.install.allowInvalidConfigRecovery`.
Selama startup Gateway, konfigurasi plugin yang tidak valid gagal tertutup seperti
konfigurasi tidak valid lainnya. Jalankan `openclaw doctor --fix` untuk
mengarantina konfigurasi plugin yang buruk dengan menonaktifkan entri plugin
tersebut dan menghapus payload konfigurasinya yang tidak valid; cadangan
konfigurasi normal mempertahankan nilai sebelumnya.
Saat konfigurasi kanal merujuk ke plugin yang tidak lagi dapat ditemukan tetapi
id plugin usang yang sama tetap ada dalam konfigurasi plugin atau catatan
instalasi, startup Gateway mencatat peringatan dan melewati kanal tersebut
alih-alih memblokir semua kanal lain.
Jalankan `openclaw doctor --fix` untuk menghapus entri kanal/plugin usang; kunci
kanal yang tidak dikenal tanpa bukti plugin usang tetap gagal validasi agar salah
ketik tetap terlihat.
Jika `plugins.enabled: false` ditetapkan, referensi plugin usang diperlakukan
sebagai inert: startup Gateway melewati pekerjaan penemuan/pemuatan plugin dan
`openclaw doctor` mempertahankan konfigurasi plugin yang dinonaktifkan alih-alih
menghapusnya otomatis. Aktifkan kembali plugin sebelum menjalankan pembersihan
doctor jika Anda ingin id plugin usang dihapus.

Instalasi dependensi plugin hanya terjadi selama alur instalasi/pembaruan
eksplisit atau perbaikan doctor. Startup Gateway, pemuatan ulang konfigurasi, dan
inspeksi runtime tidak menjalankan manajer paket atau memperbaiki pohon
dependensi. Plugin lokal harus sudah memiliki dependensinya terinstal, sedangkan
plugin npm, git, dan ClawHub diinstal di bawah root plugin terkelola OpenClaw.
Dependensi npm dapat di-hoist dalam root npm terkelola OpenClaw; instalasi/pembaruan
memindai root terkelola tersebut sebelum dipercaya dan penghapusan instalasi
menghapus paket yang dikelola npm melalui npm. Plugin eksternal dan jalur muat
khusus tetap harus diinstal melalui `openclaw plugins install`.
Gunakan `openclaw plugins list --json` untuk melihat `dependencyStatus` statis
untuk setiap plugin yang terlihat tanpa mengimpor kode runtime atau memperbaiki
dependensi.
Lihat [Resolusi dependensi Plugin](/id/plugins/dependency-resolution) untuk siklus
hidup saat instalasi.

### Kepemilikan jalur plugin yang diblokir

Jika diagnostik plugin mengatakan
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
dan validasi konfigurasi diikuti dengan `plugin present but blocked`, OpenClaw
menemukan file plugin yang dimiliki oleh pengguna Unix berbeda dari proses yang
memuatnya. Pertahankan konfigurasi plugin; perbaiki kepemilikan sistem file atau
jalankan OpenClaw sebagai pengguna yang sama dengan pemilik direktori state.

Untuk instalasi Docker, image resmi berjalan sebagai `node` (uid `1000`), jadi
direktori konfigurasi dan workspace OpenClaw yang di-bind-mount dari host
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
`openclaw plugins registry --refresh` agar registri plugin yang dipersistenkan
sesuai dengan file yang sudah diperbaiki.

Untuk instalasi npm, selector yang dapat berubah seperti `latest` atau dist-tag
di-resolve sebelum instalasi lalu dipasangkan ke versi terverifikasi yang tepat
di root npm terkelola OpenClaw. Setelah npm selesai, OpenClaw memverifikasi bahwa
entri `package-lock.json` yang terinstal masih cocok dengan versi dan integrity
yang di-resolve. Jika npm menulis metadata paket yang berbeda, instalasi gagal
dan paket terkelola di-rollback alih-alih menerima artefak plugin yang berbeda.

Checkout sumber adalah workspace pnpm. Jika Anda mengkloning OpenClaw untuk
mengutak-atik plugin bundel, jalankan `pnpm install`; OpenClaw kemudian memuat
plugin bundel dari `extensions/<id>` sehingga edit dan dependensi lokal paket
digunakan langsung. Instalasi root npm biasa ditujukan untuk OpenClaw terpaket,
bukan pengembangan checkout sumber.

## Jenis Plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                     | Contoh                                                 |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dijalankan dalam proses   | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak kompatibel Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundle Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entrypoint paket

Paket npm plugin native harus mendeklarasikan `openclaw.extensions` dalam `package.json`.
Setiap entri harus tetap berada di dalam direktori paket dan me-resolve ke file
runtime yang dapat dibaca, atau ke file sumber TypeScript dengan peer JavaScript
bawaan yang disimpulkan seperti `src/index.ts` ke `dist/index.js`.
Instalasi terpaket harus mengirimkan output runtime JavaScript tersebut. Fallback
sumber TypeScript ditujukan untuk checkout sumber dan jalur pengembangan lokal,
bukan untuk paket npm yang diinstal ke root plugin terkelola OpenClaw.

Jika peringatan paket terkelola mengatakan paket tersebut `requires compiled runtime output for
TypeScript entry ...`, paket diterbitkan tanpa file JavaScript yang dibutuhkan
OpenClaw saat runtime. Itu adalah masalah pengemasan plugin, bukan masalah
konfigurasi lokal. Perbarui atau instal ulang plugin setelah penerbit menerbitkan
ulang JavaScript terkompilasi, atau nonaktifkan/hapus instalasi plugin tersebut
sampai paket yang diperbaiki tersedia.

Gunakan `openclaw.runtimeExtensions` saat file runtime yang diterbitkan tidak
berada di jalur yang sama dengan entri sumber. Jika ada, `runtimeExtensions` harus
berisi tepat satu entri untuk setiap entri `extensions`. Daftar yang tidak cocok
menggagalkan instalasi dan penemuan plugin alih-alih diam-diam fallback ke jalur
sumber. Jika Anda juga menerbitkan `openclaw.setupEntry`, gunakan
`openclaw.runtimeSetupEntry` untuk peer JavaScript bawaannya; file tersebut wajib
saat dideklarasikan.

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
terpaket saat ini sudah membundel banyak plugin resmi, jadi plugin tersebut tidak
memerlukan instalasi npm terpisah dalam setup normal. Sampai setiap plugin milik
OpenClaw bermigrasi ke ClawHub, OpenClaw masih mengirimkan beberapa paket plugin
`@openclaw/*` di npm untuk instalasi lama/khusus dan alur kerja npm langsung.

Jika npm melaporkan paket plugin `@openclaw/*` sebagai deprecated, versi paket
tersebut berasal dari rangkaian paket eksternal yang lebih lama. Gunakan plugin
bundel dari OpenClaw saat ini atau checkout lokal sampai paket npm yang lebih
baru diterbitkan.

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
    - `memory-core` - pencarian memori bundel (default melalui `plugins.slots.memory`)
    - `memory-lancedb` - memori jangka panjang berbasis LanceDB dengan auto-recall/capture (tetapkan `plugins.slots.memory = "memory-lancedb"`)

    Lihat [Memory LanceDB](/id/plugins/memory-lancedb) untuk penyiapan embedding yang kompatibel dengan OpenAI,
    contoh Ollama, batas recall, dan pemecahan masalah.

  </Accordion>

  <Accordion title="Penyedia ucapan (diaktifkan secara bawaan)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` - plugin browser bawaan untuk alat browser, CLI `openclaw browser`, metode Gateway `browser.request`, runtime browser, dan layanan kontrol browser bawaan (diaktifkan secara bawaan; nonaktifkan sebelum menggantinya)
    - `copilot-proxy` - jembatan VS Code Copilot Proxy (dinonaktifkan secara bawaan)

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
| `enabled`          | Tombol utama (bawaan: `true`)                             |
| `allow`            | Daftar izin plugin (opsional)                             |
| `bundledDiscovery` | Mode penemuan plugin bawaan (`allowlist` secara bawaan)   |
| `deny`             | Daftar blokir plugin (opsional; blokir menang)            |
| `load.paths`       | File/direktori plugin tambahan                            |
| `slots`            | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>`   | Tombol per plugin + konfigurasi                           |

`plugins.allow` bersifat eksklusif. Saat tidak kosong, hanya plugin yang tercantum yang dapat dimuat
atau mengekspos alat, meskipun `tools.allow` berisi `"*"` atau nama alat spesifik yang dimiliki plugin.
Jika daftar izin alat merujuk ke alat plugin, tambahkan id plugin pemiliknya
ke `plugins.allow` atau hapus `plugins.allow`; `openclaw doctor` memperingatkan bentuk ini.

`plugins.bundledDiscovery` secara bawaan adalah `"allowlist"` untuk konfigurasi baru, sehingga inventaris
`plugins.allow` yang ketat juga memblokir plugin penyedia bawaan yang dihilangkan,
termasuk penemuan penyedia pencarian web saat runtime. Doctor memberi cap konfigurasi
daftar izin ketat yang lebih lama dengan `"compat"` selama migrasi agar peningkatan versi tetap mempertahankan
perilaku penyedia bawaan lama sampai operator memilih mode yang lebih ketat.
`plugins.allow` kosong tetap diperlakukan sebagai belum disetel/terbuka.

Perubahan konfigurasi yang dibuat melalui `/plugins enable` atau `/plugins disable` memicu pemuatan ulang plugin
Gateway dalam proses. Giliran agen baru membangun ulang daftar alatnya dari
registri plugin yang diperbarui. Operasi yang mengubah sumber seperti install,
update, dan uninstall tetap memulai ulang proses Gateway karena modul plugin
yang sudah diimpor tidak dapat diganti dengan aman di tempat.

`openclaw plugins list` adalah snapshot registri/konfigurasi plugin lokal. Plugin
`enabled` di sana berarti registri tersimpan dan konfigurasi saat ini mengizinkan
plugin untuk berpartisipasi. Itu tidak membuktikan bahwa Gateway jarak jauh yang sudah berjalan
telah memuat ulang atau memulai ulang ke kode plugin yang sama. Pada penyiapan VPS/kontainer
dengan proses pembungkus, kirim restart atau penulisan yang memicu pemuatan ulang ke proses
`openclaw gateway run` yang sebenarnya, atau gunakan `openclaw gateway restart` terhadap
Gateway yang sedang berjalan saat pemuatan ulang melaporkan kegagalan.

<Accordion title="Status plugin: dinonaktifkan vs hilang vs tidak valid">
  - **Dinonaktifkan**: plugin ada tetapi aturan pengaktifan mematikannya. Konfigurasi dipertahankan.
  - **Hilang**: konfigurasi merujuk ke id plugin yang tidak ditemukan oleh penemuan.
  - **Tidak valid**: plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dinyatakan. Startup Gateway hanya melewati plugin tersebut; `openclaw doctor --fix` dapat mengarantina entri tidak valid dengan menonaktifkannya dan menghapus payload konfigurasinya.

</Accordion>

## Penemuan dan presedensi

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Path konfigurasi">
    `plugins.load.paths` - path file atau direktori eksplisit. Path yang menunjuk
    kembali ke direktori plugin bawaan paket milik OpenClaw sendiri diabaikan;
    jalankan `openclaw doctor --fix` untuk menghapus alias usang tersebut.
  </Step>

  <Step title="Plugin ruang kerja">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Dikirim bersama OpenClaw. Banyak yang diaktifkan secara bawaan (penyedia model, ucapan).
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

Instalasi paket dan image Docker biasanya menyelesaikan plugin bawaan dari pohon
`dist/extensions` terkompilasi. Jika direktori sumber plugin bawaan
di-bind-mount di atas path sumber paket yang cocok, misalnya
`/app/extensions/synology-chat`, OpenClaw memperlakukan direktori sumber yang dipasang itu
sebagai overlay sumber bawaan dan menemukannya sebelum bundel paket
`/app/dist/extensions/synology-chat`. Ini menjaga loop kontainer maintainer
tetap berfungsi tanpa mengalihkan setiap plugin bawaan kembali ke sumber TypeScript.
Setel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk memaksa bundel dist paket
meskipun mount overlay sumber ada.

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua plugin dan melewati pekerjaan penemuan/pemuatan plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin asal ruang kerja **dinonaktifkan secara bawaan** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set bawaan yang aktif secara default kecuali ditimpa
- Slot eksklusif dapat memaksa pengaktifan plugin yang dipilih untuk slot tersebut
- Beberapa plugin bawaan opt-in diaktifkan otomatis saat konfigurasi menamai
  permukaan yang dimiliki plugin, seperti referensi model penyedia, konfigurasi channel, atau runtime
  harness
- Konfigurasi plugin usang dipertahankan saat `plugins.enabled: false` aktif;
  aktifkan ulang plugin sebelum menjalankan pembersihan doctor jika Anda ingin id usang dihapus
- Rute Codex keluarga OpenAI menjaga batas plugin terpisah:
  `openai-codex/*` milik plugin OpenAI, sedangkan plugin app-server Codex
  bawaan dipilih oleh `agentRuntime.id: "codex"` atau referensi model
  `codex/*` lama

## Memecahkan masalah hook runtime

Jika plugin muncul di `plugins list` tetapi efek samping atau hook `register(api)`
tidak berjalan di lalu lintas chat langsung, periksa hal-hal ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan konfirmasi bahwa URL
  Gateway aktif, profil, path konfigurasi, dan proses adalah yang sedang Anda edit.
- Mulai ulang Gateway langsung setelah perubahan install/konfigurasi/kode plugin. Dalam kontainer
  pembungkus, PID 1 mungkin hanya supervisor; mulai ulang atau kirim sinyal ke proses anak
  `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --runtime --json` untuk mengonfirmasi pendaftaran hook dan
  diagnostik. Hook percakapan non-bawaan seperti `llm_input`,
  `llm_output`, `before_agent_finalize`, dan `agent_end` memerlukan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk pengalihan model, pilih `before_model_resolve`. Ini berjalan sebelum resolusi model
  untuk giliran agen; `llm_output` hanya berjalan setelah percobaan model
  menghasilkan keluaran asisten.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau permukaan
  sesi/status Gateway dan, saat men-debug payload penyedia, mulai
  Gateway dengan `--raw-stream --raw-stream-path <path>`.

### Penyiapan alat plugin lambat

Jika giliran agen tampak macet saat menyiapkan alat, aktifkan pencatatan trace dan
periksa baris waktu pabrik alat plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cari:

```text
[trace:plugin-tools] factory timings ...
```

Ringkasan mencantumkan total waktu pabrik dan pabrik alat plugin paling lambat,
termasuk id plugin, nama alat yang dinyatakan, bentuk hasil, dan apakah alat itu
opsional. Baris lambat dipromosikan menjadi peringatan saat satu pabrik memakan waktu
setidaknya 1 detik atau total persiapan pabrik alat plugin memakan waktu setidaknya 5 detik.

OpenClaw menyimpan hasil pabrik alat plugin yang berhasil dalam cache untuk resolusi berulang
dengan konteks permintaan efektif yang sama. Kunci cache mencakup konfigurasi runtime efektif,
ruang kerja, id agen/sesi, kebijakan sandbox, pengaturan browser,
konteks pengiriman, identitas peminta, dan status kepemilikan, sehingga pabrik yang
bergantung pada bidang tepercaya tersebut dijalankan ulang saat konteks berubah.

Jika satu plugin mendominasi waktu, periksa pendaftaran runtime-nya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Kemudian update, install ulang, atau nonaktifkan plugin tersebut. Penulis plugin harus memindahkan
pemuatan dependensi yang mahal ke balik jalur eksekusi alat, bukan melakukannya
di dalam pabrik alat.

### Kepemilikan channel atau alat duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu plugin yang aktif mencoba memiliki channel,
alur penyiapan, atau nama alat yang sama. Penyebab paling umum adalah plugin channel eksternal
yang diinstal berdampingan dengan plugin bawaan yang kini menyediakan id channel yang sama.

Langkah debug:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap plugin yang aktif
  dan asalnya.
- Jalankan `openclaw plugins inspect <id> --runtime --json` untuk setiap plugin yang dicurigai dan
  bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah menginstal atau menghapus
  paket plugin agar metadata tersimpan mencerminkan instalasi saat ini.
- Mulai ulang Gateway setelah perubahan install, registri, atau konfigurasi.

Opsi perbaikan:

- Jika satu plugin sengaja menggantikan plugin lain untuk id channel yang sama, plugin
  yang dipilih sebaiknya mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan
  id plugin berprioritas lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikat tidak disengaja, nonaktifkan salah satu sisi dengan
  `plugins.entries.<plugin-id>.enabled: false` atau hapus instalasi plugin
  yang usang.
- Jika Anda secara eksplisit mengaktifkan kedua plugin, OpenClaw mempertahankan permintaan itu dan
  melaporkan konflik. Pilih satu pemilik untuk channel atau ganti nama alat yang dimiliki plugin
  agar permukaan runtime tidak ambigu.

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

| Slot            | Yang dikontrol        | Bawaan              |
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
bawaan). Plugin bawaan lain masih memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin terpasang atau paket hook yang sudah ada di tempatnya. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk peningkatan rutin plugin npm yang
dilacak. Ini tidak didukung dengan `--link`, yang menggunakan ulang jalur sumber alih-alih
menyalin ke target instalasi terkelola.

Ketika `plugins.allow` sudah diatur, `openclaw plugins install` menambahkan id plugin
yang diinstal ke allowlist tersebut sebelum mengaktifkannya. Jika id plugin yang sama
ada di `plugins.deny`, instalasi menghapus entri deny lama itu agar instalasi eksplisit
langsung dapat dimuat setelah restart.

OpenClaw menyimpan registry plugin lokal persisten sebagai model baca dingin untuk
inventaris plugin, kepemilikan kontribusi, dan perencanaan startup. Alur install, update,
uninstall, enable, dan disable menyegarkan registry tersebut setelah mengubah status
plugin. File `plugins/installs.json` yang sama menyimpan metadata instalasi tahan lama di
`installRecords` tingkat atas dan metadata manifest yang dapat dibangun ulang di
`plugins`. Jika registry hilang, basi, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifest-nya dari catatan instalasi, kebijakan config,
dan metadata manifest/package tanpa memuat modul runtime plugin.
`openclaw plugins update <id-or-npm-spec>` berlaku untuk instalasi yang dilacak. Memberikan
spec package npm dengan dist-tag atau versi persis akan memetakan nama package kembali ke
catatan plugin yang dilacak dan mencatat spec baru untuk update mendatang. Memberikan nama
package tanpa versi memindahkan instalasi yang dipin persis kembali ke lini rilis default
registry. Jika plugin npm yang terinstal sudah cocok dengan versi yang di-resolve dan
identitas artefak yang tercatat, OpenClaw melewati update tanpa mengunduh, menginstal ulang,
atau menulis ulang config.
Ketika `openclaw update` berjalan pada kanal beta, catatan plugin npm dan ClawHub lini
default mencoba `@beta` terlebih dahulu dan fallback ke default/latest ketika tidak ada
rilis beta plugin. Versi persis dan tag eksplisit tetap dipin.

`--pin` hanya untuk npm. Ini tidak didukung dengan `--marketplace`, karena instalasi
marketplace menyimpan metadata sumber marketplace alih-alih spec npm.

`--dangerously-force-unsafe-install` adalah override darurat untuk false positive dari
pemindai dangerous-code bawaan. Ini memungkinkan instalasi plugin dan update plugin
melanjutkan proses melewati temuan `critical` bawaan, tetapi tetap tidak melewati blok
kebijakan `before_install` plugin atau pemblokiran akibat kegagalan pemindaian.
Pemindaian instalasi mengabaikan file dan direktori test umum seperti `tests/`,
`__tests__/`, `*.test.*`, dan `*.spec.*` agar tidak memblokir mock test yang dipaketkan;
entrypoint runtime plugin yang dideklarasikan tetap dipindai meskipun menggunakan salah
satu nama tersebut.

Flag CLI ini hanya berlaku untuk alur install/update plugin. Instalasi dependensi skill
berbasis Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang
sesuai, sementara `openclaw skills install` tetap menjadi alur unduh/instal skill ClawHub
yang terpisah.

Jika plugin yang Anda publikasikan di ClawHub disembunyikan atau diblokir oleh pemindaian,
buka dasbor ClawHub atau jalankan `clawhub package rescan <name>` untuk meminta ClawHub
memeriksanya lagi. `--dangerously-force-unsafe-install` hanya memengaruhi instalasi di
mesin Anda sendiri; ini tidak meminta ClawHub memindai ulang plugin atau membuat rilis
yang diblokir menjadi publik.

Bundle kompatibel ikut serta dalam alur daftar/inspeksi/aktifkan/nonaktifkan plugin yang
sama. Dukungan runtime saat ini mencakup skill bundle, command-skill Claude, default
`settings.json` Claude, default `.lsp.json` Claude dan `lspServers` yang dideklarasikan
manifest, command-skill Cursor, serta direktori hook Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kemampuan bundle yang terdeteksi plus
entri server MCP dan LSP yang didukung atau tidak didukung untuk plugin berbasis bundle.

Sumber marketplace dapat berupa nama known-marketplace Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau jalur
`marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo GitHub, atau URL git.
Untuk marketplace remote, entri plugin harus tetap berada di dalam repo marketplace yang
di-clone dan hanya menggunakan sumber jalur relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ikhtisar API Plugin

Plugin native mengekspor objek entry yang mengekspos `register(api)`. Plugin lama
mungkin masih menggunakan `activate(api)` sebagai alias legacy, tetapi plugin baru harus
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

OpenClaw memuat objek entry dan memanggil `register(api)` selama aktivasi plugin.
Loader masih fallback ke `activate(api)` untuk plugin lama, tetapi plugin bawaan dan
plugin eksternal baru harus memperlakukan `register` sebagai kontrak publik.

`api.registrationMode` memberi tahu plugin mengapa entry-nya sedang dimuat:

| Mode            | Arti                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan tool, hook, layanan, perintah, route, dan efek samping live lainnya.                                |
| `discovery`     | Penemuan kemampuan baca-saja. Daftarkan penyedia dan metadata; kode entry plugin tepercaya dapat dimuat, tetapi lewati efek samping live. |
| `setup-only`    | Pemuatan metadata setup channel melalui entry setup ringan.                                                                      |
| `setup-runtime` | Pemuatan setup channel yang juga memerlukan entry runtime.                                                                       |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                        |

Entry plugin yang membuka socket, database, worker latar belakang, atau klien berumur
panjang harus membatasi efek samping tersebut dengan `api.registrationMode === "full"`.
Pemuatan discovery di-cache terpisah dari pemuatan aktivasi dan tidak menggantikan
registry Gateway yang sedang berjalan. Discovery bersifat non-aktif, bukan bebas impor:
OpenClaw dapat mengevaluasi entry plugin tepercaya atau modul plugin channel untuk
membangun snapshot. Jaga top level modul tetap ringan dan bebas efek samping, dan pindahkan
klien jaringan, subprocess, listener, pembacaan credential, serta startup layanan ke balik
jalur full-runtime.

Metode registrasi umum:

| Metode                                  | Yang didaftarkan             |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Penyedia model (LLM)         |
| `registerChannel`                       | Channel chat                 |
| `registerTool`                          | Tool agen                    |
| `registerHook` / `on(...)`              | Hook lifecycle               |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | STT streaming                |
| `registerRealtimeVoiceProvider`         | Suara real-time dupleks      |
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

Perilaku guard hook untuk hook lifecycle bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

App-server Codex native menjembatani event tool native Codex kembali ke permukaan hook
ini. Plugin dapat memblokir tool native Codex melalui `before_tool_call`, mengamati hasil
melalui `after_tool_call`, dan berpartisipasi dalam persetujuan `PermissionRequest` Codex.
Bridge belum menulis ulang argumen tool native Codex. Batas dukungan runtime Codex yang
persis ada di [kontrak dukungan harness Codex v1](/id/plugins/codex-harness#v1-support-contract).

Untuk perilaku hook bertipe lengkap, lihat [ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) - buat Plugin Anda sendiri
- [Bundel Plugin](/id/plugins/bundles) - kompatibilitas bundel Codex/Claude/Cursor
- [Manifest Plugin](/id/plugins/manifest) - skema manifest
- [Mendaftarkan alat](/id/plugins/building-plugins#registering-agent-tools) - tambahkan alat agen dalam Plugin
- [Internal Plugin](/id/plugins/architecture) - model kapabilitas dan alur pemuatan
- [Plugin komunitas](/id/plugins/community) - daftar pihak ketiga
