---
read_when:
    - Herhangi bir kanalda reactions üzerinde çalışmak եք
    - Emoji reactions'ların platformlar arasında nasıl farklılaştığını anlama
summary: Desteklenen tüm kanallarda reaction aracının semantiği
title: Reactions
x-i18n:
    generated_at: "2026-04-11T02:47:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfac31b7f0effc89cc696e3cf34cd89503ccdbb28996723945025e4b6e159986
    source_path: tools/reactions.md
    workflow: 15
---

# Reactions

Agent, `message`
aracındaki `react` eylemini kullanarak mesajlara emoji reaction ekleyebilir ve kaldırabilir. Reaction davranışı kanala göre değişir.

## Nasıl çalışır

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Reaction eklerken `emoji` zorunludur.
- Botun reaction(larını) kaldırmak için `emoji` değerini boş dize (`""`) olarak ayarlayın.
- Belirli bir emojiyi kaldırmak için `remove: true` ayarlayın (`emoji` boş olmamalıdır).

## Kanal davranışı

<AccordionGroup>
  <Accordion title="Discord ve Slack">
    - Boş `emoji`, mesaj üzerindeki botun tüm reaction'larını kaldırır.
    - `remove: true`, yalnızca belirtilen emojiyi kaldırır.
  </Accordion>

  <Accordion title="Google Chat">
    - Boş `emoji`, uygulamanın mesaj üzerindeki reaction'larını kaldırır.
    - `remove: true`, yalnızca belirtilen emojiyi kaldırır.
  </Accordion>

  <Accordion title="Telegram">
    - Boş `emoji`, botun reaction'larını kaldırır.
    - `remove: true` de reaction'ları kaldırır, ancak araç doğrulaması için yine de boş olmayan bir `emoji` gerektirir.
  </Accordion>

  <Accordion title="WhatsApp">
    - Boş `emoji`, bot reaction'ını kaldırır.
    - `remove: true`, dahili olarak boş emojiye eşlenir (araç çağrısında yine de `emoji` gerekir).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Boş olmayan `emoji` gerektirir.
    - `remove: true`, o belirli emoji reaction'ını kaldırır.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`, `remove` ve `list` eylemleriyle `feishu_reaction` aracını kullanın.
    - Ekleme/kaldırma işlemleri `emoji_type` gerektirir; kaldırma ayrıca `reaction_id` da gerektirir.
  </Accordion>

  <Accordion title="Signal">
    - Gelen reaction bildirimleri `channels.signal.reactionNotifications` tarafından kontrol edilir: `"off"` bunları devre dışı bırakır, `"own"` (varsayılan) kullanıcılar bot mesajlarına reaction verdiğinde olay yayar ve `"all"` tüm reaction'lar için olay yayar.
  </Accordion>
</AccordionGroup>

## Reaction düzeyi

Kanal bazında `reactionLevel` yapılandırması, agent'ın reaction'ları ne kadar geniş kullandığını kontrol eder. Değerler tipik olarak `off`, `ack`, `minimal` veya `extensive` olur.

- [Telegram reactionLevel](/tr/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/tr/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Agent'ın her platformda mesajlara ne kadar aktif reaction vereceğini ayarlamak için `reactionLevel` değerini tek tek kanallarda belirleyin.

## İlgili

- [Agent Send](/tr/tools/agent-send) — `react` içeren `message` aracı
- [Channels](/tr/channels) — kanala özgü yapılandırma
