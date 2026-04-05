---
read_when:
    - OpenClaw içinde Matrix kurma
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-04-05T13:47:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5c49ad2125d97adf66b5517f8409567eff8b86e20224a32fcb940a02cb0659
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix, OpenClaw için Matrix ile birlikte gelen kanal eklentisidir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, iş parçacıklarını, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Birlikte gelen eklenti

Matrix, mevcut OpenClaw sürümlerinde birlikte gelen bir eklenti olarak sunulur, bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Eski bir derleme kullanıyorsanız veya Matrix'i içermeyen özel bir kurulumunuz varsa,
elle yükleyin:

npm'den yükleyin:

```bash
openclaw plugins install @openclaw/matrix
```

Yerel bir checkout'tan yükleyin:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Eklenti davranışı ve kurulum kuralları için [Plugins](/tools/plugin) bölümüne bakın.

## Kurulum

1. Matrix eklentisinin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten birlikte sunar.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Homeserver'ınızda bir Matrix hesabı oluşturun.
3. `channels.matrix` değerini şu seçeneklerden biriyle yapılandırın:
   - `homeserver` + `accessToken`, veya
   - `homeserver` + `userId` + `password`.
4. Gateway'i yeniden başlatın.
5. Bot ile bir DM başlatın veya onu bir odaya davet edin.

Etkileşimli kurulum yolları:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix sihirbazının gerçekte sorduğu bilgiler:

- homeserver URL'si
- kimlik doğrulama yöntemi: erişim belirteci veya parola
- yalnızca parola kimlik doğrulamasını seçtiğinizde kullanıcı kimliği
- isteğe bağlı cihaz adı
- E2EE'nin etkinleştirilip etkinleştirilmeyeceği
- Matrix oda erişiminin şimdi yapılandırılıp yapılandırılmayacağı

Önemli sihirbaz davranışları:

- Seçilen hesap için Matrix kimlik doğrulama ortam değişkenleri zaten varsa ve o hesap için yapılandırmada kimlik doğrulama zaten kayıtlı değilse, sihirbaz bir ortam değişkeni kısayolu sunar ve bu hesap için yalnızca `enabled: true` yazar.
- Etkileşimli olarak başka bir Matrix hesabı eklediğinizde, girilen hesap adı yapılandırma ve ortam değişkenlerinde kullanılan hesap kimliğine normalize edilir. Örneğin, `Ops Bot`, `ops-bot` olur.
- DM allowlist istemleri tam `@user:server` değerlerini hemen kabul eder. Görünen adlar yalnızca canlı dizin araması tam bir eşleşme bulursa çalışır; aksi halde sihirbaz sizden tam bir Matrix kimliğiyle yeniden denemenizi ister.
- Oda allowlist istemleri oda kimliklerini ve takma adlarını doğrudan kabul eder. Ayrıca katılınmış oda adlarını canlı olarak çözümleyebilirler, ancak çözümlenmeyen adlar kurulum sırasında yalnızca girildiği gibi tutulur ve daha sonra çalışma zamanı allowlist çözümlemesi tarafından yok sayılır. `!room:server` veya `#alias:server` tercih edin.
- Çalışma zamanı oda/oturum kimliği kararlı Matrix oda kimliğini kullanır. Oda içinde tanımlanan takma adlar yalnızca arama girdisi olarak kullanılır; uzun vadeli oturum anahtarı veya kararlı grup kimliği olarak kullanılmaz.
- Oda adlarını kaydetmeden önce çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` kullanın.

En düşük düzeyde belirteç tabanlı kurulum:

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

Matrix önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` içinde saklar.
Varsayılan hesap `credentials.json` kullanır; adlandırılmış hesaplar `credentials-<account>.json` kullanır.

Ortam değişkeni eşdeğerleri (yapılandırma anahtarı ayarlı değilse kullanılır):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Varsayılan olmayan hesaplar için hesap kapsamlı ortam değişkenleri kullanın:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

`ops` hesabı için örnek:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Normalize edilmiş hesap kimliği `ops-bot` için şunları kullanın:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix, hesap kimliklerindeki noktalama işaretlerini kapsamlı ortam değişkenlerinde çakışma olmaması için kaçışlar.
Örneğin, `-` karakteri `_X2D_` olur, bu nedenle `ops-prod`, `MATRIX_OPS_X2D_PROD_*` biçimine eşlenir.

Etkileşimli sihirbaz yalnızca bu kimlik doğrulama ortam değişkenleri zaten mevcutsa ve seçilen hesap için Matrix kimlik doğrulaması yapılandırmaya zaten kaydedilmemişse ortam değişkeni kısayolunu sunar.

## Yapılandırma örneği

Bu, DM eşleştirme, oda allowlist'i ve E2EE etkinleştirilmiş pratik bir temel yapılandırmadır:

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

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır.

OpenClaw'ın tek bir taslak yanıt göndermesini,
model metin üretirken bu taslağı yerinde düzenlemesini ve ardından yanıt
tamamlandığında sonlandırmasını istiyorsanız `channels.matrix.streaming` değerini `"partial"` olarak ayarlayın:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` varsayılandır. OpenClaw son yanıtı bekler ve onu bir kez gönderir.
- `streaming: "partial"`, birden fazla kısmi mesaj göndermek yerine mevcut assistant bloğu için düzenlenebilir tek bir önizleme mesajı oluşturur.
- `blockStreaming: true` ayrı Matrix ilerleme mesajlarını etkinleştirir. `streaming: "partial"` ile Matrix, mevcut blok için canlı taslağı korur ve tamamlanan blokları ayrı mesajlar olarak muhafaza eder.
- `streaming: "partial"` etkin ve `blockStreaming` kapalıyken Matrix yalnızca canlı taslağı düzenler ve bu blok veya tur tamamlandığında tamamlanmış yanıtı bir kez gönderir.
- Önizleme artık tek bir Matrix olayına sığmazsa, OpenClaw önizleme akışını durdurur ve normal son teslimata geri döner.
- Medya yanıtları ekleri yine normal şekilde gönderir. Güvenli biçimde yeniden kullanılamayan eski bir önizleme varsa, OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Önizleme düzenlemeleri ek Matrix API çağrıları gerektirir. En temkinli hız sınırı davranışını istiyorsanız akışı kapalı bırakın.

`blockStreaming` tek başına taslak önizlemeleri etkinleştirmez.
Önizleme düzenlemeleri için `streaming: "partial"` kullanın; ardından tamamlanan assistant bloklarının ayrı ilerleme mesajları olarak da görünmesini istiyorsanız yalnızca `blockStreaming: true` ekleyin.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda, giden görüntü olayları `thumbnail_file` kullanır; böylece görüntü önizlemeleri tam ek ile birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Yapılandırma gerekmez — eklenti E2EE durumunu otomatik olarak algılar.

### Bottan bota odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Kasıtlı olarak aracılar arası Matrix trafiği istiyorsanız `allowBots` kullanın:

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
- `allowBots: "mentions"`, bu mesajları odalarda yalnızca bu bottan açıkça bahsettiklerinde kabul eder. DM'lere yine izin verilir.
- `groups.<room>.allowBots`, hesap düzeyindeki ayarı tek bir oda için geçersiz kılar.
- OpenClaw, kendi kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine yok sayar.
- Matrix burada yerel bir bot işareti sunmaz; OpenClaw, "bot tarafından yazılmış" ifadesini "bu OpenClaw gateway'inde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak ele alır.

Paylaşılan odalarda bottan bota trafiği etkinleştirirken sıkı oda allowlist'leri ve mention gereksinimleri kullanın.

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

Çapraz imzalama ve doğrulama durumunu bootstrap edin:

```bash
openclaw matrix verify bootstrap
```

Çoklu hesap desteği: hesap başına kimlik bilgileri ve isteğe bağlı `name` ile `channels.matrix.accounts` kullanın. Paylaşılan desen için [Yapılandırma referansı](/gateway/configuration-reference#multi-account-all-channels) bölümüne bakın.

Ayrıntılı bootstrap tanılaması:

```bash
openclaw matrix verify bootstrap --verbose
```

Bootstrap öncesinde yeni bir çapraz imzalama kimliğini zorla sıfırlayın:

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

Oda anahtarı yedekleme durumunu kontrol edin:

```bash
openclaw matrix verify backup status
```

Ayrıntılı yedekleme durumu tanılaması:

```bash
openclaw matrix verify backup status --verbose
```

Sunucu yedeğinden oda anahtarlarını geri yükleyin:

```bash
openclaw matrix verify backup restore
```

Ayrıntılı geri yükleme tanılaması:

```bash
openclaw matrix verify backup restore --verbose
```

Geçerli sunucu yedeğini silin ve yeni bir yedekleme temeli oluşturun. Saklanan
yedekleme anahtarı temiz biçimde yüklenemiyorsa, bu sıfırlama secret storage'ı da yeniden oluşturabilir; böylece
gelecekteki soğuk başlatmalar yeni yedekleme anahtarını yükleyebilir:

```bash
openclaw matrix verify backup reset --yes
```

Tüm `verify` komutları varsayılan olarak kısa çıktı verir (sessiz iç SDK günlükleri dahil) ve ayrıntılı tanılamayı yalnızca `--verbose` ile gösterir.
Betik yazarken tam makine tarafından okunabilir çıktı için `--json` kullanın.

Çoklu hesap kurulumlarında, Matrix CLI komutları `--account <id>` geçmediğiniz sürece örtük Matrix varsayılan hesabını kullanır.
Birden çok adlandırılmış hesap yapılandırırsanız, önce `channels.matrix.defaultAccount` ayarlayın; aksi takdirde bu örtük CLI işlemleri durur ve sizden açıkça bir hesap seçmenizi ister.
Doğrulama veya cihaz işlemlerinin belirli bir adlandırılmış hesabı açıkça hedeflemesini istediğinizde `--account` kullanın:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Şifreleme devre dışıysa veya adlandırılmış bir hesap için kullanılamıyorsa, Matrix uyarıları ve doğrulama hataları o hesabın yapılandırma anahtarını işaret eder; örneğin `channels.matrix.accounts.assistant.encryption`.

### "Doğrulandı" ne anlama gelir

OpenClaw, bu Matrix cihazını yalnızca kendi çapraz imzalama kimliğiniz tarafından doğrulandığında doğrulanmış kabul eder.
Pratikte, `openclaw matrix verify status --verbose` üç güven sinyali gösterir:

- `Locally trusted`: bu cihaz yalnızca mevcut istemci tarafından güvenilir kabul edilir
- `Cross-signing verified`: SDK, cihazın çapraz imzalama yoluyla doğrulandığını bildirir
- `Signed by owner`: cihaz, sizin kendi self-signing anahtarınız tarafından imzalanmıştır

`Verified by owner`, yalnızca çapraz imzalama doğrulaması veya sahip imzası mevcut olduğunda `yes` olur.
Yerel güven tek başına OpenClaw'ın cihazı tam doğrulanmış kabul etmesi için yeterli değildir.

### Bootstrap ne yapar

`openclaw matrix verify bootstrap`, şifrelenmiş Matrix hesapları için onarım ve kurulum komutudur.
Sırayla aşağıdakilerin tümünü yapar:

- secret storage'ı bootstrap eder, mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanır
- çapraz imzalamayı bootstrap eder ve eksik genel çapraz imzalama anahtarlarını yükler
- mevcut cihazı işaretlemeye ve çapraz imzalamaya çalışır
- henüz yoksa yeni bir sunucu taraflı oda anahtarı yedeği oluşturur

Homeserver, çapraz imzalama anahtarlarını yüklemek için etkileşimli kimlik doğrulama gerektiriyorsa, OpenClaw önce kimlik doğrulama olmadan, sonra `m.login.dummy` ile ve `channels.matrix.password` yapılandırılmışsa ardından `m.login.password` ile yüklemeyi dener.

Yalnızca mevcut çapraz imzalama kimliğini bilerek atmak ve yenisini oluşturmak istediğinizde `--force-reset-cross-signing` kullanın.

Mevcut oda anahtarı yedeğini bilerek atmak ve gelecekteki mesajlar için yeni
bir yedekleme temeli başlatmak istiyorsanız `openclaw matrix verify backup reset --yes` kullanın.
Bunu yalnızca kurtarılamayan eski şifreli geçmişin erişilemez kalacağını ve
OpenClaw'ın mevcut yedekleme sırrı güvenli şekilde yüklenemiyorsa secret storage'ı yeniden oluşturabileceğini kabul ediyorsanız yapın.

### Yeni yedekleme temeli

Gelecekteki şifreli mesajların çalışmaya devam etmesini istiyor ve kurtarılamayan eski geçmişi kaybetmeyi kabul ediyorsanız, bu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Belirli bir adlandırılmış Matrix hesabını açıkça hedeflemek istiyorsanız her komuta `--account <id>` ekleyin.

### Başlatma davranışı

`encryption: true` olduğunda, Matrix varsayılan olarak `startupVerification` değerini `"if-unverified"` yapar.
Başlatmada bu cihaz hâlâ doğrulanmamışsa, Matrix başka bir Matrix istemcisinde kendi kendini doğrulama isteğinde bulunur,
zaten beklemede olan bir istek varken yinelenen istekleri atlar ve yeniden başlatmalardan sonra tekrar denemeden önce yerel bir bekleme süresi uygular.
Başarısız istek denemeleri, varsayılan olarak başarılı istek oluşturmaya göre daha erken yeniden denenir.
Otomatik başlatma isteklerini devre dışı bırakmak için `startupVerification: "off"` ayarlayın veya daha kısa ya da daha uzun bir yeniden deneme penceresi istiyorsanız `startupVerificationCooldownHours` değerini ayarlayın.

Başlatma ayrıca otomatik olarak temkinli bir kripto bootstrap geçişi de yapar.
Bu geçiş önce mevcut secret storage ve çapraz imzalama kimliğini yeniden kullanmaya çalışır ve siz açık bir bootstrap onarım akışı çalıştırmadığınız sürece çapraz imzalamayı sıfırlamaktan kaçınır.

Başlatma bozuk bootstrap durumu bulursa ve `channels.matrix.password` yapılandırılmışsa, OpenClaw daha katı bir onarım yolu denemeye çalışabilir.
Mevcut cihaz zaten sahip tarafından imzalanmışsa, OpenClaw bu kimliği otomatik olarak sıfırlamak yerine korur.

Önceki herkese açık Matrix eklentisinden yükseltme:

- OpenClaw mümkün olduğunda aynı Matrix hesabını, erişim belirtecini ve cihaz kimliğini otomatik olarak yeniden kullanır.
- Uygulanabilir herhangi bir Matrix geçiş değişikliği çalıştırılmadan önce OpenClaw, `~/Backups/openclaw-migrations/` altında bir kurtarma anlık görüntüsü oluşturur veya yeniden kullanır.
- Birden çok Matrix hesabı kullanıyorsanız, OpenClaw'ın bu paylaşılan eski durumu hangi hesabın alacağını bilmesi için eski düz depolama düzeninden yükseltmeden önce `channels.matrix.defaultAccount` ayarlayın.
- Önceki eklenti yerel olarak bir Matrix oda anahtarı yedek çözme anahtarı sakladıysa, başlatma veya `openclaw doctor --fix` bunu yeni kurtarma anahtarı akışına otomatik olarak içe aktarır.
- Geçiş hazırlandıktan sonra Matrix erişim belirteci değiştiyse, başlatma artık otomatik yedek geri yüklemeden vazgeçmeden önce bekleyen eski geri yükleme durumu için kardeş belirteç karma depolama köklerini tarar.
- Matrix erişim belirteci daha sonra aynı hesap, homeserver ve kullanıcı için değişirse, OpenClaw artık boş bir Matrix durum dizininden başlamak yerine en eksiksiz mevcut belirteç karma depolama kökünü yeniden kullanmayı tercih eder.
- Sonraki gateway başlatmasında, yedeklenen oda anahtarları otomatik olarak yeni kripto deposuna geri yüklenir.
- Eski eklentide hiç yedeklenmemiş yalnızca yerel oda anahtarları varsa, OpenClaw açık biçimde uyarır. Bu anahtarlar önceki rust kripto deposundan otomatik olarak dışa aktarılamaz, bu nedenle bazı eski şifreli geçmişler elle kurtarılana kadar erişilemez kalabilir.
- Tam yükseltme akışı, sınırlamalar, kurtarma komutları ve yaygın geçiş mesajları için [Matrix migration](/install/migrating-matrix) bölümüne bakın.

Şifrelenmiş çalışma zamanı durumu, hesap başına, kullanıcı başına belirteç karma kökleri altında
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` içinde düzenlenir.
Bu dizin senkronizasyon deposunu (`bot-storage.json`), kripto deposunu (`crypto/`),
kurtarma anahtarı dosyasını (`recovery-key.json`), IndexedDB anlık görüntüsünü (`crypto-idb-snapshot.json`),
iş parçacığı bağlarını (`thread-bindings.json`) ve başlatma doğrulama durumunu (`startup-verification.json`)
bu özellikler kullanıldığında içerir.
Belirteç değişse ancak hesap kimliği aynı kalsa bile, OpenClaw bu hesap/homeserver/kullanıcı üçlüsü için
mevcut en iyi kökü yeniden kullanır; böylece önceki senkronizasyon durumu, kripto durumu, iş parçacığı bağları
ve başlatma doğrulama durumu görünür kalır.

### Node kripto deposu modeli

Bu eklentide Matrix E2EE, Node üzerinde resmi `matrix-js-sdk` Rust kripto yolunu kullanır.
Bu yol, kripto durumunun yeniden başlatmalardan sonra korunmasını istiyorsanız IndexedDB tabanlı kalıcı depolama bekler.

OpenClaw şu anda bunu Node içinde şu şekilde sağlar:

- SDK'nın beklediği IndexedDB API shim'i olarak `fake-indexeddb` kullanarak
- `initRustCrypto` öncesinde Rust kripto IndexedDB içeriğini `crypto-idb-snapshot.json` içinden geri yükleyerek
- güncellenmiş IndexedDB içeriğini init sonrasında ve çalışma zamanı sırasında tekrar `crypto-idb-snapshot.json` içine kalıcılaştırarak
- gateway çalışma zamanı kalıcılaştırması ile CLI bakımının aynı anlık görüntü dosyasında yarışmaması için anlık görüntü geri yükleme ve kalıcılaştırmayı `crypto-idb-snapshot.json` üzerinde öneriye dayalı bir dosya kilidiyle serileştirerek

Bu, özel bir kripto uygulaması değil, uyumluluk/depolama altyapısıdır.
Anlık görüntü dosyası hassas çalışma zamanı durumudur ve kısıtlayıcı dosya izinleriyle saklanır.
OpenClaw'ın güvenlik modeline göre, gateway ana bilgisayarı ve yerel OpenClaw durum dizini zaten güvenilen operatör sınırı içindedir; bu nedenle bu konu ayrı bir uzak güven sınırından çok öncelikle operasyonel dayanıklılık konusudur.

Planlanan iyileştirme:

- kurtarma anahtarları ve ilgili depo şifreleme sırları yalnızca yerel dosyalar yerine OpenClaw secret provider'larından alınabilsin diye kalıcı Matrix anahtar materyali için SecretRef desteği eklemek

## Profil yönetimi

Seçilen hesap için Matrix kendi profilini şu komutla güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Belirli bir adlandırılmış hesabı açıkça hedeflemek istiyorsanız `--account <id>` ekleyin.

Matrix `mxc://` avatar URL'lerini doğrudan kabul eder. `http://` veya `https://` avatar URL'si verdiğinizde, OpenClaw önce bunu Matrix'e yükler ve çözümlenen `mxc://` URL'sini tekrar `channels.matrix.avatarUrl` içine (veya seçili hesap geçersiz kılmasına) yazar.

## Otomatik doğrulama bildirimleri

Matrix artık doğrulama yaşam döngüsü bildirimlerini doğrudan katı DM doğrulama odasına `m.notice` mesajları olarak gönderir.
Buna şunlar dahildir:

- doğrulama isteği bildirimleri
- doğrulama hazır bildirimleri ("emoji ile doğrulayın" yönergesi açıkça verilerek)
- doğrulama başlatma ve tamamlama bildirimleri
- mevcut olduğunda SAS ayrıntıları (emoji ve ondalık)

Başka bir Matrix istemcisinden gelen doğrulama istekleri OpenClaw tarafından izlenir ve otomatik kabul edilir.
Kendi kendini doğrulama akışlarında OpenClaw, emoji doğrulaması kullanılabilir olduğunda SAS akışını da otomatik olarak başlatır ve kendi tarafını onaylar.
Başka bir Matrix kullanıcısı/cihazından gelen doğrulama isteklerinde OpenClaw isteği otomatik olarak kabul eder ve ardından SAS akışının normal şekilde ilerlemesini bekler.
Doğrulamayı tamamlamak için yine de Matrix istemcinizde emoji veya ondalık SAS değerini karşılaştırmanız ve orada "Eşleşiyorlar" onayını vermeniz gerekir.

OpenClaw kendi başlattığı yinelenen akışları körü körüne otomatik kabul etmez. Başlatma, bir kendi kendini doğrulama isteği zaten beklemedeyse yeni bir istek oluşturmayı atlar.

Doğrulama protokolü/sistem bildirimleri ajan sohbet hattına iletilmez, bu nedenle `NO_REPLY` üretmezler.

### Cihaz hijyeni

Eski OpenClaw tarafından yönetilen Matrix cihazları hesapta birikebilir ve şifreli oda güvenini anlamayı zorlaştırabilir.
Bunları şu komutla listeleyin:

```bash
openclaw matrix devices list
```

Eski OpenClaw yönetimli cihazları şu komutla kaldırın:

```bash
openclaw matrix devices prune-stale
```

### Direct Room Repair

Doğrudan mesaj durumu eşzamanlamadan çıktığında, OpenClaw canlı DM yerine eski tekil odaları işaret eden bayat `m.direct` eşlemeleriyle karşılaşabilir. Bir eş için mevcut eşlemeyi şu komutla inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Şu komutla onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Onarım, Matrix'e özgü mantığı eklenti içinde tutar:

- zaten `m.direct` içinde eşlenmiş olan katı 1:1 DM'yi tercih eder
- aksi halde o kullanıcıyla şu anda katılmış herhangi bir katı 1:1 DM'ye geri döner
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini ona işaret edecek şekilde yeniden yazar

Onarım akışı eski odaları otomatik olarak silmez. Yalnızca sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece yeni Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları yeniden doğru odayı hedefler.

## İş parçacıkları

Matrix hem otomatik yanıtlar hem de mesaj aracı gönderimleri için yerel Matrix iş parçacıklarını destekler.

- `threadReplies: "off"` yanıtları üst düzeyde tutar ve gelen iş parçacıklı mesajları üst oturumda tutar.
- `threadReplies: "inbound"` yalnızca gelen mesaj zaten o iş parçacığındaysa iş parçacığı içinde yanıt verir.
- `threadReplies: "always"` oda yanıtlarını tetikleyici mesajın kök aldığı bir iş parçacığında tutar ve bu konuşmayı ilk tetikleyici mesajdan itibaren eşleşen iş parçacığı kapsamlı oturum üzerinden yönlendirir.
- `dm.threadReplies`, yalnızca DM'ler için üst düzey ayarı geçersiz kılar. Örneğin, DM'leri düz tutarken oda iş parçacıklarını izole tutabilirsiniz.
- Gelen iş parçacıklı mesajlar ek ajan bağlamı olarak iş parçacığı kök mesajını içerir.
- Mesaj aracı gönderimleri, açık bir `threadId` verilmedikçe hedef aynı oda veya aynı DM kullanıcı hedefi olduğunda artık mevcut Matrix iş parçacığını otomatik devralır.
- Matrix için çalışma zamanı iş parçacığı bağları desteklenir. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn` artık Matrix odalarında ve DM'lerde çalışır.
- Üst düzey Matrix oda/DM `/focus`, `threadBindings.spawnSubagentSessions=true` olduğunda yeni bir Matrix iş parçacığı oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak bunun yerine mevcut iş parçacığını bağlar.

## ACP konuşma bağları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları sohbet yüzeyini değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında mevcut DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığı içinde `--bind here`, mevcut iş parçacığını yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağı kaldırır.

Notlar:

- `--bind here` alt bir Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnAcpSessions` yalnızca OpenClaw'ın alt bir Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` için gereklidir.

### İş Parçacığı Bağlama Yapılandırması

Matrix, genel varsayılanları `session.threadBindings` üzerinden devralır ve ayrıca kanal başına geçersiz kılmaları destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix iş parçacığına bağlı spawn bayrakları isteğe bağlıdır:

- Üst düzey `/focus` komutunun yeni Matrix iş parçacıkları oluşturup bağlamasına izin vermek için `threadBindings.spawnSubagentSessions: true` ayarlayın.
- `/acp spawn --thread auto|here` komutunun ACP oturumlarını Matrix iş parçacıklarına bağlamasına izin vermek için `threadBindings.spawnAcpSessions: true` ayarlayın.

## Tepkiler

Matrix giden tepki işlemlerini, gelen tepki bildirimlerini ve gelen ack tepkilerini destekler.

- Giden tepki araçları `channels["matrix"].actions.reactions` ile sınırlandırılır.
- `react`, belirli bir Matrix olayına tepki ekler.
- `reactions`, belirli bir Matrix olayı için mevcut tepki özetini listeler.
- `emoji=""`, bot hesabının o olay üzerindeki kendi tepkilerini kaldırır.
- `remove: true`, bot hesabından yalnızca belirtilen emoji tepkisini kaldırır.

Ack tepkileri standart OpenClaw çözümleme sırasını kullanır:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- ajan kimliği emoji geri dönüşü

Ack tepki kapsamı şu sırayla çözülür:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tepki bildirim modu şu sırayla çözülür:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- varsayılan: `own`

Geçerli davranış:

- `reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedeflediklerinde eklenen `m.reaction` olaylarını iletir.
- `reactionNotifications: "off"`, tepki sistem olaylarını devre dışı bırakır.
- Tepki kaldırmaları hâlâ sistem olaylarına dönüştürülmez çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaction olarak gösterir.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı ajanı tetiklediğinde `InboundHistory` olarak dahil edilen son oda mesajlarının sayısını kontrol eder.
- `messages.groupChat.historyLimit` değerine geri düşer. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca oda içindir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen mesajları içerir: OpenClaw henüz yanıt tetiklememiş oda mesajlarını tamponlar, ardından bir mention veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Mevcut tetikleyici mesaj `InboundHistory` içine dahil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, alınan yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı allowlist kontrolleri tarafından izin verilen gönderenlerle sınırlar.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de açıkça alıntılanmış tek bir yanıtı korur.

Bu ayar ek bağlam görünürlüğünü etkiler; gelen mesajın kendisinin yanıt tetikleyip tetikleyemeyeceğini etkilemez.
Tetikleme yetkilendirmesi hâlâ `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilke ayarlarından gelir.

## DM ve oda ilke örneği

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

Mention kısıtlaması ve allowlist davranışı için [Groups](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onay öncesinde size mesaj göndermeye devam ederse, OpenClaw yeni bir kod üretmek yerine aynı bekleyen eşleştirme kodunu yeniden kullanır ve kısa bir bekleme süresinden sonra yeniden hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Pairing](/tr/channels/pairing) bölümüne bakın.

## Exec onayları

Matrix, bir Matrix hesabı için exec onay istemcisi olarak çalışabilir.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (isteğe bağlı; `channels.matrix.dm.allowFrom` değerine geri düşer)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Onaylayıcılar `@owner:example.org` gibi Matrix kullanıcı kimlikleri olmalıdır. Matrix, `enabled` ayarlanmamışsa veya `"auto"` ise ve `execApprovals.approvers` ya da `channels.matrix.dm.allowFrom` içinden en az bir onaylayıcı çözümlenebiliyorsa yerel exec onaylarını otomatik olarak etkinleştirir. Matrix'i yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi halde onay istekleri diğer yapılandırılmış onay yollarına veya exec onayı geri dönüş ilkesine geri döner.

Yerel Matrix yönlendirmesi bugün yalnızca exec içindir:

- `channels.matrix.execApprovals.*`, yalnızca exec onayları için yerel DM/kanal yönlendirmesini denetler.
- Eklenti onayları hâlâ paylaşılan aynı sohbet içi `/approve` ile birlikte yapılandırılmış herhangi bir `approvals.plugin` yönlendirmesini kullanır.
- Matrix, onaylayıcıları güvenli biçimde çıkarabildiğinde eklenti onayı yetkilendirmesi için `channels.matrix.dm.allowFrom` değerini yine kullanabilir, ancak ayrı bir yerel eklenti onayı DM/kanal dağıtım yolu sunmaz.

Teslim kuralları:

- `target: "dm"` onay istemlerini onaylayıcı DM'lerine gönderir
- `target: "channel"` istemi kaynak Matrix oda veya DM'sine geri gönderir
- `target: "both"` istemleri onaylayıcı DM'lerine ve kaynak Matrix oda veya DM'sine gönderir

Matrix bugün metin tabanlı onay istemleri kullanır. Onaylayıcılar bunları `/approve <id> allow-once`, `/approve <id> allow-always` veya `/approve <id> deny` ile çözer.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Kanal teslimi komut metnini içerir, bu nedenle `channel` veya `both` seçeneklerini yalnızca güvenilen odalarda etkinleştirin.

Matrix onay istemleri paylaşılan çekirdek onay planlayıcısını yeniden kullanır. Matrix'e özgü yerel yüzey, exec onayları için yalnızca taşıma katmanıdır: oda/DM yönlendirmesi ve mesaj gönderme/güncelleme/silme davranışı.

Hesap başına geçersiz kılma:

- `channels.matrix.accounts.<account>.execApprovals`

İlgili belgeler: [Exec approvals](/tools/exec-approvals)

## Çoklu hesap örneği

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

Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadığı sürece adlandırılmış hesaplar için varsayılan olarak davranır.
Devralınan oda girdilerini bir Matrix hesabıyla sınırlamak için `groups.<room>.account` (veya eski `rooms.<room>.account`) kullanabilirsiniz.
`account` içermeyen girdiler tüm Matrix hesapları arasında paylaşımlı kalır ve `account: "default"` olan girdiler, varsayılan hesap doğrudan üst düzey `channels.matrix.*` üzerinde yapılandırıldığında yine çalışır.
Kısmi paylaşılan kimlik doğrulama varsayılanları tek başına ayrı bir örtük varsayılan hesap oluşturmaz. OpenClaw üst düzey `default` hesabı yalnızca bu varsayılan hesapta yeni kimlik doğrulama varsa sentezler (`homeserver` artı `accessToken` veya `homeserver` artı `userId` ve `password`); adlandırılmış hesaplar daha sonra önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı sağladığında `homeserver` artı `userId` üzerinden yine keşfedilebilir kalabilir.
Matrix'te zaten tam olarak bir adlandırılmış hesap varsa veya `defaultAccount` mevcut bir adlandırılmış hesap anahtarını işaret ediyorsa, tek hesaplıdan çok hesaplıya onarım/kurulum yükseltmesi yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları bu yükseltilmiş hesaba taşınır; paylaşılan teslim ilkesi anahtarları üst düzeyde kalır.
OpenClaw'ın örtük yönlendirme, probe ve CLI işlemleri için bir adlandırılmış Matrix hesabını tercih etmesini istiyorsanız `defaultAccount` ayarlayın.
Birden çok adlandırılmış hesap yapılandırırsanız, örtük hesap seçimine dayanan CLI komutları için `defaultAccount` ayarlayın veya `--account <id>` geçin.
Bir komut için bu örtük seçimi geçersiz kılmak istediğinizde `openclaw matrix verify ...` ve `openclaw matrix devices ...` komutlarına `--account <id>` geçin.

## Özel/LAN homeserver'lar

Varsayılan olarak OpenClaw, SSRF koruması için özel/iç Matrix homeserver'larını engeller;
buna hesap bazında açıkça izin vermeniz gerekir.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir ana bilgisayar adı üzerinde çalışıyorsa,
o Matrix hesabı için `allowPrivateNetwork` etkinleştirin:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
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

Bu isteğe bağlı izin yalnızca güvenilen özel/iç hedeflere izin verir. Şu gibi herkese açık düz metin homeserver'lar
`http://matrix.example.org:8008` yine engellenir. Mümkün olduğunda `https://` tercih edin.

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

Adlandırılmış hesaplar üst düzey varsayılanı `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
OpenClaw aynı proxy ayarını çalışma zamanı Matrix trafiği ve hesap durum probe'ları için kullanır.

## Hedef çözümleme

Matrix, OpenClaw sizden bir oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Canlı dizin araması oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları o homeserver'daki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, ardından o hesap için katılınmış oda adlarında aramaya geri döner.
- Katılınmış oda adı araması en iyi çaba esaslıdır. Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa, çalışma zamanı allowlist çözümlemesi tarafından yok sayılır.

## Yapılandırma referansı

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı etiket.
- `defaultAccount`: birden çok Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `allowPrivateNetwork`: bu Matrix hesabının özel/iç homeserver'lara bağlanmasına izin verir. Homeserver `localhost`, bir LAN/Tailscale IP'si veya `matrix-synapse` gibi dahili bir ana bilgisayara çözümleniyorsa bunu etkinleştirin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Adlandırılmış hesaplar üst düzey varsayılanı kendi `proxy` değerleriyle geçersiz kılabilir.
- `userId`: tam Matrix kullanıcı kimliği, örneğin `@bot:example.org`.
- `accessToken`: belirteç tabanlı kimlik doğrulama için erişim belirteci. Düz metin değerler ve SecretRef değerleri, env/file/exec provider'ları genelinde `channels.matrix.accessToken` ve `channels.matrix.accounts.<id>.accessToken` için desteklenir. Bkz. [Secrets Management](/gateway/secrets).
- `password`: parola tabanlı giriş için parola. Düz metin değerler ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile giriş için cihaz görünen adı.
- `avatarUrl`: profil eşitlemesi ve `set-profile` güncellemeleri için saklanan kendi avatar URL'si.
- `initialSyncLimit`: başlatma eşitleme olay sınırı.
- `encryption`: E2EE'yi etkinleştirir.
- `allowlistOnly`: DM'ler ve odalar için yalnızca allowlist davranışını zorlar.
- `allowBots`: diğer yapılandırılmış OpenClaw Matrix hesaplarından gelen mesajlara izin verir (`true` veya `"mentions"`).
- `groupPolicy`: `open`, `allowlist` veya `disabled`.
- `contextVisibility`: ek oda bağlamı görünürlük modu (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: oda trafiği için kullanıcı kimliği allowlist'i.
- `groupAllowFrom` girdileri tam Matrix kullanıcı kimlikleri olmalıdır. Çözümlenmemiş adlar çalışma zamanında yok sayılır.
- `historyLimit`: grup geçmişi bağlamına dahil edilecek en fazla oda mesajı. `messages.groupChat.historyLimit` değerine geri düşer. Devre dışı bırakmak için `0` ayarlayın.
- `replyToMode`: `off`, `first` veya `all`.
- `markdown`: giden Matrix metni için isteğe bağlı Markdown işleme yapılandırması.
- `streaming`: `off` (varsayılan), `partial`, `true` veya `false`. `partial` ve `true`, yerinde düzenleme güncellemeleriyle tek mesajlı taslak önizlemelerini etkinleştirir.
- `blockStreaming`: `true`, taslak önizleme akışı etkinken tamamlanmış assistant blokları için ayrı ilerleme mesajlarını etkinleştirir.
- `threadReplies`: `off`, `inbound` veya `always`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirme ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `startupVerification`: başlatmada otomatik kendi kendini doğrulama isteği modu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: otomatik başlatma doğrulama isteklerini yeniden denemeden önce bekleme süresi.
- `textChunkLimit`: giden mesaj parça boyutu.
- `chunkMode`: `length` veya `newline`.
- `responsePrefix`: giden yanıtlar için isteğe bağlı mesaj öneki.
- `ackReaction`: bu kanal/hesap için isteğe bağlı ack tepki geçersiz kılması.
- `ackReactionScope`: isteğe bağlı ack tepki kapsamı geçersiz kılması (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: gelen tepki bildirim modu (`own`, `off`).
- `mediaMaxMb`: Matrix medya işleme için MB cinsinden medya boyut sınırı. Giden gönderimlere ve gelen medya işlemeye uygulanır.
- `autoJoin`: davet otomatik katılım ilkesi (`always`, `allowlist`, `off`). Varsayılan: `off`.
- `autoJoinAllowlist`: `autoJoin`, `allowlist` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri davet işleme sırasında oda kimliklerine çözülür; OpenClaw davet edilen oda tarafından iddia edilen takma ad durumuna güvenmez.
- `dm`: DM ilke bloğu (`enabled`, `policy`, `allowFrom`, `threadReplies`).
- `dm.allowFrom` girdileri, onları zaten canlı dizin aramasıyla çözümlemediyseniz tam Matrix kullanıcı kimlikleri olmalıdır.
- `dm.threadReplies`: yalnızca DM için iş parçacığı ilke geçersiz kılması (`off`, `inbound`, `always`). Hem yanıt yerleşimi hem de DM'lerde oturum yalıtımı için üst düzey `threadReplies` ayarını geçersiz kılar.
- `execApprovals`: Matrix-yerel exec onay teslimi (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` zaten onaylayıcıları belirliyorsa isteğe bağlıdır.
- `execApprovals.target`: `dm | channel | both` (varsayılan: `dm`).
- `accounts`: hesap başına adlandırılmış geçersiz kılmalar. Üst düzey `channels.matrix` değerleri bu girdiler için varsayılan olarak davranır.
- `groups`: oda başına ilke haritası. Oda kimliklerini veya takma adları tercih edin; çözümlenmemiş oda adları çalışma zamanında yok sayılır. Oturum/grup kimliği çözümlemeden sonra kararlı oda kimliğini kullanırken, insan tarafından okunabilir etiketler yine oda adlarından gelir.
- `groups.<room>.account`: çoklu hesap kurulumlarında devralınan tek bir oda girdisini belirli bir Matrix hesabıyla sınırlar.
- `groups.<room>.allowBots`: yapılandırılmış bot göndericileri için oda düzeyinde geçersiz kılma (`true` veya `"mentions"`).
- `groups.<room>.users`: oda başına gönderici allowlist'i.
- `groups.<room>.tools`: oda başına araç izin/verme veya engelleme geçersiz kılmaları.
- `groups.<room>.autoReply`: oda düzeyinde mention kısıtlaması geçersiz kılması. `true`, o oda için mention gereksinimlerini devre dışı bırakır; `false` bunları yeniden zorunlu kılar.
- `groups.<room>.skills`: isteğe bağlı oda düzeyinde beceri filtresi.
- `groups.<room>.systemPrompt`: isteğe bağlı oda düzeyinde system prompt parçacığı.
- `rooms`: `groups` için eski takma ad.
- `actions`: işlem başına araç geçitleme (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention kısıtlaması
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/gateway/security) — erişim modeli ve sertleştirme
