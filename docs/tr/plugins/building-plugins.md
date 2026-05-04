---
read_when:
    - Yeni bir OpenClaw Plugin oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıç kılavuzuna ihtiyacınız var
    - OpenClaw'a yeni bir kanal, sağlayıcı, araç veya başka bir yetenek ekliyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin'inizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-05-04T07:06:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin'ler OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü
oluşturma, video oluşturma, web getirme, web arama, ajan araçları veya bunların
herhangi bir kombinasyonu.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. [ClawHub](/tr/tools/clawhub)
üzerinde yayımlayın; kullanıcılar
`openclaw plugins install clawhub:<package-name>` ile yükler. Çıplak paket
belirtimleri, lansman geçişi sırasında hâlâ npm üzerinden yüklenir.

## Önkoşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) hakkında bilgi
- Depo içi plugin'ler için: deponun klonlanmış ve `pnpm install` çalıştırılmış
  olması. Kaynak checkout plugin geliştirme yalnızca pnpm ile yapılır çünkü
  OpenClaw paketlenmiş plugin'leri `extensions/*` workspace paketlerinden
  yükler.

## Ne tür bir plugin?

<CardGroup cols={3}>
  <Card title="Kanal plugin'i" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'ı bir mesajlaşma platformuna bağlayın (Discord, IRC vb.)
  </Card>
  <Card title="Sağlayıcı plugin'i" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı ekleyin (LLM, proxy veya özel endpoint)
  </Card>
  <Card title="Araç / hook plugin'i" icon="wrench" href="/tr/plugins/hooks">
    Ajan araçları, olay hook'ları veya servisler kaydedin — aşağıdan devam edin
  </Card>
</CardGroup>

Onboarding/kurulum çalışırken yüklü olacağı garanti edilmeyen bir kanal plugin'i
için `openclaw/plugin-sdk/channel-setup` içindeki
`createOptionalChannelSetupSurface(...)` kullanın. Bu, yükleme gereksinimini
duyuran ve plugin yüklenene kadar gerçek config yazımlarında kapalı başarısız
olan bir kurulum adapter'ı + sihirbaz çifti üretir.

## Hızlı başlangıç: araç plugin'i

Bu kılavuz, bir ajan aracı kaydeden minimal bir plugin oluşturur. Kanal ve
sağlayıcı plugin'lerinin yukarıda bağlantısı verilen ayrı kılavuzları vardır.

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

    Config olmasa bile her plugin'in bir manifeste ihtiyacı vardır. Runtime'da
    kaydedilen araçlar `contracts.tools` içinde listelenmelidir; böylece OpenClaw
    her plugin runtime'ını yüklemeden sahibi olan plugin'i keşfedebilir.
    Plugin'ler ayrıca `activation.onStartup` değerini bilinçli biçimde
    bildirmelidir. Bu örnek bunu `true` olarak ayarlar. Tam şema için
    [Manifest](/tr/plugins/manifest) bölümüne bakın. Kanonik ClawHub yayımlama
    snippet'leri `docs/snippets/plugin-publish/` içinde bulunur.

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

    `definePluginEntry` kanal dışı plugin'ler içindir. Kanallar için
    `defineChannelPluginEntry` kullanın — bkz.
    [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins). Tüm giriş noktası
    seçenekleri için [Giriş Noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.

  </Step>

  <Step title="Test edin ve yayımlayın">

    **Harici plugin'ler:** ClawHub ile doğrulayın ve yayımlayın, ardından yükleyin:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin` gibi çıplak paket belirtimleri, lansman geçişi
    sırasında npm üzerinden yüklenir. ClawHub çözümlemesi istediğinizde
    `clawhub:` kullanın.

    **Depo içi plugin'ler:** paketlenmiş plugin workspace ağacının altına yerleştirin — otomatik olarak keşfedilir.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin yetenekleri

Tek bir plugin, `api` nesnesi üzerinden herhangi sayıda yetenek kaydedebilir:

| Yetenek                | Kayıt yöntemi                                   | Ayrıntılı kılavuz                                                              |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Metin çıkarımı (LLM)   | `api.registerProvider(...)`                      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)                         |
| CLI çıkarım backend'i  | `api.registerCliBackend(...)`                    | [CLI Backend'leri](/tr/gateway/cli-backends)                                      |
| Kanal / mesajlaşma     | `api.registerChannel(...)`                       | [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)                              |
| Konuşma (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses     | `api.registerRealtimeVoiceProvider(...)`         | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medya anlama           | `api.registerMediaUnderstandingProvider(...)`    | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Görüntü oluşturma      | `api.registerImageGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Müzik oluşturma        | `api.registerMusicGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video oluşturma        | `api.registerVideoGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web getirme            | `api.registerWebFetchProvider(...)`              | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web arama              | `api.registerWebSearchProvider(...)`             | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Araç sonucu middleware'i | `api.registerAgentToolResultMiddleware(...)`   | [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api)                      |
| Ajan araçları          | `api.registerTool(...)`                          | Aşağıda                                                                         |
| Özel komutlar          | `api.registerCommand(...)`                       | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                    |
| Plugin hook'ları       | `api.on(...)`                                    | [Plugin hook'ları](/tr/plugins/hooks)                                             |
| Dahili olay hook'ları  | `api.registerHook(...)`                          | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                    |
| HTTP rotaları          | `api.registerHttpRoute(...)`                     | [İç Yapı](/tr/plugins/architecture-internals#gateway-http-routes)                 |
| CLI alt komutları      | `api.registerCli(...)`                           | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                    |

Tam kayıt API'si için [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api)
bölümüne bakın.

Paketlenmiş plugin'ler, model çıktıyı görmeden önce async araç sonucu yeniden
yazımı gerektiğinde `api.registerAgentToolResultMiddleware(...)` kullanabilir.
Hedeflenen runtime'ları `contracts.agentToolResultMiddleware` içinde bildirin,
örneğin `["pi", "codex"]`. Bu güvenilen bir paketlenmiş-plugin arayüzüdür; harici
plugin'ler, OpenClaw bu yetenek için açık bir güven politikası geliştirene kadar
normal OpenClaw plugin hook'larını tercih etmelidir.

Plugin'iniz özel gateway RPC yöntemleri kaydediyorsa, bunları plugin'e özgü bir
prefix altında tutun. Çekirdek admin namespace'leri (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir plugin daha dar
bir scope istese bile her zaman `operator.admin` değerine çözümlenir.

Akılda tutulacak hook koruyucu semantikleri:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli handler'ları durdurur.
- `before_tool_call`: `{ block: false }` karar yok olarak değerlendirilir.
- `before_tool_call`: `{ requireApproval: true }` ajan yürütmesini duraklatır ve exec onay katmanı, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu üzerinden kullanıcıdan onay ister.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli handler'ları durdurur.
- `before_install`: `{ block: false }` karar yok olarak değerlendirilir.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli handler'ları durdurur.
- `message_sending`: `{ cancel: false }` karar yok olarak değerlendirilir.
- `message_received`: gelen thread/konu yönlendirmesine ihtiyacınız olduğunda typed `threadId` alanını tercih edin. `metadata` alanını kanala özgü ekstralar için tutun.
- `message_sending`: kanala özgü metadata anahtarları yerine typed `replyToId` / `threadId` yönlendirme alanlarını tercih edin.

`/approve` komutu hem exec hem de plugin onaylarını sınırlı fallback ile işler:
bir exec onay id'si bulunamadığında, OpenClaw aynı id'yi plugin onayları
üzerinden yeniden dener. Plugin onayı yönlendirmesi config içinde
`approvals.plugin` ile bağımsız olarak yapılandırılabilir.

Özel onay tesisatının aynı sınırlı fallback durumunu algılaması gerekiyorsa,
onay süresi dolma dizelerini elle eşleştirmek yerine
`openclaw/plugin-sdk/error-runtime` içindeki `isApprovalNotFoundError` kullanın.

Örnekler ve hook referansı için [Plugin hook'ları](/tr/plugins/hooks) bölümüne bakın.

## Ajan araçlarını kaydetme

Araçlar, LLM'nin çağırabileceği typed fonksiyonlardır. Zorunlu (her zaman
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

`api.registerTool(...)` ile kaydedilen her araç, plugin manifestinde de
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
böylece plugin'ler manifest içinde `description` veya şema verilerini yinelemez. 
Manifest sözleşmesi yalnızca sahipliği ve keşfi bildirir; yürütme hâlâ
canlı kayıtlı araç uygulamasını çağırır.
OpenClaw'ın araç açıkça izin verilenler listesine alınana kadar o
plugin çalışma zamanını yüklemekten kaçınabilmesi için
`api.registerTool(..., { optional: true })` ile kaydedilen araçlarda
`toolMetadata.<tool>.optional: true` ayarını yapın.

Kullanıcılar isteğe bağlı araçları yapılandırmada etkinleştirir:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Araç adları çekirdek araçlarla çakışmamalıdır (çakışmalar atlanır)
- Eksik `parameters` dahil hatalı biçimlendirilmiş kayıt nesnelerine sahip araçlar atlanır ve ajan çalıştırmalarını bozmak yerine plugin tanılamalarında raporlanır
- Yan etkileri veya ek ikili gereksinimleri olan araçlar için `optional: true` kullanın
- Kullanıcılar, plugin kimliğini `tools.allow` öğesine ekleyerek bir plugin'deki tüm araçları etkinleştirebilir

## CLI komutlarını kaydetme

Plugin'ler `api.registerCli` ile kök `openclaw` komut grupları ekleyebilir. OpenClaw'ın her plugin çalışma zamanını hevesle yüklemeden komutu gösterebilmesi ve yönlendirebilmesi için her üst düzey komut kökü için
`descriptors` sağlayın.

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

Her zaman odaklı `openclaw/plugin-sdk/<subpath>` yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Tam alt yol referansı için [SDK Genel Bakışı](/tr/plugins/sdk-overview) bölümüne bakın.

Plugin'inizin içinde, içe aktarmalar için yerel barrel dosyalarını (`api.ts`, `runtime-api.ts`) kullanın; kendi plugin'inizi asla SDK yolu üzerinden içe aktarmayın.

Sağlayıcı plugin'leri için, sağlayıcıya özgü yardımcıları, dikiş gerçekten genel olmadıkça bu paket kökü
barrel'larında tutun. Geçerli paketlenmiş örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: sağlayıcı oluşturucular, varsayılan model yardımcıları, gerçek zamanlı sağlayıcılar
- OpenRouter: sağlayıcı oluşturucu ile onboarding/yapılandırma yardımcıları

Bir yardımcı yalnızca tek bir paketlenmiş sağlayıcı paketi içinde yararlıysa, onu
`openclaw/plugin-sdk/*` içine yükseltmek yerine o paket kökü dikişinde tutun.

Paketlenmiş plugin bakımı için, takip edilen sahip kullanımına sahip olduklarında oluşturulmuş bazı `openclaw/plugin-sdk/<bundled-id>` yardımcı dikişleri hâlâ vardır. Bunları yeni üçüncü taraf plugin'ler için varsayılan kalıp olarak değil, ayrılmış yüzeyler olarak değerlendirin.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifest'i mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklı `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>İç içe aktarmalar SDK öz içe aktarmalarını değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (depo içi plugin'ler)</Check>

## Beta sürüm testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` yoluyla abone olun. Beta etiketleri `v2026.3.N-beta.1` biçimindedir. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Plugin'inizi beta etiketi görünür görünmez ona karşı test edin. Kararlı sürümden önceki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalındaki plugin iş parçacığınızda `all good` veya neyin bozulduğunu paylaşın. Henüz bir iş parçacığınız yoksa oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını iş parçacığınıza koyun.
5. `main` için `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue'yu hem PR'da hem de Discord iş parçacığınızda bağlayın. Katkıda bulunanlar PR'ları etiketleyemez, bu nedenle başlık bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'ı olan engelleyiciler birleştirilir; PR'ı olmayan engelleyiciler yine de yayımlanabilir. Bakımcılar beta testi sırasında bu iş parçacıklarını izler.
6. Sessizlik yeşil demektir. Pencereyi kaçırırsanız, düzeltmeniz büyük olasılıkla sonraki döngüye kalır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı plugin'i oluşturun
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı plugin'i oluşturun
  </Card>
  <Card title="SDK Genel Bakışı" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API referansı
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, arama, alt ajan
  </Card>
  <Card title="Test Etme" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcı programları ve kalıpları
  </Card>
  <Card title="Plugin Manifest'i" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şeması referansı
  </Card>
</CardGroup>

## İlgili

- [Plugin Mimarisi](/tr/plugins/architecture) — iç mimariye derinlemesine bakış
- [SDK Genel Bakışı](/tr/plugins/sdk-overview) — Plugin SDK referansı
- [Manifest](/tr/plugins/manifest) — plugin manifest biçimi
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal plugin'leri oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı plugin'leri oluşturma
