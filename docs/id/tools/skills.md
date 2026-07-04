---
read_when:
    - Menambahkan atau memodifikasi Skills
    - Mengubah pembatasan Skills, daftar izin, atau aturan pemuatan
    - Memahami prioritas Skills dan perilaku snapshot
sidebarTitle: Skills
summary: Skills mengajarkan agen Anda cara menggunakan alat. Pelajari cara Skills dimuat, cara kerja prioritas, serta cara mengonfigurasi gating, daftar izin, dan injeksi lingkungan.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:51:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills adalah file instruksi markdown yang mengajari agen bagaimana dan kapan memakai
alat. Setiap skill berada dalam direktori yang berisi file `SKILL.md` dengan YAML
frontmatter dan isi markdown. OpenClaw memuat skill bawaan beserta override lokal
apa pun, lalu memfilternya saat pemuatan berdasarkan environment, config, dan
keberadaan binary.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/id/tools/creating-skills" icon="hammer">
    Bangun dan uji skill kustom dari awal.
  </Card>
  <Card title="Skill Workshop" href="/id/tools/skill-workshop" icon="flask">
    Tinjau dan setujui proposal skill yang dirancang agen.
  </Card>
  <Card title="Skills config" href="/id/tools/skills-config" icon="gear">
    Skema config `skills.*` lengkap dan allowlist agen.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Jelajahi dan instal skill komunitas.
  </Card>
</CardGroup>

## Urutan pemuatan

OpenClaw memuat dari sumber berikut, **prioritas tertinggi terlebih dahulu**. Ketika nama
skill yang sama muncul di beberapa tempat, sumber tertinggi yang menang.

| Prioritas     | Sumber                       | Path                                    |
| ------------- | ---------------------------- | --------------------------------------- |
| 1 — tertinggi | Skill workspace              | `<workspace>/skills`                    |
| 2             | Skill agen proyek            | `<workspace>/.agents/skills`            |
| 3             | Skill agen pribadi           | `~/.agents/skills`                      |
| 4             | Skill terkelola / lokal      | `~/.openclaw/skills`                    |
| 5             | Skill bawaan                 | dikirim bersama instalasi               |
| 6 — terendah  | Direktori tambahan           | `skills.load.extraDirs` + skill plugin  |

Root skill mendukung layout berkelompok. OpenClaw menemukan skill setiap kali
`SKILL.md` muncul di mana saja di bawah root yang dikonfigurasi:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Path folder hanya untuk pengorganisasian. Nama skill, slash command, dan
kunci allowlist semuanya berasal dari field frontmatter `name` (atau nama direktori
ketika `name` tidak ada).

<Note>
  Direktori native `$CODEX_HOME/skills` milik Codex CLI **bukan** root skill
  OpenClaw. Gunakan `openclaw migrate plan codex` untuk menginventarisasi skill tersebut, lalu
  `openclaw migrate codex` untuk menyalinnya ke workspace OpenClaw Anda.
</Note>

## Skill per agen vs bersama

Dalam setup multi-agen, setiap agen memiliki workspace sendiri. Gunakan path yang
sesuai dengan visibilitas yang Anda inginkan:

| Cakupan         | Path                         | Terlihat oleh                         |
| --------------- | ---------------------------- | ------------------------------------- |
| Per agen        | `<workspace>/skills`         | Hanya agen tersebut                   |
| Agen proyek     | `<workspace>/.agents/skills` | Hanya agen workspace tersebut         |
| Agen pribadi    | `~/.agents/skills`           | Semua agen di mesin ini               |
| Terkelola bersama | `~/.openclaw/skills`       | Semua agen di mesin ini               |
| Direktori tambahan | `skills.load.extraDirs`   | Semua agen di mesin ini               |

## Allowlist agen

**Lokasi** skill (prioritas) dan **visibilitas** skill (agen mana yang dapat menggunakannya)
adalah kontrol terpisah. Gunakan allowlist untuk membatasi skill mana yang dilihat agen,
terlepas dari mana skill tersebut dimuat.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist rules">
    - Hilangkan `agents.defaults.skills` agar semua skill tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
    - Atur `agents.list[].skills: []` agar tidak mengekspos skill untuk agen tersebut.
    - Daftar `agents.list[].skills` yang tidak kosong adalah set **final** — daftar itu tidak
      digabung dengan default.
    - Allowlist efektif berlaku di seluruh pembuatan prompt, penemuan slash-command,
      sinkronisasi sandbox, dan snapshot skill.
    - Ini bukan batas otorisasi shell host. Jika agen yang sama dapat
      menggunakan `exec`, batasi shell tersebut secara terpisah dengan sandboxing, isolasi
      pengguna OS, deny/allowlist exec, dan kredensial per resource.
  </Accordion>
</AccordionGroup>

## Plugin dan skill

Plugin dapat mengirim skill mereka sendiri dengan mencantumkan direktori `skills` di
`openclaw.plugin.json` (path relatif terhadap root plugin). Skill plugin dimuat
ketika plugin diaktifkan — misalnya, plugin browser mengirim skill
`browser-automation` untuk kontrol browser multi-langkah.

Direktori skill plugin digabung pada level prioritas rendah yang sama seperti
`skills.load.extraDirs`, sehingga skill bawaan, terkelola, agen, atau workspace
dengan nama yang sama akan menimpanya. Gate skill tersebut melalui `metadata.openclaw.requires.config` pada
entri config plugin.

Lihat [Plugin](/id/tools/plugin) dan [Alat](/id/tools) untuk sistem plugin lengkap.

## Skill Workshop

[Skill Workshop](/id/tools/skill-workshop) adalah antrean proposal antara agen
dan file skill aktif Anda. Ketika agen melihat pekerjaan yang dapat digunakan ulang, agen membuat draf
proposal alih-alih menulis langsung ke `SKILL.md`. Anda meninjau dan menyetujui
sebelum apa pun berubah.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Lihat [Skill Workshop](/id/tools/skill-workshop) untuk lifecycle lengkap, referensi CLI,
dan konfigurasi.

## Menginstal dari ClawHub

[ClawHub](https://clawhub.ai) adalah registry skill publik. Gunakan perintah
`openclaw skills` untuk instalasi dan pembaruan, atau CLI `clawhub` untuk
publish dan sinkronisasi.

| Tindakan                              | Perintah                                               |
| ------------------------------------- | ------------------------------------------------------ |
| Instal skill ke workspace             | `openclaw skills install @owner/<slug>`                |
| Instal dari repositori Git            | `openclaw skills install git:owner/repo@ref`           |
| Instal direktori skill lokal          | `openclaw skills install ./path/to/skill --as my-tool` |
| Instal untuk semua agen lokal         | `openclaw skills install @owner/<slug> --global`       |
| Perbarui semua skill workspace        | `openclaw skills update --all`                         |
| Perbarui skill terkelola bersama      | `openclaw skills update @owner/<slug> --global`        |
| Perbarui semua skill terkelola bersama | `openclaw skills update --all --global`               |
| Verifikasi trust envelope skill       | `openclaw skills verify @owner/<slug>`                 |
| Cetak Skill Card yang dihasilkan      | `openclaw skills verify @owner/<slug> --card`          |
| Publish / sinkronisasi melalui CLI ClawHub | `clawhub sync --all`                              |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` secara default menginstal ke direktori `skills/`
    workspace aktif. Tambahkan `--global` untuk menginstal ke direktori bersama
    `~/.openclaw/skills`, terlihat oleh semua agen lokal kecuali allowlist agen
    mempersempitnya.

    Instalasi Git dan lokal mengharapkan `SKILL.md` di root sumber. Slug berasal
    dari frontmatter `SKILL.md` `name` saat valid, lalu fallback ke nama
    direktori atau repositori. Gunakan `--as <slug>` untuk mengganti.
    `openclaw skills update` hanya melacak instalasi ClawHub — instal ulang sumber Git atau
    lokal untuk menyegarkannya.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` meminta trust envelope
    `clawhub.skill.verify.v1` skill kepada ClawHub. Skill ClawHub yang terinstal diverifikasi
    terhadap versi dan registry yang dicatat di `.clawhub/origin.json`.
    Slug polos tetap diterima untuk skill yang sudah terinstal atau tidak ambigu, tetapi
    ref berkualifikasi owner menghindari ambiguitas publisher.

    Halaman skill ClawHub mengekspos status pemindaian keamanan terbaru sebelum instalasi,
    dengan halaman detail untuk VirusTotal, ClawScan, dan analisis statis. Perintah
    keluar non-zero ketika ClawHub menandai verifikasi sebagai gagal. Publisher
    memulihkan false positive melalui dasbor ClawHub atau
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    Klien Gateway yang membutuhkan pengiriman non-ClawHub dapat menyiapkan arsip skill zip
    dengan `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit`,
    lalu menginstal dengan `skills.install({ source: "upload", ... })`. Path ini
    nonaktif secara default dan memerlukan `skills.install.allowUploadedArchives: true` di
    `openclaw.json`. Instalasi ClawHub normal tidak pernah memerlukan pengaturan tersebut.
  </Accordion>
</AccordionGroup>

## Keamanan

<Warning>
  Perlakukan skill pihak ketiga sebagai **kode tidak tepercaya**. Baca sebelum mengaktifkan.
  Utamakan run yang disandbox untuk input tidak tepercaya dan alat berisiko. Lihat
  [Sandboxing](/id/gateway/sandboxing) untuk kontrol sisi agen.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Penemuan skill workspace, agen proyek, dan direktori tambahan hanya menerima root skill
    yang realpath terselesaikannya tetap berada di dalam root yang dikonfigurasi, kecuali
    `skills.load.allowSymlinkTargets` secara eksplisit memercayai root target.
    Skill Workshop menulis melalui target tepercaya tersebut hanya ketika
    `skills.workshop.allowSymlinkTargetWrites` diaktifkan.
    `~/.openclaw/skills` terkelola dan `~/.agents/skills` pribadi dapat berisi
    folder skill bersymlink, tetapi setiap realpath `SKILL.md` tetap harus berada
    di dalam direktori skill yang terselesaikan.
  </Accordion>
  <Accordion title="Operator install policy">
    Konfigurasikan `security.installPolicy` untuk menjalankan perintah kebijakan lokal tepercaya
    sebelum instalasi skill berlanjut. Kebijakan menerima metadata dan path sumber
    yang telah disiapkan, berlaku untuk path ClawHub, uploaded, Git, local, update, dan
    dependency-installer, serta gagal tertutup ketika perintah tidak dapat mengembalikan
    keputusan yang valid.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan secret ke proses
    **host** hanya untuk giliran agen tersebut — bukan ke sandbox. Jauhkan
    secret dari prompt dan log.
  </Accordion>
</AccordionGroup>

Untuk threat model dan checklist keamanan yang lebih luas, lihat
[Keamanan](/id/gateway/security).

## Format SKILL.md

Setiap skill minimal memerlukan `name` dan `description` dalam frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw mengikuti spesifikasi [AgentSkills](https://agentskills.io). Parser
  frontmatter mendukung **hanya key satu baris** — `metadata` harus berupa
  objek JSON satu baris. Gunakan `{baseDir}` di body untuk merujuk path folder
  skill.
</Note>

### Key frontmatter opsional

<ParamField path="homepage" type="string">
  URL yang ditampilkan sebagai "Website" di UI Skills macOS. Juga didukung melalui
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Ketika `true`, skill diekspos sebagai slash command yang dapat dipanggil pengguna.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Ketika `true`, OpenClaw menjaga instruksi skill di luar prompt normal agen.
  Skill tetap tersedia sebagai slash command ketika `user-invocable`
  juga `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Ketika diatur ke `tool`, slash command melewati model dan dispatch
  langsung ke tool terdaftar.
</ParamField>

<ParamField path="command-tool" type="string">
  Nama tool yang akan dipanggil ketika `command-dispatch: tool` diatur.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Untuk dispatch alat, meneruskan string arg mentah ke alat tanpa
  parsing inti. Alat menerima
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating

OpenClaw memfilter skills saat pemuatan menggunakan `metadata.openclaw` (JSON
satu baris di frontmatter). Skill tanpa blok `metadata.openclaw` selalu
memenuhi syarat kecuali dinonaktifkan secara eksplisit.

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

<ParamField path="always" type="boolean">
  Jika `true`, selalu sertakan skill dan lewati semua gate lain.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opsional yang ditampilkan di UI Skills macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opsional yang ditampilkan sebagai "Website" di UI Skills macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filter platform. Jika diatur, skill hanya memenuhi syarat pada OS yang tercantum.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Setiap biner harus ada di `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Setidaknya satu biner harus ada di `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Setiap variabel env harus ada di proses atau disediakan melalui config.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Setiap path `openclaw.json` harus bernilai truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nama variabel env yang terkait dengan `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Spesifikasi penginstal opsional yang digunakan oleh UI Skills macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Blok lama `metadata.clawdbot` masih diterima ketika
  `metadata.openclaw` tidak ada, sehingga skill terinstal lama tetap
  mempertahankan gate dependensi dan petunjuk penginstalnya. Skill baru harus menggunakan
  `metadata.openclaw`.
</Note>

### Spesifikasi penginstal

Spesifikasi penginstal memberi tahu UI Skills macOS cara menginstal dependensi:

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
    - Ketika beberapa penginstal dicantumkan, gateway memilih satu opsi
      pilihan (brew jika tersedia, jika tidak node).
    - Jika semua penginstal adalah `download`, OpenClaw mencantumkan setiap entri agar Anda dapat
      melihat semua artefak yang tersedia.
    - Spesifikasi dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter berdasarkan platform.
    - Instalasi Node mengikuti `skills.install.nodeManager` di `openclaw.json`
      (default: npm; opsi: npm / pnpm / yarn / bun). Ini hanya memengaruhi
      instalasi skill; runtime Gateway tetap harus Node.
    - Preferensi penginstal Gateway: Homebrew → uv → manajer node yang dikonfigurasi →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw tidak menginstal Homebrew secara otomatis atau menerjemahkan formula brew
      menjadi perintah paket sistem. Di kontainer Linux tanpa
      `brew`, penginstal khusus brew disembunyikan; gunakan image kustom atau instal
      dependensi secara manual.
    - **Go:** OpenClaw memerlukan Go 1.21 atau yang lebih baru untuk instalasi skill otomatis dan
      mempertahankan pengaturan `GOBIN`, `GOPATH`, dan `GOTOOLCHAIN` yang ada. Jika
      toolchain yang dikonfigurasi tidak dapat memenuhi versi Go yang diwajibkan modul,
      onboarding mengelompokkan skill dengan prasyarat Go manual setelah percobaan
      instalasi. Jika `go` tidak ada dan Homebrew tersedia, OpenClaw menginstal
      Go melalui Homebrew terlebih dahulu dan mengatur `GOBIN` ke `bin` milik Homebrew. Di Linux,
      OpenClaw dapat menggunakan `apt-get` sebagai root atau melalui `sudo` tanpa sandi
      ketika kandidat `golang-go` yang diperbarui memenuhi versi minimum.
    - **Download:** `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (default: otomatis ketika arsip terdeteksi), `stripComponents`,
      `targetDir` (default: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` diperiksa pada **host** saat skill dimuat. Jika agen
    berjalan di sandbox, biner juga harus ada **di dalam kontainer**.
    Instal melalui `agents.defaults.sandbox.docker.setupCommand` atau image
    kustom. `setupCommand` berjalan sekali setelah pembuatan kontainer dan memerlukan
    egress jaringan, root FS yang dapat ditulis, dan pengguna root di sandbox.
  </Accordion>
</AccordionGroup>

## Override config

Aktifkan/nonaktifkan dan konfigurasi skill bawaan atau terkelola di bawah `skills.entries` dalam
`~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
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
  `false` menonaktifkan skill meskipun dibundel atau terinstal. Skill bawaan `coding-agent`
  bersifat opt-in — atur `skills.entries.coding-agent.enabled: true`
  dan pastikan salah satu dari `claude`, `codex`, `opencode`, atau CLI lain yang didukung
  sudah terinstal dan terautentikasi.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Field praktis untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`.
  Mendukung string teks biasa atau objek SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variabel lingkungan yang disuntikkan untuk run agen. Hanya disuntikkan ketika
  variabel belum diatur dalam proses.
</ParamField>

<ParamField path="config" type="object">
  Bag opsional untuk field konfigurasi per-skill kustom.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Allowlist opsional hanya untuk skill **bawaan**. Jika diatur, hanya skill bawaan
  dalam daftar yang memenuhi syarat. Skill terkelola dan workspace tidak terpengaruh.
</ParamField>

<Note>
  Kunci config cocok dengan **nama skill** secara default. Jika skill mendefinisikan
  `metadata.openclaw.skillKey`, gunakan kunci tersebut di bawah `skills.entries`. Kutip
  nama yang memakai tanda hubung: JSON5 mengizinkan kunci yang dikutip.
</Note>

## Injeksi lingkungan

Ketika run agen dimulai, OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw menyelesaikan daftar skill efektif untuk agen, dengan menerapkan aturan
    gating, allowlist, dan override config.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` dan `skills.entries.<key>.apiKey` diterapkan ke
    `process.env` selama durasi run.
  </Step>
  <Step title="Builds the system prompt">
    Skill yang memenuhi syarat dikompilasi menjadi blok XML ringkas dan disuntikkan ke
    prompt sistem.
  </Step>
  <Step title="Restores the environment">
    Setelah run berakhir, lingkungan asli dipulihkan.
  </Step>
</Steps>

<Warning>
  Injeksi env dicakup ke run agen **host**, bukan sandbox. Di dalam
  sandbox, `env` dan `apiKey` tidak berpengaruh. Lihat
  [Config Skills](/id/tools/skills-config#sandboxed-skills-and-env-vars) untuk cara
  meneruskan secret ke run dalam sandbox.
</Warning>

Untuk backend bawaan `claude-cli`, OpenClaw juga mewujudkan snapshot skill
yang memenuhi syarat yang sama sebagai Plugin Claude Code sementara dan meneruskannya melalui
`--plugin-dir`. Backend CLI lain hanya menggunakan katalog prompt.

## Snapshot dan refresh

OpenClaw mengambil snapshot skill yang memenuhi syarat **ketika sesi dimulai** dan menggunakan kembali
daftar tersebut untuk semua giliran berikutnya dalam sesi. Perubahan pada skill atau config mulai
berlaku pada sesi baru berikutnya.

Skill di-refresh di tengah sesi dalam dua kasus:

- Watcher skill mendeteksi perubahan `SKILL.md`.
- Node remote baru yang memenuhi syarat tersambung.

Daftar yang di-refresh digunakan pada giliran agen berikutnya. Jika allowlist agen efektif
berubah, OpenClaw me-refresh snapshot agar skill yang terlihat tetap
selaras.

<AccordionGroup>
  <Accordion title="Skills watcher">
    Secara default, OpenClaw memantau folder skill dan menaikkan snapshot ketika
    file `SKILL.md` berubah. Konfigurasikan di bawah `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    Gunakan `allowSymlinkTargets` untuk tata letak symlink yang disengaja ketika symlink
    root skill mengarah ke luar root yang dikonfigurasi, misalnya
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Aktifkan `skills.workshop.allowSymlinkTargetWrites` hanya ketika Skill Workshop
    juga harus menerapkan proposal melalui path symlink tepercaya tersebut.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Jika Gateway berjalan di Linux tetapi **node macOS** tersambung dengan
    `system.run` diizinkan, OpenClaw dapat menganggap skill khusus macOS memenuhi syarat ketika
    biner yang diperlukan ada pada node tersebut. Agen harus menjalankan
    skill tersebut melalui alat `exec` dengan `host=node`.

    Node offline **tidak** membuat skill khusus remote terlihat. Jika sebuah node berhenti
    menjawab probe bin, OpenClaw menghapus kecocokan bin yang di-cache.

  </Accordion>
</AccordionGroup>

## Dampak token

Ketika skill memenuhi syarat, OpenClaw menyuntikkan blok XML ringkas ke prompt
sistem. Biayanya deterministik:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Overhead dasar** (hanya ketika ≥ 1 skill): ~195 karakter
- **Per skill:** ~97 karakter + panjang field `name`, `description`, dan `location` Anda
- Escaping XML memperluas `& < > " '` menjadi entitas, menambahkan beberapa karakter per kemunculan
- Pada ~4 karakter/token, 97 karakter ≈ 24 token per skill sebelum panjang field

Jaga deskripsi tetap singkat dan deskriptif untuk meminimalkan overhead prompt.

## Terkait

<CardGroup cols={2}>
  <Card title="Creating skills" href="/id/tools/creating-skills" icon="hammer">
    Panduan langkah demi langkah untuk menulis skill kustom.
  </Card>
  <Card title="Skill Workshop" href="/id/tools/skill-workshop" icon="flask">
    Antrean proposal untuk skill yang dirancang agen.
  </Card>
  <Card title="Skills config" href="/id/tools/skills-config" icon="gear">
    Skema config `skills.*` lengkap dan allowlist agen.
  </Card>
  <Card title="Slash commands" href="/id/tools/slash-commands" icon="terminal">
    Cara perintah slash skill didaftarkan dan dirutekan.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Jelajahi dan publikasikan skill di registry publik.
  </Card>
  <Card title="Plugins" href="/id/tools/plugin" icon="plug">
    Plugin dapat mengirimkan skill bersama alat yang didokumentasikannya.
  </Card>
</CardGroup>
