---
read_when:
    - OpenClaw içinde Matrix kurma
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-04-26T11:23:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix, OpenClaw için paketlenmiş bir kanal Plugin'idir.
Resmî `matrix-js-sdk` kullanır ve DM'leri, odaları, iş parçacıklarını, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Paketlenmiş Plugin

Matrix, güncel OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemedeyseniz veya Matrix'i dışlayan özel bir kurulum kullanıyorsanız, elle yükleyin:

npm'den yükleyin:

```bash
openclaw plugins install @openclaw/matrix
```

Yerel bir checkout'tan yükleyin:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin davranışı ve kurulum kuralları için bkz. [Plugins](/tr/tools/plugin).

## Kurulum

1. Matrix Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten paketlenmiş olarak içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
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
- kimlik doğrulama yöntemi: access token veya password
- kullanıcı kimliği (`user ID`) (yalnızca password ile kimlik doğrulama)
- isteğe bağlı cihaz adı
- E2EE'nin etkinleştirilip etkinleştirilmeyeceği
- oda erişimi ve davetlerde otomatik katılımın yapılandırılıp yapılandırılmayacağı

Sihirbazın temel davranışları:

- Matrix kimlik doğrulama ortam değişkenleri zaten varsa ve bu hesap için yapılandırmada hâlihazırda kaydedilmiş kimlik doğrulama yoksa, sihirbaz kimlik doğrulamayı ortam değişkenlerinde tutmak için bir env kısayolu sunar.
- Hesap adları hesap kimliğine normalleştirilir. Örneğin, `Ops Bot`, `ops-bot` olur.
- DM allowlist girdileri `@user:server` biçimini doğrudan kabul eder; görünen adlar yalnızca canlı dizin araması tam olarak bir eşleşme bulursa çalışır.
- Oda allowlist girdileri oda kimliklerini ve takma adları doğrudan kabul eder. `!room:server` veya `#alias:server` tercih edin; çözümlenmemiş adlar allowlist çözümlemesi sırasında çalışma anında yok sayılır.
- Davetlerde otomatik katılımın allowlist modunda yalnızca kararlı davet hedeflerini kullanın: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir.
- Kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` kullanın.

<Warning>
`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir.

Bunu ayarlamazsanız bot davet edilen odalara veya yeni DM tarzı davetlere katılmaz; dolayısıyla siz önce elle katılmadıkça yeni gruplarda veya davet edilen DM'lerde görünmez.

Kabul edeceği davetleri sınırlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her davete katılmasını istiyorsanız `autoJoin: "always"` ayarlayın.

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

En az yapılandırmayla token tabanlı kurulum:

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

Password tabanlı kurulum (girişten sonra token önbelleğe alınır):

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
Önbelleğe alınmış kimlik bilgileri burada mevcut olduğunda, geçerli kimlik doğrulama doğrudan yapılandırmada ayarlı olmasa bile OpenClaw, kurulum, doctor ve kanal durumu keşfi için Matrix'i yapılandırılmış kabul eder.

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

Normalleştirilmiş hesap kimliği `ops-bot` için şunları kullanın:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix, hesap kimliklerindeki noktalama işaretlerini, hesap kapsamlı ortam değişkenlerinin çakışmasız kalması için kaçışlar.
Örneğin `-`, `_X2D_` olur; dolayısıyla `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşlenir.

Etkileşimli sihirbaz, yalnızca bu kimlik doğrulama ortam değişkenleri zaten mevcutsa ve seçilen hesap için yapılandırmada Matrix kimlik doğrulaması henüz kaydedilmemişse env-var kısayolunu sunar.

`MATRIX_HOMESERVER`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Workspace `.env` files](/tr/gateway/security).

## Yapılandırma örneği

Bu, DM eşleştirmesi, oda allowlist'i ve E2EE etkinleştirilmiş pratik bir temel yapılandırmadır:

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

`autoJoin`, DM tarzı davetler dâhil tüm Matrix davetlerine uygulanır. OpenClaw, davet anında davet edilen bir odayı DM mi yoksa grup mu diye güvenilir şekilde sınıflandıramaz; bu nedenle tüm davetler önce `autoJoin` üzerinden geçer. `dm.policy`, bot katıldıktan ve oda DM olarak sınıflandırıldıktan sonra uygulanır.

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır.

OpenClaw'un tek bir canlı önizleme yanıtı göndermesini, model metin üretirken bu önizlemeyi yerinde düzenlemesini ve yanıt tamamlandığında sonlandırmasını istiyorsanız `channels.matrix.streaming` değerini `"partial"` olarak ayarlayın:

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
- `streaming: "partial"`, geçerli asistan bloğu için normal Matrix metin mesajlarını kullanarak düzenlenebilir tek bir önizleme mesajı oluşturur. Bu, Matrix'in eski önizleme-önce bildirim davranışını korur; bu nedenle standart istemciler tamamlanmış blok yerine ilk akış önizleme metni için bildirim gönderebilir.
- `streaming: "quiet"`, geçerli asistan bloğu için düzenlenebilir tek bir sessiz önizleme bildirimi oluşturur. Bunu yalnızca sonlandırılmış önizleme düzenlemeleri için alıcı push kurallarını da yapılandırdığınızda kullanın.
- `blockStreaming: true`, ayrı Matrix ilerleme mesajlarını etkinleştirir. Önizleme akışı etkinleştirildiğinde Matrix, geçerli blok için canlı taslağı korur ve tamamlanmış blokları ayrı mesajlar olarak saklar.
- Önizleme akışı açıkken ve `blockStreaming` kapalıyken Matrix canlı taslağı yerinde düzenler ve blok veya tur tamamlandığında aynı olayı sonlandırır.
- Önizleme artık tek bir Matrix olayına sığmazsa OpenClaw önizleme akışını durdurur ve normal son teslimata geri döner.
- Medya yanıtları ekleri normal şekilde göndermeye devam eder. Bayat bir önizleme artık güvenle yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En muhafazakâr hız sınırı davranışını istiyorsanız akışı kapalı bırakın.

`blockStreaming`, taslak önizlemeleri tek başına etkinleştirmez.
Önizleme düzenlemeleri için `streaming: "partial"` veya `streaming: "quiet"` kullanın; ardından yalnızca tamamlanmış asistan bloklarının ayrı ilerleme mesajları olarak görünür kalmasını da istiyorsanız `blockStreaming: true` ekleyin.

Özel push kuralları olmadan standart Matrix bildirimlerine ihtiyacınız varsa önizleme-önce davranışı için `streaming: "partial"` kullanın veya yalnızca son teslimat için `streaming` değerini kapalı bırakın. `streaming: "off"` ile:

- `blockStreaming: true`, tamamlanan her bloğu normal bildirim gönderen bir Matrix mesajı olarak yollar.
- `blockStreaming: false`, yalnızca son tamamlanmış yanıtı normal bildirim gönderen bir Matrix mesajı olarak yollar.

### Sessiz sonlandırılmış önizlemeler için self-hosted push kuralları

Sessiz akış (`streaming: "quiet"`), alıcılara yalnızca bir blok veya tur sonlandırıldığında bildirim gönderir — kullanıcı başına bir push kuralının sonlandırılmış önizleme işaretçisiyle eşleşmesi gerekir. Tam kurulum için (alıcı token'ı, pusher kontrolü, kural kurulumu, homeserver başına notlar) bkz. [Matrix push rules for quiet previews](/tr/channels/matrix-push-rules).

## Bottan bota odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Bilerek ajanlar arası Matrix trafiği istediğinizde `allowBots` kullanın:

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
- `allowBots: "mentions"`, bu mesajları odalarda yalnızca görünür şekilde bu bottan bahsedildiğinde kabul eder. DM'lere yine izin verilir.
- `groups.<room>.allowBots`, tek bir oda için hesap düzeyindeki ayarı geçersiz kılar.
- OpenClaw, kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine de yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw, "bot tarafından yazılmış" ifadesini "bu OpenClaw gateway üzerinde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak yorumlar.

Paylaşılan odalarda bottan bota trafiği etkinleştirirken katı oda allowlist'leri ve mention gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda giden görsel olayları `thumbnail_file` kullanır; böylece görsel önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Hiçbir yapılandırma gerekmez — Plugin E2EE durumunu otomatik olarak algılar.

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

Doğrulama komutları (tanılama için tümü `--verbose`, makine tarafından okunabilir çıktı için `--json` alır):

```bash
openclaw matrix verify status
```

Ayrıntılı durum (tam tanılama):

```bash
openclaw matrix verify status --verbose
```

Saklanan recovery key'i makine tarafından okunabilir çıktıya dâhil et:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-signing ve doğrulama durumunu bootstrap et:

```bash
openclaw matrix verify bootstrap
```

Ayrıntılı bootstrap tanılaması:

```bash
openclaw matrix verify bootstrap --verbose
```

Bootstrap etmeden önce yeni bir cross-signing kimliği sıfırlamayı zorla:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Bu cihazı bir recovery key ile doğrula:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Bu komut üç ayrı durumu bildirir:

- `Recovery key accepted`: Matrix, recovery key'i secret storage veya cihaz güveni için kabul etti.
- `Backup usable`: oda anahtarı yedeği güvenilir recovery materyaliyle yüklenebilir.
- `Device verified by owner`: geçerli OpenClaw cihazı tam Matrix cross-signing kimlik güvenine sahiptir.

Ayrıntılı veya JSON çıktısındaki `Signed by owner` yalnızca tanılama amaçlıdır. OpenClaw, `Cross-signing verified` de `yes` olmadığı sürece bunu yeterli kabul etmez.

Komut, recovery key yedek materyalini açabilse bile tam Matrix kimlik güveni tamamlanmamışsa yine de sıfır dışı kodla çıkar. Bu durumda başka bir Matrix istemcisinden self-verification işlemini tamamlayın:

```bash
openclaw matrix verify self
```

İsteği başka bir Matrix istemcisinde kabul edin, SAS emoji'lerini veya ondalık sayıları karşılaştırın ve yalnızca eşleşiyorlarsa `yes` yazın. Komut, Matrix `Cross-signing verified: yes` bildirmeden başarıyla çıkmaz.

`verify bootstrap --force-reset-cross-signing` seçeneğini yalnızca geçerli cross-signing kimliğini bilerek değiştirmek istediğinizde kullanın.

Ayrıntılı cihaz doğrulama ayrıntıları:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Oda anahtarı yedeğinin sağlığını denetleyin:

```bash
openclaw matrix verify backup status
```

Ayrıntılı yedek sağlık tanılaması:

```bash
openclaw matrix verify backup status --verbose
```

Oda anahtarlarını sunucu yedeğinden geri yükleyin:

```bash
openclaw matrix verify backup restore
```

Yedek anahtarı henüz diskte yüklü değilse Matrix recovery key'ini verin:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

Etkileşimli self-verification akışı:

```bash
openclaw matrix verify self
```

Daha düşük seviye veya gelen doğrulama istekleri için şunu kullanın:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Bir isteği iptal etmek için `openclaw matrix verify cancel <id>` kullanın.

Ayrıntılı geri yükleme tanılaması:

```bash
openclaw matrix verify backup restore --verbose
```

Geçerli sunucu yedeğini silin ve yeni bir yedek temel durumu oluşturun. Saklanan yedek anahtarı temiz biçimde yüklenemiyorsa bu sıfırlama, gelecekteki soğuk başlangıçların yeni yedek anahtarını yükleyebilmesi için secret storage'ı da yeniden oluşturabilir:

```bash
openclaw matrix verify backup reset --yes
```

Tüm `verify` komutları varsayılan olarak özlüdür (sessiz dahili SDK günlükleri dâhil) ve ayrıntılı tanılamayı yalnızca `--verbose` ile gösterir.
Betik yazarken tam makine tarafından okunabilir çıktı için `--json` kullanın.

Çok hesaplı kurulumlarda Matrix CLI komutları, `--account <id>` vermezseniz örtük Matrix varsayılan hesabını kullanır.
Birden çok adlandırılmış hesap yapılandırırsanız önce `channels.matrix.defaultAccount` ayarlayın; aksi hâlde bu örtük CLI işlemleri durur ve sizden açıkça bir hesap seçmenizi ister.
Doğrulama veya cihaz işlemlerinin açıkça adlandırılmış bir hesabı hedeflemesini istediğinizde `--account` kullanın:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Şifreleme devre dışıysa veya adlandırılmış bir hesap için kullanılamıyorsa Matrix uyarıları ve doğrulama hataları, o hesabın yapılandırma anahtarını işaret eder; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Doğrulanmış ne anlama gelir">
    OpenClaw bir cihazı yalnızca sizin kendi cross-signing kimliğiniz onu imzaladığında doğrulanmış kabul eder. `verify status --verbose` üç güven sinyalini gösterir:

    - `Locally trusted`: yalnızca bu istemci tarafından güvenilir
    - `Cross-signing verified`: SDK, cross-signing üzerinden doğrulama bildiriyor
    - `Signed by owner`: kendi self-signing anahtarınız tarafından imzalanmış

    `Verified by owner`, yalnızca cross-signing doğrulaması mevcut olduğunda `yes` olur.
    OpenClaw'un cihazı tam doğrulanmış kabul etmesi için yalnızca yerel güven veya tek başına bir sahip imzası yeterli değildir.

  </Accordion>

  <Accordion title="Bootstrap ne yapar">
    `verify bootstrap`, şifreli hesaplar için onarım ve kurulum komutudur. Sırasıyla şunları yapar:

    - secret storage'ı bootstrap eder, mümkün olduğunda mevcut bir recovery key'i yeniden kullanır
    - cross-signing'i bootstrap eder ve eksik genel cross-signing anahtarlarını yükler
    - geçerli cihazı işaretler ve cross-signing ile imzalar
    - mevcut değilse sunucu tarafında bir oda anahtarı yedeği oluşturur

    Homeserver, cross-signing anahtarlarını yüklemek için UIA gerektiriyorsa OpenClaw önce auth olmadan, sonra `m.login.dummy`, sonra `m.login.password` dener (`channels.matrix.password` gerektirir). `--force-reset-cross-signing` seçeneğini yalnızca geçerli kimliği bilerek atmak istediğinizde kullanın.

  </Accordion>

  <Accordion title="Yeni yedek temel durumu">
    Gelecekteki şifreli mesajların çalışmaya devam etmesini istiyor ve kurtarılamayan eski geçmişi kaybetmeyi kabul ediyorsanız:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Adlandırılmış bir hesabı hedeflemek için `--account <id>` ekleyin. Geçerli yedek sırrı güvenle yüklenemiyorsa bu işlem secret storage'ı da yeniden oluşturabilir.
    Eski recovery key'in yeni yedek temel durumunun kilidini artık açmamasını bilerek istiyorsanız yalnızca `--rotate-recovery-key` ekleyin.

  </Accordion>

  <Accordion title="Başlangıç davranışı">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz, başka bir Matrix istemcisinde self-verification ister; yinelenenleri atlar ve bir bekleme süresi uygular. `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca mevcut secret storage ve cross-signing kimliğini yeniden kullanan muhafazakâr bir kripto bootstrap geçişi çalıştırır. Bootstrap durumu bozuksa OpenClaw, `channels.matrix.password` olmadan bile korumalı bir onarım dener; homeserver parola UIA gerektiriyorsa başlangıç bir uyarı günlüğe kaydeder ve ölümcül olmaz. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için bkz. [Matrix migration](/tr/install/migrating-matrix).

  </Accordion>

  <Accordion title="Doğrulama bildirimleri">
    Matrix, sıkı DM doğrulama odasına doğrulama yaşam döngüsü bildirimlerini `m.notice` mesajları olarak gönderir: istek, hazır ("Verify by emoji" yönergesiyle), başlatma/tamamlama ve varsa SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik kabul edilir. Self-verification için OpenClaw SAS akışını otomatik başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar — yine de Matrix istemcinizde karşılaştırıp "They match" onayı vermeniz gerekir.

    Doğrulama sistem bildirimleri ajan sohbet hattına iletilmez.

  </Accordion>

  <Accordion title="Silinmiş veya geçersiz Matrix cihazı">
    Eğer `verify status`, geçerli cihazın artık homeserver üzerinde listelenmediğini söylüyorsa yeni bir OpenClaw Matrix cihazı oluşturun. Parola ile giriş için:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Token kimlik doğrulaması için Matrix istemcinizde veya yönetici arayüzünüzde yeni bir access token oluşturun, ardından OpenClaw'u güncelleyin:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Başarısız komuttaki hesap kimliğini kullanmak için `assistant` yerine onu yazın veya varsayılan hesap için `--account` seçeneğini atlayın.

  </Accordion>

  <Accordion title="Cihaz hijyeni">
    OpenClaw tarafından yönetilen eski cihazlar birikebilir. Listeleyin ve temizleyin:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kripto deposu">
    Matrix E2EE, resmî `matrix-js-sdk` Rust kripto yolunu ve IndexedDB shim'i olarak `fake-indexeddb` kullanır. Kripto durumu `crypto-idb-snapshot.json` dosyasına kalıcı olarak yazılır (kısıtlayıcı dosya izinleriyle).

    Şifreli çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında bulunur ve sync deposu, kripto deposu, recovery key, IDB snapshot, iş parçacığı bağlamaları ve başlangıç doğrulama durumunu içerir. Token değiştiğinde ancak hesap kimliği aynı kaldığında OpenClaw en iyi mevcut kökü yeniden kullanır; böylece önceki durum görünür kalır.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçili hesap için Matrix öz profilini şununla güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Açıkça adlandırılmış bir Matrix hesabını hedeflemek istiyorsanız `--account <id>` ekleyin.

Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder. `http://` veya `https://` avatar URL'si verdiğinizde OpenClaw önce bunu Matrix'e yükler ve çözümlenen `mxc://` URL'sini tekrar `channels.matrix.avatarUrl` içine (veya seçili hesap geçersiz kılmasına) kaydeder.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de mesaj-aracı gönderimleri için yerel Matrix iş parçacıklarını destekler.

- `dm.sessionScope: "per-user"` (varsayılan), Matrix DM yönlendirmesini gönderici kapsamlı tutar; böylece aynı eşe çözümlendiklerinde birden fazla DM odası tek bir oturumu paylaşabilir.
- `dm.sessionScope: "per-room"`, normal DM kimlik doğrulaması ve allowlist denetimlerini kullanmaya devam ederken her Matrix DM odasını kendi oturum anahtarına yalıtır.
- Açık Matrix konuşma bağlamaları yine de `dm.sessionScope` üzerinde önceliklidir; bu nedenle bağlı odalar ve iş parçacıkları seçtikleri hedef oturumu korur.
- `threadReplies: "off"`, yanıtları üst düzeyde tutar ve gelen iş parçacıklı mesajları üst oturumda tutar.
- `threadReplies: "inbound"`, yalnızca gelen mesaj zaten o iş parçacığındaysa iş parçacığı içinde yanıt verir.
- `threadReplies: "always"`, oda yanıtlarını tetikleyici mesaja köklenen bir iş parçacığında tutar ve bu konuşmayı ilk tetikleyici mesajdan itibaren eşleşen iş parçacığı kapsamlı oturum üzerinden yönlendirir.
- `dm.threadReplies`, yalnızca DM'ler için üst düzey ayarı geçersiz kılar. Örneğin, odalardaki iş parçacıklarını yalıtılmış tutarken DM'leri düz tutabilirsiniz.
- Gelen iş parçacıklı mesajlar, ek ajan bağlamı olarak iş parçacığı kök mesajını içerir.
- Mesaj-aracı gönderimleri, açık bir `threadId` verilmedikçe hedef aynı oda veya aynı DM kullanıcı hedefiyse geçerli Matrix iş parçacığını otomatik devralır.
- Aynı oturumda DM kullanıcı hedefi yeniden kullanımı yalnızca geçerli oturum metadata'sı, aynı Matrix hesabında aynı DM eşini kanıtladığında devreye girer; aksi hâlde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- OpenClaw, bir Matrix DM odasının aynı paylaşılan Matrix DM oturumunda başka bir DM odasıyla çakıştığını gördüğünde, iş parçacığı bağlamaları etkinse ve `dm.sessionScope` ipucuyla birlikte bu odada `/focus` kaçış yolunu içeren bir kerelik `m.notice` gönderir.
- Çalışma zamanı iş parçacığı bağlamaları Matrix için desteklenir. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey Matrix oda/DM `/focus`, `threadBindings.spawnSubagentSessions=true` olduğunda yeni bir Matrix iş parçacığı oluşturur ve onu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak ise o geçerli iş parçacığını bağlar.

## ACP konuşma bağlamaları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyini değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odada geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığı içinde `--bind here`, o geçerli iş parçacığını yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Notlar:

- `--bind here`, alt Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnAcpSessions`, yalnızca OpenClaw'un bir alt Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` için gereklidir.

### İş parçacığı bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` içinden devralır ve ayrıca kanal başına geçersiz kılmaları destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix iş parçacığına bağlı spawn bayrakları isteğe bağlıdır:

- Üst düzey `/focus` komutunun yeni Matrix iş parçacıkları oluşturup bağlamasına izin vermek için `threadBindings.spawnSubagentSessions: true` ayarlayın.
- `/acp spawn --thread auto|here` komutunun ACP oturumlarını Matrix iş parçacıklarına bağlamasına izin vermek için `threadBindings.spawnAcpSessions: true` ayarlayın.

## Tepkiler

Matrix, giden tepki eylemlerini, gelen tepki bildirimlerini ve gelen ack tepkilerini destekler.

- Giden tepki araçları `channels["matrix"].actions.reactions` ile kontrol edilir.
- `react`, belirli bir Matrix olayına tepki ekler.
- `reactions`, belirli bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, bu olay üzerindeki bot hesabının kendi tepkilerini kaldırır.
- `remove: true`, yalnızca bot hesabındaki belirtilen emoji tepkisini kaldırır.

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

Davranış:

- `reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedeflediklerinde eklenen `m.reaction` olaylarını iletir.
- `reactionNotifications: "off"`, tepki sistem olaylarını devre dışı bırakır.
- Tepki kaldırmaları sistem olaylarına dönüştürülmez çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak gösterir.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı ajanı tetiklediğinde `InboundHistory` olarak kaç son oda mesajının dâhil edileceğini kontrol eder. `messages.groupChat.historyLimit` değerine geri düşer; ikisi de ayarlı değilse etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca odaya özeldir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca pending durumundadır: OpenClaw henüz yanıt tetiklememiş oda mesajlarını arabelleğe alır, ardından bir mention veya başka bir tetikleyici geldiğinde o pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine dâhil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, alınan yanıt metni, iş parçacığı kökleri ve pending geçmiş gibi ek oda bağlamları için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi korunur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı allowlist denetimleri tarafından izin verilen göndericilere filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de açıkça alıntılanmış bir yanıtı tutar.

Bu ayar, ek bağlamın görünürlüğünü etkiler; gelen mesajın kendisinin yanıt tetikleyip tetikleyemeyeceğini etkilemez.
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

Mention geçitleme ve allowlist davranışı için bkz. [Groups](/tr/channels/groups).

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj atmaya devam ederse OpenClaw aynı pending eşleştirme kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinden sonra yeniden bir hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için bkz. [Pairing](/tr/channels/pairing).

## Doğrudan oda onarımı

Doğrudan mesaj durumu eşzaman dışına çıkarsa OpenClaw, canlı DM yerine eski solo odaları işaret eden bayat `m.direct` eşlemeleriyle kalabilir. Bir eş için geçerli eşlemeyi şununla inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Şununla onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Onarım akışı:

- zaten `m.direct` içinde eşlenmiş olan katı bir 1:1 DM'yi tercih eder
- o kullanıcıyla şu anda katılınmış herhangi bir katı 1:1 DM'ye geri düşer
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Onarım akışı eski odaları otomatik olarak silmez. Yalnızca sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece yeni Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları yeniden doğru odayı hedefler.

## Exec onayları

Matrix, bir Matrix hesabı için yerel bir onay istemcisi olarak çalışabilir. Yerel
DM/kanal yönlendirme ayarları yine exec onay yapılandırması altında bulunur:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (isteğe bağlı; `channels.matrix.dm.allowFrom` değerine geri düşer)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Onaylayıcılar `@owner:example.org` gibi Matrix kullanıcı kimlikleri olmalıdır. Matrix, `enabled` ayarlı değilse veya `"auto"` ise ve en az bir onaylayıcı çözümlenebiliyorsa yerel onayları otomatik etkinleştirir. Exec onayları önce `execApprovals.approvers` kullanır ve `channels.matrix.dm.allowFrom` değerine geri düşebilir. Plugin onayları `channels.matrix.dm.allowFrom` üzerinden yetkilendirilir. Matrix'i yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi hâlde onay istekleri diğer yapılandırılmış onay yollarına veya onay fallback politikasına geri düşer.

Matrix yerel yönlendirmesi her iki onay türünü de destekler:

- `channels.matrix.execApprovals.*`, Matrix onay istemleri için yerel DM/kanal dağıtım modunu kontrol eder.
- Exec onayları, `execApprovals.approvers` veya `channels.matrix.dm.allowFrom` içindeki exec onaylayıcı kümesini kullanır.
- Plugin onayları, `channels.matrix.dm.allowFrom` içindeki Matrix DM allowlist'ini kullanır.
- Matrix tepki kısayolları ve mesaj güncellemeleri hem exec hem de plugin onaylarına uygulanır.

Teslim kuralları:

- `target: "dm"`, onay istemlerini onaylayıcı DM'lerine yollar
- `target: "channel"`, istemi kaynak Matrix odasına veya DM'ye geri yollar
- `target: "both"`, onaylayıcı DM'lerine ve kaynak Matrix odasına veya DM'ye yollar

Matrix onay istemleri, birincil onay mesajında tepki kısayollarını başlatır:

- `✅` = bir kez izin ver
- `❌` = reddet
- `♾️` = bu karar etkin exec politikası tarafından izin verildiğinde her zaman izin ver

Onaylayıcılar bu mesaja tepki verebilir veya fallback slash komutlarını kullanabilir: `/approve <id> allow-once`, `/approve <id> allow-always` veya `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onay verebilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; bu yüzden `channel` veya `both` seçeneklerini yalnızca güvenilen odalarda etkinleştirin.

Hesap başına geçersiz kılma:

- `channels.matrix.accounts.<account>.execApprovals`

İlgili belgeler: [Exec approvals](/tr/tools/exec-approvals)

## Slash komutları

Matrix slash komutları (örneğin `/new`, `/reset`, `/model`) doğrudan DM'lerde çalışır. Odalarda OpenClaw ayrıca botun kendi Matrix mention'ı ile öneklenen slash komutlarını da tanır; böylece `@bot:server /new`, özel bir mention regex gerekmeden komut yolunu tetikler. Bu, bir kullanıcı komutu yazmadan önce sekme tamamlama ile botu eklediğinde Element ve benzeri istemcilerin gönderdiği oda tarzı `@mention /command` gönderilerine botun yanıt vermesini sağlar.

Yetkilendirme kuralları yine geçerlidir: komut gönderenler, düz mesajlarda olduğu gibi DM veya oda allowlist/sahip politikalarını karşılamalıdır.

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

Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadıkça adlandırılmış hesaplar için varsayılan görevi görür.
Devralınan oda girdilerini bir Matrix hesabına `groups.<room>.account` ile kapsamlandırabilirsiniz.
`account` içermeyen girdiler tüm Matrix hesapları arasında paylaşımlı kalır ve `account: "default"` içeren girdiler, varsayılan hesap doğrudan üst düzey `channels.matrix.*` üzerinde yapılandırıldığında yine çalışır.
Kısmi paylaşımlı auth varsayılanları tek başına ayrı bir örtük varsayılan hesap oluşturmaz. OpenClaw, üst düzey `default` hesabını yalnızca o varsayılanda yeni auth varsa (`homeserver` ile `accessToken` veya `homeserver` ile `userId` ve `password`) sentezler; adlandırılmış hesaplar, önbelleğe alınmış kimlik bilgileri daha sonra auth'u karşıladığında yine de `homeserver` ile `userId` üzerinden keşfedilebilir kalabilir.
Matrix'te zaten tam olarak bir adlandırılmış hesap varsa veya `defaultAccount` mevcut bir adlandırılmış hesap anahtarını işaret ediyorsa, tek hesaptan çok hesaba onarım/kurulum yükseltmesi yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur. Yalnızca Matrix auth/bootstrap anahtarları bu yükseltilmiş hesaba taşınır; paylaşımlı teslim politikası anahtarları üst düzeyde kalır.
Örtük yönlendirme, yoklama ve CLI işlemleri için OpenClaw'un bir adlandırılmış Matrix hesabını tercih etmesini istiyorsanız `defaultAccount` ayarlayın.
Birden çok Matrix hesabı yapılandırılmışsa ve hesap kimliklerinden biri `default` ise OpenClaw, `defaultAccount` ayarlı olmasa bile bu hesabı örtük olarak kullanır.
Birden çok adlandırılmış hesap yapılandırırsanız, örtük hesap seçimine dayanan CLI komutları için `defaultAccount` ayarlayın veya `--account <id>` verin.
Tek bir komutta bu örtük seçimi geçersiz kılmak istediğinizde `openclaw matrix verify ...` ve `openclaw matrix devices ...` komutlarına `--account <id>` verin.

Paylaşılan çok hesap düzeni için bkz. [Configuration reference](/tr/gateway/config-channels#multi-account-all-channels).

## Özel/LAN homeserver'ları

Varsayılan olarak OpenClaw, SSRF koruması için özel/dahili Matrix homeserver'larını siz
hesap başına açıkça izin vermedikçe engeller.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir ana bilgisayar adı üzerinde çalışıyorsa
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

Bu katılım yalnızca güvenilir özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi
herkese açık şifresiz homeserver'lar engellenmeye devam eder. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden geçirmek

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

Matrix, OpenClaw'un sizden bir oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. Açık teslim hedeflerini, Cron işleri, bağlamaları veya allowlist'leri yapılandırırken
Matrix'teki tam oda kimliği harf biçimini kullanın.
OpenClaw depolama için dahili oturum anahtarlarını kanonik tuttuğundan, bu küçük harfli
anahtarlar Matrix teslim kimlikleri için güvenilir bir kaynak değildir.

Canlı dizin araması, giriş yapılmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, ardından o hesap için katılınmış oda adlarını aramaya geri düşer.
- Katılınmış oda adı araması best-effort çalışır. Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa çalışma zamanı allowlist çözümlemesi tarafından yok sayılır.

## Yapılandırma başvurusu

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı etiket.
- `defaultAccount`: birden çok Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu Matrix hesabının özel/dahili homeserver'lara bağlanmasına izin verir. Homeserver `localhost`, bir LAN/Tailscale IP'si veya `matrix-synapse` gibi dahili bir ana bilgisayar adına çözümlendiğinde bunu etkinleştirin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Adlandırılmış hesaplar üst düzey varsayılanı kendi `proxy` değerleriyle geçersiz kılabilir.
- `userId`: tam Matrix kullanıcı kimliği, örneğin `@bot:example.org`.
- `accessToken`: token tabanlı kimlik doğrulama için access token. `channels.matrix.accessToken` ve `channels.matrix.accounts.<id>.accessToken` için env/file/exec sağlayıcıları genelinde düz metin değerleri ve SecretRef değerleri desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).
- `password`: password tabanlı giriş için parola. Düz metin değerleri ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: password ile giriş için cihaz görünen adı.
- `avatarUrl`: profil senkronizasyonu ve `profile set` güncellemeleri için depolanan öz-avatar URL'si.
- `initialSyncLimit`: başlangıç senkronizasyonu sırasında getirilen en yüksek olay sayısı.
- `encryption`: E2EE'yi etkinleştirir.
- `allowlistOnly`: `true` olduğunda `open` oda politikasını `allowlist`e yükseltir ve `disabled` dışındaki tüm etkin DM politikalarını (`pairing` ve `open` dâhil) `allowlist`e zorlar. `disabled` politikalarını etkilemez.
- `allowBots`: yapılandırılmış diğer OpenClaw Matrix hesaplarından mesajlara izin verir (`true` veya `"mentions"`).
- `groupPolicy`: `open`, `allowlist` veya `disabled`.
- `contextVisibility`: ek oda bağlamı görünürlük modu (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: oda trafiği için kullanıcı kimliği allowlist'i. Tam Matrix kullanıcı kimlikleri en güvenlisidir; tam dizin eşleşmeleri başlangıçta ve monitör çalışırken allowlist değiştiğinde çözülür. Çözümlenmemiş adlar yok sayılır.
- `historyLimit`: grup geçmiş bağlamı olarak eklenecek en yüksek oda mesajı sayısı. `messages.groupChat.historyLimit` değerine geri düşer; ikisi de ayarlı değilse etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- `replyToMode`: `off`, `first`, `all` veya `batched`.
- `markdown`: giden Matrix metni için isteğe bağlı Markdown işleme yapılandırması.
- `streaming`: `off` (varsayılan), `"partial"`, `"quiet"`, `true` veya `false`. `"partial"` ve `true`, normal Matrix metin mesajlarıyla önizleme-önce taslak güncellemelerini etkinleştirir. `"quiet"`, self-hosted push-rule kurulumları için bildirim göndermeyen önizleme bildirimlerini kullanır. `false`, `"off"` ile eşdeğerdir.
- `blockStreaming`: `true`, taslak önizleme akışı etkinken tamamlanmış asistan blokları için ayrı ilerleme mesajlarını etkinleştirir.
- `threadReplies`: `off`, `inbound` veya `always`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `startupVerification`: başlangıçta otomatik self-verification istek modu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: otomatik başlangıç doğrulama isteklerini yeniden denemeden önce bekleme süresi.
- `textChunkLimit`: giden mesaj parça boyutu karakter cinsinden (`chunkMode` değeri `length` olduğunda uygulanır).
- `chunkMode`: `length`, mesajları karakter sayısına göre böler; `newline`, satır sınırlarında böler.
- `responsePrefix`: bu kanal için tüm giden yanıtlara eklenen isteğe bağlı dize.
- `ackReaction`: bu kanal/hesap için isteğe bağlı ack tepki geçersiz kılması.
- `ackReactionScope`: isteğe bağlı ack tepki kapsamı geçersiz kılması (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: gelen tepki bildirim modu (`own`, `off`).
- `mediaMaxMb`: giden gönderimler ve gelen medya işleme için MB cinsinden medya boyutu üst sınırı.
- `autoJoin`: davetlerde otomatik katılım politikası (`always`, `allowlist`, `off`). Varsayılan: `off`. DM tarzı davetler dâhil tüm Matrix davetlerine uygulanır.
- `autoJoinAllowlist`: `autoJoin`, `allowlist` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri davet işleme sırasında oda kimliklerine çözülür; OpenClaw davet edilen odanın beyan ettiği takma ad durumuna güvenmez.
- `dm`: DM politika bloğu (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw odaya katıldıktan ve onu DM olarak sınıflandırdıktan sonra DM erişimini kontrol eder. Bir davetin otomatik olarak katılıp katılınmayacağını değiştirmez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimliği allowlist'i. Tam Matrix kullanıcı kimlikleri en güvenlisidir; tam dizin eşleşmeleri başlangıçta ve monitör çalışırken allowlist değiştiğinde çözülür. Çözümlenmemiş adlar yok sayılır.
- `dm.sessionScope`: `per-user` (varsayılan) veya `per-room`. Eş aynı olsa bile her Matrix DM odasının ayrı bağlam tutmasını istiyorsanız `per-room` kullanın.
- `dm.threadReplies`: yalnızca DM için iş parçacığı politikası geçersiz kılması (`off`, `inbound`, `always`). DM'lerde hem yanıt yerleşimi hem de oturum yalıtımı için üst düzey `threadReplies` ayarını geçersiz kılar.
- `execApprovals`: Matrix yerel exec onay teslimi (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` zaten onaylayıcıları tanımlıyorsa isteğe bağlıdır.
- `execApprovals.target`: `dm | channel | both` (varsayılan: `dm`).
- `accounts`: hesap başına adlandırılmış geçersiz kılmalar. Üst düzey `channels.matrix` değerleri bu girdiler için varsayılan görevi görür.
- `groups`: oda başına politika eşlemi. Oda kimliklerini veya takma adları tercih edin; çözümlenmemiş oda adları çalışma anında yok sayılır. Oturum/grup kimliği çözümlemeden sonra kararlı oda kimliğini kullanır.
- `groups.<room>.account`: çok hesaplı kurulumlarda devralınan tek bir oda girdisini belirli bir Matrix hesabıyla sınırlandırır.
- `groups.<room>.allowBots`: yapılandırılmış bot göndericiler için oda düzeyinde geçersiz kılma (`true` veya `"mentions"`).
- `groups.<room>.users`: oda başına gönderici allowlist'i.
- `groups.<room>.tools`: oda başına araç izin/verme engelleme geçersiz kılmaları.
- `groups.<room>.autoReply`: oda düzeyinde mention geçitleme geçersiz kılması. `true`, o oda için mention gereksinimlerini devre dışı bırakır; `false`, bunları yeniden zorunlu kılar.
- `groups.<room>.skills`: isteğe bağlı oda düzeyinde Skills filtresi.
- `groups.<room>.systemPrompt`: isteğe bağlı oda düzeyinde system prompt parçası.
- `rooms`: `groups` için eski takma ad.
- `actions`: eylem başına araç geçitleme (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulama ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitleme
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
