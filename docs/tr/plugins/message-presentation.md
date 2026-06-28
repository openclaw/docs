---
read_when:
    - Mesaj kartı, düğme veya seçim işleme ekleme ya da değiştirme
    - Zengin giden iletileri destekleyen bir kanal Plugin'i oluşturma
    - Mesaj aracı sunumunu veya iletim yeteneklerini değiştirme
    - Sağlayıcıya özgü kart/blok/bileşen işleme gerilemelerinde hata ayıklama
summary: Kanal Plugin'leri için anlamsal mesaj kartları, düğmeler, seçimler, yedek metin ve teslim ipuçları
title: Mesaj sunumu
x-i18n:
    generated_at: "2026-06-28T00:55:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

İleti sunumu, zengin giden sohbet kullanıcı arayüzü için OpenClaw'ın paylaşılan sözleşmesidir.
Aracıların, CLI komutlarının, onay akışlarının ve Plugin'lerin ileti
amacını bir kez tanımlamasını, her kanal Plugin'inin ise yapabildiği en iyi yerel biçimde işlemesini sağlar.

Taşınabilir ileti kullanıcı arayüzü için sunumu kullanın:

- metin bölümleri
- küçük bağlam/alt bilgi metni
- ayırıcılar
- düğmeler
- seçim menüleri
- kart başlığı ve tonu

Paylaşılan ileti aracına Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` veya Feishu `card` gibi yeni sağlayıcıya özgü yerel alanlar eklemeyin.
Bunlar, kanal Plugin'inin sahip olduğu işleyici çıktılarıdır.

## Sözleşme

Plugin yazarları herkese açık sözleşmeyi şuradan içe aktarır:

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

Düğme anlamları:

- `action.type: "command"`, çekirdeğin komut yolu üzerinden yerel bir eğik çizgi komutu çalıştırır.
  Bunu yerleşik komut düğmeleri ve menüler için kullanın.
- `action.type: "callback"`, kanalın etkileşim yolu üzerinden opak Plugin verisi taşır.
  Kanal Plugin'leri geri çağırma verisini eğik çizgi komutları olarak yeniden yorumlamamalıdır.
- `value`, eski opak geri çağırma değeridir. Yeni denetimler `action` kullanmalıdır;
  böylece kanal Plugin'leri komutları ve geri çağırmaları metinden tahmin etmeden eşleyebilir.
- `url` bir bağlantı düğmesidir. `value` olmadan var olabilir.
- `webApp`, kanala özgü yerel bir web uygulaması düğmesini tanımlar. Telegram bunu
  `web_app` olarak işler ve yalnızca özel sohbetlerde destekler. `web_app`, uyumluluk için
  esnek JSON yüklerinde hâlâ kabul edilir, ancak TypeScript üreticileri
  `webApp` kullanmalıdır.
- `label` zorunludur ve metin yedeğinde de kullanılır.
- `style` tavsiye niteliğindedir. İşleyiciler desteklenmeyen stilleri güvenli bir
  varsayılana eşlemeli, gönderimi başarısız yapmamalıdır.
- `priority` isteğe bağlıdır. Bir kanal eylem sınırlarını duyurduğunda ve denetimlerin
  bırakılması gerektiğinde, çekirdek önce daha yüksek öncelikli düğmeleri tutar ve
  eşit öncelikli düğmeler arasında özgün sırayı korur. Tüm denetimler sığdığında, yazıldığı
  sıra korunur.
- `disabled` isteğe bağlıdır. Kanallar `supportsDisabled` ile bunu açıkça desteklemelidir; aksi halde
  çekirdek devre dışı denetimi etkileşimli olmayan yedek metne düşürür.
- `reusable` isteğe bağlıdır. Yeniden kullanılabilir yerel geri çağırmaları destekleyen kanallar,
  başarılı bir etkileşimden sonra eylemi kullanılabilir tutabilir. Bunu yenileme, inceleme
  veya daha fazla ayrıntı gibi tekrarlanabilir ya da idempotent eylemler için kullanın;
  normal tek seferlik onaylar ve yıkıcı eylemler için ayarlamadan bırakın.

Seçim anlamları:

- `options[].action`, düğme `action` ile aynı komut/geri çağırma anlamına sahiptir.
- `options[].value`, eski seçili uygulama değeridir.
- `placeholder` tavsiye niteliğindedir ve yerel seçim desteği olmayan kanallar tarafından
  yok sayılabilir.
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

## İşleyici sözleşmesi

Kanal Plugin'leri giden bağdaştırıcılarında işleme desteğini bildirir:

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

Yetenek boole değerleri, işleyicinin neleri etkileşimli yapabildiğini tanımlar. İsteğe bağlı
`limits`, çekirdeğin işleyiciyi çağırmadan önce uyarlayabileceği genel zarfı tanımlar:

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

Çekirdek, işleme öncesinde anlamsal denetimlere genel sınırları uygular. İşleyiciler,
yerel blok sayısı, kart boyutu, URL sınırları ve genel sözleşmede ifade edilemeyen
sağlayıcıya özgü özellikler için nihai sağlayıcıya özgü doğrulama ve kırpma
sorumluluğunu yine üstlenir. Sınırlar bir bloktaki her denetimi kaldırırsa, çekirdek
etiketleri etkileşimli olmayan bağlam metni olarak tutar; böylece teslim edilen iletide yine
görünür bir yedek bulunur.

## Çekirdek işleme akışı

Bir `ReplyPayload` veya ileti eylemi `presentation` içerdiğinde, çekirdek:

1. Sunum yükünü normalleştirir.
2. Hedef kanalın giden bağdaştırıcısını çözer.
3. `presentationCapabilities` değerini okur.
4. Bağdaştırıcı bunları duyuruyorsa eylem sayısı, etiket uzunluğu ve
   seçim seçeneği sayısı gibi genel yetenek sınırlarını uygular.
5. Bağdaştırıcı yükü işleyebildiğinde `renderPresentation` çağırır.
6. Bağdaştırıcı yoksa veya işleyemiyorsa korumacı metne geri döner.
7. Ortaya çıkan yükü normal kanal teslim yolu üzerinden gönderir.
8. İlk başarılı gönderilmiş iletiden sonra `delivery.pin` gibi teslim meta verilerini uygular.

Çekirdek yedek davranışın sahibidir; böylece üreticiler kanaldan bağımsız kalabilir. Kanal
Plugin'leri yerel işleme ve etkileşim işleme sorumluluğunu üstlenir.

## Düşürme kuralları

Sunum, sınırlı kanallarda gönderilmeye güvenli olmalıdır.

Yedek metin şunları içerir:

- ilk satır olarak `title`
- normal paragraflar olarak `text` blokları
- kompakt bağlam satırları olarak `context` blokları
- görsel ayırıcı olarak `divider` blokları
- bağlantı düğmeleri için URL'ler dahil düğme etiketleri
- seçim seçeneği etiketleri

Desteklenmeyen yerel denetimler, tüm gönderimi başarısız yapmak yerine düşürülmelidir.
Örnekler:

- Satır içi düğmeleri devre dışı olan Telegram metin yedeği gönderir.
- Seçim desteği olmayan bir kanal seçim seçeneklerini metin olarak listeler.
- Yalnızca URL içeren bir düğme ya yerel bağlantı düğmesine ya da yedek URL satırına dönüşür.
- İsteğe bağlı sabitleme hataları teslim edilen iletiyi başarısız yapmaz.

Ana istisna `delivery.pin.required: true` değeridir; sabitleme gerekli olarak istenmişse
ve kanal gönderilen iletiyi sabitleyemiyorsa, teslim başarısızlık bildirir.

## Sağlayıcı eşlemesi

Geçerli paketlenmiş işleyiciler:

| Kanal           | Yerel işleme hedefi                 | Notlar                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Bileşenler ve bileşen kapsayıcıları | Mevcut sağlayıcıya özgü yerel yük üreticileri için eski `channelData.discord.components` değerini korur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır. |
| Slack           | Block Kit                           | Mevcut sağlayıcıya özgü yerel yük üreticileri için eski `channelData.slack.blocks` değerini korur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır.       |
| Telegram        | Metin artı satır içi klavyeler      | Düğmeler/seçimler hedef yüzey için satır içi düğme yeteneği gerektirir; aksi halde metin yedeği kullanılır.                                         |
| Mattermost      | Metin artı etkileşimli özellikler   | Diğer bloklar metne düşürülür.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | Her ikisi de sağlandığında düz `message` metni kartla birlikte eklenir.                                                                            |
| Feishu          | Etkileşimli kartlar                 | Kart başlığı `title` kullanabilir; gövde bu başlığı yinelemekten kaçınır.                                                                          |
| Düz kanallar    | Metin yedeği                        | İşleyicisi olmayan kanallar da okunabilir çıktı alır.                                                                                            |

Sağlayıcıya özgü yerel payload uyumluluğu, mevcut yanıt üreticileri için bir geçiş kolaylığıdır. Yeni paylaşılan yerel alanlar eklemek için bir gerekçe değildir.

## Sunum ve InteractiveReply

`InteractiveReply`, onay ve etkileşim yardımcıları tarafından kullanılan eski dahili alt kümedir. Şunları destekler:

- metin
- düğmeler
- seçimler

`MessagePresentation`, kanonik paylaşılan gönderme sözleşmesidir. Şunları ekler:

- başlık
- ton
- bağlam
- ayırıcı
- yalnızca URL düğmeleri
- `ReplyPayload.delivery` üzerinden genel teslimat meta verileri

Eski kodu köprülerken `openclaw/plugin-sdk/interactive-runtime` içindeki yardımcıları kullanın:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Yeni kod doğrudan `MessagePresentation` kabul etmeli veya üretmelidir. Mevcut `interactive` payload'ları, `presentation` öğesinin kullanımdan kaldırılmış bir alt kümesidir; eski üreticiler için çalışma zamanı desteği sürer.

Eski `InteractiveReply*` türleri ve dönüştürme yardımcıları SDK'da `@deprecated` olarak işaretlenmiştir:

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
`presentationToInteractiveControlsReply(...)`, eski kanal uygulamaları için oluşturucu köprüleri olarak kullanılabilir kalır. Yeni üretici kod bunları çağırmamalıdır; `presentation` gönderin ve çekirdek/kanal uyarlamasının oluşturmayı işlemesine izin verin.

Onay yardımcılarının da sunum öncelikli karşılıkları vardır:

- `buildApprovalInteractiveReplyFromActionDescriptors(...)` yerine
  `buildApprovalPresentationFromActionDescriptors(...)` kullanın
- `buildApprovalInteractiveReply(...)` yerine
  `buildApprovalPresentation(...)` kullanın
- `buildExecApprovalInteractiveReply(...)` yerine
  `buildExecApprovalPresentation(...)` kullanın

`renderMessagePresentationFallbackText(...)`, yalnızca ayırıcı içeren bir sunum gibi metin yedeği olmayan sunum blokları için boş dize döndürür. Boş olmayan bir gönderim gövdesi gerektiren aktarımlar, varsayılan yedek sözleşmesini değiştirmeden en düşük düzeyde bir gövdeyi seçmek için `emptyFallback` iletebilir.

## Teslimat sabitlemesi

Sabitleme sunum değil, teslimat davranışıdır. `channelData.telegram.pin` gibi sağlayıcıya özgü yerel alanlar yerine `delivery.pin` kullanın.

Anlamı:

- `pin: true`, başarıyla teslim edilen ilk iletiyi sabitler.
- `pin.notify` varsayılan olarak `false` olur.
- `pin.required` varsayılan olarak `false` olur.
- İsteğe bağlı sabitleme hataları daha düşük öncelikle ele alınır ve gönderilen iletiyi olduğu gibi bırakır.
- Zorunlu sabitleme hataları teslimatı başarısız kılar.
- Parçalara bölünmüş iletiler, son parçayı değil teslim edilen ilk parçayı sabitler.

Sağlayıcının bu işlemleri desteklediği mevcut iletiler için manuel `pin`, `unpin` ve `pins` ileti eylemleri hâlâ vardır.

## Plugin yazarı kontrol listesi

- Kanal anlamsal sunumu oluşturabiliyor veya güvenle daha basit bir biçime indirebiliyorsa `describeMessageTool(...)` içinden `presentation` bildirin.
- Çalışma zamanı giden bağdaştırıcısına `presentationCapabilities` ekleyin.
- `renderPresentation` öğesini kontrol düzlemi Plugin kurulum kodunda değil, çalışma zamanı kodunda uygulayın.
- Yerel UI kitaplıklarını sıcak kurulum/katalog yollarının dışında tutun.
- Biliniyorsa genel yetenek sınırlarını `presentationCapabilities.limits` üzerinde bildirin.
- Nihai platform sınırlarını oluşturucuda ve testlerde koruyun.
- Desteklenmeyen düğmeler, seçimler, URL düğmeleri, başlık/metin yinelemesi ve karma `message` artı `presentation` gönderimleri için yedek testleri ekleyin.
- Teslimat sabitleme desteğini `deliveryCapabilities.pin` ve
  `pinDeliveredMessage` üzerinden yalnızca sağlayıcı gönderilen ileti kimliğini sabitleyebiliyorsa ekleyin.
- Paylaşılan ileti eylemi şeması üzerinden yeni sağlayıcıya özgü yerel kart/blok/bileşen/düğme alanları sunmayın.

## İlgili belgeler

- [İleti CLI'si](/tr/cli/message)
- [Plugin SDK Genel Bakışı](/tr/plugins/sdk-overview)
- [Plugin Mimarisi](/tr/plugins/architecture-internals#message-tool-schemas)
- [Kanal Sunumu Refaktör Planı](/tr/plan/ui-channels)
