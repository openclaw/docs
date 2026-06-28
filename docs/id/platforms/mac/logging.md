---
read_when:
    - Mengambil log macOS atau menyelidiki pencatatan data pribadi
    - Men-debug masalah siklus hidup wake/session suara
summary: 'Pencatatan log OpenClaw: log file diagnostik bergulir + flag privasi log terpadu'
title: Pencatatan log macOS
x-i18n:
    generated_at: "2026-05-06T09:20:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Pencatatan Log (macOS)

## Log file diagnostik bergulir (panel Debug)

OpenClaw mengarahkan log aplikasi macOS melalui swift-log (pencatatan log terpadu secara default) dan dapat menulis log file lokal yang berotasi ke disk saat Anda memerlukan tangkapan yang tahan lama.

- Tingkat detail: **Panel Debug → Log → Pencatatan log aplikasi → Tingkat detail**
- Aktifkan: **Panel Debug → Log → Pencatatan log aplikasi → "Tulis log diagnostik bergulir (JSONL)"**
- Lokasi: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (berotasi otomatis; file lama diberi sufiks `.1`, `.2`, …)
- Hapus: **Panel Debug → Log → Pencatatan log aplikasi → "Hapus"**

Catatan:

- Ini **nonaktif secara default**. Aktifkan hanya saat sedang melakukan debug secara aktif.
- Perlakukan file ini sebagai sensitif; jangan membagikannya tanpa peninjauan.

## Data privat pencatatan log terpadu di macOS

Pencatatan log terpadu menyunting sebagian besar payload kecuali sebuah subsistem memilih ikut ke `privacy -off`. Menurut tulisan Peter tentang [keanehan privasi pencatatan log](https://steipete.me/posts/2025/logging-privacy-shenanigans) macOS (2025), ini dikendalikan oleh plist di `/Library/Preferences/Logging/Subsystems/` yang dikunci berdasarkan nama subsistem. Hanya entri log baru yang mengambil flag tersebut, jadi aktifkan sebelum mereproduksi masalah.

## Aktifkan untuk OpenClaw (`ai.openclaw`)

- Tulis plist ke file sementara terlebih dahulu, lalu instal secara atomik sebagai root:

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

- Reboot tidak diperlukan; logd akan segera mendeteksi file tersebut, tetapi hanya baris log baru yang akan menyertakan payload privat.
- Lihat keluaran yang lebih kaya dengan helper yang sudah ada, misalnya `./scripts/clawlog.sh --category WebChat --last 5m`.

## Nonaktifkan setelah debug

- Hapus override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Secara opsional jalankan `sudo log config --reload` untuk memaksa logd segera melepas override.
- Ingat bahwa permukaan ini dapat mencakup nomor telepon dan isi pesan; biarkan plist tetap ada hanya saat Anda secara aktif memerlukan detail tambahan.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Pencatatan log Gateway](/id/gateway/logging)
