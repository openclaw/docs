---
read_when:
    - OpenClaw'ı QQ'ya bağlamak istiyorsunuz
    - QQ Bot kimlik bilgileri kurulumuna ihtiyacınız var
    - QQ Bot için grup veya özel sohbet desteği istiyorsunuz
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ botu
x-i18n:
    generated_at: "2026-05-02T08:47:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d37dd5846ecf07b1e3e8729faa23877780abdd40577b8dab61ea1ac9399885a
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot, resmi QQ Bot API'si (WebSocket Gateway) üzerinden OpenClaw'a bağlanır. Plugin, zengin medya (görüntüler, ses, video, dosyalar) ile C2C özel sohbeti, grup @mesajlarını ve guild kanal mesajlarını destekler.

Durum: indirilebilir Plugin. Doğrudan mesajlar, grup sohbetleri, guild kanalları ve medya desteklenir. Tepkiler ve iş parçacıkları desteklenmez.

## Kurulum

Kurulumdan önce QQ Bot'u yükleyin:

```bash
openclaw plugins install @openclaw/qqbot
```

## Ayarlama

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve kaydolmak / oturum açmak için QR kodunu
   telefonunuzdaki QQ ile tarayın.
2. Yeni bir QQ bot oluşturmak için **Create Bot** düğmesine tıklayın.
3. Botun ayarlar sayfasında **AppID** ve **AppSecret** değerlerini bulun ve kopyalayın.

> AppSecret düz metin olarak saklanmaz — kaydetmeden sayfadan ayrılırsanız
> yeni bir tane yeniden oluşturmanız gerekir.

4. Kanalı ekleyin:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway'i yeniden başlatın.

Etkileşimli ayarlama yolları:

```bash
openclaw channels add
openclaw configure --section channels
```

## Yapılandırma

En küçük yapılandırma:

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

Varsayılan hesap ortam değişkenleri:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

Dosya destekli AppSecret:

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

Notlar:

- Ortam yedeği yalnızca varsayılan QQ Bot hesabına uygulanır.
- `openclaw channels add --channel qqbot --token-file ...` yalnızca
  AppSecret sağlar; AppID yapılandırmada veya `QQBOT_APP_ID` içinde zaten ayarlanmış olmalıdır.
- `clientSecret`, yalnızca düz metin dize değil, SecretRef girdisini de kabul eder.

### Çok hesaplı ayarlama

Tek bir OpenClaw örneği altında birden fazla QQ bot çalıştırın:

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

Her hesap kendi WebSocket bağlantısını başlatır ve bağımsız bir
token önbelleği tutar (`appId` ile yalıtılır).

CLI ile ikinci bir bot ekleyin:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Grup sohbetleri

QQ Bot grup sohbeti desteği, görünen adları değil QQ grup OpenID'lerini kullanır. Botu
bir gruba ekleyin, ardından ondan bahsedin veya grubu bahsetme olmadan çalışacak şekilde yapılandırın.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` her grup için varsayılanları belirler ve somut bir
`groups.GROUP_OPENID` girdisi, bu varsayılanları tek bir grup için geçersiz kılar. Grup
ayarları şunları içerir:

- `requireMention`: bot yanıtlamadan önce bir @bahsetme gerektirir. Varsayılan: `true`.
- `ignoreOtherMentions`: başka birinden bahseden ancak bottan bahsetmeyen mesajları düşürür.
- `historyLimit`: bir sonraki bahsedilen tur için son bahsetme olmayan grup mesajlarını bağlam olarak tutar. Devre dışı bırakmak için `0` ayarlayın.
- `toolPolicy`: grup kapsamlı araçlar için `full`, `restricted` veya `none`.
- `name`: günlüklerde ve grup bağlamında kullanılan kolay okunur etiket.
- `prompt`: aracı bağlamına eklenen grup başına davranış istemi.

Etkinleştirme modları `mention` ve `always` değerleridir. `requireMention: true`
`mention` değerine eşlenir; `requireMention: false` ise `always` değerine eşlenir. Varsa oturum düzeyi etkinleştirme
geçersiz kılması yapılandırmaya üstün gelir.

Gelen sıra eş başınadır. Grup eşleri daha büyük bir sıra sınırı alır, sıra dolduğunda insan
mesajlarını bot tarafından yazılmış konuşmaların önünde tutar ve normal grup mesajlarının
ani kümelerini tek bir atıflı tura birleştirir. Eğik çizgi komutları yine tek tek çalışır.

### Ses (STT / TTS)

STT ve TTS, öncelik yedeğiyle iki düzeyli yapılandırmayı destekler:

| Ayar | Plugin'e özgü                                          | Framework yedeği              |
| ---- | ------------------------------------------------------ | ----------------------------- |
| STT  | `channels.qqbot.stt`                                   | `tools.media.audio.models[0]` |
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
        qq-main: {
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

Devre dışı bırakmak için ikisinde de `enabled: false` ayarlayın.
Hesap düzeyi TTS geçersiz kılmaları, `messages.tts` ile aynı şekli kullanır ve kanal/genel
TTS yapılandırmasının üzerine derin birleştirme uygular.

Gelen QQ ses ekleri, ham ses dosyaları genel `MediaPaths` dışında tutulurken
aracılara ses medyası meta verileri olarak sunulur. `[[audio_as_voice]]` düz
metin yanıtları, TTS yapılandırıldığında TTS sentezler ve yerel bir QQ ses mesajı
gönderir.

Giden ses yükleme/transcode davranışı ayrıca
`channels.qqbot.audioFormatPolicy` ile ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimler

| Biçim                     | Açıklama            |
| ------------------------- | ------------------- |
| `qqbot:c2c:OPENID`        | Özel sohbet (C2C)   |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti        |
| `qqbot:channel:CHANNEL_ID` | Guild kanalı        |

> Her botun kendi kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID,
> Bot B üzerinden mesaj göndermek için **kullanılamaz**.

## Eğik çizgi komutları

YZ sırasından önce yakalanan yerleşik komutlar:

| Komut          | Açıklama                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Gecikme testi                                                                                              |
| `/bot-version` | OpenClaw Framework sürümünü göster                                                                         |
| `/bot-help`    | Tüm komutları listele                                                                                      |
| `/bot-me`      | `allowFrom`/`groupAllowFrom` ayarlaması için gönderenin QQ kullanıcı kimliğini (openid) göster             |
| `/bot-upgrade` | QQBot yükseltme rehberi bağlantısını göster                                                                |
| `/bot-logs`    | Son Gateway günlüklerini dosya olarak dışa aktar                                                           |
| `/bot-approve` | Yerel akış üzerinden bekleyen bir QQ Bot eylemini onayla (örneğin, bir C2C veya grup yüklemesini onaylama). |

Kullanım yardımı için herhangi bir komuta `?` ekleyin (örneğin `/bot-upgrade ?`).

Yönetici komutları (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) yalnızca doğrudan mesajlarda kullanılabilir ve gönderenin openid değerinin açık, joker olmayan bir `allowFrom` listesinde olmasını gerektirir. Joker `allowFrom: ["*"]` sohbete izin verir ancak yönetici komutu erişimi vermez. Grup mesajları önce `groupAllowFrom` ile eşleştirilir ve olmazsa `allowFrom` değerine düşer. Bir grupta yönetici komutu çalıştırmak, sessizce düşürmek yerine bir ipucu döndürür.

## Motor mimarisi

QQ Bot, Plugin içinde kendi kendine yeterli bir motor olarak gelir:

- Her hesap, `appId` ile anahtarlanan yalıtılmış bir kaynak yığınına (WebSocket bağlantısı, API istemcisi, token önbelleği, medya depolama kökü) sahiptir. Hesaplar gelen/giden durumu asla paylaşmaz.
- Çok hesaplı günlükleyici, tek bir Gateway altında birkaç bot çalıştırdığınızda tanılamaların ayrı kalması için günlük satırlarını sahip olan hesapla etiketler.
- Gelen, giden ve Gateway köprü yolları `~/.openclaw/media` altında tek bir medya yükü kökünü paylaşır; böylece yüklemeler, indirmeler ve transcode önbellekleri alt sistem başına bir ağaç yerine tek bir korumalı dizine düşer.
- Zengin medya teslimi, C2C ve grup hedefleri için tek bir `sendMedia` yolundan geçer. Büyük dosya eşiğinin üzerindeki yerel dosyalar ve arabellekler QQ'nun parçalı yükleme uç noktalarını kullanırken daha küçük yükler tek seferlik medya API'sini kullanır.
- Kimlik bilgileri, standart OpenClaw kimlik bilgisi anlık görüntülerinin parçası olarak yedeklenip geri yüklenebilir; motor, yeni bir QR kod eşleştirmesi gerektirmeden her hesabın kaynak yığınını geri yüklemede yeniden bağlar.

## QR kodla ilk katılım

`AppID:AppSecret` değerini elle yapıştırmaya alternatif olarak motor, bir QQ Bot'u OpenClaw'a bağlamak için QR kodla ilk katılım akışını destekler:

1. QQ Bot ayarlama yolunu çalıştırın (örneğin `openclaw channels add --channel qqbot`) ve istendiğinde QR kod akışını seçin.
2. Oluşturulan QR kodunu hedef QQ Bot'a bağlı telefon uygulamasıyla tarayın.
3. Telefonda eşleştirmeyi onaylayın. OpenClaw, döndürülen kimlik bilgilerini doğru hesap kapsamında `credentials/` içine kalıcı olarak yazar.

Botun kendisi tarafından oluşturulan onay istemleri (örneğin, QQ Bot API tarafından sunulan "bu eyleme izin verilsin mi?" akışları), ham QQ istemcisi üzerinden yanıtlamak yerine `/bot-approve` ile kabul edebileceğiniz yerel OpenClaw istemleri olarak görünür.

## Sorun giderme

- **Bot "gone to Mars" yanıtı veriyor:** kimlik bilgileri yapılandırılmamış veya Gateway başlatılmamış.
- **Gelen mesaj yok:** `appId` ve `clientSecret` değerlerinin doğru olduğunu ve
  botun QQ Open Platform'da etkinleştirildiğini doğrulayın.
- **Tekrarlanan kendi kendine yanıtlar:** OpenClaw, QQ giden başvuru dizinlerini
  bot tarafından yazılmış olarak kaydeder ve mevcut `msgIdx` değeri aynı
  bot hesabıyla eşleşen gelen olayları yoksayar. Bu, kullanıcıların önceki bot mesajlarını
  alıntılamasına veya yanıtlamasına hâlâ izin verirken platform yankı döngülerini önler.
- **`--token-file` ile ayarlama hâlâ yapılandırılmamış görünüyor:** `--token-file` yalnızca
  AppSecret değerini ayarlar. Yapılandırmada veya `QQBOT_APP_ID` içinde hâlâ `appId` gerekir.
- **Proaktif mesajlar ulaşmıyor:** kullanıcı son zamanlarda etkileşimde bulunmadıysa QQ bot tarafından başlatılan mesajları engelleyebilir.
- **Ses yazıya dökülmüyor:** STT'nin yapılandırıldığından ve sağlayıcıya erişilebildiğinden emin olun.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal sorun giderme](/tr/channels/troubleshooting)
