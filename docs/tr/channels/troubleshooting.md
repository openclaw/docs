---
read_when:
    - Kanal aktarımı bağlı görünüyor ancak yanıtlar başarısız oluyor
    - Ayrıntılı sağlayıcı belgelerinden önce kanala özgü denetimler gerekir
summary: Hızlı kanal düzeyi sorun giderme; kanal başına hata imzaları ve düzeltmeler
title: Kanal sorunlarını giderme
x-i18n:
    generated_at: "2026-06-28T00:16:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

Bir kanal bağlandığı halde davranış yanlış olduğunda bu sayfayı kullanın.

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
- Kanal probu taşımanın bağlı olduğunu ve desteklenen yerlerde `works` veya `audit ok` gösterir

## Bir güncellemeden sonra

Telegram, iMessage, BlueBubbles dönemi yapılandırmaları veya başka bir Plugin
kanalı güncellemeden sonra kaybolduğunda bunu kullanın.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

`openclaw status --all` içinde `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` arayın. Bu, kanalın yapılandırılmış olduğu, ancak Plugin kurulum/yükleme
yolunun kanalı kaydetmek yerine bozuk bir bağımlılık ağacına takıldığı anlamına
gelir. `openclaw doctor --fix` eski Plugin bağımlılık hazırlama dizinlerini ve
eski kimlik doğrulama gölgelerini kaldırır, ardından `openclaw gateway restart`
temiz durumu yeniden yükler.

## WhatsApp

### WhatsApp hata imzaları

| Belirti                             | En hızlı kontrol                                      | Düzeltme                                                                                                                              |
| ----------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Bağlı ama DM yanıtı yok             | `openclaw pairing list whatsapp`                      | Göndereni onaylayın veya DM politikasını/izin listesini değiştirin.                                                                   |
| Grup mesajları yok sayılıyor        | Yapılandırmada `requireMention` + bahsetme desenlerini kontrol edin | Bottan bahsedin veya o grup için bahsetme politikasını gevşetin.                                                                       |
| QR oturum açma 408 ile zaman aşımına uğruyor | Gateway `HTTPS_PROXY` / `HTTP_PROXY` env değerini kontrol edin | Erişilebilir bir proxy ayarlayın; `NO_PROXY` değerini yalnızca atlamalar için kullanın.                                                |
| Rastgele bağlantı kopma/yeniden giriş döngüleri | `openclaw channels status --probe` + günlükler        | Yakın tarihli yeniden bağlantılar şu anda bağlı olsa bile işaretlenir; günlükleri izleyin, Gateway'i yeniden başlatın, dalgalanma sürerse yeniden bağlayın. |
| `status=408 Request Time-out` döngüsü | Prob, günlükler, doctor, ardından Gateway durumu       | Önce ana makine bağlantısını/zamanlamasını düzeltin; döngü sürerse kimlik doğrulamayı yedekleyip hesabı yeniden bağlayın.             |
| Yanıtlar saniyeler/dakikalar geç geliyor | `openclaw doctor --fix`                               | Doctor, Gateway olay döngüsünü bozduğu doğrulanan eski yerel TUI istemcilerini durdurur.                                               |

Tam sorun giderme: [WhatsApp sorun giderme](/tr/channels/whatsapp#troubleshooting)

## Telegram

### Telegram hata imzaları

| Belirti                              | En hızlı kontrol                                   | Düzeltme                                                                                                                        |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start` var ama kullanılabilir yanıt akışı yok | `openclaw pairing list telegram`                   | Eşleştirmeyi onaylayın veya DM politikasını değiştirin.                                                                         |
| Bot çevrim içi ama grup sessiz kalıyor | Bahsetme gerekliliğini ve bot gizlilik modunu doğrulayın | Grup görünürlüğü için gizlilik modunu devre dışı bırakın veya bottan bahsedin.                                                  |
| Ağ hatalarıyla gönderme başarısızlıkları | Telegram API çağrısı başarısızlıkları için günlükleri inceleyin | `api.telegram.org` için DNS/IPv6/proxy yönlendirmesini düzeltin.                                                               |
| Başlangıç `getMe returned 401` bildiriyor | Yapılandırılmış token kaynağını kontrol edin        | BotFather token'ını yeniden kopyalayın veya yeniden oluşturun ve `botToken`, `tokenFile` ya da varsayılan hesap `TELEGRAM_BOT_TOKEN` değerini güncelleyin. |
| Yoklama takılıyor veya yavaş yeniden bağlanıyor | Yoklama tanılamaları için `openclaw logs --follow`  | Yükseltin; yeniden başlatmalar yanlış pozitifse `pollingStallThresholdMs` değerini ayarlayın. Kalıcı takılmalar yine proxy/DNS/IPv6 sorununa işaret eder. |
| `setMyCommands` başlangıçta reddedildi | `BOT_COMMANDS_TOO_MUCH` için günlükleri inceleyin   | Plugin/skill/özel Telegram komutlarını azaltın veya yerel menüleri devre dışı bırakın.                                          |
| Yükseltme sonrası izin listesi sizi engelliyor | `openclaw security audit` ve yapılandırma izin listeleri | `openclaw doctor --fix` çalıştırın veya `@username` yerine sayısal gönderen kimlikleri kullanın.                               |

Tam sorun giderme: [Telegram sorun giderme](/tr/channels/telegram#troubleshooting)

## Discord

### Discord hata imzaları

| Belirti                                   | En hızlı kontrol                                                                                                             | Düzeltme                                                                                                                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot çevrim içi ama loncada yanıt yok      | `openclaw channels status --probe`                                                                                           | Lonca/kanala izin verin ve mesaj içeriği amacını doğrulayın.                                                                                                                                                                                                          |
| Grup mesajları yok sayılıyor              | Bahsetme geçidi nedeniyle düşenler için günlükleri kontrol edin                                                              | Bottan bahsedin veya lonca/kanal `requireMention: false` ayarlayın.                                                                                                                                                                                                   |
| Yazıyor/token kullanımı var ama Discord mesajı yok | Bunun ortam oda olayı mı yoksa modelin `message(action=send)` çağrısını kaçırdığı, katılım yapılmış bir `message_tool` odası mı olduğunu kontrol edin | Bastırılmış son yük meta verileri için Gateway ayrıntılı günlüğünü inceleyin, `messages.groupChat.unmentionedInbound` değerini doğrulayın, [Ortam oda olayları](/tr/channels/ambient-room-events) sayfasını okuyun veya normal grup istekleri için `messages.groupChat.visibleReplies: "automatic"` tutun. |
| DM yanıtları eksik                        | `openclaw pairing list discord`                                                                                              | DM eşleştirmesini onaylayın veya DM politikasını ayarlayın.                                                                                                                                                                                                           |

Tam sorun giderme: [Discord sorun giderme](/tr/channels/discord#troubleshooting)

## Slack

### Slack hata imzaları

| Belirti                                | En hızlı kontrol                          | Düzeltme                                                                                                                                             |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode bağlı ama yanıt yok        | `openclaw channels status --probe`        | Uygulama token'ını + bot token'ını ve gerekli kapsamları doğrulayın; SecretRef destekli kurulumlarda `botTokenStatus` / `appTokenStatus = configured_unavailable` değerlerini izleyin. |
| DM'ler engelleniyor                    | `openclaw pairing list slack`             | Eşleştirmeyi onaylayın veya DM politikasını gevşetin.                                                                                                |
| Kanal mesajı yok sayılıyor             | `groupPolicy` ve kanal izin listesini kontrol edin | Kanala izin verin veya politikayı `open` olarak değiştirin.                                                                                         |

Tam sorun giderme: [Slack sorun giderme](/tr/channels/slack#troubleshooting)

## iMessage

### iMessage hata imzaları

| Belirti                              | En hızlı kontrol                                         | Düzeltme                                                              |
| ------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` eksik veya macOS olmayan sistemlerde başarısız | `openclaw channels status --probe --channel imessage`    | OpenClaw'ı Messages Mac üzerinde çalıştırın veya `cliPath` için bir SSH sarmalayıcısı kullanın. |
| macOS'te gönderebiliyor ama alamıyor | Messages otomasyonu için macOS gizlilik izinlerini kontrol edin | TCC izinlerini yeniden verin ve kanal sürecini yeniden başlatın.      |
| DM göndereni engellenmiş             | `openclaw pairing list imessage`                         | Eşleştirmeyi onaylayın veya izin listesini güncelleyin.               |

Tam sorun giderme:

- [iMessage sorun giderme](/tr/channels/imessage#troubleshooting)

## Signal

### Signal hata imzaları

| Belirti                         | En hızlı kontrol                            | Düzeltme                                                  |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Daemon erişilebilir ama bot sessiz | `openclaw channels status --probe`          | `signal-cli` daemon URL/hesabını ve alma modunu doğrulayın. |
| DM engellenmiş                  | `openclaw pairing list signal`              | Göndereni onaylayın veya DM politikasını ayarlayın.       |
| Grup yanıtları tetiklenmiyor    | Grup izin listesini ve bahsetme desenlerini kontrol edin | Göndereni/grubu ekleyin veya geçidi gevşetin.             |

Tam sorun giderme: [Signal sorun giderme](/tr/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot hata imzaları

| Belirti                         | En hızlı kontrol                             | Düzeltme                                                        |
| ------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Bot "gone to Mars" yanıtı veriyor | Yapılandırmada `appId` ve `clientSecret` değerlerini doğrulayın | Kimlik bilgilerini ayarlayın veya Gateway'i yeniden başlatın.    |
| Gelen mesaj yok                 | `openclaw channels status --probe`          | QQ Open Platform üzerinde kimlik bilgilerini doğrulayın.         |
| Ses yazıya dökülmüyor           | STT sağlayıcı yapılandırmasını kontrol edin | `channels.qqbot.stt` veya `tools.media.audio` yapılandırın.      |
| Proaktif mesajlar ulaşmıyor     | QQ platform etkileşim gereksinimlerini kontrol edin | QQ, yakın zamanda etkileşim olmadan bot tarafından başlatılan mesajları engelleyebilir. |

Tam sorun giderme: [QQ Bot sorun giderme](/tr/channels/qqbot#troubleshooting)

## Matrix

### Matrix hata belirtileri

| Belirti                             | En hızlı kontrol                       | Düzeltme                                                                 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Oturum açılmış ama oda iletilerini yok sayıyor | `openclaw channels status --probe`     | `groupPolicy`, oda izin listesi ve bahsetme kısıtlamasını kontrol edin. |
| DM'ler işlenmiyor                   | `openclaw pairing list matrix`         | Göndereni onaylayın veya DM politikasını ayarlayın.                     |
| Şifreli odalar başarısız oluyor     | `openclaw matrix verify status`        | Cihazı yeniden doğrulayın, ardından `openclaw matrix verify backup status` komutunu kontrol edin. |
| Yedek geri yükleme beklemede/bozuk   | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` komutunu çalıştırın veya kurtarma anahtarıyla yeniden çalıştırın. |
| Çapraz imzalama/önyükleme hatalı görünüyor | `openclaw matrix verify bootstrap`     | Gizli depolamayı, çapraz imzalamayı ve yedek durumunu tek geçişte onarın. |

Tam kurulum ve yapılandırma: [Matrix](/tr/channels/matrix)

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
