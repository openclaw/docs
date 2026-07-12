---
doc-schema-version: 1
read_when:
    - Yeni bir OpenClaw Plugin'i oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıç kılavuzuna ihtiyacınız var
    - Kanal, sağlayıcı, CLI arka ucu, araç veya kanca belgeleri arasında seçim yapıyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw plugininizi dakikalar içinde oluşturun
title: Plugin oluşturma
x-i18n:
    generated_at: "2026-07-12T11:57:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginler, çekirdeği değiştirmeden OpenClaw'u genişletir. Bir plugin; mesajlaşma
kanalı, model sağlayıcısı, yerel CLI arka ucu, ajan aracı, hook, medya sağlayıcısı
veya pluginin sahip olduğu başka bir yetenek ekleyebilir.

Harici bir plugini OpenClaw deposuna eklemeniz gerekmez. Paketi
[ClawHub](/clawhub) üzerinde yayımlayın; kullanıcılar paketi şu komutla yükler:

```bash
openclaw plugins install clawhub:<package-name>
```

Başlatma geçişi sırasında öneksiz paket belirtimleri npm'den yüklenmeye devam eder.
ClawHub çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Gereksinimler

- Node 22.19+, Node 23.11+ veya Node 24+ ile `npm` ya da `pnpm`.
- TypeScript ESM modülleri.
- Depoda paketlenmiş plugin çalışmaları için depoyu klonlayın ve `pnpm install`
  komutunu çalıştırın. OpenClaw, paketlenmiş pluginleri `extensions/*` çalışma
  alanı paketlerinden keşfettiği için kaynak kod çıkışında plugin geliştirme
  yalnızca pnpm ile yapılabilir.

## Plugin yapısını seçme

<CardGroup cols={2}>
  <Card title="Kanal plugini" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'u bir mesajlaşma platformuna bağlayın.
  </Card>
  <Card title="Sağlayıcı plugini" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Model, medya, arama, getirme, konuşma veya gerçek zamanlı sağlayıcı ekleyin.
  </Card>
  <Card title="CLI arka uç plugini" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    OpenClaw model yedek mekanizması üzerinden yerel bir yapay zekâ CLI'sı çalıştırın.
  </Card>
  <Card title="Araç plugini" icon="wrench" href="/tr/plugins/tool-plugins">
    Ajan araçlarını kaydedin.
  </Card>
</CardGroup>

## Hızlı başlangıç

Bir zorunlu ajan aracı kaydederek asgari bir araç plugini oluşturun. Bu, kullanışlı
en kısa plugin yapısıdır ve paketi, manifesti, giriş noktasını ve yerel doğrulamayı
kapsar.

<Steps>
  <Step title="Paket meta verilerini oluşturun">
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

    Yayımlanan harici pluginlerin çalışma zamanı girişleri, derlenmiş JavaScript
    dosyalarını göstermelidir. Giriş noktası sözleşmesinin tamamı için
    [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) sayfasına bakın.

    Yapılandırması olmasa bile her pluginin bir manifeste ihtiyacı vardır.
    OpenClaw'un her plugin çalışma zamanını istekli biçimde yüklemeden sahipliği
    keşfedebilmesi için çalışma zamanı araçları `contracts.tools` içinde yer
    almalıdır. `activation.onStartup` değerini bilinçli olarak ayarlayın; bu örnek
    Gateway başlatılırken yüklenir.

    Ana makine tarafından güvenilen plugin yüzeyleri de manifest denetimindedir
    ve yüklü pluginler için açık bildirim gerektirir:
    `api.registerAgentToolResultMiddleware(...)`, hedeflenen her çalışma zamanının
    `contracts.agentToolResultMiddleware` içinde listelenmesini;
    `api.registerTrustedToolPolicy(...)` ise her politika kimliğinin
    `contracts.trustedToolPolicies` içinde bulunmasını gerektirir. Bu bildirimler,
    yükleme sırasındaki incelemeyi çalışma zamanı kaydıyla uyumlu tutar.

    Tüm manifest alanları için [Plugin manifesti](/tr/plugins/manifest) sayfasına bakın.

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

    Kanal dışı pluginler için `definePluginEntry` kullanın. Kanal pluginleri ise
    bunun yerine `openclaw/plugin-sdk/core` içindeki
    `defineChannelPluginEntry` işlevini kullanır.

  </Step>

  <Step title="Çalışma zamanını test edin">
    Yüklü veya harici bir plugin için yüklenen çalışma zamanını inceleyin:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin bir CLI komutu kaydediyorsa bu komutu da çalıştırıp çıktıyı doğrulayın;
    örneğin `openclaw demo-plugin ping`.

    Bu depodaki paketlenmiş bir plugin için OpenClaw, kaynak kod çıkışı plugin
    paketlerini `extensions/*` çalışma alanından keşfeder. En yakın hedefli testi
    çalıştırın:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Paket yüklemesini test edin">
    Yayımlamadan önce, paketlemeye hazır pluginin kullanıcıların alacağı yükleme
    biçimini test edin. Önce bir derleme adımı ekleyin, `openclaw.extensions`
    gibi çalışma zamanı girişlerini `./dist/index.js` benzeri derlenmiş JavaScript
    dosyalarına yönlendirin ve `npm pack` çıktısının bu `dist/` içeriğini
    kapsadığından emin olun. TypeScript kaynak girişleri yalnızca kaynak kod
    çıkışları ve yerel geliştirme yolları içindir.

    Ardından plugini paketleyin ve tarball dosyasını `npm-pack:` ile yükleyin:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:`, OpenClaw'un plugin başına yönetilen npm projesini kullanır;
    böylece kaynak kod çıkışı testlerinin gizleyebileceği çalışma zamanı bağımlılığı
    hatalarını yakalar. Katalog bağlantılı resmî güveni değil, paket ve bağımlılık
    yapısını doğrular. Çalışma zamanı içe aktarımları `dependencies` veya
    `optionalDependencies` içinde bulunmalıdır; yalnızca `devDependencies`
    içinde bırakılan bağımlılıklar yönetilen çalışma zamanı projesine yüklenmez.

    Resmî veya ayrıcalıklı plugin davranışının nihai doğrulaması olarak ham bir
    arşiv/yol yüklemesi kullanmayın. Ham kaynaklar yerel hata ayıklama için
    kullanışlıdır ancak npm veya ClawHub yüklemeleriyle aynı bağımlılık yolunu
    doğrulamaz. Plugininiz güvenilen resmî plugin durumuna dayanıyorsa katalog
    destekli resmî yükleme ya da resmî güveni kaydeden yayımlanmış paket yolu
    üzerinden ikinci bir doğrulama ekleyin. Yükleme kökü ve bağımlılık sahipliği
    ayrıntıları için
    [Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution) sayfasına
    bakın.

  </Step>

  <Step title="Yayımlayın">
    Yayımlamadan önce paketi doğrulayın:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Standart ClawHub paket parçacıkları `docs/snippets/plugin-publish/` içinde
    bulunur.

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

Araçlar zorunlu veya isteğe bağlı olabilir. Plugin etkinleştirildiğinde zorunlu
araçlar her zaman kullanılabilir. İsteğe bağlı araçlarda OpenClaw'un sahip plugin
çalışma zamanını yüklemesinden önce kullanıcının açıkça onay vermesi gerekir.

Araç fabrikaları; `deliveryContext`, mevcut olduğunda etkin platform
konuşmasının `nativeChannelId` değeri ve `requesterSenderId` dâhil olmak üzere
güvenilen çalışma zamanı bağlamını alır.

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

`api.registerTool(...)` ile kaydedilen her araç plugin manifestinde de
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

Kullanıcılar `tools.allow` ile etkinleştirir:

```json5
{
  tools: { allow: ["workflow_tool"] }, // veya bir plugindeki tüm araçlar için ["my-plugin"]
}
```

İsteğe bağlı araçlar, bir aracın modele sunulup sunulmayacağını denetler. Bir araç
veya hook, model tarafından seçildikten sonra ve eylem çalıştırılmadan önce onay
istemeliyse [plugin izin isteklerini](/tr/plugins/plugin-permission-requests)
kullanın.

Yan etkiler, alışılmadık ikili dosyalar veya varsayılan olarak sunulmaması gereken
yetenekler için isteğe bağlı araçlar kullanın. Araç adları çekirdek araç adlarıyla
çakışmamalıdır; çakışmalar atlanır ve plugin tanılamalarında bildirilir. Hatalı
kayıtlar da aynı şekilde atlanır ve bildirilir: boş olmayan bir `name` değerinin
eksik olması, `execute` değerinin işlev olmaması veya araç tanımlayıcısında bir
`parameters` nesnesinin bulunmaması.

Araç fabrikaları, çalışma zamanı tarafından sağlanan bir bağlam nesnesi alır. Bir
aracın mevcut turdaki etkin modeli günlüğe kaydetmesi, göstermesi veya ona uyum
sağlaması gerektiğinde `ctx.activeModel` kullanın; bu değer `provider`, `modelId`
ve `modelRef` içerebilir. Bunu yerel operatöre, yüklü plugin koduna veya
değiştirilmiş bir OpenClaw çalışma zamanına karşı güvenlik sınırı olarak değil,
bilgilendirici çalışma zamanı meta verisi olarak değerlendirin. Hassas yerel
araçlar yine de açık bir plugin veya operatör etkinleştirmesi gerektirmeli ve
etkin model meta verileri eksik veya uygunsuz olduğunda güvenli biçimde
başarısız olmalıdır.

Manifest, sahipliği ve keşfi bildirir; yürütme yine canlı olarak kaydedilmiş araç
uygulamasını çağırır. OpenClaw'un araç açıkça izin listesine alınana kadar ilgili
plugin çalışma zamanını yüklemekten kaçınabilmesi için
`toolMetadata.<tool>.optional: true` ile
`api.registerTool(..., { optional: true })` değerlerini uyumlu tutun.

## İçe aktarma kuralları

Odaklanmış SDK alt yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Kullanımdan kaldırılmış kök barrel dosyasından içe aktarmayın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin paketiniz içinde dahili içe aktarımlar için `api.ts` ve `runtime-api.ts`
gibi yerel barrel dosyalarını kullanın. Kendi plugininizi bir SDK yolu üzerinden
içe aktarmayın. Sağlayıcıya özgü yardımcılar, ilgili sınır gerçekten genel
olmadığı sürece sağlayıcı paketinde kalmalıdır.

Özel Gateway RPC yöntemleri gelişmiş bir giriş noktasıdır. Bunları plugine özgü
bir önek altında tutun; `config.*`, `exec.approvals.*`, `operator.admin.*`,
`wizard.*` ve `update.*` gibi çekirdek yönetim ad alanları ayrılmış olarak kalır
ve `operator.admin` olarak çözümlenir.
`openclaw/plugin-sdk/gateway-method-runtime` köprüsü,
`contracts.gatewayMethodDispatch: ["authenticated-request"]` bildiren plugin
HTTP rotalarına ayrılmıştır.

İçe aktarma haritasının tamamı için
[Plugin SDK'ya genel bakış](/tr/plugins/sdk-overview) sayfasına bakın.

## Gönderim öncesi denetim listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifesti mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarımlar odaklanmış `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarımlar SDK üzerinden kendini içe aktarmak yerine yerel modülleri kullanıyor</Check>
<Check>Testler başarılı (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` başarılı (depo içi pluginler)</Check>

## Beta sürümlerine karşı test etme

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) sürümlerini izleyin (`Watch` > `Releases`). Beta etiketleri `v2026.3.N-beta.1` biçimindedir. Sürüm duyuruları için X'te [@openclaw](https://x.com/openclaw) hesabını da takip edebilirsiniz.
2. Beta etiketi yayımlanır yayımlanmaz Plugin'inizi bu etikete karşı test edin. Kararlı sürümden önceki süre genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalındaki ([discord.gg/clawd](https://discord.gg/clawd)) Plugin'inize ait ileti dizisine `all good` veya neyin bozulduğunu yazın. Henüz bir ileti diziniz yoksa oluşturun.
4. Bir sorun oluşursa `Beta engelleyicisi: <plugin-name> - <summary>` başlıklı bir sorun kaydı açın veya mevcut kaydı güncelleyin ve `beta-blocker` etiketini uygulayın. Sorun kaydının bağlantısını ileti dizinizde paylaşın.
5. `main` dalına yönelik, `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve sorun kaydının bağlantısını hem PR'da hem de Discord ileti dizinizde paylaşın. Katkıda bulunanlar PR'lara etiket uygulayamadığından başlık, bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'ı olan engelleyiciler birleştirilir; PR'ı olmayanlara rağmen sürüm yayımlanabilir.
6. Sessizlik, her şeyin yolunda olduğu anlamına gelir. Bu süreyi kaçırmak genellikle düzeltmenizin bir sonraki döngüde dahil edilmesi demektir.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugin'i geliştirin
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugin'i geliştirin
  </Card>
  <Card title="CLI Arka Uç Plugin'leri" icon="terminal" href="/tr/plugins/cli-backend-plugins">
    Yerel bir yapay zekâ CLI arka ucu kaydedin
  </Card>
  <Card title="SDK'ya Genel Bakış" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma eşlemesi ve kayıt API'si başvurusu
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime aracılığıyla TTS, arama ve alt ajan
  </Card>
  <Card title="Test" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcıları ve kalıpları
  </Card>
  <Card title="Plugin Manifesti" icon="file-json" href="/tr/plugins/manifest">
    Eksiksiz manifest şeması başvurusu
  </Card>
</CardGroup>

## İlgili konular

- [Plugin kancaları](/tr/plugins/hooks)
- [Plugin mimarisi](/tr/plugins/architecture)
