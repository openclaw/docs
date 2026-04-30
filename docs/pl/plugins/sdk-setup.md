---
read_when:
    - Dodajesz kreatora konfiguracji do wtyczki
    - Musisz zrozumieć różnicę między setup-entry.ts a index.ts.
    - Definiujesz schematy konfiguracji Plugin lub metadane openclaw w package.json
sidebarTitle: Setup and config
summary: Kreatory konfiguracji, setup-entry.ts, schematy konfiguracji i metadane package.json
title: Konfigurowanie i ustawienia Plugin
x-i18n:
    generated_at: "2026-04-30T10:10:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Dokumentacja referencyjna dotycząca pakowania Plugin (`package.json` metadata), manifestów (`openclaw.plugin.json`), wpisów konfiguracji oraz schematów konfiguracji.

<Tip>
**Szukasz przewodnika krok po kroku?** Poradniki how-to omawiają pakowanie w kontekście: [Plugin kanałów](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) i [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Twój `package.json` wymaga pola `openclaw`, które informuje system Plugin, co zapewnia Twój Plugin:

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
          "label": "My Channel",
          "blurb": "Short description of the channel."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin dostawcy / punkt odniesienia ClawHub">
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
Jeśli publikujesz Plugin zewnętrznie w ClawHub, te pola `compat` i `build` są wymagane. Kanoniczne fragmenty publikowania znajdują się w `docs/snippets/plugin-publish/`.
</Note>

### Pola `openclaw`

<ParamField path="extensions" type="string[]">
  Pliki punktów wejścia (względne wobec katalogu głównego pakietu).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lekki wpis wyłącznie do konfiguracji (opcjonalny).
</ParamField>
<ParamField path="channel" type="object">
  Metadane katalogu kanałów dla konfiguracji, selektora, szybkiego startu i powierzchni statusu.
</ParamField>
<ParamField path="providers" type="string[]">
  Identyfikatory dostawców rejestrowane przez ten Plugin.
</ParamField>
<ParamField path="install" type="object">
  Wskazówki instalacji: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flagi zachowania podczas uruchamiania.
</ParamField>

### `openclaw.channel`

`openclaw.channel` to lekkie metadane pakietu służące do wykrywania kanałów i powierzchni konfiguracji przed załadowaniem środowiska uruchomieniowego.

| Pole                                   | Typ        | Znaczenie                                                                      |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                               |
| `label`                                | `string`   | Podstawowa etykieta kanału.                                                    |
| `selectionLabel`                       | `string`   | Etykieta selektora/konfiguracji, gdy ma się różnić od `label`.                 |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółów dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków konfiguracji i wyboru.                         |
| `docsLabel`                            | `string`   | Zastępująca etykieta używana dla linków do dokumentacji, gdy ma się różnić od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis do wdrażania/katalogu.                                             |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                     |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania dla wyboru kanału.                               |
| `preferOver`                           | `string[]` | Identyfikatory Plugin/kanałów o niższym priorytecie, które ten kanał powinien wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/obrazu systemowego dla katalogów interfejsu kanałów.    |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami do dokumentacji w powierzchniach wyboru.          |
| `selectionDocsOmitLabel`               | `boolean`  | Pokaż bezpośrednio ścieżkę dokumentacji zamiast opisanego etykietą linku do dokumentacji w tekście wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane w tekście wyboru.                            |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wychodzącym. |
| `exposure`                             | `object`   | Kontrole widoczności kanału dla konfiguracji, skonfigurowanych list i powierzchni dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu konfiguracji szybkiego startu `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta, nawet gdy istnieje tylko jedno konto.         |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferuj wyszukiwanie sesji podczas rozpoznawania celów ogłoszeń dla tego kanału. |

Przykład:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
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

- `configured`: uwzględnij kanał w powierzchniach list w stylu skonfigurowanych/statusu
- `setup`: uwzględnij kanał w interaktywnych selektorach konfiguracji/konfigurowania
- `docs`: oznacz kanał jako publiczny w powierzchniach dokumentacji/nawigacji

<Note>
`showConfigured` i `showInSetup` pozostają obsługiwane jako starsze aliasy. Preferuj `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie metadane manifestu.

| Pole                         | Typ                  | Znaczenie                                                                       |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanoniczna specyfikacja npm dla przepływów instalacji/aktualizacji.             |
| `localPath`                  | `string`             | Lokalna ścieżka programistyczna lub ścieżka instalacji dołączonej w pakiecie.   |
| `defaultChoice`              | `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy dostępne są oba.                             |
| `minHostVersion`             | `string`             | Minimalna obsługiwana wersja OpenClaw w formacie `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | Oczekiwany ciąg integralności dystrybucji npm, zwykle `sha512-...`, dla przypiętych instalacji. |
| `allowInvalidConfigRecovery` | `boolean`            | Pozwala przepływom ponownej instalacji dołączonego Plugin odzyskać działanie po określonych awariach związanych z nieaktualną konfiguracją. |

<AccordionGroup>
  <Accordion title="Zachowanie wdrażania">
    Interaktywne wdrażanie używa także `openclaw.install` dla powierzchni instalacji na żądanie. Jeśli Twój Plugin udostępnia wybory uwierzytelniania dostawcy lub metadane konfiguracji/katalogu kanału przed załadowaniem środowiska uruchomieniowego, wdrażanie może pokazać ten wybór, poprosić o wybór instalacji npm albo lokalnej, zainstalować lub włączyć Plugin, a następnie kontynuować wybrany przepływ. Wybory wdrażania npm wymagają zaufanych metadanych katalogu ze specyfikacją rejestru `npmSpec`; dokładne wersje i `expectedIntegrity` są opcjonalnymi przypięciami. Jeśli `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji je egzekwują. Metadane „co pokazać” trzymaj w `openclaw.plugin.json`, a metadane „jak to zainstalować” w `package.json`.
  </Accordion>
  <Accordion title="Egzekwowanie minHostVersion">
    Jeśli `minHostVersion` jest ustawione, egzekwują je zarówno instalacja, jak i ładowanie rejestru manifestów. Starsze hosty pomijają Plugin; nieprawidłowe ciągi wersji są odrzucane.
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
  <Accordion title="Zakres allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` nie jest ogólnym obejściem uszkodzonych konfiguracji. Służy wyłącznie do wąskiego odzyskiwania dołączonych Plugin, aby ponowna instalacja/konfiguracja mogła naprawić znane pozostałości po aktualizacji, takie jak brakująca ścieżka dołączonego Plugin lub nieaktualny wpis `channels.<id>` dla tego samego Plugin. Jeśli konfiguracja jest uszkodzona z niepowiązanych powodów, instalacja nadal kończy się bezpiecznym błędem i informuje operatora, aby uruchomił `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Odroczone pełne ładowanie

Plugin kanałów mogą włączyć odroczone ładowanie za pomocą:

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

Po włączeniu OpenClaw ładuje tylko `setupEntry` podczas fazy uruchamiania przed nasłuchiwaniem, nawet dla już skonfigurowanych kanałów. Pełny wpis jest ładowany po rozpoczęciu nasłuchiwania przez gateway.

<Warning>
Włączaj odroczone ładowanie tylko wtedy, gdy Twój `setupEntry` rejestruje wszystko, czego gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestrację kanału, trasy HTTP, metody gateway). Jeśli pełny wpis odpowiada za wymagane możliwości uruchamiania, zachowaj domyślne zachowanie.
</Warning>

Jeśli Twój wpis konfiguracji/pełny wpis rejestruje metody RPC gateway, trzymaj je w prefiksie specyficznym dla Plugin. Zarezerwowane przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością rdzenia i zawsze rozpoznają się do `operator.admin`.

## Manifest Plugin

Każdy natywny Plugin musi dostarczać `openclaw.plugin.json` w katalogu głównym pakietu. OpenClaw używa go do walidowania konfiguracji bez wykonywania kodu Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
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

Nawet Plugin bez konfiguracji muszą dostarczać schemat. Pusty schemat jest prawidłowy:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Pełną dokumentację schematu znajdziesz w [Manifeście Plugin](/pl/plugins/manifest).

## Publikowanie w ClawHub

Dla pakietów Plugin użyj polecenia ClawHub właściwego dla pakietu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Starszy alias publikowania tylko dla Skills jest przeznaczony dla Skills. Pakiety Plugin powinny zawsze używać `clawhub package publish`.
</Note>

## Wpis konfiguracji

Plik `setup-entry.ts` jest lekką alternatywą dla `index.ts`, którą OpenClaw ładuje, gdy potrzebuje tylko powierzchni konfiguracji (wdrażanie, naprawa konfiguracji, inspekcja wyłączonego kanału).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu wykonywania (bibliotek kryptograficznych, rejestracji CLI, usług działających w tle) podczas przepływów konfiguracji.

Dołączone kanały obszaru roboczego, które utrzymują bezpieczne dla konfiguracji eksporty w modułach pomocniczych, mogą używać `defineBundledChannelSetupEntry(...)` z `openclaw/plugin-sdk/channel-entry-contract` zamiast `defineSetupPluginEntry(...)`. Ten dołączony kontrakt obsługuje także opcjonalny eksport `runtime`, dzięki czemu okablowanie środowiska wykonywania w czasie konfiguracji może pozostać lekkie i jawne.

<AccordionGroup>
  <Accordion title="Kiedy OpenClaw używa setupEntry zamiast pełnego wpisu">
    - Kanał jest wyłączony, ale potrzebuje powierzchni konfiguracji/wprowadzania.
    - Kanał jest włączony, ale nieskonfigurowany.
    - Włączone jest odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Co setupEntry musi zarejestrować">
    - Obiekt Plugin kanału (przez `defineSetupPluginEntry`).
    - Wszelkie trasy HTTP wymagane przed nasłuchem Gateway.
    - Wszelkie metody Gateway potrzebne podczas uruchamiania.

    Te metody Gateway uruchamiania nadal powinny unikać zarezerwowanych przestrzeni nazw administracyjnych rdzenia, takich jak `config.*` lub `update.*`.

  </Accordion>
  <Accordion title="Czego setupEntry NIE powinno zawierać">
    - Rejestracji CLI.
    - Usług działających w tle.
    - Ciężkich importów środowiska wykonywania (kryptografia, SDK).
    - Metod Gateway potrzebnych dopiero po uruchomieniu.

  </Accordion>
</AccordionGroup>

### Wąskie importy pomocników konfiguracji

Dla gorących ścieżek tylko do konfiguracji preferuj wąskie punkty styku pomocników konfiguracji zamiast szerszego parasola `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                    | Zastosowanie                                                                               | Kluczowe eksporty                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | pomocniki środowiska wykonywania czasu konfiguracji dostępne w `setupEntry` / odroczonym starcie kanału | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptery konfiguracji kont świadome środowiska                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | pomocniki CLI/archiwum/dokumentacji dla konfiguracji/instalacji                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                 |

Użyj szerszego punktu styku `plugin-sdk/setup`, gdy chcesz mieć pełny wspólny zestaw narzędzi konfiguracji, w tym pomocniki łatek konfiguracji, takie jak `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptery łatek konfiguracji pozostają bezpieczne na gorącej ścieżce podczas importu. Ich dołączone wyszukiwanie powierzchni kontraktu promocji pojedynczego konta jest leniwe, więc importowanie `plugin-sdk/setup-runtime` nie ładuje zachłannie wykrywania dołączonej powierzchni kontraktu, zanim adapter zostanie faktycznie użyty.

### Promocja pojedynczego konta należąca do kanału

Gdy kanał przechodzi z najwyższego poziomu konfiguracji pojedynczego konta na `channels.<id>.accounts.*`, domyślne wspólne zachowanie polega na przeniesieniu promowanych wartości o zakresie konta do `accounts.default`.

Dołączone kanały mogą zawęzić lub zastąpić tę promocję przez swoją powierzchnię kontraktu konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do promowanego konta
- `namedAccountPromotionKeys`: gdy nazwane konta już istnieją, tylko te klucze są przenoszone do promowanego konta; wspólne klucze polityki/dostarczania pozostają w korzeniu kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera, które istniejące konto otrzyma promowane wartości

<Note>
Matrix jest obecnym dołączonym przykładem. Jeśli dokładnie jedno nazwane konto Matrix już istnieje albo jeśli `defaultAccount` wskazuje istniejący klucz niekanoniczny, taki jak `Ops`, promocja zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`.
</Note>

## Schemat konfiguracji

Konfiguracja Plugin jest walidowana względem JSON Schema w manifeście. Użytkownicy konfigurują Pluginy przez:

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

Dla konfiguracji specyficznej dla kanału użyj zamiast tego sekcji konfiguracji kanału:

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

Użyj `buildChannelConfigSchema`, aby przekonwertować schemat Zod na opakowanie `ChannelConfigSchema` używane przez artefakty konfiguracji należące do Pluginu:

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

Dla Pluginów zewnętrznych kontraktem zimnej ścieżki nadal jest manifest Pluginu: odwzoruj wygenerowany JSON Schema w `openclaw.plugin.json#channelConfigs`, aby schemat konfiguracji, konfiguracja i powierzchnie UI mogły sprawdzać `channels.<id>` bez ładowania kodu wykonywania.

## Kreatory konfiguracji

Pluginy kanałów mogą udostępniać interaktywne kreatory konfiguracji dla `openclaw onboard`. Kreator jest obiektem `ChannelSetupWizard` w `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
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

Typ `ChannelSetupWizard` obsługuje `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i inne. Pełne przykłady znajdziesz w dołączonych pakietach Pluginów (na przykład Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Wspólne monity allowFrom">
    Dla monitów listy dozwolonych DM, które potrzebują tylko standardowego przepływu `note -> prompt -> parse -> merge -> patch`, preferuj wspólne pomocniki konfiguracji z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` i `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardowy status konfiguracji kanału">
    Dla bloków statusu konfiguracji kanału, które różnią się tylko etykietami, wynikami i opcjonalnymi dodatkowymi liniami, preferuj `createStandardChannelSetupStatus(...)` z `openclaw/plugin-sdk/setup` zamiast ręcznie tworzyć ten sam obiekt `status` w każdym Pluginie.
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
    // Returns { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` udostępnia także niższego poziomu konstruktory `createOptionalChannelSetupAdapter(...)` i `createOptionalChannelSetupWizard(...)`, gdy potrzebujesz tylko jednej połowy tej opcjonalnej powierzchni instalacji.

    Wygenerowany opcjonalny adapter/kreator domyślnie odmawia rzeczywistych zapisów konfiguracji. Ponownie używa jednego komunikatu o wymaganej instalacji w `validateInput`, `applyAccountConfig` i `finalize`, a gdy ustawione jest `docsPath`, dołącza link do dokumentacji.

  </Accordion>
  <Accordion title="Pomocniki konfiguracji oparte na plikach binarnych">
    Dla UI konfiguracji opartych na plikach binarnych preferuj wspólne delegowane pomocniki zamiast kopiować to samo spoiwo binarne/statusu do każdego kanału:

    - `createDetectedBinaryStatus(...)` dla bloków statusu, które różnią się tylko etykietami, wskazówkami, wynikami i wykrywaniem pliku binarnego
    - `createCliPathTextInput(...)` dla pól tekstowych opartych na ścieżce
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` i `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazać obsługę do cięższego pełnego kreatora
    - `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi tylko delegować decyzję `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publikowanie i instalowanie

**Pluginy zewnętrzne:** opublikuj w [ClawHub](/pl/tools/clawhub), a następnie zainstaluj:

<Tabs>
  <Tab title="Automatycznie (ClawHub, potem npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw najpierw próbuje ClawHub, a w razie potrzeby automatycznie przechodzi na npm.

  </Tab>
  <Tab title="Tylko ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Specyfikacja pakietu npm">
    Użyj npm, gdy pakiet nie został jeszcze przeniesiony do ClawHub albo gdy podczas migracji potrzebujesz bezpośredniej ścieżki instalacji npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginy w repozytorium:** umieść je w drzewie obszaru roboczego dołączonych Pluginów, a zostaną automatycznie wykryte podczas budowania.

**Użytkownicy mogą instalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
Dla instalacji pochodzących z npm `openclaw plugins install` uruchamia lokalne dla projektu `npm install --ignore-scripts` (bez skryptów cyklu życia), ignorując odziedziczone globalne ustawienia instalacji npm. Utrzymuj drzewa zależności Pluginów jako czyste JS/TS i unikaj pakietów wymagających kompilacji `postinstall`.
</Info>

<Note>
Dołączone Pluginy należące do OpenClaw są jedynym wyjątkiem od naprawy podczas uruchamiania: gdy instalacja pakietowa widzi taki Plugin włączony przez konfigurację Pluginu, starszą konfigurację kanału albo jego dołączony manifest domyślnie włączony, uruchamianie instaluje brakujące zależności runtime tego Pluginu przed importem. Operatorzy mogą sprawdzić lub naprawić ten etap za pomocą `openclaw plugins deps`. Pluginy innych firm nie powinny polegać na instalacjach podczas uruchamiania; nadal używaj jawnego instalatora Pluginów.
</Note>

Dołączone zależności runtime na poziomie pakietu są jawnymi metadanymi, a nie czymś wywnioskowanym z wygenerowanego kodu JavaScript podczas uruchamiania Gateway. Jeśli współdzielona główna zależność OpenClaw musi być dostępna w zewnętrznym lustrze runtime dołączonego Pluginu, zadeklaruj ją w `openclaw.bundle.mirroredRootRuntimeDependencies` w głównym manifeście pakietu.

## Powiązane

- [Budowanie Pluginów](/pl/plugins/building-plugins) — przewodnik krok po kroku po rozpoczęciu pracy
- [Manifest Pluginu](/pl/plugins/manifest) — pełna dokumentacja schematu manifestu
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — `definePluginEntry` i `defineChannelPluginEntry`
