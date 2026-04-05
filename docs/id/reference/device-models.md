---
read_when:
    - Memperbarui pemetaan pengidentifikasi model perangkat atau file NOTICE/lisensi
    - Mengubah cara UI Instances menampilkan nama perangkat
summary: Bagaimana OpenClaw mem-vendor pengidentifikasi model perangkat Apple untuk nama yang ramah di aplikasi macOS.
title: Database Model Perangkat
x-i18n:
    generated_at: "2026-04-05T14:04:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2
    source_path: reference/device-models.md
    workflow: 15
---

# Database model perangkat (nama ramah)

Aplikasi pendamping macOS menampilkan nama model perangkat Apple yang ramah di UI **Instances** dengan memetakan pengidentifikasi model Apple (misalnya `iPad16,6`, `Mac16,6`) ke nama yang dapat dibaca manusia.

Pemetaan ini di-vendor sebagai JSON di bawah:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Sumber data

Saat ini kami mem-vendor pemetaan dari repositori berlisensi MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Untuk menjaga build tetap deterministik, file JSON dipatok ke commit upstream tertentu (dicatat di `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Memperbarui database

1. Pilih commit upstream yang ingin Anda patok (satu untuk iOS, satu untuk macOS).
2. Perbarui hash commit di `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Unduh ulang file JSON, dipatok ke commit tersebut:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Pastikan `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` masih sesuai dengan upstream (ganti jika lisensi upstream berubah).
5. Verifikasi aplikasi macOS ter-build dengan bersih (tanpa peringatan):

```bash
swift build --package-path apps/macos
```
