---
read_when:
    - OpenClaw'u QQ'ya bağlamak istiyorsunuz
    - QQ Bot kimlik bilgilerini ayarlamanız gerekir
    - QQ Bot grup veya özel sohbet desteği istiyorsunuz
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ botu
x-i18n:
    generated_at: "2026-07-12T12:05:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot, resmi QQ Bot API'si (WebSocket gateway) aracılığıyla OpenClaw'a bağlanır.
C2C özel sohbet ve grup `@` bahsetmeleri, zengin medya (görüntüler, ses, video,
dosyalar) desteğiyle temel sohbet türleridir. Topluluk kanalı mesajlarında yalnızca
metin ve uzak URL görüntüleri desteklenir; topluluk kanallarında ses, video, dosya
yüklemeleri ve yerel/Base64 görüntüler kullanılamaz. Tepkiler ve ileti dizileri
hiçbir yerde desteklenmez.

Durum: resmi olarak indirilebilir Plugin.

## Kurulum

```bash
openclaw plugins install @openclaw/qqbot
```

## Ayarlama

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve kaydolmak / oturum açmak
   için QR kodunu telefonunuzdaki QQ ile tarayın.
2. Yeni bir QQ botu oluşturmak için **Create Bot** düğmesine tıklayın.
3. Botun ayarlar sayfasında **AppID** ve **AppSecret** alanlarını bulun ve kopyalayın.

<Note>
AppSecret düz metin olarak saklanmaz. Sayfadan kaydetmeden ayrılırsanız yeni bir tane oluşturmanız gerekir.
</Note>

4. Kanalı ekleyin:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway'i yeniden başlatın.

Etkileşimli ayarlama:

```bash
openclaw channels add
```

Sihirbaz, AppID/AppSecret değerlerini elle yazmaya alternatif olarak QR koduyla
bağlama seçeneği de sunar: bağlama işlemini tamamlamak için kodu hedef QQ Bot'a
bağlı telefon uygulamasıyla tarayın. OpenClaw, döndürülen kimlik bilgilerini hesabın
yapılandırma kapsamı altında kalıcı olarak saklar.

## Yapılandırma

Asgari yapılandırma:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Varsayılan hesap ortam değişkenleri (yalnızca üst düzey hesap):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

Dosya tabanlı AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Ortam SecretRef AppSecret'i:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

Notlar:

- `openclaw channels add --channel qqbot --token-file ...` yalnızca AppSecret'i
  ayarlar; `appId`, yapılandırmada veya `QQBOT_APP_ID` içinde önceden ayarlanmış
  olmalıdır.
- `clientSecret`, düz metin dizesini, dosya yolunu (`clientSecretFile`) veya
  yapılandırılmış bir SecretRef nesnesini kabul eder.
- Eski `secretref:...` / `secretref-env:...` işaretçi dizeleri `clientSecret`
  için reddedilir; bunun yerine yapılandırılmış bir SecretRef nesnesi kullanın.

### Erişim ilkesi

- `allowFrom` / `groupAllowFrom`, C2C / grup bağlamlarında botla kimlerin sohbet
  edebileceğini sınırlar. `dmPolicy` / `groupPolicy` (`open` | `allowlist` |
  `disabled`) uygulama modunu denetler. `allowFrom` somut (joker olmayan) bir
  girdi içerdiğinde `dmPolicy` varsayılan olarak `allowlist`, aksi hâlde `open`
  olur. `groupAllowFrom` veya `allowFrom` somut bir girdi içerdiğinde
  `groupPolicy` varsayılan olarak `allowlist`, aksi hâlde `open` olur.
- "Yetkilendirme: izin listesi" eğik çizgi komutları, `dmPolicy` /
  `groupPolicy` değerlerinden bağımsız olarak `allowFrom` içinde (grup
  çağrıları için `groupAllowFrom` içinde) açıkça belirtilmiş, joker olmayan bir
  girdi gerektirir — bkz. [Eğik çizgi komutları](#slash-commands).

### Çok hesaplı ayarlama

Tek bir OpenClaw örneği altında birden fazla QQ botu çalıştırın:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Her hesap, `appId` ile anahtarlanan yalıtılmış bir WebSocket bağlantısına, API
istemcisine ve belirteç önbelleğine sahiptir. Tek bir Gateway altında birden
fazla bot çalıştırdığınızda tanılamaların birbirinden ayrılabilmesi için günlük
satırları sahip hesabın kimliğiyle etiketlenir.

CLI aracılığıyla ikinci bir bot ekleyin:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Grup sohbetleri

Grup desteği, görünen adları değil QQ grup OpenID'lerini kullanır. Botu bir gruba
ekleyin, ardından bottan bahsedin veya grubu bahsetme olmadan çalışacak şekilde
yapılandırın.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]`, her grup için varsayılanları ayarlar; somut bir
`groups.GROUP_OPENID` girdisi, tek bir grup için bu varsayılanları geçersiz
kılar. Grup ayarları:

| Alan                  | Varsayılan       | Açıklama                                                                                                    |
| --------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Bot yanıt vermeden önce bir `@` bahsetmesi gerektirir.                                                      |
| `commandLevel`        | `all`            | Grupta hangi yerleşik eğik çizgi komutlarının çalıştırılabileceğini belirler (aşağıya bakın).                |
| `ignoreOtherMentions` | `false`          | Bottan değil başka birinden bahseden mesajları yok sayar.                                                   |
| `historyLimit`        | `50`             | Sonraki bahsetmeli tur için bağlam olarak tutulan, bahsetme içermeyen son mesajlar. `0` geçmişi devre dışı bırakır. |
| `tools`               | —                | Grubun tamamı için araçlara izin verir/reddeder.                                                            |
| `toolsBySender`       | —                | Gönderici başına araç geçersiz kılmaları; bkz. [Gruplar](/tr/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | openid öneki     | Günlüklerde ve grup bağlamında kullanılan kolay anlaşılır etiket.                                          |
| `prompt`              | yerleşik varsayılan | Temsilci bağlamına eklenen, grup başına davranış istemi.                                                  |

`commandLevel` şunları kabul eder:

| Düzey    | Davranış                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Mevcut yerleşik komutlar kullanılabilir durumda kalır. Bazıları menülerde gizli kalır ancak yetkili kullanıcılar bunları grupta yine de çalıştırabilir. |
| `safety` | `/help`, `/btw`, `/stop` grupta görünür kalır; hassas komutlar (`/config`, `/tools`, `/bash` vb.) özel sohbette çalıştırılmalıdır.               |
| `strict` | Yalnızca katı çalışma için gereken grup oturumu denetimlerine izin verilir. Yetkili bir göndericinin etkin bir çalışmayı kesebilmesi için `/stop` çalışmaya devam eder. |

Eski QQBot `toolPolicy` girdileri kullanımdan kaldırılmıştır. Bunları `tools` alanına taşımak için `openclaw doctor --fix` komutunu çalıştırın.

Etkinleştirme modları `mention` ve `always` değerleridir. `requireMention: true`,
`mention` değerine; `requireMention: false` ise `always` değerine karşılık gelir.
Varsa oturum düzeyindeki etkinleştirme geçersiz kılması, yapılandırmadan önceliklidir.

Gelen kuyruğu eş başınadır. Grup eşleri daha büyük bir kuyruk sınırına sahiptir
(doğrudan eşler için 20 yerine 50), kuyruk dolduğunda insan mesajlarından önce
bot tarafından yazılan mesajları çıkarır ve normal grup mesajı akışlarını
gönderen bilgisi içeren tek bir turda birleştirir. Eğik çizgi komutları,
birleştirme gruplarından bağımsız olarak sırayla çalışır.

### Ses (STT / TTS)

STT ve TTS, öncelikli geri dönüşle iki düzeyli yapılandırmayı destekler:

| Ayar | Plugin'e özgü                                           | Çerçeve geri dönüşü           |
| ---- | -------------------------------------------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS  | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

İkisinden birini devre dışı bırakmak için `enabled: false` ayarlayın. Hesap
düzeyindeki TTS geçersiz kılmaları `messages.tts` ile aynı yapıyı kullanır ve
kanal/genel TTS yapılandırmasının üzerine derinlemesine birleştirilir.

STT istekleri varsayılan olarak 60 saniye sonra zaman aşımına uğrar. Plugin'e özgü
STT, seçilen `models.providers.<id>.timeoutSeconds` geçersiz kılmasını kullanır.
Çerçeve ses STT'si sırasıyla `tools.media.audio.models[0].timeoutSeconds`,
`tools.media.audio.timeoutSeconds` ve ardından seçilen sağlayıcının geçersiz
kılmasını kullanır.

Gelen QQ ses ekleri, ham ses dosyaları genel `MediaPaths` dışında tutulurken
temsilcilere ses medyası meta verileri olarak sunulur. Düz metin yanıttaki
`[[audio_as_voice]]`, TTS yapılandırılmışsa TTS sentezler ve yerel bir QQ sesli
mesajı gönderir.

Giden ses yükleme/dönüştürme davranışı ayrıca
`channels.qqbot.audioFormatPolicy` ile ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimleri

| Biçim                      | Açıklama           |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Özel sohbet (C2C)  |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti       |
| `qqbot:channel:CHANNEL_ID` | Topluluk kanalı    |

<Note>
Her botun kendi kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID, Bot B aracılığıyla mesaj göndermek için **kullanılamaz**.
</Note>

## Eğik çizgi komutları

Yapay zekâ kuyruğundan önce yakalanan yerleşik komutlar:

| Komut                | Yetkilendirme | Kapsam        | Açıklama                                                                                       |
| -------------------- | ------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| `/bot-ping`          | —             | herhangi biri | Gecikme testi                                                                                  |
| `/bot-help`          | —             | herhangi biri | Tüm komutları listeler                                                                         |
| `/bot-me`            | —             | yalnızca özel | `allowFrom` / `groupAllowFrom` ayarlaması için gönderenin QQ kullanıcı kimliğini (openid) gösterir |
| `/bot-version`       | —             | yalnızca özel | OpenClaw çerçeve sürümünü ve Plugin sürümünü gösterir                                           |
| `/bot-upgrade`       | —             | yalnızca özel | QQBot yükseltme kılavuzu bağlantısını gösterir                                                  |
| `/bot-approve`       | izin listesi  | yalnızca özel | Komut yürütme onayı yapılandırmasını yönetir (açık / kapalı / her zaman / sıfırla / durum)       |
| `/bot-logs`          | izin listesi  | yalnızca özel | Son Gateway günlüklerini dosya olarak dışa aktarır                                              |
| `/bot-clear-storage` | izin listesi  | yalnızca özel | QQBot medya dizini altındaki önbelleğe alınmış indirmeleri siler                                 |
| `/bot-streaming`     | izin listesi  | yalnızca özel | C2C akışlı yanıtlarını açar/kapatır                                                             |
| `/bot-group-allways` | izin listesi  | yalnızca özel | Varsayılan grup etkinleştirme modunu değiştirir (bahsetme gerekli / her zaman açık)              |

Kullanım yardımı için herhangi bir komutun sonuna `?` ekleyin (örneğin
`/bot-upgrade ?`).

"Yetkilendirme: izin listesi" komutları ayrıca gönderenin openid değerinin,
açıkça belirtilmiş ve joker olmayan bir `allowFrom` listesinde bulunmasını
gerektirir (gruptan verilen komutlarda `groupAllowFrom` önceliklidir; eşleşme
yoksa `allowFrom` kullanılır). `allowFrom: ["*"]` jokeri sohbete izin verir,
ancak bu komutlara izin vermez. Bunlardan birini özel sohbet dışında veya
yetkisiz olarak çalıştırmak, mesajı sessizce yok saymak yerine bir ipucu döndürür.

`/bot-me`, `/bot-version` ve `/bot-upgrade` yalnızca özel sohbetlerde kullanılabilir, ancak
izin listesi gerektirmez — herhangi bir C2C göndericisi bunları çalıştırabilir.

QQ Bot yürütme onayları varsayılan aynı sohbet yedeğini kullandığında, yerel onay
düğmesi tıklamaları aynı açık, joker karakter içermeyen komut izin listesini izler. Daha geniş
komut erişimi vermeden yalnızca onay erişimi vermek için
`channels.qqbot.execApprovals.approvers` seçeneğini yapılandırın. Yerel yürütme onayları varsayılan olarak
etkindir.

## Medya ve depolama

- Gelen, giden ve Gateway köprüsü medyası,
  `~/.openclaw/media/qqbot` altında tek bir yük kökünü paylaşır (`OPENCLAW_HOME` ayarlandığında buna uyulur); böylece yüklemeler,
  indirmeler ve kod dönüştürme önbellekleri korumalı tek bir dizin altında kalır.
- C2C ve grup hedeflerine zengin medya teslimi tek bir `sendMedia`
  yolu üzerinden gerçekleşir. 5&nbsp;MiB veya daha büyük yerel dosyalar ve bellek içi arabellekler QQ'nun
  parçalı yükleme uç noktalarını kullanır; daha küçük yükler ile uzak URL/Base64 kaynakları ise
  tek seferlik yükleme API'sini kullanır.
- Gateway, `openclaw.json` dosyasını yazmayı tamamlamadan bir çalışırken yükseltme tarafından kesintiye uğrarsa
  plugin, bir sonraki başlangıçta dahili bir anlık görüntüden ilgili hesap için bilinen son `appId` / `clientSecret`
  değerlerini geri yükler (kasıtlı bir yapılandırma değişikliğinin asla
  üzerine yazmaz); böylece QR kodunun yeniden taranması
  gerekmez.

## Sorun giderme

- **Gateway başlamıyor / gelen mesaj yok:** `appId` ve
  `clientSecret` değerlerinin doğru olduğunu ve botun QQ Open Platform'da etkinleştirildiğini doğrulayın.
  Eksik bir kimlik bilgisi "QQBot not configured (missing appId or
  clientSecret)" olarak gösterilir.
- **`--token-file` ile kurulum hâlâ yapılandırılmamış görünüyor:** `--token-file` yalnızca
  AppSecret değerini ayarlar. `appId` yine de yapılandırmada veya `QQBOT_APP_ID` içinde ayarlanmalıdır.
- **Ani grup yanıtları çakışıyor:** bir eşin kuyruğu dolduğunda gelen kuyruğu, insanlar tarafından yazılan mesajlardan önce bot tarafından yazılan
  mesajları çıkarır ve normal (komut olmayan) grup mesajı
  yığınlarını kaynağı belirtilmiş tek bir etkileşimde birleştirir; böylece bot mesajı akını
  insan mesajlarının işlenmesini engellemez.
- **Proaktif mesajlar ulaşmıyor:** Kullanıcı yakın zamanda etkileşim kurmadıysa QQ,
  bot tarafından başlatılan mesajları engelleyebilir.
- **Ses metne dönüştürülmüyor:** STT'nin yapılandırıldığından ve sağlayıcıya
  erişilebildiğinden emin olun.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal sorunlarını giderme](/tr/channels/troubleshooting)
