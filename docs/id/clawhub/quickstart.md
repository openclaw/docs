---
read_when:
    - Pertama kali menggunakan ClawHub
    - Menginstal keterampilan atau Plugin dari registri
    - Menerbitkan ke ClawHub
summary: 'Mulai menggunakan ClawHub: temukan, instal, perbarui, dan publikasikan Skills atau Plugin.'
x-i18n:
    generated_at: "2026-05-11T20:24:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Quickstart

ClawHub adalah registri untuk skills dan plugins OpenClaw.

Gunakan OpenClaw saat Anda menginstal sesuatu ke dalam OpenClaw. Gunakan CLI `clawhub`
saat Anda masuk, menerbitkan, mengelola listing milik Anda sendiri, atau menggunakan
alur kerja khusus registri.

## Cari dan instal skill

Cari dari OpenClaw:

```bash
openclaw skills search "calendar"
```

Instal skill:

```bash
openclaw skills install <skill-slug>
```

Perbarui skill yang terinstal:

```bash
openclaw skills update --all
```

OpenClaw mencatat asal skill tersebut sehingga pembaruan berikutnya dapat terus
diselesaikan melalui ClawHub.

## Cari dan instal plugin

Cari dari OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instal plugin yang dihosting ClawHub dengan sumber ClawHub eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

Perbarui plugin yang terinstal:

```bash
openclaw plugins update --all
```

Gunakan prefiks `clawhub:` saat Anda ingin OpenClaw menyelesaikan package melalui
ClawHub, bukan npm atau sumber lain.

## Masuk untuk menerbitkan

Instal CLI ClawHub:

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

Lingkungan headless dapat menggunakan token API dari UI web ClawHub:

```bash
clawhub login --token clh_...
```

## Terbitkan skill

Skill adalah folder dengan file `SKILL.md` wajib dan file pendukung opsional.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Sebelum menerbitkan, periksa metadata di `SKILL.md`. Deklarasikan variabel
lingkungan, alat, dan izin yang diperlukan agar pengguna dapat memahami apa yang
dibutuhkan skill sebelum mereka menginstalnya. Lihat [Format skill](/id/clawhub/skill-format).

## Terbitkan plugin

Terbitkan plugin dari folder lokal, repo GitHub, ref GitHub, atau arsip yang sudah ada:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan `--dry-run` terlebih dahulu untuk meninjau metadata package yang diselesaikan, bidang kompatibilitas,
atribusi sumber, dan rencana unggah tanpa menerbitkan.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw di `package.json`,
termasuk `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.

## Sinkronkan skill yang Anda kelola

`sync` memindai folder skill dan menerbitkan skill baru atau yang berubah yang belum
disinkronkan.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Saat Anda masuk, `sync` juga dapat mengirim snapshot instal minimal untuk
jumlah instal agregat. Lihat [Telemetri](/id/clawhub/telemetry) untuk mengetahui apa yang dilaporkan
dan cara keluar.

## Periksa sebelum menginstal

Sebelum menginstal, gunakan halaman web ClawHub atau perintah detail CLI untuk memeriksa
metadata, tautan sumber, versi, changelog, dan status pemindaian:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Listing publik menampilkan status pemindaian terbaru. Rilis yang ditahan atau diblokir oleh
moderasi dapat disembunyikan dari permukaan pencarian dan instal hingga diselesaikan.
