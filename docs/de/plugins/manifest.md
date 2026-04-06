---
read_when:
    - Sie entwickeln ein OpenClaw-Plugin
    - Sie müssen ein Schema für die Plugin-Konfiguration ausliefern oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-06T03:09:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f915a761cdb5df77eba5d2ccd438c65445bd2ab41b0539d1200e63e8cf2c3a
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (openclaw.plugin.json)

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponenten-
  Layout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch
nicht anhand des hier beschriebenen Schemas für `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte
Skill-Roots, Claude-Befehls-Roots, Standardwerte aus `settings.json` für Claude-Bundles,
Standardwerte für Claude-Bundle-LSPs und unterstützte Hook-Packs, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** bereitstellen. OpenClaw verwendet dieses Manifest, um die Konfiguration
**ohne Ausführung von Plugin-Code** zu validieren. Fehlende oder ungültige Manifeste
werden als Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Den vollständigen Leitfaden zum Plugin-System finden Sie unter: [Plugins](/de/tools/plugin).
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
- Alias- und Autoaktivierungs-Metadaten, die aufgelöst werden sollen, bevor die Plugin-Laufzeit lädt
- Kurzform-Metadaten zur Zugehörigkeit von Modellfamilien, die das
  Plugin vor dem Laden der Laufzeit automatisch aktivieren sollen
- statische Snapshots der Fähigkeitszuordnung, die für kompatible gebündelte Verdrahtung und
  Vertragsabdeckung verwendet werden
- kanalspezifische Konfigurationsmetadaten, die ohne Laden der Laufzeit in Katalog- und Validierungsoberflächen zusammengeführt werden sollen
- Hinweise für die Konfigurations-UI

Verwenden Sie sie nicht für:

- Registrierung von Laufzeitverhalten
- Deklaration von Code-Einstiegspunkten
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
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

## Referenz für Felder auf oberster Ebene

| Feld                                | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                    |
| ----------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                        |
| `configSchema`                      | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                     |
| `enabledByDefault`                  | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie das Feld weg oder setzen Sie einen anderen Wert als `true`, damit das Plugin standardmäßig deaktiviert bleibt.                    |
| `legacyPluginIds`                   | Nein         | `string[]`                       | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                       |
| `autoEnableWhenConfiguredProviders` | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modellreferenzen sie erwähnen.                                                                                 |
| `kind`                              | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                             |
| `channels`                          | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Werden für Discovery und Konfigurationsvalidierung verwendet.                                                                                                         |
| `providers`                         | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                     |
| `modelSupport`                      | Nein         | `object`                         | Manifest-eigene Kurzform-Metadaten für Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                          |
| `providerAuthEnvVars`               | Nein         | `Record<string, string[]>`       | Leichtgewichtige Env-Metadaten für Provider-Authentifizierung, die OpenClaw ohne Laden von Plugin-Code prüfen kann.                                                                                        |
| `providerAuthChoices`               | Nein         | `object[]`                       | Leichtgewichtige Metadaten für Auth-Auswahloptionen für Onboarding-Auswahlen, bevorzugte Provider-Auflösung und einfache CLI-Flag-Verdrahtung.                                                            |
| `contracts`                         | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeiten für Speech, Realtime-Transkription, Realtime-Voice, Media Understanding, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Web Search und Tool-Zugehörigkeit. |
| `channelConfigs`                    | Nein         | `Record<string, object>`         | Manifest-eigene Kanal-Konfigurationsmetadaten, die vor dem Laden der Laufzeit in Discovery- und Validierungsoberflächen zusammengeführt werden.                                                            |
| `skills`                            | Nein         | `string[]`                       | Skill-Verzeichnisse, die geladen werden sollen, relativ zum Plugin-Root.                                                                                                                                     |
| `name`                              | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                |
| `description`                       | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                             |
| `version`                           | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                  |
| `uiHints`                           | Nein         | `Record<string, object>`         | UI-Labels, Platzhalter und Hinweise zur Sensitivität für Konfigurationsfelder.                                                                                                                               |

## Referenz für providerAuthChoices

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest diese Daten, bevor die Provider-Laufzeit lädt.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                     |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                     |
| `method`              | Ja           | `string`                                        | ID der Auth-Methode, an die weitergeleitet wird.                                                              |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Auswahl-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                                |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitiges Label. Wenn es fehlt, verwendet OpenClaw stattdessen `choiceId`.                            |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                             |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.                    |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistenten-Auswahlen aus, erlaubt aber weiterhin manuelle Auswahl über die CLI.      |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Veraltete Auswahl-IDs, die Benutzer auf diese Ersatzauswahl umleiten sollen.                                 |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren zusammengehöriger Auswahlen.                                              |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitiges Label für diese Gruppe.                                                                      |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                              |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit einem Flag.                                           |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, z. B. `--openrouter-api-key`.                                                             |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, z. B. `--openrouter-api-key <key>`.                                         |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                            |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn es fehlt, ist der Standard `["text-inference"]`. |

## Referenz für uiHints

`uiHints` ist eine Zuordnung von Namen von Konfigurationsfeldern zu kleinen Renderhinweisen.

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

| Feld          | Typ        | Bedeutung                                 |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Benutzerseitiges Feldlabel.               |
| `help`        | `string`   | Kurzer Hilfetext.                         |
| `tags`        | `string[]` | Optionale UI-Tags.                        |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.          |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.     |

## Referenz für contracts

Verwenden Sie `contracts` nur für statische Metadaten zur Fähigkeitszuordnung, die OpenClaw
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
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                 |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-Transkriptions-Provider-IDs, die diesem Plugin gehören. |
| `realtimeVoiceProviders`         | `string[]` | Realtime-Voice-Provider-IDs, die diesem Plugin gehören.         |
| `mediaUnderstandingProviders`    | `string[]` | Media-Understanding-Provider-IDs, die diesem Plugin gehören.    |
| `imageGenerationProviders`       | `string[]` | Bildgenerierungs-Provider-IDs, die diesem Plugin gehören.       |
| `videoGenerationProviders`       | `string[]` | Videogenerierungs-Provider-IDs, die diesem Plugin gehören.      |
| `webFetchProviders`              | `string[]` | Web-Fetch-Provider-IDs, die diesem Plugin gehören.              |
| `webSearchProviders`             | `string[]` | Web-Search-Provider-IDs, die diesem Plugin gehören.             |
| `tools`                          | `string[]` | Agent-Tool-Namen, die diesem Plugin für gebündelte Vertragsprüfungen gehören. |

## Referenz für channelConfigs

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin leichtgewichtige Konfigurationsmetadaten benötigt, bevor
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

| Feld          | Typ                      | Bedeutung                                                                                   |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanal-Konfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Labels/Platzhalter/Hinweise zur Sensitivität für diesen Kanal-Konfigurationsabschnitt. |
| `label`       | `string`                 | Kanal-Label, das in Auswahl- und Prüfoberflächen zusammengeführt wird, wenn Laufzeitmetadaten nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Prüf- und Katalogoberflächen.                                  |
| `preferOver`  | `string[]`               | Veraltete oder weniger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz für modelSupport

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus
Kurzform-Modell-IDs wie `gpt-5.4` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit
lädt.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw verwendet dabei diese Priorität:

- explizite Referenzen `provider/model` verwenden die manifest-eigenen Metadaten aus `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte
  Plugin
- verbleibende Mehrdeutigkeiten werden ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` mit Kurzform-Modell-IDs abgeglichen werden.      |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach Entfernen des Profilsuffixes mit Kurzform-Modell-IDs abgeglichen werden. |

Veraltete Fähigkeitsschlüssel auf oberster Ebene sind deprecated. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; das normale
Laden von Manifesten behandelt diese Felder auf oberster Ebene nicht mehr als
Fähigkeitszuordnung.

## Manifest versus package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Metadaten für Auth-Auswahloptionen und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installieren von Abhängigkeiten und den Block `openclaw`, der für Einstiegspunkte, Installationssteuerung, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wo ein Metadatenelement hingehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Einstiegsdateien oder das npm-Installationsverhalten geht, gehört es in `package.json`

### package.json-Felder, die Discovery beeinflussen

Einige Plugin-Metadaten vor der Laufzeit liegen absichtlich unter dem Block `openclaw` in `package.json` statt in
`openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Einstiegspunkte.                                                                                                    |
| `openclaw.setupEntry`                                             | Leichtgewichtiger, nur für das Setup verwendeter Einstiegspunkt, der während des Onboardings und beim verzögerten Kanalstart verwendet wird. |
| `openclaw.channel`                                                | Leichtgewichtige Kanal-Katalogmetadaten wie Labels, Dokumentationspfade, Aliasse und Auswahltexte.                                          |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für Prüfungen des konfigurierten Zustands, die „existiert bereits eine reine Env-Einrichtung?“ beantworten können, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für Prüfungen des gespeicherten Auth-Zustands, die „ist bereits irgendetwas angemeldet?“ beantworten können, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hinweise zur Installation/Aktualisierung für gebündelte und extern veröffentlichte Plugins.                                                  |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                             |
| `openclaw.install.minHostVersion`                                 | Mindestunterstützte OpenClaw-Hostversion, als Semver-Untergrenze wie `>=2026.3.22`.                                                         |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen eng begrenzten Wiederherstellungspfad für die Neuinstallation gebündelter Plugins bei ungültiger Konfiguration.               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Erlaubt, dass reine Setup-Kanaloberflächen beim Start vor dem vollständigen Kanal-Plugin geladen werden.                                     |

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das Plugin auf älteren Hosts.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es macht nicht beliebige fehlerhafte Konfigurationen installierbar. Derzeit erlaubt es Installationsabläufen nur, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa einem fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten Eintrag `channels.<id>` für genau dieses gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und verweisen Operatoren an `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Package-Metadaten für ein kleines Prüfmodul:

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

Verwenden Sie dies, wenn Setup-, Doctor- oder konfigurierter-Zustand-Abläufe vor dem Laden des vollständigen Kanal-Plugins eine leichtgewichtige Ja/Nein-Auth-Prüfung benötigen. Das Ziel-Export sollte eine kleine Funktion sein, die nur gespeicherten Zustand liest; leiten Sie es nicht über das vollständige Laufzeit-Barrel des Kanals.

`openclaw.channel.configuredState` folgt derselben Form für leichtgewichtige Prüfungen eines nur per Env konfigurierten Zustands:

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

Verwenden Sie dies, wenn ein Kanal den konfigurierten Zustand aus Env oder anderen kleinen
Eingaben außerhalb der Laufzeit beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung oder die echte
Kanal-Laufzeit erfordert, belassen Sie diese Logik stattdessen im Hook `config.hasConfiguredState` des Plugins.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte Schlüssel in `channels.*` sind **Fehler**, es sei denn, die Kanal-ID wird
  von einem Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **auffindbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein fehlerhaftes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration vorhanden ist, das Plugin aber **deaktiviert** ist, bleibt
  die Konfiguration erhalten und es wird eine **Warnung** in Doctor + Protokollen angezeigt.

Unter [Konfigurationsreferenz](/de/gateway/configuration) finden Sie das vollständige Schema für `plugins.*`.

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge.
- Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur für
  Discovery + Validierung.
- Native Manifeste werden mit JSON5 geparst, daher werden Kommentare, nachgestellte Kommas und
  unquotierte Schlüssel akzeptiert, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Lader gelesen. Vermeiden Sie es,
  hier benutzerdefinierte Schlüssel auf oberster Ebene hinzuzufügen.
- `providerAuthEnvVars` ist der leichtgewichtige Metadatenpfad für Auth-Prüfungen, Env-Marker-
  Validierung und ähnliche Oberflächen für Provider-Authentifizierung, die die Plugin-Laufzeit nicht starten sollen, nur um Env-Namen zu prüfen.
- `providerAuthChoices` ist der leichtgewichtige Metadatenpfad für Auswahlen von Auth-Optionen,
  die Auflösung von `--auth-choice`, die Zuordnung bevorzugter Provider und die einfache Registrierung von
  Onboarding-CLI-Flags, bevor die Provider-Laufzeit lädt. Für Assistenten-Metadaten zur Laufzeit,
  die Provider-Code benötigen, siehe
  [Provider-Laufzeit-Hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird von `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird von `plugins.slots.contextEngine`
    ausgewählt (Standard: integriertes `legacy`).
- `channels`, `providers` und `skills` können weggelassen werden, wenn ein
  Plugin sie nicht benötigt.
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle
  Anforderungen an die Allowlist des Paketmanagers (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandt

- [Plugins entwickeln](/de/plugins/building-plugins) — erste Schritte mit Plugins
- [Plugin-Architektur](/de/plugins/architecture) — interne Architektur
- [SDK-Überblick](/de/plugins/sdk-overview) — Referenz für das Plugin SDK
