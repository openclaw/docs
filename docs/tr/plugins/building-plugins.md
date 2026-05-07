---
read_when:
    - Yeni bir OpenClaw Plugin oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıca ihtiyacınız var
    - OpenClaw'a yeni bir kanal, sağlayıcı, araç veya başka bir yetenek ekliyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin'inizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-05-07T13:22:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin'ler OpenClaw'a yeni yetenekler ekler: kanallar, model sağlayıcıları,
konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü
üretimi, video üretimi, web getirme, web arama, aracı araçları veya bunların
herhangi bir kombinasyonu.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. [ClawHub](/tr/tools/clawhub)
üzerinde yayımlayın; kullanıcılar
`openclaw plugins install clawhub:<package-name>` ile kurar. Çıplak paket
belirtimleri, lansman geçişi sırasında hâlâ npm'den kurulur.

## Önkoşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) bilgisi
- Depo içi Plugin'ler için: depo klonlanmış ve `pnpm install` tamamlanmış
  olmalıdır. Kaynak checkout Plugin geliştirme yalnızca pnpm ile yapılır, çünkü
  OpenClaw paketlenmiş Plugin'leri `extensions/*` çalışma alanı paketlerinden
  yükler.

## Ne tür bir Plugin?

<CardGroup cols={3}>
  <Card title="Kanal Plugin'i" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'u bir mesajlaşma platformuna bağlayın (Discord, IRC vb.)
  </Card>
  <Card title="Sağlayıcı Plugin'i" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcısı ekleyin (LLM, proxy veya özel uç nokta)
  </Card>
  <Card title="CLI arka uç Plugin'i" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    Yerel bir AI CLI'ını OpenClaw'un metin yedek çalıştırıcısına eşleyin
  </Card>
  <Card title="Araç / hook Plugin'i" icon="wrench" href="/tr/plugins/hooks">
    Aracı araçları, olay hook'ları veya hizmetler kaydedin - aşağıdan devam edin
  </Card>
</CardGroup>

Onboarding/kurulum çalıştığında kurulu olduğu garanti edilmeyen bir kanal
Plugin'i için `openclaw/plugin-sdk/channel-setup` içindeki
`createOptionalChannelSetupSurface(...)` öğesini kullanın. Bu, kurulum
gereksinimini duyuran ve Plugin kurulana kadar gerçek yapılandırma yazmalarında
kapalı başarısız olan bir kurulum bağdaştırıcısı + sihirbaz çifti üretir.

## Hızlı başlangıç: araç Plugin'i

Bu izlenecek yol, bir aracı aracı kaydeden minimal bir Plugin oluşturur. Kanal
ve sağlayıcı Plugin'leri için yukarıda bağlantısı verilen özel kılavuzlar vardır.

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

    Yapılandırması olmasa bile her Plugin'in bir manifeste ihtiyacı vardır.
    Çalışma zamanında kaydedilen araçlar `contracts.tools` içinde listelenmelidir;
    böylece OpenClaw, her Plugin çalışma zamanını yüklemeden sahip Plugin'i
    keşfedebilir. Plugin'ler ayrıca `activation.onStartup` değerini bilinçli
    olarak bildirmelidir. Bu örnek onu `true` olarak ayarlar. Tam şema için
    [Manifest](/tr/plugins/manifest) bölümüne bakın. Kanonik ClawHub yayımlama
    parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.

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
    `defineChannelPluginEntry` kullanın - bkz.
    [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins). Tam giriş noktası
    seçenekleri için [Giriş Noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.

  </Step>

  <Step title="Test edin ve yayımlayın">

    **Harici Plugin'ler:** ClawHub ile doğrulayın ve yayımlayın, ardından kurun:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin` gibi çıplak paket belirtimleri, lansman geçişi
    sırasında npm'den kurulur. ClawHub çözümlemesi istediğinizde `clawhub:`
    kullanın.

    **Depo içi Plugin'ler:** paketlenmiş Plugin çalışma alanı ağacının altına yerleştirin - otomatik olarak keşfedilir.

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
| CLI çıkarım arka ucu   | `api.registerCliBackend(...)`                    | [CLI Arka Uç Plugin'leri](/tr/plugins/cli-backend-plugins)                         |
| Kanal / mesajlaşma     | `api.registerChannel(...)`                       | [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)                               |
| Konuşma (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses     | `api.registerRealtimeVoiceProvider(...)`         | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medya anlama           | `api.registerMediaUnderstandingProvider(...)`    | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Görüntü üretimi        | `api.registerImageGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Müzik üretimi          | `api.registerMusicGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video üretimi          | `api.registerVideoGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web getirme            | `api.registerWebFetchProvider(...)`              | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web arama              | `api.registerWebSearchProvider(...)`             | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Araç sonucu ara katmanı | `api.registerAgentToolResultMiddleware(...)`     | [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api)                       |
| Aracı araçları         | `api.registerTool(...)`                          | Aşağıda                                                                         |
| Özel komutlar          | `api.registerCommand(...)`                       | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| Plugin hook'ları       | `api.on(...)`                                    | [Plugin hook'ları](/tr/plugins/hooks)                                              |
| Dahili olay hook'ları  | `api.registerHook(...)`                          | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| HTTP rotaları          | `api.registerHttpRoute(...)`                     | [Dahili Ayrıntılar](/tr/plugins/architecture-internals#gateway-http-routes)        |
| CLI alt komutları      | `api.registerCli(...)`                           | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |

Tam kayıt API'si için [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api)
bölümüne bakın.

Paketlenmiş Plugin'ler, model çıktıyı görmeden önce zaman uyumsuz araç sonucu
yeniden yazımı gerektiğinde `api.registerAgentToolResultMiddleware(...)`
kullanabilir. Hedeflenen çalışma zamanlarını `contracts.agentToolResultMiddleware`
içinde bildirin; örneğin `["pi", "codex"]`. Bu, güvenilir bir paketlenmiş-Plugin
dikişidir; harici Plugin'ler, OpenClaw bu yetenek için açık bir güven politikası
geliştirene kadar normal OpenClaw Plugin hook'larını tercih etmelidir.

Plugin'iniz özel Gateway RPC yöntemleri kaydediyorsa bunları Plugin'e özgü bir
ön ekte tutun. Çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin daha dar bir kapsam istese
bile her zaman `operator.admin` olarak çözümlenir.

Akılda tutulması gereken hook koruma semantiği:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` karar yok olarak değerlendirilir.
- `before_tool_call`: `{ requireApproval: true }` aracı yürütmesini duraklatır ve exec onay kaplaması, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu üzerinden kullanıcıdan onay ister.
- `before_install`: `{ block: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` karar yok olarak değerlendirilir.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` karar yok olarak değerlendirilir.
- `message_received`: gelen thread/konu yönlendirmesine ihtiyacınız olduğunda türlenmiş `threadId` alanını tercih edin. `metadata` alanını kanala özgü ek bilgiler için kullanın.
- `message_sending`: kanala özgü metadata anahtarları yerine türlenmiş `replyToId` / `threadId` yönlendirme alanlarını tercih edin.

`/approve` komutu, sınırlı yedeklemeyle hem exec hem de Plugin onaylarını işler:
bir exec onay kimliği bulunamadığında OpenClaw aynı kimliği Plugin onayları
üzerinden yeniden dener. Plugin onay iletimi yapılandırmada `approvals.plugin`
üzerinden bağımsız olarak yapılandırılabilir.

Özel onay tesisatının aynı sınırlı yedekleme durumunu algılaması gerekiyorsa,
onay-süresi dolumu dizgelerini elle eşleştirmek yerine
`openclaw/plugin-sdk/error-runtime` içindeki `isApprovalNotFoundError` öğesini
tercih edin.

Örnekler ve hook referansı için [Plugin hook'ları](/tr/plugins/hooks) bölümüne bakın.

## Aracı araçlarını kaydetme

Araçlar, LLM'in çağırabileceği türlenmiş işlevlerdir. Zorunlu (her zaman
kullanılabilir) veya isteğe bağlı (kullanıcı seçimine bağlı) olabilirler:

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw, kayıtlı araçtan doğrulanmış tanımlayıcıyı yakalar ve önbelleğe alır,
böylece pluginler manifestte `description` veya şema verilerini yinelemez.
Manifest sözleşmesi yalnızca sahipliği ve keşfi bildirir; yürütme yine de canlı
kayıtlı araç uygulamasını çağırır.
`api.registerTool(..., { optional: true })` ile kaydedilen araçlar için
`toolMetadata.<tool>.optional: true` ayarını yapın; böylece OpenClaw, araç açıkça
izin listesine alınana kadar o plugin çalışma zamanını yüklemekten kaçınabilir.

Kullanıcılar isteğe bağlı araçları yapılandırmada etkinleştirir:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Araç adları çekirdek araçlarla çakışmamalıdır (çakışmalar atlanır)
- Eksik `parameters` dahil hatalı biçimlendirilmiş kayıt nesnelerine sahip araçlar, ajan çalıştırmalarını bozmak yerine atlanır ve plugin tanılamalarında bildirilir
- Yan etkileri veya ek ikili dosya gereksinimleri olan araçlar için `optional: true` kullanın
- Kullanıcılar, plugin kimliğini `tools.allow` içine ekleyerek bir plugindeki tüm araçları etkinleştirebilir

## CLI komutlarını kaydetme

Pluginler, `api.registerCli` ile kök `openclaw` komut grupları ekleyebilir. OpenClaw'ın
her plugin çalışma zamanını istekli biçimde yüklemeden komutu gösterebilmesi ve
yönlendirebilmesi için her üst düzey komut kökü için `descriptors` sağlayın.

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

Tam alt yol başvurusu için bkz. [SDK Genel Bakışı](/tr/plugins/sdk-overview).

Plugininizin içinde, dahili içe aktarmalar için yerel barrel dosyaları
(`api.ts`, `runtime-api.ts`) kullanın - kendi plugininizi hiçbir zaman SDK yolu
üzerinden içe aktarmayın.

Sağlayıcı pluginleri için, dikiş gerçekten genel değilse sağlayıcıya özgü
yardımcıları paket kökü barrel'larında tutun. Mevcut paketlenmiş örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: sağlayıcı oluşturucular, varsayılan model yardımcıları, gerçek zamanlı sağlayıcılar
- OpenRouter: sağlayıcı oluşturucu ile onboarding/yapılandırma yardımcıları

Bir yardımcı yalnızca tek bir paketlenmiş sağlayıcı paketi içinde yararlıysa,
onu `openclaw/plugin-sdk/*` içine yükseltmek yerine o paket kökü dikişinde tutun.

Bazı oluşturulmuş `openclaw/plugin-sdk/<bundled-id>` yardımcı dikişleri,
izlenen sahip kullanımları olduğunda paketlenmiş plugin bakımı için hâlâ vardır.
Bunları yeni üçüncü taraf pluginler için varsayılan kalıp olarak değil, ayrılmış
yüzeyler olarak değerlendirin.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifesti mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklanmış `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar SDK öz içe aktarmalarını değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (repo içi pluginler)</Check>

## Beta sürüm testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` üzerinden abone olun. Beta etiketleri `v2026.3.N-beta.1` biçimindedir. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Beta etiketi görünür görünmez plugininizi ona karşı test edin. Kararlı sürümden önceki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalındaki plugin ileti dizinizde `all good` ya da neyin bozulduğunu paylaşın. Henüz bir ileti diziniz yoksa bir tane oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını ileti dizinize koyun.
5. `main` hedefine `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue'yu hem PR'da hem de Discord ileti dizinizde bağlayın. Katkıda bulunanlar PR'ları etiketleyemez, bu yüzden başlık bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'ı olan engelleyiciler birleştirilir; PR'ı olmayan engelleyiciler yine de gönderilebilir. Bakımcılar beta testi sırasında bu ileti dizilerini izler.
6. Sessizlik yeşil demektir. Pencereyi kaçırırsanız düzeltmeniz büyük olasılıkla bir sonraki döngüye kalır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Pluginleri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı plugini oluşturun
  </Card>
  <Card title="Sağlayıcı Pluginleri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı plugini oluşturun
  </Card>
  <Card title="CLI Arka Uç Pluginleri" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    Yerel bir AI CLI arka ucu kaydedin
  </Card>
  <Card title="SDK Genel Bakışı" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API başvurusu
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, arama, alt ajan
  </Card>
  <Card title="Test Etme" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcı programları ve kalıpları
  </Card>
  <Card title="Plugin Manifesti" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şeması başvurusu
  </Card>
</CardGroup>

## İlgili

- [Plugin Mimarisi](/tr/plugins/architecture) - dahili mimariye derin bakış
- [SDK Genel Bakışı](/tr/plugins/sdk-overview) - Plugin SDK başvurusu
- [Manifest](/tr/plugins/manifest) - plugin manifest biçimi
- [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins) - kanal pluginleri oluşturma
- [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins) - sağlayıcı pluginleri oluşturma
