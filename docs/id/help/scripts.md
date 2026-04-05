---
read_when:
    - Menjalankan skrip dari repositori
    - Menambahkan atau mengubah skrip di bawah ./scripts
summary: 'Skrip repositori: tujuan, cakupan, dan catatan keamanan'
title: Skrip
x-i18n:
    generated_at: "2026-04-05T13:56:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: de53d64d91c564931bdd4e8b9f4a8e88646332a07cc2a6bf1d517b89debb29cd
    source_path: help/scripts.md
    workflow: 15
---

# Skrip

Direktori `scripts/` berisi skrip helper untuk alur kerja lokal dan tugas operasional.
Gunakan ini ketika suatu tugas jelas terkait dengan skrip; jika tidak, utamakan CLI.

## Konvensi

- Skrip bersifat **opsional** kecuali dirujuk dalam dokumentasi atau checklist rilis.
- Utamakan permukaan CLI saat tersedia (contoh: pemantauan auth menggunakan `openclaw models status --check`).
- Anggap skrip bersifat spesifik host; baca dulu sebelum menjalankannya di mesin baru.

## Skrip pemantauan auth

Pemantauan auth dibahas dalam [Authentication](/id/gateway/authentication). Skrip di bawah `scripts/` adalah tambahan opsional untuk alur kerja systemd/Termux di ponsel.

## Saat menambahkan skrip

- Jaga agar skrip tetap fokus dan terdokumentasi.
- Tambahkan entri singkat dalam dokumentasi yang relevan (atau buat jika belum ada).
