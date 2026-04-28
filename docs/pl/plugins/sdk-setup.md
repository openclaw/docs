---
read_when:
    - Dodajesz kreator setup do pluginu
    - Musisz zrozumieć różnicę między `setup-entry.ts` a `index.ts`
    - Definiujesz schematy konfiguracji Plugin lub metadane `openclaw` w `package.json`
sidebarTitle: Setup and config
summary: Kreatory setup, `setup-entry.ts`, schematy konfiguracji i metadane `package.json`
title: Setup i konfiguracja pluginów
x-i18n:
    generated_at: "2026-04-26T11:37:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Informacje o pakowaniu Plugin (`package.json` metadata), manifestach (`openclaw.plugin.json`), wpisach konfiguracji oraz schematach konfiguracji.

<Tip>
**Szukasz przewodnika krok po kroku?** Przewodniki how-to omawiają pakowanie w odpowiednim kontekście: [Pluginy kanałów](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) i [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Twój `package.json` wymaga pola `openclaw`, które informuje system Plugin, co udostępnia Twój Plugin:

<Tabs>
  <Tab title="Plugin kanału">
    ```json
    {
      "name": "@myorg/openclaw-my-channel",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "my-channel",
          "label": "Mój kanał",
          "blurb": "Krótki opis kanału."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin dostawcy / linia bazowa ClawHub">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
Jeśli publikujesz Plugin zewnętrznie w ClawHub, pola `compat` i `build` są wymagane. Kanoniczne fragmenty publikacji znajdują się w `docs/snippets/plugin-publish/`.
</Note>

### Pola `openclaw`

<ParamField path="extensions" type="string[]">
  Pliki punktów wejścia (względem katalogu głównego pakietu).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lekki wpis tylko do konfiguracji (opcjonalny).
</ParamField>
<ParamField path="channel" type="object">
  Metadane katalogu kanałów do konfiguracji, selektora, szybkiego startu i powierzchni statusu.
</ParamField>
<ParamField path="providers" type="string[]">
  Identyfikatory dostawców rejestrowane przez ten Plugin.
</ParamField>
<ParamField path="install" type="object">
  Wskazówki instalacji: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flagi zachowania przy uruchamianiu.
</ParamField>

### `openclaw.channel`

`openclaw.channel` to lekkie metadane pakietu dla wykrywania kanałów i powierzchni konfiguracji, zanim środowisko uruchomieniowe zostanie załadowane.

| Pole                                   | Typ        | Znaczenie                                                                    |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                             |
| `label`                                | `string`   | Główna etykieta kanału.                                                      |
| `selectionLabel`                       | `string`   | Etykieta w selektorze/konfiguracji, gdy ma się różnić od `label`.            |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółów dla bogatszych katalogów kanałów i statusu.    |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków konfiguracji i wyboru.                       |
| `docsLabel`                            | `string`   | Etykieta zastępcza używana dla linków do dokumentacji, gdy ma różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis wdrożenia/katalogu.                                              |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                   |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania dla wyboru kanału.                             |
| `preferOver`                           | `string[]` | Identyfikatory Plugin/kanałów o niższym priorytecie, które ten kanał ma wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/system image dla katalogów UI kanałów.                |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami do dokumentacji w powierzchniach wyboru.        |
| `selectionDocsOmitLabel`               | `boolean`  | Pokazuje ścieżkę dokumentacji bezpośrednio zamiast oznaczonego linku w treści wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane w treści wyboru.                           |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wyjścia. |
| `exposure`                             | `object`   | Kontrolki widoczności kanału dla konfiguracji, list skonfigurowanych i powierzchni dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu konfiguracji szybkiego startu `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferuje wyszukiwanie sesji przy rozwiązywaniu celów ogłoszeń dla tego kanału. |

Przykład:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "Mój kanał",
      "selectionLabel": "Mój kanał (self-hosted)",
      "detailLabel": "Bot My Channel",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Self-hosted integracja czatu oparta na Webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Przewodnik:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` obsługuje:

- `configured`: uwzględnia kanał w powierzchniach list skonfigurowanych/w stylu statusu
- `setup`: uwzględnia kanał w interaktywnych selektorach konfiguracji
- `docs`: oznacza kanał jako publicznie widoczny w powierzchniach dokumentacji/nawigacji

<Note>
`showConfigured` i `showInSetup` pozostają obsługiwane jako starsze aliasy. Preferuj `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie metadane manifestu.

| Pole                         | Typ                  | Znaczenie                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanoniczna specyfikacja npm dla przepływów instalacji/aktualizacji.             |
| `localPath`                  | `string`             | Lokalna ścieżka instalacji developerskiej lub dołączonej.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy dostępne są oba.                             |
| `minHostVersion`             | `string`             | Minimalna obsługiwana wersja OpenClaw w formie `>=x.y.z`.                       |
| `expectedIntegrity`          | `string`             | Oczekiwany ciąg integralności dystrybucji npm, zwykle `sha512-...`, dla instalacji przypiętych. |
| `allowInvalidConfigRecovery` | `boolean`            | Pozwala przepływom ponownej instalacji dołączonego Plugin odzyskać działanie po określonych błędach nieaktualnej konfiguracji. |

<AccordionGroup>
  <Accordion title="Zachowanie wdrożenia">
    Interaktywne wdrożenie również używa `openclaw.install` dla powierzchni instalacji na żądanie. Jeśli Twój Plugin udostępnia wybory uwierzytelniania dostawcy albo metadane konfiguracji/katalogu kanału przed załadowaniem środowiska uruchomieniowego, wdrożenie może pokazać ten wybór, zapytać o instalację npm czy lokalną, zainstalować lub włączyć Plugin, a następnie kontynuować wybrany przepływ. Wybory wdrożenia npm wymagają zaufanych metadanych katalogu z rejestrowym `npmSpec`; dokładne wersje i `expectedIntegrity` to opcjonalne przypięcia. Jeśli `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji będą je egzekwować. Metadane „co pokazać” przechowuj w `openclaw.plugin.json`, a metadane „jak to zainstalować” w `package.json`.
  </Accordion>
  <Accordion title="Egzekwowanie `minHostVersion`">
    Jeśli ustawiono `minHostVersion`, zarówno instalacja, jak i ładowanie z rejestru manifestów będą je egzekwować. Starsze hosty pomijają Plugin; nieprawidłowe ciągi wersji są odrzucane.
  </Accordion>
  <Accordion title="Przypięte instalacje npm">
    W przypadku przypiętych instalacji npm zachowaj dokładną wersję w `npmSpec` i dodaj oczekiwaną integralność artefaktu:

    ```json
    {
      "openclaw": {
        "install": {
          "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
          "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
          "defaultChoice": "npm"
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="Zakres `allowInvalidConfigRecovery`">
    `allowInvalidConfigRecovery` nie jest ogólnym obejściem dla uszkodzonych konfiguracji. Służy wyłącznie do wąskiego scenariusza odzyskiwania działania dołączonego Plugin, tak aby ponowna instalacja/konfiguracja mogła naprawić znane pozostałości po aktualizacji, takie jak brakująca ścieżka dołączonego Plugin albo nieaktualny wpis `channels.<id>` dla tego samego Plugin. Jeśli konfiguracja jest uszkodzona z niepowiązanych powodów, instalacja nadal kończy się bezpieczną odmową i informuje operatora, aby uruchomił `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Odroczone pełne ładowanie

Pluginy kanałów mogą włączyć odroczone ładowanie za pomocą:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Gdy ta opcja jest włączona, OpenClaw ładuje podczas fazy uruchamiania przed nasłuchem tylko `setupEntry`, nawet dla już skonfigurowanych kanałów. Pełny punkt wejścia jest ładowany po tym, jak Gateway zacznie nasłuchiwać.

<Warning>
Włączaj odroczone ładowanie tylko wtedy, gdy `setupEntry` rejestruje wszystko, czego Gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestracja kanału, trasy HTTP, metody Gateway). Jeśli pełny punkt wejścia posiada wymagane możliwości startowe, pozostaw zachowanie domyślne.
</Warning>

Jeśli wpis konfiguracji/pełny wpis rejestruje metody RPC Gateway, zachowaj dla nich prefiks specyficzny dla Plugin. Zastrzeżone przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością rdzenia i zawsze są rozwiązywane do `operator.admin`.

## Manifest Plugin

Każdy natywny Plugin musi dostarczać `openclaw.plugin.json` w katalogu głównym pakietu. OpenClaw używa go do walidacji konfiguracji bez wykonywania kodu Plugin.

```json
{
  "id": "my-plugin",
  "name": "Mój Plugin",
  "description": "Dodaje możliwości My Plugin do OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Sekret weryfikacji Webhook"
      }
    }
  }
}
```

W przypadku Plugin kanałów dodaj `kind` i `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Nawet Pluginy bez konfiguracji muszą dostarczać schemat. Pusty schemat jest prawidłowy:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Pełne informacje o schemacie znajdziesz w [Manifeście Plugin](/pl/plugins/manifest).

## Publikowanie w ClawHub

W przypadku pakietów Plugin używaj polecenia ClawHub specyficznego dla pakietów:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Starszy alias publikacji tylko dla Skills jest przeznaczony dla Skills. Pakiety Plugin powinny zawsze używać `clawhub package publish`.
</Note>

## Wpis konfiguracji

Plik `setup-entry.ts` to lekka alternatywa dla `index.ts`, którą OpenClaw ładuje wtedy, gdy potrzebuje wyłącznie powierzchni konfiguracji (wdrożenie, naprawa konfiguracji, inspekcja wyłączonego kanału).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu runtime (bibliotek kryptograficznych, rejestracji CLI, usług działających w tle) podczas przepływów konfiguracji.

Dołączone kanały workspace, które przechowują eksporty bezpieczne dla konfiguracji w modułach pomocniczych, mogą używać `defineBundledChannelSetupEntry(...)` z `openclaw/plugin-sdk/channel-entry-contract` zamiast `defineSetupPluginEntry(...)`. Ten dołączony kontrakt obsługuje także opcjonalny eksport `runtime`, dzięki czemu łączenie runtime w czasie konfiguracji może pozostać lekkie i jawne.

<AccordionGroup>
  <Accordion title="Kiedy OpenClaw używa setupEntry zamiast pełnego punktu wejścia">
    - Kanał jest wyłączony, ale wymaga powierzchni konfiguracji/wdrożenia.
    - Kanał jest włączony, ale nieskonfigurowany.
    - Włączone jest odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Co setupEntry musi rejestrować">
    - Obiekt Plugin kanału (przez `defineSetupPluginEntry`).
    - Wszelkie trasy HTTP wymagane przed rozpoczęciem nasłuchiwania przez Gateway.
    - Wszelkie metody Gateway potrzebne podczas uruchamiania.

    Te metody Gateway używane podczas uruchamiania nadal powinny unikać zastrzeżonych przestrzeni nazw administracyjnych rdzenia, takich jak `config.*` lub `update.*`.

  </Accordion>
  <Accordion title="Czego setupEntry NIE powinien zawierać">
    - Rejestracji CLI.
    - Usług działających w tle.
    - Ciężkich importów runtime (crypto, SDK).
    - Metod Gateway potrzebnych dopiero po uruchomieniu.

  </Accordion>
</AccordionGroup>

### Wąskie importy pomocników konfiguracji

Dla gorących ścieżek tylko do konfiguracji preferuj wąskie punkty dostępu do pomocników konfiguracji zamiast szerszego zestawu `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                    | Używaj do                                                                                | Kluczowe eksporty                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | pomocniki runtime używane podczas konfiguracji, dostępne także w `setupEntry` / odroczonym starcie kanału | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | zależne od środowiska adaptery konfiguracji kont                                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | pomocniki CLI/archiwów/dokumentacji do konfiguracji i instalacji                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                             |

Użyj szerszego punktu dostępu `plugin-sdk/setup`, gdy chcesz uzyskać pełny współdzielony zestaw narzędzi konfiguracji, w tym pomocniki łatania konfiguracji, takie jak `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptery łatania konfiguracji pozostają bezpieczne dla gorącej ścieżki podczas importu. Ich dołączone wyszukiwanie powierzchni kontraktu promocji pojedynczego konta jest leniwe, więc import `plugin-sdk/setup-runtime` nie ładuje z wyprzedzeniem wykrywania dołączonej powierzchni kontraktu, zanim adapter zostanie faktycznie użyty.

### Promocja pojedynczego konta zarządzana przez kanał

Gdy kanał przechodzi z konfiguracji najwyższego poziomu dla pojedynczego konta do `channels.<id>.accounts.*`, domyślne współdzielone zachowanie polega na przeniesieniu promowanych wartości zależnych od konta do `accounts.default`.

Dołączone kanały mogą zawęzić lub nadpisać to promowanie przez swoją powierzchnię kontraktu konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które mają zostać przeniesione do promowanego konta
- `namedAccountPromotionKeys`: gdy nazwane konta już istnieją, tylko te klucze są przenoszone do promowanego konta; współdzielone klucze polityki/dostarczania pozostają w katalogu głównym kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera istniejące konto, które otrzyma promowane wartości

<Note>
Matrix jest obecnie przykładem dołączonym. Jeśli istnieje już dokładnie jedno nazwane konto Matrix albo jeśli `defaultAccount` wskazuje istniejący niekanoniczny klucz, taki jak `Ops`, promowanie zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`.
</Note>

## Schemat konfiguracji

Konfiguracja Plugin jest walidowana względem JSON Schema w Twoim manifeście. Użytkownicy konfigurują Pluginy przez:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Twój Plugin otrzymuje tę konfigurację jako `api.pluginConfig` podczas rejestracji.

W przypadku konfiguracji specyficznej dla kanału użyj zamiast tego sekcji konfiguracji kanału:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Budowanie schematów konfiguracji kanału

Użyj `buildChannelConfigSchema`, aby przekonwertować schemat Zod na opakowanie `ChannelConfigSchema` używane przez artefakty konfiguracji należące do Plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Dla Plugin zewnętrznych kontraktem zimnej ścieżki nadal pozostaje manifest Plugin: odzwierciedl wygenerowany JSON Schema w `openclaw.plugin.json#channelConfigs`, aby schemat konfiguracji, konfiguracja i powierzchnie UI mogły analizować `channels.<id>` bez ładowania kodu runtime.

## Kreatory konfiguracji

Pluginy kanałów mogą udostępniać interaktywne kreatory konfiguracji dla `openclaw onboard`. Kreator to obiekt `ChannelSetupWizard` w `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Połączono",
    unconfiguredLabel: "Nie skonfigurowano",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Token bota",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Użyć MY_CHANNEL_BOT_TOKEN ze środowiska?",
      keepPrompt: "Zachować obecny token?",
      inputPrompt: "Wprowadź token bota:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

Typ `ChannelSetupWizard` obsługuje `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i inne. Pełne przykłady znajdziesz w pakietach dołączonych Plugin (na przykład Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Współdzielone prompty allowFrom">
    W przypadku promptów listy dozwolonych dla DM, które potrzebują jedynie standardowego przepływu `note -> prompt -> parse -> merge -> patch`, preferuj współdzielone pomocniki konfiguracji z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` i `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardowy status konfiguracji kanału">
    Dla bloków statusu konfiguracji kanału, które różnią się tylko etykietami, ocenami i opcjonalnymi dodatkowymi liniami, preferuj `createStandardChannelSetupStatus(...)` z `openclaw/plugin-sdk/setup` zamiast ręcznie tworzyć ten sam obiekt `status` w każdym Plugin.
  </Accordion>
  <Accordion title="Opcjonalna powierzchnia konfiguracji kanału">
    Dla opcjonalnych powierzchni konfiguracji, które powinny pojawiać się tylko w określonych kontekstach, użyj `createOptionalChannelSetupSurface` z `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Zwraca { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` udostępnia także niższopoziomowe konstruktory `createOptionalChannelSetupAdapter(...)` i `createOptionalChannelSetupWizard(...)`, gdy potrzebujesz tylko jednej połowy tej opcjonalnej powierzchni instalacji.

    Wygenerowany opcjonalny adapter/kreator kończy działanie w trybie fail closed przy rzeczywistych zapisach konfiguracji. Ponownie używa jednego komunikatu o wymaganej instalacji w `validateInput`, `applyAccountConfig` i `finalize`, a gdy ustawiono `docsPath`, dołącza link do dokumentacji.

  </Accordion>
  <Accordion title="Pomocniki konfiguracji oparte na binariach">
    Dla interfejsów konfiguracji opartych na binariach preferuj współdzielone pomocniki delegowane zamiast kopiować tę samą logikę binariów/statusu do każdego kanału:

    - `createDetectedBinaryStatus(...)` dla bloków statusu, które różnią się jedynie etykietami, wskazówkami, ocenami i wykrywaniem binariów
    - `createCliPathTextInput(...)` dla wejść tekstowych opartych na ścieżkach
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` i `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazywać do cięższego pełnego kreatora
    - `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi jedynie delegować decyzję `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publikowanie i instalacja

**Pluginy zewnętrzne:** opublikuj w [ClawHub](/pl/tools/clawhub) lub npm, a następnie zainstaluj:

<Tabs>
  <Tab title="Automatycznie (najpierw ClawHub, potem npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw najpierw próbuje ClawHub, a następnie automatycznie przechodzi do npm.

  </Tab>
  <Tab title="Tylko ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Specyfikacja pakietu npm">
    Nie ma odpowiadającego nadpisania `npm:`. Użyj zwykłej specyfikacji pakietu npm, gdy chcesz użyć ścieżki npm po przejściu awaryjnym z ClawHub:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginy w repozytorium:** umieść je w drzewie workspace dołączonych Plugin, a zostaną automatycznie wykryte podczas budowania.

**Użytkownicy mogą instalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
Dla instalacji pochodzących z npm `openclaw plugins install` uruchamia lokalne dla projektu `npm install --ignore-scripts` (bez skryptów cyklu życia), ignorując odziedziczone globalne ustawienia instalacji npm. Utrzymuj drzewa zależności Plugin jako czyste JS/TS i unikaj pakietów, które wymagają budowania w `postinstall`.
</Info>

<Note>
Dołączone Pluginy należące do OpenClaw są jedynym wyjątkiem dotyczącym naprawy przy uruchamianiu: gdy instalacja pakietowa wykryje taki Plugin jako włączony przez konfigurację Plugin, starszą konfigurację kanału lub jego dołączony manifest z domyślnym włączeniem, podczas uruchamiania instalowane są brakujące zależności runtime tego Plugin przed importem. Pluginy zewnętrzne nie powinny polegać na instalacjach przy uruchamianiu; nadal używaj jawnego instalatora Plugin.
</Note>

## Powiązane

- [Budowanie Plugin](/pl/plugins/building-plugins) — przewodnik krok po kroku na początek
- [Manifest Plugin](/pl/plugins/manifest) — pełne informacje o schemacie manifestu
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — `definePluginEntry` i `defineChannelPluginEntry`
