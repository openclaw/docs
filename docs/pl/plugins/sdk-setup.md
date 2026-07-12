---
read_when:
    - Dodajesz kreator konfiguracji do pluginu
    - Musisz zrozumieć różnicę między setup-entry.ts a index.ts
    - Definiujesz schematy konfiguracji pluginu lub metadane openclaw w pliku package.json
sidebarTitle: Setup and config
summary: Kreatory konfiguracji, setup-entry.ts, schematy konfiguracji i metadane package.json
title: Konfiguracja i ustawienia Pluginu
x-i18n:
    generated_at: "2026-07-12T15:31:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Dokumentacja pakowania Pluginów (metadane `package.json`), manifestów (`openclaw.plugin.json`), punktów konfiguracji i schematów konfiguracji.

<Tip>
**Szukasz przewodnika krok po kroku?** Przewodniki praktyczne omawiają pakowanie w kontekście: [Pluginy kanałów](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) i [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Plik `package.json` musi zawierać pole `openclaw`, które informuje system Pluginów, co udostępnia Twój Plugin:

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
  <Tab title="Plugin dostawcy / konfiguracja bazowa ClawHub">
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
Publikowanie zewnętrzne w ClawHub wymaga pól `compat` i `build`. Kanoniczne fragmenty dotyczące publikowania znajdują się w `docs/snippets/plugin-publish/`.
</Note>

### Pola `openclaw`

<ParamField path="extensions" type="string[]">
  Pliki punktów wejścia (względem katalogu głównego pakietu). Prawidłowe źródłowe punkty wejścia do programowania w obszarze roboczym i kopii roboczej git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Skompilowane odpowiedniki JavaScript dla `extensions`, preferowane, gdy OpenClaw ładuje zainstalowany pakiet npm. Kolejność rozwiązywania wersji źródłowych i skompilowanych opisano w sekcji [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lekki punkt wejścia używany wyłącznie podczas konfiguracji (opcjonalny).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Skompilowany odpowiednik JavaScript dla `setupEntry`. Wymaga również ustawienia `setupEntry`.
</ParamField>
<ParamField path="plugin" type="object">
  Zastępcza tożsamość Pluginu `{ id, label }`, używana, gdy Plugin nie zawiera metadanych kanału ani dostawcy, z których można wyznaczyć identyfikator lub etykietę.
</ParamField>
<ParamField path="channel" type="object">
  Metadane katalogowe kanału używane w interfejsach konfiguracji, wyboru, szybkiego startu i stanu.
</ParamField>
<ParamField path="install" type="object">
  Wskazówki instalacyjne: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Flagi zachowania podczas uruchamiania.
</ParamField>
<ParamField path="compat" type="object">
  Zakres wersji `pluginApi` obsługiwany przez ten Plugin. Wymagany przy publikowaniu zewnętrznym w ClawHub.
</ParamField>

<Note>
Identyfikatory dostawców (`providers: string[]`) są metadanymi manifestu, a nie pakietu. Zadeklaruj je w `openclaw.plugin.json`, a nie tutaj — zobacz [Manifest Pluginu](/pl/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` to lekkie metadane pakietu służące do wykrywania kanałów oraz wyświetlania interfejsów konfiguracji przed załadowaniem środowiska wykonawczego.

| Pole                                   | Typ        | Znaczenie                                                                      |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                               |
| `label`                                | `string`   | Główna etykieta kanału.                                                        |
| `selectionLabel`                       | `string`   | Etykieta wyboru lub konfiguracji, gdy powinna różnić się od `label`.           |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółów dla rozbudowanych katalogów kanałów i widoków stanu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji używana w odnośnikach konfiguracji i wyboru.              |
| `docsLabel`                            | `string`   | Zastępcza etykieta odnośników do dokumentacji, gdy powinna różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis na potrzeby wdrażania i katalogu.                                  |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                     |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania używane przy wyborze kanału.                     |
| `preferOver`                           | `string[]` | Identyfikatory Pluginów lub kanałów o niższym priorytecie, przed którymi ten kanał powinien mieć pierwszeństwo. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony lub obrazu systemowego w katalogach kanałów interfejsu użytkownika. |
| `selectionDocsPrefix`                  | `string`   | Tekst poprzedzający odnośniki do dokumentacji w interfejsach wyboru.           |
| `selectionDocsOmitLabel`               | `boolean`  | Wyświetla bezpośrednio ścieżkę dokumentacji zamiast opisanego etykietą odnośnika w tekście wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane do tekstu wyboru.                            |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wiadomości wychodzących. |
| `exposure`                             | `object`   | Ustawienia widoczności kanału w konfiguracji, listach skonfigurowanych kanałów i dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza dla tego kanału standardowy proces konfiguracji szybkiego startu `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta, nawet jeśli istnieje tylko jedno konto.       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferuje wyszukiwanie sesji podczas ustalania celów ogłoszeń dla tego kanału. |

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

- `configured`: uwzględnia kanał w widokach list skonfigurowanych kanałów i widokach stanu
- `setup`: uwzględnia kanał w interaktywnych selektorach konfiguracji
- `docs`: oznacza kanał jako publicznie widoczny w dokumentacji i nawigacji

<Note>
`showConfigured` i `showInSetup` pozostają obsługiwane jako starsze aliasy. Preferuj `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie manifestu.

| Pole                         | Typ                                 | Znaczenie                                                                       |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kanoniczna specyfikacja ClawHub używana podczas instalacji, aktualizacji i instalacji na żądanie w procesie wdrażania. |
| `npmSpec`                    | `string`                            | Kanoniczna specyfikacja npm używana w rezerwowych procesach instalacji i aktualizacji. |
| `localPath`                  | `string`                            | Lokalna ścieżka instalacji programistycznej lub dołączonej.                     |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy dostępnych jest wiele źródeł.                |
| `minHostVersion`             | `string`                            | Minimalna obsługiwana wersja OpenClaw: `>=x.y.z` lub `>=x.y.z-prerelease`.      |
| `expectedIntegrity`          | `string`                            | Oczekiwany ciąg integralności dystrybucji npm, zwykle `sha512-...`, dla instalacji przypiętych do wersji. |
| `allowInvalidConfigRecovery` | `boolean`                           | Umożliwia procesom ponownej instalacji dołączonego Pluginu naprawę określonych błędów nieaktualnej konfiguracji. |
| `requiredPlatformPackages`   | `string[]`                          | Wymagane aliasy npm zależne od platformy, weryfikowane podczas instalacji npm.  |

<AccordionGroup>
  <Accordion title="Zachowanie podczas wdrażania">
    Interaktywne wdrażanie używa `openclaw.install` w interfejsach instalacji na żądanie: jeśli Plugin udostępnia opcje uwierzytelniania dostawcy albo metadane konfiguracji lub katalogu kanałów przed załadowaniem środowiska wykonawczego, proces wdrażania może poprosić o instalację z ClawHub, npm lub lokalnego źródła, zainstalować lub włączyć Plugin, a następnie kontynuować wybrany proces. Opcje ClawHub używają `clawhubSpec` i są preferowane, gdy to pole jest obecne; opcje npm wymagają zaufanych metadanych katalogu ze specyfikacją rejestru `npmSpec` (dokładne wersje i `expectedIntegrity` są opcjonalnymi przypięciami, wymuszanymi podczas instalacji lub aktualizacji, jeśli je ustawiono). Informacje „co wyświetlić” przechowuj w `openclaw.plugin.json`, a „jak to zainstalować” — w `package.json`.
  </Accordion>
  <Accordion title="Wymuszanie minHostVersion">
    Jeśli ustawiono `minHostVersion`, wymaganie to jest egzekwowane zarówno podczas instalacji, jak i ładowania niedołączonych Pluginów z rejestru manifestów. Starsze hosty pomijają zewnętrzne Pluginy; nieprawidłowe ciągi wersji są odrzucane. Zakłada się, że dołączone źródłowe Pluginy mają tę samą wersję co kopia robocza hosta.
  </Accordion>
  <Accordion title="Instalacje npm przypięte do wersji">
    W przypadku instalacji npm przypiętych do wersji zachowaj dokładną wersję w `npmSpec` i dodaj oczekiwaną integralność artefaktu:

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
    `allowInvalidConfigRecovery` nie jest ogólnym sposobem obchodzenia uszkodzonych konfiguracji. Służy wyłącznie do wąsko określonego odzyskiwania dołączonych Pluginów, umożliwiając ponownej instalacji lub konfiguracji naprawę znanych pozostałości po aktualizacji, takich jak brakująca ścieżka dołączonego Pluginu albo nieaktualny wpis `channels.<id>` dotyczący tego samego Pluginu. Jeśli konfiguracja jest uszkodzona z innych powodów, instalacja nadal kończy się bezpiecznym błędem i informuje operatora o konieczności uruchomienia `openclaw doctor --fix`.
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

Po włączeniu OpenClaw ładuje tylko `setupEntry` w fazie uruchamiania przed rozpoczęciem nasłuchiwania, nawet w przypadku już skonfigurowanych kanałów. Pełny punkt wejścia jest ładowany po rozpoczęciu nasłuchiwania przez Gateway.

<Warning>
Włączaj odroczone ładowanie tylko wtedy, gdy `setupEntry` rejestruje wszystko, czego Gateway potrzebuje przed rozpoczęciem nasłuchiwania: rejestrację kanału, trasy HTTP i metody Gateway. Jeśli pełny punkt wejścia odpowiada za wymagane funkcje startowe, zachowaj zachowanie domyślne.
</Warning>

Jeśli punkty wejścia konfiguracji lub pełnego ładowania rejestrują metody RPC Gateway, umieść je pod prefiksem właściwym dla danego Pluginu. Zastrzeżone przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością rdzenia i są zawsze normalizowane do `operator.admin`.

## Manifest Pluginu

Każdy natywny Plugin musi zawierać plik `openclaw.plugin.json` w katalogu głównym pakietu. OpenClaw używa go do walidowania konfiguracji bez wykonywania kodu Pluginu.

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

W przypadku Pluginów kanałów dodaj `channels` (a w przypadku Pluginów dostawców dodaj `providers`):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Nawet Pluginy bez konfiguracji muszą zawierać schemat. Pusty schemat jest prawidłowy:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Pełną dokumentację schematu zawiera strona [Manifest Pluginu](/pl/plugins/manifest).

## Publikowanie w ClawHub

Pakiety Skills i Pluginów korzystają z oddzielnych poleceń publikowania w ClawHub. W przypadku pakietów Pluginów użyj polecenia przeznaczonego dla pakietów:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` to inne polecenie, służące do publikowania folderu Skills, a nie pakietu Pluginu. Zobacz [Publikowanie w ClawHub](/pl/clawhub/publishing).
</Note>

## Punkt wejścia konfiguracji

`setup-entry.ts` to lekka alternatywa dla `index.ts`, którą OpenClaw ładuje, gdy potrzebuje tylko powierzchni konfiguracji (wdrażania, naprawy konfiguracji, inspekcji wyłączonego kanału):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu środowiska wykonawczego (bibliotek kryptograficznych, rejestracji CLI, usług działających w tle) podczas procesów konfiguracji.

Kanały dołączone do obszaru roboczego, które przechowują bezpieczne dla konfiguracji eksporty w modułach pomocniczych, mogą używać `defineBundledChannelSetupEntry(...)` z `openclaw/plugin-sdk/channel-entry-contract` zamiast `defineSetupPluginEntry(...)`. Ten kontrakt dołączonego kanału obsługuje również opcjonalny eksport `runtime`, dzięki czemu powiązania środowiska wykonawczego na etapie konfiguracji mogą pozostać lekkie i jawne.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Kanał jest wyłączony, ale wymaga powierzchni konfiguracji lub wdrażania.
    - Kanał jest włączony, ale nieskonfigurowany.
    - Włączono odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - Obiekt Pluginu kanału (za pośrednictwem `defineSetupPluginEntry`).
    - Wszystkie trasy HTTP wymagane przed rozpoczęciem nasłuchiwania przez Gateway.
    - Wszystkie metody Gateway potrzebne podczas uruchamiania.

    Te metody Gateway używane podczas uruchamiania nadal powinny unikać zastrzeżonych przestrzeni nazw administracyjnych rdzenia, takich jak `config.*` lub `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - Rejestracji CLI.
    - Usług działających w tle.
    - Ciężkich importów środowiska wykonawczego (kryptografia, zestawy SDK).
    - Metod Gateway potrzebnych dopiero po uruchomieniu.

  </Accordion>
</AccordionGroup>

### Wąskie importy pomocnicze konfiguracji

W przypadku intensywnie używanych ścieżek przeznaczonych wyłącznie do konfiguracji preferuj wąskie interfejsy pomocnicze konfiguracji zamiast szerszego modułu zbiorczego `plugin-sdk/setup`, jeśli potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                     | Zastosowanie                                                                               | Najważniejsze eksporty                                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | funkcje pomocnicze środowiska wykonawczego na etapie konfiguracji, dostępne w `setupEntry` i podczas odroczonego uruchamiania kanału | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | przestarzały alias zgodności; używaj `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | funkcje pomocnicze CLI, instalacji, archiwów i dokumentacji związane z konfiguracją        | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Użyj szerszego interfejsu `plugin-sdk/setup`, jeśli potrzebujesz pełnego wspólnego zestawu narzędzi konfiguracyjnych, w tym funkcji pomocniczych do modyfikowania konfiguracji, takich jak `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Używaj `createSetupTranslator(...)` do stałych tekstów kreatora konfiguracji. Funkcja ta stosuje ustawienia regionalne kreatora CLI (`OPENCLAW_LOCALE`, a następnie systemowe zmienne ustawień regionalnych) i w razie potrzeby używa języka angielskiego. Teksty konfiguracji właściwe dla Pluginu przechowuj w kodzie należącym do Pluginu, a współdzielonych kluczy katalogu używaj wyłącznie do wspólnych etykiet konfiguracji, tekstów stanu i tekstów konfiguracji oficjalnych dołączonych Pluginów.

Adaptery modyfikowania konfiguracji pozostają bezpieczne dla intensywnie używanych ścieżek już podczas importu. Wyszukiwanie powierzchni kontraktu dołączonego kanału dotyczącej promowania pojedynczego konta jest leniwe, dlatego importowanie `plugin-sdk/setup-runtime` nie powoduje natychmiastowego ładowania mechanizmu wykrywania powierzchni kontraktów dołączonych kanałów, zanim adapter zostanie faktycznie użyty.

### Promowanie pojedynczego konta należące do kanału

Gdy kanał przechodzi z konfiguracji pojedynczego konta najwyższego poziomu na `channels.<id>.accounts.*`, domyślne współdzielone zachowanie przenosi promowane wartości dotyczące konta do `accounts.default`.

Dołączone kanały mogą zawęzić lub zastąpić to promowanie za pośrednictwem swojej powierzchni kontraktu konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które należy przenieść do promowanego konta
- `namedAccountPromotionKeys`: jeśli nazwane konta już istnieją, do promowanego konta przenoszone są tylko te klucze; współdzielone klucze zasad i dostarczania pozostają w katalogu głównym kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera istniejące konto, które otrzyma promowane wartości

<Note>
Matrix jest obecnie przykładem dołączonego kanału. Jeśli istnieje dokładnie jedno nazwane konto Matrix albo jeśli `defaultAccount` wskazuje istniejący niekanoniczny klucz, taki jak `Ops`, promowanie zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`.
</Note>

## Schemat konfiguracji

Konfiguracja Pluginu jest walidowana względem schematu JSON w manifeście. Użytkownicy konfigurują Pluginy za pomocą:

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

Podczas rejestracji Plugin otrzymuje tę konfigurację jako `api.pluginConfig`.

W przypadku konfiguracji właściwej dla kanału użyj zamiast tego sekcji konfiguracji kanału:

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

Użyj `buildChannelConfigSchema`, aby przekształcić schemat Zod w opakowanie `ChannelConfigSchema` używane przez artefakty konfiguracji należące do Pluginu:

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

Jeśli kontrakt jest już tworzony jako schemat JSON lub TypeBox, użyj bezpośredniej funkcji pomocniczej, aby OpenClaw mógł pominąć konwersję ze schematu Zod do schematu JSON na ścieżkach metadanych:

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

W przypadku Pluginów innych firm kontraktem ścieżki nieaktywnej nadal jest manifest Pluginu: odwzoruj wygenerowany schemat JSON w `openclaw.plugin.json#channelConfigs`, aby powierzchnie schematu konfiguracji, konfiguracji początkowej i interfejsu użytkownika mogły analizować `channels.<id>` bez ładowania kodu środowiska wykonawczego.

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

`ChannelSetupWizard` obsługuje również `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i inne elementy. Pełny przykład dołączonego Pluginu znajduje się w pliku `src/setup-core.ts` Pluginu Discord.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    W przypadku monitów listy dozwolonych nadawców wiadomości bezpośrednich, które wymagają tylko standardowego przepływu `note -> prompt -> parse -> merge -> patch`, preferuj współdzielone funkcje pomocnicze konfiguracji z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` i `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    W przypadku bloków stanu konfiguracji kanału, które różnią się tylko etykietami, ocenami i opcjonalnymi dodatkowymi wierszami, preferuj `createStandardChannelSetupStatus(...)` z `openclaw/plugin-sdk/setup` zamiast ręcznego tworzenia tego samego obiektu `status` w każdym Pluginie.
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

    `plugin-sdk/channel-setup` udostępnia również konstruktory niższego poziomu `createOptionalChannelSetupAdapter(...)` i `createOptionalChannelSetupWizard(...)`, jeśli potrzebujesz tylko jednej części tej opcjonalnej powierzchni instalacyjnej.

    Wygenerowany opcjonalny adapter/kreator działa w trybie fail-closed podczas rzeczywistych zapisów konfiguracji. Ponownie wykorzystuje jeden komunikat o wymaganej instalacji w `validateInput`, `applyAccountConfig` i `finalize`, a gdy ustawiono `docsPath`, dołącza odnośnik do dokumentacji.

  </Accordion>
  <Accordion title="Pomocnicze funkcje konfiguracji opartej na plikach binarnych">
    W przypadku interfejsów konfiguracji opartych na plikach binarnych preferuj współdzielone, delegujące funkcje pomocnicze zamiast kopiowania tej samej logiki obsługi pliku binarnego i stanu do każdego kanału:

    - `createDetectedBinaryStatus(...)` dla bloków stanu różniących się tylko etykietami, wskazówkami, punktacją i wykrywaniem pliku binarnego
    - `createCliPathTextInput(...)` dla pól tekstowych zawierających ścieżki
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` i `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazywać obsługę do bardziej rozbudowanego, pełnego kreatora
    - `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi jedynie delegować decyzję `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publikowanie i instalowanie

**Zewnętrzne pluginy:** opublikuj w [ClawHub](/pl/clawhub), a następnie zainstaluj:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Same specyfikacje pakietów są instalowane z npm podczas przełączenia przy uruchamianiu, chyba że nazwa odpowiada identyfikatorowi dołączonego lub oficjalnego pluginu — w takim przypadku OpenClaw używa zamiast tego kopii lokalnej/oficjalnej. Aby deterministycznie wybrać źródło, użyj `clawhub:`, `npm:`, `git:` lub `npm-pack:` — zobacz [Zarządzanie pluginami](/pl/plugins/manage-plugins).

  </Tab>
  <Tab title="Tylko ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Specyfikacja pakietu npm">
    Użyj npm, gdy pakiet nie został jeszcze przeniesiony do ClawHub lub gdy podczas migracji potrzebujesz
    bezpośredniej ścieżki instalacji z npm:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Pluginy w repozytorium:** umieść je w drzewie przestrzeni roboczej dołączonych pluginów; zostaną automatycznie wykryte podczas kompilacji.

<Info>
W przypadku instalacji ze źródła npm polecenie `openclaw plugins install` instaluje pakiet w osobnym projekcie pluginu w katalogu `~/.openclaw/npm/projects`, z wyłączonymi skryptami cyklu życia (`--ignore-scripts`). Utrzymuj drzewa zależności pluginów wyłącznie w JS/TS i unikaj pakietów wymagających kompilacji przez `postinstall`.
</Info>

<Note>
Uruchomienie Gateway nie instaluje zależności pluginów. Za ujednolicenie zależności odpowiadają procesy instalacji z npm/git/ClawHub; zależności lokalnych pluginów muszą być już zainstalowane.
</Note>

Metadane dołączonych pakietów są jawne, a nie wywnioskowane ze skompilowanego kodu JavaScript podczas uruchamiania Gateway. Zależności środowiska uruchomieniowego należą do pakietu pluginu, który jest ich właścicielem; uruchamianie spakowanego OpenClaw nigdy nie naprawia ani nie powiela zależności pluginów.

## Powiązane materiały

- [Tworzenie pluginów](/pl/plugins/building-plugins) — przewodnik wprowadzający krok po kroku
- [Manifest pluginu](/pl/plugins/manifest) — pełna dokumentacja schematu manifestu
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — `definePluginEntry` i `defineChannelPluginEntry`
