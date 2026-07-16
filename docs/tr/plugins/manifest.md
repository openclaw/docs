---
read_when:
    - Bir OpenClaw plugini geliştiriyorsunuz
    - Bir Plugin yapılandırma şeması yayımlamanız veya Plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin bildirimi
x-i18n:
    generated_at: "2026-07-16T17:38:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a858e0bba9ee47dd7ce96413f744818d721420549a0c9af82b72a5572e758c7
    source_path: plugins/manifest.md
    workflow: 16
---

Bu sayfa, **yerel OpenClaw plugin manifestini**, `openclaw.plugin.json` kapsar. Uyumlu paket düzenleri (Codex, Claude, Cursor) için [Plugin paketleri](/tr/plugins/bundles) bölümüne bakın.

Uyumlu paket biçimleri bunun yerine kendi manifest dosyalarını kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşen düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu düzenleri otomatik olarak algılar ancak aşağıdaki `openclaw.plugin.json` şemasına göre doğrulamaz. Uyumlu bir pakette, düzen OpenClaw'ın çalışma zamanı beklentileriyle eşleştiğinde OpenClaw paket meta verilerini, bildirilen skill köklerini, Claude komut köklerini, Claude `settings.json` varsayılanlarını, Claude LSP varsayılanlarını ve desteklenen hook paketlerini okur.

Her yerel OpenClaw plugini, **plugin kökünde** `openclaw.plugin.json` dosyasını **mutlaka** sağlamalıdır. OpenClaw, **plugin kodunu çalıştırmadan** yapılandırmayı doğrulamak için bu dosyayı okur. Eksik veya geçersiz bir manifest, yapılandırma doğrulamasını engeller ve plugin hatası olarak değerlendirilir.

Plugin sisteminin tam kılavuzu için [Pluginler](/tr/tools/plugin), yerel yetenek modeli ve güncel harici uyumluluk yönergeleri için [Yetenek modeli](/tr/plugins/architecture#public-capability-model) bölümüne bakın.

## Bu dosyanın yaptığı işler

`openclaw.plugin.json`, OpenClaw'ın **plugin kodunuzu yüklemeden önce** okuduğu meta verilerdir. İçindeki her şey, plugin çalışma zamanını başlatmadan incelenebilecek kadar düşük maliyetli olmalıdır.

**Şunlar için kullanın:**

- plugin kimliği, yapılandırma doğrulaması ve yapılandırma kullanıcı arayüzü ipuçları
- kimlik doğrulama, ilk katılım ve kurulum meta verileri (takma ad, otomatik etkinleştirme, sağlayıcı ortam değişkenleri, kimlik doğrulama seçenekleri)
- kontrol düzlemi yüzeyleri için etkinleştirme ipuçları
- kısa model ailesi sahipliği
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` ana makinesinin inceleyebileceği QA çalıştırıcı meta verileri
- katalog ve doğrulama yüzeyleriyle birleştirilen kanala özgü yapılandırma meta verileri

**Şunlar için kullanmayın:** çalışma zamanı davranışını kaydetmek, kod giriş noktalarını bildirmek veya npm kurulum meta verilerini tanımlamak. Bunlar plugin kodunuza ve `package.json` dosyasına aittir.

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

## Kapsamlı örnek

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter sağlayıcı plugini",
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
      "choiceLabel": "OpenRouter API anahtarı",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API anahtarı",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API anahtarı",
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

| Alan                                 | Gerekli  | Tür                          | Anlamı                                                                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | Evet     | `string`           | Standart plugin kimliği. Bu, `plugins.entries.<id>` içinde kullanılan kimliktir.                                                                                                                                                                                               |
| `configSchema`                   | Evet     | `object`           | Bu pluginin yapılandırması için satır içi JSON Schema.                                                                                                                                                                                                                     |
| `requiresPlugins`                   | Hayır    | `string[]`           | Bu pluginin etkili olabilmesi için ayrıca yüklenmesi gereken plugin kimlikleri. Keşif, pluginin yüklenebilir durumda kalmasını sağlar ancak gerekli pluginlerden biri eksik olduğunda uyarır.                                                                                |
| `enabledByDefault`                   | Hayır    | `true`           | Paketle birlikte gelen bir plugini varsayılan olarak etkin şeklinde işaretler. Pluginin varsayılan olarak devre dışı kalması için bunu atlayın veya `true` olmayan herhangi bir değere ayarlayın.                                                               |
| `enabledByDefaultOnPlatforms`                   | Hayır    | `string[]`           | Paketle birlikte gelen bir plugini yalnızca listelenen Node.js platformlarında (örneğin `["darwin"]`) varsayılan olarak etkin şeklinde işaretler. Açık yapılandırma yine önceliklidir.                                                                                |
| `legacyPluginIds`                   | Hayır    | `string[]`           | Bu standart plugin kimliğine normalleştirilen eski kimlikler.                                                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`                   | Hayır    | `string[]`           | Kimlik doğrulama, yapılandırma veya model referanslarında belirtildiklerinde bu plugini otomatik olarak etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                                                       |
| `kind`                   | Hayır    | `PluginKind \| PluginKind[]`           | `plugins.slots.*` tarafından kullanılan bir veya daha fazla özel plugin türünü (`"memory"`, `"context-engine"`) bildirir. Her iki yuvanın da sahibi olan bir plugin, iki türü de tek bir dizide bildirir.                                                           |
| `channels`                   | Hayır    | `string[]`           | Bu pluginin sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                                                                              |
| `providers`                   | Hayır    | `string[]`           | Bu pluginin sahip olduğu sağlayıcı kimlikleri.                                                                                                                                                                                                                             |
| `providerCatalogEntry`                   | Hayır    | `string`           | Tam plugin çalışma zamanını etkinleştirmeden yüklenebilen, manifest kapsamındaki sağlayıcı kataloğu meta verileri için plugin köküne göreli hafif sağlayıcı kataloğu modülü yolu.                                                                                          |
| `modelSupport`                   | Hayır    | `object`           | Plugini çalışma zamanından önce otomatik olarak yüklemek için kullanılan, manifestin sahip olduğu kısaltılmış model ailesi meta verileri.                                                                                                                                  |
| `modelCatalog`                   | Hayır    | `object`           | Bu pluginin sahip olduğu sağlayıcılar için bildirimsel model kataloğu meta verileri. Bu, plugin çalışma zamanını yüklemeden gelecekteki salt okunur listeleme, ilk katılım, model seçiciler, takma adlar ve engelleme için denetim düzlemi sözleşmesidir.                      |
| `modelPricing`                   | Hayır    | `object`           | Sağlayıcının sahip olduğu harici fiyatlandırma arama politikası. Yerel/kendi kendine barındırılan sağlayıcıları uzak fiyatlandırma kataloglarının dışında tutmak veya çekirdekte sağlayıcı kimliklerini sabit kodlamadan sağlayıcı referanslarını OpenRouter/LiteLLM katalog kimlikleriyle eşlemek için kullanın. |
| `modelIdNormalization`                   | Hayır    | `object`           | Sağlayıcı çalışma zamanı yüklenmeden önce çalışması gereken, sağlayıcının sahip olduğu model kimliği takma adı/ön eki temizliği.                                                                                                                                           |
| `providerEndpoints`                   | Hayır    | `object[]`           | Sağlayıcı çalışma zamanı yüklenmeden önce çekirdeğin sınıflandırması gereken sağlayıcı rotaları için manifestin sahip olduğu uç nokta ana makine/baseUrl meta verileri.                                                                                                    |
| `providerRequest`                   | Hayır    | `object`           | Sağlayıcı çalışma zamanı yüklenmeden önce genel istek politikası tarafından kullanılan düşük maliyetli sağlayıcı ailesi ve istek uyumluluğu meta verileri.                                                                                                                |
| `secretProviderIntegrations`                   | Hayır    | `Record<string, object>`           | Kurulum veya yükleme yüzeylerinin çekirdekte sağlayıcıya özgü entegrasyonları sabit kodlamadan sunabileceği bildirimsel SecretRef exec sağlayıcı ön ayarları.                                                                                                               |
| `cliBackends`                   | Hayır    | `string[]`           | Bu pluginin sahip olduğu CLI çıkarım arka ucu kimlikleri. Açık yapılandırma referanslarından başlangıçta otomatik etkinleştirme için kullanılır.                                                                                                                            |
| `syntheticAuthRefs`                   | Hayır    | `string[]`           | Çalışma zamanı yüklenmeden önceki soğuk model keşfi sırasında pluginin sahip olduğu sentetik kimlik doğrulama kancasının yoklanması gereken sağlayıcı veya CLI arka ucu referansları.                                                                                       |
| `nonSecretAuthMarkers`                   | Hayır    | `string[]`           | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketle birlikte gelen pluginin sahip olduğu yer tutucu API anahtarı değerleri.                                                                                                                 |
| `commandAliases`                   | Hayır    | `object[]`           | Çalışma zamanı yüklenmeden önce plugine duyarlı yapılandırma ve CLI tanılamaları üretmesi gereken, bu pluginin sahip olduğu komut adları.                                                                                                                                   |
| `providerAuthEnvVars`                   | Hayır    | `Record<string, string[]>`           | Sağlayıcı kimlik doğrulama/durum araması için kullanımdan kaldırılmış uyumluluk ortam meta verileri. Yeni pluginler için `setup.providers[].envVars` tercih edin; OpenClaw, kullanımdan kaldırma süresi boyunca bunu okumaya devam eder.                                             |
| `providerUsageAuthEnvVars`                   | Hayır    | `Record<string, string[]>`           | Yalnızca kullanım/faturalandırma amaçlı sağlayıcı kimlik bilgileri. OpenClaw bu adları kullanım keşfi ve gizli bilgi temizleme için kullanır ancak çıkarım kimlik doğrulaması için asla kullanmaz.                                                                          |
| `providerAuthAliases`                   | Hayır    | `Record<string, string>`           | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı.                                                      |
| `channelEnvVars`                   | Hayır    | `Record<string, string[]>`           | OpenClaw'un plugin kodunu yüklemeden inceleyebileceği düşük maliyetli kanal ortam meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam güdümlü kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın.                              |
| `providerAuthChoices`                   | Hayır    | `object[]`           | İlk katılım seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlantıları için düşük maliyetli kimlik doğrulama seçeneği meta verileri.                                                                                                                 |
| `activation`                   | Hayır    | `object`           | Başlangıç, sağlayıcı, komut, kanal, rota ve yetenek tetiklemeli yükleme için düşük maliyetli etkinleştirme planlayıcısı meta verileri. Yalnızca meta verilerdir; gerçek davranışın sahibi yine plugin çalışma zamanıdır.                                                    |
| `setup`                   | Hayır    | `object`           | Keşif ve kurulum yüzeylerinin plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/ilk katılım tanımlayıcıları.                                                                                                                                      |
| `qaRunners`                   | Hayır    | `object[]`           | Plugin çalışma zamanı yüklenmeden önce paylaşılan `openclaw qa` ana makinesi tarafından kullanılan düşük maliyetli QA çalıştırıcısı tanımlayıcıları.                                                                                                                  |
| `contracts`                   | Hayır    | `object`           | Harici kimlik doğrulama kancaları, gömmeler, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü/video/müzik üretimi, web getirme, web araması, worker sağlayıcıları, belge/web içeriği çıkarma ve araç sahipliği için statik yetenek sahipliği anlık görüntüsü. |
| `configContracts`                    | Hayır       | `object`                     | Genel çekirdek yardımcıları tarafından kullanılan, manifestin sahip olduğu yapılandırma davranışı: tehlikeli bayrak algılama, SecretRef geçiş hedefleri ve eski yapılandırma yolu daraltma. Bkz. [configContracts referansı](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | Hayır       | `Record<string, object>`     | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli medya anlama varsayılanları.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Hayır       | `Record<string, object>`     | Sağlayıcıya ait kimlik doğrulama takma adları ve temel URL korumaları dâhil olmak üzere, `contracts.imageGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli görüntü oluşturma kimlik doğrulama meta verileri.                                                                                                         |
| `videoGenerationProviderMetadata`    | Hayır       | `Record<string, object>`     | Sağlayıcıya ait kimlik doğrulama takma adları ve temel URL korumaları dâhil olmak üzere, `contracts.videoGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli video oluşturma kimlik doğrulama meta verileri.                                                                                                         |
| `musicGenerationProviderMetadata`    | Hayır       | `Record<string, object>`     | Sağlayıcıya ait kimlik doğrulama takma adları ve temel URL korumaları dâhil olmak üzere, `contracts.musicGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli müzik oluşturma kimlik doğrulama meta verileri.                                                                                                         |
| `toolMetadata`                       | Hayır       | `Record<string, object>`     | `contracts.tools` içinde bildirilen, Plugin'e ait araçlar için düşük maliyetli kullanılabilirlik meta verileri. Bir araç, yalnızca yapılandırma, ortam veya kimlik doğrulama kanıtı mevcutsa çalışma zamanını yüklemeliyse bunu kullanın.                                                                                                  |
| `channelConfigs`                     | Hayır       | `Record<string, object>`     | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, manifestin sahip olduğu kanal yapılandırma meta verileri.                                                                                                                                                                 |
| `skills`                             | Hayır       | `string[]`                   | Plugin köküne göre yüklenecek Skills dizinleri.                                                                                                                                                                                                                    |
| `name`                               | Hayır       | `string`                     | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                                                                                                |
| `description`                        | Hayır       | `string`                     | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                                                                    |
| `catalog`                            | Hayır       | `object`                     | Plugin katalog yüzeyleri için isteğe bağlı sunum ipuçları. Bu meta veriler bir Plugin'i yüklemez, etkinleştirmez veya ona güven sağlamaz.                                                                                                                                               |
| `icon`                               | Hayır       | `string`                     | Pazar yeri/katalog kartları için HTTPS görüntü URL'si. ClawHub, geçerli tüm `https://` URL'lerini kabul eder ve bu değer atlandığında veya geçersiz olduğunda varsayılan Plugin simgesini kullanır.                                                                                                         |
| `version`                            | Hayır       | `string`                     | Bilgilendirme amaçlı Plugin sürümü.                                                                                                                                                                                                                                              |
| `uiHints`                            | Hayır       | `Record<string, object>`     | Yapılandırma alanları için kullanıcı arayüzü etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                                                                          |

## katalog referansı

`catalog`, plugin tarayıcılarına isteğe bağlı görüntüleme ipuçları sağlar. Ana makineler bu ipuçlarını yok sayabilir. Bunlar hiçbir zaman plugin'i kurmaz veya etkinleştirmez ve plugin'in çalışma zamanı davranışını ya da güven düzeyini değiştirmez.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Alan       | Tür       | Anlamı                                                                     |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Katalog yüzeylerinin bu plugin'i öne çıkarıp çıkarmaması gerektiği.         |
| `order`    | `number`  | Seçilmiş plugin'ler arasındaki artan görüntüleme ipucu; düşük değerler daha önce görünür. |

## Üretim sağlayıcısı meta verileri referansı

Üretim sağlayıcısı meta veri alanları, eşleşen `contracts.*GenerationProviders` listesinde bildirilen sağlayıcılar için statik kimlik doğrulama sinyallerini açıklar. OpenClaw, çekirdek araçların her sağlayıcı plugin'ini içe aktarmadan bir üretim sağlayıcısının kullanılabilir olup olmadığına karar verebilmesi için bu alanları sağlayıcı çalışma zamanı yüklenmeden önce okur.

Bu alanları yalnızca düşük maliyetli, bildirime dayalı olgular için kullanın. Aktarım, istek dönüşümleri, token yenileme, kimlik bilgisi doğrulama ve gerçek üretim davranışı plugin çalışma zamanında kalır.

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

| Alan                   | Gerekli  | Tür        | Anlamı                                                                                                                                              |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Hayır    | `string[]` | Üretim sağlayıcısı için statik kimlik doğrulama diğer adları olarak sayılması gereken ek sağlayıcı kimlikleri.                                       |
| `authProviders`        | Hayır    | `string[]` | Yapılandırılmış kimlik doğrulama profillerinin bu üretim sağlayıcısı için kimlik doğrulama olarak sayılması gereken sağlayıcı kimlikleri.             |
| `configSignals`        | Hayır    | `object[]` | Kimlik doğrulama profilleri veya ortam değişkenleri olmadan yapılandırılabilen yerel ya da kendi sunucunuzda barındırılan sağlayıcılar için düşük maliyetli, yalnızca yapılandırmaya dayalı kullanılabilirlik sinyalleri. |
| `authSignals`          | Hayır    | `object[]` | Açık kimlik doğrulama sinyalleri. Mevcut olduklarında bunlar sağlayıcı kimliğinden, `aliases` ve `authProviders` değerlerinden gelen varsayılan sinyal kümesinin yerini alır. |
| `referenceAudioInputs` | Hayır    | `boolean`  | Yalnızca video üretimi. Sağlayıcı referans ses varlıklarını kabul ediyorsa `true` olarak ayarlayın; aksi takdirde `video_generate` ses referansı parametrelerini gizler. |

Her `configSignals` girdisi şunları destekler:

| Alan             | Gerekli  | Tür        | Anlamı                                                                                                                                                                                   |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Evet     | `string`   | İncelenecek, plugin'e ait yapılandırma nesnesinin noktalı yolu; örneğin `plugins.entries.example.config`.                                                                                               |
| `overlayPath`    | Hayır    | `string`   | Sinyal değerlendirilmeden önce nesnesi kök nesnenin üzerine uygulanması gereken, kök yapılandırmanın içindeki noktalı yol. Bunu `image`, `video` veya `music` gibi yeteneğe özgü yapılandırmalar için kullanın. |
| `overlayMapPath` | Hayır    | `string`   | Nesne değerlerinin her biri kök nesnenin üzerine uygulanması gereken, kök yapılandırmanın içindeki noktalı yol. Bunu, yapılandırılmış herhangi bir hesabın yeterli sayılması gereken `accounts` gibi adlandırılmış hesap eşlemeleri için kullanın. |
| `required`       | Hayır    | `string[]` | Etkin yapılandırma içinde yapılandırılmış değerlere sahip olması gereken noktalı yollar. Dizeler boş olmamalı; nesneler ve diziler boş olmamalıdır.                                         |
| `requiredAny`    | Hayır    | `string[]` | Etkin yapılandırma içinde en az birinin yapılandırılmış bir değere sahip olması gereken noktalı yollar.                                                                                    |
| `mode`           | Hayır    | `object`   | Etkin yapılandırma içindeki isteğe bağlı dize modu koruması. Yalnızca yapılandırmaya dayalı kullanılabilirlik tek bir mod için geçerli olduğunda bunu kullanın.                             |

Her `mode` koruması şunları destekler:

| Alan         | Gerekli  | Tür        | Anlamı                                                                            |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Hayır    | `string`   | Etkin yapılandırma içindeki noktalı yol. Varsayılan değer `mode`.       |
| `default`    | Hayır    | `string`   | Yapılandırma yolu içermediğinde kullanılacak mod değeri.                           |
| `allowed`    | Hayır    | `string[]` | Mevcutsa sinyal yalnızca etkin mod bu değerlerden biri olduğunda geçer.             |
| `disallowed` | Hayır    | `string[]` | Mevcutsa sinyal, etkin mod bu değerlerden biri olduğunda başarısız olur.            |

Her `authSignals` girdisi şunları destekler:

| Alan              | Gerekli  | Tür      | Anlamı                                                                                                                                                                        |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet     | `string` | Yapılandırılmış kimlik doğrulama profillerinde kontrol edilecek sağlayıcı kimliği.                                                                                            |
| `providerBaseUrl` | Hayır    | `object` | Sinyalin yalnızca başvurulan yapılandırılmış sağlayıcı izin verilen bir temel URL kullandığında sayılmasını sağlayan isteğe bağlı koruma. Bir kimlik doğrulama diğer adı yalnızca belirli API'ler için geçerli olduğunda bunu kullanın. |

Her `providerBaseUrl` koruması şunları destekler:

| Alan              | Gerekli  | Tür        | Anlamı                                                                                                                                               |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet     | `string`   | `baseUrl` değeri kontrol edilmesi gereken sağlayıcı yapılandırma kimliği.                                                                    |
| `defaultBaseUrl`  | Hayır    | `string`   | Sağlayıcı yapılandırması `baseUrl` değerini içermediğinde varsayılacak temel URL.                                                            |
| `allowedBaseUrls` | Evet     | `string[]` | Bu kimlik doğrulama sinyali için izin verilen temel URL'ler. Yapılandırılmış veya varsayılan temel URL bu normalleştirilmiş değerlerden biriyle eşleşmediğinde sinyal yok sayılır. |

## Araç meta verileri referansı

`toolMetadata`, araç adına göre anahtarlanmış üretim sağlayıcısı meta verileriyle aynı `configSignals` ve `authSignals` şekillerini kullanır. `contracts.tools` sahipliği bildirir. `toolMetadata`, OpenClaw'ın yalnızca araç fabrikasının `null` döndürmesini sağlamak için bir plugin çalışma zamanını içe aktarmaktan kaçınabilmesi amacıyla düşük maliyetli kullanılabilirlik kanıtını bildirir.

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

`toolMetadata` girdileri, yukarıdaki ortak `configSignals`/`authSignals` alanlarına ek olarak `optional` (aracı plugin etkinleştirmesi için zorunlu olmayan olarak işaretler) ve `replaySafe` (tamamlanmamış bir model dönüşünden sonra araç yürütmesinin güvenle yinelenebileceğini işaretler) değerlerini de kabul eder.

Bir araçta `toolMetadata` yoksa OpenClaw mevcut davranışı korur ve araç sözleşmesi politikayla eşleştiğinde sahip plugin'i yükler. Fabrikası kimlik doğrulama/yapılandırmaya bağlı olan sıcak yol araçları için plugin yazarları, çekirdeğin sormak üzere çalışma zamanını içe aktarmasını sağlamak yerine `toolMetadata` bildirmelidir.

## providerAuthChoices referansı

Her `providerAuthChoices` girdisi bir ilk katılım veya kimlik doğrulama seçeneğini açıklar. OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur. Sağlayıcı kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden bu manifest seçeneklerini, tanımlayıcıdan türetilen kurulum seçeneklerini ve kurulum kataloğu meta verilerini kullanır.

| Alan                  | Gerekli   | Tür                                                                   | Anlamı                                                                                                                   |
| --------------------- | --------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet      | `string`                                                              | Bu seçimin ait olduğu sağlayıcı kimliği.                                                                                |
| `method`              | Evet      | `string`                                                              | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                                      |
| `choiceId`            | Evet      | `string`                                                              | İlk katılım ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçimi kimliği.                              |
| `choiceLabel`         | Hayır     | `string`                                                              | Kullanıcıya gösterilen etiket. Belirtilmezse OpenClaw, `choiceId` değerine geri döner.                          |
| `choiceHint`          | Hayır     | `string`                                                              | Seçici için kısa yardımcı metin.                                                                                        |
| `assistantPriority`   | Hayır     | `number`                                                              | Daha düşük değerler, asistan güdümlü etkileşimli seçicilerde daha önce sıralanır.                                       |
| `assistantVisibility` | Hayır     | `"visible"` \| `"manual-only"`                                        | Manuel CLI seçimine izin vermeye devam ederken seçimi asistan seçicilerinden gizler.                                    |
| `deprecatedChoiceIds` | Hayır     | `string[]`                                                            | Kullanıcıları bu yeni seçime yönlendirmesi gereken eski seçim kimlikleri.                                               |
| `groupId`             | Hayır     | `string`                                                              | İlgili seçimleri gruplandırmak için isteğe bağlı grup kimliği.                                                          |
| `groupLabel`          | Hayır     | `string`                                                              | Bu grup için kullanıcıya gösterilen etiket.                                                                             |
| `groupHint`           | Hayır     | `string`                                                              | Grup için kısa yardımcı metin.                                                                                           |
| `onboardingFeatured`  | Hayır     | `boolean`                                                             | Bu grubu, etkileşimli ilk katılım seçicisinin öne çıkan katmanında "More..." girişinden önce gösterir.                  |
| `optionKey`           | Hayır     | `string`                                                              | Tek bayraklı basit kimlik doğrulama akışları için dahili seçenek anahtarı.                                              |
| `cliFlag`             | Hayır     | `string`                                                              | `--openrouter-api-key` gibi CLI bayrağı adı.                                                                                |
| `cliOption`           | Hayır     | `string`                                                              | `--openrouter-api-key <key>` gibi tam CLI seçeneği biçimi.                                                                        |
| `cliDescription`      | Hayır     | `string`                                                              | CLI yardımında kullanılan açıklama.                                                                                     |
| `appGuidedSecret`     | Hayır     | `boolean`                                                             | Yapıştırılan tek bir gizli değer ile sağlayıcı varsayılanları, uygulama yönlendirmeli kurulum için yeterlidir.          |
| `appGuidedDiscovery`  | Hayır     | `boolean`                                                             | Eşleşen çalışma zamanı kimlik doğrulama yöntemi, `appGuidedSetup` aracılığıyla salt okunur yerel keşfin sahibidir.    |
| `appGuidedAuth`       | Hayır     | `"oauth"` \| `"device-code"`                                          | Yerel kurulum istemcilerinin genel olarak işleyebileceği, sağlayıcıya ait etkileşimli oturum açma.                       |
| `onboardingScopes`    | Hayır     | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Bu seçimin hangi ilk katılım yüzeylerinde görünmesi gerektiği. Belirtilmezse varsayılan olarak `["text-inference"]` olur. |

`appGuidedDiscovery` true olduğunda, eşleşen sağlayıcı kimlik doğrulama yöntemi
`appGuidedSetup.detect` ve `appGuidedSetup.prepare` öğelerini sunmalıdır. Algılama
salt okunur olmalıdır: oturum açma, model çekme, indirme veya yapılandırma yazma işlemi yapılmaz. Hazırlık,
tam olarak seçilen modeli yeniden denetler ve bir yapılandırma önerisi döndürür; OpenClaw bu
öneriyi yalıtılmış biçimde canlı olarak test eder ve yalnızca başarılı olduktan sonra kaydeder.

## commandAliases referansı

Bir plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahipse `commandAliases` kullanın. OpenClaw, plugin çalışma zamanı kodunu içe aktarmadan tanılama yapmak için bu meta verileri kullanır.

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

| Alan         | Gerekli   | Tür               | Anlamı                                                                       |
| ------------ | --------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Evet      | `string`          | Bu plugine ait komut adı.                                                    |
| `kind`       | Hayır     | `"runtime-slash"` | Takma adı, kök CLI komutu yerine sohbet eğik çizgi komutu olarak işaretler.  |
| `cliCommand` | Hayır     | `string`          | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.                   |

## activation referansı

Plugin, hangi kontrol düzlemi olaylarının kendisini etkinleştirme/yükleme planına dahil etmesi gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

Bu blok planlayıcı meta verisidir, yaşam döngüsü API'si değildir. Çalışma zamanı davranışını kaydetmez, `register(...)` öğesinin yerini almaz ve plugin kodunun zaten çalıştırılmış olduğunu garanti etmez. Etkinleştirme planlayıcısı, `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve kancalar gibi mevcut bildirim sahipliği meta verilerine geri dönmeden önce aday pluginleri daraltmak için bu alanları kullanır.

Sahipliği zaten açıklayan en dar meta verileri tercih edin. İlişkiyi bu alanlar ifade ediyorsa `providers`, `channels`, `commandAliases`, kurulum tanımlayıcıları veya `contracts` kullanın. Bu sahiplik alanlarıyla temsil edilemeyen ek planlayıcı ipuçları için `activation` kullanın. `claude-cli`, `my-cli` veya `google-gemini-cli` gibi CLI çalışma zamanı takma adları için üst düzey `cliBackends` kullanın; `activation.onAgentHarnesses` yalnızca halihazırda bir sahiplik alanı olmayan gömülü ajan çalışma çerçevesi kimlikleri içindir.

Her plugin, `activation.onStartup` değerini bilinçli olarak ayarlamalıdır. Yalnızca pluginin Gateway başlatılırken çalışması gerekiyorsa bunu `true` olarak ayarlayın. Plugin başlangıçta etkisizse ve yalnızca daha dar tetikleyicilerden yüklenmesi gerekiyorsa bunu `false` olarak ayarlayın. `onStartup` öğesinin belirtilmemesi artık plugini başlangıçta örtük olarak yüklemez; başlangıç, kanal, yapılandırma, ajan çalışma çerçevesi, bellek veya diğer daha dar etkinleştirme tetikleyicileri için açık etkinleştirme meta verilerini kullanın.

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

| Alan               | Gerekli   | Tür                                                  | Anlamı                                                                                                                                                                                                       |
| ------------------ | --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Hayır     | `boolean`                                            | Açık Gateway başlangıç etkinleştirmesi. Her plugin bunu ayarlamalıdır. `true`, başlangıç sırasında plugini içe aktarır; başka bir eşleşen tetikleyici yüklemeyi gerektirmedikçe `false`, başlangıçta geç yüklenmesini sağlar. |
| `onProviders`      | Hayır     | `string[]`                                           | Bu plugini etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                                                                                                                        |
| `onAgentHarnesses` | Hayır     | `string[]`                                           | Bu plugini etkinleştirme/yükleme planlarına dahil etmesi gereken gömülü ajan çalışma çerçevesi çalışma zamanı kimlikleri. CLI arka uç takma adları için üst düzey `cliBackends` kullanın.                  |
| `onCommands`       | Hayır     | `string[]`                                           | Bu plugini etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                                                                                                                            |
| `onChannels`       | Hayır     | `string[]`                                           | Bu plugini etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                                                                                                                            |
| `onRoutes`         | Hayır     | `string[]`                                           | Bu plugini etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                                                                                                                                |
| `onConfigPaths`    | Hayır     | `string[]`                                           | Yol mevcut olduğunda ve açıkça devre dışı bırakılmadığında bu plugini başlangıç/yükleme planlarına dahil etmesi gereken köke göreli yapılandırma yolları.                                                     |
| `onCapabilities`   | Hayır     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlamasında kullanılan geniş kapsamlı yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin.                                                                        |

Mevcut canlı tüketiciler:

- Gateway başlangıç planlaması, açık başlangıç içe aktarımı için `activation.onStartup` kullanır.
- Komutla tetiklenen CLI planlaması, eski `commandAliases[].cliCommand` veya `commandAliases[].name` seçeneğine geri döner.
- Aracı çalışma zamanı başlangıç planlaması, gömülü test düzenekleri için `activation.onAgentHarnesses`, CLI çalışma zamanı diğer adları için üst düzey `cliBackends[]` kullanır.
- Kanal tarafından tetiklenen kurulum/kanal planlaması, açık kanal etkinleştirme meta verileri eksik olduğunda eski `channels[]` sahipliğine geri döner.
- Başlangıç Plugin planlaması, paketle birlikte sunulan tarayıcı Plugininin `browser` bloğu gibi kanal dışı kök yapılandırma yüzeyleri için `activation.onConfigPaths` kullanır.
- Sağlayıcı tarafından tetiklenen kurulum/çalışma zamanı planlaması, açık sağlayıcı etkinleştirme meta verileri eksik olduğunda eski `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner.

Planlayıcı tanılamaları, açık etkinleştirme ipuçlarını manifest sahipliği geri dönüşünden ayırt edebilir. Örneğin `activation-command-hint`, `activation.onCommands` ile eşleşildiği; `manifest-command-alias` ise planlayıcının bunun yerine `commandAliases` sahipliğini kullandığı anlamına gelir. Bu neden etiketleri ana makine tanılamaları ve testler içindir; Plugin yazarları, sahipliği en iyi açıklayan meta verileri bildirmeye devam etmelidir.

## qaRunners başvurusu

Bir Plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla aktarım çalıştırıcısı sağladığında
`qaRunners` kullanın. Bu meta verileri hafif ve statik tutun; Plugin
çalışma zamanı, eşleşen `qaRunnerCliRegistrations` değerlerini dışa aktaran hafif bir
`runtime-api.ts` yüzeyi üzerinden gerçek CLI kaydının sahipliğini sürdürür. İsteğe
bağlı `adapterFactory`, kayıtlı komutun çalıştırıcısını değiştirmeden aktarımı
paylaşılan QA senaryolarına açar.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Tek kullanımlık bir ana sunucuya karşı Docker destekli Matrix canlı QA hattını çalıştırın"
    }
  ]
}
```

| Alan          | Gerekli | Tür      | Anlamı                                                             |
| ------------- | ------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Evet    | `string` | `openclaw qa` altında bağlanan alt komut; örneğin `matrix`.       |
| `description` | Hayır   | `string` | Paylaşılan ana makinenin yer tutucu bir komuta ihtiyaç duyduğunda kullandığı yedek yardım metni. |

`adapterFactory` kimliği, `commandName` ile eşleşmelidir. Manifestte bulunmayan
komutlar için kayıtları dışa aktarmayın.

## setup başvurusu

Kurulum ve ilk katılım yüzeyleri, çalışma zamanı yüklenmeden önce hafif ve Pluginin sahip olduğu meta verilere ihtiyaç duyduğunda `setup` kullanın.

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
            "source": "openai yerel kimlik bilgileri"
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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım arka uçlarını açıklamaya devam eder. `setup.cliBackends`, yalnızca meta veri olarak kalması gereken kontrol düzlemi/kurulum akışlarına yönelik kuruluma özgü tanımlayıcı yüzeyidir.

Mevcut olduklarında `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen, önce tanımlayıcıyı kullanan arama yüzeyidir. Tanımlayıcı yalnızca aday Plugini daraltıyorsa ve kurulum hâlâ daha kapsamlı kurulum zamanı çalışma kancalarına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak `setup-api` değerini koruyun.

OpenClaw ayrıca genel sağlayıcı kimlik doğrulama ve ortam değişkeni aramalarına `setup.providers[].envVars` ekler. `providerAuthEnvVars`, kullanımdan kaldırma süresi boyunca bir uyumluluk bağdaştırıcısı aracılığıyla desteklenmeye devam eder; ancak bunu hâlâ kullanan paket dışı Pluginler bir manifest tanılaması alır. Yeni Pluginler kurulum/durum ortam meta verilerini `setup.providers[].envVars` üzerine yerleştirmelidir.

Bir faturalandırma veya kuruluş düzeyi kimlik bilgisinin, çıkarım kimlik bilgisine dönüşmeden `resolveUsageAuth` öğesini etkinleştirmesi gerektiğinde `providerUsageAuthEnvVars` kullanın. Bu adlar çalışma alanı dotenv engellemesine, ACP alt süreçlerinden ayıklamaya, korumalı alan gizli bilgi filtrelemesine ve kapsamlı gizli bilgi temizlemeye eklenir. Sağlayıcı çalışma zamanı, değeri yine `resolveUsageAuth` içinde okur ve sınıflandırır.

OpenClaw, hiçbir kurulum girdisi bulunmadığında veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildirdiğinde `setup.providers[].authMethods` üzerinden basit kurulum seçenekleri de türetebilir. Açık `providerAuthChoices` girdileri; özel etiketler, CLI bayrakları, ilk katılım kapsamı ve asistan meta verileri için tercih edilmeye devam eder.

`requiresRuntime: false` değerini yalnızca bu tanımlayıcılar kurulum yüzeyi için yeterliyse ayarlayın. OpenClaw, açık `false` değerini yalnızca tanımlayıcı sözleşmesi olarak kabul eder ve kurulum araması için `setup-api` veya `openclaw.setupEntry` öğesini yürütmez. Yalnızca tanımlayıcı kullanan bir Plugin yine de bu kurulum çalışma zamanı girdilerinden birini sunuyorsa OpenClaw ek bir tanılama bildirir ve girdiyi yok saymayı sürdürür. `requiresRuntime` değerinin atlanması eski geri dönüş davranışını korur; böylece bayrak olmadan tanımlayıcı ekleyen mevcut Pluginler bozulmaz.

Kurulum araması, Pluginin sahip olduğu `setup-api` kodunu yürütebildiğinden, normalleştirilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen Pluginler genelinde benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine güvenli biçimde başarısız olur.

Kurulum çalışma zamanı yürütüldüğünde, `setup-api` manifest tanımlayıcılarının bildirmediği bir sağlayıcıyı veya CLI arka ucunu kaydederse ya da bir tanımlayıcının eşleşen bir çalışma zamanı kaydı yoksa kurulum kayıt defteri tanılamaları tanımlayıcı sapmasını bildirir. Bu tanılamalar ek niteliktedir ve eski Pluginleri reddetmez.

### setup.providers başvurusu

| Alan           | Gerekli | Tür        | Anlamı                                                                                           |
| -------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Evet    | `string`   | Kurulum veya ilk katılım sırasında sunulan sağlayıcı kimliği. Normalleştirilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods`  | Hayır   | `string[]` | Bu sağlayıcının tam çalışma zamanını yüklemeden desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`      | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden önce denetleyebileceği ortam değişkenleri. |
| `authEvidence` | Hayır   | `object[]` | Gizli olmayan işaretçiler aracılığıyla kimlik doğrulaması yapabilen sağlayıcılar için hafif yerel kimlik doğrulama kanıtı denetimleri. |

`authEvidence`, çalışma zamanı kodu yüklenmeden doğrulanabilen ve sağlayıcının sahip olduğu yerel kimlik bilgisi işaretçileri içindir. Bu denetimler hafif ve yerel kalmalıdır: ağ çağrısı, anahtarlık veya gizli bilgi yöneticisi okuması, kabuk komutu ve sağlayıcı API yoklaması yapılamaz.

Desteklenen kanıt girdileri:

| Alan               | Gerekli | Tür        | Anlamı                                                                                                        |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `type`             | Evet    | `string`   | Şu anda `local-file-with-env`.                                                                                |
| `fileEnvVar`       | Hayır   | `string`   | Açık bir kimlik bilgisi dosyası yolunu içeren ortam değişkeni.                                                |
| `fallbackPaths`    | Hayır   | `string[]` | `fileEnvVar` bulunmadığında veya boş olduğunda denetlenen yerel kimlik bilgisi dosya yolları. `${HOME}` ve `${APPDATA}` desteklenir. |
| `requiresAnyEnv`   | Hayır   | `string[]` | Kanıtın geçerli olması için listelenen ortam değişkenlerinden en az biri boş olmamalıdır.                    |
| `requiresAllEnv`   | Hayır   | `string[]` | Kanıtın geçerli olması için listelenen tüm ortam değişkenleri boş olmamalıdır.                               |
| `credentialMarker` | Evet    | `string`   | Kanıt mevcut olduğunda döndürülen gizli olmayan işaretçi.                                                     |
| `source`           | Hayır   | `string`   | Kimlik doğrulama/durum çıktısı için kullanıcıya gösterilen kaynak etiketi.                                   |

### setup alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                             |
| ------------------ | ------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve ilk katılım sırasında sunulan sağlayıcı kurulum tanımlayıcıları.                        |
| `cliBackends`      | Hayır   | `string[]` | Önce tanımlayıcıyı kullanan kurulum aramasında kullanılan kurulum zamanı arka uç kimlikleri. Normalleştirilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Pluginin kurulum yüzeyinin sahip olduğu yapılandırma geçişi kimlikleri.                         |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı. |

## uiHints başvurusu

`uiHints`, yapılandırma alanı adlarından küçük işleme ipuçlarına uzanan bir eşlemedir. Anahtarlar, iç içe yapılandırma alanları için nokta kullanabilir; ancak hiçbir yol segmenti `__proto__`, `constructor` veya `prototype` olamaz; kurulum bu adları reddeder.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API anahtarı",
      "help": "OpenRouter istekleri için kullanılır",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Her alan ipucu şunları içerebilir:

| Alan          | Tür        | Anlamı                                  |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Kullanıcıya gösterilen alan etiketi.    |
| `help`        | `string`   | Kısa yardımcı metin.                    |
| `tags`        | `string[]` | İsteğe bağlı kullanıcı arayüzü etiketleri. |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.        |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girişleri için yer tutucu metin.   |

## contracts başvurusu

`contracts` öğesini yalnızca OpenClaw'un Plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği meta verileri için kullanın.

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
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Her liste isteğe bağlıdır:

| Alan                            | Tür       | Anlamı                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server uzantısı fabrika kimlikleri; şu anda `codex-app-server`.                                                                |
| `agentToolResultMiddleware`      | `string[]` | Bu Plugin'in araç sonucu ara yazılımı kaydedebileceği çalışma zamanı kimlikleri.                                                                     |
| `trustedToolPolicies`            | `string[]` | Yüklü bir Plugin'in kaydedebileceği, Plugin'e yerel ve güvenilen araç öncesi politika kimlikleri. Paketle birlikte gelen Plugin'ler bu alan olmadan politika kaydedebilir. |
| `externalAuthProviders`          | `string[]` | Harici kimlik doğrulama profili kancası bu Plugin'e ait olan sağlayıcı kimlikleri.                                                                      |
| `embeddingProviders`             | `string[]` | Bellek dâhil yeniden kullanılabilir vektör gömme işlemleri için bu Plugin'e ait genel gömme sağlayıcısı kimlikleri.                                 |
| `speechProviders`                | `string[]` | Bu Plugin'e ait konuşma sağlayıcısı kimlikleri.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin'e ait gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin'e ait gerçek zamanlı ses sağlayıcısı kimlikleri.                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | Bu Plugin'e ait, kullanımdan kaldırılmış belleğe özgü gömme sağlayıcısı kimlikleri.                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin'e ait medya anlama sağlayıcısı kimlikleri.                                                                                   |
| `transcriptSourceProviders`      | `string[]` | Bu Plugin'e ait transkript kaynağı sağlayıcısı kimlikleri.                                                                                     |
| `documentExtractors`             | `string[]` | Bu Plugin'e ait belge (örneğin PDF) ayıklayıcı sağlayıcısı kimlikleri.                                                                  |
| `imageGenerationProviders`       | `string[]` | Bu Plugin'e ait görüntü oluşturma sağlayıcısı kimlikleri.                                                                                      |
| `videoGenerationProviders`       | `string[]` | Bu Plugin'e ait video oluşturma sağlayıcısı kimlikleri.                                                                                      |
| `musicGenerationProviders`       | `string[]` | Bu Plugin'e ait müzik oluşturma sağlayıcısı kimlikleri.                                                                                      |
| `webContentExtractors`           | `string[]` | Bu Plugin'e ait web sayfası içerik ayıklama sağlayıcısı kimlikleri.                                                                           |
| `webFetchProviders`              | `string[]` | Bu Plugin'e ait web getirme sağlayıcısı kimlikleri.                                                                                             |
| `webSearchProviders`             | `string[]` | Bu Plugin'e ait web arama sağlayıcısı kimlikleri.                                                                                            |
| `workerProviders`                | `string[]` | Hazırlama ve profil destekli kiralama yaşam döngüsü için bu Plugin'e ait bulut çalışanı sağlayıcısı kimlikleri.                                      |
| `usageProviders`                 | `string[]` | Kullanım kimlik doğrulaması ve kullanım anlık görüntüsü kancaları bu Plugin'e ait olan sağlayıcı kimlikleri.                                                             |
| `migrationProviders`             | `string[]` | `openclaw migrate` için bu Plugin'e ait içe aktarma sağlayıcısı kimlikleri.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Gateway yöntemlerini süreç içinde yönlendiren, kimliği doğrulanmış Plugin HTTP rotaları için ayrılmış yetki.                                  |
| `tools`                          | `string[]` | Bu Plugin'e ait aracı adları.                                                                                                   |

`contracts.embeddedExtensionFactories`, paketle birlikte gelen ve yalnızca Codex app-server için kullanılan uzantı fabrikaları amacıyla korunur. Paketle birlikte gelen araç sonucu dönüşümleri bunun yerine `contracts.agentToolResultMiddleware` bildirmeli ve `api.registerAgentToolResultMiddleware(...)` ile kaydolmalıdır. Yüklü Plugin'ler aynı ara yazılım bağlantı noktasını yalnızca açıkça etkinleştirildiklerinde ve yalnızca `contracts.agentToolResultMiddleware` içinde bildirdikleri çalışma zamanları için kullanabilir.

Ana makinenin güvendiği araç öncesi politika katmanına ihtiyaç duyan yüklü Plugin'ler, kayıtlı her yerel kimliği `contracts.trustedToolPolicies` içinde bildirmeli ve açıkça etkinleştirilmelidir. Paketle birlikte gelen Plugin'ler mevcut güvenilen politika yolunu korur; ancak bildirilmemiş politika kimliklerine sahip yüklü Plugin'ler kayıt öncesinde reddedilir. Politika kimliklerinin kapsamı kaydeden Plugin ile sınırlıdır; dolayısıyla iki Plugin de `workflow-budget` bildirebilir ve kaydedebilir, ancak tek bir Plugin aynı yerel kimliği iki kez kaydedemez.

Çalışma zamanı `api.registerTool(...)` kayıtları `contracts.tools` ile eşleşmelidir. Araç keşfi, yalnızca istenen araçlara sahip olabilecek Plugin çalışma zamanlarını yüklemek için bu listeyi kullanır.

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'leri `contracts.externalAuthProviders` bildirmelidir; bildirilmemiş harici kimlik doğrulama kancaları yok sayılır.

Hem `resolveUsageAuth` hem de `fetchUsageSnapshot` uygulayan sağlayıcı Plugin'leri, otomatik keşfedilen her sağlayıcı kimliğini `contracts.usageProviders` içinde bildirmelidir. Kullanım keşfi, çalışma zamanı kodunu yüklemeden önce bu sözleşmeyi okur; ardından yalnızca bildirilen sahipleri yükledikten sonra iki kancayı da doğrular.

Genel gömme sağlayıcıları, `api.registerEmbeddingProvider(...)` ile kaydedilen her bağdaştırıcı için `contracts.embeddingProviders` bildirmelidir. Bellek aramasının kullandığı sağlayıcılar dâhil, yeniden kullanılabilir vektör üretimi için genel sözleşmeyi kullanın. `contracts.memoryEmbeddingProviders`, kullanımdan kaldırılmış belleğe özgü uyumluluktur ve yalnızca mevcut sağlayıcılar genel gömme sağlayıcısı bağlantı noktasına taşınırken korunur.

Çalışan sağlayıcıları, her `api.registerWorkerProvider(...)` kimliğini `contracts.workerProviders` içinde bildirmelidir. Çekirdek, `provision` çağrısından önce kalıcı amacı saklar; sağlayıcılar harici ayırma işleminden önce ayarlarını doğrular ve aynı işlem kimliğiyle tekrarlanan çağrılar aynı kiralamayı benimsemelidir. Çekirdek ayrıca doğrulanmış ayarların bu anlık görüntüsünü saklar ve adlandırılmış profil değiştirilmiş veya kaldırılmış olsa bile bunu `leaseId` ile birlikte `inspect({ leaseId, profile })` ve `destroy({ leaseId, profile })` öğelerine iletir. Yok etme işlemi eşgüçlüdür; inceleme, kapalı `active` / `destroyed` / `unknown` durum birleşimini döndürür ve SSH özel anahtar malzemesine yalnızca `SecretRef` üzerinden başvurulur. Hazırlanan SSH uç noktaları, çekirdeğin bağlanmadan önce ana makineyi sabitleyebilmesi için güvenilen hazırlama çıktısından gelen herkese açık bir `hostKey` değerini de tam olarak `algorithm base64` biçiminde, ana makine adı veya yorum olmadan içermelidir. Dinamik kimlik başvuruları oluşturan sağlayıcılar, yetkili `resolveSshIdentity({ leaseId, profile, keyRef })` uygulayabilir; bunu sağlamayan sağlayıcılar çekirdeğin genel gizli bilgi çözümleyicisini kullanır. Yetkili bir `unknown`, etkin bir yerel kaydı sahipsiz bırakır; kalıcı bir yok etme isteğinden sonra kaldırma işlemini doğrular.

`contracts.gatewayMethodDispatch` şu anda `"authenticated-request"` kabul eder. Bu, Gateway kontrol düzlemi yöntemlerini kasıtlı olarak süreç içinde yönlendiren yerel Plugin HTTP rotaları için bir API düzeni denetimidir; kötü amaçlı yerel Plugin'lere karşı bir korumalı alan değildir. Bunu yalnızca zaten Gateway HTTP kimlik doğrulaması gerektiren ve titizlikle incelenmiş paketle gelen/operatör yüzeyleri için kullanın. Yetkilendirilmiş bir rota, Gateway kök iş kabulü kapalıyken yalnızca `auth: "gateway"` ve rotaya özgü `gatewayRuntimeScopeSurface: "trusted-operator"` değerlerini de bildirirse erişilebilir kalır; aynı Plugin'in sıradan kardeş rotaları kabul sınırının arkasında kalır. Böylece tüm Plugin'e kabul atlama yetkisi verilmeden askıya alma durumu ve sürdürme işlevi erişilebilir kalır. Ayrıştırma ve yanıt biçimlendirme işlemlerini yönlendirme dışında sınırlı tutun; önemli veya değişiklik yapan işler, kabul ve kapsam uygulamasının sahibi olan Gateway yöntemi yönlendirmesinden geçmelidir.

## configContracts başvurusu

Plugin çalışma zamanını içe aktarmadan genel çekirdek yardımcılarının ihtiyaç duyduğu manifest sahipli yapılandırma davranışı için `configContracts` kullanın: tehlikeli bayrak algılama, SecretRef taşıma hedefleri ve eski yapılandırma yolu daraltma.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| Alan                         | Gerekli | Tür       | Anlamı                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Hayır       | `string[]` | Bu Plugin'in kurulum zamanı uyumluluk taşımalarının uygulanabileceğini belirten, köke göre yapılandırma yolları. Yapılandırma Plugin'e hiç başvurmuyorsa genel çalışma zamanı yapılandırma okumalarının tüm Plugin kurulum yüzeylerini atlamasını sağlar.                 |
| `compatibilityRuntimePaths`   | Hayır       | `string[]` | Plugin kodu tamamen etkinleşmeden önce bu Plugin'in çalışma zamanında işleyebileceği, köke göre uyumluluk yolları. Uyumlu her Plugin çalışma zamanını içe aktarmadan, paketle birlikte gelen aday kümelerini daraltması gereken eski yüzeyler için bunu kullanın. |
| `dangerousFlags`              | Hayır       | `object[]` | Etkinleştirildiğinde `openclaw doctor` tarafından güvensiz veya tehlikeli olarak işaretlenmesi gereken yapılandırma sabit değerleri. Aşağıya bakın.                                                                                                                                   |
| `secretInputs`                | Hayır       | `object`   | SecretRef taşıma/denetim hedefi kayıt defterinin gizli bilgi biçimli dizeler olarak değerlendirmesi gereken, `plugins.entries.<id>.config` altındaki yapılandırma yolları. Aşağıya bakın.                                                                                  |

Her `dangerousFlags` girdisi şunları destekler:

| Alan    | Gerekli | Tür                                  | Anlamı                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Evet      | `string`                              | `plugins.entries.<id>.config` öğesine göre, noktalarla ayrılmış yapılandırma yolu. Eşleme/dizi bölümleri için `*` joker karakterlerini destekler. |
| `equals` | Evet      | `string \| number \| boolean \| null` | Bu yapılandırma değerini tehlikeli olarak işaretleyen tam sabit değer.                                                            |

`secretInputs` şunları destekler:

| Alan                   | Gerekli | Tür       | Anlamı                                                                                                                                                                                                   |
| ----------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Hayır       | `boolean`  | Bu SecretRef yüzeyinin etkin olup olmadığına karar verirken paketle gelen Plugin'in varsayılan etkinleştirme durumunu geçersiz kılar. Plugin paketle geldiği hâlde yüzeyin yapılandırmada açıkça etkinleştirilene kadar devre dışı kalması gerektiğinde bunu kullanın. |
| `paths`                 | Evet      | `object[]` | Her biri `path` (noktayla ayrılmış, `plugins.entries.<id>.config` öğesine göreli, `*` joker karakterlerini destekler) ve isteğe bağlı `expected` (şu anda yalnızca `"string"`) içeren, gizli bilgi biçimindeki yapılandırma yolları.                            |

## mediaUnderstandingProviderMetadata referansı

Bir medya anlama sağlayıcısının varsayılan modelleri, otomatik kimlik doğrulama geri dönüş önceliği veya genel çekirdek yardımcılarının çalışma zamanı yüklenmeden önce ihtiyaç duyduğu yerel belge desteği olduğunda `mediaUnderstandingProviderMetadata` kullanın. Anahtarlar ayrıca `contracts.mediaUnderstandingProviders` içinde bildirilmelidir.

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

Her sağlayıcı girdisi şunları içerebilir:

| Alan                  | Tür                                                             | Anlamı                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Bu sağlayıcının sunduğu medya yetenekleri.                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | Yapılandırmada bir model belirtilmediğinde kullanılan, yetenekten modele varsayılan eşlemeler.                                         |
| `autoPriority`         | `Record<string, number>`                                         | Otomatik kimlik bilgisi tabanlı sağlayıcı geri dönüşünde daha düşük sayılar önce sıralanır.                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Sağlayıcının desteklediği yerel belge girdileri.                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Belge türüne göre model geçersiz kılmaları. İlgili belge türünde görüntü tabanlı ayıklamayı devre dışı bırakmak için `image: false` ayarlayın. |

## channelConfigs referansı

Bir kanal Plugin'i çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma meta verilerine ihtiyaç duyduğunda `channelConfigs` kullanın. Salt okunur kanal kurulumu/durum keşfi, kullanılabilir bir kurulum girdisi olmadığında veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildirdiğinde, yapılandırılmış harici kanallar için bu meta verileri doğrudan kullanabilir.

`channelConfigs`, yeni bir üst düzey kullanıcı yapılandırma bölümü değil, Plugin manifesti meta verisidir. Kullanıcılar kanal örneklerini yine `channels.<channel-id>` altında yapılandırır. OpenClaw, Plugin çalışma zamanı kodu yürütülmeden önce yapılandırılmış kanalın hangi Plugin'e ait olduğuna karar vermek için manifest meta verilerini okur.

Bir kanal Plugin'i için `configSchema` ve `channelConfigs` farklı yolları açıklar:

- `configSchema`, `plugins.entries.<plugin-id>.config` değerini doğrular
- `channelConfigs.<channel-id>.schema`, `channels.<channel-id>` değerini doğrular

`channels[]` bildiren paketle gelmeyen Plugin'ler, eşleşen `channelConfigs` girdilerini de bildirmelidir. Bunlar olmadan OpenClaw Plugin'i yine de yükleyebilir; ancak soğuk yol yapılandırma şeması, kurulum ve Control UI yüzeyleri, Plugin çalışma zamanı yürütülene kadar kanala ait seçenek yapısını bilemez.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` ve `nativeSkillsAutoEnabled`, kanal çalışma zamanı yüklenmeden önce yürütülen komut yapılandırma denetimleri için statik `auto` varsayılanlarını bildirebilir. Paketle gelen kanallar da aynı varsayılanları, pakete ait diğer kanal kataloğu meta verilerinin yanında `package.json#openclaw.channel.commands` aracılığıyla yayımlayabilir.

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
          "label": "Ana sunucu URL'si",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix ana sunucu bağlantısı",
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

| Alan         | Tür                     | Anlamı                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Şeması. Bildirilen her kanal yapılandırma girdisi için gereklidir.         |
| `uiHints`     | `Record<string, object>` | İlgili kanal yapılandırma bölümü için isteğe bağlı kullanıcı arayüzü etiketleri/yer tutucuları/hassaslık ipuçları.          |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeyleriyle birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                               |
| `commands`    | `object`                 | Çalışma zamanı öncesi yapılandırma denetimleri için statik yerel komut ve yerel Skills otomatik varsayılanları.       |
| `preferOver`  | `string[]`               | Bu kanalın seçim yüzeylerinde geride bırakması gereken eski veya daha düşük öncelikli Plugin kimlikleri.    |

### Başka bir kanal Plugin'ini değiştirme

Plugin'iniz, başka bir Plugin'in de sağlayabildiği bir kanal kimliği için tercih edilen sahip olduğunda `preferOver` kullanın. Yaygın durumlar; yeniden adlandırılmış bir Plugin kimliği, paketle gelen bir Plugin'in yerini alan bağımsız bir Plugin veya yapılandırma uyumluluğu için aynı kanal kimliğini koruyan bakımlı bir çataldır.

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

`channels.chat` yapılandırıldığında OpenClaw hem kanal kimliğini hem de tercih edilen Plugin kimliğini dikkate alır. Daha düşük öncelikli Plugin yalnızca paketle geldiği veya varsayılan olarak etkin olduğu için seçilmişse OpenClaw, tek bir Plugin'in kanalın ve araçlarının sahibi olması için onu geçerli çalışma zamanı yapılandırmasında devre dışı bırakır. Açık kullanıcı seçimi yine önceliklidir: Kullanıcı her iki Plugin'i de açıkça etkinleştirirse (`plugins.allow` veya önemli bir `plugins.entries` yapılandırması aracılığıyla), OpenClaw bu seçimi korur ve istenen Plugin kümesini sessizce değiştirmek yerine yinelenen kanal/araç tanılamalarını bildirir.

`preferOver` kapsamını gerçekten aynı kanalı sağlayabilen Plugin kimlikleriyle sınırlı tutun. Bu, genel bir öncelik alanı değildir ve kullanıcı yapılandırma anahtarlarını yeniden adlandırmaz.

## modelSupport referansı

OpenClaw'ın Plugin çalışma zamanı yüklenmeden önce `gpt-5.6-sol` veya `claude-sonnet-4.6` gibi kısa model kimliklerinden sağlayıcı Plugin'inizi çıkarsaması gerektiğinde `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu öncelik sırasını uygular:

- açık `provider/model` başvuruları, sahibi olan `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes` öğesinden önce gelir
- paketle gelmeyen bir Plugin ile paketle gelen bir Plugin'in ikisi de eşleşirse paketle gelmeyen Plugin önceliklidir
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtene kadar yok sayılır

Alanlar:

| Alan           | Tür       | Anlamı                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimlikleriyle `startsWith` kullanılarak eşleştirilen ön ekler.                 |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısa model kimlikleriyle eşleştirilen normal ifade kaynakları. |

`modelPatterns` girdileri, iç içe yineleme içeren kalıpları (örneğin `(a+)+$`) reddeden `compileSafeRegex` aracılığıyla derlenir. Güvenlik denetiminden geçemeyen kalıplar, sözdizimsel olarak geçersiz normal ifadelerde olduğu gibi sessizce atlanır. Kalıpları basit tutun ve iç içe niceleyicilerden kaçının.

## modelCatalog referansı

OpenClaw'ın Plugin çalışma zamanını yüklemeden önce sağlayıcı model meta verilerini bilmesi gerektiğinde `modelCatalog` kullanın. Bu, sabit katalog satırları, sağlayıcı takma adları, engelleme kuralları ve keşif modu için manifestin sahip olduğu kaynaktır. Çalışma zamanı yenilemesi yine sağlayıcı çalışma zamanı koduna aittir; ancak manifest, çalışma zamanının ne zaman gerekli olduğunu çekirdeğe bildirir.

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
        "reason": "Azure OpenAI Responses üzerinde kullanılamaz"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Üst düzey alanlar:

| Alan            | Tür                                                     | Anlamı                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Bu pluginin sahip olduğu sağlayıcı kimliklerine ait katalog satırları. Anahtarlar ayrıca üst düzey `providers` içinde de yer almalıdır.       |
| `aliases`        | `Record<string, object>`                                 | Katalog veya bastırma planlaması için sahip olunan bir sağlayıcıya çözümlenmesi gereken sağlayıcı diğer adları.              |
| `suppressions`   | `object[]`                                               | Bu pluginin sağlayıcıya özgü bir nedenle bastırdığı, başka bir kaynaktan gelen model satırları.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Sağlayıcı kataloğunun manifest meta verilerinden okunabilmesi, önbelleğe yenilenebilmesi veya çalışma zamanı gerektirmesi. |
| `runtimeAugment` | `boolean`                                                | Yalnızca sağlayıcı çalışma zamanının manifest/yapılandırma planlamasından sonra katalog satırları eklemesi gerektiğinde `true` olarak ayarlayın.       |

`aliases`, model kataloğu planlamasında sağlayıcı sahipliği aramasına katılır. Diğer ad hedefleri, aynı pluginin sahip olduğu üst düzey sağlayıcılar olmalıdır. Sağlayıcıya göre filtrelenmiş bir liste bir diğer ad kullandığında OpenClaw, sağlayıcı çalışma zamanını yüklemeden sahip manifesti okuyabilir ve diğer ada ait API/temel URL geçersiz kılmalarını uygulayabilir. Diğer adlar, filtrelenmemiş katalog listelerini genişletmez; geniş listeler yalnızca sahip olan kurallı sağlayıcının satırlarını üretir.

`suppressions`, eski sağlayıcı çalışma zamanı `suppressBuiltInModel` kancasının yerini alır. Bastırma girdileri yalnızca sağlayıcı pluginin mülkiyetindeyse veya sahip olunan bir sağlayıcıyı hedefleyen bir `modelCatalog.aliases` anahtarı olarak bildirilmişse dikkate alınır. Model çözümleme sırasında çalışma zamanı bastırma kancaları artık çağrılmaz.

Sağlayıcı alanları:

| Alan                 | Tür                     | Anlamı                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan temel URL.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan API bağdaştırıcısı.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Bu sağlayıcı kataloğuna uygulanan isteğe bağlı statik üstbilgiler.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | Kısa dahili yardımcı görevler (başlıklar, ilerleme anlatımı) için sağlayıcının önerdiği isteğe bağlı küçük model kimliği. `agents.defaults.utilityModel` ayarlanmamışsa ve bu sağlayıcı aracının birincil modelini sunuyorsa kullanılır. |
| `models`              | `object[]`               | Zorunlu model satırları. `id` içermeyen satırlar yok sayılır.                                                                                                                                                            |

Model alanları:

| Alan              | Tür                                                           | Anlamı                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | `provider/` öneki olmadan, sağlayıcıya yerel model kimliği.                    |
| `name`             | `string`                                                       | İsteğe bağlı görünen ad.                                                      |
| `api`              | `ModelApi`                                                     | İsteğe bağlı model başına API geçersiz kılması.                                            |
| `baseUrl`          | `string`                                                       | İsteğe bağlı model başına temel URL geçersiz kılması.                                       |
| `headers`          | `Record<string, string>`                                       | İsteğe bağlı model başına statik üstbilgiler.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modelin kabul ettiği kipler. Diğer değerler sessizce atılır.            |
| `reasoning`        | `boolean`                                                      | Modelin akıl yürütme davranışı sunup sunmadığı.                               |
| `contextWindow`    | `number`                                                       | Sağlayıcının yerel bağlam penceresi.                                             |
| `contextTokens`    | `number`                                                       | `contextWindow` değerinden farklı olduğunda isteğe bağlı etkin çalışma zamanı bağlam sınırı. |
| `maxTokens`        | `number`                                                       | Biliniyorsa azami çıktı token sayısı.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | İsteğe bağlı, düşünme düzeyi başına model kimliği veya parametre geçersiz kılmaları.                    |
| `cost`             | `object`                                                       | İsteğe bağlı `tieredPricing` dahil olmak üzere, milyon token başına isteğe bağlı USD fiyatlandırması. |
| `compat`           | `object`                                                       | OpenClaw model yapılandırması uyumluluğuyla eşleşen isteğe bağlı uyumluluk bayrakları.  |
| `mediaInput`       | `object`                                                       | Şu anda yalnızca görüntü için, kip başına isteğe bağlı girdi yapılandırması.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listeleme durumu. Yalnızca satırın hiçbir şekilde görünmemesi gerektiğinde bastırın.          |
| `statusReason`     | `string`                                                       | Kullanılabilir olmayan durumla birlikte gösterilen isteğe bağlı neden.                            |
| `replaces`         | `string[]`                                                     | Bu modelin yerini aldığı eski sağlayıcıya yerel model kimlikleri.                       |
| `replacedBy`       | `string`                                                       | Kullanımdan kaldırılmış satırlar için sağlayıcıya yerel yedek model kimliği.                    |
| `tags`             | `string[]`                                                     | Seçiciler ve filtreler tarafından kullanılan kararlı etiketler.                                    |

Bastırma alanları:

| Alan                      | Tür       | Anlamı                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Bastırılacak yukarı akış satırının sağlayıcı kimliği. Bu pluginin mülkiyetinde olmalı veya sahip olunan bir diğer ad olarak bildirilmelidir. |
| `model`                    | `string`   | Bastırılacak sağlayıcıya yerel model kimliği.                                                                      |
| `reason`                   | `string`   | Bastırılan satır doğrudan istendiğinde gösterilen isteğe bağlı ileti.                                     |
| `when.baseUrlHosts`        | `string[]` | Bastırma uygulanmadan önce gerekli olan etkin sağlayıcı temel URL ana makinelerinin isteğe bağlı listesi.               |
| `when.providerConfigApiIn` | `string[]` | Bastırma uygulanmadan önce gerekli olan, sağlayıcı yapılandırmasına ait tam `api` değerlerinin isteğe bağlı listesi.              |

Yalnızca çalışma zamanına ait verileri `modelCatalog` içine koymayın. `static` değerini yalnızca manifest satırları, sağlayıcıya göre filtrelenmiş liste ve seçici yüzeylerinin kayıt defteri/çalışma zamanı keşfini atlayabilmesi için yeterince eksiksiz olduğunda kullanın. Manifest satırları listelenebilir yararlı başlangıçlar veya ekler olduğunda, ancak bir yenileme/önbellek daha sonra başka satırlar ekleyebildiğinde `refreshable` kullanın; yenilenebilir satırlar tek başlarına yetkili değildir. OpenClaw'ın listeyi bilmek için sağlayıcı çalışma zamanını yüklemesi gerektiğinde `runtime` kullanın.

## modelIdNormalization referansı

Sağlayıcı çalışma zamanı yüklenmeden önce gerçekleşmesi gereken, sağlayıcıya ait düşük maliyetli model kimliği temizliği için `modelIdNormalization` kullanın. Bu, kısa model adları, sağlayıcıya yerel eski kimlikler ve vekil önek kuralları gibi diğer adları çekirdek model seçimi tabloları yerine sahip plugin manifestinde tutar.

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

| Alan                                | Tür                    | Anlamı                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Büyük/küçük harfe duyarsız tam model kimliği diğer adları. Değerler yazıldıkları biçimde döndürülür.                  |
| `stripPrefixes`                      | `string[]`              | Diğer ad aramasından önce kaldırılacak önekler; eski sağlayıcı/model yinelemesi için kullanışlıdır.     |
| `prefixWhenBare`                     | `string`                | Normalleştirilmiş model kimliği zaten `/` içermediğinde eklenecek önek.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Diğer ad aramasından sonraki, `modelPrefix` ve `prefix` ile anahtarlanan koşullu çıplak kimlik önek kuralları. |

## providerEndpoints referansı

Genel istek politikasının sağlayıcı çalışma zamanı yüklenmeden önce bilmesi gereken uç nokta sınıflandırması için `providerEndpoints` kullanın. Çekirdek, her `endpointClass` öğesinin anlamına sahip olmaya devam eder; plugin manifestleri ana makine ve temel URL meta verilerinin sahibidir.

Resmî olarak dışsallaştırılmış sağlayıcı pluginleri çekirdek dağıtımından hariç tutulduğundan,
manifestleri kurulana kadar görünmez. Bunların `providerEndpoints` değerleri ayrıca
`scripts/lib/official-external-provider-catalog.json` içine yansıtılmalıdır; böylece
uç nokta sınıflandırması plugin olmadan çalışmaya devam eder; bir sözleşme testi
yansıtmayı zorunlu kılar.

Uç nokta alanları:

| Alan                          | Tür       | Anlamı                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`, `moonshot-native` veya `google-vertex` gibi bilinen çekirdek uç nokta sınıfı.        |
| `hosts`                        | `string[]` | Uç nokta sınıfıyla eşleşen tam ana makine adları.                                                |
| `hostSuffixes`                 | `string[]` | Uç nokta sınıfıyla eşleşen ana makine sonekleri. Yalnızca etki alanı soneki eşleştirmesi için başına `.` ekleyin. |
| `baseUrls`                     | `string[]` | Uç nokta sınıfıyla eşleşen, normalleştirilmiş tam HTTP(S) temel URL'leri.                             |
| `googleVertexRegion`           | `string`   | Tam küresel ana makineler için statik Google Vertex bölgesi.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Google Vertex bölge önekini ortaya çıkarmak için eşleşen ana makinelerden kaldırılacak sonek.                 |

## providerRequest başvurusu

Genel istek politikasının sağlayıcı çalışma zamanını yüklemeden ihtiyaç duyduğu düşük maliyetli istek uyumluluğu meta verileri için `providerRequest` kullanın. Davranışa özgü yük yeniden yazma işlemlerini sağlayıcı çalışma zamanı kancalarında veya paylaşılan sağlayıcı ailesi yardımcılarında tutun.

```json
{
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

| Alan                 | Tür         | Anlamı                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Genel istek uyumluluğu kararları ve tanılama için kullanılan sağlayıcı ailesi etiketi. |
| `compatibilityFamily` | `"moonshot"` | Paylaşılan istek yardımcıları için isteğe bağlı sağlayıcı ailesi uyumluluk grubu.              |
| `openAICompletions`   | `object`     | Şu anda `supportsStreamingUsage` olan OpenAI uyumlu tamamlama isteği bayrakları.       |

## secretProviderIntegrations başvurusu

Bir plugin yeniden kullanılabilir bir SecretRef yürütme sağlayıcısı ön ayarı yayımlayabildiğinde `secretProviderIntegrations` kullanın. OpenClaw bu meta verileri plugin çalışma zamanı yüklenmeden önce okur, plugin sahipliğini `secrets.providers.<alias>.pluginIntegration` içinde saklar ve gerçek gizli değer çözümlemesini SecretRef çalışma zamanına bırakır. Ön ayarlar yalnızca paketlenmiş pluginler ve git ile ClawHub kurulumları gibi yönetilen plugin kurulum köklerinden keşfedilen yüklü pluginler için sunulur.

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

Eşleme anahtarı entegrasyon kimliğidir. `providerAlias` belirtilmezse OpenClaw, entegrasyon kimliğini SecretRef sağlayıcı diğer adı olarak kullanır. Sağlayıcı diğer adları, örneğin `team-secrets` veya `onepassword-work` gibi, normal SecretRef sağlayıcı diğer adı kalıbıyla eşleşmelidir.

Bir operatör ön ayarı seçtiğinde OpenClaw şuna benzer bir sağlayıcı başvurusu yazar:

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

Başlatma/yeniden yükleme sırasında OpenClaw; güncel plugin manifest meta verilerini yükleyerek, sahibi olan pluginin yüklü ve etkin olduğunu denetleyerek ve yürütme komutunu manifestten oluşturarak bu sağlayıcıyı çözümler. Pluginin devre dışı bırakılması veya kaldırılması, etkin SecretRef'ler için sağlayıcıyı geçersiz kılar. Bağımsız yürütme yapılandırması isteyen operatörler, manuel `command`/`args` sağlayıcılarını doğrudan yazmaya devam edebilir.

Şu anda yalnızca `source: "exec"` ön ayarları desteklenir. `command`, `${node}` olmalı ve `args[0]`, plugin köküne göreli bir `./` çözümleyici betiği olmalıdır. OpenClaw bunu başlatma/yeniden yükleme sırasında geçerli Node yürütülebilir dosyasına ve plugin içindeki mutlak betik yoluna dönüştürür. `--require`, `--import`, `--loader`, `--env-file`, `--eval` ve `--print` gibi Node seçenekleri manifest ön ayarı sözleşmesinin parçası değildir. Node dışı komutlara ihtiyaç duyan operatörler, bağımsız manuel yürütme sağlayıcılarını doğrudan yapılandırabilir.

OpenClaw, manifest ön ayarları için `trustedDirs` değerini plugin kökünden ve `${node}` ön ayarları için geçerli Node yürütülebilir dosyası dizininden türetir. Manifestte belirtilen `trustedDirs` yok sayılır. `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` ve `allowInsecurePath` gibi diğer yürütme sağlayıcısı seçenekleri normal SecretRef yürütme sağlayıcısı yapılandırmasına aktarılır.

## modelPricing başvurusu

Bir sağlayıcının çalışma zamanı yüklenmeden önce kontrol düzlemi fiyatlandırma davranışına ihtiyaç duyduğu durumlarda `modelPricing` kullanın. Gateway fiyatlandırma önbelleği, sağlayıcı çalışma zamanı kodunu içe aktarmadan bu meta verileri okur.

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

| Alan        | Tür              | Anlamı                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter veya LiteLLM fiyatlandırmasını hiçbir zaman almaması gereken yerel/kendi barındırılan sağlayıcılar için `false` olarak ayarlayın. |
| `openRouter` | `false \| object` | OpenRouter fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için OpenRouter aramasını devre dışı bırakır.           |
| `liteLLM`    | `false \| object` | LiteLLM fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için LiteLLM aramasını devre dışı bırakır.                 |

Kaynak alanları:

| Alan                      | Tür               | Anlamı                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw sağlayıcı kimliğinden farklı olduğunda harici katalog sağlayıcı kimliği; örneğin bir `zai` sağlayıcısı için `z-ai`. |
| `passthroughProviderModel` | `boolean`          | Eğik çizgi içeren model kimliklerini iç içe sağlayıcı/model başvuruları olarak değerlendirin; OpenRouter gibi vekil sağlayıcılar için kullanışlıdır.       |
| `modelIdTransforms`        | `"version-dots"[]` | Ek harici katalog model kimliği çeşitleri. `version-dots`, `claude-opus-4.6` gibi noktalı sürüm kimliklerini dener.            |

### OpenClaw Sağlayıcı Dizini

OpenClaw Sağlayıcı Dizini, pluginleri henüz yüklenmemiş olabilecek sağlayıcılara ilişkin OpenClaw'a ait önizleme meta verileridir. Bir plugin manifestinin parçası değildir. Yüklü pluginler için yetkili kaynak plugin manifestleri olmaya devam eder. Sağlayıcı Dizini, bir sağlayıcı plugini yüklü olmadığında gelecekteki kurulabilir sağlayıcı ve kurulum öncesi model seçici yüzeylerinin kullanacağı dahili geri dönüş sözleşmesidir.

Katalog yetki sırası:

1. Kullanıcı yapılandırması.
2. Yüklü plugin manifesti `modelCatalog`.
3. Açık yenilemeden gelen model kataloğu önbelleği.
4. OpenClaw Sağlayıcı Dizini önizleme satırları.

Sağlayıcı Dizini gizli değerler, etkin durum, çalışma zamanı kancaları veya hesaba özgü canlı model verileri içermemelidir. Önizleme katalogları, plugin manifestleriyle aynı `modelCatalog` sağlayıcı satırı biçimini kullanır ancak `api`, `baseUrl`, fiyatlandırma veya uyumluluk bayrakları gibi çalışma zamanı bağdaştırıcısı alanları yüklü plugin manifestiyle kasıtlı olarak uyumlu tutulmadıkça kararlı görüntüleme meta verileriyle sınırlı kalmalıdır. Canlı `/models` keşfine sahip sağlayıcılar, normal listeleme veya ilk katılım sırasında sağlayıcı API'lerini çağırmak yerine yenilenmiş satırları açık model kataloğu önbelleği yolu üzerinden yazmalıdır.

Sağlayıcı Dizini girdileri, plugini çekirdekten taşınmış veya henüz yüklenmemiş sağlayıcılar için kurulabilir plugin meta verileri de taşıyabilir. Bu meta veriler kanal kataloğu kalıbını yansıtır: paket adı, npm kurulum belirtimi, beklenen bütünlük ve düşük maliyetli kimlik doğrulama seçeneği etiketleri, kurulabilir bir kurulum seçeneğini göstermek için yeterlidir. Plugin yüklendikten sonra onun manifesti geçerli olur ve ilgili sağlayıcı için Sağlayıcı Dizini girdisi yok sayılır.

`openclaw doctor --fix`, eski üst düzey manifest yetenek anahtarlarından oluşan küçük ve kapalı bir kümeyi `contracts.*` içine taşır: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` ve `tools`. Bunların hiçbiri (veya başka herhangi bir yetenek listesi) artık üst düzey manifest alanları olarak okunmaz; normal manifest yükleme bunları yalnızca `contracts` altında tanır.

## Manifest ile package.json karşılaştırması

İki dosya farklı amaçlara hizmet eder:

| Dosya                   | Kullanım amacı                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce mevcut olması gereken keşif, yapılandırma doğrulaması, kimlik doğrulama seçeneği meta verileri ve kullanıcı arayüzü ipuçları                         |
| `package.json`         | npm meta verileri, bağımlılık kurulumu ve giriş noktaları, kurulum geçidi, kurulum veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw'ın bunu plugin kodunu yüklemeden önce bilmesi gerekiyorsa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi plugin meta verileri kasıtlı olarak `openclaw.plugin.json` yerine `openclaw` bloğu altındaki `package.json` içinde bulunur. `openclaw.bundle` ve `openclaw.bundle.json`, OpenClaw plugin sözleşmeleri değildir; yerel pluginler `openclaw.plugin.json` ile aşağıdaki desteklenen `package.json#openclaw` alanlarını kullanmalıdır.

Önemli örnekler:

| Alan                                                                                       | Anlamı                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Yerel plugin giriş noktalarını bildirir. Plugin paketi dizininin içinde kalmalıdır.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Yüklü paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paketi dizininin içinde kalmalıdır.                                                         |
| `openclaw.setupEntry`                                                                      | İlk katılım, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif, yalnızca kurulum amaçlı giriş noktasıdır. Plugin paketi dizininin içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                                               | Yüklü paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. `setupEntry` gerektirir, mevcut olmalı ve plugin paketi dizininin içinde kalmalıdır.                    |
| `openclaw.channel`                                                                         | Etiketler, belge yolları, diğer adlar ve seçim metni gibi düşük maliyetli kanal kataloğu meta verileri.                                                                                |
| `openclaw.channel.commands`                                                                | Kanal çalışma zamanı yüklenmeden önce yapılandırma, denetim ve komut listesi yüzeyleri tarafından kullanılan statik yerel komut ve yerel skill otomatik varsayılan meta verileri.      |
| `openclaw.channel.configuredState`                                                         | Tam kanal çalışma zamanını yüklemeden "yalnızca ortam değişkenleriyle kurulum zaten mevcut mu?" sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyicisi meta verileri.        |
| `openclaw.channel.persistedAuthState`                                                      | Tam kanal çalışma zamanını yüklemeden "herhangi bir yerde zaten oturum açılmış mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama denetleyicisi meta verileri.                 |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Paketle gelen ve haricen yayımlanan pluginler için yükleme/güncelleme ipuçları.                                                                                                       |
| `openclaw.install.defaultChoice`                                                           | Birden fazla yükleme kaynağı mevcut olduğunda tercih edilen yükleme yolu.                                                                                                             |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` veya `>=2026.5.1-beta.1` gibi bir semver alt sınırı kullanan, desteklenen minimum OpenClaw ana makine sürümü.                                                       |
| `openclaw.compat.pluginApi`                                                                | Bu paketin gerektirdiği minimum OpenClaw plugin API aralığı; `>=2026.5.27` gibi bir semver alt sınırı kullanır.                                                                  |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` gibi beklenen npm dağıtım bütünlüğü dizesi; yükleme ve güncelleme akışları getirilen yapıtı buna göre doğrular.                                                      |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Yapılandırma geçersiz olduğunda paketle gelen plugin için dar kapsamlı bir yeniden yükleme kurtarma yoluna izin verir.                                                                |
| `openclaw.install.requiredPlatformPackages`                                                | Kilit dosyasındaki platform kısıtlamaları geçerli ana makineyle eşleştiğinde somutlaştırılması gereken npm paket diğer adları.                                                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Kurulum çalışma zamanı kanal yüzeylerinin dinleme başlamadan önce yüklenmesini sağlar, ardından tam yapılandırılmış kanal pluginini dinleme sonrası etkinleştirmeye kadar erteler.     |

Manifest meta verileri, çalışma zamanı yüklenmeden önce ilk katılımda hangi sağlayıcı/kanal/kurulum seçeneklerinin görüneceğini belirler. `package.json#openclaw.install`, kullanıcı bu seçeneklerden birini seçtiğinde ilk katılıma ilgili pluginin nasıl getirileceğini veya etkinleştirileceğini bildirir. Yükleme ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, paketle gelmeyen plugin kaynakları için yükleme ve manifest kayıt defteri yükleme sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ancak geçerli değerler, eski ana makinelerde harici pluginlerin atlanmasına neden olur. Paketle gelen kaynak pluginlerin ana makine kaynak kodu çıkışıyla aynı sürümde olduğu varsayılır.

`openclaw.install.requiredPlatformPackages`, gerekli yerel ikili dosyaları isteğe bağlı, platforma özgü diğer adlar aracılığıyla sunan npm paketleri içindir. Desteklenen her platform diğer adı için yalın npm paket adını listeleyin. npm yüklemesi sırasında OpenClaw yalnızca kilit dosyası kısıtlamaları geçerli ana makineyle eşleşen bildirilmiş diğer adı doğrular. npm başarı bildirdiği hâlde bu diğer adı dahil etmezse OpenClaw yeni bir önbellekle bir kez yeniden dener ve diğer ad hâlâ eksikse yüklemeyi geri alır.

`openclaw.compat.pluginApi`, paketle gelmeyen plugin kaynakları için paket yükleme sırasında uygulanır. Bunu, paketin temel alınarak oluşturulduğu OpenClaw plugin SDK/çalışma zamanı API alt sınırı için kullanın. Bir plugin paketi daha yeni bir API gerektirirken diğer akışlar için daha düşük bir yükleme ipucunu koruyorsa `minHostVersion` değerinden daha katı olabilir. Resmî OpenClaw sürüm eşitlemesi, mevcut resmî plugin API alt sınırlarını varsayılan olarak OpenClaw sürümüne yükseltir; ancak yalnızca plugin sürümleri, paket eski ana makineleri bilinçli olarak desteklediğinde daha düşük bir alt sınırı koruyabilir. Uyumluluk sözleşmesi olarak yalnızca paket sürümünü kullanmayın. `peerDependencies.openclaw` npm paket meta verisi olarak kalır; OpenClaw, yükleme uyumluluğu kararlarında `openclaw.compat.pluginApi` sözleşmesini kullanır.

Resmî isteğe bağlı yükleme meta verileri, plugin ClawHub üzerinde yayımlanıyorsa `clawhubSpec` kullanmalıdır; ilk katılım bunu tercih edilen uzak kaynak olarak değerlendirir ve yüklemeden sonra ClawHub yapıt bilgilerini kaydeder. `npmSpec`, henüz ClawHub'a taşınmamış paketler için uyumluluk geri dönüşü olarak kalır.

Tam npm sürümü sabitleme zaten `npmSpec` içinde bulunur; örneğin `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmî harici katalog girdileri, tam belirtimleri `expectedIntegrity` ile eşleştirmelidir; böylece getirilen npm yapıtı artık sabitlenmiş sürümle eşleşmiyorsa güncelleme akışları kapalı biçimde başarısız olur. Etkileşimli ilk katılım, uyumluluk için yalın paket adları ve dağıtım etiketleri dâhil güvenilir kayıt defteri npm belirtimlerini sunmaya devam eder. Katalog tanılamaları tam, değişken, bütünlüğü sabitlenmiş, bütünlüğü eksik, paket adı eşleşmeyen ve geçersiz varsayılan seçim kaynaklarını ayırt edebilir. Ayrıca `expectedIntegrity` mevcut olduğu hâlde sabitleyebileceği geçerli bir npm kaynağı yoksa uyarır. `expectedIntegrity` mevcut olduğunda yükleme/güncelleme akışları bunu uygular; belirtilmediğinde kayıt defteri çözümlemesi bir bütünlük sabitlemesi olmadan kaydedilir.

Durum, kanal listesi veya SecretRef taramalarının tam çalışma zamanını yüklemeden yapılandırılmış hesapları tanımlaması gerekiyorsa kanal pluginleri `openclaw.setupEntry` sağlamalıdır. Kurulum girdisi, kanal meta verilerinin yanı sıra kurulum açısından güvenli yapılandırma, durum ve gizli bilgi bağdaştırıcılarını sunmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve taşıma çalışma zamanlarını ana uzantı giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanlarına ilişkin paket sınırı denetimlerini geçersiz kılmaz. Örneğin `openclaw.runtimeExtensions`, paket dışına çıkan bir `openclaw.extensions` yolunu yüklenebilir hâle getiremez.

`openclaw.install.allowInvalidConfigRecovery` bilinçli olarak dar kapsamlıdır. Herhangi bir bozuk yapılandırmayı yüklenebilir hâle getirmez. Bugün yalnızca eksik bir paketle gelen plugin yolu veya aynı paketle gelen plugin için eski bir `channels.<id>` girdisi gibi belirli eski paketle gelen plugin yükseltme hatalarından yükleme akışlarının kurtulmasına izin verir. İlgisiz yapılandırma hataları yüklemeyi engellemeye ve operatörleri `openclaw doctor --fix` konumuna yönlendirmeye devam eder.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modülü için paket meta verisidir:

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

Kurulum, doctor, durum veya salt okunur varlık akışları tam kanal plugini yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğunda bunu kullanın. Kalıcı kimlik doğrulama durumu, yapılandırılmış kanal durumu değildir: bu meta verileri pluginleri otomatik etkinleştirmek, çalışma zamanı bağımlılıklarını onarmak veya bir kanal çalışma zamanının yüklenip yüklenmeyeceğine karar vermek için kullanmayın. Hedef dışa aktarım yalnızca kalıcı durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı varili üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yapılandırma denetimlerini destekler. Ortam değişkenleri yeterli olduğunda bildirimsel ortam meta verilerini tercih edin:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

Listelenen her değişken gerekli olduğunda `env.allOf`, boş olmayan herhangi bir değişken yeterli olduğunda ise `env.anyOf` kullanın. Küçük, çalışma zamanı dışı bir denetim ortam meta verilerinden fazlasına ihtiyaç duyarsa `persistedAuthState` için gösterildiği gibi `specifier` ile `exportName` kullanın; `env` mevcut olduğunda OpenClaw bunu ilgili modülü yüklemeden kullanır. Denetim tam yapılandırma çözümlemesine veya gerçek kanal çalışma zamanına ihtiyaç duyuyorsa bu mantığı plugin `config.hasConfiguredState` kancasında tutun.

## Keşif önceliği (yinelenen plugin kimlikleri)

OpenClaw pluginleri şu sırayla denetlenen üç kökten keşfeder: OpenClaw ile sunulan paketle gelen pluginler, genel yükleme kökü (`~/.openclaw/extensions`) ve geçerli çalışma alanı kökü (`<workspace>/.openclaw/extensions`); bunlara ek olarak açıkça belirtilen `plugins.load.paths` girdileri.

İki keşif aynı `id` değerini paylaşıyorsa yalnızca **en yüksek öncelikli** manifest tutulur; daha düşük öncelikli yinelenenler yanında yüklenmek yerine bırakılır. En yüksekten en düşüğe öncelik sırası:

1. **Yapılandırma tarafından seçilen** — `plugins.entries.<id>` içinde açıkça sabitlenen bir yol
2. **İzlenen bir yükleme kaydıyla eşleşen genel yükleme** — kimlik paketle gelen bir plugine de ait olsa bile OpenClaw'ın yükleme izlemesinin aynı kimlik için tanıdığı, `openclaw plugin install`/`openclaw plugin update` aracılığıyla yüklenmiş bir plugin
3. **Paketle gelen** — OpenClaw ile sunulan pluginler
4. **Çalışma alanı** — geçerli çalışma alanına göre keşfedilen pluginler
5. Keşfedilen diğer tüm adaylar

Sonuçlar:

- Paketle gelen bir pluginin çalışma alanında veya genel kökte izlenmeden duran çatallanmış ya da eski bir kopyası, paketle gelen derlemenin önüne geçmez.
- Paketle gelen bir plugini geçersiz kılmak için ya söz konusu kimlikte `openclaw plugin install` çalıştırarak izlenen genel yüklemenin paketle gelen kopyadan daha yüksek öncelikli olmasını sağlayın ya da yapılandırma tarafından seçilme önceliğiyle kazanması için `plugins.entries.<id>` aracılığıyla belirli bir yolu sabitleyin.
- Yinelenenlerin bırakılması günlüğe kaydedilir; böylece Doctor ve başlangıç tanılamaları atılan kopyayı gösterebilir.
- Yapılandırma tarafından seçilen yinelenen geçersiz kılmalar, tanılamalarda açık geçersiz kılmalar olarak ifade edilir; ancak eski çatalların ve yanlışlıkla gölgelenen kopyaların görünür kalması için yine de uyarı verilir.

## JSON Schema gereksinimleri

- **Her plugin bir JSON Şemasıyla birlikte sunulmalıdır**, yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin, `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okunurken/yazılırken doğrulanır.
- Paketle birlikte gelen bir plugin'i yeni yapılandırma anahtarlarıyla genişletirken veya çatallarken, aynı zamanda o plugin'in `openclaw.plugin.json` `configSchema` öğesini de güncelleyin. Paketle birlikte gelen plugin şemaları katıdır; bu nedenle `myNewKey` öğesini `configSchema.properties` içine eklemeden kullanıcı yapılandırmasına `plugins.entries.<id>.config.myNewKey` eklemek, plugin çalışma zamanı yüklenmeden önce reddedilir.

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

- Bilinmeyen `channels.*` anahtarları, kanal kimliği bir plugin manifesti tarafından bildirilmediği sürece **hatadır**. Aynı kimlik ayrıca `plugins.allow`, `plugins.entries` veya `plugins.installs` içinde de görünüyorsa (başvurulan ancak şu anda keşfedilemeyen bir plugin), OpenClaw bunu bunun yerine bir **uyarıya** indirger.
- Bilinmeyen plugin kimliklerine başvuran `plugins.entries.<id>`, `plugins.allow` ve `plugins.deny`, hata değil **uyarıdır** ("eski yapılandırma girdisi yok sayıldı"); böylece yükseltmeler ve kaldırılan/yeniden adlandırılan plugin'ler Gateway'in başlatılmasını engellemez.
- Bilinmeyen bir plugin kimliğine başvuran `plugins.slots.memory`, bilinen resmi harici `memory-lancedb` plugin'i dışında **hatadır**; bu plugin için bunun yerine uyarı verilir.
- Bir plugin yüklüyse ancak manifesti veya şeması bozuk ya da eksikse doğrulama başarısız olur ve Doctor plugin hatasını bildirir.
- Plugin yapılandırması mevcutsa ancak plugin **devre dışıysa**, yapılandırma korunur ve Doctor ile günlüklerde bir **uyarı** gösterilir.

`plugins.*` şemasının tamamı için [Yapılandırma referansına](/tr/gateway/configuration) bakın.

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri de dahil olmak üzere **yerel OpenClaw plugin'leri için zorunludur**. Çalışma zamanı yine plugin modülünü ayrı olarak yükler; manifest yalnızca keşif ve doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; dolayısıyla nihai değer hâlâ bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyici yalnızca belgelenmiş manifest alanlarını okur. Özel üst düzey anahtarlardan kaçının.
- Bir plugin bunlara ihtiyaç duymadığında `channels`, `providers`, `cliBackends` ve `skills` öğelerinin tümü atlanabilir.
- `providerCatalogEntry` hafif kalmalı ve kapsamlı çalışma zamanı kodlarını içe aktarmamalıdır; bunu istek zamanı yürütmesi için değil, statik sağlayıcı kataloğu meta verileri veya dar kapsamlı keşif tanımlayıcıları için kullanın.
- Özel plugin türleri `plugins.slots.*` aracılığıyla seçilir: `kind: "memory"`, `plugins.slots.memory` üzerinden (varsayılan `memory-core`); `kind: "context-engine"`, `plugins.slots.contextEngine` üzerinden (varsayılan `legacy`).
- Özel plugin türünü bu manifestte bildirin. Çalışma zamanı girişindeki `OpenClawPluginDefinition.kind` kullanımdan kaldırılmıştır ve yalnızca eski plugin'ler için uyumluluk geri dönüşü olarak kalır.
- Ortam değişkeni meta verileri (`setup.providers[].envVars`, kullanımdan kaldırılan `providerAuthEnvVars` ve `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, cron teslimatı doğrulaması ve diğer salt okunur yüzeyler, bir ortam değişkenini yapılandırılmış olarak değerlendirmeden önce yine plugin güvenini ve etkinleştirme politikasını uygular.
- Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı meta verileri için [Sağlayıcı çalışma zamanı kancalarına](/tr/plugins/architecture-internals#provider-runtime-hooks) bakın.
- Plugin'iniz yerel modüllere bağımlıysa derleme adımlarını ve paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## İlgili

<CardGroup cols={3}>
  <Card title="Plugin oluşturma" href="/tr/plugins/building-plugins" icon="rocket">
    Plugin'leri kullanmaya başlama.
  </Card>
  <Card title="Plugin mimarisi" href="/tr/plugins/architecture" icon="diagram-project">
    İç mimari ve yetenek modeli.
  </Card>
  <Card title="SDK'ya genel bakış" href="/tr/plugins/sdk-overview" icon="book">
    Plugin SDK referansı ve alt yol içe aktarımları.
  </Card>
</CardGroup>
