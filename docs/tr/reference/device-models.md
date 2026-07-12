---
read_when:
    - Cihaz modeli tanımlayıcı eşlemelerini veya NOTICE/lisans dosyalarını güncelleme
    - Instances kullanıcı arayüzünün cihaz adlarını görüntüleme biçimini değiştirme
summary: OpenClaw'ın macOS uygulamasında kullanıcı dostu adlar için Apple cihaz modeli tanımlayıcılarını nasıl bünyesine kattığı.
title: Cihaz modeli veritabanı
x-i18n:
    generated_at: "2026-07-12T12:42:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

macOS yardımcı uygulamasının **Örnekler** kullanıcı arayüzü, Apple model tanımlayıcılarını anlaşılır adlarla eşler (`iPad16,6` -> "iPad Pro 13 inç (M4)", `Mac16,6` -> "MacBook Pro (14 inç, 2024)"). `DeviceModelCatalog` ayrıca her cihaz için bir SF Symbol seçmek üzere tanımlayıcı önekini (bulamazsa cihaz ailesini) kullanır.

`apps/macos/Sources/OpenClaw/Resources/DeviceModels/` içindeki dosyalar:

| Dosya                                  | Amaç                                       |
| -------------------------------------- | ------------------------------------------ |
| `ios-device-identifiers.json`          | iOS/iPadOS tanımlayıcısı -> ad eşlemesi    |
| `mac-device-identifiers.json`          | Mac tanımlayıcısı -> ad eşlemesi            |
| `NOTICE.md`                            | Sabitlenmiş üst kaynak commit SHA'ları      |
| `LICENSE.apple-device-identifiers.txt` | Üst kaynağın MIT lisansı                    |

## Veri kaynağı

MIT lisanslı `kyle-seongwoo-jun/apple-device-identifiers` GitHub deposundan projeye dahil edilmiştir. Derlemelerin belirlenimci olmasını sağlamak için JSON dosyaları, `NOTICE.md` içinde kaydedilen commit SHA'larına sabitlenmiştir.

## Veritabanını güncelleme

1. Sabitlenecek üst kaynak commit SHA'larını seçin (biri iOS, biri macOS için).
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` dosyasını yeni SHA'larla güncelleyin.
3. Bu commit'lere sabitlenmiş JSON dosyalarını yeniden indirin:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `LICENSE.apple-device-identifiers.txt` dosyasının hâlâ üst kaynakla eşleştiğini doğrulayın; üst kaynak lisansı değiştiyse dosyayı değiştirin.
5. macOS uygulamasının sorunsuz derlendiğini doğrulayın:

```bash
swift build --package-path apps/macos
```

## İlgili

- [Node'lar](/tr/nodes)
- [Node sorunlarını giderme](/tr/nodes/troubleshooting)
