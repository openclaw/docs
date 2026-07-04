---
read_when:
    - Menjelaskan apa itu ClawHub
    - Mencari, menginstal, atau memperbarui Skills atau Plugin
    - Menerbitkan Skills atau plugin ke registry
    - Memilih antara alur CLI openclaw dan clawhub
sidebarTitle: ClawHub
summary: Ikhtisar publik ClawHub untuk penemuan, instalasi, penerbitan, keamanan, dan CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T04:06:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub adalah registri publik untuk Skills dan Plugin OpenClaw.

- Gunakan perintah `openclaw` bawaan untuk mencari, memasang, dan memperbarui Skills serta memasang Plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk autentikasi registri, penerbitan, dan alur kerja hapus/batalkan hapus.

Situs: [clawhub.ai](https://clawhub.ai)

## Mulai cepat

Cari dan pasang Skills dengan OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Cari dan pasang Plugin dengan OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Pasang CLI ClawHub saat Anda menginginkan alur kerja yang diautentikasi registri seperti
menerbitkan atau menghapus/membatalkan hapus:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Apa yang dihosting ClawHub

| Area           | Yang disimpan                                               | Perintah umum                                |
| -------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Skills         | Bundel teks berversi dengan `SKILL.md` plus file pendukung  | `openclaw skills install @openclaw/demo`     |
| Plugin kode    | Paket Plugin OpenClaw dengan metadata kompatibilitas        | `openclaw plugins install clawhub:<package>` |
| Plugin bundel  | Bundel Plugin terpaket untuk distribusi OpenClaw            | `clawhub package publish <source>`           |

ClawHub melacak versi semver, tag seperti `latest`, catatan perubahan, file,
unduhan, bintang, dan ringkasan pemindaian keamanan. Halaman publik menampilkan status registri
saat ini agar pengguna dapat memeriksa Skill atau Plugin sebelum memasangnya.

## Alur bawaan OpenClaw

Perintah bawaan OpenClaw memasang ke workspace OpenClaw yang aktif dan mempertahankan
metadata sumber agar perintah pembaruan berikutnya dapat tetap menggunakan ClawHub.

Gunakan `clawhub:<package>` saat pemasangan Plugin harus diselesaikan melalui ClawHub.
Spesifikasi Plugin aman npm tanpa prefiks dapat diselesaikan melalui npm selama peralihan peluncuran, dan
`npm:<package>` tetap hanya npm saat sumber harus dibuat eksplisit.

Pemasangan Plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion`
yang diiklankan sebelum pemasangan arsip berjalan. Saat sebuah versi paket menerbitkan artefak
ClawPack, OpenClaw memprioritaskan `.tgz` npm-pack unggahan yang persis sama, memverifikasi
header digest ClawHub dan byte yang diunduh, serta mencatat metadata artefak untuk
pembaruan berikutnya.

## CLI ClawHub

CLI ClawHub digunakan untuk pekerjaan yang diautentikasi registri:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI juga memiliki perintah pemasangan/pembaruan Skill untuk alur kerja registri langsung:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Perintah tersebut memasang Skills ke `./skills` di bawah direktori kerja saat ini
dan mencatat versi terpasang di `.clawhub/lock.json`.

## Penerbitan

Terbitkan Skills dari folder lokal yang berisi `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opsi penerbitan umum:

- `--slug <slug>`: nama URL Skill yang diterbitkan.
- `--name <name>`: nama tampilan.
- `--version <version>`: versi semver.
- `--changelog <text>`: teks catatan perubahan.
- `--tags <tags>`: tag yang dipisahkan koma, default ke `latest`.

Terbitkan Plugin dari folder lokal, `owner/repo`, `owner/repo@ref`, atau URL GitHub:

```bash
clawhub package publish <source>
```

Gunakan `--dry-run` untuk membuat rencana penerbitan yang persis tanpa mengunggah, dan `--json`
untuk output yang ramah CI.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw yang diwajibkan di
`package.json`, termasuk `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`. Lihat [CLI](/id/clawhub/cli) untuk referensi perintah
lengkap dan [Format Skill](/clawhub/skill-format) untuk metadata Skill.

## Keamanan dan moderasi

ClawHub terbuka secara default: siapa pun dapat mengunggah, tetapi penerbitan memerlukan akun GitHub
yang cukup lama untuk melewati gerbang unggahan. Halaman detail publik merangkum
status pemindaian terbaru sebelum pemasangan atau pengunduhan.

ClawHub menjalankan pemeriksaan otomatis pada Skills dan rilis Plugin yang diterbitkan. Rilis yang ditahan pemindaian
atau diblokir dapat hilang dari katalog publik dan permukaan pemasangan sambil
tetap terlihat oleh pemiliknya di `/dashboard`.

Pengguna yang masuk dapat melaporkan Skills dan paket. Moderator dapat meninjau laporan,
menyembunyikan atau memulihkan konten, dan memblokir akun yang menyalahgunakan layanan. Lihat
[Keamanan](/id/clawhub/security),
[Audit Keamanan](/clawhub/security-audits),
[Moderasi dan Keamanan Akun](/clawhub/moderation), dan
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage) untuk detail kebijakan dan penegakan.

## Telemetri dan lingkungan

Saat Anda menjalankan `clawhub install` ketika sudah masuk, CLI dapat mengirim peristiwa pemasangan
upaya terbaik agar ClawHub dapat menghitung jumlah pemasangan agregat. Nonaktifkan ini dengan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Override lingkungan yang berguna:

| Variabel                      | Efek                                                   |
| ----------------------------- | ------------------------------------------------------ |
| `CLAWHUB_SITE`                | Override URL situs yang digunakan untuk login browser. |
| `CLAWHUB_REGISTRY`            | Override URL API registri.                             |
| `CLAWHUB_CONFIG_PATH`         | Override lokasi CLI menyimpan status token/konfigurasi. |
| `CLAWHUB_WORKDIR`             | Override direktori kerja default.                      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Nonaktifkan telemetri pemasangan.                      |

Lihat [Telemetri](/clawhub/telemetry), [HTTP API](/clawhub/http-api), dan
[Pemecahan masalah](/id/clawhub/troubleshooting) untuk materi referensi yang lebih mendalam.
