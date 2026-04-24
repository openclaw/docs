---
read_when:
    - definePluginEntry veya defineChannelPluginEntry için tam tür imzasına ihtiyacınız var
    - Kayıt modunu anlamak istiyorsunuz (tam, kurulum, CLI meta verisi)
    - Giriş noktası seçeneklerini arıyorsunuz
sidebarTitle: Entry Points
summary: definePluginEntry, defineChannelPluginEntry ve defineSetupPluginEntry için başvuru
title: Plugin giriş noktaları
x-i18n:
    generated_at: "2026-04-24T09:22:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Her Plugin varsayılan bir giriş nesnesi dışa aktarır. SDK, bunları
oluşturmak için üç yardımcı sağlar.

Kurulu Plugins'ler için `package.json`, çalışma zamanı yüklemesini mümkün olduğunda
derlenmiş JavaScript'e yönlendirmelidir:

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

`extensions` ve `setupEntry`, çalışma alanı ve git
checkout geliştirmesi için geçerli kaynak girdileri olmaya devam eder. `runtimeExtensions` ve `runtimeSetupEntry`,
OpenClaw kurulu bir paketi yüklediğinde tercih edilir ve npm paketlerinin çalışma zamanında
TypeScript derlemesinden kaçınmasını sağlar. Kurulu bir paket yalnızca TypeScript
kaynak girişi bildiriyorsa OpenClaw, varsa eşleşen bir derlenmiş `dist/*.js`
eşini kullanır, ardından TypeScript kaynağına geri düşer.

Tüm giriş yolları Plugin paket dizini içinde kalmalıdır. Çalışma zamanı girdileri
ve çıkarılan derlenmiş JavaScript eşleri, paket dışına kaçan bir `extensions` veya
`setupEntry` kaynak yolunu geçerli hâle getirmez.

<Tip>
  **Adım adım bir anlatım mı arıyorsunuz?** [Kanal Plugins'leri](/tr/plugins/sdk-channel-plugins)
  veya [Sağlayıcı Plugins'leri](/tr/plugins/sdk-provider-plugins) sayfalarına bakın.
</Tip>

## `definePluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/plugin-entry`

Sağlayıcı Plugins'leri, araç Plugins'leri, hook Plugins'leri ve
mesajlaşma kanalı **olmayan** her şey için.

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

| Alan           | Tür                                                              | Gerekli | Varsayılan          |
| -------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`           | `string`                                                         | Evet    | —                   |
| `name`         | `string`                                                         | Evet    | —                   |
| `description`  | `string`                                                         | Evet    | —                   |
| `kind`         | `string`                                                         | Hayır   | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Evet    | —                   |

- `id`, `openclaw.plugin.json` manifest'inizle eşleşmelidir.
- `kind`, özel yuvalar içindir: `"memory"` veya `"context-engine"`.
- `configSchema`, tembel değerlendirme için bir fonksiyon olabilir.
- OpenClaw bu şemayı ilk erişimde çözümler ve memoize eder, böylece pahalı şema
  oluşturucular yalnızca bir kez çalışır.

## `defineChannelPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` yardımcı fonksiyonunu kanala özgü bağlantılarla sarar. Otomatik olarak
`api.registerChannel({ plugin })` çağırır, isteğe bağlı kök-help CLI meta veri
seam'ini açığa çıkarır ve `registerFull` fonksiyonunu kayıt moduna göre geçitler.

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

| Alan                  | Tür                                                              | Gerekli | Varsayılan          |
| --------------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`                  | `string`                                                         | Evet    | —                   |
| `name`                | `string`                                                         | Evet    | —                   |
| `description`         | `string`                                                         | Evet    | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Evet    | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Hayır   | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Hayır   | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Hayır   | —                   |

- `setRuntime`, çalışma zamanı referansını saklayabilmeniz için kayıt sırasında çağrılır
  (tipik olarak `createPluginRuntimeStore` yoluyla). CLI meta veri
  yakalaması sırasında atlanır.
- `registerCliMetadata`, hem `api.registrationMode === "cli-metadata"`
  hem de `api.registrationMode === "full"` sırasında çalışır.
  Kök yardımın etkinleştirme yapmaması, ama normal CLI komut kaydının yine tam Plugin yüklemeleri ile uyumlu kalması için
  bunu kanala ait CLI tanımlayıcıları için kanonik yer olarak kullanın.
- `registerFull`, yalnızca `api.registrationMode === "full"` olduğunda çalışır. `setup-only`
  yükleme sırasında atlanır.
- `definePluginEntry` gibi `configSchema` da tembel bir fabrika olabilir ve OpenClaw
  çözümlenen şemayı ilk erişimde memoize eder.
- Plugin'e ait kök CLI komutları için, komutun kök CLI ayrıştırma ağacından kaybolmadan
  tembel yüklenmesini istiyorsanız `api.registerCli(..., { descriptors: [...] })`
  tercih edin. Kanal Plugins'lerinde bu tanımlayıcıları
  `registerCliMetadata(...)` içinden kaydetmeyi tercih edin ve `registerFull(...)` fonksiyonunu çalışma zamanına özgü işlere odaklayın.
- `registerFull(...)` ayrıca gateway RPC yöntemleri de kaydediyorsa bunları
  Plugin'e özgü bir önek altında tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) her zaman
  `operator.admin` düzeyine zorlanır.

## `defineSetupPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Hafif `setup-entry.ts` dosyası için. Çalışma zamanı veya CLI bağlantısı olmadan yalnızca
`{ plugin }` döndürür.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bir kanal devre dışıyken,
yapılandırılmamışken veya ertelenmiş yükleme etkin olduğunda OpenClaw tam giriş yerine bunu yükler. Bunun ne zaman önemli olduğu için
[Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry) bölümüne bakın.

Pratikte, `defineSetupPluginEntry(...)` fonksiyonunu dar kurulum yardımcı
aileleriyle eşleştirin:

- import-safe kurulum yama bağdaştırıcıları, lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilen kurulum proxy'leri
  gibi çalışma zamanı açısından güvenli kurulum yardımcıları için `openclaw/plugin-sdk/setup-runtime`
- isteğe bağlı kurulum yüzeyleri için `openclaw/plugin-sdk/channel-setup`
- kurulum/yükleme CLI/arşiv/belge yardımcıları için `openclaw/plugin-sdk/setup-tools`

Ağır SDK'ları, CLI kaydını ve uzun ömürlü çalışma zamanı servislerini tam
giriş içinde tutun.

Kurulum ve çalışma zamanı yüzeylerini ayıran paketlenmiş çalışma alanı kanalları, bunun yerine
`openclaw/plugin-sdk/channel-entry-contract` içinden
`defineBundledChannelSetupEntry(...)` kullanabilir. Bu sözleşme,
kurulum girdisinin kurulum için güvenli Plugin/gizli bilgi dışa aktarımlarını korurken yine de bir
çalışma zamanı setter'ı açığa çıkarmasını sağlar:

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
});
```

Bu paketlenmiş sözleşmeyi yalnızca kurulum akışları gerçekten tam kanal girişi yüklenmeden önce hafif bir çalışma zamanı setter'ına ihtiyaç duyuyorsa kullanın.

## Kayıt modu

`api.registrationMode`, Plugin'inize nasıl yüklendiğini söyler:

| Mod               | Ne zaman                          | Ne kaydedilmeli                                                                       |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| `"full"`          | Normal gateway başlangıcı         | Her şey                                                                               |
| `"setup-only"`    | Devre dışı/yapılandırılmamış kanal| Yalnızca kanal kaydı                                                                  |
| `"setup-runtime"` | Çalışma zamanı mevcut kurulum akışı | Tam giriş yüklenmeden önce gereken kanal kaydı artı yalnızca hafif çalışma zamanı |
| `"cli-metadata"`  | Kök yardım / CLI meta veri yakalama | Yalnızca CLI tanımlayıcıları                                                       |

`defineChannelPluginEntry`, bu ayrımı otomatik yönetir. Bir kanal için doğrudan
`definePluginEntry` kullanırsanız modu kendiniz kontrol edin:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Ağır yalnızca çalışma zamanı kayıtları
  api.registerService(/* ... */);
}
```

`"setup-runtime"` modunu, tam paketlenmiş kanal çalışma zamanına yeniden girmeden
kuruluma özgü başlangıç yüzeylerinin var olması gereken pencere olarak değerlendirin. Bunun için iyi örnekler
kanal kaydı, kuruluma güvenli HTTP rotaları, kuruluma güvenli gateway yöntemleri ve
devredilmiş kurulum yardımcılarıdır. Ağır arka plan servisleri, CLI kaydedicileri
ve sağlayıcı/istemci SDK önyüklemeleri yine `"full"` içine aittir.

Özellikle CLI kaydedicileri için:

- kaydedici bir veya daha fazla kök komutu sahipleniyorsa ve OpenClaw'ın gerçek CLI modülünü ilk çağrıda
  tembel yüklemesini istiyorsanız `descriptors` kullanın
- bu tanımlayıcıların kaydedicinin açığa çıkardığı her üst düzey komut kökünü kapsadığından emin olun
- yalnızca eager uyumluluk yolları için `commands` kullanın

## Plugin şekilleri

OpenClaw, yüklenen Plugins'leri kayıt davranışlarına göre sınıflandırır:

| Şekil                 | Açıklama                                           |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Tek bir yetenek türü (örn. yalnızca sağlayıcı)     |
| **hybrid-capability** | Birden çok yetenek türü (örn. sağlayıcı + konuşma) |
| **hook-only**         | Yalnızca hook'lar, yetenek yok                     |
| **non-capability**    | Araçlar/komutlar/servisler var ama yetenek yok     |

Bir Plugin'in şeklini görmek için `openclaw plugins inspect <id>` kullanın.

## İlgili

- [SDK Genel Bakışı](/tr/plugins/sdk-overview) — kayıt API'si ve alt yol başvurusu
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime) — `api.runtime` ve `createPluginRuntimeStore`
- [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup) — manifest, setup entry, ertelenmiş yükleme
- [Kanal Plugins'leri](/tr/plugins/sdk-channel-plugins) — `ChannelPlugin` nesnesini oluşturma
- [Sağlayıcı Plugins'leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı kaydı ve hook'lar
