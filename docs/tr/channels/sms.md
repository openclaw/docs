---
read_when:
    - OpenClaw'u Twilio üzerinden SMS'e bağlamak istiyorsunuz
    - SMS Webhook veya izin listesi kurulumu gerekir
summary: Twilio SMS kanal kurulumu, erişim denetimleri ve webhook yapılandırması
title: SMS
x-i18n:
    generated_at: "2026-06-28T00:15:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw, bir Twilio telefon numarası veya Messaging Service üzerinden SMS alıp gönderebilir. Gateway, gelen Webhook rotasını kaydeder, varsayılan olarak Twilio istek imzalarını doğrular ve yanıtları Twilio'nun Messages API'si üzerinden geri gönderir.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    SMS için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Gateway security" icon="shield" href="/tr/gateway/security">
    Webhook erişimini ve gönderici erişim kontrollerini gözden geçirin.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kitapları.
  </Card>
</CardGroup>

## Başlamadan önce

Şunlara ihtiyacınız var:

- Resmi SMS Plugin'i `openclaw plugins install @openclaw/sms` ile yüklenmiş olmalıdır.
- SMS özellikli telefon numarasına sahip bir Twilio hesabı veya Twilio Messaging Service.
- Twilio Account SID ve Auth Token.
- OpenClaw Gateway'inize ulaşan herkese açık bir HTTPS URL'si.
- Bir gönderici ilkesi seçimi: özel kullanım için `pairing`, önceden onaylanmış telefon numaraları için `allowlist` veya yalnızca kasıtlı olarak herkese açık SMS erişimi için `open`.

Numara her iki yeteneğe de sahipse SMS ve Voice Call için aynı Twilio numarasını kullanın. SMS Webhook'unu ve Voice Webhook'unu Twilio'da ayrı ayrı yapılandırın; bu sayfa yalnızca SMS Webhook'unu kapsar.

## Hızlı Kurulum

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Create or choose a Twilio sender">
    Twilio'da **Phone Numbers > Manage > Active numbers** bölümünü açın ve SMS özellikli bir numara seçin. Şunları kaydedin:

    - Account SID, örneğin `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Gönderici telefon numarası, örneğin `+15551234567`

    Sabit bir gönderici numarası yerine Messaging Service kullanıyorsanız Messaging Service SID'yi kaydedin, örneğin `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configure the SMS channel">

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

  <Step title="Point Twilio at the Gateway webhook">
    Twilio telefon numarası ayarlarında **Messaging** bölümünü açın ve **A message comes in** değerini şuna ayarlayın:

```text
https://gateway.example.com/webhooks/sms
```

    HTTP `POST` kullanın. Varsayılan yerel yol `/webhooks/sms` olur; farklı bir rotaya ihtiyacınız varsa `channels.sms.webhookPath` değerini değiştirin.

  </Step>

  <Step title="Expose the exact SMS webhook path">
    Herkese açık URL'niz SMS yolunu Gateway sürecine yönlendirmelidir. Yerel test için Tailscale Funnel kullanıyorsanız `/webhooks/sms` yolunu açıkça dışa açın:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call ve SMS ayrı Webhook yolları kullanır. Aynı Twilio numarası her ikisini de işliyorsa her iki rotayı da Twilio'da ve tünelinizde yapılandırılmış tutun.

  </Step>

  <Step title="Start the Gateway and approve first sender">

```bash
openclaw gateway
```

Twilio numarasına bir kısa mesaj gönderin. İlk mesaj bir eşleştirme isteği oluşturur. Onaylayın:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Eşleştirme kodlarının süresi 1 saat sonra dolar.

  </Step>
</Steps>

## Yapılandırma Örnekleri

### Yapılandırma dosyası

Kanal tanımının Gateway yapılandırmasıyla birlikte taşınmasını istediğinizde yapılandırma dosyası kurulumunu kullanın:

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

Gizli değerlerin ana makine ortamından geldiği tek hesaplı dağıtımlar için ortam kurulumunu kullanın:

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Ardından kanalı yapılandırmada etkinleştirin:

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

`TWILIO_SMS_FROM`, `TWILIO_PHONE_NUMBER` için bir diğer ad olarak kabul edilir. Twilio'nun göndericiyi Messaging Service'ten seçmesi gerektiğinde telefon numarası göndericisi yerine `TWILIO_MESSAGING_SERVICE_SID` kullanın.

### SecretRef kimlik doğrulama belirteci

`authToken` bir SecretRef olabilir. Gateway'in Twilio Auth Token'ı düz metin yapılandırma olarak depolamak yerine OpenClaw gizli değerler çalışma zamanından çözmesi gerektiğinde bunu kullanın:

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

Başvurulan ortam değişkeni veya gizli değer sağlayıcısı Gateway çalışma zamanı tarafından görülebilir olmalıdır. Ana makine ortam değişkenlerini değiştirdikten sonra yönetilen Gateway süreçlerini yeniden başlatın.

### Yalnızca izin listesine açık özel numara

Yalnızca bilinen telefon numaralarının ajanla konuşabilmesi gerektiğinde `allowlist` kullanın:

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

### Messaging Service göndericisi

Twilio'nun göndericiyi Messaging Service üzerinden seçmesi gerektiğinde `fromNumber` yerine `messagingServiceSid` kullanın:

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

Yapılandırma ve ortam çözümlemesinden sonra hem `fromNumber` hem de `messagingServiceSid` varsa `fromNumber` kullanılır.

### Varsayılan giden hedef

Otomasyon veya ajan tarafından başlatılan teslimat, gönderim akışı açık bir hedefi atladığında varsayılan bir hedefe sahip olmalıysa `defaultTo` ayarlayın:

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

## Erişim kontrolü

`channels.sms.dmPolicy` doğrudan SMS erişimini kontrol eder:

- `pairing` (varsayılan)
- `allowlist` (`allowFrom` içinde en az bir gönderici gerektirir)
- `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
- `disabled`

`allowFrom` girdileri `+15551234567` gibi E.164 telefon numaraları olmalıdır. `sms:` önekleri kabul edilir ve normalleştirilir. Özel bir asistan için açık telefon numaralarıyla birlikte `dmPolicy: "allowlist"` tercih edin.

## SMS gönderme

Giden SMS hedefleri, SMS kanalı seçili olarak `sms:` hizmet önekini kullanır:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Kanal seçimi örtük olduğunda `twilio-sms:+15551234567`, iMessage tarafından kullanılan mevcut kanal sahipli `sms:` hizmet önekini devralmadan bu kanalı seçer.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI açık bir `--target` gerektirir. `defaultTo`, hedefin kanal yapılandırmasından çözülebildiği otomasyon ve ajan tarafından başlatılan teslimat yolları içindir.

Gelen SMS konuşmalarından ajan yanıtları, yapılandırılmış Twilio göndericisi üzerinden otomatik olarak göndericiye geri gider.

SMS çıktısı düz metindir. OpenClaw markdown'ı kaldırır, çitli kod bloklarını düzleştirir, okunabilir bağlantıları korur ve uzun yanıtları Twilio üzerinden göndermeden önce parçalara böler.

## Kurulumu Doğrulama

Gateway başladıktan sonra:

1. Gateway günlüğünün SMS Webhook rotasını gösterdiğini doğrulayın.
2. Twilio tarafında bir yoklama çalıştırın:

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Telefonunuzdan Twilio numarasına bir SMS gönderin.
4. `openclaw pairing list sms` çalıştırın.
5. Eşleştirme kodunu `openclaw pairing approve sms <CODE>` ile onaylayın.
6. Başka bir SMS gönderin ve ajanın yanıtladığını doğrulayın.

Yalnızca giden test için şunu kullanın:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### macOS iMessage/SMS'ten uçtan uca test

Messages üzerinden operatör SMS'i gönderebilen bir Mac'te, telefonunuza dokunmadan gönderici tarafını çalıştırmak için `imsg` kullanabilirsiniz:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

İlk mesaj bir eşleştirme isteği oluşturmalıdır. İkinci mesaj ajan yanıtını Twilio üzerinden almalıdır.

## Webhook güvenliği

Varsayılan olarak OpenClaw, `publicWebhookUrl` ve `authToken` kullanarak `X-Twilio-Signature` doğrular. `publicWebhookUrl` değerini şema, ana makine, yol ve sorgu dizesi dahil olmak üzere Twilio'da yapılandırılan URL ile bayt bayt aynı tutun.

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

Herkese açık bir Gateway'de devre dışı imza doğrulaması kullanmayın.

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

Her hesap ayrı bir `webhookPath` kullanmalıdır.

## Sorun giderme

### Twilio 403 döndürüyor veya OpenClaw Webhook'u reddediyor

`publicWebhookUrl` değerinin şema, ana makine, yol ve sorgu dizesi dahil olmak üzere Twilio'da yapılandırılan URL ile tam olarak eşleştiğini kontrol edin. Twilio herkese açık URL dizesini imzalar, bu nedenle proxy yeniden yazmaları ve alternatif ana makine adları imza doğrulamasını bozabilir.

### Eşleştirme isteği görünmüyor

Twilio numarasının **Messaging** Webhook URL'sini ve yöntemini kontrol edin. SMS Webhook URL'sini göstermeli ve `POST` kullanmalıdır. Ayrıca Gateway'in herkese açık internetten veya tüneliniz üzerinden erişilebilir olduğunu doğrulayın.

Twilio mesaj günlüğü `11200` hatasını gösteriyorsa Twilio gelen SMS'i kabul etmiş ancak Webhook'unuza ulaşamamıştır. Şunları kontrol edin:

- Twilio **Messaging > A message comes in** `publicWebhookUrl` değerini gösteriyor.
- Yöntem `POST`.
- Tünel veya ters proxy tam `webhookPath` yolunu dışa açıyor; Tailscale Funnel için `tailscale funnel status` çalıştırın ve `/webhooks/sms` öğesinin listelendiğini doğrulayın.
- `publicWebhookUrl`, Twilio'nun gönderdiği aynı şema, ana makine, yol ve sorgu dizesini kullanıyor; böylece imza doğrulaması imzalanmış URL'yi yeniden oluşturabilir.

### Giden gönderimler başarısız oluyor

`accountSid`, `authToken` ve `fromNumber` ya da `messagingServiceSid` değerlerinden birinin çözüldüğünü doğrulayın. Deneme Twilio hesabı kullanıyorsanız giden SMS gönderilebilmesi için hedef numaranın Twilio'da doğrulanması gerekebilir.

### Mesajlar geliyor ancak ajan yanıt vermiyor

`dmPolicy` ve `allowFrom` değerlerini kontrol edin. Varsayılan `pairing` ilkesiyle, normal agent turları işlenmeden önce gönderenin onaylanmış olması gerekir.
