---
read_when:
    - Piszesz testy dla pluginu
    - Potrzebujesz narzędzi testowych z SDK Pluginu
    - Chcesz zrozumieć testy kontraktowe dla dołączonych pluginów
sidebarTitle: Testing
summary: Narzędzia testowe i wzorce dla Pluginów OpenClaw
title: Testowanie Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Dokumentacja narzędzi testowych, wzorców i wymuszania reguł lint dla pluginów OpenClaw.

<Tip>
  **Szukasz przykładów testów?** Przewodniki how-to zawierają opracowane przykłady testów:
  [Testy Plugin kanału](/pl/plugins/sdk-channel-plugins#step-6-test) oraz
  [Testy Plugin dostawcy](/pl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Narzędzia testowe

Te ścieżki podrzędne pomocników testowych są lokalnymi dla repozytorium punktami wejścia źródeł dla własnych testów
dołączonych pluginów OpenClaw. Nie są eksportami pakietu dla pluginów zewnętrznych i
mogą importować Vitest lub inne zależności testowe dostępne tylko w repozytorium.

**Import makiety API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Import kontraktu środowiska uruchomieniowego agenta:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import kontraktu kanału:** `openclaw/plugin-sdk/channel-contract-testing`

**Import pomocnika testów kanału:** `openclaw/plugin-sdk/channel-test-helpers`

**Import testów celu kanału:** `openclaw/plugin-sdk/channel-target-testing`

**Import kontraktu Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import testu środowiska uruchomieniowego Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import kontraktu dostawcy:** `openclaw/plugin-sdk/provider-test-contracts`

**Import makiety HTTP dostawcy:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import testów środowiska/sieci:** `openclaw/plugin-sdk/test-env`

**Import ogólnego fixture:** `openclaw/plugin-sdk/test-fixtures`

**Import makiety wbudowanego modułu Node:** `openclaw/plugin-sdk/test-node-mocks`

W repozytorium OpenClaw dla nowych testów dołączonych
pluginów preferuj poniższe wyspecjalizowane ścieżki podrzędne. Szeroki barrel
`openclaw/plugin-sdk/testing` służy wyłącznie starszej kompatybilności.
Zabezpieczenia repozytorium odrzucają nowe rzeczywiste importy z `plugin-sdk/testing` i
`plugin-sdk/test-utils`; te nazwy pozostają tylko jako przestarzałe powierzchnie kompatybilności
dla testów rejestrów kompatybilności.

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

| Eksport                                              | Cel                                                                                                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Zbuduj minimalną atrapę API Pluginu dla bezpośrednich testów jednostkowych rejestracji. Importuj z `plugin-sdk/plugin-test-api`                    |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Wspólna fixture kontraktu profilu uwierzytelniania dla natywnych adapterów środowiska uruchomieniowego agentów. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Wspólna fixture kontraktu tłumienia dostarczania dla natywnych adapterów środowiska uruchomieniowego agentów. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Wspólna fixture kontraktu klasyfikacji fallback dla natywnych adapterów środowiska uruchomieniowego agentów. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Zbuduj fixture schematów narzędzi dynamicznych dla testów kontraktu natywnego środowiska uruchomieniowego. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Zweryfikuj kształt kontekstu przychodzącego kanału. Importuj z `plugin-sdk/channel-contract-testing`                                               |
| `installChannelOutboundPayloadContractSuite`         | Zainstaluj przypadki kontraktu wychodzącego payloadu kanału. Importuj z `plugin-sdk/channel-contract-testing`                                      |
| `createStartAccountContext`                          | Zbuduj konteksty cyklu życia konta kanału. Importuj z `plugin-sdk/channel-test-helpers`                                                            |
| `installChannelActionsContractSuite`                 | Zainstaluj ogólne przypadki kontraktu akcji wiadomości kanału. Importuj z `plugin-sdk/channel-test-helpers`                                       |
| `installChannelSetupContractSuite`                   | Zainstaluj ogólne przypadki kontraktu konfiguracji kanału. Importuj z `plugin-sdk/channel-test-helpers`                                           |
| `installChannelStatusContractSuite`                  | Zainstaluj ogólne przypadki kontraktu statusu kanału. Importuj z `plugin-sdk/channel-test-helpers`                                                |
| `expectDirectoryIds`                                 | Zweryfikuj identyfikatory katalogu kanału z funkcji listowania katalogu. Importuj z `plugin-sdk/channel-test-helpers`                             |
| `assertBundledChannelEntries`                        | Zweryfikuj, że dołączone punkty wejścia kanału udostępniają oczekiwany kontrakt publiczny. Importuj z `plugin-sdk/channel-test-helpers`           |
| `formatEnvelopeTimestamp`                            | Formatuj deterministyczne znaczniki czasu koperty. Importuj z `plugin-sdk/channel-test-helpers`                                                   |
| `expectPairingReplyText`                             | Zweryfikuj tekst odpowiedzi parowania kanału i wyodrębnij jego kod. Importuj z `plugin-sdk/channel-test-helpers`                                  |
| `describePluginRegistrationContract`                 | Zainstaluj kontrole kontraktu rejestracji Pluginu. Importuj z `plugin-sdk/plugin-test-contracts`                                                  |
| `registerSingleProviderPlugin`                       | Zarejestruj jeden Plugin dostawcy w testach dymnych loadera. Importuj z `plugin-sdk/plugin-test-runtime`                                          |
| `registerProviderPlugin`                             | Przechwyć wszystkie rodzaje dostawców z jednego Pluginu. Importuj z `plugin-sdk/plugin-test-runtime`                                              |
| `registerProviderPlugins`                            | Przechwyć rejestracje dostawców w wielu Pluginach. Importuj z `plugin-sdk/plugin-test-runtime`                                                    |
| `requireRegisteredProvider`                          | Zweryfikuj, że kolekcja dostawców zawiera identyfikator. Importuj z `plugin-sdk/plugin-test-runtime`                                              |
| `createRuntimeEnv`                                   | Zbuduj zamockowane środowisko uruchomieniowe CLI/Pluginu. Importuj z `plugin-sdk/plugin-test-runtime`                                             |
| `createPluginRuntimeMock`                            | Zbuduj zamockowaną powierzchnię środowiska uruchomieniowego Pluginu. Importuj z `plugin-sdk/plugin-test-runtime`                                  |
| `createPluginSetupWizardStatus`                      | Zbuduj pomocniki statusu konfiguracji dla Pluginów kanałów. Importuj z `plugin-sdk/plugin-test-runtime`                                           |
| `describeOpenAIProviderRuntimeContract`              | Zainstaluj kontrole kontraktu środowiska uruchomieniowego rodziny dostawców. Importuj z `plugin-sdk/provider-test-contracts`                      |
| `expectPassthroughReplayPolicy`                      | Zweryfikuj, że zasady odtwarzania dostawcy przepuszczają narzędzia i metadane należące do dostawcy. Importuj z `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Uruchom test live dostawcy STT czasu rzeczywistego ze wspólnymi fixture audio. Importuj z `plugin-sdk/provider-test-contracts`                    |
| `normalizeTranscriptForMatch`                        | Znormalizuj wynik transkryptu live przed asercjami rozmytymi. Importuj z `plugin-sdk/provider-test-contracts`                                    |
| `expectExplicitVideoGenerationCapabilities`          | Zweryfikuj, że dostawcy wideo deklarują jawne możliwości trybu generowania. Importuj z `plugin-sdk/provider-test-contracts`                       |
| `expectExplicitMusicGenerationCapabilities`          | Zweryfikuj, że dostawcy muzyki deklarują jawne możliwości generowania/edycji. Importuj z `plugin-sdk/provider-test-contracts`                     |
| `mockSuccessfulDashscopeVideoTask`                   | Zainstaluj pomyślną odpowiedź zadania wideo zgodną z DashScope. Importuj z `plugin-sdk/provider-test-contracts`                                  |
| `getProviderHttpMocks`                               | Uzyskaj dostęp do opcjonalnych mocków HTTP/auth dostawcy w Vitest. Importuj z `plugin-sdk/provider-http-test-mocks`                              |
| `installProviderHttpMockCleanup`                     | Resetuj mocki HTTP/auth dostawcy po każdym teście. Importuj z `plugin-sdk/provider-http-test-mocks`                                               |
| `installCommonResolveTargetErrorCases`               | Wspólne przypadki testowe obsługi błędów rozwiązywania celu. Importuj z `plugin-sdk/channel-target-testing`                                      |
| `shouldAckReaction`                                  | Sprawdź, czy kanał powinien dodać reakcję potwierdzenia. Importuj z `plugin-sdk/channel-feedback`                                                |
| `removeAckReactionAfterReply`                        | Usuń reakcję potwierdzenia po dostarczeniu odpowiedzi. Importuj z `plugin-sdk/channel-feedback`                                                  |
| `createTestRegistry`                                 | Zbuduj fixture rejestru Pluginów kanałów. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`                      |
| `createEmptyPluginRegistry`                          | Zbuduj fixture pustego rejestru Pluginów. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`                      |
| `setActivePluginRegistry`                            | Zainstaluj fixture rejestru dla testów środowiska uruchomieniowego Pluginu. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Przechwytuj żądania JSON fetch w testach pomocników mediów. Importuj z `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Uruchamiaj testy względem jednorazowego lokalnego serwera HTTP. Importuj z `plugin-sdk/test-env`                                                 |
| `createMockIncomingRequest`                          | Zbuduj minimalny obiekt przychodzącego żądania HTTP. Importuj z `plugin-sdk/test-env`                                                            |
| `withFetchPreconnect`                                | Uruchamiaj testy fetch z zainstalowanymi hookami preconnect. Importuj z `plugin-sdk/test-env`                                                    |
| `withEnv` / `withEnvAsync`                           | Tymczasowo modyfikuj zmienne środowiskowe. Importuj z `plugin-sdk/test-env`                                                                       |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Twórz izolowane fixture testowe systemu plików. Importuj z `plugin-sdk/test-env`                                                                  |
| `createMockServerResponse`                           | Utwórz minimalną atrapę odpowiedzi serwera HTTP. Importuj z `plugin-sdk/test-env`                                                                 |
| `createCliRuntimeCapture`                            | Przechwytuj wynik środowiska uruchomieniowego CLI w testach. Importuj z `plugin-sdk/test-fixtures`                                               |
| `importFreshModule`                                  | Importuj moduł ESM ze świeżym tokenem zapytania, aby ominąć pamięć podręczną modułów. Importuj z `plugin-sdk/test-fixtures`                      |
| `bundledPluginRoot` / `bundledPluginFile`            | Rozwiązuj ścieżki źródłowe dołączonego Pluginu lub ścieżki fixture dist. Importuj z `plugin-sdk/test-fixtures`                                  |
| `mockNodeBuiltinModule`                              | Zainstaluj wąskie mocki wbudowanych modułów Node w Vitest. Importuj z `plugin-sdk/test-node-mocks`                                               |
| `createSandboxTestContext`                           | Zbuduj konteksty testów sandboxa. Importuj z `plugin-sdk/test-fixtures`                                                                          |
| `writeSkill`                                         | Zapisuj fixture Skills. Importuj z `plugin-sdk/test-fixtures`                                                                                    |
| `makeAgentAssistantMessage`                          | Zbuduj fixture wiadomości transkryptu agenta. Importuj z `plugin-sdk/test-fixtures`                                                              |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sprawdzaj i resetuj fixture zdarzeń systemowych. Importuj z `plugin-sdk/test-fixtures`                                                           |
| `sanitizeTerminalText`                               | Oczyszczaj wynik terminala na potrzeby asercji. Importuj z `plugin-sdk/test-fixtures`                                                            |
| `countLines` / `hasBalancedFences`                   | Zweryfikuj kształt wyniku dzielenia na fragmenty. Importuj z `plugin-sdk/test-fixtures`                                                          |
| `runProviderCatalog`                                 | Wykonaj hook katalogu dostawcy z zależnościami testowymi                                                                                         |
| `resolveProviderWizardOptions`                       | Rozwiąż wybory kreatora konfiguracji dostawcy w testach kontraktu                                                                                |
| `resolveProviderModelPickerEntries`                  | Rozwiąż wpisy selektora modeli dostawcy w testach kontraktu                                                                                      |
| `buildProviderPluginMethodChoice`                    | Zbuduj identyfikatory wyborów kreatora dostawcy dla asercji                                                                                      |
| `setProviderWizardProvidersResolverForTest`          | Wstrzyknij dostawców kreatora dostawców na potrzeby izolowanych testów                                                                    |
| `createProviderUsageFetch`                           | Zbuduj fixtures pobierania użycia dostawcy                                                                                               |
| `useFrozenTime` / `useRealTime`                      | Zamroź i przywróć timery dla testów wrażliwych na czas. Importuj z `plugin-sdk/test-env`                                                  |
| `createTestWizardPrompter`                           | Zbuduj zamockowany prompter kreatora konfiguracji                                                                                         |
| `createRuntimeTaskFlow`                              | Utwórz izolowany stan task-flow środowiska uruchomieniowego                                                                               |
| `typedCases`                                         | Zachowaj typy literałów dla testów tabelarycznych. Importuj z `plugin-sdk/test-fixtures`                                                   |

Zestawy testów kontraktów dla dołączonych pluginów używają też podścieżek testowych SDK dla pomocników fixture używanych wyłącznie w testach: rejestru, manifestu, artefaktu publicznego i runtime. Zestawy wyłącznie dla rdzenia, które zależą od dołączonego inwentarza OpenClaw, pozostają w `src/plugins/contracts`.
Nowe testy rozszerzeń umieszczaj na udokumentowanej, wyspecjalizowanej podścieżce SDK, takiej jak
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` albo `plugin-sdk/test-fixtures`, zamiast importować bezpośrednio
szeroki kompatybilnościowy barrel `plugin-sdk/testing`, pliki repozytorium `src/**` albo mostki repozytorium
`test/helpers/*`.

### Typy

Wyspecjalizowane podścieżki testowe ponownie eksportują też typy przydatne w plikach testowych:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Rozwiązywanie celu testów

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

Testy jednostkowe, które przekazują ręcznie napisany mock `api` do `register(api)`, nie sprawdzają bramek akceptacji loadera OpenClaw. Dodaj co najmniej jeden test smoke oparty na loaderze dla każdej powierzchni rejestracji, od której zależy Twój plugin, szczególnie hooków i wyłącznych capabilities, takich jak pamięć.

Rzeczywisty loader powoduje niepowodzenie rejestracji pluginu, gdy brakuje wymaganych metadanych albo gdy plugin wywołuje capability API, którego nie posiada. Na przykład
`api.registerHook(...)` wymaga nazwy hooka, a
`api.registerMemoryCapability(...)` wymaga, aby manifest pluginu albo eksportowany punkt wejścia deklarował `kind: "memory"`.

### Testowanie dostępu do konfiguracji runtime

Preferuj współdzielony mock runtime pluginu z `openclaw/plugin-sdk/plugin-test-runtime`.
Jego przestarzałe mocki `runtime.config.loadConfig()` i `runtime.config.writeConfigFile(...)`
domyślnie rzucają wyjątek, aby testy wychwytywały nowe użycia kompatybilnościowych API. Nadpisuj te mocki tylko wtedy, gdy test jawnie obejmuje starsze zachowanie kompatybilnościowe.

### Testowanie jednostkowe pluginu kanału

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

### Testowanie jednostkowe pluginu dostawcy

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

### Mockowanie runtime pluginu

Dla kodu, który używa `createPluginRuntimeStore`, mockuj runtime w testach:

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

### Testowanie ze stubami na instancję

Preferuj stuby na instancję zamiast mutacji prototypu:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testy kontraktów (pluginy w repozytorium)

Dołączone pluginy mają testy kontraktów, które weryfikują własność rejestracji:

```bash
pnpm test -- src/plugins/contracts/
```

Te testy sprawdzają:

- Które pluginy rejestrują których dostawców
- Które pluginy rejestrują których dostawców mowy
- Poprawność kształtu rejestracji
- Zgodność z kontraktem runtime

### Uruchamianie testów o ograniczonym zakresie

Dla konkretnego pluginu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Tylko dla testów kontraktów:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Egzekwowanie lintowania (pluginy w repozytorium)

Trzy reguły są egzekwowane przez `pnpm check` dla pluginów w repozytorium:

1. **Brak monolitycznych importów z katalogu głównego** -- główny barrel `openclaw/plugin-sdk` jest odrzucany
2. **Brak bezpośrednich importów z `src/`** -- pluginy nie mogą bezpośrednio importować `../../src/`
3. **Brak samoimportów** -- pluginy nie mogą importować własnej podścieżki `plugin-sdk/<name>`

Pluginy zewnętrzne nie podlegają tym regułom lintowania, ale zaleca się stosowanie tych samych wzorców.

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

- [Przegląd SDK](/pl/plugins/sdk-overview) -- konwencje importowania
- [Pluginy kanałów SDK](/pl/plugins/sdk-channel-plugins) -- interfejs pluginu kanału
- [Pluginy dostawców SDK](/pl/plugins/sdk-provider-plugins) -- hooki pluginu dostawcy
- [Tworzenie pluginów](/pl/plugins/building-plugins) -- przewodnik wprowadzający
