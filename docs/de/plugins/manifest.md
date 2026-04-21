---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema bereitstellen oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-21T19:20:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304c08035724dfb1ce6349972729b621aafc00880d4d259db78c22b86e9056ba
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (`openclaw.plugin.json`)

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponenten-
  Layout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch
nicht gegen das hier beschriebene Schema für `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte
Skill-Roots, Claude-Befehls-Roots, Standardwerte aus `settings.json` von
Claude-Bundles, Claude-Bundle-LSP-Standardwerte und unterstützte Hook-Pakete,
wenn das Layout den Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** enthalten. OpenClaw verwendet dieses Manifest, um die
Konfiguration zu validieren, **ohne Plugin-Code auszuführen**. Fehlende oder
ungültige Manifeste werden als Plugin-Fehler behandelt und blockieren die
Konfigurationsvalidierung.

Den vollständigen Leitfaden zum Plugin-System finden Sie unter: [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und den aktuellen Richtlinien zur externen
Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei tut

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor es Ihren
Plugin-Code lädt.

Verwenden Sie sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Authentifizierungs- und Onboarding-Metadaten, die verfügbar sein sollen, ohne die Plugin-
  Laufzeit zu starten
- kostengünstige Aktivierungshinweise, die Control-Plane-Oberflächen vor dem Laden der Laufzeit prüfen können
- kostengünstige Einrichtungsdeskriptoren, die Setup-/Onboarding-Oberflächen vor dem Laden der Laufzeit prüfen können
- Alias- und Metadaten zur automatischen Aktivierung, die aufgelöst werden sollen, bevor die Plugin-Laufzeit lädt
- Kurzform-Metadaten zur Besitzerschaft von Modellfamilien, die das Plugin vor dem Laden der Laufzeit automatisch aktivieren sollen
- statische Snapshots der Fähigkeitszuordnung, die für gebündelte Kompatibilitätsverdrahtung und Vertragsabdeckung verwendet werden
- kostengünstige QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa` vor dem Laden der Plugin-Laufzeit prüfen kann
- kanalspezifische Konfigurationsmetadaten, die sich in Katalog- und Validierungsoberflächen einfügen sollen, ohne die Laufzeit zu laden
- Hinweise für die Konfigurations-Benutzeroberfläche

Verwenden Sie sie nicht für:

- die Registrierung von Laufzeitverhalten
- die Deklaration von Code-Einstiegspunkten
- npm-Installationsmetadaten

Diese gehören in Ihren Plugin-Code und in `package.json`.

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

| Feld                                | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                    |
| ----------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                        |
| `configSchema`                      | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                     |
| `enabledByDefault`                  | Nein         | `true`                           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie das Feld weg oder setzen Sie einen beliebigen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.        |
| `legacyPluginIds`                   | Nein         | `string[]`                       | Legacy-IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                          |
| `autoEnableWhenConfiguredProviders` | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modellreferenzen sie erwähnen.                                                                    |
| `kind`                              | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                             |
| `channels`                          | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Wird für Discovery und Konfigurationsvalidierung verwendet.                                                                                                            |
| `providers`                         | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                     |
| `modelSupport`                      | Nein         | `object`                         | Manifest-eigene Kurzform-Metadaten für Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                           |
| `providerEndpoints`                 | Nein         | `object[]`                       | Manifest-eigene Endpunkt-Metadaten zu Host/BaseUrl für Provider-Routen, die der Core vor dem Laden der Provider-Laufzeit klassifizieren muss.                                                               |
| `cliBackends`                       | Nein         | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Wird für die automatische Aktivierung beim Start aus expliziten Konfigurationsreferenzen verwendet.                                                    |
| `syntheticAuthRefs`                 | Nein         | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren plugin-eigener synthetischer Auth-Hook während der kalten Modell-Discovery vor dem Laden der Laufzeit geprüft werden soll.                                     |
| `nonSecretAuthMarkers`              | Nein         | `string[]`                       | Platzhalterwerte für API-Schlüssel, die einem gebündelten Plugin gehören und einen nicht geheimen lokalen, OAuth- oder ambienten Anmeldedatenzustand darstellen.                                            |
| `commandAliases`                    | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit Plugin-bewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                   |
| `providerAuthEnvVars`               | Nein         | `Record<string, string[]>`       | Kostengünstige Umgebungsvariablen-Metadaten für Provider-Authentifizierung, die OpenClaw ohne Laden von Plugin-Code prüfen kann.                                                                            |
| `providerAuthAliases`               | Nein         | `Record<string, string>`         | Provider-IDs, die für die Authentifizierung eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider nutzt. |
| `channelEnvVars`                    | Nein         | `Record<string, string[]>`       | Kostengünstige Umgebungsvariablen-Metadaten für Kanäle, die OpenClaw ohne Laden von Plugin-Code prüfen kann. Verwenden Sie dies für umgebungsvariablengesteuerte Kanaleinrichtung oder Auth-Oberflächen, die generische Start-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`               | Nein         | `object[]`                       | Kostengünstige Metadaten zu Authentifizierungsoptionen für Onboarding-Auswahlen, Auflösung bevorzugter Provider und einfache CLI-Flag-Verdrahtung.                                                          |
| `activation`                        | Nein         | `object`                         | Kostengünstige Aktivierungshinweise für durch Provider, Befehl, Kanal, Route und Fähigkeit ausgelöstes Laden. Nur Metadaten; die tatsächliche Logik bleibt weiterhin Eigentum der Plugin-Laufzeit.          |
| `setup`                             | Nein         | `object`                         | Kostengünstige Setup-/Onboarding-Deskriptoren, die Discovery- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                       |
| `qaRunners`                         | Nein         | `object[]`                       | Kostengünstige QA-Runner-Deskriptoren, die vom gemeinsamen Host `openclaw qa` vor dem Laden der Plugin-Laufzeit verwendet werden.                                                                           |
| `contracts`                         | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeiten für Sprachverarbeitung, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Besitzerschaft. |
| `channelConfigs`                    | Nein         | `Record<string, object>`         | Manifest-eigene Kanal-Konfigurationsmetadaten, die vor dem Laden der Laufzeit in Discovery- und Validierungsoberflächen zusammengeführt werden.                                                              |
| `skills`                            | Nein         | `string[]`                       | Zu ladende Skills-Verzeichnisse, relativ zum Plugin-Root.                                                                                                                                                    |
| `name`                              | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                |
| `description`                       | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                             |
| `version`                           | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                  |
| `uiHints`                           | Nein         | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Sensitivitätshinweise für Konfigurationsfelder.                                                                                                                           |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine einzelne Onboarding- oder Authentifizierungsoption.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                       |
| --------------------- | ------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Option gehört.                                                                        |
| `method`              | Ja           | `string`                                        | ID der Authentifizierungsmethode, an die weitergeleitet werden soll.                                            |
| `choiceId`            | Ja           | `string`                                        | Stabile ID der Authentifizierungsoption, die von Onboarding- und CLI-Abläufen verwendet wird.                  |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Bezeichnung. Falls weggelassen, verwendet OpenClaw stattdessen `choiceId`.                     |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfstext für die Auswahl.                                                                               |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.                      |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Option in Assistenten-Auswahlen aus, erlaubt aber weiterhin die manuelle Auswahl über die CLI.     |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Legacy-IDs von Optionen, die Benutzer auf diese Ersatzoption umleiten sollen.                                  |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Optionen.                                                        |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Bezeichnung für diese Gruppe.                                                                   |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfstext für die Gruppe.                                                                                |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Authentifizierungsabläufe mit einem einzelnen Flag.                     |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, zum Beispiel `--openrouter-api-key`.                                                        |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, zum Beispiel `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung für die CLI-Hilfe.                                                                                 |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Option erscheinen soll. Wenn weggelassen, wird standardmäßig `["text-inference"]` verwendet. |

## Referenz für `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen
besitzt, den Benutzer fälschlicherweise in `plugins.allow` eintragen oder als
CLI-Befehl auf Root-Ebene ausführen könnten. OpenClaw verwendet diese
Metadaten für Diagnosen, ohne den Plugin-Laufzeitcode zu importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                    |
| ------------ | ------------ | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                    |
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl statt als CLI-Befehl auf Root-Ebene. |
| `cliCommand` | Nein         | `string`          | Zugehöriger CLI-Befehl auf Root-Ebene, der für CLI-Operationen vorgeschlagen werden soll, falls vorhanden. |

## Referenz für `activation`

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann,
welche Control-Plane-Ereignisse es später aktivieren sollen.

## Referenz für `qaRunners`

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner
unterhalb des gemeinsamen Roots `openclaw qa` beiträgt. Halten Sie diese
Metadaten kostengünstig und statisch; die tatsächliche CLI-Registrierung bleibt
weiterhin Eigentum der Plugin-Laufzeit über eine leichtgewichtige
`runtime-api.ts`-Oberfläche, die `qaRunnerCliRegistrations` exportiert.

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

Dieser Block enthält nur Metadaten. Er registriert kein Laufzeitverhalten und
ersetzt nicht `register(...)`, `setupEntry` oder andere Laufzeit-/Plugin-Einstiegspunkte.
Aktuelle Verbraucher verwenden ihn als Eingrenzungshinweis vor einem breiteren
Plugin-Laden, daher kostet fehlende Aktivierungsmetadaten in der Regel nur
Leistung; die Korrektheit sollte sich nicht ändern, solange weiterhin Legacy-Fallbacks
für Manifest-Besitzerschaft existieren.

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

| Feld             | Erforderlich | Typ                                                  | Bedeutung                                                            |
| ---------------- | ------------ | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `onProviders`    | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin aktivieren sollen, wenn sie angefordert werden. |
| `onCommands`     | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin aktivieren sollen.                    |
| `onChannels`     | Nein         | `string[]`                                           | Kanal-IDs, die dieses Plugin aktivieren sollen.                      |
| `onRoutes`       | Nein         | `string[]`                                           | Route-Arten, die dieses Plugin aktivieren sollen.                    |
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Fähigkeitshinweise, die von der Control Plane für die Aktivierungsplanung verwendet werden. |

Aktuelle Live-Verbraucher:

- Befehlsausgelöste CLI-Planung greift auf Legacy-
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- kanalgetriggerte Setup-/Kanalplanung greift auf die Legacy-Besitzerschaft
  `channels[]` zurück, wenn explizite Kanal-Aktivierungsmetadaten fehlen
- providergetriggerte Setup-/Laufzeitplanung greift auf die Legacy-
  Besitzerschaft `providers[]` und das Top-Level-Element `cliBackends[]`
  zurück, wenn explizite Provider-Aktivierungsmetadaten fehlen

## Referenz für `setup`

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen vor dem Laden
der Laufzeit kostengünstige, plugin-eigene Metadaten benötigen.

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

Das Top-Level-Feld `cliBackends` bleibt gültig und beschreibt weiterhin
CLI-Inferenz-Backends. `setup.cliBackends` ist die setupspezifische
Deskriptor-Oberfläche für Control-Plane-/Setup-Abläufe, die rein metadatenbasiert
bleiben sollen.

Falls vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte,
deskriptororientierte Lookup-Oberfläche für die Setup-Discovery. Wenn der
Deskriptor das Kandidaten-Plugin nur eingrenzt und das Setup dennoch
umfangreichere Laufzeit-Hooks zur Setup-Zeit benötigt, setzen Sie
`requiresRuntime: true` und belassen Sie `setup-api` als Fallback-Ausführungspfad.

Da das Setup-Lookup plugin-eigenen `setup-api`-Code ausführen kann, müssen
normalisierte Werte in `setup.providers[].id` und `setup.cliBackends[]`
pluginübergreifend eindeutig bleiben. Mehrdeutige Besitzerschaft schlägt
geschlossen fehl, statt anhand der Discovery-Reihenfolge einen Gewinner zu wählen.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                 |
| ------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------- |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding verfügbar gemacht wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods` | Nein         | `string[]` | Setup-/Authentifizierungsmethoden-IDs, die dieser Provider unterstützt, ohne die vollständige Laufzeit zu laden. |
| `envVars`     | Nein         | `string[]` | Umgebungsvariablen, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                          |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding verfügbar gemacht werden.            |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für deskriptororientiertes Setup-Lookup verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins gehören.                |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach dem Deskriptor-Lookup weiterhin die Ausführung von `setup-api` benötigt.        |

## Referenz für `uiHints`

`uiHints` ist eine Zuordnung von Konfigurationsfeldnamen zu kleinen
Rendering-Hinweisen.

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
| `label`       | `string`   | Benutzerseitige Feldbezeichnung.         |
| `help`        | `string`   | Kurzer Hilfetext.                        |
| `tags`        | `string[]` | Optionale UI-Tags.                       |
| `advanced`    | `boolean`  | Kennzeichnet das Feld als erweitert.     |
| `sensitive`   | `boolean`  | Kennzeichnet das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.    |

## Referenz für `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Fähigkeitszuordnung,
die OpenClaw lesen kann, ohne die Plugin-Laufzeit zu importieren.

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

| Feld                             | Typ        | Bedeutung                                                         |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                   |
| `realtimeTranscriptionProviders` | `string[]` | Provider-IDs für Echtzeittranskription, die diesem Plugin gehören. |
| `realtimeVoiceProviders`         | `string[]` | Provider-IDs für Echtzeitstimme, die diesem Plugin gehören.       |
| `mediaUnderstandingProviders`    | `string[]` | Provider-IDs für Medienverständnis, die diesem Plugin gehören.    |
| `imageGenerationProviders`       | `string[]` | Provider-IDs für Bildgenerierung, die diesem Plugin gehören.      |
| `videoGenerationProviders`       | `string[]` | Provider-IDs für Videogenerierung, die diesem Plugin gehören.     |
| `webFetchProviders`              | `string[]` | Provider-IDs für Web-Fetch, die diesem Plugin gehören.            |
| `webSearchProviders`             | `string[]` | Provider-IDs für Websuche, die diesem Plugin gehören.             |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für Prüfungen gebündelter Verträge gehören. |

## Referenz für `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin vor dem Laden der
Laufzeit kostengünstige Konfigurationsmetadaten benötigt.

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

| Feld          | Typ                      | Bedeutung                                                                                      |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanal-Konfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen/Platzhalter/Sensitivitätshinweise für diesen Abschnitt der Kanal-Konfiguration. |
| `label`       | `string`                 | Kanalbezeichnung, die in Auswahl- und Inspektionsoberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                               |
| `preferOver`  | `string[]`               | Legacy- oder Plugin-IDs mit niedrigerer Priorität, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz für `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus
Kurzform-Modell-IDs wie `gpt-5.4` oder `claude-sonnet-4.6` ableiten soll, bevor
die Plugin-Laufzeit geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet dabei folgende Priorität an:

- explizite Referenzen `provider/model` verwenden die manifest-eigenen Metadaten des besitzenden `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide passen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                           |
| --------------- | ---------- | ----------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die per `startsWith` mit Kurzform-Modell-IDs abgeglichen werden.           |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen des Profil-Suffixes mit Kurzform-Modell-IDs abgeglichen werden. |

Legacy-Fähigkeitsschlüssel auf oberster Ebene sind veraltet. Verwenden Sie
`openclaw doctor --fix`, um `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` und
`webSearchProviders` unter `contracts` zu verschieben; das normale
Laden von Manifesten behandelt diese Felder auf oberster Ebene nicht mehr als
Fähigkeitszuordnung.

## Manifest im Vergleich zu `package.json`

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Metadaten zu Authentifizierungsoptionen und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und den Block `openclaw`, der für Einstiegspunkte, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wohin ein Metadatenelement gehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Einstiegsdateien oder das npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die Discovery beeinflussen

Einige Plugin-Metadaten vor der Laufzeit befinden sich absichtlich in
`package.json` unter dem Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Einstiegspunkte.                                                                                                      |
| `openclaw.setupEntry`                                             | Leichtgewichtiger, nur für Setup vorgesehener Einstiegspunkt, der beim Onboarding, verzögertem Kanalstart und bei schreibgeschützter Discovery von Kanalstatus/SecretRef verwendet wird. |
| `openclaw.channel`                                                | Kostengünstige Kanal-Katalogmetadaten wie Bezeichnungen, Dokumentationspfade, Aliasse und Auswahltexte.                                      |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für den Prüfer des konfigurierten Zustands, die beantworten können: „Existiert bereits ein nur per Umgebungsvariablen eingerichtetes Setup?“ ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für den Prüfer des persistierten Authentifizierungszustands, die beantworten können: „Ist bereits irgendetwas angemeldet?“ ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hinweise zur Installation/Aktualisierung für gebündelte und extern veröffentlichte Plugins.                                                   |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                              |
| `openclaw.install.minHostVersion`                                 | Minimal unterstützte OpenClaw-Host-Version mit einer Semver-Untergrenze wie `>=2026.3.22`.                                                   |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Erlaubt, dass Setup-only-Kanaloberflächen beim Start vor dem vollständigen Kanal-Plugin geladen werden.                                       |

`openclaw.install.minHostVersion` wird während der Installation und beim Laden
der Manifest-Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber
gültige Werte überspringen das Plugin auf älteren Hosts.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status,
Kanalliste oder SecretRef-Scans konfigurierte Konten identifizieren müssen,
ohne die vollständige Laufzeit zu laden. Der Setup-Einstiegspunkt sollte
Kanalmetadaten sowie setupsichere Adapter für Konfiguration, Status und
Geheimnisse bereitstellen; behalten Sie Netzwerkclients, Gateway-Listener und
Transport-Laufzeiten im Haupteinstiegspunkt der Erweiterung.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es
macht nicht beliebige defekte Konfigurationen installierbar. Derzeit erlaubt es
Installationsabläufen nur, sich von bestimmten veralteten Upgrade-Fehlern
gebündelter Plugins zu erholen, etwa einem fehlenden Pfad zu einem gebündelten
Plugin oder einem veralteten Eintrag `channels.<id>` für dasselbe gebündelte
Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die
Installation und verweisen Operatoren auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` sind Paketmetadaten für ein kleines
Prüfmodul:

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

Verwenden Sie dies, wenn Setup-, Doctor- oder Abläufe für den konfigurierten
Zustand vor dem Laden des vollständigen Kanal-Plugins eine kostengünstige
Ja/Nein-Prüfung der Authentifizierung benötigen. Das Zielexport sollte eine
kleine Funktion sein, die nur persistierten Zustand liest; leiten Sie dies
nicht über das vollständige Barrel der Kanal-Laufzeit.

`openclaw.channel.configuredState` folgt derselben Form für kostengünstige
Prüfungen des konfigurierten Zustands nur per Umgebungsvariablen:

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

Verwenden Sie dies, wenn ein Kanal den konfigurierten Zustand aus
Umgebungsvariablen oder anderen kleinen Nicht-Laufzeit-Eingaben beantworten
kann. Wenn die Prüfung eine vollständige Auflösung der Konfiguration oder die
echte Kanal-Laufzeit benötigt, belassen Sie diese Logik stattdessen im
Plugin-Hook `config.hasConfiguredState`.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, es sei denn, die Kanal-ID wird durch
  ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **auffindbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, bleibt die
  Konfiguration erhalten und in Doctor + Logs wird eine **Warnung** ausgegeben.

Die vollständige `plugins.*`-Schema-Referenz finden Sie unter
[Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge.
- Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur
  der Discovery und Validierung.
- Native Manifeste werden mit JSON5 geparst, daher werden Kommentare, nachgestellte Kommas und
  nicht in Anführungszeichen gesetzte Schlüssel akzeptiert, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie es,
  hier benutzerdefinierte Schlüssel auf oberster Ebene hinzuzufügen.
- `providerAuthEnvVars` ist der kostengünstige Metadatenpfad für Auth-Prüfungen, Env-Marker-
  Validierung und ähnliche Oberflächen für Provider-Authentifizierung, die die Plugin-
  Laufzeit nicht starten sollten, nur um Umgebungsvariablennamen zu prüfen.
- `providerAuthAliases` ermöglicht es Provider-Varianten, die Auth-
  Umgebungsvariablen, Auth-Profile, konfigurationsgestützte Authentifizierung und die
  API-Key-Onboarding-Option eines anderen Providers wiederzuverwenden, ohne diese Beziehung im Core fest zu codieren.
- `providerEndpoints` ermöglicht es Provider-Plugins, einfache Metadaten für das
  Abgleichen von Endpoint-Host/BaseUrl zu besitzen. Verwenden Sie dies nur für Endpoint-Klassen,
  die der Core bereits unterstützt; das Laufzeitverhalten bleibt weiterhin Eigentum des Plugins.
- `syntheticAuthRefs` ist der kostengünstige Metadatenpfad für provider-eigene synthetische
  Auth-Hooks, die für die kalte Modell-Discovery sichtbar sein müssen, bevor die Laufzeit-
  Registry existiert. Listen Sie nur Referenzen auf, deren Laufzeit-Provider oder CLI-Backend tatsächlich
  `resolveSyntheticAuth` implementiert.
- `nonSecretAuthMarkers` ist der kostengünstige Metadatenpfad für Platzhalter-API-Schlüssel,
  die gebündelten Plugins gehören, etwa Marker für lokale, OAuth- oder ambiente Anmeldedaten.
  Der Core behandelt diese für Auth-Anzeige und Secret-Audits als Nicht-Geheimnisse, ohne
  den besitzenden Provider fest zu codieren.
- `channelEnvVars` ist der kostengünstige Metadatenpfad für Shell-Env-Fallback, Setup-
  Eingabeaufforderungen und ähnliche Kanaloberflächen, die die Plugin-Laufzeit nicht starten
  sollten, nur um Umgebungsvariablennamen zu prüfen.
- `providerAuthChoices` ist der kostengünstige Metadatenpfad für Auswahlen von
  Authentifizierungsoptionen, die Auflösung von `--auth-choice`, Zuordnungen bevorzugter Provider
  und die einfache Registrierung von Onboarding-CLI-Flags, bevor die Provider-Laufzeit geladen wird. Für Metadaten von Laufzeit-Wizards,
  die Provider-Code erfordern, siehe
  [Provider-Laufzeit-Hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird durch `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird durch `plugins.slots.contextEngine`
    ausgewählt (Standard: integriertes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein
  Plugin sie nicht benötigt.
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle
  Anforderungen an die Allowlist des Paketmanagers (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — Einstieg in Plugins
- [Plugin-Architektur](/de/plugins/architecture) — interne Architektur
- [SDK-Überblick](/de/plugins/sdk-overview) — Referenz zum Plugin SDK
