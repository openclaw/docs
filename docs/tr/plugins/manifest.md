---
read_when:
    - Bir OpenClaw Plugin'i oluşturuyorsunuz
    - Bir Plugin yapılandırma şeması yayımlamanız veya Plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şema gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin Manifesti
x-i18n:
    generated_at: "2026-04-19T01:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2dfc00759108ddee7bfcda8c42acf7f2d47451676447ba3caf8b5950f8a1c181
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

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan
`openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketlerde OpenClaw şu anda, düzen OpenClaw çalışma zamanı beklentileriyle
eşleştiğinde, paket metadatasını ve bildirilen skill köklerini, Claude komut
köklerini, Claude paketi `settings.json` varsayılanlarını, Claude paketi LSP
varsayılanlarını ve desteklenen hook paketlerini okur.

Her yerel OpenClaw Plugin'i **plugin kökünde** bir `openclaw.plugin.json`
dosyası yayımlamalıdır. OpenClaw bu manifesti, yapılandırmayı **plugin kodunu
çalıştırmadan** doğrulamak için kullanır. Eksik veya geçersiz manifestler
plugin hatası olarak değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam plugin sistemi kılavuzuna bakın: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve mevcut dış uyumluluk rehberi için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne işe yarar

`openclaw.plugin.json`, OpenClaw'ın plugin kodunuzu yüklemeden önce okuduğu
metadatadır.

Şunlar için kullanın:

- plugin kimliği
- yapılandırma doğrulaması
- plugin çalışma zamanını başlatmadan kullanılabilir olması gereken kimlik doğrulama ve onboarding metadatası
- kontrol düzlemi yüzeylerinin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli etkinleştirme ipuçları
- kurulum/onboarding yüzeylerinin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli kurulum tanımlayıcıları
- plugin çalışma zamanı yüklenmeden önce çözümlenmesi gereken takma ad ve otomatik etkinleştirme metadatası
- plugin'i çalışma zamanı yüklenmeden önce otomatik etkinleştirmesi gereken kısa model ailesi sahipliği metadatası
- paketlenmiş uyumluluk bağlama ve sözleşme kapsamı için kullanılan statik yetenek sahipliği anlık görüntüleri
- paylaşılan `openclaw qa` ana bilgisayarının plugin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli QA çalıştırıcı metadatası
- çalışma zamanını yüklemeden katalog ve doğrulama yüzeyleriyle birleştirilmesi gereken kanala özgü yapılandırma metadatası
- yapılandırma UI ipuçları

Şunlar için kullanmayın:

- çalışma zamanı davranışını kaydetmek
- kod giriş noktalarını bildirmek
- npm kurulum metadatası

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

| Alan                               | Gerekli | Tür                              | Anlamı                                                                                                                                                                                                       |
| ---------------------------------- | ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                               | Evet    | `string`                         | Kanonik plugin kimliği. Bu, `plugins.entries.<id>` içinde kullanılan kimliktir.                                                                                                                              |
| `configSchema`                     | Evet    | `object`                         | Bu plugin'in yapılandırması için satır içi JSON şeması.                                                                                                                                                      |
| `enabledByDefault`                 | Hayır   | `true`                           | Paketlenmiş bir plugin'i varsayılan olarak etkin işaretler. Plugin'in varsayılan olarak devre dışı kalması için bunu atlayın veya `true` dışındaki herhangi bir değere ayarlayın.                         |
| `legacyPluginIds`                  | Hayır   | `string[]`                       | Bu kanonik plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`| Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunlardan söz ettiğinde bu plugin'i otomatik etkinleştirmesi gereken provider kimlikleri.                                                            |
| `kind`                             | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan özel bir plugin türünü bildirir.                                                                                                                                     |
| `channels`                         | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                              |
| `providers`                        | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu provider kimlikleri.                                                                                                                                                               |
| `modelSupport`                     | Hayır   | `object`                         | Çalışma zamanından önce plugin'i otomatik yüklemek için kullanılan, manifeste ait kısa model ailesi metadatası.                                                                                             |
| `providerEndpoints`                | Hayır   | `object[]`                       | Provider çalışma zamanı yüklenmeden önce çekirdeğin sınıflandırması gereken provider yolları için manifeste ait uç nokta ana bilgisayar/baseUrl metadatası.                                                |
| `cliBackends`                      | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu CLI çıkarım backend kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                            |
| `syntheticAuthRefs`                | Hayır   | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında plugin'e ait sentetik kimlik doğrulama hook'unun yoklanması gereken provider veya CLI backend başvuruları.                                     |
| `nonSecretAuthMarkers`             | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketlenmiş plugin'e ait yer tutucu API anahtarı değerleri.                                                                    |
| `commandAliases`                   | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce plugin farkındalıklı yapılandırma ve CLI tanılamaları üretmesi gereken, bu plugin'in sahip olduğu komut adları.                                                            |
| `providerAuthEnvVars`              | Hayır   | `Record<string, string[]>`       | OpenClaw'ın plugin kodunu yüklemeden inceleyebileceği düşük maliyetli provider kimlik doğrulama ortam değişkeni metadatası.                                                                               |
| `providerAuthAliases`              | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir provider kimliğini yeniden kullanması gereken provider kimlikleri; örneğin temel provider API anahtarını ve kimlik doğrulama profillerini paylaşan bir coding provider. |
| `channelEnvVars`                   | Hayır   | `Record<string, string[]>`       | OpenClaw'ın plugin kodunu yüklemeden inceleyebileceği düşük maliyetli kanal ortam değişkeni metadatası. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam değişkeni güdümlü kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`              | Hayır   | `object[]`                       | Onboarding seçicileri, tercih edilen provider çözümlemesi ve basit CLI bayrağı bağlantısı için düşük maliyetli kimlik doğrulama seçeneği metadatası.                                                      |
| `activation`                       | Hayır   | `object`                         | Provider, komut, kanal, rota ve yetenek tetiklemeli yükleme için düşük maliyetli etkinleştirme ipuçları. Yalnızca metadata; gerçek davranışın sahibi yine plugin çalışma zamanıdır.                       |
| `setup`                            | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/onboarding tanımlayıcıları.                                                                     |
| `qaRunners`                        | Hayır   | `object[]`                       | Paylaşılan `openclaw qa` ana bilgisayarı tarafından plugin çalışma zamanı yüklenmeden önce kullanılan düşük maliyetli QA çalıştırıcı tanımlayıcıları.                                                     |
| `contracts`                        | Hayır   | `object`                         | Konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search ve araç sahipliği için statik paketlenmiş yetenek anlık görüntüsü. |
| `channelConfigs`                   | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, manifeste ait kanal yapılandırma metadatası.                                                                               |
| `skills`                           | Hayır   | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skills dizinleri.                                                                                                                                                |
| `name`                             | Hayır   | `string`                         | İnsan tarafından okunabilir plugin adı.                                                                                                                                                                      |
| `description`                      | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                    |
| `version`                          | Hayır   | `string`                         | Bilgilendirme amaçlı plugin sürümü.                                                                                                                                                                          |
| `uiHints`                          | Hayır   | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                             |

## `providerAuthChoices` başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçeneğini tanımlar.
OpenClaw bunu provider çalışma zamanı yüklenmeden önce okur.

| Alan                 | Gerekli | Tür                                             | Anlamı                                                                                                  |
| -------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`           | Evet    | `string`                                        | Bu seçeneğin ait olduğu provider kimliği.                                                               |
| `method`             | Evet    | `string`                                        | Yönlendirme yapılacak kimlik doğrulama yöntemi kimliği.                                                 |
| `choiceId`           | Evet    | `string`                                        | Onboarding ve CLI akışlarında kullanılan kararlı kimlik doğrulama seçeneği kimliği.                    |
| `choiceLabel`        | Hayır   | `string`                                        | Kullanıcıya dönük etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                           |
| `choiceHint`         | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                        |
| `assistantPriority`  | Hayır   | `number`                                        | Asistan güdümlü etkileşimli seçicilerde daha düşük değerler daha önce sıralanır.                       |
| `assistantVisibility`| Hayır   | `"visible"` \| `"manual-only"`                  | Elle CLI seçimine izin vermeye devam ederken seçeneği asistan seçicilerinden gizler.                   |
| `deprecatedChoiceIds`| Hayır   | `string[]`                                      | Kullanıcıları bu yerine geçen seçeneğe yönlendirmesi gereken eski seçenek kimlikleri.                  |
| `groupId`            | Hayır   | `string`                                        | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                            |
| `groupLabel`         | Hayır   | `string`                                        | Bu grup için kullanıcıya dönük etiket.                                                                  |
| `groupHint`          | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                          |
| `optionKey`          | Hayır   | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için dahili seçenek anahtarı.                             |
| `cliFlag`            | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                             |
| `cliOption`          | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                               |
| `cliDescription`     | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                     |
| `onboardingScopes`   | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçeneğin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan `["text-inference"]` olur. |

## `commandAliases` başvurusu

Kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök bir CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adı bir plugin'e aitse `commandAliases` kullanın. OpenClaw bu metadatayı, plugin çalışma zamanı kodunu içe aktarmadan tanılama için kullanır.

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
| `name`       | Evet    | `string`          | Bu plugin'e ait komut adı.                                                 |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök CLI komutu yerine sohbet eğik çizgi komutu olarak işaretler. |
| `cliCommand` | Hayır   | `string`          | Varsa, CLI işlemleri için önerilecek ilgili kök CLI komutu.                |

## `activation` başvurusu

Plugin hangi kontrol düzlemi olaylarının onu daha sonra etkinleştirmesi gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

## `qaRunners` başvurusu

Bir plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma çalıştırıcısı sağlıyorsa `qaRunners` kullanın. Bu metadatayı düşük maliyetli ve statik tutun; gerçek CLI kaydının sahibi yine `qaRunnerCliRegistrations` dışa aktaran hafif bir `runtime-api.ts` yüzeyi üzerinden plugin çalışma zamanıdır.

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

| Alan          | Gerekli | Tür      | Anlamı                                                                 |
| ------------- | ------- | -------- | ---------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altına bağlanan alt komut; örneğin `matrix`.             |
| `description` | Hayır   | `string` | Paylaşılan ana bilgisayarın bir taslak komuta ihtiyaç duyması durumunda kullanılan yedek yardım metni. |

Bu blok yalnızca metadatadır. Çalışma zamanı davranışını kaydetmez ve `register(...)`, `setupEntry` veya diğer çalışma zamanı/plugin giriş noktalarının yerini almaz. Mevcut tüketiciler bunu daha geniş plugin yüklemesinden önce bir daraltma ipucu olarak kullanır; bu nedenle eksik etkinleştirme metadatası genellikle yalnızca performans maliyeti doğurur. Eski manifest sahipliği geri dönüşleri hâlâ var olduğu sürece doğruluğu değiştirmemelidir.

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

| Alan             | Gerekli | Tür                                                  | Anlamı                                                                |
| ---------------- | ------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| `onProviders`    | Hayır   | `string[]`                                           | İstendiğinde bu plugin'i etkinleştirmesi gereken provider kimlikleri. |
| `onCommands`     | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken komut kimlikleri.                 |
| `onChannels`     | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken kanal kimlikleri.                 |
| `onRoutes`       | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken rota türleri.                     |
| `onCapabilities` | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. |

Mevcut canlı tüketiciler:

- komut tetiklemeli CLI planlaması, eski
  `commandAliases[].cliCommand` veya `commandAliases[].name`
  alanlarına geri döner
- kanal tetiklemeli kurulum/kanal planlaması, açık kanal etkinleştirme metadatası eksik olduğunda eski `channels[]`
  sahipliğine geri döner
- provider tetiklemeli kurulum/çalışma zamanı planlaması, açık provider
  etkinleştirme metadatası eksik olduğunda eski
  `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

## `setup` başvurusu

Kurulum ve onboarding yüzeyleri çalışma zamanı yüklenmeden önce plugin'e ait düşük maliyetli metadataya ihtiyaç duyduğunda `setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım backend'lerini tanımlamaya devam eder. `setup.cliBackends`, metadata-only kalması gereken kontrol düzlemi/kurulum akışları için kurulum özelinde tanımlayıcı yüzeydir.

Var olduğunda `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen descriptor-first arama yüzeyidir. Tanımlayıcı yalnızca aday plugin'i daraltıyorsa ve kurulum hâlâ daha zengin kurulum zamanı çalışma zamanı hook'larına ihtiyaç duyuyorsa, `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak `setup-api`'yi yerinde tutun.

Kurulum araması plugin'e ait `setup-api` kodunu çalıştırabildiğinden, normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen plugin'ler arasında benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine kapalı başarısız olur.

### `setup.providers` başvurusu

| Alan          | Gerekli | Tür        | Anlamı                                                                                         |
| ------------- | ------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `id`          | Evet    | `string`   | Kurulum veya onboarding sırasında açığa çıkan provider kimliği. Normalize edilmiş kimlikleri global olarak benzersiz tutun. |
| `authMethods` | Hayır   | `string[]` | Tam çalışma zamanını yüklemeden bu provider'ın desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`     | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin plugin çalışma zamanı yüklenmeden önce kontrol edebileceği ortam değişkenleri. |

### `setup` alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                                  |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve onboarding sırasında açığa çıkan provider kurulum tanımlayıcıları.                          |
| `cliBackends`      | Hayır   | `string[]` | Descriptor-first kurulum araması için kullanılan kurulum zamanı backend kimlikleri. Normalize edilmiş kimlikleri global olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu plugin'in kurulum yüzeyine ait yapılandırma geçişi kimlikleri.                                       |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.          |

## `uiHints` başvurusu

`uiHints`, yapılandırma alan adlarından küçük render ipuçlarına uzanan bir eşlemedir.

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
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler.|
| `placeholder` | `string`   | Form girdileri için yer tutucu metin.    |

## `contracts` başvurusu

`contracts` yalnızca OpenClaw'ın plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği metadatası için kullanılmalıdır.

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

| Alan                             | Tür        | Anlamı                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Bu plugin'in sahip olduğu konuşma provider kimlikleri.        |
| `realtimeTranscriptionProviders` | `string[]` | Bu plugin'in sahip olduğu gerçek zamanlı transkripsiyon provider kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu plugin'in sahip olduğu gerçek zamanlı ses provider kimlikleri. |
| `mediaUnderstandingProviders`    | `string[]` | Bu plugin'in sahip olduğu media-understanding provider kimlikleri. |
| `imageGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu image-generation provider kimlikleri. |
| `videoGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu video-generation provider kimlikleri. |
| `webFetchProviders`              | `string[]` | Bu plugin'in sahip olduğu web-fetch provider kimlikleri.      |
| `webSearchProviders`             | `string[]` | Bu plugin'in sahip olduğu web search provider kimlikleri.     |
| `tools`                          | `string[]` | Paketlenmiş sözleşme kontrolleri için bu plugin'in sahip olduğu agent araç adları. |

## `channelConfigs` başvurusu

Bir kanal plugin'i çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma metadatasına ihtiyaç duyduğunda `channelConfigs` kullanın.

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
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Her kanal girdisi şunları içerebilir:

| Alan          | Tür                      | Anlamı                                                                                   |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON şeması. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucular/hassasiyet ipuçları. |
| `label`       | `string`                 | Çalışma zamanı metadatası hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                |
| `preferOver`  | `string[]`               | Seçim yüzeylerinde bu kanalın önüne geçmesi gereken eski veya daha düşük öncelikli plugin kimlikleri. |

## `modelSupport` başvurusu

OpenClaw'ın, plugin çalışma zamanı yüklenmeden önce `gpt-5.4` veya `claude-sonnet-4.6` gibi kısa model kimliklerinden provider plugin'inizi çıkarsaması gerektiğinde `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu öncelik sırasını uygular:

- açık `provider/model` başvuruları, sahibi olan `providers` manifest metadatasını kullanır
- `modelPatterns`, `modelPrefixes`'i geçersiz kılar
- bir paketlenmemiş plugin ve bir paketlenmiş plugin aynı anda eşleşirse, paketlenmemiş plugin kazanır
- kullanıcı veya yapılandırma bir provider belirtinceye kadar kalan belirsizlik yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                        |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleştirilen ön ekler.         |
| `modelPatterns` | `string[]` | Profil soneki kaldırıldıktan sonra kısa model kimliklerine karşı eşleştirilen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` ve `webSearchProviders` alanlarını `contracts` altına taşımak için `openclaw doctor --fix` kullanın; normal manifest yüklemesi artık bu üst düzey alanları yetenek sahipliği olarak değerlendirmez.

## Manifest ve `package.json` karşılaştırması

Bu iki dosya farklı görevler görür:

| Dosya                  | Kullanım amacı                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce var olması gereken keşif, yapılandırma doğrulaması, kimlik doğrulama seçeneği metadatası ve UI ipuçları   |
| `package.json`         | npm metadatası, bağımlılık kurulumu ve giriş noktaları, kurulum geçitleme, kurulum veya katalog metadatası için kullanılan `openclaw` bloğu |

Bir metadata parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw'ın bunu plugin kodunu yüklemeden önce bilmesi gerekiyorsa, `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse, `package.json` içine koyun

### Keşfi etkileyen `package.json` alanları

Bazı çalışma zamanı öncesi plugin metadataları, `openclaw.plugin.json` yerine özellikle `package.json` içindeki `openclaw` bloğunda bulunur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Yerel plugin giriş noktalarını bildirir.                                                                                                    |
| `openclaw.setupEntry`                                             | Onboarding ve ertelenmiş kanal başlangıcı sırasında kullanılan hafif, yalnızca kurulum amaçlı giriş noktası.                              |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog metadatası.                                       |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden "yalnızca ortam değişkeniyle kurulum zaten var mı?" sorusuna yanıt verebilen hafif configured-state denetleyici metadatası. |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden "zaten oturum açılmış bir şey var mı?" sorusuna yanıt verebilen hafif persisted-auth denetleyici metadatası. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketlenmiş ve harici olarak yayımlanmış plugin'ler için kurulum/güncelleme ipuçları.                                                     |
| `openclaw.install.defaultChoice`                                  | Birden fazla kurulum kaynağı mevcut olduğunda tercih edilen kurulum yolu.                                                                  |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanan, desteklenen en düşük OpenClaw ana bilgisayar sürümü.                                   |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı bir paketlenmiş plugin yeniden kurulum kurtarma yoluna izin verir.                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal plugin'inden önce yalnızca kurulum amaçlı kanal yüzeylerinin yüklenmesine izin verir.                       |

`openclaw.install.minHostVersion`, kurulum ve manifest kayıt defteri yüklemesi sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler eski ana bilgisayarlarda plugin'i atlar.

`openclaw.install.allowInvalidConfigRecovery` bilerek dar kapsamlı tutulmuştur. Keyfi bozuk yapılandırmaları kurulabilir hâle getirmez. Bugün yalnızca, eksik paketlenmiş plugin yolu veya aynı paketlenmiş plugin için bayat bir `channels.<id>` girdisi gibi belirli bayat paketlenmiş plugin yükseltme hatalarından kurulum akışlarının kurtulmasına izin verir. İlişkisiz yapılandırma hataları yine kurulumu engeller ve operatörleri `openclaw doctor --fix` komutuna yönlendirir.

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

Kurulum, doctor veya configured-state akışlarının tam kanal plugin'i yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğu durumlarda bunu kullanın. Hedef dışa aktarma yalnızca kalıcı durumu okuyan küçük bir fonksiyon olmalıdır; bunu tam kanal çalışma zamanı barrel'ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca ortam değişkeniyle yapılandırılmış denetimleri için aynı biçimi izler:

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

Bir kanal configured-state durumunu ortam değişkenlerinden veya diğer küçük çalışma zamanı dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam yapılandırma çözümlemesine veya gerçek kanal çalışma zamanına ihtiyaç duyuyorsa, bu mantığı bunun yerine plugin `config.hasConfiguredState` hook'unda tutun.

## JSON şema gereksinimleri

- **Her plugin bir JSON şeması yayımlamalıdır**, yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (`{ "type": "object", "additionalProperties": false }` gibi).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.

## Doğrulama davranışı

- Kanal kimliği bir plugin manifesti tarafından bildirilmediği sürece bilinmeyen `channels.*` anahtarları **hata**dır.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hata**dır.
- Bir plugin kuruluysa ancak manifesti veya şeması bozuk ya da eksikse,
  doğrulama başarısız olur ve Doctor plugin hatasını bildirir.
- Plugin yapılandırması varsa ama plugin **devre dışıysa**, yapılandırma korunur ve
  Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration).

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil olmak üzere **yerel OpenClaw Plugin'leri** için **zorunludur**.
- Çalışma zamanı hâlâ plugin modülünü ayrı olarak yükler; manifest yalnızca
  keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle nihai değer hâlâ bir nesne olduğu sürece yorumlar, sondaki virgüller ve
  tırnaksız anahtarlar kabul edilir.
- Yalnızca belgelenmiş manifest alanları manifest yükleyici tarafından okunur. Buraya
  özel üst düzey anahtarlar eklemekten kaçının.
- `providerAuthEnvVars`, kimlik doğrulama yoklamaları, env-marker
  doğrulaması ve ortam değişkeni adlarını incelemek için plugin çalışma zamanını başlatmaması gereken benzer provider kimlik doğrulama yüzeyleri için düşük maliyetli metadata yoludur.
- `providerAuthAliases`, provider varyantlarının başka bir provider'ın kimlik doğrulama
  ortam değişkenlerini, kimlik doğrulama profillerini, yapılandırma destekli kimlik doğrulamayı ve API anahtarı onboarding seçeneğini
  çekirdekte bu ilişkiyi hardcode etmeden yeniden kullanmasına olanak tanır.
- `providerEndpoints`, provider plugin'lerinin basit endpoint host/baseUrl
  eşleştirme metadatasının sahibi olmasına olanak tanır. Bunu yalnızca çekirdeğin zaten desteklediği endpoint sınıfları için kullanın;
  çalışma zamanı davranışının sahibi yine plugin'dir.
- `syntheticAuthRefs`, çalışma zamanı
  kayıt defteri mevcut olmadan önce soğuk model keşfine görünür olması gereken, provider'a ait sentetik
  kimlik doğrulama hook'ları için düşük maliyetli metadata yoludur. Yalnızca çalışma zamanı provider'ı veya CLI backend'i gerçekten
  `resolveSyntheticAuth` uygulayan başvuruları listeleyin.
- `nonSecretAuthMarkers`, yerel, OAuth veya ortam kimlik bilgisi işaretçileri gibi, paketlenmiş plugin'e ait
  yer tutucu API anahtarları için düşük maliyetli metadata yoludur.
  Çekirdek, sahip provider'ı hardcode etmeden, kimlik doğrulama gösterimi ve gizli bilgi denetimlerinde bunları gizli olmayan değerler olarak ele alır.
- `channelEnvVars`, shell ortam değişkeni geri dönüşü, kurulum
  istemleri ve ortam değişkeni adlarını incelemek için plugin çalışma zamanını başlatmaması gereken benzer kanal yüzeyleri için düşük maliyetli metadata yoludur.
- `providerAuthChoices`, kimlik doğrulama seçeneği seçicileri,
  provider çalışma zamanı yüklenmeden önce `--auth-choice` çözümlemesi, tercih edilen provider eşlemesi ve basit onboarding
  CLI bayrağı kaydı için düşük maliyetli metadata yoludur. Provider kodu gerektiren çalışma zamanı sihirbazı
  metadatası için bkz.
  [Provider çalışma zamanı hook'ları](/tr/plugins/architecture#provider-runtime-hooks).
- Özel plugin türleri `plugins.slots.*` üzerinden seçilir.
  - `kind: "memory"`, `plugins.slots.memory` tarafından seçilir.
  - `kind: "context-engine"`, `plugins.slots.contextEngine`
    tarafından seçilir (varsayılan: yerleşik `legacy`).
- Bir plugin bunlara ihtiyaç duymuyorsa `channels`, `providers`, `cliBackends` ve `skills`
  atlanabilir.
- Plugin'iniz yerel modüllere bağımlıysa, derleme adımlarını ve tüm
  paket yöneticisi izin listesi gereksinimlerini belgelendirin (örneğin pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — plugin'lere başlarken
- [Plugin mimarisi](/tr/plugins/architecture) — dahili mimari
- [SDK genel bakış](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
