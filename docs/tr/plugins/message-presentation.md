---
read_when:
    - Mesaj kartı, düğme veya seçim görüntülemeyi ekleme ya da değiştirme
    - Zengin giden iletileri destekleyen bir kanal Plugin’i oluşturma
    - İleti aracı sunumunu veya teslim yeteneklerini değiştirme
    - Sağlayıcıya özgü kart/blok/bileşen işleme regresyonlarında hata ayıklama
summary: Kanal Plugin'leri için anlamsal ileti kartları, düğmeler, seçimler, yedek metin ve teslim ipuçları
title: Mesaj sunumu
x-i18n:
    generated_at: "2026-07-02T22:45:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

İleti sunumu, zengin giden sohbet arayüzü için OpenClaw'ın paylaşılan sözleşmesidir.
Aracıların, CLI komutlarının, onay akışlarının ve Plugin'lerin ileti
niyetini bir kez tanımlamasını sağlar; her kanal Plugin'i ise bunu elinden gelen
en iyi yerel biçimde oluşturur.

Taşınabilir ileti arayüzü için sunumu kullanın:

- metin bölümleri
- küçük bağlam/alt bilgi metni
- ayırıcılar
- düğmeler
- seçim menüleri
- kart başlığı ve tonu

Paylaşılan ileti aracına Discord `components`, Slack `blocks`, Telegram
`buttons`, Teams `card` veya Feishu `card` gibi sağlayıcıya özgü yeni alanlar
eklemeyin. Bunlar kanal Plugin'inin sahip olduğu renderer çıktılarıdır.

## Sözleşme

Plugin yazarları genel sözleşmeyi şuradan içe aktarır:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Şekil:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
};

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

Düğme semantiği:

- `action.type: "command"`, çekirdeğin komut yolu üzerinden yerel bir eğik çizgi
  komutu çalıştırır. Bunu yerleşik komut düğmeleri ve menüler için kullanın.
- `action.type: "callback"`, kanalın etkileşim yolu üzerinden opak Plugin
  verisi taşır. Kanal Plugin'leri callback verisini eğik çizgi komutları olarak
  yeniden yorumlamamalıdır.
- `value`, eski opak callback değeridir. Yeni kontroller `action` kullanmalıdır;
  böylece kanal Plugin'leri metinden tahmin yürütmeden komutları ve callback'leri
  eşleyebilir.
- `url` bir bağlantı düğmesidir. `value` olmadan var olabilir.
- `webApp`, kanala özgü yerel bir web uygulaması düğmesini tanımlar. Telegram
  bunu `web_app` olarak oluşturur ve yalnızca özel sohbetlerde destekler.
  `web_app`, uyumluluk için gevşek JSON yüklerinde hâlâ kabul edilir, ancak
  TypeScript üreticileri `webApp` kullanmalıdır.
- `label` zorunludur ve metin yedeğinde de kullanılır.
- `style` tavsiye niteliğindedir. Renderer'lar desteklenmeyen stilleri gönderimi
  başarısız kılmak yerine güvenli bir varsayılana eşlemelidir.
- `priority` isteğe bağlıdır. Bir kanal eylem sınırlarını duyurduğunda ve
  kontrollerin düşürülmesi gerektiğinde, çekirdek önce daha yüksek öncelikli
  düğmeleri tutar ve aynı önceliğe sahip düğmeler arasında özgün sırayı korur.
  Tüm kontroller sığdığında, yazıldığı sıra korunur.
- `disabled` isteğe bağlıdır. Kanallar `supportsDisabled` ile açıkça destek
  vermelidir; aksi halde çekirdek devre dışı kontrolü etkileşimsiz yedek metne
  indirger.
- `reusable` isteğe bağlıdır. Yeniden kullanılabilir yerel callback'leri
  destekleyen kanallar, başarılı bir etkileşimden sonra eylemi kullanılabilir
  tutabilir. Bunu yenileme, inceleme veya daha fazla ayrıntı gibi tekrarlanabilir
  ya da idempotent eylemler için kullanın; normal tek seferlik onaylar ve yıkıcı
  eylemler için ayarlamayın.

Seçim semantiği:

- `options[].action`, düğme `action` ile aynı komut/callback anlamına sahiptir.
- `options[].value`, eski seçili uygulama değeridir.
- `placeholder` tavsiye niteliğindedir ve yerel seçim desteği olmayan kanallar
  tarafından yok sayılabilir.
- Bir kanal seçimleri desteklemiyorsa, yedek metin etiketleri listeler.

## Üretici örnekleri

Basit kart:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Yalnızca URL içeren bağlantı düğmesi:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Telegram Mini App düğmesi:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

Seçim menüsü:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI gönderimi:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Sabitlenmiş teslim:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Açık JSON ile sabitlenmiş teslim:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Renderer sözleşmesi

Kanal Plugin'leri, giden bağdaştırıcılarında oluşturma desteğini bildirir:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Yetenek boolean'ları, renderer'ın neleri etkileşimli hale getirebildiğini
tanımlar. İsteğe bağlı `limits`, çekirdeğin renderer'ı çağırmadan önce
uyarlayabileceği genel zarfı tanımlar:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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
```

Çekirdek, oluşturma öncesinde semantik kontrollere genel sınırları uygular.
Renderer'lar, yerel blok sayısı, kart boyutu, URL sınırları ve genel sözleşmede
ifade edilemeyen sağlayıcı tuhaflıkları için nihai sağlayıcıya özgü doğrulama ve
kırpmaya hâlâ sahiptir. Sınırlar bir bloktaki tüm kontrolleri kaldırırsa,
çekirdek etiketleri etkileşimsiz bağlam metni olarak tutar; böylece teslim
edilen iletinin hâlâ görünür bir yedeği olur.

## Çekirdek oluşturma akışı

Bir `ReplyPayload` veya ileti eylemi `presentation` içerdiğinde, çekirdek:

1. Sunum yükünü normalleştirir.
2. Hedef kanalın giden bağdaştırıcısını çözer.
3. `presentationCapabilities` değerini okur.
4. Bağdaştırıcı bunları duyurduğunda eylem sayısı, etiket uzunluğu ve seçim
   seçeneği sayısı gibi genel yetenek sınırlarını uygular.
5. Bağdaştırıcı yükü oluşturabiliyorsa `renderPresentation` çağrısı yapar.
6. Bağdaştırıcı yoksa veya oluşturamıyorsa tutucu metne geri döner.
7. Ortaya çıkan yükü normal kanal teslim yolu üzerinden gönderir.
8. İlk başarılı gönderilen iletiden sonra `delivery.pin` gibi teslim
   metaverilerini uygular.

Üreticilerin kanaldan bağımsız kalabilmesi için yedek davranış çekirdeğe aittir.
Kanal Plugin'leri yerel oluşturma ve etkileşim işlemeye sahiptir.

## İndirgeme kuralları

Sunum, sınırlı kanallarda gönderilmeye güvenli olmalıdır.

Yedek metin şunları içerir:

- ilk satır olarak `title`
- normal paragraflar olarak `text` blokları
- kompakt bağlam satırları olarak `context` blokları
- görsel ayırıcı olarak `divider` blokları
- bağlantı düğmeleri için URL'ler dahil düğme etiketleri
- seçim seçeneği etiketleri

### Düğme değeri yedek görünürlüğü

Bir kanal etkileşimli kontrolleri oluşturamadığında, düğme ve seçim değerleri
düz metne geri döner. Yedek davranış, opak callback verisini gizli tutarken
kullanılabilirliği korur:

- **`command` türündeki eylemler**, kullanıcıların komutu kopyalayıp kanal
  girişinde elle çalıştırabilmesi için `label: \`command\`` olarak oluşturulur.
- **`callback` türündeki eylemler** ve eski **`value`** alanları yalnızca etiket
  olarak oluşturulur. Opak callback değeri yedek metinde gösterilmez.
- **`url` / `webApp`** düğmeleri, URL kullanıcıya yönelik olduğu için URL
  metnini düğme etiketiyle birlikte oluşturur.
- **Seçim seçenekleri** yalnızca etiket olarak oluşturulur. Alttaki seçenek
  değeri yedek metinde gösterilmez.

Yedek arayüzlerinde elle komut kılavuzu ekleyen kanal bağdaştırıcıları (ör.
Feishu belge yorumu yönergeleri), komut varlığı kontrolünü yedek renderer'ın
kullandığı aynı sunum bloklarından türetmelidir; böylece kılavuz metni yalnızca
elle komut gerçekten gösterildiğinde görünür.

Desteklenmeyen yerel kontroller, tüm gönderimi başarısız kılmak yerine
indirgenmelidir. Örnekler:

- Satır içi düğmeleri devre dışı olan Telegram metin yedeği gönderir.
- Seçim desteği olmayan bir kanal, seçim seçeneklerini metin olarak listeler.
- Yalnızca URL içeren bir düğme, ya yerel bağlantı düğmesine ya da yedek URL
  satırına dönüşür.
- İsteğe bağlı sabitleme hataları teslim edilen iletiyi başarısız kılmaz.

Ana istisna `delivery.pin.required: true` değeridir; sabitleme zorunlu olarak
istenirse ve kanal gönderilen iletiyi sabitleyemezse, teslim başarısızlık
bildirir.

## Sağlayıcı eşlemesi

Mevcut paketli renderer'lar:

| Kanal           | Yerel işleme hedefi                  | Notlar                                                                                                                                                                 |
| --------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Bileşenler ve bileşen kapsayıcıları  | Mevcut sağlayıcıya yerel yük üreticileri için eski `channelData.discord.components` yapısını korur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır.     |
| Slack           | Block Kit                            | Mevcut sağlayıcıya yerel yük üreticileri için eski `channelData.slack.blocks` yapısını korur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır.          |
| Telegram        | Metin ve satır içi klavyeler         | Düğmeler/seçimler hedef yüzey için satır içi düğme yeteneği gerektirir; aksi halde metin geri dönüşü kullanılır.                                                       |
| Mattermost      | Metin ve etkileşimli özellikler      | Diğer bloklar metne düşürülür.                                                                                                                                         |
| Microsoft Teams | Adaptive Cards                       | Her ikisi de sağlandığında düz `message` metni kartla birlikte dahil edilir.                                                                                           |
| Feishu          | Etkileşimli kartlar                  | Kart başlığı `title` kullanabilir; gövde bu başlığı yinelemekten kaçınır.                                                                                              |
| Düz kanallar    | Metin geri dönüşü                    | İşleyicisi olmayan kanallar yine de okunabilir çıktı alır.                                                                                                             |

Sağlayıcıya yerel yük uyumluluğu, mevcut yanıt üreticileri için bir geçiş
kolaylığıdır. Yeni paylaşılan yerel alanlar eklemek için bir gerekçe değildir.

## Presentation ve InteractiveReply

`InteractiveReply`, onay ve etkileşim yardımcıları tarafından kullanılan daha
eski iç alt kümedir. Şunları destekler:

- metin
- düğmeler
- seçimler

`MessagePresentation`, kanonik paylaşılan gönderim sözleşmesidir. Şunları ekler:

- başlık
- ton
- bağlam
- ayırıcı
- yalnızca URL düğmeleri
- `ReplyPayload.delivery` üzerinden genel teslimat meta verileri

Eski kodu köprülerken `openclaw/plugin-sdk/interactive-runtime` içindeki
yardımcıları kullanın:
__OC_I18N_900011__
Yeni kod doğrudan `MessagePresentation` kabul etmeli veya üretmelidir. Mevcut
`interactive` yükleri, `presentation` öğesinin kullanımdan kaldırılmış bir alt
kümesidir; daha eski üreticiler için runtime desteği sürer.

Eski `InteractiveReply*` türleri ve dönüştürme yardımcıları SDK'da
`@deprecated` olarak işaretlenmiştir:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` ve
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` ve
`presentationToInteractiveControlsReply(...)`, eski kanal uygulamaları için
işleyici köprüleri olarak kullanılabilir kalır. Yeni üretici kodu bunları
çağırmamalıdır; `presentation` gönderin ve işlemeyi core/kanal uyarlamasına
bırakın.

Onay yardımcılarının da presentation öncelikli karşılıkları vardır:

- `buildApprovalInteractiveReplyFromActionDescriptors(...)` yerine
  `buildApprovalPresentationFromActionDescriptors(...)` kullanın
- `buildApprovalInteractiveReply(...)` yerine
  `buildApprovalPresentation(...)` kullanın
- `buildExecApprovalInteractiveReply(...)` yerine
  `buildExecApprovalPresentation(...)` kullanın

`renderMessagePresentationFallbackText(...)`, yalnızca ayırıcıdan oluşan bir
presentation gibi metin geri dönüşü olmayan presentation blokları için boş dize
döndürür. Boş olmayan bir gönderim gövdesi gerektiren taşıyıcılar, varsayılan
geri dönüş sözleşmesini değiştirmeden en küçük gövdeyi etkinleştirmek için
`emptyFallback` geçebilir.

## Teslimat sabitlemesi

Sabitleme, presentation değil teslimat davranışıdır. `channelData.telegram.pin`
gibi sağlayıcıya yerel alanlar yerine `delivery.pin` kullanın.

Anlamlar:

- `pin: true`, başarıyla teslim edilen ilk mesajı sabitler.
- `pin.notify` varsayılan olarak `false` değerindedir.
- `pin.required` varsayılan olarak `false` değerindedir.
- İsteğe bağlı sabitleme hataları düşürülür ve gönderilen mesaj olduğu gibi bırakılır.
- Zorunlu sabitleme hataları teslimatı başarısız kılar.
- Parçalanmış mesajlar son parçayı değil, teslim edilen ilk parçayı sabitler.

Manuel `pin`, `unpin` ve `pins` mesaj eylemleri, sağlayıcının bu işlemleri
desteklediği mevcut mesajlar için hâlâ vardır.

## Plugin yazarı kontrol listesi

- Kanal anlamsal presentation öğesini işleyebildiğinde veya güvenli şekilde
  düşürebildiğinde `describeMessageTool(...)` üzerinden `presentation` bildirin.
- Runtime giden adaptörüne `presentationCapabilities` ekleyin.
- `renderPresentation` işlevini kontrol düzlemi plugin kurulum kodunda değil,
  runtime kodunda uygulayın.
- Yerel kullanıcı arayüzü kütüphanelerini sıcak kurulum/katalog yollarının dışında tutun.
- Bilindiklerinde genel yetenek sınırlarını `presentationCapabilities.limits` üzerinde bildirin.
- Son platform sınırlarını işleyicide ve testlerde koruyun.
- Desteklenmeyen düğmeler, seçimler, URL düğmeleri, başlık/metin yinelemesi ve
  karışık `message` artı `presentation` gönderimleri için geri dönüş testleri ekleyin.
- Teslimat sabitleme desteğini yalnızca sağlayıcı gönderilen mesaj kimliğini
  sabitleyebildiğinde `deliveryCapabilities.pin` ve `pinDeliveredMessage`
  üzerinden ekleyin.
- Paylaşılan mesaj eylemi şeması üzerinden yeni sağlayıcıya yerel
  kart/blok/bileşen/düğme alanları açmayın.

## İlgili belgeler

- [Mesaj CLI](/tr/cli/message)
- [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview)
- [Plugin Mimarisi](/tr/plugins/architecture-internals#message-tool-schemas)
- [Kanal Presentation Refaktör Planı](/tr/plan/ui-channels)
