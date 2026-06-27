---
read_when:
    - Tworzysz plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji pluginu lub debugować błędy walidacji pluginu
summary: Wymagania manifestu Plugin + schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Pluginu
x-i18n:
    generated_at: "2026-06-27T17:54:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

Ta strona dotyczy wyłącznie **natywnego manifestu Plugin OpenClaw**.

Zgodne układy pakietów opisuje strona [Pakiety Plugin](/pl/plugins/bundles).

Zgodne formaty pakietów używają innych plików manifestu:

- Pakiet Codex: `.codex-plugin/plugin.json`
- Pakiet Claude: `.claude-plugin/plugin.json` albo domyślny układ komponentów
  Claude bez manifestu
- Pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa również te układy pakietów, ale nie są one
walidowane względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych pakietów OpenClaw obecnie odczytuje metadane pakietu oraz zadeklarowane
katalogi główne skill, katalogi główne poleceń Claude, wartości domyślne `settings.json`
pakietu Claude, wartości domyślne LSP pakietu Claude oraz obsługiwane pakiety hooków, gdy układ jest zgodny
z oczekiwaniami runtime OpenClaw.

Każdy natywny Plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym Plugin**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Plugin**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Plugin i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Plugin: [Pluginy](/pl/tools/plugin).
Natywny model możliwości i aktualne wskazówki dotyczące zgodności zewnętrznej:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje **zanim załaduje kod
Plugin**. Wszystko poniżej musi być wystarczająco tanie do sprawdzenia bez uruchamiania
runtime Plugin.

**Używaj go do:**

- tożsamości Plugin, walidacji konfiguracji i wskazówek interfejsu konfiguracji
- metadanych uwierzytelniania, onboardingu i konfiguracji początkowej (alias, automatyczne włączanie, zmienne środowiskowe dostawcy, wybory uwierzytelniania)
- wskazówek aktywacji dla powierzchni płaszczyzny sterowania
- skróconej własności rodzin modeli
- statycznych migawek własności możliwości (`contracts`)
- metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzić
- metadanych konfiguracji specyficznych dla kanału, scalanych z katalogiem i powierzchniami walidacji

**Nie używaj go do:** rejestrowania zachowania runtime, deklarowania punktów wejścia kodu
ani metadanych instalacji npm. Te elementy należą do kodu Plugin i pliku `package.json`.

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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

| Pole                                 | Wymagane | Typ                              | Znaczenie                                                                                                                                                                                                                                    |
| ------------------------------------ | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Tak      | `string`                         | Kanoniczny identyfikator Plugin. To identyfikator używany w `plugins.entries.<id>`.                                                                                                                                                         |
| `configSchema`                       | Tak      | `object`                         | Wbudowany JSON Schema konfiguracji tego Plugin.                                                                                                                                                                                             |
| `requiresPlugins`                    | Nie      | `string[]`                       | Identyfikatory Plugin, które również muszą być zainstalowane, aby ten Plugin działał. Wykrywanie pozostawia Plugin możliwym do załadowania, ale ostrzega, gdy brakuje dowolnego wymaganego Plugin.                                          |
| `enabledByDefault`                   | Nie      | `true`                           | Oznacza dołączony Plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić Plugin domyślnie wyłączony.                                                                                       |
| `enabledByDefaultOnPlatforms`        | Nie      | `string[]`                       | Oznacza dołączony Plugin jako domyślnie włączony tylko na wymienionych platformach Node.js, na przykład `["darwin"]`. Jawna konfiguracja nadal ma pierwszeństwo.                                                                             |
| `legacyPluginIds`                    | Nie      | `string[]`                       | Starsze identyfikatory, które normalizują się do tego kanonicznego identyfikatora Plugin.                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten Plugin, gdy uwierzytelnianie, konfiguracja lub referencje modeli o nich wspominają.                                                                                       |
| `kind`                               | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj Plugin używany przez `plugins.slots.*`.                                                                                                                                                                           |
| `channels`                           | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego Plugin. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                            |
| `providers`                          | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego Plugin.                                                                                                                                                                                         |
| `providerCatalogEntry`               | Nie      | `string`                         | Lekka ścieżka modułu katalogu dostawców, względna wobec katalogu głównego Plugin, dla metadanych katalogu dostawców ograniczonych do manifestu, które można załadować bez aktywowania pełnego środowiska wykonawczego Plugin.               |
| `modelSupport`                       | Nie      | `object`                         | Należące do manifestu skrócone metadane rodzin modeli używane do automatycznego załadowania Plugin przed środowiskiem wykonawczym.                                                                                                          |
| `modelCatalog`                       | Nie      | `object`                         | Deklaratywne metadane katalogu modeli dla dostawców należących do tego Plugin. To kontrakt płaszczyzny sterowania dla przyszłego listowania tylko do odczytu, onboardingu, selektorów modeli, aliasów i wygaszania bez ładowania środowiska wykonawczego Plugin. |
| `modelPricing`                       | Nie      | `object`                         | Należąca do dostawcy polityka wyszukiwania cen zewnętrznych. Użyj jej, aby wyłączyć dostawców lokalnych/samodzielnie hostowanych z katalogów cen zdalnych albo mapować referencje dostawców na identyfikatory katalogów OpenRouter/LiteLLM bez wpisywania identyfikatorów dostawców na sztywno w rdzeniu. |
| `modelIdNormalization`               | Nie      | `object`                         | Należące do dostawcy porządkowanie aliasów/prefiksów identyfikatorów modeli, które musi uruchomić się przed załadowaniem środowiska wykonawczego dostawcy.                                                                                  |
| `providerEndpoints`                  | Nie      | `object[]`                       | Należące do manifestu metadane hostów punktów końcowych/baseUrl dla tras dostawców, które rdzeń musi sklasyfikować przed załadowaniem środowiska wykonawczego dostawcy.                                                                      |
| `providerRequest`                    | Nie      | `object`                         | Tanie metadane rodziny dostawcy i zgodności żądań używane przez ogólną politykę żądań przed załadowaniem środowiska wykonawczego dostawcy.                                                                                                  |
| `secretProviderIntegrations`         | Nie      | `Record<string, object>`         | Deklaratywne gotowe ustawienia dostawcy exec SecretRef, które powierzchnie konfiguracji lub instalacji mogą oferować bez wpisywania integracji specyficznych dla dostawcy na sztywno w rdzeniu.                                            |
| `cliBackends`                        | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego Plugin. Używane do automatycznej aktywacji podczas uruchamiania na podstawie jawnych referencji konfiguracji.                                                                    |
| `syntheticAuthRefs`                  | Nie      | `string[]`                       | Referencje dostawcy lub backendu CLI, których należący do Plugin syntetyczny hak uwierzytelniania powinien zostać sprawdzony podczas zimnego wykrywania modeli przed załadowaniem środowiska wykonawczego.                                  |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                       | Należące do dołączonego Plugin zastępcze wartości klucza API, które reprezentują nietajne lokalne dane uwierzytelniające, stan OAuth lub środowiskowy stan poświadczeń.                                                                     |
| `commandAliases`                     | Nie      | `object[]`                       | Nazwy poleceń należące do tego Plugin, które powinny generować świadome Plugin diagnostyki konfiguracji i CLI przed załadowaniem środowiska wykonawczego.                                                                                   |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`       | Przestarzałe metadane zgodności zmiennych środowiskowych do wyszukiwania uwierzytelniania/statusu dostawcy. W przypadku nowych Plugin preferuj `setup.providers[].envVars`; OpenClaw nadal odczytuje to w okresie wycofywania.              |
| `providerAuthAliases`                | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący klucz API i profile uwierzytelniania dostawcy bazowego.               |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`       | Tanie metadane zmiennych środowiskowych kanału, które OpenClaw może sprawdzać bez ładowania kodu Plugin. Użyj tego dla konfiguracji kanału sterowanej zmiennymi środowiskowymi lub powierzchni uwierzytelniania widocznych dla ogólnych helperów uruchamiania/konfiguracji. |
| `providerAuthChoices`                | Nie      | `object[]`                       | Tanie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego podłączania flag CLI.                                                                                                    |
| `activation`                         | Nie      | `object`                         | Tanie metadane planisty aktywacji dla ładowania wyzwalanego uruchomieniem, dostawcą, poleceniem, kanałem, trasą i zdolnością. Tylko metadane; środowisko wykonawcze Plugin nadal jest właścicielem rzeczywistego zachowania.                |
| `setup`                              | Nie      | `object`                         | Tanie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania środowiska wykonawczego Plugin.                                                                                       |
| `qaRunners`                          | Nie      | `object[]`                       | Tanie deskryptory uruchamiających QA używane przez współdzielonego hosta `openclaw qa` przed załadowaniem środowiska wykonawczego Plugin.                                                                                                    |
| `contracts`                          | Nie      | `object`                         | Statyczna migawka własności zdolności dla zewnętrznych haków uwierzytelniania, osadzeń, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów, generowania obrazów, generowania muzyki, generowania wideo, pobierania z sieci, wyszukiwania w sieci i własności narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`         | Tanie wartości domyślne rozumienia mediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                                          |
| `imageGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania obrazów dla identyfikatorów dostawców zadeklarowanych w `contracts.imageGenerationProviders`, w tym należące do dostawcy aliasy uwierzytelniania i strażniki bazowego adresu URL.              |
| `videoGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania wideo dla identyfikatorów dostawców zadeklarowanych w `contracts.videoGenerationProviders`, w tym należące do dostawcy aliasy uwierzytelniania i strażniki bazowego adresu URL.                |
| `musicGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania muzyki dla identyfikatorów dostawców zadeklarowanych w `contracts.musicGenerationProviders`, w tym należące do dostawcy aliasy uwierzytelniania i strażniki bazowego adresu URL.               |
| `toolMetadata`                       | Nie      | `Record<string, object>`         | Tanie metadane dostępności dla narzędzi należących do Plugin zadeklarowanych w `contracts.tools`. Użyj ich, gdy narzędzie nie powinno ładować środowiska runtime, chyba że istnieją dowody konfiguracji, środowiska lub uwierzytelniania.                                                                       |
| `channelConfigs`                     | Nie      | `Record<string, object>`         | Metadane konfiguracji kanału należące do manifestu, scalane z powierzchniami wykrywania i walidacji przed załadowaniem środowiska runtime.                                                                                                                                      |
| `skills`                             | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne wobec katalogu głównego Plugin.                                                                                                                                                                                         |
| `name`                               | Nie      | `string`                         | Czytelna dla człowieka nazwa Plugin.                                                                                                                                                                                                                     |
| `description`                        | Nie      | `string`                         | Krótkie podsumowanie wyświetlane w powierzchniach Plugin.                                                                                                                                                                                                         |
| `icon`                               | Nie      | `string`                         | URL obrazu HTTPS dla kart marketplace/katalogu. ClawHub akceptuje dowolny prawidłowy URL `https://` i wraca do domyślnej ikony Plugin, gdy zostanie on pominięty lub jest nieprawidłowy.                                                                              |
| `version`                            | Nie      | `string`                         | Informacyjna wersja Plugin.                                                                                                                                                                                                                   |
| `uiHints`                            | Nie      | `Record<string, object>`         | Etykiety interfejsu użytkownika, symbole zastępcze i wskazówki dotyczące wrażliwości pól konfiguracji.                                                                                                                                                                               |

## Dokumentacja referencyjna metadanych dostawcy generowania

Pola metadanych dostawcy generowania opisują statyczne sygnały uwierzytelniania dla
dostawców zadeklarowanych na pasującej liście `contracts.*GenerationProviders`.
OpenClaw odczytuje te pola przed załadowaniem runtime dostawcy, aby narzędzia rdzenia mogły
zdecydować, czy dostawca generowania jest dostępny, bez importowania każdego
Pluginu dostawcy.

Używaj tych pól tylko do tanich, deklaratywnych faktów. Transport, przekształcenia
żądań, odświeżanie tokenów, walidacja poświadczeń i rzeczywiste zachowanie generowania
pozostają w runtime Pluginu.

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

| Pole                   | Wymagane | Typ        | Co oznacza                                                                                                                                          |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Nie      | `string[]` | Dodatkowe identyfikatory dostawcy, które powinny liczyć się jako statyczne aliasy uwierzytelniania dla dostawcy generowania.                       |
| `authProviders`        | Nie      | `string[]` | Identyfikatory dostawców, których skonfigurowane profile uwierzytelniania powinny liczyć się jako uwierzytelnianie dla tego dostawcy generowania.  |
| `configSignals`        | Nie      | `object[]` | Tanie sygnały dostępności wyłącznie z konfiguracji dla dostawców lokalnych lub self-hosted, których można skonfigurować bez profili uwierzytelniania ani zmiennych środowiskowych. |
| `authSignals`          | Nie      | `object[]` | Jawne sygnały uwierzytelniania. Jeśli są obecne, zastępują domyślny zestaw sygnałów z identyfikatora dostawcy, `aliases` i `authProviders`.        |
| `referenceAudioInputs` | Nie      | `boolean`  | Tylko generowanie wideo. Ustaw na `true`, gdy dostawca akceptuje referencyjne zasoby audio; w przeciwnym razie `video_generate` ukrywa parametry referencji audio. |

Każdy wpis `configSignals` obsługuje:

| Pole             | Wymagane | Typ        | Co oznacza                                                                                                                                                                             |
| ---------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Tak      | `string`   | Ścieżka kropkowa do obiektu konfiguracji należącego do Pluginu, który ma zostać sprawdzony, na przykład `plugins.entries.example.config`.                                             |
| `overlayPath`    | Nie      | `string`   | Ścieżka kropkowa wewnątrz konfiguracji głównej, której obiekt powinien zostać nałożony na obiekt główny przed oceną sygnału. Używaj tego dla konfiguracji właściwej dla możliwości, takiej jak `image`, `video` lub `music`. |
| `overlayMapPath` | Nie      | `string`   | Ścieżka kropkowa wewnątrz konfiguracji głównej, której wartości obiektów powinny zostać kolejno nałożone na obiekt główny. Używaj tego dla map nazwanych kont, takich jak `accounts`, gdzie kwalifikować powinno się dowolne skonfigurowane konto. |
| `required`       | Nie      | `string[]` | Ścieżki kropkowe wewnątrz efektywnej konfiguracji, które muszą mieć skonfigurowane wartości. Łańcuchy muszą być niepuste; obiekty i tablice nie mogą być puste.                       |
| `requiredAny`    | Nie      | `string[]` | Ścieżki kropkowe wewnątrz efektywnej konfiguracji, z których co najmniej jedna musi mieć skonfigurowaną wartość.                                                                       |
| `mode`           | Nie      | `object`   | Opcjonalna blokada trybu tekstowego wewnątrz efektywnej konfiguracji. Używaj jej, gdy dostępność wyłącznie z konfiguracji dotyczy tylko jednego trybu.                                |

Każda blokada `mode` obsługuje:

| Pole         | Wymagane | Typ        | Co oznacza                                                                                   |
| ------------ | -------- | ---------- | -------------------------------------------------------------------------------------------- |
| `path`       | Nie      | `string`   | Ścieżka kropkowa wewnątrz efektywnej konfiguracji. Domyślnie `mode`.                         |
| `default`    | Nie      | `string`   | Wartość trybu używana, gdy konfiguracja pomija ścieżkę.                                      |
| `allowed`    | Nie      | `string[]` | Jeśli obecne, sygnał przechodzi tylko wtedy, gdy efektywny tryb jest jedną z tych wartości.  |
| `disallowed` | Nie      | `string[]` | Jeśli obecne, sygnał kończy się niepowodzeniem, gdy efektywny tryb jest jedną z tych wartości. |

Każdy wpis `authSignals` obsługuje:

| Pole              | Wymagane | Typ      | Co oznacza                                                                                                                                                                  |
| ----------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Tak      | `string` | Identyfikator dostawcy do sprawdzenia w skonfigurowanych profilach uwierzytelniania.                                                                                       |
| `providerBaseUrl` | Nie      | `object` | Opcjonalna blokada, która sprawia, że sygnał liczy się tylko wtedy, gdy wskazany skonfigurowany dostawca używa dozwolonego bazowego adresu URL. Używaj tego, gdy alias uwierzytelniania jest prawidłowy tylko dla określonych API. |

Każda blokada `providerBaseUrl` obsługuje:

| Pole              | Wymagane | Typ        | Co oznacza                                                                                                                                          |
| ----------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Tak      | `string`   | Identyfikator konfiguracji dostawcy, którego `baseUrl` powinien zostać sprawdzony.                                                                  |
| `defaultBaseUrl`  | Nie      | `string`   | Bazowy adres URL przyjmowany, gdy konfiguracja dostawcy pomija `baseUrl`.                                                                           |
| `allowedBaseUrls` | Tak      | `string[]` | Dozwolone bazowe adresy URL dla tego sygnału uwierzytelniania. Sygnał jest ignorowany, gdy skonfigurowany lub domyślny bazowy adres URL nie pasuje do jednej z tych znormalizowanych wartości. |

## Dokumentacja referencyjna metadanych narzędzi

`toolMetadata` używa tych samych kształtów `configSignals` i `authSignals` co
metadane dostawcy generowania, indeksowanych nazwą narzędzia. `contracts.tools` deklaruje
własność. `toolMetadata` deklaruje tani dowód dostępności, aby OpenClaw mógł
uniknąć importowania runtime Pluginu tylko po to, aby jego fabryka narzędzi zwróciła `null`.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
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
ładuje właścicielski Plugin, gdy kontrakt narzędzia pasuje do zasad. Dla narzędzi
na gorącej ścieżce, których fabryka zależy od uwierzytelniania/konfiguracji, autorzy Pluginów powinni deklarować
`toolMetadata` zamiast sprawiać, by rdzeń importował runtime w celu zapytania.

## Dokumentacja referencyjna providerAuthChoices

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje go przed załadowaniem runtime dostawcy.
Listy konfiguracji dostawcy używają tych wyborów z manifestu, wyborów konfiguracji
wyprowadzonych z deskryptora oraz metadanych katalogu instalacji bez ładowania runtime dostawcy.

| Pole                 | Wymagane | Typ                                                                  | Znaczenie                                                                                                |
| --------------------- | -------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                                              | Identyfikator providera, do którego należy ten wybór.                                                    |
| `method`              | Tak      | `string`                                                              | Identyfikator metody uwierzytelniania, do której ma nastąpić przekazanie.                                |
| `choiceId`            | Tak      | `string`                                                              | Stabilny identyfikator wyboru uwierzytelniania używany przez przepływy wdrażania i CLI.                  |
| `choiceLabel`         | Nie      | `string`                                                              | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw używa zastępczo `choiceId`.        |
| `choiceHint`          | Nie      | `string`                                                              | Krótki tekst pomocniczy dla selektora.                                                                   |
| `assistantPriority`   | Nie      | `number`                                                              | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.         |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                                        | Ukrywa wybór przed selektorami asystenta, nadal pozwalając na ręczny wybór w CLI.                        |
| `deprecatedChoiceIds` | Nie      | `string[]`                                                            | Starsze identyfikatory wyborów, które powinny przekierowywać użytkowników do tego wyboru zastępczego.    |
| `groupId`             | Nie      | `string`                                                              | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                        |
| `groupLabel`          | Nie      | `string`                                                              | Etykieta widoczna dla użytkownika dla tej grupy.                                                         |
| `groupHint`           | Nie      | `string`                                                              | Krótki tekst pomocniczy dla grupy.                                                                       |
| `optionKey`           | Nie      | `string`                                                              | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                           |
| `cliFlag`             | Nie      | `string`                                                              | Nazwa flagi CLI, taka jak `--openrouter-api-key`.                                                        |
| `cliOption`           | Nie      | `string`                                                              | Pełny kształt opcji CLI, taki jak `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Nie      | `string`                                                              | Opis używany w pomocy CLI.                                                                               |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Powierzchnie wdrażania, w których ten wybór powinien się pojawić. Jeśli pominięte, domyślnie używa `["text-inference"]`. |

## Informacje referencyjne commandAliases

Użyj `commandAliases`, gdy plugin posiada nazwę polecenia środowiska uruchomieniowego, którą użytkownicy mogą
omyłkowo umieścić w `plugins.allow` albo spróbować uruchomić jako główne polecenie CLI. OpenClaw
używa tych metadanych do diagnostyki bez importowania kodu środowiska uruchomieniowego pluginu.

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
| `name`       | Tak      | `string`          | Nazwa polecenia należącego do tego pluginu.                             |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie ukośnikiem czatu, a nie główne polecenie CLI. |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI do zasugerowania dla operacji CLI, jeśli istnieje. |

## Informacje referencyjne activation

Użyj `activation`, gdy plugin może tanio zadeklarować, które zdarzenia płaszczyzny sterowania
powinny uwzględniać go w planie aktywacji/ładowania.

Ten blok to metadane planisty, a nie API cyklu życia. Nie rejestruje
zachowania środowiska uruchomieniowego, nie zastępuje `register(...)` i nie obiecuje, że
kod pluginu już został wykonany. Planista aktywacji używa tych pól, aby
zawęzić pluginy kandydujące przed użyciem istniejących metadanych własności z manifestu,
takich jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki.

Preferuj najwęższe metadane, które już opisują własność. Używaj
`providers`, `channels`, `commandAliases`, deskryptorów konfiguracji lub `contracts`,
gdy te pola wyrażają relację. Używaj `activation` dla dodatkowych
wskazówek planisty, których nie da się przedstawić za pomocą tych pól własności.
Używaj najwyższego poziomu `cliBackends` dla aliasów środowiska uruchomieniowego CLI, takich jak `claude-cli`,
`my-cli` lub `google-gemini-cli`; `activation.onAgentHarnesses` służy tylko do
osadzonych identyfikatorów harnessów agentów, które nie mają jeszcze pola własności.

Ten blok zawiera wyłącznie metadane. Nie rejestruje zachowania środowiska uruchomieniowego i
nie zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia środowiska uruchomieniowego/pluginu.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem pluginów, więc
brak metadanych aktywacji niezwiązanych ze startem zwykle kosztuje tylko wydajność; nie
powinien zmieniać poprawności, dopóki nadal istnieją awaryjne mechanizmy własności manifestu.

Każdy plugin powinien świadomie ustawić `activation.onStartup`. Ustaw go na `true`
tylko wtedy, gdy plugin musi działać podczas startu Gateway. Ustaw go na `false`, gdy
plugin jest bezczynny przy starcie i powinien ładować się tylko z węższych wyzwalaczy.
Pominięcie `onStartup` nie powoduje już niejawnego ładowania pluginu przy starcie; użyj jawnych
metadanych aktywacji dla startu, kanału, konfiguracji, harnessu agenta, pamięci lub
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

| Pole               | Wymagane | Typ                                                  | Znaczenie                                                                                                                                                                                  |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Nie      | `boolean`                                            | Jawna aktywacja przy starcie Gateway. Każdy plugin powinien to ustawić. `true` importuje plugin podczas startu; `false` utrzymuje go jako leniwy przy starcie, chyba że inny dopasowany wyzwalacz wymaga ładowania. |
| `onProviders`      | Nie      | `string[]`                                           | Identyfikatory providerów, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                            |
| `onAgentHarnesses` | Nie      | `string[]`                                           | Identyfikatory osadzonych środowisk uruchomieniowych harnessów agentów, które powinny uwzględniać ten plugin w planach aktywacji/ładowania. Użyj najwyższego poziomu `cliBackends` dla aliasów backendów CLI. |
| `onCommands`       | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                                |
| `onChannels`       | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                                |
| `onRoutes`         | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                                          |
| `onConfigPaths`    | Nie      | `string[]`                                           | Ścieżki konfiguracji względne względem katalogu głównego, które powinny uwzględniać ten plugin w planach startu/ładowania, gdy ścieżka jest obecna i nie jest jawnie wyłączona.             |
| `onCapabilities`   | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki dotyczące możliwości używane przez planowanie aktywacji płaszczyzny sterowania. Preferuj węższe pola, gdy to możliwe.                                                    |

Obecni aktywni konsumenci:

- planowanie startu Gateway używa `activation.onStartup` do jawnego
  importu przy starcie
- planowanie CLI wyzwalane poleceniem używa awaryjnie starszych
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie startu środowiska uruchomieniowego agenta używa `activation.onAgentHarnesses` dla
  osadzonych harnessów oraz najwyższego poziomu `cliBackends[]` dla aliasów środowiska uruchomieniowego CLI
- planowanie konfiguracji/kanału wyzwalane kanałem używa awaryjnie starszej własności `channels[]`,
  gdy brakuje jawnych metadanych aktywacji kanału
- planowanie pluginów przy starcie używa `activation.onConfigPaths` dla niekanałowych głównych
  powierzchni konfiguracji, takich jak blok `browser` dołączonego pluginu przeglądarki
- planowanie konfiguracji/środowiska uruchomieniowego wyzwalane providerem używa awaryjnie starszej własności
  `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych aktywacji providera

Diagnostyka planisty może odróżniać jawne wskazówki aktywacji od awaryjnej
własności manifestu. Na przykład `activation-command-hint` oznacza, że
dopasowano `activation.onCommands`, podczas gdy `manifest-command-alias` oznacza, że
planista użył zamiast tego własności `commandAliases`. Te etykiety powodów są przeznaczone dla
diagnostyki hosta i testów; autorzy pluginów powinni nadal deklarować metadane,
które najlepiej opisują własność.

## Informacje referencyjne qaRunners

Użyj `qaRunners`, gdy plugin wnosi jeden lub więcej runnerów transportu pod
wspólny katalog główny `openclaw qa`. Utrzymuj te metadane jako tanie i statyczne; środowisko uruchomieniowe
pluginu nadal posiada właściwą rejestrację CLI przez lekką powierzchnię
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

| Pole          | Wymagane | Typ      | Znaczenie                                                          |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Tak      | `string` | Podpolecenie zamontowane pod `openclaw qa`, na przykład `matrix`.  |
| `description` | Nie      | `string` | Zapasowy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia-szkicu. |

## odniesienie setup

Użyj `setup`, gdy powierzchnie konfiguracji i wdrażania użytkownika potrzebują tanich metadanych należących do pluginu, zanim runtime zostanie załadowany.

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

Najwyższego poziomu `cliBackends` pozostaje prawidłowe i nadal opisuje backendy wnioskowania CLI. `setup.cliBackends` to powierzchnia deskryptorów specyficzna dla konfiguracji dla przepływów płaszczyzny sterowania/konfiguracji, które powinny pozostać wyłącznie metadanymi.

Gdy są obecne, `setup.providers` i `setup.cliBackends` są preferowaną powierzchnią wyszukiwania opartą najpierw na deskryptorach do wykrywania konfiguracji. Jeśli deskryptor tylko zawęża kandydujący plugin, a konfiguracja nadal potrzebuje bogatszych hooków runtime w czasie konfiguracji, ustaw `requiresRuntime: true` i pozostaw `setup-api` jako zapasową ścieżkę wykonania.

OpenClaw uwzględnia też `setup.providers[].envVars` w ogólnych wyszukiwaniach uwierzytelniania dostawcy i zmiennych środowiskowych. `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności w oknie wycofywania, ale pluginy spoza pakietu, które nadal go używają, otrzymują diagnostykę manifestu. Nowe pluginy powinny umieszczać metadane zmiennych środowiskowych konfiguracji/statusu w `setup.providers[].envVars`.

OpenClaw może też wyprowadzać proste wybory konfiguracji z `setup.providers[].authMethods`, gdy wpis konfiguracji nie jest dostępny albo gdy `setup.requiresRuntime: false` deklaruje, że runtime konfiguracji nie jest potrzebny. Jawne wpisy `providerAuthChoices` pozostają preferowane dla niestandardowych etykiet, flag CLI, zakresu wdrażania użytkownika i metadanych asystenta.

Ustaw `requiresRuntime: false` tylko wtedy, gdy te deskryptory są wystarczające dla powierzchni konfiguracji. OpenClaw traktuje jawne `false` jako kontrakt wyłącznie deskryptorowy i nie wykona `setup-api` ani `openclaw.setupEntry` na potrzeby wyszukiwania konfiguracji. Jeśli plugin wyłącznie deskryptorowy nadal dostarcza jeden z tych wpisów runtime konfiguracji, OpenClaw zgłasza diagnostykę addytywną i nadal go ignoruje. Pominięte `requiresRuntime` zachowuje starsze zachowanie zapasowe, aby istniejące pluginy, które dodały deskryptory bez tej flagi, nie przestały działać.

Ponieważ wyszukiwanie konfiguracji może wykonywać kod `setup-api` należący do pluginu, znormalizowane wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikatowe wśród wykrytych pluginów. Niejednoznaczna własność kończy się zamknięciem z błędem zamiast wybierania zwycięzcy według kolejności wykrywania.

Gdy runtime konfiguracji jest wykonywany, diagnostyka rejestru konfiguracji zgłasza rozjazd deskryptorów, jeśli `setup-api` rejestruje dostawcę lub backend CLI, którego deskryptory manifestu nie deklarują, albo jeśli deskryptor nie ma pasującej rejestracji runtime. Te diagnostyki są addytywne i nie odrzucają starszych pluginów.

### odniesienie setup.providers

| Pole           | Wymagane | Typ        | Znaczenie                                                                                       |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Tak      | `string`   | Identyfikator dostawcy ujawniany podczas konfiguracji lub wdrażania użytkownika. Utrzymuj znormalizowane identyfikatory globalnie unikatowe. |
| `authMethods`  | Nie      | `string[]` | Identyfikatory metod konfiguracji/uwierzytelniania obsługiwanych przez tego dostawcę bez ładowania pełnego runtime. |
| `envVars`      | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie konfiguracji/statusu mogą sprawdzić przed załadowaniem runtime pluginu. |
| `authEvidence` | Nie      | `object[]` | Tanie lokalne kontrole dowodów uwierzytelniania dla dostawców, którzy mogą uwierzytelniać się przez niesekretne znaczniki. |

`authEvidence` jest przeznaczone dla należących do dostawcy lokalnych znaczników poświadczeń, które można zweryfikować bez ładowania kodu runtime. Te kontrole muszą pozostać tanie i lokalne: bez wywołań sieciowych, bez odczytów z pęku kluczy ani menedżera sekretów, bez poleceń powłoki i bez prób API dostawcy.

Obsługiwane wpisy dowodów:

| Pole               | Wymagane | Typ        | Znaczenie                                                                                                      |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Tak      | `string`   | Obecnie `local-file-with-env`.                                                                                 |
| `fileEnvVar`       | Nie      | `string`   | Zmienna środowiskowa zawierająca jawną ścieżkę do pliku poświadczeń.                                           |
| `fallbackPaths`    | Nie      | `string[]` | Lokalne ścieżki plików poświadczeń sprawdzane, gdy `fileEnvVar` jest nieobecna lub pusta. Obsługuje `${HOME}` i `${APPDATA}`. |
| `requiresAnyEnv`   | Nie      | `string[]` | Co najmniej jedna wymieniona zmienna środowiskowa musi być niepusta, aby dowód był prawidłowy.                 |
| `requiresAllEnv`   | Nie      | `string[]` | Każda wymieniona zmienna środowiskowa musi być niepusta, aby dowód był prawidłowy.                             |
| `credentialMarker` | Tak      | `string`   | Niesekretny znacznik zwracany, gdy dowód jest obecny.                                                          |
| `source`           | Nie      | `string`   | Etykieta źródła widoczna dla użytkownika w danych wyjściowych uwierzytelniania/statusu.                        |

### pola setup

| Pole               | Wymagane | Typ        | Znaczenie                                                                                         |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji dostawców ujawniane podczas konfiguracji i wdrażania użytkownika.        |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów z czasu konfiguracji używane do wyszukiwania konfiguracji opartego najpierw na deskryptorach. Utrzymuj znormalizowane identyfikatory globalnie unikatowe. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego pluginu.           |
| `requiresRuntime`  | Nie      | `boolean`  | Czy konfiguracja nadal potrzebuje wykonania `setup-api` po wyszukiwaniu deskryptorów.             |

## odniesienie uiHints

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

| Pole          | Typ        | Znaczenie                              |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika. |
| `help`        | `string`   | Krótki tekst pomocniczy.               |
| `tags`        | `string[]` | Opcjonalne tagi UI.                    |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.        |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe. |
| `placeholder` | `string`   | Tekst zastępczy dla pól formularza.    |

## odniesienie contracts

Używaj `contracts` tylko dla statycznych metadanych własności funkcjonalności, które OpenClaw może odczytać bez importowania runtime pluginu.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Każda lista jest opcjonalna:

| Pole                             | Typ        | Znaczenie                                                                                                                               |
| -------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory fabryk rozszerzeń serwera aplikacji Codex, obecnie `codex-app-server`.                                                   |
| `agentToolResultMiddleware`      | `string[]` | Identyfikatory środowisk uruchomieniowych, dla których ten plugin może rejestrować middleware wyników narzędzi.                         |
| `trustedToolPolicies`            | `string[]` | Lokalne dla pluginu identyfikatory zaufanych polityk przed użyciem narzędzia, które zainstalowany plugin może rejestrować. Wbudowane plugins mogą rejestrować polityki bez tego pola. |
| `externalAuthProviders`          | `string[]` | Identyfikatory dostawców, których hook profilu uwierzytelniania zewnętrznego należy do tego pluginu.                                    |
| `embeddingProviders`             | `string[]` | Identyfikatory ogólnych dostawców embeddingów, które należą do tego pluginu na potrzeby wielokrotnego użytku embeddingów wektorowych, w tym pamięci. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy, które należą do tego pluginu.                                                                            |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym, które należą do tego pluginu.                                              |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym, które należą do tego pluginu.                                                     |
| `memoryEmbeddingProviders`       | `string[]` | Przestarzałe identyfikatory dostawców embeddingów specyficznych dla pamięci, które należą do tego pluginu.                              |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia mediów, które należą do tego pluginu.                                                               |
| `transcriptSourceProviders`      | `string[]` | Identyfikatory dostawców źródeł transkryptów, które należą do tego pluginu.                                                             |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów, które należą do tego pluginu.                                                             |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo, które należą do tego pluginu.                                                               |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania z sieci, które należą do tego pluginu.                                                              |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania w sieci, które należą do tego pluginu.                                                            |
| `migrationProviders`             | `string[]` | Identyfikatory dostawców importu, które należą do tego pluginu dla `openclaw migrate`.                                                  |
| `gatewayMethodDispatch`          | `string[]` | Zarezerwowane uprawnienie dla uwierzytelnionych tras HTTP pluginu, które wysyłają metody Gateway w ramach procesu.                      |
| `tools`                          | `string[]` | Nazwy narzędzi agenta, które należą do tego pluginu.                                                                                    |

`contracts.embeddedExtensionFactories` pozostaje zachowane dla wbudowanych
fabryk rozszerzeń wyłącznie dla serwera aplikacji Codex. Wbudowane transformacje
wyników narzędzi powinny zamiast tego deklarować
`contracts.agentToolResultMiddleware` i rejestrować się przez
`api.registerAgentToolResultMiddleware(...)`. Zainstalowane plugins mogą używać
tego samego punktu integracji middleware tylko wtedy, gdy jest jawnie włączony,
i tylko dla środowisk uruchomieniowych deklarowanych w
`contracts.agentToolResultMiddleware`.

Zainstalowane plugins, które potrzebują hostowego zaufanego poziomu polityki
przed użyciem narzędzia, muszą zadeklarować każdy zarejestrowany lokalny
identyfikator w `contracts.trustedToolPolicies` i być jawnie włączone.
Wbudowane plugins zachowują istniejącą ścieżkę zaufanych polityk, ale
zainstalowane plugins z niezadeklarowanymi identyfikatorami polityk są
odrzucane przed rejestracją. Identyfikatory polityk są ograniczone do
rejestrującego pluginu, więc dwa plugins mogą jednocześnie zadeklarować i
zarejestrować `workflow-budget`; pojedynczy plugin nie może zarejestrować tego
samego lokalnego identyfikatora dwa razy.

Rejestracje środowiska uruchomieniowego `api.registerTool(...)` muszą odpowiadać
`contracts.tools`. Wykrywanie narzędzi używa tej listy, aby ładować tylko te
środowiska uruchomieniowe pluginów, które mogą być właścicielami żądanych
narzędzi.

Plugins dostawców implementujące `resolveExternalAuthProfiles` powinny
deklarować `contracts.externalAuthProviders`; niezadeklarowane hooki
uwierzytelniania zewnętrznego są ignorowane.

Ogólni dostawcy embeddingów powinni deklarować `contracts.embeddingProviders`
dla każdego adaptera zarejestrowanego przez `api.registerEmbeddingProvider(...)`.
Używaj ogólnego kontraktu do wielokrotnego generowania wektorów, w tym dla
dostawców używanych przez wyszukiwanie w pamięci.
`contracts.memoryEmbeddingProviders` to przestarzała zgodność specyficzna dla
pamięci i pozostaje tylko na czas migracji istniejących dostawców do ogólnego
punktu integracji dostawcy embeddingów.

`contracts.gatewayMethodDispatch` obecnie akceptuje
`"authenticated-request"`. Jest to bramka higieny API dla natywnych tras HTTP
pluginu, które celowo wysyłają metody płaszczyzny sterowania Gateway w ramach
procesu, a nie piaskownica przeciwko złośliwym natywnym plugins. Używaj jej
tylko dla ściśle przejrzanych wbudowanych lub operatorskich powierzchni, które
już wymagają uwierzytelniania HTTP Gateway.

## Referencja mediaUnderstandingProviderMetadata

Użyj `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia mediów ma
modele domyślne, priorytet awaryjnego automatycznego uwierzytelniania lub
natywną obsługę dokumentów, których ogólne pomocniki rdzenia potrzebują przed
załadowaniem środowiska uruchomieniowego. Klucze muszą być również zadeklarowane
w `contracts.mediaUnderstandingProviders`.

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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Możliwości medialne udostępniane przez tego dostawcę.                        |
| `defaultModels`        | `Record<string, string>`            | Domyślne mapowanie możliwości na model używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby są sortowane wcześniej dla automatycznego awaryjnego wyboru dostawcy opartego na poświadczeniach. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez dostawcę.                       |

## Referencja channelConfigs

Użyj `channelConfigs`, gdy plugin kanału potrzebuje tanich metadanych
konfiguracji przed załadowaniem środowiska uruchomieniowego. Odczytowe
wykrywanie konfiguracji/statusu kanału może używać tych metadanych bezpośrednio
dla skonfigurowanych kanałów zewnętrznych, gdy nie ma dostępnego wpisu
konfiguracji początkowej albo gdy `setup.requiresRuntime: false` deklaruje, że
środowisko uruchomieniowe konfiguracji początkowej jest niepotrzebne.

`channelConfigs` to metadane manifestu pluginu, a nie nowa sekcja konfiguracji
użytkownika najwyższego poziomu. Użytkownicy nadal konfigurują instancje kanałów
w `channels.<channel-id>`. OpenClaw odczytuje metadane manifestu, aby zdecydować,
który plugin jest właścicielem skonfigurowanego kanału, zanim kod środowiska
uruchomieniowego pluginu zostanie wykonany.

Dla pluginu kanału `configSchema` i `channelConfigs` opisują różne ścieżki:

- `configSchema` waliduje `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` waliduje `channels.<channel-id>`

Niewbudowane plugins deklarujące `channels[]` powinny również deklarować
odpowiadające im wpisy `channelConfigs`. Bez nich OpenClaw nadal może załadować
plugin, ale ścieżki zimne schematu konfiguracji, konfiguracji początkowej i
Control UI nie mogą znać kształtu opcji należących do kanału, dopóki środowisko
uruchomieniowe pluginu nie zostanie wykonane.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` i
`nativeSkillsAutoEnabled` mogą deklarować statyczne wartości domyślne `auto` dla
kontroli konfiguracji poleceń uruchamianych przed załadowaniem środowiska
uruchomieniowego kanału. Wbudowane kanały mogą również publikować te same
wartości domyślne przez `package.json#openclaw.channel.commands` obok innych
metadanych katalogu kanałów należących do pakietu.

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

| Pole          | Typ                      | Znaczenie                                                                             |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI, teksty zastępcze i wskazówki wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami wyboru i inspekcji, gdy metadane środowiska uruchomieniowego nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                              |
| `commands`    | `object`                 | Statyczne automatyczne wartości domyślne natywnych poleceń i natywnych Skills dla kontroli konfiguracji przed uruchomieniem. |
| `preferOver`  | `string[]`               | Starsze lub niżej priorytetowe identyfikatory pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

### Zastępowanie innego pluginu kanału

Użyj `preferOver`, gdy Twój plugin jest preferowanym właścicielem identyfikatora
kanału, który może również dostarczyć inny plugin. Typowe przypadki to zmieniona
nazwa identyfikatora pluginu, samodzielny plugin zastępujący wbudowany plugin
albo utrzymywany fork zachowujący ten sam identyfikator kanału dla zgodności
konfiguracji.

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

Gdy `channels.chat` jest skonfigurowane, OpenClaw bierze pod uwagę zarówno
identyfikator kanału, jak i identyfikator preferowanego pluginu. Jeśli plugin o
niższym priorytecie został wybrany tylko dlatego, że jest wbudowany albo
domyślnie włączony, OpenClaw wyłącza go w efektywnej konfiguracji środowiska
uruchomieniowego, aby jeden plugin był właścicielem kanału i jego narzędzi.
Jawny wybór użytkownika nadal ma pierwszeństwo: jeśli użytkownik jawnie włącza
oba plugins, OpenClaw zachowuje ten wybór i zgłasza diagnostykę zduplikowanych
kanałów/narzędzi zamiast po cichu zmieniać żądany zestaw pluginów.

Ogranicz `preferOver` do identyfikatorów pluginów, które rzeczywiście mogą
dostarczyć ten sam kanał. Nie jest to ogólne pole priorytetu i nie zmienia nazw
kluczy konfiguracji użytkownika.

## Referencja modelSupport

Użyj `modelSupport`, gdy OpenClaw ma wywnioskować Plugin dostawcy z
krótkich identyfikatorów modeli, takich jak `gpt-5.5` lub `claude-sonnet-4.6`, zanim
załaduje się środowisko uruchomieniowe Pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje tę kolejność pierwszeństwa:

- jawne odwołania `provider/model` używają metadanych manifestu `providers` właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują zarówno jeden Plugin niepakietowany, jak i jeden Plugin pakietowany,
  wygrywa Plugin niepakietowany
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Co oznacza                                                                        |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do krótkich identyfikatorów modeli.     |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do krótkich identyfikatorów modeli po usunięciu sufiksu profilu. |

Wpisy `modelPatterns` są kompilowane przez `compileSafeRegex`, który odrzuca
wzorce zawierające zagnieżdżone powtórzenia (na przykład `(a+)+$`). Wzorce, które nie przejdą
kontroli bezpieczeństwa, są po cichu pomijane, tak samo jak składniowo niepoprawny regex.
Utrzymuj wzorce proste i unikaj zagnieżdżonych kwantyfikatorów.

## Odwołanie modelCatalog

Użyj `modelCatalog`, gdy OpenClaw ma znać metadane modeli dostawcy przed
załadowaniem środowiska uruchomieniowego Pluginu. To należące do manifestu źródło stałych wierszy
katalogu, aliasów dostawców, reguł wyciszania i trybu odkrywania. Odświeżanie w środowisku uruchomieniowym
nadal należy do kodu środowiska uruchomieniowego dostawcy, ale manifest informuje rdzeń, kiedy środowisko uruchomieniowe
jest wymagane.

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

| Pole             | Typ                                                      | Co oznacza                                                                                                         |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `providers`      | `Record<string, object>`                                 | Wiersze katalogu dla identyfikatorów dostawców należących do tego Pluginu. Klucze powinny też występować w `providers` najwyższego poziomu. |
| `aliases`        | `Record<string, object>`                                 | Aliasy dostawców, które powinny rozwiązywać się do należącego dostawcy na potrzeby planowania katalogu lub wyciszeń. |
| `suppressions`   | `object[]`                                               | Wiersze modeli z innego źródła, które ten Plugin wycisza z powodu specyficznego dla dostawcy.                      |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Czy katalog dostawcy można odczytać z metadanych manifestu, odświeżyć do pamięci podręcznej, czy wymaga środowiska uruchomieniowego. |
| `runtimeAugment` | `boolean`                                                | Ustaw na `true` tylko wtedy, gdy środowisko uruchomieniowe dostawcy musi dopisać wiersze katalogu po planowaniu manifestu/konfiguracji. |

`aliases` uczestniczy w wyszukiwaniu właściciela dostawcy na potrzeby planowania katalogu modeli.
Cele aliasów muszą być dostawcami najwyższego poziomu należącymi do tego samego Pluginu. Gdy
lista filtrowana według dostawcy używa aliasu, OpenClaw może odczytać manifest właściciela i
zastosować nadpisania API/bazowego adresu URL aliasu bez ładowania środowiska uruchomieniowego dostawcy.
Aliasy nie rozszerzają niefiltrowanych list katalogu; szerokie listy emitują tylko wiersze
kanonicznego dostawcy właściciela.

`suppressions` zastępuje stary hook środowiska uruchomieniowego dostawcy `suppressBuiltInModel`.
Wpisy wyciszeń są honorowane tylko wtedy, gdy dostawca należy do Pluginu lub
jest zadeklarowany jako klucz `modelCatalog.aliases`, który wskazuje należącego dostawcę. Hooki
wyciszania środowiska uruchomieniowego nie są już wywoływane podczas rozwiązywania modeli.

Pola dostawcy:

| Pole      | Typ                      | Co oznacza                                                        |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | Opcjonalny domyślny bazowy adres URL dla modeli w tym katalogu dostawcy. |
| `api`     | `ModelApi`               | Opcjonalny domyślny adapter API dla modeli w tym katalogu dostawcy. |
| `headers` | `Record<string, string>` | Opcjonalne statyczne nagłówki mające zastosowanie do tego katalogu dostawcy. |
| `models`  | `object[]`               | Wymagane wiersze modeli. Wiersze bez `id` są ignorowane.          |

Pola modelu:

| Pole            | Typ                                                            | Co oznacza                                                                  |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Lokalny dla dostawcy identyfikator modelu, bez prefiksu `provider/`.          |
| `name`          | `string`                                                       | Opcjonalna nazwa wyświetlana.                                                |
| `api`           | `ModelApi`                                                     | Opcjonalne nadpisanie API dla modelu.                                        |
| `baseUrl`       | `string`                                                       | Opcjonalne nadpisanie bazowego adresu URL dla modelu.                        |
| `headers`       | `Record<string, string>`                                       | Opcjonalne statyczne nagłówki dla modelu.                                    |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalności akceptowane przez model.                                          |
| `reasoning`     | `boolean`                                                      | Czy model udostępnia zachowanie rozumowania.                                 |
| `contextWindow` | `number`                                                       | Natywne okno kontekstu dostawcy.                                             |
| `contextTokens` | `number`                                                       | Opcjonalny efektywny limit kontekstu środowiska uruchomieniowego, gdy różni się od `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maksymalna liczba tokenów wyjściowych, gdy jest znana.                       |
| `cost`          | `object`                                                       | Opcjonalna cena w USD za milion tokenów, w tym opcjonalne `tieredPricing`.   |
| `compat`        | `object`                                                       | Opcjonalne flagi zgodności odpowiadające zgodności konfiguracji modeli OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status listy. Wyciszaj tylko wtedy, gdy wiersz w ogóle nie może się pojawić. |
| `statusReason`  | `string`                                                       | Opcjonalny powód pokazywany przy statusie innym niż dostępny.                |
| `replaces`      | `string[]`                                                     | Starsze lokalne dla dostawcy identyfikatory modeli zastępowane przez ten model. |
| `replacedBy`    | `string`                                                       | Lokalny dla dostawcy identyfikator modelu zastępczego dla przestarzałych wierszy. |
| `tags`          | `string[]`                                                     | Stabilne tagi używane przez selektory i filtry.                              |

Pola wyciszeń:

| Pole                       | Typ        | Co oznacza                                                                                                |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identyfikator dostawcy dla wiersza nadrzędnego do wyciszenia. Musi należeć do tego Pluginu lub być zadeklarowany jako należący alias. |
| `model`                    | `string`   | Lokalny dla dostawcy identyfikator modelu do wyciszenia.                                                  |
| `reason`                   | `string`   | Opcjonalny komunikat pokazywany, gdy wyciszony wiersz jest żądany bezpośrednio.                           |
| `when.baseUrlHosts`        | `string[]` | Opcjonalna lista hostów efektywnego bazowego adresu URL dostawcy wymagana, zanim wyciszenie zostanie zastosowane. |
| `when.providerConfigApiIn` | `string[]` | Opcjonalna lista dokładnych wartości `api` konfiguracji dostawcy wymaganych, zanim wyciszenie zostanie zastosowane. |

Nie umieszczaj danych wyłącznie środowiska uruchomieniowego w `modelCatalog`. Używaj `static` tylko wtedy, gdy wiersze
manifestu są wystarczająco kompletne, aby powierzchnie list i selektorów filtrowane według dostawcy mogły pominąć
odkrywanie przez rejestr/środowisko uruchomieniowe. Używaj `refreshable`, gdy wiersze manifestu są użytecznymi
listowalnymi ziarnami lub uzupełnieniami, ale odświeżenie/pamięć podręczna może później dodać więcej wierszy;
wiersze odświeżalne same w sobie nie są autorytatywne. Używaj `runtime`, gdy OpenClaw
musi załadować środowisko uruchomieniowe dostawcy, aby poznać listę.

## Odwołanie modelIdNormalization

Użyj `modelIdNormalization` do taniego, należącego do dostawcy porządkowania identyfikatorów modeli, które musi
nastąpić przed załadowaniem środowiska uruchomieniowego dostawcy. Dzięki temu aliasy, takie jak krótkie nazwy
modeli, lokalne dla dostawcy starsze identyfikatory i reguły prefiksów proxy pozostają w manifeście
właściwego Pluginu zamiast w tabelach wyboru modeli rdzenia.

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

| Pole                                 | Typ                     | Co oznacza                                                                               |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Dokładne aliasy identyfikatorów modeli bez rozróżniania wielkości liter. Wartości są zwracane tak, jak zapisano. |
| `stripPrefixes`                      | `string[]`              | Prefiksy do usunięcia przed wyszukiwaniem aliasu, przydatne przy starszym duplikowaniu provider/model. |
| `prefixWhenBare`                     | `string`                | Prefiks do dodania, gdy znormalizowany identyfikator modelu nie zawiera jeszcze `/`.      |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Warunkowe reguły prefiksów dla gołych identyfikatorów po wyszukaniu aliasu, kluczowane przez `modelPrefix` i `prefix`. |

## Odwołanie providerEndpoints

Użyj `providerEndpoints` do klasyfikacji punktów końcowych, którą ogólna polityka żądań
musi znać przed załadowaniem środowiska uruchomieniowego dostawcy. Rdzeń nadal jest właścicielem znaczenia każdego
`endpointClass`; manifesty Pluginów są właścicielami metadanych hosta i bazowego adresu URL.

Pola endpointu:

| Pole                           | Typ        | Znaczenie                                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Znana klasa endpointu rdzenia, taka jak `openrouter`, `moonshot-native` lub `google-vertex`.               |
| `hosts`                        | `string[]` | Dokładne nazwy hostów mapowane na klasę endpointu.                                                         |
| `hostSuffixes`                 | `string[]` | Sufiksy hostów mapowane na klasę endpointu. Dodaj prefiks `.` dla dopasowania wyłącznie sufiksu domeny.    |
| `baseUrls`                     | `string[]` | Dokładne znormalizowane bazowe adresy URL HTTP(S) mapowane na klasę endpointu.                             |
| `googleVertexRegion`           | `string`   | Statyczny region Google Vertex dla dokładnych hostów globalnych.                                           |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks usuwany z pasujących hostów, aby ujawnić prefiks regionu Google Vertex.                             |

## Dokumentacja referencyjna providerRequest

Użyj `providerRequest` dla tanich metadanych zgodności żądań, których ogólna
polityka żądań potrzebuje bez ładowania środowiska wykonawczego dostawcy. Przepisywanie
ładunku specyficzne dla zachowania trzymaj w hakach środowiska wykonawczego dostawcy
lub współdzielonych helperach rodziny dostawców.

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

| Pole                  | Typ          | Znaczenie                                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etykieta rodziny dostawców używana przez ogólne decyzje i diagnostykę zgodności żądań.             |
| `compatibilityFamily` | `"moonshot"` | Opcjonalny kubeł zgodności rodziny dostawców dla współdzielonych helperów żądań.                   |
| `openAICompletions`   | `object`     | Flagi żądań uzupełnień zgodnych z OpenAI, obecnie `supportsStreamingUsage`.                        |

## Dokumentacja referencyjna secretProviderIntegrations

Użyj `secretProviderIntegrations`, gdy plugin może opublikować wielokrotnego użytku
preset dostawcy exec SecretRef. OpenClaw odczytuje te metadane przed załadowaniem
środowiska wykonawczego pluginu, zapisuje własność pluginu w `secrets.providers.<alias>.pluginIntegration`
i pozostawia faktyczne rozwiązywanie sekretów środowisku wykonawczemu SecretRef.
Presety są udostępniane tylko dla pluginów wbudowanych i zainstalowanych pluginów
odkrytych z zarządzanych katalogów instalacji pluginów, takich jak instalacje git i ClawHub.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

Klucz mapy jest identyfikatorem integracji. Jeśli `providerAlias` zostanie pominięty,
OpenClaw używa identyfikatora integracji jako aliasu dostawcy SecretRef. Aliasy
dostawców muszą pasować do normalnego wzorca aliasu dostawcy SecretRef, na przykład
`team-secrets` lub `onepassword-work`.

Gdy operator wybierze preset, OpenClaw zapisuje odwołanie do dostawcy takie jak:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

Podczas uruchamiania lub ponownego ładowania OpenClaw rozwiązuje tego dostawcę,
ładując bieżące metadane manifestu pluginu, sprawdzając, czy plugin właścicielski
jest zainstalowany i aktywny, oraz materializując polecenie exec z manifestu.
Wyłączenie lub usunięcie pluginu unieważnia dostawcę dla aktywnych SecretRefs.
Operatorzy, którzy chcą samodzielnej konfiguracji exec, nadal mogą bezpośrednio
zapisywać ręcznych dostawców `command`/`args`.

Obecnie obsługiwane są tylko presety `source: "exec"`. `command` musi być
`${node}`, a `args[0]` musi być skryptem rozwiązywania względnym wobec katalogu
głównego pluginu i zaczynającym się od `./`. OpenClaw materializuje go podczas
uruchamiania lub ponownego ładowania do bieżącego pliku wykonywalnego Node oraz
bezwzględnej ścieżki skryptu w pluginie. Opcje Node, takie jak `--require`,
`--import`, `--loader`, `--env-file`, `--eval` i `--print`, nie są częścią
kontraktu presetu manifestu. Operatorzy, którzy potrzebują poleceń innych niż
Node, mogą bezpośrednio skonfigurować samodzielnych ręcznych dostawców exec.

OpenClaw wyprowadza `trustedDirs` dla presetów manifestu z katalogu głównego
pluginu oraz, dla presetów `${node}`, z katalogu bieżącego pliku wykonywalnego
Node. `trustedDirs` autorstwa manifestu są ignorowane. Inne opcje dostawcy exec,
takie jak `timeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` i
`allowInsecurePath`, przechodzą do normalnej konfiguracji dostawcy exec SecretRef.

## Dokumentacja referencyjna modelPricing

Użyj `modelPricing`, gdy dostawca potrzebuje zachowania cenowego płaszczyzny
sterowania przed załadowaniem środowiska wykonawczego. Pamięć podręczna cen
Gateway odczytuje te metadane bez importowania kodu środowiska wykonawczego
dostawcy.

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

| Pole         | Typ               | Znaczenie                                                                                                    |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | Ustaw `false` dla lokalnych lub samohostowanych dostawców, którzy nigdy nie powinni pobierać cen OpenRouter ani LiteLLM. |
| `openRouter` | `false \| object` | Mapowanie wyszukiwania cen OpenRouter. `false` wyłącza wyszukiwanie OpenRouter dla tego dostawcy.            |
| `liteLLM`    | `false \| object` | Mapowanie wyszukiwania cen LiteLLM. `false` wyłącza wyszukiwanie LiteLLM dla tego dostawcy.                  |

Pola źródła:

| Pole                       | Typ                | Znaczenie                                                                                                             |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identyfikator dostawcy zewnętrznego katalogu, gdy różni się od identyfikatora dostawcy OpenClaw, na przykład `z-ai` dla dostawcy `zai`. |
| `passthroughProviderModel` | `boolean`          | Traktuj identyfikatory modeli zawierające ukośnik jako zagnieżdżone odwołania dostawca/model, przydatne dla dostawców proxy, takich jak OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Dodatkowe warianty identyfikatorów modeli zewnętrznego katalogu. `version-dots` próbuje identyfikatorów wersji z kropkami, takich jak `claude-opus-4.6`. |

### Indeks dostawców OpenClaw

Indeks dostawców OpenClaw to metadane podglądowe należące do OpenClaw dla
dostawców, których pluginy mogą nie być jeszcze zainstalowane. Nie jest częścią
manifestu pluginu. Manifesty pluginów pozostają autorytetem zainstalowanego
pluginu. Indeks dostawców jest wewnętrznym kontraktem awaryjnym, z którego
przyszłe powierzchnie instalowalnych dostawców i selektora modeli przed
instalacją będą korzystać, gdy plugin dostawcy nie jest zainstalowany.

Kolejność autorytetów katalogu:

1. Konfiguracja użytkownika.
2. Manifest zainstalowanego pluginu `modelCatalog`.
3. Pamięć podręczna katalogu modeli z jawnego odświeżenia.
4. Wiersze podglądu Indeksu dostawców OpenClaw.

Indeks dostawców nie może zawierać sekretów, stanu włączenia, haków środowiska
wykonawczego ani aktywnych danych modeli specyficznych dla konta. Jego katalogi
podglądowe używają tego samego kształtu wiersza dostawcy `modelCatalog` co
manifesty pluginów, ale powinny pozostać ograniczone do stabilnych metadanych
wyświetlania, chyba że pola adaptera środowiska wykonawczego, takie jak `api`,
`baseUrl`, ceny lub flagi zgodności, są celowo utrzymywane w zgodności z
manifestem zainstalowanego pluginu. Dostawcy z aktywnym odkrywaniem `/models`
powinni zapisywać odświeżone wiersze przez jawną ścieżkę pamięci podręcznej
katalogu modeli, zamiast wywoływać API dostawców podczas normalnego listowania
lub onboardingu.

Wpisy Indeksu dostawców mogą także zawierać metadane instalowalnego pluginu dla
dostawców, których plugin został przeniesiony poza rdzeń albo z innego powodu
nie jest jeszcze zainstalowany. Te metadane odzwierciedlają wzorzec katalogu
kanałów: nazwa pakietu, specyfikacja instalacji npm, oczekiwana integralność
i tanie etykiety wyboru uwierzytelniania wystarczą, aby pokazać instalowalną
opcję konfiguracji. Po zainstalowaniu pluginu wygrywa jego manifest, a wpis
Indeksu dostawców jest ignorowany dla tego dostawcy.

Starsze klucze funkcjonalności najwyższego poziomu są przestarzałe. Użyj
`openclaw doctor --fix`, aby przenieść `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` pod `contracts`; normalne ładowanie
manifestu nie traktuje już tych pól najwyższego poziomu jako własności
funkcjonalności.

## Manifest kontra package.json

Te dwa pliki pełnią różne zadania:

| Plik                   | Do czego go używać                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Odkrywanie, walidacja konfiguracji, metadane wyboru uwierzytelniania i podpowiedzi UI, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadane npm, instalacja zależności oraz blok `openclaw` używany dla punktów wejścia, bramkowania instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie należy dany element metadanych, użyj tej reguły:

- jeśli OpenClaw musi znać go przed załadowaniem kodu pluginu, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść go w `package.json`

### Pola package.json wpływające na odkrywanie

Niektóre metadane pluginu sprzed uruchomienia celowo znajdują się w `package.json`
w bloku `openclaw`, zamiast w `openclaw.plugin.json`.
`openclaw.bundle` i `openclaw.bundle.json` nie są kontraktami pluginów OpenClaw;
natywne pluginy muszą używać `openclaw.plugin.json` oraz obsługiwanych pól
`package.json#openclaw` poniżej.

Ważne przykłady:

| Pole                                                                                       | Co oznacza                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Deklaruje natywne punkty wejścia Plugin. Musi pozostać w katalogu pakietu Plugin.                                                                                                             |
| `openclaw.runtimeExtensions`                                                               | Deklaruje zbudowane punkty wejścia runtime JavaScript dla zainstalowanych pakietów. Musi pozostać w katalogu pakietu Plugin.                                                                  |
| `openclaw.setupEntry`                                                                      | Lekki punkt wejścia używany tylko do konfiguracji podczas onboardingu, odroczonego uruchamiania kanału oraz odkrywania statusu kanału/SecretRef w trybie tylko do odczytu. Musi pozostać w katalogu pakietu Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Wymaga `setupEntry`, musi istnieć i musi pozostać w katalogu pakietu Plugin.                         |
| `openclaw.channel`                                                                         | Tanie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                                                                             |
| `openclaw.channel.commands`                                                                | Statyczne metadane natywnych poleceń i automatycznych domyślnych wartości natywnych Skills używane przez konfigurację, audyt i powierzchnie list poleceń przed załadowaniem runtime kanału.   |
| `openclaw.channel.configuredState`                                                         | Lekkie metadane modułu sprawdzającego stan konfiguracji, które mogą odpowiedzieć „czy konfiguracja oparta tylko na env już istnieje?” bez ładowania pełnego runtime kanału.                  |
| `openclaw.channel.persistedAuthState`                                                      | Lekkie metadane modułu sprawdzającego utrwalony stan uwierzytelnienia, które mogą odpowiedzieć „czy cokolwiek jest już zalogowane?” bez ładowania pełnego runtime kanału.                    |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Wskazówki instalacji/aktualizacji dla dołączonych i zewnętrznie publikowanych Plugin.                                                                                                         |
| `openclaw.install.defaultChoice`                                                           | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Minimalna obsługiwana wersja hosta OpenClaw, używająca dolnego ograniczenia semver, takiego jak `>=2026.3.22` lub `>=2026.5.1-beta.1`.                                                       |
| `openclaw.compat.pluginApi`                                                                | Minimalny zakres API Plugin OpenClaw wymagany przez ten pakiet, używający dolnego ograniczenia semver, takiego jak `>=2026.5.27`.                                                            |
| `openclaw.install.expectedIntegrity`                                                       | Oczekiwany ciąg integralności npm dist, taki jak `sha512-...`; przepływy instalacji i aktualizacji weryfikują wobec niego pobrany artefakt.                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Zezwala na wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego Plugin, gdy konfiguracja jest nieprawidłowa.                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | Aliasy pakietów npm, które muszą się zmaterializować, gdy ich ograniczenia platformowe w lockfile pasują do bieżącego hosta.                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Pozwala powierzchniom kanału setup-runtime załadować się przed nasłuchem, a następnie odracza pełny skonfigurowany Plugin kanału do aktywacji po rozpoczęciu nasłuchu.                       |

Metadane manifestu decydują, które wybory dostawcy/kanału/konfiguracji pojawiają się w
onboardingu przed załadowaniem runtime. `package.json#openclaw.install` informuje
onboarding, jak pobrać lub włączyć ten Plugin, gdy użytkownik wybierze jedną z tych
opcji. Nie przenoś wskazówek instalacji do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania
rejestru manifestów dla niedołączonych źródeł Plugin. Nieprawidłowe wartości są odrzucane;
nowsze, ale prawidłowe wartości pomijają zewnętrzne Plugin na starszych hostach. Dołączone
źródłowe Plugin są uznawane za współwersjonowane z checkoutem hosta.

`openclaw.install.requiredPlatformPackages` służy pakietom npm, które udostępniają
wymagane natywne pliki binarne przez opcjonalne, specyficzne dla platformy aliasy. Wymień
gołą nazwę pakietu npm dla każdego obsługiwanego aliasu platformowego. Podczas instalacji npm
OpenClaw weryfikuje tylko zadeklarowany alias, którego ograniczenia lockfile pasują do
bieżącego hosta. Jeśli npm zgłosi powodzenie, ale pominie ten alias, OpenClaw ponawia próbę raz
ze świeżą pamięcią podręczną i wycofuje instalację, jeśli alias nadal jest brakujący.

`openclaw.compat.pluginApi` jest egzekwowane podczas instalacji pakietu dla niedołączonych
źródeł Plugin. Używaj go dla minimalnej wersji API OpenClaw plugin SDK/runtime, względem której
pakiet został zbudowany. Może być bardziej rygorystyczne niż `minHostVersion`, gdy pakiet
Plugin potrzebuje nowszego API, ale nadal zachowuje niższą wskazówkę instalacji dla innych
przepływów. Oficjalna synchronizacja wydań OpenClaw domyślnie podnosi istniejące oficjalne
minimalne wersje API Plugin do wersji wydania OpenClaw, ale wydania dotyczące tylko Plugin
mogą zachować niższą minimalną wersję, gdy pakiet celowo obsługuje starsze hosty. Nie używaj
samej wersji pakietu jako kontraktu zgodności. `peerDependencies.openclaw`
pozostaje metadanymi pakietu npm; OpenClaw używa kontraktu `openclaw.compat.pluginApi`
do decyzji o zgodności instalacji.

Oficjalne metadane instalacji na żądanie powinny używać `clawhubSpec`, gdy Plugin jest
opublikowany w ClawHub; onboarding traktuje to jako preferowane zdalne źródło i
zapisuje fakty artefaktu ClawHub po instalacji. `npmSpec` pozostaje rezerwową ścieżką zgodności
dla pakietów, które jeszcze nie zostały przeniesione do ClawHub.

Dokładne przypinanie wersji npm już znajduje się w `npmSpec`, na przykład
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne zewnętrzne wpisy katalogu
powinny łączyć dokładne specyfikacje z `expectedIntegrity`, aby przepływy aktualizacji
kończyły się bezpieczną odmową, jeśli pobrany artefakt npm nie pasuje już do przypiętego wydania.
Interaktywny onboarding nadal oferuje zaufane specyfikacje npm z rejestru, w tym gołe
nazwy pakietów i dist-tags, dla zgodności. Diagnostyka katalogu może rozróżniać
źródła dokładne, pływające, przypięte integralnością, bez integralności, z niezgodną nazwą
pakietu i z nieprawidłowym domyślnym wyborem. Ostrzega także, gdy
`expectedIntegrity` jest obecne, ale nie ma prawidłowego źródła npm, które może przypiąć.
Gdy `expectedIntegrity` jest obecne,
przepływy instalacji/aktualizacji je egzekwują; gdy jest pominięte, rozwiązanie rejestru jest
zapisywane bez przypięcia integralności.

Pluginy kanałów powinny dostarczać `openclaw.setupEntry`, gdy skany statusu, listy kanałów
lub SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego
runtime. Punkt wejścia konfiguracji powinien udostępniać metadane kanału oraz bezpieczne dla konfiguracji
adaptery konfiguracji, statusu i sekretów; klientów sieciowych, listenery Gateway i
runtime transportu trzymaj w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia runtime nie nadpisują kontroli granic pakietu dla źródłowych
pól punktów wejścia. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że
wychodząca poza granice ścieżka `openclaw.extensions` stanie się możliwa do załadowania.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie sprawia,
że dowolne uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala przepływom instalacji
odzyskać działanie tylko po konkretnych przestarzałych awariach aktualizacji dołączonego Plugin, takich jak
brakująca ścieżka dołączonego Plugin lub przestarzały wpis `channels.<id>` dla tego samego
dołączonego Plugin. Niepowiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
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

Używaj go, gdy przepływy konfiguracji, doctor, statusu lub obecności w trybie tylko do odczytu potrzebują taniej
sondy uwierzytelnienia tak/nie przed załadowaniem pełnego Plugin kanału. Utrwalony stan uwierzytelnienia nie jest
skonfigurowanym stanem kanału: nie używaj tych metadanych do automatycznego włączania Plugin,
naprawiania zależności runtime ani decydowania, czy runtime kanału powinien się załadować.
Docelowy eksport powinien być małą funkcją, która odczytuje tylko utrwalony stan; nie
kieruj go przez pełny barrel runtime kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla tanich sprawdzeń konfiguracji
opartych tylko na env:

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

Używaj go, gdy kanał może odpowiedzieć o stanie konfiguracji na podstawie env lub innych małych
wejść spoza runtime. Jeśli sprawdzenie wymaga pełnego rozwiązywania konfiguracji albo rzeczywistego
runtime kanału, zostaw tę logikę w hooku Plugin `config.hasConfiguredState`.

## Pierwszeństwo odkrywania (zduplikowane identyfikatory Plugin)

OpenClaw odkrywa Plugin z kilku katalogów głównych. Surową kolejność skanowania systemu plików
znajdziesz w [Kolejność skanowania Plugin
](/pl/gateway/configuration-reference#plugin-scan-order). Jeśli dwa odkrycia
mają ten sam `id`, zachowywany jest tylko manifest o **najwyższym pierwszeństwie**;
duplikaty o niższym pierwszeństwie są odrzucane zamiast ładowania obok niego.

Pierwszeństwo, od najwyższego do najniższego:

1. **Wybrane w konfiguracji** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Dołączone** — Plugin dostarczane z OpenClaw
3. **Instalacja globalna** — Plugin zainstalowane w globalnym katalogu głównym Plugin OpenClaw
4. **Workspace** — Plugin odkryte względem bieżącego workspace

Konsekwencje:

- Sforkowana lub przestarzała kopia dołączonego Plugin znajdująca się w workspace nie przesłoni dołączonego buildu.
- Aby faktycznie zastąpić dołączony Plugin lokalnym, przypnij go przez `plugins.entries.<id>`, aby wygrał przez pierwszeństwo, zamiast polegać na odkrywaniu workspace.
- Odrzucenia duplikatów są logowane, aby Doctor i diagnostyka uruchamiania mogły wskazać odrzuconą kopię.
- Nadpisania duplikatów wybranych w konfiguracji są w diagnostyce formułowane jako jawne nadpisania, ale nadal ostrzegają, aby przestarzałe forki i przypadkowe przesłonięcia pozostały widoczne.

## Wymagania JSON Schema

- **Każdy plugin musi dostarczać JSON Schema**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest dopuszczalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są weryfikowane podczas odczytu/zapisu konfiguracji, a nie w czasie wykonywania.
- Podczas rozszerzania lub forkowania dołączonego pluginu o nowe klucze konfiguracji zaktualizuj jednocześnie `configSchema` w `openclaw.plugin.json` tego pluginu. Schematy dołączonych pluginów są rygorystyczne, więc dodanie `plugins.entries.<id>.config.myNewKey` w konfiguracji użytkownika bez dodania `myNewKey` do `configSchema.properties` zostanie odrzucone przed załadowaniem środowiska wykonawczego pluginu.

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

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału jest zadeklarowany przez
  manifest pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony albo brakujący manifest lub schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja zostaje zachowana, a
  **ostrzeżenie** jest pokazywane w Doctorze i logach.

Zobacz [Informacje o konfiguracji](/pl/gateway/configuration), aby poznać pełny schemat `plugins.*`.

## Uwagi

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym ładowanych z lokalnego systemu plików. Runtime nadal ładuje moduł pluginu osobno; manifest służy tylko do wykrywania i walidacji.
- Natywne manifesty są parsowane za pomocą JSON5, więc komentarze, końcowe przecinki i nieujęte w cudzysłów klucze są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestów odczytuje tylko udokumentowane pola manifestu. Unikaj niestandardowych kluczy najwyższego poziomu.
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy plugin ich nie potrzebuje.
- `providerCatalogEntry` musi pozostać lekki i nie powinien importować rozbudowanego kodu runtime; używaj go do statycznych metadanych katalogu dostawców lub wąskich deskryptorów wykrywania, a nie do wykonywania w czasie obsługi żądania.
- Wyłączne rodzaje pluginów wybiera się przez `plugins.slots.*`: `kind: "memory"` przez `plugins.slots.memory`, `kind: "context-engine"` przez `plugins.slots.contextEngine` (domyślnie `legacy`).
- Zadeklaruj wyłączny rodzaj pluginu w tym manifeście. `OpenClawPluginDefinition.kind` w punkcie wejścia runtime jest przestarzałe i pozostaje tylko jako fallback zgodności dla starszych pluginów.
- Metadane zmiennych środowiskowych (`setup.providers[].envVars`, przestarzałe `providerAuthEnvVars` oraz `channelEnvVars`) mają wyłącznie charakter deklaratywny. Status, audyt, walidacja dostarczania przez cron i inne powierzchnie tylko do odczytu nadal stosują zaufanie do pluginu oraz efektywną politykę aktywacji, zanim potraktują zmienną środowiskową jako skonfigurowaną.
- Metadane kreatora runtime wymagające kodu dostawcy opisano w [hookach runtime dostawcy](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli Twój plugin zależy od modułów natywnych, udokumentuj kroki kompilacji oraz wszelkie wymagania dotyczące listy dozwolonych pakietów menedżera pakietów (na przykład pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Powiązane

<CardGroup cols={3}>
  <Card title="Tworzenie pluginów" href="/pl/plugins/building-plugins" icon="rocket">
    Pierwsze kroki z pluginami.
  </Card>
  <Card title="Architektura pluginów" href="/pl/plugins/architecture" icon="diagram-project">
    Architektura wewnętrzna i model możliwości.
  </Card>
  <Card title="Omówienie SDK" href="/pl/plugins/sdk-overview" icon="book">
    Dokumentacja SDK pluginów i importy podścieżek.
  </Card>
</CardGroup>
