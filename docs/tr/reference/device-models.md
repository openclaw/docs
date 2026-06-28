---
read_when:
    - Aygıt model tanımlayıcı eşlemelerini veya NOTICE/lisans dosyalarını güncelleme
    - Instances UI'nın aygıt adlarını nasıl gösterdiğini değiştirme
summary: OpenClaw'ın macOS uygulamasında kolay okunur adlar için Apple aygıt model tanımlayıcılarını nasıl vendörlediği.
title: Aygıt model veritabanı
x-i18n:
    generated_at: "2026-04-25T13:56:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 15
    postprocess_version: locale-links-v1
---

macOS yardımcı uygulaması, Apple model tanımlayıcılarını (ör. `iPad16,6`, `Mac16,6`) insan tarafından okunabilir adlara eşleyerek **Instances** UI'sında kolay okunur Apple aygıt model adlarını gösterir.

Eşleme, şu konum altında JSON olarak vendörlenir:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Veri kaynağı

Şu anda eşlemeyi MIT lisanslı şu depodan vendörlüyoruz:

- `kyle-seongwoo-jun/apple-device-identifiers`

Derlemeleri deterministik tutmak için JSON dosyaları belirli upstream commit'lerine sabitlenir (`apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` içinde kaydedilir).

## Veritabanını güncelleme

1. Sabitlemek istediğiniz upstream commit'lerini seçin (biri iOS, biri macOS için).
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` içinde commit hash'lerini güncelleyin.
3. Bu commit'lere sabitlenmiş JSON dosyalarını yeniden indirin:

```bash
IOS_COMMIT="<ios-device-identifiers.json için commit sha>"
MAC_COMMIT="<mac-device-identifiers.json için commit sha>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` dosyasının hâlâ upstream ile eşleştiğinden emin olun (upstream lisansı değişirse değiştirin).
5. macOS uygulamasının temiz şekilde derlendiğini doğrulayın (uyarı olmadan):

```bash
swift build --package-path apps/macos
```

## İlgili

- [Node'lar](/tr/nodes)
- [Node sorun giderme](/tr/nodes/troubleshooting)
