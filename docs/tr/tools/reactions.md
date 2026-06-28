---
read_when:
    - Herhangi bir kanalda tepkiler üzerinde çalışma
    - Emoji tepkilerinin platformlar arasında nasıl farklılık gösterdiğini anlama
summary: Desteklenen tüm kanallarda tepki aracı semantiği
title: Tepkiler
x-i18n:
    generated_at: "2026-06-28T01:25:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

Aracı, `react` eylemiyle `message` aracını kullanarak iletilere emoji tepkileri ekleyip kaldırabilir. Tepki davranışı kanala ve taşımaya göre değişir.

## Nasıl çalışır

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Tepki eklerken `emoji` zorunludur.
- Botun tepki(ler)ini kaldırmak için `emoji` değerini boş dize (`""`) olarak ayarlayın.
- Belirli bir emojiyi kaldırmak için `remove: true` ayarlayın (boş olmayan `emoji` gerektirir).
- Durum tepkilerini destekleyen kanallarda, bir tepkide `trackToolCalls: true`
  ayarı, çalışma zamanının aynı tur sırasında sonraki araç ilerleme tepkileri için
  bu tepki verilen iletiyi kullanmasına olanak tanır.

## Kanal davranışı

<AccordionGroup>
  <Accordion title="Discord ve Slack">
    - Boş `emoji`, iletide botun tüm tepkilerini kaldırır.
    - `remove: true` yalnızca belirtilen emojiyi kaldırır.

  </Accordion>

  <Accordion title="Google Chat">
    - Boş `emoji`, iletide uygulamanın tepkilerini kaldırır.
    - `remove: true` yalnızca belirtilen emojiyi kaldırır.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Yalnızca tepki ekleme: `emoji` zorunludur ve boş olmamalıdır.
    - Tepki kaldırma henüz desteklenmez; `remove: true` (veya boş `emoji`) içeren çağrılar, sessizce hiçbir şey yapmamak yerine açık bir hatayla reddedilir.
    - Talk botunun `reaction` özelliğiyle kaydedilmiş olmasını gerektirir (bkz. [Nextcloud Talk kanal belgeleri](/tr/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Boş `emoji`, botun tepkilerini kaldırır.
    - `remove: true` de tepkileri kaldırır ancak araç doğrulaması için yine de boş olmayan bir `emoji` gerektirir.

  </Accordion>

  <Accordion title="WhatsApp">
    - Boş `emoji`, bot tepkisini kaldırır.
    - `remove: true` dahili olarak boş emojiye eşlenir (araç çağrısında yine de `emoji` gerektirir).
    - WhatsApp'ta ileti başına bir bot tepki yuvası vardır; durum tepki güncellemeleri, birden çok emojiyi üst üste eklemek yerine bu yuvanın yerini alır.

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
    - Gelen tepki bildirimleri `channels.signal.reactionNotifications` tarafından denetlenir: `"off"` bunları devre dışı bırakır, `"own"` (varsayılan) kullanıcılar bot iletilerine tepki verdiğinde olaylar yayar ve `"all"` tüm tepkiler için olaylar yayar.

  </Accordion>

  <Accordion title="iMessage">
    - Giden tepkiler iMessage tapback'leridir (`love`, `like`, `dislike`, `laugh`, `emphasize` ve `question`).
    - Gelen tapback bildirimleri `channels.imessage.reactionNotifications` tarafından denetlenir: `"off"` bunları devre dışı bırakır, `"own"` (varsayılan) kullanıcılar bot tarafından yazılmış iletilere tepki verdiğinde olaylar yayar ve `"all"` yetkili gönderenlerden gelen tüm tapback'ler için olaylar yayar.

  </Accordion>
</AccordionGroup>

## Tepki düzeyi

Kanal başına `reactionLevel` yapılandırması, aracının tepkileri ne kadar geniş kapsamda kullandığını denetler. Değerler genellikle `off`, `ack`, `minimal` veya `extensive` olur.

- [Telegram reactionLevel](/tr/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/tr/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Aracının her platformda iletilere ne kadar etkin tepki vereceğini ayarlamak için tek tek kanallarda `reactionLevel` ayarlayın.

## İlgili

- [Aracı Gönderimi](/tr/tools/agent-send) — `react` içeren `message` aracı
- [Kanallar](/tr/channels) — kanala özgü yapılandırma
