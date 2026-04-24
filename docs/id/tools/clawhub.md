---
read_when:
    - Memperkenalkan ClawHub kepada pengguna baru
    - Menginstal, mencari, atau menerbitkan Skills atau Plugin
    - Menjelaskan flag CLI ClawHub dan perilaku sinkronisasi
summary: 'Panduan ClawHub: registry publik, alur instalasi OpenClaw native, dan alur kerja CLI ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T09:29:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub adalah registry publik untuk **Skills dan Plugin OpenClaw**.

- Gunakan perintah `openclaw` native untuk mencari/menginstal/memperbarui Skills dan menginstal
  Plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah saat Anda memerlukan autentikasi registry, publish, delete,
  undelete, atau alur kerja sync.

Situs: [clawhub.ai](https://clawhub.ai)

## Alur native OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Spesifikasi Plugin bare yang aman untuk npm juga dicoba ke ClawHub sebelum npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Perintah `openclaw` native menginstal ke workspace aktif Anda dan menyimpan metadata
source agar panggilan `update` berikutnya bisa tetap berada di ClawHub.

Instalasi Plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion`
yang diiklankan sebelum instalasi arsip dijalankan, sehingga host yang tidak kompatibel gagal tertutup
lebih awal alih-alih menginstal paket secara parsial.

`openclaw plugins install clawhub:...` hanya menerima keluarga Plugin yang dapat diinstal.
Jika paket ClawHub sebenarnya adalah sebuah skill, OpenClaw akan berhenti dan mengarahkan Anda ke
`openclaw skills install <slug>`.

## Apa itu ClawHub

- Registry publik untuk Skills dan Plugin OpenClaw.
- Penyimpanan berversi untuk bundel skill dan metadata.
- Permukaan penemuan untuk pencarian, tag, dan sinyal penggunaan.

## Cara kerjanya

1. Seorang pengguna menerbitkan bundel skill (file + metadata).
2. ClawHub menyimpan bundel, mengurai metadata, dan menetapkan versi.
3. Registry mengindeks skill untuk pencarian dan penemuan.
4. Pengguna menelusuri, mengunduh, dan menginstal Skills di OpenClaw.

## Yang dapat Anda lakukan

- Menerbitkan skill baru dan versi baru dari skill yang sudah ada.
- Menemukan Skills berdasarkan nama, tag, atau pencarian.
- Mengunduh bundel skill dan memeriksa file-file di dalamnya.
- Melaporkan Skills yang abusif atau tidak aman.
- Jika Anda moderator, menyembunyikan, menampilkan kembali, menghapus, atau memblokir.

## Untuk siapa ini (ramah pemula)

Jika Anda ingin menambahkan kemampuan baru ke agen OpenClaw Anda, ClawHub adalah cara termudah untuk menemukan dan menginstal Skills. Anda tidak perlu tahu cara kerja backend. Anda dapat:

- Mencari Skills dengan bahasa biasa.
- Menginstal skill ke workspace Anda.
- Memperbarui Skills nanti dengan satu perintah.
- Mencadangkan Skills Anda sendiri dengan menerbitkannya.

## Memulai dengan cepat (non-teknis)

1. Cari sesuatu yang Anda butuhkan:
   - `openclaw skills search "calendar"`
2. Instal sebuah skill:
   - `openclaw skills install <skill-slug>`
3. Mulai sesi OpenClaw baru agar skill baru tersebut terambil.
4. Jika Anda ingin menerbitkan atau mengelola autentikasi registry, instal juga
   CLI `clawhub` terpisah.

## Instal CLI ClawHub

Anda hanya memerlukan ini untuk alur kerja yang diautentikasi registry seperti publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Bagaimana ini cocok dengan OpenClaw

`openclaw skills install` native menginstal ke direktori `skills/` workspace aktif. `openclaw plugins install clawhub:...` mencatat instalasi Plugin terkelola normal ditambah metadata source ClawHub untuk pembaruan.

Instalasi Plugin ClawHub anonim juga gagal tertutup untuk paket privat.
Komunitas atau channel tidak resmi lainnya tetap dapat menginstal, tetapi OpenClaw memperingatkan
agar operator dapat meninjau source dan verifikasi sebelum mengaktifkannya.

CLI `clawhub` terpisah juga menginstal Skills ke `./skills` di bawah direktori kerja
saat ini. Jika workspace OpenClaw dikonfigurasi, `clawhub`
akan fallback ke workspace tersebut kecuali Anda override `--workdir` (atau
`CLAWHUB_WORKDIR`). OpenClaw memuat Skills workspace dari `<workspace>/skills`
dan akan mengambilnya pada sesi **berikutnya**. Jika Anda sudah menggunakan
`~/.openclaw/skills` atau Skills bawaan, Skills workspace diprioritaskan.

Untuk detail lebih lanjut tentang cara Skills dimuat, dibagikan, dan dikendalikan, lihat
[Skills](/id/tools/skills).

## Ikhtisar sistem skill

Skill adalah bundel file berversi yang mengajarkan OpenClaw cara melakukan
tugas tertentu. Setiap publish membuat versi baru, dan registry menyimpan
riwayat versi agar pengguna dapat mengaudit perubahan.

Skill tipikal mencakup:

- File `SKILL.md` dengan deskripsi utama dan penggunaan.
- Konfigurasi, skrip, atau file pendukung opsional yang digunakan oleh skill.
- Metadata seperti tag, ringkasan, dan persyaratan instalasi.

ClawHub menggunakan metadata untuk mendukung penemuan dan mengekspos kapabilitas skill dengan aman.
Registry juga melacak sinyal penggunaan (seperti bintang dan unduhan) untuk meningkatkan
peringkat dan visibilitas.

## Yang disediakan layanan ini (fitur)

- **Penelusuran publik** atas Skills dan konten `SKILL.md` mereka.
- **Pencarian** yang didukung embeddings (vector search), bukan hanya kata kunci.
- **Versioning** dengan semver, changelog, dan tag (termasuk `latest`).
- **Unduhan** sebagai zip per versi.
- **Bintang dan komentar** untuk umpan balik komunitas.
- **Hook moderasi** untuk persetujuan dan audit.
- **API ramah CLI** untuk otomatisasi dan scripting.

## Keamanan dan moderasi

ClawHub terbuka secara default. Siapa pun dapat mengunggah Skills, tetapi akun GitHub harus
berusia setidaknya satu minggu untuk menerbitkan. Ini membantu memperlambat penyalahgunaan tanpa menghalangi
kontributor yang sah.

Pelaporan dan moderasi:

- Setiap pengguna yang login dapat melaporkan sebuah skill.
- Alasan laporan wajib dan dicatat.
- Setiap pengguna dapat memiliki hingga 20 laporan aktif pada satu waktu.
- Skills dengan lebih dari 3 laporan unik otomatis disembunyikan secara default.
- Moderator dapat melihat Skills yang disembunyikan, menampilkannya kembali, menghapusnya, atau memblokir pengguna.
- Menyalahgunakan fitur laporan dapat berujung pada pemblokiran akun.

Tertarik menjadi moderator? Tanyakan di Discord OpenClaw dan hubungi moderator
atau maintainer.

## Perintah CLI dan parameter

Opsi global (berlaku untuk semua perintah):

- `--workdir <dir>`: Direktori kerja (default: direktori saat ini; fallback ke workspace OpenClaw).
- `--dir <dir>`: Direktori Skills, relatif terhadap workdir (default: `skills`).
- `--site <url>`: Base URL situs (login browser).
- `--registry <url>`: Base URL API registry.
- `--no-input`: Nonaktifkan prompt (non-interaktif).
- `-V, --cli-version`: Cetak versi CLI.

Autentikasi:

- `clawhub login` (alur browser) atau `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opsi:

- `--token <token>`: Tempel token API.
- `--label <label>`: Label yang disimpan untuk token login browser (default: `CLI token`).
- `--no-browser`: Jangan buka browser (memerlukan `--token`).

Pencarian:

- `clawhub search "query"`
- `--limit <n>`: Hasil maksimum.

Instalasi:

- `clawhub install <slug>`
- `--version <version>`: Instal versi tertentu.
- `--force`: Timpa jika folder sudah ada.

Pembaruan:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Perbarui ke versi tertentu (hanya satu slug).
- `--force`: Timpa saat file lokal tidak cocok dengan versi apa pun yang dipublikasikan.

Daftar:

- `clawhub list` (membaca `.clawhub/lock.json`)

Menerbitkan Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug skill.
- `--name <name>`: Nama tampilan.
- `--version <version>`: Versi semver.
- `--changelog <text>`: Teks changelog (boleh kosong).
- `--tags <tags>`: Tag dipisahkan koma (default: `latest`).

Menerbitkan Plugin:

- `clawhub package publish <source>`
- `<source>` dapat berupa folder lokal, `owner/repo`, `owner/repo@ref`, atau URL GitHub.
- `--dry-run`: Bangun rencana publish yang tepat tanpa mengunggah apa pun.
- `--json`: Keluarkan output yang dapat dibaca mesin untuk CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Override opsional saat deteksi otomatis tidak cukup.

Delete/undelete (hanya owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (pindai Skills lokal + terbitkan yang baru/diperbarui):

- `clawhub sync`
- `--root <dir...>`: Root pemindaian tambahan.
- `--all`: Unggah semuanya tanpa prompt.
- `--dry-run`: Tampilkan apa yang akan diunggah.
- `--bump <type>`: `patch|minor|major` untuk pembaruan (default: `patch`).
- `--changelog <text>`: Changelog untuk pembaruan non-interaktif.
- `--tags <tags>`: Tag dipisahkan koma (default: `latest`).
- `--concurrency <n>`: Pemeriksaan registry (default: 4).

## Alur kerja umum untuk agen

### Cari Skills

```bash
clawhub search "postgres backups"
```

### Unduh skill baru

```bash
clawhub install my-skill-pack
```

### Perbarui Skills yang terinstal

```bash
clawhub update --all
```

### Cadangkan Skills Anda (publish atau sync)

Untuk satu folder skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Untuk memindai dan mencadangkan banyak Skills sekaligus:

```bash
clawhub sync --all
```

### Terbitkan Plugin dari GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Plugin kode harus menyertakan metadata OpenClaw yang diperlukan di `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Paket yang dipublikasikan sebaiknya mengirim JavaScript hasil build dan mengarahkan `runtimeExtensions`
ke output tersebut. Instalasi git checkout tetap dapat fallback ke source TypeScript
saat tidak ada file hasil build, tetapi entri runtime hasil build menghindari kompilasi
TypeScript saat runtime pada jalur startup, doctor, dan pemuatan Plugin.

## Detail lanjutan (teknis)

### Versioning dan tag

- Setiap publish membuat `SkillVersion` **semver** baru.
- Tag (seperti `latest`) menunjuk ke sebuah versi; memindahkan tag memungkinkan rollback.
- Changelog dilampirkan per versi dan dapat kosong saat sync atau menerbitkan pembaruan.

### Perubahan lokal vs versi registry

Pembaruan membandingkan konten skill lokal dengan versi registry menggunakan hash konten. Jika file lokal tidak cocok dengan versi apa pun yang dipublikasikan, CLI akan meminta konfirmasi sebelum menimpa (atau memerlukan `--force` pada eksekusi non-interaktif).

### Pemindaian sync dan fallback root

`clawhub sync` memindai workdir saat ini terlebih dahulu. Jika tidak ada Skills yang ditemukan, ia akan fallback ke lokasi legacy yang diketahui (misalnya `~/openclaw/skills` dan `~/.openclaw/skills`). Ini dirancang untuk menemukan instalasi skill lama tanpa flag tambahan.

### Penyimpanan dan lockfile

- Skills yang terinstal dicatat di `.clawhub/lock.json` di bawah workdir Anda.
- Token autentikasi disimpan di file konfigurasi CLI ClawHub (override melalui `CLAWHUB_CONFIG_PATH`).

### Telemetri (jumlah instalasi)

Saat Anda menjalankan `clawhub sync` dalam keadaan login, CLI mengirim snapshot minimal untuk menghitung jumlah instalasi. Anda dapat menonaktifkan ini sepenuhnya:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variabel lingkungan

- `CLAWHUB_SITE`: Override URL situs.
- `CLAWHUB_REGISTRY`: Override URL API registry.
- `CLAWHUB_CONFIG_PATH`: Override tempat CLI menyimpan token/konfigurasi.
- `CLAWHUB_WORKDIR`: Override workdir default.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Nonaktifkan telemetri pada `sync`.

## Terkait

- [Plugin](/id/tools/plugin)
- [Skills](/id/tools/skills)
- [Plugin komunitas](/id/plugins/community)
