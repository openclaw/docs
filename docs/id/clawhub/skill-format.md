---
read_when:
    - Menerbitkan Skills
    - Men-debug kegagalan publikasi/sinkronisasi
summary: Format folder Skill, file wajib, jenis file yang diizinkan, batas.
x-i18n:
    generated_at: "2026-05-12T12:49:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format skill

## Di disk

Skill adalah folder.

Wajib:

- `SKILL.md` (atau `skill.md`)

Opsional:

- file _berbasis teks_ pendukung apa pun (lihat “File yang diizinkan”)
- `.clawhubignore` (pola abaikan untuk publish/sync, `.clawdhubignore` lama)
- `.gitignore` (juga dihormati)

Metadata instalasi lokal (ditulis oleh CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` lama)

Status instalasi workdir (ditulis oleh CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` lama)

## `SKILL.md`

- Markdown dengan frontmatter YAML opsional.
- Server mengekstrak metadata dari frontmatter saat publish.
- `description` digunakan sebagai ringkasan skill di UI/pencarian.

## Metadata frontmatter

Metadata skill dideklarasikan dalam frontmatter YAML di bagian atas `SKILL.md` Anda. Ini memberi tahu registry (dan analisis keamanan) apa yang dibutuhkan skill Anda untuk berjalan.

### Frontmatter dasar

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadata runtime (`metadata.openclaw`)

Deklarasikan kebutuhan runtime skill Anda di bawah `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

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

Gunakan `requires.env` untuk variabel lingkungan yang harus ada sebelum skill dapat berjalan. Gunakan `envVars` saat Anda membutuhkan metadata per variabel, termasuk variabel opsional dengan `required: false`.

### Referensi bidang lengkap

| Bidang             | Tipe       | Deskripsi                                                                                                                                        |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | Variabel lingkungan wajib yang diharapkan oleh skill Anda.                                                                                       |
| `requires.bins`    | `string[]` | Biner CLI yang semuanya harus terinstal.                                                                                                         |
| `requires.anyBins` | `string[]` | Biner CLI yang setidaknya salah satunya harus ada.                                                                                               |
| `requires.config`  | `string[]` | Jalur file konfigurasi yang dibaca skill Anda.                                                                                                   |
| `primaryEnv`       | `string`   | Env var kredensial utama untuk skill Anda.                                                                                                       |
| `envVars`          | `array`    | Deklarasi variabel lingkungan dengan `name`, `required` opsional, dan `description` opsional. Atur `required: false` untuk env var opsional.     |
| `always`           | `boolean`  | Jika `true`, skill selalu aktif (tidak perlu instalasi eksplisit).                                                                               |
| `skillKey`         | `string`   | Menimpa kunci pemanggilan skill.                                                                                                                 |
| `emoji`            | `string`   | Emoji tampilan untuk skill.                                                                                                                      |
| `homepage`         | `string`   | URL ke beranda atau dokumentasi skill.                                                                                                           |
| `os`               | `string[]` | Pembatasan OS (mis. `["macos"]`, `["linux"]`).                                                                                                   |
| `install`          | `array`    | Spesifikasi instalasi untuk dependensi (lihat di bawah).                                                                                         |
| `nix`              | `object`   | Spesifikasi Plugin Nix (lihat README).                                                                                                           |
| `config`           | `object`   | Spesifikasi konfigurasi Clawdbot (lihat README).                                                                                                 |

### Spesifikasi instalasi

Jika skill Anda membutuhkan dependensi yang terinstal, deklarasikan dalam array `install`:

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

Jenis instalasi yang didukung: `brew`, `node`, `go`, `uv`.

### Variabel lingkungan opsional

Deklarasikan variabel lingkungan opsional di bawah `metadata.openclaw.envVars` dan atur `required: false`. Jangan tambahkan entri opsional ke `requires.env`, karena `requires.env` berarti skill tidak dapat berjalan tanpanya.

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

Analisis keamanan ClawHub memeriksa bahwa apa yang dideklarasikan skill Anda cocok dengan apa yang benar-benar dilakukannya. Jika kode Anda mereferensikan `TODOIST_API_KEY` tetapi frontmatter Anda tidak mendeklarasikannya di bawah `requires.env`, `primaryEnv`, atau `envVars`, analisis akan menandai ketidakcocokan metadata. Menjaga deklarasi tetap akurat membantu skill Anda lolos peninjauan dan membantu pengguna memahami apa yang mereka instal.

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

- Daftar ekstensi yang diizinkan ada di `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- File skrip tetap dipindai setelah unggahan; file PowerShell `.ps1`, `.psm1`, dan `.psd1` diterima sebagai teks.
- Jenis konten yang dimulai dengan `text/` diperlakukan sebagai teks; ditambah daftar kecil yang diizinkan (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Batas (sisi server):

- Ukuran total bundel: 50MB.
- Teks embedding mencakup `SKILL.md` + hingga sekitar 40 file non-`.md` (batas upaya terbaik).

## Slug

- Diturunkan dari nama folder secara default.
- Harus huruf kecil dan aman untuk URL: `^[a-z0-9][a-z0-9-]*$`.

## Pembuatan versi + tag

- Setiap publish membuat versi baru (semver).
- Tag adalah penunjuk string ke suatu versi; `latest` umum digunakan.

## Lisensi

- Semua skill yang dipublikasikan di ClawHub dilisensikan di bawah `MIT-0`.
- Siapa pun boleh menggunakan, memodifikasi, dan mendistribusikan ulang skill yang dipublikasikan, termasuk secara komersial.
- Atribusi tidak diwajibkan.
- Jangan tambahkan ketentuan lisensi yang bertentangan di `SKILL.md`; ClawHub tidak mendukung penimpaan lisensi per skill.

## Skill berbayar

- ClawHub tidak mendukung skill berbayar, harga per skill, paywall, atau pembagian pendapatan.
- Jangan tambahkan metadata harga ke `SKILL.md`; itu bukan bagian dari format skill dan tidak akan membuat skill yang dipublikasikan menjadi berbayar.
- Jika skill Anda terintegrasi dengan layanan pihak ketiga berbayar, dokumentasikan biaya eksternal dan akun yang diperlukan dengan jelas dalam instruksi skill dan deklarasi env (`requires.env` untuk variabel wajib, atau `envVars` dengan `required: false` untuk variabel opsional).
