---
read_when:
    - Bir eklentiye kurulum sihirbazı ekliyorsanız
    - setup-entry.ts ile index.ts arasındaki farkı anlamanız gerekiyorsa
    - Eklenti yapılandırma şemalarını veya package.json içindeki openclaw meta verilerini tanımlıyorsanız
sidebarTitle: Setup and Config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Eklenti Kurulumu ve Yapılandırması
x-i18n:
    generated_at: "2026-04-05T14:03:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68fda27be1c89ea6ba906833113e9190ddd0ab358eb024262fb806746d54f7bf
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Eklenti Kurulumu ve Yapılandırması

Eklenti paketleme (`package.json` meta verileri), manifestler
(`openclaw.plugin.json`), kurulum girişleri ve yapılandırma şemaları için başvuru.

<Tip>
  **Adım adım bir kılavuz mu arıyorsunuz?** Nasıl yapılır kılavuzları, paketlemeyi bağlam içinde ele alır:
  [Kanal Eklentileri](/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve
  [Sağlayıcı Eklentileri](/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızda, eklenti sistemine
eklentinizin ne sağladığını bildiren bir `openclaw` alanı bulunmalıdır:

**Kanal eklentisi:**

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

**Sağlayıcı eklentisi / ClawHub yayın temel yapısı:**

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

Eklentiyi dışarıda ClawHub üzerinde yayımlıyorsanız, bu `compat` ve `build`
alanları zorunludur. Kanonik yayın kod parçaları
`docs/snippets/plugin-publish/` içinde bulunur.

### `openclaw` alanları

| Alan         | Tür        | Açıklama                                                                                               |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Giriş noktası dosyaları (paket köküne göre)                                                            |
| `setupEntry` | `string`   | Hafif, yalnızca kurulum için giriş (isteğe bağlı)                                                      |
| `channel`    | `object`   | Kurulum, seçici, hızlı başlangıç ve durum yüzeyleri için kanal katalog meta verileri                   |
| `providers`  | `string[]` | Bu eklenti tarafından kaydedilen sağlayıcı kimlikleri                                                  |
| `install`    | `object`   | Kurulum ipuçları: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Başlatma davranışı işaretleri                                                                           |

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
| `docsLabel`                            | `string`   | Belge bağlantılarında kanal kimliğinden farklı olması gereken etiket.         |
| `blurb`                                | `string`   | Kısa onboarding/katalog açıklaması.                                           |
| `order`                                | `number`   | Kanal kataloglarında sıralama düzeni.                                         |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama diğer adları.                                      |
| `preferOver`                           | `string[]` | Bu kanalın önüne geçmesi gereken daha düşük öncelikli eklenti/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal kullanıcı arayüzü katalogları için isteğe bağlı simge/sistem görüntüsü adı. |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde belge bağlantılarından önce gelen önek metin.              |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim metninde etiketli belge bağlantısı yerine belge yolunu doğrudan gösterir. |
| `selectionExtras`                      | `string[]` | Seçim metnine eklenen ilave kısa dizeler.                                     |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler. |
| `showConfigured`                       | `boolean`  | Yapılandırılmış kanal listeleme yüzeylerinin bu kanalı gösterip göstermeyeceğini kontrol eder. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.    |
| `forceAccountBinding`                  | `boolean`  | Yalnızca bir hesap olsa bile açık hesap bağlamasını zorunlu kılar.            |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bu kanal için duyuru hedefleri çözülürken oturum aramasını tercih eder.       |

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
      "quickstartAllowFrom": true
    }
  }
}
```

### `openclaw.install`

`openclaw.install`, manifest meta verisi değil paket meta verisidir.

| Alan                         | Tür                  | Anlamı                                                                           |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kurulum/güncelleme akışları için kanonik npm tanımı.                             |
| `localPath`                  | `string`             | Yerel geliştirme veya paketlenmiş kurulum yolu.                                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Her ikisi de mevcut olduğunda tercih edilen kurulum kaynağı.                     |
| `minHostVersion`             | `string`             | `>=x.y.z` biçiminde desteklenen en düşük OpenClaw sürümü.                        |
| `allowInvalidConfigRecovery` | `boolean`            | Paketlenmiş eklenti yeniden kurulum akışlarının belirli eski yapılandırma hatalarını onarmasına izin verir. |

`minHostVersion` ayarlanmışsa, hem kurulum hem de manifest kayıt defteri yüklemesi
bunu uygular. Daha eski host'lar eklentiyi atlar; geçersiz sürüm dizeleri reddedilir.

`allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel amaçlı bir atlama değildir. Yalnızca dar kapsamlı paketlenmiş eklenti kurtarma içindir; böylece yeniden kurulum/kurulum, eksik paketlenmiş eklenti yolu veya aynı eklenti için eski `channels.<id>`
girdisi gibi bilinen yükseltme kalıntılarını onarabilir. Yapılandırma alakasız nedenlerle bozuksa, kurulum yine hata durumunda kapalı kalır ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.

### Ertelenmiş tam yükleme

Kanal eklentileri şu şekilde ertelenmiş yüklemeyi seçebilir:

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

Etkinleştirildiğinde OpenClaw, önceden yapılandırılmış kanallar için bile
dinleme öncesi başlatma aşamasında yalnızca `setupEntry` yükler.
Tam giriş, gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
  Ertelenmiş yüklemeyi yalnızca `setupEntry` dosyanız gateway'in dinlemeye başlamasından önce ihtiyaç duyduğu her şeyi kaydediyorsa etkinleştirin (kanal kaydı, HTTP yolları, gateway yöntemleri). Tam giriş gerekli başlatma yeteneklerinin sahibiyse varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz gateway RPC yöntemleri kaydediyorsa, bunları
eklentiye özgü bir önekte tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğin sahipliğinde kalır ve her zaman
`operator.admin` olarak çözülür.

## Eklenti manifesti

Her yerel eklenti, paket kökünde bir `openclaw.plugin.json` dosyası göndermelidir.
OpenClaw bunu eklenti kodunu çalıştırmadan yapılandırmayı doğrulamak için kullanır.

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

Kanal eklentileri için `kind` ve `channels` ekleyin:

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

Yapılandırması olmayan eklentiler bile bir şema göndermelidir. Boş şema geçerlidir:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Tam şema başvurusu için [Eklenti Manifesti](/plugins/manifest) bölümüne bakın.

## ClawHub yayımlama

Eklenti paketleri için pakete özgü ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Eski yalnızca-skill yayımlama diğer adı skill'ler içindir. Eklenti paketleri her zaman
`clawhub package publish` kullanmalıdır.

## Kurulum girişi

`setup-entry.ts` dosyası, OpenClaw'ın yalnızca kurulum yüzeylerine ihtiyaç duyduğunda yüklediği
`index.ts` dosyasına göre hafif bir alternatiftir (onboarding, yapılandırma onarımı,
devre dışı kanal incelemesi).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodlarının (kripto kitaplıkları, CLI kayıtları,
arka plan hizmetleri) yüklenmesini önler.

**OpenClaw'ın tam giriş yerine `setupEntry` kullandığı durumlar:**

- Kanal devre dışıdır ama kurulum/onboarding yüzeylerine ihtiyaç vardır
- Kanal etkindir ama yapılandırılmamıştır
- Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry` dosyasının kaydetmesi gerekenler:**

- Kanal eklentisi nesnesi (`defineSetupPluginEntry` aracılığıyla)
- Gateway dinlemesinden önce gerekli tüm HTTP yolları
- Başlatma sırasında gerekli tüm gateway yöntemleri

Bu başlatma gateway yöntemleri yine de `config.*` veya `update.*` gibi
ayrılmış çekirdek yönetici ad alanlarından kaçınmalıdır.

**`setupEntry` içinde OLMAMASI gerekenler:**

- CLI kayıtları
- Arka plan hizmetleri
- Ağır çalışma zamanı içe aktarımları (kripto, SDK'ler)
- Yalnızca başlatmadan sonra gerekli gateway yöntemleri

### Dar kurulum yardımcı içe aktarımları

Sadece kurulum yapılan sıcak yollar için, kurulum yüzeyinin yalnızca bir bölümüne ihtiyaç duyduğunuzda daha geniş
`plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcı yüzeylerini tercih edin:

| İçe aktarma yolu                  | Kullanım amacı                                                                      | Temel dışa aktarımlar                                                                                                                                                                                                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | `setupEntry` / ertelenmiş kanal başlatmasında kullanılabilir kalan kurulum zamanı çalışma zamanı yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | ortam farkındalıklı hesap kurulum bağdaştırıcıları                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`          | kurulum/yükleme CLI/arşiv/belge yardımcıları                                        | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

`moveSingleAccountChannelSectionToDefaultAccount(...)` gibi yapılandırma-yaması yardımcılarını da içeren tam paylaşılan kurulum araç kutusunu istediğinizde daha geniş `plugin-sdk/setup` yüzeyini kullanın.

Kurulum yama bağdaştırıcıları içe aktarma açısından sıcak yol güvenliğini korur. Paketlenmiş
tek hesap yükseltme sözleşme yüzeyi araması tembeldir; bu nedenle
`plugin-sdk/setup-runtime` içe aktarmak, bağdaştırıcı gerçekten kullanılmadan önce paketlenmiş sözleşme yüzeyi keşfini hevesli biçimde yüklemez.

### Kanalın sahibi olduğu tek hesap yükseltmesi

Bir kanal, tek hesaplı üst düzey yapılandırmadan
`channels.<id>.accounts.*` yapısına yükseldiğinde, varsayılan paylaşılan davranış yükseltilen
hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketlenmiş kanallar, kurulum sözleşmesi yüzeyleri üzerinden bu yükseltmeyi daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten mevcutsa, yalnızca bu
  anahtarlar yükseltilen hesaba taşınır; paylaşılan ilke/teslim anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın alacağını seçer

Mevcut paketlenmiş örnek Matrix'tir. Tam olarak bir adlandırılmış Matrix hesabı
zaten varsa veya `defaultAccount`, `Ops` gibi kanonik olmayan mevcut bir anahtarı işaret ediyorsa,
yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur.

## Yapılandırma şeması

Eklenti yapılandırması, manifestinizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar
eklentileri şu yollarla yapılandırır:

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

Eklentiniz bu yapılandırmayı kayıt sırasında `api.pluginConfig` olarak alır.

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

Bir Zod şemasını OpenClaw'ın doğruladığı `ChannelConfigSchema` sarmalayıcısına
dönüştürmek için `openclaw/plugin-sdk/core` içinden `buildChannelConfigSchema` kullanın:

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

Kanal eklentileri, `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir.
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
Tam örnekler için paketlenmiş eklenti paketlerine
(örneğin Discord eklentisinin `src/channel.setup.ts` dosyasına) bakın.

Yalnızca standart
`note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için,
`openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum
yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` ve
`createNestedChannelParsedAllowFromPrompt(...)`.

Yalnızca etiketler, puanlar ve isteğe bağlı
ek satırlara göre değişen kanal kurulum durum blokları için, her eklentide aynı `status` nesnesini elle yazmak yerine
`openclaw/plugin-sdk/setup` içindeki `createStandardChannelSetupStatus(...)`
yardımcısını tercih edin.

Yalnızca belirli bağlamlarda görünmesi gereken isteğe bağlı kurulum yüzeyleri için,
`openclaw/plugin-sdk/channel-setup` içindeki
`createOptionalChannelSetupSurface` kullanın:

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

`plugin-sdk/channel-setup`, yalnızca bu isteğe bağlı kurulum yüzeyinin yarısına ihtiyaç duyduğunuzda daha düşük seviyeli
`createOptionalChannelSetupAdapter(...)` ve
`createOptionalChannelSetupWizard(...)` oluşturucularını da açığa çıkarır.

Oluşturulan isteğe bağlı bağdaştırıcı/sihirbaz, gerçek yapılandırma yazımlarında hata durumunda kapalı kalır. Bunlar
`validateInput`,
`applyAccountConfig` ve `finalize` boyunca tek bir kurulum-gerekli iletisini yeniden kullanır ve `docsPath`
ayarlanmışsa bir belge bağlantısı ekler.

İkili dosya destekli kurulum arayüzleri için, aynı ikili/durum yapıştırıcısını her kanala kopyalamak yerine
paylaşılan delege yardımcılarını tercih edin:

- Yalnızca etiketler,
  ipuçları, puanlar ve ikili dosya algılamasına göre değişen durum blokları için `createDetectedBinaryStatus(...)`
- Yol destekli metin girdileri için `createCliPathTextInput(...)`
- `setupEntry` yalnızca daha ağır bir tam sihirbaza tembel biçimde iletmek zorundaysa
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve
  `createDelegatedResolveConfigured(...)`
- `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını
  devretmek zorundaysa `createDelegatedTextInputShouldPrompt(...)`

## Yayımlama ve kurulum

**Harici eklentiler:** [ClawHub](/tools/clawhub) veya npm üzerinde yayımlayın, ardından kurun:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw önce ClawHub'ı dener ve ardından otomatik olarak npm'ye geri döner. İsterseniz
ClawHub'ı açıkça zorlayabilirsiniz:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # yalnızca ClawHub
```

Buna karşılık gelen bir `npm:` geçersiz kılması yoktur. ClawHub geri dönüşünden sonra npm yolunu
istediğinizde normal npm paket tanımını kullanın:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Depo içi eklentiler:** paketlenmiş eklenti çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik olarak keşfedilirler.

**Kullanıcılar şunu kurabilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm kaynaklı kurulumlar için `openclaw plugins install`,
  `npm install --ignore-scripts` çalıştırır (yaşam döngüsü betikleri yoktur). Eklenti bağımlılık
  ağaçlarını saf JS/TS olarak tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

## İlgili

- [SDK Giriş Noktaları](/plugins/sdk-entrypoints) -- `definePluginEntry` ve `defineChannelPluginEntry`
- [Eklenti Manifesti](/plugins/manifest) -- tam manifest şema başvurusu
- [Eklenti Oluşturma](/plugins/building-plugins) -- adım adım başlangıç kılavuzu
