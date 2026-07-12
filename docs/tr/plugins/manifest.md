---
read_when:
    - Bir OpenClaw Plugin'i oluşturuyorsunuz
    - Bir Plugin yapılandırma şeması yayımlamanız veya Plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin manifestosu
x-i18n:
    generated_at: "2026-07-12T12:33:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Bu sayfa **yerel OpenClaw Plugin manifesti** olan `openclaw.plugin.json` dosyasını ele alır. Uyumlu paket düzenleri (Codex, Claude, Cursor) için [Plugin paketleri](/tr/plugins/bundles) bölümüne bakın.

Uyumlu paket biçimleri bunun yerine kendi manifest dosyalarını kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşen düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu düzenleri otomatik olarak algılar ancak aşağıdaki `openclaw.plugin.json` şemasına göre doğrulamaz. Uyumlu bir paketin düzeni OpenClaw'ın çalışma zamanı beklentileriyle eşleştiğinde OpenClaw; paket meta verilerini, bildirilmiş beceri köklerini, Claude komut köklerini, Claude `settings.json` varsayılanlarını, Claude LSP varsayılanlarını ve desteklenen kanca paketlerini okur.

Her yerel OpenClaw Plugin'i, **Plugin kökünde** `openclaw.plugin.json` dosyasını **mutlaka** sunmalıdır. OpenClaw, **Plugin kodunu çalıştırmadan** yapılandırmayı doğrulamak için bu dosyayı okur. Eksik veya geçersiz bir manifest, yapılandırma doğrulamasını engeller ve Plugin hatası olarak değerlendirilir.

Plugin sisteminin tam kılavuzu için [Pluginler](/tr/tools/plugin), yerel yetenek modeli ve mevcut harici uyumluluk yönergeleri için [Yetenek modeli](/tr/plugins/architecture#public-capability-model) bölümüne bakın.

## Bu dosyanın işlevi

`openclaw.plugin.json`, OpenClaw'ın **Plugin kodunuzu yüklemeden önce** okuduğu meta verilerdir. İçindeki her şey, Plugin çalışma zamanını başlatmadan incelenebilecek kadar düşük maliyetli olmalıdır.

**Şunlar için kullanın:**

- Plugin kimliği, yapılandırma doğrulaması ve yapılandırma kullanıcı arayüzü ipuçları
- kimlik doğrulama, ilk kullanım ve kurulum meta verileri (takma ad, otomatik etkinleştirme, sağlayıcı ortam değişkenleri, kimlik doğrulama seçenekleri)
- kontrol düzlemi yüzeyleri için etkinleştirme ipuçları
- kısa model ailesi sahipliği
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` sunucusunun inceleyebileceği kalite güvencesi çalıştırıcısı meta verileri
- katalog ve doğrulama yüzeyleriyle birleştirilen kanala özgü yapılandırma meta verileri

**Şunlar için kullanmayın:** çalışma zamanı davranışını kaydetmek, kod giriş noktalarını bildirmek veya npm kurulum meta verilerini tanımlamak. Bunlar Plugin kodunuzda ve `package.json` dosyasında yer almalıdır.

## En küçük örnek

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

| Alan                                 | Zorunlu | Tür                          | Anlamı                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Evet    | `string`                     | Standart Plugin kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                                                                                                             |
| `configSchema`                       | Evet    | `object`                     | Bu Plugin'in yapılandırması için satır içi JSON Şeması.                                                                                                                                                                                                                     |
| `requiresPlugins`                    | Hayır   | `string[]`                   | Bu Plugin'in etkili olabilmesi için kurulmuş olması gereken diğer Plugin kimlikleri. Keşif, Plugin'in yüklenebilir kalmasını sağlar ancak gerekli Plugin'lerden herhangi biri eksikse uyarır.                                                                                |
| `enabledByDefault`                   | Hayır   | `true`                       | Paketle gelen bir Plugin'i varsayılan olarak etkin şeklinde işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` dışında herhangi bir değere ayarlayın.                                                                                  |
| `enabledByDefaultOnPlatforms`        | Hayır   | `string[]`                   | Paketle gelen bir Plugin'i yalnızca listelenen Node.js platformlarında, örneğin `["darwin"]`, varsayılan olarak etkin şeklinde işaretler. Açık yapılandırma yine önceliklidir.                                                                                               |
| `legacyPluginIds`                    | Hayır   | `string[]`                   | Bu standart Plugin kimliğine normalleştirilen eski kimlikler.                                                                                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | Hayır   | `string[]`                   | Kimlik doğrulama, yapılandırma veya model başvuruları bu sağlayıcılardan söz ettiğinde bu Plugin'i otomatik olarak etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                                             |
| `kind`                               | Hayır   | `PluginKind \| PluginKind[]` | `plugins.slots.*` tarafından kullanılan bir veya daha fazla birbirini dışlayan Plugin türünü (`"memory"`, `"context-engine"`) bildirir. Her iki yuvanın da sahibi olan bir Plugin, iki türü tek bir dizide bildirir.                                                         |
| `channels`                           | Hayır   | `string[]`                   | Bu Plugin'in sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                                                                              |
| `providers`                          | Hayır   | `string[]`                   | Bu Plugin'in sahip olduğu sağlayıcı kimlikleri.                                                                                                                                                                                                                             |
| `providerCatalogEntry`               | Hayır   | `string`                     | Tam Plugin çalışma zamanını etkinleştirmeden yüklenebilen, manifest kapsamındaki sağlayıcı kataloğu meta verileri için Plugin köküne göreli hafif sağlayıcı kataloğu modülü yolu.                                                                                           |
| `modelSupport`                       | Hayır   | `object`                     | Plugin'i çalışma zamanından önce otomatik olarak yüklemek için kullanılan, manifestin sahip olduğu kısa model ailesi meta verileri.                                                                                                                                         |
| `modelCatalog`                       | Hayır   | `object`                     | Bu Plugin'in sahip olduğu sağlayıcılar için bildirimsel model kataloğu meta verileri. Plugin çalışma zamanını yüklemeden gelecekte salt okunur listeleme, ilk katılım, model seçiciler, takma adlar ve gizleme için kullanılan kontrol düzlemi sözleşmesidir.                  |
| `modelPricing`                       | Hayır   | `object`                     | Sağlayıcının sahip olduğu harici fiyat arama ilkesi. Yerel/kendi barındırılan sağlayıcıları uzak fiyat kataloglarının dışında tutmak veya çekirdekte sağlayıcı kimliklerini sabit kodlamadan sağlayıcı başvurularını OpenRouter/LiteLLM katalog kimlikleriyle eşlemek için kullanın. |
| `modelIdNormalization`               | Hayır   | `object`                     | Sağlayıcı çalışma zamanı yüklenmeden önce çalışması gereken, sağlayıcının sahip olduğu model kimliği takma adı/ön ek temizliği.                                                                                                                                              |
| `providerEndpoints`                  | Hayır   | `object[]`                   | Sağlayıcı çalışma zamanı yüklenmeden önce çekirdeğin sınıflandırması gereken sağlayıcı rotaları için manifestin sahip olduğu uç nokta ana makine/`baseUrl` meta verileri.                                                                                                  |
| `providerRequest`                    | Hayır   | `object`                     | Sağlayıcı çalışma zamanı yüklenmeden önce genel istek ilkesi tarafından kullanılan düşük maliyetli sağlayıcı ailesi ve istek uyumluluğu meta verileri.                                                                                                                      |
| `secretProviderIntegrations`         | Hayır   | `Record<string, object>`     | Kurulum veya yükleme yüzeylerinin, sağlayıcıya özgü entegrasyonları çekirdekte sabit kodlamadan sunabileceği bildirimsel SecretRef çalıştırma sağlayıcısı ön ayarları.                                                                                                       |
| `cliBackends`                        | Hayır   | `string[]`                   | Bu Plugin'in sahip olduğu CLI çıkarım arka ucu kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                                                                                             |
| `syntheticAuthRefs`                  | Hayır   | `string[]`                   | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında Plugin'in sahip olduğu sentetik kimlik doğrulama kancasının yoklanması gereken sağlayıcı veya CLI arka ucu başvuruları.                                                                                        |
| `nonSecretAuthMarkers`               | Hayır   | `string[]`                   | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketle gelen Plugin'in sahip olduğu yer tutucu API anahtarı değerleri.                                                                                                                          |
| `commandAliases`                     | Hayır   | `object[]`                   | Bu Plugin'in sahip olduğu ve çalışma zamanı yüklenmeden önce Plugin'e duyarlı yapılandırma ve CLI tanılamaları üretmesi gereken komut adları.                                                                                                                               |
| `providerAuthEnvVars`                | Hayır   | `Record<string, string[]>`   | Sağlayıcı kimlik doğrulaması/durum araması için kullanımdan kaldırılmış uyumluluk ortam meta verileri. Yeni Plugin'ler için `setup.providers[].envVars` tercih edin; OpenClaw, kullanımdan kaldırma süresi boyunca bunu okumaya devam eder.                                  |
| `providerUsageAuthEnvVars`           | Hayır   | `Record<string, string[]>`   | Yalnızca kullanım/faturalandırma amaçlı sağlayıcı kimlik bilgileri. OpenClaw bu adları kullanım keşfi ve gizli veri temizliği için kullanır, ancak çıkarım kimlik doğrulaması için asla kullanmaz.                                                                           |
| `providerAuthAliases`                | Hayır   | `Record<string, string>`     | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcının API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı.                                                   |
| `channelEnvVars`                     | Hayır   | `Record<string, string[]>`   | OpenClaw'ın Plugin kodunu yüklemeden inceleyebileceği düşük maliyetli kanal ortam meta verileri. Genel başlangıç/yapılandırma yardımcılarının görmesi gereken, ortam tarafından yönlendirilen kanal kurulumu veya kimlik doğrulama yüzeyleri için bunu kullanın.             |
| `providerAuthChoices`                | Hayır   | `object[]`                   | İlk katılım seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlantıları için düşük maliyetli kimlik doğrulama seçeneği meta verileri.                                                                                                                  |
| `activation`                         | Hayır   | `object`                     | Başlangıç, sağlayıcı, komut, kanal, rota ve yetenek tetiklemeli yükleme için düşük maliyetli etkinleştirme planlayıcısı meta verileri. Yalnızca meta verilerdir; gerçek davranışın sahibi yine Plugin çalışma zamanıdır.                                                     |
| `setup`                              | Hayır   | `object`                     | Keşif ve kurulum yüzeylerinin Plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/ilk katılım tanımlayıcıları.                                                                                                                                       |
| `qaRunners`                          | Hayır   | `object[]`                   | Plugin çalışma zamanı yüklenmeden önce paylaşılan `openclaw qa` ana makinesi tarafından kullanılan düşük maliyetli QA çalıştırıcısı tanımlayıcıları.                                                                                                                        |
| `contracts`                          | Hayır   | `object`                     | Harici kimlik doğrulama kancaları, gömmeler, konuşma, gerçek zamanlı yazıya dönüştürme, gerçek zamanlı ses, medya anlama, görüntü/video/müzik üretimi, web getirme, web arama, çalışan sağlayıcıları, belge/web içeriği çıkarma ve araç sahipliği için statik yetenek sahipliği anlık görüntüsü. |
| `configContracts`                    | Hayır   | `object`                     | Genel çekirdek yardımcıları tarafından kullanılan, manifestin sahip olduğu yapılandırma davranışı: tehlikeli bayrak algılama, SecretRef geçiş hedefleri ve eski yapılandırma yolu daraltma. Bkz. [configContracts başvurusu](#configcontracts-reference).                    |
| `mediaUnderstandingProviderMetadata` | Hayır     | `Record<string, object>`     | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli medya anlama varsayılanları.                                                                                                                                             |
| `imageGenerationProviderMetadata`    | Hayır     | `Record<string, object>`     | Sağlayıcının sahip olduğu kimlik doğrulama diğer adları ve temel URL korumaları dâhil olmak üzere, `contracts.imageGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli görüntü oluşturma kimlik doğrulama meta verileri.                             |
| `videoGenerationProviderMetadata`    | Hayır     | `Record<string, object>`     | Sağlayıcının sahip olduğu kimlik doğrulama diğer adları ve temel URL korumaları dâhil olmak üzere, `contracts.videoGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli video oluşturma kimlik doğrulama meta verileri.                               |
| `musicGenerationProviderMetadata`    | Hayır     | `Record<string, object>`     | Sağlayıcının sahip olduğu kimlik doğrulama diğer adları ve temel URL korumaları dâhil olmak üzere, `contracts.musicGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli müzik oluşturma kimlik doğrulama meta verileri.                               |
| `toolMetadata`                       | Hayır     | `Record<string, object>`     | `contracts.tools` içinde bildirilen, plugin'e ait araçlar için düşük maliyetli kullanılabilirlik meta verileri. Bir araç; yapılandırma, ortam veya kimlik doğrulama kanıtı bulunmadığı sürece çalışma zamanını yüklememeliyse bunu kullanın.                                     |
| `channelConfigs`                     | Hayır     | `Record<string, object>`     | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeylerine birleştirilen, manifestin sahip olduğu kanal yapılandırma meta verileri.                                                                                                                                       |
| `skills`                             | Hayır     | `string[]`                   | Plugin köküne göre yüklenmesi gereken göreli Skill dizinleri.                                                                                                                                                                                                                |
| `name`                               | Hayır     | `string`                     | İnsanlar tarafından okunabilir plugin adı.                                                                                                                                                                                                                                  |
| `description`                        | Hayır     | `string`                     | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                                                                   |
| `catalog`                            | Hayır     | `object`                     | Plugin katalog yüzeyleri için isteğe bağlı sunum ipuçları. Bu meta veriler bir plugini kurmaz, etkinleştirmez veya plugine güven sağlamaz.                                                                                                                                   |
| `icon`                               | Hayır     | `string`                     | Pazar yeri/katalog kartları için HTTPS görüntü URL'si. ClawHub, geçerli herhangi bir `https://` URL'sini kabul eder ve bu alan belirtilmediğinde veya geçersiz olduğunda varsayılan plugin simgesine geri döner.                                                               |
| `version`                            | Hayır     | `string`                     | Bilgilendirme amaçlı plugin sürümü.                                                                                                                                                                                                                                         |
| `uiHints`                            | Hayır     | `Record<string, object>`     | Yapılandırma alanları için kullanıcı arayüzü etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                                               |

## katalog referansı

`catalog`, plugin tarayıcılarına isteğe bağlı görüntüleme ipuçları sağlar. Ana sistemler bu ipuçlarını yok sayabilir. Bunlar hiçbir zaman plugini kurmaz veya etkinleştirmez ve pluginin çalışma zamanı davranışını ya da güven düzeyini değiştirmez.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Alan       | Tür       | Anlamı                                                                        |
| ---------- | --------- | ----------------------------------------------------------------------------- |
| `featured` | `boolean` | Katalog yüzeylerinin bu plugini öne çıkarıp çıkarmayacağı.                     |
| `order`    | `number`  | Seçilmiş pluginler arasındaki artan görüntüleme ipucu; düşük değerler önce görünür. |

## Üretim sağlayıcısı meta verileri referansı

Üretim sağlayıcısı meta veri alanları, eşleşen `contracts.*GenerationProviders` listesinde bildirilen sağlayıcılar için statik kimlik doğrulama sinyallerini tanımlar. OpenClaw, sağlayıcı çalışma zamanı yüklenmeden önce bu alanları okur; böylece çekirdek araçlar, her sağlayıcı pluginini içe aktarmadan bir üretim sağlayıcısının kullanılabilir olup olmadığına karar verebilir.

Bu alanları yalnızca düşük maliyetli, bildirimsel bilgiler için kullanın. Aktarım, istek dönüşümleri, belirteç yenileme, kimlik bilgisi doğrulaması ve gerçek üretim davranışı plugin çalışma zamanında kalır.

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

| Alan                   | Zorunlu | Tür        | Anlamı                                                                                                                                                              |
| ---------------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Hayır   | `string[]` | Üretim sağlayıcısı için statik kimlik doğrulama takma adları olarak sayılması gereken ek sağlayıcı kimlikleri.                                                        |
| `authProviders`        | Hayır   | `string[]` | Yapılandırılmış kimlik doğrulama profilleri bu üretim sağlayıcısının kimlik doğrulaması olarak sayılması gereken sağlayıcı kimlikleri.                                |
| `configSignals`        | Hayır   | `object[]` | Kimlik doğrulama profilleri veya ortam değişkenleri olmadan yapılandırılabilen yerel ya da kendi sunucunuzda barındırılan sağlayıcılar için düşük maliyetli, yalnızca yapılandırmaya dayalı kullanılabilirlik sinyalleri. |
| `authSignals`          | Hayır   | `object[]` | Açık kimlik doğrulama sinyalleri. Mevcut olduklarında bunlar, sağlayıcı kimliği, `aliases` ve `authProviders` kaynaklı varsayılan sinyal kümesinin yerini alır.          |
| `referenceAudioInputs` | Hayır   | `boolean`  | Yalnızca video üretimi. Sağlayıcı referans ses varlıklarını kabul ediyorsa `true` olarak ayarlayın; aksi takdirde `video_generate`, ses referansı parametrelerini gizler. |

Her `configSignals` girdisi şunları destekler:

| Alan             | Zorunlu | Tür        | Anlamı                                                                                                                                                                                                 |
| ---------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`       | Evet    | `string`   | İncelenecek, plugine ait yapılandırma nesnesinin noktalı yolu; örneğin `plugins.entries.example.config`.                                                                                                |
| `overlayPath`    | Hayır   | `string`   | Sinyal değerlendirilmeden önce nesnesi kök nesnenin üzerine bindirilecek olan, kök yapılandırma içindeki noktalı yol. Bunu `image`, `video` veya `music` gibi yeteneğe özgü yapılandırmalar için kullanın. |
| `overlayMapPath` | Hayır   | `string`   | Nesne değerlerinin her biri kök nesnenin üzerine bindirilecek olan, kök yapılandırma içindeki noktalı yol. Bunu, yapılandırılmış herhangi bir hesabın yeterli sayılması gereken `accounts` gibi adlandırılmış hesap eşlemeleri için kullanın. |
| `required`       | Hayır   | `string[]` | Etkin yapılandırma içinde yapılandırılmış değerlere sahip olması gereken noktalı yollar. Dizeler boş olmamalı; nesneler ve diziler de boş olmamalıdır.                                                    |
| `requiredAny`    | Hayır   | `string[]` | Etkin yapılandırma içindeki, en az birinin yapılandırılmış bir değere sahip olması gereken noktalı yollar.                                                                                               |
| `mode`           | Hayır   | `object`   | Etkin yapılandırma içindeki isteğe bağlı dize modu koruması. Bunu, yalnızca yapılandırmaya dayalı kullanılabilirlik sadece tek bir mod için geçerli olduğunda kullanın.                                    |

Her `mode` koruması şunları destekler:

| Alan         | Zorunlu | Tür        | Anlamı                                                                                             |
| ------------ | ------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `path`       | Hayır   | `string`   | Etkin yapılandırma içindeki noktalı yol. Varsayılanı `mode` değeridir.                              |
| `default`    | Hayır   | `string`   | Yapılandırma yolu içermediğinde kullanılacak mod değeri.                                           |
| `allowed`    | Hayır   | `string[]` | Mevcutsa sinyal, yalnızca etkin mod bu değerlerden biriyken başarılı olur.                          |
| `disallowed` | Hayır   | `string[]` | Mevcutsa sinyal, etkin mod bu değerlerden biri olduğunda başarısız olur.                            |

Her `authSignals` girdisi şunları destekler:

| Alan              | Zorunlu | Tür      | Anlamı                                                                                                                                                                               |
| ----------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Evet    | `string` | Yapılandırılmış kimlik doğrulama profillerinde denetlenecek sağlayıcı kimliği.                                                                                                        |
| `providerBaseUrl` | Hayır   | `object` | Sinyalin yalnızca başvurulan yapılandırılmış sağlayıcı izin verilen bir temel URL kullandığında sayılmasını sağlayan isteğe bağlı koruma. Bir kimlik doğrulama takma adı yalnızca belirli API'ler için geçerliyse bunu kullanın. |

Her `providerBaseUrl` koruması şunları destekler:

| Alan              | Zorunlu | Tür        | Anlamı                                                                                                                                                         |
| ----------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet    | `string`   | `baseUrl` değeri denetlenecek sağlayıcı yapılandırma kimliği.                                                                                                   |
| `defaultBaseUrl`  | Hayır   | `string`   | Sağlayıcı yapılandırması `baseUrl` içermediğinde varsayılacak temel URL.                                                                                         |
| `allowedBaseUrls` | Evet    | `string[]` | Bu kimlik doğrulama sinyali için izin verilen temel URL'ler. Yapılandırılmış veya varsayılan temel URL, normalleştirilmiş bu değerlerden biriyle eşleşmediğinde sinyal yok sayılır. |

## Araç meta verileri referansı

`toolMetadata`, araç adına göre anahtarlanmış olarak üretim sağlayıcısı meta verileriyle aynı `configSignals` ve `authSignals` biçimlerini kullanır. `contracts.tools` sahipliği bildirir. `toolMetadata`, OpenClaw'ın yalnızca araç fabrikasının `null` döndürmesini sağlamak için bir plugin çalışma zamanını içe aktarmaktan kaçınabilmesi amacıyla düşük maliyetli kullanılabilirlik kanıtı bildirir.

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

`toolMetadata` girdileri, yukarıdaki ortak `configSignals`/`authSignals` alanlarına ek olarak `optional` (aracı plugin etkinleştirmesi için zorunlu değil olarak işaretler) ve `replaySafe` (tamamlanmamış bir model turundan sonra araç yürütmesinin güvenle yinelenebileceğini belirtir) alanlarını da kabul eder.

Bir aracın `toolMetadata` değeri yoksa OpenClaw mevcut davranışı korur ve araç sözleşmesi politikayla eşleştiğinde sahibi olan plugini yükler. Fabrikası kimlik doğrulamasına/yapılandırmaya bağlı olan kritik yol araçları için plugin yazarları, çekirdeğin sorgulamak amacıyla çalışma zamanını içe aktarmasını sağlamak yerine `toolMetadata` bildirmelidir.

## providerAuthChoices referansı

Her `providerAuthChoices` girdisi bir ilk kurulum veya kimlik doğrulama seçeneğini tanımlar. OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur. Sağlayıcı kurulum listeleri; sağlayıcı çalışma zamanını yüklemeden bu manifest seçeneklerini, tanımlayıcıdan türetilen kurulum seçeneklerini ve kurulum kataloğu meta verilerini kullanır.

| Alan                  | Zorunlu | Tür                                                                   | Anlamı                                                                                                                 |
| --------------------- | ------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                                              | Bu seçeneğin ait olduğu sağlayıcı kimliği.                                                                              |
| `method`              | Evet    | `string`                                                              | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                                       |
| `choiceId`            | Evet    | `string`                                                              | İlk katılım ve CLI akışlarında kullanılan kararlı kimlik doğrulama seçeneği kimliği.                                    |
| `choiceLabel`         | Hayır   | `string`                                                              | Kullanıcıya gösterilen etiket. Belirtilmezse OpenClaw, `choiceId` değerini kullanır.                                     |
| `choiceHint`          | Hayır   | `string`                                                              | Seçici için kısa yardımcı metin.                                                                                        |
| `assistantPriority`   | Hayır   | `number`                                                              | Daha düşük değerler, asistan odaklı etkileşimli seçicilerde daha önce sıralanır.                                        |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                                        | Manuel CLI seçimine izin vermeye devam ederken seçeneği asistan seçicilerinden gizler.                                  |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                                            | Kullanıcıları bu yeni seçeneğe yönlendirmesi gereken eski seçenek kimlikleri.                                           |
| `groupId`             | Hayır   | `string`                                                              | İlgili seçenekleri gruplandırmak için isteğe bağlı grup kimliği.                                                        |
| `groupLabel`          | Hayır   | `string`                                                              | Bu grup için kullanıcıya gösterilen etiket.                                                                             |
| `groupHint`           | Hayır   | `string`                                                              | Grup için kısa yardımcı metin.                                                                                          |
| `onboardingFeatured`  | Hayır   | `boolean`                                                             | Bu grubu, etkileşimli ilk katılım seçicisinin öne çıkan katmanında `"More..."` girişinden önce gösterir.                 |
| `optionKey`           | Hayır   | `string`                                                              | Tek bayraklı basit kimlik doğrulama akışları için dahili seçenek anahtarı.                                              |
| `cliFlag`             | Hayır   | `string`                                                              | `--openrouter-api-key` gibi CLI bayrağı adı.                                                                            |
| `cliOption`           | Hayır   | `string`                                                              | `--openrouter-api-key <key>` gibi tam CLI seçeneği biçimi.                                                              |
| `cliDescription`      | Hayır   | `string`                                                              | CLI yardımında kullanılan açıklama.                                                                                     |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Bu seçeneğin hangi ilk katılım yüzeylerinde görüneceği. Belirtilmezse varsayılan olarak `["text-inference"]` kullanılır. |

## `commandAliases` başvurusu

Kullanıcıların yanlışlıkla `plugins.allow` içine ekleyebileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adı Plugin'e ait olduğunda `commandAliases` kullanın. OpenClaw, Plugin çalışma zamanı kodunu içe aktarmadan tanılama yapmak için bu meta verileri kullanır.

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

| Alan         | Zorunlu | Tür               | Anlamı                                                                                  |
| ------------ | ------- | ----------------- | --------------------------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu Plugin'e ait komut adı.                                                              |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök CLI komutu yerine sohbet eğik çizgi komutu olarak işaretler.              |
| `cliCommand` | Hayır   | `string`          | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.                               |

## `activation` başvurusu

Plugin, hangi kontrol düzlemi olaylarının kendisini bir etkinleştirme/yükleme planına dahil etmesi gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

Bu blok bir yaşam döngüsü API'si değil, planlayıcı meta verisidir. Çalışma zamanı davranışını kaydetmez, `register(...)` işlevinin yerini almaz ve Plugin kodunun zaten yürütülmüş olduğunu garanti etmez. Etkinleştirme planlayıcısı; `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve kancalar gibi mevcut bildirim sahipliği meta verilerine geri dönmeden önce aday Plugin'leri daraltmak için bu alanları kullanır.

Sahipliği zaten açıklayan en dar meta veriyi tercih edin. İlişkiyi bu alanlar ifade ediyorsa `providers`, `channels`, `commandAliases`, kurulum tanımlayıcıları veya `contracts` kullanın. Bu sahiplik alanlarıyla temsil edilemeyen ek planlayıcı ipuçları için `activation` kullanın. `claude-cli`, `my-cli` veya `google-gemini-cli` gibi CLI çalışma zamanı takma adları için üst düzey `cliBackends` alanını kullanın; `activation.onAgentHarnesses` yalnızca zaten bir sahiplik alanı bulunmayan gömülü aracı altyapısı kimlikleri içindir.

Her Plugin, `activation.onStartup` değerini bilinçli olarak ayarlamalıdır. Plugin'in Gateway başlatılırken çalışması gerekiyorsa bunu yalnızca `true` olarak ayarlayın. Plugin başlangıçta etkin değilse ve yalnızca daha dar tetikleyicilerden yüklenmesi gerekiyorsa `false` olarak ayarlayın. `onStartup` alanının belirtilmemesi artık Plugin'in başlangıçta örtük olarak yüklenmesine neden olmaz; başlangıç, kanal, yapılandırma, aracı altyapısı, bellek veya daha dar diğer etkinleştirme tetikleyicileri için açık etkinleştirme meta verileri kullanın.

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

| Alan               | Zorunlu | Tür                                                  | Anlamı                                                                                                                                                                                                 |
| ------------------ | ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Hayır   | `boolean`                                            | Açık Gateway başlangıç etkinleştirmesi. Her Plugin bunu ayarlamalıdır. `true`, Plugin'i başlangıç sırasında içe aktarır; `false`, eşleşen başka bir tetikleyici yüklemeyi gerektirmedikçe başlangıçta tembel tutar. |
| `onProviders`      | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                                                                                                                 |
| `onAgentHarnesses` | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken gömülü aracı altyapısı çalışma zamanı kimlikleri. CLI arka uç takma adları için üst düzey `cliBackends` alanını kullanın.                |
| `onCommands`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                                                                                                                     |
| `onChannels`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                                                                                                                     |
| `onRoutes`         | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                                                                                                                        |
| `onConfigPaths`    | Hayır   | `string[]`                                           | Yol mevcut ve açıkça devre dışı bırakılmamışsa bu Plugin'i başlangıç/yükleme planlarına dahil etmesi gereken, köke göreli yapılandırma yolları.                                                         |
| `onCapabilities`   | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin.                                                                          |

Mevcut canlı tüketiciler:

- Gateway başlangıç planlaması, açık başlangıç içe aktarımı için `activation.onStartup` kullanır.
- Komutla tetiklenen CLI planlaması, eski `commandAliases[].cliCommand` veya `commandAliases[].name` alanlarına geri döner.
- Aracı çalışma zamanı başlangıç planlaması, gömülü altyapılar için `activation.onAgentHarnesses`, CLI çalışma zamanı takma adları içinse üst düzey `cliBackends[]` kullanır.
- Kanalla tetiklenen kurulum/kanal planlaması, açık kanal etkinleştirme meta verileri eksik olduğunda eski `channels[]` sahipliğine geri döner.
- Başlangıç Plugin planlaması, paketle birlikte gelen tarayıcı Plugin'inin `browser` bloğu gibi kanal dışı kök yapılandırma yüzeyleri için `activation.onConfigPaths` kullanır.
- Sağlayıcıyla tetiklenen kurulum/çalışma zamanı planlaması, açık sağlayıcı etkinleştirme meta verileri eksik olduğunda eski `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner.

Planlayıcı tanılamaları, açık etkinleştirme ipuçlarını bildirim sahipliği geri dönüşlerinden ayırt edebilir. Örneğin `activation-command-hint`, `activation.onCommands` alanının eşleştiği anlamına gelirken `manifest-command-alias`, planlayıcının bunun yerine `commandAliases` sahipliğini kullandığı anlamına gelir. Bu neden etiketleri ana makine tanılamaları ve testler içindir; Plugin yazarları, sahipliği en iyi açıklayan meta verileri bildirmeye devam etmelidir.

## `qaRunners` başvurusu

Bir Plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla aktarım çalıştırıcısı sağladığında `qaRunners` kullanın. Bu meta verileri hafif ve statik tutun; Plugin çalışma zamanı, eşleşen `qaRunnerCliRegistrations` dışa aktarımını sunan hafif bir `runtime-api.ts` yüzeyi aracılığıyla gerçek CLI kaydının sahibi olmaya devam eder. İsteğe bağlı `adapterFactory`, kayıtlı komutun çalıştırıcısını değiştirmeden aktarımı paylaşılan QA senaryolarına sunar.

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

| Alan          | Zorunlu | Tür      | Anlamı                                                                                       |
| ------------- | ------- | -------- | -------------------------------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altına bağlanan alt komut; örneğin `matrix`.                                    |
| `description` | Hayır   | `string` | Paylaşılan ana makinenin yer tutucu bir komuta ihtiyaç duyduğunda kullandığı yedek yardım metni. |

`adapterFactory` kimliği `commandName` ile eşleşmelidir. Manifestte bulunmayan komutlar için kayıtları dışa aktarmayın.

## setup referansı

Kurulum ve ilk kullanım yüzeyleri, çalışma zamanı yüklenmeden önce Plugin'e ait düşük maliyetli meta verilere ihtiyaç duyduğunda `setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım arka uçlarını açıklamaya devam eder. `setup.cliBackends`, yalnızca meta veri olarak kalması gereken kontrol düzlemi/kurulum akışlarına yönelik kuruluma özgü tanımlayıcı yüzeyidir.

Mevcut olduklarında `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen, önce tanımlayıcıya dayalı arama yüzeyidir. Tanımlayıcı yalnızca aday Plugin'i daraltıyorsa ve kurulum hâlâ kurulum zamanında daha kapsamlı çalışma zamanı kancalarına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak `setup-api` öğesini yerinde tutun.

OpenClaw ayrıca genel sağlayıcı kimlik doğrulama ve ortam değişkeni aramalarına `setup.providers[].envVars` öğesini dahil eder. `providerAuthEnvVars`, kullanımdan kaldırma dönemi boyunca bir uyumluluk bağdaştırıcısı aracılığıyla desteklenmeye devam eder; ancak bunu hâlâ kullanan paketle birlikte gelmeyen Plugin'ler bir manifest tanılama bildirimi alır. Yeni Plugin'ler, kurulum/durum ortam meta verilerini `setup.providers[].envVars` içine yerleştirmelidir.

Bir faturalandırma veya kuruluş düzeyindeki kimlik bilgisi, çıkarım kimlik bilgisine dönüşmeden `resolveUsageAuth` öğesini etkinleştirmesi gerektiğinde `providerUsageAuthEnvVars` kullanın. Bu adlar çalışma alanı dotenv engellemesine, ACP alt süreçlerinden kaldırmaya, korumalı alan sır filtrelemesine ve kapsamlı sır temizlemeye dahil edilir. Sağlayıcı çalışma zamanı, değeri yine `resolveUsageAuth` içinde okur ve sınıflandırır.

OpenClaw, kurulum girdisi bulunmadığında veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildirdiğinde basit kurulum seçeneklerini `setup.providers[].authMethods` öğesinden de türetebilir. Özel etiketler, CLI bayrakları, ilk kullanım kapsamı ve asistan meta verileri için açık `providerAuthChoices` girdileri tercih edilmeye devam eder.

`requiresRuntime: false` ayarını yalnızca bu tanımlayıcılar kurulum yüzeyi için yeterli olduğunda kullanın. OpenClaw, açık `false` değerini yalnızca tanımlayıcıya dayalı bir sözleşme olarak değerlendirir ve kurulum araması için `setup-api` veya `openclaw.setupEntry` öğesini yürütmez. Yalnızca tanımlayıcı kullanan bir Plugin yine de bu kurulum çalışma zamanı girdilerinden birini sunuyorsa OpenClaw ek bir tanılama bildirimi raporlar ve girdiyi yok saymaya devam eder. `requiresRuntime` öğesinin belirtilmemesi, bayrağı kullanmadan tanımlayıcı ekleyen mevcut Plugin'lerin bozulmaması için eski yedek davranışı korur.

Kurulum araması Plugin'e ait `setup-api` kodunu yürütebildiğinden, normalleştirilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen Plugin'ler genelinde benzersiz kalmalıdır. Belirsiz sahiplikte, keşif sırasına göre bir kazanan seçmek yerine güvenli biçimde hata oluşur.

Kurulum çalışma zamanı yürütüldüğünde, `setup-api` manifest tanımlayıcılarında bildirilmeyen bir sağlayıcı veya CLI arka ucu kaydederse ya da bir tanımlayıcının eşleşen çalışma zamanı kaydı yoksa kurulum kayıt defteri tanılamaları tanımlayıcı sapmasını raporlar. Bu tanılamalar ek niteliktedir ve eski Plugin'leri reddetmez.

### setup.providers referansı

| Alan           | Gerekli | Tür        | Anlamı                                                                                                     |
| -------------- | ------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `id`           | Evet    | `string`   | Kurulum veya ilk kullanım sırasında sunulan sağlayıcı kimliği. Normalleştirilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods`  | Hayır   | `string[]` | Bu sağlayıcının tam çalışma zamanı yüklenmeden desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri.    |
| `envVars`      | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden önce denetleyebileceği ortam değişkenleri. |
| `authEvidence` | Hayır   | `object[]` | Gizli olmayan işaretleyiciler aracılığıyla kimlik doğrulayabilen sağlayıcılar için düşük maliyetli yerel kimlik doğrulama kanıtı denetimleri. |

`authEvidence`, çalışma zamanı kodu yüklenmeden doğrulanabilen, sağlayıcıya ait yerel kimlik bilgisi işaretleyicileri içindir. Bu denetimler düşük maliyetli ve yerel kalmalıdır: ağ çağrısı, anahtarlık veya sır yöneticisi okuması, kabuk komutu ve sağlayıcı API yoklaması yapılamaz.

Desteklenen kanıt girdileri:

| Alan               | Gerekli | Tür        | Anlamı                                                                                                                  |
| ------------------ | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `type`             | Evet    | `string`   | Şu anda `local-file-with-env`.                                                                                          |
| `fileEnvVar`       | Hayır   | `string`   | Açık bir kimlik bilgisi dosyası yolu içeren ortam değişkeni.                                                            |
| `fallbackPaths`    | Hayır   | `string[]` | `fileEnvVar` bulunmadığında veya boş olduğunda denetlenen yerel kimlik bilgisi dosyası yolları. `${HOME}` ve `${APPDATA}` desteklenir. |
| `requiresAnyEnv`   | Hayır   | `string[]` | Kanıtın geçerli olması için listelenen ortam değişkenlerinden en az biri boş olmamalıdır.                               |
| `requiresAllEnv`   | Hayır   | `string[]` | Kanıtın geçerli olması için listelenen tüm ortam değişkenleri boş olmamalıdır.                                          |
| `credentialMarker` | Evet    | `string`   | Kanıt mevcut olduğunda döndürülen gizli olmayan işaretleyici.                                                           |
| `source`           | Hayır   | `string`   | Kimlik doğrulama/durum çıktısı için kullanıcıya gösterilen kaynak etiketi.                                              |

### setup alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                                       |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `providers`        | Hayır   | `object[]` | Kurulum ve ilk kullanım sırasında sunulan sağlayıcı kurulum tanımlayıcıları.                                  |
| `cliBackends`      | Hayır   | `string[]` | Önce tanımlayıcıya dayalı kurulum aramasında kullanılan kurulum zamanı arka uç kimlikleri. Normalleştirilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin'in kurulum yüzeyine ait yapılandırma geçişi kimlikleri.                                             |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.                  |

## uiHints referansı

`uiHints`, yapılandırma alanı adlarından küçük işleme ipuçlarına eşlenen bir haritadır. Anahtarlar iç içe yapılandırma alanları için nokta kullanabilir; ancak hiçbir yol parçası `__proto__`, `constructor` veya `prototype` olamaz. Kurulum bu adları reddeder.

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

| Alan          | Tür        | Anlamı                                  |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Kullanıcıya gösterilen alan etiketi.    |
| `help`        | `string`   | Kısa yardımcı metin.                    |
| `tags`        | `string[]` | İsteğe bağlı kullanıcı arayüzü etiketleri. |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.        |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girdileri için yer tutucu metin.   |

## contracts referansı

`contracts` öğesini yalnızca OpenClaw'ın Plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği meta verileri için kullanın.

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

| Alan                             | Tür         | Anlamı                                                                                                                                        |
| -------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]`  | Codex app-server uzantı fabrikası kimlikleri; şu anda `codex-app-server`.                                                                      |
| `agentToolResultMiddleware`      | `string[]`  | Bu Plugin'in araç sonucu ara yazılımı kaydedebileceği çalışma zamanı kimlikleri.                                                              |
| `trustedToolPolicies`            | `string[]`  | Yüklü bir Plugin'in kaydedebileceği, Plugin'e yerel güvenilir araç öncesi politika kimlikleri. Birlikte gelen Plugin'ler bu alan olmadan politika kaydedebilir. |
| `externalAuthProviders`          | `string[]`  | Bu Plugin'in harici kimlik doğrulama profili kancasına sahip olduğu sağlayıcı kimlikleri.                                                     |
| `embeddingProviders`             | `string[]`  | Bellek dâhil yeniden kullanılabilir vektör gömme işlemleri için bu Plugin'in sahip olduğu genel gömme sağlayıcısı kimlikleri.                  |
| `speechProviders`                | `string[]`  | Bu Plugin'in sahip olduğu konuşma sağlayıcısı kimlikleri.                                                                                     |
| `realtimeTranscriptionProviders` | `string[]`  | Bu Plugin'in sahip olduğu gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri.                                                               |
| `realtimeVoiceProviders`         | `string[]`  | Bu Plugin'in sahip olduğu gerçek zamanlı ses sağlayıcısı kimlikleri.                                                                          |
| `memoryEmbeddingProviders`       | `string[]`  | Bu Plugin'in sahip olduğu, kullanımdan kaldırılmış belleğe özgü gömme sağlayıcısı kimlikleri.                                                  |
| `mediaUnderstandingProviders`    | `string[]`  | Bu Plugin'in sahip olduğu medya anlama sağlayıcısı kimlikleri.                                                                                |
| `transcriptSourceProviders`      | `string[]`  | Bu Plugin'in sahip olduğu transkript kaynağı sağlayıcısı kimlikleri.                                                                          |
| `documentExtractors`             | `string[]`  | Bu Plugin'in sahip olduğu belge (örneğin PDF) çıkarıcı sağlayıcısı kimlikleri.                                                                |
| `imageGenerationProviders`       | `string[]`  | Bu Plugin'in sahip olduğu görüntü oluşturma sağlayıcısı kimlikleri.                                                                           |
| `videoGenerationProviders`       | `string[]`  | Bu Plugin'in sahip olduğu video oluşturma sağlayıcısı kimlikleri.                                                                             |
| `musicGenerationProviders`       | `string[]`  | Bu Plugin'in sahip olduğu müzik oluşturma sağlayıcısı kimlikleri.                                                                             |
| `webContentExtractors`           | `string[]`  | Bu Plugin'in sahip olduğu web sayfası içeriği çıkarma sağlayıcısı kimlikleri.                                                                 |
| `webFetchProviders`              | `string[]`  | Bu Plugin'in sahip olduğu web getirme sağlayıcısı kimlikleri.                                                                                 |
| `webSearchProviders`             | `string[]`  | Bu Plugin'in sahip olduğu web arama sağlayıcısı kimlikleri.                                                                                   |
| `workerProviders`                | `string[]`  | Kaynak sağlama ve profil destekli kira yaşam döngüsü için bu Plugin'in sahip olduğu bulut işçisi sağlayıcısı kimlikleri.                       |
| `usageProviders`                 | `string[]`  | Bu Plugin'in kullanım kimlik doğrulaması ve kullanım anlık görüntüsü kancalarına sahip olduğu sağlayıcı kimlikleri.                            |
| `migrationProviders`             | `string[]`  | Bu Plugin'in `openclaw migrate` için sahip olduğu içe aktarma sağlayıcısı kimlikleri.                                                         |
| `gatewayMethodDispatch`          | `string[]`  | Gateway yöntemlerini süreç içinde yönlendiren, kimliği doğrulanmış Plugin HTTP rotaları için ayrılmış yetki.                                  |
| `tools`                          | `string[]`  | Bu Plugin'in sahip olduğu ajan aracı adları.                                                                                                  |

`contracts.embeddedExtensionFactories`, yalnızca birlikte gelen Codex app-server uzantı fabrikaları için korunur. Birlikte gelen araç sonucu dönüşümleri bunun yerine `contracts.agentToolResultMiddleware` bildirmeli ve `api.registerAgentToolResultMiddleware(...)` ile kaydolmalıdır. Yüklü Plugin'ler aynı ara yazılım bağlantı noktasını yalnızca açıkça etkinleştirildiklerinde ve yalnızca `contracts.agentToolResultMiddleware` içinde bildirdikleri çalışma zamanları için kullanabilir.

Ana makinenin güvendiği araç öncesi politika katmanına ihtiyaç duyan yüklü Plugin'ler, kaydedilen her yerel kimliği `contracts.trustedToolPolicies` içinde bildirmeli ve açıkça etkinleştirilmelidir. Birlikte gelen Plugin'ler mevcut güvenilir politika yolunu korur; ancak bildirilmemiş politika kimliklerine sahip yüklü Plugin'ler kayıt öncesinde reddedilir. Politika kimlikleri kaydeden Plugin kapsamında olduğundan iki Plugin de `workflow-budget` kimliğini bildirip kaydedebilir; tek bir Plugin aynı yerel kimliği iki kez kaydedemez.

Çalışma zamanı `api.registerTool(...)` kayıtları `contracts.tools` ile eşleşmelidir. Araç keşfi, yalnızca istenen araçların sahibi olabilecek Plugin çalışma zamanlarını yüklemek için bu listeyi kullanır.

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'leri `contracts.externalAuthProviders` bildirmelidir; bildirilmemiş harici kimlik doğrulama kancaları yok sayılır.

Hem `resolveUsageAuth` hem de `fetchUsageSnapshot` uygulayan sağlayıcı Plugin'leri, otomatik keşfedilen her sağlayıcı kimliğini `contracts.usageProviders` içinde bildirmelidir. Kullanım keşfi, çalışma zamanı kodunu yüklemeden önce bu sözleşmeyi okur ve yalnızca bildirilen sahipleri yükledikten sonra her iki kancayı da doğrular.

Genel gömme sağlayıcıları, `api.registerEmbeddingProvider(...)` ile kaydedilen her bağdaştırıcı için `contracts.embeddingProviders` bildirmelidir. Bellek araması tarafından kullanılan sağlayıcılar dâhil, yeniden kullanılabilir vektör üretimi için genel sözleşmeyi kullanın. `contracts.memoryEmbeddingProviders`, kullanımdan kaldırılmış belleğe özgü uyumluluktur ve yalnızca mevcut sağlayıcılar genel gömme sağlayıcısı bağlantı noktasına taşınırken korunur.

İşçi sağlayıcıları, her `api.registerWorkerProvider(...)` kimliğini `contracts.workerProviders` içinde bildirmelidir. Çekirdek, `provision` çağrısından önce kalıcı niyeti saklar; sağlayıcılar harici tahsisten önce ayarlarını doğrular ve aynı işlem kimliğiyle yinelenen çağrılar aynı kirayı benimsemelidir. Çekirdek ayrıca doğrulanmış bu ayar anlık görüntüsünü saklar ve adlandırılmış profil değiştirilmiş veya kaldırılmış olsa bile `leaseId` ile birlikte `inspect({ leaseId, profile })` ve `destroy({ leaseId, profile })` çağrılarına iletir. Yok etme eşgüçlüdür, inceleme kapalı `active` / `destroyed` / `unknown` durum birleşimini döndürür ve SSH özel anahtar malzemesine yalnızca `SecretRef` üzerinden başvurulur. Sağlanan SSH uç noktaları, çekirdeğin bağlanmadan önce ana makineyi sabitleyebilmesi için güvenilir kaynak sağlama çıktısından, ana makine adı veya yorum olmadan tam olarak `algorithm base64` biçiminde genel bir `hostKey` de içermelidir. Dinamik kimlik başvuruları oluşturan sağlayıcılar, yetkili `resolveSshIdentity({ leaseId, profile, keyRef })` yöntemini uygulayabilir; bunu uygulamayan sağlayıcılar çekirdeğin genel gizli değer çözümleyicisini kullanır. Yetkili bir `unknown`, etkin bir yerel kaydı sahipsiz bırakır; saklanan bir yok etme isteğinden sonra ise kapatmayı doğrular.

`contracts.gatewayMethodDispatch` şu anda `"authenticated-request"` değerini kabul eder. Bu, Gateway kontrol düzlemi yöntemlerini kasıtlı olarak süreç içinde yönlendiren yerel Plugin HTTP rotaları için bir API düzeni kapısıdır; kötü amaçlı yerel Plugin'lere karşı bir korumalı alan değildir. Bunu yalnızca zaten Gateway HTTP kimlik doğrulaması gerektiren ve sıkı biçimde incelenmiş, birlikte gelen/operatör yüzeyleri için kullanın. Yetkilendirilmiş bir rota, Gateway kök iş kabulü kapalıyken yalnızca ayrıca `auth: "gateway"` ve rotaya özgü `gatewayRuntimeScopeSurface: "trusted-operator"` bildirdiğinde erişilebilir kalır; aynı Plugin'in sıradan kardeş rotaları kabul sınırının arkasında kalır. Böylece tüm Plugin'e kabul atlama yetkisi verilmeden askıya alma durumu ve sürdürme işlemi erişilebilir tutulur. Ayrıştırma ve yanıt biçimlendirmeyi yönlendirme dışında sınırlı tutun; esaslı veya değişiklik yapan işler, kabul ve kapsam uygulamasının sahibi olan Gateway yöntem yönlendirmesi üzerinden gerçekleştirilmelidir.

## configContracts başvurusu

Plugin bildirimine ait olup genel çekirdek yardımcılarının Plugin çalışma zamanını içe aktarmadan ihtiyaç duyduğu yapılandırma davranışları için `configContracts` kullanın: tehlikeli bayrak algılama, SecretRef taşıma hedefleri ve eski yapılandırma yolu daraltma.

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

| Alan                          | Gerekli | Tür        | Anlamı                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `compatibilityMigrationPaths` | Hayır   | `string[]` | Bu Plugin'in kurulum zamanı uyumluluk taşımalarının uygulanabileceğini belirten, köke göre yapılandırma yolları. Yapılandırma Plugin'e hiç başvurmadığında genel çalışma zamanı yapılandırma okumalarının tüm Plugin kurulum yüzeylerini atlamasını sağlar.                         |
| `compatibilityRuntimePaths`   | Hayır   | `string[]` | Plugin kodu tamamen etkinleşmeden önce bu Plugin'in çalışma zamanında işleyebileceği, köke göre uyumluluk yolları. Her uyumlu Plugin çalışma zamanını içe aktarmadan birlikte gelen aday kümelerini daraltması gereken eski yüzeyler için bunu kullanın.                           |
| `dangerousFlags`              | Hayır   | `object[]` | Etkinleştirildiğinde `openclaw doctor` tarafından güvensiz veya tehlikeli olarak işaretlenmesi gereken yapılandırma sabit değerleri. Aşağıya bakın.                                                                                                                              |
| `secretInputs`                | Hayır   | `object`   | SecretRef taşıma/denetim hedefi kayıt defterinin gizli değer biçimli dizeler olarak değerlendirmesi gereken, `plugins.entries.<id>.config` altındaki yapılandırma yolları. Aşağıya bakın.                                                                                        |

Her `dangerousFlags` girdisi şunları destekler:

| Alan     | Gerekli | Tür                                   | Anlamı                                                                                                                     |
| -------- | ------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `path`   | Evet    | `string`                              | `plugins.entries.<id>.config` konumuna göre noktayla ayrılmış yapılandırma yolu. Eşleme/dizi bölümleri için `*` joker karakterlerini destekler. |
| `equals` | Evet    | `string \| number \| boolean \| null` | Bu yapılandırma değerini tehlikeli olarak işaretleyen tam sabit değer.                                                      |

`secretInputs` şunları destekler:

| Alan                    | Gerekli | Tür        | Anlamı                                                                                                                                                                                                                  |
| ----------------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Hayır   | `boolean`  | Bu SecretRef yüzeyinin etkin olup olmadığına karar verirken paketle gelen Plugin'in varsayılan etkinleştirme durumunu geçersiz kılar. Plugin paketle geliyor ancak yapılandırmada açıkça etkinleştirilene kadar yüzeyin devre dışı kalması gerekiyorsa bunu kullanın. |
| `paths`                 | Evet    | `object[]` | Her biri `path` (noktayla ayrılmış, `plugins.entries.<id>.config` yoluna göreli, `*` joker karakterlerini destekler) ve isteğe bağlı `expected` (şu anda yalnızca `"string"`) içeren, gizli bilgi biçimli yapılandırma yolları.                                     |

## mediaUnderstandingProviderMetadata referansı

Bir medya anlama sağlayıcısının varsayılan modelleri, otomatik kimlik doğrulama yedek önceliği veya genel çekirdek yardımcılarının çalışma zamanı yüklenmeden önce gereksinim duyduğu yerel belge desteği varsa `mediaUnderstandingProviderMetadata` kullanın. Anahtarlar ayrıca `contracts.mediaUnderstandingProviders` içinde bildirilmelidir.

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

| Alan                   | Tür                                                              | Anlamı                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Bu sağlayıcının sunduğu medya yetenekleri.                                                                                 |
| `defaultModels`        | `Record<string, string>`                                         | Yapılandırmada model belirtilmediğinde kullanılan, yetenekten modele varsayılan eşlemeler.                                 |
| `autoPriority`         | `Record<string, number>`                                         | Kimlik bilgilerine dayalı otomatik sağlayıcı yedeklemesinde daha düşük sayılar daha önce sıralanır.                        |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Sağlayıcının desteklediği yerel belge girdileri.                                                                           |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Belge türüne göre model geçersiz kılmaları. İlgili belge türü için görüntü tabanlı ayıklamayı devre dışı bırakmak üzere `image: false` ayarlayın. |

## channelConfigs referansı

Bir kanal Plugin'inin çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma meta verilerine gereksinimi olduğunda `channelConfigs` kullanın. Salt okunur kanal kurulum/durum keşfi, kullanılabilir bir kurulum girdisi olmadığında veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildirdiğinde, yapılandırılmış harici kanallar için bu meta verileri doğrudan kullanabilir.

`channelConfigs`, yeni bir üst düzey kullanıcı yapılandırma bölümü değil, Plugin manifest meta verisidir. Kullanıcılar kanal örneklerini yine `channels.<channel-id>` altında yapılandırır. OpenClaw, Plugin çalışma zamanı kodu yürütülmeden önce yapılandırılmış kanalın hangi Plugin'e ait olduğuna karar vermek için manifest meta verilerini okur.

Bir kanal Plugin'i için `configSchema` ve `channelConfigs` farklı yolları tanımlar:

- `configSchema`, `plugins.entries.<plugin-id>.config` yolunu doğrular
- `channelConfigs.<channel-id>.schema`, `channels.<channel-id>` yolunu doğrular

`channels[]` bildiren ve paketle gelmeyen Plugin'ler, eşleşen `channelConfigs` girdilerini de bildirmelidir. Bunlar olmadan OpenClaw yine de Plugin'i yükleyebilir; ancak soğuk yol yapılandırma şeması, kurulum ve Control UI yüzeyleri, Plugin çalışma zamanı yürütülene kadar kanala ait seçeneklerin biçimini bilemez.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` ve `nativeSkillsAutoEnabled`, kanal çalışma zamanı yüklenmeden önce çalışan komut yapılandırması denetimleri için statik `auto` varsayılanlarını bildirebilir. Paketle gelen kanallar, paketlerine ait diğer kanal kataloğu meta verilerinin yanında aynı varsayılanları `package.json#openclaw.channel.commands` aracılığıyla da yayımlayabilir.

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

| Alan          | Tür                      | Anlamı                                                                                                                           |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Şeması. Bildirilen her kanal yapılandırma girdisi için gereklidir.                                      |
| `uiHints`     | `Record<string, object>` | İlgili kanal yapılandırma bölümü için isteğe bağlı kullanıcı arayüzü etiketleri/yer tutucuları/hassaslık ipuçları.                 |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeylerinde birleştirilen kanal etiketi.                       |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                                                         |
| `commands`    | `object`                 | Çalışma zamanı öncesi yapılandırma denetimleri için statik yerel komut ve yerel skill otomatik varsayılanları.                     |
| `preferOver`  | `string[]`               | Bu kanalın seçim yüzeylerinde önüne geçmesi gereken eski veya daha düşük öncelikli Plugin kimlikleri.                             |

### Başka bir kanal Plugin'inin yerini alma

Plugin'iniz, başka bir Plugin'in de sağlayabildiği bir kanal kimliği için tercih edilen sahip olduğunda `preferOver` kullanın. Yaygın durumlar; yeniden adlandırılmış bir Plugin kimliği, paketle gelen bir Plugin'in yerini alan bağımsız bir Plugin veya yapılandırma uyumluluğu için aynı kanal kimliğini koruyan, bakımı sürdürülen bir çatallamadır.

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

`channels.chat` yapılandırıldığında OpenClaw hem kanal kimliğini hem de tercih edilen Plugin kimliğini dikkate alır. Daha düşük öncelikli Plugin yalnızca paketle geldiği veya varsayılan olarak etkin olduğu için seçildiyse OpenClaw, kanalın ve araçlarının tek bir Plugin'e ait olması için bu Plugin'i etkin çalışma zamanı yapılandırmasında devre dışı bırakır. Açık kullanıcı seçimi yine önceliklidir: kullanıcı her iki Plugin'i de açıkça etkinleştirirse (`plugins.allow` veya önemli bir `plugins.entries` yapılandırması aracılığıyla), OpenClaw istenen Plugin kümesini sessizce değiştirmek yerine bu seçimi korur ve yinelenen kanal/araç tanılamalarını bildirir.

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

- açık `provider/model` referansları, sahip olan `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes` değerlerinden önceliklidir
- paketle gelmeyen bir Plugin ile paketle gelen bir Plugin'in ikisi de eşleşirse paketle gelmeyen Plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtene kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                                          |
| --------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimlikleriyle `startsWith` kullanılarak eşleştirilen önekler.                         |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısa model kimlikleriyle eşleştirilen düzenli ifade kaynakları. |

`modelPatterns` girdileri, iç içe yineleme içeren kalıpları (örneğin `(a+)+$`) reddeden `compileSafeRegex` aracılığıyla derlenir. Güvenlik denetiminde başarısız olan kalıplar, sözdizimsel olarak geçersiz düzenli ifadeler gibi sessizce atlanır. Kalıpları basit tutun ve iç içe niceleyicilerden kaçının.

## modelCatalog referansı

OpenClaw'ın Plugin çalışma zamanını yüklemeden önce sağlayıcı model meta verilerini bilmesi gerektiğinde `modelCatalog` kullanın. Bu, sabit katalog satırları, sağlayıcı takma adları, bastırma kuralları ve keşif modu için manifeste ait kaynaktır. Çalışma zamanı yenilemesi yine sağlayıcı çalışma zamanı koduna aittir; ancak manifest, çalışma zamanının ne zaman gerekli olduğunu çekirdeğe bildirir.

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

| Alan             | Tür                                                      | Anlamı                                                                                                             |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `providers`      | `Record<string, object>`                                 | Bu pluginin sahip olduğu sağlayıcı kimliklerinin katalog satırları. Anahtarlar üst düzey `providers` içinde de yer almalıdır. |
| `aliases`        | `Record<string, object>`                                 | Katalog veya engelleme planlaması için sahip olunan bir sağlayıcıya çözümlenmesi gereken sağlayıcı takma adları.    |
| `suppressions`   | `object[]`                                               | Bu pluginin sağlayıcıya özgü bir nedenle engellediği, başka bir kaynaktan gelen model satırları.                    |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Sağlayıcı kataloğunun manifest meta verilerinden okunup okunamayacağı, önbelleğe yenilenip yenilenemeyeceği veya çalışma zamanı gerektirip gerektirmediği. |
| `runtimeAugment` | `boolean`                                                | Yalnızca sağlayıcı çalışma zamanının manifest/yapılandırma planlamasından sonra katalog satırları eklemesi gerektiğinde `true` olarak ayarlayın. |

`aliases`, model kataloğu planlamasında sağlayıcı sahipliği aramasına katılır. Takma ad hedefleri, aynı pluginin sahip olduğu üst düzey sağlayıcılar olmalıdır. Sağlayıcıya göre filtrelenmiş bir liste bir takma ad kullandığında OpenClaw, sağlayıcı çalışma zamanını yüklemeden sahip olan manifesti okuyabilir ve takma ada ait API/temel URL geçersiz kılmalarını uygulayabilir. Takma adlar, filtrelenmemiş katalog listelerini genişletmez; geniş kapsamlı listeler yalnızca sahip olan standart sağlayıcının satırlarını verir.

`suppressions`, eski sağlayıcı çalışma zamanı `suppressBuiltInModel` kancasının yerini alır. Engelleme girdileri yalnızca sağlayıcı plugine ait olduğunda veya sahip olunan bir sağlayıcıyı hedefleyen bir `modelCatalog.aliases` anahtarı olarak bildirildiğinde dikkate alınır. Model çözümleme sırasında çalışma zamanı engelleme kancaları artık çağrılmaz.

Sağlayıcı alanları:

| Alan                  | Tür                      | Anlamı                                                                                                                                                                                                                          |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan temel URL.                                                                                                                                                      |
| `api`                 | `ModelApi`               | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan API bağdaştırıcısı.                                                                                                                                             |
| `headers`             | `Record<string, string>` | Bu sağlayıcı kataloğuna uygulanan isteğe bağlı statik üst bilgiler.                                                                                                                                                              |
| `defaultUtilityModel` | `string`                 | Kısa dahili yardımcı görevler (başlıklar, ilerleme anlatımı) için sağlayıcının önerdiği isteğe bağlı küçük model kimliği. `agents.defaults.utilityModel` ayarlanmamışsa ve bu sağlayıcı ajanın birincil modelini sunuyorsa kullanılır. |
| `models`              | `object[]`               | Zorunlu model satırları. `id` içermeyen satırlar yok sayılır.                                                                                                                                                                   |

Model alanları:

| Alan               | Tür                                                            | Anlamı                                                                                     |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `id`               | `string`                                                       | `provider/` öneki olmadan, sağlayıcıya özgü model kimliği.                                 |
| `name`             | `string`                                                       | İsteğe bağlı görünen ad.                                                                   |
| `api`              | `ModelApi`                                                     | İsteğe bağlı model başına API geçersiz kılması.                                            |
| `baseUrl`          | `string`                                                       | İsteğe bağlı model başına temel URL geçersiz kılması.                                      |
| `headers`          | `Record<string, string>`                                       | İsteğe bağlı model başına statik üst bilgiler.                                             |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modelin kabul ettiği kipler. Diğer değerler sessizce kaldırılır.                           |
| `reasoning`        | `boolean`                                                      | Modelin akıl yürütme davranışı sunup sunmadığı.                                             |
| `contextWindow`    | `number`                                                       | Sağlayıcının yerel bağlam penceresi.                                                        |
| `contextTokens`    | `number`                                                       | `contextWindow` değerinden farklı olduğunda isteğe bağlı etkin çalışma zamanı bağlam sınırı. |
| `maxTokens`        | `number`                                                       | Biliniyorsa azami çıktı belirteci sayısı.                                                   |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Düşünme düzeyi başına isteğe bağlı model kimliği veya parametre geçersiz kılmaları.         |
| `cost`             | `object`                                                       | İsteğe bağlı `tieredPricing` dâhil, milyon belirteç başına isteğe bağlı USD fiyatlandırması. |
| `compat`           | `object`                                                       | OpenClaw model yapılandırması uyumluluğuyla eşleşen isteğe bağlı uyumluluk bayrakları.      |
| `mediaInput`       | `object`                                                       | Kip başına isteğe bağlı giriş yapılandırması; şu anda yalnızca görüntü desteklenir.         |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listeleme durumu. Yalnızca satırın hiçbir şekilde görünmemesi gerekiyorsa engelleyin.       |
| `statusReason`     | `string`                                                       | Kullanılamayan durumla birlikte gösterilen isteğe bağlı neden.                              |
| `replaces`         | `string[]`                                                     | Bu modelin yerini aldığı, sağlayıcıya özgü eski model kimlikleri.                           |
| `replacedBy`       | `string`                                                       | Kullanımdan kaldırılmış satırlar için sağlayıcıya özgü yedek model kimliği.                 |
| `tags`             | `string[]`                                                     | Seçiciler ve filtreler tarafından kullanılan kararlı etiketler.                            |

Engelleme alanları:

| Alan                       | Tür        | Anlamı                                                                                                           |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Engellenecek üst kaynak satırının sağlayıcı kimliği. Bu plugine ait olmalı veya sahip olunan bir takma ad olarak bildirilmelidir. |
| `model`                    | `string`   | Engellenecek, sağlayıcıya özgü model kimliği.                                                                    |
| `reason`                   | `string`   | Engellenen satır doğrudan istendiğinde gösterilen isteğe bağlı ileti.                                             |
| `when.baseUrlHosts`        | `string[]` | Engelleme uygulanmadan önce bulunması gereken etkin sağlayıcı temel URL ana bilgisayarlarının isteğe bağlı listesi. |
| `when.providerConfigApiIn` | `string[]` | Engelleme uygulanmadan önce bulunması gereken tam sağlayıcı yapılandırması `api` değerlerinin isteğe bağlı listesi. |

Yalnızca çalışma zamanına ait verileri `modelCatalog` içine koymayın. `static` değerini yalnızca manifest satırları, sağlayıcıya göre filtrelenmiş liste ve seçici yüzeylerinin kayıt defteri/çalışma zamanı keşfini atlayabilmesine yetecek kadar eksiksiz olduğunda kullanın. Manifest satırları listelenebilir yararlı başlangıç verileri veya eklemeler olduğunda ancak yenileme/önbellek daha sonra yeni satırlar ekleyebildiğinde `refreshable` kullanın; yenilenebilir satırlar tek başlarına yetkili değildir. OpenClaw'ın listeyi bilmek için sağlayıcı çalışma zamanını yüklemesi gerektiğinde `runtime` kullanın.

## modelIdNormalization referansı

Sağlayıcı çalışma zamanı yüklenmeden önce gerçekleşmesi gereken, maliyeti düşük ve sağlayıcıya ait model kimliği temizliği için `modelIdNormalization` kullanın. Böylece kısa model adları, sağlayıcıya özgü eski kimlikler ve vekil önek kuralları gibi takma adlar, çekirdek model seçimi tabloları yerine sahip olan plugin manifestinde tutulur.

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

| Alan                                 | Tür                     | Anlamı                                                                                         |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Büyük/küçük harfe duyarsız tam model kimliği takma adları. Değerler yazıldıkları biçimde döndürülür. |
| `stripPrefixes`                      | `string[]`              | Takma ad aramasından önce kaldırılacak önekler; eski sağlayıcı/model tekrarları için kullanışlıdır. |
| `prefixWhenBare`                     | `string`                | Normalleştirilmiş model kimliği hâlihazırda `/` içermiyorsa eklenecek önek.                     |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Takma ad aramasından sonra, `modelPrefix` ve `prefix` ile anahtarlanan koşullu yalın kimlik önek kuralları. |

## providerEndpoints referansı

Genel istek politikasının sağlayıcı çalışma zamanı yüklenmeden önce bilmesi gereken uç nokta sınıflandırması için `providerEndpoints` kullanın. Her bir `endpointClass` değerinin anlamı hâlâ çekirdeğe aittir; ana bilgisayar ve temel URL meta verileri plugin manifestlerine aittir.

Resmî olarak haricileştirilmiş sağlayıcı pluginleri çekirdek dağıtımının dışında bırakılır; bu nedenle manifestleri kurulana kadar görünmez. Uç nokta sınıflandırmasının plugin olmadan da çalışmaya devam etmesi için bunların `providerEndpoints` verileri `scripts/lib/official-external-provider-catalog.json` dosyasına da yansıtılmalıdır; bir sözleşme testi bu yansıtmayı zorunlu kılar.

Uç nokta alanları:

| Alan                           | Tür        | Anlamı                                                                                         |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`, `moonshot-native` veya `google-vertex` gibi bilinen çekirdek uç nokta sınıfı.     |
| `hosts`                        | `string[]` | Uç nokta sınıfıyla eşleşen tam ana makine adları.                                               |
| `hostSuffixes`                 | `string[]` | Uç nokta sınıfıyla eşleşen ana makine adı son ekleri. Yalnızca alan adı son eki eşleşmesi için başına `.` ekleyin. |
| `baseUrls`                     | `string[]` | Uç nokta sınıfıyla eşleşen, normalleştirilmiş tam HTTP(S) temel URL'leri.                        |
| `googleVertexRegion`           | `string`   | Tam küresel ana makineler için sabit Google Vertex bölgesi.                                     |
| `googleVertexRegionHostSuffix` | `string`   | Google Vertex bölge önekini ortaya çıkarmak için eşleşen ana makinelerden kaldırılacak son ek.   |

## providerRequest referansı

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

| Alan                  | Tür          | Anlamı                                                                                  |
| --------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `family`              | `string`     | Genel istek uyumluluğu kararları ve tanılamalar tarafından kullanılan sağlayıcı ailesi etiketi. |
| `compatibilityFamily` | `"moonshot"` | Paylaşılan istek yardımcıları için isteğe bağlı sağlayıcı ailesi uyumluluk grubu.        |
| `openAICompletions`   | `object`     | Şu anda `supportsStreamingUsage` olan OpenAI uyumlu tamamlama isteği bayrakları.         |

## secretProviderIntegrations referansı

Bir plugin yeniden kullanılabilir bir SecretRef çalıştırma sağlayıcısı ön ayarı yayımlayabildiğinde `secretProviderIntegrations` kullanın. OpenClaw bu meta verileri plugin çalışma zamanı yüklenmeden önce okur, plugin sahipliğini `secrets.providers.<alias>.pluginIntegration` içinde saklar ve gerçek gizli değer çözümlemesini SecretRef çalışma zamanına bırakır. Ön ayarlar yalnızca paketle gelen pluginler ve git ile ClawHub kurulumları gibi yönetilen plugin kurulum köklerinden keşfedilen kurulu pluginler için sunulur.

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

Eşleme anahtarı entegrasyon kimliğidir. `providerAlias` belirtilmezse OpenClaw, entegrasyon kimliğini SecretRef sağlayıcı diğer adı olarak kullanır. Sağlayıcı diğer adları normal SecretRef sağlayıcı diğer adı kalıbıyla eşleşmelidir; örneğin `team-secrets` veya `onepassword-work`.

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

Başlatma/yeniden yükleme sırasında OpenClaw, güncel plugin manifesti meta verilerini yükleyerek, sahibi olan pluginin kurulu ve etkin olduğunu denetleyerek ve çalıştırma komutunu manifestten oluşturarak bu sağlayıcıyı çözümler. Pluginin devre dışı bırakılması veya kaldırılması, etkin SecretRef'ler için sağlayıcıyı geçersiz kılar. Bağımsız çalıştırma yapılandırması isteyen operatörler doğrudan elle `command`/`args` sağlayıcıları yazmaya devam edebilir.

Şu anda yalnızca `source: "exec"` ön ayarları desteklenmektedir. `command`, `${node}` olmalı ve `args[0]`, plugin köküne göreli bir `./` çözümleyici betiği olmalıdır. OpenClaw bunu başlatma/yeniden yükleme sırasında güncel Node yürütülebilir dosyasına ve plugin içindeki betiğin mutlak yoluna dönüştürür. `--require`, `--import`, `--loader`, `--env-file`, `--eval` ve `--print` gibi Node seçenekleri manifest ön ayarı sözleşmesinin parçası değildir. Node dışı komutlara ihtiyaç duyan operatörler bağımsız elle çalıştırma sağlayıcılarını doğrudan yapılandırabilir.

OpenClaw, manifest ön ayarları için `trustedDirs` değerini plugin kökünden ve `${node}` ön ayarlarında güncel Node yürütülebilir dosyasının dizininden türetir. Manifestte tanımlanan `trustedDirs` yok sayılır. `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` ve `allowInsecurePath` gibi diğer çalıştırma sağlayıcısı seçenekleri normal SecretRef çalıştırma sağlayıcısı yapılandırmasına aktarılır.

## modelPricing referansı

Bir sağlayıcının çalışma zamanı yüklenmeden önce kontrol düzlemi fiyatlandırma davranışını belirlemesi gerektiğinde `modelPricing` kullanın. Gateway fiyatlandırma önbelleği, sağlayıcı çalışma zamanı kodunu içe aktarmadan bu meta verileri okur.

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

| Alan         | Tür               | Anlamı                                                                                           |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | OpenRouter veya LiteLLM fiyatlandırmasını hiçbir zaman almaması gereken yerel/kendi barındırılan sağlayıcılar için `false` olarak ayarlayın. |
| `openRouter` | `false \| object` | OpenRouter fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için OpenRouter aramasını devre dışı bırakır. |
| `liteLLM`    | `false \| object` | LiteLLM fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için LiteLLM aramasını devre dışı bırakır. |

Kaynak alanları:

| Alan                       | Tür                | Anlamı                                                                                                               |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw sağlayıcı kimliğinden farklı olduğunda harici katalog sağlayıcı kimliği; örneğin bir `zai` sağlayıcısı için `z-ai`. |
| `passthroughProviderModel` | `boolean`          | Eğik çizgi içeren model kimliklerini iç içe sağlayıcı/model referansları olarak ele alır; OpenRouter gibi vekil sağlayıcılar için kullanışlıdır. |
| `modelIdTransforms`        | `"version-dots"[]` | Ek harici katalog model kimliği çeşitleri. `version-dots`, `claude-opus-4.6` gibi noktalı sürüm kimliklerini dener.    |

### OpenClaw Sağlayıcı Dizini

OpenClaw Sağlayıcı Dizini, pluginleri henüz kurulmamış olabilecek sağlayıcılar için OpenClaw'a ait önizleme meta verileridir. Bir plugin manifestinin parçası değildir. Plugin manifestleri, kurulu pluginler için yetkili kaynak olmaya devam eder. Sağlayıcı Dizini, gelecekteki kurulabilir sağlayıcı ve kurulum öncesi model seçici yüzeylerinin bir sağlayıcı plugini kurulu olmadığında kullanacağı dahili geri dönüş sözleşmesidir.

Katalog yetki sırası:

1. Kullanıcı yapılandırması.
2. Kurulu plugin manifestindeki `modelCatalog`.
3. Açık yenileme sonucunda oluşturulan model kataloğu önbelleği.
4. OpenClaw Sağlayıcı Dizini önizleme satırları.

Sağlayıcı Dizini gizli değerler, etkinleştirilmiş durum, çalışma zamanı kancaları veya canlı hesaba özgü model verileri içermemelidir. Önizleme katalogları, plugin manifestleriyle aynı `modelCatalog` sağlayıcı satırı biçimini kullanır; ancak `api`, `baseUrl`, fiyatlandırma veya uyumluluk bayrakları gibi çalışma zamanı bağdaştırıcısı alanları kasıtlı olarak kurulu plugin manifestiyle uyumlu tutulmadıkça yalnızca kararlı görüntüleme meta verileriyle sınırlı kalmalıdır. Canlı `/models` keşfine sahip sağlayıcılar, normal listeleme veya ilk katılım sırasında sağlayıcı API'lerini çağırmak yerine yenilenmiş satırları açık model kataloğu önbelleği yolu üzerinden yazmalıdır.

Sağlayıcı Dizini girdileri, plugini çekirdekten taşınmış veya başka bir nedenle henüz kurulmamış sağlayıcılar için kurulabilir plugin meta verilerini de taşıyabilir. Bu meta veriler kanal kataloğu kalıbını yansıtır: paket adı, npm kurulum belirtimi, beklenen bütünlük ve düşük maliyetli kimlik doğrulama seçeneği etiketleri, kurulabilir bir ayarlama seçeneğini göstermek için yeterlidir. Plugin kurulduktan sonra kendi manifesti öncelik kazanır ve o sağlayıcının Sağlayıcı Dizini girdisi yok sayılır.

`openclaw doctor --fix`, eski üst düzey manifest yetenek anahtarlarının küçük ve kapalı bir kümesini `contracts.*` içine taşır: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` ve `tools`. Bunların hiçbiri (veya başka herhangi bir yetenek listesi) artık üst düzey manifest alanları olarak okunmaz; normal manifest yükleme bunları yalnızca `contracts` altında tanır.

## Manifest ile package.json karşılaştırması

İki dosya farklı amaçlara hizmet eder:

| Dosya                  | Kullanım amacı                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce mevcut olması gereken keşif, yapılandırma doğrulaması, kimlik doğrulama seçeneği meta verileri ve kullanıcı arayüzü ipuçları |
| `package.json`         | npm meta verileri, bağımlılık kurulumu ve giriş noktaları, kurulum kısıtlaması, ayarlama veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw'ın plugin kodunu yüklemeden önce bunu bilmesi gerekiyorsa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi plugin meta verileri kasıtlı olarak `openclaw.plugin.json` yerine `package.json` içindeki `openclaw` bloğunda bulunur. `openclaw.bundle` ve `openclaw.bundle.json`, OpenClaw plugin sözleşmeleri değildir; yerel pluginler `openclaw.plugin.json` dosyasını ve aşağıdaki desteklenen `package.json#openclaw` alanlarını kullanmalıdır.

Önemli örnekler:

| Alan                                                                                       | Anlamı                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Yerel Plugin giriş noktalarını bildirir. Plugin paketi dizininin içinde kalmalıdır.                                                                                                                 |
| `openclaw.runtimeExtensions`                                                               | Yüklü paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paketi dizininin içinde kalmalıdır.                                                                      |
| `openclaw.setupEntry`                                                                      | İlk katılım, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan, yalnızca kuruluma yönelik hafif giriş noktasıdır. Plugin paketi dizininin içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                                               | Yüklü paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. `setupEntry` gerektirir, mevcut olmalı ve Plugin paketi dizininin içinde kalmalıdır.                                      |
| `openclaw.channel`                                                                         | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal kataloğu meta verileridir.                                                                                           |
| `openclaw.channel.commands`                                                                | Kanal çalışma zamanı yüklenmeden önce yapılandırma, denetim ve komut listesi yüzeyleri tarafından kullanılan statik yerel komut ve yerel Skills otomatik varsayılan meta verileridir.                 |
| `openclaw.channel.configuredState`                                                         | Tam kanal çalışma zamanını yüklemeden "yalnızca ortam değişkenleriyle kurulum zaten mevcut mu?" sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyicisi meta verileridir.                    |
| `openclaw.channel.persistedAuthState`                                                      | Tam kanal çalışma zamanını yüklemeden "herhangi bir oturum zaten açılmış mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama denetleyicisi meta verileridir.                                   |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Birlikte sunulan ve harici olarak yayımlanan pluginler için yükleme/güncelleme ipuçlarıdır.                                                                                                         |
| `openclaw.install.defaultChoice`                                                           | Birden fazla yükleme kaynağı kullanılabildiğinde tercih edilen yükleme yoludur.                                                                                                                     |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` veya `>=2026.5.1-beta.1` gibi bir semver alt sınırı kullanan, desteklenen en düşük OpenClaw ana makine sürümüdür.                                                                      |
| `openclaw.compat.pluginApi`                                                                | Bu paketin gerektirdiği, `>=2026.5.27` gibi bir semver alt sınırı kullanan en düşük OpenClaw Plugin API aralığıdır.                                                                                  |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` gibi beklenen npm dağıtım bütünlüğü dizesidir; yükleme ve güncelleme akışları getirilen yapıtı buna göre doğrular.                                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Yapılandırma geçersiz olduğunda, birlikte sunulan Plugin için dar kapsamlı bir yeniden yükleme kurtarma yoluna izin verir.                                                                           |
| `openclaw.install.requiredPlatformPackages`                                                | Kilit dosyasındaki platform kısıtlamaları mevcut ana makineyle eşleştiğinde oluşturulması gereken npm paket takma adlarıdır.                                                                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Kurulum çalışma zamanı kanal yüzeylerinin dinleme başlamadan önce yüklenmesini sağlar, ardından yapılandırılmış kanal Plugininin tamamını dinleme sonrası etkinleştirmeye erteler.                    |

Manifest meta verileri, çalışma zamanı yüklenmeden önce ilk katılımda hangi sağlayıcı/kanal/kurulum seçeneklerinin görüneceğini belirler. `package.json#openclaw.install`, kullanıcı bu seçeneklerden birini belirlediğinde ilk katılıma ilgili plugini nasıl getireceğini veya etkinleştireceğini bildirir. Yükleme ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, birlikte sunulmayan Plugin kaynakları için yükleme ve manifest kayıt defteri yüklemesi sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ancak geçerli değerler, eski ana makinelerde harici pluginlerin atlanmasına neden olur. Birlikte sunulan kaynak pluginlerin ana makine kaynak koduyla aynı sürüme sahip olduğu varsayılır.

`openclaw.install.requiredPlatformPackages`, gerekli yerel ikili dosyaları isteğe bağlı, platforma özgü takma adlar üzerinden sunan npm paketleri içindir. Desteklenen her platform takma adı için yalın npm paket adını listeleyin. npm yüklemesi sırasında OpenClaw, yalnızca kilit dosyası kısıtlamaları mevcut ana makineyle eşleşen bildirilmiş takma adı doğrular. npm başarı bildirdiği hâlde bu takma adı dahil etmezse OpenClaw yeni bir önbellekle bir kez daha dener ve takma ad hâlâ yoksa yüklemeyi geri alır.

`openclaw.compat.pluginApi`, birlikte sunulmayan Plugin kaynaklarının paket yüklemesi sırasında uygulanır. Bunu, paketin temel alınarak derlendiği OpenClaw Plugin SDK/çalışma zamanı API alt sınırı için kullanın. Bir Plugin paketi daha yeni bir API gerektirirken diğer akışlar için daha düşük bir yükleme ipucunu koruduğunda, bu değer `minHostVersion` değerinden daha katı olabilir. Resmî OpenClaw sürüm eşitlemesi, mevcut resmî Plugin API alt sınırlarını varsayılan olarak OpenClaw sürümüne yükseltir; ancak yalnızca Plugine yönelik sürümler, paket eski ana makineleri bilinçli olarak destekliyorsa daha düşük bir alt sınırı koruyabilir. Uyumluluk sözleşmesi olarak yalnızca paket sürümünü kullanmayın. `peerDependencies.openclaw`, npm paket meta verisi olarak kalır; OpenClaw, yükleme uyumluluğu kararları için `openclaw.compat.pluginApi` sözleşmesini kullanır.

İsteğe bağlı resmî yükleme meta verileri, Plugin ClawHub'da yayımlanmışsa `clawhubSpec` kullanmalıdır; ilk katılım bunu tercih edilen uzak kaynak olarak değerlendirir ve yükleme sonrasında ClawHub yapıt bilgilerini kaydeder. `npmSpec`, henüz ClawHub'a taşınmamış paketler için uyumluluk yedeği olarak kalır.

Tam npm sürümü sabitlemesi zaten `npmSpec` içinde bulunur; örneğin `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmî harici katalog girdileri, tam belirtimleri `expectedIntegrity` ile eşleştirmelidir; böylece getirilen npm yapıtı artık sabitlenmiş sürümle eşleşmiyorsa güncelleme akışları güvenli biçimde başarısız olur. Etkileşimli ilk katılım, uyumluluk için yalın paket adları ve dağıtım etiketleri dahil olmak üzere güvenilir kayıt defteri npm belirtimlerini sunmaya devam eder. Katalog tanılamaları; tam, değişken, bütünlük sabitlenmiş, bütünlüğü eksik, paket adı uyuşmazlığı bulunan ve geçersiz varsayılan seçim kaynaklarını birbirinden ayırabilir. Ayrıca `expectedIntegrity` mevcut olduğu hâlde sabitleyebileceği geçerli bir npm kaynağı yoksa uyarı verir. `expectedIntegrity` mevcut olduğunda yükleme/güncelleme akışları bunu zorunlu kılar; belirtilmediğinde kayıt defteri çözümlemesi bir bütünlük sabitlemesi olmadan kaydedilir.

Kanal pluginleri; durum, kanal listesi veya SecretRef taramalarının tam çalışma zamanını yüklemeden yapılandırılmış hesapları tanımlaması gerektiğinde `openclaw.setupEntry` sağlamalıdır. Kurulum girdisi, kanal meta verilerinin yanı sıra kurulum açısından güvenli yapılandırma, durum ve gizli bilgi bağdaştırıcılarını sunmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve aktarım çalışma zamanlarını ana uzantı giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanlarına yönelik paket sınırı denetimlerini geçersiz kılmaz. Örneğin `openclaw.runtimeExtensions`, paket dışına çıkan bir `openclaw.extensions` yolunu yüklenebilir hâle getiremez.

`openclaw.install.allowInvalidConfigRecovery` bilinçli olarak dar kapsamlıdır. Keyfî bozuk yapılandırmaları yüklenebilir hâle getirmez. Şu anda yalnızca eksik bir birlikte sunulan Plugin yolu veya aynı birlikte sunulan Plugin için eskimiş bir `channels.<id>` girdisi gibi, birlikte sunulan Pluginlerin belirli eskimiş yükseltme hatalarından yükleme akışlarının kurtulmasına izin verir. İlgisiz yapılandırma hataları yüklemeyi engellemeye devam eder ve operatörleri `openclaw doctor --fix` komutuna yönlendirir.

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

Kurulum, doctor, durum veya salt okunur mevcudiyet akışları tam kanal Plugini yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğunda bunu kullanın. Kalıcı kimlik doğrulama durumu, yapılandırılmış kanal durumu değildir: Pluginleri otomatik olarak etkinleştirmek, çalışma zamanı bağımlılıklarını onarmak veya bir kanal çalışma zamanının yüklenip yüklenmeyeceğine karar vermek için bu meta verileri kullanmayın. Hedef dışa aktarım, yalnızca kalıcı durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel dosyası üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli ve yalnızca ortam değişkenlerine dayalı yapılandırılmışlık denetimleri için aynı yapıyı izler:

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

Bir kanal, yapılandırılmış durumu ortam değişkenlerinden veya diğer küçük, çalışma zamanı dışı girdilerden belirleyebiliyorsa bunu kullanın. Denetim tam yapılandırma çözümlemesini veya gerçek kanal çalışma zamanını gerektiriyorsa bu mantığı Pluginin `config.hasConfiguredState` kancasında tutun.

## Keşif önceliği (yinelenen Plugin kimlikleri)

OpenClaw pluginleri şu sırayla denetlenen üç kökten keşfeder: OpenClaw ile birlikte sunulan pluginler, genel yükleme kökü (`~/.openclaw/extensions`) ve mevcut çalışma alanı kökü (`<workspace>/.openclaw/extensions`); bunlara ek olarak açıkça belirtilen `plugins.load.paths` girdileri de denetlenir.

İki keşif aynı `id` değerini paylaşıyorsa yalnızca **en yüksek öncelikli** manifest tutulur; daha düşük öncelikli yinelenenler yan yana yüklenmek yerine elenir. En yüksekten en düşüğe öncelik sırası:

1. **Yapılandırmayla seçilen** — `plugins.entries.<id>` içinde açıkça sabitlenmiş bir yol
2. **İzlenen bir yükleme kaydıyla eşleşen genel yükleme** — kimlik birlikte sunulan bir Plugine de ait olsa bile, `openclaw plugin install`/`openclaw plugin update` aracılığıyla yüklenmiş ve OpenClaw'ın yükleme izlemesinin aynı kimlik için tanıdığı bir Plugin
3. **Birlikte sunulan** — OpenClaw ile birlikte sunulan pluginler
4. **Çalışma alanı** — mevcut çalışma alanına göre keşfedilen pluginler
5. Keşfedilen diğer tüm adaylar

Sonuçlar:

- Birlikte sunulan bir Pluginin çalışma alanında veya genel kökte izlenmeden duran çatallanmış ya da eskimiş bir kopyası, birlikte sunulan derlemeyi gölgelemez.
- Birlikte sunulan bir Plugini geçersiz kılmak için ya ilgili kimlik adına `openclaw plugin install` komutunu çalıştırarak izlenen genel yüklemenin birlikte sunulan kopyadan daha yüksek öncelik kazanmasını sağlayın ya da `plugins.entries.<id>` üzerinden belirli bir yolu sabitleyerek yapılandırmayla seçilen öncelik sayesinde kazanmasını sağlayın.
- Yinelenenlerin elenmesi günlüğe kaydedilir; böylece Doctor ve başlangıç tanılamaları elenen kopyayı gösterebilir.
- Yapılandırmayla seçilen yinelenen geçersiz kılmalar, tanılamalarda açık geçersiz kılmalar olarak ifade edilir; ancak eskimiş çatalların ve kazara oluşan gölgelemelerin görünür kalması için yine de uyarı verilir.

## JSON Schema gereksinimleri

- **Her plugin bir JSON Schema ile birlikte sunulmalıdır**; hiçbir yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin, `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okunurken/yazılırken doğrulanır.
- Paketle birlikte gelen bir plugin'i yeni yapılandırma anahtarlarıyla genişletirken veya çatallarken, aynı anda ilgili plugin'in `openclaw.plugin.json` dosyasındaki `configSchema` alanını da güncelleyin. Paketle birlikte gelen plugin şemaları katıdır; bu nedenle `configSchema.properties` alanına `myNewKey` eklemeden kullanıcı yapılandırmasına `plugins.entries.<id>.config.myNewKey` eklemek, plugin çalışma zamanı yüklenmeden önce reddedilir.

Örnek şema genişletmesi:

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

- Bilinmeyen `channels.*` anahtarları, kanal kimliği bir plugin bildirimi tarafından tanımlanmadığı sürece **hatadır**. Aynı kimlik `plugins.allow`, `plugins.entries` veya `plugins.installs` içinde de yer alıyorsa (başvurulan ancak şu anda keşfedilemeyen bir plugin), OpenClaw bunu bunun yerine **uyarı** düzeyine indirir.
- Bilinmeyen plugin kimliklerine başvuran `plugins.entries.<id>`, `plugins.allow` ve `plugins.deny` girdileri hata değil, **uyarıdır** ("eski yapılandırma girdisi yok sayıldı"); böylece yükseltmeler ve kaldırılan/yeniden adlandırılan plugin'ler Gateway'in başlatılmasını engellemez.
- Bilinmeyen bir plugin kimliğine başvuran `plugins.slots.memory` bir **hatadır**; ancak bilinen resmî harici `memory-lancedb` plugin'i için bunun yerine uyarı verilir.
- Bir plugin yüklenmiş ancak bildirimi veya şeması bozuk ya da eksikse doğrulama başarısız olur ve Doctor plugin hatasını bildirir.
- Plugin yapılandırması mevcut ancak plugin **devre dışıysa**, yapılandırma korunur ve Doctor ile günlüklerde bir **uyarı** gösterilir.

Eksiksiz `plugins.*` şeması için [Yapılandırma başvurusu](/tr/gateway/configuration) bölümüne bakın.

## Notlar

- Bildirim, yerel dosya sistemi yüklemeleri dâhil olmak üzere **yerel OpenClaw plugin'leri için zorunludur**. Çalışma zamanı plugin modülünü yine ayrı olarak yükler; bildirim yalnızca keşif ve doğrulama içindir.
- Yerel bildirimler JSON5 ile ayrıştırılır; bu nedenle nihai değer bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Bildirim yükleyicisi yalnızca belgelenmiş bildirim alanlarını okur. Özel üst düzey anahtarlardan kaçının.
- Bir plugin bunlara ihtiyaç duymadığında `channels`, `providers`, `cliBackends` ve `skills` alanlarının tümü atlanabilir.
- `providerCatalogEntry` hafif kalmalı ve kapsamlı çalışma zamanı kodunu içe aktarmamalıdır; bunu istek zamanında yürütme için değil, statik sağlayıcı kataloğu meta verileri veya dar kapsamlı keşif tanımlayıcıları için kullanın.
- Özel plugin türleri `plugins.slots.*` aracılığıyla seçilir: `plugins.slots.memory` üzerinden `kind: "memory"` (varsayılan `memory-core`), `plugins.slots.contextEngine` üzerinden `kind: "context-engine"` (varsayılan `legacy`).
- Özel plugin türünü bu bildirimde tanımlayın. Çalışma zamanı girişindeki `OpenClawPluginDefinition.kind` kullanımdan kaldırılmıştır ve yalnızca eski plugin'ler için uyumluluk geri dönüşü olarak kalmıştır.
- Ortam değişkeni meta verileri (`setup.providers[].envVars`, kullanımdan kaldırılmış `providerAuthEnvVars` ve `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, cron teslimatı doğrulaması ve diğer salt okunur yüzeyler, bir ortam değişkenini yapılandırılmış olarak kabul etmeden önce plugin güvenini ve etkinleştirme politikasını uygulamaya devam eder.
- Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı meta verileri için [Sağlayıcı çalışma zamanı kancaları](/tr/plugins/architecture-internals#provider-runtime-hooks) bölümüne bakın.
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
    Plugin SDK başvurusu ve alt yol içe aktarmaları.
  </Card>
</CardGroup>
