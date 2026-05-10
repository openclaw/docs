---
read_when:
    - Bir OpenClaw Plugin'i geliştiriyorsunuz
    - Bir Plugin yapılandırma şeması göndermeniz veya Plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin manifestosu
x-i18n:
    generated_at: "2026-05-10T19:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

Bu sayfa yalnızca **yerel OpenClaw Plugin manifesti** içindir.

Uyumlu paket düzenleri için bkz. [Plugin paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifest olmadan varsayılan Claude bileşen
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan
`openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda düzen OpenClaw çalışma zamanı beklentileriyle
eşleştiğinde paket meta verilerini ve bildirilen beceri köklerini, Claude komut köklerini,
Claude paketi `settings.json` varsayılanlarını, Claude paketi LSP varsayılanlarını
ve desteklenen hook paketlerini okur.

Her yerel OpenClaw Plugin, **Plugin kökünde** bir `openclaw.plugin.json` dosyasıyla
gelmelidir. OpenClaw bu manifesti, **Plugin kodunu çalıştırmadan** yapılandırmayı
doğrulamak için kullanır. Eksik veya geçersiz manifestler Plugin hataları olarak
ele alınır ve yapılandırma doğrulamasını engeller.

Tam Plugin sistemi kılavuzuna bakın: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve güncel dış uyumluluk kılavuzu için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'ın **Plugin kodunuzu yüklemeden önce** okuduğu
meta verilerdir. Aşağıdaki her şey, Plugin çalışma zamanını başlatmadan incelenebilecek
kadar düşük maliyetli olmalıdır.

**Şunlar için kullanın:**

- Plugin kimliği, yapılandırma doğrulaması ve yapılandırma UI ipuçları
- kimlik doğrulama, ilk kullanım ve kurulum meta verileri (takma ad, otomatik etkinleştirme, sağlayıcı ortam değişkenleri, kimlik doğrulama seçenekleri)
- kontrol düzlemi yüzeyleri için etkinleştirme ipuçları
- kısaltılmış model ailesi sahipliği
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` ana makinesinin inceleyebileceği QA çalıştırıcısı meta verileri
- katalog ve doğrulama yüzeylerine birleştirilen kanala özgü yapılandırma meta verileri

**Şunlar için kullanmayın:** çalışma zamanı davranışını kaydetme, kod giriş noktalarını
bildirme veya npm kurulum meta verileri. Bunlar Plugin kodunuza ve `package.json` dosyanıza aittir.

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

| Alan                                 | Gerekli | Tür                              | Ne anlama gelir                                                                                                                                                                                                                             |
| ------------------------------------ | ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Evet    | `string`                         | Kanonik Plugin kimliği. Bu, `plugins.entries.<id>` içinde kullanılan kimliktir.                                                                                                                                                              |
| `configSchema`                       | Evet    | `object`                         | Bu Plugin'in yapılandırması için satır içi JSON Schema.                                                                                                                                                                                     |
| `enabledByDefault`                   | Hayır   | `true`                           | Paketle gelen bir Plugin'i varsayılan olarak etkin işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` olmayan herhangi bir değere ayarlayın.                                                          |
| `enabledByDefaultOnPlatforms`        | Hayır   | `string[]`                       | Paketle gelen bir Plugin'i yalnızca listelenen Node.js platformlarında varsayılan olarak etkin işaretler; örneğin `["darwin"]`. Açık yapılandırma yine de önceliklidir.                                                                     |
| `legacyPluginIds`                    | Hayır   | `string[]`                       | Bu kanonik Plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model referansları bunlardan bahsettiğinde bu Plugin'i otomatik olarak etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                    |
| `kind`                               | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan özel bir Plugin türü bildirir.                                                                                                                                                                       |
| `channels`                           | Hayır   | `string[]`                       | Bu Plugin'in sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                                              |
| `providers`                          | Hayır   | `string[]`                       | Bu Plugin'in sahip olduğu sağlayıcı kimlikleri.                                                                                                                                                                                             |
| `providerCatalogEntry`               | Hayır   | `string`                         | Tam Plugin çalışma zamanını etkinleştirmeden yüklenebilen, manifest kapsamlı sağlayıcı katalog meta verileri için Plugin köküne göre göreli hafif sağlayıcı katalog modülü yolu.                                                           |
| `modelSupport`                       | Hayır   | `object`                         | Çalışma zamanından önce Plugin'i otomatik yüklemek için kullanılan, manifestin sahip olduğu kısa model ailesi meta verileri.                                                                                                                 |
| `modelCatalog`                       | Hayır   | `object`                         | Bu Plugin'in sahip olduğu sağlayıcılar için bildirimsel model katalog meta verileri. Bu, Plugin çalışma zamanını yüklemeden gelecekteki salt okunur listeleme, onboarding, model seçiciler, takma adlar ve bastırma için kontrol düzlemi sözleşmesidir. |
| `modelPricing`                       | Hayır   | `object`                         | Sağlayıcının sahip olduğu harici fiyatlandırma arama ilkesi. Yerel/kendi barındırılan sağlayıcıları uzak fiyatlandırma kataloglarının dışında bırakmak veya çekirdekte sağlayıcı kimliklerini sabit kodlamadan sağlayıcı referanslarını OpenRouter/LiteLLM katalog kimliklerine eşlemek için kullanın. |
| `modelIdNormalization`               | Hayır   | `object`                         | Sağlayıcı çalışma zamanı yüklenmeden önce çalışması gereken, sağlayıcının sahip olduğu model kimliği takma adı/önek temizliği.                                                                                                               |
| `providerEndpoints`                  | Hayır   | `object[]`                       | Sağlayıcı çalışma zamanı yüklenmeden önce çekirdeğin sınıflandırması gereken sağlayıcı rotaları için manifestin sahip olduğu endpoint host/baseUrl meta verileri.                                                                           |
| `providerRequest`                    | Hayır   | `object`                         | Sağlayıcı çalışma zamanı yüklenmeden önce genel istek ilkesi tarafından kullanılan ucuz sağlayıcı ailesi ve istek uyumluluğu meta verileri.                                                                                                  |
| `cliBackends`                        | Hayır   | `string[]`                       | Bu Plugin'in sahip olduğu CLI çıkarım arka uç kimlikleri. Açık yapılandırma referanslarından başlangıçta otomatik etkinleştirme için kullanılır.                                                                                            |
| `syntheticAuthRefs`                  | Hayır   | `string[]`                       | Plugin'in sahip olduğu sentetik kimlik doğrulama hook'unun, çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında yoklanması gereken sağlayıcı veya CLI arka uç referansları.                                                         |
| `nonSecretAuthMarkers`               | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ortamdaki kimlik bilgisi durumunu temsil eden, paketle gelen Plugin'e ait yer tutucu API anahtarı değerleri.                                                                                                |
| `commandAliases`                     | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce Plugin farkındalıklı yapılandırma ve CLI tanılamaları üretmesi gereken, bu Plugin'in sahip olduğu komut adları.                                                                                             |
| `providerAuthEnvVars`                | Hayır   | `Record<string, string[]>`       | Sağlayıcı kimlik doğrulama/durum araması için kullanımdan kaldırılmış uyumluluk ortam meta verileri. Yeni Plugin'ler için `setup.providers[].envVars` tercih edin; OpenClaw bunu kullanımdan kaldırma penceresi boyunca okumaya devam eder. |
| `providerAuthAliases`                | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı.                      |
| `channelEnvVars`                     | Hayır   | `Record<string, string[]>`       | OpenClaw'ın Plugin kodunu yüklemeden inceleyebileceği ucuz kanal ortam meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam değişkeniyle yönlendirilen kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`                | Hayır   | `object[]`                       | Onboarding seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlama için ucuz kimlik doğrulama seçeneği meta verileri.                                                                                                  |
| `activation`                         | Hayır   | `object`                         | Başlangıç, sağlayıcı, komut, kanal, rota ve yetenekle tetiklenen yükleme için ucuz etkinleştirme planlayıcı meta verileri. Yalnızca meta veridir; gerçek davranış yine Plugin çalışma zamanına aittir.                                      |
| `setup`                              | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin Plugin çalışma zamanını yüklemeden inceleyebileceği ucuz kurulum/onboarding tanımlayıcıları.                                                                                                                 |
| `qaRunners`                          | Hayır   | `object[]`                       | Plugin çalışma zamanı yüklenmeden önce paylaşılan `openclaw qa` ana makinesi tarafından kullanılan ucuz QA çalıştırıcı tanımlayıcıları.                                                                                                     |
| `contracts`                          | Hayır   | `object`                         | Harici kimlik doğrulama hook'ları, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü üretimi, müzik üretimi, video üretimi, web getirme, web araması ve araç sahipliği için statik yetenek sahipliği anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için ucuz medya anlama varsayılanları.                                                                                                                       |
| `imageGenerationProviderMetadata`    | Hayır   | `Record<string, object>`         | `contracts.imageGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için, sağlayıcının sahip olduğu kimlik doğrulama takma adları ve temel URL korumaları dahil ucuz görüntü üretimi kimlik doğrulama meta verileri.              |
| `videoGenerationProviderMetadata`    | Hayır   | `Record<string, object>`         | `contracts.videoGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için, sağlayıcının sahip olduğu kimlik doğrulama takma adları ve temel URL korumaları dahil ucuz video üretimi kimlik doğrulama meta verileri.                 |
| `musicGenerationProviderMetadata`    | Hayır   | `Record<string, object>`         | `contracts.musicGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için, sağlayıcının sahip olduğu kimlik doğrulama takma adları ve temel URL korumaları dahil ucuz müzik üretimi kimlik doğrulama meta verileri.                 |
| `toolMetadata`                       | Hayır   | `Record<string, object>`         | `contracts.tools` içinde bildirilen, Plugin'in sahip olduğu araçlar için ucuz kullanılabilirlik meta verileri. Bir aracın yapılandırma, ortam veya kimlik doğrulama kanıtı olmadıkça çalışma zamanını yüklememesi gerektiğinde bunu kullanın. |
| `channelConfigs`                     | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, manifestin sahip olduğu kanal yapılandırma meta verileri.                                                                                                    |
| `skills`                             | Hayır   | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skill dizinleri.                                                                                                                                                                                |
| `name`                               | Hayır    | `string`                         | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                                            |
| `description`                        | Hayır    | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                          |
| `version`                            | Hayır    | `string`                         | Bilgilendirme amaçlı Plugin sürümü.                                                                                                                                                                                                |
| `uiHints`                            | Hayır    | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                    |

## Üretim sağlayıcısı metadata başvurusu

Üretim sağlayıcısı metadata alanları, eşleşen `contracts.*GenerationProviders` listesinde
bildirilen sağlayıcılar için statik kimlik doğrulama sinyallerini tanımlar.
OpenClaw, bu alanları sağlayıcı çalışma zamanı yüklenmeden önce okur; böylece çekirdek araçlar
her sağlayıcı Plugin’ini içe aktarmadan bir üretim sağlayıcısının kullanılabilir olup olmadığına
karar verebilir.

Bu alanları yalnızca ucuz, bildirime dayalı olgular için kullanın. Taşıma, istek
dönüşümleri, token yenileme, kimlik bilgisi doğrulama ve gerçek üretim davranışı
Plugin çalışma zamanında kalır.

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

Her metadata girdisi şunları destekler:

| Alan            | Gerekli | Tür        | Anlamı                                                                                                                                      |
| --------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Hayır   | `string[]` | Üretim sağlayıcısı için statik kimlik doğrulama takma adları olarak sayılması gereken ek sağlayıcı kimlikleri.                              |
| `authProviders` | Hayır   | `string[]` | Yapılandırılmış kimlik doğrulama profilleri bu üretim sağlayıcısı için kimlik doğrulama olarak sayılması gereken sağlayıcı kimlikleri.       |
| `configSignals` | Hayır   | `object[]` | Kimlik doğrulama profilleri veya env değişkenleri olmadan yapılandırılabilen yerel ya da kendi barındırılan sağlayıcılar için ucuz, yalnızca yapılandırma kullanılabilirlik sinyalleri. |
| `authSignals`   | Hayır   | `object[]` | Açık kimlik doğrulama sinyalleri. Mevcut olduklarında, sağlayıcı kimliğinden, `aliases` ve `authProviders` alanlarından gelen varsayılan sinyal kümesinin yerini alırlar. |

Her `configSignals` girdisi şunları destekler:

| Alan          | Gerekli | Tür        | Anlamı                                                                                                                                                                                 |
| ------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Evet    | `string`   | İncelenecek, Plugin’e ait yapılandırma nesnesine noktalı yol; örneğin `plugins.entries.example.config`.                                                                                |
| `overlayPath` | Hayır   | `string`   | Sinyal değerlendirilmeden önce kök nesnenin üzerine bindirilecek nesnenin kök yapılandırma içindeki noktalı yolu. Bunu `image`, `video` veya `music` gibi yeteneklere özgü yapılandırma için kullanın. |
| `required`    | Hayır   | `string[]` | Etkili yapılandırma içinde yapılandırılmış değerlere sahip olması gereken noktalı yollar. Dizeler boş olmamalıdır; nesneler ve diziler boş olmamalıdır.                                |
| `requiredAny` | Hayır   | `string[]` | Etkili yapılandırma içinde en az birinin yapılandırılmış değere sahip olması gereken noktalı yollar.                                                                                   |
| `mode`        | Hayır   | `object`   | Etkili yapılandırma içinde isteğe bağlı dize modu koruması. Bunu, yalnızca yapılandırmaya dayalı kullanılabilirlik sadece tek bir moda uygulanıyorsa kullanın.                         |

Her `mode` koruması şunları destekler:

| Alan          | Gerekli | Tür        | Anlamı                                                                                |
| ------------- | ------- | ---------- | ------------------------------------------------------------------------------------- |
| `path`        | Hayır   | `string`   | Etkili yapılandırma içindeki noktalı yol. Varsayılan değer `mode` olur.               |
| `default`     | Hayır   | `string`   | Yapılandırma yolu atladığında kullanılacak mod değeri.                                |
| `allowed`     | Hayır   | `string[]` | Mevcutsa sinyal yalnızca etkili mod bu değerlerden biri olduğunda geçer.              |
| `disallowed`  | Hayır   | `string[]` | Mevcutsa sinyal, etkili mod bu değerlerden biri olduğunda başarısız olur.             |

Her `authSignals` girdisi şunları destekler:

| Alan              | Gerekli | Tür      | Anlamı                                                                                                                                                         |
| ----------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet    | `string` | Yapılandırılmış kimlik doğrulama profillerinde denetlenecek sağlayıcı kimliği.                                                                                  |
| `providerBaseUrl` | Hayır   | `object` | Sinyalin yalnızca başvurulan yapılandırılmış sağlayıcı izin verilen bir temel URL kullandığında sayılmasını sağlayan isteğe bağlı koruma. Bunu, bir kimlik doğrulama takma adı yalnızca belirli API’ler için geçerliyse kullanın. |

Her `providerBaseUrl` koruması şunları destekler:

| Alan              | Gerekli | Tür        | Anlamı                                                                                                                                      |
| ----------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet    | `string`   | `baseUrl` değeri denetlenecek sağlayıcı yapılandırma kimliği.                                                                               |
| `defaultBaseUrl`  | Hayır   | `string`   | Sağlayıcı yapılandırması `baseUrl` değerini atladığında varsayılacak temel URL.                                                             |
| `allowedBaseUrls` | Evet    | `string[]` | Bu kimlik doğrulama sinyali için izin verilen temel URL’ler. Yapılandırılmış veya varsayılan temel URL bu normalize edilmiş değerlerden biriyle eşleşmediğinde sinyal yok sayılır. |

## Araç metadata başvurusu

`toolMetadata`, araç adına göre anahtarlanmış olarak üretim sağlayıcısı metadata’sı ile
aynı `configSignals` ve `authSignals` şekillerini kullanır. `contracts.tools` sahipliği
bildirir. `toolMetadata`, OpenClaw’ın yalnızca araç fabrikasının `null` döndürmesini
sağlamak için bir Plugin çalışma zamanını içe aktarmaktan kaçınabilmesi amacıyla ucuz
kullanılabilirlik kanıtı bildirir.

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

Bir araçta `toolMetadata` yoksa OpenClaw mevcut davranışı korur ve
araç sözleşmesi ilkeyle eşleştiğinde sahibi olan Plugin’i yükler. Fabrikası
kimlik doğrulama/yapılandırmaya bağlı olan sıcak yol araçları için Plugin yazarları,
çekirdeğin sormak amacıyla çalışma zamanını içe aktarmasını sağlamak yerine
`toolMetadata` bildirmelidir.

## providerAuthChoices başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçimini açıklar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.
Sağlayıcı kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden bu manifest seçimlerini,
tanımlayıcıdan türetilmiş kurulum seçimlerini ve kurulum kataloğu metadata’sını kullanır.

| Alan                  | Gerekli | Tür                                             | Anlamı                                                                                                         |
| --------------------- | ------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                       | Bu seçimin ait olduğu sağlayıcı kimliği.                                                                       |
| `method`              | Evet    | `string`                                       | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                              |
| `choiceId`            | Evet    | `string`                                       | Onboarding ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçimi kimliği.                      |
| `choiceLabel`         | Hayır   | `string`                                       | Kullanıcıya gösterilen etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                              |
| `choiceHint`          | Hayır   | `string`                                       | Seçici için kısa yardımcı metin.                                                                               |
| `assistantPriority`   | Hayır   | `number`                                       | Daha düşük değerler, asistan odaklı etkileşimli seçicilerde daha önce sıralanır.                               |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                 | Manuel CLI seçimine yine de izin verirken seçimi asistan seçicilerinden gizler.                                |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                     | Kullanıcıları bu yedek seçime yönlendirmesi gereken eski seçim kimlikleri.                                     |
| `groupId`             | Hayır   | `string`                                       | İlgili seçimleri gruplamak için isteğe bağlı grup kimliği.                                                     |
| `groupLabel`          | Hayır   | `string`                                       | Bu grup için kullanıcıya gösterilen etiket.                                                                    |
| `groupHint`           | Hayır   | `string`                                       | Grup için kısa yardımcı metin.                                                                                 |
| `optionKey`           | Hayır   | `string`                                       | Basit tek bayraklı kimlik doğrulama akışları için dahili seçenek anahtarı.                                     |
| `cliFlag`             | Hayır   | `string`                                       | `--openrouter-api-key` gibi CLI bayrağı adı.                                                                   |
| `cliOption`           | Hayır   | `string`                                       | `--openrouter-api-key <key>` gibi tam CLI seçenek şekli.                                                       |
| `cliDescription`      | Hayır   | `string`                                       | CLI yardımında kullanılan açıklama.                                                                            |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçimin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan olarak `["text-inference"]` olur. |

## commandAliases başvurusu

`commandAliases` öğesini, bir Plugin kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahip olduğunda kullanın. OpenClaw bu üst veriyi, Plugin çalışma zamanı kodunu içe aktarmadan tanılama için kullanır.

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

| Alan         | Gerekli | Tür               | Ne anlama gelir                                                                 |
| ------------ | ------- | ----------------- | ------------------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu Plugin'e ait komut adı.                                                      |
| `kind`       | Hayır   | `"runtime-slash"` | Alias'ı kök CLI komutu yerine sohbet slash komutu olarak işaretler.             |
| `cliCommand` | Hayır   | `string`          | Varsa, CLI işlemleri için önerilecek ilişkili kök CLI komutu.                   |

## activation başvurusu

Plugin hangi denetim düzlemi olaylarının onu bir etkinleştirme/yükleme planına dahil etmesi gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

Bu blok bir planlayıcı üst verisidir, yaşam döngüsü API'si değildir. Çalışma zamanı davranışı kaydetmez, `register(...)` yerine geçmez ve Plugin kodunun zaten çalıştırılmış olduğunu vaat etmez. Etkinleştirme planlayıcısı, mevcut manifest sahiplik üst verilerine, örneğin `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve hook'lara geri dönmeden önce aday Plugin'leri daraltmak için bu alanları kullanır.

Sahipliği zaten açıklayan en dar üst veriyi tercih edin. İlişkiyi bu alanlar ifade ediyorsa `providers`, `channels`, `commandAliases`, setup tanımlayıcıları veya `contracts` kullanın. Bu sahiplik alanlarıyla temsil edilemeyen ek planlayıcı ipuçları için `activation` kullanın.
`claude-cli`, `codex-cli` veya `google-gemini-cli` gibi CLI çalışma zamanı alias'ları için üst düzey `cliBackends` kullanın; `activation.onAgentHarnesses` yalnızca zaten bir sahiplik alanı bulunmayan gömülü ajan harness kimlikleri içindir.

Bu blok yalnızca üst veridir. Çalışma zamanı davranışı kaydetmez ve `register(...)`, `setupEntry` ya da diğer çalışma zamanı/Plugin giriş noktalarının yerine geçmez. Geçerli tüketiciler bunu daha geniş Plugin yüklemesinden önce daraltıcı bir ipucu olarak kullanır; bu nedenle startup dışı etkinleştirme üst verisinin eksik olması genellikle yalnızca performansa mal olur; manifest sahiplik fallback'leri hâlâ mevcutken doğruluğu değiştirmemelidir.

Her Plugin `activation.onStartup` değerini bilinçli olarak ayarlamalıdır. Yalnızca Plugin'in Gateway startup sırasında çalışması gerekiyorsa `true` olarak ayarlayın. Plugin startup sırasında etkisizse ve yalnızca daha dar tetikleyicilerden yüklenmesi gerekiyorsa `false` olarak ayarlayın. `onStartup` öğesinin atlanması artık Plugin'i startup sırasında örtük olarak yüklemez; startup, kanal, yapılandırma, ajan harness, bellek veya diğer daha dar etkinleştirme tetikleyicileri için açık etkinleştirme üst verisi kullanın.

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

| Alan               | Gerekli | Tür                                                  | Ne anlama gelir                                                                                                                                                                                        |
| ------------------ | ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Hayır   | `boolean`                                            | Açık Gateway startup etkinleştirmesi. Her Plugin bunu ayarlamalıdır. `true` startup sırasında Plugin'i içe aktarır; `false`, başka bir eşleşen tetikleyici yükleme gerektirmedikçe startup sırasında tembel bırakır. |
| `onProviders`      | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                                                                                                                |
| `onAgentHarnesses` | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken gömülü ajan harness çalışma zamanı kimlikleri. CLI backend alias'ları için üst düzey `cliBackends` kullanın.                       |
| `onCommands`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                                                                                                                    |
| `onChannels`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                                                                                                                    |
| `onRoutes`         | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                                                                                                                        |
| `onConfigPaths`    | Hayır   | `string[]`                                           | Yol mevcut olduğunda ve açıkça devre dışı bırakılmadığında bu Plugin'i startup/yükleme planlarına dahil etmesi gereken köke göre yapılandırma yolları.                                                 |
| `onCapabilities`   | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Denetim düzlemi etkinleştirme planlaması tarafından kullanılan geniş yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin.                                                                  |

Geçerli canlı tüketiciler:

- Gateway startup planlaması, açık startup içe aktarması için `activation.onStartup` kullanır
- komutla tetiklenen CLI planlaması, eski `commandAliases[].cliCommand` veya `commandAliases[].name` değerlerine geri döner
- ajan çalışma zamanı startup planlaması, gömülü harness'ler için `activation.onAgentHarnesses` ve CLI çalışma zamanı alias'ları için üst düzey `cliBackends[]` kullanır
- kanalla tetiklenen setup/kanal planlaması, açık kanal etkinleştirme üst verisi eksik olduğunda eski `channels[]` sahipliğine geri döner
- startup Plugin planlaması, paketli tarayıcı Plugin'inin `browser` bloğu gibi kanal dışı kök yapılandırma yüzeyleri için `activation.onConfigPaths` kullanır
- sağlayıcıyla tetiklenen setup/çalışma zamanı planlaması, açık sağlayıcı etkinleştirme üst verisi eksik olduğunda eski `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

Planlayıcı tanılamaları, açık etkinleştirme ipuçlarını manifest sahiplik fallback'inden ayırt edebilir. Örneğin, `activation-command-hint`, `activation.onCommands` eşleştiği anlamına gelirken `manifest-command-alias`, planlayıcının bunun yerine `commandAliases` sahipliğini kullandığı anlamına gelir. Bu neden etiketleri ana makine tanılamaları ve testleri içindir; Plugin yazarları sahipliği en iyi açıklayan üst veriyi bildirmeye devam etmelidir.

## qaRunners başvurusu

Bir Plugin paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma çalıştırıcısı sağladığında `qaRunners` kullanın. Bu üst veriyi düşük maliyetli ve statik tutun; gerçek CLI kaydının sahibi hâlâ `qaRunnerCliRegistrations` dışa aktaran hafif bir `runtime-api.ts` yüzeyi üzerinden Plugin çalışma zamanıdır.

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

| Alan          | Gerekli | Tür      | Ne anlama gelir                                                               |
| ------------- | ------- | -------- | ----------------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altına bağlanan alt komut, örneğin `matrix`.                    |
| `description` | Hayır   | `string` | Paylaşılan ana makinenin stub komuta ihtiyaç duyduğunda kullandığı fallback yardım metni. |

## setup başvurusu

Setup ve onboarding yüzeyleri çalışma zamanı yüklenmeden önce düşük maliyetli, Plugin'in sahibi olduğu üst veriye ihtiyaç duyduğunda `setup` kullanın.

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

Üst düzey `cliBackends` geçerli kalır ve CLI çıkarım backend'lerini açıklamaya devam eder. `setup.cliBackends`, yalnızca üst veri olarak kalması gereken denetim düzlemi/setup akışları için setup'a özgü tanımlayıcı yüzeyidir.

Mevcut olduğunda `setup.providers` ve `setup.cliBackends`, setup keşfi için tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday Plugin'i daraltıyorsa ve setup hâlâ daha zengin setup zamanı çalışma zamanı hook'larına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve fallback yürütme yolu olarak `setup-api` öğesini yerinde tutun.

OpenClaw ayrıca genel sağlayıcı kimlik doğrulaması ve env-var aramalarına `setup.providers[].envVars` öğesini dahil eder. `providerAuthEnvVars`, kullanımdan kaldırma penceresi sırasında uyumluluk adaptörü üzerinden desteklenmeye devam eder, ancak bunu hâlâ kullanan paketli olmayan Plugin'ler bir manifest tanılaması alır. Yeni Plugin'ler setup/durum env üst verisini `setup.providers[].envVars` üzerine koymalıdır.

OpenClaw, setup girişi bulunmadığında veya `setup.requiresRuntime: false` setup çalışma zamanının gereksiz olduğunu bildirdiğinde `setup.providers[].authMethods` üzerinden basit setup seçenekleri de türetebilir. Açık `providerAuthChoices` girdileri özel etiketler, CLI flag'leri, onboarding kapsamı ve asistan üst verisi için tercih edilmeye devam eder.

`requiresRuntime: false` değerini yalnızca bu tanımlayıcılar setup yüzeyi için yeterliyse ayarlayın. OpenClaw açık `false` değerini yalnızca tanımlayıcı sözleşmesi olarak ele alır ve setup araması için `setup-api` veya `openclaw.setupEntry` çalıştırmaz. Yalnızca tanımlayıcı kullanan bir Plugin hâlâ bu setup çalışma zamanı girişlerinden birini gönderiyorsa OpenClaw eklemeli bir tanılama raporlar ve onu yok saymaya devam eder. `requiresRuntime` öğesinin atlanması eski fallback davranışını korur, böylece flag olmadan tanımlayıcı ekleyen mevcut Plugin'ler bozulmaz.

Setup araması Plugin'in sahibi olduğu `setup-api` kodunu çalıştırabildiğinden, normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen Plugin'ler genelinde benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine kapalı olarak başarısız olur.

Setup çalışma zamanı çalıştığında, setup kayıt defteri tanılamaları `setup-api` manifest tanımlayıcılarının bildirmediği bir sağlayıcı veya CLI backend kaydederse ya da bir tanımlayıcının eşleşen çalışma zamanı kaydı yoksa tanımlayıcı sapması raporlar. Bu tanılamalar eklemelidir ve eski Plugin'leri reddetmez.

### setup.providers başvurusu

| Alan           | Gerekli | Tür        | Ne anlama gelir                                                                                         |
| -------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `id`           | Evet    | `string`   | Setup veya onboarding sırasında açığa çıkarılan sağlayıcı kimliği. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods`  | Hayır   | `string[]` | Bu sağlayıcının tam çalışma zamanını yüklemeden desteklediği setup/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`      | Hayır   | `string[]` | Genel setup/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden önce denetleyebileceği env var'lar.    |
| `authEvidence` | Hayır   | `object[]` | Gizli olmayan işaretler üzerinden kimlik doğrulayabilen sağlayıcılar için düşük maliyetli yerel kimlik doğrulama kanıtı denetimleri. |

`authEvidence`, çalışma zamanı kodu yüklenmeden doğrulanabilen, sağlayıcıya ait yerel kimlik bilgisi işaretçileri içindir. Bu kontroller ucuz ve yerel kalmalıdır: ağ çağrısı yok, anahtar zinciri veya gizli dizi yöneticisi okuması yok, kabuk komutu yok ve sağlayıcı API yoklaması yok.

Desteklenen kanıt girdileri:

| Alan               | Gerekli | Tür        | Ne anlama gelir                                                                                                     |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `type`             | Evet    | `string`   | Şu anda `local-file-with-env`.                                                                                      |
| `fileEnvVar`       | Hayır   | `string`   | Açık bir kimlik bilgisi dosya yolu içeren env var.                                                                  |
| `fallbackPaths`    | Hayır   | `string[]` | `fileEnvVar` yokken veya boşken kontrol edilen yerel kimlik bilgisi dosya yolları. `${HOME}` ve `${APPDATA}` desteklenir. |
| `requiresAnyEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen env var değerlerinden en az biri boş olmamalıdır.                             |
| `requiresAllEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen her env var boş olmamalıdır.                                                  |
| `credentialMarker` | Evet    | `string`   | Kanıt mevcut olduğunda döndürülen gizli olmayan işaretçi.                                                           |
| `source`           | Hayır   | `string`   | Kimlik doğrulama/durum çıktısı için kullanıcıya görünen kaynak etiketi.                                             |

### setup alanları

| Alan               | Gerekli | Tür        | Ne anlama gelir                                                                                         |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve alıştırma sırasında gösterilen sağlayıcı kurulum tanımlayıcıları.                            |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kurulum zamanı backend kimlikleri. Normalleştirilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu plugin'in kurulum yüzeyine ait yapılandırma geçiş kimlikleri.                                        |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.           |

## uiHints başvurusu

`uiHints`, yapılandırma alan adlarından küçük işleme ipuçlarına uzanan bir haritadır.

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

| Alan          | Tür        | Ne anlama gelir                              |
| ------------- | ---------- | ------------------------------------------- |
| `label`       | `string`   | Kullanıcıya görünen alan etiketi.           |
| `help`        | `string`   | Kısa yardımcı metin.                        |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.                 |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.            |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler.   |
| `placeholder` | `string`   | Form girişleri için yer tutucu metin.       |

## contracts başvurusu

`contracts` öğesini yalnızca OpenClaw'ın plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği meta verileri için kullanın.

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

| Alan                             | Tür        | Ne anlama gelir                                                              |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory kimlikleri, şu anda `codex-app-server`.   |
| `agentToolResultMiddleware`      | `string[]` | Paketli bir plugin'in araç sonucu middleware'i kaydedebileceği çalışma zamanı kimlikleri. |
| `externalAuthProviders`          | `string[]` | Dış kimlik doğrulama profili hook'u bu plugin'e ait olan sağlayıcı kimlikleri. |
| `speechProviders`                | `string[]` | Bu plugin'e ait konuşma sağlayıcısı kimlikleri.                              |
| `realtimeTranscriptionProviders` | `string[]` | Bu plugin'e ait gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri.        |
| `realtimeVoiceProviders`         | `string[]` | Bu plugin'e ait gerçek zamanlı ses sağlayıcısı kimlikleri.                   |
| `memoryEmbeddingProviders`       | `string[]` | Bu plugin'e ait bellek gömme sağlayıcısı kimlikleri.                         |
| `mediaUnderstandingProviders`    | `string[]` | Bu plugin'e ait medya anlama sağlayıcısı kimlikleri.                         |
| `imageGenerationProviders`       | `string[]` | Bu plugin'e ait görüntü oluşturma sağlayıcısı kimlikleri.                    |
| `videoGenerationProviders`       | `string[]` | Bu plugin'e ait video oluşturma sağlayıcısı kimlikleri.                      |
| `webFetchProviders`              | `string[]` | Bu plugin'e ait web getirme sağlayıcısı kimlikleri.                          |
| `webSearchProviders`             | `string[]` | Bu plugin'e ait web arama sağlayıcısı kimlikleri.                            |
| `migrationProviders`             | `string[]` | `openclaw migrate` için bu plugin'e ait içe aktarma sağlayıcısı kimlikleri.  |
| `tools`                          | `string[]` | Bu plugin'e ait ajan araç adları.                                            |

`contracts.embeddedExtensionFactories`, paketli ve yalnızca Codex app-server için olan extension factory'ler için tutulur. Paketli araç sonucu dönüşümleri bunun yerine `contracts.agentToolResultMiddleware` bildirmeli ve `api.registerAgentToolResultMiddleware(...)` ile kaydolmalıdır. Dış plugin'ler araç sonucu middleware'i kaydedemez, çünkü bu seam, model görmeden önce yüksek güvenli araç çıktısını yeniden yazabilir.

Çalışma zamanı `api.registerTool(...)` kayıtları `contracts.tools` ile eşleşmelidir. Araç keşfi, istenen araçlara sahip olabilecek yalnızca plugin çalışma zamanlarını yüklemek için bu listeyi kullanır.

`resolveExternalAuthProfiles` uygulayan sağlayıcı plugin'leri `contracts.externalAuthProviders` bildirmelidir. Bildirimi olmayan plugin'ler hâlâ kullanımdan kaldırılmış bir uyumluluk fallback'i üzerinden çalışır, ancak bu fallback daha yavaştır ve geçiş penceresinden sonra kaldırılacaktır.

Paketli bellek gömme sağlayıcıları, `local` gibi yerleşik adapter'lar dahil olmak üzere sundukları her adapter kimliği için `contracts.memoryEmbeddingProviders` bildirmelidir. Bağımsız CLI yolları, sağlayıcılar tam Gateway çalışma zamanı tarafından kaydedilmeden önce yalnızca sahip plugin'i yüklemek için bu manifest sözleşmesini kullanır.

## mediaUnderstandingProviderMetadata başvurusu

Bir medya anlama sağlayıcısının varsayılan modelleri, otomatik kimlik doğrulama fallback önceliği veya genel çekirdek yardımcıların çalışma zamanı yüklenmeden önce ihtiyaç duyduğu yerel belge desteği olduğunda `mediaUnderstandingProviderMetadata` kullanın. Anahtarlar ayrıca `contracts.mediaUnderstandingProviders` içinde bildirilmelidir.

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

| Alan                   | Tür                                 | Ne anlama gelir                                                               |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Bu sağlayıcı tarafından sunulan medya yetenekleri.                            |
| `defaultModels`        | `Record<string, string>`            | Yapılandırma bir model belirtmediğinde kullanılan yetenekten modele varsayılanları. |
| `autoPriority`         | `Record<string, number>`            | Otomatik kimlik bilgisi tabanlı sağlayıcı fallback'i için düşük sayılar daha erken sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Sağlayıcı tarafından desteklenen yerel belge girişleri.                       |

## channelConfigs başvurusu

Bir kanal plugin'inin çalışma zamanı yüklenmeden önce ucuz yapılandırma meta verilerine ihtiyaç duyduğu durumlarda `channelConfigs` kullanın. Salt okunur kanal kurulum/durum keşfi, kurulum girdisi yoksa veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildiriyorsa, yapılandırılmış dış kanallar için bu meta verileri doğrudan kullanabilir.

`channelConfigs`, plugin manifest meta verisidir; yeni bir üst düzey kullanıcı yapılandırması bölümü değildir. Kullanıcılar kanal örneklerini hâlâ `channels.<channel-id>` altında yapılandırır. OpenClaw, plugin çalışma zamanı kodu yürütülmeden önce yapılandırılmış kanala hangi plugin'in sahip olduğunu belirlemek için manifest meta verilerini okur.

Bir kanal plugin'i için `configSchema` ve `channelConfigs` farklı yolları tanımlar:

- `configSchema`, `plugins.entries.<plugin-id>.config` değerini doğrular
- `channelConfigs.<channel-id>.schema`, `channels.<channel-id>` değerini doğrular

`channels[]` bildiren paketli olmayan plugin'ler, eşleşen `channelConfigs` girdilerini de bildirmelidir. Bunlar olmadan OpenClaw plugin'i yine de yükleyebilir, ancak soğuk yol yapılandırma şeması, kurulum ve Control UI yüzeyleri, plugin çalışma zamanı yürütülene kadar kanalın sahip olduğu seçenek şeklini bilemez.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` ve `nativeSkillsAutoEnabled`, kanal çalışma zamanı yüklenmeden önce çalışan komut yapılandırması kontrolleri için statik `auto` varsayılanları bildirebilir. Paketli kanallar, diğer pakete ait kanal katalog meta verilerinin yanında aynı varsayılanları `package.json#openclaw.channel.commands` üzerinden de yayımlayabilir.

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

| Alan          | Tür                      | Anlamı                                                                                    |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Schema. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucuları/hassas ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                  |
| `commands`    | `object`                 | Çalışma zamanı öncesi yapılandırma kontrolleri için statik yerel komut ve yerel Skills otomatik varsayılanları. |
| `preferOver`  | `string[]`               | Bu kanalın seçim yüzeylerinde önüne geçmesi gereken eski veya daha düşük öncelikli Plugin kimlikleri. |

### Başka bir kanal Plugin'ini değiştirme

Plugin'iniz, başka bir Plugin'in de sağlayabildiği bir kanal kimliği için tercih
edilen sahip olduğunda `preferOver` kullanın. Yaygın durumlar yeniden adlandırılmış
bir Plugin kimliği, paketlenmiş bir Plugin'in yerine geçen bağımsız bir Plugin
veya yapılandırma uyumluluğu için aynı kanal kimliğini koruyan bakımı yapılan
bir fork'tur.

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
paketlenmiş olduğu veya varsayılan olarak etkinleştirildiği için seçildiyse,
OpenClaw etkili çalışma zamanı yapılandırmasında onu devre dışı bırakır; böylece
kanalın ve araçlarının sahibi tek bir Plugin olur. Açık kullanıcı seçimi yine
önceliklidir: kullanıcı her iki Plugin'i de açıkça etkinleştirirse OpenClaw bu
seçimi korur ve istenen Plugin kümesini sessizce değiştirmek yerine yinelenen
kanal/araç tanılamaları bildirir.

`preferOver` kapsamını gerçekten aynı kanalı sağlayabilen Plugin kimlikleriyle
sınırlı tutun. Bu genel bir öncelik alanı değildir ve kullanıcı yapılandırma
anahtarlarını yeniden adlandırmaz.

## modelSupport başvurusu

OpenClaw'ın Plugin çalışma zamanı yüklenmeden önce sağlayıcı Plugin'inizi
`gpt-5.5` veya `claude-sonnet-4.6` gibi kısa model kimliklerinden çıkarması
gerektiğinde `modelSupport` kullanın.

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
- `modelPatterns`, `modelPrefixes` karşısında üstün gelir
- paketlenmemiş bir Plugin ve paketlenmiş bir Plugin eşleşirse paketlenmemiş
  Plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtene kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                          |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleştirilen önekler.             |
| `modelPatterns` | `string[]` | Profil soneki kaldırıldıktan sonra kısa model kimliklerine karşı eşleştirilen regex kaynakları. |

## modelCatalog başvurusu

OpenClaw'ın Plugin çalışma zamanını yüklemeden önce sağlayıcı model meta
verilerini bilmesi gerektiğinde `modelCatalog` kullanın. Bu, sabit katalog
satırları, sağlayıcı takma adları, bastırma kuralları ve keşif modu için
manifest'e ait kaynaktır. Çalışma zamanı yenilemesi yine sağlayıcı çalışma
zamanı koduna aittir, ancak manifest çekirdeğe çalışma zamanının ne zaman
gerektiğini bildirir.

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
| `providers`    | `Record<string, object>`                                 | Bu Plugin'in sahip olduğu sağlayıcı kimlikleri için katalog satırları. Anahtarlar üst düzey `providers` içinde de görünmelidir. |
| `aliases`      | `Record<string, object>`                                 | Katalog veya bastırma planlaması için sahip olunan bir sağlayıcıya çözümlenmesi gereken sağlayıcı takma adları. |
| `suppressions` | `object[]`                                               | Bu Plugin'in sağlayıcıya özgü bir nedenle bastırdığı başka bir kaynaktan gelen model satırları.             |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Sağlayıcı kataloğunun manifest meta verilerinden okunup okunamayacağı, önbelleğe yenilenip yenilenemeyeceği veya çalışma zamanı gerektirip gerektirmediği. |

`aliases`, model kataloğu planlaması için sağlayıcı sahipliği aramasına katılır.
Takma ad hedefleri, aynı Plugin'in sahip olduğu üst düzey sağlayıcılar olmalıdır.
Sağlayıcıyla filtrelenmiş bir liste bir takma ad kullandığında OpenClaw sahip
olan manifest'i okuyabilir ve sağlayıcı çalışma zamanını yüklemeden takma ad
API/base URL geçersiz kılmalarını uygulayabilir.
Takma adlar filtrelenmemiş katalog listelerini genişletmez; geniş listeler
yalnızca sahip olan kanonik sağlayıcı satırlarını yayar.

`suppressions` eski sağlayıcı çalışma zamanı `suppressBuiltInModel` hook'unun
yerini alır. Bastırma girdileri yalnızca sağlayıcı Plugin'e ait olduğunda veya
sahip olunan bir sağlayıcıyı hedefleyen bir `modelCatalog.aliases` anahtarı
olarak bildirildiğinde dikkate alınır. Model çözümleme sırasında çalışma zamanı
bastırma hook'ları artık çağrılmaz.

Sağlayıcı alanları:

| Alan      | Tür                      | Anlamı                                                             |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan base URL. |
| `api`     | `ModelApi`               | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan API bağdaştırıcısı. |
| `headers` | `Record<string, string>` | Bu sağlayıcı kataloğuna uygulanan isteğe bağlı statik headers.      |
| `models`  | `object[]`               | Gerekli model satırları. `id` olmadan satırlar yok sayılır.         |

Model alanları:

| Alan            | Tür                                                            | Anlamı                                                                      |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` öneki olmadan, sağlayıcıya yerel model kimliği.                  |
| `name`          | `string`                                                       | İsteğe bağlı görüntüleme adı.                                                |
| `api`           | `ModelApi`                                                     | İsteğe bağlı model başına API geçersiz kılması.                              |
| `baseUrl`       | `string`                                                       | İsteğe bağlı model başına base URL geçersiz kılması.                         |
| `headers`       | `Record<string, string>`                                       | İsteğe bağlı model başına statik headers.                                    |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modelin kabul ettiği modaliteler.                                            |
| `reasoning`     | `boolean`                                                      | Modelin reasoning davranışı sunup sunmadığı.                                 |
| `contextWindow` | `number`                                                       | Yerel sağlayıcı bağlam penceresi.                                            |
| `contextTokens` | `number`                                                       | `contextWindow` değerinden farklı olduğunda isteğe bağlı etkili çalışma zamanı bağlam sınırı. |
| `maxTokens`     | `number`                                                       | Bilindiğinde maksimum çıktı token'ları.                                      |
| `cost`          | `object`                                                       | İsteğe bağlı `tieredPricing` dahil, milyon token başına isteğe bağlı USD fiyatlandırması. |
| `compat`        | `object`                                                       | OpenClaw model yapılandırması uyumluluğuyla eşleşen isteğe bağlı uyumluluk bayrakları. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listeleme durumu. Yalnızca satırın hiç görünmemesi gerektiğinde bastırın.    |
| `statusReason`  | `string`                                                       | Kullanılamayan durumla birlikte gösterilen isteğe bağlı neden.               |
| `replaces`      | `string[]`                                                     | Bu modelin yerini aldığı eski sağlayıcıya yerel model kimlikleri.            |
| `replacedBy`    | `string`                                                       | Kullanımdan kaldırılmış satırlar için yedek sağlayıcıya yerel model kimliği. |
| `tags`          | `string[]`                                                     | Seçiciler ve filtreler tarafından kullanılan kararlı etiketler.              |

Bastırma alanları:

| Alan                       | Tür        | Anlamı                                                                                                    |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Bastırılacak üst kaynak satırı için sağlayıcı kimliği. Bu Plugin'e ait olmalı veya sahip olunan bir takma ad olarak bildirilmelidir. |
| `model`                    | `string`   | Bastırılacak sağlayıcıya yerel model kimliği.                                                             |
| `reason`                   | `string`   | Bastırılan satır doğrudan istendiğinde gösterilen isteğe bağlı mesaj.                                     |
| `when.baseUrlHosts`        | `string[]` | Bastırma uygulanmadan önce gereken isteğe bağlı etkili sağlayıcı base URL host'ları listesi.              |
| `when.providerConfigApiIn` | `string[]` | Bastırma uygulanmadan önce gereken tam sağlayıcı yapılandırması `api` değerlerinin isteğe bağlı listesi.  |

Yalnızca çalışma zamanına ait verileri `modelCatalog` içine koymayın. `static` değerini yalnızca manifest
satırları, sağlayıcıya göre filtrelenmiş liste ve seçici yüzeylerinin kayıt defteri/çalışma zamanı keşfini atlaması için yeterince eksiksiz olduğunda kullanın.
Manifest satırları yararlı listelenebilir başlangıç verileri veya tamamlayıcılar olduğunda, ancak yenileme/önbellek daha sonra daha fazla satır ekleyebildiğinde
`refreshable` kullanın; refreshable satırlar tek başlarına yetkili değildir. OpenClaw
listeyi bilmek için sağlayıcı çalışma zamanını yüklemek zorunda olduğunda `runtime` kullanın.

## modelIdNormalization başvurusu

Sağlayıcı çalışma zamanı yüklenmeden önce gerçekleşmesi gereken ucuz, sağlayıcıya ait model kimliği temizliği için
`modelIdNormalization` kullanın. Bu, kısa model
adları, sağlayıcıya yerel eski kimlikler ve proxy önek kuralları gibi takma adları, çekirdek model seçimi tabloları yerine sahibi olan Plugin
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

| Alan                                 | Tür                     | Ne anlama gelir                                                                                 |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Büyük/küçük harfe duyarsız tam model kimliği takma adları. Değerler yazıldığı gibi döndürülür. |
| `stripPrefixes`                      | `string[]`              | Takma ad aramasından önce kaldırılacak önekler; eski sağlayıcı/model yinelemeleri için kullanışlıdır. |
| `prefixWhenBare`                     | `string`                | Normalleştirilmiş model kimliği zaten `/` içermiyorsa eklenecek önek.                          |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Takma ad aramasından sonra, `modelPrefix` ve `prefix` ile anahtarlanan koşullu çıplak kimlik önek kuralları. |

## providerEndpoints başvurusu

Sağlayıcı çalışma zamanı yüklenmeden önce genel istek ilkesinin bilmesi gereken uç nokta sınıflandırması için
`providerEndpoints` kullanın. Çekirdek hâlâ her
`endpointClass` değerinin anlamına sahiptir; Plugin manifestleri ana makine ve temel URL meta verilerine sahiptir.

Uç nokta alanları:

| Alan                           | Tür        | Ne anlama gelir                                                                                  |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `endpointClass`                | `string`   | `openrouter`, `moonshot-native` veya `google-vertex` gibi bilinen çekirdek uç nokta sınıfı.     |
| `hosts`                        | `string[]` | Uç nokta sınıfına eşlenen tam ana makine adları.                                                 |
| `hostSuffixes`                 | `string[]` | Uç nokta sınıfına eşlenen ana makine sonekleri. Yalnızca alan adı soneki eşleştirmesi için `.` ile önekleyin. |
| `baseUrls`                     | `string[]` | Uç nokta sınıfına eşlenen tam normalleştirilmiş HTTP(S) temel URL’leri.                         |
| `googleVertexRegion`           | `string`   | Tam global ana makineler için statik Google Vertex bölgesi.                                      |
| `googleVertexRegionHostSuffix` | `string`   | Google Vertex bölge önekini açığa çıkarmak için eşleşen ana makinelerden çıkarılacak sonek.     |

## providerRequest başvurusu

Sağlayıcı çalışma zamanını yüklemeden genel
istek ilkesinin ihtiyaç duyduğu ucuz istek uyumluluğu meta verileri için `providerRequest` kullanın. Davranışa özel
yük yeniden yazmayı sağlayıcı çalışma zamanı hook’larında veya paylaşılan sağlayıcı ailesi yardımcılarında tutun.

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

| Alan                  | Tür          | Ne anlama gelir                                                                           |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `family`              | `string`     | Genel istek uyumluluğu kararları ve tanılamaları tarafından kullanılan sağlayıcı ailesi etiketi. |
| `compatibilityFamily` | `"moonshot"` | Paylaşılan istek yardımcıları için isteğe bağlı sağlayıcı ailesi uyumluluk kovası.        |
| `openAICompletions`   | `object`     | OpenAI uyumlu completions istek bayrakları, şu anda `supportsStreamingUsage`.             |

## modelPricing başvurusu

Bir sağlayıcı çalışma zamanı yüklenmeden önce denetim düzlemi fiyatlandırma davranışı üzerinde denetime ihtiyaç duyduğunda
`modelPricing` kullanın. Gateway fiyatlandırma önbelleği bu meta verileri sağlayıcı çalışma zamanı kodunu içe aktarmadan okur.

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

| Alan         | Tür               | Ne anlama gelir                                                                                       |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter veya LiteLLM fiyatlandırmasını asla getirmemesi gereken yerel/kendi barındırılan sağlayıcılar için `false` olarak ayarlayın. |
| `openRouter` | `false \| object` | OpenRouter fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için OpenRouter aramasını devre dışı bırakır. |
| `liteLLM`    | `false \| object` | LiteLLM fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için LiteLLM aramasını devre dışı bırakır. |

Kaynak alanları:

| Alan                       | Tür                | Ne anlama gelir                                                                                                         |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw sağlayıcı kimliğinden farklı olduğunda harici katalog sağlayıcı kimliği; örneğin bir `zai` sağlayıcısı için `z-ai`. |
| `passthroughProviderModel` | `boolean`          | Eğik çizgi içeren model kimliklerini iç içe sağlayıcı/model referansları olarak ele alır; OpenRouter gibi proxy sağlayıcılar için kullanışlıdır. |
| `modelIdTransforms`        | `"version-dots"[]` | Ek harici katalog model kimliği varyantları. `version-dots`, `claude-opus-4.6` gibi noktalı sürüm kimliklerini dener. |

### OpenClaw Sağlayıcı Dizini

OpenClaw Sağlayıcı Dizini, Pluginleri henüz kurulu olmayabilecek sağlayıcılar için OpenClaw’a ait önizleme meta verileridir.
Bir Plugin manifestinin parçası değildir.
Plugin manifestleri, kurulu Plugin yetkisi olmaya devam eder. Sağlayıcı Dizini,
gelecekteki kurulabilir sağlayıcı ve kurulum öncesi
model seçici yüzeylerinin, bir sağlayıcı Plugin’i kurulu olmadığında kullanacağı dahili yedek sözleşmedir.

Katalog yetkisi sırası:

1. Kullanıcı yapılandırması.
2. Kurulu Plugin manifesti `modelCatalog`.
3. Açık yenilemeden gelen model kataloğu önbelleği.
4. OpenClaw Sağlayıcı Dizini önizleme satırları.

Sağlayıcı Dizini; sırlar, etkin durum, çalışma zamanı hook’ları veya
canlı hesaba özel model verileri içermemelidir. Önizleme katalogları, Plugin manifestleriyle aynı
`modelCatalog` sağlayıcı satırı şeklini kullanır, ancak `api`,
`baseUrl`, fiyatlandırma veya uyumluluk bayrakları gibi çalışma zamanı adaptörü alanları bilerek kurulu Plugin manifestiyle hizalı tutulmadıkça
kararlı görüntüleme meta verileriyle sınırlı kalmalıdır. Canlı `/models` keşfine sahip sağlayıcılar,
normal listeleme veya onboarding işleminin sağlayıcı API’lerini çağırmasını sağlamak yerine
açık model kataloğu önbellek yolu üzerinden yenilenmiş satırlar yazmalıdır.

Sağlayıcı Dizini girdileri, Plugin’i çekirdekten çıkarılmış veya başka bir şekilde henüz kurulmamış sağlayıcılar için kurulabilir Plugin meta verileri de taşıyabilir. Bu
meta veriler kanal kataloğu desenini yansıtır: paket adı, npm kurulum belirtimi,
beklenen bütünlük ve ucuz kimlik doğrulama seçimi etiketleri, kurulabilir bir kurulum seçeneği göstermek için yeterlidir.
Plugin kurulduktan sonra, onun manifesti kazanır ve
Sağlayıcı Dizini girdisi o sağlayıcı için yok sayılır.

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` ve `webSearchProviders` değerlerini `contracts` altına taşımak için
`openclaw doctor --fix` kullanın; normal
manifest yükleme artık bu üst düzey alanları yetenek
sahipliği olarak ele almaz.

## Manifest ve package.json karşılaştırması

İki dosya farklı işler görür:

| Dosya                  | Ne için kullanılır                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce mevcut olması gereken keşif, yapılandırma doğrulaması, kimlik doğrulama seçimi meta verileri ve UI ipuçları |
| `package.json`         | npm meta verileri, bağımlılık kurulumu ve giriş noktaları, kurulum kapısı, kurulum veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw’ın bunu Plugin kodunu yüklemeden önce bilmesi gerekiyorsa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi Plugin meta verileri, bilerek `openclaw.plugin.json` yerine
`package.json` içindeki `openclaw` bloğunda yaşar.
`openclaw.bundle` ve `openclaw.bundle.json` OpenClaw Plugin sözleşmeleri değildir;
yerel Pluginler `openclaw.plugin.json` artı aşağıdaki desteklenen
`package.json#openclaw` alanlarını kullanmalıdır.

Önemli örnekler:

| Alan                                                                                       | Ne anlama gelir                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Yerel Plugin giriş noktalarını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Yüklü paketler için derlenmiş JavaScript runtime giriş noktalarını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                              |
| `openclaw.setupEntry`                                                                      | Onboarding, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif, yalnızca kurulum giriş noktası. Plugin paket dizininin içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                                               | Yüklü paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. `setupEntry` gerektirir, mevcut olmalı ve Plugin paket dizininin içinde kalmalıdır.                      |
| `openclaw.channel`                                                                         | Etiketler, belge yolları, takma adlar ve seçim metni gibi ucuz kanal katalog meta verileri.                                                                                         |
| `openclaw.channel.commands`                                                                | Kanal runtime yüklenmeden önce config, audit ve komut listesi yüzeyleri tarafından kullanılan statik yerel komut ve yerel skill otomatik varsayılan meta verileri.                  |
| `openclaw.channel.configuredState`                                                         | Tam kanal runtime yüklenmeden "yalnızca env kurulumu zaten var mı?" sorusunu yanıtlayabilen hafif configured-state denetleyici meta verileri.                                       |
| `openclaw.channel.persistedAuthState`                                                      | Tam kanal runtime yüklenmeden "halihazırda oturum açılmış bir şey var mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama denetleyici meta verileri.                        |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Paketlenmiş ve harici yayımlanmış Plugin'ler için yükleme/güncelleme ipuçları.                                                                                                     |
| `openclaw.install.defaultChoice`                                                           | Birden çok yükleme kaynağı kullanılabilir olduğunda tercih edilen yükleme yolu.                                                                                                      |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` veya `>=2026.5.1-beta.1` gibi bir semver alt sınırı kullanan, desteklenen minimum OpenClaw host sürümü.                                                               |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` gibi beklenen npm dist bütünlük dizesi; yükleme ve güncelleme akışları alınan artifact'i buna göre doğrular.                                                          |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Config geçersiz olduğunda dar kapsamlı bir paketlenmiş-Plugin yeniden yükleme kurtarma yoluna izin verir.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Başlatma sırasında tam kanal Plugin'inden önce yalnızca kurulum kanal yüzeylerinin yüklenmesine izin verir.                                                                         |

Manifest meta verileri, runtime yüklenmeden önce onboarding içinde hangi sağlayıcı/kanal/kurulum seçeneklerinin görüneceğine karar verir. `package.json#openclaw.install`, kullanıcı bu seçeneklerden birini seçtiğinde onboarding'e o Plugin'i nasıl alacağını veya etkinleştireceğini söyler. Yükleme ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, paketlenmemiş Plugin kaynakları için yükleme ve manifest registry yükleme sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler, eski host'larda harici Plugin'leri atlar. Paketlenmiş kaynak Plugin'lerinin host checkout ile aynı sürümde olduğu varsayılır.

Resmi isteğe bağlı yükleme meta verileri, Plugin ClawHub üzerinde yayımlanıyorsa `clawhubSpec` kullanmalıdır; onboarding bunu tercih edilen uzak kaynak olarak ele alır ve yükleme sonrasında ClawHub artifact bilgilerini kaydeder. `npmSpec`, henüz ClawHub'a taşınmamış paketler için uyumluluk fallback'i olarak kalır.

Kesin npm sürüm sabitlemesi zaten `npmSpec` içinde yer alır; örneğin `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmi harici katalog girdileri, alınan npm artifact'i artık sabitlenmiş sürümle eşleşmiyorsa güncelleme akışlarının kapalı şekilde başarısız olması için kesin spec'leri `expectedIntegrity` ile eşleştirmelidir. Etkileşimli onboarding, uyumluluk için çıplak paket adları ve dist-tag'ler dahil olmak üzere güvenilir registry npm spec'lerini sunmaya devam eder. Katalog tanılamaları kesin, kayan, bütünlükle sabitlenmiş, eksik bütünlüklü, paket adı uyuşmazlığı olan ve geçersiz varsayılan seçim kaynaklarını ayırt edebilir. Ayrıca `expectedIntegrity` mevcutken sabitleyebileceği geçerli bir npm kaynağı yoksa uyarır. `expectedIntegrity` mevcut olduğunda yükleme/güncelleme akışları bunu uygular; atlandığında registry çözümlemesi bütünlük sabitlemesi olmadan kaydedilir.

Kanal Plugin'leri, durum, kanal listesi veya SecretRef taramaları tam runtime yüklenmeden yapılandırılmış hesapları tanımlamak zorunda olduğunda `openclaw.setupEntry` sağlamalıdır. Kurulum girişi kanal meta verilerini ve kurulum açısından güvenli config, durum ve secrets adapter'larını açığa çıkarmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve transport runtime'larını ana extension giriş noktasında tutun.

Runtime giriş noktası alanları, kaynak giriş noktası alanları için paket sınırı denetimlerini geçersiz kılmaz. Örneğin, `openclaw.runtimeExtensions` dışarı kaçan bir `openclaw.extensions` yolunu yüklenebilir hale getiremez.

`openclaw.install.allowInvalidConfigRecovery` bilinçli olarak dar kapsamlıdır. Rastgele bozuk config'leri yüklenebilir hale getirmez. Bugün yalnızca eksik paketlenmiş Plugin yolu veya aynı paketlenmiş Plugin için eski bir `channels.<id>` girdisi gibi belirli eski paketlenmiş-Plugin yükseltme hatalarından yükleme akışlarının kurtulmasına izin verir. İlgisiz config hataları yüklemeyi yine engeller ve operatörleri `openclaw doctor --fix` komutuna yönlendirir.

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

Kurulum, doctor, durum veya salt okunur varlık akışları tam kanal Plugin'i yüklenmeden önce ucuz bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğunda bunu kullanın. Kalıcı kimlik doğrulama durumu, yapılandırılmış kanal durumu değildir: Bu meta veriyi Plugin'leri otomatik etkinleştirmek, runtime bağımlılıklarını onarmak veya bir kanal runtime'ının yüklenip yüklenmeyeceğine karar vermek için kullanmayın. Hedef export yalnızca kalıcı durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal runtime barrel'ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, ucuz yalnızca env configured denetimleri için aynı şekli izler:

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

Bir kanal configured-state'i env veya diğer küçük runtime dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam config çözümlemesi veya gerçek kanal runtime'ı gerektiriyorsa bu mantığı Plugin `config.hasConfiguredState` hook'unda tutun.

## Keşif önceliği (yinelenen Plugin id'leri)

OpenClaw, Plugin'leri birkaç kökten keşfeder (paketlenmiş, global yükleme, workspace, explicit config-selected yollar). İki keşif aynı `id` değerini paylaşıyorsa yalnızca **en yüksek öncelikli** manifest tutulur; daha düşük öncelikli yinelenenler yanına yüklenmek yerine düşürülür.

Öncelik, en yüksekten en düşüğe:

1. **Config-selected** — `plugins.entries.<id>` içinde açıkça sabitlenmiş bir yol
2. **Paketlenmiş** — OpenClaw ile birlikte gelen Plugin'ler
3. **Global yükleme** — global OpenClaw Plugin köküne yüklenen Plugin'ler
4. **Workspace** — geçerli workspace'e göre keşfedilen Plugin'ler

Sonuçlar:

- Workspace içinde duran paketlenmiş bir Plugin'in fork'lanmış veya eski bir kopyası, paketlenmiş build'i gölgelemez.
- Paketlenmiş bir Plugin'i yerel bir Plugin ile gerçekten geçersiz kılmak için workspace keşfine güvenmek yerine onu `plugins.entries.<id>` aracılığıyla sabitleyin; böylece öncelik sayesinde kazanır.
- Yinelenen düşürmeler loglanır, böylece Doctor ve başlatma tanılamaları atılan kopyayı gösterebilir.
- Config-selected yinelenen geçersiz kılmaları, tanılamalarda açık geçersiz kılmalar olarak ifade edilir, ancak eski fork'lar ve yanlışlıkla oluşan gölgeler görünür kalsın diye yine de uyarır.

## JSON Schema gereksinimleri

- **Her Plugin bir JSON Schema ile gelmelidir**, config kabul etmese bile.
- Boş bir schema kabul edilebilir (örneğin, `{ "type": "object", "additionalProperties": false }`).
- Schema'lar runtime'da değil, config okuma/yazma zamanında doğrulanır.
- Paketlenmiş bir Plugin'i yeni config anahtarlarıyla genişletirken veya fork'larken aynı anda o Plugin'in `openclaw.plugin.json` `configSchema` değerini güncelleyin. Paketlenmiş Plugin schema'ları strict'tir, bu yüzden kullanıcı config'ine `configSchema.properties` içine `myNewKey` eklemeden `plugins.entries.<id>.config.myNewKey` eklemek, Plugin runtime yüklenmeden önce reddedilir.

Örnek schema extension:

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

- Kanal id'si bir Plugin manifest tarafından bildirilmemişse bilinmeyen `channels.*` anahtarları **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** Plugin id'lerine başvurmalıdır. Bilinmeyen id'ler **hatadır**.
- Bir Plugin yüklüyse ancak bozuk veya eksik manifest ya da schema içeriyorsa doğrulama başarısız olur ve Doctor Plugin hatasını raporlar.
- Plugin config'i mevcut ama Plugin **devre dışı** ise config korunur ve Doctor + log'larda bir **uyarı** gösterilir.

Tam `plugins.*` schema'sı için [Yapılandırma referansı](/tr/gateway/configuration) bölümüne bakın.

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw Plugin'leri için zorunludur**. Runtime yine Plugin modülünü ayrı olarak yükler; manifest yalnızca keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle son değer hâlâ bir nesne olduğu sürece yorumlar, sonda kalan virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyici yalnızca belgelenmiş manifest alanlarını okur. Özel üst düzey anahtarlardan kaçının.
- Bir Plugin bunlara ihtiyaç duymadığında `channels`, `providers`, `cliBackends` ve `skills` alanlarının tümü atlanabilir.
- `providerCatalogEntry` hafif kalmalı ve geniş runtime kodunu içe aktarmamalıdır; bunu istek zamanı yürütmesi için değil, statik sağlayıcı katalog metadatası veya dar keşif tanımlayıcıları için kullanın. `providerDiscoveryEntry` eski yazımdır ve mevcut Plugin'ler için hâlâ çalışır.
- Ayrıcalıklı Plugin türleri `plugins.slots.*` üzerinden seçilir: `plugins.slots.memory` ile `kind: "memory"`, `plugins.slots.contextEngine` ile `kind: "context-engine"` (varsayılan `legacy`).
- Ayrıcalıklı Plugin türünü bu manifestte bildirin. Runtime girişi `OpenClawPluginDefinition.kind` kullanımdan kaldırılmıştır ve yalnızca eski Plugin'ler için uyumluluk yedeği olarak kalır.
- Ortam değişkeni metadatası (`setup.providers[].envVars`, kullanımdan kaldırılmış `providerAuthEnvVars` ve `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, cron teslim doğrulaması ve diğer salt okunur yüzeyler, bir ortam değişkenini yapılandırılmış olarak değerlendirmeden önce hâlâ Plugin güveni ve etkinleştirme politikasını uygular.
- Sağlayıcı kodu gerektiren runtime sihirbazı metadatası için bkz. [Sağlayıcı runtime hook'ları](/tr/plugins/architecture-internals#provider-runtime-hooks).
- Plugin'iniz yerel modüllere bağlıysa derleme adımlarını ve tüm paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## İlgili

<CardGroup cols={3}>
  <Card title="Plugin Oluşturma" href="/tr/plugins/building-plugins" icon="rocket">
    Plugin'lerle başlangıç.
  </Card>
  <Card title="Plugin mimarisi" href="/tr/plugins/architecture" icon="diagram-project">
    İç mimari ve yetenek modeli.
  </Card>
  <Card title="SDK genel bakışı" href="/tr/plugins/sdk-overview" icon="book">
    Plugin SDK referansı ve alt yol içe aktarmaları.
  </Card>
</CardGroup>
