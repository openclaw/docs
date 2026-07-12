---
read_when:
    - Bir mesajlaşma kanalı Plugin gönderim yolu oluşturuyor veya yeniden düzenliyorsunuz
    - Kalıcı nihai yanıt iletimine, alındı bildirimlerine, canlı önizlemenin sonlandırılmasına veya alım onayı politikasına ihtiyacınız var
    - channel-message, channel-message-runtime veya eski yanıt yönlendirme yardımcılarından geçiş yapıyorsunuz
summary: 'Kanal Pluginleri için giden ileti yaşam döngüsü API''si: bağdaştırıcılar, alındılar, kalıcı gönderimler, canlı önizleme ve yanıt işlem hattı yardımcıları'
title: Kanal giden API'si
x-i18n:
    generated_at: "2026-07-12T12:36:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Kanal Plugin’leri, giden ileti davranışını
`openclaw/plugin-sdk/channel-outbound` üzerinden sunar. Alma/bağlam/sevk
orkestrasyonu için `openclaw/plugin-sdk/channel-inbound` kullanın.

Çekirdek; kuyruğa alma, dayanıklılık, genel yeniden deneme politikası, kancalar, alındılar ve
paylaşılan `message` aracının sahibidir. Plugin ise yerel gönderme/düzenleme/silme çağrılarının,
hedef normalleştirmenin, platform ileti dizilerinin, seçili alıntıların, bildirim
bayraklarının, hesap durumunun ve platforma özgü yan etkilerin sahibidir.

## Adaptör

Çoğu Plugin bir `message` adaptörü tanımlar:

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

Yalnızca yerel aktarımın gerçekten koruduğu yetenekleri bildirin. Bildirilen
her gönderme, alındı, canlı önizleme ve alma onayı yeteneğini
bu alt yoldan dışa aktarılan sözleşme yardımcılarıyla kapsayın.

## Düz metin temizleme

Bir giden adaptörün desteklenen HTML biçimlendirme etiketlerini hafif metin
işaretlemesine dönüştürmesi gerektiğinde `sanitizeForPlainText(...)` kullanın.
Varsayılan ayar, mevcut sohbet tarzı kalın ve üstü çizili işaretlerini korur.
Yalnızca kanal sonucu Markdown olarak yeniden ayrıştırıyorsa
`{ style: "markdown" }` geçirin:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Markdown stili `**bold**` ve `~~strikethrough~~` kullanır; italik ve satır içi
kod, her iki stilde de `_italic_` ve ters tırnak işaretlerini korur. İşaret metnini
temizlemeden sonra yeniden yazmak yerine stili kanal sınırında seçin.

## Teslimat Kanıtı

Bir `MessageReceipt`, kanal adaptörü tarafından döndürülen sonucu kaydeder. Somut
platform ileti tanımlayıcıları, platformun gönderme yolunun iletiyi kabul ettiğini
gösterir; alıcının cihazında görüntülendiğini veya okunduğunu kanıtlamaz.
Platform ileti tanımlayıcıları olmayan alındılar yalnızca yerel alındı meta verileridir.
Okundu bilgisi veya cihaz teslimat durumu olan kanallar, bu olguları
kanala özgü ayrı bir yol üzerinden izlemelidir.

Bir kanal adaptörü, hatayı yeniden denemenin alıcı tarafından görülebilen bir
gönderimi çoğaltamayacağını ve sonuçlandırma yapabilen hiçbir çağrının başlamadığını
kanıtlayabiliyorsa `openclaw/plugin-sdk/error-runtime` üzerinden
`new PlatformMessageNotDispatchedError("...", { cause: error })` oluşturup fırlatın.
Böylece çekirdek, eski gönderme girişimi kanıtını temizleyebilir ve kuyruğa alınan amacı
güvenle yeniden deneyebilir. Bu iddiayı yalnızca son sevk sınırının sahibi olan adaptör
öne sürebilir. İşaretleyiciyi sonuçlandırma/gönderme çağrısı başladıktan veya belirsiz
bir sonuç döndürdükten sonra asla kullanmayın; yanlış işaretleme iletileri çoğaltabilir.

## Mevcut giden adaptörler

Kanalda zaten uyumlu bir `outbound` adaptörü varsa gönderme kodunu yinelemek
yerine ileti adaptörünü bundan türetin:

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

## Dayanıklı gönderimler

Çalışma zamanı gönderme yardımcıları da `channel-outbound` üzerinde bulunur:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- `resolveChannelDraftStreamingChunking(...)` gibi taslak akışı/ilerleme yardımcıları

`sendDurableMessageBatch(...)` tek bir açık sonuç döndürür:

| Sonuç            | Anlamı                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `sent`           | platform gönderme yolu tarafından en az bir görünür platform iletisi kabul edildi               |
| `suppressed`     | hiçbir platform iletisi eksik olarak değerlendirilmemelidir                                    |
| `partial_failed` | sonraki bir yük veya yan etki başarısız olmadan önce en az bir platform iletisi kabul edildi    |
| `failed`         | hiçbir platform alındısı üretilmedi                                                            |

Bir toplu işlem gönderilen, engellenen ve başarısız yükleri bir arada içeriyorsa
`payloadOutcomes` kullanın. Eski doğrudan teslimat sonucunun boş olmasından
kanca iptalini çıkarsamayın.

## Ertelenmiş teslimat kabulü

Çözümlenmiş bir hesap çekirdek tarafından yönetilen giden veya ertelenmiş teslimatı
güvenle kabul edemiyorsa `message.durableFinal.admitDeferredDelivery(...)` kullanın.
Çekirdek, kuyruk kalıcılığını atlayan yollar da dahil olmak üzere canlı giden işlerden
önce ve kurtarılan bir amacı yeniden oynatmadan önce bu kancayı eşzamanlı olarak çağırır.
Bağlam; `cfg`, `channel`, `to`, `accountId` ve `live` veya `recovery` değerli bir
`phase` içerir.

Devam etmek için `{ status: "allowed" }` döndürün. Teslimatın kalıcılaştırılmaması,
doğrudan gönderilmemesi veya yeniden oynatılmaması gerektiğinde
`{ status: "permanent_rejection", reason }` döndürün. Canlı ret; kuyruk oluşturma,
ileti kancaları veya platform işlerinden önce başarısız olur. Kurtarma reddi, kuyruğa
alınmış kaydı başarısız olarak işaretler ve uzlaştırma ile yeniden oynatmayı atlar.
Kancanın belirtilmemesi izin verildiği anlamına gelir.

Bu kanca, gönderme yolu değil eşzamanlı bir kabul kararıdır. Yalnızca önceden
yüklenmiş yapılandırmayı veya çalışma zamanı durumunu okuyun; ağ, dosya sistemi
veya başka eşzamansız G/Ç işlemleri gerçekleştirmeyin. Sözleşme testleri, her iki
aşamayı ve her iki sonuç çeşidini `openclaw/plugin-sdk/channel-outbound` üzerinden
`ChannelMessageDurableFinalAdapter` aracılığıyla sınamalıdır.

## Uyumluluk sevki

Gelen yanıt sevkini `channel-inbound` içindeki
`dispatchChannelInboundReply(...)` üzerinden oluşturun. Platform teslimatını teslimat
adaptöründe tutun; ileti adaptörleri, dayanıklı gönderimler, alındılar, canlı
önizleme ve yanıt işlem hattı seçenekleri için `channel-outbound` kullanın.
