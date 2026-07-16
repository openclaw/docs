---
read_when:
    - Menyiapkan mesin baru
    - Anda menginginkan "yang terbaru + terbaik" tanpa merusak konfigurasi pribadi Anda
summary: Alur kerja penyiapan lanjutan dan pengembangan untuk OpenClaw
title: Penyiapan
x-i18n:
    generated_at: "2026-07-16T18:36:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
Jika Anda melakukan penyiapan untuk pertama kalinya, mulailah dengan [Memulai](/id/start/getting-started).
Untuk detail orientasi awal, lihat [Orientasi Awal (CLI)](/id/start/wizard).
</Note>

## Ringkasan

Pilih alur kerja penyiapan berdasarkan seberapa sering Anda menginginkan pembaruan dan apakah Anda ingin menjalankan Gateway sendiri:

- **Penyesuaian berada di luar repo:** simpan konfigurasi dan ruang kerja Anda di `~/.openclaw/openclaw.json` dan `~/.openclaw/workspace/` agar pembaruan repo tidak menyentuhnya.
- **Alur kerja stabil (direkomendasikan untuk sebagian besar pengguna):** instal aplikasi macOS dan biarkan aplikasi tersebut menjalankan Gateway yang disertakan.
- **Alur kerja paling mutakhir (pengembangan):** jalankan Gateway sendiri melalui `pnpm gateway:watch`, lalu biarkan aplikasi macOS terhubung dalam mode Local.

## Prasyarat (dari sumber)

- Node 24.15+ direkomendasikan (Node 22 LTS, saat ini `22.22.3+`, masih didukung)
- `pnpm` diperlukan untuk checkout sumber. OpenClaw memuat plugin yang disertakan dari paket ruang kerja pnpm
  `extensions/*` dalam mode pengembangan, sehingga `npm install` di root
  tidak menyiapkan seluruh pohon sumber.
- Docker (opsional; hanya untuk penyiapan dalam kontainer/e2e - lihat [Docker](/id/install/docker))

## Strategi penyesuaian (agar pembaruan tidak merusak)

Jika Anda menginginkan "100% disesuaikan untuk saya" _dan_ pembaruan yang mudah, simpan penyesuaian Anda di:

- **Konfigurasi:** `~/.openclaw/openclaw.json` (mirip JSON/JSON5)
- **Ruang kerja:** `~/.openclaw/workspace` (Skills, prompt, memori; jadikan repo git privat)

Lakukan bootstrap folder konfigurasi/ruang kerja satu kali, tanpa menjalankan seluruh wizard orientasi awal:

```bash
openclaw setup --baseline
```

Belum ada instalasi global? Jalankan dari repo ini sebagai gantinya:

```bash
pnpm openclaw setup --baseline
```

(`openclaw setup` tanpa `--baseline` merupakan alias untuk `openclaw onboard` dan menjalankan seluruh wizard interaktif.)

## Menjalankan Gateway dari repo ini

Setelah `pnpm build`, Anda dapat menjalankan CLI yang telah dikemas secara langsung:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Alur kerja stabil (aplikasi macOS terlebih dahulu)

1. Instal + luncurkan **OpenClaw.app** (bilah menu).
2. Selesaikan daftar periksa orientasi awal/izin (prompt TCC).
3. Pastikan Gateway berada dalam mode **Local** dan berjalan (aplikasi yang mengelolanya).
4. Tautkan kanal (contoh: WhatsApp):

```bash
openclaw channels login
```

5. Pemeriksaan singkat:

```bash
openclaw health
```

Jika orientasi awal tidak tersedia dalam build Anda:

- Jalankan `openclaw setup`, lalu `openclaw channels login`, kemudian mulai Gateway secara manual (`openclaw gateway`).

## Alur kerja paling mutakhir (Gateway di terminal)

Tujuan: mengembangkan Gateway TypeScript, mendapatkan pemuatan ulang langsung, dan mempertahankan UI aplikasi macOS tetap terhubung.

### 0) (Opsional) Jalankan juga aplikasi macOS dari sumber

Jika Anda juga menginginkan aplikasi macOS versi paling mutakhir:

```bash
./scripts/restart-mac.sh
```

### 1) Mulai Gateway pengembangan

```bash
pnpm install
# Hanya saat pertama kali dijalankan (atau setelah mereset konfigurasi/ruang kerja lokal OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` memulai atau memulai ulang proses pemantauan Gateway dalam sesi tmux
bernama (`openclaw-gateway-watch-main`) dan terhubung otomatis dari terminal
interaktif. Shell noninteraktif tetap tidak terhubung dan mencetak
`tmux attach -t openclaw-gateway-watch-main`; gunakan
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` agar proses interaktif tetap
tidak terhubung, atau `pnpm gateway:watch:raw` untuk mode pemantauan latar depan. Pemantau
menghentikan layanan Gateway terinstal milik profil aktif sebelum mengambil alih
port yang dikonfigurasi/default, sehingga supervisor layanan tidak menggantikan
proses sumber. Layanan tetap terinstal; jalankan `pnpm openclaw gateway start`
setelah selesai melakukan pemantauan. Panel tmux tetap tersedia setelah kegagalan startup
sehingga terminal atau agen lain dapat terhubung atau mengambil lognya. Pemantau
memuat ulang saat terjadi perubahan pada sumber, konfigurasi, dan metadata plugin yang disertakan yang relevan. Jika
Gateway yang dipantau keluar selama startup, `gateway:watch` menjalankan
`openclaw doctor --fix --non-interactive` satu kali dan mencoba kembali; atur
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` untuk menonaktifkan proses perbaikan khusus pengembangan tersebut.
`pnpm gateway:watch` tidak membangun ulang `dist/control-ui`, jadi jalankan kembali `pnpm ui:build` setelah perubahan `ui/` atau gunakan `pnpm ui:dev` saat mengembangkan UI Kontrol.

### 2) Arahkan aplikasi macOS ke Gateway yang sedang berjalan

Di **OpenClaw.app**:

- Connection Mode: **Local**
  Aplikasi akan terhubung ke gateway yang berjalan pada port yang dikonfigurasi.

### 3) Verifikasi

- Status Gateway dalam aplikasi seharusnya menampilkan **"Using existing gateway …"**
- Atau melalui CLI:

```bash
openclaw health
```

### Kesalahan umum

- **Port salah:** WS Gateway secara default menggunakan `ws://127.0.0.1:18789`; gunakan port yang sama untuk aplikasi + CLI.
- **Lokasi penyimpanan status:**
  - Status kanal/penyedia: `~/.openclaw/credentials/`
  - Profil autentikasi model: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesi dan transkrip: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Artefak sesi lama/arsip: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Peta penyimpanan kredensial

Gunakan ini saat men-debug autentikasi atau menentukan apa yang perlu dicadangkan:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: konfigurasi/env atau `channels.telegram.tokenFile` (hanya berkas biasa; symlink ditolak)
- **Token bot Discord**: konfigurasi/env atau SecretRef (penyedia env/file/exec)
- **Token Slack**: konfigurasi/env (`channels.slack.*`)
- **Daftar yang diizinkan untuk pemasangan:**
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (akun default)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (akun non-default)
- **Profil autentikasi model**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload rahasia berbasis berkas (opsional)**: `~/.openclaw/secrets.json`
- **Impor OAuth lama**: `~/.openclaw/credentials/oauth.json`
  Detail selengkapnya: [Keamanan](/id/gateway/security#credential-storage-map).

## Memperbarui (tanpa merusak penyiapan Anda)

- Pertahankan `~/.openclaw/workspace` dan `~/.openclaw/` sebagai "milik Anda"; jangan masukkan prompt/konfigurasi pribadi ke dalam repo `openclaw`.
- Memperbarui sumber: `git pull` + `pnpm install` + tetap gunakan `pnpm gateway:watch`.

## Linux (layanan pengguna systemd)

Instalasi Linux menggunakan layanan **pengguna** systemd. Secara default, systemd menghentikan layanan
pengguna saat logout/tidak aktif, yang mematikan Gateway. Orientasi awal mencoba mengaktifkan
lingering untuk Anda (mungkin meminta sudo). Jika masih nonaktif, jalankan:

```bash
sudo loginctl enable-linger $USER
```

Untuk server yang selalu aktif atau multi-pengguna, pertimbangkan layanan **sistem** alih-alih
layanan pengguna (tidak memerlukan lingering). Lihat [panduan operasional Gateway](/id/gateway) untuk catatan systemd.

## Dokumentasi terkait

- [Panduan operasional Gateway](/id/gateway) (flag, pengawasan, port)
- [Konfigurasi Gateway](/id/gateway/configuration) (skema konfigurasi + contoh)
- [Discord](/id/channels/discord) dan [Telegram](/id/channels/telegram) (tag balasan + pengaturan replyToMode)
- [Penyiapan asisten OpenClaw](/id/start/openclaw)
- [Aplikasi macOS](/id/platforms/macos) (siklus hidup gateway)
