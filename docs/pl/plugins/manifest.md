---
read_when:
    - Tworzysz plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji pluginu lub debugować błędy walidacji pluginu
summary: Wymagania dotyczące manifestu pluginu i schematu JSON (ścisła walidacja konfiguracji)
title: Manifest pluginu
x-i18n:
    generated_at: "2026-04-05T14:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 702447ad39f295cfffd4214c3e389bee667d2f9850754f2e02e325dde8e4ac00
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest pluginu (openclaw.plugin.json)

Ta strona dotyczy wyłącznie **natywnego manifestu pluginu OpenClaw**.

Informacje o zgodnych układach pakietów znajdziesz w [pakietach pluginów](/plugins/bundles).

Zgodne formaty pakietów używają innych plików manifestu:

- Pakiet Codex: `.codex-plugin/plugin.json`
- Pakiet Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentów Claude
  bez manifestu
- Pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa także te układy pakietów, ale nie są one walidowane
względem opisanego tutaj schematu `openclaw.plugin.json`.

W przypadku zgodnych pakietów OpenClaw obecnie odczytuje metadane pakietu oraz zadeklarowane
katalogi Skills, katalogi poleceń Claude, domyślne ustawienia `settings.json` pakietu Claude,
domyślne ustawienia LSP pakietu Claude oraz obsługiwane zestawy hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym pluginu**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu pluginu**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy pluginu i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie pluginów: [Pluginy](/tools/plugin).
Informacje o natywnym modelu możliwości i aktualnych wskazówkach dotyczących zgodności zewnętrznej:
[Model możliwości](/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje przed załadowaniem
kodu pluginu.

Używaj go do:

- tożsamości pluginu
- walidacji konfiguracji
- metadanych uwierzytelniania i onboardingu, które powinny być dostępne bez uruchamiania
  środowiska uruchomieniowego pluginu
- metadanych aliasów i autoaktywacji, które powinny być rozstrzygane przed załadowaniem środowiska uruchomieniowego pluginu
- skróconych metadanych własności rodzin modeli, które powinny automatycznie aktywować
  plugin przed załadowaniem środowiska uruchomieniowego
- statycznych migawek własności możliwości używanych do dołączonego okablowania zgodności i
  pokrycia kontraktów
- metadanych konfiguracji specyficznych dla kanału, które powinny być scalane z powierzchniami katalogu i walidacji
  bez ładowania środowiska uruchomieniowego
- wskazówek interfejsu użytkownika dla konfiguracji

Nie używaj go do:

- rejestrowania zachowania środowiska uruchomieniowego
- deklarowania punktów wejścia kodu
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
  "description": "Plugin dostawcy OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

## Odniesienie do pól najwyższego poziomu

| Pole                                | Wymagane | Typ                              | Znaczenie                                                                                                                                                                                  |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Tak      | `string`                         | Kanoniczny identyfikator pluginu. To identyfikator używany w `plugins.entries.<id>`.                                                                                                      |
| `configSchema`                      | Tak      | `object`                         | Wbudowany schemat JSON dla konfiguracji tego pluginu.                                                                                                                                        |
| `enabledByDefault`                  | Nie      | `true`                           | Oznacza dołączony plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić plugin domyślnie wyłączony.                                   |
| `legacyPluginIds`                   | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                         |
| `autoEnableWhenConfiguredProviders` | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączyć ten plugin, gdy uwierzytelnianie, konfiguracja lub odwołania do modeli je wymieniają.                                      |
| `kind`                              | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj pluginu używany przez `plugins.slots.*`.                                                                                                                         |
| `channels`                          | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                        |
| `providers`                         | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                       |
| `modelSupport`                      | Nie      | `object`                         | Skrócone metadane rodzin modeli należące do manifestu, używane do automatycznego ładowania pluginu przed środowiskiem uruchomieniowym.                                                   |
| `cliBackends`                       | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego pluginu. Używane do autoaktywacji przy uruchamianiu na podstawie jawnych odwołań w konfiguracji.                              |
| `providerAuthEnvVars`               | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych uwierzytelniania dostawcy, które OpenClaw może sprawdzić bez ładowania kodu pluginu.                                                            |
| `providerAuthChoices`               | Nie      | `object[]`                       | Lekkie metadane wyborów uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego powiązania flag CLI.                                                |
| `contracts`                         | Nie      | `object`                         | Statyczna migawka możliwości dołączonych dla mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów, generowania obrazów, generowania wideo, pobierania z sieci, wyszukiwania w sieci i własności narzędzi. |
| `channelConfigs`                    | Nie      | `Record<string, object>`         | Metadane konfiguracji kanałów należące do manifestu, scalane z powierzchniami wykrywania i walidacji przed załadowaniem środowiska uruchomieniowego.                                     |
| `skills`                            | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego pluginu.                                                                                                              |
| `name`                              | Nie      | `string`                         | Czytelna dla człowieka nazwa pluginu.                                                                                                                                                      |
| `description`                       | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach pluginu.                                                                                                                                |
| `version`                           | Nie      | `string`                         | Informacyjna wersja pluginu.                                                                                                                                                               |
| `uiHints`                           | Nie      | `Record<string, object>`         | Etykiety interfejsu użytkownika, teksty zastępcze i wskazówki dotyczące wrażliwości pól konfiguracji.                                                                                    |

## Odniesienie do `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem środowiska uruchomieniowego dostawcy.

| Pole                  | Wymagane | Typ                                             | Znaczenie                                                                                                     |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ten wybór.                                                          |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której ma zostać skierowane żądanie.                               |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru uwierzytelniania używany przez onboarding i przepływy CLI.                     |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje `choiceId`.                     |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                        |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.             |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór w selektorach asystenta, jednocześnie nadal pozwalając na ręczny wybór w CLI.                   |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyborów, które powinny przekierowywać użytkowników do tego zastępczego wyboru.        |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                             |
| `groupLabel`          | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                                  |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                            |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                               |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                          |
| `cliOption`           | Nie      | `string`                                        | Pełna postać opcji CLI, na przykład `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                                    |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Powierzchnie onboardingu, na których ten wybór powinien się pojawić. Jeśli pole zostanie pominięte, domyślnie używane jest `["text-inference"]`. |

## Odniesienie do `uiHints`

`uiHints` to mapa od nazw pól konfiguracji do niewielkich wskazówek renderowania.

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

| Pole          | Typ        | Znaczenie                                |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.  |
| `help`        | `string`   | Krótki tekst pomocniczy.                 |
| `tags`        | `string[]` | Opcjonalne tagi interfejsu użytkownika.  |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.          |
| `sensitive`   | `boolean`  | Oznacza pole jako tajne lub wrażliwe.    |
| `placeholder` | `string`   | Tekst zastępczy dla pól formularza.      |

## Odniesienie do `contracts`

Używaj `contracts` tylko do statycznych metadanych własności możliwości, które OpenClaw może
odczytać bez importowania środowiska uruchomieniowego pluginu.

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

| Pole                             | Typ        | Znaczenie                                                           |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należących do tego pluginu.           |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należących do tego pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należących do tego pluginu. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia mediów należących do tego pluginu. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należących do tego pluginu. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należących do tego pluginu. |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania z sieci należących do tego pluginu. |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania w sieci należących do tego pluginu. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego pluginu na potrzeby sprawdzania kontraktów dołączonych. |

## Odniesienie do `channelConfigs`

Używaj `channelConfigs`, gdy plugin kanału potrzebuje lekkich metadanych konfiguracji przed
załadowaniem środowiska uruchomieniowego.

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
          "label": "URL homeserwera",
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

| Pole          | Typ                      | Znaczenie                                                                                         |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schemat JSON dla `channels.<id>`. Wymagany dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety interfejsu użytkownika, teksty zastępcze i wskazówki dotyczące wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami selektora i inspekcji, gdy metadane środowiska uruchomieniowego nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                          |
| `preferOver`  | `string[]`               | Identyfikatory starszych lub niższego priorytetu pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Odniesienie do `modelSupport`

Używaj `modelSupport`, gdy OpenClaw powinien wywnioskować twój plugin dostawcy na podstawie
skróconych identyfikatorów modeli, takich jak `gpt-5.4` lub `claude-sonnet-4.6`, zanim zostanie załadowane środowisko uruchomieniowe pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następujący priorytet:

- jawne odwołania `provider/model` używają metadanych manifestu `providers` właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli jeden plugin niedołączony i jeden plugin dołączony pasują jednocześnie, wygrywa plugin niedołączony
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Znaczenie                                                                        |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skróconych identyfikatorów modeli.   |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

Starsze klucze możliwości najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` do `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności możliwości.

## Manifest a package.json

Te dwa pliki pełnią różne role:

| Plik                   | Użycie                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywanie, walidacja konfiguracji, metadane wyborów uwierzytelniania i wskazówki interfejsu użytkownika, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadane npm, instalacja zależności i blok `openclaw` używany dla punktów wejścia, ograniczeń instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien znaleźć się dany element metadanych, użyj tej zasady:

- jeśli OpenClaw musi znać go przed załadowaniem kodu pluginu, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść go w `package.json`

### Pola package.json wpływające na wykrywanie

Niektóre metadane pluginu sprzed uruchomienia celowo znajdują się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Znaczenie                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne punkty wejścia pluginu.                                              |
| `openclaw.setupEntry`                                             | Lekki punkt wejścia tylko do konfiguracji używany podczas onboardingu i odroczonego uruchamiania kanału. |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i teksty wyboru. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla dołączonych i publikowanych zewnętrznie pluginów. |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.          |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, używająca dolnego ograniczenia semver, takiego jak `>=2026.3.22`. |
| `openclaw.install.allowInvalidConfigRecovery`                     | Umożliwia wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego pluginu, gdy konfiguracja jest nieprawidłowa. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala ładować powierzchnie kanału tylko do konfiguracji przed pełnym pluginem kanału podczas uruchamiania. |

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i
ładowania rejestru manifestów. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości pomijają
plugin na starszych hostach.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolne uszkodzone konfiguracje stają się instalowalne. Obecnie umożliwia tylko
przepływom instalacji odzyskanie działania po określonych błędach aktualizacji dołączonych pluginów, takich jak
brakująca ścieżka dołączonego pluginu lub nieaktualny wpis `channels.<id>` dla tego samego
dołączonego pluginu. Niezwiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
do `openclaw doctor --fix`.

## Wymagania dotyczące schematu JSON

- **Każdy plugin musi dostarczać schemat JSON**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w czasie działania.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału został zadeklarowany
  przez manifest pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja jest zachowywana, a
  w Doctor + logach pojawia się **ostrzeżenie**.

Pełny schemat `plugins.*` znajdziesz w [odniesieniu do konfiguracji](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym dla ładowań z lokalnego systemu plików.
- Środowisko uruchomieniowe nadal ładuje moduł pluginu oddzielnie; manifest służy wyłącznie do
  wykrywania + walidacji.
- Natywne manifesty są analizowane za pomocą JSON5, więc komentarze, końcowe przecinki i
  klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Moduł ładujący manifest odczytuje tylko udokumentowane pola manifestu. Unikaj dodawania
  tutaj niestandardowych kluczy najwyższego poziomu.
- `providerAuthEnvVars` to lekka ścieżka metadanych dla sond uwierzytelniania, walidacji
  znaczników zmiennych środowiskowych i podobnych powierzchni uwierzytelniania dostawcy, które nie powinny uruchamiać
  środowiska uruchomieniowego pluginu tylko po to, aby sprawdzić nazwy zmiennych środowiskowych.
- `providerAuthChoices` to lekka ścieżka metadanych dla selektorów wyboru uwierzytelniania,
  rozstrzygania `--auth-choice`, mapowania preferowanego dostawcy i prostej rejestracji flag CLI
  w onboardingu przed załadowaniem środowiska uruchomieniowego dostawcy. Informacje o metadanych kreatora środowiska uruchomieniowego,
  które wymagają kodu dostawcy, znajdziesz w
  [hookach środowiska uruchomieniowego dostawcy](/plugins/architecture#provider-runtime-hooks).
- Wyłączne rodzaje pluginów są wybierane przez `plugins.slots.*`.
  - `kind: "memory"` jest wybierany przez `plugins.slots.memory`.
  - `kind: "context-engine"` jest wybierany przez `plugins.slots.contextEngine`
    (domyślnie: wbudowany `legacy`).
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy
  plugin ich nie potrzebuje.
- Jeśli twój plugin zależy od modułów natywnych, opisz kroki budowania i wszelkie
  wymagania dotyczące listy dozwolonych menedżera pakietów (na przykład pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Powiązane

- [Tworzenie pluginów](/plugins/building-plugins) — jak zacząć pracę z pluginami
- [Architektura pluginów](/plugins/architecture) — architektura wewnętrzna
- [Przegląd SDK](/plugins/sdk-overview) — odniesienie do Plugin SDK
