---
read_when:
    - Sie erstellen ein OpenClaw-Plugin.
    - Sie müssen ein Plugin-Konfigurationsschema bereitstellen oder Plugin-Validierungsfehler debuggen.
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-24T08:59:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Für kompatible Bundle-Layouts siehe [Plugin bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das Standard-Layout für Claude-Komponenten
  ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, aber sie werden nicht
gegen das hier beschriebene Schema für `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten plus deklarierte
Skill-Roots, Claude-Command-Roots, Standardwerte aus `settings.json` von Claude-Bundles,
LSP-Standardwerte von Claude-Bundles und unterstützte Hook-Packs, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** bereitstellen. OpenClaw verwendet dieses Manifest, um die Konfiguration
**ohne Ausführung von Plugin-Code** zu validieren. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe die vollständige Anleitung zum Plugin-System: [Plugins](/de/tools/plugin).
Für das native Capability-Modell und die aktuelle Anleitung zur externen Kompatibilität:
[Capability model](/de/plugins/architecture#public-capability-model).

## Wozu diese Datei dient

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, **bevor es Ihren
Plugin-Code lädt**. Alles unten muss günstig genug sein, um es zu prüfen, ohne die
Plugin-Laufzeit zu starten.

**Verwenden Sie sie für:**

- Plugin-Identität, Konfigurationsvalidierung und UI-Hinweise für die Konfiguration
- Metadaten für Auth, Onboarding und Setup (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Auth-Auswahl)
- Aktivierungshinweise für Oberflächen der Control Plane
- Kurzform-Ownership für Modellfamilien
- statische Snapshots der Capability-Ownership (`contracts`)
- QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa` prüfen kann
- channelspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie sie nicht für:** Registrierung von Laufzeitverhalten, Deklaration von Code-Einstiegspunkten
oder npm-Installationsmetadaten. Diese gehören in Ihren Plugin-Code und in `package.json`.

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

## Referenz der Felder auf oberster Ebene

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                         |
| ------------------------------------ | ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                             |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                          |
| `enabledByDefault`                   | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie das Feld weg oder setzen Sie einen beliebigen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.                                 |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Legacy-IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modellreferenzen sie erwähnen.                                                                                                      |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                  |
| `channels`                           | Nein         | `string[]`                       | Channel-IDs, die diesem Plugin gehören. Verwendet für Discovery und Konfigurationsvalidierung.                                                                                                                                   |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | Nein         | `string`                         | Leichtgewichtiger Modulpfad für Provider-Discovery, relativ zum Plugin-Root, für manifestgebundene Provider-Katalogmetadaten, die geladen werden können, ohne die vollständige Plugin-Laufzeit zu aktivieren.                  |
| `modelSupport`                       | Nein         | `object`                         | Manifestgebundene Kurzform-Metadaten für Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                                             |
| `providerEndpoints`                  | Nein         | `object[]`                       | Manifestgebundene Metadaten zu Endpoint-Hosts/baseUrl für Provider-Routen, die vom Core klassifiziert werden müssen, bevor die Provider-Laufzeit geladen wird.                                                                  |
| `cliBackends`                        | Nein         | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Verwendet für die automatische Aktivierung beim Start aus expliziten Konfigurationsreferenzen.                                                                             |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren plugin-eigener synthetischer Auth-Hook während kalter Modellentdeckung vor dem Laden der Laufzeit geprüft werden soll.                                                            |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalterwerte für API-Schlüssel, die gebündelten Plugins gehören und einen nicht geheimen lokalen, OAuth- oder Umgebungs-Credential-Zustand darstellen.                                                                      |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                                        |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Kostengünstige Metadaten zu Provider-Auth-Umgebungsvariablen, die OpenClaw prüfen kann, ohne Plugin-Code zu laden.                                                                                                              |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die für Auth-Lookup eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider nutzt.                      |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Kostengünstige Metadaten zu Channel-Umgebungsvariablen, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuertes Channel-Setup oder Auth-Oberflächen, die generische Start-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                       | Kostengünstige Metadaten für Auth-Auswahlen für Onboarding-Picker, Auflösung bevorzugter Provider und einfache Verdrahtung von CLI-Flags.                                                                                        |
| `activation`                         | Nein         | `object`                         | Kostengünstige Metadaten des Aktivierungsplaners für provider-, befehls-, channel-, routen- und capability-ausgelöstes Laden. Nur Metadaten; tatsächliches Verhalten bleibt Eigentum der Plugin-Laufzeit.                    |
| `setup`                              | Nein         | `object`                         | Kostengünstige Setup-/Onboarding-Deskriptoren, die Discovery- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                           |
| `qaRunners`                          | Nein         | `object[]`                       | Kostengünstige QA-Runner-Deskriptoren, die vom gemeinsamen Host `openclaw qa` verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                                         |
| `contracts`                          | Nein         | `object`                         | Statischer Snapshot gebündelter Capabilities für externe Auth-Hooks, Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Abruf, Websuche und Tool-Ownership. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Kostengünstige Standardwerte für Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                            |
| `channelConfigs`                     | Nein         | `Record<string, object>`         | Manifestgebundene Channel-Konfigurationsmetadaten, die vor dem Laden der Laufzeit in Discovery- und Validierungsoberflächen zusammengeführt werden.                                                                              |
| `skills`                             | Nein         | `string[]`                       | Skill-Verzeichnisse, relativ zum Plugin-Root, die geladen werden sollen.                                                                                                                                                          |
| `name`                               | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                                     |
| `description`                        | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                  |
| `version`                            | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                       |
| `uiHints`                            | Nein         | `Record<string, object>`         | UI-Labels, Platzhalter und Sensitivitätshinweise für Konfigurationsfelder.                                                                                                                                                        |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine einzelne Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.

| Feld                 | Erforderlich | Typ                                             | Bedeutung                                                                                               |
| -------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`           | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                               |
| `method`             | Ja           | `string`                                        | ID der Auth-Methode, an die weitergeleitet werden soll.                                                 |
| `choiceId`           | Ja           | `string`                                        | Stabile Auth-Auswahl-ID, die von Onboarding- und CLI-Flows verwendet wird.                             |
| `choiceLabel`        | Nein         | `string`                                        | Benutzerseitiges Label. Wenn es weggelassen wird, greift OpenClaw auf `choiceId` zurück.               |
| `choiceHint`         | Nein         | `string`                                        | Kurzer Hilfetext für den Picker.                                                                        |
| `assistantPriority`  | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Pickern früher sortiert.                |
| `assistantVisibility`| Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistenten-Pickern aus, erlaubt aber weiterhin die manuelle Auswahl per CLI.   |
| `deprecatedChoiceIds`| Nein         | `string[]`                                      | Legacy-Auswahl-IDs, die Benutzer zu dieser Ersatz-Auswahl weiterleiten sollen.                         |
| `groupId`            | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlen.                                               |
| `groupLabel`         | Nein         | `string`                                        | Benutzerseitiges Label für diese Gruppe.                                                                |
| `groupHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                        |
| `optionKey`          | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Flows mit einem einzelnen Flag.                             |
| `cliFlag`            | Nein         | `string`                                        | Name des CLI-Flags, zum Beispiel `--openrouter-api-key`.                                                |
| `cliOption`          | Nein         | `string`                                        | Vollständige Form der CLI-Option, zum Beispiel `--openrouter-api-key <key>`.                           |
| `cliDescription`     | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                      |
| `onboardingScopes`   | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn weggelassen, ist der Standard `["text-inference"]`. |

## Referenz für `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen besitzt, den Benutzer
möglicherweise fälschlich in `plugins.allow` eintragen oder als Root-CLI-Befehl ausführen möchten. OpenClaw
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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                  |
| ------------ | ------------ | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                  |
| `kind`       | Nein         | `"runtime-slash"` | Markiert den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.        |
| `cliCommand` | Nein         | `string`          | Zugehöriger Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen werden soll, falls vorhanden. |

## Referenz für `activation`

Verwenden Sie `activation`, wenn das Plugin günstig deklarieren kann, welche Ereignisse der Control Plane
es in einen Aktivierungs-/Ladeplan aufnehmen sollen.

Dieser Block ist Planer-Metadaten, keine Lifecycle-API. Er registriert kein
Laufzeitverhalten, ersetzt nicht `register(...)` und verspricht nicht, dass
Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um
Kandidaten-Plugins einzugrenzen, bevor er auf bestehende Manifest-Ownership-
Metadaten wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks zurückfällt.

Bevorzugen Sie die engsten Metadaten, die Ownership bereits beschreiben. Verwenden Sie
`providers`, `channels`, `commandAliases`, Setup-Deskriptoren oder `contracts`,
wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planer-
Hinweise, die sich nicht durch diese Ownership-Felder darstellen lassen.

Dieser Block besteht nur aus Metadaten. Er registriert kein Laufzeitverhalten und ersetzt weder
`register(...)`, `setupEntry` noch andere Laufzeit-/Plugin-Einstiegspunkte.
Aktuelle Verbraucher verwenden ihn als Eingrenzungshinweis vor einem breiteren Plugin-Laden, daher
kosten fehlende Aktivierungsmetadaten normalerweise nur Leistung; die Korrektheit sollte sich nicht
ändern, solange die Legacy-Fallbacks für Manifest-Ownership noch existieren.

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

| Feld             | Erforderlich | Typ                                                  | Bedeutung                                                                                              |
| ---------------- | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `onProviders`    | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                          |
| `onCommands`     | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                           |
| `onChannels`     | Nein         | `string[]`                                           | Channel-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                           |
| `onRoutes`       | Nein         | `string[]`                                           | Routenarten, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                           |
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Capability-Hinweise, die von der Aktivierungsplanung der Control Plane verwendet werden. Wenn möglich, engere Felder bevorzugen. |

Aktuelle Live-Verbraucher:

- befehlsausgelöste CLI-Planung fällt auf Legacy-
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- channel-ausgelöste Setup-/Channel-Planung fällt auf Legacy-Ownership über `channels[]`
  zurück, wenn explizite Channel-Aktivierungsmetadaten fehlen
- provider-ausgelöste Setup-/Laufzeitplanung fällt auf Legacy-
  `providers[]` und Ownership über das Top-Level `cliBackends[]` zurück, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

Planer-Diagnosen können explizite Aktivierungshinweise von Fallbacks für Manifest-
Ownership unterscheiden. Zum Beispiel bedeutet `activation-command-hint`, dass
`activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der
Planer stattdessen Ownership über `commandAliases` verwendet hat. Diese Begründungslabels sind für
Host-Diagnosen und Tests gedacht; Plugin-Autoren sollten weiterhin die Metadaten deklarieren,
die Ownership am besten beschreiben.

## Referenz für `qaRunners`

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb des
gemeinsamen Roots `openclaw qa` beiträgt. Halten Sie diese Metadaten günstig und statisch; die Plugin-
Laufzeit besitzt weiterhin die eigentliche CLI-Registrierung über eine leichtgewichtige
Oberfläche `runtime-api.ts`, die `qaRunnerCliRegistrations` exportiert.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Die Docker-gestützte Matrix-Live-QA-Lane gegen einen flüchtigen Homeserver ausführen"
    }
  ]
}
```

| Feld          | Erforderlich | Typ      | Bedeutung                                                            |
| ------------- | ------------ | -------- | -------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl unterhalb von `openclaw qa`, zum Beispiel `matrix`.      |
| `description` | Nein         | `string` | Fallback-Hilfetext, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

## Referenz für `setup`

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen günstige plugin-eigene Metadaten
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

Top-Level-`cliBackends` bleibt gültig und beschreibt weiterhin CLI-Inferenz-
Backends. `setup.cliBackends` ist die setupspezifische Deskriptoroberfläche für
Control-Plane-/Setup-Flows, die nur Metadaten bleiben sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
deskriptorbasierte Lookup-Oberfläche für Setup-Discovery. Wenn der Deskriptor nur
das Kandidaten-Plugin eingrenzt und das Setup dennoch reichhaltigere Laufzeit-Hooks zur Setup-Zeit benötigt,
setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als
Fallback-Ausführungspfad bei.

Da Setup-Lookup plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte
Werte in `setup.providers[].id` und `setup.cliBackends[]` über alle
gefundenen Plugins hinweg eindeutig bleiben. Mehrdeutige Ownership schlägt sicher geschlossen fehl, statt
einen Gewinner anhand der Discovery-Reihenfolge auszuwählen.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                 |
| ------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------- |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding bereitgestellt wird. Normalisierte IDs müssen global eindeutig bleiben. |
| `authMethods` | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Provider ohne Laden der vollständigen Laufzeit unterstützt. |
| `envVars`     | Nein         | `string[]` | Umgebungsvariablen, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                  |
| ------------------ | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding bereitgestellt werden.                       |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für deskriptorbasiertes Setup-Lookup verwendet werden. Normalisierte IDs müssen global eindeutig bleiben. |
| `configMigrations` | Nein         | `string[]` | IDs für Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins gehören.                        |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach dem Deskriptor-Lookup weiterhin die Ausführung von `setup-api` benötigt.                |

## Referenz für `uiHints`

`uiHints` ist eine Map von Namen von Konfigurationsfeldern zu kleinen Rendering-Hinweisen.

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

Jeder Feldhinweis kann Folgendes enthalten:

| Feld          | Typ        | Bedeutung                                 |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Benutzerseitiges Feldlabel.               |
| `help`        | `string`   | Kurzer Hilfetext.                         |
| `tags`        | `string[]` | Optionale UI-Tags.                        |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.          |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.     |

## Referenz für `contracts`

Verwenden Sie `contracts` nur für statische Capability-Ownership-Metadaten, die OpenClaw
lesen kann, ohne die Plugin-Laufzeit zu importieren.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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
| `embeddedExtensionFactories`     | `string[]` | IDs eingebetteter Laufzeiten, für die ein gebündeltes Plugin Factories registrieren darf. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren externer Auth-Profile-Hook diesem Plugin gehört.    |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                         |
| `realtimeTranscriptionProviders` | `string[]` | Provider-IDs für Echtzeit-Transkription, die diesem Plugin gehören.     |
| `realtimeVoiceProviders`         | `string[]` | Provider-IDs für Echtzeit-Stimme, die diesem Plugin gehören.            |
| `memoryEmbeddingProviders`       | `string[]` | Provider-IDs für Memory-Embeddings, die diesem Plugin gehören.          |
| `mediaUnderstandingProviders`    | `string[]` | Provider-IDs für Medienverständnis, die diesem Plugin gehören.          |
| `imageGenerationProviders`       | `string[]` | Provider-IDs für Bildgenerierung, die diesem Plugin gehören.            |
| `videoGenerationProviders`       | `string[]` | Provider-IDs für Videogenerierung, die diesem Plugin gehören.           |
| `webFetchProviders`              | `string[]` | Provider-IDs für Web-Abruf, die diesem Plugin gehören.                  |
| `webSearchProviders`             | `string[]` | Provider-IDs für Websuche, die diesem Plugin gehören.                   |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für Contract-Prüfungen gebündelter Plugins gehören. |

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten
`contracts.externalAuthProviders` deklarieren. Plugins ohne diese Deklaration laufen weiterhin
über einen veralteten Kompatibilitäts-Fallback, aber dieser Fallback ist langsamer und
wird nach dem Migrationsfenster entfernt.

Gebündelte Provider für Memory-Embeddings sollten
`contracts.memoryEmbeddingProviders` für jede Adapter-ID deklarieren, die sie bereitstellen, einschließlich
integrierter Adapter wie `local`. Eigenständige CLI-Pfade verwenden diesen Manifest-
Contract, um nur das besitzende Plugin zu laden, bevor die vollständige Gateway-Laufzeit
Provider registriert hat.

## Referenz für `mediaUnderstandingProviderMetadata`

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Provider für Medienverständnis
Standardmodelle, Auto-Auth-Fallback-Priorität oder native Dokumentunterstützung hat, die
generische Core-Helfer benötigen, bevor die Laufzeit geladen wird. Schlüssel müssen auch in
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

Jeder Provider-Eintrag kann Folgendes enthalten:

| Feld                   | Typ                                 | Bedeutung                                                                    |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medien-Capabilities, die von diesem Provider bereitgestellt werden.          |
| `defaultModels`        | `Record<string, string>`            | Standardwerte Capability-zu-Modell, die verwendet werden, wenn die Konfiguration kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden für automatischen Provider-Fallback auf Basis von Credentials früher sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.                |

## Referenz für `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Channel-Plugin günstige Konfigurationsmetadaten benötigt, bevor
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

Jeder Channel-Eintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                   |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Channel-Konfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Labels/Platzhalter/Sensitivitätshinweise für diesen Abschnitt der Channel-Konfiguration. |
| `label`       | `string`                 | Channel-Label, das in Picker- und Inspect-Oberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Channel-Beschreibung für Inspect- und Katalogoberflächen.                             |
| `preferOver`  | `string[]`               | Legacy- oder niedriger priorisierte Plugin-IDs, die dieser Channel in Auswahloberflächen übertreffen soll. |

## Referenz für `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus
Kurzform-Modell-IDs wie `gpt-5.5` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit
geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet dabei diese Priorität an:

- explizite Referenzen `provider/model` verwenden die besitzenden Manifest-Metadaten aus `providers`
- `modelPatterns` schlagen `modelPrefixes`
- wenn sowohl ein nicht gebündeltes Plugin als auch ein gebündeltes Plugin übereinstimmen, gewinnt das nicht gebündelte
  Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis Benutzer oder Konfiguration einen Provider angeben

Felder:

| Feld            | Typ        | Bedeutung                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden.    |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach Entfernen von Profilsuffixen gegen Kurzform-Modell-IDs abgeglichen werden. |

Legacy-Capability-Schlüssel auf oberster Ebene sind veraltet. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; das normale
Laden von Manifesten behandelt diese Top-Level-Felder nicht mehr als
Capability-Ownership.

## Manifest versus package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Metadaten für Auth-Auswahl und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code läuft |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und den Block `openclaw`, der für Einstiegspunkte, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wohin ein Metadatum gehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Einstiegsdateien oder npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die Discovery beeinflussen

Einige Plugin-Metadaten vor der Laufzeit leben absichtlich in `package.json` unter dem
Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert Einstiegspunkte für native Plugins. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                |
| `openclaw.runtimeExtensions`                                      | Deklariert Einstiegspunkte der gebauten JavaScript-Laufzeit für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                         |
| `openclaw.setupEntry`                                             | Leichtgewichtiger, nur für Setup vorgesehener Einstiegspunkt, der während Onboarding, verzögertem Channel-Start und schreibgeschützter Discovery von Channel-Status/SecretRef verwendet wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                      | Deklariert den gebauten JavaScript-Setup-Einstiegspunkt für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                             |
| `openclaw.channel`                                                | Kostengünstige Metadaten für den Channel-Katalog wie Labels, Docs-Pfade, Aliase und Auswahltexte.                                                                                    |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für den Checker des konfigurierten Zustands, die beantworten können: „Existiert env-only-Setup bereits?“ ohne die vollständige Channel-Laufzeit zu laden. |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für den Checker des persistierten Auth-Zustands, die beantworten können: „Ist bereits etwas angemeldet?“ ohne die vollständige Channel-Laufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installations-/Update-Hinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                     |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                      |
| `openclaw.install.minHostVersion`                                 | Minimal unterstützte OpenClaw-Host-Version mit einer SemVer-Untergrenze wie `>=2026.3.22`.                                                                                           |
| `openclaw.install.expectedIntegrity`                              | Erwarteter npm-dist-Integrity-String wie `sha512-...`; Installations- und Update-Flows prüfen das geladene Artefakt dagegen.                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen engen Neuinstallations-Recovery-Pfad für gebündelte Plugins, wenn die Konfiguration ungültig ist.                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Erlaubt das Laden von Channel-Oberflächen nur für Setup vor dem vollständigen Channel-Plugin während des Starts.                                                                      |

Manifest-Metadaten entscheiden, welche Provider-/Channel-/Setup-Auswahlen im
Onboarding erscheinen, bevor die Laufzeit geladen wird. `package.json#openclaw.install` sagt
dem Onboarding, wie dieses Plugin geladen oder aktiviert werden soll, wenn der Benutzer eine dieser
Auswahlen trifft. Verschieben Sie keine Installationshinweise in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-
Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das
Plugin auf älteren Hosts.

Exaktes Pinning von npm-Versionen lebt bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalog-
Einträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Update-Flows
sicher fehlschlagen, wenn das geladene npm-Artefakt nicht mehr zum gepinnten Release passt.
Interaktives Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige npm-Spezifikationen aus der Registry an, einschließlich bloßer
Paketnamen und Dist-Tags. Katalog-Diagnosen können zwischen exakten, gleitenden,
per Integrity gepinnten und Quellen ohne Integrity unterscheiden.
Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Flows dies; wenn es
weggelassen wird, wird die Registry-Auflösung ohne Integrity-Pin protokolliert.

Channel-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Channel-Liste
oder SecretRef-Scans konfigurierte Konten erkennen müssen, ohne die vollständige
Laufzeit zu laden. Der Setup-Einstiegspunkt sollte Channel-Metadaten sowie setup-sichere Konfigurations-,
Status- und Secrets-Adapter bereitstellen; Netzwerkclients, Gateway-Listener und
Transport-Laufzeiten bleiben im Haupteinstiegspunkt der Erweiterung.

Felder für Laufzeit-Einstiegspunkte überschreiben Package-Boundary-Prüfungen nicht für Source-
Einstiegspunkt-Felder. Zum Beispiel kann `openclaw.runtimeExtensions` einen
ausbrechenden Pfad in `openclaw.extensions` nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es macht
nicht beliebige kaputte Konfigurationen installierbar. Derzeit erlaubt es Installations-
Flows nur, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa
von einem fehlenden gebündelten Plugin-Pfad oder einem veralteten `channels.<id>`-Eintrag für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die Installation und schicken Operatoren
zu `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein winziges Checker-
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

Verwenden Sie es, wenn Setup-, Doctor- oder configured-state-Flows vor dem Laden des vollständigen
Channel-Plugins eine günstige Ja/Nein-Auth-Prüfung benötigen. Der Ziel-Export sollte eine kleine
Funktion sein, die nur persistierten Zustand liest; leiten Sie ihn nicht durch das vollständige
Runtime-Barrel des Channels.

`openclaw.channel.configuredState` folgt derselben Form für günstige env-only-
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

Verwenden Sie es, wenn ein Channel den konfigurierten Zustand aus env oder anderen kleinen
Nicht-Laufzeit-Eingaben beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung oder die echte
Channel-Laufzeit benötigt, belassen Sie diese Logik stattdessen im Hook `config.hasConfiguredState` des Plugins.

## Discovery-Priorität (doppelte Plugin-IDs)

OpenClaw findet Plugins aus mehreren Roots (gebündelt, globale Installation, Workspace, explizit per Konfiguration ausgewählte Pfade). Wenn zwei Discovery-Ergebnisse dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Priorität** beibehalten; Duplikate mit niedrigerer Priorität werden verworfen, statt daneben geladen zu werden.

Priorität, von hoch nach niedrig:

1. **Per Konfiguration ausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` angeheftet ist
2. **Gebündelt** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Globale Installation** — Plugins, die in den globalen OpenClaw-Plugin-Root installiert sind
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace gefunden werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich mit einem lokalen zu überschreiben, heften Sie es über `plugins.entries.<id>` an, damit es über die Priorität gewinnt, statt sich auf Workspace-Discovery zu verlassen.
- Verworfene Duplikate werden protokolliert, damit Doctor- und Startdiagnosen auf die verworfene Kopie hinweisen können.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte Schlüssel in `channels.*` sind **Fehler**, es sei denn, die Channel-ID wird durch
  ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **auffindbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  in Doctor + Logs wird eine **Warnung** ausgegeben.

Siehe [Configuration reference](/de/gateway/configuration) für das vollständige Schema `plugins.*`.

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge. Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur für Discovery + Validierung.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, abschließende Kommas und unquotierte Schlüssel zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifest-Felder werden vom Manifest-Loader gelesen. Vermeiden Sie benutzerdefinierte Top-Level-Schlüssel.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerDiscoveryEntry` muss leichtgewichtig bleiben und sollte keinen breiten Laufzeitcode importieren; verwenden Sie es für statische Provider-Katalogmetadaten oder schmale Discovery-Deskriptoren, nicht für request-time-Ausführung.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory`, `kind: "context-engine"` über `plugins.slots.contextEngine` (Standard `legacy`).
- Metadaten zu Umgebungsvariablen (`providerAuthEnvVars`, `channelEnvVars`) sind nur deklarativ. Status, Audit, Validierung der Cron-Zustellung und andere schreibgeschützte Oberflächen wenden weiterhin Plugin-Vertrauen und effektive Aktivierungsrichtlinien an, bevor eine Umgebungsvariable als konfiguriert behandelt wird.
- Für Metadaten des Laufzeit-Assistenten, die Providercode erfordern, siehe [Provider runtime hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Anforderungen an die Allowlist des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Verwandt

<CardGroup cols={3}>
  <Card title="Plugins erstellen" href="/de/plugins/building-plugins" icon="rocket">
    Erste Schritte mit Plugins.
  </Card>
  <Card title="Plugin-Architektur" href="/de/plugins/architecture" icon="diagram-project">
    Interne Architektur und Capability-Modell.
  </Card>
  <Card title="SDK-Überblick" href="/de/plugins/sdk-overview" icon="book">
    Plugin-SDK-Referenz und Subpath-Importe.
  </Card>
</CardGroup>
