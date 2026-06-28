---
read_when:
    - Bir mesajlaşma kanalı Plugin gönderme yolunu oluşturuyor veya yeniden düzenliyorsunuz
    - Kalıcı nihai yanıt teslimi, alındı bildirimleri, canlı önizleme sonlandırması veya alma onayı ilkesi gerekiyor
    - channel-message, channel-message-runtime veya eski yanıt gönderim yardımcılarından geçiş yapıyorsunuz
summary: 'Kanal Plugin''leri için giden ileti yaşam döngüsü API''si: adaptörler, alındı bildirimleri, kalıcı gönderimler, canlı önizleme ve yanıt işlem hattı yardımcıları'
title: Kanal dışa giden API'si
x-i18n:
    generated_at: "2026-06-28T01:04:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Kanal Plugin'leri giden mesaj davranışını
`openclaw/plugin-sdk/channel-outbound` üzerinden sunmalıdır. Alma/bağlam/dağıtım orkestrasyonu için
`openclaw/plugin-sdk/channel-inbound` kullanın.

Kuyruğa alma, dayanıklılık, genel yeniden deneme ilkesi, hook'lar, alındılar ve paylaşılan
`message` aracı çekirdeğe aittir. Yerel gönderme/düzenleme/silme çağrıları, hedef
normalleştirmesi, platform iş parçacığı yönetimi, seçili alıntılar, bildirim bayrakları, hesap
durumu ve platforma özgü yan etkiler Plugin'e aittir.

## Bağdaştırıcı

Çoğu Plugin bir `message` bağdaştırıcısı tanımlar:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Yalnızca yerel aktarımın gerçekten koruduğu yetenekleri bildirin. Bildirilen her
send, receipt, live-preview ve receive-ack yeteneğini bu alt yoldan dışa aktarılan
sözleşme yardımcılarıyla kapsayın.

## Mevcut Giden Bağdaştırıcılar

Kanalda zaten uyumlu bir `outbound` bağdaştırıcısı varsa, gönderme kodunu çoğaltmak yerine message
bağdaştırıcısını ondan türetin:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Dayanıklı Gönderimler

Çalışma zamanı gönderme yardımcıları da `channel-outbound` üzerinde bulunur:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- `resolveChannelDraftStreamingChunking(...)` gibi taslak akış/ilerleme yardımcıları

`sendDurableMessageBatch(...)` açık bir sonuç döndürür:

- `sent`: en az bir görünür platform mesajı teslim edildi.
- `suppressed`: hiçbir platform mesajı eksik olarak değerlendirilmemelidir.
- `partial_failed`: daha sonraki bir payload veya yan etki başarısız olmadan önce en az bir platform mesajı teslim edildi.
- `failed`: hiçbir platform alındısı üretilmedi.

Bir toplu işlem gönderilmiş, bastırılmış ve başarısız payload'ları karıştırdığında
`payloadOutcomes` kullanın. Boş bir eski doğrudan teslim sonucundan hook iptalini çıkarsamayın.

## Uyumluluk Dağıtımı

Gelen yanıt dağıtımı `channel-inbound` içindeki
`dispatchChannelInboundReply(...)` üzerinden birleştirilmelidir. Platform
teslimini teslim bağdaştırıcısında tutun; message bağdaştırıcıları, dayanıklı gönderimler,
alındılar, canlı önizleme ve yanıt hattı seçenekleri için `channel-outbound` kullanın.
