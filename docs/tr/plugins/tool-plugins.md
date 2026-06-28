---
read_when:
    - Yalnızca ajan araçları ekleyen basit bir OpenClaw Plugin'i oluşturmak istiyorsunuz
    - Plugin manifest metadata’sını elle yazmak yerine defineToolPlugin kullanmak istiyorsunuz
    - Yalnızca araç içeren bir Plugin'in iskeletini oluşturmanız, üretmeniz, doğrulamanız, test etmeniz veya yayımlamanız gerekiyor
sidebarTitle: Tool Plugins
summary: Basit tipli aracı araçlarını defineToolPlugin ve openclaw plugins init/build/validate ile oluşturun
title: Araç Plugin'leri
x-i18n:
    generated_at: "2026-06-28T01:07:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Araç Plugin'leri, kanal, model sağlayıcı, hook, hizmet veya kurulum arka ucu eklemeden OpenClaw'a ajan tarafından çağrılabilir araçlar ekler. Plugin sabit bir araç listesine sahipse ve OpenClaw'ın bu araçları çalışma zamanı kodunu yüklemeden keşfedilebilir tutan manifest meta verilerini üretmesini istiyorsanız `defineToolPlugin` kullanın.

Önerilen akış şöyledir:

1. `openclaw plugins init` ile bir paket iskeleti oluşturun.
2. `defineToolPlugin` ile araçlar yazın.
3. JavaScript derleyin.
4. `openclaw plugins build` ile `openclaw.plugin.json` ve `package.json` meta verilerini üretin.
5. Yayınlamadan veya kurmadan önce üretilen meta verileri doğrulayın.

Sağlayıcı, kanal, hook, hizmet veya karma yetenekli Plugin'ler için bunun yerine [Plugin oluşturma](/tr/plugins/building-plugins), [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) veya [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) ile başlayın.

## Gereksinimler

- Node >= 22.
- TypeScript ESM paket çıktısı.
- Yapılandırma ve araç parametresi şemaları için `typebox`.
- `openclaw/plugin-sdk/tool-plugin` dışa aktaran ilk OpenClaw sürümü olan `openclaw >=2026.5.17`.
- `dist/`, `openclaw.plugin.json` ve `package.json` gönderebilen bir paket kökü.

Üretilen Plugin çalışma zamanında `typebox` içe aktarır, bu nedenle `typebox` yalnızca `devDependencies` içinde değil, `dependencies` içinde tutulmalıdır.

## Hızlı başlangıç

Yeni bir Plugin paketi oluşturun:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

İskelet şunları oluşturur:

- `src/index.ts`: `echo` aracı içeren bir `defineToolPlugin` girişi.
- `src/index.test.ts`: küçük bir meta veri testi.
- `tsconfig.json`: `dist/` için NodeNext TypeScript çıktısı.
- `package.json`: betikler, çalışma zamanı bağımlılıkları ve `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: ilk araç için üretilmiş manifest meta verileri.

Beklenen doğrulama çıktısı:

```text
Plugin stock-quotes is valid.
```

## Araç yazma

`defineToolPlugin`, Plugin kimliği, isteğe bağlı bir yapılandırma şeması ve statik bir araç listesi alır. Parametre ve yapılandırma türleri TypeBox şemalarından çıkarımlanır.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

Araç adları kararlı API'dir. Çekirdek araçlarla veya diğer Plugin'lerle çakışmaları önleyecek kadar benzersiz, küçük harfli ve belirgin adlar seçin.

## İsteğe bağlı ve fabrika araçları

Kullanıcıların aracın bir modele gönderilmeden önce açıkça izin listesine alması gerekiyorsa `optional: true` ayarlayın:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build`, eşleşen `toolMetadata.<tool>.optional` manifest girdisini yazar; böylece OpenClaw aracı Plugin çalışma zamanı kodunu yüklemeden keşfedebilir.

Bir aracın oluşturulmadan önce çalışma zamanı araç bağlamına ihtiyacı olduğunda `factory` kullanın. Fabrika, aracın belirli bir çalıştırma için devre dışı kalmasına, sandbox durumunu incelemesine veya çalışma zamanı yardımcılarını bağlamasına izin verirken meta verileri statik tutar.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Fabrikalar yine de sabit araç adları içindir. Plugin araç adlarını dinamik olarak hesaplıyorsa veya araçları hook'lar, hizmetler, sağlayıcılar, komutlar ya da diğer çalışma zamanı yüzeyleriyle birleştiriyorsa doğrudan `definePluginEntry` kullanın.

## Dönüş değerleri

`defineToolPlugin`, düz dönüş değerlerini OpenClaw araç sonucu biçimine sarar:

- Modelin tam olarak o metni görmesi gerekiyorsa bir dize döndürün.
- Modelin biçimlendirilmiş JSON görmesini ve OpenClaw'ın özgün değeri `details` içinde tutmasını istiyorsanız JSON uyumlu bir değer döndürün.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Özel bir `AgentToolResult` döndürmeniz veya mevcut bir `api.registerTool` uygulamasını yeniden kullanmanız gerektiğinde fabrika aracı kullanın. Tamamen dinamik araçlara veya karma Plugin yeteneklerine ihtiyacınız olduğunda `defineToolPlugin` yerine `definePluginEntry` kullanın.

## Yapılandırma

`configSchema` isteğe bağlıdır. Atlanırsa OpenClaw katı bir boş nesne şeması kullanır ve üretilen manifest yine de `configSchema` içerir.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

`configSchema` eklediğinizde, ikinci `execute` bağımsız değişkeni şemadan türlenir:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw, Plugin yapılandırmasını Gateway yapılandırmasındaki Plugin girdisinden okur. Kaynakta veya dokümantasyon örneklerinde gizli bilgileri sabit kodlamayın. Plugin'in güvenlik modeline göre yapılandırma, ortam değişkenleri veya SecretRef'ler kullanın.

## Üretilen meta veriler

OpenClaw, kurulu Plugin'leri soğuk meta verilerden keşfeder. Plugin manifestini, Plugin çalışma zamanı kodunu içe aktarmadan önce okuyabilmelidir. Bu nedenle `defineToolPlugin` statik meta verileri açığa çıkarır ve `openclaw plugins build` bu meta verileri pakete yazar.

Plugin kimliğini, adını, açıklamasını, yapılandırma şemasını, etkinleştirmeyi veya araç adlarını değiştirdikten sonra oluşturucuyu çalıştırın:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Tek araçlı bir Plugin için üretilen manifest şöyle görünür:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` önemli keşif sözleşmesidir. OpenClaw'a, kurulu her Plugin çalışma zamanını yüklemeden her aracın hangi Plugin'e ait olduğunu söyler. Manifest güncel değilse araç keşifte eksik olabilir veya bir kayıt hatasından yanlış Plugin sorumlu tutulabilir.

## Paket meta verileri

Basit araç Plugin'i iş akışı için `openclaw plugins build`, `package.json` dosyasını seçilen tek çalışma zamanı girişiyle hizalar:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Kurulu paketler için `./dist/index.js` gibi derlenmiş JavaScript kullanın. Kaynak girdiler çalışma alanı geliştirmesinde yararlıdır, ancak yayınlanan paketler TypeScript çalışma zamanı yüklemesine bağımlı olmamalıdır.

## CI'da doğrulama

Üretilen meta veriler güncel olmadığında dosyaları yeniden yazmadan CI'ı başarısız kılmak için `plugins build --check` kullanın:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` şunları denetler:

- `openclaw.plugin.json` vardır ve normal manifest yükleyicisinden geçer.
- Geçerli giriş `defineToolPlugin` meta verilerini dışa aktarır.
- Üretilen manifest alanları giriş meta verileriyle eşleşir.
- `contracts.tools` bildirilen araç adlarıyla eşleşir.
- `package.json`, `openclaw.extensions` öğesini seçilen çalışma zamanı girişine yönlendirir.

## Yerel olarak kurma ve inceleme

Ayrı bir OpenClaw checkout'ından veya kurulu CLI'dan paket yolunu kurun:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Paketlenmiş bir smoke için önce paketleyin ve tarball'ı kurun:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Kurulumdan sonra Gateway'i başlatın veya yeniden başlatın ve ajandan aracı kullanmasını isteyin. Araç görünürlüğünde hata ayıklıyorsanız kodu değiştirmeden önce Plugin çalışma zamanını ve etkin araç kataloğunu inceleyin.

## Yayınlama

Paket hazır olduğunda ClawHub üzerinden yayınlayın:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

Açık bir ClawHub konumlayıcısıyla kurun:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Yalın npm paket belirtimleri lansman geçişi sırasında desteklenmeye devam eder, ancak ClawHub OpenClaw Plugin'leri için tercih edilen keşif ve dağıtım yüzeyidir.

## Sorun giderme

### `plugin entry not found: ./dist/index.js`

Seçilen giriş dosyası yok. `npm run build` çalıştırın, ardından `openclaw plugins build --entry ./dist/index.js` veya `openclaw plugins validate --entry ./dist/index.js` komutunu yeniden çalıştırın.

### `plugin entry does not expose defineToolPlugin metadata`

Giriş, `defineToolPlugin` tarafından oluşturulmuş bir değer dışa aktarmadı. Modül varsayılan dışa aktarımının `defineToolPlugin(...)` sonucu olduğunu denetleyin veya `--entry` ile doğru girişi geçirin.

### `openclaw.plugin.json generated metadata is stale`

Manifest artık giriş meta verileriyle eşleşmiyor. Şunu çalıştırın:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Hem `openclaw.plugin.json` hem de `package.json` değişikliklerini commit'leyin.

### `package.json openclaw.extensions must include ./dist/index.js`

Paket meta verileri farklı bir çalışma zamanı girişini gösteriyor. Oluşturucunun paket meta verilerini göndermeyi amaçladığınız girişle hizalaması için `openclaw plugins build --entry ./dist/index.js` çalıştırın.

### `Cannot find package 'typebox'`

Derlenmiş Plugin çalışma zamanında `typebox` içe aktarır. `typebox` öğesini `dependencies` içinde tutun, paket bağımlılıklarını yeniden kurun, yeniden derleyin ve doğrulamayı yeniden çalıştırın.

### Araç kurulumdan sonra görünmüyor

Bunları sırayla denetleyin:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json`, beklenen araç adlarıyla `contracts.tools` içerir.
4. `package.json`, `openclaw.extensions: ["./dist/index.js"]` içerir.
5. Plugin kurulduktan sonra Gateway yeniden başlatıldı veya yeniden yüklendi.

## Ayrıca bakın

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin manifesti](/tr/plugins/manifest)
- [Plugin'ler CLI](/tr/cli/plugins)
- [ClawHub yayınlama](/tr/clawhub/publishing)
