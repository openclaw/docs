---
read_when:
    - Dodajesz kreator konfiguracji dla Plugin
    - Musisz zrozumieć różnicę między setup-entry.ts a index.ts
    - Definiujesz schematy konfiguracji Plugin lub metadane openclaw w package.json
sidebarTitle: Setup and config
summary: Kreatory konfiguracji, setup-entry.ts, schematy konfiguracji i metadane package.json
title: 'Plugin: konfiguracja i ustawienia'
x-i18n:
    generated_at: "2026-05-02T09:59:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Dokumentacja pakowania Plugin (`package.json`, metadane), manifestów (`openclaw.plugin.json`), wpisów konfiguracji i schematów konfiguracji.

<Tip>
**Szukasz przewodnika krok po kroku?** Poradniki opisują pakowanie w kontekście: [Pluginy kanałów](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) i [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
  <Tab title="Plugin providera / punkt odniesienia ClawHub">
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
Jeśli publikujesz Plugin zewnętrznie w ClawHub, pola `compat` i `build` są wymagane. Kanoniczne fragmenty publikowania znajdują się w `docs/snippets/plugin-publish/`.
</Note>

### Pola `openclaw`

<ParamField path="extensions" type="string[]">
  Pliki punktów wejścia (względne wobec katalogu głównego pakietu).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lekki wpis tylko do konfiguracji (opcjonalny).
</ParamField>
<ParamField path="channel" type="object">
  Metadane katalogu kanałów dla powierzchni konfiguracji, wyboru, szybkiego startu i statusu.
</ParamField>
<ParamField path="providers" type="string[]">
  Identyfikatory providerów zarejestrowane przez ten Plugin.
</ParamField>
<ParamField path="install" type="object">
  Wskazówki instalacji: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flagi zachowania podczas uruchamiania.
</ParamField>

### `openclaw.channel`

`openclaw.channel` to tanie metadane pakietu do wykrywania kanałów i powierzchni konfiguracji, zanim środowisko uruchomieniowe zostanie załadowane.

| Pole                                   | Typ        | Znaczenie                                                                      |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                               |
| `label`                                | `string`   | Główna etykieta kanału.                                                        |
| `selectionLabel`                       | `string`   | Etykieta wyboru/konfiguracji, gdy powinna różnić się od `label`.               |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółów dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków konfiguracji i wyboru.                         |
| `docsLabel`                            | `string`   | Zastępcza etykieta używana dla linków dokumentacji, gdy powinna różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis do onboardingu/katalogu.                                           |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                     |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania dla wyboru kanału.                               |
| `preferOver`                           | `string[]` | Identyfikatory Plugin/kanałów o niższym priorytecie, które ten kanał powinien wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/obrazu systemowego dla katalogów UI kanałów.            |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami dokumentacji w powierzchniach wyboru.             |
| `selectionDocsOmitLabel`               | `boolean`  | Pokaż ścieżkę dokumentacji bezpośrednio zamiast opisanego etykietą linku dokumentacji w tekście wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane w tekście wyboru.                            |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wychodzącym. |
| `exposure`                             | `object`   | Kontrolki widoczności kanału dla powierzchni konfiguracji, skonfigurowanych list i dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącz ten kanał do standardowego przepływu szybkiego startu `allowFrom`.       |
| `forceAccountBinding`                  | `boolean`  | Wymagaj jawnego powiązania konta, nawet gdy istnieje tylko jedno konto.        |
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

- `configured`: uwzględnij kanał w skonfigurowanych/statusowych powierzchniach list
- `setup`: uwzględnij kanał w interaktywnych selektorach konfiguracji
- `docs`: oznacz kanał jako publiczny w powierzchniach dokumentacji/nawigacji

<Note>
`showConfigured` i `showInSetup` pozostają obsługiwane jako starsze aliasy. Preferuj `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie metadane manifestu.

| Pole                         | Typ                  | Znaczenie                                                                         |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanoniczna specyfikacja npm dla przepływów instalacji/aktualizacji.               |
| `localPath`                  | `string`             | Ścieżka lokalnego rozwoju lub instalacji wbudowanej.                              |
| `defaultChoice`              | `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy dostępne są oba.                               |
| `minHostVersion`             | `string`             | Minimalna obsługiwana wersja OpenClaw w formie `>=x.y.z` lub `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`             | Oczekiwany ciąg integralności dystrybucji npm, zwykle `sha512-...`, dla przypiętych instalacji. |
| `allowInvalidConfigRecovery` | `boolean`            | Pozwala przepływom ponownej instalacji wbudowanego Plugin odzyskać działanie po określonych awariach spowodowanych nieaktualną konfiguracją. |

<AccordionGroup>
  <Accordion title="Zachowanie onboardingu">
    Interaktywny onboarding również używa `openclaw.install` dla powierzchni instalacji na żądanie. Jeśli Twój Plugin udostępnia wybory uwierzytelniania providera lub metadane konfiguracji/katalogu kanałów przed załadowaniem środowiska uruchomieniowego, onboarding może pokazać ten wybór, zapytać o instalację npm albo lokalną, zainstalować lub włączyć Plugin, a następnie kontynuować wybrany przepływ. Wybory onboardingu npm wymagają zaufanych metadanych katalogu ze specyfikacją rejestru `npmSpec`; dokładne wersje i `expectedIntegrity` są opcjonalnymi przypięciami. Jeśli `expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji je wymuszają. Przechowuj metadane „co pokazać” w `openclaw.plugin.json`, a metadane „jak to zainstalować” w `package.json`.
  </Accordion>
  <Accordion title="Wymuszanie minHostVersion">
    Jeśli ustawiono `minHostVersion`, wymuszają je zarówno instalacja, jak i ładowanie rejestru manifestów niewbudowanych Plugin. Starsze hosty pomijają zewnętrzne Plugin; nieprawidłowe ciągi wersji są odrzucane. Wbudowane Plugin źródłowe zakłada się jako współwersjonowane z checkoutem hosta.
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
    `allowInvalidConfigRecovery` nie jest ogólnym obejściem dla zepsutych konfiguracji. Służy wyłącznie do wąskiego odzyskiwania wbudowanych Plugin, aby ponowna instalacja/konfiguracja mogła naprawić znane pozostałości po aktualizacji, takie jak brakująca ścieżka wbudowanego Plugin lub nieaktualny wpis `channels.<id>` dla tego samego Plugin. Jeśli konfiguracja jest zepsuta z niezwiązanych powodów, instalacja nadal kończy się bezpiecznym niepowodzeniem i informuje operatora, aby uruchomił `openclaw doctor --fix`.
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

Gdy jest włączone, OpenClaw ładuje tylko `setupEntry` w fazie uruchamiania przed nasłuchiwaniem, nawet dla już skonfigurowanych kanałów. Pełny wpis ładuje się po tym, jak Gateway zacznie nasłuchiwać.

<Warning>
Włączaj odroczone ładowanie tylko wtedy, gdy Twój `setupEntry` rejestruje wszystko, czego Gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestracja kanału, trasy HTTP, metody Gateway). Jeśli pełny wpis posiada wymagane możliwości uruchomieniowe, zachowaj domyślne zachowanie.
</Warning>

Jeśli wpis konfiguracji/pełny wpis rejestruje metody RPC Gateway, zachowaj je pod prefiksem specyficznym dla Plugin. Zarezerwowane przestrzenie nazw podstawowej administracji (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością rdzenia i zawsze rozwiązują się do `operator.admin`.

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

Nawet Plugin bez konfiguracji musi dostarczać schemat. Pusty schemat jest prawidłowy:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Zobacz [Manifest Plugin](/pl/plugins/manifest), aby uzyskać pełną dokumentację schematu.

## Publikowanie w ClawHub

Dla pakietów Plugin używaj polecenia ClawHub specyficznego dla pakietu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Starszy alias publikowania tylko dla Skills jest przeznaczony dla Skills. Pakiety Plugin powinny zawsze używać `clawhub package publish`.
</Note>

## Wpis konfiguracji

Plik `setup-entry.ts` jest lekką alternatywą dla `index.ts`, którą OpenClaw ładuje, gdy potrzebuje tylko powierzchni konfiguracji (onboardingu, naprawy konfiguracji, inspekcji wyłączonego kanału).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu runtime (bibliotek kryptograficznych, rejestracji CLI, usług działających w tle) podczas przepływów konfiguracji.

Kanały z przestrzeni roboczej pakietu, które utrzymują eksporty bezpieczne dla konfiguracji w modułach pomocniczych, mogą używać `defineBundledChannelSetupEntry(...)` z `openclaw/plugin-sdk/channel-entry-contract` zamiast `defineSetupPluginEntry(...)`. Ten kontrakt pakietowy obsługuje także opcjonalny eksport `runtime`, dzięki czemu okablowanie runtime w czasie konfiguracji może pozostać lekkie i jawne.

<AccordionGroup>
  <Accordion title="Kiedy OpenClaw używa setupEntry zamiast pełnego entry">
    - Kanał jest wyłączony, ale potrzebuje powierzchni konfiguracji/onboardingu.
    - Kanał jest włączony, ale nieskonfigurowany.
    - Włączone jest odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Co setupEntry musi rejestrować">
    - Obiekt pluginu kanału (przez `defineSetupPluginEntry`).
    - Wszystkie trasy HTTP wymagane przed nasłuchiwaniem Gateway.
    - Wszystkie metody Gateway potrzebne podczas uruchamiania.

    Te startowe metody Gateway nadal powinny unikać zarezerwowanych przestrzeni nazw administracji rdzenia, takich jak `config.*` lub `update.*`.

  </Accordion>
  <Accordion title="Czego setupEntry NIE powinno zawierać">
    - Rejestracji CLI.
    - Usług działających w tle.
    - Ciężkich importów runtime (kryptografia, SDK).
    - Metod Gateway potrzebnych dopiero po uruchomieniu.

  </Accordion>
</AccordionGroup>

### Wąskie importy pomocników konfiguracji

Dla gorących ścieżek przeznaczonych tylko do konfiguracji preferuj wąskie szwy pomocników konfiguracji zamiast szerszego parasola `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                    | Do czego używać                                                                           | Kluczowe eksporty                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | pomocniki runtime czasu konfiguracji dostępne w `setupEntry` / odroczonym starcie kanału  | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptery konfiguracji kont świadome środowiska                                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | pomocniki setup/install CLI/archiwów/dokumentacji                                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Użyj szerszego szwu `plugin-sdk/setup`, gdy chcesz pełnego współdzielonego zestawu narzędzi konfiguracji, w tym pomocników łatek konfiguracji, takich jak `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptery łatek konfiguracji pozostają bezpieczne dla gorącej ścieżki podczas importu. Ich pakietowe wyszukiwanie powierzchni kontraktu promocji pojedynczego konta jest leniwe, więc importowanie `plugin-sdk/setup-runtime` nie ładuje gorliwie wykrywania pakietowej powierzchni kontraktu, zanim adapter zostanie faktycznie użyty.

### Promocja pojedynczego konta własnością kanału

Gdy kanał aktualizuje się z konfiguracji najwyższego poziomu dla pojedynczego konta do `channels.<id>.accounts.*`, domyślne współdzielone zachowanie przenosi promowane wartości zakresu konta do `accounts.default`.

Kanały pakietowe mogą zawęzić lub nadpisać tę promocję przez swoją powierzchnię kontraktu konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do promowanego konta
- `namedAccountPromotionKeys`: gdy nazwane konta już istnieją, tylko te klucze są przenoszone do promowanego konta; współdzielone klucze polityki/dostarczania pozostają w katalogu głównym kanału
- `resolveSingleAccountPromotionTarget(...)`: wybierz, które istniejące konto otrzyma promowane wartości

<Note>
Matrix jest obecnym przykładem pakietowym. Jeśli istnieje już dokładnie jedno nazwane konto Matrix albo jeśli `defaultAccount` wskazuje istniejący niekanoniczny klucz, taki jak `Ops`, promocja zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`.
</Note>

## Schemat konfiguracji

Konfiguracja pluginu jest walidowana względem JSON Schema w manifeście. Użytkownicy konfigurują pluginy przez:

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

Plugin otrzymuje tę konfigurację jako `api.pluginConfig` podczas rejestracji.

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

Użyj `buildChannelConfigSchema`, aby przekonwertować schemat Zod na opakowanie `ChannelConfigSchema` używane przez artefakty konfiguracji należące do pluginu:

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

Dla pluginów zewnętrznych kontraktem zimnej ścieżki nadal jest manifest pluginu: odzwierciedl wygenerowany JSON Schema w `openclaw.plugin.json#channelConfigs`, aby schemat konfiguracji, konfiguracja i powierzchnie UI mogły inspektować `channels.<id>` bez ładowania kodu runtime.

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

Typ `ChannelSetupWizard` obsługuje `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i inne. Zobacz pakiety pluginów pakietowych (na przykład plugin Discord `src/channel.setup.ts`), aby uzyskać pełne przykłady.

<AccordionGroup>
  <Accordion title="Współdzielone monity allowFrom">
    Dla monitów listy dozwolonych DM, które potrzebują tylko standardowego przepływu `note -> prompt -> parse -> merge -> patch`, preferuj współdzielone pomocniki konfiguracji z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` i `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardowy status konfiguracji kanału">
    Dla bloków statusu konfiguracji kanału, które różnią się tylko etykietami, wynikami i opcjonalnymi dodatkowymi wierszami, preferuj `createStandardChannelSetupStatus(...)` z `openclaw/plugin-sdk/setup` zamiast ręcznie tworzyć ten sam obiekt `status` w każdym pluginie.
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

    Wygenerowany opcjonalny adapter/kreator domyślnie odmawia rzeczywistych zapisów konfiguracji. Ponownie używa jednego komunikatu wymagającego instalacji w `validateInput`, `applyAccountConfig` i `finalize` oraz dołącza link do dokumentacji, gdy ustawiono `docsPath`.

  </Accordion>
  <Accordion title="Pomocniki konfiguracji oparte na binariach">
    Dla UI konfiguracji opartych na binariach preferuj współdzielone pomocniki delegowane zamiast kopiować ten sam kod łączący binaria/status do każdego kanału:

    - `createDetectedBinaryStatus(...)` dla bloków statusu, które różnią się tylko etykietami, wskazówkami, wynikami i wykrywaniem binariów
    - `createCliPathTextInput(...)` dla pól tekstowych opartych na ścieżkach
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` i `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazywać do cięższego pełnego kreatora
    - `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi delegować tylko decyzję `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publikowanie i instalowanie

**Pluginy zewnętrzne:** opublikuj w [ClawHub](/pl/tools/clawhub), a następnie zainstaluj:

<Tabs>
  <Tab title="Automatycznie (ClawHub, potem npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw najpierw próbuje ClawHub, a potem automatycznie przechodzi na npm.

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

**Pluginy w repozytorium:** umieść je w drzewie przestrzeni roboczej pluginów pakietowych, a zostaną automatycznie wykryte podczas kompilacji.

**Użytkownicy mogą zainstalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
Dla instalacji pochodzących z npm `openclaw plugins install` instaluje pakiet w `~/.openclaw/npm` z wyłączonymi skryptami cyklu życia. Utrzymuj drzewa zależności pluginów jako czyste JS/TS i unikaj pakietów wymagających kompilacji `postinstall`.
</Info>

<Note>
Uruchomienie Gateway nie instaluje zależności pluginów. Przepływy instalacji npm/git/ClawHub odpowiadają za zbieżność zależności; lokalne pluginy muszą mieć już zainstalowane swoje zależności.
</Note>

Metadane dołączonego pakietu są jawne, a nie wnioskowane ze zbudowanego JavaScript podczas uruchamiania Gateway. Zależności czasu wykonywania należą do pakietu Plugin, który je posiada; uruchamianie spakowanego OpenClaw nigdy nie naprawia ani nie odzwierciedla zależności Plugin.

## Powiązane

- [Tworzenie Plugin](/pl/plugins/building-plugins) — przewodnik krok po kroku na początek
- [Manifest Plugin](/pl/plugins/manifest) — pełna dokumentacja schematu manifestu
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — `definePluginEntry` i `defineChannelPluginEntry`
