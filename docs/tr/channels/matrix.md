---
read_when:
    - OpenClaw’da Matrix kurulumu
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matris
x-i18n:
    generated_at: "2026-05-06T09:03:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, OpenClaw için indirilebilir bir kanal Plugin’idir.
Resmi `matrix-js-sdk` kullanır ve DM’leri, odaları, başlıkları, medyayı, tepkileri, anketleri, konumu ve E2EE’yi destekler.

## Kurulum

Kanalı yapılandırmadan önce Matrix’i kurun:

```bash
openclaw plugins install @openclaw/matrix
```

Yerel bir checkout’tan:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` Plugin’i kaydeder ve etkinleştirir; bu yüzden ayrı bir `openclaw plugins enable matrix` adımı gerekmez. Aşağıdaki kanalı yapılandırana kadar Plugin yine de hiçbir şey yapmaz. Genel Plugin davranışı ve kurulum kuralları için [Plugin’ler](/tr/tools/plugin) bölümüne bakın.

## Ayarlama

1. Homeserver’ınızda bir Matrix hesabı oluşturun.
2. `channels.matrix` öğesini `homeserver` + `accessToken` ya da `homeserver` + `userId` + `password` ile yapılandırın.
3. Gateway’i yeniden başlatın.
4. Botla bir DM başlatın veya onu bir odaya davet edin ([otomatik katılma](#auto-join) bölümüne bakın - yeni davetler yalnızca `autoJoin` izin verdiğinde ulaşır).

### Etkileşimli ayarlama

```bash
openclaw channels add
openclaw configure --section channels
```

Sihirbaz şunları sorar: homeserver URL’si, kimlik doğrulama yöntemi (erişim belirteci veya parola), kullanıcı ID’si (yalnızca parola kimlik doğrulaması), isteğe bağlı cihaz adı, E2EE’nin etkinleştirilip etkinleştirilmeyeceği ve oda erişimi ile otomatik katılmanın yapılandırılıp yapılandırılmayacağı.

Eşleşen `MATRIX_*` ortam değişkenleri zaten varsa ve seçilen hesapta kayıtlı kimlik doğrulaması yoksa sihirbaz bir ortam değişkeni kısayolu sunar. Bir izin listesi kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` çalıştırın. E2EE etkinleştirildiğinde sihirbaz yapılandırmayı yazar ve [`openclaw matrix encryption setup`](#encryption-and-verification) ile aynı bootstrap işlemini çalıştırır.

### Minimal yapılandırma

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

Parola tabanlı (ilk girişten sonra belirteç önbelleğe alınır):

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

`channels.matrix.autoJoin` varsayılan olarak `off` olur. Varsayılan ayarda, bot siz elle katılana kadar yeni davetlerden gelen yeni odalarda veya DM’lerde görünmez.

OpenClaw, davet anında davet edilen odanın DM mi yoksa grup mu olduğunu anlayamaz; bu yüzden DM tarzı davetler dahil tüm davetler önce `autoJoin` üzerinden geçer. `dm.policy` yalnızca daha sonra, bot katıldıktan ve oda sınıflandırıldıktan sonra uygulanır.

<Warning>
Botun hangi davetleri kabul edeceğini kısıtlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her daveti kabul etmek için `autoJoin: "always"` kullanın.

`autoJoinAllowlist` yalnızca kararlı hedefleri kabul eder: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir; alias girdileri, davet edilen odanın iddia ettiği duruma göre değil homeserver’a göre çözümlenir.
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

DM ve oda izin listeleri en iyi kararlı ID’lerle doldurulur:

- DM’ler (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` kullanın. Görünen adlar yalnızca homeserver dizini tam olarak bir eşleşme döndürdüğünde çözümlenir.
- Odalar (`groups`, `autoJoinAllowlist`): `!room:server` veya `#alias:server` kullanın. Adlar katılınan odalara göre en iyi çabayla çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır.

### Hesap ID’si normalleştirme

Sihirbaz, kullanıcı dostu bir adı normalleştirilmiş bir hesap ID’sine dönüştürür. Örneğin `Ops Bot`, `ops-bot` olur. İki hesabın çakışamaması için noktalama işaretleri kapsamlı ortam değişkeni adlarında kaçışlanır: `-` → `_X2D_`, bu yüzden `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşlenir.

### Önbelleğe alınan kimlik bilgileri

Matrix, önbelleğe alınan kimlik bilgilerini `~/.openclaw/credentials/matrix/` altında saklar:

- varsayılan hesap: `credentials.json`
- adlandırılmış hesaplar: `credentials-<account>.json`

Burada önbelleğe alınmış kimlik bilgileri varsa, erişim belirteci yapılandırma dosyasında olmasa bile OpenClaw Matrix’i yapılandırılmış kabul eder; bu durum ayarlamayı, `openclaw doctor` komutunu ve kanal durumu yoklamalarını kapsar.

### Ortam değişkenleri

Eşdeğer yapılandırma anahtarı ayarlanmadığında kullanılır. Varsayılan hesap ön eksiz adlar kullanır; adlandırılmış hesaplar, sonekten önce eklenen hesap ID’sini kullanır.

| Varsayılan hesap      | Adlandırılmış hesap (`<ID>` normalleştirilmiş hesap ID’sidir) |
| --------------------- | ------------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                      |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                                    |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                         |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                        |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                       |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                                     |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                                    |

`ops` hesabı için adlar `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` vb. olur. Kurtarma anahtarı ortam değişkenleri, anahtarı `--recovery-key-stdin` ile aktardığınızda kurtarmadan haberdar CLI akışları (`verify backup restore`, `verify device`, `verify bootstrap`) tarafından okunur.

`MATRIX_HOMESERVER`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Yapılandırma örneği

DM eşleştirme, oda izin listesi ve E2EE içeren pratik bir temel yapılandırma:

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

## Streaming önizlemeleri

Matrix yanıt streaming’i isteğe bağlıdır. `streaming`, OpenClaw’un devam eden asistan yanıtını nasıl teslim edeceğini kontrol eder; `blockStreaming` ise tamamlanan her bloğun kendi Matrix mesajı olarak korunup korunmayacağını kontrol eder.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Canlı yanıt önizlemelerini koruyup ara araç/ilerleme satırlarını gizlemek için nesne biçimini kullanın:

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

| `streaming`          | Davranış                                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (varsayılan) | Tam yanıtı bekler, bir kez gönderir. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                      |
| `"partial"`          | Model geçerli bloğu yazarken bir normal metin mesajını yerinde düzenler. Standart Matrix istemcileri son düzenlemede değil, ilk önizlemede bildirim gösterebilir.                  |
| `"quiet"`            | `"partial"` ile aynıdır, ancak mesaj bildirim göndermeyen bir bildirim mesajıdır. Alıcılar yalnızca kullanıcı başına bir push kuralı sonlandırılmış düzenlemeyle eşleştiğinde bildirim alır (aşağıya bakın). |

`blockStreaming`, `streaming`’den bağımsızdır:

| `streaming`             | `blockStreaming: true`                                            | `blockStreaming: false` (varsayılan)                 |
| ----------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Geçerli blok için canlı taslak, tamamlanan bloklar mesaj olarak tutulur | Geçerli blok için canlı taslak, yerinde sonlandırılır |
| `"off"`                 | Tamamlanan blok başına bir bildirimli Matrix mesajı               | Tam yanıt için bir bildirimli Matrix mesajı          |

Notlar:

- Bir önizleme Matrix’in olay başına boyut sınırını aşarsa, OpenClaw önizleme streaming’ini durdurur ve yalnızca son teslimata geri döner.
- Medya yanıtları ekleri her zaman normal şekilde gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa, OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Matrix önizleme streaming’i etkin olduğunda araç ilerleme önizleme güncellemeleri varsayılan olarak etkindir. Yanıt metni için önizleme düzenlemelerini koruyup araç ilerlemesini normal teslimat yolunda bırakmak için `streaming.preview.toolProgress: false` ayarlayın.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En muhafazakar hız sınırı profilini istiyorsanız `streaming: "off"` bırakın.

## Onay metaverileri

Matrix yerel onay istemleri, `com.openclaw.approval` altında OpenClaw’a özgü özel olay içeriği taşıyan normal `m.room.message` olaylarıdır. Matrix özel olay içerik anahtarlarına izin verir; bu nedenle standart istemciler metin gövdesini yine görüntülerken OpenClaw’dan haberdar istemciler yapılandırılmış onay ID’sini, türünü, durumunu, kullanılabilir kararları ve exec/Plugin ayrıntılarını okuyabilir.

Bir onay istemi tek bir Matrix olayı için çok uzunsa, OpenClaw görünen metni parçalara böler ve `com.openclaw.approval` öğesini yalnızca ilk parçaya ekler. İzin ver/reddet kararları için tepkiler bu ilk olaya bağlanır; bu nedenle uzun istemler, tek olaylı istemlerle aynı onay hedefini korur.

### Sessiz sonlandırılmış önizlemeler için self-hosted push kuralları

`streaming: "quiet"` alıcıları yalnızca bir blok veya tur sonlandırıldığında bilgilendirir; kullanıcı başına bir push kuralının sonlandırılmış önizleme işaretçisiyle eşleşmesi gerekir. Tam tarif için [sessiz önizlemeler için Matrix push kuralları](/tr/channels/matrix-push-rules) bölümüne bakın (alıcı belirteci, pusher kontrolü, kural kurulumu, homeserver başına notlar).

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

- `allowBots: true`, izin verilen odalarda ve DM’lerde yapılandırılmış diğer Matrix bot hesaplarından gelen mesajları kabul eder.
- `allowBots: "mentions"`, bu mesajları yalnızca odalarda bu bottan görünür şekilde bahsettiklerinde kabul eder. DM’lere hâlâ izin verilir.
- `groups.<room>.allowBots`, tek bir oda için hesap düzeyi ayarı geçersiz kılar.
- OpenClaw, kendi kendine yanıt döngülerinden kaçınmak için aynı Matrix kullanıcı ID’sinden gelen mesajları yine de yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw, "bot-authored" ifadesini "bu OpenClaw Gateway’de yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak ele alır.

Paylaşılan odalarda bottan bota trafiği etkinleştirirken katı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifreli (E2EE) odalarda, giden görüntü olayları `thumbnail_file` kullanır; böylece görüntü önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Yapılandırma gerekmez; Plugin E2EE durumunu otomatik olarak algılar.

Tüm `openclaw matrix` komutları `--verbose` (tam tanılama), `--json` (makine tarafından okunabilir çıktı) ve `--account <id>` (çok hesaplı ayarlamalar) kabul eder. Çıktı, sessiz dahili SDK günlük kaydıyla varsayılan olarak kısadır. Aşağıdaki örnekler kanonik biçimi gösterir; bayrakları gerektiği gibi ekleyin.

### Şifrelemeyi etkinleştirme

```bash
openclaw matrix encryption setup
```

Gizli veri depolamayı ve çapraz imzalamayı hazırlar, gerekirse bir oda anahtarı yedeği oluşturur, ardından durumu ve sonraki adımları yazdırır. Kullanışlı bayraklar:

- `--recovery-key <key>` hazırlamadan önce bir kurtarma anahtarı uygular (aşağıda belgelenen stdin biçimini tercih edin)
- `--force-reset-cross-signing` geçerli çapraz imzalama kimliğini atar ve yeni bir tane oluşturur (yalnızca bilerek kullanın)

Yeni bir hesap için, oluşturma sırasında E2EE'yi etkinleştirin:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption`, `--enable-e2ee` için bir takma addır.

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

- `Locally trusted`: yalnızca bu istemci tarafından güvenilir
- `Cross-signing verified`: SDK, çapraz imzalama yoluyla doğrulama bildirir
- `Signed by owner`: kendi öz imzalama anahtarınız tarafından imzalanmış (yalnızca tanılama amaçlı)

`Verified by owner`, yalnızca `Cross-signing verified` `yes` olduğunda `yes` olur. Yerel güven veya tek başına bir sahip imzası yeterli değildir.

`--allow-degraded-local-state`, önce Matrix hesabını hazırlamadan en iyi çabayla tanılama döndürür; çevrimdışı veya kısmen yapılandırılmış yoklamalar için kullanışlıdır.

### Bu cihazı bir kurtarma anahtarıyla doğrulama

Kurtarma anahtarı hassastır - komut satırında geçirmek yerine stdin üzerinden aktarın. `MATRIX_RECOVERY_KEY` değerini (veya adlandırılmış bir hesap için `MATRIX_<ID>_RECOVERY_KEY` değerini) ayarlayın:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Komut üç durum bildirir:

- `Recovery key accepted`: Matrix anahtarı gizli veri depolama veya cihaz güveni için kabul etti.
- `Backup usable`: oda anahtarı yedeği, güvenilir kurtarma malzemesiyle yüklenebilir.
- `Device verified by owner`: bu cihaz tam Matrix çapraz imzalama kimliği güvenine sahiptir.

Kurtarma anahtarı yedek malzemeyi açmış olsa bile, tam kimlik güveni eksik olduğunda sıfır olmayan kodla çıkar. Bu durumda, başka bir Matrix istemcisinden öz doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

`verify self`, başarıyla çıkmadan önce `Cross-signing verified: yes` için bekler. Beklemeyi ayarlamak için `--timeout-ms <ms>` kullanın.

Hazır anahtar biçimi olan `openclaw matrix verify device "<recovery-key>"` de kabul edilir, ancak anahtar kabuk geçmişinize yazılır.

### Çapraz imzalamayı hazırlama veya onarma

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap`, şifreli hesaplar için onarma ve kurulum komutudur. Sırayla şunları yapar:

- mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanarak gizli veri depolamayı hazırlar
- çapraz imzalamayı hazırlar ve eksik genel anahtarları yükler
- geçerli cihazı işaretler ve çapraz imzalar
- zaten yoksa sunucu tarafında bir oda anahtarı yedeği oluşturur

Homeserver, çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa, OpenClaw önce kimlik doğrulamasız, sonra `m.login.dummy`, ardından `m.login.password` dener (`channels.matrix.password` gerektirir).

Kullanışlı bayraklar:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` ile eşleştirin) veya `--recovery-key <key>`
- geçerli çapraz imzalama kimliğini atmak için `--force-reset-cross-signing` (yalnızca bilerek)

### Oda anahtarı yedeği

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`, sunucu tarafında bir yedeğin olup olmadığını ve bu cihazın şifresini çözüp çözemediğini gösterir. `backup restore`, yedeklenmiş oda anahtarlarını yerel kripto deposuna içe aktarır; kurtarma anahtarı zaten diskteyse `--recovery-key-stdin` atlanabilir.

Bozuk bir yedeği yeni bir başlangıçla değiştirmek için (kurtarılamayan eski geçmişin kaybedilmesini kabul eder; geçerli yedek sırrı yüklenemiyorsa gizli veri depolamayı da yeniden oluşturabilir):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` yalnızca önceki kurtarma anahtarının yeni yedek başlangıcını açmayı durdurmasını bilerek istediğinizde ekleyin.

### Doğrulamaları listeleme, isteme ve yanıtlama

```bash
openclaw matrix verify list
```

Seçili hesap için bekleyen doğrulama isteklerini listeler.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Bu OpenClaw hesabından bir doğrulama isteği gönderir. `--own-user` öz doğrulama ister (istemi aynı kullanıcının başka bir Matrix istemcisinde kabul edersiniz); `--user-id`/`--device-id`/`--room-id` başka birini hedefler. `--own-user`, diğer hedefleme bayraklarıyla birleştirilemez.

Daha düşük seviyeli yaşam döngüsü yönetimi için - genellikle başka bir istemciden gelen istekleri izlerken - bu komutlar belirli bir `<id>` isteği üzerinde işlem yapar (`verify list` ve `verify request` tarafından yazdırılır):

| Komut                                      | Amaç                                                               |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `openclaw matrix verify accept <id>`       | Gelen bir isteği kabul etme                                        |
| `openclaw matrix verify start <id>`        | SAS akışını başlatma                                               |
| `openclaw matrix verify sas <id>`          | SAS emojisini veya ondalıklarını yazdırma                          |
| `openclaw matrix verify confirm-sas <id>`  | SAS'ın diğer istemcinin gösterdiğiyle eşleştiğini onaylama         |
| `openclaw matrix verify mismatch-sas <id>` | Emoji veya ondalıklar eşleşmediğinde SAS'ı reddetme                |
| `openclaw matrix verify cancel <id>`       | İptal etme; isteğe bağlı `--reason <text>` ve `--code <matrix-code>` alır |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` ve `cancel`, doğrulama belirli bir doğrudan mesaj odasına bağlı olduğunda DM takip ipuçları olarak `--user-id` ve `--room-id` kabul eder.

### Çoklu hesap notları

`--account <id>` olmadan, Matrix CLI komutları örtük varsayılan hesabı kullanır. Birden fazla adlandırılmış hesabınız varsa ve `channels.matrix.defaultAccount` ayarlamadıysanız, tahmin etmeyi reddeder ve sizden seçim yapmanızı ister. Adlandırılmış bir hesap için E2EE devre dışı veya kullanılamaz olduğunda, hatalar o hesabın yapılandırma anahtarını işaret eder; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Başlangıç davranışı">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz başka bir Matrix istemcisinde öz doğrulama ister, yinelemeleri atlar ve bir bekleme süresi uygular (varsayılan olarak 24 saat). `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca geçerli gizli veri depolamayı ve çapraz imzalama kimliğini yeniden kullanan korumacı bir kripto hazırlama geçişi çalıştırır. Hazırlama durumu bozuksa, OpenClaw `channels.matrix.password` olmadan bile korumalı bir onarma dener; homeserver parola UIA gerektiriyorsa, başlangıç bir uyarı günlüğe yazar ve ölümcül olmayan durumda kalır. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix geçişi](/tr/channels/matrix-migration) bölümüne bakın.

  </Accordion>

  <Accordion title="Doğrulama bildirimleri">
    Matrix, doğrulama yaşam döngüsü bildirimlerini katı DM doğrulama odasına `m.notice` mesajları olarak gönderir: istek, hazır ("Emojiyle doğrula" rehberliğiyle), başlatma/tamamlama ve mevcut olduğunda SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik kabul edilir. Öz doğrulama için OpenClaw SAS akışını otomatik olarak başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar - yine de Matrix istemcinizde karşılaştırıp "Eşleşiyorlar" seçeneğini onaylamanız gerekir.

    Doğrulama sistem bildirimleri agent sohbet işlem hattına iletilmez.

  </Accordion>

  <Accordion title="Silinmiş veya geçersiz Matrix cihazı">
    `verify status`, geçerli cihazın artık homeserver üzerinde listelenmediğini söylüyorsa yeni bir OpenClaw Matrix cihazı oluşturun. Parolayla oturum açma için:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Token kimlik doğrulaması için Matrix istemcinizde veya yönetici kullanıcı arayüzünüzde yeni bir erişim token'ı oluşturun, ardından OpenClaw'u güncelleyin:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` değerini başarısız komuttaki hesap kimliğiyle değiştirin veya varsayılan hesap için `--account` değerini atlayın.

  </Accordion>

  <Accordion title="Cihaz temizliği">
    Eski OpenClaw yönetimli cihazlar birikebilir. Listeleyin ve budayın:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kripto deposu">
    Matrix E2EE, IndexedDB shim olarak `fake-indexeddb` ile resmi `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` dosyasına kalıcı olarak yazılır (kısıtlayıcı dosya izinleri).

    Şifreli çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında yaşar ve eşitleme deposunu, kripto deposunu, kurtarma anahtarını, IDB anlık görüntüsünü, iş parçacığı bağlamalarını ve başlangıç doğrulama durumunu içerir. Token değiştiğinde ancak hesap kimliği aynı kaldığında, OpenClaw önceki durum görünür kalacak şekilde en iyi mevcut kökü yeniden kullanır.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçili hesap için Matrix öz profilini güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

İki seçeneği de tek çağrıda geçirebilirsiniz. Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder; `http://` veya `https://` geçtiğinizde OpenClaw önce dosyayı yükler ve çözümlenen `mxc://` URL'sini `channels.matrix.avatarUrl` içine (veya hesap başına geçersiz kılmaya) kaydeder.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de mesaj aracı gönderimleri için yerel Matrix iş parçacıklarını destekler. Davranışı iki bağımsız düğme denetler:

### Oturum yönlendirme (`sessionScope`)

`dm.sessionScope`, Matrix DM odalarının OpenClaw oturumlarıyla nasıl eşleneceğine karar verir:

- `"per-user"` (varsayılan): aynı yönlendirilen eşe sahip tüm DM odaları tek bir oturumu paylaşır.
- `"per-room"`: eş aynı olsa bile her Matrix DM odası kendi oturum anahtarını alır.

Açık konuşma bağlamaları her zaman `sessionScope` değerine üstün gelir; bu nedenle bağlı odalar ve iş parçacıkları seçtikleri hedef oturumu korur.

### Yanıt iş parçacıkları (`threadReplies`)

`threadReplies`, botun yanıtını nereye göndereceğine karar verir:

- `"off"`: yanıtlar üst düzeydedir. Gelen iş parçacıklı mesajlar üst oturumda kalır.
- `"inbound"`: yalnızca gelen mesaj zaten o iş parçacığındaysa bir iş parçacığı içinde yanıt verir.
- `"always"`: tetikleyici mesajda köklenen bir iş parçacığı içinde yanıt verir; bu konuşma ilk tetiklemeden itibaren eşleşen iş parçacığı kapsamlı bir oturum üzerinden yönlendirilir.

`dm.threadReplies` bunu yalnızca DM'ler için geçersiz kılar - örneğin, oda iş parçacıklarını yalıtılmış tutarken DM'leri düz tutun.

### İş parçacığı devralma ve eğik çizgi komutları

- Gelen iş parçacıklı mesajlar, iş parçacığı kök mesajını ek ajan bağlamı olarak içerir.
- Message-tool gönderimleri, aynı odayı (veya aynı DM kullanıcı hedefini) hedeflerken, açık bir `threadId` sağlanmadığı sürece geçerli Matrix iş parçacığını otomatik olarak devralır.
- DM kullanıcı hedefi yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi halde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn`, Matrix odalarında ve DM’lerde çalışır.
- Üst düzey `/focus`, `threadBindings.spawnSessions` etkinleştirildiğinde yeni bir Matrix iş parçacığı oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak, bu iş parçacığını yerinde bağlar.

OpenClaw, aynı paylaşılan oturumda başka bir DM odasıyla çakışan bir Matrix DM odası algıladığında, o odada `/focus` kaçış yolunu işaret eden ve `dm.sessionScope` değişikliği öneren tek seferlik bir `m.notice` gönderir. Bildirim yalnızca iş parçacığı bağlamaları etkin olduğunda görünür.

## ACP konuşma bağlamaları

Matrix odaları, DM’ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyi değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM’si, odası veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM’sinde veya odasında, geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığı içinde, `--bind here` geçerli iş parçacığını yerinde bağlar.
- `/new` ve `/reset` aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close` ACP oturumunu kapatır ve bağlamayı kaldırır.

Notlar:

- `--bind here` bir alt Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnSessions`, OpenClaw’ın bir alt Matrix iş parçacığı oluşturması veya bağlaması gerektiği `/acp spawn --thread auto|here` kullanımını kapılar.

### İş parçacığı bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` öğesinden devralır ve kanal başına geçersiz kılmaları da destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix iş parçacığına bağlı oturum oluşturma varsayılan olarak açıktır:

- Üst düzey `/focus` ve `/acp spawn --thread auto|here` komutlarının Matrix iş parçacıkları oluşturmasını/bağlamasını engellemek için `threadBindings.spawnSessions: false` ayarlayın.
- Yerel alt ajan iş parçacığı oluşturmalarının üst transkripti çatallamaması gerektiğinde `threadBindings.defaultSpawnContext: "isolated"` ayarlayın.

## Tepkiler

Matrix, giden tepkileri, gelen tepki bildirimlerini ve onay tepkilerini destekler.

Giden tepki araçları `channels.matrix.actions.reactions` tarafından kapılanır:

- `react`, bir Matrix olayına tepki ekler.
- `reactions`, bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, botun o olaydaki kendi tepkilerini kaldırır.
- `remove: true`, bottan yalnızca belirtilen emoji tepkisini kaldırır.

**Çözüm sırası** (ilk tanımlı değer kazanır):

| Ayar                    | Sıra                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | hesap başına → kanal → `messages.ackReaction` → ajan kimliği emoji geri dönüşü   |
| `ackReactionScope`      | hesap başına → kanal → `messages.ackReactionScope` → varsayılan `"group-mentions"` |
| `reactionNotifications` | hesap başına → kanal → varsayılan `"own"`                                        |

`reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedeflediklerinde eklenen `m.reaction` olaylarını iletir; `"off"` tepki sistem olaylarını devre dışı bırakır. Tepki kaldırmaları sistem olaylarına dönüştürülmez çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak yüzeye çıkarır.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı ajanı tetiklediğinde kaç son oda mesajının `InboundHistory` olarak dahil edileceğini denetler. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmamışsa etkili varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca odaya aittir. DM’ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyenler içindir: OpenClaw henüz yanıt tetiklememiş oda mesajlarını arabelleğe alır, ardından bir mention veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine dahil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı izin listesi denetimleri tarafından izin verilen göndericilerle sınırlar.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de açıkça alıntılanmış bir yanıtı tutar.

Bu ayar ek bağlam görünürlüğünü etkiler; gelen mesajın kendisinin yanıt tetikleyip tetikleyemeyeceğini etkilemez.
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

Odaları çalışır durumda tutarken DM’leri tamamen susturmak için `dm.enabled: false` ayarlayın:

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

Mention kapılama ve izin listesi davranışı için [Gruplar](/tr/channels/groups) bölümüne bakın.

Matrix DM’leri için eşleme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse, OpenClaw aynı bekleyen eşleme kodunu yeniden kullanır ve yeni bir kod basmak yerine kısa bir bekleme süresinden sonra bir hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleme akışı ve depolama düzeni için [Eşleme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu eşzamanlılıktan çıkarsa, OpenClaw canlı DM yerine eski tekil odaları işaret eden bayat `m.direct` eşlemeleriyle kalabilir. Bir eş için geçerli eşlemeyi inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Her iki komut da çok hesaplı kurulumlar için `--account <id>` kabul eder. Onarım akışı:

- `m.direct` içinde zaten eşlenmiş olan katı bir 1:1 DM’yi tercih eder
- o kullanıcıyla şu anda katılınmış herhangi bir katı 1:1 DM’ye geri döner
- sağlıklı DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Eski odaları otomatik olarak silmez. Sağlıklı DM’yi seçer ve eşlemeyi günceller; böylece gelecekteki Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları doğru odayı hedefler.

## Çalıştırma onayları

Matrix, yerel bir onay istemcisi olarak davranabilir. `channels.matrix.execApprovals` altında yapılandırın (veya hesap başına geçersiz kılma için `channels.matrix.accounts.<account>.execApprovals`):

- `enabled`: onayları Matrix’e özgü istemlerle iletir. Ayarlanmamışsa veya `"auto"` ise, en az bir onaylayıcı çözümlenebildiğinde Matrix otomatik olarak etkinleşir. Açıkça devre dışı bırakmak için `false` ayarlayın.
- `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (`@owner:example.org`). İsteğe bağlıdır; `channels.matrix.dm.allowFrom` değerine geri döner.
- `target`: istemlerin nereye gideceği. `"dm"` (varsayılan) onaylayıcı DM’lerine gönderir; `"channel"` kaynak Matrix odasına veya DM’sine gönderir; `"both"` ikisine de gönderir.
- `agentFilter` / `sessionFilter`: hangi ajanların/oturumların Matrix teslimini tetikleyeceğine yönelik isteğe bağlı izin listeleri.

Yetkilendirme, onay türleri arasında biraz farklılık gösterir:

- **Exec onayları**, `execApprovals.approvers` kullanır ve `dm.allowFrom` değerine geri döner.
- **Plugin onayları** yalnızca `dm.allowFrom` üzerinden yetkilendirilir.

Her iki tür de Matrix tepki kısayollarını ve mesaj güncellemelerini paylaşır. Onaylayıcılar birincil onay mesajında tepki kısayollarını görür:

- `✅` bir kez izin ver
- `❌` reddet
- `♾️` her zaman izin ver (etkili exec ilkesi buna izin verdiğinde)

Geri dönüş slash komutları: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; `channel` veya `both` değerlerini yalnızca güvenilir odalarda etkinleştirin.

İlgili: [Çalıştırma onayları](/tr/tools/exec-approvals).

## Slash komutları

Slash komutları (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` vb.) doğrudan DM’lerde çalışır. Odalarda OpenClaw, botun kendi Matrix mention’ı ile öneklenmiş komutları da tanır; bu nedenle `@bot:server /new`, özel bir mention regex’i olmadan komut yolunu tetikler. Bu, kullanıcı komutu yazmadan önce botu sekmeyle tamamlarken Element ve benzeri istemcilerin yaydığı oda tarzı `@mention /command` gönderilerine botun yanıt vermesini sağlar.

Yetkilendirme kuralları hâlâ geçerlidir: komut göndericileri, düz mesajlarla aynı DM veya oda izin listesi/sahip ilkelerini karşılamalıdır.

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

- Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadığı sürece adlandırılmış hesaplar için varsayılanlar olarak davranır.
- Devralınmış bir oda girdisini `groups.<room>.account` ile belirli bir hesaba kapsamlandırın. `account` olmayan girdiler hesaplar arasında paylaşılır; varsayılan hesap üst düzeyde yapılandırıldığında `account: "default"` hâlâ çalışır.

**Varsayılan hesap seçimi:**

- Örtük yönlendirmenin, yoklamanın ve CLI komutlarının tercih edeceği adlandırılmış hesabı seçmek için `defaultAccount` ayarlayın.
- Birden fazla hesabınız varsa ve biri tam olarak `default` olarak adlandırılmışsa, `defaultAccount` ayarlanmamış olsa bile OpenClaw bunu örtük olarak kullanır.
- Birden fazla adlandırılmış hesabınız varsa ve varsayılan seçilmemişse, CLI komutları tahmin etmeyi reddeder; `defaultAccount` ayarlayın veya `--account <id>` geçirin.
- Üst düzey `channels.matrix.*` bloğu yalnızca kimlik doğrulaması eksiksiz olduğunda (`homeserver` + `accessToken` veya `homeserver` + `userId` + `password`) örtük `default` hesabı olarak ele alınır. Adlandırılmış hesaplar, önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı karşıladığında `homeserver` + `userId` üzerinden keşfedilebilir kalır.

**Yükseltme:**

- OpenClaw, onarım veya kurulum sırasında tek hesaplı bir yapılandırmayı çok hesaplıya yükselttiğinde, varsa mevcut adlandırılmış hesabı veya `defaultAccount` zaten bir hesabı işaret ediyorsa onu korur. Yalnızca Matrix kimlik doğrulama/önyükleme anahtarları yükseltilen hesaba taşınır; paylaşılan teslim-ilkesi anahtarları üst düzeyde kalır.

Paylaşılan çok hesaplı desen için [Yapılandırma başvurusu](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver’ları

Varsayılan olarak OpenClaw, siz hesap başına açıkça kabul etmediğiniz sürece SSRF koruması için özel/dahili Matrix homeserver’larını engeller.

Homeserver’ınız localhost, LAN/Tailscale IP’si veya dahili bir ana makine adı üzerinde çalışıyorsa, o Matrix hesabı için
`network.dangerouslyAllowPrivateNetwork` öğesini etkinleştirin:

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

Bu isteğe bağlı ayar yalnızca güvenilir özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi herkese açık düz metin homeserver'lar engellenmeye devam eder. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden geçirme

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

Matrix, OpenClaw'ın sizden bir oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. Açık teslim hedefleri, cron işleri, bağlamalar veya izin listeleri yapılandırırken Matrix'teki oda kimliğinin tam harf kullanımını kullanın. OpenClaw, depolama için dahili oturum anahtarlarını kanonik tutar; bu nedenle bu küçük harfli anahtarlar Matrix teslim kimlikleri için güvenilir bir kaynak değildir.

Canlı dizin araması, oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder, ardından o hesap için katılınmış oda adlarında arama yapmaya geri döner.
- Katılınmış oda adı araması en iyi çaba esasına dayanır. Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa, çalışma zamanı izin listesi çözümlemesi tarafından yok sayılır.

## Yapılandırma başvurusu

İzin listesi tarzı alanlar (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) tam Matrix kullanıcı kimliklerini kabul eder (en güvenlisi). Tam dizin eşleşmeleri başlangıçta ve monitör çalışırken izin listesi her değiştiğinde çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır. Oda izin listeleri de aynı nedenle oda kimliklerini veya takma adları tercih eder.

### Hesap ve bağlantı

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı görüntü etiketi.
- `defaultAccount`: birden çok Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `accounts`: adlandırılmış hesap başına geçersiz kılmalar. Üst düzey `channels.matrix` değerleri varsayılan olarak devralınır.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu hesabın `localhost`, LAN/Tailscale IP'leri veya dahili host adlarına bağlanmasına izin verir.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Hesap başına geçersiz kılma desteklenir.
- `userId`: tam Matrix kullanıcı kimliği (`@bot:example.org`).
- `accessToken`: token tabanlı kimlik doğrulama için erişim token'ı. Düz metin ve SecretRef değerleri env/file/exec sağlayıcıları genelinde desteklenir ([Gizli Bilgi Yönetimi](/tr/gateway/secrets)).
- `password`: parola tabanlı oturum açma için parola. Düz metin ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile oturum açma sırasında kullanılan cihaz görüntü adı.
- `avatarUrl`: profil senkronizasyonu ve `profile set` güncellemeleri için saklanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç senkronizasyonu sırasında getirilen en fazla olay sayısı.

### Şifreleme

- `encryption`: E2EE'yi etkinleştirir. Varsayılan: `false`.
- `startupVerification`: `"if-unverified"` (E2EE açıkken varsayılan) veya `"off"`. Bu cihaz doğrulanmamışsa başlangıçta otomatik olarak öz doğrulama ister.
- `startupVerificationCooldownHours`: bir sonraki otomatik başlangıç isteğinden önceki bekleme süresi. Varsayılan: `24`.

### Erişim ve ilke

- `groupPolicy`: `"open"`, `"allowlist"` veya `"disabled"`. Varsayılan: `"allowlist"`.
- `groupAllowFrom`: oda trafiği için kullanıcı kimliklerinden oluşan izin listesi.
- `dm.enabled`: `false` olduğunda tüm DM'leri yok sayar. Varsayılan: `true`.
- `dm.policy`: `"pairing"` (varsayılan), `"allowlist"`, `"open"` veya `"disabled"`. Bot katıldıktan ve odayı DM olarak sınıflandırdıktan sonra uygulanır; davet işleme davranışını etkilemez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimliklerinden oluşan izin listesi.
- `dm.sessionScope`: `"per-user"` (varsayılan) veya `"per-room"`.
- `dm.threadReplies`: yanıt iş parçacığı için yalnızca DM geçersiz kılması (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: yapılandırılmış diğer Matrix bot hesaplarından gelen mesajları kabul eder (`true` veya `"mentions"`).
- `allowlistOnly`: `true` olduğunda tüm etkin DM ilkelerini (`"disabled"` hariç) ve `"open"` grup ilkelerini `"allowlist"` olmaya zorlar. `"disabled"` ilkelerini değiştirmez.
- `autoJoin`: `"always"`, `"allowlist"` veya `"off"`. Varsayılan: `"off"`. DM tarzı davetler dahil her Matrix davetine uygulanır.
- `autoJoinAllowlist`: `autoJoin` `"allowlist"` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri, davet edilen odanın iddia ettiği duruma göre değil, homeserver'a göre çözümlenir.
- `contextVisibility`: ek bağlam görünürlüğü (`"all"` varsayılan, `"allowlist"`, `"allowlist_quote"`).

### Yanıt davranışı

- `replyToMode`: `"off"`, `"first"`, `"all"` veya `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` veya `"always"`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `streaming`: `"off"` (varsayılan), `"partial"`, `"quiet"` veya nesne biçimi `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: `true` olduğunda, tamamlanan asistan blokları ayrı ilerleme mesajları olarak tutulur.
- `markdown`: giden metin için isteğe bağlı Markdown işleme yapılandırması.
- `responsePrefix`: giden yanıtlara başa eklenen isteğe bağlı dize.
- `textChunkLimit`: `chunkMode: "length"` olduğunda karakter cinsinden giden parça boyutu. Varsayılan: `4000`.
- `chunkMode`: `"length"` (varsayılan, karakter sayısına göre böler) veya `"newline"` (satır sınırlarında böler).
- `historyLimit`: bir oda mesajı agent'ı tetiklediğinde `InboundHistory` olarak dahil edilen son oda mesajlarının sayısı. `messages.groupChat.historyLimit` değerine geri döner; etkin varsayılan `0` (devre dışı).
- `mediaMaxMb`: giden gönderimler ve gelen işleme için MB cinsinden medya boyutu sınırı.

### Reaksiyon ayarları

- `ackReaction`: bu kanal/hesap için ack reaksiyonu geçersiz kılması.
- `ackReactionScope`: kapsam geçersiz kılması (`"group-mentions"` varsayılan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: gelen reaksiyon bildirimi modu (`"own"` varsayılan, `"off"`).

### Araç kullanımı ve oda başına geçersiz kılmalar

- `actions`: eylem başına araç kapılama (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: oda başına ilke haritası. Oturum kimliği, çözümlemeden sonra kararlı oda kimliğini kullanır. (`rooms` eski bir takma addır.)
  - `groups.<room>.account`: devralınan bir oda girdisini belirli bir hesapla sınırlar.
  - `groups.<room>.allowBots`: kanal düzeyi ayarın oda başına geçersiz kılınması (`true` veya `"mentions"`).
  - `groups.<room>.users`: oda başına gönderen izin listesi.
  - `groups.<room>.tools`: oda başına araç izin/verme ya da reddetme geçersiz kılmaları.
  - `groups.<room>.autoReply`: oda başına bahsetme kapılama geçersiz kılması. `true`, o oda için bahsetme gereksinimlerini devre dışı bırakır; `false` bunları tekrar zorunlu kılar.
  - `groups.<room>.skills`: oda başına Skills filtresi.
  - `groups.<room>.systemPrompt`: oda başına sistem prompt parçacığı.

### Exec onayı ayarları

- `execApprovals.enabled`: exec onaylarını Matrix'e özgü prompt'lar üzerinden teslim eder.
- `execApprovals.approvers`: onay vermesine izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` değerine geri döner.
- `execApprovals.target`: `"dm"` (varsayılan), `"channel"` veya `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: teslimat için isteğe bağlı agent/oturum izin listeleri.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme kapılama
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
