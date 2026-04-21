---
read_when:
    - Dodajesz kreator konfiguracji do Plugin
    - Musisz zrozumieć różnicę między `setup-entry.ts` a `index.ts`
    - Definiujesz schematy konfiguracji Plugin lub metadane openclaw w `package.json`
sidebarTitle: Setup and Config
summary: Kreatory konfiguracji, `setup-entry.ts`, schematy konfiguracji i metadane `package.json`
title: Konfiguracja Plugin i konfiguracja
x-i18n:
    generated_at: "2026-04-21T09:59:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Konfiguracja Plugin i konfiguracja

Dokumentacja referencyjna pakowania Plugin (`package.json` metadata), manifestów
(`openclaw.plugin.json`), wpisów konfiguracji i schematów konfiguracji.

<Tip>
  **Szukasz przewodnika krok po kroku?** Przewodniki how-to omawiają pakowanie w kontekście:
  [Plugin kanałów](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) oraz
  [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Twój `package.json` potrzebuje pola `openclaw`, które mówi systemowi Plugin, co
udostępnia twój Plugin:

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

**Plugin dostawcy / baza publikacji ClawHub:**

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

Jeśli publikujesz Plugin zewnętrznie na ClawHub, pola `compat` i `build`
są wymagane. Kanoniczne snippety publikacji znajdują się w
`docs/snippets/plugin-publish/`.

### Pola `openclaw`

| Pole         | Typ        | Opis                                                                                                   |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Pliki entrypointów (względem katalogu głównego pakietu)                                                |
| `setupEntry` | `string`   | Lekki wpis tylko do konfiguracji (opcjonalny)                                                          |
| `channel`    | `object`   | Metadane katalogu kanału dla konfiguracji, selektora, quickstartu i powierzchni statusu               |
| `providers`  | `string[]` | Id dostawców rejestrowanych przez ten Plugin                                                           |
| `install`    | `object`   | Wskazówki instalacji: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flagi zachowania przy uruchomieniu                                                                     |

### `openclaw.channel`

`openclaw.channel` to lekkie metadane pakietu do odkrywania kanałów i powierzchni
konfiguracji przed załadowaniem runtime.

| Pole                                   | Typ        | Co oznacza                                                                    |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanoniczne id kanału.                                                         |
| `label`                                | `string`   | Główna etykieta kanału.                                                       |
| `selectionLabel`                       | `string`   | Etykieta selektora/konfiguracji, gdy powinna różnić się od `label`.           |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółów dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków konfiguracji i wyboru.                        |
| `docsLabel`                            | `string`   | Nadpisanie etykiety używanej dla linków do dokumentacji, gdy powinna różnić się od id kanału. |
| `blurb`                                | `string`   | Krótki opis onboardingowy/katalogowy.                                         |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                    |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania do wyboru kanału.                               |
| `preferOver`                           | `string[]` | Id Plugin/kanałów o niższym priorytecie, które ten kanał powinien wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/system image dla katalogów UI kanałów.                 |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami do dokumentacji na powierzchniach wyboru.        |
| `selectionDocsOmitLabel`               | `boolean`  | Pokazuje ścieżkę dokumentacji bezpośrednio zamiast linku z etykietą w treści wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane do treści wyboru.                           |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wychodzącym. |
| `exposure`                             | `object`   | Kontrole widoczności kanału dla konfiguracji, list skonfigurowanych i powierzchni dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu konfiguracji `allowFrom` w quickstarcie. |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto.  |
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

- `configured`: uwzględnij kanał na powierzchniach list skonfigurowanych/w stylu statusu
- `setup`: uwzględnij kanał w interaktywnych selektorach konfiguracji
- `docs`: oznacz kanał jako widoczny publicznie na powierzchniach dokumentacji/nawigacji

`showConfigured` i `showInSetup` nadal są obsługiwane jako starsze aliasy. Preferuj
`exposure`.

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie metadane manifestu.

| Pole                         | Typ                  | Co oznacza                                                                       |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanoniczna specyfikacja npm dla przepływów instalacji/aktualizacji.              |
| `localPath`                  | `string`             | Lokalna ścieżka instalacji developerskiej lub wbudowanej.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy dostępne są oba.                              |
| `minHostVersion`             | `string`             | Minimalna obsługiwana wersja OpenClaw w postaci `>=x.y.z`.                       |
| `allowInvalidConfigRecovery` | `boolean`            | Pozwala przepływom ponownej instalacji wbudowanego Plugin odzyskiwać się po określonych błędach starej konfiguracji. |

Jeśli ustawiono `minHostVersion`, wymuszają je zarówno instalacja, jak i ładowanie
rejestru manifestów. Starsze hosty pomijają Plugin; nieprawidłowe stringi wersji są odrzucane.

`allowInvalidConfigRecovery` nie jest ogólnym obejściem dla uszkodzonych konfiguracji. Służy
wyłącznie do wąskiego odzyskiwania wbudowanych Plugin, tak aby ponowna instalacja/konfiguracja mogła naprawić znane pozostałości po aktualizacji, takie jak brakująca ścieżka wbudowanego Plugin lub nieaktualny wpis `channels.<id>`
dla tego samego Plugin. Jeśli konfiguracja jest uszkodzona z niezwiązanych powodów, instalacja
nadal kończy się bezpiecznym niepowodzeniem i informuje operatora, aby uruchomił `openclaw doctor --fix`.

### Odroczone pełne ładowanie

Plugin kanałów mogą włączyć odroczone ładowanie przez:

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

Gdy ta opcja jest włączona, OpenClaw ładuje tylko `setupEntry` podczas fazy uruchamiania
przed `listen`, nawet dla już skonfigurowanych kanałów. Pełny entry ładuje się po tym,
jak gateway zacznie nasłuchiwać.

<Warning>
  Włączaj odroczone ładowanie tylko wtedy, gdy twoje `setupEntry` rejestruje wszystko, czego
  gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestracja kanału, trasy HTTP,
  metody gateway). Jeśli pełny entry jest właścicielem wymaganych możliwości przy uruchamianiu, pozostaw
  zachowanie domyślne.
</Warning>

Jeśli twój wpis setup/full rejestruje metody RPC gateway, zachowaj je pod
prefiksem specyficznym dla Plugin. Zastrzeżone przestrzenie nazw administracyjnych core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością core i zawsze rozwiązują się
do `operator.admin`.

## Manifest Plugin

Każdy natywny Plugin musi dostarczać `openclaw.plugin.json` w katalogu głównym pakietu.
OpenClaw używa go do walidacji konfiguracji bez wykonywania kodu Plugin.

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

Nawet Plugin bez konfiguracji muszą dostarczać schemat. Pusty schemat jest poprawny:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Zobacz [Manifest Plugin](/pl/plugins/manifest), aby poznać pełną dokumentację referencyjną schematu.

## Publikowanie w ClawHub

Dla pakietów Plugin używaj polecenia ClawHub specyficznego dla pakietów:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Starszy alias publikacji tylko dla skill dotyczy Skills. Pakiety Plugin powinny
zawsze używać `clawhub package publish`.

## Wpis konfiguracji

Plik `setup-entry.ts` to lekka alternatywa dla `index.ts`, którą
OpenClaw ładuje wtedy, gdy potrzebuje tylko powierzchni konfiguracji (onboarding, naprawa konfiguracji,
inspekcja wyłączonego kanału).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu runtime (biblioteki kryptograficzne, rejestracje CLI,
usługi w tle) podczas przepływów konfiguracji.

Wbudowane kanały workspace, które przechowują eksporty bezpieczne dla konfiguracji w modułach sidecar, mogą
używać `defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract` zamiast
`defineSetupPluginEntry(...)`. Ten kontrakt wbudowany obsługuje też opcjonalny
eksport `runtime`, dzięki czemu okablowanie runtime podczas konfiguracji może pozostać lekkie i jawne.

**Kiedy OpenClaw używa `setupEntry` zamiast pełnego entry:**

- Kanał jest wyłączony, ale potrzebuje powierzchni konfiguracji/onboardingu
- Kanał jest włączony, ale nieskonfigurowany
- Włączone jest odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Co `setupEntry` musi rejestrować:**

- Obiekt Plugin kanału (przez `defineSetupPluginEntry`)
- Wszelkie trasy HTTP wymagane przed `gateway listen`
- Wszelkie metody gateway potrzebne podczas uruchamiania

Te metody gateway uruchamiane podczas startu nadal powinny unikać zastrzeżonych przestrzeni nazw administracyjnych core,
takich jak `config.*` czy `update.*`.

**Czego `setupEntry` NIE powinno zawierać:**

- Rejestracje CLI
- Usługi w tle
- Ciężkie importy runtime (crypto, SDK)
- Metody gateway potrzebne dopiero po uruchomieniu

### Wąskie importy helperów konfiguracji

Dla gorących ścieżek tylko do konfiguracji preferuj wąskie warstwy helperów konfiguracji zamiast szerszej
warstwy `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                   | Używaj do                                                                                | Kluczowe eksporty                                                                                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | helpery runtime czasu konfiguracji, które pozostają dostępne w `setupEntry` / odroczonym starcie kanału | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptery konfiguracji konta świadome środowiska                                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`          | helpery CLI/archiwów/dokumentacji dla konfiguracji/instalacji                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Używaj szerszej warstwy `plugin-sdk/setup`, gdy potrzebujesz pełnego współdzielonego
zestawu narzędzi konfiguracji, w tym helperów łatania konfiguracji, takich jak
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptery łatania konfiguracji pozostają bezpieczne do importu na gorącej ścieżce. Ich wbudowane
wyszukiwanie powierzchni kontraktu promocji pojedynczego konta jest leniwe, więc import
`plugin-sdk/setup-runtime` nie ładuje eagerowo odkrywania powierzchni kontraktu wbudowanego przed rzeczywistym użyciem adaptera.

### Promocja pojedynczego konta należąca do kanału

Gdy kanał przechodzi z konfiguracji najwyższego poziomu dla pojedynczego konta na
`channels.<id>.accounts.*`, domyślne współdzielone zachowanie polega na przenoszeniu promowanych
wartości o zakresie konta do `accounts.default`.

Wbudowane kanały mogą zawężać lub nadpisywać tę promocję przez swoją powierzchnię
kontraktu konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do
  promowanego konta
- `namedAccountPromotionKeys`: gdy nazwane konta już istnieją, tylko te
  klucze są przenoszone do promowanego konta; współdzielone klucze policy/delivery pozostają
  w katalogu głównym kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera, które istniejące konto
  otrzymuje promowane wartości

Matrix to obecnie przykład wbudowany. Jeśli istnieje dokładnie jedno nazwane konto Matrix
albo `defaultAccount` wskazuje istniejący niekanoniczny klucz,
taki jak `Ops`, promocja zachowuje to konto zamiast tworzyć nowy
wpis `accounts.default`.

## Schemat konfiguracji

Konfiguracja Plugin jest walidowana względem JSON Schema w twoim manifeście. Użytkownicy
konfigurują Plugin przez:

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

Użyj `buildChannelConfigSchema` z `openclaw/plugin-sdk/core`, aby przekształcić
schemat Zod w opakowanie `ChannelConfigSchema`, które OpenClaw waliduje:

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

Plugin kanałów mogą udostępniać interaktywne kreatory konfiguracji dla `openclaw onboard`.
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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i inne.
Pełne przykłady znajdziesz w pakietach wbudowanych Plugin (na przykład w Discord plugin `src/channel.setup.ts`).

Dla promptów allowlist DM, które potrzebują tylko standardowego
przepływu `note -> prompt -> parse -> merge -> patch`, preferuj współdzielone helpery konfiguracji
z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` oraz
`createNestedChannelParsedAllowFromPrompt(...)`.

Dla bloków statusu konfiguracji kanału, które różnią się tylko etykietami, ocenami i opcjonalnymi
dodatkowymi liniami, preferuj `createStandardChannelSetupStatus(...)` z
`openclaw/plugin-sdk/setup` zamiast ręcznego tworzenia tego samego obiektu `status` w
każdym Plugin.

Dla opcjonalnych powierzchni konfiguracji, które powinny pojawiać się tylko w określonych kontekstach, użyj
`createOptionalChannelSetupSurface` z `openclaw/plugin-sdk/channel-setup`:

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

`plugin-sdk/channel-setup` udostępnia też niższopoziomowe konstruktory
`createOptionalChannelSetupAdapter(...)` i
`createOptionalChannelSetupWizard(...)`, gdy potrzebujesz tylko jednej połowy
tej opcjonalnej powierzchni instalacji.

Wygenerowany opcjonalny adapter/kreator kończy działanie bezpiecznym niepowodzeniem przy rzeczywistych zapisach konfiguracji. Ponownie używają
jednego komunikatu o wymaganej instalacji w `validateInput`,
`applyAccountConfig` i `finalize`, a gdy ustawiono `docsPath`,
dołączają link do dokumentacji.

Dla UI konfiguracji opartych na binariach preferuj współdzielone helpery delegowane zamiast
kopiowania tego samego kleju binarnego/statusu do każdego kanału:

- `createDetectedBinaryStatus(...)` dla bloków statusu, które różnią się tylko etykietami,
  wskazówkami, ocenami i wykrywaniem binariów
- `createCliPathTextInput(...)` dla wejść tekstowych opartych na ścieżce
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` oraz
  `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazywać dalej do
  cięższego pełnego kreatora
- `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi tylko
  delegować decyzję `textInputs[*].shouldPrompt`

## Publikowanie i instalowanie

**Plugin zewnętrzne:** publikuj na [ClawHub](/pl/tools/clawhub) lub npm, a następnie instaluj:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw najpierw próbuje ClawHub, a następnie automatycznie przechodzi do npm. Możesz też
jawnie wymusić ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # tylko ClawHub
```

Nie istnieje odpowiadające temu nadpisanie `npm:`. Używaj normalnej specyfikacji pakietu npm, gdy
chcesz ścieżki npm po fallbacku z ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin w repo:** umieść je w drzewie obszaru roboczego wbudowanych Plugin, a będą automatycznie
wykrywane podczas builda.

**Użytkownicy mogą instalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Dla instalacji pochodzących z npm `openclaw plugins install` uruchamia
  `npm install --ignore-scripts` (bez skryptów lifecycle). Utrzymuj drzewa zależności Plugin
  jako czyste JS/TS i unikaj pakietów wymagających buildów `postinstall`.
</Info>

Wbudowane Plugin należące do OpenClaw to jedyny wyjątek dotyczący naprawy przy uruchomieniu: gdy
spakowana instalacja widzi taki Plugin włączony przez konfigurację Plugin, starszą konfigurację kanału lub
jego wbudowany domyślnie włączony manifest, uruchomienie instaluje brakujące zależności runtime tego Plugin przed importem. Plugin zewnętrzne nie powinny polegać na
instalacji przy uruchomieniu; nadal używaj jawnego instalatora Plugin.

## Powiązane

- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) -- `definePluginEntry` i `defineChannelPluginEntry`
- [Manifest Plugin](/pl/plugins/manifest) -- pełna dokumentacja referencyjna schematu manifestu
- [Budowanie Plugin](/pl/plugins/building-plugins) -- przewodnik krok po kroku na start
