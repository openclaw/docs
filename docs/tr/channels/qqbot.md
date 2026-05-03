---
read_when:
    - OpenClaw'u QQ'ya bağlamak istiyorsunuz
    - QQ Bot kimlik bilgilerini ayarlamanız gerekiyor
    - QQ Bot için grup veya özel sohbet desteği istiyorsunuz
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ botu
x-i18n:
    generated_at: "2026-05-03T21:27:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 471c24110bf0ab8896d22f5bb5932ac4e03ff5169560c99ba6b9d1ca4025d9a8
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot, resmi QQ Bot API'si (WebSocket ağ geçidi) üzerinden OpenClaw'a bağlanır. Plugin, zengin medyayla (görseller, ses, video, dosyalar) C2C özel sohbeti, grup @mesajlarını ve lonca kanal mesajlarını destekler.

Durum: indirilebilir Plugin. Doğrudan mesajlar, grup sohbetleri, lonca kanalları ve medya desteklenir. Tepkiler ve ileti dizileri desteklenmez.

## Kurulum

Kurulumdan önce QQ Bot'u yükleyin:

```bash
openclaw plugins install @openclaw/qqbot
```

## Ayarlama

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve kaydolmak / oturum açmak için QR kodunu telefonunuzdaki QQ ile tarayın.
2. Yeni bir QQ bot oluşturmak için **Create Bot** düğmesine tıklayın.
3. Botun ayarlar sayfasında **AppID** ve **AppSecret** değerlerini bulun ve kopyalayın.

> AppSecret düz metin olarak saklanmaz; kaydetmeden sayfadan ayrılırsanız
> yeni bir tane oluşturmanız gerekir.

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

- Ortam geri dönüşü yalnızca varsayılan QQ Bot hesabına uygulanır.
- `openclaw channels add --channel qqbot --token-file ...`, yalnızca
  AppSecret sağlar; AppID'nin yapılandırmada veya `QQBOT_APP_ID` içinde zaten ayarlanmış olması gerekir.
- `clientSecret`, yalnızca düz metin dizesini değil, SecretRef girişini de kabul eder.
- Eski `secretref:/...` işaret dizeleri geçerli `clientSecret` değerleri değildir;
  yukarıdaki örnekteki gibi yapılandırılmış SecretRef nesneleri kullanın.

### Çok hesaplı ayarlama

Tek bir OpenClaw örneği altında birden çok QQ bot çalıştırın:

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

Her hesap kendi WebSocket bağlantısını başlatır ve bağımsız bir belirteç önbelleği (`appId` ile yalıtılmış) tutar.

CLI üzerinden ikinci bir bot ekleyin:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Grup sohbetleri

QQ Bot grup sohbeti desteği, görünen adları değil QQ grubu OpenID'lerini kullanır. Botu bir gruba ekleyin, ardından ondan bahsedin veya grubu bahsetme olmadan çalışacak şekilde yapılandırın.

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

`groups["*"]` her grup için varsayılanları ayarlar ve somut bir
`groups.GROUP_OPENID` girdisi bu varsayılanları tek bir grup için geçersiz kılar. Grup ayarları şunları içerir:

- `requireMention`: bot yanıt vermeden önce @bahsetme gerektirir. Varsayılan: `true`.
- `ignoreOtherMentions`: botu değil başka birini anan mesajları bırakır.
- `historyLimit`: son bahsedilen sıraya bağlam olarak son bahsetme içermeyen grup mesajlarını saklar. Devre dışı bırakmak için `0` olarak ayarlayın.
- `toolPolicy`: grup kapsamlı araçlar için `full`, `restricted` veya `none`.
- `name`: günlüklerde ve grup bağlamında kullanılan kolay okunur etiket.
- `prompt`: ajan bağlamına eklenen grup başına davranış istemi.

Etkinleştirme modları `mention` ve `always` değerleridir. `requireMention: true`,
`mention` ile eşleşir; `requireMention: false`, `always` ile eşleşir. Varsa oturum düzeyindeki etkinleştirme geçersiz kılması yapılandırmaya üstün gelir.

Gelen kuyruk eş başınadır. Grup eşleri daha büyük bir kuyruk sınırı alır, dolduğunda insan mesajlarını bot tarafından yazılmış konuşmaların önünde tutar ve normal grup mesajı patlamalarını tek bir atıflı sıraya birleştirir. Eğik çizgi komutları yine tek tek çalışır.

### Ses (STT / TTS)

STT ve TTS, öncelikli geri dönüşle iki düzeyli yapılandırmayı destekler:

| Ayar | Plugin'e özgü                                           | Çerçeve geri dönüşü           |
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

Devre dışı bırakmak için ikisinden birinde `enabled: false` ayarlayın.
Hesap düzeyi TTS geçersiz kılmaları, `messages.tts` ile aynı yapıyı kullanır ve kanal/genel TTS yapılandırmasının üzerine derin birleştirme yapar.

Gelen QQ ses ekleri, ham ses dosyaları genel `MediaPaths` dışında tutulurken ajanlara ses medyası meta verisi olarak sunulur. `[[audio_as_voice]]` düz metin yanıtları, TTS yapılandırıldığında TTS sentezler ve yerel bir QQ sesli mesajı gönderir.

Giden ses yükleme/dönüştürme davranışı ayrıca
`channels.qqbot.audioFormatPolicy` ile ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimleri

| Biçim                      | Açıklama           |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Özel sohbet (C2C) |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti       |
| `qqbot:channel:CHANNEL_ID` | Lonca kanalı       |

> Her botun kendi kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID,
> Bot B üzerinden mesaj göndermek için **kullanılamaz**.

## Eğik çizgi komutları

AI kuyruğundan önce yakalanan yerleşik komutlar:

| Komut          | Açıklama                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Gecikme testi                                                                                            |
| `/bot-version` | OpenClaw çerçeve sürümünü gösterir                                                                       |
| `/bot-help`    | Tüm komutları listeler                                                                                   |
| `/bot-me`      | `allowFrom`/`groupAllowFrom` ayarlaması için gönderenin QQ kullanıcı kimliğini (openid) gösterir         |
| `/bot-upgrade` | QQBot yükseltme kılavuzu bağlantısını gösterir                                                           |
| `/bot-logs`    | Son gateway günlüklerini dosya olarak dışa aktarır                                                       |
| `/bot-approve` | Bekleyen bir QQ Bot eylemini (örneğin C2C veya grup yüklemesini onaylama) yerel akış üzerinden onaylar. |

Kullanım yardımı için herhangi bir komutun sonuna `?` ekleyin (örneğin `/bot-upgrade ?`).

Yönetici komutları (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) yalnızca doğrudan mesajda kullanılabilir ve gönderenin openid değerinin açık, joker karakter içermeyen bir `allowFrom` listesinde olmasını gerektirir. Joker karakterli `allowFrom: ["*"]` sohbete izin verir ancak yönetici komutu erişimi vermez. Grup mesajları önce `groupAllowFrom` ile eşleştirilir ve ardından `allowFrom` değerine geri döner. Bir grupta yönetici komutu çalıştırmak, sessizce bırakmak yerine bir ipucu döndürür.

## Motor mimarisi

QQ Bot, Plugin içinde kendi kendine yeterli bir motor olarak gelir:

- Her hesap, `appId` ile anahtarlanan yalıtılmış bir kaynak yığınına (WebSocket bağlantısı, API istemcisi, belirteç önbelleği, medya depolama kökü) sahiptir. Hesaplar gelen/giden durumu hiçbir zaman paylaşmaz.
- Çok hesaplı günlükleyici, tek bir gateway altında birkaç bot çalıştırdığınızda tanılamaların ayrılabilir kalması için günlük satırlarını sahip hesapla etiketler.
- Gelen, giden ve gateway köprüsü yolları `~/.openclaw/media` altında tek bir medya yükü kökünü paylaşır; böylece yüklemeler, indirmeler ve dönüştürme önbellekleri alt sistem başına ayrı bir ağaç yerine tek bir korumalı dizine düşer.
- Zengin medya teslimi, C2C ve grup hedefleri için tek bir `sendMedia` yolundan geçer. Büyük dosya eşiğinin üzerindeki yerel dosyalar ve arabellekler QQ'nun parçalı yükleme uç noktalarını kullanırken daha küçük yükler tek seferlik medya API'sini kullanır.
- Kimlik bilgileri standart OpenClaw kimlik bilgisi anlık görüntülerinin parçası olarak yedeklenip geri yüklenebilir; motor, yeni bir QR kodu eşleştirmesi gerektirmeden geri yüklemede her hesabın kaynak yığınını yeniden bağlar.

## QR koduyla katılım

`AppID:AppSecret` değerini elle yapıştırmaya alternatif olarak motor, bir QQ Bot'u OpenClaw'a bağlamak için QR koduyla katılım akışını destekler:

1. QQ Bot ayarlama yolunu çalıştırın (örneğin `openclaw channels add --channel qqbot`) ve istendiğinde QR kodu akışını seçin.
2. Oluşturulan QR kodunu hedef QQ Bot'a bağlı telefon uygulamasıyla tarayın.
3. Eşleştirmeyi telefonda onaylayın. OpenClaw döndürülen kimlik bilgilerini doğru hesap kapsamı altında `credentials/` içine kalıcı olarak kaydeder.

Botun kendisi tarafından oluşturulan onay istemleri (örneğin QQ Bot API'si tarafından sunulan "bu eyleme izin verilsin mi?" akışları), ham QQ istemcisi üzerinden yanıtlamak yerine `/bot-approve` ile kabul edebileceğiniz yerel OpenClaw istemleri olarak görünür.

## Sorun giderme

- **Bot "gone to Mars" yanıtı veriyor:** kimlik bilgileri yapılandırılmamış veya Gateway başlatılmamış.
- **Gelen mesaj yok:** `appId` ve `clientSecret` değerlerinin doğru olduğunu ve
  botun QQ Open Platform üzerinde etkin olduğunu doğrulayın.
- **Tekrarlanan kendi kendine yanıtlar:** OpenClaw, QQ giden ref dizinlerini
  bot tarafından yazılmış olarak kaydeder ve mevcut `msgIdx` değeri aynı bot hesabıyla eşleşen gelen olayları yok sayar. Bu, kullanıcıların önceki bot mesajlarını alıntılamasına veya yanıtlamasına izin verirken platform yankı döngülerini önler.
- **`--token-file` ile ayarlama hâlâ yapılandırılmamış gösteriyor:** `--token-file` yalnızca
  AppSecret değerini ayarlar. Yapılandırmada veya `QQBOT_APP_ID` içinde hâlâ `appId` gerekir.
- **Proaktif mesajlar ulaşmıyor:** kullanıcı yakın zamanda etkileşimde bulunmadıysa QQ, bot tarafından başlatılan mesajları engelleyebilir.
- **Ses metne dökülmüyor:** STT'nin yapılandırıldığından ve sağlayıcıya erişilebildiğinden emin olun.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal sorun giderme](/tr/channels/troubleshooting)
