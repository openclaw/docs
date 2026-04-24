---
read_when:
    - Self-hosted Synapse veya Tuwunel için sessiz Matrix akışını ayarlama
    - Kullanıcılar her önizleme düzenlemesinde değil, yalnızca tamamlanmış bloklarda bildirim almak istiyor
summary: Sessiz sonlandırılmış önizleme düzenlemeleri için alıcı başına Matrix push kuralları
title: Sessiz önizlemeler için Matrix push kuralları
x-i18n:
    generated_at: "2026-04-24T08:58:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

`channels.matrix.streaming` değeri `"quiet"` olduğunda, OpenClaw tek bir önizleme olayını yerinde düzenler ve sonlandırılmış düzenlemeyi özel bir içerik bayrağıyla işaretler. Matrix istemcileri, yalnızca kullanıcı başına bir push kuralı bu bayrakla eşleşirse son düzenlemede bildirim gönderir. Bu sayfa, Matrix'i self-host eden ve bu kuralı her alıcı hesabı için kurmak isteyen operatörler içindir.

Yalnızca standart Matrix bildirim davranışını istiyorsanız, `streaming: "partial"` kullanın veya akışı kapalı bırakın. Bkz. [Matrix channel setup](/tr/channels/matrix#streaming-previews).

## Önkoşullar

- alıcı kullanıcı = bildirimi alması gereken kişi
- bot kullanıcısı = yanıtı gönderen OpenClaw Matrix hesabı
- aşağıdaki API çağrıları için alıcı kullanıcının erişim token'ını kullanın
- push kuralındaki `sender` alanını bot kullanıcısının tam MXID'siyle eşleştirin
- alıcı hesabında çalışan pusher'lar zaten mevcut olmalıdır — sessiz önizleme kuralları yalnızca normal Matrix push teslimi sağlıklı olduğunda çalışır

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
    Mümkünse mevcut bir istemci oturum token'ını yeniden kullanın. Yeni bir tane oluşturmak için:

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

Pusher dönmüyorsa, devam etmeden önce bu hesap için normal Matrix push teslimini düzeltin.

  </Step>

  <Step title="Override push kuralını kurun">
    OpenClaw, sonlandırılmış yalnızca metin önizleme düzenlemelerini `content["com.openclaw.finalized_preview"] = true` ile işaretler. Bu işaretleyiciyle ve gönderen olarak bot MXID'siyle eşleşen bir kural kurun:

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

    Çalıştırmadan önce şunları değiştirin:

    - `https://matrix.example.org`: homeserver temel URL'niz
    - `$USER_ACCESS_TOKEN`: alıcı kullanıcının erişim token'ı
    - `openclaw-finalized-preview-botname`: alıcı başına bot başına benzersiz bir kural kimliği (desen: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: alıcının değil, OpenClaw bot MXID'niz

  </Step>

  <Step title="Doğrulayın">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Ardından akışlı bir yanıtı test edin. Sessiz modda oda sessiz bir taslak önizleme gösterir ve blok veya tur tamamlandığında bir kez bildirim gönderir.

  </Step>
</Steps>

Kuralı daha sonra kaldırmak için aynı kural URL'sine alıcının token'ıyla `DELETE` gönderin.

## Çoklu bot notları

Push kuralları `ruleId` ile anahtarlanır: aynı kimliğe karşı `PUT` işlemini yeniden çalıştırmak tek bir kuralı günceller. Aynı alıcıya bildirim gönderen birden fazla OpenClaw botu için, her bot için farklı bir gönderen eşleşmesiyle ayrı bir kural oluşturun.

Yeni kullanıcı tanımlı `override` kuralları, varsayılan bastırma kurallarının önüne eklenir; bu nedenle ek bir sıralama parametresi gerekmez. Kural yalnızca yerinde sonlandırılabilen yalnızca metin önizleme düzenlemelerini etkiler; medya fallback'leri ve eski önizleme fallback'leri normal Matrix teslimini kullanır.

## Homeserver notları

<AccordionGroup>
  <Accordion title="Synapse">
    Özel bir `homeserver.yaml` değişikliği gerekmez. Normal Matrix bildirimleri zaten bu kullanıcıya ulaşıyorsa, alıcı token'ı + yukarıdaki `pushrules` çağrısı ana kurulum adımıdır.

    Synapse'i bir reverse proxy veya worker'ların arkasında çalıştırıyorsanız, `/_matrix/client/.../pushrules/` yolunun Synapse'e doğru ulaştığından emin olun. Push teslimi ana süreç veya `synapse.app.pusher` / yapılandırılmış pusher worker'ları tarafından işlenir — bunların sağlıklı olduğundan emin olun.

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse ile aynı akış; sonlandırılmış önizleme işaretleyicisi için Tuwunel'e özgü bir yapılandırma gerekmez.

    Kullanıcı başka bir cihazda etkinken bildirimler kayboluyorsa, `suppress_push_when_active` etkin olup olmadığını kontrol edin. Tuwunel bu seçeneği 1.4.2 sürümünde (Eylül 2025) ekledi ve bir cihaz etkinken diğer cihazlara push'ları bilinçli olarak bastırabilir.

  </Accordion>
</AccordionGroup>

## İlgili

- [Matrix channel setup](/tr/channels/matrix)
- [Streaming concepts](/tr/concepts/streaming)
