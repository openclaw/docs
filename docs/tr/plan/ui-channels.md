---
read_when:
    - Kanal mesaj UI'sini, etkileşimli payload'ları veya yerel kanal oluşturucularını yeniden düzenleme
    - Mesaj aracı yeteneklerini, teslim ipuçlarını veya bağlamlar arası işaretleyicileri değiştirme
    - Discord Carbon içe aktarma yayılımında veya kanal plugin çalışma zamanı tembelliğinde hata ayıklama
summary: Anlamsal mesaj sunumunu kanalın yerel UI oluşturucularından ayırın.
title: Kanal Sunumu Yeniden Düzenleme Planı
x-i18n:
    generated_at: "2026-04-22T04:24:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# Kanal Sunumu Yeniden Düzenleme Planı

## Durum

Paylaşılan agent, CLI, plugin yeteneği ve giden teslim yüzeyleri için uygulandı:

- `ReplyPayload.presentation`, anlamsal mesaj UI'sini taşır.
- `ReplyPayload.delivery.pin`, gönderilen mesaj sabitleme isteklerini taşır.
- Paylaşılan mesaj eylemleri, sağlayıcıya özgü `components`, `blocks`, `buttons` veya `card` yerine `presentation`, `delivery` ve `pin` sunar.
- Core, plugin tarafından bildirilen giden yetenekler üzerinden sunumu işler veya otomatik olarak uygun düzeye indirger.
- Discord, Slack, Telegram, Mattermost, MS Teams ve Feishu oluşturucuları genel sözleşmeyi tüketir.
- Discord kanal kontrol düzlemi kodu artık Carbon destekli UI kapsayıcılarını içe aktarmıyor.

Kanonik belgeler artık [Message Presentation](/tr/plugins/message-presentation) içinde yer alıyor.
Bu planı geçmiş uygulama bağlamı olarak saklayın; sözleşme,
oluşturucu veya geri dönüş davranışı değişikliklerinde kanonik kılavuzu güncelleyin.

## Sorun

Kanal UI'si şu anda birbiriyle uyumsuz birkaç yüzeye bölünmüş durumda:

- Core, `buildCrossContextComponents` üzerinden Discord biçimli bir bağlamlar arası oluşturucu kancasına sahip.
- Discord `channel.ts`, çalışma zamanı UI bağımlılıklarını kanal plugin kontrol düzlemine çeken `DiscordUiContainer` aracılığıyla yerel Carbon UI'yi içe aktarabiliyor.
- Agent ve CLI, Discord `components`, Slack `blocks`, Telegram veya Mattermost `buttons` ve Teams veya Feishu `card` gibi yerel payload kaçış kapıları sunuyor.
- `ReplyPayload.channelData`, hem taşıma ipuçlarını hem de yerel UI zarflarını taşıyor.
- Genel `interactive` modeli mevcut, ancak Discord, Slack, Teams, Feishu, LINE, Telegram ve Mattermost'ta zaten kullanılan daha zengin düzenlerden daha dar.

Bu, core'un yerel UI biçimlerinden haberdar olmasına yol açıyor, plugin çalışma zamanı tembelliğini zayıflatıyor ve agent'lara aynı mesaj niyetini ifade etmek için çok fazla sağlayıcıya özgü yol veriyor.

## Hedefler

- Core, bildirilen yeteneklerden bir mesaj için en iyi anlamsal sunuma karar verir.
- Extensions yetenekleri bildirir ve anlamsal sunumu yerel taşıma payload'larına dönüştürür.
- Web Control UI, sohbet yerel UI'sinden ayrı kalır.
- Yerel kanal payload'ları paylaşılan agent veya CLI mesaj yüzeyi üzerinden açığa çıkarılmaz.
- Desteklenmeyen sunum özellikleri otomatik olarak en iyi metin temsiline indirgenir.
- Gönderilmiş bir mesajı sabitleme gibi teslim davranışı, sunum değil genel teslim meta verisidir.

## Hedef dışı olanlar

- `buildCrossContextComponents` için geriye dönük uyumluluk shim'i yok.
- `components`, `blocks`, `buttons` veya `card` için genel yerel kaçış kapıları yok.
- Kanalın yerel UI kütüphanelerinin core içine aktarılması yok.
- Paketlenmiş kanallar için sağlayıcıya özgü SDK seam'leri yok.

## Hedef model

`ReplyPayload` öğesine core'a ait bir `presentation` alanı ekleyin.

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

Geçiş sırasında `interactive`, `presentation`'ın bir alt kümesi olur:

- `interactive` metin bloğu, `presentation.blocks[].type = "text"` değerine eşlenir.
- `interactive` düğmeler bloğu, `presentation.blocks[].type = "buttons"` değerine eşlenir.
- `interactive` seçim bloğu, `presentation.blocks[].type = "select"` değerine eşlenir.

Dış agent ve CLI şemaları artık `presentation` kullanıyor; `interactive`, mevcut yanıt üreticileri için içsel eski bir ayrıştırıcı/oluşturma yardımcısı olarak kalıyor.

## Teslim meta verileri

UI olmayan gönderim davranışı için core'a ait bir `delivery` alanı ekleyin.

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

Anlambilim:

- `delivery.pin = true`, başarıyla teslim edilen ilk mesajın sabitlenmesi anlamına gelir.
- `notify` varsayılan olarak `false` değerini alır.
- `required` varsayılan olarak `false` değerini alır; desteklenmeyen kanallar veya başarısız sabitleme, teslimata devam edilerek otomatik olarak uygun düzeye indirgenir.
- Mevcut mesajlar için el ile `pin`, `unpin` ve `list-pins` mesaj eylemleri korunur.

Geçerli Telegram ACP konu bağlama işlemi, `channelData.telegram.pin = true` yerine `delivery.pin = true` kullanacak şekilde taşınmalıdır.

## Çalışma zamanı yetenek sözleşmesi

Sunum ve teslim oluşturma kancalarını kontrol düzlemi kanal plugin'ine değil, çalışma zamanı giden bağdaştırıcısına ekleyin.

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
- Sunum yeteneklerini sor.
- Desteklenmeyen blokları oluşturmadan önce uygun düzeye indir.
- `renderPresentation` çağrısı yap.
- Oluşturucu yoksa sunumu metin geri dönüşüne dönüştür.
- Başarılı gönderimden sonra, `delivery.pin` istenmiş ve destekleniyorsa `pinDeliveredMessage` çağrısı yap.

## Kanal eşlemesi

Discord:

- `presentation` değerini yalnızca çalışma zamanına ait modüllerde components v2 ve Carbon kapsayıcılarına dönüştür.
- Vurgu rengi yardımcılarını hafif modüllerde tut.
- Kanal plugin kontrol düzlemi kodundan `DiscordUiContainer` içe aktarımlarını kaldır.

Slack:

- `presentation` değerini Block Kit'e dönüştür.
- Agent ve CLI `blocks` girdisini kaldır.

Telegram:

- Metin, bağlam ve ayırıcıları metin olarak dönüştür.
- Eylemleri ve seçimi, hedef yüzey için yapılandırılmış ve izin verilmişse satır içi klavyelere dönüştür.
- Satır içi düğmeler devre dışıysa metin geri dönüşünü kullan.
- ACP konu sabitlemesini `delivery.pin` yapısına taşı.

Mattermost:

- Eylemleri, yapılandırıldığında etkileşimli düğmelere dönüştür.
- Diğer blokları metin geri dönüşü olarak dönüştür.

MS Teams:

- `presentation` değerini Adaptive Cards'a dönüştür.
- El ile sabitleme/sabitlemeyi kaldırma/sabitlenmişleri listeleme eylemlerini koru.
- Hedef konuşma için Graph desteği güvenilir ise isteğe bağlı olarak `pinDeliveredMessage` uygula.

Feishu:

- `presentation` değerini etkileşimli kartlara dönüştür.
- El ile sabitleme/sabitlemeyi kaldırma/sabitlenmişleri listeleme eylemlerini koru.
- API davranışı güvenilirse gönderilmiş mesaj sabitleme için isteğe bağlı olarak `pinDeliveredMessage` uygula.

LINE:

- `presentation` değerini mümkün olduğunda Flex veya şablon mesajlara dönüştür.
- Desteklenmeyen bloklarda metne geri dön.
- `channelData` içinden LINE UI payload'larını kaldır.

Düz veya sınırlı kanallar:

- Sunumu korumacı biçimlendirme ile metne dönüştür.

## Yeniden düzenleme adımları

1. `ui-colors.ts` dosyasını Carbon destekli UI'den ayıran ve `extensions/discord/src/channel.ts` içinden `DiscordUiContainer` kullanımını kaldıran Discord yayın düzeltmesini yeniden uygulayın.
2. `ReplyPayload`, giden payload normalleştirmesi, teslim özetleri ve kanca payload'larına `presentation` ve `delivery` ekleyin.
3. Dar bir SDK/çalışma zamanı alt yolunda `MessagePresentation` şeması ve ayrıştırıcı yardımcılarını ekleyin.
4. Mesaj yeteneklerindeki `buttons`, `cards`, `components` ve `blocks` öğelerini anlamsal sunum yetenekleriyle değiştirin.
5. Sunum oluşturma ve teslim sabitleme için çalışma zamanı giden bağdaştırıcı kancaları ekleyin.
6. Bağlamlar arası bileşen oluşturmayı `buildCrossContextPresentation` ile değiştirin.
7. `src/infra/outbound/channel-adapters.ts` dosyasını silin ve kanal plugin türlerinden `buildCrossContextComponents` öğesini kaldırın.
8. `maybeApplyCrossContextMarker` öğesini yerel parametreler yerine `presentation` ekleyecek şekilde değiştirin.
9. Plugin-dispatch gönderim yollarını yalnızca anlamsal sunum ve teslim meta verilerini tüketecek şekilde güncelleyin.
10. Agent ve CLI yerel payload parametrelerini kaldırın: `components`, `blocks`, `buttons` ve `card`.
11. Yerel mesaj-aracı şemaları oluşturan SDK yardımcılarını kaldırın ve bunları sunum şeması yardımcılarıyla değiştirin.
12. `channelData` içinden UI/yerel zarfları kaldırın; kalan her alan gözden geçirilene kadar yalnızca taşıma meta verilerini tutun.
13. Discord, Slack, Telegram, Mattermost, MS Teams, Feishu ve LINE oluşturucularını taşıyın.
14. Mesaj CLI, kanal sayfaları, plugin SDK ve yetenek tarif kitabı belgelerini güncelleyin.
15. Discord ve etkilenen kanal giriş noktaları için içe aktarma yayılımı profillemesi çalıştırın.

Bu yeniden düzenlemede, paylaşılan agent, CLI, plugin yeteneği ve giden bağdaştırıcı sözleşmeleri için 1-11 ve 13-14. adımlar uygulanmıştır. 12. adım, sağlayıcıya özel `channelData` taşıma zarfları için daha derin bir iç temizlik geçişi olarak kalmaktadır. 15. adım ise tür/test geçidinin ötesinde nicel içe aktarma yayılımı sayıları istiyorsak sonraki doğrulama olarak kalmaktadır.

## Testler

Şunları ekleyin veya güncelleyin:

- Sunum normalleştirme testleri.
- Desteklenmeyen bloklar için sunumun otomatik uygun düzeye indirilmesi testleri.
- Plugin dispatch ve core teslim yolları için bağlamlar arası işaretleyici testleri.
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE ve metin geri dönüşü için kanal oluşturma matris testleri.
- Yerel alanların kaldırıldığını kanıtlayan mesaj aracı şema testleri.
- Yerel bayrakların kaldırıldığını kanıtlayan CLI testleri.
- Carbon'ı kapsayan Discord giriş noktası içe aktarma tembelliği regresyonu.
- Telegram ve genel geri dönüşü kapsayan teslim sabitleme testleri.

## Açık sorular

- `delivery.pin`, ilk geçişte Discord, Slack, MS Teams ve Feishu için mi uygulanmalı, yoksa önce yalnızca Telegram için mi?
- `delivery`, zamanla `replyToId`, `replyToCurrent`, `silent` ve `audioAsVoice` gibi mevcut alanları da kapsamalı mı, yoksa gönderim sonrası davranışlara odaklı mı kalmalı?
- Sunum, görselleri veya dosya başvurularını doğrudan desteklemeli mi, yoksa medya şimdilik UI düzeninden ayrı mı kalmalı?
