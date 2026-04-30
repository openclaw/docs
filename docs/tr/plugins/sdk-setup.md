---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - setup-entry.ts ile index.ts arasındaki farkı anlamanız gerekir
    - Plugin yapılandırma şemalarını veya package.json openclaw meta verilerini tanımlıyorsunuz
sidebarTitle: Setup and config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Plugin kurulumu ve yapılandırması
x-i18n:
    generated_at: "2026-04-30T09:37:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin paketleme (`package.json` meta verileri), manifestler (`openclaw.plugin.json`), kurulum girdileri ve yapılandırma şemaları için başvuru.

<Tip>
**İzlenecek bir rehber mi arıyorsunuz?** Nasıl yapılır rehberleri, paketlemeyi bağlam içinde ele alır: [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızda, Plugin sistemine Plugin'inizin ne sağladığını söyleyen bir `openclaw` alanı gerekir:

<Tabs>
  <Tab title="Kanal Plugin'i">
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
  <Tab title="Sağlayıcı Plugin'i / ClawHub temeli">
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
Plugin'i ClawHub'da harici olarak yayımlarsanız, bu `compat` ve `build` alanları zorunludur. Standart yayımlama parçacıkları `docs/snippets/plugin-publish/` içindedir.
</Note>

### `openclaw` alanları

<ParamField path="extensions" type="string[]">
  Giriş noktası dosyaları (paket köküne göre göreli).
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

| Alan                                   | Tür        | Ne anlama gelir                                                                 |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `id`                                   | `string`   | Standart kanal kimliği.                                                         |
| `label`                                | `string`   | Birincil kanal etiketi.                                                         |
| `selectionLabel`                       | `string`   | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi.           |
| `detailLabel`                          | `string`   | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi.  |
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için dokümantasyon yolu.                          |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde dokümantasyon bağlantıları için kullanılan geçersiz kılma etiketi. |
| `blurb`                                | `string`   | Kısa onboarding/katalog açıklaması.                                             |
| `order`                                | `number`   | Kanal kataloglarındaki sıralama düzeni.                                         |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama takma adları.                                        |
| `preferOver`                           | `string[]` | Bu kanalın önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri.  |
| `systemImage`                          | `string`   | Kanal UI katalogları için isteğe bağlı simge/sistem görseli adı.                |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde dokümantasyon bağlantılarından önceki önek metni.            |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim metninde etiketli dokümantasyon bağlantısı yerine dokümantasyon yolunu doğrudan göster. |
| `selectionExtras`                      | `string[]` | Seçim metnine eklenen kısa ek dizeler.                                          |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler.   |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış listeler ve dokümantasyon yüzeyleri için kanal görünürlüğü kontrolleri. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.      |
| `forceAccountBinding`                  | `boolean`  | Yalnızca bir hesap olsa bile açık hesap bağlamayı zorunlu kılar.                |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bu kanal için duyuru hedefleri çözümlenirken oturum aramayı tercih eder.        |

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

`openclaw.install`, manifest meta verisi değil paket meta verisidir.

| Alan                         | Tür                  | Ne anlama gelir                                                                   |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kurulum/güncelleme akışları için standart npm belirtimi.                          |
| `localPath`                  | `string`             | Yerel geliştirme veya paketle birlikte gelen kurulum yolu.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | İkisi de kullanılabilir olduğunda tercih edilen kurulum kaynağı.                  |
| `minHostVersion`             | `string`             | `>=x.y.z` biçiminde desteklenen minimum OpenClaw sürümü.                          |
| `expectedIntegrity`          | `string`             | Sabitlenmiş kurulumlar için beklenen npm dist bütünlük dizesi, genellikle `sha512-...`. |
| `allowInvalidConfigRecovery` | `boolean`            | Paketle birlikte gelen Plugin yeniden kurulum akışlarının belirli bayat yapılandırma hatalarından kurtulmasına izin verir. |

<AccordionGroup>
  <Accordion title="Onboarding davranışı">
    Etkileşimli onboarding, isteğe bağlı kurulum yüzeyleri için `openclaw.install` alanını da kullanır. Plugin'iniz çalışma zamanı yüklenmeden önce sağlayıcı kimlik doğrulama seçenekleri veya kanal kurulum/katalog meta verileri sunuyorsa, onboarding bu seçeneği gösterebilir, npm veya yerel kurulum için sorabilir, Plugin'i kurabilir ya da etkinleştirebilir ve ardından seçilen akışa devam edebilir. Npm onboarding seçenekleri, kayıt defteri `npmSpec` içeren güvenilir katalog meta verileri gerektirir; kesin sürümler ve `expectedIntegrity` isteğe bağlı sabitlemelerdir. `expectedIntegrity` varsa, kurulum/güncelleme akışları bunu zorunlu kılar. "Ne gösterilecek" meta verilerini `openclaw.plugin.json` içinde, "nasıl kurulacak" meta verilerini ise `package.json` içinde tutun.
  </Accordion>
  <Accordion title="minHostVersion zorunlu kılma">
    `minHostVersion` ayarlanırsa, hem kurulum hem de manifest kayıt defteri yükleme bunu zorunlu kılar. Eski host'lar Plugin'i atlar; geçersiz sürüm dizeleri reddedilir.
  </Accordion>
  <Accordion title="Sabitlenmiş npm kurulumları">
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
  <Accordion title="allowInvalidConfigRecovery kapsamı">
    `allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir atlatma değildir. Yalnızca dar kapsamlı, paketle birlikte gelen Plugin kurtarması içindir; böylece yeniden kurulum/kurulum, eksik paketlenmiş Plugin yolu veya aynı Plugin için bayat `channels.<id>` girdisi gibi bilinen yükseltme artıklarını onarabilir. Yapılandırma ilgisiz nedenlerle bozuksa, kurulum yine kapalı şekilde başarısız olur ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.
  </Accordion>
</AccordionGroup>

### Ertelenmiş tam yükleme

Kanal Plugin'leri ertelenmiş yüklemeyi şu şekilde etkinleştirebilir:

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
Ertelenmiş yüklemeyi yalnızca `setupEntry` dosyanız Gateway dinlemeye başlamadan önce ihtiyaç duyduğu her şeyi kaydediyorsa etkinleştirin (kanal kaydı, HTTP rotaları, Gateway yöntemleri). Gerekli başlatma yetenekleri tam girişteyse, varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz Gateway RPC yöntemleri kaydediyorsa, bunları Plugin'e özgü bir önekte tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe ait kalır ve her zaman `operator.admin` olarak çözümlenir.

## Plugin manifesti

Her yerel Plugin, paket kökünde bir `openclaw.plugin.json` göndermelidir. OpenClaw bunu, Plugin kodunu çalıştırmadan yapılandırmayı doğrulamak için kullanır.

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

Yapılandırması olmayan Plugin'ler bile bir şema göndermelidir. Boş bir şema geçerlidir:

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
Eski, yalnızca skill yayımlama takma adı Skills içindir. Plugin paketleri her zaman `clawhub package publish` kullanmalıdır.
</Note>

## Kurulum girdisi

`setup-entry.ts` dosyası, OpenClaw yalnızca kurulum yüzeylerine ihtiyaç duyduğunda yüklediği `index.ts` için hafif bir alternatiftir (onboarding, yapılandırma onarımı, devre dışı kanal incelemesi).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun (şifreleme kitaplıkları, CLI kayıtları, arka plan hizmetleri) yüklenmesini önler.

Kurulum açısından güvenli dışa aktarımları sidecar modüllerde tutan paketle birlikte gelen çalışma alanı kanalları, `defineSetupPluginEntry(...)` yerine `openclaw/plugin-sdk/channel-entry-contract` içindeki `defineBundledChannelSetupEntry(...)` kullanabilir. Bu paketli sözleşme ayrıca isteğe bağlı bir `runtime` dışa aktarımını destekler; böylece kurulum zamanındaki çalışma zamanı bağlantıları hafif ve açık kalabilir.

<AccordionGroup>
  <Accordion title="OpenClaw setupEntry'yi tam entry yerine kullandığında">
    - Kanal devre dışıdır ama kurulum/onboarding yüzeylerine ihtiyaç duyar.
    - Kanal etkindir ama yapılandırılmamıştır.
    - Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry'nin kaydetmesi gerekenler">
    - Kanal Plugin nesnesi (`defineSetupPluginEntry` üzerinden).
    - Gateway dinlemesi öncesinde gereken tüm HTTP rotaları.
    - Başlatma sırasında gereken tüm Gateway yöntemleri.

    Bu başlatma Gateway yöntemleri yine de `config.*` veya `update.*` gibi ayrılmış çekirdek yönetici ad alanlarından kaçınmalıdır.

  </Accordion>
  <Accordion title="setupEntry'nin içermemesi gerekenler">
    - CLI kayıtları.
    - Arka plan hizmetleri.
    - Ağır çalışma zamanı içe aktarımları (şifreleme, SDK'lar).
    - Yalnızca başlatmadan sonra gereken Gateway yöntemleri.

  </Accordion>
</AccordionGroup>

### Dar kurulum yardımcı içe aktarımları

Sıcak, yalnızca kurulum yolları için, kurulum yüzeyinin yalnızca bir bölümüne ihtiyaç duyduğunuzda daha geniş `plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcı seam'lerini tercih edin:

| İçe aktarma yolu                   | Şunun için kullanın                                                                       | Temel dışa aktarımlar                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / ertelenmiş kanal başlatmada kullanılabilir kalan kurulum zamanı çalışma zamanı yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | ortam farkındalıklı hesap kurulum adaptörleri                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | kurulum/yükleme CLI/arşiv/dokümantasyon yardımcıları                                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

`moveSingleAccountChannelSectionToDefaultAccount(...)` gibi yapılandırma yaması yardımcıları dahil tam paylaşılan kurulum araç kutusunu istediğinizde daha geniş `plugin-sdk/setup` seam'ini kullanın.

Kurulum yama adaptörleri içe aktarıldığında sıcak yol açısından güvenli kalır. Paketli tek hesap yükseltme sözleşme yüzeyi araması lazy'dir; bu nedenle `plugin-sdk/setup-runtime` içe aktarmak, adaptör gerçekten kullanılmadan önce paketli sözleşme yüzeyi keşfini hevesle yüklemez.

### Kanal sahipli tek hesap yükseltme

Bir kanal tek hesaplı üst düzey yapılandırmadan `channels.<id>.accounts.*` biçimine yükselttiğinde, varsayılan paylaşılan davranış yükseltilen hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketli kanallar, kurulum sözleşme yüzeyleri üzerinden bu yükseltmeyi daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten varsa yalnızca bu anahtarlar yükseltilen hesaba taşınır; paylaşılan politika/teslimat anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın alacağını seçin

<Note>
Matrix mevcut paketli örnektir. Tam olarak bir adlandırılmış Matrix hesabı zaten varsa veya `defaultAccount`, `Ops` gibi mevcut kanonik olmayan bir anahtarı gösteriyorsa, yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur.
</Note>

## Yapılandırma şeması

Plugin yapılandırması, manifestinizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar Plugin'leri şu şekilde yapılandırır:

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

Kanala özel yapılandırma için bunun yerine kanal yapılandırma bölümünü kullanın:

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

Bir Zod şemasını Plugin sahipli yapılandırma artifact'ları tarafından kullanılan `ChannelConfigSchema` sarmalayıcısına dönüştürmek için `buildChannelConfigSchema` kullanın:

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

Üçüncü taraf Plugin'ler için soğuk yol sözleşmesi hâlâ Plugin manifestidir: oluşturulan JSON Schema'yı `openclaw.plugin.json#channelConfigs` içine yansıtın; böylece yapılandırma şeması, kurulum ve UI yüzeyleri çalışma zamanı kodunu yüklemeden `channels.<id>` öğesini inceleyebilir.

## Kurulum sihirbazları

Kanal Plugin'leri `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir. Sihirbaz, `ChannelPlugin` üzerinde bir `ChannelSetupWizard` nesnesidir:

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

`ChannelSetupWizard` türü `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` ve daha fazlasını destekler. Tam örnekler için paketli Plugin paketlerine (örneğin Discord Plugin'i `src/channel.setup.ts`) bakın.

<AccordionGroup>
  <Accordion title="Paylaşılan allowFrom istemleri">
    Yalnızca standart `note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM allowlist istemleri için, `openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` ve `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standart kanal kurulum durumu">
    Yalnızca etiketler, puanlar ve isteğe bağlı ek satırlara göre değişen kanal kurulum durumu blokları için, her Plugin'de aynı `status` nesnesini elle oluşturmak yerine `openclaw/plugin-sdk/setup` içindeki `createStandardChannelSetupStatus(...)` kullanın.
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

    `plugin-sdk/channel-setup`, isteğe bağlı yükleme yüzeyinin yalnızca bir yarısına ihtiyaç duyduğunuzda daha düşük seviyeli `createOptionalChannelSetupAdapter(...)` ve `createOptionalChannelSetupWizard(...)` oluşturucularını da sunar.

    Oluşturulan isteğe bağlı adaptör/sihirbaz gerçek yapılandırma yazımlarında kapalı hata verir. `validateInput`, `applyAccountConfig` ve `finalize` genelinde tek bir yükleme-gerekli mesajını yeniden kullanırlar ve `docsPath` ayarlandığında bir dokümantasyon bağlantısı eklerler.

  </Accordion>
  <Accordion title="Binary destekli kurulum yardımcıları">
    Binary destekli kurulum UI'ları için, aynı binary/durum bağlantı kodunu her kanala kopyalamak yerine paylaşılan delegated yardımcıları tercih edin:

    - Yalnızca etiketler, ipuçları, puanlar ve binary algılamasına göre değişen durum blokları için `createDetectedBinaryStatus(...)`
    - Yol destekli metin girdileri için `createCliPathTextInput(...)`
    - `setupEntry` daha ağır bir tam sihirbaza lazy olarak yönlendirme yapması gerektiğinde `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve `createDelegatedResolveConfigured(...)`
    - `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını devretmeye ihtiyaç duyduğunda `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## Yayınlama ve yükleme

**Harici Plugin'ler:** [ClawHub](/tr/tools/clawhub) üzerinde yayınlayın, ardından yükleyin:

<Tabs>
  <Tab title="Otomatik (önce ClawHub, sonra npm)">
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
  <Tab title="npm paket spec'i">
    Bir paket henüz ClawHub'a taşınmadığında veya geçiş sırasında doğrudan bir
    npm yükleme yoluna ihtiyaç duyduğunuzda npm kullanın:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Repo içi Plugin'ler:** Paketli Plugin çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik olarak keşfedilirler.

**Kullanıcılar şunu yükleyebilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm kaynaklı yüklemeler için `openclaw plugins install`, devralınan global npm yükleme ayarlarını yok sayarak proje yerelinde `npm install --ignore-scripts` çalıştırır (lifecycle script'leri yoktur). Plugin bağımlılık ağaçlarını saf JS/TS tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

<Note>
Paketle birlikte gelen OpenClaw'a ait Plugin'ler, başlangıç onarımının tek istisnasıdır: paketli bir kurulum, Plugin yapılandırması, eski kanal yapılandırması veya paketle birlikte gelen varsayılan etkin manifesti tarafından etkinleştirilmiş bir tane gördüğünde, başlangıç işlemi içe aktarmadan önce o Plugin'in eksik çalışma zamanı bağımlılıklarını kurar. Operatörler bu aşamayı `openclaw plugins deps` ile inceleyebilir veya onarabilir. Üçüncü taraf Plugin'ler başlangıç kurulumlarına güvenmemelidir; açık Plugin kurulum aracını kullanmaya devam edin.
</Note>

Paketle birlikte gelen paket düzeyi çalışma zamanı bağımlılıkları açık meta verilerdir; gateway başlangıcında derlenmiş JavaScript'ten çıkarımlanmaz. Paylaşılan bir OpenClaw kök bağımlılığının harici paketli Plugin çalışma zamanı aynasında kullanılabilir olması gerekiyorsa, bunu kök paket manifestindeki `openclaw.bundle.mirroredRootRuntimeDependencies` içinde bildirin.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — adım adım başlangıç kılavuzu
- [Plugin manifesti](/tr/plugins/manifest) — tam manifest şeması başvurusu
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry`
