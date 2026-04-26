---
read_when:
    - OpenClaw'ı QQ'ya bağlamak istiyorsunuz
    - QQ Bot kimlik bilgilerini ayarlamanız gerekiyor
    - QQ Bot grup veya özel sohbet desteği istiyorsunuz
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ botu
x-i18n:
    generated_at: "2026-04-26T11:24:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot, resmi QQ Bot API'si (WebSocket gateway) aracılığıyla OpenClaw'a bağlanır. Plugin, zengin medya (görseller, ses, video, dosyalar) ile C2C özel sohbeti, grup @mesajlarını ve sunucu kanal mesajlarını destekler.

Durum: paketle birlikte gelen Plugin. Doğrudan mesajlar, grup sohbetleri, sunucu kanalları ve medya desteklenir. Tepkiler ve ileti dizileri desteklenmez.

## Paketle birlikte gelen Plugin

Güncel OpenClaw sürümleri QQ Bot'u paketle birlikte sunar, bu nedenle normal paketlenmiş derlemelerde ayrıca `openclaw plugins install` adımı gerekmez.

## Kurulum

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve kaydolmak / giriş yapmak için telefonunuzdaki QQ ile QR kodunu tarayın.
2. Yeni bir QQ botu oluşturmak için **Create Bot** seçeneğine tıklayın.
3. Botun ayarlar sayfasında **AppID** ve **AppSecret** bilgilerini bulun ve kopyalayın.

> AppSecret düz metin olarak saklanmaz — sayfadan kaydetmeden ayrılırsanız yenisini yeniden üretmeniz gerekir.

4. Kanalı ekleyin:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway'i yeniden başlatın.

Etkileşimli kurulum yolları:

```bash
openclaw channels add
openclaw configure --section channels
```

## Yapılandırma

En az yapılandırma:

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

- Ortam geri dönüşü yalnızca varsayılan QQ Bot hesabı için geçerlidir.
- `openclaw channels add --channel qqbot --token-file ...` yalnızca AppSecret sağlar; AppID zaten yapılandırmada veya `QQBOT_APP_ID` içinde ayarlanmış olmalıdır.
- `clientSecret`, düz metin dizeye ek olarak SecretRef girdisini de kabul eder.

### Çoklu hesap kurulumu

Bir OpenClaw örneği altında birden çok QQ botu çalıştırın:

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

### Ses (STT / TTS)

STT ve TTS desteği, öncelik geri dönüşüyle iki düzeyli yapılandırmayı destekler:

| Ayar | Plugin'e özel                                           | Çerçeve geri dönüşü           |
| ---- | ------------------------------------------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
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

Devre dışı bırakmak için her iki tarafta da `enabled: false` ayarlayın.
Hesap düzeyindeki TTS geçersiz kılmaları, `messages.tts` ile aynı yapıyı kullanır ve kanal/genel TTS yapılandırmasının üzerine derin birleştirme yapar.

Gelen QQ ses ekleri, ham ses dosyalarını genel `MediaPaths` dışında tutarken aracılara ses medya meta verisi olarak sunulur. `[[audio_as_voice]]` düz metin yanıtları TTS sentezler ve TTS yapılandırıldığında yerel bir QQ sesli mesajı gönderir.

Giden ses yükleme/dönüştürme davranışı ayrıca `channels.qqbot.audioFormatPolicy` ile ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimleri

| Biçim                     | Açıklama          |
| ------------------------- | ----------------- |
| `qqbot:c2c:OPENID`        | Özel sohbet (C2C) |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti      |
| `qqbot:channel:CHANNEL_ID` | Sunucu kanalı     |

> Her botun kendine ait bir kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID, Bot B üzerinden mesaj göndermek için **kullanılamaz**.

## Slash komutları

Yapay zeka kuyruğundan önce yakalanan yerleşik komutlar:

| Komut         | Açıklama                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`   | Gecikme testi                                                                                                    |
| `/bot-version` | OpenClaw çerçeve sürümünü gösterir                                                                              |
| `/bot-help`   | Tüm komutları listeler                                                                                           |
| `/bot-upgrade` | QQBot yükseltme kılavuzu bağlantısını gösterir                                                                  |
| `/bot-logs`   | Son Gateway günlüklerini dosya olarak dışa aktarır                                                               |
| `/bot-approve` | Bekleyen bir QQ Bot eylemini (örneğin, bir C2C veya grup yüklemesini onaylama) yerel akış üzerinden onaylar. |

Kullanım yardımı için herhangi bir komutun sonuna `?` ekleyin (örneğin `/bot-upgrade ?`).

## Altyapı mimarisi

QQ Bot, Plugin içinde kendi kendine yeten bir altyapı olarak sunulur:

- Her hesap, `appId` ile anahtarlanan yalıtılmış bir kaynak yığınına (WebSocket bağlantısı, API istemcisi, belirteç önbelleği, medya depolama kökü) sahiptir. Hesaplar gelen/giden durumu asla paylaşmaz.
- Çoklu hesap günlükleyicisi, günlük satırlarını sahibi olan hesapla etiketler; böylece tek bir gateway altında birden fazla bot çalıştırdığınızda tanılama verileri ayrışmış kalır.
- Gelen, giden ve gateway köprüsü yolları `~/.openclaw/media` altında tek bir medya yük kökünü paylaşır; böylece yüklemeler, indirmeler ve dönüştürme önbellekleri alt sistem başına ayrı ağaçlar yerine tek bir korumalı dizine yerleşir.
- Kimlik bilgileri, standart OpenClaw kimlik bilgisi anlık görüntülerinin bir parçası olarak yedeklenip geri yüklenebilir; altyapı her hesabın kaynak yığınını geri yüklemede yeniden bağlar ve yeni bir QR kod eşleştirmesi gerektirmez.

## QR kod ile eşleştirme

`AppID:AppSecret` bilgisini elle yapıştırmaya alternatif olarak, altyapı bir QQ Bot'u OpenClaw'a bağlamak için QR kod ile eşleştirme akışını destekler:

1. QQ Bot kurulum yolunu çalıştırın (örneğin `openclaw channels add --channel qqbot`) ve istendiğinde QR kod akışını seçin.
2. Oluşturulan QR kodu, hedef QQ Bot ile ilişkili telefon uygulamasıyla tarayın.
3. Telefonda eşleştirmeyi onaylayın. OpenClaw dönen kimlik bilgilerini doğru hesap kapsamı altında `credentials/` içine kalıcı olarak kaydeder.

Botun kendisi tarafından üretilen onay istemleri (örneğin, QQ Bot API tarafından sunulan "bu eyleme izin verilsin mi?" akışları), ham QQ istemcisi üzerinden yanıt vermek yerine `/bot-approve` ile kabul edebileceğiniz yerel OpenClaw istemleri olarak görünür.

## Sorun giderme

- **Bot "gone to Mars" diye yanıt veriyor:** kimlik bilgileri yapılandırılmamış veya Gateway başlatılmamış.
- **Gelen mesaj yok:** `appId` ve `clientSecret` değerlerinin doğru olduğunu ve botun QQ Open Platform üzerinde etkin olduğunu doğrulayın.
- **Tekrarlanan kendi kendine yanıtlar:** OpenClaw, QQ giden ref indekslerini bot tarafından yazılmış olarak kaydeder ve geçerli `msgIdx` aynı bot hesabıyla eşleşen gelen olayları yok sayar. Bu, kullanıcıların önceki bot mesajlarını alıntılamasına veya yanıtlamasına izin verirken platform yankı döngülerini önler.
- **`--token-file` ile kurulum hâlâ yapılandırılmamış görünüyor:** `--token-file` yalnızca AppSecret ayarlar. Yine de yapılandırmada veya `QQBOT_APP_ID` içinde `appId` gerekir.
- **Proaktif mesajlar ulaşmıyor:** kullanıcı yakın zamanda etkileşim kurmadıysa QQ bot tarafından başlatılan mesajları engelleyebilir.
- **Ses yazıya dökülmüyor:** STT'nin yapılandırıldığından ve sağlayıcıya erişilebildiğinden emin olun.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal sorun giderme](/tr/channels/troubleshooting)
