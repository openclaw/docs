---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - setup-entry.ts ile index.ts arasındaki farkı anlamanız gerekir
    - Plugin yapılandırma şemalarını veya package.json openclaw meta verilerini tanımlıyorsunuz
sidebarTitle: Setup and config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Plugin kurulumu ve yapılandırması
x-i18n:
    generated_at: "2026-07-04T15:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin paketleme (`package.json` meta verileri), manifestler (`openclaw.plugin.json`), kurulum girişleri ve yapılandırma şemaları için başvuru.

<Tip>
**Bir adım adım kılavuz mu arıyorsunuz?** Nasıl yapılır kılavuzları paketlemeyi bağlam içinde ele alır: [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızda, Plugin sistemine Plugin'inizin ne sağladığını bildiren bir `openclaw` alanı gerekir:

<Tabs>
  <Tab title="Channel plugin">
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
  </Tab>
  <Tab title="Provider plugin / ClawHub baseline">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
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
  </Tab>
</Tabs>

<Note>
Plugin'i ClawHub üzerinde harici olarak yayımlarsanız, bu `compat` ve `build` alanları zorunludur. Kanonik yayımlama parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.
</Note>

### `openclaw` alanları

<ParamField path="extensions" type="string[]">
  Giriş noktası dosyaları (paket köküne göreli).
</ParamField>
<ParamField path="setupEntry" type="string">
  Hafif, yalnızca kurulum için giriş (isteğe bağlı).
</ParamField>
<ParamField path="channel" type="object">
  Kurulum, seçici, hızlı başlangıç ve durum yüzeyleri için kanal katalog meta verileri.
</ParamField>
<ParamField path="providers" type="string[]">
  Bu Plugin tarafından kaydedilen sağlayıcı kimlikleri.
</ParamField>
<ParamField path="install" type="object">
  Kurulum ipuçları: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Başlatma davranışı bayrakları.
</ParamField>

### `openclaw.channel`

`openclaw.channel`, çalışma zamanı yüklenmeden önce kanal keşfi ve kurulum yüzeyleri için düşük maliyetli paket meta verileridir.

| Alan                                   | Tür        | Anlamı                                                                        |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonik kanal kimliği.                                                        |
| `label`                                | `string`   | Birincil kanal etiketi.                                                       |
| `selectionLabel`                       | `string`   | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi.         |
| `detailLabel`                          | `string`   | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi. |
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için dokümantasyon yolu.                        |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde dokümantasyon bağlantıları için kullanılan etiketi geçersiz kılar. |
| `blurb`                                | `string`   | Kısa ilk katılım/katalog açıklaması.                                          |
| `order`                                | `number`   | Kanal kataloglarındaki sıralama düzeni.                                       |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama takma adları.                                      |
| `preferOver`                           | `string[]` | Bu kanalın önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal UI katalogları için isteğe bağlı simge/sistem görüntüsü adı.            |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde dokümantasyon bağlantılarından önceki önek metni.          |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim kopyasında etiketli dokümantasyon bağlantısı yerine dokümantasyon yolunu doğrudan göster. |
| `selectionExtras`                      | `string[]` | Seçim kopyasına eklenen ek kısa dizeler.                                      |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı markdown yetenekli olarak işaretler. |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış listeler ve dokümantasyon yüzeyleri için kanal görünürlük denetimleri. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.    |
| `forceAccountBinding`                  | `boolean`  | Yalnızca bir hesap mevcut olsa bile açık hesap bağlamayı zorunlu kılar.       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bu kanal için duyuru hedeflerini çözerken oturum aramasını tercih eder.       |

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

- `configured`: kanalı yapılandırılmış/durum tarzı listeleme yüzeylerine dahil et
- `setup`: kanalı etkileşimli kurulum/yapılandırma seçicilerine dahil et
- `docs`: kanalı dokümantasyon/gezinme yüzeylerinde herkese açık olarak işaretle

<Note>
`showConfigured` ve `showInSetup`, eski takma adlar olarak desteklenmeye devam eder. `exposure` tercih edin.
</Note>

### `openclaw.install`

`openclaw.install` paket meta verileridir, manifest meta verisi değildir.

| Alan                         | Tür                                 | Anlamı                                                                            |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kurulum/güncelleme ve ilk katılımda isteğe bağlı kurulum akışları için kanonik ClawHub belirtimi. |
| `npmSpec`                    | `string`                            | Kurulum/güncelleme yedek akışları için kanonik npm belirtimi.                     |
| `localPath`                  | `string`                            | Yerel geliştirme veya paketlenmiş kurulum yolu.                                   |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Birden fazla kaynak kullanılabilir olduğunda tercih edilen kurulum kaynağı.       |
| `minHostVersion`             | `string`                            | `>=x.y.z` veya `>=x.y.z-prerelease` biçiminde desteklenen minimum OpenClaw sürümü. |
| `expectedIntegrity`          | `string`                            | Sabitlenmiş kurulumlar için genellikle `sha512-...` olan beklenen npm dist bütünlük dizesi. |
| `allowInvalidConfigRecovery` | `boolean`                           | Paketlenmiş-Plugin yeniden kurulum akışlarının belirli eski-yapılandırma hatalarından kurtulmasını sağlar. |
| `requiredPlatformPackages`   | `string[]`                          | npm kurulumu sırasında doğrulanan, gerekli platforma özgü npm takma adları.       |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Etkileşimli ilk katılım, isteğe bağlı kurulum yüzeyleri için `openclaw.install` öğesini de kullanır. Plugin'iniz çalışma zamanı yüklenmeden önce sağlayıcı kimlik doğrulama seçenekleri veya kanal kurulum/katalog meta verileri sunuyorsa, ilk katılım bu seçeneği gösterebilir, ClawHub, npm veya yerel kurulum için sorabilir, Plugin'i kurabilir veya etkinleştirebilir ve ardından seçilen akışa devam edebilir. ClawHub ilk katılım seçenekleri `clawhubSpec` kullanır ve mevcut olduğunda tercih edilir; npm seçenekleri, kayıt defteri `npmSpec` ile güvenilir katalog meta verileri gerektirir; kesin sürümler ve `expectedIntegrity` isteğe bağlı npm sabitlemeleridir. `expectedIntegrity` mevcutsa, kurulum/güncelleme akışları bunu npm için zorunlu kılar. "Ne gösterilecek" meta verilerini `openclaw.plugin.json` içinde, "nasıl kurulacak" meta verilerini ise `package.json` içinde tutun.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    `minHostVersion` ayarlanmışsa, hem kurulum hem de paketlenmemiş manifest-kayıt defteri yüklemesi bunu zorunlu kılar. Daha eski host'lar harici Plugin'leri atlar; geçersiz sürüm dizeleri reddedilir. Paketlenmiş kaynak Plugin'lerin host checkout'u ile aynı sürümde olduğu varsayılır.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Sabitlenmiş npm kurulumları için kesin sürümü `npmSpec` içinde tutun ve beklenen artefakt bütünlüğünü ekleyin:

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

  </Accordion>
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir baypas değildir. Yalnızca dar kapsamlı paketlenmiş-Plugin kurtarması içindir; böylece yeniden kurulum/kurulum, eksik paketlenmiş Plugin yolu veya aynı Plugin için eski `channels.<id>` girdisi gibi bilinen yükseltme artıklarını onarabilir. Yapılandırma ilgisiz nedenlerle bozuksa kurulum yine kapalı şekilde başarısız olur ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.
  </Accordion>
</AccordionGroup>

### Ertelenmiş tam yükleme

Kanal Plugin'leri şu şekilde ertelenmiş yüklemeye dahil olabilir:

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

Etkinleştirildiğinde OpenClaw, zaten yapılandırılmış kanallar için bile dinleme öncesi başlatma aşamasında yalnızca `setupEntry` yükler. Tam giriş, Gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
Ertelenmiş yüklemeyi yalnızca `setupEntry` dosyanız Gateway dinlemeye başlamadan önce ihtiyaç duyduğu her şeyi kaydediyorsa etkinleştirin (kanal kaydı, HTTP rotaları, Gateway yöntemleri). Tam giriş gerekli başlatma yeteneklerine sahipse varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz Gateway RPC yöntemleri kaydediyorsa, bunları Plugin'e özgü bir önekte tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe ait kalır ve her zaman `operator.admin` olarak çözülür.

## Plugin manifesti

Her yerel Plugin, paket kökünde bir `openclaw.plugin.json` ile gelmelidir. OpenClaw bunu, Plugin kodunu çalıştırmadan yapılandırmayı doğrulamak için kullanır.

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

Kanal Plugin'leri için `kind` ve `channels` ekleyin:

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

Config'i olmayan Plugin'ler bile bir şema göndermelidir. Boş bir şema geçerlidir:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Tam şema başvurusu için [Plugin manifest](/tr/plugins/manifest) bölümüne bakın.

## ClawHub yayımlama

Plugin paketleri için pakete özgü ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Eski yalnızca skill yayımlama takma adı Skills içindir. Plugin paketleri her zaman `clawhub package publish` kullanmalıdır.
</Note>

## Kurulum girdisi

`setup-entry.ts` dosyası, OpenClaw yalnızca kurulum yüzeylerine (onboarding, config onarımı, devre dışı kanal incelemesi) ihtiyaç duyduğunda yüklediği `index.ts` dosyasına hafif bir alternatiftir.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun (kripto kitaplıkları, CLI kayıtları, arka plan hizmetleri) yüklenmesini önler.

Kurulum açısından güvenli dışa aktarımları sidecar modüllerde tutan paketlenmiş çalışma alanı kanalları, `defineSetupPluginEntry(...)` yerine `openclaw/plugin-sdk/channel-entry-contract` içindeki `defineBundledChannelSetupEntry(...)` öğesini kullanabilir. Bu paketlenmiş sözleşme ayrıca isteğe bağlı bir `runtime` dışa aktarımını destekler; böylece kurulum zamanı çalışma zamanı kablolaması hafif ve açık kalabilir.

<AccordionGroup>
  <Accordion title="OpenClaw setupEntry öğesini tam girdi yerine ne zaman kullanır">
    - Kanal devre dışıdır ancak kurulum/onboarding yüzeylerine ihtiyaç duyar.
    - Kanal etkindir ancak yapılandırılmamıştır.
    - Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry ne kaydetmelidir">
    - Kanal Plugin nesnesi (`defineSetupPluginEntry` aracılığıyla).
    - Gateway dinlemeye başlamadan önce gerekli olan HTTP rotaları.
    - Başlatma sırasında gereken Gateway yöntemleri.

    Bu başlatma Gateway yöntemleri yine de `config.*` veya `update.*` gibi ayrılmış çekirdek yönetim ad alanlarından kaçınmalıdır.

  </Accordion>
  <Accordion title="setupEntry neleri içermemelidir">
    - CLI kayıtları.
    - Arka plan hizmetleri.
    - Ağır çalışma zamanı içe aktarımları (kripto, SDK'ler).
    - Yalnızca başlatmadan sonra gereken Gateway yöntemleri.

  </Accordion>
</AccordionGroup>

### Dar kurulum yardımcı içe aktarımları

Sıcak yalnızca kurulum yolları için, kurulum yüzeyinin yalnızca bir kısmına ihtiyaç duyduğunuzda daha geniş `plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcı bağlantı noktalarını tercih edin:

| İçe aktarma yolu                   | Ne için kullanılır                                                                        | Ana dışa aktarımlar                                                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / ertelenmiş kanal başlatmasında kullanılabilir kalan kurulum zamanı çalışma zamanı yardımcıları | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/setup-runtime` kullanın           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | kurulum/yükleme CLI/arşiv/doküman yardımcıları                                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

`moveSingleAccountChannelSectionToDefaultAccount(...)` gibi config yama yardımcıları dahil tam paylaşılan kurulum araç kutusunu istediğinizde daha geniş `plugin-sdk/setup` bağlantı noktasını kullanın.

Sabit kurulum sihirbazı metni için `createSetupTranslator(...)` kullanın. CLI sihirbaz yerel ayarını (`OPENCLAW_LOCALE`, ardından sistem yerel ayar değişkenleri) izler ve İngilizceye geri döner. Plugin'e özgü kurulum metnini Plugin'e ait kodda tutun ve paylaşılan katalog anahtarlarını yalnızca yaygın kurulum etiketleri, durum metni ve resmi paketlenmiş Plugin kurulum metni için kullanın.

Kurulum yama bağdaştırıcıları içe aktarmada sıcak yol açısından güvenli kalır. Paketlenmiş tek hesap yükseltme sözleşme yüzeyi araması tembeldir; bu nedenle `plugin-sdk/setup-runtime` içe aktarmak, bağdaştırıcı gerçekten kullanılmadan önce paketlenmiş sözleşme yüzeyi keşfini hevesle yüklemez.

### Kanalın sahip olduğu tek hesap yükseltme

Bir kanal tek hesaplı üst düzey config'den `channels.<id>.accounts.*` biçimine yükseltildiğinde, varsayılan paylaşılan davranış yükseltilmiş hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketlenmiş kanallar bu yükseltmeyi kurulum sözleşme yüzeyleri üzerinden daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilmiş hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten varsa, yalnızca bu anahtarlar yükseltilmiş hesaba taşınır; paylaşılan ilke/teslimat anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilmiş değerleri hangi mevcut hesabın alacağını seçin

<Note>
Matrix mevcut paketlenmiş örnektir. Tam olarak bir adlandırılmış Matrix hesabı zaten varsa veya `defaultAccount`, `Ops` gibi mevcut kanonik olmayan bir anahtarı işaret ediyorsa, yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur.
</Note>

## Config şeması

Plugin config'i manifest'inizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar Plugin'leri şu yolla yapılandırır:

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

Plugin'iniz bu config'i kayıt sırasında `api.pluginConfig` olarak alır.

Kanala özgü config için bunun yerine kanal config bölümünü kullanın:

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

### Kanal config şemaları oluşturma

Bir Zod şemasını Plugin'e ait config artifact'leri tarafından kullanılan `ChannelConfigSchema` sarmalayıcısına dönüştürmek için `buildChannelConfigSchema` kullanın:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Sözleşmeyi zaten JSON Schema veya TypeBox olarak yazıyorsanız, OpenClaw'ın metadata yollarında Zod'dan JSON Schema'ya dönüşümü atlayabilmesi için doğrudan yardımcıyı kullanın:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

Üçüncü taraf Plugin'ler için soğuk yol sözleşmesi hâlâ Plugin manifest'idir: oluşturulan JSON Schema'yı `openclaw.plugin.json#channelConfigs` içine yansıtın; böylece config şeması, kurulum ve UI yüzeyleri çalışma zamanı kodunu yüklemeden `channels.<id>` öğesini inceleyebilir.

## Kurulum sihirbazları

Kanal Plugin'leri `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir. Sihirbaz, `ChannelPlugin` üzerindeki bir `ChannelSetupWizard` nesnesidir:

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

`ChannelSetupWizard` türü `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` ve daha fazlasını destekler. Tam örnekler için paketlenmiş Plugin paketlerine (örneğin Discord Plugin'i `src/channel.setup.ts`) bakın.

<AccordionGroup>
  <Accordion title="Paylaşılan allowFrom istemleri">
    Yalnızca standart `note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için `openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` ve `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standart kanal kurulum durumu">
    Yalnızca etiketler, puanlar ve isteğe bağlı ek satırlara göre değişen kanal kurulum durumu blokları için her Plugin'de aynı `status` nesnesini elle yazmak yerine `openclaw/plugin-sdk/setup` içindeki `createStandardChannelSetupStatus(...)` öğesini tercih edin.
  </Accordion>
  <Accordion title="İsteğe bağlı kanal kurulum yüzeyi">
    Yalnızca belirli bağlamlarda görünmesi gereken isteğe bağlı kurulum yüzeyleri için `openclaw/plugin-sdk/channel-setup` içindeki `createOptionalChannelSetupSurface` öğesini kullanın:

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

    `plugin-sdk/channel-setup` ayrıca isteğe bağlı kurulum yüzeyinin yalnızca bir yarısına ihtiyaç duyduğunuzda daha düşük seviyeli `createOptionalChannelSetupAdapter(...)` ve `createOptionalChannelSetupWizard(...)` oluşturucularını da sunar.

    Oluşturulan isteğe bağlı bağdaştırıcı/sihirbaz gerçek config yazımlarında kapalı olarak başarısız olur. `validateInput`, `applyAccountConfig` ve `finalize` boyunca tek bir yükleme gerekli mesajını yeniden kullanırlar ve `docsPath` ayarlandığında bir doküman bağlantısı eklerler.

  </Accordion>
  <Accordion title="İkili dosya destekli kurulum yardımcıları">
    İkili dosya destekli kurulum UI'ları için aynı ikili/durum bağlantı kodunu her kanala kopyalamak yerine paylaşılan temsilci yardımcılarını tercih edin:

    - Yalnızca etiketler, ipuçları, puanlar ve ikili algılama açısından değişen durum blokları için `createDetectedBinaryStatus(...)`
    - Yol destekli metin girişleri için `createCliPathTextInput(...)`
    - `setupEntry` daha ağır tam sihirbaza tembel şekilde yönlendirme yapması gerektiğinde `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve `createDelegatedResolveConfigured(...)`
    - `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını devretmesi gerektiğinde `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## Yayımlama ve yükleme

**Harici Plugin'ler:** [ClawHub](/clawhub) üzerinde yayımlayın, ardından yükleyin:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Yalın paket belirtimleri, lansman geçişi sırasında npm'den yüklenir.

  </Tab>
  <Tab title="Yalnızca ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm paket belirtimi">
    Bir paket henüz ClawHub'a taşınmadıysa veya geçiş sırasında doğrudan bir
    npm yükleme yoluna ihtiyacınız varsa npm kullanın:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Depo içi Plugin'ler:** paketlenmiş Plugin çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik olarak keşfedilirler.

**Kullanıcılar şunu yükleyebilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm kaynaklı yüklemelerde, `openclaw plugins install` paketi `~/.openclaw/npm/projects` altında Plugin başına ayrı bir projeye, yaşam döngüsü betikleri devre dışı bırakılmış şekilde yükler. Plugin bağımlılık ağaçlarını saf JS/TS tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

<Note>
Gateway başlangıcı Plugin bağımlılıklarını yüklemez. Bağımlılık yakınsamasından npm/git/ClawHub yükleme akışları sorumludur; yerel Plugin'lerin bağımlılıkları önceden yüklenmiş olmalıdır.
</Note>

Paketlenmiş paket meta verileri açıktır; Gateway başlangıcında derlenmiş JavaScript'ten çıkarım yapılmaz. Çalışma zamanı bağımlılıkları, onlara sahip olan Plugin paketinde yer alır; paketlenmiş OpenClaw başlangıcı Plugin bağımlılıklarını hiçbir zaman onarmaz veya yansıtmaz.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — adım adım başlangıç kılavuzu
- [Plugin manifesti](/tr/plugins/manifest) — tam manifest şeması başvurusu
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry`
