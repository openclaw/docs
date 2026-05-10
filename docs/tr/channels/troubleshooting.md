---
read_when:
    - Kanal taşıması bağlı olduğunu söylüyor ancak yanıtlar başarısız oluyor
    - Ayrıntılı sağlayıcı belgelerine geçmeden önce kanala özgü kontroller yapmanız gerekir
summary: Kanal başına hata imzaları ve düzeltmelerle hızlı kanal düzeyinde sorun giderme
title: Kanal sorunlarını giderme
x-i18n:
    generated_at: "2026-05-10T19:24:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

OpenClaw kanalı bağlandığı halde davranış yanlışsa bu sayfayı kullanın.

## Komut merdiveni

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
- Kanal yoklaması taşımanın bağlı olduğunu ve desteklenen yerlerde `works` ya da `audit ok` gösterir

## WhatsApp

### WhatsApp hata belirtileri

| Belirti                             | En hızlı kontrol                                     | Düzeltme                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Bağlı ama DM yanıtı yok             | `openclaw pairing list whatsapp`                     | Göndereni onaylayın veya DM politikasını/izin listesini değiştirin.                                                              |
| Grup mesajları yok sayılıyor        | Yapılandırmada `requireMention` + bahsetme desenlerini kontrol edin | Bottan bahsedin veya o grup için bahsetme politikasını gevşetin.                                                                 |
| QR oturum açma 408 ile zaman aşımına uğruyor | Gateway `HTTPS_PROXY` / `HTTP_PROXY` ortam değişkenlerini kontrol edin | Erişilebilir bir proxy ayarlayın; `NO_PROXY` değerini yalnızca baypaslar için kullanın.                                           |
| Rastgele bağlantı kesilme/yeniden oturum açma döngüleri | `openclaw channels status --probe` + günlükler        | Şu anda bağlı olsa bile son yeniden bağlanmalar işaretlenir; günlükleri izleyin, Gateway'i yeniden başlatın, dalgalanma sürerse yeniden bağlayın. |
| Yanıtlar saniyeler/dakikalar geç geliyor | `openclaw doctor --fix`                              | Doctor, Gateway olay döngüsünü bozdukları doğrulanmış eski yerel TUI istemcilerini durdurur.                                     |

Tam sorun giderme: [WhatsApp sorun giderme](/tr/channels/whatsapp#troubleshooting)

## Telegram

### Telegram hata belirtileri

| Belirti                              | En hızlı kontrol                                   | Düzeltme                                                                                                                     |
| ------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start` var ama kullanılabilir yanıt akışı yok | `openclaw pairing list telegram`                   | Eşleştirmeyi onaylayın veya DM politikasını değiştirin.                                                                      |
| Bot çevrimiçi ama grup sessiz kalıyor | Bahsetme gereksinimini ve bot gizlilik modunu doğrulayın | Grup görünürlüğü için gizlilik modunu devre dışı bırakın veya bottan bahsedin.                                               |
| Ağ hatalarıyla gönderme başarısız    | Telegram API çağrısı hataları için günlükleri inceleyin | DNS/IPv6/proxy yönlendirmesini `api.telegram.org` için düzeltin.                                                             |
| Başlangıçta `getMe returned 401` bildiriliyor | Yapılandırılmış token kaynağını kontrol edin       | BotFather token'ını yeniden kopyalayın veya yeniden oluşturun ve `botToken`, `tokenFile` ya da varsayılan hesap `TELEGRAM_BOT_TOKEN` değerini güncelleyin. |
| Yoklama duruyor veya yavaş yeniden bağlanıyor | Yoklama tanılamaları için `openclaw logs --follow` | Yükseltin; yeniden başlatmalar yanlış pozitifse `pollingStallThresholdMs` değerini ayarlayın. Kalıcı durmalar hâlâ proxy/DNS/IPv6 sorununa işaret eder. |
| `setMyCommands` başlangıçta reddediliyor | Günlüklerde `BOT_COMMANDS_TOO_MUCH` arayın         | Plugin/skill/özel Telegram komutlarını azaltın veya yerel menüleri devre dışı bırakın.                                      |
| Yükseltme sonrası izin listesi sizi engelliyor | `openclaw security audit` ve yapılandırma izin listeleri | `openclaw doctor --fix` çalıştırın veya `@username` yerine sayısal gönderen kimlikleri kullanın.                            |

Tam sorun giderme: [Telegram sorun giderme](/tr/channels/telegram#troubleshooting)

## Discord

### Discord hata belirtileri

| Belirti                                   | En hızlı kontrol                                                        | Düzeltme                                                                                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot çevrimiçi ama sunucu yanıtları yok    | `openclaw channels status --probe`                                      | Sunucu/kanala izin verin ve mesaj içeriği iznini doğrulayın.                                                                                                         |
| Grup mesajları yok sayılıyor              | Bahsetme geçidi düşüşleri için günlükleri kontrol edin                  | Bottan bahsedin veya sunucu/kanal için `requireMention: false` ayarlayın.                                                                                            |
| Yazıyor/token kullanımı var ama Discord mesajı yok | Oturum günlüğü, asistan metnini `didSendViaMessagingTool: false` ile gösterir | Model, mesaj aracını çağırmak yerine özel yanıt verdi. Araç çağrısında güvenilir bir model kullanın veya otomatik gönderim için `messages.groupChat.visibleReplies: "automatic"` ayarlayın. |
| DM yanıtları eksik                        | `openclaw pairing list discord`                                         | DM eşleştirmesini onaylayın veya DM politikasını ayarlayın.                                                                                                          |

Tam sorun giderme: [Discord sorun giderme](/tr/channels/discord#troubleshooting)

## Slack

### Slack hata belirtileri

| Belirti                                | En hızlı kontrol                            | Düzeltme                                                                                                                                               |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socket mode bağlı ama yanıt yok        | `openclaw channels status --probe`          | Uygulama token'ını + bot token'ını ve gerekli kapsamları doğrulayın; SecretRef destekli kurulumlarda `botTokenStatus` / `appTokenStatus = configured_unavailable` için izleyin. |
| DM'ler engelleniyor                    | `openclaw pairing list slack`               | Eşleştirmeyi onaylayın veya DM politikasını gevşetin.                                                                                                  |
| Kanal mesajı yok sayılıyor             | `groupPolicy` ve kanal izin listesini kontrol edin | Kanala izin verin veya politikayı `open` olarak değiştirin.                                                                                            |

Tam sorun giderme: [Slack sorun giderme](/tr/channels/slack#troubleshooting)

## iMessage

### iMessage hata belirtileri

| Belirti                              | En hızlı kontrol                                         | Düzeltme                                                               |
| ------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `imsg` eksik veya macOS dışı sistemlerde başarısız | `openclaw channels status --probe --channel imessage`    | OpenClaw'ı Messages Mac üzerinde çalıştırın veya `cliPath` için bir SSH sarmalayıcısı kullanın. |
| macOS'ta gönderebiliyor ama alamıyor | Messages otomasyonu için macOS gizlilik izinlerini kontrol edin | TCC izinlerini yeniden verin ve kanal sürecini yeniden başlatın.       |
| DM göndereni engellenmiş             | `openclaw pairing list imessage`                         | Eşleştirmeyi onaylayın veya izin listesini güncelleyin.                |

Tam sorun giderme:

- [iMessage sorun giderme](/tr/channels/imessage#troubleshooting)

## Signal

### Signal hata belirtileri

| Belirti                         | En hızlı kontrol                             | Düzeltme                                                  |
| ------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Daemon erişilebilir ama bot sessiz | `openclaw channels status --probe`           | `signal-cli` daemon URL'sini/hesabını ve alma modunu doğrulayın. |
| DM engellenmiş                  | `openclaw pairing list signal`               | Göndereni onaylayın veya DM politikasını ayarlayın.       |
| Grup yanıtları tetiklenmiyor    | Grup izin listesini ve bahsetme desenlerini kontrol edin | Gönderen/grup ekleyin veya geçidi gevşetin.               |

Tam sorun giderme: [Signal sorun giderme](/tr/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot hata belirtileri

| Belirti                         | En hızlı kontrol                              | Düzeltme                                                        |
| ------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| Bot "Mars'a gitti" diye yanıtlıyor | Yapılandırmada `appId` ve `clientSecret` değerlerini doğrulayın | Kimlik bilgilerini ayarlayın veya Gateway'i yeniden başlatın.   |
| Gelen mesaj yok                 | `openclaw channels status --probe`            | QQ Open Platform üzerindeki kimlik bilgilerini doğrulayın.      |
| Ses yazıya dökülmüyor           | STT sağlayıcı yapılandırmasını kontrol edin   | `channels.qqbot.stt` veya `tools.media.audio` yapılandırın.     |
| Proaktif mesajlar ulaşmıyor     | QQ platform etkileşim gereksinimlerini kontrol edin | QQ, yakın tarihli etkileşim olmadan bot tarafından başlatılan mesajları engelleyebilir. |

Tam sorun giderme: [QQ Bot sorun giderme](/tr/channels/qqbot#troubleshooting)

## Matrix

### Matrix hata belirtileri

| Belirti                             | En hızlı kontrol                         | Düzeltme                                                                  |
| ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Oturum açılmış ama oda mesajlarını yok sayıyor | `openclaw channels status --probe`       | `groupPolicy`, oda izin listesi ve bahsetme geçidini kontrol edin.        |
| DM'ler işlenmiyor                   | `openclaw pairing list matrix`           | Göndereni onaylayın veya DM politikasını ayarlayın.                       |
| Şifreli odalar başarısız            | `openclaw matrix verify status`          | Cihazı yeniden doğrulayın, ardından `openclaw matrix verify backup status` kontrol edin. |
| Yedek geri yükleme beklemede/bozuk  | `openclaw matrix verify backup status`   | `openclaw matrix verify backup restore` çalıştırın veya kurtarma anahtarıyla yeniden çalıştırın. |
| Çapraz imzalama/bootstrap yanlış görünüyor | `openclaw matrix verify bootstrap`       | Gizli depolamayı, çapraz imzalamayı ve yedekleme durumunu tek geçişte onarın. |

Tam kurulum ve yapılandırma: [Matrix](/tr/channels/matrix)

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
