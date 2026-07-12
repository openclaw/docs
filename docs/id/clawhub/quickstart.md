---
read_when:
    - Pertama kali menggunakan ClawHub
    - Menginstal skill atau Plugin dari registri
    - Menerbitkan ke ClawHub
summary: 'Mulai gunakan ClawHub: temukan, instal, perbarui, dan publikasikan Skills atau Plugin.'
x-i18n:
    generated_at: "2026-07-12T13:59:51Z"
    model: gpt-5.6
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

## Menemukan dan memasang skill

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

OpenClaw mencatat asal skill tersebut agar pembaruan berikutnya dapat terus
diselesaikan melalui ClawHub.

## Menemukan dan memasang plugin

Cari dari OpenClaw:

```bash
openclaw plugins search "calendar"
```

Pasang plugin yang dihosting ClawHub dengan sumber ClawHub yang ditentukan secara eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

Perbarui plugin yang terpasang:

```bash
openclaw plugins update --all
```

Gunakan prefiks `clawhub:` jika Anda ingin OpenClaw menyelesaikan paket melalui
ClawHub, bukan npm atau sumber lain.

## Masuk untuk menerbitkan

Pasang CLI ClawHub:

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

Skill adalah folder dengan berkas `SKILL.md` yang diwajibkan dan berkas pendukung
opsional.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Perintah ini melewati konten yang tidak berubah. Skill baru dimulai pada `1.0.0`; perubahan berikutnya
secara otomatis menerbitkan versi patch selanjutnya. Gunakan `--dry-run` untuk melihat pratinjau atau
`--version` untuk memilih versi tertentu.

Sebelum menerbitkan, periksa metadata dalam `SKILL.md`. Nyatakan variabel
lingkungan, alat, dan izin yang diperlukan agar pengguna dapat memahami kebutuhan
skill tersebut sebelum memasangnya. Lihat [Format skill](/id/clawhub/skill-format).

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

Gunakan `--dry-run` terlebih dahulu untuk melihat pratinjau metadata paket yang diselesaikan, bidang
kompatibilitas, atribusi sumber, dan rencana pengunggahan tanpa menerbitkannya.

Plugin kode harus menyertakan metadata kompatibilitas OpenClaw dalam `package.json`,
termasuk `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.

## Memeriksa sebelum memasang

Sebelum memasang, gunakan halaman web ClawHub atau perintah detail CLI untuk memeriksa
metadata, tautan sumber, versi, catatan perubahan, dan status pemindaian:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Daftar publik menampilkan status pemindaian terbaru. Rilis yang ditahan atau diblokir oleh
moderasi mungkin disembunyikan dari permukaan pencarian dan pemasangan hingga masalahnya diselesaikan.
