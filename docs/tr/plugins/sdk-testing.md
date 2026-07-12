---
read_when:
    - Bir plugin için testler yazıyorsunuz
    - Plugin SDK'sındaki test yardımcı programlarına ihtiyacınız var
    - Paketle birlikte gelen plugin'lere yönelik sözleşme testlerini anlamak istiyorsunuz
sidebarTitle: Testing
summary: OpenClaw pluginleri için test araçları ve kalıpları
title: Plugin testi
x-i18n:
    generated_at: "2026-07-12T12:06:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Pluginleri için test yardımcı araçları, kalıpları ve lint uygulamasına ilişkin başvuru.

<Tip>
  **Test örnekleri mi arıyorsunuz?** Nasıl yapılır kılavuzları, ayrıntılı test örnekleri içerir:
  [Kanal Plugin testleri](/tr/plugins/sdk-channel-plugins#step-6-test) ve
  [Sağlayıcı Plugin testleri](/tr/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test yardımcı araçları

Bu alt yollar, OpenClaw'ın kendi paketle birlikte sunulan Plugin testleri için
depo içi kaynak giriş noktalarıdır. Üçüncü taraf Pluginler için yayımlanmış
`package.json` dışa aktarımları değildir ve Vitest veya yalnızca depoda bulunan
diğer test bağımlılıklarını içe aktarabilirler.

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

Paketle birlikte sunulan yeni Plugin testlerinde bu odaklanmış alt yolları
tercih edin. Geniş kapsamlı `openclaw/plugin-sdk/testing` barrel'i ve
`openclaw/plugin-sdk/test-utils` takma adı yalnızca eski uyumluluk içindir:
`pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`), eklenti test dosyalarında
ikisinden de yapılan yeni içe aktarımları reddeder ve her ikisi de yalnızca
uyumluluk kaydı testleri için korunur.

### Kullanılabilir dışa aktarımlar

| Dışa aktarma                                        | Amaç                                                                                                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Doğrudan kayıt birim testleri için asgari bir plugin API taklidi oluşturur. `plugin-sdk/plugin-test-api` üzerinden içe aktarın                                  |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan kimlik doğrulama profili sözleşmesi fikstürü. `plugin-sdk/agent-runtime-test-contracts` üzerinden içe aktarın |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan teslimat engelleme sözleşmesi fikstürü. `plugin-sdk/agent-runtime-test-contracts` üzerinden içe aktarın |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Yerel ajan çalışma zamanı bağdaştırıcıları için paylaşılan geri dönüş sınıflandırma sözleşmesi fikstürü. `plugin-sdk/agent-runtime-test-contracts` üzerinden içe aktarın |
| `createParameterFreeTool`                            | Yerel çalışma zamanı sözleşmesi testleri için dinamik araç şeması fikstürleri oluşturur. `plugin-sdk/agent-runtime-test-contracts` üzerinden içe aktarın        |
| `expectChannelInboundContextContract`                | Kanalın gelen bağlam biçimini doğrular. `plugin-sdk/channel-contract-testing` üzerinden içe aktarın                                                            |
| `installChannelOutboundPayloadContractSuite`         | Kanalın giden yük sözleşmesi durumlarını kurar. `plugin-sdk/channel-contract-testing` üzerinden içe aktarın                                                    |
| `createStartAccountContext`                          | Kanal hesabı yaşam döngüsü bağlamları oluşturur. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                                       |
| `installChannelActionsContractSuite`                 | Genel kanal mesajı eylemi sözleşmesi durumlarını kurar. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                               |
| `installChannelSetupContractSuite`                   | Genel kanal kurulum sözleşmesi durumlarını kurar. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                                     |
| `installChannelStatusContractSuite`                  | Genel kanal durumu sözleşmesi durumlarını kurar. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                                      |
| `expectDirectoryIds`                                 | Bir dizin listeleme işlevinden gelen kanal dizini kimliklerini doğrular. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                               |
| `assertBundledChannelEntries`                        | Birlikte paketlenmiş kanal giriş noktalarının beklenen genel sözleşmeyi sunduğunu doğrular. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın             |
| `formatEnvelopeTimestamp`                            | Belirlenimci zarf zaman damgalarını biçimlendirir. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                                     |
| `expectPairingReplyText`                             | Kanal eşleştirme yanıtı metnini doğrular ve kodunu çıkarır. `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                                           |
| `describePluginRegistrationContract`                 | Plugin kayıt sözleşmesi denetimlerini kurar. `plugin-sdk/plugin-test-contracts` üzerinden içe aktarın                                                         |
| `registerSingleProviderPlugin`                       | Yükleyici duman testlerinde tek bir sağlayıcı plugin'i kaydeder. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                       |
| `registerProviderPlugin`                             | Tek bir plugin'deki tüm sağlayıcı türlerini yakalar. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                                   |
| `registerProviderPlugins`                            | Birden çok plugin'deki sağlayıcı kayıtlarını yakalar. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                                  |
| `requireRegisteredProvider`                          | Bir sağlayıcı koleksiyonunun belirli bir kimliği içerdiğini doğrular. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                  |
| `createRuntimeEnv`                                   | Taklit edilmiş bir CLI/plugin çalışma zamanı ortamı oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                         |
| `createPluginRuntimeMock`                            | Taklit edilmiş bir plugin çalışma zamanı yüzeyi oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                             |
| `createPluginSetupWizardStatus`                      | Kanal plugin'leri için kurulum durumu yardımcıları oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                          |
| `createTestWizardPrompter`                           | Taklit edilmiş bir kurulum sihirbazı istemcisi oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                              |
| `createRuntimeTaskFlow`                              | Yalıtılmış çalışma zamanı TaskFlow durumunu oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                                 |
| `runProviderCatalog`                                 | Test bağımlılıklarıyla bir sağlayıcı kataloğu kancasını çalıştırır. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                    |
| `resolveProviderWizardOptions`                       | Sözleşme testlerinde sağlayıcı kurulum sihirbazı seçeneklerini çözümler. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                               |
| `resolveProviderModelPickerEntries`                  | Sözleşme testlerinde sağlayıcı model seçici girdilerini çözümler. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                      |
| `buildProviderPluginMethodChoice`                    | Doğrulamalar için sağlayıcı sihirbazı seçenek kimliklerini oluşturur. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                                  |
| `setProviderWizardProvidersResolverForTest`          | Yalıtılmış testler için sağlayıcı sihirbazı sağlayıcılarını enjekte eder. `plugin-sdk/plugin-test-runtime` üzerinden içe aktarın                              |
| `describeOpenAIProviderRuntimeContract`              | Sağlayıcı ailesi çalışma zamanı sözleşmesi denetimlerini kurar. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                                    |
| `expectPassthroughReplayPolicy`                      | Sağlayıcı yeniden oynatma politikalarının, sağlayıcının sahip olduğu araçları ve meta verileri değiştirmeden geçirdiğini doğrular. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın |
| `runRealtimeSttLiveTest`                             | Paylaşılan ses fikstürleriyle canlı, gerçek zamanlı bir STT sağlayıcı testi çalıştırır. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın             |
| `normalizeTranscriptForMatch`                        | Yaklaşık doğrulamalardan önce canlı transkript çıktısını normalleştirir. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                           |
| `expectExplicitVideoGenerationCapabilities`          | Video sağlayıcılarının açık üretim modu yetenekleri bildirdiğini doğrular. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                         |
| `expectExplicitMusicGenerationCapabilities`          | Müzik sağlayıcılarının açık üretim/düzenleme yetenekleri bildirdiğini doğrular. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                    |
| `mockSuccessfulDashscopeVideoTask`                   | Başarılı bir DashScope uyumlu video görevi yanıtı kurar. `plugin-sdk/provider-test-contracts` üzerinden içe aktarın                                           |
| `getProviderHttpMocks`                               | İsteğe bağlı sağlayıcı HTTP/kimlik doğrulama Vitest taklitlerine erişir. `plugin-sdk/provider-http-test-mocks` üzerinden içe aktarın                          |
| `installProviderHttpMockCleanup`                     | Her testten sonra sağlayıcı HTTP/kimlik doğrulama taklitlerini sıfırlar. `plugin-sdk/provider-http-test-mocks` üzerinden içe aktarın                          |
| `installCommonResolveTargetErrorCases`               | Hedef çözümleme hatalarını işlemek için paylaşılan test durumları. `plugin-sdk/channel-target-testing` üzerinden içe aktarın                                  |
| `shouldAckReaction`                                  | Bir kanalın alındı onayı tepkisi ekleyip eklememesi gerektiğini denetler. `plugin-sdk/channel-feedback` üzerinden içe aktarın                                 |
| `removeAckReactionAfterReply`                        | Yanıt teslim edildikten sonra alındı onayı tepkisini kaldırır. `plugin-sdk/channel-feedback` üzerinden içe aktarın                                           |
| `createTestRegistry`                                 | Bir kanal plugin kayıt defteri fikstürü oluşturur. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` üzerinden içe aktarın              |
| `createEmptyPluginRegistry`                          | Boş bir plugin kayıt defteri fikstürü oluşturur. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` üzerinden içe aktarın                |
| `setActivePluginRegistry`                            | Plugin çalışma zamanı testleri için bir kayıt defteri fikstürü kurar. `plugin-sdk/plugin-test-runtime` veya `plugin-sdk/channel-test-helpers` üzerinden içe aktarın |
| `createRequestCaptureJsonFetch`                      | Medya yardımcısı testlerinde JSON getirme isteklerini yakalar. `plugin-sdk/test-env` üzerinden içe aktarın                                                    |
| `withServer`                                         | Testleri tek kullanımlık bir yerel HTTP sunucusunda çalıştırır. `plugin-sdk/test-env` üzerinden içe aktarın                                                   |
| `createMockIncomingRequest`                          | Asgari bir gelen HTTP isteği nesnesi oluşturur. `plugin-sdk/test-env` üzerinden içe aktarın                                                                   |
| `withFetchPreconnect`                                | Getirme testlerini ön bağlantı kancaları kurulmuş olarak çalıştırır. `plugin-sdk/test-env` üzerinden içe aktarın                                              |
| `withEnv` / `withEnvAsync`                           | Ortam değişkenlerine geçici olarak yama uygular. `plugin-sdk/test-env` üzerinden içe aktarın                                                                  |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Yalıtılmış dosya sistemi test fikstürleri oluşturur. `plugin-sdk/test-env` üzerinden içe aktarın                                                              |
| `createMockServerResponse`                           | Asgari bir HTTP sunucusu yanıt taklidi oluşturur. `plugin-sdk/test-env` üzerinden içe aktarın                                                                 |
| `createProviderUsageFetch`                           | Sağlayıcı kullanımını getirme fikstürleri oluşturur. `plugin-sdk/test-env` üzerinden içe aktarın                                                             |
| `useFrozenTime` / `useRealTime`                      | Zamana duyarlı testler için zamanlayıcıları dondurur ve geri yükler. `plugin-sdk/test-env` üzerinden içe aktarın                                             |
| `createCliRuntimeCapture`                            | Testlerde CLI çalışma zamanı çıktısını yakalar. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                             |
| `importFreshModule`                                  | Modül önbelleğini atlamak için yeni bir sorgu belirteciyle bir ESM modülünü içe aktarır. `plugin-sdk/test-fixtures` üzerinden içe aktarın                     |
| `bundledPluginRoot` / `bundledPluginFile`            | Birlikte paketlenmiş plugin kaynak veya dağıtım fikstürü yollarını çözümler. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                |
| `mockNodeBuiltinModule`                              | Dar kapsamlı Node yerleşik Vitest taklitlerini kurar. `plugin-sdk/test-node-mocks` üzerinden içe aktarın                                                     |
| `createSandboxTestContext`                           | Korumalı alan test bağlamları oluşturur. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                                    |
| `writeSkill`                                         | Skill fixture'larını yazın. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                                             |
| `makeAgentAssistantMessage`                          | Ajan transkript mesajı fixture'ları oluşturun. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sistem olayı fixture'larını inceleyin ve sıfırlayın. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                          |
| `sanitizeTerminalText`                               | Doğrulamalar için terminal çıktısını temizleyin. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                          |
| `countLines` / `hasBalancedFences`                   | Parçalama çıktısının biçimini doğrulayın. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                                     |
| `typedCases`                                         | Tablo güdümlü testler için sabit türleri koruyun. `plugin-sdk/test-fixtures` üzerinden içe aktarın                                                    |

Paketle gelen Plugin sözleşme paketleri, yalnızca test amaçlı kayıt defteri, manifest, herkese açık yapıt ve çalışma zamanı fikstürü yardımcıları için bu SDK test alt yollarını da kullanır.
Paketle gelen OpenClaw envanterine bağlı yalnızca çekirdeğe özel paketler ise bunun yerine
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

Kanal hedefi çözümlemeye yönelik standart hata durumlarını eklemek için
`installCommonResolveTargetErrorCases` kullanın:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Kanalınızın hedef çözümleme mantığı
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Kanala özgü test durumları ekleyin
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Test kalıpları

### Kayıt sözleşmelerini test etme

`register(api)` işlevine elle yazılmış bir `api` sahtesi aktaran birim testleri,
OpenClaw'ın yükleyici kabul kapılarını çalıştırmaz. Plugin'inizin bağlı olduğu
her kayıt yüzeyi için, özellikle kancalar ve bellek gibi münhasır yetenekler
için, en az bir yükleyici destekli duman testi ekleyin.

Gerekli meta veriler eksik olduğunda veya bir Plugin sahibi olmadığı bir
yetenek API'sini çağırdığında gerçek yükleyici Plugin kaydını başarısız kılar.
Örneğin, `api.registerHook(...)` bir kanca adı gerektirir ve
`api.registerMemoryCapability(...)`, Plugin manifestinin veya dışa aktarılan
girişin `kind: "memory"` bildirmesini gerektirir.

### Çalışma zamanı yapılandırma erişimini test etme

`openclaw/plugin-sdk/plugin-test-runtime` içindeki paylaşılan Plugin çalışma zamanı
sahte nesnesini tercih edin. `runtime.config.loadConfig()` ve
`runtime.config.writeConfigFile(...)` sahte işlevleri varsayılan olarak hata
fırlatır; böylece testler, kullanımdan kaldırılmış uyumluluk API'lerinin yeni
kullanımlarını yakalar. Bu sahte işlevleri yalnızca test açıkça eski uyumluluk
davranışını kapsıyorsa geçersiz kılın.

### Bir kanal Plugin'ini birim testiyle sınama

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
    // Belirteç değeri açığa çıkarılmaz
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Bir sağlayıcı Plugin'ini birim testiyle sınama

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... bağlam
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... bağlam
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin çalışma zamanını sahteleme

`createPluginRuntimeStore` kullanan kodlarda çalışma zamanını testlerde sahteleyin:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// Test kurulumunda
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... diğer sahte işlevler
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

### Örnek başına saplamalarla test etme

Prototip değiştirme yerine örnek başına saplamaları tercih edin:

```typescript
// Tercih edilen: örnek başına saplama
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Kaçının: prototip değiştirme
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Sözleşme testleri (depo içi Plugin'ler)

Paketle gelen Plugin'ler, kayıt sahipliğini doğrulayan sözleşme testlerine sahiptir:

```bash
pnpm test src/plugins/contracts/
```

Bu testler şunları doğrular:

- Hangi Plugin'lerin hangi sağlayıcıları kaydettiği
- Hangi Plugin'lerin hangi konuşma sağlayıcılarını kaydettiği
- Kayıt şeklinin doğruluğu
- Çalışma zamanı sözleşmesine uyumluluk

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
içe aktarma sınırı denetimi çalıştırır; her biri yerel olarak bağımsız biçimde
de çalıştırılabilir:

| Komut                                                          | Uyguladığı kural                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Paketle gelen Plugin'ler, tek parça `openclaw/plugin-sdk` kök barrel'ını içe aktaramaz.                                                  |
| `pnpm run lint:plugins:no-extension-src-imports`               | Üretim uzantısı dosyaları, deponun `src/**` ağacını doğrudan (`../../src/...`) içe aktaramaz.                                            |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Uzantı test dosyaları `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` veya yalnızca çekirdeğe özel diğer test yardımcılarını içe aktaramaz. |

Harici Plugin'ler bu lint kurallarına tabi değildir, ancak aynı kalıpların
izlenmesi önerilir.

## Test yapılandırması

OpenClaw, bilgilendirme amaçlı V8 kapsam raporlamasıyla Vitest 4 kullanır.
Plugin testleri için:

```bash
# Tüm testleri çalıştır
pnpm test

# Belirli Plugin testlerini çalıştır
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Belirli bir test adı filtresiyle çalıştır
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Kapsam raporuyla çalıştır
pnpm test:coverage
```

Yerel çalıştırmalar bellek baskısına neden olursa:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## İlgili konular

- [SDK'ya Genel Bakış](/tr/plugins/sdk-overview) -- içe aktarma kuralları
- [SDK Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) -- kanal Plugin'i arayüzü
- [SDK Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) -- sağlayıcı Plugin kancaları
- [Plugin Oluşturma](/tr/plugins/building-plugins) -- başlangıç kılavuzu
