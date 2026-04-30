---
read_when:
    - Menambahkan atau memodifikasi Skills
    - Mengubah pembatasan Skills, daftar izin, atau aturan pemuatan
    - Memahami presedensi Skills dan perilaku cuplikan
sidebarTitle: Skills
summary: 'Skills: terkelola vs ruang kerja, aturan pembatasan, daftar izin agen, dan pengaitan konfigurasi'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw menggunakan folder skill yang **kompatibel dengan [AgentSkills](https://agentskills.io)** untuk mengajarkan agen cara menggunakan alat. Setiap skill adalah direktori yang berisi `SKILL.md` dengan frontmatter YAML dan instruksi. OpenClaw memuat skill bawaan ditambah override lokal opsional, lalu memfilternya saat pemuatan berdasarkan lingkungan, konfigurasi, dan keberadaan biner.

## Lokasi dan prioritas

OpenClaw memuat skill dari sumber-sumber ini, **prioritas tertinggi lebih dulu**:

| #   | Sumber                | Jalur                            |
| --- | --------------------- | -------------------------------- |
| 1   | Skill workspace       | `<workspace>/skills`             |
| 2   | Skill agen proyek     | `<workspace>/.agents/skills`     |
| 3   | Skill agen pribadi    | `~/.agents/skills`               |
| 4   | Skill terkelola/lokal | `~/.openclaw/skills`             |
| 5   | Skill bawaan          | dikirim bersama instalasi        |
| 6   | Folder skill ekstra   | `skills.load.extraDirs` (config) |

Jika nama skill bertentangan, sumber tertinggi yang menang.

Direktori native `$CODEX_HOME/skills` milik Codex CLI bukan salah satu root skill OpenClaw ini. Dalam mode harness Codex, peluncuran app-server lokal menggunakan home Codex terisolasi per agen, sehingga skill Codex CLI pribadi tidak dimuat secara implisit. Gunakan `openclaw migrate codex --dry-run` untuk menginventarisasinya dan `openclaw migrate codex` untuk memilih direktori skill dengan prompt kotak centang interaktif sebelum menyalinnya ke workspace agen OpenClaw saat ini. Untuk proses non-interaktif, ulangi `--skill <name>` untuk skill persis yang akan disalin.

## Skill per agen vs bersama

Dalam setup **multi-agen**, setiap agen memiliki workspace sendiri:

| Cakupan              | Jalur                                       | Terlihat oleh                 |
| -------------------- | ------------------------------------------- | ----------------------------- |
| Per agen             | `<workspace>/skills`                        | Hanya agen tersebut           |
| Agen proyek          | `<workspace>/.agents/skills`                | Hanya agen workspace tersebut |
| Agen pribadi         | `~/.agents/skills`                          | Semua agen di mesin itu       |
| Terkelola/lokal bersama | `~/.openclaw/skills`                     | Semua agen di mesin itu       |
| Direktori ekstra bersama | `skills.load.extraDirs` (prioritas terendah) | Semua agen di mesin itu   |

Nama yang sama di beberapa tempat → sumber tertinggi yang menang. Workspace mengalahkan agen proyek, mengalahkan agen pribadi, mengalahkan terkelola/lokal, mengalahkan bawaan, mengalahkan direktori ekstra.

## Daftar izin skill agen

**Lokasi** skill dan **visibilitas** skill adalah kontrol yang terpisah. Lokasi/prioritas menentukan salinan mana dari skill bernama sama yang menang; daftar izin agen menentukan skill mana yang benar-benar dapat digunakan agen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Aturan daftar izin">
    - Hilangkan `agents.defaults.skills` agar skill tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
    - Tetapkan `agents.list[].skills: []` agar tidak ada skill.
    - Daftar `agents.list[].skills` yang tidak kosong adalah set **final** untuk agen tersebut — daftar itu tidak digabungkan dengan default.
    - Daftar izin efektif berlaku di seluruh pembuatan prompt, penemuan perintah slash skill, sinkronisasi sandbox, dan snapshot skill.

  </Accordion>
</AccordionGroup>

## Plugin dan skill

Plugin dapat mengirim skill mereka sendiri dengan mencantumkan direktori `skills` di `openclaw.plugin.json` (jalur relatif terhadap root plugin). Skill plugin dimuat saat plugin diaktifkan. Ini adalah tempat yang tepat untuk panduan operasi khusus alat yang terlalu panjang untuk deskripsi alat tetapi harus tersedia kapan pun plugin terinstal — misalnya, plugin browser mengirim skill `browser-automation` untuk kontrol browser multi-langkah.

Direktori skill plugin digabungkan ke jalur berprioritas rendah yang sama seperti `skills.load.extraDirs`, sehingga skill bawaan, terkelola, agen, atau workspace dengan nama yang sama akan menimpanya. Anda dapat membatasinya melalui `metadata.openclaw.requires.config` pada entri konfigurasi plugin.

Lihat [Plugin](/id/tools/plugin) untuk penemuan/konfigurasi dan [Alat](/id/tools) untuk permukaan alat yang diajarkan skill tersebut.

## Skill Workshop

Plugin eksperimental opsional **Skill Workshop** dapat membuat atau memperbarui skill workspace dari prosedur pakai ulang yang diamati selama pekerjaan agen. Plugin ini dinonaktifkan secara default dan harus diaktifkan secara eksplisit melalui `plugins.entries.skill-workshop`.

Skill Workshop hanya menulis ke `<workspace>/skills`, memindai konten yang dihasilkan, mendukung persetujuan tertunda atau penulisan aman otomatis, mengarantina proposal yang tidak aman, dan menyegarkan snapshot skill setelah penulisan berhasil sehingga skill baru tersedia tanpa restart Gateway.

Gunakan untuk koreksi seperti _"lain kali, verifikasi atribusi GIF"_ atau alur kerja yang diperoleh dengan susah payah seperti daftar periksa QA media. Mulailah dengan persetujuan tertunda; gunakan penulisan otomatis hanya di workspace tepercaya setelah meninjau proposalnya. Panduan lengkap: [Plugin Skill Workshop](/id/plugins/skill-workshop).

## ClawHub (instal dan sinkronisasi)

[ClawHub](https://clawhub.ai) adalah registri skill publik untuk OpenClaw. Gunakan perintah native `openclaw skills` untuk menemukan/menginstal/memperbarui, atau CLI `clawhub` terpisah untuk alur kerja publikasi/sinkronisasi. Panduan lengkap: [ClawHub](/id/tools/clawhub).

| Tindakan                          | Perintah                               |
| --------------------------------- | -------------------------------------- |
| Instal skill ke workspace         | `openclaw skills install <skill-slug>` |
| Perbarui semua skill terinstal    | `openclaw skills update --all`         |
| Sinkronisasi (pindai + publikasikan pembaruan) | `clawhub sync --all`        |

`openclaw skills install` native menginstal ke direktori `skills/` workspace aktif. CLI `clawhub` terpisah juga menginstal ke `./skills` di bawah direktori kerja Anda saat ini (atau fallback ke workspace OpenClaw yang dikonfigurasi). OpenClaw mengambilnya sebagai `<workspace>/skills` pada sesi berikutnya.
Root skill yang dikonfigurasi juga mendukung satu tingkat pengelompokan, seperti `skills/<group>/<skill>/SKILL.md`, sehingga skill pihak ketiga terkait dapat disimpan di bawah folder bersama tanpa pemindaian rekursif yang luas.

Halaman skill ClawHub menampilkan status pemindaian keamanan terbaru sebelum instalasi, dengan halaman detail pemindai untuk VirusTotal, ClawScan, dan analisis statis. `openclaw skills install <slug>` tetap hanya jalur instalasi; penerbit memulihkan positif palsu melalui dasbor ClawHub atau `clawhub skill rescan <slug>`.

## Keamanan

<Warning>
Perlakukan skill pihak ketiga sebagai **kode tidak tepercaya**. Baca sebelum mengaktifkannya. Pilih proses bersandbox untuk input tidak tepercaya dan alat berisiko. Lihat [Sandboxing](/id/gateway/sandboxing) untuk kontrol sisi agen.
</Warning>

- Penemuan skill workspace dan direktori ekstra hanya menerima root skill dan file `SKILL.md` yang realpath terselesaikannya tetap berada di dalam root yang dikonfigurasi.
- Instalasi dependensi skill yang didukung Gateway (`skills.install`, onboarding, dan UI pengaturan Skills) menjalankan pemindai kode berbahaya bawaan sebelum mengeksekusi metadata installer. Temuan `critical` memblokir secara default kecuali pemanggil secara eksplisit menetapkan override berbahaya; temuan mencurigakan tetap hanya memperingatkan.
- `openclaw skills install <slug>` berbeda — perintah itu mengunduh folder skill ClawHub ke workspace dan tidak menggunakan jalur metadata installer di atas.
- `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan rahasia ke proses **host** untuk giliran agen tersebut (bukan sandbox). Jauhkan rahasia dari prompt dan log.

Untuk model ancaman dan daftar periksa yang lebih luas, lihat [Keamanan](/id/gateway/security).

## Format SKILL.md

`SKILL.md` harus menyertakan setidaknya:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw mengikuti spesifikasi AgentSkills untuk tata letak/niat. Parser yang digunakan oleh agen tertanam hanya mendukung kunci frontmatter **satu baris**; `metadata` harus berupa **objek JSON satu baris**. Gunakan `{baseDir}` dalam instruksi untuk merujuk jalur folder skill.

### Kunci frontmatter opsional

<ParamField path="homepage" type="string">
  URL yang ditampilkan sebagai "Situs web" di UI Skills macOS. Juga didukung melalui `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Saat `true`, skill ditampilkan sebagai perintah slash pengguna.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Saat `true`, skill dikecualikan dari prompt model (tetap tersedia melalui pemanggilan pengguna).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Saat diatur ke `tool`, perintah slash melewati model dan dikirim langsung ke alat.
</ParamField>
<ParamField path="command-tool" type="string">
  Nama alat yang akan dipanggil saat `command-dispatch: tool` ditetapkan.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Untuk pengiriman alat, meneruskan string arg mentah ke alat (tanpa parsing core). Alat dipanggil dengan `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Pembatasan (filter saat pemuatan)

OpenClaw memfilter skill saat pemuatan menggunakan `metadata` (JSON satu baris):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Kolom di bawah `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Saat `true`, selalu sertakan skill (lewati gate lain).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opsional yang digunakan oleh UI Skills macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opsional yang ditampilkan sebagai "Situs web" di UI Skills macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Daftar platform opsional. Jika ditetapkan, skill hanya memenuhi syarat pada OS tersebut.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Masing-masing harus ada di `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Setidaknya satu harus ada di `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Variabel env harus ada atau disediakan dalam config.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Daftar jalur `openclaw.json` yang harus bernilai truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nama variabel env yang terkait dengan `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Spesifikasi installer opsional yang digunakan oleh UI Skills macOS (brew/node/go/uv/download).
</ParamField>

Jika tidak ada `metadata.openclaw`, skill selalu memenuhi syarat (kecuali dinonaktifkan dalam config atau diblokir oleh `skills.allowBundled` untuk skill bawaan).

<Note>
Blok lama `metadata.clawdbot` masih diterima saat `metadata.openclaw` tidak ada, sehingga skill lama yang terinstal tetap mempertahankan gate dependensi dan petunjuk installernya. Skill baru dan yang diperbarui harus menggunakan `metadata.openclaw`.
</Note>

### Catatan sandboxing

- `requires.bins` diperiksa pada **host** saat pemuatan skill.
- Jika agen disandbox, biner juga harus ada **di dalam container**. Instal melalui `agents.defaults.sandbox.docker.setupCommand` (atau image kustom). `setupCommand` berjalan sekali setelah container dibuat. Instalasi paket juga memerlukan egress jaringan, root FS yang dapat ditulis, dan pengguna root di sandbox.
- Contoh: skill `summarize` (`skills/summarize/SKILL.md`) memerlukan CLI `summarize` di container sandbox agar dapat berjalan di sana.

### Spesifikasi installer

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Installer selection rules">
    - Jika beberapa penginstal dicantumkan, gateway memilih satu opsi pilihan (brew jika tersedia, jika tidak node).
    - Jika semua penginstal adalah `download`, OpenClaw mencantumkan setiap entri agar Anda dapat melihat artefak yang tersedia.
    - Spesifikasi penginstal dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter opsi berdasarkan platform.
    - Instalasi Node mengikuti `skills.install.nodeManager` di `openclaw.json` (default: npm; opsi: npm/pnpm/yarn/bun). Ini hanya memengaruhi instalasi skill; runtime Gateway tetap harus berupa Node — Bun tidak direkomendasikan untuk WhatsApp/Telegram.
    - Pemilihan penginstal yang didukung Gateway digerakkan oleh preferensi: ketika spesifikasi instalasi mencampur beberapa jenis, OpenClaw lebih memilih Homebrew saat `skills.install.preferBrew` diaktifkan dan `brew` ada, lalu `uv`, lalu manajer node yang dikonfigurasi, lalu fallback lain seperti `go` atau `download`.
    - Jika setiap spesifikasi instalasi adalah `download`, OpenClaw menampilkan semua opsi unduhan alih-alih meringkasnya menjadi satu penginstal pilihan.

  </Accordion>
  <Accordion title="Per-installer details">
    - **Instalasi Go:** jika `go` tidak ada dan `brew` tersedia, gateway menginstal Go melalui Homebrew terlebih dahulu dan mengatur `GOBIN` ke `bin` milik Homebrew jika memungkinkan.
    - **Instalasi unduhan:** `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (default: otomatis saat arsip terdeteksi), `stripComponents`, `targetDir` (default: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Override konfigurasi

Skill bawaan dan terkelola dapat diaktifkan/nonaktifkan serta diberi nilai env
di bawah `skills.entries` dalam `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` menonaktifkan skill meskipun skill tersebut dibundel atau diinstal.
  Skill `coding-agent` bawaan bersifat opt-in: atur
  `skills.entries.coding-agent.enabled: true` sebelum menampilkannya ke agen,
  lalu pastikan salah satu dari `claude`, `codex`, `opencode`, atau `pi` telah diinstal dan
  diautentikasi untuk CLI-nya sendiri.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Kemudahan untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`. Mendukung plaintext atau SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Diinjeksi hanya jika variabel belum diatur dalam proses.
</ParamField>
<ParamField path="config" type="object">
  Wadah opsional untuk field per-skill kustom. Key kustom harus berada di sini.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist opsional hanya untuk skill **bawaan**. Jika diatur, hanya skill bawaan dalam daftar yang memenuhi syarat (skill terkelola/workspace tidak terpengaruh).
</ParamField>

Jika nama skill berisi tanda hubung, beri tanda kutip pada key (JSON5 mengizinkan
key yang dikutip). Key konfigurasi cocok dengan **nama skill** secara default — jika sebuah skill
mendefinisikan `metadata.openclaw.skillKey`, gunakan key tersebut di bawah `skills.entries`.

<Note>
Untuk pembuatan/pengeditan gambar stok di dalam OpenClaw, gunakan tool inti
`image_generate` dengan `agents.defaults.imageGenerationModel` alih-alih
skill bawaan. Contoh skill di sini ditujukan untuk workflow kustom atau pihak ketiga.
Untuk analisis gambar native, gunakan tool `image` dengan
`agents.defaults.imageModel`. Jika Anda memilih `openai/*`, `google/*`,
`fal/*`, atau model gambar khusus provider lainnya, tambahkan juga
auth/key API provider tersebut.
</Note>

## Injeksi lingkungan

Saat sebuah run agen dimulai, OpenClaw:

1. Membaca metadata skill.
2. Menerapkan `skills.entries.<key>.env` dan `skills.entries.<key>.apiKey` ke `process.env`.
3. Membuat system prompt dengan skill yang **memenuhi syarat**.
4. Memulihkan lingkungan asli setelah run berakhir.

Injeksi lingkungan **tercakup pada run agen**, bukan lingkungan shell
global.

Untuk backend `claude-cli` bawaan, OpenClaw juga merealisasikan snapshot
memenuhi syarat yang sama sebagai Plugin Claude Code sementara dan meneruskannya dengan
`--plugin-dir`. Claude Code kemudian dapat menggunakan resolver skill native-nya sementara
OpenClaw tetap mengelola presedensi, allowlist per agen, gating, dan
injeksi env/key API `skills.entries.*`. Backend CLI lain hanya menggunakan
katalog prompt.

## Snapshot dan penyegaran

OpenClaw mengambil snapshot skill yang memenuhi syarat **saat sesi dimulai** dan
menggunakan kembali daftar tersebut untuk giliran berikutnya dalam sesi yang sama. Perubahan pada
skill atau konfigurasi berlaku pada sesi baru berikutnya.

Skills dapat disegarkan di tengah sesi dalam dua kasus:

- Watcher skills diaktifkan.
- Node jarak jauh baru yang memenuhi syarat muncul.

Anggap ini sebagai **hot reload**: daftar yang disegarkan digunakan pada
giliran agen berikutnya. Jika allowlist skill agen efektif berubah untuk
sesi tersebut, OpenClaw menyegarkan snapshot agar skill yang terlihat tetap selaras
dengan agen saat ini.

### Watcher Skills

Secara default, OpenClaw memantau folder skill dan menaikkan snapshot skills
saat file `SKILL.md` berubah. Konfigurasikan di bawah `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### Node macOS jarak jauh (gateway Linux)

Jika Gateway berjalan di Linux tetapi sebuah **node macOS** terhubung dengan
`system.run` diizinkan (keamanan persetujuan Exec tidak diatur ke `deny`),
OpenClaw dapat memperlakukan skill khusus macOS sebagai memenuhi syarat ketika
binary yang diperlukan ada pada node tersebut. Agen harus menjalankan skill tersebut
melalui tool `exec` dengan `host=node`.

Ini bergantung pada node yang melaporkan dukungan perintahnya dan pada probe bin
melalui `system.which` atau `system.run`. Node offline **tidak** membuat
skill khusus jarak jauh terlihat. Jika node yang terhubung berhenti menjawab probe
bin, OpenClaw menghapus kecocokan bin yang di-cache agar agen tidak lagi melihat
skill yang saat ini tidak dapat dijalankan di sana.

## Dampak token

Ketika skill memenuhi syarat, OpenClaw menginjeksi daftar XML ringkas dari skill yang tersedia
ke dalam system prompt (melalui `formatSkillsForPrompt` di
`pi-coding-agent`). Biayanya deterministik:

- **Overhead dasar** (hanya saat ≥1 skill): 195 karakter.
- **Per skill:** 97 karakter + panjang nilai `<name>`, `<description>`, dan `<location>` yang di-escape XML.

Rumus (karakter):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Escape XML memperluas `& < > " '` menjadi entitas (`&amp;`, `&lt;`, dll.),
sehingga menambah panjang. Jumlah token bervariasi menurut tokenizer model. Perkiraan kasar
gaya OpenAI adalah ~4 karakter/token, jadi **97 karakter ≈ 24 token** per
skill ditambah panjang field aktual Anda.

## Siklus hidup skill terkelola

OpenClaw menyertakan satu set dasar skill sebagai **skill bawaan** bersama
instalasi (paket npm atau OpenClaw.app). `~/.openclaw/skills` tersedia untuk
override lokal — misalnya, melakukan pin atau patch pada skill tanpa
mengubah salinan bawaan. Skill workspace dimiliki pengguna dan mengoverride
keduanya saat ada konflik nama.

## Mencari lebih banyak skill?

Jelajahi [https://clawhub.ai](https://clawhub.ai). Skema konfigurasi lengkap:
[Konfigurasi Skills](/id/tools/skills-config).

## Terkait

- [ClawHub](/id/tools/clawhub) — registri skill publik
- [Membuat skill](/id/tools/creating-skills) — membangun skill kustom
- [Plugins](/id/tools/plugin) — ikhtisar sistem plugin
- [Plugin Skill Workshop](/id/plugins/skill-workshop) — hasilkan skill dari pekerjaan agen
- [Konfigurasi Skills](/id/tools/skills-config) — referensi konfigurasi skill
- [Perintah slash](/id/tools/slash-commands) — semua perintah slash yang tersedia
