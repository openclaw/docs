---
read_when:
    - Menyiapkan mesin baru
    - Anda menginginkan “yang terbaru dan terbaik” tanpa merusak pengaturan pribadi Anda
summary: Penyiapan lanjutan dan alur kerja pengembangan untuk OpenClaw
title: Penyiapan
x-i18n:
    generated_at: "2026-04-30T10:12:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
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
- **Alur kerja bleeding edge (dev):** jalankan Gateway sendiri melalui `pnpm gateway:watch`, lalu biarkan aplikasi macOS tersambung dalam mode Lokal.

## Prasyarat (dari sumber)

- Node 24 direkomendasikan (Node 22 LTS, saat ini `22.14+`, masih didukung)
- `pnpm` lebih disarankan (atau Bun jika Anda sengaja menggunakan [alur kerja Bun](/id/install/bun))
- Docker (opsional; hanya untuk penyiapan/e2e berbasis kontainer — lihat [Docker](/id/install/docker))

## Strategi penyesuaian (agar pembaruan tidak mengganggu)

Jika Anda menginginkan “100% disesuaikan untuk saya” _dan_ pembaruan yang mudah, simpan kustomisasi Anda di:

- **Konfigurasi:** `~/.openclaw/openclaw.json` (mirip JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompt, memori; jadikan repo git pribadi)

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

Setelah `pnpm build`, Anda dapat menjalankan CLI yang dipaketkan secara langsung:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Alur kerja stabil (aplikasi macOS terlebih dahulu)

1. Instal + luncurkan **OpenClaw.app** (bilah menu).
2. Selesaikan daftar periksa onboarding/izin (prompt TCC).
3. Pastikan Gateway dalam mode **Lokal** dan berjalan (dikelola oleh aplikasi).
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

Tujuan: mengerjakan Gateway TypeScript, mendapatkan hot reload, menjaga UI aplikasi macOS tetap tersambung.

### 0) (Opsional) Jalankan aplikasi macOS dari sumber juga

Jika Anda juga menginginkan aplikasi macOS pada bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Mulai Gateway dev

```bash
pnpm install
# Hanya saat pertama kali dijalankan (atau setelah mereset konfigurasi/workspace OpenClaw lokal)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` memulai atau memulai ulang proses watch Gateway dalam sesi tmux
bernama dan otomatis melampirkannya dari terminal interaktif. Shell noninteraktif tetap
terlepas dan mencetak `tmux attach -t openclaw-gateway-watch-main`; gunakan
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` agar proses interaktif tetap
terlepas, atau `pnpm gateway:watch:raw` untuk mode watch foreground. Watcher
memuat ulang pada perubahan sumber, konfigurasi, dan metadata plugin bawaan yang relevan.
`pnpm openclaw setup` adalah langkah inisialisasi konfigurasi/workspace lokal satu kali untuk checkout baru.
`pnpm gateway:watch` tidak membangun ulang `dist/control-ui`, jadi jalankan ulang `pnpm ui:build` setelah perubahan `ui/` atau gunakan `pnpm ui:dev` saat mengembangkan UI Kontrol.

Jika Anda sengaja menggunakan alur kerja Bun, perintah yang setara adalah:

```bash
bun install
# Hanya saat pertama kali dijalankan (atau setelah mereset konfigurasi/workspace OpenClaw lokal)
bun run openclaw setup
bun run gateway:watch
```

### 2) Arahkan aplikasi macOS ke Gateway yang sedang berjalan

Di **OpenClaw.app**:

- Mode Koneksi: **Lokal**
  Aplikasi akan tersambung ke gateway yang sedang berjalan pada port yang dikonfigurasi.

### 3) Verifikasi

- Status Gateway dalam aplikasi seharusnya menampilkan **“Menggunakan gateway yang sudah ada …”**
- Atau melalui CLI:

```bash
openclaw health
```

### Kesalahan umum

- **Port salah:** Gateway WS secara default menggunakan `ws://127.0.0.1:18789`; pastikan aplikasi + CLI memakai port yang sama.
- **Tempat state disimpan:**
  - State channel/provider: `~/.openclaw/credentials/`
  - Profil auth model: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesi: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Peta penyimpanan kredensial

Gunakan ini saat men-debug auth atau menentukan apa yang perlu dicadangkan:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: config/env atau `channels.telegram.tokenFile` (hanya file biasa; symlink ditolak)
- **Token bot Discord**: config/env atau SecretRef (provider env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Allowlist pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (akun default)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (akun non-default)
- **Profil auth model**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload rahasia berbasis file (opsional)**: `~/.openclaw/secrets.json`
- **Impor OAuth lama**: `~/.openclaw/credentials/oauth.json`
  Detail lebih lanjut: [Keamanan](/id/gateway/security#credential-storage-map).

## Memperbarui (tanpa merusak penyiapan Anda)

- Perlakukan `~/.openclaw/workspace` dan `~/.openclaw/` sebagai “milik Anda”; jangan masukkan prompt/konfigurasi pribadi ke repo `openclaw`.
- Memperbarui sumber: `git pull` + langkah instal package manager pilihan Anda (`pnpm install` secara default; `bun install` untuk alur kerja Bun) + tetap gunakan perintah `gateway:watch` yang sesuai.

## Linux (layanan user systemd)

Instalasi Linux menggunakan layanan **user** systemd. Secara default, systemd menghentikan layanan
user saat logout/idle, yang mematikan Gateway. Onboarding mencoba mengaktifkan
lingering untuk Anda (mungkin meminta sudo). Jika masih nonaktif, jalankan:

```bash
sudo loginctl enable-linger $USER
```

Untuk server always-on atau multi-user, pertimbangkan layanan **system** alih-alih
layanan user (tidak memerlukan lingering). Lihat [Runbook Gateway](/id/gateway) untuk catatan systemd.

## Dokumen terkait

- [Runbook Gateway](/id/gateway) (flag, supervisi, port)
- [Konfigurasi Gateway](/id/gateway/configuration) (skema konfigurasi + contoh)
- [Discord](/id/channels/discord) dan [Telegram](/id/channels/telegram) (tag balasan + pengaturan replyToMode)
- [Penyiapan asisten OpenClaw](/id/start/openclaw)
- [Aplikasi macOS](/id/platforms/macos) (siklus hidup gateway)
