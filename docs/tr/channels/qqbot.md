---
read_when:
    - OpenClaw'ı QQ'ya bağlamak istiyorsunuz
    - QQ Bot kimlik bilgilerini ayarlamanız gerekiyor
    - QQ Bot grup veya özel sohbet desteği istiyorsunuz
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ botu
x-i18n:
    generated_at: "2026-05-04T02:21:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e17fa0da2f6939ed28cac5f13b3e37e6c63b87a10250ff213f7a86685a6141d6
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot, resmi QQ Bot API'si (WebSocket gateway) üzerinden OpenClaw'a bağlanır. Plugin; C2C özel sohbeti, grup @mesajlarını ve zengin medyayla (görüntüler, ses, video, dosyalar) guild kanal mesajlarını destekler.

Durum: indirilebilir Plugin. Doğrudan mesajlar, grup sohbetleri, guild kanalları ve medya desteklenir. Tepkiler ve iş parçacıkları desteklenmez.

## Kurulum

Kurulumdan önce QQ Bot'u yükleyin:

```bash
openclaw plugins install @openclaw/qqbot
```

## Ayarlama

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve kaydolmak / oturum açmak için QR kodunu
   telefonunuzdaki QQ ile tarayın.
2. Yeni bir QQ botu oluşturmak için **Create Bot** düğmesine tıklayın.
3. Botun ayarlar sayfasında **AppID** ve **AppSecret** değerlerini bulun ve kopyalayın.

> AppSecret düz metin olarak saklanmaz; kaydetmeden sayfadan ayrılırsanız
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
- `openclaw channels add --channel qqbot --token-file ...` yalnızca
  AppSecret sağlar; AppID yapılandırmada veya `QQBOT_APP_ID` içinde zaten ayarlanmış olmalıdır.
- `clientSecret`, yalnızca düz metin dizesi değil, SecretRef girdisini de kabul eder.
- Eski `secretref:/...` işaretçi dizeleri geçerli `clientSecret` değerleri değildir;
  yukarıdaki örnekteki gibi yapılandırılmış SecretRef nesneleri kullanın.

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

Her hesap kendi WebSocket bağlantısını başlatır ve bağımsız bir token önbelleği
tutar (`appId` ile yalıtılır).

CLI üzerinden ikinci bir bot ekleyin:

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

`groups["*"]` her grup için varsayılanları ayarlar ve somut bir
`groups.GROUP_OPENID` girdisi bu varsayılanları bir grup için geçersiz kılar. Grup
ayarları şunları içerir:

- `requireMention`: bot yanıtlamadan önce @bahsetme gerektirir. Varsayılan: `true`.
- `ignoreOtherMentions`: başka birinden bahsedip bottan bahsetmeyen mesajları bırakır.
- `historyLimit`: bir sonraki bahsedilmiş tur için son bahsetmesiz grup mesajlarını bağlam olarak tutar. Devre dışı bırakmak için `0` olarak ayarlayın.
- `toolPolicy`: grup kapsamlı araçlar için `full`, `restricted` veya `none`.
- `name`: günlüklerde ve grup bağlamında kullanılan kolay okunur etiket.
- `prompt`: ajan bağlamına eklenen grup başına davranış istemi.

Etkinleştirme modları `mention` ve `always` değerleridir. `requireMention: true`
`mention` değerine; `requireMention: false` ise `always` değerine eşlenir. Varsa oturum düzeyindeki etkinleştirme
geçersiz kılması, yapılandırmaya üstün gelir.

Gelen kuyruk eş başınadır. Grup eşleri daha büyük bir kuyruk sınırı alır, dolduğunda insan
mesajlarını bot tarafından yazılmış konuşmaların önünde tutar ve normal
grup mesajı patlamalarını tek bir atıflı tura birleştirir. Slash komutları yine tek tek çalışır.

### Ses (STT / TTS)

STT ve TTS, öncelikli geri dönüşle iki düzeyli yapılandırmayı destekler:

| Ayar | Plugin'e özgü                                           | Framework geri dönüşü         |
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

Devre dışı bırakmak için herhangi birinde `enabled: false` ayarlayın.
Hesap düzeyindeki TTS geçersiz kılmaları `messages.tts` ile aynı şekli kullanır ve kanal/genel TTS yapılandırmasının
üzerine derin birleştirme yapar.

Gelen QQ ses ekleri, ham ses dosyaları genel `MediaPaths` dışında tutulurken
ajanlara ses medyası meta verisi olarak sunulur. TTS yapılandırıldığında
`[[audio_as_voice]]` düz metin yanıtları TTS sentezler ve yerel bir QQ ses mesajı gönderir.

Giden ses yükleme/kod dönüştürme davranışı
`channels.qqbot.audioFormatPolicy` ile de ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimler

| Biçim                     | Açıklama           |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Özel sohbet (C2C)  |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti       |
| `qqbot:channel:CHANNEL_ID` | Guild kanalı       |

> Her botun kendi kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID,
> Bot B üzerinden mesaj göndermek için **kullanılamaz**.

## Slash komutları

AI kuyruğundan önce yakalanan yerleşik komutlar:

| Komut          | Açıklama                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Gecikme testi                                                                                            |
| `/bot-version` | OpenClaw framework sürümünü göster                                                                       |
| `/bot-help`    | Tüm komutları listele                                                                                    |
| `/bot-me`      | `allowFrom`/`groupAllowFrom` ayarlaması için gönderenin QQ kullanıcı kimliğini (openid) göster           |
| `/bot-upgrade` | QQBot yükseltme kılavuzu bağlantısını göster                                                            |
| `/bot-logs`    | Son gateway günlüklerini dosya olarak dışa aktar                                                         |
| `/bot-approve` | Bekleyen bir QQ Bot eylemini (örneğin C2C veya grup yüklemesini onaylama) yerel akış üzerinden onayla. |

Kullanım yardımı için herhangi bir komuta `?` ekleyin (örneğin `/bot-upgrade ?`).

Yönetici komutları (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) yalnızca doğrudan mesajda çalışır ve gönderenin openid değerinin açık, joker olmayan bir `allowFrom` listesinde bulunmasını gerektirir. Joker `allowFrom: ["*"]` sohbeti izinli kılar ancak yönetici komutu erişimi vermez. Grup mesajları önce `groupAllowFrom` ile eşleşir ve sonra `allowFrom` değerine geri döner. Bir yönetici komutunu grupta çalıştırmak, sessizce bırakmak yerine bir ipucu döndürür.

## Motor mimarisi

QQ Bot, Plugin içinde kendi kendine yeterli bir motor olarak gelir:

- Her hesap, `appId` ile anahtarlanan yalıtılmış bir kaynak yığınına (WebSocket bağlantısı, API istemcisi, token önbelleği, medya depolama kökü) sahiptir. Hesaplar gelen/giden durumu asla paylaşmaz.
- Çok hesaplı günlükleyici, birkaç botu tek bir gateway altında çalıştırdığınızda tanılamaların ayrı kalması için günlük satırlarını sahip hesapla etiketler.
- Gelen, giden ve gateway köprü yolları `~/.openclaw/media` altında tek bir medya yükü kökü paylaşır; böylece yüklemeler, indirmeler ve kod dönüştürme önbellekleri alt sistem başına bir ağaç yerine tek bir korumalı dizin altında yer alır.
- Zengin medya teslimi, C2C ve grup hedefleri için tek bir `sendMedia` yolundan geçer. Büyük dosya eşiğinin üzerindeki yerel dosyalar ve arabellekler QQ'nun parçalı yükleme uç noktalarını kullanırken daha küçük yükler tek seferlik medya API'sini kullanır.
- Kimlik bilgileri, standart OpenClaw kimlik bilgisi anlık görüntülerinin parçası olarak yedeklenebilir ve geri yüklenebilir; motor, yeni bir QR kodu eşleştirmesi gerektirmeden geri yüklemede her hesabın kaynak yığınını yeniden bağlar.

## QR koduyla ilk katılım

`AppID:AppSecret` değerini elle yapıştırmaya alternatif olarak motor, bir QQ Bot'u OpenClaw'a bağlamak için QR kodlu ilk katılım akışını destekler:

1. QQ Bot ayarlama yolunu çalıştırın (örneğin `openclaw channels add --channel qqbot`) ve istendiğinde QR kod akışını seçin.
2. Oluşturulan QR kodunu hedef QQ Bot'a bağlı telefon uygulamasıyla tarayın.
3. Telefonda eşleştirmeyi onaylayın. OpenClaw döndürülen kimlik bilgilerini doğru hesap kapsamı altında `credentials/` içine kalıcı hale getirir.

Botun kendisi tarafından oluşturulan onay istemleri (örneğin, QQ Bot API tarafından sunulan "bu eyleme izin verilsin mi?" akışları), ham QQ istemcisi üzerinden yanıtlamak yerine `/bot-approve` ile kabul edebileceğiniz yerel OpenClaw istemleri olarak görünür.

## Sorun giderme

- **Bot "gone to Mars" yanıtı veriyor:** kimlik bilgileri yapılandırılmamış veya Gateway başlatılmamış.
- **Gelen mesaj yok:** `appId` ve `clientSecret` değerlerinin doğru olduğunu ve
  botun QQ Open Platform üzerinde etkinleştirildiğini doğrulayın.
- **Tekrarlanan kendi kendine yanıtlar:** OpenClaw, QQ giden ref dizinlerini
  bot tarafından yazılmış olarak kaydeder ve mevcut `msgIdx` değeri aynı bot hesabıyla eşleşen gelen olayları yok sayar.
  Bu, kullanıcıların önceki bot mesajlarından alıntı yapmasına veya onlara yanıt vermesine hâlâ izin verirken platform yankı döngülerini önler.
- **`--token-file` ile ayarlama hâlâ yapılandırılmamış görünüyor:** `--token-file` yalnızca
  AppSecret değerini ayarlar. Yapılandırmada veya `QQBOT_APP_ID` içinde yine de `appId` gerekir.
- **Proaktif mesajlar ulaşmıyor:** kullanıcı yakın zamanda etkileşimde bulunmadıysa QQ bot tarafından başlatılan mesajları yakalayabilir.
- **Ses yazıya dökülmüyor:** STT'nin yapılandırıldığından ve sağlayıcının erişilebilir olduğundan emin olun.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal sorun giderme](/tr/channels/troubleshooting)
