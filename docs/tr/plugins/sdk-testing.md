---
read_when:
    - Bir plugin için testler yazıyorsunuz
    - Plugin SDK'sından test yardımcı programlarına ihtiyacınız var
    - Paketle birlikte sunulan pluginlere yönelik sözleşme testlerini anlamak istiyorsunuz
sidebarTitle: Testing
summary: OpenClaw pluginleri için test yardımcı programları ve kalıpları
title: Plugin testi
x-i18n:
    generated_at: "2026-07-16T17:33:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Pluginleri için test yardımcı programları, kalıpları ve lint zorlamasına ilişkin başvuru.

<Tip>
  **Test örnekleri mi arıyorsunuz?** Nasıl yapılır kılavuzları, ayrıntılı test örnekleri içerir:
  [Kanal Plugin testleri](/tr/plugins/sdk-channel-plugins#step-6-test) ve
  [Sağlayıcı Plugin testleri](/tr/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test yardımcı programları

Bu alt yollar, OpenClaw'ın kendi paketlenmiş Plugin testleri için depo içi kaynak
giriş noktalarıdır. Üçüncü taraf Pluginler için yayımlanmış `package.json`
dışa aktarımları değildir ve Vitest'i veya yalnızca depoda bulunan diğer test bağımlılıklarını içe aktarabilirler.

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

Paketlenmiş Plugin testleri için bu odaklanmış alt yolları kullanın. Önceki
`openclaw/plugin-sdk/testing` barrel'i depo içiydi, dağıtılan
paketlerin dışında tutuluyordu ve kaldırıldı. Eski `openclaw/plugin-sdk/test-utils`
takma adı depo içinde kalır; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) bu takma adın yeni uzantı testi
içe aktarımlarını reddeder.

### Kullanılabilir dışa aktarımlar

| Dışa Aktarım                                               | Amaç                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Doğrudan kayıt birim testleri için asgari bir Plugin API taklidi oluşturur. `plugin-sdk/plugin-test-api` üzerinden içe aktarın                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan kimlik doğrulama profili sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` üzerinden içe aktarın            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan teslimat engelleme sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` üzerinden içe aktarın    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan geri dönüş sınıflandırma sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` üzerinden içe aktarın |
| `createParameterFreeTool`                            | Yerel çalışma zamanı sözleşme testleri için dinamik araç şeması fikstürleri oluşturur. `plugin-sdk/agent-runtime-test-contracts` üzerinden içe aktarın              |
| `expectChannelInboundContextContract`                | Kanal gelen bağlamının biçimini doğrular. `plugin-sdk/channel-contract-testing` üzerinden içe aktarın                                                  |
| `installChannelOutboundPayloadContractSuite`         | Kanal giden yükü sözleşme senaryolarını kurar. `plugin-sdk/channel-contract-testing` üzerinden içe aktarın                                       |
| `createStartAccountContext`                          | Kanal hesabı yaşam döngüsü bağlamlarını oluşturur. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                                  |
| `installChannelActionsContractSuite`                 | Genel kanal mesaj eylemi sözleşme senaryolarını kurar. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                     |
| `installChannelSetupContractSuite`                   | Genel kanal kurulum sözleşmesi senaryolarını kurar. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                              |
| `installChannelStatusContractSuite`                  | Genel kanal durumu sözleşmesi senaryolarını kurar. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                             |
| `expectDirectoryIds`                                 | Bir dizin listeleme işlevinden kanal dizini kimliklerini doğrular. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                               |
| `assertBundledChannelEntries`                        | Paketlenmiş kanal giriş noktalarının beklenen genel sözleşmeyi sunduğunu doğrular. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                    |
| `formatEnvelopeTimestamp`                            | Belirlenimci zarf zaman damgalarını biçimlendirir. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                                  |
| `expectPairingReplyText`                             | Kanal eşleştirme yanıt metnini doğrular ve kodunu ayıklar. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                    |
| `describePluginRegistrationContract`                 | Plugin kayıt sözleşmesi denetimlerini kurar. `plugin-sdk/plugin-test-contracts` üzerinden içe aktarın                                              |
| `registerSingleProviderPlugin`                       | Yükleyici duman testlerinde tek bir sağlayıcı Plugin'i kaydeder. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                         |
| `registerProviderPlugin`                             | Tek bir Plugin'deki tüm sağlayıcı türlerini yakalar. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                                 |
| `registerProviderPlugins`                            | Birden çok Plugin'deki sağlayıcı kayıtlarını yakalar. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                     |
| `requireRegisteredProvider`                          | Bir sağlayıcı koleksiyonunun bir kimlik içerdiğini doğrular. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                           |
| `createRuntimeEnv`                                   | Taklit edilmiş bir CLI/Plugin çalışma zamanı ortamı oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                              |
| `createPluginRuntimeMock`                            | Taklit edilmiş bir Plugin çalışma zamanı yüzeyi oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                                      |
| `createPluginSetupWizardStatus`                      | Kanal Plugin'leri için kurulum durumu yardımcılarını oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                             |
| `createTestWizardPrompter`                           | Taklit edilmiş bir kurulum sihirbazı istemcisini oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                                       |
| `createRuntimeTaskFlow`                              | Yalıtılmış çalışma zamanı görev akışı durumunu oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                                    |
| `runProviderCatalog`                                 | Sağlayıcı kataloğu kancasını test bağımlılıklarıyla yürütür. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                     |
| `resolveProviderWizardOptions`                       | Sözleşme testlerinde sağlayıcı kurulum sihirbazı seçimlerini çözümler. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                    |
| `resolveProviderModelPickerEntries`                  | Sözleşme testlerinde sağlayıcı model seçici girdilerini çözümler. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                    |
| `buildProviderPluginMethodChoice`                    | Doğrulamalar için sağlayıcı sihirbazı seçim kimliklerini oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                            |
| `setProviderWizardProvidersResolverForTest`          | Yalıtılmış testler için sağlayıcı sihirbazına sağlayıcıları enjekte eder. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                        |
| `describeOpenAIProviderRuntimeContract`              | Sağlayıcı ailesi çalışma zamanı sözleşme denetimlerini kurar. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                                        |
| `expectPassthroughReplayPolicy`                      | Sağlayıcı yeniden oynatma politikalarının sağlayıcıya ait araçları ve meta verileri aynen aktardığını doğrular. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın         |
| `runRealtimeSttLiveTest`                             | Paylaşılan ses fikstürleriyle canlı ve gerçek zamanlı bir STT sağlayıcı testi çalıştırır. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                       |
| `normalizeTranscriptForMatch`                        | Belirsiz doğrulamalardan önce canlı döküm çıktısını normalleştirir. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                               |
| `expectExplicitVideoGenerationCapabilities`          | Video sağlayıcılarının açık üretim modu yetenekleri bildirdiğini doğrular. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                   |
| `expectExplicitMusicGenerationCapabilities`          | Müzik sağlayıcılarının açık üretim/düzenleme yetenekleri bildirdiğini doğrular. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                   |
| `mockSuccessfulDashscopeVideoTask`                   | Başarılı bir DashScope uyumlu video görevi yanıtı kurar. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                          |
| `getProviderHttpMocks`                               | İsteğe bağlı sağlayıcı HTTP/kimlik doğrulama Vitest taklitlerine erişir. `plugin-sdk/provider-http-test-mocks` üzerinden içe aktarın                                         |
| `installProviderHttpMockCleanup`                     | Her testten sonra sağlayıcı HTTP/kimlik doğrulama taklitlerini sıfırlar. `plugin-sdk/provider-http-test-mocks` üzerinden içe aktarın                                        |
| `installCommonResolveTargetErrorCases`               | Hedef çözümleme hata işleme için paylaşılan test senaryoları. `plugin-sdk/channel-target-testing` üzerinden içe aktarın                                  |
| `shouldAckReaction`                                  | Bir kanalın alındı onayı tepkisi ekleyip eklememesi gerektiğini denetler. `plugin-sdk/channel-feedback` üzerinden içe aktarın                                            |
| `removeAckReactionAfterReply`                        | Yanıt tesliminden sonra alındı onayı tepkisini kaldırır. `plugin-sdk/channel-feedback` üzerinden içe aktarın                                                      |
| `createTestRegistry`                                 | Bir kanal Plugin kayıt defteri fikstürü oluşturur. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` üzerinden içe aktarın               |
| `createEmptyPluginRegistry`                          | Boş bir Plugin kayıt defteri fikstürü oluşturur. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                |
| `setActivePluginRegistry`                            | Plugin çalışma zamanı testleri için bir kayıt defteri fikstürü kurar. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` üzerinden içe aktarın   |
| `createRequestCaptureJsonFetch`                      | Medya yardımcısı testlerinde JSON getirme isteklerini yakalar. `plugin-sdk/test-env` üzerinden içe aktarın                                                     |
| `withServer`                                         | Testleri tek kullanımlık yerel bir HTTP sunucusuna karşı çalıştırır. `plugin-sdk/test-env` üzerinden içe aktarın                                                      |
| `createMockIncomingRequest`                          | Asgari bir gelen HTTP isteği nesnesi oluşturur. `plugin-sdk/test-env` üzerinden içe aktarın                                                          |
| `withFetchPreconnect`                                | Ön bağlantı kancaları kurulmuş şekilde getirme testlerini çalıştırır. `plugin-sdk/test-env` üzerinden içe aktarın                                                       |
| `withEnv` / `withEnvAsync`                           | Ortam değişkenlerine geçici olarak yama uygular. `plugin-sdk/test-env` üzerinden içe aktarın                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Yalıtılmış dosya sistemi test fikstürleri oluşturur. `plugin-sdk/test-env` üzerinden içe aktarın                                                              |
| `createMockServerResponse`                           | Asgari bir HTTP sunucusu yanıt taklidi oluşturur. `plugin-sdk/test-env` üzerinden içe aktarın                                                            |
| `createProviderUsageFetch`                           | Sağlayıcı kullanım verisi getirme fikstürleri oluşturur. `plugin-sdk/test-env` üzerinden içe aktarın                                                                   |
| `useFrozenTime` / `useRealTime`                      | Zamana duyarlı testler için zamanlayıcıları dondurur ve geri yükler. `plugin-sdk/test-env` üzerinden içe aktarın                                                    |
| `createCliRuntimeCapture`                            | Testlerde CLI çalışma zamanı çıktısını yakalar. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                              |
| `importFreshModule`                                  | Modül önbelleğini atlamak için yeni bir sorgu belirteciyle bir ESM modülünü içe aktarır. `plugin-sdk/test-fixtures` üzerinden içe aktarın                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Paketlenmiş Plugin kaynak veya dağıtım fikstürü yollarını çözümler. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                              |
| `mockNodeBuiltinModule`                              | Dar kapsamlı yerleşik Node Vitest taklitlerini kurar. `plugin-sdk/test-node-mocks` üzerinden içe aktarın                                                       |
| `createSandboxTestContext`                           | Korumalı alan test bağlamlarını oluşturur. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                                      |
| `writeSkill`                                         | Skill fikstürlerini yazar. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                                             |
| `makeAgentAssistantMessage`                          | Ajan dökümü mesaj fikstürleri oluşturur. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sistem olayı fikstürlerini inceler ve sıfırlar. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                          |
| `sanitizeTerminalText`                               | Doğrulamalar için terminal çıktısını arındırır. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                          |
| `countLines` / `hasBalancedFences`                   | Parçalama çıktısının biçimini doğrular. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                                     |
| `typedCases`                                         | Tablo güdümlü testler için değişmez türleri korur. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                    |

Paketlenmiş Plugin sözleşme paketleri ayrıca yalnızca test amaçlı kayıt defteri,
manifest, genel yapıt ve çalışma zamanı fikstürü yardımcıları için bu SDK test alt yollarını kullanır.
Paketlenmiş OpenClaw envanterine bağımlı olan yalnızca çekirdeğe yönelik paketler ise
`src/plugins/contracts` altında kalır.

### Türler

Odaklanmış test alt yolları, test dosyalarında yararlı olan türleri de yeniden dışa aktarır:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Test hedefi çözümleme

Kanal hedefi çözümlemesine standart hata durumları eklemek için
`installCommonResolveTargetErrorCases` kullanın:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel hedef çözümlemesi", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Kanalınızın hedef çözümleme mantığı
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Kanala özgü test durumları ekleyin
  it("@username hedeflerini çözümlemelidir", () => {
    // ...
  });
});
```

## Test kalıpları

### Kayıt sözleşmelerini test etme

Elle yazılmış bir `api` sahtesini `register(api)` öğesine ileten birim testleri,
OpenClaw'ın yükleyici kabul geçitlerini çalıştırmaz. Plugin'inizin bağımlı olduğu her kayıt yüzeyi,
özellikle kancalar ve bellek gibi münhasır yetenekler için yükleyici destekli en az bir
duman testi ekleyin.

Gerekli meta veriler eksik olduğunda veya bir Plugin sahip olmadığı bir yetenek API'sini
çağırdığında gerçek yükleyici Plugin kaydını başarısız kılar. Örneğin,
`api.registerHook(...)` bir kanca adı gerektirir ve
`api.registerMemoryCapability(...)`, Plugin manifestinin veya dışa aktarılan
girişin `kind: "memory"` bildirmesini gerektirir.

### Çalışma zamanı yapılandırmasına erişimi test etme

`openclaw/plugin-sdk/plugin-test-runtime` içindeki paylaşılan Plugin çalışma zamanı sahtesini tercih edin.
Bunun `runtime.config.loadConfig()` ve `runtime.config.writeConfigFile(...)`
sahteleri varsayılan olarak hata fırlatır; böylece testler, kullanımdan kaldırılmış uyumluluk
API'lerinin yeni kullanımlarını yakalar. Bu sahteleri yalnızca test açıkça eski
uyumluluk davranışını kapsıyorsa geçersiz kılın.

### Bir kanal Plugin'ini birim testine tabi tutma

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel Plugin'i", () => {
  it("hesabı yapılandırmadan çözümlemelidir", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("gizli değerleri somutlaştırmadan hesabı incelemelidir", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Token değeri açığa çıkarılmaz
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Bir sağlayıcı Plugin'ini birim testine tabi tutma

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider Plugin'i", () => {
  it("dinamik modelleri çözümlemelidir", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... bağlam
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("API anahtarı mevcut olduğunda kataloğu döndürmelidir", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... bağlam
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin çalışma zamanının sahtesini oluşturma

`createPluginRuntimeStore` kullanan kod için testlerde çalışma zamanının sahtesini oluşturun:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test çalışma zamanı ayarlanmadı",
});

// Test kurulumunda
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... diğer sahteler
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... diğer ad alanları
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Testlerden sonra
store.clearRuntime();
```

### Örnek başına taklitlerle test etme

Prototip değişikliği yerine örnek başına taklitleri tercih edin:

```typescript
// Tercih edilen: örnek başına taklit
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Kaçının: prototip değişikliği
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Sözleşme testleri (depo içi Plugin'ler)

Paketlenmiş Plugin'ler, kayıt sahipliğini doğrulayan sözleşme testlerine sahiptir:

```bash
pnpm test src/plugins/contracts/
```

Bu testler şunları doğrular:

- Hangi Plugin'lerin hangi sağlayıcıları kaydettiği
- Hangi Plugin'lerin hangi konuşma sağlayıcılarını kaydettiği
- Kayıt biçiminin doğruluğu
- Çalışma zamanı sözleşmesine uygunluk

### Kapsamlı testleri çalıştırma

Belirli bir Plugin için:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Yalnızca sözleşme testleri için:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint uygulaması (depo içi Plugin'ler)

`scripts/run-additional-boundary-checks.mjs`, CI'da bir dizi `lint:plugins:*`
içe aktarma sınırı denetimi çalıştırır; bunların her biri yerel olarak bağımsız da çalıştırılabilir:

| Komut                                                        | Uyguladığı kural                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Paketlenmiş Plugin'ler, tek parça `openclaw/plugin-sdk` kök barrel'ını içe aktaramaz.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Üretim uzantısı dosyaları, deponun `src/**` ağacını doğrudan içe aktaramaz (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Uzantı test dosyaları, `plugin-sdk/test-utils` veya yalnızca çekirdeğe yönelik diğer test yardımcılarını içe aktaramaz. |

Harici Plugin'ler bu lint kurallarına tabi değildir, ancak aynı
kalıpların izlenmesi önerilir.

## Test yapılandırması

OpenClaw, bilgilendirme amaçlı V8 kapsam raporlamasıyla Vitest 4 kullanır. Plugin testleri için:

```bash
# Tüm testleri çalıştır
pnpm test

# Belirli Plugin testlerini çalıştır
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Belirli bir test adı filtresiyle çalıştır
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Kapsamla çalıştır
pnpm test:coverage
```

Yerel çalıştırmalar bellek baskısına yol açarsa:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## İlgili

- [SDK'ya Genel Bakış](/tr/plugins/sdk-overview) -- içe aktarma kuralları
- [SDK Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) -- kanal Plugin'i arayüzü
- [SDK Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) -- sağlayıcı Plugin kancaları
- [Plugin Oluşturma](/tr/plugins/building-plugins) -- başlangıç kılavuzu
