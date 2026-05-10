---
read_when:
    - Piszesz testy dla Plugin
    - Potrzebujesz narzędzi testowych z Plugin SDK
    - Chcesz zrozumieć testy kontraktowe dla dołączonych Pluginów
sidebarTitle: Testing
summary: Narzędzia i wzorce testowania dla Pluginów OpenClaw
title: Testowanie Plugin
x-i18n:
    generated_at: "2026-05-10T19:50:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Dokumentacja narzędzi testowych, wzorców i wymuszania lintingu dla pluginów
OpenClaw.

<Tip>
  **Szukasz przykładów testów?** Przewodniki how-to zawierają opracowane przykłady testów:
  [Testy Pluginów kanałów](/pl/plugins/sdk-channel-plugins#step-6-test) i
  [Testy Pluginów dostawców](/pl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Narzędzia testowe

Te podścieżki pomocników testowych są lokalnymi dla repozytorium punktami wejścia kodu źródłowego dla własnych
testów dołączonych pluginów OpenClaw. Nie są eksportami pakietu dla pluginów firm trzecich.

**Import mocka API Pluginu:** `openclaw/plugin-sdk/plugin-test-api`

**Import kontraktu runtime agenta:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import kontraktu kanału:** `openclaw/plugin-sdk/channel-contract-testing`

**Import pomocnika testowego kanału:** `openclaw/plugin-sdk/channel-test-helpers`

**Import testowy celu kanału:** `openclaw/plugin-sdk/channel-target-testing`

**Import kontraktu Pluginu:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import testowy runtime Pluginu:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import kontraktu dostawcy:** `openclaw/plugin-sdk/provider-test-contracts`

**Import mocka HTTP dostawcy:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import testowy środowiska/sieci:** `openclaw/plugin-sdk/test-env`

**Import ogólnej fikstury:** `openclaw/plugin-sdk/test-fixtures`

**Import mocka wbudowanego modułu Node:** `openclaw/plugin-sdk/test-node-mocks`

W nowych testach pluginów preferuj poniższe wyspecjalizowane podścieżki. Szeroki
barrel `openclaw/plugin-sdk/testing` służy wyłącznie do zgodności ze starszym kodem.
Zabezpieczenia repozytorium odrzucają nowe rzeczywiste importy z `plugin-sdk/testing` i
`plugin-sdk/test-utils`; te nazwy pozostają tylko jako przestarzałe powierzchnie zgodności
dla testów zapisów zgodności.

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
| `createTestPluginApi`                                | Zbuduj minimalną makietę API pluginu do bezpośrednich testów jednostkowych rejestracji. Import z `plugin-sdk/plugin-test-api`          |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Wspólna fixtura kontraktu profilu uwierzytelniania dla natywnych adapterów środowiska uruchomieniowego agenta. Import z `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Wspólna fixtura kontraktu tłumienia dostarczania dla natywnych adapterów środowiska uruchomieniowego agenta. Import z `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Wspólna fixtura kontraktu klasyfikacji fallback dla natywnych adapterów środowiska uruchomieniowego agenta. Import z `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Zbuduj fixtury schematu narzędzi dynamicznych do testów kontraktu natywnego środowiska uruchomieniowego. Import z `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Asercja kształtu kontekstu przychodzącego kanału. Import z `plugin-sdk/channel-contract-testing`                                      |
| `installChannelOutboundPayloadContractSuite`         | Zainstaluj przypadki kontraktu ładunku wychodzącego kanału. Import z `plugin-sdk/channel-contract-testing`                            |
| `createStartAccountContext`                          | Zbuduj konteksty cyklu życia konta kanału. Import z `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Zainstaluj ogólne przypadki kontraktu akcji wiadomości kanału. Import z `plugin-sdk/channel-test-helpers`                             |
| `installChannelSetupContractSuite`                   | Zainstaluj ogólne przypadki kontraktu konfiguracji kanału. Import z `plugin-sdk/channel-test-helpers`                                 |
| `installChannelStatusContractSuite`                  | Zainstaluj ogólne przypadki kontraktu statusu kanału. Import z `plugin-sdk/channel-test-helpers`                                      |
| `expectDirectoryIds`                                 | Asercja identyfikatorów katalogu kanału z funkcji listy katalogu. Import z `plugin-sdk/channel-test-helpers`                          |
| `assertBundledChannelEntries`                        | Asercja, że dołączone punkty wejścia kanałów eksponują oczekiwany kontrakt publiczny. Import z `plugin-sdk/channel-test-helpers`       |
| `formatEnvelopeTimestamp`                            | Formatuj deterministyczne znaczniki czasu kopert. Import z `plugin-sdk/channel-test-helpers`                                          |
| `expectPairingReplyText`                             | Asercja tekstu odpowiedzi parowania kanału i wyodrębnienie jego kodu. Import z `plugin-sdk/channel-test-helpers`                       |
| `describePluginRegistrationContract`                 | Zainstaluj kontrole kontraktu rejestracji pluginu. Import z `plugin-sdk/plugin-test-contracts`                                        |
| `registerSingleProviderPlugin`                       | Zarejestruj jeden plugin dostawcy w testach smoke loadera. Import z `plugin-sdk/plugin-test-runtime`                                  |
| `registerProviderPlugin`                             | Przechwyć wszystkie rodzaje dostawców z jednego pluginu. Import z `plugin-sdk/plugin-test-runtime`                                    |
| `registerProviderPlugins`                            | Przechwyć rejestracje dostawców w wielu pluginach. Import z `plugin-sdk/plugin-test-runtime`                                          |
| `requireRegisteredProvider`                          | Asercja, że kolekcja dostawców zawiera identyfikator. Import z `plugin-sdk/plugin-test-runtime`                                       |
| `createRuntimeEnv`                                   | Zbuduj zamockowane środowisko uruchomieniowe CLI/pluginu. Import z `plugin-sdk/plugin-test-runtime`                                   |
| `createPluginSetupWizardStatus`                      | Zbuduj pomocniki statusu konfiguracji dla pluginów kanałów. Import z `plugin-sdk/plugin-test-runtime`                                 |
| `describeOpenAIProviderRuntimeContract`              | Zainstaluj kontrole kontraktu środowiska uruchomieniowego rodziny dostawców. Import z `plugin-sdk/provider-test-contracts`            |
| `expectPassthroughReplayPolicy`                      | Asercja, że zasady odtwarzania dostawcy przepuszczają narzędzia i metadane należące do dostawcy. Import z `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Uruchom test na żywo dostawcy STT w czasie rzeczywistym ze wspólnymi fixturami audio. Import z `plugin-sdk/provider-test-contracts`   |
| `normalizeTranscriptForMatch`                        | Normalizuj wynik transkrypcji na żywo przed asercjami rozmytymi. Import z `plugin-sdk/provider-test-contracts`                        |
| `expectExplicitVideoGenerationCapabilities`          | Asercja, że dostawcy wideo deklarują jawne możliwości trybu generowania. Import z `plugin-sdk/provider-test-contracts`                |
| `expectExplicitMusicGenerationCapabilities`          | Asercja, że dostawcy muzyki deklarują jawne możliwości generowania/edycji. Import z `plugin-sdk/provider-test-contracts`              |
| `mockSuccessfulDashscopeVideoTask`                   | Zainstaluj pomyślną odpowiedź zadania wideo zgodną z DashScope. Import z `plugin-sdk/provider-test-contracts`                         |
| `getProviderHttpMocks`                               | Uzyskaj dostęp do opt-in mocków HTTP/uwierzytelniania dostawcy Vitest. Import z `plugin-sdk/provider-http-test-mocks`                 |
| `installProviderHttpMockCleanup`                     | Resetuj mocki HTTP/uwierzytelniania dostawcy po każdym teście. Import z `plugin-sdk/provider-http-test-mocks`                         |
| `installCommonResolveTargetErrorCases`               | Wspólne przypadki testowe obsługi błędów rozpoznawania celu. Import z `plugin-sdk/channel-target-testing`                             |
| `shouldAckReaction`                                  | Sprawdź, czy kanał powinien dodać reakcję potwierdzenia. Import z `plugin-sdk/channel-feedback`                                       |
| `removeAckReactionAfterReply`                        | Usuń reakcję potwierdzenia po dostarczeniu odpowiedzi. Import z `plugin-sdk/channel-feedback`                                         |
| `createTestRegistry`                                 | Zbuduj fixturę rejestru pluginów kanałów. Import z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`             |
| `createEmptyPluginRegistry`                          | Zbuduj fixturę pustego rejestru pluginów. Import z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`             |
| `setActivePluginRegistry`                            | Zainstaluj fixturę rejestru dla testów środowiska uruchomieniowego pluginów. Import z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Przechwytuj żądania JSON fetch w testach pomocników multimediów. Import z `plugin-sdk/test-env`                                      |
| `withServer`                                         | Uruchamiaj testy wobec jednorazowego lokalnego serwera HTTP. Import z `plugin-sdk/test-env`                                           |
| `createMockIncomingRequest`                          | Zbuduj minimalny obiekt przychodzącego żądania HTTP. Import z `plugin-sdk/test-env`                                                   |
| `withFetchPreconnect`                                | Uruchamiaj testy fetch z zainstalowanymi hookami preconnect. Import z `plugin-sdk/test-env`                                           |
| `withEnv` / `withEnvAsync`                           | Tymczasowo modyfikuj zmienne środowiskowe. Import z `plugin-sdk/test-env`                                                              |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Twórz izolowane fixtury testowe systemu plików. Import z `plugin-sdk/test-env`                                                         |
| `createMockServerResponse`                           | Utwórz minimalną makietę odpowiedzi serwera HTTP. Import z `plugin-sdk/test-env`                                                       |
| `createCliRuntimeCapture`                            | Przechwytuj wynik środowiska uruchomieniowego CLI w testach. Import z `plugin-sdk/test-fixtures`                                      |
| `importFreshModule`                                  | Importuj moduł ESM ze świeżym tokenem zapytania, aby ominąć pamięć podręczną modułów. Import z `plugin-sdk/test-fixtures`             |
| `bundledPluginRoot` / `bundledPluginFile`            | Rozpoznawaj ścieżki fixtur źródeł lub dist dołączonych pluginów. Import z `plugin-sdk/test-fixtures`                                  |
| `mockNodeBuiltinModule`                              | Zainstaluj wąskie mocki Vitest wbudowanych modułów Node. Import z `plugin-sdk/test-node-mocks`                                        |
| `createSandboxTestContext`                           | Zbuduj konteksty testowe sandboxa. Import z `plugin-sdk/test-fixtures`                                                                 |
| `writeSkill`                                         | Zapisuj fixtury Skills. Import z `plugin-sdk/test-fixtures`                                                                            |
| `makeAgentAssistantMessage`                          | Zbuduj fixtury wiadomości transkryptu agenta. Import z `plugin-sdk/test-fixtures`                                                      |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sprawdzaj i resetuj fixtury zdarzeń systemowych. Import z `plugin-sdk/test-fixtures`                                                   |
| `sanitizeTerminalText`                               | Oczyszczaj wyjście terminala na potrzeby asercji. Import z `plugin-sdk/test-fixtures`                                                  |
| `countLines` / `hasBalancedFences`                   | Asercja kształtu wyniku dzielenia na fragmenty. Import z `plugin-sdk/test-fixtures`                                                    |
| `runProviderCatalog`                                 | Wykonaj hook katalogu dostawcy z zależnościami testowymi                                                                               |
| `resolveProviderWizardOptions`                       | Rozpoznaj wybory kreatora konfiguracji dostawcy w testach kontraktu                                                                    |
| `resolveProviderModelPickerEntries`                  | Rozpoznaj wpisy selektora modeli dostawcy w testach kontraktu                                                                          |
| `buildProviderPluginMethodChoice`                    | Zbuduj identyfikatory wyborów kreatora dostawcy do asercji                                                                             |
| `setProviderWizardProvidersResolverForTest`          | Wstrzyknij dostawców kreatora dostawcy do izolowanych testów                                                                           |
| `createProviderUsageFetch`                           | Utwórz fikstury pobierania użycia dostawcy                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Zamroź i przywróć timery dla testów zależnych od czasu. Importuj z `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Utwórz zamockowany prompter kreatora konfiguracji                                                                                                     |
| `createRuntimeTaskFlow`                              | Utwórz izolowany stan przepływu zadań środowiska uruchomieniowego                                                                                                  |
| `typedCases`                                         | Zachowaj typy literałowe dla testów opartych na tabelach. Importuj z `plugin-sdk/test-fixtures`                                                    |

Zestawy kontraktowe dla wbudowanych pluginów używają także ścieżek podrzędnych testowania SDK dla pomocników tylko testowych:
rejestru, manifestu, artefaktów publicznych i fikstur środowiska uruchomieniowego. Zestawy wyłącznie dla core,
które zależą od wbudowanego inwentarza OpenClaw, pozostają w `src/plugins/contracts`.
Nowe testy rozszerzeń umieszczaj w udokumentowanej, zawężonej ścieżce podrzędnej SDK, takiej jak
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` lub `plugin-sdk/test-fixtures`, zamiast importować
szeroki barrel zgodności `plugin-sdk/testing`, pliki repozytorium `src/**` albo mostki
repozytorium `test/helpers/*` bezpośrednio.

### Typy

Zawężone ścieżki podrzędne testowania ponownie eksportują także typy przydatne w plikach testowych:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Rozwiązywanie celu testowania

Użyj `installCommonResolveTargetErrorCases`, aby dodać standardowe przypadki błędów dla
rozwiązywania celu kanału:

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

Testy jednostkowe, które przekazują ręcznie napisany mock `api` do `register(api)`, nie sprawdzają
bramek akceptacji loadera OpenClaw. Dodaj co najmniej jeden test dymny oparty na loaderze
dla każdej powierzchni rejestracji, od której zależy Twój plugin, szczególnie hooków i
wyłącznych możliwości, takich jak pamięć.

Rzeczywisty loader powoduje niepowodzenie rejestracji pluginu, gdy brakuje wymaganych metadanych albo
plugin wywołuje API możliwości, której nie jest właścicielem. Na przykład
`api.registerHook(...)` wymaga nazwy hooka, a
`api.registerMemoryCapability(...)` wymaga, aby manifest pluginu albo eksportowany
punkt wejścia deklarował `kind: "memory"`.

### Testowanie dostępu do konfiguracji środowiska uruchomieniowego

Podczas testowania wbudowanych pluginów kanałów preferuj współdzielony mock środowiska uruchomieniowego pluginu z `openclaw/plugin-sdk/channel-test-helpers`.
Jego przestarzałe mocki `runtime.config.loadConfig()` i
`runtime.config.writeConfigFile(...)` domyślnie zgłaszają wyjątek, aby testy wykrywały nowe
użycie API zgodności. Nadpisuj te mocki tylko wtedy, gdy test
jawnie obejmuje zachowanie zgodności ze starszymi wersjami.

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

### Mockowanie środowiska uruchomieniowego pluginu

Dla kodu, który używa `createPluginRuntimeStore`, zamockuj środowisko uruchomieniowe w testach:

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

### Testowanie z per-instancyjnymi stubami

Preferuj per-instancyjne stuby zamiast mutowania prototypu:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testy kontraktowe (pluginy w repozytorium)

Wbudowane pluginy mają testy kontraktowe, które weryfikują własność rejestracji:

```bash
pnpm test -- src/plugins/contracts/
```

Te testy sprawdzają:

- Które pluginy rejestrują których dostawców
- Które pluginy rejestrują których dostawców mowy
- Poprawność kształtu rejestracji
- Zgodność z kontraktem środowiska uruchomieniowego

### Uruchamianie testów o ograniczonym zakresie

Dla konkretnego pluginu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Tylko dla testów kontraktowych:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Egzekwowanie lintowania (pluginy w repozytorium)

Trzy reguły są egzekwowane przez `pnpm check` dla pluginów w repozytorium:

1. **Brak monolitycznych importów z katalogu głównego** -- barrel główny `openclaw/plugin-sdk` jest odrzucany
2. **Brak bezpośrednich importów z `src/`** -- pluginy nie mogą importować bezpośrednio z `../../src/`
3. **Brak importów samego siebie** -- pluginy nie mogą importować własnej ścieżki podrzędnej `plugin-sdk/<name>`

Pluginy zewnętrzne nie podlegają tym regułom lintowania, ale zaleca się stosowanie tych samych
wzorców.

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

Jeśli lokalne uruchomienia powodują presję pamięci:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Powiązane

- [Omówienie SDK](/pl/plugins/sdk-overview) -- konwencje importowania
- [Pluginy kanałów SDK](/pl/plugins/sdk-channel-plugins) -- interfejs pluginu kanału
- [Pluginy dostawców SDK](/pl/plugins/sdk-provider-plugins) -- hooki pluginu dostawcy
- [Tworzenie pluginów](/pl/plugins/building-plugins) -- przewodnik wprowadzający
