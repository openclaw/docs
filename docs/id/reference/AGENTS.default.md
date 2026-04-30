---
read_when:
    - Memulai sesi agen OpenClaw baru
    - Mengaktifkan atau mengaudit Skills bawaan
summary: Instruksi agen OpenClaw default dan daftar Skills untuk penyiapan asisten pribadi
title: AGENTS.md Bawaan
x-i18n:
    generated_at: "2026-04-30T10:09:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - Asisten Pribadi OpenClaw (bawaan)

## Jalankan pertama kali (disarankan)

OpenClaw menggunakan direktori workspace khusus untuk agen. Bawaan: `~/.openclaw/workspace` (dapat dikonfigurasi melalui `agents.defaults.workspace`).

1. Buat workspace (jika belum ada):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Salin templat workspace bawaan ke dalam workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opsional: jika Anda menginginkan daftar Skills asisten pribadi, ganti AGENTS.md dengan file ini:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opsional: pilih workspace lain dengan mengatur `agents.defaults.workspace` (mendukung `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Bawaan keselamatan

- Jangan memasukkan direktori atau rahasia ke chat.
- Jangan menjalankan perintah destruktif kecuali diminta secara eksplisit.
- Jangan mengirim balasan parsial/streaming ke permukaan pesan eksternal (hanya balasan final).

## Awal sesi (wajib)

- Baca `SOUL.md`, `USER.md`, dan hari ini+kemarin di `memory/`.
- Baca `MEMORY.md` jika ada.
- Lakukan sebelum merespons.

## Soul (wajib)

- `SOUL.md` mendefinisikan identitas, nada, dan batasan. Jaga agar tetap terkini.
- Jika Anda mengubah `SOUL.md`, beri tahu pengguna.
- Anda adalah instans baru di setiap sesi; kontinuitas berada di file-file ini.

## Ruang bersama (disarankan)

- Anda bukan suara pengguna; berhati-hatilah dalam chat grup atau channel publik.
- Jangan membagikan data pribadi, info kontak, atau catatan internal.

## Sistem memori (disarankan)

- Log harian: `memory/YYYY-MM-DD.md` (buat `memory/` jika perlu).
- Memori jangka panjang: `MEMORY.md` untuk fakta, preferensi, dan keputusan yang tahan lama.
- `memory.md` huruf kecil hanya masukan perbaikan lama; jangan sengaja menyimpan kedua file root.
- Saat awal sesi, baca hari ini + kemarin + `MEMORY.md` jika ada.
- Tangkap: keputusan, preferensi, batasan, loop terbuka.
- Hindari rahasia kecuali diminta secara eksplisit.

## Alat & Skills

- Alat berada dalam Skills; ikuti `SKILL.md` milik setiap skill saat Anda membutuhkannya.
- Simpan catatan khusus lingkungan di `TOOLS.md` (Catatan untuk Skills).

## Tip pencadangan (disarankan)

Jika Anda memperlakukan workspace ini sebagai “memori” Clawd, jadikan ini repo git (idealnya privat) agar `AGENTS.md` dan file memori Anda dicadangkan.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Yang dilakukan OpenClaw

- Menjalankan Gateway WhatsApp + agen coding Pi agar asisten dapat membaca/menulis chat, mengambil konteks, dan menjalankan Skills melalui Mac host.
- Aplikasi macOS mengelola izin (perekaman layar, notifikasi, mikrofon) dan mengekspos CLI `openclaw` melalui biner bawaannya.
- Chat langsung digabungkan ke sesi `main` agen secara bawaan; grup tetap terisolasi sebagai `agent:<agentId>:<channel>:group:<id>` (ruang/channel: `agent:<agentId>:<channel>:channel:<id>`); Heartbeat menjaga tugas latar belakang tetap hidup.

## Skills inti (aktifkan di Pengaturan → Skills)

- **mcporter** — Runtime server alat/CLI untuk mengelola backend skill eksternal.
- **Peekaboo** — Tangkapan layar macOS cepat dengan analisis visi AI opsional.
- **camsnap** — Tangkap frame, klip, atau peringatan gerakan dari kamera keamanan RTSP/ONVIF.
- **oracle** — CLI agen siap OpenAI dengan pemutaran ulang sesi dan kontrol browser.
- **eightctl** — Kendalikan tidur Anda, dari terminal.
- **imsg** — Kirim, baca, stream iMessage & SMS.
- **wacli** — CLI WhatsApp: sinkronkan, cari, kirim.
- **discord** — Aksi Discord: reaksi, stiker, polling. Gunakan target `user:<id>` atau `channel:<id>` (id numerik polos bersifat ambigu).
- **gog** — CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Klien Spotify terminal untuk mencari/mengantrikan/mengontrol pemutaran.
- **sag** — Ucapan ElevenLabs dengan UX say bergaya Mac; stream ke speaker secara bawaan.
- **Sonos CLI** — Kendalikan speaker Sonos (temukan/status/pemutaran/volume/pengelompokan) dari skrip.
- **blucli** — Putar, kelompokkan, dan otomatiskan pemutar BluOS dari skrip.
- **OpenHue CLI** — Kontrol pencahayaan Philips Hue untuk scene dan automasi.
- **OpenAI Whisper** — Ucapan-ke-teks lokal untuk dikte cepat dan transkrip pesan suara.
- **Gemini CLI** — Model Google Gemini dari terminal untuk tanya jawab cepat.
- **agent-tools** — Toolkit utilitas untuk automasi dan skrip pembantu.

## Catatan penggunaan

- Utamakan CLI `openclaw` untuk scripting; aplikasi Mac menangani izin.
- Jalankan instalasi dari tab Skills; tombol disembunyikan jika biner sudah ada.
- Biarkan Heartbeat aktif agar asisten dapat menjadwalkan pengingat, memantau kotak masuk, dan memicu tangkapan kamera.
- UI Canvas berjalan layar penuh dengan overlay native. Hindari menempatkan kontrol penting di tepi kiri atas/kanan atas/bawah; tambahkan gutter eksplisit dalam layout dan jangan bergantung pada inset area aman.
- Untuk verifikasi berbasis browser, gunakan `openclaw browser` (tab/status/tangkapan layar) dengan profil Chrome yang dikelola OpenClaw.
- Untuk inspeksi DOM, gunakan `openclaw browser eval|query|dom|snapshot` (dan `--json`/`--out` saat Anda membutuhkan keluaran mesin).
- Untuk interaksi, gunakan `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type memerlukan ref snapshot; gunakan `evaluate` untuk selektor CSS).

## Terkait

- [Workspace agen](/id/concepts/agent-workspace)
- [Runtime agen](/id/concepts/agent)
