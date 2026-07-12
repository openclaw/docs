---
read_when:
    - Yalnızca ajan araçları ekleyen basit bir OpenClaw Plugin'i oluşturmak istiyorsunuz
    - Plugin manifest meta verilerini elle yazmak yerine defineToolPlugin kullanmak istiyorsunuz
    - Yalnızca araç içeren bir plugin için iskelet oluşturmanız, kod üretmeniz, doğrulama yapmanız, test etmeniz veya yayımlamanız gerekiyor
sidebarTitle: Tool Plugins
summary: defineToolPlugin ve openclaw plugins init/build/validate ile basit, türü belirlenmiş agent araçları oluşturun
title: Araç pluginleri
x-i18n:
    generated_at: "2026-07-12T12:40:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin`, yalnızca ajan tarafından çağrılabilen araçlar ekleyen bir Plugin oluşturur: kanal, model sağlayıcısı, hook, hizmet veya kurulum arka ucu eklemez. OpenClaw’ın Plugin çalışma zamanı kodunu yüklemeden araçları keşfetmek için ihtiyaç duyduğu manifest meta verilerini üretir.

Sağlayıcı, kanal, hook, hizmet veya karma yetenekli Plugin’ler için bunun yerine [Plugin oluşturma](/tr/plugins/building-plugins), [Kanal Plugin’leri](/tr/plugins/sdk-channel-plugins) veya [Sağlayıcı Plugin’leri](/tr/plugins/sdk-provider-plugins) ile başlayın.

## Gereksinimler

- Node 22.19+, Node 23.11+ veya Node 24+.
- TypeScript ESM paket çıktısı.
- `dependencies` içinde `typebox` (yalnızca `devDependencies` içinde değil; oluşturulan Plugin bunu çalışma zamanında içe aktarır).
- `openclaw/plugin-sdk/tool-plugin` dışa aktarımını sunan ilk sürüm olan `openclaw >=2026.5.17`.
- `dist/`, `openclaw.plugin.json` ve `package.json` dosyalarını dağıtan bir paket kökü.

## Hızlı başlangıç

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` şunların iskeletini oluşturur:

| Dosya                  | Amaç                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | Tek bir `echo` aracı içeren `defineToolPlugin` giriş noktası       |
| `src/index.test.ts`    | Araç listesini doğrulayan meta veri testi                          |
| `tsconfig.json`        | `dist/` dizinine NodeNext TypeScript çıktısı                       |
| `vitest.config.ts`     | `src/**/*.test.ts` için Vitest yapılandırması                      |
| `package.json`         | Betikler, çalışma zamanı bağımlılıkları, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | İlk araç için oluşturulan manifest meta verileri                   |

`npm run plugin:build`, `npm run build` (tsc) komutunu ve ardından `openclaw plugins build --entry ./dist/index.js` komutunu çalıştırır. `npm run plugin:validate`, yeniden derler ve `openclaw plugins validate --entry ./dist/index.js` komutunu çalıştırır. Başarılı doğrulama şu çıktıyı verir:

```text
Plugin stock-quotes is valid.
```

`openclaw plugins init <id>` seçenekleri:

| Bayrak               | Varsayılan         | Etki                                   |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Çıktı dizini                            |
| `--name <name>`      | Başlık biçiminde `<id>` | Görünen ad                         |
| `--type <type>`      | `tool`             | İskelet türü: `tool` veya `provider`   |
| `--force`            | kapalı             | Mevcut bir çıktı dizininin üzerine yaz |

## Araç yazma

`defineToolPlugin`, Plugin kimliğini, isteğe bağlı bir yapılandırma şemasını ve statik bir araç listesini alır. Parametre ve yapılandırma türleri TypeBox şemalarından çıkarılır.

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

Araç adları kararlı API’dir. Benzersiz, küçük harfli ve çekirdek araçlarla veya diğer Plugin’lerle çakışmayı önleyecek kadar belirgin adlar seçin.

## İsteğe bağlı araçlar ve fabrika araçları

Kullanıcıların aracı bir modele gönderilmeden önce açıkça izin listesine eklemesi gerekiyorsa `optional: true` ayarlayın. `openclaw plugins build`, eşleşen `toolMetadata.<tool>.optional` manifest girdisini yazar; böylece OpenClaw, Plugin çalışma zamanı kodunu yüklemeden aracın isteğe bağlı olduğunu görebilir.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Bir aracın oluşturulmadan önce çalışma zamanı araç bağlamına ihtiyacı olduğunda `factory` kullanın: belirli bir çalıştırmadan vazgeçmek, korumalı alan durumunu incelemek veya çalışma zamanı yardımcılarını bağlamak için. Somut araç çalışma zamanında oluşturulsa bile meta veriler statik kalır.

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

Fabrikalar yine de sabit bir araç adını önceden bildirir. Plugin araç adlarını dinamik olarak hesaplıyorsa veya araçları hook’lar, hizmetler, sağlayıcılar ya da komutlarla birleştiriyorsa doğrudan `definePluginEntry` kullanın.

## Dönüş değerleri

`defineToolPlugin`, düz dönüş değerlerini OpenClaw araç sonucu biçimine sarar:

- Modelin tam olarak bu metni görmesi gerektiğinde bir dize döndürün.
- Modelin biçimlendirilmiş JSON görmesini ve OpenClaw’ın özgün değeri `details` içinde tutmasını istediğinizde JSON ile uyumlu bir değer döndürün.

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

Özel bir `AgentToolResult` gerektiğinde veya mevcut bir `api.registerTool` uygulamasını yeniden kullanmak istediğinizde fabrika aracı kullanın.

## Yapılandırma

`configSchema` isteğe bağlıdır. Bunu atlarsanız OpenClaw katı bir boş nesne şeması uygular; oluşturulan manifest yine de `configSchema` içerir.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Bir `configSchema` kullanıldığında ikinci `execute` bağımsız değişkeninin türü bu şemadan belirlenir:

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

OpenClaw, Plugin yapılandırmasını Gateway yapılandırmasındaki Plugin girdisinden okur. Kaynak kodda veya dokümantasyon örneklerinde gizli bilgileri sabit kodlamayın; Plugin’in güvenlik modeline göre yapılandırma, ortam değişkenleri veya SecretRef’ler kullanın.

## Oluşturulan meta veriler

OpenClaw, Plugin çalışma zamanı kodunu içe aktarmadan önce Plugin manifestini okumalıdır. `defineToolPlugin` bunun için statik meta veriler sunar ve `openclaw plugins build` bunları pakete yazar. Plugin kimliği, adı, açıklaması, yapılandırma şeması, etkinleştirme ayarları veya araç adları değiştirildikten sonra oluşturucuyu yeniden çalıştırın:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Tek araçlı bir Plugin için oluşturulan manifest:

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

`contracts.tools` önemli keşif sözleşmesidir: kurulu tüm Plugin’lerin çalışma zamanını yüklemeden her aracın hangi Plugin’e ait olduğunu OpenClaw’a bildirir. Güncelliğini yitirmiş bir manifest, bir aracın keşifte görünmemesine veya bir kayıt hatasının yanlış Plugin’e yüklenmesine neden olabilir.

## Paket meta verileri

`openclaw plugins build`, `package.json` dosyasını da seçilen çalışma zamanı giriş noktasıyla hizalar:

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

TypeScript kaynak giriş noktasını değil, derlenmiş JavaScript’i (`./dist/index.js`) dağıtın. Kaynak giriş noktaları yalnızca çalışma alanına özgü yerel geliştirmede çalışır.

## CI’da doğrulama

Oluşturulan meta veriler güncel olmadığında `plugins build --check`, dosyaları yeniden yazmadan başarısız olur:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` şunları denetler:

- `openclaw.plugin.json` dosyasının var olması ve normal manifest yükleyiciden geçmesi.
- Geçerli giriş noktasının `defineToolPlugin` meta verilerini dışa aktarması.
- Oluşturulan manifest alanlarının giriş noktası meta verileriyle eşleşmesi.
- `contracts.tools` değerinin bildirilen araç adlarıyla eşleşmesi.
- `package.json` içindeki `openclaw.extensions` değerinin seçilen çalışma zamanı giriş noktasını göstermesi.

## Yerel olarak kurma ve inceleme

Ayrı bir OpenClaw çalışma kopyasından veya kurulu CLI’dan paket yolunu kurun:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Paketlenmiş bir duman testi için önce paketi oluşturun ve tarball dosyasını kurun:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Kurulumdan sonra Gateway’i yeniden başlatın veya yeniden yükleyin ve ajandan aracı kullanmasını isteyin. Araç görünmüyorsa kodu değiştirmeden önce Plugin çalışma zamanını ve geçerli araç kataloğunu inceleyin (bkz. [Sorun giderme](#troubleshooting)).

## Yayımlama

Paket hazır olduğunda ClawHub üzerinden yayımlayın. `clawhub package publish` bir kaynak kabul eder: yerel klasör, GitHub deposu (`owner/repo[@ref]`) veya tarball URL’si.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Açık bir ClawHub konum belirleyicisiyle kurun:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Çıplak npm paket tanımları, geçiş dönemi boyunca npm’den kurulmaya devam eder; ancak OpenClaw Plugin’leri için tercih edilen keşif ve dağıtım yüzeyi ClawHub’dır. Sahip kapsamı ve sürüm incelemesi için [ClawHub’da yayımlama](/tr/clawhub/publishing) bölümüne bakın.

## Sorun giderme

### `plugin entry not found: ./dist/index.js`

Seçilen giriş dosyası mevcut değil. `npm run build` komutunu çalıştırın, ardından `openclaw plugins build --entry ./dist/index.js` veya `openclaw plugins validate --entry ./dist/index.js` komutunu yeniden çalıştırın.

### `plugin entry does not expose defineToolPlugin metadata`

Giriş noktası, `defineToolPlugin` tarafından oluşturulan bir değeri dışa aktarmadı. Modülün varsayılan dışa aktarımının `defineToolPlugin(...)` sonucu olduğunu doğrulayın veya `--entry` ile doğru giriş noktasını belirtin.

### `openclaw.plugin.json generated metadata is stale`

Manifest artık giriş noktası meta verileriyle eşleşmiyor. Şunları çalıştırın:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Hem `openclaw.plugin.json` hem de `package.json` değişikliklerini kaydedin.

### `package.json openclaw.extensions must include ./dist/index.js`

Paket meta verileri farklı bir çalışma zamanı giriş noktasını gösteriyor. Oluşturucunun paket meta verilerini dağıtmayı amaçladığınız giriş noktasıyla hizalaması için `openclaw plugins build --entry ./dist/index.js` komutunu çalıştırın.

### `Cannot find package 'typebox'`

Derlenmiş Plugin, çalışma zamanında `typebox` paketini içe aktarır. Paketi `dependencies` içinde tutun; bağımlılıkları yeniden kurun, yeniden derleyin ve doğrulamayı yeniden çalıştırın.

### Araç kurulumdan sonra görünmüyor

Şunları sırayla denetleyin:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json`, beklenen araç adlarını içeren `contracts.tools` alanına sahiptir.
4. `package.json`, `openclaw.extensions: ["./dist/index.js"]` alanına sahiptir.
5. Plugin yüklendikten sonra Gateway yeniden başlatıldı veya yeniden yüklendi.

## Ayrıca bakınız

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin manifesti](/tr/plugins/manifest)
- [Plugin CLI'si](/tr/cli/plugins)
- [ClawHub'da yayımlama](/tr/clawhub/publishing)
