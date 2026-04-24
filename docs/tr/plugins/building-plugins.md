---
read_when:
    - Yeni bir OpenClaw Plugin'i oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı bir başlangıca ihtiyacınız var
    - OpenClaw’a yeni bir kanal, sağlayıcı, araç veya başka bir yetenek ekliyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin'inizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-04-24T09:20:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin'ler OpenClaw’ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görsel
üretimi, video üretimi, web fetch, web arama, aracı araçları veya bunların herhangi bir kombinasyonu.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. [ClawHub](/tr/tools/clawhub) veya npm üzerinde yayımlayın; kullanıcılar `openclaw plugins install <package-name>` ile kurar. OpenClaw önce ClawHub’ı dener ve ardından otomatik olarak npm’e geri düşer.

## Ön koşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) bilgisi
- Depo içi Plugin'ler için: depo klonlanmış ve `pnpm install` yapılmış olmalı

## Ne tür bir Plugin?

<CardGroup cols={3}>
  <Card title="Kanal Plugin'i" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw’ı bir mesajlaşma platformuna bağlayın (Discord, IRC vb.)
  </Card>
  <Card title="Sağlayıcı Plugin'i" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcısı ekleyin (LLM, proxy veya özel uç nokta)
  </Card>
  <Card title="Araç / hook Plugin'i" icon="wrench">
    Aracı araçlarını, olay hook'larını veya hizmetleri kaydedin — aşağıdan devam edin
  </Card>
</CardGroup>

Onboarding/kurulum çalıştığında kurulu olacağı garanti olmayan bir kanal Plugin'i için
`openclaw/plugin-sdk/channel-setup` içinden `createOptionalChannelSetupSurface(...)` kullanın. Bu, kurulum gereksinimini duyuran ve Plugin kurulana kadar gerçek yapılandırma yazımlarında kapalı güvenli başarısız olan bir kurulum bağdaştırıcısı + sihirbaz çifti üretir.

## Hızlı başlangıç: araç Plugin'i

Bu rehber, bir aracı aracı kaydeden asgari bir Plugin oluşturur. Kanal
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
      "description": "OpenClaw’a özel bir araç ekler",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Her Plugin’in yapılandırma olmasa bile bir manifeste ihtiyacı vardır. Tam
    şema için [Manifest](/tr/plugins/manifest) sayfasına bakın. Kanonik ClawHub
    yayımlama parçaları `docs/snippets/plugin-publish/` içinde bulunur.

  </Step>

  <Step title="Giriş noktasını yazın">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "OpenClaw’a özel bir araç ekler",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Bir şey yap",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Alındı: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry`, kanal olmayan Plugin'ler içindir. Kanallar için
    `defineChannelPluginEntry` kullanın — bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).
    Tam giriş noktası seçenekleri için [Giriş Noktaları](/tr/plugins/sdk-entrypoints) sayfasına bakın.

  </Step>

  <Step title="Test edin ve yayımlayın">

    **Harici Plugin'ler:** ClawHub ile doğrulayın ve yayımlayın, sonra kurun:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw ayrıca `@myorg/openclaw-my-plugin` gibi çıplak paket tanımları için
    npm’den önce ClawHub’ı kontrol eder.

    **Depo içi Plugin'ler:** paketlenmiş Plugin çalışma alanı ağacı altına yerleştirin — otomatik olarak keşfedilir.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin yetenekleri

Tek bir Plugin, `api` nesnesi üzerinden istediği kadar yetenek kaydedebilir:

| Yetenek               | Kayıt yöntemi                                   | Ayrıntılı kılavuz                                                                |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Metin çıkarımı (LLM)  | `api.registerProvider(...)`                     | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)                          |
| CLI çıkarım arka ucu  | `api.registerCliBackend(...)`                   | [CLI Arka Uçları](/tr/gateway/cli-backends)                                        |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                      | [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)                               |
| Konuşma (TTS/STT)     | `api.registerSpeechProvider(...)`               | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`        | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`   | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Görsel üretimi        | `api.registerImageGenerationProvider(...)`      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Müzik üretimi         | `api.registerMusicGenerationProvider(...)`      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video üretimi         | `api.registerVideoGenerationProvider(...)`      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch             | `api.registerWebFetchProvider(...)`             | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web arama             | `api.registerWebSearchProvider(...)`            | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gömülü Pi uzantısı    | `api.registerEmbeddedExtensionFactory(...)`     | [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api)                       |
| Aracı araçları        | `api.registerTool(...)`                         | Aşağıda                                                                          |
| Özel komutlar         | `api.registerCommand(...)`                      | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| Olay hook'ları        | `api.registerHook(...)`                         | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| HTTP yolları          | `api.registerHttpRoute(...)`                    | [İç Yapılar](/tr/plugins/architecture-internals#gateway-http-routes)               |
| CLI alt komutları     | `api.registerCli(...)`                          | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |

Tam kayıt API’si için [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api) sayfasına bakın.

Bir Plugin, son araç sonuç mesajı üretilmeden önce eşzamansız `tool_result` yeniden yazımı gibi Pi-yerel gömülü çalıştırıcı hook'larına ihtiyaç duyduğunda `api.registerEmbeddedExtensionFactory(...)` kullanın. İş Pi uzantısı zamanlaması gerektirmiyorsa normal OpenClaw Plugin hook'larını tercih edin.

Plugin'iniz özel Gateway RPC yöntemleri kaydediyorsa bunları
Plugin’e özgü bir önek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmıştır ve bir Plugin daha dar kapsam istese bile
her zaman `operator.admin` çözümüne gider.

Akılda tutulması gereken hook koruma semantiği:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` karar verilmemiş olarak değerlendirilir.
- `before_tool_call`: `{ requireApproval: true }` aracı yürütmesini duraklatır ve exec onay katmanı, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu üzerinden kullanıcıdan onay ister.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` karar verilmemiş olarak değerlendirilir.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` karar verilmemiş olarak değerlendirilir.
- `message_received`: gelen iş parçacığı/konu yönlendirmesine ihtiyaç duyduğunuzda yazılı `threadId` alanını tercih edin. Kanal bazlı ekstralar için `metadata` alanını koruyun.
- `message_sending`: kanal bazlı metadata anahtarları yerine yazılı `replyToId` / `threadId` yönlendirme alanlarını tercih edin.

`/approve` komutu hem exec hem de Plugin onaylarını sınırlı geri dönüşle işler: bir exec onay kimliği bulunamadığında OpenClaw aynı kimliği Plugin onayları üzerinden yeniden dener. Plugin onay yönlendirmesi yapılandırmada `approvals.plugin` aracılığıyla bağımsız olarak yapılandırılabilir.

Özel onay işleme mantığının aynı sınırlı geri dönüş durumunu algılaması gerekiyorsa,
onay süresi dolma dizgelerini elle eşleştirmek yerine `openclaw/plugin-sdk/error-runtime` içinden
`isApprovalNotFoundError` kullanmayı tercih edin.

Ayrıntılar için [SDK Genel Bakış hook karar semantiği](/tr/plugins/sdk-overview#hook-decision-semantics) sayfasına bakın.

## Aracı araçlarını kaydetme

Araçlar, LLM’nin çağırabileceği yazılı fonksiyonlardır. Gerekli (her zaman
mevcut) veya isteğe bağlı (kullanıcı katılımı) olabilirler:

```typescript
register(api) {
  // Gerekli araç — her zaman mevcut
  api.registerTool({
    name: "my_tool",
    description: "Bir şey yap",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // İsteğe bağlı araç — kullanıcı izin listesine eklemelidir
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Bir iş akışı çalıştır",
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
- Kullanıcılar `tools.allow` içine Plugin kimliğini ekleyerek bir Plugin'deki tüm araçları etkinleştirebilir

## İçe aktarma kuralları

Her zaman odaklı `openclaw/plugin-sdk/<subpath>` yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Yanlış: tek parça kök (kullanımdan kalktı, kaldırılacak)
import { ... } from "openclaw/plugin-sdk";
```

Tam alt yol başvurusu için [SDK Genel Bakış](/tr/plugins/sdk-overview) sayfasına bakın.

Plugin’inizin içinde dahili içe aktarmalar için yerel barrel dosyaları (`api.ts`, `runtime-api.ts`) kullanın — asla kendi Plugin'inizi SDK yolu üzerinden içe aktarmayın.

Sağlayıcı Plugin'leri için sağlayıcıya özgü yardımcıları, seam gerçekten genel değilse bu paket kök barrel’larında tutun. Geçerli paketlenmiş örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: sağlayıcı oluşturucular, varsayılan model yardımcıları, gerçek zamanlı sağlayıcılar
- OpenRouter: sağlayıcı oluşturucu artı onboarding/config yardımcıları

Bir yardımcı yalnızca tek bir paketlenmiş sağlayıcı paketi içinde yararlıysa bunu
`openclaw/plugin-sdk/*` içine yükseltmek yerine o paket kökü seam’ında tutun.

Paketlenmiş Plugin bakımı ve uyumluluk için oluşturulmuş bazı `openclaw/plugin-sdk/<bundled-id>` yardımcı seam’ları hâlâ vardır; örneğin `plugin-sdk/feishu-setup` veya `plugin-sdk/zalo-setup`. Bunları yeni üçüncü taraf Plugin'ler için varsayılan desen olarak değil, ayrılmış yüzeyler olarak değerlendirin.

## Gönderim öncesi denetim listesi

<Check>**package.json** dosyası doğru `openclaw` meta verisine sahip</Check>
<Check>**openclaw.plugin.json** manifesti mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklı `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar SDK self-imports değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (depo içi Plugin'ler)</Check>

## Beta sürümü testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` ile abone olun. Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Beta etiketi görünür görünmez Plugin'inizi buna karşı test edin. Kararlı sürümden önceki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalındaki Plugin iş parçacığınıza `all good` veya neyin bozulduğunu yazarak bildirin. Henüz iş parçacığınız yoksa bir tane oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını iş parçacığınıza koyun.
5. `main` dalına `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue’yu hem PR’a hem de Discord iş parçacığınıza bağlayın. Katkıcılar PR’lara etiket veremez; bu nedenle başlık, bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR’li engeller birleştirilir; PR’siz engeller yine de gönderilebilir. Bakımcılar beta testi sırasında bu iş parçacıklarını izler.
6. Sessizlik yeşil anlamına gelir. Pencereyi kaçırırsanız düzeltmeniz büyük olasılıkla bir sonraki döngüye kalır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanal Plugin'i oluşturun
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugin'i oluşturun
  </Card>
  <Card title="SDK Genel Bakış" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API başvurusu
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    `api.runtime` üzerinden TTS, arama, alt aracı
  </Card>
  <Card title="Test" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcıları ve desenleri
  </Card>
  <Card title="Plugin Manifesti" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şema başvurusu
  </Card>
</CardGroup>

## İlgili

- [Plugin Mimarisi](/tr/plugins/architecture) — dahili mimariye derinlemesine bakış
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
- [Manifest](/tr/plugins/manifest) — Plugin manifest biçimi
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal Plugin'leri oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı Plugin'leri oluşturma
