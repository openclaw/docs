---
read_when:
    - Budujesz Plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji Pluginu albo debugować błędy walidacji Pluginu
summary: Wymagania dotyczące manifestu Pluginu + schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Pluginu
x-i18n:
    generated_at: "2026-04-24T09:22:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

Ta strona dotyczy wyłącznie **natywnego manifestu Pluginu OpenClaw**.

Informacje o zgodnych układach pakietów znajdziesz w sekcji [Pakiety Pluginów](/pl/plugins/bundles).

Zgodne formaty pakietów używają innych plików manifestu:

- Pakiet Codex: `.codex-plugin/plugin.json`
- Pakiet Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentów Claude
  bez manifestu
- Pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa również te układy pakietów, ale nie są one walidowane
względem opisanego tutaj schematu `openclaw.plugin.json`.

W przypadku zgodnych pakietów OpenClaw obecnie odczytuje metadane pakietu oraz zadeklarowane
katalogi główne Skills, katalogi główne poleceń Claude, domyślne wartości `settings.json` pakietu Claude,
domyślne ustawienia LSP pakietu Claude oraz obsługiwane zestawy hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym Pluginu**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Pluginu**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Pluginu i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Pluginów: [Pluginy](/pl/tools/plugin).
Informacje o natywnym modelu możliwości i aktualnych wytycznych zgodności z zewnętrznymi systemami:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje **zanim załaduje kod
Twojego Pluginu**. Wszystko poniżej musi być na tyle lekkie, aby można to było sprawdzić bez uruchamiania
środowiska wykonawczego Pluginu.

**Używaj go do:**

- tożsamości Pluginu, walidacji konfiguracji i wskazówek dla interfejsu konfiguracji
- metadanych uwierzytelniania, onboardingu i konfiguracji początkowej (alias, automatyczne włączanie, zmienne środowiskowe dostawcy, opcje uwierzytelniania)
- wskazówek aktywacji dla powierzchni control-plane
- skróconego przypisania rodzin modeli
- statycznych migawek przypisania możliwości (`contracts`)
- metadanych uruchamiacza QA, które współdzielony host `openclaw qa` może sprawdzić
- metadanych konfiguracji specyficznych dla kanału, scalanych z katalogiem i powierzchniami walidacji

**Nie używaj go do:** rejestrowania zachowania w czasie wykonywania, deklarowania punktów wejścia kodu
ani metadanych instalacji npm. To należy umieścić w kodzie Pluginu i w `package.json`.

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

| Pole                                 | Wymagane | Typ                              | Co oznacza                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Tak      | `string`                         | Kanoniczny identyfikator Pluginu. To jest identyfikator używany w `plugins.entries.<id>`.                                                                                                                                       |
| `configSchema`                       | Tak      | `object`                         | Wbudowany schemat JSON Schema dla konfiguracji tego Pluginu.                                                                                                                                                                     |
| `enabledByDefault`                   | Nie      | `true`                           | Oznacza Plugin dołączony do pakietu jako domyślnie włączony. Pomiń to pole lub ustaw dowolną wartość inną niż `true`, aby pozostawić Plugin domyślnie wyłączony.                                                              |
| `legacyPluginIds`                    | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora Pluginu.                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten Plugin, gdy uwierzytelnianie, konfiguracja lub odwołania do modeli o nich wspominają.                                                                        |
| `kind`                               | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj Pluginu używany przez `plugins.slots.*`.                                                                                                                                                              |
| `channels`                           | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego Pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                                              |
| `providers`                          | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego Pluginu.                                                                                                                                                                             |
| `providerDiscoveryEntry`             | Nie      | `string`                         | Lekka ścieżka modułu wykrywania dostawcy, względna względem katalogu głównego Pluginu, dla metadanych katalogu dostawców o zakresie manifestu, które można załadować bez aktywowania pełnego środowiska wykonawczego Pluginu. |
| `modelSupport`                       | Nie      | `object`                         | Należące do manifestu skrótowe metadane rodziny modeli używane do automatycznego załadowania Pluginu przed uruchomieniem.                                                                                                      |
| `providerEndpoints`                  | Nie      | `object[]`                       | Należące do manifestu metadane hostów/podstawowych adresów URL punktów końcowych dla tras dostawcy, które rdzeń musi sklasyfikować przed załadowaniem środowiska wykonawczego dostawcy.                                        |
| `cliBackends`                        | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego Pluginu. Używane do automatycznej aktywacji przy uruchamianiu na podstawie jawnych odwołań w konfiguracji.                                                          |
| `syntheticAuthRefs`                  | Nie      | `string[]`                       | Odwołania do dostawców lub backendów CLI, których należący do Pluginu syntetyczny hook uwierzytelniania powinien być sprawdzany podczas zimnego wykrywania modeli przed załadowaniem środowiska wykonawczego.                |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                       | Wartości zastępczych kluczy API należących do Pluginów dołączonych do pakietu, które reprezentują niejawną lokalną, OAuth lub ambient credential state.                                                                         |
| `commandAliases`                     | Nie      | `object[]`                       | Nazwy poleceń należące do tego Pluginu, które powinny generować diagnostykę konfiguracji i CLI uwzględniającą Plugin przed załadowaniem środowiska wykonawczego.                                                                |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych uwierzytelniania dostawców, które OpenClaw może sprawdzić bez ładowania kodu Pluginu.                                                                                                 |
| `providerAuthAliases`                | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący klucz API i profile uwierzytelniania dostawcy bazowego. |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych kanału, które OpenClaw może sprawdzić bez ładowania kodu Pluginu. Używaj tego do konfiguracji kanału sterowanej zmiennymi środowiskowymi lub powierzchni uwierzytelniania, które powinny być widoczne dla ogólnych pomocników uruchamiania/konfiguracji. |
| `providerAuthChoices`                | Nie      | `object[]`                       | Lekkie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego powiązania flag CLI.                                                                                        |
| `activation`                         | Nie      | `object`                         | Lekkie metadane planera aktywacji dla ładowania wyzwalanego przez dostawcę, polecenie, kanał, trasę i możliwości. Tylko metadane; rzeczywiste zachowanie nadal należy do środowiska wykonawczego Pluginu.                    |
| `setup`                              | Nie      | `object`                         | Lekkie deskryptory konfiguracji początkowej/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania środowiska wykonawczego Pluginu.                                                            |
| `qaRunners`                          | Nie      | `object[]`                       | Lekkie deskryptory uruchamiaczy QA używane przez współdzielony host `openclaw qa` przed załadowaniem środowiska wykonawczego Pluginu.                                                                                           |
| `contracts`                          | Nie      | `object`                         | Statyczna migawka możliwości dołączonych do pakietu dla zewnętrznych hooków uwierzytelniania, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów, generowania obrazów, generowania muzyki, generowania wideo, pobierania z sieci, wyszukiwania w sieci i własności narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`         | Lekkie wartości domyślne rozumienia mediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                              |
| `channelConfigs`                     | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału scalane z powierzchniami wykrywania i walidacji przed załadowaniem środowiska wykonawczego.                                                                                  |
| `skills`                             | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego Pluginu.                                                                                                                                                    |
| `name`                               | Nie      | `string`                         | Czytelna dla człowieka nazwa Pluginu.                                                                                                                                                                                            |
| `description`                        | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach Pluginu.                                                                                                                                                                      |
| `version`                            | Nie      | `string`                         | Informacyjna wersja Pluginu.                                                                                                                                                                                                     |
| `uiHints`                            | Nie      | `Record<string, object>`         | Etykiety interfejsu, placeholdery i wskazówki dotyczące wrażliwości dla pól konfiguracji.                                                                                                                                        |

## Odwołanie do `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem środowiska wykonawczego dostawcy.

| Pole                  | Wymagane | Typ                                             | Co oznacza                                                                                                 |
| --------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ten wybór.                                                       |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której należy przekazać sterowanie.                              |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru uwierzytelniania używany przez onboarding i przepływy CLI.                  |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje wartości `choiceId`.          |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                     |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.          |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór w selektorach asystenta, nadal pozwalając na ręczny wybór w CLI.                             |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyboru, które powinny przekierowywać użytkowników do tego zastępczego wyboru.      |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                          |
| `groupLabel`          | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                               |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                         |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania opartych na jednej fladze.               |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                       |
| `cliOption`           | Nie      | `string`                                        | Pełna postać opcji CLI, na przykład `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                                 |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Na których powierzchniach onboardingu ten wybór powinien się pojawiać. Jeśli zostanie pominięte, domyślnie jest ustawiane `["text-inference"]`. |

## Odwołanie do `commandAliases`

Używaj `commandAliases`, gdy Plugin jest właścicielem nazwy polecenia środowiska wykonawczego, którą użytkownicy mogą
omyłkowo umieszczać w `plugins.allow` lub próbować uruchamiać jako główne polecenie CLI. OpenClaw
używa tych metadanych do diagnostyki bez importowania kodu środowiska wykonawczego Pluginu.

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

| Pole         | Wymagane | Typ               | Co oznacza                                                                     |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------------ |
| `name`       | Tak      | `string`          | Nazwa polecenia należącego do tego Pluginu.                                    |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash na czacie, a nie główne polecenie CLI.      |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI sugerowane dla operacji CLI, jeśli istnieje.    |

## Odwołanie do `activation`

Używaj `activation`, gdy Plugin może w tani sposób zadeklarować, które zdarzenia control-plane
powinny uwzględniać go w planie aktywacji/ładowania.

Ten blok to metadane planera, a nie API cyklu życia. Nie rejestruje
zachowania środowiska wykonawczego, nie zastępuje `register(...)` i nie obiecuje, że
kod Pluginu został już wykonany. Planer aktywacji używa tych pól do
zawężania kandydatów Pluginów przed przejściem do istniejących metadanych własności manifestu,
takich jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki.

Preferuj najwęższe metadane, które już opisują własność. Używaj
`providers`, `channels`, `commandAliases`, deskryptorów konfiguracji początkowej lub `contracts`,
gdy te pola wyrażają daną relację. Używaj `activation` dla dodatkowych wskazówek planera,
których nie da się przedstawić za pomocą tych pól własności.

Ten blok zawiera wyłącznie metadane. Nie rejestruje zachowania środowiska wykonawczego i
nie zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia środowiska wykonawczego/Pluginu.
Obecni konsumenci używają go jako wskazówki do zawężania przed szerszym ładowaniem Pluginów, więc
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

| Pole             | Wymagane | Typ                                                  | Co oznacza                                                                                                 |
| ---------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.             |
| `onCommands`     | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.               |
| `onChannels`     | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.               |
| `onRoutes`       | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                         |
| `onCapabilities` | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki dotyczące możliwości używane przez planowanie aktywacji control-plane. Gdy to możliwe, preferuj węższe pola. |

Obecni aktywni konsumenci:

- planowanie CLI wyzwalane poleceniem wraca do starszego
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie konfiguracji/kanału wyzwalane kanałem wraca do starszej własności
  `channels[]`, gdy brakuje jawnych metadanych aktywacji kanału
- planowanie konfiguracji/środowiska wykonawczego wyzwalane dostawcą wraca do starszej
  własności `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych
  aktywacji dostawcy

Diagnostyka planera może odróżniać jawne wskazówki aktywacji od fallbacku
własności manifestu. Na przykład `activation-command-hint` oznacza, że
dopasowano `activation.onCommands`, a `manifest-command-alias` oznacza, że
planer użył zamiast tego własności `commandAliases`. Te etykiety przyczyn są przeznaczone dla
diagnostyki hosta i testów; autorzy Pluginów powinni nadal deklarować metadane,
które najlepiej opisują własność.

## Odwołanie do `qaRunners`

Używaj `qaRunners`, gdy Plugin udostępnia co najmniej jeden runner transportu pod
współdzielonym korzeniem `openclaw qa`. Utrzymuj te metadane jako tanie i statyczne; środowisko wykonawcze Pluginu
nadal odpowiada za rzeczywistą rejestrację CLI przez lekką
powierzchnię `runtime-api.ts`, która eksportuje `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Uruchom ścieżkę live QA Matrix opartą na Dockerze względem jednorazowego homeserwera"
    }
  ]
}
```

| Pole          | Wymagane | Typ      | Co oznacza                                                               |
| ------------- | -------- | -------- | ------------------------------------------------------------------------ |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.          |
| `description` | Nie      | `string` | Zastępczy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia stub. |

## Odwołanie do `setup`

Używaj `setup`, gdy powierzchnie konfiguracji początkowej i onboardingu potrzebują tanich metadanych należących do Pluginu
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

Najwyższy poziom `cliBackends` pozostaje prawidłowy i nadal opisuje backendy
inferencji CLI. `setup.cliBackends` to powierzchnia deskryptorów specyficzna dla konfiguracji początkowej
dla przepływów control-plane/setup, które powinny pozostać wyłącznie metadanymi.

Jeśli są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania konfiguracji początkowej opartą najpierw na deskryptorach. Jeśli deskryptor tylko
zawęża kandydujący Plugin, a konfiguracja początkowa nadal wymaga bogatszych hooków środowiska wykonawczego w czasie konfiguracji,
ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
zapasową ścieżkę wykonania.

Ponieważ wyszukiwanie konfiguracji początkowej może wykonywać należący do Pluginu kod `setup-api`,
znormalizowane wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne we wszystkich
wykrytych Pluginach. Niejednoznaczna własność kończy się bezpieczną odmową zamiast wybierania
zwycięzcy na podstawie kolejności wykrywania.

### Odwołanie do `setup.providers`

| Pole          | Wymagane | Typ        | Co oznacza                                                                                 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Tak      | `string`   | Identyfikator dostawcy udostępniany podczas konfiguracji początkowej lub onboardingu. Zachowaj globalnie unikalne znormalizowane identyfikatory. |
| `authMethods` | Nie      | `string[]` | Identyfikatory metod konfiguracji początkowej/uwierzytelniania obsługiwanych przez tego dostawcę bez ładowania pełnego środowiska wykonawczego. |
| `envVars`     | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie konfiguracji/stanu mogą sprawdzać przed załadowaniem środowiska wykonawczego Pluginu. |

### Pola `setup`

| Pole               | Wymagane | Typ        | Co oznacza                                                                                           |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji początkowej dostawców udostępniane podczas konfiguracji początkowej i onboardingu. |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów czasu konfiguracji początkowej używane do wyszukiwania konfiguracji początkowej opartego najpierw na deskryptorach. Zachowaj globalnie unikalne znormalizowane identyfikatory. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji początkowej tego Pluginu. |
| `requiresRuntime`  | Nie      | `boolean`  | Czy konfiguracja początkowa nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.           |

## Odwołanie do `uiHints`

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

| Pole          | Typ        | Co oznacza                              |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika. |
| `help`        | `string`   | Krótki tekst pomocniczy.                |
| `tags`        | `string[]` | Opcjonalne tagi interfejsu.             |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.         |
| `sensitive`   | `boolean`  | Oznacza pole jako tajne lub wrażliwe.   |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.  |

## Odwołanie do `contracts`

Używaj `contracts` tylko dla statycznych metadanych własności możliwości, które OpenClaw może
odczytać bez importowania środowiska wykonawczego Pluginu.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| Pole                             | Typ        | Co oznacza                                                              |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory osadzonych środowisk wykonawczych, dla których dołączony Plugin może rejestrować fabryki. |
| `externalAuthProviders`          | `string[]` | Identyfikatory dostawców, których hook zewnętrznego profilu uwierzytelniania należy do tego Pluginu. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należące do tego Pluginu.                 |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należące do tego Pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należące do tego Pluginu. |
| `memoryEmbeddingProviders`       | `string[]` | Identyfikatory dostawców osadzania pamięci należące do tego Pluginu.    |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia mediów należące do tego Pluginu.    |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należące do tego Pluginu.  |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należące do tego Pluginu.    |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania z sieci należące do tego Pluginu.   |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania w sieci należące do tego Pluginu. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należące do tego Pluginu na potrzeby kontroli kontraktów dołączonych do pakietu. |

Pluginy dostawców implementujące `resolveExternalAuthProfiles` powinny deklarować
`contracts.externalAuthProviders`. Pluginy bez tej deklaracji nadal działają
przez przestarzały fallback zgodności, ale ten fallback jest wolniejszy i
zostanie usunięty po zakończeniu okna migracji.

Dołączone do pakietu dostawcy osadzania pamięci powinni deklarować
`contracts.memoryEmbeddingProviders` dla każdego identyfikatora adaptera, który udostępniają, w tym
wbudowanych adapterów, takich jak `local`. Samodzielne ścieżki CLI używają tego kontraktu
manifestu, aby załadować tylko właściciela Pluginu, zanim pełne środowisko wykonawcze Gateway
zarejestruje dostawców.

## Odwołanie do `mediaUnderstandingProviderMetadata`

Używaj `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia mediów ma
modele domyślne, priorytet fallbacku automatycznego uwierzytelniania lub natywną obsługę dokumentów, których
ogólne pomocniki rdzenia potrzebują przed załadowaniem środowiska wykonawczego. Klucze muszą być także zadeklarowane w
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Możliwości mediów udostępniane przez tego dostawcę.                          |
| `defaultModels`        | `Record<string, string>`            | Domyślne mapowania możliwości na modele używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby są sortowane wcześniej dla automatycznego fallbacku dostawcy opartego na poświadczeniach. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez dostawcę.                       |

## Odwołanie do `channelConfigs`

Używaj `channelConfigs`, gdy Plugin kanału potrzebuje tanich metadanych konfiguracji przed
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
          "label": "Adres URL homeserwera",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Połączenie z homeserwerem Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Każdy wpis kanału może zawierać:

| Pole          | Typ                      | Co oznacza                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety interfejsu/placeholdery/wskazówki dotyczące wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami selektora i inspekcji, gdy metadane środowiska wykonawczego nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                    |
| `preferOver`  | `string[]`               | Identyfikatory starszych lub niżej priorytetyzowanych Pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Odwołanie do `modelSupport`

Używaj `modelSupport`, gdy OpenClaw powinien wywnioskować Twój Plugin dostawcy z
krótkich identyfikatorów modeli, takich jak `gpt-5.5` lub `claude-sonnet-4.6`, zanim środowisko wykonawcze Pluginu
zostanie załadowane.

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
- jeśli jeden niedołączony do pakietu Plugin i jeden dołączony do pakietu Plugin pasują jednocześnie, wygrywa niedołączony do pakietu Plugin
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Co oznacza                                                                      |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skróconych identyfikatorów modeli.   |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

Starsze klucze możliwości najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` do `contracts`; normalne
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności możliwości.

## Manifest a package.json

Te dwa pliki pełnią różne role:

| Plik                   | Używaj go do                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywania, walidacji konfiguracji, metadanych wyboru uwierzytelniania i wskazówek interfejsu, które muszą istnieć przed uruchomieniem kodu Pluginu |
| `package.json`         | Metadanych npm, instalacji zależności oraz bloku `openclaw` używanego dla punktów wejścia, bramkowania instalacji, konfiguracji początkowej lub metadanych katalogu |

Jeśli nie masz pewności, gdzie należy umieścić dany element metadanych, stosuj tę zasadę:

- jeśli OpenClaw musi znać go przed załadowaniem kodu Pluginu, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść go w `package.json`

### Pola `package.json`, które wpływają na wykrywanie

Niektóre metadane Pluginu sprzed uruchomienia celowo znajdują się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Co oznacza                                                                                                                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Deklaruje natywne punkty wejścia Pluginu. Muszą pozostać wewnątrz katalogu pakietu Pluginu.                                                                                         |
| `openclaw.runtimeExtensions`                                      | Deklaruje zbudowane punkty wejścia środowiska wykonawczego JavaScript dla zainstalowanych pakietów. Muszą pozostać wewnątrz katalogu pakietu Pluginu.                              |
| `openclaw.setupEntry`                                             | Lekki punkt wejścia wyłącznie do konfiguracji początkowej używany podczas onboardingu, odroczonego uruchamiania kanału oraz wykrywania statusu kanału/SecretRef tylko do odczytu. Musi pozostać wewnątrz katalogu pakietu Pluginu. |
| `openclaw.runtimeSetupEntry`                                      | Deklaruje zbudowany punkt wejścia konfiguracji początkowej JavaScript dla zainstalowanych pakietów. Musi pozostać wewnątrz katalogu pakietu Pluginu.                               |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanałów, takie jak etykiety, ścieżki do dokumentacji, aliasy i teksty do wyboru.                                                                          |
| `openclaw.channel.configuredState`                                | Lekkie metadane modułu sprawdzania stanu konfiguracji, które mogą odpowiedzieć na pytanie „czy konfiguracja oparta wyłącznie na zmiennych środowiskowych już istnieje?” bez ładowania pełnego środowiska wykonawczego kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane modułu sprawdzania utrwalonego stanu uwierzytelniania, które mogą odpowiedzieć na pytanie „czy coś jest już zalogowane?” bez ładowania pełnego środowiska wykonawczego kanału. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla Pluginów dołączonych do pakietu i publikowanych zewnętrznie.                                                                                  |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                         |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, używająca dolnego ograniczenia semver, takiego jak `>=2026.3.22`.                                                                     |
| `openclaw.install.expectedIntegrity`                              | Oczekiwany ciąg integralności dystrybucji npm, taki jak `sha512-...`; przepływy instalacji i aktualizacji weryfikują względem niego pobrany artefakt.                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | Umożliwia wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego Pluginu, gdy konfiguracja jest nieprawidłowa.                                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala ładować powierzchnie kanału tylko do konfiguracji początkowej przed pełnym Pluginem kanału podczas uruchamiania.                                                            |

Metadane manifestu decydują, które wybory dostawcy/kanału/konfiguracji początkowej pojawiają się w
onboardingu przed załadowaniem środowiska wykonawczego. `package.json#openclaw.install` informuje
onboarding, jak pobrać lub włączyć ten Plugin, gdy użytkownik wybierze jedną z tych
opcji. Nie przenoś wskazówek instalacyjnych do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru
manifestów. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości powodują
pominięcie Pluginu na starszych hostach.

Dokładne przypinanie wersji npm już znajduje się w `npmSpec`, na przykład
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne wpisy zewnętrznego katalogu
powinny łączyć dokładne specyfikacje z `expectedIntegrity`, aby przepływy aktualizacji kończyły się bezpieczną odmową,
jeśli pobrany artefakt npm nie odpowiada już przypiętemu wydaniu.
Interaktywny onboarding nadal oferuje zaufane specyfikacje npm rejestru, w tym same
nazwy pakietów i dist-tagi, dla zgodności. Diagnostyka katalogu może
rozróżniać źródła dokładne, pływające, przypięte integralnością i bez integralności.
Gdy `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji je egzekwują; gdy
jest pominięte, rozstrzygnięcie rejestru jest zapisywane bez przypięcia integralności.

Pluginy kanałów powinny udostępniać `openclaw.setupEntry`, gdy status, lista kanałów
lub skany SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego
środowiska wykonawczego. Punkt wejścia konfiguracji początkowej powinien udostępniać metadane kanału oraz bezpieczne dla konfiguracji początkowej adaptery
konfiguracji, statusu i sekretów; klientów sieciowych, listenerów Gateway i
środowiska wykonawcze transportu należy pozostawić w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia środowiska wykonawczego nie zastępują kontroli granic pakietu dla
pól źródłowego punktu wejścia. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że
uciekająca ścieżka `openclaw.extensions` będzie możliwa do załadowania.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolnie uszkodzone konfiguracje stają się możliwe do zainstalowania. Obecnie pozwala jedynie
przepływom instalacji odzyskiwać stan po określonych nieaktualnych awariach aktualizacji dołączonego Pluginu, takich jak
brakująca ścieżka dołączonego Pluginu lub nieaktualny wpis `channels.<id>` dla tego samego
dołączonego Pluginu. Niezwiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
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

Używaj tego, gdy przepływy konfiguracji początkowej, doctor lub stanu konfiguracji potrzebują taniego sprawdzenia
uwierzytelniania typu tak/nie przed załadowaniem pełnego Pluginu kanału. Docelowy eksport powinien być małą
funkcją, która odczytuje wyłącznie stan utrwalony; nie kieruj go przez pełny barrel
środowiska wykonawczego kanału.

`openclaw.channel.configuredState` ma taki sam kształt dla tanich kontroli
skonfigurowania opartych wyłącznie na zmiennych środowiskowych:

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

Używaj tego, gdy kanał może odpowiedzieć o stanie konfiguracji na podstawie zmiennych środowiskowych lub innych małych
wejść niewymagających środowiska wykonawczego. Jeśli sprawdzenie wymaga pełnego rozstrzygnięcia konfiguracji lub rzeczywistego
środowiska wykonawczego kanału, zachowaj tę logikę w hooku Pluginu `config.hasConfiguredState`.

## Priorytet wykrywania (zduplikowane identyfikatory Pluginów)

OpenClaw wykrywa Pluginy z kilku źródeł (dołączone do pakietu, instalacja globalna, workspace, jawne ścieżki wybrane w konfiguracji). Jeśli dwa wykrycia mają to samo `id`, zachowywany jest tylko manifest o **najwyższym priorytecie**; duplikaty o niższym priorytecie są odrzucane zamiast ładowania obok niego.

Priorytet, od najwyższego do najniższego:

1. **Wybrane w konfiguracji** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Dołączone do pakietu** — Pluginy dostarczane z OpenClaw
3. **Instalacja globalna** — Pluginy zainstalowane w globalnym katalogu głównym Pluginów OpenClaw
4. **Workspace** — Pluginy wykryte względem bieżącego workspace

Konsekwencje:

- Rozwidlenie lub nieaktualna kopia dołączonego Pluginu znajdująca się w workspace nie przesłoni wersji dołączonej do pakietu.
- Aby rzeczywiście zastąpić dołączony Plugin lokalnym, przypnij go przez `plugins.entries.<id>`, aby wygrał priorytetem, zamiast polegać na wykrywaniu workspace.
- Odrzucone duplikaty są logowane, aby Doctor i diagnostyka uruchamiania mogły wskazać odrzuconą kopię.

## Wymagania dotyczące JSON Schema

- **Każdy Plugin musi dostarczać JSON Schema**, nawet jeśli nie akceptuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w czasie wykonywania.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału został zadeklarowany przez
  manifest Pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów Pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli Plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd Pluginu.
- Jeśli konfiguracja Pluginu istnieje, ale Plugin jest **wyłączony**, konfiguracja jest zachowywana i
  wyświetlane jest **ostrzeżenie** w Doctor + logach.

Zobacz [Informacje o konfiguracji](/pl/gateway/configuration), aby poznać pełny schemat `plugins.*`.

## Uwagi

- Manifest jest **wymagany dla natywnych Pluginów OpenClaw**, w tym ładowanych z lokalnego systemu plików. Środowisko wykonawcze nadal ładuje moduł Pluginu osobno; manifest służy wyłącznie do wykrywania i walidacji.
- Natywne manifesty są analizowane za pomocą JSON5, więc komentarze, końcowe przecinki i klucze bez cudzysłowów są akceptowane, o ile wartość końcowa nadal jest obiektem.
- Loader manifestu odczytuje wyłącznie udokumentowane pola manifestu. Unikaj niestandardowych kluczy najwyższego poziomu.
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, jeśli Plugin ich nie potrzebuje.
- `providerDiscoveryEntry` musi pozostać lekkie i nie powinno importować szerokiego kodu środowiska wykonawczego; używaj go do statycznych metadanych katalogu dostawców lub wąskich deskryptorów wykrywania, a nie do wykonywania w czasie żądania.
- Wyłączne rodzaje Pluginów są wybierane przez `plugins.slots.*`: `kind: "memory"` przez `plugins.slots.memory`, `kind: "context-engine"` przez `plugins.slots.contextEngine` (domyślnie `legacy`).
- Metadane zmiennych środowiskowych (`providerAuthEnvVars`, `channelEnvVars`) są wyłącznie deklaratywne. Status, audyt, walidacja dostarczania Cron i inne powierzchnie tylko do odczytu nadal stosują zaufanie do Pluginu i zasady efektywnej aktywacji, zanim potraktują zmienną środowiskową jako skonfigurowaną.
- Informacje o metadanych kreatora środowiska wykonawczego wymagających kodu dostawcy znajdziesz w sekcji [Hooki środowiska wykonawczego dostawcy](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli Twój Plugin zależy od modułów natywnych, udokumentuj kroki budowania oraz wszelkie wymagania listy dozwolonych menedżera pakietów (na przykład pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Powiązane

<CardGroup cols={3}>
  <Card title="Tworzenie Pluginów" href="/pl/plugins/building-plugins" icon="rocket">
    Jak zacząć pracę z Pluginami.
  </Card>
  <Card title="Architektura Pluginów" href="/pl/plugins/architecture" icon="diagram-project">
    Architektura wewnętrzna i model możliwości.
  </Card>
  <Card title="Przegląd SDK" href="/pl/plugins/sdk-overview" icon="book">
    Informacje o SDK Pluginów i importach podścieżek.
  </Card>
</CardGroup>
