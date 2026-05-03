---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema bereitstellen oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-05-03T21:36:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

Diese Seite gilt ausschließlich für das **native OpenClaw-Plugin-Manifest**.

Informationen zu kompatiblen Bundle-Layouts finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout
  ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch nicht
gegen das hier beschriebene `openclaw.plugin.json`-Schema validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte
Skill-Roots, Claude-Befehls-Roots, Standardwerte aus `settings.json` von Claude-Bundles,
Claude-Bundle-LSP-Standardwerte und unterstützte Hook-Packs, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** mitliefern. OpenClaw verwendet dieses Manifest, um die Konfiguration
**ohne Ausführung von Plugin-Code** zu validieren. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe den vollständigen Leitfaden zum Plugin-System: [Plugins](/de/tools/plugin).
Für das native Fähigkeitsmodell und die aktuelle Anleitung zur externen Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei bewirkt

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, **bevor es Ihren
Plugin-Code lädt**. Alles unten Genannte muss kostengünstig genug sein, um es ohne Starten
der Plugin-Laufzeit zu prüfen.

**Verwenden Sie sie für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurations-UI
- Authentifizierungs-, Onboarding- und Einrichtungsmetadaten (Alias, automatische Aktivierung, Provider-Env-Vars, Authentifizierungsoptionen)
- Aktivierungshinweise für Control-Plane-Oberflächen
- Kurzform-Zuständigkeit für Modellfamilien
- statische Snapshots zur Fähigkeitszuständigkeit (`contracts`)
- QA-Runner-Metadaten, die der gemeinsame `openclaw qa`-Host prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie sie nicht für:** das Registrieren von Laufzeitverhalten, das Deklarieren von Code-Einstiegspunkten
oder npm-Installationsmetadaten. Diese gehören in Ihren Plugin-Code und in `package.json`.

## Minimalbeispiel

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

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                           |
| ------------------------------------ | ------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja            | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                                |
| `configSchema`                       | Ja            | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                            |
| `enabledByDefault`                   | Nein          | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg oder setzen Sie einen beliebigen Nicht-`true`-Wert, damit das Plugin standardmäßig deaktiviert bleibt.                                                |
| `enabledByDefaultOnPlatforms`        | Nein          | `string[]`                       | Markiert ein gebündeltes Plugin nur auf den aufgeführten Node.js-Plattformen als standardmäßig aktiviert, zum Beispiel `["darwin"]`. Explizite Konfiguration hat weiterhin Vorrang.                                                |
| `legacyPluginIds`                    | Nein          | `string[]`                       | Legacy-IDs, die zu dieser kanonischen Plugin-ID normalisiert werden.                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Nein          | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modellverweise sie erwähnen.                                                                                               |
| `kind`                               | Nein          | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                     |
| `channels`                           | Nein          | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Wird für Erkennung und Konfigurationsvalidierung verwendet.                                                                                                                                   |
| `providers`                          | Nein          | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                            |
| `providerDiscoveryEntry`             | Nein          | `string`                         | Leichtgewichtiger Provider-Discovery-Modulpfad relativ zum Plugin-Root für manifestbezogene Provider-Katalogmetadaten, die geladen werden können, ohne die vollständige Plugin-Runtime zu aktivieren.                              |
| `modelSupport`                       | Nein          | `object`                         | Manifestgesteuerte Kurzform-Metadaten zu Modellfamilien, die verwendet werden, um das Plugin vor der Runtime automatisch zu laden.                                                                                                  |
| `modelCatalog`                       | Nein          | `object`                         | Deklarative Modellkatalog-Metadaten für Provider, die diesem Plugin gehören. Dies ist der Control-Plane-Vertrag für zukünftige schreibgeschützte Auflistung, Onboarding, Modellauswahlen, Aliasse und Unterdrückung ohne Laden der Plugin-Runtime. |
| `modelPricing`                       | Nein          | `object`                         | Provider-gesteuerte externe Preisabfrage-Richtlinie. Verwenden Sie sie, um lokale/selbst gehostete Provider von Remote-Preiskatalogen auszunehmen oder Provider-Referenzen OpenRouter-/LiteLLM-Katalog-IDs zuzuordnen, ohne Provider-IDs im Core hart zu codieren. |
| `modelIdNormalization`               | Nein          | `object`                         | Provider-gesteuerte Modell-ID-Alias-/Präfixbereinigung, die ausgeführt werden muss, bevor die Provider-Runtime geladen wird.                                                                                                        |
| `providerEndpoints`                  | Nein          | `object[]`                       | Manifestgesteuerte Endpoint-Host-/baseUrl-Metadaten für Provider-Routen, die der Core klassifizieren muss, bevor die Provider-Runtime geladen wird.                                                                                 |
| `providerRequest`                    | Nein          | `object`                         | Günstige Provider-Familien- und Anfragekompatibilitäts-Metadaten, die von der generischen Anfrage-Richtlinie verwendet werden, bevor die Provider-Runtime geladen wird.                                                             |
| `cliBackends`                        | Nein          | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Wird für die automatische Aktivierung beim Start aus expliziten Konfigurationsreferenzen verwendet.                                                                             |
| `syntheticAuthRefs`                  | Nein          | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren plugin-eigener synthetischer Authentifizierungs-Hook während der Cold Model Discovery geprüft werden soll, bevor die Runtime geladen wird.                                            |
| `nonSecretAuthMarkers`               | Nein          | `string[]`                       | Platzhalter-API-Schlüsselwerte, die gebündelten Plugins gehören und nicht geheime lokale, OAuth- oder umgebungsbezogene Anmeldedatenzustände darstellen.                                                                            |
| `commandAliases`                     | Nein          | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Runtime plugin-bewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                                            |
| `providerAuthEnvVars`                | Nein          | `Record<string, string[]>`       | Veraltete Kompatibilitäts-Env-Metadaten für Provider-Authentifizierungs-/Statusabfragen. Bevorzugen Sie `setup.providers[].envVars` für neue Plugins; OpenClaw liest dies während des Deprecation-Fensters weiterhin.              |
| `providerAuthAliases`                | Nein          | `Record<string, string>`         | Provider-IDs, die für Authentifizierungsabfragen eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der den API-Schlüssel und die Authentifizierungsprofile des Basis-Providers teilt.                |
| `channelEnvVars`                     | Nein          | `Record<string, string[]>`       | Günstige Kanal-Env-Metadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuerte Kanaleinrichtung oder Authentifizierungsoberflächen, die generische Start-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`                | Nein          | `object[]`                       | Günstige Authentifizierungsauswahl-Metadaten für Onboarding-Auswahlen, Preferred-Provider-Auflösung und einfache CLI-Flag-Verkabelung.                                                                                              |
| `activation`                         | Nein          | `object`                         | Günstige Aktivierungsplaner-Metadaten für Start, Provider, Befehl, Kanal, Route und durch Fähigkeiten ausgelöstes Laden. Nur Metadaten; die Plugin-Runtime besitzt weiterhin das tatsächliche Verhalten.                            |
| `setup`                              | Nein          | `object`                         | Günstige Setup-/Onboarding-Deskriptoren, die Erkennungs- und Setup-Oberflächen prüfen können, ohne die Plugin-Runtime zu laden.                                                                                                     |
| `qaRunners`                          | Nein          | `object[]`                       | Günstige QA-Runner-Deskriptoren, die vom gemeinsamen `openclaw qa`-Host verwendet werden, bevor die Plugin-Runtime geladen wird.                                                                                                    |
| `contracts`                          | Nein          | `object`                         | Statische Momentaufnahme der Fähigkeitszuständigkeit für externe Authentifizierungs-Hooks, Sprache, Echtzeit-Transkription, Echtzeitstimme, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Zuständigkeit. |
| `mediaUnderstandingProviderMetadata` | Nein          | `Record<string, object>`         | Günstige Medienverständnis-Standardwerte für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                          |
| `imageGenerationProviderMetadata`    | Nein          | `Record<string, object>`         | Günstige Bildgenerierungs-Authentifizierungsmetadaten für Provider-IDs, die in `contracts.imageGenerationProviders` deklariert sind, einschließlich provider-eigener Authentifizierungsaliasse und Base-URL-Guards.                 |
| `videoGenerationProviderMetadata`    | Nein          | `Record<string, object>`         | Günstige Videogenerierungs-Authentifizierungsmetadaten für Provider-IDs, die in `contracts.videoGenerationProviders` deklariert sind, einschließlich provider-eigener Authentifizierungsaliasse und Base-URL-Guards.                |
| `musicGenerationProviderMetadata`    | Nein          | `Record<string, object>`         | Günstige Musikgenerierungs-Authentifizierungsmetadaten für Provider-IDs, die in `contracts.musicGenerationProviders` deklariert sind, einschließlich provider-eigener Authentifizierungsaliasse und Base-URL-Guards.                |
| `toolMetadata`                       | Nein          | `Record<string, object>`         | Günstige Verfügbarkeitsmetadaten für plugin-eigene Tools, die in `contracts.tools` deklariert sind. Verwenden Sie dies, wenn ein Tool die Runtime nur laden soll, wenn Konfigurations-, Env- oder Authentifizierungsnachweise vorhanden sind. |
| `channelConfigs`                     | Nein          | `Record<string, object>`         | Manifestgesteuerte Kanal-Konfigurationsmetadaten, die vor dem Laden der Runtime in Erkennungs- und Validierungsoberflächen zusammengeführt werden.                                                                                  |
| `skills`                             | Nein          | `string[]`                       | Skills-Verzeichnisse, die relativ zum Plugin-Root geladen werden sollen.                                                                                                                                                            |
| `name`                               | Nein     | `string`                         | Für Menschen lesbarer Plugin-Name.                                                                                                                                                                                                  |
| `description`                        | Nein     | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                     |
| `version`                            | Nein     | `string`                         | Plugin-Version zu Informationszwecken.                                                                                                                                                                                              |
| `uiHints`                            | Nein     | `Record<string, object>`         | UI-Bezeichnungen, Platzhalter und Hinweise zur Vertraulichkeit für Konfigurationsfelder.                                                                                                                                             |

## Referenz für Metadaten von Generierungs-Providern

Die Metadatenfelder für Generierungs-Provider beschreiben statische Auth-Signale für
Provider, die in der passenden Liste `contracts.*GenerationProviders` deklariert sind.
OpenClaw liest diese Felder, bevor die Provider-Laufzeit geladen wird, damit Kern-Tools
entscheiden können, ob ein Generierungs-Provider verfügbar ist, ohne jedes
Provider-Plugin zu importieren.

Verwenden Sie diese Felder nur für leichtgewichtige, deklarative Fakten. Transport, Request-Transformationen,
Token-Aktualisierung, Validierung von Zugangsdaten und das tatsächliche Generierungsverhalten
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

| Feld            | Erforderlich | Typ        | Bedeutung                                                                                                                               |
| --------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Nein         | `string[]` | Zusätzliche Provider-IDs, die als statische Auth-Aliasse für den Generierungs-Provider zählen sollen.                                    |
| `authProviders` | Nein         | `string[]` | Provider-IDs, deren konfigurierte Auth-Profile als Auth für diesen Generierungs-Provider zählen sollen.                                  |
| `configSignals` | Nein         | `object[]` | Leichtgewichtige, nur auf Konfiguration basierende Verfügbarkeitssignale für lokale oder selbst gehostete Provider, die ohne Auth-Profile oder Umgebungsvariablen konfiguriert werden können. |
| `authSignals`   | Nein         | `object[]` | Explizite Auth-Signale. Wenn vorhanden, ersetzen sie den Standardsignalsatz aus der Provider-ID, `aliases` und `authProviders`.          |

Jeder `configSignals`-Eintrag unterstützt:

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                         |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Ja           | `string`   | Punktpfad zum Plugin-eigenen Konfigurationsobjekt, das geprüft werden soll, zum Beispiel `plugins.entries.example.config`.                                                                         |
| `overlayPath` | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objekt das Stammobjekt vor der Auswertung des Signals überlagern soll. Verwenden Sie dies für fähigkeitsspezifische Konfiguration wie `image`, `video` oder `music`. |
| `required`    | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, die konfigurierte Werte haben müssen. Zeichenfolgen dürfen nicht leer sein; Objekte und Arrays dürfen nicht leer sein.                         |
| `requiredAny` | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, von denen mindestens einer einen konfigurierten Wert haben muss.                                                                                |
| `mode`        | Nein         | `object`   | Optionale Zeichenfolgenmodus-Absicherung innerhalb der effektiven Konfiguration. Verwenden Sie dies, wenn reine Konfigurationsverfügbarkeit nur für einen Modus gilt.                              |

Jede `mode`-Absicherung unterstützt:

| Feld         | Erforderlich | Typ        | Bedeutung                                                                                         |
| ------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `path`       | Nein         | `string`   | Punktpfad innerhalb der effektiven Konfiguration. Standardwert ist `mode`.                        |
| `default`    | Nein         | `string`   | Moduswert, der verwendet wird, wenn die Konfiguration den Pfad auslässt.                          |
| `allowed`    | Nein         | `string[]` | Falls vorhanden, besteht das Signal nur, wenn der effektive Modus einer dieser Werte ist.         |
| `disallowed` | Nein         | `string[]` | Falls vorhanden, schlägt das Signal fehl, wenn der effektive Modus einer dieser Werte ist.        |

Jeder `authSignals`-Eintrag unterstützt:

| Feld              | Erforderlich | Typ      | Bedeutung                                                                                                                                                                            |
| ----------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Ja           | `string` | Provider-ID, die in konfigurierten Auth-Profilen geprüft werden soll.                                                                                                                |
| `providerBaseUrl` | Nein         | `object` | Optionale Absicherung, durch die das Signal nur zählt, wenn der referenzierte konfigurierte Provider eine zulässige Basis-URL verwendet. Verwenden Sie dies, wenn ein Auth-Alias nur für bestimmte APIs gültig ist. |

Jede `providerBaseUrl`-Absicherung unterstützt:

| Feld              | Erforderlich | Typ        | Bedeutung                                                                                                                                                 |
| ----------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string`   | Provider-Konfigurations-ID, deren `baseUrl` geprüft werden soll.                                                                                          |
| `defaultBaseUrl`  | Nein         | `string`   | Basis-URL, die angenommen wird, wenn die Provider-Konfiguration `baseUrl` auslässt.                                                                        |
| `allowedBaseUrls` | Ja           | `string[]` | Zulässige Basis-URLs für dieses Auth-Signal. Das Signal wird ignoriert, wenn die konfigurierte oder standardmäßige Basis-URL keinem dieser normalisierten Werte entspricht. |

## Referenz für Tool-Metadaten

`toolMetadata` verwendet dieselben Formen für `configSignals` und `authSignals` wie
Metadaten von Generierungs-Providern, nach Tool-Namen verschlüsselt. `contracts.tools` deklariert
die Zuständigkeit. `toolMetadata` deklariert leichtgewichtige Verfügbarkeitsnachweise, damit OpenClaw
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
lädt das zuständige Plugin, wenn der Tool-Vertrag der Richtlinie entspricht. Für Hot-Path-
Tools, deren Factory von Auth/Konfiguration abhängt, sollten Plugin-Autoren
`toolMetadata` deklarieren, statt den Kern die Laufzeit importieren zu lassen, um nachzufragen.

## Referenz für providerAuthChoices

Jeder `providerAuthChoices`-Eintrag beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.
Provider-Einrichtungslisten verwenden diese Manifest-Auswahlen, aus Deskriptoren abgeleitete Einrichtungs-
auswahlen und Installationskatalog-Metadaten, ohne die Provider-Laufzeit zu laden.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                               |
| --------------------- | ------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                               |
| `method`              | Ja           | `string`                                        | Auth-Methoden-ID, an die weitergeleitet werden soll.                                                                    |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Auswahl-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                                           |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Bezeichnung. Wenn ausgelassen, fällt OpenClaw auf `choiceId` zurück.                                    |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                                       |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlmenüs früher sortiert.                            |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistentenauswahlmenüs aus, erlaubt aber weiterhin die manuelle CLI-Auswahl.                    |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Legacy-Auswahl-IDs, die Benutzer zu dieser Ersatzauswahl umleiten sollen.                                               |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlmöglichkeiten.                                                    |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Bezeichnung für diese Gruppe.                                                                           |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                                        |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit einem Flag.                                                     |
| `cliFlag`             | Nein         | `string`                                        | CLI-Flag-Name, zum Beispiel `--openrouter-api-key`.                                                                     |
| `cliOption`           | Nein         | `string`                                        | Vollständige CLI-Optionsform, zum Beispiel `--openrouter-api-key <key>`.                                                |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                                      |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | Onboarding-Oberflächen, auf denen diese Auswahl erscheinen soll. Wenn ausgelassen, ist der Standard `["text-inference"]`. |

## Referenz für commandAliases

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeitbefehlsnamen besitzt, den Benutzer versehentlich in `plugins.allow` eintragen oder als obersten CLI-Befehl ausführen könnten. OpenClaw verwendet diese Metadaten für Diagnosen, ohne Laufzeitcode des Plugins zu importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                 |
| ------------ | ------------ | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                 |
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl statt als obersten CLI-Befehl. |
| `cliCommand` | Nein         | `string`          | Zugehöriger oberster CLI-Befehl, der für CLI-Vorgänge vorgeschlagen wird, falls vorhanden. |

## activation-Referenz

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, bei welchen Ereignissen der Steuerungsebene es in einen Aktivierungs-/Ladeplan aufgenommen werden soll.

Dieser Block ist Planer-Metadaten, keine Lebenszyklus-API. Er registriert kein Laufzeitverhalten, ersetzt `register(...)` nicht und verspricht nicht, dass Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um Kandidaten-Plugins einzugrenzen, bevor er auf vorhandene Manifest-Besitzmetadaten wie `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks zurückfällt.

Bevorzugen Sie die engsten Metadaten, die den Besitz bereits beschreiben. Verwenden Sie `providers`, `channels`, `commandAliases`, Setup-Deskriptoren oder `contracts`, wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planerhinweise, die nicht durch diese Besitzfelder dargestellt werden können.
Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Laufzeitaliasse wie `claude-cli`, `codex-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist nur für eingebettete Agent-Harness-IDs gedacht, die noch kein Besitzfeld haben.

Dieser Block enthält nur Metadaten. Er registriert kein Laufzeitverhalten und ersetzt weder `register(...)`, `setupEntry` noch andere Laufzeit-/Plugin-Einstiegspunkte. Aktuelle Verbraucher verwenden ihn als Eingrenzungshinweis vor dem breiteren Laden von Plugins. Fehlende Nicht-Start-Aktivierungsmetadaten kosten daher in der Regel nur Leistung; sie sollten die Korrektheit nicht ändern, solange Manifest-Besitz-Fallbacks weiterhin vorhanden sind.

Jedes Plugin sollte `activation.onStartup` bewusst setzen. Setzen Sie es nur dann auf `true`, wenn das Plugin während des Gateway-Starts ausgeführt werden muss. Setzen Sie es auf `false`, wenn das Plugin beim Start inaktiv ist und nur durch engere Trigger geladen werden soll. Das Weglassen von `onStartup` führt nicht mehr implizit dazu, dass das Plugin beim Start geladen wird. Verwenden Sie explizite Aktivierungsmetadaten für Start-, Channel-, Konfigurations-, Agent-Harness-, Speicher- oder andere engere Aktivierungstrigger.

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
| `onStartup`        | Nein         | `boolean`                                            | Explizite Gateway-Startaktivierung. Jedes Plugin sollte dies setzen. `true` importiert das Plugin beim Start; `false` hält es startträge, sofern kein anderer passender Trigger das Laden erfordert. |
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Eingebettete Agent-Harness-Laufzeit-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliasse.             |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                 |
| `onChannels`       | Nein         | `string[]`                                           | Channel-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                 |
| `onRoutes`         | Nein         | `string[]`                                           | Routenarten, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                 |
| `onConfigPaths`    | Nein         | `string[]`                                           | Zum Stamm relative Konfigurationspfade, die dieses Plugin in Start-/Ladepläne aufnehmen sollen, wenn der Pfad vorhanden und nicht explizit deaktiviert ist.                                  |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Fähigkeits-Hinweise, die von der Aktivierungsplanung der Steuerungsebene verwendet werden. Bevorzugen Sie engere Felder, wenn möglich.                                               |

Aktuelle Live-Verbraucher:

- Die Gateway-Startplanung verwendet `activation.onStartup` für expliziten Startimport
- Die befehlsausgelöste CLI-Planung fällt auf das ältere `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Die Agent-Laufzeit-Startplanung verwendet `activation.onAgentHarnesses` für eingebettete Harnesses und `cliBackends[]` auf oberster Ebene für CLI-Laufzeitaliasse
- Die channel-ausgelöste Setup-/Channel-Planung fällt auf den älteren `channels[]`-Besitz zurück, wenn explizite Channel-Aktivierungsmetadaten fehlen
- Die Start-Plugin-Planung verwendet `activation.onConfigPaths` für Nicht-Channel-Konfigurationsoberflächen im Stamm, etwa den `browser`-Block des gebündelten Browser-Plugins
- Die provider-ausgelöste Setup-/Laufzeitplanung fällt auf den älteren `providers[]`-Besitz und `cliBackends[]` auf oberster Ebene zurück, wenn explizite Provider-Aktivierungsmetadaten fehlen

Planerdiagnosen können explizite Aktivierungshinweise von Manifest-Besitz-Fallbacks unterscheiden. Beispielsweise bedeutet `activation-command-hint`, dass `activation.onCommands` gepasst hat, während `manifest-command-alias` bedeutet, dass der Planer stattdessen den Besitz über `commandAliases` verwendet hat. Diese Begründungsbezeichnungen sind für Hostdiagnosen und Tests gedacht; Plugin-Autoren sollten weiterhin die Metadaten deklarieren, die den Besitz am besten beschreiben.

## qaRunners-Referenz

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb des gemeinsamen Stamms `openclaw qa` beiträgt. Halten Sie diese Metadaten kostengünstig und statisch; die Plugin-Laufzeit besitzt weiterhin die eigentliche CLI-Registrierung über eine leichtgewichtige `runtime-api.ts`-Oberfläche, die `qaRunnerCliRegistrations` exportiert.

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

| Feld          | Erforderlich | Typ      | Bedeutung                                                                |
| ------------- | ------------ | -------- | ------------------------------------------------------------------------ |
| `commandName` | Ja           | `string` | Unterbefehl, der unterhalb von `openclaw qa` eingehängt wird, zum Beispiel `matrix`. |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

## setup-Referenz

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen kostengünstige, Plugin-eigene Metadaten benötigen, bevor die Laufzeit geladen wird.

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

`cliBackends` auf oberster Ebene bleibt gültig und beschreibt weiterhin CLI-Inferenz-Backends. `setup.cliBackends` ist die Setup-spezifische Deskriptoroberfläche für Steuerungsebenen-/Setup-Abläufe, die rein metadatenbasiert bleiben sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte deskriptorzuerst ausgerichtete Suchoberfläche für die Setup-Erkennung. Wenn der Deskriptor nur das Kandidaten-Plugin eingrenzt und das Setup weiterhin umfangreichere Laufzeit-Hooks zur Setup-Zeit benötigt, setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als Fallback-Ausführungspfad bei.

OpenClaw bezieht außerdem `setup.providers[].envVars` in generische Provider-Auth- und Umgebungsvariablen-Suchen ein. `providerAuthEnvVars` bleibt während des Abkündigungsfensters über einen Kompatibilitätsadapter unterstützt, aber nicht gebündelte Plugins, die es weiterhin verwenden, erhalten eine Manifestdiagnose. Neue Plugins sollten Setup-/Status-Umgebungsmetadaten in `setup.providers[].envVars` ablegen.

OpenClaw kann auch einfache Setup-Auswahlen aus `setup.providers[].authMethods` ableiten, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false` erklärt, dass eine Setup-Laufzeit nicht erforderlich ist. Explizite `providerAuthChoices`-Einträge bleiben für benutzerdefinierte Beschriftungen, CLI-Flags, Onboarding-Geltungsbereich und Assistentenmetadaten bevorzugt.

Setzen Sie `requiresRuntime: false` nur, wenn diese Deskriptoren für die Setup-Oberfläche ausreichen. OpenClaw behandelt ein explizites `false` als rein deskriptorbasierten Vertrag und führt `setup-api` oder `openclaw.setupEntry` für die Setup-Suche nicht aus. Wenn ein rein deskriptorbasiertes Plugin dennoch einen dieser Setup-Laufzeiteinträge ausliefert, meldet OpenClaw eine additive Diagnose und ignoriert ihn weiterhin. Ein ausgelassenes `requiresRuntime` behält das ältere Fallback-Verhalten bei, damit vorhandene Plugins, die Deskriptoren ohne das Flag hinzugefügt haben, nicht brechen.

Da die Setup-Suche Plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte Werte von `setup.providers[].id` und `setup.cliBackends[]` über alle erkannten Plugins hinweg eindeutig bleiben. Mehrdeutiger Besitz schlägt geschlossen fehl, statt einen Gewinner aus der Erkennungsreihenfolge auszuwählen.

Wenn die Setup-Laufzeit ausgeführt wird, melden Setup-Registry-Diagnosen Deskriptorabweichungen, wenn `setup-api` einen Provider oder ein CLI-Backend registriert, den oder das die Manifestdeskriptoren nicht deklarieren, oder wenn ein Deskriptor keine passende Laufzeitregistrierung hat. Diese Diagnosen sind additiv und lehnen ältere Plugins nicht ab.

### setup.providers-Referenz

| Feld           | Erforderlich | Typ        | Bedeutung                                                                                          |
| -------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| `id`           | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding offengelegt wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods`  | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Provider unterstützt, ohne die vollständige Laufzeit zu laden. |
| `envVars`      | Nein         | `string[]` | Umgebungsvariablen, die generische Setup-/Statusoberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |
| `authEvidence` | Nein         | `object[]` | Kostengünstige lokale Auth-Nachweise für Provider, die sich über nicht geheime Marker authentifizieren können. |

`authEvidence` ist für lokale, vom Provider verwaltete Anmeldedaten-Marker, die
ohne Laden von Laufzeitcode verifiziert werden können. Diese Prüfungen müssen
kostengünstig und lokal bleiben: keine Netzwerkaufrufe, keine Lesezugriffe auf
Keychain oder Secret-Manager, keine Shell-Befehle und keine Provider-API-Probes.

Unterstützte Evidence-Einträge:

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                       |
| ------------------ | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja           | `string`   | Derzeit `local-file-with-env`.                                                                                  |
| `fileEnvVar`       | Nein         | `string`   | Umgebungsvariable mit einem expliziten Pfad zur Anmeldedatendatei.                                              |
| `fallbackPaths`    | Nein         | `string[]` | Lokale Pfade zu Anmeldedatendateien, die geprüft werden, wenn `fileEnvVar` fehlt oder leer ist. Unterstützt `${HOME}` und `${APPDATA}`. |
| `requiresAnyEnv`   | Nein         | `string[]` | Mindestens eine aufgeführte Umgebungsvariable muss nicht leer sein, bevor die Evidence gültig ist.              |
| `requiresAllEnv`   | Nein         | `string[]` | Jede aufgeführte Umgebungsvariable muss nicht leer sein, bevor die Evidence gültig ist.                         |
| `credentialMarker` | Ja           | `string`   | Nicht geheimer Marker, der zurückgegeben wird, wenn die Evidence vorhanden ist.                                 |
| `source`           | Nein         | `string`   | Benutzerseitiges Quell-Label für Authentifizierungs-/Statusausgaben.                                           |

### setup-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                             |
| ------------------ | ------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding verfügbar gemacht werden.               |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für deskriptorbasierte Setup-Suche verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | Konfigurationsmigrations-IDs, die der Setup-Oberfläche dieses Plugins gehören.                        |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach der Deskriptorsuche weiterhin `setup-api`-Ausführung benötigt.                      |

## uiHints-Referenz

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

| Feld          | Typ        | Bedeutung                                      |
| ------------- | ---------- | ---------------------------------------------- |
| `label`       | `string`   | Benutzerseitiges Feld-Label.                   |
| `help`        | `string`   | Kurzer Hilfetext.                              |
| `tags`        | `string[]` | Optionale UI-Tags.                             |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.               |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel.    |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.          |

## contracts-Referenz

Verwenden Sie `contracts` nur für statische Metadaten zur Capability-Zuständigkeit, die OpenClaw
lesen kann, ohne die Plugin-Laufzeit zu importieren.

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

| Feld                             | Typ        | Bedeutung                                                              |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Factory-IDs für Codex-App-Server-Erweiterungen, derzeit `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Laufzeit-IDs, für die ein gebündeltes Plugin Tool-Result-Middleware registrieren darf. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Authentifizierungsprofile diesem Plugin gehört. |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                        |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-Transcription-Provider-IDs, die diesem Plugin gehören.         |
| `realtimeVoiceProviders`         | `string[]` | Realtime-Voice-Provider-IDs, die diesem Plugin gehören.                 |
| `memoryEmbeddingProviders`       | `string[]` | Memory-Embedding-Provider-IDs, die diesem Plugin gehören.               |
| `mediaUnderstandingProviders`    | `string[]` | Media-Understanding-Provider-IDs, die diesem Plugin gehören.            |
| `imageGenerationProviders`       | `string[]` | Image-Generation-Provider-IDs, die diesem Plugin gehören.               |
| `videoGenerationProviders`       | `string[]` | Video-Generation-Provider-IDs, die diesem Plugin gehören.               |
| `webFetchProviders`              | `string[]` | Web-Fetch-Provider-IDs, die diesem Plugin gehören.                      |
| `webSearchProviders`             | `string[]` | Web-Search-Provider-IDs, die diesem Plugin gehören.                     |
| `migrationProviders`             | `string[]` | Import-Provider-IDs, die diesem Plugin für `openclaw migrate` gehören.  |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin gehören.                       |

`contracts.embeddedExtensionFactories` bleibt für gebündelte, nur für den Codex-App-Server bestimmte
Erweiterungs-Factories erhalten. Gebündelte Tool-Result-Transformationen sollten stattdessen
`contracts.agentToolResultMiddleware` deklarieren und sich mit
`api.registerAgentToolResultMiddleware(...)` registrieren. Externe Plugins können keine
Tool-Result-Middleware registrieren, weil diese Nahtstelle hochvertrauenswürdige Tool-Ausgaben
umschreiben kann, bevor das Modell sie sieht.

Laufzeitregistrierungen mit `api.registerTool(...)` müssen `contracts.tools` entsprechen.
Die Tool-Erkennung verwendet diese Liste, um nur die Plugin-Laufzeiten zu laden, denen die
angeforderten Tools gehören können.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten
`contracts.externalAuthProviders` deklarieren. Plugins ohne diese Deklaration laufen weiterhin
über einen veralteten Kompatibilitäts-Fallback, aber dieser Fallback ist langsamer und wird
nach dem Migrationsfenster entfernt.

Gebündelte Memory-Embedding-Provider sollten
`contracts.memoryEmbeddingProviders` für jede Adapter-ID deklarieren, die sie bereitstellen,
einschließlich integrierter Adapter wie `local`. Eigenständige CLI-Pfade verwenden diesen Manifest-Vertrag,
um nur das zuständige Plugin zu laden, bevor die vollständige Gateway-Laufzeit
Provider registriert hat.

## mediaUnderstandingProviderMetadata-Referenz

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Media-Understanding-Provider
Standardmodelle, Priorität für automatischen Authentifizierungs-Fallback oder native Dokumentunterstützung hat, die
generische Core-Helfer vor dem Laden der Laufzeit benötigen. Schlüssel müssen auch in
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

| Feld                   | Typ                                 | Bedeutung                                                                 |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medien-Capabilities, die dieser Provider bereitstellt.                    |
| `defaultModels`        | `Record<string, string>`            | Capability-zu-Modell-Standardwerte, die verwendet werden, wenn die Konfiguration kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden für automatischen, anmeldedatenbasierten Provider-Fallback früher einsortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.             |

## channelConfigs-Referenz

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin kostengünstige Konfigurationsmetadaten benötigt, bevor
die Laufzeit geladen wird. Schreibgeschützte Kanal-Setup-/Status-Erkennung kann diese Metadaten
direkt für konfigurierte externe Kanäle verwenden, wenn kein Setup-Eintrag verfügbar ist oder
wenn `setup.requiresRuntime: false` deklariert, dass keine Setup-Laufzeit erforderlich ist.

`channelConfigs` sind Plugin-Manifest-Metadaten, kein neuer Top-Level-Abschnitt der Benutzerkonfiguration.
Benutzer konfigurieren Kanalinstanzen weiterhin unter `channels.<channel-id>`.
OpenClaw liest Manifest-Metadaten, um zu entscheiden, welchem Plugin dieser konfigurierte
Kanal gehört, bevor Plugin-Laufzeitcode ausgeführt wird.

Für ein Kanal-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche
Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten auch passende
`channelConfigs`-Einträge deklarieren. Ohne sie kann OpenClaw das Plugin zwar weiterhin laden, aber
Cold-Path-Konfigurationsschema, Setup und Control-UI-Oberflächen können die
kanaleigene Optionsstruktur erst kennen, wenn die Plugin-Laufzeit ausgeführt wird.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und
`nativeSkillsAutoEnabled` können statische `auto`-Standardwerte für Befehls-Konfigurationsprüfungen
deklarieren, die ausgeführt werden, bevor die Kanallaufzeit geladen wird. Gebündelte Kanäle können
dieselben Standardwerte auch über `package.json#openclaw.channel.commands` zusammen mit
ihren anderen paketverwalteten Kanal-Katalogmetadaten veröffentlichen.

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

| Feld          | Typ                      | Bedeutung                                                                                                      |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanal-Konfigurationseintrag erforderlich.              |
| `uiHints`     | `Record<string, object>` | Optionale UI-Labels/Platzhalter/Sensitivitätshinweise für diesen Kanal-Konfigurationsabschnitt.                |
| `label`       | `string`                 | Kanal-Label, das in Auswahl- und Inspektionsoberflächen übernommen wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                                               |
| `commands`    | `object`                 | Statische native Befehle und automatische Standardwerte für native Skills für Konfigurationsprüfungen vor der Laufzeit. |
| `preferOver`  | `string[]`               | Legacy- oder nachrangige Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll.                  |

### Ersetzen eines anderen Kanal-Plugins

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Eigentümer für eine Kanal-ID ist, die auch ein anderes Plugin bereitstellen kann. Häufige Fälle sind eine umbenannte Plugin-ID, ein eigenständiges Plugin, das ein gebündeltes Plugin ersetzt, oder ein gepflegter Fork, der aus Gründen der Konfigurationskompatibilität dieselbe Kanal-ID beibehält.

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

Wenn `channels.chat` konfiguriert ist, berücksichtigt OpenClaw sowohl die Kanal-ID als auch die bevorzugte Plugin-ID. Wenn das nachrangige Plugin nur ausgewählt wurde, weil es gebündelt oder standardmäßig aktiviert ist, deaktiviert OpenClaw es in der effektiven Laufzeitkonfiguration, damit ein Plugin den Kanal und seine Tools besitzt. Eine explizite Benutzerauswahl hat weiterhin Vorrang: Wenn der Benutzer beide Plugins explizit aktiviert, bewahrt OpenClaw diese Auswahl und meldet Diagnosen zu doppelten Kanälen/Tools, anstatt die angeforderte Plugin-Menge stillschweigend zu ändern.

Beschränken Sie `preferOver` auf Plugin-IDs, die denselben Kanal wirklich bereitstellen können. Es ist kein allgemeines Prioritätsfeld und benennt keine Benutzer-Konfigurationsschlüssel um.

## modelSupport-Referenz

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus Kurzformen von Modell-IDs wie `gpt-5.5` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet diese Rangfolge an:

- explizite `provider/model`-Referenzen verwenden die zugehörigen `providers`-Manifestmetadaten
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzformen von Modell-IDs abgeglichen werden. |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen des Profilsuffixes gegen Kurzformen von Modell-IDs abgeglichen werden. |

## modelCatalog-Referenz

Verwenden Sie `modelCatalog`, wenn OpenClaw Provider-Modellmetadaten kennen soll, bevor die Plugin-Laufzeit geladen wird. Dies ist die manifestverwaltete Quelle für feste Katalogzeilen, Provider-Aliase, Unterdrückungsregeln und den Erkennungsmodus. Die Laufzeitaktualisierung gehört weiterhin in den Provider-Laufzeitcode, aber das Manifest teilt dem Core mit, wann Laufzeit erforderlich ist.

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

| Feld           | Typ                                                      | Bedeutung                                                                                                   |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Schlüssel sollten auch in `providers` auf oberster Ebene erscheinen. |
| `aliases`      | `Record<string, object>`                                 | Provider-Aliase, die für die Katalog- oder Unterdrückungsplanung zu einem eigenen Provider aufgelöst werden sollen. |
| `suppressions` | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus Provider-spezifischem Grund unterdrückt.       |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Ob der Provider-Katalog aus Manifestmetadaten gelesen, in den Cache aktualisiert werden kann oder Laufzeit erfordert. |

`aliases` ist an der Provider-Eigentümerermittlung für die Modellkatalogplanung beteiligt. Alias-Ziele müssen Provider auf oberster Ebene sein, die demselben Plugin gehören. Wenn eine nach Provider gefilterte Liste einen Alias verwendet, kann OpenClaw das zugehörige Manifest lesen und Alias-API-/Basis-URL-Überschreibungen anwenden, ohne die Provider-Laufzeit zu laden.
Aliase erweitern ungefilterte Katalogauflistungen nicht; breite Listen geben nur die kanonischen Provider-Zeilen des Eigentümers aus.

`suppressions` ersetzt den alten Provider-Laufzeit-Hook `suppressBuiltInModel`. Unterdrückungseinträge werden nur berücksichtigt, wenn der Provider dem Plugin gehört oder als `modelCatalog.aliases`-Schlüssel deklariert ist, der auf einen eigenen Provider verweist. Laufzeit-Unterdrückungs-Hooks werden während der Modellauflösung nicht mehr aufgerufen.

Provider-Felder:

| Feld      | Typ                      | Bedeutung                                                               |
| --------- | ------------------------ | ----------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionale Standard-Basis-URL für Modelle in diesem Provider-Katalog.    |
| `api`     | `ModelApi`               | Optionaler Standard-API-Adapter für Modelle in diesem Provider-Katalog. |
| `headers` | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten.     |
| `models`  | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.          |

Modellfelder:

| Feld            | Typ                                                            | Bedeutung                                                                    |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                       |
| `name`          | `string`                                                       | Optionaler Anzeigename.                                                       |
| `api`           | `ModelApi`                                                     | Optionale API-Überschreibung pro Modell.                                      |
| `baseUrl`       | `string`                                                       | Optionale Basis-URL-Überschreibung pro Modell.                                |
| `headers`       | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                        |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitäten, die das Modell akzeptiert.                                       |
| `reasoning`     | `boolean`                                                      | Ob das Modell Reasoning-Verhalten bereitstellt.                               |
| `contextWindow` | `number`                                                       | Natives Provider-Kontextfenster.                                              |
| `contextTokens` | `number`                                                       | Optionale effektive Laufzeit-Kontextobergrenze, wenn sie von `contextWindow` abweicht. |
| `maxTokens`     | `number`                                                       | Maximale Ausgabetokens, sofern bekannt.                                       |
| `cost`          | `object`                                                       | Optionale Preise in USD pro Million Tokens, einschließlich optionalem `tieredPricing`. |
| `compat`        | `object`                                                       | Optionale Kompatibilitätsflags, die der OpenClaw-Modellkonfigurationskompatibilität entsprechen. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Auflistungsstatus. Nur unterdrücken, wenn die Zeile überhaupt nicht erscheinen darf. |
| `statusReason`  | `string`                                                       | Optionaler Grund, der bei nicht verfügbarem Status angezeigt wird.            |
| `replaces`      | `string[]`                                                     | Ältere Provider-lokale Modell-IDs, die dieses Modell ersetzt.                 |
| `replacedBy`    | `string`                                                       | Ersatz-Provider-lokale Modell-ID für veraltete Zeilen.                        |
| `tags`          | `string[]`                                                     | Stabile Tags, die von Auswahloberflächen und Filtern verwendet werden.        |

Unterdrückungsfelder:

| Feld                       | Typ        | Bedeutung                                                                                                  |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-ID der Upstream-Zeile, die unterdrückt werden soll. Muss diesem Plugin gehören oder als eigener Alias deklariert sein. |
| `model`                    | `string`   | Provider-lokale Modell-ID, die unterdrückt werden soll.                                                     |
| `reason`                   | `string`   | Optionale Meldung, die angezeigt wird, wenn die unterdrückte Zeile direkt angefordert wird.                |
| `when.baseUrlHosts`        | `string[]` | Optionale Liste effektiver Provider-Basis-URL-Hosts, die erforderlich sind, bevor die Unterdrückung angewendet wird. |
| `when.providerConfigApiIn` | `string[]` | Optionale Liste exakter Provider-Konfigurationswerte für `api`, die erforderlich sind, bevor die Unterdrückung angewendet wird. |

Legen Sie keine reinen Laufzeitdaten in `modelCatalog` ab. Verwenden Sie `static` nur, wenn Manifestzeilen vollständig genug sind, damit Provider-gefilterte Listen- und Auswahloberflächen die Registry-/Laufzeitermittlung überspringen können. Verwenden Sie `refreshable`, wenn Manifestzeilen als auflistbare Startwerte oder Ergänzungen nützlich sind, ein Refresh/Cache später aber weitere Zeilen hinzufügen kann; refreshable-Zeilen sind für sich allein nicht autoritativ. Verwenden Sie `runtime`, wenn OpenClaw die Provider-Runtime laden muss, um die Liste zu kennen.

## modelIdNormalization-Referenz

Verwenden Sie `modelIdNormalization` für einfache Provider-eigene Bereinigung von Modell-IDs, die vor dem Laden der Provider-Runtime erfolgen muss. Dadurch bleiben Aliasse wie kurze Modellnamen, Provider-lokale Legacy-IDs und Proxy-Präfixregeln im Manifest des zuständigen Plugins statt in zentralen Modell-Auswahltabellen.

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

| Feld                                 | Typ                     | Bedeutung                                                                                                     |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Exakte Modell-ID-Aliasse ohne Berücksichtigung der Groß-/Kleinschreibung. Werte werden wie geschrieben zurückgegeben. |
| `stripPrefixes`                      | `string[]`              | Präfixe, die vor der Alias-Suche entfernt werden, nützlich für Legacy-Duplizierung von Provider/Modell.       |
| `prefixWhenBare`                     | `string`                | Präfix, das hinzugefügt wird, wenn die normalisierte Modell-ID noch kein `/` enthält.                         |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Bedingte Präfixregeln für reine IDs nach der Alias-Suche, nach `modelPrefix` und `prefix` indiziert.          |

## providerEndpoints-Referenz

Verwenden Sie `providerEndpoints` für Endpoint-Klassifizierung, die generische Anfrage-Richtlinien kennen müssen, bevor die Provider-Runtime geladen wird. Core besitzt weiterhin die Bedeutung jeder `endpointClass`; Plugin-Manifeste besitzen die Host- und Basis-URL-Metadaten.

Endpoint-Felder:

| Feld                           | Typ        | Bedeutung                                                                                                      |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekannte Core-Endpoint-Klasse, etwa `openrouter`, `moonshot-native` oder `google-vertex`.                     |
| `hosts`                        | `string[]` | Exakte Hostnamen, die der Endpoint-Klasse zugeordnet werden.                                                   |
| `hostSuffixes`                 | `string[]` | Host-Suffixe, die der Endpoint-Klasse zugeordnet werden. Stellen Sie `.` voran, um nur Domain-Suffixe abzugleichen. |
| `baseUrls`                     | `string[]` | Exakte normalisierte HTTP(S)-Basis-URLs, die der Endpoint-Klasse zugeordnet werden.                            |
| `googleVertexRegion`           | `string`   | Statische Google-Vertex-Region für exakte globale Hosts.                                                       |
| `googleVertexRegionHostSuffix` | `string`   | Suffix, das von passenden Hosts entfernt wird, um das Google-Vertex-Regionspräfix freizulegen.                 |

## providerRequest-Referenz

Verwenden Sie `providerRequest` für einfache Anfragekompatibilitäts-Metadaten, die generische Anfrage-Richtlinien benötigen, ohne die Provider-Runtime zu laden. Behalten Sie verhaltensspezifische Payload-Umschreibung in Provider-Runtime-Hooks oder gemeinsamen Helfern für Provider-Familien.

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

| Feld                  | Typ          | Bedeutung                                                                                         |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Label der Provider-Familie, das von generischen Entscheidungen und Diagnosen zur Anfragekompatibilität verwendet wird. |
| `compatibilityFamily` | `"moonshot"` | Optionaler Kompatibilitäts-Bucket der Provider-Familie für gemeinsame Anfragehelfer.              |
| `openAICompletions`   | `object`     | Anfrage-Flags für OpenAI-kompatible Completions, derzeit `supportsStreamingUsage`.                |

## modelPricing-Referenz

Verwenden Sie `modelPricing`, wenn ein Provider Control-Plane-Preisverhalten benötigt, bevor die Runtime geladen wird. Der Gateway-Preiscache liest diese Metadaten, ohne Provider-Runtime-Code zu importieren.

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

| Feld         | Typ               | Bedeutung                                                                                                  |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Setzen Sie `false` für lokale/selbst gehostete Provider, die niemals OpenRouter- oder LiteLLM-Preise abrufen sollen. |
| `openRouter` | `false \| object` | Zuordnung für die OpenRouter-Preissuche. `false` deaktiviert die OpenRouter-Suche für diesen Provider.     |
| `liteLLM`    | `false \| object` | Zuordnung für die LiteLLM-Preissuche. `false` deaktiviert die LiteLLM-Suche für diesen Provider.           |

Quellfelder:

| Feld                       | Typ                | Bedeutung                                                                                                         |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe Katalog-Provider-ID, wenn sie von der OpenClaw-Provider-ID abweicht, zum Beispiel `z-ai` für einen `zai`-Provider. |
| `passthroughProviderModel` | `boolean`          | Behandelt Modell-IDs mit Schrägstrich als verschachtelte Provider/Modell-Referenzen, nützlich für Proxy-Provider wie OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Zusätzliche Modell-ID-Varianten des externen Katalogs. `version-dots` versucht gepunktete Versions-IDs wie `claude-opus-4.6`. |

### OpenClaw Provider Index

Der OpenClaw Provider Index ist OpenClaw-eigene Vorschau-Metadaten für Provider, deren Plugins möglicherweise noch nicht installiert sind. Er ist nicht Teil eines Plugin-Manifests. Plugin-Manifeste bleiben die Autorität für installierte Plugins. Der Provider Index ist der interne Fallback-Vertrag, den zukünftige Oberflächen für installierbare Provider und Modell-Auswahl vor der Installation verwenden, wenn ein Provider-Plugin nicht installiert ist.

Reihenfolge der Katalogautorität:

1. Benutzerkonfiguration.
2. Installiertes Plugin-Manifest `modelCatalog`.
3. Modellkatalog-Cache aus explizitem Refresh.
4. Vorschauzeilen des OpenClaw Provider Index.

Der Provider Index darf keine Geheimnisse, keinen Aktivierungsstatus, keine Runtime-Hooks und keine Live-kontospezifischen Modelldaten enthalten. Seine Vorschaukataloge verwenden dieselbe `modelCatalog`-Provider-Zeilenform wie Plugin-Manifeste, sollten aber auf stabile Anzeigemetadaten beschränkt bleiben, sofern Runtime-Adapterfelder wie `api`, `baseUrl`, Preise oder Kompatibilitäts-Flags nicht absichtlich mit dem installierten Plugin-Manifest synchron gehalten werden. Provider mit Live-`/models`-Ermittlung sollten aktualisierte Zeilen über den expliziten Modellkatalog-Cache-Pfad schreiben, statt bei normalen Auflistungen oder beim Onboarding Provider-APIs aufzurufen.

Provider-Index-Einträge können außerdem Metadaten für installierbare Plugins für Provider enthalten, deren Plugin aus Core verschoben wurde oder aus anderen Gründen noch nicht installiert ist. Diese Metadaten spiegeln das Channel-Katalogmuster wider: Paketname, npm-Installationsspezifikation, erwartete Integrität und einfache Labels für Auth-Auswahl reichen aus, um eine installierbare Einrichtungsoption anzuzeigen. Sobald das Plugin installiert ist, gewinnt sein Manifest, und der Provider-Index-Eintrag für diesen Provider wird ignoriert.

Legacy-Top-Level-Capability-Schlüssel sind veraltet. Verwenden Sie `openclaw doctor --fix`, um `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; normales Laden von Manifesten behandelt diese Top-Level-Felder nicht mehr als Capability-Besitz.

## Manifest gegenüber package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Dafür verwenden                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Ermittlung, Konfigurationsvalidierung, Auth-Auswahl-Metadaten und UI-Hinweise, die existieren müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und der `openclaw`-Block für Entrypoints, Installations-Gating, Einrichtung oder Katalogmetadaten |

Wenn Sie unsicher sind, wohin ein Metadatum gehört, verwenden Sie diese Regel:

- Wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, legen Sie es in `openclaw.plugin.json` ab
- Wenn es um Paketierung, Entry-Dateien oder npm-Installationsverhalten geht, legen Sie es in `package.json` ab

### package.json-Felder, die die Ermittlung beeinflussen

Einige Pre-Runtime-Plugin-Metadaten befinden sich absichtlich in `package.json` unter dem `openclaw`-Block statt in `openclaw.plugin.json`.
`openclaw.bundle` und `openclaw.bundle.json` sind keine OpenClaw-Plugin-Verträge; native Plugins müssen `openclaw.plugin.json` plus die unten unterstützten `package.json#openclaw`-Felder verwenden.

Wichtige Beispiele:

| Feld                                                                                       | Bedeutung                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Deklariert native Plugin-Einstiegspunkte. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                                      |
| `openclaw.runtimeExtensions`                                                               | Deklariert gebaute JavaScript-Runtime-Einstiegspunkte für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                |
| `openclaw.setupEntry`                                                                      | Leichtgewichtiger, nur für die Einrichtung bestimmter Einstiegspunkt, der beim Onboarding, verzögerten Kanalstart und bei schreibgeschützter Kanalstatus-/SecretRef-Erkennung verwendet wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                                               | Deklariert den gebauten JavaScript-Einrichtungseinstiegspunkt für installierte Pakete. Erfordert `setupEntry`, muss vorhanden sein und muss innerhalb des Plugin-Paketverzeichnisses bleiben.        |
| `openclaw.channel`                                                                         | Günstige Kanalkatalog-Metadaten wie Bezeichnungen, Dokumentationspfade, Aliasse und Auswahltexte.                                                                                                     |
| `openclaw.channel.commands`                                                                | Statische native Befehls- und native Skill-Autostandard-Metadaten, die von Konfiguration, Audit und Befehlslisten-Oberflächen verwendet werden, bevor die Kanal-Runtime lädt.                       |
| `openclaw.channel.configuredState`                                                         | Leichtgewichtige Metadaten für die Prüfung des konfigurierten Zustands, die beantworten können, ob eine reine Env-Einrichtung bereits existiert, ohne die vollständige Kanal-Runtime zu laden.       |
| `openclaw.channel.persistedAuthState`                                                      | Leichtgewichtige Metadaten für die Prüfung des persistierten Authentifizierungszustands, die beantworten können, ob bereits eine Anmeldung vorhanden ist, ohne die vollständige Kanal-Runtime zu laden. |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installations-/Update-Hinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                                     |
| `openclaw.install.defaultChoice`                                                           | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                                      |
| `openclaw.install.minHostVersion`                                                          | Minimal unterstützte OpenClaw-Hostversion mit einer semver-Untergrenze wie `>=2026.3.22` oder `>=2026.5.1-beta.1`.                                                                                   |
| `openclaw.install.expectedIntegrity`                                                       | Erwartete npm-Dist-Integritätszeichenfolge wie `sha512-...`; Installations- und Update-Abläufe prüfen das abgerufene Artefakt dagegen.                                                              |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                                                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Ermöglicht das Laden rein einrichtungsbezogener Kanaloberflächen vor dem vollständigen Kanal-Plugin während des Starts.                                                                               |

Manifestmetadaten entscheiden, welche Provider-/Kanal-/Einrichtungsoptionen im
Onboarding erscheinen, bevor die Runtime lädt. `package.json#openclaw.install` teilt dem
Onboarding mit, wie dieses Plugin abgerufen oder aktiviert wird, wenn der Benutzer eine dieser
Optionen auswählt. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-
Registrierung für nicht gebündelte Plugin-Quellen erzwungen. Ungültige Werte werden abgelehnt;
neuere, aber gültige Werte überspringen externe Plugins auf älteren Hosts. Gebündelte Quell-
Plugins gelten als mit dem Host-Checkout gleichversioniert.

Offizielle Metadaten für die Installation bei Bedarf sollten `clawhubSpec` verwenden, wenn das Plugin auf
ClawHub veröffentlicht ist; das Onboarding behandelt dies als bevorzugte Remote-Quelle und
zeichnet nach der Installation ClawHub-Artefaktfakten auf. `npmSpec` bleibt der Kompatibilitäts-
Fallback für Pakete, die noch nicht zu ClawHub gewechselt sind.

Exakte npm-Versionsfixierung befindet sich bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalogeinträge
sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Update-Abläufe
geschlossen fehlschlagen, wenn das abgerufene npm-Artefakt nicht mehr zur fixierten Version passt.
Interaktives Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige Registry-
npm-Spezifikationen an, einschließlich bloßer Paketnamen und Dist-Tags. Katalogdiagnosen können
zwischen exakten, schwebenden, integritätsfixierten, fehlende-Integrität-, Paketnamen-
Abweichungs- und ungültigen Standardauswahl-Quellen unterscheiden. Sie warnen außerdem, wenn
`expectedIntegrity` vorhanden ist, aber keine gültige npm-Quelle existiert, die es fixieren kann.
Wenn `expectedIntegrity` vorhanden ist,
erzwingen Installations-/Update-Abläufe dies; wenn es fehlt, wird die Registry-Auflösung ohne
Integritätsfixierung aufgezeichnet.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status-, Kanallisten-
oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige
Runtime zu laden. Der Einrichtungseinstiegspunkt sollte Kanalmetadaten sowie einrichtungssichere
Adapter für Konfiguration, Status und Secrets bereitstellen; belassen Sie Netzwerkclients,
Gateway-Listener und Transport-Runtimes im Haupteinstiegspunkt der Erweiterung.

Runtime-Einstiegspunktfelder überschreiben keine Paketgrenzenprüfungen für Quell-
Einstiegspunktfelder. Zum Beispiel kann `openclaw.runtimeExtensions` keinen ausbrechenden
`openclaw.extensions`-Pfad ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es macht
nicht beliebige defekte Konfigurationen installierbar. Derzeit erlaubt es Installationsabläufen nur,
sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa einem
fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten `channels.<id>`-Eintrag für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die Installation und verweisen
Operatoren auf `openclaw doctor --fix`.

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

Verwenden Sie es, wenn Einrichtung, Doctor, Status oder schreibgeschützte Präsenzabläufe eine günstige
Ja/Nein-Authentifizierungsprüfung benötigen, bevor das vollständige Kanal-Plugin lädt. Persistierter Authentifizierungszustand ist
kein konfigurierter Kanalzustand: Verwenden Sie diese Metadaten nicht, um Plugins automatisch zu aktivieren,
Runtime-Abhängigkeiten zu reparieren oder zu entscheiden, ob eine Kanal-Runtime laden soll.
Der Ziel-Export sollte eine kleine Funktion sein, die nur persistierten Zustand liest; leiten
Sie ihn nicht durch das vollständige Kanal-Runtime-Barrel.

`openclaw.channel.configuredState` folgt derselben Form für günstige reine Env-
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

Verwenden Sie es, wenn ein Kanal den konfigurierten Zustand aus Env oder anderen kleinen
Nicht-Runtime-Eingaben beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung oder die echte
Kanal-Runtime benötigt, belassen Sie diese Logik stattdessen im Plugin-Hook `config.hasConfiguredState`.

## Erkennungspriorität (doppelte Plugin-IDs)

OpenClaw erkennt Plugins aus mehreren Wurzeln (gebündelt, globale Installation, Workspace, explizite in der Konfiguration ausgewählte Pfade). Wenn zwei Erkennungen dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Priorität** behalten; Duplikate mit niedrigerer Priorität werden verworfen, statt daneben geladen zu werden.

Priorität, von der höchsten zur niedrigsten:

1. **Konfigurationsausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` fixiert ist
2. **Gebündelt** — mit OpenClaw ausgelieferte Plugins
3. **Globale Installation** — Plugins, die in der globalen OpenClaw-Plugin-Wurzel installiert sind
4. **Workspace** — relativ zum aktuellen Workspace erkannte Plugins

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich durch ein lokales zu überschreiben, fixieren Sie es über `plugins.entries.<id>`, damit es durch Priorität gewinnt, statt sich auf Workspace-Erkennung zu verlassen.
- Verworfene Duplikate werden protokolliert, damit Doctor und Startdiagnosen auf die verworfene Kopie verweisen können.
- Konfigurationsausgewählte Duplikatüberschreibungen werden in Diagnosen als explizite Überschreibungen formuliert, warnen aber weiterhin, damit veraltete Forks und versehentliche Überschattungen sichtbar bleiben.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema ausliefern**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist akzeptabel (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Runtime.
- Wenn Sie ein gebündeltes Plugin mit neuen Konfigurationsschlüsseln erweitern oder forken, aktualisieren Sie gleichzeitig das `configSchema` dieses Plugins in `openclaw.plugin.json`. Schemas gebündelter Plugins sind strikt, daher wird das Hinzufügen von `plugins.entries.<id>.config.myNewKey` in der Benutzerkonfiguration ohne Hinzufügen von `myNewKey` zu `configSchema.properties` abgelehnt, bevor die Plugin-Runtime lädt.

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

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, es sei denn, die Kanal-ID wird durch
  ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **erkennbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration vorhanden ist, das Plugin aber **deaktiviert** ist, wird die Konfiguration beibehalten und
  eine **Warnung** in Doctor und Protokollen angezeigt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration) für das vollständige `plugins.*`-Schema.

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge. Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der Erkennung und Validierung.
- Native Manifeste werden mit JSON5 geparst, sodass Kommentare, nachgestellte Kommas und nicht in Anführungszeichen gesetzte Schlüssel akzeptiert werden, solange der endgültige Wert weiterhin ein Objekt ist.
- Der Manifest-Loader liest nur dokumentierte Manifestfelder. Vermeiden Sie benutzerdefinierte Top-Level-Schlüssel.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerDiscoveryEntry` muss schlank bleiben und sollte keinen breiten Laufzeitcode importieren; verwenden Sie es für statische Provider-Katalogmetadaten oder schmale Erkennungsdeskriptoren, nicht für die Ausführung zur Anfragezeit.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory`, `kind: "context-engine"` über `plugins.slots.contextEngine` (Standard `legacy`).
- Deklarieren Sie die exklusive Plugin-Art in diesem Manifest. `OpenClawPluginDefinition.kind` im Laufzeit-Einstieg ist veraltet und bleibt nur als Kompatibilitäts-Fallback für ältere Plugins erhalten.
- Metadaten zu Umgebungsvariablen (`setup.providers[].envVars`, veraltete `providerAuthEnvVars` und `channelEnvVars`) sind rein deklarativ. Status, Audit, Validierung der Cron-Zustellung und andere schreibgeschützte Oberflächen wenden weiterhin die Plugin-Vertrauensstellung und die effektive Aktivierungsrichtlinie an, bevor sie eine Umgebungsvariable als konfiguriert behandeln.
- Laufzeit-Wizard-Metadaten, die Provider-Code erfordern, finden Sie unter [Provider-Laufzeit-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
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
    Plugin-SDK-Referenz und Subpath-Imports.
  </Card>
</CardGroup>
