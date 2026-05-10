---
read_when:
    - Dodajesz kreator konfiguracji do Plugin
    - Należy zrozumieć różnicę między setup-entry.ts a index.ts
    - Definiujesz schematy konfiguracji Plugin lub metadane openclaw w package.json
sidebarTitle: Setup and config
summary: Kreatory konfiguracji, setup-entry.ts, schematy konfiguracji i metadane package.json
title: Konfiguracja i ustawienia Plugin
x-i18n:
    generated_at: "2026-05-10T19:49:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Dokumentacja referencyjna dotycząca pakowania Plugin (`package.json` metadata), manifestów (`openclaw.plugin.json`), wpisów konfiguracji początkowej i schematów konfiguracji.

<Tip>
**Szukasz przewodnika krok po kroku?** Przewodniki how-to omawiają pakowanie w kontekście: [Channel plugins](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) i [Provider plugins](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
          "label": "My Channel",
          "blurb": "Short description of the channel."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin dostawcy / bazowy ClawHub">
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
  Pliki punktów wejścia (względem katalogu głównego pakietu).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lekki wpis wyłącznie do konfiguracji początkowej (opcjonalny).
</ParamField>
<ParamField path="channel" type="object">
  Metadane katalogowe kanału dla powierzchni konfiguracji początkowej, selektora, szybkiego startu i statusu.
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

`openclaw.channel` to lekkie metadane pakietu służące do wykrywania kanałów i powierzchni konfiguracji początkowej przed załadowaniem środowiska uruchomieniowego.

| Pole                                   | Typ        | Znaczenie                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                              |
| `label`                                | `string`   | Główna etykieta kanału.                                                       |
| `selectionLabel`                       | `string`   | Etykieta selektora/konfiguracji początkowej, gdy powinna różnić się od `label`. |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółowa dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków konfiguracji początkowej i wyboru.            |
| `docsLabel`                            | `string`   | Zastępcza etykieta używana dla linków do dokumentacji, gdy powinna różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis onboardingowy/katalogowy.                                         |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                    |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania dla wyboru kanału.                              |
| `preferOver`                           | `string[]` | Identyfikatory Plugin/kanałów o niższym priorytecie, które ten kanał powinien wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/obrazu systemowego dla katalogów UI kanałów.           |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami do dokumentacji w powierzchniach wyboru.         |
| `selectionDocsOmitLabel`               | `boolean`  | Pokazuj ścieżkę dokumentacji bezpośrednio zamiast etykietowanego linku do dokumentacji w tekście wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane w tekście wyboru.                           |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący markdown dla decyzji o formatowaniu wychodzącym. |
| `exposure`                             | `object`   | Kontrolki widoczności kanału dla konfiguracji początkowej, list skonfigurowanych i powierzchni dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu szybkiego startu `allowFrom`.      |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto.  |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferuj wyszukiwanie sesji podczas rozwiązywania celów ogłoszeń dla tego kanału. |

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

- `configured`: uwzględnij kanał w skonfigurowanych powierzchniach listowania w stylu statusu
- `setup`: uwzględnij kanał w interaktywnych selektorach konfiguracji początkowej/konfiguracji
- `docs`: oznacz kanał jako publiczny w powierzchniach dokumentacji/nawigacji

<Note>
`showConfigured` i `showInSetup` pozostają obsługiwane jako starsze aliasy. Preferuj `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie metadane manifestu.

| Pole                         | Typ                                 | Znaczenie                                                                       |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kanoniczna specyfikacja ClawHub dla instalacji/aktualizacji oraz przepływów onboardingowych instalacji na żądanie. |
| `npmSpec`                    | `string`                            | Kanoniczna specyfikacja npm dla zapasowych przepływów instalacji/aktualizacji.  |
| `localPath`                  | `string`                            | Lokalna ścieżka deweloperska lub ścieżka instalacji dołączonej.                 |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy dostępnych jest wiele źródeł.                |
| `minHostVersion`             | `string`                            | Minimalna obsługiwana wersja OpenClaw w formie `>=x.y.z` lub `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Oczekiwany ciąg integralności npm dist, zwykle `sha512-...`, dla instalacji przypiętych. |
| `allowInvalidConfigRecovery` | `boolean`                           | Pozwala przepływom ponownej instalacji dołączonego Plugin odzyskiwać się po określonych awariach nieaktualnej konfiguracji. |

<AccordionGroup>
  <Accordion title="Zachowanie onboardingu">
    Interaktywny onboarding używa również `openclaw.install` dla powierzchni instalacji na żądanie. Jeśli Twój Plugin udostępnia opcje uwierzytelniania dostawcy lub metadane konfiguracji początkowej/katalogu kanału przed załadowaniem środowiska uruchomieniowego, onboarding może pokazać ten wybór, poprosić o instalację z ClawHub, npm lub lokalną, zainstalować albo włączyć Plugin, a następnie kontynuować wybrany przepływ. Opcje onboardingu ClawHub używają `clawhubSpec` i są preferowane, gdy są obecne; opcje npm wymagają zaufanych metadanych katalogu ze specyfikacją rejestru `npmSpec`; dokładne wersje i `expectedIntegrity` są opcjonalnymi przypięciami npm. Jeśli `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji egzekwują je dla npm. Metadane „co pokazać” trzymaj w `openclaw.plugin.json`, a metadane „jak to zainstalować” w `package.json`.
  </Accordion>
  <Accordion title="Egzekwowanie minHostVersion">
    Jeśli ustawiono `minHostVersion`, egzekwują je zarówno instalacja, jak i ładowanie rejestru manifestów dla niedołączonych Plugin. Starsze hosty pomijają zewnętrzne Plugin; nieprawidłowe ciągi wersji są odrzucane. Zakłada się, że dołączone źródłowe Plugin mają tę samą wersję co checkout hosta.
  </Accordion>
  <Accordion title="Przypięte instalacje npm">
    Dla przypiętych instalacji npm zachowaj dokładną wersję w `npmSpec` i dodaj oczekiwaną integralność artefaktu:

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
    `allowInvalidConfigRecovery` nie jest ogólnym obejściem dla uszkodzonych konfiguracji. Służy wyłącznie do wąskiego odzyskiwania dołączonego Plugin, aby ponowna instalacja/konfiguracja początkowa mogła naprawić znane pozostałości po aktualizacji, takie jak brakująca ścieżka dołączonego Plugin lub nieaktualny wpis `channels.<id>` dla tego samego Plugin. Jeśli konfiguracja jest uszkodzona z niezwiązanych powodów, instalacja nadal kończy się niepowodzeniem w trybie zamkniętym i informuje operatora, aby uruchomił `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Odroczone pełne ładowanie

Plugin kanału mogą włączyć odroczone ładowanie za pomocą:

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

Po włączeniu OpenClaw ładuje tylko `setupEntry` w fazie uruchamiania przed nasłuchiwaniem, nawet dla już skonfigurowanych kanałów. Pełny wpis ładuje się po rozpoczęciu nasłuchiwania przez Gateway.

<Warning>
Włączaj odroczone ładowanie tylko wtedy, gdy Twój `setupEntry` rejestruje wszystko, czego Gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestrację kanału, trasy HTTP, metody Gateway). Jeśli pełny wpis odpowiada za wymagane możliwości uruchomieniowe, zachowaj zachowanie domyślne.
</Warning>

Jeśli Twój wpis konfiguracji początkowej/pełny wpis rejestruje metody RPC Gateway, trzymaj je pod prefiksem specyficznym dla Plugin. Zarezerwowane podstawowe przestrzenie nazw administracyjnych (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością core i zawsze rozwiązują się do `operator.admin`.

## Manifest Plugin

Każdy natywny Plugin musi dostarczać `openclaw.plugin.json` w katalogu głównym pakietu. OpenClaw używa go do walidacji konfiguracji bez wykonywania kodu Plugin.

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

Dla Plugin kanału dodaj `kind` i `channels`:

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

Zobacz [Manifest Plugin](/pl/plugins/manifest), aby uzyskać pełną dokumentację referencyjną schematu.

## Publikowanie w ClawHub

Dla pakietów Plugin użyj polecenia ClawHub specyficznego dla pakietu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Starszy alias publikowania tylko dla Skills jest przeznaczony dla Skills. Pakiety Plugin powinny zawsze używać `clawhub package publish`.
</Note>

## Wpis konfiguracji

Plik `setup-entry.ts` jest lekką alternatywą dla `index.ts`, którą OpenClaw ładuje, gdy potrzebuje tylko powierzchni konfiguracji (onboarding, naprawa konfiguracji, inspekcja wyłączonego kanału).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu wykonawczego (bibliotek kryptograficznych, rejestracji CLI, usług działających w tle) podczas przepływów konfiguracji.

Kanały dołączone w obszarze roboczym, które utrzymują bezpieczne dla konfiguracji eksporty w modułach bocznych, mogą używać `defineBundledChannelSetupEntry(...)` z `openclaw/plugin-sdk/channel-entry-contract` zamiast `defineSetupPluginEntry(...)`. Ten dołączony kontrakt obsługuje również opcjonalny eksport `runtime`, dzięki czemu okablowanie runtime podczas konfiguracji może pozostać lekkie i jawne.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Kanał jest wyłączony, ale potrzebuje powierzchni konfiguracji/onboardingu.
    - Kanał jest włączony, ale nieskonfigurowany.
    - Włączone jest odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - Obiekt Plugin kanału (przez `defineSetupPluginEntry`).
    - Wszelkie trasy HTTP wymagane przed nasłuchem Gateway.
    - Wszelkie metody Gateway potrzebne podczas uruchamiania.

    Te metody Gateway uruchamiane na starcie nadal powinny unikać zarezerwowanych głównych przestrzeni nazw administracyjnych, takich jak `config.*` lub `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - Rejestracje CLI.
    - Usługi działające w tle.
    - Ciężkie importy runtime (kryptografia, SDK).
    - Metody Gateway potrzebne dopiero po uruchomieniu.

  </Accordion>
</AccordionGroup>

### Wąskie importy pomocników konfiguracji

Dla gorących ścieżek przeznaczonych tylko do konfiguracji preferuj wąskie seams pomocników konfiguracji zamiast szerszego parasola `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                    | Do czego służy                                                                            | Kluczowe eksporty                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | pomocnicy runtime czasu konfiguracji, którzy pozostają dostępni w `setupEntry` / odroczonym uruchamianiu kanału | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | przestarzały alias zgodności; użyj `plugin-sdk/setup-runtime`                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | pomocnicy konfiguracji/instalacji CLI/archiwów/dokumentacji                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Użyj szerszego seam `plugin-sdk/setup`, gdy chcesz pełny współdzielony zestaw narzędzi konfiguracji, w tym pomocniki łatek konfiguracji, takie jak `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptery łatek konfiguracji pozostają bezpieczne dla gorącej ścieżki przy imporcie. Ich dołączone wyszukiwanie powierzchni kontraktu promocji pojedynczego konta jest leniwe, więc importowanie `plugin-sdk/setup-runtime` nie ładuje z wyprzedzeniem wykrywania dołączonej powierzchni kontraktu, zanim adapter zostanie faktycznie użyty.

### Promocja pojedynczego konta zarządzana przez kanał

Gdy kanał aktualizuje się z konfiguracji najwyższego poziomu dla pojedynczego konta do `channels.<id>.accounts.*`, domyślne współdzielone zachowanie polega na przeniesieniu promowanych wartości o zakresie konta do `accounts.default`.

Dołączone kanały mogą zawęzić lub nadpisać tę promocję przez swoją powierzchnię kontraktu konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do promowanego konta
- `namedAccountPromotionKeys`: gdy konta nazwane już istnieją, tylko te klucze trafiają do promowanego konta; współdzielone klucze polityki/dostarczania pozostają w katalogu głównym kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera, które istniejące konto otrzyma promowane wartości

<Note>
Matrix jest bieżącym dołączonym przykładem. Jeśli istnieje dokładnie jedno nazwane konto Matrix albo jeśli `defaultAccount` wskazuje na istniejący klucz niekanoniczny, taki jak `Ops`, promocja zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`.
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

Jeśli już tworzysz kontrakt jako JSON Schema lub TypeBox, użyj bezpośredniego pomocnika, aby OpenClaw mógł pominąć konwersję Zod-do-JSON-Schema na ścieżkach metadanych:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

W przypadku Pluginów zewnętrznych kontraktem zimnej ścieżki nadal jest manifest Plugin: odzwierciedl wygenerowany JSON Schema w `openclaw.plugin.json#channelConfigs`, aby schemat konfiguracji, konfiguracja i powierzchnie UI mogły sprawdzać `channels.<id>` bez ładowania kodu runtime.

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

Typ `ChannelSetupWizard` obsługuje `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i więcej. Pełne przykłady znajdziesz w pakietach dołączonych Pluginów (na przykład Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    W przypadku monitów listy dozwolonych DM, które potrzebują tylko standardowego przepływu `note -> prompt -> parse -> merge -> patch`, preferuj współdzielone pomocniki konfiguracji z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` i `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    W przypadku bloków statusu konfiguracji kanału, które różnią się tylko etykietami, wynikami i opcjonalnymi dodatkowymi wierszami, preferuj `createStandardChannelSetupStatus(...)` z `openclaw/plugin-sdk/setup` zamiast ręcznie tworzyć ten sam obiekt `status` w każdym Plugin.
  </Accordion>
  <Accordion title="Optional channel setup surface">
    W przypadku opcjonalnych powierzchni konfiguracji, które powinny pojawiać się tylko w określonych kontekstach, użyj `createOptionalChannelSetupSurface` z `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` udostępnia również niższopoziomowe konstruktory `createOptionalChannelSetupAdapter(...)` i `createOptionalChannelSetupWizard(...)`, gdy potrzebujesz tylko jednej połowy tej opcjonalnej powierzchni instalacji.

    Wygenerowany opcjonalny adapter/kreator bezpiecznie odmawia rzeczywistych zapisów konfiguracji. Ponownie używa jednego komunikatu o wymaganej instalacji w `validateInput`, `applyAccountConfig` i `finalize` oraz dołącza link do dokumentacji, gdy ustawione jest `docsPath`.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    W przypadku UI konfiguracji wspieranych przez pliki binarne preferuj współdzielone delegowane pomocniki zamiast kopiować to samo połączenie binarne/statusu do każdego kanału:

    - `createDetectedBinaryStatus(...)` dla bloków statusu, które różnią się tylko etykietami, wskazówkami, wynikami i wykrywaniem pliku binarnego
    - `createCliPathTextInput(...)` dla wejść tekstowych opartych na ścieżce
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` i `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazać obsługę do cięższego pełnego kreatora
    - `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi tylko delegować decyzję `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publikowanie i instalowanie

**Zewnętrzne Pluginy:** opublikuj w [ClawHub](/pl/clawhub), a następnie zainstaluj:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Gołe specyfikacje pakietów są instalowane z npm podczas przełączenia uruchomieniowego.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Użyj npm, gdy pakiet nie został jeszcze przeniesiony do ClawHub albo gdy potrzebujesz
    bezpośredniej ścieżki instalacji npm podczas migracji:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginy w repozytorium:** umieść je w dołączonym drzewie obszaru roboczego Pluginów, a zostaną automatycznie wykryte podczas kompilacji.

**Użytkownicy mogą instalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
W przypadku instalacji ze źródeł npm `openclaw plugins install` instaluje pakiet w `~/.openclaw/npm` z wyłączonymi skryptami cyklu życia. Utrzymuj drzewa zależności Pluginów jako czyste JS/TS i unikaj pakietów wymagających kompilacji przez `postinstall`.
</Info>

<Note>
Uruchomienie Gateway nie instaluje zależności Pluginów. Przepływy instalacji npm/git/ClawHub odpowiadają za uzgodnienie zależności; lokalne Pluginy muszą mieć już zainstalowane swoje zależności.
</Note>

Metadane dołączonego pakietu są jawne, a nie wywnioskowane ze skompilowanego JavaScriptu podczas uruchamiania gateway. Zależności uruchomieniowe należą do pakietu Pluginu, który jest ich właścicielem; uruchomienie spakowanego OpenClaw nigdy nie naprawia ani nie odzwierciedla zależności Pluginów.

## Powiązane

- [Tworzenie Pluginów](/pl/plugins/building-plugins) — przewodnik krok po kroku ułatwiający rozpoczęcie pracy
- [Manifest Pluginu](/pl/plugins/manifest) — pełna dokumentacja schematu manifestu
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — `definePluginEntry` i `defineChannelPluginEntry`
