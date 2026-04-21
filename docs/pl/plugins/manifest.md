---
read_when:
    - Tworzysz plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji pluginu lub debugować błędy walidacji pluginu
summary: Wymagania dotyczące manifestu Plugin + schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-21T19:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304c08035724dfb1ce6349972729b621aafc00880d4d259db78c22b86e9056ba
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest pluginu (`openclaw.plugin.json`)

Ta strona dotyczy wyłącznie **natywnego manifestu pluginu OpenClaw**.

Informacje o zgodnych układach bundli znajdziesz w [Plugin bundles](/pl/plugins/bundles).

Zgodne formaty bundli używają innych plików manifestu:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentu Claude
  bez manifestu
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw również automatycznie wykrywa te układy bundli, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych bundli OpenClaw obecnie odczytuje metadane bundla oraz zadeklarowane
rooty umiejętności, rooty poleceń Claude, domyślne wartości `settings.json` bundla Claude,
domyślne wartości LSP bundla Claude oraz obsługiwane pakiety hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym pluginu**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu pluginu**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy pluginu i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie pluginów: [Plugins](/pl/tools/plugin).
Informacje o natywnym modelu możliwości i aktualnych wskazówkach dotyczących zgodności zewnętrznej:
[Capability model](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje przed załadowaniem kodu
Twojego pluginu.

Używaj go do:

- tożsamości pluginu
- walidacji konfiguracji
- metadanych uwierzytelniania i onboardingu, które powinny być dostępne bez uruchamiania
  runtime pluginu
- tanich wskazówek aktywacji, które powierzchnie control-plane mogą sprawdzać przed załadowaniem runtime
- tanich deskryptorów konfiguracji, które powierzchnie setupu/onboardingu mogą sprawdzać przed
  załadowaniem runtime
- metadanych aliasów i auto-enable, które powinny być rozstrzygane przed załadowaniem runtime pluginu
- skróconych metadanych własności rodziny modeli, które powinny automatycznie aktywować
  plugin przed załadowaniem runtime
- statycznych migawek własności możliwości używanych do dołączonego okablowania zgodności i
  pokrycia kontraktu
- tanich metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzać
  przed załadowaniem runtime pluginu
- metadanych konfiguracji specyficznych dla kanału, które powinny być scalane z powierzchniami
  katalogu i walidacji bez ładowania runtime
- wskazówek UI konfiguracji

Nie używaj go do:

- rejestrowania zachowania w runtime
- deklarowania entrypointów kodu
- metadanych instalacji npm

To należy do kodu Twojego pluginu i `package.json`.

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
  "description": "OpenRouter provider plugin",
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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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

## Opis pól najwyższego poziomu

| Pole                                | Wymagane | Typ                              | Co oznacza                                                                                                                                                                                                   |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Tak      | `string`                         | Kanoniczny identyfikator pluginu. To identyfikator używany w `plugins.entries.<id>`.                                                                                                                        |
| `configSchema`                      | Tak      | `object`                         | Wbudowany schemat JSON Schema dla konfiguracji tego pluginu.                                                                                                                                                 |
| `enabledByDefault`                  | Nie      | `true`                           | Oznacza dołączony plugin jako domyślnie włączony. Pomiń to pole lub ustaw dowolną wartość inną niż `true`, aby plugin pozostał domyślnie wyłączony.                                                       |
| `legacyPluginIds`                   | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                           |
| `autoEnableWhenConfiguredProviders` | Nie      | `string[]`                       | Identyfikatory providerów, które powinny automatycznie włączać ten plugin, gdy uwierzytelnianie, konfiguracja lub odwołania do modeli je wskazują.                                                        |
| `kind`                              | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj pluginu używany przez `plugins.slots.*`.                                                                                                                                          |
| `channels`                          | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                          |
| `providers`                         | Nie      | `string[]`                       | Identyfikatory providerów należących do tego pluginu.                                                                                                                                                        |
| `modelSupport`                      | Nie      | `object`                         | Należące do manifestu skrócone metadane rodziny modeli używane do automatycznego ładowania pluginu przed runtime.                                                                                          |
| `providerEndpoints`                 | Nie      | `object[]`                       | Należące do manifestu metadane hostów/baseUrl endpointów dla tras providera, które rdzeń musi klasyfikować przed załadowaniem runtime providera.                                                           |
| `cliBackends`                       | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego pluginu. Używane do automatycznej aktywacji przy starcie na podstawie jawnych odwołań konfiguracyjnych.                                         |
| `syntheticAuthRefs`                 | Nie      | `string[]`                       | Odwołania do providera lub backendu CLI, których należący do pluginu syntetyczny hook uwierzytelniania powinien być sprawdzany podczas zimnego wykrywania modeli przed załadowaniem runtime.              |
| `nonSecretAuthMarkers`              | Nie      | `string[]`                       | Należące do dołączonego pluginu przykładowe wartości kluczy API, które reprezentują niejawną lokalną, OAuth lub środowiskową tożsamość poświadczeń.                                                        |
| `commandAliases`                    | Nie      | `object[]`                       | Nazwy poleceń należące do tego pluginu, które powinny generować świadomą pluginu konfigurację i diagnostykę CLI przed załadowaniem runtime.                                                                |
| `providerAuthEnvVars`               | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych uwierzytelniania providera, które OpenClaw może sprawdzać bez ładowania kodu pluginu.                                                                             |
| `providerAuthAliases`               | Nie      | `Record<string, string>`         | Identyfikatory providerów, które powinny ponownie używać innego identyfikatora providera do wyszukiwania uwierzytelniania, na przykład provider kodowania współdzielący bazowy klucz API i profile auth. |
| `channelEnvVars`                    | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych kanału, które OpenClaw może sprawdzać bez ładowania kodu pluginu. Używaj tego do powierzchni konfiguracji kanału lub auth sterowanych przez env, które powinny widzieć ogólne helpery startowe/konfiguracyjne. |
| `providerAuthChoices`               | Nie      | `object[]`                       | Lekkie metadane wyboru auth dla selektorów onboardingu, rozstrzygania preferowanych providerów i prostego powiązania flag CLI.                                                                             |
| `activation`                        | Nie      | `object`                         | Lekkie wskazówki aktywacji dla ładowania wyzwalanego przez providera, polecenie, kanał, trasę i możliwość. Tylko metadane; faktyczne zachowanie nadal należy do runtime pluginu.                          |
| `setup`                             | Nie      | `object`                         | Lekkie deskryptory setupu/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania runtime pluginu.                                                                          |
| `qaRunners`                         | Nie      | `object[]`                       | Lekkie deskryptory runnerów QA używane przez współdzielony host `openclaw qa` przed załadowaniem runtime pluginu.                                                                                          |
| `contracts`                         | Nie      | `object`                         | Statyczna migawka dołączonych możliwości dla mowy, transkrypcji realtime, głosu realtime, rozumienia mediów, generowania obrazów, generowania muzyki, generowania wideo, web-fetch, wyszukiwania w sieci oraz własności narzędzi. |
| `channelConfigs`                    | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału scalane z powierzchniami wykrywania i walidacji przed załadowaniem runtime.                                                                             |
| `skills`                            | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego pluginu.                                                                                                                                |
| `name`                              | Nie      | `string`                         | Czytelna dla człowieka nazwa pluginu.                                                                                                                                                                        |
| `description`                       | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach pluginu.                                                                                                                                                  |
| `version`                           | Nie      | `string`                         | Informacyjna wersja pluginu.                                                                                                                                                                                 |
| `uiHints`                           | Nie      | `Record<string, object>`         | Etykiety UI, placeholdery i wskazówki dotyczące wrażliwości dla pól konfiguracji.                                                                                                                           |

## Opis `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub auth.
OpenClaw odczytuje to przed załadowaniem runtime providera.

| Pole                  | Wymagane | Typ                                             | Co oznacza                                                                                              |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator providera, do którego należy ten wybór.                                                   |
| `method`              | Tak      | `string`                                        | Identyfikator metody auth, do której należy przekazać obsługę.                                          |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru auth używany przez onboarding i przepływy CLI.                            |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje `choiceId`.                |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                  |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.       |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór w selektorach asystenta, nadal pozwalając na ręczny wybór w CLI.                           |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyboru, które powinny przekierowywać użytkowników do tego zastępczego wyboru.   |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                       |
| `groupLabel`          | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                            |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                      |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów auth opartych na jednej fladze.                          |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                    |
| `cliOption`           | Nie      | `string`                                        | Pełna postać opcji CLI, na przykład `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                              |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Na których powierzchniach onboardingu ten wybór powinien się pojawiać. Jeśli pole zostanie pominięte, domyślnie używane jest `["text-inference"]`. |

## Opis `commandAliases`

Używaj `commandAliases`, gdy plugin posiada nazwę polecenia runtime, którą użytkownicy
mogą przez pomyłkę umieścić w `plugins.allow` albo próbować uruchomić jako główne polecenie CLI. OpenClaw
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

| Pole         | Wymagane | Typ               | Co oznacza                                                                  |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należąca do tego pluginu.                                    |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash czatu, a nie główne polecenie CLI.       |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI, które należy zasugerować przy operacjach CLI, jeśli istnieje. |

## Opis `activation`

Używaj `activation`, gdy plugin może w prosty sposób zadeklarować, które zdarzenia control-plane
powinny aktywować go później.

## Opis `qaRunners`

Używaj `qaRunners`, gdy plugin wnosi jeden lub więcej runnerów transportu pod
współdzielonym rootem `openclaw qa`. Zachowaj te metadane jako lekkie i statyczne; runtime
pluginu nadal odpowiada za faktyczną rejestrację CLI przez lekką
powierzchnię `runtime-api.ts`, która eksportuje `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Pole          | Wymagane | Typ      | Co oznacza                                                         |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.    |
| `description` | Nie      | `string` | Zastępczy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia stub. |

Ten blok zawiera wyłącznie metadane. Nie rejestruje zachowania runtime i nie
zastępuje `register(...)`, `setupEntry` ani innych entrypointów runtime/pluginu.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem pluginu, więc
brak metadanych aktywacji zwykle wpływa tylko na wydajność; nie powinien
zmieniać poprawności, dopóki nadal istnieją starsze fallbacki własności manifestu.

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

| Pole             | Wymagane | Typ                                                  | Co oznacza                                                        |
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | Nie      | `string[]`                                           | Identyfikatory providerów, które powinny aktywować ten plugin po wywołaniu. |
| `onCommands`     | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny aktywować ten plugin.       |
| `onChannels`     | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny aktywować ten plugin.       |
| `onRoutes`       | Nie      | `string[]`                                           | Rodzaje tras, które powinny aktywować ten plugin.                 |
| `onCapabilities` | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki możliwości używane przez planowanie aktywacji control-plane. |

Obecni konsumenci produkcyjni:

- planowanie CLI wyzwalane poleceniem wraca do starszego
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie setupu/kanału wyzwalane kanałem wraca do starszej własności
  `channels[]`, gdy brakuje jawnych metadanych aktywacji kanału
- planowanie setupu/runtime wyzwalane providerem wraca do starszej
  własności `providers[]` oraz najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych
  aktywacji providera

## Opis `setup`

Używaj `setup`, gdy powierzchnie setupu i onboardingu potrzebują lekkich metadanych należących do pluginu
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

Pole najwyższego poziomu `cliBackends` pozostaje prawidłowe i nadal opisuje backendy
inferencji CLI. `setup.cliBackends` to powierzchnia deskryptorów specyficzna dla setupu dla
przepływów control-plane/setup, które powinny pozostać wyłącznie metadanymi.

Jeśli są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania opartą najpierw na deskryptorach dla wykrywania setupu. Jeśli deskryptor tylko
zawęża kandydujący plugin, a setup nadal wymaga bogatszych hooków runtime czasu setupu,
ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
zastępczą ścieżkę wykonania.

Ponieważ wyszukiwanie setupu może wykonywać należący do pluginu kod `setup-api`,
znormalizowane wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne wśród
wykrytych pluginów. Niejednoznaczna własność kończy się bezpieczną odmową zamiast wybierania
zwycięzcy na podstawie kolejności wykrycia.

### Opis `setup.providers`

| Pole          | Wymagane | Typ        | Co oznacza                                                                            |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Tak      | `string`   | Identyfikator providera ujawniany podczas setupu lub onboardingu. Znormalizowane identyfikatory muszą być globalnie unikalne. |
| `authMethods` | Nie      | `string[]` | Identyfikatory metod setupu/auth obsługiwane przez tego providera bez ładowania pełnego runtime. |
| `envVars`     | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie setupu/statusu mogą sprawdzać przed załadowaniem runtime pluginu. |

### Pola `setup`

| Pole               | Wymagane | Typ        | Co oznacza                                                                                           |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory setupu providera ujawniane podczas setupu i onboardingu.                                 |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów czasu setupu używane do wyszukiwania setupu najpierw po deskryptorach. Znormalizowane identyfikatory muszą być globalnie unikalne. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni setupu tego pluginu.                    |
| `requiresRuntime`  | Nie      | `boolean`  | Czy setup nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                              |

## Opis `uiHints`

`uiHints` to mapa od nazw pól konfiguracji do małych wskazówek renderowania.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Każda wskazówka pola może zawierać:

| Pole          | Typ        | Co oznacza                               |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.  |
| `help`        | `string`   | Krótki tekst pomocniczy.                 |
| `tags`        | `string[]` | Opcjonalne tagi UI.                      |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.          |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe. |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.   |

## Opis `contracts`

Używaj `contracts` wyłącznie dla statycznych metadanych własności możliwości, które OpenClaw może
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

| Pole                             | Typ        | Co oznacza                                                       |
| -------------------------------- | ---------- | ---------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Identyfikatory providerów mowy należących do tego pluginu.       |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory providerów transkrypcji realtime należących do tego pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory providerów głosu realtime należących do tego pluginu. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory providerów rozumienia mediów należących do tego pluginu. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory providerów generowania obrazów należących do tego pluginu. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory providerów generowania wideo należących do tego pluginu. |
| `webFetchProviders`              | `string[]` | Identyfikatory providerów web-fetch należących do tego pluginu.  |
| `webSearchProviders`             | `string[]` | Identyfikatory providerów wyszukiwania w sieci należących do tego pluginu. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego pluginu na potrzeby kontroli kontraktów dołączonych pluginów. |

## Opis `channelConfigs`

Używaj `channelConfigs`, gdy plugin kanału potrzebuje lekkich metadanych konfiguracji przed
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
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Każdy wpis kanału może zawierać:

| Pole          | Typ                      | Co oznacza                                                                                  |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI/placeholdery/wskazówki wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami selektora i inspekcji, gdy metadane runtime nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                     |
| `preferOver`  | `string[]`               | Identyfikatory starszych lub niżej priorytetowych pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Opis `modelSupport`

Używaj `modelSupport`, gdy OpenClaw ma wnioskować o Twoim pluginie providera na podstawie
skróconych identyfikatorów modeli, takich jak `gpt-5.4` lub `claude-sonnet-4.6`, zanim runtime pluginu
zostanie załadowany.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następujący priorytet:

- jawne odwołania `provider/model` używają metadanych manifestu `providers` należących do właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują jednocześnie jeden plugin niedołączony i jeden plugin dołączony, wygrywa plugin
  niedołączony
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie wskaże providera

Pola:

| Pole            | Typ        | Co oznacza                                                                    |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skróconych identyfikatorów modeli. |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

Starsze klucze możliwości na najwyższym poziomie są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` pod `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności możliwości.

## Manifest a package.json

Te dwa pliki pełnią różne funkcje:

| Plik                   | Używaj go do                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywania, walidacji konfiguracji, metadanych wyboru auth i wskazówek UI, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadanych npm, instalacji zależności oraz bloku `openclaw` używanego dla entrypointów, ograniczeń instalacji, setupu lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien należeć dany element metadanych, użyj tej zasady:

- jeśli OpenClaw musi o nim wiedzieć przed załadowaniem kodu pluginu, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików entry lub zachowania instalacji npm, umieść go w `package.json`

### Pola `package.json`, które wpływają na wykrywanie

Niektóre metadane pluginu sprzed uruchomienia runtime celowo znajdują się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Co oznacza                                                                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne entrypointy pluginu.                                                                                                       |
| `openclaw.setupEntry`                                             | Lekki entrypoint tylko do setupu używany podczas onboardingu, odroczonego uruchamiania kanału oraz wykrywania statusu kanału/SecretRef tylko do odczytu. |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanału, takie jak etykiety, ścieżki dokumentacji, aliasy i teksty wyboru.                                         |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania stanu konfiguracji, które potrafią odpowiedzieć na pytanie „czy konfiguracja tylko z env już istnieje?” bez ładowania pełnego runtime kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania utrwalonego stanu auth, które potrafią odpowiedzieć na pytanie „czy cokolwiek jest już zalogowane?” bez ładowania pełnego runtime kanału. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla pluginów dołączonych i publikowanych zewnętrznie.                                                     |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, z użyciem dolnego ograniczenia semver, takiego jak `>=2026.3.22`.                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | Pozwala na wąską ścieżkę odzyskiwania po ponownej instalacji dołączonego pluginu, gdy konfiguracja jest nieprawidłowa.                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala powierzchniom kanału tylko do setupu ładować się przed pełnym pluginem kanału podczas startu.                                       |

`openclaw.install.minHostVersion` jest wymuszane podczas instalacji i ładowania rejestru
manifestów. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości powodują pominięcie
pluginu na starszych hostach.

Pluginy kanałów powinny dostarczać `openclaw.setupEntry`, gdy status, lista kanałów
lub skany SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego
runtime. Entry setupu powinno ujawniać metadane kanału wraz z bezpiecznymi dla setupu adapterami
konfiguracji, statusu i sekretów; klientów sieciowych, listenerów Gateway i runtime transportu
należy pozostawić w głównym entrypoincie rozszerzenia.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolnie uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala tylko
przepływom instalacji odzyskać się po określonych nieaktualnych awariach aktualizacji dołączonego pluginu,
takich jak brakująca ścieżka dołączonego pluginu albo nieaktualny wpis `channels.<id>` dla tego samego
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

Używaj tego, gdy przepływy setupu, doctora lub configured-state potrzebują lekkiego sprawdzenia
auth typu tak/nie, zanim pełny plugin kanału zostanie załadowany. Eksport docelowy powinien być małą
funkcją, która odczytuje wyłącznie utrwalony stan; nie kieruj go przez pełny barrel runtime
kanału.

`openclaw.channel.configuredState` ma tę samą postać dla lekkich kontroli
configured-state opartych wyłącznie na env:

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

Używaj tego, gdy kanał może odpowiedzieć o configured-state na podstawie env lub innych małych
wejść niezwiązanych z runtime. Jeśli kontrola wymaga pełnego rozstrzygnięcia konfiguracji lub prawdziwego
runtime kanału, pozostaw tę logikę zamiast tego w hooku pluginu `config.hasConfiguredState`.

## Wymagania dotyczące JSON Schema

- **Każdy plugin musi dostarczać JSON Schema**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w runtime.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału został zadeklarowany przez
  manifest pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja jest zachowywana i
  w Doctor + logach wyświetlane jest **ostrzeżenie**.

Pełny schemat `plugins.*` znajdziesz w [Configuration reference](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym dla ładowań z lokalnego systemu plików.
- Runtime nadal ładuje moduł pluginu osobno; manifest służy wyłącznie do
  wykrywania + walidacji.
- Natywne manifesty są parsowane przez JSON5, więc komentarze, końcowe przecinki i
  klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestu odczytuje tylko udokumentowane pola manifestu. Unikaj dodawania
  własnych kluczy najwyższego poziomu.
- `providerAuthEnvVars` to lekka ścieżka metadanych dla kontroli auth, walidacji znaczników env
  i podobnych powierzchni auth providera, które nie powinny uruchamiać runtime pluginu
  tylko po to, by sprawdzić nazwy env.
- `providerAuthAliases` pozwala wariantom providerów ponownie używać zmiennych środowiskowych auth,
  profili auth, auth opartego na konfiguracji i wyboru onboardingu klucza API innego providera
  bez zakodowywania tej relacji na sztywno w rdzeniu.
- `providerEndpoints` pozwala pluginom providerów posiadać proste metadane dopasowywania
  hosta/baseUrl endpointów. Używaj tego tylko dla klas endpointów, które rdzeń już obsługuje;
  zachowanie runtime nadal należy do pluginu.
- `syntheticAuthRefs` to lekka ścieżka metadanych dla należących do providera syntetycznych
  hooków auth, które muszą być widoczne dla zimnego wykrywania modeli, zanim rejestr runtime zacznie istnieć. Wymieniaj tylko te odwołania, których runtime provider lub backend CLI rzeczywiście
  implementuje `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` to lekka ścieżka metadanych dla należących do dołączonego pluginu
  przykładowych kluczy API, takich jak znaczniki poświadczeń lokalnych, OAuth lub środowiskowych.
  Rdzeń traktuje je jako niesekretne na potrzeby wyświetlania auth i audytów sekretów bez
  zakodowywania na sztywno właściciela providera.
- `channelEnvVars` to lekka ścieżka metadanych dla fallbacku shell-env, promptów setupu
  i podobnych powierzchni kanału, które nie powinny uruchamiać runtime pluginu
  tylko po to, by sprawdzić nazwy env.
- `providerAuthChoices` to lekka ścieżka metadanych dla selektorów wyboru auth,
  rozstrzygania `--auth-choice`, mapowania preferowanego providera i prostej rejestracji
  flag CLI onboardingu przed załadowaniem runtime providera. Informacje o metadanych kreatora runtime,
  które wymagają kodu providera, znajdziesz w
  [Provider runtime hooks](/pl/plugins/architecture#provider-runtime-hooks).
- Wyłączne rodzaje pluginów są wybierane przez `plugins.slots.*`.
  - `kind: "memory"` jest wybierany przez `plugins.slots.memory`.
  - `kind: "context-engine"` jest wybierany przez `plugins.slots.contextEngine`
    (domyślnie: wbudowany `legacy`).
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy
  plugin ich nie potrzebuje.
- Jeśli Twój plugin zależy od modułów natywnych, udokumentuj kroki budowania oraz wszelkie wymagania listy dozwolonych menedżera pakietów (na przykład pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Powiązane

- [Building Plugins](/pl/plugins/building-plugins) — rozpoczęcie pracy z pluginami
- [Plugin Architecture](/pl/plugins/architecture) — architektura wewnętrzna
- [SDK Overview](/pl/plugins/sdk-overview) — dokumentacja referencyjna SDK Plugin
