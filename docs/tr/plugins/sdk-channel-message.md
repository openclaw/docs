---
summary: /plugins/sdk-channel-outbound adresine yönlendir
title: Kanal mesaj API'si
x-i18n:
    generated_at: "2026-06-28T01:04:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Bu sayfa [Kanal giden API’si](/tr/plugins/sdk-channel-outbound) konumuna taşındı.

`openclaw/plugin-sdk/channel-message` ve
`openclaw/plugin-sdk/channel-message-runtime`, eski plugin’ler için kullanımdan kaldırılmış uyumluluk
alt yolları olarak kalır. Yeni kanal plugin’leri mesaj yaşam döngüsü, alındı bilgisi, dayanıklı
gönderim ve canlı önizleme yardımcıları için
`openclaw/plugin-sdk/channel-outbound` kullanmalıdır. Kullanımdan kaldırılan alt yollar,
paylaşılan kanal mesajı çekirdeği ve odaklanmış gelen/giden SDK yüzeyleri üzerinde ince alias’lardır;
buraya yeni yardımcılar eklemeyin.

Kaldırma planı: Bu alias’ları harici plugin geçiş penceresi boyunca tutun,
ardından çağıranlar `channel-outbound` konumuna taşındıktan sonraki bir sonraki büyük SDK temizliğinde
kaldırın.
