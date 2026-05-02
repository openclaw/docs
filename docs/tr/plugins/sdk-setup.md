---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - setup-entry.ts ile index.ts arasındaki farkı anlamanız gerekiyor
    - Plugin yapılandırma şemalarını veya package.json openclaw meta verilerini tanımlıyorsunuz
sidebarTitle: Setup and config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Plugin kurulumu ve yapılandırması
x-i18n:
    generated_at: "2026-05-02T20:59:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin paketleme (`package.json` meta verileri), manifestler (`openclaw.plugin.json`), kurulum girişleri ve config şemaları için referans.

<Tip>
**İzlenecek bir açıklamalı kılavuz mu arıyorsunuz?** Nasıl yapılır kılavuzları paketlemeyi bağlam içinde ele alır: [Channel plugin'leri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve [Provider plugin'leri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızda, Plugin sistemine plugin'inizin ne sağladığını söyleyen bir `openclaw` alanı gerekir:

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
Plugin'i ClawHub üzerinde harici olarak yayımlarsanız, bu `compat` ve `build` alanları zorunludur. Standart yayımlama parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.
</Note>

### `openclaw` alanları

<ParamField path="extensions" type="string[]">
  Giriş noktası dosyaları (paket köküne göre göreli).
</ParamField>
<ParamField path="setupEntry" type="string">
  Hafif, yalnızca kuruluma yönelik giriş (isteğe bağlı).
</ParamField>
<ParamField path="channel" type="object">
  Kurulum, seçici, hızlı başlangıç ve durum yüzeyleri için kanal katalog meta verileri.
</ParamField>
<ParamField path="providers" type="string[]">
  Bu Plugin tarafından kaydedilen provider kimlikleri.
</ParamField>
<ParamField path="install" type="object">
  Kurulum ipuçları: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Başlatma davranışı bayrakları.
</ParamField>

### `openclaw.channel`

`openclaw.channel`, çalışma zamanı yüklenmeden önce kanal keşfi ve kurulum yüzeyleri için düşük maliyetli paket meta verisidir.

| Alan                                   | Tür        | Anlamı                                                                        |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Standart kanal kimliği.                                                       |
| `label`                                | `string`   | Birincil kanal etiketi.                                                       |
| `selectionLabel`                       | `string`   | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi.         |
| `detailLabel`                          | `string`   | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi. |
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için doküman yolu.                              |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde doküman bağlantıları için kullanılan geçersiz kılma etiketi. |
| `blurb`                                | `string`   | Kısa onboarding/katalog açıklaması.                                           |
| `order`                                | `number`   | Kanal kataloglarındaki sıralama düzeni.                                       |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama takma adları.                                      |
| `preferOver`                           | `string[]` | Bu kanalın önüne geçmesi gereken daha düşük öncelikli plugin/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal UI katalogları için isteğe bağlı simge/sistem görseli adı.              |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde doküman bağlantılarından önceki ön ek metni.               |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim kopyasında etiketli bir doküman bağlantısı yerine doküman yolunu doğrudan göster. |
| `selectionExtras`                      | `string[]` | Seçim kopyasına eklenen ek kısa dizeler.                                      |
| `markdownCapable`                      | `boolean`  | Kanalı giden biçimlendirme kararları için markdown destekli olarak işaretler. |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış listeler ve doküman yüzeyleri için kanal görünürlüğü denetimleri. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.    |
| `forceAccountBinding`                  | `boolean`  | Yalnızca bir hesap olsa bile açık hesap bağlamayı zorunlu kılar.              |
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

- `configured`: kanalı yapılandırılmış/durum tarzı listeleme yüzeylerine dahil eder
- `setup`: kanalı etkileşimli kurulum/yapılandırma seçicilerine dahil eder
- `docs`: kanalı dokümanlar/gezinme yüzeylerinde kamuya açık olarak işaretler

<Note>
`showConfigured` ve `showInSetup` eski takma adlar olarak desteklenmeye devam eder. `exposure` tercih edin.
</Note>

### `openclaw.install`

`openclaw.install` paket meta verisidir, manifest meta verisi değildir.

| Alan                         | Tür                                 | Anlamı                                                                            |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kurulum/güncelleme ve onboarding sırasında talep üzerine kurulum akışları için standart ClawHub belirtimi. |
| `npmSpec`                    | `string`                            | Kurulum/güncelleme yedek akışları için standart npm belirtimi.                    |
| `localPath`                  | `string`                            | Yerel geliştirme veya paketle birlikte gelen kurulum yolu.                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Birden fazla kaynak mevcut olduğunda tercih edilen kurulum kaynağı.               |
| `minHostVersion`             | `string`                            | `>=x.y.z` veya `>=x.y.z-prerelease` biçiminde desteklenen minimum OpenClaw sürümü. |
| `expectedIntegrity`          | `string`                            | Sabitlenmiş kurulumlar için genellikle `sha512-...` olan beklenen npm dağıtım bütünlüğü dizesi. |
| `allowInvalidConfigRecovery` | `boolean`                           | Paketle gelen plugin yeniden kurulum akışlarının belirli eski config hatalarından toparlanmasını sağlar. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Etkileşimli onboarding, talep üzerine kurulum yüzeyleri için `openclaw.install` değerini de kullanır. Plugin'iniz provider auth seçeneklerini veya kanal kurulum/katalog meta verilerini çalışma zamanı yüklenmeden önce sunuyorsa, onboarding bu seçimi gösterebilir, ClawHub, npm veya yerel kurulum için sorabilir, plugin'i kurabilir ya da etkinleştirebilir ve ardından seçilen akışa devam edebilir. ClawHub onboarding seçenekleri `clawhubSpec` kullanır ve mevcut olduğunda tercih edilir; npm seçenekleri, kayıt defteri `npmSpec` içeren güvenilir katalog meta verileri gerektirir; kesin sürümler ve `expectedIntegrity` isteğe bağlı npm sabitlemeleridir. `expectedIntegrity` mevcutsa kurulum/güncelleme akışları bunu npm için zorunlu kılar. "Ne gösterilecek" meta verisini `openclaw.plugin.json` içinde, "nasıl kurulacak" meta verisini ise `package.json` içinde tutun.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    `minHostVersion` ayarlanırsa hem kurulum hem de paketle gelmeyen manifest kayıt defteri yüklemesi bunu zorunlu kılar. Eski host'lar harici plugin'leri atlar; geçersiz sürüm dizeleri reddedilir. Paketle gelen kaynak plugin'lerin host checkout'ı ile aynı sürümde olduğu varsayılır.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Sabitlenmiş npm kurulumları için kesin sürümü `npmSpec` içinde tutun ve beklenen yapıt bütünlüğünü ekleyin:

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
    `allowInvalidConfigRecovery`, bozuk config'ler için genel bir baypas değildir. Yalnızca dar kapsamlı, paketle gelen plugin toparlanması içindir; böylece yeniden kurulum/kurulum, eksik bir paketle gelen plugin yolu veya aynı plugin için eski `channels.<id>` girdisi gibi bilinen yükseltme kalıntılarını onarabilir. Config ilgisiz nedenlerle bozuksa kurulum yine kapalı şekilde başarısız olur ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.
  </Accordion>
</AccordionGroup>

### Ertelenmiş tam yükleme

Channel plugin'leri şu şekilde ertelenmiş yüklemeyi seçebilir:

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

Etkinleştirildiğinde OpenClaw, ön dinleme başlatma aşamasında, halihazırda yapılandırılmış kanallar için bile yalnızca `setupEntry` değerini yükler. Tam giriş, gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
Ertelenmiş yüklemeyi yalnızca `setupEntry` değeriniz gateway'in dinlemeye başlamadan önce ihtiyaç duyduğu her şeyi kaydediyorsa etkinleştirin (kanal kaydı, HTTP rotaları, gateway yöntemleri). Tam giriş gerekli başlatma yeteneklerine sahipse varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz gateway RPC yöntemleri kaydediyorsa, bunları plugin'e özgü bir ön ekte tutun. Ayrılmış çekirdek admin ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe ait kalır ve her zaman `operator.admin` olarak çözülür.

## Plugin manifesti

Her yerel plugin, paket kökünde bir `openclaw.plugin.json` ile gelmelidir. OpenClaw bunu plugin kodunu çalıştırmadan config doğrulamak için kullanır.

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

Channel plugin'leri için `kind` ve `channels` ekleyin:

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

Config'i olmayan plugin'ler bile bir şema ile gelmelidir. Boş bir şema geçerlidir:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Tam şema referansı için [Plugin manifesti](/tr/plugins/manifest) bölümüne bakın.

## ClawHub yayımlama

Plugin paketleri için pakete özgü ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Eski yalnızca Skills'e yönelik yayınlama takma adı Skills içindir. Plugin paketleri her zaman `clawhub package publish` kullanmalıdır.
</Note>

## Kurulum girdisi

`setup-entry.ts` dosyası, OpenClaw yalnızca kurulum yüzeylerine (onboarding, yapılandırma onarımı, devre dışı kanal denetimi) ihtiyaç duyduğunda yüklediği `index.ts` için hafif bir alternatiftir.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır runtime kodunun (kripto kitaplıkları, CLI kayıtları, arka plan hizmetleri) yüklenmesini önler.

Kurulum açısından güvenli dışa aktarmaları yan modüllerde tutan paketle birlikte gelen çalışma alanı kanalları, `defineSetupPluginEntry(...)` yerine `openclaw/plugin-sdk/channel-entry-contract` içindeki `defineBundledChannelSetupEntry(...)` öğesini kullanabilir. Bu paketle gelen sözleşme, kurulum zamanındaki runtime bağlantılarının hafif ve açık kalabilmesi için isteğe bağlı bir `runtime` dışa aktarımını da destekler.

<AccordionGroup>
  <Accordion title="OpenClaw tam girdi yerine setupEntry kullandığında">
    - Kanal devre dışıdır ancak kurulum/onboarding yüzeylerine ihtiyaç duyar.
    - Kanal etkindir ancak yapılandırılmamıştır.
    - Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry'nin kaydetmesi gerekenler">
    - Kanal Plugin nesnesi (`defineSetupPluginEntry` aracılığıyla).
    - Gateway dinlemeye başlamadan önce gereken HTTP rotaları.
    - Başlatma sırasında gereken Gateway yöntemleri.

    Bu başlatma Gateway yöntemleri yine de `config.*` veya `update.*` gibi ayrılmış temel yönetim ad alanlarından kaçınmalıdır.

  </Accordion>
  <Accordion title="setupEntry'nin içermemesi gerekenler">
    - CLI kayıtları.
    - Arka plan hizmetleri.
    - Ağır runtime içe aktarmaları (kripto, SDK'ler).
    - Yalnızca başlatmadan sonra gereken Gateway yöntemleri.

  </Accordion>
</AccordionGroup>

### Dar kurulum yardımcısı içe aktarmaları

Sıcak yalnızca kurulum yolları için, kurulum yüzeyinin yalnızca bir kısmına ihtiyaç duyduğunuzda daha geniş `plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcısı bağlantı noktalarını tercih edin:

| İçe aktarma yolu                  | Kullanım amacı                                                                            | Temel dışa aktarımlar                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / ertelenmiş kanal başlatmada kullanılabilir kalan kurulum zamanı runtime yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | ortama duyarlı hesap kurulum bağdaştırıcıları                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | kurulum/yükleme CLI/arşiv/docs yardımcıları                                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

`moveSingleAccountChannelSectionToDefaultAccount(...)` gibi yapılandırma yaması yardımcıları dahil olmak üzere paylaşılan kurulum araç takımının tamamını istediğinizde daha geniş `plugin-sdk/setup` bağlantı noktasını kullanın.

Kurulum yama bağdaştırıcıları içe aktarmada sıcak yol açısından güvenli kalır. Paketle gelen tek hesap yükseltme sözleşme yüzeyi araması tembeldir; bu nedenle `plugin-sdk/setup-runtime` içe aktarmak, bağdaştırıcı gerçekten kullanılmadan önce paketle gelen sözleşme yüzeyi keşfini hevesle yüklemez.

### Kanalın sahip olduğu tek hesap yükseltme

Bir kanal tek hesaplı üst düzey yapılandırmadan `channels.<id>.accounts.*` yapısına yükseltildiğinde, varsayılan paylaşılan davranış yükseltilen hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketle gelen kanallar, kurulum sözleşme yüzeyleri aracılığıyla bu yükseltmeyi daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten mevcut olduğunda, yalnızca bu anahtarlar yükseltilen hesaba taşınır; paylaşılan ilke/teslim anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın alacağını seçer

<Note>
Matrix mevcut paketle gelen örnektir. Tam olarak bir adlandırılmış Matrix hesabı zaten varsa veya `defaultAccount`, `Ops` gibi mevcut kanonik olmayan bir anahtara işaret ediyorsa, yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine bu hesabı korur.
</Note>

## Yapılandırma şeması

Plugin yapılandırması, manifestinizdeki JSON Schema ile doğrulanır. Kullanıcılar Plugin'leri şu şekilde yapılandırır:

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

Bir Zod şemasını Plugin'e ait yapılandırma artefaktları tarafından kullanılan `ChannelConfigSchema` sarmalayıcısına dönüştürmek için `buildChannelConfigSchema` kullanın:

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

Sözleşmeyi zaten JSON Schema veya TypeBox olarak yazıyorsanız, OpenClaw'ın meta veri yollarında Zod'dan JSON Schema'ya dönüştürmeyi atlayabilmesi için doğrudan yardımcıyı kullanın:

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

Üçüncü taraf Plugin'ler için soğuk yol sözleşmesi hâlâ Plugin manifestidir: oluşturulan JSON Schema'yı `openclaw.plugin.json#channelConfigs` içine yansıtın; böylece yapılandırma şeması, kurulum ve UI yüzeyleri runtime kodunu yüklemeden `channels.<id>` öğesini inceleyebilir.

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

`ChannelSetupWizard` türü `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` ve daha fazlasını destekler. Tam örnekler için paketle gelen Plugin paketlerine (örneğin Discord Plugin'i `src/channel.setup.ts`) bakın.

<AccordionGroup>
  <Accordion title="Paylaşılan allowFrom istemleri">
    Yalnızca standart `note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için `openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` ve `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standart kanal kurulum durumu">
    Yalnızca etiketlere, skorlara ve isteğe bağlı ek satırlara göre değişen kanal kurulum durumu blokları için her Plugin'de aynı `status` nesnesini elle oluşturmak yerine `openclaw/plugin-sdk/setup` içindeki `createStandardChannelSetupStatus(...)` öğesini tercih edin.
  </Accordion>
  <Accordion title="İsteğe bağlı kanal kurulum yüzeyi">
    Yalnızca belirli bağlamlarda görünmesi gereken isteğe bağlı kurulum yüzeyleri için `openclaw/plugin-sdk/channel-setup` içindeki `createOptionalChannelSetupSurface` kullanın:

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

    `plugin-sdk/channel-setup`, isteğe bağlı yükleme yüzeyinin yalnızca bir yarısına ihtiyaç duyduğunuzda daha düşük seviyeli `createOptionalChannelSetupAdapter(...)` ve `createOptionalChannelSetupWizard(...)` oluşturucularını da dışa aktarır.

    Oluşturulan isteğe bağlı bağdaştırıcı/sihirbaz gerçek yapılandırma yazmalarında kapalı hata verir. `validateInput`, `applyAccountConfig` ve `finalize` genelinde tek bir yükleme gerekli mesajını yeniden kullanır ve `docsPath` ayarlandığında bir docs bağlantısı ekler.

  </Accordion>
  <Accordion title="İkili dosya destekli kurulum yardımcıları">
    İkili dosya destekli kurulum UI'ları için aynı ikili dosya/durum bağlantısını her kanala kopyalamak yerine paylaşılan yetki devredilmiş yardımcıları tercih edin:

    - Yalnızca etiketlere, ipuçlarına, skorlara ve ikili dosya algılamasına göre değişen durum blokları için `createDetectedBinaryStatus(...)`
    - Yol destekli metin girişleri için `createCliPathTextInput(...)`
    - `setupEntry` daha ağır tam bir sihirbaza tembel şekilde yönlendirme yapması gerektiğinde `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve `createDelegatedResolveConfigured(...)`
    - `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını devretmesi gerektiğinde `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## Yayınlama ve yükleme

**Harici Plugin'ler:** [ClawHub](/tr/tools/clawhub) üzerinde yayınlayın, ardından yükleyin:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Yalın paket belirtimleri, başlatma geçişi sırasında npm'den yüklenir.

  </Tab>
  <Tab title="Yalnızca ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm paket belirtimi">
    Bir paket henüz ClawHub'a taşınmadığında veya geçiş sırasında doğrudan bir npm yükleme yoluna ihtiyaç duyduğunuzda npm kullanın:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Repo içi Plugin'ler:** birlikte gelen Plugin çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik olarak keşfedilirler.

**Kullanıcılar şunu yükleyebilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm kaynaklı kurulumlarda `openclaw plugins install`, yaşam döngüsü betikleri devre dışı bırakılmış olarak paketi `~/.openclaw/npm` altına yükler. Plugin bağımlılık ağaçlarını saf JS/TS tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

<Note>
Gateway başlatılması Plugin bağımlılıklarını yüklemez. npm/git/ClawHub kurulum akışları bağımlılık yakınsamasına sahiptir; yerel Plugin'lerin bağımlılıkları zaten yüklenmiş olmalıdır.
</Note>

Birlikte gelen paket meta verileri açıktır; Gateway başlatılırken derlenmiş JavaScript'ten çıkarılmaz. Çalışma zamanı bağımlılıkları, onlara sahip olan Plugin paketinde yer alır; paketlenmiş OpenClaw başlatması Plugin bağımlılıklarını hiçbir zaman onarmaz veya yansıtmaz.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — adım adım başlangıç kılavuzu
- [Plugin bildirimi](/tr/plugins/manifest) — tam bildirim şeması başvurusu
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry`
