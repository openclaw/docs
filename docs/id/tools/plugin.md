---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami penemuan Plugin dan aturan pemuatan
    - Bekerja dengan bundle Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasi, dan kelola Plugin OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

Plugins memperluas OpenClaw dengan kemampuan baru: channel, penyedia model,
agent harness, alat, Skills, speech, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, web fetch, web
search, dan lainnya. Sebagian Plugin adalah **inti** (dikirim bersama OpenClaw), lainnya
adalah **eksternal** (dipublikasikan di npm oleh komunitas).

## Mulai cepat

<Steps>
  <Step title="Lihat apa yang dimuat">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instal Plugin">
    ```bash
    # Dari npm
    openclaw plugins install @openclaw/voice-call

    # Dari direktori atau arsip lokal
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

Jika Anda lebih memilih kontrol native chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Path instalasi menggunakan resolver yang sama seperti CLI: path/arsip lokal, `clawhub:<pkg>`
eksplisit, atau spesifikasi package biasa (ClawHub terlebih dahulu, lalu fallback ke npm).

Jika konfigurasi tidak valid, instalasi biasanya gagal tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah path instal ulang Plugin bawaan yang sempit
untuk Plugin yang memilih ikut serta dalam
`openclaw.install.allowInvalidConfigRecovery`.

Instalasi OpenClaw yang dipaketkan tidak secara eager menginstal seluruh pohon dependensi runtime
setiap Plugin bawaan. Ketika Plugin milik OpenClaw yang dibundel aktif dari
konfigurasi Plugin, konfigurasi channel lama, atau manifest yang aktif secara default,
startup hanya memperbaiki dependensi runtime yang dideklarasikan Plugin itu sebelum mengimpornya.
Status auth channel yang disimpan saja tidak mengaktifkan channel bawaan untuk
perbaikan dependensi runtime startup Gateway.
Penonaktifan eksplisit tetap menang: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, dan `channels.<id>.enabled: false`
mencegah perbaikan dependensi runtime bawaan otomatis untuk Plugin/channel tersebut.
`plugins.allow` yang tidak kosong juga membatasi perbaikan dependensi runtime bawaan yang aktif secara default;
pengaktifan channel bawaan secara eksplisit (`channels.<id>.enabled: true`) masih dapat
memperbaiki dependensi Plugin channel itu.
Plugin eksternal dan path pemuatan kustom tetap harus diinstal melalui
`openclaw plugins install`.

## Jenis Plugin

OpenClaw mengenali dua format Plugin:

| Format     | Cara kerjanya                                                     | Contoh                                                 |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi dalam proses   | Plugin resmi, package npm komunitas                    |
| **Bundle** | Tata letak yang kompatibel dengan Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di `openclaw plugins list`. Lihat [Plugin Bundles](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis Plugin native, mulai dari [Building Plugins](/id/plugins/building-plugins)
dan [Plugin SDK Overview](/id/plugins/sdk-overview).

## Entrypoint Package

Package npm Plugin native harus mendeklarasikan `openclaw.extensions` di `package.json`.
Setiap entri harus tetap berada di dalam direktori package dan di-resolve ke file runtime
yang dapat dibaca, atau ke file sumber TypeScript dengan peer JavaScript hasil build
yang diinferensikan seperti `src/index.ts` ke `dist/index.js`.

Gunakan `openclaw.runtimeExtensions` ketika file runtime yang dipublikasikan tidak berada di
path yang sama dengan entri sumber. Jika ada, `runtimeExtensions` harus berisi
tepat satu entri untuk setiap entri `extensions`. Daftar yang tidak cocok membuat instalasi dan
penemuan Plugin gagal alih-alih diam-diam fallback ke path sumber.

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

### Dapat diinstal (npm)

| Plugin          | Package                | Dokumen                              |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/id/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/id/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/id/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/id/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/id/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/id/plugins/zalouser)   |

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
    - `memory-lancedb` — memori jangka panjang install-on-demand dengan auto-recall/capture (setel `plugins.slots.memory = "memory-lancedb"`)

  </Accordion>

  <Accordion title="Penyedia speech (diaktifkan secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` — Plugin browser bawaan untuk alat browser, CLI `openclaw browser`, metode Gateway `browser.request`, runtime browser, dan layanan kontrol browser default (diaktifkan secara default; nonaktifkan sebelum menggantinya)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (dinonaktifkan secara default)

  </Accordion>
</AccordionGroup>

Mencari Plugin pihak ketiga? Lihat [Community Plugins](/id/plugins/community).

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

| Field            | Deskripsi                                                 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Toggle utama (default: `true`)                            |
| `allow`          | Allowlist Plugin (opsional)                               |
| `deny`           | Denylist Plugin (opsional; deny menang)                   |
| `load.paths`     | File/direktori Plugin tambahan                            |
| `slots`          | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>` | Toggle + konfigurasi per Plugin                           |

Perubahan konfigurasi **memerlukan restart gateway**. Jika Gateway berjalan dengan config
watch + restart in-process diaktifkan (path default `openclaw gateway`), restart
tersebut biasanya dilakukan secara otomatis sesaat setelah penulisan konfigurasi tersimpan.
Tidak ada path hot-reload yang didukung untuk kode runtime Plugin native atau lifecycle
hook; mulai ulang proses Gateway yang melayani channel live sebelum
mengharapkan kode `register(api)` yang diperbarui, hook `api.on(...)`, alat, layanan, atau
hook penyedia/runtime untuk berjalan.

`openclaw plugins list` adalah snapshot registry/konfigurasi Plugin lokal. Plugin yang
`enabled` di sana berarti registry yang disimpan dan konfigurasi saat ini mengizinkan
Plugin berpartisipasi. Itu tidak membuktikan bahwa child Gateway jarak jauh yang sudah berjalan
sudah restart ke kode Plugin yang sama. Pada setup VPS/container dengan
proses wrapper, kirim restart ke proses `openclaw gateway run` yang sebenarnya,
atau gunakan `openclaw gateway restart` terhadap Gateway yang sedang berjalan.

<Accordion title="Status Plugin: dinonaktifkan vs hilang vs tidak valid">
  - **Dinonaktifkan**: Plugin ada tetapi aturan pengaktifan menonaktifkannya. Konfigurasi tetap disimpan.
  - **Hilang**: konfigurasi merujuk ke ID Plugin yang tidak ditemukan oleh discovery.
  - **Tidak valid**: Plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan.

</Accordion>

## Discovery dan prioritas

OpenClaw memindai Plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Path konfigurasi">
    `plugins.load.paths` — path file atau direktori eksplisit. Path yang menunjuk
    kembali ke direktori Plugin bawaan milik OpenClaw yang dipaketkan akan diabaikan;
    jalankan `openclaw doctor --fix` untuk menghapus alias usang tersebut.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (penyedia model, speech).
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

Instalasi yang dipaketkan dan image Docker biasanya me-resolve Plugin bawaan dari
tree `dist/extensions` yang sudah dikompilasi. Jika direktori sumber Plugin bawaan di-
bind-mount di atas path sumber paket yang cocok, misalnya
`/app/extensions/synology-chat`, OpenClaw memperlakukan direktori sumber yang di-mount tersebut
sebagai overlay sumber bawaan dan menemukannya sebelum bundle paket
`/app/dist/extensions/synology-chat`. Ini menjaga loop container maintainer
tetap berfungsi tanpa mengalihkan setiap Plugin bawaan kembali ke sumber TypeScript.
Setel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` untuk memaksa bundle dist paket
bahkan ketika mount overlay sumber tersedia.

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua Plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan Plugin tersebut
- Plugin yang berasal dari workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set default-on bawaan kecuali dioverride
- Slot eksklusif dapat memaksa mengaktifkan Plugin yang dipilih untuk slot tersebut
- Beberapa Plugin bawaan opt-in diaktifkan secara otomatis saat konfigurasi menamai
  surface milik Plugin, seperti ref model penyedia, konfigurasi channel, atau runtime
  harness
- Rute Codex keluarga OpenAI mempertahankan batas Plugin terpisah:
  `openai-codex/*` milik Plugin OpenAI, sedangkan Plugin app-server Codex bawaan
  dipilih oleh `agentRuntime.id: "codex"` atau ref model lama `codex/*`

## Pemecahan masalah runtime hook

Jika sebuah Plugin muncul di `plugins list` tetapi efek samping `register(api)` atau hook
tidak berjalan pada traffic chat live, periksa ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan konfirmasi
  URL Gateway aktif, profil, path konfigurasi, dan proses adalah yang sedang Anda edit.
- Mulai ulang Gateway live setelah perubahan instalasi/konfigurasi/kode Plugin. Dalam
  container wrapper, PID 1 mungkin hanya supervisor; restart atau kirim sinyal ke proses child
  `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --json` untuk mengonfirmasi pendaftaran hook dan
  diagnostik. Hook percakapan non-bawaan seperti `llm_input`,
  `llm_output`, `before_agent_finalize`, dan `agent_end` memerlukan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk pergantian model, pilih `before_model_resolve`. Hook ini berjalan sebelum resolusi
  model untuk giliran agen; `llm_output` hanya berjalan setelah percobaan model
  menghasilkan output asisten.
- Untuk bukti model sesi yang efektif, gunakan `openclaw sessions` atau
  surface sesi/status Gateway dan, saat men-debug payload penyedia, mulai Gateway
  dengan `--raw-stream --raw-stream-path <path>`.

### Kepemilikan channel atau alat duplikat

Gejala:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ini berarti lebih dari satu Plugin yang diaktifkan mencoba memiliki channel,
alur setup, atau nama alat yang sama. Penyebab paling umum adalah Plugin channel eksternal
yang diinstal berdampingan dengan Plugin bawaan yang kini menyediakan ID channel yang sama.

Langkah debug:

- Jalankan `openclaw plugins list --enabled --verbose` untuk melihat setiap Plugin
  yang diaktifkan dan asalnya.
- Jalankan `openclaw plugins inspect <id> --json` untuk setiap Plugin yang dicurigai dan
  bandingkan `channels`, `channelConfigs`, `tools`, dan diagnostik.
- Jalankan `openclaw plugins registry --refresh` setelah menginstal atau menghapus
  package Plugin agar metadata yang disimpan mencerminkan instalasi saat ini.
- Mulai ulang Gateway setelah perubahan instalasi, registry, atau konfigurasi.

Opsi perbaikan:

- Jika satu Plugin memang menggantikan Plugin lain untuk ID channel yang sama, Plugin
  yang diutamakan sebaiknya mendeklarasikan `channelConfigs.<channel-id>.preferOver` dengan
  ID Plugin berprioritas lebih rendah. Lihat [/plugins/manifest#replacing-another-channel-plugin](/id/plugins/manifest#replacing-another-channel-plugin).
- Jika duplikasi terjadi secara tidak sengaja, nonaktifkan salah satu sisi dengan
  `plugins.entries.<plugin-id>.enabled: false` atau hapus instalasi Plugin usang
  tersebut.
- Jika Anda secara eksplisit mengaktifkan kedua Plugin, OpenClaw mempertahankan permintaan itu dan
  melaporkan konflik. Pilih satu pemilik untuk channel tersebut atau ganti nama alat milik Plugin
  agar surface runtime tidak ambigu.

## Slot Plugin (kategori eksklusif)

Beberapa kategori bersifat eksklusif (hanya satu yang aktif pada satu waktu):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // atau "none" untuk menonaktifkan
      contextEngine: "legacy", // atau ID Plugin
    },
  },
}
```

| Slot            | Yang dikendalikan      | Default             |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Plugin memori aktif    | `memory-core`       |
| `contextEngine` | Mesin konteks aktif    | `legacy` (bawaan)   |

## Referensi CLI

```bash
openclaw plugins list                       # inventaris ringkas
openclaw plugins list --enabled            # hanya Plugin yang diaktifkan
openclaw plugins list --verbose            # baris detail per Plugin
openclaw plugins list --json               # inventaris yang dapat dibaca mesin
openclaw plugins inspect <id>              # detail mendalam
openclaw plugins inspect <id> --json       # dapat dibaca mesin
openclaw plugins inspect --all             # tabel seluruh armada
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostik
openclaw plugins registry                  # periksa status registry yang disimpan
openclaw plugins registry --refresh        # bangun ulang registry yang disimpan
openclaw doctor --fix                      # perbaiki status registry Plugin

openclaw plugins install <package>         # instal (ClawHub dulu, lalu npm)
openclaw plugins install clawhub:<pkg>     # instal hanya dari ClawHub
openclaw plugins install <spec> --force    # timpa instalasi yang sudah ada
openclaw plugins install <path>            # instal dari path lokal
openclaw plugins install -l <path>         # link (tanpa salin) untuk dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # catat spesifikasi npm hasil resolve yang tepat
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # perbarui satu Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # perbarui semua
openclaw plugins uninstall <id>          # hapus konfigurasi dan catatan indeks Plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin bawaan dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (misalnya
penyedia model bawaan, penyedia speech bawaan, dan Plugin browser
bawaan). Plugin bawaan lainnya tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa Plugin atau paket hook yang sudah terinstal di tempatnya. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk upgrade rutin Plugin npm
yang dilacak. Ini tidak didukung dengan `--link`, yang menggunakan ulang path sumber
alih-alih menyalin ke target instalasi terkelola.

Ketika `plugins.allow` sudah disetel, `openclaw plugins install` menambahkan
ID Plugin yang diinstal ke allowlist tersebut sebelum mengaktifkannya. Jika ID Plugin yang sama
ada di `plugins.deny`, proses instalasi menghapus entri deny usang tersebut agar
instalasi eksplisit langsung dapat dimuat setelah restart.

OpenClaw menyimpan registry Plugin lokal persisten sebagai model pembacaan dingin untuk
inventaris Plugin, kepemilikan kontribusi, dan perencanaan startup. Alur install, update,
uninstall, enable, dan disable me-refresh registry itu setelah mengubah status
Plugin. File `plugins/installs.json` yang sama menyimpan metadata instalasi yang tahan lama di
`installRecords` tingkat atas dan metadata manifest yang bisa dibangun ulang di `plugins`. Jika
registry hilang, usang, atau tidak valid, `openclaw plugins registry
--refresh` membangun ulang tampilan manifestnya dari catatan instalasi, kebijakan konfigurasi, dan
metadata manifest/package tanpa memuat modul runtime Plugin.
`openclaw plugins update <id-or-npm-spec>` berlaku untuk instalasi yang dilacak. Jika
Anda memberikan spesifikasi package npm dengan dist-tag atau versi yang tepat, nama package
akan di-resolve kembali ke catatan Plugin yang dilacak dan mencatat spesifikasi baru untuk update mendatang.
Memberikan nama package tanpa versi akan memindahkan instalasi exact pinned kembali ke
jalur rilis default milik registry. Jika Plugin npm yang terinstal sudah cocok
dengan versi yang di-resolve dan identitas artefak yang tercatat, OpenClaw akan melewati update
tanpa mengunduh, menginstal ulang, atau menulis ulang konfigurasi.

`--pin` hanya untuk npm. Ini tidak didukung dengan `--marketplace`, karena
instalasi marketplace menyimpan metadata sumber marketplace alih-alih spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override break-glass untuk false
positive dari pemindai kode berbahaya bawaan. Ini memungkinkan instalasi dan update
Plugin untuk terus berjalan melewati temuan bawaan `critical`, tetapi tetap
tidak melewati blok kebijakan Plugin `before_install` atau pemblokiran kegagalan pemindaian.

Flag CLI ini hanya berlaku untuk alur install/update Plugin. Instalasi dependensi Skills
berbasis Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai,
sedangkan `openclaw skills install` tetap menjadi alur unduh/instal Skills ClawHub yang terpisah.

Bundle yang kompatibel ikut serta dalam alur list/inspect/enable/disable Plugin yang sama.
Dukungan runtime saat ini mencakup Skills bundle, command-skills Claude,
default Claude `settings.json`, default Claude `.lsp.json` dan
`lspServers` yang dideklarasikan manifest, command-skills Cursor, dan direktori hook Codex
yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kemampuan bundle yang terdeteksi serta
entri server MCP dan LSP yang didukung atau tidak didukung untuk Plugin berbasis bundle.

Sumber marketplace dapat berupa nama known-marketplace Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau
path `marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo GitHub,
atau URL git. Untuk marketplace jarak jauh, entri Plugin harus tetap berada di dalam
repo marketplace yang di-clone dan hanya menggunakan sumber path relatif.

Lihat referensi CLI [`openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ikhtisar API Plugin

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
tetapi Plugin bawaan dan Plugin eksternal baru harus memperlakukan `register` sebagai
kontrak publik.

`api.registrationMode` memberi tahu Plugin mengapa entrinya dimuat:

| Mode            | Arti                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan alat, hook, layanan, perintah, route, dan efek samping live lainnya.                                |
| `discovery`     | Discovery kemampuan hanya-baca. Daftarkan penyedia dan metadata; kode entri Plugin tepercaya dapat dimuat, tetapi lewati efek samping live. |
| `setup-only`    | Pemuatan metadata setup channel melalui entri setup ringan.                                                                      |
| `setup-runtime` | Pemuatan setup channel yang juga memerlukan entri runtime.                                                                       |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                         |

Entri Plugin yang membuka socket, database, background worker, atau client
berumur panjang harus menjaga efek samping tersebut dengan `api.registrationMode === "full"`.
Pemuatan discovery di-cache secara terpisah dari pemuatan aktivasi dan tidak menggantikan
registry Gateway yang sedang berjalan. Discovery tidak mengaktifkan, bukan berarti tanpa impor:
OpenClaw dapat mengevaluasi entri Plugin tepercaya atau modul Plugin channel untuk membangun
snapshot. Jaga level atas modul tetap ringan dan bebas efek samping, serta pindahkan
client jaringan, subprocess, listener, pembacaan kredensial, dan startup layanan
ke balik path runtime penuh.

Metode pendaftaran umum:

| Method                                  | Yang didaftarkan           |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Penyedia model (LLM)       |
| `registerChannel`                       | Channel chat               |
| `registerTool`                          | Alat agen                  |
| `registerHook` / `on(...)`              | Lifecycle hook             |
| `registerSpeechProvider`                | Text-to-speech / STT       |
| `registerRealtimeTranscriptionProvider` | Streaming STT              |
| `registerRealtimeVoiceProvider`         | Suara realtime duplex      |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio      |
| `registerImageGenerationProvider`       | Pembuatan gambar           |
| `registerMusicGenerationProvider`       | Pembuatan musik            |
| `registerVideoGenerationProvider`       | Pembuatan video            |
| `registerWebFetchProvider`              | Penyedia web fetch / scrape |
| `registerWebSearchProvider`             | Web search                 |
| `registerHttpRoute`                     | Endpoint HTTP              |
| `registerCommand` / `registerCli`       | Perintah CLI               |
| `registerContextEngine`                 | Mesin konteks              |
| `registerService`                       | Layanan latar belakang     |

Perilaku guard hook untuk lifecycle hook bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` tidak melakukan apa-apa dan tidak menghapus blok yang lebih awal.
- `before_install`: `{ block: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` tidak melakukan apa-apa dan tidak menghapus blok yang lebih awal.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` tidak melakukan apa-apa dan tidak menghapus cancel yang lebih awal.

App-server Codex native menjalankan bridge yang menghubungkan kembali event alat native Codex ke
surface hook ini. Plugin dapat memblokir alat native Codex melalui `before_tool_call`,
mengamati hasil melalui `after_tool_call`, dan berpartisipasi dalam persetujuan
`PermissionRequest` Codex. Bridge tersebut belum menulis ulang argumen alat native Codex. Batas dukungan runtime Codex yang tepat berada dalam
[Kontrak dukungan Codex harness v1](/id/plugins/codex-harness#v1-support-contract).

Untuk perilaku hook bertipe lengkap, lihat [ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — buat Plugin Anda sendiri
- [Plugin Bundles](/id/plugins/bundles) — kompatibilitas bundle Codex/Claude/Cursor
- [Manifest Plugin](/id/plugins/manifest) — skema manifest
- [Mendaftarkan alat](/id/plugins/building-plugins#registering-agent-tools) — tambahkan alat agen dalam Plugin
- [Internal Plugin](/id/plugins/architecture) — model kemampuan dan pipeline pemuatan
- [Plugin komunitas](/id/plugins/community) — daftar pihak ketiga
