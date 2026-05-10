---
read_when:
    - Bir mesajlaşma kanalı Plugin bileşeni oluşturuyor veya yeniden düzenliyorsunuz
    - Nihai yanıtın dayanıklı şekilde teslimi, alındılar, canlı önizlemenin sonlandırılması veya alma onayı ilkesi gerekir
    - Eski yanıt işlem hattından veya gelen yanıt yönlendirme yardımcılarından geçiş yapıyorsunuz
summary: Kanal Plugin'leri için mesaj yaşam döngüsü API'si; kalıcı gönderimler, alındı bilgileri, canlı önizleme, alma onayı politikası ve eski sistem geçişi dahil
title: Kanal mesajı API'si
x-i18n:
    generated_at: "2026-05-10T19:47:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Kanal pluginleri `openclaw/plugin-sdk/channel-message` üzerinden bir `message`
adaptörü sunmalıdır. Adaptör, platformun desteklediği yerel mesaj yaşam
döngüsünü açıklar:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Çekirdek kuyruklama, dayanıklılık, genel yeniden deneme politikası, hook'lar,
alındılar ve paylaşılan `message` aracının sahibidir. Plugin; yerel
gönderme/düzenleme/silme çağrılarının, hedef normalleştirmenin, platform
iş parçacıklarının, seçili alıntıların, bildirim bayraklarının, hesap durumunun
ve platforma özgü yan etkilerin sahibidir.

Bu sayfayı [Kanal pluginleri oluşturma](/tr/plugins/sdk-channel-plugins) ile
birlikte kullanın.

`channel-message` alt yolu, `channel.ts` gibi sıcak plugin önyükleme dosyaları
için özellikle yeterince düşük maliyetlidir: giden teslimatı yüklemeden adaptör
sözleşmelerini, yetenek kanıtlarını, alındıları ve uyumluluk cephelerini sunar.
Çalışma zamanı teslimat yardımcıları, zaten zaman uyumsuz mesaj I/O yapan
izleme/gönderme kod yolları için `openclaw/plugin-sdk/channel-message-runtime`
üzerinden kullanılabilir.

Yeni kanal ve plugin gönderme kodu, `openclaw/plugin-sdk/channel-message-runtime`
üzerindeki mesaj yaşam döngüsü yardımcılarını kullanmalıdır:
`sendDurableMessageBatch`, `withDurableMessageSendContext` veya
`deliverInboundReplyWithMessageSendContext`. `openclaw/plugin-sdk/outbound-runtime`
içindeki eski `deliverOutboundPayloads(...)` yardımcısı; giden iç mekanizmalar,
kurtarma ve eski adaptörler için kullanımdan kaldırılmış bir uyumluluk/çalışma
zamanı alt katmanıdır. Yeni kanal veya plugin gönderme yolları için kullanmayın.

`sendDurableMessageBatch(...)` açık bir yaşam döngüsü sonucu döndürür:

- `sent` - en az bir görünür platform mesajı teslim edildi.
- `suppressed` - hiçbir platform mesajı eksik olarak ele alınmamalıdır. Kararlı
  nedenler arasında `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity` ve eski `no_visible_result` bulunur.
- `partial_failed` - sonraki bir yük veya yan etki başarısız olmadan önce en az
  bir platform mesajı teslim edildi. Sonuç, teslim edilen alındı önekini ve
  hatayı içerir.
- `failed` - hiçbir platform alındısı üretilmedi.

Bir toplu işlem gönderilmiş, bastırılmış ve başarısız yükleri karıştırdığında
`payloadOutcomes` kullanın. Eski doğrudan teslimat dizisinin boş olup olmadığına
bakarak hook iptalini çıkarsamayın.

Hala arabelleğe alınmış yanıt dağıtıcısına ihtiyaç duyan uyumluluk dağıtıcıları,
`openclaw/plugin-sdk/channel-message` üzerinden
`createChannelMessageReplyPipeline(...)` ile yanıt öneki seçenekleri oluşturmalı,
ardından çalışma zamanının `channel.turn.runPrepared(...)` çağrısını yapmalıdır.
Bu, oturum kaydını ve dağıtım sıralamasını başka bir genel turn sarmalayıcısı
eklemeden paylaşılan turn yaşam döngüsünde tutar.

## Minimal adaptör

Yeni kanal pluginlerinin çoğu küçük bir adaptörle başlayabilir:

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

Ardından bunu kanal pluginine ekleyin:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Yalnızca adaptörün gerçekten koruduğu yetenekleri bildirin. Bildirilen her
yetenek için bir sözleşme testi olmalıdır.

## Giden köprüsü

Kanalda zaten uyumlu bir `outbound` adaptörü varsa, gönderme kodunu çoğaltmak
yerine mesaj adaptörünü ondan türetmeyi tercih edin:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Köprü, eski giden gönderme sonuçlarını `MessageReceipt` değerlerine dönüştürür.
Yeni kod alındıları uçtan uca taşımalı ve eski kimlikleri yalnızca uyumluluk
sınırlarında `listMessageReceiptPlatformIds(...)` veya
`resolveMessageReceiptPrimaryId(...)` ile türetmelidir.
Alma politikası sağlanmazsa, `createChannelMessageAdapterFromOutbound(...)`
`manual` alma onayı politikasını kullanır. Bu, webhook'ları, soketleri veya yoklama
ofsetlerini genel alma bağlamının dışında onaylayan kanalları değiştirmeden,
pluginin sahip olduğu platform onayını açık hale getirir.

## Mesaj aracı göndermeleri

Paylaşılan `message(action="send")` yolu, son yanıtlarla aynı çekirdek teslimat
yaşam döngüsünü kullanmalıdır. Bir kanal araç gönderimi için sağlayıcıya özgü
şekillendirmeye ihtiyaç duyuyorsa, `actions.handleAction(...)` içinden göndermek
yerine `actions.prepareSendPayload(...)` uygulayın.

`prepareSendPayload(...)`, normalleştirilmiş çekirdek `ReplyPayload` değerini
ve tam eylem bağlamını alır. Kanal özel verilerini
`payload.channelData.<channel>` içinde taşıyan bir yük döndürün ve çekirdeğin
`sendMessage(...)`, mesaj yaşam döngüsü çalışma zamanını, önceden yazma kuyruğunu,
mesaj gönderme hook'larını, yeniden denemeyi, kurtarmayı ve ack temizliğini
çağırmasına izin verin. Yaşam döngüsü çalışma zamanı, uyumluluk alt katmanı
olarak dahili şekilde `deliverOutboundPayloads(...)` çağırabilir, ancak kanal
pluginleri yeni gönderme davranışı için bunu doğrudan çağırmamalıdır.

Yalnızca gönderim dayanıklı bir yük olarak temsil edilemiyorsa, örneğin
serileştirilemeyen bir bileşen fabrikası içeriyorsa `null` döndürün. Çekirdek
uyumluluk için eski plugin eylem yedeğini korur, ancak yeni kanal gönderme
özellikleri dayanıklı yük verileri olarak ifade edilebilmelidir.

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

Giden adaptör daha sonra `sendPayload` içinde `payload.channelData.demo` değerini
okur. Bu, platforma özgü işleme pluginde kalırken çekirdeğin kalıcı hale getirme,
yeniden deneme, kurtarma, hook'lar ve ack üzerinde sahipliği korumasını sağlar.

Hazırlanmış `message(action="send")` yükleri ve genel son yanıt teslimatı,
varsayılan olarak en iyi çaba kuyruklama ile çekirdek teslimatı kullanır.
Gerekli dayanıklı kuyruklama yalnızca çekirdek, kanalın bir çökmeden sonra
sonucu bilinmeyen bir gönderimi uzlaştırabildiğini doğruladıktan sonra geçerlidir.
Adaptör `reconcileUnknownSend` uygulayamıyorsa, hazırlanmış gönderme yolunu en
iyi çaba olarak tutun; çekirdek yine de önceden yazma kuyruğunu deneyecektir,
ancak kuyruk kalıcılığı veya belirsiz çökme kurtarması gerekli teslimat
sözleşmesinin parçası değildir.

## Dayanıklı son yetenekler

Dayanıklı son teslimat her yan etki için isteğe bağlıdır. Çekirdek, yalnızca
adaptör yük ve teslimat seçeneklerinin gerektirdiği her yeteneği bildirdiğinde
genel dayanıklı teslimatı kullanır.

| Yetenek                | Ne zaman bildirilmeli                                                               |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Adaptör metin gönderebilir ve alındı döndürebilir.                                  |
| `media`                | Medya göndermeleri her görünür platform mesajı için alındı döndürür.                |
| `payload`              | Adaptör yalnızca metin ve tek medya URL'si değil, zengin yanıt yükü semantiğini korur. |
| `replyTo`              | Yerel yanıt hedefleri platforma ulaşır.                                              |
| `thread`               | Yerel iş parçacığı, konu veya kanal iş parçacığı hedefleri platforma ulaşır.         |
| `silent`               | Bildirim bastırma platforma ulaşır.                                                  |
| `nativeQuote`          | Seçili alıntı meta verileri platforma ulaşır.                                        |
| `messageSendingHooks`  | Çekirdek mesaj gönderme hook'ları platform I/O öncesinde içeriği iptal edebilir veya yeniden yazabilir. |
| `batch`                | Çok parçalı işlenmiş toplu işlemler tek bir dayanıklı plan olarak yeniden oynatılabilir. |
| `reconcileUnknownSend` | Adaptör `unknown_after_send` kurtarmasını kör yeniden oynatma olmadan çözebilir.     |
| `afterSendSuccess`     | Kanala yerel gönderim sonrası yan etkiler bir kez çalışır.                           |
| `afterCommit`          | Kanala yerel commit sonrası yan etkiler bir kez çalışır.                             |

En iyi çaba son teslimatı `reconcileUnknownSend` gerektirmez; adaptör yükün
görünür semantiğini koruduğunda paylaşılan yaşam döngüsünü kullanır ve kuyruk
kalıcılığı kullanılamıyorsa doğrudan platform I/O yedeğine döner. Gerekli
dayanıklı son teslimat açıkça `reconcileUnknownSend` gerektirmelidir. Adaptör,
başlatılmış/bilinmeyen bir gönderimin platforma ulaşıp ulaşmadığını
belirleyemiyorsa, bu yeteneği bildirmeyin; çekirdek gerekli dayanıklı teslimatı
kuyruğa almadan önce reddeder.

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
değerini yalnızca genel mesaj gönderme hook'larını kasıtlı olarak çalıştıramayan
bir yol için ayarlayın.

## Dayanıklı gönderme sözleşmesi

Dayanıklı son gönderimin semantiği, eski kanal sahipli teslimattan daha sıkıdır:

- Platform I/O öncesinde dayanıklı niyeti oluşturun.
- Dayanıklı teslimat işlenmiş bir sonuç döndürürse, eski göndermeye geri düşmeyin.
- Hook iptalini ve göndermeme sonuçlarını terminal kabul edin.
- `unsupported` değerini yalnızca niyet öncesi sonuç olarak ele alın.
- Gerekli dayanıklılık için, kuyruk platform gönderiminin başladığını
  kaydedemiyorsa platform I/O öncesinde başarısız olun.
- Gerekli son teslimat ve gerekli hazırlanmış mesaj aracı göndermeleri için
  `reconcileUnknownSend` ön denetimi yapın; kurtarma, zaten gönderilmiş bir
  mesajı ack edebilmeli veya yalnızca adaptör özgün gönderimin gerçekleşmediğini
  kanıtladıktan sonra yeniden oynatabilmelidir.
- `best_effort` için kuyruk yazma hataları doğrudan platform I/O yedeğine dönebilir.
- İptal sinyallerini medya yükleme ve platform göndermelerine iletin.
- Commit sonrası hook'ları kuyruk ack sonrasında çalıştırın; doğrudan en iyi çaba
  yedeği, dayanıklı kuyruk commit'i olmadığı için bunları başarılı platform I/O
  sonrasında çalıştırır.
- Her görünür platform mesaj kimliği için alındı döndürün.
- Bir platform belirsiz bir gönderimin kullanıcıya zaten ulaşıp ulaşmadığını
  kontrol edebiliyorsa `reconcileUnknownSend` kullanın.

Bu sözleşme, çökmelerden sonra yinelenen göndermeleri önler ve mesaj gönderme
iptal hook'larının atlanmasını engeller.

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

Mevcut bir gönderme sonucunu uyarlarken `createMessageReceiptFromOutboundResults(...)` kullanın. Canlı önizleme mesajı nihai alındı bilgisine dönüştüğünde `createPreviewMessageReceipt(...)` kullanın. Yeni sahip-yerel `messageIds` alanları eklemekten kaçının. Eski `ChannelDeliveryResult.messageIds`, uyumluluk sınırlarında hâlâ üretilir.

## Canlı önizleme

Taslak önizlemeleri veya ilerleme güncellemelerini akış olarak ileten kanallar canlı yetenekler bildirmelidir:

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

Çalışma zamanı nihai hale getirme için `defineFinalizableLivePreviewAdapter(...)` ve `deliverWithFinalizableLivePreviewAdapter(...)` kullanın. Nihai hale getirici, son yanıtın önizlemeyi yerinde düzenleyip düzenlemeyeceğine, normal bir yedeğe başvurup başvurmayacağına, bekleyen önizleme durumunu atıp atmayacağına, mesajı çoğaltmadan belirsiz bir başarısız düzenlemeyi koruyup korumayacağına karar verir ve nihai alındı bilgisini döndürür.

## Alma onayı ilkesi

Platform onayı zamanlamasını denetleyen gelen alıcılar alma ilkesini bildirmelidir:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Alma ilkesi bildirmeyen adaptörler varsayılan olarak şunu kullanır:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Platformda ertelenecek bir onay yoksa, platform eşzamansız işlemden önce zaten onay veriyorsa veya protokole özgü yanıt semantiği gerekiyorsa varsayılanı kullanın. Aşamalı ilkelerden birini yalnızca alıcı, platform onayını daha sonraya taşımak için gerçekten alma bağlamını kullanıyorsa bildirin.

İlkeler:

| İlke                   | Ne zaman kullanılır                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `after_receive_record` | Platform, gelen olay ayrıştırılıp kaydedildikten sonra onaylanabilir.                  |
| `after_agent_dispatch` | Platform, aracı dağıtımı kabul edilene kadar beklemelidir.                             |
| `after_durable_send`   | Platform, nihai teslimat için kalıcı bir karar verilene kadar beklemelidir.            |
| `manual`               | Platform semantiği genel bir aşamayla eşleşmediği için onay Plugin'e aittir.           |

Onay durumunu erteleyen alıcılarda `createMessageReceiveContext(...)` kullanın ve alıcının bir aşamanın yapılandırılmış ilkeyi karşılayıp karşılamadığını test etmesi gerektiğinde `shouldAckMessageAfterStage(...)` kullanın.

## Sözleşme testleri

Yetenek bildirimleri Plugin sözleşmesinin parçasıdır. Bunları testlerle destekleyin:

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

Adaptör bu özellikleri bildiriyorsa canlı ve alma kanıtı paketleri ekleyin. Eksik bir kanıt, kalıcı yüzeyi sessizce genişletmek yerine testi başarısız kılmalıdır.

## Kullanımdan kaldırılmış uyumluluk API'leri

Bu API'ler üçüncü taraf uyumluluğu için içe aktarılabilir durumda kalır. Yeni kanal kodu için bunları kullanmayın.

| Kullanımdan kaldırılmış API                  | Yerine kullanılacak                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                           |
| `createChannelTurnReplyPipeline(...)`        | Uyumluluk dağıtıcıları için `createChannelMessageReplyPipeline(...)` veya yeni kanal kodu için bir `message` adaptörü           |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` artı `channel.turn.runPrepared(...)` veya yeni kanal kodu için bir `message` adaptörü |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` artı `channel.turn.runPrepared(...)` veya yeni kanal kodu için bir `message` adaptörü |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` artı `channel.turn.runPrepared(...)` veya yeni kanal kodu için bir `message` adaptörü |
| `deliverOutboundPayloads(...)`               | `channel-message-runtime` içinden `sendDurableMessageBatch(...)` veya `deliverInboundReplyWithMessageSendContext(...)`         |
| `deliverDurableInboundReplyPayload(...)`     | `openclaw/plugin-sdk/channel-message-runtime` içinden `deliverInboundReplyWithMessageSendContext(...)`                         |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` artı `channel.turn.runPrepared(...)` veya yeni kanal kodu için bir `message` adaptörü |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` artı `channel.turn.runPrepared(...)` veya yeni kanal kodu için bir `message` adaptörü |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                             |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` artı `deliverWithFinalizableLivePreviewAdapter(...)`                                |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                    |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                                   |

Uyumluluk dağıtıcıları, mesaj cephesi üzerinden `createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)` ve `createTypingCallbacks(...)` kullanmaya devam edebilir. Yeni yaşam döngüsü kodu eski `channel-reply-pipeline` alt yolundan kaçınmalıdır.

## Geçiş kontrol listesi

1. Kanal Plugin'ine `message: defineChannelMessageAdapter(...)` veya `message: createChannelMessageAdapterFromOutbound(...)` ekleyin.
2. Metin, medya ve yük gönderimlerinden `MessageReceipt` döndürün.
3. Yalnızca yerel davranış ve testlerle desteklenen yetenekleri bildirin.
4. Elle yazılmış kalıcı gereksinim eşlemlerini `deriveDurableFinalDeliveryRequirements(...)` ile değiştirin.
5. Kanal taslak mesajları yerinde düzenlediğinde önizleme nihai hale getirmeyi canlı önizleme yardımcıları üzerinden taşıyın.
6. Alma onayı ilkesini yalnızca alıcı platform onayını gerçekten erteleyebiliyorsa bildirin.
7. Eski yanıt dağıtım yardımcılarını yalnızca uyumluluk sınırlarında tutun.
