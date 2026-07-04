---
doc-schema-version: 1
read_when:
    - Yeni bir OpenClaw Plugin'i oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıca ihtiyacınız var
    - Kanal, sağlayıcı, CLI arka ucu, araç veya hook belgeleri arasında seçim yapıyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin’inizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-07-04T15:31:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin'ler, çekirdeği değiştirmeden OpenClaw'ı genişletir. Bir Plugin bir mesajlaşma
kanalı, model sağlayıcısı, yerel CLI arka ucu, agent aracı, hook, medya sağlayıcısı
veya Plugin'e ait başka bir yetenek ekleyebilir.

OpenClaw deposuna harici bir Plugin eklemeniz gerekmez. Paketi
[ClawHub](/tr/clawhub) üzerinde yayımlayın; kullanıcılar şu komutla kurar:

```bash
openclaw plugins install clawhub:<package-name>
```

Çıplak paket belirtimleri, lansman geçişi sırasında hâlâ npm üzerinden kurulur.
ClawHub çözümlemesi istediğinizde `clawhub:` önekini kullanın.

## Gereksinimler

- Node 22.19+, Node 23.11+ veya Node 24+ ve `npm` ya da `pnpm` gibi bir paket yöneticisi kullanın.
- TypeScript ESM modüllerine aşina olun.
- Depo içi paketlenmiş Plugin çalışması için depoyu klonlayın ve `pnpm install` çalıştırın.
  Kaynak checkout Plugin geliştirmesi yalnızca pnpm kullanır, çünkü OpenClaw paketlenmiş
  Plugin'leri `extensions/*` workspace paketlerinden yükler.

## Plugin biçimini seçin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'ı bir mesajlaşma platformuna bağlayın.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model, medya, arama, getirme, konuşma veya gerçek zamanlı sağlayıcı ekleyin.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    OpenClaw model fallback'i üzerinden yerel bir AI CLI çalıştırın.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/tr/plugins/tool-plugins">
    Agent araçlarını kaydedin.
  </Card>
</CardGroup>

## Hızlı başlangıç

Gerekli tek bir agent aracı kaydederek en küçük araç Plugin'ini oluşturun. Bu,
en kısa kullanışlı Plugin biçimidir ve paketi, manifesti, giriş noktasını ve
yerel kanıtı gösterir.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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

    Yayımlanmış harici Plugin'ler, runtime girişlerini derlenmiş JavaScript
    dosyalarına yönlendirmelidir. Tam giriş noktası sözleşmesi için
    [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.

    Yapılandırması olmasa bile her Plugin'in bir manifeste ihtiyacı vardır. Runtime
    araçları `contracts.tools` içinde görünmelidir; böylece OpenClaw, her Plugin
    runtime'ını hevesle yüklemeden sahipliği keşfedebilir. `activation.onStartup`
    değerini bilinçli ayarlayın. Bu örnek Gateway başlangıcında başlar.

    Host tarafından güvenilen Plugin yüzeyleri de manifest kapılıdır ve kurulu
    Plugin'ler için açık etkinleştirme gerektirir. Kurulu bir Plugin
    `api.registerAgentToolResultMiddleware(...)` kaydediyorsa, her hedef runtime'ı
    `contracts.agentToolResultMiddleware` içinde bildirin. `api.registerTrustedToolPolicy(...)`
    kaydediyorsa, her policy kimliğini `contracts.trustedToolPolicies` içinde
    bildirin. Bu bildirimler, kurulum zamanı incelemesini runtime kaydıyla hizalı tutar.

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

    Kanal dışı Plugin'ler için `definePluginEntry` kullanın. Kanal Plugin'leri
    `defineChannelPluginEntry` kullanır.

  </Step>

  <Step title="Test the runtime">
    Kurulu veya harici bir Plugin için yüklenen runtime'ı inceleyin:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin bir CLI komutu kaydediyorsa, o komutu da çalıştırın. Örneğin,
    bir demo komutunun `openclaw demo-plugin ping` gibi bir yürütme kanıtı
    olmalıdır.

    Bu depodaki paketlenmiş bir Plugin için OpenClaw, kaynak checkout
    Plugin paketlerini `extensions/*` workspace'inden keşfeder. En yakın hedefli
    testi çalıştırın:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    Paketlemeye hazır bir Plugin yayımlamadan önce, kullanıcıların alacağı aynı
    kurulum biçimini test edin. Önce bir derleme adımı ekleyin, `openclaw.extensions`
    gibi runtime girişlerini `./dist/index.js` benzeri derlenmiş JavaScript'e
    yönlendirin ve `npm pack` çıktısının bu `dist/` çıktısını içerdiğinden emin olun.
    TypeScript kaynak girişleri yalnızca kaynak checkout'ları ve yerel geliştirme
    yolları içindir.

    Ardından Plugin'i paketleyin ve tarball'ı `npm-pack:` ile kurun:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:`, OpenClaw'ın yönetilen Plugin başına npm projesini kullanır; bu nedenle
    kaynak checkout testinin gizleyebileceği runtime bağımlılığı hatalarını yakalar.
    Katalog bağlantılı resmi güveni değil, paket ve bağımlılık biçimini kanıtlar.
    Runtime import'ları `dependencies` veya `optionalDependencies` içinde olmalıdır;
    yalnızca `devDependencies` içinde bırakılan bağımlılıklar yönetilen runtime
    projesi için kurulmaz.

    Resmi veya ayrıcalıklı Plugin davranışı için son kanıt olarak ham arşiv/yol
    kurulumu kullanmayın. Ham kaynaklar yerel hata ayıklama için yararlıdır, ancak
    npm veya ClawHub kurulumlarıyla aynı bağımlılık yolunu kanıtlamaz. Plugin'iniz
    güvenilir resmi Plugin durumuna dayanıyorsa, katalog destekli resmi kurulum
    veya resmi güveni kaydeden yayımlanmış paket yolu üzerinden ikinci bir kanıt
    ekleyin. Kurulum kökü ve bağımlılık sahipliği ayrıntıları için
    [Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution) bölümüne bakın.

  </Step>

  <Step title="Publish">
    Yayımlamadan önce paketi doğrulayın:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Kanonik ClawHub snippet'leri `docs/snippets/plugin-publish/` içinde yer alır.

  </Step>

  <Step title="Install">
    Yayımlanan paketi ClawHub üzerinden kurun:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Araçları kaydetme

Araçlar gerekli veya isteğe bağlı olabilir. Gerekli araçlar, Plugin
etkinken her zaman kullanılabilir. İsteğe bağlı araçlar kullanıcı opt-in'i gerektirir.

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

Kullanıcılar `tools.allow` ile opt-in yapar:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

İsteğe bağlı araçlar, bir aracın modele sunulup sunulmayacağını denetler. Bir araç
veya hook, model onu seçtikten sonra ve eylem çalışmadan önce onay istemeliyse
[Plugin izin istekleri](/tr/plugins/plugin-permission-requests) kullanın.

Varsayılan olarak sunulmaması gereken yan etkiler, alışılmadık ikili dosyalar veya
yetenekler için isteğe bağlı araçları kullanın. Araç adları çekirdek araçlarla
çakışmamalıdır; çakışmalar atlanır ve Plugin tanılamalarında raporlanır. `parameters`
içermeyen araç tanımlayıcıları dahil hatalı biçimlendirilmiş kayıtlar da aynı şekilde
atlanır ve raporlanır. Kayıtlı araçlar, policy ve izin listesi kontrolleri geçtikten
sonra modelin çağırabileceği tipli fonksiyonlardır.

Araç factory'leri runtime tarafından sağlanan bir context nesnesi alır. Bir aracın
geçerli turdaki etkin modeli günlüğe yazması, göstermesi veya ona uyum sağlaması
gerektiğinde `ctx.activeModel` kullanın. Nesne `provider`, `modelId` ve `modelRef`
içerebilir. Bunu yerel operatöre, kurulu Plugin koduna veya değiştirilmiş OpenClaw
runtime'ına karşı bir güvenlik sınırı olarak değil, bilgilendirici runtime metadata'sı
olarak ele alın. Hassas yerel araçlar hâlâ açık bir Plugin veya operatör opt-in'i
gerektirmeli ve etkin model metadata'sı eksik ya da uygunsuz olduğunda kapalı
başarısız olmalıdır.

Manifest sahipliği ve keşfi bildirir; yürütme yine canlı kayıtlı araç
uygulamasını çağırır. `toolMetadata.<tool>.optional: true` değerini
`api.registerTool(..., { optional: true })` ile hizalı tutun; böylece OpenClaw,
araç açıkça izin listesine alınana kadar o Plugin runtime'ını yüklemekten kaçınabilir.

## Import kuralları

Odaklı SDK alt yollarından import edin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Kullanımdan kaldırılmış kök barrel'dan import etmeyin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin paketiniz içinde, dahili import'lar için `api.ts` ve `runtime-api.ts` gibi
yerel barrel dosyaları kullanın. Kendi Plugin'inizi bir SDK yolu üzerinden import
etmeyin. Sağlayıcıya özgü yardımcılar, arayüz gerçekten genel olmadıkça sağlayıcı
paketinde kalmalıdır.

Özel Gateway RPC yöntemleri ileri düzey bir giriş noktasıdır. Bunları
Plugin'e özgü bir önekte tutun; `config.*`, `exec.approvals.*`, `operator.admin.*`,
`wizard.*` ve `update.*` gibi çekirdek yönetici namespace'leri ayrılmış kalır ve
`operator.admin` olarak çözümlenir. `openclaw/plugin-sdk/gateway-method-runtime`
köprüsü, `contracts.gatewayMethodDispatch: ["authenticated-request"]` bildiren
Plugin HTTP rotaları için ayrılmıştır.

Tam import haritası için [Plugin SDK genel bakışı](/tr/plugins/sdk-overview) bölümüne bakın.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` metadata'sına sahip</Check>
<Check>**openclaw.plugin.json** manifesti mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm import'lar odaklı `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili import'lar SDK self-import'ları değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (depo içi Plugin'ler)</Check>

## Beta sürümlere karşı test edin

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` yoluyla abone olun. Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Beta etiketi görünür görünmez Plugin'inizi bu etikete karşı test edin. Kararlı sürümden önceki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra Plugin'inizin `plugin-forum` Discord kanalındaki başlığında `all good` ya da neyin bozulduğunu paylaşın. Henüz bir başlığınız yoksa bir tane oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya mevcut issue'yu güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını başlığınıza koyun.
5. `main` için `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue'yu hem PR'da hem de Discord başlığınızda bağlayın. Katkıda bulunanlar PR'ları etiketleyemez, bu yüzden başlık bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'ı olan engelleyiciler birleştirilir; PR'ı olmayan engelleyiciler buna rağmen yayımlanabilir. Bakımcılar beta testi sırasında bu başlıkları izler.
6. Sessizlik yeşil demektir. Pencereyi kaçırırsanız düzeltmeniz büyük olasılıkla sonraki döngüde yer alır.

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
    İçeri aktarma haritası ve kayıt API başvurusu
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

- [Plugin kancaları](/tr/plugins/hooks)
- [Plugin mimarisi](/tr/plugins/architecture)
