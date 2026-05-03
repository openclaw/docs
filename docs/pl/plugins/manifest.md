---
read_when:
    - Tworzysz Plugin OpenClaw
    - Musisz opublikować schemat konfiguracji Plugin lub debugować błędy walidacji Plugin
summary: Manifest Plugin + wymagania dotyczące schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

Ta strona dotyczy wyłącznie **natywnego manifestu Plugin OpenClaw**.

Informacje o zgodnych układach pakietów znajdziesz w sekcji [Pakiety Plugin](/pl/plugins/bundles).

Zgodne formaty pakietów używają innych plików manifestu:

- Pakiet Codex: `.codex-plugin/plugin.json`
- Pakiet Claude: `.claude-plugin/plugin.json` albo domyślny układ komponentów Claude
  bez manifestu
- Pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa również te układy pakietów, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych pakietów OpenClaw obecnie odczytuje metadane pakietu oraz zadeklarowane
katalogi główne Skills, katalogi główne poleceń Claude, domyślne ustawienia `settings.json`
pakietu Claude, domyślne ustawienia LSP pakietu Claude oraz obsługiwane pakiety hooków, gdy układ jest zgodny
z oczekiwaniami środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym Plugin**. OpenClaw używa tego manifestu do walidowania konfiguracji
**bez wykonywania kodu Plugin**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Plugin i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Plugin: [Pluginy](/pl/tools/plugin).
Informacje o natywnym modelu możliwości i aktualnych zaleceniach dotyczących zgodności zewnętrznej:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Co robi ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje **zanim załaduje kod Twojego
Plugin**. Wszystko poniżej musi być na tyle lekkie, aby dało się to sprawdzić bez uruchamiania
środowiska uruchomieniowego Plugin.

**Używaj go do:**

- tożsamości Plugin, walidacji konfiguracji i wskazówek interfejsu konfiguracji
- metadanych uwierzytelniania, wdrażania i konfiguracji (alias, automatyczne włączanie, zmienne środowiskowe dostawcy, wybory uwierzytelniania)
- wskazówek aktywacji dla powierzchni płaszczyzny sterowania
- skróconej własności rodzin modeli
- statycznych migawek własności możliwości (`contracts`)
- metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzić
- metadanych konfiguracji specyficznych dla kanału, scalanych z katalogiem i powierzchniami walidacji

**Nie używaj go do:** rejestrowania zachowania środowiska uruchomieniowego, deklarowania punktów wejścia kodu
ani metadanych instalacji npm. Te elementy należą do kodu Twojego Plugin i pliku `package.json`.

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

| Pole                                 | Wymagane | Typ                              | Znaczenie                                                                                                                                                                                                                          |
| ------------------------------------ | -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Tak      | `string`                         | Kanoniczny identyfikator pluginu. To jest identyfikator używany w `plugins.entries.<id>`.                                                                                                                                          |
| `configSchema`                       | Tak      | `object`                         | Wbudowany JSON Schema dla konfiguracji tego pluginu.                                                                                                                                                                               |
| `enabledByDefault`                   | Nie      | `true`                           | Oznacza dołączony plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić plugin domyślnie wyłączony.                                                                             |
| `enabledByDefaultOnPlatforms`        | Nie      | `string[]`                       | Oznacza dołączony plugin jako domyślnie włączony tylko na wymienionych platformach Node.js, na przykład `["darwin"]`. Jawna konfiguracja nadal ma pierwszeństwo.                                                                   |
| `legacyPluginIds`                    | Nie      | `string[]`                       | Starsze identyfikatory, które są normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                                        |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten plugin, gdy odwołania do uwierzytelniania, konfiguracji lub modelu o nich wspominają.                                                                            |
| `kind`                               | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj pluginu używany przez `plugins.slots.*`.                                                                                                                                                                 |
| `channels`                           | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                 |
| `providers`                          | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                                                               |
| `providerDiscoveryEntry`             | Nie      | `string`                         | Lekka ścieżka modułu wykrywania dostawców, względna wobec katalogu głównego pluginu, dla metadanych katalogu dostawców o zakresie manifestu, które można wczytać bez aktywowania pełnego środowiska uruchomieniowego pluginu.     |
| `modelSupport`                       | Nie      | `object`                         | Skrótowe metadane rodzin modeli należące do manifestu, używane do automatycznego wczytania pluginu przed uruchomieniem środowiska.                                                                                                 |
| `modelCatalog`                       | Nie      | `object`                         | Deklaratywne metadane katalogu modeli dla dostawców należących do tego pluginu. To kontrakt płaszczyzny sterowania dla przyszłego listowania tylko do odczytu, onboardingu, selektorów modeli, aliasów i wyciszeń bez wczytywania środowiska uruchomieniowego pluginu. |
| `modelPricing`                       | Nie      | `object`                         | Należąca do dostawcy zasada wyszukiwania zewnętrznych cen. Użyj jej, aby wyłączyć lokalnych/samodzielnie hostowanych dostawców ze zdalnych katalogów cen lub mapować odwołania dostawców na identyfikatory katalogów OpenRouter/LiteLLM bez twardego kodowania identyfikatorów dostawców w rdzeniu. |
| `modelIdNormalization`               | Nie      | `object`                         | Należące do dostawcy czyszczenie aliasów/prefiksów identyfikatorów modeli, które musi zostać wykonane przed wczytaniem środowiska uruchomieniowego dostawcy.                                                                       |
| `providerEndpoints`                  | Nie      | `object[]`                       | Należące do manifestu metadane hosta/baseUrl punktu końcowego dla tras dostawców, które rdzeń musi sklasyfikować przed wczytaniem środowiska uruchomieniowego dostawcy.                                                            |
| `providerRequest`                    | Nie      | `object`                         | Tanie metadane rodziny dostawcy i zgodności żądań używane przez ogólną politykę żądań przed wczytaniem środowiska uruchomieniowego dostawcy.                                                                                       |
| `cliBackends`                        | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należące do tego pluginu. Używane do automatycznej aktywacji przy starcie na podstawie jawnych odwołań w konfiguracji.                                                                     |
| `syntheticAuthRefs`                  | Nie      | `string[]`                       | Odwołania do dostawców lub backendów CLI, których należący do pluginu syntetyczny hook uwierzytelniania powinien zostać sprawdzony podczas zimnego wykrywania modeli przed wczytaniem środowiska uruchomieniowego.                 |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                       | Należące do dołączonego pluginu zastępcze wartości klucza API, które reprezentują nietajne lokalne, OAuth lub otoczeniowe poświadczenia.                                                                                            |
| `commandAliases`                     | Nie      | `object[]`                       | Nazwy poleceń należące do tego pluginu, które powinny generować świadome pluginu diagnostyki konfiguracji i CLI przed wczytaniem środowiska uruchomieniowego.                                                                      |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`       | Przestarzałe metadane zgodności env do wyszukiwania uwierzytelniania/statusu dostawcy. Dla nowych pluginów preferuj `setup.providers[].envVars`; OpenClaw nadal odczytuje to pole w okresie wycofywania.                           |
| `providerAuthAliases`                | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący klucz API i profile uwierzytelniania dostawcy bazowego.       |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`       | Tanie metadane env kanału, które OpenClaw może sprawdzić bez wczytywania kodu pluginu. Użyj tego dla konfiguracji kanału sterowanej env lub powierzchni uwierzytelniania, które powinny być widoczne dla ogólnych helperów startu/konfiguracji. |
| `providerAuthChoices`                | Nie      | `object[]`                       | Tanie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego okablowania flag CLI.                                                                                           |
| `activation`                         | Nie      | `object`                         | Tanie metadane planisty aktywacji dla startu, dostawcy, polecenia, kanału, trasy i wczytywania wyzwalanego możliwościami. Tylko metadane; środowisko uruchomieniowe pluginu nadal jest właścicielem faktycznego zachowania.        |
| `setup`                              | Nie      | `object`                         | Tanie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzić bez wczytywania środowiska uruchomieniowego pluginu.                                                                       |
| `qaRunners`                          | Nie      | `object[]`                       | Tanie deskryptory runnerów QA używane przez współdzielonego hosta `openclaw qa` przed wczytaniem środowiska uruchomieniowego pluginu.                                                                                              |
| `contracts`                          | Nie      | `object`                         | Statyczna migawka własności możliwości dla zewnętrznych hooków uwierzytelniania, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów, generowania obrazów, generowania muzyki, generowania wideo, web-fetch, wyszukiwania w sieci i własności narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`         | Tanie wartości domyślne rozumienia mediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                                  |
| `imageGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania obrazów dla identyfikatorów dostawców zadeklarowanych w `contracts.imageGenerationProviders`, w tym należące do dostawcy aliasy uwierzytelniania i zabezpieczenia base-url.            |
| `videoGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania wideo dla identyfikatorów dostawców zadeklarowanych w `contracts.videoGenerationProviders`, w tym należące do dostawcy aliasy uwierzytelniania i zabezpieczenia base-url.              |
| `musicGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane uwierzytelniania generowania muzyki dla identyfikatorów dostawców zadeklarowanych w `contracts.musicGenerationProviders`, w tym należące do dostawcy aliasy uwierzytelniania i zabezpieczenia base-url.             |
| `toolMetadata`                       | Nie      | `Record<string, object>`         | Tanie metadane dostępności dla narzędzi należących do pluginu zadeklarowanych w `contracts.tools`. Użyj ich, gdy narzędzie nie powinno wczytywać środowiska uruchomieniowego, chyba że istnieją dowody konfiguracji, env lub uwierzytelniania. |
| `channelConfigs`                     | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału scalane z powierzchniami wykrywania i walidacji przed wczytaniem środowiska uruchomieniowego.                                                                                    |
| `skills`                             | Nie      | `string[]`                       | Katalogi Skills do wczytania, względne wobec katalogu głównego pluginu.                                                                                                                                                            |
| `name`                               | Nie      | `string`                         | Czytelna dla człowieka nazwa Plugin.                                                                                                                                                                                                |
| `description`                        | Nie      | `string`                         | Krótkie podsumowanie wyświetlane w powierzchniach Plugin.                                                                                                                                                                           |
| `version`                            | Nie      | `string`                         | Informacyjna wersja Plugin.                                                                                                                                                                                                         |
| `uiHints`                            | Nie      | `Record<string, object>`         | Etykiety interfejsu użytkownika, symbole zastępcze i wskazówki dotyczące poufności dla pól konfiguracji.                                                                                                                            |

## Dokumentacja metadanych dostawcy generowania

Pola metadanych dostawcy generowania opisują statyczne sygnały uwierzytelniania dla
dostawców zadeklarowanych na pasującej liście `contracts.*GenerationProviders`.
OpenClaw odczytuje te pola przed załadowaniem środowiska wykonawczego dostawcy, aby narzędzia rdzenia mogły
ustalić, czy dostawca generowania jest dostępny bez importowania każdego
Plugin dostawcy.

Używaj tych pól tylko do tanich, deklaratywnych faktów. Transport, transformacje
żądań, odświeżanie tokenów, walidacja poświadczeń i rzeczywiste zachowanie generowania
pozostają w środowisku wykonawczym Plugin.

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
| `aliases`       | Nie      | `string[]` | Dodatkowe identyfikatory dostawców, które powinny liczyć się jako statyczne aliasy uwierzytelniania dla dostawcy generowania.          |
| `authProviders` | Nie      | `string[]` | Identyfikatory dostawców, których skonfigurowane profile uwierzytelniania powinny liczyć się jako uwierzytelnianie dla tego dostawcy generowania. |
| `configSignals` | Nie      | `object[]` | Tanie sygnały dostępności wyłącznie z konfiguracji dla lokalnych lub samodzielnie hostowanych dostawców, których można skonfigurować bez profili uwierzytelniania ani zmiennych środowiskowych. |
| `authSignals`   | Nie      | `object[]` | Jawne sygnały uwierzytelniania. Gdy są obecne, zastępują domyślny zestaw sygnałów z identyfikatora dostawcy, `aliases` i `authProviders`. |

Każdy wpis `configSignals` obsługuje:

| Pole          | Wymagane | Typ        | Co oznacza                                                                                                                                                                           |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`    | Tak      | `string`   | Ścieżka kropkowa do obiektu konfiguracji należącego do Plugin, który ma zostać sprawdzony, na przykład `plugins.entries.example.config`.                                             |
| `overlayPath` | Nie      | `string`   | Ścieżka kropkowa wewnątrz konfiguracji głównej, której obiekt powinien nałożyć się na obiekt główny przed oceną sygnału. Użyj tego dla konfiguracji specyficznej dla możliwości, takiej jak `image`, `video` lub `music`. |
| `required`    | Nie      | `string[]` | Ścieżki kropkowe wewnątrz konfiguracji efektywnej, które muszą mieć skonfigurowane wartości. Ciągi znaków nie mogą być puste; obiekty i tablice nie mogą być puste.                 |
| `requiredAny` | Nie      | `string[]` | Ścieżki kropkowe wewnątrz konfiguracji efektywnej, z których co najmniej jedna musi mieć skonfigurowaną wartość.                                                                     |
| `mode`        | Nie      | `object`   | Opcjonalna osłona trybu tekstowego wewnątrz konfiguracji efektywnej. Użyj jej, gdy dostępność wyłącznie z konfiguracji dotyczy tylko jednego trybu.                                  |

Każda osłona `mode` obsługuje:

| Pole         | Wymagane | Typ        | Co oznacza                                                                                 |
| ------------ | -------- | ---------- | ------------------------------------------------------------------------------------------ |
| `path`       | Nie      | `string`   | Ścieżka kropkowa wewnątrz konfiguracji efektywnej. Domyślnie `mode`.                       |
| `default`    | Nie      | `string`   | Wartość trybu używana, gdy konfiguracja pomija tę ścieżkę.                                 |
| `allowed`    | Nie      | `string[]` | Jeśli występuje, sygnał przechodzi tylko wtedy, gdy tryb efektywny jest jedną z tych wartości. |
| `disallowed` | Nie      | `string[]` | Jeśli występuje, sygnał kończy się niepowodzeniem, gdy tryb efektywny jest jedną z tych wartości. |

Każdy wpis `authSignals` obsługuje:

| Pole              | Wymagane | Typ      | Co oznacza                                                                                                                                                                 |
| ----------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Tak      | `string` | Identyfikator dostawcy do sprawdzenia w skonfigurowanych profilach uwierzytelniania.                                                                                       |
| `providerBaseUrl` | Nie      | `object` | Opcjonalna osłona, która sprawia, że sygnał liczy się tylko wtedy, gdy wskazany skonfigurowany dostawca używa dozwolonego bazowego adresu URL. Użyj tego, gdy alias uwierzytelniania jest prawidłowy tylko dla określonych API. |

Każda osłona `providerBaseUrl` obsługuje:

| Pole              | Wymagane | Typ        | Co oznacza                                                                                                                                       |
| ----------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Tak      | `string`   | Identyfikator konfiguracji dostawcy, którego `baseUrl` powinien zostać sprawdzony.                                                               |
| `defaultBaseUrl`  | Nie      | `string`   | Bazowy adres URL przyjmowany, gdy konfiguracja dostawcy pomija `baseUrl`.                                                                        |
| `allowedBaseUrls` | Tak      | `string[]` | Dozwolone bazowe adresy URL dla tego sygnału uwierzytelniania. Sygnał jest ignorowany, gdy skonfigurowany lub domyślny bazowy adres URL nie pasuje do jednej z tych znormalizowanych wartości. |

## Dokumentacja metadanych narzędzi

`toolMetadata` używa tych samych kształtów `configSignals` i `authSignals` co
metadane dostawcy generowania, indeksowanych według nazwy narzędzia. `contracts.tools` deklaruje
własność. `toolMetadata` deklaruje tanie dowody dostępności, aby OpenClaw mógł
uniknąć importowania środowiska wykonawczego Plugin tylko po to, by jego fabryka narzędzi zwróciła `null`.

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

Jeśli narzędzie nie ma `toolMetadata`, OpenClaw zachowuje istniejące działanie i
ładuje właścicielski Plugin, gdy kontrakt narzędzia pasuje do polityki. W przypadku narzędzi
na gorącej ścieżce, których fabryka zależy od uwierzytelniania/konfiguracji, autorzy Plugin powinni zadeklarować
`toolMetadata` zamiast zmuszać rdzeń do importowania środowiska wykonawczego w celu zapytania.

## Dokumentacja providerAuthChoices

Każdy wpis `providerAuthChoices` opisuje jedną opcję wdrażania lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem środowiska wykonawczego dostawcy.
Listy konfiguracji dostawcy używają tych opcji z manifestu, opcji konfiguracji
pochodzących z deskryptora oraz metadanych katalogu instalacji bez ładowania środowiska wykonawczego dostawcy.

| Pole                  | Wymagane | Typ                                             | Co oznacza                                                                                              |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ta opcja.                                                     |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której nastąpi wysłanie.                                      |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator opcji uwierzytelniania używany przez przepływy wdrażania i CLI.                  |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli pominięta, OpenClaw używa zastępczo `choiceId`.                |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                  |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości sortują wcześniej w interaktywnych selektorach sterowanych przez asystenta.             |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa opcję przed selektorami asystenta, nadal umożliwiając ręczny wybór w CLI.                        |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory opcji, które powinny przekierowywać użytkowników do tej opcji zastępczej.        |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych opcji.                                         |
| `groupLabel`          | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                            |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                      |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                          |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, taka jak `--openrouter-api-key`.                                                       |
| `cliOption`           | Nie      | `string`                                        | Pełny kształt opcji CLI, taki jak `--openrouter-api-key <key>`.                                         |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                              |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Powierzchnie wdrażania, w których ta opcja powinna się pojawić. Jeśli pominięte, domyślnie `["text-inference"]`. |

## Dokumentacja commandAliases

Użyj `commandAliases`, gdy plugin jest właścicielem nazwy polecenia runtime, którą użytkownicy mogą
omyłkowo umieścić w `plugins.allow` albo spróbować uruchomić jako główne polecenie CLI. OpenClaw
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

| Pole         | Wymagane | Typ               | Co oznacza                                                                    |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należąca do tego pluginu.                                     |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie ukośnika czatu, a nie główne polecenie CLI.      |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI sugerowane dla operacji CLI, jeśli istnieje.   |

## odniesienie activation

Użyj `activation`, gdy plugin może tanio zadeklarować, które zdarzenia płaszczyzny sterowania
powinny uwzględniać go w planie aktywacji/ładowania.

Ten blok to metadane planisty, a nie API cyklu życia. Nie rejestruje
zachowania runtime, nie zastępuje `register(...)` i nie obiecuje, że
kod pluginu został już wykonany. Planista aktywacji używa tych pól do
zawężenia kandydatów na pluginy przed powrotem do istniejących metadanych
własności manifestu, takich jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki.

Preferuj najwęższe metadane, które już opisują własność. Używaj
`providers`, `channels`, `commandAliases`, deskryptorów setupu albo `contracts`,
gdy te pola wyrażają relację. Użyj `activation` dla dodatkowych wskazówek
planisty, których nie da się przedstawić za pomocą tych pól własności.
Używaj najwyższego poziomu `cliBackends` dla aliasów runtime CLI, takich jak `claude-cli`,
`codex-cli` lub `google-gemini-cli`; `activation.onAgentHarnesses` służy tylko do
osadzonych identyfikatorów harnessów agentów, które nie mają już pola własności.

Ten blok jest tylko metadanymi. Nie rejestruje zachowania runtime i nie
zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia runtime/pluginu.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem pluginów, więc
brak niestartowych metadanych aktywacji zwykle kosztuje tylko wydajność; nie
powinien zmieniać poprawności, dopóki nadal istnieją awaryjne mechanizmy własności manifestu.

Każdy plugin powinien celowo ustawić `activation.onStartup`. Ustaw je na `true`
tylko wtedy, gdy plugin musi działać podczas uruchamiania Gateway. Ustaw je na `false`, gdy
plugin jest bezczynny przy starcie i powinien ładować się tylko z węższych wyzwalaczy.
Pominięcie `onStartup` nie ładuje już pluginu niejawnie przy starcie; używaj jawnych
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

| Pole               | Wymagane | Typ                                                  | Co oznacza                                                                                                                                                                                    |
| ------------------ | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nie      | `boolean`                                            | Jawna aktywacja przy starcie Gateway. Każdy plugin powinien to ustawić. `true` importuje plugin podczas startu; `false` utrzymuje leniwe ładowanie przy starcie, chyba że inny dopasowany wyzwalacz wymaga załadowania. |
| `onProviders`      | Nie      | `string[]`                                           | Identyfikatory providerów, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                               |
| `onAgentHarnesses` | Nie      | `string[]`                                           | Identyfikatory runtime osadzonych harnessów agentów, które powinny uwzględniać ten plugin w planach aktywacji/ładowania. Używaj najwyższego poziomu `cliBackends` dla aliasów backendów CLI. |
| `onCommands`       | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                                  |
| `onChannels`       | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                                  |
| `onRoutes`         | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględniać ten plugin w planach aktywacji/ładowania.                                                                                                            |
| `onConfigPaths`    | Nie      | `string[]`                                           | Ścieżki konfiguracji względne względem katalogu głównego, które powinny uwzględniać ten plugin w planach startu/ładowania, gdy ścieżka jest obecna i nie jest jawnie wyłączona.              |
| `onCapabilities`   | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki możliwości używane przez planowanie aktywacji płaszczyzny sterowania. Preferuj węższe pola, gdy to możliwe.                                                               |

Obecni aktywni konsumenci:

- planowanie startu Gateway używa `activation.onStartup` do jawnego importu
  przy starcie
- planowanie CLI wyzwalane poleceniem wraca do starszego
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie startu runtime agenta używa `activation.onAgentHarnesses` dla
  osadzonych harnessów i najwyższego poziomu `cliBackends[]` dla aliasów runtime CLI
- planowanie setupu/kanału wyzwalane kanałem wraca do starszej własności `channels[]`,
  gdy brakuje jawnych metadanych aktywacji kanału
- planowanie pluginów startowych używa `activation.onConfigPaths` dla niekanałowych powierzchni
  konfiguracji głównej, takich jak blok `browser` w dołączonym pluginie przeglądarki
- planowanie setupu/runtime wyzwalane providerem wraca do starszej własności
  `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych
  aktywacji providera

Diagnostyka planisty może odróżniać jawne wskazówki aktywacji od awaryjnej
własności manifestu. Na przykład `activation-command-hint` oznacza, że
dopasowano `activation.onCommands`, a `manifest-command-alias` oznacza, że
planista użył zamiast tego własności `commandAliases`. Te etykiety powodów służą do
diagnostyki hosta i testów; autorzy pluginów powinni nadal deklarować metadane,
które najlepiej opisują własność.

## odniesienie qaRunners

Użyj `qaRunners`, gdy plugin wnosi jeden lub więcej runnerów transportu pod
wspólnym katalogiem głównym `openclaw qa`. Utrzymuj te metadane tanie i statyczne; runtime pluginu
nadal jest właścicielem faktycznej rejestracji CLI przez lekką powierzchnię
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

| Pole          | Wymagane | Typ      | Co oznacza                                                           |
| ------------- | -------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Tak      | `string` | Podpolecenie zamontowane pod `openclaw qa`, na przykład `matrix`.    |
| `description` | Nie      | `string` | Awaryjny tekst pomocy używany, gdy współdzielony host potrzebuje polecenia zastępczego. |

## odniesienie setup

Użyj `setup`, gdy powierzchnie setupu i onboardingu potrzebują tanich metadanych należących do pluginu
przed załadowaniem runtime.

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
wnioskowania CLI. `setup.cliBackends` to specyficzna dla setupu powierzchnia deskryptorów dla
przepływów płaszczyzny sterowania/setupu, które powinny pozostać wyłącznie metadanymi.

Gdy są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania opartą najpierw na deskryptorach dla odkrywania setupu. Jeśli deskryptor tylko
zawęża kandydujący plugin, a setup nadal potrzebuje bogatszych hooków runtime czasu setupu,
ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
awaryjną ścieżkę wykonania.

OpenClaw uwzględnia również `setup.providers[].envVars` w ogólnych wyszukiwaniach uwierzytelniania providerów i
zmiennych środowiskowych. `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności
w okresie wygaszania, ale niedołączone pluginy, które nadal go używają,
otrzymują diagnostykę manifestu. Nowe pluginy powinny umieszczać metadane środowiskowe setupu/statusu
w `setup.providers[].envVars`.

OpenClaw może też wyprowadzać proste wybory setupu z `setup.providers[].authMethods`,
gdy żaden wpis setupu nie jest dostępny albo gdy `setup.requiresRuntime: false`
deklaruje, że runtime setupu nie jest potrzebny. Jawne wpisy `providerAuthChoices` pozostają
preferowane dla niestandardowych etykiet, flag CLI, zakresu onboardingu i metadanych asystenta.

Ustaw `requiresRuntime: false` tylko wtedy, gdy te deskryptory wystarczają dla
powierzchni setupu. OpenClaw traktuje jawne `false` jako kontrakt oparty wyłącznie na deskryptorach
i nie wykona `setup-api` ani `openclaw.setupEntry` dla wyszukiwania setupu. Jeśli
plugin oparty wyłącznie na deskryptorach nadal dostarcza jeden z tych wpisów runtime setupu,
OpenClaw zgłasza diagnostykę addytywną i nadal go ignoruje. Pominięte
`requiresRuntime` zachowuje starsze zachowanie awaryjne, aby istniejące pluginy, które dodały
deskryptory bez tej flagi, nie przestały działać.

Ponieważ wyszukiwanie setupu może wykonywać należący do pluginu kod `setup-api`, znormalizowane
wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne we wszystkich
odkrytych pluginach. Niejednoznaczna własność kończy się odmową zamiast wyboru
zwycięzcy na podstawie kolejności odkrywania.

Gdy runtime setupu zostanie wykonany, diagnostyka rejestru setupu zgłasza rozbieżność deskryptorów,
jeśli `setup-api` rejestruje providera lub backend CLI, którego deskryptory manifestu
nie deklarują, albo jeśli deskryptor nie ma pasującej rejestracji runtime.
Ta diagnostyka jest addytywna i nie odrzuca starszych pluginów.

### odniesienie setup.providers

| Pole           | Wymagane | Typ        | Co oznacza                                                                                         |
| -------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `id`           | Tak      | `string`   | Identyfikator providera udostępniany podczas setupu lub onboardingu. Utrzymuj znormalizowane identyfikatory globalnie unikalne. |
| `authMethods`  | Nie      | `string[]` | Identyfikatory metod setupu/uwierzytelniania obsługiwane przez tego providera bez ładowania pełnego runtime. |
| `envVars`      | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie setupu/statusu mogą sprawdzić przed załadowaniem runtime pluginu. |
| `authEvidence` | Nie      | `object[]` | Tanie lokalne sprawdzenia dowodów uwierzytelniania dla providerów, którzy mogą uwierzytelniać przez niesekretne znaczniki. |

`authEvidence` służy do należących do dostawcy lokalnych znaczników poświadczeń, które można
zweryfikować bez ładowania kodu środowiska wykonawczego. Te sprawdzenia muszą pozostać tanie i lokalne:
bez wywołań sieciowych, bez odczytów z pęku kluczy ani menedżera sekretów, bez poleceń powłoki i bez
sond interfejsu API dostawcy.

Obsługiwane wpisy dowodów:

| Pole               | Wymagane | Typ        | Co oznacza                                                                                                             |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `type`             | Tak      | `string`   | Obecnie `local-file-with-env`.                                                                                         |
| `fileEnvVar`       | Nie      | `string`   | Zmienna środowiskowa zawierająca jawną ścieżkę do pliku poświadczeń.                                                   |
| `fallbackPaths`    | Nie      | `string[]` | Lokalne ścieżki plików poświadczeń sprawdzane, gdy `fileEnvVar` jest nieobecne lub puste. Obsługuje `${HOME}` i `${APPDATA}`. |
| `requiresAnyEnv`   | Nie      | `string[]` | Co najmniej jedna z wymienionych zmiennych środowiskowych musi być niepusta, zanim dowód będzie prawidłowy.             |
| `requiresAllEnv`   | Nie      | `string[]` | Każda z wymienionych zmiennych środowiskowych musi być niepusta, zanim dowód będzie prawidłowy.                         |
| `credentialMarker` | Tak      | `string`   | Niejawny względem sekretów znacznik zwracany, gdy dowód jest obecny.                                                    |
| `source`           | Nie      | `string`   | Etykieta źródła widoczna dla użytkownika w wyjściu uwierzytelniania/statusu.                                           |

### pola setup

| Pole               | Wymagane | Typ        | Co oznacza                                                                                                 |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji dostawców udostępniane podczas konfiguracji i onboardingu.                         |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów czasu konfiguracji używane do wyszukiwania konfiguracji najpierw po deskryptorze. Utrzymuj znormalizowane identyfikatory globalnie unikatowe. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego pluginu.                     |
| `requiresRuntime`  | Nie      | `boolean`  | Czy konfiguracja nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                              |

## dokumentacja uiHints

`uiHints` to mapa z nazw pól konfiguracji na małe wskazówki renderowania.

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

| Pole          | Typ        | Co oznacza                                      |
| ------------- | ---------- | ----------------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.         |
| `help`        | `string`   | Krótki tekst pomocniczy.                        |
| `tags`        | `string[]` | Opcjonalne tagi UI.                             |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.                 |
| `sensitive`   | `boolean`  | Oznacza pole jako tajne lub wrażliwe.           |
| `placeholder` | `string`   | Tekst zastępczy dla pól formularza.             |

## dokumentacja contracts

Używaj `contracts` tylko do statycznych metadanych własności możliwości, które OpenClaw może
odczytać bez importowania środowiska wykonawczego pluginu.

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

| Pole                             | Typ        | Co oznacza                                                                      |
| -------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory fabryk rozszerzeń serwera aplikacji Codex, obecnie `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identyfikatory środowiska wykonawczego, dla których pakietowany plugin może rejestrować middleware wyników narzędzi. |
| `externalAuthProviders`          | `string[]` | Identyfikatory dostawców, których hook zewnętrznego profilu uwierzytelniania należy do tego pluginu. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należące do tego pluginu.                          |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należące do tego pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należące do tego pluginu.   |
| `memoryEmbeddingProviders`       | `string[]` | Identyfikatory dostawców osadzania pamięci należące do tego pluginu.             |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia mediów należące do tego pluginu.             |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należące do tego pluginu.           |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należące do tego pluginu.             |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania z sieci należące do tego pluginu.            |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania w sieci należące do tego pluginu.          |
| `migrationProviders`             | `string[]` | Identyfikatory dostawców importu należące do tego pluginu dla `openclaw migrate`. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego pluginu.                                |

`contracts.embeddedExtensionFactories` jest zachowane dla pakietowanych fabryk rozszerzeń
działających wyłącznie w serwerze aplikacji Codex. Pakietowane transformacje wyników narzędzi powinny
zamiast tego deklarować `contracts.agentToolResultMiddleware` i rejestrować się przez
`api.registerAgentToolResultMiddleware(...)`. Zewnętrzne pluginy nie mogą
rejestrować middleware wyników narzędzi, ponieważ ta granica może przepisać wynik narzędzia o wysokim zaufaniu,
zanim zobaczy go model.

Rejestracje środowiska wykonawczego `api.registerTool(...)` muszą odpowiadać `contracts.tools`.
Wykrywanie narzędzi używa tej listy, aby ładować tylko środowiska wykonawcze pluginów, które mogą być właścicielami
żądanych narzędzi.

Pluginy dostawców implementujące `resolveExternalAuthProfiles` powinny deklarować
`contracts.externalAuthProviders`. Pluginy bez tej deklaracji nadal przechodzą
przez przestarzałą ścieżkę zgodności, ale ta ścieżka jest wolniejsza i
zostanie usunięta po oknie migracji.

Pakietowani dostawcy osadzania pamięci powinni deklarować
`contracts.memoryEmbeddingProviders` dla każdego udostępnianego identyfikatora adaptera, w tym
wbudowanych adapterów, takich jak `local`. Samodzielne ścieżki CLI używają tego kontraktu manifestu,
aby załadować tylko plugin właściciela, zanim pełne środowisko wykonawcze Gateway
zarejestruje dostawców.

## dokumentacja mediaUnderstandingProviderMetadata

Używaj `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia mediów ma
modele domyślne, priorytet awaryjnego automatycznego uwierzytelniania lub natywną obsługę dokumentów, których
ogólne pomocniki core potrzebują przed załadowaniem środowiska wykonawczego. Klucze muszą też być zadeklarowane w
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

| Pole                   | Typ                                 | Co oznacza                                                                      |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Możliwości medialne udostępniane przez tego dostawcę.                            |
| `defaultModels`        | `Record<string, string>`            | Domyślne mapowania możliwości na model używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby sortują wcześniej dla automatycznej ścieżki awaryjnej dostawcy opartej na poświadczeniach. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez dostawcę.                           |

## dokumentacja channelConfigs

Używaj `channelConfigs`, gdy plugin kanału potrzebuje tanich metadanych konfiguracji przed
załadowaniem środowiska wykonawczego. Wykrywanie konfiguracji/statusu kanału tylko do odczytu może używać tych metadanych
bezpośrednio dla skonfigurowanych kanałów zewnętrznych, gdy nie ma dostępnego wpisu konfiguracji, lub
gdy `setup.requiresRuntime: false` deklaruje, że środowisko wykonawcze konfiguracji nie jest potrzebne.

`channelConfigs` to metadane manifestu pluginu, a nie nowa sekcja konfiguracji użytkownika najwyższego poziomu.
Użytkownicy nadal konfigurują instancje kanałów w `channels.<channel-id>`.
OpenClaw odczytuje metadane manifestu, aby zdecydować, który plugin jest właścicielem skonfigurowanego
kanału, zanim wykona się kod środowiska wykonawczego pluginu.

Dla pluginu kanału `configSchema` i `channelConfigs` opisują różne
ścieżki:

- `configSchema` waliduje `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` waliduje `channels.<channel-id>`

Niepakietowane pluginy deklarujące `channels[]` powinny też deklarować odpowiadające
wpisy `channelConfigs`. Bez nich OpenClaw nadal może załadować plugin, ale
zimna ścieżka schematu konfiguracji, konfiguracji i powierzchni Control UI nie może znać
kształtu opcji należących do kanału, dopóki nie wykona się środowisko wykonawcze pluginu.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` i
`nativeSkillsAutoEnabled` mogą deklarować statyczne wartości domyślne `auto` dla sprawdzeń konfiguracji poleceń,
które działają przed załadowaniem środowiska wykonawczego kanału. Pakietowane kanały mogą też publikować
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

| Pole          | Typ                      | Co oznacza                                                                                                 |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału.           |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety/interpolacje/wskazówki poufności UI dla tej sekcji konfiguracji kanału.                |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami wyboru i inspekcji, gdy metadane runtime nie są gotowe.           |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                                   |
| `commands`    | `object`                 | Statyczne polecenie natywne i automatyczne wartości domyślne natywnej umiejętności do kontroli konfiguracji przed runtime. |
| `preferOver`  | `string[]`               | Identyfikatory starszych Pluginów lub Pluginów o niższym priorytecie, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

### Zastępowanie innego Pluginu kanału

Użyj `preferOver`, gdy Twój Plugin jest preferowanym właścicielem identyfikatora kanału, który
może też zapewniać inny Plugin. Typowe przypadki to zmieniony identyfikator Pluginu,
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

Gdy `channels.chat` jest skonfigurowane, OpenClaw uwzględnia zarówno identyfikator kanału, jak i
identyfikator preferowanego Pluginu. Jeśli Plugin o niższym priorytecie został wybrany tylko dlatego,
że jest dołączony albo domyślnie włączony, OpenClaw wyłącza go w efektywnej
konfiguracji runtime, aby jeden Plugin był właścicielem kanału i jego narzędzi. Jawny wybór użytkownika
nadal ma pierwszeństwo: jeśli użytkownik jawnie włączy oba Pluginy, OpenClaw
zachowuje ten wybór i zgłasza diagnostykę zduplikowanych kanałów/narzędzi zamiast
po cichu zmieniać żądany zestaw Pluginów.

Ogranicz `preferOver` do identyfikatorów Pluginów, które rzeczywiście mogą zapewnić ten sam kanał.
Nie jest to ogólne pole priorytetu i nie zmienia nazw kluczy konfiguracji użytkownika.

## Informacje referencyjne `modelSupport`

Użyj `modelSupport`, gdy OpenClaw powinien wywnioskować Twój Plugin dostawcy z
krótkich identyfikatorów modeli, takich jak `gpt-5.5` lub `claude-sonnet-4.6`, zanim załaduje się runtime Pluginu.

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
- jeśli pasują zarówno jeden niedołączony Plugin, jak i jeden dołączony Plugin, wygrywa
  niedołączony Plugin
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Co oznacza                                                                        |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do krótkich identyfikatorów modeli.      |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do krótkich identyfikatorów modeli po usunięciu sufiksu profilu. |

## Informacje referencyjne `modelCatalog`

Użyj `modelCatalog`, gdy OpenClaw powinien znać metadane modeli dostawcy przed
załadowaniem runtime Pluginu. To należące do manifestu źródło dla stałych wierszy
katalogu, aliasów dostawców, reguł ukrywania i trybu wykrywania. Odświeżanie runtime
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

| Pole           | Typ                                                      | Co oznacza                                                                                                  |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Wiersze katalogu dla identyfikatorów dostawców należących do tego Pluginu. Klucze powinny też występować w najwyższym poziomie `providers`. |
| `aliases`      | `Record<string, object>`                                 | Aliasy dostawców, które powinny rozwiązywać się do posiadanego dostawcy na potrzeby planowania katalogu lub ukrywania. |
| `suppressions` | `object[]`                                               | Wiersze modeli z innego źródła, które ten Plugin ukrywa z powodu specyficznego dla dostawcy.                |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Czy katalog dostawcy można odczytać z metadanych manifestu, odświeżyć do cache, czy wymaga runtime.         |

`aliases` uczestniczy w wyszukiwaniu własności dostawcy na potrzeby planowania katalogu modeli.
Cele aliasów muszą być dostawcami najwyższego poziomu należącymi do tego samego Pluginu. Gdy
lista filtrowana według dostawcy używa aliasu, OpenClaw może odczytać manifest właściciela i
zastosować nadpisania API/podstawowego URL aliasu bez ładowania runtime dostawcy.
Aliasy nie rozwijają niefiltrowanych list katalogu; szerokie listy emitują tylko
wiersze kanonicznego dostawcy właściciela.

`suppressions` zastępuje stary hook runtime dostawcy `suppressBuiltInModel`.
Wpisy ukrywania są respektowane tylko wtedy, gdy dostawca należy do Pluginu albo
jest zadeklarowany jako klucz `modelCatalog.aliases` wskazujący na posiadanego dostawcę. Hooki runtime
do ukrywania nie są już wywoływane podczas rozwiązywania modeli.

Pola dostawcy:

| Pole      | Typ                      | Co oznacza                                                           |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Opcjonalny domyślny podstawowy URL dla modeli w tym katalogu dostawcy. |
| `api`     | `ModelApi`               | Opcjonalny domyślny adapter API dla modeli w tym katalogu dostawcy.  |
| `headers` | `Record<string, string>` | Opcjonalne statyczne nagłówki stosowane do tego katalogu dostawcy.   |
| `models`  | `object[]`               | Wymagane wiersze modeli. Wiersze bez `id` są ignorowane.             |

Pola modelu:

| Pole            | Typ                                                            | Co oznacza                                                                     |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id`            | `string`                                                       | Lokalny dla dostawcy identyfikator modelu, bez prefiksu `provider/`.           |
| `name`          | `string`                                                       | Opcjonalna nazwa wyświetlana.                                                  |
| `api`           | `ModelApi`                                                     | Opcjonalne nadpisanie API dla modelu.                                          |
| `baseUrl`       | `string`                                                       | Opcjonalne nadpisanie podstawowego URL dla modelu.                             |
| `headers`       | `Record<string, string>`                                       | Opcjonalne statyczne nagłówki dla modelu.                                      |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalności akceptowane przez model.                                            |
| `reasoning`     | `boolean`                                                      | Czy model udostępnia zachowanie rozumowania.                                   |
| `contextWindow` | `number`                                                       | Natywne okno kontekstu dostawcy.                                               |
| `contextTokens` | `number`                                                       | Opcjonalny efektywny limit kontekstu runtime, gdy różni się od `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maksymalna liczba tokenów wyjściowych, jeśli jest znana.                       |
| `cost`          | `object`                                                       | Opcjonalne ceny w USD za milion tokenów, w tym opcjonalne `tieredPricing`.     |
| `compat`        | `object`                                                       | Opcjonalne flagi zgodności odpowiadające zgodności konfiguracji modeli OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status listowania. Ukrywaj tylko wtedy, gdy wiersz w ogóle nie może się pojawić. |
| `statusReason`  | `string`                                                       | Opcjonalny powód wyświetlany przy statusie innym niż dostępny.                 |
| `replaces`      | `string[]`                                                     | Starsze lokalne dla dostawcy identyfikatory modeli, które ten model zastępuje. |
| `replacedBy`    | `string`                                                       | Lokalny dla dostawcy identyfikator modelu zastępczego dla przestarzałych wierszy. |
| `tags`          | `string[]`                                                     | Stabilne tagi używane przez selektory i filtry.                                |

Pola ukrywania:

| Pole                       | Typ        | Co oznacza                                                                                                 |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identyfikator dostawcy dla wiersza nadrzędnego do ukrycia. Musi należeć do tego Pluginu albo być zadeklarowany jako posiadany alias. |
| `model`                    | `string`   | Lokalny dla dostawcy identyfikator modelu do ukrycia.                                                      |
| `reason`                   | `string`   | Opcjonalny komunikat wyświetlany, gdy ukryty wiersz jest żądany bezpośrednio.                              |
| `when.baseUrlHosts`        | `string[]` | Opcjonalna lista efektywnych hostów podstawowego URL dostawcy wymaganych, zanim ukrywanie zostanie zastosowane. |
| `when.providerConfigApiIn` | `string[]` | Opcjonalna lista dokładnych wartości `api` konfiguracji dostawcy wymaganych, zanim ukrywanie zostanie zastosowane. |

Nie umieszczaj danych dostępnych tylko w czasie wykonywania w `modelCatalog`. Używaj `static` tylko wtedy, gdy wiersze manifestu są wystarczająco kompletne, aby powierzchnie list filtrowanych według dostawcy i wyboru mogły pominąć wykrywanie przez rejestr/czas wykonywania. Używaj `refreshable`, gdy wiersze manifestu są użytecznymi listowalnymi zalążkami lub uzupełnieniami, ale odświeżenie/pamięć podręczna może dodać więcej wierszy później; wiersze odświeżalne same w sobie nie są autorytatywne. Używaj `runtime`, gdy OpenClaw musi załadować środowisko wykonawcze dostawcy, aby poznać listę.

## Odniesienie `modelIdNormalization`

Używaj `modelIdNormalization` do taniego czyszczenia identyfikatorów modeli, którego właścicielem jest dostawca i które musi nastąpić przed załadowaniem środowiska wykonawczego dostawcy. Dzięki temu aliasy, takie jak krótkie nazwy modeli, lokalne dla dostawcy starsze identyfikatory i reguły prefiksów proxy, pozostają w manifeście pluginu właściciela zamiast w tabelach wyboru modeli rdzenia.

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

| Pole                                 | Typ                     | Co oznacza                                                                                         |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Dokładne aliasy identyfikatorów modeli bez rozróżniania wielkości liter. Wartości są zwracane w zapisanej postaci. |
| `stripPrefixes`                      | `string[]`              | Prefiksy do usunięcia przed wyszukaniem aliasu, przydatne przy starszej duplikacji dostawca/model. |
| `prefixWhenBare`                     | `string`                | Prefiks do dodania, gdy znormalizowany identyfikator modelu nie zawiera jeszcze `/`.               |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Warunkowe reguły prefiksu dla prostego identyfikatora po wyszukaniu aliasu, kluczowane przez `modelPrefix` i `prefix`. |

## Odniesienie `providerEndpoints`

Używaj `providerEndpoints` do klasyfikacji punktów końcowych, którą ogólna polityka żądań musi znać przed załadowaniem środowiska wykonawczego dostawcy. Rdzeń nadal jest właścicielem znaczenia każdego `endpointClass`; manifesty pluginów są właścicielami metadanych hosta i bazowego URL.

Pola punktu końcowego:

| Pole                           | Typ        | Co oznacza                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Znana klasa punktu końcowego rdzenia, taka jak `openrouter`, `moonshot-native` lub `google-vertex`.  |
| `hosts`                        | `string[]` | Dokładne nazwy hostów mapowane na klasę punktu końcowego.                                            |
| `hostSuffixes`                 | `string[]` | Sufiksy hostów mapowane na klasę punktu końcowego. Poprzedź `.` w celu dopasowania wyłącznie sufiksu domeny. |
| `baseUrls`                     | `string[]` | Dokładne znormalizowane bazowe adresy URL HTTP(S) mapowane na klasę punktu końcowego.                |
| `googleVertexRegion`           | `string`   | Statyczny region Google Vertex dla dokładnych hostów globalnych.                                     |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks do usunięcia z dopasowanych hostów, aby odsłonić prefiks regionu Google Vertex.               |

## Odniesienie `providerRequest`

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

| Pole                  | Typ          | Co oznacza                                                                                  |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etykieta rodziny dostawcy używana przez ogólne decyzje zgodności żądań i diagnostykę.       |
| `compatibilityFamily` | `"moonshot"` | Opcjonalny koszyk zgodności rodziny dostawców dla współdzielonych helperów żądań.           |
| `openAICompletions`   | `object`     | Flagi żądań uzupełnień zgodnych z OpenAI, obecnie `supportsStreamingUsage`.                 |

## Odniesienie `modelPricing`

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

| Pole         | Typ               | Co oznacza                                                                                          |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Ustaw `false` dla lokalnych/samodzielnie hostowanych dostawców, którzy nigdy nie powinni pobierać cen OpenRouter ani LiteLLM. |
| `openRouter` | `false \| object` | Mapowanie wyszukiwania cen OpenRouter. `false` wyłącza wyszukiwanie OpenRouter dla tego dostawcy.   |
| `liteLLM`    | `false \| object` | Mapowanie wyszukiwania cen LiteLLM. `false` wyłącza wyszukiwanie LiteLLM dla tego dostawcy.         |

Pola źródła:

| Pole                       | Typ                | Co oznacza                                                                                                            |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identyfikator dostawcy zewnętrznego katalogu, gdy różni się od identyfikatora dostawcy OpenClaw, na przykład `z-ai` dla dostawcy `zai`. |
| `passthroughProviderModel` | `boolean`          | Traktuje identyfikatory modeli zawierające ukośnik jako zagnieżdżone odwołania dostawca/model, przydatne dla dostawców proxy, takich jak OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Dodatkowe warianty identyfikatorów modeli w zewnętrznym katalogu. `version-dots` próbuje identyfikatorów wersji z kropkami, takich jak `claude-opus-4.6`. |

### Indeks dostawców OpenClaw

Indeks dostawców OpenClaw to należące do OpenClaw metadane podglądu dla dostawców, których pluginy mogą jeszcze nie być zainstalowane. Nie jest częścią manifestu pluginu. Manifesty pluginów pozostają autorytetem zainstalowanego pluginu. Indeks dostawców to wewnętrzny kontrakt awaryjny, z którego przyszłe powierzchnie instalowalnych dostawców i przedinstalacyjnego wyboru modeli będą korzystać, gdy plugin dostawcy nie jest zainstalowany.

Kolejność autorytatywności katalogu:

1. Konfiguracja użytkownika.
2. Manifest zainstalowanego pluginu `modelCatalog`.
3. Pamięć podręczna katalogu modeli z jawnego odświeżenia.
4. Wiersze podglądu indeksu dostawców OpenClaw.

Indeks dostawców nie może zawierać sekretów, stanu włączenia, haków środowiska wykonawczego ani aktywnych danych modeli specyficznych dla konta. Jego katalogi podglądu używają tego samego kształtu wiersza dostawcy `modelCatalog` co manifesty pluginów, ale powinny pozostać ograniczone do stabilnych metadanych wyświetlania, chyba że pola adaptera środowiska wykonawczego, takie jak `api`, `baseUrl`, ceny lub flagi zgodności, są celowo utrzymywane w zgodności z manifestem zainstalowanego pluginu. Dostawcy z aktywnym wykrywaniem `/models` powinni zapisywać odświeżone wiersze przez jawną ścieżkę pamięci podręcznej katalogu modeli zamiast wywoływać API dostawcy podczas zwykłego listowania lub wdrażania.

Wpisy indeksu dostawców mogą także zawierać metadane instalowalnego pluginu dla dostawców, których plugin został przeniesiony poza rdzeń lub z innego powodu nie jest jeszcze zainstalowany. Te metadane odzwierciedlają wzorzec katalogu kanałów: nazwa pakietu, specyfikacja instalacji npm, oczekiwana integralność i tanie etykiety wyboru uwierzytelniania wystarczą, aby pokazać instalowalną opcję konfiguracji. Po zainstalowaniu pluginu wygrywa jego manifest, a wpis indeksu dostawców jest ignorowany dla tego dostawcy.

Starsze klucze możliwości najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby przenieść `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` i `webSearchProviders` pod `contracts`; zwykłe ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako własności możliwości.

## Manifest a package.json

Te dwa pliki służą różnym celom:

| Plik                   | Używaj go do                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Wykrywanie, walidacja konfiguracji, metadane wyboru uwierzytelniania i wskazówki UI, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadane npm, instalacja zależności i blok `openclaw` używany dla punktów wejścia, bramek instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie należy umieścić fragment metadanych, użyj tej reguły:

- jeśli OpenClaw musi to znać przed załadowaniem kodu pluginu, umieść to w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść to w `package.json`

### Pola package.json wpływające na wykrywanie

Niektóre metadane pluginu sprzed uruchomienia środowiska wykonawczego celowo znajdują się w `package.json` w bloku `openclaw` zamiast w `openclaw.plugin.json`.
`openclaw.bundle` i `openclaw.bundle.json` nie są kontraktami pluginów OpenClaw; natywne pluginy muszą używać `openclaw.plugin.json` oraz obsługiwanych pól `package.json#openclaw` poniżej.

Ważne przykłady:

| Pole                                                                                       | Co oznacza                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Deklaruje natywne punkty wejścia pluginu. Musi pozostać wewnątrz katalogu pakietu pluginu.                                                                                                |
| `openclaw.runtimeExtensions`                                                               | Deklaruje zbudowane punkty wejścia środowiska uruchomieniowego JavaScript dla zainstalowanych pakietów. Musi pozostać wewnątrz katalogu pakietu pluginu.                                  |
| `openclaw.setupEntry`                                                                      | Lekki punkt wejścia tylko do konfiguracji, używany podczas onboardingu, odroczonego uruchamiania kanału oraz odkrywania statusu kanału tylko do odczytu/SecretRef. Musi pozostać wewnątrz katalogu pakietu pluginu. |
| `openclaw.runtimeSetupEntry`                                                               | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Wymaga `setupEntry`, musi istnieć i musi pozostać wewnątrz katalogu pakietu pluginu.              |
| `openclaw.channel`                                                                         | Tanie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                                                                         |
| `openclaw.channel.commands`                                                                | Statyczne metadane natywnych poleceń i automatycznych domyślnych wartości natywnych Skills, używane przez konfigurację, audyt i powierzchnie list poleceń przed załadowaniem środowiska uruchomieniowego kanału. |
| `openclaw.channel.configuredState`                                                         | Lekkie metadane sprawdzania stanu skonfigurowania, które mogą odpowiedzieć „czy konfiguracja oparta tylko na env już istnieje?” bez ładowania pełnego środowiska uruchomieniowego kanału. |
| `openclaw.channel.persistedAuthState`                                                      | Lekkie metadane sprawdzania utrwalonego uwierzytelnienia, które mogą odpowiedzieć „czy cokolwiek jest już zalogowane?” bez ładowania pełnego środowiska uruchomieniowego kanału.          |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Wskazówki instalacji/aktualizacji dla pluginów dołączonych i publikowanych zewnętrznie.                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                              |
| `openclaw.install.minHostVersion`                                                          | Minimalna obsługiwana wersja hosta OpenClaw, używająca dolnej granicy semver, takiej jak `>=2026.3.22` lub `>=2026.5.1-beta.1`.                                                           |
| `openclaw.install.expectedIntegrity`                                                       | Oczekiwany ciąg integralności npm dist, taki jak `sha512-...`; przepływy instalacji i aktualizacji weryfikują pobrany artefakt względem tej wartości.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Zezwala na wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego pluginu, gdy konfiguracja jest nieprawidłowa.                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Pozwala załadować powierzchnie kanału tylko do konfiguracji przed pełnym pluginem kanału podczas uruchamiania.                                                                             |

Metadane manifestu decydują, które wybory dostawcy/kanału/konfiguracji pojawiają się w
onboardingu przed załadowaniem środowiska uruchomieniowego. `package.json#openclaw.install` mówi
onboardingowi, jak pobrać lub włączyć ten plugin, gdy użytkownik wybierze jedną z tych
opcji. Nie przenoś wskazówek instalacji do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania
rejestru manifestów dla źródeł pluginów niedołączonych. Nieprawidłowe wartości są odrzucane;
nowsze, ale poprawne wartości pomijają zewnętrzne pluginy na starszych hostach. Dołączone źródłowe
pluginy są uznawane za współwersjonowane z checkoutem hosta.

Oficjalne metadane instalacji na żądanie powinny używać `clawhubSpec`, gdy plugin jest
opublikowany w ClawHub; onboarding traktuje to jako preferowane źródło zdalne i
zapisuje fakty artefaktu ClawHub po instalacji. `npmSpec` pozostaje zgodnościowym
fallbackiem dla pakietów, które jeszcze nie zostały przeniesione do ClawHub.

Dokładne przypięcie wersji npm już znajduje się w `npmSpec`, na przykład
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne zewnętrzne wpisy katalogu
powinny łączyć dokładne specyfikacje z `expectedIntegrity`, aby przepływy aktualizacji kończyły się
bezpieczną odmową, jeśli pobrany artefakt npm nie pasuje już do przypiętego wydania.
Interaktywny onboarding nadal oferuje zaufane specyfikacje npm z rejestru, w tym same
nazwy pakietów i dist-tagi, dla zgodności. Diagnostyka katalogu potrafi
rozróżnić źródła dokładne, pływające, przypięte integralnością, z brakującą integralnością, z
niedopasowaniem nazwy pakietu i z nieprawidłowym wyborem domyślnym. Ostrzega też, gdy
`expectedIntegrity` jest obecne, ale nie ma poprawnego źródła npm, do którego można je przypiąć.
Gdy `expectedIntegrity` jest obecne,
przepływy instalacji/aktualizacji je egzekwują; gdy jest pominięte, rozwiązanie rejestru jest
zapisywane bez przypięcia integralności.

Pluginy kanałów powinny dostarczać `openclaw.setupEntry`, gdy skany statusu, listy kanałów
lub SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego
środowiska uruchomieniowego. Punkt wejścia konfiguracji powinien udostępniać metadane kanału oraz bezpieczne dla konfiguracji adaptery
konfiguracji, statusu i sekretów; klientów sieciowych, listenery Gateway i
środowiska uruchomieniowe transportu trzymaj w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia środowiska uruchomieniowego nie zastępują kontroli granic pakietu dla pól
źródłowych punktów wejścia. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że
uciekająca ścieżka `openclaw.extensions` stanie się ładowalna.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie sprawia,
że dowolne uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala przepływom instalacji
odzyskać stan tylko po konkretnych przestarzałych błędach aktualizacji dołączonego pluginu, takich jak
brakująca ścieżka dołączonego pluginu lub przestarzały wpis `channels.<id>` dla tego samego
dołączonego pluginu. Niepowiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
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

Używaj ich, gdy przepływy konfiguracji, doctor, statusu lub obecności tylko do odczytu potrzebują taniego
sondowania uwierzytelnienia tak/nie przed załadowaniem pełnego pluginu kanału. Utrwalony stan uwierzytelnienia nie jest
skonfigurowanym stanem kanału: nie używaj tych metadanych do automatycznego włączania pluginów,
naprawiania zależności środowiska uruchomieniowego ani decydowania, czy środowisko uruchomieniowe kanału powinno się załadować.
Docelowy eksport powinien być małą funkcją, która czyta tylko utrwalony stan; nie
kieruj go przez pełny barrel środowiska uruchomieniowego kanału.

`openclaw.channel.configuredState` ma taki sam kształt dla tanich sprawdzeń skonfigurowania
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

Używaj go, gdy kanał może odpowiedzieć o stanie skonfigurowania na podstawie env lub innych małych
wejść niebędących środowiskiem uruchomieniowym. Jeśli sprawdzenie wymaga pełnego rozwiązywania konfiguracji lub rzeczywistego
środowiska uruchomieniowego kanału, trzymaj tę logikę zamiast tego w hooku pluginu `config.hasConfiguredState`.

## Pierwszeństwo odkrywania (zduplikowane identyfikatory pluginów)

OpenClaw odkrywa pluginy z kilku katalogów głównych (dołączone, instalacja globalna, workspace, jawne ścieżki wybrane w konfiguracji). Jeśli dwa odkrycia mają ten sam `id`, zachowywany jest tylko manifest o **najwyższym priorytecie**; duplikaty o niższym priorytecie są odrzucane zamiast ładowania obok niego.

Pierwszeństwo, od najwyższego do najniższego:

1. **Wybrane w konfiguracji** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Dołączone** — pluginy dostarczane z OpenClaw
3. **Instalacja globalna** — pluginy zainstalowane w globalnym katalogu głównym pluginów OpenClaw
4. **Workspace** — pluginy odkryte względem bieżącego workspace

Skutki:

- Fork lub przestarzała kopia dołączonego pluginu znajdująca się w workspace nie przesłoni dołączonej kompilacji.
- Aby faktycznie zastąpić dołączony plugin lokalnym, przypnij go przez `plugins.entries.<id>`, aby wygrał dzięki pierwszeństwu zamiast polegać na odkrywaniu workspace.
- Odrzucenia duplikatów są logowane, aby diagnostyka Doctor i uruchamiania mogła wskazać odrzuconą kopię.
- Nadpisania duplikatów wybranych w konfiguracji są w diagnostyce opisywane jako jawne nadpisania, ale nadal ostrzegają, aby przestarzałe forki i przypadkowe przesłonięcia pozostały widoczne.

## Wymagania JSON Schema

- **Każdy plugin musi dostarczać JSON Schema**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w środowisku uruchomieniowym.
- Podczas rozszerzania lub forkowania dołączonego pluginu o nowe klucze konfiguracji, zaktualizuj jednocześnie `configSchema` w `openclaw.plugin.json` tego pluginu. Schematy dołączonych pluginów są restrykcyjne, więc dodanie `plugins.entries.<id>.config.myNewKey` w konfiguracji użytkownika bez dodania `myNewKey` do `configSchema.properties` zostanie odrzucone przed załadowaniem środowiska uruchomieniowego pluginu.

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
  muszą odwoływać się do **odkrywalnych** identyfikatorów pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja jest zachowywana, a
  **ostrzeżenie** jest pokazywane w Doctor + logach.

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration), aby poznać pełny schemat `plugins.*`.

## Notatki

- Manifest jest **wymagany dla natywnych Plugin OpenClaw**, w tym dla ładowania z lokalnego systemu plików. Środowisko uruchomieniowe nadal ładuje moduł Plugin osobno; manifest służy tylko do odkrywania i walidacji.
- Natywne manifesty są parsowane za pomocą JSON5, więc komentarze, końcowe przecinki i klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestów odczytuje tylko udokumentowane pola manifestu. Unikaj niestandardowych kluczy najwyższego poziomu.
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy Plugin ich nie potrzebuje.
- `providerDiscoveryEntry` musi pozostać lekki i nie powinien importować rozbudowanego kodu środowiska uruchomieniowego; używaj go do statycznych metadanych katalogu dostawców lub wąskich deskryptorów odkrywania, a nie do wykonywania w czasie obsługi żądania.
- Wyłączne rodzaje Plugin są wybierane przez `plugins.slots.*`: `kind: "memory"` przez `plugins.slots.memory`, `kind: "context-engine"` przez `plugins.slots.contextEngine` (domyślnie `legacy`).
- Zadeklaruj wyłączny rodzaj Plugin w tym manifeście. `OpenClawPluginDefinition.kind` z punktu wejścia środowiska uruchomieniowego jest przestarzałe i pozostaje tylko jako zgodnościowe rozwiązanie awaryjne dla starszych Plugin.
- Metadane zmiennych środowiskowych (`setup.providers[].envVars`, przestarzałe `providerAuthEnvVars` i `channelEnvVars`) są wyłącznie deklaratywne. Status, audyt, walidacja dostarczania Cron i inne powierzchnie tylko do odczytu nadal stosują zaufanie do Plugin oraz efektywną politykę aktywacji, zanim potraktują zmienną środowiskową jako skonfigurowaną.
- Metadane kreatora środowiska uruchomieniowego wymagające kodu dostawcy opisano w sekcji [hooki środowiska uruchomieniowego dostawcy](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli Twój Plugin zależy od modułów natywnych, udokumentuj kroki budowania i wszelkie wymagania dotyczące listy dozwolonych elementów menedżera pakietów (na przykład pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Powiązane

<CardGroup cols={3}>
  <Card title="Tworzenie Plugin" href="/pl/plugins/building-plugins" icon="rocket">
    Pierwsze kroki z Plugin.
  </Card>
  <Card title="Architektura Plugin" href="/pl/plugins/architecture" icon="diagram-project">
    Architektura wewnętrzna i model możliwości.
  </Card>
  <Card title="Przegląd SDK" href="/pl/plugins/sdk-overview" icon="book">
    Dokumentacja SDK Plugin i importy podścieżek.
  </Card>
</CardGroup>
