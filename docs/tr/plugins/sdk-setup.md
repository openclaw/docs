---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - '`setup-entry.ts` ile `index.ts` arasındaki farkı anlamanız gerekir'
    - Plugin yapılandırma şemalarını veya `package.json` içindeki `openclaw` meta verilerini tanımlıyorsunuz
sidebarTitle: Setup and Config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Plugin Kurulumu ve Yapılandırması
x-i18n:
    generated_at: "2026-04-15T19:41:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf28e25e381a4a38ac478e531586f59612e1a278732597375f87c2eeefc521b
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin Kurulumu ve Yapılandırması

Plugin paketleme (`package.json` meta verileri), manifestler
(`openclaw.plugin.json`), kurulum girişleri ve yapılandırma şemaları için
başvuru.

<Tip>
  **Adım adım bir rehber mi arıyorsunuz?** Nasıl yapılır rehberleri paketlemeyi bağlam içinde ele alır:
  [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve
  [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızda, plugin sistemine plugin'inizin ne sağladığını söyleyen bir `openclaw` alanı bulunmalıdır:

**Kanal plugin'i:**

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

**Sağlayıcı plugin'i / ClawHub yayımlama tabanı:**

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

Plugin'i ClawHub üzerinde harici olarak yayımlıyorsanız, bu `compat` ve `build`
alanları zorunludur. Kanonik yayımlama parçacıkları
`docs/snippets/plugin-publish/` içinde bulunur.

### `openclaw` alanları

| Alan         | Tür        | Açıklama                                                                                              |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Giriş noktası dosyaları (paket kök dizinine göre)                                                     |
| `setupEntry` | `string`   | Yalnızca kurulum için hafif giriş (isteğe bağlı)                                                      |
| `channel`    | `object`   | Kurulum, seçici, hızlı başlangıç ve durum yüzeyleri için kanal katalog meta verileri                  |
| `providers`  | `string[]` | Bu plugin tarafından kaydedilen sağlayıcı kimlikleri                                                  |
| `install`    | `object`   | Kurulum ipuçları: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Başlatma davranışı bayrakları                                                                          |

### `openclaw.channel`

`openclaw.channel`, çalışma zamanı yüklenmeden önce kanal keşfi ve kurulum
yüzeyleri için düşük maliyetli paket meta verisidir.

| Alan                                   | Tür        | Anlamı                                                                        |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonik kanal kimliği.                                                        |
| `label`                                | `string`   | Birincil kanal etiketi.                                                       |
| `selectionLabel`                       | `string`   | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi.         |
| `detailLabel`                          | `string`   | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi. |
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için belge yolu.                                |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde belge bağlantıları için kullanılan geçersiz kılma etiketi. |
| `blurb`                                | `string`   | Kısa onboarding/katalog açıklaması.                                           |
| `order`                                | `number`   | Kanal kataloglarındaki sıralama düzeni.                                       |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama diğer adları.                                      |
| `preferOver`                           | `string[]` | Bu kanalın daha üstte yer alması gereken daha düşük öncelikli plugin/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal UI katalogları için isteğe bağlı simge/system-image adı.                |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde belge bağlantılarından önce gelen önek metin.              |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim metninde etiketli bir belge bağlantısı yerine belge yolunu doğrudan gösterir. |
| `selectionExtras`                      | `string[]` | Seçim metnine eklenen kısa ek dizeler.                                        |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler. |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış listeler ve belge yüzeyleri için kanal görünürlük denetimleri. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.    |
| `forceAccountBinding`                  | `boolean`  | Yalnızca bir hesap olsa bile açık hesap bağlamayı zorunlu kılar.              |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Duyuru hedeflerini çözümlerken bu kanal için oturum aramasını tercih eder.    |

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
- `setup`: kanalı etkileşimli kurulum/yapılandırma seçicilerine dahil eder
- `docs`: kanalı belge/gezinme yüzeylerinde herkese açık olarak işaretler

`showConfigured` ve `showInSetup` eski takma adlar olarak desteklenmeye devam eder. Tercihen
`exposure` kullanın.

### `openclaw.install`

`openclaw.install`, manifest meta verisi değil, paket meta verisidir.

| Alan                         | Tür                  | Anlamı                                                                          |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kurulum/güncelleme akışları için kanonik npm belirtimi.                         |
| `localPath`                  | `string`             | Yerel geliştirme veya paketlenmiş kurulum yolu.                                 |
| `defaultChoice`              | `"npm"` \| `"local"` | Her ikisi de mevcut olduğunda tercih edilen kurulum kaynağı.                    |
| `minHostVersion`             | `string`             | `>=x.y.z` biçimindeki minimum desteklenen OpenClaw sürümü.                      |
| `allowInvalidConfigRecovery` | `boolean`            | Paketlenmiş plugin yeniden kurulum akışlarının belirli eski yapılandırma hatalarından kurtulmasına izin verir. |

`minHostVersion` ayarlanmışsa, hem kurulum hem de manifest-kayıt yükleme bunu
zorunlu kılar. Daha eski host'lar plugin'i atlar; geçersiz sürüm dizeleri reddedilir.

`allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir atlama yolu değildir. Bu,
yalnızca dar kapsamlı paketlenmiş plugin kurtarma içindir; böylece yeniden kurulum/kurulum,
eksik paketlenmiş plugin yolu veya aynı plugin için eski `channels.<id>`
girdisi gibi bilinen yükseltme kalıntılarını onarabilir. Yapılandırma ilgisiz nedenlerle bozuksa, kurulum
yine kapalı şekilde başarısız olur ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.

### Ertelenmiş tam yükleme

Kanal plugin'leri şu şekilde ertelenmiş yüklemeyi tercih edebilir:

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

Etkinleştirildiğinde, OpenClaw ön-dinleme başlatma aşamasında, daha önce yapılandırılmış kanallar için bile yalnızca `setupEntry` yükler. Tam giriş, Gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
  Ertelenmiş yüklemeyi yalnızca `setupEntry` dosyanız, Gateway dinlemeye başlamadan önce ihtiyaç duyduğu her şeyi kaydediyorsa etkinleştirin (kanal kaydı, HTTP rotaları, Gateway yöntemleri). Tam giriş gerekli başlatma yeteneklerine sahipse, varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz Gateway RPC yöntemleri kaydediyorsa, bunları
plugin'e özgü bir önekte tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe aittir ve her zaman
`operator.admin` olarak çözülür.

## Plugin manifesti

Her yerel plugin, paket kök dizininde bir `openclaw.plugin.json` ile gelmelidir.
OpenClaw bunu, plugin kodunu çalıştırmadan yapılandırmayı doğrulamak için kullanır.

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

Kanal plugin'leri için `kind` ve `channels` ekleyin:

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

Yapılandırması olmayan plugin'ler bile bir şema ile gelmelidir. Boş bir şema geçerlidir:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Tam şema başvurusu için bkz. [Plugin Manifesti](/tr/plugins/manifest).

## ClawHub yayımlama

Plugin paketleri için pakete özgü ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Eski, yalnızca Skills için yayımlama takma adı Skills içindir. Plugin paketleri
her zaman `clawhub package publish` kullanmalıdır.

## Kurulum girişi

`setup-entry.ts` dosyası, OpenClaw'un yalnızca kurulum yüzeylerine ihtiyaç duyduğunda yüklediği
(onboarding, yapılandırma onarımı,
devre dışı kanal incelemesi) `index.ts` için hafif bir alternatiftir.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun (kriptografi kütüphaneleri, CLI kayıtları,
arka plan hizmetleri) yüklenmesini önler.

Kuruluma güvenli dışa aktarımları yardımcı modüllerde tutan paketlenmiş çalışma alanı kanalları,
`defineSetupPluginEntry(...)` yerine
`openclaw/plugin-sdk/channel-entry-contract` içinden `defineBundledChannelSetupEntry(...)`
kullanabilir. Bu paketlenmiş sözleşme ayrıca isteğe bağlı bir
`runtime` dışa aktarımını da destekler; böylece kurulum zamanındaki çalışma zamanı bağlantıları hafif ve açık kalabilir.

**OpenClaw'un tam giriş yerine `setupEntry` kullandığı durumlar:**

- Kanal devre dışıdır ancak kurulum/onboarding yüzeylerine ihtiyaç duyar
- Kanal etkindir ancak yapılandırılmamıştır
- Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry` dosyasının kaydetmesi gerekenler:**

- Kanal plugin nesnesi (`defineSetupPluginEntry` aracılığıyla)
- Gateway dinlemeye başlamadan önce gerekli tüm HTTP rotaları
- Başlatma sırasında gereken tüm Gateway yöntemleri

Bu başlatma Gateway yöntemleri yine de `config.*` veya `update.*` gibi ayrılmış çekirdek yönetici
ad alanlarından kaçınmalıdır.

**`setupEntry` içinde OLMAMASI gerekenler:**

- CLI kayıtları
- Arka plan hizmetleri
- Ağır çalışma zamanı içe aktarımları (kriptografi, SDK'ler)
- Yalnızca başlatmadan sonra gereken Gateway yöntemleri

### Dar kurulum yardımcı içe aktarımları

Yalnızca kurulum için kullanılan sıcak yollar için, kurulum yüzeyinin yalnızca bir bölümüne ihtiyacınız olduğunda daha geniş
`plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcı dikişlerini tercih edin:

| İçe aktarma yolu                    | Kullanım amacı                                                                          | Temel dışa aktarımlar                                                                                                                                                                                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | `setupEntry` / ertelenmiş kanal başlatmasında kullanılabilir kalan kurulum zamanı çalışma zamanı yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | ortama duyarlı hesap kurulum bağdaştırıcıları                                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`            | kurulum/yükleme CLI/arşiv/belge yardımcıları                                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Yapılandırma yama yardımcıları gibi
`moveSingleAccountChannelSectionToDefaultAccount(...)` da dahil olmak üzere tam paylaşılan kurulum
araç kutusunu istediğinizde daha geniş `plugin-sdk/setup` dikişini kullanın.

Kurulum yama bağdaştırıcıları, içe aktarıldığında sıcak yol açısından güvenli kalır. Paketlenmiş
tek hesap yükseltme sözleşme-yüzeyi araması tembeldir; bu nedenle
`plugin-sdk/setup-runtime` içe aktarmak, bağdaştırıcı gerçekten kullanılmadan önce paketlenmiş sözleşme-yüzeyi
keşfini hevesli şekilde yüklemez.

### Kanala ait tek hesap yükseltmesi

Bir kanal, tek hesaplı üst düzey bir yapılandırmadan
`channels.<id>.accounts.*` yapısına yükseltildiğinde, varsayılan paylaşılan davranış yükseltilen
hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketlenmiş kanallar, kurulum
sözleşme yüzeyleri aracılığıyla bu yükseltmeyi daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen
  hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten mevcutsa, yalnızca bu
  anahtarlar yükseltilen hesaba taşınır; paylaşılan ilke/teslim anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın
  alacağını seçer

Matrix mevcut paketlenmiş örnektir. Tam olarak bir adlandırılmış Matrix hesabı
zaten varsa veya `defaultAccount`, `Ops` gibi mevcut ancak kanonik olmayan bir anahtarı işaret ediyorsa,
yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine bu hesabı korur.

## Yapılandırma şeması

Plugin yapılandırması, manifestinizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar
plugin'leri şu şekilde yapılandırır:

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

Plugin'iniz, kayıt sırasında bu yapılandırmayı `api.pluginConfig` olarak alır.

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

Bir Zod şemasını OpenClaw'un doğruladığı `ChannelConfigSchema`
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

Kanal plugin'leri, `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir.
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
Tam örnekler için paketlenmiş plugin paketlerine bakın (örneğin Discord plugin'i `src/channel.setup.ts`).

Yalnızca standart
`note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için, `openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum
yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` ve
`createNestedChannelParsedAllowFromPrompt(...)`.

Yalnızca etiketler, puanlar ve isteğe bağlı
ek satırlar bakımından değişen kanal kurulum durum blokları için, aynı `status` nesnesini
her plugin'de elle yazmak yerine `openclaw/plugin-sdk/setup` içindeki `createStandardChannelSetupStatus(...)`
kullanın.

Yalnızca belirli bağlamlarda görünmesi gereken isteğe bağlı kurulum yüzeyleri için,
`openclaw/plugin-sdk/channel-setup` içinden `createOptionalChannelSetupSurface` kullanın:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup`, ayrıca
isteğe bağlı yükleme yüzeyinin yalnızca bir yarısına ihtiyacınız olduğunda daha düşük seviyeli
`createOptionalChannelSetupAdapter(...)` ve
`createOptionalChannelSetupWizard(...)` oluşturucularını da dışa aktarır.

Oluşturulan isteğe bağlı bağdaştırıcı/sihirbaz, gerçek yapılandırma yazımlarında kapalı şekilde başarısız olur. Bunlar
`validateInput`,
`applyAccountConfig` ve `finalize` genelinde tek bir yükleme-gerekli iletisini yeniden kullanır ve `docsPath`
ayarlandığında bir belge bağlantısı ekler.

İkili dosya destekli kurulum UI'leri için, her kanala aynı ikili/durum yapıştırıcısını
kopyalamak yerine paylaşılan devredilmiş yardımcıları tercih edin:

- Yalnızca etiketler,
  ipuçları, puanlar ve ikili algılama bakımından değişen durum blokları için `createDetectedBinaryStatus(...)`
- Yol destekli metin girdileri için `createCliPathTextInput(...)`
- `setupEntry` tembel şekilde daha ağır bir tam sihirbaza iletmesi gerektiğinde
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve
  `createDelegatedResolveConfigured(...)`
- `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını
  devretmek zorunda olduğunda `createDelegatedTextInputShouldPrompt(...)`

## Yayımlama ve kurulum

**Harici plugin'ler:** [ClawHub](/tr/tools/clawhub) veya npm'e yayımlayın, ardından kurun:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw önce ClawHub'ı dener ve otomatik olarak npm'e geri döner. Ayrıca
ClawHub'ı açıkça zorlayabilirsiniz:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # Yalnızca ClawHub
```

Buna karşılık gelen bir `npm:` geçersiz kılması yoktur. ClawHub geri dönüşünden sonra npm yolunu
istediğinizde normal npm paket belirtimini kullanın:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Depo içi plugin'ler:** paketlenmiş plugin çalışma alanı ağacının altına yerleştirin; bunlar derleme sırasında otomatik olarak
keşfedilir.

**Kullanıcılar şunu yükleyebilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm kaynaklı kurulumlar için, `openclaw plugins install`
  `npm install --ignore-scripts` çalıştırır (yaşam döngüsü betikleri yoktur). Plugin bağımlılık
  ağaçlarını saf JS/TS tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

## İlgili

- [SDK Giriş Noktaları](/tr/plugins/sdk-entrypoints) -- `definePluginEntry` ve `defineChannelPluginEntry`
- [Plugin Manifesti](/tr/plugins/manifest) -- tam manifest şema başvurusu
- [Plugin Oluşturma](/tr/plugins/building-plugins) -- adım adım başlangıç rehberi
