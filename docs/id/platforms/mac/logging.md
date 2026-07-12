---
read_when:
    - Mengambil log macOS atau menyelidiki pencatatan data pribadi
    - Men-debug masalah siklus hidup aktivasi suara/sesi
summary: 'Pencatatan log OpenClaw: log file diagnostik bergulir + flag privasi log terpadu'
title: Pencatatan log macOS
x-i18n:
    generated_at: "2026-07-12T14:21:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Pencatatan log (macOS)

## Log file diagnostik bergulir (panel Debug)

Aplikasi macOS mencatat log melalui swift-log (secara default menggunakan pencatatan log terpadu) dan juga dapat menulis log file lokal bergulir untuk perekaman yang tahan lama (`DiagnosticsFileLog`).

- Aktifkan: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (secara default nonaktif).
- Tingkat detail: pemilih **Debug pane -> Logs -> App logging -> Verbosity**.
- Lokasi: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Rotasi: dirotasi pada ukuran 5 MB; hingga 5 cadangan dengan akhiran `.1`...`.5` (yang paling lama dihapus).
- Hapus: **Debug pane -> Logs -> App logging -> "Clear"** menghapus file aktif dan semua cadangan.

Perlakukan file tersebut sebagai data sensitif; jangan membagikannya tanpa peninjauan.

## Data privat pencatatan log terpadu di macOS

Pencatatan log terpadu menyunting sebagian besar muatan kecuali suatu subsistem mengaktifkan `privacy -off`. Hal ini dikendalikan oleh plist di `/Library/Preferences/Logging/Subsystems/` yang menggunakan nama subsistem sebagai kunci. Hanya entri log baru yang menerapkan tanda tersebut, jadi aktifkan sebelum mereproduksi masalah. Latar belakang: [seluk-beluk privasi pencatatan log macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Aktifkan untuk OpenClaw (`ai.openclaw`)

Tulis plist terlebih dahulu ke file sementara, lalu instal secara atomik sebagai root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

Tidak perlu memulai ulang; logd segera mendeteksi file tersebut, tetapi hanya baris log baru yang menyertakan muatan privat. Lihat keluaran yang lebih lengkap dengan `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` menetapkan rentang waktu, default `5m`; `--category`/`-c` memfilter berdasarkan kategori).

## Nonaktifkan setelah melakukan debug

- Hapus penggantian: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Secara opsional, jalankan `sudo log config --reload` untuk memaksa logd segera membuang penggantian tersebut.
- Bagian ini dapat mencakup nomor telepon dan isi pesan; pertahankan plist hanya saat benar-benar diperlukan.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [Pencatatan log Gateway](/id/gateway/logging)
