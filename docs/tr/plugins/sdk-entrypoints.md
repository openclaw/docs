---
read_when:
    - defineToolPlugin, definePluginEntry veya defineChannelPluginEntry için tam tür imzasına ihtiyacınız var
    - Kayıt modunu anlamak istiyorsunuz (tam vs kurulum vs CLI metadata)
    - Giriş noktası seçeneklerini inceliyorsunuz
sidebarTitle: Entry Points
summary: defineToolPlugin, definePluginEntry, defineChannelPluginEntry ve defineSetupPluginEntry için başvuru
title: Plugin giriş noktaları
x-i18n:
    generated_at: "2026-06-28T01:04:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Her plugin varsayılan bir giriş nesnesi dışa aktarır. SDK, bunları
oluşturmak için yardımcılar sağlar.

Kurulu plugin'ler için, mevcut olduğunda `package.json` çalışma zamanı
yüklemesini derlenmiş JavaScript'e yönlendirmelidir:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` ve `setupEntry`, çalışma alanı ve git checkout geliştirmesi için
geçerli kaynak girişleri olarak kalır. OpenClaw kurulu bir paketi yüklediğinde
`runtimeExtensions` ve `runtimeSetupEntry` tercih edilir ve npm paketlerinin
çalışma zamanında TypeScript derlemesinden kaçınmasını sağlar. Açık çalışma
zamanı girişleri zorunludur: `runtimeSetupEntry`, `setupEntry` gerektirir ve
eksik `runtimeExtensions` veya `runtimeSetupEntry` yapıtları, sessizce kaynağa
geri dönmek yerine kurulumun/keşfin başarısız olmasına neden olur. Kurulu bir
paket yalnızca TypeScript kaynak girişi bildirirse, OpenClaw var olduğunda
eşleşen derlenmiş `dist/*.js` eşini kullanır, ardından TypeScript kaynağına geri
döner.

Tüm giriş yolları plugin paket dizininin içinde kalmalıdır. Çalışma zamanı
girişleri ve çıkarımlanan derlenmiş JavaScript eşleri, dışarı kaçan bir
`extensions` veya `setupEntry` kaynak yolunu geçerli yapmaz.

<Tip>
  **Bir kılavuz mu arıyorsunuz?** Adım adım kılavuzlar için [Araç Plugin'leri](/tr/plugins/tool-plugins),
  [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) veya
  [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) sayfalarına bakın.
</Tip>

## `defineToolPlugin`

**İçe aktarma:** `openclaw/plugin-sdk/tool-plugin`

Yalnızca agent araçları ekleyen basit plugin'ler içindir. `defineToolPlugin`,
yazım kaynağını küçük tutar, config ve araç parametre türlerini TypeBox
şemalarından çıkarır, düz dönüş değerlerini OpenClaw araç-sonucu biçimine sarar
ve `openclaw plugins build` komutunun plugin manifestine yazdığı statik
metadata'yı açığa çıkarır.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` isteğe bağlıdır. Atlandığında, OpenClaw katı bir boş nesne
  şeması kullanır ve oluşturulan manifest yine de `configSchema` içerir.
- `execute`, düz bir string veya JSON olarak serileştirilebilir bir değer döndürür. Yardımcı,
  bunu `details` ile bir metin araç sonucu olarak sarar.
- Araç adları statiktir. `openclaw plugins build`, `contracts.tools` değerini
  bildirilen araçlardan türetir; bu yüzden yazarlar adları elle yinelemez.
- Çalışma zamanı yüklemesi katı kalır. Kurulu plugin'ler hâlâ
  `openclaw.plugin.json` ve `package.json` içindeki `openclaw.extensions` alanına
  ihtiyaç duyar; OpenClaw eksik manifest verilerini çıkarmak için plugin kodunu
  çalıştırmaz.

## `definePluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/plugin-entry`

Sağlayıcı plugin'leri, gelişmiş araç plugin'leri, hook plugin'leri ve mesajlaşma
kanalı **olmayan** her şey için.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Alan           | Tür                                                              | Zorunlu | Varsayılan          |
| -------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`           | `string`                                                         | Evet    | -                   |
| `name`         | `string`                                                         | Evet    | -                   |
| `description`  | `string`                                                         | Evet    | -                   |
| `kind`         | `string`                                                         | Hayır   | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Evet    | -                   |

- `id`, `openclaw.plugin.json` manifestinizle eşleşmelidir.
- `kind`, özel slotlar içindir: `"memory"` veya `"context-engine"`.
- `configSchema`, tembel değerlendirme için bir fonksiyon olabilir.
- OpenClaw bu şemayı ilk erişimde çözer ve memoize eder; böylece pahalı şema
  oluşturucuları yalnızca bir kez çalışır.

## `defineChannelPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` öğesini kanala özgü bağlantılarla sarar. Otomatik olarak
`api.registerChannel({ plugin })` çağırır, isteğe bağlı bir kök-yardım CLI
metadata seam'i açığa çıkarır ve `registerFull` çağrısını kayıt moduna göre
sınırlar.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Alan                  | Tür                                                              | Zorunlu | Varsayılan          |
| --------------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`                  | `string`                                                         | Evet    | -                   |
| `name`                | `string`                                                         | Evet    | -                   |
| `description`         | `string`                                                         | Evet    | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Evet    | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Hayır   | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Hayır   | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Hayır   | -                   |

- `setRuntime`, çalışma zamanı referansını saklayabilmeniz için kayıt sırasında
  çağrılır (genellikle `createPluginRuntimeStore` ile). CLI metadata yakalama
  sırasında atlanır.
- `registerCliMetadata`, `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` ve
  `api.registrationMode === "full"` sırasında çalışır.
  Bunu kanalın sahip olduğu CLI tanımlayıcıları için kanonik yer olarak kullanın;
  böylece kök yardım etkinleştirme yapmadan kalır, keşif snapshot'ları statik
  komut metadata'sını içerir ve normal CLI komut kaydı tam plugin yüklemeleriyle
  uyumlu kalır.
- Keşif kaydı etkinleştirme yapmaz, ancak içe aktarmasız değildir. OpenClaw
  snapshot'ı oluşturmak için güvenilir plugin girişini ve kanal plugin modülünü
  değerlendirebilir; bu nedenle üst düzey içe aktarmaları yan etkisiz tutun ve
  soketleri, istemcileri, worker'ları ve hizmetleri yalnızca `"full"` yollarının
  arkasına koyun.
- `registerFull` yalnızca `api.registrationMode === "full"` olduğunda çalışır.
  Yalnızca kurulum yüklemesi sırasında atlanır.
- `definePluginEntry` gibi, `configSchema` tembel bir factory olabilir ve
  OpenClaw çözümlenen şemayı ilk erişimde memoize eder.
- Plugin'in sahip olduğu kök CLI komutları için, komutun kök CLI parse ağacından
  kaybolmadan tembel yüklenmiş kalmasını istediğinizde
  `api.registerCli(..., { descriptors: [...] })` tercih edin. Eşleştirilmiş düğüm
  özellik komutları için, komutun `openclaw nodes` altına gelmesi amacıyla
  `api.registerNodeCliFeature(...)` tercih edin. Diğer iç içe plugin komutları
  için `parentPath` ekleyin ve komutları registrar'a geçirilen `program` nesnesi
  üzerinde kaydedin; OpenClaw bunu plugin'i çağırmadan önce üst komuta çözer.
  Kanal plugin'leri için, bu tanımlayıcıları `registerCliMetadata(...)` içinden
  kaydetmeyi tercih edin ve `registerFull(...)` öğesini yalnızca çalışma zamanı
  işlerine odaklı tutun.
- `registerFull(...)` ayrıca Gateway RPC yöntemleri kaydediyorsa, bunları
  plugin'e özgü bir prefix üzerinde tutun. Ayrılmış çekirdek yönetim namespace'leri
  (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman
  `operator.admin` değerine zorlanır.

## `defineSetupPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Hafif `setup-entry.ts` dosyası içindir. Çalışma zamanı veya CLI bağlantısı
olmadan yalnızca `{ plugin }` döndürür.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw, bir kanal devre dışı, yapılandırılmamış olduğunda veya ertelenmiş
yükleme etkinleştirildiğinde tam giriş yerine bunu yükler. Bunun ne zaman önemli
olduğunu görmek için [Kurulum ve Config](/tr/plugins/sdk-setup#setup-entry)
sayfasına bakın.

Pratikte, `defineSetupPluginEntry(...)` ile dar kurulum yardımcısı ailelerini
eşleştirin:

- `createSetupTranslator`, içe aktarma güvenli kurulum patch adapter'ları,
  lookup-note çıktısı, `promptResolvedAllowFrom`, `splitSetupEntries` ve
  devredilen kurulum proxy'leri gibi çalışma zamanı açısından güvenli kurulum
  yardımcıları için `openclaw/plugin-sdk/setup-runtime`
- isteğe bağlı kurulum yüzeyleri için `openclaw/plugin-sdk/channel-setup`
- kurulum/yükleme CLI/arşiv/dokümantasyon yardımcıları için `openclaw/plugin-sdk/setup-tools`

Ağır SDK'leri, CLI kaydını ve uzun ömürlü çalışma zamanı hizmetlerini tam
girişte tutun.

Kurulum ve çalışma zamanı yüzeylerini ayıran bundled çalışma alanı kanalları
bunun yerine `openclaw/plugin-sdk/channel-entry-contract` içinden
`defineBundledChannelSetupEntry(...)` kullanabilir. Bu contract, kurulum
girişinin kurulum açısından güvenli plugin/secrets dışa aktarımlarını korurken
yine de bir çalışma zamanı setter'ı açığa çıkarmasına izin verir:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

Bu bundled contract'ı yalnızca kurulum akışlarının tam kanal girişi yüklenmeden
önce gerçekten hafif bir çalışma zamanı setter'ına veya kurulum açısından güvenli
Gateway yüzeyine ihtiyaç duyduğu durumlarda kullanın. `registerSetupRuntime`
yalnızca `"setup-runtime"` yüklemeleri için çalışır; bunu yalnızca config
yollarıyla veya ertelenmiş tam etkinleştirmeden önce var olması gereken
yöntemlerle sınırlı tutun.

## Kayıt modu

`api.registrationMode`, plugin'inizin nasıl yüklendiğini bildirir:

| Mod              | Ne zaman                          | Ne kaydedilmeli                                                                                                              |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normal Gateway başlatması            | Her şey                                                                                                              |
| `"discovery"`     | Salt okunur yetenek keşfi    | Kanal kaydı artı statik CLI tanımlayıcıları; giriş kodu yüklenebilir, ancak soketleri, worker'ları, istemcileri ve servisleri atlayın |
| `"setup-only"`    | Devre dışı/yapılandırılmamış kanal     | Yalnızca kanal kaydı                                                                                               |
| `"setup-runtime"` | Çalışma zamanı kullanılabilirken kurulum akışı | Kanal kaydı artı yalnızca tam giriş yüklenmeden önce gereken hafif çalışma zamanı                               |
| `"cli-metadata"`  | Kök yardım / CLI metadata yakalama  | Yalnızca CLI tanımlayıcıları                                                                                                    |

`defineChannelPluginEntry` bu ayrımı otomatik olarak yönetir. Bir kanal için
doğrudan `definePluginEntry` kullanıyorsanız modu kendiniz denetleyin:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Keşif modu, etkinleştirmeyen bir kayıt defteri anlık görüntüsü oluşturur. OpenClaw'ın kanal
yeteneklerini ve statik CLI tanımlayıcılarını kaydedebilmesi için yine de
Plugin girişini ve kanal Plugin nesnesini değerlendirebilir. Keşif sırasında modül değerlendirmesini
güvenilir ancak hafif kabul edin: üst düzeyde ağ istemcileri, alt süreçler, dinleyiciler, veritabanı
bağlantıları, arka plan worker'ları, kimlik bilgisi okumaları veya başka canlı çalışma zamanı yan
etkileri olmamalıdır.

`"setup-runtime"` değerini, kurulumla sınırlı başlatma yüzeylerinin tam paketlenmiş kanal
çalışma zamanına yeniden girmeden var olması gereken pencere olarak ele alın. Uygun seçenekler
kanal kaydı, kurulum açısından güvenli HTTP rotaları, kurulum açısından güvenli Gateway yöntemleri ve
devredilmiş kurulum yardımcılarıdır. Ağır arka plan servisleri, CLI kaydedicileri ve
sağlayıcı/istemci SDK başlatmaları yine `"full"` içinde yer almalıdır.

Özellikle CLI kaydedicileri için:

- kaydedici bir veya daha fazla kök komuta sahipse ve OpenClaw'ın gerçek CLI modülünü ilk çağrıda tembel yüklemesini
  istiyorsanız `descriptors` kullanın
- bu tanımlayıcıların kaydedici tarafından sunulan her üst düzey komut kökünü kapsadığından emin olun
- tanımlayıcı komut adlarını harfler, rakamlar, kısa çizgi ve alt çizgiyle sınırlı tutun;
  bir harf veya rakamla başlamalıdırlar; OpenClaw bu biçimin dışındaki tanımlayıcı adlarını reddeder
  ve yardımı işlemeden önce açıklamalardan terminal denetim dizilerini çıkarır
- yalnızca istekli uyumluluk yolları için tek başına `commands` kullanın

## Plugin biçimleri

OpenClaw, yüklenen Plugin'leri kayıt davranışlarına göre sınıflandırır:

| Biçim                 | Açıklama                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Tek yetenek türü (örn. yalnızca sağlayıcı)           |
| **hybrid-capability** | Birden çok yetenek türü (örn. sağlayıcı + konuşma) |
| **hook-only**         | Yalnızca hook'lar, yetenek yok                        |
| **non-capability**    | Araçlar/komutlar/servisler, ancak yetenek yok        |

Bir Plugin'in biçimini görmek için `openclaw plugins inspect <id>` kullanın.

## İlgili

- [SDK Genel Bakışı](/tr/plugins/sdk-overview) - kayıt API'si ve alt yol başvurusu
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime) - `api.runtime` ve `createPluginRuntimeStore`
- [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup) - manifest, kurulum girişi, ertelenmiş yükleme
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) - `ChannelPlugin` nesnesini oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) - sağlayıcı kaydı ve hook'lar
