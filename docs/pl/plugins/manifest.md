---
read_when:
    - Tworzysz plugin OpenClaw
    - Trzeba dostarczyć schemat konfiguracji pluginu lub debugować błędy walidacji pluginu
summary: Wymagania dotyczące manifestu Pluginu i schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Pluginu
x-i18n:
    generated_at: "2026-07-16T18:52:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a858e0bba9ee47dd7ce96413f744818d721420549a0c9af82b72a5572e758c7
    source_path: plugins/manifest.md
    workflow: 16
---

Ta strona opisuje **natywny manifest pluginu OpenClaw**, `openclaw.plugin.json`. Informacje o zgodnych układach pakietów (Codex, Claude, Cursor) zawiera sekcja [Pakiety pluginów](/pl/plugins/bundles).

Zgodne formaty pakietów używają zamiast niego własnych plików manifestu:

- Pakiet Codex: `.codex-plugin/plugin.json`
- Pakiet Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentów Claude bez manifestu
- Pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa te układy, ale nie weryfikuje ich względem poniższego schematu `openclaw.plugin.json`. W przypadku zgodnego pakietu OpenClaw odczytuje metadane pakietu, zadeklarowane katalogi główne umiejętności, katalogi główne poleceń Claude, domyślne wartości `settings.json` Claude, domyślne wartości LSP Claude oraz obsługiwane pakiety hooków, jeśli układ odpowiada wymaganiom środowiska uruchomieniowego OpenClaw.

Każdy natywny plugin OpenClaw **musi** zawierać `openclaw.plugin.json` w **katalogu głównym pluginu**. OpenClaw odczytuje go, aby zweryfikować konfigurację **bez wykonywania kodu pluginu**. Brakujący lub nieprawidłowy manifest blokuje walidację konfiguracji i jest traktowany jako błąd pluginu.

Pełny przewodnik po systemie pluginów zawiera strona [Pluginy](/pl/tools/plugin), a opis natywnego modelu możliwości i aktualne wytyczne dotyczące zgodności zewnętrznej — strona [Model możliwości](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` zawiera metadane odczytywane przez OpenClaw **przed załadowaniem kodu pluginu**. Sprawdzenie wszystkich zawartych w nim danych musi być na tyle tanie, aby nie wymagało uruchamiania środowiska wykonawczego pluginu.

**Należy go używać do:**

- tożsamości pluginu, walidacji konfiguracji i wskazówek interfejsu konfiguracji
- metadanych uwierzytelniania, wdrażania i konfiguracji (aliasu, automatycznego włączania, zmiennych środowiskowych dostawcy i metod uwierzytelniania)
- wskazówek dotyczących aktywacji dla powierzchni płaszczyzny sterowania
- własności skróconych rodzin modeli
- statycznych migawek własności możliwości (`contracts`)
- metadanych narzędzia uruchamiającego QA, które może sprawdzać współdzielony host `openclaw qa`
- metadanych konfiguracji specyficznych dla kanałów, scalanych z katalogiem i powierzchniami walidacji

**Nie należy go używać do:** rejestrowania zachowania w czasie wykonywania, deklarowania punktów wejścia kodu ani przechowywania metadanych instalacji npm. Należą one do kodu pluginu i pliku `package.json`.

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

## Opis pól najwyższego poziomu

| Pole                                 | Wymagane | Typ                          | Znaczenie                                                                                                                                                                                                                                                                  |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Tak      | `string`                     | Kanoniczny identyfikator pluginu. Jest to identyfikator używany w `plugins.entries.<id>`.                                                                                                                                                                                       |
| `configSchema`                       | Tak      | `object`                     | Wbudowany schemat JSON konfiguracji tego pluginu.                                                                                                                                                                                                                          |
| `requiresPlugins`                    | Nie      | `string[]`                   | Identyfikatory pluginów, które również muszą być zainstalowane, aby ten plugin działał. Mechanizm wykrywania umożliwia załadowanie pluginu, ale ostrzega, gdy brakuje któregokolwiek wymaganego pluginu.                                                                       |
| `enabledByDefault`                   | Nie      | `true`                       | Oznacza dołączony plugin jako domyślnie włączony. Pominięcie tego pola lub ustawienie dowolnej wartości innej niż `true` pozostawia plugin domyślnie wyłączony.                                                                                                  |
| `enabledByDefaultOnPlatforms`        | Nie      | `string[]`                   | Oznacza dołączony plugin jako domyślnie włączony tylko na wymienionych platformach Node.js, na przykład `["darwin"]`. Jawna konfiguracja nadal ma pierwszeństwo.                                                                                                      |
| `legacyPluginIds`                    | Nie      | `string[]`                   | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                                                                                          |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                   | Identyfikatory dostawców, które powinny automatycznie włączać ten plugin, gdy odwołania do uwierzytelniania, konfiguracji lub modeli je wymieniają.                                                                                                                          |
| `kind`                               | Nie      | `PluginKind \| PluginKind[]` | Deklaruje co najmniej jeden wyłączny rodzaj pluginu (`"memory"`, `"context-engine"`) używany przez `plugins.slots.*`. Plugin będący właścicielem obu miejsc deklaruje oba rodzaje w jednej tablicy.                                                                   |
| `channels`                           | Nie      | `string[]`                   | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                                                         |
| `providers`                          | Nie      | `string[]`                   | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                                                                                                       |
| `providerCatalogEntry`               | Nie      | `string`                     | Ścieżka lekkiego modułu katalogu dostawcy, względna wobec katalogu głównego pluginu, zawierającego metadane katalogu dostawców ograniczone do manifestu, które można załadować bez aktywowania pełnego środowiska wykonawczego pluginu.                                        |
| `modelSupport`                       | Nie      | `object`                     | Należące do manifestu metadane skróconej rodziny modeli, używane do automatycznego ładowania pluginu przed uruchomieniem środowiska wykonawczego.                                                                                                                           |
| `modelCatalog`                       | Nie      | `object`                     | Deklaratywne metadane katalogu modeli dla dostawców należących do tego pluginu. Jest to kontrakt płaszczyzny sterowania dla przyszłych list tylko do odczytu, wdrażania, selektorów modeli, aliasów i wykluczania bez ładowania środowiska wykonawczego pluginu.                  |
| `modelPricing`                       | Nie      | `object`                     | Należąca do dostawcy polityka wyszukiwania zewnętrznych cen. Służy do wykluczania lokalnych lub samodzielnie hostowanych dostawców ze zdalnych katalogów cen albo mapowania odwołań dostawców na identyfikatory katalogów OpenRouter/LiteLLM bez wpisywania identyfikatorów na stałe w rdzeniu. |
| `modelIdNormalization`               | Nie      | `object`                     | Należące do dostawcy oczyszczanie aliasów lub prefiksów identyfikatorów modeli, które musi zostać wykonane przed załadowaniem środowiska wykonawczego dostawcy.                                                                                                             |
| `providerEndpoints`                  | Nie      | `object[]`                   | Należące do manifestu metadane hosta punktu końcowego lub adresu baseUrl dla tras dostawcy, które rdzeń musi sklasyfikować przed załadowaniem środowiska wykonawczego dostawcy.                                                                                              |
| `providerRequest`                    | Nie      | `object`                     | Lekkie metadane rodziny dostawcy i zgodności żądań używane przez ogólną politykę żądań przed załadowaniem środowiska wykonawczego dostawcy.                                                                                                                                 |
| `secretProviderIntegrations`         | Nie      | `Record<string, object>`     | Deklaratywne ustawienia wstępne dostawcy wykonawczego SecretRef, które interfejsy konfiguracji lub instalacji mogą oferować bez wpisywania na stałe w rdzeniu integracji specyficznych dla dostawcy.                                                                         |
| `cliBackends`                        | Nie      | `string[]`                   | Identyfikatory backendów wnioskowania CLI należących do tego pluginu. Używane do automatycznej aktywacji podczas uruchamiania na podstawie jawnych odwołań w konfiguracji.                                                                                                   |
| `syntheticAuthRefs`                  | Nie      | `string[]`                   | Odwołania do dostawcy lub backendu CLI, dla których należący do pluginu syntetyczny hak uwierzytelniania powinien zostać sprawdzony podczas wykrywania modeli na zimno przed załadowaniem środowiska wykonawczego.                                                            |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                   | Należące do dołączonego pluginu zastępcze wartości klucza API reprezentujące niepoufny stan lokalnych danych uwierzytelniających, OAuth lub danych uwierzytelniających z otoczenia.                                                                                           |
| `commandAliases`                     | Nie      | `object[]`                   | Nazwy poleceń należących do tego pluginu, które powinny generować diagnostykę konfiguracji i CLI uwzględniającą plugin przed załadowaniem środowiska wykonawczego.                                                                                                          |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`   | Przestarzałe metadane zmiennych środowiskowych zgodności używane do wyszukiwania uwierzytelniania lub stanu dostawcy. W przypadku nowych pluginów preferowane jest `setup.providers[].envVars`; OpenClaw nadal odczytuje te dane w okresie wycofywania.                                 |
| `providerUsageAuthEnvVars`           | Nie      | `Record<string, string[]>`   | Dane uwierzytelniające dostawcy używane wyłącznie do sprawdzania użycia lub rozliczeń. OpenClaw używa tych nazw do wykrywania użycia i usuwania sekretów, lecz nigdy do uwierzytelniania wnioskowania.                                                                         |
| `providerAuthAliases`                | Nie      | `Record<string, string>`     | Identyfikatory dostawców, które powinny ponownie wykorzystywać inny identyfikator dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący klucz API i profile uwierzytelniania dostawcy bazowego.                                               |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`   | Lekkie metadane zmiennych środowiskowych kanału, które OpenClaw może sprawdzać bez ładowania kodu pluginu. Należy ich używać w przypadku konfiguracji kanału sterowanej zmiennymi środowiskowymi lub interfejsów uwierzytelniania, które powinny być widoczne dla ogólnych mechanizmów uruchamiania i konfiguracji. |
| `providerAuthChoices`                | Nie      | `object[]`                   | Lekkie metadane wyboru uwierzytelniania dla selektorów wdrażania, rozpoznawania preferowanego dostawcy i prostego powiązania flag CLI.                                                                                                                                       |
| `activation`                         | Nie      | `object`                     | Lekkie metadane planisty aktywacji dotyczące ładowania wyzwalanego przez uruchamianie, dostawcę, polecenie, kanał, trasę i możliwości. Są to wyłącznie metadane; środowisko wykonawcze pluginu nadal odpowiada za rzeczywiste działanie.                                         |
| `setup`                              | Nie      | `object`                     | Lekkie deskryptory konfiguracji i wdrażania, które mechanizmy wykrywania oraz interfejsy konfiguracji mogą sprawdzać bez ładowania środowiska wykonawczego pluginu.                                                                                                         |
| `qaRunners`                          | Nie      | `object[]`                   | Lekkie deskryptory mechanizmu uruchamiającego QA używane przez współdzielony host `openclaw qa` przed załadowaniem środowiska wykonawczego pluginu.                                                                                                                     |
| `contracts`                          | Nie      | `object`                     | Statyczna migawka własności możliwości dotycząca zewnętrznych haków uwierzytelniania, osadzeń, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia multimediów, generowania obrazów, wideo i muzyki, pobierania oraz wyszukiwania w sieci, dostawców procesów roboczych, wyodrębniania dokumentów i treści internetowych oraz własności narzędzi. |
| `configContracts`                    | Nie       | `object`                     | Zachowanie konfiguracji należące do manifestu, używane przez ogólne pomocnicze funkcje rdzenia: wykrywanie niebezpiecznych flag, cele migracji SecretRef oraz zawężanie starszych ścieżek konfiguracji. Zobacz [dokumentację configContracts](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | Nie       | `Record<string, object>`     | Niedrogie domyślne ustawienia rozpoznawania multimediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Nie       | `Record<string, object>`     | Niedrogie metadane uwierzytelniania generowania obrazów dla identyfikatorów dostawców zadeklarowanych w `contracts.imageGenerationProviders`, w tym aliasy uwierzytelniania należące do dostawcy oraz zabezpieczenia bazowego adresu URL.                                                                                                         |
| `videoGenerationProviderMetadata`    | Nie       | `Record<string, object>`     | Niedrogie metadane uwierzytelniania generowania wideo dla identyfikatorów dostawców zadeklarowanych w `contracts.videoGenerationProviders`, w tym aliasy uwierzytelniania należące do dostawcy oraz zabezpieczenia bazowego adresu URL.                                                                                                         |
| `musicGenerationProviderMetadata`    | Nie       | `Record<string, object>`     | Niedrogie metadane uwierzytelniania generowania muzyki dla identyfikatorów dostawców zadeklarowanych w `contracts.musicGenerationProviders`, w tym aliasy uwierzytelniania należące do dostawcy oraz zabezpieczenia bazowego adresu URL.                                                                                                         |
| `toolMetadata`                       | Nie       | `Record<string, object>`     | Niedrogie metadane dostępności dla narzędzi należących do pluginu, zadeklarowanych w `contracts.tools`. Należy ich użyć, gdy narzędzie nie powinno ładować środowiska uruchomieniowego, o ile nie istnieją dane potwierdzające obecność konfiguracji, zmiennych środowiskowych lub uwierzytelniania.                                                                                                  |
| `channelConfigs`                     | Nie       | `Record<string, object>`     | Metadane konfiguracji kanału należące do manifestu, scalane z powierzchniami wykrywania i walidacji przed załadowaniem środowiska uruchomieniowego.                                                                                                                                                                 |
| `skills`                             | Nie       | `string[]`                   | Katalogi Skills do załadowania, określone względem katalogu głównego pluginu.                                                                                                                                                                                                                    |
| `name`                               | Nie       | `string`                     | Czytelna dla człowieka nazwa pluginu.                                                                                                                                                                                                                                                |
| `description`                        | Nie       | `string`                     | Krótkie podsumowanie wyświetlane w interfejsach pluginu.                                                                                                                                                                                                                                    |
| `catalog`                            | Nie       | `object`                     | Opcjonalne wskazówki dotyczące prezentacji w interfejsach katalogu pluginów. Te metadane nie instalują ani nie włączają pluginu i nie nadają mu zaufania.                                                                                                                                               |
| `icon`                               | Nie       | `string`                     | Adres URL obrazu HTTPS dla kart w platformie handlowej lub katalogu. ClawHub akceptuje każdy prawidłowy adres URL `https://` i używa domyślnej ikony pluginu, gdy wartość zostanie pominięta lub jest nieprawidłowa.                                                                                                         |
| `version`                            | Nie       | `string`                     | Informacyjna wersja pluginu.                                                                                                                                                                                                                                              |
| `uiHints`                            | Nie       | `Record<string, object>`     | Etykiety interfejsu użytkownika, teksty zastępcze i wskazówki dotyczące poufności pól konfiguracji.                                                                                                                                                                                                          |

## dokumentacja pól katalogu

`catalog` udostępnia opcjonalne wskazówki dotyczące wyświetlania w przeglądarkach pluginów. Hosty mogą je ignorować. Wskazówki te nigdy nie instalują ani nie włączają pluginu oraz nie zmieniają jego działania w czasie wykonywania ani poziomu zaufania.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Pole       | Typ       | Znaczenie                                                                  |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Określa, czy powierzchnie katalogu powinny wyróżniać ten plugin.            |
| `order`    | `number`  | Rosnąca wskazówka kolejności wyświetlania wśród wyselekcjonowanych pluginów; niższe wartości pojawiają się wcześniej. |

## Dokumentacja metadanych dostawcy generowania

Pola metadanych dostawcy generowania opisują statyczne sygnały uwierzytelniania dostawców zadeklarowanych na odpowiadającej im liście `contracts.*GenerationProviders`. OpenClaw odczytuje te pola przed załadowaniem środowiska uruchomieniowego dostawcy, aby podstawowe narzędzia mogły ustalić dostępność dostawcy generowania bez importowania każdego pluginu dostawcy.

Tych pól należy używać wyłącznie do prostych, deklaratywnych faktów. Transport, przekształcenia żądań, odświeżanie tokenów, weryfikacja danych uwierzytelniających i właściwe działanie generowania pozostają w środowisku uruchomieniowym pluginu.

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

| Pole                   | Wymagane | Typ        | Znaczenie                                                                                                                                           |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Nie      | `string[]` | Dodatkowe identyfikatory dostawców, które należy traktować jako statyczne aliasy uwierzytelniania dostawcy generowania.                               |
| `authProviders`        | Nie      | `string[]` | Identyfikatory dostawców, których skonfigurowane profile uwierzytelniania należy uznawać za uwierzytelnianie tego dostawcy generowania.                |
| `configSignals`        | Nie      | `object[]` | Proste sygnały dostępności oparte wyłącznie na konfiguracji dla dostawców lokalnych lub hostowanych samodzielnie, których można skonfigurować bez profili uwierzytelniania ani zmiennych środowiskowych. |
| `authSignals`          | Nie      | `object[]` | Jawne sygnały uwierzytelniania. Jeśli są obecne, zastępują domyślny zestaw sygnałów pochodzący z identyfikatora dostawcy, `aliases` i `authProviders`. |
| `referenceAudioInputs` | Nie      | `boolean`  | Tylko generowanie wideo. Ustaw na `true`, gdy dostawca akceptuje referencyjne zasoby audio; w przeciwnym razie `video_generate` ukrywa parametry referencyjnego audio. |

Każdy wpis `configSignals` obsługuje:

| Pole             | Wymagane | Typ        | Znaczenie                                                                                                                                                                                |
| ---------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Tak      | `string`   | Ścieżka z kropkami do należącego do pluginu obiektu konfiguracji, który ma zostać sprawdzony, na przykład `plugins.entries.example.config`.                                              |
| `overlayPath`    | Nie      | `string`   | Ścieżka z kropkami wewnątrz konfiguracji głównej, której obiekt powinien zostać nałożony na obiekt główny przed oceną sygnału. Służy do konfiguracji właściwej dla funkcji, takiej jak `image`, `video` lub `music`. |
| `overlayMapPath` | Nie      | `string`   | Ścieżka z kropkami wewnątrz konfiguracji głównej, której poszczególne wartości obiektowe powinny być nakładane na obiekt główny. Służy do map nazwanych kont, takich jak `accounts`, w których dowolne skonfigurowane konto powinno spełniać warunek. |
| `required`       | Nie      | `string[]` | Ścieżki z kropkami wewnątrz wynikowej konfiguracji, które muszą zawierać skonfigurowane wartości. Ciągi znaków nie mogą być puste; obiekty i tablice również nie mogą być puste. |
| `requiredAny`    | Nie      | `string[]` | Ścieżki z kropkami wewnątrz wynikowej konfiguracji, z których co najmniej jedna musi zawierać skonfigurowaną wartość.                                          |
| `mode`           | Nie      | `object`   | Opcjonalny warunek trybu w postaci ciągu znaków wewnątrz wynikowej konfiguracji. Służy, gdy dostępność oparta wyłącznie na konfiguracji dotyczy tylko jednego trybu. |

Każdy warunek `mode` obsługuje:

| Pole         | Wymagane | Typ        | Znaczenie                                                                          |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Nie      | `string`   | Ścieżka z kropkami wewnątrz wynikowej konfiguracji. Domyślnie `mode`.   |
| `default`    | Nie      | `string`   | Wartość trybu używana, gdy konfiguracja nie zawiera tej ścieżki.                    |
| `allowed`    | Nie      | `string[]` | Jeśli występuje, sygnał jest spełniony tylko wtedy, gdy wynikowy tryb ma jedną z tych wartości. |
| `disallowed` | Nie      | `string[]` | Jeśli występuje, sygnał nie jest spełniony, gdy wynikowy tryb ma jedną z tych wartości. |

Każdy wpis `authSignals` obsługuje:

| Pole              | Wymagane | Typ      | Znaczenie                                                                                                                                                                     |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Tak      | `string` | Identyfikator dostawcy, który należy sprawdzić w skonfigurowanych profilach uwierzytelniania.                                                                                  |
| `providerBaseUrl` | Nie      | `object` | Opcjonalny warunek sprawiający, że sygnał jest uwzględniany tylko wtedy, gdy wskazany skonfigurowany dostawca używa dozwolonego bazowego adresu URL. Służy, gdy alias uwierzytelniania jest prawidłowy tylko dla określonych interfejsów API. |

Każdy warunek `providerBaseUrl` obsługuje:

| Pole              | Wymagane | Typ        | Znaczenie                                                                                                                                             |
| ----------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Tak      | `string`   | Identyfikator konfiguracji dostawcy, którego `baseUrl` należy sprawdzić.                                                                      |
| `defaultBaseUrl`  | Nie      | `string`   | Bazowy adres URL przyjmowany, gdy konfiguracja dostawcy nie zawiera `baseUrl`.                                                                |
| `allowedBaseUrls` | Tak      | `string[]` | Dozwolone bazowe adresy URL dla tego sygnału uwierzytelniania. Sygnał jest ignorowany, gdy skonfigurowany lub domyślny bazowy adres URL nie odpowiada żadnej z tych znormalizowanych wartości. |

## Dokumentacja metadanych narzędzi

`toolMetadata` używa tych samych struktur `configSignals` i `authSignals` co metadane dostawcy generowania, indeksowanych według nazwy narzędzia. `contracts.tools` deklaruje własność. `toolMetadata` deklaruje prosty dowód dostępności, dzięki czemu OpenClaw może uniknąć importowania środowiska uruchomieniowego pluginu tylko po to, aby jego fabryka narzędzia zwróciła `null`.

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

Wpisy `toolMetadata` akceptują również `optional` (oznacza narzędzie jako niewymagane do aktywacji pluginu) oraz `replaySafe` (oznacza wykonanie narzędzia jako bezpieczne do powtórzenia po niepełnej turze modelu), oprócz wspólnych pól `configSignals`/`authSignals` opisanych powyżej.

Jeśli narzędzie nie ma `toolMetadata`, OpenClaw zachowuje dotychczasowe działanie i ładuje plugin będący jego właścicielem, gdy kontrakt narzędzia odpowiada zasadom. W przypadku narzędzi używanych w ścieżkach krytycznych, których fabryka zależy od uwierzytelniania lub konfiguracji, autorzy pluginów powinni zadeklarować `toolMetadata`, zamiast wymuszać import środowiska uruchomieniowego przez podstawowy system w celu uzyskania tej informacji.

## Dokumentacja providerAuthChoices

Każdy wpis `providerAuthChoices` opisuje jedną opcję wdrażania lub uwierzytelniania. OpenClaw odczytuje ją przed załadowaniem środowiska uruchomieniowego dostawcy. Listy konfiguracji dostawców korzystają z tych opcji manifestu, opcji konfiguracji wyprowadzonych z deskryptorów oraz metadanych katalogu instalacyjnego bez ładowania środowiska uruchomieniowego dostawcy.

| Pole                  | Wymagane | Typ                                                                   | Znaczenie                                                                                                           |
| --------------------- | -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                                              | Identyfikator dostawcy, do którego należy ta opcja.                                                                 |
| `method`              | Tak      | `string`                                                              | Identyfikator metody uwierzytelniania, do której należy przekierować obsługę.                                        |
| `choiceId`            | Tak      | `string`                                                              | Stabilny identyfikator opcji uwierzytelniania używany w procesach wdrażania i CLI.                                   |
| `choiceLabel`         | Nie      | `string`                                                              | Etykieta widoczna dla użytkownika. Jeśli ją pominięto, OpenClaw używa wartości `choiceId`.                   |
| `choiceHint`          | Nie      | `string`                                                              | Krótki tekst pomocniczy dla selektora.                                                                               |
| `assistantPriority`   | Nie      | `number`                                                              | Niższe wartości są sortowane wcześniej w interaktywnych selektorach obsługiwanych przez asystenta.                   |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                                        | Ukrywa opcję w selektorach asystenta, nadal umożliwiając ręczny wybór w CLI.                                         |
| `deprecatedChoiceIds` | Nie      | `string[]`                                                            | Starsze identyfikatory opcji, które powinny przekierowywać użytkowników do tej opcji zastępczej.                     |
| `groupId`             | Nie      | `string`                                                              | Opcjonalny identyfikator grupy służący do grupowania powiązanych opcji.                                              |
| `groupLabel`          | Nie      | `string`                                                              | Etykieta tej grupy widoczna dla użytkownika.                                                                         |
| `groupHint`           | Nie      | `string`                                                              | Krótki tekst pomocniczy dla grupy.                                                                                   |
| `onboardingFeatured`  | Nie      | `boolean`                                                             | Wyświetla tę grupę w wyróżnionej sekcji interaktywnego selektora wdrażania, przed pozycją „Więcej...”.                |
| `optionKey`           | Nie      | `string`                                                              | Wewnętrzny klucz opcji dla prostych procesów uwierzytelniania z jedną flagą.                                         |
| `cliFlag`             | Nie      | `string`                                                              | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                                     |
| `cliOption`           | Nie      | `string`                                                              | Pełna postać opcji CLI, na przykład `--openrouter-api-key <key>`.                                                              |
| `cliDescription`      | Nie      | `string`                                                              | Opis używany w pomocy CLI.                                                                                           |
| `appGuidedSecret`     | Nie      | `boolean`                                                             | Jeden wklejony sekret wraz z wartościami domyślnymi dostawcy wystarcza do konfiguracji prowadzonej przez aplikację.  |
| `appGuidedDiscovery`  | Nie      | `boolean`                                                             | Odpowiadająca metoda uwierzytelniania środowiska wykonawczego zarządza lokalnym wykrywaniem tylko do odczytu za pośrednictwem `appGuidedSetup`. |
| `appGuidedAuth`       | Nie      | `"oauth"` \| `"device-code"`                                          | Interaktywne logowanie zarządzane przez dostawcę, które natywne klienty konfiguracji mogą renderować w sposób ogólny. |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Określa, na których powierzchniach wdrażania ma się pojawiać ta opcja. Jeśli wartość pominięto, domyślnie używana jest `["text-inference"]`. |

Gdy `appGuidedDiscovery` ma wartość true, odpowiadająca metoda uwierzytelniania dostawcy musi udostępniać
`appGuidedSetup.detect` i `appGuidedSetup.prepare`. Wykrywanie musi odbywać się
wyłącznie do odczytu: bez logowania, pobierania modelu, pobierania plików ani zapisywania konfiguracji. Przygotowanie ponownie sprawdza
dokładnie wybrany model i zwraca propozycję konfiguracji; OpenClaw testuje tę
propozycję na żywo w izolacji i zatwierdza ją dopiero po powodzeniu.

## Dokumentacja commandAliases

Należy użyć `commandAliases`, gdy plugin zarządza nazwą polecenia środowiska wykonawczego, którą użytkownicy mogą omyłkowo umieścić w `plugins.allow` lub próbować uruchomić jako główne polecenie CLI. OpenClaw używa tych metadanych do diagnostyki bez importowania kodu środowiska wykonawczego pluginu.

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

| Pole         | Wymagane | Typ               | Znaczenie                                                                            |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------------------ |
| `name`       | Tak      | `string`          | Nazwa polecenia należącego do tego pluginu.                                           |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie czatu z ukośnikiem, a nie główne polecenie CLI.          |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI sugerowane do operacji CLI, jeśli takie istnieje.      |

## Dokumentacja activation

Należy użyć `activation`, gdy plugin może niewielkim kosztem zadeklarować, które zdarzenia płaszczyzny sterowania powinny uwzględniać go w planie aktywacji lub ładowania.

Ten blok zawiera metadane planisty, a nie interfejs API cyklu życia. Nie rejestruje zachowania środowiska wykonawczego, nie zastępuje `register(...)` ani nie gwarantuje, że kod pluginu został już wykonany. Planista aktywacji używa tych pól do zawężenia listy pluginów kandydujących, zanim skorzysta z istniejących metadanych własności manifestu, takich jak `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` oraz haki.

Preferowane są najbardziej szczegółowe metadane, które już opisują własność. Należy użyć `providers`, `channels`, `commandAliases`, deskryptorów konfiguracji lub `contracts`, gdy te pola wyrażają daną relację. `activation` należy używać do dodatkowych wskazówek dla planisty, których nie można przedstawić za pomocą tych pól własności. `cliBackends` najwyższego poziomu należy używać do aliasów środowiska wykonawczego CLI, takich jak `claude-cli`, `my-cli` lub `google-gemini-cli`; `activation.onAgentHarnesses` służy wyłącznie do identyfikatorów osadzonej infrastruktury agentów, które nie mają jeszcze pola własności.

Każdy plugin powinien świadomie ustawić `activation.onStartup`. Wartość `true` należy ustawić tylko wtedy, gdy plugin musi działać podczas uruchamiania Gateway. Wartość `false` należy ustawić, gdy plugin jest bezczynny podczas uruchamiania i powinien być ładowany wyłącznie przez bardziej szczegółowe wyzwalacze. Pominięcie `onStartup` nie powoduje już niejawnego ładowania pluginu podczas uruchamiania; należy użyć jawnych metadanych aktywacji dla wyzwalaczy aktywacji podczas uruchamiania, przez kanał, konfigurację, infrastrukturę agenta, pamięć lub innych bardziej szczegółowych wyzwalaczy.

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

| Pole               | Wymagane | Typ                                                  | Znaczenie                                                                                                                                                                                        |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Nie      | `boolean`                                            | Jawna aktywacja podczas uruchamiania Gateway. Każdy plugin powinien ją ustawić. `true` importuje plugin podczas uruchamiania; `false` zachowuje jego leniwe ładowanie podczas uruchamiania, chyba że inny dopasowany wyzwalacz wymaga załadowania. |
| `onProviders`      | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny uwzględniać ten plugin w planach aktywacji lub ładowania.                                                                                                  |
| `onAgentHarnesses` | Nie      | `string[]`                                           | Identyfikatory środowiska wykonawczego osadzonej infrastruktury agentów, które powinny uwzględniać ten plugin w planach aktywacji lub ładowania. Dla aliasów zaplecza CLI należy użyć `cliBackends` najwyższego poziomu. |
| `onCommands`       | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględniać ten plugin w planach aktywacji lub ładowania.                                                                                                    |
| `onChannels`       | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględniać ten plugin w planach aktywacji lub ładowania.                                                                                                    |
| `onRoutes`         | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględniać ten plugin w planach aktywacji lub ładowania.                                                                                                             |
| `onConfigPaths`    | Nie      | `string[]`                                           | Ścieżki konfiguracji względne wobec katalogu głównego, które powinny uwzględniać ten plugin w planach uruchamiania lub ładowania, gdy ścieżka istnieje i nie została jawnie wyłączona.               |
| `onCapabilities`   | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Ogólne wskazówki dotyczące możliwości używane przez planowanie aktywacji płaszczyzny sterowania. W miarę możliwości preferowane są bardziej szczegółowe pola.                                      |

Bieżący aktywni konsumenci:

- Planowanie uruchamiania Gateway używa `activation.onStartup` do jawnego importu podczas uruchamiania.
- Planowanie CLI wyzwalane poleceniem korzysta awaryjnie ze starszego mechanizmu `commandAliases[].cliCommand` lub `commandAliases[].name`.
- Planowanie uruchamiania środowiska wykonawczego agenta używa `activation.onAgentHarnesses` dla osadzonych mechanizmów testowych oraz nadrzędnego `cliBackends[]` dla aliasów środowiska wykonawczego CLI.
- Planowanie konfiguracji/kanału wyzwalane przez kanał korzysta awaryjnie ze starszej własności `channels[]`, gdy brakuje jawnych metadanych aktywacji kanału.
- Planowanie Pluginów podczas uruchamiania używa `activation.onConfigPaths` dla głównych powierzchni konfiguracji niezwiązanych z kanałami, takich jak blok `browser` dołączonego Pluginu przeglądarki.
- Planowanie konfiguracji/środowiska wykonawczego wyzwalane przez dostawcę korzysta awaryjnie ze starszej własności `providers[]` i nadrzędnej własności `cliBackends[]`, gdy brakuje jawnych metadanych aktywacji dostawcy.

Diagnostyka planisty może odróżnić jawne wskazówki aktywacji od awaryjnego użycia własności manifestu. Na przykład `activation-command-hint` oznacza dopasowanie `activation.onCommands`, natomiast `manifest-command-alias` oznacza, że planista użył zamiast tego własności `commandAliases`. Te etykiety przyczyn służą do diagnostyki hosta i testów; autorzy Pluginów powinni nadal deklarować metadane, które najlepiej opisują własność.

## Dokumentacja qaRunners

Należy użyć `qaRunners`, gdy Plugin udostępnia co najmniej jeden moduł uruchamiający transport poniżej
wspólnego elementu głównego `openclaw qa`. Te metadane powinny pozostać proste i statyczne; środowisko
wykonawcze Pluginu nadal odpowiada za faktyczną rejestrację CLI za pośrednictwem lekkiej
powierzchni `runtime-api.ts`, która eksportuje pasujące elementy `qaRunnerCliRegistrations`. Opcjonalny
element `adapterFactory` udostępnia transport wspólnym scenariuszom kontroli jakości bez
zmiany modułu uruchamiającego zarejestrowanego polecenia.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Uruchom obsługiwaną przez Docker ścieżkę kontroli jakości Matrix na żywo względem jednorazowego serwera macierzystego"
    }
  ]
}
```

| Pole         | Wymagane | Typ     | Znaczenie                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Tak      | `string` | Podpolecenie zamontowane poniżej `openclaw qa`, na przykład `matrix`.    |
| `description` | Nie       | `string` | Zastępczy tekst pomocy używany, gdy wspólny host potrzebuje polecenia szkieletowego. |

Identyfikator `adapterFactory` musi odpowiadać `commandName`. Nie należy eksportować rejestracji
dla poleceń nieobecnych w manifeście.

## Dokumentacja konfiguracji

Należy użyć `setup`, gdy powierzchnie konfiguracji i wdrażania potrzebują prostych metadanych należących do Pluginu przed załadowaniem środowiska wykonawczego.

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
            "source": "lokalne dane uwierzytelniające openai"
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

Nadrzędny element `cliBackends` pozostaje prawidłowy i nadal opisuje zaplecza wnioskowania CLI. `setup.cliBackends` to powierzchnia deskryptorów specyficzna dla konfiguracji, przeznaczona dla przepływów płaszczyzny sterowania/konfiguracji, które powinny opierać się wyłącznie na metadanych.

Gdy elementy `setup.providers` i `setup.cliBackends` są obecne, stanowią preferowaną powierzchnię wyszukiwania opartą najpierw na deskryptorach podczas wykrywania konfiguracji. Jeśli deskryptor jedynie zawęża kandydujący Plugin, a konfiguracja nadal wymaga bogatszych punktów zaczepienia środowiska wykonawczego na etapie konfiguracji, należy ustawić `requiresRuntime: true` i pozostawić `setup-api` jako awaryjną ścieżkę wykonania.

OpenClaw uwzględnia również `setup.providers[].envVars` w ogólnych wyszukiwaniach uwierzytelniania dostawców i zmiennych środowiskowych. `providerAuthEnvVars` pozostaje obsługiwane za pośrednictwem adaptera zgodności w okresie wycofywania, ale niedołączone Pluginy, które nadal go używają, otrzymują komunikat diagnostyczny manifestu. Nowe Pluginy powinny umieszczać metadane środowiska konfiguracji/stanu w `setup.providers[].envVars`.

Należy użyć `providerUsageAuthEnvVars`, gdy dane uwierzytelniające na poziomie rozliczeń lub organizacji muszą aktywować `resolveUsageAuth`, nie stając się danymi uwierzytelniającymi do wnioskowania. Nazwy te zostają objęte blokowaniem plików dotenv obszaru roboczego, usuwaniem ze środowiska procesów podrzędnych ACP, filtrowaniem sekretów w piaskownicy i ogólnym oczyszczaniem sekretów. Środowisko wykonawcze dostawcy nadal odczytuje i klasyfikuje wartość wewnątrz `resolveUsageAuth`.

OpenClaw może również wyprowadzać proste opcje konfiguracji z `setup.providers[].authMethods`, gdy wpis konfiguracji jest niedostępny albo gdy `setup.requiresRuntime: false` deklaruje, że środowisko wykonawcze konfiguracji jest zbędne. Jawne wpisy `providerAuthChoices` pozostają preferowane w przypadku niestandardowych etykiet, flag CLI, zakresu wdrażania i metadanych asystenta.

Element `requiresRuntime: false` należy ustawić tylko wtedy, gdy te deskryptory są wystarczające dla powierzchni konfiguracji. OpenClaw traktuje jawny element `false` jako kontrakt oparty wyłącznie na deskryptorach i nie wykona `setup-api` ani `openclaw.setupEntry` podczas wyszukiwania konfiguracji. Jeśli Plugin oparty wyłącznie na deskryptorach nadal zawiera jeden z tych wpisów środowiska wykonawczego konfiguracji, OpenClaw zgłasza dodatkowy komunikat diagnostyczny i nadal go ignoruje. Pominięcie `requiresRuntime` zachowuje starsze zachowanie awaryjne, dzięki czemu istniejące Pluginy, które dodały deskryptory bez tej flagi, nie przestają działać.

Ponieważ wyszukiwanie konfiguracji może wykonywać kod `setup-api` należący do Pluginu, znormalizowane wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikatowe we wszystkich wykrytych Pluginach. W przypadku niejednoznacznej własności operacja kończy się niepowodzeniem zamiast wybierać zwycięzcę na podstawie kolejności wykrywania.

Gdy środowisko wykonawcze konfiguracji zostanie wykonane, diagnostyka rejestru konfiguracji zgłasza rozbieżność deskryptorów, jeśli `setup-api` rejestruje dostawcę lub zaplecze CLI, którego nie deklarują deskryptory manifestu, albo jeśli deskryptor nie ma odpowiadającej mu rejestracji środowiska wykonawczego. Te komunikaty diagnostyczne są dodatkowe i nie powodują odrzucania starszych Pluginów.

### Dokumentacja setup.providers

| Pole          | Wymagane | Typ       | Znaczenie                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Tak      | `string`   | Identyfikator dostawcy udostępniany podczas konfiguracji lub wdrażania. Znormalizowane identyfikatory muszą być globalnie unikatowe.             |
| `authMethods`  | Nie       | `string[]` | Identyfikatory metod konfiguracji/uwierzytelniania obsługiwanych przez tego dostawcę bez ładowania pełnego środowiska wykonawczego.                       |
| `envVars`      | Nie       | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie konfiguracji/stanu mogą sprawdzać przed załadowaniem środowiska wykonawczego Pluginu.               |
| `authEvidence` | Nie       | `object[]` | Proste lokalne kontrole dowodów uwierzytelnienia dla dostawców, którzy mogą uwierzytelniać się za pomocą znaczników niebędących sekretami. |

Element `authEvidence` służy do lokalnych znaczników danych uwierzytelniających należących do dostawcy, które można zweryfikować bez ładowania kodu środowiska wykonawczego. Kontrole te muszą pozostać proste i lokalne: bez wywołań sieciowych, odczytów z pęku kluczy lub menedżera sekretów, poleceń powłoki ani prób interfejsu API dostawcy.

Obsługiwane wpisy dowodów:

| Pole              | Wymagane | Typ       | Znaczenie                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Tak      | `string`   | Obecnie `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Nie       | `string`   | Zmienna środowiskowa zawierająca jawną ścieżkę pliku danych uwierzytelniających.                                                           |
| `fallbackPaths`    | Nie       | `string[]` | Ścieżki lokalnych plików danych uwierzytelniających sprawdzane, gdy `fileEnvVar` jest nieobecne lub puste. Obsługuje `${HOME}` i `${APPDATA}`. |
| `requiresAnyEnv`   | Nie       | `string[]` | Co najmniej jedna z wymienionych zmiennych środowiskowych musi być niepusta, aby dowód był prawidłowy.                                    |
| `requiresAllEnv`   | Nie       | `string[]` | Każda z wymienionych zmiennych środowiskowych musi być niepusta, aby dowód był prawidłowy.                                           |
| `credentialMarker` | Tak      | `string`   | Znacznik niebędący sekretem zwracany, gdy dowód jest obecny.                                                       |
| `source`           | Nie       | `string`   | Widoczna dla użytkownika etykieta źródła na potrzeby danych wyjściowych uwierzytelniania/stanu.                                                               |

### Pola konfiguracji

| Pole              | Wymagane | Typ       | Znaczenie                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Nie       | `object[]` | Deskryptory konfiguracji dostawców udostępniane podczas konfiguracji i wdrażania.                                     |
| `cliBackends`      | Nie       | `string[]` | Identyfikatory zaplecza używane podczas konfiguracji do wyszukiwania konfiguracji opartego najpierw na deskryptorach. Znormalizowane identyfikatory muszą być globalnie unikatowe. |
| `configMigrations` | Nie       | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego Pluginu.                                          |
| `requiresRuntime`  | Nie       | `boolean`  | Określa, czy konfiguracja nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                            |

## Dokumentacja uiHints

`uiHints` to mapa nazw pól konfiguracji na niewielkie wskazówki dotyczące renderowania. Klucze mogą używać kropek dla zagnieżdżonych pól konfiguracji, ale żaden segment ścieżki nie może być równy `__proto__`, `constructor` ani `prototype`; konfiguracja odrzuca takie nazwy.

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

| Pole         | Typ       | Znaczenie                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Widoczna dla użytkownika etykieta pola.                |
| `help`        | `string`   | Krótki tekst pomocniczy.                      |
| `tags`        | `string[]` | Opcjonalne znaczniki interfejsu użytkownika.                       |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.            |
| `sensitive`   | `boolean`  | Oznacza pole jako tajne lub poufne. |
| `placeholder` | `string`   | Tekst zastępczy dla pól formularza.       |

## Dokumentacja kontraktów

Należy używać `contracts` wyłącznie dla statycznych metadanych własności możliwości, które OpenClaw może odczytać bez importowania środowiska wykonawczego Pluginu.

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

| Pole                             | Typ        | Znaczenie                                                                                                                            |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory fabryk rozszerzeń serwera aplikacji Codex, obecnie `codex-app-server`.                                                |
| `agentToolResultMiddleware`      | `string[]` | Identyfikatory środowisk uruchomieniowych, dla których ten plugin może rejestrować oprogramowanie pośredniczące wyników narzędzi.     |
| `trustedToolPolicies`            | `string[]` | Lokalne dla pluginu identyfikatory zaufanych zasad poprzedzających narzędzia, które może rejestrować zainstalowany plugin. Wbudowane pluginy mogą rejestrować zasady bez tego pola. |
| `externalAuthProviders`          | `string[]` | Identyfikatory dostawców, których hak zewnętrznego profilu uwierzytelniania należy do tego pluginu.                                  |
| `embeddingProviders`             | `string[]` | Identyfikatory ogólnych dostawców osadzania należących do tego pluginu, przeznaczonych do wielokrotnego generowania osadzeń wektorowych, w tym dla pamięci. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należących do tego pluginu.                                                                            |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należących do tego pluginu.                                               |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należących do tego pluginu.                                                      |
| `memoryEmbeddingProviders`       | `string[]` | Przestarzałe identyfikatory dostawców osadzania specyficznych dla pamięci, należących do tego pluginu.                                |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia multimediów należących do tego pluginu.                                                          |
| `transcriptSourceProviders`      | `string[]` | Identyfikatory dostawców źródeł transkrypcji należących do tego pluginu.                                                             |
| `documentExtractors`             | `string[]` | Identyfikatory dostawców ekstraktorów dokumentów (na przykład PDF) należących do tego pluginu.                                       |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należących do tego pluginu.                                                             |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania filmów należących do tego pluginu.                                                              |
| `musicGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania muzyki należących do tego pluginu.                                                              |
| `webContentExtractors`           | `string[]` | Identyfikatory dostawców wyodrębniania treści stron internetowych należących do tego pluginu.                                        |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania zawartości z internetu należących do tego pluginu.                                               |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania w internecie należących do tego pluginu.                                                       |
| `workerProviders`                | `string[]` | Identyfikatory dostawców pracowników chmurowych należących do tego pluginu, używanych do aprowizacji i cyklu życia dzierżaw opartych na profilach. |
| `usageProviders`                 | `string[]` | Identyfikatory dostawców, których haki uwierzytelniania użycia i migawek użycia należą do tego pluginu.                              |
| `migrationProviders`             | `string[]` | Identyfikatory dostawców importu należących do tego pluginu dla `openclaw migrate`.                                                   |
| `gatewayMethodDispatch`          | `string[]` | Zastrzeżone uprawnienie dla uwierzytelnionych tras HTTP pluginu, które wysyłają metody Gateway w obrębie procesu.                     |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego pluginu.                                                                                    |

`contracts.embeddedExtensionFactories` jest zachowane dla wbudowanych fabryk rozszerzeń przeznaczonych wyłącznie dla serwera aplikacji Codex. Wbudowane przekształcenia wyników narzędzi powinny zamiast tego deklarować `contracts.agentToolResultMiddleware` i rejestrować się za pomocą `api.registerAgentToolResultMiddleware(...)`. Zainstalowane pluginy mogą korzystać z tego samego punktu integracji oprogramowania pośredniczącego tylko po jawnym włączeniu i wyłącznie dla środowisk uruchomieniowych zadeklarowanych w `contracts.agentToolResultMiddleware`.

Zainstalowane pluginy, które potrzebują warstwy zaufanych przez hosta zasad poprzedzających narzędzia, muszą zadeklarować każdy rejestrowany lokalny identyfikator w `contracts.trustedToolPolicies` i zostać jawnie włączone. Wbudowane pluginy zachowują istniejącą ścieżkę zaufanych zasad, lecz zainstalowane pluginy z niezadeklarowanymi identyfikatorami zasad są odrzucane przed rejestracją. Identyfikatory zasad mają zakres pluginu, który je rejestruje, dlatego dwa pluginy mogą zadeklarować i zarejestrować `workflow-budget`; jeden plugin nie może dwukrotnie zarejestrować tego samego lokalnego identyfikatora.

Rejestracje środowiska uruchomieniowego `api.registerTool(...)` muszą odpowiadać `contracts.tools`. Mechanizm wykrywania narzędzi używa tej listy, aby ładować wyłącznie środowiska uruchomieniowe pluginów, które mogą być właścicielami żądanych narzędzi.

Pluginy dostawców implementujące `resolveExternalAuthProfiles` powinny deklarować `contracts.externalAuthProviders`; niezadeklarowane haki zewnętrznego uwierzytelniania są ignorowane.

Pluginy dostawców implementujące zarówno `resolveUsageAuth`, jak i `fetchUsageSnapshot` powinny deklarować każdy automatycznie wykrywany identyfikator dostawcy w `contracts.usageProviders`. Mechanizm wykrywania użycia odczytuje ten kontrakt przed załadowaniem kodu środowiska uruchomieniowego, a następnie weryfikuje oba haki po załadowaniu wyłącznie zadeklarowanych właścicieli.

Ogólni dostawcy osadzania powinni deklarować `contracts.embeddingProviders` dla każdego adaptera zarejestrowanego za pomocą `api.registerEmbeddingProvider(...)`. Ogólnego kontraktu należy używać do wielokrotnego generowania wektorów, w tym przez dostawców używanych przez wyszukiwanie w pamięci. `contracts.memoryEmbeddingProviders` jest przestarzałą warstwą zgodności specyficzną dla pamięci i pozostaje tylko na czas migracji istniejących dostawców do ogólnego punktu integracji dostawców osadzania.

Dostawcy pracowników muszą deklarować każdy identyfikator `api.registerWorkerProvider(...)` w `contracts.workerProviders`. Rdzeń utrwala trwały zamiar przed wywołaniem `provision`; dostawcy weryfikują swoje ustawienia przed zewnętrzną alokacją, a powtarzane wywołania z tym samym identyfikatorem operacji muszą przejąć tę samą dzierżawę. Rdzeń utrwala również tę zweryfikowaną migawkę ustawień i przekazuje ją wraz z `leaseId` do `inspect({ leaseId, profile })` oraz `destroy({ leaseId, profile })`, także po zmianie lub usunięciu nazwanego profilu. Niszczenie jest idempotentne, inspekcja zwraca zamkniętą unię stanów `active` / `destroyed` / `unknown`, a materiał prywatnego klucza SSH jest wskazywany wyłącznie za pośrednictwem `SecretRef`. Aprowizowane punkty końcowe SSH muszą również zawierać publiczny `hostKey` z zaufanych danych wyjściowych aprowizacji w dokładnym formacie `algorithm base64`, bez nazwy hosta ani komentarza, aby rdzeń mógł przypiąć host przed nawiązaniem połączenia. Dostawcy generujący dynamiczne odwołania do tożsamości mogą implementować autorytatywny `resolveSshIdentity({ leaseId, profile, keyRef })`; dostawcy bez niego używają ogólnego mechanizmu rozpoznawania sekretów rdzenia. Autorytatywny `unknown` osieroca aktywny rekord lokalny; po utrwalonym żądaniu zniszczenia potwierdza zakończenie usuwania.

`contracts.gatewayMethodDispatch` obecnie akceptuje `"authenticated-request"`. Jest to bramka higieny API dla natywnych tras HTTP pluginów, które celowo wysyłają metody płaszczyzny sterowania Gateway w obrębie procesu, a nie piaskownica chroniąca przed złośliwymi natywnymi pluginami. Należy jej używać wyłącznie dla dokładnie zweryfikowanych powierzchni wbudowanych lub operatorskich, które już wymagają uwierzytelniania HTTP Gateway. Trasa z uprawnieniem pozostaje osiągalna przy zamkniętym przyjmowaniu pracy głównej przez Gateway tylko wtedy, gdy deklaruje również `auth: "gateway"` oraz specyficzny dla trasy `gatewayRuntimeScopeSurface: "trusted-operator"`; zwykłe trasy równorzędne tego samego pluginu pozostają za granicą przyjmowania. Dzięki temu stan zawieszenia i wznowienie pozostają dostępne bez przyznawania całemu pluginowi obejścia mechanizmu przyjmowania. Analizowanie i kształtowanie odpowiedzi poza wysyłaniem należy utrzymywać w ograniczonym zakresie; istotna lub modyfikująca praca musi przechodzić przez wysyłanie metod Gateway, które odpowiada za przyjmowanie i egzekwowanie zakresu.

## Dokumentacja configContracts

Należy używać `configContracts` do zachowań konfiguracji należących do manifestu, których potrzebują ogólne pomocnicze mechanizmy rdzenia bez importowania środowiska uruchomieniowego pluginu: wykrywania niebezpiecznych flag, celów migracji SecretRef oraz zawężania starszych ścieżek konfiguracji.

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

| Pole                          | Wymagane | Typ        | Znaczenie                                                                                                                                                                                                                              |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Nie      | `string[]` | Ścieżki konfiguracji względne wobec katalogu głównego, które wskazują, że migracje zgodności tego pluginu wykonywane podczas konfiguracji mogą mieć zastosowanie. Pozwala to ogólnym odczytom konfiguracji środowiska uruchomieniowego pomijać wszystkie powierzchnie konfiguracji pluginów, gdy konfiguracja nigdy nie odwołuje się do danego pluginu. |
| `compatibilityRuntimePaths`   | Nie      | `string[]` | Ścieżki zgodności względne wobec katalogu głównego, które ten plugin może obsłużyć podczas działania przed pełną aktywacją kodu pluginu. Należy używać tego dla starszych powierzchni, które powinny zawężać zestawy wbudowanych kandydatów bez importowania każdego zgodnego środowiska uruchomieniowego pluginu. |
| `dangerousFlags`              | Nie      | `object[]` | Literały konfiguracji, które `openclaw doctor` powinien oznaczać jako niezabezpieczone lub niebezpieczne, gdy są włączone. Zobacz poniżej.                                                                                               |
| `secretInputs`                | Nie      | `object`   | Ścieżki konfiguracji w obrębie `plugins.entries.<id>.config`, które rejestr celów migracji/audytu SecretRef powinien traktować jako ciągi znaków o strukturze sekretu. Zobacz poniżej.                                                  |

Każdy wpis `dangerousFlags` obsługuje:

| Pole     | Wymagane | Typ                                   | Znaczenie                                                                                                           |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Tak      | `string`                              | Rozdzielana kropkami ścieżka konfiguracji względna wobec `plugins.entries.<id>.config`. Obsługuje symbole wieloznaczne `*` dla segmentów map/tablic. |
| `equals` | Tak      | `string \| number \| boolean \| null` | Dokładny literał oznaczający tę wartość konfiguracji jako niebezpieczną.                                             |

`secretInputs` obsługuje:

| Pole                    | Wymagane | Typ        | Znaczenie                                                                                                                                                                                                       |
| ----------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Nie      | `boolean`  | Zastępuje domyślne włączenie dołączonego pluginu podczas określania, czy ta powierzchnia SecretRef jest aktywna. Należy użyć tej opcji, gdy plugin jest dołączony, ale powierzchnia ma pozostać nieaktywna do czasu jawnego włączenia w konfiguracji. |
| `paths`                 | Tak      | `object[]` | Ścieżki konfiguracji zawierające sekrety, każda z `path` (rozdzielona kropkami, względna wobec `plugins.entries.<id>.config`, obsługuje symbole wieloznaczne `*`) i opcjonalnym `expected` (obecnie tylko `"string"`).                            |

## Dokumentacja mediaUnderstandingProviderMetadata

Należy użyć `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia multimediów ma domyślne modele, priorytet automatycznego uwierzytelniania awaryjnego lub natywną obsługę dokumentów, których ogólne pomocnicze funkcje rdzenia potrzebują przed załadowaniem środowiska uruchomieniowego. Klucze muszą być również zadeklarowane w `contracts.mediaUnderstandingProviders`.

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

| Pole                   | Typ                                                              | Znaczenie                                                                                                        |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Możliwości multimedialne udostępniane przez tego dostawcę.                                                       |
| `defaultModels`        | `Record<string, string>`                                         | Domyślne przypisania możliwości do modeli używane, gdy konfiguracja nie określa modelu.                         |
| `autoPriority`         | `Record<string, number>`                                         | Niższe liczby są sortowane wcześniej podczas automatycznego wyboru dostawcy awaryjnego na podstawie poświadczeń. |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Natywne dane wejściowe dokumentów obsługiwane przez dostawcę.                                                    |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Nadpisania modeli dla poszczególnych typów dokumentów. Ustawienie `image: false` wyłącza wyodrębnianie oparte na obrazach dla tego typu dokumentu. |

## Dokumentacja channelConfigs

Należy użyć `channelConfigs`, gdy plugin kanału potrzebuje prostych metadanych konfiguracji przed załadowaniem środowiska uruchomieniowego. Wykrywanie konfiguracji i stanu kanału w trybie tylko do odczytu może używać tych metadanych bezpośrednio w przypadku skonfigurowanych kanałów zewnętrznych, gdy wpis konfiguracji jest niedostępny lub gdy `setup.requiresRuntime: false` wskazuje, że środowisko uruchomieniowe konfiguracji nie jest wymagane.

`channelConfigs` to metadane manifestu pluginu, a nie nowa sekcja najwyższego poziomu konfiguracji użytkownika. Użytkownicy nadal konfigurują instancje kanałów w `channels.<channel-id>`. OpenClaw odczytuje metadane manifestu, aby określić, który plugin jest właścicielem skonfigurowanego kanału, zanim zostanie wykonany kod środowiska uruchomieniowego pluginu.

W przypadku pluginu kanału `configSchema` i `channelConfigs` opisują różne ścieżki:

- `configSchema` weryfikuje `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` weryfikuje `channels.<channel-id>`

Niedołączone pluginy deklarujące `channels[]` powinny także deklarować pasujące wpisy `channelConfigs`. Bez nich OpenClaw nadal może załadować plugin, ale schemat konfiguracji ścieżki zimnej, konfiguracja i powierzchnie Control UI nie mogą poznać kształtu opcji należących do kanału, dopóki nie zostanie wykonane środowisko uruchomieniowe pluginu.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` i `nativeSkillsAutoEnabled` mogą deklarować statyczne wartości domyślne `auto` na potrzeby kontroli konfiguracji poleceń wykonywanych przed załadowaniem środowiska uruchomieniowego kanału. Dołączone kanały mogą także publikować te same wartości domyślne przez `package.json#openclaw.channel.commands` wraz z innymi metadanymi katalogu kanałów należącymi do pakietu.

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
          "label": "Adres URL serwera domowego",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Połączenie z serwerem domowym Matrix",
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

| Pole          | Typ                      | Znaczenie                                                                                       |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schemat JSON dla `channels.<id>`. Wymagany dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety interfejsu, symbole zastępcze i wskazówki dotyczące danych wrażliwych dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami wyboru i inspekcji, gdy metadane środowiska uruchomieniowego nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                        |
| `commands`    | `object`                 | Statyczne automatyczne wartości domyślne natywnych poleceń i natywnych Skills na potrzeby kontroli konfiguracji przed uruchomieniem. |
| `preferOver`  | `string[]`               | Identyfikatory starszych pluginów lub pluginów o niższym priorytecie, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

### Zastępowanie innego pluginu kanału

Należy użyć `preferOver`, gdy dany plugin jest preferowanym właścicielem identyfikatora kanału, który może być również udostępniany przez inny plugin. Typowe przypadki to zmieniony identyfikator pluginu, samodzielny plugin zastępujący plugin dołączony lub utrzymywany fork zachowujący ten sam identyfikator kanału w celu zgodności konfiguracji.

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

Gdy skonfigurowano `channels.chat`, OpenClaw uwzględnia zarówno identyfikator kanału, jak i identyfikator preferowanego pluginu. Jeśli plugin o niższym priorytecie został wybrany tylko dlatego, że jest dołączony lub domyślnie włączony, OpenClaw wyłącza go w efektywnej konfiguracji środowiska uruchomieniowego, dzięki czemu jeden plugin jest właścicielem kanału i jego narzędzi. Jawny wybór użytkownika nadal ma pierwszeństwo: jeśli użytkownik jawnie włączy oba pluginy (przez `plugins.allow` lub istotną konfigurację `plugins.entries`), OpenClaw zachowa ten wybór i zgłosi diagnostykę zduplikowanych kanałów lub narzędzi zamiast niejawnie zmieniać żądany zestaw pluginów.

Zakres `preferOver` należy ograniczyć do identyfikatorów pluginów, które rzeczywiście mogą udostępniać ten sam kanał. Nie jest to ogólne pole priorytetu i nie zmienia nazw kluczy konfiguracji użytkownika.

## Dokumentacja modelSupport

Należy użyć `modelSupport`, gdy OpenClaw powinien wywnioskować plugin dostawcy ze skróconych identyfikatorów modeli, takich jak `gpt-5.6-sol` lub `claude-sonnet-4.6`, przed załadowaniem środowiska uruchomieniowego pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następującą kolejność pierwszeństwa:

- jawne odwołania `provider/model` używają metadanych manifestu należącego do `providers`
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują zarówno jeden niedołączony, jak i jeden dołączony plugin, pierwszeństwo ma niedołączony plugin
- pozostałe niejednoznaczności są ignorowane, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Znaczenie                                                                       |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane za pomocą `startsWith` do skróconych identyfikatorów modeli. |
| `modelPatterns` | `string[]` | Źródła wyrażeń regularnych dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

Wpisy `modelPatterns` są kompilowane za pomocą `compileSafeRegex`, które odrzuca wzorce zawierające zagnieżdżone powtórzenia (na przykład `(a+)+$`). Wzorce, które nie przejdą kontroli bezpieczeństwa, są pomijane bez komunikatu, podobnie jak wyrażenia regularne niepoprawne składniowo. Wzorce powinny być proste i nie zawierać zagnieżdżonych kwantyfikatorów.

## Dokumentacja modelCatalog

Należy użyć `modelCatalog`, gdy OpenClaw powinien znać metadane modeli dostawcy przed załadowaniem środowiska uruchomieniowego pluginu. Jest to należące do manifestu źródło stałych wierszy katalogu, aliasów dostawców, reguł pomijania i trybu wykrywania. Odświeżanie w czasie wykonywania nadal należy do kodu środowiska uruchomieniowego dostawcy, ale manifest informuje rdzeń, kiedy środowisko uruchomieniowe jest wymagane.

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
        "reason": "niedostępne w Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Pola najwyższego poziomu:

| Pole            | Typ                                                     | Znaczenie                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Wiersze katalogu dla identyfikatorów dostawców należących do tego pluginu. Klucze powinny również występować w nadrzędnym elemencie `providers`.       |
| `aliases`        | `Record<string, object>`                                 | Aliasy dostawców, które powinny być rozpoznawane jako należący do pluginu dostawca na potrzeby planowania katalogu lub pomijania.              |
| `suppressions`   | `object[]`                                               | Wiersze modeli z innego źródła, które ten plugin pomija z przyczyny specyficznej dla dostawcy.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Określa, czy katalog dostawcy można odczytać z metadanych manifestu, odświeżyć w pamięci podręcznej, czy wymaga on środowiska uruchomieniowego. |
| `runtimeAugment` | `boolean`                                                | Ustawiać na `true` tylko wtedy, gdy środowisko uruchomieniowe dostawcy musi dołączyć wiersze katalogu po zaplanowaniu manifestu i konfiguracji.       |

`aliases` uczestniczy w wyszukiwaniu właściciela dostawcy na potrzeby planowania katalogu modeli. Cele aliasów muszą być nadrzędnymi dostawcami należącymi do tego samego pluginu. Gdy lista filtrowana według dostawcy używa aliasu, OpenClaw może odczytać manifest właściciela i zastosować nadpisania interfejsu API oraz bazowego adresu URL aliasu bez ładowania środowiska uruchomieniowego dostawcy. Aliasy nie rozszerzają niefiltrowanych list katalogu; szerokie listy zawierają wyłącznie wiersze kanonicznego dostawcy będącego właścicielem.

`suppressions` zastępuje stary punkt zaczepienia `suppressBuiltInModel` środowiska uruchomieniowego dostawcy. Wpisy pomijania są uwzględniane tylko wtedy, gdy dostawca należy do pluginu lub jest zadeklarowany jako klucz `modelCatalog.aliases` wskazujący na należącego do pluginu dostawcę. Punkty zaczepienia pomijania w środowisku uruchomieniowym nie są już wywoływane podczas rozpoznawania modelu.

Pola dostawcy:

| Pole                 | Typ                     | Znaczenie                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | Opcjonalny domyślny bazowy adres URL modeli w katalogu tego dostawcy.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Opcjonalny domyślny adapter API modeli w katalogu tego dostawcy.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Opcjonalne statyczne nagłówki stosowane do katalogu tego dostawcy.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | Opcjonalny identyfikator małego modelu zalecanego przez dostawcę do krótkich wewnętrznych zadań pomocniczych (tytuły, opisywanie postępu). Używany, gdy `agents.defaults.utilityModel` nie jest ustawione, a ten dostawca obsługuje główny model agenta. |
| `models`              | `object[]`               | Wymagane wiersze modeli. Wiersze bez `id` są ignorowane.                                                                                                                                                            |

Pola modelu:

| Pole              | Typ                                                           | Znaczenie                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Lokalny dla dostawcy identyfikator modelu bez prefiksu `provider/`.                    |
| `name`             | `string`                                                       | Opcjonalna nazwa wyświetlana.                                                      |
| `api`              | `ModelApi`                                                     | Opcjonalne nadpisanie API dla danego modelu.                                            |
| `baseUrl`          | `string`                                                       | Opcjonalne nadpisanie bazowego adresu URL dla danego modelu.                                       |
| `headers`          | `Record<string, string>`                                       | Opcjonalne statyczne nagłówki dla danego modelu.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalności akceptowane przez model. Pozostałe wartości są po cichu odrzucane.            |
| `reasoning`        | `boolean`                                                      | Określa, czy model udostępnia funkcję rozumowania.                               |
| `contextWindow`    | `number`                                                       | Natywne okno kontekstu dostawcy.                                             |
| `contextTokens`    | `number`                                                       | Opcjonalny efektywny limit kontekstu środowiska uruchomieniowego, gdy różni się od `contextWindow`. |
| `maxTokens`        | `number`                                                       | Maksymalna liczba tokenów wyjściowych, jeśli jest znana.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Opcjonalne nadpisania identyfikatora modelu lub parametrów dla poszczególnych poziomów myślenia.                    |
| `cost`             | `object`                                                       | Opcjonalna cena w USD za milion tokenów, z uwzględnieniem opcjonalnego `tieredPricing`. |
| `compat`           | `object`                                                       | Opcjonalne flagi zgodności odpowiadające zgodności konfiguracji modeli OpenClaw.  |
| `mediaInput`       | `object`                                                       | Opcjonalna konfiguracja danych wejściowych dla poszczególnych modalności, obecnie tylko dla obrazów.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stan na liście. Pomijać tylko wtedy, gdy wiersz nie może być w ogóle widoczny.          |
| `statusReason`     | `string`                                                       | Opcjonalna przyczyna wyświetlana wraz ze stanem niedostępności.                            |
| `replaces`         | `string[]`                                                     | Starsze lokalne dla dostawcy identyfikatory modeli zastępowane przez ten model.                       |
| `replacedBy`       | `string`                                                       | Lokalny dla dostawcy identyfikator modelu zastępczego dla przestarzałych wierszy.                    |
| `tags`             | `string[]`                                                     | Stabilne tagi używane przez selektory i filtry.                                    |

Pola pomijania:

| Pole                      | Typ       | Znaczenie                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identyfikator dostawcy nadrzędnego wiersza przeznaczonego do pominięcia. Musi należeć do tego pluginu lub być zadeklarowany jako należący do niego alias. |
| `model`                    | `string`   | Lokalny dla dostawcy identyfikator modelu przeznaczonego do pominięcia.                                                                      |
| `reason`                   | `string`   | Opcjonalny komunikat wyświetlany, gdy następuje bezpośrednie żądanie pominiętego wiersza.                                     |
| `when.baseUrlHosts`        | `string[]` | Opcjonalna lista hostów efektywnego bazowego adresu URL dostawcy wymaganych do zastosowania pomijania.               |
| `when.providerConfigApiIn` | `string[]` | Opcjonalna lista dokładnych wartości `api` konfiguracji dostawcy wymaganych do zastosowania pomijania.              |

Nie umieszczać danych dostępnych wyłącznie w środowisku uruchomieniowym w `modelCatalog`. Używać `static` tylko wtedy, gdy wiersze manifestu są wystarczająco kompletne, aby listy filtrowane według dostawcy i powierzchnie wyboru mogły pominąć wykrywanie rejestru lub środowiska uruchomieniowego. Używać `refreshable`, gdy wiersze manifestu stanowią przydatne początkowe lub uzupełniające pozycje listy, ale późniejsze odświeżenie lub pamięć podręczna może dodać kolejne wiersze; wiersze możliwe do odświeżenia nie są same w sobie miarodajne. Używać `runtime`, gdy OpenClaw musi załadować środowisko uruchomieniowe dostawcy, aby poznać listę.

## Dokumentacja modelIdNormalization

Używać `modelIdNormalization` do niedrogiego, należącego do dostawcy porządkowania identyfikatora modelu, które musi nastąpić przed załadowaniem środowiska uruchomieniowego dostawcy. Dzięki temu aliasy, takie jak krótkie nazwy modeli, starsze lokalne identyfikatory dostawcy i reguły prefiksów serwera proxy, pozostają w manifeście pluginu będącego właścicielem zamiast w podstawowych tabelach wyboru modeli.

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

| Pole                                | Typ                    | Znaczenie                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Dokładne aliasy identyfikatorów modeli bez uwzględniania wielkości liter. Wartości są zwracane w zapisanej postaci.                  |
| `stripPrefixes`                      | `string[]`              | Prefiksy usuwane przed wyszukaniem aliasu, przydatne w przypadku starszego powielenia dostawcy i modelu.     |
| `prefixWhenBare`                     | `string`                | Prefiks dodawany, gdy znormalizowany identyfikator modelu nie zawiera jeszcze `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Warunkowe reguły prefiksu dla identyfikatorów bez prefiksu stosowane po wyszukaniu aliasu, indeksowane według `modelPrefix` i `prefix`. |

## Dokumentacja providerEndpoints

Używać `providerEndpoints` do klasyfikacji punktów końcowych, którą ogólna polityka żądań musi znać przed załadowaniem środowiska uruchomieniowego dostawcy. Rdzeń nadal definiuje znaczenie każdego `endpointClass`; manifesty pluginów definiują metadane hosta i bazowego adresu URL.

Oficjalne, wyodrębnione pluginy dostawców są wykluczone z dystrybucji rdzenia, dlatego
ich manifesty pozostają niewidoczne do czasu instalacji. Ich `providerEndpoints`
musi również mieć odzwierciedlenie w `scripts/lib/official-external-provider-catalog.json`, aby
klasyfikacja punktów końcowych nadal działała bez pluginu; test kontraktowy
wymusza zgodność tego odzwierciedlenia.

Pola punktu końcowego:

| Pole                           | Typ        | Znaczenie                                                                                      |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Znana klasa podstawowego punktu końcowego, taka jak `openrouter`, `moonshot-native` lub `google-vertex`.        |
| `hosts`                        | `string[]` | Dokładne nazwy hostów mapowane na klasę punktu końcowego.                                                |
| `hostSuffixes`                 | `string[]` | Sufiksy hostów mapowane na klasę punktu końcowego. Poprzedź je ciągiem `.`, aby dopasowywać wyłącznie sufiksy domen. |
| `baseUrls`                     | `string[]` | Dokładne znormalizowane bazowe adresy URL HTTP(S) mapowane na klasę punktu końcowego.                             |
| `googleVertexRegion`           | `string`   | Statyczny region Google Vertex dla dokładnych hostów globalnych.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks usuwany z pasujących hostów w celu ujawnienia prefiksu regionu Google Vertex.                 |

## Dokumentacja providerRequest

Użyj `providerRequest` do przechowywania niewymagających dużych nakładów metadanych zgodności żądań, których ogólne zasady obsługi żądań potrzebują bez ładowania środowiska wykonawczego dostawcy. Przepisywanie ładunku zależne od zachowania należy pozostawić hakom środowiska wykonawczego dostawcy lub współdzielonym funkcjom pomocniczym rodziny dostawców.

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

| Pole                  | Typ          | Znaczenie                                                                              |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etykieta rodziny dostawcy używana przez ogólne mechanizmy decydowania o zgodności żądań i diagnostykę. |
| `compatibilityFamily` | `"moonshot"` | Opcjonalna grupa zgodności rodziny dostawców dla współdzielonych funkcji pomocniczych żądań.              |
| `openAICompletions`   | `object`     | Flagi żądań uzupełniania zgodnego z OpenAI, obecnie `supportsStreamingUsage`.       |

## Dokumentacja secretProviderIntegrations

Użyj `secretProviderIntegrations`, gdy plugin może opublikować gotową konfigurację wielokrotnego użytku dla dostawcy wykonawczego SecretRef. OpenClaw odczytuje te metadane przed załadowaniem środowiska wykonawczego pluginu, zapisuje własność pluginu w `secrets.providers.<alias>.pluginIntegration` i pozostawia faktyczne rozwiązywanie sekretów środowisku wykonawczemu SecretRef. Gotowe konfiguracje są udostępniane tylko dla pluginów wbudowanych oraz zainstalowanych pluginów wykrytych w zarządzanych katalogach głównych instalacji pluginów, takich jak instalacje z git i ClawHub.

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

Gdy operator wybierze gotową konfigurację, OpenClaw zapisuje odwołanie do dostawcy podobne do poniższego:

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

Podczas uruchamiania lub ponownego ładowania OpenClaw rozwiązuje tego dostawcę, ładując bieżące metadane manifestu pluginu, sprawdzając, czy plugin będący właścicielem jest zainstalowany i aktywny, oraz tworząc polecenie wykonawcze na podstawie manifestu. Wyłączenie lub usunięcie pluginu unieważnia dostawcę dla aktywnych odwołań SecretRef. Operatorzy, którzy potrzebują autonomicznej konfiguracji wykonawczej, nadal mogą bezpośrednio definiować ręcznych dostawców `command`/`args`.

Obecnie obsługiwane są tylko gotowe konfiguracje `source: "exec"`. `command` musi mieć wartość `${node}`, a `args[0]` musi być skryptem rozpoznawania `./` ze ścieżką względną wobec katalogu głównego pluginu. Podczas uruchamiania lub ponownego ładowania OpenClaw przekształca go w bieżący plik wykonywalny Node i bezwzględną ścieżkę skryptu wewnątrz pluginu. Opcje Node, takie jak `--require`, `--import`, `--loader`, `--env-file`, `--eval` i `--print`, nie należą do kontraktu gotowej konfiguracji manifestu. Operatorzy potrzebujący poleceń innych niż Node mogą bezpośrednio skonfigurować autonomicznych ręcznych dostawców wykonawczych.

OpenClaw wyprowadza `trustedDirs` dla gotowych konfiguracji manifestu z katalogu głównego pluginu oraz, w przypadku gotowych konfiguracji `${node}`, z katalogu bieżącego pliku wykonywalnego Node. Wartości `trustedDirs` określone w manifeście są ignorowane. Inne opcje dostawcy wykonawczego, takie jak `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` i `allowInsecurePath`, są przekazywane do standardowej konfiguracji dostawcy wykonawczego SecretRef.

## Dokumentacja modelPricing

Użyj `modelPricing`, gdy dostawca wymaga sterowania zachowaniem cen w płaszczyźnie sterowania przed załadowaniem środowiska wykonawczego. Pamięć podręczna cen Gateway odczytuje te metadane bez importowania kodu środowiska wykonawczego dostawcy.

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
| `external`   | `boolean`         | Ustaw `false` dla dostawców lokalnych lub hostowanych samodzielnie, którzy nigdy nie powinni pobierać cen OpenRouter ani LiteLLM. |
| `openRouter` | `false \| object` | Mapowanie wyszukiwania cen OpenRouter. `false` wyłącza wyszukiwanie OpenRouter dla tego dostawcy.           |
| `liteLLM`    | `false \| object` | Mapowanie wyszukiwania cen LiteLLM. `false` wyłącza wyszukiwanie LiteLLM dla tego dostawcy.                 |

Pola źródła:

| Pole                       | Typ                | Znaczenie                                                                                                            |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identyfikator dostawcy w zewnętrznym katalogu, jeśli różni się od identyfikatora dostawcy OpenClaw, na przykład `z-ai` dla dostawcy `zai`. |
| `passthroughProviderModel` | `boolean`          | Traktowanie identyfikatorów modeli zawierających ukośniki jako zagnieżdżonych odwołań dostawca/model, przydatne dla dostawców proxy, takich jak OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Dodatkowe warianty identyfikatorów modeli zewnętrznego katalogu. `version-dots` próbuje identyfikatorów wersji z kropkami, takich jak `claude-opus-4.6`.            |

### Indeks dostawców OpenClaw

Indeks dostawców OpenClaw to należące do OpenClaw metadane podglądu dostawców, których pluginy mogą nie być jeszcze zainstalowane. Nie jest częścią manifestu pluginu. Manifesty pluginów pozostają źródłem nadrzędnym dla zainstalowanych pluginów. Indeks dostawców jest wewnętrznym kontraktem rezerwowym, z którego przyszłe interfejsy instalowalnych dostawców i wyboru modelu przed instalacją będą korzystać, gdy plugin dostawcy nie jest zainstalowany.

Kolejność nadrzędności katalogów:

1. Konfiguracja użytkownika.
2. Manifest zainstalowanego pluginu `modelCatalog`.
3. Pamięć podręczna katalogu modeli po jawnym odświeżeniu.
4. Wiersze podglądu indeksu dostawców OpenClaw.

Indeks dostawców nie może zawierać sekretów, stanu włączenia, haków środowiska wykonawczego ani bieżących danych modeli właściwych dla konta. Jego katalogi podglądu używają tego samego kształtu wiersza dostawcy `modelCatalog` co manifesty pluginów, ale powinny ograniczać się do stabilnych metadanych prezentacyjnych, chyba że pola adaptera środowiska wykonawczego, takie jak `api`, `baseUrl`, ceny lub flagi zgodności są celowo utrzymywane w zgodności z manifestem zainstalowanego pluginu. Dostawcy z aktywnym wykrywaniem `/models` powinni zapisywać odświeżone wiersze za pośrednictwem jawnej ścieżki pamięci podręcznej katalogu modeli, zamiast wywoływać interfejsy API dostawcy podczas zwykłego wyświetlania listy lub wdrażania.

Wpisy indeksu dostawców mogą również zawierać metadane instalowalnego pluginu dla dostawców, których plugin został przeniesiony poza rdzeń lub nie jest jeszcze zainstalowany z innego powodu. Metadane te odzwierciedlają wzorzec katalogu kanałów: nazwa pakietu, specyfikacja instalacji npm, oczekiwana integralność oraz niewymagające dużych nakładów etykiety wyboru uwierzytelniania wystarczają do wyświetlenia instalowalnej opcji konfiguracji. Po zainstalowaniu pluginu jego manifest ma pierwszeństwo, a wpis indeksu dostawców jest ignorowany dla tego dostawcy.

`openclaw doctor --fix` migruje niewielki, zamknięty zestaw starszych kluczy możliwości najwyższego poziomu manifestu do `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` i `tools`. Żaden z nich (ani żadna inna lista możliwości) nie jest już odczytywany jako pole najwyższego poziomu manifestu; standardowe ładowanie manifestu rozpoznaje je wyłącznie w `contracts`.

## Manifest a package.json

Te dwa pliki służą do różnych celów:

| Plik                   | Zastosowanie                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywanie, walidacja konfiguracji, metadane wyboru uwierzytelniania i wskazówki interfejsu użytkownika, które muszą istnieć przed uruchomieniem kodu pluginu                         |
| `package.json`         | Metadane npm, instalacja zależności i blok `openclaw` używany do punktów wejścia, kontroli instalacji, konfiguracji lub metadanych katalogu |

W razie wątpliwości, gdzie powinny znaleźć się określone metadane, należy zastosować tę regułę:

- jeśli OpenClaw musi je znać przed załadowaniem kodu pluginu, umieść je w `openclaw.plugin.json`
- jeśli dotyczą pakowania, plików wejściowych lub zachowania instalacji npm, umieść je w `package.json`

### Pola package.json wpływające na wykrywanie

Niektóre metadane pluginu używane przed uruchomieniem celowo znajdują się w `package.json`, w bloku `openclaw`, zamiast w `openclaw.plugin.json`. `openclaw.bundle` i `openclaw.bundle.json` nie są kontraktami pluginów OpenClaw; natywne pluginy muszą używać `openclaw.plugin.json` wraz z obsługiwanymi polami `package.json#openclaw` opisanymi poniżej.

Ważne przykłady:

| Pole                                                                                       | Znaczenie                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Deklaruje natywne punkty wejścia pluginu. Muszą znajdować się w katalogu pakietu pluginu.                                                                                             |
| `openclaw.runtimeExtensions`                                                               | Deklaruje zbudowane punkty wejścia środowiska uruchomieniowego JavaScript dla zainstalowanych pakietów. Muszą znajdować się w katalogu pakietu pluginu.                                |
| `openclaw.setupEntry`                                                                      | Lekki punkt wejścia używany wyłącznie do konfiguracji podczas wdrażania, odroczonego uruchamiania kanału oraz wykrywania statusu kanału/SecretRef w trybie tylko do odczytu. Musi znajdować się w katalogu pakietu pluginu. |
| `openclaw.runtimeSetupEntry`                                                               | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Wymaga `setupEntry`, musi istnieć i znajdować się w katalogu pakietu pluginu.             |
| `openclaw.channel`                                                                         | Lekkie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst opcji wyboru.                                                                               |
| `openclaw.channel.commands`                                                                | Statyczne metadane automatycznych wartości domyślnych natywnych poleceń i natywnych umiejętności, używane przez konfigurację, audyt i powierzchnie list poleceń przed załadowaniem środowiska uruchomieniowego kanału. |
| `openclaw.channel.configuredState`                                                         | Lekkie metadane mechanizmu sprawdzającego stan konfiguracji, który może odpowiedzieć na pytanie „czy konfiguracja oparta wyłącznie na zmiennych środowiskowych już istnieje?” bez ładowania pełnego środowiska uruchomieniowego kanału. |
| `openclaw.channel.persistedAuthState`                                                      | Lekkie metadane mechanizmu sprawdzającego utrwalone uwierzytelnienie, który może odpowiedzieć na pytanie „czy istnieje już jakakolwiek aktywna sesja?” bez ładowania pełnego środowiska uruchomieniowego kanału. |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Wskazówki dotyczące instalowania/aktualizowania pluginów dołączonych i publikowanych zewnętrznie.                                                                                     |
| `openclaw.install.defaultChoice`                                                           | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                         |
| `openclaw.install.minHostVersion`                                                          | Minimalna obsługiwana wersja hosta OpenClaw określona dolną granicą semver, taką jak `>=2026.3.22` lub `>=2026.5.1-beta.1`.                                                       |
| `openclaw.compat.pluginApi`                                                                | Minimalny zakres API pluginów OpenClaw wymagany przez ten pakiet, określony dolną granicą semver, taką jak `>=2026.5.27`.                                                        |
| `openclaw.install.expectedIntegrity`                                                       | Oczekiwany ciąg integralności dystrybucji npm, taki jak `sha512-...`; procesy instalacji i aktualizacji weryfikują względem niego pobrany artefakt.                              |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Umożliwia wąsko określoną ścieżkę odzyskiwania przez ponowną instalację dołączonego pluginu, gdy konfiguracja jest nieprawidłowa.                                                     |
| `openclaw.install.requiredPlatformPackages`                                                | Aliasy pakietów npm, które muszą zostać zmaterializowane, gdy ich ograniczenia platformy w pliku blokady odpowiadają bieżącemu hostowi.                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Umożliwia załadowanie powierzchni kanału środowiska uruchomieniowego konfiguracji przed rozpoczęciem nasłuchiwania, a następnie odracza pełny skonfigurowany plugin kanału do aktywacji po rozpoczęciu nasłuchiwania. |

Metadane manifestu określają, które opcje dostawcy/kanału/konfiguracji pojawiają się podczas wdrażania przed załadowaniem środowiska uruchomieniowego. `package.json#openclaw.install` informuje proces wdrażania, jak pobrać lub włączyć ten plugin, gdy zostanie wybrana jedna z tych opcji. Nie należy przenosić wskazówek instalacyjnych do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru manifestów dla źródeł pluginów, które nie są dołączone. Nieprawidłowe wartości są odrzucane; wartości nowsze, ale prawidłowe powodują pominięcie zewnętrznych pluginów na starszych hostach. Zakłada się, że dołączone pluginy źródłowe mają tę samą wersję co kod źródłowy hosta.

`openclaw.install.requiredPlatformPackages` jest przeznaczone dla pakietów npm, które udostępniają wymagane natywne pliki binarne za pośrednictwem opcjonalnych aliasów właściwych dla platformy. Należy podać samą nazwę pakietu npm dla aliasu każdej obsługiwanej platformy. Podczas instalacji npm OpenClaw weryfikuje tylko zadeklarowany alias, którego ograniczenia w pliku blokady odpowiadają bieżącemu hostowi. Jeśli npm zgłosi powodzenie, ale pominie ten alias, OpenClaw ponawia próbę raz ze świeżą pamięcią podręczną i wycofuje instalację, jeśli aliasu nadal brakuje.

`openclaw.compat.pluginApi` jest egzekwowane podczas instalacji pakietu dla źródeł pluginów, które nie są dołączone. Należy używać go do określenia dolnej granicy API SDK/środowiska uruchomieniowego pluginów OpenClaw, względem której zbudowano pakiet. Może być bardziej rygorystyczne niż `minHostVersion`, gdy pakiet pluginu wymaga nowszego API, ale nadal zachowuje niższą wskazówkę instalacyjną dla innych procesów. Oficjalna synchronizacja wydań OpenClaw domyślnie podnosi istniejące dolne granice API oficjalnych pluginów do wersji wydania OpenClaw, ale wydania obejmujące wyłącznie plugin mogą zachować niższą granicę, gdy pakiet celowo obsługuje starsze hosty. Nie należy używać samej wersji pakietu jako kontraktu zgodności. `peerDependencies.openclaw` pozostaje metadanymi pakietu npm; OpenClaw używa kontraktu `openclaw.compat.pluginApi` do podejmowania decyzji o zgodności instalacji.

Oficjalne metadane instalacji na żądanie powinny używać `clawhubSpec`, gdy plugin jest opublikowany w ClawHub; proces wdrażania traktuje je jako preferowane źródło zdalne i po instalacji zapisuje informacje o artefakcie ClawHub. `npmSpec` pozostaje awaryjnym mechanizmem zgodności dla pakietów, które nie zostały jeszcze przeniesione do ClawHub.

Dokładne przypięcie wersji npm znajduje się już w `npmSpec`, na przykład `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne wpisy katalogu zewnętrznego powinny łączyć dokładne specyfikacje z `expectedIntegrity`, aby procesy aktualizacji kończyły się niepowodzeniem w sposób bezpieczny, jeśli pobrany artefakt npm nie odpowiada już przypiętemu wydaniu. Interaktywny proces wdrażania nadal oferuje zaufane specyfikacje npm z rejestru, w tym same nazwy pakietów i znaczniki dystrybucji, ze względu na zgodność. Diagnostyka katalogu może rozróżniać źródła: dokładne, zmienne, przypięte integralnością, bez integralności, z niezgodnością nazwy pakietu oraz z nieprawidłową opcją domyślną. Ostrzega również, gdy występuje `expectedIntegrity`, ale nie istnieje prawidłowe źródło npm, które można przypiąć. Gdy występuje `expectedIntegrity`, procesy instalacji/aktualizacji je egzekwują; gdy zostanie pominięte, rozstrzygnięcie rejestru jest zapisywane bez przypięcia integralności.

Pluginy kanałów powinny udostępniać `openclaw.setupEntry`, gdy skanowanie statusu, listy kanałów lub SecretRef wymaga identyfikowania skonfigurowanych kont bez ładowania pełnego środowiska uruchomieniowego. Punkt wejścia konfiguracji powinien udostępniać metadane kanału oraz bezpieczne dla konfiguracji adaptery ustawień, statusu i sekretów; klientów sieciowych, procesy nasłuchujące Gateway i środowiska uruchomieniowe transportu należy pozostawić w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia środowiska uruchomieniowego nie zastępują kontroli granic pakietu dla pól źródłowych punktów wejścia. Na przykład `openclaw.runtimeExtensions` nie może umożliwić załadowania ścieżki `openclaw.extensions`, która wychodzi poza pakiet.

Zakres `openclaw.install.allowInvalidConfigRecovery` jest celowo wąski. Nie umożliwia instalowania dowolnych uszkodzonych konfiguracji. Obecnie pozwala procesom instalacji wyłącznie odzyskiwać sprawność po konkretnych błędach aktualizacji nieaktualnych dołączonych pluginów, takich jak brakująca ścieżka dołączonego pluginu lub nieaktualny wpis `channels.<id>` dotyczący tego samego dołączonego pluginu. Niepowiązane błędy konfiguracji nadal blokują instalację i kierują operatorów do `openclaw doctor --fix`.

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

Należy ich używać, gdy konfiguracja, narzędzie doctor, status lub procesy sprawdzania obecności w trybie tylko do odczytu wymagają taniego sprawdzenia uwierzytelnienia typu tak/nie przed załadowaniem pełnego pluginu kanału. Utrwalony stan uwierzytelnienia nie jest skonfigurowanym stanem kanału: nie należy używać tych metadanych do automatycznego włączania pluginów, naprawiania zależności środowiska uruchomieniowego ani decydowania, czy środowisko uruchomieniowe kanału powinno zostać załadowane. Docelowy eksport powinien być niewielką funkcją, która odczytuje wyłącznie utrwalony stan; nie należy kierować go przez pełny moduł zbiorczy środowiska uruchomieniowego kanału.

`openclaw.channel.configuredState` obsługuje tanie kontrole konfiguracji. Gdy zmienne środowiskowe są wystarczające, preferowane są deklaratywne metadane środowiska:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

Należy używać `env.allOf`, gdy wymagana jest każda z wymienionych zmiennych, oraz `env.anyOf`, gdy wystarczy dowolna jedna niepusta zmienna. Jeśli niewielka kontrola niewymagająca środowiska uruchomieniowego potrzebuje czegoś więcej niż metadane środowiska, należy użyć `specifier` wraz z `exportName`, jak pokazano dla `persistedAuthState`; gdy występuje `env`, OpenClaw używa go bez ładowania tego modułu. Jeśli kontrola wymaga pełnego rozstrzygnięcia konfiguracji lub rzeczywistego środowiska uruchomieniowego kanału, tę logikę należy pozostawić w haku `config.hasConfiguredState` pluginu.

## Kolejność pierwszeństwa wykrywania (zduplikowane identyfikatory pluginów)

OpenClaw wykrywa pluginy w trzech katalogach głównych, sprawdzanych w następującej kolejności: pluginy dołączone do OpenClaw, globalny katalog główny instalacji (`~/.openclaw/extensions`) i katalog główny bieżącego obszaru roboczego (`<workspace>/.openclaw/extensions`), a także wszystkie jawne wpisy `plugins.load.paths`.

Jeśli dwa wykryte elementy mają ten sam `id`, zachowywany jest tylko manifest o **najwyższym pierwszeństwie**; duplikaty o niższym pierwszeństwie są odrzucane zamiast ładowania obok niego. Kolejność od najwyższego do najniższego pierwszeństwa:

1. **Wybrany przez konfigurację** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Instalacja globalna odpowiadająca śledzonemu rekordowi instalacji** — plugin zainstalowany za pomocą `openclaw plugin install`/`openclaw plugin update`, którego śledzenie instalacji OpenClaw rozpoznaje dla tego samego identyfikatora, nawet jeśli identyfikator należy również do dołączonego pluginu
3. **Dołączony** — pluginy dostarczane z OpenClaw
4. **Obszar roboczy** — pluginy wykryte względem bieżącego obszaru roboczego
5. Każdy inny wykryty kandydat

Konsekwencje:

- Rozgałęziona lub nieaktualna kopia dołączonego pluginu, znajdująca się bez śledzenia w obszarze roboczym lub globalnym katalogu głównym, nie zastąpi dołączonej kompilacji.
- Aby zastąpić dołączony plugin, należy uruchomić `openclaw plugin install` dla tego identyfikatora, dzięki czemu śledzona instalacja globalna uzyska wyższe pierwszeństwo niż dołączona kopia, albo przypiąć konkretną ścieżkę za pomocą `plugins.entries.<id>`, aby wygrała dzięki pierwszeństwu wyboru przez konfigurację.
- Odrzucenia duplikatów są rejestrowane, aby narzędzie Doctor i diagnostyka uruchamiania mogły wskazać odrzuconą kopię.
- Zastąpienia duplikatów wybrane przez konfigurację są opisywane w diagnostyce jako jawne zastąpienia, ale nadal generują ostrzeżenie, aby nieaktualne rozwidlenia i przypadkowe przesłonięcia pozostawały widoczne.

## Wymagania dotyczące schematu JSON

- **Każdy plugin musi zawierać schemat JSON**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest dopuszczalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu i zapisu konfiguracji, a nie w czasie wykonywania.
- Podczas rozszerzania lub tworzenia forka dołączonego pluginu o nowe klucze konfiguracji należy jednocześnie zaktualizować `openclaw.plugin.json` `configSchema` tego pluginu. Schematy dołączonych pluginów są rygorystyczne, więc dodanie `plugins.entries.<id>.config.myNewKey` w konfiguracji użytkownika bez dodania `myNewKey` do `configSchema.properties` zostanie odrzucone przed załadowaniem środowiska uruchomieniowego pluginu.

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

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału jest zadeklarowany w manifeście pluginu. Jeśli ten sam identyfikator występuje również w `plugins.allow`, `plugins.entries` lub `plugins.installs` (plugin, do którego istnieje odwołanie, ale którego obecnie nie można wykryć), OpenClaw obniża rangę problemu do **ostrzeżenia**.
- Odwołania w `plugins.entries.<id>`, `plugins.allow` i `plugins.deny` do nieznanych identyfikatorów pluginów są **ostrzeżeniami** („zignorowano nieaktualny wpis konfiguracji”), a nie błędami, dzięki czemu aktualizacje oraz usunięte lub przemianowane pluginy nie blokują uruchomienia Gateway.
- Odwołanie w `plugins.slots.memory` do nieznanego identyfikatora pluginu jest **błędem**, z wyjątkiem znanego oficjalnego zewnętrznego pluginu `memory-lancedb`, w przypadku którego wyświetlane jest ostrzeżenie.
- Jeśli plugin jest zainstalowany, ale jego manifest lub schemat jest uszkodzony albo go brakuje, walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja zostaje zachowana, a w Doctor i logach pojawia się **ostrzeżenie**.

Pełny schemat `plugins.*` opisano w [dokumentacji konfiguracji](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany w przypadku natywnych pluginów OpenClaw**, w tym ładowanych z lokalnego systemu plików. Środowisko uruchomieniowe nadal ładuje moduł pluginu osobno; manifest służy wyłącznie do wykrywania i walidacji.
- Natywne manifesty są analizowane jako JSON5, dlatego komentarze, końcowe przecinki i klucze bez cudzysłowów są dozwolone, o ile końcowa wartość nadal jest obiektem.
- Moduł ładujący manifest odczytuje wyłącznie udokumentowane pola manifestu. Należy unikać niestandardowych kluczy najwyższego poziomu.
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, jeśli plugin ich nie potrzebuje.
- `providerCatalogEntry` musi pozostać lekki i nie powinien importować rozbudowanego kodu środowiska uruchomieniowego; należy używać go do statycznych metadanych katalogu dostawców lub wąskich deskryptorów wykrywania, a nie do wykonywania operacji podczas obsługi żądań.
- Wyłączne rodzaje pluginów są wybierane przez `plugins.slots.*`: `kind: "memory"` za pomocą `plugins.slots.memory` (domyślnie `memory-core`), `kind: "context-engine"` za pomocą `plugins.slots.contextEngine` (domyślnie `legacy`).
- Wyłączny rodzaj pluginu należy zadeklarować w tym manifeście. Pole `OpenClawPluginDefinition.kind` punktu wejścia środowiska uruchomieniowego jest przestarzałe i pozostaje jedynie jako mechanizm zgodności ze starszymi pluginami.
- Metadane zmiennych środowiskowych (`setup.providers[].envVars`, przestarzałe `providerAuthEnvVars` oraz `channelEnvVars`) mają wyłącznie charakter deklaratywny. Status, audyt, walidacja dostarczania Cron i inne powierzchnie tylko do odczytu nadal uwzględniają poziom zaufania pluginu oraz obowiązujące zasady aktywacji, zanim uznają zmienną środowiskową za skonfigurowaną.
- Metadane kreatora środowiska uruchomieniowego wymagające kodu dostawcy opisano w sekcji [Hooki środowiska uruchomieniowego dostawcy](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli plugin zależy od modułów natywnych, należy udokumentować kroki kompilacji oraz wszelkie wymagania dotyczące listy dozwolonych elementów menedżera pakietów (na przykład pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Powiązane

<CardGroup cols={3}>
  <Card title="Tworzenie pluginów" href="/pl/plugins/building-plugins" icon="rocket">
    Wprowadzenie do pluginów.
  </Card>
  <Card title="Architektura pluginów" href="/pl/plugins/architecture" icon="diagram-project">
    Architektura wewnętrzna i model możliwości.
  </Card>
  <Card title="Przegląd SDK" href="/pl/plugins/sdk-overview" icon="book">
    Dokumentacja SDK pluginów i importów ścieżek podrzędnych.
  </Card>
</CardGroup>
