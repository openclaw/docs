---
read_when:
    - Menerbitkan Skills
    - Men-debug kegagalan publikasi
summary: Format folder Skills, file wajib, jenis file yang diizinkan, batasan.
x-i18n:
    generated_at: "2026-07-12T14:00:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format skill

## Di disk

Skill adalah sebuah folder.

Wajib:

- `SKILL.md` (atau `skill.md`; format lama `skills.md` juga diterima)

Opsional:

- berkas pendukung berbasis _teks_ apa pun (lihat “Berkas yang diizinkan”)
- `.clawhubignore` (pola pengabaian untuk penerbitan, format lama `.clawdhubignore`)
- `.gitignore` (juga dipatuhi)

## Impor GitHub

Pengimpor GitHub web lebih ketat daripada penerbitan/sinkronisasi lokal. Pengimpor ini hanya menemukan berkas
`SKILL.md` atau format lama `skills.md` dalam repositori publik non-fork yang dimiliki oleh
akun GitHub yang sedang masuk. Pengimpor ini tidak mengimpor repositori privat, fork,
repositori yang diarsipkan/dinonaktifkan, atau repositori publik pihak ketiga.

Metadata instalasi lokal (ditulis oleh CLI):

- `<skill>/.clawhub/origin.json` (format lama `.clawdhub`)

Status instalasi direktori kerja (ditulis oleh CLI):

- `<workdir>/.clawhub/lock.json` (format lama `.clawdhub`)

## `SKILL.md`

- Markdown dengan frontmatter YAML opsional.
- Server mengekstrak metadata dari frontmatter selama penerbitan.
- `description` digunakan sebagai ringkasan skill di UI/pencarian.

Untuk Agent Skills yang portabel, `name` harus sesuai dengan direktori induk dan menggunakan
1–64 huruf kecil, angka, atau tanda hubung. ClawHub memisahkan slug yang dapat dirutekan dan
nama tampilan katalog, sehingga nama yang sudah ada dari klien lain tetap
dapat diterbitkan dan tidak ditulis ulang secara diam-diam. Daftar katalog dapat memendekkan nama panjang
secara visual tanpa mengubah nama yang disimpan.

## Metadata frontmatter

Metadata skill dideklarasikan dalam frontmatter YAML di bagian atas `SKILL.md` Anda. Ini memberi tahu registri (dan analisis keamanan) apa yang dibutuhkan skill Anda untuk berjalan.

### Frontmatter dasar

```yaml
---
name: my-skill
description: Ringkasan singkat tentang fungsi skill ini.
version: 1.0.0
---
```

### Metadata runtime (`metadata.openclaw`)

Deklarasikan persyaratan runtime skill Anda di bawah `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Kelola tugas melalui API Todoist.
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

Gunakan `requires.env` untuk variabel lingkungan yang wajib tersedia sebelum skill dapat berjalan. Gunakan `envVars` saat Anda memerlukan metadata per variabel, termasuk variabel opsional dengan `required: false`.

### Referensi lengkap kolom

| Kolom              | Tipe       | Deskripsi                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabel lingkungan wajib yang diharapkan oleh skill Anda.                                                                                           |
| `requires.bins`    | `string[]` | Biner CLI yang semuanya harus terinstal.                                                                                                     |
| `requires.anyBins` | `string[]` | Biner CLI yang setidaknya salah satunya harus tersedia.                                                                                                  |
| `requires.config`  | `string[]` | Jalur berkas konfigurasi yang dibaca skill Anda.                                                                                                          |
| `primaryEnv`       | `string`   | Variabel lingkungan kredensial utama untuk skill Anda.                                                                                                  |
| `envVars`          | `array`    | Deklarasi variabel lingkungan dengan `name`, `required` opsional, dan `description` opsional. Tetapkan `required: false` untuk variabel lingkungan opsional. |
| `always`           | `boolean`  | Jika `true`, skill selalu aktif (tidak memerlukan instalasi eksplisit).                                                                              |
| `skillKey`         | `string`   | Ganti kunci pemanggilan skill.                                                                                                         |
| `emoji`            | `string`   | Emoji tampilan untuk skill.                                                                                                                 |
| `homepage`         | `string`   | URL ke halaman utama atau dokumentasi skill.                                                                                                         |
| `os`               | `string[]` | Pembatasan OS (misalnya `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Spesifikasi instalasi untuk dependensi (lihat di bawah).                                                                                                  |
| `nix`              | `object`   | Spesifikasi plugin Nix (lihat README).                                                                                                                |
| `config`           | `object`   | Spesifikasi konfigurasi Clawdbot (lihat README).                                                                                                           |

### Spesifikasi instalasi

Jika skill Anda memerlukan dependensi yang harus diinstal, deklarasikan dependensi tersebut dalam larik `install`:

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

Deklarasikan variabel lingkungan opsional di bawah `metadata.openclaw.envVars` dan tetapkan `required: false`. Jangan tambahkan entri opsional ke `requires.env`, karena `requires.env` berarti skill tidak dapat berjalan tanpanya.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token API Todoist yang digunakan untuk permintaan terautentikasi.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID proyek bawaan opsional ketika pengguna tidak menentukannya.
```

### Mengapa ini penting

Analisis keamanan ClawHub memeriksa apakah deklarasi skill Anda sesuai dengan tindakan sebenarnya. Jika kode Anda merujuk `TODOIST_API_KEY` tetapi frontmatter tidak mendeklarasikannya di bawah `requires.env`, `primaryEnv`, atau `envVars`, analisis akan menandai ketidaksesuaian metadata. Menjaga agar deklarasi tetap akurat membantu skill Anda lolos peninjauan dan membantu pengguna memahami apa yang mereka instal.

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
        description: Token API Todoist.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID proyek bawaan opsional.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Berkas yang diizinkan

Hanya berkas “berbasis teks” yang diterima untuk penerbitan.

- Daftar ekstensi yang diizinkan terdapat di `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Berkas skrip tetap dipindai setelah diunggah; berkas PowerShell `.ps1`, `.psm1`, dan `.psd1` diterima sebagai teks.
- Jenis konten yang diawali dengan `text/` diperlakukan sebagai teks; ditambah daftar kecil yang diizinkan (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Batasan (sisi server):

- Ukuran total bundel: 50MB.
- Teks penyematan mencakup `SKILL.md` + hingga sekitar 40 berkas non-`.md` (batas upaya terbaik).

## Slug

- Secara bawaan berasal dari nama folder.
- Cakupan paket harus sama persis dengan nama pengguna penerbit ClawHub. Nama pengguna penerbit dapat menggunakan huruf kecil, angka, tanda hubung, titik, dan garis bawah; nama tersebut harus diawali dan diakhiri dengan huruf kecil atau angka.
- Slug paket harus menggunakan huruf kecil dan aman untuk npm, misalnya `@example.tools/demo-plugin` atau `demo-plugin`.

## Pembuatan versi + tag

- Setiap penerbitan membuat versi baru (semver).
- Tag adalah penunjuk string ke suatu versi; `latest` umum digunakan.

## Lisensi

- Semua skill yang diterbitkan di ClawHub dilisensikan di bawah `MIT-0`.
- Siapa pun dapat menggunakan, mengubah, dan mendistribusikan ulang skill yang diterbitkan, termasuk secara komersial.
- Atribusi tidak diwajibkan.
- Jangan tambahkan ketentuan lisensi yang bertentangan dalam `SKILL.md`; ClawHub tidak mendukung penggantian lisensi per skill.

## Skill berbayar

- ClawHub tidak mendukung skill berbayar, harga per skill, paywall, atau pembagian pendapatan.
- Jangan tambahkan metadata harga ke `SKILL.md`; metadata tersebut bukan bagian dari format skill dan tidak akan membuat skill yang diterbitkan menjadi berbayar.
- Jika skill Anda terintegrasi dengan layanan pihak ketiga berbayar, dokumentasikan biaya eksternal dan akun yang diperlukan secara jelas dalam petunjuk skill serta deklarasi variabel lingkungan (`requires.env` untuk variabel wajib, atau `envVars` dengan `required: false` untuk variabel opsional).
