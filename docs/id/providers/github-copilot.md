---
read_when:
    - Anda ingin menggunakan GitHub Copilot sebagai model provider
    - Anda memerlukan alur `openclaw models auth login-github-copilot`
summary: Masuk ke GitHub Copilot dari OpenClaw menggunakan device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-05T14:03:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92857c119c314e698f922dbdbbc15d21b64d33a25979a2ec0ac1e82e586db6d6
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

## Apa itu GitHub Copilot?

GitHub Copilot adalah asisten coding AI dari GitHub. Ini menyediakan akses ke model
Copilot untuk akun dan paket GitHub Anda. OpenClaw dapat menggunakan Copilot sebagai
model provider dengan dua cara berbeda.

## Dua cara menggunakan Copilot di OpenClaw

### 1) Provider GitHub Copilot bawaan (`github-copilot`)

Gunakan alur login perangkat native untuk mendapatkan token GitHub, lalu tukarkan token tersebut dengan
token API Copilot saat OpenClaw berjalan. Ini adalah jalur **default** dan paling sederhana
karena tidak memerlukan VS Code.

### 2) Plugin Copilot Proxy (`copilot-proxy`)

Gunakan extension VS Code **Copilot Proxy** sebagai bridge lokal. OpenClaw berkomunikasi dengan
endpoint `/v1` milik proxy dan menggunakan daftar model yang Anda konfigurasi di sana. Pilih ini
jika Anda sudah menjalankan Copilot Proxy di VS Code atau perlu merutekannya melalui itu.
Anda harus mengaktifkan plugin dan menjaga extension VS Code tetap berjalan.

Gunakan GitHub Copilot sebagai model provider (`github-copilot`). Perintah login menjalankan
alur perangkat GitHub, menyimpan auth profile, dan memperbarui konfigurasi Anda agar menggunakan
profil tersebut.

## Setup CLI

```bash
openclaw models auth login-github-copilot
```

Anda akan diminta mengunjungi URL dan memasukkan kode sekali pakai. Biarkan terminal
tetap terbuka sampai proses selesai.

### Flag opsional

```bash
openclaw models auth login-github-copilot --yes
```

Untuk juga menerapkan model default yang direkomendasikan provider dalam satu langkah, gunakan
perintah auth generik berikut:

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## Setel model default

```bash
openclaw models set github-copilot/gpt-4o
```

### Potongan konfigurasi

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Catatan

- Memerlukan TTY interaktif; jalankan langsung di terminal.
- Ketersediaan model Copilot bergantung pada paket Anda; jika sebuah model ditolak, coba
  ID lain (misalnya `github-copilot/gpt-4.1`).
- ID model Claude menggunakan transport Anthropic Messages secara otomatis; model GPT, seri o,
  dan Gemini tetap menggunakan transport OpenAI Responses.
- Login menyimpan token GitHub di penyimpanan auth profile dan menukarkannya dengan
  token API Copilot saat OpenClaw berjalan.
