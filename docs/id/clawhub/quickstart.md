---
read_when:
    - Pertama kali menggunakan ClawHub
    - Menginstal skill atau plugin dari registry
    - Menerbitkan ke ClawHub
summary: 'Mulai menggunakan ClawHub: temukan, instal, perbarui, dan publikasikan Skills atau Plugin.'
x-i18n:
    generated_at: "2026-07-01T20:35:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Mulai cepat

ClawHub adalah registri untuk skill dan plugin OpenClaw.

Gunakan OpenClaw saat Anda menginstal sesuatu ke OpenClaw. Gunakan CLI `clawhub`
saat Anda masuk, menerbitkan, mengelola listing Anda sendiri, atau menggunakan
alur kerja khusus registri.

## Temukan dan instal skill

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

OpenClaw mencatat asal skill tersebut sehingga pembaruan berikutnya dapat terus
diselesaikan melalui ClawHub.

## Temukan dan instal plugin

Cari dari OpenClaw:

```bash
openclaw plugins search "calendar"
```

Instal plugin yang di-host di ClawHub dengan sumber ClawHub eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

Perbarui plugin yang terinstal:

```bash
openclaw plugins update --all
```

Gunakan prefiks `clawhub:` saat Anda ingin OpenClaw menyelesaikan paket melalui
ClawHub, bukan npm atau sumber lain.

## Masuk untuk penerbitan

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

Lingkungan tanpa antarmuka dapat menggunakan token API dari UI web ClawHub:

```bash
clawhub login --token clh_...
```

## Terbitkan skill

Skill adalah folder dengan file `SKILL.md` yang wajib dan file pendukung
opsional.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Perintah ini melewati konten yang tidak berubah. Skill baru dimulai dari `1.0.0`;
perubahan berikutnya secara otomatis menerbitkan versi patch berikutnya. Gunakan
`--dry-run` untuk pratinjau atau `--version` untuk memilih versi eksplisit.

Sebelum menerbitkan, periksa metadata di `SKILL.md`. Deklarasikan variabel
lingkungan, alat, dan izin yang diperlukan agar pengguna dapat memahami apa yang
dibutuhkan skill sebelum mereka menginstalnya. Lihat [Format skill](/id/clawhub/skill-format).

Untuk repositori yang berisi beberapa skill, alur kerja GitHub yang dapat
digunakan ulang memanggil `skill publish` untuk setiap folder skill langsung di
bawah `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Terbitkan plugin

Terbitkan plugin dari folder lokal, repo GitHub, ref GitHub, atau arsip yang
sudah ada:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan `--dry-run` terlebih dahulu untuk melihat pratinjau metadata paket yang
diselesaikan, kolom kompatibilitas, atribusi sumber, dan rencana unggahan tanpa
menerbitkan.

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
diblokir oleh moderasi mungkin disembunyikan dari permukaan pencarian dan
instalasi hingga terselesaikan.
