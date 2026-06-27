---
read_when:
    - Menjelaskan apa itu ClawHub
    - Mencari, memasang, atau memperbarui Skills atau Plugin
    - Menerbitkan Skills atau plugin ke registri
    - Memilih antara alur CLI openclaw dan clawhub
sidebarTitle: ClawHub
summary: Ikhtisar ClawHub publik untuk penemuan, instalasi, penerbitan, keamanan, dan CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-27T17:15:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub adalah registri publik untuk Skills dan plugin OpenClaw.

- Gunakan perintah `openclaw` bawaan untuk mencari, menginstal, dan memperbarui Skills serta untuk menginstal plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk alur kerja autentikasi registri, publikasi, dan hapus/batalkan hapus.

Situs: [clawhub.ai](https://clawhub.ai)

## Mulai cepat

Cari dan instal Skills dengan OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Cari dan instal plugin dengan OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instal CLI ClawHub saat Anda memerlukan alur kerja yang diautentikasi registri seperti
publikasi atau hapus/batalkan hapus:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Yang dihosting ClawHub

| Permukaan      | Yang disimpan                                               | Perintah umum                               |
| -------------- | ----------------------------------------------------------- | ------------------------------------------- |
| Skills         | Bundle teks berversi dengan `SKILL.md` plus file pendukung  | `openclaw skills install @openclaw/demo`    |
| Plugin kode    | Paket plugin OpenClaw dengan metadata kompatibilitas        | `openclaw plugins install clawhub:<package>` |
| Plugin bundle  | Bundle plugin terpaket untuk distribusi OpenClaw            | `clawhub package publish <source>`          |

ClawHub melacak versi semver, tag seperti `latest`, changelog, file,
unduhan, bintang, dan ringkasan pemindaian keamanan. Halaman publik menampilkan status registri
saat ini agar pengguna dapat memeriksa skill atau plugin sebelum menginstalnya.

## Alur bawaan OpenClaw

Perintah bawaan OpenClaw menginstal ke workspace OpenClaw aktif dan menyimpan
metadata sumber agar perintah pembaruan berikutnya dapat tetap menggunakan ClawHub.

Gunakan `clawhub:<package>` saat instalasi plugin harus di-resolve melalui ClawHub.
Spesifikasi plugin bare yang aman untuk npm dapat di-resolve melalui npm selama transisi peluncuran, dan
`npm:<package>` tetap khusus npm saat sumber harus eksplisit.

Instalasi plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion`
yang diiklankan sebelum instalasi arsip berjalan. Saat sebuah versi paket menerbitkan
artefak ClawPack, OpenClaw memilih `.tgz` npm-pack yang diunggah secara persis, memverifikasi
header digest ClawHub dan byte yang diunduh, lalu mencatat metadata artefak untuk
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

CLI ini juga memiliki perintah instal/perbarui skill untuk alur kerja registri langsung:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Perintah tersebut menginstal Skills ke `./skills` di bawah direktori kerja saat ini
dan mencatat versi yang terinstal di `.clawhub/lock.json`.

## Publikasi

Publikasikan Skills dari folder lokal yang berisi `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opsi publikasi umum:

- `--slug <slug>`: nama URL skill yang dipublikasikan.
- `--name <name>`: nama tampilan.
- `--version <version>`: versi semver.
- `--changelog <text>`: teks changelog.
- `--tags <tags>`: tag yang dipisahkan koma, default ke `latest`.

Publikasikan plugin dari folder lokal, `owner/repo`, `owner/repo@ref`, atau URL
GitHub:

```bash
clawhub package publish <source>
```

Gunakan `--dry-run` untuk membangun rencana publikasi yang persis tanpa mengunggah, dan `--json`
untuk output yang ramah CI.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw yang diwajibkan di
`package.json`, termasuk `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`. Lihat [CLI](/id/clawhub/cli) untuk referensi perintah
lengkap dan [Format skill](/id/clawhub/skill-format) untuk metadata skill.

## Keamanan dan moderasi

ClawHub terbuka secara default: siapa pun dapat mengunggah, tetapi publikasi memerlukan akun GitHub
yang cukup lama untuk lolos gerbang unggah. Halaman detail publik merangkum status pemindaian
terbaru sebelum instalasi atau pengunduhan.

ClawHub menjalankan pemeriksaan otomatis pada Skills dan rilis plugin yang dipublikasikan. Rilis yang
ditahan pemindaian atau diblokir dapat hilang dari katalog publik dan permukaan instalasi sambil
tetap terlihat oleh pemiliknya di `/dashboard`.

Pengguna yang masuk dapat melaporkan Skills dan paket. Moderator dapat meninjau laporan,
menyembunyikan atau memulihkan konten, dan memblokir akun yang menyalahgunakan layanan. Lihat
[Keamanan](/id/clawhub/security),
[Audit Keamanan](/id/clawhub/security-audits),
[Moderasi dan Keamanan Akun](/id/clawhub/moderation), dan
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage) untuk detail kebijakan dan penegakan.

## Telemetri dan lingkungan

Saat Anda menjalankan `clawhub install` ketika sudah masuk, CLI dapat mengirim event instalasi
upaya terbaik agar ClawHub dapat menghitung jumlah instalasi agregat. Nonaktifkan ini dengan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Override lingkungan yang berguna:

| Variabel                      | Efek                                                  |
| ----------------------------- | ----------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL situs yang digunakan untuk login browser. |
| `CLAWHUB_REGISTRY`            | Override URL API registri.                            |
| `CLAWHUB_CONFIG_PATH`         | Override lokasi CLI menyimpan status token/config.    |
| `CLAWHUB_WORKDIR`             | Override direktori kerja default.                     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Nonaktifkan telemetri instalasi.                      |

Lihat [Telemetri](/id/clawhub/telemetry), [HTTP API](/id/clawhub/http-api), dan
[Pemecahan masalah](/id/clawhub/troubleshooting) untuk materi referensi yang lebih mendalam.
