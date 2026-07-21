---
read_when:
    - Menerbitkan Skills
    - Men-debug kegagalan publikasi
summary: Format folder Skills, file yang diperlukan, artefak pendukung, batasan.
x-i18n:
    generated_at: "2026-07-21T12:17:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fdf16a589b8961ccd9181a53a9fa92a358952b9147d22eaf977f23e0b4b4d653
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format keterampilan

## Di disk

Keterampilan adalah sebuah folder.

Wajib:

- `SKILL.md` (atau `skill.md`; `skills.md` lama juga diterima)

Opsional:

- semua file reguler pendukung (lihat “File keterampilan”)
- `.clawhubignore` (pola pengabaian untuk penerbitan, `.clawdhubignore` lama)
- `.gitignore` (juga dipatuhi)

## Impor GitHub

Pengimpor GitHub berbasis web lebih ketat daripada penerbitan/sinkronisasi lokal. Pengimpor ini hanya menemukan
file `SKILL.md` atau `skills.md` lama di repositori publik non-fork yang dimiliki oleh
akun GitHub yang sedang masuk. Pengimpor ini tidak mengimpor repositori privat, fork,
repositori yang diarsipkan/dinonaktifkan, atau repositori publik pihak ketiga.

Metadata instalasi lokal (ditulis oleh CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` lama)

Status instalasi direktori kerja (ditulis oleh CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` lama)

## `SKILL.md`

- Markdown dengan frontmatter YAML opsional.
- Server mengekstrak metadata dari frontmatter selama penerbitan.
- `description` digunakan sebagai ringkasan keterampilan di UI/pencarian.

Untuk Agent Skills portabel, `name` harus cocok dengan direktori induk dan menggunakan
1–64 huruf kecil, angka, atau tanda hubung. ClawHub memisahkan slug yang dapat dirutekan dan
nama tampilan katalog, sehingga nama yang sudah ada dari klien lain tetap
dapat diterbitkan dan tidak ditulis ulang secara diam-diam. Daftar katalog dapat memendekkan nama panjang
secara visual tanpa mengubah nama yang disimpan.

## Metadata frontmatter

Metadata keterampilan dideklarasikan dalam frontmatter YAML di bagian atas `SKILL.md`. Metadata ini memberi tahu registri (dan analisis keamanan) apa yang diperlukan keterampilan Anda agar dapat berjalan.

### Frontmatter dasar

```yaml
---
name: my-skill
description: Ringkasan singkat tentang fungsi keterampilan ini.
version: 1.0.0
---
```

### Metadata runtime (`metadata.openclaw`)

Deklarasikan persyaratan runtime keterampilan Anda di bawah `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

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

Gunakan `requires.env` untuk variabel lingkungan yang harus tersedia sebelum keterampilan dapat berjalan. Gunakan `envVars` jika Anda memerlukan metadata per variabel, termasuk variabel opsional dengan `required: false`.

### Referensi lengkap bidang

| Bidang             | Jenis      | Deskripsi                                                                                                                                    |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabel lingkungan wajib yang diharapkan oleh keterampilan Anda.                                                                            |
| `requires.bins`    | `string[]` | Biner CLI yang semuanya harus terinstal.                                                                                                     |
| `requires.anyBins` | `string[]` | Biner CLI yang setidaknya salah satunya harus tersedia.                                                                                      |
| `requires.config`  | `string[]` | Jalur file konfigurasi yang dibaca oleh keterampilan Anda.                                                                                   |
| `primaryEnv`       | `string`   | Variabel lingkungan kredensial utama untuk keterampilan Anda.                                                                                |
| `envVars`          | `array`    | Deklarasi variabel lingkungan dengan `name`, `required` opsional, dan `description` opsional. Tetapkan `required: false` untuk variabel lingkungan opsional. |
| `always`           | `boolean`  | Jika `true`, keterampilan selalu aktif (tidak memerlukan instalasi eksplisit).                                                    |
| `skillKey`         | `string`   | Ganti kunci pemanggilan keterampilan.                                                                                                        |
| `emoji`            | `string`   | Emoji tampilan untuk keterampilan.                                                                                                           |
| `homepage`         | `string`   | URL ke halaman utama atau dokumentasi keterampilan.                                                                                          |
| `os`               | `string[]` | Pembatasan OS (misalnya `["macos"]`, `["linux"]`).                                                                             |
| `install`          | `array`    | Spesifikasi instalasi untuk dependensi (lihat di bawah).                                                                                     |
| `nix`              | `object`   | Spesifikasi plugin Nix (lihat README).                                                                                                       |
| `config`           | `object`   | Spesifikasi konfigurasi Clawdbot (lihat README).                                                                                             |

### Spesifikasi instalasi

Jika keterampilan Anda memerlukan dependensi yang harus diinstal, deklarasikan dependensi tersebut dalam larik `install`:

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
        description: Token API Todoist yang digunakan untuk permintaan terautentikasi.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID proyek default opsional ketika pengguna tidak menentukannya.
```

### Mengapa hal ini penting

Analisis keamanan ClawHub memeriksa apakah yang dideklarasikan keterampilan Anda sesuai dengan yang benar-benar dilakukannya. Jika kode Anda merujuk `TODOIST_API_KEY` tetapi frontmatter Anda tidak mendeklarasikannya di bawah `requires.env`, `primaryEnv`, atau `envVars`, analisis akan menandai ketidakcocokan metadata. Menjaga deklarasi tetap akurat membantu keterampilan Anda lolos review dan membantu pengguna memahami apa yang mereka instal.

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
        description: ID proyek default opsional.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## File keterampilan

Penerbitan menerima semua file reguler dalam folder keterampilan, apa pun ekstensinya. File yang diabaikan,
jalur tersembunyi, symlink, metadata macOS, dan batas ukuran sisi server tetap berlaku.

- File berukuran terbatas yang berisi UTF-8 valid dapat dipratinjau sebagai teks biasa yang di-escape dan disertakan
  dalam analisis teks terbatas.
- File lain mempertahankan byte persisnya dan tersedia untuk diunduh.
- Pemindai keamanan menerima artefak lengkap yang disimpan; deteksi teks merupakan persoalan rendering dan
  analisis, bukan daftar yang diizinkan untuk unggahan.

Batas (sisi server):

- Ukuran total bundel: 50MB.
- Teks penyematan mencakup `SKILL.md` + hingga sekitar 40 file UTF-8 berukuran terbatas (batas upaya terbaik).

## Slug

- Secara default diturunkan dari nama folder.
- Cakupan paket harus sama persis dengan handle penerbit ClawHub. Handle penerbit dapat menggunakan huruf kecil, angka, tanda hubung, titik, dan garis bawah; handle harus diawali dan diakhiri dengan huruf kecil atau angka.
- Slug paket harus menggunakan huruf kecil dan aman untuk npm, misalnya `@example.tools/demo-plugin` atau `demo-plugin`.

## Pembuatan versi + tag

- Setiap penerbitan membuat versi baru (semver).
- Tag adalah penunjuk string ke suatu versi; `latest` umum digunakan.

## Lisensi

- Semua keterampilan yang diterbitkan di ClawHub dilisensikan berdasarkan `MIT-0`.
- Siapa pun dapat menggunakan, memodifikasi, dan mendistribusikan ulang keterampilan yang diterbitkan, termasuk secara komersial.
- Atribusi tidak diwajibkan.
- Jangan tambahkan ketentuan lisensi yang bertentangan dalam `SKILL.md`; ClawHub tidak mendukung penggantian lisensi per keterampilan.

## Keterampilan berbayar

- ClawHub tidak mendukung keterampilan berbayar, penetapan harga per keterampilan, paywall, atau bagi hasil.
- Jangan tambahkan metadata harga ke `SKILL.md`; metadata tersebut bukan bagian dari format keterampilan dan tidak akan membuat keterampilan yang diterbitkan menjadi berbayar.
- Jika keterampilan Anda terintegrasi dengan layanan pihak ketiga berbayar, dokumentasikan biaya eksternal dan akun yang diperlukan dengan jelas dalam petunjuk keterampilan dan deklarasi lingkungan (`requires.env` untuk variabel wajib, atau `envVars` dengan `required: false` untuk variabel opsional).
