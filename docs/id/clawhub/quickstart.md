---
read_when:
    - Pertama kali menggunakan ClawHub
    - Memasang Skills atau Plugin dari registri
    - Mempublikasikan ke ClawHub
summary: 'Mulai gunakan ClawHub: temukan, instal, perbarui, dan publikasikan Skills atau Plugin.'
x-i18n:
    generated_at: "2026-07-04T04:06:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Mulai Cepat

ClawHub adalah registri untuk Skills dan Plugin OpenClaw.

Gunakan OpenClaw saat Anda memasang sesuatu ke OpenClaw. Gunakan CLI `clawhub`
saat Anda masuk, menerbitkan, mengelola daftar milik Anda sendiri, atau menggunakan
alur kerja khusus registri.

## Temukan dan pasang skill

Cari dari OpenClaw:

```bash
openclaw skills search "calendar"
```

Pasang skill:

```bash
openclaw skills install @openclaw/demo
```

Perbarui skill yang terpasang:

```bash
openclaw skills update --all
```

OpenClaw mencatat asal skill tersebut sehingga pembaruan berikutnya dapat terus
diresolusikan melalui ClawHub.

## Temukan dan pasang Plugin

Cari dari OpenClaw:

```bash
openclaw plugins search "calendar"
```

Pasang Plugin yang dihosting ClawHub dengan sumber ClawHub eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

Perbarui Plugin yang terpasang:

```bash
openclaw plugins update --all
```

Gunakan prefiks `clawhub:` saat Anda ingin OpenClaw meresolusikan paket melalui
ClawHub, bukan npm atau sumber lain.

## Masuk untuk penerbitan

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

Skill adalah folder dengan file `SKILL.md` wajib dan file pendukung opsional.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Perintah ini melewati konten yang tidak berubah. Skill baru dimulai dari `1.0.0`; perubahan berikutnya
secara otomatis menerbitkan versi patch berikutnya. Gunakan `--dry-run` untuk pratinjau atau
`--version` untuk memilih versi eksplisit.

Sebelum menerbitkan, periksa metadata di `SKILL.md`. Deklarasikan variabel
lingkungan, alat, dan izin yang diperlukan agar pengguna dapat memahami apa yang
dibutuhkan skill sebelum mereka memasangnya. Lihat [Format skill](/id/clawhub/skill-format).

Untuk repositori yang berisi beberapa skill, alur kerja GitHub yang dapat digunakan kembali memanggil
`skill publish` untuk setiap folder skill langsung di bawah `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Terbitkan Plugin

Terbitkan Plugin dari folder lokal, repo GitHub, ref GitHub, atau
arsip yang sudah ada:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan `--dry-run` terlebih dahulu untuk melihat pratinjau metadata paket yang diresolusikan, kolom kompatibilitas,
atribusi sumber, dan rencana unggahan tanpa menerbitkan.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw di `package.json`,
termasuk `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.

## Periksa sebelum memasang

Sebelum memasang, gunakan halaman web ClawHub atau perintah detail CLI untuk memeriksa
metadata, tautan sumber, versi, changelog, dan status pemindaian:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Daftar publik menampilkan status pemindaian terbaru. Rilis yang ditahan atau diblokir oleh
moderasi mungkin disembunyikan dari permukaan pencarian dan pemasangan hingga diselesaikan.
