---
read_when:
    - OpenClaw'ı QQ'ya bağlamak istiyorsunuz
    - QQ Bot kimlik bilgilerini ayarlamanız gerekiyor
    - QQ Bot grup veya özel sohbet desteği istiyorsunuz
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ botu
x-i18n:
    generated_at: "2026-04-30T09:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 964a92021acc534b7ec2749670fedd0e8caa47d5edf67ced80f0a8fb3eda7600
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot, resmi QQ Bot API (WebSocket Gateway) üzerinden OpenClaw'a bağlanır. Plugin, zengin medya (görüntüler, ses, video, dosyalar) ile C2C özel sohbeti, grup @mesajlarını ve guild kanal mesajlarını destekler.

Durum: paketle birlikte gelen Plugin. Doğrudan mesajlar, grup sohbetleri, guild kanalları ve medya desteklenir. Tepkiler ve ileti dizileri desteklenmez.

## Paketle birlikte gelen Plugin

Güncel OpenClaw sürümleri QQ Bot'u paketle birlikte içerir, bu nedenle normal paketlenmiş derlemelerde ayrı bir `openclaw plugins install` adımı gerekmez.

## Kurulum

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve kaydolmak / oturum açmak için QR kodunu
   telefonunuzdaki QQ ile tarayın.
2. Yeni bir QQ botu oluşturmak için **Create Bot** seçeneğine tıklayın.
3. Botun ayarlar sayfasında **AppID** ve **AppSecret** değerlerini bulun ve kopyalayın.

> AppSecret düz metin olarak saklanmaz; kaydetmeden sayfadan ayrılırsanız
> yeni bir tane yeniden oluşturmanız gerekir.

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

Varsayılan hesap env değişkenleri:

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

- Env geri dönüşü yalnızca varsayılan QQ Bot hesabına uygulanır.
- `openclaw channels add --channel qqbot --token-file ...`, yalnızca
  AppSecret sağlar; AppID zaten yapılandırmada veya `QQBOT_APP_ID` içinde ayarlanmış olmalıdır.
- `clientSecret`, yalnızca düz metin bir dizeyi değil, SecretRef girdisini de kabul eder.

### Çoklu hesap kurulumu

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
`groups.GROUP_OPENID` girdisi bu varsayılanları tek bir grup için geçersiz kılar. Grup
ayarları şunları içerir:

- `requireMention`: bot yanıtlamadan önce bir @bahsetme gerektirir. Varsayılan: `true`.
- `ignoreOtherMentions`: bottan değil başka birinden bahseden mesajları bırakır.
- `historyLimit`: son bahsedilen tur için bağlam olarak yakın tarihli bahsetme içermeyen grup mesajlarını tutar. Devre dışı bırakmak için `0` olarak ayarlayın.
- `toolPolicy`: grup kapsamlı araçlar için `full`, `restricted` veya `none`.
- `name`: günlüklerde ve grup bağlamında kullanılan kullanıcı dostu etiket.
- `prompt`: agent bağlamına eklenen grup başına davranış istemi.

Etkinleştirme modları `mention` ve `always` değerleridir. `requireMention: true`,
`mention` ile eşleşir; `requireMention: false`, `always` ile eşleşir. Varsa oturum düzeyi
etkinleştirme geçersiz kılması, yapılandırmaya göre önceliklidir.

Gelen kuyruk eş başınadır. Grup eşleri daha büyük bir kuyruk sınırı alır, dolduğunda insan
mesajlarını bot tarafından yazılmış sohbetin önünde tutar ve normal
grup mesajı patlamalarını atıflı tek bir tura birleştirir. Slash komutları yine tek tek çalışır.

### Ses (STT / TTS)

STT ve TTS, öncelikli geri dönüşle iki düzeyli yapılandırmayı destekler:

| Ayar | Plugin'e özgü                                          | Framework geri dönüşü            |
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
Hesap düzeyi TTS geçersiz kılmaları `messages.tts` ile aynı şekli kullanır ve kanal/genel TTS
yapılandırmasının üzerine derin birleştirme uygular.

Gelen QQ ses ekleri, ham ses dosyaları genel `MediaPaths` dışında tutulurken
agent'lara ses medya meta verisi olarak sunulur. `[[audio_as_voice]]` düz
metin yanıtları TTS sentezler ve TTS yapılandırıldığında yerel bir QQ ses mesajı gönderir.

Giden ses yükleme/transcode davranışı ayrıca
`channels.qqbot.audioFormatPolicy` ile ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimler

| Biçim                     | Açıklama        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Özel sohbet (C2C) |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti         |
| `qqbot:channel:CHANNEL_ID` | Guild kanalı      |

> Her botun kendi kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID, **Bot B üzerinden**
> mesaj göndermek için kullanılamaz.

## Slash komutları

AI kuyruğundan önce yakalanan yerleşik komutlar:

| Komut        | Açıklama                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Gecikme testi                                                                                             |
| `/bot-version` | OpenClaw Framework sürümünü göster                                                                      |
| `/bot-help`    | Tüm komutları listele                                                                                        |
| `/bot-me`      | `allowFrom`/`groupAllowFrom` kurulumu için gönderenin QQ kullanıcı kimliğini (openid) göster                             |
| `/bot-upgrade` | QQBot yükseltme kılavuzu bağlantısını göster                                                                        |
| `/bot-logs`    | Son Gateway günlüklerini dosya olarak dışa aktar                                                                     |
| `/bot-approve` | Bekleyen bir QQ Bot eylemini (örneğin, bir C2C veya grup yüklemesini onaylama) yerel akış üzerinden onayla. |

Kullanım yardımı için herhangi bir komuta `?` ekleyin (örneğin `/bot-upgrade ?`).

Yönetici komutları (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) yalnızca doğrudan mesajda çalışır ve gönderenin openid değerinin açık, joker olmayan bir `allowFrom` listesinde olmasını gerektirir. Joker `allowFrom: ["*"]` sohbete izin verir ancak yönetici komutu erişimi vermez. Grup mesajları önce `groupAllowFrom` ile eşleştirilir ve ardından `allowFrom` değerine geri döner. Bir yönetici komutunu grupta çalıştırmak, sessizce bırakmak yerine bir ipucu döndürür.

## Motor mimarisi

QQ Bot, Plugin içinde kendi kendine yeterli bir motor olarak gelir:

- Her hesap, `appId` ile anahtarlanan yalıtılmış bir kaynak yığınına (WebSocket bağlantısı, API istemcisi, token önbelleği, medya depolama kökü) sahiptir. Hesaplar gelen/giden durumu asla paylaşmaz.
- Çoklu hesap günlükleyicisi, bir Gateway altında birkaç bot çalıştırdığınızda tanılamanın ayrılabilir kalması için günlük satırlarını sahip hesapla etiketler.
- Gelen, giden ve Gateway köprü yolları `~/.openclaw/media` altında tek bir medya yük kökünü paylaşır; böylece yüklemeler, indirmeler ve transcode önbellekleri alt sistem başına bir ağaç yerine tek bir korumalı dizin altında yer alır.
- Zengin medya teslimi, C2C ve grup hedefleri için tek bir `sendMedia` yolundan geçer. Büyük dosya eşiğinin üzerindeki yerel dosyalar ve arabellekler QQ'nun parçalı yükleme uç noktalarını kullanırken daha küçük yükler tek seferlik medya API'sini kullanır.
- Kimlik bilgileri standart OpenClaw kimlik bilgisi anlık görüntülerinin bir parçası olarak yedeklenebilir ve geri yüklenebilir; motor, yeni bir QR kod eşleştirmesi gerektirmeden geri yüklemede her hesabın kaynak yığınını yeniden bağlar.

## QR kod ile onboarding

`AppID:AppSecret` değerini elle yapıştırmaya alternatif olarak motor, bir QQ Bot'u OpenClaw'a bağlamak için QR kod ile onboarding akışını destekler:

1. QQ Bot kurulum yolunu çalıştırın (örneğin `openclaw channels add --channel qqbot`) ve istendiğinde QR kod akışını seçin.
2. Oluşturulan QR kodunu hedef QQ Bot'a bağlı telefon uygulamasıyla tarayın.
3. Telefonda eşleştirmeyi onaylayın. OpenClaw, döndürülen kimlik bilgilerini doğru hesap kapsamında `credentials/` içine kalıcı olarak kaydeder.

Botun kendisi tarafından oluşturulan onay istemleri (örneğin, QQ Bot API tarafından sunulan "bu eyleme izin ver?" akışları), ham QQ istemcisi üzerinden yanıtlamak yerine `/bot-approve` ile kabul edebileceğiniz yerel OpenClaw istemleri olarak görünür.

## Sorun giderme

- **Bot "gone to Mars" yanıtı veriyor:** kimlik bilgileri yapılandırılmamış veya Gateway başlatılmamış.
- **Gelen mesaj yok:** `appId` ve `clientSecret` değerlerinin doğru olduğunu ve botun
  QQ Open Platform üzerinde etkin olduğunu doğrulayın.
- **Tekrarlanan kendi kendine yanıtlar:** OpenClaw, QQ giden referans indekslerini
  bot tarafından yazılmış olarak kaydeder ve geçerli `msgIdx` değeri aynı bot hesabıyla eşleşen gelen olayları yok sayar. Bu, kullanıcıların önceki bot mesajlarını alıntılamasına veya yanıtlamasına izin vermeyi sürdürürken platform yankı döngülerini önler.
- **`--token-file` ile kurulum hâlâ yapılandırılmamış görünüyor:** `--token-file` yalnızca
  AppSecret değerini ayarlar. Yapılandırmada veya `QQBOT_APP_ID` içinde yine de `appId` gerekir.
- **Proaktif mesajlar ulaşmıyor:** kullanıcı yakın zamanda etkileşimde bulunmadıysa QQ, bot tarafından başlatılan mesajları engelleyebilir.
- **Ses yazıya dökülmüyor:** STT'nin yapılandırıldığından ve sağlayıcının erişilebilir olduğundan emin olun.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal sorun giderme](/tr/channels/troubleshooting)
