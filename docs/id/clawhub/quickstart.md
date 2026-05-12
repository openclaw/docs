---
read_when:
    - Pertama kali menggunakan ClawHub
    - Menginstal skill atau Plugin dari registri
    - Menerbitkan ke ClawHub
summary: 'Mulai gunakan ClawHub: temukan, instal, perbarui, dan publikasikan Skills atau Plugin.'
x-i18n:
    generated_at: "2026-05-12T08:44:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Quickstart

ClawHub adalah registry untuk skill dan plugin OpenClaw.

Gunakan OpenClaw saat Anda memasang sesuatu ke dalam OpenClaw. Gunakan CLI `clawhub`
saat Anda masuk, memublikasikan, mengelola listing Anda sendiri, atau menggunakan
alur kerja khusus registry.

## Menemukan dan memasang skill

Cari dari OpenClaw:

```bash
openclaw skills search "calendar"
```

Pasang skill:

```bash
openclaw skills install <skill-slug>
```

Perbarui skill yang sudah terpasang:

```bash
openclaw skills update --all
```

OpenClaw mencatat asal skill tersebut sehingga pembaruan berikutnya dapat terus
diresolusikan melalui ClawHub.

## Menemukan dan memasang plugin

Cari dari OpenClaw:

```bash
openclaw plugins search "calendar"
```

Pasang plugin yang dihosting ClawHub dengan sumber ClawHub yang eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

Perbarui plugin yang sudah terpasang:

```bash
openclaw plugins update --all
```

Gunakan prefiks `clawhub:` saat Anda ingin OpenClaw meresolusikan paket melalui
ClawHub, bukan npm atau sumber lain.

## Masuk untuk publikasi

Pasang CLI ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Masuk dengan GitHub:

```bash
clawhub login
clawhub whoami
```

Lingkungan tanpa antarmuka grafis dapat menggunakan token API dari UI web ClawHub:

```bash
clawhub login --token clh_...
```

## Memublikasikan skill

Skill adalah folder dengan file `SKILL.md` wajib dan file pendukung opsional.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Sebelum memublikasikan, periksa metadata di `SKILL.md`. Deklarasikan variabel
lingkungan, alat, dan izin yang diperlukan agar pengguna dapat memahami apa yang
dibutuhkan skill sebelum mereka memasangnya. Lihat [Format skill](/id/clawhub/skill-format).

## Memublikasikan plugin

Publikasikan plugin dari folder lokal, repo GitHub, ref GitHub, atau arsip yang
sudah ada:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan `--dry-run` terlebih dahulu untuk meninjau metadata paket yang diresolusikan, kolom
kompatibilitas, atribusi sumber, dan rencana unggah tanpa memublikasikan.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw di `package.json`,
termasuk `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.

## Menyinkronkan skill yang Anda pelihara

`sync` memindai folder skill dan memublikasikan skill baru atau yang berubah yang belum
disinkronkan.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Saat Anda masuk, `sync` juga dapat mengirim snapshot pemasangan minimal untuk
jumlah pemasangan agregat. Lihat [Telemetri](/id/clawhub/telemetry) untuk mengetahui apa yang dilaporkan
dan cara memilih keluar.

## Memeriksa sebelum memasang

Sebelum memasang, gunakan halaman web ClawHub atau perintah detail CLI untuk memeriksa
metadata, tautan sumber, versi, changelog, dan status pemindaian:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Listing publik menampilkan status pemindaian terbaru. Rilis yang ditahan atau diblokir oleh
moderasi dapat disembunyikan dari permukaan pencarian dan pemasangan hingga terselesaikan.
