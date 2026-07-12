---
read_when:
    - Piszesz testy dla pluginu
    - Potrzebujesz narzędzi testowych z SDK pluginu
    - Chcesz zrozumieć testy kontraktowe dla dołączonych pluginów
sidebarTitle: Testing
summary: Narzędzia i wzorce testowania Pluginów OpenClaw
title: Testowanie Pluginów
x-i18n:
    generated_at: "2026-07-12T15:27:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Dokumentacja narzędzi testowych, wzorców i wymuszania reguł lintowania dla Pluginów OpenClaw.

<Tip>
  **Szukasz przykładów testów?** Przewodniki zawierają kompletne przykłady testów:
  [Testy Pluginów kanałów](/pl/plugins/sdk-channel-plugins#step-6-test) oraz
  [Testy Pluginów dostawców](/pl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Narzędzia testowe

Te ścieżki podrzędne są lokalnymi dla repozytorium punktami wejścia do kodu źródłowego testów własnych, dołączonych Pluginów OpenClaw. Nie są one publikowanymi eksportami `package.json` przeznaczonymi dla Pluginów innych firm i mogą importować Vitest lub inne zależności testowe dostępne wyłącznie w repozytorium.

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

W nowych testach dołączonych Pluginów preferuj te wyspecjalizowane ścieżki podrzędne. Ogólny moduł zbiorczy `openclaw/plugin-sdk/testing` oraz alias `openclaw/plugin-sdk/test-utils` służą wyłącznie do obsługi starszej zgodności: `pnpm run lint:plugins:no-extension-test-core-imports` (`scripts/check-no-extension-test-core-imports.ts`) odrzuca nowe importy któregokolwiek z nich w plikach testowych rozszerzeń, a oba pozostają wyłącznie na potrzeby testów rejestrujących zgodność.

### Dostępne eksporty

| Eksport                                              | Przeznaczenie                                                                                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Tworzy minimalną atrapę API pluginu do testów jednostkowych bezpośredniej rejestracji. Importuj z `plugin-sdk/plugin-test-api`                                   |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Współdzielony element testowy kontraktu profilu uwierzytelniania dla natywnych adapterów środowiska uruchomieniowego agenta. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Współdzielony element testowy kontraktu pomijania dostarczania odpowiedzi dla natywnych adapterów środowiska uruchomieniowego agenta. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Współdzielony element testowy kontraktu klasyfikacji mechanizmu rezerwowego dla natywnych adapterów środowiska uruchomieniowego agenta. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Tworzy elementy testowe schematu narzędzia dynamicznego do testów kontraktu natywnego środowiska uruchomieniowego. Importuj z `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Sprawdza strukturę kontekstu przychodzącego kanału. Importuj z `plugin-sdk/channel-contract-testing`                                                            |
| `installChannelOutboundPayloadContractSuite`         | Instaluje przypadki kontraktu ładunku wychodzącego kanału. Importuj z `plugin-sdk/channel-contract-testing`                                                     |
| `createStartAccountContext`                          | Tworzy konteksty cyklu życia konta kanału. Importuj z `plugin-sdk/channel-test-helpers`                                                                         |
| `installChannelActionsContractSuite`                 | Instaluje ogólne przypadki kontraktu działań na wiadomościach kanału. Importuj z `plugin-sdk/channel-test-helpers`                                              |
| `installChannelSetupContractSuite`                   | Instaluje ogólne przypadki kontraktu konfiguracji kanału. Importuj z `plugin-sdk/channel-test-helpers`                                                          |
| `installChannelStatusContractSuite`                  | Instaluje ogólne przypadki kontraktu stanu kanału. Importuj z `plugin-sdk/channel-test-helpers`                                                                 |
| `expectDirectoryIds`                                 | Sprawdza identyfikatory katalogu kanału zwracane przez funkcję wyświetlającą zawartość katalogu. Importuj z `plugin-sdk/channel-test-helpers`                    |
| `assertBundledChannelEntries`                        | Sprawdza, czy punkty wejścia dołączonych kanałów udostępniają oczekiwany kontrakt publiczny. Importuj z `plugin-sdk/channel-test-helpers`                        |
| `formatEnvelopeTimestamp`                            | Formatuje deterministyczne znaczniki czasu koperty. Importuj z `plugin-sdk/channel-test-helpers`                                                                |
| `expectPairingReplyText`                             | Sprawdza tekst odpowiedzi dotyczącej parowania i wyodrębnia z niego kod. Importuj z `plugin-sdk/channel-test-helpers`                                           |
| `describePluginRegistrationContract`                 | Instaluje kontrole kontraktu rejestracji pluginu. Importuj z `plugin-sdk/plugin-test-contracts`                                                                 |
| `registerSingleProviderPlugin`                       | Rejestruje jeden plugin dostawcy w testach dymnych modułu ładującego. Importuj z `plugin-sdk/plugin-test-runtime`                                               |
| `registerProviderPlugin`                             | Przechwytuje wszystkie rodzaje dostawców z jednego pluginu. Importuj z `plugin-sdk/plugin-test-runtime`                                                         |
| `registerProviderPlugins`                            | Przechwytuje rejestracje dostawców z wielu pluginów. Importuj z `plugin-sdk/plugin-test-runtime`                                                                |
| `requireRegisteredProvider`                          | Sprawdza, czy kolekcja dostawców zawiera identyfikator. Importuj z `plugin-sdk/plugin-test-runtime`                                                             |
| `createRuntimeEnv`                                   | Tworzy symulowane środowisko uruchomieniowe CLI/pluginu. Importuj z `plugin-sdk/plugin-test-runtime`                                                            |
| `createPluginRuntimeMock`                            | Tworzy atrapę powierzchni środowiska uruchomieniowego pluginu. Importuj z `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Tworzy funkcje pomocnicze stanu konfiguracji dla pluginów kanałów. Importuj z `plugin-sdk/plugin-test-runtime`                                                  |
| `createTestWizardPrompter`                           | Tworzy atrapę modułu interakcji z kreatorem konfiguracji. Importuj z `plugin-sdk/plugin-test-runtime`                                                           |
| `createRuntimeTaskFlow`                              | Tworzy odizolowany stan przepływu zadań środowiska uruchomieniowego. Importuj z `plugin-sdk/plugin-test-runtime`                                                |
| `runProviderCatalog`                                 | Wykonuje punkt zaczepienia katalogu dostawcy z zależnościami testowymi. Importuj z `plugin-sdk/plugin-test-runtime`                                             |
| `resolveProviderWizardOptions`                       | Rozpoznaje opcje kreatora konfiguracji dostawcy w testach kontraktu. Importuj z `plugin-sdk/plugin-test-runtime`                                               |
| `resolveProviderModelPickerEntries`                  | Rozpoznaje wpisy selektora modeli dostawcy w testach kontraktu. Importuj z `plugin-sdk/plugin-test-runtime`                                                     |
| `buildProviderPluginMethodChoice`                    | Tworzy identyfikatory opcji kreatora dostawcy na potrzeby asercji. Importuj z `plugin-sdk/plugin-test-runtime`                                                  |
| `setProviderWizardProvidersResolverForTest`          | Wstrzykuje dostawców kreatora dostawcy do odizolowanych testów. Importuj z `plugin-sdk/plugin-test-runtime`                                                     |
| `describeOpenAIProviderRuntimeContract`              | Instaluje kontrole kontraktu środowiska uruchomieniowego rodziny dostawców. Importuj z `plugin-sdk/provider-test-contracts`                                     |
| `expectPassthroughReplayPolicy`                      | Sprawdza, czy zasady ponownego odtwarzania dostawcy przepuszczają narzędzia i metadane należące do dostawcy. Importuj z `plugin-sdk/provider-test-contracts`     |
| `runRealtimeSttLiveTest`                             | Uruchamia test na żywo dostawcy STT czasu rzeczywistego ze współdzielonymi elementami testowymi audio. Importuj z `plugin-sdk/provider-test-contracts`           |
| `normalizeTranscriptForMatch`                        | Normalizuje wynik transkrypcji na żywo przed asercjami przybliżonego dopasowania. Importuj z `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Sprawdza, czy dostawcy wideo deklarują jawne możliwości trybu generowania. Importuj z `plugin-sdk/provider-test-contracts`                                      |
| `expectExplicitMusicGenerationCapabilities`          | Sprawdza, czy dostawcy muzyki deklarują jawne możliwości generowania i edycji. Importuj z `plugin-sdk/provider-test-contracts`                                  |
| `mockSuccessfulDashscopeVideoTask`                   | Instaluje pomyślną odpowiedź zadania wideo zgodnego z DashScope. Importuj z `plugin-sdk/provider-test-contracts`                                                |
| `getProviderHttpMocks`                               | Zapewnia dostęp do opcjonalnych atrap Vitest dla HTTP/uwierzytelniania dostawcy. Importuj z `plugin-sdk/provider-http-test-mocks`                               |
| `installProviderHttpMockCleanup`                     | Resetuje atrapy HTTP/uwierzytelniania dostawcy po każdym teście. Importuj z `plugin-sdk/provider-http-test-mocks`                                              |
| `installCommonResolveTargetErrorCases`               | Współdzielone przypadki testowe obsługi błędów rozpoznawania celu. Importuj z `plugin-sdk/channel-target-testing`                                               |
| `shouldAckReaction`                                  | Sprawdza, czy kanał powinien dodać reakcję potwierdzającą. Importuj z `plugin-sdk/channel-feedback`                                                             |
| `removeAckReactionAfterReply`                        | Usuwa reakcję potwierdzającą po dostarczeniu odpowiedzi. Importuj z `plugin-sdk/channel-feedback`                                                              |
| `createTestRegistry`                                 | Tworzy element testowy rejestru pluginów kanałów. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`                            |
| `createEmptyPluginRegistry`                          | Tworzy element testowy pustego rejestru pluginów. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`                            |
| `setActivePluginRegistry`                            | Instaluje element testowy rejestru do testów środowiska uruchomieniowego pluginu. Importuj z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Przechwytuje żądania pobierania JSON w testach funkcji pomocniczych multimediów. Importuj z `plugin-sdk/test-env`                                              |
| `withServer`                                         | Uruchamia testy względem jednorazowego lokalnego serwera HTTP. Importuj z `plugin-sdk/test-env`                                                                |
| `createMockIncomingRequest`                          | Tworzy minimalny obiekt przychodzącego żądania HTTP. Importuj z `plugin-sdk/test-env`                                                                          |
| `withFetchPreconnect`                                | Uruchamia testy pobierania z zainstalowanymi punktami zaczepienia połączenia wstępnego. Importuj z `plugin-sdk/test-env`                                       |
| `withEnv` / `withEnvAsync`                           | Tymczasowo modyfikuje zmienne środowiskowe. Importuj z `plugin-sdk/test-env`                                                                                    |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Tworzy odizolowane elementy testowe systemu plików. Importuj z `plugin-sdk/test-env`                                                                            |
| `createMockServerResponse`                           | Tworzy minimalną atrapę odpowiedzi serwera HTTP. Importuj z `plugin-sdk/test-env`                                                                               |
| `createProviderUsageFetch`                           | Tworzy elementy testowe pobierania danych o użyciu dostawcy. Importuj z `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Zamraża i przywraca czasomierze w testach zależnych od czasu. Importuj z `plugin-sdk/test-env`                                                                  |
| `createCliRuntimeCapture`                            | Przechwytuje dane wyjściowe środowiska uruchomieniowego CLI w testach. Importuj z `plugin-sdk/test-fixtures`                                                   |
| `importFreshModule`                                  | Importuje moduł ESM ze świeżym tokenem zapytania, aby ominąć pamięć podręczną modułów. Importuj z `plugin-sdk/test-fixtures`                                   |
| `bundledPluginRoot` / `bundledPluginFile`            | Rozpoznaje ścieżki do źródłowych lub dystrybucyjnych elementów testowych dołączonego pluginu. Importuj z `plugin-sdk/test-fixtures`                            |
| `mockNodeBuiltinModule`                              | Instaluje wąsko wyspecjalizowane atrapy Vitest wbudowanych modułów Node. Importuj z `plugin-sdk/test-node-mocks`                                               |
| `createSandboxTestContext`                           | Tworzy konteksty testowe piaskownicy. Importuj z `plugin-sdk/test-fixtures`                                                                                     |
| `writeSkill`                                         | Zapisuj dane testowe Skills. Importuj z `plugin-sdk/test-fixtures`                                                                       |
| `makeAgentAssistantMessage`                          | Twórz dane testowe komunikatów transkrypcji agenta. Importuj z `plugin-sdk/test-fixtures`                                                |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sprawdzaj i resetuj dane testowe zdarzeń systemowych. Importuj z `plugin-sdk/test-fixtures`                                              |
| `sanitizeTerminalText`                               | Oczyszczaj dane wyjściowe terminala na potrzeby asercji. Importuj z `plugin-sdk/test-fixtures`                                           |
| `countLines` / `hasBalancedFences`                   | Weryfikuj strukturę danych wyjściowych dzielenia na fragmenty. Importuj z `plugin-sdk/test-fixtures`                                    |
| `typedCases`                                         | Zachowuj typy literałowe w testach sterowanych tabelami. Importuj z `plugin-sdk/test-fixtures`                                           |

Zestawy testów kontraktowych dołączonych Pluginów również używają tych podścieżek testowych SDK dla
pomocniczych atrap rejestru, manifestu, publicznych artefaktów i środowiska uruchomieniowego przeznaczonych wyłącznie do testów.
Zestawy przeznaczone wyłącznie dla rdzenia, które zależą od dołączonego zestawu składników OpenClaw, pozostają natomiast w
`src/plugins/contracts`.

### Typy

Wyspecjalizowane podścieżki testowe również ponownie eksportują typy przydatne w plikach testowych:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Testowanie rozpoznawania celu

Użyj `installCommonResolveTargetErrorCases`, aby dodać standardowe przypadki błędów dotyczące
rozpoznawania celu kanału:

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

Testy jednostkowe, które przekazują ręcznie napisaną atrapę `api` do `register(api)`, nie
sprawdzają bramek akceptacji mechanizmu ładującego OpenClaw. Dodaj co najmniej jeden test dymny
oparty na rzeczywistym mechanizmie ładującym dla każdej powierzchni rejestracji, od której zależy Twój Plugin, szczególnie
haków i wyłącznych możliwości, takich jak pamięć.

Rzeczywisty mechanizm ładujący odrzuca rejestrację Pluginu, gdy brakuje wymaganych metadanych lub
Plugin wywołuje API możliwości, której nie jest właścicielem. Na przykład
`api.registerHook(...)` wymaga nazwy haka, a
`api.registerMemoryCapability(...)` wymaga, aby manifest Pluginu lub eksportowany
punkt wejścia deklarował `kind: "memory"`.

### Testowanie dostępu do konfiguracji środowiska uruchomieniowego

Preferuj współdzieloną atrapę środowiska uruchomieniowego Pluginu z `openclaw/plugin-sdk/plugin-test-runtime`.
Jej atrapy `runtime.config.loadConfig()` i `runtime.config.writeConfigFile(...)`
domyślnie zgłaszają wyjątek, dzięki czemu testy wykrywają nowe użycia przestarzałych interfejsów API
zgodności. Nadpisuj te atrapy tylko wtedy, gdy test jawnie obejmuje starsze
zachowanie zgodności.

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

### Tworzenie atrapy środowiska uruchomieniowego Pluginu

W przypadku kodu używającego `createPluginRuntimeStore` utwórz atrapę środowiska uruchomieniowego w testach:

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

### Testowanie z atrapami dla poszczególnych instancji

Preferuj atrapy dla poszczególnych instancji zamiast modyfikowania prototypu:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testy kontraktowe (Pluginy w repozytorium)

Dołączone Pluginy mają testy kontraktowe weryfikujące własność rejestracji:

```bash
pnpm test src/plugins/contracts/
```

Te testy sprawdzają:

- Które Pluginy rejestrują poszczególnych dostawców
- Które Pluginy rejestrują poszczególnych dostawców mowy
- Poprawność struktury rejestracji
- Zgodność z kontraktem środowiska uruchomieniowego

### Uruchamianie testów o ograniczonym zakresie

Dla konkretnego Pluginu:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Tylko dla testów kontraktowych:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Egzekwowanie reguł lintowania (Pluginy w repozytorium)

`scripts/run-additional-boundary-checks.mjs` uruchamia w CI zestaw kontroli granic importów
`lint:plugins:*`; każdą z nich można również uruchomić niezależnie lokalnie:

| Polecenie                                                      | Egzekwuje                                                                                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Dołączone Pluginy nie mogą importować monolitycznego głównego pliku zbiorczego `openclaw/plugin-sdk`.                        |
| `pnpm run lint:plugins:no-extension-src-imports`               | Pliki produkcyjne rozszerzeń nie mogą bezpośrednio importować drzewa `src/**` repozytorium (`../../src/...`).                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Pliki testowe rozszerzeń nie mogą importować `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` ani innych pomocników testowych przeznaczonych wyłącznie dla rdzenia. |

Zewnętrzne Pluginy nie podlegają tym regułom lintowania, ale zaleca się stosowanie tych samych
wzorców.

## Konfiguracja testów

OpenClaw używa Vitest 4 z informacyjnym raportowaniem pokrycia V8. W przypadku testów Pluginów:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Jeśli lokalne uruchomienia powodują presję na pamięć:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Powiązane materiały

- [Omówienie SDK](/pl/plugins/sdk-overview) -- konwencje importowania
- [Pluginy kanałów SDK](/pl/plugins/sdk-channel-plugins) -- interfejs Pluginu kanału
- [Pluginy dostawców SDK](/pl/plugins/sdk-provider-plugins) -- haki Pluginu dostawcy
- [Tworzenie Pluginów](/pl/plugins/building-plugins) -- przewodnik wprowadzający
