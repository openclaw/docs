---
read_when:
    - OpenClaw'da Matrix kurulumu
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulumu ve yapılandırma örnekleri
title: Matris
x-i18n:
    generated_at: "2026-06-28T20:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, OpenClaw için indirilebilir bir kanal Plugin’idir.
Resmi `matrix-js-sdk` kullanır ve DM’leri, odaları, iş parçacıklarını, medyayı, tepkileri, anketleri, konumu ve E2EE’yi destekler.

## Kurulum

Kanalı yapılandırmadan önce Matrix’i ClawHub’dan kurun:

```bash
openclaw plugins install @openclaw/matrix
```

Yalın plugin tanımları önce ClawHub’ı dener, ardından npm yedeğine döner. Kayıt kaynağını zorlamak için `openclaw plugins install clawhub:@openclaw/matrix` veya `openclaw plugins install npm:@openclaw/matrix` kullanın.

Yerel bir checkout’tan:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` plugin’i kaydeder ve etkinleştirir, bu nedenle ayrı bir `openclaw plugins enable matrix` adımı gerekmez. Aşağıdaki kanalı yapılandırana kadar plugin yine de hiçbir şey yapmaz. Genel plugin davranışı ve kurulum kuralları için [Plugins](/tr/tools/plugin) bölümüne bakın.

## Kurulum Ayarları

1. Homeserver’ınızda bir Matrix hesabı oluşturun.
2. `channels.matrix` öğesini `homeserver` + `accessToken` veya `homeserver` + `userId` + `password` ile yapılandırın.
3. Gateway’i yeniden başlatın.
4. Bot ile bir DM başlatın veya onu bir odaya davet edin ([otomatik katılım](#auto-join) bölümüne bakın - yeni davetler yalnızca `autoJoin` izin verdiğinde gerçekleşir).

### Etkileşimli kurulum

```bash
openclaw channels add
openclaw configure --section channels
```

Sihirbaz şunları sorar: homeserver URL’si, kimlik doğrulama yöntemi (erişim belirteci veya parola), kullanıcı kimliği (yalnızca parola kimlik doğrulaması), isteğe bağlı cihaz adı, E2EE’nin etkinleştirilip etkinleştirilmeyeceği ve oda erişimi ile otomatik katılımın yapılandırılıp yapılandırılmayacağı.

Eşleşen `MATRIX_*` ortam değişkenleri zaten varsa ve seçilen hesabın kaydedilmiş kimlik doğrulaması yoksa, sihirbaz bir ortam değişkeni kısayolu sunar. Bir izin verilenler listesini kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` çalıştırın. E2EE etkinleştirildiğinde sihirbaz yapılandırmayı yazar ve [`openclaw matrix encryption setup`](#encryption-and-verification) ile aynı önyüklemeyi çalıştırır.

### En düşük yapılandırma

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

### Otomatik katılım

`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir. Varsayılan ayarla bot, siz elle katılana kadar yeni davetlerden gelen yeni odalarda veya DM’lerde görünmez.

OpenClaw, davet sırasında davet edilen odanın DM mi yoksa grup mu olduğunu anlayamaz; bu nedenle DM tarzı davetler dahil tüm davetler önce `autoJoin` üzerinden geçer. `dm.policy` yalnızca daha sonra, bot katıldıktan ve oda sınıflandırıldıktan sonra uygulanır.

<Warning>
Botun hangi davetleri kabul edeceğini sınırlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her daveti kabul etmek için `autoJoin: "always"` kullanın.

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

### İzin verilenler listesi hedef biçimleri

DM ve oda izin verilenler listeleri en iyi kararlı kimliklerle doldurulur:

- DM’ler (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` kullanın. Görünen adlar değiştirilebilir oldukları için varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true` değerini yalnızca görünen ad girdileriyle açıkça uyumluluğa ihtiyacınız olduğunda ayarlayın.
- Oda izin verilenler listesi anahtarları (`groups`, eski `rooms`): `!room:server` veya `#alias:server` kullanın. Düz oda adları varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true` değerini yalnızca katılınmış oda adı aramasıyla açıkça uyumluluğa ihtiyacınız olduğunda ayarlayın.
- Davet izin verilenler listeleri (`autoJoinAllowlist`): `!room:server`, `#alias:server` veya `*` kullanın. Düz oda adları reddedilir.

### Hesap kimliği normalleştirme

Sihirbaz, kullanıcı dostu bir adı normalleştirilmiş hesap kimliğine dönüştürür. Örneğin `Ops Bot`, `ops-bot` olur. İki hesabın çakışamaması için noktalama işaretleri kapsamlı ortam değişkeni adlarında kaçışlanır: `-` → `_X2D_`, yani `ops-prod` değeri `MATRIX_OPS_X2D_PROD_*` ile eşleşir.

### Önbelleğe alınmış kimlik bilgileri

Matrix, önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` altında saklar:

- varsayılan hesap: `credentials.json`
- adlandırılmış hesaplar: `credentials-<account>.json`

Önbelleğe alınmış kimlik bilgileri burada varsa OpenClaw, erişim belirteci yapılandırma dosyasında olmasa bile Matrix’i yapılandırılmış kabul eder; bu, kurulumu, `openclaw doctor` komutunu ve kanal durumu sondalarını kapsar.

### Ortam değişkenleri

Eşdeğer yapılandırma anahtarı ayarlanmadığında kullanılır. Varsayılan hesap öneksiz adları kullanır; adlandırılmış hesaplar, sonekten önce eklenen hesap kimliğini kullanır.

| Varsayılan hesap       | Adlandırılmış hesap (`<ID>` normalleştirilmiş hesap kimliğidir) |
| ---------------------- | --------------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                        |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                                      |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                           |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                          |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                         |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                                       |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                                      |

`ops` hesabı için adlar `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` vb. olur. Kurtarma anahtarı ortam değişkenleri, anahtarı `--recovery-key-stdin` ile yönlendirdiğinizde kurtarmaya duyarlı CLI akışları (`verify backup restore`, `verify device`, `verify bootstrap`) tarafından okunur.

`MATRIX_HOMESERVER` bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Yapılandırma örneği

DM eşleştirme, oda izin verilenler listesi ve E2EE içeren pratik bir başlangıç:

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

| `streaming`          | Davranış                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (varsayılan) | Tam yanıtı bekler, bir kez gönderir. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                               |
| `"partial"`          | Model geçerli bloğu yazarken tek bir normal metin mesajını yerinde düzenler. Standart Matrix istemcileri son düzenlemede değil, ilk önizlemede bildirim gönderebilir.        |
| `"quiet"`            | `"partial"` ile aynıdır, ancak mesaj bildirim oluşturmayan bir notice’tır. Alıcılar yalnızca kullanıcı başına bir push kuralı sonlandırılmış düzenlemeyle eşleştiğinde bildirim alır (aşağıya bakın). |

`blockStreaming`, `streaming` öğesinden bağımsızdır:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (varsayılan)                     |
| ----------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| `"partial"` / `"quiet"` | Geçerli blok için canlı taslak, tamamlanan bloklar mesaj olarak tutulur | Geçerli blok için canlı taslak, yerinde sonlandırılır |
| `"off"`                 | Tamamlanan blok başına bir bildirimli Matrix mesajı                 | Tam yanıt için bir bildirimli Matrix mesajı              |

Notlar:

- Bir önizleme Matrix’in olay başına boyut sınırını aşarsa OpenClaw önizleme akışını durdurur ve yalnızca son teslimata geri döner.
- Medya yanıtları ekleri her zaman normal şekilde gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa OpenClaw, son medya yanıtını göndermeden önce onu redakte eder.
- Matrix önizleme akışı etkin olduğunda araç ilerlemesi önizleme güncellemeleri varsayılan olarak etkindir. Yanıt metni için önizleme düzenlemelerini koruyup araç ilerlemesini normal teslimat yolunda bırakmak için `streaming.preview.toolProgress: false` ayarlayın.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En muhafazakar hız sınırı profilini istiyorsanız `streaming: "off"` bırakın.

## Sesli mesajlar

Gelen Matrix ses notları, oda bahsetme kapısından önce metne dökülür. Bu, bot adını söyleyen bir ses notunun `requireMention: true` olan bir odada agent’ı tetiklemesini sağlar ve agent’a yalnızca ses eki yer tutucusu yerine dökümü verir.

Matrix, `tools.media.audio` altında yapılandırılan paylaşılan ses medya sağlayıcısını kullanır; örneğin OpenAI `gpt-4o-mini-transcribe`. Sağlayıcı kurulumu ve sınırlar için [Medya araçlarına genel bakış](/tr/tools/media-overview) bölümüne bakın.

Davranış ayrıntıları:

- `m.audio` olayları ve `audio/*` MIME türüne sahip `m.file` olayları uygundur.
- Şifreli odalarda OpenClaw, dökümden önce eki mevcut Matrix medya yolu üzerinden çözer.
- Döküm, agent isteminde makine tarafından oluşturulmuş ve güvenilmez olarak işaretlenir.
- Ek, aşağı akış medya araçlarının aynı ses notunu tekrar metne dökmemesi için zaten metne dökülmüş olarak işaretlenir.
- Ses dökümünü genel olarak devre dışı bırakmak için `tools.media.audio.enabled: false` ayarlayın.

## Onay metaverileri

Matrix yerel onay istemleri, `com.openclaw.approval` altında OpenClaw’a özgü özel olay içeriği bulunan normal `m.room.message` olaylarıdır. Matrix özel olay içeriği anahtarlarına izin verir; bu nedenle standart istemciler metin gövdesini işlemeye devam ederken OpenClaw’dan haberdar istemciler yapılandırılmış onay kimliğini, türünü, durumunu, kullanılabilir kararları ve exec/plugin ayrıntılarını okuyabilir.

Bir onay istemi tek bir Matrix olayı için fazla uzunsa OpenClaw görünür metni parçalara böler ve `com.openclaw.approval` öğesini yalnızca ilk parçaya ekler. İzin ver/reddet kararları için tepkiler bu ilk olaya bağlanır; böylece uzun istemler tek olaylı istemlerle aynı onay hedefini korur.

### Sessiz sonlandırılmış önizlemeler için self-hosted push kuralları

`streaming: "quiet"` alıcıları yalnızca bir blok veya tur sonlandırıldığında bilgilendirir; kullanıcı başına bir push kuralının sonlandırılmış önizleme işaretçisiyle eşleşmesi gerekir. Tam tarif için [Sessiz önizlemeler için Matrix push kuralları](/tr/channels/matrix-push-rules) bölümüne bakın (alıcı belirteci, pusher denetimi, kural kurulumu, homeserver başına notlar).

## Bottan bota odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Bilerek agent’lar arası Matrix trafiği istediğinizde `allowBots` kullanın:

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

- `allowBots: true`, izin verilen odalarda ve DM'lerde yapılandırılmış diğer Matrix bot hesaplarından gelen iletileri kabul eder.
- `allowBots: "mentions"`, bu iletileri yalnızca odalarda bu bottan görünür şekilde bahsettiklerinde kabul eder. DM'lere yine izin verilir.
- `groups.<room>.allowBots`, tek bir oda için hesap düzeyindeki ayarı geçersiz kılar.
- Kabul edilen yapılandırılmış bot iletileri, paylaşılan [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanır. `channels.defaults.botLoopProtection` yapılandırın, ardından bir oda farklı bir bütçeye ihtiyaç duyduğunda `channels.matrix.botLoopProtection` veya `channels.matrix.groups.<room>.botLoopProtection` ile geçersiz kılın.
- OpenClaw, kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen iletileri hâlâ yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw, "bot tarafından yazılmış"ı "bu OpenClaw gateway üzerinde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak ele alır.

Paylaşılan odalarda bottan bota trafiği etkinleştirirken katı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifreli (E2EE) odalarda, giden görsel olayları `thumbnail_file` kullanır; böylece görsel önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar düz `thumbnail_url` kullanmaya devam eder. Yapılandırma gerekmez - plugin E2EE durumunu otomatik olarak algılar.

Tüm `openclaw matrix` komutları `--verbose` (tam tanılama), `--json` (makine tarafından okunabilir çıktı) ve `--account <id>` (çok hesaplı kurulumlar) seçeneklerini kabul eder. Çıktı, sessiz dahili SDK günlüklemesiyle varsayılan olarak kısadır. Aşağıdaki örnekler kurallı biçimi gösterir; bayrakları gerektiği şekilde ekleyin.

### Şifrelemeyi etkinleştir

```bash
openclaw matrix encryption setup
```

Gizli depolamayı ve çapraz imzalamayı başlatır, gerekiyorsa oda anahtarı yedeği oluşturur, ardından durumu ve sonraki adımları yazdırır. Yararlı bayraklar:

- `--recovery-key <key>` başlatmadan önce bir kurtarma anahtarı uygula (aşağıda belgelenen stdin biçimini tercih edin)
- `--force-reset-cross-signing` geçerli çapraz imzalama kimliğini at ve yeni bir tane oluştur (yalnızca bilinçli olarak kullanın)

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

`verify status` üç bağımsız güven sinyalini bildirir (`--verbose` hepsini gösterir):

- `Locally trusted`: yalnızca bu istemci tarafından güvenilir
- `Cross-signing verified`: SDK, çapraz imzalama yoluyla doğrulamayı bildirir
- `Signed by owner`: kendi öz imzalama anahtarınızla imzalanmış (yalnızca tanılama)

`Verified by owner`, yalnızca `Cross-signing verified` `yes` olduğunda `yes` olur. Yerel güven veya tek başına sahip imzası yeterli değildir.

`--allow-degraded-local-state`, önce Matrix hesabını hazırlamadan en iyi çaba tanılamalarını döndürür; çevrimdışı veya kısmen yapılandırılmış yoklamalar için yararlıdır.

### Bu cihazı bir kurtarma anahtarıyla doğrula

Kurtarma anahtarı hassastır - komut satırında geçirmek yerine stdin üzerinden yönlendirin. `MATRIX_RECOVERY_KEY` ayarlayın (veya adlandırılmış bir hesap için `MATRIX_<ID>_RECOVERY_KEY`):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Komut üç durum bildirir:

- `Recovery key accepted`: Matrix, anahtarı gizli depolama veya cihaz güveni için kabul etti.
- `Backup usable`: oda anahtarı yedeği, güvenilen kurtarma materyaliyle yüklenebilir.
- `Device verified by owner`: bu cihaz tam Matrix çapraz imzalama kimliği güvenine sahip.

Kurtarma anahtarı yedek materyalini açmış olsa bile, tam kimlik güveni eksik olduğunda sıfır olmayan kodla çıkar. Bu durumda, başka bir Matrix istemcisinden öz doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

`verify self`, başarıyla çıkmadan önce `Cross-signing verified: yes` için bekler. Beklemeyi ayarlamak için `--timeout-ms <ms>` kullanın.

Düz anahtar biçimi `openclaw matrix verify device "<recovery-key>"` de kabul edilir, ancak anahtar kabuk geçmişinize girer.

### Çapraz imzalamayı başlat veya onar

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap`, şifreli hesaplar için onarım ve kurulum komutudur. Sırayla şunları yapar:

- mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanarak gizli depolamayı başlatır
- çapraz imzalamayı başlatır ve eksik genel anahtarları yükler
- geçerli cihazı işaretler ve çapraz imzalar
- zaten yoksa sunucu tarafı oda anahtarı yedeği oluşturur

Homeserver, çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa OpenClaw önce kimlik doğrulamasız, sonra `m.login.dummy`, sonra `m.login.password` dener (`channels.matrix.password` gerektirir).

Yararlı bayraklar:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` ile eşleştirin) veya `--recovery-key <key>`
- geçerli çapraz imzalama kimliğini atmak için `--force-reset-cross-signing` (yalnızca bilinçli olarak; etkin kurtarma anahtarının depolanmış olmasını veya `--recovery-key-stdin` ile sağlanmasını gerektirir)

### Oda anahtarı yedeği

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`, sunucu tarafı bir yedeğin var olup olmadığını ve bu cihazın onu çözüp çözemediğini gösterir. `backup restore`, yedeklenmiş oda anahtarlarını yerel kripto deposuna içe aktarır; kurtarma anahtarı zaten diskteyse `--recovery-key-stdin` bayrağını atlayabilirsiniz.

Bozuk bir yedeği yeni bir temel durumla değiştirmek için (kurtarılamayan eski geçmişi kaybetmeyi kabul eder; geçerli yedek sırrı yüklenemiyorsa gizli depolamayı da yeniden oluşturabilir):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` yalnızca önceki kurtarma anahtarının yeni yedek temelini açmayı durdurmasını bilinçli olarak istediğinizde ekleyin.

### Doğrulamaları listeleme, isteme ve yanıtlama

```bash
openclaw matrix verify list
```

Seçilen hesap için bekleyen doğrulama isteklerini listeler.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Bu OpenClaw hesabından bir doğrulama isteği gönderir. `--own-user` öz doğrulama ister (aynı kullanıcının başka bir Matrix istemcisinde istemi kabul edersiniz); `--user-id`/`--device-id`/`--room-id` başka birini hedefler. `--own-user`, diğer hedefleme bayraklarıyla birleştirilemez.

Daha düşük düzeyli yaşam döngüsü yönetimi için - genellikle başka bir istemciden gelen istekleri izlerken - bu komutlar belirli bir `<id>` isteği üzerinde çalışır (`verify list` ve `verify request` tarafından yazdırılır):

| Komut                                      | Amaç                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Gelen bir isteği kabul et                                           |
| `openclaw matrix verify start <id>`        | SAS akışını başlat                                                  |
| `openclaw matrix verify sas <id>`          | SAS emojilerini veya ondalıklarını yazdır                           |
| `openclaw matrix verify confirm-sas <id>`  | SAS'ın diğer istemcinin gösterdiğiyle eşleştiğini onayla            |
| `openclaw matrix verify mismatch-sas <id>` | Emoji veya ondalıklar eşleşmediğinde SAS'ı reddet                   |
| `openclaw matrix verify cancel <id>`       | İptal et; isteğe bağlı `--reason <text>` ve `--code <matrix-code>` alır |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` ve `cancel`, doğrulama belirli bir doğrudan ileti odasına sabitlendiğinde DM takip ipuçları olarak `--user-id` ve `--room-id` kabul eder.

### Çok hesaplı notlar

`--account <id>` olmadan, Matrix CLI komutları örtük varsayılan hesabı kullanır. Birden fazla adlandırılmış hesabınız varsa ve `channels.matrix.defaultAccount` ayarlamadıysanız, tahmin yapmayı reddeder ve sizden seçim yapmanızı ister. Adlandırılmış bir hesap için E2EE devre dışıysa veya kullanılamıyorsa hatalar o hesabın yapılandırma anahtarını gösterir; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Başlatma davranışı">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlatmada doğrulanmamış bir cihaz, başka bir Matrix istemcisinde öz doğrulama ister, yinelenenleri atlar ve bir bekleme süresi uygular (varsayılan olarak 24 saat). `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlatma ayrıca geçerli gizli depolamayı ve çapraz imzalama kimliğini yeniden kullanan korumacı bir kripto başlatma geçişi çalıştırır. Başlatma durumu bozuksa OpenClaw, `channels.matrix.password` olmadan bile korumalı bir onarım dener; homeserver parola UIA gerektiriyorsa başlatma bir uyarı günlüğe yazar ve ölümcül olmayan durumda kalır. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix migration](/tr/channels/matrix-migration) bölümüne bakın.

  </Accordion>

  <Accordion title="Doğrulama bildirimleri">
    Matrix, doğrulama yaşam döngüsü bildirimlerini katı DM doğrulama odasına `m.notice` iletileri olarak gönderir: istek, hazır ("Verify by emoji" rehberliğiyle), başlatma/tamamlama ve kullanılabilir olduğunda SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik olarak kabul edilir. Öz doğrulama için OpenClaw, SAS akışını otomatik olarak başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar - Matrix istemcinizde yine de karşılaştırıp "They match" seçeneğini onaylamanız gerekir.

    Doğrulama sistemi bildirimleri agent sohbet işlem hattına iletilmez.

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

    Token kimlik doğrulaması için, Matrix istemcinizde veya yönetici arayüzünüzde yeni bir erişim token'ı oluşturun, ardından OpenClaw'ı güncelleyin:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` yerine başarısız komuttaki hesap kimliğini yazın veya varsayılan hesap için `--account` değerini atlayın.

  </Accordion>

  <Accordion title="Cihaz hijyeni">
    Eski OpenClaw tarafından yönetilen cihazlar birikebilir. Listeleyin ve ayıklayın:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kripto deposu">
    Matrix E2EE, IndexedDB shim'i olarak `fake-indexeddb` ile resmi `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` dosyasına kalıcı olarak yazılır (kısıtlayıcı dosya izinleriyle).

    Şifreli çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında bulunur ve eşitleme deposu, kripto deposu, kurtarma anahtarı, IDB anlık görüntüsü, iş parçacığı bağlamaları ve başlatma doğrulama durumunu içerir. Token değiştiğinde ancak hesap kimliği aynı kaldığında OpenClaw, önceki durumun görünür kalması için en iyi mevcut kökü yeniden kullanır.

    Tek bir eski token-hash kökü normal bir token döndürme sürekliliği yolu olabilir. OpenClaw `matrix: multiple populated token-hash storage roots detected` günlüğünü yazarsa, hesap dizinini inceleyin ve eski kardeş kökleri yalnızca seçilen etkin kökün sağlıklı olduğunu doğruladıktan sonra arşivleyin. Eski kökleri hemen silmek yerine bir `_archive/` dizinine taşımayı tercih edin.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçili hesap için Matrix kendi profilini güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

İki seçeneği de tek çağrıda geçirebilirsiniz. Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder; `http://` veya `https://` geçirdiğinizde OpenClaw önce dosyayı yükler ve çözümlenen `mxc://` URL'sini `channels.matrix.avatarUrl` içine (veya hesap bazındaki geçersiz kılmaya) kaydeder.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de mesaj aracı gönderimleri için yerel Matrix iş parçacıklarını destekler. Davranışı iki bağımsız düğme denetler:

### Oturum yönlendirme (`sessionScope`)

`dm.sessionScope`, Matrix DM odalarının OpenClaw oturumlarına nasıl eşleneceğini belirler:

- `"per-user"` (varsayılan): aynı yönlendirilmiş eşe sahip tüm DM odaları tek bir oturumu paylaşır.
- `"per-room"`: eş aynı olsa bile her Matrix DM odası kendi oturum anahtarını alır.

Açık konuşma bağlamaları her zaman `sessionScope` değerine üstün gelir; bu nedenle bağlı odalar ve iş parçacıkları seçtikleri hedef oturumu korur.

### Yanıt iş parçacığı (`threadReplies`)

`threadReplies`, botun yanıtını nereye göndereceğini belirler:

- `"off"`: yanıtlar üst düzeydedir. Gelen iş parçacıklı mesajlar üst oturumda kalır.
- `"inbound"`: yalnızca gelen mesaj zaten o iş parçacığındaysa iş parçacığı içinde yanıt verilir.
- `"always"`: tetikleyen mesaj köklü bir iş parçacığı içinde yanıt verilir; bu konuşma ilk tetiklemeden itibaren eşleşen iş parçacığı kapsamlı bir oturum üzerinden yönlendirilir.

`dm.threadReplies` bunu yalnızca DM'ler için geçersiz kılar - örneğin, oda iş parçacıklarını izole tutarken DM'leri düz tutmak için.

### İş parçacığı kalıtımı ve eğik çizgi komutları

- Gelen iş parçacıklı mesajlar, ek aracı bağlamı olarak iş parçacığı kök mesajını içerir.
- Mesaj aracı gönderimleri, aynı odayı (veya aynı DM kullanıcı hedefini) hedeflerken açık bir `threadId` sağlanmadıkça geçerli Matrix iş parçacığını otomatik devralır.
- DM kullanıcı hedefi yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi takdirde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn` komutlarının tümü Matrix odalarında ve DM'lerde çalışır.
- Üst düzey `/focus`, `threadBindings.spawnSessions` etkinleştirildiğinde yeni bir Matrix iş parçacığı oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak, o iş parçacığını yerinde bağlar.

OpenClaw, aynı paylaşılan oturumda başka bir DM odasıyla çakışan bir Matrix DM odası algıladığında, o odaya `/focus` kaçış yolunu işaret eden ve `dm.sessionScope` değişikliği öneren tek seferlik bir `m.notice` gönderir. Bildirim yalnızca iş parçacığı bağlamaları etkinleştirildiğinde görünür.

## ACP konuşma bağlamaları

Matrix odaları, DM'leri ve mevcut Matrix iş parçacıkları, sohbet yüzeyi değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında, geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığı içinde `--bind here`, geçerli iş parçacığını yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Notlar:

- `--bind here` bir alt Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnSessions`, OpenClaw'ın bir alt Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` komutunu kapılar.

### İş parçacığı bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` öğesinden devralır ve ayrıca kanal bazında geçersiz kılmaları destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix iş parçacığına bağlı oturum oluşturma varsayılan olarak açıktır:

- Üst düzey `/focus` ve `/acp spawn --thread auto|here` komutlarının Matrix iş parçacıkları oluşturmasını/bağlamasını engellemek için `threadBindings.spawnSessions: false` ayarlayın.
- Yerel alt aracı iş parçacığı oluşturma işlemleri üst dökümü çatallamamalıysa `threadBindings.defaultSpawnContext: "isolated"` ayarlayın.

## Tepkiler

Matrix giden tepkileri, gelen tepki bildirimlerini ve onay tepkilerini destekler.

Giden tepki araçları `channels.matrix.actions.reactions` tarafından kapılanır:

- `react`, bir Matrix olayına tepki ekler.
- `reactions`, bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, botun o olaydaki kendi tepkilerini kaldırır.
- `remove: true`, bottan yalnızca belirtilen emoji tepkisini kaldırır.

**Çözüm sırası** (ilk tanımlı değer kazanır):

| Ayar                    | Sıra                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | hesap bazında → kanal → `messages.ackReaction` → aracı kimliği emoji yedeği      |
| `ackReactionScope`      | hesap bazında → kanal → `messages.ackReactionScope` → varsayılan `"group-mentions"` |
| `reactionNotifications` | hesap bazında → kanal → varsayılan `"own"`                                       |

`reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedeflediklerinde eklenen `m.reaction` olaylarını iletir; `"off"` tepki sistemi olaylarını devre dışı bırakır. Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak sunduğu için tepki kaldırmaları sistem olaylarına sentezlenmez.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı aracıyı tetiklediğinde `InboundHistory` olarak kaç son oda mesajının dahil edileceğini denetler. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmamışsa etkili varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca oda kapsamlıdır. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen kapsamdadır: OpenClaw henüz yanıt tetiklememiş oda mesajlarını ara belleğe alır, ardından bir bahsetme veya başka tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine dahil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi tamamlayıcı oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Tamamlayıcı bağlam alındığı gibi korunur.
- `contextVisibility: "allowlist"`, tamamlayıcı bağlamı etkin oda/kullanıcı izin listesi denetimleri tarafından izin verilen göndericilere filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de tek bir açık alıntılanmış yanıtı korur.

Bu ayar, gelen mesajın kendisinin yanıt tetikleyip tetikleyemeyeceğini değil, tamamlayıcı bağlam görünürlüğünü etkiler.
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

Odaları çalışır tutarken DM'leri tamamen susturmak için `dm.enabled: false` ayarlayın:

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

Bahsetme kapılama ve izin listesi davranışı için [Gruplar](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni kod basmak yerine kısa bir bekleme süresinden sonra hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Eşleştirme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu eşitlemeden saparsa OpenClaw, canlı DM yerine eski solo odaları işaret eden bayat `m.direct` eşlemeleriyle kalabilir. Bir eş için geçerli eşlemeyi inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Her iki komut da çok hesaplı kurulumlar için `--account <id>` kabul eder. Onarım akışı:

- zaten `m.direct` içinde eşlenmiş katı bir 1:1 DM'yi tercih eder
- o kullanıcıyla şu anda katılınmış herhangi bir katı 1:1 DM'ye geri döner
- sağlıklı DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` öğesini yeniden yazar

Eski odaları otomatik olarak silmez. Sağlıklı DM'yi seçer ve eşlemeyi günceller, böylece gelecekteki Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları doğru odayı hedefler.

## Exec onayları

Matrix yerel bir onay istemcisi olarak davranabilir. `channels.matrix.execApprovals` altında (veya hesap bazında geçersiz kılma için `channels.matrix.accounts.<account>.execApprovals` altında) yapılandırın:

- `enabled`: onayları Matrix yerel istemleriyle iletir. Ayarlanmamışsa veya `"auto"` ise Matrix en az bir onaylayıcı çözümlenebildiğinde otomatik etkinleşir. Açıkça devre dışı bırakmak için `false` ayarlayın.
- `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (`@owner:example.org`). İsteğe bağlıdır - `channels.matrix.dm.allowFrom` değerine geri döner.
- `target`: istemlerin gideceği yer. `"dm"` (varsayılan) onaylayıcı DM'lerine gönderir; `"channel"` kaynak Matrix odasına veya DM'ye gönderir; `"both"` ikisine de gönderir.
- `agentFilter` / `sessionFilter`: hangi aracıların/oturumların Matrix teslimini tetikleyeceği için isteğe bağlı izin listeleri.

Yetkilendirme, onay türleri arasında biraz farklıdır:

- **Exec onayları** `execApprovals.approvers` kullanır, `dm.allowFrom` değerine geri döner.
- **Plugin onayları** yalnızca `dm.allowFrom` üzerinden yetkilendirir.

Her iki tür de Matrix tepki kısayollarını ve mesaj güncellemelerini paylaşır. Onaylayıcılar birincil onay mesajında tepki kısayollarını görür:

- `✅` bir kez izin ver
- `❌` reddet
- `♾️` her zaman izin ver (etkili exec ilkesi buna izin verdiğinde)

Yedek eğik çizgi komutları: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir - `channel` veya `both` seçeneklerini yalnızca güvenilir odalarda etkinleştirin.

İlgili: [Exec onayları](/tr/tools/exec-approvals).

## Eğik çizgi komutları

Eğik çizgi komutları (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` vb.) doğrudan DM'lerde çalışır. Odalarda OpenClaw ayrıca botun kendi Matrix bahsetmesiyle öneklenen komutları da tanır; bu nedenle `@bot:server /new`, özel bir bahsetme regex'i olmadan komut yolunu tetikler. Bu, kullanıcı komutu yazmadan önce botu sekmeyle tamamlarken Element ve benzeri istemcilerin yaydığı oda tarzı `@mention /command` gönderilerine botun yanıt verebilmesini sağlar.

Yetkilendirme kuralları hâlâ geçerlidir: komut gönderenler, düz mesajlarla aynı DM veya oda izin listesi/sahip ilkelerini karşılamalıdır.

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

**Kalıtım:**

- Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadıkça adlandırılmış hesaplar için varsayılanlar olarak davranır.
- Devralınan bir oda girdisini `groups.<room>.account` ile belirli bir hesaba kapsamlayın. `account` olmayan girdiler hesaplar arasında paylaşılır; varsayılan hesap üst düzeyde yapılandırıldığında `account: "default"` çalışmaya devam eder.

**Varsayılan hesap seçimi:**

- Örtük yönlendirme, yoklama ve CLI komutlarının tercih edeceği adlandırılmış hesabı seçmek için `defaultAccount` ayarlayın.
- Birden çok hesabınız varsa ve biri tam olarak `default` adını taşıyorsa, `defaultAccount` ayarlanmamış olsa bile OpenClaw onu örtük olarak kullanır.
- Birden çok adlandırılmış hesabınız varsa ve varsayılan seçilmemişse, CLI komutları tahmin yürütmeyi reddeder - `defaultAccount` ayarlayın veya `--account <id>` geçirin.
- Üst düzey `channels.matrix.*` bloğu yalnızca kimlik doğrulaması tamamlandığında (`homeserver` + `accessToken` veya `homeserver` + `userId` + `password`) örtük `default` hesabı olarak ele alınır. Önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı kapsadığında, adlandırılmış hesaplar `homeserver` + `userId` üzerinden keşfedilebilir kalır.

**Yükseltme:**

- OpenClaw, onarım veya kurulum sırasında tek hesaplı bir yapılandırmayı çok hesaplıya yükselttiğinde, mevcut adlandırılmış hesabı varsa veya `defaultAccount` zaten bir hesabı gösteriyorsa onu korur. Yalnızca Matrix kimlik doğrulama/önyükleme anahtarları yükseltilen hesaba taşınır; paylaşılan teslim ilkesi anahtarları üst düzeyde kalır.

Paylaşılan çok hesaplı kalıp için [Yapılandırma başvurusu](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'ları

Varsayılan olarak OpenClaw, SSRF koruması için özel/dahili Matrix homeserver'larını engeller; hesap başına açıkça kabul etmeniz gerekir.

Homeserver'ınız localhost üzerinde, bir LAN/Tailscale IP'sinde veya dahili bir host adında çalışıyorsa, ilgili Matrix hesabı için `network.dangerouslyAllowPrivateNetwork` etkinleştirin:

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

Bu açık kabul yalnızca güvenilen özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi herkese açık düz metin homeserver'ları engellenmeye devam eder. Mümkün olduğunca `https://` tercih edin.

## Matrix trafiğini proxy üzerinden geçirme

Matrix dağıtımınız açık bir giden HTTP(S) proxy'si gerektiriyorsa, `channels.matrix.proxy` ayarlayın:

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
OpenClaw, çalışma zamanı Matrix trafiği ve hesap durumu yoklamaları için aynı proxy ayarını kullanır.

## Hedef çözümleme

Matrix, OpenClaw'ın sizden oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. Açık teslim hedefleri, cron işleri, bağlamalar veya izin listeleri yapılandırırken Matrix'teki tam oda kimliği harf kullanımını kullanın.
OpenClaw, depolama için dahili oturum anahtarlarını kurallı tutar; bu nedenle bu küçük harfli anahtarlar Matrix teslim kimlikleri için güvenilir bir kaynak değildir.

Canlı dizin araması, oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, ilgili homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları, açık oda kimliklerini ve takma adları doğrudan kabul eder. Katılınmış oda adı araması en iyi çabayla yapılır ve yalnızca `dangerouslyAllowNameMatching: true` ayarlandığında çalışma zamanı oda izin listelerine uygulanır.
- Bir oda adı kimliğe veya takma ada çözümlenemezse, çalışma zamanı izin listesi çözümlemesinde yok sayılır.

## Yapılandırma başvurusu

İzin listesi tarzı kullanıcı alanları (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) tam Matrix kullanıcı kimliklerini kabul eder (en güvenlisi). Kimlik olmayan kullanıcı girdileri varsayılan olarak yok sayılır. `dangerouslyAllowNameMatching: true` ayarlarsanız, tam Matrix dizin görünen ad eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi her değiştiğinde çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır.

Oda izin listesi anahtarları (`groups`, eski `rooms`) oda kimlikleri veya takma adlar olmalıdır. Düz oda adı anahtarları varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true`, katılınmış oda adlarına karşı en iyi çaba aramayı geri getirir.

### Hesap ve bağlantı

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı görünen etiket.
- `defaultAccount`: birden çok Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `accounts`: adlandırılmış hesap başına geçersiz kılmalar. Üst düzey `channels.matrix` değerleri varsayılanlar olarak devralınır.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu hesabın `localhost`, LAN/Tailscale IP'leri veya dahili host adlarına bağlanmasına izin verir.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Hesap başına geçersiz kılma desteklenir.
- `userId`: tam Matrix kullanıcı kimliği (`@bot:example.org`).
- `accessToken`: belirteç tabanlı kimlik doğrulama için erişim belirteci. Düz metin ve SecretRef değerleri env/file/exec sağlayıcıları genelinde desteklenir ([Gizli Bilgi Yönetimi](/tr/gateway/secrets)).
- `password`: parola tabanlı oturum açma için parola. Düz metin ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile oturum açma sırasında kullanılan cihaz görünen adı.
- `avatarUrl`: profil eşitleme ve `profile set` güncellemeleri için saklanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında getirilen en fazla olay sayısı.

### Şifreleme

- `encryption`: E2EE etkinleştirir. Varsayılan: `false`.
- `startupVerification`: `"if-unverified"` (E2EE açıkken varsayılan) veya `"off"`. Bu cihaz doğrulanmamışsa başlangıçta öz doğrulamayı otomatik olarak ister.
- `startupVerificationCooldownHours`: bir sonraki otomatik başlangıç isteğinden önceki bekleme süresi. Varsayılan: `24`.

### Erişim ve ilke

- `groupPolicy`: `"open"`, `"allowlist"` veya `"disabled"`. Varsayılan: `"allowlist"`.
- `groupAllowFrom`: oda trafiği için kullanıcı kimlikleri izin listesi.
- `dm.enabled`: `false` olduğunda tüm DM'leri yok sayar. Varsayılan: `true`.
- `dm.policy`: `"pairing"` (varsayılan), `"allowlist"`, `"open"` veya `"disabled"`. Bot odaya katılıp odayı DM olarak sınıflandırdıktan sonra uygulanır; davet işlemeyi etkilemez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimlikleri izin listesi.
- `dm.sessionScope`: `"per-user"` (varsayılan) veya `"per-room"`.
- `dm.threadReplies`: yanıt iş parçacığı için yalnızca DM geçersiz kılması (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: yapılandırılmış diğer Matrix bot hesaplarından gelen mesajları kabul eder (`true` veya `"mentions"`).
- `allowlistOnly`: `true` olduğunda, tüm etkin DM ilkelerini (`"disabled"` hariç) ve `"open"` grup ilkelerini `"allowlist"` olmaya zorlar. `"disabled"` ilkelerini değiştirmez.
- `dangerouslyAllowNameMatching`: `true` olduğunda, kullanıcı izin listesi girdileri için Matrix görünen ad dizini aramasına ve oda izin listesi anahtarları için katılınmış oda adı aramasına izin verir. Tam `@user:server` kimliklerini ve oda kimliklerini veya takma adları tercih edin.
- `autoJoin`: `"always"`, `"allowlist"` veya `"off"`. Varsayılan: `"off"`. DM tarzı davetler dahil her Matrix davetine uygulanır.
- `autoJoinAllowlist`: `autoJoin` `"allowlist"` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri, davet edilen odanın iddia ettiği duruma göre değil homeserver'a göre çözümlenir.
- `contextVisibility`: ek bağlam görünürlüğü (`"all"` varsayılan, `"allowlist"`, `"allowlist_quote"`).

### Yanıt davranışı

- `replyToMode`: `"off"`, `"first"`, `"all"` veya `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` veya `"always"`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `streaming`: `"off"` (varsayılan), `"partial"`, `"quiet"` veya nesne biçimi `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: `true` olduğunda, tamamlanan asistan blokları ayrı ilerleme mesajları olarak tutulur.
- `markdown`: giden metin için isteğe bağlı Markdown işleme yapılandırması.
- `responsePrefix`: giden yanıtlara başına eklenen isteğe bağlı dize.
- `textChunkLimit`: `chunkMode: "length"` olduğunda karakter cinsinden giden parça boyutu. Varsayılan: `4000`.
- `chunkMode`: `"length"` (varsayılan, karakter sayısına göre böler) veya `"newline"` (satır sınırlarında böler).
- `historyLimit`: bir oda mesajı agent'ı tetiklediğinde `InboundHistory` olarak dahil edilen son oda mesajı sayısı. `messages.groupChat.historyLimit` değerine geri döner; etkili varsayılan `0` (devre dışı).
- `mediaMaxMb`: giden gönderimler ve gelen işleme için MB cinsinden medya boyutu sınırı.

### Tepki ayarları

- `ackReaction`: bu kanal/hesap için ack tepkisi geçersiz kılması.
- `ackReactionScope`: kapsam geçersiz kılması (`"group-mentions"` varsayılan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: gelen tepki bildirimi modu (`"own"` varsayılan, `"off"`).

### Araçlar ve oda başına geçersiz kılmalar

- `actions`: eylem başına araç kapılaması (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: oda başına ilke eşlemi. Oturum kimliği, çözümlemeden sonra kararlı oda kimliğini kullanır. (`rooms` eski bir takma addır.)
  - `groups.<room>.account`: devralınan bir oda girdisini belirli bir hesapla sınırlandırır.
  - `groups.<room>.allowBots`: kanal düzeyi ayarın oda başına geçersiz kılınması (`true` veya `"mentions"`).
  - `groups.<room>.users`: oda başına gönderen izin listesi.
  - `groups.<room>.tools`: oda başına araç izin/verme reddi geçersiz kılmaları.
  - `groups.<room>.autoReply`: oda başına mention kapılama geçersiz kılması. `true`, ilgili oda için mention gereksinimlerini devre dışı bırakır; `false` bunları tekrar zorunlu kılar.
  - `groups.<room>.skills`: oda başına skill filtresi.
  - `groups.<room>.systemPrompt`: oda başına sistem istemi parçacığı.

### Exec onay ayarları

- `execApprovals.enabled`: exec onaylarını Matrix'e özgü istemler aracılığıyla teslim eder.
- `execApprovals.approvers`: onay vermesine izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` değerine geri döner.
- `execApprovals.target`: `"dm"` (varsayılan), `"channel"` veya `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: teslimat için isteğe bağlı agent/oturum izin listeleri.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) - DM kimlik doğrulaması ve pairing akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve mention kapılama
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
