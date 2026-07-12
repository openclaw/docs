---
read_when:
    - Zalo özellikleri veya webhook'lar üzerinde çalışma
summary: Zalo bot desteği durumu, yetenekleri ve yapılandırması
title: Zalo
x-i18n:
    generated_at: "2026-07-12T12:06:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Durum: deneysel. Doğrudan mesajlar ve grup sohbetleri uygulanmıştır; aşağıdaki [Yetenekler](#capabilities) tablosu, Zalo Bot Creator / Marketplace botlarında doğrulanmış davranışı yansıtır.

## Paketle gelen Plugin

Zalo, güncel OpenClaw sürümlerinde paketle gelen bir Plugin olarak sunulur; bu nedenle paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Eski bir derlemede veya Zalo'yu hariç tutan özel bir kurulumda npm paketini doğrudan yükleyin:

- Yükleme: `openclaw plugins install @openclaw/zalo`
- Sabitlenmiş sürüm: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Yerel bir çalışma kopyasından: `openclaw plugins install ./path/to/local/zalo-plugin`
- Ayrıntılar: [Pluginler](/tr/tools/plugin)

## Hızlı kurulum

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) adresinde bir bot belirteci oluşturun (oturum açın, bir bot oluşturun, ayarları yapılandırın). Belirteç `numeric_id:secret` biçimindedir; Marketplace botlarında kullanılabilir çalışma zamanı belirteci, botun karşılama mesajında görünebilir.
2. Belirteci yalnızca varsayılan hesap için `ZALO_BOT_TOKEN=...` ortam değişkeniyle veya yapılandırmada ayarlayın.
3. Gateway'i yeniden başlatın.
4. İlk doğrudan mesaj bağlantısında eşleştirme kodunu onaylayın (varsayılan doğrudan mesaj politikası eşleştirmedir).

Asgari yapılandırma:

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

Çoklu hesap: `channels.zalo.accounts.<id>` altına her biri kendi `botToken`/`name` değerine sahip ek girdiler ekleyin. `channels.zalo.botToken` (`accounts` olmadan düz biçim), eski tek hesaplı kısa gösterimdir; yeni yapılandırmalarda `accounts.<id>.*` biçimini tercih edin.

## Nedir?

Zalo, Vietnam odaklı bir mesajlaşma uygulamasıdır. Bot API'si, Gateway'in hem bire bir görüşmelerde hem de grup sohbetlerinde bir bot çalıştırmasına ve iletileri belirlenimsel olarak Zalo'ya geri yönlendirmesine olanak tanır (model hiçbir zaman kanalları seçmez).

Bu sayfa **Zalo Bot Creator / Marketplace botlarını** kapsar. **Zalo Official Account (OA) botları** farklı bir ürün yüzeyidir ve farklı davranabilir; bu sayfa onları kapsamaz.

## Nasıl çalışır?

- Gelen mesajlar, medya yer tutucularıyla birlikte paylaşılan kanal zarfına normalleştirilir.
- Yanıtlar her zaman aynı Zalo sohbetine geri yönlendirilir; alıntılı yanıtlama kullanılmaz (`replyToMode` sabit olarak kapalıdır).
- Varsayılan olarak uzun yoklama (`getUpdates`) kullanılır; Webhook modu `channels.zalo.webhookUrl` üzerinden kullanılabilir.
- Gruplarda botu tetiklemek için @bahsetme gerekir; bu, kanal başına yapılandırılamaz.

## Sınırlar

| Sınır                          | Değer                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Giden metin parçası boyutu     | 2000 karakter (Zalo API sınırı)                                               |
| Medya boyutu (gelen/giden)     | `channels.zalo.mediaMaxMb`, varsayılan `5` MB                                 |
| Webhook istek gövdesi          | 1 MB, 30 sn okuma zaman aşımı                                                 |
| Webhook hız sınırı             | Yol+istemci IP'si başına 60 sn'de 120 istek, ardından HTTP 429                 |
| Webhook yinelenen olay aralığı | 5 dakika (yol + hesap + olay adı + sohbet + gönderen + mesaj kimliğine göre)   |

## Erişim denetimi

### Doğrudan mesajlar

- `channels.zalo.dmPolicy`: `pairing` (varsayılan) | `allowlist` | `open` | `disabled`.
- Eşleştirme: bilinmeyen gönderenlere bir eşleştirme kodu verilir; onaylanana kadar mesajlar yok sayılır. Kodların süresi 1 saat sonra dolar.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Ayrıntılar: [Eşleştirme](/tr/channels/pairing)
- `channels.zalo.allowFrom`, sayısal Zalo kullanıcı kimliklerini kabul eder (kullanıcı adı araması yoktur). `open`, `"*"` gerektirir.

### Gruplar

Grup sohbetleri Plugin tarafından desteklenir (`chatTypes: ["direct", "group"]`) ve bahsetme ile grup politikası tarafından denetlenir:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom`, gruplarda hangi gönderen kimliklerinin botu tetikleyebileceğini sınırlar; ayarlanmadığında `allowFrom` kullanılır.
- Varsayılan çözümleme: `channels.zalo` yapılandırıldığında, ayarlanmamış bir `groupPolicy`, `open` olarak çözümlenir. `channels.zalo` tamamen eksik olduğunda çalışma zamanı güvenli biçimde `allowlist` değerine kapanır.
- Gerçek kullanımda bildirilen uyarı: Bazı Marketplace botu kurulumlarında bot hiçbir şekilde bir gruba eklenememiştir. Bununla karşılaşırsanız botunuzun Zalo Bot Platform ayarlarını doğrulayın; bu, OpenClaw politikası değil, platform kaynaklı bir kısıtlamadır.

## Uzun yoklama ve Webhook karşılaştırması

- Varsayılan: uzun yoklama (genel kullanıma açık URL gerekmez).
- Webhook modu: `channels.zalo.webhookUrl` ve `channels.zalo.webhookSecret` değerlerini ayarlayın.
  - Webhook URL'si HTTPS kullanmalıdır.
  - Webhook gizli anahtarı 8-256 karakter olmalıdır.
  - Zalo, olayları sabit süreli karşılaştırmayla denetlenen bir `X-Bot-Api-Secret-Token` üstbilgisiyle gönderir.
  - Gateway HTTP, Webhook isteklerini `channels.zalo.webhookPath` konumunda işler (varsayılan olarak Webhook URL'sinin yoludur).
  - İstekler `Content-Type: application/json` (veya bir `+json` medya türü) kullanmalıdır.
  - Zalo API belgelerine göre getUpdates yoklaması ile Webhook birbirini dışlar.

## Desteklenen mesaj türleri

- Metin: tam destek; 2000 karakterlik parçalara bölünür.
- Medya: gelen/giden; `mediaMaxMb` ile sınırlandırılır.
- Tepkiler, ileti dizileri, anketler ve yerel komutlar: Plugin tarafından desteklenmez.
- Akış: Plugin, blok akışı yeteneğini bildirir ancak Zalo'nun bazı diğer bölgesel kanallardan farklı olarak özel giden kuyruk/metin birleştirme ayarları yoktur; kullanım senaryonuz açısından önemliyse ortamınızdaki güncel davranışı doğrulayın.

## Yetenekler

| Özellik                    | Durum                                      |
| -------------------------- | ------------------------------------------ |
| Doğrudan mesajlar          | Destekleniyor                              |
| Gruplar                    | Destekleniyor (bahsetme koşullu)           |
| Medya (gelen/giden)        | Destekleniyor, `mediaMaxMb` ile sınırlı    |
| Tepkiler                   | Desteklenmiyor                             |
| İleti dizileri             | Desteklenmiyor                             |
| Anketler                   | Desteklenmiyor                             |
| Yerel komutlar             | Desteklenmiyor                             |
| Yanıtlama / alıntı         | Kullanılmıyor (sabit olarak kapalı)        |

## Teslim hedefleri (CLI/Cron)

Hedef olarak bir sohbet kimliği kullanın:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Sorun giderme

**Bot yanıt vermiyor:**

- Belirteci denetleyin: `openclaw channels status --probe`
- Gönderenin onaylandığını doğrulayın (eşleştirme veya `allowFrom`)
- Gateway günlüklerini denetleyin: `openclaw logs --follow`

**Webhook olayları almıyor:**

- Webhook URL'sinin HTTPS kullandığını doğrulayın
- Gizli anahtarın 8-256 karakter olduğunu doğrulayın
- Gateway HTTP uç noktasına yapılandırılmış yoldan erişilebildiğini doğrulayın
- getUpdates yoklamasının aynı anda çalışmadığını doğrulayın (birbirlerini dışlarlar)
- Ani bir istek yoğunluğu HTTP 429 döndürebilir (yol+IP başına 60 sn'de 120 istek); bekleyip yeniden deneyin

## Yapılandırma başvurusu

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

| Ayar                                         | Açıklama                                          | Varsayılan            |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | Kanal başlatmayı etkinleştir/devre dışı bırak     | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | Zalo Bot Platform'dan alınan bot belirteci        | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | Belirteci bir dosyadan oku (sembolik bağlar reddedilir) | -                |
| `channels.zalo.accounts.<id>.name`           | Görünen ad                                        | -                     |
| `channels.zalo.accounts.<id>.enabled`        | Bu hesabı etkinleştir/devre dışı bırak            | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | Hesap başına doğrudan mesaj politikası            | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | Doğrudan mesaj izin listesi (kullanıcı kimlikleri) | -                    |
| `channels.zalo.accounts.<id>.groupPolicy`    | Hesap başına grup politikası                      | bkz. [Gruplar](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Grup gönderen izin listesi; ayarlanmazsa `allowFrom` kullanılır | -          |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Gelen/giden medya sınırı (MB)                     | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | Webhook modunu etkinleştir (HTTPS gereklidir)     | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Webhook gizli anahtarı (8-256 karakter)           | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Gateway HTTP sunucusundaki Webhook yolu           | Webhook URL yolu      |
| `channels.zalo.accounts.<id>.proxy`          | API istekleri için proxy URL'si                   | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | Giden yanıt öneki geçersiz kılma değeri           | -                     |
| `channels.zalo.defaultAccount`               | Birden fazla hesap yapılandırıldığında varsayılan hesap | `default`       |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` ve diğer düz üst düzey anahtarlar, yukarıdaki alanların eski tek hesaplı kısa gösterimidir; her iki biçim de desteklenir.

Ortam değişkeni seçeneği: `ZALO_BOT_TOKEN=...` yalnızca varsayılan hesabın belirtecini çözümler.

## İlgili konular

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - doğrudan mesaj kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme koşulu
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
