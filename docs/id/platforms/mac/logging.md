---
read_when:
    - Mengambil log macOS atau menyelidiki pencatatan data pribadi
    - Melakukan debug pada masalah voice wake/siklus hidup sesi
summary: 'Logging OpenClaw: file log diagnostik bergulir + flag privasi unified log'
title: Logging macOS
x-i18n:
    generated_at: "2026-04-05T14:00:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Logging (macOS)

## File log diagnostik bergulir (panel Debug)

OpenClaw merutekan log aplikasi macOS melalui swift-log (secara default menggunakan unified logging) dan dapat menulis file log lokal bergulir ke disk saat Anda memerlukan rekaman yang tahan lama.

- Verbositas: **Panel Debug → Logs → App logging → Verbosity**
- Aktifkan: **Panel Debug → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Lokasi: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (berotasi otomatis; file lama diberi sufiks `.1`, `.2`, …)
- Bersihkan: **Panel Debug → Logs → App logging → “Clear”**

Catatan:

- Ini **nonaktif secara default**. Aktifkan hanya saat benar-benar sedang melakukan debug.
- Perlakukan file ini sebagai data sensitif; jangan bagikan tanpa peninjauan.

## Private data unified logging di macOS

Unified logging meredaksi sebagian besar payload kecuali sebuah subsystem memilih `privacy -off`. Sesuai tulisan Peter tentang macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025), ini dikendalikan oleh plist di `/Library/Preferences/Logging/Subsystems/` yang dikunci dengan nama subsystem. Hanya entri log baru yang akan mengambil flag tersebut, jadi aktifkan sebelum mereproduksi masalah.

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

- Tidak perlu reboot; logd akan segera mengenali file tersebut, tetapi hanya baris log baru yang akan menyertakan payload privat.
- Lihat output yang lebih kaya dengan helper yang ada, misalnya `./scripts/clawlog.sh --category WebChat --last 5m`.

## Nonaktifkan setelah debug

- Hapus override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opsional jalankan `sudo log config --reload` untuk memaksa logd membuang override segera.
- Ingat bahwa permukaan ini dapat menyertakan nomor telepon dan isi pesan; pertahankan plist ini hanya selama Anda benar-benar memerlukan detail tambahan tersebut.
