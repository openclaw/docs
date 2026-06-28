---
read_when:
    - Bir plugin için testler yazıyorsunuz
    - Plugin SDK'sından test yardımcı araçlarına ihtiyacınız var
    - Paketlenmiş Plugin'ler için sözleşme testlerini anlamak istiyorsunuz
sidebarTitle: Testing
summary: OpenClaw Plugin'leri için test yardımcıları ve kalıpları
title: Plugin testi
x-i18n:
    generated_at: "2026-06-28T01:07:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin'leri için test yardımcıları, kalıpları ve lint zorlamasına yönelik başvuru.

<Tip>
  **Test örnekleri mi arıyorsunuz?** Nasıl yapılır kılavuzları çalışılmış test örnekleri içerir:
  [Kanal Plugin testleri](/tr/plugins/sdk-channel-plugins#step-6-test) ve
  [Sağlayıcı Plugin testleri](/tr/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test yardımcıları

Bu test yardımcı alt yolları, OpenClaw'ın kendi birlikte gelen Plugin testleri için
depo yerelindeki kaynak giriş noktalarıdır. Üçüncü taraf Plugin'ler için paket
dışa aktarımları değildir ve Vitest ya da yalnızca depoya özgü başka test
bağımlılıklarını içe aktarabilirler.

**Plugin API mock içe aktarımı:** `openclaw/plugin-sdk/plugin-test-api`

**Ajan çalışma zamanı sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Kanal sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/channel-contract-testing`

**Kanal test yardımcısı içe aktarımı:** `openclaw/plugin-sdk/channel-test-helpers`

**Kanal hedef test içe aktarımı:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin çalışma zamanı testi içe aktarımı:** `openclaw/plugin-sdk/plugin-test-runtime`

**Sağlayıcı sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/provider-test-contracts`

**Sağlayıcı HTTP mock içe aktarımı:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Ortam/ağ testi içe aktarımı:** `openclaw/plugin-sdk/test-env`

**Genel fixture içe aktarımı:** `openclaw/plugin-sdk/test-fixtures`

**Node yerleşik mock içe aktarımı:** `openclaw/plugin-sdk/test-node-mocks`

OpenClaw deposu içinde, yeni birlikte gelen Plugin testleri için aşağıdaki
odaklanmış alt yolları tercih edin. Geniş
`openclaw/plugin-sdk/testing` barrel modülü yalnızca eski uyumluluk içindir.
Depo korumaları, `plugin-sdk/testing` ve `plugin-sdk/test-utils` üzerinden yeni
gerçek içe aktarımları reddeder; bu adlar yalnızca uyumluluk kaydı testleri için
kullanımdan kaldırılmış uyumluluk yüzeyleri olarak kalır.

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

| Dışa Aktarım                                         | Amaç                                                                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Doğrudan kayıt birim testleri için minimal bir Plugin API mock'u oluşturun. `plugin-sdk/plugin-test-api` içinden içe aktarın                         |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan kimlik doğrulama profili sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan teslimat bastırma sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan yedek sınıflandırma sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `createParameterFreeTool`                            | Yerel çalışma zamanı sözleşme testleri için dinamik araç şeması fikstürleri oluşturun. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `expectChannelInboundContextContract`                | Kanal gelen bağlam biçimini doğrulayın. `plugin-sdk/channel-contract-testing` içinden içe aktarın                                                   |
| `installChannelOutboundPayloadContractSuite`         | Kanal giden yük sözleşmesi vakalarını kurun. `plugin-sdk/channel-contract-testing` içinden içe aktarın                                               |
| `createStartAccountContext`                          | Kanal hesap yaşam döngüsü bağlamları oluşturun. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                               |
| `installChannelActionsContractSuite`                 | Genel kanal mesaj-eylem sözleşmesi vakalarını kurun. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                          |
| `installChannelSetupContractSuite`                   | Genel kanal kurulum sözleşmesi vakalarını kurun. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                              |
| `installChannelStatusContractSuite`                  | Genel kanal durum sözleşmesi vakalarını kurun. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                                |
| `expectDirectoryIds`                                 | Bir dizin-listeleme işlevinden gelen kanal dizin kimliklerini doğrulayın. `plugin-sdk/channel-test-helpers` içinden içe aktarın                     |
| `assertBundledChannelEntries`                        | Paketli kanal giriş noktalarının beklenen herkese açık sözleşmeyi sunduğunu doğrulayın. `plugin-sdk/channel-test-helpers` içinden içe aktarın       |
| `formatEnvelopeTimestamp`                            | Deterministik zarf zaman damgalarını biçimlendirin. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                           |
| `expectPairingReplyText`                             | Kanal eşleştirme yanıt metnini doğrulayın ve kodunu çıkarın. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                  |
| `describePluginRegistrationContract`                 | Plugin kayıt sözleşmesi denetimlerini kurun. `plugin-sdk/plugin-test-contracts` içinden içe aktarın                                                 |
| `registerSingleProviderPlugin`                       | Yükleyici smoke testlerinde tek bir sağlayıcı Plugin'i kaydedin. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                               |
| `registerProviderPlugin`                             | Bir Plugin'den tüm sağlayıcı türlerini yakalayın. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                               |
| `registerProviderPlugins`                            | Birden fazla Plugin genelinde sağlayıcı kayıtlarını yakalayın. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                 |
| `requireRegisteredProvider`                          | Bir sağlayıcı koleksiyonunun bir kimlik içerdiğini doğrulayın. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                 |
| `createRuntimeEnv`                                   | Mock'lanmış bir CLI/Plugin çalışma zamanı ortamı oluşturun. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                    |
| `createPluginSetupWizardStatus`                      | Kanal Plugin'leri için kurulum durumu yardımcıları oluşturun. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                  |
| `describeOpenAIProviderRuntimeContract`              | Sağlayıcı-ailesi çalışma zamanı sözleşmesi denetimlerini kurun. `plugin-sdk/provider-test-contracts` içinden içe aktarın                            |
| `expectPassthroughReplayPolicy`                      | Sağlayıcı yeniden oynatma ilkelerinin sağlayıcıya ait araçları ve meta verileri olduğu gibi geçirdiğini doğrulayın. `plugin-sdk/provider-test-contracts` içinden içe aktarın |
| `runRealtimeSttLiveTest`                             | Paylaşılan ses fikstürleriyle canlı gerçek zamanlı STT sağlayıcı testi çalıştırın. `plugin-sdk/provider-test-contracts` içinden içe aktarın          |
| `normalizeTranscriptForMatch`                        | Bulanık doğrulamalardan önce canlı transkript çıktısını normalleştirin. `plugin-sdk/provider-test-contracts` içinden içe aktarın                     |
| `expectExplicitVideoGenerationCapabilities`          | Video sağlayıcılarının açık üretim modu yetenekleri bildirdiğini doğrulayın. `plugin-sdk/provider-test-contracts` içinden içe aktarın                |
| `expectExplicitMusicGenerationCapabilities`          | Müzik sağlayıcılarının açık üretim/düzenleme yetenekleri bildirdiğini doğrulayın. `plugin-sdk/provider-test-contracts` içinden içe aktarın           |
| `mockSuccessfulDashscopeVideoTask`                   | Başarılı bir DashScope uyumlu video görev yanıtı kurun. `plugin-sdk/provider-test-contracts` içinden içe aktarın                                    |
| `getProviderHttpMocks`                               | İsteğe bağlı sağlayıcı HTTP/kimlik doğrulama Vitest mock'larına erişin. `plugin-sdk/provider-http-test-mocks` içinden içe aktarın                    |
| `installProviderHttpMockCleanup`                     | Her testten sonra sağlayıcı HTTP/kimlik doğrulama mock'larını sıfırlayın. `plugin-sdk/provider-http-test-mocks` içinden içe aktarın                  |
| `installCommonResolveTargetErrorCases`               | Hedef çözümleme hata işleme için paylaşılan test vakaları. `plugin-sdk/channel-target-testing` içinden içe aktarın                                  |
| `shouldAckReaction`                                  | Bir kanalın onay tepkisi ekleyip eklememesi gerektiğini denetleyin. `plugin-sdk/channel-feedback` içinden içe aktarın                               |
| `removeAckReactionAfterReply`                        | Yanıt tesliminden sonra onay tepkisini kaldırın. `plugin-sdk/channel-feedback` içinden içe aktarın                                                  |
| `createTestRegistry`                                 | Bir kanal Plugin kayıt defteri fikstürü oluşturun. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` içinden içe aktarın       |
| `createEmptyPluginRegistry`                          | Boş bir Plugin kayıt defteri fikstürü oluşturun. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` içinden içe aktarın         |
| `setActivePluginRegistry`                            | Plugin çalışma zamanı testleri için bir kayıt defteri fikstürü kurun. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` içinden içe aktarın |
| `createRequestCaptureJsonFetch`                      | Medya yardımcısı testlerinde JSON fetch isteklerini yakalayın. `plugin-sdk/test-env` içinden içe aktarın                                            |
| `withServer`                                         | Testleri tek kullanımlık yerel bir HTTP sunucusuna karşı çalıştırın. `plugin-sdk/test-env` içinden içe aktarın                                      |
| `createMockIncomingRequest`                          | Minimal bir gelen HTTP isteği nesnesi oluşturun. `plugin-sdk/test-env` içinden içe aktarın                                                          |
| `withFetchPreconnect`                                | Fetch testlerini preconnect hook'ları kurulu olarak çalıştırın. `plugin-sdk/test-env` içinden içe aktarın                                           |
| `withEnv` / `withEnvAsync`                           | Ortam değişkenlerini geçici olarak yamalayın. `plugin-sdk/test-env` içinden içe aktarın                                                             |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Yalıtılmış dosya sistemi test fikstürleri oluşturun. `plugin-sdk/test-env` içinden içe aktarın                                                      |
| `createMockServerResponse`                           | Minimal bir HTTP sunucusu yanıt mock'u oluşturun. `plugin-sdk/test-env` içinden içe aktarın                                                         |
| `createCliRuntimeCapture`                            | Testlerde CLI çalışma zamanı çıktısını yakalayın. `plugin-sdk/test-fixtures` içinden içe aktarın                                                    |
| `importFreshModule`                                  | Modül önbelleğini atlamak için yeni bir sorgu belirteciyle bir ESM modülünü içe aktarın. `plugin-sdk/test-fixtures` içinden içe aktarın             |
| `bundledPluginRoot` / `bundledPluginFile`            | Paketli Plugin kaynak veya dist fikstür yollarını çözümleyin. `plugin-sdk/test-fixtures` içinden içe aktarın                                        |
| `mockNodeBuiltinModule`                              | Dar kapsamlı Node yerleşik Vitest mock'larını kurun. `plugin-sdk/test-node-mocks` içinden içe aktarın                                               |
| `createSandboxTestContext`                           | Sandbox test bağlamları oluşturun. `plugin-sdk/test-fixtures` içinden içe aktarın                                                                    |
| `writeSkill`                                         | Skills fikstürleri yazın. `plugin-sdk/test-fixtures` içinden içe aktarın                                                                             |
| `makeAgentAssistantMessage`                          | Ajan transkript mesajı fikstürleri oluşturun. `plugin-sdk/test-fixtures` içinden içe aktarın                                                        |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sistem olayı fikstürlerini inceleyin ve sıfırlayın. `plugin-sdk/test-fixtures` içinden içe aktarın                                                  |
| `sanitizeTerminalText`                               | Doğrulamalar için terminal çıktısını temizleyin. `plugin-sdk/test-fixtures` içinden içe aktarın                                                     |
| `countLines` / `hasBalancedFences`                   | Parçalama çıktı biçimini doğrulayın. `plugin-sdk/test-fixtures` içinden içe aktarın                                                                  |
| `runProviderCatalog`                                 | Test bağımlılıklarıyla bir sağlayıcı katalog hook'u yürütün                                                                                          |
| `resolveProviderWizardOptions`                       | Sözleşme testlerinde sağlayıcı kurulum sihirbazı seçeneklerini çözümleyin                                                                            |
| `resolveProviderModelPickerEntries`                  | Sözleşme testlerinde sağlayıcı model-seçici girişlerini çözümleyin                                                                                   |
| `buildProviderPluginMethodChoice`                    | Doğrulamalar için sağlayıcı sihirbazı seçim kimlikleri oluşturun                                                                                     |
| `setProviderWizardProvidersResolverForTest`          | Yalıtılmış testler için sağlayıcı sihirbazı sağlayıcılarını enjekte edin                                                                             |
| `createProviderUsageFetch`                           | Sağlayıcı kullanım getirme fixture'ları oluşturun                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Zamana duyarlı testler için zamanlayıcıları dondurun ve geri yükleyin. `plugin-sdk/test-env` içinden içe aktarın                                                    |
| `createTestWizardPrompter`                           | Mock'lanmış bir kurulum sihirbazı prompter'ı oluşturun                                                                                                     |
| `createRuntimeTaskFlow`                              | Yalıtılmış çalışma zamanı task-flow durumunu oluşturun                                                                                                  |
| `typedCases`                                         | Tablo güdümlü testler için literal türleri koruyun. `plugin-sdk/test-fixtures` içinden içe aktarın                                                    |

Birlikte gelen Plugin sözleşme paketleri, yalnızca test amaçlı kayıt defteri,
manifest, herkese açık yapıt ve çalışma zamanı fikstür yardımcıları için SDK
test alt yollarını da kullanır. Birlikte gelen OpenClaw envanterine bağımlı
yalnızca çekirdek paketler `src/plugins/contracts` altında kalır. Yeni eklenti
testlerini, geniş `plugin-sdk/testing` uyumluluk barrel'ını, repo `src/**`
dosyalarını veya repo `test/helpers/*` köprülerini doğrudan içe aktarmak yerine
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` veya `plugin-sdk/test-fixtures` gibi belgelenmiş, odaklı
bir SDK alt yolunda tutun.

### Türler

Odaklı test alt yolları, test dosyalarında yararlı türleri de yeniden dışa aktarır:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Test hedefi çözümleme

Kanal hedefi çözümlemesi için standart hata durumları eklemek üzere
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

`register(api)` öğesine elle yazılmış bir `api` mock'u geçiren birim testleri,
OpenClaw'un yükleyici kabul kapılarını çalıştırmaz. Plugin'inizin bağımlı olduğu
her kayıt yüzeyi için, özellikle hook'lar ve bellek gibi özel yetenekler için,
en az bir yükleyici destekli smoke test ekleyin.

Gerçek yükleyici, gerekli metadata eksik olduğunda veya bir Plugin sahip olmadığı
bir yetenek API'sini çağırdığında Plugin kaydını başarısız kılar. Örneğin,
`api.registerHook(...)` bir hook adı gerektirir ve
`api.registerMemoryCapability(...)` Plugin manifest'inin veya dışa aktarılan
girdinin `kind: "memory"` beyan etmesini gerektirir.

### Çalışma zamanı yapılandırma erişimini test etme

Birlikte gelen kanal Plugin'lerini test ederken
`openclaw/plugin-sdk/channel-test-helpers` içindeki paylaşılan Plugin çalışma
zamanı mock'unu tercih edin. Kullanımdan kaldırılmış
`runtime.config.loadConfig()` ve `runtime.config.writeConfigFile(...)` mock'ları
varsayılan olarak hata fırlatır; böylece testler uyumluluk API'lerinin yeni
kullanımlarını yakalar. Bu mock'ları yalnızca test açıkça eski uyumluluk
davranışını kapsadığında geçersiz kılın.

### Bir kanal Plugin'ini birim test etme

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

### Bir sağlayıcı Plugin'ini birim test etme

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

## Sözleşme testleri (repo içi Plugin'ler)

Birlikte gelen Plugin'lerde kayıt sahipliğini doğrulayan sözleşme testleri vardır:

```bash
pnpm test -- src/plugins/contracts/
```

Bu testler şunları doğrular:

- Hangi Plugin'lerin hangi sağlayıcıları kaydettiği
- Hangi Plugin'lerin hangi konuşma sağlayıcılarını kaydettiği
- Kayıt şeklinin doğruluğu
- Çalışma zamanı sözleşmesine uyumluluk

### Kapsamı daraltılmış testleri çalıştırma

Belirli bir Plugin için:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Yalnızca sözleşme testleri için:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint uygulaması (repo içi Plugin'ler)

Repo içi Plugin'ler için `pnpm check` tarafından üç kural uygulanır:

1. **Monolitik kök içe aktarma yok** -- `openclaw/plugin-sdk` kök barrel'ı reddedilir
2. **Doğrudan `src/` içe aktarması yok** -- Plugin'ler doğrudan `../../src/` içe aktaramaz
3. **Kendini içe aktarma yok** -- Plugin'ler kendi `plugin-sdk/<name>` alt yolunu içe aktaramaz

Harici Plugin'ler bu lint kurallarına tabi değildir, ancak aynı kalıpları izlemek
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

Yerel çalıştırmalar bellek baskısına neden olursa:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## İlgili

- [SDK'ya Genel Bakış](/tr/plugins/sdk-overview) -- içe aktarma kuralları
- [SDK Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) -- kanal Plugin arayüzü
- [SDK Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) -- sağlayıcı Plugin hook'ları
- [Plugin Oluşturma](/tr/plugins/building-plugins) -- başlangıç kılavuzu
