---
read_when:
    - Mempublikasikan Skills
    - Mendiagnosis kegagalan publikasi
summary: Format folder Skills, berkas yang wajib, jenis berkas yang diizinkan, batasan.
x-i18n:
    generated_at: "2026-07-01T08:30:54Z"
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
- `.clawhubignore` (pola abaikan untuk publikasi, `.clawdhubignore` lama)
- `.gitignore` (juga dihormati)

## Impor GitHub

Pengimpor GitHub web lebih ketat daripada publish/sync lokal. Pengimpor ini hanya menemukan
file `SKILL.md` atau `skills.md` lama di repositori publik non-fork yang dimiliki oleh
akun GitHub yang sedang masuk. Pengimpor ini tidak mengimpor repo privat, fork,
repo yang diarsipkan/dinonaktifkan, atau repo publik pihak ketiga.

Metadata instal lokal (ditulis oleh CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` lama)

Status instal workdir (ditulis oleh CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` lama)

## `SKILL.md`

- Markdown dengan frontmatter YAML opsional.
- Server mengekstrak metadata dari frontmatter saat publikasi.
- `description` digunakan sebagai ringkasan skill di UI/pencarian.

## Metadata frontmatter

Metadata Skill dideklarasikan dalam frontmatter YAML di bagian atas `SKILL.md` Anda. Ini memberi tahu registry (dan analisis keamanan) apa yang dibutuhkan skill Anda untuk berjalan.

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

Gunakan `requires.env` untuk variabel lingkungan yang harus ada sebelum skill dapat berjalan. Gunakan `envVars` saat Anda memerlukan metadata per variabel, termasuk variabel opsional dengan `required: false`.

### Referensi field lengkap

| Field              | Tipe       | Deskripsi                                                                                                                                     |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabel lingkungan wajib yang diharapkan oleh skill Anda.                                                                                    |
| `requires.bins`    | `string[]` | Binary CLI yang semuanya harus terinstal.                                                                                                     |
| `requires.anyBins` | `string[]` | Binary CLI yang setidaknya salah satunya harus ada.                                                                                           |
| `requires.config`  | `string[]` | Path file config yang dibaca skill Anda.                                                                                                      |
| `primaryEnv`       | `string`   | Env var kredensial utama untuk skill Anda.                                                                                                    |
| `envVars`          | `array`    | Deklarasi variabel lingkungan dengan `name`, `required` opsional, dan `description` opsional. Atur `required: false` untuk env var opsional. |
| `always`           | `boolean`  | Jika `true`, skill selalu aktif (tidak perlu instal eksplisit).                                                                               |
| `skillKey`         | `string`   | Menimpa kunci pemanggilan skill.                                                                                                              |
| `emoji`            | `string`   | Emoji tampilan untuk skill.                                                                                                                   |
| `homepage`         | `string`   | URL ke beranda atau docs skill.                                                                                                               |
| `os`               | `string[]` | Pembatasan OS (mis. `["macos"]`, `["linux"]`).                                                                                                |
| `install`          | `array`    | Spesifikasi instal untuk dependensi (lihat di bawah).                                                                                         |
| `nix`              | `object`   | Spesifikasi Plugin Nix (lihat README).                                                                                                        |
| `config`           | `object`   | Spesifikasi config Clawdbot (lihat README).                                                                                                   |

### Spesifikasi instal

Jika skill Anda membutuhkan dependensi yang terinstal, deklarasikan di array `install`:

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

Analisis keamanan ClawHub memeriksa bahwa apa yang dideklarasikan skill Anda sesuai dengan apa yang benar-benar dilakukannya. Jika kode Anda merujuk `TODOIST_API_KEY` tetapi frontmatter Anda tidak mendeklarasikannya di bawah `requires.env`, `primaryEnv`, atau `envVars`, analisis akan menandai ketidaksesuaian metadata. Menjaga deklarasi tetap akurat membantu skill Anda lolos peninjauan dan membantu pengguna memahami apa yang mereka instal.

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

Hanya file “berbasis teks” yang diterima oleh publikasi.

- Allowlist ekstensi ada di `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- File skrip tetap dipindai setelah unggah; file PowerShell `.ps1`, `.psm1`, dan `.psd1` diterima sebagai teks.
- Content type yang diawali dengan `text/` diperlakukan sebagai teks; ditambah allowlist kecil (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Batas (sisi server):

- Total ukuran bundle: 50MB.
- Teks embedding mencakup `SKILL.md` + hingga sekitar 40 file non-`.md` (batas best-effort).

## Slug

- Secara default diturunkan dari nama folder.
- Scope paket harus sama persis dengan handle penerbit ClawHub. Handle penerbit dapat menggunakan huruf kecil, angka, tanda hubung, titik, dan garis bawah; harus diawali dan diakhiri dengan huruf kecil atau angka.
- Slug paket harus huruf kecil dan aman untuk npm, misalnya `@example.tools/demo-plugin` atau `demo-plugin`.

## Versioning + tag

- Setiap publikasi membuat versi baru (semver).
- Tag adalah pointer string ke sebuah versi; `latest` umum digunakan.

## Lisensi

- Semua skills yang dipublikasikan di ClawHub dilisensikan di bawah `MIT-0`.
- Siapa pun boleh menggunakan, memodifikasi, dan mendistribusikan ulang skills yang dipublikasikan, termasuk secara komersial.
- Atribusi tidak diwajibkan.
- Jangan tambahkan ketentuan lisensi yang bertentangan di `SKILL.md`; ClawHub tidak mendukung override lisensi per skill.

## Skill berbayar

- ClawHub tidak mendukung skill berbayar, harga per skill, paywall, atau pembagian pendapatan.
- Jangan tambahkan metadata harga ke `SKILL.md`; itu bukan bagian dari format skill dan tidak akan membuat skill yang dipublikasikan menjadi berbayar.
- Jika skill Anda terintegrasi dengan layanan pihak ketiga berbayar, dokumentasikan biaya eksternal dan akun yang diperlukan dengan jelas dalam instruksi skill dan deklarasi env (`requires.env` untuk variabel wajib, atau `envVars` dengan `required: false` untuk variabel opsional).
