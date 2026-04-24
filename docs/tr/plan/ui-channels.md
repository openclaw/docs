---
read_when:
    - Kanal mesajı UI'sini, etkileşimli yükleri veya yerel kanal oluşturucularını yeniden düzenleme
    - Mesaj aracı yeteneklerini, teslim ipuçlarını veya bağlamlar arası işaretleyicileri değiştirme
    - Discord Carbon içe aktarma fan-out'unu veya kanal Plugin çalışma zamanı tembelliğini hata ayıklama
summary: Anlamsal mesaj sunumunu kanalın yerel UI oluşturucularından ayırın.
title: Kanal sunumu yeniden düzenleme planı
x-i18n:
    generated_at: "2026-04-24T09:18:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## Durum

Paylaşılan ajan, CLI, Plugin yeteneği ve giden teslim yüzeyleri için uygulandı:

- `ReplyPayload.presentation`, anlamsal mesaj UI'sini taşır.
- `ReplyPayload.delivery.pin`, gönderilen mesajı sabitleme isteklerini taşır.
- Paylaşılan mesaj eylemleri, sağlayıcıya özgü `components`, `blocks`, `buttons` veya `card` yerine `presentation`, `delivery` ve `pin` açığa çıkarır.
- Çekirdek, sunumu Plugin tarafından ilan edilen giden yetenekler üzerinden işler veya otomatik olarak yedek biçime düşürür.
- Discord, Slack, Telegram, Mattermost, Microsoft Teams ve Feishu oluşturucuları genel sözleşmeyi tüketir.
- Discord kanal denetim düzlemi kodu artık Carbon destekli UI container'larını içe aktarmıyor.

Kanonik belgeler artık [Message Presentation](/tr/plugins/message-presentation) içinde bulunur.
Bu planı tarihsel uygulama bağlamı olarak koruyun; sözleşme, oluşturucu
veya geri düşme davranışı değişikliklerinde kanonik rehberi güncelleyin.

## Sorun

Kanal UI şu anda birbiriyle uyumsuz birkaç yüzeye bölünmüş durumda:

- Çekirdek, `buildCrossContextComponents` üzerinden Discord biçimli bağlamlar arası bir oluşturucu hook'una sahip.
- Discord `channel.ts`, `DiscordUiContainer` üzerinden yerel Carbon UI içe aktarabiliyor; bu da çalışma zamanı UI bağımlılıklarını kanal Plugin denetim düzlemine çekiyor.
- Ajan ve CLI, Discord `components`, Slack `blocks`, Telegram veya Mattermost `buttons`, Teams veya Feishu `card` gibi yerel yük kaçış kapıları açığa çıkarıyor.
- `ReplyPayload.channelData`, hem taşıma ipuçlarını hem de yerel UI zarflarını taşıyor.
- Genel `interactive` modeli mevcut, ancak Discord, Slack, Teams, Feishu, LINE, Telegram ve Mattermost'un zaten kullandığı daha zengin düzenlerden daha dar.

Bu, çekirdeğin yerel UI biçimlerini bilmesine yol açıyor, Plugin çalışma zamanı tembelliğini zayıflatıyor ve ajanlara aynı mesaj niyetini ifade etmek için çok fazla sağlayıcıya özgü yol veriyor.

## Hedefler

- Çekirdek, ilan edilmiş yeteneklerden bir mesaj için en iyi anlamsal sunuma karar verir.
- Extension'lar yetenekleri ilan eder ve anlamsal sunumu yerel taşıma yüklerine dönüştürür.
- Web Control UI, sohbetin yerel UI'sinden ayrı kalır.
- Yerel kanal yükleri, paylaşılan ajan veya CLI mesaj yüzeyi üzerinden açığa çıkarılmaz.
- Desteklenmeyen sunum özellikleri otomatik olarak en iyi metin gösterimine düşer.
- Gönderilmiş mesajı sabitleme gibi teslim davranışları, sunum değil genel teslim meta verisidir.

## Hedef Dışı Olanlar

- `buildCrossContextComponents` için geriye dönük uyumluluk shim'i yok.
- `components`, `blocks`, `buttons` veya `card` için herkese açık yerel kaçış kapıları yok.
- Çekirdekte kanala özgü yerel UI kütüphaneleri içe aktarımı yok.
- Paketlenmiş kanallar için sağlayıcıya özgü SDK sınırları yok.

## Hedef Model

`ReplyPayload` içine çekirdeğe ait bir `presentation` alanı ekleyin.

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

Geçiş sırasında `interactive`, `presentation` alt kümesi hâline gelir:

- `interactive` text bloğu, `presentation.blocks[].type = "text"` değerine eşlenir.
- `interactive` buttons bloğu, `presentation.blocks[].type = "buttons"` değerine eşlenir.
- `interactive` select bloğu, `presentation.blocks[].type = "select"` değerine eşlenir.

Harici ajan ve CLI şemaları artık `presentation` kullanır; `interactive`, mevcut yanıt üreticileri için iç eski ayrıştırma/oluşturma yardımcısı olarak kalır.

## Teslim Meta Verisi

UI olmayan gönderim davranışı için çekirdeğe ait bir `delivery` alanı ekleyin.

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

- `delivery.pin = true`, başarıyla teslim edilen ilk mesajı sabitle anlamına gelir.
- `notify` varsayılan olarak `false` olur.
- `required` varsayılan olarak `false` olur; desteklenmeyen kanallar veya başarısız sabitleme durumunda teslimat sürdürülerek otomatik olarak geri düşülür.
- Mevcut mesajlar için elle `pin`, `unpin` ve `list-pins` mesaj eylemleri korunur.

Mevcut Telegram ACP konu bağlaması, `channelData.telegram.pin = true` yerine `delivery.pin = true` konumuna taşınmalıdır.

## Çalışma Zamanı Yetenek Sözleşmesi

Sunum ve teslim oluşturma hook'larını denetim düzlemi kanal Plugin'ine değil, çalışma zamanı giden bağdaştırıcısına ekleyin.

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

Çekirdek davranışı:

- Hedef kanalı ve çalışma zamanı bağdaştırıcısını çözümle.
- Sunum yeteneklerini sor.
- Desteklenmeyen blokları oluşturmadan önce geri düşür.
- `renderPresentation` çağır.
- Oluşturucu yoksa sunumu metin yedeğine dönüştür.
- Başarılı gönderimden sonra, `delivery.pin` istenmiş ve destekleniyorsa `pinDeliveredMessage` çağır.

## Kanal Eşleme

Discord:

- `presentation` değerini yalnızca çalışma zamanına ait modüllerde components v2 ve Carbon container'larına dönüştür.
- Vurgu rengi yardımcılarını hafif modüllerde tut.
- Kanal Plugin denetim düzlemi kodundan `DiscordUiContainer` içe aktarımlarını kaldır.

Slack:

- `presentation` değerini Block Kit'e dönüştür.
- Ajan ve CLI `blocks` girdisini kaldır.

Telegram:

- text, context ve divider bloklarını metin olarak dönüştür.
- Yapılandırılmışsa ve hedef yüzey için izinliyse actions ve select bloklarını satır içi klavyeler olarak dönüştür.
- Satır içi düğmeler devre dışıysa metin yedeği kullan.
- ACP konu sabitlemesini `delivery.pin` içine taşı.

Mattermost:

- actions bloklarını, yapılandırılmışsa etkileşimli düğmelere dönüştür.
- Diğer blokları metin yedeği olarak dönüştür.

Microsoft Teams:

- `presentation` değerini Adaptive Cards'a dönüştür.
- Elle pin/unpin/list-pins eylemlerini koru.
- Hedef konuşma için Graph desteği güvenilir ise isteğe bağlı olarak `pinDeliveredMessage` uygula.

Feishu:

- `presentation` değerini etkileşimli kartlara dönüştür.
- Elle pin/unpin/list-pins eylemlerini koru.
- API davranışı güvenilirse gönderilen mesaj sabitleme için isteğe bağlı olarak `pinDeliveredMessage` uygula.

LINE:

- `presentation` değerini mümkün olduğunda Flex veya şablon mesajlara dönüştür.
- Desteklenmeyen bloklar için metne geri düş.
- LINE UI yüklerini `channelData` içinden kaldır.

Düz veya sınırlı kanallar:

- Sunumu muhafazakâr biçimlendirme ile metne dönüştür.

## Yeniden Düzenleme Adımları

1. `ui-colors.ts` dosyasını Carbon destekli UI'den ayıran ve `DiscordUiContainer` içe aktarımını `extensions/discord/src/channel.ts` dosyasından kaldıran Discord sürüm düzeltmesini yeniden uygulayın.
2. `presentation` ve `delivery` alanlarını `ReplyPayload`, giden yük normalizasyonu, teslim özetleri ve hook yüklerine ekleyin.
3. Dar bir SDK/çalışma zamanı alt yolunda `MessagePresentation` şeması ve ayrıştırıcı yardımcıları ekleyin.
4. Mesaj yetenekleri `buttons`, `cards`, `components` ve `blocks` yerine anlamsal sunum yeteneklerini kullanın.
5. Sunum oluşturma ve teslim sabitleme için çalışma zamanı giden bağdaştırıcı hook'ları ekleyin.
6. Bağlamlar arası bileşen oluşturmayı `buildCrossContextPresentation` ile değiştirin.
7. `src/infra/outbound/channel-adapters.ts` dosyasını silin ve `buildCrossContextComponents` değerini kanal Plugin türlerinden kaldırın.
8. `maybeApplyCrossContextMarker` fonksiyonunu yerel parametreler yerine `presentation` ekleyecek şekilde değiştirin.
9. Plugin-dispatch gönderim yollarını yalnızca anlamsal sunum ve teslim meta verisini tüketecek şekilde güncelleyin.
10. Ajan ve CLI yerel yük parametrelerini kaldırın: `components`, `blocks`, `buttons` ve `card`.
11. Yerel mesaj aracı şemaları oluşturan SDK yardımcılarını kaldırın ve bunları sunum şeması yardımcılarıyla değiştirin.
12. `channelData` içinden UI/yerel zarfları kaldırın; kalan her alan gözden geçirilene kadar yalnızca taşıma meta verisini koruyun.
13. Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu ve LINE oluşturucularını taşıyın.
14. Mesaj CLI, kanal sayfaları, Plugin SDK ve yetenek cookbook belgelerini güncelleyin.
15. Discord ve etkilenen kanal giriş noktaları için içe aktarma fan-out profilini çalıştırın.

1-11 ile 13-14 adımları bu yeniden düzenlemede paylaşılan ajan, CLI, Plugin yeteneği ve giden bağdaştırıcı sözleşmeleri için uygulanmıştır. 12. adım, sağlayıcıya özel `channelData` taşıma zarfları için daha derin bir iç temizlik geçişi olarak kalmaktadır. 15. adım ise tür/test geçidi ötesinde nicel içe aktarma fan-out sayıları istiyorsak takip doğrulaması olarak kalmaktadır.

## Testler

Şunları ekleyin veya güncelleyin:

- Sunum normalizasyon testleri.
- Desteklenmeyen bloklar için sunum otomatik geri düşme testleri.
- Plugin dispatch ve çekirdek teslim yolları için bağlamlar arası işaretleyici testleri.
- Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, LINE ve metin yedeği için kanal oluşturma matris testleri.
- Yerel alanların kaldırıldığını kanıtlayan mesaj aracı şeması testleri.
- Yerel bayrakların kaldırıldığını kanıtlayan CLI testleri.
- Carbon'u kapsayan Discord giriş noktası içe aktarma tembelliği regresyonu.
- Telegram ve genel geri düşmeyi kapsayan teslim sabitleme testleri.

## Açık Sorular

- `delivery.pin`, ilk aşamada Discord, Slack, Microsoft Teams ve Feishu için mi uygulanmalı, yoksa önce yalnızca Telegram mı?
- `delivery`, ileride `replyToId`, `replyToCurrent`, `silent` ve `audioAsVoice` gibi mevcut alanları da içine almalı mı, yoksa gönderim sonrası davranışlara odaklı mı kalmalı?
- Sunum, görselleri veya dosya başvurularını doğrudan desteklemeli mi, yoksa medya şimdilik UI düzeninden ayrı mı kalmalı?

## İlgili

- [Kanallara genel bakış](/tr/channels)
- [Mesaj sunumu](/tr/plugins/message-presentation)
