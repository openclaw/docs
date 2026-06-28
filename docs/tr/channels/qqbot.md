---
read_when:
    - OpenClaw'ı QQ'ya bağlamak istiyorsunuz
    - QQ Bot kimlik bilgisi kurulumuna ihtiyacınız var
    - QQ Bot grup veya özel sohbet desteği istiyorsunuz
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ botu
x-i18n:
    generated_at: "2026-06-28T00:15:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot, resmi QQ Bot API'si (WebSocket Gateway) üzerinden OpenClaw'a bağlanır. Plugin, zengin medya (görseller, ses, video, dosyalar) ile C2C özel sohbeti, grup @mesajlarını ve lonca kanal mesajlarını destekler.

Durum: indirilebilir Plugin. Direkt mesajlar, grup sohbetleri, lonca kanalları ve medya desteklenir. Tepkiler ve iş parçacıkları desteklenmez.

## Kurulum

Kurulumdan önce QQ Bot'u yükleyin:

```bash
openclaw plugins install @openclaw/qqbot
```

## Ayarlama

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve kaydolmak / oturum açmak için QR kodunu telefonunuzdaki QQ ile tarayın.
2. Yeni bir QQ botu oluşturmak için **Create Bot** seçeneğine tıklayın.
3. Botun ayarlar sayfasında **AppID** ve **AppSecret** değerlerini bulun ve kopyalayın.

> AppSecret düz metin olarak saklanmaz; kaydetmeden sayfadan ayrılırsanız
> yenisini yeniden oluşturmanız gerekir.

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

Env SecretRef AppSecret:

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

- Env yedeği yalnızca varsayılan QQ Bot hesabına uygulanır.
- `openclaw channels add --channel qqbot --token-file ...` yalnızca
  AppSecret sağlar; AppID yapılandırmada veya `QQBOT_APP_ID` içinde zaten ayarlanmış olmalıdır.
- `clientSecret`, yalnızca düz metin dizesi değil SecretRef girdisini de kabul eder.
- Eski `secretref:/...` işaretçi dizeleri geçerli `clientSecret` değerleri değildir;
  yukarıdaki örnekteki gibi yapılandırılmış SecretRef nesneleri kullanın.

### Çoklu hesap ayarlama

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

Her hesap kendi WebSocket bağlantısını başlatır ve bağımsız bir token önbelleği tutar (`appId` ile yalıtılır).

CLI üzerinden ikinci bir bot ekleyin:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Grup sohbetleri

QQ Bot grup sohbeti desteği, görünen adları değil QQ grup OpenID'lerini kullanır. Botu bir gruba ekleyin, ardından ondan bahsedin veya grubu bahsetme olmadan çalışacak şekilde yapılandırın.

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

`groups["*"]` her grup için varsayılanları ayarlar ve somut bir
`groups.GROUP_OPENID` girdisi bu varsayılanları tek bir grup için geçersiz kılar. Grup
ayarları şunları içerir:

- `requireMention`: bot yanıt vermeden önce @bahsetmeyi zorunlu kılın. Varsayılan: `true`.
- `commandLevel`: gruplarda hangi yerleşik eğik çizgi komutlarının çalışabileceğini denetleyin.
  Varsayılan: `all`; ayar atlandığında önceden var olan QQBot grup davranışını korur.
- `ignoreOtherMentions`: başka birinden bahsedip bottan bahsetmeyen mesajları bırakın.
- `historyLimit`: sonraki bahsedilen tur için son bahsetmesiz grup mesajlarını bağlam olarak tutun. Devre dışı bırakmak için `0` olarak ayarlayın.
- `tools`: tüm grup için araçlara izin verin/reddedin.
- `toolsBySender`: gönderen başına grup aracı geçersiz kılmaları; bkz. [Gruplar](/tr/channels/groups#groupchannel-tool-restrictions-optional).
- `name`: günlüklerde ve grup bağlamında kullanılan kullanıcı dostu etiket.
- `prompt`: aracı bağlamına eklenen grup başına davranış istemi.

`commandLevel` şunları kabul eder:

- `all`: tanınan yerleşik komutları eskisi gibi kullanılabilir tutun. Bazı komutlar
  menülerden gizli kalabilir, ancak yetkili kullanıcılar bunları grupta yine de çalıştırabilir.
- `safety`: `/help`, `/btw` ve
  `/stop` gibi yaygın iş birliği komutlarına izin verin; kullanıcılardan `/config`, `/tools` ve
  `/bash` gibi hassas komutları özel sohbette çalıştırmalarını isteyin.
- `strict`: yalnızca katı grup işlemi için gereken grup oturumu kontrollerine
  izin verin. `/stop`, yetkili bir gönderenin etkin bir çalıştırmayı kesebilmesi için acil olarak kalır.

Eski QQBot `toolPolicy` girdileri kullanımdan kaldırılmıştır. Bunları `tools` değerine taşımak için `openclaw doctor --fix` çalıştırın.

Etkinleştirme modları `mention` ve `always` şeklindedir. `requireMention: true`,
`mention` ile eşleşir; `requireMention: false`, `always` ile eşleşir. Varsa oturum düzeyi etkinleştirme geçersiz kılması yapılandırmaya üstün gelir.

Gelen kuyruk eş başınadır. Grup eşleri daha büyük bir kuyruk sınırı alır, dolduğunda insan
mesajlarını bot tarafından yazılmış yazışmaların önünde tutar ve normal
grup mesajı patlamalarını tek bir atfedilmiş tura birleştirir. Eğik çizgi komutları yine de tek tek çalışır.

### Ses (STT / TTS)

STT ve TTS, öncelikli yedekli iki düzeyli yapılandırmayı destekler:

| Ayar | Plugin'e özel                                           | Çerçeve yedeği                 |
| ---- | ------------------------------------------------------- | ------------------------------ |
| STT  | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]`  |
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

Devre dışı bırakmak için ikisinden birinde `enabled: false` ayarlayın.
Hesap düzeyi TTS geçersiz kılmaları `messages.tts` ile aynı şekli kullanır ve kanal/genel TTS yapılandırmasının üzerine derin birleştirme yapar.

Gelen QQ ses ekleri, ham ses dosyaları genel `MediaPaths` dışında tutulurken aracılara ses medyası meta verisi olarak sunulur. `[[audio_as_voice]]` düz metin yanıtları TTS sentezler ve TTS yapılandırıldığında yerel bir QQ ses mesajı gönderir.

Giden ses yükleme/transcode davranışı da
`channels.qqbot.audioFormatPolicy` ile ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimler

| Biçim                      | Açıklama           |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Özel sohbet (C2C)  |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti       |
| `qqbot:channel:CHANNEL_ID` | Lonca kanalı       |

> Her botun kendi kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID,
> Bot B üzerinden mesaj göndermek için **kullanılamaz**.

## Eğik çizgi komutları

AI kuyruğundan önce yakalanan yerleşik komutlar:

| Komut          | Açıklama                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Gecikme testi                                                                                           |
| `/bot-version` | OpenClaw çerçeve sürümünü göster                                                                        |
| `/bot-help`    | Tüm komutları listele                                                                                   |
| `/bot-me`      | `allowFrom`/`groupAllowFrom` ayarlaması için gönderenin QQ kullanıcı kimliğini (openid) göster          |
| `/bot-upgrade` | QQBot yükseltme kılavuzu bağlantısını göster                                                            |
| `/bot-logs`    | Son Gateway günlüklerini dosya olarak dışa aktar                                                        |
| `/bot-approve` | Bekleyen bir QQ Bot eylemini (örneğin C2C veya grup yüklemesini onaylama) yerel akış üzerinden onayla. |

Kullanım yardımı için herhangi bir komuta `?` ekleyin (örneğin `/bot-upgrade ?`).

Yönetici komutları (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) yalnızca direkt mesaj içindir ve gönderenin openid değerinin açık, joker karakter olmayan bir `allowFrom` listesinde olmasını gerektirir. Joker karakter `allowFrom: ["*"]` sohbete izin verir ancak yönetici komutu erişimi vermez. Grup mesajları önce `groupAllowFrom` ile eşleştirilir ve ardından `allowFrom` değerine geri döner. Bir yönetici komutunu grupta çalıştırmak sessizce bırakmak yerine bir ipucu döndürür.

QQ Bot exec onayları varsayılan aynı sohbet yedeğini kullandığında, yerel onay
düğmesi tıklamaları aynı açık joker karakter olmayan komut izin listesine uyar. Daha geniş komut erişimi olmadan yalnızca onay erişimi vermek için
`channels.qqbot.execApprovals.approvers` yapılandırın.

## Motor mimarisi

QQ Bot, Plugin içinde kendi kendine yeterli bir motor olarak gelir:

- Her hesap, `appId` ile anahtarlanan yalıtılmış bir kaynak yığınına (WebSocket bağlantısı, API istemcisi, token önbelleği, medya depolama kökü) sahiptir. Hesaplar gelen/giden durumu asla paylaşmaz.
- Çoklu hesap günlükleyicisi, tek bir Gateway altında birkaç bot çalıştırdığınızda tanılamaların ayrılabilir kalması için günlük satırlarını sahibi olan hesapla etiketler.
- Gelen, giden ve Gateway köprü yolları `~/.openclaw/media` altında tek bir medya yükü kökünü paylaşır; böylece yüklemeler, indirmeler ve transcode önbellekleri alt sistem başına ayrı ağaç yerine tek bir korumalı dizinin altına düşer.
- Zengin medya teslimi, C2C ve grup hedefleri için tek bir `sendMedia` yolundan geçer. Büyük dosya eşiğinin üzerindeki yerel dosyalar ve arabellekler QQ'nun parçalı yükleme uç noktalarını kullanırken daha küçük yükler tek seferlik medya API'sini kullanır.
- Kimlik bilgileri standart OpenClaw kimlik bilgisi anlık görüntülerinin parçası olarak yedeklenip geri yüklenebilir; motor, geri yüklemede her hesabın kaynak yığınını yeni bir QR kodu eşleşmesi gerektirmeden yeniden bağlar.

## QR kodu ile başlangıç

`AppID:AppSecret` değerini elle yapıştırmaya alternatif olarak motor, bir QQ Bot'u OpenClaw'a bağlamak için QR kodlu başlangıç akışını destekler:

1. QQ Bot ayarlama yolunu çalıştırın (örneğin `openclaw channels add --channel qqbot`) ve sorulduğunda QR kodu akışını seçin.
2. Oluşturulan QR kodunu hedef QQ Bot'a bağlı telefon uygulamasıyla tarayın.
3. Telefonda eşleştirmeyi onaylayın. OpenClaw döndürülen kimlik bilgilerini doğru hesap kapsamı altında `credentials/` içine kalıcı hale getirir.

Botun kendisi tarafından oluşturulan onay istemleri (örneğin QQ Bot API tarafından sunulan "bu eyleme izin verilsin mi?" akışları), ham QQ istemcisi üzerinden yanıtlamak yerine `/bot-approve` ile kabul edebileceğiniz yerel OpenClaw istemleri olarak görünür.

## Sorun giderme

- **Bot "Mars'a gitti" yanıtı veriyor:** kimlik bilgileri yapılandırılmamış veya Gateway başlatılmamış.
- **Gelen mesaj yok:** `appId` ve `clientSecret` değerlerinin doğru olduğunu ve
  botun QQ Open Platform üzerinde etkinleştirildiğini doğrulayın.
- **Tekrarlanan kendi kendine yanıtlar:** OpenClaw, QQ giden ref indekslerini
  bot tarafından yazılmış olarak kaydeder ve mevcut `msgIdx` değeri aynı bot
  hesabıyla eşleşen gelen olayları yok sayar. Bu, kullanıcıların önceki bot
  mesajlarından alıntı yapmasına veya bunlara yanıt vermesine izin verirken
  platform yankı döngülerini önler.
- **`--token-file` ile kurulum hâlâ yapılandırılmamış görünüyor:** `--token-file` yalnızca
  AppSecret değerini ayarlar. Yapılandırmada hâlâ `appId` veya `QQBOT_APP_ID` gerekir.
- **Proaktif mesajlar gelmiyor:** kullanıcı yakın zamanda etkileşimde bulunmadıysa
  QQ, bot tarafından başlatılan mesajları engelleyebilir.
- **Ses metne dönüştürülmedi:** STT'nin yapılandırıldığından ve sağlayıcıya erişilebildiğinden emin olun.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal sorunlarını giderme](/tr/channels/troubleshooting)
