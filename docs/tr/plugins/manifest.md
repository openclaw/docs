---
read_when:
    - Bir OpenClaw Plugin’i oluşturuyorsunuz
    - Bir Plugin yapılandırma şeması yayımlamanız veya Plugin doğrulama hatalarını ayıklamanız gerekiyor
summary: Plugin bildirimi + JSON şeması gereksinimleri (sıkı yapılandırma doğrulaması)
title: Plugin bildirimi
x-i18n:
    generated_at: "2026-06-28T00:55:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

Bu sayfa yalnızca **yerel OpenClaw Plugin manifestosu** içindir.

Uyumlu paket yerleşimleri için bkz. [Plugin paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifesto dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestosuz varsayılan Claude bileşeni
  yerleşimi
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket yerleşimlerini de otomatik algılar, ancak bunlar burada
açıklanan `openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketlerde OpenClaw şu anda paket meta verilerini ve bildirilen
Skills köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını,
Claude paketi LSP varsayılanlarını ve yerleşim OpenClaw çalışma zamanı beklentileriyle
eşleştiğinde desteklenen hook paketlerini okur.

Her yerel OpenClaw Plugin, **Plugin kökünde** bir `openclaw.plugin.json` dosyasıyla
gelmelidir. OpenClaw bu manifestoyu, **Plugin kodunu çalıştırmadan** yapılandırmayı
doğrulamak için kullanır. Eksik veya geçersiz manifestolar Plugin hatası olarak
değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam Plugin sistemi kılavuzuna bakın: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve güncel dış uyumluluk rehberi için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'ın **Plugin kodunuzu yüklemeden önce** okuduğu
meta verilerdir. Aşağıdaki her şey, Plugin çalışma zamanını başlatmadan incelenebilecek
kadar düşük maliyetli olmalıdır.

**Şunun için kullanın:**

- Plugin kimliği, yapılandırma doğrulaması ve yapılandırma arayüzü ipuçları
- kimlik doğrulama, ilk kurulum ve kurulum meta verileri (takma ad, otomatik etkinleştirme, sağlayıcı ortam değişkenleri, kimlik doğrulama seçenekleri)
- denetim düzlemi yüzeyleri için etkinleştirme ipuçları
- kısaltılmış model ailesi sahipliği
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` ana makinesinin inceleyebileceği QA çalıştırıcı meta verileri
- katalog ve doğrulama yüzeyleriyle birleştirilen kanala özgü yapılandırma meta verileri

**Şunun için kullanmayın:** çalışma zamanı davranışı kaydetmek, kod giriş noktaları
bildirmek veya npm kurulum meta verileri. Bunlar Plugin kodunuza ve `package.json`
dosyasına aittir.

## Minimal örnek

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Zengin örnek

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Üst düzey alan başvurusu

| Alan                                 | Gerekli | Tür                              | Ne anlama gelir                                                                                                                                                                                                                                 |
| ------------------------------------ | ------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Evet    | `string`                         | Kanonik Plugin kimliği. Bu, `plugins.entries.<id>` içinde kullanılan kimliktir.                                                                                                                                                                  |
| `configSchema`                       | Evet    | `object`                         | Bu Plugin'in yapılandırması için satır içi JSON Schema.                                                                                                                                                                                         |
| `requiresPlugins`                    | Hayır   | `string[]`                       | Bu Plugin'in etkili olması için ayrıca yüklenmesi gereken Plugin kimlikleri. Keşif, Plugin'i yüklenebilir tutar ancak gerekli herhangi bir Plugin eksik olduğunda uyarır.                                                                      |
| `enabledByDefault`                   | Hayır   | `true`                           | Paketle gelen bir Plugin'i varsayılan olarak etkin şeklinde işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` olmayan herhangi bir değere ayarlayın.                                                     |
| `enabledByDefaultOnPlatforms`        | Hayır   | `string[]`                       | Paketle gelen bir Plugin'i yalnızca listelenen Node.js platformlarında varsayılan olarak etkin şeklinde işaretler, örneğin `["darwin"]`. Açık yapılandırma yine de önceliklidir.                                                               |
| `legacyPluginIds`                    | Hayır   | `string[]`                       | Bu kanonik Plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model referansları bunlardan söz ettiğinde bu Plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                               |
| `kind`                               | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan özel bir Plugin türü bildirir.                                                                                                                                                                          |
| `channels`                           | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                                                 |
| `providers`                          | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu sağlayıcı kimlikleri.                                                                                                                                                                                                |
| `providerCatalogEntry`               | Hayır   | `string`                         | Tam Plugin çalışma zamanını etkinleştirmeden yüklenebilen, bildirime kapsamlı sağlayıcı katalog meta verileri için Plugin köküne göreli hafif sağlayıcı katalog modülü yolu.                                                                   |
| `modelSupport`                       | Hayır   | `object`                         | Çalışma zamanından önce Plugin'i otomatik yüklemek için kullanılan, bildirimin sahibi olduğu kısa model ailesi meta verileri.                                                                                                                    |
| `modelCatalog`                       | Hayır   | `object`                         | Bu Plugin'in sahibi olduğu sağlayıcılar için bildirimsel model katalog meta verileri. Bu, Plugin çalışma zamanını yüklemeden gelecekteki salt okunur listeleme, ilk kurulum, model seçiciler, takma adlar ve bastırma için kontrol düzlemi sözleşmesidir. |
| `modelPricing`                       | Hayır   | `object`                         | Sağlayıcının sahibi olduğu harici fiyatlandırma arama politikası. Bunu, yerel/kendi barındırılan sağlayıcıları uzak fiyatlandırma kataloglarının dışında tutmak veya sağlayıcı referanslarını çekirdekte sağlayıcı kimliklerini sabit kodlamadan OpenRouter/LiteLLM katalog kimliklerine eşlemek için kullanın. |
| `modelIdNormalization`               | Hayır   | `object`                         | Sağlayıcı çalışma zamanı yüklenmeden önce çalışması gereken, sağlayıcının sahibi olduğu model kimliği takma ad/önek temizliği.                                                                                                                  |
| `providerEndpoints`                  | Hayır   | `object[]`                       | Sağlayıcı çalışma zamanı yüklenmeden önce çekirdeğin sınıflandırması gereken sağlayıcı rotaları için bildirimin sahibi olduğu uç nokta host/baseUrl meta verileri.                                                                               |
| `providerRequest`                    | Hayır   | `object`                         | Sağlayıcı çalışma zamanı yüklenmeden önce genel istek politikası tarafından kullanılan düşük maliyetli sağlayıcı ailesi ve istek uyumluluğu meta verileri.                                                                                      |
| `secretProviderIntegrations`         | Hayır   | `Record<string, object>`         | Kurulum veya yükleme yüzeylerinin çekirdekte sağlayıcıya özgü entegrasyonları sabit kodlamadan sunabileceği bildirimsel SecretRef exec sağlayıcı ön ayarları.                                                                                  |
| `cliBackends`                        | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu CLI çıkarım arka uç kimlikleri. Açık yapılandırma referanslarından başlangıçta otomatik etkinleştirme için kullanılır.                                                                                              |
| `syntheticAuthRefs`                  | Hayır   | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında Plugin'e ait sentetik kimlik doğrulama kancası yoklanması gereken sağlayıcı veya CLI arka uç referansları.                                                                          |
| `nonSecretAuthMarkers`               | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketle gelen Plugin'e ait yer tutucu API anahtarı değerleri.                                                                                                       |
| `commandAliases`                     | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce Plugin farkındalığı olan yapılandırma ve CLI tanılamaları üretmesi gereken, bu Plugin'in sahibi olduğu komut adları.                                                                                            |
| `providerAuthEnvVars`                | Hayır   | `Record<string, string[]>`       | Sağlayıcı kimlik doğrulama/durum araması için kullanımdan kaldırılmış uyumluluk ortam meta verileri. Yeni Plugin'ler için `setup.providers[].envVars` tercih edin; OpenClaw bunu kullanımdan kaldırma süresi boyunca okumaya devam eder.       |
| `providerAuthAliases`                | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı.                         |
| `channelEnvVars`                     | Hayır   | `Record<string, string[]>`       | OpenClaw'ın Plugin kodunu yüklemeden inceleyebileceği düşük maliyetli kanal ortam meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam güdümlü kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`                | Hayır   | `object[]`                       | İlk kurulum seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlantısı için düşük maliyetli kimlik doğrulama seçeneği meta verileri.                                                                                       |
| `activation`                         | Hayır   | `object`                         | Başlangıç, sağlayıcı, komut, kanal, rota ve yetenekle tetiklenen yükleme için düşük maliyetli etkinleştirme planlayıcısı meta verileri. Yalnızca meta veri; gerçek davranış yine de Plugin çalışma zamanına aittir.                            |
| `setup`                              | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin Plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/ilk kurulum tanımlayıcıları.                                                                                                         |
| `qaRunners`                          | Hayır   | `object[]`                       | Paylaşılan `openclaw qa` hostu tarafından Plugin çalışma zamanı yüklenmeden önce kullanılan düşük maliyetli QA çalıştırıcı tanımlayıcıları.                                                                                                     |
| `contracts`                          | Hayır   | `object`                         | Harici kimlik doğrulama kancaları, embeddings, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü üretimi, müzik üretimi, video üretimi, web getirme, web araması ve araç sahipliği için statik yetenek sahipliği anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli medya anlama varsayılanları.                                                                                                                |
| `imageGenerationProviderMetadata`    | Hayır   | `Record<string, object>`         | `contracts.imageGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için, sağlayıcıya ait kimlik doğrulama takma adları ve base-url korumaları dahil düşük maliyetli görüntü üretimi kimlik doğrulama meta verileri.                   |
| `videoGenerationProviderMetadata`    | Hayır   | `Record<string, object>`         | `contracts.videoGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için, sağlayıcıya ait kimlik doğrulama takma adları ve base-url korumaları dahil düşük maliyetli video üretimi kimlik doğrulama meta verileri.                     |
| `musicGenerationProviderMetadata`    | Hayır   | `Record<string, object>`         | `contracts.musicGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için, sağlayıcıya ait kimlik doğrulama takma adları ve base-url korumaları dahil düşük maliyetli müzik üretimi kimlik doğrulama meta verileri.                     |
| `toolMetadata`                       | Hayır    | `Record<string, object>`         | `contracts.tools` içinde bildirilen Plugin'e ait araçlar için düşük maliyetli kullanılabilirlik meta verileri. Bir aracın yapılandırma, ortam veya kimlik doğrulama kanıtı olmadığı sürece çalışma zamanını yüklememesi gerektiğinde bunu kullanın.                                                                       |
| `channelConfigs`                     | Hayır    | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeylerine birleştirilen, manifeste ait kanal yapılandırma meta verileri.                                                                                                                                      |
| `skills`                             | Hayır    | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skill dizinleri.                                                                                                                                                                                         |
| `name`                               | Hayır    | `string`                         | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                                                                     |
| `description`                        | Hayır    | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                                         |
| `icon`                               | Hayır    | `string`                         | Pazaryeri/katalog kartları için HTTPS görsel URL'si. ClawHub geçerli herhangi bir `https://` URL'sini kabul eder ve bu atlandığında veya geçersiz olduğunda varsayılan Plugin simgesine geri döner.                                                                              |
| `version`                            | Hayır    | `string`                         | Bilgilendirici Plugin sürümü.                                                                                                                                                                                                                   |
| `uiHints`                            | Hayır    | `Record<string, object>`         | Yapılandırma alanları için kullanıcı arayüzü etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                                               |

## Üretim sağlayıcısı meta veri başvurusu

Üretim sağlayıcısı meta veri alanları, eşleşen `contracts.*GenerationProviders` listesinde bildirilen sağlayıcılar için statik kimlik doğrulama sinyallerini açıklar. OpenClaw bu alanları sağlayıcı çalışma zamanı yüklenmeden önce okur, böylece çekirdek araçlar her sağlayıcı Plugin’ini içe aktarmadan bir üretim sağlayıcısının kullanılabilir olup olmadığına karar verebilir.

Bu alanları yalnızca ucuz, bildirime dayalı olgular için kullanın. Taşıma, istek dönüşümleri, token yenileme, kimlik bilgisi doğrulama ve gerçek üretim davranışı Plugin çalışma zamanında kalır.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Her meta veri girdisi şunları destekler:

| Alan                   | Gerekli | Tür        | Ne anlama gelir                                                                                                                                                      |
| ---------------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Hayır   | `string[]` | Üretim sağlayıcısı için statik kimlik doğrulama takma adları olarak sayılması gereken ek sağlayıcı kimlikleri.                                                       |
| `authProviders`        | Hayır   | `string[]` | Yapılandırılmış kimlik doğrulama profilleri bu üretim sağlayıcısı için kimlik doğrulama olarak sayılması gereken sağlayıcı kimlikleri.                                |
| `configSignals`        | Hayır   | `object[]` | Kimlik doğrulama profilleri veya ortam değişkenleri olmadan yapılandırılabilen yerel ya da kendi barındırılan sağlayıcılar için ucuz, yalnızca yapılandırma sinyalleri. |
| `authSignals`          | Hayır   | `object[]` | Açık kimlik doğrulama sinyalleri. Varsa, sağlayıcı kimliğinden, `aliases` ve `authProviders` değerlerinden gelen varsayılan sinyal kümesinin yerini alır.             |
| `referenceAudioInputs` | Hayır   | `boolean`  | Yalnızca video üretimi. Sağlayıcı referans ses varlıklarını kabul ediyorsa `true` olarak ayarlayın; aksi halde `video_generate` ses referansı parametrelerini gizler. |

Her `configSignals` girdisi şunları destekler:

| Alan             | Gerekli | Tür        | Ne anlama gelir                                                                                                                                                                                  |
| ---------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Evet    | `string`   | İncelenecek Plugin’e ait yapılandırma nesnesine nokta yolu, örneğin `plugins.entries.example.config`.                                                                                           |
| `overlayPath`    | Hayır   | `string`   | Sinyal değerlendirilmeden önce nesnesi kök nesnenin üzerine bindirilecek kök yapılandırma içindeki nokta yolu. Bunu `image`, `video` veya `music` gibi yeteneğe özgü yapılandırma için kullanın. |
| `overlayMapPath` | Hayır   | `string`   | Nesne değerlerinin her biri kök nesnenin üzerine bindirilecek kök yapılandırma içindeki nokta yolu. Bunu `accounts` gibi adlandırılmış hesap haritaları için kullanın; yapılandırılmış herhangi bir hesap yeterli sayılır. |
| `required`       | Hayır   | `string[]` | Etkili yapılandırma içinde yapılandırılmış değerlere sahip olması gereken nokta yolları. Dizeler boş olmamalıdır; nesneler ve diziler boş olmamalıdır.                                           |
| `requiredAny`    | Hayır   | `string[]` | Etkili yapılandırma içinde en az birinin yapılandırılmış değere sahip olması gereken nokta yolları.                                                                                              |
| `mode`           | Hayır   | `object`   | Etkili yapılandırma içindeki isteğe bağlı dize mod koruması. Bunu yalnızca yapılandırmayla kullanılabilirlik tek bir moda uygulandığında kullanın.                                               |

Her `mode` koruması şunları destekler:

| Alan         | Gerekli | Tür        | Ne anlama gelir                                                                                  |
| ------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `path`       | Hayır   | `string`   | Etkili yapılandırma içindeki nokta yolu. Varsayılan olarak `mode` kullanılır.                     |
| `default`    | Hayır   | `string`   | Yapılandırma yolu atladığında kullanılacak mod değeri.                                            |
| `allowed`    | Hayır   | `string[]` | Varsa, sinyal yalnızca etkili mod bu değerlerden biri olduğunda geçer.                            |
| `disallowed` | Hayır   | `string[]` | Varsa, etkili mod bu değerlerden biri olduğunda sinyal başarısız olur.                            |

Her `authSignals` girdisi şunları destekler:

| Alan              | Gerekli | Tür      | Ne anlama gelir                                                                                                                                               |
| ----------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet    | `string` | Yapılandırılmış kimlik doğrulama profillerinde denetlenecek sağlayıcı kimliği.                                                                                 |
| `providerBaseUrl` | Hayır   | `object` | Sinyalin yalnızca başvurulan yapılandırılmış sağlayıcı izin verilen bir taban URL kullandığında sayılmasını sağlayan isteğe bağlı koruma. Bunu bir kimlik doğrulama takma adı yalnızca belirli API’ler için geçerliyse kullanın. |

Her `providerBaseUrl` koruması şunları destekler:

| Alan              | Gerekli | Tür        | Ne anlama gelir                                                                                                                                                          |
| ----------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Evet    | `string`   | `baseUrl` değeri denetlenecek sağlayıcı yapılandırma kimliği.                                                                                                             |
| `defaultBaseUrl`  | Hayır   | `string`   | Sağlayıcı yapılandırması `baseUrl` değerini atladığında varsayılacak taban URL.                                                                                          |
| `allowedBaseUrls` | Evet    | `string[]` | Bu kimlik doğrulama sinyali için izin verilen taban URL’ler. Yapılandırılmış veya varsayılan taban URL bu normalleştirilmiş değerlerden biriyle eşleşmediğinde sinyal yok sayılır. |

## Araç meta veri başvurusu

`toolMetadata`, araç adına göre anahtarlanan üretim sağlayıcısı meta verileriyle aynı `configSignals` ve `authSignals` şekillerini kullanır. `contracts.tools` sahipliği bildirir. `toolMetadata`, OpenClaw’ın yalnızca araç fabrikasının `null` döndürmesini sağlamak için bir Plugin çalışma zamanını içe aktarmaktan kaçınabilmesi amacıyla ucuz kullanılabilirlik kanıtı bildirir.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Bir aracın `toolMetadata` değeri yoksa, OpenClaw mevcut davranışı korur ve araç sözleşmesi ilkeyle eşleştiğinde sahip Plugin’i yükler. Fabrikası kimlik doğrulama/yapılandırmaya bağlı olan sıcak yol araçları için Plugin yazarları, çekirdeğin sormak amacıyla çalışma zamanını içe aktarmasını sağlamak yerine `toolMetadata` bildirmelidir.

## providerAuthChoices başvurusu

Her `providerAuthChoices` girdisi bir ilk kurulum veya kimlik doğrulama seçeneğini açıklar. OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur. Sağlayıcı kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden bu manifest seçeneklerini, tanımlayıcıdan türetilmiş kurulum seçeneklerini ve kurulum kataloğu meta verilerini kullanır.

| Alan                  | Gerekli | Tür                                                                   | Anlamı                                                                                                                   |
| --------------------- | -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `provider`            | Evet     | `string`                                                              | Bu seçimin ait olduğu sağlayıcı kimliği.                                                                                 |
| `method`              | Evet     | `string`                                                              | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                                        |
| `choiceId`            | Evet     | `string`                                                              | Onboarding ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçimi kimliği.                                |
| `choiceLabel`         | Hayır    | `string`                                                              | Kullanıcıya gösterilen etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                                        |
| `choiceHint`          | Hayır    | `string`                                                              | Seçici için kısa yardımcı metin.                                                                                         |
| `assistantPriority`   | Hayır    | `number`                                                              | Daha düşük değerler, asistan tarafından yönlendirilen etkileşimli seçicilerde daha önce sıralanır.                       |
| `assistantVisibility` | Hayır    | `"visible"` \| `"manual-only"`                                        | Seçimi asistan seçicilerinden gizlerken manuel CLI seçimine izin vermeye devam eder.                                      |
| `deprecatedChoiceIds` | Hayır    | `string[]`                                                            | Kullanıcıları bu yedek seçime yönlendirmesi gereken eski seçim kimlikleri.                                                |
| `groupId`             | Hayır    | `string`                                                              | İlgili seçimleri gruplamak için isteğe bağlı grup kimliği.                                                               |
| `groupLabel`          | Hayır    | `string`                                                              | Bu grup için kullanıcıya gösterilen etiket.                                                                              |
| `groupHint`           | Hayır    | `string`                                                              | Grup için kısa yardımcı metin.                                                                                           |
| `optionKey`           | Hayır    | `string`                                                              | Basit tek bayraklı kimlik doğrulama akışları için dahili seçenek anahtarı.                                                |
| `cliFlag`             | Hayır    | `string`                                                              | `--openrouter-api-key` gibi CLI bayrağı adı.                                                                             |
| `cliOption`           | Hayır    | `string`                                                              | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                                                |
| `cliDescription`      | Hayır    | `string`                                                              | CLI yardımında kullanılan açıklama.                                                                                      |
| `onboardingScopes`    | Hayır    | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Bu seçimin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan olarak `["text-inference"]` kullanır. |

## commandAliases başvurusu

Bir Plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya
kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına
sahip olduğunda `commandAliases` kullanın. OpenClaw bu meta veriyi Plugin çalışma
zamanı kodunu içe aktarmadan tanılama için kullanır.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Alan         | Gerekli | Tür               | Anlamı                                                                             |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------------------- |
| `name`       | Evet     | `string`          | Bu Plugin'e ait olan komut adı.                                                    |
| `kind`       | Hayır    | `"runtime-slash"` | Takma adı, kök CLI komutu yerine sohbet eğik çizgi komutu olarak işaretler.        |
| `cliCommand` | Hayır    | `string`          | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.                         |

## activation başvurusu

Plugin, hangi kontrol düzlemi olaylarının onu bir etkinleştirme/yükleme planına
dahil etmesi gerektiğini düşük maliyetle bildirebildiğinde `activation` kullanın.

Bu blok, yaşam döngüsü API'si değil planlayıcı meta verisidir. Çalışma zamanı
davranışı kaydetmez, `register(...)` yerine geçmez ve Plugin kodunun zaten
çalıştırılmış olduğunu vaat etmez. Etkinleştirme planlayıcısı, mevcut manifest
sahipliği meta verilerine geri dönmeden önce aday Plugin'leri daraltmak için bu
alanları kullanır; örneğin `providers`, `channels`, `commandAliases`,
`setup.providers`, `contracts.tools` ve kancalar.

Sahipliği zaten açıklayan en dar meta veriyi tercih edin. Bu alanlar ilişkiyi
ifade ettiğinde `providers`, `channels`, `commandAliases`, kurulum tanımlayıcıları
veya `contracts` kullanın. Bu sahiplik alanlarıyla temsil edilemeyen ek
planlayıcı ipuçları için `activation` kullanın.
`claude-cli`, `my-cli` veya `google-gemini-cli` gibi CLI çalışma zamanı takma
adları için üst düzey `cliBackends` kullanın; `activation.onAgentHarnesses`
yalnızca zaten bir sahiplik alanı olmayan gömülü aracı yürütme takımı kimlikleri
içindir.

Bu blok yalnızca meta veridir. Çalışma zamanı davranışı kaydetmez ve
`register(...)`, `setupEntry` veya diğer çalışma zamanı/Plugin giriş noktalarının
yerine geçmez. Mevcut tüketiciler bunu daha geniş Plugin yüklemesinden önce
daraltma ipucu olarak kullanır; bu nedenle başlangıç dışı etkinleştirme meta
verilerinin eksik olması genellikle yalnızca performans maliyeti doğurur;
manifest sahipliği geri dönüşleri hâlâ varken doğruluğu değiştirmemelidir.

Her Plugin `activation.onStartup` değerini bilinçli olarak ayarlamalıdır. Bunu
yalnızca Plugin'in Gateway başlangıcı sırasında çalışması gerektiğinde `true`
olarak ayarlayın. Plugin başlangıçta etkisizse ve yalnızca daha dar tetikleyicilerden
yüklenmeliyse `false` olarak ayarlayın. `onStartup` değerinin atlanması artık
Plugin'i başlangıçta örtük olarak yüklemez; başlangıç, kanal, yapılandırma,
aracı yürütme takımı, bellek veya diğer daha dar etkinleştirme tetikleyicileri
için açık etkinleştirme meta verisi kullanın.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Alan               | Gerekli | Tür                                                  | Anlamı                                                                                                                                                                                     |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Hayır    | `boolean`                                            | Açık Gateway başlangıç etkinleştirmesi. Her Plugin bunu ayarlamalıdır. `true`, başlangıç sırasında Plugin'i içe aktarır; `false`, eşleşen başka bir tetikleyici yükleme gerektirmedikçe başlangıçta tembel tutar. |
| `onProviders`      | Hayır    | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                                                                                                    |
| `onAgentHarnesses` | Hayır    | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken gömülü aracı yürütme takımı çalışma zamanı kimlikleri. CLI arka uç takma adları için üst düzey `cliBackends` kullanın. |
| `onCommands`       | Hayır    | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                                                                                                        |
| `onChannels`       | Hayır    | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                                                                                                        |
| `onRoutes`         | Hayır    | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                                                                                                            |
| `onConfigPaths`    | Hayır    | `string[]`                                           | Yol mevcut olduğunda ve açıkça devre dışı bırakılmadığında bu Plugin'i başlangıç/yükleme planlarına dahil etmesi gereken köke göreli yapılandırma yolları.                                |
| `onCapabilities`   | Hayır    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlaması tarafından kullanılan geniş yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin.                                                     |

Mevcut canlı tüketiciler:

- Gateway başlangıç planlaması, açık başlangıç içe aktarması için
  `activation.onStartup` kullanır
- komutla tetiklenen CLI planlaması, eski
  `commandAliases[].cliCommand` veya `commandAliases[].name` değerine geri döner
- aracı çalışma zamanı başlangıç planlaması, gömülü yürütme takımları için
  `activation.onAgentHarnesses` ve CLI çalışma zamanı takma adları için üst düzey
  `cliBackends[]` kullanır
- kanalla tetiklenen kurulum/kanal planlaması, açık kanal etkinleştirme meta
  verisi eksik olduğunda eski `channels[]` sahipliğine geri döner
- başlangıç Plugin planlaması, paketlenmiş tarayıcı Plugin'inin `browser` bloğu
  gibi kanal dışı kök yapılandırma yüzeyleri için `activation.onConfigPaths`
  kullanır
- sağlayıcıyla tetiklenen kurulum/çalışma zamanı planlaması, açık sağlayıcı
  etkinleştirme meta verisi eksik olduğunda eski `providers[]` ve üst düzey
  `cliBackends[]` sahipliğine geri döner

Planlayıcı tanılamaları, açık etkinleştirme ipuçlarını manifest sahipliği geri
dönüşünden ayırt edebilir. Örneğin `activation-command-hint`,
`activation.onCommands` eşleştiği anlamına gelirken `manifest-command-alias`,
planlayıcının bunun yerine `commandAliases` sahipliğini kullandığı anlamına
gelir. Bu neden etiketleri ana makine tanılamaları ve testler içindir; Plugin
yazarları sahipliği en iyi açıklayan meta veriyi bildirmeye devam etmelidir.

## qaRunners başvurusu

Bir Plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma
çalıştırıcısı sağladığında `qaRunners` kullanın. Bu meta veriyi düşük maliyetli
ve statik tutun; gerçek CLI kaydının sahibi hâlâ `qaRunnerCliRegistrations`
dışa aktaran hafif bir `runtime-api.ts` yüzeyi üzerinden Plugin çalışma
zamanıdır.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Alan          | Gerekli | Tür      | Ne anlama gelir                                                        |
| ------------- | ------- | -------- | ---------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altına bağlanan alt komut, örneğin `matrix`.             |
| `description` | Hayır   | `string` | Paylaşılan ana makinenin saplama komuta ihtiyacı olduğunda kullanılan yedek yardım metni. |

## setup başvurusu

Kurulum ve kullanıma alma yüzeylerinin runtime yüklenmeden önce Plugin'e ait
ucuz metadata'ya ihtiyaç duyduğu durumlarda `setup` kullanın.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Üst düzey `cliBackends` geçerli kalır ve CLI çıkarım arka uçlarını açıklamaya
devam eder. `setup.cliBackends`, yalnızca metadata olarak kalması gereken
kontrol düzlemi/kurulum akışları için kuruluma özgü tanımlayıcı yüzeydir.

Mevcut olduğunda, `setup.providers` ve `setup.cliBackends` kurulum keşfi için
tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday
Plugin'i daraltıyorsa ve kurulum hâlâ kurulum zamanında daha zengin runtime
hook'larına ihtiyaç duyuyorsa, `requiresRuntime: true` ayarlayın ve yedek yürütme
yolu olarak `setup-api` öğesini yerinde tutun.

OpenClaw ayrıca genel sağlayıcı kimlik doğrulaması ve ortam değişkeni
aramalarında `setup.providers[].envVars` öğesini içerir. `providerAuthEnvVars`,
kullanımdan kaldırma penceresi boyunca bir uyumluluk adaptörü üzerinden
desteklenmeye devam eder, ancak bunu hâlâ kullanan paketlenmemiş Plugin'ler bir
manifest tanılaması alır. Yeni Plugin'ler kurulum/durum ortam metadata'sını
`setup.providers[].envVars` üzerine koymalıdır.

OpenClaw, kurulum girdisi olmadığında veya `setup.requiresRuntime: false`
kurulum runtime'ının gereksiz olduğunu bildirdiğinde, basit kurulum seçimlerini
`setup.providers[].authMethods` öğesinden de türetebilir. Açık
`providerAuthChoices` girdileri özel etiketler, CLI bayrakları, kullanıma alma
kapsamı ve asistan metadata'sı için tercih edilmeye devam eder.

`requiresRuntime: false` değerini yalnızca bu tanımlayıcılar kurulum yüzeyi için
yeterli olduğunda ayarlayın. OpenClaw açık `false` değerini yalnızca
tanımlayıcıdan oluşan bir sözleşme olarak ele alır ve kurulum araması için
`setup-api` veya `openclaw.setupEntry` yürütmez. Yalnızca tanımlayıcıdan oluşan
bir Plugin bu kurulum runtime girdilerinden birini yine de gönderiyorsa,
OpenClaw eklemeli bir tanılama raporlar ve onu yok saymaya devam eder.
`requiresRuntime` değerinin atlanması, bayrak olmadan tanımlayıcı eklemiş mevcut
Plugin'lerin bozulmaması için eski yedek davranışı korur.

Kurulum araması Plugin'e ait `setup-api` kodunu yürütebildiğinden,
normalleştirilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri
keşfedilen Plugin'ler arasında benzersiz kalmalıdır. Belirsiz sahiplik, keşif
sırasından bir kazanan seçmek yerine kapalı şekilde başarısız olur.

Kurulum runtime'ı yürütüldüğünde, `setup-api` manifest tanımlayıcılarının
bildirmediği bir sağlayıcı veya CLI arka ucu kaydederse ya da bir tanımlayıcının
eşleşen runtime kaydı yoksa, kurulum kayıt defteri tanılamaları tanımlayıcı
sapmasını raporlar. Bu tanılamalar eklemelidir ve eski Plugin'leri reddetmez.

### setup.providers başvurusu

| Alan           | Gerekli | Tür        | Ne anlama gelir                                                                                  |
| -------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Evet    | `string`   | Kurulum veya kullanıma alma sırasında sunulan sağlayıcı kimliği. Normalleştirilmiş kimlikleri küresel olarak benzersiz tutun. |
| `authMethods`  | Hayır   | `string[]` | Bu sağlayıcının tam runtime yüklemeden desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`      | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin runtime'ı yüklenmeden önce denetleyebileceği ortam değişkenleri. |
| `authEvidence` | Hayır   | `object[]` | Gizli olmayan işaretçiler üzerinden kimlik doğrulayabilen sağlayıcılar için ucuz yerel kimlik doğrulama kanıtı denetimleri. |

`authEvidence`, runtime kodu yüklenmeden doğrulanabilen, sağlayıcıya ait yerel
kimlik bilgisi işaretçileri içindir. Bu denetimler ucuz ve yerel kalmalıdır:
ağ çağrısı yok, anahtarlık veya secret-manager okuması yok, kabuk komutu yok ve
sağlayıcı API yoklaması yok.

Desteklenen kanıt girdileri:

| Alan               | Gerekli | Tür        | Ne anlama gelir                                                                                                |
| ------------------ | ------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Evet    | `string`   | Şu anda `local-file-with-env`.                                                                                 |
| `fileEnvVar`       | Hayır   | `string`   | Açık bir kimlik bilgisi dosya yolu içeren ortam değişkeni.                                                     |
| `fallbackPaths`    | Hayır   | `string[]` | `fileEnvVar` yoksa veya boşsa denetlenen yerel kimlik bilgisi dosya yolları. `${HOME}` ve `${APPDATA}` destekler. |
| `requiresAnyEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen ortam değişkenlerinden en az biri boş olmamalıdır.                       |
| `requiresAllEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen her ortam değişkeni boş olmamalıdır.                                     |
| `credentialMarker` | Evet    | `string`   | Kanıt mevcut olduğunda döndürülen gizli olmayan işaretçi.                                                      |
| `source`           | Hayır   | `string`   | Kimlik doğrulama/durum çıktısı için kullanıcıya dönük kaynak etiketi.                                          |

### setup alanları

| Alan               | Gerekli | Tür        | Ne anlama gelir                                                                                 |
| ------------------ | ------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve kullanıma alma sırasında sunulan sağlayıcı kurulum tanımlayıcıları.                  |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kullanılan kurulum zamanı arka uç kimlikleri. Normalleştirilmiş kimlikleri küresel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin'in kurulum yüzeyinin sahip olduğu yapılandırma migrasyonu kimlikleri.                 |
| `requiresRuntime`  | Hayır   | `boolean`  | Kurulumun tanımlayıcı aramasından sonra hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.   |

## uiHints başvurusu

`uiHints`, yapılandırma alan adlarından küçük işleme ipuçlarına giden bir haritadır.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Her alan ipucu şunları içerebilir:

| Alan          | Tür        | Ne anlama gelir                           |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Kullanıcıya dönük alan etiketi.           |
| `help`        | `string`   | Kısa yardımcı metin.                      |
| `tags`        | `string[]` | İsteğe bağlı kullanıcı arayüzü etiketleri. |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.          |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girişleri için yer tutucu metin.     |

## contracts başvurusu

`contracts` öğesini yalnızca OpenClaw'ın Plugin runtime'ını içe aktarmadan
okuyabileceği statik yetenek sahipliği metadata'sı için kullanın.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Her liste isteğe bağlıdır:

| Alan                             | Tür        | Ne anlama gelir                                                                                                                      |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex uygulama sunucusu uzantı factory kimlikleri, şu anda `codex-app-server`.                                                       |
| `agentToolResultMiddleware`      | `string[]` | Bu Plugin'in araç sonucu ara yazılımı kaydedebileceği çalışma zamanı kimlikleri.                                                     |
| `trustedToolPolicies`            | `string[]` | Kurulu bir Plugin'in kaydedebileceği Plugin'e yerel güvenilir araç öncesi politika kimlikleri. Paketle gelen Plugin'ler bu alan olmadan politika kaydedebilir. |
| `externalAuthProviders`          | `string[]` | Bu Plugin'in sahibi olduğu harici kimlik doğrulama profili kancalarına ait sağlayıcı kimlikleri.                                    |
| `embeddingProviders`             | `string[]` | Bellek dahil yeniden kullanılabilir vektör gömme kullanımı için bu Plugin'in sahibi olduğu genel gömme sağlayıcısı kimlikleri.       |
| `speechProviders`                | `string[]` | Bu Plugin'in sahibi olduğu konuşma sağlayıcısı kimlikleri.                                                                            |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin'in sahibi olduğu gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri.                                                      |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin'in sahibi olduğu gerçek zamanlı ses sağlayıcısı kimlikleri.                                                                 |
| `memoryEmbeddingProviders`       | `string[]` | Bu Plugin'in sahibi olduğu, kullanımdan kaldırılmış belleğe özgü gömme sağlayıcısı kimlikleri.                                       |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin'in sahibi olduğu medya anlama sağlayıcısı kimlikleri.                                                                       |
| `transcriptSourceProviders`      | `string[]` | Bu Plugin'in sahibi olduğu transkript kaynağı sağlayıcısı kimlikleri.                                                                 |
| `imageGenerationProviders`       | `string[]` | Bu Plugin'in sahibi olduğu görüntü oluşturma sağlayıcısı kimlikleri.                                                                  |
| `videoGenerationProviders`       | `string[]` | Bu Plugin'in sahibi olduğu video oluşturma sağlayıcısı kimlikleri.                                                                    |
| `webFetchProviders`              | `string[]` | Bu Plugin'in sahibi olduğu web getirme sağlayıcısı kimlikleri.                                                                        |
| `webSearchProviders`             | `string[]` | Bu Plugin'in sahibi olduğu web arama sağlayıcısı kimlikleri.                                                                          |
| `migrationProviders`             | `string[]` | `openclaw migrate` için bu Plugin'in sahibi olduğu içe aktarma sağlayıcısı kimlikleri.                                                |
| `gatewayMethodDispatch`          | `string[]` | Gateway yöntemlerini süreç içinde dağıtan, kimliği doğrulanmış Plugin HTTP rotaları için ayrılmış yetki.                              |
| `tools`                          | `string[]` | Bu Plugin'in sahibi olduğu aracı araç adları.                                                                                         |

`contracts.embeddedExtensionFactories`, paketle gelen yalnızca Codex
uygulama sunucusu uzantı factory'leri için korunur. Paketle gelen araç sonucu
dönüşümleri bunun yerine `contracts.agentToolResultMiddleware` bildirmeli ve
`api.registerAgentToolResultMiddleware(...)` ile kaydolmalıdır. Kurulu
Plugin'ler aynı ara yazılım bağlantı noktasını yalnızca açıkça etkinleştirildiğinde
ve yalnızca `contracts.agentToolResultMiddleware` içinde bildirdikleri çalışma
zamanları için kullanabilir.

Ana makine tarafından güvenilen araç öncesi politika katmanına ihtiyaç duyan
kurulu Plugin'ler, kayıtlı her yerel kimliği `contracts.trustedToolPolicies`
içinde bildirmeli ve açıkça etkinleştirilmelidir. Paketle gelen Plugin'ler
mevcut güvenilir politika yolunu korur, ancak bildirilmemiş politika kimliklerine
sahip kurulu Plugin'ler kayıt öncesinde reddedilir. Politika kimlikleri kaydı
yapan Plugin'e göre kapsamlanır; bu nedenle iki Plugin de `workflow-budget`
bildirip kaydedebilir; tek bir Plugin aynı yerel kimliği iki kez kaydedemez.

Çalışma zamanı `api.registerTool(...)` kayıtları `contracts.tools` ile
eşleşmelidir. Araç keşfi, istenen araçların sahibi olabilecek yalnızca ilgili
Plugin çalışma zamanlarını yüklemek için bu listeyi kullanır.

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'ler
`contracts.externalAuthProviders` bildirmelidir; bildirilmemiş harici kimlik
doğrulama kancaları yok sayılır.

Genel gömme sağlayıcıları, `api.registerEmbeddingProvider(...)` ile kaydedilen
her bağdaştırıcı için `contracts.embeddingProviders` bildirmelidir. Bellek
araması tarafından tüketilen sağlayıcılar dahil yeniden kullanılabilir vektör
oluşturma için genel sözleşmeyi kullanın. `contracts.memoryEmbeddingProviders`,
kullanımdan kaldırılmış belleğe özgü uyumluluktur ve yalnızca mevcut
sağlayıcılar genel gömme sağlayıcısı bağlantı noktasına taşınırken kalır.

`contracts.gatewayMethodDispatch` şu anda `"authenticated-request"` kabul eder.
Bu, kötü amaçlı yerel Plugin'lere karşı bir korumalı alan değil, Gateway kontrol
düzlemi yöntemlerini kasıtlı olarak süreç içinde dağıtan yerel Plugin HTTP
rotaları için bir API hijyeni geçididir. Bunu yalnızca zaten Gateway HTTP kimlik
doğrulaması gerektiren, sıkı incelenmiş paketle gelen/operatör yüzeyleri için
kullanın.

## mediaUnderstandingProviderMetadata başvurusu

Bir medya anlama sağlayıcısının, çalışma zamanı yüklenmeden önce genel çekirdek
yardımcılarının ihtiyaç duyduğu varsayılan modelleri, otomatik kimlik doğrulama
geri dönüş önceliği veya yerel belge desteği varsa `mediaUnderstandingProviderMetadata`
kullanın. Anahtarlar ayrıca `contracts.mediaUnderstandingProviders` içinde
bildirilmelidir.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Her sağlayıcı girdisi şunları içerebilir:

| Alan                   | Tür                                 | Ne anlama gelir                                                                 |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Bu sağlayıcı tarafından sunulan medya yetenekleri.                              |
| `defaultModels`        | `Record<string, string>`            | Yapılandırma bir model belirtmediğinde kullanılan yetenekten modele varsayılanlar. |
| `autoPriority`         | `Record<string, number>`            | Otomatik kimlik bilgisi tabanlı sağlayıcı geri dönüşü için düşük sayılar daha önce sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Sağlayıcı tarafından desteklenen yerel belge girişleri.                         |

## channelConfigs başvurusu

Bir kanal Plugin'inin çalışma zamanı yüklenmeden önce düşük maliyetli
yapılandırma meta verilerine ihtiyacı olduğunda `channelConfigs` kullanın.
Salt okunur kanal kurulum/durum keşfi, kurulum girdisi olmadığında veya
`setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu
bildirdiğinde, yapılandırılmış harici kanallar için bu meta verileri doğrudan
kullanabilir.

`channelConfigs`, Plugin manifest meta verisidir; yeni bir üst düzey kullanıcı
yapılandırması bölümü değildir. Kullanıcılar kanal örneklerini hâlâ
`channels.<channel-id>` altında yapılandırır. OpenClaw, Plugin çalışma zamanı
kodu yürütülmeden önce yapılandırılmış kanalın hangi Plugin'e ait olduğuna karar
vermek için manifest meta verilerini okur.

Bir kanal Plugin'i için `configSchema` ve `channelConfigs` farklı yolları açıklar:

- `configSchema`, `plugins.entries.<plugin-id>.config` değerini doğrular
- `channelConfigs.<channel-id>.schema`, `channels.<channel-id>` değerini doğrular

`channels[]` bildiren paketle gelmeyen Plugin'ler, eşleşen `channelConfigs`
girdilerini de bildirmelidir. Bunlar olmadan OpenClaw Plugin'i yine de yükleyebilir,
ancak soğuk yol yapılandırma şeması, kurulum ve Control UI yüzeyleri, Plugin
çalışma zamanı yürütülene kadar kanala ait seçenek şeklini bilemez.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` ve
`nativeSkillsAutoEnabled`, kanal çalışma zamanı yüklenmeden önce çalışan komut
yapılandırma denetimleri için statik `auto` varsayılanları bildirebilir. Paketle
gelen kanallar da aynı varsayılanları, paketlerine ait diğer kanal katalog meta
verileriyle birlikte `package.json#openclaw.channel.commands` üzerinden
yayınlayabilir.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Her kanal girdisi şunları içerebilir:

| Alan          | Tür                      | Ne anlama gelir                                                                          |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Schema. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucuları/hassas ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                |
| `commands`    | `object`                 | Çalışma zamanı öncesi yapılandırma denetimleri için statik yerel komut ve yerel Skills otomatik varsayılanları. |
| `preferOver`  | `string[]`               | Bu kanalın seçim yüzeylerinde önüne geçmesi gereken eski veya daha düşük öncelikli Plugin kimlikleri. |

### Başka bir kanal Plugin'ini değiştirme

Plugin'iniz, başka bir Plugin'in de sağlayabildiği bir kanal kimliği için tercih
edilen sahip olduğunda `preferOver` kullanın. Yaygın durumlar; yeniden
adlandırılmış bir Plugin kimliği, paketle gelen bir Plugin'in yerini alan
bağımsız bir Plugin veya yapılandırma uyumluluğu için aynı kanal kimliğini
koruyan bakımlı bir çatallanmadır.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

`channels.chat` yapılandırıldığında OpenClaw hem kanal kimliğini hem de tercih
edilen Plugin kimliğini dikkate alır. Daha düşük öncelikli Plugin yalnızca
paketle geldiği veya varsayılan olarak etkin olduğu için seçilmişse OpenClaw,
kanala ve araçlarına tek bir Plugin'in sahip olması için onu etkili çalışma
zamanı yapılandırmasında devre dışı bırakır. Açık kullanıcı seçimi yine de
üstün gelir: kullanıcı her iki Plugin'i de açıkça etkinleştirirse OpenClaw bu
seçimi korur ve istenen Plugin kümesini sessizce değiştirmek yerine yinelenen
kanal/araç tanılamaları bildirir.

`preferOver` değerini gerçekten aynı kanalı sağlayabilen Plugin kimlikleriyle
sınırlı tutun. Bu genel bir öncelik alanı değildir ve kullanıcı yapılandırma
anahtarlarını yeniden adlandırmaz.

## modelSupport başvurusu

OpenClaw, Plugin çalışma zamanı yüklenmeden önce `gpt-5.5` veya `claude-sonnet-4.6` gibi kısaltma model kimliklerinden sağlayıcı Plugin'inizi çıkarsamalıysa `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw bu önceliği uygular:

- açık `provider/model` başvuruları, sahip olan `providers` bildirim üst verisini kullanır
- `modelPatterns`, `modelPrefixes` değerlerine göre önceliklidir
- bir paketlenmemiş Plugin ve bir paketlenmiş Plugin ikisi de eşleşirse paketlenmemiş
  Plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtene kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısaltma model kimliklerine karşı `startsWith` ile eşleştirilen önekler.               |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısaltma model kimliklerine karşı eşleştirilen regex kaynakları. |

`modelPatterns` girdileri, iç içe yineleme içeren kalıpları (örneğin `(a+)+$`)
reddeden `compileSafeRegex` üzerinden derlenir. Güvenlik denetiminden geçemeyen
kalıplar, sözdizimi açısından geçersiz regex ile aynı şekilde sessizce atlanır.
Kalıpları basit tutun ve iç içe niceleyicilerden kaçının.

## modelCatalog başvurusu

OpenClaw'ın Plugin çalışma zamanını yüklemeden önce sağlayıcı model üst verisini
bilmesi gerektiğinde `modelCatalog` kullanın. Bu, sabit katalog satırları,
sağlayıcı takma adları, bastırma kuralları ve keşif modu için bildirim tarafından
sahip olunan kaynaktır. Çalışma zamanı yenilemesi hâlâ sağlayıcı çalışma zamanı
koduna aittir, ancak bildirim çekirdeğe çalışma zamanının ne zaman gerektiğini
söyler.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Üst düzey alanlar:

| Alan             | Tür                                                      | Anlamı                                                                                                      |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Bu Plugin'in sahip olduğu sağlayıcı kimlikleri için katalog satırları. Anahtarlar üst düzey `providers` içinde de görünmelidir. |
| `aliases`        | `Record<string, object>`                                 | Katalog veya bastırma planlaması için sahip olunan bir sağlayıcıya çözümlenmesi gereken sağlayıcı takma adları. |
| `suppressions`   | `object[]`                                               | Bu Plugin'in sağlayıcıya özgü bir nedenle bastırdığı başka bir kaynaktan gelen model satırları.             |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Sağlayıcı kataloğunun bildirim üst verisinden okunup okunamayacağı, önbelleğe yenilenip yenilenemeyeceği veya çalışma zamanı gerektirip gerektirmediği. |
| `runtimeAugment` | `boolean`                                                | Yalnızca sağlayıcı çalışma zamanı, bildirim/yapılandırma planlamasından sonra katalog satırları eklemek zorundaysa `true` olarak ayarlayın. |

`aliases`, model kataloğu planlaması için sağlayıcı sahipliği aramasına katılır.
Takma ad hedefleri, aynı Plugin'in sahip olduğu üst düzey sağlayıcılar olmalıdır.
Sağlayıcıya göre filtrelenmiş bir liste takma ad kullandığında, OpenClaw sağlayıcı
çalışma zamanını yüklemeden sahip bildirimini okuyabilir ve takma ad API/temel URL
geçersiz kılmalarını uygulayabilir. Takma adlar, filtrelenmemiş katalog
listelemelerini genişletmez; geniş listeler yalnızca sahip olan kanonik sağlayıcı
satırlarını yayar.

`suppressions`, eski sağlayıcı çalışma zamanı `suppressBuiltInModel` kancasının
yerini alır. Bastırma girdileri yalnızca sağlayıcı Plugin'e ait olduğunda veya
sahip olunan bir sağlayıcıyı hedefleyen bir `modelCatalog.aliases` anahtarı olarak
bildirildiğinde dikkate alınır. Çalışma zamanı bastırma kancaları artık model
çözümleme sırasında çağrılmaz.

Sağlayıcı alanları:

| Alan      | Tür                      | Anlamı                                                               |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan temel URL. |
| `api`     | `ModelApi`               | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan API adaptörü. |
| `headers` | `Record<string, string>` | Bu sağlayıcı kataloğuna uygulanan isteğe bağlı statik başlıklar.      |
| `models`  | `object[]`               | Zorunlu model satırları. `id` olmayan satırlar yok sayılır.           |

Model alanları:

| Alan            | Tür                                                            | Anlamı                                                                        |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` öneki olmadan, sağlayıcıya yerel model kimliği.                   |
| `name`          | `string`                                                       | İsteğe bağlı görüntüleme adı.                                                 |
| `api`           | `ModelApi`                                                     | İsteğe bağlı model başına API geçersiz kılması.                               |
| `baseUrl`       | `string`                                                       | İsteğe bağlı model başına temel URL geçersiz kılması.                         |
| `headers`       | `Record<string, string>`                                       | İsteğe bağlı model başına statik başlıklar.                                   |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modelin kabul ettiği modaliteler.                                             |
| `reasoning`     | `boolean`                                                      | Modelin akıl yürütme davranışı sunup sunmadığı.                               |
| `contextWindow` | `number`                                                       | Yerel sağlayıcı bağlam penceresi.                                             |
| `contextTokens` | `number`                                                       | `contextWindow` değerinden farklı olduğunda isteğe bağlı etkili çalışma zamanı bağlam sınırı. |
| `maxTokens`     | `number`                                                       | Bilindiğinde en fazla çıktı token sayısı.                                     |
| `cost`          | `object`                                                       | İsteğe bağlı `tieredPricing` dahil, milyon token başına isteğe bağlı USD fiyatlandırması. |
| `compat`        | `object`                                                       | OpenClaw model yapılandırması uyumluluğuyla eşleşen isteğe bağlı uyumluluk bayrakları. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listeleme durumu. Yalnızca satır hiç görünmemeliyse bastırın.                 |
| `statusReason`  | `string`                                                       | Kullanılamaz durumla gösterilen isteğe bağlı neden.                           |
| `replaces`      | `string[]`                                                     | Bu modelin yerini aldığı eski sağlayıcıya yerel model kimlikleri.             |
| `replacedBy`    | `string`                                                       | Kullanımdan kaldırılmış satırlar için yedek sağlayıcıya yerel model kimliği.  |
| `tags`          | `string[]`                                                     | Seçiciler ve filtreler tarafından kullanılan kararlı etiketler.               |

Bastırma alanları:

| Alan                       | Tür        | Anlamı                                                                                                      |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Bastırılacak yukarı akış satırı için sağlayıcı kimliği. Bu Plugin'e ait olmalı veya sahip olunan bir takma ad olarak bildirilmelidir. |
| `model`                    | `string`   | Bastırılacak sağlayıcıya yerel model kimliği.                                                               |
| `reason`                   | `string`   | Bastırılan satır doğrudan istendiğinde gösterilen isteğe bağlı ileti.                                       |
| `when.baseUrlHosts`        | `string[]` | Bastırmanın uygulanması için gereken etkili sağlayıcı temel URL ana makinelerinin isteğe bağlı listesi.     |
| `when.providerConfigApiIn` | `string[]` | Bastırmanın uygulanması için gereken tam sağlayıcı yapılandırması `api` değerlerinin isteğe bağlı listesi.  |

`modelCatalog` içine yalnızca çalışma zamanına özgü veri koymayın. `static`
değerini yalnızca bildirim satırları, sağlayıcıya göre filtrelenmiş liste ve
seçici yüzeylerinin kayıt/çalışma zamanı keşfini atlamasına yetecek kadar
tamamlandığında kullanın. Bildirim satırları listelenebilir başlangıçlar veya
tamamlayıcılar olarak yararlı olduğunda ancak yenileme/önbellek daha sonra daha
fazla satır ekleyebildiğinde `refreshable` kullanın; yenilenebilir satırlar kendi
başlarına yetkili değildir. OpenClaw'ın listeyi bilmek için sağlayıcı çalışma
zamanını yüklemesi gerektiğinde `runtime` kullanın.

## modelIdNormalization başvurusu

Sağlayıcı çalışma zamanı yüklenmeden önce gerçekleşmesi gereken ucuz,
sağlayıcıya ait model kimliği temizliği için `modelIdNormalization` kullanın. Bu,
kısa model adları, sağlayıcıya yerel eski kimlikler ve proxy önek kuralları gibi
takma adları çekirdek model seçimi tabloları yerine sahip Plugin bildiriminde
tutar.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Sağlayıcı alanları:

| Alan                                 | Tür                     | Anlamı                                                                                     |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | Büyük/küçük harfe duyarsız tam model kimliği takma adları. Değerler yazıldığı gibi döndürülür. |
| `stripPrefixes`                      | `string[]`              | Takma ad aramasından önce kaldırılacak önekler; eski sağlayıcı/model yinelenmesi için kullanışlıdır. |
| `prefixWhenBare`                     | `string`                | Normalleştirilmiş model kimliği zaten `/` içermediğinde eklenecek önek.                    |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Takma ad aramasından sonra, `modelPrefix` ve `prefix` ile anahtarlanan koşullu çıplak kimlik önek kuralları. |

## providerEndpoints başvurusu

Genel istek politikasının sağlayıcı çalışma zamanı yüklenmeden önce bilmesi
gereken uç nokta sınıflandırması için `providerEndpoints` kullanın. Çekirdek her
`endpointClass` değerinin anlamına hâlâ sahip olur; Plugin bildirimleri ana
makine ve temel URL üst verisine sahip olur.

Endpoint alanları:

| Alan                           | Tür        | Ne anlama gelir                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`, `moonshot-native` veya `google-vertex` gibi bilinen çekirdek endpoint sınıfı.        |
| `hosts`                        | `string[]` | Endpoint sınıfına eşlenen tam ana makine adları.                                                |
| `hostSuffixes`                 | `string[]` | Endpoint sınıfına eşlenen ana makine sonekleri. Yalnızca domain soneki eşleşmesi için başına `.` ekleyin. |
| `baseUrls`                     | `string[]` | Endpoint sınıfına eşlenen tam normalleştirilmiş HTTP(S) temel URL'leri.                             |
| `googleVertexRegion`           | `string`   | Tam global ana makineler için statik Google Vertex bölgesi.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Google Vertex bölge önekini açığa çıkarmak için eşleşen ana makinelerden çıkarılacak sonek.                 |

## providerRequest referansı

Genel istek politikasının sağlayıcı çalışma zamanını yüklemeden ihtiyaç duyduğu
ucuz istek uyumluluğu metadatası için `providerRequest` kullanın. Davranışa özel
payload yeniden yazmayı sağlayıcı çalışma zamanı hook'larında veya paylaşılan sağlayıcı ailesi yardımcılarında tutun.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Sağlayıcı alanları:

| Alan                  | Tür          | Ne anlama gelir                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Genel istek uyumluluğu kararları ve tanılamalar tarafından kullanılan sağlayıcı ailesi etiketi. |
| `compatibilityFamily` | `"moonshot"` | Paylaşılan istek yardımcıları için isteğe bağlı sağlayıcı ailesi uyumluluk grubu.              |
| `openAICompletions`   | `object`     | OpenAI uyumlu tamamlama isteği bayrakları, şu anda `supportsStreamingUsage`.       |

## secretProviderIntegrations referansı

Bir Plugin yeniden kullanılabilir SecretRef exec sağlayıcı ön ayarı yayımlayabildiğinde
`secretProviderIntegrations` kullanın. OpenClaw bu metadatayı Plugin çalışma zamanı yüklenmeden önce okur,
Plugin sahipliğini `secrets.providers.<alias>.pluginIntegration` içinde saklar ve
gerçek secret çözümlemesini SecretRef çalışma zamanına bırakır.
Ön ayarlar yalnızca paketlenmiş pluginler ve git ile ClawHub kurulumları gibi
yönetilen Plugin kurulum köklerinden keşfedilen kurulu pluginler için açığa çıkarılır.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

Harita anahtarı entegrasyon id'sidir. `providerAlias` atlanırsa OpenClaw,
SecretRef sağlayıcı alias'ı olarak entegrasyon id'sini kullanır. Sağlayıcı alias'ları,
örneğin `team-secrets` veya `onepassword-work` gibi normal SecretRef sağlayıcı alias kalıbıyla eşleşmelidir.

Bir operatör ön ayarı seçtiğinde OpenClaw şuna benzer bir sağlayıcı referansı yazar:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

Başlatma/yeniden yükleme sırasında OpenClaw, geçerli Plugin manifest metadatasını yükleyerek,
sahip Pluginin kurulu ve etkin olduğunu denetleyerek ve exec komutunu manifestten somutlaştırarak
bu sağlayıcıyı çözümler. Plugini devre dışı bırakmak veya kaldırmak, etkin SecretRef'ler için
sağlayıcıyı geri alır. Bağımsız exec yapılandırması isteyen operatörler manuel
`command`/`args` sağlayıcılarını doğrudan yazmaya devam edebilir.

Şu anda yalnızca `source: "exec"` ön ayarları desteklenir. `command`
`${node}` olmalı ve `args[0]`, `./` ile başlayan Plugin köküne göreli bir çözümleyici betiği olmalıdır.
OpenClaw bunu başlatma/yeniden yükleme sırasında geçerli Node çalıştırılabilir dosyasına ve
Plugin içindeki mutlak betik yoluna somutlaştırır. `--require`, `--import`,
`--loader`, `--env-file`, `--eval` ve `--print` gibi Node seçenekleri manifest
ön ayar sözleşmesinin parçası değildir. Node olmayan komutlara ihtiyaç duyan operatörler
bağımsız manuel exec sağlayıcılarını doğrudan yapılandırabilir.

OpenClaw, manifest ön ayarları için `trustedDirs` değerlerini Plugin kökünden ve
`${node}` ön ayarları için geçerli Node çalıştırılabilir dosyası dizininden türetir.
Manifestte yazılan `trustedDirs` yok sayılır. `timeoutMs`,
`maxOutputBytes`, `jsonOnly`, `env`, `passEnv` ve `allowInsecurePath` gibi diğer exec sağlayıcı seçenekleri
normal SecretRef exec sağlayıcı yapılandırmasına aktarılır.

## modelPricing referansı

Bir sağlayıcının çalışma zamanı yüklenmeden önce kontrol düzlemi fiyatlandırma davranışına ihtiyaç duyduğu durumlarda
`modelPricing` kullanın. Gateway fiyatlandırma önbelleği, sağlayıcı çalışma zamanı kodunu içe aktarmadan
bu metadatayı okur.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Sağlayıcı alanları:

| Alan         | Tür               | Ne anlama gelir                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter veya LiteLLM fiyatlandırmasını asla çekmemesi gereken yerel/kendi barındırılan sağlayıcılar için `false` olarak ayarlayın. |
| `openRouter` | `false \| object` | OpenRouter fiyatlandırma arama eşlemesi. `false`, bu sağlayıcı için OpenRouter aramasını devre dışı bırakır.           |
| `liteLLM`    | `false \| object` | LiteLLM fiyatlandırma arama eşlemesi. `false`, bu sağlayıcı için LiteLLM aramasını devre dışı bırakır.                 |

Kaynak alanları:

| Alan                       | Tür                | Ne anlama gelir                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw sağlayıcı id'sinden farklı olduğunda harici katalog sağlayıcı id'si; örneğin bir `zai` sağlayıcısı için `z-ai`. |
| `passthroughProviderModel` | `boolean`          | Eğik çizgi içeren model id'lerini iç içe sağlayıcı/model referansları olarak ele alır; OpenRouter gibi proxy sağlayıcılar için kullanışlıdır.       |
| `modelIdTransforms`        | `"version-dots"[]` | Ek harici katalog model id varyantları. `version-dots`, `claude-opus-4.6` gibi noktalı sürüm id'lerini dener.            |

### OpenClaw Sağlayıcı İndeksi

OpenClaw Sağlayıcı İndeksi, pluginleri henüz kurulu olmayabilecek sağlayıcılar için
OpenClaw'a ait önizleme metadatasıdır. Bir Plugin manifestinin parçası değildir.
Plugin manifestleri kurulu Plugin yetki kaynağı olmaya devam eder. Sağlayıcı İndeksi,
bir sağlayıcı Plugini kurulu olmadığında gelecekteki kurulabilir sağlayıcı ve kurulum öncesi
model seçici yüzeylerinin tüketeceği dahili yedek sözleşmedir.

Katalog yetki sırası:

1. Kullanıcı yapılandırması.
2. Kurulu Plugin manifesti `modelCatalog`.
3. Açık yenilemeden gelen model kataloğu önbelleği.
4. OpenClaw Sağlayıcı İndeksi önizleme satırları.

Sağlayıcı İndeksi secret'lar, etkin durum, çalışma zamanı hook'ları veya
canlı hesaba özel model verileri içermemelidir. Önizleme katalogları, Plugin manifestleriyle aynı
`modelCatalog` sağlayıcı satırı şeklini kullanır; ancak `api`,
`baseUrl`, fiyatlandırma veya uyumluluk bayrakları gibi çalışma zamanı adaptörü alanları bilerek
kurulu Plugin manifestiyle hizalı tutulmadığı sürece kararlı görüntüleme metadatasıyla sınırlı kalmalıdır.
Canlı `/models` keşfine sahip sağlayıcılar, normal listeleme veya ilk kurulumun sağlayıcı API'lerini çağırması yerine
yenilenmiş satırları açık model kataloğu önbelleği yolu üzerinden yazmalıdır.

Sağlayıcı İndeksi girdileri, Plugini çekirdekten çıkarılmış veya başka şekilde henüz kurulu olmayan sağlayıcılar için
kurulabilir Plugin metadatası da taşıyabilir. Bu metadata kanal kataloğu kalıbını yansıtır:
paket adı, npm kurulum belirtimi, beklenen bütünlük ve ucuz auth seçimi etiketleri
kurulabilir bir kurulum seçeneği göstermek için yeterlidir. Plugin kurulduktan sonra
onun manifesti kazanır ve Sağlayıcı İndeksi girdisi o sağlayıcı için yok sayılır.

Eski üst düzey capability anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` ve `webSearchProviders` değerlerini `contracts` altına taşımak için
`openclaw doctor --fix` kullanın; normal manifest yükleme artık bu üst düzey alanları capability sahipliği olarak
ele almaz.

## Manifest ve package.json

İki dosya farklı işler için kullanılır:

| Dosya                  | Ne için kullanılır                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce var olması gereken keşif, yapılandırma doğrulama, auth seçimi metadatası ve UI ipuçları                         |
| `package.json`         | npm metadatası, bağımlılık kurulumu ve giriş noktaları, kurulum kapıları, kurulum veya katalog metadatası için kullanılan `openclaw` bloğu |

Bir metadata parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu Plugin kodunu yüklemeden önce bilmek zorundaysa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi Plugin metadataları bilerek `openclaw.plugin.json` yerine
`package.json` içindeki `openclaw` bloğunda bulunur.
`openclaw.bundle` ve `openclaw.bundle.json`, OpenClaw Plugin sözleşmeleri değildir;
native pluginler aşağıdaki desteklenen `package.json#openclaw` alanlarıyla birlikte
`openclaw.plugin.json` kullanmalıdır.

Önemli örnekler:

| Alan                                                                                       | Ne anlama gelir                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Yerel Plugin giriş noktalarını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                                                                         |
| `openclaw.runtimeExtensions`                                                               | Kurulu paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                            |
| `openclaw.setupEntry`                                                                      | İlk kurulum, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif, yalnızca kurulum giriş noktası. Plugin paket dizininin içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                                               | Kurulu paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. `setupEntry` gerektirir, var olmalıdır ve Plugin paket dizininin içinde kalmalıdır.                           |
| `openclaw.channel`                                                                         | Etiketler, dokümantasyon yolları, takma adlar ve seçim metni gibi ucuz kanal katalog meta verileri.                                                                                       |
| `openclaw.channel.commands`                                                                | Kanal çalışma zamanı yüklenmeden önce yapılandırma, denetim ve komut listesi yüzeyleri tarafından kullanılan statik yerel komut ve yerel beceri otomatik varsayılan meta verileri.        |
| `openclaw.channel.configuredState`                                                         | Tam kanal çalışma zamanını yüklemeden "yalnızca ortam değişkeniyle kurulum zaten var mı?" sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyici meta verileri.                  |
| `openclaw.channel.persistedAuthState`                                                      | Tam kanal çalışma zamanını yüklemeden "zaten oturum açılmış herhangi bir şey var mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama denetleyici meta verileri.                    |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Paketle gelen ve harici yayımlanan Plugin’ler için kurulum/güncelleme ipuçları.                                                                                                           |
| `openclaw.install.defaultChoice`                                                           | Birden fazla kurulum kaynağı kullanılabilir olduğunda tercih edilen kurulum yolu.                                                                                                         |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` veya `>=2026.5.1-beta.1` gibi bir semver alt sınırı kullanan, desteklenen en düşük OpenClaw ana makine sürümü.                                                              |
| `openclaw.compat.pluginApi`                                                                | Bu paket için gereken en düşük OpenClaw Plugin API aralığı; `>=2026.5.27` gibi bir semver alt sınırı kullanır.                                                                            |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` gibi beklenen npm dağıtım bütünlük dizesi; kurulum ve güncelleme akışları getirilen yapıtı buna göre doğrular.                                                              |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Yapılandırma geçersiz olduğunda dar kapsamlı, paketle gelen Plugin yeniden kurulum kurtarma yoluna izin verir.                                                                            |
| `openclaw.install.requiredPlatformPackages`                                                | Kilit dosyası platform kısıtları geçerli ana makineyle eşleştiğinde ortaya çıkması gereken npm paket takma adları.                                                                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Kurulum çalışma zamanı kanal yüzeylerinin dinleme öncesinde yüklenmesine izin verir, ardından tam yapılandırılmış kanal Plugin’ini dinleme sonrası etkinleştirmeye erteler.              |

Manifest meta verileri, çalışma zamanı yüklenmeden önce ilk kurulumda hangi
sağlayıcı/kanal/kurulum seçeneklerinin görüneceğine karar verir.
`package.json#openclaw.install`, kullanıcı bu seçeneklerden birini seçtiğinde
ilk kuruluma ilgili Plugin’in nasıl getirileceğini veya etkinleştirileceğini
söyler. Kurulum ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, paketle gelmeyen Plugin kaynakları için
kurulum ve manifest kayıt yükleme sırasında zorunlu tutulur. Geçersiz değerler
reddedilir; daha yeni ama geçerli değerler, eski ana makinelerde harici
Plugin’leri atlar. Paketle gelen kaynak Plugin’lerin ana makine checkout’ı ile
aynı sürümde olduğu varsayılır.

`openclaw.install.requiredPlatformPackages`, gerekli yerel ikili dosyaları
isteğe bağlı, platforma özel takma adlar üzerinden sunan npm paketleri içindir.
Desteklenen her platform takma adı için yalın npm paket adını listeleyin. npm
kurulumu sırasında OpenClaw yalnızca kilit dosyası kısıtları geçerli ana
makineyle eşleşen bildirilen takma adı doğrular. npm başarı bildirir ama bu
takma adı atlar ise OpenClaw taze bir önbellekle bir kez yeniden dener ve takma
ad hâlâ eksikse kurulumu geri alır.

`openclaw.compat.pluginApi`, paketle gelmeyen Plugin kaynakları için paket
kurulumu sırasında zorunlu tutulur. Paketin üzerine inşa edildiği OpenClaw
Plugin SDK/çalışma zamanı API alt sınırı için bunu kullanın.
`minHostVersion` değerinden daha katı olabilir; örneğin bir Plugin paketi daha
yeni bir API’ye ihtiyaç duyarken diğer akışlar için daha düşük bir kurulum
ipucunu koruyabilir. Resmi OpenClaw sürüm eşitlemesi, varsayılan olarak mevcut
resmi Plugin API alt sınırlarını OpenClaw sürümüne yükseltir; ancak yalnızca
Plugin sürümleri, paket özellikle eski ana makineleri desteklediğinde daha
düşük bir alt sınırı koruyabilir. Uyumluluk sözleşmesi olarak yalnızca paket
sürümünü kullanmayın. `peerDependencies.openclaw`, npm paket meta verisi olarak
kalır; OpenClaw kurulum uyumluluğu kararları için
`openclaw.compat.pluginApi` sözleşmesini kullanır.

Resmi isteğe bağlı kurulum meta verileri, Plugin ClawHub’da yayımlandığında
`clawhubSpec` kullanmalıdır; ilk kurulum bunu tercih edilen uzak kaynak olarak
ele alır ve kurulumdan sonra ClawHub yapıt gerçeklerini kaydeder. `npmSpec`,
henüz ClawHub’a taşınmamış paketler için uyumluluk geri dönüşü olarak kalır.

Tam npm sürüm sabitlemesi zaten `npmSpec` içinde bulunur; örneğin
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmi harici katalog
girdileri, güncelleme akışlarının getirilen npm yapıtı artık sabitlenmiş
sürümle eşleşmiyorsa güvenli şekilde başarısız olması için tam belirtimleri
`expectedIntegrity` ile eşleştirmelidir. Etkileşimli ilk kurulum, uyumluluk için
yalın paket adları ve dist-tag’ler dahil güvenilen kayıt npm belirtimlerini
sunmaya devam eder. Katalog tanılamaları tam, değişken, bütünlükle sabitlenmiş,
bütünlüğü eksik, paket adı uyuşmayan ve geçersiz varsayılan seçim kaynaklarını
ayırt edebilir. Ayrıca `expectedIntegrity` mevcut olduğunda ama bunu
sabitleyebileceği geçerli bir npm kaynağı bulunmadığında uyarır.
`expectedIntegrity` mevcut olduğunda kurulum/güncelleme akışları bunu zorunlu
tutar; atlandığında kayıt çözümlemesi bütünlük sabitlemesi olmadan kaydedilir.

Kanal Plugin’leri, durum, kanal listesi veya SecretRef taramalarının tam çalışma
zamanını yüklemeden yapılandırılmış hesapları tanımlaması gerektiğinde
`openclaw.setupEntry` sağlamalıdır. Kurulum girişi kanal meta verilerini ve
kurulum açısından güvenli yapılandırma, durum ve gizli bilgi adaptörlerini
sunmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve taşıma çalışma
zamanlarını ana uzantı giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanları için paket
sınırı denetimlerini geçersiz kılmaz. Örneğin
`openclaw.runtimeExtensions`, sınır dışına çıkan bir `openclaw.extensions`
yolunu yüklenebilir hâle getiremez.

`openclaw.install.allowInvalidConfigRecovery` özellikle dar kapsamlıdır. Rastgele
bozuk yapılandırmaları kurulabilir hâle getirmez. Bugün yalnızca eksik bir
paketle gelen Plugin yolu veya aynı paketle gelen Plugin için eskimiş bir
`channels.<id>` girdisi gibi belirli eskimiş paketle gelen Plugin yükseltme
hatalarından kurulum akışlarının kurtulmasına izin verir. İlişkisiz
yapılandırma hataları kurulumu yine de engeller ve operatörleri
`openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modül için paket
meta verisidir:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Kurulum, doctor, durum veya salt okunur varlık akışları tam kanal Plugin’i
yüklenmeden önce ucuz bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç
duyduğunda bunu kullanın. Kalıcı kimlik doğrulama durumu, yapılandırılmış kanal
durumu değildir: Bu meta verileri Plugin’leri otomatik etkinleştirmek, çalışma
zamanı bağımlılıklarını onarmak veya bir kanal çalışma zamanının yüklenip
yüklenmeyeceğine karar vermek için kullanmayın. Hedef export yalnızca kalıcı
durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel’ı
üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, ucuz yalnızca ortam değişkeni yapılandırma
denetimleri için aynı biçimi izler:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Bir kanal yapılandırılmış durumu ortam değişkenlerinden veya diğer küçük
çalışma zamanı dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam
yapılandırma çözümlemesi veya gerçek kanal çalışma zamanı gerektiriyorsa bu
mantığı bunun yerine Plugin `config.hasConfiguredState` kancasında tutun.

## Keşif önceliği (yinelenen Plugin kimlikleri)

OpenClaw Plugin’leri birkaç kökten keşfeder. Ham dosya sistemi tarama sırası
için [Plugin tarama
sırası](/tr/gateway/configuration-reference#plugin-scan-order) bölümüne bakın. İki
keşif aynı `id` değerini paylaşıyorsa yalnızca **en yüksek öncelikli** manifest
tutulur; daha düşük öncelikli yinelemeler yanında yüklenmek yerine bırakılır.

Öncelik, en yüksekten en düşüğe:

1. **Yapılandırmada seçilen** — `plugins.entries.<id>` içinde açıkça sabitlenmiş bir yol
2. **Paketle gelen** — OpenClaw ile gelen Plugin’ler
3. **Genel kurulum** — genel OpenClaw Plugin köküne kurulan Plugin’ler
4. **Çalışma alanı** — geçerli çalışma alanına göre keşfedilen Plugin’ler

Sonuçlar:

- Çalışma alanında duran paketle gelen bir Plugin’in fork’lanmış veya eskimiş kopyası, paketle gelen derlemeyi gölgelemez.
- Paketle gelen bir Plugin’i yerel bir Plugin ile gerçekten geçersiz kılmak için, çalışma alanı keşfine güvenmek yerine öncelik kazanması için onu `plugins.entries.<id>` aracılığıyla sabitleyin.
- Yinelenen bırakmalar kaydedilir; böylece Doctor ve başlatma tanılamaları atılan kopyayı gösterebilir.
- Yapılandırmada seçilen yinelenen geçersiz kılmalar tanılamalarda açık geçersiz kılmalar olarak ifade edilir, ancak eskimiş fork’ların ve yanlışlıkla oluşan gölgelemelerin görünür kalması için yine de uyarır.

## JSON Schema gereksinimleri

- **Her Plugin bir JSON Schema ile birlikte gelmelidir**, yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin, `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.
- Paketle gelen bir Plugin'i yeni yapılandırma anahtarlarıyla genişletirken veya fork ederken, aynı anda o Plugin'in `openclaw.plugin.json` `configSchema` alanını güncelleyin. Paketle gelen Plugin şemaları katıdır; bu nedenle kullanıcı yapılandırmasına `plugins.entries.<id>.config.myNewKey` ekleyip `myNewKey` değerini `configSchema.properties` içine eklemezseniz, Plugin çalışma zamanı yüklenmeden önce reddedilir.

Örnek şema uzantısı:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Doğrulama davranışı

- Kanal kimliği bir Plugin manifesti tarafından bildirilmediği sürece, bilinmeyen `channels.*` anahtarları **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** Plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir Plugin yüklüyse ancak bozuk ya da eksik bir manifeste veya şemaya sahipse,
  doğrulama başarısız olur ve Doctor Plugin hatasını bildirir.
- Plugin yapılandırması varsa ancak Plugin **devre dışıysa**, yapılandırma korunur ve
  Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için [Yapılandırma başvurusu](/tr/gateway/configuration) bölümüne bakın.

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil olmak üzere **yerel OpenClaw Plugin'leri için zorunludur**. Çalışma zamanı yine de Plugin modülünü ayrıca yükler; manifest yalnızca keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu yüzden son değer hâlâ bir nesne olduğu sürece yorumlar, sonda virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyicisi yalnızca belgelenmiş manifest alanlarını okur. Özel üst düzey anahtarlardan kaçının.
- Bir Plugin bunlara ihtiyaç duymadığında `channels`, `providers`, `cliBackends` ve `skills` alanlarının tümü atlanabilir.
- `providerCatalogEntry` hafif kalmalı ve geniş çalışma zamanı kodunu içe aktarmamalıdır; bunu istek zamanı yürütmesi için değil, statik sağlayıcı katalog meta verileri veya dar keşif tanımlayıcıları için kullanın.
- Münhasır Plugin türleri `plugins.slots.*` üzerinden seçilir: `plugins.slots.memory` aracılığıyla `kind: "memory"`, `plugins.slots.contextEngine` aracılığıyla `kind: "context-engine"` (varsayılan `legacy`).
- Münhasır Plugin türünü bu manifestte bildirin. Çalışma zamanı girişi `OpenClawPluginDefinition.kind` kullanımdan kaldırılmıştır ve yalnızca eski Plugin'ler için uyumluluk geri dönüşü olarak kalır.
- Ortam değişkeni meta verileri (`setup.providers[].envVars`, kullanımdan kaldırılmış `providerAuthEnvVars` ve `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, Cron teslim doğrulaması ve diğer salt okunur yüzeyler, bir ortam değişkenini yapılandırılmış olarak değerlendirmeden önce hâlâ Plugin güvenini ve etkin aktivasyon politikasını uygular.
- Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı meta verileri için [Sağlayıcı çalışma zamanı kancaları](/tr/plugins/architecture-internals#provider-runtime-hooks) bölümüne bakın.
- Plugin'iniz yerel modüllere bağlıysa, derleme adımlarını ve paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## İlgili

<CardGroup cols={3}>
  <Card title="Building plugins" href="/tr/plugins/building-plugins" icon="rocket">
    Plugin'lere başlarken.
  </Card>
  <Card title="Plugin architecture" href="/tr/plugins/architecture" icon="diagram-project">
    İç mimari ve yetenek modeli.
  </Card>
  <Card title="SDK overview" href="/tr/plugins/sdk-overview" icon="book">
    Plugin SDK başvurusu ve alt yol içe aktarmaları.
  </Card>
</CardGroup>
