---
read_when:
    - Mesaj kartı, düğme veya seçim işleme ekleme ya da değiştirme
    - Zengin giden mesajları destekleyen bir kanal plugin'i oluşturma
    - Mesaj aracı sunumunu veya teslimat yeteneklerini değiştirme
    - Sağlayıcıya özgü kart/blok/bileşen işleme regresyonlarında hata ayıklama
summary: Kanal plugin'leri için anlamsal mesaj kartları, düğmeler, seçimler, geri dönüş metni ve teslimat ipuçları
title: Mesaj Sunumu
x-i18n:
    generated_at: "2026-04-22T04:24:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# Mesaj Sunumu

Mesaj sunumu, OpenClaw'ın zengin giden sohbet arayüzü için paylaşılan sözleşmesidir.
Ajanların, CLI komutlarının, onay akışlarının ve plugin'lerin mesaj
amacını bir kez tanımlamasına izin verir; her kanal plugin'i ise desteklediği en iyi yerel biçimi işler.

Taşınabilir mesaj arayüzü için sunumu kullanın:

- metin bölümleri
- küçük bağlam/alt bilgi metni
- ayraçlar
- düğmeler
- seçim menüleri
- kart başlığı ve ton

Paylaşılan mesaj aracına Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` veya Feishu `card` gibi yeni sağlayıcıya özgü alanlar eklemeyin. Bunlar kanal plugin'inin sahip olduğu işleyici çıktılarıdır.

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

Düğme anlambilimi:

- `value`, kanal tıklanabilir denetimleri desteklediğinde kanalın
  mevcut etkileşim yolu üzerinden geri yönlendirilen uygulama eylem değeridir.
- `url`, bağlantı düğmesidir. `value` olmadan da var olabilir.
- `label` zorunludur ve metin geri dönüşünde de kullanılır.
- `style` yönlendiricidir. İşleyiciler desteklenmeyen stilleri
  gönderimi başarısız kılmak yerine güvenli bir varsayılana eşlemelidir.

Seçim anlambilimi:

- `options[].value`, seçilen uygulama değeridir.
- `placeholder` yönlendiricidir ve yerel seçim desteği olmayan kanallarda yok sayılabilir.
- Bir kanal seçimleri desteklemiyorsa, geri dönüş metni etiketleri listeler.

## Üretici Örnekleri

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

## İşleyici Sözleşmesi

Kanal plugin'leri giden bağdaştırıcılarında işleme desteğini bildirir:

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

Yetenek alanları bilerek basit boolean'lardır. Bunlar işleyicinin
etkileşimli hale getirebildiği şeyi tanımlar, her yerel platform sınırını değil. Düğme sayısı, blok sayısı ve
kart boyutu gibi platforma özgü sınırların sahibi yine işleyicilerdir.

## Çekirdek İşleme Akışı

Bir `ReplyPayload` veya mesaj eylemi `presentation` içerdiğinde, çekirdek:

1. Sunum yükünü normalize eder.
2. Hedef kanalın giden bağdaştırıcısını çözer.
3. `presentationCapabilities` alanını okur.
4. Bağdaştırıcı yükü işleyebildiğinde `renderPresentation` çağırır.
5. Bağdaştırıcı yoksa veya işleyemiyorsa tutucu metne geri döner.
6. Elde edilen yükü normal kanal teslimat yolu üzerinden gönderir.
7. İlk başarılı gönderilen mesajdan sonra `delivery.pin` gibi teslimat meta verilerini uygular.

Çekirdek, üreticilerin kanal bağımsız kalabilmesi için geri dönüş davranışının sahibidir. Kanal
plugin'leri ise yerel işleme ve etkileşim yönetiminin sahibidir.

## Bozulma Kuralları

Sunum, sınırlı kanallarda gönderilebilecek kadar güvenli olmalıdır.

Geri dönüş metni şunları içerir:

- ilk satır olarak `title`
- normal paragraflar olarak `text` blokları
- kompakt bağlam satırları olarak `context` blokları
- görsel ayırıcı olarak `divider` blokları
- bağlantı düğmeleri için URL'ler dahil düğme etiketleri
- seçim seçeneği etiketleri

Desteklenmeyen yerel denetimler, tüm gönderimi başarısız kılmak yerine bozulmalıdır.
Örnekler:

- Satır içi düğmeler devre dışıysa Telegram metin geri dönüşü gönderir.
- Seçim desteği olmayan bir kanal seçim seçeneklerini metin olarak listeler.
- Yalnızca URL içeren bir düğme ya yerel bağlantı düğmesine ya da geri dönüş URL satırına dönüşür.
- İsteğe bağlı sabitleme hataları teslim edilen mesajı başarısız kılmaz.

Ana istisna `delivery.pin.required: true` durumudur; sabitleme zorunlu olarak
istendiyse ve kanal gönderilen mesajı sabitleyemiyorsa, teslimat başarısız bildirilir.

## Sağlayıcı Eşlemesi

Mevcut paketle gelen işleyiciler:

| Kanal           | Yerel işleme hedefi                 | Notlar                                                                                                                                           |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discord         | Components ve component containers  | Mevcut sağlayıcıya özgü yük üreticileri için eski `channelData.discord.components` korunur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır. |
| Slack           | Block Kit                           | Mevcut sağlayıcıya özgü yük üreticileri için eski `channelData.slack.blocks` korunur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır. |
| Telegram        | Metin artı satır içi klavyeler      | Düğmeler/seçimler hedef yüzey için satır içi düğme yeteneği gerektirir; aksi halde metin geri dönüşü kullanılır.                               |
| Mattermost      | Metin artı etkileşimli props        | Diğer bloklar metne bozulur.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | İkisi de verildiğinde düz `message` metni kartla birlikte eklenir.                                                                              |
| Feishu          | Etkileşimli kartlar                 | Kart başlığı `title` kullanabilir; gövde bu başlığı yinelemekten kaçınır.                                                                      |
| Düz kanallar    | Metin geri dönüşü                   | İşleyicisi olmayan kanallar da yine okunabilir çıktı alır.                                                                                      |

Sağlayıcıya özgü yük uyumluluğu, mevcut
yanıt üreticileri için bir geçiş kolaylığıdır. Bu, yeni paylaşılan yerel alanlar eklemek için bir gerekçe değildir.

## Presentation ve InteractiveReply

`InteractiveReply`, onay ve etkileşim
yardımcıları tarafından kullanılan eski dahili alt kümedir. Şunları destekler:

- metin
- düğmeler
- seçimler

`MessagePresentation`, ortak gönderim için kanonik sözleşmedir. Şunları ekler:

- başlık
- ton
- bağlam
- ayraç
- yalnızca URL içeren düğmeler
- `ReplyPayload.delivery` üzerinden genel teslimat meta verileri

Eski kodu köprülerken `openclaw/plugin-sdk/interactive-runtime` içindeki yardımcıları kullanın:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Yeni kod doğrudan `MessagePresentation` kabul etmeli veya üretmelidir.

## Delivery Pin

Sabitleme bir sunum değil, teslimat davranışıdır. Sağlayıcıya özgü
`channelData.telegram.pin` gibi alanlar yerine `delivery.pin` kullanın.

Anlambilim:

- `pin: true`, başarıyla teslim edilen ilk mesajı sabitler.
- `pin.notify` varsayılan olarak `false` değerindedir.
- `pin.required` varsayılan olarak `false` değerindedir.
- İsteğe bağlı sabitleme hataları bozulur ve gönderilen mesajı sağlam bırakır.
- Zorunlu sabitleme hataları teslimatı başarısız kılar.
- Parçalanmış mesajlar kuyruk parçasını değil, teslim edilen ilk parçayı sabitler.

Sağlayıcının bu işlemleri desteklediği mevcut
mesajlar için elle `pin`, `unpin` ve `pins` mesaj eylemleri hâlâ vardır.

## Plugin Yazarı Kontrol Listesi

- Kanal, anlamsal sunumu işleyebiliyorsa veya güvenle bozabiliyorsa, `describeMessageTool(...)` içinden `presentation` bildirin.
- Çalışma zamanı giden bağdaştırıcısına `presentationCapabilities` ekleyin.
- `renderPresentation` uygulamasını denetim düzlemi plugin
  kurulum kodunda değil, çalışma zamanı kodunda yapın.
- Yerel UI kütüphanelerini sıcak kurulum/katalog yollarından uzak tutun.
- Platform sınırlarını işleyicide ve testlerde koruyun.
- Desteklenmeyen düğmeler, seçimler, URL düğmeleri, başlık/metin
  yinelenmesi ve karışık `message` artı `presentation` gönderimleri için geri dönüş testleri ekleyin.
- Yalnızca sağlayıcı gönderilen mesaj kimliğini sabitleyebildiğinde, `deliveryCapabilities.pin` ve
  `pinDeliveredMessage` üzerinden teslimat sabitleme desteği ekleyin.
- Paylaşılan mesaj eylemi şeması üzerinden yeni sağlayıcıya özgü kart/blok/bileşen/düğme alanları açığa çıkarmayın.

## İlgili Belgeler

- [Message CLI](/cli/message)
- [Plugin SDK Overview](/tr/plugins/sdk-overview)
- [Plugin Architecture](/tr/plugins/architecture#message-tool-schemas)
- [Channel Presentation Refactor Plan](/tr/plan/ui-channels)
