---
read_when:
    - Menambahkan atau memodifikasi Skills
    - Mengubah aturan gerbang atau pemuatan Skills
summary: 'Skills: dikelola vs workspace, aturan gerbang, dan wiring config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-11T02:48:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1eaf130966950b6eb24f859d9a77ecbf81c6cb80deaaa6a3a79d2c16d83115d
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw menggunakan folder skill yang **kompatibel dengan [AgentSkills](https://agentskills.io)** untuk mengajarkan agen cara menggunakan tool. Setiap skill adalah direktori yang berisi `SKILL.md` dengan YAML frontmatter dan instruksi. OpenClaw memuat **Skills bawaan** plus override lokal opsional, lalu memfilternya saat load berdasarkan environment, konfigurasi, dan keberadaan biner.

## Lokasi dan prioritas

OpenClaw memuat Skills dari sumber berikut:

1. **Folder skill tambahan**: dikonfigurasi dengan `skills.load.extraDirs`
2. **Skills bawaan**: disertakan bersama instalasi (paket npm atau OpenClaw.app)
3. **Skills terkelola/lokal**: `~/.openclaw/skills`
4. **Skills agen pribadi**: `~/.agents/skills`
5. **Skills agen proyek**: `<workspace>/.agents/skills`
6. **Skills workspace**: `<workspace>/skills`

Jika ada konflik nama skill, urutan prioritasnya adalah:

`<workspace>/skills` (tertinggi) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills bawaan → `skills.load.extraDirs` (terendah)

## Skills per agen vs bersama

Dalam setup **multi-agent**, setiap agen memiliki workspace sendiri. Itu berarti:

- **Skills per agen** berada di `<workspace>/skills` untuk agen itu saja.
- **Skills agen proyek** berada di `<workspace>/.agents/skills` dan berlaku untuk
  workspace tersebut sebelum folder `skills/` workspace biasa.
- **Skills agen pribadi** berada di `~/.agents/skills` dan berlaku di seluruh
  workspace pada mesin itu.
- **Skills bersama** berada di `~/.openclaw/skills` (terkelola/lokal) dan terlihat
  oleh **semua agen** pada mesin yang sama.
- **Folder bersama** juga dapat ditambahkan melalui `skills.load.extraDirs` (prioritas terendah)
  jika Anda ingin paket Skills umum yang digunakan oleh beberapa agen.

Jika nama skill yang sama ada di lebih dari satu tempat, prioritas biasa tetap
berlaku: workspace menang, lalu Skills agen proyek, lalu Skills agen pribadi,
lalu terkelola/lokal, lalu bawaan, lalu extra dirs.

## Allowlist skill per agen

**Lokasi** skill dan **visibilitas** skill adalah dua kontrol yang terpisah.

- Lokasi/prioritas menentukan salinan skill dengan nama yang sama mana yang menang.
- Allowlist agen menentukan skill yang terlihat mana yang benar-benar dapat digunakan agen.

Gunakan `agents.defaults.skills` untuk baseline bersama, lalu override per agen dengan
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // mewarisi github, weather
      { id: "docs", skills: ["docs-search"] }, // menggantikan default
      { id: "locked-down", skills: [] }, // tanpa Skills
    ],
  },
}
```

Aturan:

- Hilangkan `agents.defaults.skills` agar skill tidak dibatasi secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
- Setel `agents.list[].skills: []` untuk tanpa skill.
- Daftar `agents.list[].skills` yang tidak kosong adalah set final untuk agen itu; daftar tersebut
  tidak digabungkan dengan default.

OpenClaw menerapkan set skill agen yang efektif di seluruh pembangunan prompt,
discovery perintah slash skill, sinkronisasi sandbox, dan snapshot skill.

## Plugins + Skills

Plugin dapat menyertakan Skills mereka sendiri dengan mencantumkan direktori `skills` di
`openclaw.plugin.json` (path relatif terhadap root plugin). Skill plugin dimuat
saat plugin diaktifkan. Saat ini direktori tersebut digabungkan ke jalur
berprioritas rendah yang sama dengan `skills.load.extraDirs`, sehingga skill bawaan,
terkelola, agen, atau workspace dengan nama yang sama akan menimpanya.
Anda dapat memberi gerbang pada skill tersebut melalui `metadata.openclaw.requires.config` pada entri
konfigurasi plugin. Lihat [Plugins](/id/tools/plugin) untuk discovery/konfigurasi dan [Tools](/id/tools) untuk
permukaan tool yang diajarkan oleh Skills tersebut.

## ClawHub (install + sync)

ClawHub adalah registry publik Skills untuk OpenClaw. Jelajahi di
[https://clawhub.ai](https://clawhub.ai). Gunakan perintah native `openclaw skills`
untuk menemukan/menginstal/memperbarui skill, atau CLI `clawhub` terpisah saat
Anda membutuhkan alur publish/sync.
Panduan lengkap: [ClawHub](/id/tools/clawhub).

Alur umum:

- Instal skill ke workspace Anda:
  - `openclaw skills install <skill-slug>`
- Perbarui semua skill yang terinstal:
  - `openclaw skills update --all`
- Sync (pindai + publikasikan pembaruan):
  - `clawhub sync --all`

`openclaw skills install` native menginstal ke direktori `skills/` workspace aktif. CLI `clawhub`
terpisah juga menginstal ke `./skills` di bawah direktori kerja
Anda saat ini (atau menggunakan fallback ke workspace OpenClaw yang dikonfigurasi).
OpenClaw akan mengambilnya sebagai `<workspace>/skills` pada sesi berikutnya.

## Catatan keamanan

- Perlakukan skill pihak ketiga sebagai **kode yang tidak tepercaya**. Baca dulu sebelum mengaktifkannya.
- Utamakan run tersandbox untuk input yang tidak tepercaya dan tool berisiko. Lihat [Sandboxing](/id/gateway/sandboxing).
- Discovery skill workspace dan extra-dir hanya menerima root skill dan file `SKILL.md` yang realpath hasil resolve-nya tetap berada di dalam root yang dikonfigurasi.
- Instalasi dependensi skill yang didukung gateway (`skills.install`, onboarding, dan UI pengaturan Skills) menjalankan pemindai dangerous-code bawaan sebelum mengeksekusi metadata installer. Temuan `critical` memblokir secara default kecuali pemanggil secara eksplisit menyetel override dangerous; temuan yang mencurigakan tetap hanya memberi peringatan.
- `openclaw skills install <slug>` berbeda: perintah ini mengunduh folder skill ClawHub ke workspace dan tidak menggunakan jalur metadata installer di atas.
- `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan rahasia ke proses **host**
  untuk giliran agen tersebut (bukan ke sandbox). Jaga agar rahasia tetap keluar dari prompt dan log.
- Untuk model ancaman dan checklist yang lebih luas, lihat [Security](/id/gateway/security).

## Format (AgentSkills + kompatibel Pi)

`SKILL.md` minimal harus mencakup:

```markdown
---
name: image-lab
description: Hasilkan atau edit gambar melalui alur gambar berbasis provider
---
```

Catatan:

- Kami mengikuti spesifikasi AgentSkills untuk layout/tujuan.
- Parser yang digunakan oleh agen tertanam mendukung **kunci frontmatter satu baris** saja.
- `metadata` harus berupa **objek JSON satu baris**.
- Gunakan `{baseDir}` dalam instruksi untuk merujuk ke path folder skill.
- Kunci frontmatter opsional:
  - `homepage` — URL yang ditampilkan sebagai “Website” di UI Skills macOS (juga didukung melalui `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (default: `true`). Saat `true`, skill diekspos sebagai perintah slash pengguna.
  - `disable-model-invocation` — `true|false` (default: `false`). Saat `true`, skill dikecualikan dari prompt model (tetap tersedia melalui pemanggilan pengguna).
  - `command-dispatch` — `tool` (opsional). Saat disetel ke `tool`, perintah slash melewati model dan mengirim langsung ke tool.
  - `command-tool` — nama tool yang akan dipanggil saat `command-dispatch: tool` disetel.
  - `command-arg-mode` — `raw` (default). Untuk dispatch tool, meneruskan string argumen mentah ke tool (tanpa parsing inti).

    Tool dipanggil dengan parameter:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gerbang (filter saat load)

OpenClaw **memfilter Skills saat load** menggunakan `metadata` (JSON satu baris):

```markdown
---
name: image-lab
description: Hasilkan atau edit gambar melalui alur gambar berbasis provider
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

Field di bawah `metadata.openclaw`:

- `always: true` — selalu sertakan skill (lewati gerbang lain).
- `emoji` — emoji opsional yang digunakan oleh UI Skills macOS.
- `homepage` — URL opsional yang ditampilkan sebagai “Website” di UI Skills macOS.
- `os` — daftar platform opsional (`darwin`, `linux`, `win32`). Jika disetel, skill hanya memenuhi syarat di OS tersebut.
- `requires.bins` — daftar; masing-masing harus ada di `PATH`.
- `requires.anyBins` — daftar; setidaknya satu harus ada di `PATH`.
- `requires.env` — daftar; env var harus ada **atau** disediakan dalam konfigurasi.
- `requires.config` — daftar path `openclaw.json` yang harus truthy.
- `primaryEnv` — nama env var yang terkait dengan `skills.entries.<name>.apiKey`.
- `install` — array opsional spesifikasi installer yang digunakan oleh UI Skills macOS (brew/node/go/uv/download).

Catatan tentang sandboxing:

- `requires.bins` diperiksa di **host** saat skill dimuat.
- Jika sebuah agen disandbox, biner tersebut juga harus ada **di dalam container**.
  Instal melalui `agents.defaults.sandbox.docker.setupCommand` (atau image kustom).
  `setupCommand` berjalan sekali setelah container dibuat.
  Instalasi package juga memerlukan network egress, root FS yang dapat ditulis, dan user root di sandbox.
  Contoh: skill `summarize` (`skills/summarize/SKILL.md`) memerlukan CLI `summarize`
  di container sandbox agar dapat berjalan di sana.

Contoh installer:

```markdown
---
name: gemini
description: Gunakan Gemini CLI untuk bantuan coding dan pencarian Google.
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
              "label": "Instal Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Catatan:

- Jika beberapa installer dicantumkan, gateway memilih **satu** opsi yang disukai (brew jika tersedia, jika tidak node).
- Jika semua installer bertipe `download`, OpenClaw mencantumkan setiap entri agar Anda dapat melihat artefak yang tersedia.
- Spesifikasi installer dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter opsi berdasarkan platform.
- Instalasi Node menghormati `skills.install.nodeManager` di `openclaw.json` (default: npm; opsi: npm/pnpm/yarn/bun).
  Ini hanya memengaruhi **instalasi skill**; runtime Gateway tetap sebaiknya Node
  (Bun tidak direkomendasikan untuk WhatsApp/Telegram).
- Pemilihan installer yang didukung gateway berbasis preferensi, bukan hanya node:
  ketika spesifikasi instalasi mencampur beberapa jenis, OpenClaw lebih memilih Homebrew ketika
  `skills.install.preferBrew` diaktifkan dan `brew` ada, lalu `uv`, lalu
  node manager yang dikonfigurasi, lalu fallback lain seperti `go` atau `download`.
- Jika setiap spesifikasi instalasi adalah `download`, OpenClaw menampilkan semua opsi download
  alih-alih menciutkannya menjadi satu installer pilihan.
- Instalasi Go: jika `go` tidak ada dan `brew` tersedia, gateway akan menginstal Go melalui Homebrew terlebih dahulu dan menyetel `GOBIN` ke `bin` milik Homebrew jika memungkinkan.
- Instalasi download: `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (default: otomatis saat arsip terdeteksi), `stripComponents`, `targetDir` (default: `~/.openclaw/tools/<skillKey>`).

Jika `metadata.openclaw` tidak ada, skill selalu memenuhi syarat (kecuali
dinonaktifkan di konfigurasi atau diblokir oleh `skills.allowBundled` untuk Skills bawaan).

## Override konfigurasi (`~/.openclaw/openclaw.json`)

Skills bawaan/terkelola dapat diaktifkan/dinonaktifkan dan diberi nilai env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // atau string plaintext
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

Catatan: jika nama skill mengandung tanda hubung, beri tanda kutip pada kuncinya (JSON5 mengizinkan kunci bertanda kutip).

Jika Anda menginginkan pembuatan/editing gambar bawaan di dalam OpenClaw itu sendiri, gunakan
tool inti `image_generate` dengan `agents.defaults.imageGenerationModel`, bukan skill
bawaan. Contoh skill di sini ditujukan untuk alur kustom atau pihak ketiga.

Untuk analisis gambar native, gunakan tool `image` dengan `agents.defaults.imageModel`.
Untuk pembuatan/editing gambar native, gunakan `image_generate` dengan
`agents.defaults.imageGenerationModel`. Jika Anda memilih model gambar khusus provider seperti `openai/*`, `google/*`,
`fal/*`, atau lainnya, tambahkan juga autentikasi/API key provider tersebut.

Kunci konfigurasi secara default cocok dengan **nama skill**. Jika suatu skill mendefinisikan
`metadata.openclaw.skillKey`, gunakan kunci itu di bawah `skills.entries`.

Aturan:

- `enabled: false` menonaktifkan skill bahkan jika skill tersebut bawaan/terinstal.
- `env`: disuntikkan **hanya jika** variabel tersebut belum disetel di proses.
- `apiKey`: kemudahan untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`.
  Mendukung string plaintext atau objek SecretRef (`{ source, provider, id }`).
- `config`: wadah opsional untuk field khusus per skill; kunci kustom harus berada di sini.
- `allowBundled`: allowlist opsional hanya untuk **Skills bawaan**. Jika disetel, hanya
  Skills bawaan dalam daftar yang memenuhi syarat (skill terkelola/workspace tidak terpengaruh).

## Penyuntikan environment (per run agen)

Ketika sebuah run agen dimulai, OpenClaw:

1. Membaca metadata skill.
2. Menerapkan `skills.entries.<key>.env` atau `skills.entries.<key>.apiKey` ke
   `process.env`.
3. Membangun system prompt dengan Skills yang **memenuhi syarat**.
4. Memulihkan environment asli setelah run selesai.

Ini **dibatasi pada run agen**, bukan environment shell global.

Untuk backend `claude-cli` bawaan, OpenClaw juga mewujudkan snapshot memenuhi syarat yang sama
sebagai plugin Claude Code sementara dan meneruskannya dengan
`--plugin-dir`. Claude Code lalu dapat menggunakan resolver skill native miliknya
sementara OpenClaw tetap mengendalikan prioritas, allowlist per agen, gerbang, dan
penyuntikan env/API key `skills.entries.*`. Backend CLI lain hanya menggunakan
catalog prompt.

## Snapshot sesi (performa)

OpenClaw membuat snapshot Skills yang memenuhi syarat **saat sesi dimulai** dan menggunakan ulang daftar itu untuk giliran berikutnya dalam sesi yang sama. Perubahan pada skill atau konfigurasi berlaku pada sesi baru berikutnya.

Skills juga dapat disegarkan di tengah sesi saat watcher skill diaktifkan atau saat node remote baru yang memenuhi syarat muncul (lihat di bawah). Anggap ini sebagai **hot reload**: daftar yang disegarkan akan digunakan pada giliran agen berikutnya.

Jika allowlist skill agen yang efektif berubah untuk sesi tersebut, OpenClaw
menyegarkan snapshot agar Skills yang terlihat tetap selaras dengan agen saat ini.

## Node macOS remote (gateway Linux)

Jika Gateway berjalan di Linux tetapi **node macOS** terhubung **dengan `system.run` diizinkan** (keamanan persetujuan Exec tidak disetel ke `deny`), OpenClaw dapat memperlakukan skill khusus macOS sebagai memenuhi syarat ketika biner yang diperlukan ada di node tersebut. Agen harus menjalankan skill tersebut melalui tool `exec` dengan `host=node`.

Ini bergantung pada node yang melaporkan dukungan perintahnya dan pada probe bin melalui `system.run`. Jika node macOS kemudian offline, Skills tetap terlihat; pemanggilan mungkin gagal sampai node tersambung kembali.

## Watcher Skills (penyegaran otomatis)

Secara default, OpenClaw memantau folder skill dan menaikkan snapshot Skills ketika file `SKILL.md` berubah. Konfigurasikan ini di bawah `skills.load`:

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

## Dampak token (daftar skill)

Saat Skills memenuhi syarat, OpenClaw menyisipkan daftar XML ringkas dari Skills yang tersedia ke dalam system prompt (melalui `formatSkillsForPrompt` di `pi-coding-agent`). Biayanya deterministik:

- **Overhead dasar (hanya saat ≥1 skill):** 195 karakter.
- **Per skill:** 97 karakter + panjang nilai `<name>`, `<description>`, dan `<location>` yang sudah di-escape XML.

Rumus (karakter):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Catatan:

- XML escaping memperluas `& < > " '` menjadi entity (`&amp;`, `&lt;`, dll.), sehingga panjangnya bertambah.
- Jumlah token bervariasi menurut tokenizer model. Estimasi kasar gaya OpenAI adalah ~4 karakter/token, jadi **97 karakter ≈ 24 token** per skill ditambah panjang field sebenarnya.

## Siklus hidup Skills terkelola

OpenClaw menyertakan sekumpulan dasar skill sebagai **Skills bawaan** sebagai bagian dari
instalasi (paket npm atau OpenClaw.app). `~/.openclaw/skills` ada untuk override lokal
(misalnya, mem-pin/mem-patch skill tanpa mengubah salinan bawaan).
Skills workspace dimiliki pengguna dan menimpa keduanya saat terjadi konflik nama.

## Referensi konfigurasi

Lihat [Skills config](/id/tools/skills-config) untuk skema konfigurasi lengkap.

## Mencari lebih banyak skill?

Jelajahi [https://clawhub.ai](https://clawhub.ai).

---

## Terkait

- [Creating Skills](/id/tools/creating-skills) — membangun Skills kustom
- [Skills Config](/id/tools/skills-config) — referensi konfigurasi skill
- [Slash Commands](/id/tools/slash-commands) — semua perintah slash yang tersedia
- [Plugins](/id/tools/plugin) — ikhtisar sistem plugin
