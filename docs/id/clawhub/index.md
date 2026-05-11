---
read_when:
    - Menjelaskan apa itu ClawHub
    - Mencari, menginstal, atau memperbarui Skills atau Plugin
    - Menerbitkan Skills atau Plugin ke registri
    - Memilih antara alur CLI openclaw dan clawhub
sidebarTitle: ClawHub
summary: Ikhtisar ClawHub publik untuk penemuan, instalasi, publikasi, keamanan, dan CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T22:19:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub adalah registri publik untuk Skills dan plugin OpenClaw.

- Gunakan perintah native `openclaw` untuk mencari, menginstal, dan memperbarui Skills serta untuk menginstal plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk alur kerja autentikasi registri, publikasi, hapus/batalkan hapus, dan sinkronisasi.

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

Instal CLI ClawHub ketika Anda menginginkan alur kerja yang diautentikasi registri seperti
publikasi, sinkronisasi, atau hapus/batalkan hapus:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Yang dihosting ClawHub

| Permukaan      | Yang disimpan                                             | Perintah umum                                |
| -------------- | --------------------------------------------------------- | -------------------------------------------- |
| Skills         | Bundel teks berversi dengan `SKILL.md` plus file pendukung | `openclaw skills install <slug>`             |
| Plugin kode    | Paket plugin OpenClaw dengan metadata kompatibilitas       | `openclaw plugins install clawhub:<package>` |
| Plugin bundel  | Bundel plugin yang dikemas untuk distribusi OpenClaw       | `clawhub package publish <source>`           |
| Soul           | Bundel `SOUL.md` yang ditampilkan di onlycrabs.ai          | Alur publikasi Web dan API                   |

ClawHub melacak versi semver, tag seperti `latest`, changelog, file,
unduhan, bintang, dan ringkasan pemindaian keamanan. Halaman publik menampilkan status registri
saat ini sehingga pengguna dapat memeriksa skill atau plugin sebelum menginstalnya.

## Alur native OpenClaw

Perintah native OpenClaw menginstal ke ruang kerja OpenClaw aktif dan mempertahankan
metadata sumber agar perintah pembaruan berikutnya tetap dapat menggunakan ClawHub.

Gunakan `clawhub:<package>` ketika instalasi plugin harus di-resolve melalui ClawHub.
Spesifikasi plugin polos yang aman untuk npm dapat di-resolve melalui npm selama cutover peluncuran, dan
`npm:<package>` tetap hanya npm ketika sumber harus dibuat eksplisit.

Instalasi plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion`
yang diiklankan sebelum instalasi arsip berjalan. Ketika versi paket menerbitkan
artefak ClawPack, OpenClaw lebih memilih `.tgz` npm-pack yang diunggah secara persis, memverifikasi
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

Perintah tersebut menginstal Skills ke `./skills` di bawah direktori kerja saat ini
dan mencatat versi yang terinstal di `.clawhub/lock.json`.

## Publikasi

Publikasikan Skills dari folder lokal yang berisi `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opsi publikasi umum:

- `--slug <slug>`: slug skill.
- `--name <name>`: nama tampilan.
- `--version <version>`: versi semver.
- `--changelog <text>`: teks changelog.
- `--tags <tags>`: tag yang dipisahkan koma, dengan default `latest`.

Publikasikan plugin dari folder lokal, `owner/repo`, `owner/repo@ref`, atau URL
GitHub:

```bash
clawhub package publish <source>
```

Gunakan `--dry-run` untuk membangun rencana publikasi yang persis tanpa mengunggah, dan `--json`
untuk output yang ramah CI.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw yang diperlukan di
`package.json`, termasuk `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`. Lihat [CLI](/id/clawhub/cli) untuk referensi perintah
lengkap dan [Format skill](/id/clawhub/skill-format) untuk metadata skill.

## Keamanan dan moderasi

ClawHub terbuka secara default: siapa pun dapat mengunggah, tetapi publikasi memerlukan akun GitHub
yang cukup lama untuk lolos gerbang unggahan. Halaman detail publik merangkum status pemindaian
terbaru sebelum instalasi atau unduhan.

ClawHub menjalankan pemeriksaan otomatis pada Skills dan rilis plugin yang dipublikasikan. Rilis yang
ditahan pemindaian atau diblokir dapat menghilang dari katalog publik dan permukaan instalasi sambil
tetap terlihat oleh pemiliknya di `/dashboard`.

Pengguna yang masuk dapat melaporkan Skills dan paket. Moderator dapat meninjau laporan,
menyembunyikan atau memulihkan konten, dan memblokir akun yang menyalahgunakan. Lihat
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage) dan
[Keamanan + moderasi](/id/clawhub/security) untuk detail kebijakan dan penegakan.

## Telemetri dan lingkungan

Saat Anda menjalankan `clawhub sync` dalam keadaan masuk, CLI mengirim snapshot minimal agar
ClawHub dapat menghitung jumlah instalasi. Nonaktifkan ini dengan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Override lingkungan yang berguna:

| Variabel                      | Efek                                                |
| ----------------------------- | --------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL situs yang digunakan untuk login browser. |
| `CLAWHUB_REGISTRY`            | Override URL API registri.                          |
| `CLAWHUB_CONFIG_PATH`         | Override lokasi CLI menyimpan status token/config.  |
| `CLAWHUB_WORKDIR`             | Override direktori kerja default.                   |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Nonaktifkan telemetri pada `sync`.                  |

Lihat [Telemetri](/id/clawhub/telemetry), [API HTTP](/id/clawhub/http-api), dan
[Pemecahan masalah](/id/clawhub/troubleshooting) untuk materi referensi yang lebih mendalam.
