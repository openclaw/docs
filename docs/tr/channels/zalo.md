---
read_when:
    - Zalo özellikleri veya Webhook'lar üzerinde çalışma
summary: Zalo bot destek durumu, yetenekleri ve yapılandırması
title: Zalo
x-i18n:
    generated_at: "2026-04-30T09:09:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

Durum: deneysel. DM'ler desteklenir. Aşağıdaki [Yetenekler](#capabilities) bölümü geçerli Marketplace botu davranışını yansıtır.

## Birlikte Gelen Plugin

Zalo, geçerli OpenClaw sürümlerinde birlikte gelen bir Plugin olarak gönderilir; bu nedenle normal paketlenmiş
derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derlemede veya Zalo'yu dışarıda bırakan özel bir kurulumdaysanız, yayınlandığında
geçerli bir npm paketini kurun:

- CLI ile kurun: `openclaw plugins install @openclaw/zalo`
- Ya da kaynak checkout'tan: `openclaw plugins install ./path/to/local/zalo-plugin`
- Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

npm, OpenClaw'a ait paketi kullanımdan kaldırılmış olarak bildirirse, daha yeni bir npm paketi
yayınlanana kadar geçerli bir paketlenmiş OpenClaw derlemesi veya yerel checkout yolunu kullanın.

## Hızlı kurulum (başlangıç)

1. Zalo Plugin'in kullanılabilir olduğundan emin olun.
   - Geçerli paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Daha eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
2. Token'ı ayarlayın:
   - Env: `ZALO_BOT_TOKEN=...`
   - Ya da config: `channels.zalo.accounts.default.botToken: "..."`.
3. Gateway'i yeniden başlatın (veya kurulumu tamamlayın).
4. DM erişimi varsayılan olarak pairing kullanır; ilk iletişimde pairing kodunu onaylayın.

Minimal config:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Nedir

Zalo, Vietnam odaklı bir mesajlaşma uygulamasıdır; Bot API'si Gateway'in 1:1 konuşmalar için bir bot çalıştırmasını sağlar.
Zalo'ya deterministik yönlendirme istediğiniz destek veya bildirim kullanım durumları için uygundur.

Bu sayfa, **Zalo Bot Creator / Marketplace botları** için geçerli OpenClaw davranışını yansıtır.
**Zalo Official Account (OA) botları** farklı bir Zalo ürün yüzeyidir ve farklı davranabilir.

- Gateway'in sahip olduğu bir Zalo Bot API kanalı.
- Deterministik yönlendirme: yanıtlar Zalo'ya geri gider; model hiçbir zaman kanalları seçmez.
- DM'ler ajanın ana oturumunu paylaşır.
- Aşağıdaki [Yetenekler](#capabilities) bölümü geçerli Marketplace botu desteğini gösterir.

## Kurulum (hızlı yol)

### 1) Bir bot token'ı oluşturun (Zalo Bot Platform)

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) adresine gidin ve oturum açın.
2. Yeni bir bot oluşturun ve ayarlarını yapılandırın.
3. Tam bot token'ını kopyalayın (genellikle `numeric_id:secret`). Marketplace botları için kullanılabilir çalışma zamanı token'ı, oluşturma sonrasında botun karşılama mesajında görünebilir.

### 2) Token'ı yapılandırın (env veya config)

Örnek:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Daha sonra grupların kullanılabilir olduğu bir Zalo bot yüzeyine geçerseniz `groupPolicy` ve `groupAllowFrom` gibi gruba özel config'i açıkça ekleyebilirsiniz. Geçerli Marketplace botu davranışı için bkz. [Yetenekler](#capabilities).

Env seçeneği: `ZALO_BOT_TOKEN=...` (yalnızca varsayılan hesap için çalışır).

Çoklu hesap desteği: hesap başına token'lar ve isteğe bağlı `name` ile `channels.zalo.accounts` kullanın.

3. Gateway'i yeniden başlatın. Bir token çözümlendiğinde (env veya config) Zalo başlar.
4. DM erişimi varsayılan olarak pairing kullanır. Botla ilk iletişime geçildiğinde kodu onaylayın.

## Nasıl çalışır (davranış)

- Gelen mesajlar, medya placeholder'larıyla birlikte paylaşılan kanal zarfına normalleştirilir.
- Yanıtlar her zaman aynı Zalo sohbetine geri yönlendirilir.
- Varsayılan olarak long-polling; webhook modu `channels.zalo.webhookUrl` ile kullanılabilir.

## Sınırlar

- Giden metin 2000 karakterlik parçalara bölünür (Zalo API sınırı).
- Medya indirme/yükleme işlemleri `channels.zalo.mediaMaxMb` ile sınırlandırılır (varsayılan 5).
- 2000 karakter sınırı streaming'i daha az kullanışlı hale getirdiği için streaming varsayılan olarak engellenir.

## Erişim denetimi (DM'ler)

### DM erişimi

- Varsayılan: `channels.zalo.dmPolicy = "pairing"`. Bilinmeyen gönderenler bir pairing kodu alır; onaylanana kadar mesajlar yok sayılır (kodlar 1 saat sonra sona erer).
- Şununla onaylayın:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing varsayılan token değişimidir. Ayrıntılar: [Pairing](/tr/channels/pairing)
- `channels.zalo.allowFrom` sayısal kullanıcı kimliklerini kabul eder (kullanıcı adı araması yoktur).

## Erişim denetimi (Gruplar)

**Zalo Bot Creator / Marketplace botları** için grup desteği pratikte kullanılabilir değildi, çünkü bot hiçbir şekilde bir gruba eklenemiyordu.

Bu, aşağıdaki grupla ilgili config anahtarlarının şemada mevcut olduğu, ancak Marketplace botları için kullanılamadığı anlamına gelir:

- `channels.zalo.groupPolicy` gelen grup işleme davranışını denetler: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom`, gruplarda hangi gönderen kimliklerinin botu tetikleyebileceğini sınırlar.
- `groupAllowFrom` ayarlanmamışsa Zalo, gönderen denetimleri için `allowFrom` değerine geri döner.
- Çalışma zamanı notu: `channels.zalo` tamamen eksikse çalışma zamanı güvenlik için yine de `groupPolicy="allowlist"` değerine geri döner.

Grup ilkesi değerleri (bot yüzeyinizde grup erişimi kullanılabilir olduğunda) şunlardır:

- `groupPolicy: "disabled"` — tüm grup mesajlarını engeller.
- `groupPolicy: "open"` — herhangi bir grup üyesine izin verir (mention kapılı).
- `groupPolicy: "allowlist"` — hata durumunda kapalı varsayılan; yalnızca izin verilen gönderenler kabul edilir.

Farklı bir Zalo bot ürün yüzeyi kullanıyor ve çalışan grup davranışını doğrulamışsanız, bunun Marketplace botu akışıyla eşleştiğini varsaymak yerine bunu ayrı olarak belgeleyin.

## Long-polling ve webhook

- Varsayılan: long-polling (genel URL gerekmez).
- Webhook modu: `channels.zalo.webhookUrl` ve `channels.zalo.webhookSecret` ayarlayın.
  - Webhook secret 8-256 karakter olmalıdır.
  - Webhook URL'si HTTPS kullanmalıdır.
  - Zalo, doğrulama için olayları `X-Bot-Api-Secret-Token` header'ı ile gönderir.
  - Gateway HTTP, webhook isteklerini `channels.zalo.webhookPath` üzerinde işler (varsayılan olarak webhook URL path'i).
  - İstekler `Content-Type: application/json` (veya `+json` medya türleri) kullanmalıdır.
  - Yinelenen olaylar (`event_name + message_id`) kısa bir tekrar penceresi boyunca yok sayılır.
  - Ani trafik, path/kaynak başına rate limit'e tabidir ve HTTP 429 döndürebilir.

**Not:** getUpdates (polling) ve webhook, Zalo API belgelerine göre birbirini dışlar.

## Desteklenen mesaj türleri

Hızlı bir destek özeti için bkz. [Yetenekler](#capabilities). Aşağıdaki notlar, davranışın ek bağlam gerektirdiği yerlerde ayrıntı ekler.

- **Metin mesajları**: 2000 karakterlik parçalara bölme ile tam destek.
- **Metindeki düz URL'ler**: Normal metin girdisi gibi davranır.
- **Bağlantı önizlemeleri / zengin bağlantı kartları**: [Yetenekler](#capabilities) bölümündeki Marketplace botu durumuna bakın; bunlar güvenilir şekilde bir yanıt tetiklemedi.
- **Görsel mesajları**: [Yetenekler](#capabilities) bölümündeki Marketplace botu durumuna bakın; gelen görsel işleme güvenilir değildi (son yanıt olmadan yazıyor göstergesi).
- **Çıkartmalar**: [Yetenekler](#capabilities) bölümündeki Marketplace botu durumuna bakın.
- **Sesli notlar / ses dosyaları / video / genel dosya ekleri**: [Yetenekler](#capabilities) bölümündeki Marketplace botu durumuna bakın.
- **Desteklenmeyen türler**: Günlüğe yazılır (örneğin, korumalı kullanıcılardan gelen mesajlar).

## Yetenekler

Bu tablo, OpenClaw'da geçerli **Zalo Bot Creator / Marketplace botu** davranışını özetler.

| Özellik                    | Durum                                                |
| -------------------------- | ---------------------------------------------------- |
| Doğrudan mesajlar          | ✅ Desteklenir                                      |
| Gruplar                    | ❌ Marketplace botları için kullanılamaz             |
| Medya (gelen görseller)    | ⚠️ Sınırlı / ortamınızda doğrulayın                  |
| Medya (giden görseller)    | ⚠️ Marketplace botları için yeniden test edilmedi    |
| Metindeki düz URL'ler      | ✅ Desteklenir                                      |
| Bağlantı önizlemeleri      | ⚠️ Marketplace botları için güvenilir değil          |
| Tepkiler                   | ❌ Desteklenmez                                     |
| Çıkartmalar                | ⚠️ Marketplace botları için ajan yanıtı yok          |
| Sesli notlar / ses / video | ⚠️ Marketplace botları için ajan yanıtı yok          |
| Dosya ekleri               | ⚠️ Marketplace botları için ajan yanıtı yok          |
| Threads                    | ❌ Desteklenmez                                     |
| Polls                      | ❌ Desteklenmez                                     |
| Yerel komutlar             | ❌ Desteklenmez                                     |
| Streaming                  | ⚠️ Engellendi (2000 karakter sınırı)                 |

## Teslim hedefleri (CLI/cron)

- Hedef olarak bir sohbet kimliği kullanın.
- Örnek: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Sorun giderme

**Bot yanıt vermiyor:**

- Token'ın geçerli olduğunu kontrol edin: `openclaw channels status --probe`
- Gönderenin onaylandığını doğrulayın (pairing veya allowFrom)
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`

**Webhook olay almıyor:**

- Webhook URL'sinin HTTPS kullandığından emin olun
- Secret token'ın 8-256 karakter olduğunu doğrulayın
- Gateway HTTP endpoint'inin yapılandırılan path üzerinde erişilebilir olduğunu onaylayın
- getUpdates polling'in çalışmadığını kontrol edin (birbirlerini dışlarlar)

## Yapılandırma referansı (Zalo)

Tam yapılandırma: [Configuration](/tr/gateway/configuration)

Düz üst düzey anahtarlar (`channels.zalo.botToken`, `channels.zalo.dmPolicy` ve benzerleri) eski tek hesap kısayoludur. Yeni config'ler için `channels.zalo.accounts.<id>.*` tercih edin. Her iki biçim de şemada bulunduğu için burada hâlâ belgelenmiştir.

Provider seçenekleri:

- `channels.zalo.enabled`: kanal başlatmayı etkinleştir/devre dışı bırak.
- `channels.zalo.botToken`: Zalo Bot Platform'dan bot token'ı.
- `channels.zalo.tokenFile`: token'ı normal bir dosya path'inden oku. Symlink'ler reddedilir.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.zalo.allowFrom`: DM allowlist'i (kullanıcı kimlikleri). `open`, `"*"` gerektirir. Sihirbaz sayısal kimlikleri sorar.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist). Config'te mevcuttur; geçerli Marketplace botu davranışı için bkz. [Yetenekler](#capabilities) ve [Erişim denetimi (Gruplar)](#access-control-groups).
- `channels.zalo.groupAllowFrom`: grup gönderen allowlist'i (kullanıcı kimlikleri). Ayarlanmadığında `allowFrom` değerine geri döner.
- `channels.zalo.mediaMaxMb`: gelen/giden medya sınırı (MB, varsayılan 5).
- `channels.zalo.webhookUrl`: webhook modunu etkinleştir (HTTPS gerekir).
- `channels.zalo.webhookSecret`: webhook secret (8-256 karakter).
- `channels.zalo.webhookPath`: Gateway HTTP sunucusundaki webhook path'i.
- `channels.zalo.proxy`: API istekleri için proxy URL'si.

Çoklu hesap seçenekleri:

- `channels.zalo.accounts.<id>.botToken`: hesap başına token.
- `channels.zalo.accounts.<id>.tokenFile`: hesap başına normal token dosyası. Symlink'ler reddedilir.
- `channels.zalo.accounts.<id>.name`: görünen ad.
- `channels.zalo.accounts.<id>.enabled`: hesabı etkinleştir/devre dışı bırak.
- `channels.zalo.accounts.<id>.dmPolicy`: hesap başına DM ilkesi.
- `channels.zalo.accounts.<id>.allowFrom`: hesap başına allowlist.
- `channels.zalo.accounts.<id>.groupPolicy`: hesap başına grup ilkesi. Config'te mevcuttur; geçerli Marketplace botu davranışı için bkz. [Yetenekler](#capabilities) ve [Erişim denetimi (Gruplar)](#access-control-groups).
- `channels.zalo.accounts.<id>.groupAllowFrom`: hesap başına grup gönderen allowlist'i.
- `channels.zalo.accounts.<id>.webhookUrl`: hesap başına webhook URL'si.
- `channels.zalo.accounts.<id>.webhookSecret`: hesap başına webhook secret.
- `channels.zalo.accounts.<id>.webhookPath`: hesap başına webhook path'i.
- `channels.zalo.accounts.<id>.proxy`: hesap başına proxy URL'si.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve pairing akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güçlendirme
