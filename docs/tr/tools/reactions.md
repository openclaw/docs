---
read_when:
    - Herhangi bir kanalda tepkilerle çalışma
    - Emoji tepkilerinin platformlar arasında nasıl farklılık gösterdiğini anlamak
summary: Desteklenen tüm kanallarda tepki aracı semantiği
title: Tepkiler
x-i18n:
    generated_at: "2026-04-30T09:50:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

Ajan, `react` eylemiyle `message` aracını kullanarak mesajlara emoji tepkileri ekleyip kaldırabilir. Tepki davranışı kanala ve taşıma katmanına göre değişir.

## Nasıl çalışır

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Tepki eklerken `emoji` zorunludur.
- Botun tepki(ler)ini kaldırmak için `emoji` değerini boş dizeye (`""`) ayarlayın.
- Belirli bir emojiyi kaldırmak için `remove: true` ayarlayın (boş olmayan `emoji` gerektirir).

## Kanal davranışı

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - Boş `emoji`, mesajdaki bot tepkilerinin tümünü kaldırır.
    - `remove: true` yalnızca belirtilen emojiyi kaldırır.

  </Accordion>

  <Accordion title="Google Chat">
    - Boş `emoji`, uygulamanın mesajdaki tepkilerini kaldırır.
    - `remove: true` yalnızca belirtilen emojiyi kaldırır.

  </Accordion>

  <Accordion title="Telegram">
    - Boş `emoji`, botun tepkilerini kaldırır.
    - `remove: true` da tepkileri kaldırır, ancak araç doğrulaması için yine de boş olmayan bir `emoji` gerektirir.

  </Accordion>

  <Accordion title="WhatsApp">
    - Boş `emoji`, bot tepkisini kaldırır.
    - `remove: true` dahili olarak boş emojiye eşlenir (araç çağrısında yine de `emoji` gerektirir).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Boş olmayan `emoji` gerektirir.
    - `remove: true` söz konusu emoji tepkisini kaldırır.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`, `remove` ve `list` eylemleriyle `feishu_reaction` aracını kullanın.
    - Ekleme/kaldırma `emoji_type` gerektirir; kaldırma ayrıca `reaction_id` gerektirir.

  </Accordion>

  <Accordion title="Signal">
    - Gelen tepki bildirimleri `channels.signal.reactionNotifications` tarafından denetlenir: `"off"` bunları devre dışı bırakır, `"own"` (varsayılan) kullanıcılar bot mesajlarına tepki verdiğinde olaylar yayar ve `"all"` tüm tepkiler için olaylar yayar.

  </Accordion>
</AccordionGroup>

## Tepki düzeyi

Kanal başına `reactionLevel` yapılandırması, ajanın tepkileri ne kadar geniş kapsamlı kullandığını denetler. Değerler genellikle `off`, `ack`, `minimal` veya `extensive` olur.

- [Telegram reactionLevel](/tr/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/tr/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Ajanın her platformdaki mesajlara ne kadar etkin tepki vereceğini ayarlamak için tek tek kanallarda `reactionLevel` değerini ayarlayın.

## İlgili

- [Ajan Gönderimi](/tr/tools/agent-send) — `react` içeren `message` aracı
- [Kanallar](/tr/channels) — kanala özgü yapılandırma
