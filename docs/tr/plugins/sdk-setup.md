---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - setup-entry.ts ile index.ts arasındaki farkı anlamanız gerekiyor
    - Plugin yapılandırma şemaları veya package.json openclaw meta verileri tanımlıyorsunuz
sidebarTitle: Setup and config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Plugin kurulumu ve yapılandırması
x-i18n:
    generated_at: "2026-06-28T01:05:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin paketleme (`package.json` meta verisi), manifestler (`openclaw.plugin.json`), kurulum girdileri ve yapılandırma şemaları için başvuru.

<Tip>
**Bir adım adım kılavuz mu arıyorsunuz?** Nasıl yapılır kılavuzları paketlemeyi bağlam içinde ele alır: [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verisi

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
Plugin'i ClawHub üzerinde dışarıya yayımlarsanız, bu `compat` ve `build` alanları zorunludur. Kanonik yayımlama parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.
</Note>

### `openclaw` alanları

<ParamField path="extensions" type="string[]">
  Girdi noktası dosyaları (paket köküne göre göreli).
</ParamField>
<ParamField path="setupEntry" type="string">
  Hafif, yalnızca kurulum amaçlı girdi (isteğe bağlı).
</ParamField>
<ParamField path="channel" type="object">
  Kurulum, seçici, hızlı başlangıç ve durum yüzeyleri için kanal katalog meta verisi.
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
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için doküman yolu.                              |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde doküman bağlantıları için kullanılan etiketi geçersiz kılar. |
| `blurb`                                | `string`   | Kısa ilk kullanım/katalog açıklaması.                                         |
| `order`                                | `number`   | Kanal kataloglarında sıralama düzeni.                                         |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama takma adları.                                      |
| `preferOver`                           | `string[]` | Bu kanalın önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal UI katalogları için isteğe bağlı simge/sistem görüntüsü adı.            |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde doküman bağlantılarından önce gelen önek metni.            |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim kopyasında etiketli doküman bağlantısı yerine doküman yolunu doğrudan göster. |
| `selectionExtras`                      | `string[]` | Seçim kopyasına eklenen kısa ek dizgeler.                                     |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı markdown uyumlu olarak işaretler.   |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış listeler ve doküman yüzeyleri için kanal görünürlük denetimleri. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.    |
| `forceAccountBinding`                  | `boolean`  | Yalnızca bir hesap olsa bile açık hesap bağlama gerektirir.                   |
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
- `docs`: kanalı doküman/gezinme yüzeylerinde herkese açık olarak işaretle

<Note>
`showConfigured` ve `showInSetup`, eski takma adlar olarak desteklenmeye devam eder. `exposure` tercih edin.
</Note>

### `openclaw.install`

`openclaw.install` paket meta verisidir, manifest meta verisi değildir.

| Alan                         | Tür                                 | Anlamı                                                                            |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kurulum/güncelleme ve ilk kullanımda isteğe bağlı kurulum akışları için kanonik ClawHub belirtimi. |
| `npmSpec`                    | `string`                            | Kurulum/güncelleme geri dönüş akışları için kanonik npm belirtimi.                |
| `localPath`                  | `string`                            | Yerel geliştirme veya paketle birlikte gelen kurulum yolu.                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Birden fazla kaynak kullanılabilir olduğunda tercih edilen kurulum kaynağı.       |
| `minHostVersion`             | `string`                            | `>=x.y.z` veya `>=x.y.z-prerelease` biçiminde desteklenen en düşük OpenClaw sürümü. |
| `expectedIntegrity`          | `string`                            | Sabitlenmiş kurulumlar için beklenen npm dağıtım bütünlük dizgesi, genellikle `sha512-...`. |
| `allowInvalidConfigRecovery` | `boolean`                           | Paketle gelen Plugin yeniden kurulum akışlarının belirli eski yapılandırma hatalarından toparlanmasına izin verir. |
| `requiredPlatformPackages`   | `string[]`                          | npm kurulumu sırasında doğrulanan, gerekli platforma özgü npm takma adları.       |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Etkileşimli ilk kullanım da isteğe bağlı kurulum yüzeyleri için `openclaw.install` kullanır. Plugin'iniz, çalışma zamanı yüklenmeden önce sağlayıcı kimlik doğrulama seçenekleri veya kanal kurulum/katalog meta verisi sunuyorsa, ilk kullanım bu seçimi gösterebilir, ClawHub, npm veya yerel kurulum için istemde bulunabilir, Plugin'i kurabilir ya da etkinleştirebilir ve ardından seçilen akışa devam edebilir. ClawHub ilk kullanım seçenekleri `clawhubSpec` kullanır ve mevcut olduğunda tercih edilir; npm seçenekleri, kayıt defteri `npmSpec` değerine sahip güvenilir katalog meta verisi gerektirir; kesin sürümler ve `expectedIntegrity` isteğe bağlı npm sabitlemeleridir. `expectedIntegrity` mevcutsa, kurulum/güncelleme akışları bunu npm için zorunlu kılar. "Ne gösterilecek" meta verisini `openclaw.plugin.json` içinde, "nasıl kurulacak" meta verisini `package.json` içinde tutun.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    `minHostVersion` ayarlanırsa, hem kurulum hem de paketle gelmeyen manifest kayıt defteri yükleme bunu zorunlu kılar. Eski ana makineler harici Plugin'leri atlar; geçersiz sürüm dizgeleri reddedilir. Paketle gelen kaynak Plugin'lerin ana makine checkout'ı ile aynı sürümde olduğu varsayılır.
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
    `allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir atlatma değildir. Yalnızca dar kapsamlı paketle gelen Plugin toparlaması içindir; böylece yeniden kurulum/kurulum, eksik bir paketle gelen Plugin yolu veya aynı Plugin için eski `channels.<id>` girdisi gibi bilinen yükseltme kalıntılarını onarabilir. Yapılandırma ilgisiz nedenlerle bozuksa, kurulum yine kapalı başarısız olur ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.
  </Accordion>
</AccordionGroup>

### Ertelenmiş tam yükleme

Kanal Plugin'leri şu şekilde ertelenmiş yüklemeye katılabilir:

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

Etkinleştirildiğinde OpenClaw, ön dinleme başlatma aşamasında, zaten yapılandırılmış kanallar için bile yalnızca `setupEntry` yükler. Tam girdi, Gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
Ertelenmiş yüklemeyi yalnızca `setupEntry` öğeniz Gateway dinlemeye başlamadan önce ihtiyaç duyduğu her şeyi kaydediyorsa etkinleştirin (kanal kaydı, HTTP rotaları, Gateway yöntemleri). Tam girdi gerekli başlatma yeteneklerinin sahibiyse, varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girdiniz Gateway RPC yöntemleri kaydediyorsa, bunları Plugin'e özgü bir önekte tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe ait kalır ve her zaman `operator.admin` değerine çözümlenir.

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

[Plugin manifestosu](/tr/plugins/manifest) tam şema başvurusu için bkz.

## ClawHub yayımlama

Plugin paketleri için pakete özgü ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Eski yalnızca skill yayımlama takma adı skills içindir. Plugin paketleri her zaman `clawhub package publish` kullanmalıdır.
</Note>

## Kurulum girişi

`setup-entry.ts` dosyası, OpenClaw yalnızca kurulum yüzeylerine (onboarding, yapılandırma onarımı, devre dışı kanal denetimi) ihtiyaç duyduğunda yüklediği `index.ts` için hafif bir alternatiftir.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun (şifreleme kütüphaneleri, CLI kayıtları, arka plan hizmetleri) yüklenmesini önler.

Kurulum açısından güvenli dışa aktarımları yan modüllerde tutan paketlenmiş çalışma alanı kanalları, `defineSetupPluginEntry(...)` yerine `openclaw/plugin-sdk/channel-entry-contract` içinden `defineBundledChannelSetupEntry(...)` kullanabilir. Bu paketlenmiş sözleşme ayrıca isteğe bağlı bir `runtime` dışa aktarımını destekler; böylece kurulum zamanı çalışma zamanı kablolaması hafif ve açık kalabilir.

<AccordionGroup>
  <Accordion title="OpenClaw tam giriş yerine setupEntry kullandığında">
    - Kanal devre dışıdır ancak kurulum/onboarding yüzeylerine ihtiyaç duyar.
    - Kanal etkindir ancak yapılandırılmamıştır.
    - Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry neyi kaydetmelidir">
    - Kanal Plugin nesnesi (`defineSetupPluginEntry` aracılığıyla).
    - Gateway dinlemeden önce gereken tüm HTTP rotaları.
    - Başlatma sırasında gereken tüm gateway yöntemleri.

    Bu başlangıç gateway yöntemleri yine de `config.*` veya `update.*` gibi ayrılmış çekirdek yönetici ad alanlarından kaçınmalıdır.

  </Accordion>
  <Accordion title="setupEntry neleri içermemelidir">
    - CLI kayıtları.
    - Arka plan hizmetleri.
    - Ağır çalışma zamanı içe aktarımları (şifreleme, SDK'ler).
    - Yalnızca başlatmadan sonra gereken Gateway yöntemleri.

  </Accordion>
</AccordionGroup>

### Dar kurulum yardımcısı içe aktarımları

Sıcak yalnızca kurulum yolları için, kurulum yüzeyinin yalnızca bir bölümüne ihtiyaç duyduğunuzda daha geniş `plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcısı seam'lerini tercih edin:

| İçe aktarma yolu                   | Ne için kullanılır                                                                         | Temel dışa aktarımlar                                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / ertelenmiş kanal başlatmada kullanılabilir kalan kurulum zamanı çalışma zamanı yardımcıları | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | kullanım dışı uyumluluk takma adı; `plugin-sdk/setup-runtime` kullanın                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                  |
| `plugin-sdk/setup-tools`           | kurulum/yükleme CLI/arşiv/dokümantasyon yardımcıları                                       | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

`moveSingleAccountChannelSectionToDefaultAccount(...)` gibi yapılandırma yaması yardımcıları dahil tam paylaşılan kurulum araç kutusunu istediğinizde daha geniş `plugin-sdk/setup` seam'ini kullanın.

Sabit kurulum sihirbazı metinleri için `createSetupTranslator(...)` kullanın. Bu, CLI sihirbazı yerel ayarını (`OPENCLAW_LOCALE`, ardından sistem yerel ayarı değişkenleri) izler ve İngilizceye geri döner. Plugin'e özgü kurulum metnini Plugin'e ait kodda tutun ve paylaşılan katalog anahtarlarını yalnızca ortak kurulum etiketleri, durum metni ve resmi paketlenmiş Plugin kurulum metni için kullanın.

Kurulum yaması adaptörleri içe aktarmada sıcak yol açısından güvenli kalır. Paketlenmiş tek hesap yükseltme sözleşme yüzeyi araması tembeldir; bu nedenle `plugin-sdk/setup-runtime` içe aktarmak, adaptör fiilen kullanılmadan önce paketlenmiş sözleşme yüzeyi keşfini istekli şekilde yüklemez.

### Kanalın sahip olduğu tek hesap yükseltme

Bir kanal tek hesaplı üst düzey yapılandırmadan `channels.<id>.accounts.*` yapısına yükseldiğinde, varsayılan paylaşılan davranış yükseltilen hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketlenmiş kanallar bu yükseltmeyi kendi kurulum sözleşmesi yüzeyi üzerinden daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten varsa yalnızca bu anahtarlar yükseltilen hesaba taşınır; paylaşılan politika/teslim anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın alacağını seçer

<Note>
Matrix geçerli paketlenmiş örnektir. Tam olarak bir adlandırılmış Matrix hesabı zaten varsa veya `defaultAccount`, `Ops` gibi mevcut kanonik olmayan bir anahtarı gösteriyorsa yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur.
</Note>

## Yapılandırma şeması

Plugin yapılandırması, manifestinizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar Plugin'leri şu yolla yapılandırır:

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

Bir Zod şemasını Plugin'e ait yapılandırma yapıtları tarafından kullanılan `ChannelConfigSchema` sarmalayıcısına dönüştürmek için `buildChannelConfigSchema` kullanın:

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

Üçüncü taraf Plugin'ler için soğuk yol sözleşmesi hâlâ Plugin manifestidir: oluşturulan JSON Schema'yı `openclaw.plugin.json#channelConfigs` içine yansıtın; böylece yapılandırma şeması, kurulum ve UI yüzeyleri çalışma zamanı kodunu yüklemeden `channels.<id>` inceleyebilir.

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

`ChannelSetupWizard` türü `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` ve daha fazlasını destekler. Tam örnekler için paketlenmiş Plugin paketlerine (örneğin Discord Plugin'i `src/channel.setup.ts`) bakın.

<AccordionGroup>
  <Accordion title="Paylaşılan allowFrom istemleri">
    Yalnızca standart `note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için `openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` ve `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standart kanal kurulum durumu">
    Yalnızca etiketlere, puanlara ve isteğe bağlı ek satırlara göre değişen kanal kurulum durumu blokları için her Plugin'de aynı `status` nesnesini elle yazmak yerine `openclaw/plugin-sdk/setup` içinden `createStandardChannelSetupStatus(...)` kullanmayı tercih edin.
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

    `plugin-sdk/channel-setup`, bu isteğe bağlı yükleme yüzeyinin yalnızca bir yarısına ihtiyaç duyduğunuzda daha düşük düzeyli `createOptionalChannelSetupAdapter(...)` ve `createOptionalChannelSetupWizard(...)` oluşturucularını da dışa aktarır.

    Oluşturulan isteğe bağlı adaptör/sihirbaz gerçek yapılandırma yazmalarında kapalı başarısız olur. `validateInput`, `applyAccountConfig` ve `finalize` genelinde tek bir yükleme gerekli mesajını yeniden kullanır ve `docsPath` ayarlandığında bir dokümantasyon bağlantısı ekler.

  </Accordion>
  <Accordion title="İkili dosya destekli kurulum yardımcıları">
    İkili dosya destekli kurulum UI'ları için aynı ikili dosya/durum bağlantısını her kanala kopyalamak yerine paylaşılan yetkilendirilmiş yardımcıları tercih edin:

    - Yalnızca etiketlere, ipuçlarına, puanlara ve ikili dosya algılamaya göre değişen durum blokları için `createDetectedBinaryStatus(...)`
    - Yol destekli metin girişleri için `createCliPathTextInput(...)`
    - `setupEntry` daha ağır bir tam sihirbaza tembel şekilde iletmek zorunda olduğunda `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve `createDelegatedResolveConfigured(...)`
    - `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını yetkilendirmek zorunda olduğunda `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## Yayımlama ve kurulum

**Harici Plugin'ler:** [ClawHub](/tr/clawhub) üzerinde yayımlayın, ardından kurun:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Çıplak paket belirtimleri, başlatma geçişi sırasında npm üzerinden kurulur.

  </Tab>
  <Tab title="Yalnızca ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm paket belirtimi">
    Bir paket henüz ClawHub'a taşınmadığında veya geçiş sırasında doğrudan bir
    npm kurulum yoluna ihtiyacınız olduğunda npm kullanın:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Depo içi Plugin'ler:** paketlenmiş Plugin çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik olarak keşfedilirler.

**Kullanıcılar şunu kurabilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm kaynaklı kurulumlarda, `openclaw plugins install` paketi, yaşam döngüsü betikleri devre dışı bırakılmış şekilde `~/.openclaw/npm/projects` altında Plugin başına ayrı bir projeye kurar. Plugin bağımlılık ağaçlarını saf JS/TS olarak tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

<Note>
Gateway başlatması Plugin bağımlılıklarını kurmaz. npm/git/ClawHub kurulum akışları bağımlılık yakınsamasının sahibidir; yerel Plugin'lerin bağımlılıkları zaten kurulmuş olmalıdır.
</Note>

Paketlenmiş paket üst verileri açıktır; Gateway başlatılırken derlenmiş JavaScript'ten çıkarımsanmaz. Çalışma zamanı bağımlılıkları, onlara sahip olan Plugin paketinde yer alır; paketlenmiş OpenClaw başlatması Plugin bağımlılıklarını hiçbir zaman onarmaz veya yansıtmaz.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — adım adım başlangıç kılavuzu
- [Plugin manifesti](/tr/plugins/manifest) — tam manifest şeması başvurusu
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry`
