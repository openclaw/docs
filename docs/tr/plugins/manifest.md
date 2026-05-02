---
read_when:
    - Bir OpenClaw Plugin oluşturuyorsunuz
    - Bir Plugin yapılandırma şeması yayımlamanız veya Plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin manifesti
x-i18n:
    generated_at: "2026-05-02T20:48:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Bu sayfa yalnızca **yerel OpenClaw Plugin manifesti** içindir.

Uyumlu paket düzenleri için bkz. [Plugin paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşen
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan
`openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda, düzen OpenClaw çalışma zamanı
beklentileriyle eşleştiğinde paket meta verilerini ve bildirilen Skills köklerini,
Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını,
Claude paketi LSP varsayılanlarını ve desteklenen hook paketlerini okur.

Her yerel OpenClaw Plugin'i, **Plugin kökünde** bir `openclaw.plugin.json` dosyası
sunmak **zorundadır**. OpenClaw bu manifesti, **Plugin kodunu çalıştırmadan**
yapılandırmayı doğrulamak için kullanır. Eksik veya geçersiz manifestler Plugin
hatası olarak değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam Plugin sistemi kılavuzuna bakın: [Plugin'ler](/tr/tools/plugin).
Yerel yetenek modeli ve mevcut harici uyumluluk rehberliği için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar?

`openclaw.plugin.json`, OpenClaw'un **Plugin kodunuzu yüklemeden önce** okuduğu
meta verilerdir. Aşağıdaki her şey, Plugin çalışma zamanını başlatmadan
incelenebilecek kadar düşük maliyetli olmalıdır.

**Şunlar için kullanın:**

- Plugin kimliği, yapılandırma doğrulaması ve yapılandırma UI ipuçları
- kimlik doğrulama, ilk kurulum ve kurulum meta verileri (takma ad, otomatik etkinleştirme, provider env değişkenleri, kimlik doğrulama seçenekleri)
- kontrol düzlemi yüzeyleri için etkinleştirme ipuçları
- model ailesi sahipliği için kısaltma
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` sunucusunun inceleyebileceği QA çalıştırıcı meta verileri
- katalog ve doğrulama yüzeyleriyle birleştirilen kanala özgü yapılandırma meta verileri

**Şunlar için kullanmayın:** çalışma zamanı davranışı kaydetme, kod giriş noktaları
bildirme veya npm kurulum meta verileri. Bunlar Plugin kodunuza ve `package.json`
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
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| Alan                                 | Gerekli | Tür                              | Ne anlama gelir                                                                                                                                                                                                                                          |
| ------------------------------------ | ------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Evet    | `string`                         | Kurallı Plugin kimliği. Bu, `plugins.entries.<id>` içinde kullanılan kimliktir.                                                                                                                                                                          |
| `configSchema`                       | Evet    | `object`                         | Bu Plugin'in yapılandırması için satır içi JSON Schema.                                                                                                                                                                                                  |
| `enabledByDefault`                   | Hayır   | `true`                           | Paketle gelen bir Plugin'i varsayılan olarak etkin işaretler. Plugin'in varsayılan olarak devre dışı kalması için bunu atlayın veya `true` olmayan herhangi bir değere ayarlayın.                                                                       |
| `legacyPluginIds`                    | Hayır   | `string[]`                       | Bu kurallı Plugin kimliğine normalleştirilen eski kimlikler.                                                                                                                                                                                             |
| `autoEnableWhenConfiguredProviders`  | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları kendilerinden söz ettiğinde bu Plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                                     |
| `kind`                               | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan dışlayıcı bir Plugin türünü bildirir.                                                                                                                                                                            |
| `channels`                           | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                                                         |
| `providers`                          | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu sağlayıcı kimlikleri.                                                                                                                                                                                                         |
| `providerDiscoveryEntry`             | Hayır   | `string`                         | Tam Plugin çalışma zamanını etkinleştirmeden yüklenebilen, manifest kapsamlı sağlayıcı katalog meta verileri için Plugin köküne göre göreli hafif sağlayıcı keşfi modülü yolu.                                                                         |
| `modelSupport`                       | Hayır   | `object`                         | Plugin'i çalışma zamanından önce otomatik yüklemek için kullanılan, manifestin sahip olduğu kısa model ailesi meta verileri.                                                                                                                             |
| `modelCatalog`                       | Hayır   | `object`                         | Bu Plugin'in sahibi olduğu sağlayıcılar için bildirime dayalı model kataloğu meta verileri. Bu, Plugin çalışma zamanını yüklemeden gelecekteki salt okunur listeleme, onboarding, model seçiciler, takma adlar ve bastırma için denetim düzlemi sözleşmesidir. |
| `modelPricing`                       | Hayır   | `object`                         | Sağlayıcının sahibi olduğu harici fiyatlandırma arama ilkesi. Yerel/kendi barındırılan sağlayıcıları uzak fiyatlandırma kataloglarından hariç tutmak veya çekirdekte sağlayıcı kimliklerini sabit kodlamadan sağlayıcı başvurularını OpenRouter/LiteLLM katalog kimliklerine eşlemek için kullanın. |
| `modelIdNormalization`               | Hayır   | `object`                         | Sağlayıcı çalışma zamanı yüklenmeden önce çalışması gereken, sağlayıcının sahibi olduğu model kimliği takma ad/önek temizliği.                                                                                                                           |
| `providerEndpoints`                  | Hayır   | `object[]`                       | Sağlayıcı çalışma zamanı yüklenmeden önce çekirdeğin sınıflandırması gereken sağlayıcı rotaları için manifestin sahip olduğu uç nokta host/baseUrl meta verileri.                                                                                        |
| `providerRequest`                    | Hayır   | `object`                         | Sağlayıcı çalışma zamanı yüklenmeden önce genel istek ilkesi tarafından kullanılan ucuz sağlayıcı ailesi ve istek uyumluluğu meta verileri.                                                                                                              |
| `cliBackends`                        | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu CLI çıkarım arka uç kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                                                                        |
| `syntheticAuthRefs`                  | Hayır   | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında Plugin'in sahibi olduğu sentetik kimlik doğrulama kancasının yoklanması gereken sağlayıcı veya CLI arka uç başvuruları.                                                                     |
| `nonSecretAuthMarkers`               | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketle gelen Plugin'in sahibi olduğu yer tutucu API anahtarı değerleri.                                                                                                      |
| `commandAliases`                     | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce Plugin farkındalıklı yapılandırma ve CLI tanılamaları üretmesi gereken, bu Plugin'in sahibi olduğu komut adları.                                                                                                         |
| `providerAuthEnvVars`                | Hayır   | `Record<string, string[]>`       | Sağlayıcı kimlik doğrulama/durum araması için kullanımdan kaldırılmış uyumluluk ortam meta verileri. Yeni Plugin'ler için `setup.providers[].envVars` tercih edin; OpenClaw bunu kullanımdan kaldırma penceresi boyunca okumaya devam eder.             |
| `providerAuthAliases`                | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı.                                  |
| `channelEnvVars`                     | Hayır   | `Record<string, string[]>`       | OpenClaw'ın Plugin kodunu yüklemeden inceleyebileceği ucuz kanal ortam meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam güdümlü kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın.                    |
| `providerAuthChoices`                | Hayır   | `object[]`                       | Onboarding seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlama için ucuz kimlik doğrulama seçeneği meta verileri.                                                                                                              |
| `activation`                         | Hayır   | `object`                         | Başlangıç, sağlayıcı, komut, kanal, rota ve yetenek tetiklemeli yükleme için ucuz etkinleştirme planlayıcı meta verileri. Yalnızca meta veri; gerçek davranış hâlâ Plugin çalışma zamanına aittir.                                                       |
| `setup`                              | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin Plugin çalışma zamanını yüklemeden inceleyebileceği ucuz kurulum/onboarding tanımlayıcıları.                                                                                                                              |
| `qaRunners`                          | Hayır   | `object[]`                       | Plugin çalışma zamanı yüklenmeden önce paylaşılan `openclaw qa` host'u tarafından kullanılan ucuz QA çalıştırıcı tanımlayıcıları.                                                                                                                       |
| `contracts`                          | Hayır   | `object`                         | Harici kimlik doğrulama kancaları, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü oluşturma, müzik oluşturma, video oluşturma, web getirme, web araması ve araç sahipliği için statik yetenek sahipliği anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için ucuz medya anlama varsayılanları.                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Hayır   | `Record<string, object>`         | Sağlayıcının sahibi olduğu kimlik doğrulama takma adları ve base-url korumaları dahil, `contracts.imageGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için ucuz görüntü oluşturma kimlik doğrulama meta verileri.                         |
| `videoGenerationProviderMetadata`    | Hayır   | `Record<string, object>`         | Sağlayıcının sahibi olduğu kimlik doğrulama takma adları ve base-url korumaları dahil, `contracts.videoGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için ucuz video oluşturma kimlik doğrulama meta verileri.                           |
| `musicGenerationProviderMetadata`    | Hayır   | `Record<string, object>`         | Sağlayıcının sahibi olduğu kimlik doğrulama takma adları ve base-url korumaları dahil, `contracts.musicGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için ucuz müzik oluşturma kimlik doğrulama meta verileri.                           |
| `toolMetadata`                       | Hayır   | `Record<string, object>`         | `contracts.tools` içinde bildirilen, Plugin'in sahibi olduğu araçlar için ucuz kullanılabilirlik meta verileri. Bir aracın yapılandırma, ortam veya kimlik doğrulama kanıtı olmadığı sürece çalışma zamanını yüklememesi gerektiğinde bunu kullanın.    |
| `channelConfigs`                     | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, manifestin sahip olduğu kanal yapılandırma meta verileri.                                                                                                                |
| `skills`                             | Hayır   | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skills dizinleri.                                                                                                                                                                                           |
| `name`                               | Hayır   | `string`                         | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                                                                 |
| `description`                        | Hayır    | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                           |
| `version`                            | Hayır    | `string`                         | Bilgilendirme amaçlı Plugin sürümü.                                                                                                                                                                                                 |
| `uiHints`                            | Hayır    | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                      |

## Üretim sağlayıcısı meta verileri başvurusu

Üretim sağlayıcısı meta verileri alanları, eşleşen `contracts.*GenerationProviders` listesinde bildirilen sağlayıcılar için statik kimlik doğrulama sinyallerini açıklar. OpenClaw, bu alanları sağlayıcı çalışma zamanı yüklenmeden önce okur; böylece çekirdek araçlar, her sağlayıcı plugin'ini içe aktarmadan bir üretim sağlayıcısının kullanılabilir olup olmadığına karar verebilir.

Bu alanları yalnızca düşük maliyetli, bildirime dayalı gerçekler için kullanın. Aktarım, istek dönüşümleri, token yenileme, kimlik bilgisi doğrulama ve gerçek üretim davranışı plugin çalışma zamanında kalır.

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

Her meta verisi girdisi şunları destekler:

| Alan            | Zorunlu | Tür        | Anlamı                                                                                                                                               |
| --------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Hayır    | `string[]` | Üretim sağlayıcısı için statik kimlik doğrulama takma adları olarak sayılması gereken ek sağlayıcı kimlikleri.                                       |
| `authProviders` | Hayır    | `string[]` | Yapılandırılmış kimlik doğrulama profilleri bu üretim sağlayıcısı için kimlik doğrulama olarak sayılması gereken sağlayıcı kimlikleri.               |
| `configSignals` | Hayır    | `object[]` | Kimlik doğrulama profilleri veya ortam değişkenleri olmadan yapılandırılabilen yerel ya da kendinden barındırılan sağlayıcılar için düşük maliyetli, yalnızca yapılandırma temelli kullanılabilirlik sinyalleri. |
| `authSignals`   | Hayır    | `object[]` | Açık kimlik doğrulama sinyalleri. Varsa, sağlayıcı kimliğinden, `aliases` ve `authProviders` alanlarından gelen varsayılan sinyal kümesinin yerine geçer. |

Her `configSignals` girdisi şunları destekler:

| Alan          | Zorunlu | Tür        | Anlamı                                                                                                                                                                    |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Evet     | `string`   | İncelenecek plugin'e ait yapılandırma nesnesine noktalı yol, örneğin `plugins.entries.example.config`.                                                                    |
| `overlayPath` | Hayır    | `string`   | Sinyal değerlendirilmeden önce nesnesi kök nesnenin üzerine uygulanacak kök yapılandırma içindeki noktalı yol. Bunu `image`, `video` veya `music` gibi yeteneğe özgü yapılandırma için kullanın. |
| `required`    | Hayır    | `string[]` | Etkin yapılandırma içinde yapılandırılmış değerlere sahip olması gereken noktalı yollar. Dizeler boş olmamalıdır; nesneler ve diziler boş olmamalıdır.                    |
| `requiredAny` | Hayır    | `string[]` | Etkin yapılandırma içinde en az birinin yapılandırılmış değere sahip olması gereken noktalı yollar.                                                                        |
| `mode`        | Hayır    | `object`   | Etkin yapılandırma içinde isteğe bağlı dize mod koruması. Bunu yalnızca yapılandırma temelli kullanılabilirlik tek bir moda uygulandığında kullanın.                      |

Her `mode` koruması şunları destekler:

| Alan         | Zorunlu | Tür        | Anlamı                                                                                     |
| ------------ | -------- | ---------- | ------------------------------------------------------------------------------------------ |
| `path`       | Hayır    | `string`   | Etkin yapılandırma içindeki noktalı yol. Varsayılan değer `mode` olur.                     |
| `default`    | Hayır    | `string`   | Yapılandırma yolu atladığında kullanılacak mod değeri.                                     |
| `allowed`    | Hayır    | `string[]` | Varsa, sinyal yalnızca etkin mod bu değerlerden biri olduğunda başarılı olur.              |
| `disallowed` | Hayır    | `string[]` | Varsa, etkin mod bu değerlerden biri olduğunda sinyal başarısız olur.                     |

Her `authSignals` girdisi şunları destekler:

| Alan              | Zorunlu | Tür      | Anlamı                                                                                                                                         |
| ----------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet     | `string` | Yapılandırılmış kimlik doğrulama profillerinde denetlenecek sağlayıcı kimliği.                                                                 |
| `providerBaseUrl` | Hayır    | `object` | Sinyalin yalnızca başvurulan yapılandırılmış sağlayıcı izin verilen bir temel URL kullandığında sayılmasını sağlayan isteğe bağlı koruma. Bunu bir kimlik doğrulama takma adı yalnızca belirli API'ler için geçerli olduğunda kullanın. |

Her `providerBaseUrl` koruması şunları destekler:

| Alan              | Zorunlu | Tür        | Anlamı                                                                                                                                                         |
| ----------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet     | `string`   | `baseUrl` değeri denetlenecek sağlayıcı yapılandırma kimliği.                                                                                                  |
| `defaultBaseUrl`  | Hayır    | `string`   | Sağlayıcı yapılandırması `baseUrl` değerini atladığında varsayılacak temel URL.                                                                                |
| `allowedBaseUrls` | Evet     | `string[]` | Bu kimlik doğrulama sinyali için izin verilen temel URL'ler. Yapılandırılmış veya varsayılan temel URL bu normalleştirilmiş değerlerden biriyle eşleşmediğinde sinyal yok sayılır. |

## Araç meta verileri başvurusu

`toolMetadata`, araç adına göre anahtarlanmış şekilde üretim sağlayıcısı meta verileriyle aynı `configSignals` ve `authSignals` biçimlerini kullanır. `contracts.tools` sahipliği bildirir. `toolMetadata`, OpenClaw'ın yalnızca aracın fabrika işlevinin `null` döndürmesini sağlamak için bir plugin çalışma zamanını içe aktarmaktan kaçınabilmesi adına düşük maliyetli kullanılabilirlik kanıtı bildirir.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
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

Bir aracın `toolMetadata` değeri yoksa OpenClaw mevcut davranışı korur ve araç sözleşmesi ilkeyle eşleştiğinde sahibi olan plugin'i yükler. Fabrika işlevi kimlik doğrulama/yapılandırmaya bağlı olan sık kullanılan yol araçları için plugin yazarları, çekirdeğin sormak amacıyla çalışma zamanını içe aktarmasını sağlamak yerine `toolMetadata` bildirmelidir.

## providerAuthChoices başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçeneğini açıklar. OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur. Sağlayıcı kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden bu manifest seçeneklerini, tanımlayıcıdan türetilen kurulum seçeneklerini ve kurulum kataloğu meta verilerini kullanır.

| Alan                  | Zorunlu | Tür                                             | Anlamı                                                                                                                |
| --------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet     | `string`                                        | Bu seçeneğin ait olduğu sağlayıcı kimliği.                                                                            |
| `method`              | Evet     | `string`                                        | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                                     |
| `choiceId`            | Evet     | `string`                                        | Onboarding ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçeneği kimliği.                           |
| `choiceLabel`         | Hayır    | `string`                                        | Kullanıcıya gösterilen etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                                     |
| `choiceHint`          | Hayır    | `string`                                        | Seçici için kısa yardımcı metin.                                                                                      |
| `assistantPriority`   | Hayır    | `number`                                        | Daha düşük değerler, asistan tarafından yönlendirilen etkileşimli seçicilerde daha önce sıralanır.                    |
| `assistantVisibility` | Hayır    | `"visible"` \| `"manual-only"`                  | Manuel CLI seçimine hâlâ izin verirken seçeneği asistan seçicilerinden gizler.                                        |
| `deprecatedChoiceIds` | Hayır    | `string[]`                                      | Kullanıcıları bu yedek seçeneğe yönlendirmesi gereken eski seçenek kimlikleri.                                        |
| `groupId`             | Hayır    | `string`                                        | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                                          |
| `groupLabel`          | Hayır    | `string`                                        | Bu grup için kullanıcıya gösterilen etiket.                                                                           |
| `groupHint`           | Hayır    | `string`                                        | Grup için kısa yardımcı metin.                                                                                        |
| `optionKey`           | Hayır    | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için dahili seçenek anahtarı.                                            |
| `cliFlag`             | Hayır    | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                                           |
| `cliOption`           | Hayır    | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                                            |
| `cliDescription`      | Hayır    | `string`                                        | CLI yardımında kullanılan açıklama.                                                                                   |
| `onboardingScopes`    | Hayır    | `Array<"text-inference" \| "image-generation">` | Bu seçeneğin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan olarak `["text-inference"]` olur. |

## commandAliases başvurusu

Use `commandAliases` when a Plugin owns a runtime command name that users may
mistakenly put in `plugins.allow` or try to run as a root CLI command. OpenClaw
uses this metadata for diagnostics without importing Plugin runtime code.

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

| Alan         | Gerekli | Tür               | Ne anlama gelir                                                               |
| ------------ | ------- | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu Plugin'e ait komut adı.                                                    |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı kök CLI komutu yerine sohbet slash komutu olarak işaretler.         |
| `cliCommand` | Hayır   | `string`          | Varsa CLI işlemleri için önerilecek ilişkili kök CLI komutu.                  |

## activation referansı

Plugin, hangi kontrol düzlemi olaylarının onu bir etkinleştirme/yükleme planına
dahil etmesi gerektiğini düşük maliyetle bildirebildiğinde `activation` kullanın.

Bu blok bir planlayıcı metadata'sıdır, yaşam döngüsü API'si değildir. Runtime
davranışı kaydetmez, `register(...)` yerine geçmez ve Plugin kodunun zaten
çalıştığını vaat etmez. Etkinleştirme planlayıcısı, mevcut manifest sahipliği
metadata'sına geri dönmeden önce aday Plugin'leri daraltmak için bu alanları
kullanır; örneğin `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` ve hook'lar.

Sahipliği zaten açıklayan en dar metadata'yı tercih edin. İlişkiyi bu alanlar
ifade ettiğinde `providers`, `channels`, `commandAliases`, setup tanımlayıcıları
veya `contracts` kullanın. Bu sahiplik alanlarıyla temsil edilemeyen ek
planlayıcı ipuçları için `activation` kullanın.
`claude-cli`, `codex-cli` veya `google-gemini-cli` gibi CLI runtime takma adları
için üst düzey `cliBackends` kullanın; `activation.onAgentHarnesses` yalnızca
zaten bir sahiplik alanı olmayan gömülü ajan harness kimlikleri içindir.

Bu blok yalnızca metadata'dır. Runtime davranışı kaydetmez ve `register(...)`,
`setupEntry` veya diğer runtime/Plugin giriş noktalarının yerine geçmez.
Mevcut tüketiciler bunu daha geniş Plugin yüklemesinden önce bir daraltma ipucu
olarak kullanır; bu nedenle başlangıç dışı etkinleştirme metadata'sının eksik
olması genellikle yalnızca performans maliyeti doğurur; manifest sahipliği geri
dönüşleri hâlâ mevcutken doğruluğu değiştirmemelidir.

Her Plugin `activation.onStartup` değerini bilinçli olarak ayarlamalıdır. Yalnızca
Plugin'in Gateway başlangıcı sırasında çalışması gerekiyorsa `true` olarak
ayarlayın. Plugin başlangıçta etkisizse ve yalnızca daha dar tetikleyicilerden
yüklenmeliyse `false` olarak ayarlayın. `onStartup` öğesini atlamak artık Plugin'i
örtük olarak başlangıçta yüklemez; başlangıç, kanal, yapılandırma, ajan harness,
bellek veya diğer daha dar etkinleştirme tetikleyicileri için açık
etkinleştirme metadata'sı kullanın.

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

| Alan               | Gerekli | Tür                                                  | Ne anlama gelir                                                                                                                                                                                              |
| ------------------ | ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Hayır   | `boolean`                                            | Açık Gateway başlangıç etkinleştirmesi. Her Plugin bunu ayarlamalıdır. `true` başlangıç sırasında Plugin'i içe aktarır; `false`, eşleşen başka bir tetikleyici yüklemeyi gerektirmedikçe başlangıçta tembel tutar. |
| `onProviders`      | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                                                                                                                      |
| `onAgentHarnesses` | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken gömülü ajan harness runtime kimlikleri. CLI backend takma adları için üst düzey `cliBackends` kullanın.                                    |
| `onCommands`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                                                                                                                          |
| `onChannels`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                                                                                                                          |
| `onRoutes`         | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                                                                                                                              |
| `onConfigPaths`    | Hayır   | `string[]`                                           | Yol mevcut olduğunda ve açıkça devre dışı bırakılmadığında bu Plugin'i başlangıç/yükleme planlarına dahil etmesi gereken köke göreli yapılandırma yolları.                                                   |
| `onCapabilities`   | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlaması tarafından kullanılan geniş yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin.                                                                        |

Mevcut canlı tüketiciler:

- Gateway başlangıç planlaması, açık başlangıç içe aktarması için
  `activation.onStartup` kullanır
- komut tetiklemeli CLI planlaması, eski
  `commandAliases[].cliCommand` veya `commandAliases[].name` değerlerine geri döner
- ajan runtime başlangıç planlaması, gömülü harness'ler için
  `activation.onAgentHarnesses` ve CLI runtime takma adları için üst düzey
  `cliBackends[]` kullanır
- kanal tetiklemeli setup/kanal planlaması, açık kanal etkinleştirme
  metadata'sı eksik olduğunda eski `channels[]` sahipliğine geri döner
- başlangıç Plugin planlaması, paketlenmiş tarayıcı Plugin'inin `browser` bloğu
  gibi kanal dışı kök yapılandırma yüzeyleri için `activation.onConfigPaths`
  kullanır
- sağlayıcı tetiklemeli setup/runtime planlaması, açık sağlayıcı
  etkinleştirme metadata'sı eksik olduğunda eski `providers[]` ve üst düzey
  `cliBackends[]` sahipliğine geri döner

Planlayıcı tanıları, açık etkinleştirme ipuçlarını manifest sahipliği geri
dönüşünden ayırt edebilir. Örneğin, `activation-command-hint`
`activation.onCommands` öğesinin eşleştiği anlamına gelirken,
`manifest-command-alias` planlayıcının bunun yerine `commandAliases` sahipliğini
kullandığı anlamına gelir. Bu neden etiketleri host tanıları ve testler içindir;
Plugin yazarları sahipliği en iyi açıklayan metadata'yı bildirmeye devam
etmelidir.

## qaRunners referansı

Bir Plugin paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma
runner'ı sağladığında `qaRunners` kullanın. Bu metadata'yı düşük maliyetli ve
statik tutun; gerçek CLI kaydının sahibi hâlâ `qaRunnerCliRegistrations` dışa
aktaran hafif bir `runtime-api.ts` yüzeyi üzerinden Plugin runtime'ıdır.

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

| Alan          | Gerekli | Tür      | Ne anlama gelir                                                                    |
| ------------- | ------- | -------- | ---------------------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altına bağlanan alt komut, örneğin `matrix`.                         |
| `description` | Hayır   | `string` | Paylaşılan host bir stub komutuna ihtiyaç duyduğunda kullanılan yedek yardım metni. |

## setup referansı

Setup ve onboarding yüzeyleri runtime yüklenmeden önce düşük maliyetli,
Plugin'e ait metadata'ya ihtiyaç duyduğunda `setup` kullanın.

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

Üst düzey `cliBackends` geçerli kalır ve CLI çıkarım backend'lerini açıklamaya
devam eder. `setup.cliBackends`, metadata-only kalması gereken kontrol
düzlemi/setup akışları için setup'a özel tanımlayıcı yüzeydir.

Mevcut olduğunda, `setup.providers` ve `setup.cliBackends`, setup keşfi için
tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday
Plugin'i daraltıyorsa ve setup hâlâ daha zengin setup zamanı runtime hook'larına
ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak
`setup-api` öğesini yerinde tutun.

OpenClaw ayrıca genel sağlayıcı kimlik doğrulaması ve env var aramalarına
`setup.providers[].envVars` öğesini dahil eder. `providerAuthEnvVars`, kullanımdan
kaldırma penceresi boyunca bir uyumluluk adapter'ı üzerinden desteklenmeye devam
eder, ancak bunu hâlâ kullanan paketlenmemiş Plugin'ler bir manifest tanısı alır.
Yeni Plugin'ler setup/durum env metadata'sını `setup.providers[].envVars` üzerine
koymalıdır.

OpenClaw, setup girdisi mevcut olmadığında veya `setup.requiresRuntime: false`
setup runtime'ının gereksiz olduğunu bildirdiğinde, `setup.providers[].authMethods`
değerlerinden basit setup seçenekleri de türetebilir. Açık `providerAuthChoices`
girdileri özel etiketler, CLI flag'leri, onboarding kapsamı ve asistan
metadata'sı için tercih edilmeye devam eder.

`requiresRuntime: false` yalnızca bu tanımlayıcılar setup yüzeyi için yeterli
olduğunda ayarlayın. OpenClaw açık `false` değerini descriptor-only sözleşme
olarak ele alır ve setup araması için `setup-api` veya `openclaw.setupEntry`
çalıştırmaz. Descriptor-only bir Plugin hâlâ bu setup runtime girdilerinden
birini gönderiyorsa, OpenClaw ek bir tanı raporlar ve onu yok saymaya devam eder.
Atlanan `requiresRuntime`, descriptor'ları flag olmadan eklemiş mevcut
Plugin'lerin bozulmaması için eski geri dönüş davranışını korur.

Setup araması Plugin'e ait `setup-api` kodunu çalıştırabildiği için normalize
edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri, keşfedilen
Plugin'ler arasında benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından
bir kazanan seçmek yerine kapalı başarısız olur.

Setup runtime çalıştığında, setup registry tanıları, `setup-api` manifest
tanımlayıcılarının bildirmediği bir sağlayıcı veya CLI backend kaydederse ya da
bir tanımlayıcının eşleşen runtime kaydı yoksa tanımlayıcı kayması raporlar. Bu
tanılar eklemelidir ve eski Plugin'leri reddetmez.

### setup.providers referansı

| Alan           | Gerekli | Tür        | Ne anlama gelir                                                                                         |
| -------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `id`           | Evet    | `string`   | Setup veya onboarding sırasında gösterilen sağlayıcı kimliği. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods`  | Hayır   | `string[]` | Bu sağlayıcının tam runtime yüklemeden desteklediği setup/kimlik doğrulama yöntemi kimlikleri.          |
| `envVars`      | Hayır   | `string[]` | Genel setup/durum yüzeylerinin Plugin runtime yüklenmeden önce denetleyebileceği env var'lar.           |
| `authEvidence` | Hayır   | `object[]` | Gizli olmayan işaretçiler aracılığıyla kimlik doğrulayabilen sağlayıcılar için düşük maliyetli yerel kimlik doğrulama kanıtı denetimleri. |

`authEvidence`, runtime kodu yüklenmeden doğrulanabilen sağlayıcıya ait yerel kimlik bilgisi işaretçileri içindir. Bu kontroller ucuz ve yerel kalmalıdır: ağ çağrısı yok, keychain veya secret-manager okuması yok, shell komutu yok ve sağlayıcı API yoklaması yok.

Desteklenen kanıt girdileri:

| Alan               | Gerekli | Tür        | Ne anlama gelir                                                                                                  |
| ------------------ | ------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `type`             | Evet    | `string`   | Şu anda `local-file-with-env`.                                                                                  |
| `fileEnvVar`       | Hayır   | `string`   | Açık bir kimlik bilgisi dosya yolu içeren env var.                                                              |
| `fallbackPaths`    | Hayır   | `string[]` | `fileEnvVar` yoksa veya boşsa kontrol edilen yerel kimlik bilgisi dosya yolları. `${HOME}` ve `${APPDATA}` desteklenir. |
| `requiresAnyEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen env var'lardan en az biri boş olmamalıdır.                                |
| `requiresAllEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen her env var boş olmamalıdır.                                               |
| `credentialMarker` | Evet    | `string`   | Kanıt mevcut olduğunda döndürülen gizli olmayan işaretçi.                                                       |
| `source`           | Hayır   | `string`   | Kimlik doğrulama/durum çıktısı için kullanıcıya gösterilen kaynak etiketi.                                      |

### kurulum alanları

| Alan               | Gerekli | Tür        | Ne anlama gelir                                                                                       |
| ------------------ | ------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve onboarding sırasında gösterilen sağlayıcı kurulum tanımlayıcıları.                         |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kurulum zamanı backend id'leri. Normalize edilmiş id'leri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin'in kurulum yüzeyine ait config migration id'leri.                                           |
| `requiresRuntime`  | Hayır   | `boolean`  | Kurulumun tanımlayıcı aramasından sonra hala `setup-api` yürütmesine ihtiyaç duyup duymadığı.        |

## uiHints referansı

`uiHints`, config alan adlarından küçük render ipuçlarına eşlenen bir haritadır.

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
| `label`       | `string`   | Kullanıcıya gösterilen alan etiketi.      |
| `help`        | `string`   | Kısa yardımcı metin.                      |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.               |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.          |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girdileri için yer tutucu metin.     |

## contracts referansı

`contracts` öğesini yalnızca OpenClaw'ın Plugin runtime'ını içe aktarmadan okuyabileceği statik capability ownership metadata için kullanın.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Her liste isteğe bağlıdır:

| Alan                             | Tür        | Ne anlama gelir                                                         |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory id'leri, şu anda `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Paketli bir Plugin'in tool-result middleware kaydedebileceği runtime id'leri. |
| `externalAuthProviders`          | `string[]` | Bu Plugin'in sahip olduğu external auth profile hook'una ait sağlayıcı id'leri. |
| `speechProviders`                | `string[]` | Bu Plugin'in sahip olduğu konuşma sağlayıcısı id'leri.                  |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin'in sahip olduğu realtime-transcription sağlayıcı id'leri.     |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin'in sahip olduğu realtime-voice sağlayıcı id'leri.             |
| `memoryEmbeddingProviders`       | `string[]` | Bu Plugin'in sahip olduğu memory embedding sağlayıcı id'leri.           |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin'in sahip olduğu media-understanding sağlayıcı id'leri.        |
| `imageGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu image-generation sağlayıcı id'leri.           |
| `videoGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu video-generation sağlayıcı id'leri.           |
| `webFetchProviders`              | `string[]` | Bu Plugin'in sahip olduğu Web-fetch sağlayıcı id'leri.                  |
| `webSearchProviders`             | `string[]` | Bu Plugin'in sahip olduğu Web-search sağlayıcı id'leri.                 |
| `migrationProviders`             | `string[]` | Bu Plugin'in `openclaw migrate` için sahip olduğu import provider id'leri. |
| `tools`                          | `string[]` | Bu Plugin'in sahip olduğu agent tool adları.                            |

`contracts.embeddedExtensionFactories`, paketli Codex app-server-only extension factory'leri için korunur. Paketli tool-result dönüşümleri bunun yerine `contracts.agentToolResultMiddleware` bildirmeli ve `api.registerAgentToolResultMiddleware(...)` ile kaydolmalıdır. Harici Plugin'ler tool-result middleware kaydedemez, çünkü bu seam model görmeden önce yüksek güvenilirlikli araç çıktısını yeniden yazabilir.

Runtime `api.registerTool(...)` kayıtları `contracts.tools` ile eşleşmelidir. Araç keşfi, istenen araçların sahibi olabilecek yalnızca Plugin runtime'larını yüklemek için bu listeyi kullanır.

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'leri `contracts.externalAuthProviders` bildirmelidir. Bildirimi olmayan Plugin'ler hala kullanımdan kaldırılmış bir uyumluluk fallback'i üzerinden çalışır, ancak bu fallback daha yavaştır ve migration penceresinden sonra kaldırılacaktır.

Paketli memory embedding sağlayıcıları, `local` gibi yerleşik adaptörler dahil olmak üzere sundukları her adaptör id'si için `contracts.memoryEmbeddingProviders` bildirmelidir. Bağımsız CLI yolları, tam Gateway runtime sağlayıcıları kaydetmeden önce yalnızca sahibi olan Plugin'i yüklemek için bu manifest sözleşmesini kullanır.

## mediaUnderstandingProviderMetadata referansı

Bir media-understanding sağlayıcısının runtime yüklenmeden önce generic core yardımcılarının ihtiyaç duyduğu varsayılan modelleri, auto-auth fallback önceliği veya native document desteği varsa `mediaUnderstandingProviderMetadata` kullanın. Anahtarlar `contracts.mediaUnderstandingProviders` içinde de bildirilmelidir.

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

| Alan                   | Tür                                 | Ne anlama gelir                                                              |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Bu sağlayıcı tarafından sunulan medya capabilities.                          |
| `defaultModels`        | `Record<string, string>`            | Config bir model belirtmediğinde kullanılan capability-to-model varsayılanları. |
| `autoPriority`         | `Record<string, number>`            | Otomatik kimlik bilgisi tabanlı sağlayıcı fallback'i için daha düşük sayılar daha önce sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Sağlayıcı tarafından desteklenen native document girdileri.                  |

## channelConfigs referansı

Bir kanal Plugin'i runtime yüklenmeden önce ucuz config metadata'ya ihtiyaç duyduğunda `channelConfigs` kullanın. Salt okunur kanal kurulumu/durum keşfi, setup girdisi bulunmadığında veya `setup.requiresRuntime: false` setup runtime'ının gereksiz olduğunu bildirdiğinde yapılandırılmış harici kanallar için bu metadata'yı doğrudan kullanabilir.

`channelConfigs`, Plugin manifest metadata'sıdır; yeni bir üst düzey kullanıcı config bölümü değildir. Kullanıcılar kanal örneklerini hala `channels.<channel-id>` altında yapılandırır. OpenClaw, Plugin runtime kodu çalışmadan önce hangi Plugin'in yapılandırılmış kanalın sahibi olduğunu belirlemek için manifest metadata'sını okur.

Bir kanal Plugin'i için `configSchema` ve `channelConfigs` farklı yolları açıklar:

- `configSchema`, `plugins.entries.<plugin-id>.config` öğesini doğrular
- `channelConfigs.<channel-id>.schema`, `channels.<channel-id>` öğesini doğrular

`channels[]` bildiren paket dışı Plugin'ler eşleşen `channelConfigs` girdilerini de bildirmelidir. Bunlar olmadan OpenClaw Plugin'i yine de yükleyebilir, ancak cold-path config schema, setup ve Control UI yüzeyleri Plugin runtime çalışana kadar kanalın sahip olduğu seçenek yapısını bilemez.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` ve `nativeSkillsAutoEnabled`, kanal runtime yüklenmeden önce çalışan komut config kontrolleri için statik `auto` varsayılanları bildirebilir. Paketli kanallar aynı varsayılanları, diğer package-owned channel catalog metadata'larıyla birlikte `package.json#openclaw.channel.commands` üzerinden de yayımlayabilir.

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

| Alan          | Tür                      | Ne anlama gelir                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Schema. Bildirilen her kanal yapılandırma girdisi için gereklidir.     |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucuları/hassas ipuçları.     |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeyleriyle birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                        |
| `commands`    | `object`                 | Çalışma zamanı öncesi yapılandırma kontrolleri için statik yerel komut ve yerel skill otomatik varsayılanları. |
| `preferOver`  | `string[]`               | Seçim yüzeylerinde bu kanalın geride bırakması gereken eski veya daha düşük öncelikli Plugin kimlikleri. |

### Başka bir kanal Plugin'ini değiştirme

Plugin'iniz, başka bir Plugin'in de sağlayabildiği bir kanal kimliği için
tercih edilen sahip olduğunda `preferOver` kullanın. Yaygın durumlar yeniden
adlandırılmış bir Plugin kimliği, paketli bir Plugin'in yerine geçen bağımsız
bir Plugin veya yapılandırma uyumluluğu için aynı kanal kimliğini koruyan bakımı
sürdürülen bir fork'tur.

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
paketli olduğu veya varsayılan olarak etkinleştirildiği için seçildiyse,
OpenClaw etkin çalışma zamanı yapılandırmasında onu devre dışı bırakır; böylece
kanalın ve araçlarının sahibi tek bir Plugin olur. Açık kullanıcı seçimi yine de
üstün gelir: kullanıcı iki Plugin'i de açıkça etkinleştirirse OpenClaw bu seçimi
korur ve istenen Plugin kümesini sessizce değiştirmek yerine yinelenen
kanal/araç tanılarını bildirir.

`preferOver` kapsamını gerçekten aynı kanalı sağlayabilen Plugin kimlikleriyle
sınırlı tutun. Bu genel bir öncelik alanı değildir ve kullanıcı yapılandırma
anahtarlarını yeniden adlandırmaz.

## modelSupport başvurusu

OpenClaw'ın, Plugin çalışma zamanı yüklenmeden önce `gpt-5.5` veya
`claude-sonnet-4.6` gibi kısaltılmış model kimliklerinden sağlayıcı
Plugin'inizi çıkarması gerektiğinde `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu önceliği uygular:

- açık `provider/model` başvuruları sahip olan `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes` üzerinde üstün gelir
- paketli olmayan bir Plugin ile paketli bir Plugin ikisi de eşleşirse paketli olmayan Plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Ne anlama gelir                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısaltılmış model kimliklerine karşı `startsWith` ile eşleştirilen önekler.      |
| `modelPatterns` | `string[]` | Profil soneki kaldırıldıktan sonra kısaltılmış model kimliklerine karşı eşleştirilen regex kaynakları. |

## modelCatalog başvurusu

OpenClaw'ın, Plugin çalışma zamanını yüklemeden önce sağlayıcı model meta
verilerini bilmesi gerektiğinde `modelCatalog` kullanın. Bu, sabit katalog
satırları, sağlayıcı takma adları, bastırma kuralları ve keşif modu için
manifest'in sahip olduğu kaynaktır. Çalışma zamanı yenilemesi hâlâ sağlayıcı
çalışma zamanı koduna aittir, ancak manifest çekirdeğe çalışma zamanının ne
zaman gerekli olduğunu söyler.

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

| Alan           | Tür                                                      | Ne anlama gelir                                                                                                    |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | Bu Plugin'in sahip olduğu sağlayıcı kimlikleri için katalog satırları. Anahtarlar üst düzey `providers` içinde de görünmelidir. |
| `aliases`      | `Record<string, object>`                                 | Katalog veya bastırma planlaması için sahip olunan bir sağlayıcıya çözümlenmesi gereken sağlayıcı takma adları.     |
| `suppressions` | `object[]`                                               | Bu Plugin'in, sağlayıcıya özgü bir nedenle başka bir kaynaktan bastırdığı model satırları.                          |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Sağlayıcı kataloğunun manifest meta verilerinden okunup okunamayacağı, önbelleğe yenilenip yenilenemeyeceği veya çalışma zamanı gerektirip gerektirmediği. |

`aliases`, model kataloğu planlaması için sağlayıcı sahipliği aramasına katılır.
Takma ad hedefleri, aynı Plugin'in sahip olduğu üst düzey sağlayıcılar olmalıdır.
Sağlayıcı filtreli bir liste takma ad kullandığında OpenClaw sahip manifest'i
okuyabilir ve sağlayıcı çalışma zamanını yüklemeden takma ad API/temel URL
geçersiz kılmalarını uygulayabilir.
Takma adlar filtrelenmemiş katalog listelerini genişletmez; geniş listeler
yalnızca sahip olan kanonik sağlayıcı satırlarını yayar.

`suppressions`, eski sağlayıcı çalışma zamanı `suppressBuiltInModel` hook'unun
yerini alır. Bastırma girdileri yalnızca sağlayıcı Plugin'e ait olduğunda veya
sahip olunan bir sağlayıcıyı hedefleyen `modelCatalog.aliases` anahtarı olarak
bildirildiğinde dikkate alınır. Çalışma zamanı bastırma hook'ları model çözümü
sırasında artık çağrılmaz.

Sağlayıcı alanları:

| Alan      | Tür                      | Ne anlama gelir                                                               |
| --------- | ------------------------ | ----------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan temel URL.   |
| `api`     | `ModelApi`               | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan API adaptörü. |
| `headers` | `Record<string, string>` | Bu sağlayıcı kataloğuna uygulanan isteğe bağlı statik header'lar.             |
| `models`  | `object[]`               | Gerekli model satırları. `id` olmayan satırlar yok sayılır.                   |

Model alanları:

| Alan            | Tür                                                            | Ne anlama gelir                                                                 |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` öneki olmadan, sağlayıcıya yerel model kimliği.                     |
| `name`          | `string`                                                       | İsteğe bağlı görünen ad.                                                        |
| `api`           | `ModelApi`                                                     | İsteğe bağlı model başına API geçersiz kılması.                                 |
| `baseUrl`       | `string`                                                       | İsteğe bağlı model başına temel URL geçersiz kılması.                           |
| `headers`       | `Record<string, string>`                                       | İsteğe bağlı model başına statik header'lar.                                    |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modelin kabul ettiği modaliteler.                                               |
| `reasoning`     | `boolean`                                                      | Modelin akıl yürütme davranışı sunup sunmadığı.                                 |
| `contextWindow` | `number`                                                       | Yerel sağlayıcı bağlam penceresi.                                               |
| `contextTokens` | `number`                                                       | `contextWindow` değerinden farklı olduğunda isteğe bağlı etkin çalışma zamanı bağlam sınırı. |
| `maxTokens`     | `number`                                                       | Bilindiğinde maksimum çıktı token'ları.                                         |
| `cost`          | `object`                                                       | İsteğe bağlı `tieredPricing` dahil, milyon token başına isteğe bağlı USD fiyatlandırması. |
| `compat`        | `object`                                                       | OpenClaw model yapılandırma uyumluluğuyla eşleşen isteğe bağlı uyumluluk bayrakları. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listeleme durumu. Yalnızca satır hiç görünmemeliyse bastırın.                   |
| `statusReason`  | `string`                                                       | Kullanılabilir olmayan durumla gösterilen isteğe bağlı neden.                   |
| `replaces`      | `string[]`                                                     | Bu modelin yerine geçtiği eski sağlayıcıya yerel model kimlikleri.              |
| `replacedBy`    | `string`                                                       | Kullanımdan kaldırılmış satırlar için yerine geçen sağlayıcıya yerel model kimliği. |
| `tags`          | `string[]`                                                     | Seçiciler ve filtreler tarafından kullanılan kararlı etiketler.                 |

Bastırma alanları:

| Alan                       | Tür        | Ne anlama gelir                                                                                              |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | Bastırılacak upstream satırın sağlayıcı kimliği. Bu Plugin'e ait olmalı veya sahip olunan bir takma ad olarak bildirilmelidir. |
| `model`                    | `string`   | Bastırılacak sağlayıcıya yerel model kimliği.                                                                 |
| `reason`                   | `string`   | Bastırılan satır doğrudan istendiğinde gösterilen isteğe bağlı mesaj.                                         |
| `when.baseUrlHosts`        | `string[]` | Bastırma uygulanmadan önce gerekli olan etkin sağlayıcı temel URL host'larının isteğe bağlı listesi.          |
| `when.providerConfigApiIn` | `string[]` | Bastırma uygulanmadan önce gerekli olan tam sağlayıcı yapılandırması `api` değerlerinin isteğe bağlı listesi. |

Çalışma zamanıyla sınırlı verileri `modelCatalog` içine koymayın. `static` değerini yalnızca manifest
satırları sağlayıcıya göre filtrelenmiş liste ve seçici yüzeylerinin
registry/çalışma zamanı keşfini atlamasına yetecek kadar eksiksiz olduğunda kullanın.
Manifest satırları listelenebilir tohumlar veya tamamlayıcılar olarak işe yarıyor ancak
yenileme/önbellek daha sonra daha fazla satır ekleyebiliyorsa `refreshable` kullanın;
yenilenebilir satırlar tek başına yetkili değildir. OpenClaw listeyi bilmek için
sağlayıcı çalışma zamanını yüklemek zorundaysa `runtime` kullanın.

## modelIdNormalization referansı

Sağlayıcı çalışma zamanı yüklenmeden önce gerçekleşmesi gereken düşük maliyetli,
sağlayıcıya ait model kimliği temizliği için `modelIdNormalization` kullanın. Bu,
kısa model adları, sağlayıcıya özgü eski kimlikler ve proxy önek kuralları gibi
takma adları çekirdek model seçimi tabloları yerine sahip Plugin manifestinde tutar.

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

| Alan                                 | Tür                     | Anlamı                                                                                    |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Büyük/küçük harfe duyarsız tam model kimliği takma adları. Değerler yazıldığı gibi döndürülür. |
| `stripPrefixes`                      | `string[]`              | Takma ad aramasından önce kaldırılacak önekler; eski sağlayıcı/model yinelemeleri için kullanışlıdır. |
| `prefixWhenBare`                     | `string`                | Normalleştirilmiş model kimliği zaten `/` içermiyorsa eklenecek önek.                     |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Takma ad aramasından sonra, `modelPrefix` ve `prefix` ile anahtarlanan koşullu yalın kimlik önek kuralları. |

## providerEndpoints referansı

Sağlayıcı çalışma zamanı yüklenmeden önce genel istek politikasının bilmesi
gereken uç nokta sınıflandırması için `providerEndpoints` kullanın. Her
`endpointClass` değerinin anlamı hâlâ çekirdeğe aittir; host ve temel URL
metadata’sı Plugin manifestlerine aittir.

Uç nokta alanları:

| Alan                           | Tür        | Anlamı                                                                                       |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`, `moonshot-native` veya `google-vertex` gibi bilinen çekirdek uç nokta sınıfı.  |
| `hosts`                        | `string[]` | Uç nokta sınıfına eşlenen tam host adları.                                                    |
| `hostSuffixes`                 | `string[]` | Uç nokta sınıfına eşlenen host sonekleri. Yalnızca alan adı soneki eşleşmesi için başına `.` ekleyin. |
| `baseUrls`                     | `string[]` | Uç nokta sınıfına eşlenen tam normalleştirilmiş HTTP(S) temel URL’leri.                      |
| `googleVertexRegion`           | `string`   | Tam global hostlar için statik Google Vertex bölgesi.                                        |
| `googleVertexRegionHostSuffix` | `string`   | Google Vertex bölge önekini ortaya çıkarmak için eşleşen hostlardan çıkarılacak sonek.       |

## providerRequest referansı

Sağlayıcı çalışma zamanını yüklemeden genel istek politikasının ihtiyaç duyduğu
düşük maliyetli istek uyumluluğu metadata’sı için `providerRequest` kullanın.
Davranışa özgü yük yeniden yazımını sağlayıcı çalışma zamanı hook’larında veya
paylaşılan sağlayıcı ailesi yardımcılarında tutun.

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

| Alan                  | Tür          | Anlamı                                                                                 |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Genel istek uyumluluğu kararları ve tanılama için kullanılan sağlayıcı ailesi etiketi. |
| `compatibilityFamily` | `"moonshot"` | Paylaşılan istek yardımcıları için isteğe bağlı sağlayıcı ailesi uyumluluk kümesi.     |
| `openAICompletions`   | `object`     | OpenAI uyumlu tamamlama isteği bayrakları; şu anda `supportsStreamingUsage`.           |

## modelPricing referansı

Bir sağlayıcı çalışma zamanı yüklenmeden önce kontrol düzlemi fiyatlandırma
davranışına ihtiyaç duyduğunda `modelPricing` kullanın. Gateway fiyatlandırma
önbelleği, sağlayıcı çalışma zamanı kodunu içe aktarmadan bu metadata’yı okur.

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

| Alan         | Tür               | Anlamı                                                                                         |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter veya LiteLLM fiyatlandırmasını asla getirmemesi gereken yerel/kendi barındırılan sağlayıcılar için `false` ayarlayın. |
| `openRouter` | `false \| object` | OpenRouter fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için OpenRouter aramasını devre dışı bırakır. |
| `liteLLM`    | `false \| object` | LiteLLM fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için LiteLLM aramasını devre dışı bırakır. |

Kaynak alanları:

| Alan                       | Tür                | Anlamı                                                                                                              |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw sağlayıcı kimliğinden farklı olduğunda harici katalog sağlayıcı kimliği; örneğin bir `zai` sağlayıcısı için `z-ai`. |
| `passthroughProviderModel` | `boolean`          | Eğik çizgi içeren model kimliklerini iç içe sağlayıcı/model başvuruları olarak ele alır; OpenRouter gibi proxy sağlayıcılar için kullanışlıdır. |
| `modelIdTransforms`        | `"version-dots"[]` | Ek harici katalog model kimliği varyantları. `version-dots`, `claude-opus-4.6` gibi noktalı sürüm kimliklerini dener. |

### OpenClaw Sağlayıcı Dizini

OpenClaw Sağlayıcı Dizini, Plugin’leri henüz yüklenmemiş olabilecek sağlayıcılar
için OpenClaw’a ait önizleme metadata’sıdır. Bir Plugin manifestinin parçası
değildir. Plugin manifestleri, kurulu Plugin yetkisi olmaya devam eder. Sağlayıcı
Dizini, bir sağlayıcı Plugin’i kurulu olmadığında gelecekteki kurulabilir
sağlayıcı ve kurulum öncesi model seçici yüzeylerinin kullanacağı dahili yedek
sözleşmedir.

Katalog yetki sırası:

1. Kullanıcı yapılandırması.
2. Kurulu Plugin manifesti `modelCatalog`.
3. Açık yenilemeden gelen model katalog önbelleği.
4. OpenClaw Sağlayıcı Dizini önizleme satırları.

Sağlayıcı Dizini; gizli bilgiler, etkin durum, çalışma zamanı hook’ları veya
canlı hesaba özgü model verileri içermemelidir. Önizleme katalogları, Plugin
manifestleriyle aynı `modelCatalog` sağlayıcı satırı şeklini kullanır; ancak
`api`, `baseUrl`, fiyatlandırma veya uyumluluk bayrakları gibi çalışma zamanı
bağdaştırıcı alanları bilinçli olarak kurulu Plugin manifestiyle hizalı
tutulmadıkça kararlı görüntüleme metadata’sıyla sınırlı kalmalıdır. Canlı
`/models` keşfi olan sağlayıcılar, normal listeleme veya onboarding çağrılarının
sağlayıcı API’lerini çağırması yerine yenilenmiş satırları açık model katalog
önbelleği yolu üzerinden yazmalıdır.

Sağlayıcı Dizini girdileri, Plugin’i çekirdekten çıkarılmış veya başka şekilde
henüz kurulu olmayan sağlayıcılar için kurulabilir Plugin metadata’sı da
taşıyabilir. Bu metadata, kanal katalog desenini yansıtır: paket adı, npm kurulum
tanımı, beklenen bütünlük ve düşük maliyetli kimlik doğrulama seçimi etiketleri
kurulabilir bir kurulum seçeneği göstermek için yeterlidir. Plugin kurulduktan
sonra, onun manifesti kazanır ve Sağlayıcı Dizini girdisi o sağlayıcı için yok
sayılır.

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` ve `webSearchProviders`
değerlerini `contracts` altına taşımak için `openclaw doctor --fix` kullanın;
normal manifest yükleme artık bu üst düzey alanları yetenek sahipliği olarak ele
almaz.

## Manifest ve package.json karşılaştırması

İki dosya farklı işler için kullanılır:

| Dosya                  | Ne için kullanılır                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce var olması gereken keşif, yapılandırma doğrulama, kimlik doğrulama seçimi metadata’sı ve UI ipuçları |
| `package.json`         | npm metadata’sı, bağımlılık kurulumu ve giriş noktaları, kurulum kapısı, kurulum veya katalog metadata’sı için kullanılan `openclaw` bloğu |

Bir metadata parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw’ın bunu Plugin kodunu yüklemeden önce bilmesi gerekiyorsa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi Plugin metadata’ları bilinçli olarak
`openclaw.plugin.json` yerine `package.json` içindeki `openclaw` bloğunda yer alır.
`openclaw.bundle` ve `openclaw.bundle.json`, OpenClaw Plugin sözleşmeleri değildir;
yerel Plugin’ler `openclaw.plugin.json` ile birlikte aşağıdaki desteklenen
`package.json#openclaw` alanlarını kullanmalıdır.

Önemli örnekler:

| Alan                                                                                       | Ne anlama gelir                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Yerel Plugin giriş noktalarını bildirir. Plugin paketi dizininin içinde kalmalıdır.                                                                                                         |
| `openclaw.runtimeExtensions`                                                               | Kurulu paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paketi dizininin içinde kalmalıdır.                                                             |
| `openclaw.setupEntry`                                                                      | İlk kurulum, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif, yalnızca kurulum giriş noktası. Plugin paketi dizininin içinde kalmalıdır.   |
| `openclaw.runtimeSetupEntry`                                                               | Kurulu paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. `setupEntry` gerektirir, mevcut olmalıdır ve Plugin paketi dizininin içinde kalmalıdır.                         |
| `openclaw.channel`                                                                         | Etiketler, doküman yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog metadatası.                                                                                       |
| `openclaw.channel.commands`                                                                | Kanal çalışma zamanı yüklenmeden önce config, denetim ve komut listesi yüzeyleri tarafından kullanılan statik yerel komut ve yerel skill otomatik varsayılan metadatası.                    |
| `openclaw.channel.configuredState`                                                         | Tam kanal çalışma zamanını yüklemeden "yalnızca ortam kurulumu zaten var mı?" sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyici metadatası.                                   |
| `openclaw.channel.persistedAuthState`                                                      | Tam kanal çalışma zamanını yüklemeden "zaten oturum açmış herhangi bir şey var mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama denetleyici metadatası.                           |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Paketle birlikte gelen ve harici yayımlanan Plugin’ler için kurulum/güncelleme ipuçları.                                                                                                    |
| `openclaw.install.defaultChoice`                                                           | Birden fazla kurulum kaynağı kullanılabildiğinde tercih edilen kurulum yolu.                                                                                                                |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` veya `>=2026.5.1-beta.1` gibi bir semver alt sınırı kullanılarak belirtilen, desteklenen minimum OpenClaw host sürümü.                                                        |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` gibi beklenen npm dist bütünlük dizesi; kurulum ve güncelleme akışları getirilen yapıtı buna göre doğrular.                                                                    |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Config geçersiz olduğunda dar kapsamlı bir paketle gelen Plugin yeniden kurulum kurtarma yoluna izin verir.                                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Başlatma sırasında tam kanal Plugin’inden önce yalnızca kurulum kanal yüzeylerinin yüklenmesine izin verir.                                                                                 |

Manifest metadatası, çalışma zamanı yüklenmeden önce ilk kurulumda hangi sağlayıcı/kanal/kurulum seçeneklerinin görüneceğine karar verir. `package.json#openclaw.install`, kullanıcı bu seçeneklerden birini seçtiğinde ilk kuruluma ilgili Plugin’in nasıl getirileceğini veya etkinleştirileceğini söyler. Kurulum ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, paketle birlikte gelmeyen Plugin kaynakları için kurulum ve manifest registry yükleme sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler, eski host’larda harici Plugin’lerin atlanmasına neden olur. Paketle birlikte gelen kaynak Plugin’lerin host checkout’u ile aynı sürümde olduğu varsayılır.

Resmi isteğe bağlı kurulum metadatası, Plugin ClawHub üzerinde yayımlanıyorsa `clawhubSpec` kullanmalıdır; ilk kurulum bunu tercih edilen uzak kaynak olarak ele alır ve kurulumdan sonra ClawHub yapıt bilgilerini kaydeder. `npmSpec`, henüz ClawHub’a taşınmamış paketler için uyumluluk yedeği olarak kalır.

Tam npm sürümü sabitlemesi zaten `npmSpec` içinde yer alır, örneğin `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmi harici katalog girdileri, getirilen npm yapıtı artık sabitlenmiş sürümle eşleşmiyorsa güncelleme akışlarının kapalı şekilde başarısız olması için tam spec’leri `expectedIntegrity` ile eşleştirmelidir. Etkileşimli ilk kurulum, uyumluluk için çıplak paket adları ve dist-tag’ler dahil olmak üzere güvenilir registry npm spec’lerini hâlâ sunar. Katalog tanılamaları tam, kayan, bütünlükle sabitlenmiş, bütünlüğü eksik, paket adı uyuşmayan ve geçersiz varsayılan seçim kaynaklarını ayırt edebilir. Ayrıca `expectedIntegrity` mevcutken sabitleyebileceği geçerli bir npm kaynağı yoksa uyarı verir. `expectedIntegrity` mevcut olduğunda kurulum/güncelleme akışları bunu zorunlu kılar; atlandığında registry çözümlemesi bütünlük sabitlemesi olmadan kaydedilir.

Kanal Plugin’leri, durum, kanal listesi veya SecretRef taramaları tam çalışma zamanını yüklemeden yapılandırılmış hesapları tanımlamaya ihtiyaç duyduğunda `openclaw.setupEntry` sağlamalıdır. Kurulum girişi kanal metadatası ile kuruluma güvenli config, durum ve gizli bilgi adaptörlerini sunmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve taşıma çalışma zamanlarını ana extension giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanları için paket sınırı denetimlerini geçersiz kılmaz. Örneğin `openclaw.runtimeExtensions`, dışarı kaçan bir `openclaw.extensions` yolunu yüklenebilir hale getiremez.

`openclaw.install.allowInvalidConfigRecovery` bilinçli olarak dar kapsamlıdır. Rastgele bozuk config’leri kurulabilir hale getirmez. Bugün yalnızca eksik paketle gelen Plugin yolu veya aynı paketle gelen Plugin için eski bir `channels.<id>` girdisi gibi belirli eski paketle gelen Plugin yükseltme hatalarından kurulum akışlarının kurtulmasına izin verir. İlgisiz config hataları kurulumu yine de engeller ve operatörleri `openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modülü için paket metadatasıdır:

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

Bunu kurulum, doctor, durum veya salt okunur varlık akışları tam kanal Plugin’i yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğunda kullanın. Kalıcı kimlik doğrulama durumu, yapılandırılmış kanal durumu değildir: bu metadatayı Plugin’leri otomatik etkinleştirmek, çalışma zamanı bağımlılıklarını onarmak veya bir kanal çalışma zamanının yüklenip yüklenmeyeceğine karar vermek için kullanmayın. Hedef export yalnızca kalıcı durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel’ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca ortam yapılandırma denetimleri için aynı biçimi izler:

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

Bunu bir kanal yapılandırılmış durumu ortamdan veya diğer küçük çalışma zamanı dışı girdilerden yanıtlayabildiğinde kullanın. Denetim tam config çözümlemesine veya gerçek kanal çalışma zamanına ihtiyaç duyuyorsa bu mantığı bunun yerine Plugin `config.hasConfiguredState` hook’unda tutun.

## Keşif önceliği (yinelenen Plugin id’leri)

OpenClaw Plugin’leri çeşitli köklerden keşfeder (paketle gelen, genel kurulum, workspace, açıkça config ile seçilen yollar). İki keşif aynı `id` değerini paylaşıyorsa yalnızca **en yüksek öncelikli** manifest tutulur; daha düşük öncelikli yinelenenler yanında yüklenmek yerine bırakılır.

Öncelik, en yüksekten en düşüğe:

1. **Config ile seçilen** — `plugins.entries.<id>` içinde açıkça sabitlenmiş bir yol
2. **Paketle gelen** — OpenClaw ile gönderilen Plugin’ler
3. **Genel kurulum** — genel OpenClaw Plugin köküne kurulmuş Plugin’ler
4. **Workspace** — geçerli workspace’e göre keşfedilen Plugin’ler

Sonuçlar:

- Workspace’te duran paketle gelen bir Plugin’in fork’lanmış veya eski bir kopyası, paketle gelen derlemeyi gölgelemez.
- Paketle gelen bir Plugin’i yerel bir Plugin ile gerçekten geçersiz kılmak için workspace keşfine güvenmek yerine onu `plugins.entries.<id>` üzerinden sabitleyin; böylece öncelik nedeniyle kazanır.
- Yinelenen bırakmalar kaydedilir, böylece Doctor ve başlatma tanılamaları atılan kopyayı gösterebilir.
- Config ile seçilen yinelenen geçersiz kılmalar tanılamalarda açık geçersiz kılmalar olarak ifade edilir, ancak eski fork’ların ve kazara gölgelemelerin görünür kalması için yine de uyarı verir.

## JSON Schema gereksinimleri

- **Her Plugin bir JSON Schema ile gönderilmelidir**, config kabul etmese bile.
- Boş bir schema kabul edilebilir (örneğin, `{ "type": "object", "additionalProperties": false }`).
- Schema’lar çalışma zamanında değil, config okuma/yazma zamanında doğrulanır.
- Paketle gelen bir Plugin’i yeni config anahtarlarıyla genişletirken veya fork’larken, aynı anda ilgili Plugin’in `openclaw.plugin.json` `configSchema` değerini güncelleyin. Paketle gelen Plugin schema’ları katıdır, bu yüzden kullanıcı config’inde `configSchema.properties` içine `myNewKey` eklemeden `plugins.entries.<id>.config.myNewKey` eklemek, Plugin çalışma zamanı yüklenmeden önce reddedilir.

Örnek schema uzantısı:

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

- Bilinmeyen `channels.*` anahtarları, kanal id’si bir Plugin manifesti tarafından bildirilmedikçe **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*` **keşfedilebilir** Plugin id’lerine başvurmalıdır. Bilinmeyen id’ler **hatadır**.
- Bir Plugin kuruluysa ancak manifesti veya schema’sı bozuk ya da eksikse doğrulama başarısız olur ve Doctor Plugin hatasını bildirir.
- Plugin config’i mevcutsa ancak Plugin **devre dışıysa**, config korunur ve Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` schema’sı için [Yapılandırma referansı](/tr/gateway/configuration) bölümüne bakın.

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw Plugin'leri için zorunludur**. Çalışma zamanı yine de Plugin modülünü ayrıca yükler; manifest yalnızca keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle son değer yine bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyici yalnızca belgelenmiş manifest alanlarını okur. Özel üst düzey anahtarlardan kaçının.
- Bir Plugin bunlara ihtiyaç duymadığında `channels`, `providers`, `cliBackends` ve `skills` atlanabilir.
- `providerDiscoveryEntry` hafif kalmalı ve geniş çalışma zamanı kodlarını içe aktarmamalıdır; bunu istek zamanı yürütmesi için değil, statik sağlayıcı katalog meta verileri veya dar keşif tanımlayıcıları için kullanın.
- Özel Plugin türleri `plugins.slots.*` üzerinden seçilir: `plugins.slots.memory` aracılığıyla `kind: "memory"`, `plugins.slots.contextEngine` aracılığıyla `kind: "context-engine"` (varsayılan `legacy`).
- Özel Plugin türünü bu manifestte bildirin. Çalışma zamanı girişindeki `OpenClawPluginDefinition.kind` kullanım dışıdır ve yalnızca eski Plugin'ler için uyumluluk yedeği olarak kalır.
- Ortam değişkeni meta verileri (`setup.providers[].envVars`, kullanım dışı `providerAuthEnvVars` ve `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, cron teslim doğrulaması ve diğer salt okunur yüzeyler, bir ortam değişkenini yapılandırılmış olarak değerlendirmeden önce yine de Plugin güvenini ve etkinleştirme politikasını uygular.
- Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı meta verileri için bkz. [Sağlayıcı çalışma zamanı kancaları](/tr/plugins/architecture-internals#provider-runtime-hooks).
- Plugin'iniz yerel modüllere bağımlıysa derleme adımlarını ve paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## İlgili

<CardGroup cols={3}>
  <Card title="Plugin oluşturma" href="/tr/plugins/building-plugins" icon="rocket">
    Plugin'lerle başlangıç.
  </Card>
  <Card title="Plugin mimarisi" href="/tr/plugins/architecture" icon="diagram-project">
    İç mimari ve yetenek modeli.
  </Card>
  <Card title="SDK genel bakışı" href="/tr/plugins/sdk-overview" icon="book">
    Plugin SDK başvurusu ve alt yol içe aktarmaları.
  </Card>
</CardGroup>
