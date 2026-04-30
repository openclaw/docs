---
read_when:
    - Piszesz testy dla Plugin
    - Potrzebujesz narzędzi testowych z SDK Plugin
    - Chcesz zrozumieć testy kontraktowe dla dołączonych Pluginów
sidebarTitle: Testing
summary: Narzędzia i wzorce testowania pluginów OpenClaw
title: Testowanie Plugin
x-i18n:
    generated_at: "2026-04-30T10:11:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Dokumentacja narzędzi testowych, wzorców i wymuszania lintingu dla pluginów OpenClaw.

<Tip>
  **Szukasz przykładów testów?** Przewodniki how-to zawierają opracowane przykłady testów:
  [Testy pluginów kanałów](/pl/plugins/sdk-channel-plugins#step-6-test) oraz
  [Testy pluginów providerów](/pl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Narzędzia testowe

**Import mocka API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Import kontraktu środowiska uruchomieniowego agenta:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import kontraktu kanału:** `openclaw/plugin-sdk/channel-contract-testing`

**Import pomocnika testowego kanału:** `openclaw/plugin-sdk/channel-test-helpers`

**Import testów celu kanału:** `openclaw/plugin-sdk/channel-target-testing`

**Import kontraktu Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import testów środowiska uruchomieniowego Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import kontraktu providera:** `openclaw/plugin-sdk/provider-test-contracts`

**Import mocka HTTP providera:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import testów środowiska/sieci:** `openclaw/plugin-sdk/test-env`

**Import ogólnej fixtury:** `openclaw/plugin-sdk/test-fixtures`

**Import mocka wbudowanego modułu Node:** `openclaw/plugin-sdk/test-node-mocks`

W nowych testach pluginów preferuj wyspecjalizowane podścieżki poniżej. Szeroki barrel
`openclaw/plugin-sdk/testing` służy wyłącznie do zgodności ze starszym kodem.
Zabezpieczenia repozytorium odrzucają nowe rzeczywiste importy z `plugin-sdk/testing` i
`plugin-sdk/test-utils`; te nazwy pozostają wyłącznie jako przestarzałe powierzchnie zgodności
dla zewnętrznych pluginów oraz testów zapisów zgodności.

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

| Eksport                                               | Cel                                                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Buduje minimalną atrapę API Plugin do bezpośrednich testów jednostkowych rejestracji. Import z `plugin-sdk/plugin-test-api`                 |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Wspólna fixture kontraktu profilu uwierzytelniania dla natywnych adapterów runtime agenta. Import z `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Wspólna fixture kontraktu tłumienia dostarczania dla natywnych adapterów runtime agenta. Import z `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Wspólna fixture kontraktu klasyfikacji fallback dla natywnych adapterów runtime agenta. Import z `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Buduje fixture schematu narzędzi dynamicznych dla testów kontraktu natywnego runtime. Import z `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Sprawdza kształt kontekstu przychodzącego kanału. Import z `plugin-sdk/channel-contract-testing` |
| `installChannelOutboundPayloadContractSuite`         | Instaluje przypadki kontraktu ładunku wychodzącego kanału. Import z `plugin-sdk/channel-contract-testing` |
| `createStartAccountContext`                          | Buduje konteksty cyklu życia konta kanału. Import z `plugin-sdk/channel-test-helpers` |
| `installChannelActionsContractSuite`                 | Instaluje ogólne przypadki kontraktu akcji wiadomości kanału. Import z `plugin-sdk/channel-test-helpers` |
| `installChannelSetupContractSuite`                   | Instaluje ogólne przypadki kontraktu konfiguracji kanału. Import z `plugin-sdk/channel-test-helpers` |
| `installChannelStatusContractSuite`                  | Instaluje ogólne przypadki kontraktu statusu kanału. Import z `plugin-sdk/channel-test-helpers` |
| `expectDirectoryIds`                                 | Sprawdza identyfikatory katalogu kanału z funkcji listy katalogów. Import z `plugin-sdk/channel-test-helpers` |
| `assertBundledChannelEntries`                        | Sprawdza, czy dołączone punkty wejścia kanału udostępniają oczekiwany publiczny kontrakt. Import z `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Formatuje deterministyczne znaczniki czasu koperty. Import z `plugin-sdk/channel-test-helpers` |
| `expectPairingReplyText`                             | Sprawdza tekst odpowiedzi parowania kanału i wyodrębnia jego kod. Import z `plugin-sdk/channel-test-helpers` |
| `describePluginRegistrationContract`                 | Instaluje sprawdzenia kontraktu rejestracji Plugin. Import z `plugin-sdk/plugin-test-contracts` |
| `registerSingleProviderPlugin`                       | Rejestruje jeden Plugin dostawcy w testach smoke loadera. Import z `plugin-sdk/plugin-test-runtime` |
| `registerProviderPlugin`                             | Przechwytuje wszystkie rodzaje dostawców z jednego Plugin. Import z `plugin-sdk/plugin-test-runtime` |
| `registerProviderPlugins`                            | Przechwytuje rejestracje dostawców w wielu Plugin. Import z `plugin-sdk/plugin-test-runtime` |
| `requireRegisteredProvider`                          | Sprawdza, czy kolekcja dostawców zawiera identyfikator. Import z `plugin-sdk/plugin-test-runtime` |
| `createRuntimeEnv`                                   | Buduje zamockowane środowisko runtime CLI/Plugin. Import z `plugin-sdk/plugin-test-runtime` |
| `createPluginSetupWizardStatus`                      | Buduje pomocnicze elementy statusu konfiguracji dla kanałów Plugin. Import z `plugin-sdk/plugin-test-runtime` |
| `describeOpenAIProviderRuntimeContract`              | Instaluje sprawdzenia kontraktu runtime rodziny dostawców. Import z `plugin-sdk/provider-test-contracts` |
| `expectPassthroughReplayPolicy`                      | Sprawdza, czy zasady odtwarzania dostawcy przepuszczają narzędzia i metadane należące do dostawcy. Import z `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Uruchamia test live dostawcy STT w czasie rzeczywistym ze wspólnymi fixture audio. Import z `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | Normalizuje wynik transkrypcji live przed rozmytymi asercjami. Import z `plugin-sdk/provider-test-contracts` |
| `expectExplicitVideoGenerationCapabilities`          | Sprawdza, czy dostawcy wideo deklarują jawne możliwości trybu generowania. Import z `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities`          | Sprawdza, czy dostawcy muzyki deklarują jawne możliwości generowania/edycji. Import z `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Instaluje pomyślną odpowiedź zadania wideo zgodnego z DashScope. Import z `plugin-sdk/provider-test-contracts` |
| `getProviderHttpMocks`                               | Udostępnia opcjonalne mocki HTTP/auth Vitest dostawcy. Import z `plugin-sdk/provider-http-test-mocks` |
| `installProviderHttpMockCleanup`                     | Resetuje mocki HTTP/auth dostawcy po każdym teście. Import z `plugin-sdk/provider-http-test-mocks` |
| `installCommonResolveTargetErrorCases`               | Wspólne przypadki testowe obsługi błędów rozwiązywania celu. Import z `plugin-sdk/channel-target-testing` |
| `shouldAckReaction`                                  | Sprawdza, czy kanał powinien dodać reakcję potwierdzenia. Import z `plugin-sdk/channel-feedback` |
| `removeAckReactionAfterReply`                        | Usuwa reakcję potwierdzenia po dostarczeniu odpowiedzi. Import z `plugin-sdk/channel-feedback` |
| `createTestRegistry`                                 | Buduje fixture rejestru Plugin kanału. Import z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers` |
| `createEmptyPluginRegistry`                          | Buduje fixture pustego rejestru Plugin. Import z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers` |
| `setActivePluginRegistry`                            | Instaluje fixture rejestru dla testów runtime Plugin. Import z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Przechwytuje żądania pobierania JSON w testach pomocników multimediów. Import z `plugin-sdk/test-env` |
| `withServer`                                         | Uruchamia testy względem jednorazowego lokalnego serwera HTTP. Import z `plugin-sdk/test-env` |
| `createMockIncomingRequest`                          | Buduje minimalny obiekt przychodzącego żądania HTTP. Import z `plugin-sdk/test-env` |
| `withFetchPreconnect`                                | Uruchamia testy fetch z zainstalowanymi hookami preconnect. Import z `plugin-sdk/test-env` |
| `withEnv` / `withEnvAsync`                           | Tymczasowo modyfikuje zmienne środowiskowe. Import z `plugin-sdk/test-env` |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Tworzy izolowane fixture testowe systemu plików. Import z `plugin-sdk/test-env` |
| `createMockServerResponse`                           | Tworzy minimalną atrapę odpowiedzi serwera HTTP. Import z `plugin-sdk/test-env` |
| `createCliRuntimeCapture`                            | Przechwytuje wyjście runtime CLI w testach. Import z `plugin-sdk/test-fixtures` |
| `importFreshModule`                                  | Importuje moduł ESM ze świeżym tokenem zapytania, aby ominąć pamięć podręczną modułów. Import z `plugin-sdk/test-fixtures` |
| `bundledPluginRoot` / `bundledPluginFile`            | Rozwiązuje ścieżki źródeł lub fixture dist dołączonego Plugin. Import z `plugin-sdk/test-fixtures` |
| `mockNodeBuiltinModule`                              | Instaluje wąskie mocki Vitest wbudowanych modułów Node. Import z `plugin-sdk/test-node-mocks` |
| `createSandboxTestContext`                           | Buduje konteksty testowe piaskownicy. Import z `plugin-sdk/test-fixtures` |
| `writeSkill`                                         | Zapisuje fixture Skills. Import z `plugin-sdk/test-fixtures` |
| `makeAgentAssistantMessage`                          | Buduje fixture wiadomości transkryptu agenta. Import z `plugin-sdk/test-fixtures` |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sprawdza i resetuje fixture zdarzeń systemowych. Import z `plugin-sdk/test-fixtures` |
| `sanitizeTerminalText`                               | Oczyszcza wyjście terminala na potrzeby asercji. Import z `plugin-sdk/test-fixtures` |
| `countLines` / `hasBalancedFences`                   | Sprawdza kształt wyniku dzielenia na fragmenty. Import z `plugin-sdk/test-fixtures` |
| `runProviderCatalog`                                 | Wykonuje hook katalogu dostawcy z zależnościami testowymi |
| `resolveProviderWizardOptions`                       | Rozwiązuje wybory kreatora konfiguracji dostawcy w testach kontraktu |
| `resolveProviderModelPickerEntries`                  | Rozwiązuje pozycje selektora modeli dostawcy w testach kontraktu |
| `buildProviderPluginMethodChoice`                    | Buduje identyfikatory wyborów kreatora dostawcy na potrzeby asercji |
| `setProviderWizardProvidersResolverForTest`          | Wstrzykuje dostawców kreatora dostawcy dla izolowanych testów |
| `createProviderUsageFetch`                           | Twórz fikstury pobierania użycia dostawcy                                                                                                |
| `useFrozenTime` / `useRealTime`                      | Zamrażaj i przywracaj timery dla testów zależnych od czasu. Importuj z `plugin-sdk/test-env`                                             |
| `createTestWizardPrompter`                           | Twórz zamockowany prompter kreatora konfiguracji                                                                                         |
| `createRuntimeTaskFlow`                              | Twórz izolowany stan przepływu zadań środowiska uruchomieniowego                                                                         |
| `typedCases`                                         | Zachowuj typy literałowe dla testów opartych na tabelach. Importuj z `plugin-sdk/test-fixtures`                                          |

Zestawy kontraktowe dołączonych pluginów używają także podścieżek testowych SDK dla pomocników fikstur wyłącznie do testów dla rejestru, manifestu, publicznych artefaktów i środowiska uruchomieniowego. Zestawy wyłącznie rdzeniowe, które zależą od dołączonego inwentarza OpenClaw, pozostają w `src/plugins/contracts`. W nowych testach rozszerzeń używaj udokumentowanej, ukierunkowanej podścieżki SDK, takiej jak `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures`, zamiast importować bezpośrednio szeroki plik agregujący zgodności `plugin-sdk/testing`, pliki repozytorium `src/**` albo mostki repozytorium `test/helpers/*`.

### Typy

Ukierunkowane podścieżki testowe ponownie eksportują także typy przydatne w plikach testowych:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Testowanie rozwiązywania celu

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

Testy jednostkowe, które przekazują ręcznie napisaną atrapę `api` do `register(api)`, nie sprawdzają warunków akceptacji mechanizmu ładującego OpenClaw. Dodaj co najmniej jeden test dymny oparty na mechanizmie ładującym dla każdej powierzchni rejestracji, od której zależy Twój plugin, zwłaszcza dla haków i wyłącznych możliwości, takich jak pamięć.

Rzeczywisty mechanizm ładujący kończy rejestrację pluginu niepowodzeniem, gdy brakuje wymaganych metadanych albo plugin wywołuje API możliwości, której nie jest właścicielem. Na przykład `api.registerHook(...)` wymaga nazwy haka, a `api.registerMemoryCapability(...)` wymaga, aby manifest pluginu albo eksportowany wpis deklarował `kind: "memory"`.

### Testowanie dostępu do konfiguracji środowiska uruchomieniowego

Podczas testowania dołączonych pluginów kanałów preferuj współdzieloną atrapę środowiska uruchomieniowego pluginu z `openclaw/plugin-sdk/channel-test-helpers`. Jej przestarzałe atrapy `runtime.config.loadConfig()` i `runtime.config.writeConfigFile(...)` domyślnie zgłaszają wyjątek, dzięki czemu testy wychwytują nowe użycie API zgodności. Nadpisuj te atrapy tylko wtedy, gdy test jawnie obejmuje starsze zachowanie zgodności.

### Testowanie jednostkowe pluginu kanałowego

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

### Tworzenie atrap środowiska uruchomieniowego pluginu

Dla kodu, który używa `createPluginRuntimeStore`, stosuj atrapę środowiska uruchomieniowego w testach:

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

### Testowanie z zaślepkami na instancję

Preferuj zaślepki na poziomie instancji zamiast mutacji prototypu:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testy kontraktowe (pluginy w repozytorium)

Dołączone pluginy mają testy kontraktowe weryfikujące własność rejestracji:

```bash
pnpm test -- src/plugins/contracts/
```

Te testy sprawdzają:

- Które pluginy rejestrują których dostawców
- Które pluginy rejestrują których dostawców mowy
- Poprawność struktury rejestracji
- Zgodność z kontraktem środowiska uruchomieniowego

### Uruchamianie testów o ograniczonym zakresie

Dla konkretnego pluginu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Tylko dla testów kontraktowych:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Egzekwowanie lintingu (pluginy w repozytorium)

W przypadku pluginów w repozytorium `pnpm check` wymusza trzy reguły:

1. **Bez monolitycznych importów z głównego modułu** -- główny plik agregujący `openclaw/plugin-sdk` jest odrzucany
2. **Bez bezpośrednich importów z `src/`** -- pluginy nie mogą importować bezpośrednio z `../../src/`
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

Jeśli lokalne uruchomienia powodują nadmierne obciążenie pamięci:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Powiązane

- [Omówienie SDK](/pl/plugins/sdk-overview) -- konwencje importu
- [Pluginy kanałowe SDK](/pl/plugins/sdk-channel-plugins) -- interfejs pluginu kanałowego
- [Pluginy dostawców SDK](/pl/plugins/sdk-provider-plugins) -- haki pluginu dostawcy
- [Budowanie pluginów](/pl/plugins/building-plugins) -- przewodnik rozpoczynający pracę
