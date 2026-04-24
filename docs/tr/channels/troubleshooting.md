---
read_when:
    - Kanal taşıması bağlı görünüyor ama yanıtlar başarısız oluyor
    - Derin sağlayıcı belgelerine geçmeden önce kanala özgü denetimlere ihtiyacınız var
summary: Kanal başına hata imzaları ve düzeltmelerle hızlı kanal düzeyi sorun giderme
title: Kanal sorun giderme
x-i18n:
    generated_at: "2026-04-24T09:00:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae605835c3566958341b11d8bdfc3cd4cb4656142bb2953933d06ed6018a483f
    source_path: channels/troubleshooting.md
    workflow: 15
---

Bir kanal bağlanıyor ama davranış yanlışsa bu sayfayı kullanın.

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
- Kanal probe çıktısı, taşımanın bağlı olduğunu ve desteklenen yerlerde `works` veya `audit ok` durumunu gösterir

## WhatsApp

### WhatsApp hata imzaları

| Belirti                        | En hızlı kontrol                              | Düzeltme                                               |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------ |
| Bağlı ama DM yanıtı yok        | `openclaw pairing list whatsapp`              | Göndereni onaylayın veya DM politikası/izin listesini değiştirin. |
| Grup mesajları yok sayılıyor   | Yapılandırmada `requireMention` + bahsetme kalıplarını kontrol edin | Bottan bahsedin veya o grup için bahsetme politikasını gevşetin. |
| Rastgele bağlantı kesilmesi/yeniden giriş döngüleri | `openclaw channels status --probe` + günlükler | Yeniden giriş yapın ve kimlik bilgileri dizininin sağlıklı olduğunu doğrulayın. |

Tam sorun giderme: [WhatsApp sorun giderme](/tr/channels/whatsapp#troubleshooting)

## Telegram

### Telegram hata imzaları

| Belirti                            | En hızlı kontrol                               | Düzeltme                                                                                                            |
| ---------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/start` var ama kullanılabilir yanıt akışı yok | `openclaw pairing list telegram`               | Eşleştirmeyi onaylayın veya DM politikasını değiştirin.                                                             |
| Bot çevrimiçi ama grup sessiz kalıyor | Bahsetme gereksinimini ve bot gizlilik modunu doğrulayın | Grup görünürlüğü için gizlilik modunu kapatın veya bottan bahsedin.                                                 |
| Ağ hatalarıyla gönderim başarısız oluyor | Günlüklerde Telegram API çağrı hatalarını inceleyin | `api.telegram.org` için DNS/IPv6/proxy yönlendirmesini düzeltin.                                                    |
| Polling takılıyor veya yavaş yeniden bağlanıyor | Polling tanılamaları için `openclaw logs --follow` | Yükseltin; yeniden başlatmalar yanlış pozitifse `pollingStallThresholdMs` değerini ayarlayın. Kalıcı takılmalar yine proxy/DNS/IPv6 sorununa işaret eder. |
| Başlangıçta `setMyCommands` reddedildi | Günlüklerde `BOT_COMMANDS_TOO_MUCH` arayın     | Plugin/Skills/özel Telegram komutlarını azaltın veya yerel menüleri devre dışı bırakın.                           |
| Yükselttiniz ve izin listesi sizi engelliyor | `openclaw security audit` ve yapılandırma izin listeleri | `openclaw doctor --fix` çalıştırın veya `@username` yerine sayısal gönderici kimlikleri kullanın.                  |

Tam sorun giderme: [Telegram sorun giderme](/tr/channels/telegram#troubleshooting)

## Discord

### Discord hata imzaları

| Belirti                        | En hızlı kontrol                      | Düzeltme                                                    |
| ------------------------------ | ------------------------------------- | ----------------------------------------------------------- |
| Bot çevrimiçi ama sunucu yanıtı yok | `openclaw channels status --probe`    | Sunucu/kanala izin verin ve mesaj içeriği yetkisini doğrulayın. |
| Grup mesajları yok sayılıyor   | Günlüklerde bahsetme geçidi düşüşlerini kontrol edin | Bottan bahsedin veya sunucu/kanal için `requireMention: false` ayarlayın. |
| DM yanıtları eksik             | `openclaw pairing list discord`       | DM eşleştirmesini onaylayın veya DM politikasını ayarlayın. |

Tam sorun giderme: [Discord sorun giderme](/tr/channels/discord#troubleshooting)

## Slack

### Slack hata imzaları

| Belirti                               | En hızlı kontrol                      | Düzeltme                                                                                                                                       |
| ------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode bağlı ama yanıt yok       | `openclaw channels status --probe`    | Uygulama token'ı + bot token'ını ve gerekli kapsamları doğrulayın; SecretRef destekli kurulumlarda `botTokenStatus` / `appTokenStatus = configured_unavailable` durumlarını izleyin. |
| DM'ler engelleniyor                   | `openclaw pairing list slack`         | Eşleştirmeyi onaylayın veya DM politikasını gevşetin.                                                                                          |
| Kanal mesajı yok sayılıyor            | `groupPolicy` ve kanal izin listesini kontrol edin | Kanala izin verin veya politikayı `open` olarak değiştirin.                                                                                   |

Tam sorun giderme: [Slack sorun giderme](/tr/channels/slack#troubleshooting)

## iMessage ve BlueBubbles

### iMessage ve BlueBubbles hata imzaları

| Belirti                         | En hızlı kontrol                                                          | Düzeltme                                              |
| ------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Gelen olay yok                  | Webhook/sunucu erişilebilirliğini ve uygulama izinlerini doğrulayın       | Webhook URL'sini veya BlueBubbles sunucu durumunu düzeltin. |
| Gönderebiliyor ama macOS'ta alamıyor | Messages otomasyonu için macOS gizlilik izinlerini kontrol edin           | TCC izinlerini yeniden verin ve kanal sürecini yeniden başlatın. |
| DM göndereni engellenmiş        | `openclaw pairing list imessage` veya `openclaw pairing list bluebubbles` | Eşleştirmeyi onaylayın veya izin listesini güncelleyin. |

Tam sorun giderme:

- [iMessage sorun giderme](/tr/channels/imessage#troubleshooting)
- [BlueBubbles sorun giderme](/tr/channels/bluebubbles#troubleshooting)

## Signal

### Signal hata imzaları

| Belirti                        | En hızlı kontrol                      | Düzeltme                                                      |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------- |
| Daemon erişilebilir ama bot sessiz | `openclaw channels status --probe`    | `signal-cli` daemon URL/account ve alma modunu doğrulayın.    |
| DM engelleniyor                | `openclaw pairing list signal`        | Göndereni onaylayın veya DM politikasını ayarlayın.           |
| Grup yanıtları tetiklenmiyor   | Grup izin listesini ve bahsetme kalıplarını kontrol edin | Gönderen/grup ekleyin veya geçidi gevşetin.                   |

Tam sorun giderme: [Signal sorun giderme](/tr/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot hata imzaları

| Belirti                         | En hızlı kontrol                              | Düzeltme                                                          |
| ------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Bot "gone to Mars" diye yanıt veriyor | Yapılandırmada `appId` ve `clientSecret` değerlerini doğrulayın | Kimlik bilgilerini ayarlayın veya Gateway'i yeniden başlatın.     |
| Gelen mesaj yok                 | `openclaw channels status --probe`            | QQ Open Platform üzerindeki kimlik bilgilerini doğrulayın.        |
| Ses yazıya dökülmüyor           | STT sağlayıcı yapılandırmasını kontrol edin   | `channels.qqbot.stt` veya `tools.media.audio` yapılandırın.       |
| Proaktif mesajlar ulaşmıyor     | QQ platform etkileşim gereksinimlerini kontrol edin | QQ, yakın zamanda etkileşim olmadan botun başlattığı mesajları engelleyebilir. |

Tam sorun giderme: [QQ Bot sorun giderme](/tr/channels/qqbot#troubleshooting)

## Matrix

### Matrix hata imzaları

| Belirti                            | En hızlı kontrol                         | Düzeltme                                                                    |
| ---------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Giriş yapılmış ama oda mesajlarını yok sayıyor | `openclaw channels status --probe`       | `groupPolicy`, oda izin listesi ve bahsetme geçidini kontrol edin.          |
| DM'ler işlenmiyor                  | `openclaw pairing list matrix`           | Göndereni onaylayın veya DM politikasını ayarlayın.                         |
| Şifrelenmiş odalar başarısız oluyor | `openclaw matrix verify status`          | Cihazı yeniden doğrulayın, ardından `openclaw matrix verify backup status` kontrol edin. |
| Yedek geri yükleme beklemede/bozuk | `openclaw matrix verify backup status`   | `openclaw matrix verify backup restore` çalıştırın veya kurtarma anahtarıyla yeniden deneyin. |
| Çapraz imzalama/bootstrap yanlış görünüyor | `openclaw matrix verify bootstrap`       | Gizli depolamayı, çapraz imzalamayı ve yedek durumunu tek geçişte onarın.   |

Tam kurulum ve yapılandırma: [Matrix](/tr/channels/matrix)

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
