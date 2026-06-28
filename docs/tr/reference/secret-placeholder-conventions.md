---
read_when:
    - Belirteçler, API anahtarları veya kimlik bilgisi parçacıkları içeren belgeler yazma
    - Gizli bilgi algılama araçları tarafından taranabilecek örnekleri güncelleme
summary: Belgeler ve örnekler için gizli bilgi tarayıcısına güvenli yer tutucu kuralları
title: Gizli Yer Tutucu Kuralları
x-i18n:
    generated_at: "2026-06-28T01:16:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Gizli değer yer tutucu kuralları

İnsan tarafından okunabilir olan ancak gerçek gizli değerlere benzemeyen yer tutucular kullanın.

## Önerilen stil

- `example-openai-key-not-real` veya `example-discord-bot-token` gibi açıklayıcı değerleri tercih edin.
- Kabuk parçacıkları için satır içi token benzeri dizeler yerine `${OPENAI_API_KEY}` tercih edin.
- Örnekleri açıkça sahte ve amaca göre kapsamlandırılmış tutun (sağlayıcı, kanal, kimlik doğrulama türü).

## Belgelerde bu kalıplardan kaçının

- Değişmez PEM özel anahtar üst bilgisi veya alt bilgisi metni.
- Canlı kimlik bilgilerine benzeyen önekler, örneğin `sk-...`, `xoxb-...`, `AKIA...`.
- Çalışma zamanı günlüklerinden kopyalanmış gerçekçi görünen bearer token'lar.

## Örnek

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
