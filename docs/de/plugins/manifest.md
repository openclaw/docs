---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema bereitstellen oder Fehler bei der Plugin-Validierung beheben
summary: Plugin-Manifest- + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-11T02:46:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b254c121d1eb5ea19adbd4148243cf47339c960442ab1ca0e0bfd52e0154c88
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (`openclaw.plugin.json`)

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das Standard-Layout für Claude-Komponenten
  ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch nicht
gegen das hier beschriebene Schema für `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte
Skill-Roots, Claude-Command-Roots, Standardwerte aus `settings.json` des Claude-Bundles,
Claude-Bundle-LSP-Standardwerte und unterstützte Hook-Packs, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** im **Plugin-Root** eine Datei `openclaw.plugin.json`
bereitstellen. OpenClaw verwendet dieses Manifest, um die Konfiguration zu validieren,
**ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifestdateien werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Die vollständige Anleitung zum Plugin-System finden Sie unter: [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und zur aktuellen Anleitung für externe Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor Ihr
Plugin-Code geladen wird.

Verwenden Sie sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Auth- und Onboarding-Metadaten, die verfügbar sein sollen, ohne die Plugin-
  Laufzeit zu starten
- Alias- und Autoaktivierungs-Metadaten, die aufgelöst werden sollen, bevor die Plugin-Laufzeit lädt
- Kurzschreibweise-Metadaten zur Eigentümerschaft von Modellfamilien, die das
  Plugin automatisch aktivieren sollen, bevor die Laufzeit lädt
- statische Snapshots der Fähigkeitseigentümerschaft, die für gebündeltes Compat-Wiring und
  Vertragsabdeckung verwendet werden
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungs-
  Oberflächen zusammengeführt werden sollen, ohne die Laufzeit zu laden
- Hinweise für die Konfigurations-UI

Verwenden Sie sie nicht für:

- das Registrieren von Laufzeitverhalten
- das Deklarieren von Code-Entrypoints
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
  "description": "OpenRouter-Provider-Plugin",
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

| Feld                                | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                     |
| ----------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                         |
| `configSchema`                      | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                      |
| `enabledByDefault`                  | Nein         | `true`                           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie das Feld weg oder setzen Sie einen beliebigen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.         |
| `legacyPluginIds`                   | Nein         | `string[]`                       | Legacy-IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                           |
| `autoEnableWhenConfiguredProviders` | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modell-Referenzen sie erwähnen.                                                                                |
| `kind`                              | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                              |
| `channels`                          | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Verwendet für Erkennung und Konfigurationsvalidierung.                                                                                                                 |
| `providers`                         | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                      |
| `modelSupport`                      | Nein         | `object`                         | Manifest-eigene Kurzschreibweise-Metadaten für Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                  |
| `cliBackends`                       | Nein         | `string[]`                       | IDs von CLI-Inferenz-Backends, die diesem Plugin gehören. Verwendet für die Autoaktivierung beim Start aus expliziten Konfigurationsreferenzen.                                                            |
| `commandAliases`                    | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen, bevor die Laufzeit lädt.                                                                     |
| `providerAuthEnvVars`               | Nein         | `Record<string, string[]>`       | Günstige Env-Metadaten für Provider-Auth, die OpenClaw prüfen kann, ohne Plugin-Code zu laden.                                                                                                              |
| `providerAuthAliases`               | Nein         | `Record<string, string>`         | Provider-IDs, die für die Auth-Suche eine andere Provider-ID wiederverwenden sollen, z. B. ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider verwendet. |
| `channelEnvVars`                    | Nein         | `Record<string, string[]>`       | Günstige Env-Metadaten für Kanäle, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuertes Kanal-Setup oder Auth-Oberflächen, die generische Start-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`               | Nein         | `object[]`                       | Günstige Metadaten für Auth-Auswahlmöglichkeiten für Onboarding-Picker, bevorzugte Provider-Auflösung und einfache CLI-Flag-Verdrahtung.                                                                   |
| `contracts`                         | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeiten für Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Eigentümerschaft. |
| `channelConfigs`                    | Nein         | `Record<string, object>`         | Manifest-eigene Metadaten zur Kanalkonfiguration, die vor dem Laden der Laufzeit in Erkennungs- und Validierungsoberflächen zusammengeführt werden.                                                        |
| `skills`                            | Nein         | `string[]`                       | Skill-Verzeichnisse, die relativ zum Plugin-Root geladen werden sollen.                                                                                                                                       |
| `name`                              | Nein         | `string`                         | Menschlich lesbarer Plugin-Name.                                                                                                                                                                              |
| `description`                       | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                              |
| `version`                           | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                   |
| `uiHints`                           | Nein         | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Hinweise zur Sensitivität für Konfigurationsfelder.                                                                                                                       |

## Referenz zu `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                  |
| --------------------- | ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                  |
| `method`              | Ja           | `string`                                        | ID der Auth-Methode, an die weitergeleitet wird.                                                           |
| `choiceId`            | Ja           | `string`                                        | Stabile ID der Auth-Auswahl, die von Onboarding- und CLI-Abläufen verwendet wird.                         |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Beschriftung. Wenn weggelassen, fällt OpenClaw auf `choiceId` zurück.                     |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für den Picker.                                                                           |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Pickern früher sortiert.                   |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistenten-Pickern aus, erlaubt aber weiterhin die manuelle Auswahl per CLI.      |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Legacy-IDs von Auswahlmöglichkeiten, die Benutzer auf diese Ersatzauswahl umleiten sollen.                |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlmöglichkeiten.                                       |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Beschriftung für diese Gruppe.                                                             |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                           |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit nur einem Flag.                                   |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, z. B. `--openrouter-api-key`.                                                          |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, z. B. `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                        |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn weggelassen, ist der Standardwert `["text-inference"]`. |

## Referenz zu `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen besitzt, den Benutzer
möglicherweise fälschlicherweise in `plugins.allow` eintragen oder als CLI-Befehl auf Root-Ebene ausführen möchten. OpenClaw
verwendet diese Metadaten für Diagnosen, ohne den Laufzeitcode des Plugins zu importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                        |
| ------------ | ------------ | ----------------- | -------------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                        |
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl statt als CLI-Befehl auf Root-Ebene. |
| `cliCommand` | Nein         | `string`          | Zugehöriger CLI-Befehl auf Root-Ebene, der für CLI-Operationen vorgeschlagen werden soll, falls vorhanden. |

## Referenz zu `uiHints`

`uiHints` ist eine Zuordnung von Konfigurationsfeldnamen zu kleinen Render-Hinweisen.

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

| Feld          | Typ        | Bedeutung                                  |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Benutzerseitige Feldbezeichnung.           |
| `help`        | `string`   | Kurzer Hilfetext.                          |
| `tags`        | `string[]` | Optionale UI-Tags.                         |
| `advanced`    | `boolean`  | Kennzeichnet das Feld als erweitert.       |
| `sensitive`   | `boolean`  | Kennzeichnet das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.      |

## Referenz zu `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Fähigkeitseigentümerschaft, die OpenClaw
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

| Feld                             | Typ        | Bedeutung                                                       |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Sprach-Provider-IDs, die diesem Plugin gehören.                 |
| `realtimeTranscriptionProviders` | `string[]` | Provider-IDs für Echtzeit-Transkription, die diesem Plugin gehören. |
| `realtimeVoiceProviders`         | `string[]` | Provider-IDs für Echtzeit-Stimme, die diesem Plugin gehören.    |
| `mediaUnderstandingProviders`    | `string[]` | Provider-IDs für Medienverständnis, die diesem Plugin gehören.  |
| `imageGenerationProviders`       | `string[]` | Provider-IDs für Bildgenerierung, die diesem Plugin gehören.    |
| `videoGenerationProviders`       | `string[]` | Provider-IDs für Videogenerierung, die diesem Plugin gehören.   |
| `webFetchProviders`              | `string[]` | Provider-IDs für Web-Fetch, die diesem Plugin gehören.          |
| `webSearchProviders`             | `string[]` | Provider-IDs für Websuche, die diesem Plugin gehören.           |
| `tools`                          | `string[]` | Agent-Tool-Namen, die diesem Plugin für gebündelte Vertragsprüfungen gehören. |

## Referenz zu `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin günstige Konfigurationsmetadaten benötigt, bevor
die Laufzeit lädt.

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

Jeder Kanaleintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                     |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanalkonfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen/Platzhalter/Hinweise zur Sensitivität für diesen Abschnitt der Kanalkonfiguration. |
| `label`       | `string`                 | Kanalbeschriftung, die in Picker- und Inspektionsoberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                              |
| `preferOver`  | `string[]`               | Legacy- oder Plug-in-IDs mit geringerer Priorität, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz zu `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus
Kurzschreibweisen von Modell-IDs wie `gpt-5.4` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit
lädt.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet folgende Priorität an:

- explizite `provider/model`-Referenzen verwenden die Manifest-Metadaten des besitzenden `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide passen, gewinnt das nicht gebündelte
  Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                        |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzschreibweisen von Modell-IDs abgeglichen werden. |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen von Profilsuffixen gegen Kurzschreibweisen von Modell-IDs abgeglichen werden. |

Legacy-Fähigkeitsschlüssel auf oberster Ebene sind veraltet. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; das normale
Laden des Manifests behandelt diese Felder auf oberster Ebene nicht mehr als
Fähigkeitseigentümerschaft.

## Manifest im Vergleich zu `package.json`

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Erkennung, Konfigurationsvalidierung, Metadaten für Auth-Auswahlmöglichkeiten und UI-Hinweise, die vorhanden sein müssen, bevor der Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Abhängigkeitsinstallation und den `openclaw`-Block, der für Entrypoints, Installations-Gating, Setup oder Katalog-Metadaten verwendet wird |

Wenn Sie unsicher sind, wo ein Metadatenelement hingehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Entry-Dateien oder das npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die die Erkennung beeinflussen

Einige Plugin-Metadaten vor der Laufzeit liegen absichtlich in `package.json` unter dem
`openclaw`-Block statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Entrypoints.                                                                                                          |
| `openclaw.setupEntry`                                             | Leichtgewichtiger Setup-only-Entrypoint, der während des Onboardings und beim verzögerten Kanalstart verwendet wird.                         |
| `openclaw.channel`                                                | Leichtgewichtige Kanal-Katalogmetadaten wie Beschriftungen, Dokumentationspfade, Aliasse und Auswahltext.                                    |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für den Prüfer des konfigurierten Status, die beantworten können: „Existiert env-only-Setup bereits?“, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für den Prüfer persistierter Authentifizierung, die beantworten können: „Ist bereits irgendetwas angemeldet?“, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hinweise zur Installation/Aktualisierung für gebündelte und extern veröffentlichte Plugins.                                                   |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                              |
| `openclaw.install.minHostVersion`                                 | Minimal unterstützte OpenClaw-Host-Version mit einer Semver-Untergrenze wie `>=2026.3.22`.                                                   |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen eng begrenzten Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Ermöglicht das Laden von Setup-only-Kanaloberflächen vor dem vollständigen Kanal-Plugin während des Starts.                                  |

`openclaw.install.minHostVersion` wird während der Installation und beim Laden des
Manifest-Registrys erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das
Plugin auf älteren Hosts.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es macht
nicht beliebige defekte Konfigurationen installierbar. Derzeit erlaubt es nur Installations-
Abläufen, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa einem
fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten `channels.<id>`-Eintrag für genau dieses
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und schicken
Operatoren zu `openclaw doctor --fix`.

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

Verwenden Sie dies, wenn Setup-, Doctor- oder Abläufe für den konfigurierten Status vor dem Laden des vollständigen
Kanal-Plugins eine günstige Ja/Nein-Auth-Probe benötigen. Der Ziel-Export sollte eine kleine
Funktion sein, die nur persistierten Status liest; leiten Sie dies nicht über das vollständige
Barrel der Kanal-Laufzeit.

`openclaw.channel.configuredState` folgt derselben Form für günstige env-only-
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

Verwenden Sie dies, wenn ein Kanal den konfigurierten Status aus env oder anderen kleinen
Nicht-Laufzeit-Eingaben beantworten kann. Wenn die Prüfung eine vollständige Konfigurationsauflösung oder die echte
Kanal-Laufzeit benötigt, belassen Sie diese Logik stattdessen im Hook `config.hasConfiguredState`
des Plugins.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, es sei denn, die Kanal-ID wird durch
  ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **erkennbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  in Doctor + Logs wird eine **Warnung** ausgegeben.

Das vollständige Schema von `plugins.*` finden Sie unter [Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge.
- Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der
  Erkennung + Validierung.
- Native Manifeste werden mit JSON5 geparst, daher werden Kommentare, nachgestellte Kommata und
  nicht in Anführungszeichen gesetzte Schlüssel akzeptiert, solange der Endwert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie es,
  hier benutzerdefinierte Schlüssel auf oberster Ebene hinzuzufügen.
- `providerAuthEnvVars` ist der günstige Metadatenpfad für Auth-Probes, Validierung von Env-Markern
  und ähnliche Provider-Auth-Oberflächen, die die Plugin-Laufzeit nicht starten sollten, nur um Env-Namen zu prüfen.
- `providerAuthAliases` erlaubt es Providervarianten, die Auth-
  Env-Variablen, Auth-Profile, konfigurationsgestützte Authentifizierung und die
  API-Schlüssel-Onboarding-Auswahl eines anderen Providers wiederzuverwenden, ohne diese Beziehung im Core fest zu codieren.
- `channelEnvVars` ist der günstige Metadatenpfad für Shell-Env-Fallback, Setup-
  Prompts und ähnliche Kanaloberflächen, die die Plugin-Laufzeit nicht starten sollten,
  nur um Env-Namen zu prüfen.
- `providerAuthChoices` ist der günstige Metadatenpfad für Picker für Auth-Auswahlmöglichkeiten,
  Auflösung von `--auth-choice`, Zuordnung bevorzugter Provider und einfache Registrierung von Onboarding-
  CLI-Flags, bevor die Provider-Laufzeit lädt. Für Metadaten von Laufzeit-Wizards,
  die Providercode benötigen, siehe
  [Provider-Laufzeit-Hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird durch `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird durch `plugins.slots.contextEngine`
    ausgewählt (Standard: eingebautes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein
  Plugin sie nicht benötigt.
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle
  Anforderungen an die Allowlist des Paketmanagers (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — Einstieg in Plugins
- [Plugin-Architektur](/de/plugins/architecture) — interne Architektur
- [SDK-Überblick](/de/plugins/sdk-overview) — Referenz zum Plugin-SDK
