---
read_when:
    - Dodajesz kreator konfiguracji do Plugin
    - Musisz zrozumieć różnicę między setup-entry.ts a index.ts
    - Definiujesz schematy konfiguracji Pluginu lub metadane openclaw w package.json
sidebarTitle: Setup and config
summary: Kreatory konfiguracji, setup-entry.ts, schematy konfiguracji i metadane package.json
title: Konfiguracja i ustawienia Plugin
x-i18n:
    generated_at: "2026-06-27T18:07:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Dokumentacja referencyjna pakowania pluginów (metadane `package.json`), manifestów (`openclaw.plugin.json`), wpisów konfiguracji początkowej i schematów konfiguracji.

<Tip>
**Szukasz przewodnika krok po kroku?** Poradniki omawiają pakowanie w kontekście: [Pluginy kanałów](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) i [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Twój `package.json` potrzebuje pola `openclaw`, które informuje system pluginów, co zapewnia Twój plugin:

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
  Lekki wpis tylko do konfiguracji początkowej (opcjonalny).
</ParamField>
<ParamField path="channel" type="object">
  Metadane katalogowe kanału dla powierzchni konfiguracji początkowej, selektora, szybkiego startu i statusu.
</ParamField>
<ParamField path="providers" type="string[]">
  Identyfikatory dostawców rejestrowane przez ten plugin.
</ParamField>
<ParamField path="install" type="object">
  Wskazówki instalacji: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flagi zachowania przy uruchamianiu.
</ParamField>

### `openclaw.channel`

`openclaw.channel` to lekkie metadane pakietu do wykrywania kanałów i powierzchni konfiguracji początkowej przed załadowaniem środowiska uruchomieniowego.

| Pole                                   | Typ        | Znaczenie                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                              |
| `label`                                | `string`   | Główna etykieta kanału.                                                       |
| `selectionLabel`                       | `string`   | Etykieta selektora/konfiguracji początkowej, gdy powinna różnić się od `label`. |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółowa dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków konfiguracji początkowej i wyboru.            |
| `docsLabel`                            | `string`   | Zastępcza etykieta używana dla linków dokumentacji, gdy powinna różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis do onboardingu/katalogu.                                          |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                    |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania przy wyborze kanału.                            |
| `preferOver`                           | `string[]` | Identyfikatory pluginów/kanałów o niższym priorytecie, nad którymi ten kanał powinien mieć pierwszeństwo. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/obrazu systemowego dla katalogów UI kanałów.           |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami dokumentacji w powierzchniach wyboru.            |
| `selectionDocsOmitLabel`               | `boolean`  | Pokazuj bezpośrednio ścieżkę dokumentacji zamiast etykietowanego linku dokumentacji w tekście wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane w tekście wyboru.                           |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wychodzącym. |
| `exposure`                             | `object`   | Kontrolki widoczności kanału dla konfiguracji początkowej, list skonfigurowanych i powierzchni dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu konfiguracji początkowej szybkiego startu `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto.  |
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

- `configured`: uwzględnij kanał w powierzchniach list skonfigurowanych/statusowych
- `setup`: uwzględnij kanał w interaktywnych selektorach konfiguracji początkowej/konfiguracji
- `docs`: oznacz kanał jako publiczny w powierzchniach dokumentacji/nawigacji

<Note>
`showConfigured` i `showInSetup` pozostają obsługiwane jako starsze aliasy. Preferuj `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie metadane manifestu.

| Pole                         | Typ                                 | Znaczenie                                                                     |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kanoniczna specyfikacja ClawHub dla instalacji/aktualizacji i przepływów instalacji na żądanie podczas onboardingu. |
| `npmSpec`                    | `string`                            | Kanoniczna specyfikacja npm dla awaryjnych przepływów instalacji/aktualizacji. |
| `localPath`                  | `string`                            | Lokalna ścieżka deweloperska lub dołączona ścieżka instalacji.                |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy dostępnych jest wiele źródeł.              |
| `minHostVersion`             | `string`                            | Minimalna obsługiwana wersja OpenClaw w formie `>=x.y.z` lub `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Oczekiwany ciąg integralności dystrybucji npm, zwykle `sha512-...`, dla przypiętych instalacji. |
| `allowInvalidConfigRecovery` | `boolean`                           | Pozwala przepływom ponownej instalacji dołączonego pluginu odzyskać działanie po określonych awariach związanych z nieaktualną konfiguracją. |
| `requiredPlatformPackages`   | `string[]`                          | Wymagane aliasy npm specyficzne dla platformy, weryfikowane podczas instalacji npm. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interaktywny onboarding również używa `openclaw.install` dla powierzchni instalacji na żądanie. Jeśli Twój plugin udostępnia wybory uwierzytelniania dostawcy albo metadane konfiguracji początkowej/katalogu kanału przed załadowaniem środowiska uruchomieniowego, onboarding może pokazać ten wybór, poprosić o instalację z ClawHub, npm lub lokalną, zainstalować albo włączyć plugin, a następnie kontynuować wybrany przepływ. Wybory onboardingu ClawHub używają `clawhubSpec` i są preferowane, gdy są obecne; wybory npm wymagają zaufanych metadanych katalogu ze specyfikacją rejestru `npmSpec`; dokładne wersje i `expectedIntegrity` są opcjonalnymi przypięciami npm. Jeśli `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji egzekwują je dla npm. Przechowuj metadane „co pokazać” w `openclaw.plugin.json`, a metadane „jak to zainstalować” w `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Jeśli ustawiono `minHostVersion`, egzekwują je zarówno instalacja, jak i ładowanie rejestru manifestów dla pluginów niedołączonych. Starsze hosty pomijają zewnętrzne pluginy; nieprawidłowe ciągi wersji są odrzucane. Dołączone pluginy źródłowe są uznawane za współwersjonowane z checkoutem hosta.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` nie jest ogólnym obejściem dla uszkodzonych konfiguracji. Służy tylko do wąskiego odzyskiwania dołączonych pluginów, aby ponowna instalacja/konfiguracja początkowa mogła naprawić znane pozostałości po aktualizacji, takie jak brakująca ścieżka dołączonego pluginu albo nieaktualny wpis `channels.<id>` dla tego samego pluginu. Jeśli konfiguracja jest uszkodzona z niezwiązanych powodów, instalacja nadal kończy się zamkniętą awarią i informuje operatora, aby uruchomił `openclaw doctor --fix`.
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

Po włączeniu OpenClaw ładuje tylko `setupEntry` podczas fazy uruchamiania przed nasłuchiwaniem, nawet dla już skonfigurowanych kanałów. Pełny wpis ładuje się po rozpoczęciu nasłuchiwania przez gateway.

<Warning>
Włączaj odroczone ładowanie tylko wtedy, gdy Twój `setupEntry` rejestruje wszystko, czego gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestrację kanału, trasy HTTP, metody gateway). Jeśli pełny wpis posiada wymagane możliwości uruchomieniowe, zachowaj zachowanie domyślne.
</Warning>

Jeśli Twój wpis konfiguracji początkowej/pełny wpis rejestruje metody RPC gateway, utrzymuj je w prefiksie specyficznym dla pluginu. Zarezerwowane przestrzenie nazw administracji rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością rdzenia i zawsze rozwiązują się do `operator.admin`.

## Manifest pluginu

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

Dla pluginów kanałów dodaj `kind` i `channels`:

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

Zobacz [manifest Plugin](/pl/plugins/manifest), aby poznać pełną referencję schematu.

## Publikowanie w ClawHub

Dla pakietów Plugin użyj polecenia ClawHub właściwego dla pakietu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Starszy alias publikowania tylko dla Skills jest przeznaczony dla Skills. Pakiety Plugin powinny zawsze używać `clawhub package publish`.
</Note>

## Punkt wejścia konfiguracji

Plik `setup-entry.ts` jest lekką alternatywą dla `index.ts`, którą OpenClaw ładuje, gdy potrzebuje tylko powierzchni konfiguracji (onboarding, naprawa konfiguracji, inspekcja wyłączonego kanału).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu środowiska uruchomieniowego (bibliotek kryptograficznych, rejestracji CLI, usług działających w tle) podczas przepływów konfiguracji.

Kanały wbudowane w workspace, które trzymają eksporty bezpieczne dla konfiguracji w modułach bocznych, mogą użyć `defineBundledChannelSetupEntry(...)` z `openclaw/plugin-sdk/channel-entry-contract` zamiast `defineSetupPluginEntry(...)`. Ten wbudowany kontrakt obsługuje także opcjonalny eksport `runtime`, dzięki czemu okablowanie środowiska uruchomieniowego w czasie konfiguracji może pozostać lekkie i jawne.

<AccordionGroup>
  <Accordion title="Kiedy OpenClaw używa setupEntry zamiast pełnego punktu wejścia">
    - Kanał jest wyłączony, ale potrzebuje powierzchni konfiguracji/onboardingu.
    - Kanał jest włączony, ale nieskonfigurowany.
    - Włączone jest odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Co setupEntry musi zarejestrować">
    - Obiekt Plugin kanału (przez `defineSetupPluginEntry`).
    - Wszystkie trasy HTTP wymagane przed nasłuchem Gateway.
    - Wszystkie metody Gateway potrzebne podczas uruchamiania.

    Te metody Gateway uruchamiania nadal powinny unikać zarezerwowanych przestrzeni nazw administracyjnych rdzenia, takich jak `config.*` lub `update.*`.

  </Accordion>
  <Accordion title="Czego setupEntry NIE powinien zawierać">
    - Rejestracji CLI.
    - Usług działających w tle.
    - Ciężkich importów środowiska uruchomieniowego (kryptografia, SDK).
    - Metod Gateway potrzebnych dopiero po uruchomieniu.

  </Accordion>
</AccordionGroup>

### Wąskie importy pomocników konfiguracji

Dla gorących ścieżek tylko do konfiguracji preferuj wąskie szwy pomocników konfiguracji zamiast szerszego parasola `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                    | Do czego używać                                                                          | Kluczowe eksporty                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | pomocniki środowiska uruchomieniowego czasu konfiguracji dostępne w `setupEntry` / odroczonym uruchamianiu kanału | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | przestarzały alias zgodności; użyj `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | pomocniki konfiguracji/instalacji CLI/archiwów/dokumentacji                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Użyj szerszego szwu `plugin-sdk/setup`, gdy chcesz skorzystać z pełnego współdzielonego zestawu narzędzi konfiguracji, w tym pomocników łatek konfiguracji, takich jak `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Użyj `createSetupTranslator(...)` dla stałych tekstów kreatora konfiguracji. Podąża za ustawieniami regionalnymi kreatora
CLI (`OPENCLAW_LOCALE`, a następnie zmiennymi ustawień regionalnych systemu) i wraca
do angielskiego. Tekst konfiguracji specyficzny dla Plugin trzymaj w kodzie należącym do Plugin i używaj
współdzielonych kluczy katalogu tylko dla wspólnych etykiet konfiguracji, tekstu statusu oraz oficjalnych
tekstów konfiguracji wbudowanych Plugin.

Adaptery łatek konfiguracji pozostają bezpieczne do importu na gorącej ścieżce. Ich wyszukiwanie powierzchni kontraktu promowania wbudowanego pojedynczego konta jest leniwe, więc importowanie `plugin-sdk/setup-runtime` nie ładuje zachłannie wykrywania wbudowanej powierzchni kontraktu, zanim adapter zostanie faktycznie użyty.

### Promowanie pojedynczego konta należące do kanału

Gdy kanał przechodzi z konfiguracji najwyższego poziomu pojedynczego konta na `channels.<id>.accounts.*`, domyślne współdzielone zachowanie przenosi promowane wartości z zakresu konta do `accounts.default`.

Kanały wbudowane mogą zawęzić lub nadpisać to promowanie przez swoją powierzchnię kontraktu konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do promowanego konta
- `namedAccountPromotionKeys`: gdy nazwane konta już istnieją, tylko te klucze są przenoszone do promowanego konta; współdzielone klucze zasad/dostarczania pozostają w katalogu głównym kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera, które istniejące konto otrzyma promowane wartości

<Note>
Matrix jest obecnym wbudowanym przykładem. Jeśli istnieje dokładnie jedno nazwane konto Matrix albo jeśli `defaultAccount` wskazuje istniejący niekanoniczny klucz, taki jak `Ops`, promowanie zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`.
</Note>

## Schemat konfiguracji

Konfiguracja Plugin jest walidowana względem JSON Schema w manifeście. Użytkownicy konfigurują Plugin przez:

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

Użyj `buildChannelConfigSchema`, aby przekonwertować schemat Zod na wrapper `ChannelConfigSchema` używany przez artefakty konfiguracji należące do Plugin:

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

Dla Plugin firm trzecich kontraktem zimnej ścieżki nadal jest manifest Plugin: odzwierciedl wygenerowany JSON Schema w `openclaw.plugin.json#channelConfigs`, aby schemat konfiguracji, konfiguracja i powierzchnie UI mogły sprawdzać `channels.<id>` bez ładowania kodu środowiska uruchomieniowego.

## Kreatory konfiguracji

Plugin kanałów mogą udostępniać interaktywne kreatory konfiguracji dla `openclaw onboard`. Kreator jest obiektem `ChannelSetupWizard` w `ChannelPlugin`:

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

Typ `ChannelSetupWizard` obsługuje `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i więcej. Pełne przykłady znajdziesz w pakietach wbudowanych Plugin (na przykład Plugin Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Współdzielone monity allowFrom">
    Dla monitów listy dozwolonych DM, które potrzebują tylko standardowego przepływu `note -> prompt -> parse -> merge -> patch`, preferuj współdzielone pomocniki konfiguracji z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` i `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardowy status konfiguracji kanału">
    Dla bloków statusu konfiguracji kanału, które różnią się tylko etykietami, wynikami i opcjonalnymi dodatkowymi wierszami, preferuj `createStandardChannelSetupStatus(...)` z `openclaw/plugin-sdk/setup` zamiast ręcznie tworzyć ten sam obiekt `status` w każdym Plugin.
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

    Wygenerowany opcjonalny adapter/kreator zamyka się bezpiecznie przy rzeczywistych zapisach konfiguracji. Ponownie używa jednego komunikatu wymaganej instalacji w `validateInput`, `applyAccountConfig` i `finalize`, a gdy ustawiono `docsPath`, dołącza link do dokumentacji.

  </Accordion>
  <Accordion title="Pomocniki konfiguracji oparte na plikach binarnych">
    Dla UI konfiguracji opartych na plikach binarnych preferuj współdzielone delegowane pomocniki zamiast kopiować ten sam klej binarny/statusu do każdego kanału:

    - `createDetectedBinaryStatus(...)` dla bloków statusu, które różnią się tylko etykietami, podpowiedziami, wynikami i wykrywaniem pliku binarnego
    - `createCliPathTextInput(...)` dla pól tekstowych opartych na ścieżce
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` i `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazywać do cięższego pełnego kreatora
    - `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi delegować tylko decyzję `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publikowanie i instalowanie

**Zewnętrzne Pluginy:** opublikuj w [ClawHub](/pl/clawhub), a następnie zainstaluj:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Gołe specyfikacje pakietów są instalowane z npm podczas przejścia startowego.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Użyj npm, gdy pakiet nie został jeszcze przeniesiony do ClawHub albo gdy podczas migracji potrzebujesz
    bezpośredniej ścieżki instalacji npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginy w repozytorium:** umieść je w drzewie obszaru roboczego dołączonych Pluginów, a zostaną automatycznie wykryte podczas kompilacji.

**Użytkownicy mogą instalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
W przypadku instalacji pochodzących z npm `openclaw plugins install` instaluje pakiet w projekcie osobnym dla każdego Pluginu pod `~/.openclaw/npm/projects` z wyłączonymi skryptami cyklu życia. Utrzymuj drzewa zależności Pluginów jako czyste JS/TS i unikaj pakietów wymagających kompilacji `postinstall`.
</Info>

<Note>
Uruchomienie Gateway nie instaluje zależności Pluginów. Przepływy instalacji npm/git/ClawHub odpowiadają za zbieżność zależności; lokalne Pluginy muszą mieć już zainstalowane swoje zależności.
</Note>

Metadane dołączonych pakietów są jawne, a nie wnioskowane z wygenerowanego JavaScriptu podczas uruchamiania Gateway. Zależności czasu wykonywania należą do pakietu Pluginu, który jest ich właścicielem; uruchamianie spakowanego OpenClaw nigdy nie naprawia ani nie kopiuje zależności Pluginów.

## Powiązane

- [Tworzenie Pluginów](/pl/plugins/building-plugins) — przewodnik krok po kroku dla początkujących
- [Manifest Pluginu](/pl/plugins/manifest) — pełna dokumentacja schematu manifestu
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — `definePluginEntry` i `defineChannelPluginEntry`
