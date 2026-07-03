---
read_when:
    - Pertama kali menggunakan ClawHub
    - Menginstal skill atau plugin dari registry
    - Menerbitkan ke ClawHub
summary: 'Mulai menggunakan ClawHub: temukan, instal, perbarui, dan publikasikan Skills atau Plugin.'
x-i18n:
    generated_at: "2026-07-03T02:55:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Mulai cepat

ClawHub adalah registri untuk Skills dan Plugin OpenClaw.

Gunakan OpenClaw saat Anda menginstal sesuatu ke OpenClaw. Gunakan CLI `clawhub`
saat Anda masuk, memublikasikan, mengelola listing Anda sendiri, atau menggunakan
alur kerja khusus registri.

## Temukan dan instal Skills

Cari dari OpenClaw:

```bash
openclaw skills search "calendar"
```

Instal Skills:

```bash
openclaw skills install @openclaw/demo
```

Perbarui Skills yang terinstal:

```bash
openclaw skills update --all
```

OpenClaw mencatat dari mana Skills berasal sehingga pembaruan berikutnya dapat
terus diselesaikan melalui ClawHub.

## Temukan dan instal Plugin

Cari dari OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instal Plugin yang dihosting ClawHub dengan sumber ClawHub eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

Perbarui Plugin yang terinstal:

```bash
openclaw plugins update --all
```

Gunakan prefiks `clawhub:` saat Anda ingin OpenClaw menyelesaikan paket melalui
ClawHub, bukan npm atau sumber lain.

## Masuk untuk publikasi

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

## Publikasikan Skills

Skills adalah folder dengan file `SKILL.md` yang wajib ada dan file pendukung
opsional.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Perintah ini melewati konten yang tidak berubah. Skills baru dimulai dari
`1.0.0`; perubahan berikutnya otomatis memublikasikan versi patch berikutnya.
Gunakan `--dry-run` untuk pratinjau atau `--version` untuk memilih versi
eksplisit.

Sebelum memublikasikan, periksa metadata di `SKILL.md`. Deklarasikan variabel
lingkungan, alat, dan izin yang diperlukan agar pengguna dapat memahami apa yang
dibutuhkan Skills sebelum mereka menginstalnya. Lihat [Format Skills](/id/clawhub/skill-format).

Untuk repositori yang berisi beberapa Skills, alur kerja GitHub yang dapat
digunakan ulang memanggil `skill publish` untuk setiap folder Skills langsung di
bawah `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publikasikan Plugin

Publikasikan Plugin dari folder lokal, repo GitHub, ref GitHub, atau arsip yang
sudah ada:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan `--dry-run` terlebih dahulu untuk meninjau metadata paket yang
diselesaikan, bidang kompatibilitas, atribusi sumber, dan rencana unggah tanpa
memublikasikan.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw di `package.json`,
termasuk `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.

## Periksa sebelum menginstal

Sebelum menginstal, gunakan halaman web ClawHub atau perintah detail CLI untuk
memeriksa metadata, tautan sumber, versi, changelog, dan status pemindaian:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Listing publik menampilkan status pemindaian terbaru. Rilis yang ditahan atau
diblokir oleh moderasi dapat disembunyikan dari permukaan pencarian dan instalasi
hingga diselesaikan.
