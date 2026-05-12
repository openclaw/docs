---
read_when:
    - Herhangi bir kanalda tepkilerle çalışma
    - Emoji tepkilerinin platformlar arasında nasıl farklılık gösterdiğini anlama
summary: Desteklenen tüm kanallarda tepki aracının semantiği
title: Tepkiler
x-i18n:
    generated_at: "2026-05-12T01:00:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

Aracı, `react` eylemiyle `message` aracını kullanarak iletilere emoji tepkileri ekleyip kaldırabilir. Tepki davranışı kanala ve aktarıma göre değişir.

## Nasıl çalışır?

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Tepki eklerken `emoji` zorunludur.
- Botun tepki(ler)ini kaldırmak için `emoji` değerini boş dize (`""`) olarak ayarlayın.
- Belirli bir emojiyi kaldırmak için `remove: true` değerini ayarlayın (boş olmayan `emoji` gerektirir).
- Durum tepkilerini destekleyen kanallarda, bir tepkide `trackToolCalls: true`, çalışma zamanının aynı tur içinde sonraki araç ilerleme tepkileri için tepki verilen bu iletiyi kullanmasına olanak tanır.

## Kanal davranışı

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - Boş `emoji`, iletideki botun tüm tepkilerini kaldırır.
    - `remove: true` yalnızca belirtilen emojiyi kaldırır.

  </Accordion>

  <Accordion title="Google Chat">
    - Boş `emoji`, iletideki uygulamanın tepkilerini kaldırır.
    - `remove: true` yalnızca belirtilen emojiyi kaldırır.

  </Accordion>

  <Accordion title="Telegram">
    - Boş `emoji`, botun tepkilerini kaldırır.
    - `remove: true` tepkileri de kaldırır, ancak araç doğrulaması için yine de boş olmayan bir `emoji` gerektirir.

  </Accordion>

  <Accordion title="WhatsApp">
    - Boş `emoji`, bot tepkisini kaldırır.
    - `remove: true` dahili olarak boş emojiye eşlenir (araç çağrısında yine de `emoji` gerektirir).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Boş olmayan `emoji` gerektirir.
    - `remove: true` bu belirli emoji tepkisini kaldırır.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`, `remove` ve `list` eylemleriyle `feishu_reaction` aracını kullanın.
    - Ekleme/kaldırma `emoji_type` gerektirir; kaldırma ayrıca `reaction_id` gerektirir.

  </Accordion>

  <Accordion title="Signal">
    - Gelen tepki bildirimleri `channels.signal.reactionNotifications` tarafından denetlenir: `"off"` bunları devre dışı bırakır, `"own"` (varsayılan) kullanıcılar bot iletilerine tepki verdiğinde olay yayar ve `"all"` tüm tepkiler için olay yayar.

  </Accordion>

  <Accordion title="iMessage">
    - Giden tepkiler iMessage tapback'leridir (`love`, `like`, `dislike`, `laugh`, `emphasize` ve `question`).
    - Gelen tapback bildirimleri `channels.imessage.reactionNotifications` tarafından denetlenir: `"off"` bunları devre dışı bırakır, `"own"` (varsayılan) kullanıcılar bot tarafından yazılan iletilere tepki verdiğinde olay yayar ve `"all"` yetkili göndericilerden gelen tüm tapback'ler için olay yayar.

  </Accordion>
</AccordionGroup>

## Tepki düzeyi

Kanal başına `reactionLevel` yapılandırması, aracının tepkileri ne kadar geniş kullandığını denetler. Değerler genellikle `off`, `ack`, `minimal` veya `extensive` olur.

- [Telegram reactionLevel](/tr/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/tr/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Aracının her platformdaki iletilere ne kadar etkin tepki vereceğini ayarlamak için tek tek kanallarda `reactionLevel` değerini ayarlayın.

## İlgili

- [Aracı Gönderimi](/tr/tools/agent-send) — `react` içeren `message` aracı
- [Kanallar](/tr/channels) — kanala özel yapılandırma
