---
read_when:
    - Pertama kali menggunakan ClawHub
    - Menginstal skill atau plugin dari registri
    - Menerbitkan ke ClawHub
summary: 'Mulai gunakan ClawHub: temukan, instal, perbarui, dan publikasikan skill atau plugin.'
x-i18n:
    generated_at: "2026-07-19T04:52:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Mulai Cepat

ClawHub adalah registri untuk Skills dan Plugin OpenClaw.

Gunakan OpenClaw saat Anda menginstal sesuatu ke dalam OpenClaw. Gunakan CLI `clawhub`
saat Anda masuk, menerbitkan, mengelola daftar milik Anda sendiri, atau menggunakan
alur kerja khusus registri.

## Menemukan dan menginstal skill

Cari dari OpenClaw:

```bash
openclaw skills search "calendar"
```

Instal skill:

```bash
openclaw skills install @openclaw/demo
```

Perbarui skill yang terinstal:

```bash
openclaw skills update --all
```

OpenClaw mencatat asal skill agar pembaruan berikutnya dapat terus
diresolusikan melalui ClawHub.

## Menemukan dan menginstal plugin

Cari dari OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instal plugin yang dihosting ClawHub dengan sumber ClawHub yang dinyatakan secara eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

Perbarui plugin yang terinstal:

```bash
openclaw plugins update --all
```

Gunakan prefiks `clawhub:` saat Anda ingin OpenClaw meresolusikan paket melalui
ClawHub, bukan melalui npm atau sumber lain.

## Masuk untuk menerbitkan

Instal CLI ClawHub:

```bash
npm i -g clawhub
# atau
pnpm add -g clawhub
```

Masuk dengan GitHub:

```bash
clawhub login
clawhub whoami
```

Lingkungan tanpa antarmuka grafis dapat menggunakan token API dari antarmuka web ClawHub:

```bash
clawhub login --token clh_...
```

## Menerbitkan skill

Skill adalah folder dengan file `SKILL.md` yang wajib ada dan file pendukung
opsional.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Perintah ini melewati konten yang tidak berubah. Skill baru dimulai pada `1.0.0`; perubahan berikutnya
secara otomatis menerbitkan versi patch selanjutnya. Gunakan `--dry-run` untuk meninjau atau
`--version` untuk memilih versi secara eksplisit.

Sebelum menerbitkan, periksa metadata dalam `SKILL.md`. Deklarasikan
variabel lingkungan, alat, dan izin yang diperlukan agar pengguna dapat memahami apa yang
dibutuhkan skill sebelum menginstalnya. Lihat [Format skill](/clawhub/skill-format).

Untuk repositori yang berisi beberapa skill, alur kerja GitHub yang dapat digunakan kembali memanggil
`skill publish` untuk setiap folder skill langsung di bawah `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Menerbitkan plugin

Terbitkan plugin dari folder lokal, repositori GitHub, ref GitHub, atau
arsip yang sudah ada:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan `--dry-run` terlebih dahulu untuk meninjau metadata paket yang diresolusikan, bidang
kompatibilitas, atribusi sumber, dan rencana pengunggahan tanpa menerbitkannya.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw dalam `package.json`,
termasuk `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.

## Memeriksa sebelum menginstal

Sebelum menginstal, gunakan halaman web ClawHub atau perintah detail CLI untuk memeriksa
metadata, tautan sumber, versi, catatan perubahan, dan status pemindaian:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Daftar publik menampilkan status pemindaian terbaru. Rilis yang ditahan atau diblokir oleh
moderasi mungkin disembunyikan dari permukaan pencarian dan penginstalan hingga masalahnya diselesaikan.
