---
doc-schema-version: 1
read_when:
    - Yeni bir OpenClaw Plugin oluşturmak istiyorsunuz
    - Plugin geliştirme için bir hızlı başlangıca ihtiyacınız var
    - Kanal, sağlayıcı, CLI arka ucu, araç veya hook dokümanları arasında seçim yapıyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin'inizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-06-28T00:50:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin'ler, çekirdeği değiştirmeden OpenClaw'ı genişletir. Bir Plugin mesajlaşma
kanalı, model sağlayıcısı, yerel CLI arka ucu, ajan aracı, hook, medya sağlayıcısı
veya Plugin'in sahip olduğu başka bir yetenek ekleyebilir.

OpenClaw deposuna harici bir Plugin eklemeniz gerekmez. Paketi
[ClawHub](/tr/clawhub) üzerinde yayımlayın; kullanıcılar şu komutla yükler:

```bash
openclaw plugins install clawhub:<package-name>
```

Çıplak paket tanımları, lansman geçişi sırasında hâlâ npm üzerinden yüklenir.
ClawHub çözümlemesi istediğinizde `clawhub:` önekini kullanın.

## Gereksinimler

- Node 22.19 veya daha yeni bir sürüm ve `npm` ya da `pnpm` gibi bir paket yöneticisi kullanın.
- TypeScript ESM modüllerine aşina olun.
- Depo içi paketlenmiş Plugin çalışması için depoyu klonlayın ve `pnpm install` çalıştırın.
  Kaynak checkout üzerinden Plugin geliştirme yalnızca pnpm ile yapılır; çünkü OpenClaw paketlenmiş
  Plugin'leri `extensions/*` çalışma alanı paketlerinden yükler.

## Plugin şeklini seçin

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
    Ajan araçlarını kaydedin.
  </Card>
</CardGroup>

## Hızlı başlangıç

Zorunlu bir ajan aracı kaydederek minimal bir araç Plugin'i oluşturun. Bu,
en kısa kullanışlı Plugin şeklidir ve paketi, manifesti, giriş noktasını ve
yerel kanıtı gösterir.

<Steps>
  <Step title="Paket meta verilerini oluşturun">
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

    Yayımlanan harici Plugin'ler, runtime girişlerini derlenmiş JavaScript
    dosyalarına yönlendirmelidir. Tam giriş noktası sözleşmesi için
    [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.

    Yapılandırması olmasa bile her Plugin'in bir manifesti gerekir. Runtime araçları
    `contracts.tools` içinde görünmelidir; böylece OpenClaw her Plugin runtime'ını
    hevesle yüklemeden sahipliği keşfedebilir. `activation.onStartup` değerini
    bilinçli şekilde ayarlayın. Bu örnek Gateway başlatıldığında başlar.

    Host tarafından güvenilen Plugin yüzeyleri de manifest kapılıdır ve yüklü
    Plugin'ler için açık etkinleştirme gerektirir. Yüklü bir Plugin
    `api.registerAgentToolResultMiddleware(...)` kaydediyorsa, her hedef runtime'ı
    `contracts.agentToolResultMiddleware` içinde bildirin. `api.registerTrustedToolPolicy(...)`
    kaydediyorsa, her politika kimliğini `contracts.trustedToolPolicies` içinde
    bildirin. Bu bildirimler, yükleme zamanı incelemesi ile runtime kaydını hizalı tutar.

    Her manifest alanı için [Plugin manifesti](/tr/plugins/manifest) bölümüne bakın.

  </Step>

  <Step title="Aracı kaydedin">
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

    Kanal dışı Plugin'ler için `definePluginEntry` kullanın. Kanal Plugin'leri
    `defineChannelPluginEntry` kullanır.

  </Step>

  <Step title="Runtime'ı test edin">
    Yüklü veya harici bir Plugin için, yüklenen runtime'ı inceleyin:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin bir CLI komutu kaydediyorsa, o komutu da çalıştırın. Örneğin,
    demo komutunun `openclaw demo-plugin ping` gibi bir yürütme kanıtı olmalıdır.

    Bu depodaki paketlenmiş bir Plugin için OpenClaw, kaynak checkout
    Plugin paketlerini `extensions/*` çalışma alanından keşfeder. En yakın hedefli
    testi çalıştırın:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Yayımlayın">
    Yayımlamadan önce paketi doğrulayın:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Kanonik ClawHub snippet'leri `docs/snippets/plugin-publish/` içinde bulunur.

  </Step>

  <Step title="Yükleyin">
    Yayımlanan paketi ClawHub üzerinden yükleyin:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Araçları kaydetme

Araçlar zorunlu veya isteğe bağlı olabilir. Zorunlu araçlar, Plugin etkin olduğunda
her zaman kullanılabilir. İsteğe bağlı araçlar kullanıcı onayı gerektirir.

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

`api.registerTool(...)` ile kaydedilen her araç, Plugin manifestinde de
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

İsteğe bağlı araçlar, bir aracın modele sunulup sunulmayacağını denetler. Bir araç
veya hook, model onu seçtikten sonra ve eylem çalışmadan önce onay istemeliyse
[Plugin izin istekleri](/tr/plugins/plugin-permission-requests) kullanın.

Varsayılan olarak sunulmaması gereken yan etkiler, alışılmadık binary'ler veya
yetenekler için isteğe bağlı araçları kullanın. Araç adları çekirdek araçlarla
çakışmamalıdır; çakışmalar atlanır ve Plugin tanılamalarında raporlanır.
`parameters` içermeyen araç tanımlayıcıları dahil hatalı kayıtlar da atlanır ve
aynı şekilde raporlanır. Kayıtlı araçlar, politika ve izin listesi kontrolleri
geçtikten sonra modelin çağırabileceği tipli fonksiyonlardır.

Araç fabrikaları runtime tarafından sağlanan bir bağlam nesnesi alır. Bir aracın
geçerli turdaki etkin modeli günlüğe kaydetmesi, göstermesi veya ona uyum sağlaması
gerektiğinde `ctx.activeModel` kullanın. Nesne `provider`, `modelId` ve `modelRef`
içerebilir. Bunu yerel operatöre, yüklü Plugin koduna veya değiştirilmiş bir
OpenClaw runtime'ına karşı güvenlik sınırı olarak değil, bilgilendirici runtime
meta verisi olarak değerlendirin. Hassas yerel araçlar yine de açık bir Plugin
veya operatör onayı gerektirmeli ve etkin model meta verisi eksik ya da uygun
değilse kapalı şekilde başarısız olmalıdır.

Manifest sahipliği ve keşfi bildirir; yürütme hâlâ canlı kayıtlı araç
uygulamasını çağırır. OpenClaw'ın araç açıkça izin listesine alınana kadar o
Plugin runtime'ını yüklemekten kaçınabilmesi için `toolMetadata.<tool>.optional: true`
ile `api.registerTool(..., { optional: true })` hizalı kalsın.

## İçe aktarma kuralları

Odaklanmış SDK alt yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Kullanımdan kaldırılmış kök barrel'dan içe aktarmayın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin paketiniz içinde, dahili içe aktarmalar için `api.ts` ve `runtime-api.ts`
gibi yerel barrel dosyaları kullanın. Kendi Plugin'inizi bir SDK yolu üzerinden
içe aktarmayın. Sağlayıcıya özgü yardımcılar, seam gerçekten genel değilse
sağlayıcı paketinde kalmalıdır.

Özel Gateway RPC yöntemleri gelişmiş bir giriş noktasıdır. Bunları Plugin'e özgü
bir önek üzerinde tutun; `config.*`, `exec.approvals.*`, `operator.admin.*`,
`wizard.*` ve `update.*` gibi çekirdek yönetici ad alanları ayrılmış kalır ve
`operator.admin` olarak çözümlenir. `openclaw/plugin-sdk/gateway-method-runtime`
köprüsü, `contracts.gatewayMethodDispatch: ["authenticated-request"]` bildiren
Plugin HTTP rotaları için ayrılmıştır.

Tam içe aktarma haritası için [Plugin SDK genel bakışı](/tr/plugins/sdk-overview) bölümüne bakın.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifesti mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklanmış `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar SDK self-import'ları değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (depo içi Plugin'ler)</Check>

## Beta sürümlere karşı test edin

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub release etiketlerini izleyin ve `Watch` > `Releases` üzerinden abone olun. Beta etiketleri `v2026.3.N-beta.1` biçimindedir. Release duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Plugin'inizi beta etiketi görünür görünmez ona karşı test edin. Stable öncesindeki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalında Plugin'inizin thread'ine `all good` ya da bozulan şeyi yazın. Henüz bir thread'iniz yoksa bir tane oluşturun.
4. Bir şey bozulursa, `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını thread'inize koyun.
5. `main` için `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue'yu hem PR'da hem de Discord thread'inizde bağlayın. Katkıda bulunanlar PR'ları etiketleyemez, bu yüzden başlık bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'ı olan blocker'lar merge edilir; olmayanlar yine de yayımlanabilir. Bakımcılar beta testi sırasında bu thread'leri izler.
6. Sessizlik yeşil anlamına gelir. Pencereyi kaçırırsanız, düzeltmeniz büyük olasılıkla sonraki döngüye kalır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugin'i oluşturun
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugin'i oluşturun
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    Yerel bir AI CLI arka ucu kaydedin
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API referansı
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, arama, alt ajan
  </Card>
  <Card title="Testing" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcıları ve kalıpları
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şeması referansı
  </Card>
</CardGroup>

## İlgili

- [Plugin hook'ları](/tr/plugins/hooks)
- [Plugin mimarisi](/tr/plugins/architecture)
