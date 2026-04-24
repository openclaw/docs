---
read_when:
    - Memilih jalur onboarding
    - Menyiapkan lingkungan baru
sidebarTitle: Onboarding Overview
summary: Ikhtisar opsi dan alur onboarding OpenClaw
title: Ikhtisar onboarding
x-i18n:
    generated_at: "2026-04-24T09:28:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw memiliki dua jalur onboarding. Keduanya mengonfigurasi auth, Gateway, dan
channel chat opsional — perbedaannya hanya pada cara Anda berinteraksi dengan penyiapan.

## Jalur mana yang harus saya gunakan?

|                | Onboarding CLI                         | Onboarding aplikasi macOS |
| -------------- | -------------------------------------- | ------------------------- |
| **Platform**   | macOS, Linux, Windows (native atau WSL2) | hanya macOS             |
| **Antarmuka**  | Wizard terminal                        | UI terpandu di aplikasi   |
| **Terbaik untuk** | Server, headless, kontrol penuh     | Mac desktop, penyiapan visual |
| **Otomatisasi** | `--non-interactive` untuk skrip       | hanya manual              |
| **Perintah**   | `openclaw onboard`                     | Luncurkan aplikasi        |

Sebagian besar pengguna sebaiknya memulai dengan **onboarding CLI** — ini berfungsi di mana saja dan memberi
Anda kontrol paling besar.

## Apa yang dikonfigurasi oleh onboarding

Terlepas dari jalur yang Anda pilih, onboarding menyiapkan:

1. **Provider model dan auth** — API key, OAuth, atau token penyiapan untuk provider pilihan Anda
2. **Workspace** — direktori untuk file agen, template bootstrap, dan memori
3. **Gateway** — port, alamat bind, mode auth
4. **Channels** (opsional) — channel chat built-in dan bundled seperti
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp, dan lainnya
5. **Daemon** (opsional) — layanan latar belakang agar Gateway dimulai secara otomatis

## Onboarding CLI

Jalankan di terminal mana pun:

```bash
openclaw onboard
```

Tambahkan `--install-daemon` untuk sekaligus menginstal layanan latar belakang dalam satu langkah.

Referensi lengkap: [Onboarding (CLI)](/id/start/wizard)
Dokumen perintah CLI: [`openclaw onboard`](/id/cli/onboard)

## Onboarding aplikasi macOS

Buka aplikasi OpenClaw. Wizard pertama kali menjalankan akan memandu Anda melalui langkah yang sama
dengan antarmuka visual.

Referensi lengkap: [Onboarding (Aplikasi macOS)](/id/start/onboarding)

## Provider kustom atau yang tidak tercantum

Jika provider Anda tidak tercantum di onboarding, pilih **Custom Provider** dan
masukkan:

- Mode kompatibilitas API (kompatibel dengan OpenAI, kompatibel dengan Anthropic, atau deteksi otomatis)
- Base URL dan API key
- ID model dan alias opsional

Beberapa endpoint kustom dapat hidup berdampingan — masing-masing mendapatkan ID endpoint-nya sendiri.

## Terkait

- [Memulai](/id/start/getting-started)
- [Referensi penyiapan CLI](/id/start/wizard-cli-reference)
