---
read_when:
    - definePluginEntry veya defineChannelPluginEntry için tam tür imzasına ihtiyacınız var
    - Kayıt modunu (full, setup ve CLI meta verileri) anlamak istiyorsunuz
    - Giriş noktası seçeneklerini inceliyorsunuz
sidebarTitle: Entry Points
summary: definePluginEntry, defineChannelPluginEntry ve defineSetupPluginEntry referansı
title: Plugin giriş noktaları
x-i18n:
    generated_at: "2026-05-02T09:02:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Her Plugin varsayılan bir giriş nesnesi dışa aktarır. SDK, bunları
oluşturmak için üç yardımcı sağlar.

Yüklü Plugin'ler için `package.json`, mümkün olduğunda çalışma zamanı yüklemesini derlenmiş
JavaScript'e yönlendirmelidir:

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
geçerli kaynak girişleri olarak kalır. OpenClaw yüklü bir paketi yüklediğinde
`runtimeExtensions` ve `runtimeSetupEntry` tercih edilir ve npm paketlerinin çalışma zamanında
TypeScript derlemesinden kaçınmasını sağlar. Açık çalışma zamanı girişleri zorunludur:
`runtimeSetupEntry`, `setupEntry` gerektirir ve eksik `runtimeExtensions` veya
`runtimeSetupEntry` yapıtları, sessizce kaynağa geri dönmek yerine kurulumun/keşfin
başarısız olmasına neden olur. Yüklü bir paket yalnızca TypeScript kaynak girişi bildirirse,
OpenClaw var olduğunda eşleşen derlenmiş `dist/*.js` eşini kullanır, ardından TypeScript
kaynağına geri döner.

Tüm giriş yolları Plugin paketi dizininin içinde kalmalıdır. Çalışma zamanı girişleri
ve çıkarımlanan derlenmiş JavaScript eşleri, dışarı kaçan bir `extensions` veya
`setupEntry` kaynak yolunu geçerli yapmaz.

<Tip>
  **Bir rehber mi arıyorsunuz?** Adım adım kılavuzlar için [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)
  veya [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) bölümüne bakın.
</Tip>

## `definePluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/plugin-entry`

Sağlayıcı Plugin'leri, araç Plugin'leri, hook Plugin'leri ve mesajlaşma kanalı
**olmayan** her şey için.

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
| `id`           | `string`                                                         | Evet    | —                   |
| `name`         | `string`                                                         | Evet    | —                   |
| `description`  | `string`                                                         | Evet    | —                   |
| `kind`         | `string`                                                         | Hayır   | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Evet    | —                   |

- `id`, `openclaw.plugin.json` manifestinizle eşleşmelidir.
- `kind`, özel slotlar içindir: `"memory"` veya `"context-engine"`.
- `configSchema`, tembel değerlendirme için bir fonksiyon olabilir.
- OpenClaw bu şemayı ilk erişimde çözümler ve memoize eder; bu nedenle pahalı şema
  oluşturucuları yalnızca bir kez çalışır.

## `defineChannelPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` öğesini kanala özel bağlantılarla sarar. Otomatik olarak
`api.registerChannel({ plugin })` çağırır, isteğe bağlı bir kök yardım CLI metadata
bağlantısı sunar ve `registerFull` öğesini kayıt moduna göre sınırlar.

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
| `id`                  | `string`                                                         | Evet    | —                   |
| `name`                | `string`                                                         | Evet    | —                   |
| `description`         | `string`                                                         | Evet    | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Evet    | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Hayır   | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Hayır   | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Hayır   | —                   |

- `setRuntime`, çalışma zamanı referansını saklayabilmeniz için kayıt sırasında çağrılır
  (genellikle `createPluginRuntimeStore` aracılığıyla). CLI metadata yakalama sırasında
  atlanır.
- `registerCliMetadata`, `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` ve
  `api.registrationMode === "full"` sırasında çalışır.
  Bunu kanalın sahip olduğu CLI tanımlayıcıları için kanonik yer olarak kullanın; böylece kök yardım
  etkinleştirme yapmadan kalır, keşif anlık görüntüleri statik komut metadata'sını içerir ve
  normal CLI komut kaydı tam Plugin yüklemeleriyle uyumlu kalır.
- Keşif kaydı etkinleştirme yapmaz, ancak içe aktarmadan bağımsız değildir. OpenClaw,
  anlık görüntüyü oluşturmak için güvenilir Plugin girişini ve kanal Plugin modülünü
  değerlendirebilir; bu nedenle üst düzey içe aktarmaları yan etkisiz tutun ve soketleri,
  istemcileri, worker'ları ve servisleri yalnızca `"full"` yollarının arkasına koyun.
- `registerFull` yalnızca `api.registrationMode === "full"` olduğunda çalışır. Yalnızca kurulum
  yüklemesi sırasında atlanır.
- `definePluginEntry` gibi, `configSchema` tembel bir fabrika olabilir ve OpenClaw
  çözümlenen şemayı ilk erişimde memoize eder.
- Plugin'in sahip olduğu kök CLI komutları için, komutun kök CLI ayrıştırma ağacından
  kaybolmadan tembel yüklenmesini istediğinizde `api.registerCli(..., { descriptors: [...] })`
  tercih edin. Kanal Plugin'leri için, bu tanımlayıcıları
  `registerCliMetadata(...)` içinden kaydetmeyi tercih edin ve `registerFull(...)` öğesini yalnızca çalışma zamanı işlerine odaklı tutun.
- `registerFull(...)` ayrıca Gateway RPC yöntemleri kaydediyorsa, bunları
  Plugin'e özel bir önekte tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) her zaman
  `operator.admin` olarak zorlanır.

## `defineSetupPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Hafif `setup-entry.ts` dosyası için. Çalışma zamanı veya CLI bağlantısı olmadan
yalnızca `{ plugin }` döndürür.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw bunu, bir kanal devre dışı, yapılandırılmamış olduğunda veya ertelenmiş
yükleme etkin olduğunda tam giriş yerine yükler. Bunun ne zaman önemli olduğunu görmek için
[Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry) bölümüne bakın.

Pratikte, `defineSetupPluginEntry(...)` öğesini dar kurulum yardımcı
aileleriyle eşleştirin:

- içe aktarma güvenli kurulum yama bağdaştırıcıları, lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve yetkilendirilmiş kurulum proxy'leri gibi
  çalışma zamanı güvenli kurulum yardımcıları için `openclaw/plugin-sdk/setup-runtime`
- isteğe bağlı kurulum yüzeyleri için `openclaw/plugin-sdk/channel-setup`
- kurulum/kurulum CLI/arşiv/doküman yardımcıları için `openclaw/plugin-sdk/setup-tools`

Ağır SDK'ları, CLI kaydını ve uzun ömürlü çalışma zamanı servislerini tam
girişte tutun.

Kurulum ve çalışma zamanı yüzeylerini ayıran paketlenmiş çalışma alanı kanalları bunun yerine
`openclaw/plugin-sdk/channel-entry-contract` üzerinden
`defineBundledChannelSetupEntry(...)` kullanabilir. Bu sözleşme,
kurulum girişinin kurulum açısından güvenli Plugin/gizli dışa aktarımlarını korurken yine de bir
çalışma zamanı ayarlayıcısı sunmasını sağlar:

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

Bu paketlenmiş sözleşmeyi yalnızca kurulum akışları, tam kanal girişi yüklenmeden önce
gerçekten hafif bir çalışma zamanı ayarlayıcısına ihtiyaç duyduğunda kullanın.

## Kayıt modu

`api.registrationMode`, Plugin'inizin nasıl yüklendiğini söyler:

| Mod               | Ne zaman                          | Ne kaydedilmeli                                                                                                       |
| ----------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normal Gateway başlatması         | Her şey                                                                                                               |
| `"discovery"`     | Salt okunur yetenek keşfi         | Kanal kaydı artı statik CLI tanımlayıcıları; giriş kodu yüklenebilir, ancak soketleri, worker'ları, istemcileri ve servisleri atlayın |
| `"setup-only"`    | Devre dışı/yapılandırılmamış kanal | Yalnızca kanal kaydı                                                                                                  |
| `"setup-runtime"` | Çalışma zamanı mevcut kurulum akışı | Kanal kaydı artı yalnızca tam giriş yüklenmeden önce gereken hafif çalışma zamanı                                    |
| `"cli-metadata"`  | Kök yardım / CLI metadata yakalama | Yalnızca CLI tanımlayıcıları                                                                                          |

`defineChannelPluginEntry` bu ayrımı otomatik olarak yönetir. Bir kanal için
doğrudan `definePluginEntry` kullanırsanız, modu kendiniz kontrol edin:

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

Keşif modu, etkinleştirme yapmayan bir kayıt anlık görüntüsü oluşturur. OpenClaw'ın kanal
yeteneklerini ve statik CLI tanımlayıcılarını kaydedebilmesi için Plugin girişini ve kanal
Plugin nesnesini yine de değerlendirebilir. Keşifte modül değerlendirmesini güvenilir ama
hafif kabul edin: üst düzeyde ağ istemcileri, alt süreçler, dinleyiciler, veritabanı
bağlantıları, arka plan worker'ları, kimlik bilgisi okumaları veya başka canlı çalışma zamanı
yan etkileri olmamalıdır.

`"setup-runtime"` öğesini, yalnızca kurulum başlangıç yüzeylerinin tam paketlenmiş kanal
çalışma zamanına yeniden girmeden var olması gereken pencere olarak ele alın. Uygun kullanımlar
kanal kaydı, kurulum açısından güvenli HTTP rotaları, kurulum açısından güvenli Gateway yöntemleri ve
yetkilendirilmiş kurulum yardımcılarıdır. Ağır arka plan servisleri, CLI kaydedicileri ve
sağlayıcı/istemci SDK başlatmaları yine de `"full"` içinde yer almalıdır.

Özellikle CLI kaydedicileri için:

- kaydedici bir veya daha fazla kök komuta sahipse ve OpenClaw'ın gerçek CLI modülünü
  ilk çağrıda tembel yüklemesini istiyorsanız `descriptors` kullanın
- bu tanımlayıcıların kaydedicinin sunduğu her üst düzey komut kökünü kapsadığından emin olun
- tanımlayıcı komut adlarını harfler, sayılar, tire ve alt çizgiyle sınırlı tutun;
  bir harf veya sayıyla başlamalıdır; OpenClaw bu biçimin dışındaki tanımlayıcı adlarını reddeder
  ve yardım oluşturulmadan önce açıklamalardan terminal kontrol dizilerini çıkarır
- `commands` öğesini tek başına yalnızca eager uyumluluk yolları için kullanın

## Plugin şekilleri

OpenClaw, yüklenen Plugin'leri kayıt davranışlarına göre sınıflandırır:

| Biçim                 | Açıklama                                           |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Tek bir yetenek türü (örn. yalnızca sağlayıcı)     |
| **hybrid-capability** | Birden çok yetenek türü (örn. sağlayıcı + konuşma) |
| **hook-only**         | Yalnızca hook'lar, yetenek yok                     |
| **non-capability**    | Araçlar/komutlar/hizmetler, ancak yetenek yok      |

Bir Plugin'in biçimini görmek için `openclaw plugins inspect <id>` kullanın.

## İlgili

- [SDK Genel Bakış](/tr/plugins/sdk-overview) — kayıt API'si ve alt yol referansı
- [Runtime Yardımcıları](/tr/plugins/sdk-runtime) — `api.runtime` ve `createPluginRuntimeStore`
- [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup) — manifest, kurulum girdisi, ertelenmiş yükleme
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — `ChannelPlugin` nesnesini oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı kaydı ve hook'lar
