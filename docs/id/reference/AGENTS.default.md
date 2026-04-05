---
read_when:
    - Memulai sesi agen OpenClaw baru
    - Mengaktifkan atau mengaudit Skills default
summary: Instruksi agen OpenClaw default dan daftar Skills untuk pengaturan asisten pribadi
title: AGENTS.md Default
x-i18n:
    generated_at: "2026-04-05T14:04:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45990bc4e6fa2e3d80e76207e62ec312c64134bee3bc832a5cae32ca2eda3b61
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - Asisten Pribadi OpenClaw (default)

## Pertama kali dijalankan (direkomendasikan)

OpenClaw menggunakan direktori workspace khusus untuk agen. Default: `~/.openclaw/workspace` (dapat dikonfigurasi melalui `agents.defaults.workspace`).

1. Buat workspace (jika belum ada):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Salin templat workspace default ke dalam workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opsional: jika Anda ingin daftar Skills asisten pribadi, ganti AGENTS.md dengan file ini:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opsional: pilih workspace yang berbeda dengan menetapkan `agents.defaults.workspace` (mendukung `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Default keamanan

- Jangan membuang direktori atau rahasia ke dalam chat.
- Jangan menjalankan perintah destruktif kecuali diminta secara eksplisit.
- Jangan mengirim balasan parsial/streaming ke permukaan pesan eksternal (hanya balasan akhir).

## Awal sesi (wajib)

- Baca `SOUL.md`, `USER.md`, dan hari ini+kemarin di `memory/`.
- Baca `MEMORY.md` jika ada; hanya gunakan fallback ke `memory.md` huruf kecil jika `MEMORY.md` tidak ada.
- Lakukan sebelum merespons.

## Soul (wajib)

- `SOUL.md` mendefinisikan identitas, nada, dan batasan. Jaga agar tetap terbaru.
- Jika Anda mengubah `SOUL.md`, beri tahu pengguna.
- Anda adalah instance baru di setiap sesi; kesinambungan ada di file-file ini.

## Ruang bersama (direkomendasikan)

- Anda bukan suara pengguna; berhati-hatilah di chat grup atau saluran publik.
- Jangan membagikan data pribadi, informasi kontak, atau catatan internal.

## Sistem memori (direkomendasikan)

- Log harian: `memory/YYYY-MM-DD.md` (buat `memory/` jika diperlukan).
- Memori jangka panjang: `MEMORY.md` untuk fakta, preferensi, dan keputusan yang bertahan lama.
- `memory.md` huruf kecil hanya fallback lama; jangan sengaja menyimpan kedua file root.
- Saat memulai sesi, baca hari ini + kemarin + `MEMORY.md` jika ada, jika tidak `memory.md`.
- Tangkap: keputusan, preferensi, batasan, loop yang masih terbuka.
- Hindari rahasia kecuali diminta secara eksplisit.

## Tools & Skills

- Tools ada di dalam Skills; ikuti `SKILL.md` masing-masing skill saat Anda membutuhkannya.
- Simpan catatan khusus lingkungan di `TOOLS.md` (Catatan untuk Skills).

## Tip cadangan (direkomendasikan)

Jika Anda memperlakukan workspace ini sebagai “memori” Clawd, jadikan ini repo git (idealnya privat) agar `AGENTS.md` dan file memori Anda dicadangkan.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Opsional: tambahkan remote privat + push
```

## Apa yang Dilakukan OpenClaw

- Menjalankan gateway WhatsApp + agen coding Pi agar asisten dapat membaca/menulis chat, mengambil konteks, dan menjalankan Skills melalui Mac host.
- Aplikasi macOS mengelola izin (perekaman layar, notifikasi, mikrofon) dan mengekspos CLI `openclaw` melalui biner bundelnya.
- Chat langsung digabungkan ke sesi `main` agen secara default; grup tetap terisolasi sebagai `agent:<agentId>:<channel>:group:<id>` (ruangan/channel: `agent:<agentId>:<channel>:channel:<id>`); heartbeat menjaga tugas latar belakang tetap aktif.

## Skills Inti (aktifkan di Pengaturan → Skills)

- **mcporter** — Runtime/server CLI untuk mengelola backend skill eksternal.
- **Peekaboo** — Tangkapan layar macOS cepat dengan analisis visi AI opsional.
- **camsnap** — Ambil frame, klip, atau peringatan gerakan dari kamera keamanan RTSP/ONVIF.
- **oracle** — CLI agen siap OpenAI dengan pemutaran ulang sesi dan kontrol browser.
- **eightctl** — Kendalikan tidur Anda dari terminal.
- **imsg** — Kirim, baca, stream iMessage & SMS.
- **wacli** — CLI WhatsApp: sinkronkan, cari, kirim.
- **discord** — Aksi Discord: react, stiker, polling. Gunakan target `user:<id>` atau `channel:<id>` (id numerik tanpa awalan bersifat ambigu).
- **gog** — CLI Google Suite: Gmail, Kalender, Drive, Kontak.
- **spotify-player** — Klien Spotify terminal untuk mencari/mengantre/mengontrol pemutaran.
- **sag** — Speech ElevenLabs dengan UX gaya say di Mac; stream ke speaker secara default.
- **Sonos CLI** — Kendalikan speaker Sonos (discovery/status/pemutaran/volume/pengelompokan) dari skrip.
- **blucli** — Putar, kelompokkan, dan otomatisasikan pemutar BluOS dari skrip.
- **OpenHue CLI** — Kontrol pencahayaan Philips Hue untuk adegan dan otomatisasi.
- **OpenAI Whisper** — Speech-to-text lokal untuk dikte cepat dan transkrip pesan suara.
- **Gemini CLI** — Model Google Gemini dari terminal untuk tanya jawab cepat.
- **agent-tools** — Toolkit utilitas untuk otomatisasi dan skrip pembantu.

## Catatan Penggunaan

- Utamakan CLI `openclaw` untuk scripting; aplikasi Mac menangani izin.
- Jalankan instalasi dari tab Skills; tombol disembunyikan jika biner sudah ada.
- Biarkan heartbeat tetap aktif agar asisten dapat menjadwalkan pengingat, memantau inbox, dan memicu pengambilan kamera.
- UI Canvas berjalan layar penuh dengan overlay native. Hindari menempatkan kontrol penting di tepi kiri atas/kanan atas/bawah; tambahkan gutter eksplisit di tata letak dan jangan bergantung pada inset safe-area.
- Untuk verifikasi berbasis browser, gunakan `openclaw browser` (tabs/status/screenshot) dengan profil Chrome yang dikelola OpenClaw.
- Untuk inspeksi DOM, gunakan `openclaw browser eval|query|dom|snapshot` (serta `--json`/`--out` saat Anda memerlukan output untuk mesin).
- Untuk interaksi, gunakan `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type memerlukan referensi snapshot; gunakan `evaluate` untuk selector CSS).
