---
read_when:
    - Du erstellst ein OpenClaw Plugin
    - Du musst ein Plugin-Konfigurationsschema bereitstellen oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-22T06:22:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b80735690799682939e8c8c27b6a364caa3ceadcf6319155ddeb20eb0538c313
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (`openclaw.plugin.json`)

Diese Seite gilt nur für das **native OpenClaw Plugin-Manifest**.

Kompatible Bundle-Layouts findest du unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifest-Dateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponenten-
  Layout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, aber sie werden nicht
gegen das hier beschriebene `openclaw.plugin.json`-Schema validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte
Skill-Roots, Claude-Befehls-Roots, Standardwerte aus `settings.json` für Claude-Bundles,
LSP-Standardwerte für Claude-Bundles und unterstützte Hook-Packs, wenn das Layout den
Runtime-Erwartungen von OpenClaw entspricht.

Jedes native OpenClaw Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** bereitstellen. OpenClaw verwendet dieses Manifest, um die Konfiguration
zu validieren, **ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden
als Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Die vollständige Anleitung zum Plugin-System findest du unter: [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und den aktuellen Hinweisen zur externen Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor dein
Plugin-Code geladen wird.

Verwende sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Auth- und Onboarding-Metadaten, die verfügbar sein sollen, ohne die Plugin-
  Runtime zu starten
- kostengünstige Aktivierungshinweise, die Control-Plane-Oberflächen vor dem Laden
  der Runtime prüfen können
- kostengünstige Setup-Deskriptoren, die Setup-/Onboarding-Oberflächen vor dem
  Laden der Runtime prüfen können
- Alias- und Auto-Enable-Metadaten, die aufgelöst werden sollen, bevor die Plugin-Runtime lädt
- Kurzform-Metadaten zur Eigentümerschaft von Modellfamilien, die das Plugin vor dem
  Laden der Runtime automatisch aktivieren sollen
- statische Snapshots der Fähigkeits-Eigentümerschaft, die für gebündelte Compat-
  Verdrahtung und Vertragsabdeckung verwendet werden
- kostengünstige QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa` vor dem
  Laden der Plugin-Runtime prüfen kann
- channelspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen
  zusammengeführt werden sollen, ohne die Runtime zu laden
- Hinweise für die Konfigurations-UI

Verwende sie nicht für:

- das Registrieren von Runtime-Verhalten
- das Deklarieren von Code-Einstiegspunkten
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

## Referenz der Felder auf oberster Ebene

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                   |
| ------------------------------------ | ------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                       |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                    |
| `enabledByDefault`                   | Nein         | `true`                           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lasse das Feld weg oder setze einen beliebigen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.                  |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                      |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modell-Referenzen sie erwähnen.                                                                 |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                            |
| `channels`                           | Nein         | `string[]`                       | Channel-IDs, die diesem Plugin gehören. Wird für Discovery und Konfigurationsvalidierung verwendet.                                                                                                         |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                     |
| `modelSupport`                       | Nein         | `object`                         | Dem Manifest zugeordnete Kurzform-Metadaten für Modellfamilien, die verwendet werden, um das Plugin vor der Runtime automatisch zu laden.                                                                  |
| `providerEndpoints`                  | Nein         | `object[]`                       | Dem Manifest zugeordnete Metadaten zu Endpoint-Hosts und `baseUrl` für Provider-Routen, die der Core klassifizieren muss, bevor die Provider-Runtime geladen wird.                                        |
| `cliBackends`                        | Nein         | `string[]`                       | CLI-Inference-Backend-IDs, die diesem Plugin gehören. Wird für die automatische Aktivierung beim Start aus expliziten Konfigurationsreferenzen verwendet.                                                  |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren Plugin-eigener Synthetic-Auth-Hook bei der kalten Modell-Discovery geprüft werden soll, bevor die Runtime geladen wird.                                      |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalterwerte für API-Schlüssel, die gebündelten Plugins gehören und einen nicht geheimen lokalen, OAuth- oder ambienten Zugangsdatenstatus darstellen.                                                 |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Runtime Plugin-bewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                   |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Kostengünstige Metadaten zu Provider-Auth-Umgebungsvariablen, die OpenClaw prüfen kann, ohne Plugin-Code zu laden.                                                                                         |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die für den Auth-Lookup eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider teilt. |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Kostengünstige Metadaten zu Channel-Umgebungsvariablen, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwende dies für env-gesteuerte Channel-Einrichtung oder Auth-Oberflächen, die generische Start-/Konfigurationshilfen sehen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                       | Kostengünstige Metadaten für Auth-Auswahloptionen für Onboarding-Auswahlfelder, die Auflösung bevorzugter Provider und einfache CLI-Flag-Verdrahtung.                                                      |
| `activation`                         | Nein         | `object`                         | Kostengünstige Aktivierungshinweise für provider-, befehls-, channel-, routen- und fähigkeitsausgelöstes Laden. Nur Metadaten; die Plugin-Runtime besitzt weiterhin das tatsächliche Verhalten.            |
| `setup`                              | Nein         | `object`                         | Kostengünstige Setup-/Onboarding-Deskriptoren, die Discovery- und Setup-Oberflächen prüfen können, ohne die Plugin-Runtime zu laden.                                                                      |
| `qaRunners`                          | Nein         | `object[]`                       | Kostengünstige QA-Runner-Deskriptoren, die vom gemeinsamen Host `openclaw qa` verwendet werden, bevor die Plugin-Runtime geladen wird.                                                                     |
| `contracts`                          | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeitsverträge für Speech, Echtzeit-Transkription, Echtzeit-Voice, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Eigentümerschaft. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Kostengünstige Standardwerte für Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                       |
| `channelConfigs`                     | Nein         | `Record<string, object>`         | Dem Manifest zugeordnete Channel-Konfigurationsmetadaten, die in Discovery- und Validierungsoberflächen zusammengeführt werden, bevor die Runtime geladen wird.                                            |
| `skills`                             | Nein         | `string[]`                       | Zu ladende Skills-Verzeichnisse, relativ zum Plugin-Root.                                                                                                                                                   |
| `name`                               | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                |
| `description`                        | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                             |
| `version`                            | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                  |
| `uiHints`                            | Nein         | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Hinweise zur Sensibilität für Konfigurationsfelder.                                                                                                                      |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Provider-Runtime geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                   |
| --------------------- | ------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                   |
| `method`              | Ja           | `string`                                        | ID der Auth-Methode, an die weitergeleitet wird.                                                            |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Auswahl-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                               |
| `choiceLabel`         | Nein         | `string`                                        | Nutzerseitige Beschriftung. Wenn weggelassen, verwendet OpenClaw stattdessen `choiceId`.                   |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                           |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.                  |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistenten-Auswahlen aus, erlaubt aber weiterhin die manuelle Auswahl per CLI.     |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Veraltete Auswahl-IDs, die Nutzer zu dieser Ersatz-Auswahl umleiten sollen.                                |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlen.                                                   |
| `groupLabel`          | Nein         | `string`                                        | Nutzerseitige Beschriftung für diese Gruppe.                                                                |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                            |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit nur einem Flag.                                     |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, z. B. `--openrouter-api-key`.                                                           |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, z. B. `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                          |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | Auf welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn weggelassen, wird standardmäßig `["text-inference"]` verwendet. |

## Referenz für `commandAliases`

Verwende `commandAliases`, wenn ein Plugin einen Runtime-Befehlsnamen besitzt, den Nutzer
versehentlich in `plugins.allow` eintragen oder als Root-CLI-Befehl auszuführen versuchen
könnten. OpenClaw verwendet diese Metadaten für Diagnosen, ohne Plugin-Runtime-Code zu
importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                |
| ------------ | ------------ | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                |
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.  |
| `cliCommand` | Nein         | `string`          | Zugehöriger Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen wird, falls vorhanden. |

## Referenz für `activation`

Verwende `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Control-Plane-Ereignisse
es später aktivieren sollen.

## Referenz für `qaRunners`

Verwende `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unter dem gemeinsamen
Root `openclaw qa` beisteuert. Halte diese Metadaten kostengünstig und statisch; die Plugin-
Runtime besitzt weiterhin die tatsächliche CLI-Registrierung über eine schlanke
Oberfläche `runtime-api.ts`, die `qaRunnerCliRegistrations` exportiert.

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

| Feld          | Erforderlich | Typ      | Bedeutung                                                           |
| ------------- | ------------ | -------- | ------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl unter `openclaw qa`, zum Beispiel `matrix`.             |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

Dieser Block enthält nur Metadaten. Er registriert kein Runtime-Verhalten und
ersetzt weder `register(...)`, `setupEntry` noch andere Runtime-/Plugin-Einstiegspunkte.
Aktuelle Consumer verwenden ihn als Eingrenzungshinweis vor dem umfassenderen Laden von
Plugins, daher kostet fehlende Aktivierungsmetadaten normalerweise nur Performance; die
Korrektheit sollte sich nicht ändern, solange veraltete Fallbacks für Manifest-Eigentümerschaft
noch existieren.

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
| `onProviders`    | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin aktivieren sollen, wenn sie angefordert werden. |
| `onCommands`     | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin aktivieren sollen.                |
| `onChannels`     | Nein         | `string[]`                                           | Channel-IDs, die dieses Plugin aktivieren sollen.                |
| `onRoutes`       | Nein         | `string[]`                                           | Routenarten, die dieses Plugin aktivieren sollen.                |
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Fähigkeitshinweise, die von der Control-Plane-Aktivierungsplanung verwendet werden. |

Aktuelle Live-Consumer:

- CLI-Planung, die durch Befehle ausgelöst wird, greift als Fallback auf
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- setup-/channel-Planung, die durch Channels ausgelöst wird, greift als Fallback auf die
  veraltete Eigentümerschaft `channels[]` zurück, wenn explizite Channel-Aktivierungsmetadaten fehlen
- setup-/runtime-Planung, die durch Provider ausgelöst wird, greift als Fallback auf die
  veraltete Eigentümerschaft `providers[]` und die Top-Level-Eigentümerschaft `cliBackends[]`
  zurück, wenn explizite Provider-Aktivierungsmetadaten fehlen

## Referenz für `setup`

Verwende `setup`, wenn Setup- und Onboarding-Oberflächen kostengünstige, dem Plugin
zugeordnete Metadaten benötigen, bevor die Runtime geladen wird.

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

Top-Level-`cliBackends` bleibt gültig und beschreibt weiterhin CLI-Inference-
Backends. `setup.cliBackends` ist die setupspezifische Deskriptoroberfläche für
Control-Plane-/Setup-Abläufe, die nur Metadaten bleiben sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
deskriptororientierte Lookup-Oberfläche für die Setup-Discovery. Wenn der
Deskriptor das Kandidaten-Plugin nur eingrenzt und das Setup weiterhin
umfangreichere Runtime-Hooks zur Setup-Zeit benötigt, setze
`requiresRuntime: true` und lasse `setup-api` als Fallback-Ausführungspfad
bestehen.

Da der Setup-Lookup dem Plugin zugeordneten `setup-api`-Code ausführen kann,
müssen normalisierte Werte in `setup.providers[].id` und `setup.cliBackends[]`
über alle erkannten Plugins hinweg eindeutig bleiben. Mehrdeutige
Eigentümerschaft schlägt fail-closed fehl, statt anhand der Discovery-Reihenfolge
einen Gewinner auszuwählen.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                   |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------- |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding bereitgestellt wird. Halte normalisierte IDs global eindeutig. |
| `authMethods` | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Provider unterstützt, ohne die vollständige Runtime zu laden. |
| `envVars`     | Nein         | `string[]` | Umgebungsvariablen, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Runtime geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                          |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding bereitgestellt werden.               |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für deskriptororientierten Setup-Lookup verwendet werden. Halte normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins gehören.                |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach dem Deskriptor-Lookup weiterhin die Ausführung von `setup-api` benötigt.         |

## Referenz für `uiHints`

`uiHints` ist eine Zuordnung von Konfigurationsfeldnamen zu kleinen Rendering-
Hinweisen.

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

| Feld          | Typ        | Bedeutung                                |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Nutzerseitige Feldbeschriftung.          |
| `help`        | `string`   | Kurzer Hilfetext.                        |
| `tags`        | `string[]` | Optionale UI-Tags.                       |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.         |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.    |

## Referenz für `contracts`

Verwende `contracts` nur für statische Metadaten zur Fähigkeits-Eigentümerschaft, die OpenClaw
lesen kann, ohne die Plugin-Runtime zu importieren.

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

| Feld                             | Typ        | Bedeutung                                                        |
| -------------------------------- | ---------- | ---------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                  |
| `realtimeTranscriptionProviders` | `string[]` | Echtzeit-Transkriptions-Provider-IDs, die diesem Plugin gehören. |
| `realtimeVoiceProviders`         | `string[]` | Echtzeit-Voice-Provider-IDs, die diesem Plugin gehören.          |
| `mediaUnderstandingProviders`    | `string[]` | Medienverständnis-Provider-IDs, die diesem Plugin gehören.       |
| `imageGenerationProviders`       | `string[]` | Bildgenerierungs-Provider-IDs, die diesem Plugin gehören.        |
| `videoGenerationProviders`       | `string[]` | Videogenerierungs-Provider-IDs, die diesem Plugin gehören.       |
| `webFetchProviders`              | `string[]` | Web-Fetch-Provider-IDs, die diesem Plugin gehören.               |
| `webSearchProviders`             | `string[]` | Websuch-Provider-IDs, die diesem Plugin gehören.                 |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für Prüfungen gebündelter Verträge gehören. |

## Referenz für `mediaUnderstandingProviderMetadata`

Verwende `mediaUnderstandingProviderMetadata`, wenn ein Medienverständnis-Provider
Standardmodelle, eine Fallback-Priorität für automatische Authentifizierung oder
native Dokumentunterstützung hat, die generische Core-Helfer benötigen, bevor die Runtime
geladen wird. Schlüssel müssen außerdem in `contracts.mediaUnderstandingProviders`
deklariert sein.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Jeder Provider-Eintrag kann Folgendes enthalten:

| Feld                   | Typ                                 | Bedeutung                                                                    |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medienfähigkeiten, die von diesem Provider bereitgestellt werden.            |
| `defaultModels`        | `Record<string, string>`            | Standardwerte für Fähigkeit-zu-Modell, die verwendet werden, wenn die Konfiguration kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden für den automatischen, credential-basierten Provider-Fallback früher sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.                |

## Referenz für `channelConfigs`

Verwende `channelConfigs`, wenn ein Channel-Plugin kostengünstige
Konfigurationsmetadaten benötigt, bevor die Runtime geladen wird.

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

Jeder Channel-Eintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Channel-Konfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen/Platzhalter/Hinweise zur Sensibilität für diesen Channel-Konfigurationsabschnitt. |
| `label`       | `string`                 | Channel-Beschriftung, die in Picker- und Inspect-Oberflächen zusammengeführt wird, wenn Runtime-Metadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Channel-Beschreibung für Inspect- und Katalog-Oberflächen.                           |
| `preferOver`  | `string[]`               | Veraltete oder niedriger priorisierte Plugin-IDs, die dieser Channel in Auswahloberflächen übertreffen soll. |

## Referenz für `modelSupport`

Verwende `modelSupport`, wenn OpenClaw dein Provider-Plugin aus Kurzform-
Modell-IDs wie `gpt-5.4` oder `claude-sonnet-4.6` ableiten soll, bevor die
Plugin-Runtime geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet folgende Priorität an:

- explizite Referenzen `provider/model` verwenden die Manifest-Metadaten der zugehörigen `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn sowohl ein nicht gebündeltes Plugin als auch ein gebündeltes Plugin übereinstimmen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Nutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden.    |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen des Profil-Suffixes gegen Kurzform-Modell-IDs abgeglichen werden. |

Veraltete Top-Level-Fähigkeitsschlüssel sind deprecated. Verwende `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu
verschieben; das normale Laden von Manifesten behandelt diese Top-Level-Felder
nicht mehr als Fähigkeits-Eigentümerschaft.

## Manifest im Vergleich zu `package.json`

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwende sie für                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Auth-Auswahl-Metadaten und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und den `openclaw`-Block, der für Einstiegspunkte, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn du dir nicht sicher bist, wohin ein Metadatenelement gehört, verwende diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Entry-Dateien oder das npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die Discovery beeinflussen

Einige Plugin-Metadaten vor der Runtime liegen absichtlich in `package.json` unter dem
Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                                                           |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Einstiegspunkte. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                   |
| `openclaw.runtimeExtensions`                                      | Deklariert gebaute JavaScript-Runtime-Einstiegspunkte für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                             |
| `openclaw.setupEntry`                                             | Schlanker, nur für Setup vorgesehener Einstiegspunkt, der während Onboarding, verzögertem Channel-Start und schreibgeschützter Discovery von Channel-Status/SecretRef verwendet wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                      | Deklariert den gebauten JavaScript-Setup-Einstiegspunkt für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                           |
| `openclaw.channel`                                                | Kostengünstige Channel-Katalogmetadaten wie Beschriftungen, Dokumentationspfade, Aliasse und Auswahltexte.                                                                         |
| `openclaw.channel.configuredState`                                | Schlanke Metadaten für den Checker des konfigurierten Zustands, die beantworten können: „Existiert env-only-Setup bereits?“, ohne die vollständige Channel-Runtime zu laden.      |
| `openclaw.channel.persistedAuthState`                             | Schlanke Metadaten für den Checker des persistierten Auth-Zustands, die beantworten können: „Ist bereits irgendwo etwas angemeldet?“, ohne die vollständige Channel-Runtime zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installations-/Aktualisierungshinweise für gebündelte und extern veröffentlichte Plugins.                                                                                          |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                    |
| `openclaw.install.minHostVersion`                                 | Minimale unterstützte OpenClaw-Host-Version, mit einer semver-Untergrenze wie `>=2026.3.22`.                                                                                      |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Erlaubt, dass nur für Setup vorgesehene Channel-Oberflächen vor dem vollständigen Channel-Plugin während des Starts geladen werden.                                                |

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der
Manifest-Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte
überspringen das Plugin auf älteren Hosts.

Channel-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Channel-Liste
oder SecretRef-Scans konfigurierte Accounts identifizieren müssen, ohne die vollständige
Runtime zu laden. Der Setup-Einstiegspunkt sollte Channel-Metadaten sowie setupsichere
Adapter für Konfiguration, Status und Secrets bereitstellen; halte Netzwerk-Clients,
Gateway-Listener und Transport-Runtimes im Haupteinstiegspunkt der Erweiterung.

Felder für Runtime-Einstiegspunkte überschreiben die Paketgrenzen-Prüfungen für
Quellcode-Einstiegspunktfelder nicht. Zum Beispiel kann `openclaw.runtimeExtensions`
einen ausbrechenden Pfad in `openclaw.extensions` nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es macht
nicht beliebige defekte Konfigurationen installierbar. Aktuell erlaubt es Installations-
Abläufen nur, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu
erholen, etwa von einem fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten
Eintrag `channels.<id>` für dasselbe gebündelte Plugin. Nicht zusammenhängende
Konfigurationsfehler blockieren weiterhin die Installation und schicken Operatoren zu
`openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein kleines
Checker-Modul:

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

Verwende es, wenn Setup-, Doctor- oder Configured-State-Abläufe eine
kostengünstige Ja/Nein-Auth-Prüfung benötigen, bevor das vollständige
Channel-Plugin geladen wird. Das Zielexport sollte eine kleine Funktion sein,
die nur persistierten Zustand liest; leite dies nicht über die vollständige
Barrel-Datei der Channel-Runtime.

`openclaw.channel.configuredState` folgt derselben Form für kostengünstige
Configured-Checks nur über env:

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

Verwende es, wenn ein Channel den konfigurierten Zustand aus env oder anderen
kleinen Nicht-Runtime-Eingaben beantworten kann. Wenn die Prüfung die
vollständige Konfigurationsauflösung oder die echte Channel-Runtime benötigt,
belasse diese Logik stattdessen im Hook `config.hasConfiguredState` des Plugins.

## Discovery-Priorität (doppelte Plugin-IDs)

OpenClaw erkennt Plugins aus mehreren Roots (gebündelt, globale Installation, Workspace, explizit per Konfiguration ausgewählte Pfade). Wenn zwei Funde dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Priorität** behalten; Duplikate mit niedrigerer Priorität werden verworfen, statt daneben geladen zu werden.

Priorität, von hoch nach niedrig:

1. **Per Konfiguration ausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` festgelegt ist
2. **Gebündelt** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Globale Installation** — Plugins, die in den globalen OpenClaw-Plugin-Root installiert sind
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace erkannt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich mit einem lokalen zu überschreiben, pinne es über `plugins.entries.<id>`, damit es über die Priorität gewinnt, statt dich auf Workspace-Discovery zu verlassen.
- Verworfene Duplikate werden protokolliert, damit Doctor und Startdiagnosen auf die verworfene Kopie hinweisen können.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Runtime.

## Validierungsverhalten

- Unbekannte Schlüssel in `channels.*` sind **Fehler**, außer die Channel-ID wird von
  einem Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **erkennbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, bleibt die
  Konfiguration erhalten und in Doctor + Logs wird eine **Warnung** angezeigt.

Das vollständige Schema für `plugins.*` findest du unter [Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge.
- Die Runtime lädt das Plugin-Modul weiterhin separat; das Manifest ist nur für
  Discovery + Validierung vorgesehen.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, nachgestellte Kommas und
  nicht in Anführungszeichen gesetzte Schlüssel zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifest-Felder werden vom Manifest-Loader gelesen. Vermeide es,
  hier benutzerdefinierte Top-Level-Schlüssel hinzuzufügen.
- `providerAuthEnvVars` ist der kostengünstige Metadatenpfad für Auth-Prüfungen,
  Env-Marker-Validierung und ähnliche Provider-Auth-Oberflächen, die die Plugin-
  Runtime nicht starten sollten, nur um env-Namen zu prüfen.
- `providerAuthAliases` erlaubt Provider-Varianten, die Auth-Umgebungsvariablen,
  Auth-Profile, konfigurationsgestützte Authentifizierung und die API-Key-
  Onboarding-Auswahl eines anderen Providers wiederzuverwenden, ohne diese
  Beziehung im Core fest zu codieren.
- `providerEndpoints` erlaubt Provider-Plugins, einfache Matching-Metadaten für
  Endpoint-Hosts/`baseUrl` zu besitzen. Verwende es nur für Endpoint-Klassen,
  die der Core bereits unterstützt; das Plugin besitzt weiterhin das Runtime-Verhalten.
- `syntheticAuthRefs` ist der kostengünstige Metadatenpfad für Plugin-eigene
  Synthetic-Auth-Hooks, die für kalte Modell-Discovery sichtbar sein müssen,
  bevor die Runtime-Registry existiert. Führe nur Referenzen auf, deren Runtime-
  Provider oder CLI-Backend tatsächlich `resolveSyntheticAuth` implementiert.
- `nonSecretAuthMarkers` ist der kostengünstige Metadatenpfad für Platzhalter-
  API-Keys, die gebündelten Plugins gehören, wie Marker für lokale, OAuth- oder
  ambiente Zugangsdaten. Der Core behandelt diese für die Auth-Anzeige und
  Secret-Audits als nicht geheim, ohne den zugehörigen Provider fest zu codieren.
- `channelEnvVars` ist der kostengünstige Metadatenpfad für Shell-env-Fallback,
  Setup-Prompts und ähnliche Channel-Oberflächen, die die Plugin-Runtime nicht
  starten sollten, nur um env-Namen zu prüfen. Env-Namen sind Metadaten, nicht
  selbst eine Aktivierung: Status, Audit, Cron-Zustellungsvalidierung und andere
  schreibgeschützte Oberflächen wenden weiterhin Plugin-Vertrauen und effektive
  Aktivierungsrichtlinien an, bevor sie eine env-Variable als konfigurierten
  Channel behandeln.
- `providerAuthChoices` ist der kostengünstige Metadatenpfad für Auth-Auswahlfelder,
  die Auflösung von `--auth-choice`, bevorzugte Provider-Zuordnung und einfache
  Registrierung von CLI-Flags für das Onboarding, bevor die Provider-Runtime lädt.
  Für Metadaten von Runtime-Assistenten, die Provider-Code erfordern, siehe
  [Provider-Runtime-Hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird über `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird über `plugins.slots.contextEngine`
    ausgewählt (Standard: eingebautes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein
  Plugin sie nicht benötigt.
- Wenn dein Plugin von nativen Modulen abhängt, dokumentiere die Build-Schritte und alle
  Anforderungen an Allowlists des Paketmanagers (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — Einstieg in Plugins
- [Plugin-Architektur](/de/plugins/architecture) — interne Architektur
- [SDK-Überblick](/de/plugins/sdk-overview) — Referenz zum Plugin SDK
