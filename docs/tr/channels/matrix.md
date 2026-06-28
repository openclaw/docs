---
read_when:
    - OpenClaw’da Matrix kurulumu
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matris
x-i18n:
    generated_at: "2026-06-28T00:13:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f7c666294daf6a38e4a25ee7f2ad2d0d87dcdabc13291b12e4861f89421a779
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, OpenClaw için indirilebilir bir kanal Plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, iş parçacıklarını, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Kurulum

Kanalı yapılandırmadan önce Matrix'i ClawHub'dan kurun:

```bash
openclaw plugins install @openclaw/matrix
```

Yalın Plugin belirtimleri önce ClawHub'ı, ardından npm yedeğini dener. Kayıt kaynağını zorlamak için `openclaw plugins install clawhub:@openclaw/matrix` veya `openclaw plugins install npm:@openclaw/matrix` kullanın.

Yerel bir checkout'tan:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` Plugin'i kaydeder ve etkinleştirir; bu yüzden ayrı bir `openclaw plugins enable matrix` adımı gerekmez. Aşağıdaki kanalı yapılandırana kadar Plugin yine de hiçbir şey yapmaz. Genel Plugin davranışı ve kurulum kuralları için [Plugins](/tr/tools/plugin) bölümüne bakın.

## Kurulum

1. Homeserver'ınızda bir Matrix hesabı oluşturun.
2. `channels.matrix` yapılandırmasını `homeserver` + `accessToken` veya `homeserver` + `userId` + `password` ile yapılandırın.
3. Gateway'i yeniden başlatın.
4. Bot ile bir DM başlatın veya onu bir odaya davet edin ([otomatik katılma](#auto-join) bölümüne bakın - yeni davetler yalnızca `autoJoin` izin verirse işlenir).

### Etkileşimli kurulum

```bash
openclaw channels add
openclaw configure --section channels
```

Sihirbaz şunları sorar: homeserver URL'si, kimlik doğrulama yöntemi (erişim token'ı veya parola), kullanıcı kimliği (yalnızca parola kimlik doğrulaması), isteğe bağlı cihaz adı, E2EE'nin etkinleştirilip etkinleştirilmeyeceği ve oda erişimi ile otomatik katılmanın yapılandırılıp yapılandırılmayacağı.

Eşleşen `MATRIX_*` ortam değişkenleri zaten varsa ve seçili hesabın kayıtlı kimlik doğrulaması yoksa sihirbaz bir ortam değişkeni kısayolu sunar. Bir izin listesini kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` komutunu çalıştırın. E2EE etkinleştirildiğinde sihirbaz yapılandırmayı yazar ve [`openclaw matrix encryption setup`](#encryption-and-verification) ile aynı önyüklemeyi çalıştırır.

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

`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir. Varsayılan ayarla bot, elle katılana kadar yeni davetlerden gelen yeni odalarda veya DM'lerde görünmez.

OpenClaw, davet anında davet edilen odanın DM mi grup mu olduğunu anlayamaz; bu yüzden DM tarzı davetler dahil tüm davetler önce `autoJoin` üzerinden geçer. `dm.policy` yalnızca daha sonra, bot katıldıktan ve oda sınıflandırıldıktan sonra uygulanır.

<Warning>
Botun kabul ettiği davetleri sınırlamak için `autoJoin: "allowlist"` ile `autoJoinAllowlist` ayarlayın veya her daveti kabul etmek için `autoJoin: "always"` kullanın.

`autoJoinAllowlist` yalnızca kararlı hedefleri kabul eder: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir; alias girdileri, davet edilen odanın iddia ettiği duruma göre değil homeserver'a göre çözümlenir.
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

- DM'ler (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` kullanın. Görünen adlar değiştirilebilir oldukları için varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true` değerini yalnızca görünen ad girdileriyle açıkça uyumluluğa ihtiyacınız olduğunda ayarlayın.
- Oda izin listesi anahtarları (`groups`, eski `rooms`): `!room:server` veya `#alias:server` kullanın. Düz oda adları varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true` değerini yalnızca katılınmış oda adı aramasıyla açıkça uyumluluğa ihtiyacınız olduğunda ayarlayın.
- Davet izin listeleri (`autoJoinAllowlist`): `!room:server`, `#alias:server` veya `*` kullanın. Düz oda adları reddedilir.

### Hesap kimliği normalleştirme

Sihirbaz, okunabilir bir adı normalleştirilmiş bir hesap kimliğine dönüştürür. Örneğin `Ops Bot`, `ops-bot` olur. İki hesabın çakışmaması için kapsamlı ortam değişkeni adlarında noktalama işaretleri kaçışlanır: `-` → `_X2D_`, yani `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşleşir.

### Önbelleğe alınmış kimlik bilgileri

Matrix, önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` altında saklar:

- varsayılan hesap: `credentials.json`
- adlandırılmış hesaplar: `credentials-<account>.json`

Önbelleğe alınmış kimlik bilgileri orada mevcut olduğunda OpenClaw, erişim token'ı yapılandırma dosyasında olmasa bile Matrix'i yapılandırılmış kabul eder; bu kurulum, `openclaw doctor` ve kanal durumu yoklamalarını kapsar.

### Ortam değişkenleri

Eşdeğer yapılandırma anahtarı ayarlanmadığında kullanılır. Varsayılan hesap öneksiz adları kullanır; adlandırılmış hesaplar sonekten önce eklenen hesap kimliğini kullanır.

| Varsayılan hesap      | Adlandırılmış hesap (`<ID>` normalleştirilmiş hesap kimliğidir) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

`ops` hesabı için adlar `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` ve benzeri olur. Kurtarma anahtarı ortam değişkenleri, anahtarı `--recovery-key-stdin` ile içeri aktardığınızda kurtarma farkındalığı olan CLI akışları (`verify backup restore`, `verify device`, `verify bootstrap`) tarafından okunur.

`MATRIX_HOMESERVER`, çalışma alanı `.env` dosyasından ayarlanamaz; [Çalışma alanı `.env` dosyaları](/tr/gateway/security) bölümüne bakın.

## Yapılandırma örneği

DM eşleştirme, oda izin listesi ve E2EE içeren pratik bir başlangıç yapılandırması:

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

Matrix yanıt akışı isteğe bağlıdır. `streaming`, OpenClaw'ın devam eden asistan yanıtını nasıl teslim edeceğini denetler; `blockStreaming`, tamamlanan her bloğun kendi Matrix mesajı olarak korunup korunmayacağını denetler.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Canlı yanıt önizlemelerini koruyup geçici araç/ilerleme satırlarını gizlemek için nesne
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

| `streaming`       | Davranış                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (varsayılan) | Tam yanıtı bekler, bir kez gönderir. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | Model mevcut bloğu yazarken normal bir metin mesajını yerinde düzenler. Standart Matrix istemcileri son düzenlemede değil, ilk önizlemede bildirim gönderebilir.              |
| `"quiet"`         | `"partial"` ile aynıdır, ancak mesaj bildirim oluşturmayan bir bildirim mesajıdır. Alıcılar yalnızca kullanıcı başına bir push kuralı tamamlanmış düzenlemeyle eşleştiğinde bildirim alır (aşağıya bakın). |

`blockStreaming`, `streaming` değerinden bağımsızdır:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (varsayılan)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Mevcut blok için canlı taslak, tamamlanan bloklar mesaj olarak tutulur | Mevcut blok için canlı taslak, yerinde tamamlanır |
| `"off"`                 | Tamamlanan her blok için bir bildirim oluşturan Matrix mesajı                     | Tam yanıt için bir bildirim oluşturan Matrix mesajı      |

Notlar:

- Bir önizleme Matrix'in olay başına boyut sınırını aşarsa OpenClaw önizleme akışını durdurur ve yalnızca son teslimata geri döner.
- Medya yanıtları ekleri her zaman normal şekilde gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Araç ilerleme önizleme güncellemeleri, Matrix önizleme akışı etkin olduğunda varsayılan olarak etkindir. Yanıt metni için önizleme düzenlemelerini koruyup araç ilerlemesini normal teslimat yolunda bırakmak için `streaming.preview.toolProgress: false` ayarlayın.
- Önizleme düzenlemeleri ek Matrix API çağrıları gerektirir. En korumacı hız sınırı profilini istiyorsanız `streaming: "off"` değerini bırakın.

## Sesli mesajlar

Gelen Matrix sesli notları, oda bahsetme kapısından önce yazıya dökülür. Bu, bot adını söyleyen bir sesli notun `requireMention: true` odasında ajanı tetiklemesine olanak tanır ve ajana yalnızca bir ses eki yer tutucusu yerine transkripti verir.

Matrix, `tools.media.audio` altında yapılandırılmış paylaşılan ses medyası sağlayıcısını kullanır; örneğin OpenAI `gpt-4o-mini-transcribe`. Sağlayıcı kurulumu ve sınırlar için [Medya araçlarına genel bakış](/tr/tools/media-overview) bölümüne bakın.

Davranış ayrıntıları:

- `m.audio` olayları ve `audio/*` MIME türüne sahip `m.file` olayları uygundur.
- Şifrelenmiş odalarda OpenClaw, transkripsiyondan önce mevcut Matrix medya yolu üzerinden eki çözer.
- Transkript, ajan isteminde makine tarafından üretilmiş ve güvenilmez olarak işaretlenir.
- Ek, aynı sesli notun aşağı akış medya araçları tarafından yeniden yazıya dökülmemesi için zaten transkribe edilmiş olarak işaretlenir.
- Ses transkripsiyonunu genel olarak devre dışı bırakmak için `tools.media.audio.enabled: false` ayarlayın.

## Onay meta verileri

Matrix yerel onay istemleri, `com.openclaw.approval` altında OpenClaw'a özgü özel olay içeriği bulunan normal `m.room.message` olaylarıdır. Matrix özel olay içeriği anahtarlarına izin verir; bu yüzden standart istemciler metin gövdesini işlemeye devam ederken OpenClaw farkındalığı olan istemciler yapılandırılmış onay kimliğini, türünü, durumunu, kullanılabilir kararları ve exec/Plugin ayrıntılarını okuyabilir.

Bir onay istemi tek bir Matrix olayı için fazla uzunsa OpenClaw görünür metni parçalara böler ve `com.openclaw.approval` değerini yalnızca ilk parçaya ekler. İzin ver/reddet kararlarına yönelik tepkiler bu ilk olaya bağlanır; böylece uzun istemler tek olaylı istemlerle aynı onay hedefini korur.

### Sessiz tamamlanmış önizlemeler için self-hosted push kuralları

`streaming: "quiet"` alıcıları yalnızca bir blok veya tur tamamlandığında bilgilendirir; kullanıcı başına bir push kuralının tamamlanmış önizleme işaretiyle eşleşmesi gerekir. Tam tarif için [sessiz önizlemeler için Matrix push kuralları](/tr/channels/matrix-push-rules) bölümüne bakın (alıcı token'ı, pusher denetimi, kural kurulumu, homeserver başına notlar).

## Botlar arası odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Ajanlar arası Matrix trafiğini bilerek istediğinizde `allowBots` kullanın:

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
- OpenClaw, kendi kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen iletileri yine de yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw, "bot tarafından yazılmış" ifadesini "bu OpenClaw Gateway üzerindeki başka bir yapılandırılmış Matrix hesabı tarafından gönderilmiş" olarak ele alır.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken katı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifreli (E2EE) odalarda, giden görüntü olayları `thumbnail_file` kullanır; böylece görüntü önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Yapılandırma gerekmez; Plugin E2EE durumunu otomatik olarak algılar.

Tüm `openclaw matrix` komutları `--verbose` (tam tanılama), `--json` (makine tarafından okunabilir çıktı) ve `--account <id>` (çok hesaplı kurulumlar) kabul eder. Çıktı, sessiz dahili SDK günlükleriyle varsayılan olarak kısadır. Aşağıdaki örnekler kanonik biçimi gösterir; bayrakları gerektiği gibi ekleyin.

### Şifrelemeyi etkinleştir

```bash
openclaw matrix encryption setup
```

Gizli depolamayı ve çapraz imzalamayı başlatır, gerekirse bir oda anahtarı yedeği oluşturur, ardından durumu ve sonraki adımları yazdırır. Kullanışlı bayraklar:

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

`verify status`, üç bağımsız güven sinyalini raporlar (`--verbose` hepsini gösterir):

- `Locally trusted`: yalnızca bu istemci tarafından güvenilir
- `Cross-signing verified`: SDK, çapraz imzalama yoluyla doğrulama bildirir
- `Signed by owner`: kendi kendini imzalama anahtarınız tarafından imzalanmış (yalnızca tanılama)

`Verified by owner`, yalnızca `Cross-signing verified` `yes` olduğunda `yes` olur. Yerel güven veya tek başına bir sahip imzası yeterli değildir.

`--allow-degraded-local-state`, Matrix hesabını önce hazırlamadan en iyi çaba tanılamaları döndürür; çevrimdışı veya kısmen yapılandırılmış yoklamalar için kullanışlıdır.

### Bu cihazı bir kurtarma anahtarıyla doğrula

Kurtarma anahtarı hassastır; komut satırında geçirmek yerine stdin üzerinden iletin. `MATRIX_RECOVERY_KEY` değerini ayarlayın (veya adlandırılmış bir hesap için `MATRIX_<ID>_RECOVERY_KEY`):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Komut üç durum bildirir:

- `Recovery key accepted`: Matrix, gizli depolama veya cihaz güveni için anahtarı kabul etti.
- `Backup usable`: oda anahtarı yedeği güvenilir kurtarma materyaliyle yüklenebilir.
- `Device verified by owner`: bu cihaz tam Matrix çapraz imzalama kimliği güvenine sahiptir.

Kurtarma anahtarı yedek materyalin kilidini açmış olsa bile, tam kimlik güveni eksik olduğunda sıfır olmayan kodla çıkar. Bu durumda, başka bir Matrix istemcisinden kendi kendine doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

`verify self`, başarıyla çıkmadan önce `Cross-signing verified: yes` için bekler. Beklemeyi ayarlamak için `--timeout-ms <ms>` kullanın.

Gerçek anahtar biçimi olan `openclaw matrix verify device "<recovery-key>"` de kabul edilir, ancak anahtar kabuk geçmişinize yazılır.

### Çapraz imzalamayı başlat veya onar

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap`, şifreli hesaplar için onarım ve kurulum komutudur. Sırasıyla şunları yapar:

- mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanarak gizli depolamayı başlatır
- çapraz imzalamayı başlatır ve eksik genel anahtarları yükler
- mevcut cihazı işaretler ve çapraz imzalar
- zaten yoksa sunucu tarafında bir oda anahtarı yedeği oluşturur

Homeserver, çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa OpenClaw önce kimlik doğrulamasız dener, ardından `m.login.dummy`, sonra `m.login.password` dener (`channels.matrix.password` gerektirir).

Kullanışlı bayraklar:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` ile eşleştirin) veya `--recovery-key <key>`
- mevcut çapraz imzalama kimliğini atmak için `--force-reset-cross-signing` (yalnızca bilinçli olarak; etkin kurtarma anahtarının depolanmış olmasını veya `--recovery-key-stdin` ile sağlanmasını gerektirir)

### Oda anahtarı yedeği

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`, sunucu tarafında bir yedeğin bulunup bulunmadığını ve bu cihazın yedeğin şifresini çözüp çözemediğini gösterir. `backup restore`, yedeklenmiş oda anahtarlarını yerel kripto deposuna içe aktarır; kurtarma anahtarı zaten diskteyse `--recovery-key-stdin` değerini atlayabilirsiniz.

Bozuk bir yedeği yeni bir temel durumla değiştirmek için (kurtarılamayan eski geçmişin kaybını kabul eder; mevcut yedek sırrı yüklenemiyorsa gizli depolamayı da yeniden oluşturabilir):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` değerini yalnızca önceki kurtarma anahtarının yeni yedek temelinin kilidini artık açmamasını bilinçli olarak istediğinizde ekleyin.

### Doğrulamaları listeleme, isteme ve yanıtlama

```bash
openclaw matrix verify list
```

Seçili hesap için bekleyen doğrulama isteklerini listeler.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Bu OpenClaw hesabından bir doğrulama isteği gönderir. `--own-user`, kendi kendine doğrulama ister (istemi aynı kullanıcının başka bir Matrix istemcisinde kabul edersiniz); `--user-id`/`--device-id`/`--room-id` başka birini hedefler. `--own-user`, diğer hedefleme bayraklarıyla birleştirilemez.

Daha düşük düzeyli yaşam döngüsü işleme için, genellikle başka bir istemciden gelen istekleri izlerken, bu komutlar belirli bir `<id>` isteği üzerinde çalışır (`verify list` ve `verify request` tarafından yazdırılır):

| Komut                                      | Amaç                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Gelen bir isteği kabul et                                            |
| `openclaw matrix verify start <id>`        | SAS akışını başlat                                                   |
| `openclaw matrix verify sas <id>`          | SAS emojisini veya ondalık değerleri yazdır                          |
| `openclaw matrix verify confirm-sas <id>`  | SAS'nin diğer istemcinin gösterdiğiyle eşleştiğini onayla            |
| `openclaw matrix verify mismatch-sas <id>` | Emoji veya ondalık değerler eşleşmediğinde SAS'yi reddet             |
| `openclaw matrix verify cancel <id>`       | İptal et; isteğe bağlı `--reason <text>` ve `--code <matrix-code>` alır |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` ve `cancel`, doğrulama belirli bir doğrudan mesaj odasına bağlı olduğunda DM takip ipuçları olarak `--user-id` ve `--room-id` kabul eder.

### Çok hesaplı notlar

`--account <id>` olmadan, Matrix CLI komutları örtük varsayılan hesabı kullanır. Birden fazla adlandırılmış hesabınız varsa ve `channels.matrix.defaultAccount` ayarlamadıysanız, tahmin etmeyi reddeder ve seçim yapmanızı ister. E2EE adlandırılmış bir hesap için devre dışı veya kullanılamaz olduğunda, hatalar o hesabın yapılandırma anahtarını gösterir; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz başka bir Matrix istemcisinde kendi kendine doğrulama ister, yinelemeleri atlar ve bir bekleme süresi uygular (varsayılan olarak 24 saat). `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca mevcut gizli depolamayı ve çapraz imzalama kimliğini yeniden kullanan korumacı bir kripto başlatma geçişi çalıştırır. Başlatma durumu bozuksa OpenClaw, `channels.matrix.password` olmadan bile denetimli bir onarım dener; homeserver parola UIA gerektiriyorsa başlangıç bir uyarı günlüğe yazar ve ölümcül olmayan durumda kalır. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix geçişine](/tr/channels/matrix-migration) bakın.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix, doğrulama yaşam döngüsü bildirimlerini katı DM doğrulama odasına `m.notice` iletileri olarak gönderir: istek, hazır (("Emojiyle doğrula" yönlendirmesiyle), başlatma/tamamlama ve kullanılabilir olduğunda SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik olarak kabul edilir. Kendi kendine doğrulama için OpenClaw, SAS akışını otomatik olarak başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar; yine de Matrix istemcinizde karşılaştırıp "Eşleşiyorlar" seçeneğini onaylamanız gerekir.

    Doğrulama sistemi bildirimleri agent sohbet işlem hattına iletilmez.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    `verify status`, mevcut cihazın artık homeserver üzerinde listelenmediğini söylüyorsa yeni bir OpenClaw Matrix cihazı oluşturun. Parola ile oturum açma için:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Token kimlik doğrulaması için Matrix istemcinizde veya yönetici arayüzünüzde yeni bir erişim token'ı oluşturun, ardından OpenClaw'ı güncelleyin:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` değerini başarısız komuttaki hesap kimliğiyle değiştirin veya varsayılan hesap için `--account` değerini atlayın.

  </Accordion>

  <Accordion title="Device hygiene">
    OpenClaw tarafından yönetilen eski cihazlar birikebilir. Listeleyin ve ayıklayın:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE, IndexedDB dolgusu olarak `fake-indexeddb` ile resmi `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` dosyasında kalıcı olur (kısıtlayıcı dosya izinleriyle).

    Şifreli runtime durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında bulunur ve eşitleme deposunu, kripto deposunu, kurtarma anahtarını, IDB anlık görüntüsünü, iş parçacığı bağlamalarını ve başlangıç doğrulama durumunu içerir. Token değiştiğinde ancak hesap kimliği aynı kaldığında, OpenClaw önceki durumun görünür kalması için en iyi mevcut kökü yeniden kullanır.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçili hesabın Matrix öz profilini güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

`mxc://` avatar URL'lerini doğrudan iletebilirsiniz; `http://` veya `https://` ilettiğinizde OpenClaw önce dosyayı yükler ve çözümlenen `mxc://` URL'sini `channels.matrix.avatarUrl` içine (veya hesap başına geçersiz kılmaya) kaydeder.

## Thread'ler

Matrix, hem otomatik yanıtlar hem de mesaj aracı gönderimleri için yerel Matrix thread'lerini destekler. Davranışı iki bağımsız ayar denetler:

### Oturum yönlendirme (`sessionScope`)

`dm.sessionScope`, Matrix DM odalarının OpenClaw oturumlarına nasıl eşleneceğine karar verir:

- `"per-user"` (varsayılan): aynı yönlendirilmiş eşe sahip tüm DM odaları tek bir oturumu paylaşır.
- `"per-room"`: eş aynı olsa bile her Matrix DM odası kendi oturum anahtarını alır.

Açık konuşma bağlamaları her zaman `sessionScope` üzerinde önceliklidir; bu nedenle bağlanmış odalar ve thread'ler seçtikleri hedef oturumu korur.

### Yanıt thread'leri (`threadReplies`)

`threadReplies`, botun yanıtını nereye göndereceğine karar verir:

- `"off"`: yanıtlar üst düzeydedir. Gelen thread'li mesajlar üst oturumda kalır.
- `"inbound"`: yalnızca gelen mesaj zaten o thread'in içindeyse thread içinde yanıt verir.
- `"always"`: tetikleyen mesajda köklenen bir thread içinde yanıt verir; bu konuşma ilk tetiklemeden itibaren eşleşen thread kapsamlı bir oturum üzerinden yönlendirilir.

`dm.threadReplies` bunu yalnızca DM'ler için geçersiz kılar; örneğin, oda thread'lerini yalıtılmış tutarken DM'leri düz tutabilirsiniz.

### Thread kalıtımı ve slash komutları

- Gelen thread'li mesajlar, thread kök mesajını ek agent bağlamı olarak içerir.
- Mesaj aracı gönderimleri, açık bir `threadId` sağlanmadığı sürece aynı odayı (veya aynı DM kullanıcı hedefini) hedeflerken geçerli Matrix thread'ini otomatik olarak devralır.
- DM kullanıcı hedefi yeniden kullanımı yalnızca geçerli oturum meta verisi aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi halde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve thread'e bağlı `/acp spawn` komutlarının tümü Matrix odalarında ve DM'lerde çalışır.
- Üst düzey `/focus`, `threadBindings.spawnSessions` etkin olduğunda yeni bir Matrix thread'i oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix thread'i içinde `/focus` veya `/acp spawn --thread here` çalıştırmak, o thread'i yerinde bağlar.

OpenClaw, aynı paylaşılan oturumdaki başka bir DM odasıyla çakışan bir Matrix DM odası algıladığında, o odada `/focus` kaçış yolunu işaret eden ve `dm.sessionScope` değişikliği öneren tek seferlik bir `m.notice` gönderir. Bildirim yalnızca thread bağlamaları etkin olduğunda görünür.

## ACP konuşma bağlamaları

Matrix odaları, DM'ler ve mevcut Matrix thread'leri, sohbet yüzeyi değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut thread içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM'de veya odada, geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix thread'i içinde `--bind here`, o geçerli thread'i yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Notlar:

- `--bind here`, alt Matrix thread'i oluşturmaz.
- `threadBindings.spawnSessions`, OpenClaw'ın alt Matrix thread'i oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` komutunu sınırlar.

### Thread bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` üzerinden devralır ve kanal başına geçersiz kılmaları da destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix thread'e bağlı oturum oluşturma varsayılan olarak açıktır:

- Üst düzey `/focus` ve `/acp spawn --thread auto|here` komutlarının Matrix thread'leri oluşturmasını/bağlamasını engellemek için `threadBindings.spawnSessions: false` ayarlayın.
- Yerel subagent thread oluşturma işlemleri üst transcript'i çatallamamalıysa `threadBindings.defaultSpawnContext: "isolated"` ayarlayın.

## Tepkiler

Matrix, giden tepkileri, gelen tepki bildirimlerini ve ack tepkilerini destekler.

Giden tepki aracı `channels.matrix.actions.reactions` tarafından sınırlandırılır:

- `react`, bir Matrix olayına tepki ekler.
- `reactions`, bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, botun o olaydaki kendi tepkilerini kaldırır.
- `remove: true`, bottan yalnızca belirtilen emoji tepkisini kaldırır.

**Çözümleme sırası** (ilk tanımlı değer kazanır):

| Ayar                    | Sıra                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | hesap başına → kanal → `messages.ackReaction` → agent kimliği emoji yedeği       |
| `ackReactionScope`      | hesap başına → kanal → `messages.ackReactionScope` → varsayılan `"group-mentions"` |
| `reactionNotifications` | hesap başına → kanal → varsayılan `"own"`                                        |

`reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedeflediklerinde eklenen `m.reaction` olaylarını iletir; `"off"` tepki sistem olaylarını devre dışı bırakır. Tepki kaldırmaları sistem olaylarına sentezlenmez, çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaction olarak sunar.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı agent'ı tetiklediğinde `InboundHistory` olarak kaç son oda mesajının dahil edileceğini denetler. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmamışsa etkili varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca oda kapsamındadır. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen kapsamdadır: OpenClaw henüz yanıt tetiklememiş oda mesajlarını arabelleğe alır, ardından bir mention veya başka bir tetikleyici geldiğinde o pencerenin anlık görüntüsünü alır.
- Geçerli tetikleme mesajı `InboundHistory` içine dahil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, thread kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı allowlist kontrollerinin izin verdiği gönderenlerle filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de açıkça alıntılanmış tek bir yanıtı tutar.

Bu ayar, gelen mesajın kendisinin yanıt tetikleyip tetikleyemeyeceğini değil, ek bağlam görünürlüğünü etkiler.
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

Mention kapılama ve allowlist davranışı için [Gruplar](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse, OpenClaw yeni bir kod üretmek yerine aynı bekleyen eşleştirme kodunu yeniden kullanır ve kısa bir bekleme süresinden sonra hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Eşleştirme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu eşzamanlılıktan çıkarsa, OpenClaw canlı DM yerine eski tek kişilik odaları işaret eden eski `m.direct` eşlemeleriyle kalabilir. Bir eş için geçerli eşlemeyi inceleyin:

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
- sağlıklı DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Eski odaları otomatik olarak silmez. Sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece gelecekteki Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları doğru odayı hedefler.

## Exec onayları

Matrix, yerel bir onay istemcisi olarak davranabilir. `channels.matrix.execApprovals` altında (veya hesap başına geçersiz kılma için `channels.matrix.accounts.<account>.execApprovals` altında) yapılandırın:

- `enabled`: onayları Matrix'e özgü istemlerle iletir. Ayarlanmamışsa veya `"auto"` ise, en az bir onaylayıcı çözümlenebildiğinde Matrix otomatik olarak etkinleşir. Açıkça devre dışı bırakmak için `false` ayarlayın.
- `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (`@owner:example.org`). İsteğe bağlıdır; `channels.matrix.dm.allowFrom` değerine geri döner.
- `target`: istemlerin nereye gideceği. `"dm"` (varsayılan) onaylayıcı DM'lerine gönderir; `"channel"` kaynak Matrix odasına veya DM'ye gönderir; `"both"` ikisine de gönderir.
- `agentFilter` / `sessionFilter`: hangi agent'ların/oturumların Matrix teslimini tetikleyeceği için isteğe bağlı allowlist'ler.

Yetkilendirme, onay türleri arasında biraz farklıdır:

- **Exec onayları** `execApprovals.approvers` kullanır ve `dm.allowFrom` değerine geri döner.
- **Plugin onayları** yalnızca `dm.allowFrom` üzerinden yetkilendirir.

Her iki tür de Matrix tepki kısayollarını ve mesaj güncellemelerini paylaşır. Onaylayıcılar birincil onay mesajında tepki kısayollarını görür:

- `✅` bir kez izin ver
- `❌` reddet
- `♾️` her zaman izin ver (etkili exec politikası buna izin verdiğinde)

Yedek slash komutları: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; `channel` veya `both` değerini yalnızca güvenilir odalarda etkinleştirin.

İlgili: [Exec onayları](/tr/tools/exec-approvals).

## Slash komutları

Slash komutları (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` vb.) doğrudan DM'lerde çalışır. Odalarda OpenClaw, botun kendi Matrix mention'ı ile öneklenmiş komutları da tanır; bu nedenle `@bot:server /new`, özel mention regex'i olmadan komut yolunu tetikler. Bu, Element ve benzeri istemcilerin kullanıcı komutu yazmadan önce botu tab ile tamamladığında yaydığı oda tarzı `@mention /command` gönderilerine botun duyarlı kalmasını sağlar.

Yetkilendirme kuralları yine geçerlidir: komut gönderenler, düz mesajlarla aynı DM veya oda allowlist/sahip politikalarını karşılamalıdır.

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

- Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadığı sürece adlandırılmış hesaplar için varsayılan görevi görür.
- Devralınan bir oda girdisini `groups.<room>.account` ile belirli bir hesaba kapsamlandırın. `account` olmadan girdiler hesaplar arasında paylaşılır; varsayılan hesap üst düzeyde yapılandırıldığında `account: "default"` hâlâ çalışır.

**Varsayılan hesap seçimi:**

- Örtük yönlendirme, yoklama ve CLI komutlarının tercih edeceği adlandırılmış hesabı seçmek için `defaultAccount` değerini ayarlayın.
- Birden fazla hesabınız varsa ve bunlardan birinin adı tam olarak `default` ise, `defaultAccount` ayarlanmamış olsa bile OpenClaw bunu örtük olarak kullanır.
- Birden fazla adlandırılmış hesabınız varsa ve varsayılan seçilmediyse, CLI komutları tahminde bulunmayı reddeder - `defaultAccount` ayarlayın veya `--account <id>` geçirin.
- Üst düzey `channels.matrix.*` bloğu, yalnızca kimlik doğrulaması tamamlandığında (`homeserver` + `accessToken` ya da `homeserver` + `userId` + `password`) örtük `default` hesabı olarak değerlendirilir. Adlandırılmış hesaplar, önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı karşıladığında `homeserver` + `userId` üzerinden keşfedilebilir kalır.

**Yükseltme:**

- OpenClaw onarım veya kurulum sırasında tek hesaplı bir yapılandırmayı çok hesaplıya yükselttiğinde, varsa mevcut adlandırılmış hesabı korur veya `defaultAccount` zaten bir hesabı gösteriyorsa onu korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları yükseltilen hesaba taşınır; paylaşılan teslim politikası anahtarları üst düzeyde kalır.

Paylaşılan çok hesaplı kalıp için [Yapılandırma başvurusu](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'ları

Varsayılan olarak OpenClaw, SSRF koruması için özel/dahili Matrix homeserver'larını engeller; hesap bazında
açıkça dahil olmanız gerekir.

Homeserver'ınız localhost, LAN/Tailscale IP'si veya dahili bir ana makine adında çalışıyorsa, ilgili Matrix hesabı için
`network.dangerouslyAllowPrivateNetwork` değerini etkinleştirin:

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

Bu açık dahil etme yalnızca güvenilir özel/dahili hedeflere izin verir. Şunun gibi herkese açık düz metin homeserver'ları
`http://matrix.example.org:8008` engelli kalır. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden yönlendirme

Matrix dağıtımınız açık bir giden HTTP(S) proxy'si gerektiriyorsa, `channels.matrix.proxy` değerini ayarlayın:

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

Matrix, OpenClaw sizden bir oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. Açık teslim hedeflerini, cron işlerini, bağlamaları veya izin listelerini yapılandırırken
Matrix'teki oda kimliğinin tam büyük/küçük harf biçimini kullanın.
OpenClaw, depolama için dahili oturum anahtarlarını kanonik tutar; bu yüzden bu küçük harfli
anahtarlar Matrix teslim kimlikleri için güvenilir bir kaynak değildir.

Canlı dizin araması, oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, ilgili homeserver'daki Matrix kullanıcı dizinini sorgular.
- Oda aramaları, açık oda kimliklerini ve takma adları doğrudan kabul eder. Katılınmış oda adı araması en iyi çabayla yapılır ve yalnızca `dangerouslyAllowNameMatching: true` ayarlandığında çalışma zamanı oda izin listelerine uygulanır.
- Bir oda adı bir kimliğe veya takma ada çözümlenemezse, çalışma zamanı izin listesi çözümlemesi tarafından yok sayılır.

## Yapılandırma başvurusu

İzin listesi tarzı kullanıcı alanları (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) tam Matrix kullanıcı kimliklerini kabul eder (en güvenlisi). Kimlik olmayan kullanıcı girdileri varsayılan olarak yok sayılır. `dangerouslyAllowNameMatching: true` ayarlarsanız, tam Matrix dizini görünen ad eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi her değiştiğinde çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır.

Oda izin listesi anahtarları (`groups`, eski `rooms`) oda kimlikleri veya takma adlar olmalıdır. Düz oda adı anahtarları varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true`, katılınmış oda adlarına karşı en iyi çabayla aramayı geri getirir.

### Hesap ve bağlantı

- `enabled`: kanalı etkinleştirin veya devre dışı bırakın.
- `name`: hesap için isteğe bağlı görüntüleme etiketi.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `accounts`: adlandırılmış hesap başına geçersiz kılmalar. Üst düzey `channels.matrix` değerleri varsayılan olarak devralınır.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu hesabın `localhost`, LAN/Tailscale IP'leri veya dahili ana makine adlarına bağlanmasına izin verin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Hesap başına geçersiz kılma desteklenir.
- `userId`: tam Matrix kullanıcı kimliği (`@bot:example.org`).
- `accessToken`: token tabanlı kimlik doğrulama için erişim token'ı. Düz metin ve SecretRef değerleri env/file/exec sağlayıcıları genelinde desteklenir ([Gizli Bilgiler Yönetimi](/tr/gateway/secrets)).
- `password`: parola tabanlı oturum açma için parola. Düz metin ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile oturum açma sırasında kullanılan cihaz görüntüleme adı.
- `avatarUrl`: profil eşitlemesi ve `profile set` güncellemeleri için depolanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında getirilen en fazla olay sayısı.

### Şifreleme

- `encryption`: E2EE'yi etkinleştirin. Varsayılan: `false`.
- `startupVerification`: `"if-unverified"` (E2EE açıkken varsayılan) veya `"off"`. Bu cihaz doğrulanmamışsa başlangıçta öz doğrulamayı otomatik olarak ister.
- `startupVerificationCooldownHours`: sonraki otomatik başlangıç isteğinden önceki bekleme süresi. Varsayılan: `24`.

### Erişim ve politika

- `groupPolicy`: `"open"`, `"allowlist"` veya `"disabled"`. Varsayılan: `"allowlist"`.
- `groupAllowFrom`: oda trafiği için kullanıcı kimlikleri izin listesi.
- `dm.enabled`: `false` olduğunda tüm DM'leri yok sayar. Varsayılan: `true`.
- `dm.policy`: `"pairing"` (varsayılan), `"allowlist"`, `"open"` veya `"disabled"`. Bot odaya katıldıktan ve odayı DM olarak sınıflandırdıktan sonra uygulanır; davet işleme davranışını etkilemez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimlikleri izin listesi.
- `dm.sessionScope`: `"per-user"` (varsayılan) veya `"per-room"`.
- `dm.threadReplies`: yanıt iş parçacığı oluşturma için yalnızca DM geçersiz kılması (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: yapılandırılmış diğer Matrix bot hesaplarından gelen mesajları kabul edin (`true` veya `"mentions"`).
- `allowlistOnly`: `true` olduğunda, tüm etkin DM politikalarını (`"disabled"` hariç) ve `"open"` grup politikalarını `"allowlist"` olmaya zorlar. `"disabled"` politikalarını değiştirmez.
- `dangerouslyAllowNameMatching`: `true` olduğunda, kullanıcı izin listesi girdileri için Matrix görünen ad dizini aramasına ve oda izin listesi anahtarları için katılınmış oda adı aramasına izin verir. Tam `@user:server` kimliklerini ve oda kimliklerini veya takma adları tercih edin.
- `autoJoin`: `"always"`, `"allowlist"` veya `"off"`. Varsayılan: `"off"`. DM tarzı davetler dahil her Matrix davetine uygulanır.
- `autoJoinAllowlist`: `autoJoin` `"allowlist"` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri, davet edilen odanın iddia ettiği duruma göre değil, homeserver'a göre çözümlenir.
- `contextVisibility`: ek bağlam görünürlüğü (`"all"` varsayılan, `"allowlist"`, `"allowlist_quote"`).

### Yanıt davranışı

- `replyToMode`: `"off"`, `"first"`, `"all"` veya `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` veya `"always"`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirme ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `streaming`: `"off"` (varsayılan), `"partial"`, `"quiet"` veya nesne biçimi `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: `true` olduğunda, tamamlanmış asistan blokları ayrı ilerleme mesajları olarak tutulur.
- `markdown`: giden metin için isteğe bağlı Markdown işleme yapılandırması.
- `responsePrefix`: giden yanıtlara başa eklenen isteğe bağlı dize.
- `textChunkLimit`: `chunkMode: "length"` olduğunda karakter cinsinden giden parça boyutu. Varsayılan: `4000`.
- `chunkMode`: `"length"` (varsayılan, karakter sayısına göre böler) veya `"newline"` (satır sınırlarında böler).
- `historyLimit`: bir oda mesajı agent'ı tetiklediğinde `InboundHistory` olarak dahil edilen son oda mesajlarının sayısı. `messages.groupChat.historyLimit` değerine geri döner; etkin varsayılan `0` (devre dışı).
- `mediaMaxMb`: giden gönderimler ve gelen işleme için MB cinsinden medya boyutu üst sınırı.

### Tepki ayarları

- `ackReaction`: bu kanal/hesap için onay tepkisi geçersiz kılması.
- `ackReactionScope`: kapsam geçersiz kılması (`"group-mentions"` varsayılan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: gelen tepki bildirimi modu (`"own"` varsayılan, `"off"`).

### Araçlar ve oda başına geçersiz kılmalar

- `actions`: eylem başına araç kapılama (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: oda başına politika haritası. Oturum kimliği, çözümlemeden sonra kararlı oda kimliğini kullanır. (`rooms` eski bir takma addır.)
  - `groups.<room>.account`: devralınan tek bir oda girdisini belirli bir hesapla sınırlayın.
  - `groups.<room>.allowBots`: kanal düzeyi ayarın oda başına geçersiz kılınması (`true` veya `"mentions"`).
  - `groups.<room>.users`: oda başına gönderen izin listesi.
  - `groups.<room>.tools`: oda başına araç izin verme/reddetme geçersiz kılmaları.
  - `groups.<room>.autoReply`: oda başına bahsetme kapılama geçersiz kılması. `true`, o oda için bahsetme gereksinimlerini devre dışı bırakır; `false` bunları yeniden zorunlu kılar.
  - `groups.<room>.skills`: oda başına Skills filtresi.
  - `groups.<room>.systemPrompt`: oda başına sistem istemi parçacığı.

### Exec onay ayarları

- `execApprovals.enabled`: exec onaylarını Matrix yerel istemleri üzerinden teslim edin.
- `execApprovals.approvers`: onay vermesine izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` değerine geri döner.
- `execApprovals.target`: `"dm"` (varsayılan), `"channel"` veya `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: teslim için isteğe bağlı agent/oturum izin listeleri.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme kapılama
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sertleştirme
