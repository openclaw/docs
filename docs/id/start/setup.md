---
read_when:
    - Menyiapkan mesin baru
    - Anda menginginkan "terbaru + terbaik" tanpa merusak pengaturan pribadi Anda
summary: Penyiapan lanjutan dan alur kerja pengembangan untuk OpenClaw
title: Penyiapan
x-i18n:
    generated_at: "2026-05-06T09:28:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
Jika Anda menyiapkan untuk pertama kali, mulai dengan [Memulai](/id/start/getting-started).
Untuk detail onboarding, lihat [Onboarding (CLI)](/id/start/wizard).
</Note>

## Ringkasan Singkat

Pilih alur kerja penyiapan berdasarkan seberapa sering Anda menginginkan pembaruan dan apakah Anda ingin menjalankan Gateway sendiri:

- **Penyesuaian berada di luar repositori:** simpan konfigurasi dan ruang kerja Anda di `~/.openclaw/openclaw.json` dan `~/.openclaw/workspace/` agar pembaruan repositori tidak menyentuhnya.
- **Alur kerja stabil (direkomendasikan untuk sebagian besar pengguna):** instal aplikasi macOS dan biarkan aplikasi tersebut menjalankan Gateway bawaan.
- **Alur kerja eksperimental terbaru (dev):** jalankan Gateway sendiri melalui `pnpm gateway:watch`, lalu biarkan aplikasi macOS terhubung dalam mode Local.

## Prasyarat (dari sumber)

- Node 24 direkomendasikan (Node 22 LTS, saat ini `22.14+`, masih didukung)
- `pnpm` diperlukan untuk checkout sumber. OpenClaw memuat Plugin bawaan dari paket workspace pnpm
  `extensions/*` dalam mode dev, sehingga `npm install` di root
  tidak menyiapkan seluruh pohon sumber.
- Docker (opsional; hanya untuk penyiapan/e2e berbasis kontainer - lihat [Docker](/id/install/docker))

## Strategi penyesuaian (agar pembaruan tidak mengganggu)

Jika Anda menginginkan "100% disesuaikan untuk saya" _dan_ pembaruan yang mudah, simpan kustomisasi Anda di:

- **Konfigurasi:** `~/.openclaw/openclaw.json` (mirip JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, memories; jadikan repositori git privat)

Bootstrap sekali:

```bash
openclaw setup
```

Dari dalam repositori ini, gunakan entri CLI lokal:

```bash
openclaw setup
```

Jika Anda belum memiliki instalasi global, jalankan melalui `pnpm openclaw setup`.

## Jalankan Gateway dari repositori ini

Setelah `pnpm build`, Anda dapat menjalankan CLI terpaket secara langsung:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Alur kerja stabil (aplikasi macOS terlebih dahulu)

1. Instal + luncurkan **OpenClaw.app** (bilah menu).
2. Selesaikan daftar periksa onboarding/izin (prompt TCC).
3. Pastikan Gateway dalam mode **Local** dan berjalan (aplikasi mengelolanya).
4. Tautkan permukaan (contoh: WhatsApp):

```bash
openclaw channels login
```

5. Pemeriksaan kewajaran:

```bash
openclaw health
```

Jika onboarding tidak tersedia di build Anda:

- Jalankan `openclaw setup`, lalu `openclaw channels login`, lalu mulai Gateway secara manual (`openclaw gateway`).

## Alur kerja eksperimental terbaru (Gateway di terminal)

Tujuan: mengerjakan Gateway TypeScript, mendapatkan hot reload, menjaga UI aplikasi macOS tetap terhubung.

### 0) (Opsional) Jalankan aplikasi macOS dari sumber juga

Jika Anda juga menginginkan aplikasi macOS pada versi eksperimental terbaru:

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
bernama dan otomatis melampirkan dari terminal interaktif. Shell non-interaktif tetap
terlepas dan mencetak `tmux attach -t openclaw-gateway-watch-main`; gunakan
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` agar run interaktif tetap
terlepas, atau `pnpm gateway:watch:raw` untuk mode watch foreground. Watcher
memuat ulang pada perubahan metadata sumber, konfigurasi, dan Plugin bawaan yang relevan. Jika
Gateway yang dipantau keluar saat startup, `gateway:watch` menjalankan
`openclaw doctor --fix --non-interactive` sekali dan mencoba lagi; setel
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` untuk menonaktifkan pass perbaikan khusus dev tersebut.
`pnpm openclaw setup` adalah langkah inisialisasi konfigurasi/ruang kerja lokal satu kali untuk checkout baru.
`pnpm gateway:watch` tidak membangun ulang `dist/control-ui`, jadi jalankan ulang `pnpm ui:build` setelah perubahan `ui/` atau gunakan `pnpm ui:dev` saat mengembangkan Control UI.

### 2) Arahkan aplikasi macOS ke Gateway yang sedang berjalan

Di **OpenClaw.app**:

- Mode Koneksi: **Local**
  Aplikasi akan terhubung ke gateway yang berjalan pada port yang dikonfigurasi.

### 3) Verifikasi

- Status Gateway dalam aplikasi seharusnya menampilkan **"Menggunakan gateway yang ada …"**
- Atau melalui CLI:

```bash
openclaw health
```

### Hal yang sering menjebak

- **Port salah:** WS Gateway default ke `ws://127.0.0.1:18789`; pastikan aplikasi + CLI berada pada port yang sama.
- **Lokasi state berada:**
  - State channel/provider: `~/.openclaw/credentials/`
  - Profil auth model: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesi: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Peta penyimpanan kredensial

Gunakan ini saat men-debug auth atau memutuskan apa yang perlu dicadangkan:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: config/env atau `channels.telegram.tokenFile` (hanya file biasa; symlink ditolak)
- **Token bot Discord**: config/env atau SecretRef (penyedia env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Allowlist pemasangan**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (akun default)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (akun non-default)
- **Profil auth model**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload rahasia berbasis file (opsional)**: `~/.openclaw/secrets.json`
- **Impor OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Detail lebih lanjut: [Keamanan](/id/gateway/security#credential-storage-map).

## Memperbarui (tanpa merusak penyiapan Anda)

- Perlakukan `~/.openclaw/workspace` dan `~/.openclaw/` sebagai "milik Anda"; jangan masukkan prompt/konfigurasi pribadi ke repositori `openclaw`.
- Memperbarui sumber: `git pull` + `pnpm install` + tetap gunakan `pnpm gateway:watch`.

## Linux (layanan pengguna systemd)

Instalasi Linux menggunakan layanan **pengguna** systemd. Secara default, systemd menghentikan
layanan pengguna saat logout/idle, yang mematikan Gateway. Onboarding mencoba mengaktifkan
lingering untuk Anda (mungkin meminta sudo). Jika masih nonaktif, jalankan:

```bash
sudo loginctl enable-linger $USER
```

Untuk server yang selalu aktif atau multi-pengguna, pertimbangkan layanan **sistem** alih-alih
layanan pengguna (tidak memerlukan lingering). Lihat [Runbook Gateway](/id/gateway) untuk catatan systemd.

## Dokumen terkait

- [Runbook Gateway](/id/gateway) (flag, supervisi, port)
- [Konfigurasi Gateway](/id/gateway/configuration) (skema konfigurasi + contoh)
- [Discord](/id/channels/discord) dan [Telegram](/id/channels/telegram) (tag balasan + pengaturan replyToMode)
- [Penyiapan asisten OpenClaw](/id/start/openclaw)
- [Aplikasi macOS](/id/platforms/macos) (siklus hidup gateway)
