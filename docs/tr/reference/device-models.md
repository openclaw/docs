---
read_when:
    - Cihaz model tanımlayıcı eşlemelerini veya NOTICE/lisans dosyalarını güncelleme
    - Instances UI'nın cihaz adlarını nasıl görüntülediğini değiştirme
summary: OpenClaw'ın macOS uygulamasında kolay anlaşılır adlar için Apple cihaz model tanımlayıcılarını nasıl vendored ettiği.
title: Cihaz model veritabanı
x-i18n:
    generated_at: "2026-04-24T09:29:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# Cihaz model veritabanı (kolay anlaşılır adlar)

macOS yardımcı uygulaması, Apple model tanımlayıcılarını (ör. `iPad16,6`, `Mac16,6`) okunabilir adlara eşleyerek **Instances** UI içinde kolay anlaşılır Apple cihaz model adlarını gösterir.

Eşleme şu dizin altında JSON olarak vendored edilir:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Veri kaynağı

Şu anda eşlemeyi MIT lisanslı şu depodan vendored ediyoruz:

- `kyle-seongwoo-jun/apple-device-identifiers`

Derlemeleri deterministik tutmak için JSON dosyaları belirli yukarı akış commit'lerine sabitlenir (`apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` içinde kaydedilir).

## Veritabanını güncelleme

1. Sabitlemek istediğiniz yukarı akış commit'lerini seçin (biri iOS, biri macOS için).
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` içindeki commit hash'lerini güncelleyin.
3. Bu commit'lere sabitlenmiş olarak JSON dosyalarını yeniden indirin:

```bash
IOS_COMMIT="<ios-device-identifiers.json için commit sha>"
MAC_COMMIT="<mac-device-identifiers.json için commit sha>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` dosyasının hâlâ yukarı akışla eşleştiğinden emin olun (yukarı akış lisansı değişirse değiştirin).
5. macOS uygulamasının temiz şekilde derlendiğini doğrulayın (uyarı yok):

```bash
swift build --package-path apps/macos
```

## İlgili

- [Node'lar](/tr/nodes)
- [Node sorun giderme](/tr/nodes/troubleshooting)
