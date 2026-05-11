---
read_when:
    - OpenClaw’da Matrix Kurulumu
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matris
x-i18n:
    generated_at: "2026-05-11T20:21:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, OpenClaw için indirilebilir bir kanal Plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, ileti dizilerini, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Yükle

Kanalı yapılandırmadan önce Matrix'i ClawHub'dan yükleyin:

```bash
openclaw plugins install @openclaw/matrix
```

Yalın Plugin belirtimleri önce ClawHub'ı, ardından npm yedeğini dener. Kayıt kaynağını zorlamak için `openclaw plugins install clawhub:@openclaw/matrix` veya `openclaw plugins install npm:@openclaw/matrix` kullanın.

Yerel bir checkout'tan:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`, Plugin'i kaydeder ve etkinleştirir; bu nedenle ayrı bir `openclaw plugins enable matrix` adımı gerekmez. Aşağıdaki kanalı yapılandırana kadar Plugin yine de hiçbir şey yapmaz. Genel Plugin davranışı ve yükleme kuralları için [Plugins](/tr/tools/plugin) bölümüne bakın.

## Kurulum

1. Homeserver'ınızda bir Matrix hesabı oluşturun.
2. `channels.matrix` öğesini `homeserver` + `accessToken` veya `homeserver` + `userId` + `password` ile yapılandırın.
3. Gateway'i yeniden başlatın.
4. Bot ile bir DM başlatın veya onu bir odaya davet edin (bkz. [otomatik katılma](#auto-join) - yeni davetler yalnızca `autoJoin` izin verdiğinde ulaşır).

### Etkileşimli kurulum

```bash
openclaw channels add
openclaw configure --section channels
```

Sihirbaz şunları sorar: homeserver URL'si, kimlik doğrulama yöntemi (erişim belirteci veya parola), kullanıcı ID'si (yalnızca parola kimlik doğrulaması), isteğe bağlı cihaz adı, E2EE'nin etkinleştirilip etkinleştirilmeyeceği ve oda erişimi ile otomatik katılmanın yapılandırılıp yapılandırılmayacağı.

Eşleşen `MATRIX_*` env vars zaten varsa ve seçilen hesabın kayıtlı kimlik doğrulaması yoksa sihirbaz bir env-var kısayolu sunar. Bir allowlist kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` çalıştırın. E2EE etkinleştirildiğinde sihirbaz yapılandırmayı yazar ve [`openclaw matrix encryption setup`](#encryption-and-verification) ile aynı bootstrap'i çalıştırır.

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

`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir. Varsayılanla, siz manuel olarak katılana kadar bot yeni odalarda veya yeni davetlerden gelen DM'lerde görünmez.

OpenClaw, davet anında davet edilen odanın DM mi yoksa grup mu olduğunu anlayamaz; bu nedenle DM tarzı davetler dahil tüm davetler önce `autoJoin` üzerinden geçer. `dm.policy` yalnızca daha sonra, bot katıldıktan ve oda sınıflandırıldıktan sonra uygulanır.

<Warning>
Botun hangi davetleri kabul edeceğini kısıtlamak için `autoJoin: "allowlist"` artı `autoJoinAllowlist` ayarlayın veya her daveti kabul etmek için `autoJoin: "always"` kullanın.

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

### Allowlist hedef biçimleri

DM ve oda allowlist'leri en iyi kararlı ID'lerle doldurulur:

- DM'ler (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` kullanın. Görünen adlar değiştirilebilir oldukları için varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true` ayarını yalnızca görünen ad girdileriyle uyumluluğa açıkça ihtiyaç duyduğunuzda ayarlayın.
- Oda allowlist anahtarları (`groups`, eski `rooms`): `!room:server` veya `#alias:server` kullanın. Düz oda adları varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true` ayarını yalnızca katılınmış oda adı aramasıyla uyumluluğa açıkça ihtiyaç duyduğunuzda ayarlayın.
- Davet allowlist'leri (`autoJoinAllowlist`): `!room:server`, `#alias:server` veya `*` kullanın. Düz oda adları reddedilir.

### Hesap ID'si normalleştirme

Sihirbaz, kullanıcı dostu bir adı normalleştirilmiş hesap ID'sine dönüştürür. Örneğin, `Ops Bot` değeri `ops-bot` olur. İki hesabın çakışmaması için noktalama işaretleri kapsamlı env-var adlarında kaçışlanır: `-` → `_X2D_`, bu nedenle `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşleşir.

### Önbelleğe alınmış kimlik bilgileri

Matrix, önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` altında saklar:

- varsayılan hesap: `credentials.json`
- adlandırılmış hesaplar: `credentials-<account>.json`

Önbelleğe alınmış kimlik bilgileri burada bulunduğunda OpenClaw, erişim belirteci yapılandırma dosyasında olmasa bile Matrix'i yapılandırılmış kabul eder; bu kurulum, `openclaw doctor` ve kanal durumu yoklamalarını kapsar.

### Ortam değişkenleri

Eşdeğer yapılandırma anahtarı ayarlanmadığında kullanılır. Varsayılan hesap ön eksiz adları kullanır; adlandırılmış hesaplar, son ekten önce eklenen hesap ID'sini kullanır.

| Varsayılan hesap      | Adlandırılmış hesap (`<ID>` normalleştirilmiş hesap ID'sidir) |
| --------------------- | ------------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                      |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                                    |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                         |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                        |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                       |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                                     |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                                    |

`ops` hesabı için adlar `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` ve benzeri olur. Recovery key env vars, anahtarı `--recovery-key-stdin` ile pipe ettiğinizde recovery-aware CLI akışları (`verify backup restore`, `verify device`, `verify bootstrap`) tarafından okunur.

`MATRIX_HOMESERVER` bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Yapılandırma örneği

DM eşleştirme, oda allowlist'i ve E2EE içeren pratik bir temel:

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

Matrix yanıt akışı isteğe bağlıdır. `streaming`, OpenClaw'ın devam eden asistan yanıtını nasıl ileteceğini denetler; `blockStreaming`, tamamlanan her bloğun kendi Matrix mesajı olarak korunup korunmayacağını denetler.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Canlı yanıt önizlemelerini koruyup ara tool/ilerleme satırlarını gizlemek için nesne
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

| `streaming`          | Davranış                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (varsayılan) | Tam yanıtı bekle, bir kez gönder. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                       |
| `"partial"`          | Model geçerli bloğu yazarken bir normal metin mesajını yerinde düzenler. Standart Matrix istemcileri son düzenlemede değil ilk önizlemede bildirim gönderebilir.                 |
| `"quiet"`            | `"partial"` ile aynıdır, ancak mesaj bildirim göndermeyen bir bildirimdir. Alıcılar yalnızca kullanıcı başına bir push kuralı sonlandırılmış düzenlemeyle eşleştiğinde bildirim alır (aşağıya bakın). |

`blockStreaming`, `streaming` öğesinden bağımsızdır:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (varsayılan)                       |
| ----------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `"partial"` / `"quiet"` | Geçerli blok için canlı taslak, tamamlanan bloklar mesaj olarak tutulur  | Geçerli blok için canlı taslak, yerinde sonlandırılır       |
| `"off"`                 | Tamamlanan blok başına bir bildirimli Matrix mesajı                      | Tam yanıt için bir bildirimli Matrix mesajı                 |

Notlar:

- Bir önizleme Matrix'in etkinlik başına boyut sınırını aşarsa OpenClaw önizleme akışını durdurur ve yalnızca son teslimata geri döner.
- Medya yanıtları ekleri her zaman normal şekilde gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Matrix önizleme akışı etkinken tool progress önizleme güncellemeleri varsayılan olarak etkindir. Yanıt metni için önizleme düzenlemelerini koruyup tool progress'i normal teslimat yolunda bırakmak için `streaming.preview.toolProgress: false` ayarlayın.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En tutucu rate-limit profilini istiyorsanız `streaming: "off"` bırakın.

## Onay meta verileri

Matrix yerel onay istemleri, `com.openclaw.approval` altında OpenClaw'a özgü özel etkinlik içeriğine sahip normal `m.room.message` etkinlikleridir. Matrix özel etkinlik içeriği anahtarlarına izin verir; bu nedenle standart istemciler metin gövdesini işlemeye devam ederken OpenClaw-aware istemciler yapılandırılmış onay ID'sini, türünü, durumunu, kullanılabilir kararları ve exec/Plugin ayrıntılarını okuyabilir.

Bir onay istemi tek bir Matrix etkinliği için çok uzun olduğunda OpenClaw görünen metni parçalara böler ve `com.openclaw.approval` öğesini yalnızca ilk parçaya ekler. İzin ver/reddet kararları için tepkiler bu ilk etkinliğe bağlanır; böylece uzun istemler tek etkinlikli istemlerle aynı onay hedefini korur.

### Sessiz sonlandırılmış önizlemeler için self-hosted push kuralları

`streaming: "quiet"`, alıcılara yalnızca bir blok veya dönüş sonlandırıldığında bildirim gönderir; kullanıcı başına bir push kuralının sonlandırılmış önizleme işaretçisiyle eşleşmesi gerekir. Tam tarif için [Sessiz önizlemeler için Matrix push kuralları](/tr/channels/matrix-push-rules) bölümüne bakın (alıcı belirteci, pusher denetimi, kural kurulumu, homeserver başına notlar).

## Botlar arası odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Inter-agent Matrix trafiğini bilerek istediğinizde `allowBots` kullanın:

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

- `allowBots: true`, izin verilen odalarda ve DM'lerde diğer yapılandırılmış Matrix bot hesaplarından gelen mesajları kabul eder.
- `allowBots: "mentions"`, bu mesajları yalnızca odalarda bu bottan görünür şekilde bahsettiklerinde kabul eder. DM'lere yine de izin verilir.
- `groups.<room>.allowBots`, bir oda için hesap düzeyindeki ayarı geçersiz kılar.
- OpenClaw, self-reply döngülerini önlemek için aynı Matrix kullanıcı ID'sinden gelen mesajları yine de yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw "bot-authored" değerini "bu OpenClaw gateway üzerinde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak değerlendirir.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken katı oda allowlist'leri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifreli (E2EE) odalarda, giden görüntü olayları `thumbnail_file` kullanır; böylece görüntü önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Yapılandırma gerekmez - Plugin, E2EE durumunu otomatik olarak algılar.

Tüm `openclaw matrix` komutları `--verbose` (tam tanılama), `--json` (makine tarafından okunabilir çıktı) ve `--account <id>` (çok hesaplı kurulumlar) kabul eder. Çıktı, sessiz dahili SDK günlük kaydıyla varsayılan olarak özlüdür. Aşağıdaki örnekler kanonik biçimi gösterir; bayrakları gerektiği gibi ekleyin.

### Şifrelemeyi etkinleştir

```bash
openclaw matrix encryption setup
```

Gizli depolamayı ve çapraz imzalamayı başlatır, gerekirse bir oda anahtarı yedeği oluşturur, ardından durumu ve sonraki adımları yazdırır. Kullanışlı bayraklar:

- `--recovery-key <key>` başlatmadan önce bir kurtarma anahtarı uygula (aşağıda belgelenen stdin biçimini tercih edin)
- `--force-reset-cross-signing` mevcut çapraz imzalama kimliğini at ve yenisini oluştur (yalnızca bilinçli olarak kullanın)

Yeni bir hesap için E2EE'yi oluşturma sırasında etkinleştirin:

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
- `Cross-signing verified`: SDK, çapraz imzalama yoluyla doğrulama bildiriyor
- `Signed by owner`: kendi öz imzalama anahtarınız tarafından imzalanmış (yalnızca tanılama)

`Verified by owner`, yalnızca `Cross-signing verified` `yes` olduğunda `yes` olur. Yerel güven veya tek başına sahip imzası yeterli değildir.

`--allow-degraded-local-state`, önce Matrix hesabını hazırlamadan en iyi çabayla tanılama döndürür; çevrimdışı veya kısmen yapılandırılmış yoklamalar için kullanışlıdır.

### Bu cihazı kurtarma anahtarıyla doğrula

Kurtarma anahtarı hassastır - komut satırında geçirmek yerine stdin üzerinden yönlendirin. `MATRIX_RECOVERY_KEY` değerini ayarlayın (veya adlandırılmış bir hesap için `MATRIX_<ID>_RECOVERY_KEY`):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Komut üç durum bildirir:

- `Recovery key accepted`: Matrix, gizli depolama veya cihaz güveni için anahtarı kabul etti.
- `Backup usable`: oda anahtarı yedeği, güvenilir kurtarma malzemesiyle yüklenebilir.
- `Device verified by owner`: bu cihaz tam Matrix çapraz imzalama kimlik güvenine sahiptir.

Kurtarma anahtarı yedek malzemeyi açmış olsa bile, tam kimlik güveni eksikse sıfır olmayan kodla çıkar. Bu durumda, başka bir Matrix istemcisinden öz doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

`verify self`, başarıyla çıkmadan önce `Cross-signing verified: yes` için bekler. Beklemeyi ayarlamak için `--timeout-ms <ms>` kullanın.

Değişmez anahtar biçimi `openclaw matrix verify device "<recovery-key>"` de kabul edilir, ancak anahtar kabuk geçmişinize düşer.

### Çapraz imzalamayı başlat veya onar

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap`, şifreli hesaplar için onarım ve kurulum komutudur. Sırayla şunları yapar:

- mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanarak gizli depolamayı başlatır
- çapraz imzalamayı başlatır ve eksik genel anahtarları yükler
- mevcut cihazı işaretler ve çapraz imzalar
- henüz yoksa sunucu taraflı bir oda anahtarı yedeği oluşturur

Homeserver, çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa, OpenClaw önce kimlik doğrulamasız, sonra `m.login.dummy`, sonra `m.login.password` dener (`channels.matrix.password` gerektirir).

Kullanışlı bayraklar:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` ile eşleştirin) veya `--recovery-key <key>`
- mevcut çapraz imzalama kimliğini atmak için `--force-reset-cross-signing` (yalnızca bilinçli olarak)

### Oda anahtarı yedeği

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`, sunucu taraflı bir yedeğin var olup olmadığını ve bu cihazın onu çözüp çözemediğini gösterir. `backup restore`, yedeklenmiş oda anahtarlarını yerel kripto deposuna içe aktarır; kurtarma anahtarı zaten diskteyse `--recovery-key-stdin` değerini atlayabilirsiniz.

Bozuk bir yedeği yeni bir başlangıçla değiştirmek için (kurtarılamayan eski geçmişin kaybını kabul eder; mevcut yedek gizli anahtarı yüklenemiyorsa gizli depolamayı da yeniden oluşturabilir):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` değerini yalnızca önceki kurtarma anahtarının yeni yedek başlangıcını açmayı durdurmasını bilinçli olarak istediğinizde ekleyin.

### Doğrulamaları listeleme, isteme ve yanıtlama

```bash
openclaw matrix verify list
```

Seçili hesap için bekleyen doğrulama isteklerini listeler.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Bu OpenClaw hesabından bir doğrulama isteği gönderir. `--own-user` öz doğrulama ister (istemciyi aynı kullanıcının başka bir Matrix istemcisinde kabul edersiniz); `--user-id`/`--device-id`/`--room-id` başka birini hedefler. `--own-user`, diğer hedefleme bayraklarıyla birleştirilemez.

Daha düşük düzeyli yaşam döngüsü işleme için - genellikle başka bir istemciden gelen istekleri gölgelerken - bu komutlar belirli bir `<id>` isteği üzerinde çalışır (`verify list` ve `verify request` tarafından yazdırılır):

| Komut                                      | Amaç                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Gelen bir isteği kabul et                                           |
| `openclaw matrix verify start <id>`        | SAS akışını başlat                                                  |
| `openclaw matrix verify sas <id>`          | SAS emoji'lerini veya ondalık değerleri yazdır                      |
| `openclaw matrix verify confirm-sas <id>`  | SAS'nin diğer istemcinin gösterdiğiyle eşleştiğini onayla           |
| `openclaw matrix verify mismatch-sas <id>` | Emoji'ler veya ondalık değerler eşleşmediğinde SAS'yi reddet        |
| `openclaw matrix verify cancel <id>`       | İptal et; isteğe bağlı `--reason <text>` ve `--code <matrix-code>` alır |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` ve `cancel`, doğrulama belirli bir doğrudan mesaj odasına bağlı olduğunda DM takip ipuçları olarak `--user-id` ve `--room-id` kabul eder.

### Çok hesaplı notlar

`--account <id>` olmadan, Matrix CLI komutları örtük varsayılan hesabı kullanır. Birden çok adlandırılmış hesabınız varsa ve `channels.matrix.defaultAccount` ayarlamadıysanız, tahmin yürütmeyi reddeder ve seçim yapmanızı ister. E2EE adlandırılmış bir hesap için devre dışı veya kullanılamaz olduğunda, hatalar ilgili hesabın yapılandırma anahtarını gösterir; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz, başka bir Matrix istemcisinde öz doğrulama ister; yinelenenleri atlar ve bir bekleme süresi uygular (varsayılan olarak 24 saat). `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca mevcut gizli depolamayı ve çapraz imzalama kimliğini yeniden kullanan korumacı bir kripto başlatma geçişi çalıştırır. Başlatma durumu bozuksa, OpenClaw `channels.matrix.password` olmadan bile korumalı bir onarım dener; homeserver parola UIA gerektiriyorsa başlangıç bir uyarı günlüğe yazar ve ölümcül olmayan şekilde devam eder. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix geçişi](/tr/channels/matrix-migration) bölümüne bakın.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix, doğrulama yaşam döngüsü bildirimlerini katı DM doğrulama odasına `m.notice` mesajları olarak gönderir: istek, hazır ("Verify by emoji" kılavuzuyla), başlangıç/tamamlanma ve mevcut olduğunda SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik kabul edilir. Öz doğrulama için OpenClaw, SAS akışını otomatik olarak başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar - yine de Matrix istemcinizde karşılaştırıp "They match" seçeneğini onaylamanız gerekir.

    Doğrulama sistem bildirimleri ajan sohbet hattına iletilmez.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    `verify status`, mevcut cihazın artık homeserver üzerinde listelenmediğini söylüyorsa yeni bir OpenClaw Matrix cihazı oluşturun. Parolayla oturum açma için:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Jeton kimlik doğrulaması için Matrix istemcinizde veya yönetici arayüzünüzde yeni bir erişim jetonu oluşturun, ardından OpenClaw'ı güncelleyin:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` yerine başarısız komuttaki hesap kimliğini yazın veya varsayılan hesap için `--account` değerini atlayın.

  </Accordion>

  <Accordion title="Device hygiene">
    Eski OpenClaw tarafından yönetilen cihazlar birikebilir. Listeleyin ve budayın:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE, IndexedDB shim'i olarak `fake-indexeddb` ile resmi `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` dosyasına kalıcılaştırılır (kısıtlayıcı dosya izinleri).

    Şifreli çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında yaşar ve eşitleme deposunu, kripto deposunu, kurtarma anahtarını, IDB anlık görüntüsünü, iş parçacığı bağlamalarını ve başlangıç doğrulama durumunu içerir. Jeton değiştiğinde ancak hesap kimliği aynı kaldığında, OpenClaw en iyi mevcut kökü yeniden kullanır; böylece önceki durum görünür kalır.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçili hesap için Matrix öz profilini güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Her iki seçeneği tek çağrıda geçebilirsiniz. Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder; `http://` veya `https://` geçtiğinizde OpenClaw önce dosyayı yükler ve çözümlenen `mxc://` URL'sini `channels.matrix.avatarUrl` içine (veya hesap başına geçersiz kılmaya) kaydeder.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de mesaj aracı gönderimleri için yerel Matrix iş parçacıklarını destekler. Davranışı iki bağımsız düğme denetler:

### Oturum yönlendirme (`sessionScope`)

`dm.sessionScope`, Matrix DM odalarının OpenClaw oturumlarıyla nasıl eşleşeceğine karar verir:

- `"per-user"` (varsayılan): aynı yönlendirilen eşe sahip tüm DM odaları tek bir oturumu paylaşır.
- `"per-room"`: eş aynı olsa bile her Matrix DM odası kendi oturum anahtarını alır.

Açık konuşma bağlamaları her zaman `sessionScope` üzerinde önceliklidir; bu nedenle bağlı odalar ve iş parçacıkları seçilmiş hedef oturumlarını korur.

### Yanıt iş parçacığı oluşturma (`threadReplies`)

`threadReplies`, botun yanıtını nereye göndereceğine karar verir:

- `"off"`: yanıtlar üst düzeydedir. Gelen iş parçacıklı mesajlar üst oturumda kalır.
- `"inbound"`: yalnızca gelen mesaj zaten o iş parçacığındaysa bir iş parçacığı içinde yanıt ver.
- `"always"`: tetikleyen mesajı kök alan bir iş parçacığı içinde yanıt ver; bu konuşma ilk tetikleyiciden itibaren eşleşen iş parçacığı kapsamlı bir oturum üzerinden yönlendirilir.

`dm.threadReplies` bunu yalnızca DM'ler için geçersiz kılar - örneğin, oda iş parçacıklarını yalıtılmış tutarken DM'leri düz tutun.

### İş parçacığı kalıtımı ve eğik çizgi komutları

- Gelen iş parçacıklı iletiler, iş parçacığı kök iletisini ek aracı bağlamı olarak içerir.
- İleti aracı gönderimleri, açık bir `threadId` sağlanmadığı sürece aynı odayı (veya aynı DM kullanıcı hedefini) hedeflerken geçerli Matrix iş parçacığını otomatik olarak devralır.
- DM kullanıcı hedefinin yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi halde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn` tümü Matrix odalarında ve DM'lerde çalışır.
- Üst düzey `/focus`, `threadBindings.spawnSessions` etkinleştirildiğinde yeni bir Matrix iş parçacığı oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığının içinde `/focus` veya `/acp spawn --thread here` çalıştırmak, o iş parçacığını yerinde bağlar.

OpenClaw, aynı paylaşılan oturumdaki başka bir DM odasıyla çakışan bir Matrix DM odası algıladığında, o odada `/focus` kaçış yolunu işaret eden ve `dm.sessionScope` değişikliği öneren tek seferlik bir `m.notice` gönderir. Bildirim yalnızca iş parçacığı bağlamaları etkinleştirildiğinde görünür.

## ACP konuşma bağlamaları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyini değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında, geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki iletiler oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığının içinde `--bind here`, geçerli iş parçacığını yerinde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Notlar:

- `--bind here` alt bir Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnSessions`, OpenClaw'ın bir alt Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` akışını denetler.

### İş parçacığı bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` üzerinden devralır ve kanal başına geçersiz kılmaları da destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix iş parçacığına bağlı oturum oluşturma varsayılan olarak açıktır:

- Üst düzey `/focus` ve `/acp spawn --thread auto|here` komutlarının Matrix iş parçacıkları oluşturmasını/bağlamasını engellemek için `threadBindings.spawnSessions: false` ayarlayın.
- Yerel alt aracı iş parçacığı oluşturmalarının üst dökümü çatallamaması gerektiğinde `threadBindings.defaultSpawnContext: "isolated"` ayarlayın.

## Tepkiler

Matrix, giden tepkileri, gelen tepki bildirimlerini ve onay tepkilerini destekler.

Giden tepki araçları `channels.matrix.actions.reactions` tarafından denetlenir:

- `react`, bir Matrix olayına tepki ekler.
- `reactions`, bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, botun o olaydaki kendi tepkilerini kaldırır.
- `remove: true`, bottan yalnızca belirtilen emoji tepkisini kaldırır.

**Çözümleme sırası** (ilk tanımlı değer kazanır):

| Ayar                    | Sıra                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | hesap başına → kanal → `messages.ackReaction` → aracı kimliği emoji yedeği       |
| `ackReactionScope`      | hesap başına → kanal → `messages.ackReactionScope` → varsayılan `"group-mentions"` |
| `reactionNotifications` | hesap başına → kanal → varsayılan `"own"`                                        |

`reactionNotifications: "own"`, bot tarafından yazılmış Matrix iletilerini hedeflediklerinde eklenen `m.reaction` olaylarını iletir; `"off"` tepki sistem olaylarını devre dışı bırakır. Tepki kaldırmaları sistem olaylarına sentezlenmez, çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak sunar.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda iletisi aracıyı tetiklediğinde `InboundHistory` olarak kaç son oda iletisinin dahil edileceğini denetler. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmamışsa etkili varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca odaya özeldir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen iletilerden oluşur: OpenClaw henüz yanıt tetiklememiş oda iletilerini arabelleğe alır, ardından bir bahsetme veya başka tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici ileti `InboundHistory` içine dahil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda iletilerine doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi tutulur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı izin listesi denetimlerinin izin verdiği gönderenlere göre filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de açıkça alıntılanmış tek bir yanıtı tutar.

Bu ayar, gelen iletinin kendisinin yanıt tetikleyip tetikleyemeyeceğini değil, ek bağlam görünürlüğünü etkiler.
Tetikleme yetkilendirmesi yine `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilke ayarlarından gelir.

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

Bahsetme geçitlemesi ve izin listesi davranışı için [Gruplar](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size ileti göndermeye devam ederse, OpenClaw aynı bekleyen eşleme kodunu yeniden kullanır ve yeni bir kod basmak yerine kısa bir bekleme süresinden sonra anımsatma yanıtı gönderebilir.

Paylaşılan DM eşleme akışı ve depolama düzeni için [Eşleme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan ileti durumu eşitlemeden çıkarsa, OpenClaw canlı DM yerine eski tek kişilik odaları işaret eden bayat `m.direct` eşlemeleriyle kalabilir. Bir eş için geçerli eşlemeyi inceleyin:

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
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Eski odaları otomatik olarak silmez. Sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece gelecekteki Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan ileti akışları doğru odayı hedefler.

## Exec onayları

Matrix yerel bir onay istemcisi olarak davranabilir. `channels.matrix.execApprovals` altında (veya hesap başına geçersiz kılma için `channels.matrix.accounts.<account>.execApprovals` altında) yapılandırın:

- `enabled`: onayları Matrix'e özgü istemler üzerinden iletir. Ayarlanmadığında veya `"auto"` olduğunda, en az bir onaylayan çözümlenebildiğinde Matrix otomatik olarak etkinleşir. Açıkça devre dışı bırakmak için `false` ayarlayın.
- `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (`@owner:example.org`). İsteğe bağlıdır; `channels.matrix.dm.allowFrom` değerine geri döner.
- `target`: istemlerin nereye gideceği. `"dm"` (varsayılan) onaylayan DM'lerine gönderir; `"channel"` kaynak Matrix odasına veya DM'ye gönderir; `"both"` ikisine de gönderir.
- `agentFilter` / `sessionFilter`: hangi aracıların/oturumların Matrix teslimini tetikleyeceği için isteğe bağlı izin listeleri.

Yetkilendirme, onay türleri arasında biraz farklıdır:

- **Exec onayları** `execApprovals.approvers` kullanır ve `dm.allowFrom` değerine geri döner.
- **Plugin onayları** yalnızca `dm.allowFrom` üzerinden yetkilendirilir.

Her iki tür de Matrix tepki kısayollarını ve ileti güncellemelerini paylaşır. Onaylayanlar birincil onay iletisinde tepki kısayollarını görür:

- `✅` bir kez izin ver
- `❌` reddet
- `♾️` her zaman izin ver (etkili exec ilkesi buna izin verdiğinde)

Yedek slash komutları: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Yalnızca çözümlenen onaylayanlar onaylayabilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; `channel` veya `both` değerini yalnızca güvenilir odalarda etkinleştirin.

İlgili: [Exec onayları](/tr/tools/exec-approvals).

## Slash komutları

Slash komutları (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` vb.) doğrudan DM'lerde çalışır. Odalarda OpenClaw, botun kendi Matrix bahsetmesiyle ön eklenmiş komutları da tanır; bu nedenle `@bot:server /new`, özel bir bahsetme regex'i olmadan komut yolunu tetikler. Bu, kullanıcı komutu yazmadan önce botu sekmeyle tamamladığında Element ve benzeri istemcilerin yaydığı oda tarzı `@mention /command` gönderilerine botun yanıt verebilmesini sağlar.

Yetkilendirme kuralları yine geçerlidir: komut gönderenler, düz iletilerle aynı DM veya oda izin listesi/sahip ilkelerini karşılamalıdır.

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

**Devralma:**

- Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadığı sürece adlandırılmış hesaplar için varsayılan görevi görür.
- Devralınan bir oda girdisini `groups.<room>.account` ile belirli bir hesaba kapsamlayın. `account` olmayan girdiler hesaplar arasında paylaşılır; varsayılan hesap üst düzeyde yapılandırıldığında `account: "default"` yine çalışır.

**Varsayılan hesap seçimi:**

- Örtük yönlendirme, yoklama ve CLI komutlarının tercih edeceği adlandırılmış hesabı seçmek için `defaultAccount` ayarlayın.
- Birden fazla hesabınız varsa ve biri gerçekten `default` olarak adlandırılmışsa, OpenClaw `defaultAccount` ayarlanmamış olsa bile bunu örtük olarak kullanır.
- Birden fazla adlandırılmış hesabınız varsa ve varsayılan seçilmemişse, CLI komutları tahminde bulunmayı reddeder; `defaultAccount` ayarlayın veya `--account <id>` geçirin.
- Üst düzey `channels.matrix.*` bloğu yalnızca kimlik doğrulaması tamamlandığında (`homeserver` + `accessToken` veya `homeserver` + `userId` + `password`) örtük `default` hesabı olarak ele alınır. Adlandırılmış hesaplar, önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı karşıladığında `homeserver` + `userId` üzerinden keşfedilebilir kalır.

**Yükseltme:**

- OpenClaw onarım veya kurulum sırasında tek hesaplı bir yapılandırmayı çok hesaplı hale yükselttiğinde, varsa mevcut adlandırılmış hesabı veya `defaultAccount` zaten bir hesabı işaret ediyorsa onu korur. Yalnızca Matrix kimlik doğrulama/başlatma anahtarları yükseltilen hesaba taşınır; paylaşılan teslim ilkesi anahtarları üst düzeyde kalır.

Paylaşılan çok hesaplı desen için [Yapılandırma başvurusu](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'lar

Varsayılan olarak OpenClaw, siz hesap başına açıkça katılmadığınız sürece SSRF koruması için özel/dahili Matrix homeserver'larını engeller.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir hostname üzerinde çalışıyorsa, o Matrix hesabı için
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

Bu isteğe bağlı seçenek yalnızca güvenilen özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi herkese açık düz metin homeserver'lar engellenmeye devam eder. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden geçirme

Matrix dağıtımınız açık bir giden HTTP(S) proxy'si gerektiriyorsa `channels.matrix.proxy` değerini ayarlayın:

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

Matrix oda ID'leri büyük/küçük harfe duyarlıdır. Açık teslim hedeflerini, cron görevlerini, bağlamaları veya izin listelerini yapılandırırken Matrix'teki tam oda ID'si büyük/küçük harf kullanımını kullanın. OpenClaw, depolama için dahili oturum anahtarlarını kanonik tutar; bu nedenle bu küçük harfli anahtarlar Matrix teslim ID'leri için güvenilir bir kaynak değildir.

Canlı dizin araması oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, ilgili homeserver üzerindeki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda ID'lerini ve takma adları doğrudan kabul eder. Katılınmış oda adı araması en iyi çabayla yapılır ve yalnızca `dangerouslyAllowNameMatching: true` ayarlandığında çalışma zamanı oda izin listelerine uygulanır.
- Bir oda adı bir ID'ye veya takma ada çözümlenemezse çalışma zamanı izin listesi çözümlemesinde yok sayılır.

## Yapılandırma başvurusu

İzin listesi tarzı kullanıcı alanları (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) tam Matrix kullanıcı ID'lerini kabul eder (en güvenlisi). ID olmayan kullanıcı girdileri varsayılan olarak yok sayılır. `dangerouslyAllowNameMatching: true` ayarlarsanız, tam Matrix dizini görünen ad eşleşmeleri başlangıçta ve izleme çalışırken izin listesi her değiştiğinde çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır.

Oda izin listesi anahtarları (`groups`, eski `rooms`) oda ID'leri veya takma adlar olmalıdır. Düz oda adı anahtarları varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true`, katılınmış oda adlarına karşı en iyi çabayla aramayı geri getirir.

### Hesap ve bağlantı

- `enabled`: kanalı etkinleştirin veya devre dışı bırakın.
- `name`: hesap için isteğe bağlı görüntü etiketi.
- `defaultAccount`: birden çok Matrix hesabı yapılandırıldığında tercih edilen hesap ID'si.
- `accounts`: adlandırılmış hesap başına geçersiz kılmalar. Üst düzey `channels.matrix` değerleri varsayılan olarak devralınır.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu hesabın `localhost`, LAN/Tailscale IP'leri veya dahili ana makine adlarına bağlanmasına izin verin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Hesap başına geçersiz kılma desteklenir.
- `userId`: tam Matrix kullanıcı ID'si (`@bot:example.org`).
- `accessToken`: token tabanlı kimlik doğrulama için erişim token'ı. Düz metin ve SecretRef değerleri env/file/exec sağlayıcıları genelinde desteklenir ([Sır Yönetimi](/tr/gateway/secrets)).
- `password`: parola tabanlı oturum açma için parola. Düz metin ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz ID'si.
- `deviceName`: parola ile oturum açma sırasında kullanılan cihaz görünen adı.
- `avatarUrl`: profil eşitleme ve `profile set` güncellemeleri için saklanan kendi avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında getirilen en fazla olay sayısı.

### Şifreleme

- `encryption`: E2EE'yi etkinleştirin. Varsayılan: `false`.
- `startupVerification`: `"if-unverified"` (E2EE açıkken varsayılan) veya `"off"`. Bu cihaz doğrulanmamışsa başlangıçta kendi kendine doğrulamayı otomatik olarak ister.
- `startupVerificationCooldownHours`: bir sonraki otomatik başlangıç isteğinden önceki bekleme süresi. Varsayılan: `24`.

### Erişim ve ilke

- `groupPolicy`: `"open"`, `"allowlist"` veya `"disabled"`. Varsayılan: `"allowlist"`.
- `groupAllowFrom`: oda trafiği için kullanıcı ID'leri izin listesi.
- `dm.enabled`: `false` olduğunda tüm DM'leri yok sayar. Varsayılan: `true`.
- `dm.policy`: `"pairing"` (varsayılan), `"allowlist"`, `"open"` veya `"disabled"`. Bot odaya katılıp odayı DM olarak sınıflandırdıktan sonra uygulanır; davet işlemeyi etkilemez.
- `dm.allowFrom`: DM trafiği için kullanıcı ID'leri izin listesi.
- `dm.sessionScope`: `"per-user"` (varsayılan) veya `"per-room"`.
- `dm.threadReplies`: yanıt iş parçacığı için yalnızca DM geçersiz kılması (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: yapılandırılmış diğer Matrix bot hesaplarından gelen mesajları kabul edin (`true` veya `"mentions"`).
- `allowlistOnly`: `true` olduğunda, tüm etkin DM ilkelerini (`"disabled"` hariç) ve `"open"` grup ilkelerini `"allowlist"` değerine zorlar. `"disabled"` ilkelerini değiştirmez.
- `dangerouslyAllowNameMatching`: `true` olduğunda, kullanıcı izin listesi girdileri için Matrix görünen ad dizini aramasına ve oda izin listesi anahtarları için katılınmış oda adı aramasına izin verir. Tam `@user:server` ID'lerini ve oda ID'lerini veya takma adları tercih edin.
- `autoJoin`: `"always"`, `"allowlist"` veya `"off"`. Varsayılan: `"off"`. DM tarzı davetler dahil her Matrix davetine uygulanır.
- `autoJoinAllowlist`: `autoJoin` `"allowlist"` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri, davet edilen odanın iddia ettiği duruma göre değil homeserver'a göre çözümlenir.
- `contextVisibility`: ek bağlam görünürlüğü (`"all"` varsayılan, `"allowlist"`, `"allowlist_quote"`).

### Yanıt davranışı

- `replyToMode`: `"off"`, `"first"`, `"all"` veya `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` veya `"always"`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirme ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `streaming`: `"off"` (varsayılan), `"partial"`, `"quiet"` veya nesne biçimi `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: `true` olduğunda, tamamlanan asistan blokları ayrı ilerleme mesajları olarak tutulur.
- `markdown`: giden metin için isteğe bağlı Markdown işleme yapılandırması.
- `responsePrefix`: giden yanıtlara eklenen isteğe bağlı dize.
- `textChunkLimit`: `chunkMode: "length"` olduğunda karakter cinsinden giden parça boyutu. Varsayılan: `4000`.
- `chunkMode`: `"length"` (varsayılan, karakter sayısına göre böler) veya `"newline"` (satır sınırlarında böler).
- `historyLimit`: bir oda mesajı ajanı tetiklediğinde `InboundHistory` olarak dahil edilen son oda mesajlarının sayısı. `messages.groupChat.historyLimit` değerine geri döner; etkin varsayılan `0` (devre dışı).
- `mediaMaxMb`: giden gönderimler ve gelen işleme için MB cinsinden medya boyutu sınırı.

### Tepki ayarları

- `ackReaction`: bu kanal/hesap için onay tepkisi geçersiz kılması.
- `ackReactionScope`: kapsam geçersiz kılması (`"group-mentions"` varsayılan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: gelen tepki bildirimi modu (`"own"` varsayılan, `"off"`).

### Araçlar ve oda başına geçersiz kılmalar

- `actions`: eylem başına araç geçitleme (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: oda başına ilke haritası. Oturum kimliği, çözümlemeden sonra kararlı oda ID'sini kullanır. (`rooms` eski bir takma addır.)
  - `groups.<room>.account`: devralınan bir oda girdisini belirli bir hesapla sınırlandırın.
  - `groups.<room>.allowBots`: kanal düzeyindeki ayarın oda başına geçersiz kılınması (`true` veya `"mentions"`).
  - `groups.<room>.users`: oda başına gönderici izin listesi.
  - `groups.<room>.tools`: oda başına araç izin/verme geçersiz kılmaları.
  - `groups.<room>.autoReply`: oda başına bahsetme geçitleme geçersiz kılması. `true`, o oda için bahsetme gereksinimlerini devre dışı bırakır; `false` bunları yeniden zorunlu kılar.
  - `groups.<room>.skills`: oda başına Skills filtresi.
  - `groups.<room>.systemPrompt`: oda başına sistem istemi parçacığı.

### Exec onay ayarları

- `execApprovals.enabled`: exec onaylarını Matrix'e özgü istemler üzerinden iletin.
- `execApprovals.approvers`: onaylamasına izin verilen Matrix kullanıcı ID'leri. `dm.allowFrom` değerine geri döner.
- `execApprovals.target`: `"dm"` (varsayılan), `"channel"` veya `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: teslim için isteğe bağlı ajan/oturum izin listeleri.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme geçitleme
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
