---
read_when:
    - Herhangi bir kanalda tepkiler üzerinde çalışıyorsunuz
    - Emoji tepkilerinin platformlar arasında nasıl farklılaştığını anlamak istiyorsunuz
summary: Desteklenen tüm kanallarda tepki aracının anlamları
title: Tepkiler
x-i18n:
    generated_at: "2026-04-05T14:12:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af2951eee32e73adb982dbdf39b32e4065993454e9cce2ad23b27565cab4f84
    source_path: tools/reactions.md
    workflow: 15
---

# Tepkiler

Ajan, `react` eylemiyle `message`
aracını kullanarak mesajlara emoji tepkileri ekleyebilir ve kaldırabilir. Tepki davranışı kanala göre değişir.

## Nasıl çalışır

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Tepki eklerken `emoji` gereklidir.
- Botun tepkisini/tepkilerini kaldırmak için `emoji` değerini boş bir dizeye (`""`) ayarlayın.
- Belirli bir emojiyi kaldırmak için `remove: true` ayarlayın (boş olmayan `emoji` gerektirir).

## Kanal davranışı

<AccordionGroup>
  <Accordion title="Discord ve Slack">
    - Boş `emoji`, mesajdaki botun tüm tepkilerini kaldırır.
    - `remove: true`, yalnızca belirtilen emojiyi kaldırır.
  </Accordion>

  <Accordion title="Google Chat">
    - Boş `emoji`, mesajdaki uygulamanın tepkilerini kaldırır.
    - `remove: true`, yalnızca belirtilen emojiyi kaldırır.
  </Accordion>

  <Accordion title="Telegram">
    - Boş `emoji`, botun tepkilerini kaldırır.
    - `remove: true` da tepkileri kaldırır ancak araç doğrulaması için yine de boş olmayan bir `emoji` gerektirir.
  </Accordion>

  <Accordion title="WhatsApp">
    - Boş `emoji`, bot tepkisini kaldırır.
    - `remove: true`, dahili olarak boş emojiye eşlenir (araç çağrısında yine de `emoji` gerektirir).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Boş olmayan `emoji` gerektirir.
    - `remove: true`, o belirli emoji tepkisini kaldırır.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`, `remove` ve `list` eylemlerine sahip `feishu_reaction` aracını kullanın.
    - Ekleme/kaldırma için `emoji_type` gerekir; kaldırma için ayrıca `reaction_id` da gerekir.
  </Accordion>

  <Accordion title="Signal">
    - Gelen tepki bildirimleri `channels.signal.reactionNotifications` tarafından kontrol edilir: `"off"` bunları devre dışı bırakır, `"own"` (varsayılan) kullanıcılar bot mesajlarına tepki verdiğinde olaylar üretir ve `"all"` tüm tepkiler için olaylar üretir.
  </Accordion>
</AccordionGroup>

## Tepki düzeyi

Kanal başına `reactionLevel` yapılandırması, ajanın tepkileri ne kadar geniş kapsamda kullandığını kontrol eder. Değerler genellikle `off`, `ack`, `minimal` veya `extensive` olur.

- [Telegram reactionLevel](/tr/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/tr/channels/whatsapp#reactions) — `channels.whatsapp.reactionLevel`

Ajanın her platformda mesajlara ne kadar etkin tepki vereceğini ayarlamak için `reactionLevel` değerini ayrı ayrı kanallarda ayarlayın.

## İlgili

- [Agent Send](/tr/tools/agent-send) — `react` içeren `message` aracı
- [Kanallar](/tr/channels) — kanala özgü yapılandırma
