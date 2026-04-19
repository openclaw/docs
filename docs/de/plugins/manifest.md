---
read_when:
    - Du erstellst ein OpenClaw Plugin
    - Du musst ein Plugin-Konfigurationsschema bereitstellen oder Plugin-Validierungsfehler beheben
summary: Plugin-Manifest- und JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-19T01:11:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2dfc00759108ddee7bfcda8c42acf7f2d47451676447ba3caf8b5950f8a1c181
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (`openclaw.plugin.json`)

Diese Seite gilt nur für das **native OpenClaw Plugin-Manifest**.

Kompatible Bundle-Layouts findest du unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponenten-Layout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch nicht anhand des hier beschriebenen `openclaw.plugin.json`-Schemas validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte Skill-Roots, Claude-Befehls-Roots, Claude-Bundle-`settings.json`-Standards, Claude-Bundle-LSP-Standards und unterstützte Hook-Packs, wenn das Layout den OpenClaw-Laufzeiterwartungen entspricht.

Jedes native OpenClaw Plugin **muss** im **Plugin-Root** eine Datei `openclaw.plugin.json` bereitstellen. OpenClaw verwendet dieses Manifest, um die Konfiguration zu validieren, **ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden als Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe den vollständigen Leitfaden zum Plugin-System: [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und den aktuellen Hinweisen zur externen Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor dein Plugin-Code geladen wird.

Verwende sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Authentifizierungs- und Onboarding-Metadaten, die ohne Starten der Plugin-Laufzeit verfügbar sein sollen
- kostengünstige Aktivierungshinweise, die Control-Plane-Oberflächen vor dem Laden der Laufzeit prüfen können
- kostengünstige Setup-Deskriptoren, die Setup-/Onboarding-Oberflächen vor dem Laden der Laufzeit prüfen können
- Alias- und Auto-Enable-Metadaten, die vor dem Laden der Plugin-Laufzeit aufgelöst werden sollen
- Kurzschreibweise-Metadaten zur Besitzerschaft von Modellfamilien, die das Plugin vor dem Laden der Laufzeit automatisch aktivieren sollen
- statische Snapshots zur Besitzerschaft von Fähigkeiten, die für gebündelte Kompatibilitätsverdrahtung und Vertragsabdeckung verwendet werden
- kostengünstige QA-Runner-Metadaten, die der gemeinsame `openclaw qa`-Host vor dem Laden der Plugin-Laufzeit prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden sollen, ohne die Laufzeit zu laden
- Hinweise für die Konfigurations-UI

Verwende sie nicht für:

- das Registrieren von Laufzeitverhalten
- das Deklarieren von Code-Entrypoints
- npm-Installationsmetadaten

Diese gehören in deinen Plugin-Code und in `package.json`.

## Minimales Beispiel

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Umfangreiches Beispiel

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Referenz für Felder der obersten Ebene

| Feld                                | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                    |
| ----------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                        |
| `configSchema`                      | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                     |
| `enabledByDefault`                  | Nein         | `true`                           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lasse das Feld weg oder setze einen beliebigen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.                  |
| `legacyPluginIds`                   | Nein         | `string[]`                       | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                      |
| `autoEnableWhenConfiguredProviders` | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modell-Referenzen sie erwähnen.                                                                                |
| `kind`                              | Nein         | `"memory"` \| `"context-engine"` | Deklariert einen exklusiven Plugin-Typ, der von `plugins.slots.*` verwendet wird.                                                                                                                           |
| `channels`                          | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Werden für Erkennung und Konfigurationsvalidierung verwendet.                                                                                                         |
| `providers`                         | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                     |
| `modelSupport`                      | Nein         | `object`                         | Manifest-eigene Kurzschreibweise-Metadaten für Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                  |
| `providerEndpoints`                 | Nein         | `object[]`                       | Manifest-eigene Metadaten zu Endpoint-Hosts/-`baseUrl` für Provider-Routen, die der Core vor dem Laden der Provider-Laufzeit klassifizieren muss.                                                          |
| `cliBackends`                       | Nein         | `string[]`                       | IDs von CLI-Inferenz-Backends, die diesem Plugin gehören. Werden für die automatische Aktivierung beim Start anhand expliziter Konfigurationsreferenzen verwendet.                                          |
| `syntheticAuthRefs`                 | Nein         | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren Plugin-eigener Synthetic-Auth-Hook während der kalten Modellerkennung geprüft werden soll, bevor die Laufzeit geladen wird.                                   |
| `nonSecretAuthMarkers`              | Nein         | `string[]`                       | Platzhalterwerte für API-Schlüssel, die einem gebündelten Plugin gehören und einen nicht geheimen lokalen, OAuth- oder ambienten Anmeldezustand repräsentieren.                                            |
| `commandAliases`                    | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                   |
| `providerAuthEnvVars`               | Nein         | `Record<string, string[]>`       | Kostengünstige Metadaten zu Provider-Auth-Umgebungsvariablen, die OpenClaw ohne Laden von Plugin-Code prüfen kann.                                                                                         |
| `providerAuthAliases`               | Nein         | `Record<string, string>`         | Provider-IDs, die für die Auth-Suche eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider teilt. |
| `channelEnvVars`                    | Nein         | `Record<string, string[]>`       | Kostengünstige Metadaten zu Kanal-Umgebungsvariablen, die OpenClaw ohne Laden von Plugin-Code prüfen kann. Verwende dies für env-gesteuerte Kanal-Einrichtungs- oder Auth-Oberflächen, die generische Start-/Konfigurationshilfen sehen sollen. |
| `providerAuthChoices`               | Nein         | `object[]`                       | Kostengünstige Metadaten zu Auth-Auswahlmöglichkeiten für Onboarding-Auswähler, bevorzugte Provider-Auflösung und einfache CLI-Flag-Verdrahtung.                                                           |
| `activation`                        | Nein         | `object`                         | Kostengünstige Aktivierungshinweise für provider-, befehls-, kanal-, routen- und fähigkeitsgesteuertes Laden. Nur Metadaten; die tatsächliche Laufzeitlogik bleibt im Plugin.                             |
| `setup`                             | Nein         | `object`                         | Kostengünstige Setup-/Onboarding-Deskriptoren, die Erkennungs- und Setup-Oberflächen ohne Laden der Plugin-Laufzeit prüfen können.                                                                        |
| `qaRunners`                         | Nein         | `object[]`                       | Kostengünstige QA-Runner-Deskriptoren, die vom gemeinsamen `openclaw qa`-Host vor dem Laden der Plugin-Laufzeit verwendet werden.                                                                         |
| `contracts`                         | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeiten für Sprach-, Echtzeit-Transkriptions-, Echtzeit-Sprach-, Media-Understanding-, Bildgenerierungs-, Musikgenerierungs-, Videogenerierungs-, Web-Fetch-, Web-Suche- und Tool-Besitzerschaft. |
| `channelConfigs`                    | Nein         | `Record<string, object>`         | Manifest-eigene Kanal-Konfigurationsmetadaten, die vor dem Laden der Laufzeit in Erkennungs- und Validierungsoberflächen zusammengeführt werden.                                                           |
| `skills`                            | Nein         | `string[]`                       | Skill-Verzeichnisse, die relativ zum Plugin-Root geladen werden.                                                                                                                                             |
| `name`                              | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                |
| `description`                       | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                             |
| `version`                           | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                  |
| `uiHints`                           | Nein         | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Sensitivitätshinweise für Konfigurationsfelder.                                                                                                                          |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahlmöglichkeit.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                   |
| --------------------- | ------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                   |
| `method`              | Ja           | `string`                                        | Auth-Methoden-ID, an die weitergeleitet wird.                                                               |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Auswahl-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                              |
| `choiceLabel`         | Nein         | `string`                                        | Für Benutzer sichtbare Bezeichnung. Wenn ausgelassen, verwendet OpenClaw stattdessen `choiceId`.           |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für den Auswähler.                                                                         |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswählern früher sortiert.                 |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistenten-Auswählern aus, erlaubt aber weiterhin die manuelle Auswahl per CLI.    |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Veraltete Auswahl-IDs, die Benutzer auf diese Ersatzauswahl umleiten sollen.                               |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlmöglichkeiten.                                        |
| `groupLabel`          | Nein         | `string`                                        | Für Benutzer sichtbare Bezeichnung dieser Gruppe.                                                           |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                            |
| `optionKey`           | Nein         | `string`                                        | Interner Option-Key für einfache Auth-Abläufe mit nur einem Flag.                                           |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, zum Beispiel `--openrouter-api-key`.                                                    |
| `cliOption`           | Nein         | `string`                                        | Vollständige CLI-Optionsform, zum Beispiel `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                          |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn ausgelassen, ist der Standardwert `["text-inference"]`. |

## Referenz für `commandAliases`

Verwende `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen besitzt, den Benutzer versehentlich in `plugins.allow` eintragen oder als Root-CLI-Befehl ausführen könnten. OpenClaw verwendet diese Metadaten für Diagnosen, ohne Plugin-Laufzeitcode zu importieren.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Feld         | Erforderlich | Typ               | Bedeutung                                                                     |
| ------------ | ------------ | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                     |
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.       |
| `cliCommand` | Nein         | `string`          | Zugehöriger Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen werden soll, falls vorhanden. |

## Referenz für `activation`

Verwende `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Control-Plane-Ereignisse es später aktivieren sollen.

## Referenz für `qaRunners`

Verwende `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb des gemeinsamen `openclaw qa`-Roots beiträgt. Halte diese Metadaten kostengünstig und statisch; die eigentliche CLI-Registrierung bleibt weiterhin in der Plugin-Laufzeit über eine schlanke `runtime-api.ts`-Oberfläche, die `qaRunnerCliRegistrations` exportiert.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Feld          | Erforderlich | Typ      | Bedeutung                                                             |
| ------------- | ------------ | -------- | --------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl, der unter `openclaw qa` eingehängt wird, zum Beispiel `matrix`. |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

Dieser Block enthält nur Metadaten. Er registriert kein Laufzeitverhalten und ersetzt nicht `register(...)`, `setupEntry` oder andere Laufzeit-/Plugin-Entrypoints. Aktuelle Verbraucher verwenden ihn als Eingrenzungshinweis vor breiterem Plugin-Laden; fehlende Aktivierungsmetadaten kosten daher meist nur Performance und sollten die Korrektheit nicht verändern, solange Fallbacks für veraltete Manifest-Besitzerschaft noch existieren.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Feld             | Erforderlich | Typ                                                  | Bedeutung                                                        |
| ---------------- | ------------ | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `onProviders`    | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin bei Anforderung aktivieren sollen. |
| `onCommands`     | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin aktivieren sollen.                |
| `onChannels`     | Nein         | `string[]`                                           | Kanal-IDs, die dieses Plugin aktivieren sollen.                  |
| `onRoutes`       | Nein         | `string[]`                                           | Routen-Arten, die dieses Plugin aktivieren sollen.               |
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Fähigkeitshinweise, die von der Control-Plane-Aktivierungsplanung verwendet werden. |

Aktuelle Live-Verbraucher:

- befehlsgesteuerte CLI-Planung greift auf veraltete `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- kanalgetriggerte Setup-/Kanal-Planung greift auf veraltete Besitzerschaft über `channels[]` zurück, wenn explizite Kanal-Aktivierungsmetadaten fehlen
- providergetriggerte Setup-/Laufzeitplanung greift auf veraltete Besitzerschaft über `providers[]` und `cliBackends[]` auf oberster Ebene zurück, wenn explizite Provider-Aktivierungsmetadaten fehlen

## Referenz für `setup`

Verwende `setup`, wenn Setup- und Onboarding-Oberflächen kostengünstige plugin-eigene Metadaten benötigen, bevor die Laufzeit geladen wird.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` auf oberster Ebene bleibt gültig und beschreibt weiterhin CLI-Inferenz-Backends. `setup.cliBackends` ist die Setup-spezifische Deskriptor-Oberfläche für Control-Plane-/Setup-Abläufe, die reine Metadaten bleiben sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte Deskriptor-First-Lookup-Oberfläche für die Setup-Erkennung. Wenn der Deskriptor das Kandidaten-Plugin nur eingrenzt und das Setup weiterhin umfangreichere Laufzeit-Hooks zur Setup-Zeit benötigt, setze `requiresRuntime: true` und lasse `setup-api` als Fallback-Ausführungspfad bestehen.

Da die Setup-Suche plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte Werte in `setup.providers[].id` und `setup.cliBackends[]` über alle erkannten Plugins hinweg eindeutig bleiben. Mehrdeutige Besitzerschaft schlägt fail-closed fehl, anstatt anhand der Erkennungsreihenfolge einen Gewinner auszuwählen.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                  |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding bereitgestellt wird. Halte normalisierte IDs global eindeutig. |
| `authMethods` | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Provider unterstützt, ohne die vollständige Laufzeit zu laden. |
| `envVars`     | Nein         | `string[]` | Umgebungsvariablen, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                         |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding bereitgestellt werden.             |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für Deskriptor-First-Setup-Lookups verwendet werden. Halte normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins gehören.              |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach dem Deskriptor-Lookup weiterhin eine `setup-api`-Ausführung benötigt.         |

## Referenz für `uiHints`

`uiHints` ist eine Zuordnung von Konfigurationsfeldnamen zu kleinen Rendering-Hinweisen.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Jeder Feldhinweis kann Folgendes enthalten:

| Feld          | Typ        | Bedeutung                                  |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Für Benutzer sichtbare Feldbezeichnung.    |
| `help`        | `string`   | Kurzer Hilfetext.                          |
| `tags`        | `string[]` | Optionale UI-Tags.                         |
| `advanced`    | `boolean`  | Kennzeichnet das Feld als erweitert.       |
| `sensitive`   | `boolean`  | Kennzeichnet das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.      |

## Referenz für `contracts`

Verwende `contracts` nur für statische Metadaten zur Besitzerschaft von Fähigkeiten, die OpenClaw lesen kann, ohne die Plugin-Laufzeit zu importieren.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Jede Liste ist optional:

| Feld                             | Typ        | Bedeutung                                                           |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs von Sprach-Providern, die diesem Plugin gehören.                |
| `realtimeTranscriptionProviders` | `string[]` | IDs von Providern für Echtzeit-Transkription, die diesem Plugin gehören. |
| `realtimeVoiceProviders`         | `string[]` | IDs von Providern für Echtzeit-Sprachfunktionen, die diesem Plugin gehören. |
| `mediaUnderstandingProviders`    | `string[]` | IDs von Providern für Media Understanding, die diesem Plugin gehören. |
| `imageGenerationProviders`       | `string[]` | IDs von Bildgenerierungs-Providern, die diesem Plugin gehören.      |
| `videoGenerationProviders`       | `string[]` | IDs von Videogenerierungs-Providern, die diesem Plugin gehören.     |
| `webFetchProviders`              | `string[]` | IDs von Web-Fetch-Providern, die diesem Plugin gehören.             |
| `webSearchProviders`             | `string[]` | IDs von Web-Such-Providern, die diesem Plugin gehören.              |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für gebündelte Vertragsprüfungen gehören. |

## Referenz für `channelConfigs`

Verwende `channelConfigs`, wenn ein Kanal-Plugin kostengünstige Konfigurationsmetadaten benötigt, bevor die Laufzeit geladen wird.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Jeder Kanaleintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanal-Konfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen/Platzhalter/Sensitivitätshinweise für diesen Kanal-Konfigurationsabschnitt. |
| `label`       | `string`                 | Kanalbezeichnung, die in Auswähl- und Inspektionsoberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                           |
| `preferOver`  | `string[]`               | Veraltete oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz für `modelSupport`

Verwende `modelSupport`, wenn OpenClaw dein Provider-Plugin aus Kurzform-Modell-IDs wie `gpt-5.4` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw verwendet dabei diese Rangfolge:

- explizite `provider/model`-Referenzen verwenden die Manifest-Metadaten des besitzenden `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn sowohl ein nicht gebündeltes Plugin als auch ein gebündeltes Plugin übereinstimmen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeiten werden ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                             |
| --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` mit Kurzform-Modell-IDs abgeglichen werden.             |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach Entfernen des Profil-Suffixes mit Kurzform-Modell-IDs abgeglichen werden. |

Veraltete Capability-Schlüssel auf oberster Ebene sind deprecated. Verwende `openclaw doctor --fix`, um `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; das normale Laden des Manifests behandelt diese Felder auf oberster Ebene nicht mehr als Besitzerschaft von Fähigkeiten.

## Manifest im Vergleich zu `package.json`

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwende sie für                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Erkennung, Konfigurationsvalidierung, Metadaten zu Auth-Auswahlmöglichkeiten und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Abhängigkeitsinstallation und den `openclaw`-Block, der für Entrypoints, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn du dir unsicher bist, wohin ein Metadatum gehört, verwende diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Entry-Dateien oder das npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die die Erkennung beeinflussen

Einige Plugin-Metadaten vor der Laufzeit befinden sich absichtlich in `package.json` unter dem `openclaw`-Block statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                     |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Entrypoints.                                                                                                         |
| `openclaw.setupEntry`                                             | Leichtgewichtiger Setup-only-Entrypoint, der während Onboarding und verzögertem Kanalstart verwendet wird.                                   |
| `openclaw.channel`                                                | Kostengünstige Kanal-Katalogmetadaten wie Bezeichnungen, Doku-Pfade, Aliasse und Auswahltexte.                                               |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für einen Checker des konfigurierten Zustands, der „existiert bereits ein nur per env eingerichtetes Setup?“ beantworten kann, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für einen Checker persistierter Auth-Zustände, der „ist bereits irgendwo angemeldet?“ beantworten kann, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installations-/Update-Hinweise für gebündelte und extern veröffentlichte Plugins.                                                             |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                             |
| `openclaw.install.minHostVersion`                                 | Minimale unterstützte OpenClaw-Host-Version, unter Verwendung einer Semver-Untergrenze wie `>=2026.3.22`.                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen eng begrenzten Wiederherstellungspfad zur Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Ermöglicht, dass Setup-only-Kanaloberflächen beim Start vor dem vollständigen Kanal-Plugin geladen werden.                                   |

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das Plugin auf älteren Hosts.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es macht nicht beliebige fehlerhafte Konfigurationen installierbar. Derzeit erlaubt es Installationsabläufen nur, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa einem fehlenden gebündelten Plugin-Pfad oder einem veralteten `channels.<id>`-Eintrag für dasselbe gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die Installation und verweisen Betreiber auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein kleines Checker-Modul:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Verwende dies, wenn Setup-, Doctor- oder Abläufe für den konfigurierten Zustand eine kostengünstige Ja/Nein-Auth-Prüfung benötigen, bevor das vollständige Kanal-Plugin geladen wird. Das Ziel-Export sollte eine kleine Funktion sein, die nur persistierten Zustand liest; führe sie nicht über das vollständige Kanal-Laufzeit-Barrel.

`openclaw.channel.configuredState` folgt derselben Form für kostengünstige Prüfungen eines nur per env konfigurierten Zustands:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Verwende dies, wenn ein Kanal den konfigurierten Zustand aus env oder anderen kleinen Nicht-Laufzeit-Eingaben beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung oder die echte Kanal-Laufzeit benötigt, belasse diese Logik stattdessen im Plugin-Hook `config.hasConfiguredState`.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig, zum Beispiel `{ "type": "object", "additionalProperties": false }`.
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, es sei denn, die Kanal-ID ist durch ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*` müssen auf **erkennbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein fehlerhaftes oder fehlendes Manifest oder Schema hat, schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und in Doctor sowie den Logs wird eine **Warnung** angezeigt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration) für das vollständige `plugins.*`-Schema.

## Hinweise

- Das Manifest ist **für native OpenClaw Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge.
- Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der Erkennung und Validierung.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, nachgestellte Kommas und Schlüssel ohne Anführungszeichen zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifest-Felder werden vom Manifest-Loader gelesen. Vermeide es, hier benutzerdefinierte Schlüssel auf oberster Ebene hinzuzufügen.
- `providerAuthEnvVars` ist der kostengünstige Metadatenpfad für Auth-Prüfungen, die Validierung von env-Markern und ähnliche Provider-Auth-Oberflächen, die die Plugin-Laufzeit nicht starten sollten, nur um env-Namen zu prüfen.
- `providerAuthAliases` ermöglicht es Provider-Varianten, die Auth-Umgebungsvariablen, Auth-Profile, konfigurationsgestützte Authentifizierung und die API-Key-Onboarding-Auswahl eines anderen Providers wiederzuverwenden, ohne diese Beziehung im Core fest zu codieren.
- `providerEndpoints` ermöglicht es Provider-Plugins, einfache Metadaten zum Abgleich von Endpoint-Host/`baseUrl` zu besitzen. Verwende es nur für Endpoint-Klassen, die der Core bereits unterstützt; das Laufzeitverhalten bleibt weiterhin im Plugin.
- `syntheticAuthRefs` ist der kostengünstige Metadatenpfad für plugin-eigene Synthetic-Auth-Hooks, die für die kalte Modellerkennung sichtbar sein müssen, bevor die Laufzeit-Registry existiert. Liste nur Referenzen auf, deren Laufzeit-Provider oder CLI-Backend tatsächlich `resolveSyntheticAuth` implementiert.
- `nonSecretAuthMarkers` ist der kostengünstige Metadatenpfad für Platzhalter-API-Schlüssel, die einem gebündelten Plugin gehören, etwa Marker für lokale, OAuth- oder ambiente Anmeldedaten. Der Core behandelt diese für die Anzeige von Authentifizierung und Secret-Audits als nicht geheim, ohne den besitzenden Provider fest zu codieren.
- `channelEnvVars` ist der kostengünstige Metadatenpfad für Shell-env-Fallback, Setup-Prompts und ähnliche Kanal-Oberflächen, die die Plugin-Laufzeit nicht starten sollten, nur um env-Namen zu prüfen.
- `providerAuthChoices` ist der kostengünstige Metadatenpfad für Auth-Auswahl-Auswähler, die Auflösung von `--auth-choice`, bevorzugte Provider-Zuordnung und die einfache CLI-Flag-Registrierung für das Onboarding, bevor die Provider-Laufzeit geladen wird. Für Laufzeit-Wizard-Metadaten, die Provider-Code erfordern, siehe [Provider-Laufzeit-Hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Typen werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird über `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird über `plugins.slots.contextEngine` ausgewählt
    (Standard: eingebautes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein Plugin sie nicht benötigt.
- Wenn dein Plugin von nativen Modulen abhängt, dokumentiere die Build-Schritte und alle Anforderungen an Allowlists des Paketmanagers, zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`.

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — erste Schritte mit Plugins
- [Plugin-Architektur](/de/plugins/architecture) — interne Architektur
- [SDK-Übersicht](/de/plugins/sdk-overview) — Referenz zum Plugin-SDK
