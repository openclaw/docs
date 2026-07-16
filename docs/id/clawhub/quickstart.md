---
read_when:
    - Pertama kali menggunakan ClawHub
    - Menginstal skill atau plugin dari registri
    - Menerbitkan ke ClawHub
summary: 'Mulai gunakan ClawHub: temukan, instal, perbarui, dan publikasikan skill atau plugin.'
x-i18n:
    generated_at: "2026-07-16T17:51:50Z"
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

Gunakan OpenClaw saat Anda menginstal sesuatu ke OpenClaw. Gunakan CLI `clawhub`
saat Anda masuk, menerbitkan, mengelola daftar milik Anda sendiri, atau menggunakan
alur kerja khusus registri.

## Mencari dan menginstal Skills

Cari dari OpenClaw:

```bash
openclaw skills search "calendar"
```

Instal Skills:

```bash
openclaw skills install @openclaw/demo
```

Perbarui Skills yang telah diinstal:

```bash
openclaw skills update --all
```

OpenClaw mencatat asal Skills agar pembaruan berikutnya dapat terus
diresolusikan melalui ClawHub.

## Mencari dan menginstal Plugin

Cari dari OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instal Plugin yang dihosting di ClawHub dengan sumber ClawHub yang eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

Perbarui Plugin yang telah diinstal:

```bash
openclaw plugins update --all
```

Gunakan prefiks `clawhub:` saat Anda ingin OpenClaw meresolusikan paket melalui
ClawHub, bukan npm atau sumber lain.

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

Lingkungan tanpa antarmuka grafis dapat menggunakan token API dari UI web ClawHub:

```bash
clawhub login --token clh_...
```

## Menerbitkan Skills

Skills adalah folder dengan file wajib `SKILL.md` dan file pendukung
opsional.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Perintah ini melewati konten yang tidak berubah. Skills baru dimulai pada `1.0.0`; perubahan berikutnya
secara otomatis menerbitkan versi patch selanjutnya. Gunakan `--dry-run` untuk melihat pratinjau atau
`--version` untuk memilih versi eksplisit.

Sebelum menerbitkan, periksa metadata di `SKILL.md`. Deklarasikan
variabel lingkungan, alat, dan izin yang diperlukan agar pengguna dapat memahami apa yang
dibutuhkan Skills sebelum menginstalnya. Lihat [Format Skills](/id/clawhub/skill-format).

Untuk repositori yang berisi beberapa Skills, alur kerja GitHub yang dapat digunakan kembali memanggil
`skill publish` untuk setiap folder Skills langsung di bawah `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Menerbitkan Plugin

Terbitkan Plugin dari folder lokal, repo GitHub, ref GitHub, atau
arsip yang sudah ada:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan `--dry-run` terlebih dahulu untuk melihat pratinjau metadata paket yang diresolusikan, bidang
kompatibilitas, atribusi sumber, dan rencana unggahan tanpa menerbitkannya.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw dalam `package.json`,
termasuk `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.

## Memeriksa sebelum menginstal

Sebelum menginstal, gunakan halaman web ClawHub atau perintah detail CLI untuk memeriksa
metadata, tautan sumber, versi, log perubahan, dan status pemindaian:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Daftar publik menampilkan status pemindaian terbaru. Rilis yang ditahan atau diblokir oleh
moderasi mungkin disembunyikan dari tampilan pencarian dan instalasi hingga masalahnya terselesaikan.
