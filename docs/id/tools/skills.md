---
read_when:
    - Menambahkan atau mengubah Skills
    - Mengubah gating, allowlist, atau aturan pemuatan skill
    - Memahami presedensi Skills dan perilaku snapshot
sidebarTitle: Skills
summary: Skills mengajari agen Anda cara menggunakan alat. Pelajari cara Skills dimuat, cara kerja prioritas, dan cara mengonfigurasi gating, allowlist, serta injeksi lingkungan.
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:20:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills adalah file instruksi markdown yang mengajari agen bagaimana dan kapan menggunakan
alat. Setiap skill berada di direktori yang berisi file `SKILL.md` dengan YAML
frontmatter dan isi markdown. OpenClaw memuat Skills bawaan beserta override
lokal apa pun, lalu memfilternya saat pemuatan berdasarkan lingkungan, konfigurasi, dan
keberadaan binary.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/id/tools/creating-skills" icon="hammer">
    Bangun dan uji skill kustom dari awal.
  </Card>
  <Card title="Skill Workshop" href="/id/tools/skill-workshop" icon="flask">
    Tinjau dan setujui proposal skill yang dirancang agen.
  </Card>
  <Card title="Skills config" href="/id/tools/skills-config" icon="gear">
    Skema konfigurasi `skills.*` lengkap dan allowlist agen.
  </Card>
  <Card title="ClawHub" href="/id/clawhub" icon="cloud">
    Jelajahi dan instal Skills komunitas.
  </Card>
</CardGroup>

## Urutan pemuatan

OpenClaw memuat dari sumber berikut, **prioritas tertinggi terlebih dahulu**. Ketika nama
skill yang sama muncul di beberapa tempat, sumber tertinggi yang menang.

| Prioritas       | Sumber                 | Path                                    |
| --------------- | ---------------------- | --------------------------------------- |
| 1 — tertinggi   | Skills workspace       | `<workspace>/skills`                    |
| 2               | Skills agen proyek     | `<workspace>/.agents/skills`            |
| 3               | Skills agen personal   | `~/.agents/skills`                      |
| 4               | Skills terkelola/lokal | `~/.openclaw/skills`                    |
| 5               | Skills bawaan          | dikirim bersama instalasi               |
| 6 — terendah    | Direktori tambahan     | `skills.load.extraDirs` + Skills Plugin |

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
sesuai dengan visibilitas yang Anda inginkan:

| Cakupan         | Path                         | Terlihat oleh                 |
| --------------- | ---------------------------- | ----------------------------- |
| Per agen        | `<workspace>/skills`         | Hanya agen tersebut           |
| Agen proyek     | `<workspace>/.agents/skills` | Hanya agen workspace tersebut |
| Agen personal   | `~/.agents/skills`           | Semua agen di mesin ini       |
| Terkelola bersama | `~/.openclaw/skills`       | Semua agen di mesin ini       |
| Dir tambahan    | `skills.load.extraDirs`      | Semua agen di mesin ini       |

## Allowlist agen

**Lokasi** skill (prioritas) dan **visibilitas** skill (agen mana yang dapat menggunakannya)
adalah kontrol yang terpisah. Gunakan allowlist untuk membatasi Skills mana yang dilihat agen,
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
  <Accordion title="Allowlist rules">
    - Hilangkan `agents.defaults.skills` agar semua Skills tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
    - Tetapkan `agents.list[].skills: []` agar tidak mengekspos Skills untuk agen tersebut.
    - Daftar `agents.list[].skills` yang tidak kosong adalah set **final** — daftar ini tidak
      digabungkan dengan default.
    - Allowlist efektif berlaku di seluruh pembuatan prompt, penemuan slash-command,
      sinkronisasi sandbox, dan snapshot skill.
  </Accordion>
</AccordionGroup>

## Plugin dan Skills

Plugin dapat mengirim Skills miliknya sendiri dengan mencantumkan direktori `skills` di
`openclaw.plugin.json` (path relatif terhadap root Plugin). Skills Plugin dimuat
ketika Plugin diaktifkan — misalnya, Plugin browser mengirim skill
`browser-automation` untuk kontrol browser multi-langkah.

Direktori skill Plugin digabungkan pada tingkat prioritas rendah yang sama dengan
`skills.load.extraDirs`, sehingga skill bawaan, terkelola, agen, atau workspace
dengan nama yang sama akan menimpanya. Batasi melalui `metadata.openclaw.requires.config` pada
entri konfigurasi Plugin.

Lihat [Plugin](/id/tools/plugin) dan [Alat](/id/tools) untuk sistem Plugin lengkap.

## Skill Workshop

[Skill Workshop](/id/tools/skill-workshop) adalah antrean proposal antara agen
dan file skill aktif Anda. Ketika agen menemukan pekerjaan yang dapat digunakan ulang, agen merancang
proposal alih-alih menulis langsung ke `SKILL.md`. Anda meninjau dan menyetujui
sebelum ada perubahan apa pun.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Lihat [Skill Workshop](/id/tools/skill-workshop) untuk siklus hidup lengkap, referensi
CLI, dan konfigurasi.

## Menginstal dari ClawHub

[ClawHub](https://clawhub.ai) adalah registri Skills publik. Gunakan perintah
`openclaw skills` untuk instal dan pembaruan, atau CLI `clawhub` untuk
publikasi dan sinkronisasi.

| Tindakan                              | Perintah                                               |
| ------------------------------------- | ------------------------------------------------------ |
| Instal skill ke workspace             | `openclaw skills install @owner/<slug>`                |
| Instal dari repositori Git            | `openclaw skills install git:owner/repo@ref`           |
| Instal direktori skill lokal          | `openclaw skills install ./path/to/skill --as my-tool` |
| Instal untuk semua agen lokal         | `openclaw skills install @owner/<slug> --global`       |
| Perbarui semua Skills workspace       | `openclaw skills update --all`                         |
| Perbarui skill terkelola bersama      | `openclaw skills update @owner/<slug> --global`        |
| Perbarui semua Skills terkelola bersama | `openclaw skills update --all --global`              |
| Verifikasi trust envelope skill       | `openclaw skills verify @owner/<slug>`                 |
| Cetak Skill Card yang dihasilkan      | `openclaw skills verify @owner/<slug> --card`          |
| Publikasikan/sinkronkan melalui CLI ClawHub | `clawhub sync --all`                              |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` secara default menginstal ke direktori `skills/`
    workspace aktif. Tambahkan `--global` untuk menginstal ke direktori bersama
    `~/.openclaw/skills`, yang terlihat oleh semua agen lokal kecuali allowlist
    agen mempersempitnya.

    Instalasi Git dan lokal mengharapkan `SKILL.md` di root sumber. Slug berasal
    dari frontmatter `SKILL.md` `name` ketika valid, lalu fallback ke nama
    direktori atau repositori. Gunakan `--as <slug>` untuk mengganti.
    `openclaw skills update` hanya melacak instalasi ClawHub — instal ulang sumber Git atau
    lokal untuk menyegarkannya.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` meminta trust envelope
    `clawhub.skill.verify.v1` milik skill dari ClawHub. Skills ClawHub yang terinstal diverifikasi
    terhadap versi dan registri yang tercatat di `.clawhub/origin.json`.
    Slug polos tetap diterima untuk Skills yang sudah terinstal atau tidak ambigu, tetapi
    ref berkualifikasi owner menghindari ambiguitas penerbit.

    Halaman skill ClawHub mengekspos status pemindaian keamanan terbaru sebelum instalasi,
    dengan halaman detail untuk VirusTotal, ClawScan, dan analisis statis. Perintah
    keluar non-zero ketika ClawHub menandai verifikasi sebagai gagal. Penerbit
    memulihkan positif palsu melalui dasbor ClawHub atau
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    Klien Gateway yang memerlukan pengiriman non-ClawHub dapat menyiapkan arsip skill zip
    dengan `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit`,
    lalu menginstal dengan `skills.install({ source: "upload", ... })`. Jalur ini
    nonaktif secara default dan memerlukan `skills.install.allowUploadedArchives: true` di
    `openclaw.json`. Instalasi ClawHub normal tidak pernah memerlukan pengaturan tersebut.
  </Accordion>
</AccordionGroup>

## Keamanan

<Warning>
  Perlakukan Skills pihak ketiga sebagai **kode tidak tepercaya**. Baca sebelum mengaktifkan.
  Pilih eksekusi tersandbox untuk input tidak tepercaya dan alat berisiko. Lihat
  [Sandboxing](/id/gateway/sandboxing) untuk kontrol sisi agen.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Penemuan skill workspace, agen proyek, dan extra-dir hanya menerima root skill
    yang realpath hasil resolusinya tetap berada di dalam root yang dikonfigurasi, kecuali
    `skills.load.allowSymlinkTargets` secara eksplisit memercayai root target.
    Skill Workshop menulis melalui target tepercaya tersebut hanya ketika
    `skills.workshop.allowSymlinkTargetWrites` diaktifkan.
    `~/.openclaw/skills` terkelola dan `~/.agents/skills` personal dapat berisi
    folder skill symlink, tetapi setiap realpath `SKILL.md` tetap harus berada
    di dalam direktori skill hasil resolusinya.
  </Accordion>
  <Accordion title="Operator install policy">
    Konfigurasikan `security.installPolicy` untuk menjalankan perintah kebijakan lokal tepercaya
    sebelum instalasi skill berlanjut. Kebijakan menerima metadata dan path sumber
    yang disiapkan, berlaku untuk jalur ClawHub, unggahan, Git, lokal, pembaruan, dan
    dependency-installer, serta gagal tertutup ketika perintah tidak dapat mengembalikan
    keputusan yang valid.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan secret ke dalam
    proses **host** hanya untuk giliran agen tersebut — bukan ke dalam sandbox. Jauhkan
    secret dari prompt dan log.
  </Accordion>
</AccordionGroup>

Untuk model ancaman yang lebih luas dan checklist keamanan, lihat
[Keamanan](/id/gateway/security).

## Format SKILL.md

Setiap skill minimal memerlukan `name` dan `description` di frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw mengikuti spesifikasi [AgentSkills](https://agentskills.io).
  Parser frontmatter mendukung **hanya key satu baris** — `metadata` harus berupa
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
  Ketika `true`, OpenClaw tidak memasukkan instruksi skill ke prompt normal
  agen. Skill tetap tersedia sebagai slash command ketika `user-invocable`
  juga `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Ketika disetel ke `tool`, slash command melewati model dan mengirim
  langsung ke alat terdaftar.
</ParamField>

<ParamField path="command-tool" type="string">
  Nama alat yang akan dipanggil ketika `command-dispatch: tool` disetel.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Untuk dispatch alat, meneruskan string arg mentah ke alat tanpa
  parsing core. Alat menerima
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating

OpenClaw memfilter skills saat dimuat menggunakan `metadata.openclaw` (JSON satu baris
di frontmatter). Skill tanpa blok `metadata.openclaw` selalu
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
  Filter platform. Jika diatur, skill hanya memenuhi syarat pada OS yang tercantum.
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
  `metadata.openclaw` tidak ada, sehingga skills lama yang terinstal tetap mempertahankan
  gate dependensi dan petunjuk penginstalnya. Skills baru sebaiknya menggunakan
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
    - Ketika beberapa penginstal dicantumkan, gateway memilih satu opsi
      yang diprioritaskan (brew jika tersedia, jika tidak node).
    - Jika semua penginstal adalah `download`, OpenClaw mencantumkan setiap entri agar Anda dapat
      melihat semua artefak yang tersedia.
    - Spesifikasi dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter berdasarkan platform.
    - Instalasi Node mengikuti `skills.install.nodeManager` di `openclaw.json`
      (default: npm; opsi: npm / pnpm / yarn / bun). Ini hanya memengaruhi instalasi
      skill; runtime Gateway tetap harus Node.
    - Preferensi penginstal Gateway: Homebrew → uv → pengelola node yang dikonfigurasi →
      go → download.
  </Accordion>
  <Accordion title="Detail per penginstal">
    - **Homebrew:** OpenClaw tidak menginstal Homebrew secara otomatis atau menerjemahkan formula brew
      menjadi perintah paket sistem. Dalam container Linux tanpa
      `brew`, penginstal khusus brew disembunyikan; gunakan image kustom atau instal
      dependensi secara manual.
    - **Go:** jika `go` tidak ada dan `brew` tersedia, gateway menginstal
      Go melalui Homebrew terlebih dahulu dan mengatur `GOBIN` ke `bin` milik Homebrew.
    - **Download:** `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (default: otomatis saat arsip terdeteksi), `stripComponents`,
      `targetDir` (default: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Catatan sandboxing">
    `requires.bins` diperiksa pada **host** saat skill dimuat. Jika agent
    berjalan dalam sandbox, biner juga harus ada **di dalam container**.
    Instal melalui `agents.defaults.sandbox.docker.setupCommand` atau image
    kustom. `setupCommand` berjalan sekali setelah container dibuat dan membutuhkan
    egress jaringan, root FS yang dapat ditulis, dan pengguna root di sandbox.
  </Accordion>
</AccordionGroup>

## Override config

Aktifkan/nonaktifkan dan konfigurasikan skills yang dibundel atau dikelola di bawah `skills.entries` dalam
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
  `false` menonaktifkan skill bahkan ketika dibundel atau terinstal. Skill bawaan
  `coding-agent` bersifat opt-in — atur `skills.entries.coding-agent.enabled: true`
  dan pastikan salah satu dari `claude`, `codex`, `opencode`, atau CLI lain yang didukung
  telah terinstal dan diautentikasi.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Field kemudahan untuk skills yang mendeklarasikan `metadata.openclaw.primaryEnv`.
  Mendukung string plaintext atau objek SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variabel lingkungan yang diinjeksi untuk agent run. Hanya diinjeksi ketika
  variabel belum diatur dalam proses.
</ParamField>

<ParamField path="config" type="object">
  Bag opsional untuk field konfigurasi kustom per skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Allowlist opsional hanya untuk skills **bawaan**. Jika diatur, hanya skills bawaan
  dalam daftar yang memenuhi syarat. Skills terkelola dan workspace tidak terpengaruh.
</ParamField>

<Note>
  Key config cocok dengan **nama skill** secara default. Jika sebuah skill mendefinisikan
  `metadata.openclaw.skillKey`, gunakan key tersebut di bawah `skills.entries`. Beri tanda kutip
  pada nama bertanda hubung: JSON5 mengizinkan key yang dikutip.
</Note>

## Injeksi lingkungan

Saat agent run dimulai, OpenClaw:

<Steps>
  <Step title="Membaca metadata skill">
    OpenClaw menyelesaikan daftar skill efektif untuk agent, dengan menerapkan aturan gating,
    allowlist, dan override config.
  </Step>
  <Step title="Menginjeksi env dan API key">
    `skills.entries.<key>.env` dan `skills.entries.<key>.apiKey` diterapkan ke
    `process.env` selama run berlangsung.
  </Step>
  <Step title="Membangun system prompt">
    Skills yang memenuhi syarat dikompilasi menjadi blok XML ringkas dan diinjeksi ke dalam
    system prompt.
  </Step>
  <Step title="Memulihkan lingkungan">
    Setelah run berakhir, lingkungan asli dipulihkan.
  </Step>
</Steps>

<Warning>
  Injeksi env dibatasi pada agent run **host**, bukan sandbox. Di dalam
  sandbox, `env` dan `apiKey` tidak berpengaruh. Lihat
  [Config Skills](/id/tools/skills-config#sandboxed-skills-and-env-vars) untuk cara
  meneruskan secret ke run yang disandbox.
</Warning>

Untuk backend bawaan `claude-cli`, OpenClaw juga mematerialisasikan snapshot
skill yang sama-sama memenuhi syarat sebagai Plugin Claude Code sementara dan meneruskannya melalui
`--plugin-dir`. Backend CLI lain hanya menggunakan katalog prompt.

## Snapshot dan refresh

OpenClaw mengambil snapshot skills yang memenuhi syarat **saat sesi dimulai** dan menggunakan kembali
daftar tersebut untuk semua turn berikutnya dalam sesi. Perubahan pada skills atau config berlaku
pada sesi baru berikutnya.

Skills di-refresh di tengah sesi dalam dua kasus:

- Watcher skills mendeteksi perubahan `SKILL.md`.
- Node remote baru yang memenuhi syarat terhubung.

Daftar yang di-refresh digunakan pada turn agent berikutnya. Jika allowlist agent efektif
berubah, OpenClaw me-refresh snapshot agar skills yang terlihat tetap selaras.

<AccordionGroup>
  <Accordion title="Watcher Skills">
    Secara default, OpenClaw memantau folder skill dan memperbarui snapshot ketika
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

    Gunakan `allowSymlinkTargets` untuk layout symlink yang disengaja saat symlink root
    skill menunjuk ke luar root yang dikonfigurasi, misalnya
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Aktifkan `skills.workshop.allowSymlinkTargetWrites` hanya ketika Skill Workshop
    juga harus menerapkan proposal melalui path symlink tepercaya tersebut.

  </Accordion>
  <Accordion title="Node macOS remote (gateway Linux)">
    Jika Gateway berjalan di Linux tetapi **node macOS** terhubung dengan
    `system.run` diizinkan, OpenClaw dapat memperlakukan skills khusus macOS sebagai memenuhi syarat ketika
    biner yang diperlukan tersedia pada node tersebut. Agent harus menjalankan
    skills tersebut melalui tool `exec` dengan `host=node`.

    Node offline **tidak** membuat skills khusus remote terlihat. Jika sebuah node berhenti
    menjawab probe bin, OpenClaw menghapus kecocokan bin yang di-cache.

  </Accordion>
</AccordionGroup>

## Dampak token

Ketika skills memenuhi syarat, OpenClaw menginjeksi blok XML ringkas ke dalam system
prompt. Biayanya deterministik:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Overhead dasar** (hanya saat ≥ 1 skill): ~195 karakter
- **Per skill:** ~97 karakter + panjang field `name`, `description`, dan `location` Anda
- Escaping XML memperluas `& < > " '` menjadi entitas, menambahkan beberapa karakter per kemunculan
- Pada ~4 karakter/token, 97 karakter ≈ 24 token per skill sebelum panjang field

Jaga deskripsi tetap pendek dan deskriptif untuk meminimalkan overhead prompt.

## Terkait

<CardGroup cols={2}>
  <Card title="Membuat skills" href="/id/tools/creating-skills" icon="hammer">
    Panduan langkah demi langkah untuk membuat skill kustom.
  </Card>
  <Card title="Skill Workshop" href="/id/tools/skill-workshop" icon="flask">
    Antrean proposal untuk skills yang dirancang agent.
  </Card>
  <Card title="Config Skills" href="/id/tools/skills-config" icon="gear">
    Skema config `skills.*` lengkap dan allowlist agent.
  </Card>
  <Card title="Perintah slash" href="/id/tools/slash-commands" icon="terminal">
    Cara perintah slash skill didaftarkan dan dirutekan.
  </Card>
  <Card title="ClawHub" href="/id/clawhub" icon="cloud">
    Jelajahi dan publikasikan skills di registry publik.
  </Card>
  <Card title="Plugin" href="/id/tools/plugin" icon="plug">
    Plugin dapat mengirimkan skills bersama tool yang didokumentasikannya.
  </Card>
</CardGroup>
