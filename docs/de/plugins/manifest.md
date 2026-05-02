---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-05-02T06:40:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 371a7364374df57c0b4a55229b86beea24140d0b352a54e8281e103bf66f5662
    source_path: plugins/manifest.md
    workflow: 16
---

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout
  ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch nicht
gegen das hier beschriebene Schema `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte
Skill-Roots, Claude-Befehls-Roots, Standardwerte aus dem Claude-Bundle `settings.json`,
Claude-Bundle-LSP-Standardwerte und unterstützte Hook-Packs, wenn das Layout den
OpenClaw-Runtime-Erwartungen entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** ausliefern. OpenClaw verwendet dieses Manifest, um Konfiguration
**ohne Ausführung von Plugin-Code** zu validieren. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe den vollständigen Leitfaden zum Plugin-System: [Plugins](/de/tools/plugin).
Zum nativen Capability-Modell und den aktuellen Hinweisen zur externen Kompatibilität:
[Capability-Modell](/de/plugins/architecture#public-capability-model).

## Was diese Datei tut

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, **bevor es Ihren
Plugin-Code lädt**. Alles unten muss günstig genug sein, um es zu prüfen, ohne die
Plugin-Runtime zu starten.

**Verwenden Sie sie für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurations-UI
- Authentifizierung, Onboarding und Setup-Metadaten (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Authentifizierungsoptionen)
- Aktivierungshinweise für Control-Plane-Oberflächen
- Kurzschreibweisen für die Zuständigkeit von Modellfamilien
- statische Snapshots der Capability-Zuständigkeit (`contracts`)
- QA-Runner-Metadaten, die der gemeinsame `openclaw qa`-Host prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie sie nicht für:** das Registrieren von Runtime-Verhalten, das Deklarieren von Code-Entrypoints
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
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
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

| Field                                | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                         |
| ------------------------------------ | ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                              |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                          |
| `enabledByDefault`                   | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg oder setzen Sie einen beliebigen Wert ungleich `true`, um das Plugin standardmäßig deaktiviert zu lassen.                                          |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Legacy-IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth-, Konfigurations- oder Modell-Refs sie erwähnen.                                                                                                         |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                   |
| `channels`                           | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Wird für Erkennung und Konfigurationsvalidierung verwendet.                                                                                                                                 |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | Nein         | `string`                         | Leichtgewichtiger Modulpfad für die Provider-Erkennung, relativ zum Plugin-Stamm, für manifestgebundene Provider-Katalogmetadaten, die ohne Aktivierung der vollständigen Plugin-Runtime geladen werden können.                 |
| `modelSupport`                       | Nein         | `object`                         | Manifest-eigene Kurzform-Metadaten zur Modellfamilie, die verwendet werden, um das Plugin vor der Runtime automatisch zu laden.                                                                                                  |
| `modelCatalog`                       | Nein         | `object`                         | Deklarative Modellkatalog-Metadaten für Provider, die diesem Plugin gehören. Dies ist der Control-Plane-Kontrakt für zukünftige schreibgeschützte Auflistung, Onboarding, Modellauswahl, Aliasse und Unterdrückung ohne Laden der Plugin-Runtime. |
| `modelPricing`                       | Nein         | `object`                         | Provider-eigene Richtlinie für externe Preisabfragen. Verwenden Sie sie, um lokale/selbst gehostete Provider von Remote-Preiskatalogen auszunehmen oder Provider-Refs OpenRouter-/LiteLLM-Katalog-IDs zuzuordnen, ohne Provider-IDs im Core hart zu codieren. |
| `modelIdNormalization`               | Nein         | `object`                         | Provider-eigene Bereinigung von Modell-ID-Aliasen/Präfixen, die ausgeführt werden muss, bevor die Provider-Runtime geladen wird.                                                                                                  |
| `providerEndpoints`                  | Nein         | `object[]`                       | Manifest-eigene Endpoint-Host/baseUrl-Metadaten für Provider-Routen, die der Core klassifizieren muss, bevor die Provider-Runtime geladen wird.                                                                                  |
| `providerRequest`                    | Nein         | `object`                         | Leichtgewichtige Metadaten zu Provider-Familie und Request-Kompatibilität, die von der generischen Request-Richtlinie verwendet werden, bevor die Provider-Runtime geladen wird.                                                  |
| `cliBackends`                        | Nein         | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Wird für die automatische Aktivierung beim Start aus expliziten Konfigurations-Refs verwendet.                                                                               |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Refs, deren Plugin-eigener synthetischer Auth-Hook während der Cold-Modellerkennung geprüft werden soll, bevor die Runtime geladen wird.                                                               |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalter-API-Schlüsselwerte, die einem gebündelten Plugin gehören und nicht geheime lokale, OAuth- oder Umgebungs-Anmeldedatenzustände darstellen.                                                                              |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und Plugin-bewusste Konfigurations- und CLI-Diagnosen erzeugen sollen, bevor die Runtime geladen wird.                                                                                    |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Veraltete Kompatibilitäts-Env-Metadaten für Provider-Auth-/Statusabfragen. Bevorzugen Sie `setup.providers[].envVars` für neue Plugins; OpenClaw liest dies weiterhin während des Deprecation-Fensters.                         |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die für Auth-Abfragen eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der den API-Schlüssel und die Auth-Profile des Basis-Providers teilt.                                      |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Leichtgewichtige Kanal-Env-Metadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für Env-gesteuerte Kanaleinrichtung oder Auth-Oberflächen, die generische Start-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                       | Leichtgewichtige Auth-Auswahlmetadaten für Onboarding-Auswahlen, bevorzugte Provider-Auflösung und einfache CLI-Flag-Verkabelung.                                                                                                |
| `activation`                         | Nein         | `object`                         | Leichtgewichtige Aktivierungsplaner-Metadaten für Start-, Provider-, Befehls-, Kanal-, Routen- und Capability-ausgelöstes Laden. Nur Metadaten; die Plugin-Runtime besitzt weiterhin das tatsächliche Verhalten.                 |
| `setup`                              | Nein         | `object`                         | Leichtgewichtige Setup-/Onboarding-Deskriptoren, die Erkennungs- und Setup-Oberflächen prüfen können, ohne die Plugin-Runtime zu laden.                                                                                          |
| `qaRunners`                          | Nein         | `object[]`                       | Leichtgewichtige QA-Runner-Deskriptoren, die vom gemeinsamen `openclaw qa`-Host verwendet werden, bevor die Plugin-Runtime geladen wird.                                                                                         |
| `contracts`                          | Nein         | `object`                         | Statische Capability-Ownership-Momentaufnahme für externe Auth-Hooks, Sprache, Echtzeit-Transkription, Echtzeit-Sprache, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Ownership. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Leichtgewichtige Medienverständnis-Standardwerte für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                               |
| `imageGenerationProviderMetadata`    | Nein         | `Record<string, object>`         | Leichtgewichtige Auth-Metadaten zur Bildgenerierung für Provider-IDs, die in `contracts.imageGenerationProviders` deklariert sind, einschließlich Provider-eigener Auth-Aliasse und base-url-Guards.                            |
| `videoGenerationProviderMetadata`    | Nein         | `Record<string, object>`         | Leichtgewichtige Auth-Metadaten zur Videogenerierung für Provider-IDs, die in `contracts.videoGenerationProviders` deklariert sind, einschließlich Provider-eigener Auth-Aliasse und base-url-Guards.                           |
| `musicGenerationProviderMetadata`    | Nein         | `Record<string, object>`         | Leichtgewichtige Auth-Metadaten zur Musikgenerierung für Provider-IDs, die in `contracts.musicGenerationProviders` deklariert sind, einschließlich Provider-eigener Auth-Aliasse und base-url-Guards.                           |
| `toolMetadata`                       | Nein         | `Record<string, object>`         | Leichtgewichtige Verfügbarkeitsmetadaten für Plugin-eigene Tools, die in `contracts.tools` deklariert sind. Verwenden Sie sie, wenn ein Tool die Runtime nur laden soll, wenn Konfigurations-, Env- oder Auth-Nachweise vorhanden sind. |
| `channelConfigs`                     | Nein         | `Record<string, object>`         | Manifest-eigene Kanalkonfigurations-Metadaten, die in Erkennungs- und Validierungsoberflächen zusammengeführt werden, bevor die Runtime geladen wird.                                                                             |
| `skills`                             | Nein         | `string[]`                       | Skills-Verzeichnisse, die geladen werden sollen, relativ zum Plugin-Stamm.                                                                                                                                                         |
| `name`                               | Nein         | `string`                         | Für Menschen lesbarer Plugin-Name.                                                                                                                                                                                                 |
| `description`                        | Nein     | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                    |
| `version`                            | Nein     | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                         |
| `uiHints`                            | Nein     | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Hinweise zur Sensibilität für Konfigurationsfelder.                                                                                                                                              |

## Referenz für Metadaten von Generierungs-Providern

Die Metadatenfelder für Generierungs-Provider beschreiben statische Auth-Signale für
Provider, die in der passenden `contracts.*GenerationProviders`-Liste deklariert sind.
OpenClaw liest diese Felder, bevor die Provider-Runtime geladen wird, damit Core-Tools
entscheiden können, ob ein Generierungs-Provider verfügbar ist, ohne jedes
Provider-Plugin zu importieren.

Verwenden Sie diese Felder nur für einfache, deklarative Fakten. Transport, Request-
Transformationen, Token-Aktualisierung, Anmeldedatenvalidierung und das tatsächliche
Generierungsverhalten bleiben in der Plugin-Runtime.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Jeder Metadateneintrag unterstützt:

| Feld            | Erforderlich | Typ        | Bedeutung                                                                                                                            |
| --------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`       | Nein         | `string[]` | Zusätzliche Provider-IDs, die als statische Auth-Aliasse für den Generierungs-Provider zählen sollen.                                |
| `authProviders` | Nein         | `string[]` | Provider-IDs, deren konfigurierte Auth-Profile als Authentifizierung für diesen Generierungs-Provider zählen sollen.                 |
| `configSignals` | Nein         | `object[]` | Einfache, rein konfigurationsbasierte Verfügbarkeitssignale für lokale oder selbst gehostete Provider, die ohne Auth-Profile oder Umgebungsvariablen konfiguriert werden können. |
| `authSignals`   | Nein         | `object[]` | Explizite Auth-Signale. Wenn vorhanden, ersetzen sie den Standardsignalsatz aus Provider-ID, `aliases` und `authProviders`.          |

Jeder `configSignals`-Eintrag unterstützt:

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                                                                                                             |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Ja           | `string`   | Punktpfad zum Plugin-eigenen Konfigurationsobjekt, das geprüft werden soll, zum Beispiel `plugins.entries.example.config`.                                                            |
| `overlayPath` | Nein         | `string`   | Punktpfad innerhalb der Root-Konfiguration, dessen Objekt das Root-Objekt überlagern soll, bevor das Signal ausgewertet wird. Verwenden Sie dies für fähigkeitsspezifische Konfiguration wie `image`, `video` oder `music`. |
| `required`    | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, die konfigurierte Werte haben müssen. Zeichenfolgen dürfen nicht leer sein; Objekte und Arrays dürfen nicht leer sein.             |
| `requiredAny` | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, bei denen mindestens einer einen konfigurierten Wert haben muss.                                                                    |
| `mode`        | Nein         | `object`   | Optionaler Zeichenfolgen-Moduswächter innerhalb der effektiven Konfiguration. Verwenden Sie dies, wenn rein konfigurationsbasierte Verfügbarkeit nur für einen Modus gilt.            |

Jeder `mode`-Wächter unterstützt:

| Feld         | Erforderlich | Typ        | Bedeutung                                                                                         |
| ------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `path`       | Nein         | `string`   | Punktpfad innerhalb der effektiven Konfiguration. Standardwert ist `mode`.                        |
| `default`    | Nein         | `string`   | Moduswert, der verwendet wird, wenn die Konfiguration den Pfad auslässt.                           |
| `allowed`    | Nein         | `string[]` | Falls vorhanden, besteht das Signal nur, wenn der effektive Modus einer dieser Werte ist.          |
| `disallowed` | Nein         | `string[]` | Falls vorhanden, schlägt das Signal fehl, wenn der effektive Modus einer dieser Werte ist.         |

Jeder `authSignals`-Eintrag unterstützt:

| Feld              | Erforderlich | Typ      | Bedeutung                                                                                                                                                              |
| ----------------- | ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string` | Provider-ID, die in konfigurierten Auth-Profilen geprüft werden soll.                                                                                                  |
| `providerBaseUrl` | Nein         | `object` | Optionaler Wächter, durch den das Signal nur zählt, wenn der referenzierte konfigurierte Provider eine erlaubte Basis-URL verwendet. Verwenden Sie dies, wenn ein Auth-Alias nur für bestimmte APIs gültig ist. |

Jeder `providerBaseUrl`-Wächter unterstützt:

| Feld              | Erforderlich | Typ        | Bedeutung                                                                                                                                          |
| ----------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string`   | Provider-Konfigurations-ID, deren `baseUrl` geprüft werden soll.                                                                                   |
| `defaultBaseUrl`  | Nein         | `string`   | Basis-URL, die angenommen wird, wenn die Provider-Konfiguration `baseUrl` auslässt.                                                                 |
| `allowedBaseUrls` | Ja           | `string[]` | Erlaubte Basis-URLs für dieses Auth-Signal. Das Signal wird ignoriert, wenn die konfigurierte oder standardmäßige Basis-URL keinem dieser normalisierten Werte entspricht. |

## Referenz für Tool-Metadaten

`toolMetadata` verwendet dieselben `configSignals`- und `authSignals`-Formen wie
Metadaten von Generierungs-Providern, indiziert nach Tool-Namen. `contracts.tools` deklariert
die Zuständigkeit. `toolMetadata` deklariert einfache Verfügbarkeitsnachweise, damit OpenClaw
vermeiden kann, eine Plugin-Runtime nur dafür zu importieren, dass ihre Tool-Factory `null` zurückgibt.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Wenn ein Tool kein `toolMetadata` hat, behält OpenClaw das bestehende Verhalten bei und
lädt das zuständige Plugin, wenn der Tool-Vertrag zur Richtlinie passt. Für Hot-Path-
Tools, deren Factory von Authentifizierung/Konfiguration abhängt, sollten Plugin-Autoren
`toolMetadata` deklarieren, statt Core die Runtime importieren zu lassen, um nachzufragen.

## Referenz für providerAuthChoices

Jeder `providerAuthChoices`-Eintrag beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Provider-Runtime geladen wird.
Provider-Einrichtungslisten verwenden diese Manifest-Auswahlen, aus Deskriptoren abgeleitete
Einrichtungsauswahlen und Installationskatalog-Metadaten, ohne die Provider-Runtime zu laden.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                  |
| --------------------- | ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                  |
| `method`              | Ja           | `string`                                        | Auth-Methoden-ID, an die weitergeleitet werden soll.                                                       |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Auswahl-ID, die von Onboarding- und CLI-Flows verwendet wird.                                 |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Bezeichnung. Falls ausgelassen, fällt OpenClaw auf `choiceId` zurück.                      |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                          |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.                  |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistentenauswahlen aus, erlaubt aber weiterhin die manuelle CLI-Auswahl.          |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Legacy-Auswahl-IDs, die Benutzer zu dieser Ersatzauswahl umleiten sollen.                                  |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlen.                                                  |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Bezeichnung für diese Gruppe.                                                              |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                           |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Flows mit einem Flag.                                          |
| `cliFlag`             | Nein         | `string`                                        | CLI-Flag-Name, etwa `--openrouter-api-key`.                                                                |
| `cliOption`           | Nein         | `string`                                        | Vollständige CLI-Optionsform, etwa `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                         |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Falls ausgelassen, ist der Standard `["text-inference"]`. |

## Referenz für commandAliases

Verwenden Sie `commandAliases`, wenn ein Plugin einen Runtime-Befehlsnamen besitzt, den Benutzer
fälschlicherweise in `plugins.allow` eintragen oder als Root-CLI-Befehl auszuführen versuchen könnten. OpenClaw
verwendet diese Metadaten für Diagnosen, ohne Plugin-Runtime-Code zu importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                               |
| ------------ | ------------ | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                               |
| `kind`       | Nein         | `"runtime-slash"` | Markiert den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.     |
| `cliCommand` | Nein         | `string`          | Zugehöriger Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen wird, sofern vorhanden. |

## activation-Referenz

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Control-Plane-Ereignisse
es in einen Aktivierungs-/Ladeplan aufnehmen sollten.

Dieser Block ist Planner-Metadaten, keine Lifecycle-API. Er registriert kein
Runtime-Verhalten, ersetzt nicht `register(...)` und garantiert nicht, dass
Plugin-Code bereits ausgeführt wurde. Der Activation-Planner verwendet diese Felder, um
Kandidaten-Plugins einzugrenzen, bevor er auf vorhandene Manifest-Ownership-
Metadaten wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks zurückfällt.

Bevorzugen Sie die engsten Metadaten, die Ownership bereits beschreiben. Verwenden Sie
`providers`, `channels`, `commandAliases`, Setup-Deskriptoren oder `contracts`,
wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planner-
Hinweise, die sich nicht durch diese Ownership-Felder darstellen lassen.
Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Runtime-Aliasse wie `claude-cli`,
`codex-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist nur für
eingebettete Agent-Harness-IDs gedacht, die noch kein Ownership-Feld haben.

Dieser Block ist nur Metadaten. Er registriert kein Runtime-Verhalten und ersetzt nicht
`register(...)`, `setupEntry` oder andere Runtime-/Plugin-Einstiegspunkte.
Aktuelle Verbraucher verwenden ihn als Eingrenzungshinweis vor breiterem Plugin-Laden, daher
kosten fehlende Nicht-Startup-Aktivierungsmetadaten normalerweise nur Performance; sie
sollten die Korrektheit nicht verändern, solange Manifest-Ownership-Fallbacks weiterhin existieren.

Jedes Plugin sollte `activation.onStartup` bewusst setzen. Setzen Sie es nur dann auf `true`,
wenn das Plugin während des Gateway-Startups ausgeführt werden muss. Setzen Sie es auf `false`, wenn
das Plugin beim Startup inaktiv ist und nur durch engere Trigger geladen werden sollte.
Das Weglassen von `onStartup` lädt das Plugin beim Startup nicht mehr implizit; verwenden Sie explizite
Aktivierungsmetadaten für Startup, Kanal, Konfiguration, Agent-Harness, Speicher oder
andere engere Aktivierungstrigger.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Feld               | Erforderlich | Typ                                                  | Bedeutung                                                                                                                                                                                   |
| ------------------ | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nein         | `boolean`                                            | Explizite Gateway-Startup-Aktivierung. Jedes Plugin sollte dies setzen. `true` importiert das Plugin beim Startup; `false` hält es beim Startup lazy, sofern kein anderer passender Trigger das Laden erfordert. |
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                               |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Runtime-IDs eingebetteter Agent-Harnesses, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliasse.          |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                                |
| `onChannels`       | Nein         | `string[]`                                           | Kanal-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                                  |
| `onRoutes`         | Nein         | `string[]`                                           | Routenarten, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                                |
| `onConfigPaths`    | Nein         | `string[]`                                           | Root-relative Konfigurationspfade, die dieses Plugin in Startup-/Ladepläne aufnehmen sollten, wenn der Pfad vorhanden und nicht explizit deaktiviert ist.                                  |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Capability-Hinweise, die von der Control-Plane-Aktivierungsplanung verwendet werden. Bevorzugen Sie nach Möglichkeit engere Felder.                                                  |

Aktuelle Live-Verbraucher:

- Die Gateway-Startup-Planung verwendet `activation.onStartup` für expliziten Startup-
  Import
- Die befehlsgesteuerte CLI-Planung fällt auf Legacy-
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Die Agent-Runtime-Startup-Planung verwendet `activation.onAgentHarnesses` für
  eingebettete Harnesses und `cliBackends[]` auf oberster Ebene für CLI-Runtime-Aliasse
- Die kanalgetriggerte Setup-/Kanalplanung fällt auf Legacy-Ownership durch `channels[]`
  zurück, wenn explizite Kanalaktivierungsmetadaten fehlen
- Die Startup-Plugin-Planung verwendet `activation.onConfigPaths` für Nicht-Kanal-Root-
  Konfigurationsoberflächen wie den `browser`-Block des gebündelten Browser-Plugins
- Die providergetriggerte Setup-/Runtime-Planung fällt auf Legacy-Ownership durch
  `providers[]` und `cliBackends[]` auf oberster Ebene zurück, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

Planner-Diagnosen können explizite Aktivierungshinweise von Manifest-
Ownership-Fallback unterscheiden. Beispielsweise bedeutet `activation-command-hint`, dass
`activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der
Planner stattdessen `commandAliases`-Ownership verwendet hat. Diese Begründungslabels sind für
Host-Diagnosen und Tests gedacht; Plugin-Autoren sollten weiterhin die Metadaten deklarieren,
die Ownership am besten beschreiben.

## qaRunners-Referenz

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb
des gemeinsamen `openclaw qa`-Root beiträgt. Halten Sie diese Metadaten kostengünstig und statisch; die Plugin-
Runtime besitzt die tatsächliche CLI-Registrierung weiterhin über eine leichtgewichtige
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

| Feld          | Erforderlich | Typ      | Bedeutung                                                          |
| ------------- | ------------ | -------- | ------------------------------------------------------------------ |
| `commandName` | Ja           | `string` | Unterbefehl, der unterhalb von `openclaw qa` eingehängt wird, zum Beispiel `matrix`. |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

## setup-Referenz

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen kostengünstige, Plugin-eigene Metadaten
vor dem Laden der Runtime benötigen.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` auf oberster Ebene bleibt gültig und beschreibt weiterhin CLI-Inferenz-
Backends. `setup.cliBackends` ist die setupspezifische Deskriptoroberfläche für
Control-Plane-/Setup-Flows, die nur Metadaten bleiben sollten.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
deskriptorbasierte Lookup-Oberfläche für Setup-Erkennung. Wenn der Deskriptor nur
das Kandidaten-Plugin eingrenzt und Setup weiterhin umfassendere Runtime-Hooks zur Setup-Zeit
benötigt, setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als
Fallback-Ausführungspfad bei.

OpenClaw bezieht außerdem `setup.providers[].envVars` in generische Provider-Auth- und
Env-Var-Lookups ein. `providerAuthEnvVars` bleibt während des Deprecation-Fensters über einen Kompatibilitäts-
Adapter unterstützt, aber nicht gebündelte Plugins, die es weiterhin verwenden,
erhalten eine Manifest-Diagnose. Neue Plugins sollten Setup-/Status-Env-Metadaten
unter `setup.providers[].envVars` ablegen.

OpenClaw kann einfache Setup-Auswahlen auch aus `setup.providers[].authMethods`
ableiten, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false`
deklariert, dass Setup-Runtime unnötig ist. Explizite `providerAuthChoices`-Einträge bleiben
für benutzerdefinierte Labels, CLI-Flags, Onboarding-Umfang und Assistentenmetadaten bevorzugt.

Setzen Sie `requiresRuntime: false` nur, wenn diese Deskriptoren für die
Setup-Oberfläche ausreichen. OpenClaw behandelt explizites `false` als rein deskriptorbasierten Vertrag
und führt weder `setup-api` noch `openclaw.setupEntry` für Setup-Lookups aus. Wenn
ein rein deskriptorbasiertes Plugin dennoch einen dieser Setup-Runtime-Einträge ausliefert,
meldet OpenClaw eine additive Diagnose und ignoriert ihn weiterhin. Ein ausgelassenes
`requiresRuntime` behält das Legacy-Fallback-Verhalten bei, damit vorhandene Plugins, die
Deskriptoren ohne das Flag hinzugefügt haben, nicht brechen.

Da Setup-Lookup Plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte
Werte von `setup.providers[].id` und `setup.cliBackends[]` über alle erkannten Plugins hinweg eindeutig bleiben.
Uneindeutige Ownership schlägt geschlossen fehl, statt einen Gewinner aus der
Erkennungsreihenfolge auszuwählen.

Wenn Setup-Runtime ausgeführt wird, melden Setup-Registry-Diagnosen Deskriptor-
Drift, wenn `setup-api` einen Provider oder ein CLI-Backend registriert, das die Manifest-
Deskriptoren nicht deklarieren, oder wenn ein Deskriptor keine passende Runtime-
Registrierung hat. Diese Diagnosen sind additiv und lehnen Legacy-Plugins nicht ab.

### setup.providers-Referenz

| Feld           | Erforderlich | Typ        | Bedeutung                                                                                         |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding offengelegt wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods`  | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Provider unterstützt, ohne die vollständige Runtime zu laden. |
| `envVars`      | Nein         | `string[]` | Env-Vars, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Runtime lädt.   |
| `authEvidence` | Nein         | `object[]` | Kostengünstige lokale Auth-Nachweisprüfungen für Provider, die sich über nicht geheime Marker authentifizieren können. |

`authEvidence` ist für Provider-eigene lokale Anmeldedatenmarker vorgesehen, die ohne Laden von Runtime-Code verifiziert werden können. Diese Prüfungen müssen kostengünstig und lokal bleiben: keine Netzwerkaufrufe, keine Keychain- oder Secret-Manager-Lesezugriffe, keine Shell-Befehle und keine Provider-API-Prüfungen.

Unterstützte Nachweiseinträge:

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                                         |
| ------------------ | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja           | `string`   | Derzeit `local-file-with-env`.                                                                                                    |
| `fileEnvVar`       | Nein         | `string`   | Umgebungsvariable, die einen expliziten Pfad zur Anmeldedatendatei enthält.                                                       |
| `fallbackPaths`    | Nein         | `string[]` | Lokale Pfade zu Anmeldedatendateien, die geprüft werden, wenn `fileEnvVar` fehlt oder leer ist. Unterstützt `${HOME}` und `${APPDATA}`. |
| `requiresAnyEnv`   | Nein         | `string[]` | Mindestens eine der aufgeführten Umgebungsvariablen muss nicht leer sein, bevor der Nachweis gültig ist.                          |
| `requiresAllEnv`   | Nein         | `string[]` | Jede aufgeführte Umgebungsvariable muss nicht leer sein, bevor der Nachweis gültig ist.                                           |
| `credentialMarker` | Ja           | `string`   | Nicht geheimer Marker, der zurückgegeben wird, wenn der Nachweis vorhanden ist.                                                    |
| `source`           | Nein         | `string`   | Benutzerseitige Quellenbezeichnung für Authentifizierungs-/Statusausgaben.                                                       |

### setup-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                        |
| ------------------ | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Einrichtung und Onboarding verfügbar gemacht werden.                    |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Einrichtungszeit, die für deskriptorbasierte Setup-Suchen verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | Config-Migrations-IDs, die der Setup-Oberfläche dieses Plugins gehören.                                           |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach der Deskriptor-Suche weiterhin `setup-api`-Ausführung benötigt.                               |

## uiHints-Referenz

`uiHints` ist eine Zuordnung von Config-Feldnamen zu kleinen Rendering-Hinweisen.

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

| Feld          | Typ        | Bedeutung                                      |
| ------------- | ---------- | ---------------------------------------------- |
| `label`       | `string`   | Benutzerseitige Feldbezeichnung.              |
| `help`        | `string`   | Kurzer Hilfetext.                              |
| `tags`        | `string[]` | Optionale UI-Tags.                             |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.               |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel.    |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.          |

## contracts-Referenz

Verwenden Sie `contracts` nur für statische Metadaten zum Besitz von Fähigkeiten, die OpenClaw lesen kann, ohne die Plugin-Runtime zu importieren.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Jede Liste ist optional:

| Feld                             | Typ        | Bedeutung                                                                 |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Factory-IDs für Erweiterungen des Codex-App-Servers, derzeit `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-IDs, für die ein gebündeltes Plugin Tool-Ergebnis-Middleware registrieren darf. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren externen Auth-Profil-Hook dieses Plugin besitzt.       |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die dieses Plugin besitzt.                           |
| `realtimeTranscriptionProviders` | `string[]` | Echtzeit-Transkriptions-Provider-IDs, die dieses Plugin besitzt.           |
| `realtimeVoiceProviders`         | `string[]` | Echtzeit-Voice-Provider-IDs, die dieses Plugin besitzt.                   |
| `memoryEmbeddingProviders`       | `string[]` | Memory-Embedding-Provider-IDs, die dieses Plugin besitzt.                 |
| `mediaUnderstandingProviders`    | `string[]` | Media-Understanding-Provider-IDs, die dieses Plugin besitzt.              |
| `imageGenerationProviders`       | `string[]` | Image-Generation-Provider-IDs, die dieses Plugin besitzt.                 |
| `videoGenerationProviders`       | `string[]` | Video-Generation-Provider-IDs, die dieses Plugin besitzt.                 |
| `webFetchProviders`              | `string[]` | Web-Fetch-Provider-IDs, die dieses Plugin besitzt.                        |
| `webSearchProviders`             | `string[]` | Web-Search-Provider-IDs, die dieses Plugin besitzt.                       |
| `migrationProviders`             | `string[]` | Import-Provider-IDs, die dieses Plugin für `openclaw migrate` besitzt.    |
| `tools`                          | `string[]` | Namen von Agent-Tools, die dieses Plugin besitzt.                         |

`contracts.embeddedExtensionFactories` bleibt für gebündelte Erweiterungs-Factories vorgesehen, die ausschließlich dem Codex-App-Server dienen. Gebündelte Tool-Ergebnis-Transformationen sollten stattdessen `contracts.agentToolResultMiddleware` deklarieren und sich mit `api.registerAgentToolResultMiddleware(...)` registrieren. Externe Plugins können keine Tool-Ergebnis-Middleware registrieren, da die Schnittstelle Tool-Ausgaben mit hohem Vertrauen umschreiben kann, bevor das Modell sie sieht.

Runtime-Registrierungen über `api.registerTool(...)` müssen mit `contracts.tools` übereinstimmen. Die Tool-Erkennung verwendet diese Liste, um nur die Plugin-Runtimes zu laden, denen die angeforderten Tools gehören können.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten `contracts.externalAuthProviders` deklarieren. Plugins ohne diese Deklaration laufen weiterhin über einen veralteten Kompatibilitäts-Fallback, aber dieser Fallback ist langsamer und wird nach dem Migrationsfenster entfernt.

Gebündelte Memory-Embedding-Provider sollten `contracts.memoryEmbeddingProviders` für jede Adapter-ID deklarieren, die sie bereitstellen, einschließlich integrierter Adapter wie `local`. Eigenständige CLI-Pfade verwenden diesen Manifest-Vertrag, um nur das besitzende Plugin zu laden, bevor die vollständige Gateway-Runtime Provider registriert hat.

## mediaUnderstandingProviderMetadata-Referenz

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Media-Understanding-Provider Standardmodelle, eine Fallback-Priorität für automatische Authentifizierung oder native Dokumentunterstützung hat, die generische Kernhelfer vor dem Laden der Runtime benötigen. Schlüssel müssen auch in `contracts.mediaUnderstandingProviders` deklariert sein.

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

| Feld                   | Typ                                 | Bedeutung                                                                  |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medienfähigkeiten, die von diesem Provider verfügbar gemacht werden.       |
| `defaultModels`        | `Record<string, string>`            | Standardwerte von Fähigkeit zu Modell, die verwendet werden, wenn die Config kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden bei automatischem, anmeldedatenbasiertem Provider-Fallback früher einsortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.              |

## channelConfigs-Referenz

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin kostengünstige Config-Metadaten benötigt, bevor die Runtime geladen wird. Schreibgeschützte Erkennung von Kanal-Setup und -Status kann diese Metadaten direkt für konfigurierte externe Kanäle verwenden, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false` deklariert, dass die Setup-Runtime unnötig ist.

`channelConfigs` sind Plugin-Manifest-Metadaten, kein neuer oberster Benutzer-Config-Abschnitt. Benutzer konfigurieren Kanalinstanzen weiterhin unter `channels.<channel-id>`. OpenClaw liest Manifest-Metadaten, um zu entscheiden, welches Plugin diesen konfigurierten Kanal besitzt, bevor Plugin-Runtime-Code ausgeführt wird.

Für ein Kanal-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten auch passende `channelConfigs`-Einträge deklarieren. Ohne sie kann OpenClaw das Plugin weiterhin laden, aber Config-Schema, Setup und Control-UI-Oberflächen im Cold-Path können die Optionsstruktur, die dem Kanal gehört, erst kennen, wenn die Plugin-Runtime ausgeführt wird.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und `nativeSkillsAutoEnabled` können statische `auto`-Standardwerte für Befehls-Config-Prüfungen deklarieren, die vor dem Laden der Kanal-Runtime laufen. Gebündelte Kanäle können dieselben Standardwerte auch über `package.json#openclaw.channel.commands` neben ihren anderen paketverwalteten Kanal-Katalog-Metadaten veröffentlichen.

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Jeder Kanaleintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                                  |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema für `channels.<id>`. Für jeden deklarierten Kanal-Konfigurationseintrag erforderlich.          |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen/Platzhalter/Sensitivitätshinweise für diesen Kanal-Konfigurationsabschnitt.   |
| `label`       | `string`                 | Kanalbeschriftung, die in Auswahl- und Prüfoberflächen übernommen wird, wenn Laufzeitmetadaten nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Prüf- und Katalogoberflächen.                                                  |
| `commands`    | `object`                 | Statische native Befehls- und native Skill-Auto-Standardwerte für Konfigurationsprüfungen vor der Laufzeit. |
| `preferOver`  | `string[]`               | Legacy- oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll.   |

### Ersetzen eines anderen Kanal-Plugins

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Besitzer für eine Kanal-ID ist, die
auch ein anderes Plugin bereitstellen kann. Häufige Fälle sind eine umbenannte Plugin-ID, ein
eigenständiges Plugin, das ein gebündeltes Plugin ersetzt, oder ein gepflegter Fork, der
dieselbe Kanal-ID aus Gründen der Konfigurationskompatibilität beibehält.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Wenn `channels.chat` konfiguriert ist, berücksichtigt OpenClaw sowohl die Kanal-ID als auch
die bevorzugte Plugin-ID. Wenn das niedriger priorisierte Plugin nur ausgewählt wurde, weil
es gebündelt oder standardmäßig aktiviert ist, deaktiviert OpenClaw es in der effektiven
Laufzeitkonfiguration, sodass ein Plugin den Kanal und seine Tools besitzt. Eine explizite
Benutzerauswahl hat weiterhin Vorrang: Wenn der Benutzer beide Plugins ausdrücklich aktiviert,
behält OpenClaw diese Auswahl bei und meldet Diagnosen zu doppelten Kanälen/Tools, statt
den angeforderten Plugin-Satz stillschweigend zu ändern.

Beschränken Sie `preferOver` auf Plugin-IDs, die wirklich denselben Kanal bereitstellen können.
Es ist kein allgemeines Prioritätsfeld und benennt keine Benutzerkonfigurationsschlüssel um.

## modelSupport-Referenz

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus
Kurzform-Modell-IDs wie `gpt-5.5` oder `claude-sonnet-4.6` ableiten soll, bevor die
Plugin-Laufzeit geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet diese Priorität an:

- Explizite `provider/model`-Refs verwenden die besitzenden `providers`-Manifestmetadaten
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- Wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte
  Plugin
- Verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden. |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach Entfernen des Profilsuffixes gegen Kurzform-Modell-IDs abgeglichen werden. |

## modelCatalog-Referenz

Verwenden Sie `modelCatalog`, wenn OpenClaw Provider-Modellmetadaten kennen soll, bevor
die Plugin-Laufzeit geladen wird. Dies ist die manifestverwaltete Quelle für feste Katalogzeilen,
Provider-Aliasse, Unterdrückungsregeln und den Discovery-Modus. Die Laufzeitaktualisierung
gehört weiterhin in den Provider-Laufzeitcode, aber das Manifest teilt dem Core mit, wann Laufzeit
erforderlich ist.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Felder auf oberster Ebene:

| Feld           | Typ                                                      | Bedeutung                                                                                                  |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Schlüssel sollten auch in `providers` auf oberster Ebene erscheinen. |
| `aliases`      | `Record<string, object>`                                 | Provider-Aliasse, die für Katalog- oder Unterdrückungsplanung zu einem besessenen Provider aufgelöst werden sollen. |
| `suppressions` | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus Provider-spezifischem Grund unterdrückt.       |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Ob der Provider-Katalog aus Manifestmetadaten gelesen, in den Cache aktualisiert werden kann oder Laufzeit erfordert. |

`aliases` beteiligt sich an der Provider-Besitzsuche für die Modellkatalogplanung.
Aliasziele müssen Provider auf oberster Ebene sein, die demselben Plugin gehören. Wenn eine
Provider-gefilterte Liste einen Alias verwendet, kann OpenClaw das besitzende Manifest lesen und
Alias-API-/Basis-URL-Überschreibungen anwenden, ohne die Provider-Laufzeit zu laden.
Aliasse erweitern ungefilterte Katalogauflistungen nicht; breite Listen geben nur die besitzenden
kanonischen Provider-Zeilen aus.

`suppressions` ersetzt den alten Provider-Laufzeit-Hook `suppressBuiltInModel`.
Unterdrückungseinträge werden nur berücksichtigt, wenn der Provider dem Plugin gehört oder
als Schlüssel in `modelCatalog.aliases` deklariert ist, der auf einen besessenen Provider verweist. Laufzeit-
Unterdrückungs-Hooks werden während der Modellauflösung nicht mehr aufgerufen.

Provider-Felder:

| Feld      | Typ                      | Bedeutung                                                               |
| --------- | ------------------------ | ----------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionale Standard-Basis-URL für Modelle in diesem Provider-Katalog.    |
| `api`     | `ModelApi`               | Optionaler Standard-API-Adapter für Modelle in diesem Provider-Katalog. |
| `headers` | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten.     |
| `models`  | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.          |

Modellfelder:

| Feld            | Typ                                                            | Bedeutung                                                                  |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                     |
| `name`          | `string`                                                       | Optionaler Anzeigename.                                                    |
| `api`           | `ModelApi`                                                     | Optionale API-Überschreibung pro Modell.                                   |
| `baseUrl`       | `string`                                                       | Optionale Basis-URL-Überschreibung pro Modell.                             |
| `headers`       | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                     |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitäten, die das Modell akzeptiert.                                    |
| `reasoning`     | `boolean`                                                      | Ob das Modell Reasoning-Verhalten bereitstellt.                            |
| `contextWindow` | `number`                                                       | Native Provider-Kontextfenstergröße.                                       |
| `contextTokens` | `number`                                                       | Optionale effektive Laufzeit-Kontextobergrenze, wenn sie von `contextWindow` abweicht. |
| `maxTokens`     | `number`                                                       | Maximale Ausgabetokens, sofern bekannt.                                    |
| `cost`          | `object`                                                       | Optionale Preise in USD pro Million Token, einschließlich optionalem `tieredPricing`. |
| `compat`        | `object`                                                       | Optionale Kompatibilitätsflags, die der OpenClaw-Modellkonfigurationskompatibilität entsprechen. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Auflistungsstatus. Nur unterdrücken, wenn die Zeile gar nicht erscheinen darf. |
| `statusReason`  | `string`                                                       | Optionaler Grund, der bei nicht verfügbarem Status angezeigt wird.          |
| `replaces`      | `string[]`                                                     | Ältere Provider-lokale Modell-IDs, die dieses Modell ersetzt.              |
| `replacedBy`    | `string`                                                       | Ersatz-Provider-lokale Modell-ID für veraltete Zeilen.                     |
| `tags`          | `string[]`                                                     | Stabile Tags, die von Auswahloberflächen und Filtern verwendet werden.     |

Unterdrückungsfelder:

| Feld                       | Typ        | Bedeutung                                                                                                  |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-ID für die zu unterdrückende Upstream-Zeile. Muss diesem Plugin gehören oder als besessener Alias deklariert sein. |
| `model`                    | `string`   | Provider-lokale Modell-ID, die unterdrückt werden soll.                                                    |
| `reason`                   | `string`   | Optionale Meldung, die angezeigt wird, wenn die unterdrückte Zeile direkt angefordert wird.                |
| `when.baseUrlHosts`        | `string[]` | Optionale Liste effektiver Provider-Basis-URL-Hosts, die erforderlich sind, bevor die Unterdrückung greift. |
| `when.providerConfigApiIn` | `string[]` | Optionale Liste exakter Provider-Konfigurationswerte für `api`, die erforderlich sind, bevor die Unterdrückung greift. |

Nehmen Sie keine reinen Runtime-Daten in `modelCatalog` auf. Verwenden Sie `static` nur, wenn Manifest-Zeilen vollständig genug sind, damit nach Provider gefilterte Listen- und Auswahloberflächen Registry-/Runtime-Discovery überspringen können. Verwenden Sie `refreshable`, wenn Manifest-Zeilen als auflistbare Seeds oder Ergänzungen nützlich sind, ein Refresh/Cache später aber weitere Zeilen hinzufügen kann; refreshable-Zeilen sind für sich genommen nicht autoritativ. Verwenden Sie `runtime`, wenn OpenClaw die Provider-Runtime laden muss, um die Liste zu kennen.

## Referenz zu modelIdNormalization

Verwenden Sie `modelIdNormalization` für kostengünstige, vom Provider verwaltete Bereinigung von Modell-IDs, die erfolgen muss, bevor die Provider-Runtime geladen wird. Dadurch bleiben Aliasse wie kurze Modellnamen, providerlokale Legacy-IDs und Proxy-Präfixregeln im Manifest des zuständigen Plugins statt in Core-Tabellen für die Modellauswahl.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Provider-Felder:

| Feld                                 | Typ                     | Bedeutung                                                                                                  |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Exakte Modell-ID-Aliasse ohne Beachtung der Groß-/Kleinschreibung. Werte werden wie geschrieben zurückgegeben. |
| `stripPrefixes`                      | `string[]`              | Präfixe, die vor der Alias-Suche entfernt werden; nützlich bei Legacy-Duplikation von Provider/Modell.     |
| `prefixWhenBare`                     | `string`                | Präfix, das hinzugefügt wird, wenn die normalisierte Modell-ID noch kein `/` enthält.                      |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Bedingte Präfixregeln für Bare-IDs nach der Alias-Suche, nach `modelPrefix` und `prefix` indiziert.       |

## Referenz zu providerEndpoints

Verwenden Sie `providerEndpoints` für die Endpoint-Klassifizierung, die generische Anfrage-Policy kennen muss, bevor die Provider-Runtime geladen wird. Core besitzt weiterhin die Bedeutung jeder `endpointClass`; Plugin-Manifeste besitzen die Host- und Basis-URL-Metadaten.

Endpoint-Felder:

| Feld                           | Typ        | Bedeutung                                                                                                             |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekannte Core-Endpoint-Klasse, etwa `openrouter`, `moonshot-native` oder `google-vertex`.                            |
| `hosts`                        | `string[]` | Exakte Hostnamen, die der Endpoint-Klasse zugeordnet werden.                                                          |
| `hostSuffixes`                 | `string[]` | Host-Suffixe, die der Endpoint-Klasse zugeordnet werden. Stellen Sie `.` voran, um nur Domain-Suffixe abzugleichen. |
| `baseUrls`                     | `string[]` | Exakte normalisierte HTTP(S)-Basis-URLs, die der Endpoint-Klasse zugeordnet werden.                                  |
| `googleVertexRegion`           | `string`   | Statische Google-Vertex-Region für exakte globale Hosts.                                                              |
| `googleVertexRegionHostSuffix` | `string`   | Suffix, das von passenden Hosts entfernt wird, um das Präfix der Google-Vertex-Region offenzulegen.                  |

## Referenz zu providerRequest

Verwenden Sie `providerRequest` für kostengünstige Metadaten zur Anfragekompatibilität, die generische Anfrage-Policy benötigt, ohne die Provider-Runtime zu laden. Belassen Sie verhaltensspezifische Payload-Umschreibungen in Provider-Runtime-Hooks oder gemeinsamen Helfern für Provider-Familien.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Provider-Felder:

| Feld                  | Typ          | Bedeutung                                                                                                  |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Label der Provider-Familie, das generische Entscheidungen und Diagnosen zur Anfragekompatibilität verwenden. |
| `compatibilityFamily` | `"moonshot"` | Optionaler Kompatibilitäts-Bucket der Provider-Familie für gemeinsame Anfrage-Helfer.                      |
| `openAICompletions`   | `object`     | Anfrage-Flags für OpenAI-kompatible Completions, derzeit `supportsStreamingUsage`.                         |

## Referenz zu modelPricing

Verwenden Sie `modelPricing`, wenn ein Provider Pricing-Verhalten in der Control Plane benötigt, bevor die Runtime geladen wird. Der Pricing-Cache des Gateway liest diese Metadaten, ohne Provider-Runtime-Code zu importieren.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Provider-Felder:

| Feld         | Typ               | Bedeutung                                                                                                              |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Setzen Sie `false` für lokale/selbst gehostete Provider, die niemals OpenRouter- oder LiteLLM-Preise abrufen sollen. |
| `openRouter` | `false \| object` | Mapping für OpenRouter-Pricing-Lookups. `false` deaktiviert OpenRouter-Lookups für diesen Provider.                  |
| `liteLLM`    | `false \| object` | Mapping für LiteLLM-Pricing-Lookups. `false` deaktiviert LiteLLM-Lookups für diesen Provider.                        |

Quellfelder:

| Feld                       | Typ                | Bedeutung                                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe Katalog-Provider-ID, wenn sie von der OpenClaw-Provider-ID abweicht, zum Beispiel `z-ai` für einen `zai`-Provider.      |
| `passthroughProviderModel` | `boolean`          | Behandelt Modell-IDs mit Schrägstrich als verschachtelte Provider/Modell-Referenzen, nützlich für Proxy-Provider wie OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Zusätzliche Modell-ID-Varianten im externen Katalog. `version-dots` versucht gepunktete Versions-IDs wie `claude-opus-4.6`.     |

### OpenClaw Provider Index

Der OpenClaw Provider Index ist von OpenClaw verwaltete Preview-Metadaten für Provider, deren Plugins möglicherweise noch nicht installiert sind. Er ist nicht Teil eines Plugin-Manifests. Plugin-Manifeste bleiben die Autorität für installierte Plugins. Der Provider Index ist der interne Fallback-Vertrag, den zukünftige Oberflächen für installierbare Provider und vor der Installation verfügbare Modellauswahl verwenden, wenn ein Provider-Plugin nicht installiert ist.

Reihenfolge der Katalogautorität:

1. Benutzerkonfiguration.
2. Manifest `modelCatalog` des installierten Plugins.
3. Modellkatalog-Cache aus explizitem Refresh.
4. Preview-Zeilen des OpenClaw Provider Index.

Der Provider Index darf keine Secrets, keinen Aktivierungsstatus, keine Runtime-Hooks und keine Live-kontospezifischen Modelldaten enthalten. Seine Preview-Kataloge verwenden dieselbe Provider-Zeilenform von `modelCatalog` wie Plugin-Manifeste, sollten aber auf stabile Anzeigemetadaten beschränkt bleiben, sofern Runtime-Adapterfelder wie `api`, `baseUrl`, Pricing oder Kompatibilitäts-Flags nicht absichtlich mit dem installierten Plugin-Manifest synchron gehalten werden. Provider mit Live-Discovery über `/models` sollten aktualisierte Zeilen über den expliziten Cache-Pfad des Modellkatalogs schreiben, anstatt bei normaler Auflistung oder beim Onboarding Provider-APIs aufzurufen.

Provider-Index-Einträge können außerdem Metadaten zu installierbaren Plugins für Provider enthalten, deren Plugin aus Core herausgelöst wurde oder anderweitig noch nicht installiert ist. Diese Metadaten spiegeln das Muster des Channel-Katalogs wider: Paketname, npm-Installationsspezifikation, erwartete Integrität und kostengünstige Labels für Auth-Auswahl reichen aus, um eine installierbare Einrichtungsoption anzuzeigen. Sobald das Plugin installiert ist, gewinnt sein Manifest, und der Provider-Index-Eintrag wird für diesen Provider ignoriert.

Veraltete Capability-Schlüssel auf oberster Ebene sind deprecated. Verwenden Sie `openclaw doctor --fix`, um `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; normales Laden von Manifesten behandelt diese Felder auf oberster Ebene nicht mehr als Capability-Eigentümerschaft.

## Manifest versus package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Auth-Auswahl-Metadaten und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code läuft |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und den `openclaw`-Block für Einstiegspunkte, Installations-Gating, Einrichtung oder Katalogmetadaten |

Wenn Sie unsicher sind, wohin ein Metadatenelement gehört, verwenden Sie diese Regel:

- Wenn OpenClaw es vor dem Laden von Plugin-Code kennen muss, legen Sie es in `openclaw.plugin.json` ab.
- Wenn es um Packaging, Einstiegspunktdateien oder npm-Installationsverhalten geht, legen Sie es in `package.json` ab.

### package.json-Felder, die Discovery beeinflussen

Einige Pre-Runtime-Plugin-Metadaten liegen absichtlich in `package.json` unter dem `openclaw`-Block statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Deklariert native Plugin-Einstiegspunkte. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                     |
| `openclaw.runtimeExtensions`                                      | Deklariert gebaute JavaScript-Runtime-Einstiegspunkte für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                |
| `openclaw.setupEntry`                                             | Leichter, nur für Setup verwendeter Einstiegspunkt für Onboarding, verzögerten Kanalstart und schreibgeschützte Kanalstatus-/SecretRef-Erkennung. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                      | Deklariert den gebauten JavaScript-Setup-Einstiegspunkt für installierte Pakete. Erfordert `setupEntry`, muss vorhanden sein und muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.channel`                                                | Günstige Kanalkatalog-Metadaten wie Labels, Dokumentationspfade, Aliasse und Auswahltexte.                                                                                           |
| `openclaw.channel.commands`                                       | Statische native Befehls- und native Skill-Auto-Default-Metadaten, die von Konfigurations-, Audit- und Befehlslisten-Oberflächen verwendet werden, bevor die Kanal-Runtime lädt.     |
| `openclaw.channel.configuredState`                                | Leichte Metadaten für konfigurierte Statusprüfer, die „existiert bereits ein reines Env-Setup?“ beantworten können, ohne die vollständige Kanal-Runtime zu laden.                    |
| `openclaw.channel.persistedAuthState`                             | Leichte Metadaten für persistierte Auth-Prüfer, die „ist bereits irgendetwas angemeldet?“ beantworten können, ohne die vollständige Kanal-Runtime zu laden.                          |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installations-/Update-Hinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                     |
| `openclaw.install.minHostVersion`                                 | Minimal unterstützte OpenClaw-Hostversion, mit einer Semver-Untergrenze wie `>=2026.3.22` oder `>=2026.5.1-beta.1`.                                                                 |
| `openclaw.install.expectedIntegrity`                              | Erwarteter npm-Dist-Integritätsstring wie `sha512-...`; Installations- und Update-Flows prüfen das abgerufene Artefakt dagegen.                                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen engen Wiederherstellungspfad per Neuinstallation eines gebündelten Plugins, wenn die Konfiguration ungültig ist.                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Ermöglicht, dass reine Setup-Kanaloberflächen vor dem vollständigen Kanal-Plugin während des Starts geladen werden.                                                                  |

Manifest-Metadaten entscheiden, welche Provider-/Kanal-/Setup-Auswahlen im
Onboarding erscheinen, bevor die Runtime lädt. `package.json#openclaw.install` teilt
dem Onboarding mit, wie dieses Plugin abgerufen oder aktiviert werden soll, wenn der Benutzer eine dieser
Auswahlen trifft. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-
Registry für nicht gebündelte Plugin-Quellen erzwungen. Ungültige Werte werden abgelehnt;
neuere, aber gültige Werte überspringen externe Plugins auf älteren Hosts. Gebündelte Quell-
Plugins werden als mit dem Host-Checkout gleich versioniert angenommen.

Exaktes npm-Versions-Pinning steht bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalog-
Einträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Update-Flows
geschlossen fehlschlagen, wenn das abgerufene npm-Artefakt nicht mehr zur gepinnten Version passt.
Interaktives Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige Registry-npm-Spezifikationen an,
einschließlich reiner Paketnamen und Dist-Tags. Katalogdiagnosen können
exakte, schwebende, integritätsgepinnte, fehlende Integrität, Paketnamen-
Abweichungen und ungültige Default-Choice-Quellen unterscheiden. Sie warnen außerdem, wenn
`expectedIntegrity` vorhanden ist, es aber keine gültige npm-Quelle gibt, die damit gepinnt werden kann.
Wenn `expectedIntegrity` vorhanden ist,
erzwingen Installations-/Update-Flows sie; wenn sie fehlt, wird die Registry-Auflösung
ohne Integritäts-Pin aufgezeichnet.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status-, Kanallisten-
oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige
Runtime zu laden. Der Setup-Einstiegspunkt sollte Kanalmetadaten sowie setup-sichere Konfigurations-,
Status- und Secrets-Adapter bereitstellen; halten Sie Netzwerkclients, Gateway-Listener und
Transport-Runtimes im Haupteinstiegspunkt der Erweiterung.

Runtime-Einstiegspunktfelder setzen Paketgrenzenprüfungen für Quell-
Einstiegspunktfelder nicht außer Kraft. Beispielsweise kann `openclaw.runtimeExtensions` keinen
ausbrechenden `openclaw.extensions`-Pfad ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es macht
nicht beliebige defekte Konfigurationen installierbar. Derzeit erlaubt es Installations-
Flows nur die Wiederherstellung nach bestimmten veralteten Upgrade-Fehlern gebündelter Plugins, etwa einem
fehlenden Pfad eines gebündelten Plugins oder einem veralteten `channels.<id>`-Eintrag für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und verweisen Betreiber
auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein winziges Prüfer-
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

Verwenden Sie es, wenn Setup-, Doctor-, Status- oder schreibgeschützte Präsenz-Flows eine günstige
Ja/Nein-Auth-Prüfung benötigen, bevor das vollständige Kanal-Plugin lädt. Persistierter Auth-Status ist
kein konfigurierter Kanalstatus: Verwenden Sie diese Metadaten nicht, um Plugins automatisch zu aktivieren,
Runtime-Abhängigkeiten zu reparieren oder zu entscheiden, ob eine Kanal-Runtime laden soll.
Der Ziel-Export sollte eine kleine Funktion sein, die nur persistierten Status liest; leiten Sie
ihn nicht über das vollständige Kanal-Runtime-Barrel.

`openclaw.channel.configuredState` folgt derselben Form für günstige reine Env-
Konfigurationsprüfungen:

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

Verwenden Sie es, wenn ein Kanal den konfigurierten Status aus Env oder anderen winzigen
Nicht-Runtime-Eingaben beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung oder die echte
Kanal-Runtime benötigt, belassen Sie diese Logik stattdessen im Plugin-Hook `config.hasConfiguredState`.

## Erkennungspriorität (doppelte Plugin-IDs)

OpenClaw erkennt Plugins aus mehreren Roots (gebündelt, globale Installation, Workspace, explizit per Konfiguration ausgewählte Pfade). Wenn zwei Erkennungen dieselbe `id` verwenden, wird nur das Manifest mit der **höchsten Priorität** behalten; Duplikate mit niedrigerer Priorität werden verworfen, statt daneben geladen zu werden.

Priorität, von höchster zu niedrigster:

1. **Per Konfiguration ausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` gepinnt ist
2. **Gebündelt** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Globale Installation** — Plugins, die im globalen OpenClaw-Plugin-Root installiert sind
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace erkannt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich durch ein lokales zu überschreiben, pinnen Sie es über `plugins.entries.<id>`, damit es durch Priorität gewinnt, statt sich auf Workspace-Erkennung zu verlassen.
- Verworfene Duplikate werden protokolliert, damit Doctor- und Startdiagnosen auf die verworfene Kopie verweisen können.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema ausliefern**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Runtime.

## Validierungsverhalten

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, sofern die Kanal-ID nicht durch
  ein Plugin-Manifest deklariert ist.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **erkennbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration vorhanden ist, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  in Doctor + Logs wird eine **Warnung** angezeigt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration) für das vollständige `plugins.*`-Schema.

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge. Die Runtime lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der Erkennung + Validierung.
- Native Manifeste werden mit JSON5 geparst, sodass Kommentare, nachgestellte Kommas und nicht in Anführungszeichen gesetzte Schlüssel akzeptiert werden, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie benutzerdefinierte Schlüssel auf oberster Ebene.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerDiscoveryEntry` muss leichtgewichtig bleiben und sollte keinen breiten Runtime-Code importieren; verwenden Sie es für statische Provider-Katalogmetadaten oder enge Erkennungsdeskriptoren, nicht für Ausführung zur Anfragezeit.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory`, `kind: "context-engine"` über `plugins.slots.contextEngine` (Standard `legacy`).
- Deklarieren Sie die exklusive Plugin-Art in diesem Manifest. `OpenClawPluginDefinition.kind` im Runtime-Eintrag ist veraltet und bleibt nur als Kompatibilitäts-Fallback für ältere Plugins bestehen.
- Env-Var-Metadaten (`setup.providers[].envVars`, veraltete `providerAuthEnvVars` und `channelEnvVars`) sind nur deklarativ. Status, Audit, Cron-Zustellvalidierung und andere schreibgeschützte Oberflächen wenden weiterhin Plugin-Vertrauen und effektive Aktivierungsrichtlinien an, bevor sie eine Env-Var als konfiguriert behandeln.
- Runtime-Wizard-Metadaten, die Provider-Code benötigen, finden Sie unter [Provider-Runtime-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Allowlist-Anforderungen des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
