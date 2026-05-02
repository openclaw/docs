---
read_when:
    - OpenClaw'da Matrix'i ayarlama
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix desteği durumu, kurulum ve yapılandırma örnekleri
title: Matris
x-i18n:
    generated_at: "2026-05-02T08:47:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: f280df31cd26182b50613198642285ede1953b546c1593c0723c523ec96635a1
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, OpenClaw için indirilebilir bir kanal Plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, ileti dizilerini, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Kurulum

Kanalı yapılandırmadan önce Matrix'i kurun:

```bash
openclaw plugins install @openclaw/matrix
```

Yerel bir checkout'tan:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`, Plugin'i kaydeder ve etkinleştirir, bu nedenle ayrı bir `openclaw plugins enable matrix` adımı gerekmez. Aşağıdaki kanalı yapılandırana kadar Plugin yine de hiçbir şey yapmaz. Genel Plugin davranışı ve kurulum kuralları için [Plugin'ler](/tr/tools/plugin) bölümüne bakın.

## Kurulum

1. Homeserver'ınızda bir Matrix hesabı oluşturun.
2. `channels.matrix` öğesini `homeserver` + `accessToken` ya da `homeserver` + `userId` + `password` ile yapılandırın.
3. Gateway'i yeniden başlatın.
4. Botla bir DM başlatın veya onu bir odaya davet edin ([otomatik katılma](#auto-join) bölümüne bakın — yeni davetler yalnızca `autoJoin` izin verdiğinde kabul edilir).

### Etkileşimli kurulum

```bash
openclaw channels add
openclaw configure --section channels
```

Sihirbaz şunları sorar: homeserver URL'si, kimlik doğrulama yöntemi (erişim token'ı veya parola), kullanıcı kimliği (yalnızca parola ile kimlik doğrulama), isteğe bağlı cihaz adı, E2EE'nin etkinleştirilip etkinleştirilmeyeceği ve oda erişimi ile otomatik katılmanın yapılandırılıp yapılandırılmayacağı.

Eşleşen `MATRIX_*` ortam değişkenleri zaten varsa ve seçilen hesapta kayıtlı kimlik doğrulama yoksa, sihirbaz bir ortam değişkeni kısayolu sunar. İzin listesini kaydetmeden önce oda adlarını çözmek için `openclaw channels resolve --channel matrix "Project Room"` komutunu çalıştırın. E2EE etkinleştirildiğinde, sihirbaz yapılandırmayı yazar ve [`openclaw matrix encryption setup`](#encryption-and-verification) ile aynı başlangıç hazırlığını çalıştırır.

### Minimal yapılandırma

Token tabanlı:

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

Parola tabanlı (token ilk oturum açmadan sonra önbelleğe alınır):

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

`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir. Varsayılan ayarla bot, siz manuel olarak katılana kadar yeni davetlerden gelen yeni odalarda veya DM'lerde görünmez.

OpenClaw, davet anında davet edilen odanın DM mi yoksa grup mu olduğunu anlayamaz; bu nedenle DM tarzı davetler dahil tüm davetler önce `autoJoin` üzerinden geçer. `dm.policy` yalnızca daha sonra, bot katıldıktan ve oda sınıflandırıldıktan sonra uygulanır.

<Warning>
Botun hangi davetleri kabul edeceğini sınırlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her daveti kabul etmek için `autoJoin: "always"` kullanın.

`autoJoinAllowlist` yalnızca kararlı hedefleri kabul eder: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir; alias girdileri, davet edilen odanın iddia ettiği duruma göre değil, homeserver'a göre çözülür.
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

DM ve oda izin listelerini kararlı kimliklerle doldurmak en iyisidir:

- DM'ler (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` kullanın. Görünen adlar yalnızca homeserver dizini tam olarak bir eşleşme döndürdüğünde çözülür.
- Odalar (`groups`, `autoJoinAllowlist`): `!room:server` veya `#alias:server` kullanın. Adlar, katılmış odalara karşı en iyi çabayla çözülür; çözülemeyen girdiler çalışma zamanında yok sayılır.

### Hesap kimliği normalleştirme

Sihirbaz, kullanıcı dostu bir adı normalleştirilmiş hesap kimliğine dönüştürür. Örneğin, `Ops Bot` değeri `ops-bot` olur. İki hesabın çakışmaması için noktalama işaretleri kapsamlı ortam değişkeni adlarında kaçışlanır: `-` → `_X2D_`; bu nedenle `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşleşir.

### Önbelleğe alınmış kimlik bilgileri

Matrix, önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` altında saklar:

- varsayılan hesap: `credentials.json`
- adlandırılmış hesaplar: `credentials-<account>.json`

Önbelleğe alınmış kimlik bilgileri burada mevcut olduğunda OpenClaw, erişim token'ı yapılandırma dosyasında olmasa bile Matrix'i yapılandırılmış kabul eder; bu kurulum, `openclaw doctor` ve kanal durumu yoklamalarını kapsar.

### Ortam değişkenleri

Eşdeğer yapılandırma anahtarı ayarlanmadığında kullanılır. Varsayılan hesap öneksiz adları kullanır; adlandırılmış hesaplar, son ekten önce eklenen hesap kimliğini kullanır.

| Varsayılan hesap       | Adlandırılmış hesap (`<ID>` normalleştirilmiş hesap kimliğidir) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

`ops` hesabı için adlar `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` vb. olur. Kurtarma anahtarı ortam değişkenleri, anahtarı `--recovery-key-stdin` ile aktardığınızda kurtarma farkındalığı olan CLI akışları (`verify backup restore`, `verify device`, `verify bootstrap`) tarafından okunur.

`MATRIX_HOMESERVER`, çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

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

Matrix yanıt akışı isteğe bağlıdır. `streaming`, OpenClaw'un devam eden asistan yanıtını nasıl ileteceğini denetler; `blockStreaming`, tamamlanan her bloğun kendi Matrix mesajı olarak korunup korunmayacağını denetler.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Canlı yanıt önizlemelerini koruyup geçici araç/ilerleme satırlarını gizlemek için nesne biçimini kullanın:

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

| `streaming`       | Davranış                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (varsayılan) | Tam yanıtı bekler, bir kez gönderir. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | Model mevcut bloğu yazarken normal bir metin mesajını yerinde düzenler. Standart Matrix istemcileri son düzenlemede değil, ilk önizlemede bildirim gönderebilir.              |
| `"quiet"`         | `"partial"` ile aynıdır, ancak mesaj bildirim göndermeyen bir bildirim notudur. Alıcılar yalnızca kullanıcı başına bir push kuralı sonlandırılmış düzenlemeyle eşleştiğinde bildirim alır (aşağıya bakın). |

`blockStreaming`, `streaming` öğesinden bağımsızdır:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (varsayılan)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Mevcut blok için canlı taslak, tamamlanan bloklar mesaj olarak tutulur | Mevcut blok için canlı taslak, yerinde sonlandırılır |
| `"off"`                 | Tamamlanan blok başına bir bildirimli Matrix mesajı                     | Tam yanıt için bir bildirimli Matrix mesajı      |

Notlar:

- Bir önizleme Matrix'in olay başına boyut sınırını aşarsa, OpenClaw önizleme akışını durdurur ve yalnızca son iletime geri döner.
- Medya yanıtları ekleri her zaman normal şekilde gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa, OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Matrix önizleme akışı etkin olduğunda araç ilerleme önizleme güncellemeleri varsayılan olarak etkindir. Yanıt metni için önizleme düzenlemelerini koruyup araç ilerlemesini normal teslim yolunda bırakmak için `streaming.preview.toolProgress: false` ayarlayın.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En ihtiyatlı hız sınırı profilini istiyorsanız `streaming: "off"` bırakın.

## Onay meta verileri

Matrix yerel onay istemleri, `com.openclaw.approval` altında OpenClaw'a özgü özel olay içeriği bulunan normal `m.room.message` olaylarıdır. Matrix özel olay içeriği anahtarlarına izin verir; bu nedenle standart istemciler metin gövdesini göstermeye devam ederken OpenClaw farkındalığı olan istemciler yapılandırılmış onay kimliğini, türünü, durumunu, kullanılabilir kararları ve exec/Plugin ayrıntılarını okuyabilir.

Bir onay istemi tek bir Matrix olayı için fazla uzunsa, OpenClaw görünen metni parçalara böler ve `com.openclaw.approval` değerini yalnızca ilk parçaya ekler. İzin ver/reddet kararları için tepkiler bu ilk olaya bağlanır; böylece uzun istemler tek olaylı istemlerle aynı onay hedefini korur.

### Sessiz sonlandırılmış önizlemeler için kendi barındırdığınız push kuralları

`streaming: "quiet"`, alıcıları yalnızca bir blok veya tur sonlandırıldığında bilgilendirir; kullanıcı başına bir push kuralının sonlandırılmış önizleme işaretiyle eşleşmesi gerekir. Tam tarif için [sessiz önizlemeler için Matrix push kuralları](/tr/channels/matrix-push-rules) bölümüne bakın (alıcı token'ı, pusher denetimi, kural kurulumu, homeserver başına notlar).

## Bottan bota odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Ajanlar arası Matrix trafiğini bilinçli olarak istediğinizde `allowBots` kullanın:

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
- `groups.<room>.allowBots`, bir oda için hesap düzeyi ayarı geçersiz kılar.
- OpenClaw, kendi kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine de yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw "bot tarafından yazılmış" ifadesini "bu OpenClaw Gateway üzerinde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak ele alır.

Paylaşılan odalarda bottan bota trafiği etkinleştirirken sıkı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifreli (E2EE) odalarda, giden görüntü olayları `thumbnail_file` kullanır; böylece görüntü önizlemeleri tam ekle birlikte şifrelenir. Şifresiz odalar düz `thumbnail_url` kullanmaya devam eder. Yapılandırma gerekmez — Plugin, E2EE durumunu otomatik olarak algılar.

Tüm `openclaw matrix` komutları `--verbose` (tam tanılama), `--json` (makine tarafından okunabilir çıktı) ve `--account <id>` (çok hesaplı kurulumlar) seçeneklerini kabul eder. Çıktı, sessiz dahili SDK günlüğüyle varsayılan olarak özlüdür. Aşağıdaki örnekler kanonik biçimi gösterir; bayrakları gerektiği gibi ekleyin.

### Şifrelemeyi etkinleştirme

```bash
openclaw matrix encryption setup
```

Gerekirse gizli veri depolamayı ve çapraz imzalamayı başlatır, bir oda anahtarı yedeği oluşturur, ardından durumu ve sonraki adımları yazdırır. Yararlı bayraklar:

- `--recovery-key <key>` başlatmadan önce bir kurtarma anahtarı uygular (aşağıda belgelenen stdin biçimini tercih edin)
- `--force-reset-cross-signing` mevcut çapraz imzalama kimliğini atar ve yeni bir tane oluşturur (yalnızca bilinçli olarak kullanın)

Yeni bir hesap için, oluşturma sırasında E2EE'yi etkinleştirin:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption`, `--enable-e2ee` için bir takma addır.

Elle yapılandırma eşdeğeri:

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

- `Locally trusted`: yalnızca bu istemci tarafından güvenilir
- `Cross-signing verified`: SDK, çapraz imzalama üzerinden doğrulama bildirir
- `Signed by owner`: kendi öz imzalama anahtarınızla imzalanmış (yalnızca tanılama amaçlı)

`Verified by owner`, yalnızca `Cross-signing verified` `yes` olduğunda `yes` olur. Yerel güven veya tek başına sahip imzası yeterli değildir.

`--allow-degraded-local-state`, önce Matrix hesabını hazırlamadan en iyi çaba tanılamaları döndürür; çevrimdışı veya kısmen yapılandırılmış yoklamalar için yararlıdır.

### Bu cihazı bir kurtarma anahtarıyla doğrulama

Kurtarma anahtarı hassastır; komut satırında geçirmek yerine stdin üzerinden aktarın. `MATRIX_RECOVERY_KEY` değerini (veya adlandırılmış bir hesap için `MATRIX_<ID>_RECOVERY_KEY`) ayarlayın:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Komut üç durum bildirir:

- `Recovery key accepted`: Matrix, gizli veri depolama veya cihaz güveni için anahtarı kabul etti.
- `Backup usable`: oda anahtarı yedeği güvenilen kurtarma materyaliyle yüklenebilir.
- `Device verified by owner`: bu cihaz tam Matrix çapraz imzalama kimliği güvenine sahiptir.

Kurtarma anahtarı yedek materyalin kilidini açmış olsa bile tam kimlik güveni eksikse sıfır olmayan kodla çıkar. Bu durumda, başka bir Matrix istemcisinden öz doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

`verify self`, başarılı şekilde çıkmadan önce `Cross-signing verified: yes` için bekler. Beklemeyi ayarlamak için `--timeout-ms <ms>` kullanın.

Değişmez anahtar biçimi `openclaw matrix verify device "<recovery-key>"` de kabul edilir, ancak anahtar kabuk geçmişinize girer.

### Çapraz imzalamayı başlatma veya onarma

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap`, şifreli hesaplar için onarım ve kurulum komutudur. Sırasıyla şunları yapar:

- mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanarak gizli veri depolamayı başlatır
- çapraz imzalamayı başlatır ve eksik açık anahtarları yükler
- mevcut cihazı işaretler ve çapraz imzalar
- zaten yoksa sunucu tarafında bir oda anahtarı yedeği oluşturur

Homeserver çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa, OpenClaw önce kimlik doğrulamasız, sonra `m.login.dummy`, sonra `m.login.password` dener (`channels.matrix.password` gerektirir).

Yararlı bayraklar:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` ile eşleştirin) veya `--recovery-key <key>`
- mevcut çapraz imzalama kimliğini atmak için `--force-reset-cross-signing` (yalnızca bilinçli olarak)

### Oda anahtarı yedeği

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`, sunucu tarafında bir yedeğin var olup olmadığını ve bu cihazın onu çözüp çözemediğini gösterir. `backup restore`, yedeklenmiş oda anahtarlarını yerel kripto deposuna içe aktarır; kurtarma anahtarı zaten diskteyse `--recovery-key-stdin` seçeneğini atlayabilirsiniz.

Bozuk bir yedeği yeni bir temel durumla değiştirmek için (kurtarılamayan eski geçmişin kaybını kabul eder; mevcut yedek gizli verisi yüklenemiyorsa gizli veri depolamayı da yeniden oluşturabilir):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` seçeneğini yalnızca önceki kurtarma anahtarının yeni yedek temel durumunun kilidini açmasını bilinçli olarak durdurmak istediğinizde ekleyin.

### Doğrulamaları listeleme, isteme ve yanıtlama

```bash
openclaw matrix verify list
```

Seçili hesap için bekleyen doğrulama isteklerini listeler.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Bu OpenClaw hesabından bir doğrulama isteği gönderir. `--own-user` öz doğrulama ister (aynı kullanıcının başka bir Matrix istemcisindeki istemi kabul edersiniz); `--user-id`/`--device-id`/`--room-id` başka birini hedefler. `--own-user`, diğer hedefleme bayraklarıyla birleştirilemez.

Daha düşük düzeyli yaşam döngüsü işlemleri için — genellikle başka bir istemciden gelen istekleri izlerken — bu komutlar belirli bir `<id>` isteği üzerinde çalışır (`verify list` ve `verify request` tarafından yazdırılır):

| Komut                                      | Amaç                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Gelen bir isteği kabul et                                           |
| `openclaw matrix verify start <id>`        | SAS akışını başlat                                                  |
| `openclaw matrix verify sas <id>`          | SAS emojilerini veya ondalıklarını yazdır                           |
| `openclaw matrix verify confirm-sas <id>`  | SAS'nin diğer istemcinin gösterdiğiyle eşleştiğini onayla           |
| `openclaw matrix verify mismatch-sas <id>` | Emoji veya ondalıklar eşleşmediğinde SAS'yi reddet                  |
| `openclaw matrix verify cancel <id>`       | İptal et; isteğe bağlı `--reason <text>` ve `--code <matrix-code>` alır |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` ve `cancel`, doğrulama belirli bir doğrudan mesaj odasına bağlı olduğunda DM takip ipuçları olarak `--user-id` ve `--room-id` kabul eder.

### Çoklu hesap notları

`--account <id>` olmadan, Matrix CLI komutları örtük varsayılan hesabı kullanır. Birden fazla adlandırılmış hesabınız varsa ve `channels.matrix.defaultAccount` ayarlanmamışsa, tahminde bulunmayı reddeder ve sizden seçim yapmanızı ister. Adlandırılmış bir hesap için E2EE devre dışıysa veya kullanılamıyorsa, hatalar o hesabın yapılandırma anahtarını gösterir; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Başlangıç davranışı">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz, başka bir Matrix istemcisinde öz doğrulama ister, yinelenenleri atlar ve bir bekleme süresi uygular (varsayılan olarak 24 saat). `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca mevcut gizli veri depolamayı ve çapraz imzalama kimliğini yeniden kullanan tutucu bir kripto başlatma geçişi çalıştırır. Başlatma durumu bozuksa, OpenClaw `channels.matrix.password` olmadan bile korumalı bir onarım dener; homeserver parola UIA gerektiriyorsa, başlangıç bir uyarı günlüğe yazar ve ölümcül olmayan durumda kalır. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix migration](/tr/channels/matrix-migration) bölümüne bakın.

  </Accordion>

  <Accordion title="Doğrulama bildirimleri">
    Matrix, doğrulama yaşam döngüsü bildirimlerini sıkı DM doğrulama odasına `m.notice` iletileri olarak gönderir: istek, hazır ("Verify by emoji" rehberliğiyle), başlatma/tamamlama ve mevcut olduğunda SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik olarak kabul edilir. Öz doğrulama için OpenClaw SAS akışını otomatik olarak başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar; yine de Matrix istemcinizde karşılaştırıp "They match" seçeneğini onaylamanız gerekir.

    Doğrulama sistem bildirimleri aracı sohbet işlem hattına iletilmez.

  </Accordion>

  <Accordion title="Silinmiş veya geçersiz Matrix cihazı">
    `verify status`, mevcut cihazın artık homeserver üzerinde listelenmediğini söylüyorsa yeni bir OpenClaw Matrix cihazı oluşturun. Parola ile oturum açma için:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Token kimlik doğrulaması için, Matrix istemcinizde veya yönetici UI'nizde yeni bir erişim token'ı oluşturun, ardından OpenClaw'ı güncelleyin:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` yerine başarısız komuttaki hesap kimliğini kullanın veya varsayılan hesap için `--account` seçeneğini atlayın.

  </Accordion>

  <Accordion title="Cihaz hijyeni">
    Eski OpenClaw tarafından yönetilen cihazlar birikebilir. Listeleyin ve budayın:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kripto deposu">
    Matrix E2EE, IndexedDB shim'i olarak `fake-indexeddb` ile resmi `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` dosyasında kalıcı olur (kısıtlayıcı dosya izinleriyle).

    Şifreli çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında bulunur ve eşitleme deposunu, kripto deposunu, kurtarma anahtarını, IDB anlık görüntüsünü, iş parçacığı bağlamalarını ve başlangıç doğrulama durumunu içerir. Token değiştiğinde ancak hesap kimliği aynı kaldığında, OpenClaw önceki durum görünür kalacak şekilde mevcut en iyi kökü yeniden kullanır.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçili hesap için Matrix öz profilini güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

İki seçeneği de tek çağrıda geçirebilirsiniz. Matrix `mxc://` avatar URL'lerini doğrudan kabul eder; `http://` veya `https://` geçirdiğinizde OpenClaw önce dosyayı yükler ve çözümlenen `mxc://` URL'sini `channels.matrix.avatarUrl` içine (veya hesap başına geçersiz kılmaya) kaydeder.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de ileti aracı gönderimleri için yerel Matrix iş parçacıklarını destekler. Davranışı iki bağımsız ayar denetler:

### Oturum yönlendirme (`sessionScope`)

`dm.sessionScope`, Matrix DM odalarının OpenClaw oturumlarıyla nasıl eşleşeceğini belirler:

- `"per-user"` (varsayılan): aynı yönlendirilen eşe sahip tüm DM odaları tek bir oturumu paylaşır.
- `"per-room"`: eş aynı olsa bile her Matrix DM odası kendi oturum anahtarını alır.

Açık konuşma bağlamaları her zaman `sessionScope` üzerinde önceliklidir; bu nedenle bağlanmış odalar ve iş parçacıkları seçtikleri hedef oturumu korur.

### Yanıt iş parçacığı oluşturma (`threadReplies`)

`threadReplies`, botun yanıtını nereye göndereceğini belirler:

- `"off"`: yanıtlar üst düzeydedir. Gelen iş parçacıklı iletiler üst oturumda kalır.
- `"inbound"`: yalnızca gelen ileti zaten o iş parçacığındaysa bir iş parçacığı içinde yanıt verir.
- `"always"`: tetikleyen iletide köklenen bir iş parçacığı içinde yanıt verir; bu konuşma ilk tetikleyiciden itibaren eşleşen iş parçacığı kapsamlı bir oturum üzerinden yönlendirilir.

`dm.threadReplies` bunu yalnızca DM'ler için geçersiz kılar; örneğin, DM'leri düz tutarken oda iş parçacıklarını yalıtılmış tutun.

### İş parçacığı kalıtımı ve eğik çizgi komutları

- Gelen iş parçacıklı iletiler, iş parçacığının kök iletisini ek aracı bağlamı olarak içerir.
- Message-tool gönderimleri, açık bir `threadId` sağlanmadığı sürece aynı odayı (veya aynı DM kullanıcı hedefini) hedeflerken geçerli Matrix iş parçacığını otomatik olarak devralır.
- DM kullanıcı hedefi yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi takdirde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey `/focus`, `threadBindings.spawnSessions` etkin olduğunda yeni bir Matrix iş parçacığı oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak, o iş parçacığını yerinde bağlar.

OpenClaw, aynı paylaşılan oturumda başka bir DM odasıyla çakışan bir Matrix DM odası algıladığında, o odada `/focus` kaçış yolunu işaret eden ve `dm.sessionScope` değişikliği öneren tek seferlik bir `m.notice` gönderir. Bildirim yalnızca iş parçacığı bağlamaları etkin olduğunda görünür.

## ACP konuşma bağlamaları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyi değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında, geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki iletiler oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığı içinde, `--bind here` geçerli iş parçacığını yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Notlar:

- `--bind here` bir alt Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnSessions`, OpenClaw'ın bir alt Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` komutlarını geçitler.

### İş parçacığı bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` üzerinden devralır ve kanal bazlı geçersiz kılmaları da destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix iş parçacığına bağlı oturum oluşturma varsayılan olarak açıktır:

- Üst düzey `/focus` ve `/acp spawn --thread auto|here` komutlarının Matrix iş parçacıkları oluşturmasını/bağlamasını engellemek için `threadBindings.spawnSessions: false` ayarlayın.
- Yerel alt aracı iş parçacığı oluşturma işlemlerinin üst dökümü çatallamaması gerektiğinde `threadBindings.defaultSpawnContext: "isolated"` ayarlayın.

## Tepkiler

Matrix, giden tepkileri, gelen tepki bildirimlerini ve onay tepkilerini destekler.

Giden tepki araçları `channels.matrix.actions.reactions` ile geçitlenir:

- `react`, bir Matrix olayına tepki ekler.
- `reactions`, bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, botun o olaydaki kendi tepkilerini kaldırır.
- `remove: true`, bottan yalnızca belirtilen emoji tepkisini kaldırır.

**Çözüm sırası** (ilk tanımlı değer kazanır):

| Ayar                    | Sıra                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | hesap bazında → kanal → `messages.ackReaction` → aracı kimliği emoji geri dönüşü |
| `ackReactionScope`      | hesap bazında → kanal → `messages.ackReactionScope` → varsayılan `"group-mentions"` |
| `reactionNotifications` | hesap bazında → kanal → varsayılan `"own"`                                       |

`reactionNotifications: "own"`, bot tarafından yazılmış Matrix iletilerini hedeflediklerinde eklenen `m.reaction` olaylarını iletir; `"off"` tepki sistemi olaylarını devre dışı bırakır. Tepki kaldırmaları sistem olaylarına dönüştürülmez, çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak yüzeye çıkarır.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda iletisi aracı tetiklediğinde kaç yeni oda iletisinin `InboundHistory` olarak ekleneceğini kontrol eder. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmamışsa etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca odaya özeldir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyenlere yöneliktir: OpenClaw, henüz yanıt tetiklememiş oda iletilerini tamponlar, ardından bir bahsetme veya başka bir tetikleyici geldiğinde o pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici ileti `InboundHistory` içine dahil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda iletilerine doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` kontrolünü destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı izin listesi kontrolleri tarafından izin verilen göndericilerle sınırlar.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de açıkça alıntılanmış tek bir yanıtı tutar.

Bu ayar, gelen iletinin kendisinin yanıt tetikleyip tetikleyemeyeceğini değil, ek bağlam görünürlüğünü etkiler.
Tetikleme yetkilendirmesi hâlâ `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilkesi ayarlarından gelir.

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

Bahsetme geçitlemesi ve izin listesi davranışı için [Gruplar](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size ileti göndermeye devam ederse, OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinden sonra anımsatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Eşleştirme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan ileti durumu eşzamanlamadan çıkarsa, OpenClaw canlı DM yerine eski tek kişilik odaları işaret eden bayat `m.direct` eşlemeleriyle kalabilir. Bir eş için geçerli eşlemeyi inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Her iki komut da çok hesaplı kurulumlar için `--account <id>` kabul eder. Onarım akışı:

- `m.direct` içinde zaten eşlenmiş katı bir 1:1 DM'yi tercih eder
- o kullanıcıyla şu anda katılınmış herhangi bir katı 1:1 DM'ye geri döner
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Eski odaları otomatik olarak silmez. Sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece gelecekteki Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan ileti akışları doğru odayı hedefler.

## Exec onayları

Matrix, yerel bir onay istemcisi olarak davranabilir. `channels.matrix.execApprovals` altında yapılandırın (veya hesap bazlı geçersiz kılma için `channels.matrix.accounts.<account>.execApprovals`):

- `enabled`: onayları Matrix yerel istemleri üzerinden iletir. Ayarlanmamışsa veya `"auto"` ise Matrix, en az bir onaylayıcı çözümlenebildiğinde otomatik olarak etkinleşir. Açıkça devre dışı bırakmak için `false` ayarlayın.
- `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (`@owner:example.org`). İsteğe bağlıdır; `channels.matrix.dm.allowFrom` değerine geri döner.
- `target`: istemlerin gideceği yer. `"dm"` (varsayılan) onaylayıcı DM'lerine gönderir; `"channel"` kaynak Matrix odasına veya DM'ye gönderir; `"both"` ikisine de gönderir.
- `agentFilter` / `sessionFilter`: hangi aracıların/oturumların Matrix teslimini tetikleyeceği için isteğe bağlı izin listeleri.

Yetkilendirme, onay türleri arasında biraz farklıdır:

- **Exec onayları**, `execApprovals.approvers` kullanır ve `dm.allowFrom` değerine geri döner.
- **Plugin onayları** yalnızca `dm.allowFrom` üzerinden yetkilendirir.

Her iki tür de Matrix tepki kısayollarını ve ileti güncellemelerini paylaşır. Onaylayıcılar birincil onay iletisinde tepki kısayollarını görür:

- `✅` bir kez izin ver
- `❌` reddet
- `♾️` her zaman izin ver (etkin exec ilkesi buna izin verdiğinde)

Geri dönüş slash komutları: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; `channel` veya `both` seçeneklerini yalnızca güvenilen odalarda etkinleştirin.

İlgili: [Exec onayları](/tr/tools/exec-approvals).

## Slash komutları

Slash komutları (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` vb.) doğrudan DM'lerde çalışır. Odalarda OpenClaw, botun kendi Matrix bahsetmesiyle ön eklenmiş komutları da tanır; böylece `@bot:server /new`, özel bir bahsetme regex'i olmadan komut yolunu tetikler. Bu, botu Element ve benzeri istemcilerin bir kullanıcı komutu yazmadan önce botu sekmeyle tamamladığında yaydığı oda tarzı `@mention /command` gönderilerine duyarlı tutar.

Yetkilendirme kuralları hâlâ geçerlidir: komut gönderenler, düz iletilerle aynı DM veya oda izin listesi/sahip ilkelerini karşılamalıdır.

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

**Devralma:**

- Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadığı sürece adlandırılmış hesaplar için varsayılan olarak davranır.
- Devralınmış bir oda girdisini `groups.<room>.account` ile belirli bir hesaba kapsamlayın. `account` olmayan girdiler hesaplar arasında paylaşılır; varsayılan hesap üst düzeyde yapılandırıldığında `account: "default"` hâlâ çalışır.

**Varsayılan hesap seçimi:**

- Örtük yönlendirme, yoklama ve CLI komutlarının tercih edeceği adlandırılmış hesabı seçmek için `defaultAccount` ayarlayın.
- Birden fazla hesabınız varsa ve biri gerçekten `default` olarak adlandırılmışsa, `defaultAccount` ayarlanmamış olsa bile OpenClaw bunu örtük olarak kullanır.
- Birden fazla adlandırılmış hesabınız varsa ve varsayılan seçilmemişse, CLI komutları tahmin yürütmeyi reddeder; `defaultAccount` ayarlayın veya `--account <id>` geçin.
- Üst düzey `channels.matrix.*` bloğu yalnızca kimlik doğrulaması tamamlandığında (`homeserver` + `accessToken` veya `homeserver` + `userId` + `password`) örtük `default` hesap olarak ele alınır. Adlandırılmış hesaplar, önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı kapsadığında `homeserver` + `userId` üzerinden keşfedilebilir kalır.

**Yükseltme:**

- OpenClaw, onarım veya kurulum sırasında tek hesaplı yapılandırmayı çok hesaplıya yükselttiğinde, varsa mevcut adlandırılmış hesabı veya `defaultAccount` zaten bir hesabı işaret ediyorsa onu korur. Yalnızca Matrix kimlik doğrulama/önyükleme anahtarları yükseltilen hesaba taşınır; paylaşılan teslim ilkesi anahtarları üst düzeyde kalır.

Paylaşılan çok hesaplı desen için [Yapılandırma başvurusu](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'ları

Varsayılan olarak OpenClaw, siz hesap bazında açıkça kabul etmediğiniz sürece SSRF koruması için özel/dahili Matrix homeserver'larını engeller.

Homeserver'ınız localhost, LAN/Tailscale IP'si veya dahili ana makine adında çalışıyorsa, ilgili Matrix hesabı için
`network.dangerouslyAllowPrivateNetwork` seçeneğini etkinleştirin:

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

Bu isteğe bağlı etkinleştirme yalnızca güvenilen özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi genel açık metin homeserver'lar engellenmiş olarak kalır. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden yönlendirme

Matrix dağıtımınız açık bir giden HTTP(S) proxy'si gerektiriyorsa `channels.matrix.proxy` ayarını yapın:

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

Adlandırılmış hesaplar, üst düzey varsayılanı `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir. OpenClaw, çalışma zamanı Matrix trafiği ve hesap durum yoklamaları için aynı proxy ayarını kullanır.

## Hedef çözümleme

Matrix, OpenClaw sizden oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Matrix oda ID'leri büyük/küçük harfe duyarlıdır. Açık teslim hedeflerini, Cron işlerini, bağlamaları veya izin listelerini yapılandırırken Matrix'teki tam oda ID'si büyük/küçük harf kullanımını kullanın. OpenClaw, depolama için dahili oturum anahtarlarını kanonik tutar; bu nedenle bu küçük harfli anahtarlar Matrix teslim ID'leri için güvenilir bir kaynak değildir.

Canlı dizin araması, oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, ilgili homeserver'daki Matrix kullanıcı dizinini sorgular.
- Oda aramaları, açık oda ID'lerini ve takma adları doğrudan kabul eder, ardından bu hesap için katılınmış oda adlarında aramaya geri döner.
- Katılınmış oda adı araması en iyi çaba esasına dayanır. Bir oda adı bir ID'ye veya takma ada çözümlenemezse, çalışma zamanı izin listesi çözümlemesi tarafından yok sayılır.

## Yapılandırma başvurusu

İzin listesi tarzı alanlar (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) tam Matrix kullanıcı ID'lerini kabul eder (en güvenlisi). Tam dizin eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi değiştiğinde çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır. Oda izin listeleri aynı nedenle oda ID'lerini veya takma adları tercih eder.

### Hesap ve bağlantı

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı görünen etiket.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap ID'si.
- `accounts`: hesap başına adlandırılmış geçersiz kılmalar. Üst düzey `channels.matrix` değerleri varsayılan olarak devralınır.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu hesabın `localhost`, LAN/Tailscale IP'leri veya dahili ana adlarına bağlanmasına izin verir.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Hesap başına geçersiz kılma desteklenir.
- `userId`: tam Matrix kullanıcı ID'si (`@bot:example.org`).
- `accessToken`: belirteç tabanlı kimlik doğrulama için erişim belirteci. Düz metin ve SecretRef değerleri env/file/exec sağlayıcıları genelinde desteklenir ([Gizli Bilgi Yönetimi](/tr/gateway/secrets)).
- `password`: parola tabanlı oturum açma için parola. Düz metin ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz ID'si.
- `deviceName`: parola ile oturum açma sırasında kullanılan cihaz görünen adı.
- `avatarUrl`: profil eşitleme ve `profile set` güncellemeleri için saklanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında getirilen en fazla olay sayısı.

### Şifreleme

- `encryption`: E2EE'yi etkinleştirir. Varsayılan: `false`.
- `startupVerification`: `"if-unverified"` (E2EE açıkken varsayılan) veya `"off"`. Bu cihaz doğrulanmamışsa başlangıçta otomatik olarak öz doğrulama ister.
- `startupVerificationCooldownHours`: sonraki otomatik başlangıç isteğinden önceki bekleme süresi. Varsayılan: `24`.

### Erişim ve ilke

- `groupPolicy`: `"open"`, `"allowlist"` veya `"disabled"`. Varsayılan: `"allowlist"`.
- `groupAllowFrom`: oda trafiği için kullanıcı ID'leri izin listesi.
- `dm.enabled`: `false` olduğunda tüm DM'leri yok sayar. Varsayılan: `true`.
- `dm.policy`: `"pairing"` (varsayılan), `"allowlist"`, `"open"` veya `"disabled"`. Bot odaya katılıp odayı DM olarak sınıflandırdıktan sonra uygulanır; davet işlemeyi etkilemez.
- `dm.allowFrom`: DM trafiği için kullanıcı ID'leri izin listesi.
- `dm.sessionScope`: `"per-user"` (varsayılan) veya `"per-room"`.
- `dm.threadReplies`: yanıt iş parçacığı oluşturma için yalnızca DM geçersiz kılması (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: yapılandırılmış diğer Matrix bot hesaplarından gelen iletileri kabul eder (`true` veya `"mentions"`).
- `allowlistOnly`: `true` olduğunda tüm etkin DM ilkelerini (`"disabled"` hariç) ve `"open"` grup ilkelerini `"allowlist"` olmaya zorlar. `"disabled"` ilkelerini değiştirmez.
- `autoJoin`: `"always"`, `"allowlist"` veya `"off"`. Varsayılan: `"off"`. DM tarzı davetler dahil her Matrix davetine uygulanır.
- `autoJoinAllowlist`: `autoJoin` `"allowlist"` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri, davet edilen odanın iddia ettiği duruma göre değil, homeserver'a göre çözümlenir.
- `contextVisibility`: ek bağlam görünürlüğü (`"all"` varsayılan, `"allowlist"`, `"allowlist_quote"`).

### Yanıt davranışı

- `replyToMode`: `"off"`, `"first"`, `"all"` veya `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` veya `"always"`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirme ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `streaming`: `"off"` (varsayılan), `"partial"`, `"quiet"` veya nesne biçimi `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: `true` olduğunda, tamamlanmış asistan blokları ayrı ilerleme iletileri olarak tutulur.
- `markdown`: giden metin için isteğe bağlı Markdown işleme yapılandırması.
- `responsePrefix`: giden yanıtlara eklenen isteğe bağlı dize.
- `textChunkLimit`: `chunkMode: "length"` olduğunda karakter cinsinden giden parça boyutu. Varsayılan: `4000`.
- `chunkMode`: `"length"` (varsayılan, karakter sayısına göre böler) veya `"newline"` (satır sınırlarında böler).
- `historyLimit`: bir oda iletisi ajanı tetiklediğinde `InboundHistory` olarak dahil edilen son oda iletilerinin sayısı. `messages.groupChat.historyLimit` değerine geri döner; etkin varsayılan `0` (devre dışı).
- `mediaMaxMb`: giden gönderimler ve gelen işleme için MB cinsinden medya boyutu üst sınırı.

### Tepki ayarları

- `ackReaction`: bu kanal/hesap için onay tepkisi geçersiz kılması.
- `ackReactionScope`: kapsam geçersiz kılması (`"group-mentions"` varsayılan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: gelen tepki bildirimi modu (`"own"` varsayılan, `"off"`).

### Araçlar ve oda başına geçersiz kılmalar

- `actions`: eylem başına araç geçidi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: oda başına ilke eşlemi. Oturum kimliği, çözümlemeden sonra kararlı oda ID'sini kullanır. (`rooms` eski bir takma addır.)
  - `groups.<room>.account`: devralınmış bir oda girdisini belirli bir hesapla sınırlar.
  - `groups.<room>.allowBots`: kanal düzeyi ayarın oda başına geçersiz kılınması (`true` veya `"mentions"`).
  - `groups.<room>.users`: oda başına gönderen izin listesi.
  - `groups.<room>.tools`: oda başına araç izin verme/reddetme geçersiz kılmaları.
  - `groups.<room>.autoReply`: oda başına bahsetme geçidi geçersiz kılması. `true` o oda için bahsetme gereksinimlerini devre dışı bırakır; `false` bunları yeniden zorunlu kılar.
  - `groups.<room>.skills`: oda başına Skills filtresi.
  - `groups.<room>.systemPrompt`: oda başına sistem istemi parçacığı.

### Exec onay ayarları

- `execApprovals.enabled`: exec onaylarını Matrix'e özgü istemler aracılığıyla iletir.
- `execApprovals.approvers`: onaylamasına izin verilen Matrix kullanıcı ID'leri. `dm.allowFrom` değerine geri döner.
- `execApprovals.target`: `"dm"` (varsayılan), `"channel"` veya `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: teslim için isteğe bağlı ajan/oturum izin listeleri.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sertleştirme
