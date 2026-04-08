---
read_when:
    - Menjalankan skrip dari repo
    - Menambahkan atau mengubah skrip di bawah ./scripts
summary: 'Skrip repositori: tujuan, cakupan, dan catatan keamanan'
title: Skrip
x-i18n:
    generated_at: "2026-04-08T02:15:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecf1e9327929948fb75f80e306963af49b353c0aa8d3b6fa532ca964ff8b975
    source_path: help/scripts.md
    workflow: 15
---

# Skrip

Direktori `scripts/` berisi skrip pembantu untuk alur kerja lokal dan tugas operasional.
Gunakan ini ketika suatu tugas jelas terkait dengan skrip; jika tidak, lebih baik gunakan CLI.

## Konvensi

- Skrip bersifat **opsional** kecuali dirujuk dalam dokumentasi atau checklist rilis.
- Utamakan permukaan CLI jika tersedia (contoh: pemantauan auth menggunakan `openclaw models status --check`).
- Anggap skrip bersifat spesifik host; baca dahulu sebelum menjalankannya di mesin baru.

## Skrip pemantauan auth

Pemantauan auth dibahas dalam [Authentication](/id/gateway/authentication). Skrip di bawah `scripts/` adalah tambahan opsional untuk alur kerja ponsel systemd/Termux.

## Pembantu pembacaan GitHub

Gunakan `scripts/gh-read` saat Anda ingin `gh` menggunakan token instalasi GitHub App untuk panggilan baca dengan cakupan repo sambil tetap membiarkan `gh` normal menggunakan login pribadi Anda untuk tindakan tulis.

Env yang wajib:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Env opsional:

- `OPENCLAW_GH_READ_INSTALLATION_ID` saat Anda ingin melewati pencarian instalasi berbasis repo
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

- Jaga agar skrip tetap terfokus dan terdokumentasi.
- Tambahkan entri singkat di dokumen yang relevan (atau buat jika belum ada).
