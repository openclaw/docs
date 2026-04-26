---
read_when:
    - Bir OpenClaw Plugin'i geliştiriyorsunuz
    - Bir Plugin yapılandırma şeması yayımlamanız veya Plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin manifesti
x-i18n:
    generated_at: "2026-04-26T11:36:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

Bu sayfa yalnızca **yerel OpenClaw Plugin manifesti** içindir.

Uyumlu paket düzenleri için [Plugin paketleri](/tr/plugins/bundles) sayfasına bakın.

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşen
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik olarak algılar, ancak bunlar burada
açıklanan `openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda, düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde,
paket meta verilerini ve bildirilen skill köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını,
Claude paketi LSP varsayılanlarını ve desteklenen hook paketlerini okur.

Her yerel OpenClaw Plugin'i, **Plugin kökünde** bir `openclaw.plugin.json` dosyası
içermelidir. OpenClaw bu manifesti, yapılandırmayı **Plugin kodunu çalıştırmadan**
doğrulamak için kullanır. Eksik veya geçersiz manifestler Plugin hatası olarak değerlendirilir
ve yapılandırma doğrulamasını engeller.

Tam Plugin sistemi kılavuzu için bkz.: [Plugin'ler](/tr/tools/plugin).
Yerel yetenek modeli ve mevcut harici uyumluluk yönergeleri için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'ın **Plugin kodunuzu yüklemeden önce**
okuduğu meta verilerdir. Aşağıdaki her şey, Plugin çalışma zamanını başlatmadan
incelenebilecek kadar hafif olmalıdır.

**Şunlar için kullanın:**

- Plugin kimliği, yapılandırma doğrulaması ve yapılandırma kullanıcı arayüzü ipuçları
- kimlik doğrulama, onboarding ve kurulum meta verileri (takma ad, otomatik etkinleştirme, sağlayıcı ortam değişkenleri, kimlik doğrulama seçenekleri)
- denetim düzlemi yüzeyleri için etkinleştirme ipuçları
- kısa model ailesi sahipliği
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` ana makinesinin inceleyebileceği QA çalıştırıcı meta verileri
- katalog ve doğrulama yüzeylerine birleştirilen kanala özgü yapılandırma meta verileri

**Şunlar için kullanmayın:** çalışma zamanı davranışı kaydetmek, kod giriş noktaları bildirmek
veya npm kurulum meta verileri. Bunlar Plugin kodunuza ve `package.json` dosyasına aittir.

## Minimum örnek

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
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
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

| Alan                                | Gerekli | Tür                              | Anlamı                                                                                                                                                                                                                            |
| ----------------------------------- | ------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Evet    | `string`                         | Kanonik Plugin kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                                                                    |
| `configSchema`                      | Evet    | `object`                         | Bu Plugin'in yapılandırması için satır içi JSON Şeması.                                                                                                                                                                           |
| `enabledByDefault`                  | Hayır   | `true`                           | Paketlenmiş bir Plugin'i varsayılan olarak etkin işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bu alanı atlayın veya `true` dışındaki herhangi bir değere ayarlayın.                                           |
| `legacyPluginIds`                   | Hayır   | `string[]`                       | Bu kanonik Plugin kimliğine normalleştirilen eski kimlikler.                                                                                                                                                                      |
| `autoEnableWhenConfiguredProviders` | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunlardan bahsettiğinde bu Plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                  |
| `kind`                              | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan dışlayıcı bir Plugin türü bildirir.                                                                                                                                                       |
| `channels`                          | Hayır   | `string[]`                       | Bu Plugin'e ait kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                                              |
| `providers`                         | Hayır   | `string[]`                       | Bu Plugin'e ait sağlayıcı kimlikleri.                                                                                                                                                                                             |
| `providerDiscoveryEntry`            | Hayır   | `string`                         | Tam Plugin çalışma zamanını etkinleştirmeden yüklenebilen, manifest kapsamlı sağlayıcı katalog meta verileri için Plugin köküne göreli hafif sağlayıcı keşif modülü yolu.                                                         |
| `modelSupport`                      | Hayır   | `object`                         | Çalışma zamanından önce Plugin'i otomatik yüklemek için kullanılan, manifeste ait kısa model ailesi meta verileri.                                                                                                                |
| `modelCatalog`                      | Hayır   | `object`                         | Bu Plugin'e ait sağlayıcılar için bildirime dayalı model katalog meta verileri. Bu; çalışma zamanını yüklemeden gelecekteki salt okunur listeleme, onboarding, model seçiciler, takma adlar ve bastırma için denetim düzlemi sözleşmesidir. |
| `providerEndpoints`                 | Hayır   | `object[]`                       | Sağlayıcı yolları için, çekirdeğin sağlayıcı çalışma zamanı yüklenmeden önce sınıflandırması gereken, manifeste ait uç nokta ana makinesi/baseUrl meta verileri.                                                                  |
| `cliBackends`                       | Hayır   | `string[]`                       | Bu Plugin'e ait CLI çıkarım arka uç kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                                                            |
| `syntheticAuthRefs`                 | Hayır   | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında, Plugin'e ait sentetik kimlik doğrulama hook'unun yoklanması gereken sağlayıcı veya CLI arka uç başvuruları.                                                          |
| `nonSecretAuthMarkers`              | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketlenmiş Plugin'e ait yer tutucu API anahtarı değerleri.                                                                                            |
| `commandAliases`                    | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce Plugin farkında yapılandırma ve CLI tanılaması üretmesi gereken, bu Plugin'e ait komut adları.                                                                                                    |
| `providerAuthEnvVars`               | Hayır   | `Record<string, string[]>`       | Sağlayıcı kimlik doğrulama/durum araması için kullanımdan kaldırılmış uyumluluk ortam meta verileri. Yeni Plugin'ler için `setup.providers[].envVars` tercih edilmelidir; OpenClaw kullanım dışı bırakma süresi boyunca bunu hâlâ okur. |
| `providerAuthAliases`               | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı.             |
| `channelEnvVars`                    | Hayır   | `Record<string, string[]>`       | OpenClaw'ın Plugin kodunu yüklemeden inceleyebileceği hafif kanal ortam meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam güdümlü kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`               | Hayır   | `object[]`                       | Onboarding seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlama için hafif kimlik doğrulama seçeneği meta verileri.                                                                                      |
| `activation`                        | Hayır   | `object`                         | Sağlayıcı, komut, kanal, rota ve yetenek tarafından tetiklenen yükleme için hafif etkinleştirme planlayıcı meta verileri. Yalnızca meta veri; gerçek davranışın sahibi yine Plugin çalışma zamanıdır.                             |
| `setup`                             | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin Plugin çalışma zamanını yüklemeden inceleyebileceği hafif kurulum/onboarding tanımlayıcıları.                                                                                                      |
| `qaRunners`                         | Hayır   | `object[]`                       | Paylaşılan `openclaw qa` ana makinesi tarafından, Plugin çalışma zamanı yüklenmeden önce kullanılan hafif QA çalıştırıcı tanımlayıcıları.                                                                                         |
| `contracts`                         | Hayır   | `object`                         | Harici kimlik doğrulama hook'ları, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search ve araç sahipliği için statik paketlenmiş yetenek anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır  | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için hafif media-understanding varsayılanları.                                                                                                     |
| `channelConfigs`                    | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeylerine birleştirilen, manifeste ait kanal yapılandırma meta verileri.                                                                                                     |
| `skills`                            | Hayır   | `string[]`                       | Plugin köküne göreli yüklenecek Skills dizinleri.                                                                                                                                                                                 |
| `name`                              | Hayır   | `string`                         | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                                           |
| `description`                       | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                         |
| `version`                           | Hayır   | `string`                         | Bilgilendirici Plugin sürümü.                                                                                                                                                                                                     |
| `uiHints`                           | Hayır   | `Record<string, object>`         | Yapılandırma alanları için kullanıcı arayüzü etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                   |

## `providerAuthChoices` başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçeneğini tanımlar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.
Sağlayıcı kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden bu manifest seçeneklerini, tanımlayıcıdan türetilmiş kurulum
seçeneklerini ve kurulum kataloğu meta verilerini kullanır.

| Alan                 | Gerekli | Tür                                             | Anlamı                                                                                                 |
| -------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`           | Evet    | `string`                                        | Bu seçimin ait olduğu sağlayıcı kimliği.                                                               |
| `method`             | Evet    | `string`                                        | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                      |
| `choiceId`           | Evet    | `string`                                        | Onboarding ve CLI akışlarında kullanılan kararlı auth-choice kimliği.                                  |
| `choiceLabel`        | Hayır   | `string`                                        | Kullanıcıya gösterilen etiket. Atlanırsa OpenClaw varsayılan olarak `choiceId` kullanır.              |
| `choiceHint`         | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                       |
| `assistantPriority`  | Hayır   | `number`                                        | Daha düşük değerler, asistan güdümlü etkileşimli seçicilerde daha önce sıralanır.                     |
| `assistantVisibility` | Hayır  | `"visible"` \| `"manual-only"`                  | Manuel CLI seçimine yine de izin verirken seçimi asistan seçicilerinden gizler.                       |
| `deprecatedChoiceIds` | Hayır  | `string[]`                                      | Kullanıcıları bu yedek seçime yönlendirmesi gereken eski seçim kimlikleri.                             |
| `groupId`            | Hayır   | `string`                                        | İlgili seçimleri gruplamak için isteğe bağlı grup kimliği.                                             |
| `groupLabel`         | Hayır   | `string`                                        | Bu grup için kullanıcıya gösterilen etiket.                                                            |
| `groupHint`          | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                         |
| `optionKey`          | Hayır   | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için dahili seçenek anahtarı.                             |
| `cliFlag`            | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                            |
| `cliOption`          | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                              |
| `cliDescription`     | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                    |
| `onboardingScopes`   | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçimin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan olarak `["text-inference"]` kullanılır. |

## commandAliases başvurusu

Bir Plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahipse `commandAliases` kullanın. OpenClaw bu meta veriyi, Plugin çalışma zamanı kodunu içe aktarmadan tanılama için kullanır.

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

| Alan         | Gerekli | Tür               | Anlamı                                                                     |
| ------------ | ------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu Plugin'e ait komut adı.                                                 |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök CLI komutu yerine sohbet slash komutu olarak işaretler.     |
| `cliCommand` | Hayır   | `string`          | Varsa, CLI işlemleri için önerilecek ilgili kök CLI komutu.                |

## activation başvurusu

Plugin hangi kontrol düzlemi olaylarının onu bir etkinleştirme/yükleme planına dahil etmesi gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

Bu blok, yaşam döngüsü API’si değil planlayıcı meta verisidir. Çalışma zamanı davranışını kaydetmez, `register(...)` yerine geçmez ve Plugin kodunun zaten çalıştığını vaat etmez. Etkinleştirme planlayıcısı, `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve hook'lar gibi mevcut manifest sahiplik meta verisine geri dönmeden önce aday Plugin'leri daraltmak için bu alanları kullanır.

Sahipliği zaten tanımlayan en dar meta veriyi tercih edin. Bu ilişkiyi bu alanlar ifade ediyorsa `providers`, `channels`, `commandAliases`, kurulum tanımlayıcıları veya `contracts` kullanın. `activation` alanını, bu sahiplik alanlarıyla temsil edilemeyen ek planlayıcı ipuçları için kullanın.
`claude-cli`, `codex-cli` veya `google-gemini-cli` gibi CLI çalışma zamanı takma adları için üst düzey `cliBackends` kullanın; `activation.onAgentHarnesses` yalnızca halihazırda bir sahiplik alanı olmayan gömülü ajan harness kimlikleri içindir.

Bu blok yalnızca meta veridir. Çalışma zamanı davranışını kaydetmez ve `register(...)`, `setupEntry` veya diğer çalışma zamanı/Plugin giriş noktalarının yerine geçmez. Mevcut tüketiciler bunu daha geniş Plugin yüklemesinden önce daraltıcı bir ipucu olarak kullanır, bu nedenle eksik etkinleştirme meta verisi genellikle yalnızca performans maliyeti doğurur; eski manifest sahiplik geri dönüşleri hâlâ mevcutken doğruluğu değiştirmemelidir.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Alan               | Gerekli | Tür                                                  | Anlamı                                                                                                                                             |
| ------------------ | ------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                                                           |
| `onAgentHarnesses` | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken gömülü ajan harness çalışma zamanı kimlikleri. CLI backend takma adları için üst düzey `cliBackends` kullanın. |
| `onCommands`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                                                               |
| `onChannels`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                                                               |
| `onRoutes`         | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                                                                   |
| `onCapabilities`   | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin.                   |

Güncel canlı tüketiciler:

- komut tetiklemeli CLI planlaması, eski
  `commandAliases[].cliCommand` veya `commandAliases[].name` alanlarına geri döner
- ajan çalışma zamanı başlangıç planlaması, gömülü harness'ler için `activation.onAgentHarnesses` ve CLI çalışma zamanı takma adları için üst düzey `cliBackends[]` kullanır
- kanal tetiklemeli kurulum/kanal planlaması, açık kanal etkinleştirme meta verisi eksik olduğunda eski `channels[]`
  sahipliğine geri döner
- sağlayıcı tetiklemeli kurulum/çalışma zamanı planlaması, açık sağlayıcı
  etkinleştirme meta verisi eksik olduğunda eski `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

Planlayıcı tanılamaları, açık etkinleştirme ipuçlarını manifest
sahiplik geri dönüşünden ayırt edebilir. Örneğin, `activation-command-hint`
`activation.onCommands` eşleşti anlamına gelirken, `manifest-command-alias`
planlayıcının bunun yerine `commandAliases` sahipliğini kullandığı anlamına gelir. Bu neden etiketleri ana bilgisayar tanılamaları ve testler içindir; Plugin yazarları sahipliği en iyi tanımlayan meta veriyi bildirmeye devam etmelidir.

## qaRunners başvurusu

Bir Plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma çalıştırıcısı sağlıyorsa `qaRunners` kullanın. Bu meta veriyi ucuz ve statik tutun; Plugin çalışma zamanı yine de `qaRunnerCliRegistrations` dışa aktaran hafif bir `runtime-api.ts` yüzeyi aracılığıyla gerçek CLI kaydına sahip olur.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Tek kullanımlık bir homeserver'a karşı Docker destekli Matrix canlı QA hattını çalıştır"
    }
  ]
}
```

| Alan          | Gerekli | Tür      | Anlamı                                                                |
| ------------- | ------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altında bağlanan alt komut; örneğin `matrix`.           |
| `description` | Hayır   | `string` | Paylaşılan ana bilgisayarın bir taslak komuta ihtiyaç duyduğunda kullandığı yedek yardım metni. |

## setup başvurusu

Kurulum ve onboarding yüzeyleri çalışma zamanı yüklenmeden önce düşük maliyetli, Plugin'e ait meta veriye ihtiyaç duyduğunda `setup` kullanın.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım backend'lerini tanımlamaya devam eder. `setup.cliBackends`, meta veri odaklı kalması gereken kontrol düzlemi/kurulum akışları için kurulum özelindeki tanımlayıcı yüzeydir.

Bulunduğunda, `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday Plugin'i daraltıyorsa ve kurulum yine de daha zengin kurulum zamanı çalışma zamanı hook'larına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve geri dönüş yürütme yolu olarak `setup-api` alanını yerinde bırakın.

OpenClaw ayrıca genel sağlayıcı kimlik doğrulama ve env-var aramalarında `setup.providers[].envVars` alanını da kullanır. `providerAuthEnvVars`, kullanımdan kaldırma penceresi boyunca bir uyumluluk bağdaştırıcısı üzerinden desteklenmeye devam eder, ancak bunu hâlâ kullanan paketlenmemiş olmayan Plugin'ler bir manifest tanılaması alır. Yeni Plugin'ler kurulum/durum env meta verisini `setup.providers[].envVars` üzerine koymalıdır.

OpenClaw, ayrıca bir kurulum girdisi olmadığında veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildirdiğinde `setup.providers[].authMethods` alanından basit kurulum seçenekleri türetebilir. Açık `providerAuthChoices` girdileri, özel etiketler, CLI bayrakları, onboarding kapsamı ve asistan meta verisi için tercih edilmeye devam eder.

`requiresRuntime: false` değerini yalnızca bu tanımlayıcılar kurulum
yüzeyi için yeterliyse ayarlayın. OpenClaw açık `false` değerini yalnızca tanımlayıcıya dayalı bir sözleşme olarak ele alır
ve kurulum araması için `setup-api` veya `openclaw.setupEntry` çalıştırmaz. Eğer
yalnızca tanımlayıcıya dayalı bir Plugin yine de bu kurulum çalışma zamanı girdilerinden birini sağlıyorsa,
OpenClaw ek bir tanılama bildirir ve bunu yok saymaya devam eder. Atlanan
`requiresRuntime`, eski geri dönüş davranışını korur; böylece işaretsiz tanımlayıcı ekleyen mevcut Plugin'ler bozulmaz.

Kurulum araması Plugin'e ait `setup-api` kodunu çalıştırabildiği için, normalize edilmiş
`setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen Plugin'ler arasında benzersiz kalmalıdır.
Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine güvenli biçimde başarısız olur.

Kurulum çalışma zamanı gerçekten yürütüldüğünde, kurulum kayıt defteri tanılamaları
`setup-api`, manifest tanımlayıcılarının bildirmediği bir sağlayıcı veya CLI backend'i kaydederse
ya da bir tanımlayıcının eşleşen bir çalışma zamanı kaydı yoksa tanımlayıcı sapmasını bildirir.
Bu tanılamalar ek niteliktedir ve eski Plugin'leri reddetmez.

### setup.providers başvurusu

| Alan          | Gerekli | Tür        | Anlamı                                                                                   |
| ------------- | ------- | ---------- | ---------------------------------------------------------------------------------------- |
| `id`          | Evet    | `string`   | Kurulum veya onboarding sırasında açığa çıkan sağlayıcı kimliği. Normalize edilmiş kimlikleri küresel olarak benzersiz tutun. |
| `authMethods` | Hayır   | `string[]` | Bu sağlayıcının tam çalışma zamanını yüklemeden desteklediği kurulum/auth yöntem kimlikleri. |
| `envVars`     | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden önce denetleyebileceği env var'lar. |

### setup alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                               |
| ------------------ | ------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve onboarding sırasında açığa çıkan sağlayıcı kurulum tanımlayıcıları.                      |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kullanılan kurulum zamanı backend kimlikleri. Normalize edilmiş kimlikleri küresel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin'in kurulum yüzeyine ait yapılandırma geçiş kimlikleri.                                     |
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

| Alan          | Tür        | Anlamı                                  |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Kullanıcıya gösterilen alan etiketi.    |
| `help`        | `string`   | Kısa yardımcı metin.                    |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.             |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.        |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girdileri için yer tutucu metin.   |

## contracts başvurusu

`contracts` alanını yalnızca OpenClaw'ın
Plugin çalışma zamanını içe aktarmadan okuyabildiği statik yetenek sahipliği meta verisi için kullanın.

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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Her liste isteğe bağlıdır:

| Alan                             | Tür        | Anlamı                                                                       |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server uzantı fabrika kimlikleri; şu anda `codex-app-server`.     |
| `agentToolResultMiddleware`      | `string[]` | Paketlenmiş bir Plugin'in araç sonucu ara katmanı kaydedebileceği çalışma zamanı kimlikleri. |
| `externalAuthProviders`          | `string[]` | Harici auth profil hook'unun bu Plugin'e ait olduğu sağlayıcı kimlikleri.    |
| `speechProviders`                | `string[]` | Bu Plugin'in sahip olduğu konuşma sağlayıcı kimlikleri.                      |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı transkripsiyon sağlayıcı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı ses sağlayıcı kimlikleri.           |
| `memoryEmbeddingProviders`       | `string[]` | Bu Plugin'in sahip olduğu bellek gömme sağlayıcı kimlikleri.                 |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin'in sahip olduğu medya anlama sağlayıcı kimlikleri.                 |
| `imageGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu görüntü üretimi sağlayıcı kimlikleri.              |
| `videoGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu video üretimi sağlayıcı kimlikleri.                |
| `webFetchProviders`              | `string[]` | Bu Plugin'in sahip olduğu web-getirme sağlayıcı kimlikleri.                  |
| `webSearchProviders`             | `string[]` | Bu Plugin'in sahip olduğu web-arama sağlayıcı kimlikleri.                    |
| `tools`                          | `string[]` | Paketlenmiş sözleşme kontrolleri için bu Plugin'in sahip olduğu ajan araç adları. |

`contracts.embeddedExtensionFactories`, paketlenmiş yalnızca Codex
app-server uzantı fabrikaları için korunur. Paketlenmiş araç sonucu dönüşümleri
bunun yerine `contracts.agentToolResultMiddleware` bildirmeli ve
`api.registerAgentToolResultMiddleware(...)` ile kaydolmalıdır. Harici Plugin'ler
araç sonucu ara katmanı kaydedemez çünkü bu bağlantı noktası, model görmeden önce
yüksek güvenli araç çıktısını yeniden yazabilir.

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'leri
`contracts.externalAuthProviders` bildirmelidir. Bildirim olmadan çalışan Plugin'ler hâlâ
kullanımdan kaldırılmış bir uyumluluk geri dönüşü üzerinden çalışır, ancak bu geri dönüş daha yavaştır
ve geçiş dönemi sonrasında kaldırılacaktır.

Paketlenmiş bellek gömme sağlayıcıları, açığa çıkardıkları her bağdaştırıcı kimliği için
yerleşik `local` gibi bağdaştırıcılar dahil olmak üzere
`contracts.memoryEmbeddingProviders` bildirmelidir. Bağımsız CLI yolları, tam Gateway çalışma zamanı
sağlayıcıları kaydetmeden önce yalnızca sahip Plugin'i yüklemek için bu manifest
sözleşmesini kullanır.

## mediaUnderstandingProviderMetadata başvurusu

Bir medya anlama sağlayıcısının, genel çekirdek yardımcılarının çalışma zamanı yüklenmeden önce ihtiyaç duyduğu
varsayılan modellere, otomatik auth geri dönüş önceliğine veya yerel belge desteğine sahip olduğu durumlarda
`mediaUnderstandingProviderMetadata` kullanın. Anahtarlar ayrıca
`contracts.mediaUnderstandingProviders` içinde de bildirilmelidir.

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
| `defaultModels`        | `Record<string, string>`            | Yapılandırma bir model belirtmediğinde kullanılan yetenekten modele varsayılanlar. |
| `autoPriority`         | `Record<string, number>`            | Otomatik kimlik bilgisi tabanlı sağlayıcı geri dönüşünde daha düşük sayılar daha önce sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Sağlayıcının desteklediği yerel belge girdileri.                             |

## channelConfigs başvurusu

Bir kanal Plugin'i, çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma meta verisine ihtiyaç duyuyorsa
`channelConfigs` kullanın. Salt okunur kanal kurulum/durum keşfi, bir kurulum girdisi yoksa
veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildiriyorsa,
yapılandırılmış harici kanallar için bu meta veriyi doğrudan kullanabilir.

`channelConfigs`, Plugin manifest meta verisidir; yeni bir üst düzey kullanıcı yapılandırma
bölümü değildir. Kullanıcılar kanal örneklerini yine de `channels.<channel-id>` altında yapılandırır.
OpenClaw, Plugin çalışma zamanı kodu yürütülmeden önce hangi Plugin'in bu yapılandırılmış
kanala sahip olduğuna karar vermek için manifest meta verisini okur.

Bir kanal Plugin'i için `configSchema` ve `channelConfigs` farklı
yolları tanımlar:

- `configSchema`, `plugins.entries.<plugin-id>.config` değerini doğrular
- `channelConfigs.<channel-id>.schema`, `channels.<channel-id>` değerini doğrular

`channels[]` bildiren paketlenmemiş olmayan Plugin'ler, eşleşen
`channelConfigs` girdilerini de bildirmelidir. Bunlar olmadan OpenClaw yine de Plugin'i yükleyebilir, ancak
soğuk yol yapılandırma şeması, kurulum ve Control UI yüzeyleri kanalın sahip olduğu seçenek biçimini
Plugin çalışma zamanı yürütülene kadar bilemez.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` ve
`nativeSkillsAutoEnabled`, kanal çalışma zamanı yüklenmeden önce çalışan komut yapılandırma denetimleri için
statik `auto` varsayılanlarını bildirebilir. Paketlenmiş kanallar ayrıca
aynı varsayılanları, diğer paket sahipliğindeki kanal katalog meta verileriyle birlikte
`package.json#openclaw.channel.commands` üzerinden yayımlayabilir.

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

| Alan          | Tür                      | Anlamı                                                                                  |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Schema. Bildirilmiş her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucular/hassasiyet ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verisi hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                               |
| `commands`    | `object`                 | Çalışma zamanı öncesi yapılandırma denetimleri için statik yerel komut ve yerel Skills otomatik varsayılanları. |
| `preferOver`  | `string[]`               | Seçim yüzeylerinde bunun daha üstte yer alması gereken eski veya daha düşük öncelikli Plugin kimlikleri. |

### Başka bir kanal Plugin'ini değiştirme

Plugin'iniz, başka bir Plugin'in de sağlayabildiği bir kanal kimliği için tercih edilen sahipse `preferOver` kullanın. Yaygın durumlar arasında yeniden adlandırılmış bir Plugin kimliği, paketlenmiş bir Plugin'in yerini alan bağımsız bir Plugin veya yapılandırma uyumluluğu için aynı kanal kimliğini koruyan bakımlı bir çatal bulunur.

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
tercih edilen Plugin kimliğini dikkate alır. Daha düşük öncelikli Plugin yalnızca
paketlenmiş olduğu veya varsayılan olarak etkin olduğu için seçildiyse,
OpenClaw etkin çalışma zamanı yapılandırmasında bunu devre dışı bırakır; böylece bir Plugin
kanala ve araçlarına sahip olur. Açık kullanıcı seçimi yine önceliklidir: kullanıcı her iki Plugin'i de açıkça etkinleştirirse, OpenClaw bu seçimi korur ve
istenen Plugin kümesini sessizce değiştirmek yerine yinelenen kanal/araç tanılamaları bildirir.

`preferOver` alanını gerçekten aynı kanalı sağlayabilen Plugin kimlikleriyle sınırlı tutun.
Bu genel bir öncelik alanı değildir ve kullanıcı yapılandırma anahtarlarını yeniden adlandırmaz.

## modelSupport başvurusu

OpenClaw, Plugin çalışma zamanı yüklenmeden önce
`gpt-5.5` veya `claude-sonnet-4.6` gibi kısa model kimliklerinden sağlayıcı Plugin'inizi çıkarsamalıysa
`modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu öncelik sırasını uygular:

- açık `provider/model` başvuruları, sahip `providers` manifest meta verisini kullanır
- `modelPatterns`, `modelPrefixes` değerlerini geçersiz kılar
- paketlenmemiş bir Plugin ve paketlenmiş bir Plugin aynı anda eşleşirse, paketlenmemiş
  Plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                        |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine `startsWith` ile eşleştirilen önekler.                |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısa model kimliklerine karşı eşleştirilen regex kaynakları. |

## modelCatalog başvurusu

OpenClaw, Plugin çalışma zamanını yüklemeden önce sağlayıcı model meta verisini bilmeliyse
`modelCatalog` kullanın. Bu, sabit katalog satırları,
sağlayıcı takma adları, bastırma kuralları ve keşif modu için manifest sahipli kaynak yüzeyidir. Çalışma zamanı yenileme
yine sağlayıcı çalışma zamanı koduna aittir, ancak manifest çekirdeğe çalışma zamanının
ne zaman gerekli olduğunu bildirir.

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

| Alan           | Tür                                                      | Anlamı                                                                                                     |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Bu Plugin'in sahip olduğu sağlayıcı kimlikleri için katalog satırları. Anahtarlar ayrıca üst düzey `providers` içinde de görünmelidir. |
| `aliases`      | `Record<string, object>`                                 | Katalog veya bastırma planlaması için sahip olunan bir sağlayıcıya çözülmesi gereken sağlayıcı takma adları. |
| `suppressions` | `object[]`                                               | Bu Plugin'in sağlayıcıya özgü bir nedenle bastırdığı, başka bir kaynaktan gelen model satırları.         |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Sağlayıcı kataloğunun manifest meta verisinden okunup okunamayacağı, önbelleğe yenilenip yenilenemeyeceği veya çalışma zamanı gerektirip gerektirmediği. |

Sağlayıcı alanları:

| Alan      | Tür                      | Anlamı                                                               |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan temel URL. |
| `api`     | `ModelApi`               | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan API bağdaştırıcısı. |
| `headers` | `Record<string, string>` | Bu sağlayıcı kataloğu için geçerli isteğe bağlı statik başlıklar.    |
| `models`  | `object[]`               | Gerekli model satırları. `id` alanı olmayan satırlar yok sayılır.    |

Model alanları:

| Alan            | Tür                                                            | Anlamı                                                                      |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` öneki olmadan, sağlayıcıya yerel model kimliği.                 |
| `name`          | `string`                                                       | İsteğe bağlı görünen ad.                                                    |
| `api`           | `ModelApi`                                                     | İsteğe bağlı model başına API geçersiz kılması.                             |
| `baseUrl`       | `string`                                                       | İsteğe bağlı model başına temel URL geçersiz kılması.                       |
| `headers`       | `Record<string, string>`                                       | İsteğe bağlı model başına statik başlıklar.                                 |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modelin kabul ettiği kipler.                                                |
| `reasoning`     | `boolean`                                                      | Modelin reasoning davranışı sunup sunmadığı.                                |
| `contextWindow` | `number`                                                       | Yerel sağlayıcı bağlam penceresi.                                           |
| `contextTokens` | `number`                                                       | `contextWindow` değerinden farklıysa, isteğe bağlı etkin çalışma zamanı bağlam sınırı. |
| `maxTokens`     | `number`                                                       | Biliniyorsa en yüksek çıktı token sayısı.                                   |
| `cost`          | `object`                                                       | İsteğe bağlı, isteğe bağlı `tieredPricing` dahil olmak üzere milyon token başına USD fiyatlandırma. |
| `compat`        | `object`                                                       | OpenClaw model yapılandırma uyumluluğuyla eşleşen isteğe bağlı uyumluluk bayrakları. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listeleme durumu. Yalnızca satırın hiç görünmemesi gerekiyorsa bastırın.    |
| `statusReason`  | `string`                                                       | Kullanılamayan durumla birlikte gösterilen isteğe bağlı neden.              |
| `replaces`      | `string[]`                                                     | Bu modelin yerini aldığı eski sağlayıcıya yerel model kimlikleri.           |
| `replacedBy`    | `string`                                                       | Kullanımdan kaldırılmış satırlar için sağlayıcıya yerel yedek model kimliği. |
| `tags`          | `string[]`                                                     | Seçiciler ve filtreler tarafından kullanılan kararlı etiketler.             |

Çalışma zamanına özgü verileri `modelCatalog` içine koymayın. Bir sağlayıcının
tam model kümesini bilmek için hesap durumu, API isteği veya yerel süreç keşfi gerekiyorsa,
o sağlayıcıyı `discovery` içinde `refreshable` veya `runtime` olarak bildirin.

### OpenClaw Sağlayıcı Dizini

OpenClaw Sağlayıcı Dizini, Plugin'leri henüz yüklü olmayabilecek sağlayıcılar için
OpenClaw'a ait önizleme meta verisidir. Bir Plugin manifestinin parçası değildir.
Plugin manifestleri, yüklü Plugin yetki kaynağı olmaya devam eder. Sağlayıcı Dizini,
bir sağlayıcı Plugin'i yüklü olmadığında gelecekteki yüklenebilir sağlayıcı ve ön kurulum
model seçici yüzeylerinin tüketeceği dahili geri dönüş sözleşmesidir.

Katalog yetki sırası:

1. Kullanıcı yapılandırması.
2. Yüklü Plugin manifesti `modelCatalog`.
3. Açık yenilemeden gelen model katalog önbelleği.
4. OpenClaw Sağlayıcı Dizini önizleme satırları.

Sağlayıcı Dizini gizli bilgiler, etkin durum, çalışma zamanı hook'ları veya
canlı hesaba özgü model verisi içermemelidir. Önizleme katalogları Plugin manifestleriyle aynı
`modelCatalog` sağlayıcı satırı biçimini kullanır, ancak çalışma zamanı bağdaştırıcı alanları olan `api`,
`baseUrl`, fiyatlandırma veya uyumluluk bayrakları yüklü Plugin manifestiyle
bilinçli olarak uyumlu tutulmadığı sürece kararlı görüntüleme meta verileriyle sınırlı kalmalıdır.
Canlı `/models` keşfi olan sağlayıcılar, normal listeleme veya onboarding sırasında sağlayıcı API'lerini çağırmak yerine
yenilenmiş satırları açık model katalog önbellek yolu üzerinden yazmalıdır.

Sağlayıcı Dizini girdileri, Plugin'i çekirdekten çıkarılmış veya henüz yüklü olmayan sağlayıcılar için
yüklenebilir Plugin meta verisi de taşıyabilir. Bu meta veri, kanal katalog desenini yansıtır:
paket adı, npm kurulum özelliği, beklenen bütünlük ve düşük maliyetli auth-choice etiketleri,
yüklenebilir bir kurulum seçeneği göstermek için yeterlidir. Plugin yüklendikten sonra,
manifest kazanır ve o sağlayıcı için Sağlayıcı Dizini girdisi yok sayılır.

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` ve `webSearchProviders` alanlarını `contracts` altına taşımak için
`openclaw doctor --fix` kullanın; normal
manifest yükleme artık bu üst düzey alanları yetenek
sahipliği olarak ele almaz.

## Manifest ve package.json karşılaştırması

İki dosya farklı işler görür:

| Dosya                  | Kullanım amacı                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce var olması gereken keşif, yapılandırma doğrulaması, auth-choice meta verisi ve UI ipuçları            |
| `package.json`         | npm meta verisi, bağımlılık kurulumu ve giriş noktaları, kurulum engelleme, setup veya katalog meta verisi için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu Plugin kodunu yüklemeden önce bilmek zorundaysa, `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse, `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi Plugin meta verileri, `openclaw.plugin.json` yerine
bilinçli olarak `package.json` içindeki `openclaw` bloğu altında bulunur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Yerel Plugin giriş noktalarını bildirir. Plugin paket dizini içinde kalmalıdır.                                                                                                      |
| `openclaw.runtimeExtensions`                                      | Yüklü paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paket dizini içinde kalmalıdır.                                                           |
| `openclaw.setupEntry`                                             | Onboarding, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif yalnızca kurulum giriş noktası. Plugin paket dizini içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                      | Yüklü paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. Plugin paket dizini içinde kalmalıdır.                                                                   |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog meta verisi.                                                                                |
| `openclaw.channel.commands`                                       | Kanal çalışma zamanı yüklenmeden önce yapılandırma, denetim ve komut listesi yüzeylerinde kullanılan statik yerel komut ve yerel Skills otomatik varsayılan meta verisi.             |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden "yalnızca env ile kurulum zaten var mı?" sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyici meta verisi.                         |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden "zaten oturum açılmış bir şey var mı?" sorusunu yanıtlayabilen hafif kalıcı auth denetleyici meta verisi.                                     |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketlenmiş ve haricen yayımlanmış Plugin'ler için kurulum/güncelleme ipuçları.                                                                                                      |
| `openclaw.install.defaultChoice`                                  | Birden fazla kurulum kaynağı mevcut olduğunda tercih edilen kurulum yolu.                                                                                                             |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanan, desteklenen en düşük OpenClaw host sürümü.                                                                                        |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` gibi beklenen npm dağıtım bütünlük dizesi; kurulum ve güncelleme akışları alınan yapıtı buna karşı doğrular.                                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı bir paketlenmiş Plugin yeniden kurulum kurtarma yoluna izin verir.                                                                      |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal Plugin'inden önce yalnızca kurulum amaçlı kanal yüzeylerinin yüklenmesine izin verir.                                                                  |

Manifest meta verisi, sağlayıcı/kanal/kurulum seçeneklerinden hangilerinin
çalışma zamanı yüklenmeden önce onboarding içinde görüneceğini belirler. `package.json#openclaw.install`
ise onboarding'e, kullanıcı bu seçeneklerden birini seçtiğinde ilgili Plugin'in nasıl alınacağını veya etkinleştirileceğini söyler.
Kurulum ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, kurulum ve manifest
kayıt defteri yüklemesi sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler
eski host'larda Plugin'i atlar.

Kesin npm sürüm sabitlemesi zaten `npmSpec` içinde bulunur; örneğin
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmi harici katalog
girdileri, sabitlenmiş sürümle artık eşleşmeyen alınmış npm yapıtları varsa güncelleme akışları güvenli şekilde başarısız olsun diye
kesin özellikleri `expectedIntegrity` ile eşleştirmelidir.
Etkileşimli onboarding yine de, uyumluluk için
yalın paket adları ve dist-tag'ler dahil olmak üzere güvenilir kayıt defteri npm özellikleri sunar. Katalog tanılamaları
kesin, kayan, bütünlük sabitlenmiş, eksik bütünlük, paket adı uyumsuzluğu ve geçersiz varsayılan seçim kaynaklarını ayırt edebilir. Ayrıca
`expectedIntegrity` mevcut olduğu halde onu sabitleyebilecek geçerli bir npm kaynağı olmadığında
uyarı verirler.
`expectedIntegrity` mevcut olduğunda,
kurulum/güncelleme akışları bunu uygular; atlandığında kayıt defteri çözümlemesi
bütünlük sabitlemesi olmadan kaydedilir.

Kanal Plugin'leri, durum, kanal listesi
veya SecretRef taramalarının tam çalışma zamanını yüklemeden yapılandırılmış hesapları tanımlaması gerekiyorsa `openclaw.setupEntry` sağlamalıdır.
Kurulum girdisi kanal meta verisinin yanı sıra kurulum için güvenli yapılandırma,
durum ve gizli bilgiler bağdaştırıcılarını açığa çıkarmalıdır; ağ istemcileri, Gateway dinleyicileri ve
taşıma çalışma zamanlarını ana uzantı giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak
giriş noktası alanları için paket sınırı denetimlerini geçersiz kılmaz. Örneğin,
`openclaw.runtimeExtensions`, kaçan bir `openclaw.extensions` yolunu yüklenebilir hâle getiremez.

`openclaw.install.allowInvalidConfigRecovery` kasıtlı olarak dardır. Bu alan,
rastgele bozuk yapılandırmaları kurulabilir hâle getirmez. Bugün yalnızca kurulum
akışlarının belirli eski paketlenmiş Plugin yükseltme hatalarından kurtulmasına izin verir; örneğin
eksik bir paketlenmiş Plugin yolu veya aynı
paketlenmiş Plugin için eski bir `channels.<id>` girdisi. İlgisiz yapılandırma hataları yine de kurulumu engeller ve operatörleri
`openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici
modülü için paket meta verisidir:

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

Kurulum, doctor veya yapılandırılmış durum akışlarının, tam
kanal Plugin'i yüklenmeden önce düşük maliyetli bir evet/hayır auth
yoklamasına ihtiyaç duyduğu durumlarda bunu kullanın. Hedef dışa aktarma, yalnızca kalıcı durumu okuyan küçük bir
fonksiyon olmalıdır; bunu tam kanal çalışma zamanı varili üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca env
yapılandırılmış denetimleri için aynı şekli izler:

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

Bir kanal, yapılandırılmış durumu env veya diğer küçük
çalışma zamanı dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam yapılandırma çözümlemesi veya gerçek
kanal çalışma zamanı gerektiriyorsa, bunun yerine bu mantığı Plugin `config.hasConfiguredState`
hook'u içinde tutun.

## Keşif önceliği (yinelenen Plugin kimlikleri)

OpenClaw Plugin'leri birkaç kökten keşfeder (paketlenmiş, genel kurulum, çalışma alanı, açık yapılandırma ile seçilmiş yollar). İki keşif aynı `id` değerini paylaşıyorsa, yalnızca **en yüksek öncelikli** manifest korunur; daha düşük öncelikli kopyalar yanında yüklenmek yerine atılır.

En yüksekten en düşüğe öncelik:

1. **Yapılandırma ile seçilen** — `plugins.entries.<id>` içinde açıkça sabitlenmiş bir yol
2. **Paketlenmiş** — OpenClaw ile birlikte gelen Plugin'ler
3. **Genel kurulum** — genel OpenClaw Plugin köküne kurulmuş Plugin'ler
4. **Çalışma alanı** — mevcut çalışma alanına göre keşfedilen Plugin'ler

Sonuçlar:

- Çalışma alanında duran, çatallanmış veya eski bir paketlenmiş Plugin kopyası paketlenmiş derlemeyi gölgeleyemez.
- Paketlenmiş bir Plugin'i gerçekten yerel olanla geçersiz kılmak için, çalışma alanı keşfine güvenmek yerine öncelik kazansın diye onu `plugins.entries.<id>` üzerinden sabitleyin.
- Atılan yinelenenler günlüğe kaydedilir; böylece Doctor ve başlangıç tanılamaları atılan kopyayı gösterebilir.

## JSON Schema gereksinimleri

- **Her Plugin bir JSON Schema sağlamalıdır**, hiçbir yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma zamanında doğrulanır.

## Doğrulama davranışı

- Bilinmeyen `channels.*` anahtarları, kanal kimliği bir Plugin manifesti tarafından bildirilmediği sürece **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** Plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir Plugin yüklüyse ancak bozuk veya eksik bir manifesti ya da şeması varsa,
  doğrulama başarısız olur ve Doctor Plugin hatasını bildirir.
- Plugin yapılandırması mevcutsa ancak Plugin **devre dışıysa**, yapılandırma korunur ve
  Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için [Yapılandırma başvurusu](/tr/gateway/configuration) bölümüne bakın.

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw Plugin'leri için zorunludur**. Çalışma zamanı yine de Plugin modülünü ayrı olarak yükler; manifest yalnızca keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle son değer hâlâ bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyici yalnızca belgelenmiş manifest alanlarını okur. Özel üst düzey anahtarlardan kaçının.
- Bir Plugin bunlara ihtiyaç duymuyorsa `channels`, `providers`, `cliBackends` ve `skills` alanlarının tümü atlanabilir.
- `providerDiscoveryEntry` hafif kalmalıdır ve geniş çalışma zamanı kodu içe aktarmamalıdır; bunu istek zamanı yürütmesi için değil, statik sağlayıcı katalog meta verisi veya dar keşif tanımlayıcıları için kullanın.
- Ayrıcalıklı Plugin türleri `plugins.slots.*` üzerinden seçilir: `kind: "memory"` için `plugins.slots.memory`, `kind: "context-engine"` için `plugins.slots.contextEngine` (varsayılan `legacy`).
- Env-var meta verisi (`setup.providers[].envVars`, kullanımdan kaldırılmış `providerAuthEnvVars` ve `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, Cron teslim doğrulaması ve diğer salt okunur yüzeyler, bir env var'ı yapılandırılmış kabul etmeden önce yine de Plugin güveni ve etkin etkinleştirme ilkesini uygular.
- Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı meta verisi için [Sağlayıcı çalışma zamanı hook'ları](/tr/plugins/architecture-internals#provider-runtime-hooks) bölümüne bakın.
- Plugin'iniz yerel modüllere bağımlıysa, derleme adımlarını ve tüm paket yöneticisi izin listesi gereksinimlerini belgelendirin (örneğin pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## İlgili

<CardGroup cols={3}>
  <Card title="Plugin oluşturma" href="/tr/plugins/building-plugins" icon="rocket">
    Plugin'lere başlama.
  </Card>
  <Card title="Plugin mimarisi" href="/tr/plugins/architecture" icon="diagram-project">
    İç mimari ve yetenek modeli.
  </Card>
  <Card title="SDK genel bakış" href="/tr/plugins/sdk-overview" icon="book">
    Plugin SDK başvurusu ve alt yol içe aktarmaları.
  </Card>
</CardGroup>
