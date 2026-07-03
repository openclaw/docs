---
read_when:
    - Menerbitkan Skills
    - Men-debug kegagalan penerbitan
summary: Format folder Skills, berkas wajib, jenis berkas yang diizinkan, batasan.
x-i18n:
    generated_at: "2026-07-03T17:41:09Z"
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

- file pendukung berbasis _teks_ apa pun (lihat “File yang diizinkan”)
- `.clawhubignore` (pola abaikan untuk publikasi, `.clawdhubignore` lama)
- `.gitignore` (juga dihormati)

## Impor GitHub

Pengimpor GitHub web lebih ketat daripada publikasi/sinkronisasi lokal. Pengimpor ini hanya menemukan
file `SKILL.md` atau `skills.md` lama di repositori publik, bukan fork, yang dimiliki oleh
akun GitHub yang sedang masuk. Pengimpor ini tidak mengimpor repo privat, fork,
repo yang diarsipkan/dinonaktifkan, atau repo publik pihak ketiga.

Metadata instalasi lokal (ditulis oleh CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` lama)

Status instalasi workdir (ditulis oleh CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` lama)

## `SKILL.md`

- Markdown dengan frontmatter YAML opsional.
- Server mengekstrak metadata dari frontmatter saat publikasi.
- `description` digunakan sebagai ringkasan keterampilan di UI/pencarian.

## Metadata frontmatter

Metadata keterampilan dideklarasikan dalam frontmatter YAML di bagian atas `SKILL.md` Anda. Ini memberi tahu registry (dan analisis keamanan) apa yang dibutuhkan keterampilan Anda untuk berjalan.

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

| Bidang             | Tipe       | Deskripsi                                                                                                                                             |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabel lingkungan wajib yang diharapkan keterampilan Anda.                                                                                          |
| `requires.bins`    | `string[]` | Biner CLI yang semuanya harus terpasang.                                                                                                              |
| `requires.anyBins` | `string[]` | Biner CLI dengan setidaknya satu yang harus ada.                                                                                                      |
| `requires.config`  | `string[]` | Jalur file konfigurasi yang dibaca keterampilan Anda.                                                                                                 |
| `primaryEnv`       | `string`   | Variabel lingkungan kredensial utama untuk keterampilan Anda.                                                                                         |
| `envVars`          | `array`    | Deklarasi variabel lingkungan dengan `name`, `required` opsional, dan `description` opsional. Tetapkan `required: false` untuk variabel env opsional. |
| `always`           | `boolean`  | Jika `true`, keterampilan selalu aktif (tidak perlu instalasi eksplisit).                                                                             |
| `skillKey`         | `string`   | Timpa kunci pemanggilan keterampilan.                                                                                                                 |
| `emoji`            | `string`   | Emoji tampilan untuk keterampilan.                                                                                                                    |
| `homepage`         | `string`   | URL ke beranda atau docs keterampilan.                                                                                                                |
| `os`               | `string[]` | Pembatasan OS (mis. `["macos"]`, `["linux"]`).                                                                                                       |
| `install`          | `array`    | Spesifikasi instalasi untuk dependensi (lihat di bawah).                                                                                              |
| `nix`              | `object`   | Spesifikasi plugin Nix (lihat README).                                                                                                                |
| `config`           | `object`   | Spesifikasi konfigurasi Clawdbot (lihat README).                                                                                                      |

### Spesifikasi instalasi

Jika keterampilan Anda membutuhkan dependensi yang dipasang, deklarasikan di array `install`:

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

Deklarasikan variabel lingkungan opsional di bawah `metadata.openclaw.envVars` dan tetapkan `required: false`. Jangan tambahkan entri opsional ke `requires.env`, karena `requires.env` berarti keterampilan tidak dapat berjalan tanpanya.

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

Analisis keamanan ClawHub memeriksa bahwa apa yang dideklarasikan keterampilan Anda sesuai dengan apa yang sebenarnya dilakukannya. Jika kode Anda merujuk `TODOIST_API_KEY` tetapi frontmatter Anda tidak mendeklarasikannya di bawah `requires.env`, `primaryEnv`, atau `envVars`, analisis akan menandai ketidakcocokan metadata. Menjaga deklarasi tetap akurat membantu keterampilan Anda lolos peninjauan dan membantu pengguna memahami apa yang mereka pasang.

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
- File skrip tetap dipindai setelah unggahan; file PowerShell `.ps1`, `.psm1`, dan `.psd1` diterima sebagai teks.
- Tipe konten yang dimulai dengan `text/` diperlakukan sebagai teks; ditambah allowlist kecil (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Batas (sisi server):

- Ukuran total bundel: 50MB.
- Teks embedding mencakup `SKILL.md` + hingga sekitar 40 file non-`.md` (batas upaya terbaik).

## Slug

- Secara default diturunkan dari nama folder.
- Cakupan paket harus sama persis dengan handle penerbit ClawHub. Handle penerbit dapat menggunakan huruf kecil, angka, tanda hubung, titik, dan garis bawah; harus diawali dan diakhiri dengan huruf kecil atau angka.
- Slug paket harus huruf kecil dan aman untuk npm, misalnya `@example.tools/demo-plugin` atau `demo-plugin`.

## Pemberian versi + tag

- Setiap publikasi membuat versi baru (semver).
- Tag adalah penunjuk string ke sebuah versi; `latest` umum digunakan.

## Lisensi

- Semua keterampilan yang dipublikasikan di ClawHub dilisensikan di bawah `MIT-0`.
- Siapa pun boleh menggunakan, memodifikasi, dan mendistribusikan ulang keterampilan yang dipublikasikan, termasuk secara komersial.
- Atribusi tidak diwajibkan.
- Jangan tambahkan ketentuan lisensi yang bertentangan di `SKILL.md`; ClawHub tidak mendukung penimpaan lisensi per keterampilan.

## Keterampilan berbayar

- ClawHub tidak mendukung keterampilan berbayar, harga per keterampilan, paywall, atau pembagian pendapatan.
- Jangan tambahkan metadata harga ke `SKILL.md`; itu bukan bagian dari format keterampilan dan tidak akan membuat keterampilan yang dipublikasikan menjadi berbayar.
- Jika keterampilan Anda berintegrasi dengan layanan pihak ketiga berbayar, dokumentasikan biaya eksternal dan akun yang diperlukan dengan jelas dalam instruksi keterampilan dan deklarasi env (`requires.env` untuk variabel wajib, atau `envVars` dengan `required: false` untuk variabel opsional).
