---
read_when:
    - Menerbitkan Skills
    - Men-debug kegagalan publikasi
summary: Format folder Skill, file yang wajib ada, jenis file yang diizinkan, batasan.
x-i18n:
    generated_at: "2026-06-30T22:34:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format Skill

## Di disk

Sebuah Skill adalah folder.

Wajib:

- `SKILL.md` (atau `skill.md`; `skills.md` lama juga diterima)

Opsional:

- file pendukung _berbasis teks_ apa pun (lihat “File yang diizinkan”)
- `.clawhubignore` (pola pengabaian untuk publikasi, `.clawdhubignore` lama)
- `.gitignore` (juga dihormati)

## Impor GitHub

Pengimpor GitHub web lebih ketat daripada publish/sync lokal. Ia hanya menemukan
file `SKILL.md` atau `skills.md` lama di repositori publik non-fork yang dimiliki oleh
akun GitHub yang sedang masuk. Ia tidak mengimpor repo privat, fork,
repo yang diarsipkan/dinonaktifkan, atau repo publik pihak ketiga.

Metadata instal lokal (ditulis oleh CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` lama)

Status instal workdir (ditulis oleh CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` lama)

## `SKILL.md`

- Markdown dengan frontmatter YAML opsional.
- Server mengekstrak metadata dari frontmatter saat publikasi.
- `description` digunakan sebagai ringkasan Skill di UI/pencarian.

## Metadata frontmatter

Metadata Skill dideklarasikan dalam frontmatter YAML di bagian atas `SKILL.md` Anda. Ini memberi tahu registry (dan analisis keamanan) apa yang dibutuhkan Skill Anda untuk berjalan.

### Frontmatter dasar

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadata runtime (`metadata.openclaw`)

Deklarasikan kebutuhan runtime Skill Anda di bawah `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
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

Gunakan `requires.env` untuk variabel lingkungan yang harus ada sebelum Skill dapat berjalan. Gunakan `envVars` saat Anda membutuhkan metadata per variabel, termasuk variabel opsional dengan `required: false`.

### Referensi bidang lengkap

| Bidang             | Tipe       | Deskripsi                                                                                                                                    |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabel lingkungan wajib yang diharapkan oleh Skill Anda.                                                                                    |
| `requires.bins`    | `string[]` | Biner CLI yang semuanya harus terinstal.                                                                                                      |
| `requires.anyBins` | `string[]` | Biner CLI dengan setidaknya satu yang harus ada.                                                                                              |
| `requires.config`  | `string[]` | Path file konfigurasi yang dibaca Skill Anda.                                                                                                 |
| `primaryEnv`       | `string`   | Env var kredensial utama untuk Skill Anda.                                                                                                    |
| `envVars`          | `array`    | Deklarasi variabel lingkungan dengan `name`, `required` opsional, dan `description` opsional. Setel `required: false` untuk env var opsional. |
| `always`           | `boolean`  | Jika `true`, Skill selalu aktif (tidak perlu instal eksplisit).                                                                               |
| `skillKey`         | `string`   | Timpa kunci pemanggilan Skill.                                                                                                                |
| `emoji`            | `string`   | Emoji tampilan untuk Skill.                                                                                                                   |
| `homepage`         | `string`   | URL ke beranda atau dokumentasi Skill.                                                                                                        |
| `os`               | `string[]` | Pembatasan OS (mis. `["macos"]`, `["linux"]`).                                                                                                |
| `install`          | `array`    | Spesifikasi instal untuk dependensi (lihat di bawah).                                                                                         |
| `nix`              | `object`   | Spesifikasi plugin Nix (lihat README).                                                                                                        |
| `config`           | `object`   | Spesifikasi konfigurasi Clawdbot (lihat README).                                                                                              |

### Spesifikasi instal

Jika Skill Anda membutuhkan dependensi yang terinstal, deklarasikan dependensi tersebut dalam array `install`:

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

Deklarasikan variabel lingkungan opsional di bawah `metadata.openclaw.envVars` dan setel `required: false`. Jangan tambahkan entri opsional ke `requires.env`, karena `requires.env` berarti Skill tidak dapat berjalan tanpanya.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Mengapa ini penting

Analisis keamanan ClawHub memeriksa bahwa apa yang dideklarasikan Skill Anda sesuai dengan apa yang benar-benar dilakukannya. Jika kode Anda mereferensikan `TODOIST_API_KEY` tetapi frontmatter Anda tidak mendeklarasikannya di bawah `requires.env`, `primaryEnv`, atau `envVars`, analisis akan menandai ketidakcocokan metadata. Menjaga deklarasi tetap akurat membantu Skill Anda lolos tinjauan dan membantu pengguna memahami apa yang mereka instal.

### Contoh: frontmatter lengkap

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
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
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## File yang diizinkan

Hanya file “berbasis teks” yang diterima oleh publish.

- Allowlist ekstensi ada di `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- File skrip tetap dipindai setelah unggahan; file PowerShell `.ps1`, `.psm1`, dan `.psd1` diterima sebagai teks.
- Jenis konten yang dimulai dengan `text/` diperlakukan sebagai teks; ditambah allowlist kecil (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Batas (sisi server):

- Ukuran bundle total: 50MB.
- Teks embedding mencakup `SKILL.md` + hingga ~40 file non-`.md` (batas upaya terbaik).

## Slug

- Secara default diturunkan dari nama folder.
- Scope paket harus sama persis dengan handle penerbit ClawHub. Handle penerbit dapat menggunakan huruf kecil, angka, tanda hubung, titik, dan garis bawah; harus diawali dan diakhiri dengan huruf kecil atau angka.
- Slug paket harus huruf kecil dan aman untuk npm, misalnya `@example.tools/demo-plugin` atau `demo-plugin`.

## Versioning + tag

- Setiap publikasi membuat versi baru (semver).
- Tag adalah penunjuk string ke sebuah versi; `latest` umum digunakan.

## Lisensi

- Semua Skills yang dipublikasikan di ClawHub dilisensikan di bawah `MIT-0`.
- Siapa pun boleh menggunakan, memodifikasi, dan mendistribusikan ulang Skills yang dipublikasikan, termasuk secara komersial.
- Atribusi tidak diwajibkan.
- Jangan tambahkan ketentuan lisensi yang bertentangan di `SKILL.md`; ClawHub tidak mendukung penimpaan lisensi per Skill.

## Skills berbayar

- ClawHub tidak mendukung Skills berbayar, harga per Skill, paywall, atau pembagian pendapatan.
- Jangan tambahkan metadata harga ke `SKILL.md`; itu bukan bagian dari format Skill dan tidak akan membuat Skill yang dipublikasikan menjadi berbayar.
- Jika Skill Anda terintegrasi dengan layanan pihak ketiga berbayar, dokumentasikan biaya eksternal dan akun yang diperlukan dengan jelas dalam instruksi Skill dan deklarasi env (`requires.env` untuk variabel wajib, atau `envVars` dengan `required: false` untuk variabel opsional).
