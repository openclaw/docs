---
read_when:
    - Mesaj kartı, düğme veya seçim denetimi görüntülemeyi ekleme ya da değiştirme
    - Zengin içerikli giden mesajları destekleyen bir kanal Plugin'i oluşturma
    - Mesaj aracının sunumunu veya iletim yeteneklerini değiştirme
    - Sağlayıcıya özgü kart/blok/bileşen işleme regresyonlarında hata ayıklama
summary: Kanal Plugin'leri için anlamsal mesaj kartları, düğmeler, seçim menüleri, yedek metin ve teslimat ipuçları
title: Mesaj sunumu
x-i18n:
    generated_at: "2026-05-10T19:46:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

İleti sunumu, zengin giden sohbet arayüzü için OpenClaw'ın paylaşılan sözleşmesidir.
Aracıların, CLI komutlarının, onay akışlarının ve Plugin'lerin ileti niyetini
bir kez açıklamasını sağlar; her kanal Plugin'i ise bunu yapabildiği en iyi
yerel biçimde işler.

Taşınabilir ileti arayüzü için sunumu kullanın:

- metin bölümleri
- küçük bağlam/alt bilgi metni
- ayırıcılar
- düğmeler
- seçim menüleri
- kart başlığı ve tonu

Paylaşılan ileti aracına Discord `components`, Slack `blocks`, Telegram
`buttons`, Teams `card` veya Feishu `card` gibi yeni sağlayıcıya özgü yerel
alanlar eklemeyin. Bunlar kanal Plugin'inin sahip olduğu işleyici çıktılarıdır.

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

- `value`, kanal tıklanabilir denetimleri desteklediğinde kanalın mevcut
  etkileşim yolu üzerinden geri yönlendirilen bir uygulama eylemi değeridir.
- `url` bir bağlantı düğmesidir. `value` olmadan da var olabilir.
- `label` zorunludur ve metin yedeğinde de kullanılır.
- `style` tavsiye niteliğindedir. İşleyiciler desteklenmeyen stilleri güvenli
  bir varsayılana eşlemeli, gönderimi başarısız kılmamalıdır.

Seçim semantiği:

- `options[].value`, seçilen uygulama değeridir.
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

Sabitlenmiş teslimat:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Açık JSON ile sabitlenmiş teslimat:

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

Yetenek alanları özellikle basit boolean değerlerdir. Bunlar, işleyicinin
neleri etkileşimli hale getirebildiğini açıklar; her yerel platform sınırını
değil. İşleyiciler maksimum düğme sayısı, blok sayısı ve kart boyutu gibi
platforma özgü sınırların sahipliğini yine üstlenir.

## Çekirdek işleme akışı

Bir `ReplyPayload` veya ileti eylemi `presentation` içerdiğinde çekirdek:

1. Sunum yükünü normalleştirir.
2. Hedef kanalın giden bağdaştırıcısını çözer.
3. `presentationCapabilities` değerini okur.
4. Bağdaştırıcı yükü işleyebildiğinde `renderPresentation` çağrısı yapar.
5. Bağdaştırıcı yoksa veya işleyemiyorsa korumacı metne geri döner.
6. Ortaya çıkan yükü normal kanal teslimat yolu üzerinden gönderir.
7. İlk başarılı gönderilen iletiden sonra `delivery.pin` gibi teslimat
   meta verilerini uygular.

Çekirdek yedek davranışın sahibidir; böylece üreticiler kanaldan bağımsız
kalabilir. Kanal Plugin'leri yerel işleme ve etkileşim yönetiminin sahibidir.

## Bozulma kuralları

Sunum, sınırlı kanallarda gönderim için güvenli olmalıdır.

Yedek metin şunları içerir:

- ilk satır olarak `title`
- normal paragraflar olarak `text` blokları
- kompakt bağlam satırları olarak `context` blokları
- görsel ayırıcı olarak `divider` blokları
- bağlantı düğmeleri için URL'ler dahil düğme etiketleri
- seçim seçeneği etiketleri

Desteklenmeyen yerel denetimler, tüm gönderimi başarısız kılmak yerine
bozulmalıdır. Örnekler:

- Satır içi düğmeleri devre dışı olan Telegram, metin yedeği gönderir.
- Seçim desteği olmayan bir kanal, seçim seçeneklerini metin olarak listeler.
- Yalnızca URL içeren bir düğme, yerel bağlantı düğmesine ya da yedek URL
  satırına dönüşür.
- İsteğe bağlı sabitleme hataları teslim edilen iletiyi başarısız kılmaz.

Ana istisna `delivery.pin.required: true` değeridir; sabitleme zorunlu olarak
istenirse ve kanal gönderilen iletiyi sabitleyemezse, teslimat başarısızlık
bildirir.

## Sağlayıcı eşlemesi

Geçerli paketli işleyiciler:

| Kanal           | Yerel işleme hedefi                 | Notlar                                                                                                                                              |
| --------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Bileşenler ve bileşen kapsayıcıları | Mevcut sağlayıcıya özgü yerel yük üreticileri için eski `channelData.discord.components` değerini korur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır. |
| Slack           | Block Kit                           | Mevcut sağlayıcıya özgü yerel yük üreticileri için eski `channelData.slack.blocks` değerini korur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır. |
| Telegram        | Metin ve satır içi klavyeler        | Düğmeler/seçimler hedef yüzey için satır içi düğme yeteneği gerektirir; aksi halde metin yedeği kullanılır.                                         |
| Mattermost      | Metin ve etkileşimli özellikler     | Diğer bloklar metne bozulur.                                                                                                                        |
| Microsoft Teams | Adaptive Cards                      | Her ikisi de sağlandığında düz `message` metni karta dahil edilir.                                                                                  |
| Feishu          | Etkileşimli kartlar                 | Kart başlığı `title` kullanabilir; gövde bu başlığı yinelemekten kaçınır.                                                                           |
| Düz kanallar    | Metin yedeği                        | İşleyicisi olmayan kanallar da okunabilir çıktı alır.                                                                                               |

Sağlayıcıya özgü yerel yük uyumluluğu, mevcut yanıt üreticileri için bir geçiş
kolaylığıdır. Yeni paylaşılan yerel alanlar eklemek için bir gerekçe değildir.

## Presentation ve InteractiveReply

`InteractiveReply`, onay ve etkileşim yardımcıları tarafından kullanılan eski
dahili alt kümedir. Şunları destekler:

- metin
- düğmeler
- seçimler

`MessagePresentation`, kurallı paylaşılan gönderim sözleşmesidir. Şunları ekler:

- başlık
- ton
- bağlam
- ayırıcı
- yalnızca URL içeren düğmeler
- `ReplyPayload.delivery` üzerinden genel teslimat meta verileri

Eski kodu köprülerken `openclaw/plugin-sdk/interactive-runtime` yardımcılarını
kullanın:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Yeni kod doğrudan `MessagePresentation` kabul etmeli veya üretmelidir.

`presentationToInteractiveReply(...)`, başlık, metin, bağlam, düğmeler ve
seçimleri eski `InteractiveReply` şekline eşleyerek görünür sunum metnini
korur. Başlık, metin, bağlam ve ayırıcı blokları zaten yerel olarak çizen
bileşen işleyicileri bunun yerine `presentationToInteractiveControlsReply(...)`
kullanmalı, ardından yalnızca düğme ve seçim denetimlerini eklemelidir.

`renderMessagePresentationFallbackText(...)`, yalnızca ayırıcıdan oluşan bir
sunum gibi metin yedeği olmayan sunum blokları için boş string döndürür.
Boş olmayan bir gönderim gövdesi gerektiren taşıyıcılar, varsayılan yedek
sözleşmesini değiştirmeden asgari bir gövdeye geçmek için `emptyFallback`
iletebilir.

## Teslimat sabitlemesi

Sabitleme sunum değil, teslimat davranışıdır. `channelData.telegram.pin` gibi
sağlayıcıya özgü yerel alanlar yerine `delivery.pin` kullanın.

Semantik:

- `pin: true` başarıyla teslim edilen ilk iletiyi sabitler.
- `pin.notify` varsayılan olarak `false` değerindedir.
- `pin.required` varsayılan olarak `false` değerindedir.
- İsteğe bağlı sabitleme hataları bozulur ve gönderilen iletiyi olduğu gibi bırakır.
- Zorunlu sabitleme hataları teslimatı başarısız kılar.
- Parçalı iletiler son parçayı değil, teslim edilen ilk parçayı sabitler.

Sağlayıcının bu işlemleri desteklediği mevcut iletiler için manuel `pin`,
`unpin` ve `pins` ileti eylemleri hâlâ mevcuttur.

## Plugin yazarı kontrol listesi

- Kanal semantik sunumu işleyebildiğinde veya güvenli şekilde bozabildiğinde
  `describeMessageTool(...)` üzerinden `presentation` bildirin.
- Çalışma zamanı giden bağdaştırıcısına `presentationCapabilities` ekleyin.
- `renderPresentation` öğesini denetim düzlemi Plugin kurulum kodunda değil,
  çalışma zamanı kodunda uygulayın.
- Yerel arayüz kitaplıklarını sıcak kurulum/katalog yollarının dışında tutun.
- Platform sınırlarını işleyicide ve testlerde koruyun.
- Desteklenmeyen düğmeler, seçimler, URL düğmeleri, başlık/metin yinelemesi ve
  karışık `message` artı `presentation` gönderimleri için yedek testleri ekleyin.
- Yalnızca sağlayıcı gönderilen ileti kimliğini sabitleyebildiğinde
  `deliveryCapabilities.pin` ve `pinDeliveredMessage` üzerinden teslimat
  sabitleme desteği ekleyin.
- Paylaşılan ileti eylemi şeması üzerinden yeni sağlayıcıya özgü yerel
  kart/blok/bileşen/düğme alanları sunmayın.

## İlgili belgeler

- [İleti CLI'si](/tr/cli/message)
- [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview)
- [Plugin Mimarisi](/tr/plugins/architecture-internals#message-tool-schemas)
- [Kanal Sunumu Yeniden Düzenleme Planı](/tr/plan/ui-channels)
