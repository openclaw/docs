---
read_when:
    - Yeni bir OpenClaw Plugin oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıç kılavuzuna ihtiyacınız var
    - OpenClaw’a yeni bir kanal, sağlayıcı, araç veya başka bir yetenek ekliyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin'inizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-05-02T09:00:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin'ler OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
konuşma, gerçek zamanlı yazıya dökme, gerçek zamanlı ses, medya anlama, görüntü
oluşturma, video oluşturma, web getirme, web arama, ajan araçları veya bunların
herhangi bir kombinasyonu.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. [ClawHub](/tr/tools/clawhub)
üzerinde yayımlayın; kullanıcılar `openclaw plugins install <package-name>` ile
kurar. OpenClaw önce ClawHub'ı dener ve hâlâ npm dağıtımı kullanan paketler için
otomatik olarak npm'ye geri döner.

## Önkoşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) aşinalığı
- Depo içi Plugin'ler için: depo klonlanmış ve `pnpm install` tamamlanmış olmalı.
  Kaynak checkout Plugin geliştirmesi yalnızca pnpm ile yapılır çünkü OpenClaw
  paketlenmiş Plugin'leri `extensions/*` çalışma alanı paketlerinden yükler.

## Ne tür Plugin?

<CardGroup cols={3}>
  <Card title="Kanal Plugin'i" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'ı bir mesajlaşma platformuna bağlayın (Discord, IRC vb.)
  </Card>
  <Card title="Sağlayıcı Plugin'i" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcısı ekleyin (LLM, proxy veya özel uç nokta)
  </Card>
  <Card title="Araç / hook Plugin'i" icon="wrench" href="/tr/plugins/hooks">
    Ajan araçları, olay hook'ları veya servisler kaydedin — aşağıdan devam edin
  </Card>
</CardGroup>

Onboarding/kurulum çalıştığında kurulmuş olması garanti olmayan bir kanal
Plugin'i için `openclaw/plugin-sdk/channel-setup` içinden
`createOptionalChannelSetupSurface(...)` kullanın. Bu, kurulum gereksinimini
duyuran ve Plugin kurulana kadar gerçek yapılandırma yazmalarında güvenli şekilde
başarısız olan bir kurulum bağdaştırıcısı + sihirbaz çifti üretir.

## Hızlı başlangıç: araç Plugin'i

Bu kılavuz, bir ajan aracı kaydeden minimal bir Plugin oluşturur. Kanal ve
sağlayıcı Plugin'lerinin yukarıda bağlantısı verilen özel kılavuzları vardır.

<Steps>
  <Step title="Paketi ve manifesti oluşturun">
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
      "contracts": {
        "tools": ["my_tool"]
      },
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

    Her Plugin'in, yapılandırması olmasa bile bir manifeste ihtiyacı vardır.
    Çalışma zamanında kaydedilen araçlar `contracts.tools` içinde listelenmelidir;
    böylece OpenClaw, her Plugin çalışma zamanını yüklemeden sahibi olan Plugin'i
    keşfedebilir. Plugin'ler ayrıca `activation.onStartup` değerini bilinçli
    şekilde bildirmelidir. Bu örnek bunu `true` olarak ayarlar. Tam şema için
    [Manifest](/tr/plugins/manifest) sayfasına bakın. Standart ClawHub yayımlama
    parçacıkları `docs/snippets/plugin-publish/` içinde yer alır.

  </Step>

  <Step title="Giriş noktasını yazın">

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

    `definePluginEntry`, kanal dışı Plugin'ler içindir. Kanallar için
    `defineChannelPluginEntry` kullanın — bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).
    Tam giriş noktası seçenekleri için [Giriş Noktaları](/tr/plugins/sdk-entrypoints)
    sayfasına bakın.

  </Step>

  <Step title="Test edin ve yayımlayın">

    **Harici Plugin'ler:** ClawHub ile doğrulayın ve yayımlayın, ardından kurun:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw, `@myorg/openclaw-my-plugin` gibi yalın paket belirtimleri için npm'den
    önce ClawHub'ı da kontrol eder; npm, henüz ClawHub'a taşınmamış paketler için
    geri dönüş olarak kalır.

    **Depo içi Plugin'ler:** paketlenmiş Plugin çalışma alanı ağacının altına yerleştirin — otomatik olarak keşfedilir.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin yetenekleri

Tek bir Plugin, `api` nesnesi aracılığıyla herhangi sayıda yetenek kaydedebilir:

| Yetenek                | Kayıt yöntemi                                    | Ayrıntılı kılavuz                                                               |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Metin çıkarımı (LLM)   | `api.registerProvider(...)`                      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)                          |
| CLI çıkarım arka ucu   | `api.registerCliBackend(...)`                    | [CLI Arka Uçları](/tr/gateway/cli-backends)                                        |
| Kanal / mesajlaşma     | `api.registerChannel(...)`                       | [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)                               |
| Konuşma (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı yazıya dökme | `api.registerRealtimeTranscriptionProvider(...)` | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses     | `api.registerRealtimeVoiceProvider(...)`         | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medya anlama           | `api.registerMediaUnderstandingProvider(...)`    | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Görüntü oluşturma      | `api.registerImageGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Müzik oluşturma        | `api.registerMusicGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video oluşturma        | `api.registerVideoGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web getirme            | `api.registerWebFetchProvider(...)`              | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web arama              | `api.registerWebSearchProvider(...)`             | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Araç sonucu ara katmanı | `api.registerAgentToolResultMiddleware(...)`     | [SDK Genel Bakışı](/tr/plugins/sdk-overview#registration-api)                      |
| Ajan araçları          | `api.registerTool(...)`                          | Aşağıda                                                                         |
| Özel komutlar          | `api.registerCommand(...)`                       | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| Plugin hook'ları       | `api.on(...)`                                    | [Plugin hook'ları](/tr/plugins/hooks)                                              |
| Dahili olay hook'ları  | `api.registerHook(...)`                          | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| HTTP rotaları          | `api.registerHttpRoute(...)`                     | [İç Yapı](/tr/plugins/architecture-internals#gateway-http-routes)                  |
| CLI alt komutları      | `api.registerCli(...)`                           | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |

Tam kayıt API'si için [SDK Genel Bakışı](/tr/plugins/sdk-overview#registration-api)
sayfasına bakın.

Paketlenmiş Plugin'ler, model çıktıyı görmeden önce zaman uyumsuz araç sonucu
yeniden yazmaya ihtiyaç duyduklarında `api.registerAgentToolResultMiddleware(...)`
kullanabilir. Hedeflenen çalışma zamanlarını `contracts.agentToolResultMiddleware`
içinde bildirin; örneğin `["pi", "codex"]`. Bu, güvenilen bir paketlenmiş Plugin
dikişidir; harici Plugin'ler, OpenClaw bu yetenek için açık bir güven politikası
geliştirmedikçe normal OpenClaw Plugin hook'larını tercih etmelidir.

Plugin'iniz özel Gateway RPC yöntemleri kaydediyorsa bunları Plugin'e özgü bir
ön ek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin daha dar
bir kapsam istese bile her zaman `operator.admin` olarak çözülür.

Akılda tutulması gereken hook koruma semantiği:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` karar yok olarak ele alınır.
- `before_tool_call`: `{ requireApproval: true }` ajan yürütmesini duraklatır ve exec onay katmanı, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu aracılığıyla kullanıcıdan onay ister.
- `before_install`: `{ block: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` karar yok olarak ele alınır.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` karar yok olarak ele alınır.
- `message_received`: gelen thread/konu yönlendirmesine ihtiyaç duyduğunuzda tiplendirilmiş `threadId` alanını tercih edin. `metadata` değerini kanala özgü ekler için tutun.
- `message_sending`: kanala özgü metadata anahtarları yerine tiplendirilmiş `replyToId` / `threadId` yönlendirme alanlarını tercih edin.

`/approve` komutu hem exec hem de Plugin onaylarını sınırlı geri dönüşle işler:
bir exec onay kimliği bulunamadığında OpenClaw aynı kimliği Plugin onayları
üzerinden yeniden dener. Plugin onay yönlendirmesi yapılandırmada
`approvals.plugin` aracılığıyla bağımsız olarak yapılandırılabilir.

Özel onay tesisatı aynı sınırlı geri dönüş durumunu algılamak zorundaysa, onay
süresi dolma dizelerini elle eşleştirmek yerine
`openclaw/plugin-sdk/error-runtime` içinden `isApprovalNotFoundError` kullanmayı
tercih edin.

Örnekler ve hook referansı için [Plugin hook'ları](/tr/plugins/hooks) sayfasına bakın.

## Ajan araçlarını kaydetme

Araçlar, LLM'nin çağırabileceği tiplendirilmiş işlevlerdir. Zorunlu (her zaman
kullanılabilir) veya isteğe bağlı (kullanıcının seçimine bağlı) olabilirler:

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

`api.registerTool(...)` ile kaydedilen her araç, Plugin manifestinde de
bildirilmelidir:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

Kullanıcılar isteğe bağlı araçları yapılandırmada etkinleştirir:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Araç adları çekirdek araçlarla çakışmamalıdır (çakışmalar atlanır)
- Eksik `parameters` dahil hatalı biçimlendirilmiş kayıt nesnelerine sahip araçlar atlanır ve ajan çalıştırmalarını bozmak yerine Plugin tanılamalarında raporlanır
- Yan etkileri veya ek ikili gereksinimleri olan araçlar için `optional: true` kullanın
- Kullanıcılar Plugin kimliğini `tools.allow` içine ekleyerek bir Plugin'deki tüm araçları etkinleştirebilir

## CLI komutlarını kaydetme

Plugin'ler `api.registerCli` ile kök `openclaw` komut grupları ekleyebilir. OpenClaw'ın her Plugin çalışma zamanını hevesle yüklemeden komutu gösterebilmesi ve yönlendirebilmesi için her üst düzey komut kökü için `descriptors` sağlayın.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Kurulumdan sonra çalışma zamanı kaydını doğrulayın ve komutu yürütün:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## İçe aktarma kuralları

Her zaman odaklanmış `openclaw/plugin-sdk/<subpath>` yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Tam alt yol başvurusu için bkz. [SDK Genel Bakış](/tr/plugins/sdk-overview).

Plugin'iniz içinde dahili içe aktarmalar için yerel barrel dosyalarını (`api.ts`, `runtime-api.ts`) kullanın; kendi Plugin'inizi asla SDK yolu üzerinden içe aktarmayın.

Sağlayıcı Plugin'leri için, sağlayıcıya özgü yardımcıları, seam gerçekten genel olmadığı sürece bu paket kökü barrel'larında tutun. Mevcut paketlenmiş örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: sağlayıcı oluşturucular, varsayılan model yardımcıları, gerçek zamanlı sağlayıcılar
- OpenRouter: sağlayıcı oluşturucu ve onboarding/yapılandırma yardımcıları

Bir yardımcı yalnızca tek bir paketlenmiş sağlayıcı paketi içinde kullanışlıysa, onu `openclaw/plugin-sdk/*` içine yükseltmek yerine bu paket kökü seam'inde tutun.

Bazı oluşturulmuş `openclaw/plugin-sdk/<bundled-id>` yardımcı seam'leri, izlenen sahip kullanımı olduğunda paketlenmiş Plugin bakımı için hâlâ mevcuttur. Bunları yeni üçüncü taraf Plugin'ler için varsayılan kalıp olarak değil, ayrılmış yüzeyler olarak değerlendirin.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifest mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklanmış `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar SDK öz içe aktarmalarını değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (repo içi Plugin'ler)</Check>

## Beta sürüm testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` üzerinden abone olun. Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Plugin'inizi beta etiketi görünür görünmez ona karşı test edin. Kararlı sürümden önceki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalındaki Plugin başlığınızda `all good` veya neyin bozulduğunu paylaşın. Henüz bir başlığınız yoksa bir tane oluşturun.
4. Bir şey bozulursa, `Beta blocker: <plugin-name> - <summary>` başlıklı bir sorun açın veya güncelleyin ve `beta-blocker` etiketini uygulayın. Sorun bağlantısını başlığınıza koyun.
5. `main` için `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve sorunu hem PR'da hem de Discord başlığınızda bağlayın. Katkıda bulunanlar PR'ları etiketleyemez, bu nedenle başlık bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'ı olan engelleyiciler birleştirilir; PR'ı olmayan engelleyiciler yine de yayımlanabilir. Bakımcılar beta testi sırasında bu başlıkları izler.
6. Sessizlik yeşil demektir. Pencereyi kaçırırsanız, düzeltmeniz büyük olasılıkla sonraki döngüye kalır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Mesajlaşma kanalı Plugin'i oluşturun
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Model sağlayıcı Plugin'i oluşturun
  </Card>
  <Card title="SDK Genel Bakış" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API başvurusu
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, arama, alt ajan
  </Card>
  <Card title="Test Etme" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcı programları ve kalıpları
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şeması başvurusu
  </Card>
</CardGroup>

## İlgili

- [Plugin Mimarisi](/tr/plugins/architecture) — dahili mimariye derinlemesine bakış
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
- [Manifest](/tr/plugins/manifest) — Plugin manifest biçimi
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal Plugin'leri oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı Plugin'leri oluşturma
