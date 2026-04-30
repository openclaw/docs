---
read_when:
    - Yeni bir OpenClaw Plugin oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıç kılavuzuna ihtiyacınız var
    - OpenClaw'a yeni bir kanal, sağlayıcı, araç veya başka bir yetenek ekliyorsunuz
sidebarTitle: Getting Started
summary: Dakikalar içinde ilk OpenClaw Plugin'inizi oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-04-30T09:33:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins, OpenClaw'u yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görsel
oluşturma, video oluşturma, web fetch, web arama, agent araçları veya bunların
herhangi bir kombinasyonu.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. [ClawHub](/tr/tools/clawhub)
üzerinde yayımlayın; kullanıcılar `openclaw plugins install <package-name>` ile
kurar. OpenClaw önce ClawHub'ı dener ve hâlâ npm dağıtımı kullanan paketler için
otomatik olarak npm'ye geri döner.

## Ön Koşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) bilgisi
- Depo içi Plugin'ler için: depo klonlanmış ve `pnpm install` yapılmış olmalı

## Ne tür bir Plugin?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'u bir mesajlaşma platformuna bağlayın (Discord, IRC vb.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcısı ekleyin (LLM, proxy veya özel uç nokta)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/tr/plugins/hooks">
    Agent araçları, olay hook'ları veya hizmetler kaydedin — aşağıdan devam edin
  </Card>
</CardGroup>

Onboarding/kurulum çalıştığında kurulmuş olacağı garanti olmayan bir kanal Plugin'i
için `openclaw/plugin-sdk/channel-setup` içindeki
`createOptionalChannelSetupSurface(...)` kullanın. Kurulum gereksinimini duyuran
ve Plugin kurulana kadar gerçek yapılandırma yazımlarında kapalı başarısız olan
bir kurulum adaptörü + sihirbaz çifti üretir.

## Hızlı başlangıç: araç Plugin'i

Bu kılavuz, bir agent aracı kaydeden minimal bir Plugin oluşturur. Kanal ve
sağlayıcı Plugin'leri için yukarıda bağlantısı verilen özel kılavuzlar vardır.

<Steps>
  <Step title="Create the package and manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Her Plugin, yapılandırması olmasa bile bir manifest gerektirir ve her Plugin
    `activation.onStartup` değerini bilinçli olarak bildirmelidir. Çalışma zamanı
    kaydı yapılan araçlar başlangıç içe aktarması gerektirir, bu nedenle bu örnek
    bunu `true` olarak ayarlar. Tam şema için [Manifest](/tr/plugins/manifest)
    bölümüne bakın. Kanonik ClawHub yayımlama parçacıkları
    `docs/snippets/plugin-publish/` içinde bulunur.

  </Step>

  <Step title="Write the entry point">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry`, kanal olmayan Plugin'ler içindir. Kanallar için
    `defineChannelPluginEntry` kullanın — bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).
    Tam giriş noktası seçenekleri için [Giriş Noktaları](/tr/plugins/sdk-entrypoints)
    bölümüne bakın.

  </Step>

  <Step title="Test and publish">

    **Harici Plugin'ler:** ClawHub ile doğrulayın ve yayımlayın, ardından kurun:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw ayrıca `@myorg/openclaw-my-plugin` gibi çıplak paket belirtimleri
    için npm'den önce ClawHub'ı denetler; npm, henüz ClawHub'a geçirilmemiş
    paketler için yedek olarak kalır.

    **Depo içi Plugin'ler:** paketlenmiş Plugin workspace ağacının altına yerleştirin — otomatik olarak keşfedilir.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin yetenekleri

Tek bir Plugin, `api` nesnesi üzerinden herhangi sayıda yetenek kaydedebilir:

| Yetenek                | Kayıt yöntemi                                   | Ayrıntılı kılavuz                                                               |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Metin çıkarımı (LLM)   | `api.registerProvider(...)`                      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)                          |
| CLI çıkarım backend'i  | `api.registerCliBackend(...)`                    | [CLI Backend'leri](/tr/gateway/cli-backends)                                       |
| Kanal / mesajlaşma     | `api.registerChannel(...)`                       | [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)                               |
| Konuşma (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses     | `api.registerRealtimeVoiceProvider(...)`         | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medya anlama           | `api.registerMediaUnderstandingProvider(...)`    | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Görsel oluşturma       | `api.registerImageGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Müzik oluşturma        | `api.registerMusicGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video oluşturma        | `api.registerVideoGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web arama              | `api.registerWebSearchProvider(...)`             | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Araç sonucu middleware'i | `api.registerAgentToolResultMiddleware(...)`     | [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api)                       |
| Agent araçları         | `api.registerTool(...)`                          | Aşağıda                                                                         |
| Özel komutlar          | `api.registerCommand(...)`                       | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| Plugin hook'ları       | `api.on(...)`                                    | [Plugin hook'ları](/tr/plugins/hooks)                                             |
| Dahili olay hook'ları  | `api.registerHook(...)`                          | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| HTTP rotaları          | `api.registerHttpRoute(...)`                     | [İç Yapılar](/tr/plugins/architecture-internals#gateway-http-routes)               |
| CLI alt komutları      | `api.registerCli(...)`                           | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |

Tam kayıt API'si için [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api)
bölümüne bakın.

Paketlenmiş Plugin'ler, model çıktıyı görmeden önce async araç sonucu yeniden
yazımı gerektiğinde `api.registerAgentToolResultMiddleware(...)` kullanabilir.
Hedeflenen çalışma zamanlarını `contracts.agentToolResultMiddleware` içinde
bildirin, örneğin `["pi", "codex"]`. Bu, güvenilir bir paketlenmiş Plugin
seam'idir; OpenClaw bu yetenek için açık bir güven politikası geliştirmedikçe
harici Plugin'ler normal OpenClaw Plugin hook'larını tercih etmelidir.

Plugin'iniz özel Gateway RPC yöntemleri kaydediyorsa bunları Plugin'e özgü bir
önek altında tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin daha dar
bir kapsam istese bile her zaman `operator.admin` olarak çözümlenir.

Akılda tutulması gereken hook koruyucu semantiği:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` karar yok olarak ele alınır.
- `before_tool_call`: `{ requireApproval: true }` agent yürütmesini duraklatır ve exec onay katmanı, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu üzerinden kullanıcıdan onay ister.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` karar yok olarak ele alınır.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` karar yok olarak ele alınır.
- `message_received`: gelen thread/konu yönlendirmesine ihtiyacınız olduğunda tipli `threadId` alanını tercih edin. `metadata` alanını kanala özgü ekstralar için tutun.
- `message_sending`: kanala özgü metadata anahtarları yerine tipli `replyToId` / `threadId` yönlendirme alanlarını tercih edin.

`/approve` komutu hem exec hem de Plugin onaylarını sınırlı yedekle işler: bir
exec onay kimliği bulunamadığında OpenClaw aynı kimliği Plugin onayları üzerinden
yeniden dener. Plugin onay iletimi yapılandırmada `approvals.plugin` üzerinden
bağımsız olarak yapılandırılabilir.

Özel onay tesisatının aynı sınırlı yedek durumu algılaması gerekiyorsa onay
süresi dolma dizelerini elle eşleştirmek yerine
`openclaw/plugin-sdk/error-runtime` içindeki `isApprovalNotFoundError` kullanın.

Örnekler ve hook başvurusu için [Plugin hook'ları](/tr/plugins/hooks) bölümüne
bakın.

## Agent araçlarını kaydetme

Araçlar, LLM'nin çağırabileceği tipli işlevlerdir. Zorunlu (her zaman
kullanılabilir) veya isteğe bağlı (kullanıcı opt-in) olabilirler:

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Kullanıcılar isteğe bağlı araçları yapılandırmada etkinleştirir:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Araç adları çekirdek araçlarla çakışmamalıdır (çakışmalar atlanır)
- Eksik `parameters` dahil hatalı biçimlendirilmiş kayıt nesnelerine sahip araçlar, agent çalıştırmalarını bozmak yerine atlanır ve Plugin tanılamalarında raporlanır
- Yan etkileri veya ek ikili gereksinimleri olan araçlar için `optional: true` kullanın
- Kullanıcılar Plugin kimliğini `tools.allow` alanına ekleyerek bir Plugin'deki tüm araçları etkinleştirebilir

## İçe aktarma kuralları

Her zaman odaklı `openclaw/plugin-sdk/<subpath>` yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Tam alt yol başvurusu için [SDK Genel Bakışı](/tr/plugins/sdk-overview) bölümüne bakın.

Plugin'inizde, dahili içe aktarmalar için yerel barrel dosyalarını (`api.ts`, `runtime-api.ts`) kullanın; kendi Plugin'inizi asla SDK yolu üzerinden içe aktarmayın.

Sağlayıcı Plugin'leri için, seam gerçekten genel olmadığı sürece sağlayıcıya özgü yardımcıları paket kökü barrel'larında tutun. Güncel paketli örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: sağlayıcı oluşturucular, varsayılan model yardımcıları, gerçek zamanlı sağlayıcılar
- OpenRouter: sağlayıcı oluşturucu ile onboarding/yapılandırma yardımcıları

Bir yardımcı yalnızca tek bir paketli sağlayıcı paketi içinde işe yarıyorsa, onu `openclaw/plugin-sdk/*` içine taşımak yerine ilgili paket kökü seam'inde tutun.

Bazı oluşturulmuş `openclaw/plugin-sdk/<bundled-id>` yardımcı seam'leri, izlenen sahip kullanımı olduğunda paketli Plugin bakımı için hâlâ mevcuttur. Bunları yeni üçüncü taraf Plugin'ler için varsayılan kalıp olarak değil, ayrılmış yüzeyler olarak ele alın.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifest'i mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklanmış `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar yerel modülleri kullanıyor, SDK kendi kendine içe aktarmalarını değil</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (repo içi Plugin'ler)</Check>

## Beta sürüm testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` üzerinden abone olun. Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Beta etiketi görünür görünmez Plugin'inizi bu etikete karşı test edin. Kararlı sürümden önceki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalındaki Plugin'inizin ileti dizisine `all good` veya neyin bozulduğunu yazın. Henüz bir ileti diziniz yoksa bir tane oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya mevcut issue'yu güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını ileti dizinize koyun.
5. `main` için `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue'yu hem PR'da hem de Discord ileti dizinizde bağlayın. Katkıda bulunanlar PR'ları etiketleyemez, bu nedenle başlık bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'ı olan engelleyiciler birleştirilir; olmayanlar yine de gönderilebilir. Bakımcılar beta testi sırasında bu ileti dizilerini izler.
6. Sessizlik yeşil demektir. Pencereyi kaçırırsanız, düzeltmeniz büyük olasılıkla bir sonraki döngüde yer alır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugin'i oluşturun
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcısı Plugin'i oluşturun
  </Card>
  <Card title="SDK Genel Bakışı" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API başvurusu
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, arama, alt ajan
  </Card>
  <Card title="Test" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test araçları ve kalıpları
  </Card>
  <Card title="Plugin Manifest'i" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şeması başvurusu
  </Card>
</CardGroup>

## İlgili

- [Plugin Mimarisi](/tr/plugins/architecture) — dahili mimariye derinlemesine bakış
- [SDK Genel Bakışı](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
- [Manifest](/tr/plugins/manifest) — Plugin manifest biçimi
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal Plugin'leri oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı Plugin'leri oluşturma
