---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - setup-entry.ts ve index.ts arasındaki farkı anlamanız gerekir
    - Plugin yapılandırma şemalarını veya package.json openclaw meta verilerini tanımlıyorsunuz
sidebarTitle: Setup and config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Plugin kurulumu ve yapılandırması
x-i18n:
    generated_at: "2026-05-02T09:03:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Paketleme (`package.json` meta verileri), manifestler (`openclaw.plugin.json`), kurulum girişleri ve yapılandırma şemaları için Plugin başvurusu.

<Tip>
**Adım adım bir rehber mi arıyorsunuz?** Nasıl yapılır kılavuzları paketlemeyi bağlam içinde ele alır: [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızın, Plugin sistemine Plugin'inizin ne sağladığını söyleyen bir `openclaw` alanına ihtiyacı vardır:

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
Plugin'i ClawHub üzerinde harici olarak yayımlarsanız, bu `compat` ve `build` alanları zorunludur. Kanonik yayımlama parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.
</Note>

### `openclaw` alanları

<ParamField path="extensions" type="string[]">
  Giriş noktası dosyaları (paket kök dizinine göre).
</ParamField>
<ParamField path="setupEntry" type="string">
  Hafif, yalnızca kurulum amaçlı giriş (isteğe bağlı).
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

`openclaw.channel`, çalışma zamanı yüklenmeden önce kanal keşfi ve kurulum yüzeyleri için düşük maliyetli paket meta verisidir.

| Alan                                   | Tür        | Anlamı                                                                        |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonik kanal kimliği.                                                        |
| `label`                                | `string`   | Birincil kanal etiketi.                                                       |
| `selectionLabel`                       | `string`   | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi.         |
| `detailLabel`                          | `string`   | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi. |
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için dokümantasyon yolu.                        |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde dokümantasyon bağlantıları için kullanılan geçersiz kılma etiketi. |
| `blurb`                                | `string`   | Kısa ilk kullanım/katalog açıklaması.                                         |
| `order`                                | `number`   | Kanal kataloglarındaki sıralama düzeni.                                       |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama takma adları.                                      |
| `preferOver`                           | `string[]` | Bu kanalın önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal UI katalogları için isteğe bağlı ikon/sistem görüntüsü adı.             |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde dokümantasyon bağlantılarından önceki önek metni.          |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim metninde etiketli dokümantasyon bağlantısı yerine dokümantasyon yolunu doğrudan gösterir. |
| `selectionExtras`                      | `string[]` | Seçim metnine eklenen ek kısa dizgeler.                                       |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler. |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış listeler ve dokümantasyon yüzeyleri için kanal görünürlüğü kontrolleri. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.    |
| `forceAccountBinding`                  | `boolean`  | Yalnızca bir hesap olduğunda bile açık hesap bağlamayı zorunlu kılar.         |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bu kanal için duyuru hedefleri çözümlenirken oturum aramasını tercih eder.    |

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
- `docs`: kanalı dokümantasyon/gezinme yüzeylerinde herkese açık olarak işaretler

<Note>
`showConfigured` ve `showInSetup`, eski takma adlar olarak desteklenmeye devam eder. `exposure` tercih edin.
</Note>

### `openclaw.install`

`openclaw.install` paket meta verisidir, manifest meta verisi değildir.

| Alan                         | Tür                  | Anlamı                                                                           |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kurulum/güncelleme akışları için kanonik npm belirtimi.                           |
| `localPath`                  | `string`             | Yerel geliştirme veya paketlenmiş kurulum yolu.                                   |
| `defaultChoice`              | `"npm"` \| `"local"` | Her ikisi de mevcut olduğunda tercih edilen kurulum kaynağı.                      |
| `minHostVersion`             | `string`             | `>=x.y.z` veya `>=x.y.z-prerelease` biçimindeki minimum desteklenen OpenClaw sürümü. |
| `expectedIntegrity`          | `string`             | Sabitlenmiş kurulumlar için genellikle `sha512-...` olan beklenen npm dağıtım bütünlüğü dizgesi. |
| `allowInvalidConfigRecovery` | `boolean`            | Paketlenmiş Plugin yeniden kurulum akışlarının belirli eski yapılandırma hatalarından kurtulmasına izin verir. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Etkileşimli ilk kullanım da talep üzerine kurulum yüzeyleri için `openclaw.install` kullanır. Plugin'iniz, çalışma zamanı yüklenmeden önce sağlayıcı kimlik doğrulama seçeneklerini veya kanal kurulum/katalog meta verilerini açığa çıkarıyorsa, ilk kullanım bu seçeneği gösterebilir, npm ve yerel kurulum arasında seçim isteyebilir, Plugin'i kurabilir veya etkinleştirebilir, ardından seçilen akışa devam edebilir. Npm ilk kullanım seçenekleri, kayıt defteri `npmSpec` değerine sahip güvenilir katalog meta verileri gerektirir; tam sürümler ve `expectedIntegrity` isteğe bağlı sabitlemelerdir. `expectedIntegrity` varsa, kurulum/güncelleme akışları bunu zorunlu kılar. "Ne gösterilecek" meta verilerini `openclaw.plugin.json` içinde, "nasıl kurulacak" meta verilerini ise `package.json` içinde tutun.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    `minHostVersion` ayarlanmışsa, hem kurulum hem de paketlenmemiş manifest-kayıt defteri yüklemesi bunu zorunlu kılar. Eski ana makineler harici Plugin'leri atlar; geçersiz sürüm dizgeleri reddedilir. Paketlenmiş kaynak Plugin'lerin ana makine checkout'ı ile aynı sürümde olduğu varsayılır.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Sabitlenmiş npm kurulumları için tam sürümü `npmSpec` içinde tutun ve beklenen yapıt bütünlüğünü ekleyin:

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
    `allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir baypas değildir. Yalnızca dar kapsamlı paketlenmiş Plugin kurtarma içindir; böylece yeniden kurulum/kurulum, eksik paketlenmiş Plugin yolu veya aynı Plugin için eski `channels.<id>` girdisi gibi bilinen yükseltme artıklarını onarabilir. Yapılandırma ilgisiz nedenlerle bozuksa, kurulum yine güvenli biçimde başarısız olur ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.
  </Accordion>
</AccordionGroup>

### Ertelenmiş tam yükleme

Kanal Plugin'leri şu şekilde ertelenmiş yüklemeyi tercih edebilir:

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

Etkinleştirildiğinde OpenClaw, zaten yapılandırılmış kanallar için bile dinleme öncesi başlatma aşamasında yalnızca `setupEntry` yükler. Tam giriş, gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
Ertelenmiş yüklemeyi yalnızca `setupEntry` dosyanız, gateway dinlemeye başlamadan önce gateway'in ihtiyaç duyduğu her şeyi kaydediyorsa etkinleştirin (kanal kaydı, HTTP rotaları, gateway yöntemleri). Tam giriş gerekli başlatma yeteneklerine sahipse varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz gateway RPC yöntemlerini kaydediyorsa, bunları Plugin'e özgü bir önekte tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe ait kalır ve her zaman `operator.admin` olarak çözümlenir.

## Plugin manifesti

Her yerel Plugin, paket kök dizininde bir `openclaw.plugin.json` dosyasıyla gönderilmelidir. OpenClaw bunu, Plugin kodunu çalıştırmadan yapılandırmayı doğrulamak için kullanır.

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

Yapılandırması olmayan Plugin'ler bile bir şema ile gönderilmelidir. Boş bir şema geçerlidir:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Tam şema başvurusu için [Plugin manifesti](/tr/plugins/manifest) bölümüne bakın.

## ClawHub yayımlama

Plugin paketleri için pakete özgü ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Eski yalnızca Skills yayımlama takma adı Skills içindir. Plugin paketleri her zaman `clawhub package publish` kullanmalıdır.
</Note>

## Kurulum girişi

`setup-entry.ts` dosyası, OpenClaw yalnızca kurulum yüzeylerine (onboarding, config onarımı, devre dışı kanal denetimi) ihtiyaç duyduğunda yüklediği `index.ts` dosyasına hafif bir alternatiftir.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır runtime kodunun (crypto kitaplıkları, CLI kayıtları, arka plan servisleri) yüklenmesini önler.

Kurulum açısından güvenli dışa aktarımları yan modüllerde tutan paketle gelen çalışma alanı kanalları, `defineSetupPluginEntry(...)` yerine `openclaw/plugin-sdk/channel-entry-contract` içinden `defineBundledChannelSetupEntry(...)` kullanabilir. Bu paketle gelen sözleşme, kurulum zamanı runtime bağlantılarının hafif ve açık kalabilmesi için isteğe bağlı bir `runtime` dışa aktarımını da destekler.

<AccordionGroup>
  <Accordion title="OpenClaw setupEntry'yi tam entry yerine ne zaman kullanır">
    - Kanal devre dışıdır ancak kurulum/onboarding yüzeylerine ihtiyaç duyar.
    - Kanal etkindir ancak yapılandırılmamıştır.
    - Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry neleri kaydetmelidir">
    - Kanal plugin nesnesi (`defineSetupPluginEntry` aracılığıyla).
    - Gateway dinlemeye başlamadan önce gerekli olan HTTP rotaları.
    - Başlangıç sırasında gerekli olan Gateway yöntemleri.

    Bu başlangıç Gateway yöntemleri yine de `config.*` veya `update.*` gibi ayrılmış çekirdek yönetim ad alanlarından kaçınmalıdır.

  </Accordion>
  <Accordion title="setupEntry neleri içermemelidir">
    - CLI kayıtları.
    - Arka plan servisleri.
    - Ağır runtime içe aktarımları (crypto, SDK'ler).
    - Yalnızca başlangıçtan sonra gerekli olan Gateway yöntemleri.

  </Accordion>
</AccordionGroup>

### Dar kurulum yardımcı içe aktarımları

Sıcak, yalnızca kurulum yolları için, kurulum yüzeyinin yalnızca bir bölümüne ihtiyaç duyduğunuzda daha geniş `plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcı dikişlerini tercih edin:

| İçe aktarma yolu                   | Ne için kullanılır                                                                        | Ana dışa aktarımlar                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / ertelenmiş kanal başlangıcında kullanılabilir kalan kurulum zamanı runtime yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | ortam duyarlı hesap kurulum adaptörleri                                                   | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | kurulum/yükleme CLI/arşiv/dokümantasyon yardımcıları                                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

`moveSingleAccountChannelSectionToDefaultAccount(...)` gibi config yaması yardımcıları dahil olmak üzere tam paylaşılan kurulum araç kutusunu istediğinizde daha geniş `plugin-sdk/setup` dikişini kullanın.

Kurulum yama adaptörleri içe aktarmada sıcak yol açısından güvenli kalır. Paketle gelen tek hesap yükseltme sözleşme yüzeyi araması tembeldir; bu nedenle `plugin-sdk/setup-runtime` içe aktarmak, adaptör gerçekten kullanılmadan önce paketle gelen sözleşme yüzeyi keşfini hevesle yüklemez.

### Kanal sahipli tek hesap yükseltme

Bir kanal, tek hesaplı üst düzey config'den `channels.<id>.accounts.*` yapısına yükseltildiğinde, varsayılan paylaşılan davranış yükseltilmiş hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketle gelen kanallar bu yükseltmeyi kurulum sözleşme yüzeyleri üzerinden daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten mevcut olduğunda, yalnızca bu anahtarlar yükseltilen hesaba taşınır; paylaşılan ilke/teslim anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilmiş değerleri hangi mevcut hesabın alacağını seçin

<Note>
Matrix, mevcut paketle gelen örnektir. Tam olarak bir adlandırılmış Matrix hesabı zaten varsa veya `defaultAccount`, `Ops` gibi mevcut kanonik olmayan bir anahtarı işaret ediyorsa yükseltme, yeni bir `accounts.default` girdisi oluşturmak yerine bu hesabı korur.
</Note>

## Config şeması

Plugin config, manifest'inizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar plugin'leri şu şekilde yapılandırır:

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

Bir Zod şemasını plugin sahipli config yapıtları tarafından kullanılan `ChannelConfigSchema` sarmalayıcısına dönüştürmek için `buildChannelConfigSchema` kullanın:

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

Üçüncü taraf plugin'ler için soğuk yol sözleşmesi hâlâ plugin manifest'idir: oluşturulan JSON Schema'yı `openclaw.plugin.json#channelConfigs` içine yansıtın; böylece config şeması, kurulum ve UI yüzeyleri runtime kodunu yüklemeden `channels.<id>` öğesini inceleyebilir.

## Kurulum sihirbazları

Kanal plugin'leri `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir. Sihirbaz, `ChannelPlugin` üzerindeki bir `ChannelSetupWizard` nesnesidir:

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

`ChannelSetupWizard` türü `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` ve daha fazlasını destekler. Tam örnekler için paketle gelen plugin paketlerine (örneğin Discord plugin'i `src/channel.setup.ts`) bakın.

<AccordionGroup>
  <Accordion title="Paylaşılan allowFrom istemleri">
    Yalnızca standart `note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM allowlist istemleri için `openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` ve `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standart kanal kurulum durumu">
    Yalnızca etiketlere, skorlara ve isteğe bağlı ek satırlara göre değişen kanal kurulum durumu blokları için her plugin'de aynı `status` nesnesini elle yazmak yerine `openclaw/plugin-sdk/setup` içinden `createStandardChannelSetupStatus(...)` tercih edin.
  </Accordion>
  <Accordion title="İsteğe bağlı kanal kurulum yüzeyi">
    Yalnızca belirli bağlamlarda görünmesi gereken isteğe bağlı kurulum yüzeyleri için `openclaw/plugin-sdk/channel-setup` içinden `createOptionalChannelSetupSurface` kullanın:

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

    `plugin-sdk/channel-setup`, bu isteğe bağlı yükleme yüzeyinin yalnızca bir yarısına ihtiyaç duyduğunuzda daha düşük seviyeli `createOptionalChannelSetupAdapter(...)` ve `createOptionalChannelSetupWizard(...)` oluşturucularını da sunar.

    Oluşturulan isteğe bağlı adaptör/sihirbaz gerçek config yazımlarında kapalı başarısız olur. `validateInput`, `applyAccountConfig` ve `finalize` genelinde yükleme gerekli mesajını yeniden kullanır ve `docsPath` ayarlandığında bir dokümantasyon bağlantısı ekler.

  </Accordion>
  <Accordion title="İkili dosya destekli kurulum yardımcıları">
    İkili dosya destekli kurulum UI'ları için aynı ikili dosya/durum bağlama kodunu her kanala kopyalamak yerine paylaşılan devredilen yardımcıları tercih edin:

    - Yalnızca etiketlere, ipuçlarına, skorlara ve ikili dosya tespitine göre değişen durum blokları için `createDetectedBinaryStatus(...)`
    - Yol destekli metin girdileri için `createCliPathTextInput(...)`
    - `setupEntry` daha ağır bir tam sihirbaza tembel olarak iletmek zorunda olduğunda `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve `createDelegatedResolveConfigured(...)`
    - `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını devretmek zorunda olduğunda `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## Yayınlama ve yükleme

**Harici plugin'ler:** [ClawHub](/tr/tools/clawhub) üzerinde yayınlayın, ardından yükleyin:

<Tabs>
  <Tab title="Otomatik (ClawHub, sonra npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw önce ClawHub'ı dener ve otomatik olarak npm'e geri döner.

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

**Depo içi plugin'ler:** paketle gelen plugin çalışma alanı ağacının altına yerleştirin; build sırasında otomatik olarak keşfedilirler.

**Kullanıcılar şunları yükleyebilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm kaynaklı yüklemeler için `openclaw plugins install`, paketi lifecycle script'leri devre dışı bırakılmış şekilde `~/.openclaw/npm` altına yükler. Plugin bağımlılık ağaçlarını saf JS/TS tutun ve `postinstall` build'leri gerektiren paketlerden kaçının.
</Info>

<Note>
Gateway başlangıcı plugin bağımlılıklarını yüklemez. npm/git/ClawHub yükleme akışları bağımlılık yakınsamasına sahiptir; yerel plugin'lerin bağımlılıkları zaten yüklü olmalıdır.
</Note>

Paketlenmiş paket meta verileri açıktır; Gateway başlangıcında derlenmiş JavaScript'ten çıkarımla belirlenmez. Çalışma zamanı bağımlılıkları, onları sahiplenen Plugin paketine aittir; paketlenmiş OpenClaw başlangıcı Plugin bağımlılıklarını asla onarmaz veya yansıtmaz.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — adım adım başlangıç kılavuzu
- [Plugin manifesti](/tr/plugins/manifest) — eksiksiz manifest şeması referansı
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry`
