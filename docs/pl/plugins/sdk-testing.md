---
read_when:
    - Piszesz testy dla Plugin
    - Potrzebujesz narzędzi testowych z SDK Plugin
    - Chcesz zrozumieć testy kontraktowe dla dołączonych Pluginów
sidebarTitle: Testing
summary: Narzędzia i wzorce testowania Pluginów OpenClaw
title: Testowanie Plugin
x-i18n:
    generated_at: "2026-05-02T22:22:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Materiały referencyjne dotyczące narzędzi testowych, wzorców i egzekwowania lint dla Plugin OpenClaw.

<Tip>
  **Szukasz przykładów testów?** Przewodniki praktyczne zawierają opracowane przykłady testów:
  [Testy Plugin kanału](/pl/plugins/sdk-channel-plugins#step-6-test) oraz
  [Testy Plugin dostawcy](/pl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Narzędzia testowe

**Import mocka API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Import kontraktu środowiska uruchomieniowego agenta:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import kontraktu kanału:** `openclaw/plugin-sdk/channel-contract-testing`

**Import helpera testowego kanału:** `openclaw/plugin-sdk/channel-test-helpers`

**Import testów celu kanału:** `openclaw/plugin-sdk/channel-target-testing`

**Import kontraktu Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import testów środowiska uruchomieniowego Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import kontraktu dostawcy:** `openclaw/plugin-sdk/provider-test-contracts`

**Import mocka HTTP dostawcy:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import testów środowiska/sieci:** `openclaw/plugin-sdk/test-env`

**Import ogólnych fikstur:** `openclaw/plugin-sdk/test-fixtures`

**Import mocka wbudowanego modułu Node:** `openclaw/plugin-sdk/test-node-mocks`

W przypadku nowych testów Plugin preferuj poniższe wyspecjalizowane podścieżki. Szeroki barrel
`openclaw/plugin-sdk/testing` służy wyłącznie do zgodności ze starszym kodem.
Zabezpieczenia repozytorium odrzucają nowe rzeczywiste importy z `plugin-sdk/testing` i
`plugin-sdk/test-utils`; te nazwy pozostają tylko jako przestarzałe powierzchnie zgodności
dla zewnętrznych Plugin i testów zapisów zgodności.

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

| Eksport                                              | Cel                                                                                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Zbuduj minimalną atrapę API Plugin do bezpośrednich testów jednostkowych rejestracji. Importuj z `plugin-sdk/plugin-test-api`          |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Wspólna kontraktowa fixture profilu uwierzytelniania dla natywnych adapterów środowiska uruchomieniowego agentów. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Wspólna kontraktowa fixture wyciszania dostarczania dla natywnych adapterów środowiska uruchomieniowego agentów. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Wspólna kontraktowa fixture klasyfikacji awaryjnej dla natywnych adapterów środowiska uruchomieniowego agentów. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Zbuduj fixture schematów narzędzi dynamicznych dla testów kontraktu natywnego środowiska uruchomieniowego. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Sprawdź kształt kontekstu przychodzącego kanału. Importuj z `plugin-sdk/channel-contract-testing`                                      |
| `installChannelOutboundPayloadContractSuite`         | Zainstaluj przypadki kontraktu ładunku wychodzącego kanału. Importuj z `plugin-sdk/channel-contract-testing`                           |
| `createStartAccountContext`                          | Zbuduj konteksty cyklu życia konta kanału. Importuj z `plugin-sdk/channel-test-helpers`                                                |
| `installChannelActionsContractSuite`                 | Zainstaluj ogólne przypadki kontraktu akcji wiadomości kanału. Importuj z `plugin-sdk/channel-test-helpers`                            |
| `installChannelSetupContractSuite`                   | Zainstaluj ogólne przypadki kontraktu konfiguracji kanału. Importuj z `plugin-sdk/channel-test-helpers`                                |
| `installChannelStatusContractSuite`                  | Zainstaluj ogólne przypadki kontraktu statusu kanału. Importuj z `plugin-sdk/channel-test-helpers`                                     |
| `expectDirectoryIds`                                 | Sprawdź identyfikatory katalogu kanałów z funkcji listy katalogu. Importuj z `plugin-sdk/channel-test-helpers`                         |
| `assertBundledChannelEntries`                        | Sprawdź, czy dołączone punkty wejścia kanałów udostępniają oczekiwany kontrakt publiczny. Importuj z `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Formatuj deterministyczne znaczniki czasu koperty. Importuj z `plugin-sdk/channel-test-helpers`                                       |
| `expectPairingReplyText`                             | Sprawdź tekst odpowiedzi parowania kanału i wyodrębnij jego kod. Importuj z `plugin-sdk/channel-test-helpers`                          |
| `describePluginRegistrationContract`                 | Zainstaluj kontrole kontraktu rejestracji Plugin. Importuj z `plugin-sdk/plugin-test-contracts`                                        |
| `registerSingleProviderPlugin`                       | Zarejestruj jeden Plugin dostawcy w testach smoke loadera. Importuj z `plugin-sdk/plugin-test-runtime`                                 |
| `registerProviderPlugin`                             | Przechwyć wszystkie rodzaje dostawców z jednego Plugin. Importuj z `plugin-sdk/plugin-test-runtime`                                    |
| `registerProviderPlugins`                            | Przechwyć rejestracje dostawców w wielu Plugin. Importuj z `plugin-sdk/plugin-test-runtime`                                            |
| `requireRegisteredProvider`                          | Sprawdź, czy kolekcja dostawców zawiera identyfikator. Importuj z `plugin-sdk/plugin-test-runtime`                                     |
| `createRuntimeEnv`                                   | Zbuduj atrapę środowiska uruchomieniowego CLI/Plugin. Importuj z `plugin-sdk/plugin-test-runtime`                                      |
| `createPluginSetupWizardStatus`                      | Zbuduj pomocniki statusu konfiguracji dla Plugin kanałów. Importuj z `plugin-sdk/plugin-test-runtime`                                  |
| `describeOpenAIProviderRuntimeContract`              | Zainstaluj kontrole kontraktu środowiska uruchomieniowego rodziny dostawców. Importuj z `plugin-sdk/provider-test-contracts`           |
| `expectPassthroughReplayPolicy`                      | Sprawdź, czy zasady odtwarzania dostawcy przepuszczają narzędzia i metadane należące do dostawcy. Importuj z `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Uruchom test na żywo dostawcy STT czasu rzeczywistego ze wspólnymi fixture audio. Importuj z `plugin-sdk/provider-test-contracts`      |
| `normalizeTranscriptForMatch`                        | Normalizuj wynik transkrypcji na żywo przed asercjami rozmytymi. Importuj z `plugin-sdk/provider-test-contracts`                      |
| `expectExplicitVideoGenerationCapabilities`          | Sprawdź, czy dostawcy wideo deklarują jawne możliwości trybu generowania. Importuj z `plugin-sdk/provider-test-contracts`              |
| `expectExplicitMusicGenerationCapabilities`          | Sprawdź, czy dostawcy muzyki deklarują jawne możliwości generowania/edycji. Importuj z `plugin-sdk/provider-test-contracts`            |
| `mockSuccessfulDashscopeVideoTask`                   | Zainstaluj udaną odpowiedź zadania wideo zgodną z DashScope. Importuj z `plugin-sdk/provider-test-contracts`                           |
| `getProviderHttpMocks`                               | Uzyskaj dostęp do opcjonalnych atrap HTTP/auth dostawcy w Vitest. Importuj z `plugin-sdk/provider-http-test-mocks`                     |
| `installProviderHttpMockCleanup`                     | Resetuj atrapy HTTP/auth dostawcy po każdym teście. Importuj z `plugin-sdk/provider-http-test-mocks`                                   |
| `installCommonResolveTargetErrorCases`               | Wspólne przypadki testowe dla obsługi błędów rozpoznawania celu. Importuj z `plugin-sdk/channel-target-testing`                        |
| `shouldAckReaction`                                  | Sprawdź, czy kanał powinien dodać reakcję potwierdzenia. Importuj z `plugin-sdk/channel-feedback`                                      |
| `removeAckReactionAfterReply`                        | Usuń reakcję potwierdzenia po dostarczeniu odpowiedzi. Importuj z `plugin-sdk/channel-feedback`                                        |
| `createTestRegistry`                                 | Zbuduj fixture rejestru Plugin kanału. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Zbuduj fixture pustego rejestru Plugin. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`              |
| `setActivePluginRegistry`                            | Zainstaluj fixture rejestru dla testów środowiska uruchomieniowego Plugin. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Przechwytuj żądania pobierania JSON w testach pomocników multimediów. Importuj z `plugin-sdk/test-env`                                 |
| `withServer`                                         | Uruchamiaj testy względem jednorazowego lokalnego serwera HTTP. Importuj z `plugin-sdk/test-env`                                       |
| `createMockIncomingRequest`                          | Zbuduj minimalny obiekt przychodzącego żądania HTTP. Importuj z `plugin-sdk/test-env`                                                  |
| `withFetchPreconnect`                                | Uruchamiaj testy fetch z zainstalowanymi hookami wstępnego połączenia. Importuj z `plugin-sdk/test-env`                                |
| `withEnv` / `withEnvAsync`                           | Tymczasowo modyfikuj zmienne środowiskowe. Importuj z `plugin-sdk/test-env`                                                            |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Twórz izolowane fixture testowe systemu plików. Importuj z `plugin-sdk/test-env`                                                       |
| `createMockServerResponse`                           | Utwórz minimalną atrapę odpowiedzi serwera HTTP. Importuj z `plugin-sdk/test-env`                                                       |
| `createCliRuntimeCapture`                            | Przechwytuj wyjście środowiska uruchomieniowego CLI w testach. Importuj z `plugin-sdk/test-fixtures`                                   |
| `importFreshModule`                                  | Importuj moduł ESM ze świeżym tokenem zapytania, aby ominąć pamięć podręczną modułów. Importuj z `plugin-sdk/test-fixtures`           |
| `bundledPluginRoot` / `bundledPluginFile`            | Rozpoznawaj ścieżki fixture źródła lub dist dołączonego Plugin. Importuj z `plugin-sdk/test-fixtures`                                  |
| `mockNodeBuiltinModule`                              | Zainstaluj wąskie atrapy Vitest wbudowanych modułów Node. Importuj z `plugin-sdk/test-node-mocks`                                      |
| `createSandboxTestContext`                           | Zbuduj konteksty testowe piaskownicy. Importuj z `plugin-sdk/test-fixtures`                                                            |
| `writeSkill`                                         | Zapisz fixture Skills. Importuj z `plugin-sdk/test-fixtures`                                                                           |
| `makeAgentAssistantMessage`                          | Zbuduj fixture wiadomości transkryptu agenta. Importuj z `plugin-sdk/test-fixtures`                                                    |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sprawdzaj i resetuj fixture zdarzeń systemowych. Importuj z `plugin-sdk/test-fixtures`                                                 |
| `sanitizeTerminalText`                               | Oczyść wyjście terminala na potrzeby asercji. Importuj z `plugin-sdk/test-fixtures`                                                     |
| `countLines` / `hasBalancedFences`                   | Sprawdź kształt wyniku dzielenia na fragmenty. Importuj z `plugin-sdk/test-fixtures`                                                   |
| `runProviderCatalog`                                 | Wykonaj hook katalogu dostawcy z zależnościami testowymi                                                                                |
| `resolveProviderWizardOptions`                       | Rozpoznaj wybory kreatora konfiguracji dostawcy w testach kontraktu                                                                    |
| `resolveProviderModelPickerEntries`                  | Rozpoznaj wpisy wyboru modelu dostawcy w testach kontraktu                                                                              |
| `buildProviderPluginMethodChoice`                    | Zbuduj identyfikatory wyboru metody kreatora dostawcy na potrzeby asercji                                                              |
| `setProviderWizardProvidersResolverForTest`          | Wstrzyknij dostawców kreatora dostawcy dla izolowanych testów                                                                           |
| `createProviderUsageFetch`                           | Tworzy fikstury pobierania użycia dostawcy                                                                                               |
| `useFrozenTime` / `useRealTime`                      | Zamraża i przywraca liczniki czasu dla testów zależnych od czasu. Importuj z `plugin-sdk/test-env`                                       |
| `createTestWizardPrompter`                           | Tworzy zamockowany prompter kreatora konfiguracji                                                                                        |
| `createRuntimeTaskFlow`                              | Tworzy izolowany stan przepływu zadań środowiska uruchomieniowego                                                                        |
| `typedCases`                                         | Zachowuje typy literałów dla testów sterowanych tabelą. Importuj z `plugin-sdk/test-fixtures`                                            |

Pakiety testów kontraktów bundled-plugin używają również podścieżek testowych SDK dla pomocników używanych tylko w testach: rejestru, manifestu, publicznych artefaktów i fixture środowiska uruchomieniowego. Pakiety testów wyłącznie dla core, które zależą od inwentarza bundled OpenClaw, pozostają w `src/plugins/contracts`. Nowe testy extension umieszczaj na udokumentowanej, ukierunkowanej podścieżce SDK, takiej jak `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures`, zamiast importować bezpośrednio szeroki barrel kompatybilności `plugin-sdk/testing`, pliki repozytorium `src/**` albo mostki repozytorium `test/helpers/*`.

### Typy

Ukierunkowane podścieżki testowe ponownie eksportują też typy przydatne w plikach testowych:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Testowanie rozwiązywania celów

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

Testy jednostkowe, które przekazują ręcznie napisany mock `api` do `register(api)`, nie sprawdzają bramek akceptacji loadera OpenClaw. Dodaj co najmniej jeden test smoke oparty na loaderze dla każdej powierzchni rejestracji, od której zależy twój plugin, szczególnie dla hooków i wyłącznych capability, takich jak pamięć.

Rzeczywisty loader kończy rejestrację Plugin niepowodzeniem, gdy brakuje wymaganych metadanych albo plugin wywołuje API capability, którego nie jest właścicielem. Na przykład `api.registerHook(...)` wymaga nazwy hooka, a `api.registerMemoryCapability(...)` wymaga, aby manifest Plugin lub eksportowany punkt wejścia deklarował `kind: "memory"`.

### Testowanie dostępu do konfiguracji środowiska uruchomieniowego

Przy testowaniu bundled pluginów kanałów preferuj współdzielony mock środowiska uruchomieniowego Plugin z `openclaw/plugin-sdk/channel-test-helpers`. Jego przestarzałe mocki `runtime.config.loadConfig()` i `runtime.config.writeConfigFile(...)` domyślnie rzucają wyjątek, aby testy wykrywały nowe użycia API kompatybilności. Nadpisuj te mocki tylko wtedy, gdy test jawnie obejmuje starsze zachowanie kompatybilności.

### Testowanie jednostkowe Plugin kanału

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

### Testowanie jednostkowe Plugin providera

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

### Mockowanie środowiska uruchomieniowego Plugin

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

## Testy kontraktowe (pluginy w repozytorium)

Bundled pluginy mają testy kontraktowe, które weryfikują własność rejestracji:

```bash
pnpm test -- src/plugins/contracts/
```

Te testy sprawdzają:

- Które pluginy rejestrują których providerów
- Które pluginy rejestrują których providerów mowy
- Poprawność kształtu rejestracji
- Zgodność z kontraktem środowiska uruchomieniowego

### Uruchamianie testów o ograniczonym zakresie

Dla konkretnego Plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Tylko dla testów kontraktowych:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Egzekwowanie lintingu (pluginy w repozytorium)

`pnpm check` egzekwuje trzy reguły dla pluginów w repozytorium:

1. **Bez monolitycznych importów z roota** -- barrel roota `openclaw/plugin-sdk` jest odrzucany
2. **Bez bezpośrednich importów z `src/`** -- pluginy nie mogą importować bezpośrednio `../../src/`
3. **Bez samoimportów** -- pluginy nie mogą importować własnej podścieżki `plugin-sdk/<name>`

Zewnętrzne pluginy nie podlegają tym regułom lintingu, ale zaleca się stosowanie tych samych wzorców.

## Konfiguracja testów

OpenClaw używa Vitest z progami pokrycia V8. Dla testów pluginów:

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

- [Omówienie SDK](/pl/plugins/sdk-overview) -- konwencje importu
- [Pluginy kanałów SDK](/pl/plugins/sdk-channel-plugins) -- interfejs Plugin kanału
- [Pluginy providerów SDK](/pl/plugins/sdk-provider-plugins) -- hooki Plugin providera
- [Tworzenie Plugin](/pl/plugins/building-plugins) -- przewodnik wprowadzający
