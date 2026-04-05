---
read_when:
    - Bir OpenClaw plugin'i geliştiriyorsunuz
    - Bir plugin yapılandırma şeması yayımlamanız veya plugin doğrulama hatalarını hata ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin Manifesti
x-i18n:
    generated_at: "2026-04-05T14:02:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 702447ad39f295cfffd4214c3e389bee667d2f9850754f2e02e325dde8e4ac00
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifesti (`openclaw.plugin.json`)

Bu sayfa yalnızca **yerel OpenClaw plugin manifesti** içindir.

Uyumlu paket düzenleri için bkz. [Plugin bundles](/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşeni
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan `openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda paket meta verilerini, bildirilen
skill köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını,
Claude paketi LSP varsayılanlarını ve düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde
desteklenen hook paketlerini okur.

Her yerel OpenClaw plugin'i **plugin kökünde** bir `openclaw.plugin.json` dosyası
göndermek **zorundadır**. OpenClaw bu manifesti, plugin kodunu
**çalıştırmadan** yapılandırmayı doğrulamak için kullanır. Eksik veya geçersiz manifestler
plugin hatası olarak değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam plugin sistemi kılavuzu için bkz.: [Plugins](/tools/plugin).
Yerel yetenek modeli ve güncel dış uyumluluk rehberi için:
[Capability model](/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'un plugin kodunuzu yüklemeden önce okuduğu
meta verilerdir.

Şunlar için kullanın:

- plugin kimliği
- yapılandırma doğrulaması
- plugin çalışma zamanını başlatmadan kullanılabilir olması gereken auth ve onboarding meta verileri
- plugin çalışma zamanı yüklenmeden çözülmesi gereken takma ad ve otomatik etkinleştirme meta verileri
- çalışma zamanı yüklenmeden önce plugin'i otomatik etkinleştirmesi gereken
  kısa model ailesi sahipliği meta verileri
- paketlenmiş uyumluluk bağlantıları ve
  sözleşme kapsamı için kullanılan statik yetenek sahipliği anlık görüntüleri
- çalışma zamanı yüklenmeden katalog ve doğrulama
  yüzeylerine birleştirilmesi gereken kanala özgü yapılandırma meta verileri
- yapılandırma UI ipuçları

Şunlar için kullanmayın:

- çalışma zamanı davranışını kaydetme
- kod giriş noktalarını bildirme
- npm kurulum meta verileri

Bunlar plugin kodunuz ve `package.json` içine aittir.

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

| Field                               | Required | Type                             | What it means                                                                                                                                                                              |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Evet     | `string`                         | Kanonik plugin kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                             |
| `configSchema`                      | Evet     | `object`                         | Bu plugin'in yapılandırması için satır içi JSON Şeması.                                                                                                                                    |
| `enabledByDefault`                  | Hayır    | `true`                           | Paketlenmiş bir plugin'i varsayılan olarak etkin olarak işaretler. Varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` dışındaki bir değer ayarlayın.                   |
| `legacyPluginIds`                   | Hayır    | `string[]`                       | Bu kanonik plugin kimliğine normalize edilen eski kimlikler.                                                                                                                               |
| `autoEnableWhenConfiguredProviders` | Hayır    | `string[]`                       | Auth, yapılandırma veya model başvuruları bunlardan söz ettiğinde bu plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                     |
| `kind`                              | Hayır    | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan dışlayıcı plugin türünü bildirir.                                                                                                                  |
| `channels`                          | Hayır    | `string[]`                       | Bu plugin'in sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                            |
| `providers`                         | Hayır    | `string[]`                       | Bu plugin'in sahip olduğu sağlayıcı kimlikleri.                                                                                                                                            |
| `modelSupport`                      | Hayır    | `object`                         | Çalışma zamanından önce plugin'i otomatik yüklemek için kullanılan, manifest sahipliğindeki kısa model ailesi meta verileri.                                                              |
| `cliBackends`                       | Hayır    | `string[]`                       | Bu plugin'in sahip olduğu CLI çıkarım arka uç kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                          |
| `providerAuthEnvVars`               | Hayır    | `Record<string, string[]>`       | Plugin kodu yüklenmeden OpenClaw'un inceleyebileceği, düşük maliyetli sağlayıcı auth ortam meta verileri.                                                                                 |
| `providerAuthChoices`               | Hayır    | `object[]`                       | Onboarding seçicileri, tercih edilen sağlayıcı çözümleme ve basit CLI bayrak bağlantıları için düşük maliyetli auth-seçimi meta verileri.                                                |
| `contracts`                         | Hayır    | `object`                         | Konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü üretimi, video üretimi, web getirme, web arama ve araç sahipliği için statik paketlenmiş yetenek anlık görüntüsü. |
| `channelConfigs`                    | Hayır    | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeylerine birleştirilen, manifest sahipliğindeki kanal yapılandırma meta verileri.                                                   |
| `skills`                            | Hayır    | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skills dizinleri.                                                                                                                             |
| `name`                              | Hayır    | `string`                         | İnsan tarafından okunabilir plugin adı.                                                                                                                                                    |
| `description`                       | Hayır    | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                  |
| `version`                           | Hayır    | `string`                         | Bilgilendirme amaçlı plugin sürümü.                                                                                                                                                        |
| `uiHints`                           | Hayır    | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                           |

## `providerAuthChoices` başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya auth seçimini açıklar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.

| Field                 | Required | Type                                            | What it means                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet     | `string`                                        | Bu seçimin ait olduğu sağlayıcı kimliği.                                                                 |
| `method`              | Evet     | `string`                                        | Yönlendirilecek auth yöntemi kimliği.                                                                    |
| `choiceId`            | Evet     | `string`                                        | Onboarding ve CLI akışlarında kullanılan kararlı auth-seçimi kimliği.                                   |
| `choiceLabel`         | Hayır    | `string`                                        | Kullanıcıya dönük etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                            |
| `choiceHint`          | Hayır    | `string`                                        | Seçici için kısa yardımcı metin.                                                                         |
| `assistantPriority`   | Hayır    | `number`                                        | Daha düşük değerler, asistan tarafından yönlendirilen etkileşimli seçicilerde önce sıralanır.           |
| `assistantVisibility` | Hayır    | `"visible"` \| `"manual-only"`                  | Elle CLI seçimine izin vermeye devam ederken seçimi asistan seçicilerinden gizler.                      |
| `deprecatedChoiceIds` | Hayır    | `string[]`                                      | Kullanıcıları bu yedek seçime yönlendirmesi gereken eski seçim kimlikleri.                               |
| `groupId`             | Hayır    | `string`                                        | İlgili seçimleri gruplamak için isteğe bağlı grup kimliği.                                               |
| `groupLabel`          | Hayır    | `string`                                        | O grup için kullanıcıya dönük etiket.                                                                    |
| `groupHint`           | Hayır    | `string`                                        | Grup için kısa yardımcı metin.                                                                           |
| `optionKey`           | Hayır    | `string`                                        | Basit tek bayraklı auth akışları için iç seçenek anahtarı.                                               |
| `cliFlag`             | Hayır    | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                              |
| `cliOption`           | Hayır    | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                                |
| `cliDescription`      | Hayır    | `string`                                        | CLI yardımında kullanılan açıklama.                                                                      |
| `onboardingScopes`    | Hayır    | `Array<"text-inference" \| "image-generation">` | Bu seçimin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan olarak `["text-inference"]` kullanılır. |

## `uiHints` başvurusu

`uiHints`, yapılandırma alanı adlarından küçük işleme ipuçlarına giden bir eşlemdir.

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

| Field         | Type       | What it means                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Kullanıcıya dönük alan etiketi.         |
| `help`        | `string`   | Kısa yardımcı metin.                    |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.             |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.        |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girişleri için yer tutucu metin.   |

## `contracts` başvurusu

`contracts` öğesini yalnızca OpenClaw'un plugin çalışma zamanını içe aktarmadan
okuyabileceği statik yetenek sahipliği meta verileri için kullanın.

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

| Field                            | Type       | What it means                                                  |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Bu plugin'in sahip olduğu konuşma sağlayıcısı kimlikleri.      |
| `realtimeTranscriptionProviders` | `string[]` | Bu plugin'in sahip olduğu gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu plugin'in sahip olduğu gerçek zamanlı ses sağlayıcısı kimlikleri. |
| `mediaUnderstandingProviders`    | `string[]` | Bu plugin'in sahip olduğu medya-anlama sağlayıcısı kimlikleri. |
| `imageGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu görüntü-üretimi sağlayıcısı kimlikleri. |
| `videoGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu video-üretimi sağlayıcısı kimlikleri. |
| `webFetchProviders`              | `string[]` | Bu plugin'in sahip olduğu web-getirme sağlayıcısı kimlikleri.  |
| `webSearchProviders`             | `string[]` | Bu plugin'in sahip olduğu web-arama sağlayıcısı kimlikleri.    |
| `tools`                          | `string[]` | Paketlenmiş sözleşme denetimleri için bu plugin'in sahip olduğu ajan araç adları. |

## `channelConfigs` başvurusu

Bir kanal plugin'i çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma meta verilerine ihtiyaç duyuyorsa `channelConfigs` kullanın.

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

| Field         | Type                     | What it means                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Şeması. Bildirilen her kanal yapılandırma girdisi için zorunludur. |
| `uiHints`     | `Record<string, object>` | O kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucular/hassasiyet ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                 |
| `preferOver`  | `string[]`               | Bu kanalın seçim yüzeylerinde önüne geçmesi gereken eski veya daha düşük öncelikli plugin kimlikleri. |

## `modelSupport` başvurusu

OpenClaw, sağlayıcı plugin'inizi `gpt-5.4` veya `claude-sonnet-4.6` gibi
kısa model kimliklerinden, plugin çalışma zamanı yüklenmeden önce çıkarsamalıysa
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

- açık `provider/model` başvuruları sahip `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes` üzerinde önceliklidir
- paketlenmemiş bir plugin ile paketlenmiş bir plugin birlikte eşleşirse,
  paketlenmemiş plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Field           | Type       | What it means                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleştirilen ön ekler.           |
| `modelPatterns` | `string[]` | Profil soneki kaldırıldıktan sonra kısa model kimliklerine karşı eşleştirilen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` ve `webSearchProviders` alanlarını `contracts` altına
taşımak için `openclaw doctor --fix` kullanın; normal
manifest yükleme artık bu üst düzey alanları yetenek
sahipliği olarak değerlendirmez.

## Manifest ve package.json karşılaştırması

İki dosya farklı görevler üstlenir:

| File                   | Use it for                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Keşif, yapılandırma doğrulaması, auth-seçimi meta verileri ve plugin kodu çalışmadan önce var olması gereken UI ipuçları        |
| `package.json`         | npm meta verileri, bağımlılık kurulumu ve giriş noktaları, kurulum kısıtlaması, kurulum veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz, şu kuralı kullanın:

- OpenClaw bunu plugin kodunu yüklemeden önce bilmek zorundaysa, `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışı ile ilgiliyse, `package.json` içine koyun

### Keşfi etkileyen `package.json` alanları

Çalışma zamanı öncesi bazı plugin meta verileri, kasıtlı olarak `openclaw.plugin.json` yerine
`package.json` içindeki `openclaw` bloğunda bulunur.

Önemli örnekler:

| Field                                                             | What it means                                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Yerel plugin giriş noktalarını bildirir.                                               |
| `openclaw.setupEntry`                                             | Onboarding ve ertelenmiş kanal başlangıcı sırasında kullanılan hafif, yalnızca kurulum amaçlı giriş noktası. |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog meta verileri. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketlenmiş ve dışarıda yayımlanan plugin'ler için kurulum/güncelleme ipuçları.       |
| `openclaw.install.defaultChoice`                                  | Birden çok kurulum kaynağı bulunduğunda tercih edilen kurulum yolu.                    |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi semver taban çizgisi kullanan, desteklenen en düşük OpenClaw ana makine sürümü. |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar bir paketlenmiş-plugin yeniden kurulum kurtarma yoluna izin verir. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal plugin'inden önce yalnızca kurulum amaçlı kanal yüzeylerinin yüklenmesine izin verir. |

`openclaw.install.minHostVersion`, kurulum ve manifest
kayıt yükleme sırasında zorunlu kılınır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler
eski ana makinelerde plugin'i atlar.

`openclaw.install.allowInvalidConfigRecovery` kasıtlı olarak dardır. Keyfi olarak bozuk yapılandırmaları kurulabilir hale getirmez.
Bugün yalnızca belirli eski paketlenmiş-plugin yükseltme hatalarından kurtulmaya
izin verir; örneğin eksik bir paketlenmiş plugin yolu veya aynı
paketlenmiş plugin için eski bir `channels.<id>` girdisi gibi.
İlgisiz yapılandırma hataları hâlâ kurulumu engeller ve operatörleri
`openclaw doctor --fix` komutuna yönlendirir.

## JSON Şeması gereksinimleri

- **Her plugin bir JSON Şeması göndermelidir**, hiç yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.

## Doğrulama davranışı

- Bilinmeyen `channels.*` anahtarları, kanal kimliği bir
  plugin manifesti tarafından bildirilmedikçe **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** plugin kimliklerine başvurmak zorundadır. Bilinmeyen kimlikler **hatadır**.
- Bir plugin kuruluysa ancak bozuk veya eksik bir manifest ya da şemaya sahipse,
  doğrulama başarısız olur ve Doctor plugin hatasını bildirir.
- Plugin yapılandırması varsa ancak plugin **devre dışıysa**, yapılandırma korunur ve
  Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için [Configuration reference](/tr/gateway/configuration) bölümüne bakın.

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw plugin'leri için zorunludur**.
- Çalışma zamanı yine de plugin modülünü ayrı olarak yükler; manifest yalnızca
  keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle son değer hâlâ nesne olduğu sürece
  yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyicisi yalnızca belgelenmiş manifest alanlarını okur. Buraya
  özel üst düzey anahtarlar eklemekten kaçının.
- `providerAuthEnvVars`, env adlarını incelemek için plugin
  çalışma zamanını başlatmaması gereken auth yoklamaları, env-işaretleyici
  doğrulaması ve benzeri sağlayıcı-auth yüzeyleri için düşük maliyetli meta veri yoludur.
- `providerAuthChoices`, auth-seçimi seçicileri,
  `--auth-choice` çözümleme, tercih edilen sağlayıcı eşleme ve sağlayıcı çalışma zamanı yüklenmeden önce basit onboarding
  CLI bayrağı kaydı için düşük maliyetli meta veri yoludur. Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı
  meta verileri için bkz.
  [Provider runtime hooks](/plugins/architecture#provider-runtime-hooks).
- Dışlayıcı plugin türleri `plugins.slots.*` üzerinden seçilir.
  - `kind: "memory"`, `plugins.slots.memory` tarafından seçilir.
  - `kind: "context-engine"`, `plugins.slots.contextEngine`
    tarafından seçilir (varsayılan: yerleşik `legacy`).
- `channels`, `providers`, `cliBackends` ve `skills`, bir
  plugin bunlara ihtiyaç duymadığında atlanabilir.
- Plugin'iniz yerel modüllere bağlıysa, derleme adımlarını ve olası
  paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## İlgili

- [Building Plugins](/plugins/building-plugins) — plugin'lere başlangıç
- [Plugin Architecture](/plugins/architecture) — iç mimari
- [SDK Overview](/plugins/sdk-overview) — Plugin SDK başvurusu
