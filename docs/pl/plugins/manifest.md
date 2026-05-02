---
read_when:
    - Tworzysz Plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji Pluginu lub debugować błędy walidacji Pluginu
summary: Wymagania dotyczące manifestu Plugin + schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-05-02T20:47:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Ta strona dotyczy wyłącznie **manifestu natywnego Plugin OpenClaw**.

Zgodne układy pakietów opisano w [pakietach Plugin](/pl/plugins/bundles).

Zgodne formaty pakietów używają innych plików manifestu:

- Pakiet Codex: `.codex-plugin/plugin.json`
- Pakiet Claude: `.claude-plugin/plugin.json` albo domyślny układ komponentów Claude
  bez manifestu
- Pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa również te układy pakietów, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych pakietów OpenClaw obecnie odczytuje metadane pakietu oraz zadeklarowane
katalogi główne umiejętności, katalogi główne poleceń Claude, domyślne ustawienia
`settings.json` pakietu Claude, domyślne ustawienia LSP pakietu Claude oraz obsługiwane pakiety hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** zawierać plik `openclaw.plugin.json` w
**katalogu głównym Plugin**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Plugin**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Plugin i blokują walidację konfiguracji.

Pełny przewodnik po systemie Plugin znajdziesz tutaj: [Plugin](/pl/tools/plugin).
Model natywnych możliwości i aktualne wskazówki dotyczące zgodności zewnętrznej:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Co robi ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje **zanim załaduje kod
Plugin**. Wszystko poniżej musi być wystarczająco tanie do sprawdzenia bez uruchamiania
środowiska uruchomieniowego Plugin.

**Używaj go do:**

- tożsamości Plugin, walidacji konfiguracji i podpowiedzi interfejsu konfiguracji
- metadanych uwierzytelniania, onboardingu i konfiguracji (alias, automatyczne włączanie, zmienne środowiskowe dostawcy, wybory uwierzytelniania)
- podpowiedzi aktywacji dla powierzchni warstwy sterowania
- skróconej własności rodzin modeli
- statycznych migawek własności możliwości (`contracts`)
- metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzić
- metadanych konfiguracji specyficznych dla kanału, scalanych z katalogiem i powierzchniami walidacji

**Nie używaj go do:** rejestrowania zachowania środowiska uruchomieniowego, deklarowania punktów wejścia kodu
ani metadanych instalacji npm. Te elementy należą do kodu Plugin i `package.json`.

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

| Pole                                 | Wymagane | Typ                              | Co oznacza                                                                                                                                                                                                                                  |
| ------------------------------------ | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Tak      | `string`                         | Kanoniczny identyfikator Plugin. To identyfikator używany w `plugins.entries.<id>`.                                                                                                                                                         |
| `configSchema`                       | Tak      | `object`                         | Wbudowany JSON Schema dla konfiguracji tego Plugin.                                                                                                                                                                                         |
| `enabledByDefault`                   | Nie      | `true`                           | Oznacza wbudowany Plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić Plugin domyślnie wyłączony.                                                                                       |
| `legacyPluginIds`                    | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora Plugin.                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten Plugin, gdy wspominają o nich uwierzytelnianie, konfiguracja lub odwołania do modeli.                                                                                     |
| `kind`                               | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj Plugin używany przez `plugins.slots.*`.                                                                                                                                                                           |
| `channels`                           | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego Plugin. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                            |
| `providers`                          | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego Plugin.                                                                                                                                                                                         |
| `providerDiscoveryEntry`             | Nie      | `string`                         | Lekka ścieżka modułu wykrywania dostawcy, względna względem katalogu głównego Plugin, dla metadanych katalogu dostawców ograniczonych do manifestu, które można wczytać bez aktywowania pełnego środowiska uruchomieniowego Plugin.         |
| `modelSupport`                       | Nie      | `object`                         | Skrótowe metadane rodzin modeli należące do manifestu, używane do automatycznego wczytania Plugin przed uruchomieniem środowiska uruchomieniowego.                                                                                          |
| `modelCatalog`                       | Nie      | `object`                         | Deklaratywne metadane katalogu modeli dla dostawców należących do tego Plugin. To kontrakt płaszczyzny sterowania dla przyszłych list tylko do odczytu, onboardingu, selektorów modeli, aliasów i wyciszania bez wczytywania środowiska uruchomieniowego Plugin. |
| `modelPricing`                       | Nie      | `object`                         | Polityka wyszukiwania zewnętrznych cen należąca do dostawcy. Użyj jej, aby wyłączyć lokalnych/samoobsługiwanych dostawców z zdalnych katalogów cen lub mapować odwołania dostawców na identyfikatory katalogów OpenRouter/LiteLLM bez kodowania identyfikatorów dostawców na sztywno w rdzeniu. |
| `modelIdNormalization`               | Nie      | `object`                         | Czyszczenie aliasów/prefiksów identyfikatorów modeli należące do dostawcy, które musi zostać wykonane przed wczytaniem środowiska uruchomieniowego dostawcy.                                                                                |
| `providerEndpoints`                  | Nie      | `object[]`                       | Należące do manifestu metadane hosta/pola baseUrl punktu końcowego dla tras dostawcy, które rdzeń musi sklasyfikować przed wczytaniem środowiska uruchomieniowego dostawcy.                                                                 |
| `providerRequest`                    | Nie      | `object`                         | Tanie metadane rodziny dostawcy i zgodności żądań używane przez ogólną politykę żądań przed wczytaniem środowiska uruchomieniowego dostawcy.                                                                                                |
| `cliBackends`                        | Nie      | `string[]`                       | Identyfikatory backendów wnioskowania CLI należących do tego Plugin. Używane do automatycznej aktywacji przy starcie z jawnych odwołań konfiguracji.                                                                                        |
| `syntheticAuthRefs`                  | Nie      | `string[]`                       | Odwołania do dostawcy lub backendu CLI, których należący do Plugin syntetyczny hook uwierzytelniania powinien zostać sprawdzony podczas zimnego wykrywania modeli przed wczytaniem środowiska uruchomieniowego.                             |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                       | Należące do wbudowanego Plugin wartości zastępcze kluczy API, które reprezentują nietajne lokalne, OAuth lub otaczające dane uwierzytelniające.                                                                                            |
| `commandAliases`                     | Nie      | `object[]`                       | Nazwy poleceń należące do tego Plugin, które powinny generować diagnostykę konfiguracji i CLI świadomą Plugin przed wczytaniem środowiska uruchomieniowego.                                                                                 |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`       | Przestarzałe metadane kompatybilności zmiennych środowiskowych do wyszukiwania uwierzytelniania/statusu dostawcy. Dla nowych Plugin preferuj `setup.providers[].envVars`; OpenClaw nadal odczytuje to pole w okresie wycofywania.          |
| `providerAuthAliases`                | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący klucz API i profile uwierzytelniania dostawcy bazowego.              |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`       | Tanie metadane zmiennych środowiskowych kanału, które OpenClaw może sprawdzić bez wczytywania kodu Plugin. Użyj tego dla konfiguracji kanału sterowanej zmiennymi środowiskowymi lub powierzchni uwierzytelniania, które powinny widzieć ogólne helpery uruchamiania/konfiguracji. |
| `providerAuthChoices`                | Nie      | `object[]`                       | Tanie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego podłączania flag CLI.                                                                                                    |
| `activation`                         | Nie      | `object`                         | Tanie metadane planera aktywacji dla uruchamiania, dostawcy, polecenia, kanału, trasy i ładowania wyzwalanego możliwościami. Tylko metadane; środowisko uruchomieniowe Plugin nadal posiada faktyczne zachowanie.                         |
| `setup`                              | Nie      | `object`                         | Tanie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzić bez wczytywania środowiska uruchomieniowego Plugin.                                                                                |
| `qaRunners`                          | Nie      | `object[]`                       | Tanie deskryptory runnerów QA używane przez współdzielony host `openclaw qa` przed wczytaniem środowiska uruchomieniowego Plugin.                                                                                                          |
| `contracts`                          | Nie      | `object`                         | Statyczny zrzut własności możliwości dla zewnętrznych hooków uwierzytelniania, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów, generowania obrazów, generowania muzyki, generowania wideo, pobierania z sieci, wyszukiwania w sieci i własności narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`         | Tanie wartości domyślne rozumienia mediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                                         |
| `imageGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania obrazów dla identyfikatorów dostawców zadeklarowanych w `contracts.imageGenerationProviders`, w tym aliasy uwierzytelniania i zabezpieczenia base-url należące do dostawcy.                   |
| `videoGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania wideo dla identyfikatorów dostawców zadeklarowanych w `contracts.videoGenerationProviders`, w tym aliasy uwierzytelniania i zabezpieczenia base-url należące do dostawcy.                     |
| `musicGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania muzyki dla identyfikatorów dostawców zadeklarowanych w `contracts.musicGenerationProviders`, w tym aliasy uwierzytelniania i zabezpieczenia base-url należące do dostawcy.                    |
| `toolMetadata`                       | Nie      | `Record<string, object>`         | Tanie metadane dostępności dla narzędzi należących do Plugin zadeklarowanych w `contracts.tools`. Użyj ich, gdy narzędzie nie powinno wczytywać środowiska uruchomieniowego, chyba że istnieją dowody konfiguracji, zmiennych środowiskowych lub uwierzytelniania. |
| `channelConfigs`                     | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału scalane z powierzchniami wykrywania i walidacji przed wczytaniem środowiska uruchomieniowego.                                                                                           |
| `skills`                             | Nie      | `string[]`                       | Katalogi Skill do wczytania, względne względem katalogu głównego Plugin.                                                                                                                                                                   |
| `name`                               | Nie      | `string`                         | Czytelna dla człowieka nazwa Plugin.                                                                                                                                                                                                       |
| `description`                        | Nie      | `string`                         | Krótkie podsumowanie wyświetlane w powierzchniach Plugin.                                                                                                                                                                           |
| `version`                            | Nie      | `string`                         | Informacyjna wersja Plugin.                                                                                                                                                                                                         |
| `uiHints`                            | Nie      | `Record<string, object>`         | Etykiety UI, symbole zastępcze i wskazówki dotyczące wrażliwości pól konfiguracji.                                                                                                                                                  |

## Odniesienie do metadanych dostawcy generowania

Pola metadanych dostawcy generowania opisują statyczne sygnały uwierzytelniania dla
dostawców zadeklarowanych na pasującej liście `contracts.*GenerationProviders`.
OpenClaw odczytuje te pola przed załadowaniem środowiska uruchomieniowego dostawcy, aby narzędzia rdzenia mogły
zdecydować, czy dostawca generowania jest dostępny bez importowania każdego
Plugin dostawcy.

Używaj tych pól tylko dla tanich, deklaratywnych faktów. Transport, przekształcenia
żądań, odświeżanie tokenów, walidacja poświadczeń i rzeczywiste działanie generowania
pozostają w środowisku uruchomieniowym Plugin.

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
| `aliases`       | Nie      | `string[]` | Dodatkowe identyfikatory dostawców, które powinny być traktowane jako statyczne aliasy uwierzytelniania dostawcy generowania.         |
| `authProviders` | Nie      | `string[]` | Identyfikatory dostawców, których skonfigurowane profile uwierzytelniania powinny być traktowane jako uwierzytelnianie tego dostawcy generowania. |
| `configSignals` | Nie      | `object[]` | Tanie sygnały dostępności oparte tylko na konfiguracji dla dostawców lokalnych lub hostowanych samodzielnie, których można skonfigurować bez profili uwierzytelniania ani zmiennych env. |
| `authSignals`   | Nie      | `object[]` | Jawne sygnały uwierzytelniania. Gdy są obecne, zastępują domyślny zestaw sygnałów z identyfikatora dostawcy, `aliases` i `authProviders`. |

Każdy wpis `configSignals` obsługuje:

| Pole          | Wymagane | Typ        | Co oznacza                                                                                                                                                                            |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Tak      | `string`   | Ścieżka kropkowa do należącego do Plugin obiektu konfiguracji do sprawdzenia, na przykład `plugins.entries.example.config`.                                                           |
| `overlayPath` | Nie      | `string`   | Ścieżka kropkowa wewnątrz konfiguracji głównej, której obiekt powinien zostać nałożony na obiekt główny przed oceną sygnału. Użyj tego dla konfiguracji specyficznej dla możliwości, takiej jak `image`, `video` lub `music`. |
| `required`    | Nie      | `string[]` | Ścieżki kropkowe wewnątrz efektywnej konfiguracji, które muszą mieć skonfigurowane wartości. Ciągi muszą być niepuste; obiekty i tablice nie mogą być puste.                         |
| `requiredAny` | Nie      | `string[]` | Ścieżki kropkowe wewnątrz efektywnej konfiguracji, gdzie co najmniej jedna musi mieć skonfigurowaną wartość.                                                                          |
| `mode`        | Nie      | `object`   | Opcjonalna blokada trybu tekstowego wewnątrz efektywnej konfiguracji. Użyj tego, gdy dostępność oparta tylko na konfiguracji dotyczy wyłącznie jednego trybu.                         |

Każda blokada `mode` obsługuje:

| Pole         | Wymagane | Typ        | Co oznacza                                                                            |
| ------------ | -------- | ---------- | ------------------------------------------------------------------------------------- |
| `path`       | Nie      | `string`   | Ścieżka kropkowa wewnątrz efektywnej konfiguracji. Domyślnie `mode`.                  |
| `default`    | Nie      | `string`   | Wartość trybu do użycia, gdy konfiguracja pomija ścieżkę.                             |
| `allowed`    | Nie      | `string[]` | Jeśli obecne, sygnał przechodzi tylko wtedy, gdy efektywny tryb jest jedną z tych wartości. |
| `disallowed` | Nie      | `string[]` | Jeśli obecne, sygnał kończy się niepowodzeniem, gdy efektywny tryb jest jedną z tych wartości. |

Każdy wpis `authSignals` obsługuje:

| Pole              | Wymagane | Typ      | Co oznacza                                                                                                                                                    |
| ----------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Tak      | `string` | Identyfikator dostawcy do sprawdzenia w skonfigurowanych profilach uwierzytelniania.                                                                          |
| `providerBaseUrl` | Nie      | `object` | Opcjonalna blokada, która sprawia, że sygnał liczy się tylko wtedy, gdy wskazany skonfigurowany dostawca używa dozwolonego bazowego URL. Użyj tego, gdy alias uwierzytelniania jest ważny tylko dla określonych API. |

Każda blokada `providerBaseUrl` obsługuje:

| Pole              | Wymagane | Typ        | Co oznacza                                                                                                                                       |
| ----------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Tak      | `string`   | Identyfikator konfiguracji dostawcy, którego `baseUrl` powinien zostać sprawdzony.                                                               |
| `defaultBaseUrl`  | Nie      | `string`   | Bazowy URL, który należy założyć, gdy konfiguracja dostawcy pomija `baseUrl`.                                                                    |
| `allowedBaseUrls` | Tak      | `string[]` | Dozwolone bazowe URL dla tego sygnału uwierzytelniania. Sygnał jest ignorowany, gdy skonfigurowany lub domyślny bazowy URL nie pasuje do jednej z tych znormalizowanych wartości. |

## Odniesienie do metadanych narzędzia

`toolMetadata` używa tych samych kształtów `configSignals` i `authSignals` co
metadane dostawcy generowania, indeksowanych według nazwy narzędzia. `contracts.tools` deklaruje
własność. `toolMetadata` deklaruje tani dowód dostępności, aby OpenClaw mógł
uniknąć importowania środowiska uruchomieniowego Plugin tylko po to, by jego fabryka narzędzi zwróciła `null`.

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
ładuje właścicielski Plugin, gdy kontrakt narzędzia pasuje do polityki. Dla narzędzi na ścieżce krytycznej,
których fabryka zależy od uwierzytelniania/konfiguracji, autorzy Plugin powinni deklarować
`toolMetadata` zamiast wymuszać na rdzeniu import środowiska uruchomieniowego w celu zapytania.

## Odniesienie do providerAuthChoices

Każdy wpis `providerAuthChoices` opisuje jedną opcję onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem środowiska uruchomieniowego dostawcy.
Listy konfiguracji dostawcy używają tych opcji manifestu, opcji konfiguracji
pochodzących z deskryptora oraz metadanych katalogu instalacji bez ładowania środowiska uruchomieniowego dostawcy.

| Pole                  | Wymagane | Typ                                             | Co oznacza                                                                                              |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ta opcja.                                                     |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której należy przekazać obsługę.                               |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator opcji uwierzytelniania używany przez przepływy onboardingu i CLI.                |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli pominięta, OpenClaw używa awaryjnie `choiceId`.                |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                  |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.        |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa opcję w selektorach asystenta, nadal pozwalając na ręczny wybór w CLI.                           |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory opcji, które powinny przekierowywać użytkowników do tej opcji zastępczej.        |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych opcji.                                         |
| `groupLabel`          | Nie      | `string`                                        | Etykieta widoczna dla użytkownika dla tej grupy.                                                        |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                      |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                          |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, taka jak `--openrouter-api-key`.                                                       |
| `cliOption`           | Nie      | `string`                                        | Pełny kształt opcji CLI, taki jak `--openrouter-api-key <key>`.                                         |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                              |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Powierzchnie onboardingu, na których ta opcja powinna się pojawić. Jeśli pominięte, domyślnie używa `["text-inference"]`. |

## Odniesienie do commandAliases

Użyj `commandAliases`, gdy Plugin jest właścicielem nazwy polecenia środowiska wykonawczego, którą użytkownicy mogą
błędnie umieścić w `plugins.allow` albo próbować uruchomić jako główne polecenie CLI. OpenClaw
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

| Pole         | Wymagane | Typ               | Znaczenie                                                                 |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należąca do tego Plugin.                                  |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie czatu z ukośnikiem, a nie główne polecenie CLI. |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI sugerowane do operacji CLI, jeśli istnieje. |

## informacje referencyjne activation

Użyj `activation`, gdy Plugin może niskim kosztem zadeklarować, które zdarzenia płaszczyzny sterowania
powinny uwzględnić go w planie aktywacji/ładowania.

Ten blok to metadane planera, a nie API cyklu życia. Nie rejestruje
zachowania środowiska wykonawczego, nie zastępuje `register(...)` i nie obiecuje, że
kod Plugin został już wykonany. Planer aktywacji używa tych pól do
zawężenia kandydatów typu Plugin przed przejściem awaryjnym do istniejących metadanych własności
manifestu, takich jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i punkty zaczepienia.

Preferuj najwęższe metadane, które już opisują własność. Użyj
`providers`, `channels`, `commandAliases`, deskryptorów setup lub `contracts`,
gdy te pola wyrażają relację. Użyj `activation` dla dodatkowych wskazówek
planera, których nie można przedstawić przez te pola własności.
Użyj najwyższego poziomu `cliBackends` dla aliasów środowiska wykonawczego CLI, takich jak `claude-cli`,
`codex-cli` lub `google-gemini-cli`; `activation.onAgentHarnesses` służy tylko do
osadzonych identyfikatorów środowisk agentów, które nie mają już pola własności.

Ten blok to wyłącznie metadane. Nie rejestruje zachowania środowiska wykonawczego i nie
zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia środowiska wykonawczego/Plugin.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem Plugin, więc
brak metadanych aktywacji niezwiązanych ze startem zwykle wpływa tylko na wydajność; nie
powinien zmieniać poprawności, dopóki nadal istnieją awaryjne ścieżki własności manifestu.

Każdy Plugin powinien świadomie ustawić `activation.onStartup`. Ustaw je na `true`
tylko wtedy, gdy Plugin musi działać podczas startu Gateway. Ustaw je na `false`, gdy
Plugin jest bezczynny przy starcie i powinien ładować się tylko z węższych wyzwalaczy.
Pominięcie `onStartup` nie powoduje już domyślnego ładowania Plugin przy starcie; użyj jawnych
metadanych aktywacji dla startu, kanału, konfiguracji, środowiska agenta, pamięci lub
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

| Pole               | Wymagane | Typ                                                  | Znaczenie                                                                                                                                                                                   |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nie      | `boolean`                                            | Jawna aktywacja przy starcie Gateway. Każdy Plugin powinien to ustawić. `true` importuje Plugin podczas startu; `false` utrzymuje go jako leniwie ładowany przy starcie, chyba że inny dopasowany wyzwalacz wymaga ładowania. |
| `onProviders`      | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny uwzględnić ten Plugin w planach aktywacji/ładowania.                                                                                               |
| `onAgentHarnesses` | Nie      | `string[]`                                           | Identyfikatory środowisk wykonawczych osadzonych środowisk agentów, które powinny uwzględnić ten Plugin w planach aktywacji/ładowania. Użyj najwyższego poziomu `cliBackends` dla aliasów zaplecza CLI. |
| `onCommands`       | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględnić ten Plugin w planach aktywacji/ładowania.                                                                                                  |
| `onChannels`       | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględnić ten Plugin w planach aktywacji/ładowania.                                                                                                  |
| `onRoutes`         | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględnić ten Plugin w planach aktywacji/ładowania.                                                                                                            |
| `onConfigPaths`    | Nie      | `string[]`                                           | Ścieżki konfiguracji względne wobec korzenia, które powinny uwzględnić ten Plugin w planach startu/ładowania, gdy ścieżka jest obecna i nie jest jawnie wyłączona.                         |
| `onCapabilities`   | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki dotyczące możliwości używane przez planowanie aktywacji płaszczyzny sterowania. Preferuj węższe pola, gdy to możliwe.                                                    |

Obecni aktywni konsumenci:

- Planowanie startu Gateway używa `activation.onStartup` do jawnego importu
  przy starcie
- planowanie CLI wyzwalane poleceniem korzysta awaryjnie ze starszych
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie startu środowiska wykonawczego agenta używa `activation.onAgentHarnesses` dla
  osadzonych środowisk oraz najwyższego poziomu `cliBackends[]` dla aliasów środowiska wykonawczego CLI
- planowanie setup/kanału wyzwalane kanałem korzysta awaryjnie ze starszej własności `channels[]`,
  gdy brakuje jawnych metadanych aktywacji kanału
- planowanie Plugin przy starcie używa `activation.onConfigPaths` dla niekanałowych głównych
  powierzchni konfiguracji, takich jak blok `browser` dołączonego Plugin przeglądarki
- planowanie setup/środowiska wykonawczego wyzwalane dostawcą korzysta awaryjnie ze starszej własności
  `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych aktywacji
  dostawcy

Diagnostyka planera może odróżnić jawne wskazówki aktywacji od awaryjnej własności
manifestu. Na przykład `activation-command-hint` oznacza, że dopasowano
`activation.onCommands`, a `manifest-command-alias` oznacza, że
planer użył zamiast tego własności `commandAliases`. Te etykiety powodów są przeznaczone do
diagnostyki hosta i testów; autorzy Plugin powinni nadal deklarować metadane,
które najlepiej opisują własność.

## informacje referencyjne qaRunners

Użyj `qaRunners`, gdy Plugin wnosi co najmniej jeden moduł uruchamiający transport pod
wspólnym korzeniem `openclaw qa`. Zachowaj te metadane jako tanie i statyczne; środowisko
wykonawcze Plugin nadal odpowiada za faktyczną rejestrację CLI przez lekką
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

| Pole          | Wymagane | Typ      | Znaczenie                                                        |
| ------------- | -------- | -------- | ---------------------------------------------------------------- |
| `commandName` | Tak      | `string` | Podpolecenie zamontowane pod `openclaw qa`, na przykład `matrix`. |
| `description` | Nie      | `string` | Zapasowy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia zastępczego. |

## informacje referencyjne setup

Użyj `setup`, gdy powierzchnie konfiguracji wstępnej i wdrażania potrzebują niskokosztowych metadanych
należących do Plugin przed załadowaniem środowiska wykonawczego.

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

Najwyższy poziom `cliBackends` pozostaje prawidłowy i nadal opisuje zaplecza inferencji CLI.
`setup.cliBackends` to powierzchnia deskryptorów specyficzna dla konfiguracji wstępnej dla
przepływów płaszczyzny sterowania/setup, które powinny pozostać wyłącznie metadanymi.

Gdy są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania opartą najpierw na deskryptorach dla wykrywania setup. Jeśli deskryptor tylko
zawęża kandydata typu Plugin, a setup nadal potrzebuje bogatszych punktów zaczepienia środowiska wykonawczego
w czasie konfiguracji wstępnej, ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
awaryjną ścieżkę wykonania.

OpenClaw uwzględnia też `setup.providers[].envVars` w ogólnych wyszukiwaniach uwierzytelniania
dostawców i zmiennych środowiskowych. `providerAuthEnvVars` pozostaje obsługiwane przez adapter
zgodności w okresie wycofywania, ale elementy Plugin spoza pakietu, które nadal go używają,
otrzymują diagnostykę manifestu. Nowe elementy Plugin powinny umieszczać metadane środowiskowe
setup/status w `setup.providers[].envVars`.

OpenClaw może też wyprowadzić proste wybory setup z `setup.providers[].authMethods`,
gdy nie jest dostępny żaden wpis setup albo gdy `setup.requiresRuntime: false`
deklaruje, że środowisko wykonawcze setup jest niepotrzebne. Jawne wpisy `providerAuthChoices`
pozostają preferowane dla niestandardowych etykiet, flag CLI, zakresu wdrażania i metadanych asystenta.

Ustaw `requiresRuntime: false` tylko wtedy, gdy te deskryptory są wystarczające dla
powierzchni setup. OpenClaw traktuje jawne `false` jako kontrakt wyłącznie deskryptorowy
i nie wykona `setup-api` ani `openclaw.setupEntry` dla wyszukiwania setup. Jeśli
Plugin działający wyłącznie na podstawie deskryptorów nadal dostarcza jeden z tych wpisów środowiska wykonawczego setup,
OpenClaw zgłasza dodatkową diagnostykę i nadal go ignoruje. Pominięte
`requiresRuntime` zachowuje starsze zachowanie awaryjne, aby istniejące elementy Plugin, które dodały
deskryptory bez tej flagi, nadal działały.

Ponieważ wyszukiwanie setup może wykonać kod `setup-api` należący do Plugin, znormalizowane
wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikatowe wśród
odkrytych elementów Plugin. Niejednoznaczna własność powoduje bezpieczne niepowodzenie zamiast wybierać
zwycięzcę na podstawie kolejności odkrywania.

Gdy środowisko wykonawcze setup rzeczywiście się wykonuje, diagnostyka rejestru setup zgłasza dryf
deskryptorów, jeśli `setup-api` rejestruje dostawcę lub zaplecze CLI, którego deskryptory
manifestu nie deklarują, albo jeśli deskryptor nie ma pasującej rejestracji środowiska
wykonawczego. Te diagnostyki są dodatkowe i nie odrzucają starszych elementów Plugin.

### informacje referencyjne setup.providers

| Pole           | Wymagane | Typ        | Znaczenie                                                                                         |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | Tak      | `string`   | Identyfikator dostawcy eksponowany podczas setup lub wdrażania. Utrzymuj znormalizowane identyfikatory jako globalnie unikatowe. |
| `authMethods`  | Nie      | `string[]` | Identyfikatory metod setup/uwierzytelniania obsługiwane przez tego dostawcę bez ładowania pełnego środowiska wykonawczego. |
| `envVars`      | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie setup/statusu mogą sprawdzić przed załadowaniem środowiska wykonawczego Plugin. |
| `authEvidence` | Nie      | `object[]` | Niskokosztowe lokalne kontrole dowodów uwierzytelniania dla dostawców, którzy mogą uwierzytelniać się przez niesekretne znaczniki. |

`authEvidence` służy do należących do dostawcy lokalnych znaczników poświadczeń, które można
zweryfikować bez ładowania kodu środowiska wykonawczego. Te kontrole muszą pozostać tanie i lokalne:
bez wywołań sieciowych, bez odczytów z pęku kluczy ani menedżera sekretów, bez poleceń powłoki i bez
sond API dostawcy.

Obsługiwane wpisy dowodów:

| Pole               | Wymagane | Typ        | Znaczenie                                                                                                          |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `type`             | Tak      | `string`   | Obecnie `local-file-with-env`.                                                                                     |
| `fileEnvVar`       | Nie      | `string`   | Zmienna env zawierająca jawną ścieżkę pliku poświadczeń.                                                           |
| `fallbackPaths`    | Nie      | `string[]` | Lokalne ścieżki plików poświadczeń sprawdzane, gdy `fileEnvVar` nie istnieje albo jest pusta. Obsługuje `${HOME}` i `${APPDATA}`. |
| `requiresAnyEnv`   | Nie      | `string[]` | Co najmniej jedna wymieniona zmienna env musi być niepusta, zanim dowód będzie prawidłowy.                         |
| `requiresAllEnv`   | Nie      | `string[]` | Każda wymieniona zmienna env musi być niepusta, zanim dowód będzie prawidłowy.                                     |
| `credentialMarker` | Tak      | `string`   | Niesekretny znacznik zwracany, gdy dowód jest obecny.                                                              |
| `source`           | Nie      | `string`   | Widoczna dla użytkownika etykieta źródła dla danych wyjściowych uwierzytelniania/statusu.                         |

### pola konfiguracji

| Pole               | Wymagane | Typ        | Znaczenie                                                                                                 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji dostawców ujawniane podczas konfiguracji i wdrażania.                            |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów z czasu konfiguracji używane do wyszukiwania konfiguracji w pierwszej kolejności po deskryptorze. Utrzymuj znormalizowane identyfikatory globalnie unikatowe. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego Plugin.                    |
| `requiresRuntime`  | Nie      | `boolean`  | Czy konfiguracja nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                            |

## dokumentacja `uiHints`

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

| Pole          | Typ        | Znaczenie                                  |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Widoczna dla użytkownika etykieta pola.    |
| `help`        | `string`   | Krótki tekst pomocniczy.                   |
| `tags`        | `string[]` | Opcjonalne tagi UI.                        |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.            |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe.   |
| `placeholder` | `string`   | Tekst zastępczy dla pól formularza.        |

## dokumentacja `contracts`

Używaj `contracts` tylko do statycznych metadanych własności możliwości, które OpenClaw może
odczytać bez importowania środowiska wykonawczego Plugin.

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

| Pole                             | Typ        | Znaczenie                                                            |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory fabryk rozszerzeń serwera aplikacji Codex, obecnie `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identyfikatory środowiska wykonawczego, dla których dołączony Plugin może rejestrować oprogramowanie pośredniczące wyników narzędzi. |
| `externalAuthProviders`          | `string[]` | Identyfikatory dostawców, których zewnętrzny hak profilu uwierzytelniania należy do tego Plugin. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należące do tego Plugin.               |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należące do tego Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należące do tego Plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Identyfikatory dostawców osadzania pamięci należące do tego Plugin.  |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia multimediów należące do tego Plugin. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należące do tego Plugin. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należące do tego Plugin.  |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania z sieci należące do tego Plugin. |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania w sieci należące do tego Plugin. |
| `migrationProviders`             | `string[]` | Identyfikatory dostawców importu należące do tego Plugin dla `openclaw migrate`. |
| `tools`                          | `string[]` | Nazwy narzędzi agentów należące do tego Plugin.                      |

`contracts.embeddedExtensionFactories` jest zachowywane dla dołączonych fabryk rozszerzeń
przeznaczonych wyłącznie dla serwera aplikacji Codex. Dołączone transformacje wyników narzędzi powinny
zamiast tego deklarować `contracts.agentToolResultMiddleware` i rejestrować się za pomocą
`api.registerAgentToolResultMiddleware(...)`. Zewnętrzne Plugin nie mogą rejestrować oprogramowania
pośredniczącego wyników narzędzi, ponieważ ta granica może przepisać dane wyjściowe narzędzi o wysokim
poziomie zaufania, zanim zobaczy je model.

Rejestracje `api.registerTool(...)` w środowisku wykonawczym muszą odpowiadać `contracts.tools`.
Wykrywanie narzędzi używa tej listy, aby ładować tylko środowiska wykonawcze Plugin, które mogą być
właścicielami żądanych narzędzi.

Plugin dostawców, które implementują `resolveExternalAuthProfiles`, powinny deklarować
`contracts.externalAuthProviders`. Plugin bez tej deklaracji nadal działają przez przestarzałą awaryjną
ścieżkę zgodności, ale ta ścieżka jest wolniejsza i zostanie usunięta po oknie migracji.

Dołączeni dostawcy osadzania pamięci powinni deklarować
`contracts.memoryEmbeddingProviders` dla każdego identyfikatora adaptera, który udostępniają, w tym
wbudowanych adapterów takich jak `local`. Samodzielne ścieżki CLI używają tego kontraktu manifestu,
aby załadować tylko właścicielski Plugin, zanim pełne środowisko wykonawcze Gateway zarejestruje
dostawców.

## dokumentacja `mediaUnderstandingProviderMetadata`

Używaj `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia multimediów ma
domyślne modele, priorytet awaryjnego automatycznego uwierzytelniania albo natywną obsługę dokumentów,
których ogólne pomocnicze elementy rdzenia potrzebują przed załadowaniem środowiska wykonawczego. Klucze muszą być też zadeklarowane w
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

| Pole                   | Typ                                 | Znaczenie                                                                    |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Możliwości multimedialne ujawniane przez tego dostawcę.                      |
| `defaultModels`        | `Record<string, string>`            | Domyślne mapowania możliwości na model używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby są sortowane wcześniej przy automatycznej awaryjnej ścieżce dostawcy opartej na poświadczeniach. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez dostawcę.                       |

## dokumentacja `channelConfigs`

Używaj `channelConfigs`, gdy Plugin kanału potrzebuje tanich metadanych konfiguracji przed
załadowaniem środowiska wykonawczego. Wykrywanie konfiguracji/statusu kanału tylko do odczytu może używać tych metadanych
bezpośrednio dla skonfigurowanych kanałów zewnętrznych, gdy żaden wpis konfiguracji nie jest dostępny, albo
gdy `setup.requiresRuntime: false` deklaruje, że środowisko wykonawcze konfiguracji jest niepotrzebne.

`channelConfigs` to metadane manifestu Plugin, a nie nowa sekcja konfiguracji użytkownika najwyższego poziomu.
Użytkownicy nadal konfigurują instancje kanałów pod `channels.<channel-id>`.
OpenClaw odczytuje metadane manifestu, aby zdecydować, który Plugin jest właścicielem tego skonfigurowanego
kanału, zanim wykona się kod środowiska wykonawczego Plugin.

Dla Plugin kanału `configSchema` i `channelConfigs` opisują różne ścieżki:

- `configSchema` sprawdza poprawność `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` sprawdza poprawność `channels.<channel-id>`

Niedołączone Plugin, które deklarują `channels[]`, powinny też deklarować pasujące wpisy
`channelConfigs`. Bez nich OpenClaw nadal może załadować Plugin, ale schemat konfiguracji zimnej ścieżki,
konfiguracja i powierzchnie Control UI nie mogą znać kształtu opcji należących do kanału, dopóki nie wykona się środowisko wykonawcze Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` i
`nativeSkillsAutoEnabled` mogą deklarować statyczne wartości domyślne `auto` dla kontroli konfiguracji poleceń,
które działają przed załadowaniem środowiska wykonawczego kanału. Dołączone kanały mogą też publikować
te same wartości domyślne przez `package.json#openclaw.channel.commands` obok
innych należących do pakietu metadanych katalogu kanałów.

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

| Pole          | Typ                      | Znaczenie                                                                                                           |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału.                    |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI, symbole zastępcze i wskazówki poufności dla tej sekcji konfiguracji kanału.                 |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami wyboru i inspekcji, gdy metadane runtime nie są gotowe.                    |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                                            |
| `commands`    | `object`                 | Statyczne domyślne ustawienia polecenia natywnego i natywnej Skills na potrzeby kontroli konfiguracji przed runtime. |
| `preferOver`  | `string[]`               | Starsze lub niżej priorytetowe identyfikatory pluginów, które ten kanał powinien wyprzedzać w powierzchniach wyboru. |

### Zastępowanie innego pluginu kanału

Użyj `preferOver`, gdy Twój plugin jest preferowanym właścicielem identyfikatora kanału, który
może też udostępniać inny plugin. Typowe przypadki to zmieniony identyfikator pluginu,
samodzielny plugin zastępujący plugin wbudowany albo utrzymywany fork, który
zachowuje ten sam identyfikator kanału ze względu na zgodność konfiguracji.

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

Gdy skonfigurowane jest `channels.chat`, OpenClaw bierze pod uwagę zarówno identyfikator kanału, jak i
preferowany identyfikator pluginu. Jeśli plugin o niższym priorytecie został wybrany tylko dlatego, że
jest wbudowany lub domyślnie włączony, OpenClaw wyłącza go w efektywnej
konfiguracji runtime, tak aby jeden plugin był właścicielem kanału i jego narzędzi. Jawny wybór użytkownika
nadal ma pierwszeństwo: jeśli użytkownik jawnie włączy oba pluginy, OpenClaw
zachowuje ten wybór i zgłasza diagnostykę zduplikowanych kanałów/narzędzi zamiast
po cichu zmieniać żądany zestaw pluginów.

Ogranicz `preferOver` do identyfikatorów pluginów, które rzeczywiście mogą udostępniać ten sam kanał.
To nie jest ogólne pole priorytetu i nie zmienia nazw kluczy konfiguracji użytkownika.

## Dokumentacja referencyjna modelSupport

Użyj `modelSupport`, gdy OpenClaw ma wywnioskować Twój plugin dostawcy z
skrótowych identyfikatorów modeli, takich jak `gpt-5.5` lub `claude-sonnet-4.6`, zanim załaduje się
runtime pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następującą kolejność pierwszeństwa:

- jawne odwołania `provider/model` używają metadanych manifestu należących do `providers`
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują zarówno jeden plugin niewbudowany, jak i jeden plugin wbudowany, wygrywa
  plugin niewbudowany
- pozostałe niejednoznaczności są ignorowane, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Znaczenie                                                                                       |
| --------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane za pomocą `startsWith` do skrótowych identyfikatorów modeli.              |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skrótowych identyfikatorów modeli po usunięciu sufiksu profilu.    |

## Dokumentacja referencyjna modelCatalog

Użyj `modelCatalog`, gdy OpenClaw ma znać metadane modeli dostawcy przed
załadowaniem runtime pluginu. To zarządzane przez manifest źródło stałych wierszy katalogu,
aliasów dostawców, reguł wyciszeń i trybu wykrywania. Odświeżanie runtime
nadal należy do kodu runtime dostawcy, ale manifest informuje core, kiedy runtime
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

| Pole           | Typ                                                      | Znaczenie                                                                                                             |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Wiersze katalogu dla identyfikatorów dostawców należących do tego pluginu. Klucze powinny też występować w najwyższego poziomu `providers`. |
| `aliases`      | `Record<string, object>`                                 | Aliasy dostawców, które powinny być rozwiązywane do posiadanego dostawcy na potrzeby katalogu lub planowania wyciszeń. |
| `suppressions` | `object[]`                                               | Wiersze modeli z innego źródła, które ten plugin wycisza z powodu specyficznego dla dostawcy.                         |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Określa, czy katalog dostawcy można odczytać z metadanych manifestu, odświeżyć do pamięci podręcznej, czy wymaga runtime. |

`aliases` uczestniczy w wyszukiwaniu własności dostawcy na potrzeby planowania model-catalog.
Cele aliasów muszą być dostawcami najwyższego poziomu należącymi do tego samego pluginu. Gdy
lista filtrowana według dostawcy używa aliasu, OpenClaw może odczytać manifest właściciela i
zastosować nadpisania API/base URL aliasu bez ładowania runtime dostawcy.
Aliasy nie rozwijają niefiltrowanych list katalogu; szerokie listy emitują tylko wiersze
należącego do właściciela dostawcy kanonicznego.

`suppressions` zastępuje stary hook runtime dostawcy `suppressBuiltInModel`.
Wpisy wyciszeń są respektowane tylko wtedy, gdy dostawca należy do pluginu lub
jest zadeklarowany jako klucz `modelCatalog.aliases`, którego celem jest posiadany dostawca. Hooki
wyciszeń runtime nie są już wywoływane podczas rozwiązywania modeli.

Pola dostawcy:

| Pole      | Typ                      | Znaczenie                                                               |
| --------- | ------------------------ | ----------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Opcjonalny domyślny bazowy URL dla modeli w tym katalogu dostawcy.      |
| `api`     | `ModelApi`               | Opcjonalny domyślny adapter API dla modeli w tym katalogu dostawcy.     |
| `headers` | `Record<string, string>` | Opcjonalne statyczne nagłówki stosowane do tego katalogu dostawcy.      |
| `models`  | `object[]`               | Wymagane wiersze modeli. Wiersze bez `id` są ignorowane.                |

Pola modelu:

| Pole            | Typ                                                            | Znaczenie                                                                 |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Lokalny dla dostawcy identyfikator modelu, bez prefiksu `provider/`.      |
| `name`          | `string`                                                       | Opcjonalna nazwa wyświetlana.                                             |
| `api`           | `ModelApi`                                                     | Opcjonalne nadpisanie API dla modelu.                                     |
| `baseUrl`       | `string`                                                       | Opcjonalne nadpisanie bazowego URL dla modelu.                            |
| `headers`       | `Record<string, string>`                                       | Opcjonalne statyczne nagłówki dla modelu.                                 |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalności akceptowane przez model.                                       |
| `reasoning`     | `boolean`                                                      | Określa, czy model udostępnia zachowanie rozumowania.                     |
| `contextWindow` | `number`                                                       | Natywne okno kontekstu dostawcy.                                          |
| `contextTokens` | `number`                                                       | Opcjonalny efektywny limit kontekstu runtime, gdy różni się od `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maksymalna liczba tokenów wyjściowych, jeśli jest znana.                  |
| `cost`          | `object`                                                       | Opcjonalna cena w USD za milion tokenów, w tym opcjonalne `tieredPricing`. |
| `compat`        | `object`                                                       | Opcjonalne flagi zgodności odpowiadające zgodności konfiguracji modelu OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status listowania. Wyciszaj tylko wtedy, gdy wiersz w ogóle nie może się pojawić. |
| `statusReason`  | `string`                                                       | Opcjonalny powód wyświetlany przy statusie innym niż dostępny.            |
| `replaces`      | `string[]`                                                     | Starsze lokalne dla dostawcy identyfikatory modeli, które ten model zastępuje. |
| `replacedBy`    | `string`                                                       | Lokalny dla dostawcy identyfikator modelu zastępczego dla przestarzałych wierszy. |
| `tags`          | `string[]`                                                     | Stabilne tagi używane przez selektory i filtry.                           |

Pola wyciszenia:

| Pole                       | Typ        | Znaczenie                                                                                                   |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identyfikator dostawcy dla nadrzędnego wiersza do wyciszenia. Musi należeć do tego pluginu albo być zadeklarowany jako posiadany alias. |
| `model`                    | `string`   | Lokalny dla dostawcy identyfikator modelu do wyciszenia.                                                    |
| `reason`                   | `string`   | Opcjonalny komunikat wyświetlany, gdy wyciszony wiersz zostanie zażądany bezpośrednio.                      |
| `when.baseUrlHosts`        | `string[]` | Opcjonalna lista efektywnych hostów bazowego URL dostawcy wymaganych, zanim wyciszenie zostanie zastosowane. |
| `when.providerConfigApiIn` | `string[]` | Opcjonalna lista dokładnych wartości `api` w konfiguracji dostawcy wymaganych, zanim wyciszenie zostanie zastosowane. |

Nie umieszczaj danych dostępnych tylko w czasie wykonywania w `modelCatalog`. Używaj `static` tylko wtedy, gdy wiersze manifestu są wystarczająco kompletne, aby powierzchnie list i selektorów filtrowanych według dostawcy mogły pominąć wykrywanie przez rejestr/środowisko wykonawcze. Używaj `refreshable`, gdy wiersze manifestu są użytecznymi listowalnymi punktami startowymi lub uzupełnieniami, ale odświeżenie/pamięć podręczna mogą później dodać więcej wierszy; wiersze odświeżalne same w sobie nie są autorytatywne. Używaj `runtime`, gdy OpenClaw musi załadować środowisko wykonawcze dostawcy, aby poznać listę.

## Dokumentacja referencyjna modelIdNormalization

Używaj `modelIdNormalization` do taniego, należącego do dostawcy czyszczenia identyfikatorów modeli, które musi nastąpić przed załadowaniem środowiska wykonawczego dostawcy. Dzięki temu aliasy, takie jak krótkie nazwy modeli, starsze identyfikatory lokalne dla dostawcy oraz reguły prefiksów proxy, pozostają w manifeście właścicielskiego pluginu zamiast w głównych tabelach wyboru modeli.

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

| Pole                                 | Typ                     | Znaczenie                                                                                           |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Dokładne aliasy identyfikatorów modeli bez rozróżniania wielkości liter. Wartości są zwracane tak, jak zapisano. |
| `stripPrefixes`                      | `string[]`              | Prefiksy do usunięcia przed wyszukiwaniem aliasu, przydatne przy starszej duplikacji dostawca/model. |
| `prefixWhenBare`                     | `string`                | Prefiks do dodania, gdy znormalizowany identyfikator modelu nie zawiera jeszcze `/`.                 |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Warunkowe reguły prefiksów dla identyfikatorów bez prefiksu po wyszukaniu aliasu, indeksowane przez `modelPrefix` i `prefix`. |

## Dokumentacja referencyjna providerEndpoints

Używaj `providerEndpoints` do klasyfikacji punktów końcowych, którą ogólna polityka żądań musi znać przed załadowaniem środowiska wykonawczego dostawcy. Rdzeń nadal odpowiada za znaczenie każdej wartości `endpointClass`; manifesty pluginów odpowiadają za metadane hosta i bazowego adresu URL.

Pola punktu końcowego:

| Pole                           | Typ        | Znaczenie                                                                                          |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Znana klasie punktu końcowego rdzenia, taka jak `openrouter`, `moonshot-native` lub `google-vertex`. |
| `hosts`                        | `string[]` | Dokładne nazwy hostów mapowane na klasę punktu końcowego.                                          |
| `hostSuffixes`                 | `string[]` | Sufiksy hostów mapowane na klasę punktu końcowego. Poprzedź `.` w celu dopasowania tylko sufiksu domeny. |
| `baseUrls`                     | `string[]` | Dokładne znormalizowane bazowe adresy URL HTTP(S) mapowane na klasę punktu końcowego.              |
| `googleVertexRegion`           | `string`   | Statyczny region Google Vertex dla dokładnych hostów globalnych.                                   |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks do usunięcia z dopasowanych hostów, aby ujawnić prefiks regionu Google Vertex.              |

## Dokumentacja referencyjna providerRequest

Używaj `providerRequest` do tanich metadanych zgodności żądań, których ogólna polityka żądań potrzebuje bez ładowania środowiska wykonawczego dostawcy. Przepisywanie ładunku specyficzne dla zachowania trzymaj w hakach środowiska wykonawczego dostawcy lub współdzielonych helperach rodziny dostawców.

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

| Pole                  | Typ          | Znaczenie                                                                          |
| --------------------- | ------------ | ---------------------------------------------------------------------------------- |
| `family`              | `string`     | Etykieta rodziny dostawcy używana przez ogólne decyzje zgodności żądań i diagnostykę. |
| `compatibilityFamily` | `"moonshot"` | Opcjonalny koszyk zgodności rodziny dostawców dla współdzielonych helperów żądań.  |
| `openAICompletions`   | `object`     | Flagi żądań uzupełnień zgodnych z OpenAI, obecnie `supportsStreamingUsage`.        |

## Dokumentacja referencyjna modelPricing

Używaj `modelPricing`, gdy dostawca potrzebuje zachowania cenowego płaszczyzny sterowania przed załadowaniem środowiska wykonawczego. Pamięć podręczna cen Gateway odczytuje te metadane bez importowania kodu środowiska wykonawczego dostawcy.

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

| Pole         | Typ               | Znaczenie                                                                                          |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Ustaw `false` dla lokalnych/samodzielnie hostowanych dostawców, którzy nigdy nie powinni pobierać cen OpenRouter ani LiteLLM. |
| `openRouter` | `false \| object` | Mapowanie wyszukiwania cen OpenRouter. `false` wyłącza wyszukiwanie OpenRouter dla tego dostawcy.  |
| `liteLLM`    | `false \| object` | Mapowanie wyszukiwania cen LiteLLM. `false` wyłącza wyszukiwanie LiteLLM dla tego dostawcy.        |

Pola źródła:

| Pole                       | Typ                | Znaczenie                                                                                                        |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identyfikator dostawcy w zewnętrznym katalogu, gdy różni się od identyfikatora dostawcy OpenClaw, na przykład `z-ai` dla dostawcy `zai`. |
| `passthroughProviderModel` | `boolean`          | Traktuj identyfikatory modeli zawierające ukośnik jako zagnieżdżone odwołania dostawca/model, przydatne dla dostawców proxy, takich jak OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Dodatkowe warianty identyfikatorów modeli w zewnętrznym katalogu. `version-dots` próbuje identyfikatorów wersji z kropkami, takich jak `claude-opus-4.6`. |

### Indeks dostawców OpenClaw

Indeks dostawców OpenClaw to należące do OpenClaw metadane podglądu dla dostawców, których pluginy mogą nie być jeszcze zainstalowane. Nie jest częścią manifestu pluginu. Manifesty pluginów pozostają autorytetem zainstalowanych pluginów. Indeks dostawców jest wewnętrznym kontraktem awaryjnym, z którego będą korzystać przyszłe powierzchnie instalowalnych dostawców i selektorów modeli przed instalacją, gdy plugin dostawcy nie jest zainstalowany.

Kolejność autorytetu katalogu:

1. Konfiguracja użytkownika.
2. `modelCatalog` manifestu zainstalowanego pluginu.
3. Pamięć podręczna katalogu modeli z jawnego odświeżenia.
4. Wiersze podglądu Indeksu dostawców OpenClaw.

Indeks dostawców nie może zawierać sekretów, stanu włączenia, haków środowiska wykonawczego ani danych modeli specyficznych dla aktywnego konta. Jego katalogi podglądu używają tego samego kształtu wiersza dostawcy `modelCatalog` co manifesty pluginów, ale powinny pozostać ograniczone do stabilnych metadanych wyświetlania, chyba że pola adaptera środowiska wykonawczego, takie jak `api`, `baseUrl`, ceny lub flagi zgodności, są celowo utrzymywane w zgodzie z manifestem zainstalowanego pluginu. Dostawcy z wykrywaniem aktywnych `/models` powinni zapisywać odświeżone wiersze przez jawną ścieżkę pamięci podręcznej katalogu modeli zamiast wykonywać zwykłe listowanie lub wywoływać API dostawcy podczas onboardingu.

Wpisy Indeksu dostawców mogą również zawierać metadane instalowalnego pluginu dla dostawców, których plugin został przeniesiony poza rdzeń lub nie jest jeszcze zainstalowany. Te metadane odzwierciedlają wzorzec katalogu kanałów: nazwa pakietu, specyfikacja instalacji npm, oczekiwana integralność oraz tanie etykiety wyboru uwierzytelniania wystarczają, aby pokazać instalowalną opcję konfiguracji. Po zainstalowaniu pluginu jego manifest wygrywa, a wpis Indeksu dostawców jest ignorowany dla tego dostawcy.

Starsze klucze możliwości najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby przenieść `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` i `webSearchProviders` pod `contracts`; zwykłe ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako własności możliwości.

## Manifest a package.json

Te dwa pliki mają różne zadania:

| Plik                   | Do czego go używać                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Wykrywanie, walidacja konfiguracji, metadane wyboru uwierzytelniania oraz wskazówki UI, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadane npm, instalacja zależności oraz blok `openclaw` używany dla punktów wejścia, bramkowania instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie należy umieścić dany fragment metadanych, użyj tej reguły:

- jeśli OpenClaw musi to znać przed załadowaniem kodu pluginu, umieść to w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść to w `package.json`

### Pola package.json wpływające na wykrywanie

Część metadanych pluginu sprzed uruchomienia środowiska wykonawczego celowo znajduje się w `package.json` pod blokiem `openclaw` zamiast w `openclaw.plugin.json`.
`openclaw.bundle` i `openclaw.bundle.json` nie są kontraktami pluginów OpenClaw; natywne pluginy muszą używać `openclaw.plugin.json` oraz obsługiwanych pól `package.json#openclaw` poniżej.

Ważne przykłady:

| Pole                                                                                       | Co oznacza                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Deklaruje natywne punkty wejścia pluginu. Musi pozostać w katalogu pakietu pluginu.                                                                                                  |
| `openclaw.runtimeExtensions`                                                               | Deklaruje zbudowane punkty wejścia środowiska uruchomieniowego JavaScript dla zainstalowanych pakietów. Musi pozostać w katalogu pakietu pluginu.                                    |
| `openclaw.setupEntry`                                                                      | Lekki punkt wejścia wyłącznie do konfiguracji, używany podczas wdrażania, odroczonego uruchamiania kanału oraz wykrywania statusu kanału tylko do odczytu/SecretRef. Musi pozostać w katalogu pakietu pluginu. |
| `openclaw.runtimeSetupEntry`                                                               | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Wymaga `setupEntry`, musi istnieć i musi pozostać w katalogu pakietu pluginu.                |
| `openclaw.channel`                                                                         | Tanie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                                                                    |
| `openclaw.channel.commands`                                                                | Statyczne metadane natywnych poleceń i automatycznych domyślnych natywnych umiejętności używane przez konfigurację, audyt i powierzchnie listy poleceń przed załadowaniem środowiska uruchomieniowego kanału. |
| `openclaw.channel.configuredState`                                                         | Lekkie metadane sprawdzania stanu konfiguracji, które mogą odpowiedzieć „czy konfiguracja oparta tylko na env już istnieje?” bez ładowania pełnego środowiska uruchomieniowego kanału. |
| `openclaw.channel.persistedAuthState`                                                      | Lekkie metadane sprawdzania utrwalonego uwierzytelnienia, które mogą odpowiedzieć „czy cokolwiek jest już zalogowane?” bez ładowania pełnego środowiska uruchomieniowego kanału.     |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Wskazówki instalacji/aktualizacji dla dołączonych i publikowanych zewnętrznie pluginów.                                                                                              |
| `openclaw.install.defaultChoice`                                                           | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                         |
| `openclaw.install.minHostVersion`                                                          | Minimalna obsługiwana wersja hosta OpenClaw, z użyciem dolnej granicy semver, takiej jak `>=2026.3.22` lub `>=2026.5.1-beta.1`.                                                      |
| `openclaw.install.expectedIntegrity`                                                       | Oczekiwany ciąg integralności dist npm, taki jak `sha512-...`; przepływy instalacji i aktualizacji weryfikują względem niego pobrany artefakt.                                       |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Zezwala na wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego pluginu, gdy konfiguracja jest nieprawidłowa.                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Pozwala ładować powierzchnie kanałów wyłącznie do konfiguracji przed pełnym pluginem kanału podczas uruchamiania.                                                                    |

Metadane manifestu decydują, które wybory dostawcy/kanału/konfiguracji pojawiają się we wdrażaniu przed załadowaniem środowiska uruchomieniowego. `package.json#openclaw.install` informuje wdrażanie, jak pobrać lub włączyć ten plugin, gdy użytkownik wybierze jedną z tych opcji. Nie przenoś wskazówek instalacji do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru manifestów dla niedołączonych źródeł pluginów. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości powodują pomijanie zewnętrznych pluginów na starszych hostach. Zakłada się, że dołączone źródłowe pluginy są współwersjonowane z checkoutem hosta.

Oficjalne metadane instalacji na żądanie powinny używać `clawhubSpec`, gdy plugin jest opublikowany w ClawHub; wdrażanie traktuje to jako preferowane zdalne źródło i zapisuje fakty artefaktu ClawHub po instalacji. `npmSpec` pozostaje fallbackiem zgodności dla pakietów, które jeszcze nie przeniosły się do ClawHub.

Dokładne przypięcie wersji npm znajduje się już w `npmSpec`, na przykład `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne wpisy katalogu zewnętrznego powinny łączyć dokładne specyfikacje z `expectedIntegrity`, aby przepływy aktualizacji kończyły się bezpiecznym niepowodzeniem, jeśli pobrany artefakt npm nie odpowiada już przypiętemu wydaniu. Interaktywne wdrażanie nadal oferuje zaufane specyfikacje npm z rejestru, w tym same nazwy pakietów i dist-tagi, dla zgodności. Diagnostyka katalogu może rozróżniać źródła dokładne, pływające, przypięte integralnością, bez integralności, z niezgodnością nazwy pakietu i z nieprawidłowym wyborem domyślnym. Ostrzega także, gdy `expectedIntegrity` jest obecne, ale nie ma prawidłowego źródła npm, które mogłoby przypiąć. Gdy `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji egzekwują je; gdy go brakuje, rozstrzygnięcie rejestru jest zapisywane bez przypięcia integralności.

Pluginy kanałów powinny udostępniać `openclaw.setupEntry`, gdy skany statusu, listy kanałów lub SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego środowiska uruchomieniowego. Punkt wejścia konfiguracji powinien udostępniać metadane kanału oraz bezpieczne dla konfiguracji adaptery konfiguracji, statusu i sekretów; klientów sieciowych, nasłuchiwaczy Gateway i środowiska uruchomieniowe transportu trzymaj w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia środowiska uruchomieniowego nie nadpisują kontroli granic pakietu dla pól źródłowych punktów wejścia. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że wychodząca poza granice ścieżka `openclaw.extensions` będzie możliwa do załadowania.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie sprawia, że dowolnie uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala tylko przepływom instalacji odzyskać się po konkretnych przestarzałych błędach aktualizacji dołączonego pluginu, takich jak brakująca ścieżka dołączonego pluginu lub przestarzały wpis `channels.<id>` dla tego samego dołączonego pluginu. Niepowiązane błędy konfiguracji nadal blokują instalację i kierują operatorów do `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` to metadane pakietu dla niewielkiego modułu sprawdzającego:

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

Używaj tego, gdy konfiguracja, doctor, status lub przepływy obecności tylko do odczytu wymagają taniej sondy uwierzytelnienia tak/nie przed załadowaniem pełnego pluginu kanału. Utrwalony stan uwierzytelnienia nie jest skonfigurowanym stanem kanału: nie używaj tych metadanych do automatycznego włączania pluginów, naprawiania zależności środowiska uruchomieniowego ani decydowania, czy środowisko uruchomieniowe kanału powinno zostać załadowane. Docelowy eksport powinien być małą funkcją, która odczytuje tylko utrwalony stan; nie kieruj go przez pełny barrel środowiska uruchomieniowego kanału.

`openclaw.channel.configuredState` ma taki sam kształt dla tanich sprawdzeń konfiguracji opartych tylko na env:

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

Używaj tego, gdy kanał może odpowiedzieć o stanie konfiguracji na podstawie env lub innych drobnych wejść bez środowiska uruchomieniowego. Jeśli sprawdzenie wymaga pełnego rozstrzygania konfiguracji lub rzeczywistego środowiska uruchomieniowego kanału, zachowaj tę logikę w hooku pluginu `config.hasConfiguredState`.

## Pierwszeństwo wykrywania (zduplikowane identyfikatory pluginów)

OpenClaw wykrywa pluginy z kilku korzeni (dołączone, instalacja globalna, workspace, jawne ścieżki wybrane w konfiguracji). Jeśli dwa wykrycia mają ten sam `id`, zachowywany jest tylko manifest o **najwyższym pierwszeństwie**; duplikaty o niższym pierwszeństwie są odrzucane zamiast ładowania obok niego.

Pierwszeństwo, od najwyższego do najniższego:

1. **Wybrane w konfiguracji** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Dołączone** — pluginy dostarczane z OpenClaw
3. **Instalacja globalna** — pluginy zainstalowane w globalnym katalogu głównym pluginów OpenClaw
4. **Workspace** — pluginy wykryte względem bieżącego workspace

Skutki:

- Fork lub przestarzała kopia dołączonego pluginu znajdująca się w workspace nie przesłoni dołączonej kompilacji.
- Aby faktycznie zastąpić dołączony plugin lokalnym, przypnij go przez `plugins.entries.<id>`, tak aby wygrał pierwszeństwem, zamiast polegać na wykrywaniu workspace.
- Odrzucenia duplikatów są logowane, aby diagnostyka Doctor i uruchamiania mogła wskazać odrzuconą kopię.
- Nadpisania duplikatów wybranych w konfiguracji są formułowane w diagnostyce jako jawne nadpisania, ale nadal ostrzegają, aby przestarzałe forki i przypadkowe przesłonięcia pozostawały widoczne.

## Wymagania schematu JSON

- **Każdy plugin musi dostarczać schemat JSON**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest dopuszczalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w czasie działania.
- Podczas rozszerzania lub forkowania dołączonego pluginu o nowe klucze konfiguracji zaktualizuj jednocześnie `configSchema` tego pluginu w `openclaw.plugin.json`. Schematy dołączonych pluginów są ścisłe, więc dodanie `plugins.entries.<id>.config.myNewKey` w konfiguracji użytkownika bez dodania `myNewKey` do `configSchema.properties` zostanie odrzucone przed załadowaniem środowiska uruchomieniowego pluginu.

Przykładowe rozszerzenie schematu:

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

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym dla ładowania z lokalnego systemu plików. Runtime nadal ładuje moduł pluginu osobno; manifest służy wyłącznie do wykrywania i walidacji.
- Manifesty natywne są parsowane za pomocą JSON5, więc komentarze, końcowe przecinki i klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestu odczytuje tylko udokumentowane pola manifestu. Unikaj niestandardowych kluczy najwyższego poziomu.
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy plugin ich nie potrzebuje.
- `providerDiscoveryEntry` musi pozostać lekkie i nie powinno importować szerokiego kodu runtime; używaj go do statycznych metadanych katalogu providerów lub wąskich deskryptorów wykrywania, a nie do wykonywania w czasie obsługi żądania.
- Wyłączne rodzaje pluginów są wybierane przez `plugins.slots.*`: `kind: "memory"` przez `plugins.slots.memory`, `kind: "context-engine"` przez `plugins.slots.contextEngine` (domyślnie `legacy`).
- Zadeklaruj wyłączny rodzaj pluginu w tym manifeście. `OpenClawPluginDefinition.kind` w wejściu runtime jest przestarzałe i pozostaje wyłącznie jako zapasowa zgodność dla starszych pluginów.
- Metadane zmiennych środowiskowych (`setup.providers[].envVars`, przestarzałe `providerAuthEnvVars` i `channelEnvVars`) są wyłącznie deklaratywne. Status, audyt, walidacja dostarczania cron i inne powierzchnie tylko do odczytu nadal stosują zaufanie do pluginu oraz efektywną politykę aktywacji, zanim potraktują zmienną środowiskową jako skonfigurowaną.
- Metadane kreatora runtime wymagające kodu providera opisano w sekcji [hooki runtime providera](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli plugin zależy od modułów natywnych, udokumentuj kroki budowania oraz wszelkie wymagania dotyczące listy dozwolonych elementów menedżera pakietów (na przykład pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Powiązane

<CardGroup cols={3}>
  <Card title="Tworzenie pluginów" href="/pl/plugins/building-plugins" icon="rocket">
    Pierwsze kroki z pluginami.
  </Card>
  <Card title="Architektura Plugin" href="/pl/plugins/architecture" icon="diagram-project">
    Wewnętrzna architektura i model możliwości.
  </Card>
  <Card title="Przegląd SDK" href="/pl/plugins/sdk-overview" icon="book">
    Referencja Plugin SDK i importy podścieżek.
  </Card>
</CardGroup>
