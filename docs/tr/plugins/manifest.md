---
read_when:
    - Bir OpenClaw plugin’i geliştiriyorsunuz
    - Bir plugin yapılandırma şeması yayımlamanız veya plugin doğrulama hatalarını ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin Manifesti
x-i18n:
    generated_at: "2026-04-22T04:24:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifesti (`openclaw.plugin.json`)

Bu sayfa yalnızca **yerel OpenClaw plugin manifesti** içindir.

Uyumlu paket düzenleri için bkz. [Plugin bundles](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşen düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan `openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda paket meta verilerini ve bildirilen
skill köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını,
Claude paketi LSP varsayılanlarını ve düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde desteklenen hook paketlerini okur.

Her yerel OpenClaw plugin’i, **plugin kökünde**
bir `openclaw.plugin.json` dosyası yayımlamak **zorundadır**. OpenClaw bu manifesti,
plugin kodunu **çalıştırmadan** yapılandırmayı doğrulamak için kullanır. Eksik veya geçersiz manifestler plugin hatası olarak değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam plugin sistemi kılavuzu için bkz.: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve mevcut dış uyumluluk rehberi için:
[Capability model](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw’un plugin kodunuzu yüklemeden önce okuduğu meta verilerdir.

Şunlar için kullanın:

- plugin kimliği
- yapılandırma doğrulaması
- plugin çalışma zamanını başlatmadan erişilebilir olması gereken kimlik doğrulama ve onboarding meta verileri
- denetim düzlemi yüzeylerinin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli etkinleştirme ipuçları
- kurulum/onboarding yüzeylerinin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli kurulum tanımlayıcıları
- plugin çalışma zamanı yüklenmeden önce çözümlenmesi gereken takma ad ve otomatik etkinleştirme meta verileri
- plugin’i çalışma zamanı yüklenmeden önce otomatik etkinleştirmesi gereken kısa model ailesi sahipliği meta verileri
- paketlenmiş uyumluluk bağlama ve sözleşme kapsamı için kullanılan statik yetenek sahipliği anlık görüntüleri
- paylaşılan `openclaw qa` hostunun plugin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli QA çalıştırıcı meta verileri
- çalışma zamanı yüklenmeden katalog ve doğrulama yüzeylerine birleştirilmesi gereken kanala özgü yapılandırma meta verileri
- yapılandırma UI ipuçları

Şunlar için kullanmayın:

- çalışma zamanı davranışı kaydetme
- kod giriş noktalarını bildirme
- npm kurulum meta verileri

Bunlar plugin kodunuza ve `package.json` dosyanıza aittir.

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
  "description": "OpenRouter sağlayıcı plugin’i",
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

| Alan                                | Gerekli | Tür                              | Anlamı                                                                                                                                                                                                      |
| ----------------------------------- | ------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Evet    | `string`                         | Kanonik plugin kimliği. Bu, `plugins.entries.<id>` içinde kullanılan kimliktir.                                                                                                                            |
| `configSchema`                      | Evet    | `object`                         | Bu plugin’in yapılandırması için satır içi JSON Şeması.                                                                                                                                                     |
| `enabledByDefault`                  | Hayır   | `true`                           | Paketlenmiş bir plugin’i varsayılan olarak etkin işaretler. Plugin’i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` dışındaki herhangi bir değeri ayarlayın.                         |
| `legacyPluginIds`                   | Hayır   | `string[]`                       | Bu kanonik plugin kimliğine normalleştirilen eski kimlikler.                                                                                                                                                |
| `autoEnableWhenConfiguredProviders` | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunlardan söz ettiğinde bu plugin’i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                          |
| `kind`                              | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan, birbirini dışlayan bir plugin türü bildirir.                                                                                                                      |
| `channels`                          | Hayır   | `string[]`                       | Bu plugin’e ait kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                        |
| `providers`                         | Hayır   | `string[]`                       | Bu plugin’e ait sağlayıcı kimlikleri.                                                                                                                                                                        |
| `modelSupport`                      | Hayır   | `object`                         | Çalışma zamanından önce plugin’i otomatik yüklemek için kullanılan, manifest sahipli kısa model ailesi meta verileri.                                                                                      |
| `providerEndpoints`                 | Hayır   | `object[]`                       | Çekirdeğin sağlayıcı çalışma zamanı yüklenmeden önce sınıflandırması gereken sağlayıcı yolları için manifest sahipli uç nokta host/baseUrl meta verileri.                                                  |
| `cliBackends`                       | Hayır   | `string[]`                       | Bu plugin’e ait CLI çıkarım arka ucu kimlikleri. Açık yapılandırma başvurularından başlangıç otomatik etkinleştirmesi için kullanılır.                                                                     |
| `syntheticAuthRefs`                 | Hayır   | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında plugin sahipli sentetik kimlik doğrulama hook’unun yoklanması gereken sağlayıcı veya CLI arka ucu başvuruları.                                |
| `nonSecretAuthMarkers`              | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketlenmiş plugin sahipli yer tutucu API anahtarı değerleri.                                                                   |
| `commandAliases`                    | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce plugin farkındalıklı yapılandırma ve CLI tanıları üretmesi gereken, bu plugin’e ait komut adları.                                                                          |
| `providerAuthEnvVars`               | Hayır   | `Record<string, string[]>`       | OpenClaw’un plugin kodunu yüklemeden inceleyebileceği düşük maliyetli sağlayıcı kimlik doğrulama env meta verileri.                                                                                        |
| `providerAuthAliases`               | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarı ve kimlik doğrulama profillerini paylaşan bir coding sağlayıcısı. |
| `channelEnvVars`                    | Hayır   | `Record<string, string[]>`       | OpenClaw’un plugin kodunu yüklemeden inceleyebileceği düşük maliyetli kanal env meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken env odaklı kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`               | Hayır   | `object[]`                       | Onboarding seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrak bağlama için düşük maliyetli kimlik doğrulama seçeneği meta verileri.                                                      |
| `activation`                        | Hayır   | `object`                         | Sağlayıcı, komut, kanal, rota ve yetenek tetiklemeli yükleme için düşük maliyetli etkinleştirme ipuçları. Yalnızca meta veri; gerçek davranış yine de plugin çalışma zamanına aittir.                    |
| `setup`                             | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/onboarding tanımlayıcıları.                                                                     |
| `qaRunners`                         | Hayır   | `object[]`                       | Paylaşılan `openclaw qa` hostunun plugin çalışma zamanı yüklenmeden önce kullandığı düşük maliyetli QA çalıştırıcı tanımlayıcıları.                                                                        |
| `contracts`                         | Hayır   | `object`                         | Konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya-anlama, görsel üretimi, müzik üretimi, video üretimi, web-fetch, web araması ve araç sahipliği için statik paketlenmiş yetenek anlık görüntüsü. |
| `channelConfigs`                    | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden keşif ve doğrulama yüzeylerine birleştirilen manifest sahipli kanal yapılandırma meta verileri.                                                                                |
| `skills`                            | Hayır   | `string[]`                       | Plugin köküne göre göreli yüklenecek Skills dizinleri.                                                                                                                                                      |
| `name`                              | Hayır   | `string`                         | İnsan tarafından okunabilir plugin adı.                                                                                                                                                                      |
| `description`                       | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                    |
| `version`                           | Hayır   | `string`                         | Bilgilendirici plugin sürümü.                                                                                                                                                                                |
| `uiHints`                           | Hayır   | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                             |

## providerAuthChoices başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçeneğini tanımlar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.

| Alan                  | Gerekli | Tür                                              | Anlamı                                                                                                    |
| --------------------- | ------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                         | Bu seçeneğin ait olduğu sağlayıcı kimliği.                                                                |
| `method`              | Evet    | `string`                                         | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                         |
| `choiceId`            | Evet    | `string`                                         | Onboarding ve CLI akışlarında kullanılan kararlı kimlik doğrulama seçeneği kimliği.                      |
| `choiceLabel`         | Hayır   | `string`                                         | Kullanıcıya dönük etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                             |
| `choiceHint`          | Hayır   | `string`                                         | Seçici için kısa yardımcı metin.                                                                          |
| `assistantPriority`   | Hayır   | `number`                                         | Aracı odaklı etkileşimli seçicilerde düşük değerler daha önce sıralanır.                                 |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                   | Elle CLI seçimine izin vermeye devam ederken seçeneği aracı seçicilerinden gizler.                       |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                       | Kullanıcıları bu yedek seçeneğe yönlendirmesi gereken eski seçenek kimlikleri.                           |
| `groupId`             | Hayır   | `string`                                         | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                              |
| `groupLabel`          | Hayır   | `string`                                         | Bu grup için kullanıcıya dönük etiket.                                                                    |
| `groupHint`           | Hayır   | `string`                                         | Grup için kısa yardımcı metin.                                                                            |
| `optionKey`           | Hayır   | `string`                                         | Basit tek bayraklı kimlik doğrulama akışları için iç seçenek anahtarı.                                   |
| `cliFlag`             | Hayır   | `string`                                         | `--openrouter-api-key` gibi CLI bayrağı adı.                                                              |
| `cliOption`           | Hayır   | `string`                                         | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                                |
| `cliDescription`      | Hayır   | `string`                                         | CLI yardımında kullanılan açıklama.                                                                       |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">`  | Bu seçeneğin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan `["text-inference"]` olur. |

## commandAliases başvurusu

Bir plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahipse `commandAliases` kullanın. OpenClaw bu meta verileri, plugin çalışma zamanı kodunu içe aktarmadan tanılar için kullanır.

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

| Alan         | Gerekli | Tür               | Anlamı                                                                    |
| ------------ | ------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu plugin’e ait komut adı.                                                |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök CLI komutu yerine bir sohbet slash komutu olarak işaretler. |
| `cliCommand` | Hayır   | `string`          | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.                |

## activation başvurusu

Plugin’in, hangi denetim düzlemi olaylarının onu daha sonra etkinleştirmesi gerektiğini düşük maliyetle bildirebildiği durumlarda `activation` kullanın.

## qaRunners başvurusu

Bir plugin, paylaşılan `openclaw qa` kökünün altında bir veya daha fazla taşıma çalıştırıcısı sağlıyorsa `qaRunners` kullanın. Bu meta verileri düşük maliyetli ve statik tutun; plugin çalışma zamanı yine de `qaRunnerCliRegistrations` dışa aktaran hafif bir `runtime-api.ts` yüzeyi üzerinden gerçek CLI kaydına sahip olur.

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

| Alan          | Gerekli | Tür      | Anlamı                                                                     |
| ------------- | ------- | -------- | -------------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altında bağlanan alt komut; örneğin `matrix`.               |
| `description` | Hayır   | `string` | Paylaşılan hostun bir stub komuta ihtiyaç duyduğunda kullandığı yedek yardım metni. |

Bu blok yalnızca meta veridir. Çalışma zamanı davranışı kaydetmez ve `register(...)`, `setupEntry` veya diğer çalışma zamanı/plugin giriş noktalarının yerini almaz.
Geçerli tüketiciler bunu daha geniş plugin yüklemesinden önce daraltıcı bir ipucu olarak kullanır; dolayısıyla eksik etkinleştirme meta verileri genellikle yalnızca performans maliyeti doğurur. Eski manifest sahipliği yedekleri hâlâ varken doğruluğu değiştirmemelidir.

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

| Alan             | Gerekli | Tür                                                  | Anlamı                                                                  |
| ---------------- | ------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `onProviders`    | Hayır   | `string[]`                                           | İstendiğinde bu plugin’i etkinleştirmesi gereken sağlayıcı kimlikleri.  |
| `onCommands`     | Hayır   | `string[]`                                           | Bu plugin’i etkinleştirmesi gereken komut kimlikleri.                   |
| `onChannels`     | Hayır   | `string[]`                                           | Bu plugin’i etkinleştirmesi gereken kanal kimlikleri.                   |
| `onRoutes`       | Hayır   | `string[]`                                           | Bu plugin’i etkinleştirmesi gereken rota türleri.                       |
| `onCapabilities` | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Denetim düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. |

Mevcut canlı tüketiciler:

- komut tetiklemeli CLI planlaması eski
  `commandAliases[].cliCommand` veya `commandAliases[].name` değerine geri düşer
- kanal tetiklemeli kurulum/kanal planlaması, açık kanal etkinleştirme meta verisi eksik olduğunda eski `channels[]`
  sahipliğine geri düşer
- sağlayıcı tetiklemeli kurulum/çalışma zamanı planlaması, açık sağlayıcı
  etkinleştirme meta verisi eksik olduğunda eski `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri düşer

## setup başvurusu

Kurulum ve onboarding yüzeyleri, çalışma zamanı yüklenmeden önce plugin sahipli düşük maliyetli meta verilere ihtiyaç duyduğunda `setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım arka uçlarını tanımlamaya devam eder. `setup.cliBackends`, yalnızca meta veri olarak kalması gereken denetim düzlemi/kurulum akışları için kurulum odaklı tanımlayıcı yüzeyidir.

Varsa, `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday plugin’i daraltıyorsa ve kurulum hâlâ daha zengin kurulum zamanı çalışma zamanı hook’larına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak `setup-api` öğesini yerinde bırakın.

Kurulum araması plugin sahipli `setup-api` kodunu çalıştırabildiğinden, normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen plugin’ler arasında genel olarak benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine güvenli biçimde kapatılır.

### setup.providers başvurusu

| Alan          | Gerekli | Tür        | Anlamı                                                                                   |
| ------------- | ------- | ---------- | ---------------------------------------------------------------------------------------- |
| `id`          | Evet    | `string`   | Kurulum veya onboarding sırasında sunulan sağlayıcı kimliği. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods` | Hayır   | `string[]` | Tam çalışma zamanını yüklemeden bu sağlayıcının desteklediği kurulum/kimlik doğrulama yöntemleri. |
| `envVars`     | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin plugin çalışma zamanı yüklenmeden önce kontrol edebileceği env değişkenleri. |

### setup alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                          |
| ------------------ | ------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve onboarding sırasında sunulan sağlayıcı kurulum tanımlayıcıları.                      |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kullanılan kurulum zamanı arka uç kimlikleri. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu plugin’in kurulum yüzeyine ait yapılandırma geçiş kimlikleri.                                |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.  |

## uiHints başvurusu

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

## contracts başvurusu

`contracts` öğesini yalnızca OpenClaw’un plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği meta verileri için kullanın.

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

| Alan                             | Tür        | Anlamı                                                     |
| -------------------------------- | ---------- | ---------------------------------------------------------- |
| `speechProviders`                | `string[]` | Bu plugin’e ait konuşma sağlayıcısı kimlikleri.            |
| `realtimeTranscriptionProviders` | `string[]` | Bu plugin’e ait gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu plugin’e ait gerçek zamanlı ses sağlayıcısı kimlikleri. |
| `mediaUnderstandingProviders`    | `string[]` | Bu plugin’e ait medya-anlama sağlayıcısı kimlikleri.       |
| `imageGenerationProviders`       | `string[]` | Bu plugin’e ait görsel üretimi sağlayıcısı kimlikleri.     |
| `videoGenerationProviders`       | `string[]` | Bu plugin’e ait video üretimi sağlayıcısı kimlikleri.      |
| `webFetchProviders`              | `string[]` | Bu plugin’e ait web-fetch sağlayıcısı kimlikleri.          |
| `webSearchProviders`             | `string[]` | Bu plugin’e ait web araması sağlayıcısı kimlikleri.        |
| `tools`                          | `string[]` | Paketlenmiş sözleşme denetimleri için bu plugin’e ait aracı araç adları. |

## channelConfigs başvurusu

Bir kanal plugin’i, çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma meta verilerine ihtiyaç duyduğunda `channelConfigs` kullanın.

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

| Alan          | Tür                      | Anlamı                                                                                     |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | `channels.<id>` için JSON Şeması. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucular/hassas ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verisi hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                  |
| `preferOver`  | `string[]`               | Seçim yüzeylerinde bunun önüne geçmesi gereken eski veya düşük öncelikli plugin kimlikleri. |

## modelSupport başvurusu

OpenClaw’un, plugin çalışma zamanı yüklenmeden önce `gpt-5.4` veya `claude-sonnet-4.6` gibi kısa model kimliklerinden sağlayıcı plugin’inizi çıkarsamasını istiyorsanız `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu önceliği uygular:

- açık `provider/model` başvuruları sahip `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes` üzerinde önceliklidir
- hem paketlenmemiş bir plugin hem de paketlenmiş bir plugin eşleşirse, paketlenmemiş plugin kazanır
- geri kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                      |
| --------------- | ---------- | --------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleşen önekler.             |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısa model kimliklerine karşı eşleşen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` ve `webSearchProviders` alanlarını `contracts` altına taşımak için `openclaw doctor --fix` kullanın; normal
manifest yükleme artık bu üst düzey alanları yetenek sahipliği olarak ele almaz.

## Manifest ile package.json karşılaştırması

Bu iki dosya farklı görevler görür:

| Dosya                  | Şunun için kullanın                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Keşif, yapılandırma doğrulaması, kimlik doğrulama seçeneği meta verileri ve plugin kodu çalışmadan önce var olması gereken UI ipuçları |
| `package.json`         | npm meta verileri, bağımlılık kurulumu ve giriş noktaları, kurulum geçitlemesi, setup veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu plugin kodunu yüklemeden önce bilmek zorundaysa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi plugin meta verileri, `openclaw.plugin.json` yerine kasten `package.json` içindeki
`openclaw` bloğu altında bulunur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Yerel plugin giriş noktalarını bildirir. Plugin paket dizini içinde kalmak zorundadır.                                                                                               |
| `openclaw.runtimeExtensions`                                      | Kurulu paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paket dizini içinde kalmak zorundadır.                                                  |
| `openclaw.setupEntry`                                             | Onboarding, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif yalnızca-kurulum giriş noktası. Plugin paket dizini içinde kalmak zorundadır. |
| `openclaw.runtimeSetupEntry`                                      | Kurulu paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. Plugin paket dizini içinde kalmak zorundadır.                                                           |
| `openclaw.channel`                                                | Etiketler, doküman yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog meta verileri.                                                                            |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden "yalnızca env tabanlı kurulum zaten var mı?" sorusunu cevaplayabilen hafif configured-state checker meta verileri.                           |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden "zaten oturum açılmış bir şey var mı?" sorusunu cevaplayabilen hafif persisted-auth checker meta verileri.                                    |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketlenmiş ve dışarıda yayımlanmış plugin’ler için kurulum/güncelleme ipuçları.                                                                                                     |
| `openclaw.install.defaultChoice`                                  | Birden fazla kurulum kaynağı olduğunda tercih edilen kurulum yolu.                                                                                                                   |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanan, desteklenen en düşük OpenClaw host sürümü.                                                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı bir paketlenmiş-plugin yeniden kurulum kurtarma yoluna izin verir.                                                                      |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal plugin’inden önce yalnızca-kurulum kanal yüzeylerinin yüklenmesine izin verir.                                                                         |

`openclaw.install.minHostVersion`, kurulum ve manifest kayıt defteri yükleme sırasında zorlanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler eski host’larda plugin’i atlar.

Kanal plugin’leri, durum, kanal listesi veya SecretRef taramalarının tam çalışma zamanını yüklemeden yapılandırılmış hesapları tanımlaması gerektiğinde `openclaw.setupEntry` sağlamalıdır. Kurulum girdisi kanal meta verilerini ve kurulum için güvenli yapılandırma, durum ve sır bağdaştırıcılarını sunmalıdır; ağ istemcilerini, gateway dinleyicilerini ve taşıma çalışma zamanlarını ana uzantı giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanları için paket sınırı denetimlerini geçersiz kılmaz. Örneğin `openclaw.runtimeExtensions`, sınır dışına kaçan bir `openclaw.extensions` yolunu yüklenebilir hâle getiremez.

`openclaw.install.allowInvalidConfigRecovery` kasten dardır. Keyfi bozuk yapılandırmaları kurulabilir hâle getirmez. Bugün yalnızca eksik paketlenmiş plugin yolu veya aynı paketlenmiş plugin için bayat `channels.<id>` girdisi gibi belirli bayat paketlenmiş-plugin yükseltme hatalarından kurulum akışlarının kurtulmasına izin verir. İlgisiz yapılandırma hataları yine de kurulumu engeller ve operatörleri `openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir checker modülü için paket meta verisidir:

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

Bunu, setup, doctor veya configured-state akışlarının tam kanal plugin’i yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğu durumlarda kullanın. Hedef dışa aktarım yalnızca kalıcı durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel’ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca-env configured denetimleri için aynı biçimi izler:

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

Bunu, bir kanal configured-state bilgisini env veya başka küçük çalışma zamanı dışı girdilerden cevaplayabiliyorsa kullanın. Denetim tam yapılandırma çözümlemesi veya gerçek kanal çalışma zamanı gerektiriyorsa, bu mantığı bunun yerine plugin `config.hasConfiguredState` hook’u içinde tutun.

## Keşif önceliği (yinelenen plugin kimlikleri)

OpenClaw, plugin’leri birkaç kökten keşfeder (paketlenmiş, genel kurulum, çalışma alanı, açık yapılandırmayla seçilmiş yollar). İki keşif aynı `id` değerini paylaşıyorsa yalnızca **en yüksek öncelikli** manifest tutulur; daha düşük öncelikli yinelenenler yanında yüklenmek yerine düşürülür.

Öncelik, yüksekten düşüğe:

1. **Yapılandırmayla seçilen** — `plugins.entries.<id>` içinde açıkça sabitlenmiş bir yol
2. **Paketlenmiş** — OpenClaw ile gelen plugin’ler
3. **Genel kurulum** — genel OpenClaw plugin köküne kurulmuş plugin’ler
4. **Çalışma alanı** — geçerli çalışma alanına göre keşfedilen plugin’ler

Sonuçlar:

- Çalışma alanında duran, çatallanmış veya bayat bir paketlenmiş plugin kopyası paketlenmiş derlemeyi gölgeleyemez.
- Paketlenmiş bir plugin’i yerel bir kopyayla gerçekten geçersiz kılmak için, çalışma alanı keşfine güvenmek yerine öncelikle kazanması amacıyla onu `plugins.entries.<id>` üzerinden sabitleyin.
- Yinelenen düşürmeler günlüğe kaydedilir; böylece Doctor ve başlangıç tanıları elenen kopyaya işaret edebilir.

## JSON Şeması gereksinimleri

- **Her plugin bir JSON Şeması yayımlamak zorundadır**, hiçbir yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.

## Doğrulama davranışı

- Plugin manifesti tarafından kanal kimliği bildirilmediği sürece bilinmeyen `channels.*` anahtarları **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir plugin kuruluysa ama manifesti veya şeması bozuksa ya da eksikse,
  doğrulama başarısız olur ve Doctor plugin hatasını bildirir.
- Plugin yapılandırması varsa ama plugin **devre dışıysa**, yapılandırma korunur ve
  Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Configuration reference](/tr/gateway/configuration).

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw plugin’leri için zorunludur**.
- Çalışma zamanı yine de plugin modülünü ayrı olarak yükler; manifest yalnızca
  keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; dolayısıyla son değer hâlâ bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyicisi yalnızca belgelenmiş manifest alanlarını okur. Buraya
  özel üst düzey anahtarlar eklemekten kaçının.
- `providerAuthEnvVars`, kimlik doğrulama yoklamaları, env-marker
  doğrulaması ve env adlarını incelemek için plugin çalışma zamanını başlatmaması gereken benzer sağlayıcı kimlik doğrulama yüzeyleri için düşük maliyetli meta veri yoludur.
- `providerAuthAliases`, sağlayıcı varyantlarının başka bir sağlayıcının kimlik doğrulama
  env değişkenlerini, kimlik doğrulama profillerini, yapılandırma destekli kimlik doğrulamayı ve API anahtarlı onboarding seçeneğini çekirdeğe bu ilişkiyi sabit kodlamadan yeniden kullanmasına izin verir.
- `providerEndpoints`, sağlayıcı plugin’lerinin basit uç nokta host/baseUrl
  eşleştirme meta verilerine sahip olmasını sağlar. Bunu yalnızca çekirdeğin zaten desteklediği uç nokta sınıfları için kullanın; çalışma zamanı davranışı yine de plugin’e aittir.
- `syntheticAuthRefs`, çalışma zamanı kayıt defteri oluşmadan önce soğuk model keşfi için görünür olması gereken sağlayıcı sahipli sentetik
  kimlik doğrulama hook’ları için düşük maliyetli meta veri yoludur. Yalnızca çalışma zamanı sağlayıcısı veya CLI arka ucu gerçekten `resolveSyntheticAuth` uygulayan başvuruları listeleyin.
- `nonSecretAuthMarkers`, yerel, OAuth veya ortam kimlik bilgisi işaretçileri gibi paketlenmiş plugin sahipli
  yer tutucu API anahtarları için düşük maliyetli meta veri yoludur.
  Çekirdek, sahip sağlayıcıyı sabit kodlamadan bunları kimlik doğrulama gösterimi ve sır denetimleri için gizli olmayan değerler olarak ele alır.
- `channelEnvVars`, env adlarını incelemek için plugin çalışma zamanını başlatmaması gereken shell-env yedeği, setup
  istemleri ve benzeri kanal yüzeyleri için düşük maliyetli meta veri yoludur. Env adları meta veridir, tek başlarına etkinleştirme değildir: durum, denetim, Cron teslim doğrulaması ve diğer salt okunur
  yüzeyler, bir env değişkenini yapılandırılmış kanal olarak kabul etmeden önce yine de plugin güveni ve etkili etkinleştirme ilkesini uygular.
- `providerAuthChoices`, sağlayıcı çalışma zamanı yüklenmeden önce kimlik doğrulama seçeneği seçicileri,
  `--auth-choice` çözümlemesi, tercih edilen sağlayıcı eşlemesi ve basit onboarding
  CLI bayrağı kaydı için düşük maliyetli meta veri yoludur. Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı
  meta verileri için bkz.
  [Provider runtime hooks](/tr/plugins/architecture#provider-runtime-hooks).
- Birbirini dışlayan plugin türleri `plugins.slots.*` üzerinden seçilir.
  - `kind: "memory"` değeri `plugins.slots.memory` tarafından seçilir.
  - `kind: "context-engine"` değeri `plugins.slots.contextEngine`
    tarafından seçilir (varsayılan: yerleşik `legacy`).
- Bir plugin bunlara ihtiyaç duymuyorsa `channels`, `providers`, `cliBackends` ve `skills`
  atlanabilir.
- Plugin’iniz yerel modüllere bağımlıysa derleme adımlarını ve tüm
  paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## İlgili

- [Building Plugins](/tr/plugins/building-plugins) — plugin’lerle başlamaya giriş
- [Plugin Architecture](/tr/plugins/architecture) — iç mimari
- [SDK Overview](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
