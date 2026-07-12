---
read_when:
    - Menambahkan atau memodifikasi Skills
    - Mengubah pembatasan Skills, daftar izin, atau aturan pemuatan
    - Memahami prioritas Skills dan perilaku snapshot
sidebarTitle: Skills
summary: Skills mengajarkan agen Anda cara menggunakan alat. Pelajari cara Skills dimuat, cara kerja prioritas, serta cara mengonfigurasi pembatasan, daftar izin, dan injeksi lingkungan.
title: Skills
x-i18n:
    generated_at: "2026-07-12T14:46:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills adalah file instruksi markdown yang mengajarkan kepada agen cara dan waktu menggunakan
alat. Setiap skill berada dalam direktori yang berisi file `SKILL.md` dengan
frontmatter YAML dan isi markdown. OpenClaw memuat skill bawaan beserta
penggantian lokal, lalu memfilternya saat pemuatan berdasarkan lingkungan,
konfigurasi, dan keberadaan biner.

<CardGroup cols={2}>
  <Card title="Membuat skill" href="/id/tools/creating-skills" icon="hammer">
    Buat dan uji skill khusus dari awal.
  </Card>
  <Card title="Lokakarya Skill" href="/id/tools/skill-workshop" icon="flask">
    Tinjau dan setujui usulan skill yang disusun agen.
  </Card>
  <Card title="Konfigurasi skill" href="/id/tools/skills-config" icon="gear">
    Skema konfigurasi `skills.*` lengkap dan daftar izin agen.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Jelajahi dan instal skill komunitas.
  </Card>
</CardGroup>

## Urutan pemuatan

OpenClaw memuat dari sumber berikut, dengan **prioritas tertinggi terlebih dahulu**. Jika nama
skill yang sama muncul di beberapa tempat, sumber dengan prioritas tertinggi yang digunakan.

| Prioritas       | Sumber                     | Jalur                                   |
| --------------- | -------------------------- | --------------------------------------- |
| 1 — tertinggi   | Skill ruang kerja          | `<workspace>/skills`                    |
| 2               | Skill agen proyek          | `<workspace>/.agents/skills`            |
| 3               | Skill agen pribadi         | `~/.agents/skills`                      |
| 4               | Skill terkelola / lokal    | `~/.openclaw/skills`                    |
| 5               | Skill bawaan               | disertakan bersama instalasi            |
| 6 — terendah    | Direktori tambahan         | `skills.load.extraDirs` + skill plugin  |

Akar skill mendukung tata letak berkelompok. OpenClaw menemukan skill setiap kali
`SKILL.md` muncul di mana pun di bawah akar yang dikonfigurasi (hingga kedalaman 6 tingkat):

```text
<workspace>/skills/research/SKILL.md          ✓ ditemukan sebagai "research"
<workspace>/skills/personal/research/SKILL.md ✓ juga ditemukan sebagai "research"
```

Jalur folder hanya untuk pengorganisasian. Nama skill dan perintah garis miring
berasal dari kolom frontmatter `name` (atau nama direktori jika `name`
tidak ada). Daftar izin agen (di bawah) juga mencocokkan berdasarkan `name` ini.

<Note>
  Direktori asli `$CODEX_HOME/skills` milik Codex CLI **bukan** akar skill
  OpenClaw. Gunakan `openclaw migrate plan codex` untuk menginventarisasi skill tersebut, lalu
  `openclaw migrate codex` untuk menyalinnya ke ruang kerja OpenClaw Anda.
</Note>

## Skill yang dihoskan Node

Node tanpa antarmuka yang terhubung dapat menerbitkan skill yang terinstal di direktori skill
OpenClaw aktifnya (`~/.openclaw/skills` secara default; penggantian lingkungan profil
berlaku). Skill tersebut muncul dalam daftar skill agen biasa selama Node terhubung
dan menghilang ketika koneksi terputus. Skill lokal atau Gateway mempertahankan namanya jika
terjadi benturan; skill Node menerima nama deterministik dengan prefiks Node.
Skill yang dihoskan Node v1 mengharuskan nama direktori cocok dengan kolom frontmatter
`name` milik skill.

Entri skill menyertakan pencari lokasi Node. File, referensi relatif, dan
binernya berada di Node, jadi muat dan jalankan dengan
`exec host=node node=<node-id>`. Mulai ulang hos Node setelah mengubah file
skill-nya. Lihat [Node](/id/nodes#node-hosted-skills) untuk pemasangan dan mekanisme penonaktifan.

## Skill per agen dan bersama

Dalam penyiapan multiagen, setiap agen memiliki ruang kerjanya sendiri. Gunakan jalur yang
sesuai dengan visibilitas yang Anda inginkan:

| Cakupan         | Jalur                        | Terlihat oleh                       |
| --------------- | ---------------------------- | ----------------------------------- |
| Per agen        | `<workspace>/skills`         | Hanya agen tersebut                 |
| Agen proyek     | `<workspace>/.agents/skills` | Hanya agen ruang kerja tersebut     |
| Agen pribadi    | `~/.agents/skills`           | Semua agen pada mesin ini           |
| Terkelola bersama | `~/.openclaw/skills`       | Semua agen pada mesin ini           |
| Direktori tambahan | `skills.load.extraDirs`   | Semua agen pada mesin ini           |

## Daftar izin agen

**Lokasi** skill (prioritas) dan **visibilitas** skill (agen mana yang dapat
menggunakannya) merupakan kontrol terpisah. Gunakan daftar izin untuk membatasi skill yang dilihat agen,
terlepas dari asal pemuatannya.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // dasar bersama
    },
    list: [
      { id: "writer" }, // mewarisi github, weather
      { id: "docs", skills: ["docs-search"] }, // mengganti nilai bawaan sepenuhnya
      { id: "locked-down", skills: [] }, // tanpa skill
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Aturan daftar izin">
    - Hilangkan `agents.defaults.skills` agar semua skill tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
    - Atur `agents.list[].skills: []` agar tidak mengekspos skill apa pun kepada agen tersebut.
    - Daftar `agents.list[].skills` yang tidak kosong merupakan kumpulan **akhir** — daftar ini tidak
      digabungkan dengan nilai bawaan.
    - Daftar izin efektif berlaku pada pembuatan prompt, penemuan perintah garis miring,
      sinkronisasi sandbox, dan rekam jepret skill.
    - Ini bukan batas otorisasi shell hos. Jika agen yang sama dapat
      menggunakan `exec`, batasi shell tersebut secara terpisah dengan sandbox, isolasi
      pengguna OS, daftar tolak/izin eksekusi, dan kredensial per sumber daya.
  </Accordion>
</AccordionGroup>

## Plugin dan skill

Plugin dapat menyertakan skill sendiri dengan mencantumkan direktori `skills` dalam
`openclaw.plugin.json` (jalur relatif terhadap akar plugin). Skill plugin dimuat
ketika plugin diaktifkan — misalnya, plugin peramban menyertakan skill
`browser-automation` untuk kontrol peramban bertahap.

Direktori skill plugin digabungkan pada tingkat prioritas rendah yang sama dengan
`skills.load.extraDirs`, sehingga skill bawaan, terkelola, agen, atau ruang kerja
dengan nama yang sama akan menggantikannya. Batasi kelayakan skill plugin itu sendiri melalui
`metadata.openclaw.requires` dalam frontmatter-nya, sama seperti skill lainnya.

Lihat [Plugin](/id/tools/plugin) dan [Alat](/id/tools) untuk sistem plugin lengkap.

## Lokakarya Skill

[Lokakarya Skill](/id/tools/skill-workshop) adalah antrean usulan antara agen
dan file skill aktif Anda. Ketika agen menemukan pekerjaan yang dapat digunakan kembali, agen menyusun
usulan alih-alih menulis langsung ke `SKILL.md`. Anda meninjau dan menyetujuinya
sebelum ada perubahan.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Lihat [Lokakarya Skill](/id/tools/skill-workshop) untuk siklus hidup lengkap, referensi
CLI, dan konfigurasi.

## Menginstal dari ClawHub

[ClawHub](https://clawhub.ai) adalah registri skill publik. Gunakan perintah
`openclaw skills` untuk menginstal dan memperbarui, atau CLI `clawhub` untuk
menerbitkan dan menyinkronkan.

| Tindakan                                  | Perintah                                               |
| ----------------------------------------- | ------------------------------------------------------ |
| Instal skill ke ruang kerja               | `openclaw skills install @owner/<slug>`                |
| Instal dari repositori Git                | `openclaw skills install git:owner/repo@ref`           |
| Instal direktori skill lokal              | `openclaw skills install ./path/to/skill --as my-tool` |
| Instal untuk semua agen lokal             | `openclaw skills install @owner/<slug> --global`       |
| Perbarui semua skill ruang kerja          | `openclaw skills update --all`                         |
| Perbarui skill terkelola bersama          | `openclaw skills update @owner/<slug> --global`        |
| Perbarui semua skill terkelola bersama    | `openclaw skills update --all --global`                |
| Verifikasi lingkup kepercayaan skill      | `openclaw skills verify @owner/<slug>`                 |
| Cetak Kartu Skill yang dihasilkan         | `openclaw skills verify @owner/<slug> --card`          |
| Terbitkan / sinkronkan melalui CLI ClawHub | `clawhub sync --all`                                  |

<AccordionGroup>
  <Accordion title="Detail instalasi">
    `openclaw skills install` menginstal ke direktori `skills/` ruang kerja aktif
    secara default. Tambahkan `--global` untuk menginstal ke direktori bersama
    `~/.openclaw/skills`, yang terlihat oleh semua agen lokal kecuali dibatasi oleh
    daftar izin agen.

    Instalasi Git dan lokal mengharapkan `SKILL.md` di akar sumber. Slug berasal
    dari frontmatter `name` di `SKILL.md` jika valid, lalu menggunakan nama
    direktori atau repositori sebagai alternatif. Gunakan `--as <slug>` untuk menggantinya.
    `openclaw skills update` hanya melacak instalasi ClawHub — instal ulang sumber Git atau
    lokal untuk memperbaruinya.

  </Accordion>
  <Accordion title="Verifikasi dan pemindaian keamanan">
    `openclaw skills verify @owner/<slug>` meminta lingkup kepercayaan
    `clawhub.skill.verify.v1` milik skill kepada ClawHub. Skill ClawHub yang terinstal diverifikasi
    berdasarkan versi dan registri yang tercatat dalam `.clawhub/origin.json`.
    Slug tanpa pemilik tetap diterima untuk skill terinstal yang sudah ada atau tidak ambigu, tetapi
    referensi dengan pemilik mencegah ambiguitas penerbit.

    Halaman skill ClawHub menampilkan status pemindaian keamanan terbaru sebelum instalasi,
    dengan halaman detail untuk VirusTotal, ClawScan, dan analisis statis. Perintah
    keluar dengan kode bukan nol ketika ClawHub menandai verifikasi sebagai gagal. Penerbit
    dapat memulihkan hasil positif palsu melalui dasbor ClawHub atau
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalasi arsip privat">
    Klien Gateway yang memerlukan pengiriman non-ClawHub dapat menyiapkan arsip skill zip
    dengan `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit`,
    lalu menginstalnya dengan `skills.install({ source: "upload", ... })`. Jalur ini
    dinonaktifkan secara default dan memerlukan `skills.install.allowUploadedArchives: true` dalam
    `openclaw.json`. Instalasi ClawHub biasa tidak pernah memerlukan pengaturan tersebut.
  </Accordion>
</AccordionGroup>

## Keamanan

<Warning>
  Perlakukan skill pihak ketiga sebagai **kode yang tidak tepercaya**. Bacalah sebelum mengaktifkannya.
  Utamakan eksekusi dalam sandbox untuk masukan tidak tepercaya dan alat berisiko. Lihat
  [Sandbox](/id/gateway/sandboxing) untuk kontrol sisi agen.
</Warning>

<AccordionGroup>
  <Accordion title="Pembatasan jalur">
    Penemuan skill ruang kerja, agen proyek, dan direktori tambahan hanya menerima akar skill
    yang realpath terselesaikannya tetap berada di dalam akar yang dikonfigurasi, kecuali
    `skills.load.allowSymlinkTargets` secara eksplisit memercayai akar target.
    Lokakarya Skill menulis melalui target tepercaya tersebut hanya ketika
    `skills.workshop.allowSymlinkTargetWrites` diaktifkan.
    Direktori terkelola `~/.openclaw/skills` dan pribadi `~/.agents/skills` dapat berisi
    folder skill yang ditautkan secara simbolis, tetapi realpath setiap `SKILL.md` tetap harus berada
    di dalam direktori skill terselesaikannya.
  </Accordion>
  <Accordion title="Kebijakan instalasi operator">
    Konfigurasikan `security.installPolicy` untuk menjalankan perintah kebijakan lokal tepercaya
    sebelum instalasi skill dilanjutkan. Kebijakan menerima metadata dan jalur sumber
    yang telah disiapkan, berlaku untuk jalur ClawHub, unggahan, Git, lokal, pembaruan, dan
    penginstal dependensi, serta gagal secara tertutup ketika perintah tidak dapat mengembalikan
    keputusan yang valid.
  </Accordion>
  <Accordion title="Cakupan injeksi rahasia">
    `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan rahasia ke dalam proses
    **hos** hanya untuk giliran agen tersebut — bukan ke dalam sandbox. Jangan sertakan
    rahasia dalam prompt dan log.
  </Accordion>
</AccordionGroup>

Untuk model ancaman dan daftar periksa keamanan yang lebih luas, lihat
[Keamanan](/id/gateway/security).

## Format SKILL.md

Setiap skill setidaknya memerlukan `name` dan `description` dalam frontmatter:

```markdown
---
name: image-lab
description: Menghasilkan atau mengedit gambar melalui alur kerja gambar yang didukung penyedia
---

Ketika pengguna meminta untuk menghasilkan gambar, gunakan alat `image_generate`...
```

<Note>
  OpenClaw mengikuti spesifikasi [AgentSkills](https://agentskills.io). Frontmatter
  pertama-tama diuraikan sebagai YAML; jika gagal, sistem beralih ke pengurai
  yang hanya mendukung satu baris. Blok `metadata` bertingkat (termasuk pemetaan
  YAML multibaris) diratakan menjadi string JSON dan diuraikan ulang sebagai
  JSON5, sehingga bentuk blok yang ditampilkan pada [Pembatasan](#gating)
  berfungsi. Gunakan `{baseDir}` dalam isi untuk merujuk ke jalur folder skill.
</Note>

### Kunci frontmatter opsional

<ParamField path="homepage" type="string">
  URL yang ditampilkan sebagai "Website" di antarmuka Skills macOS. Juga
  didukung melalui `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Jika `true`, skill diekspos sebagai perintah garis miring yang dapat dipanggil
  pengguna.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Jika `true`, OpenClaw tidak menyertakan instruksi skill dalam prompt normal
  agen. Skill tetap tersedia sebagai perintah garis miring jika `user-invocable`
  juga bernilai `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Jika ditetapkan ke `tool`, perintah garis miring melewati model dan diteruskan
  langsung ke alat yang terdaftar.
</ParamField>

<ParamField path="command-tool" type="string">
  Nama alat yang akan dipanggil ketika `command-dispatch: tool` ditetapkan.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Untuk penerusan ke alat, meneruskan string argumen mentah ke alat tanpa
  penguraian inti. Alat menerima
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Pembatasan

OpenClaw memfilter skill pada waktu pemuatan menggunakan `metadata.openclaw`
(objek JSON5 yang disematkan dalam frontmatter, lihat catatan penguraian di
atas). Skill tanpa blok `metadata.openclaw` selalu memenuhi syarat kecuali
dinonaktifkan secara eksplisit.

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
  Jika `true`, selalu sertakan skill dan lewati semua pembatas lainnya.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opsional yang ditampilkan di antarmuka Skills macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opsional yang ditampilkan sebagai "Website" di antarmuka Skills macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Filter platform. Jika ditetapkan, skill hanya memenuhi syarat pada OS yang
  tercantum.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Setiap berkas biner harus tersedia di `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Setidaknya satu berkas biner harus tersedia di `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Setiap variabel lingkungan harus tersedia dalam proses atau disediakan
  melalui konfigurasi.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Setiap jalur `openclaw.json` harus bernilai benar.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nama variabel lingkungan yang terkait dengan `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Spesifikasi penginstal opsional yang digunakan oleh antarmuka Skills macOS
  (brew / node / go / uv / download).
</ParamField>

<Note>
  Blok lama `metadata.clawdbot` masih diterima jika `metadata.openclaw` tidak
  tersedia, sehingga skill lama yang telah terinstal tetap mempertahankan
  pembatas dependensi dan petunjuk penginstalnya. Skill baru sebaiknya
  menggunakan `metadata.openclaw`.
</Note>

### Spesifikasi penginstal

Spesifikasi penginstal memberi tahu antarmuka Skills macOS cara menginstal
dependensi:

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
    - Jika beberapa penginstal dicantumkan, Gateway memilih satu opsi yang
      diutamakan (brew jika tersedia, jika tidak node).
    - Jika semua penginstal adalah `download`, OpenClaw mencantumkan setiap
      entri agar Anda dapat melihat semua artefak yang tersedia.
    - Spesifikasi dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk
      memfilter berdasarkan platform.
    - Instalasi Node mengikuti `skills.install.nodeManager` di `openclaw.json`
      (bawaan: npm; opsi: npm / pnpm / yarn / bun). Ini hanya memengaruhi
      instalasi skill; runtime Gateway harus tetap menggunakan Node.
    - Urutan preferensi penginstal Gateway: Homebrew → uv → pengelola node yang
      dikonfigurasi → go → unduhan.
  </Accordion>
  <Accordion title="Detail per penginstal">
    - **Homebrew:** OpenClaw tidak menginstal Homebrew secara otomatis atau
      menerjemahkan formula brew menjadi perintah paket sistem. Dalam kontainer
      Linux tanpa `brew`, penginstal yang hanya mendukung brew disembunyikan;
      gunakan image khusus atau instal dependensinya secara manual.
    - **Go:** OpenClaw memerlukan Go 1.21 atau yang lebih baru untuk instalasi
      skill otomatis. Jika `go` tidak tersedia dan Homebrew tersedia, OpenClaw
      menginstal Go melalui Homebrew terlebih dahulu; pada Linux tanpa Homebrew,
      OpenClaw dapat menggunakan `apt-get` sebagai root atau melalui `sudo`
      tanpa kata sandi jika kandidat `golang-go` yang telah diperbarui memenuhi
      versi minimum. Perintah `go install` sebenarnya untuk dependensi selalu
      menargetkan direktori bin khusus yang dikelola OpenClaw (`bin` milik
      Homebrew pada instalasi baru, jika tidak `~/.local/bin`), bukan `GOBIN`
      yang Anda konfigurasikan — variabel lingkungan `GOBIN`, `GOPATH`, dan
      `GOTOOLCHAIN` milik Anda dibaca tetapi tidak pernah ditimpa.
    - **Unduhan:** `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (bawaan: otomatis ketika arsip terdeteksi), `stripComponents`,
      `targetDir` (bawaan: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Catatan sandbox">
    `requires.bins` diperiksa pada **host** saat skill dimuat. Jika agen
    berjalan dalam sandbox, berkas biner juga harus tersedia **di dalam
    kontainer**. Instal melalui `agents.defaults.sandbox.docker.setupCommand`
    atau image khusus. `setupCommand` dijalankan sekali setelah kontainer dibuat
    dan memerlukan akses jaringan keluar, sistem berkas root yang dapat
    ditulisi, serta pengguna root di sandbox.
  </Accordion>
</AccordionGroup>

## Penimpaan konfigurasi

Aktifkan/nonaktifkan dan konfigurasikan skill bawaan atau terkelola di bawah
`skills.entries` dalam `~/.openclaw/openclaw.json`:

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
  `false` menonaktifkan skill meskipun skill tersebut dibundel atau terinstal.
  Skill bawaan `coding-agent` bersifat ikut-serta — tetapkan
  `skills.entries.coding-agent.enabled: true` dan pastikan salah satu dari
  `claude`, `codex`, `opencode`, atau CLI lain yang didukung telah terinstal dan
  terautentikasi.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Kolom praktis untuk skill yang mendeklarasikan
  `metadata.openclaw.primaryEnv`. Mendukung string teks biasa atau objek
  SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variabel lingkungan yang disuntikkan untuk eksekusi agen. Hanya disuntikkan
  jika variabel belum ditetapkan dalam proses.
</ParamField>

<ParamField path="config" type="object">
  Kumpulan opsional untuk kolom konfigurasi khusus per skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Daftar izin opsional yang hanya berlaku untuk skill **bawaan**. Jika
  ditetapkan, hanya skill bawaan dalam daftar yang memenuhi syarat. Skill
  terkelola dan ruang kerja tidak terpengaruh.
</ParamField>

<Note>
  Secara bawaan, kunci konfigurasi cocok dengan **nama skill**. Jika skill
  mendefinisikan `metadata.openclaw.skillKey`, gunakan kunci tersebut di bawah
  `skills.entries`. Apit nama yang mengandung tanda hubung dengan tanda kutip:
  JSON5 mengizinkan kunci yang diapit tanda kutip.
</Note>

## Penyuntikan lingkungan

Saat eksekusi agen dimulai, OpenClaw:

<Steps>
  <Step title="Membaca metadata skill">
    OpenClaw menentukan daftar skill efektif untuk agen dengan menerapkan aturan
    pembatasan, daftar izin, dan penimpaan konfigurasi.
  </Step>
  <Step title="Menyuntikkan variabel lingkungan dan kunci API">
    `skills.entries.<key>.env` dan `skills.entries.<key>.apiKey` diterapkan ke
    `process.env` selama eksekusi berlangsung.
  </Step>
  <Step title="Menyusun prompt sistem">
    Skill yang memenuhi syarat dikompilasi menjadi blok XML ringkas dan
    disuntikkan ke prompt sistem.
  </Step>
  <Step title="Memulihkan lingkungan">
    Setelah eksekusi berakhir, lingkungan asli dipulihkan.
  </Step>
</Steps>

<Warning>
  Penyuntikan variabel lingkungan dibatasi pada eksekusi agen di **host**, bukan
  sandbox. Di dalam sandbox, `env` dan `apiKey` tidak berpengaruh. Lihat
  [Konfigurasi Skills](/id/tools/skills-config#sandboxed-skills-and-env-vars) untuk
  mengetahui cara meneruskan rahasia ke eksekusi dalam sandbox.
</Warning>

Untuk backend bawaan `claude-cli`, OpenClaw juga mewujudkan snapshot skill yang
memenuhi syarat yang sama sebagai plugin Claude Code sementara dan
meneruskannya melalui `--plugin-dir`. Backend CLI lainnya hanya menggunakan
katalog prompt.

## Snapshot dan penyegaran

OpenClaw mengambil snapshot skill yang memenuhi syarat **ketika sesi dimulai**
dan menggunakan kembali daftar tersebut untuk semua giliran berikutnya dalam
sesi. Perubahan pada skill atau konfigurasi berlaku pada sesi baru berikutnya.

Skills disegarkan di tengah sesi dalam dua kasus:

- Pemantau skill mendeteksi perubahan `SKILL.md`.
- Node jarak jauh baru yang memenuhi syarat terhubung.

Daftar yang telah disegarkan digunakan pada giliran agen berikutnya. Jika
daftar izin agen efektif berubah, OpenClaw menyegarkan snapshot agar skill yang
terlihat tetap selaras.

<AccordionGroup>
  <Accordion title="Pemantau Skills">
    Secara bawaan, OpenClaw memantau folder skill dan memperbarui snapshot
    ketika berkas `SKILL.md` berubah. Konfigurasikan di bawah `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    Gunakan `allowSymlinkTargets` untuk tata letak symlink yang disengaja ketika
    symlink root skill mengarah ke luar root yang dikonfigurasi, misalnya
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Aktifkan `skills.workshop.allowSymlinkTargetWrites` hanya jika Skill Workshop
    juga harus menerapkan usulan melalui jalur symlink tepercaya tersebut.

  </Accordion>
  <Accordion title="Node macOS jarak jauh (Gateway Linux)">
    Jika Gateway berjalan di Linux tetapi **Node macOS** terhubung dengan
    `system.run` yang diizinkan, OpenClaw dapat menganggap skill khusus macOS
    memenuhi syarat ketika berkas biner yang diperlukan tersedia pada Node
    tersebut. Agen harus menjalankan skill tersebut melalui alat `exec` dengan
    `host=node`.

    Node luring **tidak** membuat skill khusus jarak jauh terlihat. Jika Node
    berhenti merespons pemeriksaan berkas biner, OpenClaw menghapus kecocokan
    berkas biner yang tersimpan dalam cache.

  </Accordion>
</AccordionGroup>

## Dampak token

Ketika skill memenuhi syarat, OpenClaw menyuntikkan blok XML ringkas ke dalam
prompt sistem. Biayanya deterministik dan meningkat secara linear untuk setiap
skill:

- **Overhead dasar** (hanya jika 1+ skill memenuhi syarat): blok tetap berisi
  prosa pengantar serta pembungkus `<available_skills>`.
- **Per skill:** ~97 karakter + panjang kolom `name`, `description`, dan
  `location` Anda.
- Pengalihan XML mengubah `& < > " '` menjadi entitas, sehingga menambahkan
  beberapa karakter untuk setiap kemunculan.
- Dengan ~4 karakter/token, 97 karakter ≈ 24 token per skill sebelum panjang
  kolom diperhitungkan.

Jika blok yang dirender akan melampaui anggaran prompt yang dikonfigurasi
(`skills.limits.maxSkillsPromptChars`), OpenClaw terlebih dahulu mempertahankan sebanyak mungkin
identitas skill (nama, lokasi, dan versi) yang dapat dimuat oleh format ringkas
tanpa deskripsi. Setelah itu, OpenClaw menggunakan sisa anggaran untuk deskripsi yang dipersingkat. Jika tidak ada
anggaran deskripsi yang tersisa, deskripsi dihilangkan. Prompt menyertakan
catatan yang mengarahkan ke `openclaw skills check` setiap kali pemformatan ringkas atau pemotongan
daftar diperlukan.

Buat deskripsi tetap singkat dan informatif untuk meminimalkan beban tambahan prompt.

## Terkait

<CardGroup cols={2}>
  <Card title="Membuat skill" href="/id/tools/creating-skills" icon="hammer">
    Panduan langkah demi langkah untuk membuat skill khusus.
  </Card>
  <Card title="Lokakarya Skill" href="/id/tools/skill-workshop" icon="flask">
    Antrean proposal untuk skill yang disusun oleh agen.
  </Card>
  <Card title="Konfigurasi Skills" href="/id/tools/skills-config" icon="gear">
    Skema konfigurasi `skills.*` lengkap dan daftar izin agen.
  </Card>
  <Card title="Perintah garis miring" href="/id/tools/slash-commands" icon="terminal">
    Cara perintah garis miring skill didaftarkan dan dirutekan.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Jelajahi dan publikasikan skill di registri publik.
  </Card>
  <Card title="Plugin" href="/id/tools/plugin" icon="plug">
    Plugin dapat menyertakan skill bersama alat yang didokumentasikannya.
  </Card>
</CardGroup>
