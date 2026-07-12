---
read_when:
    - Tworzysz plugin OpenClaw
    - Musisz wdrożyć schemat konfiguracji pluginu lub debugować błędy walidacji pluginu
summary: Wymagania dotyczące manifestu Pluginu i schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Pluginu
x-i18n:
    generated_at: "2026-07-12T15:25:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Ta strona opisuje **natywny manifest Pluginu OpenClaw**, `openclaw.plugin.json`. Informacje o zgodnych układach pakietów (Codex, Claude, Cursor) zawiera strona [Pakiety Pluginów](/pl/plugins/bundles).

Zgodne formaty pakietów używają zamiast niego własnych plików manifestu:

- Pakiet Codex: `.codex-plugin/plugin.json`
- Pakiet Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentów Claude bez manifestu
- Pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa te układy, ale nie sprawdza ich zgodności z poniższym schematem `openclaw.plugin.json`. W przypadku zgodnego pakietu OpenClaw odczytuje metadane pakietu, zadeklarowane katalogi główne Skills, katalogi główne poleceń Claude, wartości domyślne Claude z pliku `settings.json`, wartości domyślne LSP Claude oraz obsługiwane pakiety hooków, jeśli układ spełnia wymagania środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** zawierać plik `openclaw.plugin.json` w **katalogu głównym Pluginu**. OpenClaw odczytuje go, aby zweryfikować konfigurację **bez wykonywania kodu Pluginu**. Brakujący lub nieprawidłowy manifest uniemożliwia weryfikację konfiguracji i jest traktowany jako błąd Pluginu.

Pełny przewodnik po systemie Pluginów zawiera strona [Pluginy](/pl/tools/plugin), a opis natywnego modelu możliwości i aktualne wytyczne dotyczące zgodności zewnętrznej — strona [Model możliwości](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` zawiera metadane odczytywane przez OpenClaw **przed załadowaniem kodu Pluginu**. Sprawdzenie wszystkich zawartych w nim danych musi być na tyle lekkie, aby nie wymagało uruchamiania środowiska wykonawczego Pluginu.

**Używaj go do definiowania:**

- tożsamości Pluginu, walidacji konfiguracji i podpowiedzi interfejsu konfiguracji
- metadanych uwierzytelniania, wdrażania i konfiguracji (aliasu, automatycznego włączania, zmiennych środowiskowych dostawcy i opcji uwierzytelniania)
- wskazówek aktywacji dla powierzchni płaszczyzny sterowania
- skróconej deklaracji własności rodzin modeli
- statycznych migawek własności możliwości (`contracts`)
- metadanych modułu uruchamiającego QA, które może odczytać współdzielony host `openclaw qa`
- metadanych konfiguracji specyficznych dla kanału, scalanych z katalogiem i powierzchniami walidacji

**Nie używaj go do:** rejestrowania zachowania w środowisku uruchomieniowym, deklarowania punktów wejścia kodu ani metadanych instalacji npm. Należą one do kodu Pluginu i pliku `package.json`.

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

## Opis pól najwyższego poziomu

| Pole                                 | Wymagane | Typ                          | Znaczenie                                                                                                                                                                                                                                                                  |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Tak      | `string`                     | Kanoniczny identyfikator pluginu. Jest to identyfikator używany w `plugins.entries.<id>`.                                                                                                                                                                                   |
| `configSchema`                       | Tak      | `object`                     | Wbudowany schemat JSON konfiguracji tego pluginu.                                                                                                                                                                                                                           |
| `requiresPlugins`                    | Nie      | `string[]`                   | Identyfikatory pluginów, które również muszą być zainstalowane, aby ten plugin działał. Mechanizm wykrywania zachowuje możliwość załadowania pluginu, ale ostrzega, gdy brakuje któregokolwiek wymaganego pluginu.                                                            |
| `enabledByDefault`                   | Nie      | `true`                       | Oznacza dołączony plugin jako domyślnie włączony. Pominięcie tego pola lub ustawienie wartości innej niż `true` pozostawia plugin domyślnie wyłączony.                                                                                                                       |
| `enabledByDefaultOnPlatforms`        | Nie      | `string[]`                   | Oznacza dołączony plugin jako domyślnie włączony wyłącznie na wymienionych platformach Node.js, na przykład `["darwin"]`. Jawna konfiguracja nadal ma pierwszeństwo.                                                                                                        |
| `legacyPluginIds`                    | Nie      | `string[]`                   | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                                                                                          |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                   | Identyfikatory dostawców, które powinny automatycznie włączać ten plugin, gdy odwołania do uwierzytelniania, konfiguracji lub modeli je wskazują.                                                                                                                            |
| `kind`                               | Nie      | `PluginKind \| PluginKind[]` | Deklaruje jeden lub więcej wyłącznych rodzajów pluginu (`"memory"`, `"context-engine"`) używanych przez `plugins.slots.*`. Plugin będący właścicielem obu miejsc deklaruje oba rodzaje w jednej tablicy.                                                                      |
| `channels`                           | Nie      | `string[]`                   | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                                                         |
| `providers`                          | Nie      | `string[]`                   | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                                                                                                        |
| `providerCatalogEntry`               | Nie      | `string`                     | Ścieżka do lekkiego modułu katalogu dostawcy, względna wobec katalogu głównego pluginu, przeznaczonego na metadane katalogu dostawcy z zakresu manifestu, które można załadować bez aktywowania pełnego środowiska wykonawczego pluginu.                                        |
| `modelSupport`                       | Nie      | `object`                     | Skrócone metadane rodzin modeli należące do manifestu, używane do automatycznego ładowania pluginu przed uruchomieniem środowiska wykonawczego.                                                                                                                             |
| `modelCatalog`                       | Nie      | `object`                     | Deklaratywne metadane katalogu modeli dla dostawców należących do tego pluginu. Jest to kontrakt warstwy sterującej na potrzeby przyszłego listowania tylko do odczytu, wdrażania, selektorów modeli, aliasów i wykluczania bez ładowania środowiska wykonawczego pluginu.     |
| `modelPricing`                       | Nie      | `object`                     | Należące do dostawcy zasady zewnętrznego wyszukiwania cen. Służą do wyłączania lokalnych lub samodzielnie hostowanych dostawców ze zdalnych katalogów cen albo mapowania odwołań do dostawców na identyfikatory katalogów OpenRouter/LiteLLM bez wpisywania ich na stałe w rdzeniu. |
| `modelIdNormalization`               | Nie      | `object`                     | Należące do dostawcy porządkowanie aliasów i prefiksów identyfikatorów modeli, które musi zostać wykonane przed załadowaniem środowiska wykonawczego dostawcy.                                                                                                               |
| `providerEndpoints`                  | Nie      | `object[]`                   | Należące do manifestu metadane hosta i `baseUrl` punktów końcowych tras dostawcy, które rdzeń musi sklasyfikować przed załadowaniem środowiska wykonawczego dostawcy.                                                                                                       |
| `providerRequest`                    | Nie      | `object`                     | Lekkie metadane rodziny dostawcy i zgodności żądań używane przez ogólne zasady obsługi żądań przed załadowaniem środowiska wykonawczego dostawcy.                                                                                                                           |
| `secretProviderIntegrations`         | Nie      | `Record<string, object>`     | Deklaratywne ustawienia wstępne dostawcy wykonawczego SecretRef, które interfejsy konfiguracji lub instalacji mogą oferować bez wpisywania na stałe w rdzeniu integracji właściwych dla dostawców.                                                                           |
| `cliBackends`                        | Nie      | `string[]`                   | Identyfikatory mechanizmów wnioskowania CLI należących do tego pluginu. Używane do automatycznej aktywacji podczas uruchamiania na podstawie jawnych odwołań w konfiguracji.                                                                                                |
| `syntheticAuthRefs`                  | Nie      | `string[]`                   | Odwołania do dostawcy lub mechanizmu CLI, dla których należący do pluginu syntetyczny punkt zaczepienia uwierzytelniania powinien zostać sprawdzony podczas wykrywania modelu na zimno, przed załadowaniem środowiska wykonawczego.                                           |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                   | Należące do dołączonego pluginu zastępcze wartości klucza API, które reprezentują lokalny, OAuth lub środowiskowy stan danych uwierzytelniających niebędący sekretem.                                                                                                      |
| `commandAliases`                     | Nie      | `object[]`                   | Nazwy poleceń należących do tego pluginu, które powinny generować diagnostykę konfiguracji i CLI uwzględniającą plugin przed załadowaniem środowiska wykonawczego.                                                                                                          |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`   | Przestarzałe metadane zmiennych środowiskowych zgodności używane do wyszukiwania uwierzytelniania lub stanu dostawcy. W nowych pluginach preferuj `setup.providers[].envVars`; OpenClaw nadal odczytuje te dane w okresie wycofywania.                                       |
| `providerUsageAuthEnvVars`           | Nie      | `Record<string, string[]>`   | Dane uwierzytelniające dostawcy przeznaczone wyłącznie do użycia i rozliczeń. OpenClaw używa tych nazw do wykrywania użycia i usuwania sekretów, ale nigdy do uwierzytelniania wnioskowania.                                                                                   |
| `providerAuthAliases`                | Nie      | `Record<string, string>`     | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący klucz API i profile uwierzytelniania dostawcy bazowego.                                                    |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`   | Lekkie metadane zmiennych środowiskowych kanału, które OpenClaw może sprawdzać bez ładowania kodu pluginu. Używaj ich w interfejsach konfiguracji kanału lub uwierzytelniania sterowanych zmiennymi środowiskowymi, które powinny być widoczne dla ogólnych mechanizmów.         |
| `providerAuthChoices`                | Nie      | `object[]`                   | Lekkie metadane opcji uwierzytelniania dla selektorów wdrażania, rozstrzygania preferowanego dostawcy i prostego podłączania flag CLI.                                                                                                                                      |
| `activation`                         | Nie      | `object`                     | Lekkie metadane planisty aktywacji dotyczące ładowania wyzwalanego przez uruchomienie, dostawcę, polecenie, kanał, trasę lub funkcję. Obejmują wyłącznie metadane; środowisko wykonawcze pluginu nadal odpowiada za faktyczne zachowanie.                                      |
| `setup`                              | Nie      | `object`                     | Lekkie deskryptory konfiguracji i wdrażania, które mechanizmy wykrywania oraz interfejsy konfiguracji mogą sprawdzać bez ładowania środowiska wykonawczego pluginu.                                                                                                        |
| `qaRunners`                          | Nie      | `object[]`                   | Lekkie deskryptory mechanizmów uruchamiających QA, używane przez współdzielony host `openclaw qa` przed załadowaniem środowiska wykonawczego pluginu.                                                                                                                       |
| `contracts`                          | Nie      | `object`                     | Statyczny obraz własności funkcji dla zewnętrznych punktów zaczepienia uwierzytelniania, osadzeń, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia multimediów, generowania obrazów, filmów i muzyki, pobierania oraz wyszukiwania w sieci, dostawców procesów roboczych, wyodrębniania treści dokumentów i stron internetowych oraz własności narzędzi. |
| `configContracts`                    | Nie      | `object`                     | Należące do manifestu zachowanie konfiguracji używane przez ogólne mechanizmy rdzenia: wykrywanie niebezpiecznych flag, cele migracji SecretRef i zawężanie starszych ścieżek konfiguracji. Zobacz [dokumentację configContracts](#configcontracts-reference).                  |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`     | Lekkie metadane domyślne rozumienia multimediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                                                                     |
| `imageGenerationProviderMetadata`    | Nie      | `Record<string, object>`     | Lekkie metadane uwierzytelniania generowania obrazów dla identyfikatorów dostawców zadeklarowanych w `contracts.imageGenerationProviders`, w tym aliasy uwierzytelniania należące do dostawcy oraz zabezpieczenia bazowego adresu URL.                                        |
| `videoGenerationProviderMetadata`    | Nie      | `Record<string, object>`     | Lekkie metadane uwierzytelniania generowania wideo dla identyfikatorów dostawców zadeklarowanych w `contracts.videoGenerationProviders`, w tym aliasy uwierzytelniania należące do dostawcy oraz zabezpieczenia bazowego adresu URL.                                          |
| `musicGenerationProviderMetadata`    | Nie      | `Record<string, object>`     | Lekkie metadane uwierzytelniania generowania muzyki dla identyfikatorów dostawców zadeklarowanych w `contracts.musicGenerationProviders`, w tym aliasy uwierzytelniania należące do dostawcy oraz zabezpieczenia bazowego adresu URL.                                        |
| `toolMetadata`                       | Nie      | `Record<string, object>`     | Lekkie metadane dostępności narzędzi należących do pluginu, zadeklarowanych w `contracts.tools`. Użyj ich, gdy narzędzie nie powinno ładować środowiska wykonawczego, dopóki nie istnieją dane potwierdzające konfigurację, zmienne środowiskowe lub uwierzytelnienie.           |
| `channelConfigs`                     | Nie      | `Record<string, object>`     | Metadane konfiguracji kanałów należące do manifestu, scalane z obszarami wykrywania i walidacji przed załadowaniem środowiska wykonawczego.                                                                                                                                  |
| `skills`                             | Nie      | `string[]`                   | Katalogi Skills do załadowania, określone względem katalogu głównego pluginu.                                                                                                                                                                                               |
| `name`                               | Nie      | `string`                     | Czytelna dla użytkownika nazwa pluginu.                                                                                                                                                                                                                                    |
| `description`                        | Nie      | `string`                     | Krótkie podsumowanie wyświetlane w interfejsach pluginu.                                                                                                                                                                                                                    |
| `catalog`                            | Nie      | `object`                     | Opcjonalne wskazówki dotyczące prezentacji w interfejsach katalogu pluginów. Te metadane nie instalują ani nie włączają pluginu i nie nadają mu zaufania.                                                                                                                    |
| `icon`                               | Nie      | `string`                     | Adres URL obrazu HTTPS dla kart w marketplace lub katalogu. ClawHub akceptuje każdy prawidłowy adres URL `https://` i używa domyślnej ikony pluginu, gdy wartość zostanie pominięta lub jest nieprawidłowa.                                                                    |
| `version`                            | Nie      | `string`                     | Informacyjna wersja pluginu.                                                                                                                                                                                                                                               |
| `uiHints`                            | Nie      | `Record<string, object>`     | Etykiety interfejsu użytkownika, teksty zastępcze i wskazówki dotyczące poufności pól konfiguracji.                                                                                                                                                                         |

## Informacje o `catalog`

`catalog` udostępnia opcjonalne wskazówki dotyczące wyświetlania dla przeglądarek Pluginów. Hosty mogą ignorować te wskazówki. Nigdy nie instalują ani nie włączają one Pluginu oraz nie zmieniają jego zachowania w czasie działania ani poziomu zaufania.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Pole       | Typ       | Znaczenie                                                                                     |
| ---------- | --------- | --------------------------------------------------------------------------------------------- |
| `featured` | `boolean` | Określa, czy powierzchnie katalogu powinny wyróżniać ten Plugin.                              |
| `order`    | `number`  | Rosnąca wskazówka kolejności wyświetlania wyselekcjonowanych Pluginów; niższe wartości są wcześniej. |

## Informacje o metadanych dostawcy generowania

Pola metadanych dostawcy generowania opisują statyczne sygnały uwierzytelniania dla dostawców zadeklarowanych na odpowiedniej liście `contracts.*GenerationProviders`. OpenClaw odczytuje te pola przed załadowaniem środowiska uruchomieniowego dostawcy, aby podstawowe narzędzia mogły ustalić dostępność dostawcy generowania bez importowania każdego Pluginu dostawcy.

Używaj tych pól wyłącznie do prostych faktów deklaratywnych, których sprawdzanie jest mało kosztowne. Transport, przekształcenia żądań, odświeżanie tokenów, weryfikacja danych uwierzytelniających i faktyczne generowanie pozostają w środowisku uruchomieniowym Pluginu.

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

Każdy wpis metadanych obsługuje następujące pola:

| Pole                   | Wymagane | Typ        | Znaczenie                                                                                                                                                           |
| ---------------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Nie      | `string[]` | Dodatkowe identyfikatory dostawców, które powinny być traktowane jako statyczne aliasy uwierzytelniania dostawcy generowania.                                        |
| `authProviders`        | Nie      | `string[]` | Identyfikatory dostawców, których skonfigurowane profile uwierzytelniania powinny być uznawane za uwierzytelnienie tego dostawcy generowania.                         |
| `configSignals`        | Nie      | `object[]` | Proste sygnały dostępności oparte wyłącznie na konfiguracji dla dostawców lokalnych lub hostowanych samodzielnie, których można skonfigurować bez profili uwierzytelniania ani zmiennych środowiskowych. |
| `authSignals`          | Nie      | `object[]` | Jawne sygnały uwierzytelniania. Jeśli są obecne, zastępują domyślny zestaw sygnałów wynikający z identyfikatora dostawcy, `aliases` i `authProviders`.                |
| `referenceAudioInputs` | Nie      | `boolean`  | Tylko generowanie wideo. Ustaw `true`, gdy dostawca przyjmuje referencyjne zasoby audio; w przeciwnym razie `video_generate` ukrywa parametry referencyjnego audio.  |

Każdy wpis `configSignals` obsługuje następujące pola:

| Pole             | Wymagane | Typ        | Znaczenie                                                                                                                                                                                                           |
| ---------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Tak      | `string`   | Ścieżka z segmentami rozdzielonymi kropkami do należącego do Pluginu obiektu konfiguracji, który ma zostać sprawdzony, na przykład `plugins.entries.example.config`.                                                  |
| `overlayPath`    | Nie      | `string`   | Ścieżka z segmentami rozdzielonymi kropkami wewnątrz konfiguracji głównej do obiektu, który przed oceną sygnału powinien nadpisać obiekt główny. Używaj jej dla konfiguracji określonych możliwości, takich jak `image`, `video` lub `music`. |
| `overlayMapPath` | Nie      | `string`   | Ścieżka z segmentami rozdzielonymi kropkami wewnątrz konfiguracji głównej do obiektu, którego każda wartość powinna nadpisać obiekt główny. Używaj jej dla map nazwanych kont, takich jak `accounts`, gdzie wystarczy dowolne skonfigurowane konto. |
| `required`       | Nie      | `string[]` | Ścieżki z segmentami rozdzielonymi kropkami wewnątrz wynikowej konfiguracji, które muszą mieć skonfigurowane wartości. Ciągi znaków nie mogą być puste; obiekty i tablice również nie mogą być puste.                    |
| `requiredAny`    | Nie      | `string[]` | Ścieżki z segmentami rozdzielonymi kropkami wewnątrz wynikowej konfiguracji, spośród których co najmniej jedna musi mieć skonfigurowaną wartość.                                                                      |
| `mode`           | Nie      | `object`   | Opcjonalny warunek trybu tekstowego wewnątrz wynikowej konfiguracji. Używaj go, gdy dostępność oparta wyłącznie na konfiguracji dotyczy tylko jednego trybu.                                                          |

Każdy warunek `mode` obsługuje następujące pola:

| Pole         | Wymagane | Typ        | Znaczenie                                                                                                      |
| ------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `path`       | Nie      | `string`   | Ścieżka z segmentami rozdzielonymi kropkami wewnątrz wynikowej konfiguracji. Wartość domyślna to `mode`.       |
| `default`    | Nie      | `string`   | Wartość trybu używana, gdy konfiguracja nie zawiera tej ścieżki.                                               |
| `allowed`    | Nie      | `string[]` | Jeśli pole jest obecne, sygnał przechodzi tylko wtedy, gdy wynikowy tryb ma jedną z tych wartości.             |
| `disallowed` | Nie      | `string[]` | Jeśli pole jest obecne, sygnał nie przechodzi, gdy wynikowy tryb ma jedną z tych wartości.                     |

Każdy wpis `authSignals` obsługuje następujące pola:

| Pole              | Wymagane | Typ      | Znaczenie                                                                                                                                                                                     |
| ----------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Tak      | `string` | Identyfikator dostawcy do sprawdzenia w skonfigurowanych profilach uwierzytelniania.                                                                                                           |
| `providerBaseUrl` | Nie      | `object` | Opcjonalny warunek, który sprawia, że sygnał jest uwzględniany tylko wtedy, gdy wskazany skonfigurowany dostawca używa dozwolonego bazowego adresu URL. Używaj go, gdy alias uwierzytelniania jest prawidłowy tylko dla określonych API. |

Każdy warunek `providerBaseUrl` obsługuje następujące pola:

| Pole              | Wymagane | Typ        | Znaczenie                                                                                                                                                                |
| ----------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Tak      | `string`   | Identyfikator konfiguracji dostawcy, którego wartość `baseUrl` ma zostać sprawdzona.                                                                                      |
| `defaultBaseUrl`  | Nie      | `string`   | Bazowy adres URL przyjmowany, gdy konfiguracja dostawcy nie zawiera `baseUrl`.                                                                                            |
| `allowedBaseUrls` | Tak      | `string[]` | Dozwolone bazowe adresy URL dla tego sygnału uwierzytelniania. Sygnał jest ignorowany, gdy skonfigurowany lub domyślny bazowy adres URL nie odpowiada żadnej z tych znormalizowanych wartości. |

## Informacje o metadanych narzędzi

`toolMetadata` używa takich samych struktur `configSignals` i `authSignals` jak metadane dostawcy generowania, indeksowanych według nazwy narzędzia. `contracts.tools` deklaruje własność. `toolMetadata` deklaruje proste dowody dostępności, aby OpenClaw nie musiał importować środowiska uruchomieniowego Pluginu tylko po to, by jego fabryka narzędzi zwróciła `null`.

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

Wpisy `toolMetadata` przyjmują również pola `optional` (oznacza narzędzie jako niewymagane do aktywacji Pluginu) i `replaySafe` (oznacza wykonanie narzędzia jako bezpieczne do powtórzenia po niepełnej turze modelu), oprócz wspólnych pól `configSignals`/`authSignals` opisanych powyżej.

Jeśli narzędzie nie ma `toolMetadata`, OpenClaw zachowuje dotychczasowe działanie i ładuje Plugin będący właścicielem, gdy kontrakt narzędzia jest zgodny z zasadami. W przypadku narzędzi używanych na ścieżkach krytycznych, których fabryka zależy od uwierzytelniania lub konfiguracji, autorzy Pluginów powinni zadeklarować `toolMetadata`, zamiast zmuszać rdzeń do importowania środowiska uruchomieniowego w celu wykonania sprawdzenia.

## Informacje o `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jedną opcję wdrożenia początkowego lub uwierzytelniania. OpenClaw odczytuje go przed załadowaniem środowiska uruchomieniowego dostawcy. Listy konfiguracji dostawców korzystają z tych opcji manifestu, opcji konfiguracji pochodzących z deskryptorów oraz metadanych katalogu instalacyjnego bez ładowania środowiska uruchomieniowego dostawcy.

| Pole                  | Wymagane | Typ                                                                  | Znaczenie                                                                                                                      |
| --------------------- | -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `provider`            | Tak      | `string`                                                             | Identyfikator dostawcy, do którego należy ten wybór.                                                                            |
| `method`              | Tak      | `string`                                                             | Identyfikator metody uwierzytelniania, do której należy przekazać obsługę.                                                       |
| `choiceId`            | Tak      | `string`                                                             | Stabilny identyfikator wyboru uwierzytelniania używany w procesach wdrażania i CLI.                                              |
| `choiceLabel`         | Nie      | `string`                                                             | Etykieta widoczna dla użytkownika. Jeśli ją pominięto, OpenClaw używa `choiceId`.                                                |
| `choiceHint`          | Nie      | `string`                                                             | Krótki tekst pomocniczy dla selektora.                                                                                           |
| `assistantPriority`   | Nie      | `number`                                                             | Niższe wartości są wyświetlane wcześniej w interaktywnych selektorach obsługiwanych przez asystenta.                            |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                                       | Ukrywa wybór w selektorach asystenta, nadal umożliwiając ręczny wybór w CLI.                                                     |
| `deprecatedChoiceIds` | Nie      | `string[]`                                                           | Starsze identyfikatory wyboru, które powinny przekierowywać użytkowników do tego wyboru zastępczego.                             |
| `groupId`             | Nie      | `string`                                                             | Opcjonalny identyfikator grupy służący do grupowania powiązanych wyborów.                                                        |
| `groupLabel`          | Nie      | `string`                                                             | Etykieta tej grupy widoczna dla użytkownika.                                                                                     |
| `groupHint`           | Nie      | `string`                                                             | Krótki tekst pomocniczy dla grupy.                                                                                               |
| `onboardingFeatured`  | Nie      | `boolean`                                                            | Wyświetla tę grupę w wyróżnionej sekcji interaktywnego selektora wdrażania, przed pozycją „Więcej…”.                             |
| `optionKey`           | Nie      | `string`                                                             | Wewnętrzny klucz opcji dla prostych procesów uwierzytelniania z jedną flagą.                                                     |
| `cliFlag`             | Nie      | `string`                                                             | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                                             |
| `cliOption`           | Nie      | `string`                                                             | Pełna postać opcji CLI, na przykład `--openrouter-api-key <key>`.                                                                |
| `cliDescription`      | Nie      | `string`                                                             | Opis używany w pomocy CLI.                                                                                                       |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Określa, w których obszarach wdrażania ma pojawiać się ten wybór. Jeśli pole pominięto, wartością domyślną jest `["text-inference"]`. |

## Dokumentacja `commandAliases`

Użyj `commandAliases`, gdy plugin jest właścicielem nazwy polecenia środowiska uruchomieniowego, którą użytkownicy mogą omyłkowo umieścić w `plugins.allow` lub próbować uruchomić jako główne polecenie CLI. OpenClaw używa tych metadanych do diagnostyki bez importowania kodu środowiska uruchomieniowego pluginu.

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

| Pole         | Wymagane | Typ               | Znaczenie                                                                                   |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należącego do tego pluginu.                                                  |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie czatu z ukośnikiem, a nie jako główne polecenie CLI.            |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI sugerowane do operacji CLI, jeśli takie istnieje.             |

## Dokumentacja `activation`

Użyj `activation`, gdy plugin może niewielkim kosztem zadeklarować, które zdarzenia płaszczyzny sterowania powinny uwzględniać go w planie aktywacji lub ładowania.

Ten blok zawiera metadane planisty, a nie interfejs API cyklu życia. Nie rejestruje zachowania środowiska uruchomieniowego, nie zastępuje `register(...)` ani nie gwarantuje, że kod pluginu został już wykonany. Planista aktywacji używa tych pól do zawężenia listy pluginów kandydujących, zanim skorzysta z istniejących metadanych własności w manifeście, takich jak `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` i hooki.

Preferuj najbardziej szczegółowe metadane, które już opisują własność. Używaj `providers`, `channels`, `commandAliases`, deskryptorów konfiguracji lub `contracts`, gdy te pola wyrażają daną relację. Używaj `activation` do dodatkowych wskazówek dla planisty, których nie można przedstawić za pomocą tych pól własności. Używaj `cliBackends` najwyższego poziomu dla aliasów środowiska uruchomieniowego CLI, takich jak `claude-cli`, `my-cli` lub `google-gemini-cli`; `activation.onAgentHarnesses` służy wyłącznie do identyfikatorów osadzonych uprzęży agentów, które nie mają jeszcze pola własności.

Każdy plugin powinien jawnie ustawić `activation.onStartup`. Ustaw wartość `true` tylko wtedy, gdy plugin musi działać podczas uruchamiania Gateway. Ustaw wartość `false`, gdy plugin pozostaje nieaktywny podczas uruchamiania i powinien być ładowany wyłącznie przez bardziej szczegółowe wyzwalacze. Pominięcie `onStartup` nie powoduje już niejawnego ładowania pluginu podczas uruchamiania; użyj jawnych metadanych aktywacji dla uruchamiania, kanału, konfiguracji, uprzęży agenta, pamięci lub innych bardziej szczegółowych wyzwalaczy aktywacji.

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

| Pole               | Wymagane | Typ                                                  | Znaczenie                                                                                                                                                                                                 |
| ------------------ | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nie      | `boolean`                                            | Jawna aktywacja podczas uruchamiania Gateway. Każdy plugin powinien ją ustawić. `true` importuje plugin podczas uruchamiania; `false` opóźnia jego ładowanie podczas uruchamiania, chyba że wymaga go inny pasujący wyzwalacz. |
| `onProviders`      | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny uwzględniać ten plugin w planach aktywacji lub ładowania.                                                                                                          |
| `onAgentHarnesses` | Nie      | `string[]`                                           | Identyfikatory środowisk uruchomieniowych osadzonych uprzęży agentów, które powinny uwzględniać ten plugin w planach aktywacji lub ładowania. Dla aliasów backendu CLI użyj `cliBackends` najwyższego poziomu. |
| `onCommands`       | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględniać ten plugin w planach aktywacji lub ładowania.                                                                                                            |
| `onChannels`       | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględniać ten plugin w planach aktywacji lub ładowania.                                                                                                            |
| `onRoutes`         | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględniać ten plugin w planach aktywacji lub ładowania.                                                                                                                      |
| `onConfigPaths`    | Nie      | `string[]`                                           | Ścieżki konfiguracji względem katalogu głównego, które powinny uwzględniać ten plugin w planach uruchamiania lub ładowania, gdy ścieżka istnieje i nie została jawnie wyłączona.                             |
| `onCapabilities`   | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Ogólne wskazówki dotyczące możliwości używane przez planowanie aktywacji płaszczyzny sterowania. Gdy to możliwe, preferuj bardziej szczegółowe pola.                                                        |

Bieżący aktywni odbiorcy:

- Planowanie uruchamiania Gateway używa `activation.onStartup` do jawnego importu podczas uruchamiania.
- Planowanie CLI wyzwalane poleceniami korzysta awaryjnie ze starszego `commandAliases[].cliCommand` lub `commandAliases[].name`.
- Planowanie uruchamiania środowiska agenta używa `activation.onAgentHarnesses` dla osadzonych uprzęży oraz `cliBackends[]` najwyższego poziomu dla aliasów środowiska uruchomieniowego CLI.
- Planowanie konfiguracji lub kanału wyzwalane kanałem korzysta awaryjnie ze starszej własności `channels[]`, gdy brakuje jawnych metadanych aktywacji kanału.
- Planowanie pluginów podczas uruchamiania używa `activation.onConfigPaths` dla głównych obszarów konfiguracji niezwiązanych z kanałami, takich jak blok `browser` dołączonego pluginu przeglądarki.
- Planowanie konfiguracji lub środowiska uruchomieniowego wyzwalane dostawcą korzysta awaryjnie ze starszej własności `providers[]` i `cliBackends[]` najwyższego poziomu, gdy brakuje jawnych metadanych aktywacji dostawcy.

Diagnostyka planisty potrafi odróżnić jawne wskazówki aktywacji od awaryjnego użycia własności z manifestu. Na przykład `activation-command-hint` oznacza dopasowanie `activation.onCommands`, natomiast `manifest-command-alias` oznacza, że planista użył zamiast tego własności `commandAliases`. Te etykiety przyczyn służą do diagnostyki hosta i testów; autorzy pluginów powinni nadal deklarować metadane najlepiej opisujące własność.

## Dokumentacja `qaRunners`

Użyj `qaRunners`, gdy plugin udostępnia jeden lub więcej modułów uruchamiających transport
pod wspólnym głównym poleceniem `openclaw qa`. Te metadane powinny pozostać proste i statyczne; środowisko
uruchomieniowe pluginu nadal odpowiada za właściwą rejestrację CLI za pośrednictwem lekkiego
interfejsu `runtime-api.ts`, który eksportuje pasujące `qaRunnerCliRegistrations`. Opcjonalne
`adapterFactory` udostępnia transport wspólnym scenariuszom QA bez
zmiany modułu uruchamiającego zarejestrowanego polecenia.

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

| Pole          | Wymagane | Typ      | Znaczenie                                                                                  |
| ------------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| `commandName` | Tak      | `string` | Podpolecenie dostępne pod `openclaw qa`, na przykład `matrix`.                              |
| `description` | Nie      | `string` | Zastępczy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia zastępczego.    |

Identyfikator `adapterFactory` musi być zgodny z `commandName`. Nie eksportuj rejestracji
dla poleceń nieobecnych w manifeście.

## Dokumentacja setup

Użyj `setup`, gdy interfejsy konfiguracji i wdrażania potrzebują niedrogich metadanych należących do pluginu przed załadowaniem środowiska wykonawczego.

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

`cliBackends` najwyższego poziomu pozostaje prawidłowe i nadal opisuje backendy wnioskowania CLI. `setup.cliBackends` to specyficzny dla konfiguracji interfejs deskryptorów przeznaczony dla przepływów płaszczyzny sterowania i konfiguracji, które powinny korzystać wyłącznie z metadanych.

Jeśli są dostępne, `setup.providers` i `setup.cliBackends` stanowią preferowany interfejs wyszukiwania oparty najpierw na deskryptorach podczas wykrywania konfiguracji. Jeśli deskryptor jedynie zawęża wybór pluginu, a konfiguracja nadal potrzebuje bogatszych hooków środowiska wykonawczego na etapie konfiguracji, ustaw `requiresRuntime: true` i zachowaj `setup-api` jako rezerwową ścieżkę wykonania.

OpenClaw uwzględnia również `setup.providers[].envVars` w ogólnych wyszukiwaniach uwierzytelniania dostawcy i zmiennych środowiskowych. `providerAuthEnvVars` pozostaje obsługiwane za pośrednictwem adaptera zgodności w okresie wycofywania, ale pluginy niedołączone do pakietu, które nadal go używają, otrzymują komunikat diagnostyczny manifestu. Nowe pluginy powinny umieszczać metadane zmiennych środowiskowych konfiguracji i stanu w `setup.providers[].envVars`.

Użyj `providerUsageAuthEnvVars`, gdy poświadczenie na poziomie rozliczeń lub organizacji musi aktywować `resolveUsageAuth`, nie stając się poświadczeniem wnioskowania. Nazwy te zostają objęte blokowaniem plików dotenv obszaru roboczego, usuwaniem ze zmiennych procesów potomnych ACP, filtrowaniem sekretów w piaskownicy oraz szerokim usuwaniem sekretów. Środowisko wykonawcze dostawcy nadal odczytuje i klasyfikuje wartość wewnątrz `resolveUsageAuth`.

OpenClaw może również wyprowadzić proste opcje konfiguracji z `setup.providers[].authMethods`, gdy nie jest dostępny punkt wejścia konfiguracji lub gdy `setup.requiresRuntime: false` deklaruje, że środowisko wykonawcze konfiguracji jest zbędne. Jawne wpisy `providerAuthChoices` pozostają preferowane dla niestandardowych etykiet, flag CLI, zakresu wdrażania i metadanych asystenta.

Ustaw `requiresRuntime: false` tylko wtedy, gdy te deskryptory są wystarczające dla interfejsu konfiguracji. OpenClaw traktuje jawne `false` jako kontrakt oparty wyłącznie na deskryptorach i nie wykona `setup-api` ani `openclaw.setupEntry` podczas wyszukiwania konfiguracji. Jeśli plugin oparty wyłącznie na deskryptorach nadal udostępnia jeden z tych punktów wejścia środowiska wykonawczego konfiguracji, OpenClaw zgłasza dodatkowy komunikat diagnostyczny i nadal go ignoruje. Pominięcie `requiresRuntime` zachowuje starsze zachowanie rezerwowe, dzięki czemu istniejące pluginy, które dodały deskryptory bez tej flagi, nie przestaną działać.

Ponieważ wyszukiwanie konfiguracji może wykonywać należący do pluginu kod `setup-api`, znormalizowane wartości `setup.providers[].id` i `setup.cliBackends[]` muszą być unikatowe wśród wykrytych pluginów. W przypadku niejednoznacznej własności operacja kończy się bezpiecznym niepowodzeniem zamiast wyboru zwycięzcy na podstawie kolejności wykrywania.

Gdy środowisko wykonawcze konfiguracji zostanie uruchomione, diagnostyka rejestru konfiguracji zgłasza rozbieżność deskryptorów, jeśli `setup-api` rejestruje dostawcę lub backend CLI, którego nie deklarują deskryptory manifestu, albo jeśli deskryptor nie ma odpowiadającej mu rejestracji w środowisku wykonawczym. Te komunikaty diagnostyczne są dodatkowe i nie powodują odrzucenia starszych pluginów.

### Dokumentacja setup.providers

| Pole           | Wymagane | Typ        | Znaczenie                                                                                                  |
| -------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `id`           | Tak      | `string`   | Identyfikator dostawcy udostępniany podczas konfiguracji lub wdrażania. Znormalizowane identyfikatory muszą być globalnie unikatowe. |
| `authMethods`  | Nie      | `string[]` | Identyfikatory metod konfiguracji i uwierzytelniania obsługiwanych przez tego dostawcę bez ładowania pełnego środowiska wykonawczego. |
| `envVars`      | Nie      | `string[]` | Zmienne środowiskowe, które ogólne interfejsy konfiguracji i stanu mogą sprawdzić przed załadowaniem środowiska wykonawczego pluginu. |
| `authEvidence` | Nie      | `object[]` | Niedrogie lokalne kontrole dowodów uwierzytelnienia dla dostawców, którzy mogą uwierzytelniać przy użyciu znaczników niebędących sekretami. |

`authEvidence` służy do obsługi należących do dostawcy lokalnych znaczników poświadczeń, które można zweryfikować bez ładowania kodu środowiska wykonawczego. Te kontrole muszą być niedrogie i lokalne: bez wywołań sieciowych, odczytów z pęku kluczy lub menedżera sekretów, poleceń powłoki ani sondowania API dostawcy.

Obsługiwane wpisy dowodów:

| Pole               | Wymagane | Typ        | Znaczenie                                                                                                         |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `type`             | Tak      | `string`   | Obecnie `local-file-with-env`.                                                                                     |
| `fileEnvVar`       | Nie      | `string`   | Zmienna środowiskowa zawierająca jawną ścieżkę do pliku poświadczeń.                                               |
| `fallbackPaths`    | Nie      | `string[]` | Lokalne ścieżki do plików poświadczeń sprawdzane, gdy `fileEnvVar` jest nieobecne lub puste. Obsługuje `${HOME}` i `${APPDATA}`. |
| `requiresAnyEnv`   | Nie      | `string[]` | Co najmniej jedna z wymienionych zmiennych środowiskowych musi być niepusta, aby dowód był prawidłowy.             |
| `requiresAllEnv`   | Nie      | `string[]` | Każda z wymienionych zmiennych środowiskowych musi być niepusta, aby dowód był prawidłowy.                         |
| `credentialMarker` | Tak      | `string`   | Znacznik niebędący sekretem, zwracany, gdy dowód jest dostępny.                                                    |
| `source`           | Nie      | `string`   | Widoczna dla użytkownika etykieta źródła w danych wyjściowych uwierzytelniania i stanu.                            |

### Pola setup

| Pole               | Wymagane | Typ        | Znaczenie                                                                                                      |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji dostawcy udostępniane podczas konfiguracji i wdrażania.                               |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów używane na etapie konfiguracji do wyszukiwania opartego najpierw na deskryptorach. Znormalizowane identyfikatory muszą być globalnie unikatowe. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do interfejsu konfiguracji tego pluginu.                         |
| `requiresRuntime`  | Nie      | `boolean`  | Określa, czy konfiguracja nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                         |

## Dokumentacja uiHints

`uiHints` to mapa nazw pól konfiguracji na niewielkie wskazówki dotyczące renderowania. Klucze mogą używać kropek dla zagnieżdżonych pól konfiguracji, ale żaden segment ścieżki nie może mieć wartości `__proto__`, `constructor` ani `prototype`; konfiguracja odrzuca takie nazwy.

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

Każda wskazówka dotycząca pola może zawierać:

| Pole          | Typ        | Znaczenie                                      |
| ------------- | ---------- | ---------------------------------------------- |
| `label`       | `string`   | Widoczna dla użytkownika etykieta pola.        |
| `help`        | `string`   | Krótki tekst pomocniczy.                       |
| `tags`        | `string[]` | Opcjonalne znaczniki interfejsu użytkownika.   |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.                |
| `sensitive`   | `boolean`  | Oznacza pole jako tajne lub wrażliwe.          |
| `placeholder` | `string`   | Tekst zastępczy dla pól wejściowych formularza. |

## Dokumentacja contracts

Używaj `contracts` wyłącznie do statycznych metadanych własności możliwości, które OpenClaw może odczytać bez importowania środowiska wykonawczego pluginu.

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
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Każda lista jest opcjonalna:

| Pole                             | Typ        | Znaczenie                                                                                                                                            |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory fabryk rozszerzeń serwera aplikacji Codex, obecnie `codex-app-server`.                                                                 |
| `agentToolResultMiddleware`      | `string[]` | Identyfikatory środowisk wykonawczych, dla których ten Plugin może rejestrować oprogramowanie pośredniczące wyników narzędzi.                          |
| `trustedToolPolicies`            | `string[]` | Lokalne dla Pluginu identyfikatory zaufanych zasad wykonywanych przed narzędziem, które może rejestrować zainstalowany Plugin. Dołączone Pluginy mogą rejestrować zasady bez tego pola. |
| `externalAuthProviders`          | `string[]` | Identyfikatory dostawców, których hak profilu uwierzytelniania zewnętrznego należy do tego Pluginu.                                                    |
| `embeddingProviders`             | `string[]` | Identyfikatory ogólnych dostawców osadzania należących do tego Pluginu, przeznaczonych do wielokrotnego użycia osadzeń wektorowych, w tym przez pamięć. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należących do tego Pluginu.                                                                                             |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należących do tego Pluginu.                                                               |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należących do tego Pluginu.                                                                      |
| `memoryEmbeddingProviders`       | `string[]` | Przestarzałe identyfikatory dostawców osadzania specyficznych dla pamięci, należących do tego Pluginu.                                                  |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia multimediów należących do tego Pluginu.                                                                           |
| `transcriptSourceProviders`      | `string[]` | Identyfikatory dostawców źródeł transkrypcji należących do tego Pluginu.                                                                               |
| `documentExtractors`             | `string[]` | Identyfikatory dostawców ekstrakcji dokumentów (na przykład PDF) należących do tego Pluginu.                                                          |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należących do tego Pluginu.                                                                               |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należących do tego Pluginu.                                                                                 |
| `musicGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania muzyki należących do tego Pluginu.                                                                                |
| `webContentExtractors`           | `string[]` | Identyfikatory dostawców ekstrakcji treści stron internetowych należących do tego Pluginu.                                                            |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania zasobów internetowych należących do tego Pluginu.                                                                 |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania internetowego należących do tego Pluginu.                                                                        |
| `workerProviders`                | `string[]` | Identyfikatory dostawców procesów roboczych w chmurze należących do tego Pluginu, służących do udostępniania zasobów i zarządzania cyklem życia dzierżawy opartej na profilu. |
| `usageProviders`                 | `string[]` | Identyfikatory dostawców, których haki uwierzytelniania użycia i migawek użycia należą do tego Pluginu.                                               |
| `migrationProviders`             | `string[]` | Identyfikatory dostawców importu należących do tego Pluginu na potrzeby `openclaw migrate`.                                                            |
| `gatewayMethodDispatch`          | `string[]` | Zastrzeżone uprawnienie dla uwierzytelnionych tras HTTP Pluginu, które wywołują metody Gateway wewnątrz procesu.                                      |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego Pluginu.                                                                                                     |

`contracts.embeddedExtensionFactories` zachowano dla dołączonych fabryk rozszerzeń przeznaczonych wyłącznie dla serwera aplikacji Codex. Dołączone transformacje wyników narzędzi powinny zamiast tego deklarować `contracts.agentToolResultMiddleware` i rejestrować się za pomocą `api.registerAgentToolResultMiddleware(...)`. Zainstalowane Pluginy mogą korzystać z tego samego mechanizmu oprogramowania pośredniczącego tylko wtedy, gdy zostanie on jawnie włączony, i tylko dla środowisk wykonawczych zadeklarowanych w `contracts.agentToolResultMiddleware`.

Zainstalowane Pluginy, które potrzebują zaufanej przez hosta warstwy zasad wykonywanych przed narzędziem, muszą zadeklarować każdy rejestrowany lokalny identyfikator w `contracts.trustedToolPolicies` i zostać jawnie włączone. Dołączone Pluginy zachowują istniejącą ścieżkę zaufanych zasad, ale zainstalowane Pluginy z niezadeklarowanymi identyfikatorami zasad są odrzucane przed rejestracją. Identyfikatory zasad są ograniczone do rejestrującego Pluginu, dlatego dwa Pluginy mogą zarówno zadeklarować, jak i zarejestrować `workflow-budget`; pojedynczy Plugin nie może dwukrotnie zarejestrować tego samego lokalnego identyfikatora.

Rejestracje `api.registerTool(...)` w środowisku wykonawczym muszą odpowiadać `contracts.tools`. Mechanizm wykrywania narzędzi używa tej listy, aby ładować tylko środowiska wykonawcze Pluginów, które mogą być właścicielami żądanych narzędzi.

Pluginy dostawców implementujące `resolveExternalAuthProfiles` powinny deklarować `contracts.externalAuthProviders`; niezadeklarowane haki uwierzytelniania zewnętrznego są ignorowane.

Pluginy dostawców implementujące zarówno `resolveUsageAuth`, jak i `fetchUsageSnapshot` powinny deklarować w `contracts.usageProviders` każdy automatycznie wykrywany identyfikator dostawcy. Mechanizm wykrywania użycia odczytuje ten kontrakt przed załadowaniem kodu środowiska wykonawczego, a następnie weryfikuje oba haki po załadowaniu wyłącznie zadeklarowanych właścicieli.

Ogólni dostawcy osadzania powinni deklarować `contracts.embeddingProviders` dla każdego adaptera zarejestrowanego za pomocą `api.registerEmbeddingProvider(...)`. Ogólnego kontraktu należy używać do generowania wektorów wielokrotnego użytku, w tym przez dostawców używanych przez wyszukiwanie w pamięci. `contracts.memoryEmbeddingProviders` to przestarzały mechanizm zgodności specyficzny dla pamięci, który pozostaje dostępny tylko na czas migracji istniejących dostawców do ogólnego mechanizmu dostawców osadzania.

Dostawcy procesów roboczych muszą deklarować w `contracts.workerProviders` każdy identyfikator przekazywany do `api.registerWorkerProvider(...)`. Rdzeń utrwala trwały zamiar przed wywołaniem `provision`; dostawcy weryfikują swoje ustawienia przed przydzieleniem zasobów zewnętrznych, a powtarzane wywołania z tym samym identyfikatorem operacji muszą przejmować tę samą dzierżawę. Rdzeń utrwala również migawkę zweryfikowanych ustawień i przekazuje ją wraz z `leaseId` do `inspect({ leaseId, profile })` oraz `destroy({ leaseId, profile })`, także po zmianie lub usunięciu nazwanego profilu. Niszczenie jest idempotentne, inspekcja zwraca zamkniętą unię stanów `active` / `destroyed` / `unknown`, a materiał klucza prywatnego SSH jest wskazywany wyłącznie przez `SecretRef`. Udostępnione punkty końcowe SSH muszą również zawierać publiczny `hostKey` z zaufanych danych wyjściowych udostępniania, dokładnie w postaci `algorithm base64`, bez nazwy hosta ani komentarza, aby rdzeń mógł przypiąć host przed połączeniem. Dostawcy tworzący dynamiczne odwołania do tożsamości mogą implementować autorytatywną funkcję `resolveSshIdentity({ leaseId, profile, keyRef })`; w przypadku dostawców bez tej funkcji używany jest ogólny mechanizm rozpoznawania sekretów rdzenia. Autorytatywny stan `unknown` osieroca aktywny rekord lokalny; po utrwalonym żądaniu zniszczenia potwierdza zakończenie usuwania zasobów.

`contracts.gatewayMethodDispatch` obecnie akceptuje `"authenticated-request"`. Jest to mechanizm higieny API dla natywnych tras HTTP Pluginu, które celowo wywołują metody płaszczyzny sterowania Gateway wewnątrz procesu, a nie piaskownica chroniąca przed złośliwymi natywnymi Pluginami. Należy go używać wyłącznie dla dokładnie sprawdzonych dołączonych powierzchni operatorskich, które już wymagają uwierzytelniania HTTP Gateway. Uprawniona trasa pozostaje dostępna po zamknięciu przyjmowania zadań głównych przez Gateway tylko wtedy, gdy deklaruje również `auth: "gateway"` oraz specyficzne dla trasy `gatewayRuntimeScopeSurface: "trusted-operator"`; zwykłe trasy równorzędne z tego samego Pluginu pozostają za granicą przyjmowania. Dzięki temu stan wstrzymania i wznowienie pozostają dostępne bez przyznawania całemu Pluginowi możliwości omijania kontroli przyjmowania. Analizowanie i kształtowanie odpowiedzi powinno pozostać ograniczone poza wywołaniem; istotne lub modyfikujące operacje muszą przechodzić przez wywołanie metody Gateway, które odpowiada za egzekwowanie zasad przyjmowania i zakresu.

## Dokumentacja `configContracts`

Używaj `configContracts` do zachowań konfiguracji należących do manifestu, których potrzebują ogólne pomocnicze mechanizmy rdzenia bez importowania środowiska wykonawczego Pluginu: wykrywania niebezpiecznych flag, celów migracji `SecretRef` oraz zawężania starszych ścieżek konfiguracji.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| Pole                          | Wymagane | Typ        | Znaczenie                                                                                                                                                                                                                                                 |
| ----------------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Nie      | `string[]` | Ścieżki konfiguracji względem katalogu głównego, które wskazują, że mogą mieć zastosowanie migracje zgodności tego Pluginu wykonywane podczas konfiguracji. Umożliwia ogólnym odczytom konfiguracji środowiska wykonawczego pominięcie wszystkich powierzchni konfiguracji Pluginu, gdy konfiguracja nigdy nie odwołuje się do tego Pluginu. |
| `compatibilityRuntimePaths`   | Nie      | `string[]` | Ścieżki zgodności względem katalogu głównego, które ten Plugin może obsługiwać w czasie działania, zanim kod Pluginu zostanie w pełni aktywowany. Używaj ich dla starszych powierzchni, które powinny zawężać zestawy dołączonych kandydatów bez importowania środowiska wykonawczego każdego zgodnego Pluginu. |
| `dangerousFlags`              | Nie      | `object[]` | Literały konfiguracji, które `openclaw doctor` powinien oznaczać jako niezabezpieczone lub niebezpieczne, gdy są włączone. Zobacz poniżej.                                                                                                                  |
| `secretInputs`                | Nie      | `object`   | Ścieżki konfiguracji w `plugins.entries.<id>.config`, które rejestr celów migracji/audytu `SecretRef` powinien traktować jako ciągi reprezentujące sekrety. Zobacz poniżej.                                                                                 |

Każdy wpis `dangerousFlags` obsługuje:

| Pole     | Wymagane | Typ                                   | Znaczenie                                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `path`   | Tak      | `string`                              | Rozdzielana kropkami ścieżka konfiguracji względem `plugins.entries.<id>.config`. Obsługuje symbole wieloznaczne `*` dla segmentów map i tablic. |
| `equals` | Tak      | `string \| number \| boolean \| null` | Dokładny literał oznaczający tę wartość konfiguracji jako niebezpieczną.                                                        |

`secretInputs` obsługuje:

| Pole                    | Wymagane | Typ        | Znaczenie                                                                                                                                                                                                                         |
| ----------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Nie      | `boolean`  | Zastępuje domyślne włączenie dołączonego pluginu podczas określania, czy ta powierzchnia SecretRef jest aktywna. Użyj tego, gdy plugin jest dołączony, ale powierzchnia powinna pozostać nieaktywna do czasu jawnego włączenia w konfiguracji. |
| `paths`                 | Tak      | `object[]` | Ścieżki konfiguracji o strukturze sekretu, każda z `path` (rozdzielana kropkami, względna wobec `plugins.entries.<id>.config`, obsługuje symbole wieloznaczne `*`) i opcjonalnym `expected` (obecnie tylko `"string"`).                  |

## Dokumentacja `mediaUnderstandingProviderMetadata`

Użyj `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia multimediów ma domyślne modele, priorytet automatycznego uwierzytelniania awaryjnego lub natywną obsługę dokumentów, których ogólne mechanizmy rdzenia potrzebują przed załadowaniem środowiska wykonawczego. Klucze muszą być również zadeklarowane w `contracts.mediaUnderstandingProviders`.

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

Każdy wpis dostawcy może zawierać:

| Pole                   | Typ                                                              | Znaczenie                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Możliwości multimedialne udostępniane przez tego dostawcę.                                                                                |
| `defaultModels`        | `Record<string, string>`                                         | Domyślne przypisania możliwości do modeli używane, gdy konfiguracja nie określa modelu.                                                   |
| `autoPriority`         | `Record<string, number>`                                         | Niższe liczby są sortowane wcześniej podczas automatycznego wyboru dostawcy awaryjnego na podstawie poświadczeń.                          |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Natywne formaty wejściowe dokumentów obsługiwane przez dostawcę.                                                                          |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Nadpisania modeli dla poszczególnych typów dokumentów. Ustaw `image: false`, aby wyłączyć wyodrębnianie oparte na obrazach dla danego typu. |

## Dokumentacja `channelConfigs`

Użyj `channelConfigs`, gdy plugin kanału potrzebuje łatwo dostępnych metadanych konfiguracji przed załadowaniem środowiska wykonawczego. Wykrywanie konfiguracji lub stanu kanału tylko do odczytu może bezpośrednio używać tych metadanych dla skonfigurowanych kanałów zewnętrznych, gdy wpis konfiguracji nie jest dostępny albo gdy `setup.requiresRuntime: false` deklaruje, że środowisko wykonawcze nie jest potrzebne do konfiguracji.

`channelConfigs` to metadane manifestu pluginu, a nie nowa sekcja najwyższego poziomu w konfiguracji użytkownika. Użytkownicy nadal konfigurują instancje kanałów w `channels.<channel-id>`. OpenClaw odczytuje metadane manifestu, aby określić, który plugin jest właścicielem skonfigurowanego kanału, zanim zostanie wykonany kod środowiska wykonawczego pluginu.

W przypadku pluginu kanału `configSchema` i `channelConfigs` opisują różne ścieżki:

- `configSchema` waliduje `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` waliduje `channels.<channel-id>`

Pluginy niedołączone, które deklarują `channels[]`, powinny również deklarować odpowiadające im wpisy `channelConfigs`. Bez nich OpenClaw nadal może załadować plugin, ale powierzchnie schematu konfiguracji ścieżki zimnej, konfiguracji i interfejsu Control UI nie mogą poznać struktury opcji należących do kanału, dopóki nie zostanie wykonane środowisko wykonawcze pluginu.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` i `nativeSkillsAutoEnabled` mogą deklarować statyczne wartości domyślne `auto` dla sprawdzania konfiguracji poleceń wykonywanego przed załadowaniem środowiska wykonawczego kanału. Dołączone kanały mogą również publikować te same wartości domyślne przez `package.json#openclaw.channel.commands` wraz z innymi metadanymi katalogu kanałów należącymi do pakietu.

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

| Pole          | Typ                      | Znaczenie                                                                                                                      |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | Schemat JSON dla `channels.<id>`. Wymagany dla każdego zadeklarowanego wpisu konfiguracji kanału.                              |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety interfejsu, teksty zastępcze i wskazówki dotyczące danych poufnych dla tej sekcji konfiguracji kanału.      |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami wyboru i inspekcji, gdy metadane środowiska wykonawczego nie są jeszcze gotowe.        |
| `description` | `string`                 | Krótki opis kanału przeznaczony dla powierzchni inspekcji i katalogu.                                                           |
| `commands`    | `object`                 | Statyczne automatyczne wartości domyślne natywnych poleceń i natywnych Skills dla kontroli konfiguracji przed uruchomieniem.   |
| `preferOver`  | `string[]`               | Identyfikatory starszych pluginów lub pluginów o niższym priorytecie, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

### Zastępowanie innego pluginu kanału

Użyj `preferOver`, gdy Twój plugin jest preferowanym właścicielem identyfikatora kanału, który może być również udostępniany przez inny plugin. Typowe przypadki to zmieniony identyfikator pluginu, samodzielny plugin zastępujący plugin dołączony lub utrzymywany fork, który zachowuje ten sam identyfikator kanału w celu zgodności konfiguracji.

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

Gdy skonfigurowano `channels.chat`, OpenClaw uwzględnia zarówno identyfikator kanału, jak i identyfikator preferowanego pluginu. Jeśli plugin o niższym priorytecie został wybrany tylko dlatego, że jest dołączony lub domyślnie włączony, OpenClaw wyłącza go w efektywnej konfiguracji środowiska wykonawczego, dzięki czemu jeden plugin jest właścicielem kanału i jego narzędzi. Jawny wybór użytkownika nadal ma pierwszeństwo: jeśli użytkownik jawnie włączy oba pluginy (przez `plugins.allow` lub istotną konfigurację `plugins.entries`), OpenClaw zachowuje ten wybór i zgłasza diagnostykę zduplikowanych kanałów lub narzędzi zamiast po cichu zmieniać żądany zestaw pluginów.

Ogranicz zakres `preferOver` do identyfikatorów pluginów, które rzeczywiście mogą udostępniać ten sam kanał. Nie jest to ogólne pole priorytetu i nie zmienia nazw kluczy konfiguracji użytkownika.

## Dokumentacja `modelSupport`

Użyj `modelSupport`, gdy OpenClaw powinien wywnioskować plugin dostawcy na podstawie skróconych identyfikatorów modeli, takich jak `gpt-5.6-sol` lub `claude-sonnet-4.6`, przed załadowaniem środowiska wykonawczego pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następującą kolejność pierwszeństwa:

- jawne odwołania `provider/model` używają metadanych manifestu `providers` należących do odpowiedniego dostawcy
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują zarówno jeden plugin niedołączony, jak i jeden dołączony, pierwszeństwo ma plugin niedołączony
- pozostałe niejednoznaczności są ignorowane, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Znaczenie                                                                                             |
| --------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane za pomocą `startsWith` do skróconych identyfikatorów modeli.                     |
| `modelPatterns` | `string[]` | Źródła wyrażeń regularnych dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

Wpisy `modelPatterns` są kompilowane za pomocą `compileSafeRegex`, które odrzuca wzorce zawierające zagnieżdżone powtórzenia (na przykład `(a+)+$`). Wzorce, które nie przejdą kontroli bezpieczeństwa, są po cichu pomijane, podobnie jak wyrażenia regularne niepoprawne składniowo. Utrzymuj wzorce w prostej postaci i unikaj zagnieżdżonych kwantyfikatorów.

## Dokumentacja `modelCatalog`

Użyj `modelCatalog`, gdy OpenClaw powinien znać metadane modeli dostawcy przed załadowaniem środowiska wykonawczego pluginu. Jest to należące do manifestu źródło stałych wierszy katalogu, aliasów dostawców, reguł pomijania i trybu wykrywania. Odświeżanie w czasie działania nadal należy do kodu środowiska wykonawczego dostawcy, ale manifest informuje rdzeń, kiedy środowisko wykonawcze jest wymagane.

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

| Pole             | Typ                                                      | Znaczenie                                                                                                                |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `providers`      | `Record<string, object>`                                 | Wiersze katalogu dla identyfikatorów dostawców należących do tego pluginu. Klucze powinny również występować w `providers` najwyższego poziomu. |
| `aliases`        | `Record<string, object>`                                 | Aliasy dostawców, które na potrzeby planowania katalogu lub wykluczeń powinny wskazywać dostawcę należącego do tego pluginu. |
| `suppressions`   | `object[]`                                               | Wiersze modeli z innego źródła, które ten plugin wyklucza z powodu specyficznego dla dostawcy.                           |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Określa, czy katalog dostawcy można odczytać z metadanych manifestu, odświeżyć w pamięci podręcznej, czy wymaga środowiska uruchomieniowego. |
| `runtimeAugment` | `boolean`                                                | Ustaw na `true` tylko wtedy, gdy środowisko uruchomieniowe dostawcy musi dołączyć wiersze katalogu po zaplanowaniu manifestu/konfiguracji. |

`aliases` uczestniczy w wyszukiwaniu właściciela dostawcy na potrzeby planowania katalogu modeli. Cele aliasów muszą być dostawcami najwyższego poziomu należącymi do tego samego pluginu. Gdy lista filtrowana według dostawcy używa aliasu, OpenClaw może odczytać manifest właściciela i zastosować nadpisania interfejsu API/bazowego adresu URL aliasu bez ładowania środowiska uruchomieniowego dostawcy. Aliasy nie rozszerzają niefiltrowanych zestawień katalogu; szerokie listy zawierają wyłącznie wiersze kanonicznego dostawcy będącego właścicielem.

`suppressions` zastępuje stary hak środowiska uruchomieniowego dostawcy `suppressBuiltInModel`. Wpisy wykluczeń są uwzględniane tylko wtedy, gdy dostawca należy do pluginu albo został zadeklarowany jako klucz `modelCatalog.aliases` wskazujący dostawcę należącego do pluginu. Haki wykluczania środowiska uruchomieniowego nie są już wywoływane podczas rozpoznawania modelu.

Pola dostawcy:

| Pole                  | Typ                      | Znaczenie                                                                                                                                                                                                                  |
| --------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | Opcjonalny domyślny bazowy adres URL modeli w katalogu tego dostawcy.                                                                                                                                                       |
| `api`                 | `ModelApi`               | Opcjonalny domyślny adapter API modeli w katalogu tego dostawcy.                                                                                                                                                            |
| `headers`             | `Record<string, string>` | Opcjonalne statyczne nagłówki stosowane do katalogu tego dostawcy.                                                                                                                                                          |
| `defaultUtilityModel` | `string`                 | Opcjonalny identyfikator małego modelu zalecanego przez dostawcę do krótkich wewnętrznych zadań pomocniczych (tytuły, opisywanie postępu). Używany, gdy `agents.defaults.utilityModel` nie jest ustawione, a ten dostawca obsługuje podstawowy model agenta. |
| `models`              | `object[]`               | Wymagane wiersze modeli. Wiersze bez `id` są ignorowane.                                                                                                                                                                    |

Pola modelu:

| Pole               | Typ                                                            | Znaczenie                                                                              |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Lokalny identyfikator modelu u dostawcy, bez prefiksu `provider/`.                     |
| `name`             | `string`                                                       | Opcjonalna nazwa wyświetlana.                                                          |
| `api`              | `ModelApi`                                                     | Opcjonalne nadpisanie API dla danego modelu.                                           |
| `baseUrl`          | `string`                                                       | Opcjonalne nadpisanie bazowego adresu URL dla danego modelu.                           |
| `headers`          | `Record<string, string>`                                       | Opcjonalne statyczne nagłówki dla danego modelu.                                       |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalności akceptowane przez model. Inne wartości są po cichu odrzucane.               |
| `reasoning`        | `boolean`                                                      | Określa, czy model udostępnia funkcję rozumowania.                                     |
| `contextWindow`    | `number`                                                       | Natywne okno kontekstu dostawcy.                                                       |
| `contextTokens`    | `number`                                                       | Opcjonalny efektywny limit kontekstu środowiska uruchomieniowego, jeśli różni się od `contextWindow`. |
| `maxTokens`        | `number`                                                       | Maksymalna liczba tokenów wyjściowych, jeśli jest znana.                               |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Opcjonalne nadpisania identyfikatora modelu lub parametrów dla poszczególnych poziomów myślenia. |
| `cost`             | `object`                                                       | Opcjonalny cennik w USD za milion tokenów, w tym opcjonalne `tieredPricing`.           |
| `compat`           | `object`                                                       | Opcjonalne flagi zgodności odpowiadające zgodności konfiguracji modeli OpenClaw.       |
| `mediaInput`       | `object`                                                       | Opcjonalna konfiguracja wejścia dla poszczególnych modalności, obecnie tylko obrazów.  |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status w zestawieniu. Wykluczaj tylko wtedy, gdy wiersz w ogóle nie może się pojawić.   |
| `statusReason`     | `string`                                                       | Opcjonalny powód wyświetlany przy statusie innym niż dostępny.                         |
| `replaces`         | `string[]`                                                     | Starsze lokalne identyfikatory modeli u dostawcy, które ten model zastępuje.           |
| `replacedBy`       | `string`                                                       | Lokalny identyfikator modelu zastępczego u dostawcy dla przestarzałych wierszy.         |
| `tags`             | `string[]`                                                     | Stabilne tagi używane przez selektory i filtry.                                        |

Pola wykluczeń:

| Pole                       | Typ        | Znaczenie                                                                                                          |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | Identyfikator dostawcy wiersza nadrzędnego przeznaczonego do wykluczenia. Musi należeć do tego pluginu lub być zadeklarowany jako alias należący do pluginu. |
| `model`                    | `string`   | Lokalny identyfikator modelu u dostawcy przeznaczony do wykluczenia.                                               |
| `reason`                   | `string`   | Opcjonalny komunikat wyświetlany, gdy wykluczony wiersz zostanie zażądany bezpośrednio.                            |
| `when.baseUrlHosts`        | `string[]` | Opcjonalna lista hostów efektywnego bazowego adresu URL dostawcy, wymaganych przed zastosowaniem wykluczenia.       |
| `when.providerConfigApiIn` | `string[]` | Opcjonalna lista dokładnych wartości `api` konfiguracji dostawcy, wymaganych przed zastosowaniem wykluczenia.       |

Nie umieszczaj w `modelCatalog` danych dostępnych wyłącznie w środowisku uruchomieniowym. Używaj `static` tylko wtedy, gdy wiersze manifestu są wystarczająco kompletne, aby listy filtrowane według dostawcy i interfejsy selektorów mogły pominąć wykrywanie rejestru/środowiska uruchomieniowego. Używaj `refreshable`, gdy wiersze manifestu są użytecznymi, możliwymi do wyświetlenia danymi początkowymi lub uzupełniającymi, lecz odświeżenie/pamięć podręczna może później dodać kolejne wiersze; wiersze odświeżalne nie są same w sobie źródłem rozstrzygającym. Używaj `runtime`, gdy OpenClaw musi załadować środowisko uruchomieniowe dostawcy, aby poznać listę.

## Dokumentacja modelIdNormalization

Używaj `modelIdNormalization` do niedrogiego czyszczenia identyfikatorów modeli należących do dostawcy, które musi nastąpić przed załadowaniem środowiska uruchomieniowego dostawcy. Dzięki temu aliasy, takie jak krótkie nazwy modeli, starsze lokalne identyfikatory dostawcy i reguły prefiksów proxy, pozostają w manifeście pluginu będącego właścicielem, zamiast trafiać do podstawowych tabel wyboru modeli.

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

| Pole                                 | Typ                     | Znaczenie                                                                                      |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Dokładne aliasy identyfikatorów modeli bez rozróżniania wielkości liter. Wartości są zwracane w zapisanej postaci. |
| `stripPrefixes`                      | `string[]`              | Prefiksy usuwane przed wyszukiwaniem aliasu, przydatne w przypadku starszego dublowania dostawcy/modelu. |
| `prefixWhenBare`                     | `string`                | Prefiks dodawany, gdy znormalizowany identyfikator modelu nie zawiera jeszcze `/`.              |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Warunkowe reguły prefiksów dla samodzielnych identyfikatorów po wyszukaniu aliasu, indeksowane przez `modelPrefix` i `prefix`. |

## Dokumentacja providerEndpoints

Używaj `providerEndpoints` do klasyfikacji punktów końcowych, którą ogólna polityka żądań musi znać przed załadowaniem środowiska uruchomieniowego dostawcy. Rdzeń nadal określa znaczenie każdej wartości `endpointClass`; manifesty pluginów są właścicielami metadanych hosta i bazowego adresu URL.

Oficjalnie wydzielone zewnętrzne pluginy dostawców są wykluczone z dystrybucji rdzenia, więc
ich manifesty są niewidoczne do czasu instalacji. Ich `providerEndpoints` muszą
być również odzwierciedlone w `scripts/lib/official-external-provider-catalog.json`, aby
klasyfikacja punktów końcowych działała bez pluginu; zgodność odzwierciedlenia
jest wymuszana przez test kontraktowy.

Pola punktu końcowego:

| Pole                           | Typ        | Znaczenie                                                                                                      |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Znana podstawowa klasa punktu końcowego, taka jak `openrouter`, `moonshot-native` lub `google-vertex`.         |
| `hosts`                        | `string[]` | Dokładne nazwy hostów mapowane na klasę punktu końcowego.                                                      |
| `hostSuffixes`                 | `string[]` | Sufiksy hostów mapowane na klasę punktu końcowego. Poprzedź je znakiem `.`, aby dopasowywać tylko sufiksy domen. |
| `baseUrls`                     | `string[]` | Dokładne, znormalizowane bazowe adresy URL HTTP(S) mapowane na klasę punktu końcowego.                          |
| `googleVertexRegion`           | `string`   | Statyczny region Google Vertex dla dokładnie określonych hostów globalnych.                                    |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks usuwany z pasujących hostów w celu wyodrębnienia prefiksu regionu Google Vertex.                        |

## Dokumentacja `providerRequest`

Użyj `providerRequest` dla niedrogich metadanych zgodności żądania, których wymagają ogólne zasady obsługi żądań bez ładowania środowiska wykonawczego dostawcy. Przekształcanie ładunku właściwe dla określonego zachowania pozostaw hakom środowiska wykonawczego dostawcy lub współdzielonym funkcjom pomocniczym rodziny dostawców.

```json
{
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

| Pole                  | Typ          | Znaczenie                                                                                           |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etykieta rodziny dostawcy używana przez ogólne decyzje dotyczące zgodności żądań i diagnostykę.     |
| `compatibilityFamily` | `"moonshot"` | Opcjonalna kategoria zgodności rodziny dostawcy dla współdzielonych funkcji pomocniczych żądań.      |
| `openAICompletions`   | `object`     | Flagi żądania uzupełnień zgodnych z OpenAI, obecnie `supportsStreamingUsage`.                        |

## Dokumentacja `secretProviderIntegrations`

Użyj `secretProviderIntegrations`, gdy plugin może publikować gotową, wielokrotnego użytku konfigurację dostawcy wykonawczego SecretRef. OpenClaw odczytuje te metadane przed załadowaniem środowiska wykonawczego pluginu, zapisuje własność pluginu w `secrets.providers.<alias>.pluginIntegration`, a właściwe rozpoznawanie sekretów pozostawia środowisku wykonawczemu SecretRef. Gotowe konfiguracje są udostępniane wyłącznie dla wbudowanych pluginów oraz zainstalowanych pluginów wykrytych w zarządzanych katalogach głównych instalacji pluginów, takich jak instalacje z git i ClawHub.

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

Klucz mapy jest identyfikatorem integracji. Jeśli pominięto `providerAlias`, OpenClaw używa identyfikatora integracji jako aliasu dostawcy SecretRef. Aliasy dostawców muszą być zgodne ze standardowym wzorcem aliasu dostawcy SecretRef, na przykład `team-secrets` lub `onepassword-work`.

Gdy operator wybierze gotową konfigurację, OpenClaw zapisuje odwołanie do dostawcy w następującej postaci:

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

Podczas uruchamiania lub ponownego ładowania OpenClaw rozpoznaje tego dostawcę, ładując bieżące metadane manifestu pluginu, sprawdzając, czy plugin będący właścicielem jest zainstalowany i aktywny, oraz tworząc polecenie wykonawcze na podstawie manifestu. Wyłączenie lub usunięcie pluginu unieważnia dostawcę dla aktywnych odwołań SecretRef. Operatorzy, którzy chcą używać samodzielnej konfiguracji wykonawczej, nadal mogą bezpośrednio definiować ręcznych dostawców za pomocą `command`/`args`.

Obecnie obsługiwane są wyłącznie gotowe konfiguracje `source: "exec"`. Wartością `command` musi być `${node}`, a `args[0]` musi wskazywać skrypt rozpoznawania względny wobec katalogu głównego pluginu i rozpoczynający się od `./`. Podczas uruchamiania lub ponownego ładowania OpenClaw zastępuje je bieżącym plikiem wykonywalnym Node oraz bezwzględną ścieżką skryptu wewnątrz pluginu. Opcje Node, takie jak `--require`, `--import`, `--loader`, `--env-file`, `--eval` i `--print`, nie są częścią kontraktu gotowej konfiguracji manifestu. Operatorzy potrzebujący poleceń innych niż Node mogą bezpośrednio skonfigurować samodzielnych ręcznych dostawców wykonawczych.

OpenClaw wyznacza `trustedDirs` dla gotowych konfiguracji manifestu na podstawie katalogu głównego pluginu, a w przypadku konfiguracji `${node}` również katalogu bieżącego pliku wykonywalnego Node. Wartości `trustedDirs` zdefiniowane w manifeście są ignorowane. Inne opcje dostawcy wykonawczego, takie jak `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` i `allowInsecurePath`, są przekazywane do standardowej konfiguracji dostawcy wykonawczego SecretRef.

## Dokumentacja `modelPricing`

Użyj `modelPricing`, gdy dostawca potrzebuje zachowania dotyczącego cen w płaszczyźnie sterowania przed załadowaniem środowiska wykonawczego. Pamięć podręczna cen Gateway odczytuje te metadane bez importowania kodu środowiska wykonawczego dostawcy.

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

| Pole         | Typ               | Znaczenie                                                                                                         |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Ustaw `false` dla lokalnych lub samodzielnie hostowanych dostawców, którzy nigdy nie powinni pobierać cen z OpenRouter ani LiteLLM. |
| `openRouter` | `false \| object` | Mapowanie wyszukiwania cen OpenRouter. `false` wyłącza wyszukiwanie OpenRouter dla tego dostawcy.                  |
| `liteLLM`    | `false \| object` | Mapowanie wyszukiwania cen LiteLLM. `false` wyłącza wyszukiwanie LiteLLM dla tego dostawcy.                        |

Pola źródła:

| Pole                       | Typ                | Znaczenie                                                                                                                   |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identyfikator dostawcy w zewnętrznym katalogu, gdy różni się od identyfikatora dostawcy OpenClaw, na przykład `z-ai` dla dostawcy `zai`. |
| `passthroughProviderModel` | `boolean`          | Traktuje identyfikatory modeli zawierające ukośniki jako zagnieżdżone odwołania dostawca/model, co jest przydatne dla dostawców proxy, takich jak OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Dodatkowe warianty identyfikatorów modeli zewnętrznego katalogu. `version-dots` próbuje identyfikatorów wersji z kropkami, takich jak `claude-opus-4.6`. |

### Indeks dostawców OpenClaw

Indeks dostawców OpenClaw to należące do OpenClaw metadane podglądu dostawców, których pluginy mogą nie być jeszcze zainstalowane. Nie jest on częścią manifestu pluginu. Manifesty pluginów pozostają źródłem prawdy o zainstalowanych pluginach. Indeks dostawców jest wewnętrznym kontraktem awaryjnym, z którego przyszłe interfejsy instalowalnych dostawców i wyboru modelu przed instalacją będą korzystać, gdy plugin dostawcy nie jest zainstalowany.

Kolejność źródeł katalogu:

1. Konfiguracja użytkownika.
2. `modelCatalog` manifestu zainstalowanego pluginu.
3. Pamięć podręczna katalogu modeli utworzona przez jawne odświeżenie.
4. Wiersze podglądu indeksu dostawców OpenClaw.

Indeks dostawców nie może zawierać sekretów, stanu włączenia, haków środowiska wykonawczego ani bieżących danych modeli właściwych dla określonego konta. Jego katalogi podglądu używają tego samego kształtu wiersza dostawcy `modelCatalog` co manifesty pluginów, ale powinny ograniczać się do stabilnych metadanych wyświetlania, chyba że pola adaptera środowiska wykonawczego, takie jak `api`, `baseUrl`, ceny lub flagi zgodności, są celowo utrzymywane w zgodności z manifestem zainstalowanego pluginu. Dostawcy obsługujący dynamiczne wykrywanie przez `/models` powinni zapisywać odświeżone wiersze za pośrednictwem jawnej ścieżki pamięci podręcznej katalogu modeli, zamiast wywoływać interfejsy API dostawcy podczas zwykłego wyświetlania listy lub wdrażania.

Wpisy indeksu dostawców mogą również zawierać metadane instalowalnego pluginu dla dostawców, których plugin został przeniesiony poza rdzeń lub z innego powodu nie jest jeszcze zainstalowany. Te metadane odzwierciedlają wzorzec katalogu kanałów: nazwa pakietu, specyfikacja instalacji npm, oczekiwana integralność oraz proste etykiety wyboru uwierzytelniania wystarczają do pokazania instalowalnej opcji konfiguracji. Po zainstalowaniu pluginu jego manifest ma pierwszeństwo, a wpis indeksu dostawców dla tego dostawcy jest ignorowany.

`openclaw doctor --fix` migruje mały, zamknięty zestaw starszych kluczy możliwości manifestu najwyższego poziomu do `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` oraz `tools`. Żaden z nich ani żadna inna lista możliwości nie jest już odczytywana z pól najwyższego poziomu manifestu; standardowe ładowanie manifestu rozpoznaje je wyłącznie w `contracts`.

## Manifest a package.json

Te dwa pliki służą do różnych celów:

| Plik                   | Zastosowanie                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Wykrywanie, walidacja konfiguracji, metadane wyboru uwierzytelniania oraz wskazówki interfejsu użytkownika, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadane npm, instalacja zależności oraz blok `openclaw` używany do punktów wejścia, warunków instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie należy umieścić daną metadaną, zastosuj następującą regułę:

- jeśli OpenClaw musi ją znać przed załadowaniem kodu pluginu, umieść ją w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub sposobu instalacji npm, umieść ją w `package.json`

### Pola package.json wpływające na wykrywanie

Niektóre metadane pluginu dostępne przed uruchomieniem celowo znajdują się w bloku `openclaw` pliku `package.json`, a nie w `openclaw.plugin.json`. `openclaw.bundle` i `openclaw.bundle.json` nie są kontraktami pluginów OpenClaw; natywne pluginy muszą używać `openclaw.plugin.json` wraz z obsługiwanymi polami `package.json#openclaw` wymienionymi poniżej.

Ważne przykłady:

| Pole                                                                                       | Znaczenie                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Deklaruje natywne punkty wejścia pluginu. Muszą pozostawać w katalogu pakietu pluginu.                                                                                                                     |
| `openclaw.runtimeExtensions`                                                               | Deklaruje zbudowane punkty wejścia środowiska wykonawczego JavaScript dla zainstalowanych pakietów. Muszą pozostawać w katalogu pakietu pluginu.                                                           |
| `openclaw.setupEntry`                                                                      | Lekki punkt wejścia używany wyłącznie podczas konfiguracji początkowej, odroczonego uruchamiania kanału oraz wykrywania statusu kanału/SecretRef w trybie tylko do odczytu. Musi pozostawać w katalogu pakietu pluginu. |
| `openclaw.runtimeSetupEntry`                                                               | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Wymaga `setupEntry`, musi istnieć i pozostawać w katalogu pakietu pluginu.                                         |
| `openclaw.channel`                                                                         | Lekkie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst opcji wyboru.                                                                                                   |
| `openclaw.channel.commands`                                                                | Statyczne metadane natywnych poleceń i automatyślnych ustawień natywnych umiejętności, używane przez konfigurację, audyt i powierzchnie list poleceń przed załadowaniem środowiska wykonawczego kanału.       |
| `openclaw.channel.configuredState`                                                         | Metadane lekkiego modułu sprawdzającego stan konfiguracji, który może odpowiedzieć na pytanie „czy istnieje już konfiguracja oparta wyłącznie na zmiennych środowiskowych?” bez ładowania pełnego środowiska wykonawczego kanału. |
| `openclaw.channel.persistedAuthState`                                                      | Metadane lekkiego modułu sprawdzającego utrwalony stan uwierzytelnienia, który może odpowiedzieć na pytanie „czy ktoś jest już zalogowany?” bez ładowania pełnego środowiska wykonawczego kanału.            |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Wskazówki dotyczące instalacji/aktualizacji pluginów dołączonych i publikowanych zewnętrznie.                                                                                                              |
| `openclaw.install.defaultChoice`                                                           | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                                               |
| `openclaw.install.minHostVersion`                                                          | Minimalna obsługiwana wersja hosta OpenClaw, określona dolną granicą semver, taką jak `>=2026.3.22` lub `>=2026.5.1-beta.1`.                                                                                |
| `openclaw.compat.pluginApi`                                                                | Minimalny zakres interfejsu API pluginów OpenClaw wymagany przez ten pakiet, określony dolną granicą semver, taką jak `>=2026.5.27`.                                                                        |
| `openclaw.install.expectedIntegrity`                                                       | Oczekiwany ciąg integralności dystrybucji npm, taki jak `sha512-...`; procesy instalacji i aktualizacji weryfikują względem niego pobrany artefakt.                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Zezwala na ściśle ograniczoną ścieżkę odzyskiwania przez ponowną instalację dołączonego pluginu, gdy konfiguracja jest nieprawidłowa.                                                                      |
| `openclaw.install.requiredPlatformPackages`                                                | Aliasy pakietów npm, które muszą zostać zmaterializowane, gdy ich ograniczenia platformowe w pliku blokady odpowiadają bieżącemu hostowi.                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Pozwala załadować powierzchnie kanału środowiska konfiguracji przed rozpoczęciem nasłuchiwania, a następnie odracza pełne załadowanie skonfigurowanego pluginu kanału do aktywacji po rozpoczęciu nasłuchiwania. |

Metadane manifestu określają, które opcje dostawcy/kanału/konfiguracji pojawiają się podczas konfiguracji początkowej przed załadowaniem środowiska wykonawczego. `package.json#openclaw.install` informuje proces konfiguracji początkowej, jak pobrać lub włączyć dany plugin, gdy użytkownik wybierze jedną z tych opcji. Nie przenoś wskazówek instalacyjnych do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru manifestów dla źródeł pluginów, które nie są dołączone. Nieprawidłowe wartości są odrzucane; nowsze, lecz prawidłowe wartości powodują pominięcie zewnętrznych pluginów na starszych hostach. Przyjmuje się, że dołączone pluginy źródłowe mają tę samą wersję co kopia robocza hosta.

`openclaw.install.requiredPlatformPackages` służy do określania pakietów npm, które udostępniają wymagane natywne pliki binarne za pośrednictwem opcjonalnych aliasów właściwych dla platformy. Dla każdego obsługiwanego aliasu platformowego podaj samą nazwę pakietu npm. Podczas instalacji npm OpenClaw weryfikuje wyłącznie zadeklarowany alias, którego ograniczenia w pliku blokady odpowiadają bieżącemu hostowi. Jeśli npm zgłosi powodzenie, ale pominie ten alias, OpenClaw ponowi próbę raz ze świeżą pamięcią podręczną i wycofa instalację, jeżeli alias nadal będzie nieobecny.

`openclaw.compat.pluginApi` jest egzekwowane podczas instalacji pakietów ze źródeł pluginów, które nie są dołączone. Użyj go do określenia minimalnej wersji interfejsu API SDK/środowiska wykonawczego pluginów OpenClaw, względem której zbudowano pakiet. Może być bardziej rygorystyczne niż `minHostVersion`, gdy pakiet pluginu wymaga nowszego interfejsu API, ale nadal zachowuje niższą wskazówkę instalacyjną dla innych przepływów. Oficjalna synchronizacja wydań OpenClaw domyślnie podnosi istniejące minimalne wersje interfejsu API oficjalnych pluginów do wersji wydania OpenClaw, ale wydania obejmujące wyłącznie plugin mogą zachować niższą granicę, gdy pakiet celowo obsługuje starsze hosty. Nie używaj samej wersji pakietu jako kontraktu zgodności. `peerDependencies.openclaw` pozostaje metadanymi pakietu npm; OpenClaw używa kontraktu `openclaw.compat.pluginApi` do podejmowania decyzji o zgodności instalacji.

Oficjalne metadane instalacji na żądanie powinny używać `clawhubSpec`, gdy plugin jest opublikowany w ClawHub; konfiguracja początkowa traktuje je jako preferowane źródło zdalne i po instalacji zapisuje informacje o artefakcie ClawHub. `npmSpec` pozostaje zgodnościowym rozwiązaniem rezerwowym dla pakietów, które nie zostały jeszcze przeniesione do ClawHub.

Dokładne przypięcie wersji npm znajduje się już w `npmSpec`, na przykład `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne wpisy katalogu zewnętrznego powinny łączyć dokładne specyfikacje z `expectedIntegrity`, aby procesy aktualizacji kończyły się bezpiecznym niepowodzeniem, jeżeli pobrany artefakt npm przestanie odpowiadać przypiętemu wydaniu. Interaktywna konfiguracja początkowa nadal oferuje zaufane specyfikacje npm rejestru, w tym same nazwy pakietów i znaczniki dystrybucji, w celu zachowania zgodności. Diagnostyka katalogu może rozróżniać źródła dokładne, zmienne, przypięte integralnością, pozbawione integralności, z niezgodną nazwą pakietu oraz z nieprawidłową opcją domyślną. Ostrzega również, gdy `expectedIntegrity` jest obecne, ale nie istnieje prawidłowe źródło npm, do którego można je przypiąć. Gdy `expectedIntegrity` jest obecne, procesy instalacji/aktualizacji je egzekwują; gdy zostanie pominięte, rozstrzygnięcie rejestru jest zapisywane bez przypięcia integralności.

Pluginy kanałów powinny udostępniać `openclaw.setupEntry`, gdy skanowanie statusu, listy kanałów lub SecretRef musi identyfikować skonfigurowane konta bez ładowania pełnego środowiska wykonawczego. Punkt wejścia konfiguracji powinien udostępniać metadane kanału oraz bezpieczne dla konfiguracji adaptery konfiguracji, statusu i sekretów; klientów sieciowych, procesy nasłuchujące Gateway i środowiska wykonawcze transportu należy pozostawić w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia środowiska wykonawczego nie zastępują kontroli granic pakietu dla pól źródłowych punktów wejścia. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że ścieżka `openclaw.extensions` wychodząca poza pakiet stanie się możliwa do załadowania.

`openclaw.install.allowInvalidConfigRecovery` jest celowo ściśle ograniczone. Nie umożliwia instalowania dowolnych uszkodzonych konfiguracji. Obecnie pozwala procesom instalacji odzyskać sprawność tylko po określonych błędach aktualizacji nieaktualnych dołączonych pluginów, takich jak brak ścieżki dołączonego pluginu lub nieaktualny wpis `channels.<id>` dotyczący tego samego dołączonego pluginu. Niepowiązane błędy konfiguracji nadal blokują instalację i kierują operatorów do `openclaw doctor --fix`.

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

Użyj ich, gdy konfiguracja, diagnostyka, status lub przepływy sprawdzania obecności w trybie tylko do odczytu wymagają taniego sprawdzenia uwierzytelnienia typu tak/nie przed załadowaniem pełnego pluginu kanału. Utrwalony stan uwierzytelnienia nie jest stanem skonfigurowania kanału: nie używaj tych metadanych do automatycznego włączania pluginów, naprawiania zależności środowiska wykonawczego ani decydowania, czy środowisko wykonawcze kanału powinno zostać załadowane. Docelowy eksport powinien być małą funkcją odczytującą wyłącznie utrwalony stan; nie kieruj go przez główny moduł eksportowy pełnego środowiska wykonawczego kanału.

`openclaw.channel.configuredState` ma taką samą strukturę dla lekkich kontroli skonfigurowania opartych wyłącznie na zmiennych środowiskowych:

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

Użyj go, gdy kanał może określić stan skonfigurowania na podstawie zmiennych środowiskowych lub innych niewielkich danych wejściowych niezależnych od środowiska wykonawczego. Jeśli kontrola wymaga pełnego rozstrzygnięcia konfiguracji lub rzeczywistego środowiska wykonawczego kanału, pozostaw tę logikę w haku pluginu `config.hasConfiguredState`.

## Priorytet wykrywania (zduplikowane identyfikatory pluginów)

OpenClaw wykrywa pluginy z trzech katalogów głównych sprawdzanych w następującej kolejności: pluginy dołączone do OpenClaw, globalny katalog główny instalacji (`~/.openclaw/extensions`) oraz katalog główny bieżącego obszaru roboczego (`<workspace>/.openclaw/extensions`), a także wszystkie jawne wpisy `plugins.load.paths`.

Jeśli dwa wykryte elementy mają ten sam `id`, zachowywany jest wyłącznie manifest o **najwyższym priorytecie**; duplikaty o niższym priorytecie są odrzucane zamiast ładowania obok niego. Priorytet od najwyższego do najniższego:

1. **Wybrany przez konfigurację** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Globalna instalacja zgodna ze śledzonym rekordem instalacji** — plugin zainstalowany za pomocą `openclaw plugin install`/`openclaw plugin update`, który mechanizm śledzenia instalacji OpenClaw rozpoznaje dla tego samego identyfikatora, nawet gdy identyfikator należy również do dołączonego pluginu
3. **Dołączony** — pluginy dostarczane z OpenClaw
4. **Obszar roboczy** — pluginy wykryte względem bieżącego obszaru roboczego
5. Każdy inny wykryty kandydat

Konsekwencje:

- Rozgałęziona lub nieaktualna kopia dołączonego pluginu, znajdująca się bez śledzenia w obszarze roboczym lub globalnym katalogu głównym, nie przesłoni dołączonej kompilacji.
- Aby zastąpić dołączony plugin, uruchom `openclaw plugin install` dla danego identyfikatora, tak aby śledzona instalacja globalna uzyskała wyższy priorytet niż dołączona kopia, albo przypnij konkretną ścieżkę za pomocą `plugins.entries.<id>`, aby wygrała dzięki priorytetowi wyboru przez konfigurację.
- Odrzucanie duplikatów jest rejestrowane, dzięki czemu diagnostyka Doctor i uruchamiania może wskazać odrzuconą kopię.
- Zastąpienia duplikatów wybrane przez konfigurację są w diagnostyce opisywane jako jawne zastąpienia, ale nadal generują ostrzeżenie, aby nieaktualne rozgałęzienia i przypadkowe przesłonięcia pozostawały widoczne.

## Wymagania schematu JSON

- **Każdy plugin musi zawierać schemat JSON**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest dopuszczalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są weryfikowane podczas odczytu i zapisu konfiguracji, a nie w czasie działania.
- Rozszerzając lub tworząc fork dołączonego pluginu o nowe klucze konfiguracji, zaktualizuj jednocześnie `configSchema` w pliku `openclaw.plugin.json` tego pluginu. Schematy dołączonych pluginów są rygorystyczne, dlatego dodanie `plugins.entries.<id>.config.myNewKey` w konfiguracji użytkownika bez dodania `myNewKey` do `configSchema.properties` zostanie odrzucone przed załadowaniem środowiska wykonawczego pluginu.

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

## Sposób walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału został zadeklarowany w manifeście pluginu. Jeśli ten sam identyfikator występuje również w `plugins.allow`, `plugins.entries` lub `plugins.installs` (plugin, do którego istnieje odwołanie, ale którego obecnie nie można wykryć), OpenClaw obniża rangę problemu do **ostrzeżenia**.
- Odwołania do nieznanych identyfikatorów pluginów w `plugins.entries.<id>`, `plugins.allow` i `plugins.deny` są **ostrzeżeniami** („zignorowano nieaktualny wpis konfiguracji”), a nie błędami, dzięki czemu aktualizacje oraz usunięte lub przemianowane pluginy nie blokują uruchomienia Gateway.
- Odwołanie do nieznanego identyfikatora pluginu w `plugins.slots.memory` jest **błędem**, z wyjątkiem znanego oficjalnego zewnętrznego pluginu `memory-lancedb`, dla którego generowane jest ostrzeżenie.
- Jeśli plugin jest zainstalowany, ale jego manifest lub schemat jest uszkodzony albo go brakuje, walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja zostaje zachowana, a w Doctor i dziennikach pojawia się **ostrzeżenie**.

Pełny schemat `plugins.*` opisano w [dokumentacji konfiguracji](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany w przypadku natywnych pluginów OpenClaw**, w tym ładowanych z lokalnego systemu plików. Środowisko wykonawcze nadal ładuje moduł pluginu oddzielnie; manifest służy wyłącznie do wykrywania i walidacji.
- Natywne manifesty są analizowane jako JSON5, więc komentarze, przecinki na końcu i klucze bez cudzysłowów są dozwolone, o ile końcowa wartość nadal jest obiektem.
- Moduł ładujący manifest odczytuje tylko udokumentowane pola manifestu. Unikaj niestandardowych kluczy najwyższego poziomu.
- Pola `channels`, `providers`, `cliBackends` i `skills` można pominąć, jeśli plugin ich nie potrzebuje.
- `providerCatalogEntry` musi pozostać lekki i nie powinien importować rozbudowanego kodu środowiska wykonawczego; używaj go do statycznych metadanych katalogu dostawców lub precyzyjnych deskryptorów wykrywania, a nie do wykonywania operacji podczas obsługi żądań.
- Wyłączne rodzaje pluginów są wybierane za pomocą `plugins.slots.*`: `kind: "memory"` przez `plugins.slots.memory` (domyślnie `memory-core`), a `kind: "context-engine"` przez `plugins.slots.contextEngine` (domyślnie `legacy`).
- Zadeklaruj wyłączny rodzaj pluginu w tym manifeście. Pole `OpenClawPluginDefinition.kind` punktu wejścia środowiska wykonawczego jest przestarzałe i pozostaje jedynie jako mechanizm zgodności dla starszych pluginów.
- Metadane zmiennych środowiskowych (`setup.providers[].envVars`, przestarzałe `providerAuthEnvVars` oraz `channelEnvVars`) mają wyłącznie charakter deklaratywny. Mechanizmy statusu, audytu, walidacji dostarczania Cron i inne powierzchnie tylko do odczytu nadal stosują zasady zaufania pluginów oraz obowiązujące zasady aktywacji, zanim uznają zmienną środowiskową za skonfigurowaną.
- Metadane kreatora środowiska wykonawczego wymagające kodu dostawcy opisano w sekcji [punkty zaczepienia środowiska wykonawczego dostawcy](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli plugin zależy od modułów natywnych, udokumentuj kroki kompilacji i wszelkie wymagania dotyczące listy dozwolonych elementów menedżera pakietów (na przykład `allow-build-scripts` w pnpm oraz `pnpm rebuild <package>`).

## Powiązane materiały

<CardGroup cols={3}>
  <Card title="Tworzenie pluginów" href="/pl/plugins/building-plugins" icon="rocket">
    Pierwsze kroki z pluginami.
  </Card>
  <Card title="Architektura pluginów" href="/pl/plugins/architecture" icon="diagram-project">
    Architektura wewnętrzna i model możliwości.
  </Card>
  <Card title="Przegląd SDK" href="/pl/plugins/sdk-overview" icon="book">
    Dokumentacja SDK pluginów i importów ścieżek podrzędnych.
  </Card>
</CardGroup>
