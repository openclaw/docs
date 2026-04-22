---
read_when:
    - Tworzysz Plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji Plugin albo debugować błędy walidacji Plugin
summary: Manifest Plugin + wymagania schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-22T09:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 085c1baccb96b8e6bd4033ad11bdd5f79bdb0daec470e977fce723c3ae38cc99
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest Plugin (`openclaw.plugin.json`)

Ta strona dotyczy wyłącznie **natywnego manifestu Plugin OpenClaw**.

Informacje o zgodnych układach pakietów znajdziesz w [Pakiety Plugin](/pl/plugins/bundles).

Zgodne formaty pakietów używają innych plików manifestu:

- pakiet Codex: `.codex-plugin/plugin.json`
- pakiet Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentów Claude
  bez manifestu
- pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa również te układy pakietów, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych pakietów OpenClaw obecnie odczytuje metadane pakietu oraz zadeklarowane
katalogi główne skillów, katalogi główne poleceń Claude, domyślne ustawienia `settings.json` pakietu Claude,
domyślne ustawienia LSP pakietu Claude oraz obsługiwane zestawy hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym Plugin**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Plugin**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Plugin i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Plugin: [Plugin](/pl/tools/plugin).
Informacje o natywnym modelu capabilities i aktualnych wskazówkach dotyczących zgodności z rozwiązaniami zewnętrznymi:
[Model capabilities](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje przed załadowaniem kodu
Plugin.

Używaj go do:

- tożsamości Plugin
- walidacji konfiguracji
- metadanych uwierzytelniania i onboardingu, które powinny być dostępne bez uruchamiania środowiska wykonawczego Plugin
- tanich wskazówek aktywacji, które powierzchnie control-plane mogą sprawdzać przed załadowaniem środowiska wykonawczego
- tanich deskryptorów konfiguracji, które powierzchnie setup/onboarding mogą sprawdzać przed załadowaniem środowiska wykonawczego
- metadanych aliasów i automatycznego włączania, które powinny być rozwiązywane przed załadowaniem środowiska wykonawczego Plugin
- skróconych metadanych własności rodziny modeli, które powinny automatycznie aktywować Plugin przed załadowaniem środowiska wykonawczego
- statycznych migawek własności capabilities używanych do dołączonego okablowania zgodności i pokrycia kontraktów
- tanich metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzać przed załadowaniem środowiska wykonawczego Plugin
- metadanych konfiguracji specyficznych dla kanału, które powinny być scalane z powierzchniami katalogu i walidacji bez ładowania środowiska wykonawczego
- wskazówek interfejsu konfiguracji

Nie używaj go do:

- rejestrowania zachowania środowiska wykonawczego
- deklarowania entrypointów kodu
- metadanych instalacji npm

To należy umieścić w kodzie Plugin i w `package.json`.

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

## Odwołanie do pól najwyższego poziomu

| Pole                                 | Wymagane | Typ                              | Co oznacza                                                                                                                                                                                                   |
| ------------------------------------ | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | Tak      | `string`                         | Kanoniczny identyfikator Plugin. Jest to identyfikator używany w `plugins.entries.<id>`.                                                                                                                    |
| `configSchema`                       | Tak      | `object`                         | Wbudowany schemat JSON Schema dla konfiguracji tego Plugin.                                                                                                                                                  |
| `enabledByDefault`                   | Nie      | `true`                           | Oznacza dołączony Plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić Plugin domyślnie wyłączony.                                                     |
| `legacyPluginIds`                    | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora Plugin.                                                                                                                             |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten Plugin, gdy odwołują się do nich uwierzytelnianie, konfiguracja lub referencje modeli.                                                  |
| `kind`                               | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj Plugin używany przez `plugins.slots.*`.                                                                                                                                            |
| `channels`                           | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego Plugin. Używane do wykrywania i walidacji konfiguracji.                                                                                                           |
| `providers`                          | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego Plugin.                                                                                                                                                          |
| `modelSupport`                       | Nie      | `object`                         | Skrócone metadane rodziny modeli należące do manifestu, używane do automatycznego załadowania Plugin przed uruchomieniem środowiska wykonawczego.                                                          |
| `providerEndpoints`                  | Nie      | `object[]`                       | Metadane hosta/baseUrl punktu końcowego należące do manifestu dla tras dostawców, które rdzeń musi sklasyfikować przed załadowaniem środowiska wykonawczego dostawcy.                                     |
| `cliBackends`                        | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego Plugin. Używane do automatycznej aktywacji przy uruchamianiu na podstawie jawnych referencji konfiguracji.                                      |
| `syntheticAuthRefs`                  | Nie      | `string[]`                       | Referencje dostawców lub backendów CLI, których należący do Plugin hook syntetycznego uwierzytelniania powinien być sprawdzany podczas zimnego wykrywania modeli przed załadowaniem środowiska wykonawczego. |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                       | Wartości zastępczych kluczy API należące do dołączonego Plugin, które reprezentują niejawną lokalną, OAuth lub ambient credential state.                                                                    |
| `commandAliases`                     | Nie      | `object[]`                       | Nazwy poleceń należące do tego Plugin, które powinny generować świadomą Plugin diagnostykę konfiguracji i CLI przed załadowaniem środowiska wykonawczego.                                                   |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`       | Lekkie metadane env dla uwierzytelniania dostawcy, które OpenClaw może sprawdzić bez ładowania kodu Plugin.                                                                                                 |
| `providerAuthAliases`                | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący klucz API bazowego dostawcy i profile uwierzytelniania. |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`       | Lekkie metadane env dla kanału, które OpenClaw może sprawdzić bez ładowania kodu Plugin. Używaj tego dla opartej na env konfiguracji kanału lub powierzchni uwierzytelniania, które powinny być widoczne dla generycznych helperów uruchamiania/konfiguracji. |
| `providerAuthChoices`                | Nie      | `object[]`                       | Lekkie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego okablowania flag CLI.                                                                   |
| `activation`                         | Nie      | `object`                         | Lekkie wskazówki aktywacji dla ładowania wyzwalanego przez dostawcę, polecenie, kanał, trasę i capability. Tylko metadane; rzeczywiste zachowanie nadal należy do środowiska wykonawczego Plugin.         |
| `setup`                              | Nie      | `object`                         | Lekkie deskryptory setup/onboarding, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania środowiska wykonawczego Plugin.                                                             |
| `qaRunners`                          | Nie      | `object[]`                       | Lekkie deskryptory runnerów QA używane przez współdzielony host `openclaw qa` przed załadowaniem środowiska wykonawczego Plugin.                                                                           |
| `contracts`                          | Nie      | `object`                         | Statyczna migawka dołączonych capabilities dla własności mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów, generowania obrazów, generowania muzyki, generowania wideo, web-fetch, web search i narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`         | Lekkie domyślne ustawienia rozumienia mediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                       |
| `channelConfigs`                     | Nie      | `Record<string, object>`         | Metadane konfiguracji kanału należące do manifestu, scalane z powierzchniami wykrywania i walidacji przed załadowaniem środowiska wykonawczego.                                                            |
| `skills`                             | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego Plugin.                                                                                                                                 |
| `name`                               | Nie      | `string`                         | Czytelna dla człowieka nazwa Plugin.                                                                                                                                                                         |
| `description`                        | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach Plugin.                                                                                                                                                   |
| `version`                            | Nie      | `string`                         | Informacyjna wersja Plugin.                                                                                                                                                                                  |
| `uiHints`                            | Nie      | `Record<string, object>`         | Etykiety interfejsu, placeholdery i wskazówki dotyczące wrażliwości dla pól konfiguracji.                                                                                                                   |

## Informacje o `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem środowiska wykonawczego dostawcy.

| Pole                  | Wymagane | Typ                                             | Co oznacza                                                                                              |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ten wybór.                                                    |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której należy przekazać sterowanie.                           |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru uwierzytelniania używany przez onboarding i przepływy CLI.               |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje `choiceId`.                |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                  |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.       |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór przed selektorami asystenta, jednocześnie nadal pozwalając na ręczny wybór w CLI.         |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyboru, które powinny przekierowywać użytkowników do tego wyboru zastępczego.   |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                      |
| `groupLabel`          | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                            |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                      |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                         |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                    |
| `cliOption`           | Nie      | `string`                                        | Pełna postać opcji CLI, na przykład `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                              |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Na których powierzchniach onboardingu ten wybór powinien się pojawiać. Jeśli pole zostanie pominięte, domyślnie używane jest `["text-inference"]`. |

## Informacje o `commandAliases`

Używaj `commandAliases`, gdy Plugin jest właścicielem nazwy polecenia środowiska wykonawczego, którą użytkownicy mogą
omyłkowo umieścić w `plugins.allow` albo próbować uruchomić jako główne polecenie CLI. OpenClaw
używa tych metadanych do diagnostyki bez importowania kodu środowiska wykonawczego Plugin.

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

| Pole         | Wymagane | Typ               | Co oznacza                                                               |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Tak      | `string`          | Nazwa polecenia należąca do tego Plugin.                                 |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash czatu, a nie główne polecenie CLI.    |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI sugerowane dla operacji CLI, jeśli istnieje. |

## Informacje o `activation`

Używaj `activation`, gdy Plugin może w tani sposób zadeklarować, które zdarzenia control-plane
powinny aktywować go później.

## Informacje o `qaRunners`

Używaj `qaRunners`, gdy Plugin wnosi jeden lub więcej runnerów transportu pod
współdzielonym katalogiem głównym `openclaw qa`. Te metadane powinny być lekkie i statyczne; środowisko
wykonawcze Plugin nadal odpowiada za faktyczną rejestrację CLI przez lekką
powierzchnię `runtime-api.ts`, która eksportuje `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Uruchom opartą na Dockerze aktywną ścieżkę QA Matrix względem jednorazowego homeservera"
    }
  ]
}
```

| Pole          | Wymagane | Typ      | Co oznacza                                                          |
| ------------- | -------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.     |
| `description` | Nie      | `string` | Zastępczy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia zastępczego. |

Ten blok zawiera wyłącznie metadane. Nie rejestruje zachowania środowiska wykonawczego i nie
zastępuje `register(...)`, `setupEntry` ani innych entrypointów środowiska wykonawczego/Plugin.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem Plugin, więc
brak metadanych aktywacji zwykle wpływa tylko na wydajność; nie powinien
zmieniać poprawności, dopóki nadal istnieją starsze mechanizmy rezerwowe własności manifestu.

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
| `onProviders`    | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny aktywować ten Plugin po zażądaniu. |
| `onCommands`     | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny aktywować ten Plugin.       |
| `onChannels`     | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny aktywować ten Plugin.       |
| `onRoutes`       | Nie      | `string[]`                                           | Rodzaje tras, które powinny aktywować ten Plugin.                 |
| `onCapabilities` | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Ogólne wskazówki capabilities używane przez planowanie aktywacji control-plane. |

Obecni aktywni konsumenci:

- planowanie CLI wyzwalane poleceniem wraca do starszego
  `commandAliases[].cliCommand` albo `commandAliases[].name`
- planowanie konfiguracji/kanału wyzwalane kanałem wraca do starszej własności
  `channels[]`, gdy brakuje jawnych metadanych aktywacji kanału
- planowanie konfiguracji/środowiska wykonawczego wyzwalane dostawcą wraca do starszej
  własności `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych aktywacji dostawcy

## Informacje o `setup`

Używaj `setup`, gdy powierzchnie konfiguracji i onboardingu potrzebują lekkich metadanych należących do Plugin
przed załadowaniem środowiska wykonawczego.

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

Pole najwyższego poziomu `cliBackends` pozostaje prawidłowe i nadal opisuje backendy inferencji CLI.
`setup.cliBackends` to powierzchnia deskryptorów specyficzna dla setup dla
przepływów control-plane/setup, które powinny pozostać wyłącznie metadanymi.

Gdy są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania opartą najpierw na deskryptorach dla wykrywania setup. Jeśli deskryptor tylko
zawęża kandydacki Plugin, a setup nadal potrzebuje bogatszych hooków środowiska wykonawczego czasu setup,
ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
zastępczą ścieżkę wykonania.

Ponieważ wyszukiwanie setup może wykonywać kod `setup-api` należący do Plugin,
znormalizowane wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne globalnie wśród
wykrytych Plugin. Niejednoznaczna własność kończy się bezpieczną odmową zamiast wybierania
zwycięzcy na podstawie kolejności wykrywania.

### Informacje o `setup.providers`

| Pole          | Wymagane | Typ        | Co oznacza                                                                            |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Tak      | `string`   | Identyfikator dostawcy udostępniany podczas setup lub onboardingu. Znormalizowane identyfikatory muszą być globalnie unikalne. |
| `authMethods` | Nie      | `string[]` | Identyfikatory metod setup/uwierzytelniania obsługiwanych przez tego dostawcę bez ładowania pełnego środowiska wykonawczego. |
| `envVars`     | Nie      | `string[]` | Zmienne env, które generyczne powierzchnie setup/status mogą sprawdzać przed załadowaniem środowiska wykonawczego Plugin. |

### Pola `setup`

| Pole               | Wymagane | Typ        | Co oznacza                                                                                              |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory setup dostawców udostępniane podczas setup i onboardingu.                                  |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów czasu setup używane przy wyszukiwaniu setup opartym najpierw na deskryptorach. Znormalizowane identyfikatory muszą być globalnie unikalne. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni setup tego Plugin.                        |
| `requiresRuntime`  | Nie      | `boolean`  | Czy setup nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                                |

## Informacje o `uiHints`

`uiHints` to mapa od nazw pól konfiguracji do niewielkich wskazówek renderowania.

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
| `tags`        | `string[]` | Opcjonalne tagi interfejsu.              |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.          |
| `sensitive`   | `boolean`  | Oznacza pole jako tajne lub wrażliwe.    |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.   |

## Informacje o `contracts`

Używaj `contracts` tylko dla statycznych metadanych własności capabilities, które OpenClaw może
odczytać bez importowania środowiska wykonawczego Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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

| Pole                             | Typ        | Co oznacza                                                             |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory osadzonego środowiska wykonawczego, dla których dołączony Plugin może rejestrować fabryki. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy, których właścicielem jest ten Plugin.   |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym, których właścicielem jest ten Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym, których właścicielem jest ten Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia mediów, których właścicielem jest ten Plugin. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów, których właścicielem jest ten Plugin. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo, których właścicielem jest ten Plugin. |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców web-fetch, których właścicielem jest ten Plugin. |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców web search, których właścicielem jest ten Plugin. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta, których właścicielem jest ten Plugin na potrzeby kontroli kontraktów dla dołączonych Plugin. |

## Informacje o `mediaUnderstandingProviderMetadata`

Używaj `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia mediów ma
domyślne modele, priorytet zastępczy auto-auth albo natywną obsługę dokumentów, której
generyczne helpery rdzenia potrzebują przed załadowaniem środowiska wykonawczego. Klucze muszą też być zadeklarowane w
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Każdy wpis dostawcy może zawierać:

| Pole                   | Typ                                 | Co oznacza                                                                  |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capabilities mediów udostępniane przez tego dostawcę.                       |
| `defaultModels`        | `Record<string, string>`            | Domyślne mapowania capability do modelu używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby są sortowane wcześniej przy automatycznym zastępczym wyborze dostawcy opartym na poświadczeniach. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez dostawcę.                       |

## Informacje o `channelConfigs`

Używaj `channelConfigs`, gdy Plugin kanału potrzebuje lekkich metadanych konfiguracji przed
załadowaniem środowiska wykonawczego.

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
          "label": "Adres URL homeservera",
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

| Pole          | Typ                      | Co oznacza                                                                                  |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety interfejsu/placeholdery/wskazówki wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami selektora i inspekcji, gdy metadane środowiska wykonawczego nie są jeszcze gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                     |
| `preferOver`  | `string[]`               | Identyfikatory starszych lub niżej priorytetyzowanych Plugin, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Informacje o `modelSupport`

Używaj `modelSupport`, gdy OpenClaw ma wywnioskować Plugin dostawcy na podstawie
skróconych identyfikatorów modeli, takich jak `gpt-5.4` lub `claude-sonnet-4.6`, przed załadowaniem środowiska wykonawczego Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następujący priorytet:

- jawne referencje `provider/model` używają metadanych manifestu `providers` należących do właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli jeden niedołączony Plugin i jeden dołączony Plugin oba pasują, wygrywa niedołączony
  Plugin
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Co oznacza                                                                    |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skróconych identyfikatorów modeli. |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

Starsze klucze capability najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` do `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności capability.

## Manifest a package.json

Te dwa pliki służą do różnych zadań:

| Plik                   | Używaj go do                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywania, walidacji konfiguracji, metadanych wyboru uwierzytelniania i wskazówek interfejsu, które muszą istnieć przed uruchomieniem kodu Plugin |
| `package.json`         | Metadanych npm, instalacji zależności i bloku `openclaw` używanego dla entrypointów, bramkowania instalacji, setup lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien trafić dany fragment metadanych, zastosuj tę zasadę:

- jeśli OpenClaw musi znać te dane przed załadowaniem kodu Plugin, umieść je w `openclaw.plugin.json`
- jeśli dotyczą pakowania, plików wejściowych lub zachowania instalacji npm, umieść je w `package.json`

### Pola `package.json`, które wpływają na wykrywanie

Część metadanych Plugin sprzed uruchomienia celowo znajduje się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Co oznacza                                                                                                                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Deklaruje natywne entrypointy Plugin. Muszą pozostać wewnątrz katalogu pakietu Plugin.                                                                                              |
| `openclaw.runtimeExtensions`                                      | Deklaruje entrypointy zbudowanego środowiska wykonawczego JavaScript dla zainstalowanych pakietów. Muszą pozostać wewnątrz katalogu pakietu Plugin.                                |
| `openclaw.setupEntry`                                             | Lekki entrypoint tylko do setup używany podczas onboardingu, odroczonego uruchamiania kanału oraz odkrywania statusu kanału/SecretRef tylko do odczytu. Musi pozostać wewnątrz katalogu pakietu Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Deklaruje entrypoint setup zbudowanego JavaScript dla zainstalowanych pakietów. Musi pozostać wewnątrz katalogu pakietu Plugin.                                                   |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i teksty dla wyboru.                                                                            |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania stanu skonfigurowania, które potrafią odpowiedzieć na pytanie „czy konfiguracja oparta wyłącznie na env już istnieje?” bez ładowania pełnego środowiska wykonawczego kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania utrwalonego stanu uwierzytelnienia, które potrafią odpowiedzieć na pytanie „czy cokolwiek jest już zalogowane?” bez ładowania pełnego środowiska wykonawczego kanału. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla dołączonych i publikowanych zewnętrznie Plugin.                                                                                              |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                       |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, z użyciem dolnego ograniczenia semver, takiego jak `>=2026.3.22`.                                                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | Umożliwia wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego Plugin, gdy konfiguracja jest nieprawidłowa.                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala ładować powierzchnie kanału tylko do setup przed pełnym Plugin kanału podczas uruchamiania.                                                                                |

`openclaw.install.minHostVersion` jest wymuszane podczas instalacji i ładowania
rejestru manifestu. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości powodują pominięcie
Plugin na starszych hostach.

Plugin kanałów powinny dostarczać `openclaw.setupEntry`, gdy status, lista kanałów
lub skany SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego
środowiska wykonawczego. Entrypoint setup powinien udostępniać metadane kanału oraz bezpieczne dla setup adaptery konfiguracji,
statusu i sekretów; klientów sieciowych, listenerów Gateway i środowiska wykonawcze transportu należy trzymać w głównym entrypoincie rozszerzenia.

Pola entrypointów środowiska wykonawczego nie zastępują kontroli granic pakietu dla pól
entrypointów źródłowych. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że
wychodząca poza granice ścieżka `openclaw.extensions` stanie się ładowalna.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolnie uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala jedynie
przepływom instalacji odzyskać stan po określonych przestarzałych awariach aktualizacji dołączonych Plugin, takich jak
brakująca ścieżka dołączonego Plugin albo nieaktualny wpis `channels.<id>` dla tego samego
dołączonego Plugin. Niezwiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
do `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` to metadane pakietu dla małego modułu
sprawdzającego:

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

Używaj tego, gdy przepływy setup, doctor albo configured-state potrzebują taniego sprawdzenia
uwierzytelniania typu tak/nie przed załadowaniem pełnego Plugin kanału. Docelowy eksport powinien być małą
funkcją, która odczytuje tylko stan utrwalony; nie kieruj tego przez pełny barrel
środowiska wykonawczego kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla tanich kontroli
skonfigurowania opartych wyłącznie na env:

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

Używaj tego, gdy kanał może określić configured-state na podstawie env lub innych małych
wejść niezwiązanych ze środowiskiem wykonawczym. Jeśli kontrola wymaga pełnego rozstrzygnięcia konfiguracji albo rzeczywistego
środowiska wykonawczego kanału, pozostaw tę logikę w hooku Plugin `config.hasConfiguredState`.

## Priorytet wykrywania (zduplikowane identyfikatory Plugin)

OpenClaw wykrywa Plugin z kilku katalogów głównych (dołączone, instalacja globalna, workspace, jawne ścieżki wybrane przez konfigurację). Jeśli dwa wykrycia mają ten sam `id`, zachowywany jest tylko manifest o **najwyższym priorytecie**; duplikaty o niższym priorytecie są odrzucane zamiast ładowania ich obok niego.

Priorytet, od najwyższego do najniższego:

1. **Wybrane przez konfigurację** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Dołączone** — Plugin dostarczane z OpenClaw
3. **Instalacja globalna** — Plugin zainstalowane w globalnym katalogu głównym Plugin OpenClaw
4. **Workspace** — Plugin wykryte względem bieżącego workspace

Konsekwencje:

- Rozwidlenie albo nieaktualna kopia dołączonego Plugin znajdująca się w workspace nie przesłoni dołączonej kompilacji.
- Aby rzeczywiście zastąpić dołączony Plugin lokalnym, przypnij go przez `plugins.entries.<id>`, tak aby wygrał dzięki priorytetowi, zamiast polegać na wykrywaniu w workspace.
- Odrzucenia duplikatów są rejestrowane w logach, aby Doctor i diagnostyka uruchamiania mogły wskazać odrzuconą kopię.

## Wymagania JSON Schema

- **Każdy Plugin musi dostarczać JSON Schema**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w czasie działania.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału jest zadeklarowany przez
  manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów Plugin. Nieznane identyfikatory są **błędami**.
- Jeśli Plugin jest zainstalowany, ale ma uszkodzony albo brakujący manifest lub schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd Plugin.
- Jeśli konfiguracja Plugin istnieje, ale Plugin jest **wyłączony**, konfiguracja jest zachowywana i
  wyświetlane jest **ostrzeżenie** w Doctor + logach.

Pełny schemat `plugins.*` znajdziesz w [Dokumentacji konfiguracji](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych Plugin OpenClaw**, w tym dla ładowania z lokalnego systemu plików.
- Środowisko wykonawcze nadal ładuje moduł Plugin oddzielnie; manifest służy wyłącznie do
  wykrywania + walidacji.
- Natywne manifesty są parsowane przy użyciu JSON5, więc komentarze, końcowe przecinki i
  klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestu odczytuje tylko udokumentowane pola manifestu. Unikaj dodawania
  tutaj niestandardowych kluczy najwyższego poziomu.
- `providerAuthEnvVars` to tania ścieżka metadanych dla sprawdzeń uwierzytelniania, walidacji
  znaczników env i podobnych powierzchni uwierzytelniania dostawcy, które nie powinny uruchamiać środowiska wykonawczego Plugin
  tylko po to, by sprawdzić nazwy env.
- `providerAuthAliases` pozwala wariantom dostawcy ponownie używać env vars uwierzytelniania,
  profili uwierzytelniania, uwierzytelniania opartego na konfiguracji i wyboru onboardingu klucza API innego dostawcy
  bez zakodowywania tej relacji na stałe w rdzeniu.
- `providerEndpoints` pozwala Plugin dostawców być właścicielem prostych metadanych dopasowania host/baseUrl
  punktu końcowego. Używaj tego tylko dla klas punktów końcowych już obsługiwanych przez rdzeń;
  Plugin nadal odpowiada za zachowanie środowiska wykonawczego.
- `syntheticAuthRefs` to tania ścieżka metadanych dla należących do dostawcy hooków
  syntetycznego uwierzytelniania, które muszą być widoczne dla zimnego wykrywania modeli, zanim rejestr
  środowiska wykonawczego zacznie istnieć. Wymieniaj tylko te referencje, których środowisko wykonawcze dostawcy albo backend CLI
  rzeczywiście implementuje `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` to tania ścieżka metadanych dla należących do dołączonego Plugin
  zastępczych kluczy API, takich jak znaczniki lokalnych, OAuth albo ambient credentials.
  Rdzeń traktuje je jako niejawnne sekrety na potrzeby wyświetlania uwierzytelniania i audytów sekretów bez
  zakodowywania właściciela dostawcy na stałe.
- `channelEnvVars` to tania ścieżka metadanych dla zastępczego użycia shell-env, promptów setup
  i podobnych powierzchni kanału, które nie powinny uruchamiać środowiska wykonawczego Plugin
  tylko po to, by sprawdzić nazwy env. Nazwy env są metadanymi, a nie aktywacją
  samą w sobie: status, audyt, walidacja dostarczania Cron i inne powierzchnie tylko do odczytu
  nadal stosują zasady zaufania do Plugin i efektywnej aktywacji, zanim
  potraktują zmienną env jako skonfigurowany kanał.
- `providerAuthChoices` to tania ścieżka metadanych dla selektorów wyboru uwierzytelniania,
  rozstrzygania `--auth-choice`, mapowania preferowanego dostawcy i prostej rejestracji
  flag CLI onboardingu przed załadowaniem środowiska wykonawczego dostawcy. Informacje o metadanych wizarda środowiska wykonawczego,
  które wymagają kodu dostawcy, znajdziesz w
  [Hooki środowiska wykonawczego dostawcy](/pl/plugins/architecture#provider-runtime-hooks).
- Wyłączne rodzaje Plugin są wybierane przez `plugins.slots.*`.
  - `kind: "memory"` jest wybierane przez `plugins.slots.memory`.
  - `kind: "context-engine"` jest wybierane przez `plugins.slots.contextEngine`
    (domyślnie: wbudowane `legacy`).
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy
  Plugin ich nie potrzebuje.
- Jeśli Plugin zależy od modułów natywnych, udokumentuj kroki kompilacji i wszelkie
  wymagania dotyczące listy dozwolonych menedżera pakietów (na przykład pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Powiązane

- [Tworzenie Plugin](/pl/plugins/building-plugins) — wprowadzenie do Plugin
- [Architektura Plugin](/pl/plugins/architecture) — architektura wewnętrzna
- [Przegląd SDK](/pl/plugins/sdk-overview) — dokumentacja SDK Plugin
