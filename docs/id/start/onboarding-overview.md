---
read_when:
    - Memilih jalur onboarding
    - Menyiapkan lingkungan baru
sidebarTitle: Onboarding Overview
summary: Gambaran umum opsi dan alur onboarding OpenClaw
title: Gambaran Umum Onboarding
x-i18n:
    generated_at: "2026-04-05T14:06:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374697c1dbe0c3871c43164076fbed7119ef032f4a40d0f6e421051f914806e5
    source_path: start/onboarding-overview.md
    workflow: 15
---

# Gambaran Umum Onboarding

OpenClaw memiliki dua jalur onboarding. Keduanya mengonfigurasi autentikasi, Gateway, dan
channel chat opsional — perbedaannya hanya pada cara Anda berinteraksi dengan penyiapan.

## Jalur mana yang sebaiknya saya gunakan?

|                | Onboarding CLI                         | onboarding aplikasi macOS |
| -------------- | -------------------------------------- | ------------------------- |
| **Platform**   | macOS, Linux, Windows (native atau WSL2) | hanya macOS             |
| **Antarmuka**  | Wizard terminal                        | UI terpandu di aplikasi   |
| **Paling cocok untuk** | Server, headless, kontrol penuh | Desktop Mac, penyiapan visual |
| **Otomatisasi** | `--non-interactive` untuk skrip       | Hanya manual              |
| **Perintah**   | `openclaw onboard`                     | Luncurkan aplikasi        |

Sebagian besar pengguna sebaiknya memulai dengan **onboarding CLI** — ini berfungsi di mana saja dan memberi
Anda kontrol paling besar.

## Yang dikonfigurasi oleh onboarding

Terlepas dari jalur mana yang Anda pilih, onboarding menyiapkan:

1. **Penyedia model dan autentikasi** — API key, OAuth, atau token penyiapan untuk penyedia yang Anda pilih
2. **Workspace** — direktori untuk file agen, templat bootstrap, dan memori
3. **Gateway** — port, alamat bind, mode autentikasi
4. **Channel** (opsional) — channel chat bawaan dan plugin bawaan seperti
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp, dan lainnya
5. **Daemon** (opsional) — layanan latar belakang agar Gateway dimulai secara otomatis

## Onboarding CLI

Jalankan di terminal mana pun:

```bash
openclaw onboard
```

Tambahkan `--install-daemon` untuk juga memasang layanan latar belakang dalam satu langkah.

Referensi lengkap: [Onboarding (CLI)](/start/wizard)
Dokumen perintah CLI: [`openclaw onboard`](/cli/onboard)

## Onboarding aplikasi macOS

Buka aplikasi OpenClaw. Wizard saat pertama kali dijalankan memandu Anda melalui langkah yang sama
dengan antarmuka visual.

Referensi lengkap: [Onboarding (Aplikasi macOS)](/start/onboarding)

## Penyedia kustom atau yang tidak terdaftar

Jika penyedia Anda tidak tercantum dalam onboarding, pilih **Custom Provider** lalu
masukkan:

- Mode kompatibilitas API (kompatibel dengan OpenAI, kompatibel dengan Anthropic, atau deteksi otomatis)
- URL dasar dan API key
- ID model dan alias opsional

Beberapa endpoint kustom dapat berdampingan — masing-masing mendapatkan ID endpoint sendiri.
