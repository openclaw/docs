---
read_when:
    - Menyiapkan mesin baru
    - Anda menginginkan "terbaru + terbaik" tanpa merusak pengaturan pribadi Anda
summary: Alur kerja pengaturan lanjutan dan pengembangan untuk OpenClaw
title: Penyiapan
x-i18n:
    generated_at: "2026-06-27T18:14:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
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
- **Alur kerja bleeding edge (dev):** jalankan Gateway sendiri melalui `pnpm gateway:watch`, lalu biarkan aplikasi macOS terhubung dalam mode Lokal.

## Prasyarat (dari sumber)

- Node 24 direkomendasikan (Node 22 LTS, saat ini `22.19+`, masih didukung)
- `pnpm` diperlukan untuk checkout sumber. OpenClaw memuat Plugin bawaan dari paket workspace pnpm
  `extensions/*` dalam mode dev, sehingga `npm install` di root
  tidak menyiapkan seluruh pohon sumber.
- Docker (opsional; hanya untuk penyiapan/e2e berbasis kontainer - lihat [Docker](/id/install/docker))

## Strategi penyesuaian (agar pembaruan tidak merusak)

Jika Anda menginginkan "100% disesuaikan untuk saya" _dan_ pembaruan yang mudah, simpan kustomisasi Anda di:

- **Konfigurasi:** `~/.openclaw/openclaw.json` (mirip JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompt, memori; jadikan repo git privat)

Bootstrap satu kali:

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

## Alur kerja stabil (aplikasi macOS lebih dulu)

1. Instal + luncurkan **OpenClaw.app** (menu bar).
2. Selesaikan checklist onboarding/izin (prompt TCC).
3. Pastikan Gateway **Lokal** dan berjalan (aplikasi mengelolanya).
4. Tautkan surface (contoh: WhatsApp):

```bash
openclaw channels login
```

5. Pemeriksaan kewajaran:

```bash
openclaw health
```

Jika onboarding tidak tersedia dalam build Anda:

- Jalankan `openclaw setup`, lalu `openclaw channels login`, lalu mulai Gateway secara manual (`openclaw gateway`).

## Alur kerja bleeding edge (Gateway di terminal)

Tujuan: bekerja pada Gateway TypeScript, mendapatkan hot reload, dan menjaga UI aplikasi macOS tetap terhubung.

### 0) (Opsional) Jalankan juga aplikasi macOS dari sumber

Jika Anda juga menginginkan aplikasi macOS pada bleeding edge:

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

`gateway:watch` memulai atau memulai ulang proses watch Gateway dalam sesi tmux
bernama dan otomatis terhubung dari terminal interaktif. Shell non-interaktif tetap
terlepas dan mencetak `tmux attach -t openclaw-gateway-watch-main`; gunakan
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` agar proses interaktif tetap
terlepas, atau `pnpm gateway:watch:raw` untuk mode watch foreground. Watcher
memuat ulang pada perubahan sumber, konfigurasi, dan metadata Plugin bawaan yang relevan. Jika
Gateway yang diawasi keluar saat startup, `gateway:watch` menjalankan
`openclaw doctor --fix --non-interactive` satu kali dan mencoba ulang; tetapkan
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` untuk menonaktifkan langkah perbaikan khusus dev tersebut.
`pnpm openclaw setup` adalah langkah inisialisasi konfigurasi/workspace lokal satu kali untuk checkout baru.
`pnpm gateway:watch` tidak membangun ulang `dist/control-ui`, jadi jalankan ulang `pnpm ui:build` setelah perubahan `ui/` atau gunakan `pnpm ui:dev` saat mengembangkan UI Kontrol.

### 2) Arahkan aplikasi macOS ke Gateway yang sedang berjalan

Di **OpenClaw.app**:

- Mode Koneksi: **Lokal**
  Aplikasi akan terhubung ke gateway yang sedang berjalan pada port yang dikonfigurasi.

### 3) Verifikasi

- Status Gateway di dalam aplikasi seharusnya menampilkan **"Menggunakan gateway yang ada …"**
- Atau melalui CLI:

```bash
openclaw health
```

### Kesalahan umum

- **Port salah:** WS Gateway default ke `ws://127.0.0.1:18789`; pastikan aplikasi + CLI menggunakan port yang sama.
- **Lokasi state:**
  - State channel/provider: `~/.openclaw/credentials/`
  - Profil auth model: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesi: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Peta penyimpanan kredensial

Gunakan ini saat men-debug auth atau memutuskan apa yang perlu dicadangkan:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: konfigurasi/env atau `channels.telegram.tokenFile` (hanya file biasa; symlink ditolak)
- **Token bot Discord**: konfigurasi/env atau SecretRef (provider env/file/exec)
- **Token Slack**: konfigurasi/env (`channels.slack.*`)
- **Allowlist pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (akun default)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (akun non-default)
- **Profil auth model**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload rahasia berbasis file (opsional)**: `~/.openclaw/secrets.json`
- **Impor OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Detail lebih lanjut: [Keamanan](/id/gateway/security#credential-storage-map).

## Memperbarui (tanpa merusak penyiapan Anda)

- Perlakukan `~/.openclaw/workspace` dan `~/.openclaw/` sebagai "milik Anda"; jangan masukkan prompt/konfigurasi pribadi ke repo `openclaw`.
- Memperbarui sumber: `git pull` + `pnpm install` + terus gunakan `pnpm gateway:watch`.

## Linux (layanan pengguna systemd)

Instalasi Linux menggunakan layanan **pengguna** systemd. Secara default, systemd menghentikan layanan
pengguna saat logout/idle, yang mematikan Gateway. Onboarding mencoba mengaktifkan
lingering untuk Anda (mungkin meminta sudo). Jika masih nonaktif, jalankan:

```bash
sudo loginctl enable-linger $USER
```

Untuk server always-on atau multi-pengguna, pertimbangkan layanan **sistem** alih-alih
layanan pengguna (tidak perlu lingering). Lihat [Runbook Gateway](/id/gateway) untuk catatan systemd.

## Dokumen terkait

- [Runbook Gateway](/id/gateway) (flag, supervisi, port)
- [Konfigurasi Gateway](/id/gateway/configuration) (skema konfigurasi + contoh)
- [Discord](/id/channels/discord) dan [Telegram](/id/channels/telegram) (tag balasan + pengaturan replyToMode)
- [Penyiapan asisten OpenClaw](/id/start/openclaw)
- [Aplikasi macOS](/id/platforms/macos) (siklus hidup gateway)
