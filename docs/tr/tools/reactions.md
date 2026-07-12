---
read_when:
    - Herhangi bir kanaldaki tepkiler üzerinde çalışma
    - Emoji tepkilerinin platformlar arasında nasıl farklılık gösterdiğini anlama
summary: Desteklenen tüm kanallarda tepki aracının semantiği
title: Tepkiler
x-i18n:
    generated_at: "2026-07-12T12:19:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

Aracı, `message` aracının `react` eylemiyle emoji tepkileri ekler ve kaldırır.
Davranış kanala göre değişir.

## Nasıl çalışır

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Tepki eklerken `emoji` zorunludur.
- Bunu destekleyen kanallarda botun tepkilerini kaldırmak için `emoji` değerini
  boş bir dize (`""`) olarak ayarlayın.
- Belirli bir emojiyi kaldırmak için `remove: true` olarak ayarlayın (`emoji`
  boş olmamalıdır).
- Durum tepkilerini destekleyen kanallarda bir tepkide `trackToolCalls: true`
  kullanılması, çalışma zamanının aynı turda sonraki araç ilerleme tepkileri
  için tepki verilen bu mesajı yeniden kullanmasına olanak tanır.

## Kanal davranışı

<AccordionGroup>
  <Accordion title="Discord ve Slack">
    - Boş `emoji`, mesajdaki tüm bot tepkilerini kaldırır.
    - `remove: true`, yalnızca belirtilen emojiyi kaldırır.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Yalnızca tepki ekleme desteklenir: `emoji` zorunludur ve boş olmamalıdır.
    - Tepki kaldırma henüz bir silme çağrısına bağlanmamıştır; `remove: true`, hiçbir işlem yapmadan sessizce geçmek yerine açık bir hatayla reddedilir.
    - Talk botunun `reaction` özelliğiyle kaydedilmiş olması gerekir (bkz. [Nextcloud Talk kanal belgeleri](/tr/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Boş `emoji`, botun tepkilerini kaldırır.
    - `remove: true` da tepkileri kaldırır ancak araç doğrulaması için yine de boş olmayan bir `emoji` gerektirir.

  </Accordion>

  <Accordion title="WhatsApp">
    - Boş `emoji`, bot tepkisini kaldırır.
    - `remove: true`, dahili olarak boş emojiye eşlenir (araç çağrısında yine de `emoji` gerektirir).
    - WhatsApp'ta mesaj başına bir bot tepki alanı vardır; yeni bir tepki göndermek, birden fazla emojiyi üst üste eklemek yerine mevcut tepkinin yerini alır.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Hem ekleme hem de kaldırma için boş olmayan bir `emoji` gerektirir.
    - `remove: true`, söz konusu emoji tepkisini kaldırır.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Ayrı bir araç yerine diğer kanallarla aynı `react` eylemini kullanır (mesaj tepki kimlikleri aracılığıyla ekleme/kaldırma/listeleme).
    - Ekleme işlemi, boş olmayan bir `emoji` gerektirir (bir Feishu `emoji_type` değerine eşlenir; ör. `SMILE`, `THUMBSUP`, `HEART`).
    - `remove: true`, boş olmayan bir `emoji` gerektirir ve botun bu emoji türüyle eşleşen kendi tepkisini kaldırır.
    - `clearAll: true` ile birlikte boş `emoji`, mesajdaki tüm bot tepkilerini kaldırır.

  </Accordion>

  <Accordion title="Signal">
    - Gelen tepki bildirimleri `channels.signal.reactionNotifications` tarafından denetlenir: `"off"` bunları devre dışı bırakır, `"own"` (varsayılan) kullanıcılar bot mesajlarına tepki verdiğinde olaylar yayınlar, `"all"` tüm tepkiler için olaylar yayınlar ve `"allowlist"` yalnızca `channels.signal.reactionAllowlist` içindeki göndericiler için olaylar yayınlar.

  </Accordion>

  <Accordion title="iMessage">
    - Giden tepkiler iMessage tapback'leridir (`love`, `like`, `dislike`, `laugh`, `emphasize` ve `question`); tepki eklemek için `emoji` bunlardan birine eşlenmelidir.
    - Tanınan bir tapback türü olmadan kullanılan `remove: true`, tüm tapback türlerini kaldırır; tanınan bir türle kullanıldığında yalnızca o türü kaldırır.

  </Accordion>
</AccordionGroup>

## Tepki düzeyi

Kanal başına `reactionLevel`, aracının kendi tepkilerini ne sıklıkta göndereceğini
sınırlar. Değerler: `off`, `ack`, `minimal` veya `extensive`.

- [Telegram tepki bildirimleri](/tr/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (varsayılan `minimal`)
- [WhatsApp tepki düzeyi](/tr/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (varsayılan `minimal`)
- [Signal tepkileri](/tr/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (varsayılan `minimal`)

## İlgili

- [Aracı Gönderimi](/tr/tools/agent-send) - `react` içeren `message` aracı
- [Kanallar](/tr/channels) - kanala özgü yapılandırma
