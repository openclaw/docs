---
read_when:
    - Pertama kali menggunakan ClawHub
    - Menginstal Skills atau Plugin dari registri
    - Memublikasikan ke ClawHub
summary: 'Mulai gunakan ClawHub: temukan, instal, perbarui, dan publikasikan Skills atau Plugin.'
x-i18n:
    generated_at: "2026-05-12T15:42:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Mulai Cepat

ClawHub adalah registri untuk skill dan plugin OpenClaw.

Gunakan OpenClaw saat Anda memasang berbagai hal ke dalam OpenClaw. Gunakan CLI `clawhub`
saat Anda masuk, menerbitkan, mengelola listing milik Anda, atau menggunakan
alur kerja khusus registri.

## Cari dan pasang skill

Cari dari OpenClaw:

```bash
openclaw skills search "calendar"
```

Pasang skill:

```bash
openclaw skills install <skill-slug>
```

Perbarui skill yang terpasang:

```bash
openclaw skills update --all
```

OpenClaw mencatat asal skill sehingga pembaruan berikutnya dapat tetap
diselesaikan melalui ClawHub.

## Cari dan pasang plugin

Cari dari OpenClaw:

```bash
openclaw plugins search "calendar"
```

Pasang plugin yang dihosting ClawHub dengan sumber ClawHub eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

Perbarui plugin yang terpasang:

```bash
openclaw plugins update --all
```

Gunakan prefiks `clawhub:` saat Anda ingin OpenClaw menyelesaikan paket melalui
ClawHub, bukan npm atau sumber lain.

## Masuk untuk menerbitkan

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

Lingkungan tanpa antarmuka dapat menggunakan token API dari UI web ClawHub:

```bash
clawhub login --token clh_...
```

## Terbitkan skill

Skill adalah folder dengan file `SKILL.md` wajib dan file pendukung
opsional.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Sebelum menerbitkan, periksa metadata di `SKILL.md`. Deklarasikan variabel
lingkungan, alat, dan izin yang diperlukan agar pengguna dapat memahami apa yang
dibutuhkan skill sebelum mereka memasangnya. Lihat [Format skill](/id/clawhub/skill-format).

## Terbitkan plugin

Terbitkan plugin dari folder lokal, repo GitHub, ref GitHub, atau
arsip yang sudah ada:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan `--dry-run` terlebih dahulu untuk meninjau metadata paket yang diselesaikan, bidang
kompatibilitas, atribusi sumber, dan rencana unggahan tanpa menerbitkan.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw di `package.json`,
termasuk `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.

## Sinkronkan skill yang Anda pelihara

`sync` memindai folder skill dan menerbitkan skill baru atau yang berubah yang belum
disinkronkan.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Saat Anda sudah masuk, `sync` juga dapat mengirim snapshot pemasangan minimal untuk
jumlah pemasangan agregat. Lihat [Telemetri](/id/clawhub/telemetry) untuk mengetahui apa yang dilaporkan
dan cara memilih keluar.

## Periksa sebelum memasang

Sebelum memasang, gunakan halaman web ClawHub atau perintah detail CLI untuk memeriksa
metadata, tautan sumber, versi, changelog, dan status pemindaian:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Listing publik menampilkan status pemindaian terbaru. Rilis yang ditahan atau diblokir oleh
moderasi dapat disembunyikan dari permukaan pencarian dan pemasangan hingga terselesaikan.
