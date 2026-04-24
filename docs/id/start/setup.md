---
read_when:
    - Menyiapkan mesin baru
    - Anda menginginkan “terbaru + terbaik” tanpa merusak penyiapan pribadi Anda
summary: Penyiapan lanjutan dan alur kerja pengembangan untuk OpenClaw
title: Penyiapan
x-i18n:
    generated_at: "2026-04-24T09:28:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
Jika Anda menyiapkan untuk pertama kali, mulai dengan [Getting Started](/id/start/getting-started).
Untuk detail onboarding, lihat [Onboarding (CLI)](/id/start/wizard).
</Note>

## TL;DR

Pilih alur kerja penyiapan berdasarkan seberapa sering Anda ingin pembaruan dan apakah Anda ingin menjalankan Gateway sendiri:

- **Kustomisasi berada di luar repo:** simpan konfigurasi dan workspace Anda di `~/.openclaw/openclaw.json` dan `~/.openclaw/workspace/` agar pembaruan repo tidak menyentuhnya.
- **Alur kerja stabil (direkomendasikan untuk kebanyakan orang):** instal aplikasi macOS dan biarkan aplikasi itu menjalankan Gateway bawaan.
- **Alur kerja bleeding edge (dev):** jalankan Gateway sendiri melalui `pnpm gateway:watch`, lalu biarkan aplikasi macOS terhubung dalam mode Local.

## Prasyarat (dari source)

- Node 24 direkomendasikan (Node 22 LTS, saat ini `22.14+`, masih didukung)
- `pnpm` lebih disukai (atau Bun jika Anda memang sengaja menggunakan [alur kerja Bun](/id/install/bun))
- Docker (opsional; hanya untuk penyiapan/e2e dalam container — lihat [Docker](/id/install/docker))

## Strategi kustomisasi (agar pembaruan tidak merugikan)

Jika Anda menginginkan “100% disesuaikan untuk saya” _dan_ pembaruan yang mudah, simpan kustomisasi Anda di:

- **Konfigurasi:** `~/.openclaw/openclaw.json` (gaya JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompt, memori; jadikan repo git privat)

Bootstrap sekali:

```bash
openclaw setup
```

Dari dalam repo ini, gunakan entri CLI lokal:

```bash
openclaw setup
```

Jika Anda belum memiliki instalasi global, jalankan melalui `pnpm openclaw setup` (atau `bun run openclaw setup` jika Anda menggunakan alur kerja Bun).

## Jalankan Gateway dari repo ini

Setelah `pnpm build`, Anda dapat menjalankan CLI yang sudah dipaketkan secara langsung:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Alur kerja stabil (aplikasi macOS terlebih dahulu)

1. Instal + jalankan **OpenClaw.app** (menu bar).
2. Selesaikan daftar periksa onboarding/izin (prompt TCC).
3. Pastikan Gateway berada dalam mode **Local** dan berjalan (aplikasi yang mengelolanya).
4. Tautkan surface (contoh: WhatsApp):

```bash
openclaw channels login
```

5. Pemeriksaan cepat:

```bash
openclaw health
```

Jika onboarding tidak tersedia pada build Anda:

- Jalankan `openclaw setup`, lalu `openclaw channels login`, lalu mulai Gateway secara manual (`openclaw gateway`).

## Alur kerja bleeding edge (Gateway di terminal)

Tujuan: mengerjakan Gateway TypeScript, mendapatkan hot reload, dan tetap membuat UI aplikasi macOS terhubung.

### 0) (Opsional) Jalankan juga aplikasi macOS dari source

Jika Anda juga ingin aplikasi macOS berada di bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Mulai Gateway dev

```bash
pnpm install
# Hanya pada run pertama (atau setelah mereset konfigurasi/workspace OpenClaw lokal)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` menjalankan gateway dalam mode watch dan memuat ulang saat source,
konfigurasi, dan perubahan metadata Plugin bawaan yang relevan terjadi.
`pnpm openclaw setup` adalah langkah inisialisasi konfigurasi/workspace lokal satu kali untuk checkout baru.
`pnpm gateway:watch` tidak membangun ulang `dist/control-ui`, jadi jalankan ulang `pnpm ui:build` setelah perubahan `ui/` atau gunakan `pnpm ui:dev` saat mengembangkan Control UI.

Jika Anda memang sengaja menggunakan alur kerja Bun, perintah yang setara adalah:

```bash
bun install
# Hanya pada run pertama (atau setelah mereset konfigurasi/workspace OpenClaw lokal)
bun run openclaw setup
bun run gateway:watch
```

### 2) Arahkan aplikasi macOS ke Gateway yang sedang berjalan

Di **OpenClaw.app**:

- Mode Koneksi: **Local**
  Aplikasi akan terhubung ke gateway yang sedang berjalan pada port yang dikonfigurasi.

### 3) Verifikasi

- Status Gateway di aplikasi harus menampilkan **“Using existing gateway …”**
- Atau melalui CLI:

```bash
openclaw health
```

### Jebakan umum

- **Port salah:** WS Gateway default ke `ws://127.0.0.1:18789`; pastikan aplikasi + CLI menggunakan port yang sama.
- **Lokasi state:**
  - State channel/provider: `~/.openclaw/credentials/`
  - Profil auth model: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesi: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Peta penyimpanan kredensial

Gunakan ini saat men-debug auth atau memutuskan apa yang perlu dicadangkan:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: config/env atau `channels.telegram.tokenFile` (hanya file biasa; symlink ditolak)
- **Token bot Discord**: config/env atau SecretRef (provider env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Allowlist pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (akun default)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (akun non-default)
- **Profil auth model**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload secret berbasis file (opsional)**: `~/.openclaw/secrets.json`
- **Impor OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Detail selengkapnya: [Security](/id/gateway/security#credential-storage-map).

## Memperbarui (tanpa merusak penyiapan Anda)

- Simpan `~/.openclaw/workspace` dan `~/.openclaw/` sebagai “barang Anda”; jangan simpan prompt/konfigurasi pribadi ke dalam repo `openclaw`.
- Memperbarui source: `git pull` + langkah instalasi package manager pilihan Anda (`pnpm install` secara default; `bun install` untuk alur kerja Bun) + tetap gunakan perintah `gateway:watch` yang sesuai.

## Linux (layanan pengguna systemd)

Instalasi Linux menggunakan layanan **pengguna** systemd. Secara default, systemd menghentikan layanan pengguna
saat logout/idle, yang mematikan Gateway. Onboarding mencoba mengaktifkan
lingering untuk Anda (mungkin meminta sudo). Jika masih mati, jalankan:

```bash
sudo loginctl enable-linger $USER
```

Untuk server yang selalu aktif atau multi-pengguna, pertimbangkan layanan **system**
alih-alih layanan pengguna (tidak memerlukan lingering). Lihat [runbook Gateway](/id/gateway) untuk catatan systemd.

## Dokumentasi terkait

- [Runbook Gateway](/id/gateway) (flag, supervisi, port)
- [Konfigurasi Gateway](/id/gateway/configuration) (skema konfigurasi + contoh)
- [Discord](/id/channels/discord) dan [Telegram](/id/channels/telegram) (tag balasan + pengaturan replyToMode)
- [Penyiapan asisten OpenClaw](/id/start/openclaw)
- [Aplikasi macOS](/id/platforms/macos) (siklus hidup gateway)
