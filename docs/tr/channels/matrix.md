---
read_when:
    - OpenClaw'da Matrix kurulumu
    - Matrix E2EE ve doğrulamanın yapılandırılması
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-04-22T04:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e78d85096ea84361951935a0daf34966c575d822f8581277eb384276c7c706a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix, OpenClaw için paketle birlikte gelen bir kanal plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, iş parçacıklarını, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Paketle gelen plugin

Matrix, güncel OpenClaw sürümlerinde paketle birlikte gelen bir plugin olarak sunulur; bu nedenle normal
paketlenmiş derlemelerde ayrıca kurulum gerekmez.

Daha eski bir derlemeyi veya Matrix'i içermeyen özel bir kurulumu kullanıyorsanız, onu
elle kurun:

npm'den kurun:

```bash
openclaw plugins install @openclaw/matrix
```

Yerel bir checkout'tan kurun:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin davranışı ve kurulum kuralları için [Plugins](/tr/tools/plugin) bölümüne bakın.

## Kurulum

1. Matrix plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten paketle birlikte içerir.
   - Daha eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Homeserver'ınızda bir Matrix hesabı oluşturun.
3. `channels.matrix` yapılandırmasını şu seçeneklerden biriyle ayarlayın:
   - `homeserver` + `accessToken`, veya
   - `homeserver` + `userId` + `password`.
4. Gateway'i yeniden başlatın.
5. Bot ile bir DM başlatın veya onu bir odaya davet edin.
   - Yeni Matrix davetleri yalnızca `channels.matrix.autoJoin` buna izin verdiğinde çalışır.

Etkileşimli kurulum yolları:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix sihirbazı şunları sorar:

- homeserver URL'si
- kimlik doğrulama yöntemi: erişim belirteci veya parola
- kullanıcı kimliği (yalnızca parola ile kimlik doğrulama)
- isteğe bağlı cihaz adı
- E2EE'nin etkinleştirilip etkinleştirilmeyeceği
- oda erişimi ve davetle otomatik katılımın yapılandırılıp yapılandırılmayacağı

Sihirbazın temel davranışları:

- Matrix kimlik doğrulama ortam değişkenleri zaten varsa ve bu hesabın kimlik doğrulaması yapılandırmada zaten kaydedilmemişse, sihirbaz kimlik doğrulamayı ortam değişkenlerinde tutmak için bir ortam kısayolu sunar.
- Hesap adları hesap kimliğine normalize edilir. Örneğin, `Ops Bot`, `ops-bot` olur.
- DM izin listesi girdileri `@user:server` biçimini doğrudan kabul eder; görünen adlar yalnızca canlı dizin araması tam bir eşleşme bulduğunda çalışır.
- Oda izin listesi girdileri oda kimliklerini ve takma adlarını doğrudan kabul eder. `!room:server` veya `#alias:server` tercih edin; çözümlenmemiş adlar, izin listesi çözümlemesi sırasında çalışma anında yok sayılır.
- Davetle otomatik katılımın izin listesi modunda yalnızca kararlı davet hedeflerini kullanın: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir.
- Kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` komutunu kullanın.

<Warning>
`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir.

Bunu ayarlamazsanız, bot davet edilen odalara veya yeni DM tarzı davetlere katılmaz; bu nedenle önce elle katılmadığınız sürece yeni gruplarda veya davet edilen DM'lerde görünmez.

Hangi davetleri kabul edeceğini kısıtlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın ya da her davete katılmasını istiyorsanız `autoJoin: "always"` ayarlayın.

`allowlist` modunda `autoJoinAllowlist` yalnızca `!roomId:server`, `#alias:server` veya `*` kabul eder.
</Warning>

İzin listesi örneği:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Her davete katıl:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Belirteç tabanlı en düşük düzey kurulum:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Parola tabanlı kurulum (girişten sonra belirteç önbelleğe alınır):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix, önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` içinde saklar.
Varsayılan hesap `credentials.json` kullanır; adlandırılmış hesaplar `credentials-<account>.json` kullanır.
Önbelleğe alınmış kimlik bilgileri burada mevcut olduğunda, mevcut kimlik doğrulama doğrudan yapılandırmada ayarlı olmasa bile OpenClaw, Matrix'i kurulum, doctor ve kanal durumu keşfi için yapılandırılmış kabul eder.

Ortam değişkeni eşdeğerleri (yapılandırma anahtarı ayarlı olmadığında kullanılır):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Varsayılan olmayan hesaplar için hesap kapsamlı ortam değişkenlerini kullanın:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

`ops` hesabı için örnek:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Normalize edilmiş `ops-bot` hesap kimliği için şunları kullanın:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix, hesap kimliklerindeki noktalama işaretlerini kaçarak kapsamlı ortam değişkenlerinin çakışmasız kalmasını sağlar.
Örneğin `-`, `_X2D_` olur; bu nedenle `ops-prod`, `MATRIX_OPS_X2D_PROD_*` olarak eşlenir.

Etkileşimli sihirbaz, ortam değişkeni kısayolunu yalnızca bu kimlik doğrulama ortam değişkenleri zaten mevcutsa ve seçilen hesabın Matrix kimlik doğrulaması yapılandırmada zaten kaydedilmemişse sunar.

## Yapılandırma örneği

Bu, DM eşleştirme, oda izin listesi ve etkin E2EE içeren pratik bir temel yapılandırmadır:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin`, DM tarzı davetler dahil tüm Matrix davetleri için geçerlidir. OpenClaw,
davet anında davet edilen bir odayı güvenilir şekilde DM veya grup olarak
sınıflandıramaz; bu nedenle tüm davetler önce `autoJoin` üzerinden geçer.
`dm.policy`, bot katıldıktan ve oda DM olarak sınıflandırıldıktan sonra uygulanır.

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır.

OpenClaw'ın tek bir canlı önizleme yanıtı göndermesini, model metin üretirken bu önizlemeyi yerinde düzenlemesini ve ardından
yanıt tamamlandığında sonlandırmasını istiyorsanız `channels.matrix.streaming` değerini `"partial"` olarak ayarlayın:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` varsayılandır. OpenClaw son yanıtı bekler ve bir kez gönderir.
- `streaming: "partial"`, geçerli yardımcı blok için düzenlenebilir bir önizleme mesajı oluşturur ve normal Matrix metin mesajları kullanır. Bu, Matrix'in eski önizleme-önce bildirim davranışını korur; dolayısıyla standart istemciler tamamlanmış blok yerine ilk akış önizleme metni için bildirim gösterebilir.
- `streaming: "quiet"`, geçerli yardımcı blok için düzenlenebilir, sessiz bir önizleme bildirimi oluşturur. Bunu yalnızca tamamlanan önizleme düzenlemeleri için alıcı push kurallarını da yapılandırdığınızda kullanın.
- `blockStreaming: true`, ayrı Matrix ilerleme mesajlarını etkinleştirir. Önizleme akışı etkin olduğunda Matrix, geçerli blok için canlı taslağı korur ve tamamlanan blokları ayrı mesajlar olarak saklar.
- Önizleme akışı açıkken `blockStreaming` kapalıysa Matrix canlı taslağı yerinde düzenler ve blok veya dönüş tamamlandığında aynı olayı sonlandırır.
- Önizleme artık tek bir Matrix olayına sığmıyorsa OpenClaw önizleme akışını durdurur ve normal son teslimata geri döner.
- Medya yanıtları ekleri yine normal şekilde gönderir. Eski bir önizleme artık güvenli şekilde yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En tutucu hız sınırı davranışını istiyorsanız akışı kapalı bırakın.

`blockStreaming`, taslak önizlemeleri tek başına etkinleştirmez.
Önizleme düzenlemeleri için `streaming: "partial"` veya `streaming: "quiet"` kullanın; ardından yalnızca tamamlanmış yardımcı blokların ayrı ilerleme mesajları olarak görünür kalmasını da istiyorsanız `blockStreaming: true` ekleyin.

Özel push kuralları olmadan standart Matrix bildirimlerine ihtiyacınız varsa, önizleme-önce davranışı için `streaming: "partial"` kullanın veya yalnızca son teslimat için `streaming` değerini kapalı bırakın. `streaming: "off"` ile:

- `blockStreaming: true`, tamamlanan her bloğu normal bildirim veren bir Matrix mesajı olarak gönderir.
- `blockStreaming: false`, yalnızca son tamamlanmış yanıtı normal bildirim veren bir Matrix mesajı olarak gönderir.

### Sessiz sonlandırılmış önizlemeler için self-hosted push kuralları

Kendi Matrix altyapınızı çalıştırıyorsanız ve sessiz önizlemelerin yalnızca bir blok veya
son yanıt tamamlandığında bildirim vermesini istiyorsanız, `streaming: "quiet"` ayarlayın ve sonlandırılmış önizleme düzenlemeleri için kullanıcı başına bir push kuralı ekleyin.

Bu genellikle homeserver genelinde bir yapılandırma değişikliği değil, alan kullanıcıya ait bir kurulumdur:

Başlamadan önce hızlı eşleme:

- alıcı kullanıcı = bildirimi alması gereken kişi
- bot kullanıcısı = yanıtı gönderen OpenClaw Matrix hesabı
- aşağıdaki API çağrıları için alıcı kullanıcının erişim belirtecini kullanın
- push kuralındaki `sender` alanını bot kullanıcısının tam MXID'si ile eşleştirin

1. OpenClaw'ı sessiz önizlemeleri kullanacak şekilde yapılandırın:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Alıcı hesabın zaten normal Matrix push bildirimleri aldığından emin olun. Sessiz önizleme
   kuralları yalnızca o kullanıcının çalışan pushers/cihazları zaten varsa çalışır.

3. Alıcı kullanıcının erişim belirtecini alın.
   - Botun belirtecini değil, alan kullanıcının belirtecini kullanın.
   - Mevcut bir istemci oturumu belirtecini yeniden kullanmak genellikle en kolay yoldur.
   - Yeni bir belirteç üretmeniz gerekiyorsa, standart Matrix Client-Server API üzerinden giriş yapabilirsiniz:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Alıcı hesabın zaten pushers'a sahip olduğunu doğrulayın:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Bu istek etkin pusher/cihaz döndürmüyorsa, aşağıdaki OpenClaw kuralını eklemeden önce normal
Matrix bildirimlerini düzeltin.

OpenClaw, sonlandırılmış yalnızca metin içeren önizleme düzenlemelerini şu şekilde işaretler:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Bu bildirimleri alması gereken her alıcı hesap için bir override push kuralı oluşturun:

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

Komutu çalıştırmadan önce şu değerleri değiştirin:

- `https://matrix.example.org`: homeserver temel URL'niz
- `$USER_ACCESS_TOKEN`: alan kullanıcının erişim belirteci
- `openclaw-finalized-preview-botname`: bu alan kullanıcı için bu bota özgü benzersiz bir kural kimliği
- `@bot:example.org`: alan kullanıcının MXID'si değil, OpenClaw Matrix bot MXID'niz

Çok botlu kurulumlar için önemli:

- Push kuralları `ruleId` ile anahtarlanır. Aynı kural kimliğine karşı `PUT` işlemini yeniden çalıştırmak, o tek kuralı günceller.
- Bir alan kullanıcı birden fazla OpenClaw Matrix bot hesabı için bildirim alacaksa, her `sender` eşleşmesi için benzersiz bir kural kimliğiyle bot başına bir kural oluşturun.
- Basit bir desen `openclaw-finalized-preview-<botname>` biçimidir; örneğin `openclaw-finalized-preview-ops` veya `openclaw-finalized-preview-support`.

Kural, olayın göndericisine göre değerlendirilir:

- alan kullanıcının belirteciyle kimlik doğrulaması yapın
- `sender` alanını OpenClaw bot MXID'siyle eşleştirin

6. Kuralın var olduğunu doğrulayın:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Akışlı bir yanıtı test edin. Sessiz modda oda sessiz bir taslak önizleme göstermeli ve son
   yerinde düzenleme blok veya dönüş tamamlandığında bir kez bildirim vermelidir.

Kuralı daha sonra kaldırmanız gerekirse, aynı kural kimliğini alan kullanıcının belirteciyle silin:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Notlar:

- Kuralı botunkisiyle değil, alan kullanıcının erişim belirteciyle oluşturun.
- Yeni kullanıcı tanımlı `override` kuralları varsayılan bastırma kurallarının önüne eklenir, bu nedenle ek bir sıralama parametresi gerekmez.
- Bu yalnızca OpenClaw'ın yerinde güvenle sonlandırabildiği yalnızca metin içeren önizleme düzenlemelerini etkiler. Medya geri dönüşleri ve eski önizleme geri dönüşleri yine normal Matrix teslimatını kullanır.
- `GET /_matrix/client/v3/pushers` hiçbir pusher göstermiyorsa, kullanıcı bu hesap/cihaz için henüz çalışan Matrix push teslimatına sahip değildir.

#### Synapse

Synapse için yukarıdaki kurulum genellikle tek başına yeterlidir:

- Sonlandırılmış OpenClaw önizleme bildirimleri için özel bir `homeserver.yaml` değişikliği gerekmez.
- Synapse dağıtımınız zaten normal Matrix push bildirimleri gönderiyorsa, yukarıdaki kullanıcı belirteci + `pushrules` çağrısı ana kurulum adımıdır.
- Synapse'i bir ters proxy veya worker'ların arkasında çalıştırıyorsanız, `/_matrix/client/.../pushrules/` yolunun Synapse'e doğru şekilde ulaştığından emin olun.
- Synapse worker'ları kullanıyorsanız, pusher'ların sağlıklı olduğundan emin olun. Push teslimatı ana süreç veya `synapse.app.pusher` / yapılandırılmış pusher worker'ları tarafından işlenir.

#### Tuwunel

Tuwunel için yukarıda gösterilen aynı kurulum akışını ve push-rule API çağrısını kullanın:

- Sonlandırılmış önizleme işaretleyicisinin kendisi için Tuwunel'e özgü bir yapılandırma gerekmez.
- Bu kullanıcı için normal Matrix bildirimleri zaten çalışıyorsa, yukarıdaki kullanıcı belirteci + `pushrules` çağrısı ana kurulum adımıdır.
- Kullanıcı başka bir cihazda etkin durumdayken bildirimler kayboluyor gibi görünüyorsa, `suppress_push_when_active` seçeneğinin etkin olup olmadığını kontrol edin. Tuwunel bu seçeneği 12 Eylül 2025'te Tuwunel 1.4.2 sürümünde ekledi ve bir cihaz etkinken diğer cihazlara gönderilen push'ları kasıtlı olarak bastırabilir.

## Bottan-bota odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Kasıtlı olarak ajanlar arası Matrix trafiği istediğinizde `allowBots` kullanın:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true`, izin verilen odalarda ve DM'lerde yapılandırılmış diğer Matrix bot hesaplarından gelen mesajları kabul eder.
- `allowBots: "mentions"`, bu mesajları yalnızca odalarda bu bottan görünür şekilde bahsedildiğinde kabul eder. DM'lere yine izin verilir.
- `groups.<room>.allowBots`, hesap düzeyindeki ayarı tek bir oda için geçersiz kılar.
- OpenClaw, kendi kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw "bot tarafından yazılmış" ifadesini "bu OpenClaw gateway'inde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak değerlendirir.

Paylaşılan odalarda bottan-bota trafiği etkinleştirirken katı oda izin listeleri ve bahsetme zorunluluğu kullanın.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda, giden görüntü olayları `thumbnail_file` kullanır; böylece görüntü önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar yine düz `thumbnail_url` kullanır. Yapılandırma gerekmez — plugin E2EE durumunu otomatik olarak algılar.

Şifrelemeyi etkinleştirin:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Doğrulama durumunu kontrol edin:

```bash
openclaw matrix verify status
```

Ayrıntılı durum (tam tanılama):

```bash
openclaw matrix verify status --verbose
```

Saklanan kurtarma anahtarını makine tarafından okunabilir çıktıya dahil edin:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-signing ve doğrulama durumunu bootstrap edin:

```bash
openclaw matrix verify bootstrap
```

Ayrıntılı bootstrap tanılaması:

```bash
openclaw matrix verify bootstrap --verbose
```

Bootstrap işleminden önce yeni bir cross-signing kimliği sıfırlamasını zorlayın:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Bu cihazı bir kurtarma anahtarıyla doğrulayın:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Ayrıntılı cihaz doğrulama ayrıntıları:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Oda anahtarı yedeklemesinin sağlığını kontrol edin:

```bash
openclaw matrix verify backup status
```

Ayrıntılı yedekleme sağlığı tanılaması:

```bash
openclaw matrix verify backup status --verbose
```

Oda anahtarlarını sunucu yedeğinden geri yükleyin:

```bash
openclaw matrix verify backup restore
```

Ayrıntılı geri yükleme tanılaması:

```bash
openclaw matrix verify backup restore --verbose
```

Geçerli sunucu yedeğini silin ve yeni bir yedekleme tabanı oluşturun. Saklanan
yedekleme anahtarı temiz şekilde yüklenemiyorsa, bu sıfırlama secret storage'ı da yeniden oluşturabilir; böylece
gelecekteki soğuk başlatmalar yeni yedekleme anahtarını yükleyebilir:

```bash
openclaw matrix verify backup reset --yes
```

Tüm `verify` komutları varsayılan olarak kısa tutulur (sessiz dahili SDK günlüklemesi dahil) ve ayrıntılı tanılama yalnızca `--verbose` ile gösterilir.
Betiklerde tam makine tarafından okunabilir çıktı için `--json` kullanın.

Çok hesaplı kurulumlarda Matrix CLI komutları, siz `--account <id>` iletmediğiniz sürece örtük Matrix varsayılan hesabını kullanır.
Birden fazla adlandırılmış hesap yapılandırırsanız önce `channels.matrix.defaultAccount` ayarlayın; aksi halde bu örtük CLI işlemleri durur ve sizden açıkça bir hesap seçmenizi ister.
Doğrulama veya cihaz işlemlerinin açıkça adlandırılmış bir hesabı hedeflemesini istediğinizde `--account` kullanın:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Şifreleme bir adlandırılmış hesap için devre dışıysa veya kullanılamıyorsa, Matrix uyarıları ve doğrulama hataları o hesabın yapılandırma anahtarını işaret eder; örneğin `channels.matrix.accounts.assistant.encryption`.

### "Doğrulanmış" ne anlama gelir

OpenClaw bu Matrix cihazını yalnızca kendi cross-signing kimliğiniz tarafından doğrulandığında doğrulanmış kabul eder.
Pratikte `openclaw matrix verify status --verbose`, üç güven sinyali gösterir:

- `Locally trusted`: bu cihaza yalnızca geçerli istemci tarafından güveniliyor
- `Cross-signing verified`: SDK bu cihazın cross-signing yoluyla doğrulandığını bildiriyor
- `Signed by owner`: cihaz kendi self-signing anahtarınız tarafından imzalanmış

`Verified by owner`, yalnızca cross-signing doğrulaması veya owner-signing mevcut olduğunda `yes` olur.
Yerel güven tek başına OpenClaw'ın cihazı tam doğrulanmış sayması için yeterli değildir.

### Bootstrap ne yapar

`openclaw matrix verify bootstrap`, şifrelenmiş Matrix hesapları için onarım ve kurulum komutudur.
Sırayla şunların hepsini yapar:

- mümkün olduğunda mevcut kurtarma anahtarını yeniden kullanarak secret storage'ı bootstrap eder
- cross-signing'i bootstrap eder ve eksik genel cross-signing anahtarlarını yükler
- geçerli cihazı işaretlemeye ve cross-sign etmeye çalışır
- henüz yoksa yeni bir sunucu tarafı oda anahtarı yedeği oluşturur

Homeserver cross-signing anahtarlarını yüklemek için etkileşimli kimlik doğrulaması gerektiriyorsa, OpenClaw yüklemeyi önce kimlik doğrulaması olmadan, sonra `m.login.dummy` ile, sonra `channels.matrix.password` yapılandırılmışsa `m.login.password` ile dener.

Yalnızca mevcut cross-signing kimliğini kasıtlı olarak atmak ve yenisini oluşturmak istediğinizde `--force-reset-cross-signing` kullanın.

Mevcut oda anahtarı yedeğini kasıtlı olarak atmak ve gelecekteki mesajlar için yeni bir
yedekleme tabanı başlatmak istiyorsanız, `openclaw matrix verify backup reset --yes` kullanın.
Bunu yalnızca kurtarılamayan eski şifreli geçmişin erişilemez kalacağını
ve OpenClaw'ın mevcut yedekleme sırrı güvenle yüklenemezse secret storage'ı yeniden oluşturabileceğini kabul ediyorsanız yapın.

### Yeni yedekleme tabanı

Gelecekteki şifreli mesajların çalışmaya devam etmesini istiyor ve kurtarılamayan eski geçmişi kaybetmeyi kabul ediyorsanız, şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Adlandırılmış bir Matrix hesabını açıkça hedeflemek istediğinizde her komuta `--account <id>` ekleyin.

### Başlangıç davranışı

`encryption: true` olduğunda Matrix varsayılan olarak `startupVerification` değerini `"if-unverified"` yapar.
Başlangıçta bu cihaz hâlâ doğrulanmamışsa Matrix başka bir Matrix istemcisinde self-verification isteyecek,
biri zaten beklemedeyken yinelenen istekleri atlayacak ve yeniden başlatmalardan sonra tekrar denemeden önce yerel bir bekleme süresi uygulayacaktır.
Başarısız istek denemeleri, varsayılan olarak başarılı istek oluşturmalardan daha erken yeniden denenir.
Otomatik başlangıç isteklerini devre dışı bırakmak için `startupVerification: "off"` ayarlayın veya daha kısa ya da daha uzun bir yeniden deneme penceresi istiyorsanız `startupVerificationCooldownHours` değerini ayarlayın.

Başlangıç ayrıca otomatik olarak tutucu bir kripto bootstrap geçişi yapar.
Bu geçiş önce geçerli secret storage ve cross-signing kimliğini yeniden kullanmayı dener ve siz açık bir bootstrap onarım akışı çalıştırmadığınız sürece cross-signing'i sıfırlamaktan kaçınır.

Başlangıç yine de bozuk bootstrap durumu bulursa, OpenClaw `channels.matrix.password` yapılandırılmamış olsa bile korumalı bir onarım yolu deneyebilir.
Homeserver bu onarım için parola tabanlı UIA gerektiriyorsa, OpenClaw bir uyarı günlüğe kaydeder ve botu durdurmak yerine başlangıcı ölümcül olmayan durumda tutar.
Geçerli cihaz zaten owner-signed ise OpenClaw bu kimliği otomatik olarak sıfırlamak yerine korur.

Tam yükseltme akışı, sınırlar, kurtarma komutları ve yaygın geçiş mesajları için [Matrix migration](/tr/install/migrating-matrix) bölümüne bakın.

### Doğrulama bildirimleri

Matrix, doğrulama yaşam döngüsü bildirimlerini doğrudan katı DM doğrulama odasına `m.notice` mesajları olarak gönderir.
Buna şunlar dahildir:

- doğrulama isteği bildirimleri
- doğrulama hazır bildirimleri ("Verify by emoji" yönlendirmesi açıkça dahil)
- doğrulama başlangıç ve tamamlanma bildirimleri
- mevcut olduğunda SAS ayrıntıları (emoji ve ondalık)

Başka bir Matrix istemcisinden gelen doğrulama istekleri OpenClaw tarafından izlenir ve otomatik kabul edilir.
Self-verification akışları için OpenClaw, emoji doğrulaması kullanılabilir olduğunda SAS akışını da otomatik olarak başlatır ve kendi tarafını onaylar.
Başka bir Matrix kullanıcısı/cihazından gelen doğrulama isteklerinde OpenClaw isteği otomatik kabul eder ve sonra SAS akışının normal şekilde ilerlemesini bekler.
Doğrulamayı tamamlamak için yine de Matrix istemcinizde emoji veya ondalık SAS'ı karşılaştırmanız ve orada "They match" onayını vermeniz gerekir.

OpenClaw kendi başlattığı yinelenen akışları körü körüne otomatik kabul etmez. Başlangıç, bir self-verification isteği zaten beklemedeyken yeni bir istek oluşturmaz.

Doğrulama protokolü/sistem bildirimleri ajan sohbet hattına iletilmez, bu nedenle `NO_REPLY` üretmezler.

### Cihaz hijyeni

OpenClaw tarafından yönetilen eski Matrix cihazları hesapta birikebilir ve şifreli oda güvenini anlamayı zorlaştırabilir.
Bunları şu komutla listeleyin:

```bash
openclaw matrix devices list
```

Eski OpenClaw tarafından yönetilen cihazları şu komutla kaldırın:

```bash
openclaw matrix devices prune-stale
```

### Kripto deposu

Matrix E2EE, Node içinde resmi `matrix-js-sdk` Rust kripto yolunu kullanır ve IndexedDB shim'i olarak `fake-indexeddb` kullanır. Kripto durumu bir anlık görüntü dosyasına (`crypto-idb-snapshot.json`) kalıcı olarak yazılır ve başlangıçta geri yüklenir. Anlık görüntü dosyası, kısıtlayıcı dosya izinleriyle saklanan hassas çalışma zamanı durumudur.

Şifrelenmiş çalışma zamanı durumu, hesap başına ve kullanıcı belirteci karması kökleri altında
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` içinde bulunur.
Bu dizin eşitleme deposunu (`bot-storage.json`), kripto deposunu (`crypto/`),
kurtarma anahtarı dosyasını (`recovery-key.json`), IndexedDB anlık görüntüsünü (`crypto-idb-snapshot.json`),
iş parçacığı bağlarını (`thread-bindings.json`) ve başlangıç doğrulama durumunu (`startup-verification.json`) içerir.
Belirteç değiştiğinde ancak hesap kimliği aynı kaldığında, OpenClaw bu hesap/homeserver/kullanıcı üçlüsü için en uygun mevcut
kökü yeniden kullanır; böylece önceki eşitleme durumu, kripto durumu, iş parçacığı bağları
ve başlangıç doğrulama durumu görünür kalır.

## Profil yönetimi

Seçilen hesap için Matrix self-profile'ını şu komutla güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Adlandırılmış bir Matrix hesabını açıkça hedeflemek istediğinizde `--account <id>` ekleyin.

Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder. `http://` veya `https://` avatar URL'si ilettiğinizde OpenClaw önce bunu Matrix'e yükler ve çözümlenen `mxc://` URL'sini yeniden `channels.matrix.avatarUrl` içine (veya seçili hesap geçersiz kılmasına) yazar.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de mesaj aracı gönderimleri için yerel Matrix iş parçacıklarını destekler.

- `dm.sessionScope: "per-user"` (varsayılan), Matrix DM yönlendirmesini gönderen kapsamlı tutar; böylece birden fazla DM odası aynı eşe çözümlendiğinde bir oturumu paylaşabilir.
- `dm.sessionScope: "per-room"`, normal DM kimlik doğrulama ve izin listesi kontrollerini yine kullanırken her Matrix DM odasını kendi oturum anahtarına ayırır.
- Açık Matrix konuşma bağları yine de `dm.sessionScope` değerine üstün gelir; bu nedenle bağlı odalar ve iş parçacıkları seçtikleri hedef oturumu korur.
- `threadReplies: "off"`, yanıtları üst düzeyde tutar ve gelen iş parçacıklı mesajları üst oturumda tutar.
- `threadReplies: "inbound"`, yalnızca gelen mesaj zaten o iş parçacığındaysa iş parçacığı içinde yanıt verir.
- `threadReplies: "always"`, oda yanıtlarını tetikleyen mesaj köküne bağlı bir iş parçacığında tutar ve bu konuşmayı ilk tetikleyici mesajdan itibaren eşleşen iş parçacığı kapsamlı oturum üzerinden yönlendirir.
- `dm.threadReplies`, yalnızca DM'ler için üst düzey ayarı geçersiz kılar. Örneğin, odalardaki iş parçacıklarını yalıtılmış tutarken DM'leri düz tutabilirsiniz.
- Gelen iş parçacıklı mesajlar, iş parçacığı kök mesajını ek ajan bağlamı olarak içerir.
- Mesaj aracı gönderimleri, açık bir `threadId` sağlanmadıkça hedef aynı oda veya aynı DM kullanıcı hedefiyse geçerli Matrix iş parçacığını otomatik devralır.
- Aynı oturumdaki DM kullanıcı hedefi yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi halde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- OpenClaw, bir Matrix DM odasının aynı paylaşılan Matrix DM oturumunda başka bir DM odasıyla çakıştığını gördüğünde, iş parçacığı bağları etkinse ve `dm.sessionScope` ipucu varsa o odaya `/focus` kaçış yolunu içeren tek seferlik bir `m.notice` gönderir.
- Çalışma zamanı iş parçacığı bağları Matrix için desteklenir. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey Matrix oda/DM `/focus`, `threadBindings.spawnSubagentSessions=true` olduğunda yeni bir Matrix iş parçacığı oluşturur ve bunu hedef oturuma bağlar.
- Var olan bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak bunun yerine geçerli iş parçacığını bağlar.

## ACP konuşma bağları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyi değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM'si, odası veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM'si veya odasında, geçerli DM/oda sohbet yüzeyi olarak kalır ve sonraki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Var olan bir Matrix iş parçacığı içinde `--bind here`, o geçerli iş parçacığını yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağı kaldırır.

Notlar:

- `--bind here`, alt bir Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnAcpSessions` yalnızca `/acp spawn --thread auto|here` için gereklidir; burada OpenClaw'ın bir alt Matrix iş parçacığı oluşturması veya bağlaması gerekir.

### İş parçacığı bağı yapılandırması

Matrix, genel varsayılanları `session.threadBindings` üzerinden devralır ve ayrıca kanal başına geçersiz kılmaları da destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix iş parçacığına bağlı oluşturma bayrakları isteğe bağlıdır:

- Üst düzey `/focus` komutunun yeni Matrix iş parçacıkları oluşturmasına ve bağlamasına izin vermek için `threadBindings.spawnSubagentSessions: true` ayarlayın.
- `/acp spawn --thread auto|here` komutunun ACP oturumlarını Matrix iş parçacıklarına bağlamasına izin vermek için `threadBindings.spawnAcpSessions: true` ayarlayın.

## Tepkiler

Matrix, giden tepki eylemlerini, gelen tepki bildirimlerini ve gelen onay tepkilerini destekler.

- Giden tepki araçları `channels["matrix"].actions.reactions` tarafından geçitlenir.
- `react`, belirli bir Matrix olayına tepki ekler.
- `reactions`, belirli bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, bot hesabının o olay üzerindeki kendi tepkilerini kaldırır.
- `remove: true`, bot hesabındaki yalnızca belirtilen emoji tepkisini kaldırır.

Onay tepkileri standart OpenClaw çözümleme sırasını kullanır:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- ajan kimliği emoji geri dönüşü

Onay tepki kapsamı şu sırayla çözülür:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tepki bildirim modu şu sırayla çözülür:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- varsayılan: `own`

Davranış:

- `reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedeflediklerinde eklenen `m.reaction` olaylarını iletir.
- `reactionNotifications: "off"`, tepki sistem olaylarını devre dışı bırakır.
- Tepki kaldırmaları sistem olaylarına dönüştürülmez çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak sunar.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı ajanı tetiklediğinde kaç son oda mesajının `InboundHistory` olarak dahil edileceğini kontrol eder. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlı değilse etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca odaya özeldir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen iletiler içindir: OpenClaw henüz yanıt tetiklememiş oda mesajlarını tamponlar, ardından bir bahsetme veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine dahil edilmez; o dönüş için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denenmesi, daha yeni oda mesajlarına doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, alınan yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı izin listesi kontrolleri tarafından izin verilen göndericilerle sınırlar.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır ancak yine de bir açık alıntılanmış yanıtı tutar.

Bu ayar, gelen iletinin kendisinin yanıt tetikleyip tetikleyemeyeceğini değil, ek bağlam görünürlüğünü etkiler.
Tetikleyici yetkilendirmesi yine `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilke ayarlarından gelir.

## DM ve oda ilkesi

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Bahsetme geçitlemesi ve izin listesi davranışı için [Groups](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse, OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinden sonra yeniden hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Pairing](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu senkron dışı kalırsa, OpenClaw canlı DM yerine eski tekil odaları işaret eden bayat `m.direct` eşlemeleriyle karşılaşabilir. Bir eş için geçerli eşlemeyi şu komutla inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Şu komutla onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Onarım akışı:

- zaten `m.direct` içinde eşlenmiş olan katı 1:1 DM'yi tercih eder
- o kullanıcıyla şu anda katılınmış herhangi bir katı 1:1 DM'ye geri düşer
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` eşlemesini yeniden yazar

Onarım akışı eski odaları otomatik olarak silmez. Yalnızca sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece yeni Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları yeniden doğru odayı hedefler.

## Exec onayları

Matrix, bir Matrix hesabı için yerel bir onay istemcisi olarak davranabilir. Yerel
DM/kanal yönlendirme düğmeleri yine exec onayı yapılandırması altında bulunur:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (isteğe bağlı; `channels.matrix.dm.allowFrom` değerine geri döner)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Onaylayanlar `@owner:example.org` gibi Matrix kullanıcı kimlikleri olmalıdır. Matrix, `enabled` ayarsız veya `"auto"` olduğunda ve en az bir onaylayan çözümlenebildiğinde yerel onayları otomatik etkinleştirir. Exec onayları önce `execApprovals.approvers` kullanır ve `channels.matrix.dm.allowFrom` değerine geri dönebilir. Plugin onayları `channels.matrix.dm.allowFrom` üzerinden yetkilendirir. Matrix'i yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi halde onay istekleri diğer yapılandırılmış onay yollarına veya onay geri dönüş ilkesine geri döner.

Matrix yerel yönlendirmesi her iki onay türünü de destekler:

- `channels.matrix.execApprovals.*`, Matrix onay istemleri için yerel DM/kanal fanout modunu kontrol eder.
- Exec onayları, `execApprovals.approvers` veya `channels.matrix.dm.allowFrom` içindeki exec onaylayıcı kümesini kullanır.
- Plugin onayları, `channels.matrix.dm.allowFrom` içindeki Matrix DM izin listesini kullanır.
- Matrix tepki kısayolları ve mesaj güncellemeleri hem exec hem de plugin onaylarına uygulanır.

Teslimat kuralları:

- `target: "dm"`, onay istemlerini onaylayıcı DM'lerine gönderir
- `target: "channel"`, istemi özgün Matrix odasına veya DM'ye geri gönderir
- `target: "both"`, istemi onaylayıcı DM'lerine ve özgün Matrix odasına veya DM'ye gönderir

Matrix onay istemleri, birincil onay mesajında tepki kısayollarını başlatır:

- `✅` = bir kez izin ver
- `❌` = reddet
- `♾️` = bu karar etkin exec ilkesi tarafından izin verildiğinde her zaman izin ver

Onaylayanlar o mesaja tepki verebilir veya geri dönüş slash komutlarını kullanabilir: `/approve <id> allow-once`, `/approve <id> allow-always` veya `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayanlar onay verebilir veya reddedebilir. Exec onayları için kanal teslimatı komut metnini içerir; bu nedenle `channel` veya `both` seçeneklerini yalnızca güvenilen odalarda etkinleştirin.

Hesap başına geçersiz kılma:

- `channels.matrix.accounts.<account>.execApprovals`

İlgili belgeler: [Exec approvals](/tr/tools/exec-approvals)

## Slash komutları

Matrix slash komutları (örneğin `/new`, `/reset`, `/model`) doğrudan DM'lerde çalışır. Odalarda OpenClaw, botun kendi Matrix mention'ı ile öneklenmiş slash komutlarını da tanır; bu nedenle `@bot:server /new`, özel bir mention regex'i gerektirmeden komut yolunu tetikler. Bu, bir kullanıcı komutu yazmadan önce sekme tamamlama ile botu eklediğinde Element ve benzeri istemcilerin ürettiği oda tarzı `@mention /command` gönderilerine botun yanıt vermeye devam etmesini sağlar.

Yetkilendirme kuralları yine geçerlidir: komut göndericileri, düz mesajlarda olduğu gibi DM veya oda izin listesi/sahip ilkelerini karşılamalıdır.

## Çok hesap

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadığı sürece adlandırılmış hesaplar için varsayılan işlevi görür.
Kalıtılan oda girdilerini bir Matrix hesabıyla sınırlamak için `groups.<room>.account` kullanabilirsiniz.
`account` olmadan gelen girdiler tüm Matrix hesapları arasında paylaşılmaya devam eder ve `account: "default"` içeren girdiler varsayılan hesap doğrudan üst düzey `channels.matrix.*` üzerinde yapılandırıldığında da çalışır.
Kısmi paylaşılan kimlik doğrulama varsayılanları tek başlarına ayrı bir örtük varsayılan hesap oluşturmaz. OpenClaw üst düzey `default` hesabını yalnızca o varsayılan yeni kimlik doğrulamaya sahipse (`homeserver` artı `accessToken` veya `homeserver` artı `userId` ve `password`) sentezler; adlandırılmış hesaplar daha sonra önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı karşıladığında yine `homeserver` artı `userId` üzerinden keşfedilebilir durumda kalabilir.
Matrix'te zaten tam olarak bir adlandırılmış hesap varsa veya `defaultAccount` mevcut bir adlandırılmış hesap anahtarını işaret ediyorsa, tek hesaptan çok hesaba onarım/kurulum yükseltmesi yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları bu yükseltilmiş hesaba taşınır; paylaşılan teslimat ilkesi anahtarları üst düzeyde kalır.
OpenClaw'ın örtük yönlendirme, yoklama ve CLI işlemleri için adlandırılmış bir Matrix hesabını tercih etmesini istiyorsanız `defaultAccount` ayarlayın.
Birden fazla Matrix hesabı yapılandırılmışsa ve hesap kimliklerinden biri `default` ise, `defaultAccount` ayarlı olmasa bile OpenClaw o hesabı örtük olarak kullanır.
Birden fazla adlandırılmış hesap yapılandırırsanız, örtük hesap seçimine dayanan CLI komutları için `defaultAccount` ayarlayın veya `--account <id>` iletin.
Bir komut için bu örtük seçimi geçersiz kılmak istediğinizde `openclaw matrix verify ...` ve `openclaw matrix devices ...` komutlarına `--account <id>` iletin.

Paylaşılan çok hesaplı desen için [Configuration reference](/tr/gateway/configuration-reference#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'lar

Varsayılan olarak OpenClaw, hesap başına
açıkça izin vermediğiniz sürece SSRF koruması için özel/dahili Matrix homeserver'ları engeller.

Homeserver'ınız localhost'ta, bir LAN/Tailscale IP'sinde veya dahili bir ana makine adında çalışıyorsa,
o Matrix hesabı için `network.dangerouslyAllowPrivateNetwork` seçeneğini etkinleştirin:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI kurulum örneği:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Bu isteğe bağlı izin yalnızca güvenilen özel/dahili hedeflere izin verir. Şu gibi genel düz metin homeserver'lar
`http://matrix.example.org:8008` yine engelli kalır. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden geçirmek

Matrix dağıtımınız açık bir giden HTTP(S) proxy gerektiriyorsa, `channels.matrix.proxy` ayarlayın:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Adlandırılmış hesaplar, üst düzey varsayılanı `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
OpenClaw, çalışma zamanı Matrix trafiği ve hesap durum yoklamaları için aynı proxy ayarını kullanır.

## Hedef çözümleme

Matrix, OpenClaw'ın sizden oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Canlı dizin araması, oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları, açık oda kimliklerini ve takma adları doğrudan kabul eder, sonra o hesap için katılınmış oda adlarında aramaya geri düşer.
- Katılınmış oda adı araması en iyi çaba esaslıdır. Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa, çalışma zamanı izin listesi çözümlemesinde yok sayılır.

## Yapılandırma başvurusu

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı etiket.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu Matrix hesabının özel/dahili homeserver'lara bağlanmasına izin verir. Homeserver `localhost`, bir LAN/Tailscale IP'si veya `matrix-synapse` gibi dahili bir ana makineye çözümleniyorsa bunu etkinleştirin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Adlandırılmış hesaplar üst düzey varsayılanı kendi `proxy` değerleriyle geçersiz kılabilir.
- `userId`: tam Matrix kullanıcı kimliği, örneğin `@bot:example.org`.
- `accessToken`: belirteç tabanlı kimlik doğrulama için erişim belirteci. Düz metin değerler ve SecretRef değerleri, env/file/exec sağlayıcıları genelinde `channels.matrix.accessToken` ve `channels.matrix.accounts.<id>.accessToken` için desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).
- `password`: parola tabanlı giriş için parola. Düz metin değerler ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile giriş için cihaz görünen adı.
- `avatarUrl`: profil eşitlemesi ve `profile set` güncellemeleri için saklanan self-avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında alınan en fazla olay sayısı.
- `encryption`: E2EE'yi etkinleştirir.
- `allowlistOnly`: `true` olduğunda `open` oda ilkesini `allowlist` düzeyine yükseltir ve `disabled` dışındaki tüm etkin DM ilkelerini (`pairing` ve `open` dahil) `allowlist` düzeyine zorlar. `disabled` ilkelerini etkilemez.
- `allowBots`: yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen mesajlara izin verir (`true` veya `"mentions"`).
- `groupPolicy`: `open`, `allowlist` veya `disabled`.
- `contextVisibility`: ek oda bağlamı görünürlük modu (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: oda trafiği için kullanıcı kimliği izin listesi. Tam Matrix kullanıcı kimlikleri en güvenlisidir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi değiştiğinde çözülür. Çözümlenmemiş adlar yok sayılır.
- `historyLimit`: grup geçmişi bağlamı olarak dahil edilecek en fazla oda mesajı sayısı. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlı değilse etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- `replyToMode`: `off`, `first`, `all` veya `batched`.
- `markdown`: giden Matrix metni için isteğe bağlı Markdown işleme yapılandırması.
- `streaming`: `off` (varsayılan), `"partial"`, `"quiet"`, `true` veya `false`. `"partial"` ve `true`, normal Matrix metin mesajlarıyla önizleme-önce taslak güncellemelerini etkinleştirir. `"quiet"`, self-hosted push-rule kurulumları için bildirim vermeyen önizleme bildirimlerini kullanır. `false`, `"off"` ile eşdeğerdir.
- `blockStreaming`: `true`, taslak önizleme akışı etkinken tamamlanan yardımcı bloklar için ayrı ilerleme mesajlarını etkinleştirir.
- `threadReplies`: `off`, `inbound` veya `always`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `startupVerification`: başlangıçta otomatik self-verification istek modu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: otomatik başlangıç doğrulama isteklerini yeniden denemeden önceki bekleme süresi.
- `textChunkLimit`: karakter cinsinden giden mesaj parça boyutu (`chunkMode` değeri `length` olduğunda uygulanır).
- `chunkMode`: `length`, mesajları karakter sayısına göre böler; `newline`, satır sınırlarında böler.
- `responsePrefix`: bu kanal için tüm giden yanıtlara eklenecek isteğe bağlı dize.
- `ackReaction`: bu kanal/hesap için isteğe bağlı onay tepkisi geçersiz kılması.
- `ackReactionScope`: isteğe bağlı onay tepki kapsamı geçersiz kılması (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: gelen tepki bildirim modu (`own`, `off`).
- `mediaMaxMb`: giden gönderimler ve gelen medya işleme için MB cinsinden medya boyutu sınırı.
- `autoJoin`: davetle otomatik katılım ilkesi (`always`, `allowlist`, `off`). Varsayılan: `off`. DM tarzı davetler dahil tüm Matrix davetlerine uygulanır.
- `autoJoinAllowlist`: `autoJoin` değeri `allowlist` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri davet işleme sırasında oda kimliklerine çözülür; OpenClaw davet edilen odanın bildirdiği takma ad durumuna güvenmez.
- `dm`: DM ilkesi bloğu (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw odaya katıldıktan ve onu DM olarak sınıflandırdıktan sonra DM erişimini kontrol eder. Bir davetin otomatik olarak katılınıp katılınmayacağını değiştirmez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimliği izin listesi. Tam Matrix kullanıcı kimlikleri en güvenlisidir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi değiştiğinde çözülür. Çözümlenmemiş adlar yok sayılır.
- `dm.sessionScope`: `per-user` (varsayılan) veya `per-room`. Eş aynı olsa bile her Matrix DM odasının ayrı bağlam tutmasını istediğinizde `per-room` kullanın.
- `dm.threadReplies`: yalnızca DM için iş parçacığı ilkesi geçersiz kılması (`off`, `inbound`, `always`). DM'lerde hem yanıt yerleşimi hem de oturum yalıtımı için üst düzey `threadReplies` ayarını geçersiz kılar.
- `execApprovals`: Matrix yerel exec onay teslimatı (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` zaten onaylayanları tanımlıyorsa isteğe bağlıdır.
- `execApprovals.target`: `dm | channel | both` (varsayılan: `dm`).
- `accounts`: hesap başına adlandırılmış geçersiz kılmalar. Üst düzey `channels.matrix` değerleri bu girdiler için varsayılan işlevi görür.
- `groups`: oda başına ilke eşlemesi. Oda kimliklerini veya takma adları tercih edin; çözümlenmemiş oda adları çalışma anında yok sayılır. Oturum/grup kimliği çözümlemeden sonra kararlı oda kimliğini kullanır.
- `groups.<room>.account`: çok hesaplı kurulumlarda kalıtılmış bir oda girdisini belirli bir Matrix hesabıyla sınırlar.
- `groups.<room>.allowBots`: yapılandırılmış bot göndericileri için oda düzeyi geçersiz kılması (`true` veya `"mentions"`).
- `groups.<room>.users`: oda başına gönderici izin listesi.
- `groups.<room>.tools`: oda başına araç izin/verme veya reddetme geçersiz kılmaları.
- `groups.<room>.autoReply`: oda düzeyi mention geçitlemesi geçersiz kılması. `true`, o oda için mention gereksinimlerini devre dışı bırakır; `false`, bunları yeniden zorunlu kılar.
- `groups.<room>.skills`: isteğe bağlı oda düzeyi beceri filtresi.
- `groups.<room>.systemPrompt`: isteğe bağlı oda düzeyi sistem istemi parçacığı.
- `rooms`: `groups` için eski takma ad.
- `actions`: eylem başına araç geçitlemesi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
