---
read_when:
    - definePluginEntry veya defineChannelPluginEntry için tam tür imzasına ihtiyacınız var
    - Kayıt modunu anlamak istiyorsunuz (tam, kurulum veya CLI meta verileri)
    - Giriş noktası seçeneklerini arıyorsunuz
sidebarTitle: Entry Points
summary: definePluginEntry, defineChannelPluginEntry ve defineSetupPluginEntry için referans
title: Plugin Giriş Noktaları
x-i18n:
    generated_at: "2026-04-15T19:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: aabca25bc9b8ff1b5bb4852bafe83640ffeba006ea6b6a8eff4e2c37a10f1fe4
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Plugin Giriş Noktaları

Her Plugin varsayılan bir giriş nesnesi dışa aktarır. SDK, bunları oluşturmak için
üç yardımcı sağlar.

<Tip>
  **Adım adım bir rehber mi arıyorsunuz?** Adım adım kılavuzlar için [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins)
  veya [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins) sayfalarına bakın.
</Tip>

## `definePluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/plugin-entry`

Sağlayıcı pluginleri, araç pluginleri, kanca pluginleri ve bir mesajlaşma
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

| Alan           | Tür                                                              | Gerekli | Varsayılan          |
| -------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`           | `string`                                                         | Evet    | —                   |
| `name`         | `string`                                                         | Evet    | —                   |
| `description`  | `string`                                                         | Evet    | —                   |
| `kind`         | `string`                                                         | Hayır   | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Evet    | —                   |

- `id`, `openclaw.plugin.json` manifestinizle eşleşmelidir.
- `kind`, özel yuvalar içindir: `"memory"` veya `"context-engine"`.
- `configSchema`, geç değerlendirme için bir fonksiyon olabilir.
- OpenClaw bu şemayı ilk erişimde çözümler ve belleğe alır; böylece maliyetli şema
  oluşturucular yalnızca bir kez çalışır.

## `defineChannelPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Kanal özelindeki bağlantıları ekleyerek `definePluginEntry` işlevini sarmalar.
`api.registerChannel({ plugin })` çağrısını otomatik olarak yapar, isteğe bağlı bir
kök yardım CLI meta verisi arayüzü sunar ve `registerFull` çağrısını kayıt moduna göre sınırlar.

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

- `setRuntime`, kayıt sırasında çağrılır; böylece çalışma zamanı başvurusunu
  saklayabilirsiniz (genellikle `createPluginRuntimeStore` aracılığıyla). CLI meta verisi
  yakalama sırasında atlanır.
- `registerCliMetadata`, hem `api.registrationMode === "cli-metadata"` hem de
  `api.registrationMode === "full"` sırasında çalışır.
  Bunu, kanala ait CLI tanımlayıcıları için kanonik yer olarak kullanın; böylece kök yardım
  etkinleştirme yapmadan kalır ve normal CLI komut kaydı tam Plugin yüklemeleriyle
  uyumlu olmaya devam eder.
- `registerFull` yalnızca `api.registrationMode === "full"` olduğunda çalışır. Yalnızca kurulum
  yüklemesi sırasında atlanır.
- `definePluginEntry` gibi, `configSchema` da geç bir fabrika olabilir ve OpenClaw
  çözümlenen şemayı ilk erişimde belleğe alır.
- Plugin'e ait kök CLI komutları için, komutun kök CLI ayrıştırma ağacından
  kaybolmadan geç yüklenmesini istiyorsanız `api.registerCli(..., { descriptors: [...] })`
  kullanımını tercih edin. Kanal pluginlerinde, bu tanımlayıcıları
  `registerCliMetadata(...)` içinden kaydetmeyi tercih edin ve `registerFull(...)`
  işlevini yalnızca çalışma zamanına özgü işlere odaklı tutun.
- Eğer `registerFull(...)` aynı zamanda Gateway RPC yöntemlerini de kaydediyorsa,
  bunları Plugin'e özgü bir önek altında tutun. Ayrılmış çekirdek yönetici ad alanları
  (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman
  `operator.admin` olarak zorlanır.

## `defineSetupPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Hafif `setup-entry.ts` dosyası için. Çalışma zamanı veya CLI bağlantısı olmadan
yalnızca `{ plugin }` döndürür.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw, bir kanal devre dışı olduğunda, yapılandırılmadığında veya ertelenmiş
yükleme etkin olduğunda tam giriş yerine bunu yükler. Bunun ne zaman önemli olduğunu
öğrenmek için [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry) sayfasına bakın.

Pratikte, `defineSetupPluginEntry(...)` işlevini dar kapsamlı kurulum yardımcı
aileleriyle eşleştirin:

- `openclaw/plugin-sdk/setup-runtime`: içe aktarması güvenli kurulum yama bağdaştırıcıları,
  lookup-note çıktısı, `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilen kurulum
  proxy'leri gibi çalışma zamanında güvenli kurulum yardımcıları için
- `openclaw/plugin-sdk/channel-setup`: isteğe bağlı kurulum yapı yüzeyleri için
- `openclaw/plugin-sdk/setup-tools`: kurulum/kurma CLI/arşiv/belgeler yardımcıları için

Ağır SDK'ları, CLI kaydını ve uzun ömürlü çalışma zamanı hizmetlerini tam girişte
tutun.

Kurulum ve çalışma zamanı yüzeylerini ayıran paketlenmiş çalışma alanı kanalları,
bunun yerine `openclaw/plugin-sdk/channel-entry-contract` içinden
`defineBundledChannelSetupEntry(...)` kullanabilir. Bu sözleşme, kurulum girişinin
hafif bir çalışma zamanı ayarlayıcısı sunmaya devam ederken kuruluma güvenli
Plugin/gizli anahtar dışa aktarımlarını korumasını sağlar:

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

Bu paketlenmiş sözleşmeyi yalnızca kurulum akışlarının, tam kanal girişi yüklenmeden
önce gerçekten hafif bir çalışma zamanı ayarlayıcısına ihtiyaç duyduğu durumlarda kullanın.

## Kayıt modu

`api.registrationMode`, Plugininize nasıl yüklendiğini bildirir:

| Mod               | Ne zaman                         | Ne kaydedilmeli                                                                          |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| `"full"`          | Normal Gateway başlatma          | Her şey                                                                                  |
| `"setup-only"`    | Devre dışı/yapılandırılmamış kanal | Yalnızca kanal kaydı                                                                     |
| `"setup-runtime"` | Çalışma zamanı mevcut kurulum akışı | Kanal kaydı ve tam giriş yüklenmeden önce gereken yalnızca hafif çalışma zamanı          |
| `"cli-metadata"`  | Kök yardım / CLI meta verisi yakalama | Yalnızca CLI tanımlayıcıları                                                             |

`defineChannelPluginEntry` bu ayrımı otomatik olarak yönetir. Bir kanal için doğrudan
`definePluginEntry` kullanırsanız, modu kendiniz denetleyin:

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

`"setup-runtime"` modunu, yalnızca kurulum başlangıç yüzeylerinin tam paketlenmiş kanal
çalışma zamanına yeniden girmeden var olması gereken pencere olarak değerlendirin.
Buna uygun örnekler arasında kanal kaydı, kuruluma güvenli HTTP rotaları, kuruluma
güvenli Gateway yöntemleri ve devredilen kurulum yardımcıları bulunur. Ağır arka plan
hizmetleri, CLI kaydedicileri ve sağlayıcı/istemci SDK önyüklemeleri ise yine `"full"`
moduna aittir.

Özellikle CLI kaydedicileri için:

- Kaydedici bir veya daha fazla kök komuta sahipse ve gerçek CLI modülünün ilk çağrıda
  OpenClaw tarafından geç yüklenmesini istiyorsanız `descriptors` kullanın
- Bu tanımlayıcıların, kaydedici tarafından açığa çıkarılan her üst düzey komut kökünü
  kapsadığından emin olun
- Yalnızca hevesli uyumluluk yolları için tek başına `commands` kullanın

## Plugin biçimleri

OpenClaw, yüklenen pluginleri kayıt davranışlarına göre sınıflandırır:

| Biçim                | Açıklama                                           |
| -------------------- | -------------------------------------------------- |
| **plain-capability** | Tek bir yetenek türü (ör. yalnızca sağlayıcı)      |
| **hybrid-capability** | Birden fazla yetenek türü (ör. sağlayıcı + konuşma) |
| **hook-only**        | Yalnızca kancalar, yetenek yok                     |
| **non-capability**   | Araçlar/komutlar/hizmetler var ama yetenek yok    |

Bir Pluginin biçimini görmek için `openclaw plugins inspect <id>` kullanın.

## İlgili

- [SDK Genel Bakış](/tr/plugins/sdk-overview) — kayıt API'si ve alt yol referansı
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime) — `api.runtime` ve `createPluginRuntimeStore`
- [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup) — manifest, kurulum girişi, ertelenmiş yükleme
- [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins) — `ChannelPlugin` nesnesini oluşturma
- [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins) — sağlayıcı kaydı ve kancalar
