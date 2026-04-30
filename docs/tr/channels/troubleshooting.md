---
read_when:
    - Kanal taşıması bağlı olduğunu bildiriyor ancak yanıtlar başarısız oluyor
    - Ayrıntılı sağlayıcı belgelerine geçmeden önce kanala özgü denetimler gerekir
summary: Kanal başına hata imzaları ve düzeltmelerle kanal düzeyinde hızlı sorun giderme
title: Kanal sorunlarını giderme
x-i18n:
    generated_at: "2026-04-30T09:09:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

Bir kanal bağlandığında ama davranış yanlış olduğunda bu sayfayı kullanın.

## Komut basamağı

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
- Kanal yoklaması, aktarımın bağlı olduğunu ve desteklenen yerlerde `works` veya `audit ok` gösterir

## WhatsApp

### WhatsApp hata imzaları

| Belirti                         | En hızlı kontrol                                     | Düzeltme                                                                                                                        |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Bağlı ama DM yanıtı yok         | `openclaw pairing list whatsapp`                     | Göndereni onaylayın veya DM ilkesini/izin listesini değiştirin.                                                                 |
| Grup mesajları yok sayılıyor    | Yapılandırmada `requireMention` + mention kalıplarını kontrol edin | Botu mention edin veya o grup için mention ilkesini gevşetin.                                                                    |
| QR girişi 408 ile zaman aşımına uğruyor | Gateway `HTTPS_PROXY` / `HTTP_PROXY` env değerlerini kontrol edin | Erişilebilir bir proxy ayarlayın; `NO_PROXY` değerini yalnızca atlamalar için kullanın.                                          |
| Rastgele bağlantı kopma/yeniden giriş döngüleri | `openclaw channels status --probe` + günlükler       | Son yeniden bağlantılar, şu anda bağlıyken bile işaretlenir; günlükleri izleyin, Gateway'i yeniden başlatın, sonra dalgalanma sürerse yeniden bağlayın. |

Tam sorun giderme: [WhatsApp sorun giderme](/tr/channels/whatsapp#troubleshooting)

## Telegram

### Telegram hata imzaları

| Belirti                              | En hızlı kontrol                                  | Düzeltme                                                                                                                        |
| ------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start` var ama kullanılabilir yanıt akışı yok | `openclaw pairing list telegram`                  | Eşleştirmeyi onaylayın veya DM ilkesini değiştirin.                                                                              |
| Bot çevrimiçi ama grup sessiz kalıyor | Mention gereksinimini ve bot gizlilik modunu doğrulayın | Grup görünürlüğü için gizlilik modunu devre dışı bırakın veya botu mention edin.                                                |
| Ağ hatalarıyla gönderim başarısızlıkları | Telegram API çağrı hataları için günlükleri inceleyin | `api.telegram.org` için DNS/IPv6/proxy yönlendirmesini düzeltin.                                                                |
| Başlatma `getMe returned 401` bildiriyor | Yapılandırılmış token kaynağını kontrol edin       | BotFather token'ını yeniden kopyalayın veya yeniden oluşturun ve `botToken`, `tokenFile` veya varsayılan hesap `TELEGRAM_BOT_TOKEN` değerini güncelleyin. |
| Polling duruyor veya yavaş yeniden bağlanıyor | Polling tanıları için `openclaw logs --follow`     | Yükseltin; yeniden başlatmalar yanlış pozitifse `pollingStallThresholdMs` değerini ayarlayın. Kalıcı durmalar hâlâ proxy/DNS/IPv6 sorununa işaret eder. |
| `setMyCommands` başlatmada reddediliyor | Günlüklerde `BOT_COMMANDS_TOO_MUCH` arayın         | Plugin/skill/özel Telegram komutlarını azaltın veya yerel menüleri devre dışı bırakın.                                         |
| Yükseltmeden sonra izin listesi sizi engelliyor | `openclaw security audit` ve yapılandırma izin listeleri | `openclaw doctor --fix` çalıştırın veya `@username` yerine sayısal gönderen kimlikleri kullanın.                               |

Tam sorun giderme: [Telegram sorun giderme](/tr/channels/telegram#troubleshooting)

## Discord

### Discord hata imzaları

| Belirti                         | En hızlı kontrol                      | Düzeltme                                                   |
| ------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Bot çevrimiçi ama loncada yanıt yok | `openclaw channels status --probe`    | Lonca/kanala izin verin ve mesaj içeriği niyetini doğrulayın. |
| Grup mesajları yok sayılıyor    | Mention kapısı düşüşleri için günlükleri kontrol edin | Botu mention edin veya lonca/kanal `requireMention: false` ayarlayın. |
| DM yanıtları eksik              | `openclaw pairing list discord`       | DM eşleştirmesini onaylayın veya DM ilkesini ayarlayın.    |

Tam sorun giderme: [Discord sorun giderme](/tr/channels/discord#troubleshooting)

## Slack

### Slack hata imzaları

| Belirti                                | En hızlı kontrol                           | Düzeltme                                                                                                                                              |
| -------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode bağlı ama yanıt yok        | `openclaw channels status --probe`         | App token + bot token ve gerekli kapsamları doğrulayın; SecretRef destekli kurulumlarda `botTokenStatus` / `appTokenStatus = configured_unavailable` için izleyin. |
| DM'ler engellenmiş                     | `openclaw pairing list slack`              | Eşleştirmeyi onaylayın veya DM ilkesini gevşetin.                                                                                                     |
| Kanal mesajı yok sayılıyor             | `groupPolicy` ve kanal izin listesini kontrol edin | Kanala izin verin veya ilkeyi `open` olarak değiştirin.                                                                                               |

Tam sorun giderme: [Slack sorun giderme](/tr/channels/slack#troubleshooting)

## iMessage ve BlueBubbles

### iMessage ve BlueBubbles hata imzaları

| Belirti                          | En hızlı kontrol                                                       | Düzeltme                                                |
| -------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- |
| Gelen olay yok                   | Webhook/sunucu erişilebilirliğini ve uygulama izinlerini doğrulayın   | Webhook URL'sini veya BlueBubbles sunucu durumunu düzeltin. |
| macOS'ta gönderebiliyor ama alamıyor | Messages otomasyonu için macOS gizlilik izinlerini kontrol edin       | TCC izinlerini yeniden verin ve kanal sürecini yeniden başlatın. |
| DM gönderen engellenmiş          | `openclaw pairing list imessage` veya `openclaw pairing list bluebubbles` | Eşleştirmeyi onaylayın veya izin listesini güncelleyin. |

Tam sorun giderme:

- [iMessage sorun giderme](/tr/channels/imessage#troubleshooting)
- [BlueBubbles sorun giderme](/tr/channels/bluebubbles#troubleshooting)

## Signal

### Signal hata imzaları

| Belirti                         | En hızlı kontrol                            | Düzeltme                                                  |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Daemon erişilebilir ama bot sessiz | `openclaw channels status --probe`          | `signal-cli` daemon URL/hesabını ve alma modunu doğrulayın. |
| DM engellenmiş                  | `openclaw pairing list signal`              | Göndereni onaylayın veya DM ilkesini ayarlayın.           |
| Grup yanıtları tetiklenmiyor    | Grup izin listesini ve mention kalıplarını kontrol edin | Gönderen/grup ekleyin veya kapıyı gevşetin.               |

Tam sorun giderme: [Signal sorun giderme](/tr/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot hata imzaları

| Belirti                         | En hızlı kontrol                             | Düzeltme                                                       |
| ------------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| Bot "gone to Mars" yanıtı veriyor | Yapılandırmada `appId` ve `clientSecret` değerlerini doğrulayın | Kimlik bilgilerini ayarlayın veya Gateway'i yeniden başlatın. |
| Gelen mesaj yok                 | `openclaw channels status --probe`          | QQ Open Platform üzerinde kimlik bilgilerini doğrulayın.       |
| Ses yazıya dökülmüyor           | STT sağlayıcı yapılandırmasını kontrol edin | `channels.qqbot.stt` veya `tools.media.audio` yapılandırın.    |
| Proaktif mesajlar ulaşmıyor     | QQ platform etkileşim gereksinimlerini kontrol edin | QQ, yakın zamanda etkileşim olmadan bot tarafından başlatılan mesajları engelleyebilir. |

Tam sorun giderme: [QQ Bot sorun giderme](/tr/channels/qqbot#troubleshooting)

## Matrix

### Matrix hata imzaları

| Belirti                             | En hızlı kontrol                        | Düzeltme                                                                   |
| ----------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Giriş yapılmış ama oda mesajlarını yok sayıyor | `openclaw channels status --probe`      | `groupPolicy`, oda izin listesi ve mention kapısını kontrol edin.          |
| DM'ler işlenmiyor                   | `openclaw pairing list matrix`          | Göndereni onaylayın veya DM ilkesini ayarlayın.                            |
| Şifreli odalar başarısız oluyor     | `openclaw matrix verify status`         | Cihazı yeniden doğrulayın, ardından `openclaw matrix verify backup status` kontrol edin. |
| Yedek geri yükleme beklemede/bozuk  | `openclaw matrix verify backup status`  | `openclaw matrix verify backup restore` çalıştırın veya bir kurtarma anahtarıyla yeniden çalıştırın. |
| Çapraz imzalama/bootstrap yanlış görünüyor | `openclaw matrix verify bootstrap`      | Gizli depolamayı, çapraz imzalamayı ve yedek durumunu tek geçişte onarın.  |

Tam kurulum ve yapılandırma: [Matrix](/tr/channels/matrix)

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
