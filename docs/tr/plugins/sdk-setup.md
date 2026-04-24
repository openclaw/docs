---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - setup-entry.ts ile index.ts arasındaki farkı anlamanız gerekiyor
    - Plugin yapılandırma şemalarını veya package.json openclaw meta verilerini tanımlıyorsunuz
sidebarTitle: Setup and Config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Plugin kurulumu ve yapılandırması
x-i18n:
    generated_at: "2026-04-24T09:23:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Plugin paketleme (`package.json` meta verileri), manifest'ler
(`openclaw.plugin.json`), setup girdileri ve yapılandırma şemaları için başvuru.

<Tip>
  **Adım adım bir anlatım mı arıyorsunuz?** Nasıl yapılır kılavuzları paketlemeyi bağlam içinde ele alır:
  [Kanal Plugins'leri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve
  [Sağlayıcı Plugins'leri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızda, Plugin sistemine
Plugin'inizin ne sağladığını söyleyen bir `openclaw` alanı olmalıdır:

**Kanal Plugin'i:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Sağlayıcı Plugin'i / ClawHub yayımlama temeli:**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Plugin'i ClawHub üzerinde haricen yayımlıyorsanız bu `compat` ve `build`
alanları gereklidir. Kanonik yayımlama parçacıkları
`docs/snippets/plugin-publish/` altında bulunur.

### `openclaw` alanları

| Alan         | Tür        | Açıklama                                                                                                                  |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Giriş noktası dosyaları (paket köküne göreli)                                                                             |
| `setupEntry` | `string`   | Hafif yalnızca kurulum girdisi (isteğe bağlı)                                                                             |
| `channel`    | `object`   | Kurulum, seçim, hızlı başlangıç ve durum yüzeyleri için kanal katalog meta verileri                                       |
| `providers`  | `string[]` | Bu Plugin tarafından kaydedilen sağlayıcı kimlikleri                                                                      |
| `install`    | `object`   | Kurulum ipuçları: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Başlangıç davranışı bayrakları                                                                                             |

### `openclaw.channel`

`openclaw.channel`, çalışma zamanı yüklenmeden önce kanal keşfi ve kurulum
yüzeyleri için ucuz paket meta verisidir.

| Alan                                   | Tür        | Ne anlama gelir                                                            |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonik kanal kimliği.                                                     |
| `label`                                | `string`   | Birincil kanal etiketi.                                                    |
| `selectionLabel`                       | `string`   | `label` değerinden farklı olması gerekiyorsa seçim/kurulum etiketi.        |
| `detailLabel`                          | `string`   | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi. |
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için belge yolu.                             |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde belge bağlantıları için kullanılan geçersiz kılma etiketi. |
| `blurb`                                | `string`   | Kısa onboarding/katalog açıklaması.                                        |
| `order`                                | `number`   | Kanal kataloglarındaki sıralama düzeni.                                    |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama takma adları.                                   |
| `preferOver`                           | `string[]` | Bu kanalın önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal UI katalogları için isteğe bağlı simge/sistem-image adı.             |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde belge bağlantılarından önce gelen önek metin.           |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim metninde etiketli belge bağlantısı yerine belge yolunu doğrudan gösterir. |
| `selectionExtras`                      | `string[]` | Seçim metnine eklenen kısa ek dizeler.                                     |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı markdown yetenekli olarak işaretler. |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış listeler ve belge yüzeyleri için kanal görünürlük denetimleri. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder. |
| `forceAccountBinding`                  | `boolean`  | Tek hesap olsa bile açık hesap bağlamasını zorunlu kılar.                  |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bu kanal için bildirim hedeflerini çözümlerken oturum aramasını tercih eder. |

Örnek:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` şunları destekler:

- `configured`: kanalı yapılandırılmış/durum tarzı listeleme yüzeylerine dahil eder
- `setup`: kanalı etkileşimli kurulum/yapılandırma seçimlerine dahil eder
- `docs`: kanalı belge/gezinme yüzeylerinde herkese açık olarak işaretler

`showConfigured` ve `showInSetup`, legacy takma adlar olarak hâlâ desteklenir. `exposure`
tercih edilmelidir.

### `openclaw.install`

`openclaw.install`, manifest meta verisi değil, paket meta verisidir.

| Alan                         | Tür                  | Ne anlama gelir                                                                 |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kurulum/güncelleme akışları için kanonik npm spec'i.                            |
| `localPath`                  | `string`             | Yerel geliştirme veya paketlenmiş kurulum yolu.                                 |
| `defaultChoice`              | `"npm"` \| `"local"` | Her ikisi de mevcut olduğunda tercih edilen kurulum kaynağı.                    |
| `minHostVersion`             | `string`             | `>=x.y.z` biçiminde desteklenen en düşük OpenClaw sürümü.                       |
| `expectedIntegrity`          | `string`             | Sabitlenmiş kurulumlar için beklenen npm dist integrity dizgesi, genellikle `sha512-...`. |
| `allowInvalidConfigRecovery` | `boolean`            | Paketlenmiş Plugin yeniden kurulum akışlarının belirli eski yapılandırma hatalarından kurtulmasına izin verir. |

Etkileşimli onboarding, isteğe bağlı kurulum
yüzeyleri için de `openclaw.install` kullanır. Plugin'iniz çalışma zamanı yüklenmeden önce sağlayıcı auth seçimleri veya kanal kurulum/katalog
meta verileri açığa çıkarıyorsa onboarding bu seçimi gösterebilir, npm mi yoksa yerel kurulum mu sorabilir, Plugin'i kurabilir veya etkinleştirebilir, sonra seçilen
akıma devam edebilir. Npm onboarding seçimleri, kayıt defteri
`npmSpec` değeri olan güvenilir katalog meta verisi gerektirir; tam sürümler ve `expectedIntegrity`
isteğe bağlı sabitlemelerdir. `expectedIntegrity`
mevcutsa kurulum/güncelleme akışları bunu zorunlu kılar. “Ne gösterilmeli”
meta verisini `openclaw.plugin.json` içinde, “nasıl kurulmalı”
meta verisini `package.json` içinde tutun.

`minHostVersion` ayarlıysa hem kurulum hem de manifest-kayıt defteri yükleme
bunu uygular. Daha eski host'lar Plugin'i atlar; geçersiz sürüm dizgeleri reddedilir.

Sabitlenmiş npm kurulumları için tam sürümü `npmSpec` içinde tutun ve
beklenen artifact integrity'yi ekleyin:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir bypass değildir. Bu,
yalnızca dar paketlenmiş Plugin kurtarması içindir; böylece yeniden kurulum/kurulum,
eksik paketlenmiş Plugin yolu veya aynı Plugin için eski `channels.<id>`
girdisi gibi bilinen yükseltme kalıntılarını onarabilir. Yapılandırma ilgisiz nedenlerle bozuksa
kurulum yine fail-closed olur ve operatöre `openclaw doctor --fix`
çalıştırmasını söyler.

### Ertelenmiş tam yükleme

Kanal Plugins'leri şu şekilde ertelenmiş yüklemeye dahil olabilir:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Etkinleştirildiğinde OpenClaw, önceden yapılandırılmış kanallar için bile önceden dinleme başlangıç
aşamasında yalnızca `setupEntry` yükler. Tam giriş, gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
  Ertelenmiş yüklemeyi yalnızca `setupEntry` değeriniz, gateway'in dinlemeye başlamadan önce ihtiyaç duyduğu her şeyi
  kaydediyorsa etkinleştirin (kanal kaydı, HTTP rotaları,
  gateway yöntemleri). Tam giriş gerekli başlangıç yeteneklerini sahipleniyorsa
  varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz gateway RPC yöntemleri kaydediyorsa bunları
Plugin'e özgü bir önek altında tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe aittir ve her zaman
`operator.admin` olarak çözülür.

## Plugin manifest'i

Her yerel Plugin, paket kökünde bir `openclaw.plugin.json` dosyası bulundurmalıdır.
OpenClaw bunu, Plugin kodunu çalıştırmadan yapılandırmayı doğrulamak için kullanır.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Kanal Plugins'leri için `kind` ve `channels` ekleyin:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Yapılandırması olmayan Plugins'ler bile bir şema taşımalıdır. Boş şema geçerlidir:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Tam şema başvurusu için bkz. [Plugin Manifest'i](/tr/plugins/manifest).

## ClawHub yayımlama

Plugin paketleri için pakete özgü ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Eski yalnızca Skill yayımlama takma adı, Skills içindir. Plugin paketleri
her zaman `clawhub package publish` kullanmalıdır.

## Setup entry

`setup-entry.ts` dosyası, OpenClaw'ın yalnızca kurulum yüzeylerine ihtiyaç duyduğunda yüklediği,
`index.ts` için hafif bir alternatiftir (onboarding, yapılandırma onarımı,
devre dışı kanal incelemesi).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun (kripto kütüphaneleri, CLI kayıtları,
arka plan servisleri) yüklenmesini önler.

Kuruluma güvenli dışa aktarımları yan modüllerde tutan paketlenmiş çalışma alanı kanalları,
`defineSetupPluginEntry(...)` yerine
`openclaw/plugin-sdk/channel-entry-contract` içinden
`defineBundledChannelSetupEntry(...)` kullanabilir. Bu paketlenmiş sözleşme ayrıca isteğe bağlı bir
`runtime` dışa aktarımını da destekler; böylece kurulum zamanı çalışma zamanı bağlantısı hafif ve açık kalır.

**OpenClaw'ın tam giriş yerine `setupEntry` kullandığı durumlar:**

- Kanal devre dışıdır ama kurulum/onboarding yüzeylerine ihtiyaç vardır
- Kanal etkindir ama yapılandırılmamıştır
- Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry` nelerin kaydını yapmalıdır:**

- Kanal Plugin nesnesi (`defineSetupPluginEntry` aracılığıyla)
- Gateway dinlemeye başlamadan önce gerekli olan tüm HTTP rotaları
- Başlangıç sırasında gerekli olan tüm gateway yöntemleri

Bu başlangıç gateway yöntemleri yine de `config.*` veya `update.*` gibi
ayrılmış çekirdek yönetici ad alanlarından kaçınmalıdır.

**`setupEntry` şunları içermemelidir:**

- CLI kayıtları
- Arka plan servisleri
- Ağır çalışma zamanı içe aktarımları (kripto, SDK'lar)
- Yalnızca başlangıçtan sonra gereken gateway yöntemleri

### Dar kurulum yardımcı içe aktarımları

Sıcak yalnızca kurulum yolları için, setup yüzeyinin yalnızca bir bölümüne ihtiyacınız varsa daha geniş
`plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcı seam'lerini tercih edin:

| İçe aktarma yolu                  | Bunun için kullanın                                                                     | Temel dışa aktarımlar                                                                                                                                                                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | `setupEntry` / ertelenmiş kanal başlangıcında kullanılabilir kalan kurulum zamanı çalışma zamanı yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`| ortam farkındalıklı hesap kurulum bağdaştırıcıları                                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                             |
| `plugin-sdk/setup-tools`          | kurulum/yükleme CLI/arşiv/belge yardımcıları                                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                   |

Yapılandırma yaması yardımcıları gibi
`moveSingleAccountChannelSectionToDefaultAccount(...)` dahil olmak üzere tam paylaşılan kurulum
araç kutusunu istediğinizde daha geniş `plugin-sdk/setup` seam'ini kullanın.

Kurulum yama bağdaştırıcıları içe aktarmada sıcak yol açısından güvenli kalır. Bunların paketlenmiş
tek hesap yükseltme sözleşme yüzeyi araması tembeldir; yani
`plugin-sdk/setup-runtime` içe aktarmak, bağdaştırıcı gerçekten kullanılmadan önce paketlenmiş sözleşme yüzeyi
keşfini eager yüklemez.

### Kanala ait tek hesap yükseltmesi

Bir kanal tek hesaplı üst düzey yapılandırmadan
`channels.<id>.accounts.*` yapısına yükseltildiğinde varsayılan paylaşılan davranış, yükseltilen
hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketlenmiş kanallar bu yükseltmeyi kendi kurulum
sözleşme yüzeyleri üzerinden daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesabın
  içine taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten mevcutsa yalnızca bu
  anahtarlar yükseltilen hesaba taşınır; paylaşılan politika/teslim anahtarları
  kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın
  alacağını seçer

Matrix, güncel paketlenmiş örnektir. Tam olarak bir adlandırılmış Matrix hesabı
zaten varsa veya `defaultAccount`, `Ops` gibi mevcut kanonik olmayan bir anahtarı işaret ediyorsa
yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur.

## Yapılandırma şeması

Plugin yapılandırması, manifest'inizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar
Plugins'i şu şekilde yapılandırır:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Plugin'iniz bu yapılandırmayı kayıt sırasında `api.pluginConfig` olarak alır.

Kanala özgü yapılandırma için bunun yerine kanal yapılandırma bölümünü kullanın:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Kanal yapılandırma şemaları oluşturma

Bir Zod şemasını OpenClaw'ın doğruladığı `ChannelConfigSchema`
sarmalayıcısına dönüştürmek için `openclaw/plugin-sdk/core` içinden `buildChannelConfigSchema` kullanın:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Kurulum sihirbazları

Kanal Plugins'leri `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir.
Sihirbaz, `ChannelPlugin` üzerindeki bir `ChannelSetupWizard` nesnesidir:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` türü `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` ve daha fazlasını destekler.
Tam örnekler için paketlenmiş Plugin paketlerine (örneğin Discord Plugin'i `src/channel.setup.ts`) bakın.

Yalnızca standart
`note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için `openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum
yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` ve
`createNestedChannelParsedAllowFromPrompt(...)`.

Yalnızca etiketler, skorlar ve isteğe bağlı
ek satırlarla değişen kanal kurulum durumu blokları için, her Plugin'de aynı `status` nesnesini elde yazmak yerine
`openclaw/plugin-sdk/setup` içinden `createStandardChannelSetupStatus(...)`
tercih edin.

Yalnızca belirli bağlamlarda görünmesi gereken isteğe bağlı kurulum yüzeyleri için
`openclaw/plugin-sdk/channel-setup` içinden `createOptionalChannelSetupSurface` kullanın:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// { setupAdapter, setupWizard } döndürür
```

`plugin-sdk/channel-setup`, bu isteğe bağlı kurulum yüzeyinin yalnızca bir yarısına ihtiyaç duyduğunuzda daha düşük düzey
`createOptionalChannelSetupAdapter(...)` ve
`createOptionalChannelSetupWizard(...)` oluşturucularını da dışa aktarır.

Oluşturulan isteğe bağlı bağdaştırıcı/sihirbaz, gerçek yapılandırma yazımlarında fail-closed davranır. Bunlar
`validateInput`,
`applyAccountConfig` ve `finalize` arasında tek bir kurulum-gerekli mesajını yeniden kullanır ve `docsPath`
ayarlandığında bir belge bağlantısı ekler.

İkili dosya destekli kurulum UI'leri için, aynı ikili/durum bağlantısını her kanala kopyalamak yerine paylaşılan devredilmiş yardımcıları tercih edin:

- yalnızca etiketler,
  ipuçları, skorlar ve ikili tespitiyle değişen durum blokları için `createDetectedBinaryStatus(...)`
- yol destekli metin girdileri için `createCliPathTextInput(...)`
- `setupEntry` daha ağır bir tam sihirbaza tembel şekilde iletmek gerektiğinde
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve
  `createDelegatedResolveConfigured(...)`
- `setupEntry` yalnızca
  `textInputs[*].shouldPrompt` kararını devretmek istediğinde `createDelegatedTextInputShouldPrompt(...)`

## Yayımlama ve kurulum

**Harici Plugins:** [ClawHub](/tr/tools/clawhub) veya npm üzerinde yayımlayın, sonra kurun:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw önce ClawHub'ı dener ve otomatik olarak npm'e geri düşer. ClawHub'ı açıkça
zorlayabilirsiniz:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # yalnızca ClawHub
```

Buna karşılık gelen bir `npm:` geçersiz kılması yoktur. ClawHub fallback'inden sonra npm yolunu
istediğinizde normal npm paket spec'ini kullanın:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Depo içi Plugins:** paketlenmiş Plugin çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik
keşfedilirler.

**Kullanıcılar şunları kurabilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Npm kaynaklı kurulumlarda `openclaw plugins install`,
  `npm install --ignore-scripts` çalıştırır (yaşam döngüsü script'leri yok). Plugin bağımlılık
  ağaçlarını saf JS/TS olarak tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

Paketlenmiş OpenClaw'a ait Plugins'ler tek başlangıç onarım istisnasıdır: paketlenmiş
bir kurulum, Plugin yapılandırması, eski kanal yapılandırması veya
onun paketlenmiş varsayılan etkin manifest'i ile bir Plugin'in etkin olduğunu görürse, başlangıç bu Plugin'in eksik
çalışma zamanı bağımlılıklarını içe aktarmadan önce kurar. Üçüncü taraf Plugins'ler başlangıç kurulumlarına
güvenmemelidir; açık Plugin yükleyiciyi kullanmaya devam edin.

## İlgili

- [SDK Giriş Noktaları](/tr/plugins/sdk-entrypoints) -- `definePluginEntry` ve `defineChannelPluginEntry`
- [Plugin Manifest'i](/tr/plugins/manifest) -- tam manifest şema başvurusu
- [Plugins Oluşturma](/tr/plugins/building-plugins) -- adım adım başlangıç kılavuzu
