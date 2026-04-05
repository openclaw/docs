---
read_when:
    - Memperkenalkan ClawHub kepada pengguna baru
    - Menginstal, mencari, atau menerbitkan skill atau plugin
    - Menjelaskan flag ClawHub CLI dan perilaku sinkronisasi
summary: 'Panduan ClawHub: registry publik, alur instalasi OpenClaw native, dan alur kerja ClawHub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-05T14:08:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65b3fd770ca96a5dd828dce2dee4ef127268f4884180a912f43d7744bc5706f
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub adalah registry publik untuk **skill dan plugin OpenClaw**.

- Gunakan perintah `openclaw` native untuk mencari/menginstal/memperbarui skill dan menginstal
  plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah saat Anda memerlukan auth registry, publish, delete,
  undelete, atau alur kerja sinkronisasi.

Situs: [clawhub.ai](https://clawhub.ai)

## Alur OpenClaw native

Skill:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugin:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Spesifikasi plugin bare yang aman untuk npm juga dicoba terhadap ClawHub sebelum npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Perintah `openclaw` native menginstal ke workspace aktif Anda dan menyimpan metadata
sumber sehingga panggilan `update` berikutnya dapat tetap berada di ClawHub.

Instalasi plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion`
yang diiklankan sebelum instalasi arsip dijalankan, sehingga host yang tidak kompatibel gagal tertutup lebih awal
alih-alih menginstal paket secara sebagian.

`openclaw plugins install clawhub:...` hanya menerima keluarga plugin yang dapat diinstal.
Jika sebuah paket ClawHub sebenarnya adalah skill, OpenClaw akan berhenti dan mengarahkan Anda ke
`openclaw skills install <slug>` sebagai gantinya.

## Apa itu ClawHub

- Registry publik untuk skill dan plugin OpenClaw.
- Penyimpanan berversi untuk bundle skill dan metadata.
- Surface penemuan untuk pencarian, tag, dan sinyal penggunaan.

## Cara kerjanya

1. Pengguna menerbitkan bundle skill (file + metadata).
2. ClawHub menyimpan bundle, mengurai metadata, dan menetapkan versi.
3. Registry mengindeks skill untuk pencarian dan penemuan.
4. Pengguna menelusuri, mengunduh, dan menginstal skill di OpenClaw.

## Apa yang bisa Anda lakukan

- Menerbitkan skill baru dan versi baru dari skill yang sudah ada.
- Menemukan skill berdasarkan nama, tag, atau pencarian.
- Mengunduh bundle skill dan memeriksa file-file di dalamnya.
- Melaporkan skill yang abusif atau tidak aman.
- Jika Anda moderator, menyembunyikan, menampilkan kembali, menghapus, atau memblokir.

## Untuk siapa ini (ramah pemula)

Jika Anda ingin menambahkan kemampuan baru ke agent OpenClaw Anda, ClawHub adalah cara termudah untuk menemukan dan menginstal skill. Anda tidak perlu tahu cara kerja backend. Anda dapat:

- Mencari skill dengan bahasa biasa.
- Menginstal skill ke dalam workspace Anda.
- Memperbarui skill nanti dengan satu perintah.
- Mencadangkan skill Anda sendiri dengan menerbitkannya.

## Mulai cepat (non-teknis)

1. Cari sesuatu yang Anda butuhkan:
   - `openclaw skills search "calendar"`
2. Instal skill:
   - `openclaw skills install <skill-slug>`
3. Mulai sesi OpenClaw baru agar skill baru terambil.
4. Jika Anda ingin menerbitkan atau mengelola auth registry, instal juga
   CLI `clawhub` terpisah.

## Instal ClawHub CLI

Anda hanya memerlukan ini untuk alur kerja yang memerlukan autentikasi registry seperti publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Bagaimana ini cocok dengan OpenClaw

`openclaw skills install` native menginstal ke direktori `skills/` workspace aktif. `openclaw plugins install clawhub:...` mencatat
instalasi plugin terkelola normal ditambah metadata sumber ClawHub untuk pembaruan.

Instalasi plugin ClawHub anonim juga gagal tertutup untuk paket privat.
Channel komunitas atau channel nonresmi lain tetap dapat menginstal, tetapi OpenClaw akan memperingatkan
agar operator dapat meninjau sumber dan verifikasi sebelum mengaktifkannya.

CLI `clawhub` terpisah juga menginstal skill ke `./skills` di bawah
direktori kerja Anda saat ini. Jika workspace OpenClaw dikonfigurasi, `clawhub`
akan fallback ke workspace itu kecuali Anda menimpa `--workdir` (atau
`CLAWHUB_WORKDIR`). OpenClaw memuat skill workspace dari `<workspace>/skills`
dan akan mengambilnya pada sesi **berikutnya**. Jika Anda sudah menggunakan
`~/.openclaw/skills` atau skill bawaan, skill workspace akan diprioritaskan.

Untuk detail lebih lanjut tentang cara skill dimuat, dibagikan, dan digating, lihat
[Skills](/tools/skills).

## Ringkasan sistem skill

Skill adalah bundle file berversi yang mengajarkan OpenClaw cara melakukan
tugas tertentu. Setiap publish membuat versi baru, dan registry menyimpan
riwayat versi agar pengguna dapat mengaudit perubahan.

Skill yang umum mencakup:

- File `SKILL.md` dengan deskripsi utama dan penggunaan.
- Config, skrip, atau file pendukung opsional yang digunakan oleh skill.
- Metadata seperti tag, ringkasan, dan persyaratan instalasi.

ClawHub menggunakan metadata untuk mendukung penemuan dan mengekspos kemampuan skill dengan aman.
Registry juga melacak sinyal penggunaan (seperti bintang dan unduhan) untuk meningkatkan
peringkat dan visibilitas.

## Apa yang disediakan layanan ini (fitur)

- **Penelusuran publik** atas skill dan konten `SKILL.md`-nya.
- **Pencarian** yang didukung embedding (pencarian vektor), bukan hanya kata kunci.
- **Versioning** dengan semver, changelog, dan tag (termasuk `latest`).
- **Unduhan** sebagai zip per versi.
- **Bintang dan komentar** untuk umpan balik komunitas.
- Hook **moderasi** untuk persetujuan dan audit.
- **API ramah CLI** untuk otomasi dan scripting.

## Keamanan dan moderasi

ClawHub terbuka secara default. Siapa pun dapat mengunggah skill, tetapi akun GitHub harus
berusia setidaknya satu minggu untuk menerbitkan. Ini membantu memperlambat penyalahgunaan tanpa memblokir
kontributor yang sah.

Pelaporan dan moderasi:

- Setiap pengguna yang sudah masuk dapat melaporkan skill.
- Alasan pelaporan wajib dan dicatat.
- Setiap pengguna dapat memiliki hingga 20 laporan aktif sekaligus.
- Skill dengan lebih dari 3 laporan unik otomatis disembunyikan secara default.
- Moderator dapat melihat skill tersembunyi, menampilkannya kembali, menghapusnya, atau memblokir pengguna.
- Penyalahgunaan fitur pelaporan dapat mengakibatkan pemblokiran akun.

Tertarik menjadi moderator? Tanyakan di Discord OpenClaw dan hubungi
moderator atau maintainer.

## Perintah dan parameter CLI

Opsi global (berlaku untuk semua perintah):

- `--workdir <dir>`: Direktori kerja (default: direktori saat ini; fallback ke workspace OpenClaw).
- `--dir <dir>`: Direktori skill, relatif ke workdir (default: `skills`).
- `--site <url>`: URL dasar situs (login browser).
- `--registry <url>`: URL dasar API registry.
- `--no-input`: Nonaktifkan prompt (non-interaktif).
- `-V, --cli-version`: Cetak versi CLI.

Auth:

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
- `--version <version>`: Perbarui ke versi tertentu (hanya untuk satu slug).
- `--force`: Timpa saat file lokal tidak cocok dengan versi terbitan mana pun.

Daftar:

- `clawhub list` (membaca `.clawhub/lock.json`)

Menerbitkan skill:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug skill.
- `--name <name>`: Nama tampilan.
- `--version <version>`: Versi semver.
- `--changelog <text>`: Teks changelog (boleh kosong).
- `--tags <tags>`: Tag dipisahkan koma (default: `latest`).

Menerbitkan plugin:

- `clawhub package publish <source>`
- `<source>` dapat berupa folder lokal, `owner/repo`, `owner/repo@ref`, atau URL GitHub.
- `--dry-run`: Bangun rencana publish yang persis tanpa mengunggah apa pun.
- `--json`: Keluarkan output yang dapat dibaca mesin untuk CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Override opsional saat deteksi otomatis tidak cukup.

Hapus/tampilkan kembali (khusus pemilik/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sinkronisasi (pindai skill lokal + terbitkan yang baru/diperbarui):

- `clawhub sync`
- `--root <dir...>`: Root pemindaian tambahan.
- `--all`: Unggah semuanya tanpa prompt.
- `--dry-run`: Tampilkan apa yang akan diunggah.
- `--bump <type>`: `patch|minor|major` untuk pembaruan (default: `patch`).
- `--changelog <text>`: Changelog untuk pembaruan non-interaktif.
- `--tags <tags>`: Tag dipisahkan koma (default: `latest`).
- `--concurrency <n>`: Pemeriksaan registry (default: 4).

## Alur kerja umum untuk agent

### Mencari skill

```bash
clawhub search "postgres backups"
```

### Mengunduh skill baru

```bash
clawhub install my-skill-pack
```

### Memperbarui skill yang terinstal

```bash
clawhub update --all
```

### Mencadangkan skill Anda (publish atau sync)

Untuk satu folder skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Untuk memindai dan mencadangkan banyak skill sekaligus:

```bash
clawhub sync --all
```

### Menerbitkan plugin dari GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Plugin kode harus menyertakan metadata OpenClaw yang diwajibkan di `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
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

## Detail lanjutan (teknis)

### Versioning dan tag

- Setiap publish membuat `SkillVersion` **semver** baru.
- Tag (seperti `latest`) menunjuk ke sebuah versi; memindahkan tag memungkinkan Anda melakukan rollback.
- Changelog dilampirkan per versi dan dapat kosong saat sinkronisasi atau menerbitkan pembaruan.

### Perubahan lokal vs versi registry

Pembaruan membandingkan isi skill lokal dengan versi registry menggunakan content hash. Jika file lokal tidak cocok dengan versi terbitan mana pun, CLI akan bertanya sebelum menimpa (atau memerlukan `--force` dalam run non-interaktif).

### Pemindaian sinkronisasi dan root fallback

`clawhub sync` memindai workdir Anda saat ini terlebih dahulu. Jika tidak ada skill yang ditemukan, ia akan fallback ke lokasi lama yang diketahui (misalnya `~/openclaw/skills` dan `~/.openclaw/skills`). Ini dirancang untuk menemukan instalasi skill lama tanpa flag tambahan.

### Penyimpanan dan lockfile

- Skill yang terinstal dicatat di `.clawhub/lock.json` di bawah workdir Anda.
- Token auth disimpan di file config ClawHub CLI (override melalui `CLAWHUB_CONFIG_PATH`).

### Telemetri (jumlah instalasi)

Saat Anda menjalankan `clawhub sync` dalam keadaan sudah masuk, CLI mengirim snapshot minimal untuk menghitung jumlah instalasi. Anda dapat menonaktifkannya sepenuhnya:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Environment variable

- `CLAWHUB_SITE`: Override URL situs.
- `CLAWHUB_REGISTRY`: Override URL API registry.
- `CLAWHUB_CONFIG_PATH`: Override tempat CLI menyimpan token/config.
- `CLAWHUB_WORKDIR`: Override workdir default.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Nonaktifkan telemetri pada `sync`.
