---
read_when:
    - Menambahkan atau memodifikasi Skills
    - Mengubah gating Skills, allowlist, atau aturan pemuatan
    - Memahami prioritas Skills dan perilaku snapshot
sidebarTitle: Skills
summary: 'Skills: terkelola vs workspace, aturan gating, allowlist agen, dan wiring konfigurasi'
title: Skills
x-i18n:
    generated_at: "2026-04-26T11:41:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw menggunakan folder skill yang **kompatibel dengan [AgentSkills](https://agentskills.io)** untuk mengajarkan agen cara menggunakan tool. Setiap skill adalah direktori
yang berisi `SKILL.md` dengan frontmatter YAML dan instruksi. OpenClaw
memuat skill bawaan ditambah override lokal opsional, dan memfilternya pada
waktu pemuatan berdasarkan environment, config, dan keberadaan binary.

## Lokasi dan prioritas

OpenClaw memuat skill dari sumber berikut, **prioritas tertinggi terlebih dahulu**:

| #   | Sumber                | Path                             |
| --- | --------------------- | -------------------------------- |
| 1   | Skills workspace      | `<workspace>/skills`             |
| 2   | Skills agen proyek    | `<workspace>/.agents/skills`     |
| 3   | Skills agen personal  | `~/.agents/skills`               |
| 4   | Skills terkelola/lokal | `~/.openclaw/skills`            |
| 5   | Skills bawaan         | dikirim bersama instalasi        |
| 6   | Folder skill tambahan | `skills.load.extraDirs` (config) |

Jika nama skill bertabrakan, sumber dengan prioritas tertinggi yang menang.

## Skills per agen vs bersama

Dalam penyiapan **multi-agen**, setiap agen memiliki workspace sendiri:

| Cakupan              | Path                                        | Terlihat oleh                |
| -------------------- | ------------------------------------------- | ---------------------------- |
| Per agen             | `<workspace>/skills`                        | Hanya agen itu               |
| Agen proyek          | `<workspace>/.agents/skills`                | Hanya agen workspace itu     |
| Agen personal        | `~/.agents/skills`                          | Semua agen di mesin itu      |
| Terkelola/lokal bersama | `~/.openclaw/skills`                    | Semua agen di mesin itu      |
| Direktori tambahan bersama | `skills.load.extraDirs` (prioritas terendah) | Semua agen di mesin itu  |

Nama yang sama di beberapa tempat → sumber dengan prioritas tertinggi yang menang. Workspace mengalahkan
agen proyek, mengalahkan agen personal, mengalahkan terkelola/lokal, mengalahkan bawaan,
mengalahkan direktori tambahan.

## Allowlist skill agen

**Lokasi** skill dan **visibilitas** skill adalah kontrol yang terpisah.
Lokasi/prioritas menentukan salinan skill bernama sama mana yang menang; allowlist
agen menentukan skill mana yang benar-benar dapat digunakan agen.

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

<AccordionGroup>
  <Accordion title="Aturan allowlist">
    - Hilangkan `agents.defaults.skills` agar skill tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
    - Setel `agents.list[].skills: []` untuk tanpa skill.
    - Daftar `agents.list[].skills` yang tidak kosong adalah himpunan **akhir** untuk
      agen tersebut — tidak digabungkan dengan default.
    - Allowlist efektif berlaku di seluruh pembangunan prompt, penemuan
      slash command skill, sinkronisasi sandbox, dan snapshot skill.
  </Accordion>
</AccordionGroup>

## Plugin dan Skills

Plugin dapat mengirim skill mereka sendiri dengan mencantumkan direktori `skills` di
`openclaw.plugin.json` (path relatif terhadap root plugin). Skill plugin
dimuat saat plugin diaktifkan. Ini adalah tempat yang tepat untuk panduan operasional
khusus tool yang terlalu panjang untuk deskripsi tool tetapi seharusnya
tersedia kapan pun plugin dipasang — misalnya, plugin browser
mengirim skill `browser-automation` untuk kontrol browser multi-langkah.

Direktori skill plugin digabungkan ke dalam path prioritas rendah yang sama seperti
`skills.load.extraDirs`, sehingga skill bawaan, terkelola, agen, atau workspace dengan nama yang sama akan mengoverridenya. Anda dapat melakukan gating
melalui `metadata.openclaw.requires.config` pada entri config plugin.

Lihat [Plugins](/id/tools/plugin) untuk penemuan/config dan [Tools](/id/tools) untuk
permukaan tool yang diajarkan skill tersebut.

## Skill Workshop

Plugin **Skill Workshop** yang opsional dan eksperimental dapat membuat atau memperbarui
skill workspace dari prosedur yang dapat digunakan kembali yang diamati selama kerja agen. Plugin ini
dinonaktifkan secara default dan harus diaktifkan secara eksplisit melalui
`plugins.entries.skill-workshop`.

Skill Workshop hanya menulis ke `<workspace>/skills`, memindai
konten yang dihasilkan, mendukung persetujuan tertunda atau penulisan aman otomatis, mengarantina
usulan yang tidak aman, dan menyegarkan snapshot skill setelah penulisan
berhasil agar skill baru tersedia tanpa restart Gateway.

Gunakan untuk koreksi seperti _"lain kali, verifikasi atribusi GIF"_ atau
alur kerja yang susah didapat seperti checklist QA media. Mulailah dengan persetujuan
tertunda; gunakan penulisan otomatis hanya di workspace tepercaya setelah meninjau
usulannya. Panduan lengkap: [plugin Skill Workshop](/id/plugins/skill-workshop).

## ClawHub (pasang dan sinkronkan)

[ClawHub](https://clawhub.ai) adalah registry skill publik untuk OpenClaw.
Gunakan perintah `openclaw skills` native untuk discover/install/update, atau
CLI `clawhub` terpisah untuk alur kerja publish/sync. Panduan lengkap:
[ClawHub](/id/tools/clawhub).

| Aksi                                | Perintah                              |
| ----------------------------------- | ------------------------------------- |
| Pasang skill ke workspace           | `openclaw skills install <skill-slug>` |
| Perbarui semua skill yang terpasang | `openclaw skills update --all`        |
| Sinkronkan (pindai + publikasikan pembaruan) | `clawhub sync --all`         |

`openclaw skills install` native memasang ke direktori aktif workspace
`skills/`. CLI `clawhub` terpisah juga memasang ke
`./skills` di bawah direktori kerja saat ini (atau fallback ke
workspace OpenClaw yang dikonfigurasi). OpenClaw mengambilnya sebagai
`<workspace>/skills` pada sesi berikutnya.

## Keamanan

<Warning>
Perlakukan skill pihak ketiga sebagai **kode tidak tepercaya**. Bacalah sebelum mengaktifkannya.
Pilih proses berjalan yang disandbox untuk input tidak tepercaya dan tool berisiko. Lihat
[Sandboxing](/id/gateway/sandboxing) untuk kontrol di sisi agen.
</Warning>

- Penemuan skill workspace dan direktori tambahan hanya menerima root skill dan file `SKILL.md` yang realpath teresolusinya tetap berada di dalam root yang dikonfigurasi.
- Pemasangan dependensi skill yang didukung Gateway (`skills.install`, onboarding, dan UI pengaturan Skills) menjalankan pemindai kode berbahaya bawaan sebelum mengeksekusi metadata installer. Temuan `critical` memblokir secara default kecuali pemanggil secara eksplisit menyetel override berbahaya; temuan mencurigakan tetap hanya memberi peringatan.
- `openclaw skills install <slug>` berbeda — ini mengunduh folder skill ClawHub ke workspace dan tidak menggunakan path metadata installer di atas.
- `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan secret ke proses **host** untuk giliran agen tersebut (bukan sandbox). Jauhkan secret dari prompt dan log.

Untuk model ancaman dan checklist yang lebih luas, lihat [Keamanan](/id/gateway/security).

## Format SKILL.md

`SKILL.md` setidaknya harus menyertakan:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw mengikuti spesifikasi AgentSkills untuk tata letak/tujuan. Parser yang digunakan
oleh agen tertanam mendukung key frontmatter **satu baris** saja;
`metadata` harus berupa **objek JSON satu baris**. Gunakan `{baseDir}` dalam
instruksi untuk merujuk ke path folder skill.

### Key frontmatter opsional

<ParamField path="homepage" type="string">
  URL yang ditampilkan sebagai "Website" di UI Skills macOS. Juga didukung melalui `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Saat `true`, skill diekspos sebagai slash command pengguna.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Saat `true`, skill dikecualikan dari prompt model (tetap tersedia melalui pemanggilan pengguna).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Saat disetel ke `tool`, slash command melewati model dan langsung mengirim ke tool.
</ParamField>
<ParamField path="command-tool" type="string">
  Nama tool yang dipanggil saat `command-dispatch: tool` disetel.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Untuk pengiriman tool, meneruskan string argumen mentah ke tool (tanpa parsing inti). Tool dipanggil dengan `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filter saat pemuatan)

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

Field di bawah `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Saat `true`, selalu sertakan skill (lewati gate lainnya).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opsional yang digunakan oleh UI Skills macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opsional yang ditampilkan sebagai "Website" di UI Skills macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Daftar platform opsional. Jika disetel, skill hanya memenuhi syarat pada OS tersebut.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Masing-masing harus ada di `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Setidaknya satu harus ada di `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Variabel lingkungan harus ada atau disediakan dalam config.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Daftar path `openclaw.json` yang harus truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nama variabel lingkungan yang terkait dengan `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Spesifikasi installer opsional yang digunakan oleh UI Skills macOS (brew/node/go/uv/download).
</ParamField>

Jika tidak ada `metadata.openclaw`, skill selalu memenuhi syarat (kecuali
dinonaktifkan dalam config atau diblokir oleh `skills.allowBundled` untuk skill bawaan).

<Note>
Blok lama `metadata.clawdbot` masih diterima saat
`metadata.openclaw` tidak ada, sehingga skill lama yang sudah terpasang tetap mempertahankan
gate dependensi dan petunjuk installer mereka. Skill baru dan yang diperbarui sebaiknya menggunakan
`metadata.openclaw`.
</Note>

### Catatan sandbox

- `requires.bins` diperiksa di **host** pada waktu pemuatan skill.
- Jika agen disandbox, binary juga harus ada **di dalam container**. Pasang melalui `agents.defaults.sandbox.docker.setupCommand` (atau image kustom). `setupCommand` berjalan sekali setelah container dibuat. Pemasangan paket juga memerlukan network egress, root FS yang dapat ditulisi, dan pengguna root di sandbox.
- Contoh: skill `summarize` (`skills/summarize/SKILL.md`) memerlukan CLI `summarize` di dalam container sandbox untuk berjalan di sana.

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
  <Accordion title="Aturan pemilihan installer">
    - Jika beberapa installer dicantumkan, gateway memilih satu opsi yang diprioritaskan (brew jika tersedia, jika tidak maka node).
    - Jika semua installer adalah `download`, OpenClaw mencantumkan setiap entri agar Anda dapat melihat artefak yang tersedia.
    - Spesifikasi installer dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter opsi berdasarkan platform.
    - Instalasi node menghormati `skills.install.nodeManager` di `openclaw.json` (default: npm; opsi: npm/pnpm/yarn/bun). Ini hanya memengaruhi instalasi skill; runtime Gateway tetap sebaiknya Node — Bun tidak direkomendasikan untuk WhatsApp/Telegram.
    - Pemilihan installer yang didukung Gateway berbasis preferensi: saat spesifikasi instalasi mencampur beberapa jenis, OpenClaw memprioritaskan Homebrew saat `skills.install.preferBrew` diaktifkan dan `brew` ada, lalu `uv`, lalu node manager yang dikonfigurasi, lalu fallback lain seperti `go` atau `download`.
    - Jika setiap spesifikasi instalasi adalah `download`, OpenClaw menampilkan semua opsi unduhan alih-alih meringkasnya menjadi satu installer yang diprioritaskan.
  </Accordion>
  <Accordion title="Detail per installer">
    - **Instalasi Go:** jika `go` tidak ada dan `brew` tersedia, gateway akan memasang Go melalui Homebrew terlebih dahulu dan menetapkan `GOBIN` ke `bin` Homebrew jika memungkinkan.
    - **Instalasi unduhan:** `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (default: otomatis saat arsip terdeteksi), `stripComponents`, `targetDir` (default: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
</AccordionGroup>

## Override config

Skills bawaan dan terkelola dapat diaktifkan/dinonaktifkan dan diberi nilai env
di bawah `skills.entries` dalam `~/.openclaw/openclaw.json`:

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

<ParamField path="enabled" type="boolean">
  `false` menonaktifkan skill meskipun skill tersebut bawaan atau terpasang.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Kemudahan untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`. Mendukung plaintext atau SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Disuntikkan hanya jika variabel tersebut belum disetel dalam proses.
</ParamField>
<ParamField path="config" type="object">
  Kantong opsional untuk field khusus per-skill kustom. Key kustom harus berada di sini.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist opsional hanya untuk skill **bawaan**. Jika disetel, hanya skill bawaan dalam daftar yang memenuhi syarat (skill terkelola/workspace tidak terpengaruh).
</ParamField>

Jika nama skill mengandung tanda hubung, beri tanda kutip pada key-nya (JSON5 mengizinkan
key yang dikutip). Key config cocok dengan **nama skill** secara default — jika sebuah skill
mendefinisikan `metadata.openclaw.skillKey`, gunakan key tersebut di bawah `skills.entries`.

<Note>
Untuk pembuatan/penyuntingan gambar bawaan di dalam OpenClaw, gunakan tool inti
`image_generate` dengan `agents.defaults.imageGenerationModel` alih-alih
skill bawaan. Contoh skill di sini ditujukan untuk alur kerja kustom atau pihak ketiga.
Untuk analisis gambar native gunakan tool `image` dengan
`agents.defaults.imageModel`. Jika Anda memilih `openai/*`, `google/*`,
`fal/*`, atau model gambar khusus provider lainnya, tambahkan juga
autentikasi/kunci API provider tersebut.
</Note>

## Penyuntikan environment

Saat proses agen dimulai, OpenClaw:

1. Membaca metadata skill.
2. Menerapkan `skills.entries.<key>.env` dan `skills.entries.<key>.apiKey` ke `process.env`.
3. Membangun prompt sistem dengan Skills yang **memenuhi syarat**.
4. Memulihkan environment asli setelah proses berakhir.

Penyuntikan environment **dicakup ke proses agen**, bukan environment shell global.

Untuk backend `claude-cli` bawaan, OpenClaw juga mematerialisasikan snapshot memenuhi syarat yang sama sebagai plugin Claude Code sementara dan meneruskannya dengan
`--plugin-dir`. Claude Code kemudian dapat menggunakan resolver skill native-nya sementara
OpenClaw tetap memiliki prioritas, allowlist per agen, gating, dan
penyuntikan env/kunci API `skills.entries.*`. Backend CLI lain hanya menggunakan
katalog prompt.

## Snapshot dan refresh

OpenClaw membuat snapshot Skills yang memenuhi syarat **saat sesi dimulai** dan
menggunakan kembali daftar tersebut untuk giliran berikutnya dalam sesi yang sama. Perubahan pada
skill atau config berlaku pada sesi baru berikutnya.

Skills dapat di-refresh di tengah sesi dalam dua kasus:

- Watcher skill diaktifkan.
- Node jarak jauh baru yang memenuhi syarat muncul.

Anggap ini sebagai **hot reload**: daftar yang telah diperbarui akan digunakan pada
giliran agen berikutnya. Jika allowlist skill agen efektif berubah untuk
sesi tersebut, OpenClaw me-refresh snapshot agar skill yang terlihat tetap selaras
dengan agen saat ini.

### Watcher skill

Secara default, OpenClaw memantau folder skill dan menaikkan snapshot skill
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

### Node macOS jarak jauh (Gateway Linux)

Jika Gateway berjalan di Linux tetapi **node macOS** terhubung dengan
`system.run` diizinkan (keamanan persetujuan Exec tidak disetel ke `deny`),
OpenClaw dapat memperlakukan skill khusus macOS sebagai memenuhi syarat ketika
binary yang diperlukan ada di node tersebut. Agen sebaiknya mengeksekusi skill tersebut
melalui tool `exec` dengan `host=node`.

Ini bergantung pada node yang melaporkan dukungan perintahnya dan pada probe bin
melalui `system.which` atau `system.run`. Node offline **tidak** membuat
skill khusus-jarak-jauh terlihat. Jika node yang terhubung berhenti menjawab probe bin,
OpenClaw menghapus kecocokan bin yang di-cache sehingga agen tidak lagi melihat
skill yang saat ini tidak dapat dijalankan di sana.

## Dampak token

Saat Skills memenuhi syarat, OpenClaw menyuntikkan daftar XML ringkas dari Skills yang tersedia
ke dalam prompt sistem (melalui `formatSkillsForPrompt` di
`pi-coding-agent`). Biayanya deterministik:

- **Overhead dasar** (hanya saat ≥1 skill): 195 karakter.
- **Per skill:** 97 karakter + panjang nilai `<name>`, `<description>`, dan `<location>` yang telah di-escape XML.

Rumus (karakter):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Escape XML memperluas `& < > " '` menjadi entitas (`&amp;`, `&lt;`, dll.),
sehingga panjangnya bertambah. Jumlah token bervariasi tergantung tokenizer model. Estimasi kasar
gaya OpenAI adalah ~4 karakter/token, jadi **97 karakter ≈ 24 token** per
skill ditambah panjang field Anda yang sebenarnya.

## Siklus hidup skill terkelola

OpenClaw mengirimkan sekumpulan skill dasar sebagai **skill bawaan** bersama
instalasi (paket npm atau OpenClaw.app). `~/.openclaw/skills` ada untuk
override lokal — misalnya, mem-pin atau menambal skill tanpa
mengubah salinan bawaannya. Skill workspace dimiliki pengguna dan mengoverride
keduanya saat nama bertabrakan.

## Mencari lebih banyak Skills?

Jelajahi [https://clawhub.ai](https://clawhub.ai). Skema konfigurasi
lengkap: [Config Skills](/id/tools/skills-config).

## Terkait

- [ClawHub](/id/tools/clawhub) — registry skill publik
- [Membuat Skills](/id/tools/creating-skills) — membangun skill kustom
- [Plugins](/id/tools/plugin) — ikhtisar sistem plugin
- [plugin Skill Workshop](/id/plugins/skill-workshop) — menghasilkan skill dari pekerjaan agen
- [Config Skills](/id/tools/skills-config) — referensi konfigurasi skill
- [Slash commands](/id/tools/slash-commands) — semua slash command yang tersedia
