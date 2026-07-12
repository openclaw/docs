---
read_when:
    - Memperbarui pemetaan pengidentifikasi model perangkat atau berkas NOTICE/lisensi
    - Mengubah cara UI Instans menampilkan nama perangkat
summary: Cara OpenClaw menyertakan pengidentifikasi model perangkat Apple untuk nama yang mudah dipahami di aplikasi macOS.
title: Basis data model perangkat
x-i18n:
    generated_at: "2026-07-12T14:38:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

UI **Instances** pada aplikasi pendamping macOS memetakan pengidentifikasi model Apple ke nama yang mudah dikenali (`iPad16,6` -> "iPad Pro 13 inci (M4)", `Mac16,6` -> "MacBook Pro (14 inci, 2024)"). `DeviceModelCatalog` juga menggunakan prefiks pengidentifikasi (dengan keluarga perangkat sebagai fallback) untuk memilih SF Symbol bagi setiap perangkat.

Berkas di `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Berkas                                 | Tujuan                                         |
| -------------------------------------- | ---------------------------------------------- |
| `ios-device-identifiers.json`          | Pemetaan pengidentifikasi iOS/iPadOS -> nama   |
| `mac-device-identifiers.json`          | Pemetaan pengidentifikasi Mac -> nama          |
| `NOTICE.md`                            | SHA commit upstream yang disematkan             |
| `LICENSE.apple-device-identifiers.txt` | Lisensi MIT upstream                           |

## Sumber data

Disertakan dari repositori GitHub `kyle-seongwoo-jun/apple-device-identifiers` yang berlisensi MIT. Berkas JSON disematkan ke SHA commit yang dicatat dalam `NOTICE.md` agar build tetap deterministik.

## Memperbarui basis data

1. Pilih SHA commit upstream yang akan disematkan (satu untuk iOS dan satu untuk macOS).
2. Perbarui `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` dengan SHA baru.
3. Unduh ulang berkas JSON yang disematkan ke commit tersebut:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Pastikan `LICENSE.apple-device-identifiers.txt` masih sesuai dengan upstream; ganti jika lisensi upstream berubah.
5. Verifikasi bahwa aplikasi macOS berhasil di-build tanpa masalah:

```bash
swift build --package-path apps/macos
```

## Terkait

- [Node](/id/nodes)
- [Pemecahan masalah Node](/id/nodes/troubleshooting)
