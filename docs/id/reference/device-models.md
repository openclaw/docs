---
read_when:
    - Memperbarui pemetaan identifier model perangkat atau file NOTICE/lisensi
    - Mengubah cara UI Instances menampilkan nama perangkat
summary: Bagaimana OpenClaw memvendor identifier model perangkat Apple untuk nama yang mudah dikenali di aplikasi macOS.
title: Database model perangkat
x-i18n:
    generated_at: "2026-04-25T13:55:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Aplikasi pendamping macOS menampilkan nama model perangkat Apple yang mudah dikenali di UI **Instances** dengan memetakan identifier model Apple (misalnya `iPad16,6`, `Mac16,6`) ke nama yang dapat dibaca manusia.

Pemetaan tersebut divendor sebagai JSON di bawah:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Sumber data

Saat ini kami memvendor pemetaan dari repositori berlisensi MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Agar build tetap deterministik, file JSON dipin ke commit upstream tertentu (dicatat di `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Memperbarui database

1. Pilih commit upstream yang ingin Anda pin (satu untuk iOS, satu untuk macOS).
2. Perbarui hash commit di `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Unduh ulang file JSON, dipin ke commit tersebut:

```bash
IOS_COMMIT="<commit sha untuk ios-device-identifiers.json>"
MAC_COMMIT="<commit sha untuk mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Pastikan `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` masih cocok dengan upstream (ganti jika lisensi upstream berubah).
5. Verifikasi bahwa aplikasi macOS berhasil dibangun dengan bersih (tanpa peringatan):

```bash
swift build --package-path apps/macos
```

## Terkait

- [Node](/id/nodes)
- [Pemecahan masalah Node](/id/nodes/troubleshooting)
