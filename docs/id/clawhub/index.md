---
read_when:
    - Menjelaskan apa itu ClawHub
    - Mencari, menginstal, atau memperbarui Skills atau Plugin
    - Menerbitkan Skills atau Plugin ke registry
    - Memilih antara alur CLI openclaw dan clawhub
sidebarTitle: ClawHub
summary: Gambaran umum ClawHub publik untuk penemuan, penginstalan, publikasi, keamanan, dan CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T04:09:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub adalah registry publik untuk Skills dan plugin OpenClaw.

- Gunakan perintah `openclaw` native untuk mencari, menginstal, dan memperbarui Skills serta menginstal plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk alur kerja autentikasi registry, publikasi, hapus/batal hapus, dan sinkronisasi.

Situs: [clawhub.ai](https://clawhub.ai)

## Mulai cepat

Cari dan instal Skills dengan OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Cari dan instal plugin dengan OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instal CLI ClawHub saat Anda menginginkan alur kerja yang terautentikasi registry seperti
publikasi, sinkronisasi, atau hapus/batal hapus:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Apa yang dihosting ClawHub

| Permukaan      | Yang disimpan                                                | Perintah umum                                |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Bundel teks berversi dengan `SKILL.md` plus file pendukung   | `openclaw skills install <slug>`             |
| Plugin kode    | Paket plugin OpenClaw dengan metadata kompatibilitas         | `openclaw plugins install clawhub:<package>` |
| Plugin bundel  | Bundel plugin yang dikemas untuk distribusi OpenClaw         | `clawhub package publish <source>`           |
| Souls          | Bundel `SOUL.md` yang ditampilkan di onlycrabs.ai            | Alur publikasi Web dan API                   |

ClawHub melacak versi semver, tag seperti `latest`, changelog, file,
unduhan, bintang, dan ringkasan pemindaian keamanan. Halaman publik menampilkan status registry
terkini sehingga pengguna dapat memeriksa Skill atau plugin sebelum menginstalnya.

## Alur native OpenClaw

Perintah native OpenClaw menginstal ke workspace OpenClaw aktif dan mempertahankan
metadata sumber sehingga perintah pembaruan berikutnya dapat tetap berada di ClawHub.

Gunakan `clawhub:<package>` saat instalasi plugin harus diselesaikan melalui ClawHub.
Spesifikasi plugin bare yang aman untuk npm dapat diselesaikan melalui npm selama cutover peluncuran, dan
`npm:<package>` tetap hanya npm saat sumber harus eksplisit.

Instalasi plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion`
yang diiklankan sebelum instalasi arsip berjalan. Saat suatu versi paket menerbitkan
artefak ClawPack, OpenClaw memilih `.tgz` npm-pack yang diunggah secara persis, memverifikasi
header digest ClawHub dan byte yang diunduh, serta mencatat metadata artefak untuk
pembaruan berikutnya.

## CLI ClawHub

CLI ClawHub digunakan untuk pekerjaan yang terautentikasi registry:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

CLI juga memiliki perintah instal/perbarui Skill untuk alur kerja registry langsung:

```bash
clawhub install <slug>
clawhub update <slug>
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

- `--slug <slug>`: slug Skill.
- `--name <name>`: nama tampilan.
- `--version <version>`: versi semver.
- `--changelog <text>`: teks changelog.
- `--tags <tags>`: tag yang dipisahkan koma, default ke `latest`.

Publikasikan plugin dari folder lokal, `owner/repo`, `owner/repo@ref`, atau URL GitHub:

```bash
clawhub package publish <source>
```

Gunakan `--dry-run` untuk membangun rencana publikasi yang persis tanpa mengunggah, dan `--json`
untuk output yang ramah CI.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw yang diwajibkan di
`package.json`, termasuk `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`. Lihat [CLI](/id/clawhub/cli) untuk referensi perintah
lengkap dan [Format Skill](/id/clawhub/skill-format) untuk metadata Skill.

## Keamanan dan moderasi

ClawHub terbuka secara default: siapa pun dapat mengunggah, tetapi publikasi membutuhkan akun GitHub
yang cukup lama untuk melewati gerbang unggah. Halaman detail publik merangkum
status pemindaian terbaru sebelum instalasi atau pengunduhan.

ClawHub menjalankan pemeriksaan otomatis pada Skills dan rilis plugin yang dipublikasikan. Rilis yang
ditahan pemindaian atau diblokir dapat menghilang dari katalog publik dan permukaan instalasi sementara
tetap terlihat oleh pemiliknya di `/dashboard`.

Pengguna yang masuk dapat melaporkan Skills dan paket. Moderator dapat meninjau laporan,
menyembunyikan atau memulihkan konten, dan memblokir akun yang menyalahgunakan layanan. Lihat
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage) dan
[Keamanan + moderasi](/id/clawhub/security) untuk detail kebijakan dan penegakan.

## Telemetri dan lingkungan

Saat Anda menjalankan `clawhub sync` ketika sudah masuk, CLI mengirim snapshot minimal agar
ClawHub dapat menghitung jumlah instalasi. Nonaktifkan ini dengan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Override lingkungan yang berguna:

| Variabel                      | Efek                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL situs yang digunakan untuk login browser. |
| `CLAWHUB_REGISTRY`            | Override URL API registry.                        |
| `CLAWHUB_CONFIG_PATH`         | Override lokasi CLI menyimpan status token/config. |
| `CLAWHUB_WORKDIR`             | Override direktori kerja default.                 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Nonaktifkan telemetri pada `sync`.                |

Lihat [Telemetri](/id/clawhub/telemetry), [HTTP API](/id/clawhub/http-api), dan
[Pemecahan masalah](/id/clawhub/troubleshooting) untuk materi referensi yang lebih mendalam.
