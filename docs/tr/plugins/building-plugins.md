---
read_when:
    - Yeni bir OpenClaw Plugin oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıca ihtiyacınız var
    - OpenClaw'a yeni bir kanal, sağlayıcı, araç veya başka bir yetenek ekliyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin’inizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-05-10T19:43:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 320ea03395cd702e62831e3b6bb3e44443b4a00701f3e6d35d7c9e556e3bb258
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin'ler OpenClaw'a yeni yetenekler ekler: kanallar, model sağlayıcıları,
konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama,
görüntü üretimi, video üretimi, web getirme, web arama, ajan araçları veya
bunların herhangi bir kombinasyonu.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. [ClawHub](/tr/clawhub)'da
yayımlayın; kullanıcılar `openclaw plugins install clawhub:<package-name>` ile
yükler. Yalın paket belirtimleri, lansman geçişi sırasında hâlâ npm'den
yüklenir.

## Önkoşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) bilgisi
- Depo içi Plugin'ler için: depo klonlanmış ve `pnpm install` yapılmış olmalıdır. Kaynak
  checkout'unda Plugin geliştirme yalnızca pnpm ile yapılır, çünkü OpenClaw paketlenmiş
  Plugin'leri `extensions/*` çalışma alanı paketlerinden yükler.

## Ne tür bir Plugin?

<CardGroup cols={3}>
  <Card title="Kanal Plugin'i" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'u bir mesajlaşma platformuna bağlayın (Discord, IRC vb.)
  </Card>
  <Card title="Sağlayıcı Plugin'i" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcısı ekleyin (LLM, proxy veya özel uç nokta)
  </Card>
  <Card title="CLI arka uç Plugin'i" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    Yerel bir AI CLI'ını OpenClaw'un metin fallback çalıştırıcısına eşleyin
  </Card>
  <Card title="Araç / kanca Plugin'i" icon="wrench" href="/tr/plugins/hooks">
    Ajan araçları, olay kancaları veya servisler kaydedin - aşağıdan devam edin
  </Card>
</CardGroup>

İlk kurulum/kurulum çalıştığında yüklü olduğu garanti edilmeyen bir kanal
Plugin'i için `openclaw/plugin-sdk/channel-setup` içinden
`createOptionalChannelSetupSurface(...)` kullanın. Bu, yükleme gereksinimini
duyuran ve Plugin yüklenene kadar gerçek yapılandırma yazmalarında güvenli biçimde
başarısız olan bir kurulum adaptörü + sihirbaz çifti üretir.

## Hızlı başlangıç: araç Plugin'i

Bu adım adım kılavuz, bir ajan aracı kaydeden minimal bir Plugin oluşturur. Kanal
ve sağlayıcı Plugin'leri için yukarıda bağlantısı verilen özel kılavuzlar vardır.

<Steps>
  <Step title="Paketi ve manifesti oluştur">
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

    Yapılandırma olmasa bile her Plugin'in bir manifeste ihtiyacı vardır. Çalışma zamanında kaydedilen araçlar,
    `contracts.tools` içinde listelenmelidir; böylece OpenClaw, her Plugin çalışma zamanını yüklemeden sahibi olan
    Plugin'i keşfedebilir. Plugin'ler ayrıca `activation.onStartup` değerini bilinçli olarak beyan etmelidir.
    Bu örnek bunu `true` olarak ayarlar. Tam şema için [Manifest](/tr/plugins/manifest) bölümüne bakın. Kanonik ClawHub
    yayımlama parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.

  </Step>

  <Step title="Giriş noktasını yaz">

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
    `defineChannelPluginEntry` kullanın - bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).
    Tam giriş noktası seçenekleri için [Giriş Noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.

  </Step>

  <Step title="Test et ve yayımla">

    **Harici Plugin'ler:** ClawHub ile doğrulayın ve yayımlayın, ardından yükleyin:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin` gibi yalın paket belirtimleri, lansman geçişi sırasında
    npm'den yüklenir. ClawHub çözümlemesi istediğinizde `clawhub:` kullanın.

    **Depo içi Plugin'ler:** paketlenmiş Plugin çalışma alanı ağacının altına yerleştirin - otomatik olarak keşfedilir.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin yetenekleri

Tek bir Plugin, `api` nesnesi üzerinden herhangi sayıda yetenek kaydedebilir:

| Yetenek                | Kayıt yöntemi                                   | Ayrıntılı kılavuz                                                               |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Metin çıkarımı (LLM)   | `api.registerProvider(...)`                     | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)                          |
| CLI çıkarım arka ucu   | `api.registerCliBackend(...)`                   | [CLI Arka Uç Plugin'leri](/tr/plugins/cli-backend-plugins)                         |
| Kanal / mesajlaşma     | `api.registerChannel(...)`                      | [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)                               |
| Konuşma (TTS/STT)      | `api.registerSpeechProvider(...)`               | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses     | `api.registerRealtimeVoiceProvider(...)`        | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medya anlama           | `api.registerMediaUnderstandingProvider(...)`   | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Görüntü üretimi        | `api.registerImageGenerationProvider(...)`      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Müzik üretimi          | `api.registerMusicGenerationProvider(...)`      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video üretimi          | `api.registerVideoGenerationProvider(...)`      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web getirme            | `api.registerWebFetchProvider(...)`             | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web arama              | `api.registerWebSearchProvider(...)`            | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Araç sonucu ara katmanı | `api.registerAgentToolResultMiddleware(...)`    | [SDK Genel Bakışı](/tr/plugins/sdk-overview#registration-api)                      |
| Ajan araçları          | `api.registerTool(...)`                         | Aşağıda                                                                         |
| Özel komutlar          | `api.registerCommand(...)`                      | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| Plugin kancaları       | `api.on(...)`                                   | [Plugin kancaları](/tr/plugins/hooks)                                             |
| Dahili olay kancaları  | `api.registerHook(...)`                         | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| HTTP rotaları          | `api.registerHttpRoute(...)`                    | [İç Yapılar](/tr/plugins/architecture-internals#gateway-http-routes)               |
| CLI alt komutları      | `api.registerCli(...)`                          | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |

Tam kayıt API'si için [SDK Genel Bakışı](/tr/plugins/sdk-overview#registration-api) bölümüne bakın.

Paketlenmiş Plugin'ler, model çıktıyı görmeden önce eşzamansız araç sonucu
yeniden yazmaya ihtiyaç duyduklarında `api.registerAgentToolResultMiddleware(...)`
kullanabilir. Hedeflenen çalışma zamanlarını `contracts.agentToolResultMiddleware`
içinde beyan edin; örneğin `["pi", "codex"]`. Bu, güvenilen bir paketlenmiş
Plugin entegrasyon noktasıdır; harici Plugin'ler, OpenClaw bu yetenek için açık
bir güven ilkesi geliştirmedikçe normal OpenClaw Plugin kancalarını tercih etmelidir.

Plugin'iniz özel Gateway RPC yöntemleri kaydediyorsa, bunları Plugin'e özgü bir
önek altında tutun. Çekirdek yönetim ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin daha dar
bir kapsam istese bile her zaman `operator.admin` olarak çözümlenir.

Aklınızda tutmanız gereken kanca koruması semantikleri:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` karar yok olarak ele alınır.
- `before_tool_call`: `{ requireApproval: true }` ajan yürütmesini duraklatır ve exec onayı katmanı, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu üzerinden kullanıcıdan onay ister.
- `before_install`: `{ block: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` karar yok olarak ele alınır.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` karar yok olarak ele alınır.
- `message_received`: gelen iş parçacığı/konu yönlendirmesine ihtiyaç duyduğunuzda tiplendirilmiş `threadId` alanını tercih edin. Kanala özgü ekler için `metadata` değerini kullanın.
- `message_sending`: kanala özgü metadata anahtarları yerine tiplendirilmiş `replyToId` / `threadId` yönlendirme alanlarını tercih edin.

`/approve` komutu hem exec hem de Plugin onaylarını sınırlı fallback ile işler: bir exec onayı kimliği bulunmadığında OpenClaw aynı kimliği Plugin onayları üzerinden yeniden dener. Plugin onayı yönlendirmesi, yapılandırmada `approvals.plugin` üzerinden bağımsız olarak yapılandırılabilir.

Özel onay akışının aynı sınırlı fallback durumunu algılaması gerekiyorsa,
onay sona erme dizelerini elle eşleştirmek yerine
`openclaw/plugin-sdk/error-runtime` içinden `isApprovalNotFoundError` kullanmayı tercih edin.

Örnekler ve kanca referansı için [Plugin kancaları](/tr/plugins/hooks) bölümüne bakın.

## Ajan araçlarını kaydetme

Araçlar, LLM'nin çağırabileceği tiplendirilmiş fonksiyonlardır. Zorunlu (her zaman
kullanılabilir) veya isteğe bağlı (kullanıcı katılımıyla) olabilirler:

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

Araç fabrikaları, çalışma zamanı tarafından sağlanan bir bağlam nesnesi alır. Bir aracın geçerli turdaki etkin modeli günlüğe kaydetmesi, görüntülemesi veya ona uyum sağlaması gerektiğinde `ctx.activeModel` kullanın. Nesne `provider`, `modelId` ve `modelRef` içerebilir. Bunu yerel operatöre, kurulu Plugin koduna veya değiştirilmiş bir OpenClaw çalışma zamanına karşı bir güvenlik sınırı olarak değil, bilgilendirici çalışma zamanı meta verisi olarak ele alın. Hassas yerel araçlar için açık bir Plugin veya operatör katılım onayı bulundurun ve etkin model meta verisi eksik ya da uygun değilse kapalı şekilde başarısız olun.

`api.registerTool(...)` ile kaydedilen her araç, Plugin manifestinde de bildirilmelidir:

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

OpenClaw, kayıtlı araçtan doğrulanmış tanımlayıcıyı yakalar ve önbelleğe alır; bu nedenle Plugin'ler manifestte `description` veya şema verilerini yinelemez. Manifest sözleşmesi yalnızca sahipliği ve keşfi bildirir; yürütme hâlâ canlı kayıtlı araç uygulamasını çağırır.
`api.registerTool(..., { optional: true })` ile kaydedilen araçlar için `toolMetadata.<tool>.optional: true` ayarlayın; böylece OpenClaw, araç açıkça izin listesine alınana kadar o Plugin çalışma zamanını yüklemekten kaçınabilir.

Kullanıcılar yapılandırmada isteğe bağlı araçları etkinleştirir:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Araç adları çekirdek araçlarla çakışmamalıdır (çakışmalar atlanır)
- Eksik `parameters` dahil olmak üzere hatalı biçimlendirilmiş kayıt nesnelerine sahip araçlar atlanır ve ajan çalıştırmalarını bozmak yerine Plugin tanılamalarında raporlanır
- Yan etkileri veya ek ikili gereksinimleri olan araçlar için `optional: true` kullanın
- Kullanıcılar, Plugin kimliğini `tools.allow` öğesine ekleyerek bir Plugin'deki tüm araçları etkinleştirebilir

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

Plugin'inizin içinde, dahili içe aktarmalar için yerel barrel dosyalarını (`api.ts`, `runtime-api.ts`) kullanın; kendi Plugin'inizi asla SDK yolu üzerinden içe aktarmayın.

Sağlayıcı Plugin'leri için, bağlantı noktası gerçekten genel değilse sağlayıcıya özgü yardımcıları bu paket kökü barrel'larında tutun. Geçerli paketli örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: sağlayıcı oluşturucuları, varsayılan model yardımcıları, gerçek zamanlı sağlayıcılar
- OpenRouter: sağlayıcı oluşturucu ve ilk kurulum/yapılandırma yardımcıları

Bir yardımcı yalnızca tek bir paketli sağlayıcı paketi içinde kullanışlıysa, onu `openclaw/plugin-sdk/*` içine yükseltmek yerine o paket kökü bağlantı noktasında tutun.

Paketli Plugin bakımı için, sahip kullanımını izledikleri durumlarda bazı oluşturulmuş `openclaw/plugin-sdk/<bundled-id>` yardımcı bağlantı noktaları hâlâ mevcuttur. Bunları yeni üçüncü taraf Plugin'ler için varsayılan desen olarak değil, ayrılmış yüzeyler olarak ele alın.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifesti mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklanmış `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar SDK öz içe aktarmalarını değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (depo içi Plugin'ler)</Check>

## Beta sürüm testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` üzerinden abone olun. Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Plugin'inizi beta etiketi göründüğü anda bu etikete karşı test edin. Kararlı sürümden önceki zaman aralığı genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalında Plugin'inizin başlığına `all good` veya neyin bozulduğunu yazın. Henüz bir başlığınız yoksa bir tane oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya mevcut issue'yu güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını başlığınıza koyun.
5. `main` için `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue'yu hem PR'da hem de Discord başlığınızda bağlayın. Katkıda bulunanlar PR'ları etiketleyemez, bu nedenle başlık bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'ı olan engelleyiciler birleştirilir; PR'ı olmayan engelleyiciler yine de yayınlanabilir. Bakımcılar beta testi sırasında bu başlıkları izler.
6. Sessizlik yeşil demektir. Zaman aralığını kaçırırsanız, düzeltmeniz muhtemelen bir sonraki döngüye girer.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugin'i oluşturun
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugin'i oluşturun
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    Yerel bir yapay zeka CLI arka ucu kaydedin
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API başvurusu
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, arama, alt ajan
  </Card>
  <Card title="Testing" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcı programları ve desenleri
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şeması başvurusu
  </Card>
</CardGroup>

## İlgili

- [Plugin Architecture](/tr/plugins/architecture) - dahili mimariye derinlemesine bakış
- [SDK Genel Bakış](/tr/plugins/sdk-overview) - Plugin SDK başvurusu
- [Manifest](/tr/plugins/manifest) - Plugin manifest biçimi
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) - kanal Plugin'leri oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) - sağlayıcı Plugin'leri oluşturma
