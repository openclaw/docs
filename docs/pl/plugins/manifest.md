---
read_when:
    - Tworzysz Plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji Plugin lub diagnozować błędy walidacji Plugin
summary: Wymagania dotyczące manifestu Plugin + schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-05-02T09:57:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9cb6eff8d35cbd819178be9885801e2b84ad29cd12bbfd2f630467914366e4
    source_path: plugins/manifest.md
    workflow: 16
---

Ta strona dotyczy wyłącznie **natywnego manifestu Plugin OpenClaw**.

Zgodne układy pakietów opisano w [Pakiety Plugin](/pl/plugins/bundles).

Zgodne formaty pakietów używają innych plików manifestu:

- Pakiet Codex: `.codex-plugin/plugin.json`
- Pakiet Claude: `.claude-plugin/plugin.json` albo domyślny układ komponentów Claude
  bez manifestu
- Pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa również te układy pakietów, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych pakietów OpenClaw obecnie odczytuje metadane pakietu oraz zadeklarowane
katalogi główne Skills, katalogi główne poleceń Claude, domyślne wartości `settings.json`
pakietu Claude, domyślne wartości LSP pakietu Claude oraz obsługiwane pakiety hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym Plugin**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Plugin**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Plugin i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Plugin: [Plugins](/pl/tools/plugin).
Natywny model możliwości i aktualne wskazówki dotyczące kompatybilności zewnętrznej:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Co robi ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje **zanim załaduje kod
Plugin**. Wszystko poniżej musi być wystarczająco lekkie do sprawdzenia bez uruchamiania
środowiska uruchomieniowego Plugin.

**Używaj go do:**

- tożsamości Plugin, walidacji konfiguracji i wskazówek interfejsu konfiguracji
- metadanych uwierzytelniania, onboardingu i konfiguracji początkowej (alias, automatyczne włączanie, zmienne środowiskowe dostawcy, wybory uwierzytelniania)
- wskazówek aktywacji dla powierzchni płaszczyzny sterowania
- skróconej własności rodziny modeli
- statycznych migawek własności możliwości (`contracts`)
- metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzić
- metadanych konfiguracji specyficznych dla kanału, scalanych z powierzchniami katalogu i walidacji

**Nie używaj go do:** rejestrowania zachowania środowiska uruchomieniowego, deklarowania punktów wejścia kodu
ani metadanych instalacji npm. One należą do kodu Plugin i `package.json`.

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

## Dokumentacja pól najwyższego poziomu

| Pole                                 | Wymagane | Typ                              | Co oznacza                                                                                                                                                                                                                         |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Tak      | `string`                         | Kanoniczny identyfikator pluginu. To jest identyfikator używany w `plugins.entries.<id>`.                                                                                                                                           |
| `configSchema`                       | Tak      | `object`                         | Wbudowany JSON Schema dla konfiguracji tego pluginu.                                                                                                                                                                                |
| `enabledByDefault`                   | Nie      | `true`                           | Oznacza dołączony plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić plugin domyślnie wyłączony.                                                                              |
| `legacyPluginIds`                    | Nie      | `string[]`                       | Starsze identyfikatory, które są normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                                         |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten plugin, gdy auth, konfiguracja lub odwołania do modeli o nich wspominają.                                                                                        |
| `kind`                               | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj pluginu używany przez `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                  |
| `providers`                          | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                                                                |
| `providerDiscoveryEntry`             | Nie      | `string`                         | Lekka ścieżka modułu wykrywania dostawcy, względna względem katalogu głównego pluginu, dla metadanych katalogu dostawców o zakresie manifestu, które można wczytać bez aktywowania pełnego runtime pluginu.                         |
| `modelSupport`                       | Nie      | `object`                         | Skrótowe metadane rodziny modeli należące do manifestu, używane do automatycznego wczytania pluginu przed runtime.                                                                                                                  |
| `modelCatalog`                       | Nie      | `object`                         | Deklaratywne metadane katalogu modeli dla dostawców należących do tego pluginu. To kontrakt płaszczyzny sterowania dla przyszłego listowania tylko do odczytu, onboardingu, selektorów modeli, aliasów i tłumienia bez wczytywania runtime pluginu. |
| `modelPricing`                       | Nie      | `object`                         | Należąca do dostawcy polityka wyszukiwania zewnętrznych cen. Użyj jej, aby wyłączyć lokalnych/samohostowanych dostawców ze zdalnych katalogów cen lub mapować odwołania dostawców na identyfikatory katalogów OpenRouter/LiteLLM bez twardego kodowania identyfikatorów dostawców w core. |
| `modelIdNormalization`               | Nie      | `object`                         | Należące do dostawcy czyszczenie aliasów/prefiksów identyfikatorów modeli, które musi zostać wykonane przed wczytaniem runtime dostawcy.                                                                                           |
| `providerEndpoints`                  | Nie      | `object[]`                       | Należące do manifestu metadane hosta/baseUrl endpointów dla tras dostawców, które core musi sklasyfikować przed wczytaniem runtime dostawcy.                                                                                        |
| `providerRequest`                    | Nie      | `object`                         | Tanie metadane rodziny dostawcy i zgodności żądań używane przez ogólną politykę żądań przed wczytaniem runtime dostawcy.                                                                                                           |
| `cliBackends`                        | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należące do tego pluginu. Używane do automatycznej aktywacji przy uruchamianiu na podstawie jawnych odwołań w konfiguracji.                                                                 |
| `syntheticAuthRefs`                  | Nie      | `string[]`                       | Odwołania do dostawców lub backendów CLI, których należący do pluginu syntetyczny hook auth powinien zostać sprawdzony podczas zimnego wykrywania modeli przed wczytaniem runtime.                                                |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                       | Należące do dołączonego pluginu zastępcze wartości kluczy API, które reprezentują nietajne lokalne, OAuth lub ambientowe dane uwierzytelniające.                                                                                    |
| `commandAliases`                     | Nie      | `object[]`                       | Nazwy poleceń należące do tego pluginu, które powinny generować świadome pluginu diagnostyki konfiguracji i CLI przed wczytaniem runtime.                                                                                           |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`       | Przestarzałe metadane zgodności env dla wyszukiwania auth/statusu dostawcy. Dla nowych pluginów preferuj `setup.providers[].envVars`; OpenClaw nadal odczytuje to w okresie wycofywania.                                           |
| `providerAuthAliases`                | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania auth, na przykład dostawca kodowania współdzielący klucz API i profile auth dostawcy bazowego.                              |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`       | Tanie metadane env kanału, które OpenClaw może sprawdzić bez wczytywania kodu pluginu. Użyj tego dla sterowanej przez env konfiguracji kanału lub powierzchni auth, które powinny być widoczne dla ogólnych helperów uruchamiania/konfiguracji. |
| `providerAuthChoices`                | Nie      | `object[]`                       | Tanie metadane wyboru auth dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego okablowania flag CLI.                                                                                                       |
| `activation`                         | Nie      | `object`                         | Tanie metadane planisty aktywacji dla uruchamiania, dostawcy, polecenia, kanału, trasy i wczytywania wyzwalanego przez capabilities. Tylko metadane; runtime pluginu nadal odpowiada za faktyczne zachowanie.                       |
| `setup`                              | Nie      | `object`                         | Tanie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez wczytywania runtime pluginu.                                                                                            |
| `qaRunners`                          | Nie      | `object[]`                       | Tanie deskryptory runnerów QA używane przez współdzielonego hosta `openclaw qa` przed wczytaniem runtime pluginu.                                                                                                                   |
| `contracts`                          | Nie      | `object`                         | Statyczna migawka własności capabilities dla zewnętrznych hooków auth, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów, generowania obrazów, generowania muzyki, generowania wideo, web-fetch, wyszukiwania w sieci i własności narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`         | Tanie wartości domyślne rozumienia mediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                                  |
| `imageGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane auth generowania obrazów dla identyfikatorów dostawców zadeklarowanych w `contracts.imageGenerationProviders`, w tym należące do dostawcy aliasy auth i strażniki base-url.                                        |
| `videoGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane auth generowania wideo dla identyfikatorów dostawców zadeklarowanych w `contracts.videoGenerationProviders`, w tym należące do dostawcy aliasy auth i strażniki base-url.                                         |
| `musicGenerationProviderMetadata`    | Nie      | `Record<string, object>`         | Tanie metadane auth generowania muzyki dla identyfikatorów dostawców zadeklarowanych w `contracts.musicGenerationProviders`, w tym należące do dostawcy aliasy auth i strażniki base-url.                                        |
| `toolMetadata`                       | Nie      | `Record<string, object>`         | Tanie metadane dostępności dla narzędzi należących do pluginu zadeklarowanych w `contracts.tools`. Użyj ich, gdy narzędzie nie powinno wczytywać runtime, chyba że istnieją dowody z konfiguracji, env lub auth.                   |
| `channelConfigs`                     | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału scalane z powierzchniami wykrywania i walidacji przed wczytaniem runtime.                                                                                                       |
| `skills`                             | Nie      | `string[]`                       | Katalogi Skills do wczytania, względne względem katalogu głównego pluginu.                                                                                                                                                          |
| `name`                               | Nie      | `string`                         | Czytelna dla człowieka nazwa pluginu.                                                                                                                                                                                               |
| `description`                        | No       | `string`                         | Krótkie podsumowanie wyświetlane w powierzchniach Plugin.                                                                                                                                                                                             |
| `version`                            | No       | `string`                         | Informacyjna wersja Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | No       | `Record<string, object>`         | Etykiety interfejsu użytkownika, symbole zastępcze i wskazówki dotyczące poufności pól konfiguracji.                                                                                                                                                                   |

## Dokumentacja metadanych dostawcy generowania

Pola metadanych dostawcy generowania opisują statyczne sygnały uwierzytelniania dla
dostawców zadeklarowanych na pasującej liście `contracts.*GenerationProviders`.
OpenClaw odczytuje te pola przed załadowaniem środowiska uruchomieniowego dostawcy, aby narzędzia core mogły
określić, czy dostawca generowania jest dostępny bez importowania każdego
pluginu dostawcy.

Używaj tych pól tylko do tanich, deklaratywnych faktów. Transport, przekształcenia
żądań, odświeżanie tokenów, walidacja poświadczeń i faktyczne zachowanie generowania
pozostają w środowisku uruchomieniowym pluginu.

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

| Pole            | Wymagane | Typ        | Znaczenie                                                                                                                            |
| --------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`       | Nie      | `string[]` | Dodatkowe identyfikatory dostawców, które powinny liczyć się jako statyczne aliasy uwierzytelniania dla dostawcy generowania.        |
| `authProviders` | Nie      | `string[]` | Identyfikatory dostawców, których skonfigurowane profile uwierzytelniania powinny liczyć się jako uwierzytelnianie dla tego dostawcy generowania. |
| `configSignals` | Nie      | `object[]` | Tanie sygnały dostępności oparte tylko na konfiguracji dla lokalnych lub samodzielnie hostowanych dostawców, których można skonfigurować bez profili uwierzytelniania ani zmiennych środowiskowych. |
| `authSignals`   | Nie      | `object[]` | Jawne sygnały uwierzytelniania. Jeśli są obecne, zastępują domyślny zestaw sygnałów z identyfikatora dostawcy, `aliases` i `authProviders`. |

Każdy wpis `configSignals` obsługuje:

| Pole          | Wymagane | Typ        | Znaczenie                                                                                                                                                                                |
| ------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Tak      | `string`   | Ścieżka kropkowa do należącego do pluginu obiektu konfiguracji do sprawdzenia, na przykład `plugins.entries.example.config`.                                                            |
| `overlayPath` | Nie      | `string`   | Ścieżka kropkowa wewnątrz konfiguracji głównej, której obiekt powinien nadpisać obiekt główny przed oceną sygnału. Użyj tego dla konfiguracji specyficznej dla możliwości, takiej jak `image`, `video` lub `music`. |
| `required`    | Nie      | `string[]` | Ścieżki kropkowe wewnątrz efektywnej konfiguracji, które muszą mieć skonfigurowane wartości. Ciągi znaków muszą być niepuste; obiekty i tablice nie mogą być puste.                    |
| `requiredAny` | Nie      | `string[]` | Ścieżki kropkowe wewnątrz efektywnej konfiguracji, z których co najmniej jedna musi mieć skonfigurowaną wartość.                                                                         |
| `mode`        | Nie      | `object`   | Opcjonalna straż trybu będącego ciągiem znaków wewnątrz efektywnej konfiguracji. Użyj tego, gdy dostępność oparta tylko na konfiguracji ma zastosowanie tylko do jednego trybu.          |

Każda straż `mode` obsługuje:

| Pole         | Wymagane | Typ        | Znaczenie                                                                                  |
| ------------ | -------- | ---------- | ------------------------------------------------------------------------------------------ |
| `path`       | Nie      | `string`   | Ścieżka kropkowa wewnątrz efektywnej konfiguracji. Domyślnie `mode`.                       |
| `default`    | Nie      | `string`   | Wartość trybu używana, gdy konfiguracja pomija ścieżkę.                                    |
| `allowed`    | Nie      | `string[]` | Jeśli obecne, sygnał przechodzi tylko wtedy, gdy efektywny tryb jest jedną z tych wartości. |
| `disallowed` | Nie      | `string[]` | Jeśli obecne, sygnał kończy się niepowodzeniem, gdy efektywny tryb jest jedną z tych wartości. |

Każdy wpis `authSignals` obsługuje:

| Pole              | Wymagane | Typ      | Co oznacza                                                                                                                                                                               |
| ----------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Tak      | `string` | Identyfikator providera do sprawdzenia w skonfigurowanych profilach uwierzytelniania.                                                                                                    |
| `providerBaseUrl` | Nie      | `object` | Opcjonalna osłona, która sprawia, że sygnał jest brany pod uwagę tylko wtedy, gdy wskazany skonfigurowany provider używa dozwolonego bazowego adresu URL. Użyj tego, gdy alias uwierzytelniania jest prawidłowy tylko dla określonych API. |

Każda osłona `providerBaseUrl` obsługuje:

| Pole              | Wymagane | Typ        | Co oznacza                                                                                                                                       |
| ----------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Tak      | `string`   | Identyfikator konfiguracji providera, którego `baseUrl` ma zostać sprawdzony.                                                                     |
| `defaultBaseUrl`  | Nie      | `string`   | Bazowy adres URL, który należy przyjąć, gdy konfiguracja providera pomija `baseUrl`.                                                              |
| `allowedBaseUrls` | Tak      | `string[]` | Dozwolone bazowe adresy URL dla tego sygnału uwierzytelniania. Sygnał jest ignorowany, gdy skonfigurowany lub domyślny bazowy adres URL nie pasuje do jednej z tych znormalizowanych wartości. |

## Dokumentacja metadanych narzędzi

`toolMetadata` używa tych samych kształtów `configSignals` i `authSignals` co
metadane providera generowania, indeksowane według nazwy narzędzia. `contracts.tools` deklaruje
własność. `toolMetadata` deklaruje tani dowód dostępności, aby OpenClaw mógł
uniknąć importowania runtime'u pluginu tylko po to, by jego fabryka narzędzi zwróciła `null`.

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
ładuje właścicielski plugin, gdy kontrakt narzędzia pasuje do polityki. W przypadku narzędzi
na ścieżce krytycznej, których fabryka zależy od uwierzytelniania/konfiguracji, autorzy pluginów powinni deklarować
`toolMetadata` zamiast wymuszać na rdzeniu import runtime'u, aby zapytać.

## Dokumentacja providerAuthChoices

Każdy wpis `providerAuthChoices` opisuje jedną opcję onboardingu lub uwierzytelniania.
OpenClaw odczytuje ją przed załadowaniem runtime'u providera.
Listy konfiguracji providera używają tych opcji z manifestu, opcji konfiguracji
wyprowadzonych z deskryptora oraz metadanych katalogu instalacji bez ładowania runtime'u providera.

| Pole                  | Wymagane | Typ                                             | Co oznacza                                                                                                   |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`            | Tak      | `string`                                        | Identyfikator providera, do którego należy ta opcja.                                                         |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której należy przekazać obsługę.                                    |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator opcji uwierzytelniania używany przez przepływy onboardingu i CLI.                     |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje zastępczo `choiceId`.            |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                       |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.             |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa opcję przed selektorami asystenta, nadal pozwalając na ręczny wybór w CLI.                            |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory opcji, które powinny przekierowywać użytkowników do tej opcji zastępczej.             |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych opcji.                                              |
| `groupLabel`          | Nie      | `string`                                        | Etykieta widoczna dla użytkownika dla tej grupy.                                                             |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                           |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                               |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                         |
| `cliOption`           | Nie      | `string`                                        | Pełny kształt opcji CLI, na przykład `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                                   |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Powierzchnie onboardingu, w których ta opcja powinna się pojawić. Jeśli zostanie pominięte, domyślnie używa `["text-inference"]`. |

## Dokumentacja commandAliases

Użyj `commandAliases`, gdy Plugin jest właścicielem nazwy polecenia środowiska wykonawczego, którą użytkownicy mogą
omyłkowo umieścić w `plugins.allow` albo spróbować uruchomić jako główne polecenie CLI. OpenClaw
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
| `name`       | Tak      | `string`          | Nazwa polecenia należąca do tego Pluginu.                                      |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie ukośnika czatu, a nie główne polecenie CLI.       |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI sugerowane dla operacji CLI, jeśli istnieje.    |

## Informacje o `activation`

Użyj `activation`, gdy Plugin może tanio zadeklarować, które zdarzenia warstwy sterowania
powinny uwzględniać go w planie aktywacji/ładowania.

Ten blok to metadane planisty, a nie API cyklu życia. Nie rejestruje
zachowania środowiska wykonawczego, nie zastępuje `register(...)` i nie obiecuje, że
kod Pluginu został już wykonany. Planista aktywacji używa tych pól do
zawężania kandydatów na Pluginy przed powrotem do istniejących metadanych własności
w manifeście, takich jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i haki.

Preferuj najwęższe metadane, które już opisują własność. Używaj
`providers`, `channels`, `commandAliases`, deskryptorów konfiguracji lub `contracts`,
gdy te pola wyrażają relację. Użyj `activation` dla dodatkowych
wskazówek planisty, których nie da się przedstawić za pomocą tych pól własności.
Używaj najwyższego poziomu `cliBackends` dla aliasów środowiska wykonawczego CLI, takich jak `claude-cli`,
`codex-cli` lub `google-gemini-cli`; `activation.onAgentHarnesses` służy tylko do
identyfikatorów osadzonych uprzęży agentów, które nie mają jeszcze pola własności.

Ten blok zawiera wyłącznie metadane. Nie rejestruje zachowania środowiska wykonawczego i
nie zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia środowiska wykonawczego/Pluginu.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem Pluginów, więc
brak metadanych aktywacji niezwiązanych ze startem zwykle kosztuje tylko wydajność; nie
powinien zmieniać poprawności, dopóki istnieją zapasowe mechanizmy własności z manifestu.

Każdy Plugin powinien celowo ustawić `activation.onStartup`. Ustaw go na `true`
tylko wtedy, gdy Plugin musi działać podczas startu Gateway. Ustaw go na `false`, gdy
Plugin jest bezczynny przy starcie i powinien ładować się tylko z węższych wyzwalaczy.
Pominięcie `onStartup` nie ładuje już Pluginu niejawnie przy starcie; użyj jawnych
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

| Pole               | Wymagane | Typ                                                  | Co oznacza                                                                                                                                                                                                |
| ------------------ | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nie      | `boolean`                                            | Jawna aktywacja przy starcie Gateway. Każdy Plugin powinien ją ustawić. `true` importuje Plugin podczas startu; `false` utrzymuje leniwy start, chyba że inny pasujący wyzwalacz wymaga ładowania. |
| `onProviders`      | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                                                                             |
| `onAgentHarnesses` | Nie      | `string[]`                                           | Identyfikatory środowiska wykonawczego osadzonych uprzęży agentów, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania. Używaj najwyższego poziomu `cliBackends` dla aliasów zaplecza CLI. |
| `onCommands`       | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                                                                               |
| `onChannels`       | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                                                                               |
| `onRoutes`         | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                                                                                         |
| `onConfigPaths`    | Nie      | `string[]`                                           | Ścieżki konfiguracji względne względem katalogu głównego, które powinny uwzględniać ten Plugin w planach startu/ładowania, gdy ścieżka istnieje i nie jest jawnie wyłączona.                             |
| `onCapabilities`   | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki możliwości używane przez planowanie aktywacji warstwy sterowania. Gdy to możliwe, preferuj węższe pola.                                                                                |

Obecni konsumenci działający na żywo:

- planowanie startu Gateway używa `activation.onStartup` do jawnego
  importu startowego
- planowanie CLI wyzwalane poleceniem wraca do starszego
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie startu środowiska wykonawczego agenta używa `activation.onAgentHarnesses` dla
  osadzonych uprzęży oraz najwyższego poziomu `cliBackends[]` dla aliasów środowiska wykonawczego CLI
- planowanie konfiguracji/kanału wyzwalane kanałem wraca do starszej własności `channels[]`,
  gdy brakuje jawnych metadanych aktywacji kanału
- planowanie Pluginów startowych używa `activation.onConfigPaths` dla niekanałowych głównych
  powierzchni konfiguracji, takich jak blok `browser` dołączonego Pluginu przeglądarki
- planowanie konfiguracji/środowiska wykonawczego wyzwalane dostawcą wraca do starszej
  własności `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych
  metadanych aktywacji dostawcy

Diagnostyka planisty może odróżniać jawne wskazówki aktywacji od zapasowej
własności z manifestu. Na przykład `activation-command-hint` oznacza, że
dopasowano `activation.onCommands`, podczas gdy `manifest-command-alias` oznacza, że
planista użył zamiast tego własności `commandAliases`. Te etykiety przyczyn są przeznaczone do
diagnostyki hosta i testów; autorzy Pluginów powinni nadal deklarować metadane,
które najlepiej opisują własność.

## Informacje o `qaRunners`

Użyj `qaRunners`, gdy Plugin dostarcza co najmniej jeden mechanizm uruchamiania transportu pod
wspólnym korzeniem `openclaw qa`. Utrzymuj te metadane tanie i statyczne; środowisko wykonawcze
Pluginu nadal jest właścicielem właściwej rejestracji CLI przez lekką powierzchnię
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
| ------------- | -------- | -------- | --------------------------------------------------------------------------- |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.             |
| `description` | Nie      | `string` | Zapasowy tekst pomocy używany, gdy wspólny host potrzebuje polecenia atrapy. |

## Informacje o `setup`

Użyj `setup`, gdy powierzchnie konfiguracji i wdrażania potrzebują tanich metadanych należących do Pluginu
przed załadowaniem środowiska wykonawczego.

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

Najwyższy poziom `cliBackends` pozostaje prawidłowy i nadal opisuje zaplecza
wnioskowania CLI. `setup.cliBackends` to specyficzna dla konfiguracji powierzchnia deskryptora dla
przepływów warstwy sterowania/konfiguracji, które powinny pozostać wyłącznie metadanymi.

Gdy istnieją, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania opartą najpierw na deskryptorach dla odkrywania konfiguracji. Jeśli deskryptor tylko
zawęża kandydujący Plugin, a konfiguracja nadal potrzebuje bogatszych haków środowiska wykonawczego na czas konfiguracji,
ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
zapasową ścieżkę wykonania.

OpenClaw uwzględnia też `setup.providers[].envVars` w ogólnym uwierzytelnianiu dostawców i
wyszukiwaniach zmiennych środowiskowych. `providerAuthEnvVars` pozostaje obsługiwane przez adapter
zgodności w okresie wycofywania, ale niedołączone Pluginy, które nadal go używają,
otrzymują diagnostykę manifestu. Nowe Pluginy powinny umieszczać metadane środowiskowe konfiguracji/statusu
w `setup.providers[].envVars`.

OpenClaw może także wyprowadzać proste wybory konfiguracji z `setup.providers[].authMethods`,
gdy nie ma dostępnego wpisu konfiguracji albo gdy `setup.requiresRuntime: false`
deklaruje, że środowisko wykonawcze konfiguracji nie jest potrzebne. Jawne wpisy `providerAuthChoices` pozostają
preferowane dla niestandardowych etykiet, flag CLI, zakresu wdrażania i metadanych asystenta.

Ustaw `requiresRuntime: false` tylko wtedy, gdy te deskryptory wystarczają dla
powierzchni konfiguracji. OpenClaw traktuje jawne `false` jako kontrakt wyłącznie deskryptorowy
i nie wykona `setup-api` ani `openclaw.setupEntry` na potrzeby wyszukiwania konfiguracji. Jeśli
Plugin wyłącznie deskryptorowy nadal dostarcza jeden z tych wpisów środowiska wykonawczego konfiguracji,
OpenClaw zgłasza addytywną diagnostykę i dalej go ignoruje. Pominięte
`requiresRuntime` zachowuje starsze zachowanie zapasowe, aby istniejące Pluginy, które dodały
deskryptory bez tej flagi, się nie zepsuły.

Ponieważ wyszukiwanie konfiguracji może wykonywać należący do Pluginu kod `setup-api`, znormalizowane
wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikatowe we wszystkich
odkrytych Pluginach. Niejednoznaczna własność kończy się zamknięciem zamiast wybierania
zwycięzcy na podstawie kolejności odkrywania.

Gdy środowisko wykonawcze konfiguracji rzeczywiście się wykonuje, diagnostyka rejestru konfiguracji zgłasza
rozjazd deskryptorów, jeśli `setup-api` rejestruje dostawcę lub zaplecze CLI, którego
deskryptory manifestu nie deklarują, albo jeśli deskryptor nie ma pasującej rejestracji
środowiska wykonawczego. Ta diagnostyka jest addytywna i nie odrzuca starszych Pluginów.

### Informacje o `setup.providers`

| Pole           | Wymagane | Typ        | Co oznacza                                                                                              |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `id`           | Tak      | `string`   | Identyfikator dostawcy ujawniany podczas konfiguracji lub wdrażania. Utrzymuj znormalizowane identyfikatory globalnie unikatowe. |
| `authMethods`  | Nie      | `string[]` | Identyfikatory metod konfiguracji/uwierzytelniania obsługiwane przez tego dostawcę bez ładowania pełnego środowiska wykonawczego. |
| `envVars`      | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie konfiguracji/statusu mogą sprawdzać przed załadowaniem środowiska wykonawczego Pluginu. |
| `authEvidence` | Nie      | `object[]` | Tanie lokalne kontrole dowodów uwierzytelnienia dla dostawców, którzy mogą uwierzytelniać przez niesekretne znaczniki. |

`authEvidence` służy do lokalnych znaczników poświadczeń należących do dostawcy, które można
zweryfikować bez ładowania kodu runtime. Te sprawdzenia muszą pozostać tanie i lokalne:
bez wywołań sieciowych, bez odczytów z pęku kluczy ani menedżera sekretów, bez poleceń powłoki i bez
sond API dostawcy.

Obsługiwane wpisy dowodów:

| Pole               | Wymagane | Typ        | Znaczenie                                                                                                                |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `type`             | Tak      | `string`   | Obecnie `local-file-with-env`.                                                                                           |
| `fileEnvVar`       | Nie      | `string`   | Zmienna środowiskowa zawierająca jawnie podaną ścieżkę do pliku poświadczeń.                                             |
| `fallbackPaths`    | Nie      | `string[]` | Lokalne ścieżki do plików poświadczeń sprawdzane, gdy `fileEnvVar` jest nieobecne lub puste. Obsługuje `${HOME}` i `${APPDATA}`. |
| `requiresAnyEnv`   | Nie      | `string[]` | Co najmniej jedna z wymienionych zmiennych środowiskowych musi być niepusta, zanim dowód będzie prawidłowy.              |
| `requiresAllEnv`   | Nie      | `string[]` | Każda z wymienionych zmiennych środowiskowych musi być niepusta, zanim dowód będzie prawidłowy.                          |
| `credentialMarker` | Tak      | `string`   | Niesekretny znacznik zwracany, gdy dowód jest obecny.                                                                     |
| `source`           | Nie      | `string`   | Etykieta źródła widoczna dla użytkownika w danych wyjściowych uwierzytelniania/statusu.                                  |

### pola setup

| Pole               | Wymagane | Typ        | Znaczenie                                                                                             |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji dostawcy udostępniane podczas konfiguracji i onboardingu.                    |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów z czasu konfiguracji używane do wyszukiwania konfiguracji najpierw według deskryptora. Zachowaj znormalizowane identyfikatory globalnie unikalne. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego pluginu.               |
| `requiresRuntime`  | Nie      | `boolean`  | Czy konfiguracja nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                        |

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

| Pole          | Typ        | Znaczenie                                      |
| ------------- | ---------- | ---------------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.        |
| `help`        | `string`   | Krótki tekst pomocniczy.                       |
| `tags`        | `string[]` | Opcjonalne tagi interfejsu użytkownika.        |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.                |
| `sensitive`   | `boolean`  | Oznacza pole jako tajne lub wrażliwe.          |
| `placeholder` | `string`   | Tekst zastępczy dla pól formularza.            |

## dokumentacja `contracts`

Używaj `contracts` tylko do statycznych metadanych własności możliwości, które OpenClaw może
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

| Pole                             | Typ        | Znaczenie                                                                    |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory fabryk rozszerzeń serwera aplikacji Codex, obecnie `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identyfikatory runtime, dla których dołączony plugin może zarejestrować middleware wyników narzędzi. |
| `externalAuthProviders`          | `string[]` | Identyfikatory dostawców, których hook zewnętrznego profilu uwierzytelniania należy do tego pluginu. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należące do tego pluginu.                      |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należące do tego pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należące do tego pluginu. |
| `memoryEmbeddingProviders`       | `string[]` | Identyfikatory dostawców osadzania pamięci należące do tego pluginu.         |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia mediów należące do tego pluginu.         |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należące do tego pluginu.       |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należące do tego pluginu.         |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania z sieci należące do tego pluginu.        |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania w sieci należące do tego pluginu.      |
| `migrationProviders`             | `string[]` | Identyfikatory dostawców importu należące do tego pluginu dla `openclaw migrate`. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należące do tego pluginu.                              |

`contracts.embeddedExtensionFactories` jest zachowane dla dołączonych fabryk rozszerzeń Codex
działających wyłącznie po stronie serwera aplikacji. Dołączone przekształcenia wyników narzędzi powinny
deklarować `contracts.agentToolResultMiddleware` i zamiast tego rejestrować się za pomocą
`api.registerAgentToolResultMiddleware(...)`. Zewnętrzne pluginy nie mogą
rejestrować middleware wyników narzędzi, ponieważ seam może przepisać wysoce zaufane dane wyjściowe narzędzia,
zanim zobaczy je model.

Rejestracje runtime `api.registerTool(...)` muszą pasować do `contracts.tools`.
Wykrywanie narzędzi używa tej listy, aby ładować tylko runtime pluginów, które mogą posiadać
żądane narzędzia.

Pluginy dostawców implementujące `resolveExternalAuthProfiles` powinny deklarować
`contracts.externalAuthProviders`. Pluginy bez tej deklaracji nadal działają
przez przestarzałą rezerwową ścieżkę kompatybilności, ale ta ścieżka jest wolniejsza i
zostanie usunięta po oknie migracji.

Dołączeni dostawcy osadzania pamięci powinni deklarować
`contracts.memoryEmbeddingProviders` dla każdego identyfikatora adaptera, który udostępniają, w tym
wbudowanych adapterów takich jak `local`. Samodzielne ścieżki CLI używają tego kontraktu manifestu,
aby załadować tylko właścicielski plugin, zanim pełny runtime Gateway
zarejestruje dostawców.

## dokumentacja `mediaUnderstandingProviderMetadata`

Używaj `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia mediów ma
domyślne modele, priorytet rezerwowego automatycznego uwierzytelniania lub natywną obsługę dokumentów, których
ogólne pomocniki core potrzebują przed załadowaniem runtime. Klucze muszą być również zadeklarowane w
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Możliwości mediów udostępniane przez tego dostawcę.                          |
| `defaultModels`        | `Record<string, string>`            | Domyślne mapowanie możliwości na model używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby sortują wcześniej dla automatycznego rezerwowego wyboru dostawcy opartego na poświadczeniach. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez dostawcę.                       |

## dokumentacja `channelConfigs`

Używaj `channelConfigs`, gdy plugin kanału potrzebuje tanich metadanych konfiguracji przed
załadowaniem runtime. Wykrywanie konfiguracji/statusu kanału tylko do odczytu może używać tych metadanych
bezpośrednio dla skonfigurowanych kanałów zewnętrznych, gdy nie ma wpisu konfiguracji, lub
gdy `setup.requiresRuntime: false` deklaruje, że runtime konfiguracji jest niepotrzebny.

`channelConfigs` to metadane manifestu pluginu, a nie nowa sekcja konfiguracji użytkownika najwyższego poziomu.
Użytkownicy nadal konfigurują instancje kanałów pod `channels.<channel-id>`.
OpenClaw odczytuje metadane manifestu, aby zdecydować, który plugin posiada ten skonfigurowany
kanał, zanim wykona się kod runtime pluginu.

Dla pluginu kanału `configSchema` i `channelConfigs` opisują różne
ścieżki:

- `configSchema` waliduje `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` waliduje `channels.<channel-id>`

Pluginy niedołączone, które deklarują `channels[]`, powinny również deklarować pasujące
wpisy `channelConfigs`. Bez nich OpenClaw nadal może załadować plugin, ale
schemat konfiguracji ścieżki zimnej, konfiguracja i powierzchnie Control UI nie mogą znać
kształtu opcji należących do kanału, dopóki nie wykona się runtime pluginu.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` i
`nativeSkillsAutoEnabled` mogą deklarować statyczne wartości domyślne `auto` dla sprawdzeń konfiguracji poleceń,
które uruchamiają się przed załadowaniem runtime kanału. Dołączone kanały mogą również publikować
te same wartości domyślne przez `package.json#openclaw.channel.commands` obok
pozostałych metadanych katalogu kanałów należących do pakietu.

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
| `schema`      | `object`                 | Schemat JSON dla `channels.<id>`. Wymagany dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI, symbole zastępcze i wskazówki poufności dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z selektorem i powierzchniami inspekcji, gdy metadane runtime nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                  |
| `commands`    | `object`                 | Statyczne polecenie natywne i automatyczne wartości domyślne natywnych Skills dla kontroli konfiguracji przed runtime. |
| `preferOver`  | `string[]`               | Starsze lub niżej priorytetowe identyfikatory pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

### Zastępowanie innego pluginu kanału

Użyj `preferOver`, gdy Twój plugin jest preferowanym właścicielem identyfikatora kanału, który
może też dostarczać inny plugin. Typowe przypadki to zmieniony identyfikator pluginu,
samodzielny plugin zastępujący plugin wbudowany albo utrzymywany fork, który
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

Gdy skonfigurowano `channels.chat`, OpenClaw uwzględnia zarówno identyfikator kanału, jak i
identyfikator preferowanego pluginu. Jeśli plugin o niższym priorytecie został wybrany tylko dlatego,
że jest wbudowany lub domyślnie włączony, OpenClaw wyłącza go w efektywnej
konfiguracji runtime, aby jeden plugin był właścicielem kanału i jego narzędzi. Jawny wybór użytkownika
nadal wygrywa: jeśli użytkownik jawnie włączy oba pluginy, OpenClaw
zachowa ten wybór i zgłosi diagnostykę zduplikowanych kanałów lub narzędzi zamiast
po cichu zmieniać żądany zestaw pluginów.

Ogranicz `preferOver` do identyfikatorów pluginów, które rzeczywiście mogą dostarczać ten sam kanał.
Nie jest to ogólne pole priorytetu i nie zmienia nazw kluczy konfiguracji użytkownika.

## Odniesienie modelSupport

Użyj `modelSupport`, gdy OpenClaw ma wywnioskować Twój plugin dostawcy z
krótkich identyfikatorów modeli, takich jak `gpt-5.5` lub `claude-sonnet-4.6`, zanim zostanie
załadowany runtime pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje tę kolejność pierwszeństwa:

- jawne odwołania `provider/model` używają metadanych manifestu właściciela `providers`
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują zarówno jeden plugin niewbudowany, jak i jeden plugin wbudowany, wygrywa
  plugin niewbudowany
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie wskażą dostawcy

Pola:

| Pole            | Typ        | Znaczenie                                                                       |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane metodą `startsWith` do krótkich identyfikatorów modeli.   |
| `modelPatterns` | `string[]` | Źródła wyrażeń regularnych dopasowywane do krótkich identyfikatorów modeli po usunięciu sufiksu profilu. |

## Odniesienie modelCatalog

Użyj `modelCatalog`, gdy OpenClaw powinien znać metadane modeli dostawcy przed
załadowaniem runtime pluginu. To źródło należące do manifestu dla stałych wierszy katalogu,
aliasów dostawców, reguł wyciszania i trybu wykrywania. Odświeżanie runtime
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

| Pole           | Typ                                                      | Znaczenie                                                                                                  |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Wiersze katalogu dla identyfikatorów dostawców należących do tego pluginu. Klucze powinny też występować w `providers` najwyższego poziomu. |
| `aliases`      | `Record<string, object>`                                 | Aliasy dostawców, które powinny rozwiązywać się do posiadanego dostawcy na potrzeby planowania katalogu lub wyciszeń. |
| `suppressions` | `object[]`                                               | Wiersze modeli z innego źródła, które ten plugin wycisza z powodu specyficznego dla dostawcy.              |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Czy katalog dostawcy można odczytać z metadanych manifestu, odświeżyć do pamięci podręcznej, czy wymaga runtime. |

`aliases` uczestniczy w wyszukiwaniu właściciela dostawcy na potrzeby planowania katalogu modeli.
Cele aliasów muszą być dostawcami najwyższego poziomu należącymi do tego samego pluginu. Gdy
lista filtrowana według dostawcy używa aliasu, OpenClaw może odczytać manifest właściciela i
zastosować nadpisania API oraz bazowego adresu URL aliasu bez ładowania runtime dostawcy.
Aliasy nie rozszerzają niefiltrowanych list katalogu; szerokie listy emitują tylko wiersze
właściciela kanonicznego dostawcy.

`suppressions` zastępuje stary hook runtime dostawcy `suppressBuiltInModel`.
Wpisy wyciszeń są respektowane tylko wtedy, gdy dostawca należy do pluginu albo
został zadeklarowany jako klucz `modelCatalog.aliases`, który wskazuje posiadanego dostawcę. Hooki
wyciszania runtime nie są już wywoływane podczas rozwiązywania modelu.

Pola dostawcy:

| Pole      | Typ                      | Znaczenie                                                         |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | Opcjonalny domyślny bazowy adres URL dla modeli w tym katalogu dostawcy. |
| `api`     | `ModelApi`               | Opcjonalny domyślny adapter API dla modeli w tym katalogu dostawcy. |
| `headers` | `Record<string, string>` | Opcjonalne statyczne nagłówki stosowane do tego katalogu dostawcy. |
| `models`  | `object[]`               | Wymagane wiersze modeli. Wiersze bez `id` są ignorowane.          |

Pola modelu:

| Pole            | Typ                                                            | Znaczenie                                                                   |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Lokalny dla dostawcy identyfikator modelu, bez prefiksu `provider/`.        |
| `name`          | `string`                                                       | Opcjonalna nazwa wyświetlana.                                               |
| `api`           | `ModelApi`                                                     | Opcjonalne nadpisanie API dla modelu.                                       |
| `baseUrl`       | `string`                                                       | Opcjonalne nadpisanie bazowego adresu URL dla modelu.                       |
| `headers`       | `Record<string, string>`                                       | Opcjonalne statyczne nagłówki dla modelu.                                   |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalności akceptowane przez model.                                         |
| `reasoning`     | `boolean`                                                      | Czy model udostępnia zachowanie rozumowania.                                |
| `contextWindow` | `number`                                                       | Natywne okno kontekstu dostawcy.                                            |
| `contextTokens` | `number`                                                       | Opcjonalny efektywny limit kontekstu runtime, gdy różni się od `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maksymalna liczba tokenów wyjściowych, jeśli jest znana.                    |
| `cost`          | `object`                                                       | Opcjonalna cena w USD za milion tokenów, w tym opcjonalne `tieredPricing`.  |
| `compat`        | `object`                                                       | Opcjonalne flagi zgodności odpowiadające zgodności konfiguracji modelu OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status listowania. Wyciszaj tylko wtedy, gdy wiersz w ogóle nie może się pojawić. |
| `statusReason`  | `string`                                                       | Opcjonalny powód pokazywany przy statusie innym niż dostępny.               |
| `replaces`      | `string[]`                                                     | Starsze lokalne dla dostawcy identyfikatory modeli, które ten model zastępuje. |
| `replacedBy`    | `string`                                                       | Lokalny dla dostawcy identyfikator modelu zastępczego dla przestarzałych wierszy. |
| `tags`          | `string[]`                                                     | Stabilne tagi używane przez selektory i filtry.                             |

Pola wyciszeń:

| Pole                       | Typ        | Znaczenie                                                                                                  |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identyfikator dostawcy dla wiersza upstream do wyciszenia. Musi należeć do tego pluginu albo być zadeklarowany jako posiadany alias. |
| `model`                    | `string`   | Lokalny dla dostawcy identyfikator modelu do wyciszenia.                                                   |
| `reason`                   | `string`   | Opcjonalny komunikat pokazywany, gdy wyciszony wiersz zostanie zażądany bezpośrednio.                      |
| `when.baseUrlHosts`        | `string[]` | Opcjonalna lista efektywnych hostów bazowego adresu URL dostawcy wymaganych przed zastosowaniem wyciszenia. |
| `when.providerConfigApiIn` | `string[]` | Opcjonalna lista dokładnych wartości `api` z konfiguracji dostawcy wymaganych przed zastosowaniem wyciszenia. |

Nie umieszczaj danych wyłącznie runtime'owych w `modelCatalog`. Używaj `static` tylko wtedy, gdy wiersze manifestu są wystarczająco kompletne, aby powierzchnie list filtrowanych według dostawcy i selektora mogły pominąć wykrywanie w rejestrze/runtime. Używaj `refreshable`, gdy wiersze manifestu są użytecznymi listowalnymi zalążkami lub uzupełnieniami, ale odświeżenie/pamięć podręczna może później dodać więcej wierszy; wiersze odświeżalne same w sobie nie są autorytatywne. Używaj `runtime`, gdy OpenClaw musi wczytać runtime dostawcy, aby poznać listę.

## Dokumentacja `modelIdNormalization`

Użyj `modelIdNormalization` do taniego, należącego do dostawcy czyszczenia identyfikatorów modeli, które musi nastąpić przed wczytaniem runtime dostawcy. Dzięki temu aliasy, takie jak krótkie nazwy modeli, lokalne dla dostawcy starsze identyfikatory i reguły prefiksów proxy, pozostają w manifeście właścicielskiego pluginu zamiast w tabelach wyboru modeli w rdzeniu.

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

| Pole                                 | Typ                     | Znaczenie                                                                                 |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Dokładne aliasy identyfikatorów modeli bez rozróżniania wielkości liter. Wartości są zwracane w zapisanej postaci. |
| `stripPrefixes`                      | `string[]`              | Prefiksy do usunięcia przed wyszukiwaniem aliasu, przydatne przy starszym duplikowaniu dostawca/model. |
| `prefixWhenBare`                     | `string`                | Prefiks do dodania, gdy znormalizowany identyfikator modelu nie zawiera jeszcze `/`.       |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Warunkowe reguły prefiksów dla prostych identyfikatorów po wyszukaniu aliasu, kluczowane przez `modelPrefix` i `prefix`. |

## Dokumentacja `providerEndpoints`

Użyj `providerEndpoints` do klasyfikacji punktów końcowych, którą ogólna polityka żądań musi znać przed wczytaniem runtime dostawcy. Rdzeń nadal jest właścicielem znaczenia każdej wartości `endpointClass`; manifesty pluginów są właścicielami metadanych hosta i bazowego URL.

Pola punktu końcowego:

| Pole                           | Typ        | Znaczenie                                                                                     |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Znana rdzeniowa klasa punktu końcowego, taka jak `openrouter`, `moonshot-native` lub `google-vertex`. |
| `hosts`                        | `string[]` | Dokładne nazwy hostów mapowane na klasę punktu końcowego.                                      |
| `hostSuffixes`                 | `string[]` | Sufiksy hostów mapowane na klasę punktu końcowego. Poprzedź `.` dla dopasowania wyłącznie sufiksu domeny. |
| `baseUrls`                     | `string[]` | Dokładne znormalizowane bazowe adresy URL HTTP(S) mapowane na klasę punktu końcowego.          |
| `googleVertexRegion`           | `string`   | Statyczny region Google Vertex dla dokładnych hostów globalnych.                               |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks do usunięcia z dopasowanych hostów, aby ujawnić prefiks regionu Google Vertex.          |

## Dokumentacja `providerRequest`

Użyj `providerRequest` do tanich metadanych zgodności żądań, których ogólna polityka żądań potrzebuje bez wczytywania runtime dostawcy. Przepisywanie ładunku właściwe dla danego zachowania trzymaj w hookach runtime dostawcy lub współdzielonych pomocnikach rodziny dostawców.

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

| Pole                  | Typ          | Znaczenie                                                                              |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etykieta rodziny dostawcy używana przez ogólne decyzje zgodności żądań i diagnostykę. |
| `compatibilityFamily` | `"moonshot"` | Opcjonalny koszyk zgodności rodziny dostawcy dla współdzielonych pomocników żądań.    |
| `openAICompletions`   | `object`     | Flagi żądań uzupełnień zgodnych z OpenAI, obecnie `supportsStreamingUsage`.           |

## Dokumentacja `modelPricing`

Użyj `modelPricing`, gdy dostawca potrzebuje zachowania cenowego płaszczyzny sterowania przed wczytaniem runtime. Pamięć podręczna cen Gateway odczytuje te metadane bez importowania kodu runtime dostawcy.

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
| `provider`                 | `string`           | Identyfikator dostawcy katalogu zewnętrznego, gdy różni się od identyfikatora dostawcy OpenClaw, na przykład `z-ai` dla dostawcy `zai`. |
| `passthroughProviderModel` | `boolean`          | Traktuj identyfikatory modeli zawierające ukośnik jako zagnieżdżone odwołania dostawca/model, przydatne dla dostawców proxy, takich jak OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Dodatkowe warianty identyfikatorów modeli katalogu zewnętrznego. `version-dots` próbuje identyfikatorów wersji z kropkami, takich jak `claude-opus-4.6`. |

### Indeks dostawców OpenClaw

Indeks dostawców OpenClaw to należące do OpenClaw metadane podglądu dla dostawców, których pluginy mogą jeszcze nie być zainstalowane. Nie jest częścią manifestu pluginu. Manifesty pluginów pozostają autorytetem dla zainstalowanych pluginów. Indeks dostawców jest wewnętrznym kontraktem awaryjnym, z którego będą korzystać przyszłe powierzchnie instalowalnych dostawców i selektora modeli przed instalacją, gdy plugin dostawcy nie jest zainstalowany.

Kolejność autorytetu katalogu:

1. Konfiguracja użytkownika.
2. `modelCatalog` manifestu zainstalowanego pluginu.
3. Pamięć podręczna katalogu modeli z jawnego odświeżenia.
4. Wiersze podglądu Indeksu dostawców OpenClaw.

Indeks dostawców nie może zawierać sekretów, stanu włączenia, hooków runtime ani danych modeli specyficznych dla aktywnego konta. Jego katalogi podglądu używają tego samego kształtu wiersza dostawcy `modelCatalog` co manifesty pluginów, ale powinny pozostać ograniczone do stabilnych metadanych wyświetlania, chyba że pola adaptera runtime, takie jak `api`, `baseUrl`, ceny lub flagi zgodności, są celowo utrzymywane w zgodności z manifestem zainstalowanego pluginu. Dostawcy z wykrywaniem na żywo przez `/models` powinni zapisywać odświeżone wiersze przez jawną ścieżkę pamięci podręcznej katalogu modeli zamiast wykonywać normalne listowanie lub onboarding przez wywołania API dostawcy.

Wpisy Indeksu dostawców mogą także przenosić metadane instalowalnego pluginu dla dostawców, których plugin został przeniesiony poza rdzeń lub w inny sposób nie jest jeszcze zainstalowany. Te metadane odzwierciedlają wzorzec katalogu kanałów: nazwa pakietu, specyfikacja instalacji npm, oczekiwana integralność i tanie etykiety wyboru uwierzytelniania wystarczą, aby pokazać instalowalną opcję konfiguracji. Po zainstalowaniu pluginu jego manifest wygrywa, a wpis Indeksu dostawców jest ignorowany dla tego dostawcy.

Starsze klucze możliwości najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby przenieść `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` i `webSearchProviders` pod `contracts`; normalne wczytywanie manifestu nie traktuje już tych pól najwyższego poziomu jako własności możliwości.

## Manifest a package.json

Te dwa pliki służą różnym celom:

| Plik                   | Do czego go używać                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Wykrywanie, walidacja konfiguracji, metadane wyboru uwierzytelniania i wskazówki UI, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadane npm, instalacja zależności i blok `openclaw` używany dla punktów wejścia, bramkowania instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie należy umieścić fragment metadanych, użyj tej reguły:

- jeśli OpenClaw musi to znać przed wczytaniem kodu pluginu, umieść to w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść to w `package.json`

### Pola package.json wpływające na wykrywanie

Niektóre metadane pluginu sprzed runtime celowo znajdują się w `package.json` pod blokiem `openclaw` zamiast w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Co oznacza                                                                                                                                                                               |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne punkty wejścia pluginu. Musi pozostać wewnątrz katalogu pakietu pluginu.                                                                                               |
| `openclaw.runtimeExtensions`                                      | Deklaruje zbudowane punkty wejścia środowiska uruchomieniowego JavaScript dla zainstalowanych pakietów. Musi pozostać wewnątrz katalogu pakietu pluginu.                                  |
| `openclaw.setupEntry`                                             | Lekki punkt wejścia wyłącznie do konfiguracji, używany podczas onboardingu, odroczonego uruchamiania kanału oraz odkrywania stanu kanału tylko do odczytu/SecretRef. Musi pozostać wewnątrz katalogu pakietu pluginu. |
| `openclaw.runtimeSetupEntry`                                      | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Wymaga `setupEntry`, musi istnieć i musi pozostać wewnątrz katalogu pakietu pluginu.              |
| `openclaw.channel`                                                | Tanie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                                                                        |
| `openclaw.channel.commands`                                       | Statyczne metadane natywnych poleceń i automatycznych domyślnych wartości natywnych umiejętności, używane przez konfigurację, audyt i powierzchnie list poleceń przed załadowaniem środowiska uruchomieniowego kanału. |
| `openclaw.channel.configuredState`                                | Lekkie metadane modułu sprawdzającego stan konfiguracji, który może odpowiedzieć „czy konfiguracja wyłącznie z env już istnieje?” bez ładowania pełnego środowiska uruchomieniowego kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane modułu sprawdzającego utrwalony stan uwierzytelnienia, który może odpowiedzieć „czy coś jest już zalogowane?” bez ładowania pełnego środowiska uruchomieniowego kanału.   |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla pluginów wbudowanych i publikowanych zewnętrznie.                                                                                                  |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                             |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, używająca dolnej granicy semver, takiej jak `>=2026.3.22` albo `>=2026.5.1-beta.1`.                                                         |
| `openclaw.install.expectedIntegrity`                              | Oczekiwany ciąg integralności dystrybucji npm, taki jak `sha512-...`; przepływy instalacji i aktualizacji weryfikują pobrany artefakt względem tej wartości.                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | Zezwala na wąską ścieżkę odzyskiwania przez ponowną instalację wbudowanego pluginu, gdy konfiguracja jest nieprawidłowa.                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala powierzchniom kanału wyłącznie do konfiguracji ładować się podczas uruchamiania przed pełnym pluginem kanału.                                                                    |

Metadane manifestu decydują, które wybory dostawcy/kanału/konfiguracji pojawiają się w
onboardingu przed załadowaniem środowiska uruchomieniowego. `package.json#openclaw.install` informuje
onboarding, jak pobrać lub włączyć ten plugin, gdy użytkownik wybierze jedną z tych
opcji. Nie przenoś wskazówek instalacji do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru
manifestów dla niewbudowanych źródeł pluginów. Nieprawidłowe wartości są odrzucane;
nowsze, ale prawidłowe wartości pomijają zewnętrzne pluginy na starszych hostach. Wbudowane źródłowe
pluginy zakłada się jako współwersjonowane z checkoutem hosta.

Dokładne przypinanie wersji npm już znajduje się w `npmSpec`, na przykład
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne wpisy katalogu zewnętrznego
powinny łączyć dokładne specyfikacje z `expectedIntegrity`, aby przepływy aktualizacji kończyły się
bezpieczną porażką, jeśli pobrany artefakt npm nie odpowiada już przypiętemu wydaniu.
Interaktywny onboarding nadal oferuje zaufane specyfikacje npm z rejestru, w tym same
nazwy pakietów i dist-tags, dla zgodności. Diagnostyka katalogu może
rozróżniać źródła dokładne, pływające, przypięte integralnością, bez integralności, z niezgodnością nazwy pakietu
oraz z nieprawidłowym wyborem domyślnym. Ostrzega także, gdy
`expectedIntegrity` jest obecne, ale nie ma prawidłowego źródła npm, które może przypiąć.
Gdy `expectedIntegrity` jest obecne,
przepływy instalacji/aktualizacji je egzekwują; gdy jest pominięte, rozstrzygnięcie rejestru jest
zapisywane bez przypięcia integralności.

Pluginy kanałów powinny dostarczać `openclaw.setupEntry`, gdy status, lista kanałów
lub skany SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego
środowiska uruchomieniowego. Punkt wejścia konfiguracji powinien udostępniać metadane kanału oraz bezpieczne dla konfiguracji adaptery konfiguracji,
statusu i sekretów; klientów sieciowych, listenery Gateway i
środowiska uruchomieniowe transportu trzymaj w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia środowiska uruchomieniowego nie zastępują kontroli granic pakietu dla źródłowych
pól punktów wejścia. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że
wychodząca poza granice ścieżka `openclaw.extensions` będzie możliwa do załadowania.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie sprawia,
że dowolne uszkodzone konfiguracje stają się możliwe do zainstalowania. Obecnie pozwala tylko przepływom instalacji
odzyskać stan po określonych nieaktualnych awariach aktualizacji wbudowanego pluginu, takich jak
brakująca ścieżka wbudowanego pluginu albo nieaktualny wpis `channels.<id>` dla tego samego
wbudowanego pluginu. Niepowiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
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

Używaj go, gdy przepływy konfiguracji, doctor, statusu lub obecności tylko do odczytu potrzebują taniego
sondowania uwierzytelnienia tak/nie przed załadowaniem pełnego pluginu kanału. Utrwalony stan uwierzytelnienia nie jest
skonfigurowanym stanem kanału: nie używaj tych metadanych do automatycznego włączania pluginów,
naprawiania zależności środowiska uruchomieniowego ani decydowania, czy środowisko uruchomieniowe kanału powinno się załadować.
Docelowy eksport powinien być małą funkcją, która odczytuje tylko utrwalony stan; nie
prowadź go przez pełny barrel środowiska uruchomieniowego kanału.

`openclaw.channel.configuredState` używa tego samego kształtu dla tanich sprawdzeń konfiguracji
wyłącznie z env:

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

Używaj go, gdy kanał może odpowiedzieć na stan konfiguracji na podstawie env lub innych małych
wejść niepochodzących ze środowiska uruchomieniowego. Jeśli sprawdzenie wymaga pełnego rozstrzygania konfiguracji albo rzeczywistego
środowiska uruchomieniowego kanału, trzymaj tę logikę zamiast tego w hooku pluginu `config.hasConfiguredState`.

## Kolejność odkrywania (zduplikowane identyfikatory pluginów)

OpenClaw odkrywa pluginy z kilku katalogów głównych (wbudowane, instalacja globalna, workspace, jawne ścieżki wybrane w konfiguracji). Jeśli dwa odkrycia mają ten sam `id`, zachowywany jest tylko manifest o **najwyższym priorytecie**; duplikaty o niższym priorytecie są odrzucane zamiast ładowania obok niego.

Priorytet, od najwyższego do najniższego:

1. **Wybrany w konfiguracji** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Wbudowany** — pluginy dostarczane z OpenClaw
3. **Instalacja globalna** — pluginy zainstalowane w globalnym katalogu głównym pluginów OpenClaw
4. **Workspace** — pluginy odkryte względem bieżącego workspace

Konsekwencje:

- Rozwidlona lub nieaktualna kopia wbudowanego pluginu znajdująca się w workspace nie przesłoni wbudowanej kompilacji.
- Aby faktycznie zastąpić wbudowany plugin lokalnym, przypnij go przez `plugins.entries.<id>`, aby wygrał dzięki priorytetowi, zamiast polegać na odkrywaniu w workspace.
- Odrzucone duplikaty są logowane, aby diagnostyka Doctor i uruchamiania mogła wskazać odrzuconą kopię.
- Zduplikowane nadpisania wybrane w konfiguracji są opisywane w diagnostyce jako jawne nadpisania, ale nadal ostrzegają, aby nieaktualne forki i przypadkowe przesłonięcia pozostały widoczne.

## Wymagania JSON Schema

- **Każdy plugin musi dostarczać JSON Schema**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest dopuszczalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w czasie działania.
- Podczas rozszerzania lub forkowania wbudowanego pluginu o nowe klucze konfiguracji zaktualizuj jednocześnie `configSchema` w `openclaw.plugin.json` tego pluginu. Schematy wbudowanych pluginów są restrykcyjne, więc dodanie `plugins.entries.<id>.config.myNewKey` w konfiguracji użytkownika bez dodania `myNewKey` do `configSchema.properties` zostanie odrzucone przed załadowaniem środowiska uruchomieniowego pluginu.

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
  muszą odwoływać się do **możliwych do odkrycia** identyfikatorów pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor raportuje błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja zostaje zachowana, a
  **ostrzeżenie** pojawia się w Doctor + logach.

Zobacz [Odwołanie konfiguracji](/pl/gateway/configuration), aby uzyskać pełny schemat `plugins.*`.

## Uwagi

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym dla wczytywania z lokalnego systemu plików. Runtime nadal wczytuje moduł pluginu osobno; manifest służy wyłącznie do wykrywania i walidacji.
- Natywne manifesty są parsowane za pomocą JSON5, więc komentarze, końcowe przecinki i klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestów odczytuje tylko udokumentowane pola manifestu. Unikaj niestandardowych kluczy najwyższego poziomu.
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy plugin ich nie potrzebuje.
- `providerDiscoveryEntry` musi pozostać lekkie i nie powinno importować szerokiego kodu runtime; używaj go do statycznych metadanych katalogu providerów lub wąskich deskryptorów wykrywania, a nie do wykonywania w czasie obsługi żądania.
- Wyłączne rodzaje pluginów wybiera się przez `plugins.slots.*`: `kind: "memory"` przez `plugins.slots.memory`, `kind: "context-engine"` przez `plugins.slots.contextEngine` (domyślnie `legacy`).
- Zadeklaruj wyłączny rodzaj pluginu w tym manifeście. `OpenClawPluginDefinition.kind` we wpisie runtime jest przestarzałe i pozostaje tylko jako fallback zgodności dla starszych pluginów.
- Metadane zmiennych środowiskowych (`setup.providers[].envVars`, przestarzałe `providerAuthEnvVars` i `channelEnvVars`) są wyłącznie deklaratywne. Status, audyt, walidacja dostarczania Cron i inne powierzchnie tylko do odczytu nadal stosują zaufanie do pluginu oraz efektywną politykę aktywacji przed uznaniem zmiennej środowiskowej za skonfigurowaną.
- Metadane kreatora runtime wymagające kodu providera opisano w sekcji [Hooki runtime providera](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli plugin zależy od modułów natywnych, udokumentuj kroki budowania oraz wszelkie wymagania dotyczące listy dozwolonych elementów menedżera pakietów (na przykład pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Powiązane

<CardGroup cols={3}>
  <Card title="Budowanie pluginów" href="/pl/plugins/building-plugins" icon="rocket">
    Pierwsze kroki z pluginami.
  </Card>
  <Card title="Architektura pluginów" href="/pl/plugins/architecture" icon="diagram-project">
    Architektura wewnętrzna i model możliwości.
  </Card>
  <Card title="Omówienie SDK" href="/pl/plugins/sdk-overview" icon="book">
    Dokumentacja Plugin SDK i importy podścieżek.
  </Card>
</CardGroup>
