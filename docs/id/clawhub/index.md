---
read_when:
    - Menjelaskan apa itu ClawHub
    - Mencari, menginstal, atau memperbarui Skills atau Plugin
    - Menerbitkan skills atau plugin ke registry
    - Memilih antara alur CLI openclaw dan clawhub
sidebarTitle: ClawHub
summary: Ikhtisar ClawHub publik untuk penemuan, pemasangan, publikasi, keamanan, dan CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-02T17:46:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub adalah registri publik untuk Skills dan plugin OpenClaw.

- Gunakan perintah `openclaw` native untuk mencari, menginstal, dan memperbarui skills serta menginstal plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk alur kerja autentikasi registri, penerbitan, dan hapus/batalkan hapus.

Situs: [clawhub.ai](https://clawhub.ai)

## Mulai cepat

Cari dan instal skills dengan OpenClaw:

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

Instal CLI ClawHub saat Anda menginginkan alur kerja yang diautentikasi registri seperti
menerbitkan atau menghapus/membatalkan hapus:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Apa yang dihosting ClawHub

| Permukaan      | Yang disimpan                                                | Perintah umum                               |
| -------------- | ------------------------------------------------------------ | ------------------------------------------- |
| Skills         | Bundel teks berversi dengan `SKILL.md` serta file pendukung  | `openclaw skills install @openclaw/demo`    |
| Plugin kode    | Paket plugin OpenClaw dengan metadata kompatibilitas         | `openclaw plugins install clawhub:<package>` |
| Plugin bundel  | Bundel plugin terpaket untuk distribusi OpenClaw             | `clawhub package publish <source>`          |

ClawHub melacak versi semver, tag seperti `latest`, changelog, file,
unduhan, bintang, dan ringkasan pemindaian keamanan. Halaman publik menampilkan status registri
saat ini sehingga pengguna dapat memeriksa skill atau plugin sebelum menginstalnya.

## Alur native OpenClaw

Perintah native OpenClaw menginstal ke ruang kerja OpenClaw aktif dan mempertahankan
metadata sumber sehingga perintah pembaruan berikutnya dapat tetap menggunakan ClawHub.

Gunakan `clawhub:<package>` saat instalasi plugin harus di-resolve melalui ClawHub.
Spesifikasi plugin bare yang aman untuk npm dapat di-resolve melalui npm selama cutover peluncuran, dan
`npm:<package>` tetap hanya npm saat sumber harus eksplisit.

Instalasi plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion`
yang diiklankan sebelum instalasi arsip berjalan. Saat versi paket menerbitkan artefak
ClawPack, OpenClaw memprioritaskan `.tgz` npm-pack yang diunggah persis, memverifikasi
header digest ClawHub dan byte yang diunduh, lalu merekam metadata artefak untuk
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

Perintah tersebut menginstal skills ke `./skills` di bawah direktori kerja saat ini
dan mencatat versi yang terinstal di `.clawhub/lock.json`.

## Penerbitan

Terbitkan skills dari folder lokal yang berisi `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opsi penerbitan umum:

- `--slug <slug>`: nama URL skill yang diterbitkan.
- `--name <name>`: nama tampilan.
- `--version <version>`: versi semver.
- `--changelog <text>`: teks changelog.
- `--tags <tags>`: tag yang dipisahkan koma, default ke `latest`.

Terbitkan plugin dari folder lokal, `owner/repo`, `owner/repo@ref`, atau URL GitHub:

```bash
clawhub package publish <source>
```

Gunakan `--dry-run` untuk membangun rencana penerbitan persis tanpa mengunggah, dan `--json`
untuk output yang ramah CI.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw yang diperlukan di
`package.json`, termasuk `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`. Lihat [CLI](/id/clawhub/cli) untuk referensi perintah
lengkap dan [Format skill](/clawhub/skill-format) untuk metadata skill.

## Keamanan dan moderasi

ClawHub terbuka secara default: siapa pun dapat mengunggah, tetapi penerbitan memerlukan akun GitHub
yang cukup lama untuk lolos gerbang unggah. Halaman detail publik merangkum
status pemindaian terbaru sebelum instalasi atau unduhan.

ClawHub menjalankan pemeriksaan otomatis pada skill dan rilis plugin yang diterbitkan. Rilis yang
ditahan pemindaian atau diblokir dapat hilang dari katalog publik dan permukaan instalasi sementara
tetap terlihat oleh pemiliknya di `/dashboard`.

Pengguna yang masuk dapat melaporkan skill dan paket. Moderator dapat meninjau laporan,
menyembunyikan atau memulihkan konten, dan memblokir akun yang menyalahgunakan layanan. Lihat
[Keamanan](/id/clawhub/security),
[Audit Keamanan](/clawhub/security-audits),
[Moderasi dan Keamanan Akun](/clawhub/moderation), dan
[Penggunaan yang dapat diterima](/clawhub/acceptable-usage) untuk detail kebijakan dan penegakan.

## Telemetri dan lingkungan

Saat Anda menjalankan `clawhub install` ketika sudah masuk, CLI dapat mengirim event instalasi
best-effort agar ClawHub dapat menghitung jumlah instalasi agregat. Nonaktifkan ini dengan:

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

Lihat [Telemetri](/clawhub/telemetry), [API HTTP](/clawhub/http-api), dan
[Pemecahan Masalah](/id/clawhub/troubleshooting) untuk materi referensi yang lebih mendalam.
