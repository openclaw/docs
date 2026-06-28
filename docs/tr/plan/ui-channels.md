---
read_when:
    - Kanal mesajı kullanıcı arayüzünü, etkileşimli yükleri veya yerel kanal işleyicilerini yeniden düzenleme
    - Mesaj aracı yeteneklerini, teslim ipuçlarını veya bağlamlar arası işaretleyicileri değiştirme
    - Discord Carbon içe aktarma fanout’unu veya kanal Plugin çalışma zamanı tembelliğini hata ayıklama
summary: Anlamsal mesaj sunumunu kanalın yerel kullanıcı arayüzü işleyicilerinden ayırın.
title: Kanal sunumu yeniden düzenleme planı
x-i18n:
    generated_at: "2026-06-28T00:47:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Durum

Paylaşılan agent, CLI, Plugin yeteneği ve giden teslim yüzeyleri için uygulandı:

- `ReplyPayload.presentation`, semantik mesaj kullanıcı arayüzünü taşır.
- `ReplyPayload.delivery.pin`, gönderilen mesaj sabitleme isteklerini taşır.
- Paylaşılan mesaj eylemleri, sağlayıcıya özgü `components`, `blocks`, `buttons` veya `card` yerine `presentation`, `delivery` ve `pin` sunar.
- Core, Plugin tarafından bildirilen giden yetenekler üzerinden sunumu işler veya otomatik olarak daha düşük bir temsile indirger.
- Discord, Slack, Telegram, Mattermost, MS Teams ve Feishu oluşturucuları genel sözleşmeyi tüketir.
- Discord kanal kontrol düzlemi kodu artık Carbon destekli kullanıcı arayüzü kapsayıcılarını içe aktarmaz.

Kanonik belgeler artık [Mesaj Sunumu](/tr/plugins/message-presentation) içinde bulunur.
Bu planı tarihsel uygulama bağlamı olarak koruyun; sözleşme, oluşturucu veya fallback davranışı değişiklikleri için kanonik kılavuzu güncelleyin.

## Sorun

Kanal kullanıcı arayüzü şu anda birkaç uyumsuz yüzeye bölünmüş durumda:

- Core, `buildCrossContextComponents` üzerinden Discord biçimli bir çapraz bağlam oluşturucu hook'una sahiptir.
- Discord `channel.ts`, `DiscordUiContainer` üzerinden yerel Carbon kullanıcı arayüzünü içe aktarabilir; bu da çalışma zamanı kullanıcı arayüzü bağımlılıklarını kanal Plugin kontrol düzlemine çeker.
- Agent ve CLI, Discord `components`, Slack `blocks`, Telegram veya Mattermost `buttons` ve Teams veya Feishu `card` gibi yerel payload kaçış yolları sunar.
- `ReplyPayload.channelData`, hem taşıma ipuçlarını hem de yerel kullanıcı arayüzü zarflarını taşır.
- Genel `interactive` modeli vardır, ancak Discord, Slack, Teams, Feishu, LINE, Telegram ve Mattermost tarafından zaten kullanılan daha zengin düzenlerden daha dardır.

Bu, core'un yerel kullanıcı arayüzü biçimlerinden haberdar olmasına neden olur, Plugin çalışma zamanı tembelliğini zayıflatır ve agent'lara aynı mesaj niyetini ifade etmek için çok fazla sağlayıcıya özgü yol verir.

## Hedefler

- Core, bildirilen yeteneklerden bir mesaj için en iyi semantik sunuma karar verir.
- Plugin'ler yetenekleri bildirir ve semantik sunumu yerel taşıma payload'larına işler.
- Web Control UI, sohbetin yerel kullanıcı arayüzünden ayrı kalır.
- Yerel kanal payload'ları, paylaşılan agent veya CLI mesaj yüzeyi üzerinden sunulmaz.
- Desteklenmeyen sunum özellikleri otomatik olarak en iyi metin temsiline indirgenir.
- Gönderilen bir mesajı sabitleme gibi teslim davranışı, sunum değil genel teslim metadata'sıdır.

## Hedef dışı

- `buildCrossContextComponents` için geriye dönük uyumluluk shim'i yok.
- `components`, `blocks`, `buttons` veya `card` için herkese açık yerel kaçış yolları yok.
- Kanal yerel kullanıcı arayüzü kitaplıklarının core tarafından içe aktarılması yok.
- Paketli kanallar için sağlayıcıya özgü SDK seam'leri yok.

## Hedef model

`ReplyPayload` içine core'a ait bir `presentation` alanı ekleyin.

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

`interactive`, geçiş sırasında `presentation` öğesinin bir alt kümesi olur:

- `interactive` metin bloğu, `presentation.blocks[].type = "text"` ile eşlenir.
- `interactive` düğmeler bloğu, `presentation.blocks[].type = "buttons"` ile eşlenir.
- `interactive` seçim bloğu, `presentation.blocks[].type = "select"` ile eşlenir.

Harici agent ve CLI şemaları artık `presentation` kullanır; `interactive`, mevcut yanıt üreticileri için dahili eski ayrıştırıcı/işleme yardımcısı olarak kalır.
Herkese açık üreticiye dönük API, `interactive` öğesini kullanımdan kaldırılmış olarak değerlendirir. Mevcut onay yardımcıları ve eski Plugin'ler çalışmaya devam ederken yeni kod `presentation` yayabilsin diye çalışma zamanı desteği korunur.

## Teslim metadata'sı

Kullanıcı arayüzü olmayan gönderme davranışı için core'a ait bir `delivery` alanı ekleyin.

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

Semantik:

- `delivery.pin = true`, başarıyla teslim edilen ilk mesajı sabitlemek anlamına gelir.
- `notify` varsayılan olarak `false` olur.
- `required` varsayılan olarak `false` olur; desteklenmeyen kanallar veya başarısız sabitleme, teslimata devam ederek otomatik olarak daha düşük davranışa iner.
- Manuel `pin`, `unpin` ve `list-pins` mesaj eylemleri mevcut mesajlar için kalır.

Geçerli Telegram ACP konu bağlaması, `channelData.telegram.pin = true` yerine `delivery.pin = true` öğesine taşınmalıdır.

## Çalışma zamanı yetenek sözleşmesi

Sunum ve teslim işleme hook'larını kontrol düzlemi kanal Plugin'ine değil, çalışma zamanı giden adapter'ına ekleyin.

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

Core davranışı:

- Hedef kanalı ve çalışma zamanı adapter'ını çöz.
- Sunum yeteneklerini iste.
- Desteklenmeyen blokları daha düşük temsile indir ve işleme öncesinde genel yetenek sınırlarını uygula.
- `renderPresentation` çağır.
- Oluşturucu yoksa sunumu metin fallback'ine dönüştür.
- Başarılı gönderimden sonra, `delivery.pin` istendiğinde ve desteklendiğinde `pinDeliveredMessage` çağır.

## Kanal eşlemesi

Discord:

- `presentation` öğesini çalışma zamanına özel modüllerde components v2 ve Carbon kapsayıcılarına işle.
- Vurgu rengi yardımcılarını hafif modüllerde tut.
- Kanal Plugin kontrol düzlemi kodundan `DiscordUiContainer` içe aktarmalarını kaldır.

Slack:

- `presentation` öğesini Block Kit'e işle.
- Agent ve CLI `blocks` girdisini kaldır.

Telegram:

- Metin, bağlam ve ayırıcıları metin olarak işle.
- Eylemleri ve seçimi, hedef yüzey için yapılandırıldığında ve izin verildiğinde satır içi klavyeler olarak işle.
- Satır içi düğmeler devre dışıysa metin fallback'i kullan.
- ACP konu sabitlemesini `delivery.pin` öğesine taşı.

Mattermost:

- Eylemleri yapılandırıldığında etkileşimli düğmeler olarak işle.
- Diğer blokları metin fallback'i olarak işle.

MS Teams:

- `presentation` öğesini Adaptive Cards olarak işle.
- Manuel pin/unpin/list-pins eylemlerini koru.
- Graph desteği hedef konuşma için güvenilirse isteğe bağlı olarak `pinDeliveredMessage` uygula.

Feishu:

- `presentation` öğesini etkileşimli kartlara işle.
- Manuel pin/unpin/list-pins eylemlerini koru.
- API davranışı güvenilirse gönderilen mesaj sabitlemesi için isteğe bağlı olarak `pinDeliveredMessage` uygula.

LINE:

- `presentation` öğesini mümkün olduğunda Flex veya şablon mesajlara işle.
- Desteklenmeyen bloklar için metne geri dön.
- LINE kullanıcı arayüzü payload'larını `channelData` içinden kaldır.

Düz veya sınırlı kanallar:

- Sunumu korumacı biçimlendirmeyle metne dönüştür.

## Refactor adımları

1. `ui-colors.ts` öğesini Carbon destekli kullanıcı arayüzünden ayıran ve `extensions/discord/src/channel.ts` içinden `DiscordUiContainer` öğesini kaldıran Discord sürüm düzeltmesini yeniden uygula.
2. `ReplyPayload`, giden payload normalleştirme, teslim özetleri ve hook payload'larına `presentation` ve `delivery` ekle.
3. Dar bir SDK/çalışma zamanı alt yoluna `MessagePresentation` şeması ve ayrıştırıcı yardımcıları ekle.
4. Mesaj yetenekleri `buttons`, `cards`, `components` ve `blocks` öğelerini semantik sunum yetenekleriyle değiştir.
5. Sunum işleme ve teslim sabitleme için çalışma zamanı giden adapter hook'ları ekle.
6. Çapraz bağlam bileşen oluşturmayı `buildCrossContextPresentation` ile değiştir.
7. `src/infra/outbound/channel-adapters.ts` öğesini sil ve kanal Plugin türlerinden `buildCrossContextComponents` öğesini kaldır.
8. `maybeApplyCrossContextMarker` öğesini yerel parametreler yerine `presentation` ekleyecek şekilde değiştir.
9. Plugin dispatch gönderme yollarını yalnızca semantik sunum ve teslim metadata'sı tüketecek şekilde güncelle.
10. Agent ve CLI yerel payload parametrelerini kaldır: `components`, `blocks`, `buttons` ve `card`.
11. Yerel mesaj aracı şemaları oluşturan SDK yardımcılarını kaldırıp bunları sunum şeması yardımcılarıyla değiştir.
12. Kullanıcı arayüzü/yerel zarfları `channelData` içinden kaldır; kalan her alan incelenene kadar yalnızca taşıma metadata'sını tut.
13. Discord, Slack, Telegram, Mattermost, MS Teams, Feishu ve LINE oluşturucularını taşı.
14. Mesaj CLI, kanal sayfaları, Plugin SDK ve yetenek cookbook'u için belgeleri güncelle.
15. Discord ve etkilenen kanal giriş noktaları için içe aktarma fanout profillemesi çalıştır.

Adım 1-11 ve 13-14, paylaşılan agent, CLI, Plugin yeteneği ve giden adapter sözleşmeleri için bu refactor kapsamında uygulandı. Adım 12, sağlayıcıya özel `channelData` taşıma zarfları için daha derin bir dahili temizlik geçişi olarak kalıyor. Adım 15, tür/test kapısının ötesinde nicel içe aktarma fanout sayıları istiyorsak takip doğrulaması olarak kalıyor.

## Testler

Ekle veya güncelle:

- Sunum normalleştirme testleri.
- Desteklenmeyen bloklar için sunumun otomatik daha düşük temsile inme testleri.
- Plugin dispatch ve core teslim yolları için çapraz bağlam işaretleyici testleri.
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE ve metin fallback'i için kanal oluşturma matris testleri.
- Yerel alanların kaldırıldığını kanıtlayan mesaj aracı şema testleri.
- Yerel bayrakların kaldırıldığını kanıtlayan CLI testleri.
- Carbon'u kapsayan Discord giriş noktası içe aktarma tembelliği regresyonu.
- Telegram ve genel fallback'i kapsayan teslim sabitleme testleri.

## Açık sorular

- `delivery.pin` ilk geçişte Discord, Slack, MS Teams ve Feishu için uygulanmalı mı, yoksa önce yalnızca Telegram mı?
- `delivery` sonunda `replyToId`, `replyToCurrent`, `silent` ve `audioAsVoice` gibi mevcut alanları da kapsamalı mı, yoksa gönderim sonrası davranışlara odaklı mı kalmalı?
- Sunum doğrudan görselleri veya dosya referanslarını desteklemeli mi, yoksa medya şimdilik kullanıcı arayüzü düzeninden ayrı mı kalmalı?

## İlgili

- [Kanallara genel bakış](/tr/channels)
- [Mesaj sunumu](/tr/plugins/message-presentation)
