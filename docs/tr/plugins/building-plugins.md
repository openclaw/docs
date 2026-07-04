---
doc-schema-version: 1
read_when:
    - Yeni bir OpenClaw Plugin oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıç kılavuzuna ihtiyacınız var
    - Kanal, sağlayıcı, CLI arka ucu, araç veya hook belgeleri arasında seçim yapıyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin’inizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-07-04T10:57:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginler, çekirdeği değiştirmeden OpenClaw'ı genişletir. Bir plugin; mesajlaşma
kanalı, model sağlayıcısı, yerel CLI arka ucu, aracı aracı, hook, medya sağlayıcısı
veya plugin'e ait başka bir yetenek ekleyebilir.

OpenClaw deposuna harici bir plugin eklemeniz gerekmez. Paketi
[ClawHub](/clawhub) üzerinde yayımlayın; kullanıcılar şu komutla kurar:

```bash
openclaw plugins install clawhub:<package-name>
```

Çıplak paket belirtimleri, lansman geçişi sırasında hâlâ npm üzerinden kurulur.
ClawHub çözümlemesi istediğinizde `clawhub:` önekini kullanın.

## Gereksinimler

- Node 22.19+, Node 23.11+ veya Node 24+ ve `npm` ya da `pnpm` gibi bir paket yöneticisi kullanın.
- TypeScript ESM modüllerine aşina olun.
- Depo içi paketlenmiş plugin çalışması için depoyu klonlayın ve `pnpm install` çalıştırın.
  Kaynak checkout plugin geliştirmesi yalnızca pnpm ile yapılır, çünkü OpenClaw paketlenmiş
  pluginleri `extensions/*` çalışma alanı paketlerinden yükler.

## Plugin biçimini seçin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'ı bir mesajlaşma platformuna bağlayın.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model, medya, arama, getirme, konuşma veya gerçek zamanlı sağlayıcı ekleyin.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    OpenClaw model fallback üzerinden yerel bir AI CLI çalıştırın.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/tr/plugins/tool-plugins">
    Aracı araçlarını kaydedin.
  </Card>
</CardGroup>

## Hızlı başlangıç

Gerekli tek bir aracı aracı kaydederek minimal bir araç plugini oluşturun. Bu,
en kısa kullanışlı plugin biçimidir ve paketi, manifesti, giriş noktasını ve
yerel kanıtı gösterir.

<Steps>
  <Step title="Create package metadata">
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

    Yayımlanmış harici pluginler, çalışma zamanı girişlerini derlenmiş JavaScript
    dosyalarına yönlendirmelidir. Tam giriş noktası sözleşmesi için
    [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.

    Her pluginin, yapılandırması olmasa bile bir manifeste ihtiyacı vardır.
    Çalışma zamanı araçları `contracts.tools` içinde görünmelidir; böylece OpenClaw,
    her plugin çalışma zamanını hevesle yüklemeden sahipliği keşfedebilir.
    `activation.onStartup` değerini bilinçli ayarlayın. Bu örnek Gateway
    başlangıcında başlar.

    Ana makine tarafından güvenilen plugin yüzeyleri de manifest kapılıdır ve
    kurulu pluginler için açıkça etkinleştirme gerektirir. Kurulu bir plugin
    `api.registerAgentToolResultMiddleware(...)` kaydediyorsa, her hedef çalışma zamanını
    `contracts.agentToolResultMiddleware` içinde bildirin. `api.registerTrustedToolPolicy(...)`
    kaydediyorsa, her ilke kimliğini `contracts.trustedToolPolicies` içinde bildirin.
    Bu bildirimler kurulum zamanı incelemesi ile çalışma zamanı kaydını hizalı tutar.

    Her manifest alanı için [Plugin manifesti](/tr/plugins/manifest) bölümüne bakın.

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Kanal dışı pluginler için `definePluginEntry` kullanın. Kanal pluginleri
    `defineChannelPluginEntry` kullanır.

  </Step>

  <Step title="Test the runtime">
    Kurulu veya harici bir plugin için yüklenen çalışma zamanını inceleyin:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin bir CLI komutu kaydediyorsa, o komutu da çalıştırın. Örneğin,
    bir demo komutun `openclaw demo-plugin ping` gibi bir yürütme kanıtı olmalıdır.

    Bu depodaki paketlenmiş bir plugin için OpenClaw, kaynak checkout
    plugin paketlerini `extensions/*` çalışma alanından keşfeder. En yakın hedefli
    testi çalıştırın:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    Yayımlamadan önce paketi doğrulayın:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Kanonik ClawHub snippet'leri `docs/snippets/plugin-publish/` içinde bulunur.

  </Step>

  <Step title="Install">
    Yayımlanmış paketi ClawHub üzerinden kurun:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Araçları kaydetme

Araçlar gerekli veya isteğe bağlı olabilir. Gerekli araçlar, plugin
etkinleştirildiğinde her zaman kullanılabilir. İsteğe bağlı araçlar kullanıcı
onayı gerektirir.

```typescript
register(api) {
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
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Kullanıcılar `tools.allow` ile onay verir:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

İsteğe bağlı araçlar, bir aracın modele gösterilip gösterilmeyeceğini kontrol eder.
Bir araç veya hook, model onu seçtikten sonra ve eylem çalışmadan önce onay
istemeliyse [plugin izin istekleri](/tr/plugins/plugin-permission-requests) kullanın.

İsteğe bağlı araçları yan etkiler, alışılmadık ikili dosyalar veya varsayılan
olarak gösterilmemesi gereken yetenekler için kullanın. Araç adları çekirdek
araçlarla çakışmamalıdır; çakışmalar atlanır ve plugin tanılamalarında raporlanır.
`parameters` içermeyen araç tanımlayıcıları dahil hatalı kayıtlar atlanır ve aynı
şekilde raporlanır. Kayıtlı araçlar, ilke ve izin listesi kontrolleri geçtikten
sonra modelin çağırabileceği tipli işlevlerdir.

Araç fabrikaları, çalışma zamanı tarafından sağlanan bir bağlam nesnesi alır.
Bir aracın mevcut turdaki etkin modeli günlüğe kaydetmesi, göstermesi veya ona
uyum sağlaması gerektiğinde `ctx.activeModel` kullanın. Nesne `provider`,
`modelId` ve `modelRef` içerebilir. Bunu yerel operatöre, kurulu plugin koduna
veya değiştirilmiş bir OpenClaw çalışma zamanına karşı güvenlik sınırı olarak
değil, bilgilendirici çalışma zamanı meta verisi olarak ele alın. Hassas yerel
araçlar yine de açık bir plugin veya operatör onayı gerektirmeli ve etkin model
meta verileri eksik ya da uygunsuz olduğunda kapalı hata vermelidir.

Manifest sahipliği ve keşfi bildirir; yürütme yine canlı kayıtlı araç
uygulamasını çağırır. `toolMetadata.<tool>.optional: true` değerini
`api.registerTool(..., { optional: true })` ile hizalı tutun; böylece OpenClaw,
araç açıkça izin listesine alınana kadar o plugin çalışma zamanını yüklemekten
kaçınabilir.

## İçe aktarma kuralları

Odaklı SDK alt yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Kullanımdan kaldırılmış kök barrel'dan içe aktarmayın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin paketiniz içinde, dahili içe aktarmalar için `api.ts` ve `runtime-api.ts`
gibi yerel barrel dosyaları kullanın. Kendi plugininizi bir SDK yolu üzerinden
içe aktarmayın. Sağlayıcıya özgü yardımcılar, sınır gerçekten genel olmadığı
sürece sağlayıcı paketinde kalmalıdır.

Özel Gateway RPC yöntemleri ileri düzey bir giriş noktasıdır. Bunları plugine
özgü bir önekte tutun; `config.*`, `exec.approvals.*`, `operator.admin.*`,
`wizard.*` ve `update.*` gibi çekirdek yönetim ad alanları ayrılmış kalır ve
`operator.admin` olarak çözülür. `openclaw/plugin-sdk/gateway-method-runtime`
köprüsü, `contracts.gatewayMethodDispatch: ["authenticated-request"]` bildiren
plugin HTTP rotaları için ayrılmıştır.

Tam içe aktarma haritası için [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
bölümüne bakın.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifesti mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklı `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar SDK self-import'leri değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (depo içi pluginler)</Check>

## Beta sürümlere karşı test edin

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` üzerinden abone olun. Beta etiketleri `v2026.3.N-beta.1` biçimindedir. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Plugininizi beta etiketi görünür görünmez ona karşı test edin. Kararlı sürümden önceki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalındaki plugin başlığınıza `all good` veya neyin bozulduğunu yazın. Henüz bir başlığınız yoksa oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını başlığınıza koyun.
5. `main` dalına `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue'yu hem PR'da hem de Discord başlığınızda bağlayın. Katkıda bulunanlar PR'ları etiketleyemez, bu yüzden başlık; bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'ı olan engelleyiciler birleştirilir; PR'ı olmayan engelleyiciler yine de yayımlanabilir. Bakımcılar beta testi sırasında bu başlıkları izler.
6. Sessizlik yeşil demektir. Pencereyi kaçırırsanız düzeltmeniz büyük olasılıkla sonraki döngüye girer.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı plugini oluşturun
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı plugini oluşturun
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    Yerel bir AI CLI arka ucu kaydedin
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API başvurusu
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, arama, alt aracı
  </Card>
  <Card title="Testing" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcıları ve desenleri
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şema başvurusu
  </Card>
</CardGroup>

## İlgili

- [Plugin hook'ları](/tr/plugins/hooks)
- [Plugin mimarisi](/tr/plugins/architecture)
