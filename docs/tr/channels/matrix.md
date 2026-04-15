---
read_when:
    - OpenClaw'da Matrix kurulumu
    - Matrix E2EE ve doğrulamasını yapılandırma
summary: Matrix desteği durumu, kurulum ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-04-15T19:41:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd730bb9d0c8a548ee48b20931b3222e9aa1e6e95f1390b0c236645e03f3576d
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix, OpenClaw için paketlenmiş bir kanal Plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, başlıkları, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Paketlenmiş Plugin

Matrix, mevcut OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Eski bir derlemeyi veya Matrix'i içermeyen özel bir kurulumu kullanıyorsanız, onu
elle kurun:

npm'den kurun:

```bash
openclaw plugins install @openclaw/matrix
```

Yerel bir checkout'tan kurun:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin davranışı ve kurulum kuralları için bkz. [Plugins](/tr/tools/plugin).

## Kurulum

1. Matrix Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar, yukarıdaki komutlarla bunu manuel olarak ekleyebilir.
2. Homeserver'ınızda bir Matrix hesabı oluşturun.
3. `channels.matrix` yapılandırmasını şu seçeneklerden biriyle yapın:
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

Matrix sihirbazı şunları ister:

- homeserver URL'si
- kimlik doğrulama yöntemi: erişim belirteci veya parola
- kullanıcı kimliği (yalnızca parola ile kimlik doğrulama)
- isteğe bağlı cihaz adı
- E2EE'nin etkinleştirilip etkinleştirilmeyeceği
- oda erişimi ve davet otomatik katılımının yapılandırılıp yapılandırılmayacağı

Sihirbazın temel davranışları:

- Matrix kimlik doğrulama ortam değişkenleri zaten varsa ve o hesap için kimlik doğrulama henüz yapılandırmada kaydedilmemişse, sihirbaz kimlik doğrulamayı ortam değişkenlerinde tutmak için bir ortam kısayolu sunar.
- Hesap adları, hesap kimliğine normalize edilir. Örneğin, `Ops Bot`, `ops-bot` olur.
- DM allowlist girişleri doğrudan `@user:server` kabul eder; görünen adlar yalnızca canlı dizin araması tam olarak bir eşleşme bulduğunda çalışır.
- Oda allowlist girişleri, oda kimliklerini ve takma adları doğrudan kabul eder. `!room:server` veya `#alias:server` tercih edin; çözümlenmemiş adlar allowlist çözümlemesi sırasında çalışma zamanında yok sayılır.
- Davet otomatik katılımı allowlist modunda yalnızca kararlı davet hedeflerini kullanın: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir.
- Oda adlarını kaydetmeden önce çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` kullanın.

<Warning>
`channels.matrix.autoJoin` için varsayılan değer `off`'tur.

Bunu ayarlamazsanız, bot davet edilen odalara veya yeni DM tarzı davetlere katılmaz; dolayısıyla önce manuel olarak katılmazsanız yeni gruplarda veya davet edilen DM'lerde görünmez.

Hangi davetleri kabul edeceğini kısıtlamak için `autoJoinAllowlist` ile birlikte `autoJoin: "allowlist"` ayarlayın veya her davete katılmasını istiyorsanız `autoJoin: "always"` ayarlayın.

`allowlist` modunda `autoJoinAllowlist` yalnızca `!roomId:server`, `#alias:server` veya `*` kabul eder.
</Warning>

Allowlist örneği:

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

Belirteç tabanlı en düşük kurulum:

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
Önbelleğe alınmış kimlik bilgileri burada mevcut olduğunda, OpenClaw geçerli kimlik doğrulama doğrudan yapılandırmada ayarlanmamış olsa bile kurulum, doctor ve kanal durumu keşfi için Matrix'i yapılandırılmış kabul eder.

Ortam değişkeni eşdeğerleri (yapılandırma anahtarı ayarlanmadığında kullanılır):

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

Matrix, hesap kapsamlı ortam değişkenlerinde çakışmaları önlemek için hesap kimliklerindeki noktalama işaretlerini kaçışlar.
Örneğin, `-`, `_X2D_` olur; dolayısıyla `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşlenir.

Etkileşimli sihirbaz, bu kimlik doğrulama ortam değişkenleri zaten mevcutsa ve seçilen hesap için Matrix kimlik doğrulaması yapılandırmaya zaten kaydedilmemişse yalnızca ortam değişkeni kısayolunu sunar.

## Yapılandırma örneği

Bu, DM pairing, oda allowlist'i ve etkinleştirilmiş E2EE ile pratik bir temel yapılandırmadır:

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

`autoJoin`, DM tarzı davetler dahil tüm Matrix davetleri için geçerlidir. OpenClaw, davet anında
davet edilen bir odayı güvenilir şekilde DM veya grup olarak sınıflandıramaz; bu yüzden tüm davetler önce `autoJoin`
üzerinden geçer. `dm.policy`, bot katıldıktan ve oda DM olarak sınıflandırıldıktan sonra uygulanır.

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır.

OpenClaw'ın tek bir canlı önizleme yanıtı göndermesini, model metin üretirken bu önizlemeyi yerinde düzenlemesini ve ardından
yanıt tamamlandığında bunu sonlandırmasını istiyorsanız `channels.matrix.streaming` değerini `"partial"` olarak ayarlayın:

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
- `streaming: "partial"`, geçerli assistant bloğu için normal Matrix metin mesajlarını kullanarak düzenlenebilir bir önizleme mesajı oluşturur. Bu, Matrix'in eski önizleme-önce bildirim davranışını korur; bu nedenle standart istemciler tamamlanmış blok yerine ilk akış önizleme metni için bildirim gösterebilir.
- `streaming: "quiet"`, geçerli assistant bloğu için düzenlenebilir bir sessiz önizleme bildirimi oluşturur. Bunu yalnızca tamamlanmış önizleme düzenlemeleri için alıcı push kurallarını da yapılandırdığınızda kullanın.
- `blockStreaming: true`, ayrı Matrix ilerleme mesajlarını etkinleştirir. Önizleme akışı etkinleştirildiğinde Matrix, geçerli blok için canlı taslağı korur ve tamamlanan blokları ayrı mesajlar olarak saklar.
- Önizleme akışı açıkken ve `blockStreaming` kapalıyken Matrix, canlı taslağı yerinde düzenler ve blok veya tur tamamlandığında aynı olayı sonlandırır.
- Önizleme artık tek bir Matrix olayına sığmıyorsa OpenClaw önizleme akışını durdurur ve normal son teslimata geri döner.
- Medya yanıtları yine ekleri normal şekilde gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En temkinli oran sınırı davranışını istiyorsanız akışı kapalı bırakın.

`blockStreaming`, tek başına taslak önizlemelerini etkinleştirmez.
Önizleme düzenlemeleri için `streaming: "partial"` veya `streaming: "quiet"` kullanın; ardından yalnızca tamamlanmış assistant bloklarının ayrı ilerleme mesajları olarak görünür kalmasını da istiyorsanız `blockStreaming: true` ekleyin.

Özel push kuralları olmadan standart Matrix bildirimlerine ihtiyacınız varsa önizleme-önce davranışı için `streaming: "partial"` kullanın veya yalnızca son teslimat için `streaming` değerini kapalı bırakın. `streaming: "off"` ile:

- `blockStreaming: true`, tamamlanan her bloğu normal bildirim veren bir Matrix mesajı olarak gönderir.
- `blockStreaming: false`, yalnızca son tamamlanmış yanıtı normal bildirim veren bir Matrix mesajı olarak gönderir.

### Sessiz sonlandırılmış önizlemeler için self-hosted push kuralları

Kendi Matrix altyapınızı çalıştırıyorsanız ve sessiz önizlemelerin yalnızca bir blok veya
son yanıt tamamlandığında bildirim vermesini istiyorsanız `streaming: "quiet"` ayarlayın ve sonlandırılmış önizleme düzenlemeleri için kullanıcı başına bir push kuralı ekleyin.

Bu genellikle homeserver genelinde bir yapılandırma değişikliği değil, alıcı kullanıcıya yönelik bir kurulumdur:

Başlamadan önce hızlı eşleme:

- alıcı kullanıcı = bildirimi alması gereken kişi
- bot kullanıcısı = yanıtı gönderen OpenClaw Matrix hesabı
- aşağıdaki API çağrıları için alıcı kullanıcının erişim belirtecini kullanın
- push kuralındaki `sender` değerini bot kullanıcısının tam MXID'siyle eşleştirin

1. OpenClaw'ı sessiz önizlemeler kullanacak şekilde yapılandırın:

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
   kuralları yalnızca o kullanıcıda çalışan pusher'lar/cihazlar zaten varsa çalışır.

3. Alıcı kullanıcının erişim belirtecini alın.
   - Botun belirtecini değil, alan kullanıcının belirtecini kullanın.
   - Mevcut bir istemci oturumu belirtecini yeniden kullanmak genellikle en kolay yoldur.
   - Yeni bir belirteç üretmeniz gerekiyorsa standart Matrix Client-Server API üzerinden oturum açabilirsiniz:

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

4. Alıcı hesabın zaten pusher'lara sahip olduğunu doğrulayın:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Bu, etkin pusher/cihaz döndürmüyorsa aşağıdaki
OpenClaw kuralını eklemeden önce normal Matrix bildirimlerini düzeltin.

OpenClaw, sonlandırılmış yalnızca metin önizleme düzenlemelerini şu şekilde işaretler:

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
- `openclaw-finalized-preview-botname`: bu alan kullanıcı için bu bota özgü bir kural kimliği
- `@bot:example.org`: alan kullanıcının MXID'si değil, OpenClaw Matrix bot MXID'niz

Çok botlu kurulumlar için önemli:

- Push kuralları `ruleId` ile anahtarlanır. Aynı kural kimliğine karşı `PUT` işlemini yeniden çalıştırmak, o tek kuralı günceller.
- Bir alan kullanıcı birden fazla OpenClaw Matrix bot hesabı için bildirim alacaksa, her `sender` eşleşmesi için benzersiz bir kural kimliğiyle bot başına bir kural oluşturun.
- Basit bir desen `openclaw-finalized-preview-<botname>` şeklindedir; örneğin `openclaw-finalized-preview-ops` veya `openclaw-finalized-preview-support`.

Kural, olay gönderenine göre değerlendirilir:

- alan kullanıcının belirteciyle kimlik doğrulayın
- `sender` değerini OpenClaw bot MXID'siyle eşleştirin

6. Kuralın mevcut olduğunu doğrulayın:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Akışlı bir yanıtı test edin. Sessiz modda oda sessiz bir taslak önizleme göstermeli ve son
   yerinde düzenleme, blok veya tur tamamlandığında bir kez bildirim vermelidir.

Kuralı daha sonra kaldırmanız gerekirse, alan kullanıcının belirteciyle aynı kural kimliğini silin:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Notlar:

- Kuralı botun değil, alan kullanıcının erişim belirteciyle oluşturun.
- Yeni kullanıcı tanımlı `override` kuralları varsayılan bastırma kurallarının önüne eklenir; bu nedenle ek bir sıralama parametresi gerekmez.
- Bu yalnızca OpenClaw'ın güvenle yerinde sonlandırabildiği yalnızca metin önizleme düzenlemelerini etkiler. Medya fallback'leri ve eski önizleme fallback'leri hâlâ normal Matrix teslimatını kullanır.
- `GET /_matrix/client/v3/pushers` hiçbir pusher göstermiyorsa, kullanıcının bu hesap/cihaz için henüz çalışan Matrix push teslimi yoktur.

#### Synapse

Synapse için yukarıdaki kurulum genellikle tek başına yeterlidir:

- Sonlandırılmış OpenClaw önizleme bildirimleri için özel bir `homeserver.yaml` değişikliği gerekmez.
- Synapse dağıtımınız zaten normal Matrix push bildirimleri gönderiyorsa, kullanıcı belirteci + yukarıdaki `pushrules` çağrısı ana kurulum adımıdır.
- Synapse'i ters proxy veya worker'lar arkasında çalıştırıyorsanız `/_matrix/client/.../pushrules/` yolunun Synapse'e doğru ulaştığından emin olun.
- Synapse worker'ları kullanıyorsanız pusher'ların sağlıklı olduğundan emin olun. Push teslimi ana süreç veya `synapse.app.pusher` / yapılandırılmış pusher worker'ları tarafından gerçekleştirilir.

#### Tuwunel

Tuwunel için yukarıda gösterilen aynı kurulum akışını ve push-rule API çağrısını kullanın:

- Sonlandırılmış önizleme işaretleyicisinin kendisi için Tuwunel'e özgü bir yapılandırma gerekmez.
- Normal Matrix bildirimleri o kullanıcı için zaten çalışıyorsa, kullanıcı belirteci + yukarıdaki `pushrules` çağrısı ana kurulum adımıdır.
- Kullanıcı başka bir cihazda etkin durumdayken bildirimler kayboluyor gibi görünüyorsa `suppress_push_when_active` etkin mi kontrol edin. Tuwunel bu seçeneği 12 Eylül 2025'te Tuwunel 1.4.2 sürümünde ekledi ve bir cihaz etkin durumdayken diğer cihazlara push göndermeyi kasıtlı olarak bastırabilir.

## Bottan bota odalar

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
- `allowBots: "mentions"`, bu mesajları odalarda yalnızca bu bottan görünür şekilde bahsettiklerinde kabul eder. DM'lere yine izin verilir.
- `groups.<room>.allowBots`, hesap düzeyi ayarı tek bir oda için geçersiz kılar.
- OpenClaw, kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw "bot tarafından yazılmış" ifadesini "bu OpenClaw gateway üzerinde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak değerlendirir.

Paylaşılan odalarda bottan bota trafiği etkinleştirirken sıkı oda allowlist'leri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda, giden görsel olayları `thumbnail_file` kullanır; böylece görsel önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar yine düz `thumbnail_url` kullanır. Hiçbir yapılandırma gerekmez — Plugin E2EE durumunu otomatik olarak algılar.

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

Makine tarafından okunabilir çıktıya saklanan kurtarma anahtarını dahil edin:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Çapraz imzalama ve doğrulama durumunu bootstrap edin:

```bash
openclaw matrix verify bootstrap
```

Ayrıntılı bootstrap tanılaması:

```bash
openclaw matrix verify bootstrap --verbose
```

Bootstrap öncesinde yeni bir çapraz imzalama kimliği sıfırlamasını zorlayın:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Bu cihazı bir kurtarma anahtarı ile doğrulayın:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Ayrıntılı cihaz doğrulama ayrıntıları:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Oda anahtarı yedekleme sağlığını kontrol edin:

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

Geçerli sunucu yedeğini silin ve yeni bir yedek temel çizgisi oluşturun. Saklanan
yedek anahtarı temiz şekilde yüklenemiyorsa, bu sıfırlama secret storage'ı da yeniden oluşturabilir; böylece
gelecekteki soğuk başlatmalar yeni yedek anahtarını yükleyebilir:

```bash
openclaw matrix verify backup reset --yes
```

Tüm `verify` komutları varsayılan olarak kısa çıktılıdır (sessiz iç SDK günlükleri dahil) ve ayrıntılı tanılamayı yalnızca `--verbose` ile gösterir.
Betik yazarken tam makine tarafından okunabilir çıktı için `--json` kullanın.

Çok hesaplı kurulumlarda, Matrix CLI komutları `--account <id>` vermediğiniz sürece örtük Matrix varsayılan hesabını kullanır.
Birden fazla adlandırılmış hesap yapılandırırsanız, önce `channels.matrix.defaultAccount` ayarlayın; aksi hâlde bu örtük CLI işlemleri durur ve sizden açıkça bir hesap seçmenizi ister.
Doğrulama veya cihaz işlemlerinin açıkça adlandırılmış bir hesabı hedeflemesini istediğinizde `--account` kullanın:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Şifreleme devre dışıysa veya adlandırılmış bir hesap için kullanılamıyorsa, Matrix uyarıları ve doğrulama hataları o hesabın yapılandırma anahtarını işaret eder; örneğin `channels.matrix.accounts.assistant.encryption`.

### "Doğrulanmış" ne anlama gelir

OpenClaw bu Matrix cihazını yalnızca kendi çapraz imzalama kimliğiniz tarafından doğrulandığında doğrulanmış kabul eder.
Pratikte `openclaw matrix verify status --verbose`, üç güven sinyali gösterir:

- `Locally trusted`: bu cihaz yalnızca mevcut istemci tarafından güvenilir kabul edilir
- `Cross-signing verified`: SDK, cihazı çapraz imzalama yoluyla doğrulanmış olarak bildirir
- `Signed by owner`: cihaz, sizin self-signing anahtarınız tarafından imzalanmıştır

`Verified by owner`, yalnızca çapraz imzalama doğrulaması veya sahip imzası mevcut olduğunda `yes` olur.
Tek başına yerel güven, OpenClaw'ın cihazı tam doğrulanmış olarak değerlendirmesi için yeterli değildir.

### Bootstrap ne yapar

`openclaw matrix verify bootstrap`, şifrelenmiş Matrix hesapları için onarım ve kurulum komutudur.
Sırayla aşağıdakilerin tümünü yapar:

- mümkün olduğunda mevcut kurtarma anahtarını yeniden kullanarak secret storage'ı bootstrap eder
- çapraz imzalamayı bootstrap eder ve eksik ortak çapraz imzalama anahtarlarını yükler
- geçerli cihazı işaretlemeyi ve çapraz imzalamayı dener
- zaten yoksa yeni bir sunucu tarafı oda anahtarı yedeği oluşturur

Homeserver çapraz imzalama anahtarlarını yüklemek için etkileşimli kimlik doğrulama gerektiriyorsa OpenClaw yüklemeyi önce kimlik doğrulama olmadan, sonra `m.login.dummy` ile, ardından `channels.matrix.password` yapılandırılmışsa `m.login.password` ile dener.

Yalnızca geçerli çapraz imzalama kimliğini kasıtlı olarak atmak ve yenisini oluşturmak istiyorsanız `--force-reset-cross-signing` kullanın.

Geçerli oda anahtarı yedeğini kasıtlı olarak atmak ve gelecekteki mesajlar için yeni
bir yedek temel çizgisi başlatmak istiyorsanız `openclaw matrix verify backup reset --yes` kullanın.
Bunu yalnızca kurtarılamayan eski şifreli geçmişin erişilemez
kalacağını ve OpenClaw'ın geçerli yedek
gizlisi güvenle yüklenemiyorsa secret storage'ı yeniden oluşturabileceğini kabul ettiğinizde yapın.

### Yeni yedek temel çizgisi

Gelecekteki şifreli mesajların çalışmasını sürdürmek ve kurtarılamayan eski geçmişi kaybetmeyi kabul etmek istiyorsanız şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istediğinizde her komuta `--account <id>` ekleyin.

### Başlangıç davranışı

`encryption: true` olduğunda Matrix, `startupVerification` değerini varsayılan olarak `"if-unverified"` yapar.
Başlangıçta bu cihaz hâlâ doğrulanmamışsa Matrix başka bir Matrix istemcisinde self-verification isteyecek,
biri zaten beklemedeyken yinelenen istekleri atlayacak ve yeniden başlatmalardan sonra yeniden denemeden önce yerel bir bekleme süresi uygulayacaktır.
Başarısız istek denemeleri varsayılan olarak başarılı istek oluşturmalardan daha erken yeniden denenir.
Otomatik başlangıç isteklerini devre dışı bırakmak için `startupVerification: "off"` ayarlayın veya daha kısa ya da daha uzun bir yeniden deneme penceresi istiyorsanız `startupVerificationCooldownHours` değerini ayarlayın.

Başlangıç ayrıca otomatik olarak temkinli bir crypto bootstrap geçişi gerçekleştirir.
Bu geçiş önce geçerli secret storage ve çapraz imzalama kimliğini yeniden kullanmayı dener ve siz açık bir bootstrap onarım akışı çalıştırmadıkça çapraz imzalamayı sıfırlamaktan kaçınır.

Başlangıç yine de bozuk bootstrap durumu bulursa, OpenClaw `channels.matrix.password` yapılandırılmamış olsa bile korumalı bir onarım yolu deneyebilir.
Homeserver bu onarım için parola tabanlı UIA gerektiriyorsa OpenClaw bir uyarı günlüğe kaydeder ve botu sonlandırmak yerine başlangıcı ölümcül olmayan durumda tutar.
Geçerli cihaz zaten sahip tarafından imzalanmışsa OpenClaw bu kimliği otomatik olarak sıfırlamak yerine korur.

Tam yükseltme akışı, sınırlar, kurtarma komutları ve yaygın geçiş mesajları için bkz. [Matrix migration](/tr/install/migrating-matrix).

### Doğrulama bildirimleri

Matrix, doğrulama yaşam döngüsü bildirimlerini doğrudan katı DM doğrulama odasına `m.notice` mesajları olarak gönderir.
Buna şunlar dahildir:

- doğrulama isteği bildirimleri
- doğrulama hazır bildirimleri ("Emoji ile doğrula" yönlendirmesi açıkça dahil)
- doğrulama başlangıç ve tamamlanma bildirimleri
- mevcut olduğunda SAS ayrıntıları (emoji ve ondalık)

Başka bir Matrix istemcisinden gelen doğrulama istekleri OpenClaw tarafından izlenir ve otomatik kabul edilir.
Self-verification akışları için OpenClaw, emoji doğrulaması kullanılabilir olduğunda SAS akışını da otomatik başlatır ve kendi tarafını onaylar.
Başka bir Matrix kullanıcısı/cihazından gelen doğrulama istekleri için OpenClaw isteği otomatik kabul eder ve ardından SAS akışının normal şekilde ilerlemesini bekler.
Doğrulamayı tamamlamak için yine de Matrix istemcinizde emoji veya ondalık SAS değerini karşılaştırmanız ve orada "Eşleşiyorlar" onayı vermeniz gerekir.

OpenClaw, kendi başlattığı yinelenen akışları körü körüne otomatik kabul etmez. Başlangıç, bir self-verification isteği zaten beklemedeyse yeni bir istek oluşturmayı atlar.

Doğrulama protokolü/sistem bildirimleri ajan sohbet işlem hattına iletilmez; bu nedenle `NO_REPLY` üretmezler.

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

### Crypto store

Matrix E2EE, Node içinde resmi `matrix-js-sdk` Rust crypto yolunu kullanır; IndexedDB shim'i olarak `fake-indexeddb` kullanılır. Crypto durumu bir anlık görüntü dosyasına (`crypto-idb-snapshot.json`) kalıcı olarak yazılır ve başlangıçta geri yüklenir. Anlık görüntü dosyası, kısıtlayıcı dosya izinleriyle saklanan hassas çalışma zamanı durumudur.

Şifrelenmiş çalışma zamanı durumu, hesap başına ve kullanıcı belirteci karması kökleri altında
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` içinde yaşar.
Bu dizin sync store (`bot-storage.json`), crypto store (`crypto/`),
recovery key dosyası (`recovery-key.json`), IndexedDB anlık görüntüsü (`crypto-idb-snapshot.json`),
thread binding'ler (`thread-bindings.json`) ve başlangıç doğrulama durumu (`startup-verification.json`) içerir.
Belirteç değiştiğinde ancak hesap kimliği aynı kaldığında OpenClaw, önceki sync durumu, crypto durumu, thread binding'leri
ve başlangıç doğrulama durumu görünür kalacak şekilde o hesap/homeserver/kullanıcı demeti için en uygun mevcut
kökü yeniden kullanır.

## Profil yönetimi

Seçilen hesap için Matrix self-profile'ı şu komutla güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istediğinizde `--account <id>` ekleyin.

Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder. `http://` veya `https://` avatar URL'si verdiğinizde OpenClaw önce bunu Matrix'e yükler ve çözümlenen `mxc://` URL'sini yeniden `channels.matrix.avatarUrl` içine (veya seçilen hesap override'ına) yazar.

## Thread'ler

Matrix, hem otomatik yanıtlar hem de message-tool gönderimleri için yerel Matrix thread'lerini destekler.

- `dm.sessionScope: "per-user"` (varsayılan), Matrix DM yönlendirmesini gönderici kapsamlı tutar; böylece aynı eş kullanıcıya çözümlendiklerinde birden fazla DM odası tek bir oturumu paylaşabilir.
- `dm.sessionScope: "per-room"`, normal DM kimlik doğrulama ve allowlist denetimlerini kullanmaya devam ederken her Matrix DM odasını kendi oturum anahtarına yalıtır.
- Açık Matrix konuşma binding'leri hâlâ `dm.sessionScope` üzerinde önceliklidir; bu nedenle bağlanmış odalar ve thread'ler seçilmiş hedef oturumlarını korur.
- `threadReplies: "off"`, yanıtları üst düzeyde tutar ve gelen thread'li mesajları üst oturumda tutar.
- `threadReplies: "inbound"`, yalnızca gelen mesaj zaten o thread içindeyse thread içinde yanıt verir.
- `threadReplies: "always"`, oda yanıtlarını tetikleyici mesaja köklenen bir thread içinde tutar ve o konuşmayı ilk tetikleyici mesajdan itibaren eşleşen thread kapsamlı oturum üzerinden yönlendirir.
- `dm.threadReplies`, yalnızca DM'ler için üst düzey ayarı geçersiz kılar. Örneğin, odalardaki thread'leri yalıtılmış tutarken DM'leri düz tutabilirsiniz.
- Gelen thread'li mesajlar, ek ajan bağlamı olarak thread kök mesajını içerir.
- Message-tool gönderimleri, açık bir `threadId` sağlanmadıkça, hedef aynı oda veya aynı DM kullanıcı hedefi olduğunda geçerli Matrix thread'ini otomatik olarak devralır.
- Aynı oturumda DM kullanıcı hedefi yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabında aynı DM eş kullanıcısını kanıtlarsa devreye girer; aksi takdirde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- OpenClaw, bir Matrix DM odasının aynı paylaşılan Matrix DM oturumunda başka bir DM odasıyla çakıştığını görürse, thread binding'leri etkin olduğunda ve `dm.sessionScope` ipucu mevcutsa o odada `/focus` kaçış kapağı ile tek seferlik bir `m.notice` gönderir.
- Matrix için çalışma zamanı thread binding'leri desteklenir. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve thread'e bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey Matrix oda/DM `/focus`, `threadBindings.spawnSubagentSessions=true` olduğunda yeni bir Matrix thread'i oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix thread'i içinde `/focus` veya `/acp spawn --thread here` çalıştırmak, bunun yerine o geçerli thread'i bağlar.

## ACP konuşma binding'leri

Matrix odaları, DM'ler ve mevcut Matrix thread'leri sohbet yüzeyini değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmayı sürdürmek istediğiniz Matrix DM, oda veya mevcut thread içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında, geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix thread'i içinde `--bind here`, o geçerli thread'i yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve binding'i kaldırır.

Notlar:

- `--bind here`, bir alt Matrix thread'i oluşturmaz.
- `threadBindings.spawnAcpSessions` yalnızca `/acp spawn --thread auto|here` için gereklidir; burada OpenClaw'ın bir alt Matrix thread'i oluşturması veya bağlaması gerekir.

### Thread binding yapılandırması

Matrix, genel varsayılanları `session.threadBindings` üzerinden devralır ve kanal başına override'ları da destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix thread'e bağlı oluşturma bayrakları isteğe bağlıdır:

- Üst düzey `/focus` komutunun yeni Matrix thread'leri oluşturup bağlayabilmesi için `threadBindings.spawnSubagentSessions: true` ayarlayın.
- `/acp spawn --thread auto|here` komutunun ACP oturumlarını Matrix thread'lerine bağlayabilmesi için `threadBindings.spawnAcpSessions: true` ayarlayın.

## Tepkiler

Matrix, giden tepki eylemlerini, gelen tepki bildirimlerini ve gelen ack tepkilerini destekler.

- Giden tepki araçları `channels["matrix"].actions.reactions` tarafından denetlenir.
- `react`, belirli bir Matrix olayına tepki ekler.
- `reactions`, belirli bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, bot hesabının o olay üzerindeki kendi tepkilerini kaldırır.
- `remove: true`, bot hesabından yalnızca belirtilen emoji tepkisini kaldırır.

Ack tepkileri standart OpenClaw çözümleme sırasını kullanır:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- ajan kimliği emoji fallback'i

Ack tepki kapsamı şu sırayla çözümlenir:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tepki bildirim modu şu sırayla çözümlenir:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- varsayılan: `own`

Davranış:

- `reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedeflediklerinde eklenen `m.reaction` olaylarını iletir.
- `reactionNotifications: "off"`, tepki sistem olaylarını devre dışı bırakır.
- Tepki kaldırmaları, Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak sunduğu için sistem olaylarına sentezlenmez.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı ajanı tetiklediğinde `InboundHistory` olarak dahil edilen son oda mesajı sayısını denetler. `messages.groupChat.historyLimit` değerine fallback yapar; ikisi de ayarlı değilse etkili varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca odaya özeldir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca beklemede olan geçmişten oluşur: OpenClaw henüz bir yanıt tetiklememiş oda mesajlarını arabelleğe alır, ardından bir mention veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine dahil edilmez; o tur için ana gelen gövde içinde kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, alınan yanıt metni, thread kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı allowlist denetimlerinin izin verdiği göndericilere filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır ancak yine de açıkça alıntılanmış tek bir yanıtı korur.

Bu ayar, ek bağlam görünürlüğünü etkiler; gelen mesajın kendisinin bir yanıtı tetikleyip tetikleyemeyeceğini etkilemez.
Tetikleyici yetkilendirmesi hâlâ `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilke ayarlarından gelir.

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

Mention denetimi ve allowlist davranışı için bkz. [Groups](/tr/channels/groups).

Matrix DM'leri için pairing örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj atmaya devam ederse, OpenClaw aynı bekleyen pairing kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinden sonra yeniden bir hatırlatma yanıtı gönderebilir.

Paylaşılan DM pairing akışı ve depolama düzeni için bkz. [Pairing](/tr/channels/pairing).

## Doğrudan oda onarımı

Doğrudan mesaj durumu senkron dışı kalırsa, OpenClaw canlı DM yerine eski tekil odaları işaret eden bayat `m.direct` eşlemeleriyle karşılaşabilir. Bir eş kullanıcı için geçerli eşlemeyi şu komutla inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Şu komutla onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Onarım akışı:

- zaten `m.direct` içinde eşlenmiş katı 1:1 DM'yi tercih eder
- bununla bir sağlıkli DM yoksa, o kullanıcıyla şu anda katılmış olan herhangi bir katı 1:1 DM'ye fallback yapar
- sağlıklı bir DM yoksa yeni bir direct room oluşturur ve `m.direct` öğesini yeniden yazar

Onarım akışı eski odaları otomatik olarak silmez. Yalnızca sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece yeni Matrix gönderimleri, doğrulama bildirimleri ve diğer direct-message akışları yeniden doğru odayı hedefler.

## Exec onayları

Matrix, bir Matrix hesabı için yerel bir onay istemcisi olarak davranabilir. Yerel
DM/kanal yönlendirme düğmeleri exec onay yapılandırması altında yaşamaya devam eder:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (isteğe bağlı; `channels.matrix.dm.allowFrom` değerine fallback yapar)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Onaylayıcılar `@owner:example.org` gibi Matrix kullanıcı kimlikleri olmalıdır. Matrix, `enabled` ayarsız veya `"auto"` olduğunda ve en az bir onaylayıcı çözümlenebildiğinde yerel onayları otomatik etkinleştirir. Exec onayları önce `execApprovals.approvers` kullanır ve `channels.matrix.dm.allowFrom` değerine fallback yapabilir. Plugin onayları `channels.matrix.dm.allowFrom` üzerinden yetkilendirilir. Matrix'i yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Bunun dışında onay istekleri, yapılandırılmış diğer onay yollarına veya onay fallback ilkesine geri döner.

Matrix yerel yönlendirmesi her iki onay türünü de destekler:

- `channels.matrix.execApprovals.*`, Matrix onay istemleri için yerel DM/kanal yayılım modunu denetler.
- Exec onayları, `execApprovals.approvers` veya `channels.matrix.dm.allowFrom` içindeki exec onaylayıcı kümesini kullanır.
- Plugin onayları, `channels.matrix.dm.allowFrom` içindeki Matrix DM allowlist'ini kullanır.
- Matrix tepki kısayolları ve mesaj güncellemeleri hem exec hem de Plugin onaylarına uygulanır.

Teslim kuralları:

- `target: "dm"`, onay istemlerini onaylayıcı DM'lerine gönderir
- `target: "channel"`, istemi kaynak Matrix odasına veya DM'ye geri gönderir
- `target: "both"`, istemi onaylayıcı DM'lerine ve kaynak Matrix odasına veya DM'ye gönderir

Matrix onay istemleri, birincil onay mesajı üzerinde tepki kısayolları tohumlar:

- `✅` = bir kez izin ver
- `❌` = reddet
- `♾️` = bu karar etkili exec ilkesi tarafından izin verildiğinde her zaman izin ver

Onaylayıcılar bu mesaja tepki verebilir veya fallback slash komutlarını kullanabilir: `/approve <id> allow-once`, `/approve <id> allow-always` veya `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; bu nedenle `channel` veya `both` seçeneklerini yalnızca güvenilir odalarda etkinleştirin.

Hesap başına override:

- `channels.matrix.accounts.<account>.execApprovals`

İlgili belgeler: [Exec approvals](/tr/tools/exec-approvals)

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

Üst düzey `channels.matrix` değerleri, bir hesap bunları override etmediği sürece adlandırılmış hesaplar için varsayılan olarak davranır.
Devralınan oda girişlerini bir Matrix hesabına `groups.<room>.account` ile kapsamlayabilirsiniz.
`account` içermeyen girişler tüm Matrix hesapları arasında paylaşımlı kalır ve `account: "default"` içeren girişler, varsayılan hesap doğrudan üst düzey `channels.matrix.*` üzerinde yapılandırıldığında da çalışmaya devam eder.
Kısmi paylaşımlı kimlik doğrulama varsayılanları kendi başlarına ayrı bir örtük varsayılan hesap oluşturmaz. OpenClaw, yalnızca o varsayılan taze kimlik doğrulamaya sahipse (`homeserver` artı `accessToken` veya `homeserver` artı `userId` ve `password`) üst düzey `default` hesabını sentezler; adlandırılmış hesaplar, önbelleğe alınmış kimlik bilgileri daha sonra kimlik doğrulamayı karşıladığında `homeserver` artı `userId` üzerinden keşfedilebilir kalabilir.
Matrix zaten tam olarak bir adlandırılmış hesaba sahipse veya `defaultAccount` mevcut bir adlandırılmış hesap anahtarını işaret ediyorsa, tek hesaplıdan çok hesaplıya onarım/kurulum yükseltmesi yeni bir `accounts.default` girişi oluşturmak yerine o hesabı korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları bu yükseltilmiş hesaba taşınır; paylaşılan teslim ilkesi anahtarları üst düzeyde kalır.
OpenClaw'ın örtük yönlendirme, probing ve CLI işlemleri için bir adlandırılmış Matrix hesabını tercih etmesini istiyorsanız `defaultAccount` ayarlayın.
Birden fazla Matrix hesabı yapılandırılmışsa ve hesap kimliklerinden biri `default` ise, `defaultAccount` ayarlı olmasa bile OpenClaw bu hesabı örtük olarak kullanır.
Birden fazla adlandırılmış hesap yapılandırırsanız, örtük hesap seçimine dayanan CLI komutları için `defaultAccount` ayarlayın veya `--account <id>` verin.
Bir komut için bu örtük seçimi override etmek istediğinizde `openclaw matrix verify ...` ve `openclaw matrix devices ...` komutlarına `--account <id>` verin.

Paylaşılan çok hesap deseni için bkz. [Configuration reference](/tr/gateway/configuration-reference#multi-account-all-channels).

## Özel/LAN homeserver'lar

Varsayılan olarak OpenClaw, siz
hesap başına açıkça izin vermediğiniz sürece SSRF koruması için özel/iç Matrix homeserver'larını engeller.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya iç bir ana makine adında çalışıyorsa,
o Matrix hesabı için `network.dangerouslyAllowPrivateNetwork` ayarını etkinleştirin:

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

Bu isteğe bağlı etkinleştirme yalnızca güvenilir özel/iç hedeflere izin verir. `http://matrix.example.org:8008` gibi
genel açık metin homeserver'lar engellenmeye devam eder. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy'leme

Matrix dağıtımınız açık bir giden HTTP(S) proxy gerektiriyorsa `channels.matrix.proxy` ayarlayın:

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

Adlandırılmış hesaplar, üst düzey varsayılanı `channels.matrix.accounts.<id>.proxy` ile override edebilir.
OpenClaw, aynı proxy ayarını çalışma zamanı Matrix trafiği ve hesap durumu probing'leri için kullanır.

## Hedef çözümleme

Matrix, OpenClaw'ın sizden oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Canlı dizin araması oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o homeserver'daki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, ardından o hesap için katılınmış oda adlarında aramaya fallback yapar.
- Katılınmış oda adı araması en iyi çabayladır. Bir oda adı kimlik veya takma ad olarak çözümlenemiyorsa çalışma zamanı allowlist çözümlemesi tarafından yok sayılır.

## Yapılandırma başvurusu

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı etiket.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu Matrix hesabının özel/iç homeserver'lara bağlanmasına izin verir. Homeserver `localhost`, bir LAN/Tailscale IP'si veya `matrix-synapse` gibi iç bir ana makineye çözümleniyorsa bunu etkinleştirin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Adlandırılmış hesaplar üst düzey varsayılanı kendi `proxy` değerleriyle override edebilir.
- `userId`: tam Matrix kullanıcı kimliği, örneğin `@bot:example.org`.
- `accessToken`: belirteç tabanlı kimlik doğrulama için erişim belirteci. Düz metin değerler ve SecretRef değerleri, env/file/exec sağlayıcıları genelinde `channels.matrix.accessToken` ve `channels.matrix.accounts.<id>.accessToken` için desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).
- `password`: parola tabanlı oturum açma için parola. Düz metin değerler ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile giriş için cihaz görünen adı.
- `avatarUrl`: profil eşitlemesi ve `profile set` güncellemeleri için saklanan self-avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında getirilen azami olay sayısı.
- `encryption`: E2EE'yi etkinleştirir.
- `allowlistOnly`: `true` olduğunda `open` oda ilkesini `allowlist`'e yükseltir ve `disabled` dışındaki tüm etkin DM ilkelerini (`pairing` ve `open` dahil) `allowlist` olmaya zorlar. `disabled` ilkelerini etkilemez.
- `allowBots`: yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen mesajlara izin verir (`true` veya `"mentions"`).
- `groupPolicy`: `open`, `allowlist` veya `disabled`.
- `contextVisibility`: ek oda bağlamı görünürlük modu (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: oda trafiği için kullanıcı kimlikleri allowlist'i. Girişler tam Matrix kullanıcı kimlikleri olmalıdır; çözümlenmemiş adlar çalışma zamanında yok sayılır.
- `historyLimit`: grup geçmiş bağlamı olarak eklenecek azami oda mesajı sayısı. `messages.groupChat.historyLimit` değerine fallback yapar; ikisi de ayarlı değilse etkili varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- `replyToMode`: `off`, `first`, `all` veya `batched`.
- `markdown`: giden Matrix metni için isteğe bağlı Markdown işleme yapılandırması.
- `streaming`: `off` (varsayılan), `"partial"`, `"quiet"`, `true` veya `false`. `"partial"` ve `true`, normal Matrix metin mesajlarıyla önizleme-önce taslak güncellemelerini etkinleştirir. `"quiet"`, self-hosted push-rule kurulumları için bildirim vermeyen önizleme bildirimlerini kullanır. `false`, `"off"` ile eşdeğerdir.
- `blockStreaming`: `true`, taslak önizleme akışı etkin olduğunda tamamlanan assistant blokları için ayrı ilerleme mesajlarını etkinleştirir.
- `threadReplies`: `off`, `inbound` veya `always`.
- `threadBindings`: thread'e bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına override'lar.
- `startupVerification`: başlangıçta otomatik self-verification istek modu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: otomatik başlangıç doğrulama isteklerini yeniden denemeden önceki bekleme süresi.
- `textChunkLimit`: karakter cinsinden giden mesaj parça boyutu (`chunkMode`, `length` olduğunda uygulanır).
- `chunkMode`: `length`, mesajları karakter sayısına göre böler; `newline`, satır sınırlarında böler.
- `responsePrefix`: bu kanal için tüm giden yanıtların başına eklenen isteğe bağlı dize.
- `ackReaction`: bu kanal/hesap için isteğe bağlı ack tepki override'ı.
- `ackReactionScope`: isteğe bağlı ack tepki kapsamı override'ı (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: gelen tepki bildirim modu (`own`, `off`).
- `mediaMaxMb`: giden gönderimler ve gelen medya işleme için MB cinsinden medya boyutu üst sınırı.
- `autoJoin`: davet otomatik katılım ilkesi (`always`, `allowlist`, `off`). Varsayılan: `off`. DM tarzı davetler dahil tüm Matrix davetlerine uygulanır.
- `autoJoinAllowlist`: `autoJoin`, `allowlist` olduğunda izin verilen odalar/takma adlar. Takma ad girişleri davet işleme sırasında oda kimliklerine çözümlenir; OpenClaw davet edilen odanın iddia ettiği takma ad durumuna güvenmez.
- `dm`: DM ilke bloğu (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw odaya katıldıktan ve onu bir DM olarak sınıflandırdıktan sonra DM erişimini denetler. Bir davetin otomatik olarak katılıp katılmayacağını değiştirmez.
- `dm.allowFrom`: girişler, siz bunları canlı dizin aramasıyla zaten çözümlemediyseniz tam Matrix kullanıcı kimlikleri olmalıdır.
- `dm.sessionScope`: `per-user` (varsayılan) veya `per-room`. Aynı eş kullanıcı olsa bile her Matrix DM odasının ayrı bağlam tutmasını istiyorsanız `per-room` kullanın.
- `dm.threadReplies`: yalnızca DM için thread ilke override'ı (`off`, `inbound`, `always`). Hem yanıt yerleşimi hem de DM'lerde oturum yalıtımı için üst düzey `threadReplies` ayarını override eder.
- `execApprovals`: Matrix yerel exec onay teslimi (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` onaylayıcıları zaten tanımlıyorsa isteğe bağlıdır.
- `execApprovals.target`: `dm | channel | both` (varsayılan: `dm`).
- `accounts`: hesap başına adlandırılmış override'lar. Üst düzey `channels.matrix` değerleri bu girişler için varsayılan olarak davranır.
- `groups`: oda başına ilke eşlemesi. Oda kimliklerini veya takma adları tercih edin; çözümlenmemiş oda adları çalışma zamanında yok sayılır. Oturum/grup kimliği çözümlemeden sonra kararlı oda kimliğini kullanır.
- `groups.<room>.account`: çok hesaplı kurulumlarda devralınan bir oda girişini belirli bir Matrix hesabıyla sınırlar.
- `groups.<room>.allowBots`: yapılandırılmış bot gönderenler için oda düzeyi override (`true` veya `"mentions"`).
- `groups.<room>.users`: oda başına gönderen allowlist'i.
- `groups.<room>.tools`: oda başına araç izin/verme veya engelleme override'ları.
- `groups.<room>.autoReply`: oda düzeyi mention denetimi override'ı. `true`, o oda için mention gereksinimlerini devre dışı bırakır; `false`, bunları yeniden zorunlu kılar.
- `groups.<room>.skills`: isteğe bağlı oda düzeyi beceri filtresi.
- `groups.<room>.systemPrompt`: isteğe bağlı oda düzeyi sistem istemi parçacığı.
- `rooms`: `groups` için eski takma ad.
- `actions`: eylem başına araç denetimi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulama ve pairing akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention denetimi
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
