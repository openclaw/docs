---
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami aturan penemuan dan pemuatan Plugin
    - Bekerja dengan bundel Plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-24T09:32:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

Plugin memperluas OpenClaw dengan kemampuan baru: channel, penyedia model,
harness agen, alat, Skills, ucapan, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, pencarian web,
dan banyak lagi. Beberapa plugin bersifat **inti** (disertakan dengan OpenClaw), yang lain
bersifat **eksternal** (dipublikasikan di npm oleh komunitas).

## Mulai cepat

<Steps>
  <Step title="Lihat apa yang dimuat">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instal plugin">
    ```bash
    # Dari npm
    openclaw plugins install @openclaw/voice-call

    # Dari direktori lokal atau arsip
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

Jika Anda lebih suka kontrol native-chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Jalur instalasi menggunakan resolver yang sama seperti CLI: path/arsip lokal, `clawhub:<pkg>`
eksplisit, atau spesifikasi paket tanpa awalan (ClawHub terlebih dahulu, lalu fallback ke npm).

Jika konfigurasi tidak valid, instalasi biasanya gagal tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur instal ulang
plugin bawaan yang sempit untuk plugin yang memilih ikut serta pada
`openclaw.install.allowInvalidConfigRecovery`.

Instalasi OpenClaw yang dipaketkan tidak secara eager menginstal seluruh pohon dependensi
runtime setiap plugin bawaan. Saat plugin bawaan milik OpenClaw aktif dari
konfigurasi plugin, konfigurasi channel lama, atau manifest yang diaktifkan secara default, startup
hanya memperbaiki dependensi runtime yang dideklarasikan oleh plugin tersebut sebelum mengimpornya.
Plugin eksternal dan path muat kustom tetap harus diinstal melalui
`openclaw plugins install`.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                      | Contoh                                                 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dijalankan dalam proses    | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak yang kompatibel dengan Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di `openclaw plugins list`. Lihat [Plugin Bundles](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis plugin native, mulai dengan [Building Plugins](/id/plugins/building-plugins)
dan [Plugin SDK Overview](/id/plugins/sdk-overview).

## Plugin resmi

### Dapat diinstal (npm)

| Plugin          | Paket                  | Dokumen                              |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/id/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/id/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/id/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/id/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/id/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/id/plugins/zalouser)   |

### Inti (disertakan dengan OpenClaw)

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
  </Accordion>

  <Accordion title="Penyedia ucapan (diaktifkan secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` — plugin browser bawaan untuk alat browser, CLI `openclaw browser`, metode gateway `browser.request`, runtime browser, dan layanan kontrol browser default (diaktifkan secara default; nonaktifkan sebelum menggantinya)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (dinonaktifkan secara default)
  </Accordion>
</AccordionGroup>

Mencari plugin pihak ketiga? Lihat [Community Plugins](/id/plugins/community).

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

| Bidang          | Deskripsi                                                |
| --------------- | -------------------------------------------------------- |
| `enabled`       | Toggle utama (default: `true`)                           |
| `allow`         | Daftar izin plugin (opsional)                            |
| `deny`          | Daftar tolak plugin (opsional; tolak menang)             |
| `load.paths`    | File/direktori plugin tambahan                           |
| `slots`         | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)  |
| `entries.\<id\>` | Toggle per-plugin + konfigurasi                         |

Perubahan konfigurasi **memerlukan restart gateway**. Jika Gateway berjalan dengan
watch konfigurasi + restart dalam proses diaktifkan (jalur default `openclaw gateway`),
restart tersebut biasanya dilakukan secara otomatis sesaat setelah penulisan konfigurasi diterapkan.

<Accordion title="Status plugin: disabled vs missing vs invalid">
  - **Disabled**: plugin ada tetapi aturan pengaktifan menonaktifkannya. Konfigurasi dipertahankan.
  - **Missing**: konfigurasi mereferensikan id plugin yang tidak ditemukan oleh discovery.
  - **Invalid**: plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan.
</Accordion>

## Penemuan dan prioritas

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama yang menang):

<Steps>
  <Step title="Path konfigurasi">
    `plugins.load.paths` — file atau path direktori eksplisit.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Disertakan dengan OpenClaw. Banyak yang diaktifkan secara default (penyedia model, ucapan).
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin yang berasal dari workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set default-on bawaan kecuali jika dioverride
- Slot eksklusif dapat memaksa plugin yang dipilih untuk slot itu menjadi aktif
- Beberapa plugin bawaan opt-in diaktifkan secara otomatis saat konfigurasi menamai
  permukaan milik plugin, seperti referensi model penyedia, konfigurasi channel, atau runtime
  harness
- Rute Codex keluarga OpenAI mempertahankan batas plugin yang terpisah:
  `openai-codex/*` milik plugin OpenAI, sedangkan plugin app-server Codex
  bawaan dipilih oleh `embeddedHarness.runtime: "codex"` atau referensi model lama
  `codex/*`

## Slot plugin (kategori eksklusif)

Beberapa kategori bersifat eksklusif (hanya satu yang aktif pada satu waktu):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // atau "none" untuk menonaktifkan
      contextEngine: "legacy", // atau id plugin
    },
  },
}
```

| Slot            | Yang dikendalikan      | Default             |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Plugin Active Memory   | `memory-core`       |
| `contextEngine` | Mesin konteks aktif    | `legacy` (bawaan)   |

## Referensi CLI

```bash
openclaw plugins list                       # inventaris ringkas
openclaw plugins list --enabled            # hanya plugin yang dimuat
openclaw plugins list --verbose            # baris detail per plugin
openclaw plugins list --json               # inventaris yang dapat dibaca mesin
openclaw plugins inspect <id>              # detail mendalam
openclaw plugins inspect <id> --json       # dapat dibaca mesin
openclaw plugins inspect --all             # tabel seluruh armada
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostik

openclaw plugins install <package>         # instal (ClawHub terlebih dahulu, lalu npm)
openclaw plugins install clawhub:<pkg>     # instal hanya dari ClawHub
openclaw plugins install <spec> --force    # timpa instalasi yang ada
openclaw plugins install <path>            # instal dari path lokal
openclaw plugins install -l <path>         # link (tanpa copy) untuk pengembangan
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # catat spesifikasi npm hasil resolve yang persis
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # perbarui satu plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # perbarui semua
openclaw plugins uninstall <id>          # hapus catatan konfigurasi/instalasi
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin bawaan disertakan dengan OpenClaw. Banyak yang diaktifkan secara default (misalnya
penyedia model bawaan, penyedia ucapan bawaan, dan plugin browser
bawaan). Plugin bawaan lainnya tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin atau paket hook yang sudah terinstal di tempat yang sama. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk upgrade rutin plugin npm yang terlacak.
Ini tidak didukung dengan `--link`, yang menggunakan ulang path sumber
alih-alih menyalin ke target instalasi terkelola.

Saat `plugins.allow` sudah disetel, `openclaw plugins install` menambahkan id plugin yang
diinstal ke daftar izin tersebut sebelum mengaktifkannya, sehingga instalasi dapat
langsung dimuat setelah restart.

`openclaw plugins update <id-or-npm-spec>` berlaku untuk instalasi yang terlacak. Memberikan
spesifikasi paket npm dengan dist-tag atau versi persis akan me-resolve nama paket
kembali ke catatan plugin yang terlacak dan mencatat spesifikasi baru untuk pembaruan berikutnya.
Memberikan nama paket tanpa versi memindahkan instalasi exact pinned kembali ke
jalur rilis default registry. Jika plugin npm yang terinstal sudah cocok
dengan versi hasil resolve dan identitas artefak yang tercatat, OpenClaw melewati pembaruan
tanpa mengunduh, menginstal ulang, atau menulis ulang konfigurasi.

`--pin` hanya untuk npm. Ini tidak didukung dengan `--marketplace`, karena
instalasi marketplace menyimpan metadata sumber marketplace alih-alih spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override break-glass untuk false
positive dari pemindai kode berbahaya bawaan. Ini memungkinkan instalasi plugin
dan pembaruan plugin tetap berjalan melewati temuan bawaan `critical`, tetapi tetap
tidak melewati blok kebijakan plugin `before_install` atau pemblokiran kegagalan pemindaian.

Flag CLI ini hanya berlaku untuk alur instal/update plugin. Instalasi dependensi skill
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai,
sedangkan `openclaw skills install` tetap menjadi alur unduh/instal skill ClawHub yang terpisah.

Bundle yang kompatibel berpartisipasi dalam alur list/inspect/enable/disable plugin yang sama. Dukungan runtime saat ini mencakup bundle skills, command-skills Claude,
default Claude `settings.json`, default Claude `.lsp.json` dan `lspServers`
yang dideklarasikan dalam manifest, command-skills Cursor, dan direktori hook
Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kemampuan bundle yang terdeteksi serta
entri server MCP dan LSP yang didukung atau tidak didukung untuk plugin yang didukung bundle.

Sumber marketplace dapat berupa nama known-marketplace Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau path
`marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo GitHub,
atau URL git. Untuk marketplace remote, entri plugin harus tetap berada di dalam
repo marketplace yang dikloning dan hanya menggunakan sumber path relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ikhtisar API plugin

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
plugin. Loader masih melakukan fallback ke `activate(api)` untuk plugin lama,
tetapi plugin bawaan dan plugin eksternal baru harus memperlakukan `register` sebagai
kontrak publik.

Metode pendaftaran umum:

| Metode                                  | Yang didaftarkan            |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Penyedia model (LLM)        |
| `registerChannel`                       | Channel chat                |
| `registerTool`                          | Alat agen                   |
| `registerHook` / `on(...)`              | Hook siklus hidup           |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT streaming               |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks      |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio       |
| `registerImageGenerationProvider`       | Pembuatan gambar            |
| `registerMusicGenerationProvider`       | Pembuatan musik             |
| `registerVideoGenerationProvider`       | Pembuatan video             |
| `registerWebFetchProvider`              | Penyedia fetch / scrape web |
| `registerWebSearchProvider`             | Pencarian web               |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Perintah CLI                |
| `registerContextEngine`                 | Mesin konteks               |
| `registerService`                       | Layanan latar belakang      |

Perilaku guard hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus block yang lebih awal.
- `before_install`: `{ block: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus block yang lebih awal.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler dengan prioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus cancel yang lebih awal.

Untuk perilaku hook bertipe lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Building Plugins](/id/plugins/building-plugins) — buat plugin Anda sendiri
- [Plugin Bundles](/id/plugins/bundles) — kompatibilitas bundle Codex/Claude/Cursor
- [Plugin Manifest](/id/plugins/manifest) — skema manifest
- [Registering Tools](/id/plugins/building-plugins#registering-agent-tools) — tambahkan alat agen dalam plugin
- [Plugin Internals](/id/plugins/architecture) — model kapabilitas dan pipeline pemuatan
- [Community Plugins](/id/plugins/community) — daftar pihak ketiga
