---
read_when:
    - Herhangi bir kanalda tepkilerle çalışma
    - Emoji tepkilerinin platformlar arasında nasıl farklılık gösterdiğini anlama
summary: Desteklenen tüm kanallarda tepki aracı semantiği
title: Tepkiler
x-i18n:
    generated_at: "2026-05-03T21:39:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

Aracı, `react` eylemiyle `message` aracını kullanarak mesajlara emoji tepkileri ekleyip kaldırabilir. Tepki davranışı kanala ve aktarıma göre değişir.

## Nasıl çalışır

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Tepki eklerken `emoji` zorunludur.
- Botun tepki(leri)ni kaldırmak için `emoji` değerini boş bir dizeye (`""`) ayarlayın.
- Belirli bir emojiyi kaldırmak için `remove: true` ayarlayın (boş olmayan `emoji` gerektirir).
- Durum tepkilerini destekleyen kanallarda, bir tepkide `trackToolCalls: true`, çalışma zamanının aynı tur sırasında sonraki araç ilerleme tepkileri için tepki verilen bu mesajı kullanmasına olanak tanır.

## Kanal davranışı

<AccordionGroup>
  <Accordion title="Discord ve Slack">
    - Boş `emoji`, mesajdaki botun tüm tepkilerini kaldırır.
    - `remove: true` yalnızca belirtilen emojiyi kaldırır.

  </Accordion>

  <Accordion title="Google Chat">
    - Boş `emoji`, mesajdaki uygulamanın tepkilerini kaldırır.
    - `remove: true` yalnızca belirtilen emojiyi kaldırır.

  </Accordion>

  <Accordion title="Telegram">
    - Boş `emoji`, botun tepkilerini kaldırır.
    - `remove: true` da tepkileri kaldırır ancak araç doğrulaması için yine de boş olmayan bir `emoji` gerektirir.

  </Accordion>

  <Accordion title="WhatsApp">
    - Boş `emoji`, bot tepkisini kaldırır.
    - `remove: true` dahili olarak boş emojiye eşlenir (araç çağrısında yine de `emoji` gerektirir).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Boş olmayan `emoji` gerektirir.
    - `remove: true` ilgili belirli emoji tepkisini kaldırır.

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

Kanal başına `reactionLevel` yapılandırması, aracının tepkileri ne kadar geniş kapsamlı kullanacağını denetler. Değerler genellikle `off`, `ack`, `minimal` veya `extensive` olur.

- [Telegram reactionLevel](/tr/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/tr/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Aracının her platformda mesajlara ne kadar etkin tepki vereceğini ayarlamak için `reactionLevel` değerini tek tek kanallarda ayarlayın.

## İlgili

- [Aracı Gönderimi](/tr/tools/agent-send) — `react` içeren `message` aracı
- [Kanallar](/tr/channels) — kanala özgü yapılandırma
