---
read_when:
    - OpenClaw'u Twilio aracılığıyla SMS'e bağlamak istiyorsunuz
    - SMS webhook veya izin verilenler listesi yapılandırmasına ihtiyacınız var
summary: Twilio SMS kanalı kurulumu, erişim denetimleri ve Webhook yapılandırması
title: SMS
x-i18n:
    generated_at: "2026-07-12T12:05:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw, bir Twilio telefon numarası veya Messaging Service üzerinden SMS alır ve gönderir. Gateway, gelen iletiler için bir Webhook rotası (varsayılan `/webhooks/sms`) kaydeder, varsayılan olarak Twilio istek imzalarını doğrular ve yanıtları Twilio'nun Messages API'si üzerinden geri gönderir.

Durum: ayrı olarak yüklenen resmî Plugin. Yalnızca metin: MMS/medya yoktur, yalnızca doğrudan mesajlar desteklenir.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    SMS için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Gateway güvenliği" icon="shield" href="/tr/gateway/security">
    Webhook erişimini ve gönderen erişim denetimlerini gözden geçirin.
  </Card>
  <Card title="Kanal sorunlarını giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım kılavuzları.
  </Card>
</CardGroup>

## Başlamadan önce

Şunlara ihtiyacınız vardır:

- `openclaw plugins install @openclaw/sms` ile yüklenmiş resmî SMS Plugin'i.
- SMS özellikli bir telefon numarasına veya Twilio Messaging Service'e sahip bir Twilio hesabı.
- Twilio Account SID ve Auth Token.
- OpenClaw Gateway'inize ulaşan, genel erişime açık bir HTTPS URL'si.
- Bir gönderen ilkesi seçimi: özel kullanım için `pairing` (varsayılan), önceden onaylanmış telefon numaraları için `allowlist` veya yalnızca kasıtlı olarak herkese açık SMS erişimi için `open`.

Tek bir Twilio numarası, her iki özelliğe de sahipse hem SMS hem de [Sesli Arama](/tr/plugins/voice-call) için kullanılabilir. SMS Webhook'u ve Ses Webhook'u Twilio'da ayrı ayrı yapılandırılır ve farklı Gateway yolları kullanır; bu sayfa yalnızca SMS Webhook'unu kapsar.

## Hızlı Kurulum

<Steps>
  <Step title="Plugin'i yükleyin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Bir Twilio göndereni oluşturun veya seçin">
    Twilio'da **Phone Numbers > Manage > Active numbers** yolunu açın ve SMS özellikli bir numara seçin. Şunları kaydedin:

    - Account SID, örneğin `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Gönderen telefon numarası, örneğin `+15551234567`

    Sabit bir gönderen numarası yerine Messaging Service kullanıyorsanız Messaging Service SID'yi kaydedin; örneğin `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="SMS kanalını yapılandırın">

Bunu `sms.patch.json5` olarak kaydedin ve yer tutucuları değiştirin:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Uygulayın:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Twilio'yu Gateway Webhook'una yönlendirin">
    Twilio telefon numarası ayarlarında **Messaging** bölümünü açın ve **A message comes in** değerini şuna ayarlayın:

```text
https://gateway.example.com/webhooks/sms
```

    HTTP `POST` kullanın. Varsayılan yerel yol `/webhooks/sms` değeridir; farklı bir rotaya ihtiyacınız varsa `channels.sms.webhookPath` değerini değiştirin.

  </Step>

  <Step title="Tam SMS Webhook yolunu erişime açın">
    Genel URL'niz, SMS yolunu Gateway işlemine (varsayılan port `18789`) yönlendirmelidir. Yerel test için Tailscale Funnel kullanıyorsanız `/webhooks/sms` yolunu açıkça erişime açın:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Sesli Arama ve SMS ayrı Webhook yolları kullanır. Aynı Twilio numarası her ikisini de işliyorsa her iki rotayı da Twilio'da ve tünelinizde yapılandırılmış durumda tutun.

  </Step>

  <Step title="Gateway'i başlatın ve ilk göndereni onaylayın">

```bash
openclaw gateway
```

Twilio numarasına bir kısa mesaj gönderin. İlk mesaj bir eşleştirme isteği oluşturur. İsteği onaylayın:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Eşleştirme kodlarının süresi 1 saat sonra dolar.

  </Step>
</Steps>

## Yapılandırma Örnekleri

Tüm anahtarlar `channels.sms` altında (ve hesap başına `channels.sms.accounts.<id>` altında) bulunur:

| Anahtar                                 | Varsayılan      | Amaç                                                                            |
| --------------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| `enabled`                               | `true`          | Kanalı/hesabı etkinleştirir veya devre dışı bırakır.                            |
| `accountSid`                            | —               | Twilio Account SID (`AC...`).                                                   |
| `authToken`                             | —               | Twilio Auth Token; düz metin dizesi veya SecretRef.                             |
| `fromNumber`                            | —               | E.164 biçimindeki gönderen numarası.                                            |
| `messagingServiceSid`                   | —               | Bir `fromNumber` çözümlenmediğinde kullanılan Messaging Service SID (`MG...`).  |
| `defaultTo`                             | —               | Gönderim akışında açık bir hedef belirtilmediğinde kullanılacak varsayılan hedef. |
| `webhookPath`                           | `/webhooks/sms` | Gelen Twilio Webhook'ları için Gateway HTTP yolu.                               |
| `publicWebhookUrl`                      | —               | Twilio'da yapılandırılan genel URL; imza doğrulaması için gereklidir.            |
| `dangerouslyDisableSignatureValidation` | `false`         | `X-Twilio-Signature` denetimlerini atlar; yalnızca yerel tünel testleri içindir. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` veya `disabled`.                                 |
| `allowFrom`                             | `[]`            | E.164 biçiminde izin verilen gönderen numaraları veya `dmPolicy: "open"` ile `"*"`. |
| `textChunkLimit`                        | `1500`          | Giden her SMS parçasındaki azami karakter sayısı.                               |
| `accounts`, `defaultAccount`            | —               | Çoklu hesap eşlemesi ve varsayılan hesap kimliği.                               |

### Yapılandırma dosyası

Kanal tanımının Gateway yapılandırmasıyla birlikte taşınmasını istediğinizde yapılandırma dosyasıyla kurulumu kullanın:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### Ortam değişkenleri

Ortam değişkenleri yalnızca varsayılan hesaba uygulanır; yapılandırma değerleri ortam değişkeni değerlerinden önceliklidir.

| Değişken                                        | Eşlendiği alan                                      |
| ----------------------------------------------- | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                        |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                         |
| `TWILIO_PHONE_NUMBER` (`TWILIO_SMS_FROM` diğer adı) | `fromNumber`                                    |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                               |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                       |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (virgülle ayrılmış)                     |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                    |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`)  |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Ardından yapılandırmada kanalı etkinleştirin:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### SecretRef kimlik doğrulama belirteci

`authToken` bir SecretRef (`source: "env" | "file" | "exec"`) olabilir. Gateway'in Twilio Auth Token'ı düz metin yapılandırmasında saklamak yerine OpenClaw gizli bilgiler çalışma zamanından çözümlemesi gerektiğinde bunu kullanın:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Başvurulan ortam değişkeni veya gizli bilgi sağlayıcısı Gateway çalışma zamanı tarafından görülebilmelidir. Ana makine ortam değişkenlerini değiştirdikten sonra yönetilen Gateway işlemlerini yeniden başlatın.

### Messaging Service göndereni

Twilio'nun göndereni Messaging Service üzerinden seçmesi gerektiğinde `fromNumber` yerine `messagingServiceSid` kullanın:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Yapılandırma ve ortam değişkenleri çözümlendikten sonra hem `fromNumber` hem de `messagingServiceSid` mevcutsa `fromNumber` kullanılır.

### Varsayılan giden hedef

Bir gönderim akışında açık bir hedef belirtilmediğinde otomasyon veya ajan tarafından başlatılan teslimatın varsayılan bir hedefi olması gerekiyorsa `defaultTo` değerini ayarlayın:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## Erişim denetimi

`channels.sms.dmPolicy`, doğrudan SMS erişimini denetler:

- `pairing` (varsayılan): bilinmeyen gönderenler bir eşleştirme kodu alır; `openclaw pairing approve sms <CODE>` ile onaylayın.
- `allowlist`: yalnızca `allowFrom` içindeki gönderenler işlenir. Boş bir `allowFrom`, tüm gönderenleri reddeder (Gateway başlangıçta bir uyarı kaydeder).
- `open`: yapılandırma doğrulaması, `allowFrom` değerinin `"*"` içermesini gerektirir. Joker karakter olmadan yalnızca listelenen numaralar sohbet edebilir.
- `disabled`: gelen tüm DM'ler bırakılır.

`allowFrom` girdileri `+15551234567` gibi E.164 telefon numaraları olmalıdır. `sms:` ve `twilio-sms:` önekleri kabul edilir ve normalleştirilir. Özel bir asistan için açık telefon numaralarıyla `dmPolicy: "allowlist"` kullanımını tercih edin:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## SMS Gönderme

SMS kanalı seçiliyken hedefler, yalın E.164 numaralarını veya `sms:` önekini kabul eder:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Kanal seçimi örtük olduğunda `twilio-sms:` öneki, iMessage'ın kendi hedefleri için operatör üzerinden SMS teslimatını seçmek amacıyla kullandığı `sms:` hizmet önekini devralmadan bu kanalı seçer:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI açık bir `--target` gerektirir. `defaultTo`, hedefin kanal yapılandırmasından çözümlenebildiği otomasyon ve ajan tarafından başlatılan teslimat yolları içindir.

Gelen SMS konuşmalarına verilen ajan yanıtları, yapılandırılmış Twilio göndereni üzerinden otomatik olarak gönderene geri iletilir.

SMS çıktısı düz metindir. OpenClaw; Markdown biçimlendirmesini kaldırır, çitle çevrili kod bloklarını düzleştirir, bağlantıları `etiket (url)` biçiminde yeniden yazar ve uzun yanıtları Twilio üzerinden göndermeden önce en fazla `textChunkLimit` karakterlik parçalara böler (varsayılan 1500).

## Kurulumu Doğrulama

Gateway başladıktan sonra:

1. Gateway günlüğünün SMS Webhook rotasını gösterdiğini doğrulayın.
2. Twilio tarafında bir yoklama çalıştırın (yapılandırılmış Twilio Webhook URL'sini/yöntemini ve son gelen ileti hatalarını denetler):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Telefonunuzdan Twilio numarasına bir SMS gönderin.
4. `openclaw pairing list sms` komutunu çalıştırın.
5. Eşleştirme kodunu `openclaw pairing approve sms <CODE>` ile onaylayın.
6. Başka bir SMS gönderin ve aracının yanıt verdiğini doğrulayın.

Yalnızca giden ileti testi için şunu kullanın:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### macOS iMessage/SMS üzerinden uçtan uca test

Messages aracılığıyla operatör SMS'i gönderebilen bir Mac'te, telefonunuza dokunmadan gönderen tarafını yönetmek için `imsg` kullanabilirsiniz:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

İlk ileti bir eşleştirme isteği oluşturmalıdır. İkinci ileti, aracı yanıtını Twilio üzerinden almalıdır.

## Webhook güvenliği

OpenClaw varsayılan olarak `X-Twilio-Signature` değerini `publicWebhookUrl` ve `authToken` kullanarak doğrular. `publicWebhookUrl` değerinin uç nokta bölümünü; şema, ana makine, yol ve sorgu dizesi dâhil olmak üzere Twilio'da yapılandırılmış URL ile baytı baytına aynı tutun. OpenClaw, Twilio'nun gerektirdiği şekilde Twilio [bağlantı geçersiz kılma](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) parçalarını (`#...`) imza hesaplamasına dâhil etmez.

Webhook rotası, imza doğrulamasından bağımsız olarak şunları da zorunlu kılar:

- Yalnızca `POST`.
- Kaynak IP başına dakikada 30 istek hız sınırı (bunun üzerinde HTTP 429).
- Yükteki `AccountSid`, yapılandırılmış `accountSid` ile eşleşmelidir (aksi hâlde HTTP 403).
- Yeniden oynatılan `MessageSid` değerleri 10 dakika boyunca yinelenenlerden arındırılır.
- Her SMS hesabının yeniden oynatma önbelleği en fazla 10.000 etkin ileti SID'sini tutar. Tüm yuvalar etkin olduğunda, o hesaba yönelik yeni Webhook'lar en eski yuvanın süresi dolana kadar HTTP 429 ve bir `Retry-After` üstbilgisiyle güvenli biçimde reddedilir.
- 32 KB'ı aşan istek gövdeleri reddedilir.

Twilio varsayılan olarak HTTP 429'u yeniden denemez ve `Retry-After` desteğini belgelemez. `#rp=4xx` ve `#rp=all` bağlantı geçersiz kılmaları 4xx yeniden denemelerini etkinleştirir; ancak Twilio, tüm yeniden deneme işlemini 15 saniyeyle sınırlar. Bu nedenle yeniden denemeler, bir yeniden oynatma önbelleği yuvasının süresi dolmadan önce tamamlanabilir. Başarısız teslimatların başka bir işleyiciye ulaşması gerekiyorsa bir yedek URL yapılandırın; 429 yanıtını güvenilir geri basınç olarak değil, güvenli ret olarak değerlendirin.

Yalnızca yerel tünel testi için şunu ayarlayabilirsiniz:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Herkese açık bir Gateway üzerinde imza doğrulamasını devre dışı bırakmayın.

## Çok hesaplı yapılandırma

Birden fazla Twilio numarası işletiyorsanız `accounts` kullanın:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

Her hesap farklı bir `webhookPath` kullanmalıdır; Gateway, yolu başka bir hesaba ait olan bir Webhook rotasını kaydetmeyi reddeder. `TWILIO_*`/`SMS_*` ortam değişkeni geri dönüşleri yalnızca varsayılan hesaba uygulanır; bu hesabı değiştirmek için `defaultAccount` ayarlayın.

## Sorun giderme

### Twilio 403 döndürüyor veya OpenClaw Webhook'u reddediyor

`publicWebhookUrl` değerinin şema, ana makine, yol ve sorgu dizesi dâhil olmak üzere Twilio'da yapılandırılmış URL ile tam olarak eşleştiğini denetleyin. Twilio herkese açık URL dizesini imzaladığından, proxy yeniden yazımları ve alternatif ana makine adları imza doğrulamasını bozabilir.

`Invalid account` yanıtıyla birlikte alınan 403, gelen yükün `AccountSid` değerinin yapılandırılmış `accountSid` ile eşleşmediği anlamına gelir; Webhook'un numaranın sahibi olan hesaba işaret ettiğini denetleyin.

### Eşleştirme isteği görünmüyor

Twilio numarasının **Messaging** Webhook URL'sini ve yöntemini denetleyin. SMS Webhook URL'sine işaret etmeli ve `POST` kullanmalıdır. Ayrıca Gateway'e herkese açık internetten veya tüneliniz üzerinden erişilebildiğini doğrulayın.

Twilio ileti günlüğü `11200` hatasını gösteriyorsa Twilio gelen SMS'i kabul etmiş ancak Webhook'unuza ulaşamamıştır. Şunları denetleyin:

- Twilio **Messaging > A message comes in**, `publicWebhookUrl` değerine işaret eder.
- Yöntem `POST` olmalıdır.
- Tünel veya ters proxy tam `webhookPath` yolunu kullanıma sunar; Tailscale Funnel için `tailscale funnel status` komutunu çalıştırın ve `/webhooks/sms` yolunun listelendiğini doğrulayın.
- İmza doğrulamasının imzalanmış URL'yi yeniden oluşturabilmesi için `publicWebhookUrl`, Twilio'nun gönderdiği şema, ana makine, yol ve sorgu dizesinin aynısını kullanır.

`openclaw channels status --channel sms --probe`, hem eşleşmeyen Twilio Webhook ayarlarını hem de son `11200` hatalarını gösterir.

### Giden gönderimler başarısız oluyor

`accountSid`, `authToken` ve `fromNumber` ya da `messagingServiceSid` değerlerinden birinin çözümlendiğini doğrulayın. Deneme Twilio hesabı kullanıyorsanız giden SMS'in gönderilebilmesi için hedef numaranın önce Twilio'da doğrulanması gerekebilir.

### İletiler geliyor ancak aracı yanıt vermiyor

`dmPolicy` ve `allowFrom` değerlerini denetleyin. Varsayılan `pairing` politikasıyla, normal aracı turları işlenmeden önce gönderenin onaylanması gerekir.
