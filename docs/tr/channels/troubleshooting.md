---
read_when:
    - Kanal aktarımı bağlı olduğunu söylüyor ancak yanıtlar başarısız oluyor
    - Ayrıntılı sağlayıcı belgelerinden önce kanala özgü kontroller yapmanız gerekir
summary: Kanal bazında hata belirtileri ve düzeltmelerle hızlı kanal düzeyi sorun giderme
title: Kanal sorunlarını giderme
x-i18n:
    generated_at: "2026-07-12T11:30:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Bir kanal bağlanıyor ancak davranış hatalıysa bu sayfayı kullanın.

## Komut sıralaması

Önce bunları sırayla çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sağlıklı temel durum:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` veya `admin-capable`
- Kanal yoklaması, aktarım bağlantısının kurulduğunu ve desteklendiği durumlarda `works` veya `audit ok` sonucunu gösterir

## Güncellemeden sonra

Güncellemeden sonra Telegram, iMessage, BlueBubbles dönemine ait yapılandırmalar veya başka bir Plugin kanalı kaybolursa bunu kullanın.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

`openclaw status --all` çıktısında `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` ifadesini arayın. Bu, kanalın yapılandırıldığı ancak Plugin kurulumu/yüklemesinin kanalı kaydetmek yerine bozuk bir bağımlılık ağacıyla karşılaştığı anlamına gelir. `openclaw doctor --fix`, eski Plugin çalışma zamanı bağımlılık sembolik bağlantılarını ve eski kimlik doğrulama gölgelerini temizler; ardından `openclaw gateway restart` temiz durumu yeniden yükler.

## WhatsApp

### WhatsApp hata belirtileri

| Belirti                             | En hızlı kontrol                                      | Düzeltme                                                                                                                                                  |
| ----------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bağlı ancak DM yanıtı yok           | `openclaw pairing list whatsapp`                      | Göndereni onaylayın veya DM politikasını/izin verilenler listesini değiştirin.                                                                             |
| Grup mesajları yok sayılıyor        | Yapılandırmada `requireMention` + bahsetme kalıplarını kontrol edin | Bottan bahsedin veya o grup için bahsetme politikasını gevşetin.                                                                              |
| QR ile oturum açma 408 ile zaman aşımına uğruyor | Gateway `HTTPS_PROXY` / `HTTP_PROXY` ortam değişkenini kontrol edin | Erişilebilir bir proxy ayarlayın; `NO_PROXY` değerini yalnızca atlamalar için kullanın.                                                       |
| Rastgele bağlantı kesilmesi/yeniden oturum açma döngüleri | `openclaw channels status --probe` + günlükler | Yakın zamandaki yeniden bağlantılar, şu anda bağlı olunsa bile işaretlenir; günlükleri izleyin, Gateway'i yeniden başlatın, ardından dalgalanma sürerse yeniden bağlayın. |
| `status=408 Request Time-out` döngüsü | Yoklama, günlükler, doctor, ardından Gateway durumu | Önce ana makine bağlantısını/zamanlamasını düzeltin; döngü sürerse kimlik doğrulama verilerini yedekleyip hesabı yeniden bağlayın.                         |
| Yanıtlar saniyeler/dakikalar sonra geliyor | `openclaw doctor --fix`                         | Doctor, Gateway olay döngüsünü olumsuz etkilediği doğrulanan eski yerel TUI istemcilerini durdurur.                                                        |

Tüm sorun giderme bilgileri: [WhatsApp sorun giderme](/tr/channels/whatsapp#troubleshooting)

## Telegram

### Telegram hata belirtileri

| Belirti                              | En hızlı kontrol                                    | Düzeltme                                                                                                                                     |
| ------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/start` çalışıyor ancak kullanılabilir yanıt akışı yok | `openclaw pairing list telegram`       | Eşleştirmeyi onaylayın veya DM politikasını değiştirin.                                                                                       |
| Bot çevrimiçi ancak grup sessiz kalıyor | Bahsetme gereksinimini ve bot gizlilik modunu doğrulayın | Grubun görünür olması için gizlilik modunu devre dışı bırakın veya bottan bahsedin.                                                        |
| Ağ hatalarıyla gönderim başarısız oluyor | Günlüklerde Telegram API çağrısı hatalarını inceleyin | `api.telegram.org` için DNS/IPv6/proxy yönlendirmesini düzeltin.                                                                            |
| Başlangıçta `getMe returned 401` bildiriliyor | Yapılandırılmış token kaynağını kontrol edin | BotFather token'ını yeniden kopyalayın veya oluşturun ve `botToken`, `tokenFile` ya da varsayılan hesap `TELEGRAM_BOT_TOKEN` değerini güncelleyin. |
| Yoklama takılıyor veya yeniden bağlantı yavaş gerçekleşiyor | Yoklama tanılamaları için `openclaw logs --follow` | Yükseltin; yeniden başlatmalar yanlış pozitifse `pollingStallThresholdMs` ayarını düzenleyin. Kalıcı takılmalar yine proxy/DNS/IPv6 sorununa işaret eder. |
| Başlangıçta `setMyCommands` reddediliyor | Günlüklerde `BOT_COMMANDS_TOO_MUCH` ifadesini inceleyin | Plugin/skill/özel Telegram komutlarını azaltın veya yerel menüleri devre dışı bırakın.                                                     |
| Yükseltme sonrasında izin verilenler listesi sizi engelliyor | `openclaw security audit` ve yapılandırma izin listeleri | `openclaw doctor --fix` komutunu çalıştırın veya `@username` değerini sayısal gönderen kimlikleriyle değiştirin.                        |

Tüm sorun giderme bilgileri: [Telegram sorun giderme](/tr/channels/telegram#troubleshooting)

## Discord

### Discord hata belirtileri

| Belirti                                   | En hızlı kontrol                                                                                                                | Düzeltme                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot çevrimiçi ancak sunucuda yanıt vermiyor | `openclaw channels status --probe`                                                                                            | Sunucuya/kanala izin verin ve mesaj içeriği niyetini doğrulayın.                                                                                                                                                                                                                                           |
| Grup mesajları yok sayılıyor              | Günlüklerde bahsetme geçidi nedeniyle bırakılan mesajları kontrol edin                                                           | Bottan bahsedin veya sunucu/kanal için `requireMention: false` ayarlayın.                                                                                                                                                                                                                                  |
| Yazma/token kullanımı var ancak Discord mesajı yok | Bunun bir ortam odası olayı mı yoksa modelin `message(action=send)` çağrısını atladığı, katılım etkinleştirilmiş bir `message_tool` odası mı olduğunu kontrol edin | Bastırılmış son yük meta verileri için ayrıntılı Gateway günlüğünü inceleyin, `messages.groupChat.unmentionedInbound` ayarını doğrulayın, [Ortam odası olayları](/tr/channels/ambient-room-events) sayfasını okuyun veya normal grup istekleri için `messages.groupChat.visibleReplies: "automatic"` ayarını koruyun. |
| DM yanıtları eksik                        | `openclaw pairing list discord`                                                                                                  | DM eşleştirmesini onaylayın veya DM politikasını düzenleyin.                                                                                                                                                                                                                                               |

Tüm sorun giderme bilgileri: [Discord sorun giderme](/tr/channels/discord#troubleshooting)

## Slack

### Slack hata belirtileri

| Belirti                                | En hızlı kontrol                             | Düzeltme                                                                                                                                                                       |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Soket modu bağlı ancak yanıt yok       | `openclaw channels status --probe`           | Uygulama token'ını, bot token'ını ve gerekli kapsamları doğrulayın; SecretRef destekli kurulumlarda `botTokenStatus` / `appTokenStatus = configured_unavailable` durumunu izleyin. |
| DM'ler engelleniyor                    | `openclaw pairing list slack`                | Eşleştirmeyi onaylayın veya DM politikasını gevşetin.                                                                                                                          |
| Kanal mesajı yok sayılıyor             | `groupPolicy` ve kanal izin listesini kontrol edin | Kanala izin verin veya politikayı `open` olarak değiştirin.                                                                                                               |

Tüm sorun giderme bilgileri: [Slack sorun giderme](/tr/channels/slack#troubleshooting)

## iMessage

### iMessage hata belirtileri

| Belirti                              | En hızlı kontrol                                           | Düzeltme                                                                                 |
| ------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `imsg` eksik veya macOS dışında çalışmıyor | `openclaw channels status --probe --channel imessage` | OpenClaw'ı Messages'ın bulunduğu Mac'te çalıştırın veya `cliPath` için bir SSH sarmalayıcısı kullanın. |
| macOS'ta gönderebiliyor ancak alamıyor | Messages otomasyonu için macOS gizlilik izinlerini kontrol edin | TCC izinlerini yeniden verin ve kanal sürecini yeniden başlatın.                    |
| DM göndereni engelleniyor            | `openclaw pairing list imessage`                           | Eşleştirmeyi onaylayın veya izin listesini güncelleyin.                                  |

Tüm sorun giderme bilgileri: [iMessage sorun giderme](/tr/channels/imessage#troubleshooting)

## Signal

### Signal hata belirtileri

| Belirti                         | En hızlı kontrol                              | Düzeltme                                                               |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| Art alan hizmetine erişilebiliyor ancak bot sessiz | `openclaw channels status --probe` | `signal-cli` art alan hizmeti URL'sini/hesabını ve alma modunu doğrulayın. |
| DM engelleniyor                 | `openclaw pairing list signal`                | Göndereni onaylayın veya DM politikasını düzenleyin.                   |
| Grup yanıtları tetiklenmiyor    | Grup izin listesini ve bahsetme kalıplarını kontrol edin | Göndereni/grubu ekleyin veya geçit kurallarını gevşetin.      |

Tüm sorun giderme bilgileri: [Signal sorun giderme](/tr/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot hata belirtileri

| Belirti                              | En hızlı kontrol                               | Düzeltme                                                                           |
| ------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| Bot "Mars'a gitti" yanıtını veriyor  | Yapılandırmada `appId` ve `clientSecret` değerlerini doğrulayın | Kimlik bilgilerini ayarlayın veya Gateway'i yeniden başlatın.          |
| Gelen mesaj yok                      | `openclaw channels status --probe`             | QQ Open Platform'daki kimlik bilgilerini doğrulayın.                                |
| Ses metne dönüştürülmüyor            | STT sağlayıcı yapılandırmasını kontrol edin    | `channels.qqbot.stt` veya `tools.media.audio` yapılandırmasını yapın.               |
| Proaktif mesajlar ulaşmıyor          | QQ platformu etkileşim gereksinimlerini kontrol edin | QQ, yakın zamanda etkileşim olmadığında bot tarafından başlatılan mesajları engelleyebilir. |

Tüm sorun giderme bilgileri: [QQ Bot sorun giderme](/tr/channels/qqbot#troubleshooting)

## Matrix

### Matrix hata belirtileri

| Belirti                                     | En hızlı kontrol                        | Çözüm                                                                                  |
| ------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| Oturum açık ancak oda mesajlarını yok sayıyor | `openclaw channels status --probe`      | `groupPolicy`, oda izin listesi ve bahsetme kısıtlamasını kontrol edin.                 |
| Özel mesajlar işlenmiyor                    | `openclaw pairing list matrix`          | Göndereni onaylayın veya özel mesaj politikasını ayarlayın.                             |
| Şifreli odalar çalışmıyor                   | `openclaw matrix verify status`         | Cihazı yeniden doğrulayın, ardından `openclaw matrix verify backup status` durumunu kontrol edin. |
| Yedek geri yükleme bekliyor/bozuk           | `openclaw matrix verify backup status`  | `openclaw matrix verify backup restore` komutunu çalıştırın veya kurtarma anahtarıyla yeniden deneyin. |
| Çapraz imzalama/önyükleme hatalı görünüyor  | `openclaw matrix verify bootstrap`      | Gizli veri depolama, çapraz imzalama ve yedekleme durumunu tek seferde düzeltin.         |

Tam kurulum ve yapılandırma: [Matrix](/tr/channels/matrix)

## İlgili konular

- [Eşleştirme](/tr/channels/pairing)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
