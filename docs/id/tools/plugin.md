---
read_when:
    - Menginstal atau mengonfigurasi plugin
    - Memahami aturan penemuan dan pemuatan plugin
    - Bekerja dengan bundel plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-24T15:22:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

Plugin memperluas OpenClaw dengan kemampuan baru: channel, penyedia model,
harness agen, alat, Skills, ucapan, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, web fetch, pencarian web,
dan lainnya. Beberapa plugin bersifat **core** (dikirim bersama OpenClaw), yang lain
bersifat **external** (dipublikasikan di npm oleh komunitas).

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

    Lalu konfigurasikan di bawah `plugins.entries.\<id\>.config` dalam file konfigurasi Anda.

  </Step>
</Steps>

Jika Anda lebih memilih kontrol yang native untuk chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Jalur instalasi menggunakan resolver yang sama dengan CLI: path/arsip lokal, `clawhub:<pkg>` eksplisit, atau spesifikasi paket biasa (ClawHub terlebih dahulu, lalu fallback ke npm).

Jika konfigurasi tidak valid, instalasi biasanya gagal secara tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur penginstalan ulang
plugin bawaan yang sempit untuk plugin yang memilih ikut serta dalam
`openclaw.install.allowInvalidConfigRecovery`.

Instalasi OpenClaw yang dipaketkan tidak secara eager menginstal seluruh pohon dependensi runtime dari setiap plugin bawaan.
Saat plugin bawaan milik OpenClaw aktif dari konfigurasi plugin, konfigurasi channel lama, atau manifest yang aktif secara default,
startup hanya memperbaiki dependensi runtime yang dideklarasikan oleh plugin itu sebelum mengimpornya.
Plugin external dan path pemuatan kustom tetap harus diinstal melalui
`openclaw plugins install`.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                      | Contoh                                                 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi dalam proses    | Plugin resmi, paket npm komunitas                      |
| **Bundle** | Tata letak yang kompatibel dengan Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di `openclaw plugins list`. Lihat [Bundel Plugin](/id/plugins/bundles) untuk detail bundel.

Jika Anda menulis plugin native, mulai dari [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar Plugin SDK](/id/plugins/sdk-overview).

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
    - `memory-lancedb` — memori jangka panjang install-on-demand dengan recall/capture otomatis (atur `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Penyedia ucapan (diaktifkan secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` — plugin browser bawaan untuk alat browser, CLI `openclaw browser`, metode gateway `browser.request`, runtime browser, dan layanan kontrol browser default (diaktifkan secara default; nonaktifkan sebelum menggantinya)
    - `copilot-proxy` — jembatan Proxy VS Code Copilot (dinonaktifkan secara default)
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

| Field            | Deskripsi                                                 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Toggle utama (default: `true`)                            |
| `allow`          | Daftar izin plugin (opsional)                             |
| `deny`           | Daftar blokir plugin (opsional; deny menang)              |
| `load.paths`     | File/direktori plugin tambahan                            |
| `slots`          | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)   |
| `entries.\<id\>` | Toggle + konfigurasi per plugin                           |

Perubahan konfigurasi **memerlukan restart gateway**. Jika Gateway berjalan dengan config
watch + restart dalam proses diaktifkan (jalur default `openclaw gateway`), restart
tersebut biasanya dilakukan secara otomatis sesaat setelah penulisan konfigurasi selesai.
Tidak ada jalur hot-reload yang didukung untuk kode runtime plugin native atau hook
siklus hidup; restart proses Gateway yang melayani channel live sebelum
mengharapkan kode `register(api)` yang diperbarui, hook `api.on(...)`, alat, layanan, atau
hook penyedia/runtime berjalan.

`openclaw plugins list` adalah snapshot CLI/konfigurasi lokal. Plugin `loaded` di sana
berarti plugin dapat ditemukan dan dimuat dari konfigurasi/file yang terlihat oleh
pemanggilan CLI tersebut. Itu tidak membuktikan bahwa child Gateway remote yang sudah berjalan
telah di-restart ke kode plugin yang sama. Pada setup VPS/container dengan proses pembungkus,
kirim restart ke proses `openclaw gateway run` yang sebenarnya, atau gunakan
`openclaw gateway restart` terhadap Gateway yang sedang berjalan.

<Accordion title="Status plugin: disabled vs missing vs invalid">
  - **Disabled**: plugin ada tetapi aturan pengaktifan menonaktifkannya. Konfigurasi dipertahankan.
  - **Missing**: konfigurasi mereferensikan ID plugin yang tidak ditemukan oleh discovery.
  - **Invalid**: plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan.
</Accordion>

## Discovery dan prioritas

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Path konfigurasi">
    `plugins.load.paths` — path file atau direktori eksplisit.
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

### Aturan pengaktifan

- `plugins.enabled: false` menonaktifkan semua plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin yang berasal dari workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti kumpulan default-on bawaan kecuali ditimpa
- Slot eksklusif dapat memaksa mengaktifkan plugin yang dipilih untuk slot tersebut
- Beberapa plugin bawaan opt-in diaktifkan secara otomatis ketika konfigurasi menamai surface milik plugin,
  seperti referensi model penyedia, konfigurasi channel, atau runtime harness
- Rute Codex keluarga OpenAI mempertahankan batas plugin yang terpisah:
  `openai-codex/*` milik plugin OpenAI, sedangkan plugin app-server Codex bawaan
  dipilih oleh `embeddedHarness.runtime: "codex"` atau referensi model lama
  `codex/*`

## Pemecahan Masalah Hook Runtime

Jika plugin muncul di `plugins list` tetapi efek samping `register(api)` atau hook
tidak berjalan dalam lalu lintas chat live, periksa ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan konfirmasi URL
  Gateway aktif, profil, path konfigurasi, dan proses adalah yang sedang Anda edit.
- Restart Gateway live setelah perubahan instalasi/konfigurasi/kode plugin. Dalam
  container pembungkus, PID 1 mungkin hanya supervisor; restart atau kirim sinyal ke proses child
  `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --json` untuk mengonfirmasi registrasi hook dan
  diagnostik. Hook percakapan non-bawaan seperti `llm_input`,
  `llm_output`, dan `agent_end` memerlukan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk pergantian model, utamakan `before_model_resolve`. Hook ini berjalan sebelum resolusi model
  untuk giliran agen; `llm_output` hanya berjalan setelah percobaan model
  menghasilkan output asisten.
- Untuk bukti model sesi yang efektif, gunakan `openclaw sessions` atau surface
  sesi/status Gateway dan, saat men-debug payload penyedia, mulai
  Gateway dengan `--raw-stream --raw-stream-path <path>`.

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

| Slot            | Yang dikendalikan     | Default             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin Active Memory  | `memory-core`       |
| `contextEngine` | Mesin konteks aktif   | `legacy` (bawaan)   |

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
openclaw plugins install -l <path>         # tautkan (tanpa menyalin) untuk pengembangan
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # catat spesifikasi npm hasil resolusi yang tepat
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

Plugin bawaan dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (misalnya
penyedia model bawaan, penyedia ucapan bawaan, dan plugin browser
bawaan). Plugin bawaan lainnya tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin atau paket hook yang sudah terinstal di tempat. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk upgrade rutin plugin npm
yang dilacak. Opsi ini tidak didukung dengan `--link`, yang menggunakan ulang path sumber
alih-alih menyalin ke target instalasi terkelola.

Saat `plugins.allow` sudah diatur, `openclaw plugins install` menambahkan
ID plugin yang diinstal ke daftar izin tersebut sebelum mengaktifkannya, sehingga instalasi
langsung dapat dimuat setelah restart.

`openclaw plugins update <id-or-npm-spec>` berlaku untuk instalasi yang dilacak. Memberikan
spesifikasi paket npm dengan dist-tag atau versi yang tepat akan menyelesaikan nama paket
kembali ke catatan plugin yang dilacak dan mencatat spesifikasi baru untuk pembaruan mendatang.
Memberikan nama paket tanpa versi memindahkan instalasi pin tepat kembali ke
jalur rilis default registri. Jika plugin npm yang terinstal sudah cocok
dengan versi hasil resolusi dan identitas artefak yang tercatat, OpenClaw melewati pembaruan
tanpa mengunduh, menginstal ulang, atau menulis ulang konfigurasi.

`--pin` hanya untuk npm. Opsi ini tidak didukung dengan `--marketplace`, karena
instalasi marketplace menyimpan metadata sumber marketplace alih-alih spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override break-glass untuk false
positive dari pemindai kode berbahaya bawaan. Opsi ini memungkinkan instalasi plugin
dan pembaruan plugin untuk tetap berjalan melewati temuan bawaan `critical`, tetapi tetap
tidak melewati blok kebijakan plugin `before_install` atau pemblokiran kegagalan pemindaian.

Flag CLI ini hanya berlaku untuk alur instalasi/pembaruan plugin. Instalasi dependensi skill
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai,
sementara `openclaw skills install` tetap menjadi alur unduh/instal skill ClawHub yang terpisah.

Bundel yang kompatibel berpartisipasi dalam alur list/inspect/enable/disable plugin yang sama.
Dukungan runtime saat ini mencakup skill bundel, command-skills Claude,
default Claude `settings.json`, default Claude `.lsp.json` dan `lspServers`
yang dideklarasikan manifest, command-skills Cursor, dan direktori hook Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kemampuan bundel yang terdeteksi serta
entri server MCP dan LSP yang didukung atau tidak didukung untuk plugin berbasis bundel.

Sumber marketplace dapat berupa nama known-marketplace Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau
path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub,
atau URL git. Untuk marketplace remote, entri plugin harus tetap berada di dalam
repo marketplace yang dikloning dan hanya menggunakan sumber path relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ikhtisar API plugin

Plugin native mengekspor objek entri yang mengekspos `register(api)`. Plugin
lama mungkin masih menggunakan `activate(api)` sebagai alias lama, tetapi plugin baru harus
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
tetapi plugin bawaan dan plugin external baru harus memperlakukan `register` sebagai
kontrak publik.

Metode pendaftaran yang umum:

| Method                                  | Yang didaftarkan            |
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
| `registerWebFetchProvider`              | Penyedia web fetch / scrape |
| `registerWebSearchProvider`             | Pencarian web               |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Perintah CLI                |
| `registerContextEngine`                 | Mesin konteks               |
| `registerService`                       | Layanan latar belakang      |

Perilaku guard hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus cancel sebelumnya.

Untuk perilaku hook bertipe lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — buat plugin Anda sendiri
- [Bundel Plugin](/id/plugins/bundles) — kompatibilitas bundel Codex/Claude/Cursor
- [Manifest Plugin](/id/plugins/manifest) — skema manifest
- [Mendaftarkan Alat](/id/plugins/building-plugins#registering-agent-tools) — tambahkan alat agen dalam plugin
- [Internal Plugin](/id/plugins/architecture) — model kapabilitas dan pipeline pemuatan
- [Plugin Komunitas](/id/plugins/community) — daftar pihak ketiga
