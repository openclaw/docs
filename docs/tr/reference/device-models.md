---
read_when:
    - Aygıt model tanımlayıcı eşlemelerini veya NOTICE/lisans dosyalarını güncelliyorsunuz
    - Instances kullanıcı arayüzünün aygıt adlarını nasıl gösterdiğini değiştiriyorsunuz
summary: OpenClaw'ın macOS uygulamasında kolay okunabilir adlar için Apple aygıt model tanımlayıcılarını nasıl dahil ettiği.
title: Aygıt Modeli Veritabanı
x-i18n:
    generated_at: "2026-04-05T14:05:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2
    source_path: reference/device-models.md
    workflow: 15
---

# Aygıt modeli veritabanı (kolay okunabilir adlar)

macOS yardımcı uygulaması, Apple model tanımlayıcılarını (ör. `iPad16,6`, `Mac16,6`) insan tarafından okunabilir adlarla eşleyerek **Instances** kullanıcı arayüzünde kolay okunabilir Apple aygıt modeli adlarını gösterir.

Eşleme, şu dizin altında JSON olarak dahil edilir:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Veri kaynağı

Şu anda eşlemeyi MIT lisanslı şu depodan dahil ediyoruz:

- `kyle-seongwoo-jun/apple-device-identifiers`

Derlemeleri deterministik tutmak için JSON dosyaları belirli yukarı akış commit'lerine sabitlenir (`apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` içinde kaydedilir).

## Veritabanını güncelleme

1. Sabitlemek istediğiniz yukarı akış commit'lerini seçin (biri iOS, biri macOS için).
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` içindeki commit hash'lerini güncelleyin.
3. Bu commit'lere sabitlenmiş olarak JSON dosyalarını yeniden indirin:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` dosyasının hâlâ yukarı akışla eşleştiğinden emin olun (yukarı akış lisansı değişirse dosyayı değiştirin).
5. macOS uygulamasının temiz bir şekilde derlendiğini doğrulayın (uyarı olmadan):

```bash
swift build --package-path apps/macos
```
