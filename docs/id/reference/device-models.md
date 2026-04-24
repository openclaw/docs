---
read_when:
    - Memperbarui pemetaan identifier model perangkat atau file NOTICE/lisensi
    - Mengubah cara UI Instances menampilkan nama perangkat
summary: Bagaimana OpenClaw mem-vendor identifier model perangkat Apple untuk nama yang mudah dibaca di aplikasi macOS.
title: Database model perangkat
x-i18n:
    generated_at: "2026-04-24T09:26:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# Database model perangkat (nama yang mudah dibaca)

Aplikasi pendamping macOS menampilkan nama model perangkat Apple yang mudah dibaca di UI **Instances** dengan memetakan identifier model Apple (misalnya `iPad16,6`, `Mac16,6`) ke nama yang dapat dibaca manusia.

Pemetaan tersebut di-vendor sebagai JSON di bawah:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Sumber data

Saat ini kami me-vendor pemetaan dari repositori berlisensi MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Agar build tetap deterministik, file JSON dipin ke commit upstream tertentu (dicatat di `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Memperbarui database

1. Pilih commit upstream yang ingin Anda pin (satu untuk iOS, satu untuk macOS).
2. Perbarui hash commit di `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Unduh ulang file JSON, yang dipin ke commit tersebut:

```bash
IOS_COMMIT="<commit sha untuk ios-device-identifiers.json>"
MAC_COMMIT="<commit sha untuk mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Pastikan `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` masih cocok dengan upstream (ganti jika lisensi upstream berubah).
5. Verifikasi bahwa aplikasi macOS dibangun dengan bersih (tanpa peringatan):

```bash
swift build --package-path apps/macos
```

## Terkait

- [Nodes](/id/nodes)
- [Pemecahan masalah node](/id/nodes/troubleshooting)
