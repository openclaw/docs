---
read_when:
    - OpenClaw'da Matrix kurulumu
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulumu ve yapılandırma örnekleri
title: Matrix
x-i18n:
    generated_at: "2026-07-16T16:38:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca704ff911dbe97242d42727561fbce59f27e190343d2343dfad46289c1e0b94
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, resmi `matrix-js-sdk` üzerine kurulu, indirilebilir bir kanal pluginidir (`@openclaw/matrix`). DM'leri, odaları, ileti dizilerini, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Kurulum

```bash
openclaw plugins install @openclaw/matrix
```

Yalın plugin belirtimleri önce ClawHub'ı, ardından npm geri dönüşünü dener. Kaynağı `openclaw plugins install clawhub:@openclaw/matrix` veya `npm:@openclaw/matrix` ile zorunlu kılın. Yerel bir çalışma kopyasından: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install`, plugini kaydeder ve etkinleştirir; ayrı bir `enable` adımı gerekmez. Aşağıdaki şekilde yapılandırılana kadar kanal yine hiçbir şey yapmaz. Genel kurulum kuralları için [Pluginler](/tr/tools/plugin) bölümüne bakın.

## Kurulum

1. Ana sunucunuzda bir Matrix hesabı oluşturun.
2. `channels.matrix` öğesini `homeserver` + `accessToken` veya `homeserver` + `userId` + `password` ile yapılandırın.
3. Gateway'i yeniden başlatın.
4. Botla bir DM başlatın veya botu bir odaya davet edin. Yeni davetler yalnızca [`autoJoin`](#auto-join) izin verdiğinde kabul edilir.

### Etkileşimli kurulum

```bash
openclaw channels add
openclaw configure --section channels
```

Sihirbaz; ana sunucu URL'sini, kimlik doğrulama yöntemini (token veya parola), kullanıcı kimliğini (yalnızca parolayla kimlik doğrulamada), isteğe bağlı cihaz adını, E2EE'nin etkinleştirilip etkinleştirilmeyeceğini ve oda erişimi/otomatik katılım ayarlarını sorar. Eşleşen `MATRIX_*` ortam değişkenleri zaten mevcutsa ve hesabın kayıtlı kimlik doğrulaması yoksa sihirbaz bir ortam değişkeni kısayolu sunar. `openclaw channels resolve --channel matrix "Project Room"` ile bir izin listesi kaydetmeden önce oda adlarını çözümleyin. Sihirbazda E2EE'yi etkinleştirmek, [`openclaw matrix encryption setup`](#encryption-and-verification) ile aynı önyüklemeyi çalıştırır.

### Asgari yapılandırma

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
      password: "replace-me", // pragma: izin listesi gizli bilgisi
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### Otomatik katılım

`channels.matrix.autoJoin` varsayılan olarak `"off"` değerini kullanır: siz elle katılana kadar bot, yeni davetlerden gelen yeni odalarda veya DM'lerde görünmez. OpenClaw, davet anında bir davetin DM mi yoksa grup mu olduğunu belirleyemez; bu nedenle her davet önce `autoJoin` üzerinden geçer. `dm.policy` yalnızca daha sonra, bot katıldıktan ve oda sınıflandırıldıktan sonra uygulanır.

<Warning>
Kabul edilen davetleri kısıtlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her daveti kabul etmek için `autoJoin: "always"` kullanın.

`autoJoinAllowlist` yalnızca `!roomId:server`, `#alias:server` veya `*` kabul eder. Düz oda adları reddedilir; takma adlar, davet edilen odanın bildirdiği duruma göre değil, ana sunucuya göre çözümlenir.
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

### İzin listesi hedef biçimleri

- DM'ler (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` kullanın. Görünen adlar varsayılan olarak yok sayılır (değiştirilebilir); yalnızca açık görünen ad uyumluluğu için `dangerouslyAllowNameMatching: true` ayarlayın.
- Oda izin listesi anahtarları (`groups`, eski takma ad `rooms`): `!room:server` veya `#alias:server` kullanın. `dangerouslyAllowNameMatching: true` olmadığı sürece düz adlar yok sayılır.
- Davet izin listeleri (`autoJoinAllowlist`): `!room:server`, `#alias:server` veya `*` kullanın. Düz adlar her zaman reddedilir.

### Hesap kimliği normalleştirmesi

Sihirbaz, kolay anlaşılır bir adı normalleştirilmiş hesap kimliğine dönüştürür (`Ops Bot` -> `ops-bot`). Hesapların çakışmaması için kapsamlı ortam değişkeni adlarındaki noktalama işaretleri onaltılık olarak kaçış dizisine dönüştürülür: `-` (0x2D), `_X2D_` olur; böylece `ops-prod`, `MATRIX_OPS_X2D_PROD_` ortam önekine eşlenir.

### Önbelleğe alınmış kimlik bilgileri

Matrix, kimlik bilgilerini `~/.openclaw/credentials/matrix/` altında önbelleğe alır: varsayılan hesap için `credentials.json`, adlandırılmış hesaplar için `credentials-<account>.json`. Önbelleğe alınmış kimlik bilgileri mevcut olduğunda OpenClaw, yapılandırma dosyasında `accessToken` olmasa bile Matrix'i yapılandırılmış kabul eder; bu, kurulumu, `openclaw doctor` işlemini ve kanal durumu yoklamalarını kapsar.

### Ortam değişkenleri

Eşdeğer yapılandırma anahtarı ayarlanmadığında kullanılan, yapılandırma anahtarlarıyla desteklenen ortam değişkenleri. Varsayılan hesap öneksiz adlar kullanır; adlandırılmış hesaplar, sonekten önce hesap tokenini ekler ([normalleştirme](#account-id-normalization) bölümüne bakın).

| Varsayılan hesap       | Adlandırılmış hesap (`<ID>` = hesap tokeni) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

`ops` hesabı için adlar `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` ve benzerleri olur. `MATRIX_HOMESERVER` (ve kapsamlı herhangi bir `*_HOMESERVER` varyantı), çalışma alanındaki bir `.env` üzerinden ayarlanamaz; [Çalışma alanı `.env` dosyaları](/tr/gateway/security) bölümüne bakın.

<Note>
Kurtarma anahtarı, yapılandırmayla desteklenen bir ortam değişkeni değildir: OpenClaw bunu hiçbir zaman doğrudan ortamdan okumaz. CLI yönlendirme metni, varsayılan hesap için `MATRIX_RECOVERY_KEY` adlı bir kabuk değişkeni veya adlandırılmış bir hesap için `MATRIX_RECOVERY_KEY_<ID>` (düz büyük harfli hesap kimliği, onaltılık kaçış yok) üzerinden yönlendirilmesini önerir; [Bu cihazı bir kurtarma anahtarıyla doğrulama](#verify-this-device-with-a-recovery-key) bölümüne bakın.
</Note>

## Yapılandırma örneği

DM eşleştirmesi, oda izin listesi ve E2EE içeren pratik bir temel yapılandırma:

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
      streaming: { mode: "partial" },
    },
  },
}
```

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır. `streaming.mode`, OpenClaw'ın devam eden asistan yanıtını nasıl ilettiğini; `streaming.block.enabled` ise tamamlanan her bloğun ayrı bir Matrix iletisi olarak tutulup tutulmayacağını denetler.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

Canlı yanıt önizlemelerini koruyup ara araç/ilerleme satırlarını gizlemek için:

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

Tam yapılandırma `{ mode, chunkMode, block, preview, progress }` kabul eder:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // yapılandırılmış veya yerleşik etiketlerden seç (gizlemek için false)
          labels: ["Thinking", "Writing", "Searching"], // label: "auto" için adaylar
          maxLines: 8, // en fazla kayan ilerleme satırı (varsayılan: 8)
          maxLineChars: 120, // kesilmeden önce satır başına en fazla karakter (varsayılan: 120)
          toolProgress: true, // araç/ilerleme etkinliğini göster (varsayılan: true)
        },
      },
    },
  },
}
```

- `progress.label`: özel etiket; yapılandırılmış veya yerleşik bir etiketi seçmek için `"auto"`/ayarlanmamış, gizlemek için `false`.
- `progress.labels`: yalnızca `label`, `"auto"` olduğunda veya ayarlanmadığında kullanılan adaylar.
- `progress.maxLines`: taslakta tutulan en fazla kayan ilerleme satırı; bu sayı aşıldığında eski satırlar kırpılır.
- `progress.maxLineChars`: kesilmeden önce kompakt ilerleme satırı başına en fazla karakter.
- `progress.toolProgress`: `true` olduğunda (varsayılan), canlı araç/ilerleme etkinliği taslakta görünür.

| `streaming.mode`  | Davranış                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (varsayılan) | Tam yanıtı bekler, bir kez gönderir.                                                                                                                      |
| `"partial"`       | Model mevcut bloğu yazarken normal bir metin iletisini yerinde düzenler. Standart istemciler son düzenleme için değil, ilk önizleme için bildirim gönderebilir.          |
| `"quiet"`         | `"partial"` ile aynıdır, ancak ileti bildirim oluşturmayan bir duyurudur. Kullanıcı başına bir anlık bildirim kuralı sonlandırılmış düzenlemeyle eşleştiğinde alıcılara bir kez bildirim gönderilir (aşağıya bakın). |
| `"progress"`      | İlerleme taslağı kullanarak ayrı ayrı kompakt ilerleme satırları gönderir.                                                                                          |

`streaming.block.enabled` (varsayılan `false`), `streaming.mode` öğesinden bağımsızdır:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (varsayılan)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Mevcut blok için canlı taslak, tamamlanan bloklar ileti olarak tutulur | Mevcut blok için canlı taslak, yerinde sonlandırılır |
| `"off"`                 | Tamamlanan her blok için bildirim oluşturan bir Matrix iletisi                     | Tam yanıt için bildirim oluşturan bir Matrix iletisi      |

Notlar:

- Bir önizleme Matrix'in olay başına boyut sınırını aşarsa OpenClaw önizleme akışını durdurur ve yalnızca son iletimi kullanır.
- Medya yanıtları ekleri her zaman normal şekilde gönderir; güncelliğini yitirmiş bir önizleme güvenle yeniden kullanılamıyorsa OpenClaw son medya yanıtını göndermeden önce bunu sansürler.
- Önizleme akışı etkinken araç ilerlemesi önizleme güncellemeleri varsayılan olarak açıktır. Yanıt metni için önizleme düzenlemelerini koruyup araç ilerlemesini normal iletim yolunda bırakmak üzere `streaming.preview.toolProgress: false` ayarlayın.
- Önizleme düzenlemeleri ek Matrix API çağrılarına mal olur. En korumacı hız sınırı profili için `streaming.mode: "off"` değerini kullanmaya devam edin.
- Eski skaler/boole `streaming` değerleri ile düz `blockStreaming` / `chunkMode` anahtarları, `openclaw doctor --fix` tarafından bu iç içe şekle yeniden yazılır.

## Sesli iletiler

Gelen Matrix sesli notları, odadaki bahsetme kapısından önce yazıya dökülür; böylece `requireMention: true` odasında botun adını söyleyen bir sesli not agent'ı tetikleyebilir ve agent yalnızca ses eki yer tutucusu yerine dökümü alır.

Matrix, OpenAI `gpt-4o-mini-transcribe` gibi `tools.media.audio` altındaki paylaşılan ses medyası sağlayıcısını kullanır. Sağlayıcı kurulumu ve sınırlar için [Medya araçlarına genel bakış](/tr/tools/media-overview) bölümüne bakın.

- `m.audio` olayları ve `audio/*` MIME türüne sahip `m.file` olayları uygundur.
- Şifreli odalarda OpenClaw, dökümden önce eki mevcut Matrix medya yolu üzerinden çözer.
- Döküm, aracı isteminde makine tarafından oluşturulmuş ve güvenilmeyen olarak işaretlenir.
- Ek, sonraki medya araçlarının yeniden dökümünü yapmaması için zaten dökümü yapılmış olarak işaretlenir.
- Ses dökümünü genel olarak devre dışı bırakmak için `tools.media.audio.enabled: false` değerini ayarlayın.

## Onay meta verileri

Matrix yerel onay istemleri, `com.openclaw.approval` anahtarı altında OpenClaw'a özgü içerik bulunan normal `m.room.message` olaylarıdır. Standart istemciler metin gövdesini görüntülemeye devam eder; OpenClaw uyumlu istemciler yapılandırılmış onay kimliğini, türünü, durumunu, kararlarını ve yürütme/plugin ayrıntılarını okuyabilir.

Bir istem tek bir Matrix olayı için çok uzunsa OpenClaw, görünür metni parçalara ayırır ve `com.openclaw.approval` öğesini yalnızca ilk parçaya ekler. İzin verme/reddetme tepkileri bu ilk olaya bağlanır; böylece uzun istemler, tek olaylı istemlerle aynı onay hedefini korur.

### Sessiz sonlandırılmış önizlemeler için kendi sunucunuzdaki anlık bildirim kuralları

`streaming.mode: "quiet"`, alıcılara yalnızca bir blok veya tur sonlandırıldığında bildirim gönderir; kullanıcı başına bir anlık bildirim kuralı, sonlandırılmış önizleme işaretçisiyle eşleşmelidir. Tarifin tamamı için [sessiz önizlemelere yönelik Matrix anlık bildirim kuralları](/tr/channels/matrix-push-rules) bölümüne bakın.

## Botlar arası odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır. Aracılar arası trafiğe bilinçli olarak izin vermek için `allowBots` kullanın:

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
- `allowBots: "mentions"`, odalarda yalnızca bu bottan görünür biçimde bahsedildiğinde bu mesajları kabul eder; DM'lere ise bundan bağımsız olarak izin verilir.
- `groups.<room>.allowBots`, tek bir oda için hesap düzeyindeki ayarı geçersiz kılar.
- Kabul edilen yapılandırılmış bot mesajları, paylaşılan [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanır. `channels.defaults.botLoopProtection` değerini yapılandırın, ardından hesap başına `channels.matrix.botLoopProtection` veya oda başına `channels.matrix.groups.<room>.botLoopProtection` ile geçersiz kılın.
- OpenClaw, kendi kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yine de yok sayar.
- Matrix'te yerel bir bot bayrağı yoktur; OpenClaw, "bot tarafından yazılmış" ifadesini "bu OpenClaw Gateway'indeki yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak değerlendirir.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken katı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifreli (E2EE) odalarda, giden görüntü olayları `thumbnail_file` kullanır; böylece görüntü önizlemeleri ekin tamamıyla birlikte şifrelenir. Şifrelenmemiş odalar düz `thumbnail_url` kullanır. Yapılandırma gerekmez; plugin E2EE durumunu otomatik olarak algılar.

Tüm `openclaw matrix` komutları `--verbose` (tam tanılama), `--json` (makine tarafından okunabilir çıktı) ve `--account <id>` (çok hesaplı kurulumlar) seçeneklerini kabul eder. Çıktı varsayılan olarak özlüdür.

### Şifrelemeyi etkinleştirme

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

Gizli depolamayı ve çapraz imzalamayı başlatır, gerekirse bir oda anahtarı yedeği oluşturur, ardından durumu ve sonraki adımları yazdırır. Yararlı bayraklar:

- `--recovery-key-stdin`, kurtarma anahtarını işlem bağımsız değişkenlerinde açığa çıkarmadan stdin'den okur; `--recovery-key <key>` uyumluluk için kullanılabilir olmaya devam eder
- `--force-reset-cross-signing`, mevcut çapraz imzalama kimliğini atar ve yeni bir kimlik oluşturur (yalnızca bilinçli kullanım için)

Yeni bir hesapta E2EE'yi oluşturma sırasında etkinleştirin:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption`, `--enable-e2ee` için bir diğer addır. Eşdeğer elle yapılandırma:

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

`verify status`, birbirinden bağımsız üç güven sinyalini bildirir (`--verbose` bunların tümünü gösterir):

- `Locally trusted`: yalnızca bu istemci tarafından güvenilir
- `Cross-signing verified`: SDK, çapraz imzalama yoluyla doğrulama bildiriyor
- `Signed by owner`: kendi öz imzalama anahtarınızla imzalanmış (yalnızca tanılama amaçlı)

`Verified by owner`, yalnızca `Cross-signing verified` değeri `yes` olduğunda `yes` olur; yalnızca yerel güven veya sahip imzası yeterli değildir.

`--allow-degraded-local-state`, önce Matrix hesabını hazırlamadan azami çabayla tanılama sonuçları döndürür; çevrimdışı veya kısmen yapılandırılmış yoklamalar için kullanışlıdır.

### Bu cihazı kurtarma anahtarıyla doğrulama

Kurtarma anahtarını komut satırında geçirmek yerine stdin üzerinden iletin:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Komut üç durumu bildirir:

- `Recovery key accepted`: Matrix, gizli depolama veya cihaz güveni için anahtarı kabul etti.
- `Backup usable`: oda anahtarı yedeği, güvenilir kurtarma malzemesiyle yüklenebilir.
- `Device verified by owner`: bu cihaz, tam Matrix çapraz imzalama kimliği güvenine sahiptir.

Kurtarma anahtarı yedek malzemesinin kilidini açmış olsa bile tam kimlik güveni eksikse sıfırdan farklı bir kodla çıkar. Bu durumda, başka bir Matrix istemcisinden kendi kendine doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

`verify self`, başarıyla çıkmadan önce `Cross-signing verified: yes` durumunu bekler. Bekleme süresini ayarlamak için `--timeout-ms <ms>` kullanın.

Anahtarın doğrudan belirtildiği `openclaw matrix verify device "<recovery-key>"` biçimi de çalışır ancak anahtar kabuk geçmişine kaydedilir.

### Çapraz imzalamayı başlatma veya onarma

```bash
openclaw matrix verify bootstrap
```

Şifreli hesaplar için onarım/kurulum komutudur. Sırasıyla şunları yapar:

- mümkün olduğunda mevcut bir kurtarma anahtarını yeniden kullanarak gizli depolamayı başlatır
- çapraz imzalamayı başlatır ve eksik genel anahtarları yükler
- mevcut cihazı işaretler ve çapraz imzalar
- henüz yoksa sunucu tarafında bir oda anahtarı yedeği oluşturur

Ana sunucu, çapraz imzalama anahtarlarının yüklenmesi için UIA gerektiriyorsa OpenClaw önce kimlik doğrulaması olmadan, ardından `m.login.dummy` ve son olarak `m.login.password` yöntemini dener (`channels.matrix.password` gerektirir).

Yararlı bayraklar:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...` ile birlikte kullanın) veya `--recovery-key <key>`
- mevcut çapraz imzalama kimliğini atmak için `--force-reset-cross-signing` (yalnızca bilinçli kullanım için; etkin kurtarma anahtarının depolanmış veya `--recovery-key-stdin` ile sağlanmış olmasını gerektirir)

### Oda anahtarı yedeği

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`, sunucu tarafında bir yedeğin bulunup bulunmadığını ve bu cihazın yedeğin şifresini çözüp çözemediğini gösterir. `backup restore`, yedeklenmiş oda anahtarlarını yerel kripto deposuna aktarır; kurtarma anahtarı zaten diskteyse `--recovery-key-stdin` seçeneğini kullanmayın.

Bozuk bir yedeği yeni bir temel yedekle değiştirmek için (kurtarılamayan eski geçmişin kaybedilmesini kabul eder; mevcut yedek sırrı yüklenemiyorsa gizli depolamayı da yeniden oluşturabilir):

```bash
openclaw matrix verify backup reset --yes
```

Yalnızca önceki kurtarma anahtarının yeni yedek temelinin kilidini artık bilinçli olarak açmaması gerekiyorsa `--rotate-recovery-key` ekleyin.

### Doğrulamaları listeleme, isteme ve yanıtlama

```bash
openclaw matrix verify list
```

Seçili hesap için bekleyen doğrulama isteklerini listeler.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Bu hesaptan bir doğrulama isteği gönderir. `--own-user`, kendi kendine doğrulama ister (istemi aynı kullanıcının başka bir Matrix istemcisinde kabul edin); `--user-id`/`--device-id`/`--room-id` başka birini hedefler. `--own-user`, diğer hedefleme bayraklarıyla birlikte kullanılamaz.

Daha düşük düzeyli yaşam döngüsü işlemleri için — genellikle başka bir istemciden gelen istekleri gölgelerken — bu komutlar belirli bir istek `<id>` üzerinde işlem yapar (`verify list` ve `verify request` tarafından yazdırılır):

| Komut                                    | Amaç                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Gelen bir isteği kabul et                                           |
| `openclaw matrix verify start <id>`        | SAS akışını başlat                                                  |
| `openclaw matrix verify sas <id>`          | SAS emojisini veya ondalık sayılarını yazdır                                     |
| `openclaw matrix verify confirm-sas <id>`  | SAS'ın diğer istemcinin gösterdiğiyle eşleştiğini onayla            |
| `openclaw matrix verify mismatch-sas <id>` | Emoji veya ondalık sayılar eşleşmediğinde SAS'ı reddet              |
| `openclaw matrix verify cancel <id>`       | İptal et; isteğe bağlı `--reason <text>` ve `--code <matrix-code>` kabul eder |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` ve `cancel`; doğrulama belirli bir doğrudan mesaj odasına bağlandığında DM takip ipuçları olarak `--user-id` ve `--room-id` seçeneklerini kabul eder.

### Çok hesaplı kullanım notları

`--account <id>` olmadan Matrix CLI komutları örtük varsayılan hesabı kullanır. Birden fazla adlandırılmış hesap varken `channels.matrix.defaultAccount` belirtilmezse komutlar tahminde bulunmayı reddeder ve seçim yapmanızı ister. E2EE, adlandırılmış bir hesap için devre dışıysa veya kullanılamıyorsa hatalar o hesabın yapılandırma anahtarını belirtir; örneğin `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Başlangıç davranışı">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` olur. Başlangıçta doğrulanmamış bir cihaz, başka bir Matrix istemcisinde kendi kendine doğrulama ister; yinelenen istekleri atlar ve bir bekleme süresi uygular (varsayılan olarak 24 saat). `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca mevcut gizli depolama ve çapraz imzalama kimliğini yeniden kullanan ihtiyatlı bir kripto başlatma geçişi çalıştırır. Başlatma durumu bozuksa OpenClaw, `channels.matrix.password` olmasa bile korumalı bir onarım dener; ana sunucu parola UIA'sı gerektiriyorsa başlangıç bir uyarı kaydeder ve ölümcül olmayan durumda kalır. Zaten sahip tarafından imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix geçişi](/tr/channels/matrix-migration) bölümüne bakın.

  </Accordion>

  <Accordion title="Doğrulama bildirimleri">
    Matrix, doğrulama yaşam döngüsü bildirimlerini katı DM doğrulama odasına `m.notice` mesajları olarak gönderir: istek, hazır ("Emojiyle doğrula" yönlendirmesiyle), başlatma/tamamlama ve mevcut olduğunda SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik olarak kabul edilir. Kendi kendine doğrulama için OpenClaw, SAS akışını otomatik olarak başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar; yine de Matrix istemcinizde karşılaştırma yapıp "Eşleşiyorlar" seçeneğini onaylamanız gerekir.

    Doğrulama sistemi bildirimleri aracı sohbet işlem hattına iletilmez.

  </Accordion>

  <Accordion title="Silinmiş veya geçersiz Matrix cihazı">
    `verify status`, mevcut cihazın artık ana sunucuda listelenmediğini belirtiyorsa yeni bir OpenClaw Matrix cihazı oluşturun. Parolayla oturum açmak için:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Token kimlik doğrulaması için Matrix istemcinizde veya yönetici kullanıcı arayüzünde yeni bir erişim token'ı oluşturun, ardından OpenClaw'u güncelleyin:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Başarısız olan komuttaki hesap kimliğiyle `assistant` değerini değiştirin veya varsayılan hesap için `--account` seçeneğini kullanmayın.

  </Accordion>

  <Accordion title="Cihaz temizliği">
    OpenClaw tarafından yönetilen eski cihazlar birikebilir. Listeleyin ve eskileri temizleyin:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Şifreleme deposu">
    Matrix E2EE, IndexedDB uyumluluk katmanı olarak `fake-indexeddb` ile resmî `matrix-js-sdk` Rust şifreleme yolunu kullanır. Şifreleme durumu `crypto-idb-snapshot.json` konumunda kalıcı olarak saklanır (kısıtlayıcı dosya izinleriyle).

    Şifrelenmiş çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında bulunur ve eşitleme deposunu, şifreleme deposunu, kurtarma anahtarını, IDB anlık görüntüsünü, ileti dizisi bağlamalarını ve başlangıç doğrulama durumunu içerir. Token değiştiğinde ancak hesap kimliği aynı kaldığında OpenClaw, önceki durumun görünür kalması için mevcut en uygun kökü yeniden kullanır.

    Eski bir token karmasına ait tek bir kök, normal bir token döndürme sürekliliği yolu olabilir. OpenClaw `matrix: multiple populated token-hash storage roots detected` kaydını oluşturursa hesap dizinini inceleyin ve yalnızca seçilen etkin kökün sağlıklı olduğunu doğruladıktan sonra eski eş kökleri arşivleyin. Eski kökleri hemen silmek yerine bir `_archive/` dizinine taşımayı tercih edin.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Her iki seçeneği de tek bir çağrıda iletin. Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder; `http://`/`https://` iletildiğinde önce dosya yüklenir ve çözümlenen `mxc://` URL'si `channels.matrix.avatarUrl` içine (veya hesap bazındaki geçersiz kılma ayarına) kaydedilir.

## İleti dizileri

Matrix, hem otomatik yanıtlar hem de mesaj aracıyla yapılan gönderimler için yerel ileti dizilerini destekler. Davranışı birbirinden bağımsız iki ayar denetler:

### Oturum yönlendirme (`sessionScope`)

`dm.sessionScope`, Matrix DM odalarının OpenClaw oturumlarıyla nasıl eşleneceğini belirler:

- `"per-user"` (varsayılan): aynı yönlendirilmiş eşe sahip tüm DM odaları tek bir oturumu paylaşır.
- `"per-room"`: aynı eş için bile her Matrix DM odası kendi oturum anahtarını alır.

Açık konuşma bağlamaları her zaman `sessionScope` ayarından önceliklidir; bağlanmış odalar ve ileti dizileri seçtikleri hedef oturumu korur.

### Yanıtların ileti dizisine eklenmesi (`threadReplies`)

`threadReplies`, botun yanıtını nereye göndereceğini belirler:

- `"off"`: yanıtlar üst düzeydedir. Gelen ileti dizisi mesajları üst oturumda kalır.
- `"inbound"`: yalnızca gelen mesaj zaten bir ileti dizisindeyse o ileti dizisi içinde yanıt verilir.
- `"always"`: tetikleyici mesajın kök olduğu bir ileti dizisi içinde yanıt verilir; bu konuşma, ilk tetiklemeden itibaren eşleşen ileti dizisi kapsamlı bir oturum üzerinden yönlendirilir.

`dm.threadReplies`, yalnızca DM'ler için bunu geçersiz kılar; örneğin DM'leri düz tutarken oda ileti dizilerini yalıtılmış tutabilirsiniz.

### İleti dizisi devralma ve eğik çizgi komutları

- Gelen ileti dizisi mesajları, ileti dizisinin kök mesajını ek aracı bağlamı olarak içerir.
- Açık bir `threadId` sağlanmadığı sürece mesaj aracıyla yapılan gönderimler, aynı odayı (veya aynı DM kullanıcı hedefini) hedeflerken geçerli Matrix ileti dizisini otomatik olarak devralır.
- DM kullanıcı hedefinin yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi takdirde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve ileti dizisine bağlı `/acp spawn`, Matrix odalarında ve DM'lerde çalışır.
- Üst düzey `/focus`, `threadBindings.spawnSessions` etkinleştirildiğinde yeni bir Matrix ileti dizisi oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix ileti dizisi içinde `/focus` veya `/acp spawn --thread here` çalıştırıldığında bu ileti dizisi bulunduğu yerde bağlanır.

OpenClaw, bir Matrix DM odasının aynı paylaşılan oturumdaki başka bir DM odasıyla çakıştığını algıladığında, `/focus` kaçış yolunu gösteren ve `dm.sessionScope` değişikliği öneren tek seferlik bir `m.notice` gönderir. Bildirim yalnızca ileti dizisi bağlamaları etkinleştirildiğinde görünür.

## ACP konuşma bağlamaları

Matrix odaları, DM'ler ve mevcut Matrix ileti dizileri, sohbet yüzeyini değiştirmeden kalıcı ACP çalışma alanlarına dönüşebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek için Matrix DM'sinde, odasında veya mevcut ileti dizisinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir DM veya odada, geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir ileti dizisi içinde `--bind here`, geçerli ileti dizisini bulunduğu yerde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu bulunduğu yerde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

`--bind here` bir alt Matrix ileti dizisi oluşturmaz. `threadBindings.spawnSessions`, OpenClaw'ın bir alt ileti dizisi oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` işlemini denetler.

### İleti dizisi bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` üzerinden devralır ve kanal bazında geçersiz kılmaları destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: hem alt aracı hem de ACP ileti dizisi oluşturmalarını denetler.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: yalnızca alt aracı veya yalnızca ACP oluşturmaları için daha dar geçersiz kılmalardır.
- `threadBindings.defaultSpawnContext`

Matrix ileti dizisine bağlı oturum oluşturma varsayılan olarak açıktır. Üst düzey `/focus` ve `/acp spawn --thread auto|here` işlemlerinin Matrix ileti dizileri oluşturmasını/bağlamasını engellemek için `threadBindings.spawnSessions: false` ayarını kullanın. Yerel alt aracı ileti dizisi oluşturmalarının üst dökümü çatallamaması gerekiyorsa `threadBindings.defaultSpawnContext: "isolated"` ayarını kullanın.

## Tepkiler

Matrix; giden tepkileri, gelen tepki bildirimlerini ve alındı tepkilerini destekler.

Giden tepki araçları `channels.matrix.actions.reactions` tarafından denetlenir:

- `react`, bir Matrix olayına tepki ekler.
- `reactions`, bir Matrix olayı için geçerli tepki özetini listeler.
- `emoji=""`, botun bu olaydaki kendi tepkilerini kaldırır.
- `remove: true`, bottan yalnızca belirtilen emoji tepkisini kaldırır.

**Çözümleme sırası** (tanımlanan ilk değer kullanılır):

| Ayar                 | Sıra                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | hesap bazında -> kanal -> `messages.ackReaction` -> aracı kimliği emojisi yedeği   |
| `ackReactionScope`      | hesap bazında -> kanal -> `messages.ackReactionScope` -> varsayılan `"group-mentions"` |
| `reactionNotifications` | hesap bazında -> kanal -> varsayılan `"own"`                                           |

`reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedefleyen eklenmiş `m.reaction` olaylarını iletir; `"off"`, tepki sistem olaylarını devre dışı bırakır. Tepki kaldırmaları sistem olaylarına dönüştürülmez; Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak sunar.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir oda mesajı aracıyı tetiklediğinde kaç yeni oda mesajının `InboundHistory` olarak ekleneceğini denetler. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmamışsa etkin varsayılan `0` olur (devre dışı).
- Matrix oda geçmişi yalnızca odaya aittir; DM'ler normal oturum geçmişini kullanmaya devam eder.
- Oda geçmişi yalnızca bekleyen mesajlardan oluşur: OpenClaw henüz bir yanıt tetiklememiş oda mesajlarını arabelleğe alır, ardından bir bahsetme veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine eklenmez; o tur için ana gelen gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına doğru ilerlemek yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix, getirilen yanıt metni, ileti dizisi kökleri ve bekleyen geçmiş gibi ek oda bağlamları için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı biçimde korunur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı izin listesi denetimlerince izin verilen göndericilerle sınırlar.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır ancak yine de açıkça alıntılanmış tek bir yanıtı korur.

Bu yalnızca ek bağlamın görünürlüğünü etkiler; gelen mesajın kendisinin bir yanıt tetikleyip tetikleyemeyeceğini etkilemez. Tetikleme yetkilendirmesi yine `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilkesi ayarlarından gelir.

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

Odaları çalışır durumda tutarken DM'leri tamamen susturmak için `dm.enabled: false` ayarını kullanın:

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

Bahsetme denetimi ve izin listesi davranışı için [Gruplar](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce mesaj göndermeyi sürdürürse OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni bir kod üretmek yerine kısa bir bekleme süresinin ardından hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Eşleştirme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu kayarsa OpenClaw, canlı DM yerine eski tek kişilik odaları gösteren güncelliğini yitirmiş `m.direct` eşlemelerine sahip olabilir. Bir eş için geçerli eşlemeyi inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Her iki komut da çok hesaplı kurulumlar için `--account <id>` seçeneğini kabul eder. Onarım akışı:

- `m.direct` içinde zaten eşlenmiş olan katı bir 1:1 DM'yi tercih eder
- bu kullanıcıyla katılımın sürdüğü herhangi bir katı 1:1 DM'ye geri döner
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Eski odaları otomatik olarak silmez. Sağlıklı DM'yi seçer ve gelecekteki Matrix gönderimlerinin, doğrulama bildirimlerinin ve diğer doğrudan mesaj akışlarının doğru odayı hedeflemesi için eşlemeyi günceller.

## Yürütme onayları

Matrix, yerel bir onay istemcisi olarak çalışabilir. `channels.matrix.execApprovals` altında (veya hesap bazında geçersiz kılma için `channels.matrix.accounts.<account>.execApprovals` altında) yapılandırın:

- `enabled`: onayları Matrix'e özgü istemler aracılığıyla iletir. Ayarlanmamışsa veya `"auto"` ise en az bir onaylayıcı çözümlenebildiğinde otomatik olarak etkinleşir; açıkça devre dışı bırakmak için `false` olarak ayarlayın.
- `approvers`: yürütme isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (`@owner:example.org`). `channels.matrix.dm.allowFrom` değerine geri döner.
- `target`: istemlerin nereye gönderileceği. `"dm"` (varsayılan), onaylayıcıların DM'lerine gönderir; `"channel"`, kaynak odaya veya DM'ye gönderir; `"both"`, her ikisine de gönderir.
- `agentFilter` / `sessionFilter`: hangi aracıların/oturumların Matrix iletimini tetikleyeceğine ilişkin isteğe bağlı izin listeleri.

Yetkilendirme, onay türleri arasında biraz farklılık gösterir:

- **Yürütme onayları**, `execApprovals.approvers` değerini kullanır ve `dm.allowFrom` değerine geri döner.
- **Plugin onayları**, yalnızca `dm.allowFrom` üzerinden yetkilendirilir.

Her iki tür de Matrix tepki kısayollarını ve mesaj güncellemelerini paylaşır. Onaylayanlar, birincil onay mesajında tepki kısayollarını görür:

- ✅ bir kez izin ver
- ❌ reddet
- ♾️ her zaman izin ver (etkin exec politikası buna izin verdiğinde)

Yedek eğik çizgi komutları: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayanlar onaylayabilir veya reddedebilir. Exec onaylarının kanal üzerinden teslimi komut metnini içerir; `channel` veya `both` seçeneğini yalnızca güvenilir odalarda etkinleştirin.

İlgili: [Exec onayları](/tr/tools/exec-approvals).

## Eğik çizgi komutları

Eğik çizgi komutları (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` vb.) doğrudan DM'lerde çalışır. OpenClaw, odalarda botun kendi Matrix bahsetmesiyle başlayan komutları da tanır; bu nedenle `@bot:server /new`, özel bir bahsetme düzenli ifadesi olmadan komut yolunu tetikler. Böylece bot, kullanıcı komutu yazmadan önce sekme tamamlamayla botu seçtiğinde Element ve benzeri istemcilerin oluşturduğu oda tarzı `@mention /command` gönderilerine yanıt vermeye devam eder.

Yetkilendirme kuralları geçerliliğini korur: komut gönderenler, düz mesajlarla aynı DM veya oda izin listesi/sahip politikalarını karşılamalıdır.

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

- Üst düzey `channels.matrix` değerleri, bir hesap bunları geçersiz kılmadığı sürece adlandırılmış hesaplar için varsayılan olarak kullanılır.
- Devralınan bir oda girdisini `groups.<room>.account` ile belirli bir hesapla sınırlandırın. `account` içermeyen girdiler hesaplar arasında paylaşılır; varsayılan hesap üst düzeyde yapılandırıldığında `account: "default"` çalışmaya devam eder.

**Varsayılan hesap seçimi:**

- Örtük yönlendirme, yoklama ve CLI komutlarının tercih edeceği adlandırılmış hesabı seçmek için `defaultAccount` değerini ayarlayın.
- Birden fazla hesabınız varsa ve bunlardan birinin adı tam olarak `default` ise OpenClaw, `defaultAccount` ayarlanmamış olsa bile onu örtük olarak kullanır.
- Birden fazla adlandırılmış hesap varken varsayılan seçilmemişse CLI komutları tahminde bulunmayı reddeder; `defaultAccount` değerini ayarlayın veya `--account <id>` geçirin.
- Üst düzey `channels.matrix.*` bloğu, yalnızca kimlik doğrulaması tamamlandığında (`homeserver` + `accessToken` veya `homeserver` + `userId` + `password`) örtük `default` hesabı olarak değerlendirilir. Önbelleğe alınmış kimlik bilgileri kimlik doğrulamasını kapsadığında, adlandırılmış hesaplar `homeserver` + `userId` üzerinden keşfedilebilir olmaya devam eder.

**Yükseltme:**

- OpenClaw, onarım veya kurulum sırasında tek hesaplı bir yapılandırmayı çoklu hesaba yükselttiğinde, mevcut bir adlandırılmış hesap varsa ya da `defaultAccount` zaten bir hesabı gösteriyorsa bu hesabı korur. Yalnızca Matrix kimlik doğrulama/önyükleme anahtarları yükseltilen hesaba taşınır; paylaşılan teslimat politikası anahtarları üst düzeyde kalır.

Paylaşılan çoklu hesap kalıbı için [Yapılandırma referansı](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN homeserver'ları

OpenClaw, siz hesap bazında izin vermediğiniz sürece SSRF koruması amacıyla özel/dahili Matrix homeserver'larını varsayılan olarak engeller.

Homeserver'ınız localhost, bir LAN/Tailscale IP'si veya dahili bir ana bilgisayar adında çalışıyorsa söz konusu hesap için `network.dangerouslyAllowPrivateNetwork` seçeneğini etkinleştirin:

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

Bu isteğe bağlı izin yalnızca güvenilir özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi genel ve şifrelenmemiş homeserver'lar engellenmeye devam eder. Mümkün olduğunda `https://` tercih edin.

## Matrix trafiğine proxy uygulama

Matrix dağıtımınız açıkça belirtilmiş bir giden HTTP(S) proxy'si gerektiriyorsa `channels.matrix.proxy` değerini ayarlayın:

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

Matrix, OpenClaw'ın oda veya kullanıcı hedefi istediği her yerde şu hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. Açık teslimat hedeflerini, cron işlerini, bağlamaları veya izin listelerini yapılandırırken Matrix'teki oda kimliğinin büyük/küçük harf kullanımını aynen kullanın. OpenClaw, depolama için dahili oturum anahtarlarını standart biçimde tutar; dolayısıyla bu küçük harfli anahtarlar Matrix teslimat kimlikleri için güvenilir bir kaynak değildir.

Canlı dizin araması, oturum açılmış Matrix hesabını kullanır:

- Kullanıcı aramaları, söz konusu homeserver'daki Matrix kullanıcı dizinini sorgular.
- Oda aramaları, açık oda kimliklerini ve takma adları doğrudan kabul eder. Katılınmış oda adı araması en iyi çaba esasına dayanır ve yalnızca `dangerouslyAllowNameMatching: true` ayarlandığında çalışma zamanı oda izin listelerine uygulanır.
- Bir oda adı bir kimliğe veya takma ada çözümlenemiyorsa çalışma zamanı izin listesi çözümlemesinde yok sayılır.

## Yapılandırma referansı

İzin listesi tarzındaki kullanıcı alanları (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) tam Matrix kullanıcı kimliklerini kabul eder (en güvenlisi). Kimlik olmayan girdiler varsayılan olarak yok sayılır. `dangerouslyAllowNameMatching: true` ayarlanırsa tam eşleşen Matrix dizini görünen adları başlangıçta ve izleyici çalışırken izin listesi her değiştiğinde çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır.

Oda izin listesi anahtarları (`groups`, eski `rooms`) oda kimlikleri veya takma adlar olmalıdır. Düz oda adı anahtarları varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true`, katılınmış oda adları üzerinde en iyi çaba esaslı aramayı geri getirir.

### Hesap ve bağlantı

- `enabled`: kanalı etkinleştirir veya devre dışı bırakır.
- `name`: hesap için isteğe bağlı görünen etiket.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `accounts`: hesap başına adlandırılmış geçersiz kılmalar. Üst düzey `channels.matrix` değerleri varsayılan olarak devralınır.
- `homeserver`: homeserver URL'si; örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu hesabın `localhost`, LAN/Tailscale IP'lerine veya dahili ana bilgisayar adlarına bağlanmasına izin verir.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Hesap başına geçersiz kılma desteklenir.
- `userId`: tam Matrix kullanıcı kimliği (`@bot:example.org`).
- `accessToken`: token tabanlı kimlik doğrulaması için erişim token'ı. Ortam/dosya/exec sağlayıcılarında düz metin ve SecretRef değerleri desteklenir ([Gizli Bilgi Yönetimi](/tr/gateway/secrets)).
- `password`: parola tabanlı oturum açma için parola. Düz metin ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parolayla oturum açma sırasında kullanılan cihaz görünen adı.
- `avatarUrl`: profil eşitlemesi ve `profile set` güncellemeleri için depolanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında getirilen azami olay sayısı.

### Şifreleme

- `encryption`: E2EE'yi etkinleştirir. Varsayılan: `false`.
- `startupVerification`: `"if-unverified"` (E2EE açıkken varsayılan) veya `"off"`. Bu cihaz doğrulanmamışsa başlangıçta öz doğrulamayı otomatik olarak ister.
- `startupVerificationCooldownHours`: sonraki otomatik başlangıç isteğinden önceki bekleme süresi. Varsayılan: `24`.

### Erişim ve politika

- `groupPolicy`: `"open"`, `"allowlist"` veya `"disabled"`. Varsayılan: `"allowlist"`.
- `groupAllowFrom`: oda trafiği için kullanıcı kimlikleri izin listesi.
- `mentionPatterns`: oda bahsetmeleri için kapsamlandırılmış düzenli ifade kalıpları. `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }` içeren nesne. Yapılandırılmış `agents.list[].groupChat.mentionPatterns` değerlerinin oda bazında uygulanıp uygulanmayacağını denetler.
- `dm.enabled`: `false` olduğunda tüm DM'leri yok sayar. Varsayılan: `true`.
- `dm.policy`: `"pairing"` (varsayılan), `"allowlist"`, `"open"` veya `"disabled"`. Bot katıldıktan ve odayı DM olarak sınıflandırdıktan sonra uygulanır; davet işlemeyi etkilemez.
- `dm.allowFrom`: DM trafiği için kullanıcı kimlikleri izin listesi.
- `dm.sessionScope`: `"per-user"` (varsayılan) veya `"per-room"`.
- `dm.threadReplies`: yanıt iş parçacığı kullanımı için yalnızca DM'ye özgü geçersiz kılma (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: yapılandırılmış diğer Matrix bot hesaplarından gelen mesajları kabul eder (`true` veya `"mentions"`).
- `allowlistOnly`: `true` olduğunda tüm etkin DM politikalarını (`"disabled"` hariç) ve `"open"` grup politikalarını `"allowlist"` değerine zorlar. `"disabled"` politikalarını değiştirmez.
- `dangerouslyAllowNameMatching`: `true` olduğunda kullanıcı izin listesi girdileri için Matrix görünen ad dizini aramasına ve oda izin listesi anahtarları için katılınmış oda adı aramasına izin verir. Tam `@user:server` kimliklerini ve oda kimliklerini veya takma adlarını tercih edin.
- `autoJoin`: `"always"`, `"allowlist"` veya `"off"`. Varsayılan: `"off"`. DM tarzı davetler dâhil her Matrix davetine uygulanır.
- `autoJoinAllowlist`: `autoJoin`, `"allowlist"` olduğunda izin verilen odalar/takma adlar. Takma ad girdileri, davet edilen odanın bildirdiği duruma göre değil, homeserver'a göre çözümlenir.
- `contextVisibility`: ek bağlam görünürlüğü (`"all"` varsayılan, `"allowlist"`, `"allowlist_quote"`).

### Yanıt davranışı

- `replyToMode`: `"off"` (varsayılan), `"first"`, `"all"` veya `"batched"`.
- `threadReplies`: `"off"` (açıkça ayarlanmadığı sürece üst düzey varsayılan `"inbound"` olarak çözümlenir), `"inbound"` veya `"always"`.
- `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal bazında geçersiz kılmalar.
- `streaming`: iç içe nesne `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode`; `"off"` (varsayılan), `"partial"`, `"quiet"` veya `"progress"` değerlerinden biridir. Eski skaler/boole yazımları `openclaw doctor --fix` aracılığıyla taşınır.
- `streaming.block.enabled`: `true` olduğunda, tamamlanan asistan blokları ayrı ilerleme mesajları olarak tutulur. Varsayılan: `false`.
- `markdown`: giden metin için isteğe bağlı Markdown oluşturma yapılandırması.
- `responsePrefix`: giden yanıtların başına eklenen isteğe bağlı dize.
- `textChunkLimit`: `streaming.chunkMode: "length"` olduğunda giden parçaların karakter cinsinden boyutu. Varsayılan: `4000`.
- `streaming.chunkMode`: `"length"` (varsayılan, karakter sayısına göre böler) veya `"newline"` (satır sınırlarında böler).
- `historyLimit`: bir oda mesajı ajanı tetiklediğinde `InboundHistory` olarak dahil edilen son oda mesajlarının sayısı. `messages.groupChat.historyLimit` değerine geri döner; etkin varsayılan `0` (devre dışı).
- `mediaMaxMb`: giden gönderimler ve gelen işleme için MB cinsinden medya boyutu sınırı. Varsayılan: `20`.

### Tepki ayarları

- `ackReaction`: bu kanal/hesap için alındı tepkisi geçersiz kılması.
- `ackReactionScope`: kapsam geçersiz kılması (`"group-mentions"` varsayılan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: gelen tepki bildirim modu (`"own"` varsayılan, `"off"`).

### Araçlar ve oda bazında geçersiz kılmalar

- `actions`: eylem bazında araç erişimi denetimi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: oda bazında politika eşlemesi. Oturum kimliği, çözümlemeden sonra kararlı oda kimliğini kullanır. (`rooms` eski bir diğer addır.)
  - `groups.<room>.account`: devralınan bir oda girdisini belirli bir hesapla sınırlar.
  - `groups.<room>.enabled`: oda bazında açma/kapama ayarı. `false` olduğunda oda, eşlemede yokmuş gibi yoksayılır.
  - `groups.<room>.requireMention`: kanal düzeyindeki bahsetme gereksiniminin oda bazında geçersiz kılınması.
  - `groups.<room>.allowBots`: kanal düzeyindeki ayarın oda bazında geçersiz kılınması (`true` veya `"mentions"`).
  - `groups.<room>.botLoopProtection`: botlar arası döngü koruma bütçesinin oda bazında geçersiz kılınması.
  - `groups.<room>.users`: oda bazında gönderici izin listesi.
  - `groups.<room>.tools`: oda bazında araç izin/ret geçersiz kılmaları.
  - `groups.<room>.autoReply`: oda bazında bahsetme koşulu geçersiz kılması. `true`, o oda için bahsetme gereksinimlerini devre dışı bırakır; `false` bunları yeniden zorunlu kılar.
  - `groups.<room>.skills`: oda bazında beceri filtresi.
  - `groups.<room>.systemPrompt`: oda bazında sistem istemi parçası.

### Yürütme onayı ayarları

- `execApprovals.enabled`: yürütme onaylarını Matrix'e özgü istemler aracılığıyla iletir.
- `execApprovals.approvers`: onay vermesine izin verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` değerine geri döner.
- `execApprovals.target`: `"dm"` (varsayılan), `"channel"` veya `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: iletim için isteğe bağlı ajan/oturum izin listeleri.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme koşulu
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
