---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Validierungsfehler von Plugins untersuchen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-05-02T20:50:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Kompatible Paketlayouts finden Sie unter [Plugin-Pakete](/de/plugins/bundles).

Kompatible Paketformate verwenden andere Manifestdateien:

- Codex-Paket: `.codex-plugin/plugin.json`
- Claude-Paket: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout
  ohne Manifest
- Cursor-Paket: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Paketlayouts ebenfalls automatisch, sie werden jedoch nicht
gegen das hier beschriebene Schema `openclaw.plugin.json` validiert.

Für kompatible Pakete liest OpenClaw derzeit Paketmetadaten sowie deklarierte
Skill-Roots, Claude-Befehls-Roots, Standardwerte aus `settings.json` von Claude-Paketen,
Claude-Paket-LSP-Standardwerte und unterstützte Hook-Pakete, wenn das Layout den
OpenClaw-Laufzeiterwartungen entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** mitliefern. OpenClaw verwendet dieses Manifest, um die Konfiguration
**ohne Ausführung von Plugin-Code** zu validieren. Fehlende oder ungültige Manifeste
werden als Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe die vollständige Anleitung zum Plugin-System: [Plugins](/de/tools/plugin).
Für das native Fähigkeitsmodell und die aktuelle Anleitung zur externen Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei tut

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, **bevor Ihr
Plugin-Code geladen wird**. Alles unten aufgeführte muss so leichtgewichtig sein,
dass es ohne Start der Plugin-Laufzeit geprüft werden kann.

**Verwenden Sie es für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurations-UI
- Authentifizierung, Onboarding und Einrichtungsmetadaten (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Authentifizierungsoptionen)
- Aktivierungshinweise für Control-Plane-Oberflächen
- Kurzschreibungs-Eigentümerschaft für Modellfamilien
- statische Snapshots der Fähigkeits-Eigentümerschaft (`contracts`)
- QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa` prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie es nicht für:** das Registrieren von Laufzeitverhalten, das Deklarieren von Code-Einstiegspunkten
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

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                          |
| ------------------------------------ | ------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                               |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                           |
| `enabledByDefault`                   | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg oder setzen Sie einen beliebigen Nicht-`true`-Wert, damit das Plugin standardmäßig deaktiviert bleibt.                                               |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Veraltete IDs, die zu dieser kanonischen Plugin-ID normalisiert werden.                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modellreferenzen sie erwähnen.                                                                                            |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                    |
| `channels`                           | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Wird für Erkennung und Konfigurationsvalidierung verwendet.                                                                                                                                  |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                           |
| `providerDiscoveryEntry`             | Nein         | `string`                         | Leichtgewichtiger Modulpfad für die Provider-Erkennung, relativ zum Plugin-Stamm, für manifestbezogene Provider-Katalogmetadaten, die geladen werden können, ohne die vollständige Plugin-Laufzeit zu aktivieren.                  |
| `modelSupport`                       | Nein         | `object`                         | Manifesteigene Kurzform-Metadaten für Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                                                   |
| `modelCatalog`                       | Nein         | `object`                         | Deklarative Modellkatalog-Metadaten für Provider, die diesem Plugin gehören. Dies ist der Control-Plane-Vertrag für künftige schreibgeschützte Auflistung, Onboarding, Modellauswahlen, Aliase und Unterdrückung ohne Laden der Plugin-Laufzeit. |
| `modelPricing`                       | Nein         | `object`                         | Provider-eigene Richtlinie für externe Preisabfragen. Verwenden Sie sie, um lokale/selbst gehostete Provider von entfernten Preiskatalogen auszunehmen oder Provider-Referenzen OpenRouter-/LiteLLM-Katalog-IDs zuzuordnen, ohne Provider-IDs im Kern hart zu codieren. |
| `modelIdNormalization`               | Nein         | `object`                         | Provider-eigene Bereinigung von Modell-ID-Aliasen/-Präfixen, die ausgeführt werden muss, bevor die Provider-Laufzeit geladen wird.                                                                                                 |
| `providerEndpoints`                  | Nein         | `object[]`                       | Manifesteigene Metadaten zu Endpoint-Hosts/baseUrl für Provider-Routen, die der Kern klassifizieren muss, bevor die Provider-Laufzeit geladen wird.                                                                                |
| `providerRequest`                    | Nein         | `object`                         | Leichtgewichtige Metadaten zu Provider-Familie und Anfragekompatibilität, die von der generischen Anfragerichtlinie verwendet werden, bevor die Provider-Laufzeit geladen wird.                                                     |
| `cliBackends`                        | Nein         | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Wird für die automatische Aktivierung beim Start aus expliziten Konfigurationsreferenzen verwendet.                                                                            |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren Plugin-eigener synthetischer Authentifizierungs-Hook während der kalten Modellerkennung vor dem Laden der Laufzeit geprüft werden soll.                                               |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalter-API-Schlüsselwerte gebündelter Plugins, die nicht geheime lokale, OAuth- oder umgebungsbasierte Anmeldedatenzustände darstellen.                                                                                       |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit Plugin-bewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                                          |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Veraltete Kompatibilitäts-Env-Metadaten für Authentifizierungs-/Statusabfragen von Providern. Bevorzugen Sie `setup.providers[].envVars` für neue Plugins; OpenClaw liest dies während des Deprecation-Fensters weiterhin.           |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die eine andere Provider-ID für Authentifizierungsabfragen wiederverwenden sollen, zum Beispiel ein Coding-Provider, der den API-Schlüssel und die Authentifizierungsprofile des Basis-Providers teilt.                |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Leichtgewichtige Kanal-Env-Metadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuerte Kanaleinrichtung oder Authentifizierungsoberflächen, die generische Start-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                       | Leichtgewichtige Authentifizierungsauswahl-Metadaten für Onboarding-Auswahlen, bevorzugte Provider-Auflösung und einfache CLI-Flag-Verkabelung.                                                                                     |
| `activation`                         | Nein         | `object`                         | Leichtgewichtige Aktivierungsplaner-Metadaten für Start, Provider, Befehl, Kanal, Route und durch Fähigkeit ausgelöstes Laden. Nur Metadaten; die Plugin-Laufzeit besitzt weiterhin das tatsächliche Verhalten.                    |
| `setup`                              | Nein         | `object`                         | Leichtgewichtige Einrichtungs-/Onboarding-Deskriptoren, die Erkennungs- und Einrichtungsoberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                              |
| `qaRunners`                          | Nein         | `object[]`                       | Leichtgewichtige QA-Runner-Deskriptoren, die vom gemeinsamen `openclaw qa`-Host verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                                          |
| `contracts`                          | Nein         | `object`                         | Statischer Snapshot der Fähigkeitszuständigkeit für externe Authentifizierungs-Hooks, Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bilderzeugung, Musikerzeugung, Videoerzeugung, Web-Fetch, Websuche und Tool-Zuständigkeit. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Leichtgewichtige Medienverständnis-Standards für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                      |
| `imageGenerationProviderMetadata`    | Nein         | `Record<string, object>`         | Leichtgewichtige Bilderzeugungs-Authentifizierungsmetadaten für Provider-IDs, die in `contracts.imageGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Base-URL-Guards.           |
| `videoGenerationProviderMetadata`    | Nein         | `Record<string, object>`         | Leichtgewichtige Videoerzeugungs-Authentifizierungsmetadaten für Provider-IDs, die in `contracts.videoGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Base-URL-Guards.           |
| `musicGenerationProviderMetadata`    | Nein         | `Record<string, object>`         | Leichtgewichtige Musikerzeugungs-Authentifizierungsmetadaten für Provider-IDs, die in `contracts.musicGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Base-URL-Guards.           |
| `toolMetadata`                       | Nein         | `Record<string, object>`         | Leichtgewichtige Verfügbarkeitsmetadaten für Plugin-eigene Tools, die in `contracts.tools` deklariert sind. Verwenden Sie sie, wenn ein Tool die Laufzeit nur laden soll, wenn Konfigurations-, Env- oder Authentifizierungsnachweise vorhanden sind. |
| `channelConfigs`                     | Nein         | `Record<string, object>`         | Manifesteigene Kanalkonfigurationsmetadaten, die vor dem Laden der Laufzeit in Erkennungs- und Validierungsoberflächen zusammengeführt werden.                                                                                     |
| `skills`                             | Nein         | `string[]`                       | Skills-Verzeichnisse, die relativ zum Plugin-Stamm geladen werden sollen.                                                                                                                                                          |
| `name`                               | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                                      |
| `description`                        | Nein     | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                    |
| `version`                            | Nein     | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                         |
| `uiHints`                            | Nein     | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Vertraulichkeitshinweise für Konfigurationsfelder.                                                                                                                                               |

## Referenz für Metadaten von Generierungs-Providern

Die Metadatenfelder für Generierungs-Provider beschreiben statische Authentifizierungssignale für
Provider, die in der passenden Liste `contracts.*GenerationProviders` deklariert sind.
OpenClaw liest diese Felder, bevor die Provider-Laufzeit geladen wird, damit Core-Tools
entscheiden können, ob ein Generierungs-Provider verfügbar ist, ohne jedes
Provider-Plugin zu importieren.

Verwenden Sie diese Felder nur für günstige, deklarative Fakten. Transport, Anfrage-
Transformationen, Token-Aktualisierung, Anmeldedatenvalidierung und das tatsächliche Generierungsverhalten
bleiben in der Plugin-Laufzeit.

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

| Feld            | Erforderlich | Typ        | Bedeutung                                                                                                                                        |
| --------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`       | Nein         | `string[]` | Zusätzliche Provider-IDs, die als statische Authentifizierungsaliasse für den Generierungs-Provider zählen sollen.                               |
| `authProviders` | Nein         | `string[]` | Provider-IDs, deren konfigurierte Authentifizierungsprofile als Authentifizierung für diesen Generierungs-Provider zählen sollen.                |
| `configSignals` | Nein         | `object[]` | Günstige, rein konfigurationsbasierte Verfügbarkeitssignale für lokale oder selbst gehostete Provider, die ohne Authentifizierungsprofile oder Umgebungsvariablen konfiguriert werden können. |
| `authSignals`   | Nein         | `object[]` | Explizite Authentifizierungssignale. Wenn vorhanden, ersetzen sie den Standardsignalsatz aus der Provider-ID, `aliases` und `authProviders`.     |

Jeder `configSignals`-Eintrag unterstützt:

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                |
| ------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Ja           | `string`   | Punktpfad zum Plugin-eigenen Konfigurationsobjekt, das geprüft werden soll, zum Beispiel `plugins.entries.example.config`.                                                                               |
| `overlayPath` | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objekt das Stammobjekt überlagern soll, bevor das Signal ausgewertet wird. Verwenden Sie dies für fähigkeitsspezifische Konfiguration wie `image`, `video` oder `music`. |
| `required`    | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, die konfigurierte Werte haben müssen. Strings dürfen nicht leer sein; Objekte und Arrays dürfen nicht leer sein.                                      |
| `requiredAny` | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, bei denen mindestens einer einen konfigurierten Wert haben muss.                                                                                       |
| `mode`        | Nein         | `object`   | Optionaler String-Modus-Guard innerhalb der effektiven Konfiguration. Verwenden Sie dies, wenn rein konfigurationsbasierte Verfügbarkeit nur für einen Modus gilt.                                      |

Jeder `mode`-Guard unterstützt:

| Feld         | Erforderlich | Typ        | Bedeutung                                                                                               |
| ------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| `path`       | Nein         | `string`   | Punktpfad innerhalb der effektiven Konfiguration. Standard ist `mode`.                                  |
| `default`    | Nein         | `string`   | Moduswert, der verwendet wird, wenn die Konfiguration den Pfad auslässt.                                |
| `allowed`    | Nein         | `string[]` | Falls vorhanden, ist das Signal nur erfolgreich, wenn der effektive Modus einer dieser Werte ist.       |
| `disallowed` | Nein         | `string[]` | Falls vorhanden, schlägt das Signal fehl, wenn der effektive Modus einer dieser Werte ist.              |

Jeder `authSignals`-Eintrag unterstützt:

| Feld              | Erforderlich | Typ      | Bedeutung                                                                                                                                                                      |
| ----------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Ja           | `string` | Provider-ID, die in konfigurierten Authentifizierungsprofilen geprüft werden soll.                                                                                             |
| `providerBaseUrl` | Nein         | `object` | Optionaler Guard, durch den das Signal nur zählt, wenn der referenzierte konfigurierte Provider eine zulässige Basis-URL verwendet. Verwenden Sie dies, wenn ein Authentifizierungsalias nur für bestimmte APIs gültig ist. |

Jeder `providerBaseUrl`-Guard unterstützt:

| Feld              | Erforderlich | Typ        | Bedeutung                                                                                                                                                  |
| ----------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string`   | Provider-Konfigurations-ID, deren `baseUrl` geprüft werden soll.                                                                                           |
| `defaultBaseUrl`  | Nein         | `string`   | Basis-URL, die angenommen wird, wenn die Provider-Konfiguration `baseUrl` auslässt.                                                                         |
| `allowedBaseUrls` | Ja           | `string[]` | Zulässige Basis-URLs für dieses Authentifizierungssignal. Das Signal wird ignoriert, wenn die konfigurierte oder standardmäßige Basis-URL keinem dieser normalisierten Werte entspricht. |

## Referenz für Tool-Metadaten

`toolMetadata` verwendet dieselben `configSignals`- und `authSignals`-Formen wie
Metadaten von Generierungs-Providern, indiziert nach Tool-Name. `contracts.tools` deklariert
die Zuständigkeit. `toolMetadata` deklariert günstige Verfügbarkeitsnachweise, damit OpenClaw
vermeiden kann, eine Plugin-Laufzeit nur zu importieren, damit deren Tool-Factory `null` zurückgibt.

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
lädt das zuständige Plugin, wenn der Tool-Vertrag zur Richtlinie passt. Für häufig verwendete
Tools, deren Factory von Authentifizierung/Konfiguration abhängt, sollten Plugin-Autoren
`toolMetadata` deklarieren, statt Core die Laufzeit importieren zu lassen, um nachzufragen.

## providerAuthChoices-Referenz

Jeder `providerAuthChoices`-Eintrag beschreibt eine Onboarding- oder Authentifizierungsauswahl.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.
Provider-Einrichtungslisten verwenden diese Manifest-Auswahlen, aus Deskriptoren abgeleitete Einrichtungsauswahlen
und Installationskatalog-Metadaten, ohne die Provider-Laufzeit zu laden.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                  |
| --------------------- | ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                  |
| `method`              | Ja           | `string`                                        | Authentifizierungsmethoden-ID, an die weitergeleitet werden soll.                                          |
| `choiceId`            | Ja           | `string`                                        | Stabile Authentifizierungsauswahl-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                 |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitiges Label. Wenn ausgelassen, verwendet OpenClaw ersatzweise `choiceId`.                       |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                          |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.                  |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistentenauswahlen aus, erlaubt aber weiterhin die manuelle CLI-Auswahl.          |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Legacy-Auswahl-IDs, die Benutzer zu dieser Ersatzauswahl umleiten sollen.                                  |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlen.                                                  |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitiges Label für diese Gruppe.                                                                   |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                           |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Authentifizierungsabläufe mit einem Flag.                           |
| `cliFlag`             | Nein         | `string`                                        | CLI-Flag-Name, beispielsweise `--openrouter-api-key`.                                                      |
| `cliOption`           | Nein         | `string`                                        | Vollständige CLI-Optionsform, beispielsweise `--openrouter-api-key <key>`.                                 |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                         |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn ausgelassen, ist der Standard `["text-inference"]`. |

## commandAliases-Referenz

Verwenden Sie `commandAliases`, wenn ein Plugin einen Runtime-Befehlsnamen besitzt, den Benutzer möglicherweise
fälschlicherweise in `plugins.allow` eintragen oder als Root-CLI-Befehl ausführen möchten. OpenClaw
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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                   |
| ------------ | ------------ | ----------------- | --------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                   |
| `kind`       | Nein         | `"runtime-slash"` | Markiert den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.         |
| `cliCommand` | Nein         | `string`          | Zugehöriger Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen wird, falls einer vorhanden ist. |

## activation-Referenz

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Control-Plane-Ereignisse
es in einen Aktivierungs-/Ladeplan aufnehmen sollten.

Dieser Block ist Planer-Metadaten, keine Lifecycle-API. Er registriert kein
Runtime-Verhalten, ersetzt `register(...)` nicht und verspricht nicht, dass
Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um
Kandidaten-Plugins einzugrenzen, bevor er auf vorhandene Manifest-Zuständigkeitsmetadaten
wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks zurückfällt.

Bevorzugen Sie die engsten Metadaten, die die Zuständigkeit bereits beschreiben. Verwenden Sie
`providers`, `channels`, `commandAliases`, Setup-Deskriptoren oder `contracts`,
wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planerhinweise,
die nicht durch diese Zuständigkeitsfelder dargestellt werden können.
Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Runtime-Aliase wie `claude-cli`,
`codex-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist nur für
eingebettete Agent-Harness-IDs vorgesehen, die noch kein Zuständigkeitsfeld haben.

Dieser Block enthält nur Metadaten. Er registriert kein Runtime-Verhalten und ersetzt
weder `register(...)`, `setupEntry` noch andere Runtime-/Plugin-Einstiegspunkte.
Aktuelle Konsumenten verwenden ihn als Eingrenzungshinweis vor breiterem Plugin-Laden, daher
kosten fehlende Nicht-Startup-Aktivierungsmetadaten normalerweise nur Performance; sie
sollten die Korrektheit nicht ändern, solange Manifest-Zuständigkeits-Fallbacks weiterhin existieren.

Jedes Plugin sollte `activation.onStartup` bewusst setzen. Setzen Sie es nur dann auf `true`,
wenn das Plugin während des Gateway-Starts laufen muss. Setzen Sie es auf `false`, wenn
das Plugin beim Start inaktiv ist und nur über engere Trigger geladen werden soll.
Das Weglassen von `onStartup` lädt das Plugin beim Start nicht mehr implizit; verwenden Sie explizite
Aktivierungsmetadaten für Startup-, Channel-, Konfigurations-, Agent-Harness-, Memory- oder
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
| `onStartup`        | Nein         | `boolean`                                            | Explizite Gateway-Startup-Aktivierung. Jedes Plugin sollte dies setzen. `true` importiert das Plugin während des Starts; `false` hält es beim Start lazy, sofern kein anderer passender Trigger das Laden erfordert. |
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                               |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Eingebettete Agent-Harness-Runtime-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliase.              |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                                |
| `onChannels`       | Nein         | `string[]`                                           | Channel-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                                |
| `onRoutes`         | Nein         | `string[]`                                           | Routenarten, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                                |
| `onConfigPaths`    | Nein         | `string[]`                                           | Root-relative Konfigurationspfade, die dieses Plugin in Startup-/Ladepläne aufnehmen sollten, wenn der Pfad vorhanden und nicht explizit deaktiviert ist.                                  |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Capability-Hinweise, die von der Control-Plane-Aktivierungsplanung verwendet werden. Bevorzugen Sie nach Möglichkeit engere Felder.                                                  |

Aktuelle Live-Konsumenten:

- Die Gateway-Startup-Planung verwendet `activation.onStartup` für explizite Startup-
  Importe
- Die durch Befehle ausgelöste CLI-Planung fällt auf das ältere
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Die Agent-Runtime-Startup-Planung verwendet `activation.onAgentHarnesses` für
  eingebettete Harnesses und `cliBackends[]` auf oberster Ebene für CLI-Runtime-Aliase
- Die durch Channels ausgelöste Setup-/Channel-Planung fällt auf die ältere `channels[]`-
  Zuständigkeit zurück, wenn explizite Channel-Aktivierungsmetadaten fehlen
- Die Startup-Plugin-Planung verwendet `activation.onConfigPaths` für Nicht-Channel-Root-
  Konfigurationsoberflächen wie den `browser`-Block des gebündelten Browser-Plugins
- Die durch Provider ausgelöste Setup-/Runtime-Planung fällt auf die ältere
  `providers[]`- und `cliBackends[]`-Zuständigkeit auf oberster Ebene zurück, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

Planerdiagnosen können explizite Aktivierungshinweise von Manifest-
Zuständigkeits-Fallbacks unterscheiden. Beispielsweise bedeutet `activation-command-hint`, dass
`activation.onCommands` gepasst hat, während `manifest-command-alias` bedeutet, dass der
Planer stattdessen die `commandAliases`-Zuständigkeit verwendet hat. Diese Begründungslabels sind für
Host-Diagnosen und Tests gedacht; Plugin-Autoren sollten weiterhin die Metadaten deklarieren,
die die Zuständigkeit am besten beschreiben.

## qaRunners-Referenz

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb
der gemeinsamen `openclaw qa`-Root beiträgt. Halten Sie diese Metadaten kostengünstig und statisch; die Plugin-
Runtime besitzt die tatsächliche CLI-Registrierung weiterhin über eine schlanke
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
| `commandName` | Ja           | `string` | Unterbefehl, der unter `openclaw qa` eingehängt wird, zum Beispiel `matrix`. |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

## setup-Referenz

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen kostengünstige Plugin-eigene Metadaten
benötigen, bevor die Runtime lädt.

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
Backends. `setup.cliBackends` ist die Setup-spezifische Deskriptoroberfläche für
Control-Plane-/Setup-Flows, die metadatenbasiert bleiben sollten.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
Deskriptor-zuerst-Lookup-Oberfläche für die Setup-Erkennung. Wenn der Deskriptor nur
das Kandidaten-Plugin eingrenzt und das Setup weiterhin umfangreichere Runtime-Hooks zur Setup-Zeit
benötigt, setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als
Fallback-Ausführungspfad bei.

OpenClaw berücksichtigt außerdem `setup.providers[].envVars` in generischen Provider-Auth- und
Env-Var-Lookups. `providerAuthEnvVars` wird während des Deprecation-Fensters weiterhin über einen Kompatibilitäts-
Adapter unterstützt, aber nicht gebündelte Plugins, die es weiterhin verwenden,
erhalten eine Manifestdiagnose. Neue Plugins sollten Setup-/Status-Env-Metadaten
in `setup.providers[].envVars` platzieren.

OpenClaw kann einfache Setup-Auswahlen auch aus `setup.providers[].authMethods`
ableiten, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false`
deklariert, dass Setup-Runtime unnötig ist. Explizite `providerAuthChoices`-Einträge bleiben
für benutzerdefinierte Labels, CLI-Flags, Onboarding-Scope und Assistentenmetadaten bevorzugt.

Setzen Sie `requiresRuntime: false` nur, wenn diese Deskriptoren für die
Setup-Oberfläche ausreichen. OpenClaw behandelt explizites `false` als reinen Deskriptorvertrag
und führt `setup-api` oder `openclaw.setupEntry` für Setup-Lookups nicht aus. Wenn
ein reines Deskriptor-Plugin trotzdem einen dieser Setup-Runtime-Einträge ausliefert,
meldet OpenClaw eine additive Diagnose und ignoriert ihn weiterhin. Ein weggelassenes
`requiresRuntime` behält das ältere Fallback-Verhalten bei, damit bestehende Plugins, die
Deskriptoren ohne das Flag hinzugefügt haben, nicht brechen.

Da Setup-Lookups Plugin-eigenen `setup-api`-Code ausführen können, müssen normalisierte
`setup.providers[].id`- und `setup.cliBackends[]`-Werte über alle
entdeckten Plugins hinweg eindeutig bleiben. Mehrdeutige Zuständigkeit schlägt geschlossen fehl, statt einen
Gewinner aus der Erkennungsreihenfolge auszuwählen.

Wenn Setup-Runtime ausgeführt wird, melden Setup-Registry-Diagnosen Deskriptordrift,
wenn `setup-api` einen Provider oder ein CLI-Backend registriert, den oder das die Manifest-
Deskriptoren nicht deklarieren, oder wenn ein Deskriptor keine passende Runtime-
Registrierung hat. Diese Diagnosen sind additiv und lehnen ältere Plugins nicht ab.

### setup.providers-Referenz

| Feld           | Erforderlich | Typ        | Bedeutung                                                                                         |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding bereitgestellt wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods`  | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Provider unterstützt, ohne die vollständige Runtime zu laden. |
| `envVars`      | Nein         | `string[]` | Env-Vars, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Runtime lädt.   |
| `authEvidence` | Nein         | `object[]` | Kostengünstige lokale Auth-Nachweisprüfungen für Provider, die sich über nicht geheime Marker authentifizieren können. |

`authEvidence` ist für Provider-eigene lokale Anmeldedaten-Markierungen vorgesehen, die
ohne Laden von Runtime-Code verifiziert werden können. Diese Prüfungen müssen günstig und lokal bleiben:
keine Netzwerkaufrufe, keine Schlüsselbund- oder Secret-Manager-Lesezugriffe, keine Shell-Befehle und keine
Provider-API-Prüfungen.

Unterstützte Nachweiseinträge:

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                            |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja           | `string`   | Derzeit `local-file-with-env`.                                                                                       |
| `fileEnvVar`       | Nein         | `string`   | Env-Var, die einen expliziten Pfad zu einer Anmeldedatendatei enthält.                                                |
| `fallbackPaths`    | Nein         | `string[]` | Lokale Pfade zu Anmeldedatendateien, die geprüft werden, wenn `fileEnvVar` fehlt oder leer ist. Unterstützt `${HOME}` und `${APPDATA}`. |
| `requiresAnyEnv`   | Nein         | `string[]` | Mindestens eine aufgeführte Env-Var muss nicht leer sein, damit der Nachweis gültig ist.                             |
| `requiresAllEnv`   | Nein         | `string[]` | Jede aufgeführte Env-Var muss nicht leer sein, damit der Nachweis gültig ist.                                        |
| `credentialMarker` | Ja           | `string`   | Nicht geheime Markierung, die zurückgegeben wird, wenn der Nachweis vorhanden ist.                                   |
| `source`           | Nein         | `string`   | Benutzerseitiges Quelllabel für Auth-/Statusausgaben.                                                               |

### setup-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                  |
| ------------------ | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding bereitgestellt werden.                       |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für die deskriptorbasierte Setup-Suche verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | Config-Migrations-IDs, die zur Setup-Oberfläche dieses Plugins gehören.                                    |
| `requiresRuntime`  | Nein         | `boolean`  | Ob Setup nach der Deskriptor-Suche weiterhin die Ausführung von `setup-api` benötigt.                      |

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
| `label`       | `string`   | Benutzerseitiges Feldlabel.                    |
| `help`        | `string`   | Kurzer Hilfetext.                              |
| `tags`        | `string[]` | Optionale UI-Tags.                             |
| `advanced`    | `boolean`  | Markiert das Feld als fortgeschritten.         |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel.    |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.          |

## contracts-Referenz

Verwenden Sie `contracts` nur für statische Metadaten zum Besitz von Fähigkeiten, die OpenClaw
lesen kann, ohne die Plugin-Runtime zu importieren.

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

| Feld                             | Typ        | Bedeutung                                                            |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Factory-IDs von Codex-App-Server-Erweiterungen, derzeit `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-IDs, für die ein gebündeltes Plugin Tool-Result-Middleware registrieren darf. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Auth-Profile diesem Plugin gehört. |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                      |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-Transcription-Provider-IDs, die diesem Plugin gehören.      |
| `realtimeVoiceProviders`         | `string[]` | Realtime-Voice-Provider-IDs, die diesem Plugin gehören.              |
| `memoryEmbeddingProviders`       | `string[]` | Memory-Embedding-Provider-IDs, die diesem Plugin gehören.            |
| `mediaUnderstandingProviders`    | `string[]` | Media-Understanding-Provider-IDs, die diesem Plugin gehören.         |
| `imageGenerationProviders`       | `string[]` | Image-Generation-Provider-IDs, die diesem Plugin gehören.            |
| `videoGenerationProviders`       | `string[]` | Video-Generation-Provider-IDs, die diesem Plugin gehören.            |
| `webFetchProviders`              | `string[]` | Web-Fetch-Provider-IDs, die diesem Plugin gehören.                   |
| `webSearchProviders`             | `string[]` | Web-Search-Provider-IDs, die diesem Plugin gehören.                  |
| `migrationProviders`             | `string[]` | Import-Provider-IDs, die diesem Plugin für `openclaw migrate` gehören. |
| `tools`                          | `string[]` | Agent-Tool-Namen, die diesem Plugin gehören.                         |

`contracts.embeddedExtensionFactories` bleibt für gebündelte Codex-Erweiterungs-Factorys erhalten, die ausschließlich
für den App-Server vorgesehen sind. Gebündelte Tool-Result-Transformationen sollten stattdessen
`contracts.agentToolResultMiddleware` deklarieren und sich mit
`api.registerAgentToolResultMiddleware(...)` registrieren. Externe Plugins können
keine Tool-Result-Middleware registrieren, da die Schnittstelle vertrauenswürdige Tool-Ausgaben
umschreiben kann, bevor das Modell sie sieht.

Runtime-Registrierungen mit `api.registerTool(...)` müssen `contracts.tools` entsprechen.
Die Tool-Erkennung verwendet diese Liste, um nur die Plugin-Runtimes zu laden, die die
angeforderten Tools besitzen können.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten
`contracts.externalAuthProviders` deklarieren. Plugins ohne diese Deklaration laufen weiterhin
über einen veralteten Kompatibilitäts-Fallback, dieser Fallback ist jedoch langsamer und
wird nach dem Migrationsfenster entfernt.

Gebündelte Memory-Embedding-Provider sollten
`contracts.memoryEmbeddingProviders` für jede Adapter-ID deklarieren, die sie bereitstellen, einschließlich
integrierter Adapter wie `local`. Eigenständige CLI-Pfade verwenden diesen Manifest-Vertrag,
um nur das besitzende Plugin zu laden, bevor die vollständige Gateway-Runtime
Provider registriert hat.

## mediaUnderstandingProviderMetadata-Referenz

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Media-Understanding-Provider
Standardmodelle, Fallback-Priorität für automatische Authentifizierung oder native Dokumentunterstützung hat, die
generische Core-Helfer benötigen, bevor die Runtime lädt. Schlüssel müssen außerdem in
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

| Feld                   | Typ                                 | Bedeutung                                                                  |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medienfähigkeiten, die dieser Provider bereitstellt.                       |
| `defaultModels`        | `Record<string, string>`            | Zuordnung von Fähigkeit zu Standardmodell, wenn die Config kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden beim automatischen, anmeldedatenbasierten Provider-Fallback früher sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.              |

## channelConfigs-Referenz

Verwenden Sie `channelConfigs`, wenn ein Channel-Plugin günstige Config-Metadaten benötigt, bevor
die Runtime lädt. Schreibgeschützte Channel-Setup-/Statuserkennung kann diese Metadaten
direkt für konfigurierte externe Channels verwenden, wenn kein Setup-Eintrag verfügbar ist, oder
wenn `setup.requiresRuntime: false` deklariert, dass keine Setup-Runtime erforderlich ist.

`channelConfigs` sind Metadaten im Plugin-Manifest, kein neuer oberster Benutzer-Config-Abschnitt.
Benutzer konfigurieren Channel-Instanzen weiterhin unter `channels.<channel-id>`.
OpenClaw liest Manifest-Metadaten, um zu entscheiden, welchem Plugin dieser konfigurierte
Channel gehört, bevor Plugin-Runtime-Code ausgeführt wird.

Für ein Channel-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche
Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten außerdem passende
`channelConfigs`-Einträge deklarieren. Ohne sie kann OpenClaw das Plugin zwar weiterhin laden, aber
Cold-Path-Config-Schema, Setup und Control-UI-Oberflächen können die
Channel-eigene Optionsstruktur erst kennen, wenn die Plugin-Runtime ausgeführt wird.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und
`nativeSkillsAutoEnabled` können statische `auto`-Standardwerte für Command-Config-Prüfungen
deklarieren, die ausgeführt werden, bevor die Channel-Runtime lädt. Gebündelte Channels können
dieselben Standardwerte außerdem über `package.json#openclaw.channel.commands` zusammen mit
ihren anderen paketbezogenen Channel-Katalogmetadaten veröffentlichen.

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

Jeder Channel-Eintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                                                |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Eintrag der Kanalkonfiguration erforderlich.                    |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen/Platzhalter/Hinweise zu sensiblen Daten für diesen Abschnitt der Kanalkonfiguration.        |
| `label`       | `string`                 | Kanalbeschriftung, die in Auswahl- und Prüfoberflächen übernommen wird, wenn Laufzeitmetadaten noch nicht bereit sind.   |
| `description` | `string`                 | Kurze Kanalbeschreibung für Prüf- und Katalogoberflächen.                                                                |
| `commands`    | `object`                 | Statische native Befehle und automatische Standardwerte für native Skills für Konfigurationsprüfungen vor der Laufzeit. |
| `preferOver`  | `string[]`               | Ältere oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll.                  |

### Ersetzen eines anderen Kanal-Plugins

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Besitzer für eine Kanal-ID ist, die
auch ein anderes Plugin bereitstellen kann. Häufige Fälle sind eine umbenannte Plugin-ID, ein
eigenständiges Plugin, das ein gebündeltes Plugin ersetzt, oder ein gepflegter Fork, der
dieselbe Kanal-ID für Konfigurationskompatibilität beibehält.

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
Benutzerauswahl hat weiterhin Vorrang: Wenn der Benutzer beide Plugins explizit aktiviert,
behält OpenClaw diese Auswahl bei und meldet Diagnosen zu doppelten Kanälen/Tools, statt
die angeforderte Plugin-Menge stillschweigend zu ändern.

Beschränken Sie `preferOver` auf Plugin-IDs, die denselben Kanal wirklich bereitstellen können.
Es ist kein allgemeines Prioritätsfeld und benennt keine Benutzerkonfigurationsschlüssel um.

## Referenz zu modelSupport

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

OpenClaw wendet diese Rangfolge an:

- explizite `provider/model`-Referenzen verwenden die besitzenden `providers`-Manifestmetadaten
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte
  Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                             |
| --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden.           |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach Entfernung des Profilsuffixes gegen Kurzform-Modell-IDs abgeglichen werden. |

## Referenz zu modelCatalog

Verwenden Sie `modelCatalog`, wenn OpenClaw Provider-Modellmetadaten kennen soll, bevor
die Plugin-Laufzeit geladen wird. Dies ist die manifestverwaltete Quelle für feste Katalogzeilen,
Provider-Aliasse, Unterdrückungsregeln und Discovery-Modus. Die Laufzeitaktualisierung
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

Felder der obersten Ebene:

| Feld           | Typ                                                      | Bedeutung                                                                                                            |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Schlüssel sollten auch in `providers` der obersten Ebene erscheinen. |
| `aliases`      | `Record<string, object>`                                 | Provider-Aliasse, die für Katalog- oder Unterdrückungsplanung zu einem besessenen Provider aufgelöst werden sollen. |
| `suppressions` | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus einem providerspezifischen Grund unterdrückt.           |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Ob der Provider-Katalog aus Manifestmetadaten gelesen, in den Cache aktualisiert werden kann oder Laufzeit erfordert. |

`aliases` beteiligt sich an der Provider-Besitzsuche für die Modellkatalogplanung.
Alias-Ziele müssen Provider der obersten Ebene sein, die demselben Plugin gehören. Wenn eine
providergefilterte Liste einen Alias verwendet, kann OpenClaw das besitzende Manifest lesen und
Alias-API-/Basis-URL-Überschreibungen anwenden, ohne die Provider-Laufzeit zu laden.
Aliasse erweitern ungefilterte Katalogauflistungen nicht; breite Listen geben nur die Zeilen des besitzenden
kanonischen Providers aus.

`suppressions` ersetzt den alten Provider-Laufzeit-Hook `suppressBuiltInModel`.
Unterdrückungseinträge werden nur beachtet, wenn der Provider dem Plugin gehört oder
als `modelCatalog.aliases`-Schlüssel deklariert ist, der auf einen besessenen Provider zeigt. Laufzeit-
Unterdrückungs-Hooks werden während der Modellauflösung nicht mehr aufgerufen.

Provider-Felder:

| Feld      | Typ                      | Bedeutung                                                               |
| --------- | ------------------------ | ----------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionale Standard-Basis-URL für Modelle in diesem Provider-Katalog.    |
| `api`     | `ModelApi`               | Optionaler Standard-API-Adapter für Modelle in diesem Provider-Katalog. |
| `headers` | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten.     |
| `models`  | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.          |

Modellfelder:

| Feld            | Typ                                                            | Bedeutung                                                                                   |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                                      |
| `name`          | `string`                                                       | Optionaler Anzeigename.                                                                     |
| `api`           | `ModelApi`                                                     | Optionale API-Überschreibung pro Modell.                                                    |
| `baseUrl`       | `string`                                                       | Optionale Basis-URL-Überschreibung pro Modell.                                              |
| `headers`       | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                                      |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitäten, die das Modell akzeptiert.                                                     |
| `reasoning`     | `boolean`                                                      | Ob das Modell Reasoning-Verhalten bereitstellt.                                             |
| `contextWindow` | `number`                                                       | Native Provider-Kontextfenstergröße.                                                        |
| `contextTokens` | `number`                                                       | Optionale effektive Laufzeit-Kontextobergrenze, wenn sie von `contextWindow` abweicht.      |
| `maxTokens`     | `number`                                                       | Maximale Ausgabetokens, sofern bekannt.                                                     |
| `cost`          | `object`                                                       | Optionale Preise in USD pro Million Token, einschließlich optionalem `tieredPricing`.       |
| `compat`        | `object`                                                       | Optionale Kompatibilitätsflags, die der OpenClaw-Modellkonfigurationskompatibilität entsprechen. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Auflistungsstatus. Nur unterdrücken, wenn die Zeile gar nicht erscheinen darf.              |
| `statusReason`  | `string`                                                       | Optionaler Grund, der bei nicht verfügbarem Status angezeigt wird.                          |
| `replaces`      | `string[]`                                                     | Ältere providerlokale Modell-IDs, die dieses Modell ersetzt.                                |
| `replacedBy`    | `string`                                                       | Ersatz-Provider-lokale Modell-ID für veraltete Zeilen.                                      |
| `tags`          | `string[]`                                                     | Stabile Tags, die von Auswahlelementen und Filtern verwendet werden.                        |

Unterdrückungsfelder:

| Feld                       | Typ        | Bedeutung                                                                                                      |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-ID für die vorgelagerte Zeile, die unterdrückt werden soll. Muss diesem Plugin gehören oder als besessener Alias deklariert sein. |
| `model`                    | `string`   | Provider-lokale Modell-ID, die unterdrückt werden soll.                                                        |
| `reason`                   | `string`   | Optionale Meldung, die angezeigt wird, wenn die unterdrückte Zeile direkt angefordert wird.                    |
| `when.baseUrlHosts`        | `string[]` | Optionale Liste effektiver Provider-Basis-URL-Hosts, die erforderlich sind, bevor die Unterdrückung gilt.      |
| `when.providerConfigApiIn` | `string[]` | Optionale Liste exakter `api`-Werte der Provider-Konfiguration, die erforderlich sind, bevor die Unterdrückung gilt. |

Legen Sie keine nur zur Laufzeit verfügbaren Daten in `modelCatalog` ab. Verwenden Sie `static` nur, wenn Manifest-Zeilen vollständig genug sind, damit Provider-gefilterte Listen- und Auswahloberflächen Registry-/Runtime-Erkennung überspringen können. Verwenden Sie `refreshable`, wenn Manifest-Zeilen nützliche auflistbare Startwerte oder Ergänzungen sind, ein Refresh/Cache später aber weitere Zeilen hinzufügen kann; refreshable-Zeilen sind für sich genommen nicht autoritativ. Verwenden Sie `runtime`, wenn OpenClaw die Provider-Runtime laden muss, um die Liste zu kennen.

## modelIdNormalization-Referenz

Verwenden Sie `modelIdNormalization` für einfache, Provider-eigene Bereinigung von Modell-IDs, die vor dem Laden der Provider-Runtime erfolgen muss. Dadurch bleiben Aliasse wie kurze Modellnamen, Provider-lokale Legacy-IDs und Proxy-Präfixregeln im Manifest des zuständigen Plugins statt in Core-Tabellen zur Modellauswahl.

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

| Feld                                 | Typ                     | Bedeutung                                                                                         |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Exakte Modell-ID-Aliasse ohne Beachtung der Groß-/Kleinschreibung. Werte werden wie angegeben zurückgegeben. |
| `stripPrefixes`                      | `string[]`              | Präfixe, die vor der Alias-Suche entfernt werden, nützlich bei Legacy-Duplizierung von Provider/Modell. |
| `prefixWhenBare`                     | `string`                | Präfix, das hinzugefügt wird, wenn die normalisierte Modell-ID noch kein `/` enthält.              |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Bedingte Präfixregeln für bloße IDs nach der Alias-Suche, nach `modelPrefix` und `prefix` geschlüsselt. |

## providerEndpoints-Referenz

Verwenden Sie `providerEndpoints` für Endpoint-Klassifizierung, die generische Request-Policy kennen muss, bevor die Provider-Runtime geladen wird. Core besitzt weiterhin die Bedeutung jeder `endpointClass`; Plugin-Manifeste besitzen die Host- und Basis-URL-Metadaten.

Endpoint-Felder:

| Feld                           | Typ        | Bedeutung                                                                                              |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `endpointClass`                | `string`   | Bekannte Core-Endpoint-Klasse, etwa `openrouter`, `moonshot-native` oder `google-vertex`.              |
| `hosts`                        | `string[]` | Exakte Hostnamen, die der Endpoint-Klasse zugeordnet werden.                                           |
| `hostSuffixes`                 | `string[]` | Host-Suffixe, die der Endpoint-Klasse zugeordnet werden. Präfix mit `.` für reines Domain-Suffix-Matching. |
| `baseUrls`                     | `string[]` | Exakte normalisierte HTTP(S)-Basis-URLs, die der Endpoint-Klasse zugeordnet werden.                    |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-Region für exakte globale Hosts.                                               |
| `googleVertexRegionHostSuffix` | `string`   | Suffix, das von passenden Hosts entfernt wird, um das Google Vertex-Regionspräfix offenzulegen.        |

## providerRequest-Referenz

Verwenden Sie `providerRequest` für einfache Request-Kompatibilitätsmetadaten, die generische Request-Policy benötigt, ohne die Provider-Runtime zu laden. Behalten Sie verhaltensspezifisches Umschreiben von Payloads in Provider-Runtime-Hooks oder gemeinsamen Hilfsfunktionen für Provider-Familien.

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

| Feld                  | Typ          | Bedeutung                                                                             |
| --------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `family`              | `string`     | Label der Provider-Familie, das von generischen Request-Kompatibilitätsentscheidungen und Diagnosen verwendet wird. |
| `compatibilityFamily` | `"moonshot"` | Optionaler Provider-Familien-Kompatibilitätsbereich für gemeinsame Request-Hilfsfunktionen. |
| `openAICompletions`   | `object`     | Request-Flags für OpenAI-kompatible Completions, derzeit `supportsStreamingUsage`.    |

## modelPricing-Referenz

Verwenden Sie `modelPricing`, wenn ein Provider Preisverhalten auf Control-Plane-Ebene benötigt, bevor die Runtime geladen wird. Der Gateway-Pricing-Cache liest diese Metadaten, ohne Provider-Runtime-Code zu importieren.

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

| Feld         | Typ               | Bedeutung                                                                                           |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Setzen Sie `false` für lokale/selbst gehostete Provider, die niemals OpenRouter- oder LiteLLM-Preise abrufen sollen. |
| `openRouter` | `false \| object` | Zuordnung für OpenRouter-Preisabfragen. `false` deaktiviert die OpenRouter-Abfrage für diesen Provider. |
| `liteLLM`    | `false \| object` | Zuordnung für LiteLLM-Preisabfragen. `false` deaktiviert die LiteLLM-Abfrage für diesen Provider.   |

Quellfelder:

| Feld                       | Typ                | Bedeutung                                                                                                      |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe Katalog-Provider-ID, wenn sie von der OpenClaw-Provider-ID abweicht, zum Beispiel `z-ai` für einen `zai`-Provider. |
| `passthroughProviderModel` | `boolean`          | Behandelt Modell-IDs mit Schrägstrich als verschachtelte Provider-/Modell-Referenzen, nützlich für Proxy-Provider wie OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Zusätzliche Modell-ID-Varianten für externe Kataloge. `version-dots` versucht gepunktete Versions-IDs wie `claude-opus-4.6`. |

### OpenClaw Provider Index

Der OpenClaw Provider Index ist OpenClaw-eigene Preview-Metadaten für Provider, deren Plugins möglicherweise noch nicht installiert sind. Er ist kein Teil eines Plugin-Manifests. Plugin-Manifeste bleiben die Autorität für installierte Plugins. Der Provider Index ist der interne Fallback-Vertrag, den künftige Oberflächen für installierbare Provider und Modellauswahl vor der Installation verwenden werden, wenn ein Provider-Plugin nicht installiert ist.

Reihenfolge der Katalogautorität:

1. Benutzerkonfiguration.
2. Installiertes Plugin-Manifest `modelCatalog`.
3. Modellkatalog-Cache aus explizitem Refresh.
4. Preview-Zeilen des OpenClaw Provider Index.

Der Provider Index darf keine Secrets, keinen aktivierten Zustand, keine Runtime-Hooks und keine Live-kontospezifischen Modelldaten enthalten. Seine Preview-Kataloge verwenden dieselbe `modelCatalog`-Provider-Zeilenform wie Plugin-Manifeste, sollten aber auf stabile Anzeigemetadaten beschränkt bleiben, sofern Runtime-Adapter-Felder wie `api`, `baseUrl`, Preise oder Kompatibilitätsflags nicht bewusst mit dem installierten Plugin-Manifest synchron gehalten werden. Provider mit Live-Erkennung über `/models` sollten aktualisierte Zeilen über den expliziten Modellkatalog-Cache-Pfad schreiben, statt normale Auflistung oder Onboarding Provider-APIs aufrufen zu lassen.

Provider-Index-Einträge können auch Metadaten zu installierbaren Plugins für Provider enthalten, deren Plugin aus Core ausgelagert wurde oder anderweitig noch nicht installiert ist. Diese Metadaten spiegeln das Channel-Katalogmuster wider: Paketname, npm-Installationsspezifikation, erwartete Integrität und einfache Auth-Auswahllabels genügen, um eine installierbare Einrichtungsoption anzuzeigen. Sobald das Plugin installiert ist, hat sein Manifest Vorrang und der Provider-Index-Eintrag wird für diesen Provider ignoriert.

Legacy-Capability-Schlüssel auf oberster Ebene sind veraltet. Verwenden Sie `openclaw doctor --fix`, um `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; normales Manifest-Laden behandelt diese Felder auf oberster Ebene nicht mehr als Capability-Eigentümerschaft.

## Manifest gegenüber package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwendung dafür                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Erkennung, Konfigurationsvalidierung, Auth-Auswahlmetadaten und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code läuft |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und der `openclaw`-Block für Einstiegspunkte, Installations-Gating, Einrichtung oder Katalogmetadaten |

Wenn Sie unsicher sind, wohin ein Metadatum gehört, verwenden Sie diese Regel:

- Wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, legen Sie es in `openclaw.plugin.json` ab
- Wenn es um Paketierung, Einstiegsdateien oder npm-Installationsverhalten geht, legen Sie es in `package.json` ab

### package.json-Felder, die die Erkennung beeinflussen

Einige Plugin-Metadaten vor der Runtime liegen absichtlich in `package.json` unter dem `openclaw`-Block statt in `openclaw.plugin.json`.
`openclaw.bundle` und `openclaw.bundle.json` sind keine OpenClaw-Plugin-Verträge; native Plugins müssen `openclaw.plugin.json` plus die unten unterstützten `package.json#openclaw`-Felder verwenden.

Wichtige Beispiele:

| Feld                                                                                       | Bedeutung                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Deklariert native Plugin-Einstiegspunkte. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                               |
| `openclaw.runtimeExtensions`                                                               | Deklariert gebaute JavaScript-Runtime-Einstiegspunkte für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                          |
| `openclaw.setupEntry`                                                                      | Leichter, nur für das Setup verwendeter Einstiegspunkt für Onboarding, verzögerten Kanalstart und schreibgeschützte Kanalstatus-/SecretRef-Erkennung. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                                               | Deklariert den gebauten JavaScript-Setup-Einstiegspunkt für installierte Pakete. Erfordert `setupEntry`, muss vorhanden sein und muss innerhalb des Plugin-Paketverzeichnisses bleiben.          |
| `openclaw.channel`                                                                         | Günstige Kanalkatalog-Metadaten wie Labels, Dokumentationspfade, Aliasse und Auswahltext.                                                                                                      |
| `openclaw.channel.commands`                                                                | Statische native Befehls- und native Skill-Auto-Default-Metadaten, die von Konfiguration, Audit und Befehlslisten-Oberflächen verwendet werden, bevor die Kanal-Runtime geladen wird.           |
| `openclaw.channel.configuredState`                                                         | Leichte Metadaten für die Prüfung des konfigurierten Zustands, die „existiert die nur-env-Einrichtung bereits?“ beantworten können, ohne die vollständige Kanal-Runtime zu laden.               |
| `openclaw.channel.persistedAuthState`                                                      | Leichte Metadaten für die Prüfung persistierter Authentifizierung, die „ist bereits irgendetwas angemeldet?“ beantworten können, ohne die vollständige Kanal-Runtime zu laden.                  |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installations-/Update-Hinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                              |
| `openclaw.install.defaultChoice`                                                           | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                               |
| `openclaw.install.minHostVersion`                                                          | Mindestens unterstützte OpenClaw-Hostversion, mit einer semver-Untergrenze wie `>=2026.3.22` oder `>=2026.5.1-beta.1`.                                                                         |
| `openclaw.install.expectedIntegrity`                                                       | Erwarteter npm-Dist-Integritätsstring wie `sha512-...`; Installations- und Update-Abläufe prüfen das abgerufene Artefakt dagegen.                                                             |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Ermöglicht, dass nur für das Setup bestimmte Kanaloberflächen vor dem vollständigen Kanal-Plugin während des Starts geladen werden.                                                            |

Manifest-Metadaten bestimmen, welche Provider-/Kanal-/Setup-Auswahlen im
Onboarding erscheinen, bevor die Runtime geladen wird. `package.json#openclaw.install` teilt dem
Onboarding mit, wie dieses Plugin abgerufen oder aktiviert wird, wenn der Benutzer eine dieser
Auswahlen trifft. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-
Registry für nicht gebündelte Plugin-Quellen erzwungen. Ungültige Werte werden abgelehnt;
neuere, aber gültige Werte überspringen externe Plugins auf älteren Hosts. Gebündelte Quell-
Plugins gelten als mit dem Host-Checkout gemeinsam versioniert.

Offizielle Install-on-Demand-Metadaten sollten `clawhubSpec` verwenden, wenn das Plugin auf
ClawHub veröffentlicht ist; Onboarding behandelt dies als bevorzugte Remote-Quelle und
zeichnet nach der Installation ClawHub-Artefaktfakten auf. `npmSpec` bleibt der Kompatibilitäts-
Fallback für Pakete, die noch nicht zu ClawHub migriert wurden.

Exakte npm-Versionspinnung befindet sich bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalogeinträge
sollten exakte Specs mit `expectedIntegrity` kombinieren, damit Update-Abläufe geschlossen
fehlschlagen, wenn das abgerufene npm-Artefakt nicht mehr mit dem gepinnten Release
übereinstimmt. Interaktives Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige
Registry-npm-Specs an, einschließlich bloßer Paketnamen und Dist-Tags. Katalogdiagnosen können
exakte, gleitende, integritätsgepinnte, fehlende-Integrität-, Paketnamen-Abweichungs- und
ungültige Default-Choice-Quellen unterscheiden. Sie warnen außerdem, wenn
`expectedIntegrity` vorhanden ist, es aber keine gültige npm-Quelle gibt, die dadurch gepinnt
werden kann. Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Abläufe
sie; wenn sie fehlt, wird die Registry-Auflösung ohne Integritätspin aufgezeichnet.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Kanalliste oder
SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige Runtime zu
laden. Der Setup-Eintrag sollte Kanalmetadaten sowie setup-sichere Konfigurations-, Status-
und Secrets-Adapter bereitstellen; belassen Sie Netzwerkclients, Gateway-Listener und
Transport-Runtimes im Haupteinstiegspunkt der Erweiterung.

Runtime-Einstiegspunktfelder setzen Paketgrenzenprüfungen für Quell-Einstiegspunktfelder nicht
außer Kraft. Beispielsweise kann `openclaw.runtimeExtensions` keinen ausbrechenden
`openclaw.extensions`-Pfad ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es macht nicht
beliebige defekte Konfigurationen installierbar. Derzeit erlaubt es Installationsabläufen nur,
sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa einem
fehlenden gebündelten Plugin-Pfad oder einem veralteten `channels.<id>`-Eintrag für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren die Installation
weiterhin und verweisen Operatoren auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein winziges Prüfermodul:

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

Verwenden Sie es, wenn Setup-, Doctor-, Status- oder schreibgeschützte Präsenzabläufe eine
günstige Ja/Nein-Authentifizierungsprüfung benötigen, bevor das vollständige Kanal-Plugin
geladen wird. Persistierter Authentifizierungszustand ist kein konfigurierter Kanalzustand:
Verwenden Sie diese Metadaten nicht, um Plugins automatisch zu aktivieren, Runtime-Abhängigkeiten
zu reparieren oder zu entscheiden, ob eine Kanal-Runtime geladen werden soll. Der Ziel-Export
sollte eine kleine Funktion sein, die nur persistierten Zustand liest; leiten Sie sie nicht
über das vollständige Kanal-Runtime-Barrel.

`openclaw.channel.configuredState` folgt derselben Form für günstige, nur-env-basierte
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

Verwenden Sie es, wenn ein Kanal den konfigurierten Zustand aus env oder anderen winzigen
Nicht-Runtime-Eingaben beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung
oder die echte Kanal-Runtime benötigt, belassen Sie diese Logik stattdessen im
`config.hasConfiguredState`-Hook des Plugins.

## Erkennungspriorität (doppelte Plugin-IDs)

OpenClaw erkennt Plugins aus mehreren Roots (gebündelt, globale Installation, Workspace, explizit per Konfiguration ausgewählte Pfade). Wenn zwei Erkennungen dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Priorität** behalten; Duplikate mit niedrigerer Priorität werden verworfen, statt daneben geladen zu werden.

Priorität, von höchster zu niedrigster:

1. **Konfigurationsausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` gepinnt ist
2. **Gebündelt** — mit OpenClaw ausgelieferte Plugins
3. **Globale Installation** — Plugins, die im globalen OpenClaw-Plugin-Root installiert sind
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace erkannt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich mit einem lokalen zu überschreiben, pinnen Sie es über `plugins.entries.<id>`, damit es durch Priorität gewinnt, statt sich auf Workspace-Erkennung zu verlassen.
- Verworfene Duplikate werden protokolliert, damit Doctor und Startdiagnosen auf die verworfene Kopie verweisen können.
- Konfigurationsausgewählte Duplikat-Overrides werden in Diagnosen als explizite Overrides formuliert, warnen aber weiterhin, damit veraltete Forks und unbeabsichtigte Überschattungen sichtbar bleiben.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema ausliefern**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist akzeptabel (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Runtime.
- Wenn Sie ein gebündeltes Plugin mit neuen Konfigurationsschlüsseln erweitern oder forken, aktualisieren Sie gleichzeitig das `configSchema` dieses Plugins in `openclaw.plugin.json`. Schemas gebündelter Plugins sind strikt; daher wird das Hinzufügen von `plugins.entries.<id>.config.myNewKey` in der Benutzerkonfiguration ohne Hinzufügen von `myNewKey` zu `configSchema.properties` abgelehnt, bevor die Plugin-Runtime geladen wird.

Beispiel für Schemaerweiterung:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Validierungsverhalten

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, sofern die Kanal-ID nicht von
  einem Plugin-Manifest deklariert wird.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **erkennbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration vorhanden ist, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  eine **Warnung** wird in Doctor und Protokollen ausgegeben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration) für das vollständige `plugins.*`-Schema.

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge. Die Runtime lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der Erkennung und Validierung.
- Native Manifeste werden mit JSON5 geparst, daher werden Kommentare, nachgestellte Kommas und nicht in Anführungszeichen gesetzte Schlüssel akzeptiert, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie benutzerdefinierte Top-Level-Schlüssel.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerDiscoveryEntry` muss leichtgewichtig bleiben und sollte keinen breiten Runtime-Code importieren; verwenden Sie es für statische Provider-Katalogmetadaten oder eng gefasste Discovery-Deskriptoren, nicht für die Ausführung zur Anfragezeit.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory`, `kind: "context-engine"` über `plugins.slots.contextEngine` (Standard `legacy`).
- Deklarieren Sie die exklusive Plugin-Art in diesem Manifest. `OpenClawPluginDefinition.kind` im Runtime-Einstieg ist veraltet und bleibt nur als Kompatibilitäts-Fallback für ältere Plugins erhalten.
- Env-var-Metadaten (`setup.providers[].envVars`, veraltetes `providerAuthEnvVars` und `channelEnvVars`) sind nur deklarativ. Status, Audit, Cron-Auslieferungsvalidierung und andere schreibgeschützte Oberflächen wenden weiterhin Plugin-Vertrauen und die effektive Aktivierungsrichtlinie an, bevor sie eine Env-var als konfiguriert behandeln.
- Für Runtime-Assistentenmetadaten, die Provider-Code erfordern, siehe [Provider-Runtime-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Allowlist-Anforderungen des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Verwandt

<CardGroup cols={3}>
  <Card title="Plugins erstellen" href="/de/plugins/building-plugins" icon="rocket">
    Erste Schritte mit Plugins.
  </Card>
  <Card title="Plugin-Architektur" href="/de/plugins/architecture" icon="diagram-project">
    Interne Architektur und Fähigkeitsmodell.
  </Card>
  <Card title="SDK-Übersicht" href="/de/plugins/sdk-overview" icon="book">
    Plugin-SDK-Referenz und Subpath-Importe.
  </Card>
</CardGroup>
