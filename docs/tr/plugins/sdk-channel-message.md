---
summary: /plugins/sdk-channel-outbound adresine yönlendiriliyor
title: Kanal mesajı API'si
x-i18n:
    generated_at: "2026-07-12T12:39:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Bu sayfa [Kanal giden ileti API'si](/tr/plugins/sdk-channel-outbound) sayfasına taşındı.

`openclaw/plugin-sdk/channel-message` ve
`openclaw/plugin-sdk/channel-message-runtime`, eski pluginler için kullanımdan
kaldırılmış uyumluluk alt yolları olarak kalır; her ikisi de paylaşılan kanal
ileti çekirdeğinin ince takma adlarıdır. Yeni kanal pluginleri, kullanımdan
kaldırılmış alt yollara yeni yardımcılar eklemek yerine ileti yaşam döngüsü,
alındı bildirimi, kalıcı gönderim ve canlı önizleme yardımcıları için
`openclaw/plugin-sdk/channel-outbound` kullanmalıdır.

Kaldırma planı: Bu takma adları harici plugin geçiş dönemi boyunca koruyun;
çağıranlar `channel-outbound` yoluna taşındıktan sonra, bir sonraki büyük SDK
temizliğinde bunları kaldırın.
