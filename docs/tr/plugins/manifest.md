---
read_when:
    - Bir OpenClaw Plugin'i geliştiriyorsunuz
    - Bir Plugin yapılandırma şeması yayımlamanız veya Plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifest'i + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin manifest'i
x-i18n:
    generated_at: "2026-04-24T09:21:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

Bu sayfa yalnızca **yerel OpenClaw Plugin manifest'i** içindir.

Uyumlu paket düzenleri için bkz. [Plugin bundles](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşeni
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan
`openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda paket üst verilerini, bildirilen
skill köklerini, Claude komut köklerini, Claude paket `settings.json` varsayılanlarını,
Claude paket LSP varsayılanlarını ve düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde
desteklenen hook paketlerini okur.

Her yerel OpenClaw Plugin'i, **Plugin kökünde**
bir `openclaw.plugin.json` dosyası yayımlamak **zorundadır**. OpenClaw bu manifest'i
Plugin kodunu **çalıştırmadan** yapılandırmayı doğrulamak için kullanır. Eksik veya
geçersiz manifest'ler Plugin hatası olarak değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam Plugin sistemi kılavuzu için bkz.: [Plugin'ler](/tr/tools/plugin).
Yerel yetenek modeli ve geçerli dış uyumluluk rehberliği için:
[Capability model](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'ın **Plugin kodunuzu yüklemeden önce**
okuduğu üst veridir. Aşağıdaki her şey, Plugin çalışma zamanını başlatmadan
incelemeye yetecek kadar hafif olmalıdır.

**Şunlar için kullanın:**

- Plugin kimliği, yapılandırma doğrulaması ve yapılandırma UI ipuçları
- auth, ilk katılım ve kurulum üst verileri (takma ad, otomatik etkinleştirme, sağlayıcı ortam değişkenleri, auth seçimleri)
- denetim düzlemi yüzeyleri için etkinleştirme ipuçları
- kısayol model ailesi sahipliği
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` host'un inceleyebileceği QA çalıştırıcı üst verileri
- katalog ve doğrulama yüzeyleriyle birleştirilen kanala özgü yapılandırma üst verileri

**Şunlar için kullanmayın:** çalışma zamanı davranışı kaydetme, kod giriş noktaları bildirme
veya npm kurulum üst verileri. Bunlar Plugin kodunuza ve `package.json` dosyasına aittir.

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

| Alan                                 | Gerekli | Tür                              | Anlamı                                                                                                                                                                                                                            |
| ------------------------------------ | ------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Evet    | `string`                         | Kanonik Plugin kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                                                                   |
| `configSchema`                       | Evet    | `object`                         | Bu Plugin'in yapılandırması için satır içi JSON Şeması.                                                                                                                                                                         |
| `enabledByDefault`                   | Hayır   | `true`                           | Paketlenmiş bir Plugin'i varsayılan olarak etkin işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` dışındaki herhangi bir değeri ayarlayın.                                             |
| `legacyPluginIds`                    | Hayır   | `string[]`                       | Bu kanonik Plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunlardan bahsettiğinde bu Plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                |
| `kind`                               | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan özel bir Plugin türü bildirir.                                                                                                                                                          |
| `channels`                           | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                                |
| `providers`                          | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu sağlayıcı kimlikleri.                                                                                                                                                                                |
| `providerDiscoveryEntry`             | Hayır   | `string`                         | Sağlayıcı keşfi için, tam Plugin çalışma zamanını etkinleştirmeden yüklenebilen manifest kapsamlı sağlayıcı katalog üst verileri için Plugin köküne göreli hafif modül yolu.                                                  |
| `modelSupport`                       | Hayır   | `object`                         | Çalışma zamanından önce Plugin'i otomatik yüklemek için kullanılan manifest'e ait kısayol model ailesi üst verisi.                                                                                                            |
| `providerEndpoints`                  | Hayır   | `object[]`                       | Çekirdeğin sağlayıcı çalışma zamanı yüklenmeden önce sınıflandırması gereken sağlayıcı rotaları için manifest'e ait uç nokta host/baseUrl üst verisi.                                                                         |
| `cliBackends`                        | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu CLI çıkarım arka uç kimlikleri. Açık yapılandırma başvurularından başlangıç otomatik etkinleştirmesi için kullanılır.                                                                              |
| `syntheticAuthRefs`                  | Hayır   | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında Plugin'e ait sentetik auth kancasının yoklanması gereken sağlayıcı veya CLI arka uç başvuruları.                                                                  |
| `nonSecretAuthMarkers`               | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketlenmiş Plugin'e ait yer tutucu API anahtarı değerleri.                                                                                        |
| `commandAliases`                     | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce Plugin farkındalıklı yapılandırma ve CLI tanılamaları üretmesi gereken, bu Plugin'in sahibi olduğu komut adları.                                                                              |
| `providerAuthEnvVars`                | Hayır   | `Record<string, string[]>`       | OpenClaw'ın Plugin kodunu yüklemeden inceleyebileceği ucuz sağlayıcı auth ortam üst verisi.                                                                                                                                    |
| `providerAuthAliases`                | Hayır   | `Record<string, string>`         | Auth araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve auth profillerini paylaşan bir kodlama sağlayıcısı.                                 |
| `channelEnvVars`                     | Hayır   | `Record<string, string[]>`       | OpenClaw'ın Plugin kodunu yüklemeden inceleyebileceği ucuz kanal ortam üst verisi. Genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam güdümlü kanal kurulumu veya auth yüzeyleri için bunu kullanın.          |
| `providerAuthChoices`                | Hayır   | `object[]`                       | İlk katılım seçicileri, tercih edilen sağlayıcı çözümleme ve basit CLI bayrak bağlama için ucuz auth seçimi üst verisi.                                                                                                      |
| `activation`                         | Hayır   | `object`                         | Sağlayıcı, komut, kanal, rota ve yetenek tetiklemeli yükleme için ucuz etkinleştirme planlayıcı üst verisi. Yalnızca üst veri; gerçek davranış yine de Plugin çalışma zamanına aittir.                                       |
| `setup`                              | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin Plugin çalışma zamanını yüklemeden inceleyebileceği ucuz kurulum/ilk katılım tanımlayıcıları.                                                                                                  |
| `qaRunners`                          | Hayır   | `object[]`                       | Plugin çalışma zamanı yüklenmeden önce paylaşılan `openclaw qa` host'u tarafından kullanılan ucuz QA çalıştırıcı tanımlayıcıları.                                                                                            |
| `contracts`                          | Hayır   | `object`                         | Dış auth kancaları, speech, gerçek zamanlı transcription, gerçek zamanlı ses, medya anlama, görüntü üretimi, müzik üretimi, video üretimi, web-fetch, web search ve araç sahipliği için statik paketlenmiş yetenek anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için ucuz medya anlama varsayılanları.                                                                                                        |
| `channelConfigs`                     | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeylerine birleştirilen manifest'e ait kanal yapılandırma üst verisi.                                                                                                   |
| `skills`                             | Hayır   | `string[]`                       | Plugin köküne göreli olarak yüklenecek Skills dizinleri.                                                                                                                                                                        |
| `name`                               | Hayır   | `string`                         | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                                          |
| `description`                        | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                        |
| `version`                            | Hayır   | `string`                         | Bilgilendirici Plugin sürümü.                                                                                                                                                                                                    |
| `uiHints`                            | Hayır   | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                 |

## providerAuthChoices başvurusu

Her `providerAuthChoices` girdisi bir ilk katılım veya auth seçimini tanımlar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.

| Alan                  | Gerekli | Tür                                             | Anlamı                                                                                                  |
| --------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | Evet    | `string`                                        | Bu seçimin ait olduğu sağlayıcı kimliği.                                                               |
| `method`              | Evet    | `string`                                        | Yönlendirilecek auth yöntem kimliği.                                                                   |
| `choiceId`            | Evet    | `string`                                        | İlk katılım ve CLI akışları tarafından kullanılan kararlı auth-seçimi kimliği.                        |
| `choiceLabel`         | Hayır   | `string`                                        | Kullanıcıya dönük etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                          |
| `choiceHint`          | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                       |
| `assistantPriority`   | Hayır   | `number`                                        | Asistan güdümlü etkileşimli seçicilerde daha düşük değerler daha önce sıralanır.                     |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                  | Seçimi asistan seçicilerinden gizler ama manuel CLI seçimine yine de izin verir.                      |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                      | Kullanıcıları bu yeni seçimle yeniden yönlendirmesi gereken eski seçim kimlikleri.                    |
| `groupId`             | Hayır   | `string`                                        | İlgili seçimleri gruplamak için isteğe bağlı grup kimliği.                                            |
| `groupLabel`          | Hayır   | `string`                                        | Bu grup için kullanıcıya dönük etiket.                                                                |
| `groupHint`           | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                         |
| `optionKey`           | Hayır   | `string`                                        | Basit tek bayraklı auth akışları için dahili seçenek anahtarı.                                        |
| `cliFlag`             | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                           |
| `cliOption`           | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek şekli.                                              |
| `cliDescription`      | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                   |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçimin hangi ilk katılım yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan `["text-inference"]` olur. |

## commandAliases başvurusu

Bir Plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahipse `commandAliases` kullanın. OpenClaw
bu üst veriyi Plugin çalışma zamanı kodunu içe aktarmadan tanılama için kullanır.

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
| `name`       | Evet    | `string`          | Bu Plugin'e ait komut adı.                                                |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök CLI komutu yerine sohbet slash komutu olarak işaretler.    |
| `cliCommand` | Hayır   | `string`          | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.                |

## activation başvurusu

Plugin'in hangi denetim düzlemi olaylarının onu etkinleştirme/yükleme planına dahil etmesi gerektiğini
ucuz şekilde bildirebildiği durumlarda `activation` kullanın.

Bu blok bir planlayıcı üst verisidir, yaşam döngüsü API'si değildir. Çalışma zamanı davranışını kaydetmez,
`register(...)` yerine geçmez ve Plugin kodunun
zaten çalıştırıldığını garanti etmez. Etkinleştirme planlayıcısı bu alanları,
`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` ve hooks gibi mevcut manifest sahiplik
üst verilerine geri dönmeden önce aday Plugin'leri daraltmak için kullanır.

Sahipliği zaten tanımlayan en dar üst veriyi tercih edin. Bu ilişkiyi
bu alanlar ifade ediyorsa `providers`, `channels`, `commandAliases`, kurulum tanımlayıcıları veya `contracts`
kullanın. Bu sahiplik alanlarıyla temsil edilemeyen ek planlayıcı
ipuçları için `activation` kullanın.

Bu blok yalnızca üst veridir. Çalışma zamanı davranışını kaydetmez ve
`register(...)`, `setupEntry` veya diğer çalışma zamanı/Plugin giriş noktalarının yerine geçmez.
Geçerli tüketiciler bunu daha geniş Plugin yüklemesinden önce bir daraltma ipucu olarak kullanır; bu yüzden
eksik etkinleştirme üst verisi genellikle yalnızca performans maliyeti doğurur; eski manifest
sahiplik geri dönüşleri hâlâ mevcutken doğruluğu değiştirmemelidir.

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

| Alan             | Gerekli | Tür                                                  | Anlamı                                                                                                     |
| ---------------- | ------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                   |
| `onCommands`     | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                       |
| `onChannels`     | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                       |
| `onRoutes`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                           |
| `onCapabilities` | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Denetim düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin. |

Geçerli canlı tüketiciler:

- komut tetiklemeli CLI planlaması, eski
  `commandAliases[].cliCommand` veya `commandAliases[].name`
  değerlerine geri döner
- kanal tetiklemeli kurulum/kanal planlaması, açık kanal etkinleştirme üst verisi eksik olduğunda eski `channels[]`
  sahipliğine geri döner
- sağlayıcı tetiklemeli kurulum/çalışma zamanı planlaması, açık sağlayıcı
  etkinleştirme üst verisi eksik olduğunda eski
  `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

Planlayıcı tanılamaları, açık etkinleştirme ipuçlarını manifest
sahiplik geri dönüşünden ayırt edebilir. Örneğin, `activation-command-hint`
`activation.onCommands` eşleşmesi anlamına gelirken, `manifest-command-alias`
planlayıcının bunun yerine `commandAliases` sahipliğini kullandığı anlamına gelir. Bu neden etiketleri
host tanılamaları ve testler içindir; Plugin yazarları yine de
sahipliği en iyi açıklayan üst veriyi bildirmeye devam etmelidir.

## qaRunners başvurusu

Bir Plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma çalıştırıcısı katkısında bulunuyorsa
`qaRunners` kullanın. Bu üst veriyi ucuz ve statik tutun; gerçek CLI kaydının sahibi
hâlâ `qaRunnerCliRegistrations` dışa aktaran hafif
bir `runtime-api.ts` yüzeyi üzerinden Plugin çalışma zamanıdır.

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

| Alan          | Gerekli | Tür      | Anlamı                                                            |
| ------------- | ------- | -------- | ----------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altına bağlanan alt komut; örneğin `matrix`.        |
| `description` | Hayır   | `string` | Paylaşılan host'un bir taslak komuta ihtiyaç duyduğu durumlarda kullanılan geri dönüş yardım metni. |

## setup başvurusu

Kurulum ve ilk katılım yüzeylerinin çalışma zamanı yüklenmeden önce Plugin'e ait ucuz üst veriye
ihtiyacı olduğunda `setup` kullanın.

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
arka uçlarını tanımlamaya devam eder. `setup.cliBackends`, denetim düzlemi/kurulum akışları için
yalnızca üst veri olarak kalması gereken kurulum özelindeki tanımlayıcı yüzeydir.

Mevcut olduğunda `setup.providers` ve `setup.cliBackends`,
kurulum keşfi için tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday Plugin'i daraltıyorsa
ve kurulum yine de daha zengin kurulum zamanı çalışma zamanı kancalarına ihtiyaç duyuyorsa,
`requiresRuntime: true` ayarlayın ve geri dönüş yürütme yolu olarak `setup-api`'yi yerinde tutun.

Kurulum araması Plugin'e ait `setup-api` kodunu çalıştırabildiğinden,
normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri
keşfedilen Plugin'ler arasında benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından kazanan seçmek yerine başarısızlığa kapalı davranır.

### setup.providers başvurusu

| Alan          | Gerekli | Tür        | Anlamı                                                                                       |
| ------------- | ------- | ---------- | -------------------------------------------------------------------------------------------- |
| `id`          | Evet    | `string`   | Kurulum veya ilk katılım sırasında açığa çıkan sağlayıcı kimliği. Normalize edilmiş kimlikleri küresel olarak benzersiz tutun. |
| `authMethods` | Hayır   | `string[]` | Tam çalışma zamanı yüklenmeden bu sağlayıcının desteklediği kurulum/auth yöntem kimlikleri. |
| `envVars`     | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden kontrol edebileceği ortam değişkenleri. |

### setup alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                          |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Hayır   | `object[]` | Kurulum ve ilk katılım sırasında açığa çıkan sağlayıcı kurulum tanımlayıcıları.                 |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kurulum zamanı arka uç kimlikleri. Normalize edilmiş kimlikleri küresel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin'in kurulum yüzeyine ait yapılandırma taşıma kimlikleri.                               |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.   |

## uiHints başvurusu

`uiHints`, yapılandırma alan adlarından küçük oluşturma ipuçlarına giden bir eşlemdir.

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
| `label`       | `string`   | Kullanıcıya dönük alan etiketi.         |
| `help`        | `string`   | Kısa yardımcı metin.                    |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.             |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.        |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girdileri için yer tutucu metin.   |

## contracts başvurusu

`contracts` alanını yalnızca OpenClaw'ın Plugin çalışma zamanını içe aktarmadan
okuyabileceği statik yetenek sahipliği üst verileri için kullanın.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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

| Alan                             | Tür        | Anlamı                                                              |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Paketlenmiş bir Plugin'in fabrika kaydedebileceği gömülü çalışma zamanı kimlikleri. |
| `externalAuthProviders`          | `string[]` | Harici auth profil kancasının sahibi bu Plugin olan sağlayıcı kimlikleri. |
| `speechProviders`                | `string[]` | Bu Plugin'in sahibi olduğu speech sağlayıcı kimlikleri.             |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin'in sahibi olduğu gerçek zamanlı transcription sağlayıcı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin'in sahibi olduğu gerçek zamanlı ses sağlayıcı kimlikleri. |
| `memoryEmbeddingProviders`       | `string[]` | Bu Plugin'in sahibi olduğu memory embedding sağlayıcı kimlikleri.   |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin'in sahibi olduğu medya anlama sağlayıcı kimlikleri.       |
| `imageGenerationProviders`       | `string[]` | Bu Plugin'in sahibi olduğu görüntü üretimi sağlayıcı kimlikleri.    |
| `videoGenerationProviders`       | `string[]` | Bu Plugin'in sahibi olduğu video üretimi sağlayıcı kimlikleri.      |
| `webFetchProviders`              | `string[]` | Bu Plugin'in sahibi olduğu web-fetch sağlayıcı kimlikleri.          |
| `webSearchProviders`             | `string[]` | Bu Plugin'in sahibi olduğu web-search sağlayıcı kimlikleri.         |
| `tools`                          | `string[]` | Paketlenmiş sözleşme denetimleri için bu Plugin'in sahibi olduğu aracı araç adları. |

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'leri
`contracts.externalAuthProviders` bildirmelidir. Bu bildirime sahip olmayan Plugin'ler
hâlâ kullanımdan kaldırılmış bir uyumluluk geri dönüşü üzerinden çalışır, ancak bu geri dönüş daha yavaştır
ve taşıma penceresinden sonra kaldırılacaktır.

Paketlenmiş memory embedding sağlayıcıları,
`local` gibi yerleşik bağdaştırıcılar dahil, açığa çıkardıkları her bağdaştırıcı kimliği için
`contracts.memoryEmbeddingProviders` bildirmelidir. Bağımsız CLI yolları bu manifest
sözleşmesini, tam Gateway çalışma zamanı sağlayıcıları kaydetmeden önce yalnızca sahibi olan Plugin'i yüklemek için kullanır.

## mediaUnderstandingProviderMetadata başvurusu

Bir medya anlama sağlayıcısının varsayılan modellere, otomatik auth geri dönüş önceliğine veya
çalışma zamanı yüklenmeden önce genel çekirdek yardımcıların ihtiyaç duyduğu yerel belge desteğine sahip olduğu durumlarda
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

| Alan                   | Tür                                 | Anlamı                                                                      |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Bu sağlayıcının açığa çıkardığı medya yetenekleri.                           |
| `defaultModels`        | `Record<string, string>`            | Yapılandırma model belirtmediğinde kullanılan yetenekten modele varsayılanlar. |
| `autoPriority`         | `Record<string, number>`            | Otomatik kimlik bilgisi tabanlı sağlayıcı geri dönüşü için daha düşük sayılar önce sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Sağlayıcının desteklediği yerel belge girdileri.                             |

## channelConfigs başvurusu

Bir kanal Plugin'inin çalışma zamanı yüklenmeden önce ucuz yapılandırma üst verisine
ihtiyacı olduğunda `channelConfigs` kullanın.

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
| `schema`      | `object`                 | `channels.<id>` için JSON Şeması. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | O kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucular/hassasiyet ipuçları. |
| `label`       | `string`                 | Çalışma zamanı üst verisi hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                               |
| `preferOver`  | `string[]`               | Seçim yüzeylerinde bu kanalın önüne geçmesi gereken eski veya daha düşük öncelikli Plugin kimlikleri. |

## modelSupport başvurusu

OpenClaw'ın, Plugin çalışma zamanı yüklenmeden önce
`gpt-5.5` veya `claude-sonnet-4.6` gibi kısayol model kimliklerinden sağlayıcı Plugin'inizi çıkarması gerekiyorsa
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

- açık `provider/model` başvuruları, sahibi olan `providers` manifest üst verisini kullanır
- `modelPatterns`, `modelPrefixes` değerlerini geçer
- bir paketlenmemiş Plugin ve bir paketlenmiş Plugin aynı anda eşleşirse, paketlenmemiş
  Plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                      |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısayol model kimliklerine karşı `startsWith` ile eşleşen önekler.          |
| `modelPatterns` | `string[]` | Profil soneki kaldırıldıktan sonra kısayol model kimliklerine karşı eşleşen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. Şunları
`contracts` altına taşımak için `openclaw doctor --fix` kullanın:
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` ve `webSearchProviders`; normal
manifest yükleme artık bu üst düzey alanları yetenek
sahipliği olarak değerlendirmez.

## Manifest ve package.json karşılaştırması

İki dosya farklı işler yapar:

| Dosya                  | Şunun için kullanın                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce var olması gereken keşif, yapılandırma doğrulaması, auth-seçimi üst verisi ve UI ipuçları           |
| `package.json`         | npm üst verileri, bağımlılık kurulumu ve giriş noktaları, kurulum geçitlemesi, setup veya katalog üst verileri için kullanılan `openclaw` bloğu |

Bir üst veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu Plugin kodunu yüklemeden önce bilmek zorundaysa, `openclaw.plugin.json` içine koyun
- Paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi Plugin üst verileri kasıtlı olarak
`openclaw.plugin.json` yerine `package.json` içindeki
`openclaw` bloğunda yaşar.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                              | Yerel Plugin giriş noktalarını bildirir. Plugin paket dizini içinde kalmalıdır.                                                                                                     |
| `openclaw.runtimeExtensions`                                       | Kurulu paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paket dizini içinde kalmalıdır.                                                        |
| `openclaw.setupEntry`                                              | İlk katılım, ertelenmiş kanal başlangıcı ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif, yalnızca kurulum amaçlı giriş noktası. Plugin paket dizini içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                       | Kurulu paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. Plugin paket dizini içinde kalmalıdır.                                                                 |
| `openclaw.channel`                                                 | Etiketler, belge yolları, takma adlar ve seçim metni gibi ucuz kanal katalog üst verileri.                                                                                         |
| `openclaw.channel.configuredState`                                 | Tam kanal çalışma zamanını yüklemeden “yalnızca ortam tabanlı kurulum zaten var mı?” sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyicisi üst verisi.                 |
| `openclaw.channel.persistedAuthState`                              | Tam kanal çalışma zamanını yüklemeden “zaten oturum açılmış bir şey var mı?” sorusunu yanıtlayabilen hafif kalıcı auth denetleyicisi üst verisi.                                  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`          | Paketlenmiş ve harici olarak yayımlanan Plugin'ler için kurulum/güncelleme ipuçları.                                                                                                |
| `openclaw.install.defaultChoice`                                   | Birden çok kurulum kaynağı mevcut olduğunda tercih edilen kurulum yolu.                                                                                                             |
| `openclaw.install.minHostVersion`                                  | `>=2026.3.22` gibi bir semver alt sınırı kullanan, desteklenen minimum OpenClaw host sürümü.                                                                                       |
| `openclaw.install.expectedIntegrity`                               | `sha512-...` gibi beklenen npm dağıtım bütünlüğü dizesi; kurulum ve güncelleme akışları getirilen yapıtı buna karşı doğrular.                                                    |
| `openclaw.install.allowInvalidConfigRecovery`                      | Yapılandırma geçersiz olduğunda dar kapsamlı bir paketlenmiş Plugin yeniden kurulum kurtarma yoluna izin verir.                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`  | Başlangıç sırasında tam kanal Plugin'inden önce yalnızca kurulum amaçlı kanal yüzeylerinin yüklenmesine izin verir.                                                                |

Manifest üst verisi, çalışma zamanı yüklenmeden önce ilk katılım sırasında hangi sağlayıcı/kanal/kurulum seçimlerinin görüneceğini belirler. `package.json#openclaw.install`, kullanıcı bu seçeneklerden birini seçtiğinde
ilk katılıma bu Plugin'i nasıl getireceğini veya etkinleştireceğini söyler.
Kurulum ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, kurulum sırasında ve manifest
kayıt defteri yüklenirken zorlanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler, daha eski host'larda Plugin'i atlar.

Tam npm sürüm sabitlemesi zaten `npmSpec` içinde yaşar; örneğin
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmi harici katalog
girdileri, getirilen npm yapıtı sabitlenen sürümle artık eşleşmiyorsa güncelleme akışlarının başarısızlığa kapalı davranması için tam özellikleri `expectedIntegrity` ile eşleştirmelidir.
Etkileşimli ilk katılım, uyumluluk için çıplak
paket adları ve dist-tag'ler dahil güvenilir kayıt defteri npm özelliklerini sunmaya devam eder. Katalog tanılamaları
tam, kayan, bütünlük sabitli ve bütünlüksüz kaynakları ayırt edebilir.
`expectedIntegrity` mevcut olduğunda kurulum/güncelleme akışları bunu zorlar; atlandığında
kayıt defteri çözümlemesi bütünlük sabitlemesi olmadan kaydedilir.

Kanal Plugin'leri, durum, kanal listesi,
veya SecretRef taramalarının tam çalışma zamanını yüklemeden yapılandırılmış hesapları tanımlaması gerektiğinde `openclaw.setupEntry`
sağlamalıdır. Kurulum girişi kanal üst verilerini ve kuruluma güvenli yapılandırma,
durum ve secrets bağdaştırıcılarını açığa çıkarmalıdır; ağ istemcilerini, gateway dinleyicilerini ve
taşıma çalışma zamanlarını ana uzantı giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak
giriş noktası alanları için paket sınırı denetimlerini geçersiz kılmaz. Örneğin,
`openclaw.runtimeExtensions`, sınır dışına çıkan bir `openclaw.extensions` yolunu yüklenebilir hale getiremez.

`openclaw.install.allowInvalidConfigRecovery` kasıtlı olarak dardır. Bu,
keyfi bozuk yapılandırmaları kurulabilir yapmaz. Bugün yalnızca kurulum akışlarının
eksik paketlenmiş Plugin yolu veya aynı
paketlenmiş Plugin için eski bir `channels.<id>` girdisi gibi belirli eski paketlenmiş Plugin yükseltme hatalarından kurtulmasına izin verir.
İlgisiz yapılandırma hataları yine de kurulumu engeller ve operatörleri
`openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici
modülü için paket üst verisidir:

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

Kurulum, doctor veya yapılandırılmış durum akışlarının tam kanal Plugin'i yüklenmeden önce ucuz bir evet/hayır auth
yoklamasına ihtiyaç duyduğu durumlarda bunu kullanın. Hedef dışa aktarma, yalnızca kalıcı durumu okuyan küçük bir
fonksiyon olmalıdır; bunu tam kanal çalışma zamanı barrel'ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, ucuz yalnızca ortam tabanlı
yapılandırılmış denetimler için aynı şekli izler:

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

Bir kanal, yapılandırılmış durumu ortam veya diğer küçük
çalışma zamanı dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam yapılandırma çözümlemesi veya gerçek
kanal çalışma zamanına ihtiyaç duyuyorsa, bu mantığı bunun yerine Plugin `config.hasConfiguredState`
kancasında tutun.

## Keşif önceliği (yinelenen Plugin kimlikleri)

OpenClaw Plugin'leri birkaç kökten keşfeder (paketlenmiş, genel kurulum, çalışma alanı, açıkça yapılandırma ile seçilen yollar). İki keşif aynı `id` değerini paylaşıyorsa, yalnızca **en yüksek öncelikli** manifest tutulur; daha düşük öncelikli kopyalar onun yanında yüklenmek yerine düşürülür.

En yüksekten en düşüğe öncelik:

1. **Yapılandırma ile seçilmiş** — `plugins.entries.<id>` içinde açıkça sabitlenmiş yol
2. **Paketlenmiş** — OpenClaw ile gelen Plugin'ler
3. **Genel kurulum** — genel OpenClaw Plugin köküne kurulmuş Plugin'ler
4. **Çalışma alanı** — geçerli çalışma alanına göre keşfedilen Plugin'ler

Sonuçlar:

- Çalışma alanında duran çatallanmış veya eski bir paketlenmiş Plugin kopyası, paketlenmiş derlemenin önüne geçmez.
- Paketlenmiş bir Plugin'i gerçekten yerel bir sürümle geçersiz kılmak için, çalışma alanı keşfine güvenmek yerine `plugins.entries.<id>` üzerinden sabitleyin ki öncelikle kazansın.
- Yinelenen düşürmeler günlüğe kaydedilir; böylece Doctor ve başlangıç tanılamaları atılan kopyayı gösterebilir.

## JSON Şeması gereksinimleri

- **Her Plugin bir JSON Şeması yayımlamak zorundadır**, hiçbir yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin, `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.

## Doğrulama davranışı

- `channels.*` altındaki bilinmeyen anahtarlar, kanal kimliği bir
  Plugin manifest'i tarafından bildirilmemişse **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** Plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir Plugin kuruluysa ama manifest'i veya şeması bozuk ya da eksikse,
  doğrulama başarısız olur ve Doctor Plugin hatasını raporlar.
- Plugin yapılandırması varsa ama Plugin **devre dışıysa**, yapılandırma korunur ve
  Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration).

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw Plugin'leri için zorunludur**. Çalışma zamanı yine de Plugin modülünü ayrıca yükler; manifest yalnızca keşif + doğrulama içindir.
- Yerel manifest'ler JSON5 ile ayrıştırılır, bu nedenle son değer hâlâ bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyici yalnızca belgelenmiş manifest alanlarını okur. Özel üst düzey anahtarlardan kaçının.
- Plugin bunlara ihtiyaç duymuyorsa `channels`, `providers`, `cliBackends` ve `skills` alanlarının tümü atlanabilir.
- `providerDiscoveryEntry` hafif kalmalıdır ve geniş çalışma zamanı kodu içe aktarmamalıdır; bunu statik sağlayıcı katalog üst verisi veya dar keşif tanımlayıcıları için kullanın, istek zamanı yürütmesi için değil.
- Özel Plugin türleri `plugins.slots.*` üzerinden seçilir: `plugins.slots.memory` ile `kind: "memory"`, `plugins.slots.contextEngine` ile `kind: "context-engine"` (varsayılan `legacy`).
- Ortam değişkeni üst verisi (`providerAuthEnvVars`, `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, Cron teslimat doğrulaması ve diğer salt okunur yüzeyler yine de bir ortam değişkenini yapılandırılmış kabul etmeden önce Plugin güvenini ve etkin etkinleştirme ilkesini uygular.
- Sağlayıcı kodu gerektiren çalışma zamanı sihirbaz üst verisi için bkz. [Provider runtime hooks](/tr/plugins/architecture-internals#provider-runtime-hooks).
- Plugin'iniz yerel modüllere bağımlıysa, derleme adımlarını ve herhangi bir paket yöneticisi izin listesi gereksinimini belgeleyin (örneğin, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## İlgili

<CardGroup cols={3}>
  <Card title="Plugin geliştirme" href="/tr/plugins/building-plugins" icon="rocket">
    Plugin'lere başlarken.
  </Card>
  <Card title="Plugin mimarisi" href="/tr/plugins/architecture" icon="diagram-project">
    İç mimari ve yetenek modeli.
  </Card>
  <Card title="SDK'ya genel bakış" href="/tr/plugins/sdk-overview" icon="book">
    Plugin SDK başvurusu ve alt yol içe aktarımları.
  </Card>
</CardGroup>
