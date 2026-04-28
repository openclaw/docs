---
read_when:
    - Herhangi bir kanalda reactions üzerinde çalışma
    - Emoji reactions’ın platformlar arasında nasıl farklılaştığını anlama
summary: Desteklenen tüm kanallarda Reaction aracı anlambilimi
title: Reactions
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T09:36:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
    source_path: tools/reactions.md
    workflow: 15
---

Ajan, `message`
aracını `react` eylemiyle kullanarak mesajlara emoji reaction ekleyebilir ve kaldırabilir. Reaction davranışı kanala göre değişir.

## Nasıl çalışır

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Reaction eklerken `emoji` gereklidir.
- Botun reaction’larını kaldırmak için `emoji` değerini boş bir dizeye (`""`) ayarlayın.
- Belirli bir emojiyi kaldırmak için `remove: true` ayarlayın (`emoji` boş olmamalıdır).

## Kanal davranışı

<AccordionGroup>
  <Accordion title="Discord ve Slack">
    - Boş `emoji`, botun mesaj üzerindeki tüm reaction’larını kaldırır.
    - `remove: true` yalnızca belirtilen emojiyi kaldırır.
  </Accordion>

  <Accordion title="Google Chat">
    - Boş `emoji`, uygulamanın mesaj üzerindeki reaction’larını kaldırır.
    - `remove: true` yalnızca belirtilen emojiyi kaldırır.
  </Accordion>

  <Accordion title="Telegram">
    - Boş `emoji`, botun reaction’larını kaldırır.
    - `remove: true` da reaction’ları kaldırır, ancak araç doğrulaması için yine de boş olmayan bir `emoji` gerektirir.
  </Accordion>

  <Accordion title="WhatsApp">
    - Boş `emoji`, bot reaction’ını kaldırır.
    - `remove: true`, dahili olarak boş emojiye eşlenir (araç çağrısında yine de `emoji` gerektirir).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Boş olmayan `emoji` gerektirir.
    - `remove: true`, o belirli emoji reaction’ını kaldırır.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`, `remove` ve `list` eylemleriyle `feishu_reaction` aracını kullanın.
    - Ekleme/kaldırma `emoji_type` gerektirir; kaldırma ayrıca `reaction_id` de gerektirir.
  </Accordion>

  <Accordion title="Signal">
    - Gelen reaction bildirimleri `channels.signal.reactionNotifications` tarafından denetlenir: `"off"` bunları devre dışı bırakır, `"own"` (varsayılan) kullanıcılar bot mesajlarına reaction verdiğinde olay yayınlar ve `"all"` tüm reaction’lar için olay yayınlar.
  </Accordion>
</AccordionGroup>

## Reaction düzeyi

Kanal başına `reactionLevel` yapılandırması, ajanın reaction’ları ne kadar geniş kullandığını denetler. Değerler genellikle `off`, `ack`, `minimal` veya `extensive` olur.

- [Telegram reactionLevel](/tr/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/tr/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Ajanın her platformda mesajlara ne kadar aktif reaction vereceğini ayarlamak için `reactionLevel` değerini tek tek kanallarda ayarlayın.

## İlgili

- [Agent Send](/tr/tools/agent-send) — `react` içeren `message` aracı
- [Kanallar](/tr/channels) — kanala özgü yapılandırma
