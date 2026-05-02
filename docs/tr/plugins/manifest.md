---
read_when:
    - Bir OpenClaw Plugin geliştiriyorsunuz
    - Bir Plugin yapılandırma şeması yayımlamanız veya Plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin manifesti
x-i18n:
    generated_at: "2026-05-02T09:02:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9cb6eff8d35cbd819178be9885801e2b84ad29cd12bbfd2f630467914366e4
    source_path: plugins/manifest.md
    workflow: 16
---

Bu sayfa yalnızca **yerel OpenClaw Plugin bildirimi** içindir.

Uyumlu paket düzenleri için bkz. [Plugin paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı bildirim dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya bildirim içermeyen varsayılan Claude bileşen
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan
`openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda paket meta verilerini ve bildirilen
Skills köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını,
Claude paketi LSP varsayılanlarını ve düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde
desteklenen hook paketlerini okur.

Her yerel OpenClaw Plugin, **Plugin kökünde** bir `openclaw.plugin.json` dosyası
göndermelidir. OpenClaw bu bildirimi yapılandırmayı **Plugin kodunu çalıştırmadan**
doğrulamak için kullanır. Eksik veya geçersiz bildirimler Plugin hatası olarak
değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam Plugin sistemi kılavuzuna bakın: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve güncel dış uyumluluk rehberliği için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'ın **Plugin kodunuzu yüklemeden önce** okuduğu
meta verilerdir. Aşağıdaki her şey, Plugin çalışma zamanını başlatmadan incelenebilecek
kadar düşük maliyetli olmalıdır.

**Şunlar için kullanın:**

- Plugin kimliği, yapılandırma doğrulaması ve yapılandırma kullanıcı arayüzü ipuçları
- kimlik doğrulama, ilk kurulum ve kurulum meta verileri (takma ad, otomatik etkinleştirme, sağlayıcı ortam değişkenleri, kimlik doğrulama seçenekleri)
- denetim düzlemi yüzeyleri için etkinleştirme ipuçları
- kısa model ailesi sahipliği
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` ana makinesinin inceleyebileceği QA çalıştırıcı meta verileri
- katalog ve doğrulama yüzeylerine birleştirilen kanala özgü yapılandırma meta verileri

**Şunlar için kullanmayın:** çalışma zamanı davranışı kaydetmek, kod giriş noktaları
bildirmek veya npm kurulum meta verileri. Bunlar Plugin kodunuza ve `package.json`
dosyasına aittir.

## Asgari örnek

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

## Üst düzey alan referansı

| Alan                                 | Gerekli  | Tür                              | Anlamı                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Evet     | `string`                         | Kanonik Plugin kimliği. Bu, `plugins.entries.<id>` içinde kullanılan kimliktir.                                                                                                                                                     |
| `configSchema`                       | Evet     | `object`                         | Bu Plugin yapılandırması için satır içi JSON Schema.                                                                                                                                                                                |
| `enabledByDefault`                   | Hayır    | `true`                           | Paketlenmiş bir Plugin'i varsayılan olarak etkin işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` olmayan herhangi bir değere ayarlayın.                                                    |
| `legacyPluginIds`                    | Hayır    | `string[]`                       | Bu kanonik Plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                                        |
| `autoEnableWhenConfiguredProviders`  | Hayır    | `string[]`                       | Auth, yapılandırma veya model başvuruları bunlardan söz ettiğinde bu Plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                                |
| `kind`                               | Hayır    | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan özel bir Plugin türü bildirir.                                                                                                                                                              |
| `channels`                           | Hayır    | `string[]`                       | Bu Plugin'in sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                                      |
| `providers`                          | Hayır    | `string[]`                       | Bu Plugin'in sahip olduğu sağlayıcı kimlikleri.                                                                                                                                                                                     |
| `providerDiscoveryEntry`             | Hayır    | `string`                         | Tam Plugin runtime'ını etkinleştirmeden yüklenebilen, manifest kapsamlı sağlayıcı katalog meta verileri için Plugin köküne göre göreli hafif sağlayıcı keşif modülü yolu.                                                          |
| `modelSupport`                       | Hayır    | `object`                         | Plugin'i runtime'dan önce otomatik yüklemek için kullanılan, manifestin sahip olduğu kısaltılmış model ailesi meta verileri.                                                                                                        |
| `modelCatalog`                       | Hayır    | `object`                         | Bu Plugin'in sahip olduğu sağlayıcılar için bildirimsel model kataloğu meta verileri. Bu, Plugin runtime'ını yüklemeden gelecekte salt okunur listeleme, onboarding, model seçiciler, takma adlar ve bastırma için control-plane sözleşmesidir. |
| `modelPricing`                       | Hayır    | `object`                         | Sağlayıcının sahip olduğu harici fiyatlandırma arama ilkesi. Yerel/kendi barındırılan sağlayıcıları uzak fiyatlandırma kataloglarının dışında tutmak veya çekirdekte sağlayıcı kimliklerini sabit kodlamadan sağlayıcı başvurularını OpenRouter/LiteLLM katalog kimliklerine eşlemek için kullanın. |
| `modelIdNormalization`               | Hayır    | `object`                         | Sağlayıcı runtime'ı yüklenmeden önce çalışması gereken, sağlayıcının sahip olduğu model kimliği takma ad/önek temizliği.                                                                                                            |
| `providerEndpoints`                  | Hayır    | `object[]`                       | Sağlayıcı runtime'ı yüklenmeden önce çekirdeğin sınıflandırması gereken sağlayıcı rotaları için manifestin sahip olduğu uç nokta host/baseUrl meta verileri.                                                                         |
| `providerRequest`                    | Hayır    | `object`                         | Sağlayıcı runtime'ı yüklenmeden önce genel istek ilkesi tarafından kullanılan ucuz sağlayıcı ailesi ve istek uyumluluğu meta verileri.                                                                                              |
| `cliBackends`                        | Hayır    | `string[]`                       | Bu Plugin'in sahip olduğu CLI çıkarım arka uç kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                                                     |
| `syntheticAuthRefs`                  | Hayır    | `string[]`                       | Runtime yüklenmeden önce soğuk model keşfi sırasında Plugin'in sahip olduğu sentetik auth hook'unun yoklanması gereken sağlayıcı veya CLI arka uç başvuruları.                                                                      |
| `nonSecretAuthMarkers`               | Hayır    | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketlenmiş Plugin'in sahip olduğu yer tutucu API anahtarı değerleri.                                                                                    |
| `commandAliases`                     | Hayır    | `object[]`                       | Runtime yüklenmeden önce Plugin farkındalıklı yapılandırma ve CLI tanılamaları üretmesi gereken, bu Plugin'in sahip olduğu komut adları.                                                                                            |
| `providerAuthEnvVars`                | Hayır    | `Record<string, string[]>`       | Sağlayıcı auth/durum araması için kullanımdan kaldırılmış uyumluluk env meta verileri. Yeni Plugin'ler için `setup.providers[].envVars` tercih edin; OpenClaw bunu kullanımdan kaldırma penceresi sırasında hâlâ okur.             |
| `providerAuthAliases`                | Hayır    | `Record<string, string>`         | Auth araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve auth profillerini paylaşan bir kodlama sağlayıcısı.                                     |
| `channelEnvVars`                     | Hayır    | `Record<string, string[]>`       | OpenClaw'ın Plugin kodunu yüklemeden inceleyebileceği ucuz kanal env meta verileri. Genel başlangıç/yapılandırma yardımcılarının görmesi gereken env güdümlü kanal kurulumu veya auth yüzeyleri için bunu kullanın.                |
| `providerAuthChoices`                | Hayır    | `object[]`                       | Onboarding seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlama için ucuz auth seçimi meta verileri.                                                                                                       |
| `activation`                         | Hayır    | `object`                         | Başlangıç, sağlayıcı, komut, kanal, rota ve yetenek tetiklemeli yükleme için ucuz etkinleştirme planlayıcısı meta verileri. Yalnızca meta veri; gerçek davranış hâlâ Plugin runtime'ına aittir.                                    |
| `setup`                              | Hayır    | `object`                         | Keşif ve kurulum yüzeylerinin Plugin runtime'ını yüklemeden inceleyebileceği ucuz kurulum/onboarding tanımlayıcıları.                                                                                                               |
| `qaRunners`                          | Hayır    | `object[]`                       | Plugin runtime'ı yüklenmeden önce paylaşılan `openclaw qa` host'u tarafından kullanılan ucuz QA çalıştırıcı tanımlayıcıları.                                                                                                       |
| `contracts`                          | Hayır    | `object`                         | Harici auth hook'ları, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, image-generation, music-generation, video-generation, web-fetch, web arama ve araç sahipliği için statik yetenek sahipliği anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır    | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için ucuz medya anlama varsayılanları.                                                                                                              |
| `imageGenerationProviderMetadata`    | Hayır    | `Record<string, object>`         | `contracts.imageGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için, sağlayıcının sahip olduğu auth takma adları ve base-url korumaları dahil ucuz image-generation auth meta verileri.                               |
| `videoGenerationProviderMetadata`    | Hayır    | `Record<string, object>`         | `contracts.videoGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için, sağlayıcının sahip olduğu auth takma adları ve base-url korumaları dahil ucuz video-generation auth meta verileri.                               |
| `musicGenerationProviderMetadata`    | Hayır    | `Record<string, object>`         | `contracts.musicGenerationProviders` içinde bildirilen sağlayıcı kimlikleri için, sağlayıcının sahip olduğu auth takma adları ve base-url korumaları dahil ucuz music-generation auth meta verileri.                               |
| `toolMetadata`                       | Hayır    | `Record<string, object>`         | `contracts.tools` içinde bildirilen, Plugin'in sahip olduğu araçlar için ucuz kullanılabilirlik meta verileri. Bir araç yapılandırma, env veya auth kanıtı olmadıkça runtime'ı yüklememeliyse bunu kullanın.                       |
| `channelConfigs`                     | Hayır    | `Record<string, object>`         | Runtime yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, manifestin sahip olduğu kanal yapılandırma meta verileri.                                                                                                   |
| `skills`                             | Hayır    | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skill dizinleri.                                                                                                                                                                        |
| `name`                               | Hayır    | `string`                         | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                                             |
| `description`                        | Hayır    | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                          |
| `version`                            | Hayır    | `string`                         | Bilgi amaçlı Plugin sürümü.                                                                                                                                                                                                         |
| `uiHints`                            | Hayır    | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                     |

## Oluşturma sağlayıcısı meta verileri başvurusu

Oluşturma sağlayıcısı meta verileri alanları, eşleşen `contracts.*GenerationProviders` listesinde bildirilen
sağlayıcılar için statik kimlik doğrulama sinyallerini açıklar.
OpenClaw, bu alanları sağlayıcı çalışma zamanı yüklenmeden önce okur; böylece çekirdek araçlar,
her sağlayıcı Plugin'ini içe aktarmadan bir oluşturma sağlayıcısının kullanılabilir olup olmadığına
karar verebilir.

Bu alanları yalnızca ucuz, bildirime dayalı olgular için kullanın. Aktarım, istek
dönüşümleri, token yenileme, kimlik bilgisi doğrulama ve gerçek oluşturma davranışı
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

Her meta veri girdisi şunları destekler:

| Alan            | Gerekli | Tür        | Ne anlama gelir                                                                                                                             |
| --------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Hayır   | `string[]` | Oluşturma sağlayıcısı için statik kimlik doğrulama takma adları olarak sayılması gereken ek sağlayıcı kimlikleri.                           |
| `authProviders` | Hayır   | `string[]` | Yapılandırılmış kimlik doğrulama profilleri bu oluşturma sağlayıcısı için kimlik doğrulama olarak sayılması gereken sağlayıcı kimlikleri.    |
| `configSignals` | Hayır   | `object[]` | Kimlik doğrulama profilleri veya env var'lar olmadan yapılandırılabilen yerel ya da kendi barındırmalı sağlayıcılar için ucuz yapılandırma sinyalleri. |
| `authSignals`   | Hayır   | `object[]` | Açık kimlik doğrulama sinyalleri. Varsa, sağlayıcı kimliğinden, `aliases` ve `authProviders` değerlerinden gelen varsayılan sinyal kümesinin yerini alır. |

Her `configSignals` girdisi şunları destekler:

| Alan          | Gerekli | Tür        | Ne anlama gelir                                                                                                                                                                       |
| ------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Evet    | `string`   | İncelenecek Plugin'e ait yapılandırma nesnesine noktalı yol, örneğin `plugins.entries.example.config`.                                                                                |
| `overlayPath` | Hayır   | `string`   | Sinyal değerlendirilmeden önce nesnesi kök nesnenin üzerine uygulanacak kök yapılandırma içindeki noktalı yol. Bunu `image`, `video` veya `music` gibi yeteneğe özel yapılandırma için kullanın. |
| `required`    | Hayır   | `string[]` | Etkin yapılandırma içinde yapılandırılmış değerleri olması gereken noktalı yollar. Dizeler boş olmamalıdır; nesneler ve diziler boş olmamalıdır.                                      |
| `requiredAny` | Hayır   | `string[]` | Etkin yapılandırma içinde en az birinin yapılandırılmış değeri olması gereken noktalı yollar.                                                                                         |
| `mode`        | Hayır   | `object`   | Etkin yapılandırma içinde isteğe bağlı dize modu koruması. Bunu yalnızca yapılandırma tabanlı kullanılabilirlik tek bir moda uygulandığında kullanın.                                 |

Her `mode` koruması şunları destekler:

| Alan         | Gerekli | Tür        | Ne anlama gelir                                                                 |
| ------------ | ------- | ---------- | ------------------------------------------------------------------------------- |
| `path`       | Hayır   | `string`   | Etkin yapılandırma içindeki noktalı yol. Varsayılan değer `mode` olur.          |
| `default`    | Hayır   | `string`   | Yapılandırma yolu atladığında kullanılacak mod değeri.                          |
| `allowed`    | Hayır   | `string[]` | Varsa, sinyal yalnızca etkin mod bu değerlerden biri olduğunda geçer.           |
| `disallowed` | Hayır   | `string[]` | Varsa, etkin mod bu değerlerden biri olduğunda sinyal başarısız olur.           |

Her `authSignals` girdisi şunları destekler:

| Alan              | Gerekli | Tür      | Ne anlama gelir                                                                                                                                                        |
| ----------------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet    | `string` | Yapılandırılmış kimlik doğrulama profillerinde denetlenecek sağlayıcı kimliği.                                                                                         |
| `providerBaseUrl` | Hayır   | `object` | Sinyalin yalnızca başvurulan yapılandırılmış sağlayıcı izin verilen bir temel URL kullandığında sayılmasını sağlayan isteğe bağlı koruma. Bunu bir kimlik doğrulama takma adı yalnızca belirli API'ler için geçerli olduğunda kullanın. |

Her `providerBaseUrl` koruması şunları destekler:

| Alan              | Gerekli | Tür        | Ne anlama gelir                                                                                                                                             |
| ----------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Evet    | `string`   | `baseUrl` değeri denetlenecek sağlayıcı yapılandırma kimliği.                                                                                                |
| `defaultBaseUrl`  | Hayır   | `string`   | Sağlayıcı yapılandırması `baseUrl` değerini atladığında varsayılacak temel URL.                                                                              |
| `allowedBaseUrls` | Evet    | `string[]` | Bu kimlik doğrulama sinyali için izin verilen temel URL'ler. Yapılandırılmış veya varsayılan temel URL bu normalleştirilmiş değerlerden biriyle eşleşmediğinde sinyal yok sayılır. |

## Araç meta verileri başvurusu

`toolMetadata`, araç adına göre anahtarlanmış olarak oluşturma sağlayıcısı meta verileriyle
aynı `configSignals` ve `authSignals` şekillerini kullanır. `contracts.tools` sahipliği
bildirir. `toolMetadata`, OpenClaw'ın yalnızca araç fabrikasının `null` döndürmesini sağlamak için
bir Plugin çalışma zamanını içe aktarmasını önleyebilmesi amacıyla ucuz kullanılabilirlik kanıtı
bildirir.

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

Bir aracın `toolMetadata` değeri yoksa, OpenClaw mevcut davranışı korur ve
araç sözleşmesi politikayla eşleştiğinde sahip olan Plugin'i yükler. Fabrikası
kimlik doğrulamaya/yapılandırmaya bağlı olan sıcak yol araçları için Plugin yazarları,
çekirdeğin sormak için çalışma zamanını içe aktarmasını sağlamak yerine
`toolMetadata` bildirmelidir.

## providerAuthChoices başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçeneğini açıklar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.
Sağlayıcı kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden bu manifest seçeneklerini,
tanımlayıcıdan türetilmiş kurulum seçeneklerini ve kurulum kataloğu meta verilerini kullanır.

| Alan                  | Gerekli | Tür                                             | Ne anlama gelir                                                                                               |
| --------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                        | Bu seçeneğin ait olduğu sağlayıcı kimliği.                                                                    |
| `method`              | Evet    | `string`                                        | Dağıtılacak kimlik doğrulama yöntemi kimliği.                                                                 |
| `choiceId`            | Evet    | `string`                                        | Onboarding ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçeneği kimliği.                   |
| `choiceLabel`         | Hayır   | `string`                                        | Kullanıcıya gösterilen etiket. Atlanırsa, OpenClaw `choiceId` değerine geri döner.                            |
| `choiceHint`          | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                              |
| `assistantPriority`   | Hayır   | `number`                                        | Daha düşük değerler, asistan tarafından yönlendirilen etkileşimli seçicilerde daha önce sıralanır.            |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                  | Manuel CLI seçimine hâlâ izin verirken seçeneği asistan seçicilerinden gizler.                                |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                      | Kullanıcıları bu yedek seçeneğe yönlendirmesi gereken eski seçenek kimlikleri.                                |
| `groupId`             | Hayır   | `string`                                        | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                                  |
| `groupLabel`          | Hayır   | `string`                                        | Bu grup için kullanıcıya gösterilen etiket.                                                                   |
| `groupHint`           | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                                |
| `optionKey`           | Hayır   | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için dahili seçenek anahtarı.                                    |
| `cliFlag`             | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                                   |
| `cliOption`           | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek şekli.                                                      |
| `cliDescription`      | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                           |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçeneğin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa, varsayılan olarak `["text-inference"]` olur. |

## commandAliases başvurusu

`commandAliases` öğesini, bir Plugin kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahip olduğunda kullanın. OpenClaw bu meta veriyi, Plugin çalışma zamanı kodunu içe aktarmadan tanılama için kullanır.

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

| Alan         | Gerekli | Tür               | Anlamı                                                                  |
| ------------ | ------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu Plugin'e ait komut adı.                                              |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök CLI komutu yerine sohbet eğik çizgi komutu olarak işaretler. |
| `cliCommand` | Hayır   | `string`          | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.              |

## activation başvurusu

Plugin, hangi denetim düzlemi olaylarının onu bir etkinleştirme/yükleme planına dahil etmesi gerektiğini düşük maliyetle bildirebildiğinde `activation` kullanın.

Bu blok, yaşam döngüsü API'si değil, planlayıcı meta verisidir. Çalışma zamanı davranışı kaydetmez, `register(...)` öğesinin yerine geçmez ve Plugin kodunun zaten yürütüldüğünü vaat etmez. Etkinleştirme planlayıcısı, mevcut manifest sahipliği meta verilerine geri dönmeden önce aday Plugin'leri daraltmak için bu alanları kullanır; örneğin `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve hook'lar.

Sahipliği zaten açıklayan en dar meta veriyi tercih edin. İlişkiyi bu alanlar ifade ettiğinde `providers`, `channels`, `commandAliases`, kurulum tanımlayıcıları veya `contracts` kullanın. Bu sahiplik alanlarıyla temsil edilemeyen ek planlayıcı ipuçları için `activation` kullanın.
`claude-cli`, `codex-cli` veya `google-gemini-cli` gibi CLI çalışma zamanı takma adları için üst düzey `cliBackends` kullanın; `activation.onAgentHarnesses` yalnızca halihazırda bir sahiplik alanı bulunmayan gömülü ajan harness kimlikleri içindir.

Bu blok yalnızca meta veridir. Çalışma zamanı davranışı kaydetmez ve `register(...)`, `setupEntry` veya diğer çalışma zamanı/Plugin giriş noktalarının yerine geçmez. Mevcut tüketiciler bunu daha geniş Plugin yüklemesinden önce bir daraltma ipucu olarak kullanır; bu nedenle başlangıç dışı etkinleştirme meta verisinin eksik olması genellikle yalnızca performans maliyeti doğurur; manifest sahipliği geri dönüşleri hâlâ mevcutken doğruluğu değiştirmemelidir.

Her Plugin `activation.onStartup` değerini bilinçli olarak ayarlamalıdır. Yalnızca Plugin Gateway başlangıcı sırasında çalışmak zorundaysa `true` olarak ayarlayın. Plugin başlangıçta etkisizse ve yalnızca daha dar tetikleyicilerden yüklenmeliyse `false` olarak ayarlayın. `onStartup` öğesinin atlanması artık Plugin'i örtük olarak başlangıçta yüklemez; başlangıç, kanal, yapılandırma, ajan harness'i, bellek veya diğer daha dar etkinleştirme tetikleyicileri için açık etkinleştirme meta verisi kullanın.

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

| Alan               | Gerekli | Tür                                                  | Anlamı                                                                                                                                                                                          |
| ------------------ | ------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Hayır   | `boolean`                                            | Açık Gateway başlangıç etkinleştirmesi. Her Plugin bunu ayarlamalıdır. `true`, Plugin'i başlangıç sırasında içe aktarır; `false`, eşleşen başka bir tetikleyici yükleme gerektirmedikçe başlangıçta tembel bırakır. |
| `onProviders`      | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                                                                                                         |
| `onAgentHarnesses` | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken gömülü ajan harness çalışma zamanı kimlikleri. CLI backend takma adları için üst düzey `cliBackends` kullanın.                |
| `onCommands`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                                                                                                             |
| `onChannels`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                                                                                                             |
| `onRoutes`         | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                                                                                                                 |
| `onConfigPaths`    | Hayır   | `string[]`                                           | Yol mevcut olduğunda ve açıkça devre dışı bırakılmadığında bu Plugin'i başlangıç/yükleme planlarına dahil etmesi gereken köke göre yapılandırma yolları.                                       |
| `onCapabilities`   | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Denetim düzlemi etkinleştirme planlaması tarafından kullanılan geniş yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin.                                                          |

Mevcut canlı tüketiciler:

- Gateway başlangıç planlaması, açık başlangıç içe aktarması için `activation.onStartup` kullanır
- komutla tetiklenen CLI planlaması, eski `commandAliases[].cliCommand` veya `commandAliases[].name` öğesine geri döner
- ajan çalışma zamanı başlangıç planlaması, gömülü harness'ler için `activation.onAgentHarnesses` ve CLI çalışma zamanı takma adları için üst düzey `cliBackends[]` kullanır
- kanalla tetiklenen kurulum/kanal planlaması, açık kanal etkinleştirme meta verisi eksik olduğunda eski `channels[]` sahipliğine geri döner
- başlangıç Plugin planlaması, paketlenmiş tarayıcı Plugin'inin `browser` bloğu gibi kanal dışı kök yapılandırma yüzeyleri için `activation.onConfigPaths` kullanır
- sağlayıcıyla tetiklenen kurulum/çalışma zamanı planlaması, açık sağlayıcı etkinleştirme meta verisi eksik olduğunda eski `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

Planlayıcı tanılamaları, açık etkinleştirme ipuçlarını manifest sahipliği geri dönüşünden ayırt edebilir. Örneğin, `activation-command-hint`, `activation.onCommands` eşleştiği anlamına gelirken `manifest-command-alias`, planlayıcının bunun yerine `commandAliases` sahipliğini kullandığı anlamına gelir. Bu neden etiketleri ana makine tanılamaları ve testler içindir; Plugin yazarları, sahipliği en iyi açıklayan meta veriyi bildirmeye devam etmelidir.

## qaRunners başvurusu

Bir Plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma çalıştırıcısı sağladığında `qaRunners` kullanın. Bu meta veriyi düşük maliyetli ve statik tutun; Plugin çalışma zamanı, `qaRunnerCliRegistrations` dışa aktaran hafif bir `runtime-api.ts` yüzeyi üzerinden gerçek CLI kaydına hâlâ sahip olur.

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

| Alan          | Gerekli | Tür      | Anlamı                                                               |
| ------------- | ------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altına bağlanan alt komut, örneğin `matrix`.           |
| `description` | Hayır   | `string` | Paylaşılan ana makine bir stub komuta ihtiyaç duyduğunda kullanılan yedek yardım metni. |

## setup başvurusu

Kurulum ve onboarding yüzeyleri çalışma zamanı yüklenmeden önce düşük maliyetli, Plugin'e ait meta veriye ihtiyaç duyduğunda `setup` kullanın.

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

Üst düzey `cliBackends` geçerli kalır ve CLI çıkarım backend'lerini açıklamaya devam eder. `setup.cliBackends`, yalnızca meta veri olarak kalması gereken denetim düzlemi/kurulum akışları için kuruluma özgü tanımlayıcı yüzeyidir.

Mevcut olduğunda, `setup.providers` ve `setup.cliBackends` kurulum keşfi için tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday Plugin'i daraltıyor ve kurulum hâlâ daha zengin kurulum zamanı çalışma zamanı hook'larına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak `setup-api` öğesini yerinde tutun.

OpenClaw ayrıca genel sağlayıcı kimlik doğrulama ve env-var aramalarında `setup.providers[].envVars` öğesini içerir. `providerAuthEnvVars`, kullanımdan kaldırma dönemi boyunca bir uyumluluk adaptörü üzerinden desteklenmeye devam eder, ancak bunu hâlâ kullanan paketlenmemiş Plugin'ler bir manifest tanılaması alır. Yeni Plugin'ler kurulum/durum env meta verisini `setup.providers[].envVars` üzerine koymalıdır.

OpenClaw, kurulum girişi olmadığında veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildirdiğinde `setup.providers[].authMethods` öğesinden basit kurulum seçenekleri de türetebilir. Özel etiketler, CLI bayrakları, onboarding kapsamı ve asistan meta verisi için açık `providerAuthChoices` girişleri tercih edilmeye devam eder.

`requiresRuntime: false` değerini yalnızca bu tanımlayıcılar kurulum yüzeyi için yeterli olduğunda ayarlayın. OpenClaw, açık `false` değerini yalnızca tanımlayıcıya dayalı bir sözleşme olarak değerlendirir ve kurulum araması için `setup-api` veya `openclaw.setupEntry` yürütmez. Yalnızca tanımlayıcıya dayalı bir Plugin bu kurulum çalışma zamanı girişlerinden birini hâlâ gönderiyorsa, OpenClaw eklemeli bir tanılama bildirir ve onu yok saymaya devam eder. Atlanan `requiresRuntime`, tanımlayıcıları bayrak olmadan ekleyen mevcut Plugin'lerin bozulmaması için eski geri dönüş davranışını korur.

Kurulum araması Plugin'e ait `setup-api` kodunu yürütebildiğinden, normalleştirilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen Plugin'ler arasında benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine kapalı şekilde başarısız olur.

Kurulum çalışma zamanı yürütüldüğünde, `setup-api` manifest tanımlayıcılarının bildirmediği bir sağlayıcı veya CLI backend'i kaydederse ya da bir tanımlayıcının eşleşen çalışma zamanı kaydı yoksa kurulum kayıt defteri tanılamaları tanımlayıcı sapmasını bildirir. Bu tanılamalar eklemelidir ve eski Plugin'leri reddetmez.

### setup.providers başvurusu

| Alan           | Gerekli | Tür        | Anlamı                                                                                                    |
| -------------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `id`           | Evet    | `string`   | Kurulum veya onboarding sırasında sunulan sağlayıcı kimliği. Normalleştirilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods`  | Hayır   | `string[]` | Bu sağlayıcının tam çalışma zamanını yüklemeden desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`      | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden önce denetleyebileceği env var'lar.    |
| `authEvidence` | Hayır   | `object[]` | Gizli olmayan işaretçiler üzerinden kimlik doğrulaması yapabilen sağlayıcılar için düşük maliyetli yerel kimlik doğrulama kanıtı denetimleri. |

`authEvidence`, çalışma zamanı kodunu yüklemeden doğrulanabilen, sağlayıcıya ait yerel kimlik bilgisi işaretleyicileri içindir. Bu kontroller ucuz ve yerel kalmalıdır: ağ çağrısı yok, anahtarlık veya gizli bilgi yöneticisi okuması yok, kabuk komutu yok ve sağlayıcı API yoklaması yok.

Desteklenen kanıt girdileri:

| Alan               | Zorunlu | Tür        | Anlamı                                                                                                           |
| ------------------ | ------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `type`             | Evet    | `string`   | Şu anda `local-file-with-env`.                                                                                   |
| `fileEnvVar`       | Hayır   | `string`   | Açık bir kimlik bilgisi dosya yolunu içeren ortam değişkeni.                                                     |
| `fallbackPaths`    | Hayır   | `string[]` | `fileEnvVar` yoksa veya boşsa kontrol edilen yerel kimlik bilgisi dosya yolları. `${HOME}` ve `${APPDATA}` desteklenir. |
| `requiresAnyEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen ortam değişkenlerinden en az biri boş olmamalıdır.                         |
| `requiresAllEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen her ortam değişkeni boş olmamalıdır.                                       |
| `credentialMarker` | Evet    | `string`   | Kanıt mevcut olduğunda döndürülen gizli olmayan işaretleyici.                                                    |
| `source`           | Hayır   | `string`   | Kimlik doğrulama/durum çıktısı için kullanıcıya dönük kaynak etiketi.                                            |

### setup alanları

| Alan               | Zorunlu | Tür        | Anlamı                                                                                              |
| ------------------ | ------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve ilk kullanım sırasında gösterilen sağlayıcı kurulum tanımlayıcıları.                     |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kullanılan kurulum zamanı arka uç kimlikleri. Normalleştirilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin'in kurulum yüzeyinin sahip olduğu yapılandırma geçiş kimlikleri.                          |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.       |

## uiHints başvurusu

`uiHints`, yapılandırma alan adlarından küçük işleme ipuçlarına giden bir eşlemedir.

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

| Alan          | Tür        | Anlamı                                   |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Kullanıcıya dönük alan etiketi.          |
| `help`        | `string`   | Kısa yardımcı metin.                     |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.              |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.         |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girişleri için yer tutucu metin.    |

## contracts başvurusu

`contracts` öğesini yalnızca OpenClaw'ın Plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği meta verileri için kullanın.

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

| Alan                             | Tür        | Anlamı                                                               |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex uygulama sunucusu uzantı fabrika kimlikleri, şu anda `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Paketlenmiş bir Plugin'in araç sonucu ara yazılımı kaydedebileceği çalışma zamanı kimlikleri. |
| `externalAuthProviders`          | `string[]` | Bu Plugin'in sahip olduğu harici kimlik doğrulama profili kancası sağlayıcı kimlikleri. |
| `speechProviders`                | `string[]` | Bu Plugin'in sahip olduğu konuşma sağlayıcı kimlikleri.              |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı transkripsiyon sağlayıcı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı ses sağlayıcı kimlikleri.   |
| `memoryEmbeddingProviders`       | `string[]` | Bu Plugin'in sahip olduğu bellek gömme sağlayıcı kimlikleri.         |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin'in sahip olduğu medya anlama sağlayıcı kimlikleri.         |
| `imageGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu görüntü üretme sağlayıcı kimlikleri.       |
| `videoGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu video üretme sağlayıcı kimlikleri.         |
| `webFetchProviders`              | `string[]` | Bu Plugin'in sahip olduğu web getirme sağlayıcı kimlikleri.          |
| `webSearchProviders`             | `string[]` | Bu Plugin'in sahip olduğu web arama sağlayıcı kimlikleri.            |
| `migrationProviders`             | `string[]` | Bu Plugin'in `openclaw migrate` için sahip olduğu içe aktarma sağlayıcı kimlikleri. |
| `tools`                          | `string[]` | Bu Plugin'in sahip olduğu aracı araç adları.                         |

`contracts.embeddedExtensionFactories`, paketlenmiş Codex yalnızca uygulama sunucusu uzantı fabrikaları için tutulur. Paketlenmiş araç sonucu dönüşümleri bunun yerine `contracts.agentToolResultMiddleware` bildirmeli ve `api.registerAgentToolResultMiddleware(...)` ile kaydolmalıdır. Harici Plugin'ler araç sonucu ara yazılımı kaydedemez, çünkü bu bağlantı noktası model görmeden önce yüksek güvenilirlikli araç çıktısını yeniden yazabilir.

Çalışma zamanı `api.registerTool(...)` kayıtları `contracts.tools` ile eşleşmelidir. Araç keşfi, istenen araçların sahibi olabilecek yalnızca Plugin çalışma zamanlarını yüklemek için bu listeyi kullanır.

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'leri `contracts.externalAuthProviders` bildirmelidir. Bildirimi olmayan Plugin'ler hâlâ kullanımdan kaldırılmış bir uyumluluk geri dönüş yolundan geçer, ancak bu geri dönüş daha yavaştır ve geçiş penceresinden sonra kaldırılacaktır.

Paketlenmiş bellek gömme sağlayıcıları, `local` gibi yerleşik adaptörler dahil, sundukları her adaptör kimliği için `contracts.memoryEmbeddingProviders` bildirmelidir. Bağımsız CLI yolları, tam Gateway çalışma zamanı sağlayıcıları kaydetmeden önce yalnızca sahibi olan Plugin'i yüklemek için bu manifest sözleşmesini kullanır.

## mediaUnderstandingProviderMetadata başvurusu

Bir medya anlama sağlayıcısında varsayılan modeller, otomatik kimlik doğrulama geri dönüş önceliği veya genel çekirdek yardımcılarının çalışma zamanı yüklenmeden önce ihtiyaç duyduğu yerel belge desteği varsa `mediaUnderstandingProviderMetadata` kullanın. Anahtarlar ayrıca `contracts.mediaUnderstandingProviders` içinde bildirilmelidir.

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

| Alan                   | Tür                                 | Anlamı                                                                       |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Bu sağlayıcının sunduğu medya yetenekleri.                                   |
| `defaultModels`        | `Record<string, string>`            | Yapılandırma bir model belirtmediğinde kullanılan yetenekten modele varsayılanları. |
| `autoPriority`         | `Record<string, number>`            | Otomatik kimlik bilgisi tabanlı sağlayıcı geri dönüşü için daha düşük sayılar daha önce sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Sağlayıcı tarafından desteklenen yerel belge girdileri.                      |

## channelConfigs başvurusu

Bir kanal Plugin'i çalışma zamanı yüklenmeden önce ucuz yapılandırma meta verilerine ihtiyaç duyduğunda `channelConfigs` kullanın. Salt okunur kanal kurulum/durum keşfi, kurulum girdisi yoksa veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildiriyorsa yapılandırılmış harici kanallar için bu meta verileri doğrudan kullanabilir.

`channelConfigs`, yeni bir üst düzey kullanıcı yapılandırma bölümü değil, Plugin manifest meta verisidir. Kullanıcılar kanal örneklerini hâlâ `channels.<channel-id>` altında yapılandırır. OpenClaw, Plugin çalışma zamanı kodu yürütülmeden önce yapılandırılmış kanalın hangi Plugin'e ait olduğuna karar vermek için manifest meta verilerini okur.

Bir kanal Plugin'i için `configSchema` ve `channelConfigs` farklı yolları tanımlar:

- `configSchema`, `plugins.entries.<plugin-id>.config` öğesini doğrular
- `channelConfigs.<channel-id>.schema`, `channels.<channel-id>` öğesini doğrular

`channels[]` bildiren paketlenmemiş Plugin'ler aynı zamanda eşleşen `channelConfigs` girdileri de bildirmelidir. Bunlar olmadan OpenClaw Plugin'i yine de yükleyebilir, ancak soğuk yol yapılandırma şeması, kurulum ve Control UI yüzeyleri, Plugin çalışma zamanı yürütülene kadar kanala ait seçenek şeklini bilemez.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` ve `nativeSkillsAutoEnabled`, kanal çalışma zamanı yüklenmeden önce çalışan komut yapılandırma kontrolleri için statik `auto` varsayılanlarını bildirebilir. Paketlenmiş kanallar, diğer paket sahipli kanal katalog meta verilerinin yanında aynı varsayılanları `package.json#openclaw.channel.commands` üzerinden de yayımlayabilir.

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
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Schema. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucuları/hassas ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                  |
| `commands`    | `object`                 | Çalışma zamanı öncesi yapılandırma kontrolleri için statik yerel komut ve yerel skill otomatik varsayılanları. |
| `preferOver`  | `string[]`               | Bu kanalın seçim yüzeylerinde önüne geçmesi gereken eski veya daha düşük öncelikli plugin kimlikleri. |

### Başka bir kanal plugin'ini değiştirme

Plugin'iniz, başka bir plugin'in de sağlayabildiği bir kanal kimliği için tercih edilen
sahip olduğunda `preferOver` kullanın. Yaygın durumlar, yeniden adlandırılmış bir plugin kimliği,
paketlenmiş bir plugin'in yerini alan bağımsız bir plugin veya yapılandırma uyumluluğu için
aynı kanal kimliğini koruyan bakımı sürdürülen bir fork'tur.

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

`channels.chat` yapılandırıldığında, OpenClaw hem kanal kimliğini hem de
tercih edilen plugin kimliğini dikkate alır. Daha düşük öncelikli plugin yalnızca
paketlenmiş olduğu veya varsayılan olarak etkin olduğu için seçildiyse, OpenClaw bunu etkili
çalışma zamanı yapılandırmasında devre dışı bırakır; böylece kanalın ve araçlarının sahibi tek bir plugin olur.
Açık kullanıcı seçimi yine de üstün gelir: Kullanıcı her iki plugin'i de açıkça etkinleştirirse,
OpenClaw bu seçimi korur ve istenen plugin kümesini sessizce değiştirmek yerine
yinelenen kanal/araç tanıları bildirir.

`preferOver` değerini gerçekten aynı kanalı sağlayabilen plugin kimlikleriyle sınırlı tutun.
Bu genel bir öncelik alanı değildir ve kullanıcı yapılandırma anahtarlarını yeniden adlandırmaz.

## modelSupport başvurusu

OpenClaw'ın, plugin çalışma zamanı yüklenmeden önce `gpt-5.5` veya
`claude-sonnet-4.6` gibi kısaltma model kimliklerinden sağlayıcı plugin'inizi çıkarsaması
gerektiğinde `modelSupport` kullanın.

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
- `modelPatterns`, `modelPrefixes` değerlerinden önce gelir
- paketlenmemiş bir plugin ve paketlenmiş bir plugin eşleşirse, paketlenmemiş
  plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Ne anlama gelir                                                                |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Kısaltma model kimliklerine karşı `startsWith` ile eşleştirilen önekler.        |
| `modelPatterns` | `string[]` | Profil soneki kaldırıldıktan sonra kısaltma model kimliklerine karşı eşleştirilen regex kaynakları. |

## modelCatalog başvurusu

OpenClaw'ın, plugin çalışma zamanını yüklemeden önce sağlayıcı model meta verilerini bilmesi
gerektiğinde `modelCatalog` kullanın. Bu, sabit katalog satırları, sağlayıcı takma adları,
bastırma kuralları ve keşif modu için manifest'e ait kaynaktır. Çalışma zamanı yenilemesi
yine sağlayıcı çalışma zamanı koduna aittir, ancak manifest çekirdeğe çalışma zamanının ne zaman
gerekli olduğunu söyler.

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

| Alan           | Tür                                                      | Ne anlama gelir                                                                                            |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Bu plugin'in sahip olduğu sağlayıcı kimlikleri için katalog satırları. Anahtarlar üst düzey `providers` içinde de görünmelidir. |
| `aliases`      | `Record<string, object>`                                 | Katalog veya bastırma planlaması için sahip olunan bir sağlayıcıya çözülmesi gereken sağlayıcı takma adları. |
| `suppressions` | `object[]`                                               | Başka bir kaynaktan gelen ve bu plugin'in sağlayıcıya özgü bir nedenle bastırdığı model satırları.          |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Sağlayıcı kataloğunun manifest meta verilerinden okunup okunamayacağı, önbelleğe yenilenip yenilenemeyeceği veya çalışma zamanı gerektirip gerektirmediği. |

`aliases`, model kataloğu planlaması için sağlayıcı sahipliği aramasına katılır.
Takma ad hedefleri, aynı plugin'in sahip olduğu üst düzey sağlayıcılar olmalıdır. Sağlayıcıya göre
filtrelenmiş bir liste takma ad kullandığında, OpenClaw sağlayıcı çalışma zamanını yüklemeden
sahip manifest'i okuyabilir ve takma ad API/temel URL geçersiz kılmalarını uygulayabilir.
Takma adlar filtrelenmemiş katalog listelerini genişletmez; geniş listeler yalnızca sahibi olan
kanonik sağlayıcı satırlarını yayar.

`suppressions`, eski sağlayıcı çalışma zamanı `suppressBuiltInModel` hook'unun yerini alır.
Bastırma girdileri yalnızca sağlayıcı plugin'e ait olduğunda veya sahip olunan bir sağlayıcıyı
hedefleyen bir `modelCatalog.aliases` anahtarı olarak bildirildiğinde dikkate alınır. Çalışma zamanı
bastırma hook'ları artık model çözümlemesi sırasında çağrılmaz.

Sağlayıcı alanları:

| Alan      | Tür                      | Ne anlama gelir                                                  |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| `baseUrl` | `string`                 | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan temel URL. |
| `api`     | `ModelApi`               | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan API adaptörü. |
| `headers` | `Record<string, string>` | Bu sağlayıcı kataloğuna uygulanan isteğe bağlı statik başlıklar. |
| `models`  | `object[]`               | Gerekli model satırları. `id` olmayan satırlar yok sayılır.      |

Model alanları:

| Alan            | Tür                                                            | Ne anlama gelir                                                               |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` öneki olmadan, sağlayıcıya yerel model kimliği.                   |
| `name`          | `string`                                                       | İsteğe bağlı görünen ad.                                                      |
| `api`           | `ModelApi`                                                     | İsteğe bağlı modele özel API geçersiz kılması.                                |
| `baseUrl`       | `string`                                                       | İsteğe bağlı modele özel temel URL geçersiz kılması.                          |
| `headers`       | `Record<string, string>`                                       | İsteğe bağlı modele özel statik başlıklar.                                    |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modelin kabul ettiği modaliteler.                                             |
| `reasoning`     | `boolean`                                                      | Modelin reasoning davranışı sunup sunmadığı.                                  |
| `contextWindow` | `number`                                                       | Yerel sağlayıcı bağlam penceresi.                                             |
| `contextTokens` | `number`                                                       | `contextWindow` değerinden farklı olduğunda isteğe bağlı etkili çalışma zamanı bağlam sınırı. |
| `maxTokens`     | `number`                                                       | Bilindiğinde maksimum çıktı token sayısı.                                     |
| `cost`          | `object`                                                       | İsteğe bağlı `tieredPricing` dahil, milyon token başına isteğe bağlı USD fiyatlandırması. |
| `compat`        | `object`                                                       | OpenClaw model yapılandırma uyumluluğuyla eşleşen isteğe bağlı uyumluluk bayrakları. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listeleme durumu. Yalnızca satır hiç görünmemesi gerektiğinde bastırın.       |
| `statusReason`  | `string`                                                       | Kullanılamayan durumla birlikte gösterilen isteğe bağlı neden.                |
| `replaces`      | `string[]`                                                     | Bu modelin yerini aldığı daha eski sağlayıcıya yerel model kimlikleri.        |
| `replacedBy`    | `string`                                                       | Kullanımdan kaldırılmış satırlar için yerine geçen sağlayıcıya yerel model kimliği. |
| `tags`          | `string[]`                                                     | Seçiciler ve filtreler tarafından kullanılan kararlı etiketler.               |

Bastırma alanları:

| Alan                       | Tür        | Ne anlama gelir                                                                                          |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Bastırılacak yukarı akış satırı için sağlayıcı kimliği. Bu plugin'e ait olmalı veya sahip olunan bir takma ad olarak bildirilmelidir. |
| `model`                    | `string`   | Bastırılacak sağlayıcıya yerel model kimliği.                                                            |
| `reason`                   | `string`   | Bastırılan satır doğrudan istendiğinde gösterilen isteğe bağlı ileti.                                     |
| `when.baseUrlHosts`        | `string[]` | Bastırma uygulanmadan önce gerekli olan etkili sağlayıcı temel URL hostlarının isteğe bağlı listesi.      |
| `when.providerConfigApiIn` | `string[]` | Bastırma uygulanmadan önce gerekli olan tam sağlayıcı yapılandırması `api` değerlerinin isteğe bağlı listesi. |

`modelCatalog` içine yalnızca runtime verisi koymayın. `static` değerini yalnızca manifest satırları, provider ile filtrelenmiş liste ve seçici yüzeylerinin registry/runtime keşfini atlamasına yetecek kadar eksiksiz olduğunda kullanın. Manifest satırları listelenebilir başlangıç kayıtları veya tamamlayıcılar olarak yararlıysa ancak refresh/cache daha sonra daha fazla satır ekleyebiliyorsa `refreshable` kullanın; refreshable satırlar tek başlarına yetkili değildir. OpenClaw listeyi bilmek için provider runtime'ını yüklemek zorundaysa `runtime` kullanın.

## modelIdNormalization başvurusu

Provider runtime'ı yüklenmeden önce gerçekleşmesi gereken düşük maliyetli, provider'a ait model kimliği temizliği için `modelIdNormalization` kullanın. Bu, kısa model adları, provider'a yerel eski kimlikler ve proxy önek kuralları gibi takma adları çekirdek model seçimi tabloları yerine sahibi olan Plugin manifest'inde tutar.

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

Provider alanları:

| Alan                                 | Tür                     | Anlamı                                                                                                  |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Büyük/küçük harfe duyarsız tam model kimliği takma adları. Değerler yazıldığı gibi döndürülür.         |
| `stripPrefixes`                      | `string[]`              | Takma ad aramasından önce kaldırılacak önekler; eski provider/model çoğaltması için yararlıdır.        |
| `prefixWhenBare`                     | `string`                | Normalleştirilmiş model kimliği zaten `/` içermediğinde eklenecek önek.                                 |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Takma ad aramasından sonra, `modelPrefix` ve `prefix` anahtarlı koşullu yalın kimlik önek kuralları.    |

## providerEndpoints başvurusu

Provider runtime'ı yüklenmeden önce genel istek politikasının bilmesi gereken uç nokta sınıflandırması için `providerEndpoints` kullanın. Çekirdek hâlâ her `endpointClass` değerinin anlamına sahiptir; Plugin manifest'leri host ve temel URL metadata'sına sahiptir.

Uç nokta alanları:

| Alan                           | Tür        | Anlamı                                                                                                  |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`, `moonshot-native` veya `google-vertex` gibi bilinen çekirdek uç nokta sınıfı.             |
| `hosts`                        | `string[]` | Uç nokta sınıfına eşlenen tam host adları.                                                              |
| `hostSuffixes`                 | `string[]` | Uç nokta sınıfına eşlenen host sonekleri. Yalnızca etki alanı soneki eşleşmesi için başına `.` ekleyin. |
| `baseUrls`                     | `string[]` | Uç nokta sınıfına eşlenen tam normalleştirilmiş HTTP(S) temel URL'leri.                                 |
| `googleVertexRegion`           | `string`   | Tam global host'lar için statik Google Vertex bölgesi.                                                  |
| `googleVertexRegionHostSuffix` | `string`   | Google Vertex bölge önekini açığa çıkarmak için eşleşen host'lardan çıkarılacak sonek.                 |

## providerRequest başvurusu

Provider runtime'ı yüklemeden genel istek politikasının ihtiyaç duyduğu düşük maliyetli istek uyumluluğu metadata'sı için `providerRequest` kullanın. Davranışa özgü payload yeniden yazımını provider runtime hook'larında veya paylaşılan provider ailesi yardımcılarında tutun.

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

Provider alanları:

| Alan                  | Tür          | Anlamı                                                                                              |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Genel istek uyumluluğu kararları ve tanılamalar için kullanılan provider ailesi etiketi.            |
| `compatibilityFamily` | `"moonshot"` | Paylaşılan istek yardımcıları için isteğe bağlı provider ailesi uyumluluk grubu.                    |
| `openAICompletions`   | `object`     | OpenAI uyumlu completions isteği bayrakları; şu anda `supportsStreamingUsage`.                      |

## modelPricing başvurusu

Bir provider, runtime yüklenmeden önce kontrol düzlemi fiyatlandırma davranışına ihtiyaç duyduğunda `modelPricing` kullanın. Gateway fiyatlandırma cache'i, provider runtime kodunu import etmeden bu metadata'yı okur.

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

Provider alanları:

| Alan         | Tür               | Anlamı                                                                                                           |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter veya LiteLLM fiyatlandırmasını asla getirmemesi gereken yerel/kendi barındırılan provider'lar için `false` olarak ayarlayın. |
| `openRouter` | `false \| object` | OpenRouter fiyatlandırma araması eşlemesi. `false`, bu provider için OpenRouter aramasını devre dışı bırakır.    |
| `liteLLM`    | `false \| object` | LiteLLM fiyatlandırma araması eşlemesi. `false`, bu provider için LiteLLM aramasını devre dışı bırakır.          |

Kaynak alanları:

| Alan                       | Tür                | Anlamı                                                                                                                    |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw provider kimliğinden farklı olduğunda harici katalog provider kimliği; örneğin bir `zai` provider için `z-ai`.   |
| `passthroughProviderModel` | `boolean`          | Eğik çizgi içeren model kimliklerini iç içe provider/model referansları olarak ele alır; OpenRouter gibi proxy provider'lar için yararlıdır. |
| `modelIdTransforms`        | `"version-dots"[]` | Ek harici katalog model kimliği varyantları. `version-dots`, `claude-opus-4.6` gibi noktalı sürüm kimliklerini dener.     |

### OpenClaw Provider Dizini

OpenClaw Provider Dizini, Plugin'leri henüz kurulmamış olabilecek provider'lar için OpenClaw'a ait önizleme metadata'sıdır. Bir Plugin manifest'inin parçası değildir. Plugin manifest'leri kurulu Plugin yetkilisi olarak kalır. Provider Dizini, gelecekteki kurulabilir provider ve kurulum öncesi model seçici yüzeylerinin, bir provider Plugin'i kurulu olmadığında tüketeceği dahili yedek sözleşmedir.

Katalog yetki sırası:

1. Kullanıcı yapılandırması.
2. Kurulu Plugin manifest'i `modelCatalog`.
3. Açık refresh'ten gelen model katalog cache'i.
4. OpenClaw Provider Dizini önizleme satırları.

Provider Dizini sır, etkin durum, runtime hook'ları veya canlı hesaba özgü model verisi içermemelidir. Önizleme katalogları, Plugin manifest'leriyle aynı `modelCatalog` provider satırı şeklini kullanır, ancak `api`, `baseUrl`, fiyatlandırma veya uyumluluk bayrakları gibi runtime adaptörü alanları kasıtlı olarak kurulu Plugin manifest'iyle hizalı tutulmadıkça kararlı görüntüleme metadata'sıyla sınırlı kalmalıdır. Canlı `/models` keşfine sahip provider'lar, normal listeleme veya onboarding işlemlerinin provider API'lerini çağırmasını sağlamak yerine yenilenmiş satırları açık model katalog cache yolu üzerinden yazmalıdır.

Provider Dizini girdileri, Plugin'i çekirdekten çıkarılmış veya başka şekilde henüz kurulu olmayan provider'lar için kurulabilir Plugin metadata'sı da taşıyabilir. Bu metadata, kanal katalog desenini yansıtır: paket adı, npm kurulum belirtimi, beklenen bütünlük ve düşük maliyetli kimlik doğrulama seçimi etiketleri, kurulabilir bir kurulum seçeneği göstermek için yeterlidir. Plugin kurulduğunda, onun manifest'i kazanır ve Provider Dizini girdisi o provider için yok sayılır.

Eski üst düzey capability anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` ve `webSearchProviders` değerlerini `contracts` altına taşımak için `openclaw doctor --fix` kullanın; normal manifest yükleme artık bu üst düzey alanları capability sahipliği olarak ele almaz.

## Manifest ile package.json karşılaştırması

İki dosya farklı işler için kullanılır:

| Dosya                  | Ne için kullanılır                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce var olması gereken keşif, yapılandırma doğrulama, kimlik doğrulama seçimi metadata'sı ve UI ipuçları |
| `package.json`         | npm metadata'sı, bağımlılık kurulumu ve entrypoint'ler, kurulum gating'i, setup veya katalog metadata'sı için kullanılan `openclaw` bloğu |

Bir metadata parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu Plugin kodunu yüklemeden önce bilmek zorundaysa, `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse, `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı runtime öncesi Plugin metadata'ları kasıtlı olarak `openclaw.plugin.json` yerine `package.json` içindeki `openclaw` bloğunda bulunur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Yerel Plugin giriş noktalarını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Kurulu paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                       |
| `openclaw.setupEntry`                                             | İlk kurulum, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif, yalnızca kurulum giriş noktası. Plugin paket dizininin içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                      | Kurulu paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. `setupEntry` gerektirir, mevcut olmalıdır ve Plugin paket dizininin içinde kalmalıdır.                   |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog metadata'sı.                                                                                 |
| `openclaw.channel.commands`                                       | Kanal çalışma zamanı yüklenmeden önce config, denetim ve komut listesi yüzeyleri tarafından kullanılan statik yerel komut ve yerel skill otomatik varsayılan metadata'sı.            |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden "yalnızca env kurulumu zaten var mı?" sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyici metadata'sı.                             |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden "oturum açmış herhangi bir şey var mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama denetleyici metadata'sı.                         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketle gelen ve dışarıda yayımlanan Plugin'ler için kurulum/güncelleme ipuçları.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Birden fazla kurulum kaynağı kullanılabilir olduğunda tercih edilen kurulum yolu.                                                                                                    |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` veya `>=2026.5.1-beta.1` gibi bir semver tabanı kullanan, desteklenen minimum OpenClaw host sürümü.                                                                    |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` gibi beklenen npm dist bütünlük dizesi; kurulum ve güncelleme akışları getirilen artifact'i buna göre doğrular.                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | Config geçersiz olduğunda dar kapsamlı bir paketle gelen Plugin yeniden kurulum kurtarma yoluna izin verir.                                                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlatma sırasında tam kanal Plugin'inden önce yalnızca kurulum kanal yüzeylerinin yüklenmesine izin verir.                                                                          |

Manifest metadata'sı, çalışma zamanı yüklenmeden önce ilk kurulumda hangi sağlayıcı/kanal/kurulum seçeneklerinin görüneceğini belirler. `package.json#openclaw.install`, kullanıcı bu seçeneklerden birini seçtiğinde ilk kuruluma o Plugin'i nasıl getireceğini veya etkinleştireceğini söyler. Kurulum ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, paketle gelmeyen Plugin kaynakları için kurulum ve manifest registry yükleme sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler, eski host'larda harici Plugin'leri atlar. Paketle gelen kaynak Plugin'lerin host checkout ile aynı sürümde olduğu varsayılır.

Kesin npm sürümü sabitlemesi zaten `npmSpec` içinde bulunur, örneğin `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmi harici katalog girişleri, güncelleme akışlarının getirilen npm artifact'i artık sabitlenmiş release ile eşleşmiyorsa kapalı şekilde başarısız olması için kesin spec'leri `expectedIntegrity` ile eşleştirmelidir. Etkileşimli ilk kurulum, uyumluluk için çıplak paket adları ve dist-tag'ler dahil güvenilir registry npm spec'lerini sunmaya devam eder. Katalog tanıları kesin, kayan, bütünlük sabitlenmiş, bütünlük eksik, paket adı uyuşmazlığı ve geçersiz varsayılan seçim kaynaklarını ayırt edebilir. Ayrıca `expectedIntegrity` mevcutken onu sabitleyebilecek geçerli bir npm kaynağı yoksa uyarı verir. `expectedIntegrity` mevcut olduğunda, kurulum/güncelleme akışları bunu zorunlu kılar; atlandığında registry çözümlemesi bir bütünlük sabitlemesi olmadan kaydedilir.

Durum, kanal listesi veya SecretRef taramaları tam çalışma zamanını yüklemeden yapılandırılmış hesapları tanımlamak zorundaysa, kanal Plugin'leri `openclaw.setupEntry` sağlamalıdır. Kurulum girişi kanal metadata'sı ile kurulum açısından güvenli config, durum ve secrets adapter'larını sunmalıdır; ağ client'larını, gateway listener'larını ve transport çalışma zamanlarını ana extension giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanları için paket sınırı denetimlerini geçersiz kılmaz. Örneğin, `openclaw.runtimeExtensions` kaçan bir `openclaw.extensions` yolunu yüklenebilir yapamaz.

`openclaw.install.allowInvalidConfigRecovery` bilinçli olarak dar kapsamlıdır. Rastgele bozuk config'leri kurulabilir hale getirmez. Bugün yalnızca eksik bir paketle gelen Plugin yolu veya aynı paketle gelen Plugin için eski bir `channels.<id>` girişi gibi belirli eski paketle gelen Plugin yükseltme hatalarından kurulum akışlarının kurtulmasına izin verir. İlgisiz config hataları kurulumu yine engeller ve operatörleri `openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modülü için paket metadata'sıdır:

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

Kurulum, doctor, durum veya salt okunur presence akışları tam kanal Plugin'i yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama denetimine ihtiyaç duyduğunda bunu kullanın. Kalıcı kimlik doğrulama durumu yapılandırılmış kanal durumu değildir: bu metadata'yı Plugin'leri otomatik etkinleştirmek, çalışma zamanı bağımlılıklarını onarmak veya bir kanal çalışma zamanının yüklenip yüklenmeyeceğine karar vermek için kullanmayın. Hedef export yalnızca kalıcı durumu okuyan küçük bir function olmalıdır; bunu tam kanal çalışma zamanı barrel'ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca env yapılandırılmış denetimler için aynı şekli izler:

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

Bir kanal, yapılandırılmış durumu env'den veya diğer küçük çalışma zamanı dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam config çözümlemesi veya gerçek kanal çalışma zamanı gerektiriyorsa, bu mantığı bunun yerine Plugin `config.hasConfiguredState` hook'unda tutun.

## Keşif önceliği (yinelenen Plugin id'leri)

OpenClaw, Plugin'leri çeşitli köklerden keşfeder (paketle gelen, global kurulum, workspace, explicit config ile seçilmiş yollar). İki keşif aynı `id` değerini paylaşıyorsa, yalnızca **en yüksek öncelikli** manifest tutulur; daha düşük öncelikli yinelenenler onun yanında yüklenmek yerine düşürülür.

Öncelik, en yüksekten en düşüğe:

1. **Config-selected** — `plugins.entries.<id>` içinde açıkça sabitlenmiş bir yol
2. **Bundled** — OpenClaw ile gönderilen Plugin'ler
3. **Global install** — global OpenClaw Plugin köküne kurulan Plugin'ler
4. **Workspace** — geçerli workspace'e göre keşfedilen Plugin'ler

Sonuçlar:

- Workspace içinde duran, paketle gelen bir Plugin'in fork'lanmış veya eski bir kopyası paketle gelen build'i gölgelemeyecektir.
- Paketle gelen bir Plugin'i gerçekten yerel bir Plugin ile geçersiz kılmak için, workspace keşfine güvenmek yerine öncelikle kazanması adına onu `plugins.entries.<id>` üzerinden sabitleyin.
- Yinelenen düşürmeler log'lanır, böylece Doctor ve başlatma tanıları atılan kopyayı gösterebilir.
- Config-selected yinelenen geçersiz kılmaları tanılarda açık geçersiz kılmalar olarak ifade edilir, ancak eski fork'lar ve kazara gölgelemeler görünür kalsın diye yine de uyarı verir.

## JSON Schema gereksinimleri

- **Her Plugin bir JSON Schema ile gelmelidir**, config kabul etmese bile.
- Boş bir schema kabul edilebilir (örneğin, `{ "type": "object", "additionalProperties": false }`).
- Schema'lar çalışma zamanında değil, config okuma/yazma zamanında doğrulanır.
- Paketle gelen bir Plugin'i yeni config key'leriyle genişletirken veya fork'larken, aynı anda o Plugin'in `openclaw.plugin.json` `configSchema` öğesini güncelleyin. Paketle gelen Plugin schema'ları strict'tir; bu nedenle kullanıcı config'inde `plugins.entries.<id>.config.myNewKey` ekleyip `myNewKey` öğesini `configSchema.properties` içine eklemezseniz, Plugin çalışma zamanı yüklenmeden önce reddedilir.

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

- Bilinmeyen `channels.*` key'leri, kanal id'si bir Plugin manifest tarafından bildirilmedikçe **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*` **keşfedilebilir** Plugin id'lerine başvurmalıdır. Bilinmeyen id'ler **hatadır**.
- Bir Plugin kuruluysa ama manifest'i veya schema'sı bozuk ya da eksikse, doğrulama başarısız olur ve Doctor Plugin hatasını bildirir.
- Plugin config'i mevcut ama Plugin **devre dışı** ise, config korunur ve Doctor + log'larda bir **uyarı** gösterilir.

Tam `plugins.*` schema'sı için [Configuration reference](/tr/gateway/configuration) bölümüne bakın.

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil olmak üzere **yerel OpenClaw pluginleri için zorunludur**. Runtime hâlâ Plugin modülünü ayrı olarak yükler; manifest yalnızca keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle nihai değer hâlâ bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyicisi tarafından yalnızca belgelendirilmiş manifest alanları okunur. Özel üst düzey anahtarlardan kaçının.
- Bir Plugin bunlara ihtiyaç duymadığında `channels`, `providers`, `cliBackends` ve `skills` alanlarının tümü atlanabilir.
- `providerDiscoveryEntry` hafif kalmalı ve geniş runtime kodunu içe aktarmamalıdır; bunu istek zamanı yürütmesi için değil, statik sağlayıcı katalog meta verileri veya dar kapsamlı keşif tanımlayıcıları için kullanın.
- Özel Plugin türleri `plugins.slots.*` üzerinden seçilir: `plugins.slots.memory` aracılığıyla `kind: "memory"`, `plugins.slots.contextEngine` aracılığıyla `kind: "context-engine"` (varsayılan `legacy`).
- Özel Plugin türünü bu manifestte bildirin. Runtime girişindeki `OpenClawPluginDefinition.kind` kullanımdan kaldırılmıştır ve yalnızca eski Pluginler için uyumluluk yedeği olarak kalır.
- Env var meta verileri (`setup.providers[].envVars`, kullanımdan kaldırılmış `providerAuthEnvVars` ve `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, Cron teslim doğrulaması ve diğer salt okunur yüzeyler, bir env var’ı yapılandırılmış olarak değerlendirmeden önce hâlâ Plugin güvenini ve etkin aktivasyon ilkesini uygular.
- Sağlayıcı kodu gerektiren runtime sihirbazı meta verileri için bkz. [Sağlayıcı runtime kancaları](/tr/plugins/architecture-internals#provider-runtime-hooks).
- Plugininiz yerel modüllere bağlıysa derleme adımlarını ve paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## İlgili

<CardGroup cols={3}>
  <Card title="Plugin oluşturma" href="/tr/plugins/building-plugins" icon="rocket">
    Pluginlerle çalışmaya başlama.
  </Card>
  <Card title="Plugin mimarisi" href="/tr/plugins/architecture" icon="diagram-project">
    Dahili mimari ve yetenek modeli.
  </Card>
  <Card title="SDK genel bakışı" href="/tr/plugins/sdk-overview" icon="book">
    Plugin SDK başvurusu ve alt yol içe aktarmaları.
  </Card>
</CardGroup>
