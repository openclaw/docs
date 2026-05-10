---
read_when:
    - OpenClaw'da Matrix kurulumu
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matris
x-i18n:
    generated_at: "2026-05-10T19:22:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111f7d4ce9b1c2ead6a69b5ba2e704cc273e759001f19555f61716f07210d8b2
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, OpenClaw için indirilebilir bir kanal Plugin’idir.
Resmi `matrix-js-sdk` kullanır ve DM’leri, odaları, ileti dizilerini, medyayı, tepkileri, anketleri, konumu ve E2EE’yi destekler.

## Kurulum

Kanalı yapılandırmadan önce Matrix’i ClawHub’dan kurun:

```bash
openclaw plugins install @openclaw/matrix
```

Yalın Plugin belirtimleri önce ClawHub’ı dener, ardından npm yedeğine döner. Kayıt kaynağını zorlamak için `openclaw plugins install clawhub:@openclaw/matrix` veya `openclaw plugins install npm:@openclaw/matrix` kullanın.

Yerel bir checkout’tan:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`, Plugin’i kaydeder ve etkinleştirir; bu nedenle ayrı bir `openclaw plugins enable matrix` adımı gerekmez. Aşağıdaki kanalı yapılandırana kadar Plugin yine de hiçbir şey yapmaz. Genel Plugin davranışı ve kurulum kuralları için [Plugins](/tr/tools/plugin) bölümüne bakın.

## Kurulum

1. Homeserver’ınızda bir Matrix hesabı oluşturun.
2. `channels.matrix` ayarını `homeserver` + `accessToken` veya `homeserver` + `userId` + `password` ile yapılandırın.
3. Gateway’i yeniden başlatın.
4. Bot ile bir DM başlatın veya onu bir odaya davet edin ([otomatik katılma](#auto-join) bölümüne bakın - yeni davetler yalnızca `autoJoin` izin verdiğinde ulaşır).

### Etkileşimli kurulum

```bash
openclaw channels add
openclaw configure --section channels
```

Sihirbaz şunları sorar: homeserver URL’si, kimlik doğrulama yöntemi (erişim belirteci veya parola), kullanıcı kimliği (yalnızca parola ile kimlik doğrulama), isteğe bağlı cihaz adı, E2EE’nin etkinleştirilip etkinleştirilmeyeceği ve oda erişimi ile otomatik katılmanın yapılandırılıp yapılandırılmayacağı.

Eşleşen `MATRIX_*` ortam değişkenleri zaten varsa ve seçili hesapta kayıtlı kimlik doğrulaması yoksa, sihirbaz bir ortam değişkeni kısayolu sunar. İzin listesini kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` çalıştırın. E2EE etkinleştirildiğinde sihirbaz yapılandırmayı yazar ve [`openclaw matrix encryption setup`](#encryption-and-verification) ile aynı bootstrap’i çalıştırır.

### En küçük yapılandırma

Belirteç tabanlı:

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

Parola tabanlı (belirteç ilk oturum açmadan sonra önbelleğe alınır):

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

### Otomatik katılma

`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir. Varsayılan ayarla bot, siz elle katılana kadar yeni davetlerden gelen yeni odalarda veya DM’lerde görünmez.

OpenClaw, davet anında davet edilen odanın DM mi yoksa grup mu olduğunu anlayamaz; bu yüzden DM tarzı davetler dahil tüm davetler önce `autoJoin` üzerinden geçer. `dm.policy` ancak daha sonra, bot katıldıktan ve oda sınıflandırıldıktan sonra uygulanır.

<Warning>
Botun kabul ettiği davetleri kısıtlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her daveti kabul etmek için `autoJoin: "always"` kullanın.

`autoJoinAllowlist` yalnızca kararlı hedefleri kabul eder: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir; takma ad girdileri, davet edilen odanın iddia ettiği duruma göre değil, homeserver’a göre çözümlenir.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

Her daveti kabul etmek için `autoJoin: "always"` kullanın.

### İzin listesi hedef biçimleri

DM ve oda izin listeleri en iyi kararlı kimliklerle doldurulur:

- DM’ler (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` kullanın. Görünen adlar yalnızca homeserver dizini tam olarak bir eşleşme döndürdüğünde çözümlenir.
- Odalar (`groups`, `autoJoinAllowlist`): `!room:server` veya `#alias:server` kullanın. Adlar, katılınmış odalara göre en iyi çabayla çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır.

### Hesap kimliği normalleştirme

Sihirbaz, kullanıcı dostu bir adı normalleştirilmiş bir hesap kimliğine dönüştürür. Örneğin `Ops Bot`, `ops-bot` olur. İki hesabın çakışmaması için noktalama işaretleri kapsamlı ortam değişkeni adlarında kaçışlanır: `-` → `_X2D_`; yani `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşleşir.

### Önbelleğe alınmış kimlik bilgileri

Matrix, önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` altında saklar:

- varsayılan hesap: `credentials.json`
- adlandırılmış hesaplar: `credentials-<account>.json`

Önbelleğe alınmış kimlik bilgileri burada bulunduğunda OpenClaw, erişim belirteci yapılandırma dosyasında olmasa bile Matrix’i yapılandırılmış kabul eder; bu durum kurulumu, `openclaw doctor` komutunu ve kanal durumu yoklamalarını kapsar.

### Ortam değişkenleri

Eşdeğer yapılandırma anahtarı ayarlanmadığında kullanılır. Varsayılan hesap öneksiz adlar kullanır; adlandırılmış hesaplar sonekten önce eklenen hesap kimliğini kullanır.

| Varsayılan hesap      | Adlandırılmış hesap (`<ID>` normalleştirilmiş hesap kimliğidir) |
| --------------------- | --------------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                        |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                                      |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                           |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                          |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                         |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                                       |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                                      |

`ops` hesabı için adlar `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` ve benzeri olur. Kurtarma anahtarı ortam değişkenleri, anahtarı `--recovery-key-stdin` ile içeri aktardığınızda kurtarma farkındalıklı CLI akışları (`verify backup restore`, `verify device`, `verify bootstrap`) tarafından okunur.

`MATRIX_HOMESERVER`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Yapılandırma örneği

DM eşleştirme, oda izin listesi ve E2EE içeren pratik bir temel:

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
        "!roomid:example.org": { requireMention: true },
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

Matrix yanıt akışı isteğe bağlıdır. `streaming`, OpenClaw’ın devam eden asistan yanıtını nasıl ileteceğini denetler; `blockStreaming` ise tamamlanan her bloğun kendi Matrix mesajı olarak korunup korunmayacağını denetler.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Canlı yanıt önizlemelerini koruyup ara araç/ilerleme satırlarını gizlemek için nesne
biçimini kullanın:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`          | Davranış                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (varsayılan) | Tam yanıtı bekler, bir kez gönderir. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                |
| `"partial"`          | Model geçerli bloğu yazarken tek bir normal metin mesajını yerinde düzenler. Standart Matrix istemcileri son düzenlemede değil, ilk önizlemede bildirim gösterebilir.         |
| `"quiet"`            | `"partial"` ile aynıdır, ancak mesaj bildirim oluşturmayan bir bildirim notudur. Alıcılar yalnızca kullanıcı başına bir push kuralı kesinleşmiş düzenlemeyle eşleştiğinde bildirim alır (aşağıya bakın). |

`blockStreaming`, `streaming` ayarından bağımsızdır:

| `streaming`             | `blockStreaming: true`                                                  | `blockStreaming: false` (varsayılan)           |
| ----------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| `"partial"` / `"quiet"` | Geçerli blok için canlı taslak, tamamlanan bloklar mesaj olarak tutulur | Geçerli blok için canlı taslak, yerinde kesinleştirilir |
| `"off"`                 | Tamamlanan her blok için bir bildirimli Matrix mesajı                  | Tam yanıt için bir bildirimli Matrix mesajı    |

Notlar:

- Bir önizleme Matrix’in olay başına boyut sınırını aşarsa OpenClaw önizleme akışını durdurur ve yalnızca son teslimata geri döner.
- Medya yanıtları ekleri her zaman normal şekilde gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Araç ilerleme önizleme güncellemeleri, Matrix önizleme akışı etkin olduğunda varsayılan olarak etkindir. Yanıt metni için önizleme düzenlemelerini koruyup araç ilerlemesini normal teslimat yolunda bırakmak için `streaming.preview.toolProgress: false` ayarlayın.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En muhafazakar hız sınırı profilini istiyorsanız `streaming: "off"` bırakın.

## Onay meta verileri

Matrix’e özgü onay istemleri, `com.openclaw.approval` altında OpenClaw’a özel özel olay içeriği bulunan normal `m.room.message` olaylarıdır. Matrix özel olay içeriği anahtarlarına izin verir; bu nedenle standart istemciler metin gövdesini yine de gösterirken OpenClaw farkındalıklı istemciler yapılandırılmış onay kimliğini, türünü, durumunu, mevcut kararları ve exec/Plugin ayrıntılarını okuyabilir.

Bir onay istemi tek bir Matrix olayı için çok uzunsa OpenClaw görünen metni parçalara böler ve `com.openclaw.approval` bilgisini yalnızca ilk parçaya ekler. İzin ver/reddet kararları için tepkiler bu ilk olaya bağlanır; böylece uzun istemler tek olaylı istemlerle aynı onay hedefini korur.

### Sessiz kesinleşmiş önizlemeler için self-hosted push kuralları

`streaming: "quiet"`, alıcıları yalnızca bir blok veya tur kesinleştiğinde bilgilendirir; kullanıcı başına bir push kuralının kesinleşmiş önizleme işaretçisiyle eşleşmesi gerekir. Tam tarif için (alıcı belirteci, pusher denetimi, kural kurulumu, homeserver başına notlar) [sessiz önizlemeler için Matrix push kuralları](/tr/channels/matrix-push-rules) bölümüne bakın.

## Botlar arası odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Bilerek aracılar arası Matrix trafiği istediğinizde `allowBots` kullanın:

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

- `allowBots: true`, izin verilen odalarda ve DM’lerde yapılandırılmış diğer Matrix bot hesaplarından gelen mesajları kabul eder.
- `allowBots: "mentions"`, bu mesajları yalnızca odalarda bu bottan görünür şekilde bahsettiklerinde kabul eder. DM’lere yine de izin verilir.
- `groups.<room>.allowBots`, tek bir oda için hesap düzeyi ayarı geçersiz kılar.
- OpenClaw, kendi kendine yanıt döngülerinden kaçınmak için aynı Matrix kullanıcı kimliğinden gelen mesajları yine de yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw, "bot tarafından yazılmış" ifadesini "bu OpenClaw Gateway’inde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak ele alır.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken katı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda, giden görüntü olayları `thumbnail_file` kullanır; böylece görüntü önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar yine düz `thumbnail_url` kullanır. Yapılandırma gerekmez; Plugin E2EE durumunu otomatik olarak algılar.

Tüm `openclaw matrix` komutları `--verbose` (tam tanılamalar), `--json` (makine tarafından okunabilir çıktı) ve `--account <id>` (çok hesaplı kurulumlar) seçeneklerini kabul eder. Çıktı, sessiz dahili SDK günlükleriyle varsayılan olarak özlüdür. Aşağıdaki örnekler kanonik biçimi gösterir; bayrakları gerektiğinde ekleyin.

### Şifrelemeyi etkinleştirme

```bash
openclaw matrix encryption setup
```

Gizli depolamayı ve çapraz imzalamayı önyükler, gerekirse bir oda anahtarı yedeği oluşturur, ardından durumu ve sonraki adımları yazdırır. Yararlı bayraklar:

- `--recovery-key <key>` önyüklemeden önce bir kurtarma anahtarı uygula (aşağıda belgelenen stdin biçimini tercih edin)
- `--force-reset-cross-signing` geçerli çapraz imzalama kimliğini at ve yenisini oluştur (yalnızca bilinçli olarak kullanın)

Yeni bir hesap için, oluşturma sırasında E2EE'yi etkinleştirin:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption`, `--enable-e2ee` için bir diğer addır.

Eşdeğer manuel yapılandırma:

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

### Durum ve güven sinyalleri

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` üç bağımsız güven sinyali bildirir (`--verbose` bunların tümünü gösterir):

- `Locally trusted`: yalnızca bu istemci tarafından güveniliyor
- `Cross-signing verified`: SDK, çapraz imzalama yoluyla doğrulama bildiriyor
- `Signed by owner`: kendi öz imzalama anahtarınız tarafından imzalanmış (yalnızca tanılama amaçlı)

`Verified by owner`, yalnızca `Cross-signing verified` `yes` olduğunda `yes` olur. Yerel güven veya tek başına sahip imzası yeterli değildir.

`--allow-degraded-local-state`, önce Matrix hesabını hazırlamadan en iyi çaba tanılamaları döndürür; çevrimdışı veya kısmen yapılandırılmış yoklamalar için kullanışlıdır.

### Bu cihazı bir kurtarma anahtarıyla doğrulama

Kurtarma anahtarı hassastır - komut satırında geçirmek yerine stdin üzerinden yönlendirin. `MATRIX_RECOVERY_KEY` değerini (veya adlandırılmış bir hesap için `MATRIX_<ID>_RECOVERY_KEY`) ayarlayın:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Komut üç durum bildirir:

- `Recovery key accepted`: Matrix anahtarı gizli depolama veya cihaz güveni için kabul etti.
- `Backup usable`: oda anahtarı yedeği, güvenilen kurtarma materyaliyle yüklenebilir.
- `Device verified by owner`: bu cihaz tam Matrix çapraz imzalama kimliği güvenine sahiptir.

Kurtarma anahtarı yedek materyalini açmış olsa bile, tam kimlik güveni tamamlanmadığında komut sıfır olmayan kodla çıkar. Bu durumda, başka bir Matrix istemcisinden öz doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

`verify self`, başarılı biçimde çıkmadan önce `Cross-signing verified: yes` bekler. Beklemeyi ayarlamak için `--timeout-ms <ms>` kullanın.

Değişmez anahtar biçimi `openclaw matrix verify device "<recovery-key>"` de kabul edilir, ancak anahtar kabuk geçmişinize girer.

### Çapraz imzalamayı önyükleme veya onarma

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap`, şifrelenmiş hesaplar için onarım ve kurulum komutudur. Sırasıyla şunları yapar:

- mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanarak gizli depolamayı önyükler
- çapraz imzalamayı önyükler ve eksik genel anahtarları yükler
- geçerli cihazı işaretler ve çapraz imzalar
- zaten yoksa sunucu tarafında bir oda anahtarı yedeği oluşturur

Homeserver çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa, OpenClaw önce kimlik doğrulamasız yolu, sonra `m.login.dummy`, sonra `m.login.password` dener (`channels.matrix.password` gerektirir).

Yararlı bayraklar:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` ile eşleştirin) veya `--recovery-key <key>`
- geçerli çapraz imzalama kimliğini atmak için `--force-reset-cross-signing` (yalnızca bilinçli olarak)

### Oda anahtarı yedeği

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`, sunucu tarafında bir yedek olup olmadığını ve bu cihazın onu çözüp çözemediğini gösterir. `backup restore`, yedeklenmiş oda anahtarlarını yerel kripto deposuna içe aktarır; kurtarma anahtarı zaten diskteyse `--recovery-key-stdin` atlanabilir.

Bozuk bir yedeği yeni bir temel durumla değiştirmek için (kurtarılamayan eski geçmişin kaybını kabul eder; geçerli yedek sırrı yüklenemiyorsa gizli depolamayı da yeniden oluşturabilir):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` seçeneğini yalnızca önceki kurtarma anahtarının yeni yedek temel durumunu artık açamamasını özellikle istediğinizde ekleyin.

### Doğrulamaları listeleme, isteme ve yanıtlama

```bash
openclaw matrix verify list
```

Seçilen hesap için bekleyen doğrulama isteklerini listeler.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Bu OpenClaw hesabından bir doğrulama isteği gönderir. `--own-user` öz doğrulama ister (istemciyi aynı kullanıcının başka bir Matrix istemcisinde kabul edersiniz); `--user-id`/`--device-id`/`--room-id` başka birini hedefler. `--own-user`, diğer hedefleme bayraklarıyla birlikte kullanılamaz.

Daha düşük düzeyli yaşam döngüsü yönetimi için - genellikle başka bir istemciden gelen istekleri izlerken - bu komutlar belirli bir `<id>` isteği üzerinde çalışır (`verify list` ve `verify request` tarafından yazdırılır):

| Komut                                      | Amaç                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Gelen bir isteği kabul et                                           |
| `openclaw matrix verify start <id>`        | SAS akışını başlat                                                  |
| `openclaw matrix verify sas <id>`          | SAS emojisini veya ondalıklarını yazdır                             |
| `openclaw matrix verify confirm-sas <id>`  | SAS'ın diğer istemcinin gösterdiğiyle eşleştiğini onayla            |
| `openclaw matrix verify mismatch-sas <id>` | Emoji veya ondalıklar eşleşmediğinde SAS'ı reddet                   |
| `openclaw matrix verify cancel <id>`       | İptal et; isteğe bağlı `--reason <text>` ve `--code <matrix-code>` alır |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` ve `cancel`, doğrulama belirli bir doğrudan mesaj odasına bağlı olduğunda DM takip ipuçları olarak `--user-id` ve `--room-id` kabul eder.

### Çok hesaplı notlar

`--account <id>` olmadan Matrix CLI komutları örtük varsayılan hesabı kullanır. Birden fazla adlandırılmış hesabınız varsa ve `channels.matrix.defaultAccount` ayarlanmamışsa, tahmin yürütmeyi reddeder ve seçim yapmanızı isterler. E2EE adlandırılmış bir hesap için devre dışı veya kullanılamaz olduğunda, hatalar ilgili hesabın yapılandırma anahtarını gösterir; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz, başka bir Matrix istemcisinde öz doğrulama ister; yinelenenleri atlar ve bir bekleme süresi uygular (varsayılan olarak 24 saat). `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca geçerli gizli depolamayı ve çapraz imzalama kimliğini yeniden kullanan korumacı bir kripto önyükleme geçişi çalıştırır. Önyükleme durumu bozuksa OpenClaw, `channels.matrix.password` olmadan bile korumalı bir onarım dener; homeserver parola UIA gerektiriyorsa, başlangıç bir uyarı günlüğe yazar ve ölümcül olmayan şekilde kalır. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix geçişi](/tr/channels/matrix-migration) bölümüne bakın.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix, doğrulama yaşam döngüsü bildirimlerini katı DM doğrulama odasına `m.notice` iletileri olarak gönderir: istek, hazır olma ("Verify by emoji" rehberliğiyle), başlatma/tamamlama ve varsa SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik kabul edilir. Öz doğrulama için OpenClaw, SAS akışını otomatik başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar - yine de Matrix istemcinizde karşılaştırıp "They match" onayını vermeniz gerekir.

    Doğrulama sistemi bildirimleri agent sohbet işlem hattına iletilmez.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    `verify status` geçerli cihazın artık homeserver üzerinde listelenmediğini söylüyorsa, yeni bir OpenClaw Matrix cihazı oluşturun. Parola ile giriş için:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Token kimlik doğrulaması için, Matrix istemcinizde veya yönetici arayüzünüzde yeni bir erişim tokenı oluşturun, ardından OpenClaw'ı güncelleyin:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` değerini başarısız komuttaki hesap kimliğiyle değiştirin veya varsayılan hesap için `--account` seçeneğini atlayın.

  </Accordion>

  <Accordion title="Device hygiene">
    Eski OpenClaw tarafından yönetilen cihazlar birikebilir. Listeleyin ve budayın:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE, IndexedDB shim'i olarak `fake-indexeddb` ile resmi `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` dosyasına kalıcı olarak yazılır (kısıtlayıcı dosya izinleriyle).

    Şifrelenmiş çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında bulunur ve senkronizasyon deposunu, kripto deposunu, kurtarma anahtarını, IDB anlık görüntüsünü, thread bağlarını ve başlangıç doğrulama durumunu içerir. Token değiştiğinde ama hesap kimliği aynı kaldığında, OpenClaw önceki durumun görünür kalması için en iyi mevcut kökü yeniden kullanır.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçilen hesap için Matrix öz profilini güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Her iki seçeneği tek çağrıda geçebilirsiniz. Matrix `mxc://` avatar URL'lerini doğrudan kabul eder; `http://` veya `https://` geçtiğinizde OpenClaw önce dosyayı yükler ve çözümlenen `mxc://` URL'sini `channels.matrix.avatarUrl` içine (veya hesap başına geçersiz kılmaya) kaydeder.

## Thread'ler

Matrix, hem otomatik yanıtlar hem de ileti aracı gönderimleri için yerel Matrix thread'lerini destekler. İki bağımsız ayar davranışı denetler:

### Oturum yönlendirme (`sessionScope`)

`dm.sessionScope`, Matrix DM odalarının OpenClaw oturumlarına nasıl eşlendiğini belirler:

- `"per-user"` (varsayılan): aynı yönlendirilen eşe sahip tüm DM odaları tek bir oturumu paylaşır.
- `"per-room"`: eş aynı olsa bile her Matrix DM odası kendi oturum anahtarını alır.

Açık konuşma bağları her zaman `sessionScope` üzerine çıkar; bu nedenle bağlı odalar ve thread'ler seçtikleri hedef oturumu korur.

### Yanıt thread'i oluşturma (`threadReplies`)

`threadReplies`, botun yanıtını nereye göndereceğini belirler:

- `"off"`: yanıtlar üst düzeydedir. Gelen thread'li iletiler üst oturumda kalır.
- `"inbound"`: yalnızca gelen ileti zaten o thread içindeyse bir thread içinde yanıtla.
- `"always"`: tetikleyen iletiye köklenen bir thread içinde yanıtla; bu konuşma ilk tetiklemeden itibaren eşleşen thread kapsamlı bir oturum üzerinden yönlendirilir.

`dm.threadReplies` bunu yalnızca DM'ler için geçersiz kılar - örneğin, oda thread'lerini yalıtılmış tutarken DM'leri düz tutmak için.

### Thread devralma ve eğik çizgi komutları

- Gelen iş parçacıklı iletiler, iş parçacığı kök iletisini ek ajan bağlamı olarak içerir.
- İleti aracı gönderimleri, aynı odayı (veya aynı DM kullanıcı hedefini) hedeflerken açık bir `threadId` sağlanmadığı sürece mevcut Matrix iş parçacığını otomatik olarak devralır.
- DM kullanıcı hedefi yeniden kullanımı yalnızca mevcut oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi halde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn` Matrix odalarında ve DM'lerde çalışır.
- Üst düzey `/focus`, `threadBindings.spawnSessions` etkinleştirildiğinde yeni bir Matrix iş parçacığı oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığının içinde `/focus` veya `/acp spawn --thread here` çalıştırmak, o iş parçacığını yerinde bağlar.

OpenClaw, aynı paylaşılan oturumdaki başka bir DM odasıyla çakışan bir Matrix DM odası algıladığında, o odada `/focus` çıkış yolunu gösteren ve `dm.sessionScope` değişikliği öneren tek seferlik bir `m.notice` gönderir. Bildirim yalnızca iş parçacığı bağlamaları etkinleştirildiğinde görünür.

## ACP konuşma bağlamaları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyini değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odada, mevcut DM/oda sohbet yüzeyi olarak kalır ve gelecekteki iletiler oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığının içinde, `--bind here` mevcut iş parçacığını yerinde bağlar.
- `/new` ve `/reset` aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close` ACP oturumunu kapatır ve bağlamayı kaldırır.

Notlar:

- `--bind here` alt Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnSessions`, OpenClaw'ın bir alt Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` komutunu sınırlar.

### İş parçacığı bağlama yapılandırması

Matrix genel varsayılanları `session.threadBindings` üzerinden devralır ve kanal başına geçersiz kılmaları da destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix iş parçacığına bağlı oturum oluşturma varsayılan olarak açıktır:

- Üst düzey `/focus` ve `/acp spawn --thread auto|here` komutlarının Matrix iş parçacıkları oluşturmasını/bağlamasını engellemek için `threadBindings.spawnSessions: false` ayarlayın.
- Yerel alt ajan iş parçacığı oluşturmaları üst transkripti çatallamamalıysa `threadBindings.defaultSpawnContext: "isolated"` ayarlayın.

## Tepkiler

Matrix giden tepkileri, gelen tepki bildirimlerini ve ack tepkilerini destekler.

Giden tepki araçları `channels.matrix.actions.reactions` ile sınırlandırılır:

- `react`, bir Matrix olayına tepki ekler.
- `reactions`, bir Matrix olayı için mevcut tepki özetini listeler.
- `emoji=""`, botun o olaydaki kendi tepkilerini kaldırır.
- `remove: true`, yalnızca belirtilen emoji tepkisini bottan kaldırır.

**Çözümleme sırası** (ilk tanımlanan değer kazanır):

| Ayar                    | Sıra                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | hesap başına → kanal → `messages.ackReaction` → ajan kimliği emoji yedeği        |
| `ackReactionScope`      | hesap başına → kanal → `messages.ackReactionScope` → varsayılan `"group-mentions"` |
| `reactionNotifications` | hesap başına → kanal → varsayılan `"own"`                                        |

`reactionNotifications: "own"`, bot tarafından yazılmış Matrix iletilerini hedeflediklerinde eklenen `m.reaction` olaylarını iletir; `"off"` tepki sistemi olaylarını devre dışı bırakır. Tepki kaldırmaları sistem olaylarına dönüştürülmez, çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil redaksiyonlar olarak sunar.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda iletisi ajanı tetiklediğinde kaç son oda iletisinin `InboundHistory` olarak dahil edileceğini denetler. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmamışsa etkili varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca odaya aittir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca beklemedekilerden oluşur: OpenClaw henüz yanıt tetiklememiş oda iletilerini arabelleğe alır, ardından bir mention veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Mevcut tetikleyici ileti `InboundHistory` içine dahil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda iletilerine kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, alınan yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi tamamlayıcı oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Tamamlayıcı bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, tamamlayıcı bağlamı etkin oda/kullanıcı allowlist denetimleri tarafından izin verilen göndericilere filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de açıkça alıntılanmış bir yanıtı tutar.

Bu ayar, gelen iletinin kendisinin yanıt tetikleyip tetikleyemeyeceğini değil, tamamlayıcı bağlam görünürlüğünü etkiler.
Tetikleme yetkilendirmesi hâlâ `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilke ayarlarından gelir.

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
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Odaları çalışır durumda tutarken DM'leri tamamen susturmak için `dm.enabled: false` ayarlayın:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Mention geçitleme ve allowlist davranışı için [Gruplar](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size ileti göndermeye devam ederse, OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinden sonra anımsatıcı yanıt gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Eşleştirme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan ileti durumu eşzamanlılıktan çıkarsa OpenClaw, canlı DM yerine eski solo odalara işaret eden eski `m.direct` eşlemeleriyle kalabilir. Bir eş için mevcut eşlemeyi inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Her iki komut da çok hesaplı kurulumlar için `--account <id>` kabul eder. Onarım akışı:

- zaten `m.direct` içinde eşlenmiş katı bir 1:1 DM'yi tercih eder
- o kullanıcıyla mevcut katılımı olan herhangi bir katı 1:1 DM'ye geri döner
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Eski odaları otomatik olarak silmez. Sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece gelecekteki Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan ileti akışları doğru odayı hedefler.

## Çalıştırma onayları

Matrix yerel bir onay istemcisi olarak davranabilir. `channels.matrix.execApprovals` altında yapılandırın (veya hesap başına geçersiz kılma için `channels.matrix.accounts.<account>.execApprovals`):

- `enabled`: onayları Matrix yerel istemleriyle iletir. Ayarlanmamışsa veya `"auto"` ise, en az bir onaylayıcı çözümlenebildiğinde Matrix otomatik olarak etkinleşir. Açıkça devre dışı bırakmak için `false` ayarlayın.
- `approvers`: çalıştırma isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (`@owner:example.org`). İsteğe bağlıdır; `channels.matrix.dm.allowFrom` değerine geri döner.
- `target`: istemlerin nereye gideceği. `"dm"` (varsayılan) onaylayıcı DM'lerine gönderir; `"channel"` kaynak Matrix odasına veya DM'ye gönderir; `"both"` ikisine de gönderir.
- `agentFilter` / `sessionFilter`: hangi ajanların/oturumların Matrix teslimini tetikleyeceği için isteğe bağlı allowlist'ler.

Yetkilendirme, onay türleri arasında biraz farklıdır:

- **Çalıştırma onayları** `execApprovals.approvers` kullanır ve `dm.allowFrom` değerine geri döner.
- **Plugin onayları** yalnızca `dm.allowFrom` üzerinden yetkilendirir.

Her iki tür de Matrix tepki kısayollarını ve ileti güncellemelerini paylaşır. Onaylayıcılar birincil onay iletisinde tepki kısayollarını görür:

- `✅` bir kez izin ver
- `❌` reddet
- `♾️` her zaman izin ver (etkili çalıştırma ilkesi buna izin verdiğinde)

Yedek slash komutları: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Yalnızca çözümlenen onaylayıcılar onaylayabilir veya reddedebilir. Çalıştırma onayları için kanal teslimi komut metnini içerir; `channel` veya `both` seçeneklerini yalnızca güvenilir odalarda etkinleştirin.

İlgili: [Çalıştırma onayları](/tr/tools/exec-approvals).

## Slash komutları

Slash komutları (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` vb.) doğrudan DM'lerde çalışır. Odalarda OpenClaw, botun kendi Matrix mention'ı ile öneklenmiş komutları da tanır; bu nedenle `@bot:server /new`, özel bir mention regex'i olmadan komut yolunu tetikler. Bu, kullanıcı komutu yazmadan önce botu sekmeyle tamamladığında Element ve benzer istemcilerin yaydığı oda tarzı `@mention /command` gönderilerine botun yanıt vermesini sağlar.

Yetkilendirme kuralları hâlâ geçerlidir: komut göndericileri, düz iletilerle aynı DM veya oda allowlist/sahip ilkelerini karşılamalıdır.

## Çoklu hesap

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

**Devralma:**

- Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadıkça adlandırılmış hesaplar için varsayılan olarak davranır.
- Devralınan bir oda girdisini `groups.<room>.account` ile belirli bir hesaba kapsamlayın. `account` olmayan girdiler hesaplar arasında paylaşılır; varsayılan hesap üst düzeyde yapılandırıldığında `account: "default"` hâlâ çalışır.

**Varsayılan hesap seçimi:**

- Örtük yönlendirme, yoklama ve CLI komutlarının tercih edeceği adlandırılmış hesabı seçmek için `defaultAccount` ayarlayın.
- Birden çok hesabınız varsa ve biri gerçekten `default` olarak adlandırılmışsa, OpenClaw `defaultAccount` ayarlanmamış olsa bile bunu örtük olarak kullanır.
- Birden çok adlandırılmış hesabınız varsa ve varsayılan seçilmemişse, CLI komutları tahmin etmeyi reddeder; `defaultAccount` ayarlayın veya `--account <id>` geçirin.
- Üst düzey `channels.matrix.*` bloğu yalnızca kimlik doğrulaması tamamlandığında (`homeserver` + `accessToken` veya `homeserver` + `userId` + `password`) örtük `default` hesap olarak değerlendirilir. Adlandırılmış hesaplar, önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı karşıladığında `homeserver` + `userId` üzerinden keşfedilebilir kalır.

**Yükseltme:**

- OpenClaw onarım veya kurulum sırasında tek hesaplı bir yapılandırmayı çok hesaplıya yükselttiğinde, varsa mevcut adlandırılmış hesabı veya `defaultAccount` zaten bir hesaba işaret ediyorsa onu korur. Yalnızca Matrix auth/bootstrap anahtarları yükseltilen hesaba taşınır; paylaşılan teslim-ilkesi anahtarları üst düzeyde kalır.

Paylaşılan çoklu hesap deseni için [Yapılandırma başvurusu](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'ları

Varsayılan olarak OpenClaw, SSRF koruması için özel/dahili Matrix homeserver'larını engeller; her hesap için açıkça kabul etmeniz gerekir.

Homeserver'ınız localhost, LAN/Tailscale IP veya dahili bir ana makine adında çalışıyorsa, o Matrix hesabı için `network.dangerouslyAllowPrivateNetwork` etkinleştirin:

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

Bu açık katılım yalnızca güvenilir özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi herkese açık düz metin ana sunucular engellenmeye devam eder. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden yönlendirme

Matrix dağıtımınız açık bir giden HTTP(S) proxy gerektiriyorsa `channels.matrix.proxy` ayarını yapın:

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

Adlandırılmış hesaplar, üst düzey varsayılanı `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir. OpenClaw, çalışma zamanı Matrix trafiği ve hesap durumu yoklamaları için aynı proxy ayarını kullanır.

## Hedef çözümleme

Matrix, OpenClaw'ın sizden oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. Açık teslim hedeflerini, cron işlerini, bağlamaları veya izin listelerini yapılandırırken Matrix'teki oda kimliğinin tam büyük/küçük harf kullanımını kullanın. OpenClaw, depolama için dahili oturum anahtarlarını kanonik tutar; bu nedenle bu küçük harfli anahtarlar Matrix teslim kimlikleri için güvenilir bir kaynak değildir.

Canlı dizin araması, oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o ana sunucudaki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, ardından o hesap için katılınmış oda adlarında arama yapmaya geri döner.
- Katılınmış oda adı araması en iyi çaba esasına göredir. Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa, çalışma zamanı izin listesi çözümlemesi tarafından yok sayılır.

## Yapılandırma başvurusu

İzin listesi tarzı alanlar (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) tam Matrix kullanıcı kimliklerini kabul eder (en güvenlisi). Tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi her değiştiğinde çözümlenir; çözümlenemeyen girişler çalışma zamanında yok sayılır. Oda izin listeleri de aynı nedenle oda kimliklerini veya takma adları tercih eder.

### Hesap ve bağlantı

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı görüntü etiketi.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `accounts`: hesap başına adlandırılmış geçersiz kılmalar. Üst düzey `channels.matrix` değerleri varsayılan olarak devralınır.
- `homeserver`: ana sunucu URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu hesabın `localhost`, LAN/Tailscale IP'leri veya dahili ana makine adlarına bağlanmasına izin verir.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Hesap başına geçersiz kılma desteklenir.
- `userId`: tam Matrix kullanıcı kimliği (`@bot:example.org`).
- `accessToken`: belirteç tabanlı kimlik doğrulama için erişim belirteci. Düz metin ve SecretRef değerleri env/file/exec sağlayıcıları genelinde desteklenir ([Gizli Bilgi Yönetimi](/tr/gateway/secrets)).
- `password`: parola tabanlı oturum açma için parola. Düz metin ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile oturum açma sırasında kullanılan cihaz görüntü adı.
- `avatarUrl`: profil eşitleme ve `profile set` güncellemeleri için depolanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında getirilen en fazla olay sayısı.

### Şifreleme

- `encryption`: E2EE'yi etkinleştirir. Varsayılan: `false`.
- `startupVerification`: `"if-unverified"` (E2EE açıkken varsayılan) veya `"off"`. Bu cihaz doğrulanmamışsa başlangıçta otomatik olarak öz doğrulama ister.
- `startupVerificationCooldownHours`: sonraki otomatik başlangıç isteğinden önceki bekleme süresi. Varsayılan: `24`.

### Erişim ve ilke

- `groupPolicy`: `"open"`, `"allowlist"` veya `"disabled"`. Varsayılan: `"allowlist"`.
- `groupAllowFrom`: oda trafiği için kullanıcı kimlikleri izin listesi.
- `dm.enabled`: `false` olduğunda tüm DM'leri yok sayar. Varsayılan: `true`.
- `dm.policy`: `"pairing"` (varsayılan), `"allowlist"`, `"open"` veya `"disabled"`. Bot odaya katılıp odayı DM olarak sınıflandırdıktan sonra uygulanır; davet işlemeyi etkilemez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimlikleri izin listesi.
- `dm.sessionScope`: `"per-user"` (varsayılan) veya `"per-room"`.
- `dm.threadReplies`: yanıt dizilemesi için yalnızca DM geçersiz kılması (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: yapılandırılmış diğer Matrix bot hesaplarından gelen iletileri kabul eder (`true` veya `"mentions"`).
- `allowlistOnly`: `true` olduğunda, tüm etkin DM ilkelerini (`"disabled"` hariç) ve `"open"` grup ilkelerini `"allowlist"` olmaya zorlar. `"disabled"` ilkelerini değiştirmez.
- `autoJoin`: `"always"`, `"allowlist"` veya `"off"`. Varsayılan: `"off"`. DM tarzı davetler dahil her Matrix davetine uygulanır.
- `autoJoinAllowlist`: `autoJoin` `"allowlist"` olduğunda izin verilen odalar/takma adlar. Takma ad girişleri, davet edilen oda tarafından iddia edilen duruma göre değil, ana sunucuya göre çözümlenir.
- `contextVisibility`: ek bağlam görünürlüğü (`"all"` varsayılan, `"allowlist"`, `"allowlist_quote"`).

### Yanıt davranışı

- `replyToMode`: `"off"`, `"first"`, `"all"` veya `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` veya `"always"`.
- `threadBindings`: diziye bağlı oturum yönlendirme ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `streaming`: `"off"` (varsayılan), `"partial"`, `"quiet"` veya nesne biçimi `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: `true` olduğunda, tamamlanmış asistan blokları ayrı ilerleme iletileri olarak tutulur.
- `markdown`: giden metin için isteğe bağlı Markdown işleme yapılandırması.
- `responsePrefix`: giden yanıtlara eklenen isteğe bağlı dize.
- `textChunkLimit`: `chunkMode: "length"` olduğunda karakter cinsinden giden parça boyutu. Varsayılan: `4000`.
- `chunkMode`: `"length"` (varsayılan, karakter sayısına göre böler) veya `"newline"` (satır sınırlarında böler).
- `historyLimit`: bir oda iletisi agent'ı tetiklediğinde `InboundHistory` olarak eklenen son oda iletilerinin sayısı. `messages.groupChat.historyLimit` değerine geri döner; etkin varsayılan `0` (devre dışı).
- `mediaMaxMb`: giden gönderimler ve gelen işleme için MB cinsinden medya boyutu sınırı.

### Tepki ayarları

- `ackReaction`: bu kanal/hesap için ack tepkisi geçersiz kılması.
- `ackReactionScope`: kapsam geçersiz kılması (`"group-mentions"` varsayılan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: gelen tepki bildirimi modu (`"own"` varsayılan, `"off"`).

### Araçlar ve oda başına geçersiz kılmalar

- `actions`: eylem başına araç kapılama (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: oda başına ilke haritası. Oturum kimliği, çözümlemeden sonra kararlı oda kimliğini kullanır. (`rooms` eski bir takma addır.)
  - `groups.<room>.account`: devralınmış bir oda girişini belirli bir hesapla sınırlar.
  - `groups.<room>.allowBots`: kanal düzeyi ayarın oda başına geçersiz kılınması (`true` veya `"mentions"`).
  - `groups.<room>.users`: oda başına gönderen izin listesi.
  - `groups.<room>.tools`: oda başına araç izin/verme veya reddetme geçersiz kılmaları.
  - `groups.<room>.autoReply`: oda başına bahsetme kapılama geçersiz kılması. `true` o oda için bahsetme gereksinimlerini devre dışı bırakır; `false` bunları yeniden zorunlu kılar.
  - `groups.<room>.skills`: oda başına skill filtresi.
  - `groups.<room>.systemPrompt`: oda başına sistem istemi parçacığı.

### Exec onayı ayarları

- `execApprovals.enabled`: exec onaylarını Matrix yerel istemleri üzerinden teslim eder.
- `execApprovals.approvers`: onay vermesine izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` değerine geri döner.
- `execApprovals.target`: `"dm"` (varsayılan), `"channel"` veya `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: teslim için isteğe bağlı agent/oturum izin listeleri.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme kapılama
- [Kanal Yönlendirme](/tr/channels/channel-routing) - iletiler için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) - erişim modeli ve güçlendirme
