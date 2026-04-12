---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema bereitstellen oder Fehler bei der Plugin-Validierung debuggen
summary: Plugin-Manifest- und JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-12T06:16:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf666b0f41f07641375a248f52e29ba6a68c3ec20404bedb6b52a20a5cd92e91
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (`openclaw.plugin.json`)

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponenten-Layout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch nicht anhand des hier beschriebenen Schemas für `openclaw.plugin.json` validiert.

Bei kompatiblen Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte Skill-Roots, Claude-Command-Roots, Standardwerte aus `settings.json` von Claude-Bundles, Standardwerte für Claude-Bundle-LSPs und unterstützte Hook-Packs, wenn das Layout den Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** im **Plugin-Stammverzeichnis** eine Datei `openclaw.plugin.json` bereitstellen. OpenClaw verwendet dieses Manifest, um die Konfiguration zu validieren, **ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden als Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Den vollständigen Leitfaden zum Plugin-System finden Sie unter [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und der aktuellen Anleitung zur externen Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor Ihr
Plugin-Code geladen wird.

Verwenden Sie sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Auth- und Onboarding-Metadaten, die verfügbar sein sollen, ohne die Plugin-Laufzeit zu starten
- kostengünstige Aktivierungshinweise, die Steuerungsebenen vor dem Laden der Laufzeit prüfen können
- kostengünstige Setup-Deskriptoren, die Setup-/Onboarding-Oberflächen vor dem Laden der Laufzeit prüfen können
- Alias- und Auto-Enable-Metadaten, die aufgelöst werden sollen, bevor die Plugin-Laufzeit geladen wird
- Kurzform-Metadaten zur Besitzerschaft von Modellfamilien, die das Plugin vor dem Laden der Laufzeit automatisch aktivieren sollen
- statische Snapshots zur Besitzerschaft von Fähigkeiten, die für gebündelte Kompatibilitätsverdrahtung und Vertragsabdeckung verwendet werden
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden sollen, ohne die Laufzeit zu laden
- Hinweise für die Konfigurations-UI

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
  "cliBackends": ["openrouter-cli"],
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
| `enabledByDefault`                  | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie das Feld weg oder setzen Sie einen beliebigen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.             |
| `legacyPluginIds`                   | Nein         | `string[]`                       | Legacy-IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                          |
| `autoEnableWhenConfiguredProviders` | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modellreferenzen sie erwähnen.                                                                                 |
| `kind`                              | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                             |
| `channels`                          | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Wird für Erkennung und Konfigurationsvalidierung verwendet.                                                                                                            |
| `providers`                         | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                     |
| `modelSupport`                      | Nein         | `object`                         | Manifest-eigene Kurzform-Metadaten zu Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                            |
| `cliBackends`                       | Nein         | `string[]`                       | IDs von CLI-Inferenz-Backends, die diesem Plugin gehören. Wird für die automatische Aktivierung beim Start anhand expliziter Konfigurationsreferenzen verwendet.                                            |
| `commandAliases`                    | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                    |
| `providerAuthEnvVars`               | Nein         | `Record<string, string[]>`       | Kostengünstige Env-Metadaten für Provider-Authentifizierung, die OpenClaw prüfen kann, ohne Plugin-Code zu laden.                                                                                           |
| `providerAuthAliases`               | Nein         | `Record<string, string>`         | Provider-IDs, die für die Auth-Suche eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider nutzt. |
| `channelEnvVars`                    | Nein         | `Record<string, string[]>`       | Kostengünstige Env-Metadaten für Kanäle, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuertes Kanal-Setup oder Auth-Oberflächen, die generische Start-/Konfigurationshilfen sehen sollen. |
| `providerAuthChoices`               | Nein         | `object[]`                       | Kostengünstige Metadaten zu Auth-Auswahloptionen für Onboarding-Auswahlen, die Auflösung bevorzugter Provider und einfache CLI-Flag-Verdrahtung.                                                           |
| `activation`                        | Nein         | `object`                         | Kostengünstige Aktivierungshinweise für provider-, befehls-, kanal-, routen- und fähigkeitsgesteuertes Laden. Nur Metadaten; die tatsächliche Funktionalität gehört weiterhin der Plugin-Laufzeit.        |
| `setup`                             | Nein         | `object`                         | Kostengünstige Setup-/Onboarding-Deskriptoren, die Erkennungs- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                     |
| `contracts`                         | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeiten für Speech, Echtzeit-Transkription, Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Besitzerschaft. |
| `channelConfigs`                    | Nein         | `Record<string, object>`         | Manifest-eigene Kanal-Konfigurationsmetadaten, die vor dem Laden der Laufzeit in Erkennungs- und Validierungsoberflächen zusammengeführt werden.                                                            |
| `skills`                            | Nein         | `string[]`                       | Skill-Verzeichnisse, die relativ zum Plugin-Stammverzeichnis geladen werden sollen.                                                                                                                          |
| `name`                              | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                |
| `description`                       | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                             |
| `version`                           | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                  |
| `uiHints`                           | Nein         | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Sensitivitätshinweise für Konfigurationsfelder.                                                                                                                          |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahloption.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                 |
| --------------------- | ------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahloption gehört.                                                           |
| `method`              | Ja           | `string`                                        | ID der Auth-Methode, an die weitergeleitet werden soll.                                                  |
| `choiceId`            | Ja           | `string`                                        | Stabile ID der Auth-Auswahloption, die von Onboarding- und CLI-Abläufen verwendet wird.                  |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Bezeichnung. Wenn sie weggelassen wird, greift OpenClaw auf `choiceId` zurück.           |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                         |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.                |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistenten-Auswahlen aus, erlaubt aber weiterhin die manuelle Auswahl per CLI.   |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Legacy-IDs für Auswahloptionen, die Benutzer zu dieser Ersatzoption umleiten sollen.                     |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahloptionen.                                          |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Bezeichnung für diese Gruppe.                                                             |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                          |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit nur einem Flag.                                  |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, zum Beispiel `--openrouter-api-key`.                                                 |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, zum Beispiel `--openrouter-api-key <key>`.                             |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                       |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn weggelassen, ist der Standardwert `["text-inference"]`. |

## Referenz für `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen besitzt, den Benutzer versehentlich in `plugins.allow` eintragen oder als root-CLI-Befehl ausführen möchten. OpenClaw verwendet diese Metadaten für Diagnosen, ohne Laufzeitcode des Plugins zu importieren.

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
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl und nicht als root-CLI-Befehl. |
| `cliCommand` | Nein         | `string`          | Zugehöriger root-CLI-Befehl, der für CLI-Operationen vorgeschlagen werden soll, falls vorhanden. |

## Referenz für `activation`

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Ereignisse der Steuerungsebene es später aktivieren sollen.

Dieser Block enthält nur Metadaten. Er registriert kein Laufzeitverhalten und ersetzt weder `register(...)`, `setupEntry` noch andere Laufzeit-/Plugin-Einstiegspunkte.

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

| Feld             | Erforderlich | Typ                                                  | Bedeutung                                                              |
| ---------------- | ------------ | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `onProviders`    | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin aktivieren sollen, wenn sie angefordert werden. |
| `onCommands`     | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin aktivieren sollen.                      |
| `onChannels`     | Nein         | `string[]`                                           | Kanal-IDs, die dieses Plugin aktivieren sollen.                        |
| `onRoutes`       | Nein         | `string[]`                                           | Routenarten, die dieses Plugin aktivieren sollen.                      |
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Fähigkeitshinweise, die für die Aktivierungsplanung der Steuerungsebene verwendet werden. |

## Referenz für `setup`

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen vor dem Laden der Laufzeit kostengünstige plugin-eigene Metadaten benötigen.

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

`cliBackends` auf oberster Ebene bleibt gültig und beschreibt weiterhin CLI-Inferenz-Backends. `setup.cliBackends` ist die setupspezifische Deskriptoroberfläche für Abläufe der Steuerungsebene bzw. des Setups, die rein Metadaten bleiben sollen.

Falls vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte, deskriptorbasierte Suchoberfläche für die Setup-Erkennung. Wenn der Deskriptor das Kandidaten-Plugin nur eingrenzt und das Setup weiterhin umfangreichere Laufzeit-Hooks zur Setup-Zeit benötigt, setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als Fallback-Ausführungspfad bei.

Da die Setup-Suche plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte Werte in `setup.providers[].id` und `setup.cliBackends[]` über alle erkannten Plugins hinweg eindeutig bleiben. Mehrdeutige Besitzerschaft schlägt sicher fehl, anstatt anhand der Erkennungsreihenfolge einen Gewinner auszuwählen.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                   |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------- |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding bereitgestellt wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods` | Nein         | `string[]` | IDs von Setup-/Auth-Methoden, die dieser Provider unterstützt, ohne die vollständige Laufzeit zu laden. |
| `envVars`     | Nein         | `string[]` | Env-Variablen, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                              |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding bereitgestellt werden.                   |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für die deskriptorbasierte Setup-Suche verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins gehören.                    |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach der deskriptorbasierten Suche weiterhin die Ausführung von `setup-api` benötigt.    |

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

| Feld          | Typ        | Bedeutung                                    |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Benutzerseitige Feldbezeichnung.             |
| `help`        | `string`   | Kurzer Hilfetext.                            |
| `tags`        | `string[]` | Optionale UI-Tags.                           |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.             |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel.  |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.        |

## Referenz für `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Besitzerschaft von Fähigkeiten, die OpenClaw lesen kann, ohne die Plugin-Laufzeit zu importieren.

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

| Feld                             | Typ        | Bedeutung                                                       |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs von Speech-Providern, die diesem Plugin gehören.            |
| `realtimeTranscriptionProviders` | `string[]` | IDs von Providern für Echtzeit-Transkription, die diesem Plugin gehören. |
| `realtimeVoiceProviders`         | `string[]` | IDs von Providern für Echtzeit-Stimme, die diesem Plugin gehören. |
| `mediaUnderstandingProviders`    | `string[]` | IDs von Providern für Medienverständnis, die diesem Plugin gehören. |
| `imageGenerationProviders`       | `string[]` | IDs von Providern für Bildgenerierung, die diesem Plugin gehören. |
| `videoGenerationProviders`       | `string[]` | IDs von Providern für Videogenerierung, die diesem Plugin gehören. |
| `webFetchProviders`              | `string[]` | IDs von Providern für Web-Fetch, die diesem Plugin gehören.     |
| `webSearchProviders`             | `string[]` | IDs von Providern für Websuche, die diesem Plugin gehören.      |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für gebündelte Vertragsprüfungen gehören. |

## Referenz für `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin vor dem Laden der Laufzeit kostengünstige Konfigurationsmetadaten benötigt.

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

| Feld          | Typ                      | Bedeutung                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanal-Konfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Bezeichnungen/Platzhalter/Sensitivitätshinweise für diesen Abschnitt der Kanalkonfiguration. |
| `label`       | `string`                 | Kanalbezeichnung, die in Auswahl- und Prüfoberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Prüf- und Katalogoberflächen.                                |
| `preferOver`  | `string[]`               | Legacy- oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz für `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin anhand von Kurzform-Modell-IDs wie `gpt-5.4` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet folgende Rangfolge an:

- explizite Referenzen im Format `provider/model` verwenden die manifest-eigenen Metadaten aus `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn sowohl ein nicht gebündeltes Plugin als auch ein gebündeltes Plugin übereinstimmen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                              |
| --------------- | ---------- | -------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die per `startsWith` mit Kurzform-Modell-IDs abgeglichen werden.             |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen von Profilsuffixen mit Kurzform-Modell-IDs abgeglichen werden. |

Legacy-Fähigkeitsschlüssel auf oberster Ebene sind veraltet. Verwenden Sie `openclaw doctor --fix`, um `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; das normale Laden des Manifests behandelt diese Felder auf oberster Ebene nicht mehr als Besitzerschaft von Fähigkeiten.

## Manifest im Vergleich zu package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Erkennung, Konfigurationsvalidierung, Metadaten für Auth-Auswahloptionen und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und den Block `openclaw`, der für Einstiegspunkte, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wohin ein Metadatenelement gehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Einstiegsdateien oder das npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die die Erkennung beeinflussen

Einige Metadaten für Plugins vor der Laufzeit liegen absichtlich in `package.json` unter dem Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Einstiegspunkte.                                                                                                    |
| `openclaw.setupEntry`                                             | Leichtgewichtiger Einstiegspunkt nur für Setup, der während Onboarding und verzögertem Kanalstart verwendet wird.                          |
| `openclaw.channel`                                                | Kostengünstige Kanal-Katalogmetadaten wie Bezeichnungen, Dokumentationspfade, Aliasse und Auswahltexte.                                    |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für den Prüfer des konfigurierten Zustands, die beantworten können: „Existiert env-only-Setup bereits?“, ohne die vollständige Kanallaufzeit zu laden. |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für den Prüfer des gespeicherten Auth-Zustands, die beantworten können: „Ist bereits irgendetwas angemeldet?“, ohne die vollständige Kanallaufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installations-/Update-Hinweise für gebündelte und extern veröffentlichte Plugins.                                                           |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                            |
| `openclaw.install.minHostVersion`                                 | Mindestunterstützte OpenClaw-Hostversion, mit einer semver-Untergrenze wie `>=2026.3.22`.                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen eng begrenzten Wiederherstellungspfad für die Neuinstallation gebündelter Plugins bei ungültiger Konfiguration.              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Ermöglicht das Laden von Kanaloberflächen nur für Setup vor dem vollständigen Kanal-Plugin während des Starts.                             |

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das Plugin auf älteren Hosts.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es macht nicht beliebige defekte Konfigurationen installierbar. Derzeit erlaubt es Installationsabläufen nur, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa bei einem fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten Eintrag `channels.<id>` für dasselbe gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die Installation und verweisen Operatoren an `openclaw doctor --fix`.

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

Verwenden Sie es, wenn Setup-, Doctor- oder configured-state-Abläufe vor dem Laden des vollständigen Kanal-Plugins eine kostengünstige Ja/Nein-Prüfung der Auth benötigen. Das Ziel-Export sollte eine kleine Funktion sein, die nur gespeicherten Zustand liest; leiten Sie dies nicht über das vollständige Laufzeit-Barrel des Kanals.

`openclaw.channel.configuredState` folgt derselben Form für kostengünstige Prüfungen von env-only-Konfigurationszuständen:

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

Verwenden Sie es, wenn ein Kanal den konfigurierten Zustand anhand von Env oder anderen kleinen Eingaben außerhalb der Laufzeit beantworten kann. Wenn die Prüfung eine vollständige Konfigurationsauflösung oder die echte Kanallaufzeit benötigt, belassen Sie diese Logik stattdessen im Hook `config.hasConfiguredState` des Plugins.

## Anforderungen an das JSON-Schema

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte Schlüssel unter `channels.*` sind **Fehler**, es sei denn, die Kanal-ID wird durch ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*` müssen sich auf **erkennbare** Plugin-IDs beziehen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest bzw. Schema hat, schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration vorhanden ist, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und in Doctor sowie in den Logs wird eine **Warnung** angezeigt.

Die vollständige `plugins.*`-Schema-Referenz finden Sie unter [Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Ladevorgänge aus dem Dateisystem.
- Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der Erkennung und Validierung.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, nachgestellte Kommas und nicht in Anführungszeichen gesetzte Schlüssel zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie es, hier benutzerdefinierte Schlüssel auf oberster Ebene hinzuzufügen.
- `providerAuthEnvVars` ist der kostengünstige Metadatenpfad für Auth-Prüfungen, Env-Marker-Validierung und ähnliche Oberflächen für Provider-Auth, die die Plugin-Laufzeit nicht starten sollten, nur um Env-Namen zu prüfen.
- `providerAuthAliases` ermöglicht es Provider-Varianten, die Auth-Env-Variablen, Auth-Profile, konfigurationsgestützte Auth und die API-Key-Onboarding-Auswahl eines anderen Providers wiederzuverwenden, ohne diese Beziehung im Core fest zu verdrahten.
- `channelEnvVars` ist der kostengünstige Metadatenpfad für Shell-Env-Fallback, Setup-Aufforderungen und ähnliche Kanaloberflächen, die die Plugin-Laufzeit nicht starten sollten, nur um Env-Namen zu prüfen.
- `providerAuthChoices` ist der kostengünstige Metadatenpfad für Auswahlen von Auth-Optionen, die Auflösung von `--auth-choice`, die Zuordnung bevorzugter Provider und die einfache Registrierung von CLI-Flags für das Onboarding, bevor die Provider-Laufzeit geladen wird. Runtime-Wizard-Metadaten, die Provider-Code erfordern, finden Sie unter [Provider-Laufzeit-Hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird durch `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird durch `plugins.slots.contextEngine` ausgewählt (Standard: integriertes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein Plugin sie nicht benötigt.
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Anforderungen an Allowlists des Paketmanagers (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — Erste Schritte mit Plugins
- [Plugin-Architektur](/de/plugins/architecture) — interne Architektur
- [SDK-Überblick](/de/plugins/sdk-overview) — Referenz für das Plugin SDK
