---
read_when:
    - Zalo özellikleri veya webhook'lar üzerinde çalışırken
summary: Zalo bot desteği durumu, yetenekleri ve yapılandırması
title: Zalo
x-i18n:
    generated_at: "2026-04-05T13:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab94642ba28e79605b67586af8f71c18bc10e0af60343a7df508e6823b6f4119
    source_path: channels/zalo.md
    workflow: 15
---

# Zalo (Bot API)

Durum: deneysel. DM'ler desteklenir. Aşağıdaki [Yetenekler](#capabilities) bölümü mevcut Marketplace bot davranışını yansıtır.

## Paketlenmiş plugin

Zalo, mevcut OpenClaw sürümlerinde paketlenmiş bir plugin olarak gelir; bu nedenle normal paketlenmiş
derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemeyi veya Zalo'yu içermeyen özel bir kurulumu kullanıyorsanız bunu
el ile yükleyin:

- CLI ile yükleyin: `openclaw plugins install @openclaw/zalo`
- Veya bir kaynak checkout'tan: `openclaw plugins install ./path/to/local/zalo-plugin`
- Ayrıntılar: [Plugins](/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Zalo plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla el ile ekleyebilir.
2. Token'ı ayarlayın:
   - Ortam değişkeni: `ZALO_BOT_TOKEN=...`
   - Veya yapılandırma: `channels.zalo.accounts.default.botToken: "..."`.
3. Gateway'i yeniden başlatın (veya kurulumu tamamlayın).
4. DM erişimi varsayılan olarak eşleştirmedir; ilk temasta eşleştirme kodunu onaylayın.

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

## Nedir

Zalo, Vietnam odaklı bir mesajlaşma uygulamasıdır; Bot API'si Gateway'in 1:1 konuşmalar için bir bot çalıştırmasına olanak tanır.
Yanıtların belirlenimli olarak Zalo'ya geri yönlendirilmesini istediğiniz destek veya bildirim senaryoları için iyi bir seçenektir.

Bu sayfa, **Zalo Bot Creator / Marketplace botları** için mevcut OpenClaw davranışını yansıtır.
**Zalo Official Account (OA) botları** Zalo'nun farklı bir ürün yüzeyidir ve farklı davranabilir.

- Gateway'e ait bir Zalo Bot API kanalı.
- Belirlenimli yönlendirme: yanıtlar Zalo'ya geri gider; model kanalları seçmez.
- DM'ler ajanın ana oturumunu paylaşır.
- Aşağıdaki [Yetenekler](#capabilities) bölümü mevcut Marketplace bot desteğini gösterir.

## Kurulum (hızlı yol)

### 1) Bir bot token'ı oluşturun (Zalo Bot Platform)

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) adresine gidin ve oturum açın.
2. Yeni bir bot oluşturun ve ayarlarını yapılandırın.
3. Tam bot token'ını kopyalayın (genellikle `numeric_id:secret`). Marketplace botları için kullanılabilir çalışma zamanı token'ı, oluşturma işleminden sonra botun hoş geldin mesajında görünebilir.

### 2) Token'ı yapılandırın (ortam değişkeni veya yapılandırma)

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

Daha sonra grupların kullanılabildiği bir Zalo bot yüzeyine geçerseniz `groupPolicy` ve `groupAllowFrom` gibi gruba özgü yapılandırmaları açıkça ekleyebilirsiniz. Mevcut Marketplace bot davranışı için bkz. [Yetenekler](#capabilities).

Ortam değişkeni seçeneği: `ZALO_BOT_TOKEN=...` (yalnızca varsayılan hesap için çalışır).

Çoklu hesap desteği: hesap başına token ve isteğe bağlı `name` ile `channels.zalo.accounts` kullanın.

3. Gateway'i yeniden başlatın. Zalo, bir token çözümlendiğinde (ortam değişkeni veya yapılandırma) başlar.
4. DM erişimi varsayılan olarak eşleştirmedir. Bot ile ilk kez iletişime geçildiğinde kodu onaylayın.

## Nasıl çalışır (davranış)

- Gelen mesajlar, medya yer tutucularıyla paylaşılan kanal zarfına normalize edilir.
- Yanıtlar her zaman aynı Zalo sohbetine geri yönlendirilir.
- Varsayılan olarak long-polling kullanılır; `channels.zalo.webhookUrl` ile webhook modu kullanılabilir.

## Sınırlar

- Giden metin 2000 karaktere bölünür (Zalo API sınırı).
- Medya indirme/yükleme işlemleri `channels.zalo.mediaMaxMb` ile sınırlandırılır (varsayılan 5).
- 2000 karakter sınırı akışı daha az yararlı hale getirdiği için akış varsayılan olarak engellenir.

## Erişim denetimi (DM'ler)

### DM erişimi

- Varsayılan: `channels.zalo.dmPolicy = "pairing"`. Bilinmeyen göndericiler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- Şununla onaylayın:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Eşleştirme varsayılan token değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)
- `channels.zalo.allowFrom` sayısal kullanıcı kimliklerini kabul eder (kullanıcı adı araması yoktur).

## Erişim denetimi (Gruplar)

**Zalo Bot Creator / Marketplace botları** için grup desteği pratikte mevcut değildi çünkü bot hiçbir şekilde bir gruba eklenemiyordu.

Bu, aşağıdaki grupla ilgili yapılandırma anahtarlarının şemada bulunduğu ancak Marketplace botları için kullanılamadığı anlamına gelir:

- `channels.zalo.groupPolicy`, gruplardaki gelen işlemeyi denetler: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom`, gruplarda hangi gönderici kimliklerinin botu tetikleyebileceğini sınırlar.
- `groupAllowFrom` ayarlanmamışsa Zalo, gönderici denetimleri için `allowFrom` değerine geri döner.
- Çalışma zamanı notu: `channels.zalo` tamamen eksikse çalışma zamanı güvenlik için yine `groupPolicy="allowlist"` değerine geri döner.

Grup ilkesi değerleri (grup erişimi bot yüzeyinizde mevcut olduğunda) şunlardır:

- `groupPolicy: "disabled"` — tüm grup mesajlarını engeller.
- `groupPolicy: "open"` — herhangi bir grup üyesine izin verir (bahsetme geçidiyle).
- `groupPolicy: "allowlist"` — başarısızlık durumunda kapalı varsayılan; yalnızca izin verilen göndericiler kabul edilir.

Farklı bir Zalo bot ürün yüzeyi kullanıyorsanız ve çalışan grup davranışını doğruladıysanız bunun Marketplace bot akışıyla eşleştiğini varsaymak yerine bunu ayrı olarak belgeleyin.

## Long-polling ve webhook karşılaştırması

- Varsayılan: long-polling (genel bir URL gerekmez).
- Webhook modu: `channels.zalo.webhookUrl` ve `channels.zalo.webhookSecret` ayarlayın.
  - Webhook secret 8-256 karakter olmalıdır.
  - Webhook URL'si HTTPS kullanmalıdır.
  - Zalo, doğrulama için olayları `X-Bot-Api-Secret-Token` başlığı ile gönderir.
  - Gateway HTTP, webhook isteklerini `channels.zalo.webhookPath` üzerinde işler (varsayılan olarak webhook URL yolu).
  - İstekler `Content-Type: application/json` (veya `+json` medya türleri) kullanmalıdır.
  - Yinelenen olaylar (`event_name + message_id`) kısa bir tekrar penceresi boyunca yok sayılır.
  - Ani trafik artışı yol/kaynak başına hız sınırına tabidir ve HTTP 429 döndürebilir.

**Not:** Zalo API belgelerine göre getUpdates (polling) ve webhook hesap başına birbirini dışlar.

## Desteklenen mesaj türleri

Hızlı bir destek anlık görüntüsü için bkz. [Yetenekler](#capabilities). Aşağıdaki notlar, davranışın ek bağlam gerektirdiği yerlere ayrıntı ekler.

- **Metin mesajları**: 2000 karaktere bölme ile tam destek.
- **Metin içindeki düz URL'ler**: Normal metin girdisi gibi davranır.
- **Bağlantı önizlemeleri / zengin bağlantı kartları**: Marketplace bot durumuna bakmak için bkz. [Yetenekler](#capabilities); güvenilir şekilde yanıt tetiklemediler.
- **Görüntü mesajları**: Marketplace bot durumuna bakmak için bkz. [Yetenekler](#capabilities); gelen görüntü işleme güvenilir değildi (son yanıt olmadan yazıyor göstergesi).
- **Sticker'lar**: Marketplace bot durumuna bakmak için bkz. [Yetenekler](#capabilities).
- **Sesli notlar / ses dosyaları / video / genel dosya ekleri**: Marketplace bot durumuna bakmak için bkz. [Yetenekler](#capabilities).
- **Desteklenmeyen türler**: Günlüğe kaydedilir (örneğin, korumalı kullanıcılardan gelen mesajlar).

## Yetenekler

Bu tablo, OpenClaw'daki mevcut **Zalo Bot Creator / Marketplace bot** davranışını özetler.

| Özellik                     | Durum                                   |
| --------------------------- | --------------------------------------- |
| Doğrudan mesajlar           | ✅ Desteklenir                          |
| Gruplar                     | ❌ Marketplace botları için mevcut değil |
| Medya (gelen görüntüler)    | ⚠️ Sınırlı / ortamınızda doğrulayın     |
| Medya (giden görüntüler)    | ⚠️ Marketplace botları için yeniden test edilmedi |
| Metin içindeki düz URL'ler  | ✅ Desteklenir                          |
| Bağlantı önizlemeleri       | ⚠️ Marketplace botları için güvenilmez  |
| Reaksiyonlar                | ❌ Desteklenmez                         |
| Sticker'lar                 | ⚠️ Marketplace botları için ajan yanıtı yok |
| Sesli notlar / ses / video  | ⚠️ Marketplace botları için ajan yanıtı yok |
| Dosya ekleri                | ⚠️ Marketplace botları için ajan yanıtı yok |
| Konular                     | ❌ Desteklenmez                         |
| Polls                       | ❌ Desteklenmez                         |
| Yerel komutlar              | ❌ Desteklenmez                         |
| Akış                        | ⚠️ Engellenir (2000 karakter sınırı)    |

## Teslimat hedefleri (CLI/cron)

- Hedef olarak bir sohbet kimliği kullanın.
- Örnek: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Sorun giderme

**Bot yanıt vermiyor:**

- Token'ın geçerli olduğunu kontrol edin: `openclaw channels status --probe`
- Göndericinin onaylandığını doğrulayın (eşleştirme veya allowFrom)
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`

**Webhook olay almıyor:**

- Webhook URL'sinin HTTPS kullandığından emin olun
- Secret token'ın 8-256 karakter olduğunu doğrulayın
- Gateway HTTP uç noktasının yapılandırılmış yolda erişilebilir olduğunu doğrulayın
- getUpdates polling işleminin çalışmadığını kontrol edin (birbirini dışlar)

## Yapılandırma başvurusu (Zalo)

Tam yapılandırma: [Yapılandırma](/gateway/configuration)

Düz üst düzey anahtarlar (`channels.zalo.botToken`, `channels.zalo.dmPolicy` ve benzerleri) eski tek hesaplı kısa yazımdır. Yeni yapılandırmalar için `channels.zalo.accounts.<id>.*` kullanmayı tercih edin. Her iki biçim de şemada bulunduğu için burada hâlâ belgelenir.

Sağlayıcı seçenekleri:

- `channels.zalo.enabled`: kanal başlatmayı etkinleştirir/devre dışı bırakır.
- `channels.zalo.botToken`: Zalo Bot Platform'dan bot token'ı.
- `channels.zalo.tokenFile`: token'ı normal bir dosya yolundan okur. Symlink'ler reddedilir.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.zalo.allowFrom`: DM izin listesi (kullanıcı kimlikleri). `open`, `"*"` gerektirir. Sihirbaz sayısal kimlikleri sorar.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist). Yapılandırmada bulunur; mevcut Marketplace bot davranışı için bkz. [Yetenekler](#capabilities) ve [Erişim denetimi (Gruplar)](#access-control-groups).
- `channels.zalo.groupAllowFrom`: grup gönderici izin listesi (kullanıcı kimlikleri). Ayarlanmadığında `allowFrom` değerine geri döner.
- `channels.zalo.mediaMaxMb`: gelen/giden medya sınırı (MB, varsayılan 5).
- `channels.zalo.webhookUrl`: webhook modunu etkinleştirir (HTTPS gereklidir).
- `channels.zalo.webhookSecret`: webhook secret'ı (8-256 karakter).
- `channels.zalo.webhookPath`: gateway HTTP sunucusundaki webhook yolu.
- `channels.zalo.proxy`: API istekleri için proxy URL'si.

Çoklu hesap seçenekleri:

- `channels.zalo.accounts.<id>.botToken`: hesap başına token.
- `channels.zalo.accounts.<id>.tokenFile`: hesap başına normal token dosyası. Symlink'ler reddedilir.
- `channels.zalo.accounts.<id>.name`: görünen ad.
- `channels.zalo.accounts.<id>.enabled`: hesabı etkinleştirir/devre dışı bırakır.
- `channels.zalo.accounts.<id>.dmPolicy`: hesap başına DM ilkesi.
- `channels.zalo.accounts.<id>.allowFrom`: hesap başına izin listesi.
- `channels.zalo.accounts.<id>.groupPolicy`: hesap başına grup ilkesi. Yapılandırmada bulunur; mevcut Marketplace bot davranışı için bkz. [Yetenekler](#capabilities) ve [Erişim denetimi (Gruplar)](#access-control-groups).
- `channels.zalo.accounts.<id>.groupAllowFrom`: hesap başına grup gönderici izin listesi.
- `channels.zalo.accounts.<id>.webhookUrl`: hesap başına webhook URL'si.
- `channels.zalo.accounts.<id>.webhookSecret`: hesap başına webhook secret'ı.
- `channels.zalo.accounts.<id>.webhookPath`: hesap başına webhook yolu.
- `channels.zalo.accounts.<id>.proxy`: hesap başına proxy URL'si.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/gateway/security) — erişim modeli ve sağlamlaştırma
