---
read_when:
    - Menyiapkan mesin baru
    - Anda ingin “terbaru + terbaik” tanpa merusak penyiapan pribadi Anda
summary: Penyiapan lanjutan dan alur kerja pengembangan untuk OpenClaw
title: Setup
x-i18n:
    generated_at: "2026-04-05T14:06:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: be4e280dde7f3a224345ca557ef2fb35a9c9db8520454ff63794ac6f8d4e71e7
    source_path: start/setup.md
    workflow: 15
---

# Setup

<Note>
Jika Anda menyiapkan untuk pertama kali, mulailah dengan [Getting Started](/start/getting-started).
Untuk detail onboarding, lihat [Onboarding (CLI)](/start/wizard).
</Note>

## Ringkasnya

- **Kustomisasi berada di luar repo:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (config).
- **Alur kerja stabil:** instal aplikasi macOS; biarkan aplikasi itu menjalankan Gateway bawaan.
- **Alur kerja bleeding edge:** jalankan Gateway sendiri melalui `pnpm gateway:watch`, lalu biarkan aplikasi macOS terhubung dalam mode Local.

## Prasyarat (dari source)

- Node 24 direkomendasikan (Node 22 LTS, saat ini `22.14+`, masih didukung)
- `pnpm` lebih disukai (atau Bun jika Anda memang menggunakan [alur kerja Bun](/id/install/bun))
- Docker (opsional; hanya untuk penyiapan dalam container/e2e — lihat [Docker](/id/install/docker))

## Strategi kustomisasi (agar pembaruan tidak merugikan)

Jika Anda ingin “100% disesuaikan untuk saya” _dan_ pembaruan yang mudah, simpan kustomisasi Anda di:

- **Config:** `~/.openclaw/openclaw.json` (JSON/kurang lebih JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompt, memori; jadikan sebagai repo git privat)

Lakukan bootstrap sekali:

```bash
openclaw setup
```

Dari dalam repo ini, gunakan entri CLI lokal:

```bash
openclaw setup
```

Jika Anda belum memiliki instalasi global, jalankan melalui `pnpm openclaw setup` (atau `bun run openclaw setup` jika Anda menggunakan alur kerja Bun).

## Menjalankan Gateway dari repo ini

Setelah `pnpm build`, Anda dapat menjalankan CLI yang dipaketkan secara langsung:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Alur kerja stabil (aplikasi macOS terlebih dahulu)

1. Instal + luncurkan **OpenClaw.app** (bilah menu).
2. Selesaikan daftar periksa onboarding/izin (prompt TCC).
3. Pastikan Gateway **Local** dan sedang berjalan (aplikasi yang mengelolanya).
4. Tautkan permukaan (contoh: WhatsApp):

```bash
openclaw channels login
```

5. Pemeriksaan kewarasan:

```bash
openclaw health
```

Jika onboarding tidak tersedia di build Anda:

- Jalankan `openclaw setup`, lalu `openclaw channels login`, lalu mulai Gateway secara manual (`openclaw gateway`).

## Alur kerja bleeding edge (Gateway di terminal)

Tujuan: bekerja pada Gateway TypeScript, mendapatkan hot reload, dan tetap menjaga UI aplikasi macOS tetap terhubung.

### 0) (Opsional) Jalankan juga aplikasi macOS dari source

Jika Anda juga ingin aplikasi macOS berada di bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Mulai Gateway dev

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` menjalankan gateway dalam mode watch dan me-reload pada perubahan source, config, dan metadata bundled-plugin yang relevan.

Jika Anda memang menggunakan alur kerja Bun, perintah yang setara adalah:

```bash
bun install
bun run gateway:watch
```

### 2) Arahkan aplikasi macOS ke Gateway Anda yang sedang berjalan

Di **OpenClaw.app**:

- Mode Koneksi: **Local**
  Aplikasi akan terhubung ke gateway yang sedang berjalan pada port yang dikonfigurasi.

### 3) Verifikasi

- Status Gateway di aplikasi seharusnya menampilkan **“Using existing gateway …”**
- Atau melalui CLI:

```bash
openclaw health
```

### Jebakan umum

- **Port salah:** Gateway WS default ke `ws://127.0.0.1:18789`; pastikan aplikasi + CLI menggunakan port yang sama.
- **Lokasi state:**
  - State channel/provider: `~/.openclaw/credentials/`
  - Profil autentikasi model: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesi: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Peta penyimpanan kredensial

Gunakan ini saat men-debug autentikasi atau memutuskan apa yang perlu dicadangkan:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env atau `channels.telegram.tokenFile` (hanya file biasa; symlink ditolak)
- **Discord bot token**: config/env atau SecretRef (provider env/file/exec)
- **Slack token**: config/env (`channels.slack.*`)
- **Daftar izin pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (akun default)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (akun non-default)
- **Profil autentikasi model**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload rahasia berbasis file (opsional)**: `~/.openclaw/secrets.json`
- **Impor OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Detail lebih lanjut: [Security](/id/gateway/security#credential-storage-map).

## Memperbarui (tanpa merusak penyiapan Anda)

- Pertahankan `~/.openclaw/workspace` dan `~/.openclaw/` sebagai “barang Anda”; jangan simpan prompt/config pribadi ke dalam repo `openclaw`.
- Memperbarui source: `git pull` + langkah instal package manager pilihan Anda (`pnpm install` secara default; `bun install` untuk alur kerja Bun) + terus gunakan perintah `gateway:watch` yang sesuai.

## Linux (layanan pengguna systemd)

Instalasi Linux menggunakan layanan **pengguna** systemd. Secara default, systemd menghentikan
layanan pengguna saat logout/idle, yang mematikan Gateway. Onboarding mencoba mengaktifkan
lingering untuk Anda (mungkin meminta sudo). Jika masih nonaktif, jalankan:

```bash
sudo loginctl enable-linger $USER
```

Untuk server yang selalu aktif atau multi-pengguna, pertimbangkan layanan **system** alih-alih
layanan pengguna (tidak perlu lingering). Lihat [Panduan operasional Gateway](/id/gateway) untuk catatan systemd.

## Dokumen terkait

- [Panduan operasional Gateway](/id/gateway) (flag, supervisi, port)
- [Konfigurasi Gateway](/id/gateway/configuration) (skema config + contoh)
- [Discord](/id/channels/discord) dan [Telegram](/id/channels/telegram) (tag balasan + setelan replyToMode)
- [Setup asisten OpenClaw](/start/openclaw)
- [Aplikasi macOS](/id/platforms/macos) (siklus hidup gateway)
