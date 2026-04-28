---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz.
    - '`setup-entry.ts` ile `index.ts` arasındaki farkı anlamanız gerekiyor.'
    - Plugin yapılandırma şemaları veya `package.json` içindeki `openclaw` meta verilerini tanımlıyorsunuz.
sidebarTitle: Setup and config
summary: Kurulum sihirbazları, `setup-entry.ts`, yapılandırma şemaları ve `package.json` meta verileri
title: Plugin kurulumu ve yapılandırması
x-i18n:
    generated_at: "2026-04-26T11:37:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Plugin paketleme (`package.json` meta verileri), manifest'ler (`openclaw.plugin.json`), kurulum girişleri ve yapılandırma şemaları için başvuru.

<Tip>
**Bir adım adım kılavuz mu arıyorsunuz?** Nasıl yapılır kılavuzları paketlemeyi bağlam içinde açıklar: [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanız, Plugin sistemine Plugin'inizin ne sağladığını söyleyen bir `openclaw` alanı içermelidir:

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
          "blurb": "Kanalın kısa açıklaması."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Sağlayıcı Plugin'i / ClawHub tabanı">
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
Plugin'i ClawHub üzerinde harici olarak yayımlıyorsanız, bu `compat` ve `build` alanları zorunludur. Kanonik yayımlama parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.
</Note>

### `openclaw` alanları

<ParamField path="extensions" type="string[]">
  Giriş noktası dosyaları (paket köküne göre göreli).
</ParamField>
<ParamField path="setupEntry" type="string">
  Yalnızca kurulum için hafif giriş (isteğe bağlı).
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
  Başlangıç davranış bayrakları.
</ParamField>

### `openclaw.channel`

`openclaw.channel`, çalışma zamanı yüklenmeden önce kanal keşfi ve kurulum yüzeyleri için ucuz paket meta verisidir.

| Alan                                   | Tür         | Anlamı                                                                        |
| -------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`    | Kanonik kanal kimliği.                                                        |
| `label`                                | `string`    | Birincil kanal etiketi.                                                       |
| `selectionLabel`                       | `string`    | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi.         |
| `detailLabel`                          | `string`    | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi. |
| `docsPath`                             | `string`    | Kurulum ve seçim bağlantıları için belge yolu.                                |
| `docsLabel`                            | `string`    | Belge bağlantıları için, kanal kimliğinden farklı olması gerektiğinde kullanılan geçersiz kılma etiketi. |
| `blurb`                                | `string`    | Kısa ilk kurulum/katalog açıklaması.                                          |
| `order`                                | `number`    | Kanal kataloglarındaki sıralama düzeni.                                       |
| `aliases`                              | `string[]`  | Kanal seçimi için ek arama takma adları.                                      |
| `preferOver`                           | `string[]`  | Bu kanalın üstünde yer alması gereken daha düşük öncelikli Plugin/kanal kimlikleri. |
| `systemImage`                          | `string`    | Kanal UI katalogları için isteğe bağlı simge/sistem-görsel adı.               |
| `selectionDocsPrefix`                  | `string`    | Seçim yüzeylerinde belge bağlantılarından önce gelen önek metni.              |
| `selectionDocsOmitLabel`               | `boolean`   | Seçim metninde etiketli belge bağlantısı yerine belge yolunu doğrudan gösterir. |
| `selectionExtras`                      | `string[]`  | Seçim metnine eklenen kısa ek dizgeler.                                       |
| `markdownCapable`                      | `boolean`   | Giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler. |
| `exposure`                             | `object`    | Kurulum, yapılandırılmış listeler ve belge yüzeyleri için kanal görünürlük denetimleri. |
| `quickstartAllowFrom`                  | `boolean`   | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.    |
| `forceAccountBinding`                  | `boolean`   | Yalnızca bir hesap olsa bile açık hesap bağlama gerektirir.                   |
| `preferSessionLookupForAnnounceTarget` | `boolean`   | Bu kanal için duyuru hedeflerini çözerken oturum aramasını tercih eder.       |

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
      "blurb": "Webhook tabanlı, self-hosted sohbet entegrasyonu.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Kılavuz:",
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
- `docs`: kanalı belge/gezinme yüzeylerinde dışa açık olarak işaretle

<Note>
`showConfigured` ve `showInSetup`, eski takma adlar olarak desteklenmeye devam eder. `exposure` tercih edin.
</Note>

### `openclaw.install`

`openclaw.install`, manifest meta verisi değil paket meta verisidir.

| Alan                         | Tür                    | Anlamı                                                                           |
| ---------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`               | Kurulum/güncelleme akışları için kanonik npm spec değeri.                        |
| `localPath`                  | `string`               | Yerel geliştirme veya paketlenmiş kurulum yolu.                                  |
| `defaultChoice`              | `"npm"` \| `"local"`   | Her ikisi de mevcut olduğunda tercih edilen kurulum kaynağı.                     |
| `minHostVersion`             | `string`               | `>=x.y.z` biçiminde minimum desteklenen OpenClaw sürümü.                         |
| `expectedIntegrity`          | `string`               | Sabitlenmiş kurulumlar için beklenen npm dist bütünlük dizgesi, genellikle `sha512-...`. |
| `allowInvalidConfigRecovery` | `boolean`              | Paketlenmiş Plugin yeniden kurulum akışlarının belirli eski yapılandırma hatalarından kurtulmasına izin verir. |

<AccordionGroup>
  <Accordion title="İlk kurulum davranışı">
    Etkileşimli ilk kurulum da isteğe bağlı kurulum yüzeyleri için `openclaw.install` kullanır. Plugin'iniz çalışma zamanı yüklenmeden önce sağlayıcı auth seçeneklerini veya kanal kurulum/katalog meta verilerini açığa çıkarıyorsa, ilk kurulum bu seçimi gösterebilir, npm ve yerel kurulum arasında seçim yaptırabilir, Plugin'i kurabilir veya etkinleştirebilir, sonra seçilen akışa devam edebilir. npm ilk kurulum seçimleri, kayıt defteri `npmSpec` değeri olan güvenilir katalog meta verileri gerektirir; tam sürümler ve `expectedIntegrity` isteğe bağlı sabitlemelerdir. `expectedIntegrity` varsa kurulum/güncelleme akışları bunu zorunlu kılar. "Neyi göstereceğini" belirleyen meta veriyi `openclaw.plugin.json` içinde, "nasıl kurulacağını" belirleyen meta veriyi `package.json` içinde tutun.
  </Accordion>
  <Accordion title="minHostVersion zorlaması">
    `minHostVersion` ayarlanmışsa hem kurulum hem de manifest-registry yükleme bunu zorunlu kılar. Daha eski hostlar Plugin'i atlar; geçersiz sürüm dizgeleri reddedilir.
  </Accordion>
  <Accordion title="Sabitlenmiş npm kurulumları">
    Sabitlenmiş npm kurulumları için tam sürümü `npmSpec` içinde tutun ve beklenen artifact bütünlüğünü ekleyin:

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
    `allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir atlama mekanizması değildir. Yalnızca dar kapsamlı paketlenmiş Plugin kurtarma içindir; böylece yeniden kurulum/kurulum, eksik paketlenmiş Plugin yolu veya aynı Plugin için eski `channels.<id>` girdisi gibi bilinen yükseltme artıklarını onarabilir. Yapılandırma ilgisiz nedenlerle bozuksa kurulum yine kapalı kalacak şekilde başarısız olur ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.
  </Accordion>
</AccordionGroup>

### Ertelenmiş tam yükleme

Kanal Plugin'leri şu yapı ile ertelenmiş yüklemeye katılabilir:

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

Bu etkin olduğunda OpenClaw, zaten yapılandırılmış kanallar için bile dinleme öncesi başlangıç aşamasında yalnızca `setupEntry` yükler. Tam giriş, gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
Yalnızca `setupEntry` dosyanız gateway'in dinlemeye başlamasından önce ihtiyaç duyduğu her şeyi kaydediyorsa ertelenmiş yüklemeyi etkinleştirin (kanal kaydı, HTTP rotaları, gateway yöntemleri). Tam giriş gerekli başlangıç yeteneklerinin sahibiyse varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz gateway RPC yöntemleri kaydediyorsa bunları Plugin'e özgü bir önek üzerinde tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğin sahipliğinde kalır ve her zaman `operator.admin` olarak çözülür.

## Plugin manifest'i

Her yerel Plugin, paket kökünde bir `openclaw.plugin.json` bulundurmalıdır. OpenClaw bunu, Plugin kodunu yürütmeden yapılandırmayı doğrulamak için kullanır.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "OpenClaw'a My Plugin yeteneklerini ekler",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook doğrulama gizli bilgisi"
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

Tam şema başvurusu için bkz. [Plugin manifest'i](/tr/plugins/manifest).

## ClawHub yayımlama

Plugin paketleri için pakete özel ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Eski yalnızca-skill yayımlama takma adı skill'ler içindir. Plugin paketleri her zaman `clawhub package publish` kullanmalıdır.
</Note>

## Kurulum girişi

`setup-entry.ts` dosyası, OpenClaw'ın yalnızca kurulum yüzeylerine ihtiyaç duyduğunda yüklediği `index.ts` dosyasına hafif bir alternatiftir (ilk kurulum, yapılandırma onarımı, devre dışı kanal incelemesi).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodunu (kriptografi kütüphaneleri, CLI kayıtları, arka plan hizmetleri) yüklemekten kaçınır.

Kuruluma güvenli dış modüllerde setup-safe dışa aktarımlar tutan paketlenmiş çalışma alanı kanalları, `defineSetupPluginEntry(...)` yerine `openclaw/plugin-sdk/channel-entry-contract` içinden `defineBundledChannelSetupEntry(...)` kullanabilir. Bu paketlenmiş sözleşme ayrıca isteğe bağlı bir `runtime` dışa aktarımını da destekler; böylece kurulum zamanı çalışma zamanı bağlama hafif ve açık kalabilir.

<AccordionGroup>
  <Accordion title="OpenClaw ne zaman tam giriş yerine setupEntry kullanır">
    - Kanal devre dışıdır ama kurulum/ilk kurulum yüzeylerine ihtiyaç vardır.
    - Kanal etkindir ama yapılandırılmamıştır.
    - Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry'nin kaydetmesi gerekenler">
    - Kanal Plugin nesnesi (`defineSetupPluginEntry` aracılığıyla).
    - Gateway dinlemeye başlamadan önce gerekli tüm HTTP rotaları.
    - Başlangıç sırasında gereken tüm gateway yöntemleri.

    Bu başlangıç gateway yöntemleri yine `config.*` veya `update.*` gibi ayrılmış çekirdek yönetici ad alanlarından kaçınmalıdır.

  </Accordion>
  <Accordion title="setupEntry'nin İÇERMEMESİ gerekenler">
    - CLI kayıtları.
    - Arka plan hizmetleri.
    - Ağır çalışma zamanı içe aktarımları (kriptografi, SDK'ler).
    - Yalnızca başlangıçtan sonra gereken gateway yöntemleri.

  </Accordion>
</AccordionGroup>

### Dar kurulum yardımcı içe aktarımları

Yoğun kullanılan yalnızca-kurulum yolları için, kurulum yüzeyinin yalnızca bir bölümüne ihtiyaç duyduğunuzda daha geniş `plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcı katmanlarını tercih edin:

| İçe aktarma yolu                  | Kullanım amacı                                                                          | Temel dışa aktarımlar                                                                                                                                                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | `setupEntry` / ertelenmiş kanal başlangıcında kullanılabilir kalan kurulum zamanı çalışma zamanı yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`| ortam farkındalıklı hesap kurulum bağdaştırıcıları                                      | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                           |
| `plugin-sdk/setup-tools`          | kurulum/yükleme CLI/arşiv/belge yardımcıları                                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                 |

Yapılandırma yaması yardımcıları olan `moveSingleAccountChannelSectionToDefaultAccount(...)` gibi araçlar dahil tam paylaşılan kurulum araç kutusunu istediğinizde daha geniş `plugin-sdk/setup` katmanını kullanın.

Kurulum yama bağdaştırıcıları içe aktarma sırasında yoğun yol açısından güvenli kalır. Bunların paketlenmiş tek hesap yükseltme sözleşme-yüzeyi araması tembeldir; bu nedenle `plugin-sdk/setup-runtime` içe aktarmak, bağdaştırıcı gerçekten kullanılmadan önce paketlenmiş sözleşme-yüzeyi keşfini hevesli biçimde yüklemez.

### Kanal sahipli tek hesap yükseltmesi

Bir kanal tek hesaplı üst düzey yapılandırmadan `channels.<id>.accounts.*` yapısına yükseltildiğinde, varsayılan paylaşılan davranış yükseltilen hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketlenmiş kanallar, kurulum sözleşme yüzeyleri üzerinden bu yükseltmeyi daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten mevcutsa yalnızca bu anahtarlar yükseltilen hesaba taşınır; paylaşılan ilke/teslim anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın alacağını seçer

<Note>
Matrix şu anki paketlenmiş örnektir. Tam olarak bir adlandırılmış Matrix hesabı zaten varsa veya `defaultAccount`, `Ops` gibi mevcut kanonik olmayan bir anahtarı işaret ediyorsa yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine o hesabı korur.
</Note>

## Yapılandırma şeması

Plugin yapılandırması, manifest'inizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar Plugin'leri şu yolla yapılandırır:

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

Plugin'iniz kayıt sırasında bu yapılandırmayı `api.pluginConfig` olarak alır.

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

Zod şemasını, Plugin sahipli yapılandırma artifact'leri tarafından kullanılan `ChannelConfigSchema` sarmalayıcısına dönüştürmek için `buildChannelConfigSchema` kullanın:

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

Üçüncü taraf Plugin'ler için soğuk yol sözleşmesi yine Plugin manifest'idir: çalışma zamanı kodu yüklenmeden yapılandırma şeması, kurulum ve UI yüzeylerinin `channels.<id>` değerini inceleyebilmesi için üretilen JSON Schema'yı `openclaw.plugin.json#channelConfigs` içine yansıtın.

## Kurulum sihirbazları

Kanal Plugin'leri, `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir. Sihirbaz, `ChannelPlugin` üzerindeki bir `ChannelSetupWizard` nesnesidir:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Bağlandı",
    unconfiguredLabel: "Yapılandırılmadı",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot belirteci",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Ortamdan MY_CHANNEL_BOT_TOKEN kullanılsın mı?",
      keepPrompt: "Geçerli belirteç korunsun mu?",
      inputPrompt: "Bot belirtecinizi girin:",
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
    Yalnızca standart `note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için `openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` ve `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standart kanal kurulum durumu">
    Yalnızca etiketler, puanlar ve isteğe bağlı ek satırlara göre değişen kanal kurulum durum blokları için, her Plugin'de aynı `status` nesnesini elle yazmak yerine `openclaw/plugin-sdk/setup` içinden `createStandardChannelSetupStatus(...)` kullanın.
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
    // { setupAdapter, setupWizard } döndürür
    ```

    `plugin-sdk/channel-setup`, isteğe bağlı kurulum yüzeyinin yalnızca bir yarısına ihtiyaç duyduğunuzda daha düşük düzeyli `createOptionalChannelSetupAdapter(...)` ve `createOptionalChannelSetupWizard(...)` oluşturucularını da sunar.

    Üretilen isteğe bağlı bağdaştırıcı/sihirbaz, gerçek yapılandırma yazımlarında kapalı kalacak şekilde başarısız olur. `validateInput`, `applyAccountConfig` ve `finalize` boyunca aynı kurulum-gerekli iletisini yeniden kullanır ve `docsPath` ayarlıysa bir belge bağlantısı ekler.

  </Accordion>
  <Accordion title="İkili dosya destekli kurulum yardımcıları">
    İkili dosya destekli kurulum UI'leri için aynı ikili dosya/durum yapıştırıcısını her kanala kopyalamak yerine paylaşılan devredilen yardımcıları tercih edin:

    - yalnızca etiketler, ipuçları, puanlar ve ikili dosya algılamasına göre değişen durum blokları için `createDetectedBinaryStatus(...)`
    - yol tabanlı metin girdileri için `createCliPathTextInput(...)`
    - `setupEntry` daha ağır bir tam sihirbaza tembel biçimde yönlendirme yapacaksa `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve `createDelegatedResolveConfigured(...)`
    - `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını devretmek zorundaysa `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## Yayımlama ve kurma

**Harici Plugin'ler:** [ClawHub](/tr/tools/clawhub) veya npm'ye yayımlayın, sonra kurun:

<Tabs>
  <Tab title="Otomatik (önce ClawHub sonra npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw önce ClawHub'ı dener ve otomatik olarak npm'ye geri döner.

  </Tab>
  <Tab title="Yalnızca ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm paket spec değeri">
    Eşleşen bir `npm:` geçersiz kılması yoktur. ClawHub geri dönüşünden sonra npm yolunu istediğinizde normal npm paket spec değerini kullanın:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Repo içi Plugin'ler:** paketlenmiş Plugin çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik keşfedilirler.

**Kullanıcılar şunu kurabilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm kaynaklı kurulumlarda `openclaw plugins install`, proje-yerel `npm install --ignore-scripts` çalıştırır (yaşam döngüsü betikleri yoktur) ve devralınan genel npm kurulum ayarlarını yok sayar. Plugin bağımlılık ağaçlarını saf JS/TS tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

<Note>
Başlangıç onarımındaki tek istisna, OpenClaw sahipli paketlenmiş Plugin'lerdir: paketlenmiş bir kurulum bunlardan birini Plugin yapılandırması, eski kanal yapılandırması veya paketlenmiş varsayılan-etkin manifest üzerinden etkin gördüğünde, başlangıç o Plugin'in eksik çalışma zamanı bağımlılıklarını içe aktarmadan önce kurar. Üçüncü taraf Plugin'ler başlangıç kurulumlarına güvenmemelidir; açık Plugin yükleyicisini kullanmaya devam edin.
</Note>

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — adım adım başlangıç kılavuzu
- [Plugin manifest'i](/tr/plugins/manifest) — tam manifest şema başvurusu
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry`
