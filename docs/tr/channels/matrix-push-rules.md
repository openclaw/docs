---
read_when:
    - Kendi barındırdığınız Synapse veya Tuwunel için Matrix sessiz akışını ayarlama
    - Kullanıcılar her önizleme düzenlemesinde değil, yalnızca tamamlanan bloklarda bildirim almak ister
summary: Alıcı başına Matrix push kuralları için sessiz, kesinleştirilmiş önizleme düzenlemeleri
title: Sessiz önizlemeler için Matrix anlık bildirim kuralları
x-i18n:
    generated_at: "2026-04-30T09:07:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

`channels.matrix.streaming` `"quiet"` olduğunda, OpenClaw tek bir önizleme olayını yerinde düzenler ve sonlandırılmış düzenlemeyi özel bir içerik bayrağıyla işaretler. Matrix istemcileri, son düzenleme için yalnızca kullanıcı başına bir push kuralı bu bayrakla eşleşirse bildirim gösterir. Bu sayfa, Matrix'i kendi barındıran ve bu kuralı her alıcı hesabı için yüklemek isteyen operatörler içindir.

Yalnızca standart Matrix bildirim davranışını istiyorsanız `streaming: "partial"` kullanın veya streaming'i kapalı bırakın. Bkz. [Matrix kanal kurulumu](/tr/channels/matrix#streaming-previews).

## Önkoşullar

- alıcı kullanıcı = bildirimi alması gereken kişi
- bot kullanıcısı = yanıtı gönderen OpenClaw Matrix hesabı
- aşağıdaki API çağrıları için alıcı kullanıcının erişim token'ını kullanın
- push kuralındaki `sender` değerini bot kullanıcısının tam MXID'siyle eşleştirin
- alıcı hesabında çalışan pusher'lar zaten bulunmalıdır — sessiz önizleme kuralları yalnızca normal Matrix push teslimatı sağlıklı olduğunda çalışır

## Adımlar

<Steps>
  <Step title="Sessiz önizlemeleri yapılandırın">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Alıcının erişim token'ını alın">
    Mümkünse mevcut bir istemci oturumu token'ını yeniden kullanın. Yeni bir tane oluşturmak için:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Pusher'ların var olduğunu doğrulayın">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Hiç pusher dönmezse, devam etmeden önce bu hesap için normal Matrix push teslimatını düzeltin.

  </Step>

  <Step title="Override push kuralını yükleyin">
    OpenClaw, sonlandırılmış yalnızca metin önizleme düzenlemelerini `content["com.openclaw.finalized_preview"] = true` ile işaretler. Bu işaretleyiciyle birlikte gönderen olarak bot MXID'siyle eşleşen bir kural yükleyin:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Çalıştırmadan önce değiştirin:

    - `https://matrix.example.org`: homeserver temel URL'niz
    - `$USER_ACCESS_TOKEN`: alıcı kullanıcının erişim token'ı
    - `openclaw-finalized-preview-botname`: bot başına ve alıcı başına benzersiz bir kural kimliği (kalıp: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: alıcının değil, OpenClaw botunuzun MXID'si

  </Step>

  <Step title="Doğrulayın">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Ardından streamed bir yanıtı test edin. Sessiz modda oda sessiz bir taslak önizleme gösterir ve blok ya da tur tamamlandığında bir kez bildirim gönderir.

  </Step>
</Steps>

Kuralı daha sonra kaldırmak için aynı kural URL'sine alıcının token'ıyla `DELETE` gönderin.

## Çoklu bot notları

Push kuralları `ruleId` ile anahtarlanır: aynı kimliğe yeniden `PUT` çalıştırmak tek bir kuralı günceller. Aynı alıcıya bildirim gönderen birden fazla OpenClaw botu için, her bot adına ayrı bir gönderen eşleşmesiyle bir kural oluşturun.

Yeni kullanıcı tanımlı `override` kuralları varsayılan bastırma kurallarının önüne eklenir, bu yüzden ek bir sıralama parametresine gerek yoktur. Kural yalnızca yerinde sonlandırılabilen yalnızca metin önizleme düzenlemelerini etkiler; medya geri dönüşleri ve bayat önizleme geri dönüşleri normal Matrix teslimatını kullanır.

## Homeserver notları

<AccordionGroup>
  <Accordion title="Synapse">
    Özel bir `homeserver.yaml` değişikliği gerekmez. Normal Matrix bildirimleri bu kullanıcıya zaten ulaşıyorsa, yukarıdaki alıcı token'ı + `pushrules` çağrısı ana kurulum adımıdır.

    Synapse'i bir ters proxy veya worker'ların arkasında çalıştırıyorsanız, `/_matrix/client/.../pushrules/` yolunun Synapse'e doğru şekilde ulaştığından emin olun. Push teslimatı ana işlem veya `synapse.app.pusher` / yapılandırılmış pusher worker'ları tarafından işlenir — bunların sağlıklı olduğundan emin olun.

    Kural, 2023'te Synapse'e eklenen `event_property_is` push kuralı koşulunu (MSC3758, push kuralı v1.10) kullanır. Daha eski Synapse sürümleri `PUT pushrules/...` çağrısını kabul eder ancak koşulla sessizce hiç eşleşmez — sonlandırılmış bir önizleme düzenlemesinde bildirim gelmezse Synapse'i yükseltin.

  </Accordion>

  <Accordion title="Tuwunel">
    Akış Synapse ile aynıdır; sonlandırılmış önizleme işaretleyicisi için Tuwunel'e özgü yapılandırma gerekmez.

    Kullanıcı başka bir cihazda aktifken bildirimler kayboluyorsa, `suppress_push_when_active` seçeneğinin etkin olup olmadığını kontrol edin. Tuwunel bu seçeneği 1.4.2 sürümünde (Eylül 2025) ekledi ve bir cihaz aktifken diğer cihazlara gönderilen push'ları kasıtlı olarak bastırabilir.

  </Accordion>
</AccordionGroup>

## İlgili

- [Matrix kanal kurulumu](/tr/channels/matrix)
- [Streaming kavramları](/tr/concepts/streaming)
