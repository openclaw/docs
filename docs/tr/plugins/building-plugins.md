---
read_when:
    - Yeni bir OpenClaw plugin'i oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıç rehberine ihtiyacınız var
    - OpenClaw'a yeni bir kanal, sağlayıcı, araç veya başka bir yetenek ekliyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw plugin'inizi dakikalar içinde oluşturun
title: Building Plugins
x-i18n:
    generated_at: "2026-04-05T14:01:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26e780d3f04270b79d1d8f8076d6c3c5031915043e78fb8174be921c6bdd60c9
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Building Plugins

Plugins, OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görsel
oluşturma, video oluşturma, web getirme, web arama, agent araçları veya
bunların herhangi bir kombinasyonu.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. Şuraya yayımlayın:
[ClawHub](/tools/clawhub) veya npm, ardından kullanıcılar
`openclaw plugins install <package-name>` ile yükler. OpenClaw önce ClawHub'ı dener
ve ardından otomatik olarak npm'e geri döner.

## Önkoşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) bilgisi
- Depo içi plugin'ler için: depo klonlanmış olmalı ve `pnpm install` çalıştırılmış olmalı

## Ne tür bir plugin?

<CardGroup cols={3}>
  <Card title="Kanal plugin'i" icon="messages-square" href="/plugins/sdk-channel-plugins">
    OpenClaw'ı bir mesajlaşma platformuna bağlayın (Discord, IRC vb.)
  </Card>
  <Card title="Sağlayıcı plugin'i" icon="cpu" href="/plugins/sdk-provider-plugins">
    Bir model sağlayıcısı ekleyin (LLM, proxy veya özel uç nokta)
  </Card>
  <Card title="Araç / hook plugin'i" icon="wrench">
    Agent araçları, olay hook'ları veya hizmetleri kaydedin — aşağıdan devam edin
  </Card>
</CardGroup>

Bir kanal plugin'i isteğe bağlıysa ve onboarding/kurulum çalıştığında yüklü
olmayabilirse, `openclaw/plugin-sdk/channel-setup` içinden
`createOptionalChannelSetupSurface(...)` kullanın. Bu, yükleme gereksinimini
duyuran ve plugin yüklenene kadar gerçek yapılandırma yazımlarında güvenli
şekilde başarısız olan bir kurulum bağdaştırıcısı + sihirbaz çifti üretir.

## Hızlı başlangıç: araç plugin'i

Bu rehber, bir agent aracı kaydeden minimal bir plugin oluşturur. Kanal
ve sağlayıcı plugin'leri için yukarıda bağlantısı verilen özel rehberler vardır.

<Steps>
  <Step title="Paketi ve manifest'i oluşturun">
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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Her plugin'in bir manifest'e ihtiyacı vardır; yapılandırma olmasa bile.
    Tam şema için [Manifest](/plugins/manifest) sayfasına bakın. Kanonik ClawHub
    yayımlama parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.

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

    `definePluginEntry`, kanal olmayan plugin'ler içindir. Kanallar için
    `defineChannelPluginEntry` kullanın — bkz. [Channel Plugins](/plugins/sdk-channel-plugins).
    Tam giriş noktası seçenekleri için bkz. [Entry Points](/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test edin ve yayımlayın">

    **Harici plugin'ler:** ClawHub ile doğrulayın ve yayımlayın, sonra yükleyin:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw, `@myorg/openclaw-my-plugin` gibi yalın paket belirtimleri için
    npm'den önce ClawHub'ı da kontrol eder.

    **Depo içi plugin'ler:** paketlenmiş plugin çalışma alanı ağacının altına yerleştirin — otomatik olarak keşfedilir.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin yetenekleri

Tek bir plugin, `api` nesnesi üzerinden istediği sayıda yetenek kaydedebilir:

| Yetenek               | Kayıt yöntemi                                    | Ayrıntılı rehber                                                                |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Metin çıkarımı (LLM)  | `api.registerProvider(...)`                      | [Provider Plugins](/plugins/sdk-provider-plugins)                               |
| CLI çıkarım arka ucu  | `api.registerCliBackend(...)`                    | [CLI Backends](/tr/gateway/cli-backends)                                           |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                       | [Channel Plugins](/plugins/sdk-channel-plugins)                                 |
| Konuşma (TTS/STT)     | `api.registerSpeechProvider(...)`                | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Görsel oluşturma      | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video oluşturma       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web getirme           | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web arama             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Agent araçları        | `api.registerTool(...)`                          | Aşağıda                                                                         |
| Özel komutlar         | `api.registerCommand(...)`                       | [Entry Points](/plugins/sdk-entrypoints)                                        |
| Olay hook'ları        | `api.registerHook(...)`                          | [Entry Points](/plugins/sdk-entrypoints)                                        |
| HTTP rotaları         | `api.registerHttpRoute(...)`                     | [Internals](/plugins/architecture#gateway-http-routes)                          |
| CLI alt komutları     | `api.registerCli(...)`                           | [Entry Points](/plugins/sdk-entrypoints)                                        |

Tam kayıt API'si için bkz. [SDK Overview](/plugins/sdk-overview#registration-api).

Plugin'iniz özel gateway RPC yöntemleri kaydediyorsa, bunları plugin'e özgü
bir önek altında tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir plugin daha
dar bir kapsam istese bile her zaman `operator.admin` olarak çözülür.

Aklınızda bulundurmanız gereken hook guard semantiği:

- `before_tool_call`: `{ block: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` karar verilmemiş gibi değerlendirilir.
- `before_tool_call`: `{ requireApproval: true }` agent yürütmesini duraklatır ve exec onay katmanı, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu üzerinden kullanıcıdan onay ister.
- `before_install`: `{ block: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` karar verilmemiş gibi değerlendirilir.
- `message_sending`: `{ cancel: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` karar verilmemiş gibi değerlendirilir.

`/approve` komutu hem exec hem de plugin onaylarını sınırlı geri dönüşle işler:
bir exec onay kimliği bulunamadığında OpenClaw aynı kimliği plugin onayları
üzerinden yeniden dener. Plugin onay yönlendirmesi, yapılandırmadaki
`approvals.plugin` üzerinden bağımsız olarak yapılandırılabilir.

Özel onay akışının aynı sınırlı geri dönüş durumunu algılaması gerekiyorsa,
onay süresi dolma dizgelerini elle eşleştirmek yerine
`openclaw/plugin-sdk/error-runtime` içinden `isApprovalNotFoundError`
kullanmayı tercih edin.

Ayrıntılar için bkz. [SDK Overview hook decision semantics](/plugins/sdk-overview#hook-decision-semantics).

## Agent araçlarını kaydetme

Araçlar, LLM'nin çağırabildiği türlendirilmiş işlevlerdir. Zorunlu (her zaman
kullanılabilir) veya isteğe bağlı (kullanıcının açıkça etkinleştirmesi gerekir) olabilirler:

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
- Yan etkileri veya ek ikili gereksinimleri olan araçlar için `optional: true` kullanın
- Kullanıcılar `tools.allow` içine plugin kimliğini ekleyerek bir plugin'deki tüm araçları etkinleştirebilir

## İçe aktarma kuralları

Her zaman odaklı `openclaw/plugin-sdk/<subpath>` yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Tam alt yol başvurusu için bkz. [SDK Overview](/plugins/sdk-overview).

Plugin'inizin içinde, dahili içe aktarmalar için yerel barrel dosyaları
(`api.ts`, `runtime-api.ts`) kullanın — kendi plugin'inizi asla SDK yolu
üzerinden içe aktarmayın.

Sağlayıcı plugin'leri için, sağlayıcıya özgü yardımcıları gerçekten genel bir
ayrım yüzeyi olmadıkça bu paket kökü barrel dosyalarında tutun. Güncel paketlenmiş örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: sağlayıcı oluşturucuları, varsayılan model yardımcıları, gerçek zamanlı sağlayıcılar
- OpenRouter: sağlayıcı oluşturucusu ile onboarding/yapılandırma yardımcıları

Bir yardımcı yalnızca bir paketlenmiş sağlayıcı paketi içinde faydalıysa, onu
`openclaw/plugin-sdk/*` içine taşımak yerine ilgili paket kökü ayrım yüzeyinde tutun.

Bazı oluşturulmuş `openclaw/plugin-sdk/<bundled-id>` yardımcı ayrım yüzeyleri,
örneğin `plugin-sdk/feishu-setup` veya `plugin-sdk/zalo-setup`, paketlenmiş
plugin bakımı ve uyumluluğu için hâlâ vardır. Bunları, yeni üçüncü taraf
plugin'ler için varsayılan desen olarak değil, ayrılmış yüzeyler olarak ele alın.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifest'i mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklı `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar SDK öz-içe aktarmaları değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (depo içi plugin'ler)</Check>

## Beta Sürüm Testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` ile abone olun. Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Etiket görünür görünmez plugin'inizi beta etiketiyle test edin. Kararlı sürüm öncesindeki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalında plugin'inizin başlığında `all good` veya neyin bozulduğunu yazın. Henüz bir başlığınız yoksa oluşturun.
4. Bir şey bozulursa, `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya mevcut olanı güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını başlığınıza ekleyin.
5. `main` için `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue'yu hem PR'da hem de Discord başlığınızda bağlayın. Katkıcılar PR'leri etiketleyemez, bu yüzden başlık, bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'si olan engelleyiciler birleştirilir; olmayanlar yine de yayımlanabilir. Bakımcılar beta testi sırasında bu başlıkları izler.
6. Sessizlik yeşil anlamına gelir. Pencereyi kaçırırsanız, düzeltmeniz büyük olasılıkla bir sonraki döngüye kalır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanal plugin'i oluşturun
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/plugins/sdk-provider-plugins">
    Bir model sağlayıcı plugin'i oluşturun
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API başvurusu
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/plugins/sdk-runtime">
    `api.runtime` üzerinden TTS, arama, alt agent
  </Card>
  <Card title="Testing" icon="test-tubes" href="/plugins/sdk-testing">
    Test yardımcıları ve desenleri
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/plugins/manifest">
    Tam manifest şeması başvurusu
  </Card>
</CardGroup>

## İlgili

- [Plugin Architecture](/plugins/architecture) — dahili mimari derinlemesine incelemesi
- [SDK Overview](/plugins/sdk-overview) — Plugin SDK başvurusu
- [Manifest](/plugins/manifest) — plugin manifest biçimi
- [Channel Plugins](/plugins/sdk-channel-plugins) — kanal plugin'leri oluşturma
- [Provider Plugins](/plugins/sdk-provider-plugins) — sağlayıcı plugin'leri oluşturma
