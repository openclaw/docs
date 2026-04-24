---
read_when:
    - OpenClaw içinde Matrix kurulumu
    - Matrix E2EE ve doğrulamasını yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-04-24T08:58:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix, OpenClaw için paketlenmiş bir kanal Plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, konuları, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Paketlenmiş Plugin

Matrix, güncel OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal paketlenmiş kurulumlarda ayrı bir yükleme gerekmez.

Eski bir yapı veya Matrix'i dışlayan özel bir kurulum kullanıyorsanız, manuel olarak yükleyin:

npm üzerinden yükleme:

```bash
openclaw plugins install @openclaw/matrix
```

Yerel bir checkout üzerinden yükleme:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin davranışı ve yükleme kuralları için [Plugins](/tr/tools/plugin) bölümüne bakın.

## Kurulum

1. Matrix Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri zaten bunu paketlenmiş olarak içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla manuel olarak ekleyebilir.
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

Matrix sihirbazı şunları sorar:

- homeserver URL'si
- kimlik doğrulama yöntemi: erişim belirteci veya parola
- kullanıcı kimliği (yalnızca parola ile kimlik doğrulama)
- isteğe bağlı cihaz adı
- E2EE'nin etkinleştirilip etkinleştirilmeyeceği
- oda erişimi ve davetle otomatik katılımın yapılandırılıp yapılandırılmayacağı

Sihirbazın temel davranışları:

- Matrix kimlik doğrulama ortam değişkenleri zaten mevcutsa ve bu hesabın kimlik doğrulaması yapılandırmada henüz kayıtlı değilse, sihirbaz kimlik doğrulamayı ortam değişkenlerinde tutmak için bir ortam değişkeni kısayolu sunar.
- Hesap adları hesap kimliğine normalleştirilir. Örneğin, `Ops Bot`, `ops-bot` olur.
- DM izin listesi girdileri `@user:server` değerini doğrudan kabul eder; görünen adlar yalnızca canlı dizin araması tam olarak bir eşleşme bulduğunda çalışır.
- Oda izin listesi girdileri oda kimliklerini ve takma adları doğrudan kabul eder. `!room:server` veya `#alias:server` tercih edin; çözümlenmemiş adlar izin listesi çözümlemesinde çalışma zamanında yok sayılır.
- Davetle otomatik katılımın izin listesi modunda yalnızca kararlı davet hedeflerini kullanın: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir.
- Kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` kullanın.

<Warning>
`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir.

Bunu ayarlamazsanız, bot davet edilen odalara veya yeni DM tarzı davetlere katılmaz; bu nedenle siz önce manuel olarak katılmadıkça yeni gruplarda veya davet edilen DM'lerde görünmez.

Hangi davetleri kabul edeceğini kısıtlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her davete katılmasını istiyorsanız `autoJoin: "always"` ayarlayın.

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

Belirteç tabanlı en küçük kurulum:

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
Burada önbelleğe alınmış kimlik bilgileri bulunduğunda, geçerli kimlik doğrulama doğrudan yapılandırmada ayarlı olmasa bile OpenClaw, kurulum, doctor ve kanal durumu keşfi için Matrix'i yapılandırılmış olarak kabul eder.

Ortam değişkeni karşılıkları (yapılandırma anahtarı ayarlı değilse kullanılır):

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

Normalleştirilmiş hesap kimliği `ops-bot` için şunları kullanın:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix, hesap kimliklerindeki noktalama işaretlerini, kapsamlı ortam değişkenlerini çakışmasız tutmak için kaçışlar.
Örneğin `-`, `_X2D_` olur; böylece `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşleşir.

Etkileşimli sihirbaz, bu kimlik doğrulama ortam değişkenleri zaten mevcut olduğunda ve seçilen hesap için yapılandırmada Matrix kimlik doğrulaması zaten kayıtlı olmadığında ortam değişkeni kısayolunu sunar.

`MATRIX_HOMESERVER`, çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Yapılandırma örneği

Bu, DM eşleştirme, oda izin listesi ve E2EE etkinleştirilmiş pratik bir temel yapılandırmadır:

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
davet anında davet edilen bir odayı DM mi yoksa grup mu olarak güvenilir biçimde sınıflandıramaz, bu yüzden tüm davetler önce
`autoJoin` üzerinden geçer. `dm.policy`, bot katıldıktan ve oda DM olarak sınıflandırıldıktan sonra uygulanır.

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır.

OpenClaw'ın tek bir canlı önizleme yanıtı göndermesini, model metin üretirken bu önizlemeyi yerinde düzenlemesini ve
yanıt bittiğinde bunu tamamlamasını istiyorsanız `channels.matrix.streaming` değerini `"partial"` olarak ayarlayın:

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
- `streaming: "partial"`, geçerli asistan bloğu için normal Matrix metin mesajları kullanarak düzenlenebilir bir önizleme mesajı oluşturur. Bu, Matrix'in eski önizleme-önce bildirim davranışını korur; dolayısıyla standart istemciler tamamlanmış blok yerine ilk akışlı önizleme metni için bildirim gösterebilir.
- `streaming: "quiet"`, geçerli asistan bloğu için düzenlenebilir sessiz bir önizleme bildirimi oluşturur. Bunu yalnızca tamamlanmış önizleme düzenlemeleri için alıcı push kurallarını da yapılandırdığınızda kullanın.
- `blockStreaming: true`, ayrı Matrix ilerleme mesajlarını etkinleştirir. Önizleme akışı etkinken Matrix, geçerli blok için canlı taslağı korur ve tamamlanan blokları ayrı mesajlar olarak saklar.
- Önizleme akışı açıkken ve `blockStreaming` kapalıyken Matrix canlı taslağı yerinde düzenler ve blok veya dönüş bittiğinde aynı olayı tamamlar.
- Önizleme artık tek bir Matrix olayına sığmazsa OpenClaw önizleme akışını durdurur ve normal son teslimata geri döner.
- Medya yanıtları yine ekleri normal şekilde gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Önizleme düzenlemeleri ek Matrix API çağrıları maliyeti getirir. En tutucu hız sınırı davranışını istiyorsanız akışı kapalı bırakın.

`blockStreaming`, tek başına taslak önizlemelerini etkinleştirmez.
Önizleme düzenlemeleri için `streaming: "partial"` veya `streaming: "quiet"` kullanın; ardından yalnızca tamamlanan asistan bloklarının ayrı ilerleme mesajları olarak görünür kalmasını da istiyorsanız `blockStreaming: true` ekleyin.

Özel push kuralları olmadan standart Matrix bildirimlerine ihtiyacınız varsa, önizleme-önce davranışı için `streaming: "partial"` kullanın veya yalnızca son teslimat için `streaming` değerini kapalı bırakın. `streaming: "off"` ile:

- `blockStreaming: true`, tamamlanan her bloğu normal bildirimli bir Matrix mesajı olarak gönderir.
- `blockStreaming: false`, yalnızca son tamamlanmış yanıtı normal bildirimli bir Matrix mesajı olarak gönderir.

### Sessiz tamamlanmış önizlemeler için self-hosted push kuralları

Sessiz akış (`streaming: "quiet"`), alıcılara yalnızca bir blok veya dönüş tamamlandığında bildirim gönderir — kullanıcı başına bir push kuralının tamamlanan önizleme işaretçisiyle eşleşmesi gerekir. Tam kurulum için [Sessiz önizlemeler için Matrix push kuralları](/tr/channels/matrix-push-rules) bölümüne bakın (alıcı belirteci, pusher kontrolü, kural kurulumu, homeserver başına notlar).

## Botlar arası odalar

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
- `allowBots: "mentions"`, bu mesajları yalnızca odalarda bu bottan görünür şekilde bahsettiklerinde kabul eder. DM'lere yine izin verilir.
- `groups.<room>.allowBots`, hesap düzeyindeki ayarı tek bir oda için geçersiz kılar.
- OpenClaw, kendi kendine yanıt döngülerini önlemek için yine aynı Matrix kullanıcı kimliğinden gelen mesajları yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw, "bot tarafından yazılmış" ifadesini "bu OpenClaw gateway'inde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak yorumlar.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken katı oda izin listeleri ve mention gereklilikleri kullanın.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda, giden görsel olayları `thumbnail_file` kullanır; böylece görsel önizlemeleri tam ek ile birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Yapılandırma gerekmez — Plugin E2EE durumunu otomatik olarak algılar.

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

Doğrulama komutları (`--verbose` tanılama için ve `--json` makine tarafından okunabilir çıktı için kullanılabilir):

| Komut                                                         | Amaç                                                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                               | Çapraz imzalama ve cihaz doğrulama durumunu kontrol eder                            |
| `openclaw matrix verify status --include-recovery-key --json` | Saklanan kurtarma anahtarını dahil eder                                             |
| `openclaw matrix verify bootstrap`                            | Çapraz imzalama ve doğrulamayı bootstrap eder (aşağıya bakın)                       |
| `openclaw matrix verify bootstrap --force-reset-cross-signing`| Geçerli çapraz imzalama kimliğini atar ve yeni bir tane oluşturur                   |
| `openclaw matrix verify device "<recovery-key>"`              | Bu cihazı bir kurtarma anahtarıyla doğrular                                         |
| `openclaw matrix verify backup status`                        | Oda anahtarı yedekleme sağlığını kontrol eder                                       |
| `openclaw matrix verify backup restore`                       | Oda anahtarlarını sunucu yedeğinden geri yükler                                     |
| `openclaw matrix verify backup reset --yes`                   | Geçerli yedeği siler ve yeni bir temel oluşturur (gizli depolamayı yeniden oluşturabilir) |

Çok hesaplı kurulumlarda, `--account <id>` geçmediğiniz sürece Matrix CLI komutları örtük Matrix varsayılan hesabını kullanır.
Birden çok adlandırılmış hesap yapılandırırsanız önce `channels.matrix.defaultAccount` ayarlayın; aksi halde bu örtük CLI işlemleri durur ve sizden açıkça bir hesap seçmenizi ister.
Doğrulama veya cihaz işlemlerinin açıkça adlandırılmış bir hesabı hedeflemesini istediğinizde `--account` kullanın:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Şifreleme kapalıysa veya adlandırılmış bir hesap için kullanılamıyorsa Matrix uyarıları ve doğrulama hataları o hesabın yapılandırma anahtarını işaret eder; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Doğrulanmış ne anlama gelir">
    OpenClaw bir cihazı yalnızca sizin kendi çapraz imzalama kimliğiniz onu imzaladığında doğrulanmış kabul eder. `verify status --verbose` üç güven sinyalini gösterir:

    - `Locally trusted`: yalnızca bu istemci tarafından güvenilir
    - `Cross-signing verified`: SDK çapraz imzalama yoluyla doğrulama bildiriyor
    - `Signed by owner`: sizin kendi self-signing anahtarınız tarafından imzalanmış

    `Verified by owner`, yalnızca çapraz imzalama veya sahip imzası mevcut olduğunda `yes` olur. Yalnızca yerel güven yeterli değildir.

  </Accordion>

  <Accordion title="Bootstrap ne yapar">
    `verify bootstrap`, şifreli hesaplar için onarım ve kurulum komutudur. Sırasıyla şunları yapar:

    - gizli depolamayı bootstrap eder, mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanır
    - çapraz imzalamayı bootstrap eder ve eksik açık çapraz imzalama anahtarlarını yükler
    - geçerli cihazı işaretler ve çapraz imzalar
    - henüz yoksa sunucu tarafında bir oda anahtarı yedeği oluşturur

    Homeserver çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa OpenClaw önce kimlik doğrulamasız dener, sonra `m.login.dummy`, sonra `m.login.password` dener (`channels.matrix.password` gerekir). `--force-reset-cross-signing` seçeneğini yalnızca geçerli kimliği bilerek atmak istediğinizde kullanın.

  </Accordion>

  <Accordion title="Yeni yedek temeli">
    Gelecekteki şifreli mesajların çalışmaya devam etmesini istiyor ve kurtarılamayan eski geçmişi kaybetmeyi kabul ediyorsanız:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Adlandırılmış bir hesabı hedeflemek için `--account <id>` ekleyin. Bu işlem, geçerli yedek sırrı güvenli şekilde yüklenemiyorsa gizli depolamayı da yeniden oluşturabilir.

  </Accordion>

  <Accordion title="Başlangıç davranışı">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz başka bir Matrix istemcisinde self-verification ister; yinelenenleri atlar ve bir bekleme süresi uygular. `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca geçerli gizli depolamayı ve çapraz imzalama kimliğini yeniden kullanan tutucu bir kripto bootstrap geçişi çalıştırır. Bootstrap durumu bozuksa OpenClaw `channels.matrix.password` olmadan bile korumalı bir onarım dener; homeserver parola UIA gerektiriyorsa başlangıç bir uyarı günlüğe yazar ve ölümcül olmaz. Zaten owner-signed olan cihazlar korunur.

    Tam yükseltme akışı için [Matrix geçişi](/tr/install/migrating-matrix) bölümüne bakın.

  </Accordion>

  <Accordion title="Doğrulama bildirimleri">
    Matrix, katı DM doğrulama odasına doğrulama yaşam döngüsü bildirimlerini `m.notice` mesajları olarak gönderir: istek, hazır durumu ("Verify by emoji" yönlendirmesiyle), başlatma/tamamlama ve mevcut olduğunda SAS (emoji/onluk) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik kabul edilir. Self-verification için OpenClaw SAS akışını otomatik olarak başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar — yine de Matrix istemcinizde karşılaştırıp "They match" seçeneğini onaylamanız gerekir.

    Doğrulama sistem bildirimleri ajan sohbet işlem hattına iletilmez.

  </Accordion>

  <Accordion title="Cihaz hijyeni">
    OpenClaw tarafından yönetilen eski cihazlar birikebilir. Listeleyin ve temizleyin:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kripto deposu">
    Matrix E2EE, IndexedDB shim olarak `fake-indexeddb` ile resmi `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` dosyasına kalıcı olarak yazılır (kısıtlayıcı dosya izinleriyle).

    Şifreli çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında yaşar ve sync store, crypto store, kurtarma anahtarı, IDB snapshot, konu bağlamaları ve başlangıç doğrulama durumunu içerir. Belirteç değiştiğinde ama hesap kimliği aynı kaldığında OpenClaw önceki durum görünür kalsın diye en iyi mevcut kökü yeniden kullanır.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçili hesap için Matrix self-profile değerini şu komutla güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istediğinizde `--account <id>` ekleyin.

Matrix `mxc://` avatar URL'lerini doğrudan kabul eder. `http://` veya `https://` bir avatar URL'si verdiğinizde OpenClaw önce bunu Matrix'e yükler ve çözümlenen `mxc://` URL'sini yeniden `channels.matrix.avatarUrl` içine (veya seçilen hesap geçersiz kılmasına) yazar.

## Konular

Matrix, hem otomatik yanıtlar hem de message tool gönderimleri için yerel Matrix konularını destekler.

- `dm.sessionScope: "per-user"` (varsayılan), Matrix DM yönlendirmesini gönderen kapsamlı tutar; böylece birden çok DM odası aynı eşe çözümlendiklerinde tek bir oturumu paylaşabilir.
- `dm.sessionScope: "per-room"`, normal DM kimlik doğrulaması ve izin listesi kontrollerini kullanmaya devam ederken her Matrix DM odasını kendi oturum anahtarına yalıtır.
- Açık Matrix konuşma bağlamaları yine de `dm.sessionScope` üzerinde önceliklidir; bu nedenle bağlı odalar ve konular seçtikleri hedef oturumu korur.
- `threadReplies: "off"`, yanıtları üst düzeyde tutar ve gelen konu içi mesajları üst oturumda bırakır.
- `threadReplies: "inbound"`, yalnızca gelen mesaj zaten o konudaysa konu içinde yanıt verir.
- `threadReplies: "always"`, oda yanıtlarını tetikleyen mesaja köklenen bir konuda tutar ve bu konuşmayı ilk tetikleyen mesajdan itibaren eşleşen konu kapsamlı oturum üzerinden yönlendirir.
- `dm.threadReplies`, yalnızca DM'ler için üst düzey ayarı geçersiz kılar. Örneğin odalardaki konuları yalıtılmış tutarken DM'leri düz tutabilirsiniz.
- Gelen konu içi mesajlar, konu kök mesajını ek ajan bağlamı olarak içerir.
- Message tool gönderimleri, açık bir `threadId` verilmedikçe hedef aynı oda veya aynı DM kullanıcı hedefiyse geçerli Matrix konusunu otomatik devralır.
- Aynı oturumda DM kullanıcı hedefini yeniden kullanma yalnızca geçerli oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi halde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- OpenClaw, bir Matrix DM odasının aynı paylaşılan Matrix DM oturumunda başka bir DM odasıyla çakıştığını gördüğünde, konu bağlamaları etkinse ve `dm.sessionScope` ipucu varsa o odaya `/focus` kaçış kapısıyla birlikte tek seferlik bir `m.notice` gönderir.
- Matrix için çalışma zamanı konu bağlamaları desteklenir. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve konuya bağlı `/acp spawn`, Matrix odaları ve DM'lerde çalışır.
- Üst düzey Matrix oda/DM `/focus`, `threadBindings.spawnSubagentSessions=true` olduğunda yeni bir Matrix konusu oluşturur ve bunu hedef oturuma bağlar.
- Var olan bir Matrix konusu içinde `/focus` veya `/acp spawn --thread here` çalıştırmak bunun yerine o geçerli konuyu bağlar.

## ACP konuşma bağlamaları

Matrix odaları, DM'ler ve mevcut Matrix konuları, sohbet yüzeyini değiştirmeden dayanıklı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut konu içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında, geçerli DM/oda sohbet yüzeyi olarak kalır ve sonraki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Var olan bir Matrix konusu içinde `--bind here`, o geçerli konuyu yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Notlar:

- `--bind here` bir alt Matrix konusu oluşturmaz.
- `threadBindings.spawnAcpSessions` yalnızca `/acp spawn --thread auto|here` için gereklidir; burada OpenClaw'ın bir alt Matrix konusu oluşturması veya bağlaması gerekir.

### Konu bağlama yapılandırması

Matrix genel varsayılanları `session.threadBindings` üzerinden devralır ve ayrıca kanal başına geçersiz kılmaları da destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix konuya bağlı oluşturma bayrakları isteğe bağlıdır:

- Üst düzey `/focus` komutunun yeni Matrix konuları oluşturup bağlamasına izin vermek için `threadBindings.spawnSubagentSessions: true` ayarlayın.
- `/acp spawn --thread auto|here` komutunun ACP oturumlarını Matrix konularına bağlamasına izin vermek için `threadBindings.spawnAcpSessions: true` ayarlayın.

## Tepkiler

Matrix, giden tepki eylemlerini, gelen tepki bildirimlerini ve gelen ack tepkilerini destekler.

- Giden tepki araçları `channels["matrix"].actions.reactions` ile geçitlenir.
- `react`, belirli bir Matrix olayına tepki ekler.
- `reactions`, belirli bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, bu olay üzerindeki bot hesabının kendi tepkilerini kaldırır.
- `remove: true`, yalnızca belirtilen emoji tepkisini bot hesabından kaldırır.

Ack tepkileri standart OpenClaw çözümleme sırasını kullanır:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- ajan kimliği emoji fallback'i

Ack tepki kapsamı şu sırayla çözülür:

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
- Tepki kaldırmaları bağımsız `m.reaction` kaldırmaları olarak değil redaction olarak yüzeye çıktığı için sistem olaylarına sentezlenmez.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı ajanı tetiklediğinde `InboundHistory` içine kaç son oda mesajının dahil edileceğini kontrol eder. `messages.groupChat.historyLimit` değerine geri düşer; ikisi de ayarlı değilse etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca oda içindir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen mesajlar içindir: OpenClaw henüz yanıt tetiklememiş oda mesajlarını arabelleğe alır, sonra bir mention veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine dahil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, alınan yanıt metni, konu kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi korunur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı izin listesi kontrolleri tarafından izin verilen gönderenlerle sınırlar.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır ama yine de açıkça alıntılanmış bir yanıtı korur.

Bu ayar, gelen mesajın kendisinin yanıt tetikleyip tetikleyemeyeceğini değil, ek bağlamın görünürlüğünü etkiler.
Tetikleme yetkilendirmesi yine `groupPolicy`, `groups`, `groupAllowFrom` ve DM politika ayarlarından gelir.

## DM ve oda politikası

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

Mention geçitlemesi ve izin listesi davranışı için [Gruplar](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinden sonra yeniden bir hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Eşleştirme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu senkron dışına çıkarsa OpenClaw, canlı DM yerine eski tek kişilik odaları işaret eden bayat `m.direct` eşlemeleriyle kalabilir. Bir eş için geçerli eşlemeyi şu komutla inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Bunu şu komutla onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Onarım akışı:

- önce, zaten `m.direct` içinde eşlenmiş olan sıkı 1:1 DM'yi tercih eder
- sonra, o kullanıcıyla şu anda katılmış olunan herhangi bir sıkı 1:1 DM'ye geri düşer
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Onarım akışı eski odaları otomatik olarak silmez. Yalnızca sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece yeni Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları yeniden doğru odayı hedefler.

## Yürütme onayları

Matrix, bir Matrix hesabı için yerel bir onay istemcisi olarak davranabilir. Yerel
DM/kanal yönlendirme düğmeleri yine yürütme onayı yapılandırması altında yaşar:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (isteğe bağlı; `channels.matrix.dm.allowFrom` değerine geri düşer)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Onaylayıcılar `@owner:example.org` gibi Matrix kullanıcı kimlikleri olmalıdır. `enabled` ayarlı değilse veya `"auto"` ise ve en az bir onaylayıcı çözümlenebiliyorsa Matrix yerel onayları otomatik etkinleştirir. Yürütme onayları önce `execApprovals.approvers` kullanır ve `channels.matrix.dm.allowFrom` değerine geri düşebilir. Plugin onayları `channels.matrix.dm.allowFrom` üzerinden yetkilendirilir. Matrix'i açıkça yerel onay istemcisi olarak devre dışı bırakmak için `enabled: false` ayarlayın. Aksi takdirde onay istekleri diğer yapılandırılmış onay yollarına veya onay fallback politikasına geri düşer.

Matrix yerel yönlendirmesi her iki onay türünü de destekler:

- `channels.matrix.execApprovals.*`, Matrix onay istemleri için yerel DM/kanal dağıtım modunu kontrol eder.
- Yürütme onayları, `execApprovals.approvers` veya `channels.matrix.dm.allowFrom` içindeki yürütme onaylayıcı kümesini kullanır.
- Plugin onayları, `channels.matrix.dm.allowFrom` içindeki Matrix DM izin listesini kullanır.
- Matrix tepki kısayolları ve mesaj güncellemeleri hem yürütme hem de Plugin onayları için geçerlidir.

Teslim kuralları:

- `target: "dm"`, onay istemlerini onaylayıcı DM'lerine gönderir
- `target: "channel"`, istemi kaynak Matrix odasına veya DM'ye geri gönderir
- `target: "both"`, onaylayıcı DM'lerine ve kaynak Matrix odasına veya DM'ye gönderir

Matrix onay istemleri, birincil onay mesajına tepki kısayolları ekler:

- `✅` = bir kez izin ver
- `❌` = reddet
- `♾️` = bu karar etkin yürütme politikası tarafından izin verildiğinde her zaman izin ver

Onaylayıcılar bu mesaja tepki verebilir veya fallback slash command'leri kullanabilir: `/approve <id> allow-once`, `/approve <id> allow-always` veya `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar izin verebilir veya reddedebilir. Yürütme onaylarında kanal teslimatı komut metnini içerir; bu yüzden `channel` veya `both` seçeneklerini yalnızca güvenilen odalarda etkinleştirin.

Hesap başına geçersiz kılma:

- `channels.matrix.accounts.<account>.execApprovals`

İlgili belgeler: [Yürütme onayları](/tr/tools/exec-approvals)

## Slash commands

Matrix slash command'leri (örneğin `/new`, `/reset`, `/model`) doğrudan DM'lerde çalışır. Odalarda OpenClaw ayrıca botun kendi Matrix mention'ı ile öneklenmiş slash command'leri de tanır; böylece `@bot:server /new`, özel bir mention regex'i gerektirmeden komut yolunu tetikler. Bu, kullanıcı botu komutu yazmadan önce sekme ile tamamladığında Element ve benzeri istemcilerin ürettiği oda tarzı `@mention /command` gönderilerine botun yanıt vermesini sağlar.

Yetkilendirme kuralları yine geçerlidir: komut gönderenlerin düz mesajlarda olduğu gibi DM veya oda izin listesi/sahip politikalarını karşılaması gerekir.

## Çok hesaplı

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

Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadıkça adlandırılmış hesaplar için varsayılan görevi görür.
Devralınan oda girdilerini tek bir Matrix hesabına `groups.<room>.account` ile kapsamlayabilirsiniz.
`account` içermeyen girdiler tüm Matrix hesapları arasında paylaşılmaya devam eder ve `account: "default"` içeren girdiler, varsayılan hesap doğrudan üst düzey `channels.matrix.*` üzerinde yapılandırıldığında da çalışmaya devam eder.
Kısmi paylaşılan kimlik doğrulama varsayılanları kendi başına ayrı bir örtük varsayılan hesap oluşturmaz. OpenClaw, üst düzey `default` hesabını yalnızca bu varsayılanın yeni kimlik doğrulaması varsa (`homeserver` artı `accessToken` veya `homeserver` artı `userId` ve `password`) sentezler; adlandırılmış hesaplar, önbelleğe alınmış kimlik bilgileri daha sonra kimlik doğrulamayı karşıladığında yine `homeserver` artı `userId` üzerinden keşfedilebilir kalabilir.
Matrix zaten tam olarak bir adlandırılmış hesaba sahipse veya `defaultAccount` mevcut bir adlandırılmış hesap anahtarını işaret ediyorsa, tek hesaptan çok hesaba onarım/kurulum terfisi yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları bu terfi edilen hesaba taşınır; paylaşılan teslim politikası anahtarları üst düzeyde kalır.
OpenClaw'ın örtük yönlendirme, yoklama ve CLI işlemleri için bir adlandırılmış Matrix hesabını tercih etmesini istiyorsanız `defaultAccount` ayarlayın.
Birden çok Matrix hesabı yapılandırılmışsa ve hesap kimliklerinden biri `default` ise, `defaultAccount` ayarlı olmasa bile OpenClaw bu hesabı örtük olarak kullanır.
Birden çok adlandırılmış hesap yapılandırıyorsanız `defaultAccount` ayarlayın veya örtük hesap seçimine dayanan CLI komutları için `--account <id>` geçin.
Bu örtük seçimi tek bir komut için geçersiz kılmak istediğinizde `openclaw matrix verify ...` ve `openclaw matrix devices ...` komutlarına `--account <id>` geçin.

Paylaşılan çok hesaplı desen için [Yapılandırma başvurusu](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'lar

Varsayılan olarak OpenClaw, siz
hesap başına açıkça izin vermedikçe SSRF koruması için özel/dahili Matrix homeserver'ları engeller.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir ana makine adı üzerinde çalışıyorsa,
o Matrix hesabı için `network.dangerouslyAllowPrivateNetwork` etkinleştirin:

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

Bu açık izin yalnızca güvenilen özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi
genel düz metin homeserver'lar engellenmeye devam eder. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden yönlendirme

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

Adlandırılmış hesaplar üst düzey varsayılanı `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
OpenClaw aynı proxy ayarını çalışma zamanı Matrix trafiği ve hesap durumu yoklamaları için kullanır.

## Hedef çözümleme

Matrix, OpenClaw sizden oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Canlı dizin araması oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, sonra o hesap için katılınmış oda adlarında aramaya geri düşer.
- Katılınmış oda adı araması best-effort çalışır. Bir oda adı kimliğe veya takma ada çözümlenemiyorsa çalışma zamanı izin listesi çözümlemesinde yok sayılır.

## Yapılandırma başvurusu

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı etiket.
- `defaultAccount`: birden çok Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu Matrix hesabının özel/dahili homeserver'lara bağlanmasına izin verir. Homeserver `localhost`, bir LAN/Tailscale IP'si veya `matrix-synapse` gibi dahili bir ana makineye çözümleniyorsa bunu etkinleştirin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Adlandırılmış hesaplar üst düzey varsayılanı kendi `proxy` değerleriyle geçersiz kılabilir.
- `userId`: tam Matrix kullanıcı kimliği, örneğin `@bot:example.org`.
- `accessToken`: belirteç tabanlı kimlik doğrulama için erişim belirteci. Düz metin değerleri ve SecretRef değerleri, env/file/exec sağlayıcıları genelinde `channels.matrix.accessToken` ve `channels.matrix.accounts.<id>.accessToken` için desteklenir. Bkz. [Gizli Bilgi Yönetimi](/tr/gateway/secrets).
- `password`: parola tabanlı giriş için parola. Düz metin değerleri ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile giriş için cihaz görünen adı.
- `avatarUrl`: profil senkronizasyonu ve `profile set` güncellemeleri için saklanan self-avatar URL'si.
- `initialSyncLimit`: başlangıç senkronizasyonunda alınan en yüksek olay sayısı.
- `encryption`: E2EE'yi etkinleştirir.
- `allowlistOnly`: `true` olduğunda `open` oda politikasını `allowlist`'e yükseltir ve `disabled` dışındaki tüm etkin DM politikalarını (`pairing` ve `open` dahil) `allowlist` olmaya zorlar. `disabled` politikalarını etkilemez.
- `allowBots`: yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen mesajlara izin verir (`true` veya `"mentions"`).
- `groupPolicy`: `open`, `allowlist` veya `disabled`.
- `contextVisibility`: ek oda bağlamı görünürlük modu (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: oda trafiği için kullanıcı kimlikleri izin listesi. Tam Matrix kullanıcı kimlikleri en güvenlisidir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi değiştiğinde çözümlenir. Çözümlenmeyen adlar yok sayılır.
- `historyLimit`: grup geçmişi bağlamı olarak dahil edilecek en yüksek oda mesajı sayısı. `messages.groupChat.historyLimit` değerine geri düşer; ikisi de ayarlı değilse etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- `replyToMode`: `off`, `first`, `all` veya `batched`.
- `markdown`: giden Matrix metni için isteğe bağlı Markdown oluşturma yapılandırması.
- `streaming`: `off` (varsayılan), `"partial"`, `"quiet"`, `true` veya `false`. `"partial"` ve `true`, normal Matrix metin mesajlarıyla önizleme-önce taslak güncellemelerini etkinleştirir. `"quiet"`, self-hosted push-rule kurulumları için bildirim vermeyen önizleme bildirimleri kullanır. `false`, `"off"` ile eşdeğerdir.
- `blockStreaming`: `true`, taslak önizleme akışı etkinken tamamlanan asistan blokları için ayrı ilerleme mesajlarını etkinleştirir.
- `threadReplies`: `off`, `inbound` veya `always`.
- `threadBindings`: konuya bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `startupVerification`: başlangıçta otomatik self-verification istek modu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: otomatik başlangıç doğrulama isteklerini yeniden denemeden önce beklenecek süre.
- `textChunkLimit`: karakter cinsinden giden mesaj parça boyutu (`chunkMode` değeri `length` olduğunda uygulanır).
- `chunkMode`: `length` mesajları karakter sayısına göre böler; `newline` satır sınırlarında böler.
- `responsePrefix`: bu kanal için tüm giden yanıtlara eklenecek isteğe bağlı dize.
- `ackReaction`: bu kanal/hesap için isteğe bağlı ack tepki geçersiz kılması.
- `ackReactionScope`: isteğe bağlı ack tepki kapsamı geçersiz kılması (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: gelen tepki bildirim modu (`own`, `off`).
- `mediaMaxMb`: giden gönderimler ve gelen medya işleme için MB cinsinden medya boyutu üst sınırı.
- `autoJoin`: davet otomatik katılım politikası (`always`, `allowlist`, `off`). Varsayılan: `off`. DM tarzı davetler dahil tüm Matrix davetlerine uygulanır.
- `autoJoinAllowlist`: `autoJoin` değeri `allowlist` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri davet işleme sırasında oda kimliklerine çözümlenir; OpenClaw, davet edilen odanın bildirdiği takma ad durumuna güvenmez.
- `dm`: DM politika bloğu (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw odaya katıldıktan ve onu DM olarak sınıflandırdıktan sonra DM erişimini kontrol eder. Bir davetin otomatik katılımla alınıp alınmayacağını değiştirmez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimlikleri izin listesi. Tam Matrix kullanıcı kimlikleri en güvenlisidir; tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi değiştiğinde çözümlenir. Çözümlenmeyen adlar yok sayılır.
- `dm.sessionScope`: `per-user` (varsayılan) veya `per-room`. Eş aynı olsa bile her Matrix DM odasının ayrı bağlam korumasını istiyorsanız `per-room` kullanın.
- `dm.threadReplies`: yalnızca DM için konu politikası geçersiz kılması (`off`, `inbound`, `always`). DM'lerde hem yanıt yerleşimi hem de oturum yalıtımı için üst düzey `threadReplies` ayarını geçersiz kılar.
- `execApprovals`: Matrix-yerel yürütme onayı teslimatı (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: yürütme isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` zaten onaylayıcıları belirliyorsa isteğe bağlıdır.
- `execApprovals.target`: `dm | channel | both` (varsayılan: `dm`).
- `accounts`: adlandırılmış hesap başına geçersiz kılmalar. Üst düzey `channels.matrix` değerleri bu girdiler için varsayılan görevi görür.
- `groups`: oda başına politika eşlemesi. Oda kimliklerini veya takma adları tercih edin; çözümlenmemiş oda adları çalışma zamanında yok sayılır. Çözümlemeden sonra oturum/grup kimliği kararlı oda kimliğini kullanır.
- `groups.<room>.account`: çok hesaplı kurulumlarda devralınmış tek bir oda girdisini belirli bir Matrix hesabıyla sınırlar.
- `groups.<room>.allowBots`: yapılandırılmış bot gönderenleri için oda düzeyi geçersiz kılma (`true` veya `"mentions"`).
- `groups.<room>.users`: oda başına gönderen izin listesi.
- `groups.<room>.tools`: oda başına araç izin/verme reddetme geçersiz kılmaları.
- `groups.<room>.autoReply`: oda düzeyi mention geçitleme geçersiz kılması. `true`, o oda için mention gerekliliklerini devre dışı bırakır; `false`, bunları yeniden zorunlu kılar.
- `groups.<room>.skills`: isteğe bağlı oda düzeyi Skills filtresi.
- `groups.<room>.systemPrompt`: isteğe bağlı oda düzeyi sistem istemi parçacığı.
- `rooms`: `groups` için eski takma ad.
- `actions`: eylem başına araç geçitlemesi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Kanal Yönlendirmesi](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
