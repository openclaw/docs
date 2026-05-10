---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - setup-entry.ts ile index.ts arasındaki farkı anlamanız gerekiyor
    - Plugin yapılandırma şemalarını veya package.json openclaw meta verilerini tanımlıyorsunuz
sidebarTitle: Setup and config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Plugin kurulumu ve yapılandırması
x-i18n:
    generated_at: "2026-05-10T19:49:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin paketleme (`package.json` meta verileri), manifestler (`openclaw.plugin.json`), kurulum girişleri ve yapılandırma şemaları için başvuru.

<Tip>
**Kılavuz mu arıyorsunuz?** Nasıl yapılır kılavuzları paketlemeyi bağlam içinde ele alır: [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızda, Plugin sistemine Plugin'inizin ne sağladığını bildiren bir `openclaw` alanı gerekir:

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
  <Tab title="Sağlayıcı Plugin'i / ClawHub taban çizgisi">
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
  Giriş noktası dosyaları (paket köküne göreli).
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
| `id`                                   | `string`   | Standart kanal kimliği.                                                       |
| `label`                                | `string`   | Birincil kanal etiketi.                                                       |
| `selectionLabel`                       | `string`   | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi.         |
| `detailLabel`                          | `string`   | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi. |
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için dokümantasyon yolu.                        |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde dokümantasyon bağlantıları için kullanılan geçersiz kılma etiketi. |
| `blurb`                                | `string`   | Kısa ilk kullanım/katalog açıklaması.                                         |
| `order`                                | `number`   | Kanal kataloglarındaki sıralama düzeni.                                       |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama takma adları.                                      |
| `preferOver`                           | `string[]` | Bu kanalın önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal UI katalogları için isteğe bağlı simge/sistem görseli adı.              |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde dokümantasyon bağlantılarından önceki önek metni.          |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim metninde etiketli dokümantasyon bağlantısı yerine dokümantasyon yolunu doğrudan gösterir. |
| `selectionExtras`                      | `string[]` | Seçim metnine eklenen ek kısa dizeler.                                        |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı Markdown uyumlu olarak işaretler.   |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış listeler ve dokümantasyon yüzeyleri için kanal görünürlük kontrolleri. |
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

- `configured`: kanalı yapılandırılmış/durum tarzı listeleme yüzeylerine dahil et
- `setup`: kanalı etkileşimli kurulum/yapılandırma seçicilerine dahil et
- `docs`: kanalı dokümantasyon/gezinme yüzeylerinde herkese açık olarak işaretle

<Note>
`showConfigured` ve `showInSetup` eski takma adlar olarak desteklenmeye devam eder. `exposure` tercih edin.
</Note>

### `openclaw.install`

`openclaw.install` paket meta verisidir, manifest meta verisi değildir.

| Alan                         | Tür                                 | Anlamı                                                                            |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kurulum/güncelleme ve ilk kullanımda isteğe bağlı kurulum akışları için standart ClawHub belirtimi. |
| `npmSpec`                    | `string`                            | Kurulum/güncelleme yedek akışları için standart npm belirtimi.                   |
| `localPath`                  | `string`                            | Yerel geliştirme veya paketlenmiş kurulum yolu.                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Birden fazla kaynak mevcut olduğunda tercih edilen kurulum kaynağı.              |
| `minHostVersion`             | `string`                            | `>=x.y.z` veya `>=x.y.z-prerelease` biçimindeki desteklenen minimum OpenClaw sürümü. |
| `expectedIntegrity`          | `string`                            | Sabitlenmiş kurulumlar için beklenen npm dağıtım bütünlük dizesi; genellikle `sha512-...`. |
| `allowInvalidConfigRecovery` | `boolean`                           | Paketlenmiş Plugin yeniden kurulum akışlarının belirli eski yapılandırma hatalarından kurtulmasına izin verir. |

<AccordionGroup>
  <Accordion title="İlk kullanım davranışı">
    Etkileşimli ilk kullanım da isteğe bağlı kurulum yüzeyleri için `openclaw.install` kullanır. Plugin'iniz çalışma zamanı yüklenmeden önce sağlayıcı kimlik doğrulama seçenekleri veya kanal kurulum/katalog meta verileri sunuyorsa, ilk kullanım bu seçeneği gösterebilir, ClawHub, npm veya yerel kurulum için istemde bulunabilir, Plugin'i kurabilir veya etkinleştirebilir ve ardından seçilen akışa devam edebilir. ClawHub ilk kullanım seçenekleri `clawhubSpec` kullanır ve mevcut olduğunda tercih edilir; npm seçenekleri, kayıt defteri `npmSpec` içeren güvenilir katalog meta verileri gerektirir; kesin sürümler ve `expectedIntegrity` isteğe bağlı npm sabitlemeleridir. `expectedIntegrity` mevcutsa, kurulum/güncelleme akışları bunu npm için zorunlu kılar. "Ne gösterilecek" meta verilerini `openclaw.plugin.json` içinde, "nasıl kurulacak" meta verilerini ise `package.json` içinde tutun.
  </Accordion>
  <Accordion title="minHostVersion zorunlu kılma">
    `minHostVersion` ayarlanmışsa, hem kurulum hem de paketlenmemiş manifest kayıt defteri yükleme bunu zorunlu kılar. Eski ana makineler harici Plugin'leri atlar; geçersiz sürüm dizeleri reddedilir. Paketlenmiş kaynak Plugin'lerin ana makine çalışma kopyasıyla aynı sürümde olduğu varsayılır.
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
    `allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir baypas değildir. Yalnızca dar kapsamlı paketlenmiş Plugin kurtarması içindir; böylece yeniden kurulum/kurulum, eksik paketlenmiş Plugin yolu veya aynı Plugin için eski `channels.<id>` girdisi gibi bilinen yükseltme artıklarını onarabilir. Yapılandırma ilgisiz nedenlerle bozuksa, kurulum yine kapalı başarısız olur ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.
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

Etkinleştirildiğinde OpenClaw, ön dinleme başlatma aşamasında, zaten yapılandırılmış kanallar için bile yalnızca `setupEntry` yükler. Tam giriş, gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
Ertelenmiş yüklemeyi yalnızca `setupEntry` öğeniz gateway dinlemeye başlamadan önce ihtiyaç duyduğu her şeyi kaydediyorsa (kanal kaydı, HTTP rotaları, gateway yöntemleri) etkinleştirin. Gerekli başlatma yetenekleri tam girişe aitse, varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz gateway RPC yöntemleri kaydediyorsa, bunları Plugin'e özgü bir önekte tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe ait kalır ve her zaman `operator.admin` olarak çözümlenir.

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

Yapılandırması olmayan Plugin'ler bile bir şema ile gelmelidir. Boş bir şema geçerlidir:

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
Eski yalnızca beceri yayımlama takma adı beceriler içindir. Plugin paketleri her zaman `clawhub package publish` kullanmalıdır.
</Note>

## Kurulum girişi

`setup-entry.ts` dosyası, OpenClaw yalnızca kurulum yüzeylerine ihtiyaç duyduğunda (ilk katılım, yapılandırma onarımı, devre dışı kanal incelemesi) yüklediği `index.ts` dosyasına hafif bir alternatiftir.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun (kripto kitaplıkları, CLI kayıtları, arka plan servisleri) yüklenmesini önler.

Kurulum için güvenli dışa aktarımları yan modüllerde tutan paketlenmiş çalışma alanı kanalları, `defineSetupPluginEntry(...)` yerine `openclaw/plugin-sdk/channel-entry-contract` içindeki `defineBundledChannelSetupEntry(...)` işlevini kullanabilir. Bu paketlenmiş sözleşme, kurulum zamanı çalışma zamanı bağlantısının hafif ve açık kalabilmesi için isteğe bağlı bir `runtime` dışa aktarımını da destekler.

<AccordionGroup>
  <Accordion title="OpenClaw setupEntry'yi tam giriş yerine ne zaman kullanır">
    - Kanal devre dışıdır ama kurulum/ilk katılım yüzeylerine ihtiyaç duyar.
    - Kanal etkindir ama yapılandırılmamıştır.
    - Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry ne kaydetmelidir">
    - Kanal Plugin nesnesi (`defineSetupPluginEntry` aracılığıyla).
    - Gateway dinlemeden önce gereken tüm HTTP rotaları.
    - Başlangıç sırasında gereken tüm Gateway yöntemleri.

    Bu başlangıç Gateway yöntemleri yine de `config.*` veya `update.*` gibi ayrılmış çekirdek yönetim ad alanlarından kaçınmalıdır.

  </Accordion>
  <Accordion title="setupEntry neleri içermemelidir">
    - CLI kayıtları.
    - Arka plan servisleri.
    - Ağır çalışma zamanı içe aktarımları (kripto, SDK'ler).
    - Yalnızca başlangıçtan sonra gereken Gateway yöntemleri.

  </Accordion>
</AccordionGroup>

### Dar kurulum yardımcısı içe aktarımları

Sıcak yalnızca kurulum yollarında, kurulum yüzeyinin yalnızca bir bölümüne ihtiyaç duyduğunuzda daha geniş `plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcısı bağlantılarını tercih edin:

| İçe aktarma yolu                   | Bunun için kullanın                                                                       | Ana dışa aktarımlar                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / ertelenmiş kanal başlangıcında kullanılabilir kalan kurulum zamanı çalışma zamanı yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/setup-runtime` kullanın           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | kurulum/yükleme CLI/arşiv/dokümantasyon yardımcıları                                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

`moveSingleAccountChannelSectionToDefaultAccount(...)` gibi yapılandırma yaması yardımcıları dahil, tam paylaşılan kurulum araç kutusunu istediğinizde daha geniş `plugin-sdk/setup` bağlantısını kullanın.

Kurulum yama adaptörleri içe aktarımda sıcak yol için güvenli kalır. Paketlenmiş tek hesap yükseltme sözleşme yüzeyi araması tembeldir; bu yüzden `plugin-sdk/setup-runtime` içe aktarımı, adaptör gerçekten kullanılmadan önce paketlenmiş sözleşme yüzeyi keşfini istekli biçimde yüklemez.

### Kanalın sahip olduğu tek hesap yükseltmesi

Bir kanal, tek hesaplı üst düzey yapılandırmadan `channels.<id>.accounts.*` yapısına yükselttiğinde, varsayılan paylaşılan davranış yükseltilen hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketlenmiş kanallar, kurulum sözleşme yüzeyleri aracılığıyla bu yükseltmeyi daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten mevcut olduğunda, yalnızca bu anahtarlar yükseltilen hesaba taşınır; paylaşılan ilke/teslimat anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın alacağını seçin

<Note>
Matrix mevcut paketlenmiş örnektir. Tam olarak bir adlandırılmış Matrix hesabı zaten varsa veya `defaultAccount`, `Ops` gibi mevcut kanonik olmayan bir anahtarı işaret ediyorsa, yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur.
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

Bir Zod şemasını Plugin'e ait yapılandırma yapıları tarafından kullanılan `ChannelConfigSchema` sarmalayıcısına dönüştürmek için `buildChannelConfigSchema` kullanın:

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

`ChannelSetupWizard` türü `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` ve daha fazlasını destekler. Tam örnekler için paketlenmiş Plugin paketlerine bakın (örneğin Discord Plugin'i `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Paylaşılan allowFrom istemleri">
    Yalnızca standart `note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için, `openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` ve `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standart kanal kurulum durumu">
    Yalnızca etiketlere, puanlara ve isteğe bağlı ek satırlara göre değişen kanal kurulum durumu blokları için, her Plugin'de aynı `status` nesnesini elle oluşturmak yerine `openclaw/plugin-sdk/setup` içindeki `createStandardChannelSetupStatus(...)` işlevini tercih edin.
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

    `plugin-sdk/channel-setup`, bu isteğe bağlı yükleme yüzeyinin yalnızca bir yarısına ihtiyaç duyduğunuzda daha düşük düzeyli `createOptionalChannelSetupAdapter(...)` ve `createOptionalChannelSetupWizard(...)` oluşturucularını da sunar.

    Oluşturulan isteğe bağlı adaptör/sihirbaz, gerçek yapılandırma yazımlarında kapalı başarısız olur. `validateInput`, `applyAccountConfig` ve `finalize` boyunca tek bir yükleme gerekli mesajını yeniden kullanırlar ve `docsPath` ayarlandığında bir dokümantasyon bağlantısı eklerler.

  </Accordion>
  <Accordion title="İkili dosya destekli kurulum yardımcıları">
    İkili dosya destekli kurulum UI'ları için, aynı ikili dosya/durum bağlantısını her kanala kopyalamak yerine paylaşılan yetkilendirilmiş yardımcıları tercih edin:

    - Yalnızca etiketlere, ipuçlarına, puanlara ve ikili dosya algılamasına göre değişen durum blokları için `createDetectedBinaryStatus(...)`
    - Yol destekli metin girdileri için `createCliPathTextInput(...)`
    - `setupEntry` daha ağır bir tam sihirbaza tembel olarak iletmek zorunda olduğunda `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve `createDelegatedResolveConfigured(...)`
    - `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını yetkilendirmek zorunda olduğunda `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## Yayımlama ve yükleme

**Harici Plugin'ler:** [ClawHub](/tr/clawhub) üzerinde yayımlayın, ardından yükleyin:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Yalın paket belirtimleri, başlatma geçişi sırasında npm üzerinden yüklenir.

  </Tab>
  <Tab title="Yalnızca ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm paket belirtimi">
    Bir paket henüz ClawHub'a taşınmadığında veya geçiş sırasında
    doğrudan npm yükleme yoluna ihtiyaç duyduğunuzda npm kullanın:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Repo içi Plugin'ler:** birlikte paketlenen Plugin çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik olarak keşfedilirler.

**Kullanıcılar şunu kurabilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm kaynaklı kurulumlarda, `openclaw plugins install` paketi yaşam döngüsü betikleri devre dışı bırakılmış şekilde `~/.openclaw/npm` altına kurar. Plugin bağımlılık ağaçlarını saf JS/TS olarak tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

<Note>
Gateway başlangıcı Plugin bağımlılıklarını kurmaz. npm/git/ClawHub kurulum akışları bağımlılık yakınsamasından sorumludur; yerel Plugin'lerin bağımlılıkları zaten kurulmuş olmalıdır.
</Note>

Birlikte paketlenen paket meta verileri açıktır; Gateway başlangıcında derlenmiş JavaScript'ten çıkarımsanmaz. Çalışma zamanı bağımlılıkları, onlara sahip olan Plugin paketinde bulunmalıdır; paketlenmiş OpenClaw başlangıcı Plugin bağımlılıklarını asla onarmaz veya yansıtmaz.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — adım adım başlangıç kılavuzu
- [Plugin manifesti](/tr/plugins/manifest) — tam manifest şeması başvurusu
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry`
