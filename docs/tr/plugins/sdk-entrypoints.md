---
read_when:
    - definePluginEntry veya defineChannelPluginEntry için tam tür imzasına ihtiyacınız var
    - Kayıt modunu anlamak istiyorsunuz (full, setup ve CLI meta verileri)
    - Giriş noktası seçeneklerini arıyorsunuz
sidebarTitle: Entry Points
summary: definePluginEntry, defineChannelPluginEntry ve defineSetupPluginEntry için başvuru
title: Plugin giriş noktaları
x-i18n:
    generated_at: "2026-05-06T09:25:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Her Plugin bir varsayılan giriş nesnesi dışa aktarır. SDK, bunları
oluşturmak için üç yardımcı sağlar.

Yüklü Plugin'ler için `package.json`, mevcut olduğunda çalışma zamanı
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
geçerli kaynak girişleri olarak kalır. OpenClaw yüklü bir paketi yüklediğinde
`runtimeExtensions` ve `runtimeSetupEntry` tercih edilir ve npm paketlerinin
çalışma zamanında TypeScript derlemesinden kaçınmasını sağlar. Açık çalışma
zamanı girişleri gereklidir: `runtimeSetupEntry`, `setupEntry` gerektirir ve
eksik `runtimeExtensions` veya `runtimeSetupEntry` yapıtları, sessizce kaynağa
geri dönmek yerine kurulumun/keşfin başarısız olmasına neden olur. Yüklü bir
paket yalnızca bir TypeScript kaynak girişi bildirirse, OpenClaw önce varsa
eşleşen derlenmiş `dist/*.js` eşini kullanır, ardından TypeScript kaynağına geri
döner.

Tüm giriş yolları Plugin paketi dizininin içinde kalmalıdır. Çalışma zamanı
girişleri ve çıkarımlanan derlenmiş JavaScript eşleri, dışarı kaçan bir
`extensions` veya `setupEntry` kaynak yolunu geçerli yapmaz.

<Tip>
  **Bir adım adım anlatım mı arıyorsunuz?** Adım adım kılavuzlar için [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)
  veya [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) sayfasına bakın.
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

| Alan           | Tür                                                              | Gerekli | Varsayılan         |
| -------------- | ---------------------------------------------------------------- | ------- | ------------------ |
| `id`           | `string`                                                         | Evet    | -                  |
| `name`         | `string`                                                         | Evet    | -                  |
| `description`  | `string`                                                         | Evet    | -                  |
| `kind`         | `string`                                                         | Hayır   | -                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması   |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Evet    | -                  |

- `id`, `openclaw.plugin.json` bildiriminizle eşleşmelidir.
- `kind`, özel yuvalar içindir: `"memory"` veya `"context-engine"`.
- `configSchema`, tembel değerlendirme için bir işlev olabilir.
- OpenClaw bu şemayı ilk erişimde çözümler ve belleğe alır; böylece pahalı şema
  oluşturucuları yalnızca bir kez çalışır.

## `defineChannelPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` öğesini kanala özgü bağlantılarla sarar. Otomatik olarak
`api.registerChannel({ plugin })` çağırır, isteğe bağlı bir kök yardım CLI
meta verisi aralığı sunar ve `registerFull` öğesini kayıt moduna göre sınırlar.

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

| Alan                  | Tür                                                              | Gerekli | Varsayılan         |
| --------------------- | ---------------------------------------------------------------- | ------- | ------------------ |
| `id`                  | `string`                                                         | Evet    | -                  |
| `name`                | `string`                                                         | Evet    | -                  |
| `description`         | `string`                                                         | Evet    | -                  |
| `plugin`              | `ChannelPlugin`                                                  | Evet    | -                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Hayır   | -                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Hayır   | -                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Hayır   | -                  |

- `setRuntime`, çalışma zamanı başvurusunu saklayabilmeniz için kayıt sırasında
  çağrılır (genellikle `createPluginRuntimeStore` aracılığıyla). CLI meta verisi
  yakalama sırasında atlanır.
- `registerCliMetadata`; `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` ve
  `api.registrationMode === "full"` sırasında çalışır.
  Bunu, kanalın sahip olduğu CLI tanımlayıcıları için kanonik yer olarak kullanın;
  böylece kök yardım etkinleştirme yapmadan kalır, keşif anlık görüntüleri statik
  komut meta verisini içerir ve normal CLI komut kaydı tam Plugin yüklemeleriyle
  uyumlu kalır.
- Keşif kaydı etkinleştirici değildir, içe aktarmasız da değildir. OpenClaw,
  anlık görüntüyü oluşturmak için güvenilir Plugin girişini ve kanal Plugin
  modülünü değerlendirebilir; bu nedenle üst düzey içe aktarmaları yan etkisiz
  tutun ve soketleri, istemcileri, worker'ları ve servisleri yalnızca `"full"`
  yollarının arkasına koyun.
- `registerFull` yalnızca `api.registrationMode === "full"` olduğunda çalışır.
  Yalnızca kurulum yüklemesi sırasında atlanır.
- `definePluginEntry` gibi, `configSchema` tembel bir fabrika olabilir ve OpenClaw
  çözümlenen şemayı ilk erişimde belleğe alır.
- Plugin'e ait kök CLI komutları için, komutun kök CLI ayrıştırma ağacından
  kaybolmadan tembel yüklenmiş kalmasını istediğinizde
  `api.registerCli(..., { descriptors: [...] })` tercih edin. Kanal Plugin'leri
  için bu tanımlayıcıları `registerCliMetadata(...)` içinden kaydetmeyi tercih edin
  ve `registerFull(...)` öğesini yalnızca çalışma zamanına özgü işe odaklı tutun.
- `registerFull(...)` ayrıca Gateway RPC yöntemleri kaydediyorsa, bunları
  Plugin'e özgü bir önekte tutun. Ayrılmış çekirdek yönetici ad alanları
  (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman
  `operator.admin` değerine zorlanır.

## `defineSetupPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Hafif `setup-entry.ts` dosyası için. Çalışma zamanı veya CLI bağlantısı olmadan
yalnızca `{ plugin }` döndürür.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw, bir kanal devre dışı, yapılandırılmamış olduğunda veya ertelenmiş
yükleme etkinleştirildiğinde tam giriş yerine bunu yükler. Bunun ne zaman önemli
olduğunu görmek için [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry)
bölümüne bakın.

Pratikte `defineSetupPluginEntry(...)` öğesini dar kurulum yardımcı aileleriyle
eşleştirin:

- içe aktarma açısından güvenli kurulum yama bağdaştırıcıları, arama notu çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve temsil edilen kurulum proxy'leri
  gibi çalışma zamanı açısından güvenli kurulum yardımcıları için
  `openclaw/plugin-sdk/setup-runtime`
- isteğe bağlı kurulum yüzeyleri için `openclaw/plugin-sdk/channel-setup`
- kurulum/yükleme CLI/arşiv/belge yardımcıları için `openclaw/plugin-sdk/setup-tools`

Ağır SDK'ları, CLI kaydını ve uzun ömürlü çalışma zamanı servislerini tam girişte
tutun.

Kurulum ve çalışma zamanı yüzeylerini ayıran paketlenmiş çalışma alanı kanalları,
bunun yerine `openclaw/plugin-sdk/channel-entry-contract` içinden
`defineBundledChannelSetupEntry(...)` kullanabilir. Bu sözleşme, kurulum
girişinin kurulum açısından güvenli Plugin/gizli değer dışa aktarımlarını
korurken yine de bir çalışma zamanı ayarlayıcısı sunmasını sağlar:

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

Bu paketlenmiş sözleşmeyi yalnızca kurulum akışları, tam kanal girişi yüklenmeden
önce gerçekten hafif bir çalışma zamanı ayarlayıcısına ihtiyaç duyduğunda kullanın.

## Kayıt modu

`api.registrationMode`, Plugin'inizin nasıl yüklendiğini söyler:

| Mod               | Ne zaman                          | Ne kaydedilmeli                                                                                                      |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normal gateway başlatma           | Her şey                                                                                                              |
| `"discovery"`     | Salt okunur yetenek keşfi         | Kanal kaydı ve statik CLI tanımlayıcıları; giriş kodu yüklenebilir, ancak soketleri, worker'ları, istemcileri ve servisleri atlayın |
| `"setup-only"`    | Devre dışı/yapılandırılmamış kanal | Yalnızca kanal kaydı                                                                                                 |
| `"setup-runtime"` | Çalışma zamanı mevcut kurulum akışı | Kanal kaydı ve tam giriş yüklenmeden önce gerekli olan yalnızca hafif çalışma zamanı                                 |
| `"cli-metadata"`  | Kök yardım / CLI meta verisi yakalama | Yalnızca CLI tanımlayıcıları                                                                                         |

`defineChannelPluginEntry` bu ayrımı otomatik olarak yönetir. Bir kanal için
doğrudan `definePluginEntry` kullanırsanız, modu kendiniz denetleyin:

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

Keşif modu, etkinleştirmeyen bir kayıt defteri anlık görüntüsü oluşturur.
OpenClaw'ın kanal yeteneklerini ve statik CLI tanımlayıcılarını kaydedebilmesi
için Plugin girişini ve kanal Plugin nesnesini yine de değerlendirebilir. Keşifte
modül değerlendirmesini güvenilir ama hafif kabul edin: üst düzeyde ağ
istemcileri, alt süreçler, dinleyiciler, veritabanı bağlantıları, arka plan
worker'ları, kimlik bilgisi okumaları veya başka canlı çalışma zamanı yan etkileri
olmamalıdır.

`"setup-runtime"` değerini, yalnızca kurulum başlatma yüzeylerinin tam paketlenmiş
kanal çalışma zamanına yeniden girmeden var olması gereken pencere olarak ele
alın. Uygun örnekler kanal kaydı, kurulum açısından güvenli HTTP rotaları,
kurulum açısından güvenli Gateway yöntemleri ve temsil edilen kurulum yardımcılarıdır.
Ağır arka plan servisleri, CLI kaydedicileri ve sağlayıcı/istemci SDK başlangıçları
yine de `"full"` içinde yer alır.

Özellikle CLI kaydedicileri için:

- kaydedici bir veya daha fazla kök komuta sahipse ve OpenClaw'ın ilk çağrıda
  gerçek CLI modülünü tembel yüklemesini istiyorsanız `descriptors` kullanın
- bu tanımlayıcıların kaydedici tarafından sunulan her üst düzey komut kökünü
  kapsadığından emin olun
- tanımlayıcı komut adlarını harfler, sayılar, kısa çizgi ve alt çizgiyle sınırlı
  tutun; bir harf veya sayıyla başlamalıdır. OpenClaw bu şeklin dışındaki
  tanımlayıcı adlarını reddeder ve yardımı işlemeden önce açıklamalardan terminal
  kontrol dizilerini çıkarır
- yalnızca istekli uyumluluk yolları için tek başına `commands` kullanın

## Plugin şekilleri

OpenClaw, yüklenen Plugin'leri kayıt davranışlarına göre sınıflandırır:

| Biçim                 | Açıklama                                           |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Tek yetenek türü (örn. yalnızca sağlayıcı)         |
| **hybrid-capability** | Birden fazla yetenek türü (örn. sağlayıcı + konuşma) |
| **hook-only**         | Yalnızca hook'lar, yetenek yok                     |
| **non-capability**    | Araçlar/komutlar/hizmetler, ancak yetenek yok      |

Bir Plugin'in biçimini görmek için `openclaw plugins inspect <id>` kullanın.

## İlgili

- [SDK'ye Genel Bakış](/tr/plugins/sdk-overview) - kayıt API'si ve alt yol referansı
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime) - `api.runtime` ve `createPluginRuntimeStore`
- [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup) - manifest, kurulum girişi, ertelenmiş yükleme
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) - `ChannelPlugin` nesnesini oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) - sağlayıcı kaydı ve hook'lar
