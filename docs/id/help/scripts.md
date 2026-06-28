---
read_when:
    - Menjalankan skrip dari repositori
    - Menambahkan atau mengubah skrip di bawah ./scripts
summary: 'Skrip repositori: tujuan, cakupan, dan catatan keamanan'
title: Skrip
x-i18n:
    generated_at: "2026-05-06T09:15:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Direktori `scripts/` berisi skrip pembantu untuk alur kerja lokal dan tugas operasional.
Gunakan ini saat sebuah tugas jelas terkait dengan skrip; jika tidak, utamakan CLI.

## Konvensi

- Skrip bersifat **opsional** kecuali dirujuk dalam dokumentasi atau checklist rilis.
- Utamakan permukaan CLI saat tersedia (contoh: pemantauan autentikasi menggunakan `openclaw models status --check`).
- Anggap skrip bersifat spesifik host; baca sebelum menjalankannya di mesin baru.

## Skrip pemantauan autentikasi

Pemantauan autentikasi dibahas di [Autentikasi](/id/gateway/authentication). Skrip di bawah `scripts/` adalah tambahan opsional untuk alur kerja ponsel systemd/Termux.

## Pembantu baca GitHub

Gunakan `scripts/gh-read` saat Anda ingin `gh` menggunakan token instalasi GitHub App untuk panggilan baca yang dicakup repo sambil membiarkan `gh` normal tetap memakai login pribadi Anda untuk tindakan tulis.

Env wajib:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Env opsional:

- `OPENCLAW_GH_READ_INSTALLATION_ID` saat Anda ingin melewati pencarian instalasi berbasis repo
- `OPENCLAW_GH_READ_PERMISSIONS` sebagai override yang dipisahkan koma untuk subset izin baca yang akan diminta

Urutan resolusi repo:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Contoh:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Saat menambahkan skrip

- Jaga agar skrip tetap terfokus dan terdokumentasi.
- Tambahkan entri singkat di dokumen yang relevan (atau buat satu jika belum ada).

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian langsung](/id/help/testing-live)
