---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-23T06:31:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: de71b9d556c2696d3279f202b66d57aa8014e9c89d81e3f453602744120d1675
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (`openclaw.plugin.json`)

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das Standard-Component-
  Layout von Claude ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, aber sie werden nicht
gegen das hier beschriebene Schema von `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten plus deklarierte
Skill-Roots, Claude-Command-Roots, Standardwerte aus `settings.json` des Claude-Bundles,
LSP-Standardwerte des Claude-Bundles sowie unterstützte Hook-Packs, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** mitliefern. OpenClaw verwendet dieses Manifest, um die Konfiguration
zu validieren, **ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe den vollständigen Leitfaden zum Plugin-System: [Plugins](/de/tools/plugin).
Zum nativen Capability-Modell und der aktuellen Anleitung zur externen Kompatibilität:
[Capability model](/de/plugins/architecture#public-capability-model).

## Zweck dieser Datei

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor Ihr
Plugin-Code geladen wird.

Verwenden Sie sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Auth- und Onboarding-Metadaten, die verfügbar sein sollen, ohne die Plugin-
  Laufzeit zu starten
- kostengünstige Aktivierungshinweise, die Oberflächen der Control Plane vor dem Laden der Laufzeit
  prüfen können
- kostengünstige Setup-Deskriptoren, die Setup-/Onboarding-Oberflächen vor dem
  Laden der Laufzeit prüfen können
- Alias- und Auto-Enable-Metadaten, die aufgelöst werden sollen, bevor die Plugin-Laufzeit geladen wird
- Kurzform-Metadaten zur Eigentümerschaft von Modellfamilien, die das
  Plugin vor dem Laden der Laufzeit automatisch aktivieren sollen
- statische Snapshots der Capability-Eigentümerschaft, die für gebündelte Kompatibilitätsverdrahtung und
  Vertragsabdeckung verwendet werden
- kostengünstige QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa`
  vor dem Laden der Plugin-Laufzeit prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen
  zusammengeführt werden sollen, ohne die Laufzeit zu laden
- UI-Hinweise für die Konfiguration

Verwenden Sie sie nicht für:

- das Registrieren von Laufzeitverhalten
- das Deklarieren von Code-Einstiegspunkten
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

## Umfangreicheres Beispiel

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter-Provider-Plugin",
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
      "choiceLabel": "OpenRouter-API-Schlüssel",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter-API-Schlüssel",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API-Schlüssel",
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

## Referenz für Felder auf oberster Ebene

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                         |
| ------------------------------------ | ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                             |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugin.                                                                                                                                                                           |
| `enabledByDefault`                   | Nein         | `true`                           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg oder setzen Sie einen beliebigen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.                                  |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Legacy-IDs, die zu dieser kanonischen Plugin-ID normalisiert werden.                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modell-Refs sie erwähnen.                                                                                                           |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                  |
| `channels`                           | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Wird für Discovery und Konfigurationsvalidierung verwendet.                                                                                                                                |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                          |
| `modelSupport`                       | Nein         | `object`                         | Manifest-eigene Kurzform-Metadaten zu Modellfamilien, die zum automatischen Laden des Plugin vor der Laufzeit verwendet werden.                                                                                                 |
| `providerEndpoints`                  | Nein         | `object[]`                       | Manifest-eigene Metadaten zu Endpoint-Hosts/`baseUrl` für Provider-Routen, die der Core klassifizieren muss, bevor die Provider-Laufzeit geladen wird.                                                                          |
| `cliBackends`                        | Nein         | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Wird für die automatische Aktivierung beim Start aus expliziten Konfigurations-Refs verwendet.                                                                              |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Refs, deren plugin-eigener Synthetic-Auth-Hook während der Cold-Model-Discovery geprüft werden soll, bevor die Laufzeit geladen wird.                                                                |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalter-API-Key-Werte, die gebündelten Plugins gehören und einen nicht geheimen lokalen OAuth- oder Ambient-Credential-Status repräsentieren.                                                                                |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen, bevor die Laufzeit geladen wird.                                                                                  |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Kostengünstige Env-Metadaten für Provider-Auth, die OpenClaw prüfen kann, ohne Plugin-Code zu laden.                                                                                                                            |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die für den Auth-Lookup eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider teilt.                 |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Kostengünstige Env-Metadaten für Kanäle, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuerte Kanaleinrichtung oder Auth-Oberflächen, die generische Start-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                       | Kostengünstige Metadaten für Auth-Auswahl für Onboarding-Picker, Auflösung bevorzugter Provider und einfache CLI-Flag-Verdrahtung.                                                                                              |
| `activation`                         | Nein         | `object`                         | Kostengünstige Aktivierungshinweise für provider-, befehls-, kanal-, routen- und capability-ausgelöstes Laden. Nur Metadaten; die eigentliche Funktionalität gehört weiterhin der Plugin-Laufzeit.                            |
| `setup`                              | Nein         | `object`                         | Kostengünstige Setup-/Onboarding-Deskriptoren, die Discovery- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                          |
| `qaRunners`                          | Nein         | `object[]`                       | Kostengünstige QA-Runner-Deskriptoren, die vom gemeinsamen Host `openclaw qa` vor dem Laden der Plugin-Laufzeit verwendet werden.                                                                                               |
| `contracts`                          | Nein         | `object`                         | Statischer Snapshot gebündelter Capabilities für externe Auth-Hooks, Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Eigentümerschaft. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Kostengünstige Standardwerte für Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                            |
| `channelConfigs`                     | Nein         | `Record<string, object>`         | Manifest-eigene Kanal-Konfigurationsmetadaten, die in Discovery- und Validierungsoberflächen zusammengeführt werden, bevor die Laufzeit geladen wird.                                                                           |
| `skills`                             | Nein         | `string[]`                       | Skill-Verzeichnisse, die geladen werden sollen, relativ zum Plugin-Root.                                                                                                                                                         |
| `name`                               | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                                    |
| `description`                        | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                 |
| `version`                            | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                      |
| `uiHints`                            | Nein         | `Record<string, object>`         | UI-Labels, Platzhalter und Sensitivitätshinweise für Konfigurationsfelder.                                                                                                                                                       |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                  |
| --------------------- | ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                  |
| `method`              | Ja           | `string`                                        | Auth-Methoden-ID, an die weitergeleitet werden soll.                                                       |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Choice-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                               |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitiges Label. Wenn es weggelassen wird, verwendet OpenClaw stattdessen `choiceId`.              |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für den Picker.                                                                           |
| `assistantPriority`   | Nein         | `number`                                        | Kleinere Werte werden in assistentengesteuerten interaktiven Pickern früher sortiert.                      |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Verbirgt die Auswahl in Assistenten-Pickern, erlaubt aber weiterhin die manuelle Auswahl per CLI.         |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Legacy-Choice-IDs, die Benutzer zu dieser Ersatz-Auswahl umleiten sollen.                                  |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlen.                                                  |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitiges Label für diese Gruppe.                                                                   |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                           |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit nur einem Flag.                                    |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, zum Beispiel `--openrouter-api-key`.                                                   |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, zum Beispiel `--openrouter-api-key <key>`.                               |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung für die CLI-Hilfe.                                                                            |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn weggelassen, ist der Standard `["text-inference"]`. |

## Referenz für `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeitbefehlsnamen besitzt, den Benutzer
irrtümlich in `plugins.allow` eintragen oder als Root-CLI-Befehl auszuführen versuchen könnten. OpenClaw
verwendet diese Metadaten für Diagnosen, ohne Plugin-Laufzeitcode zu importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                  |
| ------------ | ------------ | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                  |
| `kind`       | Nein         | `"runtime-slash"` | Markiert den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.        |
| `cliCommand` | Nein         | `string`          | Zugehöriger Root-CLI-Befehl, den man für CLI-Operationen vorschlagen kann, falls vorhanden. |

## Referenz für `activation`

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Ereignisse der Control Plane
es später aktivieren sollen.

## Referenz für `qaRunners`

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb des
gemeinsamen Roots `openclaw qa` beiträgt. Halten Sie diese Metadaten kostengünstig und statisch; die Plugin-
Laufzeit besitzt weiterhin die eigentliche CLI-Registrierung über eine leichtgewichtige
Oberfläche `runtime-api.ts`, die `qaRunnerCliRegistrations` exportiert.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Die Docker-gestützte Matrix-Live-QA-Lane gegen einen Wegwerf-Homeserver ausführen"
    }
  ]
}
```

| Feld          | Erforderlich | Typ      | Bedeutung                                                              |
| ------------- | ------------ | -------- | ---------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl unter `openclaw qa`, zum Beispiel `matrix`.                |
| `description` | Nein         | `string` | Fallback-Hilfetext, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

Dieser Block besteht nur aus Metadaten. Er registriert kein Laufzeitverhalten und
ersetzt weder `register(...)`, `setupEntry` noch andere Laufzeit-/Plugin-Einstiegspunkte.
Aktuelle Nutzer verwenden ihn als Eingrenzungshinweis vor breiterem Plugin-Laden, daher verursachen
fehlende Aktivierungsmetadaten normalerweise nur Performancekosten; sie sollten die
Korrektheit nicht verändern, solange Legacy-Fallbacks für Manifest-Eigentümerschaft noch existieren.

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
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Capability-Hinweise, die von der Aktivierungsplanung der Control Plane verwendet werden. |

Aktuelle Live-Nutzer:

- CLI-Planung, die durch Befehle ausgelöst wird, greift auf Legacy-
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Setup-/Kanalplanung, die durch Kanäle ausgelöst wird, greift auf Legacy-Eigentümerschaft in `channels[]`
  zurück, wenn explizite Kanal-Aktivierungsmetadaten fehlen
- Setup-/Laufzeitplanung, die durch Provider ausgelöst wird, greift auf Legacy-
  `providers[]` und Top-Level-Eigentümerschaft in `cliBackends[]` zurück, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

## Referenz für `setup`

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

Das Top-Level-`cliBackends` bleibt gültig und beschreibt weiterhin CLI-Inferenz-
Backends. `setup.cliBackends` ist die setupspezifische Deskriptoroberfläche für
Abläufe der Control Plane/des Setups, die reine Metadaten bleiben sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
deskriptorbasierte Lookup-Oberfläche für Setup-Discovery. Wenn der Deskriptor nur das Kandidaten-Plugin
eingrenzt und das Setup trotzdem umfangreichere Laufzeit-Hooks zur Setup-Zeit benötigt, setzen Sie
`requiresRuntime: true` und behalten Sie `setup-api` als
Fallback-Ausführungspfad bei.

Da Setup-Lookups plugin-eigenen `setup-api`-Code ausführen können, müssen normalisierte
Werte von `setup.providers[].id` und `setup.cliBackends[]` über alle erkannten Plugins hinweg eindeutig bleiben.
Mehrdeutige Eigentümerschaft schlägt fail-closed fehl, statt einen Gewinner anhand der Discovery-Reihenfolge zu wählen.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                  |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding bereitgestellt wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods` | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Provider ohne Laden der vollständigen Laufzeit unterstützt. |
| `envVars`     | Nein         | `string[]` | Env-Variablen, die generische Setup-/Statusoberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                       |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding bereitgestellt werden.             |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für deskriptorbasiertes Setup-Lookup verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs für Konfigurationsmigrationen, die zur Setup-Oberfläche dieses Plugin gehören.               |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach dem Deskriptor-Lookup weiterhin die Ausführung von `setup-api` benötigt.      |

## Referenz für `uiHints`

`uiHints` ist eine Map von Konfigurationsfeldnamen auf kleine Render-Hinweise.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API-Schlüssel",
      "help": "Wird für OpenRouter-Anfragen verwendet",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Jeder Feldhinweis kann enthalten:

| Feld          | Typ        | Bedeutung                                |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Benutzerseitiges Feldlabel.              |
| `help`        | `string`   | Kurzer Hilfetext.                        |
| `tags`        | `string[]` | Optionale UI-Tags.                       |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.         |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.    |

## Referenz für `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Capability-Eigentümerschaft, die OpenClaw
lesen kann, ohne die Plugin-Laufzeit zu importieren.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
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

| Feld                             | Typ        | Bedeutung                                                               |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Eingebettete Laufzeit-IDs, für die ein gebündeltes Plugin Factories registrieren kann. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren externer Auth-Profile-Hook diesem Plugin gehört.    |
| `speechProviders`                | `string[]` | Sprachprovider-IDs, die diesem Plugin gehören.                          |
| `realtimeTranscriptionProviders` | `string[]` | Provider-IDs für Echtzeittranskription, die diesem Plugin gehören.      |
| `realtimeVoiceProviders`         | `string[]` | Provider-IDs für Echtzeitstimme, die diesem Plugin gehören.             |
| `mediaUnderstandingProviders`    | `string[]` | Provider-IDs für Medienverständnis, die diesem Plugin gehören.          |
| `imageGenerationProviders`       | `string[]` | Provider-IDs für Bildgenerierung, die diesem Plugin gehören.            |
| `videoGenerationProviders`       | `string[]` | Provider-IDs für Videogenerierung, die diesem Plugin gehören.           |
| `webFetchProviders`              | `string[]` | Provider-IDs für Web-Fetch, die diesem Plugin gehören.                  |
| `webSearchProviders`             | `string[]` | Provider-IDs für Websuche, die diesem Plugin gehören.                   |
| `tools`                          | `string[]` | Agent-Tool-Namen, die diesem Plugin für Prüfungen gebündelter Verträge gehören. |

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten
`contracts.externalAuthProviders` deklarieren. Plugins ohne diese Deklaration laufen weiterhin
über einen veralteten Kompatibilitätsfallback, aber dieser Fallback ist langsamer und
wird nach dem Migrationsfenster entfernt.

## Referenz für `mediaUnderstandingProviderMetadata`

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Provider für Medienverständnis
Standardmodelle, eine Priorität für Auto-Auth-Fallback oder native Dokumentunterstützung hat, die
generische Core-Helfer benötigen, bevor die Laufzeit geladen wird. Schlüssel müssen außerdem in
`contracts.mediaUnderstandingProviders` deklariert sein.

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

Jeder Provider-Eintrag kann enthalten:

| Feld                   | Typ                                 | Bedeutung                                                                   |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medien-Capabilities, die von diesem Provider bereitgestellt werden.         |
| `defaultModels`        | `Record<string, string>`            | Standardzuordnungen Capability-zu-Modell, die verwendet werden, wenn die Konfiguration kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Kleinere Zahlen werden früher für automatischen providerbasierten Credential-Fallback sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.               |

## Referenz für `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin kostengünstige Konfigurationsmetadaten benötigt, bevor
die Laufzeit geladen wird.

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
          "label": "Homeserver-URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Verbindung zum Matrix-Homeserver",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Jeder Kanaleintrag kann enthalten:

| Feld          | Typ                      | Bedeutung                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Erforderlich für jeden deklarierten Kanal-Konfigurationseintrag. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Labels/Platzhalter/Sensitivitätshinweise für diesen Kanal-Konfigurationsabschnitt. |
| `label`       | `string`                 | Kanallabel, das in Picker- und Prüfoberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Prüf- und Katalogoberflächen.                                |
| `preferOver`  | `string[]`               | Legacy- oder niedrig priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz für `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus
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

OpenClaw wendet diese Priorität an:

- explizite Refs vom Typ `provider/model` verwenden die Manifest-Metadaten `providers` des besitzenden Plugins
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide passen, gewinnt das nicht gebündelte
  Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis Benutzer oder Konfiguration einen Provider angeben

Felder:

| Feld            | Typ        | Bedeutung                                                                          |
| --------------- | ---------- | ---------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden.       |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen von Profilsuffixen gegen Kurzform-Modell-IDs abgeglichen werden. |

Legacy-Capability-Schlüssel auf Top-Level sind veraltet. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; normales
Manifest-Laden behandelt diese Top-Level-Felder nicht mehr als Capability-
Eigentümerschaft.

## Manifest versus `package.json`

Die beiden Dateien dienen unterschiedlichen Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Metadaten zur Auth-Auswahl und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installieren von Abhängigkeiten und den Block `openclaw`, der für Einstiegspunkte, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wohin ein Metadatenstück gehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Einstiegsdateien oder das npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die Discovery beeinflussen

Einige Plugin-Metadaten vor der Laufzeit leben absichtlich in `package.json` unter dem
Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                                                                |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                              | Deklariert native Plugin-Einstiegspunkte. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                        |
| `openclaw.runtimeExtensions`                                       | Deklariert gebaute JavaScript-Laufzeit-Einstiegspunkte für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                 |
| `openclaw.setupEntry`                                              | Leichtgewichtiger Einstiegspunkt nur für Setup, verwendet während Onboarding, verzögertem Kanalstart und schreibgeschützter Discovery von Kanalstatus/SecretRefs. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                       | Deklariert den gebauten JavaScript-Setup-Einstiegspunkt für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                |
| `openclaw.channel`                                                 | Kostengünstige Metadaten für den Kanal-Katalog wie Labels, Dokumentationspfade, Aliase und Text für die Auswahl.                                                                       |
| `openclaw.channel.configuredState`                                 | Leichtgewichtige Metadaten für einen Prüfer des konfigurierten Zustands, der „existiert env-only-Setup bereits?“ beantworten kann, ohne die vollständige Kanal-Laufzeit zu laden.      |
| `openclaw.channel.persistedAuthState`                              | Leichtgewichtige Metadaten für einen Prüfer des persistierten Auth-Zustands, der „ist bereits etwas angemeldet?“ beantworten kann, ohne die vollständige Kanal-Laufzeit zu laden.      |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`          | Hinweise für Installation/Aktualisierung von gebündelten und extern veröffentlichten Plugins.                                                                                           |
| `openclaw.install.defaultChoice`                                   | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                        |
| `openclaw.install.minHostVersion`                                  | Minimal unterstützte OpenClaw-Host-Version, mit einer semver-Untergrenze wie `>=2026.3.22`.                                                                                            |
| `openclaw.install.expectedIntegrity`                               | Erwartete npm-Dist-Integritätszeichenfolge wie `sha512-...`; Installations- und Aktualisierungsabläufe prüfen das geladene Artefakt dagegen.                                           |
| `openclaw.install.allowInvalidConfigRecovery`                      | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins bei ungültiger Konfiguration.                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`  | Ermöglicht das Laden kanalbezogener Oberflächen nur für Setup vor dem vollständigen Kanal-Plugin während des Starts.                                                                   |

Manifest-Metadaten entscheiden, welche Provider-/Kanal-/Setup-Optionen im
Onboarding erscheinen, bevor die Laufzeit geladen wird. `package.json#openclaw.install` teilt dem
Onboarding mit, wie dieses Plugin abgerufen oder aktiviert werden soll, wenn der Benutzer eine dieser
Optionen auswählt. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während Installation und Laden des Manifest-
Registers erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das
Plugin auf älteren Hosts.

Exaktes Pinning von npm-Versionen lebt bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Kombinieren Sie dies mit
`expectedIntegrity`, wenn Aktualisierungsabläufe fail-closed fehlschlagen sollen, falls das geladene
npm-Artefakt nicht mehr zur gepinnten Version passt. Interaktives Onboarding bietet npm-
Installationsoptionen aus vertrauenswürdigen Katalogmetadaten nur dann an, wenn `npmSpec` eine exakte Version ist und `expectedIntegrity` vorhanden ist; andernfalls greift es auf
eine lokale Quelle oder Überspringen zurück.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Kanalliste
oder SecretRef-Scans konfigurierte Konten erkennen müssen, ohne die vollständige
Laufzeit zu laden. Der Setup-Einstiegspunkt sollte Kanalmetadaten plus setupsichere Adapter für Konfiguration,
Status und Secrets bereitstellen; Netzwerkkunden, Gateway-Listener und
Transport-Laufzeiten gehören in den Haupteinstiegspunkt der Extension.

Felder für Laufzeit-Einstiegspunkte überschreiben keine Prüfungen der Paketgrenzen für Felder von
Quell-Einstiegspunkten. Zum Beispiel kann `openclaw.runtimeExtensions` einen ausbrechenden
Pfad in `openclaw.extensions` nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es
macht nicht beliebige fehlerhafte Konfigurationen installierbar. Derzeit erlaubt es nur
Installationsabläufen, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa einem
fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten Eintrag `channels.<id>` für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die Installation und verweisen
Operatoren auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein kleines Prüfer-
Modul:

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

Verwenden Sie dies, wenn Setup-, Doctor- oder configured-state-Abläufe einen kostengünstigen
Ja/Nein-Auth-Check benötigen, bevor das vollständige Kanal-Plugin geladen wird. Das Zielexport sollte eine kleine
Funktion sein, die nur persistierten Zustand liest; leiten Sie es nicht über das vollständige
Laufzeit-Barrel des Kanals.

`openclaw.channel.configuredState` verwendet dieselbe Form für kostengünstige env-only-
Prüfungen des konfigurierten Zustands:

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

Verwenden Sie dies, wenn ein Kanal den konfigurierten Zustand aus env oder anderen kleinen
Nicht-Laufzeit-Eingaben beantworten kann. Wenn die Prüfung eine vollständige Konfigurationsauflösung oder die echte
Kanal-Laufzeit benötigt, belassen Sie diese Logik stattdessen im Plugin-Hook `config.hasConfiguredState`.

## Discovery-Priorität (doppelte Plugin-IDs)

OpenClaw erkennt Plugins aus mehreren Roots (gebündelt, globale Installation, Workspace, explizit per Konfiguration ausgewählte Pfade). Wenn zwei Discoveries dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Priorität** beibehalten; Duplikate mit niedrigerer Priorität werden verworfen, statt parallel dazu geladen zu werden.

Priorität, von hoch nach niedrig:

1. **Per Konfiguration ausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` gepinnt ist
2. **Gebündelt** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Globale Installation** — Plugins, die in den globalen OpenClaw-Plugin-Root installiert wurden
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace erkannt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugin im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich durch ein lokales zu überschreiben, pinnen Sie es per `plugins.entries.<id>`, damit es durch Priorität gewinnt, statt sich auf Workspace-Discovery zu verlassen.
- Verworfene Duplikate werden protokolliert, damit Doctor und Startdiagnosen auf die verworfene Kopie hinweisen können.

## Anforderungen an JSON Schema

- **Jedes Plugin muss ein JSON-Schema mitliefern**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte Schlüssel unter `channels.*` sind **Fehler**, es sei denn, die Kanal-ID wird durch
  ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **erkennbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein fehlerhaftes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration existiert, aber das Plugin **deaktiviert** ist, bleibt die Konfiguration erhalten und
  in Doctor + Protokollen wird eine **Warnung** angezeigt.

Siehe [Configuration reference](/de/gateway/configuration) für das vollständige Schema `plugins.*`.

## Hinweise

- Das Manifest ist für **native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge.
- Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur
  der Discovery + Validierung.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, nachgestellte Kommas und
  ungequotete Schlüssel zulässig, solange der Endwert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie es,
  hier benutzerdefinierte Top-Level-Schlüssel hinzuzufügen.
- `providerAuthEnvVars` ist der kostengünstige Metadatenpfad für Auth-Prüfungen, Env-Marker-
  Validierung und ähnliche Provider-Auth-Oberflächen, die die Plugin-Laufzeit nicht starten sollten,
  nur um env-Namen zu prüfen.
- `providerAuthAliases` ermöglicht es Provider-Varianten, die Auth-
  Env-Variablen, Auth-Profile, konfigurationsgestützte Auth und die
  API-Key-Onboarding-Auswahl eines anderen Providers wiederzuverwenden, ohne diese Beziehung im Core hart zu codieren.
- `providerEndpoints` ermöglicht es Provider-Plugins, einfache Metadaten für Host-/`baseUrl`-
  Matching von Endpunkten zu besitzen. Verwenden Sie dies nur für Endpunktklassen, die der Core bereits unterstützt;
  das Laufzeitverhalten gehört weiterhin dem Plugin.
- `syntheticAuthRefs` ist der kostengünstige Metadatenpfad für plugin-eigene Synthetic-
  Auth-Hooks, die für Cold-Model-Discovery sichtbar sein müssen, bevor das Laufzeit-
  Register existiert. Listen Sie nur Refs auf, deren Laufzeit-Provider oder CLI-Backend tatsächlich
  `resolveSyntheticAuth` implementiert.
- `nonSecretAuthMarkers` ist der kostengünstige Metadatenpfad für platzhalterhafte API-Schlüssel,
  die gebündelten Plugins gehören, etwa Marker für lokale, OAuth- oder Ambient-Credentials.
  Der Core behandelt diese als Nicht-Secrets für die Anzeige von Auth und für Secret-Audits, ohne
  den besitzenden Provider hart zu codieren.
- `channelEnvVars` ist der kostengünstige Metadatenpfad für Shell-env-Fallback, Setup-
  Prompts und ähnliche Kanaloberflächen, die die Plugin-Laufzeit nicht starten sollten,
  nur um env-Namen zu prüfen. Env-Namen sind Metadaten, keine Aktivierung an
  sich: Status, Audit, Validierung der Cron-Zustellung und andere schreibgeschützte
  Oberflächen wenden weiterhin Plugin-Vertrauen und effektive Aktivierungsrichtlinien an, bevor sie
  eine env-Variable als konfigurierten Kanal behandeln.
- `providerAuthChoices` ist der kostengünstige Metadatenpfad für Picker zur Auth-Auswahl,
  die Auflösung von `--auth-choice`, Mapping bevorzugter Provider und einfache Onboarding-
  Registrierung von CLI-Flags, bevor die Provider-Laufzeit geladen wird. Für Metadaten des Laufzeit-Wizards,
  die Provider-Code erfordern, siehe
  [Provider runtime hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird durch `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird durch `plugins.slots.contextEngine`
    ausgewählt (Standard: eingebautes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein
  Plugin sie nicht benötigt.
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle
  Anforderungen an Paketmanager-Allowlists (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandt

- [Building Plugins](/de/plugins/building-plugins) — Einstieg in Plugins
- [Plugin Architecture](/de/plugins/architecture) — interne Architektur
- [SDK Overview](/de/plugins/sdk-overview) — Referenz für das Plugin SDK
