---
read_when:
    - Menambahkan atau memodifikasi skill
    - Mengubah gating skill atau aturan pemuatan
summary: 'Skills: terkelola vs workspace, aturan gating, dan wiring config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-05T14:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb0e2e7c2ff50cf19c759ea1da1fd1886dc11f94adc77cbfd816009f75d93ee
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw menggunakan folder skill yang **kompatibel dengan [AgentSkills](https://agentskills.io)** untuk mengajarkan agen cara menggunakan tool. Setiap skill adalah direktori yang berisi `SKILL.md` dengan frontmatter YAML dan instruksi. OpenClaw memuat **bundled Skills** ditambah override lokal opsional, lalu memfilternya saat waktu muat berdasarkan environment, config, dan keberadaan binary.

## Lokasi dan prioritas

OpenClaw memuat skill dari sumber-sumber berikut:

1. **Folder skill tambahan**: dikonfigurasi dengan `skills.load.extraDirs`
2. **Bundled Skills**: dikirim bersama instalasi (paket npm atau OpenClaw.app)
3. **Skill terkelola/lokal**: `~/.openclaw/skills`
4. **Skill agen personal**: `~/.agents/skills`
5. **Skill agen proyek**: `<workspace>/.agents/skills`
6. **Skill workspace**: `<workspace>/skills`

Jika nama skill bertabrakan, prioritasnya adalah:

`<workspace>/skills` (tertinggi) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled skills → `skills.load.extraDirs` (terendah)

## Skill per agen vs bersama

Dalam penyiapan **multi-agent**, setiap agen memiliki workspace-nya sendiri. Artinya:

- **Skill per agen** berada di `<workspace>/skills` hanya untuk agen tersebut.
- **Skill agen proyek** berada di `<workspace>/.agents/skills` dan berlaku untuk
  workspace tersebut sebelum folder `skills/` workspace normal.
- **Skill agen personal** berada di `~/.agents/skills` dan berlaku lintas
  workspace pada mesin tersebut.
- **Skill bersama** berada di `~/.openclaw/skills` (terkelola/lokal) dan terlihat
  oleh **semua agen** pada mesin yang sama.
- **Folder bersama** juga dapat ditambahkan melalui `skills.load.extraDirs` (prioritas
  terendah) jika Anda ingin satu paket skill umum yang digunakan oleh beberapa agen.

Jika nama skill yang sama ada di lebih dari satu tempat, prioritas biasa
tetap berlaku: workspace menang, lalu skill agen proyek, lalu skill agen personal,
lalu terkelola/lokal, lalu bundled, lalu extra dirs.

## Allowlist skill agen

**Lokasi** skill dan **visibilitas** skill adalah dua kontrol yang terpisah.

- Lokasi/prioritas menentukan salinan mana dari skill dengan nama yang sama yang menang.
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
      { id: "locked-down", skills: [] }, // tanpa skill
    ],
  },
}
```

Aturan:

- Hilangkan `agents.defaults.skills` untuk skill tak dibatasi secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
- Setel `agents.list[].skills: []` untuk tanpa skill.
- Daftar `agents.list[].skills` yang tidak kosong adalah set akhir untuk agen tersebut; daftar itu
  tidak digabungkan dengan default.

OpenClaw menerapkan set skill agen efektif di seluruh pembangunan prompt, penemuan slash command skill, sinkronisasi sandbox, dan snapshot skill.

## Plugins + skills

Plugin dapat mengirim skill mereka sendiri dengan mencantumkan direktori `skills` di
`openclaw.plugin.json` (path relatif terhadap root plugin). Skill plugin dimuat
saat plugin diaktifkan. Saat ini direktori tersebut digabungkan ke jalur
berprioritas rendah yang sama dengan `skills.load.extraDirs`, sehingga bundled,
managed, agent, atau workspace skill dengan nama yang sama akan mengoverride-nya.
Anda dapat mengaturnya dengan `metadata.openclaw.requires.config` pada entri config plugin.
Lihat [Plugins](/tools/plugin) untuk discovery/config dan [Tools](/tools) untuk
permukaan tool yang diajarkan skill tersebut.

## ClawHub (instal + sinkronisasi)

ClawHub adalah registry skill publik untuk OpenClaw. Jelajahi di
[https://clawhub.ai](https://clawhub.ai). Gunakan perintah native `openclaw skills`
untuk menemukan/menginstal/memperbarui skill, atau CLI `clawhub` terpisah saat
Anda memerlukan alur kerja publish/sinkronisasi.
Panduan lengkap: [ClawHub](/tools/clawhub).

Alur umum:

- Instal skill ke workspace Anda:
  - `openclaw skills install <skill-slug>`
- Perbarui semua skill yang terinstal:
  - `openclaw skills update --all`
- Sinkronkan (pindai + publikasikan pembaruan):
  - `clawhub sync --all`

`openclaw skills install` native menginstal ke direktori `skills/` workspace aktif. CLI `clawhub` terpisah juga menginstal ke `./skills` di bawah
direktori kerja Anda saat ini (atau fallback ke workspace OpenClaw yang dikonfigurasi).
OpenClaw akan mengambilnya sebagai `<workspace>/skills` pada sesi berikutnya.

## Catatan keamanan

- Perlakukan skill pihak ketiga sebagai **kode tak tepercaya**. Baca sebelum mengaktifkannya.
- Pilih proses sandboxed untuk input tak tepercaya dan tool berisiko. Lihat [Sandboxing](/id/gateway/sandboxing).
- Discovery skill workspace dan extra-dir hanya menerima root skill dan file `SKILL.md` yang realpath hasil resolusinya tetap berada di dalam root yang dikonfigurasi.
- Instal dependensi skill yang didukung Gateway (`skills.install`, onboarding, dan UI pengaturan Skills) menjalankan pemindai kode berbahaya bawaan sebelum mengeksekusi metadata installer. Temuan `critical` memblokir secara default kecuali pemanggil secara eksplisit menyetel dangerous override; temuan mencurigakan tetap hanya berupa peringatan.
- `openclaw skills install <slug>` berbeda: perintah itu mengunduh folder skill ClawHub ke workspace dan tidak menggunakan jalur metadata installer di atas.
- `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan rahasia ke proses **host**
  untuk giliran agen tersebut (bukan sandbox). Jauhkan rahasia dari prompt dan log.
- Untuk threat model dan checklist yang lebih luas, lihat [Security](/id/gateway/security).

## Format (AgentSkills + kompatibel Pi)

`SKILL.md` minimal harus menyertakan:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Catatan:

- Kami mengikuti spesifikasi AgentSkills untuk tata letak/tujuan.
- Parser yang digunakan oleh agen tersemat mendukung kunci frontmatter **satu baris** saja.
- `metadata` harus berupa **objek JSON satu baris**.
- Gunakan `{baseDir}` dalam instruksi untuk merujuk ke path folder skill.
- Kunci frontmatter opsional:
  - `homepage` — URL yang ditampilkan sebagai “Website” di UI Skills macOS (juga didukung melalui `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (default: `true`). Saat `true`, skill diekspos sebagai slash command pengguna.
  - `disable-model-invocation` — `true|false` (default: `false`). Saat `true`, skill dikecualikan dari prompt model (tetap tersedia melalui pemanggilan pengguna).
  - `command-dispatch` — `tool` (opsional). Saat disetel ke `tool`, slash command melewati model dan langsung dikirim ke tool.
  - `command-tool` — nama tool yang dipanggil saat `command-dispatch: tool` disetel.
  - `command-arg-mode` — `raw` (default). Untuk dispatch tool, meneruskan string argumen mentah ke tool (tanpa parsing inti).

    Tool dipanggil dengan params:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filter saat waktu muat)

OpenClaw **memfilter skill saat waktu muat** menggunakan `metadata` (JSON satu baris):

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

- `always: true` — selalu sertakan skill (lewati gate lain).
- `emoji` — emoji opsional yang digunakan oleh UI Skills macOS.
- `homepage` — URL opsional yang ditampilkan sebagai “Website” di UI Skills macOS.
- `os` — daftar platform opsional (`darwin`, `linux`, `win32`). Jika disetel, skill hanya memenuhi syarat pada OS tersebut.
- `requires.bins` — daftar; masing-masing harus ada di `PATH`.
- `requires.anyBins` — daftar; setidaknya satu harus ada di `PATH`.
- `requires.env` — daftar; env var harus ada **atau** disediakan di config.
- `requires.config` — daftar path `openclaw.json` yang harus truthy.
- `primaryEnv` — nama env var yang terkait dengan `skills.entries.<name>.apiKey`.
- `install` — array spesifikasi installer opsional yang digunakan oleh UI Skills macOS (brew/node/go/uv/download).

Catatan tentang sandboxing:

- `requires.bins` diperiksa pada **host** saat waktu muat skill.
- Jika agen disandbox, binary juga harus ada **di dalam container**.
  Instal melalui `agents.defaults.sandbox.docker.setupCommand` (atau image kustom).
  `setupCommand` berjalan sekali setelah container dibuat.
  Instal paket juga memerlukan network egress, root FS yang dapat ditulis, dan pengguna root di sandbox.
  Contoh: skill `summarize` (`skills/summarize/SKILL.md`) memerlukan CLI `summarize`
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

- Jika beberapa installer dicantumkan, gateway memilih **satu** opsi yang diutamakan (brew bila tersedia, jika tidak node).
- Jika semua installer adalah `download`, OpenClaw mencantumkan setiap entri agar Anda dapat melihat artefak yang tersedia.
- Spesifikasi installer dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter opsi menurut platform.
- Instal node menghormati `skills.install.nodeManager` di `openclaw.json` (default: npm; opsi: npm/pnpm/yarn/bun).
  Ini hanya memengaruhi **instalasi skill**; runtime Gateway tetap harus Node
  (Bun tidak direkomendasikan untuk WhatsApp/Telegram).
- Pemilihan installer yang didukung Gateway didasarkan pada preferensi, bukan hanya node:
  ketika spesifikasi instalasi mencampur beberapa jenis, OpenClaw lebih memilih Homebrew saat
  `skills.install.preferBrew` diaktifkan dan `brew` ada, lalu `uv`, lalu
  node manager yang dikonfigurasi, lalu fallback lain seperti `go` atau `download`.
- Jika setiap spesifikasi instal adalah `download`, OpenClaw menampilkan semua opsi download
  alih-alih meringkasnya menjadi satu installer yang diutamakan.
- Instal Go: jika `go` tidak ada dan `brew` tersedia, gateway terlebih dahulu menginstal Go melalui Homebrew dan menyetel `GOBIN` ke `bin` milik Homebrew bila memungkinkan.
- Instal download: `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (default: otomatis saat arsip terdeteksi), `stripComponents`, `targetDir` (default: `~/.openclaw/tools/<skillKey>`).

Jika tidak ada `metadata.openclaw`, skill selalu memenuhi syarat (kecuali
dinonaktifkan di config atau diblokir oleh `skills.allowBundled` untuk bundled skills).

## Override config (`~/.openclaw/openclaw.json`)

Bundled/managed skills dapat diaktifkan/dinonaktifkan dan diberi nilai env:

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

Catatan: jika nama skill mengandung tanda hubung, beri tanda kutip pada kuncinya (JSON5 mengizinkan kunci yang diberi tanda kutip).

Jika Anda menginginkan pembuatan/penyuntingan gambar stok di dalam OpenClaw itu sendiri, gunakan tool inti
`image_generate` dengan `agents.defaults.imageGenerationModel` alih-alih
bundled skill. Contoh skill di sini ditujukan untuk alur kerja kustom atau pihak ketiga.

Untuk analisis gambar native, gunakan tool `image` dengan `agents.defaults.imageModel`.
Untuk pembuatan/penyuntingan gambar native, gunakan `image_generate` dengan
`agents.defaults.imageGenerationModel`. Jika Anda memilih `openai/*`, `google/*`,
`fal/*`, atau model gambar khusus penyedia lainnya, tambahkan juga autentikasi/kunci API penyedia tersebut.

Kunci config cocok dengan **nama skill** secara default. Jika sebuah skill mendefinisikan
`metadata.openclaw.skillKey`, gunakan kunci itu di bawah `skills.entries`.

Aturan:

- `enabled: false` menonaktifkan skill meskipun skill itu bundled/terinstal.
- `env`: disuntikkan **hanya jika** variabel tersebut belum disetel dalam proses.
- `apiKey`: kemudahan untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`.
  Mendukung string plaintext atau objek SecretRef (`{ source, provider, id }`).
- `config`: kantong opsional untuk field kustom per skill; kunci kustom harus berada di sini.
- `allowBundled`: allowlist opsional untuk **bundled** skills saja. Jika disetel, hanya
  bundled skills dalam daftar yang memenuhi syarat (managed/workspace skills tidak terpengaruh).

## Injeksi environment (per proses agen)

Saat proses agen dimulai, OpenClaw:

1. Membaca metadata skill.
2. Menerapkan `skills.entries.<key>.env` atau `skills.entries.<key>.apiKey` ke
   `process.env`.
3. Membangun prompt sistem dengan skill yang **memenuhi syarat**.
4. Memulihkan environment asli setelah proses berakhir.

Ini **dibatasi pada proses agen**, bukan environment shell global.

## Snapshot sesi (performa)

OpenClaw membuat snapshot skill yang memenuhi syarat **saat sesi dimulai** dan menggunakan kembali daftar itu untuk giliran berikutnya dalam sesi yang sama. Perubahan pada skill atau config berlaku pada sesi baru berikutnya.

Skill juga dapat disegarkan di tengah sesi saat watcher skill diaktifkan atau saat node jarak jauh baru yang memenuhi syarat muncul (lihat di bawah). Anggap ini sebagai **hot reload**: daftar yang disegarkan diambil pada giliran agen berikutnya.

Jika allowlist skill agen efektif berubah untuk sesi itu, OpenClaw
menyegarkan snapshot agar skill yang terlihat tetap selaras dengan agen saat ini.

## Node macOS jarak jauh (gateway Linux)

Jika Gateway berjalan di Linux tetapi **node macOS** terhubung **dengan `system.run` diizinkan** (keamanan persetujuan Exec tidak disetel ke `deny`), OpenClaw dapat memperlakukan skill khusus macOS sebagai memenuhi syarat ketika binary yang diperlukan ada pada node tersebut. Agen sebaiknya mengeksekusi skill tersebut melalui tool `exec` dengan `host=node`.

Ini bergantung pada node yang melaporkan dukungan perintahnya dan pada probe bin melalui `system.run`. Jika node macOS kemudian offline, skill tetap terlihat; pemanggilan dapat gagal sampai node tersambung kembali.

## Watcher skill (penyegaran otomatis)

Secara default, OpenClaw memantau folder skill dan meningkatkan snapshot skill saat file `SKILL.md` berubah. Konfigurasikan ini di bawah `skills.load`:

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

Saat skill memenuhi syarat, OpenClaw menyuntikkan daftar XML ringkas berisi skill yang tersedia ke dalam prompt sistem (melalui `formatSkillsForPrompt` di `pi-coding-agent`). Biayanya deterministik:

- **Overhead dasar (hanya saat ≥1 skill):** 195 karakter.
- **Per skill:** 97 karakter + panjang nilai `<name>`, `<description>`, dan `<location>` yang di-escape XML.

Rumus (karakter):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Catatan:

- XML escaping memperluas `& < > " '` menjadi entitas (`&amp;`, `&lt;`, dll.), sehingga panjang bertambah.
- Jumlah token bervariasi menurut tokenizer model. Perkiraan kasar bergaya OpenAI adalah ~4 karakter/token, jadi **97 karakter ≈ 24 token** per skill ditambah panjang field aktual Anda.

## Siklus hidup managed skills

OpenClaw mengirim sekumpulan skill baseline sebagai **bundled Skills** sebagai bagian dari
instalasi (paket npm atau OpenClaw.app). `~/.openclaw/skills` ada untuk
override lokal (misalnya, mem-pin/menambal skill tanpa mengubah salinan bundled).
Skill workspace dimiliki pengguna dan mengoverride keduanya saat nama bertabrakan.

## Referensi config

Lihat [Config Skills](/tools/skills-config) untuk skema konfigurasi lengkap.

## Mencari lebih banyak skill?

Jelajahi [https://clawhub.ai](https://clawhub.ai).

---

## Terkait

- [Membuat Skills](/tools/creating-skills) — membangun skill kustom
- [Config Skills](/tools/skills-config) — referensi konfigurasi skill
- [Slash Commands](/tools/slash-commands) — semua slash command yang tersedia
- [Plugins](/tools/plugin) — gambaran umum sistem plugin
