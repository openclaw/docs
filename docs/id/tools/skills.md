---
read_when:
    - Menambahkan atau memodifikasi Skills
    - Mengubah pembatasan Skills, daftar izin, atau aturan pemuatan
    - Memahami prioritas Skills dan perilaku cuplikan
sidebarTitle: Skills
summary: 'Skills: terkelola vs ruang kerja, aturan pembatasan, daftar izin agen, dan pengkabelan konfigurasi'
title: Skills
x-i18n:
    generated_at: "2026-04-30T10:17:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw menggunakan folder keterampilan yang **kompatibel dengan [AgentSkills](https://agentskills.io)** untuk mengajarkan agen cara menggunakan alat. Setiap keterampilan adalah direktori yang berisi `SKILL.md` dengan frontmatter YAML dan instruksi. OpenClaw memuat keterampilan bawaan serta override lokal opsional, lalu memfilternya saat pemuatan berdasarkan lingkungan, konfigurasi, dan keberadaan biner.

## Lokasi dan presedensi

OpenClaw memuat keterampilan dari sumber berikut, **presedensi tertinggi terlebih dahulu**:

| #   | Sumber                    | Path                             |
| --- | ------------------------- | -------------------------------- |
| 1   | Keterampilan ruang kerja  | `<workspace>/skills`             |
| 2   | Keterampilan agen proyek  | `<workspace>/.agents/skills`     |
| 3   | Keterampilan agen pribadi | `~/.agents/skills`               |
| 4   | Keterampilan terkelola/lokal | `~/.openclaw/skills`          |
| 5   | Keterampilan bawaan       | dikirim bersama instalasi        |
| 6   | Folder keterampilan tambahan | `skills.load.extraDirs` (konfigurasi) |

Jika nama keterampilan bentrok, sumber tertinggi yang menang.

## Keterampilan per agen vs bersama

Dalam penyiapan **multi-agen**, setiap agen memiliki ruang kerjanya sendiri:

| Cakupan              | Path                                        | Terlihat oleh                  |
| -------------------- | ------------------------------------------- | ----------------------------- |
| Per agen             | `<workspace>/skills`                        | Hanya agen tersebut           |
| Agen proyek          | `<workspace>/.agents/skills`                | Hanya agen ruang kerja itu    |
| Agen pribadi         | `~/.agents/skills`                          | Semua agen di mesin itu       |
| Bersama terkelola/lokal | `~/.openclaw/skills`                     | Semua agen di mesin itu       |
| Direktori tambahan bersama | `skills.load.extraDirs` (presedensi terendah) | Semua agen di mesin itu |

Nama yang sama di beberapa tempat → sumber tertinggi yang menang. Ruang kerja mengalahkan agen proyek, mengalahkan agen pribadi, mengalahkan terkelola/lokal, mengalahkan bawaan, mengalahkan direktori tambahan.

## Daftar izin keterampilan agen

**Lokasi** keterampilan dan **visibilitas** keterampilan adalah kontrol yang terpisah. Lokasi/presedensi menentukan salinan mana dari keterampilan bernama sama yang menang; daftar izin agen menentukan keterampilan mana yang benar-benar dapat digunakan agen.

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
    - Hilangkan `agents.defaults.skills` agar keterampilan tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
    - Tetapkan `agents.list[].skills: []` agar tidak ada keterampilan.
    - Daftar `agents.list[].skills` yang tidak kosong adalah set **final** untuk agen tersebut — daftar ini tidak digabungkan dengan default.
    - Daftar izin efektif berlaku di seluruh pembuatan prompt, penemuan perintah slash keterampilan, sinkronisasi sandbox, dan snapshot keterampilan.
  </Accordion>
</AccordionGroup>

## Plugin dan keterampilan

Plugin dapat mengirimkan keterampilannya sendiri dengan mencantumkan direktori `skills` di `openclaw.plugin.json` (path relatif terhadap root Plugin). Keterampilan Plugin dimuat saat Plugin diaktifkan. Ini adalah tempat yang tepat untuk panduan operasi khusus alat yang terlalu panjang untuk deskripsi alat tetapi harus tersedia kapan pun Plugin diinstal — misalnya, Plugin browser mengirimkan keterampilan `browser-automation` untuk kontrol browser multi-langkah.

Direktori keterampilan Plugin digabungkan ke path berpresedensi rendah yang sama seperti `skills.load.extraDirs`, jadi keterampilan bawaan, terkelola, agen, atau ruang kerja dengan nama sama akan menimpanya. Anda dapat membatasinya melalui `metadata.openclaw.requires.config` pada entri konfigurasi Plugin.

Lihat [Plugin](/id/tools/plugin) untuk penemuan/konfigurasi dan [Alat](/id/tools) untuk permukaan alat yang diajarkan oleh keterampilan tersebut.

## Lokakarya Keterampilan

Plugin **Lokakarya Keterampilan** yang opsional dan eksperimental dapat membuat atau memperbarui keterampilan ruang kerja dari prosedur pakai ulang yang diamati selama kerja agen. Plugin ini dinonaktifkan secara default dan harus diaktifkan secara eksplisit melalui `plugins.entries.skill-workshop`.

Lokakarya Keterampilan hanya menulis ke `<workspace>/skills`, memindai konten yang dihasilkan, mendukung persetujuan tertunda atau penulisan aman otomatis, mengarantina proposal yang tidak aman, dan menyegarkan snapshot keterampilan setelah penulisan berhasil sehingga keterampilan baru tersedia tanpa memulai ulang Gateway.

Gunakan untuk koreksi seperti _"lain kali, verifikasi atribusi GIF"_ atau alur kerja yang diperoleh dengan susah payah seperti daftar periksa QA media. Mulailah dengan persetujuan tertunda; gunakan penulisan otomatis hanya di ruang kerja tepercaya setelah meninjau proposalnya. Panduan lengkap: [Plugin Lokakarya Keterampilan](/id/plugins/skill-workshop).

## ClawHub (instal dan sinkronkan)

[ClawHub](https://clawhub.ai) adalah registri keterampilan publik untuk OpenClaw. Gunakan perintah native `openclaw skills` untuk menemukan/menginstal/memperbarui, atau CLI `clawhub` terpisah untuk alur kerja publikasi/sinkronisasi. Panduan lengkap: [ClawHub](/id/tools/clawhub).

| Tindakan                          | Perintah                               |
| --------------------------------- | ------------------------------------- |
| Instal keterampilan ke ruang kerja | `openclaw skills install <skill-slug>` |
| Perbarui semua keterampilan terinstal | `openclaw skills update --all`      |
| Sinkronkan (pindai + publikasikan pembaruan) | `clawhub sync --all`        |

`openclaw skills install` native menginstal ke direktori `skills/` ruang kerja aktif. CLI `clawhub` terpisah juga menginstal ke `./skills` di bawah direktori kerja Anda saat ini (atau fallback ke ruang kerja OpenClaw yang dikonfigurasi). OpenClaw mengambilnya sebagai `<workspace>/skills` pada sesi berikutnya.
Root keterampilan yang dikonfigurasi juga mendukung satu level pengelompokan, seperti `skills/<group>/<skill>/SKILL.md`, sehingga keterampilan pihak ketiga yang terkait dapat disimpan di bawah folder bersama tanpa pemindaian rekursif yang luas.

Halaman keterampilan ClawHub menampilkan status pemindaian keamanan terbaru sebelum instalasi, dengan halaman detail pemindai untuk VirusTotal, ClawScan, dan analisis statis. `openclaw skills install <slug>` tetap hanya sebagai jalur instalasi; penerbit memulihkan positif palsu melalui dasbor ClawHub atau `clawhub skill rescan <slug>`.

## Keamanan

<Warning>
Perlakukan keterampilan pihak ketiga sebagai **kode tidak tepercaya**. Baca sebelum mengaktifkannya. Utamakan eksekusi bersandbox untuk input tidak tepercaya dan alat berisiko. Lihat [Sandboxing](/id/gateway/sandboxing) untuk kontrol sisi agen.
</Warning>

- Penemuan keterampilan ruang kerja dan direktori tambahan hanya menerima root keterampilan dan file `SKILL.md` yang realpath terselesaikannya tetap berada di dalam root yang dikonfigurasi.
- Instalasi dependensi keterampilan berbasis Gateway (`skills.install`, onboarding, dan UI pengaturan Skills) menjalankan pemindai kode berbahaya bawaan sebelum mengeksekusi metadata penginstal. Temuan `critical` memblokir secara default kecuali pemanggil secara eksplisit menetapkan override berbahaya; temuan mencurigakan tetap hanya memberi peringatan.
- `openclaw skills install <slug>` berbeda — perintah ini mengunduh folder keterampilan ClawHub ke ruang kerja dan tidak menggunakan jalur metadata penginstal di atas.
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

OpenClaw mengikuti spesifikasi AgentSkills untuk tata letak/tujuan. Parser yang digunakan oleh agen tertanam hanya mendukung kunci frontmatter **satu baris**; `metadata` harus berupa **objek JSON satu baris**. Gunakan `{baseDir}` dalam instruksi untuk merujuk ke path folder keterampilan.

### Kunci frontmatter opsional

<ParamField path="homepage" type="string">
  URL yang ditampilkan sebagai "Situs web" di UI Skills macOS. Juga didukung melalui `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Saat `true`, keterampilan ditampilkan sebagai perintah slash pengguna.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Saat `true`, keterampilan dikecualikan dari prompt model (tetap tersedia melalui pemanggilan pengguna).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Saat diatur ke `tool`, perintah slash melewati model dan dikirim langsung ke alat.
</ParamField>
<ParamField path="command-tool" type="string">
  Nama alat yang akan dipanggil saat `command-dispatch: tool` diatur.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Untuk pengiriman alat, meneruskan string argumen mentah ke alat (tanpa parsing inti). Alat dipanggil dengan `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Pembatasan (filter saat pemuatan)

OpenClaw memfilter keterampilan saat pemuatan menggunakan `metadata` (JSON satu baris):

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

Bidang di bawah `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Saat `true`, selalu sertakan keterampilan (lewati pembatas lain).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opsional yang digunakan oleh UI Skills macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opsional yang ditampilkan sebagai "Situs web" di UI Skills macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Daftar platform opsional. Jika diatur, keterampilan hanya memenuhi syarat pada OS tersebut.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Masing-masing harus ada di `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Setidaknya satu harus ada di `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Variabel lingkungan harus ada atau disediakan dalam konfigurasi.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Daftar path `openclaw.json` yang harus bernilai truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nama variabel lingkungan yang terkait dengan `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Spesifikasi penginstal opsional yang digunakan oleh UI Skills macOS (brew/node/go/uv/download).
</ParamField>

Jika tidak ada `metadata.openclaw`, keterampilan selalu memenuhi syarat (kecuali dinonaktifkan dalam konfigurasi atau diblokir oleh `skills.allowBundled` untuk keterampilan bawaan).

<Note>
Blok `metadata.clawdbot` lama masih diterima saat `metadata.openclaw` tidak ada, sehingga keterampilan lama yang terinstal tetap mempertahankan pembatas dependensi dan petunjuk penginstalnya. Keterampilan baru dan yang diperbarui harus menggunakan `metadata.openclaw`.
</Note>

### Catatan sandboxing

- `requires.bins` diperiksa pada **host** saat pemuatan keterampilan.
- Jika agen disandbox, biner juga harus ada **di dalam kontainer**. Instal melalui `agents.defaults.sandbox.docker.setupCommand` (atau image kustom). `setupCommand` berjalan sekali setelah kontainer dibuat. Instalasi paket juga memerlukan egress jaringan, FS root yang dapat ditulis, dan pengguna root di sandbox.
- Contoh: keterampilan `summarize` (`skills/summarize/SKILL.md`) memerlukan CLI `summarize` di kontainer sandbox untuk berjalan di sana.

### Spesifikasi penginstal

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
    - Jika beberapa penginstal dicantumkan, Gateway memilih satu opsi yang diutamakan (brew jika tersedia, jika tidak node).
    - Jika semua penginstal adalah `download`, OpenClaw mencantumkan setiap entri agar Anda dapat melihat artefak yang tersedia.
    - Spesifikasi penginstal dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter opsi berdasarkan platform.
    - Instalasi Node mematuhi `skills.install.nodeManager` di `openclaw.json` (default: npm; opsi: npm/pnpm/yarn/bun). Ini hanya memengaruhi instalasi skill; runtime Gateway tetap sebaiknya Node — Bun tidak disarankan untuk WhatsApp/Telegram.
    - Pemilihan penginstal yang didukung Gateway digerakkan oleh preferensi: ketika spesifikasi instalasi mencampur beberapa jenis, OpenClaw mengutamakan Homebrew saat `skills.install.preferBrew` diaktifkan dan `brew` ada, lalu `uv`, lalu manajer node yang dikonfigurasi, lalu fallback lain seperti `go` atau `download`.
    - Jika setiap spesifikasi instalasi adalah `download`, OpenClaw menampilkan semua opsi unduhan alih-alih meringkasnya menjadi satu penginstal yang diutamakan.

  </Accordion>
  <Accordion title="Detail per penginstal">
    - **Instalasi Go:** jika `go` tidak ada dan `brew` tersedia, gateway menginstal Go melalui Homebrew terlebih dahulu dan mengatur `GOBIN` ke `bin` Homebrew jika memungkinkan.
    - **Instalasi unduhan:** `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (default: otomatis saat arsip terdeteksi), `stripComponents`, `targetDir` (default: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Penimpaan konfigurasi

Skill bawaan dan terkelola dapat diaktifkan/nonaktifkan dan diberi nilai env
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
  `skills.entries.coding-agent.enabled: true` sebelum menampilkannya kepada agen,
  lalu pastikan salah satu dari `claude`, `codex`, `opencode`, atau `pi` terinstal dan
  terautentikasi untuk CLI-nya sendiri.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Kemudahan untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`. Mendukung teks polos atau SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Diinjeksikan hanya jika variabel belum diatur dalam proses.
</ParamField>
<ParamField path="config" type="object">
  Wadah opsional untuk bidang kustom per skill. Kunci kustom harus berada di sini.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist opsional hanya untuk skill **bawaan**. Jika diatur, hanya skill bawaan dalam daftar yang memenuhi syarat (skill terkelola/workspace tidak terpengaruh).
</ParamField>

Jika nama skill berisi tanda hubung, kutip kuncinya (JSON5 mengizinkan kunci
yang dikutip). Kunci konfigurasi secara default cocok dengan **nama skill** — jika sebuah skill
mendefinisikan `metadata.openclaw.skillKey`, gunakan kunci tersebut di bawah `skills.entries`.

<Note>
Untuk pembuatan/penyuntingan gambar stok di dalam OpenClaw, gunakan tool inti
`image_generate` dengan `agents.defaults.imageGenerationModel` alih-alih
skill bawaan. Contoh skill di sini ditujukan untuk alur kerja kustom atau pihak ketiga.
Untuk analisis gambar native, gunakan tool `image` dengan
`agents.defaults.imageModel`. Jika Anda memilih `openai/*`, `google/*`,
`fal/*`, atau model gambar khusus penyedia lain, tambahkan juga
auth/kunci API penyedia tersebut.
</Note>

## Injeksi lingkungan

Saat sebuah run agen dimulai, OpenClaw:

1. Membaca metadata skill.
2. Menerapkan `skills.entries.<key>.env` dan `skills.entries.<key>.apiKey` ke `process.env`.
3. Membangun prompt sistem dengan skill yang **memenuhi syarat**.
4. Memulihkan lingkungan asli setelah run berakhir.

Injeksi lingkungan **bercakupan pada run agen**, bukan lingkungan shell
global.

Untuk backend `claude-cli` bawaan, OpenClaw juga mewujudkan snapshot
memenuhi syarat yang sama sebagai Plugin Claude Code sementara dan meneruskannya dengan
`--plugin-dir`. Claude Code kemudian dapat menggunakan resolver skill native-nya sementara
OpenClaw tetap mengelola prioritas, allowlist per agen, gating, dan
injeksi env/kunci API `skills.entries.*`. Backend CLI lain hanya menggunakan
katalog prompt.

## Snapshot dan refresh

OpenClaw membuat snapshot skill yang memenuhi syarat **saat sesi dimulai** dan
menggunakan kembali daftar itu untuk giliran berikutnya dalam sesi yang sama. Perubahan pada
skill atau konfigurasi mulai berlaku pada sesi baru berikutnya.

Skills dapat di-refresh di tengah sesi dalam dua kasus:

- Watcher skills diaktifkan.
- Node jarak jauh baru yang memenuhi syarat muncul.

Anggap ini sebagai **hot reload**: daftar yang di-refresh digunakan pada
giliran agen berikutnya. Jika allowlist skill agen efektif berubah untuk
sesi tersebut, OpenClaw me-refresh snapshot agar skill yang terlihat tetap selaras
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
OpenClaw dapat memperlakukan skill khusus macOS sebagai memenuhi syarat ketika biner yang diperlukan
ada pada node tersebut. Agen harus menjalankan skill tersebut
melalui tool `exec` dengan `host=node`.

Ini bergantung pada node yang melaporkan dukungan perintahnya dan pada probe bin
melalui `system.which` atau `system.run`. Node offline **tidak** membuat
skill khusus jarak jauh terlihat. Jika node yang terhubung berhenti menjawab probe bin,
OpenClaw menghapus kecocokan bin yang di-cache sehingga agen tidak lagi melihat
skill yang saat ini tidak dapat dijalankan di sana.

## Dampak token

Saat skill memenuhi syarat, OpenClaw menginjeksikan daftar XML ringkas berisi skill yang tersedia
ke dalam prompt sistem (melalui `formatSkillsForPrompt` di
`pi-coding-agent`). Biayanya deterministik:

- **Overhead dasar** (hanya saat ≥1 skill): 195 karakter.
- **Per skill:** 97 karakter + panjang nilai `<name>`, `<description>`, dan `<location>` yang di-escape XML.

Rumus (karakter):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Escaping XML memperluas `& < > " '` menjadi entitas (`&amp;`, `&lt;`, dll.),
sehingga menambah panjang. Jumlah token bervariasi menurut tokenizer model. Perkiraan kasar
gaya OpenAI adalah ~4 karakter/token, jadi **97 karakter ≈ 24 token** per
skill ditambah panjang bidang Anda yang sebenarnya.

## Siklus hidup skill terkelola

OpenClaw mengirimkan set dasar skill sebagai **skill bawaan** bersama
instalasi (paket npm atau OpenClaw.app). `~/.openclaw/skills` ada untuk
penimpaan lokal — misalnya, menyematkan atau menambal skill tanpa
mengubah salinan bawaan. Skill workspace dimiliki pengguna dan menimpa
keduanya saat terjadi konflik nama.

## Mencari lebih banyak skill?

Jelajahi [https://clawhub.ai](https://clawhub.ai). Skema konfigurasi lengkap:
[Konfigurasi Skills](/id/tools/skills-config).

## Terkait

- [ClawHub](/id/tools/clawhub) — registri skill publik
- [Membuat skill](/id/tools/creating-skills) — membangun skill kustom
- [Plugin](/id/tools/plugin) — ikhtisar sistem plugin
- [Plugin Skill Workshop](/id/plugins/skill-workshop) — menghasilkan skill dari pekerjaan agen
- [Konfigurasi Skills](/id/tools/skills-config) — referensi konfigurasi skill
- [Perintah slash](/id/tools/slash-commands) — semua perintah slash yang tersedia
