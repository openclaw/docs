---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Konfigurationsschema für ein Plugin bereitstellen oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest- und JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-22T04:24:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (`openclaw.plugin.json`)

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das Standard-Layout von Claude-Komponenten
  ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch nicht
gegen das hier beschriebene Schema von `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten plus deklarierte
Skill-Roots, Claude-Command-Roots, Standardwerte aus `settings.json` von Claude-Bundles,
Claude-Bundle-LSP-Standardwerte und unterstützte Hook-Packs, wenn das Layout zu den
Laufzeiterwartungen von OpenClaw passt.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** enthalten. OpenClaw verwendet dieses Manifest, um die Konfiguration
zu validieren, **ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe den vollständigen Leitfaden zum Plugin-System: [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und den aktuellen Hinweisen zur externen Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor Ihr
Plugin-Code geladen wird.

Verwenden Sie sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Auth- und Onboarding-Metadaten, die verfügbar sein sollen, ohne die Plugin-
  Laufzeit zu starten
- kostengünstige Aktivierungshinweise, die Control-Plane-Oberflächen vor dem Laden der Laufzeit prüfen können
- kostengünstige Setup-Deskriptoren, die Setup-/Onboarding-Oberflächen vor dem Laden der Laufzeit prüfen können
- Alias- und Auto-Enable-Metadaten, die aufgelöst werden sollen, bevor die Plugin-Laufzeit geladen wird
- Kurzform-Metadaten zur Besitzerschaft von Modellfamilien, die das
  Plugin vor dem Laden der Laufzeit automatisch aktivieren sollen
- statische Snapshots zur Besitzerschaft von Fähigkeiten, die für gebündelte Compat-Verdrahtung und Vertragsabdeckung verwendet werden
- kostengünstige QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa` prüfen kann,
  bevor die Plugin-Laufzeit geladen wird
- channel-spezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden sollen, ohne die Laufzeit zu laden
- Hinweise für die Konfigurations-UI

Verwenden Sie sie nicht für:

- Registrierung von Laufzeitverhalten
- Deklaration von Code-Entry-Points
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
| `enabledByDefault`                  | Nein         | `true`                           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg oder setzen Sie einen beliebigen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.              |
| `legacyPluginIds`                   | Nein         | `string[]`                       | Legacy-IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                          |
| `autoEnableWhenConfiguredProviders` | Nein         | `string[]`                       | Anbieter-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modell-Refs sie erwähnen.                                                                                      |
| `kind`                              | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                             |
| `channels`                          | Nein         | `string[]`                       | Channel-IDs, die diesem Plugin gehören. Werden für Erkennung und Konfigurationsvalidierung verwendet.                                                                                                       |
| `providers`                         | Nein         | `string[]`                       | Anbieter-IDs, die diesem Plugin gehören.                                                                                                                                                                     |
| `modelSupport`                      | Nein         | `object`                         | Manifest-eigene Kurzform-Metadaten zu Modellfamilien, die zum automatischen Laden des Plugins vor der Laufzeit verwendet werden.                                                                            |
| `providerEndpoints`                 | Nein         | `object[]`                       | Manifest-eigene Endpunkt-Metadaten zu Host/Base-URL für Anbieterrouten, die der Core klassifizieren muss, bevor die Anbieter-Laufzeit geladen wird.                                                        |
| `cliBackends`                       | Nein         | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Werden für automatische Aktivierung beim Start aus expliziten Konfigurations-Refs verwendet.                                                           |
| `syntheticAuthRefs`                 | Nein         | `string[]`                       | Anbieter- oder CLI-Backend-Refs, deren anbietereigener synthetischer Auth-Hook bei kalter Modellerkennung geprüft werden soll, bevor die Laufzeit geladen wird.                                            |
| `nonSecretAuthMarkers`              | Nein         | `string[]`                       | Platzhalter-API-Key-Werte gebündelter Plugins, die einen nicht geheimen lokalen, OAuth- oder ambienten Anmeldedatenstatus repräsentieren.                                                                  |
| `commandAliases`                    | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                   |
| `providerAuthEnvVars`               | Nein         | `Record<string, string[]>`       | Kostengünstige env-Metadaten zur Anbieter-Authentifizierung, die OpenClaw ohne Laden des Plugin-Codes prüfen kann.                                                                                         |
| `providerAuthAliases`               | Nein         | `Record<string, string>`         | Anbieter-IDs, die für den Auth-Lookup die Authentifizierung einer anderen Anbieter-ID wiederverwenden sollen, zum Beispiel ein Coding-Anbieter, der denselben API-Schlüssel und dieselben Auth-Profile teilt. |
| `channelEnvVars`                    | Nein         | `Record<string, string[]>`       | Kostengünstige env-Metadaten für Channels, die OpenClaw ohne Laden des Plugin-Codes prüfen kann. Verwenden Sie dies für env-gesteuerte Channel-Einrichtung oder Auth-Oberflächen, die generische Start-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`               | Nein         | `object[]`                       | Kostengünstige Auth-Auswahl-Metadaten für Onboarding-Auswahlen, Auflösung bevorzugter Anbieter und einfache CLI-Flag-Verdrahtung.                                                                          |
| `activation`                        | Nein         | `object`                         | Kostengünstige Aktivierungshinweise für provider-, befehls-, channel-, routen- und fähigkeitsgesteuertes Laden. Nur Metadaten; die eigentliche Logik bleibt bei der Plugin-Laufzeit.                    |
| `setup`                             | Nein         | `object`                         | Kostengünstige Setup-/Onboarding-Deskriptoren, die Erkennungs- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                    |
| `qaRunners`                         | Nein         | `object[]`                       | Kostengünstige QA-Runner-Deskriptoren, die vom gemeinsamen Host `openclaw qa` verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                   |
| `contracts`                         | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeiten für Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Media-Understanding, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Besitzerschaft. |
| `channelConfigs`                    | Nein         | `Record<string, object>`         | Manifest-eigene Metadaten zur Channel-Konfiguration, die vor dem Laden der Laufzeit in Erkennungs- und Validierungsoberflächen zusammengeführt werden.                                                     |
| `skills`                            | Nein         | `string[]`                       | Skill-Verzeichnisse, relativ zum Plugin-Root zu laden.                                                                                                                                                      |
| `name`                              | Nein         | `string`                         | Für Menschen lesbarer Plugin-Name.                                                                                                                                                                           |
| `description`                       | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                             |
| `version`                           | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                  |
| `uiHints`                           | Nein         | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Sensitivitätshinweise für Konfigurationsfelder.                                                                                                                          |

## Referenz zu `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Anbieter-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                  |
| --------------------- | ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Anbieter-ID, zu der diese Auswahl gehört.                                                                  |
| `method`              | Ja           | `string`                                        | ID der Auth-Methode, an die weitergeleitet werden soll.                                                    |
| `choiceId`            | Ja           | `string`                                        | Stabile ID der Auth-Auswahl, die von Onboarding- und CLI-Abläufen verwendet wird.                         |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Beschriftung. Wenn weggelassen, greift OpenClaw auf `choiceId` zurück.                    |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                          |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.                 |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistenten-Auswahlen aus, erlaubt aber weiterhin die manuelle CLI-Auswahl.        |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Legacy-IDs für Auswahlen, die Benutzer auf diese Ersatz-Auswahl umleiten sollen.                          |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlen.                                                 |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Beschriftung für diese Gruppe.                                                             |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                           |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit einem Flag.                                        |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, z. B. `--openrouter-api-key`.                                                          |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, z. B. `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                         |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | Auf welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn weggelassen, ist der Standard `["text-inference"]`. |

## Referenz zu `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen besitzt, den Benutzer
versehentlich in `plugins.allow` eintragen oder als CLI-Befehl auf Root-Ebene ausführen könnten. OpenClaw
verwendet diese Metadaten für Diagnosen, ohne Laufzeitcode des Plugins zu importieren.

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

| Feld         | Erforderlich | Typ              | Bedeutung                                                                    |
| ------------ | ------------ | ---------------- | ---------------------------------------------------------------------------- |
| `name`       | Ja           | `string`         | Befehlsname, der zu diesem Plugin gehört.                                    |
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl statt als CLI-Befehl auf Root-Ebene. |
| `cliCommand` | Nein         | `string`         | Zugehöriger CLI-Befehl auf Root-Ebene, der für CLI-Operationen vorgeschlagen werden soll, falls vorhanden. |

## Referenz zu `activation`

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Control-Plane-Ereignisse
es später aktivieren sollen.

## Referenz zu `qaRunners`

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb
des gemeinsamen Roots `openclaw qa` beiträgt. Halten Sie diese Metadaten kostengünstig und statisch; die Plugin-
Laufzeit besitzt weiterhin die eigentliche CLI-Registrierung über eine leichtgewichtige
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

| Feld          | Erforderlich | Typ      | Bedeutung                                                            |
| ------------- | ------------ | -------- | -------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl, der unter `openclaw qa` eingebunden wird, zum Beispiel `matrix`. |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

Dieser Block besteht nur aus Metadaten. Er registriert kein Laufzeitverhalten und
ersetzt nicht `register(...)`, `setupEntry` oder andere Laufzeit-/Plugin-Entry-Points.
Aktuelle Verbraucher verwenden ihn als Eingrenzungshinweis vor dem breiteren Laden von Plugins, daher
kosten fehlende Aktivierungsmetadaten normalerweise nur Leistung; sie sollten die Korrektheit
nicht verändern, solange Legacy-Fallbacks für Manifest-Besitzerschaft noch existieren.

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

| Feld             | Erforderlich | Typ                                                  | Bedeutung                                                          |
| ---------------- | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | Nein         | `string[]`                                           | Anbieter-IDs, die dieses Plugin aktivieren sollen, wenn sie angefordert werden. |
| `onCommands`     | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin aktivieren sollen.                  |
| `onChannels`     | Nein         | `string[]`                                           | Channel-IDs, die dieses Plugin aktivieren sollen.                  |
| `onRoutes`       | Nein         | `string[]`                                           | Routenarten, die dieses Plugin aktivieren sollen.                  |
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Fähigkeitshinweise, die von der Aktivierungsplanung der Control Plane verwendet werden. |

Aktuelle Live-Verbraucher:

- Die CLI-Planung bei Befehlsauslösung greift auf Legacy-
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Die setup-/channelbezogene Planung bei Channel-Auslösung greift auf Legacy-Besitzerschaft
  über `channels[]` zurück, wenn explizite Channel-Aktivierungsmetadaten fehlen
- Die setup-/laufzeitbezogene Planung bei Anbieter-Auslösung greift auf Legacy-
  Besitzerschaft über `providers[]` und `cliBackends[]` auf oberster Ebene zurück, wenn explizite Anbieter-
  Aktivierungsmetadaten fehlen

## Referenz zu `setup`

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen kostengünstige plugin-eigene Metadaten
benötigen, bevor die Laufzeit geladen wird.

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

`cliBackends` auf oberster Ebene bleibt gültig und beschreibt weiterhin CLI-Inferenz-
Backends. `setup.cliBackends` ist die Setup-spezifische Deskriptoroberfläche für
Control-Plane-/Setup-Abläufe, die nur aus Metadaten bestehen sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
Lookup-Oberfläche nach dem Prinzip „Deskriptor zuerst“ für die Setup-Erkennung. Wenn der
Deskriptor das Kandidaten-Plugin nur eingrenzt und das Setup weiterhin umfangreichere Hooks zur Setup-Zeit
benötigt, setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als
Fallback-Ausführungspfad bei.

Da der Setup-Lookup plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte
Werte in `setup.providers[].id` und `setup.cliBackends[]` über alle
erkannten Plugins hinweg eindeutig bleiben. Mehrdeutige Besitzerschaft schlägt mit Fail-Closed fehl,
anstatt einen Gewinner anhand der Erkennungsreihenfolge zu wählen.

### Referenz zu `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                  |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Ja           | `string`   | Anbieter-ID, die während Setup oder Onboarding sichtbar ist. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods` | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Anbieter unterstützt, ohne die vollständige Laufzeit zu laden. |
| `envVars`     | Nein         | `string[]` | env-Variablen, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                              |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Nein         | `object[]` | Anbieter-Setup-Deskriptoren, die während Setup und Onboarding sichtbar sind.                           |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für den Setup-Lookup nach dem Prinzip „Deskriptor zuerst“ verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins gehören.                    |
| `requiresRuntime`  | Nein         | `boolean`  | Gibt an, ob das Setup nach dem Deskriptor-Lookup weiterhin die Ausführung von `setup-api` benötigt.   |

## Referenz zu `uiHints`

`uiHints` ist eine Zuordnung von Namen von Konfigurationsfeldern zu kleinen Rendering-Hinweisen.

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
| `label`       | `string`   | Benutzerseitige Beschriftung des Felds.    |
| `help`        | `string`   | Kurzer Hilfetext.                          |
| `tags`        | `string[]` | Optionale UI-Tags.                         |
| `advanced`    | `boolean`  | Kennzeichnet das Feld als erweitert.       |
| `sensitive`   | `boolean`  | Kennzeichnet das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.      |

## Referenz zu `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Besitzerschaft von Fähigkeiten, die OpenClaw
lesen kann, ohne die Plugin-Laufzeit zu importieren.

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

| Feld                             | Typ        | Bedeutung                                                      |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Speech-Anbieter-IDs, die diesem Plugin gehören.                |
| `realtimeTranscriptionProviders` | `string[]` | Echtzeit-Transkriptionsanbieter-IDs, die diesem Plugin gehören. |
| `realtimeVoiceProviders`         | `string[]` | Echtzeit-Stimmanbieter-IDs, die diesem Plugin gehören.         |
| `mediaUnderstandingProviders`    | `string[]` | Media-Understanding-Anbieter-IDs, die diesem Plugin gehören.   |
| `imageGenerationProviders`       | `string[]` | Bildgenerierungsanbieter-IDs, die diesem Plugin gehören.       |
| `videoGenerationProviders`       | `string[]` | Videogenerierungsanbieter-IDs, die diesem Plugin gehören.      |
| `webFetchProviders`              | `string[]` | Web-Fetch-Anbieter-IDs, die diesem Plugin gehören.             |
| `webSearchProviders`             | `string[]` | Websuchanbieter-IDs, die diesem Plugin gehören.                |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für gebündelte Vertragsprüfungen gehören. |

## Referenz zu `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Channel-Plugin kostengünstige Konfigurationsmetadaten benötigt,
bevor die Laufzeit geladen wird.

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
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen/Platzhalter/Sensitivitätshinweise für diesen Abschnitt der Channel-Konfiguration. |
| `label`       | `string`                 | Channel-Beschriftung, die in Picker- und Inspect-Oberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Channel-Beschreibung für Inspect- und Katalogoberflächen.                            |
| `preferOver`  | `string[]`               | Legacy- oder Plugins mit niedrigerer Priorität, die dieser Channel in Auswahloberflächen übertreffen soll. |

## Referenz zu `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Anbieter-Plugin aus
Kurzform-Modell-IDs wie `gpt-5.4` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit
geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw verwendet diese Priorität:

- explizite `provider/model`-Refs verwenden die Manifest-Metadaten `providers` des besitzenden Plugins
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte
  Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis Benutzer oder Konfiguration einen Anbieter angeben

Felder:

| Feld            | Typ        | Bedeutung                                                                        |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden.      |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen des Profil-Suffixes gegen Kurzform-Modell-IDs abgeglichen werden. |

Legacy-Fähigkeitsschlüssel auf oberster Ebene sind veraltet. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; normales
Laden von Manifesten behandelt diese Felder auf oberster Ebene nicht mehr als Besitzerschaft von Fähigkeiten.

## Manifest versus package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Erkennung, Konfigurationsvalidierung, Metadaten für Auth-Auswahlen und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installationsabhängigkeiten und den Block `openclaw`, der für Entry-Points, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wohin ein Metadatenelement gehört, verwenden Sie diese Regel:

- wenn OpenClaw es vor dem Laden von Plugin-Code kennen muss, gehört es in `openclaw.plugin.json`
- wenn es um Paketierung, Entry-Dateien oder npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die die Erkennung beeinflussen

Einige Plugin-Metadaten vor der Laufzeit leben absichtlich in `package.json` unter dem
Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Deklariert native Plugin-Entry-Points. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Deklariert gebaute JavaScript-Laufzeit-Entry-Points für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                               |
| `openclaw.setupEntry`                                             | Leichtgewichtiger setup-only Entry-Point, der bei Onboarding, verzögertem Channel-Start und read-only Erkennung von Channel-Status/SecretRef verwendet wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                      | Deklariert den gebauten JavaScript-Setup-Entry-Point für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                              |
| `openclaw.channel`                                                | Kostengünstige Channel-Katalogmetadaten wie Beschriftungen, Dokumentationspfade, Aliase und Auswahltexte.                                                                          |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für den Prüfer des konfigurierten Status, die die Frage „existiert bereits env-only Setup?“ beantworten können, ohne die vollständige Channel-Laufzeit zu laden. |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für den Prüfer des persistierten Auth-Status, die die Frage „ist bereits etwas angemeldet?“ beantworten können, ohne die vollständige Channel-Laufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installations-/Update-Hinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                    |
| `openclaw.install.minHostVersion`                                 | Minimal unterstützte OpenClaw-Host-Version unter Verwendung einer Semver-Untergrenze wie `>=2026.3.22`.                                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Erlaubt, dass setup-only Channel-Oberflächen beim Start vor dem vollständigen Channel-Plugin geladen werden.                                                                        |

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-
Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das
Plugin auf älteren Hosts.

Channel-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Channel-Liste
oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige
Laufzeit zu laden. Der Setup-Entry sollte Channel-Metadaten plus setup-sichere Adapter für Konfiguration,
Status und Secrets bereitstellen; Netzwerk-Clients, Gateway-Listener und
Transport-Laufzeiten gehören in den Haupt-Entry-Point der Erweiterung.

Felder für Laufzeit-Entry-Points überschreiben die Paketgrenzenprüfungen für Source-
Entry-Point-Felder nicht. Zum Beispiel kann `openclaw.runtimeExtensions` einen
ausbrechenden Pfad in `openclaw.extensions` nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es
macht nicht beliebige fehlerhafte Konfigurationen installierbar. Derzeit erlaubt es nur Installations-
Abläufe, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa
einem fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten Eintrag `channels.<id>` für dasselbe
gebündelte Plugin. Nicht verwandte Konfigurationsfehler blockieren weiterhin die Installation und schicken Operatoren zu `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein kleines Prüfermodul:

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

Verwenden Sie es, wenn Setup-, Doctor- oder configured-state-Abläufe vor dem Laden des vollständigen
Channel-Plugins eine kostengünstige Ja/Nein-Auth-Prüfung benötigen. Das Zielexport sollte eine kleine
Funktion sein, die nur persistierten Zustand liest; führen Sie sie nicht über das vollständige
Laufzeit-Barrel des Channels.

`openclaw.channel.configuredState` folgt derselben Form für kostengünstige env-only-
Prüfungen des konfigurierten Status:

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

Verwenden Sie es, wenn ein Channel den konfigurierten Status aus env oder anderen kleinen
Nicht-Laufzeit-Eingaben beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung oder die echte
Channel-Laufzeit benötigt, behalten Sie diese Logik stattdessen im Hook `config.hasConfiguredState`
des Plugins.

## Erkennungspriorität (doppelte Plugin-IDs)

OpenClaw erkennt Plugins aus mehreren Roots (gebündelt, globale Installation, Workspace, explizit in der Konfiguration ausgewählte Pfade). Wenn zwei erkannte Plugins dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Priorität** beibehalten; Duplikate mit niedrigerer Priorität werden verworfen, anstatt daneben geladen zu werden.

Priorität, von hoch nach niedrig:

1. **Konfigurationsausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` festgelegt ist
2. **Gebündelt** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Globale Installation** — Plugins, die im globalen OpenClaw-Plugin-Root installiert sind
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace erkannt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich mit einer lokalen Version zu überschreiben, fixieren Sie es über `plugins.entries.<id>`, damit es durch Priorität gewinnt, statt sich auf Workspace-Erkennung zu verlassen.
- Verworfene Duplikate werden protokolliert, sodass Doctor- und Startdiagnosen auf die verworfene Kopie hinweisen können.

## Anforderungen an JSON Schema

- **Jedes Plugin muss ein JSON Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, es sei denn, die Channel-ID ist durch
  ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **erkennbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration vorhanden ist, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  es wird eine **Warnung** in Doctor + Logs angezeigt.

Siehe [Configuration reference](/de/gateway/configuration) für das vollständige Schema von `plugins.*`.

## Hinweise

- Das Manifest ist **erforderlich für native OpenClaw-Plugins**, einschließlich lokaler Dateisystem-Ladevorgänge.
- Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest ist nur für
  Erkennung + Validierung vorgesehen.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, nachgestellte Kommata und
  unquotierte Schlüssel zulässig, solange der Endwert weiterhin ein Objekt ist.
- Der Manifest-Loader liest nur dokumentierte Manifestfelder. Vermeiden Sie es,
  hier benutzerdefinierte Schlüssel auf oberster Ebene hinzuzufügen.
- `providerAuthEnvVars` ist der kostengünstige Metadatenpfad für Auth-Prüfungen, env-Marker-
  Validierung und ähnliche Oberflächen für Anbieter-Authentifizierung, die nicht die Plugin-
  Laufzeit starten sollten, nur um env-Namen zu prüfen.
- `providerAuthAliases` ermöglicht es Anbietervarianten, die Auth-
  env-Variablen, Auth-Profile, konfigurationsgestützte Authentifizierung und die
  Onboarding-Auswahl per API-Schlüssel eines anderen Anbieters wiederzuverwenden, ohne diese Beziehung im Core fest zu codieren.
- `providerEndpoints` ermöglicht Anbieter-Plugins, einfache Metadaten für Endpoint-
  Host-/Base-URL-Abgleich zu verwalten. Verwenden Sie dies nur für Endpoint-Klassen, die der Core bereits unterstützt;
  das Laufzeitverhalten bleibt beim Plugin.
- `syntheticAuthRefs` ist der kostengünstige Metadatenpfad für anbietereigene synthetische
  Auth-Hooks, die für kalte Modellerkennung sichtbar sein müssen, bevor die Laufzeit-
  Registry existiert. Listen Sie nur Refs auf, deren Laufzeit-Anbieter oder CLI-Backend tatsächlich
  `resolveSyntheticAuth` implementiert.
- `nonSecretAuthMarkers` ist der kostengünstige Metadatenpfad für Platzhalter-API-Schlüssel
  gebündelter Plugins wie Marker für lokale, OAuth- oder ambiente Anmeldedaten.
  Der Core behandelt diese als Nicht-Geheimnisse für die Anzeige von Authentifizierung und Secret-Audits, ohne den besitzenden Anbieter fest zu codieren.
- `channelEnvVars` ist der kostengünstige Metadatenpfad für Shell-env-Fallback, Setup-
  Prompts und ähnliche Channel-Oberflächen, die nicht die Plugin-Laufzeit starten sollten,
  nur um env-Namen zu prüfen. env-Namen sind Metadaten, keine Aktivierung an sich:
  Status, Audit, Validierung von Cron-Zustellung und andere read-only-
  Oberflächen wenden weiterhin Plugin-Vertrauen und wirksame Aktivierungsrichtlinien an, bevor sie
  eine env-Variable als konfigurierten Channel behandeln.
- `providerAuthChoices` ist der kostengünstige Metadatenpfad für Auth-Auswahl-Picker,
  Auflösung von `--auth-choice`, Zuordnung bevorzugter Anbieter und einfache Registrierung von CLI-
  Flags im Onboarding, bevor die Anbieter-Laufzeit geladen wird. Für Metadaten des Laufzeit-
  Wizards, die Anbieter-Code benötigen, siehe
  [Provider runtime hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird über `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird über `plugins.slots.contextEngine`
    ausgewählt (Standard: eingebautes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein
  Plugin sie nicht benötigt.
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle
  Anforderungen an Allowlists des Paketmanagers (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandt

- [Building Plugins](/de/plugins/building-plugins) — Einstieg in Plugins
- [Plugin Architecture](/de/plugins/architecture) — interne Architektur
- [SDK Overview](/de/plugins/sdk-overview) — Referenz zum Plugin-SDK
