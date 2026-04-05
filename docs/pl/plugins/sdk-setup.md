---
read_when:
    - Dodajesz kreator konfiguracji do pluginu
    - Musisz zrozumieć różnicę między setup-entry.ts a index.ts
    - Definiujesz schematy konfiguracji pluginu lub metadane openclaw w package.json
sidebarTitle: Setup and Config
summary: Kreatory konfiguracji, setup-entry.ts, schematy konfiguracji i metadane package.json
title: Konfiguracja i ustawienia pluginu
x-i18n:
    generated_at: "2026-04-05T14:03:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68fda27be1c89ea6ba906833113e9190ddd0ab358eb024262fb806746d54f7bf
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Konfiguracja i ustawienia pluginu

Odniesienie do pakowania pluginów (metadane `package.json`), manifestów
(`openclaw.plugin.json`), wpisów konfiguracji i schematów konfiguracji.

<Tip>
  **Szukasz przewodnika krok po kroku?** Przewodniki opisują pakowanie w odpowiednim kontekście:
  [Pluginy kanałów](/plugins/sdk-channel-plugins#step-1-package-and-manifest) i
  [Pluginy dostawców](/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Twój `package.json` musi zawierać pole `openclaw`, które informuje system pluginów,
co udostępnia twój plugin:

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

**Plugin dostawcy / bazowy publikowany pakiet ClawHub:**

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

Jeśli publikujesz plugin zewnętrznie w ClawHub, pola `compat` i `build`
są wymagane. Kanoniczne fragmenty publikacji znajdują się w
`docs/snippets/plugin-publish/`.

### Pola `openclaw`

| Pole         | Typ        | Opis                                                                                                   |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Pliki punktów wejścia (względem katalogu głównego pakietu)                                             |
| `setupEntry` | `string`   | Lekki wpis tylko do konfiguracji (opcjonalny)                                                          |
| `channel`    | `object`   | Metadane katalogu kanałów dla konfiguracji, selektora, szybkiego startu i powierzchni statusu         |
| `providers`  | `string[]` | Identyfikatory dostawców rejestrowanych przez ten plugin                                                |
| `install`    | `object`   | Wskazówki instalacji: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flagi zachowania przy uruchamianiu                                                                      |

### `openclaw.channel`

`openclaw.channel` to lekkie metadane pakietu dla wykrywania kanałów i powierzchni
konfiguracji przed załadowaniem środowiska uruchomieniowego.

| Pole                                   | Typ        | Znaczenie                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                              |
| `label`                                | `string`   | Główna etykieta kanału.                                                       |
| `selectionLabel`                       | `string`   | Etykieta selektora/konfiguracji, gdy powinna różnić się od `label`.           |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółów dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków konfiguracji i wyboru.                        |
| `docsLabel`                            | `string`   | Nadpisuje etykietę używaną dla linków do dokumentacji, gdy powinna różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis onboardingu/katalogu.                                             |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                    |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania dla wyboru kanału.                              |
| `preferOver`                           | `string[]` | Identyfikatory pluginów/kanałów o niższym priorytecie, które ten kanał powinien wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/systemImage dla katalogów UI kanałów.                  |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami do dokumentacji na powierzchniach wyboru.        |
| `selectionDocsOmitLabel`               | `boolean`  | Pokazuje bezpośrednio ścieżkę dokumentacji zamiast oznaczonego linku do dokumentacji w tekście wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane w tekście wyboru.                           |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wyjściowym. |
| `showConfigured`                       | `boolean`  | Określa, czy powierzchnie listy skonfigurowanych kanałów mają pokazywać ten kanał. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu konfiguracji `allowFrom` w szybkim starcie. |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto.  |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferuje wyszukiwanie sesji przy rozstrzyganiu celów ogłoszeń dla tego kanału. |

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
      "quickstartAllowFrom": true
    }
  }
}
```

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie manifestu.

| Pole                         | Typ                  | Znaczenie                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanoniczna specyfikacja npm dla przepływów instalacji/aktualizacji.              |
| `localPath`                  | `string`             | Lokalna ścieżka instalacji deweloperskiej lub dołączonej.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy oba są dostępne.                              |
| `minHostVersion`             | `string`             | Minimalna obsługiwana wersja OpenClaw w postaci `>=x.y.z`.                       |
| `allowInvalidConfigRecovery` | `boolean`            | Pozwala przepływom ponownej instalacji dołączonych pluginów odzyskać działanie po określonych błędach nieaktualnej konfiguracji. |

Jeśli ustawiono `minHostVersion`, zarówno instalacja, jak i ładowanie rejestru manifestów
egzekwują to ograniczenie. Starsze hosty pomijają plugin; nieprawidłowe ciągi wersji są odrzucane.

`allowInvalidConfigRecovery` nie jest ogólnym obejściem dla uszkodzonych konfiguracji. Służy
wyłącznie do wąskiego odzyskiwania dla dołączonych pluginów, tak aby ponowna instalacja/konfiguracja mogła naprawić
znane pozostałości po aktualizacji, takie jak brakująca ścieżka dołączonego pluginu lub nieaktualny wpis `channels.<id>`
dla tego samego pluginu. Jeśli konfiguracja jest uszkodzona z innych powodów, instalacja
nadal kończy się bezpieczną odmową i informuje operatora o konieczności uruchomienia `openclaw doctor --fix`.

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

Po włączeniu OpenClaw ładuje tylko `setupEntry` podczas fazy uruchamiania przed
nasłuchem, nawet dla już skonfigurowanych kanałów. Pełny wpis jest ładowany po
rozpoczęciu nasłuchiwania przez gateway.

<Warning>
  Włączaj odroczone ładowanie tylko wtedy, gdy `setupEntry` rejestruje wszystko,
  czego gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestracja kanału, ścieżki HTTP,
  metody gateway). Jeśli pełny wpis odpowiada za wymagane możliwości uruchamiania, zachowaj
  domyślne zachowanie.
</Warning>

Jeśli twój wpis konfiguracji/pełny wpis rejestruje metody RPC gateway, utrzymuj je
pod prefiksem specyficznym dla pluginu. Zarezerwowane przestrzenie nazw administracyjnych rdzenia (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością rdzenia i zawsze są rozstrzygane
do `operator.admin`.

## Manifest pluginu

Każdy natywny plugin musi dostarczać `openclaw.plugin.json` w katalogu głównym pakietu.
OpenClaw używa go do walidacji konfiguracji bez wykonywania kodu pluginu.

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

Pełne odniesienie do schematu znajdziesz w [Manifeście pluginu](/plugins/manifest).

## Publikowanie w ClawHub

W przypadku pakietów pluginów używaj polecenia ClawHub specyficznego dla pakietów:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Starszy alias publikacji tylko dla Skills jest przeznaczony dla Skills. Pakiety pluginów powinny
zawsze używać `clawhub package publish`.

## Wpis konfiguracji

Plik `setup-entry.ts` to lekka alternatywa dla `index.ts`, którą
OpenClaw ładuje, gdy potrzebuje tylko powierzchni konfiguracji (onboarding, naprawa konfiguracji,
inspekcja wyłączonych kanałów).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu środowiska uruchomieniowego (bibliotek kryptograficznych, rejestracji CLI,
usług działających w tle) podczas przepływów konfiguracji.

**Kiedy OpenClaw używa `setupEntry` zamiast pełnego wpisu:**

- Kanał jest wyłączony, ale potrzebuje powierzchni konfiguracji/onboardingu
- Kanał jest włączony, ale nieskonfigurowany
- Włączono odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Co `setupEntry` musi rejestrować:**

- Obiekt pluginu kanału (przez `defineSetupPluginEntry`)
- Wszelkie ścieżki HTTP wymagane przed nasłuchem gateway
- Wszelkie metody gateway potrzebne podczas uruchamiania

Te metody gateway uruchamiane przy starcie również powinny unikać zarezerwowanych przestrzeni nazw
administracyjnych rdzenia, takich jak `config.*` czy `update.*`.

**Czego `setupEntry` NIE powinien zawierać:**

- Rejestracji CLI
- Usług działających w tle
- Ciężkich importów środowiska uruchomieniowego (crypto, SDK)
- Metod gateway potrzebnych dopiero po uruchomieniu

### Wąskie importy pomocników konfiguracji

W gorących ścieżkach tylko do konfiguracji preferuj węższe punkty dostępu do pomocników konfiguracji zamiast szerszego
parasola `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                     | Użycie                                                                                   | Kluczowe eksporty                                                                                                                                                                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | pomocniki środowiska uruchomieniowego używane w czasie konfiguracji, dostępne w `setupEntry` / przy odroczonym uruchamianiu kanału | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | zależne od środowiska adaptery konfiguracji konta                                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`            | pomocniki CLI/archiwów/dokumentacji dla konfiguracji i instalacji                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                             |

Użyj szerszego punktu dostępu `plugin-sdk/setup`, jeśli chcesz pełny współdzielony
zestaw narzędzi konfiguracji, w tym pomocniki do łatania konfiguracji, takie jak
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptery poprawek konfiguracji pozostają bezpieczne dla gorących ścieżek przy imporcie. Ich dołączone
leniwe wyszukiwanie powierzchni kontraktu dla promowania pojedynczego konta jest wykonywane leniwie, więc import
`plugin-sdk/setup-runtime` nie powoduje natychmiastowego ładowania wykrywania powierzchni kontraktów dołączonych,
zanim adapter zostanie faktycznie użyty.

### Promowanie pojedynczego konta należącego do kanału

Gdy kanał jest aktualizowany z konfiguracji najwyższego poziomu dla jednego konta do
`channels.<id>.accounts.*`, domyślnym współdzielonym zachowaniem jest przeniesienie promowanych
wartości w zakresie konta do `accounts.default`.

Dołączone kanały mogą zawęzić lub nadpisać to promowanie przez swoją powierzchnię kontraktu
konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do
  promowanego konta
- `namedAccountPromotionKeys`: gdy istnieją już nazwane konta, tylko te
  klucze są przenoszone do promowanego konta; współdzielone klucze polityk/dostarczania pozostają w katalogu głównym
  kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera, które istniejące konto
  otrzyma promowane wartości

Matrix jest obecnie dołączonym przykładem. Jeśli istnieje już dokładnie jedno nazwane konto Matrix
albo jeśli `defaultAccount` wskazuje na istniejący niekanoniczny klucz, taki jak
`Ops`, promowanie zachowuje to konto zamiast tworzyć nowy wpis
`accounts.default`.

## Schemat konfiguracji

Konfiguracja pluginu jest walidowana względem schematu JSON w manifeście. Użytkownicy
konfigurują pluginy przez:

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

Twój plugin otrzymuje tę konfigurację jako `api.pluginConfig` podczas rejestracji.

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

### Tworzenie schematów konfiguracji kanału

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

Pluginy kanałów mogą udostępniać interaktywne kreatory konfiguracji dla `openclaw onboard`.
Kreator to obiekt `ChannelSetupWizard` w `ChannelPlugin`:

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
Pełne przykłady znajdziesz w dołączonych pakietach pluginów (na przykład w pluginie Discord `src/channel.setup.ts`).

W przypadku monitów listy dozwolonych DM, które wymagają tylko standardowego przepływu
`note -> prompt -> parse -> merge -> patch`, preferuj współdzielone pomocniki konfiguracji
z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` i
`createNestedChannelParsedAllowFromPrompt(...)`.

W przypadku bloków statusu konfiguracji kanału, które różnią się tylko etykietami, wynikami i opcjonalnymi
dodatkowymi wierszami, preferuj `createStandardChannelSetupStatus(...)` z
`openclaw/plugin-sdk/setup` zamiast ręcznie tworzyć ten sam obiekt `status` w
każdym pluginie.

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

`plugin-sdk/channel-setup` udostępnia także niższego poziomu konstruktory
`createOptionalChannelSetupAdapter(...)` i
`createOptionalChannelSetupWizard(...)`, gdy potrzebujesz tylko jednej połowy
tej opcjonalnej powierzchni instalacji.

Wygenerowany opcjonalny adapter/kreator bezpiecznie odmawia przy rzeczywistych zapisach konfiguracji. Używa
jednego komunikatu o wymaganej instalacji ponownie w `validateInput`,
`applyAccountConfig` i `finalize`, a po ustawieniu `docsPath` dołącza link do dokumentacji.

W przypadku interfejsów konfiguracji opartych na binarkach preferuj współdzielone delegowane pomocniki zamiast
kopiowania tej samej logiki binarki/statusu do każdego kanału:

- `createDetectedBinaryStatus(...)` dla bloków statusu, które różnią się tylko etykietami,
  wskazówkami, wynikami i wykrywaniem binarki
- `createCliPathTextInput(...)` dla pól tekstowych opartych na ścieżce
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` i
  `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazać obsługę do cięższego pełnego kreatora
- `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi tylko
  delegować decyzję `textInputs[*].shouldPrompt`

## Publikowanie i instalacja

**Pluginy zewnętrzne:** opublikuj w [ClawHub](/tools/clawhub) lub npm, a następnie zainstaluj:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw najpierw próbuje ClawHub i automatycznie przechodzi do npm. Możesz też jawnie
wymusić ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # tylko ClawHub
```

Nie ma odpowiadającego nadpisania `npm:`. Użyj zwykłej specyfikacji pakietu npm, gdy
chcesz użyć ścieżki npm po fallbacku ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Pluginy w repozytorium:** umieść je w drzewie przestrzeni roboczej dołączonych pluginów, a będą automatycznie
wykrywane podczas budowania.

**Użytkownicy mogą instalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Dla instalacji pochodzących z npm `openclaw plugins install` uruchamia
  `npm install --ignore-scripts` (bez skryptów cyklu życia). Utrzymuj drzewa zależności pluginów jako
  czyste JS/TS i unikaj pakietów wymagających buildów `postinstall`.
</Info>

## Powiązane

- [Punkty wejścia SDK](/plugins/sdk-entrypoints) -- `definePluginEntry` i `defineChannelPluginEntry`
- [Manifest pluginu](/plugins/manifest) -- pełne odniesienie do schematu manifestu
- [Tworzenie pluginów](/plugins/building-plugins) -- przewodnik krok po kroku
