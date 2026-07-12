---
read_when:
    - OpenClaw'da Matrix'i ayarlama
    - Matrix E2EE ve doğrulamayı yapılandırma
summary: Matrix destek durumu, kurulumu ve yapılandırma örnekleri
title: Matris
x-i18n:
    generated_at: "2026-07-12T11:29:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, resmi `matrix-js-sdk` üzerine kurulu, indirilebilir bir kanal pluginidir (`@openclaw/matrix`). DM'leri, odaları, ileti dizilerini, medyayı, tepkileri, anketleri, konumu ve E2EE'yi destekler.

## Kurulum

```bash
openclaw plugins install @openclaw/matrix
```

Yalın plugin belirtimleri önce ClawHub'ı, ardından yedek olarak npm'i dener. `openclaw plugins install clawhub:@openclaw/matrix` veya `npm:@openclaw/matrix` ile bir kaynağı zorunlu kılın. Yerel bir çalışma kopyasından: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install`, plugini kaydeder ve etkinleştirir; ayrıca bir `enable` adımı gerekmez. Kanal, aşağıda yapılandırılana kadar yine de hiçbir şey yapmaz. Genel kurulum kuralları için [Pluginler](/tr/tools/plugin) bölümüne bakın.

## Ayarlama

1. Ana sunucunuzda bir Matrix hesabı oluşturun.
2. `channels.matrix` ayarını `homeserver` + `accessToken` veya `homeserver` + `userId` + `password` ile yapılandırın.
3. Gateway'i yeniden başlatın.
4. Botla bir DM başlatın veya botu bir odaya davet edin. Yeni davetler yalnızca [`autoJoin`](#auto-join) izin verdiğinde kabul edilir.

### Etkileşimli ayarlama

```bash
openclaw channels add
openclaw configure --section channels
```

Sihirbaz; ana sunucu URL'sini, kimlik doğrulama yöntemini (belirteç veya parola), kullanıcı kimliğini (yalnızca parolayla kimlik doğrulamada), isteğe bağlı cihaz adını, E2EE'nin etkinleştirilip etkinleştirilmeyeceğini ve oda erişimi/otomatik katılım ayarlarını sorar. Eşleşen `MATRIX_*` ortam değişkenleri zaten varsa ve hesabın kayıtlı kimlik doğrulama bilgileri yoksa sihirbaz, ortam değişkeni kısayolu sunar. `openclaw channels resolve --channel matrix "Project Room"` komutuyla izin listesini kaydetmeden önce oda adlarını çözümleyin. Sihirbazda E2EE'yi etkinleştirmek, [`openclaw matrix encryption setup`](#encryption-and-verification) ile aynı önyüklemeyi çalıştırır.

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

Parola tabanlı (belirteç, ilk oturum açmadan sonra önbelleğe alınır):

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

`channels.matrix.autoJoin` varsayılan olarak `"off"` değerindedir: Siz elle katılana kadar bot, yeni davetlerden gelen yeni odalarda veya DM'lerde görünmez. OpenClaw, davet sırasında bir davetin DM mi yoksa grup mu olduğunu anlayamaz; bu nedenle her davet önce `autoJoin` işleminden geçer. `dm.policy` yalnızca daha sonra, bot katıldıktan ve oda sınıflandırıldıktan sonra uygulanır.

<Warning>
Kabul edilen davetleri kısıtlamak için `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` ayarlayın veya her daveti kabul etmek için `autoJoin: "always"` kullanın.

`autoJoinAllowlist` yalnızca `!roomId:server`, `#alias:server` veya `*` kabul eder. Düz oda adları reddedilir; takma adlar, davet edilen odanın iddia ettiği duruma göre değil, ana sunucuya göre çözümlenir.
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

- DM'ler (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` kullanın. Görünen adlar varsayılan olarak yok sayılır (değiştirilebilir oldukları için); yalnızca görünen adlarla açık uyumluluk gerektiğinde `dangerouslyAllowNameMatching: true` ayarını kullanın.
- Oda izin listesi anahtarları (`groups`, eski takma ad `rooms`): `!room:server` veya `#alias:server` kullanın. `dangerouslyAllowNameMatching: true` olmadığı sürece düz adlar yok sayılır.
- Davet izin listeleri (`autoJoinAllowlist`): `!room:server`, `#alias:server` veya `*` kullanın. Düz adlar her zaman reddedilir.

### Hesap kimliği normalleştirmesi

Sihirbaz, anlaşılır bir adı normalleştirilmiş hesap kimliğine dönüştürür (`Ops Bot` -> `ops-bot`). Hesapların çakışmasını önlemek için kapsamlı ortam değişkeni adlarında noktalama işaretleri onaltılık olarak kaçışlanır: `-` (0x2D), `_X2D_` olur; böylece `ops-prod`, `MATRIX_OPS_X2D_PROD_` ortam önekiyle eşlenir.

### Önbelleğe alınmış kimlik bilgileri

Matrix, kimlik bilgilerini `~/.openclaw/credentials/matrix/` altında önbelleğe alır: varsayılan hesap için `credentials.json`, adlandırılmış hesaplar için `credentials-<account>.json`. Önbelleğe alınmış kimlik bilgileri bulunduğunda OpenClaw, yapılandırma dosyasında `accessToken` olmasa bile Matrix'i yapılandırılmış kabul eder; bu durum ayarlamayı, `openclaw doctor` komutunu ve kanal durum yoklamalarını kapsar.

### Ortam değişkenleri

Eşdeğer yapılandırma anahtarı ayarlanmamışken kullanılan, yapılandırma anahtarı destekli ortam değişkenleri. Varsayılan hesap öneksiz adları kullanır; adlandırılmış hesaplar, son ekten önce hesap belirtecini ekler ([normalleştirme](#account-id-normalization) bölümüne bakın).

| Varsayılan hesap       | Adlandırılmış hesap (`<ID>` = hesap belirteci) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

`ops` hesabı için adlar `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` ve benzeri olur. `MATRIX_HOMESERVER` (ve `*_HOMESERVER` biçimindeki tüm kapsamlı türevleri) çalışma alanındaki bir `.env` dosyasından ayarlanamaz; [Çalışma alanı `.env` dosyaları](/tr/gateway/security) bölümüne bakın.

<Note>
Kurtarma anahtarı, yapılandırma destekli bir ortam değişkeni değildir: OpenClaw bunu hiçbir zaman doğrudan ortamdan okumaz. CLI yönlendirme metni, varsayılan hesap için anahtarın `MATRIX_RECOVERY_KEY` adlı bir kabuk değişkeni üzerinden; adlandırılmış hesap içinse `MATRIX_RECOVERY_KEY_<ID>` (düz, büyük harfe dönüştürülmüş hesap kimliği; onaltılık kaçış yoktur) üzerinden aktarılmasını önerir. [Bu cihazı bir kurtarma anahtarıyla doğrulama](#verify-this-device-with-a-recovery-key) bölümüne bakın.
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
      streaming: "partial",
    },
  },
}
```

## Akış önizlemeleri

Matrix yanıt akışı isteğe bağlıdır. `streaming`, OpenClaw'ın oluşturulmakta olan asistan yanıtını nasıl ileteceğini; `blockStreaming` ise tamamlanan her bloğun ayrı bir Matrix mesajı olarak tutulup tutulmayacağını denetler.

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
          label: "auto", // yapılandırılmış veya yerleşik etiketlerden seç (gizlemek için false)
          labels: ["Thinking", "Writing", "Searching"], // label: "auto" için adaylar
          maxLines: 8, // en fazla döngüsel ilerleme satırı (varsayılan: 8)
          maxLineChars: 120, // kısaltmadan önce satır başına en fazla karakter (varsayılan: 120)
          toolProgress: true, // araç/ilerleme etkinliğini göster (varsayılan: true)
        },
      },
    },
  },
}
```

- `progress.label`: özel etiket; yapılandırılmış veya yerleşik bir etiket seçmek için `"auto"`/ayarlanmamış değer ya da gizlemek için `false`.
- `progress.labels`: yalnızca `label`, `"auto"` olduğunda veya ayarlanmadığında kullanılan adaylar.
- `progress.maxLines`: taslakta tutulan en fazla döngüsel ilerleme satırı; bu sınırı aşan eski satırlar kırpılır.
- `progress.maxLineChars`: kısaltmadan önce her kompakt ilerleme satırındaki en fazla karakter sayısı.
- `progress.toolProgress`: `true` olduğunda (varsayılan), canlı araç/ilerleme etkinliği taslakta görünür.

| `streaming`       | Davranış                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (varsayılan) | Tam yanıtı bekler, tek seferde gönderir. `true` <-> `"partial"`, `false` <-> `"off"`.                                                                         |
| `"partial"`       | Model geçerli bloğu yazarken normal bir metin mesajını yerinde düzenler. Standart istemciler son düzenlemede değil, ilk önizlemede bildirim gönderebilir.          |
| `"quiet"`         | `"partial"` ile aynıdır, ancak mesaj bildirim oluşturmayan bir duyurudur. Kullanıcı başına bir anlık bildirim kuralı, sonlandırılmış düzenlemeyle eşleştiğinde alıcılara bir kez bildirim gönderilir (aşağıya bakın). |
| `"progress"`      | Bir ilerleme taslağı kullanarak tek tek kompakt ilerleme satırları gönderir.                                                                                          |

`blockStreaming` (varsayılan `false`), `streaming` ayarından bağımsızdır:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (varsayılan)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Geçerli blok için canlı taslak; tamamlanan bloklar mesaj olarak tutulur | Geçerli blok için canlı taslak; yerinde sonlandırılır |
| `"off"`                 | Tamamlanan her blok için bildirim oluşturan bir Matrix mesajı                     | Tam yanıt için bildirim oluşturan tek bir Matrix mesajı      |

Notlar:

- Bir önizleme Matrix'in etkinlik başına boyut sınırını aşarsa OpenClaw, önizleme akışını durdurur ve yalnızca son yanıtı iletmeye geri döner.
- Medya yanıtları ekleri her zaman normal biçimde gönderir; eski bir önizleme güvenle yeniden kullanılamıyorsa OpenClaw, son medya yanıtını göndermeden önce onu sansürler.
- Önizleme akışı etkinken araç ilerlemesi önizleme güncellemeleri varsayılan olarak açıktır. Yanıt metni için önizleme düzenlemelerini koruyup araç ilerlemesini normal iletim yolunda bırakmak için `streaming.preview.toolProgress: false` ayarını kullanın.
- Önizleme düzenlemeleri ek Matrix API çağrılarına neden olur. En ihtiyatlı hız sınırı profili için `streaming: "off"` kullanın.

## Sesli mesajlar

Gelen Matrix sesli notları, odadaki bahsetme denetiminden önce metne dönüştürülür. Böylece botun adını söyleyen bir sesli not, `requireMention: true` ayarlı bir odada aracıyı tetikleyebilir ve aracı yalnızca ses eki yer tutucusu yerine dökümü alır.

Matrix, `tools.media.audio` altındaki ortak ses medyası sağlayıcısını kullanır; örneğin OpenAI `gpt-4o-mini-transcribe`. Sağlayıcı ayarları ve sınırlar için [Medya araçlarına genel bakış](/tr/tools/media-overview) bölümüne bakın.

- `m.audio` etkinlikleri ve `audio/*` MIME türüne sahip `m.file` etkinlikleri uygundur.
- Şifrelenmiş odalarda OpenClaw, metne dönüştürmeden önce eki mevcut Matrix medya yolu üzerinden çözer.
- Döküm, aracı isteminde makine tarafından oluşturulmuş ve güvenilmeyen içerik olarak işaretlenir.
- Ek, aşağı akış medya araçlarının yeniden metne dönüştürmemesi için zaten dönüştürülmüş olarak işaretlenir.
- Sesli içeriğin metne dönüştürülmesini genel olarak devre dışı bırakmak için `tools.media.audio.enabled: false` ayarını kullanın.

## Onay meta verileri

Matrix'in yerel onay istemleri, `com.openclaw.approval` anahtarı altında OpenClaw'a özgü içerik barındıran normal `m.room.message` etkinlikleridir. Standart istemciler metin gövdesini yine işler; OpenClaw destekli istemciler yapılandırılmış onay kimliğini, türünü, durumunu, kararlarını ve yürütme/plugin ayrıntılarını okuyabilir.

Bir istem tek bir Matrix etkinliği için fazla uzunsa OpenClaw, görünen metni parçalara böler ve `com.openclaw.approval` verisini yalnızca ilk parçaya ekler. İzin verme/reddetme tepkileri bu ilk etkinliğe bağlanır; böylece uzun istemler, tek etkinlikli istemlerle aynı onay hedefini korur.

### Sessiz, sonlandırılmış önizlemeler için kendi barındırdığınız push kuralları

`streaming: "quiet"`, alıcılara yalnızca bir blok veya tur sonlandırıldığında bildirim gönderir; kullanıcı başına bir push kuralının sonlandırılmış önizleme işaretçisiyle eşleşmesi gerekir. Tarifin tamamı için [sessiz önizlemelere yönelik Matrix push kuralları](/tr/channels/matrix-push-rules) bölümüne bakın.

## Botlar arası odalar

Varsayılan olarak, yapılandırılmış diğer OpenClaw Matrix hesaplarından gelen Matrix mesajları yok sayılır. Ajanlar arası trafiğe bilinçli olarak izin vermek için `allowBots` kullanın:

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
- `allowBots: "mentions"`, bu mesajları odalarda yalnızca görünür biçimde bu bottan bahsettiklerinde kabul eder; DM'lere ise bundan bağımsız olarak izin verilir.
- `groups.<room>.allowBots`, tek bir oda için hesap düzeyindeki ayarı geçersiz kılar.
- Kabul edilen yapılandırılmış bot mesajları, ortak [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanır. `channels.defaults.botLoopProtection` ayarını yapılandırın, ardından hesap başına `channels.matrix.botLoopProtection` veya oda başına `channels.matrix.groups.<room>.botLoopProtection` ile geçersiz kılın.
- OpenClaw, kendi kendine yanıt döngülerini önlemek için aynı Matrix kullanıcı kimliğinden gelen mesajları yok saymaya devam eder.
- Matrix'in yerleşik bir bot bayrağı yoktur; OpenClaw, "bot tarafından yazılmış" ifadesini "bu OpenClaw Gateway üzerindeki yapılandırılmış başka bir Matrix hesabı tarafından gönderilmiş" olarak değerlendirir.

Paylaşılan odalarda botlar arası trafiği etkinleştirirken katı oda izin listeleri ve bahsetme gereksinimleri kullanın.

## Şifreleme ve doğrulama

Şifrelenmiş (E2EE) odalarda, giden görsel olayları `thumbnail_file` kullanır; böylece görsel önizlemeleri tam ekle birlikte şifrelenir. Şifrelenmemiş odalarda düz `thumbnail_url` kullanılır. Yapılandırma gerekmez; Plugin, E2EE durumunu otomatik olarak algılar.

Tüm `openclaw matrix` komutları `--verbose` (tam tanılama), `--json` (makine tarafından okunabilir çıktı) ve `--account <id>` (çok hesaplı kurulumlar) seçeneklerini kabul eder. Çıktı varsayılan olarak özlüdür.

### Şifrelemeyi etkinleştirme

```bash
openclaw matrix encryption setup
```

Gizli depolamayı ve çapraz imzalamayı başlatır, gerekirse bir oda anahtarı yedeği oluşturur, ardından durumu ve sonraki adımları yazdırır. Yararlı bayraklar:

- `--recovery-key <key>` başlatmadan önce bir kurtarma anahtarı uygular (aşağıdaki standart girdi biçimini tercih edin)
- `--force-reset-cross-signing` mevcut çapraz imzalama kimliğini atar ve yeni bir kimlik oluşturur (yalnızca bilinçli kullanım için)

Yeni bir hesapta E2EE'yi hesap oluşturulurken etkinleştirin:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption`, `--enable-e2ee` için bir diğer addır. Eşdeğer manuel yapılandırma:

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

- `Locally trusted`: yalnızca bu istemci tarafından güvenilir kabul edilir
- `Cross-signing verified`: SDK, çapraz imzalama aracılığıyla doğrulama yapıldığını bildirir
- `Signed by owner`: kendi kendine imzalama anahtarınız tarafından imzalanmıştır (yalnızca tanılama amaçlıdır)

`Verified by owner`, yalnızca `Cross-signing verified` değeri `yes` olduğunda `yes` olur; yalnızca yerel güven veya sahip imzası yeterli değildir.

`--allow-degraded-local-state`, önce Matrix hesabını hazırlamadan mümkün olan en iyi tanılama sonuçlarını döndürür; çevrimdışı veya kısmen yapılandırılmış incelemeler için kullanışlıdır.

### Bu cihazı kurtarma anahtarıyla doğrulama

Kurtarma anahtarını komut satırında geçirmek yerine standart girdi üzerinden aktarın:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Komut üç durumu bildirir:

- `Recovery key accepted`: Matrix, gizli depolama veya cihaz güveni için anahtarı kabul etti.
- `Backup usable`: oda anahtarı yedeği, güvenilir kurtarma materyaliyle yüklenebilir.
- `Device verified by owner`: bu cihaz, Matrix çapraz imzalama kimliğinin tam güvenine sahiptir.

Kurtarma anahtarı yedek materyalinin kilidini açmış olsa bile tam kimlik güveni tamamlanmadığında komut sıfırdan farklı bir kodla çıkar. Bu durumda, başka bir Matrix istemcisinden kendi kendine doğrulamayı tamamlayın:

```bash
openclaw matrix verify self
```

`verify self`, başarıyla çıkmadan önce `Cross-signing verified: yes` durumunu bekler. Bekleme süresini ayarlamak için `--timeout-ms <ms>` kullanın.

Değişmez anahtar biçimi olan `openclaw matrix verify device "<recovery-key>"` de çalışır, ancak anahtar kabuk geçmişine kaydedilir.

### Çapraz imzalamayı başlatma veya onarma

```bash
openclaw matrix verify bootstrap
```

Şifrelenmiş hesaplara yönelik onarım/kurulum komutudur. Sırasıyla şunları yapar:

- mümkün olduğunda mevcut kurtarma anahtarını yeniden kullanarak gizli depolamayı başlatır
- çapraz imzalamayı başlatır ve eksik ortak anahtarları yükler
- mevcut cihazı işaretler ve çapraz imzalar
- henüz yoksa sunucu tarafında bir oda anahtarı yedeği oluşturur

Homeserver, çapraz imzalama anahtarlarını yüklemek için UIA gerektiriyorsa OpenClaw önce kimlik doğrulamasız yöntemi, ardından `m.login.dummy` yöntemini, son olarak da `m.login.password` yöntemini dener (`channels.matrix.password` gerekir).

Yararlı bayraklar:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...` ile birlikte kullanın) veya `--recovery-key <key>`
- mevcut çapraz imzalama kimliğini atmak için `--force-reset-cross-signing` (yalnızca bilinçli kullanım için; etkin kurtarma anahtarının depolanmış veya `--recovery-key-stdin` ile sağlanmış olması gerekir)

### Oda anahtarı yedeği

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`, sunucu tarafında bir yedeğin bulunup bulunmadığını ve bu cihazın yedeğin şifresini çözüp çözemediğini gösterir. `backup restore`, yedeklenmiş oda anahtarlarını yerel kriptografi deposuna aktarır; kurtarma anahtarı zaten diskteyse `--recovery-key-stdin` seçeneğini kullanmayın.

Bozuk bir yedeği yeni bir başlangıç durumuyla değiştirmek için (kurtarılamayan eski geçmişin kaybedilmesini kabul eder; mevcut yedek gizlisi yüklenemiyorsa gizli depolamayı da yeniden oluşturabilir):

```bash
openclaw matrix verify backup reset --yes
```

Yalnızca önceki kurtarma anahtarının yeni yedek başlangıç durumunun kilidini açmasının bilinçli olarak engellenmesi gerekiyorsa `--rotate-recovery-key` ekleyin.

### Doğrulamaları listeleme, isteme ve yanıtlama

```bash
openclaw matrix verify list
```

Seçilen hesabın bekleyen doğrulama isteklerini listeler.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Bu hesaptan bir doğrulama isteği gönderir. `--own-user`, kendi kendine doğrulama ister (istemi aynı kullanıcıya ait başka bir Matrix istemcisinde kabul edin); `--user-id`/`--device-id`/`--room-id` ise başka bir kişiyi hedefler. `--own-user`, diğer hedefleme bayraklarıyla birlikte kullanılamaz.

Daha düşük düzeyli yaşam döngüsü yönetimi için — genellikle başka bir istemciden gelen istekleri takip ederken — bu komutlar belirli bir `<id>` isteği üzerinde işlem yapar (`verify list` ve `verify request` tarafından yazdırılır):

| Komut                                      | Amaç                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Gelen bir isteği kabul etme                                         |
| `openclaw matrix verify start <id>`        | SAS akışını başlatma                                                |
| `openclaw matrix verify sas <id>`          | SAS emojisini veya ondalık sayılarını yazdırma                       |
| `openclaw matrix verify confirm-sas <id>`  | SAS'ın diğer istemcinin gösterdiği değerle eşleştiğini doğrulama     |
| `openclaw matrix verify mismatch-sas <id>` | Emoji veya ondalık sayılar eşleşmediğinde SAS'ı reddetme             |
| `openclaw matrix verify cancel <id>`       | İptal etme; isteğe bağlı `--reason <text>` ve `--code <matrix-code>` alır |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` ve `cancel` komutlarının tümü, doğrulama belirli bir doğrudan mesaj odasına bağlı olduğunda DM takip ipuçları olarak `--user-id` ve `--room-id` seçeneklerini kabul eder.

### Çok hesaplı kullanım notları

`--account <id>` olmadan Matrix CLI komutları örtük varsayılan hesabı kullanır. Birden fazla adlandırılmış hesap bulunduğunda ve `channels.matrix.defaultAccount` ayarlanmadığında komutlar tahminde bulunmayı reddeder ve bir hesap seçmenizi ister. Adlandırılmış bir hesapta E2EE devre dışı veya kullanılamaz durumdaysa hatalar, örneğin `channels.matrix.accounts.assistant.encryption` gibi ilgili hesabın yapılandırma anahtarını gösterir.

<AccordionGroup>
  <Accordion title="Startup behavior">
    `encryption: true` ile `startupVerification` varsayılan olarak `"if-unverified"` değerini kullanır. Başlangıçta doğrulanmamış bir cihaz, başka bir Matrix istemcisinde kendi kendine doğrulama ister; yinelenen istekleri atlar ve bir bekleme süresi uygular (varsayılan olarak 24 saat). `startupVerificationCooldownHours` ile ayarlayın veya `startupVerification: "off"` ile devre dışı bırakın.

    Başlangıç ayrıca mevcut gizli depolamayı ve çapraz imzalama kimliğini yeniden kullanan ölçülü bir kriptografi başlatma geçişi çalıştırır. Başlatma durumu bozuksa OpenClaw, `channels.matrix.password` olmadan bile korumalı bir onarım dener; homeserver parola UIA'sı gerektiriyorsa başlangıç bir uyarı kaydeder ve ölümcül olmayan durumda kalır. Sahibi tarafından önceden imzalanmış cihazlar korunur.

    Tam yükseltme akışı için [Matrix geçişi](/tr/channels/matrix-migration) bölümüne bakın.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix, doğrulama yaşam döngüsü bildirimlerini katı DM doğrulama odasına `m.notice` mesajları olarak gönderir: istek, hazır durumu ("Verify by emoji" yönlendirmesiyle), başlatma/tamamlama ve kullanılabilir olduğunda SAS (emoji/ondalık) ayrıntıları.

    Başka bir Matrix istemcisinden gelen istekler izlenir ve otomatik olarak kabul edilir. OpenClaw, kendi kendine doğrulamada SAS akışını otomatik olarak başlatır ve emoji doğrulaması kullanılabilir olduğunda kendi tarafını onaylar; yine de Matrix istemcinizde emojileri karşılaştırmanız ve "They match" seçeneğini onaylamanız gerekir.

    Doğrulama sistemi bildirimleri ajan sohbet işlem hattına iletilmez.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    `verify status`, mevcut cihazın artık homeserver üzerinde listelenmediğini bildiriyorsa yeni bir OpenClaw Matrix cihazı oluşturun. Parolayla oturum açmak için:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Token kimlik doğrulaması için Matrix istemcinizde veya yönetici kullanıcı arayüzünde yeni bir erişim token'ı oluşturun, ardından OpenClaw'ı güncelleyin:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` değerini başarısız komuttaki hesap kimliğiyle değiştirin veya varsayılan hesap için `--account` seçeneğini kullanmayın.

  </Accordion>

  <Accordion title="Device hygiene">
    OpenClaw tarafından yönetilen eski cihazlar birikebilir. Listeleyin ve ayıklayın:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE, IndexedDB uyumluluk katmanı olarak `fake-indexeddb` ile resmi `matrix-js-sdk` Rust kriptografi yolunu kullanır. Kriptografi durumu `crypto-idb-snapshot.json` dosyasında kalıcı olarak saklanır (kısıtlayıcı dosya izinleriyle).

    Şifrelenmiş çalışma zamanı durumu `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` altında bulunur ve eşitleme deposunu, kriptografi deposunu, kurtarma anahtarını, IDB anlık görüntüsünü, ileti dizisi bağlamalarını ve başlangıç doğrulama durumunu içerir. Token değiştiğinde ancak hesap kimliği aynı kaldığında OpenClaw, önceki durumun görünür kalması için mevcut en uygun kök dizini yeniden kullanır.

    Tek bir eski belirteç karması kökü, normal bir belirteç döndürme sürekliliği yolu olabilir. OpenClaw `matrix: multiple populated token-hash storage roots detected` günlüğünü kaydederse hesap dizinini inceleyin ve eski kardeş kökleri yalnızca seçilen etkin kökün sağlıklı olduğunu doğruladıktan sonra arşivleyin. Eski kökleri hemen silmek yerine bir `_archive/` dizinine taşımayı tercih edin.

  </Accordion>
</AccordionGroup>

## Profil yönetimi

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Her iki seçeneği tek bir çağrıda iletin. Matrix, `mxc://` avatar URL'lerini doğrudan kabul eder; `http://`/`https://` iletildiğinde önce dosya yüklenir ve çözümlenen `mxc://` URL'si `channels.matrix.avatarUrl` içine (veya hesap başına geçersiz kılma ayarına) kaydedilir.

## İleti dizileri

Matrix, hem otomatik yanıtlar hem de mesaj aracıyla gönderimler için yerel ileti dizilerini destekler. Davranışı birbirinden bağımsız iki ayar denetler:

### Oturum yönlendirme (`sessionScope`)

`dm.sessionScope`, Matrix DM odalarının OpenClaw oturumlarıyla nasıl eşleştirileceğini belirler:

- `"per-user"` (varsayılan): aynı yönlendirilmiş eşe ait tüm DM odaları tek bir oturumu paylaşır.
- `"per-room"`: aynı eş için bile her Matrix DM odası kendi oturum anahtarına sahip olur.

Açık konuşma bağlamaları her zaman `sessionScope` ayarından önceliklidir; bağlanmış odalar ve ileti dizileri seçtikleri hedef oturumu korur.

### Yanıtları ileti dizisine gönderme (`threadReplies`)

`threadReplies`, botun yanıtını nereye göndereceğini belirler:

- `"off"`: yanıtlar üst düzeyde gönderilir. İleti dizisinden gelen mesajlar üst oturumda kalır.
- `"inbound"`: yalnızca gelen mesaj zaten o ileti dizisindeyse ileti dizisi içinde yanıt verilir.
- `"always"`: tetikleyen mesajı kök alan bir ileti dizisi içinde yanıt verilir; bu konuşma, ilk tetiklemeden itibaren eşleşen ileti dizisi kapsamlı bir oturum üzerinden yönlendirilir.

`dm.threadReplies` bunu yalnızca DM'ler için geçersiz kılar; örneğin DM'leri düz tutarken oda ileti dizilerini yalıtılmış tutabilirsiniz.

### İleti dizisi devralma ve eğik çizgi komutları

- İleti dizisinden gelen mesajlar, ileti dizisinin kök mesajını ek aracı bağlamı olarak içerir.
- Mesaj aracıyla yapılan gönderimler, açık bir `threadId` sağlanmadığı sürece aynı odayı (veya aynı DM kullanıcı hedefini) hedeflerken geçerli Matrix ileti dizisini otomatik olarak devralır.
- DM kullanıcı hedefinin yeniden kullanımı yalnızca geçerli oturum meta verileri aynı Matrix hesabındaki aynı DM eşini kanıtladığında devreye girer; aksi takdirde OpenClaw normal kullanıcı kapsamlı yönlendirmeye geri döner.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve ileti dizisine bağlı `/acp spawn` komutlarının tümü Matrix odalarında ve DM'lerde çalışır.
- Üst düzey `/focus`, `threadBindings.spawnSessions` etkin olduğunda yeni bir Matrix ileti dizisi oluşturur ve bunu hedef oturuma bağlar.
- Mevcut bir Matrix ileti dizisi içinde `/focus` veya `/acp spawn --thread here` çalıştırmak, bu ileti dizisini bulunduğu yerde bağlar.

OpenClaw, bir Matrix DM odasının aynı paylaşılan oturumdaki başka bir DM odasıyla çakıştığını algıladığında, `/focus` çıkış yolunu gösteren ve `dm.sessionScope` değişikliği öneren tek seferlik bir `m.notice` gönderir. Bildirim yalnızca ileti dizisi bağlamaları etkin olduğunda görünür.

## ACP konuşma bağlamaları

Matrix odaları, DM'ler ve mevcut Matrix ileti dizileri, sohbet yüzeyini değiştirmeden kalıcı ACP çalışma alanlarına dönüşebilir.

Hızlı operatör akışı:

- Kullanmaya devam etmek istediğiniz Matrix DM'si, odası veya mevcut ileti dizisi içinde `/acp spawn codex --bind here` çalıştırın.
- Üst düzey bir DM veya odada geçerli DM/oda sohbet yüzeyi olarak kalır ve gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- Mevcut bir ileti dizisi içinde `--bind here`, geçerli ileti dizisini bulunduğu yerde bağlar.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu bulunduğu yerde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

`--bind here` alt Matrix ileti dizisi oluşturmaz. `threadBindings.spawnSessions`, OpenClaw'ın bir alt ileti dizisi oluşturması veya bağlaması gereken `/acp spawn --thread auto|here` davranışını denetler.

### İleti dizisi bağlama yapılandırması

Matrix, genel varsayılanları `session.threadBindings` üzerinden devralır ve kanal başına geçersiz kılmaları destekler:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: hem alt aracı hem de ACP ileti dizisi oluşturmalarını denetler.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: yalnızca alt aracı veya yalnızca ACP oluşturmaları için daha dar geçersiz kılmalardır.
- `threadBindings.defaultSpawnContext`

Matrix ileti dizisine bağlı oturum oluşturmaları varsayılan olarak etkindir. Üst düzey `/focus` ve `/acp spawn --thread auto|here` komutlarının Matrix ileti dizileri oluşturmasını/bağlamasını engellemek için `threadBindings.spawnSessions: false` ayarlayın. Yerel alt aracı ileti dizisi oluşturmalarının üst dökümü çatallamaması gerektiğinde `threadBindings.defaultSpawnContext: "isolated"` ayarlayın.

## Tepkiler

Matrix; giden tepkileri, gelen tepki bildirimlerini ve alındı tepkilerini destekler.

Giden tepki araçları `channels.matrix.actions.reactions` tarafından denetlenir:

- `react`, bir Matrix olayına tepki ekler.
- `reactions`, bir Matrix olayının geçerli tepki özetini listeler.
- `emoji=""`, botun o olaydaki kendi tepkilerini kaldırır.
- `remove: true`, yalnızca belirtilen emoji tepkisini bottan kaldırır.

**Çözümleme sırası** (ilk tanımlı değer kazanır):

| Ayar                     | Sıra                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `ackReaction`            | hesap başına -> kanal -> `messages.ackReaction` -> aracı kimliği emojisi geri dönüşü |
| `ackReactionScope`       | hesap başına -> kanal -> `messages.ackReactionScope` -> varsayılan `"group-mentions"` |
| `reactionNotifications`  | hesap başına -> kanal -> varsayılan `"own"`                                          |

`reactionNotifications: "own"`, bot tarafından yazılmış Matrix mesajlarını hedefleyen eklenmiş `m.reaction` olaylarını iletir; `"off"` tepki sistemi olaylarını devre dışı bırakır. Tepki kaldırmaları sistem olaylarına dönüştürülmez; Matrix bunları bağımsız `m.reaction` kaldırmaları olarak değil, redaksiyonlar olarak sunar.

## Geçmiş bağlamı

- `channels.matrix.historyLimit`, bir oda mesajı aracıyı tetiklediğinde kaç yakın tarihli oda mesajının `InboundHistory` olarak ekleneceğini denetler. `messages.groupChat.historyLimit` değerine geri döner; ikisi de ayarlanmamışsa etkin varsayılan `0` olur (devre dışı).
- Matrix oda geçmişi yalnızca odaya özgüdür; DM'ler normal oturum geçmişini kullanmaya devam eder.
- Oda geçmişi yalnızca bekleyen mesajlardan oluşur: OpenClaw, henüz yanıt tetiklememiş oda mesajlarını arabelleğe alır ve bir bahsetme veya başka bir tetikleyici geldiğinde bu pencerenin anlık görüntüsünü alır.
- Geçerli tetikleyici mesaj `InboundHistory` içine eklenmez; o tur için gelen ana gövdede kalır.
- Aynı Matrix olayının yeniden denemeleri, daha yeni oda mesajlarına doğru kaymak yerine özgün geçmiş anlık görüntüsünü yeniden kullanır.

## Bağlam görünürlüğü

Matrix; getirilen yanıt metni, ileti dizisi kökleri ve bekleyen geçmiş gibi ek oda bağlamları için paylaşılan `contextVisibility` denetimini destekler.

- `contextVisibility: "all"` varsayılandır. Ek bağlam alındığı biçimde korunur.
- `contextVisibility: "allowlist"`, ek bağlamı etkin oda/kullanıcı izin listesi denetimleri tarafından izin verilen göndericilerle sınırlar.
- `contextVisibility: "allowlist_quote"`, `allowlist` gibi davranır ancak açıkça alıntılanmış bir yanıtı yine de korur.

Bu, gelen mesajın kendisinin yanıt tetikleyip tetikleyemeyeceğini değil, yalnızca ek bağlamın görünürlüğünü etkiler. Tetikleme yetkilendirmesi yine `groupPolicy`, `groups`, `groupAllowFrom` ve DM ilkesi ayarlarından gelir.

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

Bahsetme koşulu ve izin listesi davranışı için [Gruplar](/tr/channels/groups) bölümüne bakın.

Matrix DM'leri için eşleştirme örneği:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Onaylanmamış bir Matrix kullanıcısı onaydan önce mesaj göndermeye devam ederse OpenClaw aynı bekleyen eşleştirme kodunu yeniden kullanır ve yeni bir kod oluşturmak yerine kısa bir bekleme süresinden sonra hatırlatma yanıtı gönderebilir.

Paylaşılan DM eşleştirme akışı ve depolama düzeni için [Eşleştirme](/tr/channels/pairing) bölümüne bakın.

## Doğrudan oda onarımı

Doğrudan mesaj durumu saparsa OpenClaw, canlı DM yerine eski tek kişilik odaları gösteren güncelliğini yitirmiş `m.direct` eşlemeleriyle kalabilir. Bir eş için geçerli eşlemeyi inceleyin:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Onarın:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Her iki komut da çok hesaplı kurulumlar için `--account <id>` seçeneğini kabul eder. Onarım akışı:

- `m.direct` içinde zaten eşlenmiş katı bir 1:1 DM'yi tercih eder
- bu kullanıcıyla hâlihazırda katılınmış herhangi bir katı 1:1 DM'ye geri döner
- sağlıklı bir DM yoksa yeni bir doğrudan oda oluşturur ve `m.direct` değerini yeniden yazar

Eski odaları otomatik olarak silmez. Sağlıklı DM'yi seçer ve eşlemeyi günceller; böylece gelecekteki Matrix gönderimleri, doğrulama bildirimleri ve diğer doğrudan mesaj akışları doğru odayı hedefler.

## Çalıştırma onayları

Matrix, yerel bir onay istemcisi olarak işlev görebilir. `channels.matrix.execApprovals` altında (veya hesap başına geçersiz kılma için `channels.matrix.accounts.<account>.execApprovals` altında) yapılandırın:

- `enabled`: onayları Matrix'e özgü istemler aracılığıyla iletir. Ayarlanmamış veya `"auto"` olduğunda, en az bir onaylayıcı çözümlenebildiği anda otomatik olarak etkinleşir; açıkça devre dışı bırakmak için `false` ayarlayın.
- `approvers`: çalıştırma isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (`@owner:example.org`). `channels.matrix.dm.allowFrom` değerine geri döner.
- `target`: istemlerin nereye gönderileceğini belirler. `"dm"` (varsayılan) onaylayıcıların DM'lerine gönderir; `"channel"` kaynak odaya veya DM'ye gönderir; `"both"` her ikisine de gönderir.
- `agentFilter` / `sessionFilter`: hangi aracıların/oturumların Matrix iletimini tetikleyeceğine yönelik isteğe bağlı izin listeleri.

Yetkilendirme, onay türleri arasında biraz farklıdır:

- **Çalıştırma onayları**, `execApprovals.approvers` değerini kullanır ve `dm.allowFrom` değerine geri döner.
- **Plugin onayları** yalnızca `dm.allowFrom` aracılığıyla yetkilendirilir.

Her iki tür de Matrix tepki kısayollarını ve mesaj güncellemelerini paylaşır. Onaylayıcılar, birincil onay mesajında tepki kısayollarını görür:

- ✅ bir kez izin ver
- ❌ reddet
- ♾️ her zaman izin ver (etkin çalıştırma ilkesi buna izin verdiğinde)

Geri dönüş eğik çizgi komutları: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Çalıştırma onaylarının kanal iletimi komut metnini içerir; `channel` veya `both` seçeneklerini yalnızca güvenilir odalarda etkinleştirin.

İlgili: [Çalıştırma onayları](/tr/tools/exec-approvals).

## Eğik çizgi komutları

Eğik çizgi komutları (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` vb.) doğrudan DM'lerde çalışır. OpenClaw, odalarda botun kendi Matrix bahsetmesiyle başlayan komutları da tanır; dolayısıyla `@bot:server /new`, özel bir bahsetme düzenli ifadesi olmadan komut yolunu tetikler. Bu, Element ve benzeri istemcilerin kullanıcı komutu yazmadan önce botu sekmeyle tamamladığında oluşturduğu oda biçimindeki `@mention /command` gönderilerine botun yanıt vermeye devam etmesini sağlar.

Yetkilendirme kuralları yine geçerlidir: komut göndericileri, düz mesajlarla aynı DM veya oda izin listesi/sahip ilkelerini karşılamalıdır.

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
- Devralınan bir oda girdisini `groups.<room>.account` ile belirli bir hesapla sınırlandırın. `account` içermeyen girdiler hesaplar arasında paylaşılır; varsayılan hesap üst düzeyde yapılandırıldığında `account: "default"` kullanılmaya devam eder.

**Varsayılan hesap seçimi:**

- Örtük yönlendirme, yoklama ve CLI komutlarının tercih edeceği adlandırılmış hesabı seçmek için `defaultAccount` değerini ayarlayın.
- Birden fazla hesabınız varsa ve bunlardan birinin adı tam olarak `default` ise `defaultAccount` ayarlanmamış olsa bile OpenClaw bu hesabı örtük olarak kullanır.
- Birden fazla adlandırılmış hesap olduğunda ve varsayılan hesap seçilmediğinde CLI komutları tahminde bulunmayı reddeder; `defaultAccount` değerini ayarlayın veya `--account <id>` parametresini geçirin.
- Üst düzey `channels.matrix.*` bloğu yalnızca kimlik doğrulama bilgileri eksiksiz olduğunda (`homeserver` + `accessToken` veya `homeserver` + `userId` + `password`) örtük `default` hesap olarak değerlendirilir. Önbelleğe alınmış kimlik bilgileri kimlik doğrulama gereksinimini karşıladığında, adlandırılmış hesaplar `homeserver` + `userId` üzerinden keşfedilebilir durumda kalır.

**Yükseltme:**

- OpenClaw, onarım veya kurulum sırasında tek hesaplı bir yapılandırmayı çok hesaplı yapıya yükselttiğinde, mevcut bir adlandırılmış hesap varsa veya `defaultAccount` zaten bir hesabı gösteriyorsa bu hesabı korur. Yalnızca Matrix kimlik doğrulama/önyükleme anahtarları yükseltilen hesaba taşınır; paylaşılan teslimat politikası anahtarları üst düzeyde kalır.

Paylaşılan çok hesaplı yapı için [Yapılandırma başvurusu](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Özel/LAN ana sunucuları

Varsayılan olarak OpenClaw, hesap bazında izin vermediğiniz sürece SSRF koruması amacıyla özel/dahili Matrix ana sunucularını engeller.

Ana sunucunuz localhost, bir LAN/Tailscale IP'si veya dahili bir ana makine adı üzerinde çalışıyorsa ilgili hesap için `network.dangerouslyAllowPrivateNetwork` seçeneğini etkinleştirin:

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

Bu açık izin yalnızca güvenilir özel/dahili hedeflere izin verir. `http://matrix.example.org:8008` gibi şifrelenmemiş genel ana sunucular engellenmeye devam eder. Mümkün olduğunda `https://` kullanmayı tercih edin.

## Matrix trafiğini proxy üzerinden yönlendirme

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

Adlandırılmış hesaplar, `channels.matrix.accounts.<id>.proxy` ile üst düzey varsayılanı geçersiz kılabilir. OpenClaw, çalışma zamanı Matrix trafiği ve hesap durum yoklamaları için aynı proxy ayarını kullanır.

## Hedef çözümleme

Matrix, OpenClaw'ın oda veya kullanıcı hedefi istediği her yerde aşağıdaki hedef biçimlerini kabul eder:

- Kullanıcılar: `@user:server`, `user:@user:server` veya `matrix:user:@user:server`
- Odalar: `!room:server`, `room:!room:server` veya `matrix:room:!room:server`
- Takma adlar: `#alias:server`, `channel:#alias:server` veya `matrix:channel:#alias:server`

Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. Açık teslim hedeflerini, cron işlerini, bağlamaları veya izin listelerini yapılandırırken Matrix'teki oda kimliğinin büyük/küçük harf kullanımını tam olarak koruyun. OpenClaw, depolama için dahili oturum anahtarlarını kurallı biçimde tutar; bu nedenle küçük harfli anahtarlar, Matrix teslim kimlikleri için güvenilir bir kaynak değildir.

Canlı dizin araması, oturum açılmış Matrix hesabını kullanır:

- Kullanıcı aramaları, ilgili ana sunucudaki Matrix kullanıcı dizinini sorgular.
- Oda aramaları, açık oda kimliklerini ve diğer adlarını doğrudan kabul eder. Katılınmış oda adına göre arama, mümkün olan en iyi sonucu sağlamaya çalışır ve yalnızca `dangerouslyAllowNameMatching: true` ayarlandığında çalışma zamanı oda izin listelerine uygulanır.
- Bir oda adı bir kimliğe veya diğer ada çözümlenemiyorsa çalışma zamanı izin listesi çözümlemesinde yok sayılır.

## Yapılandırma başvurusu

İzin listesi türündeki kullanıcı alanları (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) tam Matrix kullanıcı kimliklerini kabul eder (en güvenli seçenek). Kimlik olmayan girdiler varsayılan olarak yok sayılır. `dangerouslyAllowNameMatching: true` ayarlanırsa Matrix dizinindeki görünen adlarla tam olarak eşleşen girdiler, başlangıçta ve izleyici çalışırken izin listesi her değiştiğinde çözümlenir; çözümlenemeyen girdiler çalışma zamanında yok sayılır.

Oda izin listesi anahtarları (`groups`, eski `rooms`) oda kimlikleri veya diğer adları olmalıdır. Düz oda adı anahtarları varsayılan olarak yok sayılır; `dangerouslyAllowNameMatching: true`, katılınmış oda adlarında mümkün olan en iyi sonucu sağlamaya çalışan aramayı yeniden etkinleştirir.

### Hesap ve bağlantı

- `enabled`: kanalı etkinleştirin veya devre dışı bırakın.
- `name`: hesap için isteğe bağlı görünen etiket.
- `defaultAccount`: birden fazla Matrix hesabı yapılandırıldığında tercih edilen hesap kimliği.
- `accounts`: adlandırılmış hesap başına geçersiz kılmalar. Üst düzey `channels.matrix` değerleri varsayılan olarak devralınır.
- `homeserver`: ana sunucu URL'si; örneğin `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: bu hesabın `localhost`, LAN/Tailscale IP'lerine veya dahili ana makine adlarına bağlanmasına izin verin.
- `proxy`: Matrix trafiği için isteğe bağlı HTTP(S) proxy URL'si. Hesap başına geçersiz kılma desteklenir.
- `userId`: tam Matrix kullanıcı kimliği (`@bot:example.org`).
- `accessToken`: belirteç tabanlı kimlik doğrulama için erişim belirteci. env/file/exec sağlayıcılarında düz metin ve SecretRef değerleri desteklenir ([Gizli Bilgi Yönetimi](/tr/gateway/secrets)).
- `password`: parola tabanlı oturum açma için parola. Düz metin ve SecretRef değerleri desteklenir.
- `deviceId`: açık Matrix cihaz kimliği.
- `deviceName`: parolayla oturum açma sırasında kullanılan cihaz görünen adı.
- `avatarUrl`: profil eşitleme ve `profile set` güncellemeleri için depolanan öz avatar URL'si.
- `initialSyncLimit`: başlangıç eşitlemesi sırasında getirilen azami olay sayısı.

### Şifreleme

- `encryption`: uçtan uca şifrelemeyi etkinleştirin. Varsayılan: `false`.
- `startupVerification`: `"if-unverified"` (uçtan uca şifreleme açıkken varsayılan) veya `"off"`. Bu cihaz doğrulanmamışsa başlangıçta öz doğrulamayı otomatik olarak ister.
- `startupVerificationCooldownHours`: sonraki otomatik başlangıç isteğinden önceki bekleme süresi. Varsayılan: `24`.

### Erişim ve politika

- `groupPolicy`: `"open"`, `"allowlist"` veya `"disabled"`. Varsayılan: `"allowlist"`.
- `groupAllowFrom`: oda trafiği için kullanıcı kimliği izin listesi.
- `mentionPatterns`: oda bahsetmeleri için kapsamlı düzenli ifade kalıpları. `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }` biçiminde nesne. Yapılandırılmış `agents.list[].groupChat.mentionPatterns` kalıplarının oda başına uygulanıp uygulanmayacağını denetler.
- `dm.enabled`: `false` olduğunda tüm doğrudan mesajları yok sayın. Varsayılan: `true`.
- `dm.policy`: `"pairing"` (varsayılan), `"allowlist"`, `"open"` veya `"disabled"`. Bot odaya katıldıktan ve odayı doğrudan mesaj olarak sınıflandırdıktan sonra uygulanır; davet işlemeyi etkilemez.
- `dm.allowFrom`: doğrudan mesaj trafiği için kullanıcı kimliği izin listesi.
- `dm.sessionScope`: `"per-user"` (varsayılan) veya `"per-room"`.
- `dm.threadReplies`: yanıtları ileti dizisine eklemek için yalnızca doğrudan mesajlara yönelik geçersiz kılma (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: yapılandırılmış diğer Matrix bot hesaplarından gelen mesajları kabul edin (`true` veya `"mentions"`).
- `allowlistOnly`: `true` olduğunda tüm etkin doğrudan mesaj politikalarını (`"disabled"` hariç) ve `"open"` grup politikalarını `"allowlist"` olmaya zorlar. `"disabled"` politikalarını değiştirmez.
- `dangerouslyAllowNameMatching`: `true` olduğunda kullanıcı izin listesi girdileri için Matrix görünen ad dizini aramasına ve oda izin listesi anahtarları için katılınmış oda adı aramasına izin verir. Tam `@user:server` kimliklerini ve oda kimliklerini ya da diğer adlarını tercih edin.
- `autoJoin`: `"always"`, `"allowlist"` veya `"off"`. Varsayılan: `"off"`. Doğrudan mesaj türündeki davetler dâhil tüm Matrix davetlerine uygulanır.
- `autoJoinAllowlist`: `autoJoin`, `"allowlist"` olduğunda izin verilen odalar/diğer adlar. Diğer ad girdileri, davet edilen odanın bildirdiği duruma göre değil ana sunucuya göre çözümlenir.
- `contextVisibility`: ek bağlam görünürlüğü (`"all"` varsayılan, `"allowlist"`, `"allowlist_quote"`).

### Yanıt davranışı

- `replyToMode`: `"off"` (varsayılan), `"first"`, `"all"` veya `"batched"`.
- `threadReplies`: `"off"` (açıkça ayarlanmadığı sürece üst düzey varsayılan `"inbound"` olarak çözümlenir), `"inbound"` veya `"always"`.
- `threadBindings`: ileti dizisine bağlı oturum yönlendirmesi ve yaşam döngüsü için kanal başına geçersiz kılmalar.
- `streaming`: `"off"` (varsayılan), `"partial"`, `"quiet"`, `"progress"` veya `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }` nesne biçimi. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming`: `true` olduğunda tamamlanmış asistan blokları ayrı ilerleme mesajları olarak tutulur. Varsayılan: `false`.
- `markdown`: giden metin için isteğe bağlı Markdown işleme yapılandırması.
- `responsePrefix`: giden yanıtların başına eklenen isteğe bağlı dize.
- `textChunkLimit`: `chunkMode: "length"` olduğunda giden parçaların karakter cinsinden boyutu. Varsayılan: `4000`.
- `chunkMode`: `"length"` (varsayılan, karakter sayısına göre böler) veya `"newline"` (satır sınırlarında böler).
- `historyLimit`: bir oda mesajı aracıyı tetiklediğinde `InboundHistory` olarak eklenen son oda mesajlarının sayısı. `messages.groupChat.historyLimit` değerine geri döner; geçerli varsayılan `0`'dır (devre dışı).
- `mediaMaxMb`: giden gönderimler ve gelen işleme için MB cinsinden medya boyutu üst sınırı. Varsayılan: `20`.

### Tepki ayarları

- `ackReaction`: bu kanal/hesap için alındı tepkisi geçersiz kılması.
- `ackReactionScope`: kapsam geçersiz kılması (`"group-mentions"` varsayılan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: gelen tepki bildirimi modu (`"own"` varsayılan, `"off"`).

### Araçlar ve oda başına geçersiz kılmalar

- `actions`: eylem başına araç denetimi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: oda başına politika eşlemesi. Oturum kimliği, çözümlemeden sonra kararlı oda kimliğini kullanır. (`rooms` eski bir diğer addır.)
  - `groups.<room>.account`: devralınmış bir oda girdisini belirli bir hesapla sınırlandırır.
  - `groups.<room>.enabled`: oda başına açma/kapatma ayarı. `false` olduğunda oda, eşlemede yokmuş gibi yok sayılır.
  - `groups.<room>.requireMention`: kanal düzeyindeki bahsetme gereksiniminin oda başına geçersiz kılması.
  - `groups.<room>.allowBots`: kanal düzeyindeki ayarın oda başına geçersiz kılması (`true` veya `"mentions"`).
  - `groups.<room>.botLoopProtection`: bottan bota döngü koruma bütçesi için oda başına geçersiz kılma.
  - `groups.<room>.users`: oda başına gönderen izin listesi.
  - `groups.<room>.tools`: oda başına araç izin/verme reddetme geçersiz kılmaları.
  - `groups.<room>.autoReply`: oda başına bahsetme koşulu geçersiz kılması. `true`, ilgili oda için bahsetme gereksinimlerini devre dışı bırakır; `false`, bunları yeniden zorunlu kılar.
  - `groups.<room>.skills`: oda başına Skills filtresi.
  - `groups.<room>.systemPrompt`: oda başına sistem istemi parçacığı.

### Komut yürütme onayı ayarları

- `execApprovals.enabled`: komut yürütme onaylarını Matrix'e özgü istemler aracılığıyla iletin.
- `execApprovals.approvers`: onaylama izni verilen Matrix kullanıcı kimlikleri. `dm.allowFrom` değerine geri döner.
- `execApprovals.target`: `"dm"` (varsayılan), `"channel"` veya `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: teslim için isteğe bağlı aracı/oturum izin listeleri.

## İlgili konular

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - doğrudan mesaj kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme koşulu
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sıkılaştırma
