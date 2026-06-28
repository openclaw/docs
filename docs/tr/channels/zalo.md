---
read_when:
    - Zalo özellikleri veya Webhook'lar üzerinde çalışma
summary: Zalo bot desteğinin durumu, yetenekleri ve yapılandırması
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Durum: deneysel. DM'ler desteklenir. Aşağıdaki [Yetenekler](#capabilities) bölümü mevcut Marketplace botu davranışını yansıtır.

## Paketle gelen Plugin

Zalo, mevcut OpenClaw sürümlerinde paketle gelen bir Plugin olarak sunulur; bu nedenle normal paketlenmiş
derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derleme kullanıyorsanız veya Zalo'yu hariç tutan özel bir kurulumunuz varsa,
npm paketini doğrudan kurun:

- CLI ile kurulum: `openclaw plugins install @openclaw/zalo`
- Sabitlenmiş sürüm: `openclaw plugins install @openclaw/zalo@2026.5.2`
- Ya da kaynak checkout üzerinden: `openclaw plugins install ./path/to/local/zalo-plugin`
- Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Zalo Plugin'in kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
2. Token'ı ayarlayın:
   - Env: `ZALO_BOT_TOKEN=...`
   - Ya da config: `channels.zalo.accounts.default.botToken: "..."`.
3. Gateway'i yeniden başlatın (veya kurulumu tamamlayın).
4. DM erişimi varsayılan olarak eşleştirme kullanır; ilk temasta eşleştirme kodunu onaylayın.

Minimum config:

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
Zalo'ya geri deterministik yönlendirme istediğiniz destek veya bildirim senaryoları için uygundur.

Bu sayfa, **Zalo Bot Creator / Marketplace botları** için mevcut OpenClaw davranışını yansıtır.
**Zalo Official Account (OA) botları** farklı bir Zalo ürün yüzeyidir ve farklı davranabilir.

- Gateway tarafından sahip olunan bir Zalo Bot API kanalı.
- Deterministik yönlendirme: yanıtlar Zalo'ya geri gider; model kanal seçmez.
- DM'ler ajanın ana oturumunu paylaşır.
- Aşağıdaki [Yetenekler](#capabilities) bölümü mevcut Marketplace botu desteğini gösterir.

## Kurulum (hızlı yol)

### 1) Bot token'ı oluşturun (Zalo Bot Platform)

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

Daha sonra grupların kullanılabildiği bir Zalo bot yüzeyine geçerseniz `groupPolicy` ve `groupAllowFrom` gibi gruba özel config değerlerini açıkça ekleyebilirsiniz. Mevcut Marketplace botu davranışı için [Yetenekler](#capabilities) bölümüne bakın.

Env seçeneği: `ZALO_BOT_TOKEN=...` (yalnızca varsayılan hesap için çalışır).

Çoklu hesap desteği: hesap başına token'lar ve isteğe bağlı `name` ile `channels.zalo.accounts` kullanın.

3. Gateway'i yeniden başlatın. Zalo, bir token çözümlendiğinde başlar (env veya config).
4. DM erişimi varsayılan olarak eşleştirme kullanır. Botla ilk kez iletişime geçildiğinde kodu onaylayın.

## Nasıl çalışır (davranış)

- Gelen mesajlar, medya yer tutucularıyla birlikte paylaşılan kanal zarfına normalleştirilir.
- Yanıtlar her zaman aynı Zalo sohbetine geri yönlendirilir.
- Varsayılan olarak long-polling kullanılır; `channels.zalo.webhookUrl` ile webhook modu kullanılabilir.

## Sınırlar

- Giden metin 2000 karakterlik parçalara bölünür (Zalo API sınırı).
- Medya indirme/yüklemeleri `channels.zalo.mediaMaxMb` ile sınırlandırılır (varsayılan 5).
- 2000 karakter sınırı streaming'i daha az kullanışlı hale getirdiğinden, streaming varsayılan olarak engellenir.

## Erişim kontrolü (DM'ler)

### DM erişimi

- Varsayılan: `channels.zalo.dmPolicy = "pairing"`. Bilinmeyen göndericiler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodlar 1 saat sonra sona erer).
- Şununla onaylayın:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Eşleştirme varsayılan token değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)
- `channels.zalo.allowFrom` sayısal kullanıcı ID'lerini kabul eder (kullanıcı adı araması yoktur).

## Erişim kontrolü (Gruplar)

**Zalo Bot Creator / Marketplace botları** için grup desteği pratikte kullanılamıyordu çünkü bot hiçbir şekilde bir gruba eklenemiyordu.

Bu, aşağıdaki grupla ilgili config anahtarlarının şemada bulunduğu, ancak Marketplace botları için kullanılamadığı anlamına gelir:

- `channels.zalo.groupPolicy` gelen grup işlemesini denetler: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom`, hangi gönderici ID'lerinin gruplarda botu tetikleyebileceğini sınırlar.
- `groupAllowFrom` ayarlanmamışsa Zalo, gönderici denetimleri için `allowFrom` değerine geri döner.
- Çalışma zamanı notu: `channels.zalo` tamamen eksikse çalışma zamanı güvenlik için yine de `groupPolicy="allowlist"` değerine geri döner.

Grup politikası değerleri (bot yüzeyinizde grup erişimi mevcut olduğunda) şunlardır:

- `groupPolicy: "disabled"` — tüm grup mesajlarını engeller.
- `groupPolicy: "open"` — herhangi bir grup üyesine izin verir (bahsetme kapılı).
- `groupPolicy: "allowlist"` — hata durumunda kapalı varsayılan; yalnızca izin verilen göndericiler kabul edilir.

Farklı bir Zalo bot ürün yüzeyi kullanıyorsanız ve çalışan grup davranışını doğruladıysanız, bunun Marketplace botu akışıyla eşleştiğini varsaymak yerine bunu ayrı şekilde belgeleyin.

## Long-polling ve webhook

- Varsayılan: long-polling (genel URL gerekmez).
- Webhook modu: `channels.zalo.webhookUrl` ve `channels.zalo.webhookSecret` ayarlayın.
  - Webhook sırrı 8-256 karakter olmalıdır.
  - Webhook URL'si HTTPS kullanmalıdır.
  - Zalo, doğrulama için olayları `X-Bot-Api-Secret-Token` üst bilgisiyle gönderir.
  - Gateway HTTP, webhook isteklerini `channels.zalo.webhookPath` üzerinde işler (varsayılan olarak webhook URL yolu).
  - İstekler `Content-Type: application/json` (veya `+json` medya türleri) kullanmalıdır.
  - Yinelenen olaylar (`event_name + message_id`) kısa bir yeniden oynatma penceresi boyunca yok sayılır.
  - Ani trafik artışları yol/kaynak başına hız sınırına tabi tutulur ve HTTP 429 döndürebilir.

**Not:** getUpdates (polling) ve webhook, Zalo API belgelerine göre karşılıklı olarak dışlayıcıdır.

## Desteklenen mesaj türleri

Hızlı bir destek özeti için [Yetenekler](#capabilities) bölümüne bakın. Aşağıdaki notlar, davranışın ek bağlam gerektirdiği yerlerde ayrıntı ekler.

- **Metin mesajları**: 2000 karakterlik parçalama ile tam destek.
- **Metin içindeki düz URL'ler**: Normal metin girişi gibi davranır.
- **Bağlantı önizlemeleri / zengin bağlantı kartları**: [Yetenekler](#capabilities) bölümündeki Marketplace botu durumuna bakın; güvenilir şekilde yanıt tetiklemediler.
- **Görüntü mesajları**: [Yetenekler](#capabilities) bölümündeki Marketplace botu durumuna bakın; gelen görüntü işleme güvenilir değildi (son yanıt olmadan yazıyor göstergesi).
- **Çıkartmalar**: [Yetenekler](#capabilities) bölümündeki Marketplace botu durumuna bakın.
- **Sesli notlar / ses dosyaları / video / genel dosya ekleri**: [Yetenekler](#capabilities) bölümündeki Marketplace botu durumuna bakın.
- **Desteklenmeyen türler**: Günlüğe yazılır (örneğin, korumalı kullanıcılardan gelen mesajlar).

## Yetenekler

Bu tablo, OpenClaw'daki mevcut **Zalo Bot Creator / Marketplace botu** davranışını özetler.

| Özellik                    | Durum                                          |
| -------------------------- | --------------------------------------------- |
| Doğrudan mesajlar          | ✅ Desteklenir                                |
| Gruplar                    | ❌ Marketplace botları için kullanılamaz      |
| Medya (gelen görüntüler)   | ⚠️ Sınırlı / ortamınızda doğrulayın           |
| Medya (giden görüntüler)   | ⚠️ Marketplace botları için yeniden test edilmedi |
| Metin içindeki düz URL'ler | ✅ Desteklenir                                |
| Bağlantı önizlemeleri      | ⚠️ Marketplace botları için güvenilir değil   |
| Tepkiler                   | ❌ Desteklenmez                               |
| Çıkartmalar                | ⚠️ Marketplace botları için ajan yanıtı yok   |
| Sesli notlar / ses / video | ⚠️ Marketplace botları için ajan yanıtı yok   |
| Dosya ekleri               | ⚠️ Marketplace botları için ajan yanıtı yok   |
| Thread'ler                 | ❌ Desteklenmez                               |
| Anketler                   | ❌ Desteklenmez                               |
| Yerel komutlar             | ❌ Desteklenmez                               |
| Streaming                  | ⚠️ Engellendi (2000 karakter sınırı)          |

## Teslim hedefleri (CLI/cron)

- Hedef olarak bir sohbet ID'si kullanın.
- Örnek: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Sorun giderme

**Bot yanıt vermiyor:**

- Token'ın geçerli olduğunu kontrol edin: `openclaw channels status --probe`
- Göndericinin onaylandığını doğrulayın (pairing veya allowFrom)
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`

**Webhook olay almıyor:**

- Webhook URL'sinin HTTPS kullandığından emin olun
- Gizli token'ın 8-256 karakter olduğunu doğrulayın
- Gateway HTTP uç noktasının yapılandırılan yolda erişilebilir olduğunu onaylayın
- getUpdates polling'in çalışmadığını kontrol edin (bunlar karşılıklı olarak dışlayıcıdır)

## Yapılandırma referansı (Zalo)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Düz üst düzey anahtarlar (`channels.zalo.botToken`, `channels.zalo.dmPolicy` ve benzerleri), eski tek hesaplı kısaltmadır. Yeni config'ler için `channels.zalo.accounts.<id>.*` tercih edin. Her iki biçim de şemada bulundukları için burada hâlâ belgelenmiştir.

Sağlayıcı seçenekleri:

- `channels.zalo.enabled`: kanal başlangıcını etkinleştir/devre dışı bırak.
- `channels.zalo.botToken`: Zalo Bot Platform'dan bot token'ı.
- `channels.zalo.tokenFile`: token'ı normal bir dosya yolundan oku. Symlink'ler reddedilir.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.zalo.allowFrom`: DM allowlist'i (kullanıcı ID'leri). `open`, `"*"` gerektirir. Sihirbaz sayısal ID'leri isteyecektir.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist). Config içinde bulunur; mevcut Marketplace botu davranışı için [Yetenekler](#capabilities) ve [Erişim kontrolü (Gruplar)](#access-control-groups) bölümlerine bakın.
- `channels.zalo.groupAllowFrom`: grup gönderici allowlist'i (kullanıcı ID'leri). Ayarlanmamışsa `allowFrom` değerine geri döner.
- `channels.zalo.mediaMaxMb`: gelen/giden medya sınırı (MB, varsayılan 5).
- `channels.zalo.webhookUrl`: webhook modunu etkinleştir (HTTPS gerekir).
- `channels.zalo.webhookSecret`: webhook sırrı (8-256 karakter).
- `channels.zalo.webhookPath`: Gateway HTTP sunucusundaki webhook yolu.
- `channels.zalo.proxy`: API istekleri için proxy URL'si.

Çoklu hesap seçenekleri:

- `channels.zalo.accounts.<id>.botToken`: hesap başına token.
- `channels.zalo.accounts.<id>.tokenFile`: hesap başına normal token dosyası. Symlink'ler reddedilir.
- `channels.zalo.accounts.<id>.name`: görünen ad.
- `channels.zalo.accounts.<id>.enabled`: hesabı etkinleştir/devre dışı bırak.
- `channels.zalo.accounts.<id>.dmPolicy`: hesap başına DM politikası.
- `channels.zalo.accounts.<id>.allowFrom`: hesap başına allowlist.
- `channels.zalo.accounts.<id>.groupPolicy`: hesap başına grup politikası. Config içinde bulunur; mevcut Marketplace botu davranışı için [Yetenekler](#capabilities) ve [Erişim kontrolü (Gruplar)](#access-control-groups) bölümlerine bakın.
- `channels.zalo.accounts.<id>.groupAllowFrom`: hesap başına grup gönderici allowlist'i.
- `channels.zalo.accounts.<id>.webhookUrl`: hesap başına webhook URL'si.
- `channels.zalo.accounts.<id>.webhookSecret`: hesap başına webhook sırrı.
- `channels.zalo.accounts.<id>.webhookPath`: hesap başına webhook yolu.
- `channels.zalo.accounts.<id>.proxy`: hesap başına proxy URL'si.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güçlendirme
