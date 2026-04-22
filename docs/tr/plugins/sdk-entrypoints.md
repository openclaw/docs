---
read_when:
    - definePluginEntry veya defineChannelPluginEntry için tam tür imzasına ihtiyacınız var
    - Kayıt modunu anlamak istiyorsunuz (tam, kurulum veya CLI meta verisi)
    - Giriş noktası seçeneklerini arıyorsunuz
sidebarTitle: Entry Points
summary: definePluginEntry, defineChannelPluginEntry ve defineSetupPluginEntry için başvuru
title: Plugin Giriş Noktaları
x-i18n:
    generated_at: "2026-04-22T04:24:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Plugin Giriş Noktaları

Her plugin varsayılan bir giriş nesnesi dışa aktarır. SDK bunları
oluşturmak için üç yardımcı sağlar.

Kurulu plugin'ler için `package.json`, çalışma zamanı yüklemesini mümkün olduğunda
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

`extensions` ve `setupEntry`, workspace ve git
checkout geliştirmesi için geçerli kaynak girişleri olmaya devam eder. Bir kurulu paketi OpenClaw yüklediğinde
`runtimeExtensions` ve `runtimeSetupEntry` tercih edilir ve npm paketlerinin çalışma zamanında
TypeScript derlemesinden kaçınmasını sağlar. Kurulu bir paket yalnızca bir TypeScript
kaynak girişi bildirirse OpenClaw, varsa eşleşen bir derlenmiş `dist/*.js`
eşini kullanır, ardından TypeScript kaynağına geri döner.

Tüm giriş yolları plugin paket dizini içinde kalmalıdır. Çalışma zamanı girişleri
ve çıkarımı yapılan derlenmiş JavaScript eşleri, paket dışına kaçan bir `extensions` veya
`setupEntry` kaynak yolunu geçerli yapmaz.

<Tip>
  **Adım adım bir kılavuz mu arıyorsunuz?** [Channel Plugins](/tr/plugins/sdk-channel-plugins)
  veya [Provider Plugins](/tr/plugins/sdk-provider-plugins) bölümlerine bakın.
</Tip>

## `definePluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/plugin-entry`

Sağlayıcı plugin'leri, araç plugin'leri, hook plugin'leri ve mesajlaşma kanalı
**olmayan** her şey için.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Kısa özet",
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
- `configSchema`, tembel değerlendirme için bir işlev olabilir.
- OpenClaw bu şemayı ilk erişimde çözer ve belleğe alır; böylece pahalı şema
  oluşturucular yalnızca bir kez çalışır.

## `defineChannelPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Kanala özgü bağlantılarla `definePluginEntry` yardımcı işlevini sarar. Otomatik olarak
`api.registerChannel({ plugin })` çağırır, isteğe bağlı bir kök-yardım CLI meta verisi arayüzü sunar
ve `registerFull` işlevini kayıt moduna göre geçitler.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Kısa özet",
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

- `setRuntime`, kayıt sırasında çağrılır; böylece çalışma zamanı başvurusunu saklayabilirsiniz
  (genellikle `createPluginRuntimeStore` aracılığıyla). CLI meta verisi
  yakalama sırasında atlanır.
- `registerCliMetadata`, hem `api.registrationMode === "cli-metadata"`
  hem de `api.registrationMode === "full"` sırasında çalışır.
  Bunu, kanala ait CLI tanımlayıcıları için kanonik yer olarak kullanın; böylece kök yardım
  etkinleştirme yapmadan kalır ve normal CLI komut kaydı tam plugin yükleriyle
  uyumlu olur.
- `registerFull`, yalnızca `api.registrationMode === "full"` olduğunda çalışır. `setup-only`
  yükleme sırasında atlanır.
- `definePluginEntry` gibi `configSchema` da tembel bir fabrika olabilir ve OpenClaw
  çözülen şemayı ilk erişimde belleğe alır.
- Plugin'e ait kök CLI komutları için, komutun kök CLI ayrıştırma ağacından
  kaybolmadan tembel yüklenmesini istiyorsanız `api.registerCli(..., { descriptors: [...] })`
  tercih edin. Kanal plugin'leri için bu tanımlayıcıları
  `registerCliMetadata(...)` içinden kaydetmeyi tercih edin ve `registerFull(...)` işlevini yalnızca çalışma zamanına özgü işlere odaklayın.
- Eğer `registerFull(...)` gateway RPC yöntemleri de kaydediyorsa, bunları
  plugin'e özgü bir önek üzerinde tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) her zaman
  `operator.admin` olarak zorlanır.

## `defineSetupPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Hafif `setup-entry.ts` dosyası için. Çalışma zamanı veya CLI bağlantısı olmadan yalnızca `{ plugin }`
döndürür.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bir kanal devre dışıysa,
yapılandırılmamışsa veya ertelenmiş yükleme etkinse OpenClaw tam giriş yerine bunu yükler. Bunun ne zaman önemli olduğu için
[Setup and Config](/tr/plugins/sdk-setup#setup-entry) bölümüne bakın.

Pratikte `defineSetupPluginEntry(...)` işlevini dar kurulum yardımcı
aileleriyle eşleştirin:

- `openclaw/plugin-sdk/setup-runtime`: içe aktarma açısından güvenli kurulum yama bağdaştırıcıları, lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş kurulum proxy'leri gibi
  çalışma zamanı açısından güvenli kurulum yardımcıları için
- isteğe bağlı kurulum yüzeyleri için `openclaw/plugin-sdk/channel-setup`
- kurulum/yükleme CLI/arşiv/belge yardımcıları için `openclaw/plugin-sdk/setup-tools`

Ağır SDK'ları, CLI kaydını ve uzun ömürlü çalışma zamanı hizmetlerini tam
girişte tutun.

Kurulum ve çalışma zamanı yüzeylerini ayıran paketlenmiş workspace kanalları bunun yerine
`openclaw/plugin-sdk/channel-entry-contract` içinden
`defineBundledChannelSetupEntry(...)` kullanabilir. Bu sözleşme,
kurulum girdisinin kurulum açısından güvenli plugin/gizli bilgi dışa aktarımlarını korurken
yine de bir çalışma zamanı ayarlayıcıyı göstermesine izin verir:

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

Bu paketlenmiş sözleşmeyi yalnızca kurulum akışlarının tam kanal girişi yüklenmeden önce
gerçekten hafif bir çalışma zamanı ayarlayıcıya ihtiyaç duyduğu durumlarda kullanın.

## Kayıt modu

`api.registrationMode`, plugin'inize nasıl yüklendiğini söyler:

| Mod               | Ne zaman                          | Ne kaydedilmeli                                                                          |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| `"full"`          | Normal gateway başlangıcı         | Her şey                                                                                  |
| `"setup-only"`    | Devre dışı/yapılandırılmamış kanal | Yalnızca kanal kaydı                                                                     |
| `"setup-runtime"` | Çalışma zamanı mevcutken kurulum  | Kanal kaydı artı tam giriş yüklenmeden önce gereken yalnızca hafif çalışma zamanı        |
| `"cli-metadata"`  | Kök yardım / CLI meta verisi yakalama | Yalnızca CLI tanımlayıcıları                                                         |

`defineChannelPluginEntry` bu ayrımı otomatik olarak ele alır. Bir kanal için doğrudan
`definePluginEntry` kullanırsanız modu kendiniz denetleyin:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Yalnızca çalışma zamanına özgü ağır kayıtlar
  api.registerService(/* ... */);
}
```

`"setup-runtime"` modunu, tam paketlenmiş kanal çalışma zamanına yeniden girmeden
kuruluma özgü başlangıç yüzeylerinin var olması gereken pencere olarak değerlendirin. Uygun kullanım alanları
kanal kaydı, kurulum açısından güvenli HTTP yolları, kurulum açısından güvenli gateway yöntemleri ve
devredilmiş kurulum yardımcılarıdır. Ağır arka plan hizmetleri, CLI kaydedicileri
ve sağlayıcı/istemci SDK başlatmaları yine `"full"` moduna aittir.

Özellikle CLI kaydedicileri için:

- kaydedici bir veya daha fazla kök komuta sahipse ve OpenClaw'un gerçek CLI modülünü ilk çağrıda tembel yüklemesini
  istiyorsanız `descriptors` kullanın
- bu tanımlayıcıların kaydedicinin açığa çıkardığı her üst düzey komut kökünü kapsadığından emin olun
- yalnızca hevesli uyumluluk yolları için `commands` alanını tek başına kullanın

## Plugin şekilleri

OpenClaw, yüklenen plugin'leri kayıt davranışlarına göre sınıflandırır:

| Şekil                | Açıklama                                           |
| -------------------- | -------------------------------------------------- |
| **plain-capability**  | Tek yetenek türü (ör. yalnızca sağlayıcı)         |
| **hybrid-capability** | Birden fazla yetenek türü (ör. sağlayıcı + konuşma) |
| **hook-only**         | Yalnızca hook'lar, yetenek yok                    |
| **non-capability**    | Araçlar/komutlar/hizmetler var ama yetenek yok    |

Bir plugin'in şeklini görmek için `openclaw plugins inspect <id>` kullanın.

## İlgili

- [SDK Overview](/tr/plugins/sdk-overview) — kayıt API'si ve alt yol başvurusu
- [Runtime Helpers](/tr/plugins/sdk-runtime) — `api.runtime` ve `createPluginRuntimeStore`
- [Setup and Config](/tr/plugins/sdk-setup) — manifest, setup entry, ertelenmiş yükleme
- [Channel Plugins](/tr/plugins/sdk-channel-plugins) — `ChannelPlugin` nesnesini oluşturma
- [Provider Plugins](/tr/plugins/sdk-provider-plugins) — sağlayıcı kaydı ve hook'lar
