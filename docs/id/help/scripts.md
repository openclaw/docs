---
read_when:
    - Menjalankan skrip dari repo
    - Menambahkan atau mengubah skrip di bawah ./scripts
summary: 'Skrip repository: tujuan, cakupan, dan catatan keamanan'
title: Skrip
x-i18n:
    generated_at: "2026-04-24T09:11:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

Direktori `scripts/` berisi skrip pembantu untuk alur kerja lokal dan tugas operasional.
Gunakan skrip ini ketika suatu tugas jelas terkait dengan skrip; jika tidak, utamakan CLI.

## Konvensi

- Skrip bersifat **opsional** kecuali dirujuk dalam dokumentasi atau checklist rilis.
- Utamakan permukaan CLI jika sudah ada (contoh: pemantauan autentikasi menggunakan `openclaw models status --check`).
- Anggap skrip bersifat spesifik host; baca terlebih dahulu sebelum menjalankannya di mesin baru.

## Skrip pemantauan autentikasi

Pemantauan autentikasi dibahas dalam [Authentication](/id/gateway/authentication). Skrip di bawah `scripts/` adalah tambahan opsional untuk alur kerja systemd/Termux di ponsel.

## Helper baca GitHub

Gunakan `scripts/gh-read` ketika Anda ingin `gh` menggunakan token instalasi GitHub App untuk panggilan baca bercakupan repo sambil membiarkan `gh` normal tetap menggunakan login pribadi Anda untuk aksi tulis.

Env yang wajib:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Env opsional:

- `OPENCLAW_GH_READ_INSTALLATION_ID` ketika Anda ingin melewati pencarian instalasi berbasis repo
- `OPENCLAW_GH_READ_PERMISSIONS` sebagai override yang dipisahkan koma untuk subset izin baca yang diminta

Urutan resolusi repo:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Contoh:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Saat menambahkan skrip

- Jaga skrip tetap terfokus dan terdokumentasi.
- Tambahkan entri singkat di dokumentasi terkait (atau buat jika belum ada).

## Terkait

- [Testing](/id/help/testing)
- [Testing live](/id/help/testing-live)
