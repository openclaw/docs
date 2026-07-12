---
read_when:
    - Memulai sesi agen OpenClaw baru
    - Mengaktifkan atau mengaudit Skills bawaan
summary: Instruksi agen OpenClaw dan daftar Skills bawaan untuk penyiapan asisten pribadi
title: AGENTS.md Bawaan
x-i18n:
    generated_at: "2026-07-12T14:35:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Penggunaan pertama (disarankan)

Agen OpenClaw menggunakan direktori ruang kerja. Bawaan: `~/.openclaw/workspace` (dapat dikonfigurasi melalui `agents.defaults.workspace`, mendukung `~`).

1. Buat ruang kerja:

```bash
mkdir -p ~/.openclaw/workspace
```

2. Salin templat ruang kerja bawaan ke dalamnya:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opsional: gunakan daftar Skills asisten pribadi dari berkas ini sebagai pengganti templat generik:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opsional: arahkan ke ruang kerja lain:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Pengaturan keamanan bawaan

- Jangan tuangkan isi direktori atau rahasia ke dalam percakapan.
- Jangan jalankan perintah yang merusak kecuali diminta secara eksplisit.
- Sebelum mengubah konfigurasi atau penjadwal (crontab, unit systemd, konfigurasi nginx, berkas rc shell), periksa keadaan yang ada terlebih dahulu dan secara bawaan pertahankan/gabungkan.
- Jangan kirim balasan sebagian/streaming ke layanan perpesanan eksternal (hanya balasan akhir).

## Pemeriksaan awal solusi yang sudah ada

Sebelum mengusulkan atau membangun sistem, fitur, alur kerja, alat, integrasi, atau otomatisasi khusus, periksa proyek sumber terbuka, pustaka yang dipelihara, Plugin OpenClaw yang sudah ada, atau platform gratis yang telah menyelesaikannya dengan cukup baik. Utamakan opsi tersebut jika memadai. Bangun solusi khusus hanya jika opsi yang ada tidak cocok, terlalu mahal, tidak dipelihara, tidak aman, tidak patuh, atau pengguna secara eksplisit meminta solusi khusus. Hindari rekomendasi layanan berbayar kecuali pengguna secara eksplisit menyetujui pengeluaran. Lakukan secara ringan sebagai gerbang pemeriksaan awal, bukan tugas penelitian.

## Awal sesi (wajib)

- Baca `SOUL.md`, `USER.md`, serta catatan hari ini+kemarin di `memory/` sebelum merespons.
- Baca `MEMORY.md` jika tersedia.

## Jiwa (wajib)

- `SOUL.md` mendefinisikan identitas, nada, dan batasan. Pastikan selalu mutakhir.
- Jika Anda mengubah `SOUL.md`, beri tahu pengguna.
- Anda adalah instans baru pada setiap sesi; kesinambungan tersimpan dalam berkas-berkas ini.

## Ruang bersama (disarankan)

- Anda bukan suara pengguna; berhati-hatilah dalam percakapan grup atau kanal publik.
- Jangan bagikan data pribadi, informasi kontak, atau catatan internal.

## Sistem memori (disarankan)

- Log harian: `memory/YYYY-MM-DD.md` (buat `memory/` jika diperlukan).
- Memori jangka panjang: `MEMORY.md` untuk fakta, preferensi, dan keputusan yang bertahan lama.
- `memory.md` dengan huruf kecil hanya merupakan masukan perbaikan warisan; jangan sengaja mempertahankan kedua berkas di akar.
- Pada awal sesi, baca catatan hari ini + kemarin + `MEMORY.md` jika tersedia.
- Sebelum menulis berkas memori, baca terlebih dahulu; tulis hanya pembaruan konkret, jangan pernah menulis placeholder kosong.
- Catat: keputusan, preferensi, batasan, pekerjaan yang belum selesai.
- Hindari rahasia kecuali diminta secara eksplisit.

## Alat dan Skills

- Alat berada di dalam Skills; ikuti `SKILL.md` dari setiap skill saat Anda membutuhkannya.
- Simpan catatan khusus lingkungan di `TOOLS.md` (catatan untuk Skills).

## Kiat pencadangan (disarankan)

Perlakukan ruang kerja ini sebagai memori asisten: jadikan repositori git (idealnya privat) agar `AGENTS.md` dan berkas memori dicadangkan.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# Opsional: tambahkan remote privat + dorong
```

## Yang dilakukan OpenClaw

- Menjalankan Gateway kanal perpesanan (WhatsApp, Telegram, Discord, Signal, iMessage, Slack, dan lainnya) serta agen tertanam, sehingga asisten dapat membaca/menulis percakapan, mengambil konteks, dan menjalankan Skills melalui mesin host.
- Aplikasi macOS mengelola izin (perekaman layar, notifikasi, mikrofon) dan menyediakan CLI `openclaw` melalui biner bawaannya.
- Percakapan langsung secara bawaan digabungkan ke sesi `main` milik agen; grup dan kanal/ruangan memperoleh kunci sesinya masing-masing. Lihat [Perutean kanal](/id/channels/channel-routing) untuk format kunci yang tepat. Heartbeat menjaga tugas latar belakang tetap aktif.

## Skills inti (aktifkan di Settings → Skills)

Contoh daftar untuk ruang kerja asisten pribadi; ganti dengan Skills yang sesuai dengan penyiapan Anda.

- **mcporter** - runtime/CLI server alat untuk mengelola backend skill eksternal.
- **Peekaboo** - tangkapan layar macOS cepat dengan analisis visi AI opsional.
- **camsnap** - mengambil bingkai, klip, atau peringatan gerakan dari kamera keamanan RTSP/ONVIF.
- **oracle** - CLI agen yang siap untuk OpenAI dengan pemutaran ulang sesi dan kendali peramban.
- **eightctl** - mengendalikan tidur Anda dari terminal.
- **imsg** - mengirim, membaca, dan melakukan streaming iMessage & SMS.
- **wacli** - CLI WhatsApp: menyinkronkan, mencari, mengirim.
- **discord** - tindakan Discord: reaksi, stiker, jajak pendapat. Gunakan target `user:<id>` atau `channel:<id>` (id numerik saja bersifat ambigu).
- **gog** - CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - klien Spotify terminal untuk mencari/mengantrekan/mengendalikan pemutaran.
- **sag** - ucapan ElevenLabs dengan pengalaman pengguna seperti perintah say di Mac; secara bawaan melakukan streaming ke pengeras suara.
- **Sonos CLI** - mengendalikan pengeras suara Sonos (penemuan/status/pemutaran/volume/pengelompokan) dari skrip.
- **blucli** - memutar, mengelompokkan, dan mengotomatiskan pemutar BluOS dari skrip.
- **OpenHue CLI** - mengendalikan pencahayaan Philips Hue untuk skena dan otomatisasi.
- **OpenAI Whisper** - konversi ucapan ke teks secara lokal untuk dikte cepat dan transkrip pesan suara.
- **Gemini CLI** - model Google Gemini dari terminal untuk tanya jawab cepat.
- **agent-tools** - perangkat utilitas untuk otomatisasi dan skrip pembantu.

## Catatan penggunaan

- Utamakan CLI `openclaw` untuk pembuatan skrip; aplikasi desktop menangani izin.
- Jalankan instalasi dari tab Skills; tombol instalasi disembunyikan setelah biner yang diperlukan tersedia.
- Biarkan Heartbeat tetap aktif agar asisten dapat menjadwalkan pengingat, memantau kotak masuk, dan memicu pengambilan gambar kamera.
- Antarmuka Canvas berjalan dalam layar penuh dengan lapisan atas native. Hindari menempatkan kontrol penting di tepi kiri atas/kanan atas/bawah; tambahkan gutter tata letak eksplisit alih-alih mengandalkan inset area aman.
- Untuk verifikasi berbasis peramban, gunakan CLI `openclaw browser` (Plugin `browser` bawaan) dengan profil Chrome/Brave/Edge/Chromium yang dikelola OpenClaw.
- Kelola: `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- Periksa: `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- Bertindak: `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. Tindakan memerlukan `ref` dari `snapshot` (selektor CSS tidak diterima untuk tindakan); gunakan `evaluate` saat Anda memerlukan penargetan bergaya `document.querySelector`.
- Tambahkan `--json` untuk keluaran yang dapat dibaca mesin pada perintah pemeriksaan apa pun.

## Terkait

- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Runtime agen](/id/concepts/agent)
- [Perutean kanal](/id/channels/channel-routing)
