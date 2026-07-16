---
read_when:
    - Pisanie testów dla pluginu
    - Potrzebne są narzędzia testowe z zestawu SDK Pluginu
    - Chcesz zrozumieć testy kontraktowe dla wbudowanych pluginów
sidebarTitle: Testing
summary: Narzędzia i wzorce testowania Pluginów OpenClaw
title: Testowanie Pluginu
x-i18n:
    generated_at: "2026-07-16T18:50:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Dokumentacja narzędzi testowych, wzorców i wymuszania reguł lintowania dla pluginów
OpenClaw.

<Tip>
  **Szukasz przykładów testów?** Przewodniki zawierają kompletne przykłady testów:
  [Testy pluginów kanałów](/pl/plugins/sdk-channel-plugins#step-6-test) oraz
  [Testy pluginów dostawców](/pl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Narzędzia testowe

Te ścieżki podrzędne są lokalnymi punktami wejścia kodu źródłowego repozytorium
dla testów własnych, dołączonych pluginów OpenClaw. Nie są publikowanymi eksportami
`package.json` przeznaczonymi dla pluginów innych firm i mogą importować
Vitest lub inne zależności testowe dostępne wyłącznie w repozytorium.

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

Należy używać tych wyspecjalizowanych ścieżek podrzędnych do testów dołączonych
pluginów. Poprzedni moduł zbiorczy `openclaw/plugin-sdk/testing` był lokalny dla repozytorium,
wykluczony z dystrybuowanych pakietów i został usunięty. Starszy alias
`openclaw/plugin-sdk/test-utils` pozostaje lokalny dla repozytorium; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) odrzuca nowe importy tego aliasu
w testach rozszerzeń.

### Dostępne eksporty

| Eksport                                              | Przeznaczenie                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Tworzy minimalną atrapę API pluginu do testów jednostkowych bezpośredniej rejestracji. Import z `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Współdzielona testowa implementacja kontraktu profilu uwierzytelniania dla natywnych adapterów środowiska wykonawczego agenta. Import z `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Współdzielona testowa implementacja kontraktu pomijania dostarczania dla natywnych adapterów środowiska wykonawczego agenta. Import z `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Współdzielona testowa implementacja kontraktu klasyfikacji mechanizmu rezerwowego dla natywnych adapterów środowiska wykonawczego agenta. Import z `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Tworzy testowe schematy narzędzi dynamicznych do testów kontraktu natywnego środowiska wykonawczego. Import z `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Sprawdza strukturę kontekstu przychodzącego kanału. Import z `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Instaluje przypadki kontraktu wychodzących ładunków kanału. Import z `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Tworzy konteksty cyklu życia konta kanału. Import z `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Instaluje ogólne przypadki kontraktu działań na wiadomościach kanału. Import z `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Instaluje ogólne przypadki kontraktu konfiguracji kanału. Import z `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Instaluje ogólne przypadki kontraktu stanu kanału. Import z `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Sprawdza identyfikatory katalogu kanału zwracane przez funkcję wyświetlającą listę katalogu. Import z `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Sprawdza, czy punkty wejścia dołączonych kanałów udostępniają oczekiwany kontrakt publiczny. Import z `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Formatuje deterministyczne znaczniki czasu kopert. Import z `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Sprawdza tekst odpowiedzi parowania kanału i wyodrębnia z niego kod. Import z `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Instaluje kontrole kontraktu rejestracji pluginu. Import z `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Rejestruje jeden plugin dostawcy w testach dymnych modułu ładującego. Import z `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Przechwytuje wszystkie rodzaje dostawców z jednego pluginu. Import z `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Przechwytuje rejestracje dostawców z wielu pluginów. Import z `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Sprawdza, czy kolekcja dostawców zawiera identyfikator. Import z `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Tworzy symulowane środowisko wykonawcze CLI/pluginu. Import z `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Tworzy symulowany interfejs środowiska wykonawczego pluginu. Import z `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Tworzy funkcje pomocnicze stanu konfiguracji pluginów kanałów. Import z `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Tworzy symulowany obiekt wyświetlający monity kreatora konfiguracji. Import z `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Tworzy odizolowany stan przepływu zadań środowiska wykonawczego. Import z `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Wykonuje hak katalogu dostawcy z zależnościami testowymi. Import z `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Rozpoznaje wybory kreatora konfiguracji dostawcy w testach kontraktu. Import z `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Rozpoznaje pozycje selektora modeli dostawcy w testach kontraktu. Import z `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Tworzy identyfikatory wyborów kreatora dostawcy na potrzeby asercji. Import z `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Wstrzykuje dostawców kreatora dostawcy na potrzeby odizolowanych testów. Import z `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Instaluje kontrole kontraktu środowiska wykonawczego rodziny dostawców. Import z `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Sprawdza, czy zasady odtwarzania dostawcy są przekazywane przez narzędzia i metadane należące do dostawcy. Import z `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Uruchamia test działającego w czasie rzeczywistym dostawcy STT na żywo ze współdzielonymi testowymi plikami audio. Import z `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normalizuje wynik transkrypcji na żywo przed przybliżonymi asercjami. Import z `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Sprawdza, czy dostawcy wideo deklarują jawne możliwości trybu generowania. Import z `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Sprawdza, czy dostawcy muzyki deklarują jawne możliwości generowania i edycji. Import z `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Instaluje pomyślną odpowiedź zadania wideo zgodnego z DashScope. Import z `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Zapewnia dostęp do opcjonalnych atrap HTTP/uwierzytelniania dostawcy w Vitest. Import z `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Resetuje atrapy HTTP/uwierzytelniania dostawcy po każdym teście. Import z `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Współdzielone przypadki testowe obsługi błędów rozpoznawania celu. Import z `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Sprawdza, czy kanał powinien dodać reakcję potwierdzenia. Import z `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Usuwa reakcję potwierdzenia po dostarczeniu odpowiedzi. Import z `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Tworzy testową implementację rejestru pluginu kanału. Import z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Tworzy testową implementację pustego rejestru pluginów. Import z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Instaluje testową implementację rejestru na potrzeby testów środowiska wykonawczego pluginu. Import z `plugin-sdk/plugin-test-runtime` lub `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Przechwytuje żądania pobierania JSON w testach funkcji pomocniczych multimediów. Import z `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Uruchamia testy względem jednorazowego lokalnego serwera HTTP. Import z `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Tworzy minimalny obiekt przychodzącego żądania HTTP. Import z `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Uruchamia testy pobierania z zainstalowanymi hakami wstępnego połączenia. Import z `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Tymczasowo modyfikuje zmienne środowiskowe. Import z `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Tworzy odizolowane testowe implementacje systemu plików. Import z `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Tworzy minimalną atrapę odpowiedzi serwera HTTP. Import z `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Tworzy testowe implementacje pobierania danych o użyciu dostawcy. Import z `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Zamraża i przywraca zegary na potrzeby testów zależnych od czasu. Import z `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Przechwytuje dane wyjściowe środowiska wykonawczego CLI w testach. Import z `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Importuje moduł ESM ze świeżym tokenem zapytania, aby ominąć pamięć podręczną modułów. Import z `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Rozpoznaje ścieżki do testowych plików źródłowych lub dystrybucyjnych dołączonego pluginu. Import z `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Instaluje ściśle ograniczone atrapy wbudowanych modułów Node w Vitest. Import z `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Tworzy konteksty testowe piaskownicy. Import z `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Zapisuje testowe implementacje umiejętności. Import z `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Tworzy testowe wiadomości transkrypcji agenta. Import z `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Sprawdza i resetuje testowe zdarzenia systemowe. Import z `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Oczyszcza dane wyjściowe terminala na potrzeby asercji. Import z `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Sprawdza strukturę wyniku dzielenia na fragmenty. Import z `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Zachowuje typy literałowe na potrzeby testów opartych na tabelach. Import z `plugin-sdk/test-fixtures`                                                    |

Zestawy testów kontraktów dołączonych pluginów używają również tych podścieżek testowych SDK jako
funkcji pomocniczych rejestru, manifestu, artefaktów publicznych i testowych implementacji środowiska wykonawczego przeznaczonych wyłącznie do testów.
Zestawy przeznaczone wyłącznie dla rdzenia, które zależą od spisu dołączonych składników OpenClaw, pozostają natomiast w
`src/plugins/contracts`.

### Typy

Podścieżki przeznaczone do ukierunkowanego testowania również ponownie eksportują typy przydatne w plikach testowych:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Testowanie rozpoznawania celu

Użyj `installCommonResolveTargetErrorCases`, aby dodać standardowe przypadki błędów
rozpoznawania celu kanału:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("rozpoznawanie celu my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logika rozpoznawania celu kanału
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Dodaj przypadki testowe specyficzne dla kanału
  it("powinien rozpoznawać cele @username", () => {
    // ...
  });
});
```

## Wzorce testowania

### Testowanie kontraktów rejestracji

Testy jednostkowe, które przekazują ręcznie napisany mock `api` do `register(api)`, nie
sprawdzają mechanizmów akceptacji modułu ładującego OpenClaw. Dodaj co najmniej jeden test dymny
korzystający z modułu ładującego dla każdej powierzchni rejestracji, od której zależy plugin, zwłaszcza
hooków i wyłącznych możliwości, takich jak pamięć.

Rzeczywisty moduł ładujący odrzuca rejestrację pluginu, gdy brakuje wymaganych metadanych lub
plugin wywołuje API możliwości, której nie jest właścicielem. Na przykład
`api.registerHook(...)` wymaga nazwy hooka, a
`api.registerMemoryCapability(...)` wymaga, aby manifest pluginu lub eksportowany
punkt wejścia deklarował `kind: "memory"`.

### Testowanie dostępu do konfiguracji środowiska uruchomieniowego

Preferuj współdzielony mock środowiska uruchomieniowego pluginu z `openclaw/plugin-sdk/plugin-test-runtime`.
Jego mocki `runtime.config.loadConfig()` i `runtime.config.writeConfigFile(...)`
domyślnie zgłaszają wyjątki, dzięki czemu testy wykrywają nowe użycia przestarzałych API
zgodności. Zastępuj te mocki tylko wtedy, gdy test jawnie obejmuje starsze
zachowanie zgodności.

### Testowanie jednostkowe pluginu kanału

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
  it("powinien rozpoznawać konto z konfiguracji", () => {
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

  it("powinien sprawdzać konto bez materializowania sekretów", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Wartość tokenu nie jest ujawniana
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Testowanie jednostkowe pluginu dostawcy

```typescript
import { describe, it, expect } from "vitest";

describe("plugin my-provider", () => {
  it("powinien rozpoznawać modele dynamiczne", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... kontekst
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("powinien zwracać katalog, gdy klucz API jest dostępny", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... kontekst
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mockowanie środowiska uruchomieniowego pluginu

W przypadku kodu korzystającego z `createPluginRuntimeStore` zamockuj środowisko uruchomieniowe w testach:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// W konfiguracji testu
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... inne mocki
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... inne przestrzenie nazw
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Po testach
store.clearRuntime();
```

### Testowanie za pomocą atrap dla poszczególnych instancji

Preferuj atrapy dla poszczególnych instancji zamiast modyfikowania prototypu:

```typescript
// Preferowane: atrapa dla instancji
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Unikaj: modyfikowanie prototypu
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testy kontraktowe (pluginy w repozytorium)

Dołączone pluginy mają testy kontraktowe weryfikujące własność rejestracji:

```bash
pnpm test src/plugins/contracts/
```

Te testy sprawdzają:

- Które pluginy rejestrują poszczególnych dostawców
- Które pluginy rejestrują poszczególnych dostawców mowy
- Poprawność struktury rejestracji
- Zgodność z kontraktem środowiska uruchomieniowego

### Uruchamianie testów o ograniczonym zakresie

Dla określonego pluginu:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Tylko dla testów kontraktowych:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Egzekwowanie reguł lintowania (pluginy w repozytorium)

`scripts/run-additional-boundary-checks.mjs` uruchamia w CI zestaw kontroli granic importów
`lint:plugins:*`; każdą z nich można również uruchomić samodzielnie lokalnie:

| Polecenie                                                      | Egzekwuje                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Dołączone pluginy nie mogą importować monolitycznego głównego modułu zbiorczego `openclaw/plugin-sdk`. |
| `pnpm run lint:plugins:no-extension-src-imports`               | Pliki produkcyjne rozszerzeń nie mogą bezpośrednio importować drzewa `src/**` repozytorium (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Pliki testowe rozszerzeń nie mogą importować `plugin-sdk/test-utils` ani innych pomocników testowych przeznaczonych wyłącznie dla rdzenia. |

Zewnętrzne pluginy nie podlegają tym regułom lintowania, ale zaleca się stosowanie tych samych
wzorców.

## Konfiguracja testów

OpenClaw używa Vitest 4 z informacyjnym raportowaniem pokrycia V8. W przypadku testów pluginów:

```bash
# Uruchom wszystkie testy
pnpm test

# Uruchom testy określonego pluginu
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Uruchom z określonym filtrem nazwy testu
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Uruchom z pomiarem pokrycia
pnpm test:coverage
```

Jeśli lokalne uruchomienia powodują presję na pamięć:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Powiązane

- [Omówienie SDK](/pl/plugins/sdk-overview) -- konwencje importowania
- [Pluginy kanałów SDK](/pl/plugins/sdk-channel-plugins) -- interfejs pluginu kanału
- [Pluginy dostawców SDK](/pl/plugins/sdk-provider-plugins) -- hooki pluginu dostawcy
- [Tworzenie pluginów](/pl/plugins/building-plugins) -- przewodnik wprowadzający
