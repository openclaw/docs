---
read_when:
    - OpenClaw'ı QQ'ya bağlamak istiyorsunuz
    - QQ Bot kimlik bilgileri kurulumuna ihtiyacınız var
    - QQ Bot grup veya özel sohbet desteği istiyorsunuz
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ Bot
x-i18n:
    generated_at: "2026-04-22T04:20:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49a5ae5615935a435a69748a3c4465ae8c33d3ab84db5e37fd8beec70506ce36
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot, resmi QQ Bot API (WebSocket gateway) aracılığıyla OpenClaw'a bağlanır. Bu
plugin, zengin medya (görseller, ses, video, dosyalar) ile C2C özel sohbetini, grup @mesajlarını ve sunucu kanal mesajlarını destekler.

Durum: paketle birlikte gelen plugin. Doğrudan mesajlar, grup sohbetleri, sunucu kanalları ve
medya desteklenir. Tepkiler ve ileti dizileri desteklenmez.

## Paketle birlikte gelen plugin

Mevcut OpenClaw sürümleri QQ Bot'u paketle birlikte sunar; bu nedenle normal paketlenmiş derlemelerde
ayrı bir `openclaw plugins install` adımı gerekmez.

## Kurulum

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve
   kaydolmak / oturum açmak için telefonunuzdaki QQ ile QR kodunu tarayın.
2. Yeni bir QQ bot oluşturmak için **Create Bot** seçeneğine tıklayın.
3. Bot ayarları sayfasında **AppID** ve **AppSecret** değerlerini bulun ve kopyalayın.

> AppSecret düz metin olarak saklanmaz — sayfadan kaydetmeden ayrılırsanız,
> yenisini oluşturmanız gerekir.

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

En düşük düzey yapılandırma:

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
- `openclaw channels add --channel qqbot --token-file ...` yalnızca
  AppSecret sağlar; AppID zaten yapılandırmada veya `QQBOT_APP_ID` içinde ayarlanmış olmalıdır.
- `clientSecret`, düz metin dizenin yanı sıra SecretRef girdisini de kabul eder.

### Çoklu hesap kurulumu

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
belirteç önbelleği tutar (`appId` ile yalıtılmıştır).

CLI üzerinden ikinci bir bot ekleyin:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Ses (STT / TTS)

STT ve TTS desteği, öncelikli geri dönüş kullanan iki düzeyli yapılandırmayı destekler:

| Ayar | Plugin'e özgü      | Framework geri dönüşü         |
| ------- | -------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

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
    },
  },
}
```

Devre dışı bırakmak için ikisinden birinde `enabled: false` ayarlayın.

Giden ses yükleme/dönüştürme davranışı ayrıca
`channels.qqbot.audioFormatPolicy` ile ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimler

| Biçim                      | Açıklama           |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Özel sohbet (C2C)  |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti       |
| `qqbot:channel:CHANNEL_ID` | Sunucu kanalı      |

> Her botun kendine ait bir kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID,
> Bot B üzerinden mesaj göndermek için **kullanılamaz**.

## Slash komutları

AI kuyruğundan önce yakalanan yerleşik komutlar:

| Komut         | Açıklama                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Gecikme testi                                                                                             |
| `/bot-version` | OpenClaw framework sürümünü gösterir                                                                      |
| `/bot-help`    | Tüm komutları listeler                                                                                    |
| `/bot-upgrade` | QQBot yükseltme kılavuzu bağlantısını gösterir                                                            |
| `/bot-logs`    | Son gateway günlüklerini bir dosya olarak dışa aktarır                                                    |
| `/bot-approve` | Bekleyen bir QQ Bot eylemini (örneğin bir C2C veya grup yüklemesini onaylama) yerel akış üzerinden onaylar. |

Kullanım yardımı için herhangi bir komutun sonuna `?` ekleyin (örneğin `/bot-upgrade ?`).

## Motor mimarisi

QQ Bot, plugin içinde kendi kendine yeterli bir motor olarak gelir:

- Her hesap, `appId` ile anahtarlanan yalıtılmış bir kaynak yığınına (WebSocket bağlantısı, API istemcisi, belirteç önbelleği, medya depolama kökü) sahiptir. Hesaplar gelen/giden durumu asla paylaşmaz.
- Çoklu hesap günlükleyici, bir gateway altında birden fazla bot çalıştırdığınızda tanılamaların ayrı kalması için günlük satırlarını sahip hesapla etiketler.
- Gelen, giden ve gateway köprü yolları, `~/.openclaw/media` altında tek bir medya yük kökünü paylaşır; böylece yüklemeler, indirmeler ve dönüştürme önbellekleri alt sistem başına bir ağaç yerine tek bir korumalı dizin altında tutulur.
- Kimlik bilgileri, standart OpenClaw kimlik bilgisi anlık görüntülerinin parçası olarak yedeklenip geri yüklenebilir; motor, yeni bir QR kodu eşleştirmesi gerektirmeden geri yükleme sırasında her hesabın kaynak yığınını yeniden bağlar.

## QR kodu ile ilk kurulum

`AppID:AppSecret` değerini elle yapıştırmaya alternatif olarak motor, bir QQ Bot'u OpenClaw'a bağlamak için QR kodu ile ilk kurulum akışını destekler:

1. QQ Bot kurulum yolunu çalıştırın (örneğin `openclaw channels add --channel qqbot`) ve istendiğinde QR kodu akışını seçin.
2. Oluşturulan QR kodunu hedef QQ Bot'a bağlı telefon uygulaması ile tarayın.
3. Telefonda eşleştirmeyi onaylayın. OpenClaw, dönen kimlik bilgilerini doğru hesap kapsamı altında `credentials/` içine kaydeder.

Botun kendisi tarafından oluşturulan onay istemleri (örneğin, QQ Bot API tarafından sunulan "bu eyleme izin verilsin mi?" akışları), ham QQ istemcisi üzerinden yanıt vermek yerine `/bot-approve` ile kabul edebileceğiniz yerel OpenClaw istemleri olarak görünür.

## Sorun giderme

- **Bot "gone to Mars" diye yanıt veriyor:** kimlik bilgileri yapılandırılmamış veya Gateway başlatılmamış.
- **Gelen mesaj yok:** `appId` ve `clientSecret` değerlerinin doğru olduğunu ve
  botun QQ Open Platform üzerinde etkin olduğunu doğrulayın.
- **`--token-file` ile kurulum hâlâ yapılandırılmamış görünüyor:** `--token-file` yalnızca
  AppSecret ayarlar. Yine de yapılandırmada veya `QQBOT_APP_ID` içinde `appId` gereklidir.
- **Proaktif mesajlar ulaşmıyor:** kullanıcı yakın zamanda etkileşimde bulunmadıysa
  QQ bot tarafından başlatılan mesajları engelleyebilir.
- **Ses metne dönüştürülmüyor:** STT'nin yapılandırıldığından ve sağlayıcının erişilebilir olduğundan emin olun.
