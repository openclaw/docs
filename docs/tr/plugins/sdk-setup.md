---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - setup-entry.ts ile index.ts arasındaki farkı anlamanız gerekir
    - Plugin yapılandırma şemalarını veya package.json içindeki openclaw meta verilerini tanımlıyorsunuz
sidebarTitle: Setup and config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Plugin kurulumu ve yapılandırması
x-i18n:
    generated_at: "2026-07-12T12:39:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin paketleme (`package.json` meta verileri), manifestler (`openclaw.plugin.json`), kurulum girdileri ve yapılandırma şemaları için başvuru kaynağı.

<Tip>
**Adım adım rehber mi arıyorsunuz?** Nasıl yapılır kılavuzları, paketlemeyi bağlamı içinde ele alır: [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızda, Plugin sistemine Plugininizin ne sunduğunu bildiren bir `openclaw` alanı bulunmalıdır:

<Tabs>
  <Tab title="Kanal Plugini">
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
  <Tab title="Sağlayıcı Plugini / ClawHub temel yapılandırması">
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
ClawHub üzerinde harici olarak yayımlama için `compat` ve `build` gereklidir. Standart yayımlama parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.
</Note>

### `openclaw` alanları

<ParamField path="extensions" type="string[]">
  Giriş noktası dosyaları (paket köküne göre). Çalışma alanı ve git checkout geliştirmesi için geçerli kaynak girdileridir.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  OpenClaw kurulu bir npm paketini yüklediğinde tercih edilen, `extensions` için derlenmiş JavaScript eş dosyaları. Kaynak/derlenmiş çözümleme sırası için [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.
</ParamField>
<ParamField path="setupEntry" type="string">
  Yalnızca kurulum için kullanılan hafif giriş (isteğe bağlı).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  `setupEntry` için derlenmiş JavaScript eş dosyası. `setupEntry` alanının da ayarlanmasını gerektirir.
</ParamField>
<ParamField path="plugin" type="object">
  Bir Pluginin kimlik veya etiket türetilebilecek kanal/sağlayıcı meta verileri olmadığında kullanılan yedek `{ id, label }` Plugin kimliği.
</ParamField>
<ParamField path="channel" type="object">
  Kurulum, seçici, hızlı başlangıç ve durum yüzeyleri için kanal kataloğu meta verileri.
</ParamField>
<ParamField path="install" type="object">
  Kurulum ipuçları: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Başlatma davranışı bayrakları.
</ParamField>
<ParamField path="compat" type="object">
  Bu Pluginin desteklediği `pluginApi` sürüm aralığı. Harici ClawHub yayımları için gereklidir.
</ParamField>

<Note>
Sağlayıcı kimlikleri (`providers: string[]`) paket meta verileri değil, manifest meta verileridir. Bunları burada değil, `openclaw.plugin.json` içinde bildirin — bkz. [Plugin manifesti](/tr/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel`, çalışma zamanı yüklenmeden önce kanal keşfi ve kurulum yüzeyleri için kullanılan düşük maliyetli paket meta verileridir.

| Alan                                   | Tür        | Anlamı                                                                         |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Standart kanal kimliği.                                                        |
| `label`                                | `string`   | Birincil kanal etiketi.                                                        |
| `selectionLabel`                       | `string`   | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi.          |
| `detailLabel`                          | `string`   | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi. |
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için dokümantasyon yolu.                         |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde dokümantasyon bağlantılarında kullanılan geçersiz kılma etiketi. |
| `blurb`                                | `string`   | Kısa ilk kullanım/katalog açıklaması.                                          |
| `order`                                | `number`   | Kanal kataloglarındaki sıralama düzeni.                                        |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama takma adları.                                       |
| `preferOver`                           | `string[]` | Bu kanalın önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal kullanıcı arayüzü katalogları için isteğe bağlı simge/sistem görüntüsü adı. |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerindeki dokümantasyon bağlantılarından önce gelen ön ek metni.    |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim metninde etiketli bir dokümantasyon bağlantısı yerine dokümantasyon yolunu doğrudan gösterir. |
| `selectionExtras`                      | `string[]` | Seçim metnine eklenen kısa metinler.                                           |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı Markdown destekli olarak işaretler.  |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış listeler ve dokümantasyon yüzeyleri için kanal görünürlüğü denetimleri. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.     |
| `forceAccountBinding`                  | `boolean`  | Yalnızca bir hesap bulunsa bile açık hesap bağlamayı zorunlu kılar.            |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bu kanalın duyuru hedefleri çözümlenirken oturum aramasını tercih eder.         |

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
`showConfigured` ve `showInSetup`, eski takma adlar olarak desteklenmeye devam eder. `exposure` kullanmayı tercih edin.
</Note>

### `openclaw.install`

`openclaw.install`, manifest meta verileri değil, paket meta verileridir.

| Alan                         | Tür                                 | Anlamı                                                                            |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kurulum/güncelleme ve ilk kullanım sırasında isteğe bağlı kurulum akışları için standart ClawHub belirtimi. |
| `npmSpec`                    | `string`                            | Kurulum/güncelleme yedek akışları için standart npm belirtimi.                    |
| `localPath`                  | `string`                            | Yerel geliştirme veya paketlenmiş kurulum yolu.                                   |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Birden fazla kaynak kullanılabildiğinde tercih edilen kurulum kaynağı.            |
| `minHostVersion`             | `string`                            | Desteklenen en düşük OpenClaw sürümü: `>=x.y.z` veya `>=x.y.z-prerelease`.        |
| `expectedIntegrity`          | `string`                            | Sabitlenmiş kurulumlar için genellikle `sha512-...` biçimindeki beklenen npm dağıtım bütünlüğü dizesi. |
| `allowInvalidConfigRecovery` | `boolean`                           | Paketlenmiş Plugin yeniden kurulum akışlarının belirli eski yapılandırma hatalarından kurtulmasını sağlar. |
| `requiredPlatformPackages`   | `string[]`                          | npm kurulumu sırasında doğrulanan, platforma özgü gerekli npm takma adları.       |

<AccordionGroup>
  <Accordion title="İlk kullanım davranışı">
    Etkileşimli ilk kullanım akışı, isteğe bağlı kurulum yüzeyleri için `openclaw.install` kullanır: Plugininiz çalışma zamanı yüklenmeden önce sağlayıcı kimlik doğrulama seçeneklerini veya kanal kurulum/katalog meta verilerini sunuyorsa ilk kullanım akışı ClawHub, npm ya da yerel kurulum seçeneğini sorabilir, Plugini kurabilir veya etkinleştirebilir ve ardından seçilen akışı sürdürebilir. ClawHub seçenekleri `clawhubSpec` kullanır ve mevcut olduğunda tercih edilir; npm seçenekleri, kayıt defterinde bir `npmSpec` bulunan güvenilir katalog meta verileri gerektirir (tam sürümler ve `expectedIntegrity`, ayarlandıklarında kurulum/güncelleme sırasında uygulanan isteğe bağlı sabitlemelerdir). "Neyin gösterileceğini" `openclaw.plugin.json` içinde, "nasıl kurulacağını" ise `package.json` içinde tutun.
  </Accordion>
  <Accordion title="minHostVersion uygulaması">
    `minHostVersion` ayarlanmışsa hem kurulum hem de paketlenmemiş manifest kayıt defteri yüklemesi bunu uygular. Eski ana makineler harici Pluginleri atlar; geçersiz sürüm dizeleri reddedilir. Paketlenmiş kaynak Pluginlerinin ana makine checkout'uyla aynı sürüme sahip olduğu varsayılır.
  </Accordion>
  <Accordion title="Sabitlenmiş npm kurulumları">
    Sabitlenmiş npm kurulumlarında tam sürümü `npmSpec` içinde tutun ve beklenen yapıt bütünlüğünü ekleyin:

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
    `allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir atlatma mekanizması değildir. Yalnızca paketlenmiş Plugin kurtarmasına yönelik dar kapsamlı bir seçenektir; yeniden kurulumun/kurulumun, eksik paketlenmiş Plugin yolu veya aynı Plugine ait eski bir `channels.<id>` girdisi gibi bilinen yükseltme kalıntılarını onarmasına olanak tanır. Yapılandırma ilgisiz nedenlerle bozuksa kurulum yine güvenli biçimde başarısız olur ve operatöre `openclaw doctor --fix` komutunu çalıştırmasını bildirir.
  </Accordion>
</AccordionGroup>

### Ertelenmiş tam yükleme

Kanal Pluginleri aşağıdaki ayarla ertelenmiş yüklemeyi etkinleştirebilir:

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

Etkinleştirildiğinde OpenClaw, ön dinleme başlatma aşamasında önceden yapılandırılmış kanallar için bile yalnızca `setupEntry` girdisini yükler. Tam giriş, Gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
Ertelenmiş yüklemeyi yalnızca `setupEntry` girdiniz Gateway dinlemeye başlamadan önce ihtiyaç duyduğu her şeyi (kanal kaydı, HTTP rotaları, Gateway yöntemleri) kaydediyorsa etkinleştirin. Gerekli başlatma yetenekleri tam girişe aitse varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz Gateway RPC yöntemlerini kaydediyorsa bunları Plugine özgü bir ön ek altında tutun. Ayrılmış temel yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) temel sisteme ait kalır ve her zaman `operator.admin` olarak normalleştirilir.

## Plugin manifesti

Her yerel plugin, paket kökünde bir `openclaw.plugin.json` dosyasıyla birlikte sunulmalıdır. OpenClaw, plugin kodunu çalıştırmadan yapılandırmayı doğrulamak için bunu kullanır.

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

Kanal pluginleri için `channels` ekleyin (sağlayıcı pluginleri ise `providers` ekler):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Yapılandırması olmayan pluginler bile bir şemayla birlikte sunulmalıdır. Boş bir şema geçerlidir:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Tam şema başvurusu için [Plugin bildirimi](/tr/plugins/manifest) bölümüne bakın.

## ClawHub'da yayımlama

Skills ve plugin paketleri ayrı ClawHub yayımlama komutları kullanır. Plugin paketleri için pakete özgü komutu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>`, bir plugin paketini değil, bir Skills klasörünü yayımlamaya yönelik farklı bir komuttur. Bkz. [ClawHub'da yayımlama](/tr/clawhub/publishing).
</Note>

## Kurulum giriş noktası

`setup-entry.ts`, OpenClaw yalnızca kurulum yüzeylerine (ilk katılım, yapılandırma onarımı, devre dışı bırakılmış kanal incelemesi) ihtiyaç duyduğunda yüklediği, `index.ts` dosyasına göre daha hafif bir alternatiftir:

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodlarının (kriptografi kitaplıkları, CLI kayıtları, arka plan hizmetleri) yüklenmesini önler.

Kuruluma uygun dışa aktarımları yardımcı modüllerde tutan paketle birlikte sunulan çalışma alanı kanalları, `defineSetupPluginEntry(...)` yerine `openclaw/plugin-sdk/channel-entry-contract` içindeki `defineBundledChannelSetupEntry(...)` işlevini kullanabilir. Paketle birlikte sunulan bu sözleşme, kurulum zamanı çalışma bağlantılarının hafif ve açık kalabilmesi için isteğe bağlı bir `runtime` dışa aktarımını da destekler.

<AccordionGroup>
  <Accordion title="OpenClaw tam giriş noktası yerine setupEntry'yi ne zaman kullanır?">
    - Kanal devre dışıdır ancak kurulum/ilk katılım yüzeylerine ihtiyaç duyar.
    - Kanal etkindir ancak yapılandırılmamıştır.
    - Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry neleri kaydetmelidir?">
    - Kanal plugin nesnesi (`defineSetupPluginEntry` aracılığıyla).
    - Gateway dinlemeye başlamadan önce gereken tüm HTTP yolları.
    - Başlatma sırasında gereken tüm Gateway yöntemleri.

    Bu başlatma Gateway yöntemleri yine de `config.*` veya `update.*` gibi ayrılmış çekirdek yönetici ad alanlarından kaçınmalıdır.

  </Accordion>
  <Accordion title="setupEntry neleri İÇERMEMELİDİR?">
    - CLI kayıtları.
    - Arka plan hizmetleri.
    - Ağır çalışma zamanı içe aktarımları (kriptografi, SDK'lar).
    - Yalnızca başlatmadan sonra gereken Gateway yöntemleri.

  </Accordion>
</AccordionGroup>

### Dar kapsamlı kurulum yardımcısı içe aktarımları

Yalnızca kurulum için kullanılan yoğun yollarda, kurulum yüzeyinin yalnızca bir bölümüne ihtiyacınız olduğunda daha geniş `plugin-sdk/setup` şemsiyesi yerine dar kapsamlı kurulum yardımcısı bağlantılarını tercih edin:

| İçe aktarma yolu                    | Kullanım amacı                                                                              | Temel dışa aktarımlar                                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / ertelenmiş kanal başlatmasında kullanılabilir kalan kurulum zamanı çalışma yardımcıları | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/setup-runtime` kullanın             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | kurulum/yükleme CLI/arşiv/belge yardımcıları                                                | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

`moveSingleAccountChannelSectionToDefaultAccount(...)` gibi yapılandırma yaması yardımcılarını da içeren paylaşılan kurulum araçlarının tamamını istediğinizde daha geniş `plugin-sdk/setup` bağlantısını kullanın.

Sabit kurulum sihirbazı metinleri için `createSetupTranslator(...)` kullanın. CLI sihirbazının yerel ayarını izler (`OPENCLAW_LOCALE`, ardından sistem yerel ayar değişkenleri) ve İngilizceye geri döner. Plugine özgü kurulum metinlerini Pluginin sahip olduğu kodda tutun; paylaşılan katalog anahtarlarını yalnızca ortak kurulum etiketleri, durum metinleri ve resmi paketlenmiş Plugin kurulum metinleri için kullanın.

Kurulum yama bağdaştırıcıları, içe aktarma sırasında yoğun yol açısından güvenli kalır. Paketlenmiş tek hesap yükseltme sözleşme yüzeyi araması tembeldir; bu nedenle `plugin-sdk/setup-runtime` içe aktarıldığında, bağdaştırıcı gerçekten kullanılmadan önce paketlenmiş sözleşme yüzeyi keşfi istekli olarak yüklenmez.

### Kanalın sahip olduğu tek hesap yükseltme

Bir kanal, tek hesaplı üst düzey yapılandırmadan `channels.<id>.accounts.*` yapısına yükseltildiğinde, varsayılan paylaşılan davranış yükseltilen hesap kapsamındaki değerleri `accounts.default` içine taşır.

Paketlenmiş kanallar, kurulum sözleşme yüzeyleri aracılığıyla bu yükseltmeyi daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten mevcutsa yalnızca bu anahtarlar yükseltilen hesaba taşınır; paylaşılan ilke/teslim anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın alacağını seçer

<Note>
Matrix, güncel paketlenmiş örnektir. Tam olarak bir adlandırılmış Matrix hesabı zaten mevcutsa veya `defaultAccount`, `Ops` gibi mevcut ancak kurallı olmayan bir anahtarı gösteriyorsa yükseltme, yeni bir `accounts.default` girdisi oluşturmak yerine bu hesabı korur.
</Note>

## Yapılandırma şeması

Plugin yapılandırması, manifestinizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar Pluginleri şu şekilde yapılandırır:

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

Plugininiz, kayıt sırasında bu yapılandırmayı `api.pluginConfig` olarak alır.

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

Bir Zod şemasını, Pluginin sahip olduğu yapılandırma yapıtlarının kullandığı `ChannelConfigSchema` sarmalayıcısına dönüştürmek için `buildChannelConfigSchema` kullanın:

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

Sözleşmeyi zaten JSON Schema veya TypeBox olarak yazıyorsanız OpenClaw'ın meta veri yollarında Zod'dan JSON Schema'ya dönüştürmeyi atlayabilmesi için doğrudan yardımcıyı kullanın:

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

Üçüncü taraf Pluginler için soğuk yol sözleşmesi hâlâ Plugin manifestidir: yapılandırma şeması, kurulum ve kullanıcı arayüzü yüzeylerinin çalışma zamanı kodunu yüklemeden `channels.<id>` öğesini inceleyebilmesi için oluşturulan JSON Schema'yı `openclaw.plugin.json#channelConfigs` içine yansıtın.

## Kurulum sihirbazları

Kanal Pluginleri, `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir. Sihirbaz, `ChannelPlugin` üzerindeki bir `ChannelSetupWizard` nesnesidir:

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

`ChannelSetupWizard` ayrıca `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` ve daha fazlasını destekler. Tam bir paketlenmiş örnek için Discord Plugininin `src/setup-core.ts` dosyasına bakın.

<AccordionGroup>
  <Accordion title="Paylaşılan allowFrom istemleri">
    Yalnızca standart `note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan doğrudan mesaj izin listesi istemleri için `openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` ve `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standart kanal kurulum durumu">
    Yalnızca etiketler, puanlar ve isteğe bağlı ek satırlara göre değişen kanal kurulum durum blokları için her Pluginde aynı `status` nesnesini elle oluşturmak yerine `openclaw/plugin-sdk/setup` içindeki `createStandardChannelSetupStatus(...)` işlevini tercih edin.
  </Accordion>
  <Accordion title="İsteğe bağlı kanal kurulum yüzeyi">
    Yalnızca belirli bağlamlarda görünmesi gereken isteğe bağlı kurulum yüzeyleri için `openclaw/plugin-sdk/channel-setup` içindeki `createOptionalChannelSetupSurface` işlevini kullanın:

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

    İsteğe bağlı kurulum yüzeyinin yalnızca bir yarısına ihtiyacınız olduğunda `plugin-sdk/channel-setup`, daha alt düzey `createOptionalChannelSetupAdapter(...)` ve `createOptionalChannelSetupWizard(...)` oluşturucularını da sunar.

    Oluşturulan isteğe bağlı bağdaştırıcı/sihirbaz, gerçek yapılandırma yazma işlemlerinde güvenli biçimde başarısız olur. `validateInput`, `applyAccountConfig` ve `finalize` genelinde kurulum gerekliliğini belirten tek bir iletiyi yeniden kullanır ve `docsPath` ayarlandığında bir dokümantasyon bağlantısı ekler.

  </Accordion>
  <Accordion title="İkili dosya destekli kurulum yardımcıları">
    İkili dosya destekli kurulum kullanıcı arayüzlerinde, aynı ikili dosya/durum bağlantı kodunu her kanala kopyalamak yerine paylaşılan yönlendirmeli yardımcıları tercih edin:

    - Yalnızca etiketlere, ipuçlarına, puanlara ve ikili dosya algılamaya göre değişen durum blokları için `createDetectedBinaryStatus(...)`
    - Yol destekli metin girişleri için `createCliPathTextInput(...)`
    - `setupEntry` öğesinin daha kapsamlı bir tam sihirbaza tembel olarak yönlendirme yapması gerektiğinde `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve `createDelegatedResolveConfigured(...)`
    - `setupEntry` öğesinin yalnızca bir `textInputs[*].shouldPrompt` kararını yönlendirmesi gerektiğinde `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## Yayımlama ve yükleme

**Harici Plugin'ler:** [ClawHub](/tr/clawhub) üzerinde yayımlayın, ardından yükleyin:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Yalın paket belirtimleri, başlatma geçişi sırasında npm'den yüklenir; ancak ad, paketle birlikte gelen veya resmî bir Plugin kimliğiyle eşleşiyorsa OpenClaw bunun yerine ilgili yerel/resmî kopyayı kullanır. Belirlenimci kaynak seçimi için `clawhub:`, `npm:`, `git:` veya `npm-pack:` kullanın — bkz. [Plugin'leri yönetme](/tr/plugins/manage-plugins).

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

**Depo içi Plugin'ler:** paketle birlikte gelen Plugin çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik olarak keşfedilirler.

<Info>
npm kaynaklı yüklemelerde `openclaw plugins install`, paketi yaşam döngüsü betikleri devre dışı bırakılmış (`--ignore-scripts`) şekilde `~/.openclaw/npm/projects` altında Plugin başına bir projeye yükler. Plugin bağımlılık ağaçlarını yalnızca JS/TS içerecek şekilde tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

<Note>
Gateway başlatılırken Plugin bağımlılıkları yüklenmez. Bağımlılıkların uyumlu hâle getirilmesinden npm/git/ClawHub yükleme akışları sorumludur; yerel Plugin'lerin bağımlılıkları önceden yüklenmiş olmalıdır.
</Note>

Paketle birlikte gelen paket meta verileri açıktır; Gateway başlatılırken derlenmiş JavaScript'ten çıkarılmaz. Çalışma zamanı bağımlılıkları, bunların sahibi olan Plugin paketinde bulunmalıdır; paketlenmiş OpenClaw başlatma işlemi Plugin bağımlılıklarını hiçbir zaman onarmaz veya yansıtmaz.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — adım adım başlangıç kılavuzu
- [Plugin bildirimi](/tr/plugins/manifest) — tam bildirim şeması başvurusu
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry`
