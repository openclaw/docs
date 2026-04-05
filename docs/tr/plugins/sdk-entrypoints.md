---
read_when:
    - definePluginEntry veya defineChannelPluginEntry için tam tür imzasına ihtiyaç duyduğunuzda
    - kayıt modunu anlamak istediğinizde (tam, kurulum veya CLI meta verisi)
    - giriş noktası seçeneklerine baktığınızda
sidebarTitle: Entry Points
summary: definePluginEntry, defineChannelPluginEntry ve defineSetupPluginEntry için başvuru
title: Plugin Giriş Noktaları
x-i18n:
    generated_at: "2026-04-05T14:01:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 799dbfe71e681dd8ba929a7a631dfe745c3c5c69530126fea2f9c137b120f51f
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Plugin Giriş Noktaları

Her plugin varsayılan bir giriş nesnesi dışa aktarır. SDK bunları oluşturmak
için üç yardımcı sağlar.

<Tip>
  **Adım adım bir kılavuz mu arıyorsunuz?** Adım adım kılavuzlar için
  [Channel Plugins](/plugins/sdk-channel-plugins) veya
  [Provider Plugins](/plugins/sdk-provider-plugins) sayfalarına bakın.
</Tip>

## `definePluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/plugin-entry`

Provider plugin'leri, araç plugin'leri, hook plugin'leri ve mesajlaşma kanalı
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

| Alan           | Tür                                                              | Gerekli | Varsayılan          |
| -------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`           | `string`                                                         | Evet    | —                   |
| `name`         | `string`                                                         | Evet    | —                   |
| `description`  | `string`                                                         | Evet    | —                   |
| `kind`         | `string`                                                         | Hayır   | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Evet    | —                   |

- `id`, `openclaw.plugin.json` manifest dosyanızla eşleşmelidir.
- `kind`, ayrıcalıklı slot'lar içindir: `"memory"` veya `"context-engine"`.
- `configSchema`, gecikmeli değerlendirme için bir işlev olabilir.
- OpenClaw bu şemayı ilk erişimde çözer ve belleğe alır; böylece maliyetli şema
  oluşturucular yalnızca bir kez çalışır.

## `defineChannelPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Kanal-özel bağlamayla `definePluginEntry`'yi sarar. Otomatik olarak
`api.registerChannel({ plugin })` çağırır, isteğe bağlı bir kök yardım CLI meta
verisi yüzeyi sunar ve `registerFull` işlemini kayıt moduna göre sınırlar.

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

- `setRuntime`, çalışma zamanı başvurusunu saklayabilmeniz için kayıt sırasında
  çağrılır (genellikle `createPluginRuntimeStore` ile). CLI meta verisi
  yakalama sırasında atlanır.
- `registerCliMetadata`, hem `api.registrationMode === "cli-metadata"`
  hem de `api.registrationMode === "full"` sırasında çalışır.
  Bunu, kök yardımın etkinleştirme yapmamasını sağlarken normal CLI komut kaydının
  tam plugin yüklemeleriyle uyumlu kalması için kanalın sahip olduğu CLI tanımlayıcılarının
  standart yeri olarak kullanın.
- `registerFull`, yalnızca `api.registrationMode === "full"` olduğunda çalışır.
  Yalnızca kurulum yüklemesi sırasında atlanır.
- `definePluginEntry` gibi `configSchema` da gecikmeli bir fabrika olabilir ve
  OpenClaw çözülen şemayı ilk erişimde belleğe alır.
- Plugin'e ait kök CLI komutları için, komutun kök CLI ayrıştırma ağacından
  kaybolmadan gecikmeli yüklenmesini istediğinizde
  `api.registerCli(..., { descriptors: [...] })` tercih edin. Kanal plugin'leri için
  bu tanımlayıcıları `registerCliMetadata(...)` içinden kaydetmeyi tercih edin ve
  `registerFull(...)` işlemini yalnızca çalışma zamanı işlerine odaklı tutun.
- `registerFull(...)` ayrıca gateway RPC yöntemleri de kaydediyorsa bunları
  plugin'e özgü bir önek üzerinde tutun. Ayrılmış çekirdek yönetici ad alanları
  (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman
  `operator.admin` olarak zorlanır.

## `defineSetupPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Hafif `setup-entry.ts` dosyası için. Çalışma zamanı veya CLI bağlaması olmadan
yalnızca `{ plugin }` döndürür.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw bunu, bir kanal devre dışı olduğunda, yapılandırılmadığında veya
ertelenmiş yükleme etkin olduğunda tam giriş yerine yükler. Bunun ne zaman önemli
olduğu için [Setup and Config](/plugins/sdk-setup#setup-entry) sayfasına bakın.

Pratikte `defineSetupPluginEntry(...)` ile dar kurulum yardımcı ailelerini eşleyin:

- `openclaw/plugin-sdk/setup-runtime`:
  içe aktarma açısından güvenli kurulum yama bağdaştırıcıları, lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş kurulum proxy'leri gibi
  çalışma zamanı açısından güvenli kurulum yardımcıları için
- `openclaw/plugin-sdk/channel-setup`:
  isteğe bağlı yükleme kurulum yüzeyleri için
- `openclaw/plugin-sdk/setup-tools`:
  kurulum/yükleme CLI/arşiv/belge yardımcıları için

Ağır SDK'ları, CLI kaydını ve uzun ömürlü çalışma zamanı hizmetlerini tam
girişte tutun.

## Kayıt modu

`api.registrationMode`, plugin'inize nasıl yüklendiğini söyler:

| Mod               | Ne zaman                         | Ne kaydedilmeli                                                                       |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------- |
| `"full"`          | Normal gateway başlangıcı        | Her şey                                                                               |
| `"setup-only"`    | Devre dışı/yapılandırılmamış kanal | Yalnızca kanal kaydı                                                                |
| `"setup-runtime"` | Çalışma zamanı mevcut kurulum akışı | Kanal kaydı artı tam giriş yüklenmeden önce gereken yalnızca hafif çalışma zamanı |
| `"cli-metadata"`  | Kök yardım / CLI meta verisi yakalama | Yalnızca CLI tanımlayıcıları                                                      |

`defineChannelPluginEntry` bu ayrımı otomatik olarak yönetir. Bir kanal için
doğrudan `definePluginEntry` kullanıyorsanız modu kendiniz denetleyin:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Yalnızca çalışma zamanına ait ağır kayıtlar
  api.registerService(/* ... */);
}
```

`"setup-runtime"` durumunu, tam paketlenmiş kanal çalışma zamanına yeniden
girmeden yalnızca kurulum başlangıç yüzeylerinin var olması gereken pencere
olarak değerlendirin. Uygun örnekler arasında kanal kaydı, kurulum açısından güvenli
HTTP rotaları, kurulum açısından güvenli gateway yöntemleri ve devredilmiş
kurulum yardımcıları bulunur. Ağır arka plan hizmetleri, CLI kaydedicileri ve
provider/client SDK önyüklemeleri yine `"full"` moduna aittir.

Özellikle CLI kaydedicileri için:

- Kaydedici bir veya daha fazla kök komutun sahibiyse ve OpenClaw'un ilk çağrıda
  gerçek CLI modülünü gecikmeli yüklemesini istiyorsanız `descriptors` kullanın
- Bu tanımlayıcıların, kaydedici tarafından açığa çıkarılan her üst düzey komut
  kökünü kapsadığından emin olun
- Açgözlü uyumluluk yolları için yalnızca `commands` kullanın

## Plugin şekilleri

OpenClaw, yüklü plugin'leri kayıt davranışlarına göre sınıflandırır:

| Şekil                | Açıklama                                              |
| -------------------- | ----------------------------------------------------- |
| **plain-capability** | Tek yetenek türü (ör. yalnızca provider)              |
| **hybrid-capability**| Birden çok yetenek türü (ör. provider + speech)       |
| **hook-only**        | Yetenek yok, yalnızca hook'lar                        |
| **non-capability**   | Araçlar/komutlar/hizmetler var ama yetenek yok        |

Bir plugin'in şeklini görmek için `openclaw plugins inspect <id>` kullanın.

## İlgili

- [SDK Genel Bakış](/plugins/sdk-overview) — kayıt API'si ve alt yol başvurusu
- [Çalışma Zamanı Yardımcıları](/plugins/sdk-runtime) — `api.runtime` ve `createPluginRuntimeStore`
- [Kurulum ve Yapılandırma](/plugins/sdk-setup) — manifest, kurulum girişi, ertelenmiş yükleme
- [Channel Plugins](/plugins/sdk-channel-plugins) — `ChannelPlugin` nesnesini oluşturma
- [Provider Plugins](/plugins/sdk-provider-plugins) — provider kaydı ve hook'lar
