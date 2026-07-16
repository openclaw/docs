---
read_when:
    - Yalnızca ajan araçları ekleyen basit bir OpenClaw plugin'i oluşturmak istiyorsunuz
    - Plugin manifest meta verilerini elle yazmak yerine defineToolPlugin kullanmak istiyorsunuz
    - Yalnızca araç içeren bir plugin için iskelet oluşturmanız, kod üretmeniz, doğrulama yapmanız, test etmeniz veya yayımlamanız gerekiyor
sidebarTitle: Tool Plugins
summary: defineToolPlugin ve openclaw plugins init/build/validate ile basit tür güvenli ajan araçları oluşturun
title: Araç pluginleri
x-i18n:
    generated_at: "2026-07-16T17:50:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` yalnızca aracı tarafından çağrılabilen araçlar ekleyen bir plugin oluşturur: kanal,
model sağlayıcısı, hook, hizmet veya kurulum arka ucu içermez. OpenClaw'ın plugin
çalışma zamanı kodunu yüklemeden araçları keşfetmesi için gereken manifest meta verilerini
oluşturur.

Sağlayıcı, kanal, hook, hizmet veya karma yetenekli pluginler için bunun yerine
[Plugin oluşturma](/tr/plugins/building-plugins), [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins)
veya [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins) ile başlayın.

## Gereksinimler

- Node 22.22.3+, Node 24.15+ veya Node 25.9+.
- TypeScript ESM paket çıktısı.
- `typebox`, `dependencies` içinde olmalıdır (yalnızca `devDependencies` içinde değil; oluşturulan
  plugin bunu çalışma zamanında içe aktarır).
- `openclaw >=2026.5.17`, `openclaw/plugin-sdk/tool-plugin` dışa aktaran ilk sürüm.
- `dist/`, `openclaw.plugin.json` ve
  `package.json` ile dağıtılan bir paket kökü.

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
| `src/index.ts`         | Bir `echo` aracı içeren `defineToolPlugin` girişi                 |
| `src/index.test.ts`    | Araç listesini doğrulayan meta veri testi                          |
| `tsconfig.json`        | `dist/` için NodeNext TypeScript çıktısı                           |
| `vitest.config.ts`     | `src/**/*.test.ts` için Vitest yapılandırması                      |
| `package.json`         | Betikler, çalışma zamanı bağımlılıkları, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | İlk araç için oluşturulan manifest meta verileri                   |

`npm run plugin:build`, `npm run build` (tsc) komutunu, ardından
`openclaw plugins build --entry ./dist/index.js` komutunu çalıştırır. `npm run plugin:validate`
yeniden derler ve `openclaw plugins validate --entry ./dist/index.js` komutunu çalıştırır.
Başarılı doğrulama şunu yazdırır:

```text
Plugin stock-quotes geçerli.
```

`openclaw plugins init <id>` seçenekleri:

| Bayrak               | Varsayılan         | Etki                                   |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Çıktı dizini                           |
| `--name <name>`      | Başlık biçiminde `<id>` | Görünen ad                             |
| `--type <type>`      | `tool`             | İskelet türü: `tool` veya `provider`  |
| `--force`            | kapalı             | Mevcut bir çıktı dizininin üzerine yaz |

## Bir araç yazma

`defineToolPlugin`; plugin kimliğini, isteğe bağlı bir yapılandırma şemasını ve
statik bir araç listesini alır. Parametre ve yapılandırma türleri
TypeBox şemalarından çıkarılır.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Hisse Senedi Fiyatları",
  description: "Hisse senedi fiyat anlık görüntülerini getirir.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Fiyat API anahtarı." })),
    baseUrl: Type.Optional(Type.String({ description: "Fiyat API temel URL'si." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Hisse Senedi Fiyatı",
      description: "Bir hisse senedi fiyatı anlık görüntüsü getirir.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Borsa sembolü, örneğin OPEN." }),
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

Araç adları kararlı API'dir. Benzersiz, küçük harfli ve
çekirdek araçlarla veya diğer pluginlerle çakışmayı önleyecek kadar belirgin adlar seçin.

## İsteğe bağlı araçlar ve fabrika araçları

Kullanıcıların araç bir modele gönderilmeden önce onu açıkça izin verilenler listesine
eklemesi gerekiyorsa `optional: true` değerini ayarlayın. `openclaw plugins build`, eşleşen
`toolMetadata.<tool>.optional` manifest girdisini yazar; böylece OpenClaw, plugin çalışma zamanı
kodunu yüklemeden aracın isteğe bağlı olduğunu görebilir.

```typescript
tool({
  name: "workflow_run",
  description: "Harici bir iş akışı çalıştırır.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Bir aracın oluşturulabilmesi için önce çalışma zamanı araç bağlamına ihtiyaç duyulduğunda
`factory` kullanın; belirli bir çalıştırma için devre dışı bırakmak, sandbox durumunu
incelemek veya çalışma zamanı yardımcılarını bağlamak buna örnektir. Somut araç çalışma
zamanında oluşturulsa da meta veriler statik kalır.

```typescript
tool({
  name: "local_workflow",
  description: "Sandbox oturumları dışında yerel bir iş akışı çalıştırır.",
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

Fabrikalar yine de sabit bir araç adını baştan bildirir. Plugin araç adlarını dinamik olarak
hesapladığında veya araçları hook'lar, hizmetler, sağlayıcılar ya da komutlarla birleştirdiğinde
doğrudan `definePluginEntry` kullanın.

## Dönüş değerleri

`defineToolPlugin`, düz dönüş değerlerini OpenClaw araç sonucu
biçimine sarar:

- Modelin tam olarak bu metni görmesi gerektiğinde bir dize döndürün.
- Modelin biçimlendirilmiş JSON görmesini ve OpenClaw'ın özgün değeri
  `details` içinde tutmasını istediğinizde JSON uyumlu bir değer döndürün.

```typescript
tool({
  name: "echo_text",
  description: "Girdi metnini yineler.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Girdiyi yapılandırılmış JSON olarak yineler.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Özel bir `AgentToolResult` gerektiğinde veya mevcut bir
`api.registerTool` uygulamasını yeniden kullanmak istediğinizde fabrika aracı kullanın.

## Yapılandırma

`configSchema` isteğe bağlıdır. Bunu atladığınızda OpenClaw katı bir boş nesne
şeması uygular; oluşturulan manifest yine de `configSchema` içerir.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "Yapılandırmasız Araçlar",
  description: "Yapılandırma gerektirmeyen araçlar ekler.",
  tools: () => [],
});
```

Bir `configSchema` ile ikinci `execute` bağımsız değişkeninin türü bundan çıkarılır:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Yapılandırılmış Araçlar",
  description: "Yapılandırılmış araçlar ekler.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Yapılandırmanın kullanılabilir olup olmadığını denetler.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw, plugin yapılandırmasını Gateway yapılandırmasındaki plugin girdisinden okur. Kaynakta
veya belge örneklerinde gizli bilgileri sabit kodlamayın; pluginin güvenlik modeline göre
yapılandırma, ortam değişkenleri veya SecretRef'ler kullanın.

## Oluşturulan meta veriler

OpenClaw, plugin çalışma zamanı kodunu içe aktarmadan önce plugin manifestini okumalıdır.
`defineToolPlugin` bunun için statik meta verileri sunar ve
`openclaw plugins build` bunları pakete yazar. Plugin kimliğini, adını, açıklamasını,
yapılandırma şemasını, etkinleştirmeyi veya araç adlarını değiştirdikten sonra
oluşturucuyu yeniden çalıştırın:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Tek araçlı bir plugin için oluşturulan manifest:

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

`contracts.tools` önemli keşif sözleşmesidir: OpenClaw'a, kurulu her pluginin çalışma
zamanını yüklemeden her aracın hangi plugine ait olduğunu bildirir. Güncelliğini yitirmiş
bir manifest, aracın keşifte görünmemesine veya bir kayıt hatasının yanlış plugine
atfedilmesine neden olabilir.

## Paket meta verileri

`openclaw plugins build`, `package.json` değerini de seçilen çalışma zamanı
girdisiyle uyumlu hâle getirir:

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

TypeScript kaynak girdisini değil, derlenmiş JavaScript'i (`./dist/index.js`) dağıtın.
Kaynak girdileri yalnızca çalışma alanına özgü yerel geliştirmede çalışır.

## CI'da doğrulama

Oluşturulan meta veriler güncel değilse `plugins build --check` dosyaları yeniden yazmadan
başarısız olur:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` şunları denetler:

- `openclaw.plugin.json` mevcuttur ve normal manifest yükleyicisinden geçer.
- Geçerli girdi `defineToolPlugin` meta verilerini dışa aktarır.
- Oluşturulan manifest alanları girdi meta verileriyle eşleşir.
- `contracts.tools`, bildirilen araç adlarıyla eşleşir.
- `package.json`, `openclaw.extensions` değerini seçilen çalışma zamanı girdisine yönlendirir.

## Yerel olarak kurma ve inceleme

Ayrı bir OpenClaw çalışma kopyasından veya kurulu CLI'dan paket yolunu kurun:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Paketlenmiş bir hızlı test için önce paketi oluşturun ve tarball dosyasını kurun:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Kurulumdan sonra Gateway'i yeniden başlatın veya yeniden yükleyin ve aracıdan
aracı kullanmasını isteyin. Araç görünmüyorsa kodu değiştirmeden önce plugin çalışma
zamanını ve etkin araç kataloğunu inceleyin (bkz. [Sorun giderme](#troubleshooting)).

## Yayımlama

Paket hazır olduğunda ClawHub üzerinden yayımlayın. `clawhub package publish`
bir kaynak alır: yerel klasör, GitHub deposu (`owner/repo[@ref]`) veya
tarball URL'si.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Açık bir ClawHub konum belirleyicisiyle kurun:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Sade npm paket belirtimleri, lansman geçişi sırasında hâlâ npm'den kurulur; ancak
ClawHub, OpenClaw pluginleri için tercih edilen keşif ve dağıtım yüzeyidir.
Sahip kapsamı ve sürüm incelemesi için [ClawHub'da yayımlama](/tr/clawhub/publishing)
bölümüne bakın.

## Sorun giderme

### `plugin entry not found: ./dist/index.js`

Seçilen girdi dosyası mevcut değil. `npm run build` komutunu çalıştırın, ardından
`openclaw plugins build --entry ./dist/index.js` veya
`openclaw plugins validate --entry ./dist/index.js` komutunu yeniden çalıştırın.

### `plugin entry does not expose defineToolPlugin metadata`

Girdi, `defineToolPlugin` tarafından oluşturulan bir değeri dışa aktarmadı. Modülün
varsayılan dışa aktarımının `defineToolPlugin(...)` sonucu olduğunu doğrulayın veya
`--entry` ile doğru girdiyi geçirin.

### `openclaw.plugin.json generated metadata is stale`

Manifest artık girdi meta verileriyle eşleşmiyor. Şunları çalıştırın:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Hem `openclaw.plugin.json` hem de `package.json` değişikliklerini kaydedin.

### `package.json openclaw.extensions must include ./dist/index.js`

Paket meta verileri farklı bir çalışma zamanı girdisine işaret ediyor. Oluşturucunun
paket meta verilerini dağıtmayı amaçladığınız girdiyle uyumlu hâle getirmesi için
`openclaw plugins build --entry ./dist/index.js` komutunu çalıştırın.

### `Cannot find package 'typebox'`

Derlenmiş plugin, çalışma zamanında `typebox` öğesini içe aktarır. Bunu
`dependencies` içinde tutun; yeniden kurun, yeniden derleyin ve doğrulamayı
yeniden çalıştırın.

### Araç kurulumdan sonra görünmüyor

Şunları sırasıyla denetleyin:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json`, beklenen araç adlarıyla `contracts.tools` içeriyor.
4. `package.json`, `openclaw.extensions: ["./dist/index.js"]` içeriyor.
5. Plugin yüklendikten sonra Gateway yeniden başlatıldı veya yeniden yüklendi.

## Ayrıca bkz.

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin manifesti](/tr/plugins/manifest)
- [Plugin CLI](/tr/cli/plugins)
- [ClawHub'da yayımlama](/tr/clawhub/publishing)
