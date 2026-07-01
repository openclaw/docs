---
read_when:
    - Menambahkan atau memodifikasi Skills
    - Mengubah gating skill, allowlist, atau aturan pemuatan
    - Memahami prioritas Skills dan perilaku snapshot
sidebarTitle: Skills
summary: Skills mengajarkan agen Anda cara menggunakan alat. Pelajari cara pemuatannya, cara kerja presedensi, dan cara mengonfigurasi gating, allowlist, serta injeksi lingkungan.
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:38:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills adalah berkas instruksi markdown yang mengajari agen bagaimana dan kapan menggunakan
alat. Setiap skill berada dalam direktori yang berisi berkas `SKILL.md` dengan YAML
frontmatter dan body markdown. OpenClaw memuat Skills bawaan beserta override lokal apa pun,
dan memfilternya saat dimuat berdasarkan lingkungan, config, dan keberadaan binary.

<CardGroup cols={2}>
  <Card title="Membuat Skills" href="/id/tools/creating-skills" icon="hammer">
    Bangun dan uji skill kustom dari awal.
  </Card>
  <Card title="Skill Workshop" href="/id/tools/skill-workshop" icon="flask">
    Tinjau dan setujui proposal skill yang disusun agen.
  </Card>
  <Card title="Config Skills" href="/id/tools/skills-config" icon="gear">
    Skema config `skills.*` lengkap dan allowlist agen.
  </Card>
  <Card title="ClawHub" href="/id/clawhub" icon="cloud">
    Jelajahi dan pasang Skills komunitas.
  </Card>
</CardGroup>

## Urutan pemuatan

OpenClaw memuat dari sumber berikut, **presedensi tertinggi terlebih dahulu**. Ketika nama
skill yang sama muncul di beberapa tempat, sumber tertinggi yang menang.

| Prioritas    | Sumber                 | Path                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — tertinggi | Skills workspace       | `<workspace>/skills`                    |
| 2           | Skills agen proyek   | `<workspace>/.agents/skills`            |
| 3           | Skills agen pribadi  | `~/.agents/skills`                      |
| 4           | Skills terkelola / lokal | `~/.openclaw/skills`                    |
| 5           | Skills bawaan         | dikirim bersama instalasi                |
| 6 — terendah  | Direktori tambahan      | `skills.load.extraDirs` + Skills Plugin |

Root skill mendukung tata letak berkelompok. OpenClaw menemukan skill setiap kali
`SKILL.md` muncul di mana saja di bawah root yang dikonfigurasi:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Path folder hanya untuk organisasi. Nama skill, slash command, dan
kunci allowlist semuanya berasal dari field frontmatter `name` (atau nama direktori
ketika `name` tidak ada).

<Note>
  Direktori native `$CODEX_HOME/skills` milik Codex CLI **bukan** root skill
  OpenClaw. Gunakan `openclaw migrate plan codex` untuk menginventarisasi Skills tersebut, lalu
  `openclaw migrate codex` untuk menyalinnya ke workspace OpenClaw Anda.
</Note>

## Skills per agen vs bersama

Dalam setup multi-agen, setiap agen memiliki workspace sendiri. Gunakan path yang
cocok dengan visibilitas yang Anda inginkan:

| Cakupan          | Path                         | Terlihat oleh                  |
| -------------- | ---------------------------- | --------------------------- |
| Per agen      | `<workspace>/skills`         | Hanya agen tersebut             |
| Agen proyek  | `<workspace>/.agents/skills` | Hanya agen workspace tersebut |
| Agen pribadi | `~/.agents/skills`           | Semua agen di mesin ini  |
| Terkelola bersama | `~/.openclaw/skills`         | Semua agen di mesin ini  |
| Direktori tambahan     | `skills.load.extraDirs`      | Semua agen di mesin ini  |

## Allowlist agen

**Lokasi** skill (presedensi) dan **visibilitas** skill (agen mana yang dapat menggunakannya)
adalah kontrol terpisah. Gunakan allowlist untuk membatasi Skills mana yang dilihat agen,
terlepas dari mana Skills tersebut dimuat.

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
  <Accordion title="Aturan allowlist">
    - Hilangkan `agents.defaults.skills` agar semua Skills tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
    - Tetapkan `agents.list[].skills: []` agar tidak mengekspos Skills untuk agen tersebut.
    - Daftar `agents.list[].skills` yang tidak kosong adalah set **final** — daftar itu tidak
      digabungkan dengan default.
    - Allowlist efektif berlaku di seluruh pembuatan prompt, penemuan slash-command,
      sinkronisasi sandbox, dan snapshot skill.
    - Ini bukan batas otorisasi shell host. Jika agen yang sama dapat
      menggunakan `exec`, batasi shell tersebut secara terpisah dengan sandboxing, isolasi user OS,
      denylist/allowlist exec, dan kredensial per resource.
  </Accordion>
</AccordionGroup>

## Plugin dan Skills

Plugin dapat mengirimkan Skills mereka sendiri dengan mencantumkan direktori `skills` di
`openclaw.plugin.json` (path relatif terhadap root Plugin). Skills Plugin dimuat
ketika Plugin diaktifkan — misalnya, Plugin browser mengirimkan skill
`browser-automation` untuk kontrol browser multi-langkah.

Direktori skill Plugin digabungkan pada level presedensi rendah yang sama dengan
`skills.load.extraDirs`, sehingga skill bawaan, terkelola, agen, atau workspace
dengan nama yang sama akan menimpanya. Batasi melalui `metadata.openclaw.requires.config` pada
entri config Plugin.

Lihat [Plugin](/id/tools/plugin) dan [Alat](/id/tools) untuk sistem Plugin lengkap.

## Skill Workshop

[Skill Workshop](/id/tools/skill-workshop) adalah antrean proposal antara agen
dan berkas skill aktif Anda. Ketika agen menemukan pekerjaan yang dapat digunakan kembali, agen menyusun
proposal alih-alih menulis langsung ke `SKILL.md`. Anda meninjau dan menyetujui
sebelum apa pun berubah.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Lihat [Skill Workshop](/id/tools/skill-workshop) untuk siklus hidup lengkap, referensi CLI,
dan konfigurasi.

## Memasang dari ClawHub

[ClawHub](https://clawhub.ai) adalah registry Skills publik. Gunakan perintah
`openclaw skills` untuk install dan update, atau CLI `clawhub` untuk
publish dan sync.

| Tindakan                             | Perintah                                                |
| ---------------------------------- | ------------------------------------------------------ |
| Pasang skill ke workspace | `openclaw skills install @owner/<slug>`                |
| Pasang dari repositori Git      | `openclaw skills install git:owner/repo@ref`           |
| Pasang direktori skill lokal    | `openclaw skills install ./path/to/skill --as my-tool` |
| Pasang untuk semua agen lokal       | `openclaw skills install @owner/<slug> --global`       |
| Update semua Skills workspace        | `openclaw skills update --all`                         |
| Update skill terkelola bersama      | `openclaw skills update @owner/<slug> --global`        |
| Update semua Skills terkelola bersama   | `openclaw skills update --all --global`                |
| Verifikasi trust envelope skill    | `openclaw skills verify @owner/<slug>`                 |
| Cetak Skill Card yang dihasilkan     | `openclaw skills verify @owner/<slug> --card`          |
| Publish / sync melalui CLI ClawHub     | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Detail instalasi">
    `openclaw skills install` memasang ke direktori `skills/`
    workspace aktif secara default. Tambahkan `--global` untuk memasang ke direktori bersama
    `~/.openclaw/skills`, terlihat oleh semua agen lokal kecuali allowlist agen
    mempersempitnya.

    Instalasi Git dan lokal mengharapkan `SKILL.md` di root sumber. Slug berasal
    dari frontmatter `SKILL.md` `name` ketika valid, lalu fallback ke nama
    direktori atau repositori. Gunakan `--as <slug>` untuk override.
    `openclaw skills update` hanya melacak instalasi ClawHub — pasang ulang sumber Git atau
    lokal untuk menyegarkannya.

  </Accordion>
  <Accordion title="Verifikasi dan pemindaian keamanan">
    `openclaw skills verify @owner/<slug>` meminta ClawHub untuk trust envelope
    `clawhub.skill.verify.v1` milik skill. Skills ClawHub yang terpasang diverifikasi
    terhadap versi dan registry yang tercatat di `.clawhub/origin.json`.
    Slug polos tetap diterima untuk Skills yang sudah terpasang atau tidak ambigu, tetapi
    ref berkualifikasi owner menghindari ambiguitas publisher.

    Halaman skill ClawHub mengekspos status pemindaian keamanan terbaru sebelum instalasi,
    dengan halaman detail untuk VirusTotal, ClawScan, dan analisis statis. Perintah
    keluar non-zero ketika ClawHub menandai verifikasi sebagai gagal. Publisher
    memulihkan false positive melalui dashboard ClawHub atau
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalasi arsip pribadi">
    Klien Gateway yang membutuhkan pengiriman non-ClawHub dapat menyiapkan arsip zip skill
    dengan `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit`,
    lalu memasang dengan `skills.install({ source: "upload", ... })`. Path ini
    nonaktif secara default dan memerlukan `skills.install.allowUploadedArchives: true` di
    `openclaw.json`. Instalasi ClawHub normal tidak pernah memerlukan pengaturan itu.
  </Accordion>
</AccordionGroup>

## Keamanan

<Warning>
  Perlakukan Skills pihak ketiga sebagai **kode tidak tepercaya**. Baca sebelum mengaktifkan.
  Utamakan eksekusi tersandbox untuk input tidak tepercaya dan alat berisiko. Lihat
  [Sandboxing](/id/gateway/sandboxing) untuk kontrol sisi agen.
</Warning>

<AccordionGroup>
  <Accordion title="Pembatasan path">
    Penemuan skill workspace, agen proyek, dan direktori tambahan hanya menerima root skill
    yang realpath terselesaikannya tetap berada di dalam root yang dikonfigurasi, kecuali
    `skills.load.allowSymlinkTargets` secara eksplisit memercayai root target.
    Skill Workshop menulis melalui target tepercaya tersebut hanya ketika
    `skills.workshop.allowSymlinkTargetWrites` diaktifkan.
    `~/.openclaw/skills` terkelola dan `~/.agents/skills` pribadi dapat berisi
    folder skill symlink, tetapi setiap realpath `SKILL.md` tetap harus berada
    di dalam direktori skill terselesaikannya.
  </Accordion>
  <Accordion title="Kebijakan instalasi operator">
    Konfigurasikan `security.installPolicy` untuk menjalankan perintah kebijakan lokal tepercaya
    sebelum instalasi skill berlanjut. Kebijakan menerima metadata dan path sumber
    yang sudah disiapkan, berlaku untuk jalur ClawHub, unggahan, Git, lokal, update, dan
    dependency-installer, serta fail closed ketika perintah tidak dapat mengembalikan
    keputusan yang valid.
  </Accordion>
  <Accordion title="Cakupan injeksi secret">
    `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan secret ke dalam proses
    **host** hanya untuk giliran agen tersebut — bukan ke sandbox. Jauhkan
    secret dari prompt dan log.
  </Accordion>
</AccordionGroup>

Untuk model ancaman dan checklist keamanan yang lebih luas, lihat
[Keamanan](/id/gateway/security).

## Format SKILL.md

Setiap skill memerlukan minimal `name` dan `description` di frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw mengikuti spesifikasi [AgentSkills](https://agentskills.io). Parser
  frontmatter mendukung **hanya kunci satu baris** — `metadata` harus berupa
  objek JSON satu baris. Gunakan `{baseDir}` di body untuk merujuk path folder
  skill.
</Note>

### Kunci frontmatter opsional

<ParamField path="homepage" type="string">
  URL yang ditampilkan sebagai "Situs web" di UI Skills macOS. Juga didukung melalui
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Ketika `true`, skill diekspos sebagai slash command yang dapat dipanggil pengguna.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Ketika `true`, OpenClaw mengecualikan instruksi skill dari prompt normal
  agen. Skill tetap tersedia sebagai slash command ketika `user-invocable`
  juga `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Ketika diatur ke `tool`, slash command melewati model dan dispatch
  langsung ke alat terdaftar.
</ParamField>

<ParamField path="command-tool" type="string">
  Nama alat yang akan dipanggil ketika `command-dispatch: tool` diatur.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Untuk dispatch tool, meneruskan string arg mentah ke tool tanpa parsing
  inti. Tool menerima
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating

OpenClaw memfilter skill saat waktu pemuatan menggunakan `metadata.openclaw` (JSON
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
  Jika `true`, selalu sertakan skill dan lewati semua gate lainnya.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opsional yang ditampilkan di UI Skills macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opsional yang ditampilkan sebagai "Situs web" di UI Skills macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filter platform. Jika disetel, skill hanya memenuhi syarat pada OS yang tercantum.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Setiap biner harus ada di `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Setidaknya satu biner harus ada di `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Setiap variabel env harus ada dalam proses atau disediakan melalui config.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Setiap path `openclaw.json` harus truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nama variabel env yang terkait dengan `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Spesifikasi penginstal opsional yang digunakan oleh UI Skills macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Blok `metadata.clawdbot` lama masih diterima ketika
  `metadata.openclaw` tidak ada, sehingga skill terinstal yang lebih lama tetap
  mempertahankan gate dependensi dan petunjuk penginstalnya. Skill baru sebaiknya menggunakan
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
  <Accordion title="Aturan pemilihan penginstal">
    - Ketika beberapa penginstal tercantum, Gateway memilih satu opsi yang
      diprioritaskan (brew jika tersedia, jika tidak node).
    - Jika semua penginstal adalah `download`, OpenClaw mencantumkan setiap entri agar Anda dapat
      melihat semua artefak yang tersedia.
    - Spesifikasi dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter berdasarkan platform.
    - Instalasi Node mematuhi `skills.install.nodeManager` di `openclaw.json`
      (default: npm; opsi: npm / pnpm / yarn / bun). Ini hanya memengaruhi instalasi
      skill; runtime Gateway tetap harus berupa Node.
    - Preferensi penginstal Gateway: Homebrew → uv → pengelola node yang dikonfigurasi →
      go → download.
  </Accordion>
  <Accordion title="Detail per penginstal">
    - **Homebrew:** OpenClaw tidak menginstal Homebrew secara otomatis atau menerjemahkan formula brew
      menjadi perintah paket sistem. Di kontainer Linux tanpa
      `brew`, penginstal khusus brew disembunyikan; gunakan image khusus atau instal
      dependensi secara manual.
    - **Go:** jika `go` tidak ada dan `brew` tersedia, Gateway menginstal
      Go melalui Homebrew terlebih dahulu dan menyetel `GOBIN` ke `bin` milik Homebrew.
    - **Download:** `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (default: otomatis saat arsip terdeteksi), `stripComponents`,
      `targetDir` (default: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Catatan sandboxing">
    `requires.bins` diperiksa pada **host** saat waktu pemuatan skill. Jika agen
    berjalan di sandbox, biner juga harus ada **di dalam kontainer**.
    Instal melalui `agents.defaults.sandbox.docker.setupCommand` atau image
    khusus. `setupCommand` berjalan sekali setelah pembuatan kontainer dan memerlukan
    egress jaringan, root FS yang dapat ditulis, dan pengguna root di sandbox.
  </Accordion>
</AccordionGroup>

## Override config

Alihkan dan konfigurasikan skill bawaan atau terkelola di bawah `skills.entries` dalam
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
  `false` menonaktifkan skill meskipun sudah dibundel atau diinstal. Skill bawaan `coding-agent`
  bersifat opt-in — setel `skills.entries.coding-agent.enabled: true`
  dan pastikan salah satu dari `claude`, `codex`, `opencode`, atau CLI lain yang didukung
  sudah diinstal dan diautentikasi.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Field kemudahan untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`.
  Mendukung string plaintext atau objek SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variabel lingkungan yang diinjeksi untuk run agen. Hanya diinjeksi ketika
  variabel belum disetel dalam proses.
</ParamField>

<ParamField path="config" type="object">
  Kantong opsional untuk field konfigurasi khusus per skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Allowlist opsional hanya untuk skill **bawaan**. Jika disetel, hanya skill bawaan
  dalam daftar yang memenuhi syarat. Skill terkelola dan workspace tidak terpengaruh.
</ParamField>

<Note>
  Key config cocok dengan **nama skill** secara default. Jika skill mendefinisikan
  `metadata.openclaw.skillKey`, gunakan key tersebut di bawah `skills.entries`. Kutip
  nama yang memakai tanda hubung: JSON5 mengizinkan key yang dikutip.
</Note>

## Injeksi lingkungan

Ketika run agen dimulai, OpenClaw:

<Steps>
  <Step title="Membaca metadata skill">
    OpenClaw menyelesaikan daftar skill efektif untuk agen, dengan menerapkan aturan
    gating, allowlist, dan override config.
  </Step>
  <Step title="Menginjeksi env dan key API">
    `skills.entries.<key>.env` dan `skills.entries.<key>.apiKey` diterapkan ke
    `process.env` selama durasi run.
  </Step>
  <Step title="Membangun prompt sistem">
    Skill yang memenuhi syarat dikompilasi menjadi blok XML ringkas dan diinjeksi ke dalam
    prompt sistem.
  </Step>
  <Step title="Memulihkan lingkungan">
    Setelah run berakhir, lingkungan asli dipulihkan.
  </Step>
</Steps>

<Warning>
  Injeksi env dibatasi pada run agen **host**, bukan sandbox. Di dalam
  sandbox, `env` dan `apiKey` tidak berpengaruh. Lihat
  [Config Skills](/id/tools/skills-config#sandboxed-skills-and-env-vars) untuk cara
  meneruskan secret ke run yang di-sandbox.
</Warning>

Untuk backend bawaan `claude-cli`, OpenClaw juga mewujudkan snapshot skill
memenuhi syarat yang sama sebagai Plugin Claude Code sementara dan meneruskannya melalui
`--plugin-dir`. Backend CLI lain hanya menggunakan katalog prompt.

## Snapshot dan refresh

OpenClaw mengambil snapshot skill yang memenuhi syarat **ketika sesi dimulai** dan menggunakan kembali
daftar itu untuk semua giliran berikutnya dalam sesi. Perubahan pada skill atau config mulai
berlaku pada sesi baru berikutnya.

Skills di-refresh di tengah sesi dalam dua kasus:

- Watcher skill mendeteksi perubahan `SKILL.md`.
- Node jarak jauh baru yang memenuhi syarat tersambung.

Daftar yang di-refresh digunakan pada giliran agen berikutnya. Jika allowlist agen efektif
berubah, OpenClaw me-refresh snapshot agar skill yang terlihat tetap
selaras.

<AccordionGroup>
  <Accordion title="Watcher Skills">
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
    root skill menunjuk keluar dari root yang dikonfigurasi, misalnya
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Aktifkan `skills.workshop.allowSymlinkTargetWrites` hanya ketika Skill Workshop
    juga harus menerapkan proposal melalui path symlink tepercaya tersebut.

  </Accordion>
  <Accordion title="Node macOS jarak jauh (Gateway Linux)">
    Jika Gateway berjalan di Linux tetapi **node macOS** tersambung dengan
    `system.run` diizinkan, OpenClaw dapat memperlakukan skill khusus macOS sebagai memenuhi syarat ketika
    biner yang diperlukan ada pada node tersebut. Agen sebaiknya menjalankan
    skill tersebut melalui tool `exec` dengan `host=node`.

    Node offline **tidak** membuat skill khusus jarak jauh terlihat. Jika node berhenti
    menjawab probe bin, OpenClaw menghapus kecocokan bin yang di-cache untuk node tersebut.

  </Accordion>
</AccordionGroup>

## Dampak token

Ketika skill memenuhi syarat, OpenClaw menginjeksi blok XML ringkas ke dalam prompt
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
  <Card title="Membuat skill" href="/id/tools/creating-skills" icon="hammer">
    Panduan langkah demi langkah untuk membuat skill khusus.
  </Card>
  <Card title="Skill Workshop" href="/id/tools/skill-workshop" icon="flask">
    Antrean proposal untuk skill yang dirancang agen.
  </Card>
  <Card title="Config Skills" href="/id/tools/skills-config" icon="gear">
    Skema config `skills.*` lengkap dan allowlist agen.
  </Card>
  <Card title="Perintah slash" href="/id/tools/slash-commands" icon="terminal">
    Cara perintah slash skill didaftarkan dan dirutekan.
  </Card>
  <Card title="ClawHub" href="/id/clawhub" icon="cloud">
    Jelajahi dan publikasikan skill di registry publik.
  </Card>
  <Card title="Plugins" href="/id/tools/plugin" icon="plug">
    Plugins dapat mengirimkan skill bersama tool yang didokumentasikannya.
  </Card>
</CardGroup>
