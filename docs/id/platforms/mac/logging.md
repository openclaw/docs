---
read_when:
    - Menangkap log macOS atau menyelidiki logging data privat
    - Men-debug masalah siklus hidup voice wake/sesi
summary: 'Logging OpenClaw: log file diagnostik bergulir + flag privasi unified log'
title: logging macOS
x-i18n:
    generated_at: "2026-04-24T09:17:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Logging (macOS)

## Log file diagnostik bergulir (panel Debug)

OpenClaw merutekan log aplikasi macOS melalui swift-log (unified logging secara default) dan dapat menulis log file lokal bergulir ke disk saat Anda memerlukan tangkapan yang tahan lama.

- Verbosity: **Debug pane → Logs → App logging → Verbosity**
- Aktifkan: **Debug pane → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Lokasi: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (berputar secara otomatis; file lama diberi sufiks `.1`, `.2`, …)
- Hapus: **Debug pane → Logs → App logging → “Clear”**

Catatan:

- Ini **nonaktif secara default**. Aktifkan hanya saat sedang aktif men-debug.
- Perlakukan file ini sebagai sensitif; jangan bagikan tanpa ditinjau.

## Logging data privat di unified logging macOS

Unified logging menyunting sebagian besar payload kecuali suatu subsistem memilih `privacy -off`. Berdasarkan tulisan Peter tentang macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025), ini dikendalikan oleh plist di `/Library/Preferences/Logging/Subsystems/` yang dikunci oleh nama subsistem. Hanya entri log baru yang mengambil flag tersebut, jadi aktifkan sebelum mereproduksi masalah.

## Aktifkan untuk OpenClaw (`ai.openclaw`)

- Tulis plist ke file temp terlebih dahulu, lalu instal secara atomik sebagai root:

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

- Tidak perlu reboot; `logd` dengan cepat mengenali file tersebut, tetapi hanya baris log baru yang akan menyertakan payload privat.
- Lihat output yang lebih kaya dengan helper yang ada, misalnya `./scripts/clawlog.sh --category WebChat --last 5m`.

## Nonaktifkan setelah debugging

- Hapus override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opsional, jalankan `sudo log config --reload` untuk memaksa `logd` segera melepaskan override.
- Ingat bahwa permukaan ini dapat menyertakan nomor telepon dan body pesan; pertahankan plist ini hanya selama Anda benar-benar memerlukan detail tambahan tersebut.

## Terkait

- [macOS app](/id/platforms/macos)
- [Gateway logging](/id/gateway/logging)
