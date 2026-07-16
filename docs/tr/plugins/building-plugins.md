---
doc-schema-version: 1
read_when:
    - Yeni bir OpenClaw plugini oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıç kılavuzuna ihtiyacınız var
    - Kanal, sağlayıcı, CLI arka ucu, araç veya kanca belgeleri arasında seçim yapıyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin'inizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-07-16T17:36:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginler, çekirdeği değiştirmeden OpenClaw'ı genişletir. Bir plugin; mesajlaşma
kanalı, model sağlayıcısı, yerel CLI arka ucu, aracı aracı, kanca, medya sağlayıcısı
veya plugin tarafından yönetilen başka bir yetenek ekleyebilir.

Harici bir plugini OpenClaw deposuna eklemeniz gerekmez. Paketi
[ClawHub](/clawhub) üzerinde yayımlayın; kullanıcılar şu komutla yükleyebilir:

```bash
openclaw plugins install clawhub:<package-name>
```

Yalın paket tanımları, kullanıma geçiş sürecinde npm'den yüklenmeye devam eder. ClawHub
çözümlemesi istediğinizde `clawhub:` önekini kullanın.

## Gereksinimler

- Node 22.22.3+, Node 24.15+ veya Node 25.9+ ve `npm` ya da `pnpm`.
- TypeScript ESM modülleri.
- Depo içindeki paketlenmiş plugin çalışmaları için depoyu klonlayın ve `pnpm install` komutunu çalıştırın.
  Kaynak kopyasında plugin geliştirme yalnızca pnpm ile yapılır; çünkü OpenClaw,
  paketlenmiş pluginleri `extensions/*` çalışma alanı paketlerinden keşfeder.

## Plugin yapısını seçme

<CardGroup cols={2}>
  <Card title="Kanal plugini" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'ı bir mesajlaşma platformuna bağlayın.
  </Card>
  <Card title="Sağlayıcı plugini" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Model, medya, arama, getirme, konuşma veya gerçek zamanlı sağlayıcı ekleyin.
  </Card>
  <Card title="CLI arka uç plugini" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    OpenClaw model geri dönüşü aracılığıyla yerel bir yapay zekâ CLI'ı çalıştırın.
  </Card>
  <Card title="Araç plugini" icon="wrench" href="/tr/plugins/tool-plugins">
    Aracı araçlarını kaydedin.
  </Card>
</CardGroup>

## Hızlı başlangıç

Zorunlu bir aracı aracını kaydederek asgari bir araç plugini oluşturun. Bu,
kullanışlı en kısa plugin yapısıdır ve paketi, manifesti, giriş noktasını ve
yerel doğrulamayı kapsar.

<Steps>
  <Step title="Paket meta verilerini oluşturma">
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

    Yayımlanmış harici pluginlerin çalışma zamanı girişleri, derlenmiş JavaScript
    dosyalarını göstermelidir. Giriş noktası sözleşmesinin tamamı için
    [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) sayfasına bakın.

    Yapılandırması olmasa bile her plugin bir manifest gerektirir. OpenClaw'ın her
    plugin çalışma zamanını önceden yüklemeden sahipliği keşfedebilmesi için çalışma
    zamanı araçları `contracts.tools` içinde yer almalıdır. `activation.onStartup`
    değerini bilinçli olarak ayarlayın; bu örnek Gateway başlatılırken yüklenir.

    Ana makinenin güvendiği plugin yüzeyleri de manifest ile sınırlandırılır ve
    yüklü pluginler için açık bildirim gerektirir: `api.registerAgentToolResultMiddleware(...)`,
    her hedef çalışma zamanının `contracts.agentToolResultMiddleware` içinde listelenmesini;
    `api.registerTrustedToolPolicy(...)` ise her politika kimliğinin
    `contracts.trustedToolPolicies` içinde yer almasını gerektirir. Bu bildirimler, yükleme
    sırasındaki inceleme ile çalışma zamanı kaydını uyumlu tutar.

    Tüm manifest alanları için [Plugin manifesti](/tr/plugins/manifest) sayfasına bakın.

  </Step>

  <Step title="Aracı kaydetme">
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

    Kanal dışı pluginler için `definePluginEntry` kullanın. Kanal pluginleri bunun
    yerine `openclaw/plugin-sdk/core` içindeki `defineChannelPluginEntry` öğesini kullanır.

  </Step>

  <Step title="Çalışma zamanını test etme">
    Yüklü veya harici bir plugin için yüklenen çalışma zamanını inceleyin:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin bir CLI komutu kaydediyorsa bu komutu da çalıştırıp çıktıyı doğrulayın;
    örneğin `openclaw demo-plugin ping`.

    Bu depodaki paketlenmiş bir plugin için OpenClaw, kaynak kopyasındaki plugin
    paketlerini `extensions/*` çalışma alanından keşfeder. En yakın hedefli
    testi çalıştırın:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Paket yüklemesini test etme">
    Yayımlamadan önce, paketlemeye hazır plugin için kullanıcıların alacağı yükleme
    biçiminin aynısını test edin. Önce bir derleme adımı ekleyin, `openclaw.extensions`
    gibi çalışma zamanı girişlerini `./dist/index.js` gibi derlenmiş JavaScript'e
    yönlendirin ve `npm pack` öğesinin bu `dist/` çıktısını
    içerdiğinden emin olun. TypeScript kaynak girişleri yalnızca kaynak kopyaları ve
    yerel geliştirme yolları içindir.

    Ardından plugini paketleyin ve tar arşivini `npm-pack:` ile yükleyin:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:`, OpenClaw'ın plugin başına yönetilen npm projesini kullanır;
    dolayısıyla kaynak kopyası testlerinin gizleyebileceği çalışma zamanı bağımlılığı
    hatalarını yakalar. Katalog bağlantılı resmî güveni değil, paket ve bağımlılık
    yapısını doğrular. Çalışma zamanı içe aktarımları `dependencies` veya
    `optionalDependencies` içinde olmalıdır; yalnızca `devDependencies` içinde bırakılan
    bağımlılıklar, yönetilen çalışma zamanı projesi için yüklenmez.

    Resmî veya ayrıcalıklı plugin davranışının nihai doğrulaması olarak ham bir
    arşiv/yol yüklemesi kullanmayın. Ham kaynaklar yerel hata ayıklama için
    kullanışlıdır ancak npm veya ClawHub yüklemeleriyle aynı bağımlılık yolunu
    doğrulamaz. Plugininiz güvenilir resmî plugin durumuna dayanıyorsa katalog
    destekli resmî bir yükleme veya resmî güveni kaydeden yayımlanmış paket yolu
    üzerinden ikinci bir doğrulama ekleyin. Yükleme kökü ve bağımlılık sahipliği
    ayrıntıları için [Plugin bağımlılığı çözümlemesi](/tr/plugins/dependency-resolution)
    sayfasına bakın.

  </Step>

  <Step title="Yayımlama">
    Yayımlamadan önce paketi doğrulayın:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Standart ClawHub paket parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.

  </Step>

  <Step title="Yükleme">
    Yayımlanan paketi ClawHub üzerinden yükleyin:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Araçları kaydetme

Araçlar zorunlu veya isteğe bağlı olabilir. Zorunlu araçlar, plugin
etkinleştirildiğinde her zaman kullanılabilir. İsteğe bağlı araçlarda OpenClaw'ın
sahip plugin çalışma zamanını yüklemesinden önce kullanıcının açıkça etkinleştirmesi
gerekir.

Araç fabrikaları; `deliveryContext`, kullanılabilir olduğunda etkin platform
görüşmesi için `nativeChannelId` ve `requesterSenderId` dâhil olmak üzere güvenilir
çalışma zamanı bağlamını alır.

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

`api.registerTool(...)` ile kaydedilen her araç, plugin manifestinde de bildirilmelidir:

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

Kullanıcılar `tools.allow` ile etkinleştirir:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

İsteğe bağlı araçlar, bir aracın modele sunulup sunulmayacağını denetler. Bir araç
veya kancanın, model onu seçtikten sonra ve eylem çalışmadan önce onay istemesi
gerekiyorsa [plugin izin isteklerini](/tr/plugins/plugin-permission-requests) kullanın.

İsteğe bağlı araçları yan etkiler, alışılmadık ikili dosyalar veya varsayılan olarak
sunulmaması gereken yetenekler için kullanın. Araç adları çekirdek araç adlarıyla
çakışmamalıdır; çakışmalar atlanır ve plugin tanılamasında bildirilir. Hatalı kayıtlar
da aynı şekilde atlanıp bildirilir: eksik veya boş bir `name`, işlev
olmayan bir `execute` ya da `parameters` nesnesi bulunmayan bir araç
tanımlayıcısı.

Araç fabrikaları, çalışma zamanı tarafından sağlanan bir bağlam nesnesi alır. Bir
aracın geçerli turdaki etkin modeli günlüğe kaydetmesi, görüntülemesi veya ona uyum
sağlaması gerektiğinde `ctx.activeModel` kullanın; bu nesne
`provider`, `modelId` ve `modelRef` içerebilir. Bunu yerel
operatöre, yüklü plugin koduna veya değiştirilmiş bir OpenClaw çalışma zamanına karşı
güvenlik sınırı olarak değil, bilgilendirici çalışma zamanı meta verisi olarak ele
alın. Hassas yerel araçlar yine de açık bir plugin veya operatör onayı gerektirmeli
ve etkin model meta verileri eksik ya da uygunsuz olduğunda kapalı biçimde
başarısız olmalıdır.

Manifest sahipliği ve keşfi bildirir; yürütme ise canlı olarak kaydedilmiş araç
uygulamasını çağırmaya devam eder. OpenClaw'ın araç açıkça izin verilenler listesine
eklenene kadar ilgili plugin çalışma zamanını yüklememesini sağlamak için
`toolMetadata.<tool>.optional: true` ile `api.registerTool(..., { optional: true })` öğelerini uyumlu tutun.

## İçe aktarma kuralları

Odaklanmış SDK alt yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Kullanımdan kaldırılan kök barrel dosyasından içe aktarmayın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin paketiniz içinde, dahili içe aktarımlar için `api.ts` ve
`runtime-api.ts` gibi yerel barrel dosyalarını kullanın. Kendi plugininizi bir SDK
yolu üzerinden içe aktarmayın. Sağlayıcıya özgü yardımcılar, bağlantı gerçekten
genel olmadığı sürece sağlayıcı paketinde kalmalıdır.

Özel Gateway RPC yöntemleri gelişmiş bir giriş noktasıdır. Bunları plugine özgü bir
önek altında tutun; `config.*`, `exec.approvals.*`, `operator.admin.*`,
`wizard.*` ve `update.*` gibi çekirdek yönetim ad alanları ayrılmış
olarak kalır ve `operator.admin` sonucuna çözümlenir.
`openclaw/plugin-sdk/gateway-method-runtime` köprüsü, `contracts.gatewayMethodDispatch: ["authenticated-request"]` bildiren plugin HTTP yolları için
ayrılmıştır.

İçe aktarma haritasının tamamı için [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
sayfasına bakın.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifesti mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarımlar odaklanmış `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarımlar SDK üzerinden kendi kendine içe aktarma yerine yerel modülleri kullanıyor</Check>
<Check>Testler başarılı (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` başarılı (depo içi pluginler)</Check>

## Beta sürümlerine karşı test etme

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) sürümlerini izleyin (`Watch` > `Releases`). Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için X'te [@openclaw](https://x.com/openclaw) hesabını da takip edebilirsiniz.
2. Beta etiketi görünür görünmez plugin'inizi bu etikete karşı test edin. Kararlı sürümden önceki süre genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalındaki ([discord.gg/clawd](https://discord.gg/clawd)) plugin'inize ait ileti dizisinde `all good` bilgisini veya neyin bozulduğunu paylaşın. Henüz bir ileti diziniz yoksa oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir sorun kaydı açın veya mevcut kaydı güncelleyin ve `beta-blocker` etiketini uygulayın. Sorun kaydının bağlantısını ileti dizinizde paylaşın.
5. `main` için `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve sorun kaydını hem PR'a hem de Discord ileti dizinize bağlayın. Katkıda bulunanlar PR'lara etiket ekleyemediğinden başlık, bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'ı bulunan engelleyici düzeltmeler birleştirilir; PR'ı bulunmayanlar ise yine de sürüme dahil edilebilir.
6. Sessizlik, her şeyin yolunda olduğu anlamına gelir. Bu süreyi kaçırmak genellikle düzeltmenizin bir sonraki döngüye kalacağı anlamına gelir.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı plugin'i oluşturun
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı plugin'i oluşturun
  </Card>
  <Card title="CLI Arka Uç Plugin'leri" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    Yerel bir yapay zekâ CLI arka ucu kaydedin
  </Card>
  <Card title="SDK'ya Genel Bakış" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma eşlemesi ve kayıt API'si referansı
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime aracılığıyla TTS, arama ve alt aracı
  </Card>
  <Card title="Test" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcıları ve kalıpları
  </Card>
  <Card title="Plugin Manifesti" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şeması referansı
  </Card>
</CardGroup>

## İlgili

- [Plugin kancaları](/tr/plugins/hooks)
- [Plugin mimarisi](/tr/plugins/architecture)
