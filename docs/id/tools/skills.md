---
read_when:
    - Menambahkan atau memodifikasi Skills
    - Changing skill gating or load rules
summary: 'Skills: terkelola vs workspace, aturan gating, dan wiring config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-24T09:33:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

Skills menggunakan folder skill yang kompatibel dengan **[AgentSkills](https://agentskills.io)** untuk mengajarkan agen cara menggunakan alat. Setiap skill adalah direktori yang berisi `SKILL.md` dengan frontmatter YAML dan instruksi. OpenClaw memuat **Skills bawaan** plus override lokal opsional, dan memfilternya saat waktu pemuatan berdasarkan environment, config, dan keberadaan biner.

## Lokasi dan prioritas

OpenClaw memuat Skills dari sumber-sumber ini:

1. **Folder skill tambahan**: dikonfigurasi dengan `skills.load.extraDirs`
2. **Skills bawaan**: dikirim bersama instalasi (paket npm atau OpenClaw.app)
3. **Skills terkelola/lokal**: `~/.openclaw/skills`
4. **Skills agen pribadi**: `~/.agents/skills`
5. **Skills agen proyek**: `<workspace>/.agents/skills`
6. **Skills workspace**: `<workspace>/skills`

Jika ada konflik nama skill, prioritasnya adalah:

`<workspace>/skills` (tertinggi) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills bawaan → `skills.load.extraDirs` (terendah)

## Skills per-agen vs bersama

Dalam penyiapan **multi-agen**, setiap agen memiliki workspace sendiri. Artinya:

- **Skills per-agen** berada di `<workspace>/skills` hanya untuk agen tersebut.
- **Skills agen proyek** berada di `<workspace>/.agents/skills` dan berlaku untuk
  workspace itu sebelum folder `skills/` workspace normal.
- **Skills agen pribadi** berada di `~/.agents/skills` dan berlaku lintas
  workspace pada mesin tersebut.
- **Skills bersama** berada di `~/.openclaw/skills` (terkelola/lokal) dan terlihat
  oleh **semua agen** pada mesin yang sama.
- **Folder bersama** juga dapat ditambahkan melalui `skills.load.extraDirs` (prioritas terendah) jika Anda ingin satu paket Skills umum yang digunakan oleh beberapa agen.

Jika nama skill yang sama ada di lebih dari satu tempat, prioritas biasa
tetap berlaku: workspace menang, lalu Skills agen proyek, kemudian Skills agen pribadi,
kemudian terkelola/lokal, lalu bawaan, lalu direktori tambahan.

## Allowlists skill agen

**Lokasi** skill dan **visibilitas** skill adalah kontrol yang terpisah.

- Lokasi/prioritas menentukan salinan skill bernama sama mana yang menang.
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

- Hilangkan `agents.defaults.skills` agar Skills tidak dibatasi secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
- Setel `agents.list[].skills: []` agar agen **tidak memiliki Skills**.
- Daftar `agents.list[].skills` yang tidak kosong adalah himpunan final untuk agen tersebut; daftar ini tidak digabungkan dengan default.

OpenClaw menerapkan himpunan skill agen yang efektif di seluruh pembangunan prompt,
penemuan slash-command skill, sinkronisasi sandbox, dan snapshot skill.

## Plugins + Skills

Plugins dapat mengirim Skills mereka sendiri dengan mencantumkan direktori `skills` di
`openclaw.plugin.json` (path relatif terhadap root Plugin). Skill Plugin dimuat
saat Plugin diaktifkan. Saat ini direktori tersebut digabungkan ke path
berprioritas rendah yang sama seperti `skills.load.extraDirs`, sehingga skill bawaan, terkelola,
agen, atau workspace yang bernama sama akan menimpanya.
Anda dapat mengendalikan ini melalui `metadata.openclaw.requires.config` pada entri config Plugin.
Lihat [Plugins](/id/tools/plugin) untuk discovery/config dan [Tools](/id/tools) untuk permukaan
alat yang diajarkan oleh skill tersebut.

## Skill Workshop

Plugin Skill Workshop yang opsional dan eksperimental dapat membuat atau memperbarui Skills workspace
dari prosedur yang dapat digunakan ulang yang diamati selama pekerjaan agen. Plugin ini nonaktif
secara default dan harus diaktifkan secara eksplisit melalui
`plugins.entries.skill-workshop`.

Skill Workshop hanya menulis ke `<workspace>/skills`, memindai konten yang dihasilkan,
mendukung persetujuan tertunda atau penulisan aman otomatis, mengarantina
proposal yang tidak aman, dan me-refresh snapshot skill setelah penulisan berhasil sehingga skill baru
dapat tersedia tanpa restart Gateway.

Gunakan ketika Anda ingin koreksi seperti “lain kali, verifikasi atribusi GIF” atau
alur kerja yang susah didapat seperti checklist QA media menjadi instruksi prosedural
yang tahan lama. Mulai dengan persetujuan tertunda; gunakan penulisan otomatis hanya di
workspace tepercaya setelah meninjau proposalnya. Panduan lengkap:
[Skill Workshop Plugin](/id/plugins/skill-workshop).

## ClawHub (instal + sinkronisasi)

ClawHub adalah registry Skills publik untuk OpenClaw. Jelajahi di
[https://clawhub.ai](https://clawhub.ai). Gunakan perintah native `openclaw skills`
untuk menemukan/memasang/memperbarui Skills, atau CLI `clawhub` terpisah ketika
Anda memerlukan alur publish/sinkronisasi.
Panduan lengkap: [ClawHub](/id/tools/clawhub).

Alur umum:

- Instal skill ke workspace Anda:
  - `openclaw skills install <skill-slug>`
- Perbarui semua skill yang terinstal:
  - `openclaw skills update --all`
- Sinkronkan (scan + publish pembaruan):
  - `clawhub sync --all`

`openclaw skills install` native menginstal ke direktori `skills/`
workspace aktif. CLI `clawhub` terpisah juga menginstal ke `./skills` di bawah
direktori kerja saat ini (atau fallback ke workspace OpenClaw yang dikonfigurasi).
OpenClaw akan mengambilnya sebagai `<workspace>/skills` pada sesi berikutnya.

## Catatan keamanan

- Perlakukan skill pihak ketiga sebagai **kode tidak tepercaya**. Baca sebelum mengaktifkannya.
- Pilih run yang disandbox untuk input tidak tepercaya dan alat berisiko. Lihat [Sandboxing](/id/gateway/sandboxing).
- Penemuan skill workspace dan extra-dir hanya menerima root skill dan file `SKILL.md` yang realpath hasil resolusinya tetap berada di dalam root yang dikonfigurasi.
- Instalasi dependensi skill yang didukung Gateway (`skills.install`, onboarding, dan UI pengaturan Skills) menjalankan scanner kode berbahaya bawaan sebelum mengeksekusi metadata installer. Temuan `critical` memblokir secara default kecuali pemanggil secara eksplisit menyetel override berbahaya; temuan mencurigakan tetap hanya memberi peringatan.
- `openclaw skills install <slug>` berbeda: perintah ini mengunduh folder skill ClawHub ke workspace dan tidak menggunakan jalur metadata installer di atas.
- `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan secret ke proses **host**
  untuk giliran agen tersebut (bukan ke sandbox). Jauhkan secret dari prompt dan log.
- Untuk model ancaman dan checklist yang lebih luas, lihat [Security](/id/gateway/security).

## Format (AgentSkills + kompatibel Pi)

`SKILL.md` setidaknya harus menyertakan:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Catatan:

- Kami mengikuti spesifikasi AgentSkills untuk tata letak/tujuan.
- Parser yang digunakan oleh agen tersemat hanya mendukung kunci frontmatter **satu baris**.
- `metadata` harus berupa **objek JSON satu baris**.
- Gunakan `{baseDir}` dalam instruksi untuk mereferensikan path folder skill.
- Kunci frontmatter opsional:
  - `homepage` — URL yang ditampilkan sebagai “Website” di UI Skills macOS (juga didukung melalui `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (default: `true`). Saat `true`, skill diekspos sebagai slash command pengguna.
  - `disable-model-invocation` — `true|false` (default: `false`). Saat `true`, skill dikecualikan dari prompt model (tetap tersedia melalui pemanggilan pengguna).
  - `command-dispatch` — `tool` (opsional). Saat disetel ke `tool`, slash command melewati model dan mengirim langsung ke alat.
  - `command-tool` — nama alat yang dipanggil saat `command-dispatch: tool` disetel.
  - `command-arg-mode` — `raw` (default). Untuk dispatch alat, meneruskan string arg mentah ke alat (tanpa parsing core).

    Alat dipanggil dengan parameter:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filter saat pemuatan)

OpenClaw **memfilter Skills saat waktu pemuatan** menggunakan `metadata` (JSON satu baris):

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

Field di bawah `metadata.openclaw`:

- `always: true` — selalu sertakan skill (lewati gating lain).
- `emoji` — emoji opsional yang digunakan oleh UI Skills macOS.
- `homepage` — URL opsional yang ditampilkan sebagai “Website” di UI Skills macOS.
- `os` — daftar platform opsional (`darwin`, `linux`, `win32`). Jika disetel, skill hanya memenuhi syarat pada OS tersebut.
- `requires.bins` — daftar; masing-masing harus ada di `PATH`.
- `requires.anyBins` — daftar; setidaknya satu harus ada di `PATH`.
- `requires.env` — daftar; var env harus ada **atau** disediakan di config.
- `requires.config` — daftar path `openclaw.json` yang harus truthy.
- `primaryEnv` — nama var env yang diasosiasikan dengan `skills.entries.<name>.apiKey`.
- `install` — array spesifikasi installer opsional yang digunakan oleh UI Skills macOS (brew/node/go/uv/download).

Catatan tentang sandboxing:

- `requires.bins` diperiksa pada **host** saat waktu pemuatan skill.
- Jika sebuah agen disandbox, biner tersebut juga harus ada **di dalam container**.
  Instal melalui `agents.defaults.sandbox.docker.setupCommand` (atau image kustom).
  `setupCommand` berjalan sekali setelah container dibuat.
  Instalasi package juga memerlukan network egress, root FS yang dapat ditulis, dan pengguna root di sandbox.
  Contoh: skill `summarize` (`skills/summarize/SKILL.md`) membutuhkan CLI `summarize`
  di container sandbox agar dapat berjalan di sana.

Contoh installer:

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

Catatan:

- Jika beberapa installer tercantum, gateway memilih **satu** opsi pilihan (brew saat tersedia, jika tidak node).
- Jika semua installer adalah `download`, OpenClaw mencantumkan setiap entri agar Anda dapat melihat artefak yang tersedia.
- Spesifikasi installer dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter opsi berdasarkan platform.
- Instalasi Node menghormati `skills.install.nodeManager` di `openclaw.json` (default: npm; opsi: npm/pnpm/yarn/bun).
  Ini hanya memengaruhi **instalasi skill**; runtime Gateway tetap seharusnya Node
  (Bun tidak direkomendasikan untuk WhatsApp/Telegram).
- Pemilihan installer yang didukung Gateway berbasis preferensi, bukan hanya node:
  ketika spesifikasi instalasi mencampur beberapa jenis, OpenClaw memilih Homebrew jika
  `skills.install.preferBrew` diaktifkan dan `brew` ada, lalu `uv`, lalu
  node manager yang dikonfigurasi, lalu fallback lain seperti `go` atau `download`.
- Jika setiap spesifikasi instalasi adalah `download`, OpenClaw menampilkan semua opsi unduhan
  alih-alih meruntuhkannya menjadi satu installer pilihan.
- Instalasi Go: jika `go` tidak ada dan `brew` tersedia, gateway menginstal Go via Homebrew terlebih dahulu dan menyetel `GOBIN` ke `bin` Homebrew bila memungkinkan.
- Instalasi download: `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (default: otomatis saat arsip terdeteksi), `stripComponents`, `targetDir` (default: `~/.openclaw/tools/<skillKey>`).

Jika tidak ada `metadata.openclaw`, skill selalu memenuhi syarat (kecuali
dinonaktifkan di config atau diblokir oleh `skills.allowBundled` untuk Skills bawaan).

## Override config (`~/.openclaw/openclaw.json`)

Skills bawaan/terkelola dapat di-toggle dan diberi nilai env:

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

Catatan: jika nama skill mengandung tanda hubung, beri tanda kutip pada kuncinya (JSON5 mengizinkan kunci yang dikutip).

Jika Anda menginginkan generasi/edit gambar bawaan di dalam OpenClaw sendiri, gunakan alat inti
`image_generate` dengan `agents.defaults.imageGenerationModel` alih-alih skill
bawaan. Contoh skill di sini ditujukan untuk alur kerja kustom atau pihak ketiga.

Untuk analisis gambar native, gunakan alat `image` dengan `agents.defaults.imageModel`.
Untuk generasi/edit gambar native, gunakan `image_generate` dengan
`agents.defaults.imageGenerationModel`. Jika Anda memilih model gambar `openai/*`, `google/*`,
`fal/*`, atau model gambar khusus provider lain, tambahkan auth/API
key provider tersebut juga.

Kunci config secara default cocok dengan **nama skill**. Jika sebuah skill mendefinisikan
`metadata.openclaw.skillKey`, gunakan kunci tersebut di bawah `skills.entries`.

Aturan:

- `enabled: false` menonaktifkan skill meskipun skill itu bawaan/terinstal.
- `env`: disuntikkan **hanya jika** variabel tersebut belum disetel di proses.
- `apiKey`: kemudahan untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`.
  Mendukung string plaintext atau objek SecretRef (`{ source, provider, id }`).
- `config`: bag opsional untuk field khusus per-skill; kunci kustom harus hidup di sini.
- `allowBundled`: allowlist opsional untuk **Skills bawaan** saja. Jika disetel, hanya
  Skills bawaan dalam daftar yang memenuhi syarat (skill terkelola/workspace tidak terpengaruh).

## Injeksi environment (per run agen)

Saat sebuah run agen dimulai, OpenClaw:

1. Membaca metadata skill.
2. Menerapkan `skills.entries.<key>.env` atau `skills.entries.<key>.apiKey` ke
   `process.env`.
3. Membangun prompt sistem dengan Skills yang **memenuhi syarat**.
4. Memulihkan environment asli setelah run berakhir.

Ini **dibatasi ke run agen**, bukan environment shell global.

Untuk backend `claude-cli` bawaan, OpenClaw juga mematerialisasikan snapshot yang sama
ke Plugin Claude Code sementara dan meneruskannya dengan
`--plugin-dir`. Claude Code kemudian dapat menggunakan resolver skill native-nya
sementara OpenClaw tetap memiliki prioritas, allowlist per-agen, gating, dan
injeksi env/API key `skills.entries.*`. Backend CLI lain hanya menggunakan katalog prompt.

## Snapshot sesi (performa)

OpenClaw mengambil snapshot skill yang memenuhi syarat **saat sesi dimulai** dan menggunakan kembali daftar tersebut untuk giliran berikutnya dalam sesi yang sama. Perubahan pada skill atau config berlaku pada sesi baru berikutnya.

Skills juga dapat me-refresh di tengah sesi saat watcher skill diaktifkan atau saat Node remote baru yang memenuhi syarat muncul (lihat di bawah). Anggap ini sebagai **hot reload**: daftar yang telah di-refresh diambil pada giliran agen berikutnya.

Jika allowlist skill agen yang efektif berubah untuk sesi tersebut, OpenClaw
me-refresh snapshot agar Skills yang terlihat tetap selaras dengan agen saat ini.

## Node macOS remote (Gateway Linux)

Jika Gateway berjalan di Linux tetapi sebuah **Node macOS** terhubung **dengan `system.run` diizinkan** (keamanan persetujuan Exec tidak disetel ke `deny`), OpenClaw dapat memperlakukan skill khusus macOS sebagai memenuhi syarat ketika biner yang diperlukan ada di Node tersebut. Agen seharusnya mengeksekusi skill itu melalui alat `exec` dengan `host=node`.

Ini bergantung pada Node yang melaporkan dukungan perintahnya dan pada probe bin melalui `system.run`. Jika Node macOS kemudian offline, skill tetap terlihat; pemanggilan mungkin gagal sampai Node terhubung kembali.

## Watcher Skills (refresh otomatis)

Secara default, OpenClaw memantau folder skill dan menaikkan snapshot Skills saat file `SKILL.md` berubah. Konfigurasikan ini di bawah `skills.load`:

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

Saat Skills memenuhi syarat, OpenClaw menyuntikkan daftar XML ringkas dari Skills yang tersedia ke prompt sistem (melalui `formatSkillsForPrompt` di `pi-coding-agent`). Biayanya deterministik:

- **Overhead dasar (hanya saat ≥1 skill):** 195 karakter.
- **Per skill:** 97 karakter + panjang nilai XML-escaped `<name>`, `<description>`, dan `<location>`.

Rumus (karakter):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Catatan:

- XML escaping memperluas `& < > " '` menjadi entitas (`&amp;`, `&lt;`, dll.), sehingga menambah panjang.
- Jumlah token bervariasi menurut tokenizer model. Estimasi kasar bergaya OpenAI adalah ~4 karakter/token, jadi **97 karakter ≈ 24 token** per skill ditambah panjang field Anda yang sebenarnya.

## Siklus hidup Skills terkelola

OpenClaw mengirim seperangkat skill dasar sebagai **Skills bawaan** sebagai bagian dari
instalasi (paket npm atau OpenClaw.app). `~/.openclaw/skills` ada untuk
override lokal (misalnya, mem-pin/mem-patch skill tanpa mengubah salinan
bawaan). Skills workspace dimiliki pengguna dan menimpa keduanya pada konflik nama.

## Referensi config

Lihat [Skills config](/id/tools/skills-config) untuk skema konfigurasi lengkap.

## Mencari lebih banyak Skills?

Jelajahi [https://clawhub.ai](https://clawhub.ai).

---

## Terkait

- [Creating Skills](/id/tools/creating-skills) — membangun skill kustom
- [Skills Config](/id/tools/skills-config) — referensi konfigurasi skill
- [Slash Commands](/id/tools/slash-commands) — semua slash command yang tersedia
- [Plugins](/id/tools/plugin) — ikhtisar sistem Plugin
