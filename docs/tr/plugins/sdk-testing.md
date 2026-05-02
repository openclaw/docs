---
read_when:
    - Bir Plugin için testler yazıyorsunuz
    - Plugin SDK'daki test yardımcı araçlarına ihtiyacınız var
    - Birlikte gelen Plugin'ler için sözleşme testlerini anlamak istiyorsunuz
sidebarTitle: Testing
summary: OpenClaw Plugin'leri için test yardımcıları ve kalıpları
title: Plugin testi
x-i18n:
    generated_at: "2026-05-02T22:21:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin'leri için test yardımcıları, kalıplar ve lint zorlaması referansı.

<Tip>
  **Test örnekleri mi arıyorsunuz?** Nasıl yapılır kılavuzları çalışılmış test örnekleri içerir:
  [Kanal Plugin testleri](/tr/plugins/sdk-channel-plugins#step-6-test) ve
  [Sağlayıcı Plugin testleri](/tr/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test yardımcıları

**Plugin API sahte içe aktarımı:** `openclaw/plugin-sdk/plugin-test-api`

**Aracı çalışma zamanı sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Kanal sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/channel-contract-testing`

**Kanal test yardımcısı içe aktarımı:** `openclaw/plugin-sdk/channel-test-helpers`

**Kanal hedef testi içe aktarımı:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin çalışma zamanı testi içe aktarımı:** `openclaw/plugin-sdk/plugin-test-runtime`

**Sağlayıcı sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/provider-test-contracts`

**Sağlayıcı HTTP sahte içe aktarımı:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Ortam/ağ testi içe aktarımı:** `openclaw/plugin-sdk/test-env`

**Genel fixture içe aktarımı:** `openclaw/plugin-sdk/test-fixtures`

**Node yerleşik sahte içe aktarımı:** `openclaw/plugin-sdk/test-node-mocks`

Yeni Plugin testleri için aşağıdaki odaklanmış alt yolları tercih edin. Geniş
`openclaw/plugin-sdk/testing` barrel'i yalnızca eski uyumluluk içindir.
Repo koruma kuralları, `plugin-sdk/testing` ve
`plugin-sdk/test-utils` üzerinden yeni gerçek içe aktarımları reddeder; bu adlar yalnızca harici Plugin'ler ve uyumluluk kaydı testleri için kullanımdan kaldırılmış uyumluluk yüzeyleri olarak kalır.

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
| `createTestPluginApi`                                | Doğrudan kayıt birim testleri için minimal bir Plugin API sahtesi oluşturur. `plugin-sdk/plugin-test-api` içinden içe aktarın                         |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan kimlik doğrulama profili sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan teslimat bastırma sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan geri dönüş sınıflandırma sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `createParameterFreeTool`                            | Yerel çalışma zamanı sözleşme testleri için dinamik araç şeması fikstürleri oluşturur. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `expectChannelInboundContextContract`                | Kanal gelen bağlam biçimini doğrular. `plugin-sdk/channel-contract-testing` içinden içe aktarın                                                       |
| `installChannelOutboundPayloadContractSuite`         | Kanal giden yük sözleşme senaryolarını kurar. `plugin-sdk/channel-contract-testing` içinden içe aktarın                                               |
| `createStartAccountContext`                          | Kanal hesabı yaşam döngüsü bağlamları oluşturur. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                                |
| `installChannelActionsContractSuite`                 | Genel kanal mesaj eylemi sözleşme senaryolarını kurar. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                          |
| `installChannelSetupContractSuite`                   | Genel kanal kurulum sözleşme senaryolarını kurar. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                               |
| `installChannelStatusContractSuite`                  | Genel kanal durum sözleşme senaryolarını kurar. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                                 |
| `expectDirectoryIds`                                 | Bir dizin listeleme işlevinden kanal dizin kimliklerini doğrular. `plugin-sdk/channel-test-helpers` içinden içe aktarın                               |
| `assertBundledChannelEntries`                        | Paketlenmiş kanal giriş noktalarının beklenen genel sözleşmeyi sunduğunu doğrular. `plugin-sdk/channel-test-helpers` içinden içe aktarın              |
| `formatEnvelopeTimestamp`                            | Deterministik zarf zaman damgalarını biçimlendirir. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                             |
| `expectPairingReplyText`                             | Kanal eşleştirme yanıt metnini doğrular ve kodunu çıkarır. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                      |
| `describePluginRegistrationContract`                 | Plugin kayıt sözleşmesi denetimlerini kurar. `plugin-sdk/plugin-test-contracts` içinden içe aktarın                                                   |
| `registerSingleProviderPlugin`                       | Yükleyici duman testlerinde tek bir sağlayıcı Plugin kaydeder. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                   |
| `registerProviderPlugin`                             | Tek bir Plugin içinden tüm sağlayıcı türlerini yakalar. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                          |
| `registerProviderPlugins`                            | Birden çok Plugin genelinde sağlayıcı kayıtlarını yakalar. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                       |
| `requireRegisteredProvider`                          | Bir sağlayıcı koleksiyonunun bir kimlik içerdiğini doğrular. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                     |
| `createRuntimeEnv`                                   | Sahte bir CLI/Plugin çalışma zamanı ortamı oluşturur. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                            |
| `createPluginSetupWizardStatus`                      | Kanal Plugin'leri için kurulum durumu yardımcıları oluşturur. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                    |
| `describeOpenAIProviderRuntimeContract`              | Sağlayıcı ailesi çalışma zamanı sözleşmesi denetimlerini kurar. `plugin-sdk/provider-test-contracts` içinden içe aktarın                              |
| `expectPassthroughReplayPolicy`                      | Sağlayıcı yeniden yürütme ilkelerinin sağlayıcıya ait araçları ve meta verileri olduğu gibi geçirdiğini doğrular. `plugin-sdk/provider-test-contracts` içinden içe aktarın |
| `runRealtimeSttLiveTest`                             | Paylaşılan ses fikstürleriyle canlı gerçek zamanlı STT sağlayıcı testi çalıştırır. `plugin-sdk/provider-test-contracts` içinden içe aktarın           |
| `normalizeTranscriptForMatch`                        | Belirsiz doğrulamalardan önce canlı transkript çıktısını normalleştirir. `plugin-sdk/provider-test-contracts` içinden içe aktarın                     |
| `expectExplicitVideoGenerationCapabilities`          | Video sağlayıcılarının açık üretim modu yetenekleri bildirdiğini doğrular. `plugin-sdk/provider-test-contracts` içinden içe aktarın                   |
| `expectExplicitMusicGenerationCapabilities`          | Müzik sağlayıcılarının açık üretim/düzenleme yetenekleri bildirdiğini doğrular. `plugin-sdk/provider-test-contracts` içinden içe aktarın              |
| `mockSuccessfulDashscopeVideoTask`                   | Başarılı bir DashScope uyumlu video görevi yanıtı kurar. `plugin-sdk/provider-test-contracts` içinden içe aktarın                                     |
| `getProviderHttpMocks`                               | İsteğe bağlı sağlayıcı HTTP/kimlik doğrulama Vitest sahtelerine erişir. `plugin-sdk/provider-http-test-mocks` içinden içe aktarın                     |
| `installProviderHttpMockCleanup`                     | Her testten sonra sağlayıcı HTTP/kimlik doğrulama sahtelerini sıfırlar. `plugin-sdk/provider-http-test-mocks` içinden içe aktarın                     |
| `installCommonResolveTargetErrorCases`               | Hedef çözümleme hata işleme için paylaşılan test senaryoları. `plugin-sdk/channel-target-testing` içinden içe aktarın                                 |
| `shouldAckReaction`                                  | Bir kanalın onay tepkisi ekleyip eklememesi gerektiğini denetler. `plugin-sdk/channel-feedback` içinden içe aktarın                                  |
| `removeAckReactionAfterReply`                        | Yanıt tesliminden sonra onay tepkisini kaldırır. `plugin-sdk/channel-feedback` içinden içe aktarın                                                    |
| `createTestRegistry`                                 | Kanal Plugin kayıt defteri fikstürü oluşturur. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` içinden içe aktarın            |
| `createEmptyPluginRegistry`                          | Boş bir Plugin kayıt defteri fikstürü oluşturur. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` içinden içe aktarın          |
| `setActivePluginRegistry`                            | Plugin çalışma zamanı testleri için bir kayıt defteri fikstürü kurar. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` içinden içe aktarın |
| `createRequestCaptureJsonFetch`                      | Medya yardımcı testlerinde JSON fetch isteklerini yakalar. `plugin-sdk/test-env` içinden içe aktarın                                                   |
| `withServer`                                         | Atılabilir bir yerel HTTP sunucusuna karşı testleri çalıştırır. `plugin-sdk/test-env` içinden içe aktarın                                             |
| `createMockIncomingRequest`                          | Minimal bir gelen HTTP isteği nesnesi oluşturur. `plugin-sdk/test-env` içinden içe aktarın                                                            |
| `withFetchPreconnect`                                | Ön bağlantı kancaları kurulu olarak fetch testlerini çalıştırır. `plugin-sdk/test-env` içinden içe aktarın                                           |
| `withEnv` / `withEnvAsync`                           | Ortam değişkenlerini geçici olarak yamalar. `plugin-sdk/test-env` içinden içe aktarın                                                                 |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Yalıtılmış dosya sistemi test fikstürleri oluşturur. `plugin-sdk/test-env` içinden içe aktarın                                                        |
| `createMockServerResponse`                           | Minimal bir HTTP sunucusu yanıt sahtesi oluşturur. `plugin-sdk/test-env` içinden içe aktarın                                                          |
| `createCliRuntimeCapture`                            | Testlerde CLI çalışma zamanı çıktısını yakalar. `plugin-sdk/test-fixtures` içinden içe aktarın                                                        |
| `importFreshModule`                                  | Modül önbelleğini atlamak için yeni bir sorgu belirteciyle bir ESM modülünü içe aktarır. `plugin-sdk/test-fixtures` içinden içe aktarın               |
| `bundledPluginRoot` / `bundledPluginFile`            | Paketlenmiş Plugin kaynak veya dist fikstür yollarını çözer. `plugin-sdk/test-fixtures` içinden içe aktarın                                          |
| `mockNodeBuiltinModule`                              | Dar kapsamlı Node yerleşik Vitest sahteleri kurar. `plugin-sdk/test-node-mocks` içinden içe aktarın                                                   |
| `createSandboxTestContext`                           | Korumalı alan test bağlamları oluşturur. `plugin-sdk/test-fixtures` içinden içe aktarın                                                               |
| `writeSkill`                                         | Skill fikstürleri yazar. `plugin-sdk/test-fixtures` içinden içe aktarın                                                                               |
| `makeAgentAssistantMessage`                          | Ajan transkript mesaj fikstürleri oluşturur. `plugin-sdk/test-fixtures` içinden içe aktarın                                                           |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sistem olayı fikstürlerini inceler ve sıfırlar. `plugin-sdk/test-fixtures` içinden içe aktarın                                                        |
| `sanitizeTerminalText`                               | Doğrulamalar için terminal çıktısını temizler. `plugin-sdk/test-fixtures` içinden içe aktarın                                                         |
| `countLines` / `hasBalancedFences`                   | Parçalama çıktı biçimini doğrular. `plugin-sdk/test-fixtures` içinden içe aktarın                                                                     |
| `runProviderCatalog`                                 | Test bağımlılıklarıyla bir sağlayıcı katalog kancası yürütür                                                                                          |
| `resolveProviderWizardOptions`                       | Sözleşme testlerinde sağlayıcı kurulum sihirbazı seçeneklerini çözer                                                                                  |
| `resolveProviderModelPickerEntries`                  | Sözleşme testlerinde sağlayıcı model seçici girdilerini çözer                                                                                         |
| `buildProviderPluginMethodChoice`                    | Doğrulamalar için sağlayıcı sihirbazı seçim kimlikleri oluşturur                                                                                      |
| `setProviderWizardProvidersResolverForTest`          | Yalıtılmış testler için sağlayıcı sihirbazı sağlayıcılarını enjekte eder                                                                              |
| `createProviderUsageFetch`                           | Sağlayıcı kullanım getirme fixture'larını oluştur                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Zamana duyarlı testler için zamanlayıcıları dondurup geri yükleyin. `plugin-sdk/test-env` içinden içe aktarın                                                    |
| `createTestWizardPrompter`                           | Taklit edilmiş bir kurulum sihirbazı istem oluşturucusu oluştur                                                                                                     |
| `createRuntimeTaskFlow`                              | Yalıtılmış çalışma zamanı görev akışı durumunu oluştur                                                                                                  |
| `typedCases`                                         | Tablo odaklı testler için literal türleri koruyun. `plugin-sdk/test-fixtures` içinden içe aktarın                                                    |

Paketle gelen plugin sözleşme takımları, yalnızca test amaçlı kayıt defteri, bildirim, public-artifact ve runtime fixture yardımcıları için SDK test alt yollarını da kullanır. Paketle gelen OpenClaw envanterine bağlı yalnızca core takımları `src/plugins/contracts` altında kalır. Yeni extension testlerini doğrudan geniş `plugin-sdk/testing` uyumluluk barrel’ını, repo `src/**` dosyalarını veya repo `test/helpers/*` köprülerini içe aktarmak yerine `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` veya `plugin-sdk/test-fixtures` gibi belgelenmiş, odaklı bir SDK alt yolunda tutun.

### Türler

Odaklı test alt yolları, test dosyalarında kullanışlı olan türleri de yeniden dışa aktarır:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Test hedefi çözümleme

Channel hedef çözümlemesi için standart hata durumları eklemek üzere `installCommonResolveTargetErrorCases` kullanın:

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

`register(api)` işlevine elle yazılmış bir `api` mock’u geçiren birim testleri, OpenClaw’un loader kabul kapılarını çalıştırmaz. Plugininizin bağlı olduğu her kayıt yüzeyi için, özellikle hook’lar ve memory gibi özel yetenekler için en az bir loader destekli smoke testi ekleyin.

Gerçek loader, gerekli metadata eksik olduğunda veya bir plugin sahip olmadığı bir yetenek API’sini çağırdığında plugin kaydını başarısız kılar. Örneğin, `api.registerHook(...)` bir hook adı gerektirir ve `api.registerMemoryCapability(...)` plugin bildiriminin veya dışa aktarılan girişin `kind: "memory"` bildirmesini gerektirir.

### Runtime yapılandırma erişimini test etme

Paketle gelen channel pluginlerini test ederken `openclaw/plugin-sdk/channel-test-helpers` içindeki paylaşılan plugin runtime mock’unu tercih edin. Kullanımdan kaldırılmış `runtime.config.loadConfig()` ve `runtime.config.writeConfigFile(...)` mock’ları varsayılan olarak hata fırlatır; böylece testler uyumluluk API’lerinin yeni kullanımlarını yakalar. Bu mock’ları yalnızca test açıkça eski uyumluluk davranışını kapsıyorsa override edin.

### Bir channel pluginini birim test etme

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

### Bir provider pluginini birim test etme

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

### Plugin runtime’ını mock’lama

`createPluginRuntimeStore` kullanan kod için testlerde runtime’ı mock’layın:

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

### Her instance için ayrı stub’larla test etme

Prototype mutasyonu yerine her instance için ayrı stub’ları tercih edin:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Sözleşme testleri (repo içi pluginler)

Paketle gelen pluginlerin kayıt sahipliğini doğrulayan sözleşme testleri vardır:

```bash
pnpm test -- src/plugins/contracts/
```

Bu testler şunları doğrular:

- Hangi pluginlerin hangi provider’ları kaydettiği
- Hangi pluginlerin hangi speech provider’larını kaydettiği
- Kayıt şekli doğruluğu
- Runtime sözleşmesi uyumluluğu

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

## Lint zorlaması (repo içi pluginler)

Repo içi pluginler için `pnpm check` tarafından üç kural zorlanır:

1. **Monolitik root içe aktarması yok** -- `openclaw/plugin-sdk` root barrel’ı reddedilir
2. **Doğrudan `src/` içe aktarması yok** -- pluginler doğrudan `../../src/` içe aktaramaz
3. **Kendi kendini içe aktarma yok** -- pluginler kendi `plugin-sdk/<name>` alt yollarını içe aktaramaz

Harici pluginler bu lint kurallarına tabi değildir, ancak aynı kalıpları izlemek önerilir.

## Test yapılandırması

OpenClaw, V8 coverage eşikleriyle Vitest kullanır. Plugin testleri için:

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

- [SDK’ye Genel Bakış](/tr/plugins/sdk-overview) -- içe aktarma kuralları
- [SDK Channel Pluginleri](/tr/plugins/sdk-channel-plugins) -- channel plugin arayüzü
- [SDK Provider Pluginleri](/tr/plugins/sdk-provider-plugins) -- provider plugin hook’ları
- [Plugin Oluşturma](/tr/plugins/building-plugins) -- başlangıç kılavuzu
