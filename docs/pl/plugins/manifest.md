---
read_when:
    - Tworzysz plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji pluginu lub debugować błędy walidacji pluginu
summary: Manifest pluginu + wymagania schematu JSON (ścisła walidacja konfiguracji)
title: Manifest pluginu
x-i18n:
    generated_at: "2026-04-22T04:24:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest pluginu (`openclaw.plugin.json`)

Ta strona dotyczy tylko **natywnego manifestu pluginu OpenClaw**.

Informacje o zgodnych układach bundli znajdziesz w [Bundlach pluginów](/pl/plugins/bundles).

Zgodne formaty bundli używają innych plików manifestu:

- Bundel Codex: `.codex-plugin/plugin.json`
- Bundel Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentów Claude
  bez manifestu
- Bundel Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa również te układy bundli, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

Dla zgodnych bundli OpenClaw obecnie odczytuje metadane bundla oraz zadeklarowane
katalogi główne skilli, katalogi główne poleceń Claude, domyślne wartości `settings.json` bundla Claude,
domyślne wartości LSP bundla Claude oraz obsługiwane zestawy hooków, gdy układ pasuje do
oczekiwań runtime OpenClaw.

Każdy natywny plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym pluginu**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu pluginu**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy pluginu i blokują walidację konfiguracji.

Pełny przewodnik po systemie pluginów znajdziesz tutaj: [Pluginy](/pl/tools/plugin).
Informacje o natywnym modelu możliwości i aktualnych wskazówkach zgodności zewnętrznej:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje przed załadowaniem
kodu twojego pluginu.

Używaj go do:

- tożsamości pluginu
- walidacji konfiguracji
- metadanych uwierzytelniania i onboardingu, które powinny być dostępne bez uruchamiania runtime pluginu
- tanich wskazówek aktywacji, które powierzchnie control-plane mogą sprawdzać przed załadowaniem runtime
- tanich deskryptorów konfiguracji, które powierzchnie konfiguracji/onboardingu mogą sprawdzać przed załadowaniem runtime
- metadanych aliasów i automatycznego włączania, które powinny być rozwiązywane przed załadowaniem runtime pluginu
- skróconych metadanych własności rodziny modeli, które powinny automatycznie aktywować
  plugin przed załadowaniem runtime
- statycznych migawek własności możliwości używanych do dołączonego okablowania zgodności i pokrycia kontraktów
- tanich metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzać
  przed załadowaniem runtime pluginu
- metadanych konfiguracji specyficznych dla kanału, które powinny scalać się z katalogiem i powierzchniami walidacji
  bez ładowania runtime
- wskazówek dla UI konfiguracji

Nie używaj go do:

- rejestrowania zachowania runtime
- deklarowania punktów wejścia kodu
- metadanych instalacji npm

To należy do kodu twojego pluginu i `package.json`.

## Minimalny przykład

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Rozbudowany przykład

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin dostawcy OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Klucz API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Klucz API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Klucz API",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Dokumentacja pól najwyższego poziomu

| Pole                                | Wymagane | Typ                              | Znaczenie                                                                                                                                                                                                  |
| ----------------------------------- | -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Tak      | `string`                         | Kanoniczny identyfikator pluginu. To jest identyfikator używany w `plugins.entries.<id>`.                                                                                                                |
| `configSchema`                      | Tak      | `object`                         | Wbudowany JSON Schema dla konfiguracji tego pluginu.                                                                                                                                                      |
| `enabledByDefault`                  | Nie      | `true`                           | Oznacza dołączony plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić plugin domyślnie wyłączony.                                                  |
| `legacyPluginIds`                   | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                        |
| `autoEnableWhenConfiguredProviders` | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączyć ten plugin, gdy uwierzytelnianie, konfiguracja lub referencje modeli się do nich odwołują.                                               |
| `kind`                              | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj pluginu używany przez `plugins.slots.*`.                                                                                                                                        |
| `channels`                          | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                       |
| `providers`                         | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                                      |
| `modelSupport`                      | Nie      | `object`                         | Skrócone metadane rodziny modeli zarządzane przez manifest, używane do automatycznego załadowania pluginu przed runtime.                                                                                |
| `providerEndpoints`                 | Nie      | `object[]`                       | Metadane hostów/baseUrl punktów końcowych zarządzane przez manifest dla tras dostawcy, które core musi sklasyfikować przed załadowaniem runtime dostawcy.                                              |
| `cliBackends`                       | Nie      | `string[]`                       | Identyfikatory backendów wnioskowania CLI należących do tego pluginu. Używane do automatycznej aktywacji przy starcie na podstawie jawnych odwołań w konfiguracji.                                      |
| `syntheticAuthRefs`                 | Nie      | `string[]`                       | Referencje dostawcy lub backendu CLI, których zarządzany przez plugin hook syntetycznego uwierzytelniania powinien zostać sprawdzony podczas zimnego wykrywania modeli przed załadowaniem runtime.     |
| `nonSecretAuthMarkers`              | Nie      | `string[]`                       | Wartości-zastępniki kluczy API należące do dołączonego pluginu, które reprezentują niesekretne lokalne, OAuth lub ambientne stany danych uwierzytelniających.                                          |
| `commandAliases`                    | Nie      | `object[]`                       | Nazwy poleceń należące do tego pluginu, które powinny generować diagnostykę konfiguracji i CLI świadomą pluginu przed załadowaniem runtime.                                                              |
| `providerAuthEnvVars`               | Nie      | `Record<string, string[]>`       | Tanie metadane env uwierzytelniania dostawcy, które OpenClaw może sprawdzać bez ładowania kodu pluginu.                                                                                                  |
| `providerAuthAliases`               | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca coding, który współdzieli klucz API i profile auth bazowego dostawcy. |
| `channelEnvVars`                    | Nie      | `Record<string, string[]>`       | Tanie metadane env kanału, które OpenClaw może sprawdzać bez ładowania kodu pluginu. Używaj tego dla konfiguracji kanałów lub powierzchni uwierzytelniania sterowanych przez env, które powinny być widoczne dla ogólnych helperów startu/konfiguracji. |
| `providerAuthChoices`               | Nie      | `object[]`                       | Tanie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozwiązywania preferowanych dostawców i prostego powiązania flag CLI.                                                                 |
| `activation`                        | Nie      | `object`                         | Tanie wskazówki aktywacji dla ładowania wywoływanego przez dostawcę, polecenie, kanał, trasę i możliwości. Tylko metadane; rzeczywiste zachowanie nadal należy do runtime pluginu.                      |
| `setup`                             | Nie      | `object`                         | Tanie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania runtime pluginu.                                                                   |
| `qaRunners`                         | Nie      | `object[]`                       | Tanie deskryptory runnerów QA używane przez współdzielony host `openclaw qa` przed załadowaniem runtime pluginu.                                                                                        |
| `contracts`                         | Nie      | `object`                         | Statyczna migawka dołączonych możliwości dla mowy, transkrypcji realtime, głosu realtime, rozumienia multimediów, generowania obrazów, generowania muzyki, generowania wideo, web-fetch, web search i własności narzędzi. |
| `channelConfigs`                    | Nie      | `Record<string, object>`         | Metadane konfiguracji kanału zarządzane przez manifest, scalane z powierzchniami wykrywania i walidacji przed załadowaniem runtime.                                                                      |
| `skills`                            | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne wobec katalogu głównego pluginu.                                                                                                                                 |
| `name`                              | Nie      | `string`                         | Czytelna dla człowieka nazwa pluginu.                                                                                                                                                                      |
| `description`                       | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach pluginu.                                                                                                                                                |
| `version`                           | Nie      | `string`                         | Informacyjna wersja pluginu.                                                                                                                                                                               |
| `uiHints`                           | Nie      | `Record<string, object>`         | Etykiety UI, placeholdery i wskazówki dotyczące wrażliwości dla pól konfiguracji.                                                                                                                         |

## Dokumentacja `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem runtime dostawcy.

| Pole                  | Wymagane | Typ                                             | Znaczenie                                                                                               |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ten wybór.                                                    |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której należy przekazać sterowanie.                          |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru uwierzytelniania używany przez onboarding i przepływy CLI.               |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw wraca do `choiceId`.             |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                  |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.       |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór przed selektorami asystenta, nadal pozwalając na ręczny wybór w CLI.                      |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyborów, które powinny przekierowywać użytkowników do tego wyboru zastępczego.  |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                      |
| `groupLabel`          | Nie      | `string`                                        | Etykieta widoczna dla użytkownika dla tej grupy.                                                        |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                      |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                         |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                    |
| `cliOption`           | Nie      | `string`                                        | Pełny kształt opcji CLI, na przykład `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                              |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Określa, na których powierzchniach onboardingu ten wybór powinien się pojawiać. Jeśli pole zostanie pominięte, domyślnie używane jest `["text-inference"]`. |

## Dokumentacja `commandAliases`

Używaj `commandAliases`, gdy plugin zarządza nazwą polecenia runtime, którą użytkownicy mogą
omyłkowo umieścić w `plugins.allow` lub próbować uruchomić jako polecenie CLI z poziomu root. OpenClaw
używa tych metadanych do diagnostyki bez importowania kodu runtime pluginu.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Pole         | Wymagane | Typ               | Znaczenie                                                                    |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należącego do tego pluginu.                                  |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie ukośnikowe czatu, a nie polecenie CLI z root.   |
| `cliCommand` | Nie      | `string`          | Powiązane polecenie CLI z root, które warto zasugerować przy operacjach CLI, jeśli istnieje. |

## Dokumentacja `activation`

Używaj `activation`, gdy plugin może tanio zadeklarować, które zdarzenia control-plane
powinny aktywować go później.

## Dokumentacja `qaRunners`

Używaj `qaRunners`, gdy plugin wnosi jeden lub więcej runnerów transportu pod
współdzielonym katalogiem głównym `openclaw qa`. Te metadane powinny pozostać tanie i statyczne; runtime
pluginu nadal zarządza faktyczną rejestracją CLI przez lekką
powierzchnię `runtime-api.ts`, która eksportuje `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Uruchamia opartą na Dockerze linię live QA Matrix na jednorazowym homeserverze"
    }
  ]
}
```

| Pole          | Wymagane | Typ      | Znaczenie                                                          |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.    |
| `description` | Nie      | `string` | Zapasowy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia zastępczego. |

Ten blok zawiera tylko metadane. Nie rejestruje zachowania runtime i nie
zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia runtime/pluginu.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem pluginu, więc
brak metadanych aktywacji zwykle kosztuje tylko wydajność; nie powinien
zmieniać poprawności, dopóki nadal istnieją starsze mechanizmy zapasowe własności manifestu.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Pole             | Wymagane | Typ                                                  | Znaczenie                                                        |
| ---------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `onProviders`    | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny aktywować ten plugin po wywołaniu. |
| `onCommands`     | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny aktywować ten plugin.      |
| `onChannels`     | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny aktywować ten plugin.      |
| `onRoutes`       | Nie      | `string[]`                                           | Rodzaje tras, które powinny aktywować ten plugin.                |
| `onCapabilities` | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki dotyczące możliwości używane przez planowanie aktywacji control-plane. |

Obecni aktywni konsumenci:

- planowanie CLI wywoływane poleceniem wraca zapasowo do starszego
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie konfiguracji/kanałów wywoływane kanałem wraca zapasowo do starszej własności `channels[]`,
  gdy brakuje jawnych metadanych aktywacji kanału
- planowanie konfiguracji/runtime wywoływane dostawcą wraca zapasowo do starszej
  własności `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych aktywacji dostawcy

## Dokumentacja `setup`

Używaj `setup`, gdy powierzchnie konfiguracji i onboardingu potrzebują tanich metadanych zarządzanych przez plugin
przed załadowaniem runtime.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Najwyższego poziomu `cliBackends` pozostaje poprawne i nadal opisuje backendy
wnioskowania CLI. `setup.cliBackends` to powierzchnia deskryptorów specyficzna dla konfiguracji
dla przepływów control-plane/configuration, które powinny pozostać tylko metadanymi.

Jeśli są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania typu descriptor-first dla wykrywania konfiguracji. Jeśli deskryptor tylko
zawęża kandydacki plugin, a konfiguracja nadal potrzebuje bogatszych hooków runtime w czasie konfiguracji,
ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
zapasową ścieżkę wykonania.

Ponieważ wyszukiwanie konfiguracji może wykonywać kod `setup-api` zarządzany przez plugin,
znormalizowane wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne
w skali wszystkich wykrytych pluginów. Niejednoznaczna własność kończy się bezpiecznym zamknięciem zamiast wybierania
zwycięzcy według kolejności wykrywania.

### Dokumentacja `setup.providers`

| Pole          | Wymagane | Typ        | Znaczenie                                                                                 |
| ------------- | -------- | ---------- | ----------------------------------------------------------------------------------------- |
| `id`          | Tak      | `string`   | Identyfikator dostawcy udostępniany podczas konfiguracji lub onboardingu. Znormalizowane identyfikatory powinny być globalnie unikalne. |
| `authMethods` | Nie      | `string[]` | Identyfikatory metod konfiguracji/uwierzytelniania, które ten dostawca obsługuje bez ładowania pełnego runtime. |
| `envVars`     | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie konfiguracji/statusu mogą sprawdzać przed załadowaniem runtime pluginu. |

### Pola `setup`

| Pole               | Wymagane | Typ        | Znaczenie                                                                                       |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji dostawców udostępniane podczas konfiguracji i onboardingu.             |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów używanych podczas konfiguracji dla wyszukiwania descriptor-first. Znormalizowane identyfikatory powinny być globalnie unikalne. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego pluginu.         |
| `requiresRuntime`  | Nie      | `boolean`  | Określa, czy konfiguracja nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.         |

## Dokumentacja `uiHints`

`uiHints` to mapa od nazw pól konfiguracji do małych wskazówek renderowania.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Klucz API",
      "help": "Używany do żądań OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Każda wskazówka pola może zawierać:

| Pole          | Typ        | Znaczenie                                 |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.   |
| `help`        | `string`   | Krótki tekst pomocniczy.                  |
| `tags`        | `string[]` | Opcjonalne tagi UI.                       |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.           |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe.  |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.    |

## Dokumentacja `contracts`

Używaj `contracts` tylko dla statycznych metadanych własności możliwości, które OpenClaw może
odczytać bez importowania runtime pluginu.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Każda lista jest opcjonalna:

| Pole                            | Typ        | Znaczenie                                                     |
| -------------------------------- | ---------- | ------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należących do tego pluginu.     |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji realtime należących do tego pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu realtime należących do tego pluginu. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia multimediów należących do tego pluginu. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należących do tego pluginu. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należących do tego pluginu. |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców web-fetch należących do tego pluginu. |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców web search należących do tego pluginu. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego pluginu do dołączonych kontroli kontraktów. |

## Dokumentacja `channelConfigs`

Używaj `channelConfigs`, gdy plugin kanału potrzebuje tanich metadanych konfiguracji przed
załadowaniem runtime.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL homeservera",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Połączenie z homeserverem Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Każdy wpis kanału może zawierać:

| Pole          | Typ                      | Znaczenie                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI/placeholdery/wskazówki wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami selektora i inspekcji, gdy metadane runtime nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                  |
| `preferOver`  | `string[]`               | Starsze lub mniej priorytetowe identyfikatory pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Dokumentacja `modelSupport`

Używaj `modelSupport`, gdy OpenClaw ma wywnioskować twój plugin dostawcy na podstawie
skróconych identyfikatorów modeli takich jak `gpt-5.4` lub `claude-sonnet-4.6` przed załadowaniem runtime pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następujący priorytet:

- jawne referencje `provider/model` używają metadanych manifestu właściciela `providers`
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli jeden plugin niedołączony i jeden dołączony pasują jednocześnie, wygrywa plugin niedołączony
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie wskaże dostawcy

Pola:

| Pole            | Typ        | Znaczenie                                                                          |
| --------------- | ---------- | ---------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skróconych identyfikatorów modeli.    |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

Starsze klucze możliwości najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` do `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności możliwości.

## Manifest a package.json

Te dwa pliki pełnią różne role:

| Plik                   | Używaj go do                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywania, walidacji konfiguracji, metadanych wyboru uwierzytelniania i wskazówek UI, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadanych npm, instalacji zależności i bloku `openclaw` używanego do punktów wejścia, ograniczeń instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien znaleźć się dany fragment metadanych, użyj tej zasady:

- jeśli OpenClaw musi znać go przed załadowaniem kodu pluginu, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść go w `package.json`

### Pola `package.json`, które wpływają na wykrywanie

Niektóre metadane pluginu sprzed uruchomienia runtime celowo znajdują się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Znaczenie                                                                                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne punkty wejścia pluginu. Muszą pozostać wewnątrz katalogu pakietu pluginu.                                                                                          |
| `openclaw.runtimeExtensions`                                      | Deklaruje zbudowane punkty wejścia runtime JavaScript dla zainstalowanych pakietów. Muszą pozostać wewnątrz katalogu pakietu pluginu.                                               |
| `openclaw.setupEntry`                                             | Lekki punkt wejścia tylko do konfiguracji używany podczas onboardingu, odroczonego uruchamiania kanału oraz wykrywania statusu kanału/SecretRef w trybie tylko do odczytu. Musi pozostać wewnątrz katalogu pakietu pluginu. |
| `openclaw.runtimeSetupEntry`                                      | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Musi pozostać wewnątrz katalogu pakietu pluginu.                                            |
| `openclaw.channel`                                                | Tanie metadane katalogu kanału, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                                                                    |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania skonfigurowanego stanu, które mogą odpowiedzieć na pytanie „czy konfiguracja tylko z env już istnieje?” bez ładowania pełnego runtime kanału.           |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania utrwalonego stanu uwierzytelnienia, które mogą odpowiedzieć na pytanie „czy coś jest już zalogowane?” bez ładowania pełnego runtime kanału.              |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla dołączonych i publikowanych zewnętrznie pluginów.                                                                                              |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                         |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, z użyciem dolnej granicy semver, takiej jak `>=2026.3.22`.                                                                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | Umożliwia wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego pluginu, gdy konfiguracja jest nieprawidłowa.                                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala ładować powierzchnie kanału tylko do konfiguracji przed pełnym pluginem kanału podczas uruchamiania.                                                                         |

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania
rejestru manifestu. Nieprawidłowe wartości są odrzucane; nowsze, ale poprawne wartości pomijają
plugin na starszych hostach.

Pluginy kanałów powinny udostępniać `openclaw.setupEntry`, gdy status, lista kanałów
lub skany SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego
runtime. Punkt wejścia konfiguracji powinien udostępniać metadane kanału oraz bezpieczne dla konfiguracji adaptery
konfiguracji, statusu i sekretów; klientów sieciowych, listenerów Gateway i
runtime transportu należy pozostawić w głównym punkcie wejścia rozszerzenia.

Pola punktu wejścia runtime nie nadpisują kontroli granic pakietu dla pól
źródłowego punktu wejścia. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że
wychodząca poza zakres ścieżka `openclaw.extensions` stanie się ładowalna.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolne uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala tylko przepływom instalacji
odzyskać działanie po określonych nieaktualnych błędach aktualizacji dołączonych pluginów, takich jak
brakująca ścieżka dołączonego pluginu lub nieaktualny wpis `channels.<id>` dla tego samego
dołączonego pluginu. Niezwiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
do `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` to metadane pakietu dla małego modułu sprawdzającego:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Używaj go, gdy przepływy konfiguracji, doctor lub configured-state potrzebują taniej
sondy auth typu tak/nie przed załadowaniem pełnego pluginu kanału. Eksport docelowy powinien być małą
funkcją odczytującą tylko stan utrwalony; nie prowadź jej przez pełny barrel
runtime kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla tanich sprawdzeń
skonfigurowanego stanu tylko z env:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Używaj go, gdy kanał może odpowiedzieć na pytanie o skonfigurowany stan na podstawie env lub innych małych
danych wejściowych niezwiązanych z runtime. Jeśli sprawdzenie wymaga pełnego rozwiązywania konfiguracji lub prawdziwego
runtime kanału, pozostaw tę logikę w hooku pluginu `config.hasConfiguredState`.

## Priorytet wykrywania (zduplikowane identyfikatory pluginów)

OpenClaw wykrywa pluginy z kilku miejsc głównych (dołączone, instalacja globalna, workspace, jawnie wybrane w konfiguracji ścieżki). Jeśli dwa wykrycia współdzielą ten sam `id`, zachowywany jest tylko manifest o **najwyższym priorytecie**; duplikaty o niższym priorytecie są odrzucane zamiast ładowania obok niego.

Priorytet od najwyższego do najniższego:

1. **Wybrany w konfiguracji** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Dołączony** — pluginy dostarczane z OpenClaw
3. **Instalacja globalna** — pluginy zainstalowane w globalnym katalogu pluginów OpenClaw
4. **Workspace** — pluginy wykryte względem bieżącego workspace

Konsekwencje:

- Zforkowana lub nieaktualna kopia dołączonego pluginu znajdująca się w workspace nie przesłoni dołączonej kompilacji.
- Aby rzeczywiście nadpisać dołączony plugin lokalnym, przypnij go przez `plugins.entries.<id>`, aby wygrał priorytetem, zamiast polegać na wykrywaniu w workspace.
- Odrzucone duplikaty są logowane, aby Doctor i diagnostyka uruchamiania mogły wskazać odrzuconą kopię.

## Wymagania JSON Schema

- **Każdy plugin musi dostarczać JSON Schema**, nawet jeśli nie akceptuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane w czasie odczytu/zapisu konfiguracji, a nie w runtime.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału został zadeklarowany przez
  manifest pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja jest zachowywana, a
  **ostrzeżenie** jest wyświetlane w Doctor + logach.

Pełny schemat `plugins.*` znajdziesz w [Dokumentacji konfiguracji](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym dla ładowań z lokalnego systemu plików.
- Runtime nadal ładuje moduł pluginu osobno; manifest służy tylko do
  wykrywania + walidacji.
- Natywne manifesty są parsowane przy użyciu JSON5, więc komentarze, końcowe przecinki i
  klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestu odczytuje tylko udokumentowane pola manifestu. Unikaj dodawania
  tutaj niestandardowych kluczy najwyższego poziomu.
- `providerAuthEnvVars` to tania ścieżka metadanych dla sond uwierzytelniania, walidacji
  znaczników env i podobnych powierzchni uwierzytelniania dostawcy, które nie powinny uruchamiać runtime pluginu
  tylko po to, by sprawdzić nazwy env.
- `providerAuthAliases` pozwala wariantom dostawców ponownie używać uwierzytelniania
  innego dostawcy przez zmienne env, profile auth, uwierzytelnianie oparte na konfiguracji i wybór
  onboardingu klucza API bez zakodowania tej relacji na stałe w core.
- `providerEndpoints` pozwala pluginom dostawców zarządzać prostymi metadanymi
  dopasowywania hosta/baseUrl punktu końcowego. Używaj tego tylko dla klas punktów końcowych, które core już obsługuje;
  plugin nadal zarządza zachowaniem runtime.
- `syntheticAuthRefs` to tania ścieżka metadanych dla zarządzanych przez dostawcę hooków syntetycznego
  uwierzytelniania, które muszą być widoczne dla zimnego wykrywania modeli, zanim powstanie rejestr
  runtime. Wypisuj tylko referencje, których runtime dostawca lub backend CLI rzeczywiście
  implementuje `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` to tania ścieżka metadanych dla należących do dołączonego pluginu
  zastępczych kluczy API, takich jak znaczniki danych lokalnych, OAuth lub ambientnych.
  Core traktuje je jako niesekretne na potrzeby wyświetlania uwierzytelniania i audytów sekretów bez
  zakodowania właściciela dostawcy na stałe.
- `channelEnvVars` to tania ścieżka metadanych dla zapasowego mechanizmu shell-env, monitów konfiguracji
  i podobnych powierzchni kanału, które nie powinny uruchamiać runtime pluginu
  tylko po to, by sprawdzić nazwy env. Same nazwy env są metadanymi, a nie aktywacją:
  status, audyt, walidacja dostarczania Cron i inne powierzchnie tylko do odczytu nadal
  stosują zaufanie do pluginu i politykę efektywnej aktywacji, zanim potraktują zmienną env jako skonfigurowany kanał.
- `providerAuthChoices` to tania ścieżka metadanych dla selektorów wyboru uwierzytelniania,
  rozwiązywania `--auth-choice`, mapowania preferowanych dostawców i prostego rejestrowania
  flag onboarding CLI przed załadowaniem runtime dostawcy. Dla metadanych kreatora runtime,
  które wymagają kodu dostawcy, zobacz
  [Hooki runtime dostawcy](/pl/plugins/architecture#provider-runtime-hooks).
- Wyłączne rodzaje pluginów są wybierane przez `plugins.slots.*`.
  - `kind: "memory"` jest wybierane przez `plugins.slots.memory`.
  - `kind: "context-engine"` jest wybierane przez `plugins.slots.contextEngine`
    (domyślnie: wbudowany `legacy`).
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy
  plugin ich nie potrzebuje.
- Jeśli twój plugin zależy od modułów natywnych, udokumentuj kroki kompilacji oraz wszelkie
  wymagania dotyczące list dozwolonych menedżera pakietów (na przykład pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) — jak zacząć pracę z pluginami
- [Architektura pluginów](/pl/plugins/architecture) — architektura wewnętrzna
- [Przegląd SDK](/pl/plugins/sdk-overview) — dokumentacja Plugin SDK
