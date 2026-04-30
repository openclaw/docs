---
read_when:
    - Mesaj kartı, düğme veya seçim gösterimini ekleme ya da değiştirme
    - Zengin giden mesajları destekleyen bir kanal Plugin'i oluşturma
    - Mesaj aracının sunumunu veya iletim yeteneklerini değiştirme
    - Sağlayıcıya özgü kart/blok/bileşen işleme regresyonlarında hata ayıklama
summary: Kanal Plugin'leri için anlamsal mesaj kartları, düğmeler, seçim menüleri, yedek metin ve teslim ipuçları
title: Mesaj sunumu
x-i18n:
    generated_at: "2026-04-30T09:36:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

İleti sunumu, zengin giden sohbet kullanıcı arayüzü için OpenClaw'ın paylaşılan sözleşmesidir.
Aracıların, CLI komutlarının, onay akışlarının ve plugins'in ileti
amacını bir kez açıklamasını, her kanal plugin'inin ise sunabileceği en iyi
yerel biçimde işlemesini sağlar.

Taşınabilir ileti kullanıcı arayüzü için sunumu kullanın:

- metin bölümleri
- küçük bağlam/alt bilgi metni
- ayırıcılar
- düğmeler
- seçim menüleri
- kart başlığı ve tonu

Paylaşılan ileti aracına Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` veya Feishu `card` gibi yeni
sağlayıcıya özgü yerel alanlar eklemeyin. Bunlar kanal plugin'inin sahip olduğu
işleyici çıktılarıdır.

## Sözleşme

Plugin yazarları herkese açık sözleşmeyi şuradan içe aktarır:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Biçim:

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

- `value`, kanal tıklanabilir kontrolleri desteklediğinde kanalın mevcut
  etkileşim yolu üzerinden geri yönlendirilen bir uygulama eylem değeridir.
- `url` bir bağlantı düğmesidir. `value` olmadan var olabilir.
- `label` zorunludur ve metin geri dönüşünde de kullanılır.
- `style` tavsiye niteliğindedir. İşleyiciler desteklenmeyen stilleri güvenli
  bir varsayılana eşlemeli, gönderimi başarısız kılmamalıdır.

Seçim semantiği:

- `options[].value` seçilen uygulama değeridir.
- `placeholder` tavsiye niteliğindedir ve yerel seçim desteği olmayan kanallar
  tarafından yok sayılabilir.
- Bir kanal seçimleri desteklemiyorsa, geri dönüş metni etiketleri listeler.

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

Kanal plugins'i, giden bağdaştırıcılarında işleme desteğini bildirir:

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
etkileşimli hale getirebildiklerini açıklar; her yerel platform sınırını değil.
İşleyiciler maksimum düğme sayısı, blok sayısı ve kart boyutu gibi platforma
özgü sınırların sahipliğini yine üstlenir.

## Çekirdek işleme akışı

Bir `ReplyPayload` veya ileti eylemi `presentation` içerdiğinde çekirdek:

1. Sunum yükünü normalleştirir.
2. Hedef kanalın giden bağdaştırıcısını çözümler.
3. `presentationCapabilities` öğesini okur.
4. Bağdaştırıcı yükü işleyebildiğinde `renderPresentation` çağırır.
5. Bağdaştırıcı yoksa veya işleyemiyorsa korumacı metne geri döner.
6. Ortaya çıkan yükü normal kanal teslimat yolu üzerinden gönderir.
7. İlk başarılı gönderilmiş iletiden sonra `delivery.pin` gibi teslimat
   meta verilerini uygular.

Çekirdek, üreticilerin kanaldan bağımsız kalabilmesi için geri dönüş davranışının
sahibidir. Kanal plugins'i yerel işleme ve etkileşim yönetiminin sahibidir.

## Bozulma kuralları

Sunum, sınırlı kanallarda gönderilmeye güvenli olmalıdır.

Geri dönüş metni şunları içerir:

- ilk satır olarak `title`
- normal paragraflar olarak `text` blokları
- kompakt bağlam satırları olarak `context` blokları
- görsel ayırıcı olarak `divider` blokları
- bağlantı düğmeleri için URL'ler dahil düğme etiketleri
- seçim seçeneği etiketleri

Desteklenmeyen yerel kontroller, tüm gönderimi başarısız kılmak yerine
bozulmalıdır. Örnekler:

- Satır içi düğmeleri devre dışı olan Telegram, metin geri dönüşü gönderir.
- Seçim desteği olmayan bir kanal, seçim seçeneklerini metin olarak listeler.
- Yalnızca URL içeren bir düğme, yerel bağlantı düğmesine veya geri dönüş URL
  satırına dönüşür.
- İsteğe bağlı sabitleme hataları teslim edilen iletiyi başarısız kılmaz.

Ana istisna `delivery.pin.required: true` durumudur; sabitleme zorunlu olarak
istenirse ve kanal gönderilen iletiyi sabitleyemezse, teslimat hata bildirir.

## Sağlayıcı eşlemesi

Mevcut paketli işleyiciler:

| Kanal           | Yerel işleme hedefi                | Notlar                                                                                                                                         |
| --------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Bileşenler ve bileşen kapsayıcıları | Mevcut sağlayıcıya özgü yerel yük üreticileri için eski `channelData.discord.components` öğesini korur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır. |
| Slack           | Block Kit                          | Mevcut sağlayıcıya özgü yerel yük üreticileri için eski `channelData.slack.blocks` öğesini korur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır. |
| Telegram        | Metin ve satır içi klavyeler       | Düğmeler/seçimler hedef yüzey için satır içi düğme yeteneği gerektirir; aksi halde metin geri dönüşü kullanılır.                              |
| Mattermost      | Metin ve etkileşimli props         | Diğer bloklar metne bozulur.                                                                                                                   |
| Microsoft Teams | Adaptive Cards                     | Her ikisi de sağlandığında düz `message` metni kartla birlikte dahil edilir.                                                                   |
| Feishu          | Etkileşimli kartlar                | Kart başlığı `title` kullanabilir; gövde bu başlığı yinelemekten kaçınır.                                                                      |
| Düz kanallar    | Metin geri dönüşü                  | İşleyicisi olmayan kanallar yine de okunabilir çıktı alır.                                                                                     |

Sağlayıcıya özgü yerel yük uyumluluğu, mevcut yanıt üreticileri için bir geçiş
kolaylığıdır. Yeni paylaşılan yerel alanlar eklemek için bir gerekçe değildir.

## Sunum ve InteractiveReply

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

Eski kodu bağlarken `openclaw/plugin-sdk/interactive-runtime` içindeki yardımcıları kullanın:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Yeni kod doğrudan `MessagePresentation` kabul etmeli veya üretmelidir.

## Teslimat sabitleme

Sabitleme, sunum değil teslimat davranışıdır. `channelData.telegram.pin` gibi
sağlayıcıya özgü yerel alanlar yerine `delivery.pin` kullanın.

Semantik:

- `pin: true` ilk başarıyla teslim edilen iletiyi sabitler.
- `pin.notify` varsayılan olarak `false` olur.
- `pin.required` varsayılan olarak `false` olur.
- İsteğe bağlı sabitleme hataları bozulur ve gönderilen iletiyi olduğu gibi bırakır.
- Zorunlu sabitleme hataları teslimatı başarısız kılar.
- Parçalanmış iletiler kuyruk parçasını değil, ilk teslim edilen parçayı sabitler.

Sağlayıcının bu işlemleri desteklediği mevcut iletiler için manuel `pin`,
`unpin` ve `pins` ileti eylemleri hâlâ vardır.

## Plugin yazarı kontrol listesi

- Kanal semantik sunumu işleyebildiğinde veya güvenli şekilde bozabildiğinde
  `describeMessageTool(...)` içinden `presentation` bildirin.
- Çalışma zamanı giden bağdaştırıcısına `presentationCapabilities` ekleyin.
- `renderPresentation` öğesini kontrol düzlemi plugin kurulum kodunda değil,
  çalışma zamanı kodunda uygulayın.
- Yerel kullanıcı arayüzü kitaplıklarını sıcak kurulum/katalog yollarının dışında tutun.
- Platform sınırlarını işleyicide ve testlerde koruyun.
- Desteklenmeyen düğmeler, seçimler, URL düğmeleri, başlık/metin yinelemesi ve
  karışık `message` artı `presentation` gönderimleri için geri dönüş testleri ekleyin.
- Teslimat sabitleme desteğini yalnızca sağlayıcı gönderilen ileti kimliğini
  sabitleyebildiğinde `deliveryCapabilities.pin` ve `pinDeliveredMessage` üzerinden ekleyin.
- Yeni sağlayıcıya özgü yerel kart/blok/bileşen/düğme alanlarını paylaşılan
  ileti eylemi şeması üzerinden göstermeyin.

## İlgili dokümanlar

- [İleti CLI](/tr/cli/message)
- [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview)
- [Plugin Mimarisi](/tr/plugins/architecture-internals#message-tool-schemas)
- [Kanal Sunumu Yeniden Düzenleme Planı](/tr/plan/ui-channels)
