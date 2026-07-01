---
read_when:
    - OpenClaw’da Matrix’i ayarlama
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulum ve yapılandırma örnekleri
title: Matris
x-i18n:
    generated_at: "2026-07-01T13:16:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, OpenClaw için indirilebilir bir kanal Plugin'idir.
Resmi `matrix-js-sdk` kullanır ve DM'leri, odaları, ileti dizilerini, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Kurulum

Kanalı yapılandırmadan önce Matrix'i ClawHub'dan kurun:

```bash
openclaw plugins install @openclaw/matrix
```

Yalın plugin belirtimleri önce ClawHub'ı, ardından npm yedeğini dener. Kayıt kaynağını zorlamak için `openclaw plugins install clawhub:@openclaw/matrix` veya `openclaw plugins install npm:@openclaw/matrix` kullanın.

Yerel bir checkout'tan:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`, plugin'i kaydeder ve etkinleştirir; bu nedenle ayrı bir `openclaw plugins enable matrix` adımı gerekmez. Aşağıdaki kanalı yapılandırana kadar plugin yine de hiçbir şey yapmaz. Genel plugin davranışı ve kurulum kuralları için [Plugin'ler](/tr/tools/plugin) bölümüne bakın.

## Kurulum

1. Homeserver'ınızda bir Matrix hesabı oluşturun.
2. `channels.matrix` öğesini `homeserver` + `accessToken` ya da `homeserver` + `userId` + `password` ile yapılandırın.
3. Gateway'i yeniden başlatın.
4. Bot ile bir DM başlatın veya onu bir odaya davet edin ([otomatik katılma](#auto-join) bölümüne bakın - yeni davetler yalnızca `autoJoin` izin verdiğinde kabul edilir).

### Etkileşimli kurulum

```bash
openclaw channels add
openclaw configure --section channels
```

Sihirbaz şunları sorar: homeserver URL'si, kimlik doğrulama yöntemi (erişim token'ı veya parola), kullanıcı ID'si (yalnızca parola kimlik doğrulaması), isteğe bağlı cihaz adı, E2EE'nin etkinleştirilip etkinleştirilmeyeceği ve oda erişimi ile otomatik katılmanın yapılandırılıp yapılandırılmayacağı.

Eşleşen `MATRIX_*` ortam değişkenleri zaten varsa ve seçili hesapta kaydedilmiş kimlik doğrulama yoksa, sihirbaz bir ortam değişkeni kısayolu sunar. Bir allowlist kaydetmeden önce oda adlarını çözmek için `openclaw channels resolve --channel matrix "Project Room"` çalıştırın. E2EE etkinleştirildiğinde sihirbaz yapılandırmayı yazar ve [`openclaw matrix encryption setup`](#encryption-and-verification) ile aynı önyüklemeyi çalıştırır.

### En küçük yapılandırma

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

`channels.matrix.autoJoin` varsayılan olarak `off` değerindedir. Varsayılan ayarda, siz elle katılana kadar bot yeni davetlerden gelen yeni odalarda veya DM'lerde görünmez.

OpenClaw, davet anında davet edilen odanın DM mi yoksa grup mu olduğunu anlayamaz; bu nedenle DM tarzı davetler dahil tüm davetler önce `autoJoin` üzerinden geçer. `dm.policy` yalnızca daha sonra, bot katıldıktan ve oda sınıflandırıldıktan sonra uygulanır.

<Warning>
Botun kabul ettiği davetleri sınırlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her daveti kabul etmek için `autoJoin: "always"` kullanın.

`autoJoinAllowlist` yalnızca kararlı hedefleri kabul eder: `!roomId:server`, `#alias:server` veya `*`. Düz oda adları reddedilir; alias girdileri davet edilen odanın iddia ettiği duruma göre değil, homeserver'a göre çözülür.
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

- DM'ler (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` kullanın. Görünen adlar değiştirilebilir oldukları için varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true` değerini yalnızca görünen ad girdileriyle uyumluluğa açıkça ihtiyaç duyduğunuzda ayarlayın.
- Oda allowlist anahtarları (`groups`, eski `rooms`): `!room:server` veya `#alias:server` kullanın. Düz oda adları varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true` değerini yalnızca katılınmış oda adı aramasıyla uyumluluğa açıkça ihtiyaç duyduğunuzda ayarlayın.
- Davet allowlist'leri (`autoJoinAllowlist`): `!room:server`, `#alias:server` veya `*` kullanın. Düz oda adları reddedilir.

### Hesap ID normalleştirmesi

Sihirbaz, kullanıcı dostu bir adı normalleştirilmiş bir hesap ID'sine dönüştürür. Örneğin `Ops Bot`, `ops-bot` olur. İki hesabın çakışmaması için noktalama işaretleri kapsamlı ortam değişkeni adlarında kaçışlanır: `-` → `_X2D_`; böylece `ops-prod`, `MATRIX_OPS_X2D_PROD_*` ile eşleşir.

### Önbelleğe alınmış kimlik bilgileri

Matrix, önbelleğe alınmış kimlik bilgilerini `~/.openclaw/credentials/matrix/` altında saklar:

- varsayılan hesap: `credentials.json`
- adlandırılmış hesaplar: `credentials-<account>.json`

Önbelleğe alınmış kimlik bilgileri burada bulunduğunda, erişim token'ı yapılandırma dosyasında olmasa bile OpenClaw Matrix'i yapılandırılmış kabul eder; bu, kurulumu, `openclaw doctor` komutunu ve kanal durumu yoklamalarını kapsar.

### Ortam değişkenleri

Eşdeğer yapılandırma anahtarı ayarlanmadığında kullanılır. Varsayılan hesap öneksiz adları kullanır; adlandırılmış hesaplar, sonekten önce eklenen hesap ID'sini kullanır.

| Varsayılan hesap      | Adlandırılmış hesap (`<ID>` normalleştirilmiş hesap ID'sidir) |
| --------------------- | ------------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                      |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                                    |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                         |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                        |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                       |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                                     |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                                    |

`ops` hesabı için adlar `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` ve benzeri olur. Kurtarma anahtarı ortam değişkenleri, anahtarı `--recovery-key-stdin` üzerinden aktardığınızda kurtarma farkında CLI akışları (`verify backup restore`, `verify device`, `verify bootstrap`) tarafından okunur.

`MATRIX_HOMESERVER` bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Yapılandırma örneği

DM eşleştirmesi, oda allowlist'i ve E2EE içeren pratik bir temel:

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

Matrix yanıt akışı isteğe bağlıdır. `streaming`, OpenClaw'ın devam eden asistan yanıtını nasıl ileteceğini kontrol eder; `blockStreaming` ise tamamlanan her bloğun kendi Matrix mesajı olarak korunup korunmayacağını kontrol eder.

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

Tam nesne biçimi `{ mode, preview, progress }` kabul eder:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: özel bir etiket; yapılandırılmış veya yerleşik etiketlerden seçmek için `"auto"` ya da ayarlanmamış değer; etiket satırını gizlemek için `false`.
- `progress.labels`: yalnızca `label` `"auto"` olduğunda veya ayarlanmadığında kullanılan aday etiketler. Yerleşik varsayılanlar için ayarlamadan bırakın.
- `progress.maxLines`: taslakta tutulan en fazla kayan ilerleme satırı sayısı. Bu sınırdan sonra eski satırlar kırpılır.
- `progress.maxLineChars`: kırpmadan önce kompakt ilerleme satırı başına en fazla karakter sayısı.
- `progress.toolProgress`: `true` olduğunda (varsayılan), canlı araç/ilerleme etkinliği taslakta görünür.

| `streaming`          | Davranış                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"off"` (varsayılan) | Tam yanıtı bekler, bir kez gönderir. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                             |
| `"partial"`          | Model mevcut bloğu yazarken bir normal metin mesajını yerinde düzenler. Stok Matrix istemcileri son düzenlemede değil, ilk önizlemede bildirim gönderebilir.                              |
| `"quiet"`            | `"partial"` ile aynıdır, ancak mesaj bildirim oluşturmayan bir notice'tır. Alıcılar yalnızca kullanıcı başına bir push kuralı tamamlanmış düzenlemeyle eşleştiğinde bildirim alır (aşağıya bakın). |
| `"progress"`         | Bir ilerleme taslağı kullanarak tek tek kompakt ilerleme satırları gönderir.                                                                                                               |

`blockStreaming`, `streaming` değerinden bağımsızdır:

| `streaming`             | `blockStreaming: true`                                                  | `blockStreaming: false` (varsayılan)                    |
| ----------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------- |
| `"partial"` / `"quiet"` | Mevcut blok için canlı taslak, tamamlanan bloklar mesaj olarak tutulur  | Mevcut blok için canlı taslak, yerinde sonlandırılır     |
| `"off"`                 | Bitmiş blok başına bir bildirimli Matrix mesajı                         | Tam yanıt için bir bildirimli Matrix mesajı              |

Notlar:

- Bir önizleme Matrix'in olay başına boyut sınırını aşarsa, OpenClaw önizleme akışını durdurur ve yalnızca son teslimata geri döner.
- Medya yanıtları ekleri her zaman normal şekilde gönderir. Eski bir önizleme artık güvenle yeniden kullanılamıyorsa, OpenClaw son medya yanıtını göndermeden önce onu redact eder.
- Matrix önizleme akışı etkin olduğunda araç ilerleme önizleme güncellemeleri varsayılan olarak etkindir. Yanıt metni için önizleme düzenlemelerini koruyup araç ilerlemesini normal teslimat yolunda bırakmak için `streaming.preview.toolProgress: false` ayarlayın.
- Önizleme düzenlemeleri ek Matrix API çağrıları gerektirir. En tutucu rate limit profilini istiyorsanız `streaming: "off"` olarak bırakın.

## Sesli mesajlar

Gelen Matrix sesli notları, oda mention kapısından önce yazıya dökülür. Bu, bot adını söyleyen bir sesli notun `requireMention: true` olan bir odada agent'ı tetiklemesini sağlar ve agent'a yalnızca bir ses eki yer tutucusu yerine transkripti verir.

Matrix, `tools.media.audio` altında yapılandırılan paylaşılan ses medya sağlayıcısını kullanır; örneğin OpenAI `gpt-4o-mini-transcribe`. Sağlayıcı kurulumu ve sınırlar için [Medya araçlarına genel bakış](/tr/tools/media-overview) bölümüne bakın.

Davranış ayrıntıları:

- `m.audio` olayları ve `audio/*` MIME türüne sahip `m.file` olayları uygundur.
- Şifreli odalarda OpenClaw, yazıya dökmeden önce eki mevcut Matrix medya yolu üzerinden çözer.
- Döküm, agent isteminde makine tarafından oluşturulmuş ve güvenilmeyen olarak işaretlenir.
- Ek, aşağı akış medya araçlarının aynı sesli notu yeniden yazıya dökmemesi için zaten yazıya dökülmüş olarak işaretlenir.
- Ses yazıya dökümünü genel olarak devre dışı bırakmak için `tools.media.audio.enabled: false` ayarını yapın.

## Onay meta verileri

Matrix yerel onay istemleri, `com.openclaw.approval` altında OpenClaw'a özgü özel olay içeriği bulunan normal `m.room.message` olaylarıdır. Matrix özel olay içeriği anahtarlarına izin verir; bu nedenle standart istemciler metin gövdesini göstermeye devam ederken, OpenClaw uyumlu istemciler yapılandırılmış onay kimliğini, türünü, durumunu, kullanılabilir kararları ve exec/plugin ayrıntılarını okuyabilir.

Bir onay istemi tek bir Matrix olayı için çok uzunsa OpenClaw görünen metni parçalara böler ve `com.openclaw.approval` içeriğini yalnızca ilk parçaya ekler. İzin verme/reddetme kararlarına yönelik tepkiler bu ilk olaya bağlanır; böylece uzun istemler, tek olaylı istemlerle aynı onay hedefini korur.

### Sessiz tamamlanmış önizlemeler için kendi barındırdığınız anında iletme kuralları

`streaming: "quiet"`, alıcıları yalnızca bir blok veya tur tamamlandığında bilgilendirir; kullanıcı başına bir anında iletme kuralının tamamlanmış önizleme işaretçisiyle eşleşmesi gerekir. Tarifin tamamı için [sessiz önizlemeler için Matrix anında iletme kuralları](/tr/channels/matrix-push-rules) bölümüne bakın (alıcı belirteci, pusher denetimi, kural kurulumu, homeserver başına notlar).

## Botlar arası odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix iletileri yok sayılır.

Agent'lar arası Matrix trafiğini bilerek istediğinizde `allowBots` kullanın:

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
- Kabul edilen yapılandırılmış bot iletileri paylaşılan [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanır. `channels.defaults.botLoopProtection` yapılandırmasını yapın; ardından bir odanın farklı bir bütçeye ihtiyacı olduğunda `channels.matrix.botLoopProtection` veya `channels.matrix.groups.<room>.botLoopProtection` ile geçersiz kılın.
- OpenClaw, kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen iletileri yine de yok sayar.
- Matrix burada yerel bir bot bayrağı sunmaz; OpenClaw "bot tarafından yazılmış" durumunu "bu OpenClaw Gateway üzerinde yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak değerlendirir.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken katı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifreli (E2EE) odalarda giden görüntü olayları `thumbnail_file` kullanır; böylece görüntü önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalar hâlâ düz `thumbnail_url` kullanır. Yapılandırma gerekmez; plugin E2EE durumunu otomatik olarak algılar.

Tüm `openclaw matrix` komutları `--verbose` (tam tanılama), `--json` (makine tarafından okunabilir çıktı) ve `--account <id>` (çok hesaplı kurulumlar) kabul eder. Varsayılan olarak çıktı, sessiz dahili SDK günlük kaydıyla kısadır. Aşağıdaki örnekler kanonik biçimi gösterir; bayrakları gerektiğinde ekleyin.

### Şifrelemeyi etkinleştirme

```bash
openclaw matrix encryption setup
```

Gizli depolamayı ve çapraz imzalamayı önyükler, gerekirse bir oda anahtarı yedeği oluşturur, ardından durumu ve sonraki adımları yazdırır. Kullanışlı bayraklar:

- `--recovery-key <key>` önyüklemeden önce bir kurtarma anahtarı uygular (aşağıda belgelenen stdin biçimini tercih edin)
- `--force-reset-cross-signing` geçerli çapraz imzalama kimliğini atar ve yenisini oluşturur (yalnızca bilerek kullanın)

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

`verify status` üç bağımsız güven sinyali bildirir (`--verbose` hepsini gösterir):

- `Locally trusted`: yalnızca bu istemci tarafından güvenilir
- `Cross-signing verified`: SDK, çapraz imzalama üzerinden doğrulama bildirir
- `Signed by owner`: kendi kendini imzalama anahtarınız tarafından imzalanmış (yalnızca tanılama)

`Verified by owner`, yalnızca `Cross-signing verified` `yes` olduğunda `yes` olur. Yerel güven veya tek başına bir sahip imzası yeterli değildir.

`--allow-degraded-local-state`, önce Matrix hesabını hazırlamadan en iyi çaba tanılamaları döndürür; çevrimdışı veya kısmen yapılandırılmış yoklamalar için kullanışlıdır.

### Bu cihazı kurtarma anahtarıyla doğrulama

Kurtarma anahtarı hassastır; komut satırında geçirmek yerine stdin üzerinden aktarın. `MATRIX_RECOVERY_KEY` ayarını yapın (veya adlandırılmış bir hesap için `MATRIX_<ID>_RECOVERY_KEY`):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Komut üç durum bildirir:

- `Recovery key accepted`: Matrix, gizli depolama veya cihaz güveni için anahtarı kabul etti.
- `Backup usable`: oda anahtarı yedeği güvenilir kurtarma malzemesiyle yüklenebilir.
- `Device verified by owner`: bu cihaz tam Matrix çapraz imzalama kimliği güvenine sahiptir.

Kurtarma anahtarı yedek malzemeyi açmış olsa bile, tam kimlik güveni eksikse sıfır olmayan kodla çıkar. Bu durumda, başka bir Matrix istemcisinden kendi kendini doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

`verify self`, başarıyla çıkmadan önce `Cross-signing verified: yes` bekler. Beklemeyi ayarlamak için `--timeout-ms <ms>` kullanın.

Düz anahtar biçimi `openclaw matrix verify device "<recovery-key>"` de kabul edilir, ancak anahtar kabuk geçmişinize girer.

### Çapraz imzalamayı önyükleme veya onarma

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap`, şifreli hesaplar için onarım ve kurulum komutudur. Sırayla şunları yapar:

- gizli depolamayı önyükler, mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanır
- çapraz imzalamayı önyükler ve eksik açık anahtarları yükler
- geçerli cihazı işaretler ve çapraz imzalar
- zaten yoksa sunucu tarafında bir oda anahtarı yedeği oluşturur

Homeserver, çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa OpenClaw önce kimlik doğrulamasız dener, ardından `m.login.dummy`, sonra `m.login.password` dener (`channels.matrix.password` gerektirir).

Kullanışlı bayraklar:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` ile eşleştirin) veya `--recovery-key <key>`
- `--force-reset-cross-signing` geçerli çapraz imzalama kimliğini atmak için (yalnızca bilerek; etkin kurtarma anahtarının depolanmış olmasını veya `--recovery-key-stdin` ile sağlanmasını gerektirir)

### Oda anahtarı yedeği

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`, sunucu tarafında bir yedeğin var olup olmadığını ve bu cihazın onu çözüp çözemediğini gösterir. `backup restore`, yedeklenmiş oda anahtarlarını yerel kripto deposuna içe aktarır; kurtarma anahtarı zaten diskteyse `--recovery-key-stdin` öğesini atlayabilirsiniz.

Bozuk bir yedeği yeni bir temel çizgiyle değiştirmek için (kurtarılamayan eski geçmişin kaybedilmesini kabul eder; geçerli yedek sırrı yüklenemiyorsa gizli depolamayı da yeniden oluşturabilir):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` yalnızca önceki kurtarma anahtarının yeni yedek temel çizgisini açmasını bilerek durdurmak istediğinizde ekleyin.

### Doğrulamaları listeleme, isteme ve yanıtlama

```bash
openclaw matrix verify list
```

Seçili hesap için bekleyen doğrulama isteklerini listeler.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Bu OpenClaw hesabından bir doğrulama isteği gönderir. `--own-user`, kendi kendini doğrulama ister (istemi aynı kullanıcının başka bir Matrix istemcisinde kabul edersiniz); `--user-id`/`--device-id`/`--room-id` başka birini hedefler. `--own-user` diğer hedefleme bayraklarıyla birleştirilemez.

Daha düşük düzey yaşam döngüsü işleme için, genellikle başka bir istemciden gelen istekleri izlerken, bu komutlar belirli bir `<id>` isteği üzerinde çalışır (`verify list` ve `verify request` tarafından yazdırılır):

| Komut                                     | Amaç                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`      | Gelen bir isteği kabul et                                            |
| `openclaw matrix verify start <id>`       | SAS akışını başlat                                                   |
| `openclaw matrix verify sas <id>`         | SAS emojisini veya ondalık değerleri yazdır                          |
| `openclaw matrix verify confirm-sas <id>` | SAS'ın diğer istemcinin gösterdiğiyle eşleştiğini onayla             |
| `openclaw matrix verify mismatch-sas <id>` | Emoji veya ondalık değerler eşleşmediğinde SAS'ı reddet             |
| `openclaw matrix verify cancel <id>`      | İptal et; isteğe bağlı `--reason <text>` ve `--code <matrix-code>` alır |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` ve `cancel`, doğrulama belirli bir doğrudan ileti odasına bağlı olduğunda DM takip ipuçları olarak `--user-id` ve `--room-id` kabul eder.

### Çok hesaplı notlar

`--account <id>` olmadan Matrix CLI komutları örtük varsayılan hesabı kullanır. Birden fazla adlandırılmış hesabınız varsa ve `channels.matrix.defaultAccount` ayarlamadıysanız tahminde bulunmayı reddeder ve seçim yapmanızı ister. E2EE adlandırılmış bir hesap için devre dışı veya kullanılamaz olduğunda hatalar o hesabın yapılandırma anahtarını gösterir; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Başlangıç davranışı">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz başka bir Matrix istemcisinde kendi kendini doğrulama ister, yinelemeleri atlar ve bir bekleme süresi uygular (varsayılan olarak 24 saat). `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca geçerli gizli depolamayı ve çapraz imzalama kimliğini yeniden kullanan korumacı bir kripto önyükleme geçişi çalıştırır. Önyükleme durumu bozuksa OpenClaw, `channels.matrix.password` olmadan bile korumalı bir onarım dener; homeserver parola UIA gerektiriyorsa başlangıç bir uyarı günlüğe yazar ve ölümcül olmayan durumda kalır. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix geçişi](/tr/channels/matrix-migration) bölümüne bakın.

  </Accordion>

  <Accordion title="Doğrulama bildirimleri">
    Matrix, doğrulama yaşam döngüsü bildirimlerini katı DM doğrulama odasına `m.notice` iletileri olarak gönderir: istek, hazır (''Verify by emoji'' rehberliğiyle), başlatma/tamamlama ve mevcut olduğunda SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik olarak kabul edilir. Kendi kendini doğrulama için OpenClaw, SAS akışını otomatik olarak başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar; yine de Matrix istemcinizde karşılaştırıp "They match" seçeneğini onaylamanız gerekir.

    Doğrulama sistem bildirimleri agent sohbet işlem hattına iletilmez.

  </Accordion>

  <Accordion title="Silinmiş veya geçersiz Matrix cihazı">
    `verify status`, geçerli cihazın artık homeserver üzerinde listelenmediğini söylüyorsa yeni bir OpenClaw Matrix cihazı oluşturun. Parola ile giriş için:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Token kimlik doğrulaması için Matrix istemcinizde veya yönetici UI'ında yeni bir erişim token'ı oluşturun, ardından OpenClaw'ı güncelleyin:

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
    Matrix E2EE, IndexedDB shim'i olarak `fake-indexeddb` ile resmi `matrix-js-sdk` Rust kripto yolunu kullanır. Kripto durumu `crypto-idb-snapshot.json` dosyasına kalıcı olarak kaydedilir (kısıtlayıcı dosya izinleri).

    Şifrelenmiş çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında bulunur ve eşitleme deposunu, kripto deposunu, kurtarma anahtarını, IDB anlık görüntüsünü, iş parçacığı bağlarını ve başlangıç doğrulama durumunu içerir. Token değiştiğinde ancak hesap kimliği aynı kaldığında, OpenClaw önceki durum görünür kalsın diye mevcut en iyi kökü yeniden kullanır.

    Tek bir eski token-hash kökü normal bir token döndürme süreklilik yolu olabilir. OpenClaw `matrix: multiple populated token-hash storage roots detected` günlüğünü yazarsa, hesap dizinini inceleyin ve yalnızca seçilen etkin kökün sağlıklı olduğunu doğruladıktan sonra eski kardeş kökleri arşivleyin. Eski kökleri hemen silmek yerine bir `_archive/` dizinine taşımayı tercih edin.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

Seçilen hesap için Matrix öz profilini güncelleyin:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

İki seçeneği de tek çağrıda geçirebilirsiniz. Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder; `http://` veya `https://` geçirdiğinizde, OpenClaw önce dosyayı yükler ve çözümlenen `mxc://` URL'sini `channels.matrix.avatarUrl` içine (veya hesap başına geçersiz kılmaya) kaydeder.

## İş parçacıkları

Matrix, hem otomatik yanıtlar hem de mesaj aracı gönderimleri için yerel Matrix iş parçacıklarını destekler. Davranışı iki bağımsız düğme kontrol eder:

### Oturum yönlendirme (`sessionScope`)

`dm.sessionScope`, Matrix DM odalarının OpenClaw oturumlarına nasıl eşleneceğine karar verir:

- `"per-user"` (varsayılan): aynı yönlendirilen eşe sahip tüm DM odaları tek bir oturumu paylaşır.
- `"per-room"`: eş aynı olsa bile her Matrix DM odası kendi oturum anahtarını alır.

Açık konuşma bağları her zaman `sessionScope` üzerinde önceliklidir; bu nedenle bağlı odalar ve iş parçacıkları seçtikleri hedef oturumu korur.

### Yanıt iş parçacığı (`threadReplies`)

`threadReplies`, botun yanıtını nereye göndereceğine karar verir:

- `"off"`: yanıtlar üst düzeydedir. Gelen iş parçacıklı mesajlar üst oturumda kalır.
- `"inbound"`: yalnızca gelen mesaj zaten o iş parçacığındaysa iş parçacığının içinde yanıtla.
- `"always"`: tetikleyen mesaja köklenen bir iş parçacığının içinde yanıtla; bu konuşma ilk tetikleyiciden itibaren eşleşen iş parçacığı kapsamlı bir oturum üzerinden yönlendirilir.

`dm.threadReplies` bunu yalnızca DM'ler için geçersiz kılar - örneğin, oda iş parçacıklarını yalıtılmış tutarken DM'leri düz tutun.

### İş parçacığı kalıtımı ve slash komutları

- Gelen iş parçacıklı mesajlar, iş parçacığı kök mesajını ek agent bağlamı olarak içerir.
- Mesaj aracı gönderimleri, açık bir `threadId` sağlanmadığı sürece aynı odayı (veya aynı DM kullanıcı hedefini) hedeflerken mevcut Matrix iş parçacığını otomatik olarak devralır.
- DM kullanıcı hedefi yeniden kullanımı yalnızca mevcut oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi halde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve iş parçacığına bağlı `/acp spawn` Matrix odalarında ve DM'lerde çalışır.
- Üst düzey `/focus`, `threadBindings.spawnSessions` etkin olduğunda yeni bir Matrix iş parçacığı oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix iş parçacığının içinde `/focus` veya `/acp spawn --thread here` çalıştırmak, o iş parçacığını yerinde bağlar.

OpenClaw, bir Matrix DM odasının aynı paylaşılan oturumdaki başka bir DM odasıyla çakıştığını algıladığında, o odaya `/focus` kaçış yolunu işaret eden ve `dm.sessionScope` değişikliği öneren tek seferlik bir `m.notice` gönderir. Bildirim yalnızca iş parçacığı bağları etkin olduğunda görünür.

## ACP konuşma bağları

Matrix odaları, DM'leri ve mevcut Matrix iş parçacıkları, sohbet yüzeyi değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM, oda veya mevcut iş parçacığı içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir Matrix DM veya odasında, mevcut DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir Matrix iş parçacığının içinde `--bind here`, o mevcut iş parçacığını yerinde bağlar.
- `/new` ve `/reset` aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağı kaldırır.

Notlar:

- `--bind here` bir alt Matrix iş parçacığı oluşturmaz.
- `threadBindings.spawnSessions`, OpenClaw'ın bir alt Matrix iş parçacığı oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` davranışını kapılar.

### İş parçacığı bağı yapılandırması

Matrix, genel varsayılanları `session.threadBindings` üzerinden devralır ve ayrıca kanal başına geçersiz kılmaları destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix iş parçacığına bağlı oturum oluşturma varsayılan olarak açıktır:

- Üst düzey `/focus` ve `/acp spawn --thread auto|here` komutlarının Matrix iş parçacıkları oluşturmasını/bağlamasını engellemek için `threadBindings.spawnSessions: false` ayarlayın.
- Yerel alt agent iş parçacığı oluşturmalarının üst transcript'i çatallamaması gerektiğinde `threadBindings.defaultSpawnContext: "isolated"` ayarlayın.

## Tepkiler

Matrix, giden tepkileri, gelen tepki bildirimlerini ve onay tepkilerini destekler.

Giden tepki araçları `channels.matrix.actions.reactions` tarafından kapılanır:

- `react`, bir Matrix olayına tepki ekler.
- `reactions`, bir Matrix olayı için mevcut tepki özetini listeler.
- `emoji=""`, botun o olaydaki kendi tepkilerini kaldırır.
- `remove: true`, bottan yalnızca belirtilen emoji tepkisini kaldırır.

**Çözüm sırası** (ilk tanımlı değer kazanır):

| Ayar                    | Sıra                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | hesap başına → kanal → `messages.ackReaction` → agent kimliği emoji geri dönüşü  |
| `ackReactionScope`      | hesap başına → kanal → `messages.ackReactionScope` → varsayılan `"group-mentions"` |
| `reactionNotifications` | hesap başına → kanal → varsayılan `"own"`                                        |

`reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedeflediklerinde eklenen `m.reaction` olaylarını iletir; `"off"` tepki sistemi olaylarını devre dışı bırakır. Tepki kaldırmaları sistem olaylarına sentezlenmez, çünkü Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaction olarak sunar.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir Matrix oda mesajı agent'ı tetiklediğinde `InboundHistory` olarak kaç yeni oda mesajının dahil edileceğini kontrol eder. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmamışsa etkin varsayılan `0` olur. Devre dışı bırakmak için `0` ayarlayın.
- Matrix oda geçmişi yalnızca odaya özeldir. DM'ler normal oturum geçmişini kullanmaya devam eder.
- Matrix oda geçmişi yalnızca bekleyen mesajlara yöneliktir: OpenClaw henüz yanıt tetiklememiş oda mesajlarını tamponlar, ardından bir mention veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Mevcut tetikleyici mesaj `InboundHistory` içine dahil edilmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, alınan yanıt metni, iş parçacığı kökleri ve bekleyen geçmiş gibi ek oda bağlamı için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı gibi korunur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı allowlist denetimleri tarafından izin verilen göndericilerle filtreler.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır, ancak yine de bir açık alıntılanmış yanıtı korur.

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

Odalar çalışmaya devam ederken DM'leri tamamen susturmak için `dm.enabled: false` ayarlayın:

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

Onaylanmamış bir Matrix kullanıcısı onaydan önce size mesaj göndermeye devam ederse, OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni kod basmak yerine kısa bir bekleme süresinden sonra hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Eşleştirme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu eşitlemeden saparsa, OpenClaw canlı DM yerine eski tek kişilik odaları işaret eden eski `m.direct` eşlemeleriyle kalabilir. Bir eş için mevcut eşlemeyi inceleyin:

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

Eski odaları otomatik olarak silmez. Sağlıklı DM'yi seçer ve gelecekteki Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları doğru odayı hedeflesin diye eşlemeyi günceller.

## Exec onayları

Matrix yerel bir onay istemcisi olarak davranabilir. `channels.matrix.execApprovals` altında (veya hesap başına geçersiz kılma için `channels.matrix.accounts.<account>.execApprovals` altında) yapılandırın:

- `enabled`: onayları Matrix yerel istemleriyle teslim eder. Ayarlanmamışsa veya `"auto"` ise Matrix, en az bir onaylayıcı çözümlenebildiğinde otomatik etkinleşir. Açıkça devre dışı bırakmak için `false` ayarlayın.
- `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (`@owner:example.org`). İsteğe bağlı - `channels.matrix.dm.allowFrom` değerine geri döner.
- `target`: istemlerin nereye gideceği. `"dm"` (varsayılan) onaylayıcı DM'lerine gönderir; `"channel"` kaynak Matrix odasına veya DM'ye gönderir; `"both"` ikisine de gönderir.
- `agentFilter` / `sessionFilter`: hangi agent'ların/oturumların Matrix teslimini tetikleyeceği için isteğe bağlı allowlist'ler.

Yetkilendirme, onay türleri arasında biraz farklıdır:

- **Exec onayları** `execApprovals.approvers` kullanır ve `dm.allowFrom` değerine geri döner.
- **Plugin onayları** yalnızca `dm.allowFrom` üzerinden yetkilendirilir.

Her iki tür de Matrix tepki kısayollarını ve mesaj güncellemelerini paylaşır. Onaylayıcılar birincil onay mesajında tepki kısayollarını görür:

- `✅` bir kez izin ver
- `❌` reddet
- `♾️` her zaman izin ver (etkin exec ilkesi izin verdiğinde)

Yedek eğik çizgi komutları: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Exec onayları için kanal teslimi komut metnini içerir; `channel` veya `both` değerlerini yalnızca güvenilir odalarda etkinleştirin.

İlgili: [Exec onayları](/tr/tools/exec-approvals).

## Eğik çizgi komutları

Eğik çizgi komutları (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` vb.) DM'lerde doğrudan çalışır. Odalarda OpenClaw, botun kendi Matrix mention'ı ile öneklenen komutları da tanır; bu nedenle `@bot:server /new`, özel bir mention regex'i olmadan komut yolunu tetikler. Bu, kullanıcı komutu yazmadan önce botu sekme tamamlama ile seçtiğinde Element ve benzeri istemcilerin ürettiği oda tarzı `@mention /command` gönderilerine botun yanıt verebilmesini sağlar.

Yetkilendirme kuralları yine geçerlidir: komut gönderenler, düz mesajlarla aynı DM veya oda izin listesi/sahip politikalarını karşılamalıdır.

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

- Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadıkça adlandırılmış hesaplar için varsayılan olarak davranır.
- Devralınan bir oda girdisini `groups.<room>.account` ile belirli bir hesaba kapsamlayın. `account` içermeyen girdiler hesaplar arasında paylaşılır; varsayılan hesap üst düzeyde yapılandırıldığında `account: "default"` hâlâ çalışır.

**Varsayılan hesap seçimi:**

- Örtük yönlendirme, yoklama ve CLI komutlarının tercih edeceği adlandırılmış hesabı seçmek için `defaultAccount` ayarlayın.
- Birden fazla hesabınız varsa ve birinin adı kelimenin tam anlamıyla `default` ise, `defaultAccount` ayarlanmamış olsa bile OpenClaw onu örtük olarak kullanır.
- Birden fazla adlandırılmış hesabınız varsa ve varsayılan seçilmemişse, CLI komutları tahminde bulunmayı reddeder; `defaultAccount` ayarlayın veya `--account <id>` iletin.
- Üst düzey `channels.matrix.*` bloğu, yalnızca kimlik doğrulaması eksiksiz olduğunda (`homeserver` + `accessToken` veya `homeserver` + `userId` + `password`) örtük `default` hesap olarak ele alınır. Adlandırılmış hesaplar, önbelleğe alınmış kimlik bilgileri kimlik doğrulamayı karşıladığında `homeserver` + `userId` üzerinden keşfedilebilir kalır.

**Yükseltme:**

- OpenClaw, onarım veya kurulum sırasında tek hesaplı bir yapılandırmayı çoklu hesaba yükselttiğinde, varsa mevcut adlandırılmış hesabı veya `defaultAccount` zaten bir hesabı gösteriyorsa onu korur. Yalnızca Matrix kimlik doğrulama/bootstrap anahtarları yükseltilen hesaba taşınır; paylaşılan teslim-politikası anahtarları üst düzeyde kalır.

Paylaşılan çoklu hesap deseni için [Yapılandırma başvurusu](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'lar

Varsayılan olarak OpenClaw, SSRF koruması için özel/dahili Matrix homeserver'larını, hesap başına açıkça kabul etmediğiniz sürece engeller.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir ana makine adı üzerinde çalışıyorsa, ilgili Matrix hesabı için `network.dangerouslyAllowPrivateNetwork` değerini etkinleştirin:

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

Bu açık kabul yalnızca güvenilir özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi herkese açık düz metin homeserver'lar engellenmeye devam eder. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğini proxy üzerinden geçirme

Matrix dağıtımınız açık bir giden HTTP(S) proxy'si gerektiriyorsa `channels.matrix.proxy` ayarlayın:

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
OpenClaw, çalışma zamanı Matrix trafiği ve hesap durum yoklamaları için aynı proxy ayarını kullanır.

## Hedef çözümleme

Matrix, OpenClaw sizden oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. Açık teslim hedefleri, cron işleri, bağlamalar veya izin listeleri yapılandırırken Matrix'teki oda kimliğinin tam büyük/küçük harf kullanımını kullanın.
OpenClaw, depolama için dahili oturum anahtarlarını kanonik tutar; bu nedenle bu küçük harfli anahtarlar Matrix teslim kimlikleri için güvenilir bir kaynak değildir.

Canlı dizin araması, oturum açmış Matrix hesabını kullanır:

- Kullanıcı aramaları, ilgili homeserver'daki Matrix kullanıcı dizinini sorgular.
- Oda aramaları açık oda kimliklerini ve takma adları doğrudan kabul eder. Katılınmış oda adı araması en iyi çabayla yapılır ve yalnızca `dangerouslyAllowNameMatching: true` ayarlandığında çalışma zamanı oda izin listelerine uygulanır.
- Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa çalışma zamanı izin listesi çözümlemesi tarafından yok sayılır.

## Yapılandırma başvurusu

İzin listesi tarzı kullanıcı alanları (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) tam Matrix kullanıcı kimliklerini kabul eder (en güvenlisi). Kimlik olmayan kullanıcı girdileri varsayılan olarak yok sayılır. `dangerouslyAllowNameMatching: true` ayarlarsanız, tam Matrix dizini görünen ad eşleşmeleri başlangıçta ve izleyici çalışırken izin listesi her değiştiğinde çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır.

Oda izin listesi anahtarları (`groups`, eski `rooms`) oda kimlikleri veya takma adlar olmalıdır. Düz oda adı anahtarları varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true`, katılınmış oda adlarına karşı en iyi çaba aramasını geri getirir.

### Hesap ve bağlantı

- `enabled`: kanalı etkinleştirin veya devre dışı bırakın.
- `name`: hesap için isteğe bağlı görüntü etiketi.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `accounts`: hesap başına adlandırılmış geçersiz kılmalar. Üst düzey `channels.matrix` değerleri varsayılan olarak devralınır.
- `homeserver`: homeserver URL'si, örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu hesabın `localhost`, LAN/Tailscale IP'leri veya dahili ana makine adlarına bağlanmasına izin verin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Hesap başına geçersiz kılma desteklenir.
- `userId`: tam Matrix kullanıcı kimliği (`@bot:example.org`).
- `accessToken`: token tabanlı kimlik doğrulaması için erişim token'ı. Düz metin ve SecretRef değerleri env/file/exec sağlayıcıları genelinde desteklenir ([Gizli Bilgi Yönetimi](/tr/gateway/secrets)).
- `password`: parola tabanlı oturum açma için parola. Düz metin ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parola ile oturum açma sırasında kullanılan cihaz görünen adı.
- `avatarUrl`: profil eşitlemesi ve `profile set` güncellemeleri için depolanan kendi avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında getirilen en yüksek olay sayısı.

### Şifreleme

- `encryption`: E2EE'yi etkinleştirin. Varsayılan: `false`.
- `startupVerification`: `"if-unverified"` (E2EE açıkken varsayılan) veya `"off"`. Bu cihaz doğrulanmamışsa başlangıçta kendi kendini doğrulamayı otomatik olarak ister.
- `startupVerificationCooldownHours`: bir sonraki otomatik başlangıç isteğinden önceki bekleme süresi. Varsayılan: `24`.

### Erişim ve politika

- `groupPolicy`: `"open"`, `"allowlist"` veya `"disabled"`. Varsayılan: `"allowlist"`.
- `groupAllowFrom`: oda trafiği için kullanıcı kimlikleri izin listesi.
- `mentionPatterns`: oda mention'ları için kapsamlı regex desenleri. `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }` içeren nesne. Yapılandırılmış `agents.list[].groupChat.mentionPatterns` değerlerinin oda başına uygulanıp uygulanmayacağını denetler.
- `dm.enabled`: `false` olduğunda tüm DM'leri yok sayar. Varsayılan: `true`.
- `dm.policy`: `"pairing"` (varsayılan), `"allowlist"`, `"open"` veya `"disabled"`. Bot katılıp odayı DM olarak sınıflandırdıktan sonra uygulanır; davet işlemeyi etkilemez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimlikleri izin listesi.
- `dm.sessionScope`: `"per-user"` (varsayılan) veya `"per-room"`.
- `dm.threadReplies`: yanıt thread'leri için yalnızca DM geçersiz kılması (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: diğer yapılandırılmış Matrix bot hesaplarından gelen mesajları kabul edin (`true` veya `"mentions"`).
- `allowlistOnly`: `true` olduğunda, tüm etkin DM politikalarını (`"disabled"` hariç) ve `"open"` grup politikalarını `"allowlist"` olmaya zorlar. `"disabled"` politikalarını değiştirmez.
- `dangerouslyAllowNameMatching`: `true` olduğunda, kullanıcı izin listesi girdileri için Matrix görünen ad dizini aramasına ve oda izin listesi anahtarları için katılınmış oda adı aramasına izin verir. Tam `@user:server` kimliklerini ve oda kimliklerini veya takma adları tercih edin.
- `autoJoin`: `"always"`, `"allowlist"` veya `"off"`. Varsayılan: `"off"`. DM tarzı davetler dahil her Matrix davetine uygulanır.
- `autoJoinAllowlist`: `autoJoin` `"allowlist"` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri, davet edilen odanın iddia ettiği duruma karşı değil, homeserver'a karşı çözümlenir.
- `contextVisibility`: ek bağlam görünürlüğü (`"all"` varsayılan, `"allowlist"`, `"allowlist_quote"`).

### Yanıt davranışı

- `replyToMode`: `"off"`, `"first"`, `"all"` veya `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` veya `"always"`.
- `threadBindings`: thread'e bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `streaming`: `"off"` (varsayılan), `"partial"`, `"quiet"`, `"progress"` veya `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }` nesne biçimi. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: `true` olduğunda, tamamlanan asistan blokları ayrı ilerleme mesajları olarak tutulur.
- `markdown`: giden metin için isteğe bağlı Markdown işleme yapılandırması.
- `responsePrefix`: giden yanıtlara eklenen isteğe bağlı dize.
- `textChunkLimit`: `chunkMode: "length"` olduğunda karakter cinsinden giden parça boyutu. Varsayılan: `4000`.
- `chunkMode`: `"length"` (varsayılan, karakter sayısına göre böler) veya `"newline"` (satır sınırlarında böler).
- `historyLimit`: bir oda mesajı ajanı tetiklediğinde `InboundHistory` olarak dahil edilen son oda mesajı sayısı. `messages.groupChat.historyLimit` değerine geri döner; etkili varsayılan `0` (devre dışı).
- `mediaMaxMb`: giden gönderimler ve gelen işleme için MB cinsinden medya boyutu sınırı.

### Tepki ayarları

- `ackReaction`: bu kanal/hesap için ack tepkisi geçersiz kılması.
- `ackReactionScope`: kapsam geçersiz kılması (`"group-mentions"` varsayılan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: gelen tepki bildirim modu (`"own"` varsayılan, `"off"`).

### Araçlar ve oda başına geçersiz kılmalar

- `actions`: eylem başına araç geçişi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: oda başına ilke eşlemi. Oturum kimliği, çözümlemeden sonra kararlı oda kimliğini kullanır. (`rooms` eski bir takma addır.)
  - `groups.<room>.account`: devralınan tek bir oda girdisini belirli bir hesapla sınırlandırır.
  - `groups.<room>.enabled`: oda başına açma/kapatma. `false` olduğunda oda, eşlemde yokmuş gibi yok sayılır.
  - `groups.<room>.requireMention`: kanal düzeyindeki bahsetme gereksinimi için oda başına geçersiz kılma.
  - `groups.<room>.allowBots`: kanal düzeyindeki ayar için oda başına geçersiz kılma (`true` veya `"mentions"`).
  - `groups.<room>.botLoopProtection`: botlar arası döngü koruması bütçesi için oda başına geçersiz kılma.
  - `groups.<room>.users`: oda başına gönderici izin listesi.
  - `groups.<room>.tools`: oda başına araç izin/ret geçersiz kılmaları.
  - `groups.<room>.autoReply`: oda başına bahsetme geçişi geçersiz kılma. `true`, o oda için bahsetme gereksinimlerini devre dışı bırakır; `false` bunları tekrar zorunlu kılar.
  - `groups.<room>.skills`: oda başına skill filtresi.
  - `groups.<room>.systemPrompt`: oda başına sistem istemi parçacığı.

### Exec onayı ayarları

- `execApprovals.enabled`: exec onaylarını Matrix yerel istemleri üzerinden iletir.
- `execApprovals.approvers`: onay vermesine izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` değerine geri döner.
- `execApprovals.target`: `"dm"` (varsayılan), `"channel"` veya `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: teslimat için isteğe bağlı agent/oturum izin listeleri.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme geçişi
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve güçlendirme
