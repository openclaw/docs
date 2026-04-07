---
read_when:
    - Tworzysz plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji pluginu lub debugujesz błędy walidacji pluginu
summary: Manifest pluginu + wymagania schematu JSON (ścisła walidacja konfiguracji)
title: Manifest pluginu
x-i18n:
    generated_at: "2026-04-07T09:47:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22d41b9f8748b1b1b066ee856be4a8f41e88b9a8bc073d74fc79d2bb0982f01a
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest pluginu (`openclaw.plugin.json`)

Ta strona dotyczy wyłącznie **natywnego manifestu pluginu OpenClaw**.

Informacje o zgodnych układach bundle znajdziesz w [Plugin bundles](/pl/plugins/bundles).

Zgodne formaty bundle używają innych plików manifestu:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentu Claude
  bez manifestu
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa także te układy bundle, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych bundle OpenClaw obecnie odczytuje metadane bundle oraz zadeklarowane
korzenie Skills, korzenie poleceń Claude, domyślne wartości `settings.json` bundle Claude,
domyślne wartości LSP bundle Claude oraz obsługiwane pakiety hooków, gdy układ jest zgodny
z oczekiwaniami runtime OpenClaw.

Każdy natywny plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym pluginu**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu pluginu**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy pluginu i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie pluginów: [Plugins](/pl/tools/plugin).
Aby poznać natywny model możliwości i bieżące wskazówki dotyczące zgodności zewnętrznej:
[Capability model](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje, zanim załaduje kod
Twojego pluginu.

Używaj go do:

- tożsamości pluginu
- walidacji konfiguracji
- metadanych uwierzytelniania i onboardingu, które powinny być dostępne bez uruchamiania
  runtime pluginu
- metadanych aliasów i automatycznego włączania, które powinny być rozstrzygane przed załadowaniem runtime pluginu
- skróconych metadanych własności rodzin modeli, które powinny automatycznie aktywować
  plugin przed załadowaniem runtime
- statycznych migawek własności możliwości używanych do bundlowanego okablowania zgodności i
  pokrycia kontraktów
- metadanych konfiguracji specyficznych dla kanału, które powinny być scalane z powierzchniami katalogu i walidacji
  bez ładowania runtime
- wskazówek dla UI konfiguracji

Nie używaj go do:

- rejestrowania zachowania runtime
- deklarowania entrypointów kodu
- metadanych instalacji npm

Te elementy należą do kodu pluginu i `package.json`.

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
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| Pole                                | Wymagane | Typ                              | Znaczenie                                                                                                                                                                                                    |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Tak      | `string`                         | Kanoniczny identyfikator pluginu. To identyfikator używany w `plugins.entries.<id>`.                                                                                                                       |
| `configSchema`                      | Tak      | `object`                         | Wbudowany schemat JSON Schema dla konfiguracji tego pluginu.                                                                                                                                                 |
| `enabledByDefault`                  | Nie      | `true`                           | Oznacza bundlowany plugin jako domyślnie włączony. Pomiń to pole lub ustaw dowolną wartość inną niż `true`, aby pozostawić plugin domyślnie wyłączony.                                                     |
| `legacyPluginIds`                   | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                           |
| `autoEnableWhenConfiguredProviders` | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten plugin, gdy uwierzytelnianie, konfiguracja lub odwołania do modeli o nich wspominają.                                                    |
| `kind`                              | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj pluginu używany przez `plugins.slots.*`.                                                                                                                                           |
| `channels`                          | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                          |
| `providers`                         | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                                         |
| `modelSupport`                      | Nie      | `object`                         | Należące do manifestu skrócone metadane rodzin modeli używane do automatycznego ładowania pluginu przed runtime.                                                                                           |
| `cliBackends`                       | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego pluginu. Używane do automatycznej aktywacji przy starcie na podstawie jawnych odwołań w konfiguracji.                                           |
| `providerAuthEnvVars`               | Nie      | `Record<string, string[]>`       | Lekkie metadane środowiskowe uwierzytelniania dostawcy, które OpenClaw może sprawdzić bez ładowania kodu pluginu.                                                                                           |
| `channelEnvVars`                    | Nie      | `Record<string, string[]>`       | Lekkie metadane środowiskowe kanału, które OpenClaw może sprawdzić bez ładowania kodu pluginu. Używaj ich dla konfiguracji kanałów sterowanych przez env lub powierzchni uwierzytelniania, które powinny być widoczne dla ogólnych helperów startu/konfiguracji. |
| `providerAuthChoices`               | Nie      | `object[]`                       | Lekkie metadane opcji uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego okablowania flag CLI.                                                                   |
| `contracts`                         | Nie      | `object`                         | Statyczna migawka bundlowanych możliwości dla mowy, transkrypcji realtime, głosu realtime, rozumienia mediów, generowania obrazów, generowania muzyki, generowania wideo, web-fetch, web search i własności narzędzi. |
| `channelConfigs`                    | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału scalane z powierzchniami wykrywania i walidacji przed załadowaniem runtime.                                                                              |
| `skills`                            | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego pluginu.                                                                                                                                 |
| `name`                              | Nie      | `string`                         | Czytelna dla człowieka nazwa pluginu.                                                                                                                                                                        |
| `description`                       | Nie      | `string`                         | Krótkie podsumowanie pokazywane na powierzchniach pluginu.                                                                                                                                                   |
| `version`                           | Nie      | `string`                         | Informacyjna wersja pluginu.                                                                                                                                                                                 |
| `uiHints`                           | Nie      | `Record<string, object>`         | Etykiety UI, placeholdery i wskazówki dotyczące wrażliwości pól konfiguracji.                                                                                                                                 |

## Opis `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jedną opcję onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem runtime dostawcy.

| Pole                  | Wymagane | Typ                                             | Znaczenie                                                                                                  |
| --------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ta opcja.                                                        |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której należy przekazać sterowanie.                              |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator opcji uwierzytelniania używany przez onboarding i przepływy CLI.                   |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje `choiceId`.                   |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                     |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.          |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa opcję w selektorach asystenta, nadal pozwalając na ręczny wybór w CLI.                             |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory opcji, które powinny przekierowywać użytkowników do tej opcji zastępczej.          |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych opcji.                                           |
| `groupLabel`          | Nie      | `string`                                        | Etykieta widoczna dla użytkownika dla tej grupy.                                                           |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                         |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                            |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                       |
| `cliOption`           | Nie      | `string`                                        | Pełny kształt opcji CLI, na przykład `--openrouter-api-key <key>`.                                         |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                                 |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Na których powierzchniach onboardingu ta opcja powinna się pojawiać. Jeśli pole zostanie pominięte, domyślnie używane jest `["text-inference"]`. |

## Opis `uiHints`

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

Każda wskazówka dla pola może zawierać:

| Pole          | Typ        | Znaczenie                               |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika. |
| `help`        | `string`   | Krótki tekst pomocniczy.                |
| `tags`        | `string[]` | Opcjonalne tagi UI.                     |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.         |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe. |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.  |

## Opis `contracts`

Używaj `contracts` tylko do statycznych metadanych własności możliwości, które OpenClaw może
odczytać bez importowania runtime pluginu.

```json
{
  "contracts": {
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

| Pole                             | Typ        | Znaczenie                                                  |
| -------------------------------- | ---------- | ---------------------------------------------------------- |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należące do tego pluginu.    |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji realtime należące do tego pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu realtime należące do tego pluginu. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia mediów należące do tego pluginu. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należące do tego pluginu. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należące do tego pluginu. |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców web-fetch należące do tego pluginu. |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców web search należące do tego pluginu. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego pluginu dla bundlowanych kontroli kontraktów. |

## Opis `channelConfigs`

Używaj `channelConfigs`, gdy plugin kanału potrzebuje lekkich metadanych konfiguracji przed
załadowaniem runtime.

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
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Każdy wpis kanału może zawierać:

| Pole          | Typ                      | Znaczenie                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI/placeholdery/wskazówki wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami selektora i inspekcji, gdy metadane runtime nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                   |
| `preferOver`  | `string[]`               | Starsze lub mniej priorytetowe identyfikatory pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Opis `modelSupport`

Używaj `modelSupport`, gdy OpenClaw ma wywnioskować plugin dostawcy na podstawie
skróconych identyfikatorów modeli, takich jak `gpt-5.4` lub `claude-sonnet-4.6`, zanim załaduje się runtime pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następujący priorytet:

- jawne odwołania `provider/model` używają metadanych `providers` należących do manifestu właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują jednocześnie jeden plugin zewnętrzny i jeden bundlowany, wygrywa
  plugin zewnętrzny
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie wskażą dostawcy

Pola:

| Pole            | Typ        | Znaczenie                                                                    |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skróconych identyfikatorów modeli. |
| `modelPatterns` | `string[]` | Źródła wyrażeń regularnych dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

Starsze klucze możliwości na najwyższym poziomie są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` do `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności możliwości.

## Manifest a package.json

Te dwa pliki służą do różnych zadań:

| Plik                   | Zastosowanie                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywanie, walidacja konfiguracji, metadane opcji uwierzytelniania i wskazówki UI, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadane npm, instalacja zależności i blok `openclaw` używany dla entrypointów, kontroli instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien trafić dany element metadanych, kieruj się tą zasadą:

- jeśli OpenClaw musi wiedzieć o nim przed załadowaniem kodu pluginu, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść go w `package.json`

### Pola `package.json`, które wpływają na wykrywanie

Część metadanych pluginu sprzed uruchomienia runtime celowo znajduje się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Znaczenie                                                                                                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne entrypointy pluginów.                                                                                                      |
| `openclaw.setupEntry`                                             | Lekki entrypoint tylko do konfiguracji używany podczas onboardingu i odroczonego uruchamiania kanału.                                       |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanału, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                           |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania stanu konfiguracji, które mogą odpowiedzieć na pytanie „czy konfiguracja tylko z env już istnieje?” bez ładowania pełnego runtime kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania zapisanego stanu auth, które mogą odpowiedzieć na pytanie „czy cokolwiek jest już zalogowane?” bez ładowania pełnego runtime kanału. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla bundlowanych i zewnętrznie publikowanych pluginów.                                                     |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                 |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, z dolną granicą semver, taką jak `>=2026.3.22`.                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Umożliwia wąską ścieżkę odzyskiwania przez ponowną instalację bundlowanego pluginu, gdy konfiguracja jest nieprawidłowa.                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Umożliwia ładowanie powierzchni kanału tylko do konfiguracji przed pełnym pluginem kanału podczas startu.                                    |

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru
manifestów. Nieprawidłowe wartości są odrzucane; poprawne, ale nowsze wartości powodują pominięcie
pluginu na starszych hostach.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolnie uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala jedynie ścieżkom instalacji
odzyskać działanie po określonych błędach aktualizacji nieaktualnych bundlowanych pluginów, takich jak
brakująca ścieżka bundlowanego pluginu lub nieaktualny wpis `channels.<id>` dla tego samego
bundlowanego pluginu. Niezwiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
do `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` to metadane pakietu dla małego modułu sprawdzającego:

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

Używaj go, gdy konfiguracja, doctor lub przepływy configured-state potrzebują lekkiej sondy auth typu tak/nie
przed załadowaniem pełnego pluginu kanału. Docelowy eksport powinien być małą
funkcją odczytującą wyłącznie zapisany stan; nie kieruj jej przez pełny barrel runtime kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla lekkich kontroli
stanu konfiguracji opartych wyłącznie na env:

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

Używaj go, gdy kanał może odpowiedzieć na pytanie o stan konfiguracji na podstawie env lub innych małych
wejść niezwiązanych z runtime. Jeśli kontrola wymaga pełnego rozstrzygania konfiguracji lub rzeczywistego
runtime kanału, pozostaw tę logikę w hooku pluginu `config.hasConfiguredState`.

## Wymagania JSON Schema

- **Każdy plugin musi dostarczać JSON Schema**, nawet jeśli nie akceptuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w runtime.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału jest zadeklarowany przez
  manifest pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą wskazywać **wykrywalne** identyfikatory pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor raportuje błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja jest zachowywana i
  w Doctor + logach pojawia się **ostrzeżenie**.

Pełny schemat `plugins.*` znajdziesz w [Configuration reference](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym ładowanych z lokalnego systemu plików.
- Runtime nadal ładuje moduł pluginu osobno; manifest służy wyłącznie do
  wykrywania + walidacji.
- Natywne manifesty są parsowane jako JSON5, więc komentarze, końcowe przecinki i
  klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestu odczytuje wyłącznie udokumentowane pola manifestu. Unikaj dodawania
  tutaj własnych kluczy najwyższego poziomu.
- `providerAuthEnvVars` to lekka ścieżka metadanych dla sond auth, walidacji znaczników env
  i podobnych powierzchni uwierzytelniania dostawcy, które nie powinny uruchamiać runtime pluginu
  tylko po to, aby sprawdzić nazwy env.
- `channelEnvVars` to lekka ścieżka metadanych dla rezerwowego użycia shell-env, promptów konfiguracji
  i podobnych powierzchni kanału, które nie powinny uruchamiać runtime pluginu
  tylko po to, aby sprawdzić nazwy env.
- `providerAuthChoices` to lekka ścieżka metadanych dla selektorów opcji uwierzytelniania,
  rozstrzygania `--auth-choice`, mapowania preferowanego dostawcy i prostego rejestrowania flag CLI
  podczas onboardingu przed załadowaniem runtime dostawcy. Metadane kreatora runtime,
  które wymagają kodu dostawcy, znajdziesz w
  [Provider runtime hooks](/pl/plugins/architecture#provider-runtime-hooks).
- Wyłączne rodzaje pluginów są wybierane przez `plugins.slots.*`.
  - `kind: "memory"` jest wybierane przez `plugins.slots.memory`.
  - `kind: "context-engine"` jest wybierane przez `plugins.slots.contextEngine`
    (domyślnie: wbudowany `legacy`).
- `channels`, `providers`, `cliBackends` i `skills` mogą zostać pominięte, jeśli
  plugin ich nie potrzebuje.
- Jeśli Twój plugin zależy od modułów natywnych, udokumentuj kroki budowania oraz wszelkie
  wymagania dotyczące allowlisty menedżera pakietów (na przykład pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Powiązane

- [Building Plugins](/pl/plugins/building-plugins) — rozpoczęcie pracy z pluginami
- [Plugin Architecture](/pl/plugins/architecture) — architektura wewnętrzna
- [SDK Overview](/pl/plugins/sdk-overview) — dokumentacja Plugin SDK
