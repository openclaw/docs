---
read_when:
    - Dodajesz kreator konfiguracji do Pluginu
    - Musisz zrozumieć różnicę między setup-entry.ts a index.ts
    - Definiujesz schematy konfiguracji Plugin lub metadane openclaw w package.json
sidebarTitle: Setup and config
summary: Kreatory konfiguracji, setup-entry.ts, schematy konfiguracji i metadane package.json
title: Ustawianie i konfiguracja Plugin
x-i18n:
    generated_at: "2026-05-02T20:57:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Dokumentacja referencyjna dotycząca pakowania pluginów (metadane `package.json`), manifestów (`openclaw.plugin.json`), wpisów konfiguracji i schematów konfiguracji.

<Tip>
**Szukasz przewodnika krok po kroku?** Przewodniki praktyczne omawiają pakowanie w kontekście: [Pluginy kanałów](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) oraz [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Twój `package.json` wymaga pola `openclaw`, które informuje system pluginów, co udostępnia Twój plugin:

<Tabs>
  <Tab title="Channel plugin">
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
  <Tab title="Provider plugin / ClawHub baseline">
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
Jeśli publikujesz plugin zewnętrznie w ClawHub, pola `compat` i `build` są wymagane. Kanoniczne fragmenty publikowania znajdują się w `docs/snippets/plugin-publish/`.
</Note>

### Pola `openclaw`

<ParamField path="extensions" type="string[]">
  Pliki punktów wejścia (względem katalogu głównego pakietu).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lekki wpis tylko do konfiguracji (opcjonalny).
</ParamField>
<ParamField path="channel" type="object">
  Metadane katalogu kanałów dla powierzchni konfiguracji, selektora, szybkiego startu i statusu.
</ParamField>
<ParamField path="providers" type="string[]">
  Identyfikatory dostawców zarejestrowane przez ten plugin.
</ParamField>
<ParamField path="install" type="object">
  Wskazówki instalacji: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flagi zachowania podczas uruchamiania.
</ParamField>

### `openclaw.channel`

`openclaw.channel` to lekkie metadane pakietu używane do wykrywania kanałów i powierzchni konfiguracji przed załadowaniem środowiska uruchomieniowego.

| Pole                                   | Typ        | Znaczenie                                                                      |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                               |
| `label`                                | `string`   | Główna etykieta kanału.                                                        |
| `selectionLabel`                       | `string`   | Etykieta selektora/konfiguracji, gdy powinna różnić się od `label`.            |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółów dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków konfiguracji i wyboru.                         |
| `docsLabel`                            | `string`   | Nadpisuje etykietę używaną dla linków dokumentacji, gdy powinna różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis do onboardingu/katalogu.                                           |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                     |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania dla wyboru kanału.                               |
| `preferOver`                           | `string[]` | Identyfikatory pluginów/kanałów o niższym priorytecie, które ten kanał powinien wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/obrazu systemowego dla katalogów kanałów w UI.          |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami dokumentacji w powierzchniach wyboru.             |
| `selectionDocsOmitLabel`               | `boolean`  | Pokazuje bezpośrednio ścieżkę dokumentacji zamiast etykietowanego linku dokumentacji w tekście wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dodawane w tekście wyboru.                             |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wychodzącym. |
| `exposure`                             | `object`   | Kontrola widoczności kanału dla konfiguracji, list skonfigurowanych i powierzchni dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu szybkiego startu `allowFrom`.      |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto.   |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferuje wyszukiwanie sesji podczas rozwiązywania celów ogłoszeń dla tego kanału. |

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

- `configured`: uwzględnia kanał w powierzchniach list skonfigurowanych/statusowych
- `setup`: uwzględnia kanał w interaktywnych selektorach konfiguracji/ustawień
- `docs`: oznacza kanał jako publiczny w powierzchniach dokumentacji/nawigacji

<Note>
`showConfigured` i `showInSetup` pozostają obsługiwane jako starsze aliasy. Preferuj `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie metadane manifestu.

| Pole                         | Typ                                 | Znaczenie                                                                         |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kanoniczna specyfikacja ClawHub dla przepływów instalacji/aktualizacji oraz instalacji na żądanie podczas onboardingu. |
| `npmSpec`                    | `string`                            | Kanoniczna specyfikacja npm dla awaryjnych przepływów instalacji/aktualizacji.    |
| `localPath`                  | `string`                            | Lokalna ścieżka rozwoju lub dołączonej instalacji.                                |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy dostępnych jest wiele źródeł.                  |
| `minHostVersion`             | `string`                            | Minimalna obsługiwana wersja OpenClaw w formie `>=x.y.z` lub `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Oczekiwany ciąg integralności dystrybucji npm, zwykle `sha512-...`, dla przypiętych instalacji. |
| `allowInvalidConfigRecovery` | `boolean`                           | Pozwala przepływom ponownej instalacji dołączonych pluginów odzyskać działanie po określonych awariach przestarzałej konfiguracji. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interaktywny onboarding używa także `openclaw.install` dla powierzchni instalacji na żądanie. Jeśli Twój plugin udostępnia wybory uwierzytelniania dostawcy albo metadane konfiguracji/katalogu kanału przed załadowaniem środowiska uruchomieniowego, onboarding może pokazać ten wybór, poprosić o instalację z ClawHub, npm lub lokalnie, zainstalować albo włączyć plugin, a następnie kontynuować wybrany przepływ. Wybory onboardingu ClawHub używają `clawhubSpec` i są preferowane, gdy są obecne; wybory npm wymagają zaufanych metadanych katalogu z `npmSpec` rejestru; dokładne wersje i `expectedIntegrity` są opcjonalnymi przypięciami npm. Jeśli `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji wymuszają je dla npm. Przechowuj metadane „co pokazać” w `openclaw.plugin.json`, a metadane „jak to zainstalować” w `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Jeśli ustawiono `minHostVersion`, wymuszają je zarówno instalacja, jak i ładowanie niedołączonego rejestru manifestów. Starsze hosty pomijają zewnętrzne pluginy; nieprawidłowe ciągi wersji są odrzucane. Zakłada się, że dołączone pluginy źródłowe mają wersję zgodną z checkoutem hosta.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` nie jest ogólnym obejściem dla uszkodzonych konfiguracji. Służy wyłącznie do wąskiego odzyskiwania dołączonych pluginów, aby ponowna instalacja/konfiguracja mogła naprawić znane pozostałości po aktualizacji, takie jak brakująca ścieżka dołączonego pluginu lub przestarzały wpis `channels.<id>` dla tego samego pluginu. Jeśli konfiguracja jest uszkodzona z niepowiązanych powodów, instalacja nadal kończy się bezpiecznym niepowodzeniem i informuje operatora, aby uruchomił `openclaw doctor --fix`.
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

Po włączeniu OpenClaw ładuje tylko `setupEntry` podczas fazy uruchamiania przed nasłuchiwaniem, nawet dla już skonfigurowanych kanałów. Pełny wpis ładuje się po rozpoczęciu nasłuchiwania przez Gateway.

<Warning>
Włączaj odroczone ładowanie tylko wtedy, gdy Twój `setupEntry` rejestruje wszystko, czego Gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestracja kanału, trasy HTTP, metody gatewaya). Jeśli pełny wpis jest właścicielem wymaganych możliwości startowych, zachowaj domyślne zachowanie.
</Warning>

Jeśli Twój wpis konfiguracji/pełny wpis rejestruje metody RPC gatewaya, trzymaj je pod prefiksem specyficznym dla pluginu. Zarezerwowane przestrzenie nazw podstawowej administracji (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością rdzenia i zawsze rozwiązują się do `operator.admin`.

## Manifest Plugin

Każdy natywny plugin musi dostarczać `openclaw.plugin.json` w katalogu głównym pakietu. OpenClaw używa go do walidacji konfiguracji bez wykonywania kodu pluginu.

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

W przypadku pluginów kanałów dodaj `kind` i `channels`:

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

Nawet pluginy bez konfiguracji muszą dostarczać schemat. Pusty schemat jest prawidłowy:

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

W przypadku pakietów pluginów użyj polecenia ClawHub specyficznego dla pakietu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Starszy alias publikowania tylko Skills jest przeznaczony dla Skills. Pakiety Plugin powinny zawsze używać `clawhub package publish`.
</Note>

## Wpis konfiguracji

Plik `setup-entry.ts` jest lekką alternatywą dla `index.ts`, którą OpenClaw ładuje, gdy potrzebuje tylko powierzchni konfiguracji (wdrażanie, naprawa konfiguracji, inspekcja wyłączonego kanału).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu runtime (bibliotek kryptograficznych, rejestracji CLI, usług działających w tle) podczas przepływów konfiguracji.

Kanały z pakietu workspace, które przechowują eksporty bezpieczne dla konfiguracji w modułach pomocniczych, mogą używać `defineBundledChannelSetupEntry(...)` z `openclaw/plugin-sdk/channel-entry-contract` zamiast `defineSetupPluginEntry(...)`. Ten kontrakt pakietowy obsługuje także opcjonalny eksport `runtime`, dzięki czemu okablowanie runtime w czasie konfiguracji może pozostać lekkie i jawne.

<AccordionGroup>
  <Accordion title="Kiedy OpenClaw używa setupEntry zamiast pełnego wpisu">
    - Kanał jest wyłączony, ale potrzebuje powierzchni konfiguracji/wdrażania.
    - Kanał jest włączony, ale nieskonfigurowany.
    - Ładowanie odroczone jest włączone (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Co setupEntry musi rejestrować">
    - Obiekt Plugin kanału (przez `defineSetupPluginEntry`).
    - Wszystkie trasy HTTP wymagane przed nasłuchem Gateway.
    - Wszystkie metody Gateway potrzebne podczas uruchamiania.

    Te metody Gateway uruchamiania nadal powinny unikać zarezerwowanych przestrzeni nazw administracyjnych rdzenia, takich jak `config.*` lub `update.*`.

  </Accordion>
  <Accordion title="Czego setupEntry NIE powinien zawierać">
    - Rejestracji CLI.
    - Usług działających w tle.
    - Ciężkich importów runtime (krypto, SDK).
    - Metod Gateway potrzebnych dopiero po uruchomieniu.

  </Accordion>
</AccordionGroup>

### Wąskie importy pomocników konfiguracji

Dla gorących ścieżek tylko konfiguracji preferuj wąskie szwy pomocników konfiguracji zamiast szerszego parasola `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                    | Do czego używać                                                                          | Kluczowe eksporty                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | pomocniki runtime w czasie konfiguracji, które pozostają dostępne w `setupEntry` / odroczonym uruchomieniu kanału | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptery konfiguracji kont uwzględniające środowisko                                      | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | pomocniki CLI/archiwum/dokumentacji dla konfiguracji/instalacji                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Użyj szerszego szwu `plugin-sdk/setup`, gdy chcesz mieć pełny współdzielony zestaw narzędzi konfiguracji, w tym pomocniki łatek konfiguracji, takie jak `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptery łatek konfiguracji pozostają bezpieczne dla gorącej ścieżki przy imporcie. Ich pakietowe wyszukiwanie powierzchni kontraktu promocji pojedynczego konta jest leniwe, więc importowanie `plugin-sdk/setup-runtime` nie ładuje zachłannie wykrywania pakietowej powierzchni kontraktu, zanim adapter zostanie faktycznie użyty.

### Promocja pojedynczego konta zarządzana przez kanał

Gdy kanał przechodzi z najwyższego poziomu konfiguracji pojedynczego konta na `channels.<id>.accounts.*`, domyślne współdzielone zachowanie przenosi promowane wartości zakresu konta do `accounts.default`.

Kanały pakietowe mogą zawęzić lub nadpisać tę promocję przez swoją powierzchnię kontraktu konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do promowanego konta
- `namedAccountPromotionKeys`: gdy nazwane konta już istnieją, tylko te klucze są przenoszone do promowanego konta; współdzielone klucze zasad/dostarczania pozostają w katalogu głównym kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera, które istniejące konto otrzymuje promowane wartości

<Note>
Matrix jest obecnym pakietowym przykładem. Jeśli istnieje już dokładnie jedno nazwane konto Matrix albo jeśli `defaultAccount` wskazuje istniejący niekanoniczny klucz, taki jak `Ops`, promocja zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`.
</Note>

## Schemat konfiguracji

Konfiguracja Plugin jest sprawdzana względem JSON Schema w manifeście. Użytkownicy konfigurują pluginy przez:

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

Użyj `buildChannelConfigSchema`, aby przekonwertować schemat Zod na opakowanie `ChannelConfigSchema` używane przez artefakty konfiguracji zarządzane przez Plugin:

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

W przypadku pluginów firm trzecich kontraktem zimnej ścieżki nadal jest manifest Plugin: odwzoruj wygenerowany JSON Schema do `openclaw.plugin.json#channelConfigs`, aby schemat konfiguracji, konfiguracja i powierzchnie UI mogły sprawdzać `channels.<id>` bez ładowania kodu runtime.

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

Typ `ChannelSetupWizard` obsługuje `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i więcej. Pełne przykłady znajdziesz w pakietach pluginów pakietowych (na przykład Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Współdzielone monity allowFrom">
    Dla monitów listy dozwolonych DM, które potrzebują tylko standardowego przepływu `note -> prompt -> parse -> merge -> patch`, preferuj współdzielone pomocniki konfiguracji z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` i `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardowy status konfiguracji kanału">
    Dla bloków statusu konfiguracji kanału, które różnią się tylko etykietami, wynikami i opcjonalnymi dodatkowymi wierszami, preferuj `createStandardChannelSetupStatus(...)` z `openclaw/plugin-sdk/setup` zamiast ręcznego tworzenia tego samego obiektu `status` w każdym Plugin.
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

    `plugin-sdk/channel-setup` udostępnia także niższopoziomowe konstruktory `createOptionalChannelSetupAdapter(...)` i `createOptionalChannelSetupWizard(...)`, gdy potrzebujesz tylko jednej połowy tej opcjonalnej powierzchni instalacji.

    Wygenerowany opcjonalny adapter/kreator domyślnie odmawia rzeczywistych zapisów konfiguracji. Ponownie używa jednego komunikatu o wymaganej instalacji w `validateInput`, `applyAccountConfig` i `finalize`, a także dołącza link do dokumentacji, gdy ustawiono `docsPath`.

  </Accordion>
  <Accordion title="Pomocniki konfiguracji oparte na plikach binarnych">
    Dla UI konfiguracji opartych na plikach binarnych preferuj współdzielone delegowane pomocniki zamiast kopiowania tego samego kleju binarnego/statusu do każdego kanału:

    - `createDetectedBinaryStatus(...)` dla bloków statusu, które różnią się tylko etykietami, wskazówkami, wynikami i wykrywaniem pliku binarnego
    - `createCliPathTextInput(...)` dla wejść tekstowych opartych na ścieżce
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` i `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazywać do cięższego pełnego kreatora
    - `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi tylko delegować decyzję `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publikowanie i instalowanie

**Zewnętrzne pluginy:** opublikuj w [ClawHub](/pl/tools/clawhub), a następnie zainstaluj:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Surowe specyfikacje pakietów są instalowane z npm podczas przełączenia uruchomienia.

  </Tab>
  <Tab title="Tylko ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Specyfikacja pakietu npm">
    Użyj npm, gdy pakiet nie został jeszcze przeniesiony do ClawHub albo gdy podczas migracji potrzebujesz
    bezpośredniej ścieżki instalacji npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginy w repozytorium:** umieść je w drzewie obszaru roboczego dołączonych pluginów, a zostaną automatycznie wykryte podczas kompilacji.

**Użytkownicy mogą zainstalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
W przypadku instalacji ze źródła npm `openclaw plugins install` instaluje pakiet w `~/.openclaw/npm` z wyłączonymi skryptami cyklu życia. Utrzymuj drzewa zależności pluginów jako czyste JS/TS i unikaj pakietów wymagających kompilacji `postinstall`.
</Info>

<Note>
Uruchamianie Gateway nie instaluje zależności pluginów. Przepływy instalacji npm/git/ClawHub odpowiadają za uzgodnienie zależności; lokalne pluginy muszą mieć już zainstalowane swoje zależności.
</Note>

Metadane dołączonego pakietu są jawne, a nie wywnioskowane ze skompilowanego JavaScript podczas uruchamiania Gateway. Zależności uruchomieniowe należą do pakietu pluginu, który jest ich właścicielem; uruchamianie spakowanego OpenClaw nigdy nie naprawia ani nie odzwierciedla zależności pluginów.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) — przewodnik krok po kroku ułatwiający rozpoczęcie pracy
- [Manifest Plugin](/pl/plugins/manifest) — pełna dokumentacja schematu manifestu
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — `definePluginEntry` i `defineChannelPluginEntry`
