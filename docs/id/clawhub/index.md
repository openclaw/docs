---
read_when:
    - Menjelaskan apa itu ClawHub
    - Mencari, menginstal, atau memperbarui Skills atau Plugin
    - Menerbitkan Skills atau Plugin ke registri
    - Memilih antara alur CLI openclaw dan clawhub
sidebarTitle: ClawHub
summary: Gambaran umum ClawHub publik untuk penemuan, instalasi, publikasi, keamanan, dan CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-10T19:25:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub adalah registri publik untuk Skills dan Plugin OpenClaw.

- Gunakan perintah native `openclaw` untuk mencari, menginstal, dan memperbarui Skills serta menginstal Plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk autentikasi registri, penerbitan, hapus/batal hapus, pemindaian ulang, dan alur kerja sinkronisasi.

Situs: [clawhub.ai](https://clawhub.ai)

## Mulai cepat

Cari dan instal Skills dengan OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Cari dan instal Plugin dengan OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instal CLI ClawHub saat Anda membutuhkan alur kerja yang terautentikasi registri seperti
menerbitkan, menyinkronkan, menghapus/batal menghapus, atau pemindaian ulang yang diminta pemilik:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Apa yang di-host ClawHub

| Permukaan      | Yang disimpannya                                           | Perintah umum                                |
| -------------- | ---------------------------------------------------------- | -------------------------------------------- |
| Skills         | Bundel teks berversi dengan `SKILL.md` plus file pendukung | `openclaw skills install <slug>`             |
| Plugin kode    | Paket Plugin OpenClaw dengan metadata kompatibilitas       | `openclaw plugins install clawhub:<package>` |
| Plugin bundel  | Bundel Plugin terpaket untuk distribusi OpenClaw           | `clawhub package publish <source>`           |
| Souls          | Bundel `SOUL.md` yang ditampilkan di onlycrabs.ai          | Alur penerbitan Web dan API                  |

ClawHub melacak versi semver, tag seperti `latest`, changelog, file,
unduhan, bintang, dan ringkasan pemindaian keamanan. Halaman publik menampilkan status registri
saat ini sehingga pengguna dapat memeriksa Skill atau Plugin sebelum menginstalnya.

## Alur OpenClaw native

Perintah OpenClaw native menginstal ke ruang kerja OpenClaw aktif dan mempertahankan
metadata sumber sehingga perintah pembaruan berikutnya dapat tetap menggunakan ClawHub.

Gunakan `clawhub:<package>` saat instalasi Plugin harus diselesaikan melalui ClawHub.
Spesifikasi Plugin yang aman untuk npm tanpa awalan dapat diselesaikan melalui npm selama transisi peluncuran, dan
`npm:<package>` tetap khusus npm saat sumber harus dibuat eksplisit.

Instalasi Plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion`
yang diiklankan sebelum instalasi arsip berjalan. Saat versi paket menerbitkan
artefak ClawPack, OpenClaw lebih memilih `.tgz` npm-pack unggahan yang tepat, memverifikasi
header digest ClawHub dan byte yang diunduh, serta mencatat metadata artefak untuk
pembaruan berikutnya.

## CLI ClawHub

CLI ClawHub digunakan untuk pekerjaan yang terautentikasi registri:

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

CLI juga memiliki perintah instal/perbarui Skill untuk alur kerja registri langsung:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Perintah tersebut menginstal Skills ke `./skills` di bawah direktori kerja saat ini
dan mencatat versi yang terinstal di `.clawhub/lock.json`.

## Penerbitan

Terbitkan Skills dari folder lokal yang berisi `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opsi penerbitan umum:

- `--slug <slug>`: slug Skill.
- `--name <name>`: nama tampilan.
- `--version <version>`: versi semver.
- `--changelog <text>`: teks changelog.
- `--tags <tags>`: tag yang dipisahkan koma, default ke `latest`.

Terbitkan Plugin dari folder lokal, `owner/repo`, `owner/repo@ref`, atau URL GitHub:

```bash
clawhub package publish <source>
```

Gunakan `--dry-run` untuk membuat rencana penerbitan yang tepat tanpa mengunggah, dan `--json`
untuk keluaran yang ramah CI.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw yang wajib di
`package.json`, termasuk `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`. Lihat [CLI](/id/clawhub/cli) untuk referensi
perintah lengkap dan [Format Skill](/id/clawhub/skill-format) untuk metadata Skill.

## Keamanan dan moderasi

ClawHub terbuka secara default: siapa pun dapat mengunggah, tetapi penerbitan membutuhkan akun GitHub
yang cukup lama untuk melewati gerbang unggahan. Halaman detail publik merangkum
status pemindaian terbaru sebelum instalasi atau pengunduhan.

ClawHub menjalankan pemeriksaan otomatis pada Skills dan rilis Plugin yang diterbitkan. Rilis yang
ditahan pemindaian atau diblokir dapat menghilang dari katalog publik dan permukaan instalasi sambil
tetap terlihat oleh pemiliknya di `/dashboard`.

Pemilik dapat meminta pemindaian ulang terbatas untuk pemulihan positif palsu. Moderator
dan admin platform dapat meminta pemindaian ulang untuk Skill atau paket apa pun saat menangani
laporan dukungan:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Pengguna yang masuk dapat melaporkan Skills dan paket. Moderator dapat meninjau laporan,
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

| Variabel                      | Efek                                                      |
| ----------------------------- | --------------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL situs yang digunakan untuk login browser.    |
| `CLAWHUB_REGISTRY`            | Override URL API registri.                                |
| `CLAWHUB_CONFIG_PATH`         | Override tempat CLI menyimpan status token/konfigurasi.   |
| `CLAWHUB_WORKDIR`             | Override direktori kerja default.                         |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Nonaktifkan telemetri pada `sync`.                        |

Lihat [Telemetri](/id/clawhub/telemetry), [HTTP API](/id/clawhub/http-api), dan
[Pemecahan masalah](/id/clawhub/troubleshooting) untuk materi referensi yang lebih mendalam.
