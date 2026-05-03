---
read_when:
    - Bir OpenClaw Plugin geliştiriyorsunuz
    - Bir Plugin yapılandırma şeması sunmanız veya Plugin doğrulama hatalarında hata ayıklamanız gerekir
summary: Plugin manifesti + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin manifestosu
x-i18n:
    generated_at: "2026-05-03T21:36:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

Bu sayfa yalnızca **yerel OpenClaw Plugin manifesti** içindir.

Uyumlu paket düzenleri için bkz. [Plugin paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifest içermeyen varsayılan Claude bileşen
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan
`openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda paket meta verilerini ve bildirilen
beceri köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını,
Claude paketi LSP varsayılanlarını ve düzen OpenClaw çalışma zamanı beklentileriyle
eşleştiğinde desteklenen kanca paketlerini okur.

Her yerel OpenClaw Plugin, **Plugin kökünde** bir `openclaw.plugin.json` dosyasıyla
gelmelidir. OpenClaw bu manifesti, **Plugin kodunu çalıştırmadan** yapılandırmayı
doğrulamak için kullanır. Eksik veya geçersiz manifestler Plugin hatası olarak
değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam Plugin sistemi kılavuzuna bakın: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve mevcut dış uyumluluk rehberliği için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw’ın **Plugin kodunuzu yüklemeden önce** okuduğu meta verilerdir.
Aşağıdaki her şey, Plugin çalışma zamanını başlatmadan incelenebilecek kadar hafif olmalıdır.

**Şunlar için kullanın:**

- Plugin kimliği, yapılandırma doğrulaması ve yapılandırma UI ipuçları
- kimlik doğrulama, ilk kullanım ve kurulum meta verileri (takma ad, otomatik etkinleştirme, sağlayıcı ortam değişkenleri, kimlik doğrulama seçenekleri)
- kontrol düzlemi yüzeyleri için etkinleştirme ipuçları
- model ailesi sahipliği için kısayol
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` ana makinesinin inceleyebileceği QA çalıştırıcı meta verileri
- katalog ve doğrulama yüzeylerine birleştirilen kanala özgü yapılandırma meta verileri

**Şunlar için kullanmayın:** çalışma zamanı davranışını kaydetmek, kod giriş noktalarını bildirmek
veya npm kurulum meta verileri. Bunlar Plugin kodunuza ve `package.json` dosyasına aittir.

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

| Alan                                 | Gerekli  | Tür                              | Anlamı                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Evet     | `string`                         | Kurallı Plugin kimliği. Bu, `plugins.entries.<id>` içinde kullanılan kimliktir.                                                                                                                                                     |
| `configSchema`                       | Evet     | `object`                         | Bu Plugin’in yapılandırması için satır içi JSON Schema.                                                                                                                                                                             |
| `enabledByDefault`                   | Hayır    | `true`                           | Bir paketlenmiş Plugin’i varsayılan olarak etkin şeklinde işaretler. Plugin’i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` olmayan herhangi bir değere ayarlayın.                                           |
| `enabledByDefaultOnPlatforms`        | Hayır    | `string[]`                       | Bir paketlenmiş Plugin’i yalnızca listelenen Node.js platformlarında, örneğin `["darwin"]`, varsayılan olarak etkin şeklinde işaretler. Açık yapılandırma yine önceliklidir.                                                       |
| `legacyPluginIds`                    | Hayır    | `string[]`                       | Bu kurallı Plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                                        |
| `autoEnableWhenConfiguredProviders`  | Hayır    | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunlardan söz ettiğinde bu Plugin’i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                    |
| `kind`                               | Hayır    | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan ayrıcalıklı bir Plugin türünü bildirir.                                                                                                                                                     |
| `channels`                           | Hayır    | `string[]`                       | Bu Plugin’in sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                                      |
| `providers`                          | Hayır    | `string[]`                       | Bu Plugin’in sahip olduğu sağlayıcı kimlikleri.                                                                                                                                                                                     |
| `providerDiscoveryEntry`             | Hayır    | `string`                         | Tam Plugin çalışma zamanını etkinleştirmeden yüklenebilen, bildirim kapsamlı sağlayıcı katalog meta verileri için Plugin köküne göre göreli hafif sağlayıcı keşif modülü yolu.                                                     |
| `modelSupport`                       | Hayır    | `object`                         | Çalışma zamanından önce Plugin’i otomatik yüklemek için kullanılan, bildirimin sahip olduğu kısa model ailesi meta verileri.                                                                                                        |
| `modelCatalog`                       | Hayır    | `object`                         | Bu Plugin’in sahip olduğu sağlayıcılar için bildirimsel model kataloğu meta verileri. Bu; gelecekteki salt okunur listeleme, alıştırma, model seçiciler, takma adlar ve Plugin çalışma zamanını yüklemeden bastırma için kontrol düzlemi sözleşmesidir. |
| `modelPricing`                       | Hayır    | `object`                         | Sağlayıcının sahip olduğu harici fiyatlandırma arama ilkesi. Yerel/kendi barındırılan sağlayıcıları uzak fiyat kataloglarının dışında bırakmak veya sağlayıcı başvurularını çekirdekte sağlayıcı kimliklerini sabit kodlamadan OpenRouter/LiteLLM katalog kimliklerine eşlemek için kullanın. |
| `modelIdNormalization`               | Hayır    | `object`                         | Sağlayıcı çalışma zamanı yüklenmeden önce çalışması gereken, sağlayıcının sahip olduğu model kimliği takma ad/önek temizliği.                                                                                                      |
| `providerEndpoints`                  | Hayır    | `object[]`                       | Çekirdeğin sağlayıcı çalışma zamanı yüklenmeden önce sınıflandırması gereken sağlayıcı rotaları için bildirimin sahip olduğu uç nokta host/baseUrl meta verileri.                                                                   |
| `providerRequest`                    | Hayır    | `object`                         | Sağlayıcı çalışma zamanı yüklenmeden önce genel istek ilkesi tarafından kullanılan düşük maliyetli sağlayıcı ailesi ve istek uyumluluğu meta verileri.                                                                              |
| `cliBackends`                        | Hayır    | `string[]`                       | Bu Plugin’in sahip olduğu CLI çıkarım arka uç kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                                                    |
| `syntheticAuthRefs`                  | Hayır    | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında Plugin’in sahip olduğu sentetik kimlik doğrulama kancasının yoklanması gereken sağlayıcı veya CLI arka uç başvuruları.                                                  |
| `nonSecretAuthMarkers`               | Hayır    | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketlenmiş Plugin’in sahip olduğu yer tutucu API anahtarı değerleri.                                                                                   |
| `commandAliases`                     | Hayır    | `object[]`                       | Çalışma zamanı yüklenmeden önce Plugin farkındalıklı yapılandırma ve CLI tanılamaları üretmesi gereken, bu Plugin’in sahip olduğu komut adları.                                                                                    |
| `providerAuthEnvVars`                | Hayır    | `Record<string, string[]>`       | Sağlayıcı kimlik doğrulama/durum araması için kullanımdan kaldırılmış uyumluluk ortam meta verileri. Yeni Plugin’ler için `setup.providers[].envVars` tercih edin; OpenClaw bunu kullanımdan kaldırma dönemi boyunca hâlâ okur.     |
| `providerAuthAliases`                | Hayır    | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı.              |
| `channelEnvVars`                     | Hayır    | `Record<string, string[]>`       | OpenClaw’ın Plugin kodunu yüklemeden inceleyebileceği düşük maliyetli kanal ortam meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam güdümlü kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`                | Hayır    | `object[]`                       | Alıştırma seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlama için düşük maliyetli kimlik doğrulama seçeneği meta verileri.                                                                               |
| `activation`                         | Hayır    | `object`                         | Başlangıç, sağlayıcı, komut, kanal, rota ve yetenekle tetiklenen yükleme için düşük maliyetli etkinleştirme planlayıcı meta verileri. Yalnızca meta verilerdir; gerçek davranışın sahibi hâlâ Plugin çalışma zamanıdır.              |
| `setup`                              | Hayır    | `object`                         | Keşif ve kurulum yüzeylerinin Plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/alıştırma tanımlayıcıları.                                                                                               |
| `qaRunners`                          | Hayır    | `object[]`                       | Plugin çalışma zamanı yüklenmeden önce paylaşılan `openclaw qa` host’u tarafından kullanılan düşük maliyetli QA çalıştırıcı tanımlayıcıları.                                                                                       |
| `contracts`                          | Hayır    | `object`                         | Harici kimlik doğrulama kancaları, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü üretimi, müzik üretimi, video üretimi, web getirme, web araması ve araç sahipliği için statik yetenek sahipliği anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır    | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli medya anlama varsayılanları.                                                                                                   |
| `imageGenerationProviderMetadata`    | Hayır    | `Record<string, object>`         | `contracts.imageGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için sağlayıcının sahip olduğu kimlik doğrulama takma adları ve base-url korumaları dahil düşük maliyetli görüntü üretimi kimlik doğrulama meta verileri. |
| `videoGenerationProviderMetadata`    | Hayır    | `Record<string, object>`         | `contracts.videoGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için sağlayıcının sahip olduğu kimlik doğrulama takma adları ve base-url korumaları dahil düşük maliyetli video üretimi kimlik doğrulama meta verileri. |
| `musicGenerationProviderMetadata`    | Hayır    | `Record<string, object>`         | `contracts.musicGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için sağlayıcının sahip olduğu kimlik doğrulama takma adları ve base-url korumaları dahil düşük maliyetli müzik üretimi kimlik doğrulama meta verileri. |
| `toolMetadata`                       | Hayır    | `Record<string, object>`         | `contracts.tools` içinde bildirilen Plugin’e ait araçlar için düşük maliyetli kullanılabilirlik meta verileri. Bir araç, yapılandırma, ortam veya kimlik doğrulama kanıtı olmadıkça çalışma zamanını yüklememeliyse bunu kullanın. |
| `channelConfigs`                     | Hayır    | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, bildirimin sahip olduğu kanal yapılandırma meta verileri.                                                                                            |
| `skills`                             | Hayır    | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skill dizinleri.                                                                                                                                                                        |
| `name`                               | Hayır    | `string`                         | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                                             |
| `description`                        | Hayır    | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                           |
| `version`                            | Hayır    | `string`                         | Bilgilendirici Plugin sürümü.                                                                                                                                                                                                       |
| `uiHints`                            | Hayır    | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                     |

## Üretim sağlayıcısı meta verileri referansı

Üretim sağlayıcısı meta veri alanları, eşleşen `contracts.*GenerationProviders` listesinde bildirilen sağlayıcılar için statik kimlik doğrulama sinyallerini açıklar. OpenClaw, her sağlayıcı Plugin'ini içe aktarmadan bir üretim sağlayıcısının kullanılabilir olup olmadığına temel araçların karar verebilmesi için bu alanları sağlayıcı çalışma zamanı yüklenmeden önce okur.

Bu alanları yalnızca düşük maliyetli, bildirime dayalı gerçekler için kullanın. Aktarım, istek dönüşümleri, token yenileme, kimlik bilgisi doğrulaması ve gerçek üretim davranışı Plugin çalışma zamanında kalır.

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

| Alan            | Zorunlu | Tür        | Anlamı                                                                                                                              |
| --------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Hayır   | `string[]` | Üretim sağlayıcısı için statik kimlik doğrulama takma adları olarak sayılması gereken ek sağlayıcı kimlikleri.                      |
| `authProviders` | Hayır   | `string[]` | Yapılandırılmış kimlik doğrulama profilleri bu üretim sağlayıcısı için kimlik doğrulama sayılması gereken sağlayıcı kimlikleri.     |
| `configSignals` | Hayır   | `object[]` | Kimlik doğrulama profilleri veya ortam değişkenleri olmadan yapılandırılabilen yerel ya da kendi barındırılan sağlayıcılar için düşük maliyetli, yalnızca yapılandırmaya dayalı kullanılabilirlik sinyalleri. |
| `authSignals`   | Hayır   | `object[]` | Açık kimlik doğrulama sinyalleri. Mevcut olduklarında, sağlayıcı kimliğinden, `aliases` ve `authProviders` alanlarından gelen varsayılan sinyal kümesinin yerini alırlar. |

Her `configSignals` girdisi şunları destekler:

| Alan          | Zorunlu | Tür        | Anlamı                                                                                                                                                                                   |
| ------------- | ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Evet    | `string`   | İncelenecek Plugin'e ait yapılandırma nesnesine noktalı yol, örneğin `plugins.entries.example.config`.                                                                                   |
| `overlayPath` | Hayır   | `string`   | Sinyal değerlendirilmeden önce kök nesnenin üzerine uygulanması gereken kök yapılandırma içindeki nesneye noktalı yol. Bunu `image`, `video` veya `music` gibi yeteneğe özgü yapılandırma için kullanın. |
| `required`    | Hayır   | `string[]` | Etkili yapılandırma içinde yapılandırılmış değerlere sahip olması gereken noktalı yollar. Dizeler boş olmamalıdır; nesneler ve diziler boş olmamalıdır.                                  |
| `requiredAny` | Hayır   | `string[]` | Etkili yapılandırma içinde en az birinin yapılandırılmış değere sahip olması gereken noktalı yollar.                                                                                      |
| `mode`        | Hayır   | `object`   | Etkili yapılandırma içinde isteğe bağlı dize mod koruması. Yalnızca yapılandırmaya dayalı kullanılabilirlik tek bir moda uygulanıyorsa bunu kullanın.                                    |

Her `mode` koruması şunları destekler:

| Alan         | Zorunlu | Tür        | Anlamı                                                                                 |
| ------------ | ------- | ---------- | -------------------------------------------------------------------------------------- |
| `path`       | Hayır   | `string`   | Etkili yapılandırma içindeki noktalı yol. Varsayılan değer `mode`.                     |
| `default`    | Hayır   | `string`   | Yapılandırma yolu atladığında kullanılacak mod değeri.                                 |
| `allowed`    | Hayır   | `string[]` | Mevcutsa, sinyal yalnızca etkili mod bu değerlerden biri olduğunda geçer.              |
| `disallowed` | Hayır   | `string[]` | Mevcutsa, etkili mod bu değerlerden biri olduğunda sinyal başarısız olur.              |

Her `authSignals` girdisi şunları destekler:

| Alan              | Zorunlu | Tür      | Anlamı                                                                                                                                                                         |
| ----------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Evet    | `string` | Yapılandırılmış kimlik doğrulama profillerinde kontrol edilecek sağlayıcı kimliği.                                                                                             |
| `providerBaseUrl` | Hayır   | `object` | Sinyalin yalnızca başvurulan yapılandırılmış sağlayıcı izin verilen bir temel URL kullandığında sayılmasını sağlayan isteğe bağlı koruma. Bir kimlik doğrulama takma adı yalnızca belirli API'ler için geçerliyse bunu kullanın. |

Her `providerBaseUrl` koruması şunları destekler:

| Alan              | Zorunlu | Tür        | Anlamı                                                                                                                                              |
| ----------------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet    | `string`   | `baseUrl` değeri kontrol edilmesi gereken sağlayıcı yapılandırma kimliği.                                                                            |
| `defaultBaseUrl`  | Hayır   | `string`   | Sağlayıcı yapılandırması `baseUrl` değerini atladığında varsayılacak temel URL.                                                                      |
| `allowedBaseUrls` | Evet    | `string[]` | Bu kimlik doğrulama sinyali için izin verilen temel URL'ler. Yapılandırılmış veya varsayılan temel URL bu normalleştirilmiş değerlerden biriyle eşleşmediğinde sinyal yok sayılır. |

## Araç meta verileri referansı

`toolMetadata`, araç adına göre anahtarlanmış şekilde üretim sağlayıcısı meta verileriyle aynı `configSignals` ve `authSignals` biçimlerini kullanır. `contracts.tools` sahipliği bildirir. `toolMetadata`, OpenClaw'ın yalnızca araç fabrikasının `null` döndürmesini sağlamak için bir Plugin çalışma zamanını içe aktarmaktan kaçınabilmesi amacıyla düşük maliyetli kullanılabilirlik kanıtı bildirir.

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

Bir aracın `toolMetadata` alanı yoksa OpenClaw mevcut davranışı korur ve araç sözleşmesi ilkeyle eşleştiğinde sahip Plugin'i yükler. Fabrikası kimlik doğrulamasına/yapılandırmaya bağlı olan sıcak yol araçları için Plugin yazarları, temel sistemin sormak amacıyla çalışma zamanını içe aktarmasını sağlamak yerine `toolMetadata` bildirmelidir.

## providerAuthChoices referansı

Her `providerAuthChoices` girdisi bir başlangıç kurulumu veya kimlik doğrulama seçeneğini açıklar. OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur. Sağlayıcı kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden bu manifest seçeneklerini, tanımlayıcıdan türetilmiş kurulum seçeneklerini ve yükleme kataloğu meta verilerini kullanır.

| Alan                  | Zorunlu | Tür                                             | Anlamı                                                                                                  |
| --------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                        | Bu seçeneğin ait olduğu sağlayıcı kimliği.                                                              |
| `method`              | Evet    | `string`                                        | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                       |
| `choiceId`            | Evet    | `string`                                        | Başlangıç kurulumu ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçeneği kimliği.     |
| `choiceLabel`         | Hayır   | `string`                                        | Kullanıcıya gösterilen etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                       |
| `choiceHint`          | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                        |
| `assistantPriority`   | Hayır   | `number`                                        | Düşük değerler, asistan odaklı etkileşimli seçicilerde daha önce sıralanır.                             |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                  | Manuel CLI seçimine hâlâ izin verirken seçeneği asistan seçicilerinden gizler.                          |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                      | Kullanıcıları bu yedek seçeneğe yönlendirmesi gereken eski seçenek kimlikleri.                          |
| `groupId`             | Hayır   | `string`                                        | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                            |
| `groupLabel`          | Hayır   | `string`                                        | Bu grup için kullanıcıya gösterilen etiket.                                                             |
| `groupHint`           | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                          |
| `optionKey`           | Hayır   | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için dahili seçenek anahtarı.                              |
| `cliFlag`             | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                             |
| `cliOption`           | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                               |
| `cliDescription`      | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                     |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçeneğin hangi başlangıç kurulumu yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan olarak `["text-inference"]` olur. |

## commandAliases referansı

`plugins.allow` içine kullanıcıların yanlışlıkla koyabileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adı bir Plugin'e ait olduğunda `commandAliases` kullanın. OpenClaw bu metaveriyi tanılama için Plugin çalışma zamanı kodunu içe aktarmadan kullanır.

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

| Alan         | Gerekli | Tür               | Anlamı                                                                 |
| ------------ | ------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu Plugin'e ait komut adı.                                             |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök CLI komutu yerine sohbet slash komutu olarak işaretler. |
| `cliCommand` | Hayır   | `string`          | Varsa, CLI işlemleri için önerilecek ilgili kök CLI komutu.            |

## activation referansı

Plugin, hangi kontrol düzlemi olaylarının onu bir etkinleştirme/yükleme planına dahil etmesi gerektiğini düşük maliyetle bildirebildiğinde `activation` kullanın.

Bu blok bir yaşam döngüsü API'si değil, planlayıcı metaverisidir. Çalışma zamanı davranışı kaydetmez, `register(...)` yerine geçmez ve Plugin kodunun zaten çalıştırılmış olduğunu vaat etmez. Etkinleştirme planlayıcısı, mevcut manifest sahipliği metaverilerine geri dönmeden önce aday Plugin'leri daraltmak için bu alanları kullanır; örneğin `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve hook'lar.

Sahipliği zaten açıklayan en dar metaveriyi tercih edin. İlişkiyi bu alanlar ifade ediyorsa `providers`, `channels`, `commandAliases`, kurulum tanımlayıcıları veya `contracts` kullanın. Bu sahiplik alanlarıyla temsil edilemeyen ek planlayıcı ipuçları için `activation` kullanın.
`claude-cli`, `codex-cli` veya `google-gemini-cli` gibi CLI çalışma zamanı takma adları için üst düzey `cliBackends` kullanın; `activation.onAgentHarnesses` yalnızca zaten bir sahiplik alanı olmayan gömülü ajan harness kimlikleri içindir.

Bu blok yalnızca metaveridir. Çalışma zamanı davranışı kaydetmez ve `register(...)`, `setupEntry` veya diğer çalışma zamanı/Plugin giriş noktalarının yerine geçmez. Mevcut tüketiciler bunu daha geniş Plugin yüklemesinden önce daraltıcı bir ipucu olarak kullanır; bu nedenle başlangıç dışı etkinleştirme metaverisinin eksik olması genellikle yalnızca performans maliyeti doğurur; manifest sahipliği yedekleri hâlâ varken doğruluğu değiştirmemelidir.

Her Plugin, `activation.onStartup` değerini bilinçli olarak ayarlamalıdır. Plugin'in Gateway başlangıcı sırasında çalışması gerekiyorsa bunu yalnızca `true` olarak ayarlayın. Plugin başlangıçta pasifse ve yalnızca daha dar tetikleyicilerden yüklenmeliyse `false` olarak ayarlayın. `onStartup` değerini atlamak artık Plugin'i örtük olarak başlangıçta yüklemez; başlangıç, kanal, yapılandırma, ajan harness, bellek veya diğer daha dar etkinleştirme tetikleyicileri için açık etkinleştirme metaverisi kullanın.

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

| Alan               | Gerekli | Tür                                                  | Anlamı                                                                                                                                                                                              |
| ------------------ | ------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Hayır   | `boolean`                                            | Açık Gateway başlangıç etkinleştirmesi. Her Plugin bunu ayarlamalıdır. `true`, Plugin'i başlangıç sırasında içe aktarır; `false`, başka bir eşleşen tetikleyici yükleme gerektirmedikçe başlangıçta tembel tutar. |
| `onProviders`      | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                                                                                                              |
| `onAgentHarnesses` | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken gömülü ajan harness çalışma zamanı kimlikleri. CLI arka uç takma adları için üst düzey `cliBackends` kullanın.                    |
| `onCommands`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                                                                                                                  |
| `onChannels`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                                                                                                                  |
| `onRoutes`         | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                                                                                                                      |
| `onConfigPaths`    | Hayır   | `string[]`                                           | Yol mevcut olduğunda ve açıkça devre dışı bırakılmadığında bu Plugin'i başlangıç/yükleme planlarına dahil etmesi gereken köke göre yapılandırma yolları.                                             |
| `onCapabilities`   | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin.                                                                       |

Mevcut canlı tüketiciler:

- Gateway başlangıç planlaması, açık başlangıç içe aktarması için `activation.onStartup` kullanır
- komutla tetiklenen CLI planlaması, eski `commandAliases[].cliCommand` veya `commandAliases[].name` alanlarına geri döner
- ajan çalışma zamanı başlangıç planlaması, gömülü harness'ler için `activation.onAgentHarnesses` ve CLI çalışma zamanı takma adları için üst düzey `cliBackends[]` kullanır
- kanalla tetiklenen kurulum/kanal planlaması, açık kanal etkinleştirme metaverisi eksik olduğunda eski `channels[]` sahipliğine geri döner
- başlangıç Plugin planlaması, paketlenmiş tarayıcı Plugin'inin `browser` bloğu gibi kanal dışı kök yapılandırma yüzeyleri için `activation.onConfigPaths` kullanır
- sağlayıcıyla tetiklenen kurulum/çalışma zamanı planlaması, açık sağlayıcı etkinleştirme metaverisi eksik olduğunda eski `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

Planlayıcı tanılamaları, açık etkinleştirme ipuçlarını manifest sahipliği yedeğinden ayırt edebilir. Örneğin, `activation-command-hint` `activation.onCommands` alanının eşleştiği anlamına gelirken, `manifest-command-alias` planlayıcının bunun yerine `commandAliases` sahipliğini kullandığı anlamına gelir. Bu neden etiketleri konak tanılamaları ve testler içindir; Plugin yazarları sahipliği en iyi tanımlayan metaveriyi bildirmeye devam etmelidir.

## qaRunners referansı

Bir Plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma çalıştırıcısı katkısı yaptığında `qaRunners` kullanın. Bu metaveriyi düşük maliyetli ve statik tutun; gerçek CLI kaydına hâlâ, `qaRunnerCliRegistrations` dışa aktaran hafif bir `runtime-api.ts` yüzeyi aracılığıyla Plugin çalışma zamanı sahip olur.

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

| Alan          | Gerekli | Tür      | Anlamı                                                                     |
| ------------- | ------- | -------- | -------------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altına bağlanan alt komut; örneğin `matrix`.                 |
| `description` | Hayır   | `string` | Paylaşılan konağın bir taslak komuta ihtiyaç duyduğunda kullandığı yedek yardım metni. |

## setup referansı

Kurulum ve ilk kullanım yüzeylerinin çalışma zamanı yüklenmeden önce düşük maliyetli, Plugin'e ait metaveriye ihtiyaç duyması halinde `setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım arka uçlarını tanımlamaya devam eder. `setup.cliBackends`, metaveri olarak kalması gereken kontrol düzlemi/kurulum akışları için kuruluma özgü tanımlayıcı yüzeyidir.

Mevcut olduklarında `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday Plugin'i daraltıyorsa ve kurulum hâlâ daha zengin kurulum zamanı çalışma zamanı hook'larına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak `setup-api` alanını yerinde tutun.

OpenClaw ayrıca genel sağlayıcı kimlik doğrulaması ve ortam değişkeni aramalarına `setup.providers[].envVars` değerlerini dahil eder. `providerAuthEnvVars`, kullanım dışı bırakma penceresi boyunca bir uyumluluk bağdaştırıcısı üzerinden desteklenmeye devam eder, ancak bunu hâlâ kullanan paketlenmemiş Plugin'ler bir manifest tanılaması alır. Yeni Plugin'ler kurulum/durum ortam metaverisini `setup.providers[].envVars` üzerine koymalıdır.

OpenClaw, kurulum girişi mevcut olmadığında veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildirdiğinde, `setup.providers[].authMethods` alanından basit kurulum seçenekleri de türetebilir. Açık `providerAuthChoices` girdileri; özel etiketler, CLI bayrakları, ilk kullanım kapsamı ve asistan metaverisi için tercih edilmeye devam eder.

`requiresRuntime: false` değerini yalnızca bu tanımlayıcılar kurulum yüzeyi için yeterli olduğunda ayarlayın. OpenClaw açık `false` değerini yalnızca tanımlayıcı sözleşmesi olarak ele alır ve kurulum araması için `setup-api` veya `openclaw.setupEntry` yürütmez. Yalnızca tanımlayıcı kullanan bir Plugin hâlâ bu kurulum çalışma zamanı girdilerinden birini gönderiyorsa OpenClaw eklemeli bir tanılama bildirir ve onu yok saymaya devam eder. `requiresRuntime` değerinin atlanması eski yedek davranışı korur; böylece bayrak olmadan tanımlayıcı eklemiş mevcut Plugin'ler bozulmaz.

Kurulum araması Plugin'e ait `setup-api` kodunu yürütebildiğinden, normalleştirilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen Plugin'ler genelinde benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine kapalı şekilde başarısız olur.

Kurulum çalışma zamanı yürütüldüğünde, `setup-api` manifest tanımlayıcılarının bildirmediği bir sağlayıcı veya CLI arka ucu kaydederse ya da bir tanımlayıcının eşleşen çalışma zamanı kaydı yoksa kurulum kayıt defteri tanılamaları tanımlayıcı sapmasını bildirir. Bu tanılamalar eklemelidir ve eski Plugin'leri reddetmez.

### setup.providers referansı

| Alan           | Gerekli | Tür        | Anlamı                                                                                                  |
| -------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `id`           | Evet    | `string`   | Kurulum veya ilk kullanım sırasında açığa çıkarılan sağlayıcı kimliği. Normalleştirilmiş kimlikleri küresel olarak benzersiz tutun. |
| `authMethods`  | Hayır   | `string[]` | Bu sağlayıcının tam çalışma zamanını yüklemeden desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`      | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden önce denetleyebileceği ortam değişkenleri. |
| `authEvidence` | Hayır   | `object[]` | Gizli olmayan işaretleyiciler üzerinden kimlik doğrulaması yapabilen sağlayıcılar için düşük maliyetli yerel kimlik doğrulama kanıtı denetimleri. |

`authEvidence`, çalışma zamanı kodu yüklenmeden doğrulanabilen, sağlayıcıya ait yerel kimlik bilgisi işaretçileri içindir. Bu denetimler ucuz ve yerel kalmalıdır: ağ çağrısı yok, keychain veya giz yöneticisi okuması yok, kabuk komutu yok ve sağlayıcı API sondası yok.

Desteklenen kanıt girdileri:

| Alan               | Zorunlu | Tür        | Anlamı                                                                                                                   |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `type`             | Evet    | `string`   | Şu anda `local-file-with-env`.                                                                                           |
| `fileEnvVar`       | Hayır   | `string`   | Açık bir kimlik bilgisi dosya yolu içeren env var.                                                                       |
| `fallbackPaths`    | Hayır   | `string[]` | `fileEnvVar` yoksa veya boşsa denetlenen yerel kimlik bilgisi dosya yolları. `${HOME}` ve `${APPDATA}` desteklenir.      |
| `requiresAnyEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen env var'lardan en az biri boş olmamalıdır.                                         |
| `requiresAllEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen her env var boş olmamalıdır.                                                       |
| `credentialMarker` | Evet    | `string`   | Kanıt mevcut olduğunda döndürülen gizli olmayan işaretçi.                                                                |
| `source`           | Hayır   | `string`   | Kimlik doğrulama/durum çıktısı için kullanıcıya gösterilen kaynak etiketi.                                               |

### setup alanları

| Alan               | Zorunlu | Tür        | Anlamı                                                                                                      |
| ------------------ | ------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve ilk katılım sırasında gösterilen sağlayıcı kurulum tanımlayıcıları.                              |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kullanılan kurulum zamanı backend kimlikleri. Normalleştirilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin'in kurulum yüzeyinin sahip olduğu config migration kimlikleri.                                    |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.               |

## uiHints başvurusu

`uiHints`, config alanı adlarından küçük işleme ipuçlarına giden bir haritadır.

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

| Alan          | Tür        | Anlamı                                      |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Kullanıcıya gösterilen alan etiketi.       |
| `help`        | `string`   | Kısa yardımcı metin.                       |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.                |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.           |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler.  |
| `placeholder` | `string`   | Form girişleri için yer tutucu metin.      |

## contracts başvurusu

`contracts` yalnızca OpenClaw'ın Plugin çalışma zamanını içe aktarmadan okuyabileceği statik kabiliyet sahipliği meta verileri için kullanın.

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

| Alan                             | Tür        | Anlamı                                                                    |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory kimlikleri, şu anda `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Paketli bir Plugin'in tool-result middleware kaydedebileceği çalışma zamanı kimlikleri. |
| `externalAuthProviders`          | `string[]` | Bu Plugin'in sahip olduğu harici kimlik doğrulama profili hook'una ait sağlayıcı kimlikleri. |
| `speechProviders`                | `string[]` | Bu Plugin'in sahip olduğu konuşma sağlayıcısı kimlikleri.                 |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı ses sağlayıcısı kimlikleri.      |
| `memoryEmbeddingProviders`       | `string[]` | Bu Plugin'in sahip olduğu bellek embedding sağlayıcısı kimlikleri.        |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin'in sahip olduğu medya anlama sağlayıcısı kimlikleri.            |
| `imageGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu görüntü oluşturma sağlayıcısı kimlikleri.       |
| `videoGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu video oluşturma sağlayıcısı kimlikleri.         |
| `webFetchProviders`              | `string[]` | Bu Plugin'in sahip olduğu web fetch sağlayıcısı kimlikleri.               |
| `webSearchProviders`             | `string[]` | Bu Plugin'in sahip olduğu web search sağlayıcısı kimlikleri.              |
| `migrationProviders`             | `string[]` | `openclaw migrate` için bu Plugin'in sahip olduğu içe aktarma sağlayıcısı kimlikleri. |
| `tools`                          | `string[]` | Bu Plugin'in sahip olduğu ajan aracı adları.                              |

`contracts.embeddedExtensionFactories`, paketli Codex yalnızca app-server extension factory'leri için korunur. Paketli tool-result dönüşümleri bunun yerine `contracts.agentToolResultMiddleware` bildirmeli ve `api.registerAgentToolResultMiddleware(...)` ile kaydolmalıdır. Harici Plugin'ler tool-result middleware kaydedemez, çünkü bu seam, model görmeden önce yüksek güvenli araç çıktısını yeniden yazabilir.

Çalışma zamanı `api.registerTool(...)` kayıtları `contracts.tools` ile eşleşmelidir. Araç keşfi, istenen araçların sahibi olabilecek yalnızca Plugin çalışma zamanlarını yüklemek için bu listeyi kullanır.

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'leri `contracts.externalAuthProviders` bildirmelidir. Bildirimi olmayan Plugin'ler hâlâ kullanımdan kaldırılmış bir uyumluluk fallback'i üzerinden çalışır, ancak bu fallback daha yavaştır ve geçiş penceresinden sonra kaldırılacaktır.

Paketli bellek embedding sağlayıcıları, `local` gibi yerleşik adaptörler dahil, gösterdikleri her adaptör kimliği için `contracts.memoryEmbeddingProviders` bildirmelidir. Bağımsız CLI yolları, tam Gateway çalışma zamanı sağlayıcıları kaydetmeden önce yalnızca sahip Plugin'i yüklemek için bu manifest sözleşmesini kullanır.

## mediaUnderstandingProviderMetadata başvurusu

`mediaUnderstandingProviderMetadata`, bir medya anlama sağlayıcısının çalışma zamanı yüklenmeden önce genel core yardımcılarının ihtiyaç duyduğu varsayılan modelleri, otomatik kimlik doğrulama fallback önceliği veya yerel belge desteği olduğunda kullanılır. Anahtarlar ayrıca `contracts.mediaUnderstandingProviders` içinde bildirilmelidir.

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

| Alan                   | Tür                                 | Anlamı                                                                        |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Bu sağlayıcının sunduğu medya kabiliyetleri.                                  |
| `defaultModels`        | `Record<string, string>`            | Config bir model belirtmediğinde kullanılan kabiliyetten modele varsayılanlar. |
| `autoPriority`         | `Record<string, number>`            | Otomatik kimlik bilgisi tabanlı sağlayıcı fallback'i için daha düşük sayılar daha önce sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Sağlayıcı tarafından desteklenen yerel belge girişleri.                       |

## channelConfigs başvurusu

`channelConfigs`, bir kanal Plugin'inin çalışma zamanı yüklenmeden önce ucuz config meta verilerine ihtiyaç duyduğu durumlarda kullanılır. Salt okunur kanal kurulum/durum keşfi, kurulum girdisi olmadığında veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildirdiğinde, yapılandırılmış harici kanallar için bu meta verileri doğrudan kullanabilir.

`channelConfigs`, Plugin manifest meta verileridir; yeni bir üst düzey kullanıcı config bölümü değildir. Kullanıcılar kanal örneklerini hâlâ `channels.<channel-id>` altında yapılandırır. OpenClaw, Plugin çalışma zamanı kodu yürütülmeden önce bu yapılandırılmış kanalın hangi Plugin'e ait olduğuna karar vermek için manifest meta verilerini okur.

Bir kanal Plugin'i için `configSchema` ve `channelConfigs` farklı yolları açıklar:

- `configSchema`, `plugins.entries.<plugin-id>.config` değerini doğrular
- `channelConfigs.<channel-id>.schema`, `channels.<channel-id>` değerini doğrular

`channels[]` bildiren paketli olmayan Plugin'ler eşleşen `channelConfigs` girdileri de bildirmelidir. Bunlar olmadan OpenClaw Plugin'i hâlâ yükleyebilir, ancak cold-path config şeması, kurulum ve Control UI yüzeyleri, Plugin çalışma zamanı yürütülene kadar kanala ait seçenek şeklinin ne olduğunu bilemez.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` ve `nativeSkillsAutoEnabled`, kanal çalışma zamanı yüklenmeden önce çalışan komut config denetimleri için statik `auto` varsayılanları bildirebilir. Paketli kanallar aynı varsayılanları, paketlerine ait diğer kanal katalog meta verileriyle birlikte `package.json#openclaw.channel.commands` üzerinden de yayımlayabilir.

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

| Alan         | Tür                      | Anlamı                                                                                    |
| ------------ | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`     | `object`                 | `channels.<id>` için JSON Schema. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`    | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucuları/hassas ipuçları. |
| `label`      | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`               | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                  |
| `commands`   | `object`                 | Çalışma zamanı öncesi yapılandırma denetimleri için statik yerel komut ve yerel skill otomatik varsayılanları. |
| `preferOver` | `string[]`               | Bu kanalın seçim yüzeylerinde önüne geçmesi gereken eski veya daha düşük öncelikli Plugin kimlikleri. |

### Başka bir kanal Plugin’ini değiştirme

Plugin’iniz, başka bir Plugin’in de sağlayabildiği bir kanal kimliği için tercih edilen sahip olduğunda `preferOver` kullanın. Yaygın durumlar, yeniden adlandırılmış bir Plugin kimliği, paketlenmiş bir Plugin’in yerini alan bağımsız bir Plugin veya yapılandırma uyumluluğu için aynı kanal kimliğini koruyan bakımlı bir fork’tur.

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

`channels.chat` yapılandırıldığında, OpenClaw hem kanal kimliğini hem de tercih edilen Plugin kimliğini dikkate alır. Daha düşük öncelikli Plugin yalnızca paketlenmiş olduğu veya varsayılan olarak etkinleştirildiği için seçildiyse, OpenClaw onu etkili çalışma zamanı yapılandırmasında devre dışı bırakır; böylece kanalın ve araçlarının sahibi tek bir Plugin olur. Açık kullanıcı seçimi yine önceliklidir: kullanıcı her iki Plugin’i de açıkça etkinleştirirse, OpenClaw bu seçimi korur ve istenen Plugin kümesini sessizce değiştirmek yerine yinelenen kanal/araç tanılamaları bildirir.

`preferOver` kapsamını gerçekten aynı kanalı sağlayabilen Plugin kimlikleriyle sınırlı tutun. Bu genel bir öncelik alanı değildir ve kullanıcı yapılandırma anahtarlarını yeniden adlandırmaz.

## modelSupport başvurusu

OpenClaw’ın, Plugin çalışma zamanı yüklenmeden önce sağlayıcı Plugin’inizi `gpt-5.5` veya `claude-sonnet-4.6` gibi kısa model kimliklerinden çıkarması gerektiğinde `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw bu öncelik sırasını uygular:

- açık `provider/model` başvuruları, sahibi olan `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes` karşısında önceliklidir
- paketlenmemiş bir Plugin ve paketlenmiş bir Plugin ikisi de eşleşirse, paketlenmemiş Plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                         |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleştirilen önekler.           |
| `modelPatterns` | `string[]` | Profil soneki kaldırıldıktan sonra kısa model kimliklerine karşı eşleştirilen Regex kaynakları. |

## modelCatalog başvurusu

OpenClaw’ın sağlayıcı model meta verilerini Plugin çalışma zamanı yüklenmeden önce bilmesi gerektiğinde `modelCatalog` kullanın. Bu, sabit katalog satırları, sağlayıcı takma adları, bastırma kuralları ve keşif modu için manifest’e ait kaynaktır. Çalışma zamanı yenilemesi hâlâ sağlayıcı çalışma zamanı koduna aittir, ancak manifest çekirdeğe çalışma zamanının ne zaman gerekli olduğunu söyler.

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

| Alan           | Tür                                                      | Anlamı                                                                                                      |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Bu Plugin’in sahibi olduğu sağlayıcı kimlikleri için katalog satırları. Anahtarlar üst düzey `providers` içinde de yer almalıdır. |
| `aliases`      | `Record<string, object>`                                 | Katalog veya bastırma planlaması için sahibi olunan bir sağlayıcıya çözümlenmesi gereken sağlayıcı takma adları. |
| `suppressions` | `object[]`                                               | Bu Plugin’in sağlayıcıya özgü bir nedenle bastırdığı, başka bir kaynaktan gelen model satırları.             |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Sağlayıcı kataloğunun manifest meta verilerinden okunup okunamayacağı, önbelleğe yenilenip yenilenemeyeceği veya çalışma zamanı gerektirip gerektirmediği. |

`aliases`, model kataloğu planlaması için sağlayıcı sahipliği aramasına katılır. Takma ad hedefleri, aynı Plugin’in sahibi olduğu üst düzey sağlayıcılar olmalıdır. Sağlayıcıya göre filtrelenmiş bir liste bir takma ad kullandığında, OpenClaw sahibi olan manifest’i okuyabilir ve sağlayıcı çalışma zamanını yüklemeden takma ad API/base URL geçersiz kılmalarını uygulayabilir.
Takma adlar filtrelenmemiş katalog listelerini genişletmez; geniş listeler yalnızca sahibi olunan kanonik sağlayıcı satırlarını yayar.

`suppressions`, eski sağlayıcı çalışma zamanı `suppressBuiltInModel` kancasının yerini alır. Bastırma girdileri yalnızca sağlayıcının sahibi Plugin olduğunda veya sahibi olunan bir sağlayıcıyı hedefleyen bir `modelCatalog.aliases` anahtarı olarak bildirildiğinde dikkate alınır. Model çözümleme sırasında çalışma zamanı bastırma kancaları artık çağrılmaz.

Sağlayıcı alanları:

| Alan      | Tür                      | Anlamı                                                           |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| `baseUrl` | `string`                 | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan base URL. |
| `api`     | `ModelApi`               | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan API bağdaştırıcısı. |
| `headers` | `Record<string, string>` | Bu sağlayıcı kataloğuna uygulanan isteğe bağlı statik başlıklar. |
| `models`  | `object[]`               | Gerekli model satırları. `id` olmayan satırlar yok sayılır.       |

Model alanları:

| Alan            | Tür                                                            | Anlamı                                                                       |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` öneki olmadan, sağlayıcıya yerel model kimliği.                  |
| `name`          | `string`                                                       | İsteğe bağlı görüntü adı.                                                     |
| `api`           | `ModelApi`                                                     | İsteğe bağlı model başına API geçersiz kılması.                               |
| `baseUrl`       | `string`                                                       | İsteğe bağlı model başına base URL geçersiz kılması.                          |
| `headers`       | `Record<string, string>`                                       | İsteğe bağlı model başına statik başlıklar.                                   |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modelin kabul ettiği modaliteler.                                             |
| `reasoning`     | `boolean`                                                      | Modelin reasoning davranışı sunup sunmadığı.                                  |
| `contextWindow` | `number`                                                       | Yerel sağlayıcı bağlam penceresi.                                             |
| `contextTokens` | `number`                                                       | `contextWindow` değerinden farklı olduğunda isteğe bağlı etkili çalışma zamanı bağlam sınırı. |
| `maxTokens`     | `number`                                                       | Bilindiğinde maksimum çıktı token’ları.                                       |
| `cost`          | `object`                                                       | İsteğe bağlı `tieredPricing` dahil, milyon token başına isteğe bağlı USD fiyatlandırması. |
| `compat`        | `object`                                                       | OpenClaw model yapılandırma uyumluluğuyla eşleşen isteğe bağlı uyumluluk bayrakları. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listeleme durumu. Yalnızca satır hiç görünmemesi gerektiğinde bastırın.       |
| `statusReason`  | `string`                                                       | Kullanılabilir olmayan durumla birlikte gösterilen isteğe bağlı neden.        |
| `replaces`      | `string[]`                                                     | Bu modelin yerini aldığı eski sağlayıcıya yerel model kimlikleri.             |
| `replacedBy`    | `string`                                                       | Kullanımdan kaldırılmış satırlar için yerine geçen sağlayıcıya yerel model kimliği. |
| `tags`          | `string[]`                                                     | Seçiciler ve filtreler tarafından kullanılan kararlı etiketler.               |

Bastırma alanları:

| Alan                       | Tür        | Anlamı                                                                                                      |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Bastırılacak üst kaynak satırı için sağlayıcı kimliği. Bu Plugin’in sahibi olmalı veya sahibi olunan bir takma ad olarak bildirilmelidir. |
| `model`                    | `string`   | Bastırılacak sağlayıcıya yerel model kimliği.                                                               |
| `reason`                   | `string`   | Bastırılan satır doğrudan istendiğinde gösterilen isteğe bağlı ileti.                                       |
| `when.baseUrlHosts`        | `string[]` | Bastırma uygulanmadan önce gerekli olan etkili sağlayıcı base URL host’larının isteğe bağlı listesi.         |
| `when.providerConfigApiIn` | `string[]` | Bastırma uygulanmadan önce gerekli olan tam sağlayıcı yapılandırması `api` değerlerinin isteğe bağlı listesi. |

Çalışma zamanına özel verileri `modelCatalog` içine koymayın. `static` değerini yalnızca manifest
satırları, sağlayıcıya göre filtrelenmiş liste ve seçici yüzeylerinin registry/çalışma zamanı
keşfini atlaması için yeterince eksiksiz olduğunda kullanın. Manifest satırları
listelenebilir başlangıç kayıtları veya ekler olarak yararlıysa ancak yenileme/önbellek daha sonra
daha fazla satır ekleyebiliyorsa `refreshable` kullanın;
refreshable satırlar tek başına yetkili değildir. Listeyi bilmek için OpenClaw'ın
sağlayıcı çalışma zamanını yüklemesi gerektiğinde `runtime` kullanın.

## modelIdNormalization başvurusu

Sağlayıcı çalışma zamanı yüklenmeden önce gerçekleşmesi gereken düşük maliyetli,
sağlayıcıya ait model kimliği temizliği için `modelIdNormalization` kullanın. Bu,
kısa model adları, sağlayıcıya yerel eski kimlikler ve proxy önek kuralları gibi
alias'ları çekirdek model seçimi tabloları yerine sahip Plugin
manifestinde tutar.

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

| Alan                                 | Tür                     | Anlamı                                                                                   |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Büyük/küçük harfe duyarsız tam model kimliği alias'ları. Değerler yazıldığı gibi döner.  |
| `stripPrefixes`                      | `string[]`              | Alias aramasından önce kaldırılacak önekler; eski sağlayıcı/model yinelemeleri için yararlıdır. |
| `prefixWhenBare`                     | `string`                | Normalleştirilmiş model kimliği zaten `/` içermediğinde eklenecek önek.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Alias aramasından sonra `modelPrefix` ve `prefix` ile anahtarlanan koşullu çıplak kimlik önek kuralları. |

## providerEndpoints başvurusu

Sağlayıcı çalışma zamanı yüklenmeden önce genel istek politikasının bilmesi
gereken uç nokta sınıflandırması için `providerEndpoints` kullanın. Çekirdek hâlâ her
`endpointClass` değerinin anlamına sahip olur; Plugin manifestleri host ve temel URL
metaverilerine sahip olur.

Uç nokta alanları:

| Alan                           | Tür        | Anlamı                                                                                         |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`, `moonshot-native` veya `google-vertex` gibi bilinen çekirdek uç nokta sınıfı.    |
| `hosts`                        | `string[]` | Uç nokta sınıfıyla eşleşen tam host adları.                                                     |
| `hostSuffixes`                 | `string[]` | Uç nokta sınıfıyla eşleşen host sonekleri. Yalnızca alan adı soneki eşleşmesi için `.` ile önekleyin. |
| `baseUrls`                     | `string[]` | Uç nokta sınıfıyla eşleşen tam normalleştirilmiş HTTP(S) temel URL'leri.                       |
| `googleVertexRegion`           | `string`   | Tam global hostlar için statik Google Vertex bölgesi.                                          |
| `googleVertexRegionHostSuffix` | `string`   | Google Vertex bölge önekini açığa çıkarmak için eşleşen hostlardan çıkarılacak sonek.          |

## providerRequest başvurusu

Genel istek politikasının sağlayıcı çalışma zamanını yüklemeden ihtiyaç duyduğu
düşük maliyetli istek uyumluluğu metaverileri için `providerRequest` kullanın.
Davranışa özel yük yeniden yazımını sağlayıcı çalışma zamanı hook'larında veya
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
| `family`              | `string`     | Genel istek uyumluluğu kararları ve tanılarında kullanılan sağlayıcı ailesi etiketi.   |
| `compatibilityFamily` | `"moonshot"` | Paylaşılan istek yardımcıları için isteğe bağlı sağlayıcı ailesi uyumluluk grubu.      |
| `openAICompletions`   | `object`     | OpenAI uyumlu completions isteği bayrakları; şu anda `supportsStreamingUsage`.         |

## modelPricing başvurusu

Bir sağlayıcının çalışma zamanı yüklenmeden önce kontrol düzlemi fiyatlandırma
davranışına ihtiyacı olduğunda `modelPricing` kullanın. Gateway fiyatlandırma
önbelleği bu metaverileri sağlayıcı çalışma zamanı kodunu içe aktarmadan okur.

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
| `external`   | `boolean`         | OpenRouter veya LiteLLM fiyatlandırmasını asla almaması gereken yerel/kendi barındırdığı sağlayıcılar için `false` ayarlayın. |
| `openRouter` | `false \| object` | OpenRouter fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için OpenRouter aramasını devre dışı bırakır. |
| `liteLLM`    | `false \| object` | LiteLLM fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için LiteLLM aramasını devre dışı bırakır. |

Kaynak alanları:

| Alan                       | Tür                | Anlamı                                                                                                             |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw sağlayıcı kimliğinden farklı olduğunda harici katalog sağlayıcı kimliği; örneğin bir `zai` sağlayıcısı için `z-ai`. |
| `passthroughProviderModel` | `boolean`          | Eğik çizgi içeren model kimliklerini iç içe sağlayıcı/model başvuruları olarak ele alır; OpenRouter gibi proxy sağlayıcılar için yararlıdır. |
| `modelIdTransforms`        | `"version-dots"[]` | Ek harici katalog model kimliği varyantları. `version-dots`, `claude-opus-4.6` gibi noktalı sürüm kimliklerini dener. |

### OpenClaw Sağlayıcı Dizini

OpenClaw Sağlayıcı Dizini, Plugin'leri henüz kurulmamış olabilecek sağlayıcılar
için OpenClaw'a ait önizleme metaverileridir. Bir Plugin manifestinin parçası
değildir. Plugin manifestleri kurulu Plugin yetkisi olmaya devam eder. Sağlayıcı Dizini,
gelecekteki kurulabilir sağlayıcı ve kurulum öncesi model seçici yüzeylerinin,
bir sağlayıcı Plugin'i kurulu olmadığında tüketeceği dahili yedek sözleşmedir.

Katalog yetki sırası:

1. Kullanıcı yapılandırması.
2. Kurulu Plugin manifesti `modelCatalog`.
3. Açık yenilemeden gelen model kataloğu önbelleği.
4. OpenClaw Sağlayıcı Dizini önizleme satırları.

Sağlayıcı Dizini sırlar, etkin durum, çalışma zamanı hook'ları veya
canlı hesaba özel model verileri içermemelidir. Önizleme katalogları, Plugin
manifestleriyle aynı `modelCatalog` sağlayıcı satırı biçimini kullanır, ancak `api`,
`baseUrl`, fiyatlandırma veya uyumluluk bayrakları gibi çalışma zamanı adaptörü
alanları kasıtlı olarak kurulu Plugin manifestiyle hizalı tutulmadıkça kararlı
görüntüleme metaverileriyle sınırlı kalmalıdır. Canlı `/models` keşfi olan
sağlayıcılar, normal listeleme veya onboarding işlemlerinin sağlayıcı API'lerini
çağırması yerine yenilenmiş satırları açık model kataloğu önbellek yolu üzerinden
yazmalıdır.

Sağlayıcı Dizini girdileri, Plugin'i çekirdekten çıkarılmış veya başka şekilde
henüz kurulmamış sağlayıcılar için kurulabilir Plugin metaverileri de taşıyabilir.
Bu metaveriler kanal kataloğu desenini yansıtır: paket adı, npm kurulum belirtimi,
beklenen bütünlük ve düşük maliyetli kimlik doğrulama seçimi etiketleri,
kurulabilir bir kurulum seçeneği göstermek için yeterlidir. Plugin kurulduktan
sonra manifesti kazanır ve Sağlayıcı Dizini girdisi o sağlayıcı için yok sayılır.

Eski üst düzey kabiliyet anahtarları kullanım dışıdır. `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` ve `webSearchProviders` değerlerini `contracts` altına taşımak
için `openclaw doctor --fix` kullanın; normal manifest yükleme artık bu üst düzey
alanları kabiliyet sahipliği olarak ele almaz.

## Manifest ile package.json karşılaştırması

İki dosya farklı işlere hizmet eder:

| Dosya                  | Kullanım amacı                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce var olması gereken keşif, yapılandırma doğrulama, kimlik doğrulama seçimi metaverileri ve UI ipuçları |
| `package.json`         | npm metaverileri, bağımlılık kurulumu ve giriş noktaları, kurulum kapısı, kurulum veya katalog metaverileri için kullanılan `openclaw` bloğu |

Bir metaveri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw'ın bunu Plugin kodunu yüklemeden önce bilmesi gerekiyorsa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi Plugin metaverileri kasıtlı olarak `openclaw.plugin.json`
yerine `package.json` içindeki `openclaw` bloğunda bulunur.
`openclaw.bundle` ve `openclaw.bundle.json`, OpenClaw Plugin sözleşmeleri değildir;
yerel Plugin'ler `openclaw.plugin.json` ile aşağıdaki desteklenen
`package.json#openclaw` alanlarını kullanmalıdır.

Önemli örnekler:

| Alan                                                                                       | Ne anlama gelir                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Yerel Plugin giriş noktalarını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                                                                            |
| `openclaw.runtimeExtensions`                                                               | Yüklü paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                                 |
| `openclaw.setupEntry`                                                                      | İlk kurulum, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif, yalnızca kurulum giriş noktası. Plugin paket dizininin içinde kalmalıdır.      |
| `openclaw.runtimeSetupEntry`                                                               | Yüklü paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. `setupEntry` gerektirir, mevcut olmalı ve Plugin paket dizininin içinde kalmalıdır.                                |
| `openclaw.channel`                                                                         | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog meta verileri.                                                                                        |
| `openclaw.channel.commands`                                                                | Kanal çalışma zamanı yüklenmeden önce config, denetim ve komut listesi yüzeyleri tarafından kullanılan statik yerel komut ve yerel skill otomatik varsayılan meta verileri.                   |
| `openclaw.channel.configuredState`                                                         | Tam kanal çalışma zamanını yüklemeden "yalnızca env kurulumu zaten var mı?" sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyici meta verileri.                                    |
| `openclaw.channel.persistedAuthState`                                                      | Tam kanal çalışma zamanını yüklemeden "zaten oturum açılmış bir şey var mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama denetleyici meta verileri.                                 |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Paketlenmiş ve dışarıda yayımlanan Plugin'ler için yükleme/güncelleme ipuçları.                                                                                                               |
| `openclaw.install.defaultChoice`                                                           | Birden fazla yükleme kaynağı mevcut olduğunda tercih edilen yükleme yolu.                                                                                                                     |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` veya `>=2026.5.1-beta.1` gibi semver alt sınırı kullanan, desteklenen en düşük OpenClaw host sürümü.                                                                            |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` gibi beklenen npm dist bütünlük dizesi; yükleme ve güncelleme akışları getirilen yapıtı buna göre doğrular.                                                                      |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Config geçersiz olduğunda dar kapsamlı bir paketlenmiş Plugin yeniden yükleme kurtarma yoluna izin verir.                                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Başlatma sırasında tam kanal Plugin'inden önce yalnızca kurulum kanal yüzeylerinin yüklenmesine izin verir.                                                                                    |

Manifest meta verileri, çalışma zamanı yüklenmeden önce ilk kurulumda hangi sağlayıcı/kanal/kurulum seçeneklerinin görüneceğine karar verir. `package.json#openclaw.install`, kullanıcı bu seçeneklerden birini seçtiğinde ilk kuruluma ilgili Plugin'i nasıl getireceğini veya etkinleştireceğini söyler. Yükleme ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, paketlenmemiş Plugin kaynakları için yükleme ve manifest registry yükleme sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler, eski host'larda harici Plugin'leri atlar. Paketlenmiş kaynak Plugin'lerin host checkout'ı ile aynı sürümde olduğu varsayılır.

Resmi isteğe bağlı yükleme meta verileri, Plugin ClawHub üzerinde yayımlandığında `clawhubSpec` kullanmalıdır; ilk kurulum bunu tercih edilen uzak kaynak olarak ele alır ve yüklemeden sonra ClawHub yapıt bilgilerini kaydeder. `npmSpec`, henüz ClawHub'a taşınmamış paketler için uyumluluk yedeği olarak kalır.

Kesin npm sürüm sabitlemesi zaten `npmSpec` içinde bulunur, örneğin `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmi harici katalog girdileri, güncelleme akışlarının getirilen npm yapıtı artık sabitlenen sürümle eşleşmiyorsa kapalı şekilde başarısız olması için kesin spec'leri `expectedIntegrity` ile eşleştirmelidir. Etkileşimli ilk kurulum, uyumluluk için çıplak paket adları ve dist-tag'ler dahil güvenilir registry npm spec'lerini sunmaya devam eder. Katalog tanılamaları kesin, kayan, bütünlük sabitlenmiş, bütünlüğü eksik, paket adı uyuşmayan ve geçersiz varsayılan seçim kaynaklarını ayırt edebilir. Ayrıca `expectedIntegrity` mevcutken onu sabitleyebilecek geçerli bir npm kaynağı olmadığında uyarı verirler. `expectedIntegrity` mevcut olduğunda yükleme/güncelleme akışları bunu zorunlu kılar; atlandığında registry çözümlemesi bütünlük sabitlemesi olmadan kaydedilir.

Kanal Plugin'leri; durum, kanal listesi veya SecretRef taramaları tam çalışma zamanını yüklemeden yapılandırılmış hesapları tanımlamaya ihtiyaç duyduğunda `openclaw.setupEntry` sağlamalıdır. Kurulum girişi, kanal meta verilerinin yanı sıra kurulum açısından güvenli config, durum ve sır adaptörlerini açığa çıkarmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve taşıma çalışma zamanlarını ana uzantı giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanları için paket sınırı denetimlerini geçersiz kılmaz. Örneğin `openclaw.runtimeExtensions`, dışarı kaçan bir `openclaw.extensions` yolunu yüklenebilir hale getiremez.

`openclaw.install.allowInvalidConfigRecovery` özellikle dar kapsamlıdır. Rastgele bozuk config'leri yüklenebilir yapmaz. Bugün yalnızca eksik paketlenmiş Plugin yolu veya aynı paketlenmiş Plugin için eski bir `channels.<id>` girdisi gibi belirli eski paketlenmiş Plugin yükseltme hatalarından yükleme akışlarının kurtulmasına izin verir. İlgisiz config hataları yüklemeyi yine engeller ve operatörleri `openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modül için paket meta verisidir:

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

Bunu kurulum, doctor, durum veya salt okunur varlık akışları tam kanal Plugin'i yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğunda kullanın. Kalıcı kimlik doğrulama durumu, yapılandırılmış kanal durumu değildir: bu meta veriyi Plugin'leri otomatik etkinleştirmek, çalışma zamanı bağımlılıklarını onarmak veya bir kanal çalışma zamanının yüklenip yüklenmeyeceğine karar vermek için kullanmayın. Hedef export yalnızca kalıcı durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel'ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca env yapılandırma denetimleri için aynı şekli izler:

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

Bunu bir kanal yapılandırılmış durumu env veya diğer küçük çalışma zamanı dışı girdilerden yanıtlayabildiğinde kullanın. Denetim tam config çözümlemesi veya gerçek kanal çalışma zamanı gerektiriyorsa, bu mantığı bunun yerine Plugin `config.hasConfiguredState` hook'unda tutun.

## Keşif önceliği (yinelenen Plugin id'leri)

OpenClaw, Plugin'leri çeşitli köklerden keşfeder (paketlenmiş, global yükleme, workspace, açıkça config ile seçilmiş yollar). İki keşif aynı `id` değerini paylaşıyorsa yalnızca **en yüksek öncelikli** manifest tutulur; daha düşük öncelikli kopyalar yanında yüklenmek yerine bırakılır.

Öncelik, en yüksekten en düşüğe:

1. **Config ile seçilmiş** — `plugins.entries.<id>` içinde açıkça sabitlenmiş bir yol
2. **Paketlenmiş** — OpenClaw ile birlikte gelen Plugin'ler
3. **Global yükleme** — global OpenClaw Plugin köküne yüklenmiş Plugin'ler
4. **Workspace** — geçerli workspace'e göre keşfedilen Plugin'ler

Sonuçlar:

- Workspace içinde duran çatallanmış veya eski bir paketlenmiş Plugin kopyası, paketlenmiş derlemeyi gölgelemez.
- Paketlenmiş bir Plugin'i gerçekten yerel bir Plugin ile geçersiz kılmak için workspace keşfine güvenmek yerine `plugins.entries.<id>` üzerinden sabitleyin; böylece öncelikle kazanır.
- Yinelenen kopya bırakmaları günlüğe yazılır, böylece Doctor ve başlangıç tanılamaları atılan kopyayı gösterebilir.
- Config ile seçilmiş yinelenen geçersiz kılmalar, tanılamalarda açık geçersiz kılmalar olarak ifade edilir, ancak eski çatallar ve kazara gölgelemeler görünür kalsın diye yine de uyarı verir.

## JSON Schema gereksinimleri

- **Her Plugin bir JSON Schema ile gelmelidir**, config kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, config okuma/yazma sırasında doğrulanır.
- Paketlenmiş bir Plugin'i yeni config anahtarlarıyla genişletirken veya çatallarken, aynı anda o Plugin'in `openclaw.plugin.json` `configSchema` alanını güncelleyin. Paketlenmiş Plugin şemaları katıdır; bu nedenle kullanıcı config'ine `configSchema.properties` içine `myNewKey` eklemeden `plugins.entries.<id>.config.myNewKey` eklemek, Plugin çalışma zamanı yüklenmeden önce reddedilir.

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

- Bilinmeyen `channels.*` anahtarları, kanal id'si bir Plugin manifesti tarafından bildirilmediği sürece **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*` **keşfedilebilir** Plugin id'lerine başvurmalıdır. Bilinmeyen id'ler **hatadır**.
- Bir Plugin yüklüyse ancak manifesti veya şeması bozuk ya da eksikse doğrulama başarısız olur ve Doctor Plugin hatasını bildirir.
- Plugin config'i mevcutsa ancak Plugin **devre dışıysa**, config korunur ve Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için [Yapılandırma başvurusu](/tr/gateway/configuration) bölümüne bakın.

## Notlar

- Bildirim, **yerel dosya sistemi yüklemeleri dahil yerel OpenClaw Plugin’leri için zorunludur**. Çalışma zamanı Plugin modülünü yine ayrı olarak yükler; bildirim yalnızca keşif + doğrulama içindir.
- Yerel bildirimler JSON5 ile ayrıştırılır; bu nedenle son değer yine bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Bildirim yükleyicisi yalnızca belgelenmiş bildirim alanlarını okur. Özel üst düzey anahtarlardan kaçının.
- Bir Plugin bunlara ihtiyaç duymadığında `channels`, `providers`, `cliBackends` ve `skills` tümüyle atlanabilir.
- `providerDiscoveryEntry` hafif kalmalı ve geniş çalışma zamanı kodunu içe aktarmamalıdır; bunu istek zamanı yürütmesi için değil, statik sağlayıcı katalog meta verileri veya dar keşif tanımlayıcıları için kullanın.
- Özel Plugin türleri `plugins.slots.*` üzerinden seçilir: `plugins.slots.memory` aracılığıyla `kind: "memory"`, `plugins.slots.contextEngine` aracılığıyla `kind: "context-engine"` (varsayılan `legacy`).
- Özel Plugin türünü bu bildirimde beyan edin. Çalışma zamanı girişi `OpenClawPluginDefinition.kind` kullanımdan kaldırılmıştır ve yalnızca eski Plugin’ler için uyumluluk geri dönüşü olarak kalır.
- Ortam değişkeni meta verileri (`setup.providers[].envVars`, kullanımdan kaldırılmış `providerAuthEnvVars` ve `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, Cron teslim doğrulaması ve diğer salt okunur yüzeyler, bir ortam değişkenini yapılandırılmış olarak değerlendirmeden önce yine Plugin güvenini ve etkin aktivasyon politikasını uygular.
- Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı meta verileri için bkz. [Sağlayıcı çalışma zamanı hook’ları](/tr/plugins/architecture-internals#provider-runtime-hooks).
- Plugin’iniz yerel modüllere bağlıysa derleme adımlarını ve tüm paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## İlgili

<CardGroup cols={3}>
  <Card title="Building plugins" href="/tr/plugins/building-plugins" icon="rocket">
    Plugin’lerle başlarken.
  </Card>
  <Card title="Plugin architecture" href="/tr/plugins/architecture" icon="diagram-project">
    İç mimari ve yetenek modeli.
  </Card>
  <Card title="SDK overview" href="/tr/plugins/sdk-overview" icon="book">
    Plugin SDK referansı ve alt yol içe aktarımları.
  </Card>
</CardGroup>
