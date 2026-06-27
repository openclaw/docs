---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Validierungsfehler von Plugins debuggen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-06-27T17:49:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

Diese Seite gilt ausschließlich für das **native OpenClaw-Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout
  ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch nicht
gegen das hier beschriebene `openclaw.plugin.json`-Schema validiert.

Bei kompatiblen Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte
Skill-Roots, Claude-Befehls-Roots, Standardwerte aus `settings.json` des Claude-Bundles,
Claude-Bundle-LSP-Standardwerte und unterstützte Hook-Packs, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** ausliefern. OpenClaw verwendet dieses Manifest, um die Konfiguration
**ohne Ausführung von Plugin-Code** zu validieren. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe den vollständigen Leitfaden zum Plugin-System: [Plugins](/de/tools/plugin).
Für das native Capability-Modell und die aktuelle Anleitung zur externen Kompatibilität:
[Capability-Modell](/de/plugins/architecture#public-capability-model).

## Was diese Datei bewirkt

`openclaw.plugin.json` ist die Metadaten-Datei, die OpenClaw liest, **bevor Ihr
Plugin-Code geladen wird**. Alles unten Genannte muss sich mit geringem Aufwand prüfen lassen, ohne die
Plugin-Laufzeit zu starten.

**Verwenden Sie sie für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurations-UI
- Authentifizierung, Onboarding und Setup-Metadaten (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Authentifizierungsoptionen)
- Aktivierungshinweise für Control-Plane-Oberflächen
- Kurzform-Besitz von Modellfamilien
- statische Snapshots der Capability-Zuständigkeit (`contracts`)
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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

## Referenz der Top-Level-Felder

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                                         |
| ------------------------------------ | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                                              |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                                          |
| `requiresPlugins`                    | Nein         | `string[]`                       | Plugin-IDs, die ebenfalls installiert sein müssen, damit dieses Plugin eine Wirkung hat. Die Erkennung hält das Plugin ladbar, warnt aber, wenn ein erforderliches Plugin fehlt.                                                                  |
| `enabledByDefault`                   | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg, oder setzen Sie einen beliebigen Nicht-`true`-Wert, um das Plugin standardmäßig deaktiviert zu lassen.                                                            |
| `enabledByDefaultOnPlatforms`        | Nein         | `string[]`                       | Markiert ein gebündeltes Plugin nur auf den aufgeführten Node.js-Plattformen als standardmäßig aktiviert, zum Beispiel `["darwin"]`. Explizite Konfiguration hat weiterhin Vorrang.                                                              |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Legacy-IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modell-Refs sie erwähnen.                                                                                                                            |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                                   |
| `channels`                           | Nein         | `string[]`                       | Channel-IDs, die diesem Plugin gehören. Wird für Erkennung und Konfigurationsvalidierung verwendet.                                                                                                                                               |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                                          |
| `providerCatalogEntry`               | Nein         | `string`                         | Leichtgewichtiger Provider-Katalog-Modulpfad relativ zum Plugin-Root für manifestbezogene Provider-Katalogmetadaten, die geladen werden können, ohne die vollständige Plugin-Laufzeit zu aktivieren.                                             |
| `modelSupport`                       | Nein         | `object`                         | Manifestverwaltete Kurzform-Metadaten zur Modellfamilie, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                                                               |
| `modelCatalog`                       | Nein         | `object`                         | Deklarative Modellkatalog-Metadaten für Provider, die diesem Plugin gehören. Dies ist der Control-Plane-Vertrag für künftige schreibgeschützte Auflistung, Onboarding, Modellauswahlen, Aliase und Unterdrückung ohne Laden der Plugin-Laufzeit. |
| `modelPricing`                       | Nein         | `object`                         | Providerverwaltete externe Preisabfrage-Richtlinie. Verwenden Sie sie, um lokale/selbst gehostete Provider von Remote-Preiskatalogen auszunehmen oder Provider-Refs OpenRouter/LiteLLM-Katalog-IDs zuzuordnen, ohne Provider-IDs im Core hartzucodieren. |
| `modelIdNormalization`               | Nein         | `object`                         | Providerverwaltete Modell-ID-Alias-/Präfixbereinigung, die vor dem Laden der Provider-Laufzeit ausgeführt werden muss.                                                                                                                           |
| `providerEndpoints`                  | Nein         | `object[]`                       | Manifestverwaltete Metadaten zu Endpoint-Host/baseUrl für Provider-Routen, die der Core klassifizieren muss, bevor die Provider-Laufzeit lädt.                                                                                                    |
| `providerRequest`                    | Nein         | `object`                         | Günstige Metadaten zu Provider-Familie und Anfragekompatibilität, die von der generischen Anfrage-Richtlinie verwendet werden, bevor die Provider-Laufzeit lädt.                                                                                  |
| `secretProviderIntegrations`         | Nein         | `Record<string, object>`         | Deklarative SecretRef-Exec-Provider-Voreinstellungen, die Setup- oder Installationsoberflächen anbieten können, ohne providerspezifische Integrationen im Core hartzucodieren.                                                                    |
| `cliBackends`                        | Nein         | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Wird für automatische Startaktivierung aus expliziten Konfigurations-Refs verwendet.                                                                                                         |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Refs, deren pluginverwalteter synthetischer Auth-Hook während der kalten Modellerkennung vor dem Laden der Laufzeit geprüft werden soll.                                                                               |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalter-API-Schlüsselwerte, die einem gebündelten Plugin gehören und nicht geheime lokale, OAuth- oder Umgebungs-Anmeldedatenzustände darstellen.                                                                                             |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen, bevor die Laufzeit lädt.                                                                                                            |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Veraltete Kompatibilitäts-Env-Metadaten für Provider-Auth-/Statussuche. Bevorzugen Sie `setup.providers[].envVars` für neue Plugins; OpenClaw liest dies während des Deprecation-Zeitfensters weiterhin.                                        |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die für die Auth-Suche eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der den API-Schlüssel und die Auth-Profile des Basis-Providers teilt.                                                      |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Günstige Channel-Env-Metadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuerte Channel-Einrichtung oder Auth-Oberflächen, die generische Start-/Konfigurationshelfer sehen sollen.                   |
| `providerAuthChoices`                | Nein         | `object[]`                       | Günstige Auth-Auswahl-Metadaten für Onboarding-Auswahlen, Auflösung bevorzugter Provider und einfache CLI-Flag-Verdrahtung.                                                                                                                      |
| `activation`                         | Nein         | `object`                         | Günstige Aktivierungsplaner-Metadaten für Start, Provider, Befehl, Channel, Route und durch Fähigkeiten ausgelöstes Laden. Nur Metadaten; die Plugin-Laufzeit besitzt weiterhin das tatsächliche Verhalten.                                      |
| `setup`                              | Nein         | `object`                         | Günstige Setup-/Onboarding-Deskriptoren, die Erkennungs- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                                                 |
| `qaRunners`                          | Nein         | `object[]`                       | Günstige QA-Runner-Deskriptoren, die vom gemeinsamen `openclaw qa`-Host verwendet werden, bevor die Plugin-Laufzeit lädt.                                                                                                                        |
| `contracts`                          | Nein         | `object`                         | Statischer Snapshot der Fähigkeitszuständigkeit für externe Auth-Hooks, Embeddings, Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bilderzeugung, Musikerzeugung, Videoerzeugung, Web-Fetch, Websuche und Tool-Zuständigkeit. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Günstige Medienverständnis-Standardwerte für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                                       |
| `imageGenerationProviderMetadata`    | Nein         | `Record<string, object>`         | Günstige Bilderzeugungs-Auth-Metadaten für Provider-IDs, die in `contracts.imageGenerationProviders` deklariert sind, einschließlich providerverwalteter Auth-Aliase und Base-URL-Guards.                                                       |
| `videoGenerationProviderMetadata`    | Nein         | `Record<string, object>`         | Günstige Videoerzeugungs-Auth-Metadaten für Provider-IDs, die in `contracts.videoGenerationProviders` deklariert sind, einschließlich providerverwalteter Auth-Aliase und Base-URL-Guards.                                                      |
| `musicGenerationProviderMetadata`    | Nein         | `Record<string, object>`         | Günstige Musikerzeugungs-Auth-Metadaten für Provider-IDs, die in `contracts.musicGenerationProviders` deklariert sind, einschließlich providerverwalteter Auth-Aliase und Base-URL-Guards.                                                      |
| `toolMetadata`                       | Nein     | `Record<string, object>`         | Günstige Verfügbarkeitsmetadaten für Plugin-eigene Tools, die in `contracts.tools` deklariert sind. Verwenden Sie sie, wenn ein Tool die Laufzeit nur laden soll, wenn Konfigurations-, Umgebungs- oder Authentifizierungsnachweise vorhanden sind.                                                                       |
| `channelConfigs`                     | Nein     | `Record<string, object>`         | Manifest-eigene Kanal-Konfigurationsmetadaten, die vor dem Laden der Laufzeit in Erkennungs- und Validierungsoberflächen zusammengeführt werden.                                                                                                                                      |
| `skills`                             | Nein     | `string[]`                       | Zu ladende Skill-Verzeichnisse, relativ zum Plugin-Stammverzeichnis.                                                                                                                                                                                         |
| `name`                               | Nein     | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                                                     |
| `description`                        | Nein     | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                                                         |
| `icon`                               | Nein     | `string`                         | HTTPS-Bild-URL für Marketplace-/Katalogkarten. ClawHub akzeptiert jede gültige `https://`-URL und greift auf das Standard-Plugin-Symbol zurück, wenn dies ausgelassen wird oder ungültig ist.                                                                              |
| `version`                            | Nein     | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                                   |
| `uiHints`                            | Nein     | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Vertraulichkeitshinweise für Konfigurationsfelder.                                                                                                                                                                               |

## Referenz für Metadaten von Generierungs-Providern

Die Metadatenfelder für Generierungs-Provider beschreiben statische Auth-Signale für
Provider, die in der passenden Liste `contracts.*GenerationProviders` deklariert sind.
OpenClaw liest diese Felder, bevor die Provider-Laufzeit geladen wird, damit Core-Tools
entscheiden können, ob ein Generierungs-Provider verfügbar ist, ohne jedes
Provider-Plugin zu importieren.

Verwenden Sie diese Felder nur für günstige, deklarative Fakten. Transport, Request-
Transformationen, Token-Aktualisierung, Anmeldedatenvalidierung und das tatsächliche
Generierungsverhalten bleiben in der Plugin-Laufzeit.

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

| Feld                   | Erforderlich | Typ        | Bedeutung                                                                                                                                                      |
| ---------------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Nein         | `string[]` | Zusätzliche Provider-IDs, die als statische Auth-Aliasse für den Generierungs-Provider zählen sollen.                                                          |
| `authProviders`        | Nein         | `string[]` | Provider-IDs, deren konfigurierte Auth-Profile als Auth für diesen Generierungs-Provider zählen sollen.                                                        |
| `configSignals`        | Nein         | `object[]` | Günstige, nur konfigurationsbasierte Verfügbarkeitssignale für lokale oder selbst gehostete Provider, die ohne Auth-Profile oder Umgebungsvariablen konfiguriert werden können. |
| `authSignals`          | Nein         | `object[]` | Explizite Auth-Signale. Wenn vorhanden, ersetzen sie den Standardsignalsatz aus Provider-ID, `aliases` und `authProviders`.                                    |
| `referenceAudioInputs` | Nein         | `boolean`  | Nur Videogenerierung. Setzen Sie dies auf `true`, wenn der Provider Referenz-Audioassets akzeptiert; andernfalls blendet `video_generate` Audio-Referenzparameter aus. |

Jeder `configSignals`-Eintrag unterstützt:

| Feld             | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                   |
| ---------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Ja           | `string`   | Punktpfad zum Plugin-eigenen Konfigurationsobjekt, das geprüft werden soll, zum Beispiel `plugins.entries.example.config`.                                                                  |
| `overlayPath`    | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objekt das Stammobjekt überlagern soll, bevor das Signal ausgewertet wird. Verwenden Sie dies für fähigkeitsspezifische Konfigurationen wie `image`, `video` oder `music`. |
| `overlayMapPath` | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objektwerte jeweils das Stammobjekt überlagern sollen. Verwenden Sie dies für benannte Account-Maps wie `accounts`, bei denen jedes konfigurierte Konto ausreichen soll. |
| `required`       | Nein         | `string[]` | Punktpfade innerhalb der wirksamen Konfiguration, die konfigurierte Werte haben müssen. Strings dürfen nicht leer sein; Objekte und Arrays dürfen nicht leer sein.                           |
| `requiredAny`    | Nein         | `string[]` | Punktpfade innerhalb der wirksamen Konfiguration, bei denen mindestens einer einen konfigurierten Wert haben muss.                                                                           |
| `mode`           | Nein         | `object`   | Optionaler String-Modus-Guard innerhalb der wirksamen Konfiguration. Verwenden Sie dies, wenn rein konfigurationsbasierte Verfügbarkeit nur für einen Modus gilt.                           |

Jeder `mode`-Guard unterstützt:

| Feld         | Erforderlich | Typ        | Bedeutung                                                                                                      |
| ------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `path`       | Nein         | `string`   | Punktpfad innerhalb der wirksamen Konfiguration. Standard ist `mode`.                                          |
| `default`    | Nein         | `string`   | Moduswert, der verwendet wird, wenn die Konfiguration den Pfad auslässt.                                       |
| `allowed`    | Nein         | `string[]` | Falls vorhanden, besteht das Signal nur, wenn der wirksame Modus einer dieser Werte ist.                       |
| `disallowed` | Nein         | `string[]` | Falls vorhanden, schlägt das Signal fehl, wenn der wirksame Modus einer dieser Werte ist.                      |

Jeder `authSignals`-Eintrag unterstützt:

| Feld              | Erforderlich | Typ      | Bedeutung                                                                                                                                                              |
| ----------------- | ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string` | Provider-ID, die in konfigurierten Auth-Profilen geprüft werden soll.                                                                                                  |
| `providerBaseUrl` | Nein         | `object` | Optionaler Guard, durch den das Signal nur zählt, wenn der referenzierte konfigurierte Provider eine zulässige Basis-URL verwendet. Verwenden Sie dies, wenn ein Auth-Alias nur für bestimmte APIs gültig ist. |

Jeder `providerBaseUrl`-Guard unterstützt:

| Feld              | Erforderlich | Typ        | Bedeutung                                                                                                                                      |
| ----------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string`   | Provider-Konfigurations-ID, deren `baseUrl` geprüft werden soll.                                                                               |
| `defaultBaseUrl`  | Nein         | `string`   | Basis-URL, die angenommen wird, wenn die Provider-Konfiguration `baseUrl` auslässt.                                                            |
| `allowedBaseUrls` | Ja           | `string[]` | Zulässige Basis-URLs für dieses Auth-Signal. Das Signal wird ignoriert, wenn die konfigurierte oder standardmäßige Basis-URL keinem dieser normalisierten Werte entspricht. |

## Referenz für Tool-Metadaten

`toolMetadata` verwendet dieselben Formen für `configSignals` und `authSignals` wie
Metadaten von Generierungs-Providern, indiziert nach Tool-Name. `contracts.tools` deklariert
die Zuständigkeit. `toolMetadata` deklariert günstige Verfügbarkeitsnachweise, damit OpenClaw
vermeiden kann, eine Plugin-Laufzeit zu importieren, nur damit deren Tool-Factory `null` zurückgibt.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
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

Wenn ein Tool keine `toolMetadata` hat, behält OpenClaw das bestehende Verhalten bei und
lädt das zuständige Plugin, wenn der Tool-Vertrag zur Richtlinie passt. Für Hot-Path-
Tools, deren Factory von Auth/Konfiguration abhängt, sollten Plugin-Autoren
`toolMetadata` deklarieren, anstatt Core die Laufzeit importieren zu lassen, um nachzufragen.

## providerAuthChoices-Referenz

Jeder `providerAuthChoices`-Eintrag beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.
Provider-Einrichtungslisten verwenden diese Manifest-Auswahlen, aus Deskriptoren abgeleitete
Einrichtungsauswahlen und Installationskatalog-Metadaten, ohne die Provider-Laufzeit zu laden.

| Feld                  | Erforderlich | Typ                                                                   | Bedeutung                                                                                                                        |
| --------------------- | ------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                                              | Provider-ID, zu der diese Auswahl gehört.                                                                                        |
| `method`              | Ja           | `string`                                                              | Auth-Methoden-ID, an die weitergeleitet wird.                                                                                    |
| `choiceId`            | Ja           | `string`                                                              | Stabile Auth-Auswahl-ID, die von Onboarding- und CLI-Flows verwendet wird.                                                       |
| `choiceLabel`         | Nein         | `string`                                                              | Benutzerseitiges Label. Wenn nicht angegeben, fällt OpenClaw auf `choiceId` zurück.                                             |
| `choiceHint`          | Nein         | `string`                                                              | Kurzer Hilfetext für die Auswahl.                                                                                                |
| `assistantPriority`   | Nein         | `number`                                                              | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlmenüs früher sortiert.                                    |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                                        | Blendet die Auswahl in Assistenten-Auswahlmenüs aus, erlaubt aber weiterhin die manuelle CLI-Auswahl.                           |
| `deprecatedChoiceIds` | Nein         | `string[]`                                                            | Legacy-Auswahl-IDs, die Benutzer zu dieser Ersatzauswahl umleiten sollen.                                                       |
| `groupId`             | Nein         | `string`                                                              | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlen.                                                                       |
| `groupLabel`          | Nein         | `string`                                                              | Benutzerseitiges Label für diese Gruppe.                                                                                        |
| `groupHint`           | Nein         | `string`                                                              | Kurzer Hilfetext für die Gruppe.                                                                                                |
| `optionKey`           | Nein         | `string`                                                              | Interner Optionsschlüssel für einfache Auth-Flows mit einem Flag.                                                               |
| `cliFlag`             | Nein         | `string`                                                              | CLI-Flag-Name, etwa `--openrouter-api-key`.                                                                                     |
| `cliOption`           | Nein         | `string`                                                              | Vollständige CLI-Optionsform, etwa `--openrouter-api-key <key>`.                                                                |
| `cliDescription`      | Nein         | `string`                                                              | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                                              |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Onboarding-Oberflächen, in denen diese Auswahl erscheinen soll. Wenn nicht angegeben, ist der Standard `["text-inference"]`.    |

## commandAliases-Referenz

Verwenden Sie `commandAliases`, wenn ein Plugin einen Runtime-Befehlsnamen besitzt, den Benutzer
versehentlich in `plugins.allow` eintragen oder als Root-CLI-Befehl ausführen könnten. OpenClaw
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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                       |
| ------------ | ------------ | ----------------- | ------------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                       |
| `kind`       | Nein         | `"runtime-slash"` | Markiert den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.             |
| `cliCommand` | Nein         | `string`          | Verwandter Root-CLI-Befehl, der für CLI-Vorgänge vorgeschlagen wird, falls vorhanden. |

## activation-Referenz

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Control-Plane-Ereignisse
es in einen Aktivierungs-/Ladeplan aufnehmen sollen.

Dieser Block ist Planer-Metadaten, keine Lifecycle-API. Er registriert kein
Runtime-Verhalten, ersetzt nicht `register(...)` und verspricht nicht, dass
Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um
Kandidaten-Plugins einzugrenzen, bevor er auf vorhandene Manifest-Ownership-Metadaten
wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks zurückfällt.

Bevorzugen Sie die engsten Metadaten, die Ownership bereits beschreiben. Verwenden Sie
`providers`, `channels`, `commandAliases`, Setup-Deskriptoren oder `contracts`,
wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planer-
Hinweise, die nicht durch diese Ownership-Felder dargestellt werden können.
Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Runtime-Aliasse wie `claude-cli`,
`my-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist nur für
eingebettete Agent-Harness-IDs gedacht, die noch kein Ownership-Feld haben.

Dieser Block enthält nur Metadaten. Er registriert kein Runtime-Verhalten und ersetzt
nicht `register(...)`, `setupEntry` oder andere Runtime-/Plugin-Einstiegspunkte.
Aktuelle Verbraucher verwenden ihn als Eingrenzungshinweis vor breiterem Plugin-Laden, daher
kostet fehlende Nicht-Startup-Aktivierungsmetadaten in der Regel nur Performance; sie
sollten die Korrektheit nicht ändern, solange Manifest-Ownership-Fallbacks weiterhin existieren.

Jedes Plugin sollte `activation.onStartup` bewusst setzen. Setzen Sie es nur dann auf `true`,
wenn das Plugin beim Gateway-Start ausgeführt werden muss. Setzen Sie es auf `false`, wenn
das Plugin beim Start inaktiv ist und nur durch engere Trigger geladen werden soll.
Das Weglassen von `onStartup` lädt das Plugin nicht mehr implizit beim Start; verwenden Sie explizite
Aktivierungsmetadaten für Startup-, Channel-, Config-, Agent-Harness-, Memory- oder
andere engere Aktivierungs-Trigger.

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

| Feld               | Erforderlich | Typ                                                  | Bedeutung                                                                                                                                                                                              |
| ------------------ | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Nein         | `boolean`                                            | Explizite Gateway-Startup-Aktivierung. Jedes Plugin sollte dies setzen. `true` importiert das Plugin beim Start; `false` hält es startup-lazy, sofern kein anderer passender Trigger das Laden erfordert. |
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                           |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Eingebettete Agent-Harness-Runtime-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliasse.                         |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                            |
| `onChannels`       | Nein         | `string[]`                                           | Channel-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                            |
| `onRoutes`         | Nein         | `string[]`                                           | Route-Arten, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                            |
| `onConfigPaths`    | Nein         | `string[]`                                           | Root-relative Config-Pfade, die dieses Plugin in Startup-/Ladepläne aufnehmen sollen, wenn der Pfad vorhanden und nicht explizit deaktiviert ist.                                                       |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Capability-Hinweise, die von der Control-Plane-Aktivierungsplanung verwendet werden. Bevorzugen Sie nach Möglichkeit engere Felder.                                                            |

Aktuelle Live-Verbraucher:

- Die Gateway-Startup-Planung verwendet `activation.onStartup` für expliziten Startup-
  Import
- Die befehlsgesteuerte CLI-Planung fällt auf Legacy-
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Die Agent-Runtime-Startup-Planung verwendet `activation.onAgentHarnesses` für
  eingebettete Harnesses und `cliBackends[]` auf oberster Ebene für CLI-Runtime-Aliasse
- Die channelgesteuerte Setup-/Channel-Planung fällt auf Legacy-`channels[]`-
  Ownership zurück, wenn explizite Channel-Aktivierungsmetadaten fehlen
- Die Startup-Plugin-Planung verwendet `activation.onConfigPaths` für Nicht-Channel-Root-
  Config-Oberflächen wie den `browser`-Block des gebündelten Browser-Plugins
- Die providergesteuerte Setup-/Runtime-Planung fällt auf Legacy-
  `providers[]` und `cliBackends[]`-Ownership auf oberster Ebene zurück, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

Planer-Diagnosen können explizite Aktivierungshinweise von Manifest-
Ownership-Fallbacks unterscheiden. Beispielsweise bedeutet `activation-command-hint`, dass
`activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der
Planer stattdessen `commandAliases`-Ownership verwendet hat. Diese Begründungslabels dienen
Host-Diagnosen und Tests; Plugin-Autoren sollten weiterhin die Metadaten deklarieren,
die Ownership am besten beschreiben.

## qaRunners-Referenz

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb
des gemeinsamen `openclaw qa`-Roots beiträgt. Halten Sie diese Metadaten günstig und statisch; die Plugin-
Runtime besitzt weiterhin die tatsächliche CLI-Registrierung über eine leichtgewichtige
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

| Feld          | Erforderlich | Typ      | Bedeutung                                                                   |
| ------------- | ------------ | -------- | --------------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl unterhalb von `openclaw qa`, zum Beispiel `matrix`.             |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

## setup-Referenz

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen günstige Plugin-eigene Metadaten benötigen,
bevor die Runtime geladen wird.

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
Backends. `setup.cliBackends` ist die setup-spezifische Deskriptoroberfläche für
Control-Plane-/Setup-Abläufe, die ausschließlich metadatenbasiert bleiben sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
deskriptorbasierte Lookup-Oberfläche für die Setup-Erkennung. Wenn der Deskriptor nur
das Kandidaten-Plugin eingrenzt und das Setup weiterhin umfangreichere Runtime-Hooks zur
Setup-Zeit benötigt, setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als
Fallback-Ausführungspfad bei.

OpenClaw bezieht `setup.providers[].envVars` auch in generische Provider-Auth- und
Env-Var-Lookups ein. `providerAuthEnvVars` bleibt während des Deprecation-Fensters über
einen Kompatibilitätsadapter unterstützt, aber nicht gebündelte Plugins, die es weiterhin
verwenden, erhalten eine Manifest-Diagnose. Neue Plugins sollten Setup-/Status-Env-Metadaten
in `setup.providers[].envVars` ablegen.

OpenClaw kann einfache Setup-Auswahlen auch aus `setup.providers[].authMethods` ableiten,
wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false`
deklariert, dass keine Setup-Runtime erforderlich ist. Explizite `providerAuthChoices`-Einträge
bleiben für benutzerdefinierte Labels, CLI-Flags, Onboarding-Scope und Assistentenmetadaten
bevorzugt.

Setzen Sie `requiresRuntime: false` nur, wenn diese Deskriptoren für die
Setup-Oberfläche ausreichen. OpenClaw behandelt explizites `false` als reinen
Deskriptorvertrag und führt `setup-api` oder `openclaw.setupEntry` nicht für den
Setup-Lookup aus. Wenn ein deskriptorbasiertes Plugin dennoch einen dieser
Setup-Runtime-Einträge ausliefert, meldet OpenClaw eine additive Diagnose und ignoriert
ihn weiterhin. Ein ausgelassenes `requiresRuntime` behält das Legacy-Fallback-Verhalten bei,
damit vorhandene Plugins, die Deskriptoren ohne das Flag hinzugefügt haben, nicht brechen.

Da der Setup-Lookup Plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte
Werte für `setup.providers[].id` und `setup.cliBackends[]` über erkannte Plugins hinweg
eindeutig bleiben. Mehrdeutige Zuständigkeit schlägt geschlossen fehl, statt einen Gewinner
aus der Erkennungsreihenfolge auszuwählen.

Wenn die Setup-Runtime ausgeführt wird, melden Setup-Registry-Diagnosen Deskriptorabweichungen,
wenn `setup-api` einen Provider oder ein CLI-Backend registriert, das die Manifest-Deskriptoren
nicht deklarieren, oder wenn ein Deskriptor keine passende Runtime-Registrierung hat.
Diese Diagnosen sind additiv und lehnen Legacy-Plugins nicht ab.

### Referenz zu setup.providers

| Feld           | Erforderlich | Typ        | Bedeutung                                                                                              |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `id`           | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding verfügbar gemacht wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods`  | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Provider unterstützt, ohne die vollständige Runtime zu laden.     |
| `envVars`      | Nein         | `string[]` | Env Vars, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Runtime geladen wird. |
| `authEvidence` | Nein         | `object[]` | Günstige lokale Auth-Nachweisprüfungen für Provider, die sich über nicht geheime Marker authentifizieren können. |

`authEvidence` ist für Provider-eigene lokale Anmeldedatenmarker vorgesehen, die ohne
Laden von Runtime-Code geprüft werden können. Diese Prüfungen müssen günstig und lokal bleiben:
keine Netzwerkaufrufe, keine Keychain- oder Secret-Manager-Lesevorgänge, keine Shell-Befehle und keine
Provider-API-Probes.

Unterstützte Nachweiseinträge:

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                      |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja           | `string`   | Derzeit `local-file-with-env`.                                                                                 |
| `fileEnvVar`       | Nein         | `string`   | Env Var, die einen expliziten Pfad zur Anmeldedatendatei enthält.                                              |
| `fallbackPaths`    | Nein         | `string[]` | Lokale Pfade zu Anmeldedatendateien, die geprüft werden, wenn `fileEnvVar` fehlt oder leer ist. Unterstützt `${HOME}` und `${APPDATA}`. |
| `requiresAnyEnv`   | Nein         | `string[]` | Mindestens eine aufgeführte Env Var muss nicht leer sein, bevor der Nachweis gültig ist.                       |
| `requiresAllEnv`   | Nein         | `string[]` | Jede aufgeführte Env Var muss nicht leer sein, bevor der Nachweis gültig ist.                                  |
| `credentialMarker` | Ja           | `string`   | Nicht geheimer Marker, der zurückgegeben wird, wenn der Nachweis vorhanden ist.                                |
| `source`           | Nein         | `string`   | Benutzerseitiges Quelllabel für Auth-/Status-Ausgabe.                                                         |

### setup-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                              |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding verfügbar gemacht werden.                |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für deskriptorbasierten Setup-Lookup verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Config-Migrationen, die zur Setup-Oberfläche dieses Plugins gehören.                           |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach dem Deskriptor-Lookup weiterhin `setup-api`-Ausführung benötigt.                     |

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

| Feld          | Typ        | Bedeutung                                    |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Benutzerseitiges Feldlabel.                  |
| `help`        | `string`   | Kurzer Hilfetext.                            |
| `tags`        | `string[]` | Optionale UI-Tags.                           |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.             |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel.  |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.        |

## contracts-Referenz

Verwenden Sie `contracts` nur für statische Metadaten zur Capability-Zuständigkeit, die OpenClaw
lesen kann, ohne die Plugin-Runtime zu importieren.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Jede Liste ist optional:

| Feld                             | Typ        | Bedeutung                                                                                                                                    |
| -------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex-App-Server-Erweiterungs-Factory-IDs, derzeit `codex-app-server`.                                                                       |
| `agentToolResultMiddleware`      | `string[]` | Runtime-IDs, für die dieses Plugin Tool-Ergebnis-Middleware registrieren darf.                                                               |
| `trustedToolPolicies`            | `string[]` | Plugin-lokale vertrauenswürdige Pre-Tool-Policy-IDs, die ein installiertes Plugin registrieren darf. Gebündelte Plugins dürfen Policies ohne dieses Feld registrieren. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Auth-Profile diesem Plugin gehört.                                                                      |
| `embeddingProviders`             | `string[]` | Allgemeine Embedding-Provider-IDs, die diesem Plugin für wiederverwendbare Vektor-Embedding-Nutzung gehören, einschließlich Memory.           |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                                                                                              |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-Transcription-Provider-IDs, die diesem Plugin gehören.                                                                              |
| `realtimeVoiceProviders`         | `string[]` | Realtime-Voice-Provider-IDs, die diesem Plugin gehören.                                                                                      |
| `memoryEmbeddingProviders`       | `string[]` | Veraltete Memory-spezifische Embedding-Provider-IDs, die diesem Plugin gehören.                                                              |
| `mediaUnderstandingProviders`    | `string[]` | Media-Understanding-Provider-IDs, die diesem Plugin gehören.                                                                                 |
| `transcriptSourceProviders`      | `string[]` | Transkriptquellen-Provider-IDs, die diesem Plugin gehören.                                                                                   |
| `imageGenerationProviders`       | `string[]` | Bildgenerierungs-Provider-IDs, die diesem Plugin gehören.                                                                                    |
| `videoGenerationProviders`       | `string[]` | Videogenerierungs-Provider-IDs, die diesem Plugin gehören.                                                                                   |
| `webFetchProviders`              | `string[]` | Web-Fetch-Provider-IDs, die diesem Plugin gehören.                                                                                           |
| `webSearchProviders`             | `string[]` | Web-Search-Provider-IDs, die diesem Plugin gehören.                                                                                          |
| `migrationProviders`             | `string[]` | Import-Provider-IDs, die diesem Plugin für `openclaw migrate` gehören.                                                                       |
| `gatewayMethodDispatch`          | `string[]` | Reservierte Berechtigung für authentifizierte Plugin-HTTP-Routen, die Gateway-Methoden prozessintern dispatchen.                             |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin gehören.                                                                                            |

`contracts.embeddedExtensionFactories` bleibt für gebündelte Codex
App-Server-only-Erweiterungs-Factorys erhalten. Gebündelte Tool-Ergebnis-Transformationen sollten
stattdessen `contracts.agentToolResultMiddleware` deklarieren und sich mit
`api.registerAgentToolResultMiddleware(...)` registrieren. Installierte Plugins dürfen
dieselbe Middleware-Nahtstelle nur verwenden, wenn sie ausdrücklich aktiviert ist, und nur für Runtimes, die sie
in `contracts.agentToolResultMiddleware` deklarieren.

Installierte Plugins, die die Host-vertrauenswürdige Pre-Tool-Policy-Ebene benötigen, müssen
jede registrierte lokale ID in `contracts.trustedToolPolicies` deklarieren und ausdrücklich
aktiviert sein. Gebündelte Plugins behalten den bestehenden Trusted-Policy-Pfad, aber installierte
Plugins mit nicht deklarierten Policy-IDs werden vor der Registrierung abgelehnt. Policy-IDs
sind auf das registrierende Plugin begrenzt, daher dürfen zwei Plugins beide
`workflow-budget` deklarieren und registrieren; ein einzelnes Plugin darf dieselbe lokale ID nicht
zweimal registrieren.

Runtime-Registrierungen über `api.registerTool(...)` müssen `contracts.tools` entsprechen.
Die Tool-Erkennung verwendet diese Liste, um nur die Plugin-Runtimes zu laden, denen die
angeforderten Tools gehören können.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten
`contracts.externalAuthProviders` deklarieren; nicht deklarierte externe Auth-Hooks werden ignoriert.

Allgemeine Embedding-Provider sollten `contracts.embeddingProviders` für
jeden mit `api.registerEmbeddingProvider(...)` registrierten Adapter deklarieren. Verwenden Sie den
allgemeinen Contract für wiederverwendbare Vektorgenerierung, einschließlich Providern, die von
Memory-Suche genutzt werden. `contracts.memoryEmbeddingProviders` ist eine veraltete
Memory-spezifische Kompatibilität und bleibt nur erhalten, während bestehende Provider zur
generischen Embedding-Provider-Nahtstelle migrieren.

`contracts.gatewayMethodDispatch` akzeptiert derzeit
`"authenticated-request"`. Es ist ein API-Hygiene-Gate für native Plugin-HTTP-
Routen, die absichtlich Gateway-Control-Plane-Methoden prozessintern dispatchen, nicht
eine Sandbox gegen bösartige native Plugins. Verwenden Sie es nur für eng geprüfte
gebündelte/Operator-Oberflächen, die bereits Gateway-HTTP-Auth erfordern.

## Referenz zu mediaUnderstandingProviderMetadata

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Media-Understanding-Provider
Standardmodelle, Auto-Auth-Fallback-Priorität oder native Dokumentunterstützung hat, die
generische Core-Helfer vor dem Laden der Runtime benötigen. Schlüssel müssen auch in
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

| Feld                   | Typ                                 | Bedeutung                                                                            |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medienfunktionen, die dieser Provider bereitstellt.                                  |
| `defaultModels`        | `Record<string, string>`            | Capability-zu-Modell-Standardwerte, die verwendet werden, wenn die Config kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden beim automatischen anmeldeinformationsbasierten Provider-Fallback früher sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.                        |

## Referenz zu channelConfigs

Verwenden Sie `channelConfigs`, wenn ein Channel-Plugin günstige Config-Metadaten benötigt, bevor
die Runtime geladen wird. Read-only-Erkennung für Channel-Einrichtung/-Status kann diese Metadaten
direkt für konfigurierte externe Channels verwenden, wenn kein Einrichtungseintrag verfügbar ist oder
wenn `setup.requiresRuntime: false` deklariert, dass eine Einrichtungs-Runtime unnötig ist.

`channelConfigs` sind Plugin-Manifest-Metadaten, kein neuer Top-Level-Abschnitt der User-Config.
Benutzer konfigurieren Channel-Instanzen weiterhin unter `channels.<channel-id>`.
OpenClaw liest Manifest-Metadaten, um zu entscheiden, welchem Plugin dieser konfigurierte
Channel gehört, bevor Plugin-Runtime-Code ausgeführt wird.

Für ein Channel-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche
Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten auch passende
`channelConfigs`-Einträge deklarieren. Ohne sie kann OpenClaw das Plugin weiterhin laden, aber
Cold-Path-Config-Schema, Einrichtung und Control-UI-Oberflächen können die
Channel-eigene Optionsform erst kennen, wenn die Plugin-Runtime ausgeführt wird.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und
`nativeSkillsAutoEnabled` können statische `auto`-Standardwerte für Command-Config-
Prüfungen deklarieren, die vor dem Laden der Channel-Runtime ausgeführt werden. Gebündelte Channels können
dieselben Standardwerte auch über `package.json#openclaw.channel.commands` zusammen mit
ihren anderen package-eigenen Channel-Katalog-Metadaten veröffentlichen.

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

| Feld          | Typ                      | Bedeutung                                                                                         |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema für `channels.<id>`. Für jeden deklarierten Channel-Config-Eintrag erforderlich.      |
| `uiHints`     | `Record<string, object>` | Optionale UI-Labels/Platzhalter/Sensitivitätshinweise für diesen Channel-Config-Abschnitt.        |
| `label`       | `string`                 | Channel-Label, das in Auswahl- und Inspect-Oberflächen übernommen wird, wenn Runtime-Metadaten nicht bereit sind. |
| `description` | `string`                 | Kurze Channel-Beschreibung für Inspect- und Katalogoberflächen.                                   |
| `commands`    | `object`                 | Statische Auto-Standardwerte für native Commands und native Skills für Pre-Runtime-Config-Prüfungen. |
| `preferOver`  | `string[]`               | Legacy- oder niedriger priorisierte Plugin-IDs, die dieser Channel in Auswahloberflächen übertreffen soll. |

### Ein anderes Channel-Plugin ersetzen

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Eigentümer für eine Channel-ID ist, die
auch ein anderes Plugin bereitstellen kann. Häufige Fälle sind eine umbenannte Plugin-ID, ein
eigenständiges Plugin, das ein gebündeltes Plugin ersetzt, oder ein gepflegter Fork, der
dieselbe Channel-ID aus Gründen der Config-Kompatibilität beibehält.

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

Wenn `channels.chat` konfiguriert ist, berücksichtigt OpenClaw sowohl die Channel-ID als auch
die bevorzugte Plugin-ID. Wenn das niedriger priorisierte Plugin nur ausgewählt wurde, weil
es gebündelt oder standardmäßig aktiviert ist, deaktiviert OpenClaw es in der effektiven
Runtime-Config, sodass ein Plugin den Channel und seine Tools besitzt. Eine ausdrückliche Benutzerauswahl
gewinnt weiterhin: Wenn der Benutzer beide Plugins ausdrücklich aktiviert, bewahrt OpenClaw
diese Auswahl und meldet doppelte Channel-/Tool-Diagnosen, statt den angeforderten Plugin-Satz
stillschweigend zu ändern.

Halten Sie `preferOver` auf Plugin-IDs begrenzt, die wirklich denselben Channel bereitstellen können.
Es ist kein allgemeines Prioritätsfeld und benennt keine User-Config-Schlüssel um.

## Referenz zu modelSupport

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus
Kurzform-Modell-IDs wie `gpt-5.5` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Runtime
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

- explizite `provider/model`-Referenzen verwenden die zugehörigen `providers`-Manifest-Metadaten
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte
  Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                            |
| --------------- | ---------- | ------------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden.          |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach Entfernen des Profilsuffixes gegen Kurzform-Modell-IDs abgeglichen werden. |

`modelPatterns`-Einträge werden über `compileSafeRegex` kompiliert; dabei werden
Muster mit verschachtelter Wiederholung abgelehnt (zum Beispiel `(a+)+$`). Muster, die die
Sicherheitsprüfung nicht bestehen, werden stillschweigend übersprungen, genauso wie syntaktisch ungültige Regex.
Halten Sie Muster einfach und vermeiden Sie verschachtelte Quantifizierer.

## modelCatalog-Referenz

Verwenden Sie `modelCatalog`, wenn OpenClaw Provider-Modellmetadaten kennen soll, bevor
die Plugin-Runtime geladen wird. Dies ist die manifestgesteuerte Quelle für feste Katalogzeilen,
Provider-Aliasse, Unterdrückungsregeln und den Discovery-Modus. Runtime-Aktualisierung
gehört weiterhin in den Provider-Runtime-Code, aber das Manifest teilt Core mit, wann Runtime
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

| Feld             | Typ                                                      | Bedeutung                                                                                                   |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Schlüssel sollten auch in `providers` auf oberster Ebene erscheinen. |
| `aliases`        | `Record<string, object>`                                 | Provider-Aliasse, die für Katalog- oder Unterdrückungsplanung zu einem eigenen Provider aufgelöst werden sollen. |
| `suppressions`   | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus Provider-spezifischem Grund unterdrückt.       |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Ob der Provider-Katalog aus Manifest-Metadaten gelesen, in den Cache aktualisiert werden kann oder Runtime benötigt. |
| `runtimeAugment` | `boolean`                                                | Nur auf `true` setzen, wenn die Provider-Runtime nach Manifest-/Konfigurationsplanung Katalogzeilen anhängen muss. |

`aliases` beteiligt sich an der Provider-Eigentumsauflösung für die Modellkatalog-Planung.
Aliasziele müssen Provider auf oberster Ebene sein, die demselben Plugin gehören. Wenn eine
nach Provider gefilterte Liste einen Alias verwendet, kann OpenClaw das zugehörige Manifest lesen und
Alias-API-/Basis-URL-Überschreibungen anwenden, ohne die Provider-Runtime zu laden.
Aliasse erweitern ungefilterte Katalogauflistungen nicht; breite Listen geben nur die
kanonischen Provider-Zeilen des Eigentümers aus.

`suppressions` ersetzt den alten Provider-Runtime-Hook `suppressBuiltInModel`.
Unterdrückungseinträge werden nur berücksichtigt, wenn der Provider dem Plugin gehört oder
als `modelCatalog.aliases`-Schlüssel deklariert ist, der auf einen eigenen Provider verweist. Runtime-
Unterdrückungs-Hooks werden während der Modellauflösung nicht mehr aufgerufen.

Provider-Felder:

| Feld      | Typ                      | Bedeutung                                                              |
| --------- | ------------------------ | ---------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionale Standard-Basis-URL für Modelle in diesem Provider-Katalog.   |
| `api`     | `ModelApi`               | Optionaler Standard-API-Adapter für Modelle in diesem Provider-Katalog. |
| `headers` | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten.    |
| `models`  | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.         |

Modellfelder:

| Feld            | Typ                                                            | Bedeutung                                                                        |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                           |
| `name`          | `string`                                                       | Optionaler Anzeigename.                                                          |
| `api`           | `ModelApi`                                                     | Optionale API-Überschreibung pro Modell.                                         |
| `baseUrl`       | `string`                                                       | Optionale Basis-URL-Überschreibung pro Modell.                                   |
| `headers`       | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                           |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitäten, die das Modell akzeptiert.                                          |
| `reasoning`     | `boolean`                                                      | Ob das Modell Reasoning-Verhalten bereitstellt.                                  |
| `contextWindow` | `number`                                                       | Natives Kontextfenster des Providers.                                            |
| `contextTokens` | `number`                                                       | Optionale effektive Runtime-Kontextgrenze, wenn sie von `contextWindow` abweicht. |
| `maxTokens`     | `number`                                                       | Maximale Ausgabe-Token, sofern bekannt.                                          |
| `cost`          | `object`                                                       | Optionale Preise in USD pro Million Token, einschließlich optionalem `tieredPricing`. |
| `compat`        | `object`                                                       | Optionale Kompatibilitäts-Flags, die zur OpenClaw-Modellkonfigurationskompatibilität passen. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Auflistungsstatus. Nur unterdrücken, wenn die Zeile überhaupt nicht erscheinen darf. |
| `statusReason`  | `string`                                                       | Optionaler Grund, der bei nicht verfügbarem Status angezeigt wird.               |
| `replaces`      | `string[]`                                                     | Ältere Provider-lokale Modell-IDs, die dieses Modell ersetzt.                    |
| `replacedBy`    | `string`                                                       | Ersatz-Provider-lokale Modell-ID für veraltete Zeilen.                           |
| `tags`          | `string[]`                                                     | Stabile Tags, die von Auswahloberflächen und Filtern verwendet werden.           |

Unterdrückungsfelder:

| Feld                       | Typ        | Bedeutung                                                                                                  |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-ID für die zu unterdrückende Upstream-Zeile. Muss diesem Plugin gehören oder als eigener Alias deklariert sein. |
| `model`                    | `string`   | Provider-lokale Modell-ID, die unterdrückt werden soll.                                                    |
| `reason`                   | `string`   | Optionale Meldung, die angezeigt wird, wenn die unterdrückte Zeile direkt angefordert wird.                |
| `when.baseUrlHosts`        | `string[]` | Optionale Liste effektiver Provider-Basis-URL-Hosts, die erforderlich sind, bevor die Unterdrückung greift. |
| `when.providerConfigApiIn` | `string[]` | Optionale Liste exakter Provider-Konfigurationswerte für `api`, die erforderlich sind, bevor die Unterdrückung greift. |

Legen Sie keine reinen Runtime-Daten in `modelCatalog` ab. Verwenden Sie `static` nur, wenn Manifest-
zeilen vollständig genug sind, damit nach Provider gefilterte Listen und Auswahloberflächen
Registry-/Runtime-Discovery überspringen können. Verwenden Sie `refreshable`, wenn Manifestzeilen nützliche
auflistbare Startwerte oder Ergänzungen sind, aber eine Aktualisierung/ein Cache später weitere Zeilen hinzufügen kann;
aktualisierbare Zeilen sind für sich genommen nicht maßgeblich. Verwenden Sie `runtime`, wenn OpenClaw
die Provider-Runtime laden muss, um die Liste zu kennen.

## modelIdNormalization-Referenz

Verwenden Sie `modelIdNormalization` für günstige Provider-eigene Modell-ID-Bereinigung, die
vor dem Laden der Provider-Runtime erfolgen muss. Dadurch bleiben Aliasse wie kurze Modell-
namen, Provider-lokale Legacy-IDs und Proxy-Präfixregeln im zugehörigen Plugin-
Manifest statt in Core-Modellauswahltabellen.

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

| Feld                                 | Typ                     | Bedeutung                                                                            |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | Exakte Modell-ID-Aliasse ohne Beachtung der Groß-/Kleinschreibung. Werte werden wie geschrieben zurückgegeben. |
| `stripPrefixes`                      | `string[]`              | Präfixe, die vor der Aliassuche entfernt werden; nützlich bei Legacy-Duplizierung von Provider/Modell. |
| `prefixWhenBare`                     | `string`                | Präfix, das hinzugefügt wird, wenn die normalisierte Modell-ID noch kein `/` enthält. |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Bedingte Präfixregeln für nackte IDs nach der Aliassuche, indiziert über `modelPrefix` und `prefix`. |

## providerEndpoints-Referenz

Verwenden Sie `providerEndpoints` für Endpunktklassifizierung, die generische Anfrage-Richtlinien
kennen müssen, bevor die Provider-Runtime geladen wird. Core besitzt weiterhin die Bedeutung jeder
`endpointClass`; Plugin-Manifeste besitzen die Host- und Basis-URL-Metadaten.

Endpoint-Felder:

| Feld                           | Typ        | Bedeutung                                                                                                      |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekannte Kern-Endpoint-Klasse, etwa `openrouter`, `moonshot-native` oder `google-vertex`.                      |
| `hosts`                        | `string[]` | Exakte Hostnamen, die der Endpoint-Klasse zugeordnet werden.                                                   |
| `hostSuffixes`                 | `string[]` | Host-Suffixe, die der Endpoint-Klasse zugeordnet werden. Stellen Sie `.` voran, um nur Domain-Suffixe abzugleichen. |
| `baseUrls`                     | `string[]` | Exakte normalisierte HTTP(S)-Basis-URLs, die der Endpoint-Klasse zugeordnet werden.                            |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-Region für exakte globale Hosts.                                                       |
| `googleVertexRegionHostSuffix` | `string`   | Suffix, das von passenden Hosts entfernt wird, um das Google Vertex-Regionspräfix offenzulegen.                |

## providerRequest-Referenz

Verwenden Sie `providerRequest` für günstige Metadaten zur Anfragekompatibilität, die generische
Anfragerichtlinien benötigen, ohne die Provider-Laufzeit zu laden. Behalten Sie verhaltensspezifisches
Umschreiben von Payloads in Provider-Laufzeit-Hooks oder gemeinsamen Helfern für Provider-Familien.

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

| Feld                  | Typ          | Bedeutung                                                                                             |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Provider-Familienlabel, das von generischen Entscheidungen und Diagnosen zur Anfragekompatibilität verwendet wird. |
| `compatibilityFamily` | `"moonshot"` | Optionaler Kompatibilitäts-Bucket für Provider-Familien für gemeinsame Anfragehelfer.                 |
| `openAICompletions`   | `object`     | Anfrage-Flags für OpenAI-kompatible Completions, derzeit `supportsStreamingUsage`.                    |

## secretProviderIntegrations-Referenz

Verwenden Sie `secretProviderIntegrations`, wenn ein Plugin eine wiederverwendbare SecretRef-
Exec-Provider-Voreinstellung veröffentlichen kann. OpenClaw liest diese Metadaten, bevor die Plugin-Laufzeit geladen wird,
speichert die Plugin-Zuständigkeit in `secrets.providers.<alias>.pluginIntegration` und
überlässt die eigentliche Secret-Auflösung der SecretRef-Laufzeit.
Voreinstellungen werden nur für gebündelte Plugins und installierte Plugins bereitgestellt, die
aus den verwalteten Plugin-Installationsstämmen erkannt wurden, etwa Git- und ClawHub-Installationen.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

Der Map-Schlüssel ist die Integrations-ID. Wenn `providerAlias` ausgelassen wird, verwendet OpenClaw
die Integrations-ID als SecretRef-Provider-Alias. Provider-Aliasse müssen dem
normalen SecretRef-Provider-Alias-Muster entsprechen, zum Beispiel `team-secrets` oder
`onepassword-work`.

Wenn ein Operator die Voreinstellung auswählt, schreibt OpenClaw eine Provider-Referenz wie diese:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

Beim Start oder Neuladen löst OpenClaw diesen Provider auf, indem es aktuelle Plugin-
Manifestmetadaten lädt, prüft, ob das zuständige Plugin installiert und aktiv ist, und
den Exec-Befehl aus dem Manifest materialisiert. Das Deaktivieren oder Entfernen des
Plugins widerruft den Provider für aktive SecretRefs. Operatoren, die eine eigenständige
Exec-Konfiguration wünschen, können weiterhin manuelle `command`/`args`-Provider direkt schreiben.

Derzeit werden nur Voreinstellungen mit `source: "exec"` unterstützt. `command` muss
`${node}` sein, und `args[0]` muss ein Resolver-Skript relativ zum Plugin-Stamm mit `./` sein.
OpenClaw materialisiert dies beim Start oder Neuladen zum aktuellen Node-Executable und
zum absoluten Skriptpfad innerhalb des Plugins. Node-Optionen wie `--require`, `--import`,
`--loader`, `--env-file`, `--eval` und `--print` gehören nicht zum Manifest-
Voreinstellungsvertrag. Operatoren, die Nicht-Node-Befehle benötigen, können eigenständige
manuelle Exec-Provider direkt konfigurieren.

OpenClaw leitet `trustedDirs` für Manifest-Voreinstellungen aus dem Plugin-Stamm und,
für `${node}`-Voreinstellungen, aus dem Verzeichnis des aktuellen Node-Executables ab. Im Manifest verfasste
`trustedDirs` werden ignoriert. Andere Exec-Provider-Optionen wie `timeoutMs`,
`maxOutputBytes`, `jsonOnly`, `env`, `passEnv` und `allowInsecurePath` werden
an die normale SecretRef-Exec-Provider-Konfiguration durchgereicht.

## modelPricing-Referenz

Verwenden Sie `modelPricing`, wenn ein Provider Preisverhalten auf der Steuerungsebene benötigt, bevor
die Laufzeit geladen wird. Der Gateway-Preis-Cache liest diese Metadaten, ohne
Provider-Laufzeitcode zu importieren.

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
| `openRouter` | `false \| object` | OpenRouter-Preisabfrage-Mapping. `false` deaktiviert die OpenRouter-Abfrage für diesen Provider.           |
| `liteLLM`    | `false \| object` | LiteLLM-Preisabfrage-Mapping. `false` deaktiviert die LiteLLM-Abfrage für diesen Provider.                 |

Quellfelder:

| Feld                       | Typ                | Bedeutung                                                                                                                |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | Externe Katalog-Provider-ID, wenn sie sich von der OpenClaw-Provider-ID unterscheidet, zum Beispiel `z-ai` für einen `zai`-Provider. |
| `passthroughProviderModel` | `boolean`          | Behandelt Modell-IDs mit Schrägstrichen als verschachtelte Provider/Modell-Referenzen, nützlich für Proxy-Provider wie OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Zusätzliche Modell-ID-Varianten für externe Kataloge. `version-dots` versucht punktierte Versions-IDs wie `claude-opus-4.6`. |

### OpenClaw-Provider-Index

Der OpenClaw-Provider-Index ist OpenClaw-eigene Vorschau-Metadaten für Provider,
deren Plugins möglicherweise noch nicht installiert sind. Er ist nicht Teil eines Plugin-Manifests.
Plugin-Manifeste bleiben die Autorität für installierte Plugins. Der Provider-Index ist
der interne Fallback-Vertrag, den zukünftige Oberflächen für installierbare Provider und die Modellauswahl
vor der Installation verwenden werden, wenn ein Provider-Plugin nicht installiert ist.

Autoritätsreihenfolge des Katalogs:

1. Benutzerkonfiguration.
2. Installiertes Plugin-Manifest `modelCatalog`.
3. Modellkatalog-Cache aus expliziter Aktualisierung.
4. Vorschauzeilen des OpenClaw-Provider-Index.

Der Provider-Index darf keine Secrets, keinen Aktivierungszustand, keine Laufzeit-Hooks oder
Live-Modell-Daten enthalten, die kontospezifisch sind. Seine Vorschaukataloge verwenden dieselbe
Provider-Zeilenform `modelCatalog` wie Plugin-Manifeste, sollten aber auf stabile
Anzeigemetadaten beschränkt bleiben, es sei denn, Laufzeitadapter-Felder wie `api`,
`baseUrl`, Preise oder Kompatibilitäts-Flags werden absichtlich mit
dem installierten Plugin-Manifest synchron gehalten. Provider mit Live-Erkennung über `/models` sollten
aktualisierte Zeilen über den expliziten Modellkatalog-Cache-Pfad schreiben, statt
normale Auflistungs- oder Onboarding-Aufrufe an Provider-APIs zu senden.

Provider-Index-Einträge können auch Metadaten zu installierbaren Plugins für Provider enthalten,
deren Plugin aus dem Kern verschoben wurde oder anderweitig noch nicht installiert ist. Diese
Metadaten spiegeln das Channel-Katalogmuster wider: Paketname, npm-Installationsspezifikation,
erwartete Integrität und günstige Auth-Auswahllabels reichen aus, um eine
installierbare Einrichtungsoption anzuzeigen. Sobald das Plugin installiert ist, gewinnt sein Manifest und
der Provider-Index-Eintrag wird für diesen Provider ignoriert.

Veraltete Capability-Schlüssel auf oberster Ebene sind deprecated. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; das normale
Laden von Manifesten behandelt diese Felder auf oberster Ebene nicht mehr als Capability-
Zuständigkeit.

## Manifest im Vergleich zu package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwendung                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Auth-Auswahlmetadaten und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code läuft |
| `package.json`         | npm-Metadaten, Abhängigkeitsinstallation und der `openclaw`-Block, der für Einstiegspunkte, Installations-Gating, Einrichtung oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wohin ein Metadatum gehört, verwenden Sie diese Regel:

- Wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, legen Sie es in `openclaw.plugin.json` ab
- Wenn es um Packaging, Einstiegspunktdateien oder npm-Installationsverhalten geht, legen Sie es in `package.json` ab

### package.json-Felder, die Discovery beeinflussen

Einige Plugin-Metadaten vor der Laufzeit liegen absichtlich in `package.json` unter dem
`openclaw`-Block statt in `openclaw.plugin.json`.
`openclaw.bundle` und `openclaw.bundle.json` sind keine OpenClaw-Plugin-Verträge;
native Plugins müssen `openclaw.plugin.json` plus die unten unterstützten
`package.json#openclaw`-Felder verwenden.

Wichtige Beispiele:

| Feld                                                                                       | Bedeutung                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Deklariert native Plugin-Einstiegspunkte. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                                          |
| `openclaw.runtimeExtensions`                                                               | Deklariert gebaute JavaScript-Runtime-Einstiegspunkte für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                     |
| `openclaw.setupEntry`                                                                      | Schlanker, nur für die Einrichtung verwendeter Einstiegspunkt für Onboarding, verzögerten Kanalstart und schreibgeschützte Kanalstatus-/SecretRef-Erkennung. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                                               | Deklariert den gebauten JavaScript-Einrichtungseinstiegspunkt für installierte Pakete. Erfordert `setupEntry`, muss existieren und muss innerhalb des Plugin-Paketverzeichnisses bleiben.                 |
| `openclaw.channel`                                                                         | Günstige Kanalkatalog-Metadaten wie Bezeichnungen, Dokumentationspfade, Aliasse und Auswahltexte.                                                                                                         |
| `openclaw.channel.commands`                                                                | Statische native Befehls- und native Skills-Auto-Standardmetadaten, die von Konfiguration, Audit und Befehlslisten-Oberflächen verwendet werden, bevor die Kanal-Runtime geladen wird.                  |
| `openclaw.channel.configuredState`                                                         | Schlanke Metadaten für die Prüfung des Konfigurationsstatus, die beantworten können: „Existiert die reine Env-Einrichtung bereits?“, ohne die vollständige Kanal-Runtime zu laden.                       |
| `openclaw.channel.persistedAuthState`                                                      | Schlanke Metadaten für die Prüfung persistierter Authentifizierung, die beantworten können: „Ist bereits irgendetwas angemeldet?“, ohne die vollständige Kanal-Runtime zu laden.                         |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installations-/Update-Hinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                                         |
| `openclaw.install.defaultChoice`                                                           | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                                          |
| `openclaw.install.minHostVersion`                                                          | Minimal unterstützte OpenClaw-Hostversion mit einer Semver-Untergrenze wie `>=2026.3.22` oder `>=2026.5.1-beta.1`.                                                                                       |
| `openclaw.compat.pluginApi`                                                                | Minimaler OpenClaw-Plugin-API-Bereich, den dieses Paket benötigt, mit einer Semver-Untergrenze wie `>=2026.5.27`.                                                                                        |
| `openclaw.install.expectedIntegrity`                                                       | Erwartete npm-Dist-Integritätszeichenfolge wie `sha512-...`; Installations- und Update-Flows prüfen das abgerufene Artefakt dagegen.                                                                     |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                                                                              |
| `openclaw.install.requiredPlatformPackages`                                                | npm-Paketaliasse, die materialisiert werden müssen, wenn ihre Lockfile-Plattformbedingungen zum aktuellen Host passen.                                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Erlaubt, Einrichtungskanal-Oberflächen vor dem Lauschen zu laden, und verschiebt dann das vollständige konfigurierte Kanal-Plugin bis zur Aktivierung nach dem Lauschen.                                 |

Manifest-Metadaten entscheiden, welche Provider-/Kanal-/Einrichtungsoptionen im
Onboarding erscheinen, bevor die Runtime geladen wird. `package.json#openclaw.install` teilt
dem Onboarding mit, wie dieses Plugin abgerufen oder aktiviert werden soll, wenn Benutzer eine dieser
Optionen auswählen. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der
Manifest-Registry für nicht gebündelte Plugin-Quellen erzwungen. Ungültige Werte werden abgelehnt;
neuere, aber gültige Werte überspringen externe Plugins auf älteren Hosts. Gebündelte Quell-
Plugins gelten als mit dem Host-Checkout versionsgleich.

`openclaw.install.requiredPlatformPackages` ist für npm-Pakete gedacht, die
erforderliche native Binärdateien über optionale, plattformspezifische Aliasse bereitstellen. Listen Sie den
reinen npm-Paketnamen für jeden unterstützten Plattformalias auf. Während der npm-Installation
prüft OpenClaw nur den deklarierten Alias, dessen Lockfile-Bedingungen zum
aktuellen Host passen. Wenn npm Erfolg meldet, diesen Alias aber auslässt, versucht OpenClaw es einmal
mit einem frischen Cache erneut und setzt die Installation zurück, wenn der Alias weiterhin fehlt.

`openclaw.compat.pluginApi` wird während der Paketinstallation für nicht gebündelte
Plugin-Quellen erzwungen. Verwenden Sie es für die OpenClaw-Plugin-SDK-/Runtime-API-Untergrenze, gegen die das
Paket gebaut wurde. Sie kann strenger als `minHostVersion` sein, wenn ein
Plugin-Paket eine neuere API benötigt, aber für andere Flows weiterhin einen niedrigeren
Installationshinweis beibehält. Die offizielle OpenClaw-Release-Synchronisierung hebt vorhandene offizielle Plugin-API-Untergrenzen
standardmäßig auf die OpenClaw-Release-Version an, aber reine Plugin-Releases können eine
niedrigere Untergrenze beibehalten, wenn das Paket ältere Hosts bewusst unterstützt. Verwenden Sie nicht allein die
Paketversion als Kompatibilitätsvertrag. `peerDependencies.openclaw`
bleibt npm-Paketmetadaten; OpenClaw verwendet den Vertrag `openclaw.compat.pluginApi`
für Entscheidungen zur Installationskompatibilität.

Offizielle Install-on-Demand-Metadaten sollten `clawhubSpec` verwenden, wenn das Plugin auf
ClawHub veröffentlicht ist; das Onboarding behandelt dies als bevorzugte Remote-Quelle und
zeichnet ClawHub-Artefaktfakten nach der Installation auf. `npmSpec` bleibt der Kompatibilitäts-
Fallback für Pakete, die noch nicht zu ClawHub verschoben wurden.

Exaktes npm-Versions-Pinning befindet sich bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalog-
Einträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Update-Flows ausfallsicher
fehlschlagen, wenn das abgerufene npm-Artefakt nicht mehr zum gepinnten Release passt.
Interaktives Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige Registry-npm-Spezifikationen an, einschließlich reiner
Paketnamen und Dist-Tags. Katalogdiagnosen können
exakte, gleitende, integritätsgepinnte, fehlende Integrität, Paketnamen-
Nichtübereinstimmung und ungültige Standardauswahl-Quellen unterscheiden. Sie warnen außerdem, wenn
`expectedIntegrity` vorhanden ist, es aber keine gültige npm-Quelle gibt, die es pinnen kann.
Wenn `expectedIntegrity` vorhanden ist,
erzwingen Installations-/Update-Flows es; wenn es weggelassen wird, wird die Registry-Auflösung
ohne Integritäts-Pin aufgezeichnet.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Kanalliste
oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige
Runtime zu laden. Der Einrichtungseinstieg sollte Kanalmetadaten sowie einrichtungssichere Konfigurations-,
Status- und Secrets-Adapter bereitstellen; belassen Sie Netzwerkclients, Gateway-Listener und
Transport-Runtimes im Haupterweiterungs-Einstiegspunkt.

Runtime-Einstiegspunktfelder setzen Paketgrenzenprüfungen für Quell-
Einstiegspunktfelder nicht außer Kraft. Zum Beispiel kann `openclaw.runtimeExtensions` einen
ausbrechenden `openclaw.extensions`-Pfad nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist bewusst eng gefasst. Es macht
keine beliebigen defekten Konfigurationen installierbar. Derzeit erlaubt es Installations-
Flows nur, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, etwa einem
fehlenden gebündelten Plugin-Pfad oder einem veralteten `channels.<id>`-Eintrag für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die Installation und verweisen Betreiber
auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein winziges Prüf-
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

Verwenden Sie es, wenn Einrichtung, Doctor, Status oder schreibgeschützte Präsenz-Flows eine günstige
Ja/Nein-Authentifizierungsprüfung benötigen, bevor das vollständige Kanal-Plugin geladen wird. Persistierter Authentifizierungsstatus ist
kein konfigurierter Kanalstatus: Verwenden Sie diese Metadaten nicht, um Plugins automatisch zu aktivieren,
Runtime-Abhängigkeiten zu reparieren oder zu entscheiden, ob eine Kanal-Runtime geladen werden soll.
Der Ziel-Export sollte eine kleine Funktion sein, die nur persistierten Zustand liest; leiten
Sie ihn nicht durch das vollständige Kanal-Runtime-Barrel.

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

Verwenden Sie es, wenn ein Kanal den Konfigurationsstatus aus Env oder anderen winzigen
Nicht-Runtime-Eingaben beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung oder die echte
Kanal-Runtime benötigt, belassen Sie diese Logik stattdessen im Plugin-Hook `config.hasConfiguredState`.

## Ermittlungsrangfolge (doppelte Plugin-IDs)

OpenClaw ermittelt Plugins aus mehreren Wurzeln. Die rohe Dateisystem-Scan-
Reihenfolge finden Sie unter [Plugin-Scan-Reihenfolge](/de/gateway/configuration-reference#plugin-scan-order). Wenn zwei Ermittlungen
dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Rangfolge** behalten;
Dubletten mit niedrigerer Rangfolge werden verworfen, statt daneben geladen zu werden.

Rangfolge, von höchster zu niedrigster:

1. **Konfigurationsausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` gepinnt ist
2. **Gebündelt** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Globale Installation** — Plugins, die in der globalen OpenClaw-Plugin-Wurzel installiert sind
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace ermittelt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich mit einem lokalen zu überschreiben, pinnen Sie es über `plugins.entries.<id>`, damit es aufgrund der Rangfolge gewinnt, statt sich auf Workspace-Ermittlung zu verlassen.
- Verworfene Dubletten werden protokolliert, damit Doctor und Startdiagnosen auf die verworfene Kopie verweisen können.
- Konfigurationsausgewählte Dubletten-Overrides werden in Diagnosen als explizite Overrides formuliert, warnen aber weiterhin, damit veraltete Forks und versehentliche Überschattungen sichtbar bleiben.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON Schema ausliefern**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.
- Wenn Sie ein gebündeltes Plugin um neue Konfigurationsschlüssel erweitern oder forken, aktualisieren Sie gleichzeitig das `configSchema` dieses Plugins in `openclaw.plugin.json`. Schemas gebündelter Plugins sind strikt. Wenn Sie also `plugins.entries.<id>.config.myNewKey` in der Benutzerkonfiguration hinzufügen, ohne `myNewKey` zu `configSchema.properties` hinzuzufügen, wird dies abgelehnt, bevor die Plugin-Laufzeit geladen wird.

Beispiel für eine Schemaerweiterung:

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
  müssen auf **auffindbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration vorhanden ist, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  eine **Warnung** wird in Doctor und Logs angezeigt.

Weitere Informationen zum vollständigen `plugins.*`-Schema finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich Ladevorgängen aus dem lokalen Dateisystem. Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der Erkennung und Validierung.
- Native Manifeste werden mit JSON5 geparst, daher werden Kommentare, nachgestellte Kommas und nicht in Anführungszeichen gesetzte Schlüssel akzeptiert, solange der endgültige Wert weiterhin ein Objekt ist.
- Der Manifest-Loader liest nur dokumentierte Manifestfelder. Vermeiden Sie benutzerdefinierte Schlüssel auf oberster Ebene.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerCatalogEntry` muss schlank bleiben und sollte keinen breiten Laufzeitcode importieren; verwenden Sie es für statische Provider-Katalogmetadaten oder eng gefasste Discovery-Deskriptoren, nicht für die Ausführung zur Anfragezeit.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory`, `kind: "context-engine"` über `plugins.slots.contextEngine` (Standard `legacy`).
- Deklarieren Sie die exklusive Plugin-Art in diesem Manifest. `OpenClawPluginDefinition.kind` im Laufzeit-Einstieg ist veraltet und bleibt nur als Kompatibilitäts-Fallback für ältere Plugins erhalten.
- Env-var-Metadaten (`setup.providers[].envVars`, das veraltete `providerAuthEnvVars` und `channelEnvVars`) sind nur deklarativ. Status, Audit, Cron-Zustellungsvalidierung und andere schreibgeschützte Oberflächen wenden weiterhin Plugin-Vertrauen und die effektive Aktivierungsrichtlinie an, bevor sie eine Env-var als konfiguriert behandeln.
- Laufzeit-Wizard-Metadaten, die Provider-Code benötigen, finden Sie unter [Provider-Laufzeit-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und etwaige Anforderungen an die Allowlist des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
