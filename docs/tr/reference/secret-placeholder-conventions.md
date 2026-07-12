---
read_when:
    - Token, API anahtarı veya kimlik bilgisi parçacıkları içeren dokümantasyon yazma
    - Gizli bilgi algılama araçları tarafından taranabilecek örnekleri güncelleme
summary: Belgeler ve örnekler için gizli bilgi tarayıcılarına karşı güvenli yer tutucu kuralları
title: Gizli Bilgi Yer Tutucu Kuralları
x-i18n:
    generated_at: "2026-07-12T12:46:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Gizli bilgi yer tutucu kuralları

İnsanlar tarafından okunabilen ancak gerçek gizli bilgilere benzemeyen yer tutucular kullanın.

## Önerilen biçem

- `example-openai-key-not-real` veya `example-discord-bot-token` gibi açıklayıcı değerleri tercih edin.
- Kabuk komutu parçacıklarında, satır içine yazılmış belirteç benzeri dizeler yerine `${OPENAI_API_KEY}` kullanmayı tercih edin.
- Örneklerin açıkça sahte ve kullanım amacına (sağlayıcı, kanal, kimlik doğrulama türü) özgü olmasını sağlayın.

## Belgelerde bu kalıplardan kaçının

- Gerçek PEM özel anahtar üst bilgi veya alt bilgi metni.
- Canlı kimlik bilgilerine benzeyen `sk-...`, `xoxb-...`, `AKIA...` gibi ön ekler.
- Çalışma zamanı günlüklerinden kopyalanmış, gerçekçi görünen taşıyıcı belirteçler.

## Örnek

```bash
# İyi
export OPENAI_API_KEY="example-openai-key-not-real"

# Daha iyi (belge ortam değişkeni bağlantısı hakkındaysa)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
