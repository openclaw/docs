---
read_when:
    - Bir Plugin için testler yazıyorsunuz
    - Plugin SDK'sindeki test yardımcı programlarına ihtiyacınız var
    - Birlikte sunulan Plugin'ler için sözleşme testlerini anlamak istiyorsunuz
sidebarTitle: Testing
summary: OpenClaw Plugin'leri için test yardımcıları ve kalıpları
title: Plugin testi
x-i18n:
    generated_at: "2026-05-10T19:50:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
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

Bu test yardımcısı alt yolları, OpenClaw'ın kendi paketlenmiş Plugin testleri için
depoya yerel kaynak giriş noktalarıdır. Üçüncü taraf Plugin'ler için paket dışa aktarımları değildir.

**Plugin API mock içe aktarımı:** `openclaw/plugin-sdk/plugin-test-api`

**Ajan çalışma zamanı sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Kanal sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/channel-contract-testing`

**Kanal test yardımcısı içe aktarımı:** `openclaw/plugin-sdk/channel-test-helpers`

**Kanal hedefi test içe aktarımı:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin çalışma zamanı test içe aktarımı:** `openclaw/plugin-sdk/plugin-test-runtime`

**Sağlayıcı sözleşmesi içe aktarımı:** `openclaw/plugin-sdk/provider-test-contracts`

**Sağlayıcı HTTP mock içe aktarımı:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Ortam/ağ test içe aktarımı:** `openclaw/plugin-sdk/test-env`

**Genel fixture içe aktarımı:** `openclaw/plugin-sdk/test-fixtures`

**Node yerleşik mock içe aktarımı:** `openclaw/plugin-sdk/test-node-mocks`

Yeni Plugin testleri için aşağıdaki odaklı alt yolları tercih edin. Geniş
`openclaw/plugin-sdk/testing` barrel yalnızca eski uyumluluk içindir.
Depo güvenlik kuralları, `plugin-sdk/testing` ve
`plugin-sdk/test-utils` üzerinden yeni gerçek içe aktarımları reddeder; bu adlar yalnızca uyumluluk kaydı testleri için kullanımdan kaldırılmış uyumluluk yüzeyleri olarak kalır.

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

| Dışa aktarım                                        | Amaç                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Doğrudan kayıt birim testleri için en küçük Plugin API mock’u oluşturun. `plugin-sdk/plugin-test-api` içinden içe aktarın               |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Yerel ajan çalışma zamanı adaptörleri için paylaşılan auth-profile sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Yerel ajan çalışma zamanı adaptörleri için paylaşılan teslimat bastırma sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Yerel ajan çalışma zamanı adaptörleri için paylaşılan fallback sınıflandırma sözleşme fikstürü. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `createParameterFreeTool`                            | Yerel çalışma zamanı sözleşme testleri için dinamik araç şema fikstürleri oluşturun. `plugin-sdk/agent-runtime-test-contracts` içinden içe aktarın |
| `expectChannelInboundContextContract`                | Kanal inbound bağlam biçimini doğrulayın. `plugin-sdk/channel-contract-testing` içinden içe aktarın                                      |
| `installChannelOutboundPayloadContractSuite`         | Kanal outbound yük sözleşme vakalarını yükleyin. `plugin-sdk/channel-contract-testing` içinden içe aktarın                               |
| `createStartAccountContext`                          | Kanal hesap yaşam döngüsü bağlamları oluşturun. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                    |
| `installChannelActionsContractSuite`                 | Genel kanal ileti-eylem sözleşme vakalarını yükleyin. `plugin-sdk/channel-test-helpers` içinden içe aktarın                              |
| `installChannelSetupContractSuite`                   | Genel kanal kurulum sözleşme vakalarını yükleyin. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                  |
| `installChannelStatusContractSuite`                  | Genel kanal durum sözleşme vakalarını yükleyin. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                    |
| `expectDirectoryIds`                                 | Bir dizin listeleme işlevinden kanal dizin kimliklerini doğrulayın. `plugin-sdk/channel-test-helpers` içinden içe aktarın                |
| `assertBundledChannelEntries`                        | Paketlenmiş kanal giriş noktalarının beklenen genel sözleşmeyi açığa çıkardığını doğrulayın. `plugin-sdk/channel-test-helpers` içinden içe aktarın |
| `formatEnvelopeTimestamp`                            | Belirlenimci zarf zaman damgalarını biçimlendirin. `plugin-sdk/channel-test-helpers` içinden içe aktarın                                 |
| `expectPairingReplyText`                             | Kanal eşleme yanıt metnini doğrulayın ve kodunu ayıklayın. `plugin-sdk/channel-test-helpers` içinden içe aktarın                         |
| `describePluginRegistrationContract`                 | Plugin kayıt sözleşmesi kontrollerini yükleyin. `plugin-sdk/plugin-test-contracts` içinden içe aktarın                                   |
| `registerSingleProviderPlugin`                       | Yükleyici smoke testlerinde bir sağlayıcı Plugin kaydedin. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                          |
| `registerProviderPlugin`                             | Bir Plugin’den tüm sağlayıcı türlerini yakalayın. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                                   |
| `registerProviderPlugins`                            | Birden çok Plugin genelindeki sağlayıcı kayıtlarını yakalayın. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                      |
| `requireRegisteredProvider`                          | Bir sağlayıcı koleksiyonunun bir kimlik içerdiğini doğrulayın. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                      |
| `createRuntimeEnv`                                   | Mock’lanmış bir CLI/Plugin çalışma zamanı ortamı oluşturun. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                         |
| `createPluginSetupWizardStatus`                      | Kanal Plugin’leri için kurulum durumu yardımcılarını oluşturun. `plugin-sdk/plugin-test-runtime` içinden içe aktarın                     |
| `describeOpenAIProviderRuntimeContract`              | Sağlayıcı ailesi çalışma zamanı sözleşme kontrollerini yükleyin. `plugin-sdk/provider-test-contracts` içinden içe aktarın                |
| `expectPassthroughReplayPolicy`                      | Sağlayıcı replay ilkelerinin sağlayıcının sahip olduğu araçları ve meta verileri aynen geçirdiğini doğrulayın. `plugin-sdk/provider-test-contracts` içinden içe aktarın |
| `runRealtimeSttLiveTest`                             | Paylaşılan ses fikstürleriyle canlı gerçek zamanlı STT sağlayıcı testi çalıştırın. `plugin-sdk/provider-test-contracts` içinden içe aktarın |
| `normalizeTranscriptForMatch`                        | Bulanık doğrulamalardan önce canlı transkript çıktısını normalleştirin. `plugin-sdk/provider-test-contracts` içinden içe aktarın         |
| `expectExplicitVideoGenerationCapabilities`          | Video sağlayıcılarının açık üretim modu yetenekleri bildirdiğini doğrulayın. `plugin-sdk/provider-test-contracts` içinden içe aktarın    |
| `expectExplicitMusicGenerationCapabilities`          | Müzik sağlayıcılarının açık üretim/düzenleme yetenekleri bildirdiğini doğrulayın. `plugin-sdk/provider-test-contracts` içinden içe aktarın |
| `mockSuccessfulDashscopeVideoTask`                   | Başarılı bir DashScope uyumlu video görevi yanıtı yükleyin. `plugin-sdk/provider-test-contracts` içinden içe aktarın                     |
| `getProviderHttpMocks`                               | İsteğe bağlı sağlayıcı HTTP/auth Vitest mock’larına erişin. `plugin-sdk/provider-http-test-mocks` içinden içe aktarın                    |
| `installProviderHttpMockCleanup`                     | Her testten sonra sağlayıcı HTTP/auth mock’larını sıfırlayın. `plugin-sdk/provider-http-test-mocks` içinden içe aktarın                  |
| `installCommonResolveTargetErrorCases`               | Hedef çözümleme hata işleme için paylaşılan test vakaları. `plugin-sdk/channel-target-testing` içinden içe aktarın                       |
| `shouldAckReaction`                                  | Bir kanalın ack tepkisi ekleyip eklememesi gerektiğini denetleyin. `plugin-sdk/channel-feedback` içinden içe aktarın                    |
| `removeAckReactionAfterReply`                        | Yanıt tesliminden sonra ack tepkisini kaldırın. `plugin-sdk/channel-feedback` içinden içe aktarın                                        |
| `createTestRegistry`                                 | Kanal Plugin kayıt defteri fikstürü oluşturun. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` içinden içe aktarın |
| `createEmptyPluginRegistry`                          | Boş bir Plugin kayıt defteri fikstürü oluşturun. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` içinden içe aktarın |
| `setActivePluginRegistry`                            | Plugin çalışma zamanı testleri için bir kayıt defteri fikstürü yükleyin. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` içinden içe aktarın |
| `createRequestCaptureJsonFetch`                      | Medya yardımcı testlerinde JSON fetch isteklerini yakalayın. `plugin-sdk/test-env` içinden içe aktarın                                   |
| `withServer`                                         | Tek kullanımlık yerel HTTP sunucusuna karşı testleri çalıştırın. `plugin-sdk/test-env` içinden içe aktarın                               |
| `createMockIncomingRequest`                          | En küçük gelen HTTP istek nesnesi oluşturun. `plugin-sdk/test-env` içinden içe aktarın                                                    |
| `withFetchPreconnect`                                | Preconnect hook’ları yüklenmiş olarak fetch testlerini çalıştırın. `plugin-sdk/test-env` içinden içe aktarın                            |
| `withEnv` / `withEnvAsync`                           | Ortam değişkenlerini geçici olarak yamalayın. `plugin-sdk/test-env` içinden içe aktarın                                                   |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Yalıtılmış dosya sistemi test fikstürleri oluşturun. `plugin-sdk/test-env` içinden içe aktarın                                           |
| `createMockServerResponse`                           | En küçük HTTP sunucu yanıtı mock’u oluşturun. `plugin-sdk/test-env` içinden içe aktarın                                                   |
| `createCliRuntimeCapture`                            | Testlerde CLI çalışma zamanı çıktısını yakalayın. `plugin-sdk/test-fixtures` içinden içe aktarın                                         |
| `importFreshModule`                                  | Modül önbelleğini atlamak için yeni bir sorgu token’ı ile bir ESM modülünü içe aktarın. `plugin-sdk/test-fixtures` içinden içe aktarın   |
| `bundledPluginRoot` / `bundledPluginFile`            | Paketlenmiş Plugin kaynak veya dist fikstür yollarını çözümleyin. `plugin-sdk/test-fixtures` içinden içe aktarın                         |
| `mockNodeBuiltinModule`                              | Dar kapsamlı Node yerleşik Vitest mock’larını yükleyin. `plugin-sdk/test-node-mocks` içinden içe aktarın                                 |
| `createSandboxTestContext`                           | Sandbox test bağlamları oluşturun. `plugin-sdk/test-fixtures` içinden içe aktarın                                                        |
| `writeSkill`                                         | Skill fikstürleri yazın. `plugin-sdk/test-fixtures` içinden içe aktarın                                                                  |
| `makeAgentAssistantMessage`                          | Ajan transkript ileti fikstürleri oluşturun. `plugin-sdk/test-fixtures` içinden içe aktarın                                              |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sistem olay fikstürlerini inceleyin ve sıfırlayın. `plugin-sdk/test-fixtures` içinden içe aktarın                                        |
| `sanitizeTerminalText`                               | Doğrulamalar için terminal çıktısını temizleyin. `plugin-sdk/test-fixtures` içinden içe aktarın                                          |
| `countLines` / `hasBalancedFences`                   | Parçalama çıktı biçimini doğrulayın. `plugin-sdk/test-fixtures` içinden içe aktarın                                                      |
| `runProviderCatalog`                                 | Test bağımlılıklarıyla bir sağlayıcı katalog hook’u yürütün                                                                               |
| `resolveProviderWizardOptions`                       | Sözleşme testlerinde sağlayıcı kurulum sihirbazı seçimlerini çözümleyin                                                                  |
| `resolveProviderModelPickerEntries`                  | Sözleşme testlerinde sağlayıcı model seçici girdilerini çözümleyin                                                                       |
| `buildProviderPluginMethodChoice`                    | Doğrulamalar için sağlayıcı sihirbazı seçim kimlikleri oluşturun                                                                         |
| `setProviderWizardProvidersResolverForTest`          | Yalıtılmış testler için sağlayıcı sihirbazı sağlayıcılarını enjekte edin                                                                 |
| `createProviderUsageFetch`                           | Sağlayıcı kullanımını getirme için test sabitleri oluştur                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Zamana duyarlı testler için zamanlayıcıları dondur ve geri yükle. `plugin-sdk/test-env` içinden içe aktar                                                    |
| `createTestWizardPrompter`                           | Sahte bir kurulum sihirbazı istem yöneticisi oluştur                                                                                                     |
| `createRuntimeTaskFlow`                              | Yalıtılmış çalışma zamanı görev akışı durumunu oluştur                                                                                                  |
| `typedCases`                                         | Tablo güdümlü testler için değişmez türleri koru. `plugin-sdk/test-fixtures` içinden içe aktar                                                    |

Paketle gelen plugin sözleşme paketleri de yalnızca test amaçlı kayıt defteri, manifest, herkese açık artefakt ve çalışma zamanı fixture yardımcıları için SDK test alt yollarını kullanır. Yalnızca çekirdeğe ait olan ve paketle gelen OpenClaw envanterine bağımlı paketler `src/plugins/contracts` altında kalır. Yeni eklenti testlerini, geniş `plugin-sdk/testing` uyumluluk barrel'ını, repo `src/**` dosyalarını veya repo `test/helpers/*` köprülerini doğrudan içe aktarmak yerine `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` ya da `plugin-sdk/test-fixtures` gibi belgelenmiş, odaklı bir SDK alt yolunda tutun.

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

Kanal hedefi çözümlemesi için standart hata durumlarını eklemek üzere `installCommonResolveTargetErrorCases` kullanın:

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

`register(api)` işlevine elle yazılmış bir `api` mock'u geçiren birim testleri, OpenClaw'ın yükleyici kabul kapılarını çalıştırmaz. Plugin'inizin bağımlı olduğu her kayıt yüzeyi için, özellikle hook'lar ve bellek gibi özel yetenekler için, en az bir yükleyici destekli smoke testi ekleyin.

Gerçek yükleyici, gerekli metadata eksik olduğunda veya bir plugin sahip olmadığı bir yetenek API'sini çağırdığında plugin kaydını başarısız kılar. Örneğin, `api.registerHook(...)` bir hook adı gerektirir ve `api.registerMemoryCapability(...)`, plugin manifestinin veya dışa aktarılan girişin `kind: "memory"` bildirmesini gerektirir.

### Çalışma zamanı yapılandırma erişimini test etme

Paketle gelen kanal plugin'lerini test ederken `openclaw/plugin-sdk/channel-test-helpers` içindeki paylaşılan plugin çalışma zamanı mock'unu tercih edin. Kullanımdan kaldırılmış `runtime.config.loadConfig()` ve `runtime.config.writeConfigFile(...)` mock'ları varsayılan olarak hata fırlatır; böylece testler, uyumluluk API'lerinin yeni kullanımını yakalar. Bu mock'ları yalnızca test açıkça eski uyumluluk davranışını kapsıyorsa geçersiz kılın.

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

`createPluginRuntimeStore` kullanan kod için testlerde çalışma zamanını mock'layın:

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

Paketle gelen plugin'lerde kayıt sahipliğini doğrulayan sözleşme testleri bulunur:

```bash
pnpm test -- src/plugins/contracts/
```

Bu testler şunları doğrular:

- Hangi plugin'lerin hangi sağlayıcıları kaydettiği
- Hangi plugin'lerin hangi konuşma sağlayıcılarını kaydettiği
- Kayıt şeklinin doğruluğu
- Çalışma zamanı sözleşmesine uyum

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
2. **Doğrudan `src/` içe aktarmaları yok** -- plugin'ler `../../src/` öğesini doğrudan içe aktaramaz
3. **Kendini içe aktarma yok** -- plugin'ler kendi `plugin-sdk/<name>` alt yolunu içe aktaramaz

Harici plugin'ler bu lint kurallarına tabi değildir, ancak aynı kalıpları izlemek önerilir.

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

- [SDK Genel Bakış](/tr/plugins/sdk-overview) -- içe aktarma kuralları
- [SDK Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) -- kanal plugin arayüzü
- [SDK Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) -- sağlayıcı plugin hook'ları
- [Plugin Oluşturma](/tr/plugins/building-plugins) -- başlangıç kılavuzu
