---
read_when:
    - Kanal aktarımı bağlı görünüyor ancak yanıtlar başarısız oluyor
    - Ayrıntılı sağlayıcı belgelerinden önce kanala özgü kontroller gerekir
summary: Kanal bazında hata imzaları ve düzeltmeleriyle hızlı kanal düzeyinde sorun giderme
title: Kanal sorun giderme
x-i18n:
    generated_at: "2026-05-04T02:22:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3a0737156ae83897c44d18505e0355a5d8e5700106b984496d94874c270deb2
    source_path: channels/troubleshooting.md
    workflow: 16
---

Bağlanan ancak davranışı yanlış olan kanallar için bu sayfayı kullanın.

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
- Kanal yoklaması taşımanın bağlı olduğunu ve desteklendiği yerlerde `works` veya `audit ok` gösterir

## WhatsApp

### WhatsApp hata imzaları

| Belirti                         | En hızlı kontrol                                     | Düzeltme                                                                                                                           |
| ------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Bağlı ancak DM yanıtı yok       | `openclaw pairing list whatsapp`                     | Göndereni onaylayın veya DM politikasını/izin listesini değiştirin.                                                                |
| Grup iletileri yok sayılıyor    | Yapılandırmada `requireMention` + mention desenlerini kontrol edin | Botu mention yapın veya o grup için mention politikasını gevşetin.                                                                 |
| QR oturum açma 408 ile zaman aşımına uğruyor | Gateway `HTTPS_PROXY` / `HTTP_PROXY` env değerlerini kontrol edin | Erişilebilir bir proxy ayarlayın; `NO_PROXY` değerini yalnızca atlamalar için kullanın.                                             |
| Rastgele bağlantı kesilme/yeniden oturum açma döngüleri | `openclaw channels status --probe` + günlükler | Şu anda bağlı olunsa bile yakın tarihli yeniden bağlanmalar işaretlenir; günlükleri izleyin, Gateway'i yeniden başlatın, dalgalanma sürerse yeniden bağlayın. |

Tam sorun giderme: [WhatsApp sorun giderme](/tr/channels/whatsapp#troubleshooting)

## Telegram

### Telegram hata imzaları

| Belirti                              | En hızlı kontrol                                    | Düzeltme                                                                                                                        |
| ------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start` var ancak kullanılabilir yanıt akışı yok | `openclaw pairing list telegram`                    | Eşleştirmeyi onaylayın veya DM politikasını değiştirin.                                                                         |
| Bot çevrimiçi ancak grup sessiz kalıyor | Mention gereksinimini ve bot gizlilik modunu doğrulayın | Grup görünürlüğü için gizlilik modunu devre dışı bırakın veya botu mention yapın.                                               |
| Ağ hatalarıyla gönderme başarısızlıkları | Telegram API çağrısı hataları için günlükleri inceleyin | `api.telegram.org` için DNS/IPv6/proxy yönlendirmesini düzeltin.                                                               |
| Başlangıç `getMe returned 401` bildiriyor | Yapılandırılmış token kaynağını kontrol edin         | BotFather token'ını yeniden kopyalayın veya yeniden oluşturun ve `botToken`, `tokenFile` ya da varsayılan hesap `TELEGRAM_BOT_TOKEN` değerini güncelleyin. |
| Polling duruyor veya yavaş yeniden bağlanıyor | Polling tanılamaları için `openclaw logs --follow`   | Yükseltin; yeniden başlatmalar yanlış pozitifse `pollingStallThresholdMs` değerini ayarlayın. Kalıcı duraklamalar yine proxy/DNS/IPv6 sorununa işaret eder. |
| Başlangıçta `setMyCommands` reddedildi | Günlüklerde `BOT_COMMANDS_TOO_MUCH` arayın           | Plugin/skill/özel Telegram komutlarını azaltın veya yerel menüleri devre dışı bırakın.                                        |
| Yükseltme sonrası izin listesi sizi engelliyor | `openclaw security audit` ve yapılandırma izin listeleri | `openclaw doctor --fix` çalıştırın veya `@username` yerine sayısal gönderen kimlikleri kullanın.                              |

Tam sorun giderme: [Telegram sorun giderme](/tr/channels/telegram#troubleshooting)

## Discord

### Discord hata imzaları

| Belirti                                   | En hızlı kontrol                                                          | Düzeltme                                                                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bot çevrimiçi ancak guild yanıtı yok      | `openclaw channels status --probe`                                        | Guild/kanala izin verin ve ileti içeriği intent ayarını doğrulayın.                                                                                                      |
| Grup iletileri yok sayılıyor              | Mention geçidi düşürmeleri için günlükleri kontrol edin                   | Botu mention yapın veya guild/kanal `requireMention: false` ayarlayın.                                                                                                   |
| Yazıyor/token kullanımı var ancak Discord iletisi yok | Oturum günlüğü asistan metnini `didSendViaMessagingTool: false` ile gösteriyor | Model, ileti aracını çağırmak yerine özel olarak yanıtladı. Araç çağrısı güvenilir bir model kullanın veya otomatik gönderim için `messages.groupChat.visibleReplies: "automatic"` ayarlayın. |
| DM yanıtları eksik                        | `openclaw pairing list discord`                                           | DM eşleştirmesini onaylayın veya DM politikasını ayarlayın.                                                                                                             |

Tam sorun giderme: [Discord sorun giderme](/tr/channels/discord#troubleshooting)

## Slack

### Slack hata imzaları

| Belirti                                | En hızlı kontrol                             | Düzeltme                                                                                                                                                 |
| -------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode bağlı ancak yanıt yok      | `openclaw channels status --probe`           | Uygulama token'ı + bot token'ını ve gerekli kapsamları doğrulayın; SecretRef destekli kurulumlarda `botTokenStatus` / `appTokenStatus = configured_unavailable` için izleyin. |
| DM'ler engellendi                      | `openclaw pairing list slack`                | Eşleştirmeyi onaylayın veya DM politikasını gevşetin.                                                                                                   |
| Kanal iletisi yok sayıldı              | `groupPolicy` ve kanal izin listesini kontrol edin | Kanala izin verin veya politikayı `open` olarak değiştirin.                                                                                             |

Tam sorun giderme: [Slack sorun giderme](/tr/channels/slack#troubleshooting)

## iMessage ve BlueBubbles

### iMessage ve BlueBubbles hata imzaları

| Belirti                          | En hızlı kontrol                                                           | Düzeltme                                                |
| -------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| Gelen olay yok                   | Webhook/sunucu erişilebilirliğini ve uygulama izinlerini doğrulayın        | Webhook URL'sini veya BlueBubbles sunucu durumunu düzeltin. |
| macOS'ta gönderebiliyor ancak alamıyor | Messages otomasyonu için macOS gizlilik izinlerini kontrol edin            | TCC izinlerini yeniden verin ve kanal sürecini yeniden başlatın. |
| DM göndereni engellendi          | `openclaw pairing list imessage` veya `openclaw pairing list bluebubbles`  | Eşleştirmeyi onaylayın veya izin listesini güncelleyin. |

Tam sorun giderme:

- [iMessage sorun giderme](/tr/channels/imessage#troubleshooting)
- [BlueBubbles sorun giderme](/tr/channels/bluebubbles#troubleshooting)

## Signal

### Signal hata imzaları

| Belirti                         | En hızlı kontrol                              | Düzeltme                                                      |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| Daemon erişilebilir ancak bot sessiz | `openclaw channels status --probe`            | `signal-cli` daemon URL/hesabını ve alma modunu doğrulayın.   |
| DM engellendi                   | `openclaw pairing list signal`                | Göndereni onaylayın veya DM politikasını ayarlayın.           |
| Grup yanıtları tetiklenmiyor    | Grup izin listesini ve mention desenlerini kontrol edin | Gönderen/grup ekleyin veya geçidi gevşetin.                   |

Tam sorun giderme: [Signal sorun giderme](/tr/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot hata imzaları

| Belirti                         | En hızlı kontrol                               | Düzeltme                                                             |
| ------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| Bot "Mars'a gitti" diye yanıtlıyor | Yapılandırmada `appId` ve `clientSecret` değerlerini doğrulayın | Kimlik bilgilerini ayarlayın veya Gateway'i yeniden başlatın.        |
| Gelen ileti yok                 | `openclaw channels status --probe`             | QQ Open Platform üzerinde kimlik bilgilerini doğrulayın.             |
| Ses metne dökülmedi             | STT sağlayıcı yapılandırmasını kontrol edin    | `channels.qqbot.stt` veya `tools.media.audio` yapılandırın.          |
| Proaktif iletiler ulaşmıyor     | QQ platform etkileşim gereksinimlerini kontrol edin | QQ, yakın tarihli etkileşim olmadan bot tarafından başlatılan iletileri engelleyebilir. |

Tam sorun giderme: [QQ Bot sorun giderme](/tr/channels/qqbot#troubleshooting)

## Matrix

### Matrix hata imzaları

| Belirti                             | En hızlı kontrol                          | Düzeltme                                                                    |
| ----------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Oturum açıldı ancak oda iletilerini yok sayıyor | `openclaw channels status --probe`        | `groupPolicy`, oda izin listesi ve mention geçidini kontrol edin.           |
| DM'ler işlenmiyor                   | `openclaw pairing list matrix`            | Göndereni onaylayın veya DM politikasını ayarlayın.                         |
| Şifreli odalar başarısız oluyor     | `openclaw matrix verify status`           | Cihazı yeniden doğrulayın, ardından `openclaw matrix verify backup status` kontrol edin. |
| Yedek geri yükleme beklemede/bozuk  | `openclaw matrix verify backup status`    | `openclaw matrix verify backup restore` çalıştırın veya bir kurtarma anahtarıyla yeniden çalıştırın. |
| Cross-signing/bootstrap yanlış görünüyor | `openclaw matrix verify bootstrap`        | Gizli depolamayı, cross-signing'i ve yedek durumunu tek geçişte onarın.     |

Tam kurulum ve yapılandırma: [Matrix](/tr/channels/matrix)

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
