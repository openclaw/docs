---
read_when:
    - Menjalankan skrip dari repositori
    - Menambahkan atau mengubah skrip di bawah ./scripts
summary: 'Skrip repositori: tujuan, cakupan, dan catatan keamanan'
title: Skrip
x-i18n:
    generated_at: "2026-07-12T14:16:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` berisi skrip pembantu untuk alur kerja lokal dan tugas operasional. Gunakan skrip ini jika suatu tugas jelas terkait dengan sebuah skrip; jika tidak, utamakan CLI.

## Konvensi

- Skrip bersifat **opsional** kecuali dirujuk dalam dokumentasi atau daftar periksa rilis.
- Utamakan antarmuka CLI jika tersedia (contoh: `openclaw models status --check`).
- Anggap skrip bersifat khusus untuk host; baca skrip sebelum menjalankannya pada mesin baru.

## Skrip pemantauan autentikasi

Autentikasi model secara umum dibahas dalam [Autentikasi](/id/gateway/authentication). Skrip di bawah ini merupakan sistem terpisah dan opsional untuk memantau **token langganan Claude Code CLI** pada host jarak jauh/tanpa antarmuka dan melakukan autentikasi ulang dari ponsel:

- `scripts/setup-auth-system.sh` - penyiapan satu kali: memeriksa autentikasi saat ini, membantu menghasilkan `claude setup-token` berumur panjang, dan menampilkan langkah-langkah instalasi systemd/Termux.
- `scripts/claude-auth-status.sh [full|json|simple]` - memeriksa status autentikasi Claude Code + OpenClaw.
- `scripts/auth-monitor.sh` - memeriksa status secara berkala dan mengirim notifikasi (melalui pengiriman OpenClaw dan/atau ntfy.sh) saat token mendekati kedaluwarsa. Variabel lingkungan: `WARN_HOURS` (nilai bawaan `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. Jalankan secara terjadwal melalui `scripts/systemd/openclaw-auth-monitor.{service,timer}` yang disertakan (setiap 30 menit).
- `scripts/mobile-reauth.sh` - menjalankan kembali `claude setup-token` dan menampilkan URL untuk dibuka di ponsel, untuk digunakan melalui SSH dari Termux.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` - skrip Termux:Widget yang terhubung ke host melalui SSH, menampilkan notifikasi singkat status, dan membuka konsol/petunjuk autentikasi ulang saat autentikasi telah kedaluwarsa.

## Pembantu baca GitHub

Gunakan `scripts/gh-read` jika Anda ingin `gh` menggunakan token instalasi GitHub App untuk panggilan baca yang dibatasi pada repositori, sementara `gh` biasa tetap menggunakan akun pribadi Anda untuk tindakan tulis.

Variabel lingkungan yang diperlukan:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variabel lingkungan opsional:

- `OPENCLAW_GH_READ_INSTALLATION_ID` jika Anda ingin melewati pencarian instalasi berbasis repositori
- `OPENCLAW_GH_READ_PERMISSIONS` sebagai penggantian yang dipisahkan koma untuk subset izin baca yang akan diminta

Urutan resolusi repositori:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Contoh:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Saat menambahkan skrip

- Pastikan skrip tetap terfokus dan terdokumentasi.
- Tambahkan entri singkat dalam dokumentasi yang relevan (atau buat dokumentasi jika belum ada).

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian langsung](/id/help/testing-live)
