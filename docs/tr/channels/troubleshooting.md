---
read_when:
    - Kanal taşıması bağlı olduğunu bildiriyor ancak yanıtlar başarısız oluyor
    - Kapsamlı sağlayıcı belgelerinden önce kanala özel kontrollere ihtiyacınız var
summary: Kanal başına hata imzaları ve düzeltmelerle hızlı kanal düzeyi sorun giderme
title: Kanal sorunlarını giderme
x-i18n:
    generated_at: "2026-05-05T08:25:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

Bir kanal bağlandığı halde davranış yanlış olduğunda bu sayfayı kullanın.

## Komut sırası

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
- Kanal yoklaması, aktarımın bağlı olduğunu ve desteklendiği yerlerde `works` veya `audit ok` gösterir

## WhatsApp

### WhatsApp hata belirtileri

| Belirti                             | En hızlı kontrol                                    | Düzeltme                                                                                                                            |
| ----------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Bağlı ama DM yanıtı yok             | `openclaw pairing list whatsapp`                    | Göndereni onaylayın veya DM ilkesini/izin listesini değiştirin.                                                                     |
| Grup mesajları yok sayılıyor        | Yapılandırmada `requireMention` + bahsetme kalıplarını kontrol edin | Bottan bahsedin veya o grup için bahsetme ilkesini gevşetin.                                                                        |
| QR oturumu 408 ile zaman aşımına uğruyor | Gateway `HTTPS_PROXY` / `HTTP_PROXY` ortam değişkenini kontrol edin | Erişilebilir bir proxy ayarlayın; `NO_PROXY` yalnızca atlamalar için kullanın.                                                       |
| Rastgele bağlantı kopma/yeniden oturum açma döngüleri | `openclaw channels status --probe` + günlükler      | Yakın tarihli yeniden bağlanmalar, şu anda bağlı olsa bile işaretlenir; günlükleri izleyin, Gateway'i yeniden başlatın, ardından dalgalanma sürerse yeniden bağlayın. |
| Yanıtlar saniyeler/dakikalar geç geliyor | `openclaw doctor --fix`                             | Doctor, Gateway olay döngüsünü bozdukları doğrulanmış eski yerel TUI istemcilerini durdurur.                                       |

Tam sorun giderme: [WhatsApp sorun giderme](/tr/channels/whatsapp#troubleshooting)

## Telegram

### Telegram hata belirtileri

| Belirti                              | En hızlı kontrol                                  | Düzeltme                                                                                                                      |
| ------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/start` var ama kullanılabilir yanıt akışı yok | `openclaw pairing list telegram`                 | Eşleştirmeyi onaylayın veya DM ilkesini değiştirin.                                                                           |
| Bot çevrimiçi ama grup sessiz kalıyor | Bahsetme gerekliliğini ve bot gizlilik modunu doğrulayın | Grup görünürlüğü için gizlilik modunu devre dışı bırakın veya bottan bahsedin.                                                |
| Ağ hatalarıyla gönderim başarısızlıkları | Telegram API çağrısı hataları için günlükleri inceleyin | `api.telegram.org` için DNS/IPv6/proxy yönlendirmesini düzeltin.                                                              |
| Başlangıç `getMe returned 401` bildiriyor | Yapılandırılmış token kaynağını kontrol edin     | BotFather token'ını yeniden kopyalayın veya yeniden oluşturun ve `botToken`, `tokenFile` ya da varsayılan hesap `TELEGRAM_BOT_TOKEN` değerini güncelleyin. |
| Yoklama duruyor veya yavaş yeniden bağlanıyor | Yoklama tanıları için `openclaw logs --follow`   | Yükseltin; yeniden başlatmalar yanlış pozitifse `pollingStallThresholdMs` değerini ayarlayın. Kalıcı durmalar hâlâ proxy/DNS/IPv6 sorununa işaret eder. |
| Başlangıçta `setMyCommands` reddediliyor | Günlüklerde `BOT_COMMANDS_TOO_MUCH` arayın       | Plugin/skill/özel Telegram komutlarını azaltın veya yerel menüleri devre dışı bırakın.                                      |
| Yükselttiniz ve izin listesi sizi engelliyor | `openclaw security audit` ve yapılandırma izin listeleri | `openclaw doctor --fix` çalıştırın veya `@username` değerini sayısal gönderen kimlikleriyle değiştirin.                      |

Tam sorun giderme: [Telegram sorun giderme](/tr/channels/telegram#troubleshooting)

## Discord

### Discord hata belirtileri

| Belirti                                   | En hızlı kontrol                                                        | Düzeltme                                                                                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot çevrimiçi ama sunucu yanıtı yok       | `openclaw channels status --probe`                                      | Sunucu/kanala izin verin ve mesaj içeriği niyetini doğrulayın.                                                                                                       |
| Grup mesajları yok sayılıyor              | Bahsetme kapısı düşürmeleri için günlükleri kontrol edin                | Bottan bahsedin veya sunucu/kanal için `requireMention: false` ayarlayın.                                                                                            |
| Yazıyor/token kullanımı var ama Discord mesajı yok | Oturum günlüğü, `didSendViaMessagingTool: false` ile asistan metni gösterir | Model, mesaj aracını çağırmak yerine özel olarak yanıtladı. Araç çağrısında güvenilir bir model kullanın veya otomatik göndermek için `messages.groupChat.visibleReplies: "automatic"` ayarlayın. |
| DM yanıtları eksik                        | `openclaw pairing list discord`                                         | DM eşleştirmesini onaylayın veya DM ilkesini ayarlayın.                                                                                                             |

Tam sorun giderme: [Discord sorun giderme](/tr/channels/discord#troubleshooting)

## Slack

### Slack hata belirtileri

| Belirti                                | En hızlı kontrol                          | Düzeltme                                                                                                                                                 |
| -------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Soket modu bağlı ama yanıt yok         | `openclaw channels status --probe`        | Uygulama token'ı + bot token'ını ve gerekli kapsamları doğrulayın; SecretRef destekli kurulumlarda `botTokenStatus` / `appTokenStatus = configured_unavailable` durumunu izleyin. |
| DM'ler engellendi                      | `openclaw pairing list slack`             | Eşleştirmeyi onaylayın veya DM ilkesini gevşetin.                                                                                                       |
| Kanal mesajı yok sayılıyor             | `groupPolicy` ve kanal izin listesini kontrol edin | Kanala izin verin veya ilkeyi `open` olarak değiştirin.                                                                                                 |

Tam sorun giderme: [Slack sorun giderme](/tr/channels/slack#troubleshooting)

## iMessage ve BlueBubbles

### iMessage ve BlueBubbles hata belirtileri

| Belirti                          | En hızlı kontrol                                                        | Düzeltme                                                |
| -------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| Gelen olay yok                   | Webhook/sunucu erişilebilirliğini ve uygulama izinlerini doğrulayın     | Webhook URL'sini veya BlueBubbles sunucu durumunu düzeltin. |
| macOS'ta gönderebiliyor ama alamıyor | Mesajlar otomasyonu için macOS gizlilik izinlerini kontrol edin       | TCC izinlerini yeniden verin ve kanal sürecini yeniden başlatın. |
| DM gönderen engellendi           | `openclaw pairing list imessage` veya `openclaw pairing list bluebubbles` | Eşleştirmeyi onaylayın veya izin listesini güncelleyin. |

Tam sorun giderme:

- [iMessage sorun giderme](/tr/channels/imessage#troubleshooting)
- [BlueBubbles sorun giderme](/tr/channels/bluebubbles#troubleshooting)

## Signal

### Signal hata belirtileri

| Belirti                         | En hızlı kontrol                              | Düzeltme                                                   |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Daemon erişilebilir ama bot sessiz | `openclaw channels status --probe`           | `signal-cli` daemon URL'sini/hesabını ve alma modunu doğrulayın. |
| DM engellendi                   | `openclaw pairing list signal`                | Göndereni onaylayın veya DM ilkesini ayarlayın.            |
| Grup yanıtları tetiklenmiyor    | Grup izin listesini ve bahsetme kalıplarını kontrol edin | Gönderen/grup ekleyin veya kapıyı gevşetin.                |

Tam sorun giderme: [Signal sorun giderme](/tr/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot hata belirtileri

| Belirti                         | En hızlı kontrol                              | Düzeltme                                                       |
| ------------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| Bot "gone to Mars" yanıtı veriyor | Yapılandırmada `appId` ve `clientSecret` değerlerini doğrulayın | Kimlik bilgilerini ayarlayın veya Gateway'i yeniden başlatın. |
| Gelen mesaj yok                 | `openclaw channels status --probe`            | QQ Open Platform'da kimlik bilgilerini doğrulayın.             |
| Ses yazıya dökülmedi            | STT sağlayıcı yapılandırmasını kontrol edin   | `channels.qqbot.stt` veya `tools.media.audio` yapılandırın.    |
| Proaktif mesajlar ulaşmıyor     | QQ platform etkileşim gereksinimlerini kontrol edin | QQ, yakın tarihli etkileşim olmadan bot tarafından başlatılan mesajları engelleyebilir. |

Tam sorun giderme: [QQ Bot sorun giderme](/tr/channels/qqbot#troubleshooting)

## Matrix

### Matrix hata belirtileri

| Belirti                             | En hızlı kontrol                          | Düzeltme                                                                  |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| Oturum açılmış ama oda mesajlarını yok sayıyor | `openclaw channels status --probe`       | `groupPolicy`, oda izin listesi ve bahsetme kapısını kontrol edin.        |
| DM'ler işlenmiyor                   | `openclaw pairing list matrix`            | Göndereni onaylayın veya DM ilkesini ayarlayın.                           |
| Şifreli odalar başarısız oluyor     | `openclaw matrix verify status`           | Cihazı yeniden doğrulayın, ardından `openclaw matrix verify backup status` kontrol edin. |
| Yedek geri yükleme beklemede/bozuk  | `openclaw matrix verify backup status`    | `openclaw matrix verify backup restore` çalıştırın veya bir kurtarma anahtarıyla yeniden çalıştırın. |
| Çapraz imzalama/önyükleme yanlış görünüyor | `openclaw matrix verify bootstrap`       | Gizli depolamayı, çapraz imzalamayı ve yedekleme durumunu tek geçişte onarın. |

Tam kurulum ve yapılandırma: [Matrix](/tr/channels/matrix)

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
