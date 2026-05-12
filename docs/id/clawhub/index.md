---
read_when:
    - Menjelaskan apa itu ClawHub
    - Mencari, menginstal, atau memperbarui Skills atau Plugin
    - Menerbitkan Skills atau Plugin ke registri
    - Memilih antara alur CLI openclaw dan clawhub
sidebarTitle: ClawHub
summary: Ikhtisar publik ClawHub untuk penemuan, instalasi, publikasi, keamanan, dan CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T15:42:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub adalah registry publik untuk Skills dan plugin OpenClaw.

- Gunakan perintah native `openclaw` untuk mencari, memasang, dan memperbarui Skills serta memasang plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk autentikasi registry, penerbitan, hapus/batalkan hapus, dan alur kerja sinkronisasi.

Situs: [clawhub.ai](https://clawhub.ai)

## Mulai cepat

Cari dan pasang Skills dengan OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Cari dan pasang plugin dengan OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Pasang CLI ClawHub saat Anda menginginkan alur kerja yang diautentikasi registry seperti
publish, sync, atau delete/undelete:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Apa yang di-host ClawHub

| Permukaan      | Yang disimpan                                             | Perintah umum                                |
| -------------- | --------------------------------------------------------- | -------------------------------------------- |
| Skills         | Bundel teks berversi dengan `SKILL.md` plus file pendukung | `openclaw skills install <slug>`             |
| Plugin kode    | Paket plugin OpenClaw dengan metadata kompatibilitas       | `openclaw plugins install clawhub:<package>` |
| Plugin bundel  | Bundel plugin terpaket untuk distribusi OpenClaw           | `clawhub package publish <source>`           |
| Souls          | Bundel `SOUL.md` yang ditampilkan di onlycrabs.ai          | Alur penerbitan Web dan API                  |

ClawHub melacak versi semver, tag seperti `latest`, changelog, file,
unduhan, bintang, dan ringkasan pemindaian keamanan. Halaman publik menampilkan status registry
saat ini sehingga pengguna dapat memeriksa skill atau plugin sebelum memasangnya.

## Alur OpenClaw native

Perintah OpenClaw native memasang ke workspace OpenClaw aktif dan mempertahankan
metadata sumber sehingga perintah pembaruan berikutnya dapat tetap menggunakan ClawHub.

Gunakan `clawhub:<package>` saat pemasangan plugin harus diselesaikan melalui ClawHub.
Spesifikasi plugin bare yang aman untuk npm dapat diselesaikan melalui npm selama cutover peluncuran, dan
`npm:<package>` tetap hanya npm ketika sumber harus eksplisit.

Pemasangan plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion`
yang diiklankan sebelum pemasangan arsip berjalan. Saat versi paket menerbitkan artefak
ClawPack, OpenClaw lebih memilih `.tgz` npm-pack unggahan yang tepat, memverifikasi
header digest ClawHub dan byte yang diunduh, serta mencatat metadata artefak untuk
pembaruan berikutnya.

## CLI ClawHub

CLI ClawHub digunakan untuk pekerjaan yang diautentikasi registry:

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

CLI juga memiliki perintah pemasangan/pembaruan skill untuk alur kerja registry langsung:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Perintah tersebut memasang Skills ke `./skills` di bawah direktori kerja saat ini
dan mencatat versi yang dipasang di `.clawhub/lock.json`.

## Penerbitan

Terbitkan Skills dari folder lokal yang berisi `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opsi penerbitan umum:

- `--slug <slug>`: slug skill.
- `--name <name>`: nama tampilan.
- `--version <version>`: versi semver.
- `--changelog <text>`: teks changelog.
- `--tags <tags>`: tag yang dipisahkan koma, dengan default `latest`.

Terbitkan plugin dari folder lokal, `owner/repo`, `owner/repo@ref`, atau URL GitHub:

```bash
clawhub package publish <source>
```

Gunakan `--dry-run` untuk membuat rencana penerbitan yang tepat tanpa mengunggah, dan `--json`
untuk output yang ramah CI.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw yang diperlukan di
`package.json`, termasuk `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`. Lihat [CLI](/id/clawhub/cli) untuk referensi perintah
lengkap dan [Format skill](/id/clawhub/skill-format) untuk metadata skill.

## Keamanan dan moderasi

ClawHub terbuka secara default: siapa pun dapat mengunggah, tetapi penerbitan memerlukan akun GitHub
yang cukup lama untuk lolos gerbang unggahan. Halaman detail publik merangkum status
pemindaian terbaru sebelum pemasangan atau pengunduhan.

ClawHub menjalankan pemeriksaan otomatis pada Skills yang diterbitkan dan rilis plugin. Rilis yang ditahan
pemindaian atau diblokir dapat menghilang dari katalog publik dan permukaan pemasangan sambil
tetap terlihat oleh pemiliknya di `/dashboard`.

Pengguna yang masuk dapat melaporkan Skills dan paket. Moderator dapat meninjau laporan,
menyembunyikan atau memulihkan konten, dan memblokir akun yang menyalahgunakan layanan. Lihat
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage) dan
[Keamanan + moderasi](/id/clawhub/security) untuk detail kebijakan dan penegakan.

## Telemetri dan lingkungan

Saat Anda menjalankan `clawhub sync` dalam keadaan masuk, CLI mengirim snapshot minimal sehingga
ClawHub dapat menghitung jumlah pemasangan. Nonaktifkan ini dengan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Override lingkungan yang berguna:

| Variabel                      | Efek                                                    |
| ----------------------------- | ------------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL situs yang digunakan untuk login browser.  |
| `CLAWHUB_REGISTRY`            | Override URL API registry.                              |
| `CLAWHUB_CONFIG_PATH`         | Override tempat CLI menyimpan status token/konfigurasi. |
| `CLAWHUB_WORKDIR`             | Override direktori kerja default.                       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Nonaktifkan telemetri pada `sync`.                      |

Lihat [Telemetri](/id/clawhub/telemetry), [API HTTP](/id/clawhub/http-api), dan
[Pemecahan masalah](/id/clawhub/troubleshooting) untuk materi referensi yang lebih mendalam.
