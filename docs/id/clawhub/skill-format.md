---
read_when:
    - Menerbitkan Skills
    - Men-debug kegagalan publikasi
summary: Format folder Skill, berkas wajib, jenis berkas yang diizinkan, batasan.
x-i18n:
    generated_at: "2026-07-02T08:50:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format keterampilan

## Di disk

Keterampilan adalah sebuah folder.

Wajib:

- `SKILL.md` (atau `skill.md`; `skills.md` lama juga diterima)

Opsional:

- file pendukung _berbasis teks_ apa pun (lihat “File yang diizinkan”)
- `.clawhubignore` (pola pengecualian untuk publikasi, `.clawdhubignore` lama)
- `.gitignore` (juga dihormati)

## Impor GitHub

Pengimpor GitHub web lebih ketat daripada publikasi/sinkronisasi lokal. Pengimpor ini hanya menemukan
file `SKILL.md` atau `skills.md` lama di repositori publik non-fork yang dimiliki oleh
akun GitHub yang sedang masuk. Pengimpor ini tidak mengimpor repo privat, fork,
repo yang diarsipkan/dinonaktifkan, atau repo publik pihak ketiga.

Metadata pemasangan lokal (ditulis oleh CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` lama)

Status pemasangan workdir (ditulis oleh CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` lama)

## `SKILL.md`

- Markdown dengan frontmatter YAML opsional.
- Server mengekstrak metadata dari frontmatter saat publikasi.
- `description` digunakan sebagai ringkasan keterampilan di UI/pencarian.

## Metadata frontmatter

Metadata keterampilan dideklarasikan di frontmatter YAML di bagian atas `SKILL.md` Anda. Ini memberi tahu registry (dan analisis keamanan) apa yang dibutuhkan keterampilan Anda untuk berjalan.

### Frontmatter dasar

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadata runtime (`metadata.openclaw`)

Deklarasikan kebutuhan runtime keterampilan Anda di bawah `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

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

Gunakan `requires.env` untuk variabel lingkungan yang harus ada sebelum keterampilan dapat berjalan. Gunakan `envVars` saat Anda membutuhkan metadata per variabel, termasuk variabel opsional dengan `required: false`.

### Referensi bidang lengkap

| Bidang             | Jenis      | Deskripsi                                                                                                                                    |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabel lingkungan wajib yang diharapkan oleh keterampilan Anda.                                                                             |
| `requires.bins`    | `string[]` | Biner CLI yang semuanya harus terpasang.                                                                                                      |
| `requires.anyBins` | `string[]` | Biner CLI dengan setidaknya satu yang harus ada.                                                                                              |
| `requires.config`  | `string[]` | Jalur file konfigurasi yang dibaca keterampilan Anda.                                                                                         |
| `primaryEnv`       | `string`   | Variabel lingkungan kredensial utama untuk keterampilan Anda.                                                                                 |
| `envVars`          | `array`    | Deklarasi variabel lingkungan dengan `name`, `required` opsional, dan `description` opsional. Atur `required: false` untuk variabel env opsional. |
| `always`           | `boolean`  | Jika `true`, keterampilan selalu aktif (tidak perlu pemasangan eksplisit).                                                                    |
| `skillKey`         | `string`   | Ganti kunci pemanggilan keterampilan.                                                                                                         |
| `emoji`            | `string`   | Emoji tampilan untuk keterampilan.                                                                                                            |
| `homepage`         | `string`   | URL ke beranda atau dokumentasi keterampilan.                                                                                                 |
| `os`               | `string[]` | Pembatasan OS (mis. `["macos"]`, `["linux"]`).                                                                                                |
| `install`          | `array`    | Spesifikasi pemasangan untuk dependensi (lihat di bawah).                                                                                     |
| `nix`              | `object`   | Spesifikasi Plugin Nix (lihat README).                                                                                                        |
| `config`           | `object`   | Spesifikasi konfigurasi Clawdbot (lihat README).                                                                                              |

### Spesifikasi pemasangan

Jika keterampilan Anda membutuhkan dependensi yang terpasang, deklarasikan di array `install`:

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

Jenis pemasangan yang didukung: `brew`, `node`, `go`, `uv`.

### Variabel lingkungan opsional

Deklarasikan variabel lingkungan opsional di bawah `metadata.openclaw.envVars` dan atur `required: false`. Jangan tambahkan entri opsional ke `requires.env`, karena `requires.env` berarti keterampilan tidak dapat berjalan tanpanya.

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

Analisis keamanan ClawHub memeriksa bahwa apa yang dideklarasikan keterampilan Anda cocok dengan apa yang benar-benar dilakukannya. Jika kode Anda mereferensikan `TODOIST_API_KEY` tetapi frontmatter Anda tidak mendeklarasikannya di bawah `requires.env`, `primaryEnv`, atau `envVars`, analisis akan menandai ketidakcocokan metadata. Menjaga deklarasi tetap akurat membantu keterampilan Anda lulus peninjauan dan membantu pengguna memahami apa yang mereka pasang.

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

- Daftar ekstensi yang diizinkan ada di `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- File skrip tetap dipindai setelah unggahan; file PowerShell `.ps1`, `.psm1`, dan `.psd1` diterima sebagai teks.
- Jenis konten yang dimulai dengan `text/` diperlakukan sebagai teks; ditambah daftar kecil yang diizinkan (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Batas (sisi server):

- Ukuran bundle total: 50MB.
- Teks embedding mencakup `SKILL.md` + hingga sekitar 40 file non-`.md` (batas upaya terbaik).

## Slug

- Diturunkan dari nama folder secara default.
- Scope paket harus sama persis dengan handle penerbit ClawHub. Handle penerbit dapat menggunakan huruf kecil, angka, tanda hubung, titik, dan garis bawah; harus diawali dan diakhiri dengan huruf kecil atau angka.
- Slug paket harus huruf kecil dan aman untuk npm, misalnya `@example.tools/demo-plugin` atau `demo-plugin`.

## Pembuatan versi + tag

- Setiap publikasi membuat versi baru (semver).
- Tag adalah penunjuk string ke sebuah versi; `latest` umum digunakan.

## Lisensi

- Semua keterampilan yang diterbitkan di ClawHub dilisensikan di bawah `MIT-0`.
- Siapa pun boleh menggunakan, memodifikasi, dan mendistribusikan ulang keterampilan yang diterbitkan, termasuk secara komersial.
- Atribusi tidak diperlukan.
- Jangan tambahkan ketentuan lisensi yang bertentangan di `SKILL.md`; ClawHub tidak mendukung penggantian lisensi per keterampilan.

## Keterampilan berbayar

- ClawHub tidak mendukung keterampilan berbayar, harga per keterampilan, paywall, atau bagi hasil.
- Jangan tambahkan metadata harga ke `SKILL.md`; itu bukan bagian dari format keterampilan dan tidak akan membuat keterampilan yang diterbitkan menjadi berbayar.
- Jika keterampilan Anda terintegrasi dengan layanan pihak ketiga berbayar, dokumentasikan biaya eksternal dan akun yang diperlukan dengan jelas dalam instruksi keterampilan dan deklarasi env (`requires.env` untuk variabel wajib, atau `envVars` dengan `required: false` untuk variabel opsional).
