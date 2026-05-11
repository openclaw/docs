---
read_when:
    - Menjelaskan apa itu ClawHub
    - Mencari, menginstal, atau memperbarui Skills atau Plugin
    - Menerbitkan Skills atau Plugin ke registri
    - Memilih antara alur CLI openclaw dan clawhub
sidebarTitle: ClawHub
summary: Ikhtisar ClawHub publik untuk penemuan, pemasangan, penerbitan, keamanan, dan CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T20:24:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub adalah registri publik untuk skills dan plugins OpenClaw.

- Gunakan perintah `openclaw` native untuk mencari, menginstal, dan memperbarui skills serta menginstal plugins dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk autentikasi registri, publikasi, hapus/batalkan hapus, pemindaian ulang, dan alur kerja sinkronisasi.

Situs: [clawhub.ai](https://clawhub.ai)

## Mulai cepat

Cari dan instal skills dengan OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Cari dan instal plugins dengan OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instal CLI ClawHub saat Anda menginginkan alur kerja yang diautentikasi registri seperti
publikasi, sinkronisasi, hapus/batalkan hapus, atau pemindaian ulang yang diminta pemilik:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Apa yang dihosting ClawHub

| Permukaan       | Yang disimpannya                                          | Perintah umum                               |
| --------------- | --------------------------------------------------------- | ------------------------------------------- |
| Skills          | Bundel teks berversi dengan `SKILL.md` plus file pendukung | `openclaw skills install <slug>`            |
| Plugins kode    | Paket plugin OpenClaw dengan metadata kompatibilitas       | `openclaw plugins install clawhub:<package>` |
| Plugins bundel  | Bundel plugin terpaket untuk distribusi OpenClaw           | `clawhub package publish <source>`          |
| Souls           | Bundel `SOUL.md` yang ditampilkan di onlycrabs.ai          | Alur publikasi Web dan API                  |

ClawHub melacak versi semver, tag seperti `latest`, changelog, file,
unduhan, bintang, dan ringkasan pemindaian keamanan. Halaman publik menampilkan status registri
saat ini sehingga pengguna dapat memeriksa skill atau plugin sebelum menginstalnya.

## Alur native OpenClaw

Perintah native OpenClaw menginstal ke workspace OpenClaw aktif dan menyimpan
metadata sumber agar perintah pembaruan berikutnya tetap dapat menggunakan ClawHub.

Gunakan `clawhub:<package>` saat instalasi plugin harus diselesaikan melalui ClawHub.
Spesifikasi plugin polos yang aman untuk npm dapat diselesaikan melalui npm selama pergantian peluncuran, dan
`npm:<package>` tetap khusus npm saat sumber harus dibuat eksplisit.

Instalasi plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion`
yang diiklankan sebelum instalasi arsip dijalankan. Saat versi paket menerbitkan
artefak ClawPack, OpenClaw memprioritaskan `.tgz` npm-pack yang diunggah secara persis, memverifikasi
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
clawhub sync --all
```

CLI juga memiliki perintah instal/perbarui skill untuk alur kerja registri langsung:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Perintah tersebut menginstal skills ke `./skills` di bawah direktori kerja saat ini
dan mencatat versi terinstal di `.clawhub/lock.json`.

## Publikasi

Publikasikan skills dari folder lokal yang berisi `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opsi publikasi umum:

- `--slug <slug>`: slug skill.
- `--name <name>`: nama tampilan.
- `--version <version>`: versi semver.
- `--changelog <text>`: teks changelog.
- `--tags <tags>`: tag yang dipisahkan koma, default ke `latest`.

Publikasikan plugins dari folder lokal, `owner/repo`, `owner/repo@ref`, atau URL
GitHub:

```bash
clawhub package publish <source>
```

Gunakan `--dry-run` untuk membuat rencana publikasi yang persis tanpa mengunggah, dan `--json`
untuk output yang ramah CI.

Plugins kode harus menyertakan metadata kompatibilitas OpenClaw yang diperlukan di
`package.json`, termasuk `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`. Lihat [CLI](/id/clawhub/cli) untuk referensi perintah
lengkap dan [Format skill](/id/clawhub/skill-format) untuk metadata skill.

## Keamanan dan moderasi

ClawHub terbuka secara default: siapa pun dapat mengunggah, tetapi publikasi memerlukan akun
GitHub yang cukup lama untuk lolos gerbang unggahan. Halaman detail publik merangkum
status pemindaian terbaru sebelum instalasi atau unduhan.

ClawHub menjalankan pemeriksaan otomatis pada skills dan rilis plugin yang dipublikasikan. Rilis yang
ditahan pemindaian atau diblokir dapat menghilang dari katalog publik dan permukaan instalasi sambil
tetap terlihat oleh pemiliknya di `/dashboard`.

Pemilik dapat meminta pemindaian ulang terbatas untuk pemulihan positif palsu. Moderator
platform dan admin dapat meminta pemindaian ulang untuk skill atau paket apa pun saat menangani
laporan dukungan:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Pengguna yang masuk dapat melaporkan skills dan packages. Moderator dapat meninjau laporan,
menyembunyikan atau memulihkan konten, menyelesaikan banding, dan memblokir akun yang menyalahgunakan. Lihat
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage) dan
[Keamanan + moderasi](/id/clawhub/security) untuk detail kebijakan dan penegakan.

## Telemetri dan lingkungan

Saat Anda menjalankan `clawhub sync` dalam keadaan masuk, CLI mengirim snapshot minimal agar
ClawHub dapat menghitung jumlah instalasi. Nonaktifkan ini dengan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Override lingkungan yang berguna:

| Variabel                      | Efek                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Meng-override URL situs yang digunakan untuk login browser. |
| `CLAWHUB_REGISTRY`            | Meng-override URL API registri.                   |
| `CLAWHUB_CONFIG_PATH`         | Meng-override tempat CLI menyimpan status token/config. |
| `CLAWHUB_WORKDIR`             | Meng-override direktori kerja default.            |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Menonaktifkan telemetri pada `sync`.              |

Lihat [Telemetri](/id/clawhub/telemetry), [HTTP API](/id/clawhub/http-api), dan
[Pemecahan masalah](/id/clawhub/troubleshooting) untuk materi referensi yang lebih mendalam.
