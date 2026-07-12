---
read_when:
    - Menjelaskan apa itu ClawHub
    - Mencari, memasang, atau memperbarui Skills maupun Plugin
    - Menerbitkan skill atau plugin ke registri
    - Memilih antara alur CLI openclaw dan clawhub
sidebarTitle: ClawHub
summary: Ikhtisar publik ClawHub untuk penemuan, instalasi, penerbitan, keamanan, dan CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T14:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub adalah registri publik untuk Skills dan Plugin OpenClaw.

- Gunakan perintah bawaan `openclaw` untuk mencari, menginstal, dan memperbarui Skills serta menginstal Plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk autentikasi registri, penerbitan, serta alur kerja penghapusan/pemulihan.

Situs: [clawhub.ai](https://clawhub.ai)

## Mulai cepat

Cari dan instal Skills dengan OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Cari dan instal Plugin dengan OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instal CLI ClawHub saat Anda ingin menggunakan alur kerja yang diautentikasi oleh registri, seperti penerbitan atau penghapusan/pemulihan:

```bash
npm i -g clawhub
# atau
pnpm add -g clawhub
```

## Yang dihosting ClawHub

| Permukaan      | Yang disimpannya                                           | Perintah umum                                |
| -------------- | ---------------------------------------------------------- | -------------------------------------------- |
| Skills         | Bundel teks berversi dengan `SKILL.md` dan berkas pendukung | `openclaw skills install @openclaw/demo`     |
| Plugin kode    | Paket Plugin OpenClaw dengan metadata kompatibilitas       | `openclaw plugins install clawhub:<package>` |
| Plugin bundel  | Bundel Plugin terpaket untuk distribusi OpenClaw           | `clawhub package publish <source>`           |

ClawHub melacak versi semver, tag seperti `latest`, catatan perubahan, berkas, unduhan, bintang, dan ringkasan pemindaian keamanan. Halaman publik menampilkan status registri terkini agar pengguna dapat memeriksa Skill atau Plugin sebelum menginstalnya.

## Alur bawaan OpenClaw

Perintah bawaan OpenClaw melakukan instalasi ke ruang kerja OpenClaw yang aktif dan menyimpan metadata sumber agar perintah pembaruan berikutnya tetap dapat menggunakan ClawHub.

Gunakan `clawhub:<package>` ketika instalasi Plugin harus diresolusikan melalui ClawHub. Spesifikasi Plugin polos yang aman untuk npm dapat diresolusikan melalui npm selama transisi peluncuran, sedangkan `npm:<package>` tetap hanya menggunakan npm ketika sumber harus dinyatakan secara eksplisit.

Instalasi Plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion` yang dinyatakan sebelum instalasi arsip dijalankan. Ketika suatu versi paket menerbitkan artefak ClawPack, OpenClaw memprioritaskan `.tgz` npm-pack yang diunggah secara persis, memverifikasi header digest ClawHub dan byte yang diunduh, serta mencatat metadata artefak untuk pembaruan berikutnya.

## CLI ClawHub

CLI ClawHub digunakan untuk pekerjaan yang diautentikasi oleh registri:

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

CLI ini juga memiliki perintah instalasi/pembaruan Skill untuk alur kerja registri langsung:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Perintah tersebut menginstal Skills ke `./skills` di bawah direktori kerja saat ini dan mencatat versi yang diinstal dalam `.clawhub/lock.json`.

## Penerbitan

Terbitkan Skills dari folder lokal yang berisi `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opsi penerbitan yang umum:

- `--slug <slug>`: nama URL Skill yang diterbitkan.
- `--name <name>`: nama tampilan.
- `--version <version>`: versi semver.
- `--changelog <text>`: teks catatan perubahan.
- `--tags <tags>`: tag yang dipisahkan koma, dengan nilai bawaan `latest`.

Terbitkan Plugin dari folder lokal, `owner/repo`, `owner/repo@ref`, atau URL GitHub:

```bash
clawhub package publish <source>
```

Gunakan `--dry-run` untuk membuat rencana penerbitan yang persis tanpa mengunggah dan `--json` untuk keluaran yang sesuai bagi CI.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw yang diwajibkan dalam `package.json`, termasuk `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`. Lihat [CLI](/id/clawhub/cli) untuk referensi perintah lengkap dan [Format Skill](/clawhub/skill-format) untuk metadata Skill.

## Keamanan dan moderasi

ClawHub bersifat terbuka secara default: siapa pun dapat mengunggah, tetapi penerbitan memerlukan akun GitHub yang cukup lama untuk lolos dari gerbang unggahan. Halaman detail publik merangkum status pemindaian terbaru sebelum instalasi atau pengunduhan.

ClawHub menjalankan pemeriksaan otomatis terhadap Skills dan rilis Plugin yang diterbitkan. Rilis yang ditahan oleh pemindaian atau diblokir dapat menghilang dari katalog publik dan permukaan instalasi, tetapi tetap terlihat oleh pemiliknya di `/dashboard`.

Pengguna yang telah masuk dapat melaporkan Skills dan paket. Moderator dapat meninjau laporan, menyembunyikan atau memulihkan konten, serta memblokir akun yang melakukan penyalahgunaan. Lihat [Keamanan](/clawhub/security), [Audit Keamanan](/id/clawhub/security-audits), [Moderasi dan Keamanan Akun](/clawhub/moderation), serta [Penggunaan yang dapat diterima](/clawhub/acceptable-usage) untuk detail kebijakan dan penegakan.

## Telemetri dan lingkungan

Saat Anda menjalankan `clawhub install` dalam keadaan telah masuk, CLI dapat mengirim peristiwa instalasi dengan upaya terbaik agar ClawHub dapat menghitung jumlah instalasi agregat. Nonaktifkan dengan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Pengesampingan lingkungan yang berguna:

| Variabel                      | Efek                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| `CLAWHUB_SITE`                | Mengesampingkan URL situs yang digunakan untuk masuk melalui peramban. |
| `CLAWHUB_REGISTRY`            | Mengesampingkan URL API registri.                          |
| `CLAWHUB_CONFIG_PATH`         | Mengesampingkan lokasi CLI menyimpan status token/konfigurasi. |
| `CLAWHUB_WORKDIR`             | Mengesampingkan direktori kerja bawaan.                    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Menonaktifkan telemetri instalasi.                         |

Lihat [Telemetri](/id/clawhub/telemetry), [API HTTP](/clawhub/http-api), dan [Pemecahan masalah](/clawhub/troubleshooting) untuk materi referensi yang lebih mendalam.
