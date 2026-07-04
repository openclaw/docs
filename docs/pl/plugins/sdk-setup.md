---
read_when:
    - Dodajesz kreator konfiguracji do Plugin
    - Musisz zrozumieć setup-entry.ts kontra index.ts
    - Definiujesz schematy konfiguracji pluginu lub metadane openclaw w package.json
sidebarTitle: Setup and config
summary: Kreatory konfiguracji, setup-entry.ts, schematy konfiguracji i metadane package.json
title: Konfiguracja i ustawienia Plugin
x-i18n:
    generated_at: "2026-07-04T15:37:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Dokumentacja referencyjna dla pakowania Pluginów (metadane `package.json`), manifestów (`openclaw.plugin.json`), wpisów konfiguracji początkowej i schematów konfiguracji.

<Tip>
**Szukasz przewodnika krok po kroku?** Poradniki omawiają pakowanie w kontekście: [Pluginy kanałów](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) i [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Twój `package.json` wymaga pola `openclaw`, które informuje system Pluginów, co zapewnia Twój Plugin:

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
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
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
  Lekki wpis używany tylko do konfiguracji początkowej (opcjonalny).
</ParamField>
<ParamField path="channel" type="object">
  Metadane katalogu kanału dla powierzchni konfiguracji początkowej, selektora, szybkiego startu i statusu.
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

`openclaw.channel` to lekkie metadane pakietu służące do wykrywania kanałów i powierzchni konfiguracji początkowej przed załadowaniem środowiska wykonawczego.

| Pole                                   | Typ        | Znaczenie                                                                      |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                               |
| `label`                                | `string`   | Główna etykieta kanału.                                                        |
| `selectionLabel`                       | `string`   | Etykieta selektora/konfiguracji początkowej, gdy powinna różnić się od `label`. |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółów dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków konfiguracji początkowej i wyboru.             |
| `docsLabel`                            | `string`   | Zastępcza etykieta używana dla linków dokumentacji, gdy powinna różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis do onboardingu/katalogu.                                           |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                     |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania dla wyboru kanału.                               |
| `preferOver`                           | `string[]` | Identyfikatory Pluginów/kanałów o niższym priorytecie, które ten kanał powinien wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/obrazu systemowego dla katalogów interfejsu kanałów.    |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami dokumentacji w powierzchniach wyboru.             |
| `selectionDocsOmitLabel`               | `boolean`  | Pokazuj ścieżkę dokumentacji bezpośrednio zamiast etykietowanego linku dokumentacji w tekście wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane w tekście wyboru.                            |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wychodzącym. |
| `exposure`                             | `object`   | Kontrolki widoczności kanału dla konfiguracji początkowej, list skonfigurowanych i powierzchni dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu konfiguracji początkowej szybkiego startu `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto.   |
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

- `configured`: uwzględnij kanał w powierzchniach list skonfigurowanych/statusowych
- `setup`: uwzględnij kanał w interaktywnych selektorach konfiguracji początkowej/konfiguracji
- `docs`: oznacz kanał jako publiczny w powierzchniach dokumentacji/nawigacji

<Note>
`showConfigured` i `showInSetup` pozostają obsługiwane jako starsze aliasy. Preferuj `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie metadane manifestu.

| Pole                         | Typ                                 | Znaczenie                                                                      |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `clawhubSpec`                | `string`                            | Kanoniczna specyfikacja ClawHub dla instalacji/aktualizacji i przepływów instalacji na żądanie podczas onboardingu. |
| `npmSpec`                    | `string`                            | Kanoniczna specyfikacja npm dla awaryjnych przepływów instalacji/aktualizacji. |
| `localPath`                  | `string`                            | Lokalna ścieżka deweloperska lub ścieżka instalacji w pakiecie.                |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy dostępnych jest wiele źródeł.               |
| `minHostVersion`             | `string`                            | Minimalna obsługiwana wersja OpenClaw w formie `>=x.y.z` lub `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Oczekiwany ciąg integralności dystrybucji npm, zwykle `sha512-...`, dla przypiętych instalacji. |
| `allowInvalidConfigRecovery` | `boolean`                           | Pozwala przepływom ponownej instalacji wbudowanych Pluginów odzyskać działanie po określonych awariach przestarzałej konfiguracji. |
| `requiredPlatformPackages`   | `string[]`                          | Wymagane specyficzne dla platformy aliasy npm weryfikowane podczas instalacji npm. |

<AccordionGroup>
  <Accordion title="Zachowanie onboardingu">
    Interaktywny onboarding używa także `openclaw.install` dla powierzchni instalacji na żądanie. Jeśli Twój Plugin udostępnia wybory uwierzytelniania dostawcy lub metadane konfiguracji początkowej/katalogu kanału przed załadowaniem środowiska wykonawczego, onboarding może pokazać ten wybór, poprosić o instalację z ClawHub, npm lub lokalnego źródła, zainstalować albo włączyć Plugin, a następnie kontynuować wybrany przepływ. Wybory onboardingu ClawHub używają `clawhubSpec` i są preferowane, gdy są obecne; wybory npm wymagają zaufanych metadanych katalogu ze specyfikacją rejestru `npmSpec`; dokładne wersje i `expectedIntegrity` są opcjonalnymi przypięciami npm. Jeśli `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji wymuszają je dla npm. Przechowuj metadane „co pokazać” w `openclaw.plugin.json`, a metadane „jak to zainstalować” w `package.json`.
  </Accordion>
  <Accordion title="Wymuszanie minHostVersion">
    Jeśli ustawiono `minHostVersion`, wymuszają je zarówno instalacja, jak i ładowanie rejestru manifestów niewbudowanych Pluginów. Starsze hosty pomijają zewnętrzne Pluginy; nieprawidłowe ciągi wersji są odrzucane. Zakłada się, że wbudowane Pluginy źródłowe mają tę samą wersję co checkout hosta.
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
    `allowInvalidConfigRecovery` nie jest ogólnym obejściem uszkodzonych konfiguracji. Służy wyłącznie do wąskiego odzyskiwania wbudowanych Pluginów, aby ponowna instalacja/konfiguracja początkowa mogła naprawić znane pozostałości po aktualizacji, takie jak brakująca ścieżka wbudowanego Pluginu lub przestarzały wpis `channels.<id>` dla tego samego Pluginu. Jeśli konfiguracja jest uszkodzona z niezwiązanych powodów, instalacja nadal kończy się w trybie fail-closed i informuje operatora, aby uruchomił `openclaw doctor --fix`.
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

Po włączeniu OpenClaw ładuje tylko `setupEntry` podczas fazy uruchamiania przed rozpoczęciem nasłuchiwania, nawet dla już skonfigurowanych kanałów. Pełny wpis ładuje się po tym, jak Gateway zacznie nasłuchiwać.

<Warning>
Włączaj odroczone ładowanie tylko wtedy, gdy Twój `setupEntry` rejestruje wszystko, czego Gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestrację kanału, trasy HTTP, metody Gateway). Jeśli pełny wpis posiada wymagane możliwości uruchomieniowe, pozostaw domyślne zachowanie.
</Warning>

Jeśli Twój wpis konfiguracji początkowej/pełny wpis rejestruje metody RPC Gateway, utrzymuj je pod prefiksem specyficznym dla Pluginu. Zarezerwowane główne przestrzenie nazw administracyjnych (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością rdzenia i zawsze rozwiązują się do `operator.admin`.

## Manifest Pluginu

Każdy natywny Plugin musi dostarczać `openclaw.plugin.json` w katalogu głównym pakietu. OpenClaw używa go do walidacji konfiguracji bez wykonywania kodu Pluginu.

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

W przypadku Pluginów kanałów dodaj `kind` i `channels`:

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

Zobacz [Manifest Pluginu](/pl/plugins/manifest), aby poznać pełne odniesienie do schematu.

## Publikowanie w ClawHub

Dla pakietów Pluginów użyj polecenia ClawHub właściwego dla pakietu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Starszy alias publikowania tylko dla umiejętności jest przeznaczony dla Skills. Pakiety Pluginów powinny zawsze używać `clawhub package publish`.
</Note>

## Wpis konfiguracji

Plik `setup-entry.ts` jest lekką alternatywą dla `index.ts`, którą OpenClaw ładuje, gdy potrzebuje tylko powierzchni konfiguracji (wdrażania, naprawy konfiguracji, inspekcji wyłączonego kanału).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu uruchomieniowego (bibliotek kryptograficznych, rejestracji CLI, usług działających w tle) podczas przepływów konfiguracji.

Kanały wbudowane w obszar roboczy, które trzymają eksporty bezpieczne dla konfiguracji w modułach pomocniczych, mogą użyć `defineBundledChannelSetupEntry(...)` z `openclaw/plugin-sdk/channel-entry-contract` zamiast `defineSetupPluginEntry(...)`. Ten wbudowany kontrakt obsługuje także opcjonalny eksport `runtime`, dzięki czemu okablowanie uruchomieniowe w czasie konfiguracji może pozostać lekkie i jawne.

<AccordionGroup>
  <Accordion title="Kiedy OpenClaw używa setupEntry zamiast pełnego wpisu">
    - Kanał jest wyłączony, ale potrzebuje powierzchni konfiguracji/wdrażania.
    - Kanał jest włączony, ale nieskonfigurowany.
    - Włączone jest odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Co musi zarejestrować setupEntry">
    - Obiekt Pluginu kanału (przez `defineSetupPluginEntry`).
    - Wszystkie trasy HTTP wymagane przed nasłuchem Gateway.
    - Wszystkie metody Gateway potrzebne podczas uruchamiania.

    Te metody Gateway używane podczas uruchamiania nadal powinny unikać zastrzeżonych przestrzeni nazw administracyjnych rdzenia, takich jak `config.*` lub `update.*`.

  </Accordion>
  <Accordion title="Czego setupEntry NIE powinien zawierać">
    - Rejestracji CLI.
    - Usług działających w tle.
    - Ciężkich importów uruchomieniowych (kryptografia, SDK).
    - Metod Gateway potrzebnych dopiero po uruchomieniu.

  </Accordion>
</AccordionGroup>

### Wąskie importy pomocników konfiguracji

Dla gorących ścieżek przeznaczonych tylko do konfiguracji preferuj wąskie szwy pomocników konfiguracji zamiast szerszego parasola `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                    | Do czego jej używać                                                                       | Kluczowe eksporty                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | pomocniki uruchomieniowe czasu konfiguracji, które pozostają dostępne w `setupEntry` / odroczonym uruchamianiu kanału | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | przestarzały alias zgodności; użyj `plugin-sdk/setup-runtime`                              | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | pomocniki CLI/archiwum/dokumentacji dla konfiguracji/instalacji                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Użyj szerszego szwu `plugin-sdk/setup`, gdy chcesz pełny współdzielony zestaw narzędzi konfiguracji, w tym pomocniki łatek konfiguracji, takie jak `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Użyj `createSetupTranslator(...)` dla stałych tekstów kreatora konfiguracji. Podąża on za ustawieniami regionalnymi kreatora CLI (`OPENCLAW_LOCALE`, następnie zmiennymi ustawień regionalnych systemu) i wraca do angielskiego. Tekst konfiguracji specyficzny dla Pluginu trzymaj w kodzie należącym do Pluginu, a współdzielonych kluczy katalogu używaj tylko dla wspólnych etykiet konfiguracji, tekstu statusu i oficjalnych tekstów konfiguracji wbudowanych Pluginów.

Adaptery łatek konfiguracji pozostają bezpieczne na gorącej ścieżce podczas importu. Ich wyszukiwanie powierzchni kontraktu wbudowanej promocji pojedynczego konta jest leniwe, więc zaimportowanie `plugin-sdk/setup-runtime` nie ładuje z wyprzedzeniem odkrywania powierzchni kontraktu wbudowanego, zanim adapter zostanie faktycznie użyty.

### Promocja pojedynczego konta należąca do kanału

Gdy kanał przechodzi z jednokontowej konfiguracji najwyższego poziomu na `channels.<id>.accounts.*`, domyślne współdzielone zachowanie polega na przeniesieniu promowanych wartości zakresu konta do `accounts.default`.

Kanały wbudowane mogą zawęzić lub zastąpić tę promocję przez swoją powierzchnię kontraktu konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do promowanego konta
- `namedAccountPromotionKeys`: gdy nazwane konta już istnieją, tylko te klucze przenoszą się do promowanego konta; współdzielone klucze polityki/dostarczania pozostają w korzeniu kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera, które istniejące konto otrzymuje promowane wartości

<Note>
Matrix jest obecnym wbudowanym przykładem. Jeśli istnieje dokładnie jedno nazwane konto Matrix albo jeśli `defaultAccount` wskazuje istniejący niekanoniczny klucz, taki jak `Ops`, promocja zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`.
</Note>

## Schemat konfiguracji

Konfiguracja Pluginu jest sprawdzana względem JSON Schema w manifeście. Użytkownicy konfigurują Pluginy przez:

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

### Tworzenie schematów konfiguracji kanałów

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

Dla Pluginów zewnętrznych kontraktem zimnej ścieżki nadal jest manifest Pluginu: odzwierciedl wygenerowany JSON Schema w `openclaw.plugin.json#channelConfigs`, aby schemat konfiguracji, konfiguracja i powierzchnie UI mogły sprawdzać `channels.<id>` bez ładowania kodu uruchomieniowego.

## Kreatory konfiguracji

Pluginy kanałów mogą dostarczać interaktywne kreatory konfiguracji dla `openclaw onboard`. Kreator jest obiektem `ChannelSetupWizard` w `ChannelPlugin`:

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

Typ `ChannelSetupWizard` obsługuje `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i więcej. Pełne przykłady znajdziesz w pakietach wbudowanych Pluginów (na przykład w Pluginie Discord `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Współdzielone monity allowFrom">
    Dla monitów listy dozwolonych DM, które potrzebują tylko standardowego przepływu `note -> prompt -> parse -> merge -> patch`, preferuj współdzielone pomocniki konfiguracji z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` i `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardowy status konfiguracji kanału">
    Dla bloków statusu konfiguracji kanału, które różnią się tylko etykietami, wynikami i opcjonalnymi dodatkowymi liniami, preferuj `createStandardChannelSetupStatus(...)` z `openclaw/plugin-sdk/setup` zamiast ręcznego tworzenia tego samego obiektu `status` w każdym Pluginie.
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

    Wygenerowany opcjonalny adapter/kreator zamyka się bezpiecznie przy rzeczywistych zapisach konfiguracji. Ponownie używa jednego komunikatu o wymaganej instalacji w `validateInput`, `applyAccountConfig` i `finalize`, a także dołącza link do dokumentacji, gdy ustawiono `docsPath`.

  </Accordion>
  <Accordion title="Pomocniki konfiguracji oparte na pliku binarnym">
    Dla interfejsów konfiguracji opartych na pliku binarnym preferuj współdzielone delegowane pomocniki zamiast kopiować to samo powiązanie pliku binarnego/statusu do każdego kanału:

    - `createDetectedBinaryStatus(...)` dla bloków stanu, które różnią się tylko etykietami, wskazówkami, ocenami i wykrywaniem binarnym
    - `createCliPathTextInput(...)` dla pól tekstowych opartych na ścieżce
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` i `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazać obsługę do cięższego pełnego kreatora
    - `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi tylko delegować decyzję `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publikowanie i instalowanie

**Zewnętrzne Pluginy:** opublikuj w [ClawHub](/clawhub), a następnie zainstaluj:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Surowe specyfikacje pakietów instalują z npm podczas przejścia startowego.

  </Tab>
  <Tab title="Tylko ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Specyfikacja pakietu npm">
    Użyj npm, gdy pakiet nie został jeszcze przeniesiony do ClawHub albo gdy podczas migracji potrzebujesz
    bezpośredniej ścieżki instalacji z npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginy w repozytorium:** umieść je w drzewie obszaru roboczego dołączanych Pluginów, a zostaną automatycznie wykryte podczas budowania.

**Użytkownicy mogą zainstalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
W przypadku instalacji pochodzących z npm `openclaw plugins install` instaluje pakiet w projekcie dla danego Pluginu pod `~/.openclaw/npm/projects` z wyłączonymi skryptami cyklu życia. Utrzymuj drzewa zależności Pluginów jako czysty JS/TS i unikaj pakietów wymagających kompilacji `postinstall`.
</Info>

<Note>
Uruchamianie Gateway nie instaluje zależności Pluginów. Przepływy instalacji npm/git/ClawHub odpowiadają za zbieżność zależności; lokalne Pluginy muszą mieć już zainstalowane swoje zależności.
</Note>

Metadane dołączanego pakietu są jawne, a nie wywnioskowane ze zbudowanego JavaScript podczas uruchamiania Gateway. Zależności uruchomieniowe należą do pakietu Pluginu, który je posiada; uruchamianie spakowanego OpenClaw nigdy nie naprawia ani nie odzwierciedla zależności Pluginów.

## Powiązane

- [Tworzenie Pluginów](/pl/plugins/building-plugins) — przewodnik krok po kroku na początek
- [Manifest Pluginu](/pl/plugins/manifest) — pełna referencja schematu manifestu
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — `definePluginEntry` i `defineChannelPluginEntry`
