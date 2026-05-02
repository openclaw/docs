---
read_when:
    - Yeni bir OpenClaw Plugin oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıç kılavuzuna ihtiyacınız var
    - OpenClaw'a yeni bir kanal, sağlayıcı, araç veya başka bir yetenek ekliyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin'inizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-05-02T20:47:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins, OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
konuşma, gerçek zamanlı yazıya dökme, gerçek zamanlı ses, medya anlama, görüntü
üretimi, video üretimi, web getirme, web araması, ajan araçları veya bunların
herhangi bir kombinasyonu.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. [ClawHub](/tr/tools/clawhub)
üzerinde yayınlayın; kullanıcılar
`openclaw plugins install clawhub:<package-name>` ile kurar. Çıkarma geçişi
sırasında yalın paket belirtimleri hâlâ npm'den kurulur.

## Ön Koşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) aşinalığı
- Depo içi plugin'ler için: depo klonlanmış ve `pnpm install` tamamlanmış olmalı.
  Kaynak checkout plugin geliştirme yalnızca pnpm ile yapılır, çünkü OpenClaw
  paketlenmiş plugin'leri `extensions/*` çalışma alanı paketlerinden yükler.

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

İlk katılım/kurulum çalıştığında kurulu olacağı garanti olmayan bir kanal
Plugin'i için `openclaw/plugin-sdk/channel-setup` içinden
`createOptionalChannelSetupSurface(...)` kullanın. Bu, kurulum gereksinimini
duyuran ve Plugin kurulana kadar gerçek yapılandırma yazmalarında kapalı şekilde
başarısız olan bir kurulum adaptörü + sihirbaz çifti üretir.

## Hızlı başlangıç: araç Plugin'i

Bu rehber, bir ajan aracı kaydeden minimal bir Plugin oluşturur. Kanal ve
sağlayıcı Plugin'leri için yukarıda bağlantısı verilen özel kılavuzlar vardır.

<Steps>
  <Step title="Paketi ve manifest dosyasını oluşturun">
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
    şekilde bildirmelidir. Bu örnek bunu `true` olarak ayarlar. Tam şema için
    [Manifest](/tr/plugins/manifest) bölümüne bakın. Kanonik ClawHub yayınlama
    parçacıkları `docs/snippets/plugin-publish/` içindedir.

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

    `definePluginEntry`, kanal olmayan Plugin'ler içindir. Kanallar için
    `defineChannelPluginEntry` kullanın — bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).
    Tam giriş noktası seçenekleri için bkz. [Giriş Noktaları](/tr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test edin ve yayınlayın">

    **Harici Plugin'ler:** ClawHub ile doğrulayın ve yayınlayın, ardından kurun:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin` gibi yalın paket belirtimleri, çıkarma geçişi
    sırasında npm'den kurulur. ClawHub çözümlemesi istediğinizde `clawhub:`
    kullanın.

    **Depo içi Plugin'ler:** paketlenmiş Plugin çalışma alanı ağacının altına yerleştirin — otomatik olarak keşfedilir.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin yetenekleri

Tek bir Plugin, `api` nesnesi üzerinden herhangi sayıda yetenek kaydedebilir:

| Yetenek                 | Kayıt yöntemi                                   | Ayrıntılı kılavuz                                                              |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Metin çıkarımı (LLM)    | `api.registerProvider(...)`                     | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)                         |
| CLI çıkarım arka ucu    | `api.registerCliBackend(...)`                   | [CLI Arka Uçları](/tr/gateway/cli-backends)                                       |
| Kanal / mesajlaşma      | `api.registerChannel(...)`                      | [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)                              |
| Konuşma (TTS/STT)       | `api.registerSpeechProvider(...)`               | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı yazıya dökme | `api.registerRealtimeTranscriptionProvider(...)` | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses      | `api.registerRealtimeVoiceProvider(...)`        | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medya anlama            | `api.registerMediaUnderstandingProvider(...)`   | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Görüntü üretimi         | `api.registerImageGenerationProvider(...)`      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Müzik üretimi           | `api.registerMusicGenerationProvider(...)`      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video üretimi           | `api.registerVideoGenerationProvider(...)`      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web getirme             | `api.registerWebFetchProvider(...)`             | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web araması             | `api.registerWebSearchProvider(...)`            | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Araç sonucu middleware'i | `api.registerAgentToolResultMiddleware(...)`    | [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api)                      |
| Ajan araçları           | `api.registerTool(...)`                         | Aşağıda                                                                        |
| Özel komutlar           | `api.registerCommand(...)`                      | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                    |
| Plugin hook'ları        | `api.on(...)`                                   | [Plugin hook'ları](/tr/plugins/hooks)                                             |
| Dahili olay hook'ları   | `api.registerHook(...)`                         | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                    |
| HTTP rotaları           | `api.registerHttpRoute(...)`                    | [İç Yapılar](/tr/plugins/architecture-internals#gateway-http-routes)              |
| CLI alt komutları       | `api.registerCli(...)`                          | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                    |

Tam kayıt API'si için bkz. [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api).

Paketlenmiş Plugin'ler, model çıktıyı görmeden önce zaman uyumsuz araç sonucu
yeniden yazımına ihtiyaç duyduklarında `api.registerAgentToolResultMiddleware(...)`
kullanabilir. Hedeflenen çalışma zamanlarını `contracts.agentToolResultMiddleware`
içinde bildirin; örneğin `["pi", "codex"]`. Bu, güvenilir bir paketlenmiş-Plugin
sınırıdır; OpenClaw bu yetenek için açık bir güven politikası geliştirmedikçe
harici Plugin'ler normal OpenClaw Plugin hook'larını tercih etmelidir.

Plugin'iniz özel gateway RPC yöntemleri kaydediyorsa, bunları Plugin'e özgü bir
ön ekte tutun. Çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin daha dar bir kapsam istese
bile her zaman `operator.admin` olarak çözümlenir.

Akılda tutulması gereken hook koruma semantiği:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` karar yok olarak değerlendirilir.
- `before_tool_call`: `{ requireApproval: true }` ajan yürütmesini duraklatır ve exec onay bindirmesi, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu üzerinden kullanıcıdan onay ister.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` karar yok olarak değerlendirilir.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` karar yok olarak değerlendirilir.
- `message_received`: gelen thread/konu yönlendirmesine ihtiyaç duyduğunuzda tipli `threadId` alanını tercih edin. Kanala özgü ekler için `metadata` alanını tutun.
- `message_sending`: kanala özgü metadata anahtarları yerine tipli `replyToId` / `threadId` yönlendirme alanlarını tercih edin.

`/approve` komutu hem exec hem de Plugin onaylarını sınırlı yedekle işler: bir
exec onay id'si bulunamadığında OpenClaw aynı id'yi Plugin onayları üzerinden
yeniden dener. Plugin onay yönlendirmesi yapılandırmada `approvals.plugin`
üzerinden bağımsız olarak yapılandırılabilir.

Özel onay tesisatının aynı sınırlı yedekleme durumunu algılaması gerekiyorsa,
onay süre dolumu dizelerini elle eşleştirmek yerine
`openclaw/plugin-sdk/error-runtime` içinden `isApprovalNotFoundError` kullanmayı
tercih edin.

Örnekler ve hook başvurusu için bkz. [Plugin hook'ları](/tr/plugins/hooks).

## Ajan araçlarını kaydetme

Araçlar, LLM'in çağırabileceği tipli fonksiyonlardır. Zorunlu (her zaman
kullanılabilir) veya isteğe bağlı (kullanıcı katılımıyla) olabilirler:

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

OpenClaw, kaydedilen araçtan doğrulanmış tanımlayıcıyı yakalar ve önbelleğe
alır; böylece Plugin'ler manifest içinde `description` veya şema verilerini
çoğaltmaz. Manifest sözleşmesi yalnızca sahipliği ve keşfi bildirir; yürütme
yine canlı kaydedilmiş araç uygulamasını çağırır.

Kullanıcılar isteğe bağlı araçları yapılandırmada etkinleştirir:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Araç adları çekirdek araçlarla çakışmamalıdır (çakışmalar atlanır)
- Eksik `parameters` dahil hatalı biçimlendirilmiş kayıt nesnelerine sahip araçlar atlanır ve agent çalıştırmalarını bozmak yerine Plugin tanılamalarında raporlanır
- Yan etkileri veya ek ikili dosya gereksinimleri olan araçlar için `optional: true` kullanın
- Kullanıcılar, Plugin kimliğini `tools.allow` öğesine ekleyerek bir Plugin içindeki tüm araçları etkinleştirebilir

## CLI komutlarını kaydetme

Plugin’ler, `api.registerCli` ile kök `openclaw` komut grupları ekleyebilir. OpenClaw’ın her Plugin çalışma zamanını önceden yüklemeden komutu gösterebilmesi ve yönlendirebilmesi için her üst düzey komut kökü adına `descriptors` sağlayın.

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

Kurulumdan sonra çalışma zamanı kaydını doğrulayın ve komutu çalıştırın:

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

Tam alt yol referansı için [SDK Genel Bakışı](/tr/plugins/sdk-overview) bölümüne bakın.

Plugin’iniz içinde dahili içe aktarmalar için yerel barrel dosyalarını (`api.ts`, `runtime-api.ts`) kullanın; kendi Plugin’inizi hiçbir zaman SDK yolu üzerinden içe aktarmayın.

Sağlayıcı Plugin’ler için, sağlayıcıya özgü yardımcıları, seam gerçekten genel olmadığı sürece bu paket kökü barrel’larında tutun. Mevcut paketlenmiş örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: sağlayıcı oluşturucuları, varsayılan model yardımcıları, gerçek zamanlı sağlayıcılar
- OpenRouter: sağlayıcı oluşturucu ve onboarding/config yardımcıları

Bir yardımcı yalnızca tek bir paketlenmiş sağlayıcı paketi içinde kullanışlıysa, onu `openclaw/plugin-sdk/*` içine taşımak yerine o paket kökü seam üzerinde tutun.

Paketlenmiş Plugin bakımı için, izlenen sahip kullanımı olduğunda bazı üretilmiş `openclaw/plugin-sdk/<bundled-id>` yardımcı seam’leri hâlâ mevcuttur. Bunları yeni üçüncü taraf Plugin’ler için varsayılan desen olarak değil, ayrılmış yüzeyler olarak ele alın.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifesti mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklanmış `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar SDK kendi kendine içe aktarmaları değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (repo içi Plugin’ler)</Check>

## Beta sürüm testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` üzerinden abone olun. Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Plugin’inizi beta etiketi görünür görünmez ona karşı test edin. Kararlı sürümden önceki zaman aralığı genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalındaki Plugin başlığınıza `all good` ya da neyin bozulduğunu yazın. Henüz bir başlığınız yoksa bir tane oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya mevcut bir issue’yu güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını başlığınıza koyun.
5. `main` dalına yönelik, `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue’yu hem PR’da hem de Discord başlığınızda bağlayın. Katkıda bulunanlar PR’ları etiketleyemez, bu nedenle başlık bakıcılar ve otomasyon için PR tarafındaki sinyaldir. PR’ı olan engelleyiciler birleştirilir; PR’ı olmayan engelleyiciler yine de yayımlanabilir. Bakıcılar beta testi sırasında bu başlıkları izler.
6. Sessizlik yeşil demektir. Zaman aralığını kaçırırsanız düzeltmeniz büyük olasılıkla bir sonraki döngüde yer alır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Plugin’leri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugin’i oluşturun
  </Card>
  <Card title="Sağlayıcı Plugin’leri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugin’i oluşturun
  </Card>
  <Card title="SDK Genel Bakışı" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API’si referansı
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, arama, alt agent
  </Card>
  <Card title="Test" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcı programları ve desenleri
  </Card>
  <Card title="Plugin Manifesti" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şeması referansı
  </Card>
</CardGroup>

## İlgili

- [Plugin Mimarisi](/tr/plugins/architecture) — dahili mimariye derinlemesine bakış
- [SDK Genel Bakışı](/tr/plugins/sdk-overview) — Plugin SDK referansı
- [Manifest](/tr/plugins/manifest) — Plugin manifest biçimi
- [Kanal Plugin’leri](/tr/plugins/sdk-channel-plugins) — kanal Plugin’leri oluşturma
- [Sağlayıcı Plugin’leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı Plugin’leri oluşturma
