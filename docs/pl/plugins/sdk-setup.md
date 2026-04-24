---
read_when:
    - Dodajesz kreator konfiguracji do Plugin
    - Musisz zrozumieć `setup-entry.ts` vs `index.ts`
    - Definiujesz schematy konfiguracji Plugin lub metadane `openclaw` w `package.json`
sidebarTitle: Setup and Config
summary: Kreatory konfiguracji, `setup-entry.ts`, schematy konfiguracji i metadane `package.json`
title: Konfiguracja i setup Plugin
x-i18n:
    generated_at: "2026-04-24T09:24:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Dokumentacja pakowania Plugin (`package.json` metadata), manifestów
(`openclaw.plugin.json`), wpisów setup i schematów konfiguracji.

<Tip>
  **Szukasz przewodnika krok po kroku?** Przewodniki how-to omawiają pakowanie w kontekście:
  [Plugins kanałów](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) oraz
  [Plugins providerów](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Twój `package.json` potrzebuje pola `openclaw`, które mówi systemowi Plugin, co
Twój Plugin udostępnia:

**Plugin kanału:**

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

**Plugin providera / baza publikacji ClawHub:**

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

Jeśli publikujesz Plugin zewnętrznie w ClawHub, pola `compat` i `build`
są wymagane. Kanoniczne fragmenty publikacji znajdują się w
`docs/snippets/plugin-publish/`.

### Pola `openclaw`

| Pole         | Typ        | Opis                                                                                                                     |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Pliki punktów wejścia (względem katalogu głównego pakietu)                                                              |
| `setupEntry` | `string`   | Lekki wpis tylko do setupu (opcjonalnie)                                                                                |
| `channel`    | `object`   | Metadane katalogu kanału dla setup, pickera, quickstart i powierzchni statusu                                          |
| `providers`  | `string[]` | Identyfikatory providerów rejestrowane przez ten Plugin                                                                 |
| `install`    | `object`   | Wskazówki instalacji: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flagi zachowania przy starcie                                                                                            |

### `openclaw.channel`

`openclaw.channel` to lekkie metadane pakietu do wykrywania kanałów i powierzchni setup
zanim runtime zostanie załadowany.

| Pole                                   | Typ        | Znaczenie                                                                  |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                           |
| `label`                                | `string`   | Główna etykieta kanału.                                                    |
| `selectionLabel`                       | `string`   | Etykieta pickera/setup, gdy powinna różnić się od `label`.                 |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółów dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków setup i selection.                         |
| `docsLabel`                            | `string`   | Nadpisanie etykiety używanej dla linków do dokumentacji, gdy powinna różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis onboardingu/katalogu.                                          |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                 |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania do wyboru kanału.                            |
| `preferOver`                           | `string[]` | Identyfikatory Plugin/kanałów o niższym priorytecie, które ten kanał powinien wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/system-image dla katalogów UI kanałów.              |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami do dokumentacji w powierzchniach selection.   |
| `selectionDocsOmitLabel`               | `boolean`  | Pokazuje bezpośrednio ścieżkę dokumentacji zamiast podpisanego linku do dokumentacji w tekście selection. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane w tekście selection.                     |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako zdolny do Markdown dla decyzji o formatowaniu wychodzącym. |
| `exposure`                             | `object`   | Sterowanie widocznością kanału dla setup, skonfigurowanych list i powierzchni dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu konfiguracji quickstart `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferuje wyszukiwanie sesji przy rozwiązywaniu celów announce dla tego kanału. |

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

- `configured`: uwzględnia kanał w skonfigurowanych/powierzchniach listowania w stylu statusu
- `setup`: uwzględnia kanał w interaktywnych pickerach setup/configure
- `docs`: oznacza kanał jako publiczny na powierzchniach dokumentacji/nawigacji

`showConfigured` i `showInSetup` nadal są obsługiwane jako starsze aliasy. Preferuj
`exposure`.

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie manifestu.

| Pole                         | Typ                  | Znaczenie                                                                       |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanoniczna specyfikacja npm dla przepływów install/update.                      |
| `localPath`                  | `string`             | Lokalna ścieżka developmentu lub instalacji dołączonej.                         |
| `defaultChoice`              | `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy oba są dostępne.                             |
| `minHostVersion`             | `string`             | Minimalna obsługiwana wersja OpenClaw w formie `>=x.y.z`.                       |
| `expectedIntegrity`          | `string`             | Oczekiwany ciąg integralności dist npm, zwykle `sha512-...`, dla przypiętych instalacji. |
| `allowInvalidConfigRecovery` | `boolean`            | Pozwala przepływom reinstalacji dołączonych Plugin odzyskać stan po określonych błędach nieaktualnej konfiguracji. |

Interaktywny onboarding używa też `openclaw.install` dla powierzchni
instalacji na żądanie. Jeśli Twój Plugin ujawnia wybory auth providera lub metadane setup/katalogu kanału
zanim runtime zostanie załadowany, onboarding może pokazać ten wybór, zapytać o instalację npm vs lokalną, zainstalować lub włączyć Plugin, a następnie kontynuować wybrany
przepływ. Wybory onboardingu npm wymagają zaufanych metadanych katalogu z
rejestrowym `npmSpec`; dokładne wersje i `expectedIntegrity` są opcjonalnymi przypięciami. Jeśli
obecne jest `expectedIntegrity`, przepływy install/update je egzekwują. Zachowaj metadane „co
pokazać” w `openclaw.plugin.json`, a metadane „jak to zainstalować”
w `package.json`.

Jeśli ustawiono `minHostVersion`, przepływy instalacji i ładowanie rejestru manifestów oba
je egzekwują. Starsze hosty pomijają Plugin; nieprawidłowe ciągi wersji są odrzucane.

Dla przypiętych instalacji npm zachowaj dokładną wersję w `npmSpec` i dodaj
oczekiwaną integralność artefaktu:

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

`allowInvalidConfigRecovery` nie jest ogólnym obejściem dla uszkodzonych konfiguracji. Jest
tylko dla wąskiego odzyskiwania dołączonych Plugin, tak aby reinstall/setup mógł naprawiać znane pozostałości po aktualizacjach, takie jak brakująca ścieżka dołączonego Plugin lub nieaktualny wpis `channels.<id>`
dla tego samego Plugin. Jeśli konfiguracja jest zepsuta z innych powodów, instalacja
nadal kończy się bezpieczną odmową i mówi operatorowi, aby uruchomił `openclaw doctor --fix`.

### Odroczone pełne ładowanie

Plugins kanałów mogą włączyć odroczone ładowanie przez:

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

Po włączeniu OpenClaw ładuje tylko `setupEntry` podczas fazy startupu
przed listen, nawet dla już skonfigurowanych kanałów. Pełny wpis ładuje się po tym, jak
gateway zacznie nasłuchiwać.

<Warning>
  Włączaj odroczone ładowanie tylko wtedy, gdy `setupEntry` rejestruje wszystko, czego
  gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestracja kanału, trasy HTTP,
  metody gateway). Jeśli pełny wpis jest właścicielem wymaganych możliwości startowych, zachowaj
  domyślne zachowanie.
</Warning>

Jeśli Twój wpis setup/full rejestruje metody Gateway RPC, utrzymuj je pod
prefiksem specyficznym dla Plugin. Zastrzeżone przestrzenie nazw administracyjnych core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością core i zawsze są rozwiązywane
do `operator.admin`.

## Manifest Plugin

Każdy natywny Plugin musi dostarczać `openclaw.plugin.json` w katalogu głównym pakietu.
OpenClaw używa tego do walidacji konfiguracji bez wykonywania kodu Plugin.

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

Dla Plugin kanałów dodaj `kind` i `channels`:

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

Nawet Plugins bez konfiguracji muszą dostarczać schemat. Pusty schemat jest prawidłowy:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Pełną dokumentację schematu znajdziesz w [Manifest Plugin](/pl/plugins/manifest).

## Publikowanie w ClawHub

Dla pakietów Plugin używaj polecenia ClawHub specyficznego dla pakietów:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Starszy alias publikacji tylko dla Skills jest przeznaczony dla Skills. Pakiety Plugin powinny
zawsze używać `clawhub package publish`.

## Wpis setup

Plik `setup-entry.ts` to lekka alternatywa dla `index.ts`, którą
OpenClaw ładuje wtedy, gdy potrzebuje tylko powierzchni setup (onboarding, naprawa konfiguracji,
inspekcja wyłączonych kanałów).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu runtime (bibliotek crypto, rejestracji CLI,
usług w tle) podczas przepływów setup.

Dołączone kanały obszaru roboczego, które trzymają eksporty bezpieczne dla setup w modułach pobocznych, mogą
używać `defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract` zamiast
`defineSetupPluginEntry(...)`. Ten dołączony kontrakt obsługuje również opcjonalny
eksport `runtime`, dzięki czemu okablowanie runtime w czasie setup pozostaje lekkie i jawne.

**Kiedy OpenClaw używa `setupEntry` zamiast pełnego entry:**

- Kanał jest wyłączony, ale potrzebuje powierzchni setup/onboardingu
- Kanał jest włączony, ale nieskonfigurowany
- Włączone jest ładowanie odroczone (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Co `setupEntry` musi rejestrować:**

- Obiekt Plugin kanału (przez `defineSetupPluginEntry`)
- Wszystkie trasy HTTP wymagane przed listen gateway
- Wszystkie metody gateway potrzebne podczas startupu

Te metody gateway uruchamiane przy starcie nadal powinny unikać zastrzeżonych przestrzeni nazw administracyjnych core,
takich jak `config.*` lub `update.*`.

**Czego `setupEntry` NIE powinien zawierać:**

- Rejestracji CLI
- Usług w tle
- Ciężkich importów runtime (crypto, SDK)
- Metod gateway potrzebnych dopiero po starcie

### Wąskie importy helperów setup

Dla gorących ścieżek tylko setup preferuj wąskie seamy helperów setup zamiast szerszego
parasola `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni setup:

| Ścieżka importu                    | Używaj do                                                                                | Kluczowe eksporty                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helperów runtime czasu setup, które pozostają dostępne w `setupEntry` / odroczonym starcie kanału | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapterów setup kont zależnych od środowiska                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                          |
| `plugin-sdk/setup-tools`           | helperów CLI/archive/docs dla setup/install                                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Używaj szerszego seam `plugin-sdk/setup`, gdy chcesz pełnego współdzielonego
zestawu narzędzi setup, w tym helperów patch konfiguracji takich jak
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptery patch setup pozostają bezpieczne importowo na gorącej ścieżce. Ich dołączone
wyszukiwanie powierzchni kontraktu promocji pojedynczego konta jest leniwe, więc import
`plugin-sdk/setup-runtime` nie ładuje eagerly wykrywania powierzchni kontraktów dołączonych, zanim
adapter zostanie faktycznie użyty.

### Promocja pojedynczego konta należąca do kanału

Gdy kanał przechodzi z jednokontowej konfiguracji najwyższego poziomu do
`channels.<id>.accounts.*`, domyślne współdzielone zachowanie polega na przenoszeniu promowanych
wartości o zakresie konta do `accounts.default`.

Dołączone kanały mogą zawęzić lub nadpisać tę promocję przez swoją powierzchnię kontraktu setup:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do
  promowanego konta
- `namedAccountPromotionKeys`: gdy istnieją już nazwane konta, tylko te
  klucze są przenoszone do promowanego konta; współdzielone klucze polityki/dostarczania pozostają w katalogu root kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera, które istniejące konto
  otrzyma promowane wartości

Matrix jest obecnym dołączonym przykładem. Jeśli istnieje już dokładnie jedno nazwane konto Matrix
albo jeśli `defaultAccount` wskazuje na istniejący niekanoniczny klucz, taki jak
`Ops`, promocja zachowuje to konto zamiast tworzyć nowy wpis
`accounts.default`.

## Schemat konfiguracji

Konfiguracja Plugin jest walidowana względem schematu JSON Schema w Twoim manifeście. Użytkownicy
konfigurują Plugins przez:

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

Dla konfiguracji specyficznej dla kanału używaj zamiast tego sekcji konfiguracji kanału:

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

Użyj `buildChannelConfigSchema` z `openclaw/plugin-sdk/core`, aby przekonwertować
schemat Zod do wrappera `ChannelConfigSchema`, który waliduje OpenClaw:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Kreatory konfiguracji

Plugins kanałów mogą dostarczać interaktywne kreatory konfiguracji dla `openclaw onboard`.
Kreator to obiekt `ChannelSetupWizard` na `ChannelPlugin`:

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

Typ `ChannelSetupWizard` obsługuje `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i więcej.
Pełne przykłady znajdziesz w pakietach dołączonych Plugin (na przykład wtyczka Discord `src/channel.setup.ts`).

Dla promptów allowlisty DM, które potrzebują tylko standardowego
przepływu `note -> prompt -> parse -> merge -> patch`, preferuj współdzielone helpery setup
z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` oraz
`createNestedChannelParsedAllowFromPrompt(...)`.

Dla bloków statusu setup kanału, które różnią się tylko etykietami, ocenami i opcjonalnymi
dodatkowymi liniami, preferuj `createStandardChannelSetupStatus(...)` z
`openclaw/plugin-sdk/setup` zamiast ręcznie budować ten sam obiekt `status` w
każdym Plugin.

Dla opcjonalnych powierzchni setup, które powinny pojawiać się tylko w określonych kontekstach, użyj
`createOptionalChannelSetupSurface` z `openclaw/plugin-sdk/channel-setup`:

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

`plugin-sdk/channel-setup` udostępnia też niższopoziomowe
buildry `createOptionalChannelSetupAdapter(...)` i
`createOptionalChannelSetupWizard(...)`, gdy potrzebujesz tylko jednej połowy
tej opcjonalnej powierzchni instalacji.

Wygenerowany opcjonalny adapter/kreator kończy się bezpieczną odmową przy rzeczywistych zapisach konfiguracji. Ponownie używają jednego komunikatu „wymagana instalacja”
w `validateInput`,
`applyAccountConfig` i `finalize`, a gdy ustawiono `docsPath`, dołączają link do dokumentacji.

Dla interfejsów setup opartych na binariach preferuj współdzielone helpery delegowane zamiast
kopiowania tego samego glue binariów/statusu do każdego kanału:

- `createDetectedBinaryStatus(...)` dla bloków statusu, które różnią się tylko etykietami,
  wskazówkami, ocenami i wykrywaniem binariów
- `createCliPathTextInput(...)` dla wejść tekstowych opartych na ścieżce
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` oraz
  `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazywać do cięższego pełnego kreatora
- `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi tylko
  delegować decyzję `textInputs[*].shouldPrompt`

## Publikowanie i instalowanie

**Plugins zewnętrzne:** opublikuj w [ClawHub](/pl/tools/clawhub) lub npm, a następnie zainstaluj:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw najpierw próbuje ClawHub, a potem automatycznie wraca do npm. Możesz też
jawnie wymusić ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

Nie ma odpowiadającego temu nadpisania `npm:`. Użyj zwykłej specyfikacji pakietu npm, gdy
chcesz ścieżkę npm po awaryjnym powrocie z ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins w repo:** umieść je w drzewie obszaru roboczego dołączonych Plugin i będą automatycznie
wykrywane podczas build.

**Użytkownicy mogą instalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Dla instalacji pochodzących z npm `openclaw plugins install` uruchamia
  `npm install --ignore-scripts` (bez skryptów cyklu życia). Utrzymuj drzewa zależności Plugin
  jako czyste JS/TS i unikaj pakietów wymagających buildów `postinstall`.
</Info>

Dołączone Plugins należące do OpenClaw są jedynym wyjątkiem naprawczym podczas startupu: gdy
spakowana instalacja zobaczy jeden z nich włączony przez konfigurację pluginu, starszą konfigurację kanału lub
dołączony manifest domyślnie-włączony, startup zainstaluje brakujące zależności runtime tego Plugin przed importem. Plugins stron trzecich nie powinny polegać na instalacji podczas startupu; nadal używaj jawnego instalatora Plugin.

## Powiązane

- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) -- `definePluginEntry` i `defineChannelPluginEntry`
- [Manifest Plugin](/pl/plugins/manifest) -- pełna dokumentacja schematu manifestu
- [Budowanie Plugin](/pl/plugins/building-plugins) -- przewodnik krok po kroku na start
