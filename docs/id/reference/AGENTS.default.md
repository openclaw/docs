---
read_when:
    - Memulai sesi agen OpenClaw baru
    - Mengaktifkan atau mengaudit Skills default
summary: Instruksi agen OpenClaw default dan daftar Skills untuk penyiapan asisten pribadi
title: '`AGENTS.md` default'
x-i18n:
    generated_at: "2026-04-24T09:25:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - Asisten Pribadi OpenClaw (default)

## Menjalankan pertama kali (disarankan)

OpenClaw menggunakan direktori workspace khusus untuk agen. Default: `~/.openclaw/workspace` (dapat dikonfigurasi melalui `agents.defaults.workspace`).

1. Buat workspace (jika belum ada):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Salin template workspace default ke dalam workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opsional: jika Anda menginginkan daftar Skills asisten pribadi, ganti AGENTS.md dengan file ini:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opsional: pilih workspace lain dengan menetapkan `agents.defaults.workspace` (mendukung `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Default keamanan

- Jangan membuang isi direktori atau rahasia ke chat.
- Jangan menjalankan perintah destruktif kecuali diminta secara eksplisit.
- Jangan kirim balasan parsial/streaming ke permukaan pesan eksternal (hanya balasan final).

## Mulai sesi (wajib)

- Baca `SOUL.md`, `USER.md`, dan hari ini+kemarin di `memory/`.
- Baca `MEMORY.md` jika ada.
- Lakukan itu sebelum merespons.

## Soul (wajib)

- `SOUL.md` mendefinisikan identitas, nada, dan batasan. Jaga agar tetap mutakhir.
- Jika Anda mengubah `SOUL.md`, beri tahu pengguna.
- Anda adalah instans baru di setiap sesi; kontinuitas ada di file-file ini.

## Ruang bersama (disarankan)

- Anda bukan suara pengguna; berhati-hatilah di chat grup atau saluran publik.
- Jangan bagikan data pribadi, info kontak, atau catatan internal.

## Sistem memori (disarankan)

- Log harian: `memory/YYYY-MM-DD.md` (buat `memory/` jika diperlukan).
- Memori jangka panjang: `MEMORY.md` untuk fakta, preferensi, dan keputusan yang bertahan lama.
- Huruf kecil `memory.md` hanya untuk input perbaikan legacy; jangan sengaja menyimpan kedua file root.
- Saat sesi dimulai, baca hari ini + kemarin + `MEMORY.md` jika ada.
- Catat: keputusan, preferensi, batasan, loop yang belum selesai.
- Hindari rahasia kecuali diminta secara eksplisit.

## Alat & Skills

- Alat berada di dalam skills; ikuti `SKILL.md` masing-masing skill saat Anda membutuhkannya.
- Simpan catatan khusus lingkungan di `TOOLS.md` (Catatan untuk Skills).

## Tips cadangan (disarankan)

Jika Anda memperlakukan workspace ini sebagai “memori” Clawd, jadikan ini repo git (idealnya privat) agar `AGENTS.md` dan file memori Anda dicadangkan.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Opsional: tambahkan remote privat + push
```

## Yang Dilakukan OpenClaw

- Menjalankan gateway WhatsApp + agen coding Pi agar asisten dapat membaca/menulis chat, mengambil konteks, dan menjalankan skills melalui host Mac.
- Aplikasi macOS mengelola izin (perekaman layar, notifikasi, mikrofon) dan mengekspos CLI `openclaw` melalui biner bawaan.
- Chat langsung digabungkan ke sesi `main` agen secara default; grup tetap terisolasi sebagai `agent:<agentId>:<channel>:group:<id>` (ruangan/saluran: `agent:<agentId>:<channel>:channel:<id>`); Heartbeat menjaga tugas latar belakang tetap aktif.

## Skills Inti (aktifkan di Settings → Skills)

- **mcporter** — Runtime/server alat dan CLI untuk mengelola backend skill eksternal.
- **Peekaboo** — Screenshot macOS cepat dengan analisis visi AI opsional.
- **camsnap** — Ambil frame, klip, atau peringatan gerakan dari kamera keamanan RTSP/ONVIF.
- **oracle** — CLI agen siap OpenAI dengan pemutaran ulang sesi dan kontrol browser.
- **eightctl** — Kendalikan tidur Anda dari terminal.
- **imsg** — Kirim, baca, streaming iMessage & SMS.
- **wacli** — CLI WhatsApp: sinkronisasi, pencarian, kirim.
- **discord** — Tindakan Discord: react, stiker, polling. Gunakan target `user:<id>` atau `channel:<id>` (id numerik tanpa awalan ambigu).
- **gog** — CLI Google Suite: Gmail, Kalender, Drive, Kontak.
- **spotify-player** — Klien Spotify terminal untuk mencari/mengantre/mengontrol pemutaran.
- **sag** — Ucapan ElevenLabs dengan UX seperti say di Mac; secara default streaming ke speaker.
- **Sonos CLI** — Kontrol speaker Sonos (discover/status/playback/volume/grouping) dari skrip.
- **blucli** — Putar, kelompokkan, dan otomatisasikan pemutar BluOS dari skrip.
- **OpenHue CLI** — Kontrol pencahayaan Philips Hue untuk scene dan otomatisasi.
- **OpenAI Whisper** — Speech-to-text lokal untuk dikte cepat dan transkrip voicemail.
- **Gemini CLI** — Model Gemini Google dari terminal untuk tanya jawab cepat.
- **agent-tools** — Toolkit utilitas untuk otomatisasi dan skrip bantuan.

## Catatan Penggunaan

- Utamakan CLI `openclaw` untuk scripting; aplikasi Mac menangani izin.
- Jalankan instalasi dari tab Skills; tombol disembunyikan jika biner sudah ada.
- Biarkan Heartbeat tetap aktif agar asisten dapat menjadwalkan pengingat, memantau inbox, dan memicu pengambilan kamera.
- UI Canvas berjalan layar penuh dengan overlay native. Hindari menempatkan kontrol penting di tepi kiri atas/kanan atas/bawah; tambahkan gutter eksplisit di tata letak dan jangan bergantung pada safe-area inset.
- Untuk verifikasi berbasis browser, gunakan `openclaw browser` (tabs/status/screenshot) dengan profil Chrome yang dikelola OpenClaw.
- Untuk inspeksi DOM, gunakan `openclaw browser eval|query|dom|snapshot` (dan `--json`/`--out` saat Anda memerlukan output terstruktur).
- Untuk interaksi, gunakan `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type memerlukan referensi snapshot; gunakan `evaluate` untuk selector CSS).

## Terkait

- [Workspace agen](/id/concepts/agent-workspace)
- [Runtime agen](/id/concepts/agent)
