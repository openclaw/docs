---
read_when:
    - Mesaj kartı, düğme veya seçim oluşturmayı ekleme ya da değiştirme
    - Zengin giden mesajları destekleyen bir kanal Plugin'i geliştirme
    - Mesaj aracı sunumunu veya teslim yeteneklerini değiştirme
    - Sağlayıcıya özgü kart/blok/bileşen oluşturma gerilemelerini hata ayıklama
summary: Kanal Plugin'leri için anlamsal mesaj kartları, düğmeler, seçimler, fallback metni ve teslim ipuçları
title: Mesaj sunumu
x-i18n:
    generated_at: "2026-04-24T09:22:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

Mesaj sunumu, zengin giden sohbet UI'ı için OpenClaw'ın paylaşılan sözleşmesidir.
Aracılara, CLI komutlarına, onay akışlarına ve Plugin'lere mesaj
amacını bir kez tanımlama imkânı verir; her kanal Plugin'i de yapabildiği en iyi yerel biçimi oluşturur.

Taşınabilir mesaj UI'ı için sunumu kullanın:

- metin bölümleri
- küçük bağlam/alt bilgi metni
- ayırıcılar
- düğmeler
- seçim menüleri
- kart başlığı ve ton

Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` veya Feishu `card` gibi yeni sağlayıcıya özgü alanları paylaşılan
mesaj aracına eklemeyin. Bunlar kanal Plugin'ine ait renderer çıktılarıdır.

## Sözleşme

Plugin yazarları genel sözleşmeyi şuradan içe aktarır:

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

- `value`, kanal tıklanabilir denetimleri desteklediğinde
  kanalın mevcut etkileşim yolu üzerinden geri yönlendirilen bir uygulama eylem değeridir.
- `url`, bağlantı düğmesidir. `value` olmadan var olabilir.
- `label` zorunludur ve metin fallback'inde de kullanılır.
- `style` yönlendiricidir. Renderer'lar desteklenmeyen stilleri gönderimi başarısız kılmak yerine
  güvenli varsayılanlara eşlemelidir.

Seçim semantiği:

- `options[].value`, seçilen uygulama değeridir.
- `placeholder` yönlendiricidir ve yerel seçim desteği olmayan kanallarda yok sayılabilir.
- Bir kanal seçimleri desteklemiyorsa fallback metin etiketleri listeler.

## Üretici örnekleri

Basit kart:

```json
{
  "title": "Dağıtım onayı",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary terfi ettirilmeye hazır." },
    { "type": "context", "text": "Build 1234, staging geçti." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Onayla", "value": "deploy:approve", "style": "success" },
        { "label": "Reddet", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Yalnızca URL içeren bağlantı düğmesi:

```json
{
  "blocks": [
    { "type": "text", "text": "Sürüm notları hazır." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Notları aç", "url": "https://example.com/release" }]
    }
  ]
}
```

Seçim menüsü:

```json
{
  "title": "Ortam seçin",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Ortam",
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
  --message "Dağıtım onayı" \
  --presentation '{"title":"Dağıtım onayı","tone":"warning","blocks":[{"type":"text","text":"Canary hazır."},{"type":"buttons","buttons":[{"label":"Onayla","value":"deploy:approve","style":"success"},{"label":"Reddet","value":"deploy:decline","style":"danger"}]}]}'
```

Sabitlenmiş teslim:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Konu açıldı" \
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

Kanal Plugin'leri, giden adaptörlerinde render desteğini bildirir:

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

Yetenek alanları kasıtlı olarak basit boolean değerlerdir. Bunlar, renderer'ın
etkileşimli hâle getirebildiklerini tanımlar; yerel platform sınırlarının tamamını değil. Renderer'lar yine de azami düğme sayısı, blok sayısı ve
kart boyutu gibi platforma özgü sınırların sahibidir.

## Çekirdek render akışı

Bir `ReplyPayload` veya mesaj eylemi `presentation` içerdiğinde çekirdek:

1. Sunum payload'unu normalize eder.
2. Hedef kanalın giden adaptörünü çözümler.
3. `presentationCapabilities` değerini okur.
4. Adaptör payload'u oluşturabiliyorsa `renderPresentation` çağırır.
5. Adaptör yoksa veya oluşturamıyorsa korumacı metne fallback yapar.
6. Ortaya çıkan payload'u normal kanal teslim yolu üzerinden gönderir.
7. İlk başarılı gönderilen
   mesajdan sonra `delivery.pin` gibi teslim meta verilerini uygular.

Çekirdek fallback davranışının sahibidir; böylece üreticiler kanal bağımsız kalabilir.
Kanal Plugin'leri ise yerel render ve etkileşim işlemenin sahibidir.

## Bozulma kuralları

Sunum, sınırlı kanallarda güvenle gönderilebilir olmalıdır.

Fallback metin şunları içerir:

- ilk satır olarak `title`
- normal paragraflar olarak `text` blokları
- sıkıştırılmış bağlam satırları olarak `context` blokları
- görsel ayırıcı olarak `divider` blokları
- bağlantı düğmeleri için URL'ler dahil düğme etiketleri
- seçim seçenek etiketi

Desteklenmeyen yerel denetimler tüm gönderimi başarısız kılmak yerine bozulmalıdır.
Örnekler:

- Inline düğmeleri devre dışı Telegram, metin fallback'i gönderir.
- Seçim desteği olmayan bir kanal, seçim seçeneklerini metin olarak listeler.
- Yalnızca URL içeren bir düğme ya yerel bağlantı düğmesine ya da fallback URL satırına dönüşür.
- İsteğe bağlı pin hataları teslim edilen mesajı başarısız kılmaz.

Ana istisna `delivery.pin.required: true` durumudur; sabitleme zorunlu
olarak istenmişse ve kanal gönderilen mesajı sabitleyemiyorsa teslim başarısız raporlanır.

## Sağlayıcı eşleme

Mevcut paketlenmiş renderer'lar:

| Kanal           | Yerel render hedefi                | Notlar                                                                                                                                            |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components ve component container'ları | Mevcut sağlayıcıya özgü payload üreticileri için eski `channelData.discord.components` korunur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır. |
| Slack           | Block Kit                          | Mevcut sağlayıcıya özgü payload üreticileri için eski `channelData.slack.blocks` korunur, ancak yeni paylaşılan gönderimler `presentation` kullanmalıdır. |
| Telegram        | Metin artı inline klavyeler        | Düğmeler/seçimler hedef yüzey için inline button yeteneği gerektirir; aksi hâlde metin fallback'i kullanılır.                                    |
| Mattermost      | Metin artı etkileşimli props       | Diğer bloklar metne bozulur.                                                                                                                      |
| Microsoft Teams | Adaptive Cards                     | Her ikisi de sağlandığında düz `message` metni kartla birlikte eklenir.                                                                           |
| Feishu          | Etkileşimli kartlar                | Kart başlığı `title` kullanabilir; gövde bu başlığı yinelemekten kaçınır.                                                                         |
| Düz kanallar    | Metin fallback'i                   | Renderer olmayan kanallar bile okunabilir çıktı alır.                                                                                             |

Sağlayıcıya özgü payload uyumluluğu, mevcut
yanıt üreticileri için geçiş kolaylığıdır. Yeni paylaşılan yerel alanlar eklemek için bir neden değildir.

## Presentation ve InteractiveReply

`InteractiveReply`, onay ve etkileşim
yardımcıları tarafından kullanılan daha eski iç alt kümedir. Şunları destekler:

- metin
- düğmeler
- seçimler

`MessagePresentation`, kanonik paylaşılan gönderim sözleşmesidir. Şunları ekler:

- başlık
- ton
- bağlam
- ayırıcı
- yalnızca URL içeren düğmeler
- `ReplyPayload.delivery` üzerinden genel teslim meta verileri

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

## Teslim Pin'i

Sabitleme, sunum değil teslim davranışıdır. `channelData.telegram.pin` gibi
sağlayıcıya özgü alanlar yerine `delivery.pin` kullanın.

Semantik:

- `pin: true`, ilk başarılı teslim edilen mesajı sabitler.
- `pin.notify` varsayılan olarak `false` olur.
- `pin.required` varsayılan olarak `false` olur.
- İsteğe bağlı pin hataları bozulur ve gönderilen mesajı sağlam bırakır.
- Zorunlu pin hataları teslimi başarısız kılar.
- Parçalanmış mesajlar kuyruk parçasını değil, ilk teslim edilen parçayı sabitler.

Mevcut mesajlar için sağlayıcının bu işlemleri desteklediği yerlerde
manuel `pin`, `unpin` ve `pins` mesaj eylemleri hâlâ vardır.

## Plugin yazarı kontrol listesi

- Kanal anlamsal sunumu render edebiliyorsa veya güvenle bozabiliyorsa
  `describeMessageTool(...)` içinden `presentation` bildirin.
- Çalışma zamanı giden adaptörüne `presentationCapabilities` ekleyin.
- `renderPresentation` uygulamasını çalışma zamanı kodunda yapın; denetim düzlemi Plugin
  kurulum kodunda değil.
- Yerel UI kütüphanelerini sıcak kurulum/katalog yollarının dışında tutun.
- Platform sınırlarını renderer ve testlerde koruyun.
- Desteklenmeyen düğmeler, seçimler, URL düğmeleri, başlık/metin
  yinelenmesi ve karışık `message` artı `presentation` gönderimleri için fallback testleri ekleyin.
- Sağlayıcı gönderilen mesaj kimliğini sabitleyebiliyorsa
  teslim pin desteğini `deliveryCapabilities.pin` ve
  `pinDeliveredMessage` üzerinden ekleyin.
- Paylaşılan mesaj eylemi şeması üzerinden yeni sağlayıcıya özgü kart/blok/bileşen/düğme alanları açığa çıkarmayın.

## İlgili belgeler

- [Message CLI](/tr/cli/message)
- [Plugin SDK Overview](/tr/plugins/sdk-overview)
- [Plugin Architecture](/tr/plugins/architecture-internals#message-tool-schemas)
- [Channel Presentation Refactor Plan](/tr/plan/ui-channels)
