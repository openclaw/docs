---
read_when:
    - OpenClaw'da Matrix kurulumu
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matris
x-i18n:
    generated_at: "2026-04-30T09:07:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, OpenClaw için paketle birlikte gelen bir kanal Plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, ileti dizilerini, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Paketle birlikte gelen Plugin

Geçerli paketlenmiş OpenClaw sürümleri Matrix Plugin'ini kutudan çıkar çıkmaz sunar. Herhangi bir şey yüklemeniz gerekmez; `channels.matrix.*` yapılandırması (bkz. [Kurulum](#setup)) onu etkinleştirir.

Matrix'i hariç tutan eski derlemeler veya özel kurulumlar için, yayımlandığında güncel bir npm
paketi yükleyin:

```bash
openclaw plugins install @openclaw/matrix
```

npm, OpenClaw'a ait paketi kullanımdan kaldırılmış olarak bildirirse, daha yeni bir npm paketi yayımlanana kadar güncel paketlenmiş
OpenClaw derlemesi veya yerel bir checkout kullanın.

Yerel bir checkout'tan:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`, Plugin'i kaydeder ve etkinleştirir; bu nedenle ayrı bir `openclaw plugins enable matrix` adımı gerekmez. Aşağıdaki kanalı yapılandırana kadar Plugin yine de hiçbir şey yapmaz. Genel Plugin davranışı ve yükleme kuralları için bkz. [Plugins](/tr/tools/plugin).

## Kurulum

1. Homeserver'ınızda bir Matrix hesabı oluşturun.
2. `channels.matrix` yapılandırmasını `homeserver` + `accessToken` ya da `homeserver` + `userId` + `password` ile yapın.
3. Gateway'i yeniden başlatın.
4. Bot ile bir DM başlatın veya onu bir odaya davet edin (bkz. [otomatik katılma](#auto-join) — yeni davetler yalnızca `autoJoin` izin verdiğinde ulaşır).

### Etkileşimli kurulum

```bash
openclaw channels add
openclaw configure --section channels
```

Sihirbaz şunları sorar: homeserver URL'si, kimlik doğrulama yöntemi (erişim token'ı veya parola), kullanıcı ID'si (yalnızca parola kimlik doğrulaması), isteğe bağlı cihaz adı, E2EE'nin etkinleştirilip etkinleştirilmeyeceği ve oda erişimi ile otomatik katılmanın yapılandırılıp yapılandırılmayacağı.

Eşleşen `MATRIX_*` env var'ları zaten varsa ve seçilen hesabın kaydedilmiş kimlik doğrulaması yoksa, sihirbaz bir env-var kısayolu sunar. Bir izin listesi kaydetmeden önce oda adlarını çözümlemek için `openclaw channels resolve --channel matrix "Project Room"` çalıştırın. E2EE etkinleştirildiğinde sihirbaz yapılandırmayı yazar ve [`openclaw matrix encryption setup`](#encryption-and-verification) ile aynı bootstrap işlemini çalıştırır.

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

`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir. Varsayılan ayarla bot, siz elle katılana kadar yeni davetlerden gelen yeni odalarda veya DM'lerde görünmez.

OpenClaw, davet anında davet edilen odanın DM mi yoksa grup mu olduğunu anlayamaz; bu nedenle DM tarzı davetler dahil tüm davetler önce `autoJoin` üzerinden geçer. `dm.policy` ancak daha sonra, bot katıldıktan ve oda sınıflandırıldıktan sonra uygulanır.

<Warning>
Botun hangi davetleri kabul edeceğini kısıtlamak için `autoJoin: "allowlist"` artı `autoJoinAllowlist`, her daveti kabul etmek için `autoJoin: "always"` ayarlayın.

`autoJoinAllowlist` yalnızca kararlı hedefleri kabul eder: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir; alias girdileri, davet edilen odanın iddia ettiği duruma göre değil, homeserver'a göre çözümlenir.
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

DM ve oda izin listeleri en iyi kararlı ID'lerle doldurulur:

- DM'ler (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` kullanın. Görünen adlar yalnızca homeserver dizini tam olarak bir eşleşme döndürdüğünde çözümlenir.
- Odalar (`groups`, `autoJoinAllowlist`): `!room:server` veya `#alias:server` kullanın. Adlar, katılınmış odalara göre en iyi çabayla çözümlenir; çözümlenmeyen girdiler runtime'da yok sayılır.

### Hesap ID'si normalleştirme

Sihirbaz, kullanıcı dostu bir adı normalleştirilmiş bir hesap ID'sine dönüştürür. Örneğin, `Ops Bot`, `ops-bot` olur. İki hesabın çakışmaması için noktalama işaretleri kapsamlı env-var adlarında kaçışlanır: `-` → `_X2D_`, bu nedenle `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşleşir.

### Önbelleğe alınmış kimlik bilgileri

Matrix, önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` altında saklar:

- varsayılan hesap: `credentials.json`
- adlandırılmış hesaplar: `credentials-<account>.json`

Önbelleğe alınmış kimlik bilgileri orada mevcut olduğunda, erişim token'ı yapılandırma dosyasında olmasa bile OpenClaw Matrix'i yapılandırılmış olarak değerlendirir; bu kurulum, `openclaw doctor` ve kanal durumu yoklamalarını kapsar.

### Ortam değişkenleri

Eşdeğer yapılandırma anahtarı ayarlanmadığında kullanılır. Varsayılan hesap öneksiz adları kullanır; adlandırılmış hesaplar, sonekten önce eklenen hesap ID'sini kullanır.

| Varsayılan hesap      | Adlandırılmış hesap (`<ID>` normalleştirilmiş hesap ID'sidir) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

`ops` hesabı için adlar `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` vb. olur. Kurtarma anahtarı env var'ları, anahtarı `--recovery-key-stdin` aracılığıyla pipe ettiğinizde kurtarma farkındalıklı CLI akışları (`verify backup restore`, `verify device`, `verify bootstrap`) tarafından okunur.

`MATRIX_HOMESERVER`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Yapılandırma örneği

DM eşleştirmesi, oda izin listesi ve E2EE içeren pratik bir temel:

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

Matrix yanıt akışı isteğe bağlıdır. `streaming`, OpenClaw'ın sürmekte olan asistan yanıtını nasıl ileteceğini denetler; `blockStreaming` ise tamamlanan her bloğun kendi Matrix mesajı olarak korunup korunmayacağını denetler.

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

| `streaming`       | Davranış                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (varsayılan) | Tam yanıtı bekler, bir kez gönderir. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | Model geçerli bloğu yazarken bir normal metin mesajını yerinde düzenler. Standart Matrix istemcileri son düzenlemede değil, ilk önizlemede bildirim gösterebilir.              |
| `"quiet"`         | `"partial"` ile aynıdır, ancak mesaj bildirim oluşturmayan bir notice'tır. Alıcılar yalnızca kullanıcı başına bir push kuralı sonuçlandırılmış düzenlemeyle eşleştiğinde bildirim alır (aşağıya bakın). |

`blockStreaming`, `streaming` ayarından bağımsızdır:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (varsayılan)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Geçerli blok için canlı taslak, tamamlanan bloklar mesaj olarak tutulur | Geçerli blok için canlı taslak, yerinde sonuçlandırılır |
| `"off"`                 | Tamamlanan her blok için bir bildirimli Matrix mesajı                     | Tam yanıt için bir bildirimli Matrix mesajı      |

Notlar:

- Bir önizleme Matrix'in olay başına boyut sınırını aşarsa, OpenClaw önizleme akışını durdurur ve yalnızca son teslimata geri döner.
- Medya yanıtları ekleri her zaman normal şekilde gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa, OpenClaw son medya yanıtını göndermeden önce onu redakte eder.
- Matrix önizleme akışı etkin olduğunda araç ilerleme önizleme güncellemeleri varsayılan olarak etkindir. Yanıt metni için önizleme düzenlemelerini koruyup araç ilerlemesini normal teslimat yolunda bırakmak için `streaming.preview.toolProgress: false` ayarlayın.
- Önizleme düzenlemeleri ek Matrix API çağrıları maliyeti doğurur. En muhafazakar hız sınırı profilini istiyorsanız `streaming: "off"` bırakın.

## Onay meta verileri

Matrix yerel onay istemleri, `com.openclaw.approval` altında OpenClaw'a özgü özel olay içeriğine sahip normal `m.room.message` olaylarıdır. Matrix özel olay içeriği anahtarlarına izin verir; bu nedenle standart istemciler metin gövdesini yine de işlerken OpenClaw farkındalıklı istemciler yapılandırılmış onay ID'sini, türünü, durumunu, kullanılabilir kararları ve exec/Plugin ayrıntılarını okuyabilir.

Bir onay istemi tek bir Matrix olayı için çok uzun olduğunda, OpenClaw görünür metni parçalara böler ve `com.openclaw.approval` değerini yalnızca ilk parçaya ekler. İzin ver/reddet kararlarına yönelik tepkiler bu ilk olaya bağlıdır; böylece uzun istemler tek olaylı istemlerle aynı onay hedefini korur.

### Sessiz sonuçlandırılmış önizlemeler için self-hosted push kuralları

`streaming: "quiet"` alıcılara yalnızca bir blok veya turn sonuçlandırıldığında bildirim gönderir; kullanıcı başına bir push kuralının sonuçlandırılmış önizleme işaretçisiyle eşleşmesi gerekir. Tam tarif için (alıcı token'ı, pusher denetimi, kural yükleme, homeserver başına notlar) bkz. [Sessiz önizlemeler için Matrix push kuralları](/tr/channels/matrix-push-rules).

## Botlar arası odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır.

Bilinçli olarak ajanlar arası Matrix trafiği istediğinizde `allowBots` kullanın:

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
- `allowBots: "mentions"`, bu mesajları yalnızca odalarda bu bottan görünür şekilde bahsettiklerinde kabul eder. DM'lere yine de izin verilir.
- `groups.<room>.allowBots`, tek bir oda için hesap düzeyindeki ayarı geçersiz kılar.
- OpenClaw, kendine yanıt döngülerinden kaçınmak için aynı Matrix kullanıcı ID'sinden gelen mesajları yine de yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw "bot-authored" değerini "bu OpenClaw Gateway'inde yapılandırılmış başka bir Matrix hesabı tarafından gönderildi" olarak değerlendirir.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken katı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifreli (E2EE) odalarda, giden görsel olayları `thumbnail_file` kullanır; böylece görsel önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar düz `thumbnail_url` kullanmaya devam eder. Yapılandırma gerekmez — Plugin, E2EE durumunu otomatik olarak algılar.

Tüm `openclaw matrix` komutları `--verbose` (tam tanılama), `--json` (makine tarafından okunabilir çıktı) ve `--account <id>` (çok hesaplı kurulumlar) seçeneklerini kabul eder. Çıktı, varsayılan olarak sessiz dahili SDK günlüklemesiyle özlüdür. Aşağıdaki örnekler kanonik biçimi gösterir; bayrakları gerektiği gibi ekleyin.

### Şifrelemeyi etkinleştir

```bash
openclaw matrix encryption setup
```

Gizli depolamayı ve çapraz imzalamayı başlatır, gerekirse bir oda anahtarı yedeği oluşturur, ardından durumu ve sonraki adımları yazdırır. Yararlı bayraklar:

- `--recovery-key <key>` başlatmadan önce bir kurtarma anahtarı uygula (aşağıda belgelenen stdin biçimini tercih edin)
- `--force-reset-cross-signing` mevcut çapraz imzalama kimliğini at ve yeni bir tane oluştur (yalnızca bilinçli olarak kullanın)

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

`verify status` üç bağımsız güven sinyali bildirir (`--verbose` hepsini gösterir):

- `Locally trusted`: yalnızca bu istemci tarafından güvenilir
- `Cross-signing verified`: SDK, çapraz imzalama ile doğrulama bildirir
- `Signed by owner`: kendi kendini imzalama anahtarınızla imzalanmış (yalnızca tanılama)

`Verified by owner`, yalnızca `Cross-signing verified` `yes` olduğunda `yes` olur. Yerel güven veya tek başına sahip imzası yeterli değildir.

`--allow-degraded-local-state`, önce Matrix hesabını hazırlamadan en iyi çabayla tanılama döndürür; çevrimdışı veya kısmen yapılandırılmış yoklamalar için yararlıdır.

### Bu cihazı kurtarma anahtarıyla doğrula

Kurtarma anahtarı hassastır — komut satırında geçirmek yerine stdin üzerinden aktarın. `MATRIX_RECOVERY_KEY` ayarlayın (veya adlandırılmış bir hesap için `MATRIX_<ID>_RECOVERY_KEY`):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Komut üç durum bildirir:

- `Recovery key accepted`: Matrix, gizli depolama veya cihaz güveni için anahtarı kabul etti.
- `Backup usable`: oda anahtarı yedeği, güvenilir kurtarma materyaliyle yüklenebilir.
- `Device verified by owner`: bu cihaz tam Matrix çapraz imzalama kimliği güvenine sahiptir.

Kurtarma anahtarı yedek materyalini açmış olsa bile, tam kimlik güveni tamamlanmadığında sıfır dışı kodla çıkar. Bu durumda, başka bir Matrix istemcisinden kendi kendini doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

`verify self`, başarıyla çıkmadan önce `Cross-signing verified: yes` bekler. Beklemeyi ayarlamak için `--timeout-ms <ms>` kullanın.

Değişmez anahtar biçimi `openclaw matrix verify device "<recovery-key>"` de kabul edilir, ancak anahtar kabuk geçmişinize yazılır.

### Çapraz imzalamayı başlat veya onar

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap`, şifreli hesaplar için onarım ve kurulum komutudur. Sırasıyla şunları yapar:

- gizli depolamayı başlatır, mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanır
- çapraz imzalamayı başlatır ve eksik açık anahtarları yükler
- mevcut cihazı işaretler ve çapraz imzalar
- zaten yoksa sunucu tarafında bir oda anahtarı yedeği oluşturur

Homeserver çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa, OpenClaw önce kimlik doğrulamasız denemeyi, ardından `m.login.dummy`, ardından `m.login.password` dener (`channels.matrix.password` gerektirir).

Yararlı bayraklar:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` ile eşleştirin) veya `--recovery-key <key>`
- mevcut çapraz imzalama kimliğini atmak için `--force-reset-cross-signing` (yalnızca bilinçli olarak)

### Oda anahtarı yedeği

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`, sunucu tarafı yedeğin var olup olmadığını ve bu cihazın onun şifresini çözüp çözemediğini gösterir. `backup restore`, yedeklenmiş oda anahtarlarını yerel kripto deposuna içe aktarır; kurtarma anahtarı zaten diskteyse `--recovery-key-stdin` atlanabilir.

Bozuk bir yedeği yeni bir temel durumla değiştirmek için (kurtarılamayan eski geçmişi kaybetmeyi kabul eder; mevcut yedek sırrı yüklenemiyorsa gizli depolamayı da yeniden oluşturabilir):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` yalnızca önceki kurtarma anahtarının yeni yedek temelini açmayı bırakmasını bilinçli olarak istediğinizde ekleyin.

### Doğrulamaları listeleme, isteme ve yanıtlama

```bash
openclaw matrix verify list
```

Seçili hesap için bekleyen doğrulama isteklerini listeler.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Bu OpenClaw hesabından bir doğrulama isteği gönderir. `--own-user` kendi kendini doğrulama ister (istemi aynı kullanıcının başka bir Matrix istemcisinde kabul edersiniz); `--user-id`/`--device-id`/`--room-id` başka birini hedefler. `--own-user` diğer hedefleme bayraklarıyla birleştirilemez.

Daha düşük seviyeli yaşam döngüsü işleme için — genellikle başka bir istemciden gelen istekleri izlerken — bu komutlar belirli bir `<id>` isteği üzerinde çalışır (`verify list` ve `verify request` tarafından yazdırılır):

| Komut                                      | Amaç                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Gelen isteği kabul et                                               |
| `openclaw matrix verify start <id>`        | SAS akışını başlat                                                  |
| `openclaw matrix verify sas <id>`          | SAS emojisidir veya ondalıklarını yazdır                            |
| `openclaw matrix verify confirm-sas <id>`  | SAS'ın diğer istemcinin gösterdiğiyle eşleştiğini onayla            |
| `openclaw matrix verify mismatch-sas <id>` | Emoji veya ondalıklar eşleşmediğinde SAS'ı reddet                   |
| `openclaw matrix verify cancel <id>`       | İptal et; isteğe bağlı `--reason <text>` ve `--code <matrix-code>` alır |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` ve `cancel`, doğrulama belirli bir doğrudan mesaj odasına bağlı olduğunda DM takip ipuçları olarak `--user-id` ve `--room-id` kabul eder.

### Çok hesaplı notlar

`--account <id>` olmadan, Matrix CLI komutları örtük varsayılan hesabı kullanır. Birden fazla adlandırılmış hesabınız varsa ve `channels.matrix.defaultAccount` ayarlamadıysanız, tahmin yürütmeyi reddeder ve seçim yapmanızı ister. Adlandırılmış bir hesap için E2EE devre dışı veya kullanılamaz olduğunda, hatalar o hesabın yapılandırma anahtarını gösterir; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz başka bir Matrix istemcisinde kendi kendini doğrulama ister, yinelenenleri atlar ve bir bekleme süresi uygular (varsayılan olarak 24 saat). `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca mevcut gizli depolamayı ve çapraz imzalama kimliğini yeniden kullanan tutucu bir kripto başlatma geçişi çalıştırır. Başlatma durumu bozuksa, OpenClaw `channels.matrix.password` olmadan bile korumalı bir onarım dener; homeserver parola UIA gerektiriyorsa, başlangıç bir uyarı günlüğe yazar ve ölümcül olmayan durumda kalır. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix migration](/tr/channels/matrix-migration) bölümüne bakın.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix, doğrulama yaşam döngüsü bildirimlerini sıkı DM doğrulama odasına `m.notice` mesajları olarak gönderir: istek, hazır ("Verify by emoji" kılavuzuyla), başlatma/tamamlama ve varsa SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik kabul edilir. Kendi kendini doğrulama için OpenClaw SAS akışını otomatik başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar — yine de Matrix istemcinizde karşılaştırıp "They match" seçeneğini onaylamanız gerekir.

    Doğrulama sistem bildirimleri aracı sohbet hattına iletilmez.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    `verify status` mevcut cihazın artık homeserver üzerinde listelenmediğini söylüyorsa, yeni bir OpenClaw Matrix cihazı oluşturun. Parola ile oturum açma için:

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

    `assistant` yerine başarısız komuttaki hesap kimliğini yazın veya varsayılan hesap için `--account` atlayın.

  </Accordion>

  <Accordion title="Device hygiene">
    OpenClaw tarafından yönetilen eski cihazlar birikebilir. Listeleyin ve temizleyin:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE, IndexedDB shim'i olarak `fake-indexeddb` ile resmi `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` dosyasına kalıcı olarak kaydedilir (kısıtlayıcı dosya izinleriyle).

    Şifreli çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında bulunur ve eşitleme deposu, kripto deposu, kurtarma anahtarı, IDB anlık görüntüsü, iş parçacığı bağlamaları ve başlangıç doğrulama durumunu içerir. Token değiştiğinde ancak hesap kimliği aynı kaldığında, OpenClaw önceki durumun görünür kalması için en iyi mevcut kökü yeniden kullanır.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçili hesap için Matrix kendi profilini güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Her iki seçeneği tek çağrıda geçebilirsiniz. Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder; `http://` veya `https://` geçtiğinizde, OpenClaw önce dosyayı yükler ve çözümlenen `mxc://` URL'sini `channels.matrix.avatarUrl` içine (veya hesap başına geçersiz kılmaya) kaydeder.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de mesaj aracı gönderimleri için yerel Matrix iş parçacıklarını destekler. Davranışı iki bağımsız ayar denetler:

### Oturum yönlendirme (`sessionScope`)

`dm.sessionScope`, Matrix DM odalarının OpenClaw oturumlarıyla nasıl eşlendiğini belirler:

- `"per-user"` (varsayılan): aynı yönlendirilen eşe sahip tüm DM odaları bir oturumu paylaşır.
- `"per-room"`: eş aynı olsa bile her Matrix DM odası kendi oturum anahtarını alır.

Açık konuşma bağlamaları her zaman `sessionScope` üzerinde önceliklidir; bu nedenle bağlı odalar ve iş parçacıkları seçtikleri hedef oturumu korur.

### Yanıt iş parçacığı oluşturma (`threadReplies`)

`threadReplies`, botun yanıtını nereye göndereceğini belirler:

- `"off"`: yanıtlar üst düzeydedir. Gelen iş parçacıklı mesajlar üst oturumda kalır.
- `"inbound"`: yalnızca gelen mesaj zaten o iş parçacığındaysa iş parçacığı içinde yanıt ver.
- `"always"`: tetikleyen mesaj köklü bir iş parçacığı içinde yanıt ver; bu konuşma ilk tetikten itibaren eşleşen iş parçacığı kapsamlı bir oturum üzerinden yönlendirilir.

`dm.threadReplies` bunu yalnızca DM'ler için geçersiz kılar — örneğin, DM'leri düz tutarken oda iş parçacıklarını yalıtılmış tutun.

### İş parçacığı kalıtımı ve eğik çizgi komutları

- Gelen iş parçacıklı iletiler, iş parçacığı kök iletisini ek ajan bağlamı olarak içerir.
- İleti aracı gönderimleri, açık bir `threadId` sağlanmadığı sürece, aynı odayı (veya aynı DM kullanıcı hedefini) hedeflerken mevcut Matrix iş parçacığını otomatik olarak devralır.
- DM kullanıcı hedefi yeniden kullanımı yalnızca mevcut oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi takdirde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey `/focus`, `threadBindings.spawnSubagentSessions: true` olduğunda yeni bir Matrix iş parçacığı oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığı içinde `/focus` veya `/acp spawn --thread here` çalıştırmak, bu iş parçacığını yerinde bağlar.

OpenClaw, aynı paylaşılan oturumda başka bir DM odasıyla çakışan bir Matrix DM odası algıladığında, o odada `/focus` kaçış yolunu gösteren ve bir `dm.sessionScope` değişikliği öneren tek seferlik bir `m.notice` gönderir. Bildirim yalnızca iş parçacığı bağları etkin olduğunda görünür.

## ACP konuşma bağları

Matrix odaları, DM'ler ve mevcut Matrix iş parçacıkları, sohbet yüzeyi değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM'si, odası veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM'sinde veya odasında, mevcut DM/oda sohbet yüzeyi olarak kalır ve gelecekteki iletiler oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığı içinde, `--bind here` o geçerli iş parçacığını yerinde bağlar.
- `/new` ve `/reset` aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close` ACP oturumunu kapatır ve bağı kaldırır.

Notlar:

- `--bind here` bir alt Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnAcpSessions` yalnızca OpenClaw'ın bir alt Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` için gereklidir.

### İş parçacığı bağı yapılandırması

Matrix, genel varsayılanları `session.threadBindings` kaynağından devralır ve ayrıca kanal başına geçersiz kılmaları destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix iş parçacığına bağlı oluşturma bayrakları isteğe bağlıdır:

- Üst düzey `/focus` komutunun yeni Matrix iş parçacıkları oluşturmasına ve bağlamasına izin vermek için `threadBindings.spawnSubagentSessions: true` ayarlayın.
- `/acp spawn --thread auto|here` komutunun ACP oturumlarını Matrix iş parçacıklarına bağlamasına izin vermek için `threadBindings.spawnAcpSessions: true` ayarlayın.

## Reaksiyonlar

Matrix giden reaksiyonları, gelen reaksiyon bildirimlerini ve onay reaksiyonlarını destekler.

Giden reaksiyon araçları `channels.matrix.actions.reactions` tarafından denetlenir:

- `react`, bir Matrix olayına reaksiyon ekler.
- `reactions`, bir Matrix olayı için geçerli reaksiyon özetini listeler.
- `emoji=""`, botun o olaydaki kendi reaksiyonlarını kaldırır.
- `remove: true`, yalnızca belirtilen emoji reaksiyonunu bottan kaldırır.

**Çözüm sırası** (ilk tanımlı değer kazanır):

| Ayar                    | Sıra                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | hesap başına → kanal → `messages.ackReaction` → ajan kimliği emoji yedeği        |
| `ackReactionScope`      | hesap başına → kanal → `messages.ackReactionScope` → varsayılan `"group-mentions"` |
| `reactionNotifications` | hesap başına → kanal → varsayılan `"own"`                                        |

`reactionNotifications: "own"`, bot tarafından yazılmış Matrix iletilerini hedeflediklerinde eklenen `m.reaction` olaylarını iletir; `"off"` reaksiyon sistemi olaylarını devre dışı bırakır. Reaksiyon kaldırmaları sistem olaylarına dönüştürülmez çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak sunar.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda iletisi ajanı tetiklediğinde kaç son oda iletisinin `InboundHistory` olarak dahil edileceğini denetler. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmamışsa etkili varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca odaya aittir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen öğelerdir: OpenClaw henüz bir yanıt tetiklememiş oda iletilerini arabelleğe alır, ardından bir bahsetme veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici ileti `InboundHistory` içine dahil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda iletilerine doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, alınan yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi korunur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı izin listesi denetimlerinin izin verdiği göndericilere göre filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de açıkça alıntılanmış bir yanıtı korur.

Bu ayar, ek bağlam görünürlüğünü etkiler; gelen iletinin kendisinin bir yanıt tetikleyip tetikleyemeyeceğini etkilemez.
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

Odaları çalışır halde tutarken DM'leri tamamen susturmak için `dm.enabled: false` ayarlayın:

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

Bahsetme geçidi ve izin listesi davranışı için [Gruplar](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce size ileti göndermeye devam ederse, OpenClaw yeni bir kod üretmek yerine aynı bekleyen eşleştirme kodunu yeniden kullanır ve kısa bir bekleme süresinden sonra bir hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Eşleştirme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan ileti durumu senkronizasyondan çıkarsa, OpenClaw canlı DM yerine eski tek kişilik odalara işaret eden bayat `m.direct` eşlemeleriyle kalabilir. Bir eş için geçerli eşlemeyi inceleyin:

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
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` öğesini yeniden yazar

Eski odaları otomatik olarak silmez. Sağlıklı DM'yi seçer ve gelecekteki Matrix gönderimlerinin, doğrulama bildirimlerinin ve diğer doğrudan ileti akışlarının doğru odayı hedeflemesi için eşlemeyi günceller.

## Exec onayları

Matrix yerel bir onay istemcisi olarak davranabilir. `channels.matrix.execApprovals` altında yapılandırın (veya hesap başına geçersiz kılma için `channels.matrix.accounts.<account>.execApprovals`):

- `enabled`: onayları Matrix yerel istemleri üzerinden iletir. Ayarlanmamışsa veya `"auto"` ise Matrix, en az bir onaylayıcı çözümlenebildiğinde otomatik olarak etkinleşir. Açıkça devre dışı bırakmak için `false` ayarlayın.
- `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (`@owner:example.org`). İsteğe bağlıdır; `channels.matrix.dm.allowFrom` değerine geri döner.
- `target`: istemlerin nereye gideceği. `"dm"` (varsayılan) onaylayıcı DM'lerine gönderir; `"channel"` kaynak Matrix odasına veya DM'ye gönderir; `"both"` ikisine de gönderir.
- `agentFilter` / `sessionFilter`: hangi ajanların/oturumların Matrix teslimini tetikleyeceği için isteğe bağlı izin listeleri.

Yetkilendirme, onay türleri arasında biraz farklıdır:

- **Exec onayları** `execApprovals.approvers` kullanır ve `dm.allowFrom` değerine geri döner.
- **Plugin onayları** yalnızca `dm.allowFrom` üzerinden yetkilendirilir.

Her iki tür de Matrix reaksiyon kısayollarını ve ileti güncellemelerini paylaşır. Onaylayıcılar birincil onay iletisinde reaksiyon kısayollarını görür:

- `✅` bir kez izin ver
- `❌` reddet
- `♾️` her zaman izin ver (etkili exec ilkesi izin verdiğinde)

Yedek slash komutları: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; `channel` veya `both` seçeneklerini yalnızca güvenilir odalarda etkinleştirin.

İlgili: [Exec onayları](/tr/tools/exec-approvals).

## Slash komutları

Slash komutları (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` vb.) doğrudan DM'lerde çalışır. Odalarda OpenClaw, botun kendi Matrix bahsetmesiyle ön eklenmiş komutları da tanır; bu nedenle `@bot:server /new`, özel bir bahsetme regex'i olmadan komut yolunu tetikler. Bu, botu kullanıcı komutu yazmadan önce botu sekme ile tamamladığında Element ve benzeri istemcilerin yaydığı oda tarzı `@mention /command` gönderilerine duyarlı tutar.

Yetkilendirme kuralları hâlâ geçerlidir: komut gönderenler, düz iletilerle aynı DM veya oda izin listesi/sahip ilkelerini karşılamalıdır.

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

- Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadığı sürece adlandırılmış hesaplar için varsayılan görevi görür.
- Devralınmış bir oda girdisini belirli bir hesaba `groups.<room>.account` ile kapsamlayın. `account` olmayan girdiler hesaplar arasında paylaşılır; varsayılan hesap üst düzeyde yapılandırıldığında `account: "default"` hâlâ çalışır.

**Varsayılan hesap seçimi:**

- Örtük yönlendirmenin, yoklamanın ve CLI komutlarının tercih edeceği adlandırılmış hesabı seçmek için `defaultAccount` ayarlayın.
- Birden çok hesabınız varsa ve biri kelimenin tam anlamıyla `default` olarak adlandırılmışsa, `defaultAccount` ayarlanmamış olsa bile OpenClaw bunu örtük olarak kullanır.
- Birden çok adlandırılmış hesabınız varsa ve varsayılan seçilmemişse, CLI komutları tahmin etmeyi reddeder; `defaultAccount` ayarlayın veya `--account <id>` geçirin.
- Üst düzey `channels.matrix.*` bloğu yalnızca kimlik doğrulaması tamamlandığında (`homeserver` + `accessToken` veya `homeserver` + `userId` + `password`) örtük `default` hesabı olarak ele alınır. Önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı kapsadığında adlandırılmış hesaplar `homeserver` + `userId` üzerinden keşfedilebilir kalır.

**Yükseltme:**

- OpenClaw onarım veya kurulum sırasında tek hesaplı bir yapılandırmayı çok hesaplıya yükselttiğinde, varsa mevcut adlandırılmış hesabı veya `defaultAccount` zaten birini gösteriyorsa onu korur. Yalnızca Matrix kimlik doğrulama/önyükleme anahtarları yükseltilen hesaba taşınır; paylaşılan teslim-ilkesi anahtarları üst düzeyde kalır.

Paylaşılan çoklu hesap deseni için [Yapılandırma başvurusu](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'ları

Varsayılan olarak OpenClaw, hesap başına açıkça katılmadığınız sürece SSRF koruması için özel/dahili Matrix homeserver'larını engeller.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir ana bilgisayar adında çalışıyorsa, ilgili Matrix hesabı için
`network.dangerouslyAllowPrivateNetwork` ayarını etkinleştirin:

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

Bu isteğe bağlı etkinleştirme yalnızca güvenilir özel/dahili hedeflere izin verir. Şunun gibi herkese açık düz metin homeserver'lar
`http://matrix.example.org:8008` engelli kalır. Mümkün olduğunda `https://` tercih edin.

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

Adlandırılmış hesaplar üst düzey varsayılanı `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
OpenClaw, çalışma zamanı Matrix trafiği ve hesap durumu yoklamaları için aynı proxy ayarını kullanır.

## Hedef çözümleme

Matrix, OpenClaw sizden bir oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Matrix oda ID'leri büyük/küçük harfe duyarlıdır. Açık teslim hedefleri, cron işleri, bağlamalar veya izin listeleri yapılandırırken Matrix'teki oda ID'sinin tam harf kullanımını kullanın.
OpenClaw, depolama için dahili oturum anahtarlarını kanonik tutar; bu nedenle bu küçük harfli anahtarlar Matrix teslim ID'leri için güvenilir bir kaynak değildir.

Canlı dizin araması, oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, o homeserver'daki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda ID'lerini ve takma adları doğrudan kabul eder, ardından o hesap için katılınmış oda adlarını aramaya geri döner.
- Katılınmış oda adı araması en iyi çaba esasına dayanır. Bir oda adı bir ID'ye veya takma ada çözümlenemiyorsa, çalışma zamanı izin listesi çözümlemesi tarafından yok sayılır.

## Yapılandırma başvurusu

İzin listesi tarzı alanlar (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) tam Matrix kullanıcı ID'lerini kabul eder (en güvenlisi). Tam dizin eşleşmeleri başlangıçta ve monitör çalışırken izin listesi değiştiğinde çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır. Oda izin listeleri aynı nedenle oda ID'lerini veya takma adları tercih eder.

### Hesap ve bağlantı

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı görüntüleme etiketi.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap ID'si.
- `accounts`: adlandırılmış hesap bazlı geçersiz kılmalar. Üst düzey `channels.matrix` değerleri varsayılan olarak devralınır.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu hesabın `localhost`, LAN/Tailscale IP'leri veya dahili host adlarına bağlanmasına izin verir.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Hesap bazlı geçersiz kılma desteklenir.
- `userId`: tam Matrix kullanıcı ID'si (`@bot:example.org`).
- `accessToken`: token tabanlı kimlik doğrulama için erişim token'ı. Env/file/exec sağlayıcıları genelinde düz metin ve SecretRef değerleri desteklenir ([Gizli Bilgi Yönetimi](/tr/gateway/secrets)).
- `password`: parola tabanlı oturum açma için parola. Düz metin ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz ID'si.
- `deviceName`: parola ile oturum açma sırasında kullanılan cihaz görüntüleme adı.
- `avatarUrl`: profil senkronizasyonu ve `profile set` güncellemeleri için saklanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç senkronizasyonu sırasında getirilen maksimum olay sayısı.

### Şifreleme

- `encryption`: E2EE'yi etkinleştirir. Varsayılan: `false`.
- `startupVerification`: `"if-unverified"` (E2EE açıkken varsayılan) veya `"off"`. Bu cihaz doğrulanmamışsa başlangıçta öz doğrulamayı otomatik olarak ister.
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
- `allowlistOnly`: `true` olduğunda, tüm etkin DM ilkelerini (`"disabled"` hariç) ve `"open"` grup ilkelerini `"allowlist"` olmaya zorlar. `"disabled"` ilkelerini değiştirmez.
- `autoJoin`: `"always"`, `"allowlist"` veya `"off"`. Varsayılan: `"off"`. DM tarzı davetler dahil her Matrix davetine uygulanır.
- `autoJoinAllowlist`: `autoJoin` `"allowlist"` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri, davet edilen odanın iddia ettiği duruma göre değil homeserver'a göre çözümlenir.
- `contextVisibility`: ek bağlam görünürlüğü (`"all"` varsayılan, `"allowlist"`, `"allowlist_quote"`).

### Yanıt davranışı

- `replyToMode`: `"off"`, `"first"`, `"all"` veya `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` veya `"always"`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal bazlı geçersiz kılmalar.
- `streaming`: `"off"` (varsayılan), `"partial"`, `"quiet"` veya nesne biçimi `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: `true` olduğunda, tamamlanmış yardımcı blokları ayrı ilerleme iletileri olarak tutulur.
- `markdown`: giden metin için isteğe bağlı Markdown işleme yapılandırması.
- `responsePrefix`: giden yanıtların başına eklenen isteğe bağlı dize.
- `textChunkLimit`: `chunkMode: "length"` olduğunda karakter cinsinden giden parça boyutu. Varsayılan: `4000`.
- `chunkMode`: `"length"` (varsayılan, karakter sayısına göre böler) veya `"newline"` (satır sınırlarında böler).
- `historyLimit`: bir oda iletisi aracıyı tetiklediğinde `InboundHistory` olarak dahil edilen son oda iletilerinin sayısı. `messages.groupChat.historyLimit` değerine geri döner; etkin varsayılan `0` (devre dışı).
- `mediaMaxMb`: giden gönderimler ve gelen işleme için MB cinsinden medya boyutu üst sınırı.

### Tepki ayarları

- `ackReaction`: bu kanal/hesap için onay tepkisi geçersiz kılması.
- `ackReactionScope`: kapsam geçersiz kılması (`"group-mentions"` varsayılan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: gelen tepki bildirimi modu (`"own"` varsayılan, `"off"`).

### Araçlar ve oda bazlı geçersiz kılmalar

- `actions`: eylem bazlı araç kapılama (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: oda bazlı ilke eşlemi. Oturum kimliği, çözümlemeden sonra kararlı oda ID'sini kullanır. (`rooms` eski bir takma addır.)
  - `groups.<room>.account`: devralınmış bir oda girdisini belirli bir hesapla sınırlar.
  - `groups.<room>.allowBots`: kanal düzeyi ayarın oda bazlı geçersiz kılması (`true` veya `"mentions"`).
  - `groups.<room>.users`: oda bazlı gönderen izin listesi.
  - `groups.<room>.tools`: oda bazlı araç izin verme/reddetme geçersiz kılmaları.
  - `groups.<room>.autoReply`: oda bazlı bahsetme kapılama geçersiz kılması. `true`, o oda için bahsetme gereksinimlerini devre dışı bırakır; `false` bunları yeniden zorunlu kılar.
  - `groups.<room>.skills`: oda bazlı skill filtresi.
  - `groups.<room>.systemPrompt`: oda bazlı sistem prompt parçacığı.

### Exec onay ayarları

- `execApprovals.enabled`: exec onaylarını Matrix'e özgü prompt'lar üzerinden iletir.
- `execApprovals.approvers`: onay vermesine izin verilen Matrix kullanıcı ID'leri. `dm.allowFrom` değerine geri döner.
- `execApprovals.target`: `"dm"` (varsayılan), `"channel"` veya `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: teslim için isteğe bağlı aracı/oturum izin listeleri.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapılama
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
