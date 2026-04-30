---
read_when:
    - Tworzysz Plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji Plugin lub debugować błędy walidacji Plugin
summary: Wymagania manifestu Plugin i schematu JSON (rygorystyczna walidacja konfiguracji)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-30T10:07:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

Ta strona dotyczy wyłącznie **natywnego manifestu Plugin OpenClaw**.

Zgodne układy pakietów opisano w [Pakiety Plugin](/pl/plugins/bundles).

Zgodne formaty pakietów używają innych plików manifestu:

- Pakiet Codex: `.codex-plugin/plugin.json`
- Pakiet Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentów Claude
  bez manifestu
- Pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa także te układy pakietów, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych pakietów OpenClaw obecnie odczytuje metadane pakietu oraz zadeklarowane
katalogi główne Skills, katalogi główne poleceń Claude, wartości domyślne `settings.json`
pakietu Claude, wartości domyślne LSP pakietu Claude oraz obsługiwane pakiety hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym Plugin**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Plugin**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Plugin i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Plugin: [Pluginy](/pl/tools/plugin).
Natywny model możliwości i aktualne wskazówki dotyczące zgodności zewnętrznej:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Co robi ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje **zanim załaduje kod Twojego
Plugin**. Wszystko poniżej musi być wystarczająco tanie do sprawdzenia bez uruchamiania
środowiska uruchomieniowego Plugin.

**Używaj go do:**

- tożsamości Plugin, walidacji konfiguracji i wskazówek dla interfejsu konfiguracji
- metadanych uwierzytelniania, wdrażania i konfiguracji (alias, automatyczne włączanie, zmienne środowiskowe dostawcy, wybory uwierzytelniania)
- wskazówek aktywacji dla powierzchni płaszczyzny sterowania
- skróconej własności rodzin modeli
- statycznych zrzutów własności możliwości (`contracts`)
- metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzać
- metadanych konfiguracji specyficznych dla kanału, scalanych z katalogiem i powierzchniami walidacji

**Nie używaj go do:** rejestrowania zachowania środowiska uruchomieniowego, deklarowania punktów wejścia kodu
ani metadanych instalacji npm. Należą one do kodu Twojego Plugin i `package.json`.

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
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
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

## Odniesienie do pól najwyższego poziomu

| Pole                                 | Wymagane | Typ                              | Co oznacza                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Tak      | `string`                         | Kanoniczny identyfikator pluginu. To jest identyfikator używany w `plugins.entries.<id>`.                                                                                                                                         |
| `configSchema`                       | Tak      | `object`                         | Wbudowany schemat JSON Schema dla konfiguracji tego pluginu.                                                                                                                                                                      |
| `enabledByDefault`                   | Nie      | `true`                           | Oznacza dołączony plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić plugin domyślnie wyłączony.                                                                            |
| `legacyPluginIds`                    | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten plugin, gdy uwierzytelnianie, konfiguracja lub odwołania do modeli o nich wspominają.                                                                           |
| `kind`                               | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj pluginu używany przez `plugins.slots.*`.                                                                                                                                                                |
| `channels`                           | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                |
| `providers`                          | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                                                              |
| `providerDiscoveryEntry`             | Nie      | `string`                         | Lekka ścieżka modułu wykrywania dostawcy, względna względem katalogu głównego pluginu, dla ograniczonych do manifestu metadanych katalogu dostawców, które można wczytać bez aktywowania pełnego runtime pluginu.                 |
| `modelSupport`                       | Nie      | `object`                         | Należące do manifestu skrótowe metadane rodziny modeli używane do automatycznego wczytania pluginu przed runtime.                                                                                                                 |
| `modelCatalog`                       | Nie      | `object`                         | Deklaratywne metadane katalogu modeli dla dostawców należących do tego pluginu. To kontrakt płaszczyzny sterowania dla przyszłego listowania tylko do odczytu, onboardingu, selektorów modeli, aliasów i wyciszania bez wczytywania runtime pluginu. |
| `modelPricing`                       | Nie      | `object`                         | Należąca do dostawcy zewnętrzna polityka wyszukiwania cen. Użyj jej, aby wyłączyć lokalnych/samohostowanych dostawców z zewnętrznych katalogów cen lub mapować odwołania dostawcy na identyfikatory katalogu OpenRouter/LiteLLM bez wpisywania identyfikatorów dostawców na stałe w core. |
| `modelIdNormalization`               | Nie      | `object`                         | Należące do dostawcy czyszczenie aliasów/prefiksów identyfikatorów modeli, które musi zostać wykonane przed wczytaniem runtime dostawcy.                                                                                         |
| `providerEndpoints`                  | Nie      | `object[]`                       | Należące do manifestu metadane hosta/baseUrl endpointu dla tras dostawców, które core musi sklasyfikować przed wczytaniem runtime dostawcy.                                                                                       |
| `providerRequest`                    | Nie      | `object`                         | Tanie metadane rodziny dostawcy i zgodności żądania używane przez ogólną politykę żądań przed wczytaniem runtime dostawcy.                                                                                                       |
| `cliBackends`                        | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego pluginu. Używane do automatycznej aktywacji przy starcie na podstawie jawnych odwołań w konfiguracji.                                                                  |
| `syntheticAuthRefs`                  | Nie      | `string[]`                       | Odwołania dostawcy lub backendu CLI, których należący do pluginu syntetyczny hook uwierzytelniania powinien zostać sprawdzony podczas zimnego wykrywania modeli przed wczytaniem runtime.                                       |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                       | Należące do dołączonego pluginu wartości zastępcze klucza API, które reprezentują nietajne lokalne, OAuth lub środowiskowe dane uwierzytelniające.                                                                               |
| `commandAliases`                     | Nie      | `object[]`                       | Nazwy poleceń należące do tego pluginu, które powinny generować świadome pluginu diagnostyki konfiguracji i CLI przed wczytaniem runtime.                                                                                        |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`       | Przestarzałe metadane zgodności env dla wyszukiwania uwierzytelniania/statusu dostawcy. Dla nowych pluginów preferuj `setup.providers[].envVars`; OpenClaw nadal odczytuje to pole w okresie wycofywania.                         |
| `providerAuthAliases`                | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący podstawowy klucz API dostawcy i profile uwierzytelniania. |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`       | Tanie metadane env kanału, które OpenClaw może sprawdzić bez wczytywania kodu pluginu. Użyj tego dla konfiguracji kanału sterowanej env lub powierzchni uwierzytelniania, które powinny być widoczne dla ogólnych helperów startu/konfiguracji. |
| `providerAuthChoices`                | Nie      | `object[]`                       | Tanie metadane wyborów uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego okablowania flag CLI.                                                                                        |
| `activation`                         | Nie      | `object`                         | Tanie metadane planisty aktywacji dla startu oraz ładowania wyzwalanego przez dostawcę, polecenie, kanał, trasę i capability. Tylko metadane; runtime pluginu nadal odpowiada za rzeczywiste zachowanie.                         |
| `setup`                              | Nie      | `object`                         | Tanie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez wczytywania runtime pluginu.                                                                                         |
| `qaRunners`                          | Nie      | `object[]`                       | Tanie deskryptory runnerów QA używane przez współdzielonego hosta `openclaw qa` przed wczytaniem runtime pluginu.                                                                                                                |
| `contracts`                          | Nie      | `object`                         | Statyczny snapshot dołączonych capability dla zewnętrznych hooków uwierzytelniania, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów, generowania obrazów, generowania muzyki, generowania wideo, web-fetch, wyszukiwania w sieci i własności narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`         | Tanie wartości domyślne rozumienia mediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                               |
| `channelConfigs`                     | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału scalane z powierzchniami wykrywania i walidacji przed wczytaniem runtime.                                                                                                     |
| `skills`                             | Nie      | `string[]`                       | Katalogi Skills do wczytania, względne względem katalogu głównego pluginu.                                                                                                                                                        |
| `name`                               | Nie      | `string`                         | Czytelna dla człowieka nazwa pluginu.                                                                                                                                                                                            |
| `description`                        | Nie      | `string`                         | Krótkie podsumowanie pokazywane w powierzchniach pluginów.                                                                                                                                                                       |
| `version`                            | Nie      | `string`                         | Informacyjna wersja pluginu.                                                                                                                                                                                                     |
| `uiHints`                            | Nie      | `Record<string, object>`         | Etykiety UI, placeholdery i wskazówki wrażliwości dla pól konfiguracji.                                                                                                                                                          |

## Odwołanie providerAuthChoices

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje go przed wczytaniem runtime dostawcy.
Listy konfiguracji dostawcy używają tych wyborów z manifestu, wyborów konfiguracji
pochodzących z deskryptora oraz metadanych katalogu instalacji bez wczytywania runtime dostawcy.

| Pole                  | Wymagane | Typ                                             | Znaczenie                                                                                                |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ten wybór.                                                     |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której ma nastąpić przekazanie.                                |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru uwierzytelniania używany przez przepływy onboardingu i CLI.                |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje `choiceId`.                  |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                   |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.         |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór przed selektorami asystenta, nadal pozwalając na ręczny wybór w CLI.                        |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyborów, które powinny przekierowywać użytkowników do tego wyboru zastępczego.    |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                        |
| `groupLabel`          | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                             |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                       |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                           |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, taka jak `--openrouter-api-key`.                                                        |
| `cliOption`           | Nie      | `string`                                        | Pełna postać opcji CLI, taka jak `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                               |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Określa, na których powierzchniach onboardingu ten wybór powinien się pojawić. Jeśli pominięte, domyślnie przyjmuje `["text-inference"]`. |

## Dokumentacja `commandAliases`

Użyj `commandAliases`, gdy Plugin jest właścicielem nazwy polecenia środowiska wykonawczego, którą użytkownicy mogą
omyłkowo umieścić w `plugins.allow` albo spróbować uruchomić jako główne polecenie CLI. OpenClaw
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

| Pole         | Wymagane | Typ               | Znaczenie                                                               |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należąca do tego Plugin.                                |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash czatu, a nie główne polecenie CLI.   |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI do zasugerowania dla operacji CLI, jeśli istnieje. |

## Dokumentacja `activation`

Użyj `activation`, gdy Plugin może tanio zadeklarować, które zdarzenia płaszczyzny sterowania
powinny uwzględniać go w planie aktywacji/ładowania.

Ten blok to metadane planisty, a nie API cyklu życia. Nie rejestruje
zachowania środowiska wykonawczego, nie zastępuje `register(...)` ani nie obiecuje, że
kod Plugin już został wykonany. Planista aktywacji używa tych pól, aby
zawęzić kandydatów Plugin przed powrotem do istniejących metadanych własności w manifeście,
takich jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki.

Preferuj najwęższe metadane, które już opisują własność. Używaj
`providers`, `channels`, `commandAliases`, deskryptorów konfiguracji albo `contracts`,
gdy te pola wyrażają relację. Użyj `activation` dla dodatkowych
wskazówek planisty, których nie da się przedstawić przez te pola własności.
Używaj najwyższego poziomu `cliBackends` dla aliasów środowiska wykonawczego CLI, takich jak `claude-cli`,
`codex-cli` lub `google-gemini-cli`; `activation.onAgentHarnesses` służy tylko do
osadzonych identyfikatorów uprzęży agentów, które nie mają już pola własności.

Ten blok jest wyłącznie metadanymi. Nie rejestruje zachowania środowiska wykonawczego i nie
zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia środowiska wykonawczego/Plugin.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem Plugin,
więc brak metadanych aktywacji zwykle kosztuje tylko wydajność; nie powinien
zmieniać poprawności, dopóki nadal istnieją starsze fallbacki własności manifestu.

Każdy Plugin powinien celowo ustawić `activation.onStartup`, gdy OpenClaw odchodzi
od niejawnych importów przy uruchamianiu. Ustaw na `true` tylko wtedy, gdy Plugin musi
działać podczas uruchamiania Gateway. Ustaw na `false`, gdy Plugin jest nieaktywny przy
uruchamianiu i powinien ładować się tylko z węższych wyzwalaczy. Pominięcie `onStartup` zachowuje
przestarzały starszy fallback niejawnego sidecara uruchomieniowego dla Plugin bez
statycznych metadanych możliwości; przyszłe wersje mogą przestać ładować te
Plugin przy uruchamianiu, chyba że zadeklarują `activation.onStartup: true`. Raporty stanu i
zgodności Plugin ostrzegają `legacy-implicit-startup-sidecar`, gdy Plugin
nadal polega na tym fallbacku.

Do testowania migracji ustaw
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`, aby wyłączyć tylko ten
przestarzały fallback. Ten tryb opt-in nie blokuje jawnych
Plugin z `activation.onStartup: true` ani Plugin ładowanych przez kanał, konfigurację,
uprząż agenta, pamięć lub inne węższe wyzwalacze aktywacji.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Pole               | Wymagane | Typ                                                  | Znaczenie                                                                                                                                                                                                                           |
| ------------------ | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nie      | `boolean`                                            | Jawna aktywacja przy uruchamianiu Gateway. Każdy Plugin powinien to ustawić. `true` importuje Plugin podczas uruchamiania; `false` rezygnuje z przestarzałego niejawnego fallbacku uruchamiania sidecara, chyba że inny dopasowany wyzwalacz wymaga ładowania. |
| `onProviders`      | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                                                                                                       |
| `onAgentHarnesses` | Nie      | `string[]`                                           | Identyfikatory środowiska wykonawczego osadzonej uprzęży agenta, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania. Użyj najwyższego poziomu `cliBackends` dla aliasów backendu CLI.                                |
| `onCommands`       | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                                                                                                         |
| `onChannels`       | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                                                                                                         |
| `onRoutes`         | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                                                                                                                   |
| `onConfigPaths`    | Nie      | `string[]`                                           | Ścieżki konfiguracji względne wobec katalogu głównego, które powinny uwzględniać ten Plugin w planach uruchamiania/ładowania, gdy ścieżka jest obecna i nie jest jawnie wyłączona.                                                 |
| `onCapabilities`   | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki dotyczące możliwości używane przez planowanie aktywacji płaszczyzny sterowania. Gdy to możliwe, preferuj węższe pola.                                                                                             |

Obecni aktywni konsumenci:

- Planowanie uruchamiania Gateway używa `activation.onStartup` do jawnego importu
  przy uruchamianiu i rezygnacji z przestarzałego niejawnego fallbacku uruchamiania sidecara
- planowanie CLI wyzwalane poleceniem wraca do starszego
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie uruchamiania środowiska wykonawczego agenta używa `activation.onAgentHarnesses` dla
  osadzonych uprzęży i najwyższego poziomu `cliBackends[]` dla aliasów środowiska wykonawczego CLI
- planowanie konfiguracji/kanału wyzwalane kanałem wraca do starszej własności `channels[]`,
  gdy brakuje jawnych metadanych aktywacji kanału
- planowanie Plugin przy uruchamianiu używa `activation.onConfigPaths` dla niekanałowych głównych
  powierzchni konfiguracji, takich jak blok `browser` w dołączonym Plugin przeglądarki
- planowanie konfiguracji/środowiska wykonawczego wyzwalane dostawcą wraca do starszej własności
  `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych
  aktywacji dostawcy

Diagnostyka planisty może odróżniać jawne wskazówki aktywacji od fallbacku
własności manifestu. Na przykład `activation-command-hint` oznacza, że dopasowano
`activation.onCommands`, podczas gdy `manifest-command-alias` oznacza, że
planista użył zamiast tego własności `commandAliases`. Te etykiety powodów są przeznaczone dla
diagnostyki hosta i testów; autorzy Plugin powinni nadal deklarować metadane,
które najlepiej opisują własność.

## Dokumentacja `qaRunners`

Użyj `qaRunners`, gdy Plugin wnosi jeden lub więcej runnerów transportu pod
wspólnym korzeniem `openclaw qa`. Te metadane powinny być tanie i statyczne; środowisko wykonawcze Plugin
nadal jest właścicielem właściwej rejestracji CLI przez lekką
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

| Pole          | Wymagane | Typ      | Co oznacza                                                        |
| ------------- | -------- | -------- | ----------------------------------------------------------------- |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.   |
| `description` | Nie      | `string` | Zapasowy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia zastępczego. |

## informacje referencyjne dotyczące setup

Używaj `setup`, gdy powierzchnie konfiguracji i wdrażania użytkownika potrzebują tanich metadanych należących do Pluginu
przed załadowaniem środowiska uruchomieniowego.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Najwyższego poziomu `cliBackends` pozostaje prawidłowe i nadal opisuje backendy wnioskowania CLI. `setup.cliBackends` to powierzchnia deskryptora specyficzna dla setup
dla przepływów płaszczyzny sterowania/setup, które powinny pozostać wyłącznie metadanymi.

Gdy są obecne, `setup.providers` i `setup.cliBackends` są preferowaną powierzchnią wyszukiwania opartą najpierw na deskryptorach do wykrywania setup. Jeśli deskryptor tylko
zawęża kandydujący Plugin, a setup nadal potrzebuje bogatszych hooków środowiska uruchomieniowego w czasie setup, ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
zapasową ścieżkę wykonywania.

OpenClaw uwzględnia także `setup.providers[].envVars` w ogólnych wyszukiwaniach uwierzytelniania dostawcy i zmiennych środowiskowych. `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności w okresie wycofywania, ale niepakietowane Pluginy, które nadal go używają,
otrzymują diagnostykę manifestu. Nowe Pluginy powinny umieszczać metadane środowiska setup/status
w `setup.providers[].envVars`.

OpenClaw może także wyprowadzać proste wybory setup z `setup.providers[].authMethods`,
gdy wpis setup jest niedostępny albo gdy `setup.requiresRuntime: false`
deklaruje, że środowisko uruchomieniowe setup nie jest potrzebne. Jawne wpisy `providerAuthChoices` pozostają
preferowane dla niestandardowych etykiet, flag CLI, zakresu wdrażania użytkownika i metadanych asystenta.

Ustaw `requiresRuntime: false` tylko wtedy, gdy te deskryptory wystarczają dla
powierzchni setup. OpenClaw traktuje jawne `false` jako kontrakt wyłącznie deskryptorowy
i nie wykona `setup-api` ani `openclaw.setupEntry` na potrzeby wyszukiwania setup. Jeśli
Plugin wyłącznie deskryptorowy nadal dostarcza jeden z tych wpisów środowiska uruchomieniowego setup,
OpenClaw zgłasza diagnostykę addytywną i nadal go ignoruje. Pominięte
`requiresRuntime` zachowuje starsze zachowanie zapasowe, aby istniejące Pluginy, które dodały
deskryptory bez tej flagi, nie przestały działać.

Ponieważ wyszukiwanie setup może wykonywać należący do Pluginu kod `setup-api`, znormalizowane
wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikatowe we wszystkich
wykrytych Pluginach. Niejednoznaczna własność kończy się bezpiecznie niepowodzeniem zamiast wybierać
zwycięzcę na podstawie kolejności wykrywania.

Gdy środowisko uruchomieniowe setup jest wykonywane, diagnostyka rejestru setup zgłasza rozbieżność deskryptorów, jeśli `setup-api` rejestruje dostawcę lub backend CLI, którego deskryptory manifestu
nie deklarują, albo jeśli deskryptor nie ma pasującej rejestracji w środowisku uruchomieniowym. Te diagnostyki są addytywne i nie odrzucają starszych Pluginów.

### informacje referencyjne dotyczące setup.providers

| Pole           | Wymagane | Typ        | Co oznacza                                                                                     |
| -------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `id`           | Tak      | `string`   | Identyfikator dostawcy udostępniany podczas setup lub wdrażania użytkownika. Utrzymuj znormalizowane identyfikatory globalnie unikatowe. |
| `authMethods`  | Nie      | `string[]` | Identyfikatory metod setup/uwierzytelniania obsługiwanych przez tego dostawcę bez ładowania pełnego środowiska uruchomieniowego. |
| `envVars`      | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie setup/status mogą sprawdzić przed załadowaniem środowiska uruchomieniowego Pluginu. |
| `authEvidence` | Nie      | `object[]` | Tanie lokalne kontrole dowodów uwierzytelniania dla dostawców, którzy mogą uwierzytelniać przez niesekretne znaczniki. |

`authEvidence` jest przeznaczone dla lokalnych znaczników poświadczeń należących do dostawcy, które można
zweryfikować bez ładowania kodu środowiska uruchomieniowego. Te kontrole muszą pozostać tanie i lokalne:
bez wywołań sieciowych, bez odczytów z pęku kluczy ani menedżera sekretów, bez poleceń powłoki i bez
sond API dostawcy.

Obsługiwane wpisy dowodów:

| Pole               | Wymagane | Typ        | Co oznacza                                                                                                   |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `type`             | Tak      | `string`   | Obecnie `local-file-with-env`.                                                                              |
| `fileEnvVar`       | Nie      | `string`   | Zmienna środowiskowa zawierająca jawną ścieżkę do pliku poświadczeń.                                        |
| `fallbackPaths`    | Nie      | `string[]` | Lokalne ścieżki plików poświadczeń sprawdzane, gdy `fileEnvVar` jest nieobecne lub puste. Obsługuje `${HOME}` i `${APPDATA}`. |
| `requiresAnyEnv`   | Nie      | `string[]` | Co najmniej jedna wymieniona zmienna środowiskowa musi być niepusta, zanim dowód będzie prawidłowy.          |
| `requiresAllEnv`   | Nie      | `string[]` | Każda wymieniona zmienna środowiskowa musi być niepusta, zanim dowód będzie prawidłowy.                     |
| `credentialMarker` | Tak      | `string`   | Niesekretny znacznik zwracany, gdy dowód jest obecny.                                                       |
| `source`           | Nie      | `string`   | Etykieta źródła widoczna dla użytkownika w danych wyjściowych uwierzytelniania/statusu.                     |

### pola setup

| Pole               | Wymagane | Typ        | Co oznacza                                                                                     |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory setup dostawców udostępniane podczas setup i wdrażania użytkownika.                |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów używane w czasie setup do wyszukiwania setup opartego najpierw na deskryptorach. Utrzymuj znormalizowane identyfikatory globalnie unikatowe. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni setup tego Pluginu.               |
| `requiresRuntime`  | Nie      | `boolean`  | Czy setup nadal wymaga wykonania `setup-api` po wyszukiwaniu deskryptora.                      |

## informacje referencyjne dotyczące uiHints

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

| Pole          | Typ        | Co oznacza                             |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika. |
| `help`        | `string`   | Krótki tekst pomocniczy.               |
| `tags`        | `string[]` | Opcjonalne tagi UI.                    |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.        |
| `sensitive`   | `boolean`  | Oznacza pole jako tajne lub wrażliwe.  |
| `placeholder` | `string`   | Tekst zastępczy dla pól formularzy.    |

## informacje referencyjne dotyczące contracts

Używaj `contracts` tylko dla statycznych metadanych własności funkcji, które OpenClaw może
odczytać bez importowania środowiska uruchomieniowego Pluginu.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Każda lista jest opcjonalna:

| Pole                             | Typ        | Co oznacza                                                          |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory fabryk rozszerzeń serwera aplikacji Codex, obecnie `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identyfikatory środowiska uruchomieniowego, dla których pakietowany Plugin może rejestrować middleware wyników narzędzi. |
| `externalAuthProviders`          | `string[]` | Identyfikatory dostawców, których hook zewnętrznego profilu uwierzytelniania należy do tego Pluginu. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należących do tego Pluginu.           |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należących do tego Pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należących do tego Pluginu. |
| `memoryEmbeddingProviders`       | `string[]` | Identyfikatory dostawców osadzeń pamięci należących do tego Pluginu. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia mediów należących do tego Pluginu. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należących do tego Pluginu. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należących do tego Pluginu. |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania z sieci należących do tego Pluginu. |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania w sieci należących do tego Pluginu. |
| `migrationProviders`             | `string[]` | Identyfikatory dostawców importu należących do tego Pluginu dla `openclaw migrate`. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego Pluginu dla pakietowanych kontroli kontraktu. |

`contracts.embeddedExtensionFactories` zostaje zachowane dla pakietowanych fabryk rozszerzeń wyłącznie serwera aplikacji Codex. Pakietowane transformacje wyników narzędzi powinny
deklarować `contracts.agentToolResultMiddleware` i zamiast tego rejestrować się przez
`api.registerAgentToolResultMiddleware(...)`. Zewnętrzne Pluginy nie mogą
rejestrować middleware wyników narzędzi, ponieważ ta powierzchnia może przepisać wysoce zaufane dane wyjściowe narzędzi,
zanim zobaczy je model.

Pluginy dostawców, które implementują `resolveExternalAuthProfiles`, powinny deklarować
`contracts.externalAuthProviders`. Pluginy bez tej deklaracji nadal działają
przez przestarzałą zapasową ścieżkę zgodności, ale ta ścieżka jest wolniejsza i
zostanie usunięta po okresie migracji.

Pakietowani dostawcy osadzeń pamięci powinni deklarować
`contracts.memoryEmbeddingProviders` dla każdego identyfikatora adaptera, który udostępniają, w tym
wbudowanych adapterów, takich jak `local`. Samodzielne ścieżki CLI używają tego kontraktu manifestu,
aby załadować tylko Plugin właściciela, zanim pełne środowisko uruchomieniowe Gateway
zarejestruje dostawców.

## informacje referencyjne dotyczące mediaUnderstandingProviderMetadata

Użyj `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia multimediów ma
domyślne modele, priorytet awaryjnego automatycznego uwierzytelniania albo natywną obsługę dokumentów, której
ogólne pomocniki core potrzebują przed załadowaniem runtime. Klucze muszą być też zadeklarowane w
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

| Pole                   | Typ                                 | Co oznacza                                                                           |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Możliwości multimedialne udostępniane przez tego dostawcę.                           |
| `defaultModels`        | `Record<string, string>`            | Domyślne mapowania możliwości na model używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby są sortowane wcześniej dla automatycznego awaryjnego wyboru dostawcy na podstawie poświadczeń. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez dostawcę.                               |

## Odwołanie channelConfigs

Użyj `channelConfigs`, gdy Plugin kanału potrzebuje tanich metadanych konfiguracji przed
załadowaniem runtime. Odkrywanie konfiguracji/statusu kanału tylko do odczytu może używać tych metadanych
bezpośrednio dla skonfigurowanych kanałów zewnętrznych, gdy wpis konfiguracji początkowej nie jest dostępny albo
gdy `setup.requiresRuntime: false` deklaruje, że runtime konfiguracji początkowej nie jest potrzebny.

`channelConfigs` to metadane manifestu Pluginu, a nie nowa sekcja konfiguracji użytkownika najwyższego poziomu.
Użytkownicy nadal konfigurują instancje kanałów w `channels.<channel-id>`.
OpenClaw czyta metadane manifestu, aby zdecydować, który Plugin jest właścicielem tego skonfigurowanego
kanału, zanim wykona się kod runtime Pluginu.

Dla Pluginu kanału `configSchema` i `channelConfigs` opisują różne
ścieżki:

- `configSchema` waliduje `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` waliduje `channels.<channel-id>`

Pluginy spoza zestawu wbudowanego, które deklarują `channels[]`, powinny też deklarować pasujące
wpisy `channelConfigs`. Bez nich OpenClaw nadal może załadować Plugin, ale
zimna ścieżka schematu konfiguracji, konfiguracja początkowa i powierzchnie Control UI nie mogą znać
kształtu opcji należących do kanału, dopóki nie wykona się runtime Pluginu.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` i
`nativeSkillsAutoEnabled` mogą deklarować statyczne wartości domyślne `auto` dla sprawdzeń konfiguracji poleceń,
które działają przed załadowaniem runtime kanału. Kanały wbudowane mogą też publikować
te same wartości domyślne przez `package.json#openclaw.channel.commands` obok
innych metadanych katalogu kanałów należących do pakietu.

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Każdy wpis kanału może zawierać:

| Pole          | Typ                      | Co oznacza                                                                                         |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagany dla każdego zadeklarowanego wpisu konfiguracji kanału.   |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI, symbole zastępcze i wskazówki poufności dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami wyboru i inspekcji, gdy metadane runtime nie są gotowe.   |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                           |
| `commands`    | `object`                 | Statyczne automatyczne wartości domyślne dla natywnych poleceń i natywnych Skills używane w sprawdzeniach konfiguracji przed runtime. |
| `preferOver`  | `string[]`               | Identyfikatory starszych Pluginów albo Pluginów o niższym priorytecie, które ten kanał powinien wyprzedzać w powierzchniach wyboru. |

### Zastępowanie innego Pluginu kanału

Użyj `preferOver`, gdy Twój Plugin jest preferowanym właścicielem dla identyfikatora kanału, który
może też dostarczać inny Plugin. Typowe przypadki to zmieniony identyfikator Pluginu,
samodzielny Plugin zastępujący Plugin wbudowany albo utrzymywany fork, który
zachowuje ten sam identyfikator kanału dla zgodności konfiguracji.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Gdy `channels.chat` jest skonfigurowane, OpenClaw bierze pod uwagę zarówno identyfikator kanału, jak i
identyfikator preferowanego Pluginu. Jeśli Plugin o niższym priorytecie został wybrany tylko dlatego,
że jest wbudowany albo domyślnie włączony, OpenClaw wyłącza go w efektywnej
konfiguracji runtime, aby jeden Plugin był właścicielem kanału i jego narzędzi. Jawny wybór użytkownika
nadal wygrywa: jeśli użytkownik jawnie włączy oba Pluginy, OpenClaw
zachowa ten wybór i zgłosi diagnostykę zduplikowanego kanału/narzędzia zamiast
po cichu zmieniać żądany zestaw Pluginów.

Ogranicz zakres `preferOver` do identyfikatorów Pluginów, które naprawdę mogą dostarczać ten sam kanał.
Nie jest to ogólne pole priorytetu i nie zmienia nazw kluczy konfiguracji użytkownika.

## Odwołanie modelSupport

Użyj `modelSupport`, gdy OpenClaw ma wywnioskować Twój Plugin dostawcy z
krótkich identyfikatorów modeli, takich jak `gpt-5.5` albo `claude-sonnet-4.6`, przed załadowaniem runtime
Pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje ten priorytet:

- jawne odwołania `provider/model` używają metadanych manifestu `providers` właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują zarówno jeden Plugin spoza zestawu wbudowanego, jak i jeden Plugin wbudowany, wygrywa Plugin spoza zestawu wbudowanego
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik albo konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Co oznacza                                                                             |
| --------------- | ---------- | -------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do krótkich identyfikatorów modeli.           |
| `modelPatterns` | `string[]` | Źródła wyrażeń regularnych dopasowywane do krótkich identyfikatorów modeli po usunięciu sufiksu profilu. |

## Odwołanie modelCatalog

Użyj `modelCatalog`, gdy OpenClaw powinien znać metadane modeli dostawcy przed
załadowaniem runtime Pluginu. To należące do manifestu źródło stałych wierszy katalogu,
aliasów dostawców, reguł tłumienia i trybu odkrywania. Odświeżanie runtime
nadal należy do kodu runtime dostawcy, ale manifest mówi core, kiedy runtime
jest wymagany.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Pola najwyższego poziomu:

| Pole           | Typ                                                      | Co oznacza                                                                                                      |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Wiersze katalogu dla identyfikatorów dostawców należących do tego Pluginu. Klucze powinny też występować w najwyższego poziomu `providers`. |
| `aliases`      | `Record<string, object>`                                 | Aliasy dostawców, które powinny rozwiązywać się do należącego dostawcy na potrzeby katalogu albo planowania tłumienia. |
| `suppressions` | `object[]`                                               | Wiersze modeli z innego źródła, które ten Plugin tłumi z powodu specyficznego dla dostawcy.                    |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Czy katalog dostawcy można odczytać z metadanych manifestu, odświeżyć do pamięci podręcznej, czy wymaga runtime. |

`aliases` uczestniczy w wyszukiwaniu własności dostawcy na potrzeby planowania katalogu modeli.
Cele aliasów muszą być dostawcami najwyższego poziomu należącymi do tego samego Pluginu. Gdy
lista filtrowana według dostawcy używa aliasu, OpenClaw może odczytać manifest właściciela i
zastosować nadpisania API/bazowego adresu URL aliasu bez ładowania runtime dostawcy.
Aliasy nie rozszerzają niefiltrowanych list katalogu; szerokie listy emitują tylko wiersze
kanonicznego dostawcy właściciela.

`suppressions` zastępuje stary hook runtime dostawcy `suppressBuiltInModel`.
Wpisy tłumienia są honorowane tylko wtedy, gdy dostawca należy do Pluginu albo
jest zadeklarowany jako klucz `modelCatalog.aliases`, który wskazuje należącego dostawcę. Hooki
tłumienia runtime nie są już wywoływane podczas rozwiązywania modeli.

Pola dostawcy:

| Pole      | Typ                      | Co oznacza                                                                 |
| --------- | ------------------------ | -------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Opcjonalny domyślny bazowy adres URL dla modeli w tym katalogu dostawcy.   |
| `api`     | `ModelApi`               | Opcjonalny domyślny adapter API dla modeli w tym katalogu dostawcy.        |
| `headers` | `Record<string, string>` | Opcjonalne statyczne nagłówki, które mają zastosowanie do tego katalogu dostawcy. |
| `models`  | `object[]`               | Wymagane wiersze modeli. Wiersze bez `id` są ignorowane.                   |

Pola modelu:

| Pole           | Typ                                                            | Znaczenie                                                                   |
| -------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`           | `string`                                                       | Lokalny dla dostawcy identyfikator modelu, bez prefiksu `provider/`.        |
| `name`         | `string`                                                       | Opcjonalna nazwa wyświetlana.                                               |
| `api`          | `ModelApi`                                                     | Opcjonalne nadpisanie API dla modelu.                                       |
| `baseUrl`      | `string`                                                       | Opcjonalne nadpisanie bazowego URL dla modelu.                              |
| `headers`      | `Record<string, string>`                                       | Opcjonalne statyczne nagłówki dla modelu.                                   |
| `input`        | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalności akceptowane przez model.                                         |
| `reasoning`    | `boolean`                                                      | Czy model udostępnia zachowanie rozumowania.                                |
| `contextWindow` | `number`                                                      | Natywne okno kontekstu dostawcy.                                            |
| `contextTokens` | `number`                                                      | Opcjonalny efektywny limit kontekstu w czasie wykonywania, gdy różni się od `contextWindow`. |
| `maxTokens`    | `number`                                                       | Maksymalna liczba tokenów wyjściowych, jeśli jest znana.                    |
| `cost`         | `object`                                                       | Opcjonalna cena w USD za milion tokenów, w tym opcjonalne `tieredPricing`.  |
| `compat`       | `object`                                                       | Opcjonalne flagi zgodności odpowiadające zgodności konfiguracji modelu OpenClaw. |
| `status`       | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status w wykazie. Pomijaj tylko wtedy, gdy wiersz w ogóle nie może się pojawić. |
| `statusReason` | `string`                                                       | Opcjonalny powód pokazywany przy statusie innym niż dostępny.               |
| `replaces`     | `string[]`                                                     | Starsze lokalne dla dostawcy identyfikatory modeli, które ten model zastępuje. |
| `replacedBy`   | `string`                                                       | Lokalny dla dostawcy identyfikator modelu zastępczego dla przestarzałych wierszy. |
| `tags`         | `string[]`                                                     | Stabilne tagi używane przez selektory i filtry.                             |

Pola pomijania:

| Pole                       | Typ        | Znaczenie                                                                                                 |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identyfikator dostawcy dla nadrzędnego wiersza do pominięcia. Musi należeć do tego pluginu albo być zadeklarowany jako należący do niego alias. |
| `model`                    | `string`   | Lokalny dla dostawcy identyfikator modelu do pominięcia.                                                  |
| `reason`                   | `string`   | Opcjonalny komunikat pokazywany, gdy pominięty wiersz zostanie zażądany bezpośrednio.                     |
| `when.baseUrlHosts`        | `string[]` | Opcjonalna lista efektywnych hostów bazowego URL dostawcy wymagana, zanim pominięcie zacznie obowiązywać. |
| `when.providerConfigApiIn` | `string[]` | Opcjonalna lista dokładnych wartości `api` konfiguracji dostawcy wymagana, zanim pominięcie zacznie obowiązywać. |

Nie umieszczaj danych dostępnych tylko w czasie wykonywania w `modelCatalog`. Używaj `static` tylko wtedy, gdy
wiersze manifestu są wystarczająco kompletne, aby powierzchnie listy filtrowanej według dostawcy i selektora mogły pominąć
wykrywanie rejestru/czasu wykonywania. Używaj `refreshable`, gdy wiersze manifestu są przydatnymi
listowalnymi zalążkami lub uzupełnieniami, ale odświeżenie/pamięć podręczna mogą później dodać więcej wierszy;
wiersze odświeżalne same w sobie nie są autorytatywne. Używaj `runtime`, gdy OpenClaw
musi załadować środowisko wykonywania dostawcy, aby poznać listę.

## Odniesienie modelIdNormalization

Używaj `modelIdNormalization` do taniego, należącego do dostawcy oczyszczania identyfikatorów modeli, które musi
nastąpić przed załadowaniem środowiska wykonywania dostawcy. Dzięki temu aliasy, takie jak krótkie nazwy
modeli, lokalne dla dostawcy starsze identyfikatory i reguły prefiksów proxy, pozostają w manifeście
należącego do nich pluginu zamiast w podstawowych tabelach wyboru modeli.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Pola dostawcy:

| Pole                                 | Typ                     | Znaczenie                                                                               |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Dokładne aliasy identyfikatorów modeli bez rozróżniania wielkości liter. Wartości są zwracane w zapisanej postaci. |
| `stripPrefixes`                      | `string[]`              | Prefiksy do usunięcia przed wyszukiwaniem aliasu, przydatne przy starszym duplikowaniu dostawca/model. |
| `prefixWhenBare`                     | `string`                | Prefiks dodawany, gdy znormalizowany identyfikator modelu nie zawiera jeszcze `/`.      |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Warunkowe reguły prefiksów dla gołych identyfikatorów po wyszukaniu aliasu, kluczowane przez `modelPrefix` i `prefix`. |

## Odniesienie providerEndpoints

Używaj `providerEndpoints` do klasyfikacji punktów końcowych, którą ogólna polityka żądań
musi znać przed załadowaniem środowiska wykonywania dostawcy. Rdzeń nadal posiada znaczenie każdej
`endpointClass`; manifesty pluginów posiadają metadane hosta i bazowego URL.

Pola punktu końcowego:

| Pole                           | Typ        | Znaczenie                                                                                     |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Znana podstawowa klasa punktu końcowego, taka jak `openrouter`, `moonshot-native` lub `google-vertex`. |
| `hosts`                        | `string[]` | Dokładne nazwy hostów mapowane na klasę punktu końcowego.                                     |
| `hostSuffixes`                 | `string[]` | Sufiksy hostów mapowane na klasę punktu końcowego. Poprzedź `.` przy dopasowaniu wyłącznie sufiksu domeny. |
| `baseUrls`                     | `string[]` | Dokładne znormalizowane bazowe adresy URL HTTP(S) mapowane na klasę punktu końcowego.         |
| `googleVertexRegion`           | `string`   | Statyczny region Google Vertex dla dokładnych hostów globalnych.                              |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks usuwany z pasujących hostów, aby ujawnić prefiks regionu Google Vertex.                |

## Odniesienie providerRequest

Używaj `providerRequest` do tanich metadanych zgodności żądań, których ogólna
polityka żądań potrzebuje bez ładowania środowiska wykonywania dostawcy. Przepisywanie ładunku specyficzne dla
zachowania pozostaw w hakach środowiska wykonywania dostawcy lub współdzielonych helperach rodziny dostawców.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Pola dostawcy:

| Pole                  | Typ          | Znaczenie                                                                           |
| --------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `family`              | `string`     | Etykieta rodziny dostawcy używana przez ogólne decyzje zgodności żądań i diagnostykę. |
| `compatibilityFamily` | `"moonshot"` | Opcjonalny koszyk zgodności rodziny dostawców dla współdzielonych helperów żądań.    |
| `openAICompletions`   | `object`     | Flagi żądań uzupełnień zgodnych z OpenAI, obecnie `supportsStreamingUsage`.          |

## Odniesienie modelPricing

Używaj `modelPricing`, gdy dostawca potrzebuje zachowania cenowego płaszczyzny kontroli przed
załadowaniem środowiska wykonywania. Pamięć podręczna cen Gateway odczytuje te metadane bez importowania
kodu środowiska wykonywania dostawcy.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Pola dostawcy:

| Pole         | Typ               | Znaczenie                                                                                         |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Ustaw `false` dla lokalnych/samodzielnie hostowanych dostawców, którzy nigdy nie powinni pobierać cen OpenRouter ani LiteLLM. |
| `openRouter` | `false \| object` | Mapowanie wyszukiwania cen OpenRouter. `false` wyłącza wyszukiwanie OpenRouter dla tego dostawcy. |
| `liteLLM`    | `false \| object` | Mapowanie wyszukiwania cen LiteLLM. `false` wyłącza wyszukiwanie LiteLLM dla tego dostawcy.       |

Pola źródła:

| Pole                       | Typ                | Znaczenie                                                                                                           |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identyfikator dostawcy zewnętrznego katalogu, gdy różni się od identyfikatora dostawcy OpenClaw, na przykład `z-ai` dla dostawcy `zai`. |
| `passthroughProviderModel` | `boolean`          | Traktuj identyfikatory modeli zawierające ukośnik jako zagnieżdżone odwołania dostawca/model, przydatne dla dostawców proxy, takich jak OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Dodatkowe warianty identyfikatorów modeli zewnętrznego katalogu. `version-dots` próbuje identyfikatorów wersji z kropkami, takich jak `claude-opus-4.6`. |

### Indeks dostawców OpenClaw

Indeks dostawców OpenClaw to należące do OpenClaw metadane podglądowe dla dostawców,
których pluginy mogą nie być jeszcze zainstalowane. Nie jest częścią manifestu pluginu.
Manifesty pluginów pozostają autorytetem zainstalowanego pluginu. Indeks dostawców jest
wewnętrznym kontraktem rezerwowym, z którego przyszłe powierzchnie instalowalnych dostawców i selektorów
modeli przed instalacją będą korzystać, gdy plugin dostawcy nie jest zainstalowany.

Kolejność autorytatywności katalogu:

1. Konfiguracja użytkownika.
2. Manifest zainstalowanego pluginu `modelCatalog`.
3. Pamięć podręczna katalogu modeli z jawnego odświeżenia.
4. Wiersze podglądowe Indeksu dostawców OpenClaw.

Indeks dostawców nie może zawierać sekretów, stanu włączenia, hooków środowiska uruchomieniowego ani danych modeli na żywo specyficznych dla konta. Jego katalogi podglądu używają tego samego kształtu wiersza dostawcy `modelCatalog` co manifesty pluginów, ale powinny pozostać ograniczone do stabilnych metadanych wyświetlania, chyba że pola adaptera środowiska uruchomieniowego, takie jak `api`, `baseUrl`, ceny lub flagi zgodności, są celowo utrzymywane w zgodności z manifestem zainstalowanego pluginu. Dostawcy z wykrywaniem `/models` na żywo powinni zapisywać odświeżone wiersze przez jawną ścieżkę pamięci podręcznej katalogu modeli zamiast wywoływać interfejsy API dostawcy podczas zwykłego listowania lub onboardingu.

Wpisy Indeksu dostawców mogą też zawierać metadane instalowalnego pluginu dla dostawców, których plugin został przeniesiony poza rdzeń albo nie jest jeszcze zainstalowany z innego powodu. Te metadane odzwierciedlają wzorzec katalogu kanałów: nazwa pakietu, specyfikacja instalacji npm, oczekiwana integralność i tanie etykiety wyboru uwierzytelniania wystarczą, aby pokazać instalowalną opcję konfiguracji. Po zainstalowaniu pluginu jego manifest ma pierwszeństwo, a wpis Indeksu dostawców jest ignorowany dla tego dostawcy.

Przestarzałe klucze możliwości najwyższego poziomu są wycofane. Użyj `openclaw doctor --fix`, aby przenieść `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` i `webSearchProviders` pod `contracts`; normalne ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako własności możliwości.

## Manifest a package.json

Te dwa pliki pełnią różne funkcje:

| Plik                   | Użyj go do                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywania, walidacji konfiguracji, metadanych wyboru uwierzytelniania i wskazówek interfejsu użytkownika, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadanych npm, instalacji zależności i bloku `openclaw` używanego do punktów wejścia, bramkowania instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie należy umieścić dany fragment metadanych, zastosuj tę regułę:

- jeśli OpenClaw musi go znać przed załadowaniem kodu pluginu, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych albo zachowania instalacji npm, umieść go w `package.json`

### Pola package.json wpływające na wykrywanie

Część metadanych pluginu sprzed uruchomienia celowo znajduje się w `package.json` w bloku `openclaw` zamiast w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Co oznacza                                                                                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Deklaruje natywne punkty wejścia pluginu. Muszą pozostać w katalogu pakietu pluginu.                                                                                                 |
| `openclaw.runtimeExtensions`                                      | Deklaruje zbudowane punkty wejścia środowiska uruchomieniowego JavaScript dla zainstalowanych pakietów. Muszą pozostać w katalogu pakietu pluginu.                                  |
| `openclaw.setupEntry`                                             | Lekki punkt wejścia wyłącznie do konfiguracji, używany podczas onboardingu, odroczonego uruchamiania kanału oraz statusu kanału tylko do odczytu/wykrywania SecretRef. Musi pozostać w katalogu pakietu pluginu. |
| `openclaw.runtimeSetupEntry`                                      | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Musi pozostać w katalogu pakietu pluginu.                                                    |
| `openclaw.channel`                                                | Tanie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                                                                    |
| `openclaw.channel.commands`                                       | Statyczne metadane natywnych poleceń i automatycznych domyślnych wartości natywnych umiejętności, używane przez konfigurację, audyt i powierzchnie list poleceń przed załadowaniem środowiska uruchomieniowego kanału. |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania stanu skonfigurowania, które mogą odpowiedzieć na pytanie „czy konfiguracja tylko z env już istnieje?” bez ładowania pełnego środowiska uruchomieniowego kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania utrwalonego uwierzytelnienia, które mogą odpowiedzieć na pytanie „czy cokolwiek jest już zalogowane?” bez ładowania pełnego środowiska uruchomieniowego kanału. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla dołączonych i zewnętrznie publikowanych pluginów.                                                                                              |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                         |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, z dolną granicą semver, taką jak `>=2026.3.22`.                                                                                         |
| `openclaw.install.expectedIntegrity`                              | Oczekiwany ciąg integralności dystrybucji npm, taki jak `sha512-...`; przepływy instalacji i aktualizacji weryfikują pobrany artefakt względem niego.                                |
| `openclaw.install.allowInvalidConfigRecovery`                     | Zezwala na wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego pluginu, gdy konfiguracja jest nieprawidłowa.                                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala powierzchniom kanału wyłącznie do konfiguracji ładować się przed pełnym pluginem kanału podczas uruchamiania.                                                                |

Metadane manifestu decydują, które wybory dostawcy/kanału/konfiguracji pojawiają się w onboardingu przed załadowaniem środowiska uruchomieniowego. `package.json#openclaw.install` mówi onboardingowi, jak pobrać albo włączyć ten plugin, gdy użytkownik wybierze jedną z tych opcji. Nie przenoś wskazówek instalacji do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru manifestów. Nieprawidłowe wartości są odrzucane; nowsze, ale poprawne wartości powodują pominięcie pluginu na starszych hostach.

Dokładne przypięcie wersji npm znajduje się już w `npmSpec`, na przykład `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne zewnętrzne wpisy katalogu powinny łączyć dokładne specyfikacje z `expectedIntegrity`, aby przepływy aktualizacji kończyły się bezpiecznym niepowodzeniem, jeśli pobrany artefakt npm nie pasuje już do przypiętego wydania. Interaktywny onboarding nadal oferuje zaufane specyfikacje npm z rejestru, w tym same nazwy pakietów i dist-tag, dla zgodności. Diagnostyka katalogu potrafi rozróżnić źródła dokładne, pływające, przypięte integralnością, bez integralności, z niezgodnością nazwy pakietu i z nieprawidłowym wyborem domyślnym. Ostrzega też, gdy `expectedIntegrity` jest obecne, ale nie ma poprawnego źródła npm, które można nim przypiąć. Gdy `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji je egzekwują; gdy jest pominięte, rozstrzygnięcie rejestru jest zapisywane bez przypięcia integralności.

Pluginy kanałów powinny udostępniać `openclaw.setupEntry`, gdy skany statusu, listy kanałów lub SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego środowiska uruchomieniowego. Punkt wejścia konfiguracji powinien udostępniać metadane kanału oraz bezpieczne dla konfiguracji adaptery konfiguracji, statusu i sekretów; klientów sieciowych, listenery Gateway i środowiska uruchomieniowe transportu trzymaj w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia środowiska uruchomieniowego nie zastępują kontroli granic pakietu dla pól źródłowych punktów wejścia. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że uciekająca ścieżka `openclaw.extensions` stanie się ładowalna.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie sprawia, że dowolne uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala przepływom instalacji odzyskać się tylko po konkretnych nieaktualnych awariach aktualizacji dołączonego pluginu, takich jak brakująca ścieżka dołączonego pluginu albo nieaktualny wpis `channels.<id>` dla tego samego dołączonego pluginu. Niepowiązane błędy konfiguracji nadal blokują instalację i kierują operatorów do `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` to metadane pakietu dla bardzo małego modułu sprawdzającego:

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

Używaj tego, gdy konfiguracja, doctor, status albo przepływy obecności tylko do odczytu potrzebują taniego sondowania uwierzytelnienia tak/nie przed załadowaniem pełnego pluginu kanału. Utrwalony stan uwierzytelnienia nie jest skonfigurowanym stanem kanału: nie używaj tych metadanych do automatycznego włączania pluginów, naprawy zależności środowiska uruchomieniowego ani decydowania, czy środowisko uruchomieniowe kanału powinno się załadować. Docelowy eksport powinien być małą funkcją, która odczytuje tylko utrwalony stan; nie prowadź go przez pełny barrel środowiska uruchomieniowego kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla tanich sprawdzeń skonfigurowania tylko z env:

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

Używaj tego, gdy kanał może odpowiedzieć na stan skonfigurowania na podstawie env albo innych drobnych wejść poza środowiskiem uruchomieniowym. Jeśli sprawdzenie wymaga pełnego rozstrzygania konfiguracji albo rzeczywistego środowiska uruchomieniowego kanału, pozostaw tę logikę w hooku pluginu `config.hasConfiguredState`.

## Pierwszeństwo wykrywania (zduplikowane identyfikatory pluginów)

OpenClaw wykrywa pluginy z kilku korzeni (dołączone, globalna instalacja, workspace, jawne ścieżki wybrane w konfiguracji). Jeśli dwa odkrycia mają ten sam `id`, zachowywany jest tylko manifest o **najwyższym priorytecie**; duplikaty o niższym priorytecie są odrzucane zamiast ładować się obok niego.

Priorytet, od najwyższego do najniższego:

1. **Wybrane w konfiguracji** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Dołączone** — pluginy dostarczane z OpenClaw
3. **Globalna instalacja** — pluginy zainstalowane w globalnym korzeniu pluginów OpenClaw
4. **Workspace** — pluginy wykryte względem bieżącego workspace

Konsekwencje:

- Sforkowana lub nieaktualna kopia dołączonego pluginu znajdująca się w workspace nie przesłoni dołączonej kompilacji.
- Aby faktycznie zastąpić dołączony plugin lokalnym, przypnij go przez `plugins.entries.<id>`, aby wygrał priorytetem zamiast polegać na wykrywaniu w workspace.
- Odrzucone duplikaty są logowane, aby Doctor i diagnostyka uruchamiania mogły wskazać odrzuconą kopię.

## Wymagania JSON Schema

- **Każdy plugin musi dostarczać JSON Schema**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest dopuszczalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w czasie działania.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału jest zadeklarowany przez
  manifest pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja zostaje zachowana, a
  **ostrzeżenie** jest pokazywane w Doctorze i logach.

Pełny schemat `plugins.*` znajdziesz w [odwołaniu do konfiguracji](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym dla wczytań z lokalnego systemu plików. Runtime nadal wczytuje moduł pluginu osobno; manifest służy tylko do wykrywania i walidacji.
- Manifesty natywne są analizowane jako JSON5, więc komentarze, końcowe przecinki i nieujęte w cudzysłów klucze są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestów odczytuje tylko udokumentowane pola manifestu. Unikaj niestandardowych kluczy najwyższego poziomu.
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy plugin ich nie potrzebuje.
- `providerDiscoveryEntry` musi pozostać lekki i nie powinien importować obszernego kodu runtime; używaj go do statycznych metadanych katalogu dostawców lub wąskich deskryptorów wykrywania, a nie do wykonywania podczas obsługi żądań.
- Wyłączne typy pluginów wybiera się przez `plugins.slots.*`: `kind: "memory"` przez `plugins.slots.memory`, `kind: "context-engine"` przez `plugins.slots.contextEngine` (domyślnie `legacy`).
- Zadeklaruj wyłączny typ pluginu w tym manifeście. `OpenClawPluginDefinition.kind` w punkcie wejścia runtime jest przestarzałe i pozostaje tylko jako zapasowa zgodność dla starszych pluginów.
- Metadane zmiennych środowiskowych (`setup.providers[].envVars`, przestarzałe `providerAuthEnvVars` i `channelEnvVars`) są wyłącznie deklaratywne. Status, audyt, walidacja dostarczania cron i inne powierzchnie tylko do odczytu nadal stosują politykę zaufania pluginu i efektywnej aktywacji, zanim uznają zmienną środowiskową za skonfigurowaną.
- Metadane kreatora runtime wymagające kodu dostawcy opisano w [hookach runtime dostawcy](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli Twój plugin zależy od modułów natywnych, udokumentuj kroki kompilacji i wszelkie wymagania dotyczące listy dozwolonych pakietów menedżera pakietów (na przykład pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Powiązane

<CardGroup cols={3}>
  <Card title="Tworzenie pluginów" href="/pl/plugins/building-plugins" icon="rocket">
    Pierwsze kroki z pluginami.
  </Card>
  <Card title="Architektura pluginów" href="/pl/plugins/architecture" icon="diagram-project">
    Wewnętrzna architektura i model możliwości.
  </Card>
  <Card title="Przegląd SDK" href="/pl/plugins/sdk-overview" icon="book">
    Odwołanie do SDK pluginów i importy podścieżek.
  </Card>
</CardGroup>
