---
read_when:
    - Bir Plugin için test yazıyorsunuz
    - Plugin SDK'sındaki test yardımcılarına ihtiyacınız var
    - Paketle gelen Plugin'lere yönelik sözleşme testlerini anlamak istiyorsunuz
sidebarTitle: Testing
summary: OpenClaw Plugin'leri için test yardımcı araçları ve kalıpları
title: Plugin testi
x-i18n:
    generated_at: "2026-06-28T07:42:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin'leri için test yardımcıları, kalıplar ve lint uygulaması başvurusu.

<Tip>
  **Test örnekleri mi arıyorsunuz?** Nasıl yapılır kılavuzları çalışılmış test örnekleri içerir:
  [Kanal Plugin testleri](/tr/plugins/sdk-channel-plugins#step-6-test) ve
  [Sağlayıcı Plugin testleri](/tr/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test yardımcıları

Bu test yardımcısı alt yolları, OpenClaw'ın kendi birlikte gelen Plugin testleri
için depo yerelindeki kaynak giriş noktalarıdır. Üçüncü taraf Plugin'ler için
paket dışa aktarımları değildir ve Vitest veya yalnızca depoya özgü diğer test
bağımlılıklarını içe aktarabilirler.

**Plugin API sahte içe aktarması:** `openclaw/plugin-sdk/plugin-test-api`

**Ajan çalışma zamanı sözleşmesi içe aktarması:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Kanal sözleşmesi içe aktarması:** `openclaw/plugin-sdk/channel-contract-testing`

**Kanal test yardımcısı içe aktarması:** `openclaw/plugin-sdk/channel-test-helpers`

**Kanal hedefi testi içe aktarması:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin sözleşmesi içe aktarması:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin çalışma zamanı testi içe aktarması:** `openclaw/plugin-sdk/plugin-test-runtime`

**Sağlayıcı sözleşmesi içe aktarması:** `openclaw/plugin-sdk/provider-test-contracts`

**Sağlayıcı HTTP sahte içe aktarması:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Ortam/ağ testi içe aktarması:** `openclaw/plugin-sdk/test-env`

**Genel fikstür içe aktarması:** `openclaw/plugin-sdk/test-fixtures`

**Node yerleşik sahte içe aktarması:** `openclaw/plugin-sdk/test-node-mocks`

OpenClaw deposu içinde, yeni birlikte gelen Plugin testleri için aşağıdaki
odaklı alt yolları tercih edin. Geniş
`openclaw/plugin-sdk/testing` barrel dışa aktarımı yalnızca eski uyumluluk içindir.
Depo koruma kuralları, `plugin-sdk/testing` ve
`plugin-sdk/test-utils` üzerinden yeni gerçek içe aktarmaları reddeder; bu adlar
yalnızca uyumluluk kaydı testleri için kullanımdan kaldırılmış uyumluluk
yüzeyleri olarak kalır.

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

### Kullanılabilir dışa aktarımlar

| Dışa Aktarım                                         | Amaç                                                                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Doğrudan kayıt birim testleri için minimal bir Plugin API mock'u oluşturun. `plugin-sdk/plugin-test-api` konumundan içe aktarın                      |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan kimlik doğrulama profili sözleşme fixture'ı. `plugin-sdk/agent-runtime-test-contracts` konumundan içe aktarın |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan teslim bastırma sözleşme fixture'ı. `plugin-sdk/agent-runtime-test-contracts` konumundan içe aktarın |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan fallback sınıflandırma sözleşme fixture'ı. `plugin-sdk/agent-runtime-test-contracts` konumundan içe aktarın |
| `createParameterFreeTool`                            | Yerel çalışma zamanı sözleşme testleri için dinamik araç şema fixture'ları oluşturun. `plugin-sdk/agent-runtime-test-contracts` konumundan içe aktarın |
| `expectChannelInboundContextContract`                | Kanal gelen bağlam şeklini doğrulayın. `plugin-sdk/channel-contract-testing` konumundan içe aktarın                                                  |
| `installChannelOutboundPayloadContractSuite`         | Kanal giden payload sözleşme durumlarını yükleyin. `plugin-sdk/channel-contract-testing` konumundan içe aktarın                                      |
| `createStartAccountContext`                          | Kanal hesabı yaşam döngüsü bağlamları oluşturun. `plugin-sdk/channel-test-helpers` konumundan içe aktarın                                            |
| `installChannelActionsContractSuite`                 | Genel kanal mesaj eylemi sözleşme durumlarını yükleyin. `plugin-sdk/channel-test-helpers` konumundan içe aktarın                                    |
| `installChannelSetupContractSuite`                   | Genel kanal kurulum sözleşme durumlarını yükleyin. `plugin-sdk/channel-test-helpers` konumundan içe aktarın                                         |
| `installChannelStatusContractSuite`                  | Genel kanal durum sözleşme durumlarını yükleyin. `plugin-sdk/channel-test-helpers` konumundan içe aktarın                                           |
| `expectDirectoryIds`                                 | Bir dizin listeleme işlevinden gelen kanal dizin kimliklerini doğrulayın. `plugin-sdk/channel-test-helpers` konumundan içe aktarın                   |
| `assertBundledChannelEntries`                        | Paketli kanal giriş noktalarının beklenen genel sözleşmeyi sunduğunu doğrulayın. `plugin-sdk/channel-test-helpers` konumundan içe aktarın            |
| `formatEnvelopeTimestamp`                            | Deterministik zarf zaman damgalarını biçimlendirin. `plugin-sdk/channel-test-helpers` konumundan içe aktarın                                        |
| `expectPairingReplyText`                             | Kanal eşleştirme yanıt metnini doğrulayın ve kodunu çıkarın. `plugin-sdk/channel-test-helpers` konumundan içe aktarın                               |
| `describePluginRegistrationContract`                 | Plugin kayıt sözleşmesi denetimlerini yükleyin. `plugin-sdk/plugin-test-contracts` konumundan içe aktarın                                           |
| `registerSingleProviderPlugin`                       | Yükleyici smoke testlerinde tek bir sağlayıcı Plugin'i kaydedin. `plugin-sdk/plugin-test-runtime` konumundan içe aktarın                            |
| `registerProviderPlugin`                             | Tek bir Plugin'den tüm sağlayıcı türlerini yakalayın. `plugin-sdk/plugin-test-runtime` konumundan içe aktarın                                       |
| `registerProviderPlugins`                            | Birden çok Plugin genelinde sağlayıcı kayıtlarını yakalayın. `plugin-sdk/plugin-test-runtime` konumundan içe aktarın                                |
| `requireRegisteredProvider`                          | Bir sağlayıcı koleksiyonunun bir kimlik içerdiğini doğrulayın. `plugin-sdk/plugin-test-runtime` konumundan içe aktarın                              |
| `createRuntimeEnv`                                   | Mock'lanmış bir CLI/Plugin çalışma zamanı ortamı oluşturun. `plugin-sdk/plugin-test-runtime` konumundan içe aktarın                                 |
| `createPluginRuntimeMock`                            | Mock'lanmış bir Plugin çalışma zamanı yüzeyi oluşturun. `plugin-sdk/plugin-test-runtime` konumundan içe aktarın                                     |
| `createPluginSetupWizardStatus`                      | Kanal Plugin'leri için kurulum durumu yardımcıları oluşturun. `plugin-sdk/plugin-test-runtime` konumundan içe aktarın                               |
| `describeOpenAIProviderRuntimeContract`              | Sağlayıcı ailesi çalışma zamanı sözleşme denetimlerini yükleyin. `plugin-sdk/provider-test-contracts` konumundan içe aktarın                        |
| `expectPassthroughReplayPolicy`                      | Sağlayıcı tekrar yürütme ilkelerinin sağlayıcıya ait araçları ve meta verileri aynen geçirdiğini doğrulayın. `plugin-sdk/provider-test-contracts` konumundan içe aktarın |
| `runRealtimeSttLiveTest`                             | Paylaşılan ses fixture'larıyla canlı bir gerçek zamanlı STT sağlayıcı testi çalıştırın. `plugin-sdk/provider-test-contracts` konumundan içe aktarın  |
| `normalizeTranscriptForMatch`                        | Yaklaşık eşleştirme doğrulamalarından önce canlı transkript çıktısını normalleştirin. `plugin-sdk/provider-test-contracts` konumundan içe aktarın    |
| `expectExplicitVideoGenerationCapabilities`          | Video sağlayıcılarının açık üretim modu yetenekleri bildirdiğini doğrulayın. `plugin-sdk/provider-test-contracts` konumundan içe aktarın             |
| `expectExplicitMusicGenerationCapabilities`          | Müzik sağlayıcılarının açık üretim/düzenleme yetenekleri bildirdiğini doğrulayın. `plugin-sdk/provider-test-contracts` konumundan içe aktarın        |
| `mockSuccessfulDashscopeVideoTask`                   | Başarılı bir DashScope uyumlu video görevi yanıtı yükleyin. `plugin-sdk/provider-test-contracts` konumundan içe aktarın                             |
| `getProviderHttpMocks`                               | Opt-in sağlayıcı HTTP/kimlik doğrulama Vitest mock'larına erişin. `plugin-sdk/provider-http-test-mocks` konumundan içe aktarın                      |
| `installProviderHttpMockCleanup`                     | Her testten sonra sağlayıcı HTTP/kimlik doğrulama mock'larını sıfırlayın. `plugin-sdk/provider-http-test-mocks` konumundan içe aktarın              |
| `installCommonResolveTargetErrorCases`               | Hedef çözümleme hata işleme için paylaşılan test durumları. `plugin-sdk/channel-target-testing` konumundan içe aktarın                              |
| `shouldAckReaction`                                  | Bir kanalın onay tepkisi ekleyip eklemeyeceğini denetleyin. `plugin-sdk/channel-feedback` konumundan içe aktarın                                   |
| `removeAckReactionAfterReply`                        | Yanıt tesliminden sonra onay tepkisini kaldırın. `plugin-sdk/channel-feedback` konumundan içe aktarın                                               |
| `createTestRegistry`                                 | Bir kanal Plugin kayıt defteri fixture'ı oluşturun. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` konumundan içe aktarın   |
| `createEmptyPluginRegistry`                          | Boş bir Plugin kayıt defteri fixture'ı oluşturun. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` konumundan içe aktarın     |
| `setActivePluginRegistry`                            | Plugin çalışma zamanı testleri için bir kayıt defteri fixture'ı yükleyin. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` konumundan içe aktarın |
| `createRequestCaptureJsonFetch`                      | Medya yardımcı testlerinde JSON fetch isteklerini yakalayın. `plugin-sdk/test-env` konumundan içe aktarın                                           |
| `withServer`                                         | Testleri tek kullanımlık yerel HTTP sunucusuna karşı çalıştırın. `plugin-sdk/test-env` konumundan içe aktarın                                       |
| `createMockIncomingRequest`                          | Minimal bir gelen HTTP isteği nesnesi oluşturun. `plugin-sdk/test-env` konumundan içe aktarın                                                       |
| `withFetchPreconnect`                                | Fetch testlerini ön bağlantı kancaları yüklü şekilde çalıştırın. `plugin-sdk/test-env` konumundan içe aktarın                                      |
| `withEnv` / `withEnvAsync`                           | Ortam değişkenlerini geçici olarak yamalayın. `plugin-sdk/test-env` konumundan içe aktarın                                                          |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Yalıtılmış dosya sistemi test fixture'ları oluşturun. `plugin-sdk/test-env` konumundan içe aktarın                                                  |
| `createMockServerResponse`                           | Minimal bir HTTP sunucusu yanıt mock'u oluşturun. `plugin-sdk/test-env` konumundan içe aktarın                                                      |
| `createCliRuntimeCapture`                            | Testlerde CLI çalışma zamanı çıktısını yakalayın. `plugin-sdk/test-fixtures` konumundan içe aktarın                                                 |
| `importFreshModule`                                  | Modül önbelleğini atlamak için yeni bir sorgu belirteciyle bir ESM modülünü içe aktarın. `plugin-sdk/test-fixtures` konumundan içe aktarın          |
| `bundledPluginRoot` / `bundledPluginFile`            | Paketli Plugin kaynak veya dağıtım fixture yollarını çözümleyin. `plugin-sdk/test-fixtures` konumundan içe aktarın                                  |
| `mockNodeBuiltinModule`                              | Dar kapsamlı Node yerleşik Vitest mock'larını yükleyin. `plugin-sdk/test-node-mocks` konumundan içe aktarın                                         |
| `createSandboxTestContext`                           | Sandbox test bağlamları oluşturun. `plugin-sdk/test-fixtures` konumundan içe aktarın                                                                 |
| `writeSkill`                                         | Skill fixture'ları yazın. `plugin-sdk/test-fixtures` konumundan içe aktarın                                                                          |
| `makeAgentAssistantMessage`                          | Ajan transkript mesajı fixture'ları oluşturun. `plugin-sdk/test-fixtures` konumundan içe aktarın                                                    |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sistem olayı fixture'larını inceleyin ve sıfırlayın. `plugin-sdk/test-fixtures` konumundan içe aktarın                                              |
| `sanitizeTerminalText`                               | Doğrulamalar için terminal çıktısını temizleyin. `plugin-sdk/test-fixtures` konumundan içe aktarın                                                   |
| `countLines` / `hasBalancedFences`                   | Parçalama çıktısının şeklini doğrulayın. `plugin-sdk/test-fixtures` konumundan içe aktarın                                                          |
| `runProviderCatalog`                                 | Test bağımlılıklarıyla bir sağlayıcı katalog kancasını çalıştırın                                                                                    |
| `resolveProviderWizardOptions`                       | Sözleşme testlerinde sağlayıcı kurulum sihirbazı seçeneklerini çözümleyin                                                                            |
| `resolveProviderModelPickerEntries`                  | Sözleşme testlerinde sağlayıcı model seçici girişlerini çözümleyin                                                                                   |
| `buildProviderPluginMethodChoice`                    | Doğrulamalar için sağlayıcı sihirbazı seçim kimlikleri oluşturun                                                                                     |
| `setProviderWizardProvidersResolverForTest`          | Yalıtılmış testler için sağlayıcı sihirbazı sağlayıcılarını enjekte et                                                                   |
| `createProviderUsageFetch`                           | Sağlayıcı kullanım getirme fixture'larını oluştur                                                                                        |
| `useFrozenTime` / `useRealTime`                      | Zamana duyarlı testler için zamanlayıcıları dondur ve geri yükle. `plugin-sdk/test-env` içinden içe aktar                                |
| `createTestWizardPrompter`                           | Mock'lanmış bir kurulum sihirbazı prompter'ı oluştur                                                                                     |
| `createRuntimeTaskFlow`                              | Yalıtılmış çalışma zamanı görev akışı durumunu oluştur                                                                                   |
| `typedCases`                                         | Tablo güdümlü testler için literal türleri koru. `plugin-sdk/test-fixtures` içinden içe aktar                                            |

Birlikte gelen plugin sözleşme paketleri, yalnızca test amaçlı kayıt defteri,
manifest, herkese açık yapıt ve çalışma zamanı fixture yardımcıları için SDK test
alt yollarını da kullanır. Birlikte gelen OpenClaw envanterine bağlı yalnızca
çekirdek paketler `src/plugins/contracts` altında kalır. Yeni uzantı testlerini,
geniş `plugin-sdk/testing` uyumluluk barrel'ını, repo `src/**` dosyalarını veya
repo `test/helpers/*` köprülerini doğrudan içe aktarmak yerine
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` ya da `plugin-sdk/test-fixtures` gibi belgelenmiş, odaklı
bir SDK alt yolunda tutun.

### Türler

Odaklı test alt yolları, test dosyalarında yararlı olan türleri de yeniden dışa aktarır:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Test hedefi çözümleme

Kanal hedefi çözümleme için standart hata durumları eklemek üzere
`installCommonResolveTargetErrorCases` kullanın:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Test kalıpları

### Kayıt sözleşmelerini test etme

`register(api)` işlevine elle yazılmış bir `api` mock'u geçiren birim testleri,
OpenClaw'ın yükleyici kabul kapılarını çalıştırmaz. Plugin'inizin bağlı olduğu
her kayıt yüzeyi için, özellikle hook'lar ve bellek gibi özel yetenekler için en
az bir yükleyici destekli smoke testi ekleyin.

Gerçek yükleyici, gerekli meta veriler eksik olduğunda veya bir plugin sahip
olmadığı bir yetenek API'sini çağırdığında plugin kaydını başarısız yapar.
Örneğin, `api.registerHook(...)` bir hook adı gerektirir ve
`api.registerMemoryCapability(...)`, plugin manifestinin veya dışa aktarılan
girdinin `kind: "memory"` bildirmesini gerektirir.

### Çalışma zamanı yapılandırma erişimini test etme

`openclaw/plugin-sdk/plugin-test-runtime` içindeki paylaşılan plugin çalışma
zamanı mock'unu tercih edin. Kullanımdan kaldırılmış
`runtime.config.loadConfig()` ve `runtime.config.writeConfigFile(...)` mock'ları
varsayılan olarak hata fırlatır; böylece testler uyumluluk API'lerinin yeni
kullanımlarını yakalar. Bu mock'ları yalnızca test açıkça eski uyumluluk
davranışını kapsıyorsa geçersiz kılın.

### Bir kanal plugin'ini birim test etme

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
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

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Bir sağlayıcı plugin'ini birim test etme

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin çalışma zamanını mock'lama

`createPluginRuntimeStore` kullanan kod için, testlerde çalışma zamanını mock'layın:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### Örnek başına stub'larla test etme

Prototip mutasyonu yerine örnek başına stub'ları tercih edin:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Sözleşme testleri (repo içi plugin'ler)

Birlikte gelen plugin'lerin kayıt sahipliğini doğrulayan sözleşme testleri vardır:

```bash
pnpm test -- src/plugins/contracts/
```

Bu testler şunları doğrular:

- Hangi plugin'lerin hangi sağlayıcıları kaydettiği
- Hangi plugin'lerin hangi konuşma sağlayıcılarını kaydettiği
- Kayıt şeklinin doğruluğu
- Çalışma zamanı sözleşmesine uyumluluk

### Kapsamlı testleri çalıştırma

Belirli bir plugin için:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Yalnızca sözleşme testleri için:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint zorlaması (repo içi plugin'ler)

Repo içi plugin'ler için `pnpm check` tarafından üç kural zorlanır:

1. **Monolitik kök içe aktarmalar yok** -- `openclaw/plugin-sdk` kök barrel'ı reddedilir
2. **Doğrudan `src/` içe aktarmaları yok** -- plugin'ler `../../src/` yolunu doğrudan içe aktaramaz
3. **Kendi kendini içe aktarma yok** -- plugin'ler kendi `plugin-sdk/<name>` alt yolunu içe aktaramaz

Harici plugin'ler bu lint kurallarına tabi değildir, ancak aynı kalıpları izlemek
önerilir.

## Test yapılandırması

OpenClaw, V8 kapsam eşikleriyle Vitest kullanır. Plugin testleri için:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Yerel çalıştırmalar bellek baskısına neden oluyorsa:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## İlgili

- [SDK Genel Bakış](/tr/plugins/sdk-overview) -- içe aktarma kuralları
- [SDK Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) -- kanal plugin arayüzü
- [SDK Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) -- sağlayıcı plugin hook'ları
- [Plugin Oluşturma](/tr/plugins/building-plugins) -- başlangıç kılavuzu
