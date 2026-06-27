---
read_when:
    - Piszesz testy dla pluginu
    - Potrzebujesz narzędzi testowych z SDK Plugin
    - Chcesz zrozumieć testy kontraktowe dla wbudowanych Pluginów
sidebarTitle: Testing
summary: Narzędzia i wzorce testowania pluginów OpenClaw
title: Testowanie Pluginu
x-i18n:
    generated_at: "2026-06-27T18:08:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Materiały referencyjne dotyczące narzędzi testowych, wzorców i egzekwowania reguł lint dla
pluginów OpenClaw.

<Tip>
  **Szukasz przykładów testów?** Przewodniki how-to zawierają opracowane przykłady testów:
  [Testy pluginów kanału](/pl/plugins/sdk-channel-plugins#step-6-test) i
  [Testy pluginów providerów](/pl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Narzędzia testowe

Te podścieżki helperów testowych są lokalnymi dla repo punktami wejścia źródeł dla własnych
testów wbudowanych pluginów OpenClaw. Nie są eksportami pakietu dla pluginów zewnętrznych i
mogą importować Vitest lub inne zależności testowe używane tylko w repo.

**Import mocka API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Import kontraktu runtime agenta:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import kontraktu kanału:** `openclaw/plugin-sdk/channel-contract-testing`

**Import helpera testowego kanału:** `openclaw/plugin-sdk/channel-test-helpers`

**Import testowy celu kanału:** `openclaw/plugin-sdk/channel-target-testing`

**Import kontraktu Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import testowy runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import kontraktu providera:** `openclaw/plugin-sdk/provider-test-contracts`

**Import mocka HTTP providera:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import testowy środowiska/sieci:** `openclaw/plugin-sdk/test-env`

**Import ogólnego fixture:** `openclaw/plugin-sdk/test-fixtures`

**Import mocka wbudowanego modułu Node:** `openclaw/plugin-sdk/test-node-mocks`

W repo OpenClaw preferuj poniższe wyspecjalizowane podścieżki dla nowych testów
wbudowanych pluginów. Szeroki barrel
`openclaw/plugin-sdk/testing` służy tylko do zgodności ze starszym kodem.
Zabezpieczenia repo odrzucają nowe rzeczywiste importy z `plugin-sdk/testing` i
`plugin-sdk/test-utils`; te nazwy pozostają wyłącznie jako przestarzałe powierzchnie
zgodności dla testów rekordów zgodności.

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

### Dostępne eksporty

| Eksport                                              | Cel                                                                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Zbuduj minimalną makietę API pluginu do bezpośrednich testów jednostkowych rejestracji. Importuj z `plugin-sdk/plugin-test-api`          |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Współdzielona fikstura kontraktu profilu uwierzytelniania dla natywnych adapterów środowiska uruchomieniowego agenta. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Współdzielona fikstura kontraktu tłumienia dostarczania dla natywnych adapterów środowiska uruchomieniowego agenta. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Współdzielona fikstura kontraktu klasyfikacji fallback dla natywnych adapterów środowiska uruchomieniowego agenta. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Zbuduj fikstury schematu narzędzi dynamicznych do testów kontraktu natywnego środowiska uruchomieniowego. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Asercja kształtu kontekstu przychodzącego kanału. Importuj z `plugin-sdk/channel-contract-testing`                                       |
| `installChannelOutboundPayloadContractSuite`         | Zainstaluj przypadki kontraktu ładunku wychodzącego kanału. Importuj z `plugin-sdk/channel-contract-testing`                              |
| `createStartAccountContext`                          | Zbuduj konteksty cyklu życia konta kanału. Importuj z `plugin-sdk/channel-test-helpers`                                                   |
| `installChannelActionsContractSuite`                 | Zainstaluj ogólne przypadki kontraktu akcji wiadomości kanału. Importuj z `plugin-sdk/channel-test-helpers`                               |
| `installChannelSetupContractSuite`                   | Zainstaluj ogólne przypadki kontraktu konfiguracji kanału. Importuj z `plugin-sdk/channel-test-helpers`                                   |
| `installChannelStatusContractSuite`                  | Zainstaluj ogólne przypadki kontraktu statusu kanału. Importuj z `plugin-sdk/channel-test-helpers`                                        |
| `expectDirectoryIds`                                 | Asercja identyfikatorów katalogu kanału z funkcji listy katalogów. Importuj z `plugin-sdk/channel-test-helpers`                           |
| `assertBundledChannelEntries`                        | Asercja, że dołączone punkty wejścia kanału udostępniają oczekiwany publiczny kontrakt. Importuj z `plugin-sdk/channel-test-helpers`      |
| `formatEnvelopeTimestamp`                            | Formatuj deterministyczne znaczniki czasu koperty. Importuj z `plugin-sdk/channel-test-helpers`                                           |
| `expectPairingReplyText`                             | Asercja tekstu odpowiedzi parowania kanału i wyodrębnienie jego kodu. Importuj z `plugin-sdk/channel-test-helpers`                         |
| `describePluginRegistrationContract`                 | Zainstaluj kontrole kontraktu rejestracji pluginu. Importuj z `plugin-sdk/plugin-test-contracts`                                          |
| `registerSingleProviderPlugin`                       | Zarejestruj jeden plugin dostawcy w testach smoke loadera. Importuj z `plugin-sdk/plugin-test-runtime`                                    |
| `registerProviderPlugin`                             | Przechwyć wszystkie rodzaje dostawców z jednego pluginu. Importuj z `plugin-sdk/plugin-test-runtime`                                      |
| `registerProviderPlugins`                            | Przechwyć rejestracje dostawców w wielu pluginach. Importuj z `plugin-sdk/plugin-test-runtime`                                            |
| `requireRegisteredProvider`                          | Asercja, że kolekcja dostawców zawiera identyfikator. Importuj z `plugin-sdk/plugin-test-runtime`                                         |
| `createRuntimeEnv`                                   | Zbuduj zamockowane środowisko uruchomieniowe CLI/pluginu. Importuj z `plugin-sdk/plugin-test-runtime`                                     |
| `createPluginSetupWizardStatus`                      | Zbuduj pomocniki statusu konfiguracji dla pluginów kanałów. Importuj z `plugin-sdk/plugin-test-runtime`                                   |
| `describeOpenAIProviderRuntimeContract`              | Zainstaluj kontrole kontraktu środowiska uruchomieniowego rodziny dostawców. Importuj z `plugin-sdk/provider-test-contracts`              |
| `expectPassthroughReplayPolicy`                      | Asercja, że zasady odtwarzania dostawcy przepuszczają narzędzia i metadane należące do dostawcy. Importuj z `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Uruchom test live dostawcy STT w czasie rzeczywistym ze współdzielonymi fiksturami audio. Importuj z `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | Normalizuj wyjście transkrypcji live przed asercjami rozmytymi. Importuj z `plugin-sdk/provider-test-contracts`                           |
| `expectExplicitVideoGenerationCapabilities`          | Asercja, że dostawcy wideo deklarują jawne możliwości trybu generowania. Importuj z `plugin-sdk/provider-test-contracts`                  |
| `expectExplicitMusicGenerationCapabilities`          | Asercja, że dostawcy muzyki deklarują jawne możliwości generowania/edycji. Importuj z `plugin-sdk/provider-test-contracts`                |
| `mockSuccessfulDashscopeVideoTask`                   | Zainstaluj pomyślną odpowiedź zadania wideo zgodną z DashScope. Importuj z `plugin-sdk/provider-test-contracts`                           |
| `getProviderHttpMocks`                               | Uzyskaj dostęp do opcjonalnie włączanych mocków HTTP/auth dostawcy dla Vitest. Importuj z `plugin-sdk/provider-http-test-mocks`           |
| `installProviderHttpMockCleanup`                     | Resetuj mocki HTTP/auth dostawcy po każdym teście. Importuj z `plugin-sdk/provider-http-test-mocks`                                       |
| `installCommonResolveTargetErrorCases`               | Współdzielone przypadki testowe obsługi błędów rozwiązywania celu. Importuj z `plugin-sdk/channel-target-testing`                         |
| `shouldAckReaction`                                  | Sprawdź, czy kanał powinien dodać reakcję potwierdzenia. Importuj z `plugin-sdk/channel-feedback`                                         |
| `removeAckReactionAfterReply`                        | Usuń reakcję potwierdzenia po dostarczeniu odpowiedzi. Importuj z `plugin-sdk/channel-feedback`                                           |
| `createTestRegistry`                                 | Zbuduj fiksturę rejestru pluginów kanałów. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`              |
| `createEmptyPluginRegistry`                          | Zbuduj pustą fiksturę rejestru pluginów. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Zainstaluj fiksturę rejestru do testów środowiska uruchomieniowego pluginu. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Przechwytuj żądania pobierania JSON w testach pomocników mediów. Importuj z `plugin-sdk/test-env`                                        |
| `withServer`                                         | Uruchamiaj testy względem jednorazowego lokalnego serwera HTTP. Importuj z `plugin-sdk/test-env`                                         |
| `createMockIncomingRequest`                          | Zbuduj minimalny obiekt przychodzącego żądania HTTP. Importuj z `plugin-sdk/test-env`                                                     |
| `withFetchPreconnect`                                | Uruchamiaj testy fetch z zainstalowanymi hookami preconnect. Importuj z `plugin-sdk/test-env`                                             |
| `withEnv` / `withEnvAsync`                           | Tymczasowo modyfikuj zmienne środowiskowe. Importuj z `plugin-sdk/test-env`                                                              |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Utwórz izolowane fikstury testowe systemu plików. Importuj z `plugin-sdk/test-env`                                                       |
| `createMockServerResponse`                           | Utwórz minimalną makietę odpowiedzi serwera HTTP. Importuj z `plugin-sdk/test-env`                                                        |
| `createCliRuntimeCapture`                            | Przechwytuj wyjście środowiska uruchomieniowego CLI w testach. Importuj z `plugin-sdk/test-fixtures`                                      |
| `importFreshModule`                                  | Importuj moduł ESM ze świeżym tokenem zapytania, aby ominąć pamięć podręczną modułów. Importuj z `plugin-sdk/test-fixtures`              |
| `bundledPluginRoot` / `bundledPluginFile`            | Rozwiązuj ścieżki fikstur źródła lub dist dołączonego pluginu. Importuj z `plugin-sdk/test-fixtures`                                      |
| `mockNodeBuiltinModule`                              | Zainstaluj wąskie mocki wbudowanych modułów Node dla Vitest. Importuj z `plugin-sdk/test-node-mocks`                                      |
| `createSandboxTestContext`                           | Zbuduj konteksty testów sandbox. Importuj z `plugin-sdk/test-fixtures`                                                                    |
| `writeSkill`                                         | Zapisuj fikstury Skills. Importuj z `plugin-sdk/test-fixtures`                                                                            |
| `makeAgentAssistantMessage`                          | Zbuduj fikstury wiadomości transkrypcji agenta. Importuj z `plugin-sdk/test-fixtures`                                                     |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Kontroluj i resetuj fikstury zdarzeń systemowych. Importuj z `plugin-sdk/test-fixtures`                                                   |
| `sanitizeTerminalText`                               | Oczyszczaj wyjście terminala do asercji. Importuj z `plugin-sdk/test-fixtures`                                                            |
| `countLines` / `hasBalancedFences`                   | Asercja kształtu wyjścia porcjowania. Importuj z `plugin-sdk/test-fixtures`                                                               |
| `runProviderCatalog`                                 | Wykonaj hook katalogu dostawców z zależnościami testowymi                                                                                 |
| `resolveProviderWizardOptions`                       | Rozwiąż wybory kreatora konfiguracji dostawcy w testach kontraktowych                                                                     |
| `resolveProviderModelPickerEntries`                  | Rozwiąż wpisy selektora modeli dostawcy w testach kontraktowych                                                                           |
| `buildProviderPluginMethodChoice`                    | Zbuduj identyfikatory wyborów kreatora dostawcy do asercji                                                                                |
| `setProviderWizardProvidersResolverForTest`          | Wstrzyknij dostawców kreatora dostawców do izolowanych testów                                                                             |
| `createProviderUsageFetch`                           | Buduje fikstury pobierania użycia dostawcy                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Zamraża i przywraca timery dla testów zależnych od czasu. Importuj z `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Buduje zamockowany prompter kreatora konfiguracji                                                                                                     |
| `createRuntimeTaskFlow`                              | Tworzy izolowany stan TaskFlow środowiska uruchomieniowego                                                                                                  |
| `typedCases`                                         | Zachowuje typy literałowe dla testów sterowanych tabelą. Importuj z `plugin-sdk/test-fixtures`                                                    |

Pakiety testów kontraktów dołączonych Pluginów również używają podścieżek testowych SDK dla pomocników wyłącznie testowego rejestru, manifestu, artefaktów publicznych i fixture środowiska uruchomieniowego. Pakiety wyłącznie dla rdzenia, które zależą od dołączonego inwentarza OpenClaw, pozostają w `src/plugins/contracts`.
Nowe testy rozszerzeń umieszczaj na udokumentowanej, zawężonej podścieżce SDK, takiej jak
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` lub `plugin-sdk/test-fixtures`, zamiast importować szeroki barrel zgodności `plugin-sdk/testing`, pliki repozytorium `src/**` albo mostki `test/helpers/*` bezpośrednio.

### Typy

Zawężone podścieżki testowe ponownie eksportują też typy przydatne w plikach testowych:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Rozwiązywanie celu testowania

Użyj `installCommonResolveTargetErrorCases`, aby dodać standardowe przypadki błędów dla rozwiązywania celu kanału:

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

## Wzorce testowania

### Testowanie kontraktów rejestracji

Testy jednostkowe, które przekazują ręcznie napisany mock `api` do `register(api)`, nie sprawdzają bramek akceptacji loadera OpenClaw. Dodaj co najmniej jeden test smoke oparty na loaderze dla każdej powierzchni rejestracji, od której zależy Twój Plugin, zwłaszcza hooków i wyłącznych możliwości, takich jak pamięć.

Rzeczywisty loader kończy rejestrację Pluginu niepowodzeniem, gdy brakuje wymaganych metadanych albo Plugin wywołuje API możliwości, której nie posiada. Na przykład `api.registerHook(...)` wymaga nazwy hooka, a `api.registerMemoryCapability(...)` wymaga, aby manifest Pluginu lub wyeksportowany entry deklarował `kind: "memory"`.

### Testowanie dostępu do konfiguracji środowiska uruchomieniowego

Preferuj współdzielony mock środowiska uruchomieniowego Pluginu z `openclaw/plugin-sdk/channel-test-helpers` podczas testowania dołączonych Pluginów kanałów. Jego przestarzałe mocki `runtime.config.loadConfig()` i `runtime.config.writeConfigFile(...)` domyślnie rzucają wyjątki, aby testy wykrywały nowe użycie API zgodności. Nadpisuj te mocki tylko wtedy, gdy test wyraźnie obejmuje starsze zachowanie zgodności.

### Testowanie jednostkowe Pluginu kanału

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

### Testowanie jednostkowe Pluginu dostawcy

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

### Mockowanie środowiska uruchomieniowego Pluginu

Dla kodu, który używa `createPluginRuntimeStore`, mockuj środowisko uruchomieniowe w testach:

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

### Testowanie ze stubami per instancja

Preferuj stuby per instancja zamiast mutacji prototypu:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testy kontraktów (Pluginy w repozytorium)

Dołączone Pluginy mają testy kontraktów, które weryfikują własność rejestracji:

```bash
pnpm test -- src/plugins/contracts/
```

Te testy sprawdzają:

- Które Pluginy rejestrują których dostawców
- Które Pluginy rejestrują których dostawców mowy
- Poprawność kształtu rejestracji
- Zgodność z kontraktem środowiska uruchomieniowego

### Uruchamianie testów zawężonych

Dla konkretnego Pluginu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Tylko dla testów kontraktów:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Egzekwowanie lintowania (Pluginy w repozytorium)

`pnpm check` egzekwuje trzy reguły dla Pluginów w repozytorium:

1. **Brak monolitycznych importów z katalogu głównego** -- główny barrel `openclaw/plugin-sdk` jest odrzucany
2. **Brak bezpośrednich importów z `src/`** -- Pluginy nie mogą importować `../../src/` bezpośrednio
3. **Brak importów samego siebie** -- Pluginy nie mogą importować własnej podścieżki `plugin-sdk/<name>`

Zewnętrzne Pluginy nie podlegają tym regułom lintowania, ale zaleca się stosowanie tych samych wzorców.

## Konfiguracja testów

OpenClaw używa Vitest z progami pokrycia V8. Dla testów Pluginów:

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

Jeśli lokalne uruchomienia powodują presję na pamięć:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview) -- konwencje importowania
- [Pluginy kanałów SDK](/pl/plugins/sdk-channel-plugins) -- interfejs Pluginu kanału
- [Pluginy dostawców SDK](/pl/plugins/sdk-provider-plugins) -- hooki Pluginu dostawcy
- [Budowanie Pluginów](/pl/plugins/building-plugins) -- przewodnik wprowadzający
