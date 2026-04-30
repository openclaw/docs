---
read_when:
    - Bir OpenClaw Plugin geliştiriyorsunuz
    - Bir Plugin yapılandırma şeması yayımlamanız veya Plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifestosu + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin manifesti
x-i18n:
    generated_at: "2026-04-30T09:35:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

Bu sayfa yalnızca **yerel OpenClaw Plugin manifest’i** içindir.

Uyumlu paket düzenleri için bkz. [Plugin paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşeni
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan
`openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda düzen OpenClaw çalışma zamanı beklentileriyle
eşleştiğinde paket meta verilerini, bildirilen skill köklerini, Claude komut köklerini,
Claude paketi `settings.json` varsayılanlarını, Claude paketi LSP varsayılanlarını
ve desteklenen hook paketlerini okur.

Her yerel OpenClaw Plugin’i, **Plugin kökünde** bir `openclaw.plugin.json` dosyasıyla
gelmek **zorundadır**. OpenClaw bu manifest’i yapılandırmayı **Plugin kodunu
çalıştırmadan** doğrulamak için kullanır. Eksik veya geçersiz manifest’ler Plugin
hatası olarak ele alınır ve yapılandırma doğrulamasını engeller.

Tam Plugin sistemi kılavuzuna bakın: [Plugin’ler](/tr/tools/plugin).
Yerel yetenek modeli ve mevcut harici uyumluluk rehberliği için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar?

`openclaw.plugin.json`, OpenClaw’ın **Plugin kodunuzu yüklemeden önce** okuduğu
meta verilerdir. Aşağıdaki her şey, Plugin çalışma zamanını başlatmadan incelenebilecek
kadar düşük maliyetli olmalıdır.

**Şunlar için kullanın:**

- Plugin kimliği, yapılandırma doğrulaması ve yapılandırma arayüzü ipuçları
- kimlik doğrulama, ilk kurulum ve kurulum meta verileri (takma ad, otomatik etkinleştirme, sağlayıcı ortam değişkenleri, kimlik doğrulama seçenekleri)
- kontrol düzlemi yüzeyleri için etkinleştirme ipuçları
- kısa model ailesi sahipliği
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` ana makinesinin inceleyebileceği QA çalıştırıcı meta verileri
- katalog ve doğrulama yüzeyleriyle birleştirilen kanala özgü yapılandırma meta verileri

**Şunlar için kullanmayın:** çalışma zamanı davranışını kaydetmek, kod giriş noktaları
bildirmek veya npm kurulum meta verileri. Bunlar Plugin kodunuzda ve `package.json`
içinde yer alır.

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

| Alan                                 | Zorunlu | Tür                              | Anlamı                                                                                                                                                                                                                                      |
| ------------------------------------ | ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Evet    | `string`                         | Kanonik Plugin kimliği. Bu, `plugins.entries.<id>` içinde kullanılan kimliktir.                                                                                                                                                             |
| `configSchema`                       | Evet    | `object`                         | Bu Plugin'in yapılandırması için satır içi JSON Schema.                                                                                                                                                                                     |
| `enabledByDefault`                   | Hayır   | `true`                           | Paketle gelen bir Plugin'i varsayılan olarak etkin şeklinde işaretler. Plugin'in varsayılan olarak devre dışı kalması için bunu atlayın veya `true` olmayan herhangi bir değer ayarlayın.                                                   |
| `legacyPluginIds`                    | Hayır   | `string[]`                       | Bu kanonik Plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunlardan söz ettiğinde bu Plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                            |
| `kind`                               | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan özel bir Plugin türü bildirir.                                                                                                                                                                      |
| `channels`                           | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                                             |
| `providers`                          | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu sağlayıcı kimlikleri.                                                                                                                                                                                           |
| `providerDiscoveryEntry`             | Hayır   | `string`                         | Tam Plugin çalışma zamanı etkinleştirilmeden yüklenebilen, manifest kapsamındaki sağlayıcı katalog metaverileri için Plugin köküne göre göreli hafif sağlayıcı keşfi modülü yolu.                                                          |
| `modelSupport`                       | Hayır   | `object`                         | Plugin'i çalışma zamanından önce otomatik yüklemek için kullanılan, manifest sahibi olduğu kısa model ailesi metaverileri.                                                                                                                  |
| `modelCatalog`                       | Hayır   | `object`                         | Bu Plugin'in sahibi olduğu sağlayıcılar için bildirimsel model katalog metaverileri. Bu, Plugin çalışma zamanı yüklenmeden gelecekteki salt okunur listeleme, ilk kurulum, model seçiciler, takma adlar ve bastırma için denetim düzlemi sözleşmesidir. |
| `modelPricing`                       | Hayır   | `object`                         | Sağlayıcının sahibi olduğu harici fiyatlandırma arama ilkesi. Yerel/kendi barındırılan sağlayıcıları uzak fiyatlandırma kataloglarının dışında tutmak veya sağlayıcı başvurularını çekirdekte sağlayıcı kimliklerini sabit kodlamadan OpenRouter/LiteLLM katalog kimlikleriyle eşlemek için kullanın. |
| `modelIdNormalization`               | Hayır   | `object`                         | Sağlayıcı çalışma zamanı yüklenmeden önce çalışması gereken, sağlayıcının sahibi olduğu model kimliği takma ad/önek temizliği.                                                                                                              |
| `providerEndpoints`                  | Hayır   | `object[]`                       | Sağlayıcı çalışma zamanı yüklenmeden önce çekirdeğin sınıflandırması gereken sağlayıcı rotaları için manifest sahibi olduğu uç nokta host/baseUrl metaverileri.                                                                             |
| `providerRequest`                    | Hayır   | `object`                         | Sağlayıcı çalışma zamanı yüklenmeden önce genel istek ilkesi tarafından kullanılan ucuz sağlayıcı ailesi ve istek uyumluluğu metaverileri.                                                                                                  |
| `cliBackends`                        | Hayır   | `string[]`                       | Bu Plugin'in sahibi olduğu CLI çıkarım arka uç kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                                                           |
| `syntheticAuthRefs`                  | Hayır   | `string[]`                       | Plugin'in sahibi olduğu sentetik kimlik doğrulama kancasının, çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında yoklanması gereken sağlayıcı veya CLI arka uç başvuruları.                                                       |
| `nonSecretAuthMarkers`               | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketle gelen Plugin'in sahibi olduğu yer tutucu API anahtarı değerleri.                                                                                         |
| `commandAliases`                     | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce Plugin'e duyarlı yapılandırma ve CLI tanılama üretmesi gereken, bu Plugin'in sahibi olduğu komut adları.                                                                                                    |
| `providerAuthEnvVars`                | Hayır   | `Record<string, string[]>`       | Sağlayıcı kimlik doğrulama/durum araması için kullanımdan kaldırılmış uyumluluk ortam metaverileri. Yeni Plugin'ler için `setup.providers[].envVars` tercih edin; OpenClaw bunu kullanımdan kaldırma penceresi boyunca okumaya devam eder. |
| `providerAuthAliases`                | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı.                     |
| `channelEnvVars`                     | Hayır   | `Record<string, string[]>`       | OpenClaw'ın Plugin kodunu yüklemeden inceleyebileceği ucuz kanal ortam metaverileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam güdümlü kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın.        |
| `providerAuthChoices`                | Hayır   | `object[]`                       | İlk kurulum seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlama için ucuz kimlik doğrulama seçimi metaverileri.                                                                                                   |
| `activation`                         | Hayır   | `object`                         | Başlangıç, sağlayıcı, komut, kanal, rota ve yetenek tetiklemeli yükleme için ucuz etkinleştirme planlayıcısı metaverileri. Yalnızca metaveri; gerçek davranış hâlâ Plugin çalışma zamanına aittir.                                        |
| `setup`                              | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin Plugin çalışma zamanını yüklemeden inceleyebileceği ucuz kurulum/ilk kurulum tanımlayıcıları.                                                                                                               |
| `qaRunners`                          | Hayır   | `object[]`                       | Plugin çalışma zamanı yüklenmeden önce paylaşılan `openclaw qa` konağı tarafından kullanılan ucuz QA çalıştırıcı tanımlayıcıları.                                                                                                         |
| `contracts`                          | Hayır   | `object`                         | Harici kimlik doğrulama kancaları, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü oluşturma, müzik oluşturma, video oluşturma, web getirme, web araması ve araç sahipliği için statik paket yetenek anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için ucuz medya anlama varsayılanları.                                                                                                                     |
| `channelConfigs`                     | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, manifest sahibi olduğu kanal yapılandırma metaverileri.                                                                                                     |
| `skills`                             | Hayır   | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skill dizinleri.                                                                                                                                                                               |
| `name`                               | Hayır   | `string`                         | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                                                    |
| `description`                        | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                                  |
| `version`                            | Hayır   | `string`                         | Bilgilendirici Plugin sürümü.                                                                                                                                                                                                              |
| `uiHints`                            | Hayır   | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                            |

## providerAuthChoices başvurusu

Her `providerAuthChoices` girdisi bir ilk kurulum veya kimlik doğrulama seçimini açıklar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.
Sağlayıcı kurulum listeleri bu manifest seçimlerini, tanımlayıcıdan türetilmiş kurulum
seçimlerini ve kurulum kataloğu metaverilerini sağlayıcı çalışma zamanını yüklemeden kullanır.

| Alan                  | Gerekli | Tür                                             | Ne anlama gelir                                                                                                                                        |
| --------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`            | Evet    | `string`                                        | Bu seçimin ait olduğu sağlayıcı kimliği.                                                                                                               |
| `method`              | Evet    | `string`                                        | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                                                                      |
| `choiceId`            | Evet    | `string`                                        | İlk katılım ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçimi kimliği.                                                             |
| `choiceLabel`         | Hayır   | `string`                                        | Kullanıcıya gösterilen etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                                                                      |
| `choiceHint`          | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                                                                       |
| `assistantPriority`   | Hayır   | `number`                                        | Daha düşük değerler, asistan tarafından yönlendirilen etkileşimli seçicilerde daha önce sıralanır.                                                     |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                  | Elle CLI seçimine hâlâ izin verirken seçimi asistan seçicilerinden gizler.                                                                             |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                      | Kullanıcıları bu yerine geçen seçime yönlendirmesi gereken eski seçim kimlikleri.                                                                       |
| `groupId`             | Hayır   | `string`                                        | İlgili seçimleri gruplamak için isteğe bağlı grup kimliği.                                                                                             |
| `groupLabel`          | Hayır   | `string`                                        | Bu grup için kullanıcıya gösterilen etiket.                                                                                                            |
| `groupHint`           | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                                                                         |
| `optionKey`           | Hayır   | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için dahili seçenek anahtarı.                                                                             |
| `cliFlag`             | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrağı adı.                                                                                                           |
| `cliOption`           | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçeneği biçimi.                                                                                             |
| `cliDescription`      | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                                                                    |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçimin hangi ilk katılım yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan olarak `["text-inference"]` kullanılır.                            |

## commandAliases başvurusu

Bir Plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya
kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına
sahip olduğunda `commandAliases` kullanın. OpenClaw bu üst veriyi Plugin çalışma
zamanı kodunu içe aktarmadan tanılama için kullanır.

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

| Alan         | Gerekli | Tür               | Ne anlama gelir                                                                          |
| ------------ | ------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu Plugin'e ait komut adı.                                                               |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı kök CLI komutu yerine sohbet eğik çizgi komutu olarak işaretler.               |
| `cliCommand` | Hayır   | `string`          | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.                               |

## activation başvurusu

Plugin, hangi kontrol düzlemi olaylarının onu bir etkinleştirme/yükleme planına
dahil etmesi gerektiğini düşük maliyetle bildirebildiğinde `activation` kullanın.

Bu blok planlayıcı üst verisidir, yaşam döngüsü API'si değildir. Çalışma zamanı
davranışını kaydetmez, `register(...)` yerine geçmez ve Plugin kodunun zaten
çalıştırılmış olduğunu vadetmez. Etkinleştirme planlayıcısı, mevcut bildirim
sahipliği üst verilerine geri dönmeden önce aday Plugin'leri daraltmak için bu
alanları kullanır; örneğin `providers`, `channels`, `commandAliases`,
`setup.providers`, `contracts.tools` ve kancalar.

Sahipliği zaten açıklayan en dar üst veriyi tercih edin. Bu alanlar ilişkiyi
ifade ettiğinde `providers`, `channels`, `commandAliases`, kurulum tanımlayıcıları
veya `contracts` kullanın. Bu sahiplik alanlarıyla temsil edilemeyen ek planlayıcı
ipuçları için `activation` kullanın.
`claude-cli`, `codex-cli` veya `google-gemini-cli` gibi CLI çalışma zamanı takma
adları için üst düzey `cliBackends` kullanın; `activation.onAgentHarnesses`
yalnızca halihazırda sahiplik alanı olmayan gömülü aracı koşum kimlikleri içindir.

Bu blok yalnızca üst veridir. Çalışma zamanı davranışını kaydetmez ve
`register(...)`, `setupEntry` veya diğer çalışma zamanı/Plugin giriş noktalarının
yerine geçmez. Geçerli tüketiciler bunu daha geniş Plugin yüklemesinden önce
daraltıcı ipucu olarak kullanır; bu yüzden eksik etkinleştirme üst verisi
genellikle yalnızca performans maliyeti getirir; eski bildirim sahipliği geri
dönüşleri hâlâ var olduğu sürece doğruluğu değiştirmemelidir.

OpenClaw örtük başlangıç içe aktarmalarından uzaklaştıkça her Plugin
`activation.onStartup` değerini bilinçli olarak ayarlamalıdır. Yalnızca Plugin'in
Gateway başlatılırken çalışması gerektiğinde `true` olarak ayarlayın. Plugin
başlangıçta etkisizse ve yalnızca daha dar tetikleyicilerden yüklenmeliyse
`false` olarak ayarlayın. `onStartup` değerinin atlanması, statik yetenek üst
verisi olmayan Plugin'ler için kullanımdan kaldırılmış eski örtük başlangıç
yan süreç geri dönüşünü korur; gelecek sürümler, `activation.onStartup: true`
bildirmedikleri sürece bu Plugin'leri başlangıçta yüklemeyi durdurabilir. Plugin
durumu ve uyumluluk raporları, bir Plugin hâlâ bu geri dönüşe bağlı olduğunda
`legacy-implicit-startup-sidecar` ile uyarır.

Geçiş testi için, yalnızca bu kullanımdan kaldırılmış geri dönüşü devre dışı
bırakmak üzere `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` ayarlayın.
Bu isteğe bağlı mod, açık `activation.onStartup: true` Plugin'lerini veya kanal,
yapılandırma, aracı koşumu, bellek ya da diğer daha dar etkinleştirme tetikleyicileri
tarafından yüklenen Plugin'leri engellemez.

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

| Alan               | Gerekli | Tür                                                  | Ne anlama gelir                                                                                                                                                                                                                    |
| ------------------ | ------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Hayır   | `boolean`                                            | Açık Gateway başlangıç etkinleştirmesi. Her Plugin bunu ayarlamalıdır. `true`, başlangıç sırasında Plugin'i içe aktarır; `false`, başka bir eşleşen tetikleyici yüklemeyi gerektirmedikçe kullanımdan kaldırılmış örtük yan süreç başlangıç geri dönüşünü devre dışı bırakır. |
| `onProviders`      | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                                                                                                                                            |
| `onAgentHarnesses` | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken gömülü aracı koşumu çalışma zamanı kimlikleri. CLI arka uç takma adları için üst düzey `cliBackends` kullanın.                                                   |
| `onCommands`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                                                                                                                                                |
| `onChannels`       | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                                                                                                                                                |
| `onRoutes`         | Hayır   | `string[]`                                           | Bu Plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                                                                                                                                                    |
| `onConfigPaths`    | Hayır   | `string[]`                                           | Yol mevcut olduğunda ve açıkça devre dışı bırakılmadığında bu Plugin'i başlangıç/yükleme planlarına dahil etmesi gereken köke göreli yapılandırma yolları.                                                                         |
| `onCapabilities`   | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlaması tarafından kullanılan geniş yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin.                                                                                              |

Geçerli canlı tüketiciler:

- Gateway başlangıç planlaması, açık başlangıç içe aktarması ve kullanımdan
  kaldırılmış örtük yan süreç başlangıç geri dönüşünden çıkış için
  `activation.onStartup` kullanır
- komutla tetiklenen CLI planlaması, eski `commandAliases[].cliCommand` veya
  `commandAliases[].name` değerlerine geri döner
- aracı çalışma zamanı başlangıç planlaması, gömülü koşumlar için
  `activation.onAgentHarnesses` ve CLI çalışma zamanı takma adları için üst düzey
  `cliBackends[]` kullanır
- kanalla tetiklenen kurulum/kanal planlaması, açık kanal etkinleştirme üst
  verisi eksik olduğunda eski `channels[]` sahipliğine geri döner
- başlangıç Plugin planlaması, paketlenmiş tarayıcı Plugin'inin `browser` bloğu
  gibi kanal dışı kök yapılandırma yüzeyleri için `activation.onConfigPaths`
  kullanır
- sağlayıcıyla tetiklenen kurulum/çalışma zamanı planlaması, açık sağlayıcı
  etkinleştirme üst verisi eksik olduğunda eski `providers[]` ve üst düzey
  `cliBackends[]` sahipliğine geri döner

Planlayıcı tanılamaları, açık etkinleştirme ipuçlarını bildirim sahipliği geri
dönüşünden ayırt edebilir. Örneğin, `activation-command-hint`
`activation.onCommands` değerinin eşleştiği anlamına gelirken
`manifest-command-alias`, planlayıcının bunun yerine `commandAliases` sahipliğini
kullandığı anlamına gelir. Bu neden etiketleri ana makine tanılamaları ve testler
içindir; Plugin yazarları sahipliği en iyi açıklayan üst veriyi bildirmeyi
sürdürmelidir.

## qaRunners başvurusu

Bir Plugin, paylaşılan `openclaw qa` kökünün altında bir veya daha fazla taşıma
çalıştırıcısı katkısı sağladığında `qaRunners` kullanın. Bu üst veriyi düşük
maliyetli ve statik tutun; gerçek CLI kaydının sahibi hâlâ `qaRunnerCliRegistrations`
dışa aktaran hafif bir `runtime-api.ts` yüzeyi üzerinden Plugin çalışma zamanıdır.

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
| `commandName` | Evet    | `string` | `openclaw qa` altında bağlanan alt komut, örneğin `matrix`.          |
| `description` | Hayır   | `string` | Paylaşılan ana makine bir stub komuta ihtiyaç duyduğunda kullanılan yedek yardım metni. |

## setup başvurusu

Çalışma zamanı yüklenmeden önce kurulum ve katılım yüzeyleri ucuz, Plugin'e ait meta verilere ihtiyaç duyduğunda `setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım arka uçlarını açıklamaya devam eder. `setup.cliBackends`, yalnızca meta veri olarak kalması gereken denetim düzlemi/kurulum akışları için kuruluma özgü tanımlayıcı yüzeydir.

Mevcut olduğunda, `setup.providers` ve `setup.cliBackends` kurulum keşfi için tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday Plugin'i daraltıyorsa ve kurulum hâlâ daha zengin kurulum zamanı çalışma zamanı kancalarına ihtiyaç duyuyorsa, `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak `setup-api` öğesini yerinde tutun.

OpenClaw ayrıca genel sağlayıcı kimlik doğrulaması ve ortam değişkeni aramalarına `setup.providers[].envVars` öğesini dahil eder. `providerAuthEnvVars`, kullanımdan kaldırma penceresi sırasında bir uyumluluk bağdaştırıcısı üzerinden desteklenmeye devam eder, ancak bunu hâlâ kullanan paketlenmemiş Plugin'ler bir manifest tanısı alır. Yeni Plugin'ler kurulum/durum ortam meta verilerini `setup.providers[].envVars` üzerine koymalıdır.

OpenClaw, kurulum girdisi olmadığında veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildirdiğinde `setup.providers[].authMethods` üzerinden basit kurulum seçenekleri de türetebilir. Açık `providerAuthChoices` girdileri, özel etiketler, CLI bayrakları, katılım kapsamı ve asistan meta verileri için tercih edilmeye devam eder.

`requiresRuntime: false` değerini yalnızca bu tanımlayıcılar kurulum yüzeyi için yeterliyse ayarlayın. OpenClaw açık `false` değerini yalnızca tanımlayıcıya dayalı bir sözleşme olarak ele alır ve kurulum araması için `setup-api` veya `openclaw.setupEntry` çalıştırmaz. Yalnızca tanımlayıcıya dayalı bir Plugin bu kurulum çalışma zamanı girdilerinden birini hâlâ gönderiyorsa, OpenClaw eklemeli bir tanı bildirir ve onu yok saymaya devam eder. Atlanmış `requiresRuntime`, tanımlayıcıları bayrak olmadan eklemiş mevcut Plugin'lerin bozulmaması için eski yedek davranışı korur.

Kurulum araması Plugin'e ait `setup-api` kodunu çalıştırabildiğinden, normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen Plugin'ler genelinde benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine kapalı şekilde başarısız olur.

Kurulum çalışma zamanı çalıştığında, `setup-api` manifest tanımlayıcılarının bildirmediği bir sağlayıcı veya CLI arka ucu kaydederse ya da bir tanımlayıcının eşleşen çalışma zamanı kaydı yoksa kurulum kayıt defteri tanıları tanımlayıcı sapmasını bildirir. Bu tanılar eklemelidir ve eski Plugin'leri reddetmez.

### setup.providers başvurusu

| Alan           | Gerekli | Tür        | Anlamı                                                                                         |
| -------------- | ------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `id`           | Evet    | `string`   | Kurulum veya katılım sırasında sunulan sağlayıcı kimliği. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods`  | Hayır   | `string[]` | Bu sağlayıcının tam çalışma zamanını yüklemeden desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`      | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden önce denetleyebileceği ortam değişkenleri. |
| `authEvidence` | Hayır   | `object[]` | Gizli olmayan işaretçiler üzerinden kimlik doğrulayabilen sağlayıcılar için ucuz yerel kimlik doğrulama kanıtı denetimleri. |

`authEvidence`, çalışma zamanı kodu yüklenmeden doğrulanabilen, sağlayıcıya ait yerel kimlik bilgisi işaretçileri içindir. Bu denetimler ucuz ve yerel kalmalıdır: ağ çağrıları, keychain veya secret-manager okumaları, kabuk komutları ve sağlayıcı API yoklamaları yoktur.

Desteklenen kanıt girdileri:

| Alan               | Gerekli | Tür        | Anlamı                                                                                                         |
| ------------------ | ------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Evet    | `string`   | Şu anda `local-file-with-env`.                                                                                 |
| `fileEnvVar`       | Hayır   | `string`   | Açık bir kimlik bilgisi dosya yolu içeren ortam değişkeni.                                                     |
| `fallbackPaths`    | Hayır   | `string[]` | `fileEnvVar` yoksa veya boşsa denetlenen yerel kimlik bilgisi dosya yolları. `${HOME}` ve `${APPDATA}` destekler. |
| `requiresAnyEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen ortam değişkenlerinden en az biri boş olmamalıdır.                       |
| `requiresAllEnv`   | Hayır   | `string[]` | Kanıt geçerli olmadan önce listelenen her ortam değişkeni boş olmamalıdır.                                     |
| `credentialMarker` | Evet    | `string`   | Kanıt mevcut olduğunda döndürülen gizli olmayan işaretçi.                                                      |
| `source`           | Hayır   | `string`   | Kimlik doğrulama/durum çıktısı için kullanıcıya gösterilen kaynak etiketi.                                     |

### setup alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                         |
| ------------------ | ------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve katılım sırasında sunulan sağlayıcı kurulum tanımlayıcıları.                         |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kullanılan kurulum zamanı arka uç kimlikleri. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin'in kurulum yüzeyine ait yapılandırma geçişi kimlikleri.                              |
| `requiresRuntime`  | Hayır   | `boolean`  | Kurulumun tanımlayıcı aramasından sonra hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.   |

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

| Alan          | Tür        | Anlamı                                      |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Kullanıcıya gösterilen alan etiketi.        |
| `help`        | `string`   | Kısa yardımcı metin.                        |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.                 |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.            |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler.   |
| `placeholder` | `string`   | Form girdileri için yer tutucu metni.       |

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

| Alan                             | Tür        | Anlamı                                                                 |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex uygulama sunucusu uzantı factory kimlikleri, şu anda `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Paketlenmiş bir Plugin'in araç sonucu ara katman yazılımı kaydedebileceği çalışma zamanı kimlikleri. |
| `externalAuthProviders`          | `string[]` | Harici kimlik doğrulama profili kancasına bu Plugin'in sahip olduğu sağlayıcı kimlikleri. |
| `speechProviders`                | `string[]` | Bu Plugin'in sahip olduğu konuşma sağlayıcısı kimlikleri.              |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı ses sağlayıcısı kimlikleri.   |
| `memoryEmbeddingProviders`       | `string[]` | Bu Plugin'in sahip olduğu bellek gömme sağlayıcısı kimlikleri.         |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin'in sahip olduğu medya anlama sağlayıcısı kimlikleri.         |
| `imageGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu görüntü üretim sağlayıcısı kimlikleri.       |
| `videoGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu video üretim sağlayıcısı kimlikleri.         |
| `webFetchProviders`              | `string[]` | Bu Plugin'in sahip olduğu web getirme sağlayıcısı kimlikleri.          |
| `webSearchProviders`             | `string[]` | Bu Plugin'in sahip olduğu web arama sağlayıcısı kimlikleri.            |
| `migrationProviders`             | `string[]` | Bu Plugin'in `openclaw migrate` için sahip olduğu içe aktarma sağlayıcısı kimlikleri. |
| `tools`                          | `string[]` | Paketlenmiş sözleşme denetimleri için bu Plugin'in sahip olduğu ajan aracı adları. |

`contracts.embeddedExtensionFactories`, paketlenmiş yalnızca Codex uygulama sunucusu uzantı factory'leri için tutulur. Paketlenmiş araç sonucu dönüştürmeleri bunun yerine `contracts.agentToolResultMiddleware` bildirmeli ve `api.registerAgentToolResultMiddleware(...)` ile kaydolmalıdır. Harici Plugin'ler araç sonucu ara katman yazılımı kaydedemez çünkü bu bağlantı noktası, model görmeden önce yüksek güvenilirlikli araç çıktısını yeniden yazabilir.

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'ler `contracts.externalAuthProviders` bildirmelidir. Bildirimi olmayan Plugin'ler kullanımdan kaldırılmış bir uyumluluk yedeği üzerinden çalışmaya devam eder, ancak bu yedek daha yavaştır ve geçiş penceresinden sonra kaldırılacaktır.

Paketlenmiş bellek gömme sağlayıcıları, `local` gibi yerleşik bağdaştırıcılar dahil olmak üzere sundukları her bağdaştırıcı kimliği için `contracts.memoryEmbeddingProviders` bildirmelidir. Bağımsız CLI yolları, tam Gateway çalışma zamanı sağlayıcıları kaydetmeden önce yalnızca sahip Plugin'i yüklemek için bu manifest sözleşmesini kullanır.

## mediaUnderstandingProviderMetadata başvurusu

`mediaUnderstandingProviderMetadata` değerini, medya anlama sağlayıcısının
varsayılan modelleri, otomatik kimlik doğrulama geri dönüş önceliği veya genel
çekirdek yardımcılarının runtime yüklenmeden önce ihtiyaç duyduğu yerel belge
desteği olduğunda kullanın. Anahtarlar ayrıca
`contracts.mediaUnderstandingProviders` içinde bildirilmelidir.

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

| Alan                   | Tür                                 | Anlamı                                                                         |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Bu sağlayıcının sunduğu medya yetenekleri.                                     |
| `defaultModels`        | `Record<string, string>`            | Config bir model belirtmediğinde kullanılan yetenekten modele varsayılanları.  |
| `autoPriority`         | `Record<string, number>`            | Otomatik kimlik bilgisi tabanlı sağlayıcı geri dönüşünde düşük sayılar önce sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Sağlayıcı tarafından desteklenen yerel belge girdileri.                        |

## channelConfigs başvurusu

Bir kanal Plugin'i runtime yüklenmeden önce ucuz config meta verilerine ihtiyaç
duyduğunda `channelConfigs` kullanın. Salt okunur kanal kurulum/durum keşfi, bir
kurulum girdisi yoksa veya `setup.requiresRuntime: false` kurulum runtime'ının
gerekli olmadığını bildiriyorsa yapılandırılmış harici kanallar için bu meta
verileri doğrudan kullanabilir.

`channelConfigs`, Plugin manifest meta verisidir; yeni bir üst düzey kullanıcı
config bölümü değildir. Kullanıcılar kanal örneklerini yine `channels.<channel-id>`
altında yapılandırır. OpenClaw, Plugin runtime kodu çalışmadan önce yapılandırılan
kanalın hangi Plugin'e ait olduğunu belirlemek için manifest meta verilerini okur.

Bir kanal Plugin'i için `configSchema` ve `channelConfigs` farklı yolları açıklar:

- `configSchema`, `plugins.entries.<plugin-id>.config` değerini doğrular
- `channelConfigs.<channel-id>.schema`, `channels.<channel-id>` değerini doğrular

`channels[]` bildiren paket dışı Plugin'ler ayrıca eşleşen `channelConfigs`
girdileri de bildirmelidir. Bunlar olmadan OpenClaw Plugin'i yine de yükleyebilir,
ancak soğuk yol config şeması, kurulum ve Control UI yüzeyleri, Plugin runtime'ı
çalışana kadar kanalın sahip olduğu seçenek şeklini bilemez.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` ve
`nativeSkillsAutoEnabled`, kanal runtime'ı yüklenmeden önce çalışan komut config
kontrolleri için statik `auto` varsayılanları bildirebilir. Paketli kanallar aynı
varsayılanları, pakete ait diğer kanal katalog meta verileriyle birlikte
`package.json#openclaw.channel.commands` üzerinden de yayımlayabilir.

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

| Alan          | Tür                      | Anlamı                                                                           |
| ------------- | ------------------------ | -------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Schema. Bildirilen her kanal config girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | O kanal config bölümü için isteğe bağlı UI etiketleri/yer tutucuları/hassas ipuçları. |
| `label`       | `string`                 | Runtime meta verisi hazır olmadığında seçici ve inceleme yüzeyleriyle birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                        |
| `commands`    | `object`                 | Runtime öncesi config kontrolleri için statik yerel komut ve yerel Skills otomatik varsayılanları. |
| `preferOver`  | `string[]`               | Bu kanalın seçim yüzeylerinde önüne geçmesi gereken eski veya daha düşük öncelikli Plugin kimlikleri. |

### Başka bir kanal Plugin'ini değiştirme

Plugin'iniz, başka bir Plugin'in de sağlayabildiği bir kanal kimliği için tercih
edilen sahip olduğunda `preferOver` kullanın. Yaygın durumlar yeniden adlandırılmış
bir Plugin kimliği, paketli bir Plugin'in yerini alan bağımsız bir Plugin veya
config uyumluluğu için aynı kanal kimliğini koruyan bakımı yapılan bir fork'tur.

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
edilen Plugin kimliğini dikkate alır. Daha düşük öncelikli Plugin yalnızca paketli
olduğu veya varsayılan olarak etkinleştirildiği için seçildiyse OpenClaw, etkili
runtime config içinde onu devre dışı bırakır; böylece kanalın ve araçlarının sahibi
tek bir Plugin olur. Açık kullanıcı seçimi yine de kazanır: Kullanıcı iki Plugin'i
de açıkça etkinleştirirse OpenClaw bu seçimi korur ve istenen Plugin kümesini
sessizce değiştirmek yerine yinelenen kanal/araç tanılamaları bildirir.

`preferOver` değerini gerçekten aynı kanalı sağlayabilen Plugin kimlikleriyle
sınırlı tutun. Bu genel bir öncelik alanı değildir ve kullanıcı config anahtarlarını
yeniden adlandırmaz.

## modelSupport başvurusu

OpenClaw'ın Plugin runtime'ı yüklenmeden önce sağlayıcı Plugin'inizi `gpt-5.5` veya
`claude-sonnet-4.6` gibi kısa model kimliklerinden çıkarması gerektiğinde
`modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu önceliği uygular:

- açık `provider/model` başvuruları, sahip olan `providers` manifest meta verisini kullanır
- `modelPatterns`, `modelPrefixes` değerlerinden önce gelir
- paketli olmayan bir Plugin ve paketli bir Plugin ikisi de eşleşirse paketli olmayan
  Plugin kazanır
- kalan belirsizlik, kullanıcı veya config bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                          |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleştirilen önekler.            |
| `modelPatterns` | `string[]` | Profil soneki kaldırıldıktan sonra kısa model kimliklerine karşı eşleştirilen Regex kaynakları. |

## modelCatalog başvurusu

OpenClaw'ın Plugin runtime'ını yüklemeden önce sağlayıcı model meta verilerini
bilmesi gerektiğinde `modelCatalog` kullanın. Bu, sabit katalog satırları,
sağlayıcı alias'ları, bastırma kuralları ve keşif modu için manifest'in sahip
olduğu kaynaktır. Runtime yenilemesi yine sağlayıcı runtime koduna aittir, ancak
manifest çekirdeğe runtime'ın ne zaman gerekli olduğunu bildirir.

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

| Alan           | Tür                                                      | Anlamı                                                                                                  |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Bu Plugin'in sahip olduğu sağlayıcı kimlikleri için katalog satırları. Anahtarlar üst düzey `providers` içinde de görünmelidir. |
| `aliases`      | `Record<string, object>`                                 | Katalog veya bastırma planlaması için sahip olunan bir sağlayıcıya çözümlenmesi gereken sağlayıcı alias'ları. |
| `suppressions` | `object[]`                                               | Bu Plugin'in sağlayıcıya özgü bir nedenle bastırdığı, başka bir kaynaktan gelen model satırları.        |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Sağlayıcı kataloğunun manifest meta verilerinden okunup okunamayacağı, önbelleğe yenilenip yenilenemeyeceği veya runtime gerektirip gerektirmediği. |

`aliases`, model katalog planlaması için sağlayıcı sahipliği aramasına katılır.
Alias hedefleri, aynı Plugin'in sahip olduğu üst düzey sağlayıcılar olmalıdır. Bir
sağlayıcıya göre filtrelenmiş liste bir alias kullandığında OpenClaw sahip olan
manifest'i okuyabilir ve sağlayıcı runtime'ını yüklemeden alias API/temel URL
geçersiz kılmalarını uygulayabilir.
Alias'lar filtrelenmemiş katalog listelerini genişletmez; geniş listeler yalnızca
sahip olan kanonik sağlayıcı satırlarını üretir.

`suppressions`, eski sağlayıcı runtime `suppressBuiltInModel` kancasının yerini
alır. Bastırma girdileri yalnızca sağlayıcı Plugin'e ait olduğunda veya sahip
olunan bir sağlayıcıyı hedefleyen bir `modelCatalog.aliases` anahtarı olarak
bildirildiğinde dikkate alınır. Runtime bastırma kancaları artık model çözümleme
sırasında çağrılmaz.

Sağlayıcı alanları:

| Alan      | Tür                      | Anlamı                                                               |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan temel URL. |
| `api`     | `ModelApi`               | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan API adapter'ı. |
| `headers` | `Record<string, string>` | Bu sağlayıcı kataloğuna uygulanan isteğe bağlı statik header'lar.     |
| `models`  | `object[]`               | Gerekli model satırları. `id` olmayan satırlar yok sayılır.           |

Model alanları:

| Alan           | Tür                                                            | Anlamı                                                                      |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` öneki olmadan sağlayıcıya yerel model kimliği.                  |
| `name`          | `string`                                                       | İsteğe bağlı görüntüleme adı.                                               |
| `api`           | `ModelApi`                                                     | İsteğe bağlı model başına API geçersiz kılması.                             |
| `baseUrl`       | `string`                                                       | İsteğe bağlı model başına temel URL geçersiz kılması.                       |
| `headers`       | `Record<string, string>`                                       | İsteğe bağlı model başına statik üst bilgiler.                              |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modelin kabul ettiği kiplikler.                                             |
| `reasoning`     | `boolean`                                                      | Modelin akıl yürütme davranışı sunup sunmadığı.                             |
| `contextWindow` | `number`                                                       | Yerel sağlayıcı bağlam penceresi.                                           |
| `contextTokens` | `number`                                                       | `contextWindow` değerinden farklı olduğunda isteğe bağlı etkin çalışma zamanı bağlam sınırı. |
| `maxTokens`     | `number`                                                       | Bilindiğinde maksimum çıktı token sayısı.                                   |
| `cost`          | `object`                                                       | İsteğe bağlı `tieredPricing` dahil, milyon token başına isteğe bağlı USD fiyatlandırması. |
| `compat`        | `object`                                                       | OpenClaw model yapılandırma uyumluluğuyla eşleşen isteğe bağlı uyumluluk bayrakları. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Listeleme durumu. Yalnızca satır hiç görünmemeliyse bastırın.               |
| `statusReason`  | `string`                                                       | Kullanılamayan durumla birlikte gösterilen isteğe bağlı neden.              |
| `replaces`      | `string[]`                                                     | Bu modelin yerini aldığı daha eski sağlayıcıya yerel model kimlikleri.      |
| `replacedBy`    | `string`                                                       | Kullanımdan kaldırılmış satırlar için yedek sağlayıcıya yerel model kimliği. |
| `tags`          | `string[]`                                                     | Seçiciler ve filtreler tarafından kullanılan kararlı etiketler.             |

Bastırma alanları:

| Alan                       | Tür        | Anlamı                                                                                                   |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Bastırılacak yukarı akış satırı için sağlayıcı kimliği. Bu Plugin tarafından sahiplenilmeli veya sahiplenilen takma ad olarak bildirilmelidir. |
| `model`                    | `string`   | Bastırılacak sağlayıcıya yerel model kimliği.                                                            |
| `reason`                   | `string`   | Bastırılan satır doğrudan istendiğinde gösterilen isteğe bağlı ileti.                                    |
| `when.baseUrlHosts`        | `string[]` | Bastırmanın uygulanması için gereken isteğe bağlı etkin sağlayıcı temel URL ana makineleri listesi.       |
| `when.providerConfigApiIn` | `string[]` | Bastırmanın uygulanması için gereken tam sağlayıcı yapılandırması `api` değerlerinin isteğe bağlı listesi. |

`modelCatalog` içine yalnızca çalışma zamanına ait veri koymayın. Manifest
satırları, sağlayıcıya göre filtrelenmiş liste ve seçici yüzeylerinin
registry/çalışma zamanı keşfini atlamasına yetecek kadar eksiksiz olduğunda
yalnızca `static` kullanın. Manifest satırları listelenebilir başlangıç verileri
veya ekleri olarak yararlı olduğunda, ancak bir yenileme/önbellek daha sonra
daha fazla satır ekleyebildiğinde `refreshable` kullanın; yenilenebilir satırlar
tek başına yetkili değildir. OpenClaw listeyi bilmek için sağlayıcı çalışma
zamanını yüklemek zorunda olduğunda `runtime` kullanın.

## modelIdNormalization referansı

Sağlayıcı çalışma zamanı yüklenmeden önce gerçekleşmesi gereken düşük maliyetli,
sağlayıcıya ait model kimliği temizliği için `modelIdNormalization` kullanın. Bu,
kısa model adları, sağlayıcıya yerel eski kimlikler ve proxy önek kuralları gibi
takma adları çekirdek model seçimi tabloları yerine sahip olan Plugin
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

| Alan                                 | Tür                     | Anlamı                                                                                    |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Büyük/küçük harfe duyarsız tam model kimliği takma adları. Değerler yazıldığı gibi döndürülür. |
| `stripPrefixes`                      | `string[]`              | Takma ad aramasından önce kaldırılacak önekler; eski sağlayıcı/model yinelemesi için yararlıdır. |
| `prefixWhenBare`                     | `string`                | Normalize edilmiş model kimliği zaten `/` içermediğinde eklenecek önek.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Takma ad aramasından sonra `modelPrefix` ve `prefix` ile anahtarlanan koşullu çıplak kimlik önek kuralları. |

## providerEndpoints referansı

Sağlayıcı çalışma zamanı yüklenmeden önce genel istek ilkesinin bilmesi gereken
uç nokta sınıflandırması için `providerEndpoints` kullanın. Çekirdek her
`endpointClass` değerinin anlamına sahip olmaya devam eder; Plugin manifestleri
ana makine ve temel URL meta verilerine sahip olur.

Uç nokta alanları:

| Alan                           | Tür        | Anlamı                                                                                         |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`, `moonshot-native` veya `google-vertex` gibi bilinen çekirdek uç nokta sınıfı.    |
| `hosts`                        | `string[]` | Uç nokta sınıfıyla eşleşen tam ana makine adları.                                              |
| `hostSuffixes`                 | `string[]` | Uç nokta sınıfıyla eşleşen ana makine sonekleri. Yalnızca alan soneki eşleşmesi için başına `.` koyun. |
| `baseUrls`                     | `string[]` | Uç nokta sınıfıyla eşleşen tam normalize edilmiş HTTP(S) temel URL’leri.                       |
| `googleVertexRegion`           | `string`   | Tam global ana makineler için statik Google Vertex bölgesi.                                    |
| `googleVertexRegionHostSuffix` | `string`   | Google Vertex bölge önekini ortaya çıkarmak için eşleşen ana makinelerden çıkarılacak sonek.  |

## providerRequest referansı

Sağlayıcı çalışma zamanını yüklemeden genel istek ilkesinin ihtiyaç duyduğu düşük
maliyetli istek uyumluluğu meta verileri için `providerRequest` kullanın.
Davranışa özel yük yeniden yazımını sağlayıcı çalışma zamanı hook’larında veya
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
| `family`              | `string`     | Genel istek uyumluluğu kararları ve tanılamaları tarafından kullanılan sağlayıcı ailesi etiketi. |
| `compatibilityFamily` | `"moonshot"` | Paylaşılan istek yardımcıları için isteğe bağlı sağlayıcı ailesi uyumluluk kovası.     |
| `openAICompletions`   | `object`     | OpenAI uyumlu tamamlama isteği bayrakları; şu anda `supportsStreamingUsage`.           |

## modelPricing referansı

Bir sağlayıcının çalışma zamanı yüklenmeden önce kontrol düzlemi fiyatlandırma
davranışına ihtiyaç duyduğunda `modelPricing` kullanın. Gateway fiyatlandırma
önbelleği bu meta verileri sağlayıcı çalışma zamanı kodunu içe aktarmadan okur.

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

| Alan         | Tür               | Anlamı                                                                                             |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter veya LiteLLM fiyatlandırmasını asla getirmemesi gereken yerel/kendi barındırılan sağlayıcılar için `false` olarak ayarlayın. |
| `openRouter` | `false \| object` | OpenRouter fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için OpenRouter aramasını devre dışı bırakır. |
| `liteLLM`    | `false \| object` | LiteLLM fiyatlandırma araması eşlemesi. `false`, bu sağlayıcı için LiteLLM aramasını devre dışı bırakır. |

Kaynak alanları:

| Alan                       | Tür                | Anlamı                                                                                                           |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw sağlayıcı kimliğinden farklı olduğunda harici katalog sağlayıcı kimliği; örneğin bir `zai` sağlayıcısı için `z-ai`. |
| `passthroughProviderModel` | `boolean`          | Eğik çizgi içeren model kimliklerini iç içe sağlayıcı/model referansları olarak ele alır; OpenRouter gibi proxy sağlayıcılar için yararlıdır. |
| `modelIdTransforms`        | `"version-dots"[]` | Ek harici katalog model kimliği varyantları. `version-dots`, `claude-opus-4.6` gibi noktalı sürüm kimliklerini dener. |

### OpenClaw Sağlayıcı Dizini

OpenClaw Sağlayıcı Dizini, Plugin’leri henüz kurulmamış olabilecek sağlayıcılar
için OpenClaw sahipli önizleme meta verileridir. Bir Plugin manifestinin parçası
değildir. Plugin manifestleri, kurulu Plugin yetki kaynağı olmaya devam eder.
Sağlayıcı Dizini, bir sağlayıcı Plugin’i kurulu olmadığında gelecekteki
kurulabilir sağlayıcı ve kurulum öncesi model seçici yüzeylerinin tüketeceği
dahili yedek sözleşmedir.

Katalog yetki sırası:

1. Kullanıcı yapılandırması.
2. Kurulu Plugin manifesti `modelCatalog`.
3. Açık yenilemeden gelen model katalog önbelleği.
4. OpenClaw Sağlayıcı Dizini önizleme satırları.

Sağlayıcı Dizini sırlar, etkin durum, çalışma zamanı hook'ları veya
canlı hesaba özgü model verileri içermemelidir. Önizleme katalogları, Plugin
manifestleriyle aynı `modelCatalog` sağlayıcı satırı şeklini kullanır, ancak
`api`, `baseUrl`, fiyatlandırma veya uyumluluk bayrakları gibi çalışma zamanı
bağdaştırıcı alanları yüklü Plugin manifestiyle kasıtlı olarak hizalı tutulmadıkça,
kararlı görüntüleme meta verileriyle sınırlı kalmalıdır. Canlı `/models` keşfine
sahip sağlayıcılar, normal listeleme veya onboarding çağrılarının sağlayıcı
API'lerini çağırması yerine yenilenen satırları açık model kataloğu önbellek
yolu üzerinden yazmalıdır.

Sağlayıcı Dizini girdileri, Plugin'i çekirdekten taşınmış veya henüz başka bir
nedenle yüklenmemiş sağlayıcılar için yüklenebilir Plugin meta verileri de
taşıyabilir. Bu meta veriler kanal kataloğu kalıbını yansıtır: paket adı, npm
yükleme belirtimi, beklenen bütünlük ve ucuz kimlik doğrulama seçeneği etiketleri
yüklenebilir bir kurulum seçeneği göstermek için yeterlidir. Plugin yüklendikten
sonra onun manifesti kazanır ve Sağlayıcı Dizini girdisi o sağlayıcı için yok
sayılır.

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` ve `webSearchProviders`
öğelerini `contracts` altına taşımak için `openclaw doctor --fix` kullanın;
normal manifest yükleme artık bu üst düzey alanları yetenek sahipliği olarak
ele almaz.

## Manifest ile package.json karşılaştırması

İki dosya farklı işler için kullanılır:

| Dosya                  | Ne için kullanılır                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce var olması gereken keşif, yapılandırma doğrulaması, kimlik doğrulama seçeneği meta verileri ve UI ipuçları |
| `package.json`         | npm meta verileri, bağımlılık yükleme ve giriş noktaları, yükleme kapısı, kurulum veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu Plugin kodunu yüklemeden önce bilmeliyse `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm yükleme davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi Plugin meta verileri kasıtlı olarak
`openclaw.plugin.json` yerine `package.json` içindeki `openclaw` bloğunda bulunur.

Önemli örnekler:

| Alan                                                              | Ne anlama gelir                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Yerel Plugin giriş noktalarını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Yüklü paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                       |
| `openclaw.setupEntry`                                             | Onboarding, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif, yalnızca kurulum giriş noktası. Plugin paket dizininin içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                      | Yüklü paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. Plugin paket dizininin içinde kalmalıdır.                                                                 |
| `openclaw.channel`                                                | Etiketler, dokümantasyon yolları, takma adlar ve seçim metni gibi ucuz kanal kataloğu meta verileri.                                                                                 |
| `openclaw.channel.commands`                                       | Kanal çalışma zamanı yüklenmeden önce yapılandırma, denetim ve komut listesi yüzeyleri tarafından kullanılan statik yerel komut ve yerel skill otomatik varsayılan meta verileri.    |
| `openclaw.channel.configuredState`                                | "Yalnızca env kurulumu zaten var mı?" sorusunu tam kanal çalışma zamanını yüklemeden yanıtlayabilen hafif yapılandırılmış durum denetleyici meta verileri.                           |
| `openclaw.channel.persistedAuthState`                             | "Herhangi bir şeyde zaten oturum açılmış mı?" sorusunu tam kanal çalışma zamanını yüklemeden yanıtlayabilen hafif kalıcı kimlik doğrulama denetleyici meta verileri.                 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketle birlikte gelen ve harici olarak yayımlanan Plugin'ler için yükleme/güncelleme ipuçları.                                                                                      |
| `openclaw.install.defaultChoice`                                  | Birden fazla yükleme kaynağı kullanılabildiğinde tercih edilen yükleme yolu.                                                                                                         |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanılarak belirtilen desteklenen en düşük OpenClaw host sürümü.                                                                          |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` gibi beklenen npm dist bütünlük dizesi; yükleme ve güncelleme akışları getirilen artifact'ı buna karşı doğrular.                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı bir paketle gelen Plugin yeniden yükleme kurtarma yoluna izin verir.                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlatma sırasında tam kanal Plugin'inden önce yalnızca kurulum kanal yüzeylerinin yüklenmesini sağlar.                                                                               |

Manifest meta verileri, çalışma zamanı yüklenmeden önce onboarding'de hangi
sağlayıcı/kanal/kurulum seçeneklerinin görüneceğini belirler.
`package.json#openclaw.install`, kullanıcı bu seçeneklerden birini seçtiğinde
onboarding'e o Plugin'in nasıl getirileceğini veya etkinleştirileceğini söyler.
Yükleme ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, yükleme ve manifest kayıt defteri yükleme
sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler
Plugin'i daha eski host'larda atlar.

Tam npm sürüm pinleme zaten `npmSpec` içinde bulunur; örneğin
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmi harici katalog
girdileri, getirilen npm artifact'ı artık pinlenmiş sürümle eşleşmiyorsa
güncelleme akışlarının kapalı şekilde başarısız olması için tam belirtimleri
`expectedIntegrity` ile eşleştirmelidir. Etkileşimli onboarding, uyumluluk için
çıplak paket adları ve dist-tag'ler dahil olmak üzere güvenilir kayıt defteri
npm belirtimlerini hâlâ sunar. Katalog tanıları tam, kayan, bütünlükle pinlenmiş,
bütünlüğü eksik, paket adı uyuşmayan ve geçersiz varsayılan seçim kaynaklarını
ayırt edebilir. Ayrıca `expectedIntegrity` mevcutken bunu pinleyebileceği geçerli
bir npm kaynağı yoksa uyarırlar. `expectedIntegrity` mevcut olduğunda,
yükleme/güncelleme akışları bunu uygular; atlandığında kayıt defteri çözümlemesi
bütünlük pini olmadan kaydedilir.

Kanal Plugin'leri, durum, kanal listesi veya SecretRef taramalarının tam çalışma
zamanını yüklemeden yapılandırılmış hesapları tanımlaması gerektiğinde
`openclaw.setupEntry` sağlamalıdır. Kurulum girişi kanal meta verilerini ve
kurulum için güvenli yapılandırma, durum ve sır bağdaştırıcılarını açığa
çıkarmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve aktarım çalışma
zamanlarını ana extension giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanları için paket
sınırı denetimlerini geçersiz kılmaz. Örneğin `openclaw.runtimeExtensions`, dışarı
kaçan bir `openclaw.extensions` yolunu yüklenebilir hale getiremez.

`openclaw.install.allowInvalidConfigRecovery` kasıtlı olarak dar kapsamlıdır.
Rastgele bozuk yapılandırmaları yüklenebilir hale getirmez. Bugün yalnızca eksik
bir paketle gelen Plugin yolu veya aynı paketle gelen Plugin için eski bir
`channels.<id>` girdisi gibi belirli eski paketle gelen Plugin yükseltme
hatalarından yükleme akışlarının kurtulmasına izin verir. İlgisiz yapılandırma
hataları yüklemeyi hâlâ engeller ve operatörleri `openclaw doctor --fix`
komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modülü için paket
meta verisidir:

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

Kurulum, doctor, durum veya salt okunur varlık akışlarının tam kanal Plugin'i
yüklenmeden önce ucuz bir evet/hayır kimlik doğrulama yoklamasına ihtiyacı
olduğunda bunu kullanın. Kalıcı kimlik doğrulama durumu yapılandırılmış kanal
durumu değildir: bu meta verileri Plugin'leri otomatik etkinleştirmek, çalışma
zamanı bağımlılıklarını onarmak veya bir kanal çalışma zamanının yüklenip
yüklenmeyeceğine karar vermek için kullanmayın. Hedef export yalnızca kalıcı
durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel'ı
üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, ucuz yalnızca env yapılandırılmış denetimler
için aynı şekli izler:

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

Bir kanal yapılandırılmış durumu env'den veya diğer küçük çalışma zamanı dışı
girdilerden yanıtlayabildiğinde bunu kullanın. Denetim tam yapılandırma
çözümlemesi veya gerçek kanal çalışma zamanı gerektiriyorsa bu mantığı bunun
yerine Plugin `config.hasConfiguredState` hook'unda tutun.

## Keşif önceliği (yinelenen Plugin kimlikleri)

OpenClaw Plugin'leri birkaç kökten keşfeder (paketle gelenler, global yükleme, workspace, açık yapılandırma tarafından seçilen yollar). İki keşif aynı `id` değerini paylaşıyorsa yalnızca **en yüksek öncelikli** manifest tutulur; daha düşük öncelikli yinelemeler yanında yüklenmek yerine bırakılır.

Öncelik, en yüksekten en düşüğe:

1. **Yapılandırma tarafından seçilen** — `plugins.entries.<id>` içinde açıkça pinlenmiş bir yol
2. **Paketle gelen** — OpenClaw ile birlikte gelen Plugin'ler
3. **Global yükleme** — global OpenClaw Plugin köküne yüklenen Plugin'ler
4. **Workspace** — geçerli workspace'e göre keşfedilen Plugin'ler

Sonuçlar:

- Workspace'te duran çatallanmış veya eski bir paketle gelen Plugin kopyası, paketle gelen derlemeyi gölgelemez.
- Paketle gelen bir Plugin'i yerel olanla gerçekten geçersiz kılmak için workspace keşfine güvenmek yerine `plugins.entries.<id>` üzerinden pinleyin; böylece öncelikle kazanır.
- Yinelenen bırakmalar günlüğe yazılır, böylece Doctor ve başlatma tanıları atılan kopyayı gösterebilir.

## JSON Schema gereksinimleri

- **Her Plugin bir JSON Schema ile gönderilmelidir**, yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin, `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma zamanında doğrulanır.

## Doğrulama davranışı

- Bilinmeyen `channels.*` anahtarları, kanal kimliği bir Plugin manifesti tarafından bildirilmedikçe **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** Plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir Plugin yüklüyse ancak manifesti veya şeması bozuksa ya da eksikse,
  doğrulama başarısız olur ve Doctor Plugin hatasını bildirir.
- Plugin yapılandırması varsa ancak Plugin **devre dışıysa**, yapılandırma korunur ve
  Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Yapılandırma referansı](/tr/gateway/configuration).

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw Plugin'leri için** gereklidir. Çalışma zamanı yine de Plugin modülünü ayrı olarak yükler; manifest yalnızca keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle son değer hâlâ bir nesne olduğu sürece yorumlar, sonda virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyici yalnızca belgelenmiş manifest alanlarını okur. Özel üst düzey anahtarlardan kaçının.
- Bir Plugin bunlara ihtiyaç duymadığında `channels`, `providers`, `cliBackends` ve `skills` atlanabilir.
- `providerDiscoveryEntry` hafif kalmalı ve geniş çalışma zamanı kodunu içe aktarmamalıdır; bunu istek zamanı yürütmesi için değil, statik sağlayıcı katalog meta verileri veya dar keşif tanımlayıcıları için kullanın.
- Ayrıcalıklı Plugin türleri `plugins.slots.*` aracılığıyla seçilir: `plugins.slots.memory` üzerinden `kind: "memory"`, `plugins.slots.contextEngine` üzerinden `kind: "context-engine"` (varsayılan `legacy`).
- Ayrıcalıklı Plugin türünü bu manifestte bildirin. Çalışma zamanı girişi `OpenClawPluginDefinition.kind` kullanımdan kaldırılmıştır ve yalnızca eski Plugin'ler için uyumluluk yedeği olarak kalır.
- Ortam değişkeni meta verileri (`setup.providers[].envVars`, kullanımdan kaldırılan `providerAuthEnvVars` ve `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, Cron teslim doğrulaması ve diğer salt okunur yüzeyler, bir ortam değişkenini yapılandırılmış kabul etmeden önce yine de Plugin güvenini ve etkinleştirme politikasını uygular.
- Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı meta verileri için bkz. [Sağlayıcı çalışma zamanı hook'ları](/tr/plugins/architecture-internals#provider-runtime-hooks).
- Plugin'iniz yerel modüllere bağlıysa derleme adımlarını ve paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## İlgili

<CardGroup cols={3}>
  <Card title="Plugin oluşturma" href="/tr/plugins/building-plugins" icon="rocket">
    Plugin'lere başlarken.
  </Card>
  <Card title="Plugin mimarisi" href="/tr/plugins/architecture" icon="diagram-project">
    Dahili mimari ve yetenek modeli.
  </Card>
  <Card title="SDK genel bakışı" href="/tr/plugins/sdk-overview" icon="book">
    Plugin SDK başvurusu ve alt yol içe aktarmaları.
  </Card>
</CardGroup>
