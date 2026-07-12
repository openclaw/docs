---
read_when:
    - Kendi barındırdığınız Synapse veya Tuwunel için Matrix sessiz akışını ayarlama
    - Kullanıcılar her önizleme düzenlemesinde değil, yalnızca bloklar tamamlandığında bildirim almak istiyor.
summary: Sessiz, tamamlanmış önizleme düzenlemeleri için alıcıya özel Matrix anlık bildirim kuralları
title: Sessiz önizlemeler için Matrix gönderim kuralları
x-i18n:
    generated_at: "2026-07-12T12:04:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

`channels.matrix.streaming` değeri `"quiet"` olduğunda OpenClaw, tek bir önizleme olayını yerinde düzenleyerek yanıtı akış halinde iletir. Önizlemeler, bildirim oluşturmayan `m.notice` olayları olarak gönderilir ve sonlandırılmış düzenleme `content["com.openclaw.finalized_preview"] = true` ile işaretlenir. Matrix istemcileri, yalnızca kullanıcıya özel bir anlık bildirim kuralı işaretleyiciyle eşleşirse bu son düzenleme için bildirim gönderir. Bu sayfa, Matrix'i kendi altyapısında barındıran ve bu kuralı her alıcı hesabı için yüklemek isteyen operatörlere yöneliktir.

`streaming: "progress"` taslaklarını aynı yol üzerinden sonlandırdığından, aynı kural ilerleme modunda sonlandırılan düzenlemeler için de tetiklenir.

Yalnızca standart Matrix bildirim davranışını istiyorsanız `streaming: "partial"` kullanın veya akışı kapalı bırakın. Bkz. [Matrix kanal kurulumu](/tr/channels/matrix#streaming-previews).

## Ön koşullar

- alıcı kullanıcı = bildirimi alması gereken kişi
- bot kullanıcısı = yanıtı gönderen OpenClaw Matrix hesabı
- aşağıdaki API çağrıları için alıcı kullanıcının erişim belirtecini kullanın
- anlık bildirim kuralındaki `sender` alanını bot kullanıcısının tam MXID'siyle eşleştirin
- alıcı hesabında çalışan anlık bildirim göndericileri zaten bulunmalıdır; sessiz önizleme kuralları yalnızca normal Matrix anlık bildirim teslimatı sağlıklı çalıştığında işler

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

  <Step title="Alıcının erişim belirtecini alın">
    Mümkünse mevcut bir istemci oturumu belirtecini yeniden kullanın. Yeni bir belirteç oluşturmak için:

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

  <Step title="Anlık bildirim göndericilerinin bulunduğunu doğrulayın">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Hiçbir anlık bildirim göndericisi döndürülmezse devam etmeden önce bu hesap için normal Matrix anlık bildirim teslimatını düzeltin.

  </Step>

  <Step title="Geçersiz kılma anlık bildirim kuralını yükleyin">
    Sonlandırılmış önizleme işaretleyicisiyle ve gönderici olarak bot MXID'siyle eşleşen bir kural yükleyin:

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

    - `https://matrix.example.org`: ana sunucunuzun temel URL'si
    - `$USER_ACCESS_TOKEN`: alıcı kullanıcının erişim belirteci
    - `openclaw-finalized-preview-botname`: alıcı ve bot birleşimi başına benzersiz bir kural kimliği (kalıp: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: alıcının değil, OpenClaw botunuzun MXID'si

  </Step>

  <Step title="Doğrulayın">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Ardından akış halinde iletilen bir yanıtı test edin. Sessiz modda oda, sessiz bir taslak önizlemesi gösterir ve blok veya tur tamamlandığında bir kez bildirim gönderir.

  </Step>
</Steps>

Kuralı daha sonra kaldırmak için aynı kural URL'sine alıcının belirteciyle `DELETE` isteği gönderin.

## Birden çok botla ilgili notlar

Anlık bildirim kuralları `ruleId` ile anahtarlanır: aynı kimliğe yeniden `PUT` isteği göndermek tek bir kuralı günceller. Aynı alıcıya bildirim gönderen birden fazla OpenClaw botu için her bot adına farklı bir gönderici eşleşmesine sahip ayrı bir kural oluşturun.

Kullanıcı tarafından tanımlanan yeni `override` kuralları, sunucunun varsayılan engelleme kurallarının önüne eklendiğinden ek bir sıralama parametresi gerekmez. Kural yalnızca yerinde sonlandırılabilen salt metin önizleme düzenlemelerini etkiler; medya yanıtları, eski önizleme geri dönüşleri ve Matrix bahsetmelerini etkinleştirecek son metinler bunun yerine normal bildirim oluşturan mesajlar olarak teslim edilir.

## Ana sunucu notları

<AccordionGroup>
  <Accordion title="Synapse">
    Özel bir `homeserver.yaml` değişikliği gerekmez. Normal Matrix bildirimleri bu kullanıcıya zaten ulaşıyorsa alıcı belirteci ve yukarıdaki `pushrules` çağrısı temel kurulum adımıdır.

    Synapse'i ters vekil veya işçi süreçlerinin arkasında çalıştırıyorsanız `/_matrix/client/.../pushrules/` yolunun Synapse'e doğru şekilde ulaştığından emin olun. Anlık bildirim teslimatı ana süreç ya da `synapse.app.pusher` / yapılandırılmış anlık bildirim gönderici işçileri tarafından gerçekleştirilir; bunların sağlıklı çalıştığından emin olun.

    Kural, 2023'te Synapse'e eklenen `event_property_is` anlık bildirim kuralı koşulunu (MSC3758, anlık bildirim kuralı v1.10) kullanır. Eski Synapse sürümleri `PUT pushrules/...` çağrısını kabul eder ancak koşulu sessizce hiçbir zaman eşleştirmez; sonlandırılmış bir önizleme düzenlemesinde bildirim gelmezse Synapse'i yükseltin.

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse ile aynı akış geçerlidir; sonlandırılmış önizleme işaretleyicisi için Tuwunel'e özgü bir yapılandırma gerekmez.

    Kullanıcı başka bir cihazda etkinken bildirimler kayboluyorsa `suppress_push_when_active` seçeneğinin etkin olup olmadığını kontrol edin. Tuwunel bu seçeneği 1.4.2 sürümünde (Eylül 2025) ekledi ve bir cihaz etkinken diğer cihazlara gönderilen anlık bildirimleri bilinçli olarak engelleyebilir.

  </Accordion>
</AccordionGroup>

## İlgili

- [Matrix kanal kurulumu](/tr/channels/matrix)
- [Akış kavramları](/tr/concepts/streaming)
