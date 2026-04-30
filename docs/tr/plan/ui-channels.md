---
read_when:
    - Kanal mesajı kullanıcı arayüzünü, etkileşimli veri yüklerini veya yerel kanal işleyicilerini yeniden düzenleme
    - Mesaj aracı yeteneklerini, iletim ipuçlarını veya bağlamlar arası işaretleyicileri değiştirme
    - Discord Carbon içe aktarma yayılımında veya kanal Plugin çalışma zamanı tembelliğinde hata ayıklama
summary: Anlamsal mesaj sunumunu kanalın yerel kullanıcı arayüzü oluşturucularından ayırın.
title: Kanal sunumu yeniden düzenleme planı
x-i18n:
    generated_at: "2026-04-30T09:31:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## Durum

Paylaşılan ajan, CLI, Plugin yeteneği ve giden teslim yüzeyleri için uygulandı:

- `ReplyPayload.presentation` anlamsal ileti kullanıcı arayüzünü taşır.
- `ReplyPayload.delivery.pin` gönderilen ileti sabitleme isteklerini taşır.
- Paylaşılan ileti eylemleri, sağlayıcıya özgü `components`, `blocks`, `buttons` veya `card` yerine `presentation`, `delivery` ve `pin` alanlarını sunar.
- Core, Plugin tarafından bildirilen giden yetenekler üzerinden sunumu işler veya otomatik olarak daha basit bir biçime düşürür.
- Discord, Slack, Telegram, Mattermost, MS Teams ve Feishu işleyicileri genel sözleşmeyi kullanır.
- Discord kanal denetim düzlemi kodu artık Carbon destekli kullanıcı arayüzü kapsayıcılarını içe aktarmaz.

Kanonik belgeler artık [İleti Sunumu](/tr/plugins/message-presentation) içinde yer alır.
Bu planı tarihsel uygulama bağlamı olarak saklayın; sözleşme, işleyici veya yedek davranış değişiklikleri için kanonik kılavuzu güncelleyin.

## Sorun

Kanal kullanıcı arayüzü şu anda birbiriyle uyumsuz birkaç yüzeye bölünmüş durumda:

- Core, `buildCrossContextComponents` üzerinden Discord biçimli bir bağlamlar arası işleyici kancasına sahiptir.
- Discord `channel.ts`, `DiscordUiContainer` üzerinden yerel Carbon kullanıcı arayüzünü içe aktarabilir; bu da çalışma zamanı kullanıcı arayüzü bağımlılıklarını kanal Plugin denetim düzlemine çeker.
- Ajan ve CLI, Discord `components`, Slack `blocks`, Telegram veya Mattermost `buttons` ve Teams veya Feishu `card` gibi yerel yük kaçış yolları sunar.
- `ReplyPayload.channelData` hem aktarım ipuçlarını hem de yerel kullanıcı arayüzü zarflarını taşır.
- Genel `interactive` modeli vardır, ancak Discord, Slack, Teams, Feishu, LINE, Telegram ve Mattermost tarafından zaten kullanılan daha zengin düzenlerden daha dardır.

Bu durum Core'un yerel kullanıcı arayüzü biçimlerinden haberdar olmasına neden olur, Plugin çalışma zamanı tembelliğini zayıflatır ve ajanlara aynı ileti amacını ifade etmek için gereğinden fazla sağlayıcıya özgü yol verir.

## Hedefler

- Core, bildirilen yeteneklere göre bir ileti için en iyi anlamsal sunuma karar verir.
- Eklentiler yetenekleri bildirir ve anlamsal sunumu yerel aktarım yüklerine işler.
- Web Denetim Kullanıcı Arayüzü, sohbetin yerel kullanıcı arayüzünden ayrı kalır.
- Yerel kanal yükleri, paylaşılan ajan veya CLI ileti yüzeyi üzerinden sunulmaz.
- Desteklenmeyen sunum özellikleri otomatik olarak en iyi metin gösterimine düşürülür.
- Gönderilen bir iletiyi sabitleme gibi teslim davranışları sunum değil, genel teslim meta verisidir.

## Hedef olmayanlar

- `buildCrossContextComponents` için geriye dönük uyumluluk uyarlama katmanı yoktur.
- `components`, `blocks`, `buttons` veya `card` için herkese açık yerel kaçış yolları yoktur.
- Core içinde kanala özgü yerel kullanıcı arayüzü kitaplıkları içe aktarılmaz.
- Paketlenmiş kanallar için sağlayıcıya özgü SDK aralıkları yoktur.

## Hedef model

`ReplyPayload` alanına Core tarafından sahip olunan bir `presentation` alanı ekleyin.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

`interactive`, geçiş sırasında `presentation` alanının bir alt kümesi haline gelir:

- `interactive` metin bloğu `presentation.blocks[].type = "text"` değerine eşlenir.
- `interactive` düğmeler bloğu `presentation.blocks[].type = "buttons"` değerine eşlenir.
- `interactive` seçim bloğu `presentation.blocks[].type = "select"` değerine eşlenir.

Dış ajan ve CLI şemaları artık `presentation` kullanır; `interactive`, mevcut yanıt üreticileri için dahili bir eski ayrıştırıcı/işleme yardımcısı olarak kalır.

## Teslim meta verileri

Kullanıcı arayüzü olmayan gönderim davranışı için Core tarafından sahip olunan bir `delivery` alanı ekleyin.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Anlamlar:

- `delivery.pin = true`, başarıyla teslim edilen ilk iletiyi sabitle anlamına gelir.
- `notify` varsayılan olarak `false` değerindedir.
- `required` varsayılan olarak `false` değerindedir; desteklenmeyen kanallar veya başarısız sabitleme, teslimi sürdürerek otomatik olarak daha basit bir davranışa düşer.
- El ile yapılan `pin`, `unpin` ve `list-pins` ileti eylemleri mevcut iletiler için kalır.

Mevcut Telegram ACP konu bağlaması `channelData.telegram.pin = true` değerinden `delivery.pin = true` değerine taşınmalıdır.

## Çalışma zamanı yetenek sözleşmesi

Sunum ve teslim işleme kancalarını denetim düzlemi kanal Plugin'ine değil, çalışma zamanı giden bağdaştırıcısına ekleyin.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Core davranışı:

- Hedef kanalı ve çalışma zamanı bağdaştırıcısını çözümle.
- Sunum yeteneklerini iste.
- Desteklenmeyen blokları işlemeden önce daha basit biçime düşür.
- `renderPresentation` çağır.
- İşleyici yoksa sunumu metin yedeğine dönüştür.
- Başarılı gönderimden sonra, `delivery.pin` istenmiş ve destekleniyorsa `pinDeliveredMessage` çağır.

## Kanal eşlemesi

Discord:

- `presentation` alanını çalışma zamanına özel modüllerde components v2 ve Carbon kapsayıcılarına işle.
- Vurgu rengi yardımcılarını hafif modüllerde tut.
- Kanal Plugin denetim düzlemi kodundan `DiscordUiContainer` içe aktarımlarını kaldır.

Slack:

- `presentation` alanını Block Kit'e işle.
- Ajan ve CLI `blocks` girdisini kaldır.

Telegram:

- Metin, bağlam ve ayırıcıları metin olarak işle.
- Hedef yüzey için yapılandırıldığında ve izin verildiğinde eylemleri ve seçimi satır içi klavyeler olarak işle.
- Satır içi düğmeler devre dışı olduğunda metin yedeğini kullan.
- ACP konu sabitlemesini `delivery.pin` alanına taşı.

Mattermost:

- Yapılandırıldığında eylemleri etkileşimli düğmeler olarak işle.
- Diğer blokları metin yedeği olarak işle.

MS Teams:

- `presentation` alanını Adaptive Cards olarak işle.
- El ile `pin`/`unpin`/`list-pins` eylemlerini koru.
- Graph desteği hedef konuşma için güvenilirse isteğe bağlı olarak `pinDeliveredMessage` uygula.

Feishu:

- `presentation` alanını etkileşimli kartlara işle.
- El ile `pin`/`unpin`/`list-pins` eylemlerini koru.
- API davranışı güvenilirse gönderilen ileti sabitleme için isteğe bağlı olarak `pinDeliveredMessage` uygula.

LINE:

- `presentation` alanını mümkün olduğunda Flex veya şablon iletilerine işle.
- Desteklenmeyen bloklar için metne geri dön.
- LINE kullanıcı arayüzü yüklerini `channelData` alanından kaldır.

Düz veya sınırlı kanallar:

- Sunumu ölçülü biçimlendirmeyle metne dönüştür.

## Yeniden düzenleme adımları

1. `ui-colors.ts` dosyasını Carbon destekli kullanıcı arayüzünden ayıran ve `extensions/discord/src/channel.ts` içinden `DiscordUiContainer` kaldıran Discord sürüm düzeltmesini yeniden uygula.
2. `ReplyPayload`, giden yük normalleştirme, teslim özetleri ve kanca yüklerine `presentation` ve `delivery` ekle.
3. Dar bir SDK/çalışma zamanı alt yolunda `MessagePresentation` şeması ve ayrıştırıcı yardımcıları ekle.
4. İleti yetenekleri olan `buttons`, `cards`, `components` ve `blocks` yerine anlamsal sunum yeteneklerini koy.
5. Sunum işleme ve teslim sabitleme için çalışma zamanı giden bağdaştırıcı kancaları ekle.
6. Bağlamlar arası bileşen oluşturmayı `buildCrossContextPresentation` ile değiştir.
7. `src/infra/outbound/channel-adapters.ts` dosyasını sil ve kanal Plugin türlerinden `buildCrossContextComponents` kaldır.
8. `maybeApplyCrossContextMarker` işlevini yerel parametreler yerine `presentation` ekleyecek şekilde değiştir.
9. Plugin-dispatch gönderim yollarını yalnızca anlamsal sunum ve teslim meta verilerini kullanacak şekilde güncelle.
10. Ajan ve CLI yerel yük parametrelerini kaldır: `components`, `blocks`, `buttons` ve `card`.
11. Yerel ileti aracı şemaları oluşturan SDK yardımcılarını kaldır ve yerine sunum şeması yardımcılarını koy.
12. Kullanıcı arayüzü/yerel zarfları `channelData` alanından kaldır; kalan her alan gözden geçirilene kadar yalnızca aktarım meta verilerini tut.
13. Discord, Slack, Telegram, Mattermost, MS Teams, Feishu ve LINE işleyicilerini taşı.
14. İleti CLI, kanal sayfaları, Plugin SDK ve yetenek yemek kitabı belgelerini güncelle.
15. Discord ve etkilenen kanal giriş noktaları için içe aktarım yayılım profillemesi çalıştır.

1-11 ve 13-14. adımlar, paylaşılan ajan, CLI, Plugin yeteneği ve giden bağdaştırıcı sözleşmeleri için bu yeniden düzenlemede uygulandı. 12. adım, sağlayıcıya özel `channelData` aktarım zarfları için daha derin bir dahili temizlik geçişi olarak kalıyor. 15. adım, tür/test kapısının ötesinde nicel içe aktarım yayılım sayıları istiyorsak takip doğrulaması olarak kalıyor.

## Testler

Ekle veya güncelle:

- Sunum normalleştirme testleri.
- Desteklenmeyen bloklar için sunum otomatik düşürme testleri.
- Plugin dispatch ve Core teslim yolları için bağlamlar arası işaretleyici testleri.
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE ve metin yedeği için kanal işleme matrisi testleri.
- Yerel alanların kaldırıldığını kanıtlayan ileti aracı şema testleri.
- Yerel bayrakların kaldırıldığını kanıtlayan CLI testleri.
- Carbon'u kapsayan Discord giriş noktası içe aktarım tembelliği regresyonu.
- Telegram ve genel yedeği kapsayan teslim sabitleme testleri.

## Açık sorular

- `delivery.pin` ilk geçişte Discord, Slack, MS Teams ve Feishu için de mi uygulanmalı, yoksa önce yalnızca Telegram mı?
- `delivery` sonunda `replyToId`, `replyToCurrent`, `silent` ve `audioAsVoice` gibi mevcut alanları da içine almalı mı, yoksa gönderim sonrası davranışlara odaklı mı kalmalı?
- Sunum doğrudan görselleri veya dosya referanslarını desteklemeli mi, yoksa medya şimdilik kullanıcı arayüzü düzeninden ayrı mı kalmalı?

## İlgili

- [Kanallara genel bakış](/tr/channels)
- [İleti sunumu](/tr/plugins/message-presentation)
