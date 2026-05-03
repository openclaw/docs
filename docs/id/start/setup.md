---
read_when:
    - Menyiapkan mesin baru
    - Anda menginginkan “yang terbaru + terbaik” tanpa merusak konfigurasi pribadi Anda
summary: Pengaturan lanjutan dan alur kerja pengembangan untuk OpenClaw
title: Penyiapan
x-i18n:
    generated_at: "2026-05-03T21:37:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
Jika Anda menyiapkan untuk pertama kali, mulai dengan [Memulai](/id/start/getting-started).
Untuk detail onboarding, lihat [Onboarding (CLI)](/id/start/wizard).
</Note>

## TL;DR

Pilih alur kerja penyiapan berdasarkan seberapa sering Anda menginginkan pembaruan dan apakah Anda ingin menjalankan Gateway sendiri:

- **Penyesuaian berada di luar repo:** simpan konfigurasi dan workspace Anda di `~/.openclaw/openclaw.json` dan `~/.openclaw/workspace/` agar pembaruan repo tidak menyentuhnya.
- **Alur kerja stabil (direkomendasikan untuk sebagian besar pengguna):** instal aplikasi macOS dan biarkan aplikasi menjalankan Gateway bawaan.
- **Alur kerja bleeding edge (dev):** jalankan Gateway sendiri melalui `pnpm gateway:watch`, lalu biarkan aplikasi macOS terhubung dalam mode Local.

## Prasyarat (dari source)

- Node 24 direkomendasikan (Node 22 LTS, saat ini `22.14+`, masih didukung)
- `pnpm` diperlukan untuk checkout source. OpenClaw memuat Plugin bawaan dari paket workspace pnpm `extensions/*` dalam mode dev, jadi `npm install` di root tidak menyiapkan seluruh source tree.
- Docker (opsional; hanya untuk penyiapan/e2e berbasis kontainer — lihat [Docker](/id/install/docker))

## Strategi penyesuaian (agar pembaruan tidak merusak)

Jika Anda ingin “100% disesuaikan untuk saya” _dan_ pembaruan yang mudah, simpan kustomisasi Anda di:

- **Konfigurasi:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, memories; jadikan repo git privat)

Bootstrap sekali:

```bash
openclaw setup
```

Dari dalam repo ini, gunakan entri CLI lokal:

```bash
openclaw setup
```

Jika Anda belum memiliki instalasi global, jalankan melalui `pnpm openclaw setup`.

## Jalankan Gateway dari repo ini

Setelah `pnpm build`, Anda dapat menjalankan CLI terpaket secara langsung:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Alur kerja stabil (aplikasi macOS terlebih dahulu)

1. Instal + luncurkan **OpenClaw.app** (bilah menu).
2. Selesaikan checklist onboarding/izin (prompt TCC).
3. Pastikan Gateway adalah **Local** dan berjalan (aplikasi mengelolanya).
4. Tautkan surface (contoh: WhatsApp):

```bash
openclaw channels login
```

5. Pemeriksaan kewajaran:

```bash
openclaw health
```

Jika onboarding tidak tersedia di build Anda:

- Jalankan `openclaw setup`, lalu `openclaw channels login`, lalu mulai Gateway secara manual (`openclaw gateway`).

## Alur kerja bleeding edge (Gateway di terminal)

Tujuan: mengerjakan Gateway TypeScript, mendapatkan hot reload, dan menjaga UI aplikasi macOS tetap terhubung.

### 0) (Opsional) Jalankan aplikasi macOS dari source juga

Jika Anda juga ingin aplikasi macOS berada di bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Mulai Gateway dev

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` memulai atau memulai ulang proses watch Gateway dalam sesi tmux bernama dan otomatis terhubung dari terminal interaktif. Shell non-interaktif tetap terlepas dan mencetak `tmux attach -t openclaw-gateway-watch-main`; gunakan `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` agar run interaktif tetap terlepas, atau `pnpm gateway:watch:raw` untuk mode watch foreground. Watcher memuat ulang saat ada perubahan source, konfigurasi, dan metadata Plugin bawaan yang relevan. Jika Gateway yang diawasi keluar saat startup, `gateway:watch` menjalankan `openclaw doctor --fix --non-interactive` sekali lalu mencoba lagi; setel `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` untuk menonaktifkan pass perbaikan khusus dev tersebut.
`pnpm openclaw setup` adalah langkah inisialisasi konfigurasi/workspace lokal satu kali untuk checkout baru.
`pnpm gateway:watch` tidak membangun ulang `dist/control-ui`, jadi jalankan ulang `pnpm ui:build` setelah perubahan `ui/` atau gunakan `pnpm ui:dev` saat mengembangkan Control UI.

### 2) Arahkan aplikasi macOS ke Gateway yang sedang berjalan

Di **OpenClaw.app**:

- Mode Koneksi: **Local**
  Aplikasi akan terhubung ke gateway yang sedang berjalan pada port yang dikonfigurasi.

### 3) Verifikasi

- Status Gateway dalam aplikasi seharusnya menampilkan **“Menggunakan gateway yang sudah ada …”**
- Atau melalui CLI:

```bash
openclaw health
```

### Hal umum yang sering menjebak

- **Port salah:** Gateway WS default ke `ws://127.0.0.1:18789`; pastikan aplikasi + CLI memakai port yang sama.
- **Lokasi state:**
  - State channel/provider: `~/.openclaw/credentials/`
  - Profil auth model: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesi: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Peta penyimpanan kredensial

Gunakan ini saat men-debug auth atau memutuskan apa yang perlu dicadangkan:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: konfigurasi/env atau `channels.telegram.tokenFile` (hanya file reguler; symlink ditolak)
- **Token bot Discord**: konfigurasi/env atau SecretRef (provider env/file/exec)
- **Token Slack**: konfigurasi/env (`channels.slack.*`)
- **Allowlist pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (akun default)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (akun non-default)
- **Profil auth model**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload secret berbasis file (opsional)**: `~/.openclaw/secrets.json`
- **Impor OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Detail lebih lanjut: [Keamanan](/id/gateway/security#credential-storage-map).

## Memperbarui (tanpa merusak penyiapan Anda)

- Perlakukan `~/.openclaw/workspace` dan `~/.openclaw/` sebagai “milik Anda”; jangan letakkan prompt/konfigurasi pribadi ke dalam repo `openclaw`.
- Memperbarui source: `git pull` + `pnpm install` + tetap gunakan `pnpm gateway:watch`.

## Linux (layanan pengguna systemd)

Instalasi Linux menggunakan layanan **pengguna** systemd. Secara default, systemd menghentikan layanan pengguna saat logout/idle, yang mematikan Gateway. Onboarding mencoba mengaktifkan lingering untuk Anda (mungkin meminta sudo). Jika masih nonaktif, jalankan:

```bash
sudo loginctl enable-linger $USER
```

Untuk server yang selalu aktif atau multi-pengguna, pertimbangkan layanan **sistem** alih-alih layanan pengguna (tidak perlu lingering). Lihat [Runbook Gateway](/id/gateway) untuk catatan systemd.

## Dokumentasi terkait

- [Runbook Gateway](/id/gateway) (flag, supervisi, port)
- [Konfigurasi Gateway](/id/gateway/configuration) (skema konfigurasi + contoh)
- [Discord](/id/channels/discord) dan [Telegram](/id/channels/telegram) (tag balasan + pengaturan replyToMode)
- [Penyiapan asisten OpenClaw](/id/start/openclaw)
- [Aplikasi macOS](/id/platforms/macos) (siklus hidup gateway)
