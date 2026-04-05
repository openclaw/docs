---
read_when:
    - Kanal taşıması bağlı görünüyor ama yanıtlar başarısız oluyor
    - Ayrıntılı sağlayıcı belgelerine geçmeden önce kanala özgü denetimlere ihtiyacınız var
summary: Kanal başına hata imzaları ve düzeltmelerle hızlı kanal düzeyinde sorun giderme
title: Kanal Sorun Giderme
x-i18n:
    generated_at: "2026-04-05T13:46:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45d8220505ea420d970b20bc66e65216c2d7024b5736db1936421ffc0676e1f
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Kanal sorun giderme

Bir kanal bağlandığında ama davranış yanlış olduğunda bu sayfayı kullanın.

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
- `RPC probe: ok`
- Kanal probe’u, taşımanın bağlı olduğunu ve desteklenen yerlerde `works` veya `audit ok` gösterir

## WhatsApp

### WhatsApp hata imzaları

| Belirti                        | En hızlı denetim                            | Düzeltme                                                  |
| ------------------------------ | ------------------------------------------- | --------------------------------------------------------- |
| Bağlı ama DM yanıtı yok        | `openclaw pairing list whatsapp`            | Göndereni onaylayın veya DM ilkesi/izin listesini değiştirin. |
| Grup mesajları yok sayılıyor   | Yapılandırmada `requireMention` + bahsetme desenlerini kontrol edin | Bottan bahsedin veya bu grup için bahsetme ilkesini gevşetin. |
| Rastgele bağlantı kopma/yeniden giriş döngüleri | `openclaw channels status --probe` + günlükler | Yeniden giriş yapın ve kimlik bilgileri dizininin sağlıklı olduğunu doğrulayın. |

Tam sorun giderme: [/channels/whatsapp#troubleshooting](/channels/whatsapp#troubleshooting)

## Telegram

### Telegram hata imzaları

| Belirti                              | En hızlı denetim                           | Düzeltme                                                                   |
| ------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------- |
| `/start` var ama kullanılabilir yanıt akışı yok | `openclaw pairing list telegram`           | Eşlemeyi onaylayın veya DM ilkesini değiştirin.                            |
| Bot çevrimiçi ama grup sessiz kalıyor | Bahsetme gereksinimini ve bot gizlilik modunu doğrulayın | Grup görünürlüğü için gizlilik modunu kapatın veya bottan bahsedin.        |
| Ağ hatalarıyla gönderim başarısız    | Günlüklerde Telegram API çağrısı hatalarını inceleyin | `api.telegram.org` için DNS/IPv6/proxy yönlendirmesini düzeltin.           |
| Başlangıçta `setMyCommands` reddediliyor | Günlüklerde `BOT_COMMANDS_TOO_MUCH` değerini inceleyin | Eklenti/Skills/özel Telegram komutlarını azaltın veya yerel menüleri devre dışı bırakın. |
| Yükseltmeden sonra izin listesi sizi engelliyor | `openclaw security audit` ve yapılandırma izin listeleri | `openclaw doctor --fix` çalıştırın veya `@username` yerine sayısal gönderen kimlikleri kullanın. |

Tam sorun giderme: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Discord hata imzaları

| Belirti                      | En hızlı denetim                      | Düzeltme                                                  |
| ---------------------------- | ------------------------------------- | --------------------------------------------------------- |
| Bot çevrimiçi ama sunucu yanıtı yok | `openclaw channels status --probe`    | Sunucu/kanala izin verin ve mesaj içeriği intent’ini doğrulayın. |
| Grup mesajları yok sayılıyor | Bahsetme geçidi düşmelerini günlüklerde kontrol edin | Bottan bahsedin veya sunucu/kanal için `requireMention: false` ayarlayın. |
| DM yanıtları eksik           | `openclaw pairing list discord`       | DM eşlemesini onaylayın veya DM ilkesini ayarlayın.      |

Tam sorun giderme: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Slack hata imzaları

| Belirti                                 | En hızlı denetim                      | Düzeltme                                                                                                                                              |
| --------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode bağlı ama yanıt yok         | `openclaw channels status --probe`    | Uygulama belirtecini + bot belirtecini ve gerekli kapsamları doğrulayın; SecretRef destekli kurulumlarda `botTokenStatus` / `appTokenStatus = configured_unavailable` durumlarını izleyin. |
| DM’ler engelleniyor                     | `openclaw pairing list slack`         | Eşlemeyi onaylayın veya DM ilkesini gevşetin.                                                                                                        |
| Kanal mesajı yok sayılıyor              | `groupPolicy` ve kanal izin listesini kontrol edin | Kanala izin verin veya ilkeyi `open` olarak değiştirin.                                                                                               |

Tam sorun giderme: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage ve BlueBubbles

### iMessage ve BlueBubbles hata imzaları

| Belirti                        | En hızlı denetim                                                          | Düzeltme                                              |
| ------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Gelen olay yok                 | Webhook/sunucu erişilebilirliğini ve uygulama izinlerini doğrulayın      | Webhook URL’sini veya BlueBubbles sunucu durumunu düzeltin. |
| Gönderebiliyor ama macOS’ta alamıyor | Mesajlar otomasyonu için macOS gizlilik izinlerini kontrol edin          | TCC izinlerini yeniden verin ve kanal sürecini yeniden başlatın. |
| DM göndereni engellenmiş       | `openclaw pairing list imessage` veya `openclaw pairing list bluebubbles` | Eşlemeyi onaylayın veya izin listesini güncelleyin.  |

Tam sorun giderme:

- [/channels/imessage#troubleshooting](/tr/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/tr/channels/bluebubbles#troubleshooting)

## Signal

### Signal hata imzaları

| Belirti                      | En hızlı denetim                   | Düzeltme                                                     |
| ---------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| Daemon erişilebilir ama bot sessiz | `openclaw channels status --probe` | `signal-cli` daemon URL’sini/hesabını ve alma modunu doğrulayın. |
| DM engellenmiş               | `openclaw pairing list signal`     | Göndereni onaylayın veya DM ilkesini ayarlayın.              |
| Grup yanıtları tetiklenmiyor | Grup izin listesini ve bahsetme desenlerini kontrol edin | Göndereni/grubu ekleyin veya geçidi gevşetin.                |

Tam sorun giderme: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot hata imzaları

| Belirti                         | En hızlı denetim                              | Düzeltme                                                           |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| Bot “gone to Mars” diye yanıt veriyor | Yapılandırmada `appId` ve `clientSecret` değerlerini doğrulayın | Kimlik bilgilerini ayarlayın veya gateway’i yeniden başlatın.      |
| Gelen mesaj yok                 | `openclaw channels status --probe`            | Kimlik bilgilerini QQ Open Platform üzerinde doğrulayın.           |
| Ses metne dönüştürülmüyor       | STT sağlayıcı yapılandırmasını kontrol edin   | `channels.qqbot.stt` veya `tools.media.audio` yapılandırmasını yapın. |
| Proaktif mesajlar ulaşmıyor     | QQ platform etkileşim gereksinimlerini kontrol edin | QQ, son etkileşim olmadan bot başlatmalı mesajları engelleyebilir. |

Tam sorun giderme: [/channels/qqbot#troubleshooting](/tr/channels/qqbot#troubleshooting)

## Matrix

### Matrix hata imzaları

| Belirti                              | En hızlı denetim                     | Düzeltme                                                                  |
| ------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------- |
| Giriş yapmış ama oda mesajlarını yok sayıyor | `openclaw channels status --probe`   | `groupPolicy`, oda izin listesi ve bahsetme geçidini kontrol edin.       |
| DM’ler işlenmiyor                    | `openclaw pairing list matrix`       | Göndereni onaylayın veya DM ilkesini ayarlayın.                          |
| Şifreli odalar başarısız oluyor      | `openclaw matrix verify status`      | Cihazı yeniden doğrulayın, ardından `openclaw matrix verify backup status` kontrol edin. |
| Yedek geri yükleme beklemede/bozuk   | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` çalıştırın veya kurtarma anahtarıyla yeniden deneyin. |
| Cross-signing/bootstrap yanlış görünüyor | `openclaw matrix verify bootstrap`   | Gizli depolamayı, cross-signing’i ve yedek durumunu tek geçişte onarın.  |

Tam kurulum ve yapılandırma: [Matrix](/channels/matrix)
