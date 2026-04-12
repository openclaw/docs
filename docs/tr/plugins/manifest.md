---
read_when:
    - Bir OpenClaw Plugin’i oluşturuyorsunuz
    - Bir Plugin yapılandırma şeması yayımlamanız veya Plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifest’i + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin Manifesti
x-i18n:
    generated_at: "2026-04-12T23:28:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b57c7373e4ccd521b10945346db67991543bd2bed4cc8b6641e1f215b48579
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifesti (`openclaw.plugin.json`)

Bu sayfa yalnızca **yerel OpenClaw Plugin manifesti** içindir.

Uyumlu paket düzenleri için bkz. [Plugin paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşen
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik olarak algılar, ancak bunlar burada açıklanan
`openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda, düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde
paket meta verilerini ve bildirilen skill köklerini, Claude komut köklerini, Claude paketi
`settings.json` varsayılanlarını, Claude paketi LSP varsayılanlarını ve desteklenen hook paketlerini okur.

Her yerel OpenClaw Plugin’i, **Plugin kökünde** bir `openclaw.plugin.json` dosyası
**bulundurmalıdır**. OpenClaw bu manifesti, yapılandırmayı **Plugin kodunu çalıştırmadan**
doğrulamak için kullanır. Eksik veya geçersiz manifestler Plugin hatası olarak değerlendirilir
ve yapılandırma doğrulamasını engeller.

Tam Plugin sistemi kılavuzu için bkz.: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve güncel dış uyumluluk rehberi için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw’ın Plugin kodunuzu yüklemeden önce okuduğu
meta veridir.

Bunu şunlar için kullanın:

- Plugin kimliği
- yapılandırma doğrulaması
- Plugin çalışma zamanını başlatmadan kullanılabilir olması gereken kimlik doğrulama ve onboarding meta verileri
- çalışma zamanı yüklenmeden önce kontrol düzlemi yüzeylerinin inceleyebileceği düşük maliyetli etkinleştirme ipuçları
- çalışma zamanı yüklenmeden önce kurulum/onboarding yüzeylerinin inceleyebileceği düşük maliyetli kurulum tanımlayıcıları
- Plugin çalışma zamanı yüklenmeden önce çözülmesi gereken takma ad ve otomatik etkinleştirme meta verileri
- çalışma zamanı yüklenmeden önce Plugin’i otomatik etkinleştirmesi gereken kısa model ailesi sahiplik meta verileri
- paketli uyumluluk bağlama ve sözleşme kapsamı için kullanılan statik yetenek sahipliği anlık görüntüleri
- çalışma zamanı yüklenmeden katalog ve doğrulama yüzeyleriyle birleştirilmesi gereken kanala özgü yapılandırma meta verileri
- yapılandırma UI ipuçları

Bunu şunlar için kullanmayın:

- çalışma zamanı davranışını kaydetmek
- kod giriş noktalarını bildirmek
- npm kurulum meta verileri

Bunlar Plugin kodunuzda ve `package.json` dosyasında yer almalıdır.

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

## Zengin örnek

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider Plugin’i",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
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

| Alan                                | Gerekli | Tür                              | Anlamı                                                                                                                                                                                                       |
| ----------------------------------- | ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Evet    | `string`                         | Kanonik Plugin kimliği. Bu, `plugins.entries.<id>` içinde kullanılan kimliktir.                                                                                                                             |
| `configSchema`                      | Evet    | `object`                         | Bu Plugin’in yapılandırması için satır içi JSON şeması.                                                                                                                                                      |
| `enabledByDefault`                  | Hayır   | `true`                           | Paketli bir Plugin’i varsayılan olarak etkin işaretler. Plugin’i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` dışındaki herhangi bir değeri ayarlayın.                              |
| `legacyPluginIds`                   | Hayır   | `string[]`                       | Bu kanonik Plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders` | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunlardan bahsettiğinde bu Plugin’i otomatik etkinleştirmesi gereken provider kimlikleri.                                                            |
| `kind`                              | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan, münhasır bir Plugin türünü bildirir.                                                                                                                               |
| `channels`                          | Hayır   | `string[]`                       | Bu Plugin’in sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                              |
| `providers`                         | Hayır   | `string[]`                       | Bu Plugin’in sahip olduğu provider kimlikleri.                                                                                                                                                               |
| `modelSupport`                      | Hayır   | `object`                         | Çalışma zamanından önce Plugin’i otomatik yüklemek için kullanılan, manifest sahipli kısa model ailesi meta verileri.                                                                                       |
| `cliBackends`                       | Hayır   | `string[]`                       | Bu Plugin’in sahip olduğu CLI çıkarım backend kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                            |
| `commandAliases`                    | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce Plugin farkındalıklı yapılandırma ve CLI tanıları üretmesi gereken, bu Plugin’in sahip olduğu komut adları.                                                                 |
| `providerAuthEnvVars`               | Hayır   | `Record<string, string[]>`       | OpenClaw’ın Plugin kodunu yüklemeden inceleyebileceği, düşük maliyetli provider kimlik doğrulama env meta verileri.                                                                                        |
| `providerAuthAliases`               | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir provider kimliğini yeniden kullanması gereken provider kimlikleri; örneğin temel provider API anahtarını ve kimlik doğrulama profillerini paylaşan bir coding provider. |
| `channelEnvVars`                    | Hayır   | `Record<string, string[]>`       | OpenClaw’ın Plugin kodunu yüklemeden inceleyebileceği, düşük maliyetli kanal env meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken env güdümlü kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`               | Hayır   | `object[]`                       | Onboarding seçicileri, tercih edilen provider çözümlemesi ve basit CLI flag bağlaması için düşük maliyetli kimlik doğrulama seçeneği meta verileri.                                                       |
| `activation`                        | Hayır   | `object`                         | Provider, komut, kanal, rota ve yetenek tetiklemeli yükleme için düşük maliyetli etkinleştirme ipuçları. Yalnızca meta veridir; gerçek davranış yine de Plugin çalışma zamanına aittir.                   |
| `setup`                             | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin Plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/onboarding tanımlayıcıları.                                                                      |
| `contracts`                         | Hayır   | `object`                         | Konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, media-understanding, görsel üretimi, müzik üretimi, video üretimi, web-fetch, web araması ve araç sahipliği için statik paketli yetenek anlık görüntüsü. |
| `channelConfigs`                    | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, manifest sahipli kanal yapılandırma meta verileri.                                                                          |
| `skills`                            | Hayır   | `string[]`                       | Plugin köküne göreli olarak yüklenecek Skills dizinleri.                                                                                                                                                     |
| `name`                              | Hayır   | `string`                         | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                      |
| `description`                       | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                    |
| `version`                           | Hayır   | `string`                         | Bilgilendirici Plugin sürümü.                                                                                                                                                                                |
| `uiHints`                           | Hayır   | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                             |

## `providerAuthChoices` başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçeneğini tanımlar.
OpenClaw bunu provider çalışma zamanı yüklenmeden önce okur.

| Alan                  | Gerekli | Tür                                             | Anlamı                                                                                                  |
| --------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                        | Bu seçeneğin ait olduğu provider kimliği.                                                               |
| `method`              | Evet    | `string`                                        | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                       |
| `choiceId`            | Evet    | `string`                                        | Onboarding ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçeneği kimliği.            |
| `choiceLabel`         | Hayır   | `string`                                        | Kullanıcıya dönük etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                           |
| `choiceHint`          | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                        |
| `assistantPriority`   | Hayır   | `number`                                        | Daha düşük değerler, assistant güdümlü etkileşimli seçicilerde daha önce sıralanır.                    |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                  | Manuel CLI seçimine yine izin verirken seçeneği assistant seçicilerinden gizler.                       |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                      | Kullanıcıları bu yedek seçenek yerine yönlendirmesi gereken eski seçenek kimlikleri.                   |
| `groupId`             | Hayır   | `string`                                        | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                           |
| `groupLabel`          | Hayır   | `string`                                        | Bu grup için kullanıcıya dönük etiket.                                                                  |
| `groupHint`           | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                          |
| `optionKey`           | Hayır   | `string`                                        | Basit tek flag’li kimlik doğrulama akışları için dahili seçenek anahtarı.                              |
| `cliFlag`             | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI flag adı.                                                               |
| `cliOption`           | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                               |
| `cliDescription`      | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                     |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçeneğin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan `["text-inference"]` olur. |

## `commandAliases` başvurusu

Bir Plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya
kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahipse
`commandAliases` kullanın. OpenClaw bu meta verileri, Plugin çalışma zamanı kodunu içe aktarmadan
tanılar için kullanır.

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

| Alan         | Gerekli | Tür              | Anlamı                                                                      |
| ------------ | ------- | ---------------- | --------------------------------------------------------------------------- |
| `name`       | Evet    | `string`         | Bu Plugin’e ait komut adı.                                                  |
| `kind`       | Hayır   | `"runtime-slash"`| Takma adı, kök CLI komutu yerine sohbet slash komutu olarak işaretler.      |
| `cliCommand` | Hayır   | `string`         | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.                  |

## `activation` başvurusu

Plugin daha sonra hangi kontrol düzlemi olaylarının onu etkinleştirmesi
gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

Bu blok yalnızca meta veridir. Çalışma zamanı davranışı kaydetmez ve
`register(...)`, `setupEntry` veya diğer çalışma zamanı/Plugin giriş noktalarının yerine geçmez.
Mevcut tüketiciler bunu daha geniş Plugin yüklemesinden önce daraltıcı bir ipucu olarak kullanır; bu nedenle
eksik etkinleştirme meta verileri genellikle yalnızca performans maliyeti doğurur;
eski manifest sahipliği geri dönüşleri hâlâ mevcutken doğruluğu değiştirmemelidir.

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

| Alan             | Gerekli | Tür                                                  | Anlamı                                                              |
| ---------------- | ------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `onProviders`    | Hayır   | `string[]`                                           | İstendiğinde bu Plugin’i etkinleştirmesi gereken provider kimlikleri. |
| `onCommands`     | Hayır   | `string[]`                                           | Bu Plugin’i etkinleştirmesi gereken komut kimlikleri.               |
| `onChannels`     | Hayır   | `string[]`                                           | Bu Plugin’i etkinleştirmesi gereken kanal kimlikleri.               |
| `onRoutes`       | Hayır   | `string[]`                                           | Bu Plugin’i etkinleştirmesi gereken rota türleri.                   |
| `onCapabilities` | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. |

Güncel canlı tüketiciler:

- komut tetiklemeli CLI planlaması, eski
  `commandAliases[].cliCommand` veya `commandAliases[].name` alanlarına geri döner
- kanal tetiklemeli kurulum/kanal planlaması, açık kanal etkinleştirme meta verileri eksik olduğunda
  eski `channels[]`
  sahipliğine geri döner
- provider tetiklemeli kurulum/çalışma zamanı planlaması, açık provider
  etkinleştirme meta verileri eksik olduğunda eski
  `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

## `setup` başvurusu

Kurulum ve onboarding yüzeylerinin çalışma zamanı yüklenmeden önce Plugin’e ait düşük maliyetli meta verilere
ihtiyacı varsa `setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım
backend’lerini tanımlamaya devam eder. `setup.cliBackends`, yalnızca meta veri olarak kalması gereken
kontrol düzlemi/kurulum akışları için kurulum odaklı tanımlayıcı yüzeyidir.

Mevcut olduğunda, `setup.providers` ve `setup.cliBackends`,
kurulum keşfi için tercih edilen önce tanımlayıcı yaklaşımına sahip arama yüzeyidir. Tanımlayıcı yalnızca
aday Plugin’i daraltıyorsa ve kurulum yine de daha zengin kurulum zamanı çalışma zamanı
hook’larına ihtiyaç duyuyorsa, `requiresRuntime: true` ayarlayın ve
yedek yürütme yolu olarak `setup-api`’yi yerinde tutun.

Kurulum araması Plugin’e ait `setup-api` kodunu çalıştırabildiği için,
normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri,
keşfedilen Plugin’ler arasında benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından
bir kazanan seçmek yerine güvenli şekilde başarısız olur.

### `setup.providers` başvurusu

| Alan          | Gerekli | Tür        | Anlamı                                                                                 |
| ------------- | ------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Evet    | `string`   | Kurulum veya onboarding sırasında açığa çıkan provider kimliği. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods` | Hayır   | `string[]` | Bu provider’ın tam çalışma zamanı yüklenmeden desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`     | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden önce kontrol edebileceği env değişkenleri. |

### `setup` alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                             |
| ------------------ | ------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve onboarding sırasında açığa çıkan provider kurulum tanımlayıcıları.                      |
| `cliBackends`      | Hayır   | `string[]` | Önce tanımlayıcı yaklaşımına sahip kurulum araması için kullanılan kurulum zamanı backend kimlikleri. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin’in kurulum yüzeyine ait yapılandırma geçiş kimlikleri.                                   |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.      |

## `uiHints` başvurusu

`uiHints`, yapılandırma alan adlarından küçük işleme ipuçlarına giden bir eşlemedir.

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
| `label`       | `string`   | Kullanıcıya dönük alan etiketi.         |
| `help`        | `string`   | Kısa yardımcı metin.                    |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.             |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.        |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girdileri için yer tutucu metin.   |

## `contracts` başvurusu

OpenClaw’ın Plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği
meta verileri için yalnızca `contracts` kullanın.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
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

| Alan                             | Tür        | Anlamı                                                      |
| -------------------------------- | ---------- | ----------------------------------------------------------- |
| `speechProviders`                | `string[]` | Bu Plugin’in sahip olduğu speech provider kimlikleri.       |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin’in sahip olduğu gerçek zamanlı transkripsiyon provider kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin’in sahip olduğu gerçek zamanlı ses provider kimlikleri. |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin’in sahip olduğu media-understanding provider kimlikleri. |
| `imageGenerationProviders`       | `string[]` | Bu Plugin’in sahip olduğu görsel üretimi provider kimlikleri. |
| `videoGenerationProviders`       | `string[]` | Bu Plugin’in sahip olduğu video üretimi provider kimlikleri. |
| `webFetchProviders`              | `string[]` | Bu Plugin’in sahip olduğu web-fetch provider kimlikleri.    |
| `webSearchProviders`             | `string[]` | Bu Plugin’in sahip olduğu web araması provider kimlikleri.  |
| `tools`                          | `string[]` | Paketli sözleşme kontrolleri için bu Plugin’in sahip olduğu ajan araç adları. |

## `channelConfigs` başvurusu

Bir kanal Plugin’i, çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma meta verilerine ihtiyaç duyuyorsa
`channelConfigs` kullanın.

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
      "description": "Matrix homeserver bağlantısı",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Her kanal girdisi şunları içerebilir:

| Alan          | Tür                      | Anlamı                                                                                  |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON şeması. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucuları/hassas ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeyleriyle birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                               |
| `preferOver`  | `string[]`               | Bu kanalın seçim yüzeylerinde önüne geçmesi gereken eski veya daha düşük öncelikli Plugin kimlikleri. |

## `modelSupport` başvurusu

OpenClaw’ın, Plugin çalışma zamanı yüklenmeden önce `gpt-5.4` veya `claude-sonnet-4.6` gibi
kısa model kimliklerinden provider Plugin’inizi çıkarması gerekiyorsa
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

- açık `provider/model` başvuruları, sahip olan `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes`’in önüne geçer
- paketlenmemiş bir Plugin ile paketli bir Plugin aynı anda eşleşirse, paketlenmemiş
  Plugin kazanır
- kullanıcı veya yapılandırma bir provider belirtinceye kadar kalan belirsizlik yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                       |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleştirilen önekler.         |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısa model kimliklerine karşı eşleştirilen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` ve `webSearchProviders` alanlarını `contracts` altına
taşımak için `openclaw doctor --fix` kullanın; normal manifest yükleme artık bu üst düzey alanları
yetenek sahipliği olarak değerlendirmez.

## Manifest ve `package.json`

Bu iki dosya farklı amaçlara hizmet eder:

| Dosya                  | Kullanım amacı                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Keşif, yapılandırma doğrulaması, kimlik doğrulama seçeneği meta verileri ve Plugin kodu çalışmadan önce bulunması gereken UI ipuçları |
| `package.json`         | npm meta verileri, bağımlılık kurulumu ve giriş noktaları, kurulum engelleme, setup veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu Plugin kodunu yüklemeden önce bilmek zorundaysa, `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışı ile ilgiliyse, `package.json` içine koyun

### Keşfi etkileyen `package.json` alanları

Bazı çalışma zamanı öncesi Plugin meta verileri, `openclaw.plugin.json` yerine
özellikle `package.json` içindeki `openclaw` bloğunda bulunur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Yerel Plugin giriş noktalarını bildirir.                                                                                                     |
| `openclaw.setupEntry`                                             | Onboarding ve ertelenmiş kanal başlatma sırasında kullanılan hafif, yalnızca kurulum amaçlı giriş noktası.                                 |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog meta verileri.                                     |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden “yalnızca env tabanlı kurulum zaten mevcut mu?” sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyicisi meta verileri. |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden “zaten oturum açılmış herhangi bir şey var mı?” sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama durumu denetleyicisi meta verileri. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketli ve dışarıda yayımlanmış Plugin’ler için kurulum/güncelleme ipuçları.                                                                |
| `openclaw.install.defaultChoice`                                  | Birden fazla kurulum kaynağı mevcut olduğunda tercih edilen kurulum yolu.                                                                   |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver tabanı kullanan, desteklenen en düşük OpenClaw host sürümü.                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı bir paketli Plugin yeniden kurulum kurtarma yoluna izin verir.                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal Plugin’inden önce yalnızca kurulum amaçlı kanal yüzeylerinin yüklenmesine izin verir.                        |

`openclaw.install.minHostVersion`, kurulum ve manifest
kayıt defteri yükleme sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler
eski host’larda Plugin’i atlar.

`openclaw.install.allowInvalidConfigRecovery` özellikle dar kapsamlıdır. Bu,
rastgele bozuk yapılandırmaları kurulabilir hâle getirmez. Bugün yalnızca kurulum
akışlarının, belirli eski paketli Plugin yükseltme hatalarından kurtulmasına izin verir; örneğin eksik
bir paketli Plugin yolu veya aynı paketli Plugin için eski bir `channels.<id>` girdisi.
İlgisiz yapılandırma hataları yine de kurulumu engeller ve operatörleri
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

Kurulum, doctor veya yapılandırılmış durum akışları, tam kanal Plugin’i yüklenmeden önce
düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğunda bunu kullanın. Hedef dışa aktarım,
yalnızca kalıcı durumu okuyan küçük bir fonksiyon olmalıdır; bunu tam
kanal çalışma zamanı barrel’i üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca env tabanlı
yapılandırılmış durum kontrolleri için aynı biçimi izler:

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

Bir kanal, yapılandırılmış durumu env’den veya diğer küçük
çalışma zamanı dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam yapılandırma çözümlemesi veya gerçek
kanal çalışma zamanı gerektiriyorsa, bunun yerine bu mantığı Plugin `config.hasConfiguredState`
hook’unda tutun.

## JSON şeması gereksinimleri

- **Her Plugin bir JSON şeması bulundurmalıdır**, hiçbir yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma zamanında doğrulanır.

## Doğrulama davranışı

- Plugin manifesti tarafından kanal kimliği bildirilmedikçe, bilinmeyen `channels.*` anahtarları **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** Plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir Plugin kurulmuşsa ancak manifesti veya şeması bozuk ya da eksikse,
  doğrulama başarısız olur ve Doctor Plugin hatasını bildirir.
- Plugin yapılandırması varsa ancak Plugin **devre dışıysa**, yapılandırma korunur ve
  Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration).

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw Plugin’leri için zorunludur**.
- Çalışma zamanı yine de Plugin modülünü ayrı olarak yükler; manifest yalnızca
  keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle son değer hâlâ bir nesne olduğu sürece
  yorumlar, sondaki virgüller ve
  tırnaksız anahtarlar kabul edilir.
- Manifest yükleyicisi yalnızca belgelenmiş manifest alanlarını okur. Buraya
  özel üst düzey anahtarlar eklemekten kaçının.
- `providerAuthEnvVars`, kimlik doğrulama yoklamaları, env işaretleyici
  doğrulaması ve env adlarını incelemek için Plugin çalışma zamanını başlatmaması gereken
  benzer provider kimlik doğrulama yüzeyleri için düşük maliyetli meta veri yoludur.
- `providerAuthAliases`, provider varyantlarının başka bir provider’ın kimlik doğrulama
  env değişkenlerini, kimlik doğrulama profillerini, yapılandırma destekli kimlik doğrulamayı ve API anahtarı onboarding seçeneğini
  bu ilişkiyi core içinde sabit kodlamadan yeniden kullanmasına izin verir.
- `channelEnvVars`, kabuk env geri dönüşü, kurulum
  istemleri ve env adlarını incelemek için Plugin çalışma zamanını başlatmaması gereken
  benzer kanal yüzeyleri için düşük maliyetli meta veri yoludur.
- `providerAuthChoices`, kimlik doğrulama seçeneği seçicileri,
  `--auth-choice` çözümlemesi, tercih edilen provider eşlemesi ve basit onboarding
  CLI flag kaydı için provider çalışma zamanı yüklenmeden önce kullanılan düşük maliyetli meta veri yoludur. Provider kodu gerektiren
  çalışma zamanı sihirbazı meta verileri için bkz.
  [Provider çalışma zamanı hook’ları](/tr/plugins/architecture#provider-runtime-hooks).
- Münhasır Plugin türleri `plugins.slots.*` üzerinden seçilir.
  - `kind: "memory"` değeri `plugins.slots.memory` tarafından seçilir.
  - `kind: "context-engine"` değeri `plugins.slots.contextEngine`
    tarafından seçilir (varsayılan: yerleşik `legacy`).
- Bir Plugin bunlara ihtiyaç duymuyorsa `channels`, `providers`, `cliBackends` ve `skills`
  atlanabilir.
- Plugin’iniz yerel modüllere bağlıysa, derleme adımlarını ve
  tüm paket yöneticisi izin listesi gereksinimlerini belgelendirin (örneğin pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## İlgili

- [Plugin Oluşturma](/tr/plugins/building-plugins) — Plugin’lere başlarken
- [Plugin Mimarisi](/tr/plugins/architecture) — iç mimari
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
