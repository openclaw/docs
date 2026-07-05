---
read_when:
    - Menerbitkan Skills
    - Men-debug kegagalan publikasi
summary: Format folder Skills, berkas wajib, jenis berkas yang diizinkan, batasan.
x-i18n:
    generated_at: "2026-07-05T05:36:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format Skill

## Di disk

Skill adalah sebuah folder.

Wajib:

- `SKILL.md` (atau `skill.md`; `skills.md` lama juga diterima)

Opsional:

- file pendukung _berbasis teks_ apa pun (lihat “File yang diizinkan”)
- `.clawhubignore` (pola pengabaian untuk publikasi, `.clawdhubignore` lama)
- `.gitignore` (juga dihormati)

## Impor GitHub

Importer GitHub web lebih ketat daripada publish/sync lokal. Importer ini hanya menemukan
file `SKILL.md` atau `skills.md` lama di repositori publik non-fork yang dimiliki oleh
akun GitHub yang sedang masuk. Importer ini tidak mengimpor repo privat, fork,
repo yang diarsipkan/dinonaktifkan, atau repo publik pihak ketiga.

Metadata instal lokal (ditulis oleh CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` lama)

Status instal workdir (ditulis oleh CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` lama)

## `SKILL.md`

- Markdown dengan frontmatter YAML opsional.
- Server mengekstrak metadata dari frontmatter saat publish.
- `description` digunakan sebagai ringkasan skill di UI/pencarian.

## Metadata frontmatter

Metadata skill dideklarasikan dalam frontmatter YAML di bagian atas `SKILL.md` Anda. Ini memberi tahu registry (dan analisis keamanan) apa yang dibutuhkan skill Anda agar dapat berjalan.

### Frontmatter dasar

```yaml
---
name: my-skill
description: Ringkasan singkat tentang apa yang dilakukan skill ini.
version: 1.0.0
---
```

### Metadata runtime (`metadata.openclaw`)

Deklarasikan kebutuhan runtime skill Anda di bawah `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Kelola tugas melalui Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Gunakan `requires.env` untuk variabel lingkungan yang harus ada sebelum skill dapat berjalan. Gunakan `envVars` saat Anda membutuhkan metadata per variabel, termasuk variabel opsional dengan `required: false`.

### Referensi field lengkap

| Field              | Tipe       | Deskripsi                                                                                                                                           |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabel lingkungan wajib yang diharapkan oleh skill Anda.                                                                                          |
| `requires.bins`    | `string[]` | Binary CLI yang semuanya harus terinstal.                                                                                                           |
| `requires.anyBins` | `string[]` | Binary CLI yang minimal salah satunya harus ada.                                                                                                    |
| `requires.config`  | `string[]` | Path file konfigurasi yang dibaca skill Anda.                                                                                                       |
| `primaryEnv`       | `string`   | Env var kredensial utama untuk skill Anda.                                                                                                          |
| `envVars`          | `array`    | Deklarasi variabel lingkungan dengan `name`, `required` opsional, dan `description` opsional. Tetapkan `required: false` untuk env var opsional.   |
| `always`           | `boolean`  | Jika `true`, skill selalu aktif (tidak perlu instal eksplisit).                                                                                     |
| `skillKey`         | `string`   | Timpa kunci pemanggilan skill.                                                                                                                      |
| `emoji`            | `string`   | Emoji tampilan untuk skill.                                                                                                                         |
| `homepage`         | `string`   | URL ke beranda atau dokumentasi skill.                                                                                                              |
| `os`               | `string[]` | Pembatasan OS (misalnya `["macos"]`, `["linux"]`).                                                                                                  |
| `install`          | `array`    | Spesifikasi instal untuk dependensi (lihat di bawah).                                                                                               |
| `nix`              | `object`   | Spesifikasi plugin Nix (lihat README).                                                                                                              |
| `config`           | `object`   | Spesifikasi konfigurasi Clawdbot (lihat README).                                                                                                    |

### Spesifikasi instal

Jika skill Anda membutuhkan dependensi yang terinstal, deklarasikan dependensi tersebut dalam array `install`:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Jenis instal yang didukung: `brew`, `node`, `go`, `uv`.

### Variabel lingkungan opsional

Deklarasikan variabel lingkungan opsional di bawah `metadata.openclaw.envVars` dan tetapkan `required: false`. Jangan tambahkan entri opsional ke `requires.env`, karena `requires.env` berarti skill tidak dapat berjalan tanpa variabel tersebut.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token Todoist API yang digunakan untuk permintaan terautentikasi.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID proyek default opsional saat pengguna tidak menentukannya.
```

### Mengapa ini penting

Analisis keamanan ClawHub memeriksa bahwa apa yang dideklarasikan skill Anda sesuai dengan apa yang benar-benar dilakukannya. Jika kode Anda mereferensikan `TODOIST_API_KEY` tetapi frontmatter Anda tidak mendeklarasikannya di bawah `requires.env`, `primaryEnv`, atau `envVars`, analisis akan menandai ketidakcocokan metadata. Menjaga deklarasi tetap akurat membantu skill Anda lolos peninjauan dan membantu pengguna memahami apa yang mereka instal.

### Contoh: frontmatter lengkap

```yaml
---
name: todoist-cli
description: Kelola tugas, proyek, dan label Todoist dari baris perintah.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token Todoist API.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID proyek default opsional.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## File yang diizinkan

Hanya file “berbasis teks” yang diterima oleh publish.

- Allowlist ekstensi ada di `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- File skrip tetap dipindai setelah upload; file PowerShell `.ps1`, `.psm1`, dan `.psd1` diterima sebagai teks.
- Tipe konten yang dimulai dengan `text/` diperlakukan sebagai teks; ditambah allowlist kecil (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Batas (sisi server):

- Ukuran bundle total: 50MB.
- Teks embedding mencakup `SKILL.md` + hingga sekitar 40 file non-`.md` (batas upaya terbaik).

## Slug

- Secara default diturunkan dari nama folder.
- Scope paket harus persis cocok dengan handle penerbit ClawHub. Handle penerbit dapat menggunakan huruf kecil, angka, tanda hubung, titik, dan garis bawah; harus diawali dan diakhiri dengan huruf kecil atau angka.
- Slug paket harus huruf kecil dan aman untuk npm, misalnya `@example.tools/demo-plugin` atau `demo-plugin`.

## Versioning + tag

- Setiap publish membuat versi baru (semver).
- Tag adalah pointer string ke sebuah versi; `latest` umum digunakan.

## Lisensi

- Semua skill yang dipublikasikan di ClawHub dilisensikan di bawah `MIT-0`.
- Siapa pun boleh menggunakan, memodifikasi, dan mendistribusikan ulang skill yang dipublikasikan, termasuk secara komersial.
- Atribusi tidak diwajibkan.
- Jangan tambahkan ketentuan lisensi yang bertentangan di `SKILL.md`; ClawHub tidak mendukung override lisensi per skill.

## Skill berbayar

- ClawHub tidak mendukung skill berbayar, penetapan harga per skill, paywall, atau pembagian pendapatan.
- Jangan tambahkan metadata harga ke `SKILL.md`; itu bukan bagian dari format skill dan tidak akan membuat skill yang dipublikasikan menjadi berbayar.
- Jika skill Anda terintegrasi dengan layanan pihak ketiga berbayar, dokumentasikan biaya eksternal dan akun yang diperlukan dengan jelas dalam instruksi skill dan deklarasi env (`requires.env` untuk variabel wajib, atau `envVars` dengan `required: false` untuk variabel opsional).
