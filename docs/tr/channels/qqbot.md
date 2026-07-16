---
read_when:
    - OpenClaw'u QQ'ya bağlamak istiyorsunuz
    - QQ Bot kimlik bilgilerini ayarlamanız gerekir
    - QQ Bot grup veya özel sohbet desteği istiyorsunuz
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ botu
x-i18n:
    generated_at: "2026-07-16T16:40:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot, resmi QQ Bot API'si (WebSocket gateway) üzerinden OpenClaw'a bağlanır.
C2C özel sohbet ve grup `@`-bahsetmeleri, zengin
medya (görseller, ses, video, dosyalar) desteğiyle birincil sohbet türleridir. Guild kanal mesajları yalnızca
metin ve uzak URL görselleri için desteklenir; ses, video, dosya yüklemeleri ve yerel/Base64
görseller guild kanallarında kullanılamaz. Tepkiler ve ileti dizileri hiçbir yerde
desteklenmez.

Durum: resmi indirilebilir plugin.

## Kurulum

```bash
openclaw plugins install @openclaw/qqbot
```

## Ayarlama

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve kaydolmak / oturum açmak için QR kodunu
   telefonunuzdaki QQ ile tarayın.
2. Yeni bir QQ botu oluşturmak için **Create Bot** seçeneğine tıklayın.
3. Botun ayarlar sayfasında **AppID** ve **AppSecret** değerlerini bulup kopyalayın.

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

Sihirbaz, AppID/AppSecret değerlerini elle yazmaya alternatif olarak QR koduyla bağlama
seçeneği de sunar: bağlamayı tamamlamak için kodu, hedef QQ Bot'a bağlı telefon uygulamasıyla
tarayın. OpenClaw, döndürülen kimlik bilgilerini hesabın yapılandırma
kapsamında kalıcı olarak saklar.

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

Ortam SecretRef AppSecret:

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

- `openclaw channels add --channel qqbot --token-file ...` yalnızca AppSecret'i ayarlar;
  `appId` yapılandırmada veya `QQBOT_APP_ID` içinde önceden ayarlanmış olmalıdır.
- `clientSecret` düz metin dizesini, dosya yolunu (`clientSecretFile`)
  veya yapılandırılmış bir SecretRef nesnesini kabul eder.
- Eski `secretref:...` / `secretref-env:...` işaretçi dizeleri
  `clientSecret` için reddedilir; bunun yerine yapılandırılmış bir SecretRef nesnesi kullanın.

### Akış

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // blok akışı: "partial" (varsayılan) veya "off"
        nativeTransport: true, // DM'ler için QQ'nun resmi C2C stream_messages API'sini kullan
      },
    },
  },
}
```

- `streaming.mode: "off"`, hesap için blok akışını devre dışı bırakır.
- `streaming.nativeTransport: true`, C2C (DM) yanıtlarını QQ'nun
  resmi `stream_messages` API'si üzerinden akıtır; grup/kanal hedefleri etkilenmez.
- Eski `streaming: true|false` skalerleri ve `streaming.c2cStreamApi` anahtarı,
  `openclaw doctor --fix` aracılığıyla bu yapıya geçirilir.
- `/bot-streaming on|off`, aynı yapılandırmayı bir DM'den açıp kapatır.

### Erişim politikası

- `allowFrom` / `groupAllowFrom`, C2C /
  grup bağlamlarında botla kimlerin sohbet edebileceğini denetler. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  uygulama modunu denetler. `allowFrom` somut (joker olmayan)
  bir giriş içerdiğinde `dmPolicy` varsayılan olarak `allowlist`, aksi hâlde `open` olur.
  `groupAllowFrom` veya `allowFrom` somut bir giriş içerdiğinde
  `groupPolicy` varsayılan olarak `allowlist`, aksi hâlde `open` olur.
- "Kimlik doğrulama: izin verilenler listesi" eğik çizgi komutları,
  `dmPolicy` / `groupPolicy` değerlerinden bağımsız olarak `allowFrom` içinde
  (veya grup çağrıları için `groupAllowFrom` içinde) açıkça belirtilmiş, joker olmayan bir giriş gerektirir — bkz. [Eğik çizgi komutları](#slash-commands).

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

Her hesap, `appId` ile anahtarlanan yalıtılmış bir WebSocket bağlantısına, API istemcisine ve token
önbelleğine sahiptir. Tek bir Gateway altında birkaç bot çalıştırıldığında
tanılamaların birbirinden ayrılabilmesi için günlük satırları sahip hesabın kimliğiyle etiketlenir.

CLI aracılığıyla ikinci bir bot ekleyin:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Grup sohbetleri

Grup desteği, görünen adları değil QQ grup OpenID'lerini kullanır. Botu bir
gruba ekleyin, ardından bottan bahsedin veya grubu bahsetme olmadan çalışacak şekilde yapılandırın.

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

`groups["*"]` her grup için varsayılanları ayarlar; somut bir `groups.GROUP_OPENID`
girişi, bir grup için bu varsayılanları geçersiz kılar. Grup ayarları:

| Alan                  | Varsayılan       | Açıklama                                                                                           |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Bot yanıt vermeden önce `@`-bahsetmesi gerektirir.                                                 |
| `commandLevel`        | `all`            | Grupta hangi yerleşik eğik çizgi komutlarının çalışabileceği (aşağıya bakın).                       |
| `ignoreOtherMentions` | `false`          | Başka birinden bahseden ancak bottan bahsetmeyen mesajları bırakır.                                 |
| `historyLimit`        | `50`             | Bir sonraki bahsetmeli tur için bağlam olarak tutulan son bahsetmesiz mesajlar. `0` geçmişi devre dışı bırakır. |
| `tools`               | —                | Grubun tamamı için araçlara izin verir/reddeder.                                                    |
| `toolsBySender`       | —                | Gönderen başına araç geçersiz kılmaları; bkz. [Gruplar](/tr/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | openid öneki     | Günlüklerde ve grup bağlamında kullanılan kolay anlaşılır etiket.                                   |
| `prompt`              | yerleşik varsayılan | Aracı bağlamına eklenen grup başına davranış istemi.                                              |

`commandLevel` şunları kabul eder:

| Düzey    | Davranış                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Mevcut yerleşik komutlar kullanılabilir durumda kalır. Bazıları menülerde gizli kalır, ancak yetkili kullanıcılar bunları grupta çalıştırmaya devam edebilir. |
| `safety` | `/help`, `/btw`, `/stop` grupta görünür kalır; hassas komutlar (`/config`, `/tools`, `/bash` vb.) özel sohbette çalıştırılmalıdır. |
| `strict` | Yalnızca katı çalışma için gerekli grup oturumu denetimlerine izin verilir. `/stop` çalışmaya devam eder; böylece yetkili bir gönderen etkin bir çalışmayı kesintiye uğratabilir. |

Eski QQBot `toolPolicy` girişleri kullanımdan kaldırılmıştır. Bunları `tools` biçimine geçirmek için `openclaw doctor --fix` komutunu çalıştırın.

Etkinleştirme modları `mention` ve `always` şeklindedir. `requireMention: true`,
`mention` ile; `requireMention: false` ise `always` ile eşleşir. Oturum düzeyinde bir etkinleştirme
geçersiz kılması varsa yapılandırmaya üstün gelir.

Gelen kuyruğu eş başınadır. Grup eşleri daha büyük bir kuyruk sınırına sahiptir (doğrudan
eşler için 20 yerine 50); kuyruk dolduğunda insan mesajlarından önce bot tarafından yazılan mesajları
çıkarır ve normal grup mesajı patlamalarını ilişkilendirilmiş tek bir turda birleştirir. Eğik çizgi
komutları, herhangi bir birleştirme toplu işleminden bağımsız olarak tek tek çalışır.

### Ses (STT / TTS)

STT ve TTS, öncelikli geri dönüşle iki düzeyli yapılandırmayı destekler:

| Ayar    | Plugin'e özgü                                           | Çerçeve geri dönüşü            |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Devre dışı bırakmak için ikisinden birinde `enabled: false` değerini ayarlayın. Hesap düzeyindeki TTS geçersiz kılmaları,
`messages.tts` ile aynı yapıyı kullanır ve kanal/genel TTS yapılandırmasının üzerine derin birleştirme yapar.

STT istekleri varsayılan olarak 60 saniye sonra zaman aşımına uğrar. Plugin'e özgü STT,
seçilen `models.providers.<id>.timeoutSeconds` geçersiz kılmasını kullanır. Çerçeve ses STT'si
önce `tools.media.audio.models[0].timeoutSeconds`, ardından
`tools.media.audio.timeoutSeconds`, son olarak seçilen sağlayıcı geçersiz kılmasını kullanır.

Gelen QQ ses ekleri, ham ses dosyaları genel `MediaPaths` dışında tutulurken
aracılara ses medyası meta verileri olarak sunulur. Düz metin bir yanıttaki `[[audio_as_voice]]`,
TTS yapılandırıldığında TTS sentezler ve yerel bir QQ sesli mesajı gönderir.

Giden ses yükleme/dönüştürme davranışı da
`channels.qqbot.audioFormatPolicy` ile ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimleri

| Biçim                      | Açıklama           |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Özel sohbet (C2C)  |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti       |
| `qqbot:channel:CHANNEL_ID` | Guild kanalı       |

<Note>
Her botun kendi kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID, Bot B üzerinden mesaj göndermek için **kullanılamaz**.
</Note>

## Eğik çizgi komutları

Yapay zekâ kuyruğundan önce yakalanan yerleşik komutlar:

| Komut                | Kimlik doğrulama | Kapsam        | Açıklama                                                                       |
| -------------------- | ----------------- | ------------- | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —                 | tümü          | Gecikme testi                                                                  |
| `/bot-help`          | —                 | tümü          | Tüm komutları listele                                                          |
| `/bot-me`            | —                 | yalnızca özel | `allowFrom` / `groupAllowFrom` kurulumu için gönderenin QQ kullanıcı kimliğini (openid) göster |
| `/bot-version`       | —                 | yalnızca özel | OpenClaw framework sürümünü ve plugin sürümünü göster                          |
| `/bot-upgrade`       | —                 | yalnızca özel | QQBot yükseltme kılavuzu bağlantısını göster                                   |
| `/bot-approve`       | izin listesi      | yalnızca özel | Komut yürütme onayı yapılandırmasını yönet (açık / kapalı / her zaman / sıfırla / durum) |
| `/bot-logs`          | izin listesi      | yalnızca özel | Son Gateway günlüklerini dosya olarak dışa aktar                               |
| `/bot-clear-storage` | izin listesi      | yalnızca özel | QQBot medya dizinindeki önbelleğe alınmış indirmeleri sil                      |
| `/bot-streaming`     | izin listesi      | yalnızca özel | C2C akış yanıtlarını aç veya kapat                                              |
| `/bot-group-allways` | izin listesi      | yalnızca özel | Varsayılan grup etkinleştirme modunu değiştir (bahsetme gerekli / her zaman açık) |

Kullanım yardımı için herhangi bir komuta `?` ekleyin (örneğin `/bot-upgrade ?`).

"Kimlik doğrulama: izin listesi" komutları ayrıca gönderenin openid değerinin,
açıkça joker karakter içermeyen bir `allowFrom` listesinde bulunmasını gerektirir
(gruptan verilen komutlarda `groupAllowFrom` önceliklidir; bulunamazsa
`allowFrom` kullanılır). `allowFrom: ["*"]` joker karakteri sohbete izin
verir ancak bu komutlara izin vermez. Bunlardan biri özel sohbet dışında veya
yetkilendirme olmadan çalıştırıldığında mesaj sessizce yok sayılmak yerine bir
ipucu döndürülür.

`/bot-me`, `/bot-version` ve `/bot-upgrade` yalnızca özel sohbette kullanılabilir,
ancak izin listesi gerektirmez; herhangi bir C2C göndereni bunları çalıştırabilir.

QQ Bot yürütme onayları varsayılan aynı sohbet yedeğini kullandığında, yerel
onay düğmesi tıklamaları da açıkça joker karakter içermeyen aynı komut izin
listesine uyar. Daha geniş komut erişimi vermeden yalnızca onay erişimi vermek
için `channels.qqbot.execApprovals.approvers` yapılandırmasını kullanın. Yerel yürütme
onayları varsayılan olarak etkindir.

## Medya ve depolama

- Gelen, giden ve Gateway köprüsü medyaları, `~/.openclaw/media/qqbot` altında tek bir
  yük kökünü paylaşır (`OPENCLAW_HOME` ayarlandığında buna uyulur); böylece
  yüklemeler, indirmeler ve kod dönüştürme önbellekleri korunan tek bir dizinde tutulur.
- C2C ve grup hedeflerine zengin medya teslimi tek bir `sendMedia`
  yolu üzerinden gerçekleştirilir. 5&nbsp;MiB veya daha büyük yerel dosyalar ve
  bellek içi arabellekler QQ'nun parçalı yükleme uç noktalarını; daha küçük yükler
  ile uzak URL/Base64 kaynakları ise tek seferlik yükleme API'sini kullanır.
- Bir çalışırken yükseltme, `openclaw.json` yazımı tamamlanmadan Gateway'i
  kesintiye uğratırsa plugin, sonraki başlangıçta bu hesap için bilinen son
  `appId` / `clientSecret` değerlerini dahili bir anlık görüntüden
  geri yükler (kasıtlı bir yapılandırma değişikliğinin üzerine hiçbir zaman
  yazmaz); böylece QR kodunun yeniden taranması gerekmez.

## Sorun giderme

- **Gateway başlamıyor / gelen mesaj yok:** `appId` ve
  `clientSecret` değerlerinin doğru olduğunu ve botun QQ Open Platform'da
  etkinleştirildiğini doğrulayın. Eksik kimlik bilgisi, "QQBot yapılandırılmadı
  (appId veya clientSecret eksik)" hatası olarak gösterilir.
- **`--token-file` ile kurulum hâlâ yapılandırılmamış görünüyor:** `--token-file`
  yalnızca AppSecret değerini ayarlar. `appId` yine de yapılandırmada
  veya `QQBOT_APP_ID` içinde ayarlanmalıdır.
- **Ani grup yanıtları çakışıyor:** bir eşin kuyruğu dolduğunda gelen ileti
  kuyruğu, bot tarafından yazılan iletileri insan iletilerinden önce çıkarır ve
  normal (komut olmayan) grup iletilerinin ani akışlarını, göndereni belirtilmiş
  tek bir etkileşimde birleştirir; böylece bot ileti seli insan iletilerinin
  işlenmesini engellememelidir.
- **Proaktif mesajlar ulaşmıyor:** kullanıcı yakın zamanda etkileşimde
  bulunmadıysa QQ, bot tarafından başlatılan mesajları engelleyebilir.
- **Ses yazıya dökülmüyor:** STT'nin yapılandırıldığından ve sağlayıcıya
  erişilebildiğinden emin olun.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal sorunlarını giderme](/tr/channels/troubleshooting)
