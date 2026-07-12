---
read_when:
    - Kanal mesajı kullanıcı arayüzünü, etkileşimli veri yüklerini veya yerel kanal işleyicilerini yeniden düzenleme
    - Mesaj aracı yeteneklerini, teslim ipuçlarını veya bağlamlar arası işaretleyicileri değiştirme
    - Discord Carbon içe aktarma yayılımında veya kanal Plugin çalışma zamanı tembel yüklemesinde hata ayıklama
summary: Anlamsal mesaj sunumunu kanala özgü yerel kullanıcı arayüzü işleyicilerinden ayırın.
title: Kanal sunumu yeniden düzenleme planı
x-i18n:
    generated_at: "2026-07-12T12:25:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Durum

Paylaşılan ajan, CLI, plugin yeteneği ve giden teslimat yüzeyleri için uygulandı:

- `ReplyPayload.presentation`, anlamsal mesaj kullanıcı arayüzünü taşır.
- `ReplyPayload.delivery.pin`, gönderilen mesajı sabitleme isteklerini taşır.
- Paylaşılan mesaj eylemleri, sağlayıcıya özgü `components`, `blocks`, `buttons` veya `card` yerine `presentation`, `delivery` ve `pin` sunar.
- Çekirdek, sunumu plugin tarafından bildirilen giden yetenekler üzerinden işler veya otomatik olarak daha basit bir biçime dönüştürür.
- Discord, Slack, Telegram, Mattermost, MS Teams ve Feishu işleyicileri genel sözleşmeyi kullanır.
- Discord kanalının kontrol düzlemi kodu artık Carbon tabanlı kullanıcı arayüzü kapsayıcılarını içe aktarmaz.

Standart belgeler artık [Mesaj sunumu](/tr/plugins/message-presentation) sayfasında yer alır.
Bu planı geçmiş uygulama bağlamı olarak koruyun; sözleşme, işleyici veya geri dönüş davranışı değişiklikleri için standart kılavuzu güncelleyin.

## Sorun

Kanal kullanıcı arayüzü şu anda birbiriyle uyumsuz birkaç yüzeye bölünmüştür:

- Çekirdek, `buildCrossContextComponents` aracılığıyla Discord biçimli bir bağlamlar arası işleyici kancasına sahiptir.
- Discord `channel.ts`, `DiscordUiContainer` aracılığıyla yerel Carbon kullanıcı arayüzünü içe aktarabilir; bu da çalışma zamanı kullanıcı arayüzü bağımlılıklarını kanal plugin'inin kontrol düzlemine taşır.
- Ajan ve CLI; Discord `components`, Slack `blocks`, Telegram veya Mattermost `buttons` ve Teams veya Feishu `card` gibi yerel yük kaçış yolları sunar.
- `ReplyPayload.channelData`, hem aktarım ipuçlarını hem de yerel kullanıcı arayüzü zarflarını taşır.
- Genel `interactive` modeli mevcuttur ancak Discord, Slack, Teams, Feishu, LINE, Telegram ve Mattermost tarafından zaten kullanılan daha zengin düzenlerden daha kısıtlıdır.

Bu durum çekirdeği yerel kullanıcı arayüzü biçimlerinden haberdar eder, plugin çalışma zamanının tembel yükleme özelliğini zayıflatır ve ajanlara aynı mesaj amacını ifade etmek için sağlayıcıya özgü çok fazla yöntem sunar.

## Hedefler

- Çekirdek, bildirilen yeteneklere göre bir mesaj için en iyi anlamsal sunuma karar verir.
- Uzantılar yeteneklerini bildirir ve anlamsal sunumu yerel aktarım yüklerine işler.
- Web Denetim Kullanıcı Arayüzü, sohbetin yerel kullanıcı arayüzünden ayrı kalır.
- Yerel kanal yükleri, paylaşılan ajan veya CLI mesaj yüzeyi üzerinden sunulmaz.
- Desteklenmeyen sunum özellikleri otomatik olarak en uygun metin gösterimine dönüştürülür.
- Gönderilen bir mesajı sabitleme gibi teslimat davranışları sunum değil, genel teslimat meta verileridir.

## Hedef dışı konular

- `buildCrossContextComponents` için geriye dönük uyumluluk katmanı yoktur.
- `components`, `blocks`, `buttons` veya `card` için herkese açık yerel kaçış yolları yoktur.
- Çekirdek, kanala özgü kullanıcı arayüzü kitaplıklarını içe aktarmaz.
- Birlikte paketlenen kanallar için sağlayıcıya özgü SDK bağlantı noktaları yoktur.

## Hedef model

`ReplyPayload` öğesine çekirdek tarafından yönetilen bir `presentation` alanı ekleyin.

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

Geçiş sırasında `interactive`, `presentation` öğesinin bir alt kümesi hâline gelir:

- `interactive` metin bloğu, `presentation.blocks[].type = "text"` değerine eşlenir.
- `interactive` düğme bloğu, `presentation.blocks[].type = "buttons"` değerine eşlenir.
- `interactive` seçim bloğu, `presentation.blocks[].type = "select"` değerine eşlenir.

Harici ajan ve CLI şemaları artık `presentation` kullanır; `interactive`, mevcut yanıt üreticileri için eski bir dahili ayrıştırma/işleme yardımcısı olarak kalır.
Üreticilere yönelik herkese açık API, `interactive` öğesini kullanımdan kaldırılmış olarak değerlendirir. Yeni kod `presentation` üretirken mevcut onay yardımcılarının ve eski plugin'lerin çalışmaya devam edebilmesi için çalışma zamanı desteği korunur.

## Teslimat meta verileri

Kullanıcı arayüzü olmayan gönderim davranışları için çekirdek tarafından yönetilen bir `delivery` alanı ekleyin.

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

Anlamları:

- `delivery.pin = true`, başarıyla teslim edilen ilk mesajı sabitlemek anlamına gelir.
- `notify` varsayılan olarak `false` değerini alır.
- `required` varsayılan olarak `false` değerini alır; desteklenmeyen kanallarda veya sabitleme başarısız olduğunda teslimata devam edilerek otomatik olarak daha basit davranışa geçilir.
- Mevcut mesajlar için elle kullanılan `pin`, `unpin` ve `list-pins` mesaj eylemleri korunur.

Mevcut Telegram ACP konu bağlama işlemi, `channelData.telegram.pin = true` yerine `delivery.pin = true` kullanmalıdır.

## Çalışma zamanı yetenek sözleşmesi

Sunum ve teslimat işleme kancalarını kontrol düzlemi kanal plugin'ine değil, çalışma zamanı giden bağdaştırıcısına ekleyin.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
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

- Hedef kanalı ve çalışma zamanı bağdaştırıcısını çözümleyin.
- Sunum yeteneklerini sorgulayın.
- Desteklenmeyen blokları daha basit biçimlere dönüştürün ve işlemeden önce genel yetenek sınırlarını uygulayın.
- `renderPresentation` işlevini çağırın.
- İşleyici yoksa sunumu yedek metne dönüştürün.
- Başarılı gönderimden sonra `delivery.pin` istendiğinde ve desteklendiğinde `pinDeliveredMessage` işlevini çağırın.

## Kanal eşlemesi

Discord:

- `presentation` öğesini yalnızca çalışma zamanı modüllerinde v2 bileşenlerine ve Carbon kapsayıcılarına işleyin.
- Vurgu rengi yardımcılarını hafif modüllerde tutun.
- Kanal plugin'inin kontrol düzlemi kodundan `DiscordUiContainer` içe aktarımlarını kaldırın.

Slack:

- `presentation` öğesini Block Kit biçiminde işleyin.
- Ajan ve CLI `blocks` girdisini kaldırın.

Telegram:

- Metin, bağlam ve ayırıcıları metin olarak işleyin.
- Eylemleri ve seçimi, yapılandırıldığında ve hedef yüzey için izin verildiğinde satır içi klavyeler olarak işleyin.
- Satır içi düğmeler devre dışı bırakıldığında yedek metin kullanın.
- ACP konu sabitlemesini `delivery.pin` öğesine taşıyın.

Mattermost:

- Eylemleri, yapılandırıldığı durumlarda etkileşimli düğmeler olarak işleyin.
- Diğer blokları yedek metin olarak işleyin.

MS Teams:

- `presentation` öğesini Adaptive Cards biçiminde işleyin.
- Elle kullanılan sabitleme/sabitlemeyi kaldırma/sabitlenenleri listeleme eylemlerini koruyun.
- Graph desteği hedef konuşma için güvenilir ise isteğe bağlı olarak `pinDeliveredMessage` işlevini uygulayın.

Feishu:

- `presentation` öğesini etkileşimli kartlar biçiminde işleyin.
- Elle kullanılan sabitleme/sabitlemeyi kaldırma/sabitlenenleri listeleme eylemlerini koruyun.
- API davranışı güvenilir ise gönderilen mesajları sabitlemek için isteğe bağlı olarak `pinDeliveredMessage` işlevini uygulayın.

LINE:

- Mümkün olduğunda `presentation` öğesini Flex veya şablon mesajlar biçiminde işleyin.
- Desteklenmeyen bloklar için yedek metne dönün.
- LINE kullanıcı arayüzü yüklerini `channelData` içinden kaldırın.

Düz veya kısıtlı kanallar:

- Sunumu ölçülü biçimlendirmeyle metne dönüştürün.

## Yeniden düzenleme adımları

1. `ui-colors.ts` dosyasını Carbon tabanlı kullanıcı arayüzünden ayıran ve `DiscordUiContainer` öğesini `extensions/discord/src/channel.ts` dosyasından kaldıran Discord sürüm düzeltmesini yeniden uygulayın.
2. `ReplyPayload` öğesine, giden yük normalleştirmesine, teslimat özetlerine ve kanca yüklerine `presentation` ve `delivery` ekleyin.
3. Dar kapsamlı bir SDK/çalışma zamanı alt yoluna `MessagePresentation` şeması ve ayrıştırıcı yardımcıları ekleyin.
4. `buttons`, `cards`, `components` ve `blocks` mesaj yeteneklerini anlamsal sunum yetenekleriyle değiştirin.
5. Sunum işleme ve teslimat sabitleme için çalışma zamanı giden bağdaştırıcı kancaları ekleyin.
6. Bağlamlar arası bileşen oluşturmayı `buildCrossContextPresentation` ile değiştirin.
7. `src/infra/outbound/channel-adapters.ts` dosyasını silin ve `buildCrossContextComponents` öğesini kanal plugin türlerinden kaldırın.
8. `maybeApplyCrossContextMarker` işlevini yerel parametreler yerine `presentation` ekleyecek şekilde değiştirin.
9. Plugin yönlendirmesi gönderim yollarını yalnızca anlamsal sunum ve teslimat meta verilerini kullanacak şekilde güncelleyin.
10. Ajan ve CLI yerel yük parametrelerini kaldırın: `components`, `blocks`, `buttons` ve `card`.
11. Yerel mesaj aracı şemaları oluşturan SDK yardımcılarını kaldırıp bunların yerine sunum şeması yardımcılarını ekleyin.
12. Kullanıcı arayüzü/yerel zarfları `channelData` içinden kaldırın; kalan her alan incelenene kadar yalnızca aktarım meta verilerini koruyun.
13. Discord, Slack, Telegram, Mattermost, MS Teams, Feishu ve LINE işleyicilerini geçirin.
14. Mesaj CLI'sı, kanal sayfaları, plugin SDK'sı ve yetenek tarifleri için belgeleri güncelleyin.
15. Discord ve etkilenen kanal giriş noktaları için içe aktarma yayılımı profillemesi çalıştırın.

1-11 ve 13-14. adımlar, paylaşılan ajan, CLI, plugin yeteneği ve giden bağdaştırıcı sözleşmeleri için bu yeniden düzenlemede uygulanmıştır. 12. adım, sağlayıcıya özel `channelData` aktarım zarfları için daha derin bir dahili temizlik aşaması olarak kalır. Tür/test geçidinin ötesinde nicel içe aktarma yayılımı değerleri istenirse 15. adım sonraki doğrulama çalışması olarak kalır.

## Testler

Ekleyin veya güncelleyin:

- Sunum normalleştirme testleri.
- Desteklenmeyen bloklar için sunumun otomatik olarak daha basit biçime dönüştürülmesi testleri.
- Plugin yönlendirmesi ve çekirdek teslimat yolları için bağlamlar arası işaretleyici testleri.
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE ve yedek metin için kanal işleme matrisi testleri.
- Yerel alanların kaldırıldığını kanıtlayan mesaj aracı şeması testleri.
- Yerel bayrakların kaldırıldığını kanıtlayan CLI testleri.
- Carbon'u kapsayan Discord giriş noktası tembel içe aktarma regresyon testi.
- Telegram ve genel geri dönüşü kapsayan teslimat sabitleme testleri.

## Açık sorular

- `delivery.pin` ilk aşamada Discord, Slack, MS Teams ve Feishu için de mi uygulanmalı, yoksa önce yalnızca Telegram için mi uygulanmalı?
- `delivery`, ileride `replyToId`, `replyToCurrent`, `silent` ve `audioAsVoice` gibi mevcut alanları da kapsamalı mı, yoksa gönderim sonrası davranışlara odaklanmaya devam mı etmeli?
- Sunum, görüntüleri veya dosya başvurularını doğrudan desteklemeli mi, yoksa medya şimdilik kullanıcı arayüzü düzeninden ayrı mı kalmalı?

## İlgili

- [Kanallara genel bakış](/tr/channels)
- [Mesaj sunumu](/tr/plugins/message-presentation)
