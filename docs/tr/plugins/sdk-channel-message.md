---
read_when:
    - Bir mesajlaşma kanalı Plugin oluşturuyor veya yeniden yapılandırıyorsunuz
    - Nihai yanıtın güvenilir şekilde iletilmesine, alındı bilgilerine, canlı önizlemenin kesinleştirilmesine veya alma onayı politikasına ihtiyacınız var
    - Eski yanıt işlem hattından veya gelen yanıt yönlendirme yardımcılarından geçiş yapıyorsunuz
summary: Kanal Plugin'leri için mesaj yaşam döngüsü API'si; kalıcı gönderimler, alındı bilgileri, canlı önizleme, alma onayı politikası ve eski sistemden geçiş dahil
title: Kanal mesajı API'si
x-i18n:
    generated_at: "2026-05-06T09:24:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Kanal Plugin'leri, `openclaw/plugin-sdk/channel-message` üzerinden bir `message`
bağdaştırıcısı sunmalıdır. Bağdaştırıcı, platformun desteklediği yerel ileti
yaşam döngüsünü açıklar:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Çekirdek kuyruklama, dayanıklılık, genel yeniden deneme politikası, kancalar,
alındılar ve paylaşılan `message` aracına sahiptir. Plugin; yerel gönderme,
düzenleme, silme çağrılarına, hedef normalleştirmeye, platform iş parçacıklarına,
seçilen alıntılara, bildirim bayraklarına, hesap durumuna ve platforma özgü yan
etkilere sahiptir.

Bu sayfayı [Kanal Plugin'leri oluşturma](/tr/plugins/sdk-channel-plugins) ile
birlikte kullanın.

`channel-message` alt yolu, `channel.ts` gibi sıcak Plugin önyükleme dosyaları
için bilerek yeterince hafiftir: giden teslimatı yüklemeden bağdaştırıcı
sözleşmelerini, yetenek kanıtlarını, alındıları ve uyumluluk cephelerini sunar.
Çalışma zamanı teslimat yardımcıları, zaten eşzamansız ileti I/O yapan
izleme/gönderme kod yolları için
`openclaw/plugin-sdk/channel-message-runtime` üzerinden kullanılabilir.

## Minimal bağdaştırıcı

Yeni kanal Plugin'lerinin çoğu küçük bir bağdaştırıcıyla başlayabilir:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

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

Ardından bunu kanal Plugin'ine bağlayın:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Yalnızca bağdaştırıcının gerçekten koruduğu yetenekleri bildirin. Bildirilen her
yetenek için bir sözleşme testi olmalıdır.

## Giden köprüsü

Kanalın zaten uyumlu bir `outbound` bağdaştırıcısı varsa, gönderme kodunu
çoğaltmak yerine ileti bağdaştırıcısını türetmeyi tercih edin:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Köprü, eski giden gönderme sonuçlarını `MessageReceipt` değerlerine dönüştürür.
Yeni kod alındıları uçtan uca geçirmeli ve eski kimlikleri yalnızca
`listMessageReceiptPlatformIds(...)` veya `resolveMessageReceiptPrimaryId(...)`
ile uyumluluk sınırlarında türetmelidir.
Alma politikası sağlanmazsa, `createChannelMessageAdapterFromOutbound(...)`
`manual` alma onay politikasını kullanır. Bu, Webhook'ları, soketleri veya yoklama
ofsetlerini genel alma bağlamı dışında onaylayan kanalları değiştirmeden
Plugin'e ait platform onayını açık hale getirir.

## İleti aracı gönderimleri

Paylaşılan `message(action="send")` yolu, son yanıtlarla aynı çekirdek teslimat
yaşam döngüsünü kullanmalıdır. Bir kanalın araç gönderimi için sağlayıcıya özgü
şekillendirmeye ihtiyacı varsa, `actions.handleAction(...)` içinden göndermek
yerine `actions.prepareSendPayload(...)` uygulayın.

`prepareSendPayload(...)`, normalleştirilmiş çekirdek `ReplyPayload` ile tam
eylem bağlamını alır. `payload.channelData.<channel>` içinde kanala özgü veri
bulunan bir yük döndürün ve çekirdeğin `sendMessage(...)`,
`deliverOutboundPayloads(...)`, önceden yazma kuyruğu, ileti gönderme kancaları,
yeniden deneme, kurtarma ve ack temizliğini çağırmasına izin verin.

Yalnızca gönderim dayanıklı bir yük olarak temsil edilemiyorsa, örneğin
serileştirilemeyen bir bileşen fabrikası içerdiği için, `null` döndürün. Çekirdek
uyumluluk için eski Plugin eylem geri dönüşünü korur, ancak yeni kanal gönderme
özellikleri dayanıklı yük verisi olarak ifade edilebilmelidir.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

Giden bağdaştırıcı daha sonra `sendPayload` içinde `payload.channelData.demo`
okur. Bu, platforma özgü işlemeyi Plugin içinde tutarken çekirdeğin kalıcılık,
yeniden deneme, kurtarma, kancalar ve ack üzerinde sahiplik sürdürmesini sağlar.

Hazırlanmış `message(action="send")` yükleri ve genel son yanıt teslimatı,
varsayılan olarak en iyi çaba kuyruklamasıyla çekirdek teslimatını kullanır.
Gerekli dayanıklı kuyruklama yalnızca çekirdek, kanalın bir çökmeden sonra sonucu
bilinmeyen bir gönderimi uzlaştırabildiğini doğruladıktan sonra geçerlidir.
Bağdaştırıcı `reconcileUnknownSend` uygulayamıyorsa, hazırlanmış gönderme yolunu
en iyi çaba olarak tutun; çekirdek yine de önceden yazma kuyruğunu deneyecektir,
ancak kuyruk kalıcılığı veya belirsiz çökme kurtarması gerekli teslimat
sözleşmesinin parçası değildir.

## Dayanıklı son yetenekler

Dayanıklı son teslimat, yan etki başına isteğe bağlıdır. Çekirdek yalnızca
bağdaştırıcı yük ve teslimat seçenekleri için gereken her yeteneği bildirdiğinde
genel dayanıklı teslimatı kullanır.

| Yetenek                | Şu durumda bildirin                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Bağdaştırıcı metin gönderebilir ve bir alındı döndürebilir.                          |
| `media`                | Medya gönderimleri, her görünür platform iletisi için alındı döndürür.               |
| `payload`              | Bağdaştırıcı yalnızca metin ve tek bir medya URL'si değil, zengin yanıt yükü semantiğini korur. |
| `replyTo`              | Yerel yanıt hedefleri platforma ulaşır.                                              |
| `thread`               | Yerel iş parçacığı, konu veya kanal iş parçacığı hedefleri platforma ulaşır.         |
| `silent`               | Bildirim bastırma platforma ulaşır.                                                  |
| `nativeQuote`          | Seçili alıntı üst verileri platforma ulaşır.                                         |
| `messageSendingHooks`  | Çekirdek ileti gönderme kancaları, platform I/O öncesinde içeriği iptal edebilir veya yeniden yazabilir. |
| `batch`                | Çok parçalı işlenmiş toplu işler tek bir dayanıklı plan olarak yeniden oynatılabilir. |
| `reconcileUnknownSend` | Bağdaştırıcı `unknown_after_send` kurtarmasını körü körüne yeniden oynatma olmadan çözebilir. |
| `afterSendSuccess`     | Kanal yerel gönderim sonrası yan etkiler bir kez çalışır.                            |
| `afterCommit`          | Kanal yerel commit sonrası yan etkiler bir kez çalışır.                              |

En iyi çaba son teslimatı `reconcileUnknownSend` gerektirmez; bağdaştırıcı yükün
görünür semantiğini koruduğunda paylaşılan yaşam döngüsünü kullanır ve kuyruk
kalıcılığı kullanılamıyorsa doğrudan platform I/O'ya geri döner. Gerekli
dayanıklı son teslimat açıkça `reconcileUnknownSend` gerektirmelidir. Bağdaştırıcı
başlatılmış/bilinmeyen bir gönderimin platforma ulaşıp ulaşmadığını
belirleyemiyorsa, bu yeteneği bildirmeyin; çekirdek gerekli dayanıklı teslimatı
kuyruklamadan önce reddeder.

Bir çağıranın dayanıklı teslimata ihtiyacı olduğunda, haritaları elle oluşturmak
yerine gereksinimleri türetin:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` varsayılan olarak gereklidir. `messageSendingHooks: false`
değerini yalnızca genel ileti gönderme kancalarını bilerek çalıştıramayan bir yol
için ayarlayın.

## Dayanıklı gönderme sözleşmesi

Dayanıklı bir son gönderimin semantiği, eski kanal sahipli teslimattan daha
katıdır:

- Platform I/O öncesinde dayanıklı niyeti oluşturun.
- Dayanıklı teslimat işlenmiş bir sonuç döndürürse, eski gönderime geri dönmeyin.
- Kanca iptalini ve gönderimsiz sonuçları terminal olarak ele alın.
- `unsupported` değerini yalnızca niyet öncesi bir sonuç olarak ele alın.
- Gerekli dayanıklılık için, kuyruk platform gönderiminin başladığını kaydedemiyorsa platform I/O öncesinde başarısız olun.
- Gerekli son teslimat ve gerekli hazırlanmış ileti aracı gönderimleri için `reconcileUnknownSend` ön denetimi yapın; kurtarma, zaten gönderilmiş bir iletiyi ack edebilmeli veya yalnızca bağdaştırıcı özgün gönderimin gerçekleşmediğini kanıtladıktan sonra yeniden oynatabilmelidir.
- `best_effort` için kuyruk yazma hataları doğrudan platform I/O'ya geri dönebilir.
- İptal sinyallerini medya yüklemeye ve platform gönderimlerine iletin.
- Commit sonrası kancaları kuyruk ack sonrasında çalıştırın; doğrudan en iyi çaba geri dönüşü, dayanıklı kuyruk commit'i olmadığı için bunları başarılı platform I/O sonrasında çalıştırır.
- Her görünür platform ileti kimliği için alındılar döndürün.
- Bir platform belirsiz bir gönderimin kullanıcıya zaten ulaşıp ulaşmadığını denetleyebiliyorsa `reconcileUnknownSend` kullanın.

Bu sözleşme, çökmelerden sonra yinelenen gönderimleri ve ileti gönderme iptal
kancalarının atlanmasını önler.

## Alındılar

`MessageReceipt`, platformun kabul ettiği şeyin yeni dahili kaydıdır:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

Mevcut bir gönderme sonucunu uyarlarken `createMessageReceiptFromOutboundResults(...)`
kullanın. Bir canlı önizleme iletisi son alındı haline geldiğinde
`createPreviewMessageReceipt(...)` kullanın. Yeni sahip yerel `messageIds`
alanları eklemekten kaçının. Eski `ChannelDeliveryResult.messageIds` hâlâ
uyumluluk sınırlarında üretilir.

## Canlı önizleme

Taslak önizlemeleri veya ilerleme güncellemeleri akıtan kanallar canlı
yetenekleri bildirmelidir:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

Çalışma zamanı sonlandırması için `defineFinalizableLivePreviewAdapter(...)` ve
`deliverWithFinalizableLivePreviewAdapter(...)` kullanın. Sonlandırıcı, son yanıtın
önizlemeyi yerinde düzenleyip düzenlemeyeceğine, normal bir geri dönüş gönderip
göndermeyeceğine, bekleyen önizleme durumunu atıp atmayacağına, belirsiz başarısız
bir düzenlemeyi iletiyi çoğaltmadan tutup tutmayacağına karar verir ve son
alındıyı döndürür.

## Alma ack politikası

Platform onaylama zamanlamasını kontrol eden gelen alıcılar alma politikasını
bildirmelidir:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Alma politikası bildirmeyen bağdaştırıcıların varsayılanı şudur:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Platformun ertelenecek bir alındı bildirimi olmadığı, asenkron işlemeden önce zaten
alındı bildirdiği veya protokole özgü yanıt semantiğine ihtiyaç duyduğu durumlarda
varsayılanı kullanın. Aşamalı politikalardan birini yalnızca alıcı gerçekten
platform alındı bildirimini daha sonraya taşımak için alma bağlamını kullandığında
bildirin.

Politikalar:

| Politika               | Ne zaman kullanılır                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | Platform, gelen olay ayrıştırılıp kaydedildikten sonra alındı olarak bildirilebilir.     |
| `after_agent_dispatch` | Platform, agent gönderiminin kabul edilmesini beklemelidir.                              |
| `after_durable_send`   | Platform, son teslimatın dayanıklı bir karara ulaşmasını beklemelidir.                   |
| `manual`               | Platform semantiği genel bir aşamayla eşleşmediği için alındı bildirimini plugin yönetir. |

Alındılama durumunu erteleyen alıcılarda `createMessageReceiveContext(...)`
kullanın ve alıcının bir aşamanın yapılandırılmış politikayı karşılayıp
karşılamadığını test etmesi gerektiğinde `shouldAckMessageAfterStage(...)`
kullanın.

## Sözleşme testleri

Yetenek bildirimleri plugin sözleşmesinin parçasıdır. Bunları testlerle destekleyin:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

Adapter bu özellikleri bildiriyorsa canlı ve alma kanıt paketleri ekleyin. Eksik
bir kanıt, dayanıklı yüzeyi sessizce genişletmek yerine testi başarısız kılmalıdır.

## Kullanımdan kaldırılmış uyumluluk API'leri

Bu API'ler üçüncü taraf uyumluluğu için içe aktarılabilir kalır. Yeni kanal kodu
için bunları kullanmayın.

| Kullanımdan kaldırılmış API                  | Yerine kullanılacak                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | Uyumluluk göndericileri için `createChannelMessageReplyPipeline(...)` veya yeni kanal kodu için bir `message` adapter'ı |
| `deliverDurableInboundReplyPayload(...)`     | `openclaw/plugin-sdk/channel-message-runtime` içinden `deliverInboundReplyWithMessageSendContext(...)`              |
| `dispatchInboundReplyWithBase(...)`          | Yalnızca uyumluluk göndericileri için `dispatchChannelMessageReplyWithBase(...)`                                    |
| `recordInboundSessionAndDispatchReply(...)`  | Yalnızca uyumluluk göndericileri için `recordChannelMessageReplyDispatch(...)`                                      |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` artı `deliverWithFinalizableLivePreviewAdapter(...)`                     |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

Uyumluluk göndericileri, mesaj cephesi üzerinden hâlâ
`createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)` ve
`createTypingCallbacks(...)` kullanabilir. Yeni yaşam döngüsü kodu eski
`channel-reply-pipeline` alt yolundan kaçınmalıdır.

## Geçiş kontrol listesi

1. Kanal plugin'ine `message: defineChannelMessageAdapter(...)` veya
   `message: createChannelMessageAdapterFromOutbound(...)` ekleyin.
2. Metin, medya ve yük gönderimlerinden `MessageReceipt` döndürün.
3. Yalnızca yerel davranış ve testlerle desteklenen yetenekleri bildirin.
4. Elle yazılmış dayanıklı gereksinim eşlemelerini
   `deriveDurableFinalDeliveryRequirements(...)` ile değiştirin.
5. Kanal taslak mesajları yerinde düzenlediğinde önizleme sonlandırmayı canlı
   önizleme yardımcıları üzerinden taşıyın.
6. Alma alındılama politikasını yalnızca alıcı platform alındı bildirimini
   gerçekten erteleyebildiğinde bildirin.
7. Eski yanıt gönderim yardımcılarını yalnızca uyumluluk sınırlarında tutun.
