---
read_when:
    - Bir OpenClaw plugin'i geliştiriyorsunuz
    - Bir plugin yapılandırma şeması yayımlamanız veya plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifest + JSON şema gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin Manifesti
x-i18n:
    generated_at: "2026-04-11T02:45:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b254c121d1eb5ea19adbd4148243cf47339c960442ab1ca0e0bfd52e0154c88
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifesti (`openclaw.plugin.json`)

Bu sayfa yalnızca **yerel OpenClaw plugin manifesti** içindir.

Uyumlu paket düzenleri için [Plugin bundles](/tr/plugins/bundles) bölümüne bakın.

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifest içermeyen varsayılan Claude bileşen
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan `openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda, düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde paket meta verilerini, bildirilmiş
skill köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını,
Claude paketi LSP varsayılanlarını ve desteklenen hook paketlerini okur.

Her yerel OpenClaw plugin'i, **plugin kökünde**
bir `openclaw.plugin.json` dosyası içermelidir. OpenClaw bu manifesti,
plugin kodunu **çalıştırmadan** yapılandırmayı doğrulamak için kullanır. Eksik veya geçersiz manifestler,
plugin hataları olarak değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam plugin sistemi kılavuzu için bkz.: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve güncel dış uyumluluk yönergeleri için:
[Capability model](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne işe yarar

`openclaw.plugin.json`, OpenClaw'ın sizin
plugin kodunuzu yüklemeden önce okuduğu meta verilerdir.

Şunlar için kullanın:

- plugin kimliği
- yapılandırma doğrulaması
- plugin çalışma zamanını başlatmadan kullanılabilir olması gereken kimlik doğrulama ve onboarding meta verileri
- plugin çalışma zamanı yüklenmeden önce çözümlenmesi gereken takma ad ve otomatik etkinleştirme meta verileri
- plugin'i çalışma zamanı yüklenmeden önce otomatik etkinleştirmesi gereken
  kısaltılmış model ailesi sahipliği meta verileri
- bundled uyumluluk bağlama ve sözleşme kapsamı için kullanılan statik yetenek sahipliği anlık görüntüleri
- çalışma zamanını yüklemeden katalog ve doğrulama
  yüzeylerine birleştirilmesi gereken kanala özgü yapılandırma meta verileri
- yapılandırma UI ipuçları

Şunlar için kullanmayın:

- çalışma zamanı davranışını kaydetmek
- kod entrypoint'lerini bildirmek
- npm install meta verileri

Bunlar plugin kodunuza ve `package.json` dosyanıza aittir.

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
  "description": "OpenRouter sağlayıcı plugin'i",
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
| `id`                                | Evet    | `string`                         | Kanonik plugin kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                                              |
| `configSchema`                      | Evet    | `object`                         | Bu plugin'in yapılandırması için satır içi JSON Şeması.                                                                                                                                                      |
| `enabledByDefault`                  | Hayır   | `true`                           | Bir bundled plugin'in varsayılan olarak etkin olduğunu işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bunu çıkarın veya `true` dışındaki herhangi bir değer ayarlayın.                     |
| `legacyPluginIds`                   | Hayır   | `string[]`                       | Bu kanonik plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders` | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunları andığında bu plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                  |
| `kind`                              | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan dışlayıcı bir plugin türü bildirir.                                                                                                                                 |
| `channels`                          | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                              |
| `providers`                         | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu sağlayıcı kimlikleri.                                                                                                                                                              |
| `modelSupport`                      | Hayır   | `object`                         | Çalışma zamanından önce plugin'i otomatik yüklemek için kullanılan, manifestin sahip olduğu kısaltılmış model ailesi meta verileri.                                                                         |
| `cliBackends`                       | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu CLI çıkarım backend kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                             |
| `commandAliases`                    | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce plugin farkındalıklı yapılandırma ve CLI tanılamaları üretmesi gereken, bu plugin'in sahip olduğu komut adları.                                                              |
| `providerAuthEnvVars`               | Hayır   | `Record<string, string[]>`       | OpenClaw'ın plugin kodunu yüklemeden inceleyebileceği düşük maliyetli sağlayıcı kimlik doğrulama ortam değişkeni meta verileri.                                                                             |
| `providerAuthAliases`               | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir coding sağlayıcısı. |
| `channelEnvVars`                    | Hayır   | `Record<string, string[]>`       | OpenClaw'ın plugin kodunu yüklemeden inceleyebileceği düşük maliyetli kanal ortam değişkeni meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam değişkeni odaklı kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`               | Hayır   | `object[]`                       | Onboarding seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlaması için düşük maliyetli kimlik doğrulama seçimi meta verileri.                                                      |
| `contracts`                         | Hayır   | `object`                         | Speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search ve araç sahipliği için statik bundled yetenek anlık görüntüsü. |
| `channelConfigs`                    | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeylerine birleştirilen, manifestin sahip olduğu kanal yapılandırma meta verileri.                                                                      |
| `skills`                            | Hayır   | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skills dizinleri.                                                                                                                                                |
| `name`                              | Hayır   | `string`                         | İnsan tarafından okunabilir plugin adı.                                                                                                                                                                      |
| `description`                       | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                    |
| `version`                           | Hayır   | `string`                         | Bilgilendirici plugin sürümü.                                                                                                                                                                                |
| `uiHints`                           | Hayır   | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, placeholder'lar ve hassasiyet ipuçları.                                                                                                                           |

## `providerAuthChoices` başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçimini açıklar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.

| Alan                  | Gerekli | Tür                                             | Anlamı                                                                                                   |
| --------------------- | ------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                        | Bu seçimin ait olduğu sağlayıcı kimliği.                                                                 |
| `method`              | Evet    | `string`                                        | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                        |
| `choiceId`            | Evet    | `string`                                        | Onboarding ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçimi kimliği.               |
| `choiceLabel`         | Hayır   | `string`                                        | Kullanıcıya dönük etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                            |
| `choiceHint`          | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                         |
| `assistantPriority`   | Hayır   | `number`                                        | Assistant tarafından yönlendirilen etkileşimli seçicilerde daha düşük değerler daha önce sıralanır.     |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                  | Manuel CLI seçimine izin vermeye devam ederken seçimi assistant seçicilerinden gizler.                  |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                      | Kullanıcıları bu yerine geçen seçime yönlendirmesi gereken eski seçim kimlikleri.                       |
| `groupId`             | Hayır   | `string`                                        | İlgili seçimleri gruplamak için isteğe bağlı grup kimliği.                                              |
| `groupLabel`          | Hayır   | `string`                                        | Bu grup için kullanıcıya dönük etiket.                                                                   |
| `groupHint`           | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                           |
| `optionKey`           | Hayır   | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için dahili seçenek anahtarı.                              |
| `cliFlag`             | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                              |
| `cliOption`           | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek şekli.                                                 |
| `cliDescription`      | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                      |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçimin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan `["text-inference"]` olur. |

## `commandAliases` başvurusu

Kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök bir CLI komutu olarak çalıştırmaya çalışabileceği bir çalışma zamanı komut adına plugin sahipse `commandAliases` kullanın. OpenClaw
bu meta verileri, plugin çalışma zamanı kodunu içe aktarmadan tanılama amacıyla kullanır.

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

| Alan         | Gerekli | Tür               | Anlamı                                                                      |
| ------------ | ------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu plugin'e ait komut adı.                                                   |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök bir CLI komutu yerine sohbet slash komutu olarak işaretler.   |
| `cliCommand` | Hayır   | `string`          | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.                   |

## `uiHints` başvurusu

`uiHints`, yapılandırma alanı adlarından küçük render ipuçlarına giden bir eşlemedir.

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

| Alan          | Tür        | Anlamı                                 |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Kullanıcıya dönük alan etiketi.        |
| `help`        | `string`   | Kısa yardımcı metin.                   |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.            |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.       |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girdileri için placeholder metni. |

## `contracts` başvurusu

`contracts` alanını yalnızca OpenClaw'ın
plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği meta verileri için kullanın.

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
| `speechProviders`                | `string[]` | Bu plugin'in sahip olduğu speech sağlayıcı kimlikleri.      |
| `realtimeTranscriptionProviders` | `string[]` | Bu plugin'in sahip olduğu realtime transcription sağlayıcı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu plugin'in sahip olduğu realtime voice sağlayıcı kimlikleri. |
| `mediaUnderstandingProviders`    | `string[]` | Bu plugin'in sahip olduğu media-understanding sağlayıcı kimlikleri. |
| `imageGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu image-generation sağlayıcı kimlikleri. |
| `videoGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu video-generation sağlayıcı kimlikleri. |
| `webFetchProviders`              | `string[]` | Bu plugin'in sahip olduğu web-fetch sağlayıcı kimlikleri.   |
| `webSearchProviders`             | `string[]` | Bu plugin'in sahip olduğu web search sağlayıcı kimlikleri.  |
| `tools`                          | `string[]` | Bundled sözleşme kontrolleri için bu plugin'in sahip olduğu agent araç adları. |

## `channelConfigs` başvurusu

Bir kanal plugin'i, çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma meta verilerine ihtiyaç duyuyorsa `channelConfigs` kullanın.

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

| Alan          | Tür                      | Anlamı                                                                                   |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Şeması. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/placeholder'lar/hassas ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçiciye ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                |
| `preferOver`  | `string[]`               | Seçim yüzeylerinde bunun gerisinde kalması gereken eski veya daha düşük öncelikli plugin kimlikleri. |

## `modelSupport` başvurusu

OpenClaw'ın, plugin çalışma zamanı yüklenmeden önce `gpt-5.4` veya `claude-sonnet-4.6` gibi
kısaltılmış model kimliklerinden sağlayıcı plugin'inizi çıkarım yapmasını istiyorsanız `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu önceliği uygular:

- açık `provider/model` başvuruları, sahip olan `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes` üzerinde önceliklidir
- bir bundled olmayan plugin ile bir bundled plugin aynı anda eşleşirse, bundled olmayan
  plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                        |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısaltılmış model kimliklerine `startsWith` ile eşleştirilen önekler.         |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısaltılmış model kimliklerine göre eşleştirilen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` ve `webSearchProviders` alanlarını `contracts` altına taşımak için
`openclaw doctor --fix` kullanın; normal
manifest yüklemesi artık bu üst düzey alanları yetenek sahipliği olarak değerlendirmez.

## Manifest ile `package.json` karşılaştırması

Bu iki dosya farklı işlere hizmet eder:

| Dosya                  | Şunun için kullanın                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Keşif, yapılandırma doğrulaması, kimlik doğrulama seçimi meta verileri ve plugin kodu çalışmadan önce var olması gereken UI ipuçları |
| `package.json`         | npm meta verileri, bağımlılık kurulumu ve entrypoint'ler, kurulum geçitlemesi, kurulum veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu plugin kodunu yüklemeden önce bilmek zorundaysa, `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm install davranışı ile ilgiliyse, `package.json` içine koyun

### Keşfi etkileyen `package.json` alanları

Bazı çalışma zamanı öncesi plugin meta verileri, bilinçli olarak
`openclaw.plugin.json` yerine `package.json` içindeki
`openclaw` bloğu altında tutulur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Yerel plugin entrypoint'lerini bildirir.                                                                                                    |
| `openclaw.setupEntry`                                             | Onboarding ve ertelenmiş kanal başlangıcı sırasında kullanılan hafif, yalnızca kurulum amaçlı entrypoint.                                  |
| `openclaw.channel`                                                | Etiketler, doküman yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog meta verileri.                                   |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden “yalnızca env tabanlı kurulum zaten var mı?” sorusunu yanıtlayabilen hafif configured-state denetleyici meta verileri. |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden “zaten oturum açılmış bir şey var mı?” sorusunu yanıtlayabilen hafif persisted-auth denetleyici meta verileri. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Bundled ve harici olarak yayımlanan plugin'ler için kurulum/güncelleme ipuçları.                                                           |
| `openclaw.install.defaultChoice`                                  | Birden fazla kurulum kaynağı mevcut olduğunda tercih edilen kurulum yolu.                                                                   |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanarak desteklenen minimum OpenClaw host sürümü.                                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı bir bundled-plugin yeniden kurulum kurtarma yoluna izin verir.                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal plugin'inden önce yalnızca kurulum amaçlı kanal yüzeylerinin yüklenmesine izin verir.                        |

`openclaw.install.minHostVersion`, kurulum sırasında ve manifest kayıt defteri
yüklenirken zorunlu kılınır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler eski host'larda plugin'i atlar.

`openclaw.install.allowInvalidConfigRecovery` bilinçli olarak dardır. Keyfi
bozuk yapılandırmaları kurulabilir hale getirmez. Bugün yalnızca kurulum
akışlarının, belirli eski bundled-plugin yükseltme hatalarından kurtulmasına izin verir; örneğin eksik bundled plugin yolu veya aynı
bundled plugin için eski bir `channels.<id>` girdisi. İlgisiz yapılandırma hataları yine kurulumu engeller ve operatörleri
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

Kurulum, doctor veya configured-state akışları tam kanal plugin'i yüklenmeden önce
düşük maliyetli bir evet/hayır kimlik doğrulama
yoklaması gerektirdiğinde bunu kullanın. Hedef export, yalnızca kalıcı durumu okuyan küçük bir
fonksiyon olmalıdır; bunu tam kanal çalışma zamanı barrel'ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca env tabanlı
configured denetimleri için aynı şekli izler:

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

Bir kanal configured-state durumunu env veya diğer küçük
çalışma zamanı dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam yapılandırma çözümlemesi veya gerçek
kanal çalışma zamanını gerektiriyorsa, bu mantığı bunun yerine plugin
`config.hasConfiguredState` hook'unda tutun.

## JSON Şeması gereksinimleri

- **Her plugin bir JSON Şeması yayımlamalıdır**, yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.

## Doğrulama davranışı

- Kanal kimliği bir
  plugin manifesti tarafından bildirilmedikçe bilinmeyen `channels.*` anahtarları **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir plugin kuruluysa ancak manifesti veya şeması bozuk ya da eksikse,
  doğrulama başarısız olur ve Doctor plugin hatasını raporlar.
- Plugin yapılandırması mevcut ama plugin **devre dışı** ise, yapılandırma korunur ve
  Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için [Configuration reference](/tr/gateway/configuration) bölümüne bakın.

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw plugin'leri için zorunludur**.
- Çalışma zamanı yine plugin modülünü ayrı olarak yükler; manifest yalnızca
  keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle son değer hâlâ bir nesne olduğu sürece yorumlar, sondaki virgüller ve
  tırnaksız anahtarlar kabul edilir.
- Manifest yükleyici yalnızca belgelenmiş manifest alanlarını okur. Buraya
  özel üst düzey anahtarlar eklemekten kaçının.
- `providerAuthEnvVars`, kimlik doğrulama yoklamaları, env işaretleyici
  doğrulaması ve env adlarını incelemek için plugin
  çalışma zamanını başlatmaması gereken benzer sağlayıcı kimlik doğrulama yüzeyleri için düşük maliyetli meta veri yoludur.
- `providerAuthAliases`, sağlayıcı varyantlarının başka bir sağlayıcının kimlik doğrulama
  env değişkenlerini, kimlik doğrulama profillerini, yapılandırma destekli kimlik doğrulamayı ve API anahtarı onboarding seçimini
  bu ilişkiyi çekirdekte sabit kodlamadan yeniden kullanmasına olanak tanır.
- `channelEnvVars`, shell-env fallback, kurulum
  istemleri ve env adlarını incelemek için
  kanal çalışma zamanını başlatmaması gereken benzer kanal yüzeyleri için düşük maliyetli meta veri yoludur.
- `providerAuthChoices`, kimlik doğrulama seçimi seçicileri,
  sağlayıcı çalışma zamanı yüklenmeden önce `--auth-choice` çözümlemesi, tercih edilen sağlayıcı eşlemesi ve basit onboarding
  CLI bayrağı kaydı için düşük maliyetli meta veri yoludur. Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı
  meta verileri için
  [Provider runtime hooks](/tr/plugins/architecture#provider-runtime-hooks) bölümüne bakın.
- Dışlayıcı plugin türleri `plugins.slots.*` üzerinden seçilir.
  - `kind: "memory"` değeri `plugins.slots.memory` ile seçilir.
  - `kind: "context-engine"` değeri `plugins.slots.contextEngine`
    ile seçilir (varsayılan: yerleşik `legacy`).
- `channels`, `providers`, `cliBackends` ve `skills`, bir
  plugin bunlara ihtiyaç duymuyorsa atlanabilir.
- Plugin'iniz yerel modüllere bağlıysa, derleme adımlarını ve
  tüm paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## İlgili

- [Building Plugins](/tr/plugins/building-plugins) — plugin'lerle çalışmaya başlama
- [Plugin Architecture](/tr/plugins/architecture) — iç mimari
- [SDK Overview](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
