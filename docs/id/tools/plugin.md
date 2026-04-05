---
read_when:
    - Menginstal atau mengonfigurasi plugin
    - Memahami penemuan plugin dan aturan pemuatan
    - Bekerja dengan bundle plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Menginstal, mengonfigurasi, dan mengelola plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-05T14:09:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 707bd3625596f290322aeac9fecb7f4c6f45d595fdfb82ded7cbc8e04457ac7f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

Plugin memperluas OpenClaw dengan kemampuan baru: channel, penyedia model,
tools, Skills, ucapan, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, web fetch, web
search, dan lainnya. Beberapa plugin bersifat **core** (dikirim bersama OpenClaw), lainnya
bersifat **external** (diterbitkan di npm oleh komunitas).

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

    # Dari direktori atau arsip lokal
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Mulai ulang Gateway">
    ```bash
    openclaw gateway restart
    ```

    Lalu konfigurasikan di bawah `plugins.entries.\<id\>.config` dalam file config Anda.

  </Step>
</Steps>

Jika Anda lebih suka kontrol native-chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Path instalasi menggunakan resolver yang sama dengan CLI: path/arsip lokal, `clawhub:<pkg>`
eksplisit, atau spesifikasi paket bare (ClawHub terlebih dahulu, lalu fallback ke npm).

Jika config tidak valid, instalasi biasanya gagal tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah path instal ulang plugin bawaan yang sempit
untuk plugin yang ikut serta dalam
`openclaw.install.allowInvalidConfigRecovery`.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerja                                                       | Contoh                                                 |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi in-process    | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak yang kompatibel dengan Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di `openclaw plugins list`. Lihat [Bundle Plugin](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis plugin native, mulai dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ringkasan Plugin SDK](/id/plugins/sdk-overview).

## Plugin resmi

### Dapat diinstal (npm)

| Plugin          | Paket                  | Dokumentasi                          |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/id/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/id/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/id/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/id/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/id/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/id/plugins/zalouser)   |

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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Field            | Deskripsi                                                |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | Toggle utama (default: `true`)                           |
| `allow`          | Allowlist plugin (opsional)                              |
| `deny`           | Denylist plugin (opsional; deny selalu menang)           |
| `load.paths`     | File/direktori plugin tambahan                           |
| `slots`          | Pemilih slot eksklusif (misalnya `memory`, `contextEngine`) |
| `entries.\<id\>` | Toggle + config per-plugin                               |

Perubahan config **memerlukan restart gateway**. Jika Gateway berjalan dengan config
watch + restart in-process diaktifkan (path `openclaw gateway` default), restart
tersebut biasanya dilakukan secara otomatis sesaat setelah penulisan config selesai.

<Accordion title="Status plugin: dinonaktifkan vs hilang vs tidak valid">
  - **Dinonaktifkan**: plugin ada tetapi aturan enablement mematikannya. Config dipertahankan.
  - **Hilang**: config merujuk ke id plugin yang tidak ditemukan oleh penemuan.
  - **Tidak valid**: plugin ada tetapi config-nya tidak cocok dengan skema yang dideklarasikan.
</Accordion>

## Penemuan dan prioritas

OpenClaw memindai plugin dalam urutan berikut (kecocokan pertama yang menang):

<Steps>
  <Step title="Path config">
    `plugins.load.paths` — path file atau direktori eksplisit.
  </Step>

  <Step title="Ekstensi workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Ekstensi global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (penyedia model, ucapan).
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

### Aturan enablement

- `plugins.enabled: false` menonaktifkan semua plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin asal workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set default-on bawaan kecuali dioverride
- Slot eksklusif dapat memaksa aktif plugin yang dipilih untuk slot tersebut

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

| Slot            | Yang dikontrol           | Default            |
| --------------- | ------------------------ | ------------------ |
| `memory`        | Plugin memori aktif      | `memory-core`      |
| `contextEngine` | Mesin konteks aktif      | `legacy` (bawaan)  |

## Referensi CLI

```bash
openclaw plugins list                       # inventaris ringkas
openclaw plugins list --enabled            # hanya plugin yang dimuat
openclaw plugins list --verbose            # baris detail per-plugin
openclaw plugins list --json               # inventaris yang dapat dibaca mesin
openclaw plugins inspect <id>              # detail mendalam
openclaw plugins inspect <id> --json       # dapat dibaca mesin
openclaw plugins inspect --all             # tabel seluruh armada
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostik

openclaw plugins install <package>         # instal (ClawHub dulu, lalu npm)
openclaw plugins install clawhub:<pkg>     # instal hanya dari ClawHub
openclaw plugins install <spec> --force    # timpa instalasi yang ada
openclaw plugins install <path>            # instal dari path lokal
openclaw plugins install -l <path>         # link (tanpa salin) untuk dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # catat spesifikasi npm hasil resolve yang persis
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # perbarui satu plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # perbarui semua
openclaw plugins uninstall <id>          # hapus catatan config/instalasi
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin bawaan dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (misalnya
penyedia model bawaan, penyedia ucapan bawaan, dan plugin browser
bawaan). Plugin bawaan lainnya tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin atau hook pack yang sudah terinstal di tempat.
Flag ini tidak didukung dengan `--link`, yang menggunakan kembali source path alih-alih
menyalin ke target instalasi terkelola.

`--pin` hanya untuk npm. Flag ini tidak didukung dengan `--marketplace`, karena
instalasi marketplace menyimpan metadata sumber marketplace alih-alih spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override break-glass untuk false
positive dari pemindai kode berbahaya bawaan. Ini memungkinkan instalasi dan pembaruan plugin
tetap berjalan melewati temuan bawaan `critical`, tetapi tetap
tidak melewati blok kebijakan plugin `before_install` atau pemblokiran kegagalan pemindaian.

Flag CLI ini hanya berlaku untuk alur instalasi/pembaruan plugin. Instalasi dependensi skill
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang cocok,
sementara `openclaw skills install` tetap merupakan alur unduh/instal skill ClawHub yang terpisah.

Bundle yang kompatibel berpartisipasi dalam alur list/inspect/enable/disable plugin yang sama.
Dukungan runtime saat ini mencakup skill bundle, command-skills Claude,
default Claude `settings.json`, default Claude `.lsp.json` dan
`lspServers` yang dideklarasikan manifest, command-skills Cursor, dan direktori hook Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kemampuan bundle yang terdeteksi beserta
entri server MCP dan LSP yang didukung atau tidak didukung untuk plugin berbasis bundle.

Sumber marketplace dapat berupa nama known-marketplace Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau
path `marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo GitHub,
atau URL git. Untuk marketplace remote, entri plugin harus tetap berada di dalam
repo marketplace yang di-clone dan hanya menggunakan source path relatif.

Lihat [referensi CLI `openclaw plugins`](/cli/plugins) untuk detail lengkap.

## Ringkasan Plugin API

Plugin native mengekspor objek entri yang mengekspos `register(api)`. Plugin lama
mungkin masih menggunakan `activate(api)` sebagai alias lama, tetapi plugin baru harus
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
plugin. Loader masih fallback ke `activate(api)` untuk plugin lama,
tetapi plugin bawaan dan plugin eksternal baru harus memperlakukan `register` sebagai
kontrak publik.

Metode registrasi umum:

| Metode                                  | Yang didaftarkan             |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Penyedia model (LLM)         |
| `registerChannel`                       | Chat channel                 |
| `registerTool`                          | Tool agent                   |
| `registerHook` / `on(...)`              | Hook lifecycle               |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | STT streaming                |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks       |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio        |
| `registerImageGenerationProvider`       | Pembuatan gambar             |
| `registerVideoGenerationProvider`       | Pembuatan video              |
| `registerWebFetchProvider`              | Penyedia web fetch / scrape  |
| `registerWebSearchProvider`             | Web search                   |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Perintah CLI                 |
| `registerContextEngine`                 | Mesin konteks                |
| `registerService`                       | Layanan latar belakang       |

Perilaku guard hook untuk hook lifecycle bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok yang lebih awal.
- `before_install`: `{ block: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok yang lebih awal.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan yang lebih awal.

Untuk perilaku hook bertipe lengkap, lihat [Ringkasan SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — buat plugin Anda sendiri
- [Bundle Plugin](/id/plugins/bundles) — kompatibilitas bundle Codex/Claude/Cursor
- [Manifest Plugin](/id/plugins/manifest) — skema manifest
- [Mendaftarkan Tools](/id/plugins/building-plugins#registering-agent-tools) — tambahkan tool agent dalam plugin
- [Internal Plugin](/plugins/architecture) — model kapabilitas dan pipeline pemuatan
- [Plugin Komunitas](/id/plugins/community) — daftar pihak ketiga
