---
read_when:
    - Tworzysz Plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji dla Plugin albo debugować błędy walidacji Plugin
summary: Wymagania dotyczące manifestu Plugin + schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Pluginu
x-i18n:
    generated_at: "2026-05-10T19:46:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

Ta strona dotyczy wyłącznie **natywnego manifestu Plugin OpenClaw**.

Zgodne układy pakietów opisuje strona [Pakiety Plugin](/pl/plugins/bundles).

Zgodne formaty pakietów używają innych plików manifestu:

- Pakiet Codex: `.codex-plugin/plugin.json`
- Pakiet Claude: `.claude-plugin/plugin.json` albo domyślny układ komponentu Claude
  bez manifestu
- Pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa także te układy pakietów, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych pakietów OpenClaw obecnie odczytuje metadane pakietu oraz zadeklarowane
korzenie Skills, korzenie poleceń Claude, domyślne ustawienia `settings.json` pakietu Claude,
domyślne ustawienia LSP pakietu Claude i obsługiwane pakiety hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym Plugin**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Plugin**. Brakujące albo nieprawidłowe manifesty są traktowane jako
błędy Plugin i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Plugin: [Plugin](/pl/tools/plugin).
Informacje o natywnym modelu możliwości i aktualne wskazówki dotyczące zgodności zewnętrznej:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Co robi ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje **zanim załaduje kod
Plugin**. Wszystko poniżej musi dać się sprawdzić wystarczająco tanio bez uruchamiania
środowiska uruchomieniowego Plugin.

**Używaj go do:**

- tożsamości Plugin, walidacji konfiguracji i wskazówek dla interfejsu konfiguracji
- metadanych uwierzytelniania, onboardingu i konfiguracji początkowej (alias, automatyczne włączenie, zmienne środowiskowe dostawcy, wybory uwierzytelniania)
- wskazówek aktywacji dla powierzchni płaszczyzny sterowania
- skróconej własności rodzin modeli
- statycznych migawek własności możliwości (`contracts`)
- metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzić
- metadanych konfiguracji specyficznych dla kanału, scalanych z katalogiem i powierzchniami walidacji

**Nie używaj go do:** rejestrowania zachowania środowiska uruchomieniowego, deklarowania punktów wejścia kodu
ani metadanych instalacji npm. Te należą do kodu Plugin i `package.json`.

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

| Pole                                 | Wymagane | Typ                              | Co oznacza                                                                                                                                                                                                                         |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Tak      | `string`                         | Kanoniczny identyfikator pluginu. To identyfikator używany w `plugins.entries.<id>`.                                                                                                                                                |
| `configSchema`                       | Tak      | `object`                         | Wbudowany JSON Schema dla konfiguracji tego pluginu.                                                                                                                                                                                |
| `enabledByDefault`                   | Nie      | `true`                           | Oznacza dołączony plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić plugin domyślnie wyłączony.                                                                              |
| `enabledByDefaultOnPlatforms`        | Nie      | `string[]`                       | Oznacza dołączony plugin jako domyślnie włączony tylko na wymienionych platformach Node.js, na przykład `["darwin"]`. Jawna konfiguracja nadal ma pierwszeństwo.                                                                    |
| `legacyPluginIds`                    | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten plugin, gdy uwierzytelnianie, konfiguracja lub referencje modeli je wymieniają.                                                                                  |
| `kind`                               | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj pluginu używany przez `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                  |
| `providers`                          | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                                                                |
| `providerCatalogEntry`               | Nie      | `string`                         | Lekka ścieżka modułu katalogu dostawców, względna względem katalogu głównego pluginu, dla metadanych katalogu dostawców o zakresie manifestu, które można ładować bez aktywowania pełnego środowiska uruchomieniowego pluginu.     |
| `modelSupport`                       | Nie      | `object`                         | Należące do manifestu skrótowe metadane rodzin modeli używane do automatycznego ładowania pluginu przed uruchomieniem.                                                                                                             |
| `modelCatalog`                       | Nie      | `object`                         | Deklaratywne metadane katalogu modeli dla dostawców należących do tego pluginu. To kontrakt warstwy sterowania dla przyszłego listowania tylko do odczytu, onboardingu, selektorów modeli, aliasów i ukrywania bez ładowania środowiska uruchomieniowego pluginu. |
| `modelPricing`                       | Nie      | `object`                         | Należąca do dostawcy zasada wyszukiwania zewnętrznych cen. Użyj jej, aby wyłączyć lokalnych/samodzielnie hostowanych dostawców ze zdalnych katalogów cen albo mapować referencje dostawców na identyfikatory katalogów OpenRouter/LiteLLM bez kodowania identyfikatorów dostawców w core. |
| `modelIdNormalization`               | Nie      | `object`                         | Należące do dostawcy czyszczenie aliasów/prefiksów identyfikatorów modeli, które musi zostać uruchomione przed załadowaniem środowiska uruchomieniowego dostawcy.                                                                  |
| `providerEndpoints`                  | Nie      | `object[]`                       | Należące do manifestu metadane hosta/baseUrl endpointów dla tras dostawców, które core musi sklasyfikować przed załadowaniem środowiska uruchomieniowego dostawcy.                                                                 |
| `providerRequest`                    | Nie      | `object`                         | Tanie metadane rodziny dostawcy i zgodności żądań używane przez ogólną politykę żądań przed załadowaniem środowiska uruchomieniowego dostawcy.                                                                                    |
| `cliBackends`                        | Nie      | `string[]`                       | Identyfikatory backendów wnioskowania CLI należących do tego pluginu. Używane do automatycznej aktywacji przy starcie na podstawie jawnych referencji konfiguracji.                                                                |
| `syntheticAuthRefs`                  | Nie      | `string[]`                       | Referencje dostawców lub backendów CLI, których należący do pluginu syntetyczny hak uwierzytelniania powinien zostać sprawdzony podczas zimnego wykrywania modeli przed załadowaniem środowiska uruchomieniowego.                 |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                       | Należące do dołączonego pluginu zastępcze wartości kluczy API reprezentujące niepoufny lokalny, OAuth lub środowiskowy stan poświadczeń.                                                                                           |
| `commandAliases`                     | Nie      | `object[]`                       | Nazwy poleceń należące do tego pluginu, które powinny tworzyć świadome pluginu diagnostyki konfiguracji i CLI przed załadowaniem środowiska uruchomieniowego.                                                                      |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`       | Przestarzałe metadane zgodności zmiennych środowiskowych dla wyszukiwania uwierzytelniania/statusu dostawcy. Dla nowych pluginów preferuj `setup.providers[].envVars`; OpenClaw nadal odczytuje to pole w okresie wycofywania.     |
| `providerAuthAliases`                | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący klucz API i profile uwierzytelniania dostawcy bazowego.      |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`       | Tanie metadane zmiennych środowiskowych kanału, które OpenClaw może sprawdzać bez ładowania kodu pluginu. Użyj tego dla sterowanej zmiennymi środowiskowymi konfiguracji kanału lub powierzchni uwierzytelniania, które powinny widzieć ogólne pomocniki startu/konfiguracji. |
| `providerAuthChoices`                | Nie      | `object[]`                       | Tanie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozwiązywania preferowanego dostawcy i prostego podłączania flag CLI.                                                                                           |
| `activation`                         | Nie      | `object`                         | Tanie metadane planera aktywacji dla ładowania wyzwalanego startem, dostawcą, poleceniem, kanałem, trasą i funkcją. Tylko metadane; środowisko uruchomieniowe pluginu nadal odpowiada za rzeczywiste zachowanie.                   |
| `setup`                              | Nie      | `object`                         | Tanie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania środowiska uruchomieniowego pluginu.                                                                         |
| `qaRunners`                          | Nie      | `object[]`                       | Tanie deskryptory runnerów QA używane przez współdzielony host `openclaw qa` przed załadowaniem środowiska uruchomieniowego pluginu.                                                                                               |
| `contracts`                          | Nie      | `object`                         | Statyczna migawka własności funkcji dla zewnętrznych haków uwierzytelniania, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów, generowania obrazów, generowania muzyki, generowania wideo, pobierania z sieci, wyszukiwania w sieci i własności narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`         | Tanie wartości domyślne rozumienia mediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                                  |
| `imageGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania obrazów dla identyfikatorów dostawców zadeklarowanych w `contracts.imageGenerationProviders`, w tym należące do dostawcy aliasy uwierzytelniania i osłony bazowego URL-a.             |
| `videoGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania wideo dla identyfikatorów dostawców zadeklarowanych w `contracts.videoGenerationProviders`, w tym należące do dostawcy aliasy uwierzytelniania i osłony bazowego URL-a.               |
| `musicGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania muzyki dla identyfikatorów dostawców zadeklarowanych w `contracts.musicGenerationProviders`, w tym należące do dostawcy aliasy uwierzytelniania i osłony bazowego URL-a.              |
| `toolMetadata`                       | Nie      | `Record<string, object>`         | Tanie metadane dostępności dla narzędzi należących do pluginu zadeklarowanych w `contracts.tools`. Użyj ich, gdy narzędzie nie powinno ładować środowiska uruchomieniowego, chyba że istnieją dowody z konfiguracji, zmiennych środowiskowych lub uwierzytelniania. |
| `channelConfigs`                     | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału scalane z powierzchniami wykrywania i walidacji przed załadowaniem środowiska uruchomieniowego.                                                                                  |
| `skills`                             | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego pluginu.                                                                                                                                                        |
| `name`                               | Nie      | `string`                         | Nazwa Plugin czytelna dla człowieka.                                                                                                                                                                                                |
| `description`                        | Nie      | `string`                         | Krótki opis wyświetlany w powierzchniach Plugin.                                                                                                                                                                                    |
| `version`                            | Nie      | `string`                         | Informacyjna wersja Plugin.                                                                                                                                                                                                         |
| `uiHints`                            | Nie      | `Record<string, object>`         | Etykiety interfejsu użytkownika, teksty zastępcze i wskazówki dotyczące wrażliwości pól konfiguracji.                                                                                                                               |

## Odniesienie do metadanych dostawcy generowania

Pola metadanych dostawcy generowania opisują statyczne sygnały uwierzytelniania dla
dostawców zadeklarowanych w pasującej liście `contracts.*GenerationProviders`.
OpenClaw odczytuje te pola przed załadowaniem runtime dostawcy, aby narzędzia core mogły
ustalić, czy dostawca generowania jest dostępny, bez importowania każdego
pluginu dostawcy.

Używaj tych pól wyłącznie do tanich, deklaratywnych faktów. Transport, przekształcenia
żądań, odświeżanie tokenów, walidacja poświadczeń i faktyczne zachowanie generowania
pozostają w runtime pluginu.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Każdy wpis metadanych obsługuje:

| Pole            | Wymagane | Typ        | Co oznacza                                                                                                                            |
| --------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Nie      | `string[]` | Dodatkowe identyfikatory dostawców, które powinny liczyć się jako statyczne aliasy uwierzytelniania dla dostawcy generowania.        |
| `authProviders` | Nie      | `string[]` | Identyfikatory dostawców, których skonfigurowane profile uwierzytelniania powinny liczyć się jako uwierzytelnianie dla tego dostawcy generowania. |
| `configSignals` | Nie      | `object[]` | Tanie sygnały dostępności oparte wyłącznie na konfiguracji dla dostawców lokalnych lub self-hosted, których można skonfigurować bez profili uwierzytelniania ani zmiennych środowiskowych. |
| `authSignals`   | Nie      | `object[]` | Jawne sygnały uwierzytelniania. Gdy są obecne, zastępują domyślny zestaw sygnałów z identyfikatora dostawcy, `aliases` i `authProviders`. |

Każdy wpis `configSignals` obsługuje:

| Pole          | Wymagane | Typ        | Co oznacza                                                                                                                                                                                |
| ------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Tak      | `string`   | Ścieżka kropkowa do obiektu konfiguracji należącego do pluginu, który ma zostać sprawdzony, na przykład `plugins.entries.example.config`.                                                |
| `overlayPath` | Nie      | `string`   | Ścieżka kropkowa wewnątrz konfiguracji głównej, której obiekt powinien nałożyć się na obiekt główny przed oceną sygnału. Użyj tego dla konfiguracji specyficznej dla możliwości, takiej jak `image`, `video` lub `music`. |
| `required`    | Nie      | `string[]` | Ścieżki kropkowe wewnątrz efektywnej konfiguracji, które muszą mieć skonfigurowane wartości. Ciągi znaków muszą być niepuste; obiekty i tablice nie mogą być puste.                    |
| `requiredAny` | Nie      | `string[]` | Ścieżki kropkowe wewnątrz efektywnej konfiguracji, z których co najmniej jedna musi mieć skonfigurowaną wartość.                                                                         |
| `mode`        | Nie      | `object`   | Opcjonalna kontrola trybu jako ciągu znaków wewnątrz efektywnej konfiguracji. Użyj tego, gdy dostępność wyłącznie na podstawie konfiguracji dotyczy tylko jednego trybu.                 |

Każda kontrola `mode` obsługuje:

| Pole         | Wymagane | Typ        | Co oznacza                                                                            |
| ------------ | -------- | ---------- | ------------------------------------------------------------------------------------- |
| `path`       | Nie      | `string`   | Ścieżka kropkowa wewnątrz efektywnej konfiguracji. Domyślnie `mode`.                 |
| `default`    | Nie      | `string`   | Wartość trybu używana, gdy konfiguracja pomija tę ścieżkę.                           |
| `allowed`    | Nie      | `string[]` | Jeśli obecne, sygnał przechodzi tylko wtedy, gdy efektywny tryb jest jedną z tych wartości. |
| `disallowed` | Nie      | `string[]` | Jeśli obecne, sygnał kończy się niepowodzeniem, gdy efektywny tryb jest jedną z tych wartości. |

Każdy wpis `authSignals` obsługuje:

| Pole              | Wymagane | Typ      | Co oznacza                                                                                                                                                       |
| ----------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Tak      | `string` | Identyfikator dostawcy do sprawdzenia w skonfigurowanych profilach uwierzytelniania.                                                                             |
| `providerBaseUrl` | Nie      | `object` | Opcjonalna kontrola, która sprawia, że sygnał liczy się tylko wtedy, gdy wskazany skonfigurowany dostawca używa dozwolonego bazowego adresu URL. Użyj tego, gdy alias uwierzytelniania jest prawidłowy tylko dla określonych API. |

Każda kontrola `providerBaseUrl` obsługuje:

| Pole              | Wymagane | Typ        | Co oznacza                                                                                                                                             |
| ----------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Tak      | `string`   | Identyfikator konfiguracji dostawcy, którego `baseUrl` powinien zostać sprawdzony.                                                                     |
| `defaultBaseUrl`  | Nie      | `string`   | Bazowy adres URL przyjmowany, gdy konfiguracja dostawcy pomija `baseUrl`.                                                                              |
| `allowedBaseUrls` | Tak      | `string[]` | Dozwolone bazowe adresy URL dla tego sygnału uwierzytelniania. Sygnał jest ignorowany, gdy skonfigurowany lub domyślny bazowy adres URL nie pasuje do jednej z tych znormalizowanych wartości. |

## Odniesienie do metadanych narzędzi

`toolMetadata` używa tych samych kształtów `configSignals` i `authSignals` co
metadane dostawcy generowania, indeksowanych nazwą narzędzia. `contracts.tools` deklaruje
własność. `toolMetadata` deklaruje tanie dowody dostępności, aby OpenClaw mógł
uniknąć importowania runtime pluginu tylko po to, by fabryka jego narzędzia zwróciła `null`.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Jeśli narzędzie nie ma `toolMetadata`, OpenClaw zachowuje istniejące zachowanie i
ładuje plugin właściciela, gdy kontrakt narzędzia pasuje do polityki. Dla narzędzi
na gorącej ścieżce, których fabryka zależy od uwierzytelniania/konfiguracji, autorzy pluginów powinni deklarować
`toolMetadata` zamiast powodować, że core importuje runtime, aby zapytać.

## Odniesienie do providerAuthChoices

Każdy wpis `providerAuthChoices` opisuje jedną opcję onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem runtime dostawcy.
Listy konfiguracji dostawcy używają tych wyborów z manifestu, wyborów konfiguracji
wyprowadzonych z deskryptora oraz metadanych katalogu instalacyjnego bez ładowania runtime dostawcy.

| Pole                  | Wymagane | Typ                                             | Co oznacza                                                                                                      |
| --------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ten wybór.                                                            |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której ma nastąpić dispatch.                                          |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru uwierzytelniania używany przez przepływy onboardingu i CLI.                      |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli pominięta, OpenClaw używa awaryjnie `choiceId`.                       |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                          |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.                |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukryj wybór w selektorach asystenta, nadal umożliwiając ręczny wybór w CLI.                                    |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyborów, które powinny przekierowywać użytkowników do tego wyboru zastępczego.          |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                               |
| `groupLabel`          | Nie      | `string`                                        | Etykieta widoczna dla użytkownika dla tej grupy.                                                                |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                              |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                                  |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, taka jak `--openrouter-api-key`.                                                               |
| `cliOption`           | Nie      | `string`                                        | Pełny kształt opcji CLI, taki jak `--openrouter-api-key <key>`.                                                 |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                                      |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Powierzchnie onboardingu, w których ten wybór powinien się pojawiać. Jeśli pominięte, domyślnie `["text-inference"]`. |

## Odniesienie do commandAliases

Użyj `commandAliases`, gdy plugin jest właścicielem nazwy polecenia runtime, którą użytkownicy mogą
błędnie umieścić w `plugins.allow` lub spróbować uruchomić jako główne polecenie CLI. OpenClaw
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

| Pole         | Wymagane | Typ               | Co oznacza                                                                      |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należącego do tego pluginu.                                     |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash czatu, a nie główne polecenie CLI.           |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI sugerowane dla operacji CLI, jeśli takie istnieje. |

## Dokumentacja `activation`

Użyj `activation`, gdy plugin może tanio zadeklarować, które zdarzenia płaszczyzny sterowania
powinny uwzględniać go w planie aktywacji/ładowania.

Ten blok to metadane planisty, a nie API cyklu życia. Nie rejestruje
zachowania runtime, nie zastępuje `register(...)` i nie obiecuje, że
kod pluginu został już wykonany. Planista aktywacji używa tych pól do
zawężenia kandydatów na pluginy przed powrotem do istniejących metadanych
własności w manifeście, takich jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki.

Preferuj najwęższe metadane, które już opisują własność. Używaj
`providers`, `channels`, `commandAliases`, deskryptorów setupu lub `contracts`,
gdy te pola wyrażają relację. Używaj `activation` dla dodatkowych
wskazówek planisty, których nie da się reprezentować przez te pola własności.
Używaj najwyższego poziomu `cliBackends` dla aliasów runtime CLI, takich jak `claude-cli`,
`codex-cli` lub `google-gemini-cli`; `activation.onAgentHarnesses` służy tylko do
osadzonych identyfikatorów uprzęży agentów, które nie mają już pola własności.

Ten blok zawiera wyłącznie metadane. Nie rejestruje zachowania runtime i nie
zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia runtime/pluginu.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem pluginów, więc
brak metadanych aktywacji poza startem zwykle kosztuje tylko wydajność; nie
powinien zmieniać poprawności, dopóki nadal istnieją fallbacki własności manifestu.

Każdy plugin powinien celowo ustawić `activation.onStartup`. Ustaw go na `true`
tylko wtedy, gdy plugin musi działać podczas startu Gateway. Ustaw go na `false`, gdy
plugin jest bezczynny przy starcie i powinien ładować się tylko z węższych wyzwalaczy.
Pominięcie `onStartup` nie powoduje już niejawnego ładowania pluginu przy starcie; używaj jawnych
metadanych aktywacji dla startu, kanału, konfiguracji, uprzęży agenta, pamięci lub
innych węższych wyzwalaczy aktywacji.

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

| Pole               | Wymagane | Typ                                                  | Co oznacza                                                                                                                                                                                     |
| ------------------ | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nie      | `boolean`                                            | Jawna aktywacja przy starcie Gateway. Każdy plugin powinien to ustawić. `true` importuje plugin podczas startu; `false` utrzymuje go leniwym przy starcie, chyba że inny dopasowany wyzwalacz wymaga ładowania. |
| `onProviders`      | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                                  |
| `onAgentHarnesses` | Nie      | `string[]`                                           | Identyfikatory runtime osadzonych uprzęży agentów, które powinny uwzględniać ten plugin w planach aktywacji/ładowania. Używaj najwyższego poziomu `cliBackends` dla aliasów backendów CLI.      |
| `onCommands`       | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                                    |
| `onChannels`       | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                                    |
| `onRoutes`         | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                                              |
| `onConfigPaths`    | Nie      | `string[]`                                           | Ścieżki konfiguracji względne wobec katalogu głównego, które powinny uwzględniać ten plugin w planach startu/ładowania, gdy ścieżka istnieje i nie jest jawnie wyłączona.                     |
| `onCapabilities`   | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki dotyczące możliwości używane przez planowanie aktywacji płaszczyzny sterowania. Preferuj węższe pola, gdy to możliwe.                                                       |

Obecni konsumenci na żywo:

- planowanie startu Gateway używa `activation.onStartup` do jawnego
  importu przy starcie
- planowanie CLI wyzwalane poleceniem wraca do starszych
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie startu runtime agenta używa `activation.onAgentHarnesses` dla
  osadzonych uprzęży oraz najwyższego poziomu `cliBackends[]` dla aliasów runtime CLI
- planowanie setupu/kanału wyzwalane kanałem wraca do starszej własności `channels[]`,
  gdy brakuje jawnych metadanych aktywacji kanału
- planowanie pluginów przy starcie używa `activation.onConfigPaths` dla głównych powierzchni
  konfiguracji niebędących kanałami, takich jak blok `browser` dołączonego pluginu przeglądarki
- planowanie setupu/runtime wyzwalane dostawcą wraca do starszej własności
  `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych
  aktywacji dostawcy

Diagnostyka planisty może odróżniać jawne wskazówki aktywacji od fallbacku
własności manifestu. Na przykład `activation-command-hint` oznacza, że
dopasowano `activation.onCommands`, a `manifest-command-alias` oznacza, że
planista użył zamiast tego własności `commandAliases`. Te etykiety powodów są przeznaczone dla
diagnostyki hosta i testów; autorzy pluginów powinni nadal deklarować metadane,
które najlepiej opisują własność.

## Dokumentacja `qaRunners`

Użyj `qaRunners`, gdy plugin wnosi jeden lub więcej runnerów transportu pod
wspólnym katalogiem głównym `openclaw qa`. Utrzymuj te metadane tanie i statyczne; runtime pluginu
nadal jest właścicielem rzeczywistej rejestracji CLI przez lekką powierzchnię
`runtime-api.ts`, która eksportuje `qaRunnerCliRegistrations`.

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

| Pole          | Wymagane | Typ      | Co oznacza                                                                  |
| ------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.              |
| `description` | Nie      | `string` | Zapasowy tekst pomocy używany, gdy wspólny host potrzebuje polecenia atrapy. |

## Dokumentacja `setup`

Użyj `setup`, gdy powierzchnie konfiguracji i onboardingu potrzebują tanich metadanych
należących do pluginu, zanim runtime zostanie załadowany.

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

Najwyższy poziom `cliBackends` pozostaje prawidłowy i nadal opisuje backendy
wnioskowania CLI. `setup.cliBackends` to specyficzna dla setupu powierzchnia deskryptora dla
przepływów płaszczyzny sterowania/setupu, które powinny pozostać wyłącznie metadanymi.

Gdy są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania z deskryptorem na pierwszym miejscu dla odkrywania setupu. Jeśli deskryptor tylko
zawęża kandydujący plugin, a setup nadal potrzebuje bogatszych hooków runtime podczas setupu,
ustaw `requiresRuntime: true` i zachowaj `setup-api` jako
zapasową ścieżkę wykonania.

OpenClaw uwzględnia też `setup.providers[].envVars` w ogólnych wyszukiwaniach
uwierzytelniania dostawcy i zmiennych środowiskowych. `providerAuthEnvVars` pozostaje obsługiwane przez adapter
zgodności w oknie wycofywania, ale niedołączone pluginy, które nadal go używają,
otrzymują diagnostykę manifestu. Nowe pluginy powinny umieszczać metadane środowiska setupu/statusu
w `setup.providers[].envVars`.

OpenClaw może też wyprowadzać proste wybory setupu z `setup.providers[].authMethods`,
gdy wpis setupu nie jest dostępny albo gdy `setup.requiresRuntime: false`
deklaruje, że runtime setupu jest zbędny. Jawne wpisy `providerAuthChoices` pozostają
preferowane dla niestandardowych etykiet, flag CLI, zakresu onboardingu i metadanych asystenta.

Ustaw `requiresRuntime: false` tylko wtedy, gdy te deskryptory wystarczają dla
powierzchni setupu. OpenClaw traktuje jawne `false` jako kontrakt wyłącznie deskryptorowy
i nie wykona `setup-api` ani `openclaw.setupEntry` na potrzeby wyszukiwania setupu. Jeśli
plugin wyłącznie deskryptorowy nadal dostarcza jeden z tych wpisów runtime setupu,
OpenClaw zgłasza addytywną diagnostykę i nadal go ignoruje. Pominięte
`requiresRuntime` zachowuje starsze zachowanie fallbacku, aby istniejące pluginy, które dodały
deskryptory bez tej flagi, nie przestały działać.

Ponieważ wyszukiwanie setupu może wykonywać należący do pluginu kod `setup-api`, znormalizowane
wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne we wszystkich
odkrytych pluginach. Niejednoznaczna własność kończy się bezpiecznym niepowodzeniem zamiast wybierania
zwycięzcy według kolejności odkrywania.

Gdy runtime setupu faktycznie się wykonuje, diagnostyka rejestru setupu zgłasza rozjazd deskryptora,
jeśli `setup-api` rejestruje dostawcę lub backend CLI, którego deskryptory manifestu
nie deklarują, albo jeśli deskryptor nie ma pasującej rejestracji runtime.
Te diagnostyki są addytywne i nie odrzucają starszych pluginów.

### Dokumentacja `setup.providers`

| Pole           | Wymagane | Typ        | Co oznacza                                                                                           |
| -------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `id`           | Tak      | `string`   | Identyfikator dostawcy ujawniany podczas setupu lub onboardingu. Utrzymuj znormalizowane identyfikatory globalnie unikalne. |
| `authMethods`  | Nie      | `string[]` | Identyfikatory metod setupu/uwierzytelniania obsługiwane przez tego dostawcę bez ładowania pełnego runtime. |
| `envVars`      | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie setupu/statusu mogą sprawdzić przed załadowaniem runtime pluginu. |
| `authEvidence` | Nie      | `object[]` | Tanie lokalne sprawdzenia dowodów uwierzytelniania dla dostawców, którzy mogą uwierzytelniać się przez niesekretne znaczniki. |

`authEvidence` służy do należących do dostawcy lokalnych znaczników poświadczeń, które można
zweryfikować bez ładowania kodu runtime. Te sprawdzenia muszą pozostać tanie i lokalne:
bez wywołań sieciowych, bez odczytów z pęku kluczy ani menedżera sekretów, bez poleceń powłoki i bez
sond API dostawcy.

Obsługiwane wpisy dowodów:

| Pole               | Wymagane | Typ        | Co oznacza                                                                                                              |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `type`             | Tak      | `string`   | Obecnie `local-file-with-env`.                                                                                          |
| `fileEnvVar`       | Nie      | `string`   | Zmienna środowiskowa zawierająca jawną ścieżkę do pliku poświadczeń.                                                    |
| `fallbackPaths`    | Nie      | `string[]` | Lokalne ścieżki plików poświadczeń sprawdzane, gdy `fileEnvVar` jest nieobecne lub puste. Obsługuje `${HOME}` i `${APPDATA}`. |
| `requiresAnyEnv`   | Nie      | `string[]` | Co najmniej jedna wymieniona zmienna środowiskowa musi być niepusta, zanim dowód będzie prawidłowy.                     |
| `requiresAllEnv`   | Nie      | `string[]` | Każda wymieniona zmienna środowiskowa musi być niepusta, zanim dowód będzie prawidłowy.                                 |
| `credentialMarker` | Tak      | `string`   | Nietajny znacznik zwracany, gdy dowód jest obecny.                                                                       |
| `source`           | Nie      | `string`   | Etykieta źródła widoczna dla użytkownika w danych wyjściowych uwierzytelniania/statusu.                                |

### pola setup

| Pole               | Wymagane | Typ        | Co oznacza                                                                                                  |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji dostawcy ujawniane podczas konfiguracji i onboardingu.                             |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów używane podczas konfiguracji do wyszukiwania konfiguracji najpierw po deskryptorze. Utrzymuj znormalizowane identyfikatory jako globalnie unikalne. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego pluginu.                     |
| `requiresRuntime`  | Nie      | `boolean`  | Czy konfiguracja nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                              |

## Dokumentacja referencyjna uiHints

`uiHints` to mapa nazw pól konfiguracji na małe wskazówki renderowania.

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

| Pole          | Typ        | Co oznacza                              |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika. |
| `help`        | `string`   | Krótki tekst pomocniczy.                |
| `tags`        | `string[]` | Opcjonalne tagi UI.                     |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.         |
| `sensitive`   | `boolean`  | Oznacza pole jako tajne lub wrażliwe.   |
| `placeholder` | `string`   | Tekst zastępczy dla pól formularza.     |

## Dokumentacja referencyjna contracts

Używaj `contracts` tylko do statycznych metadanych własności capability, które OpenClaw może
odczytać bez importowania runtime pluginu.

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

| Pole                             | Typ        | Co oznacza                                                               |
| -------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory fabryk rozszerzeń serwera aplikacji Codex, obecnie `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identyfikatory runtime, dla których dołączony plugin może rejestrować middleware wyników narzędzi. |
| `externalAuthProviders`          | `string[]` | Identyfikatory dostawców, których hook zewnętrznego profilu uwierzytelniania należy do tego pluginu. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należących do tego pluginu.                |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należących do tego pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należących do tego pluginu. |
| `memoryEmbeddingProviders`       | `string[]` | Identyfikatory dostawców embeddingów pamięci należących do tego pluginu. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia mediów należących do tego pluginu.   |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należących do tego pluginu. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należących do tego pluginu.   |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania z sieci należących do tego pluginu.  |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania w sieci należących do tego pluginu. |
| `migrationProviders`             | `string[]` | Identyfikatory dostawców importu należących do tego pluginu dla `openclaw migrate`. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego pluginu.                        |

`contracts.embeddedExtensionFactories` jest zachowane dla dołączonych fabryk rozszerzeń
tylko dla serwera aplikacji Codex. Dołączone transformacje wyników narzędzi powinny
deklarować `contracts.agentToolResultMiddleware` i zamiast tego rejestrować się przez
`api.registerAgentToolResultMiddleware(...)`. Zewnętrzne pluginy nie mogą
rejestrować middleware wyników narzędzi, ponieważ seam może przepisać dane wyjściowe narzędzi o wysokim zaufaniu,
zanim zobaczy je model.

Rejestracje runtime `api.registerTool(...)` muszą odpowiadać `contracts.tools`.
Wykrywanie narzędzi używa tej listy, aby ładować tylko runtime tych pluginów, które mogą być właścicielami
żądanych narzędzi.

Pluginy dostawców, które implementują `resolveExternalAuthProfiles`, powinny deklarować
`contracts.externalAuthProviders`. Pluginy bez tej deklaracji nadal przechodzą
przez przestarzały fallback zgodności, ale ten fallback jest wolniejszy i
zostanie usunięty po oknie migracji.

Dołączeni dostawcy embeddingów pamięci powinni deklarować
`contracts.memoryEmbeddingProviders` dla każdego udostępnianego identyfikatora adaptera, w tym
wbudowanych adapterów, takich jak `local`. Samodzielne ścieżki CLI używają tego kontraktu manifestu,
aby załadować tylko plugin właścicielski, zanim pełny runtime Gateway
zarejestruje dostawców.

## Dokumentacja referencyjna mediaUnderstandingProviderMetadata

Używaj `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia mediów ma
domyślne modele, priorytet fallbacku automatycznego uwierzytelniania lub natywną obsługę dokumentów, których
ogólne helpery core potrzebują przed załadowaniem runtime. Klucze muszą być też zadeklarowane w
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

| Pole                   | Typ                                 | Co oznacza                                                                       |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capability mediów udostępniane przez tego dostawcę.                              |
| `defaultModels`        | `Record<string, string>`            | Domyślne mapowania capability na model używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby są sortowane wcześniej dla automatycznego fallbacku dostawcy na podstawie poświadczeń. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez dostawcę.                           |

## Dokumentacja referencyjna channelConfigs

Używaj `channelConfigs`, gdy plugin kanału potrzebuje tanich metadanych konfiguracji przed
załadowaniem runtime. Wykrywanie konfiguracji/statusu kanału tylko do odczytu może używać tych metadanych
bezpośrednio dla skonfigurowanych kanałów zewnętrznych, gdy nie ma dostępnego wpisu setup, albo
gdy `setup.requiresRuntime: false` deklaruje, że runtime konfiguracji jest zbędny.

`channelConfigs` to metadane manifestu pluginu, a nie nowa sekcja konfiguracji użytkownika najwyższego poziomu.
Użytkownicy nadal konfigurują instancje kanałów pod `channels.<channel-id>`.
OpenClaw odczytuje metadane manifestu, aby zdecydować, który plugin jest właścicielem danego skonfigurowanego
kanału, zanim wykona się kod runtime pluginu.

Dla pluginu kanału `configSchema` i `channelConfigs` opisują różne
ścieżki:

- `configSchema` waliduje `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` waliduje `channels.<channel-id>`

Pluginy niedołączone, które deklarują `channels[]`, powinny też deklarować pasujące
wpisy `channelConfigs`. Bez nich OpenClaw nadal może załadować plugin, ale
schemat konfiguracji ścieżki zimnej, konfiguracja i powierzchnie Control UI nie mogą znać
kształtu opcji należących do kanału, dopóki runtime pluginu się nie wykona.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` i
`nativeSkillsAutoEnabled` mogą deklarować statyczne domyślne wartości `auto` dla sprawdzeń konfiguracji poleceń,
które uruchamiają się przed załadowaniem runtime kanału. Dołączone kanały mogą też publikować
te same wartości domyślne przez `package.json#openclaw.channel.commands` obok
innych metadanych katalogu kanałów należących do ich pakietu.

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

| Pole          | Typ                      | Znaczenie                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI/symbole zastępcze/wskazówki wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami wyboru i inspekcji, gdy metadane runtime nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                  |
| `commands`    | `object`                 | Statyczne automatyczne wartości domyślne natywnego polecenia i natywnej skill dla sprawdzeń konfiguracji przed runtime. |
| `preferOver`  | `string[]`               | Identyfikatory starszych lub niżej priorytetowych Plugin, które ten kanał powinien wyprzedzać w powierzchniach wyboru. |

### Zastępowanie innego Plugin kanału

Użyj `preferOver`, gdy Twój Plugin jest preferowanym właścicielem identyfikatora kanału, który
może również dostarczać inny Plugin. Typowe przypadki to zmieniony identyfikator Plugin,
samodzielny Plugin zastępujący dołączony Plugin albo utrzymywany fork, który
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

Gdy skonfigurowane jest `channels.chat`, OpenClaw uwzględnia zarówno identyfikator kanału, jak i
identyfikator preferowanego Plugin. Jeśli Plugin o niższym priorytecie został wybrany tylko dlatego,
że jest dołączony lub domyślnie włączony, OpenClaw wyłącza go w efektywnej
konfiguracji runtime, aby jeden Plugin był właścicielem kanału i jego narzędzi. Jawny wybór
użytkownika nadal wygrywa: jeśli użytkownik jawnie włączy oba Plugin, OpenClaw
zachowuje ten wybór i zgłasza diagnostykę zduplikowanych kanałów/narzędzi zamiast
po cichu zmieniać żądany zestaw Plugin.

Ogranicz `preferOver` do identyfikatorów Plugin, które naprawdę mogą dostarczać ten sam kanał.
Nie jest to ogólne pole priorytetu i nie zmienia nazw kluczy konfiguracji użytkownika.

## Dokumentacja modelSupport

Użyj `modelSupport`, gdy OpenClaw powinien wywnioskować Twój Plugin dostawcy na podstawie
skróconych identyfikatorów modeli, takich jak `gpt-5.5` lub `claude-sonnet-4.6`, zanim załaduje się runtime Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje tę kolejność pierwszeństwa:

- jawne referencje `provider/model` używają metadanych manifestu `providers` właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują zarówno jeden niedołączony Plugin, jak i jeden dołączony Plugin, wygrywa
  niedołączony Plugin
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Znaczenie                                                                       |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane za pomocą `startsWith` do skróconych identyfikatorów modeli. |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

## Dokumentacja modelCatalog

Użyj `modelCatalog`, gdy OpenClaw powinien znać metadane modeli dostawcy przed
załadowaniem runtime Plugin. To źródło należące do manifestu dla stałych wierszy katalogu,
aliasów dostawców, reguł wyciszania i trybu wykrywania. Odświeżanie runtime
nadal należy do kodu runtime dostawcy, ale manifest informuje rdzeń, kiedy runtime
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

| Pole           | Typ                                                      | Znaczenie                                                                                                   |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Wiersze katalogu dla identyfikatorów dostawców należących do tego Plugin. Klucze powinny też występować w `providers` najwyższego poziomu. |
| `aliases`      | `Record<string, object>`                                 | Aliasy dostawców, które powinny być rozwiązywane do posiadanego dostawcy na potrzeby planowania katalogu lub wyciszeń. |
| `suppressions` | `object[]`                                               | Wiersze modeli z innego źródła, które ten Plugin wycisza z powodu specyficznego dla dostawcy.              |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Czy katalog dostawcy może zostać odczytany z metadanych manifestu, odświeżony do pamięci podręcznej, czy wymaga runtime. |

`aliases` uczestniczy w wyszukiwaniu własności dostawcy na potrzeby planowania katalogu modeli.
Cele aliasów muszą być dostawcami najwyższego poziomu należącymi do tego samego Plugin. Gdy
lista filtrowana według dostawcy używa aliasu, OpenClaw może odczytać manifest właściciela i
zastosować nadpisania API/bazowego URL aliasu bez ładowania runtime dostawcy.
Aliasy nie rozszerzają niefiltrowanych list katalogu; szerokie listy emitują tylko wiersze
kanonicznego dostawcy właściciela.

`suppressions` zastępuje stary hak runtime dostawcy `suppressBuiltInModel`.
Wpisy wyciszeń są honorowane tylko wtedy, gdy dostawca należy do Plugin albo
jest zadeklarowany jako klucz `modelCatalog.aliases`, który wskazuje posiadanego dostawcę. Haki
wyciszania runtime nie są już wywoływane podczas rozwiązywania modelu.

Pola dostawcy:

| Pole      | Typ                      | Znaczenie                                                           |
| --------- | ------------------------ | ------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Opcjonalny domyślny bazowy URL dla modeli w tym katalogu dostawcy. |
| `api`     | `ModelApi`               | Opcjonalny domyślny adapter API dla modeli w tym katalogu dostawcy. |
| `headers` | `Record<string, string>` | Opcjonalne statyczne nagłówki stosowane do tego katalogu dostawcy. |
| `models`  | `object[]`               | Wymagane wiersze modeli. Wiersze bez `id` są ignorowane.            |

Pola modelu:

| Pole            | Typ                                                            | Znaczenie                                                                   |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Lokalny dla dostawcy identyfikator modelu, bez prefiksu `provider/`.        |
| `name`          | `string`                                                       | Opcjonalna nazwa wyświetlana.                                               |
| `api`           | `ModelApi`                                                     | Opcjonalne nadpisanie API dla modelu.                                       |
| `baseUrl`       | `string`                                                       | Opcjonalne nadpisanie bazowego URL dla modelu.                              |
| `headers`       | `Record<string, string>`                                       | Opcjonalne statyczne nagłówki dla modelu.                                   |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalności akceptowane przez model.                                         |
| `reasoning`     | `boolean`                                                      | Czy model udostępnia zachowanie rozumowania.                                |
| `contextWindow` | `number`                                                       | Natywne okno kontekstu dostawcy.                                            |
| `contextTokens` | `number`                                                       | Opcjonalny efektywny limit kontekstu runtime, gdy różni się od `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maksymalna liczba tokenów wyjściowych, jeśli jest znana.                    |
| `cost`          | `object`                                                       | Opcjonalne ceny w USD za milion tokenów, w tym opcjonalne `tieredPricing`.  |
| `compat`        | `object`                                                       | Opcjonalne flagi zgodności odpowiadające zgodności konfiguracji modelu OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status na liście. Wyciszaj tylko wtedy, gdy wiersz nie może się w ogóle pojawić. |
| `statusReason`  | `string`                                                       | Opcjonalny powód pokazywany przy statusie innym niż dostępny.               |
| `replaces`      | `string[]`                                                     | Starsze lokalne dla dostawcy identyfikatory modeli, które ten model zastępuje. |
| `replacedBy`    | `string`                                                       | Lokalny dla dostawcy identyfikator modelu zastępczego dla przestarzałych wierszy. |
| `tags`          | `string[]`                                                     | Stabilne tagi używane przez selektory i filtry.                             |

Pola wyciszenia:

| Pole                       | Typ        | Znaczenie                                                                                                 |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identyfikator dostawcy dla wiersza nadrzędnego do wyciszenia. Musi należeć do tego Plugin lub być zadeklarowany jako posiadany alias. |
| `model`                    | `string`   | Lokalny dla dostawcy identyfikator modelu do wyciszenia.                                                  |
| `reason`                   | `string`   | Opcjonalny komunikat pokazywany, gdy wyciszony wiersz zostanie zażądany bezpośrednio.                     |
| `when.baseUrlHosts`        | `string[]` | Opcjonalna lista efektywnych hostów bazowego URL dostawcy wymaganych, zanim wyciszenie zostanie zastosowane. |
| `when.providerConfigApiIn` | `string[]` | Opcjonalna lista dokładnych wartości `api` konfiguracji dostawcy wymaganych, zanim wyciszenie zostanie zastosowane. |

Nie umieszczaj danych dostępnych wyłącznie w czasie wykonywania w `modelCatalog`. Używaj `static` tylko wtedy, gdy
wiersze manifestu są na tyle kompletne, że powierzchnie listy filtrowanej według dostawcy i selektora mogą pominąć
odkrywanie rejestru/czasu wykonywania. Używaj `refreshable`, gdy wiersze manifestu są przydatnymi
nasionami lub uzupełnieniami możliwymi do wylistowania, ale odświeżenie/pamięć podręczna może później dodać więcej wierszy;
wiersze odświeżalne same w sobie nie są autorytatywne. Używaj `runtime`, gdy OpenClaw
musi załadować runtime dostawcy, aby poznać listę.

## Informacje referencyjne modelIdNormalization

Używaj `modelIdNormalization` do taniego, kontrolowanego przez dostawcę czyszczenia identyfikatorów modeli, które musi
nastąpić przed załadowaniem runtime dostawcy. Dzięki temu aliasy, takie jak krótkie nazwy modeli,
lokalne dla dostawcy starsze identyfikatory oraz reguły prefiksów proxy, pozostają w manifeście właścicielskiego pluginu
zamiast w podstawowych tabelach wyboru modeli.

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

| Pole                                 | Typ                     | Co oznacza                                                                                 |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | Dokładne aliasy identyfikatorów modeli bez rozróżniania wielkości liter. Wartości są zwracane w zapisanej postaci. |
| `stripPrefixes`                      | `string[]`              | Prefiksy do usunięcia przed wyszukiwaniem aliasu, przydatne przy starszej duplikacji dostawca/model. |
| `prefixWhenBare`                     | `string`                | Prefiks do dodania, gdy znormalizowany identyfikator modelu nie zawiera jeszcze `/`.       |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Warunkowe reguły prefiksów dla prostych identyfikatorów po wyszukaniu aliasu, kluczowane przez `modelPrefix` i `prefix`. |

## Informacje referencyjne providerEndpoints

Używaj `providerEndpoints` do klasyfikacji punktów końcowych, którą ogólna polityka żądań
musi znać przed załadowaniem runtime dostawcy. Core nadal jest właścicielem znaczenia każdej
`endpointClass`; manifesty pluginów są właścicielami metadanych hosta i bazowego URL.

Pola punktu końcowego:

| Pole                           | Typ        | Co oznacza                                                                                         |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Znana podstawowa klasa punktu końcowego, taka jak `openrouter`, `moonshot-native` lub `google-vertex`. |
| `hosts`                        | `string[]` | Dokładne nazwy hostów mapowane na klasę punktu końcowego.                                          |
| `hostSuffixes`                 | `string[]` | Sufiksy hostów mapowane na klasę punktu końcowego. Poprzedź `.` w celu dopasowywania wyłącznie sufiksów domen. |
| `baseUrls`                     | `string[]` | Dokładne znormalizowane bazowe adresy URL HTTP(S) mapowane na klasę punktu końcowego.              |
| `googleVertexRegion`           | `string`   | Statyczny region Google Vertex dla dokładnych hostów globalnych.                                   |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks do usunięcia z pasujących hostów, aby odsłonić prefiks regionu Google Vertex.               |

## Informacje referencyjne providerRequest

Używaj `providerRequest` do tanich metadanych zgodności żądań, których ogólna
polityka żądań potrzebuje bez ładowania runtime dostawcy. Przepisywanie ładunku specyficzne dla zachowania
trzymaj w hookach runtime dostawcy albo we współdzielonych helperach rodziny dostawców.

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

| Pole                  | Typ          | Co oznacza                                                                            |
| --------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etykieta rodziny dostawcy używana przez ogólne decyzje zgodności żądań i diagnostykę. |
| `compatibilityFamily` | `"moonshot"` | Opcjonalny kubeł zgodności rodziny dostawców dla współdzielonych helperów żądań.      |
| `openAICompletions`   | `object`     | Flagi żądań uzupełnień zgodnych z OpenAI, obecnie `supportsStreamingUsage`.           |

## Informacje referencyjne modelPricing

Używaj `modelPricing`, gdy dostawca potrzebuje zachowania wyceny w płaszczyźnie kontroli przed
załadowaniem runtime. Pamięć podręczna wyceny Gateway odczytuje te metadane bez importowania
kodu runtime dostawcy.

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

| Pole         | Typ               | Co oznacza                                                                                          |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Ustaw `false` dla lokalnych/samodzielnie hostowanych dostawców, którzy nigdy nie powinni pobierać wyceny OpenRouter ani LiteLLM. |
| `openRouter` | `false \| object` | Mapowanie wyszukiwania wyceny OpenRouter. `false` wyłącza wyszukiwanie OpenRouter dla tego dostawcy. |
| `liteLLM`    | `false \| object` | Mapowanie wyszukiwania wyceny LiteLLM. `false` wyłącza wyszukiwanie LiteLLM dla tego dostawcy.       |

Pola źródłowe:

| Pole                       | Typ                | Co oznacza                                                                                                           |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identyfikator dostawcy w zewnętrznym katalogu, gdy różni się od identyfikatora dostawcy OpenClaw, na przykład `z-ai` dla dostawcy `zai`. |
| `passthroughProviderModel` | `boolean`          | Traktuj identyfikatory modeli zawierające ukośnik jako zagnieżdżone referencje dostawca/model, przydatne dla dostawców proxy, takich jak OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Dodatkowe warianty identyfikatorów modeli z zewnętrznego katalogu. `version-dots` próbuje identyfikatorów wersji z kropkami, takich jak `claude-opus-4.6`. |

### Indeks dostawców OpenClaw

Indeks dostawców OpenClaw to należące do OpenClaw metadane podglądu dla dostawców,
których pluginy mogą nie być jeszcze zainstalowane. Nie jest częścią manifestu pluginu.
Manifesty pluginów pozostają autorytetem zainstalowanego pluginu. Indeks dostawców jest
wewnętrznym kontraktem awaryjnym, z którego będą korzystać przyszłe powierzchnie instalowalnych dostawców i selektora modeli przed instalacją, gdy plugin dostawcy nie jest zainstalowany.

Kolejność autorytetu katalogu:

1. Konfiguracja użytkownika.
2. `modelCatalog` manifestu zainstalowanego pluginu.
3. Pamięć podręczna katalogu modeli z jawnego odświeżenia.
4. Wiersze podglądu Indeksu dostawców OpenClaw.

Indeks dostawców nie może zawierać sekretów, stanu włączenia, hooków runtime ani
aktywnych danych modeli specyficznych dla konta. Jego katalogi podglądu używają tego samego
kształtu wiersza dostawcy `modelCatalog` co manifesty pluginów, ale powinny pozostawać ograniczone
do stabilnych metadanych wyświetlania, chyba że pola adaptera runtime, takie jak `api`,
`baseUrl`, wycena lub flagi zgodności, są celowo utrzymywane w zgodności z
manifestem zainstalowanego pluginu. Dostawcy z aktywnym odkrywaniem `/models` powinni
zapisywać odświeżone wiersze przez jawną ścieżkę pamięci podręcznej katalogu modeli zamiast
sprawiać, że zwykłe listowanie lub onboarding wywołują API dostawców.

Wpisy Indeksu dostawców mogą też zawierać metadane instalowalnych pluginów dla dostawców,
których plugin został przeniesiony poza core albo w inny sposób nie jest jeszcze zainstalowany. Te
metadane odzwierciedlają wzorzec katalogu kanałów: nazwa pakietu, spec instalacji npm,
oczekiwana integralność oraz tanie etykiety wyboru uwierzytelniania wystarczą, aby pokazać
instalowalną opcję konfiguracji. Po zainstalowaniu pluginu jego manifest wygrywa, a
wpis Indeksu dostawców jest ignorowany dla tego dostawcy.

Starsze klucze możliwości najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` pod `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako własności
możliwości.

## Manifest kontra package.json

Te dwa pliki pełnią różne funkcje:

| Plik                   | Do czego go używać                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Odkrywanie, walidacja konfiguracji, metadane wyboru uwierzytelniania i podpowiedzi UI, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadane npm, instalacja zależności i blok `openclaw` używany do punktów wejścia, bramek instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien znaleźć się element metadanych, użyj tej reguły:

- jeśli OpenClaw musi to znać przed załadowaniem kodu pluginu, umieść to w `openclaw.plugin.json`
- jeśli dotyczy pakietowania, plików wejściowych lub zachowania instalacji npm, umieść to w `package.json`

### Pola package.json wpływające na odkrywanie

Niektóre metadane pluginu sprzed uruchomienia celowo znajdują się w `package.json` pod blokiem
`openclaw` zamiast w `openclaw.plugin.json`.
`openclaw.bundle` i `openclaw.bundle.json` nie są kontraktami pluginu OpenClaw;
natywne pluginy muszą używać `openclaw.plugin.json` oraz obsługiwanych pól
`package.json#openclaw` poniżej.

Ważne przykłady:

| Pole                                                                                       | Co oznacza                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Deklaruje natywne punkty wejścia pluginu. Musi pozostać wewnątrz katalogu pakietu pluginu.                                                                                                          |
| `openclaw.runtimeExtensions`                                                               | Deklaruje zbudowane punkty wejścia środowiska uruchomieniowego JavaScript dla zainstalowanych pakietów. Musi pozostać wewnątrz katalogu pakietu pluginu.                                           |
| `openclaw.setupEntry`                                                                      | Lekki punkt wejścia tylko do konfiguracji, używany podczas wdrażania, odroczonego uruchamiania kanału oraz tylko do odczytu stanu kanału/wykrywania SecretRef. Musi pozostać wewnątrz katalogu pakietu pluginu. |
| `openclaw.runtimeSetupEntry`                                                               | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Wymaga `setupEntry`, musi istnieć i musi pozostać wewnątrz katalogu pakietu pluginu.                       |
| `openclaw.channel`                                                                         | Tanie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                                                                                   |
| `openclaw.channel.commands`                                                                | Statyczne metadane natywnego polecenia i automatycznych ustawień domyślnych natywnej umiejętności, używane przez konfigurację, audyt i powierzchnie list poleceń przed załadowaniem środowiska uruchomieniowego kanału. |
| `openclaw.channel.configuredState`                                                         | Lekkie metadane kontrolera stanu skonfigurowania, który może odpowiedzieć na pytanie „czy konfiguracja tylko przez env już istnieje?” bez ładowania pełnego środowiska uruchomieniowego kanału.     |
| `openclaw.channel.persistedAuthState`                                                      | Lekkie metadane kontrolera utrwalonego uwierzytelnienia, który może odpowiedzieć na pytanie „czy cokolwiek jest już zalogowane?” bez ładowania pełnego środowiska uruchomieniowego kanału.          |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Wskazówki instalacji/aktualizacji dla pluginów dołączonych i publikowanych zewnętrznie.                                                                                                             |
| `openclaw.install.defaultChoice`                                                           | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                                        |
| `openclaw.install.minHostVersion`                                                          | Minimalna obsługiwana wersja hosta OpenClaw, używająca dolnej granicy semver, takiej jak `>=2026.3.22` lub `>=2026.5.1-beta.1`.                                                                     |
| `openclaw.install.expectedIntegrity`                                                       | Oczekiwany ciąg integralności dystrybucji npm, taki jak `sha512-...`; przepływy instalacji i aktualizacji weryfikują pobrany artefakt względem niego.                                               |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Zezwala na wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego pluginu, gdy konfiguracja jest nieprawidłowa.                                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Pozwala powierzchniom kanału tylko do konfiguracji ładować się przed pełnym pluginem kanału podczas uruchamiania.                                                                                   |

Metadane manifestu decydują, które wybory dostawcy/kanału/konfiguracji pojawiają się we wdrażaniu przed załadowaniem środowiska uruchomieniowego. `package.json#openclaw.install` mówi wdrażaniu, jak pobrać lub włączyć ten plugin, gdy użytkownik wybierze jedną z tych opcji. Nie przenoś wskazówek instalacji do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru manifestów dla źródeł pluginów niedołączonych. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości pomijają zewnętrzne pluginy na starszych hostach. Dołączone pluginy źródłowe są uznawane za współwersjonowane z checkoutem hosta.

Oficjalne metadane instalacji na żądanie powinny używać `clawhubSpec`, gdy plugin jest opublikowany w ClawHub; wdrażanie traktuje to jako preferowane zdalne źródło i zapisuje fakty artefaktu ClawHub po instalacji. `npmSpec` pozostaje zgodnościową opcją awaryjną dla pakietów, które jeszcze nie przeniosły się do ClawHub.

Dokładne przypięcie wersji npm już znajduje się w `npmSpec`, na przykład `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne wpisy katalogu zewnętrznego powinny łączyć dokładne specyfikacje z `expectedIntegrity`, aby przepływy aktualizacji kończyły się zamknięciem w razie niezgodności, jeśli pobrany artefakt npm nie pasuje już do przypiętego wydania. Interaktywne wdrażanie nadal oferuje zaufane specyfikacje npm z rejestru, w tym same nazwy pakietów i dist-tagi, dla zgodności. Diagnostyka katalogu potrafi rozróżniać źródła dokładne, płynne, przypięte integralnością, bez integralności, z niezgodnością nazwy pakietu i z nieprawidłowym wyborem domyślnym. Ostrzega też, gdy `expectedIntegrity` jest obecne, ale nie ma prawidłowego źródła npm, które może przypiąć. Gdy `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji je egzekwują; gdy jest pominięte, rozwiązanie z rejestru jest zapisywane bez przypięcia integralności.

Pluginy kanałów powinny udostępniać `openclaw.setupEntry`, gdy skany stanu, listy kanałów lub SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego środowiska uruchomieniowego. Punkt wejścia konfiguracji powinien ujawniać metadane kanału oraz bezpieczne dla konfiguracji adaptery config, stanu i sekretów; klientów sieciowych, nasłuchiwacze Gateway i transportowe środowiska uruchomieniowe trzymaj w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia środowiska uruchomieniowego nie zastępują kontroli granic pakietu dla pól źródłowych punktów wejścia. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że uciekająca ścieżka `openclaw.extensions` stanie się ładowalna.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie sprawia, że dowolnie uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala tylko przepływom instalacji odzyskać się po konkretnych przestarzałych awariach aktualizacji dołączonego pluginu, takich jak brakująca ścieżka dołączonego pluginu lub przestarzały wpis `channels.<id>` dla tego samego dołączonego pluginu. Niepowiązane błędy konfiguracji nadal blokują instalację i kierują operatorów do `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` to metadane pakietu dla niewielkiego modułu kontrolera:

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

Używaj ich, gdy przepływy konfiguracji, doctor, stanu lub obecności tylko do odczytu potrzebują taniego sondowania uwierzytelnienia typu tak/nie przed załadowaniem pełnego pluginu kanału. Utrwalony stan uwierzytelnienia nie jest skonfigurowanym stanem kanału: nie używaj tych metadanych do automatycznego włączania pluginów, naprawiania zależności środowiska uruchomieniowego ani decydowania, czy środowisko uruchomieniowe kanału powinno się załadować. Eksport docelowy powinien być małą funkcją, która czyta wyłącznie utrwalony stan; nie kieruj jej przez pełny barrel środowiska uruchomieniowego kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla tanich kontroli skonfigurowania tylko przez env:

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

Używaj ich, gdy kanał może odpowiedzieć na stan skonfigurowania na podstawie env lub innych niewielkich danych wejściowych poza środowiskiem uruchomieniowym. Jeśli kontrola wymaga pełnego rozwiązywania konfiguracji lub rzeczywistego środowiska uruchomieniowego kanału, zachowaj tę logikę zamiast tego w hooku pluginu `config.hasConfiguredState`.

## Pierwszeństwo wykrywania (zduplikowane identyfikatory pluginów)

OpenClaw wykrywa pluginy z kilku źródeł głównych (dołączone, globalna instalacja, workspace, jawne ścieżki wybrane w konfiguracji). Jeśli dwa odkrycia współdzielą ten sam `id`, zachowywany jest tylko manifest o **najwyższym priorytecie**; duplikaty o niższym priorytecie są odrzucane zamiast ładowania obok niego.

Priorytet, od najwyższego do najniższego:

1. **Wybrany w konfiguracji** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Dołączony** — pluginy dostarczane z OpenClaw
3. **Globalna instalacja** — pluginy zainstalowane w globalnym katalogu pluginów OpenClaw
4. **Workspace** — pluginy wykryte względem bieżącego workspace

Konsekwencje:

- Sforkowana lub przestarzała kopia dołączonego pluginu znajdująca się w workspace nie przesłoni dołączonej kompilacji.
- Aby faktycznie zastąpić dołączony plugin lokalnym, przypnij go przez `plugins.entries.<id>`, aby wygrał priorytetem zamiast polegać na wykrywaniu w workspace.
- Odrzucenia duplikatów są logowane, aby diagnostyka Doctor i uruchamiania mogła wskazać odrzuconą kopię.
- Nadpisania duplikatów wybranych w konfiguracji są w diagnostyce opisywane jako jawne nadpisania, ale nadal ostrzegają, aby przestarzałe forki i przypadkowe przesłonięcia pozostawały widoczne.

## Wymagania JSON Schema

- **Każdy plugin musi dostarczać JSON Schema**, nawet jeśli nie akceptuje konfiguracji.
- Pusty schemat jest dopuszczalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, nie w czasie działania.
- Podczas rozszerzania lub forkowania dołączonego pluginu o nowe klucze konfiguracji zaktualizuj jednocześnie `configSchema` tego pluginu w `openclaw.plugin.json`. Schematy dołączonych pluginów są rygorystyczne, więc dodanie `plugins.entries.<id>.config.myNewKey` w konfiguracji użytkownika bez dodania `myNewKey` do `configSchema.properties` zostanie odrzucone przed załadowaniem środowiska uruchomieniowego pluginu.

Przykład rozszerzenia schematu:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału jest zadeklarowany przez manifest pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*` muszą odwoływać się do **wykrywalnych** identyfikatorów pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat, walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja jest zachowywana, a **ostrzeżenie** pojawia się w Doctor i logach.

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration), aby poznać pełny schemat `plugins.*`.

## Uwagi

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym ładowanych z lokalnego systemu plików. Runtime nadal ładuje moduł pluginu osobno; manifest służy tylko do wykrywania i walidacji.
- Natywne manifesty są parsowane za pomocą JSON5, więc komentarze, końcowe przecinki i klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestów odczytuje tylko udokumentowane pola manifestu. Unikaj własnych kluczy najwyższego poziomu.
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy plugin ich nie potrzebuje.
- `providerCatalogEntry` musi pozostać lekkie i nie powinno importować rozległego kodu runtime; używaj go do statycznych metadanych katalogu providerów lub wąskich deskryptorów wykrywania, a nie do wykonywania w czasie obsługi żądania. `providerDiscoveryEntry` to starsza pisownia i nadal działa dla istniejących pluginów.
- Wyłączne rodzaje pluginów są wybierane przez `plugins.slots.*`: `kind: "memory"` przez `plugins.slots.memory`, `kind: "context-engine"` przez `plugins.slots.contextEngine` (domyślnie `legacy`).
- Zadeklaruj wyłączny rodzaj pluginu w tym manifeście. `OpenClawPluginDefinition.kind` w punkcie wejścia runtime jest przestarzałe i pozostaje tylko jako awaryjna warstwa zgodności dla starszych pluginów.
- Metadane zmiennych środowiskowych (`setup.providers[].envVars`, przestarzałe `providerAuthEnvVars` i `channelEnvVars`) mają wyłącznie charakter deklaratywny. Status, audyt, walidacja dostarczania Cron i inne powierzchnie tylko do odczytu nadal stosują zaufanie do pluginu oraz obowiązującą politykę aktywacji, zanim potraktują zmienną środowiskową jako skonfigurowaną.
- Metadane kreatora runtime wymagające kodu providera opisano w [hookach runtime providera](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli Twój plugin zależy od modułów natywnych, udokumentuj kroki budowania oraz wszelkie wymagania allowlist menedżera pakietów (na przykład pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Powiązane

<CardGroup cols={3}>
  <Card title="Tworzenie pluginów" href="/pl/plugins/building-plugins" icon="rocket">
    Pierwsze kroki z pluginami.
  </Card>
  <Card title="Architektura pluginów" href="/pl/plugins/architecture" icon="diagram-project">
    Architektura wewnętrzna i model możliwości.
  </Card>
  <Card title="Przegląd SDK" href="/pl/plugins/sdk-overview" icon="book">
    Dokumentacja Plugin SDK i importy ścieżek podrzędnych.
  </Card>
</CardGroup>
