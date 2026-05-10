---
read_when:
    - Sie entwickeln ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-05-10T19:44:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
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
Skill-Roots, Claude-Command-Roots, Standardwerte aus Claude-Bundle-`settings.json`,
Claude-Bundle-LSP-Standardwerte und unterstützte Hook-Pakete, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** ausliefern. OpenClaw verwendet dieses Manifest, um die Konfiguration
**ohne Ausführung von Plugin-Code** zu validieren. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe den vollständigen Leitfaden zum Plugin-System: [Plugins](/de/tools/plugin).
Zum nativen Capability-Modell und zur aktuellen Anleitung zur externen Kompatibilität:
[Capability-Modell](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` enthält die Metadaten, die OpenClaw liest, **bevor es Ihren
Plugin-Code lädt**. Alles unten muss einfach genug sein, um es ohne Start der
Plugin-Laufzeit zu prüfen.

**Verwenden Sie sie für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurationsoberfläche
- Metadaten zu Authentifizierung, Onboarding und Einrichtung (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Authentifizierungsoptionen)
- Aktivierungshinweise für Control-Plane-Oberflächen
- Besitz von Modellfamilien in Kurzschreibweise
- statische Snapshots für Capability-Besitz (`contracts`)
- QA-Runner-Metadaten, die der gemeinsame `openclaw qa`-Host prüfen kann
- channelspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie sie nicht für:** die Registrierung von Laufzeitverhalten, die Deklaration von Code-Einstiegspunkten
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

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                             |
| ------------------------------------ | ------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja            | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                                   |
| `configSchema`                       | Ja            | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                               |
| `enabledByDefault`                   | Nein          | `true`                           | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg, oder setzen Sie einen beliebigen Nicht-`true`-Wert, damit das Plugin standardmäßig deaktiviert bleibt.                                             |
| `enabledByDefaultOnPlatforms`        | Nein          | `string[]`                       | Kennzeichnet ein gebündeltes Plugin nur auf den aufgelisteten Node.js-Plattformen als standardmäßig aktiviert, zum Beispiel `["darwin"]`. Explizite Konfiguration hat weiterhin Vorrang.                                             |
| `legacyPluginIds`                    | Nein          | `string[]`                       | Legacy-IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | Nein          | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modellreferenzen sie erwähnen.                                                                                               |
| `kind`                               | Nein          | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                        |
| `channels`                           | Nein          | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Wird für Discovery und Konfigurationsvalidierung verwendet.                                                                                                                                      |
| `providers`                          | Nein          | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                              |
| `providerCatalogEntry`               | Nein          | `string`                         | Leichtgewichtiger Modulpfad für den Provider-Katalog, relativ zum Plugin-Stammverzeichnis, für manifestbezogene Provider-Katalogmetadaten, die geladen werden können, ohne die vollständige Plugin-Laufzeit zu aktivieren.            |
| `modelSupport`                       | Nein          | `object`                         | Manifestverwaltete Kurzform-Metadaten zur Modellfamilie, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                                                   |
| `modelCatalog`                       | Nein          | `object`                         | Deklarative Modellkatalog-Metadaten für Provider, die diesem Plugin gehören. Dies ist der Control-Plane-Vertrag für künftige schreibgeschützte Auflistung, Onboarding, Modellauswahl, Aliase und Unterdrückung ohne Laden der Plugin-Laufzeit. |
| `modelPricing`                       | Nein          | `object`                         | Providerverwaltete externe Preisnachschlagerichtlinie. Verwenden Sie sie, um lokale/selbst gehostete Provider von Remote-Preiskatalogen auszunehmen oder Provider-Referenzen OpenRouter/LiteLLM-Katalog-IDs zuzuordnen, ohne Provider-IDs im Core fest zu codieren. |
| `modelIdNormalization`               | Nein          | `object`                         | Providerverwaltete Bereinigung von Modell-ID-Aliasen/-Präfixen, die ausgeführt werden muss, bevor die Provider-Laufzeit geladen wird.                                                                                                  |
| `providerEndpoints`                  | Nein          | `object[]`                       | Manifestverwaltete Endpoint-Host-/baseUrl-Metadaten für Provider-Routen, die der Core klassifizieren muss, bevor die Provider-Laufzeit geladen wird.                                                                                   |
| `providerRequest`                    | Nein          | `object`                         | Günstige Metadaten zu Provider-Familie und Anfragekompatibilität, die von generischer Anfragerichtlinie verwendet werden, bevor die Provider-Laufzeit geladen wird.                                                                    |
| `cliBackends`                        | Nein          | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Wird für automatische Startaktivierung aus expliziten Konfigurationsreferenzen verwendet.                                                                                         |
| `syntheticAuthRefs`                  | Nein          | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren pluginverwalteter synthetischer Authentifizierungshook während der kalten Modell-Discovery vor dem Laden der Laufzeit geprüft werden soll.                                               |
| `nonSecretAuthMarkers`               | Nein          | `string[]`                       | Von gebündelten Plugins verwaltete Platzhalter-API-Schlüsselwerte, die nicht geheime lokale, OAuth- oder Umgebungs-Credential-Zustände darstellen.                                                                                     |
| `commandAliases`                     | Nein          | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen, bevor die Laufzeit geladen wird.                                                                                        |
| `providerAuthEnvVars`                | Nein          | `Record<string, string[]>`       | Veraltete Kompatibilitäts-Env-Metadaten für Provider-Authentifizierungs-/Statusabfragen. Bevorzugen Sie `setup.providers[].envVars` für neue Plugins; OpenClaw liest dies während des Deprecation-Fensters weiterhin.                |
| `providerAuthAliases`                | Nein          | `Record<string, string>`         | Provider-IDs, die eine andere Provider-ID für die Authentifizierungsabfrage wiederverwenden sollen, zum Beispiel ein Coding-Provider, der den API-Schlüssel und die Authentifizierungsprofile des Basis-Providers teilt.              |
| `channelEnvVars`                     | Nein          | `Record<string, string[]>`       | Günstige Kanal-Env-Metadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuerte Kanaleinrichtung oder Authentifizierungsflächen, die generische Start-/Konfigurationshelfer sehen sollen.     |
| `providerAuthChoices`                | Nein          | `object[]`                       | Günstige Authentifizierungsauswahl-Metadaten für Onboarding-Auswahlen, Auflösung bevorzugter Provider und einfache CLI-Flag-Verdrahtung.                                                                                              |
| `activation`                         | Nein          | `object`                         | Günstige Aktivierungsplaner-Metadaten für durch Start, Provider, Befehl, Kanal, Route und Capability ausgelöstes Laden. Nur Metadaten; die tatsächliche Verhaltensweise gehört weiterhin der Plugin-Laufzeit.                       |
| `setup`                              | Nein          | `object`                         | Günstige Einrichtungs-/Onboarding-Deskriptoren, die Discovery- und Einrichtungsflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                              |
| `qaRunners`                          | Nein          | `object[]`                       | Günstige QA-Runner-Deskriptoren, die vom gemeinsamen `openclaw qa`-Host verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                                                     |
| `contracts`                          | Nein          | `object`                         | Statischer Snapshot der Capability-Zuständigkeit für externe Authentifizierungshooks, Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bilderzeugung, Musikerzeugung, Videoerzeugung, Webabruf, Websuche und Tool-Zuständigkeit. |
| `mediaUnderstandingProviderMetadata` | Nein          | `Record<string, object>`         | Günstige Standardwerte für Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                        |
| `imageGenerationProviderMetadata`    | Nein          | `Record<string, object>`         | Günstige Authentifizierungsmetadaten für Bilderzeugung für Provider-IDs, die in `contracts.imageGenerationProviders` deklariert sind, einschließlich providerverwalteter Authentifizierungsaliase und Base-URL-Guards.               |
| `videoGenerationProviderMetadata`    | Nein          | `Record<string, object>`         | Günstige Authentifizierungsmetadaten für Videoerzeugung für Provider-IDs, die in `contracts.videoGenerationProviders` deklariert sind, einschließlich providerverwalteter Authentifizierungsaliase und Base-URL-Guards.              |
| `musicGenerationProviderMetadata`    | Nein          | `Record<string, object>`         | Günstige Authentifizierungsmetadaten für Musikerzeugung für Provider-IDs, die in `contracts.musicGenerationProviders` deklariert sind, einschließlich providerverwalteter Authentifizierungsaliase und Base-URL-Guards.              |
| `toolMetadata`                       | Nein          | `Record<string, object>`         | Günstige Verfügbarkeitsmetadaten für pluginverwaltete Tools, die in `contracts.tools` deklariert sind. Verwenden Sie dies, wenn ein Tool die Laufzeit nur laden soll, wenn Konfigurations-, Env- oder Authentifizierungsnachweise vorliegen. |
| `channelConfigs`                     | Nein          | `Record<string, object>`         | Manifestverwaltete Kanal-Konfigurationsmetadaten, die vor dem Laden der Laufzeit in Discovery- und Validierungsflächen zusammengeführt werden.                                                                                        |
| `skills`                             | Nein          | `string[]`                       | Skill-Verzeichnisse, die relativ zum Plugin-Stammverzeichnis geladen werden.                                                                                                                                                          |
| `name`                               | Nein     | `string`                         | Für Menschen lesbarer Plugin-Name.                                                                                                                                                                                                  |
| `description`                        | Nein     | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                    |
| `version`                            | Nein     | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                         |
| `uiHints`                            | Nein     | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Hinweise zur Vertraulichkeit für Konfigurationsfelder.                                                                                                                                           |

## Referenz für Metadaten von Generierungs-Providern

Die Metadatenfelder für Generierungs-Provider beschreiben statische Auth-Signale für
Provider, die in der passenden Liste `contracts.*GenerationProviders` deklariert sind.
OpenClaw liest diese Felder, bevor die Provider-Laufzeit geladen wird, damit Core-Tools
entscheiden können, ob ein Generierungs-Provider verfügbar ist, ohne jedes
Provider-Plugin zu importieren.

Verwenden Sie diese Felder nur für leichtgewichtige, deklarative Fakten. Transport, Anfrage-
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

| Feld            | Erforderlich | Typ        | Bedeutung                                                                                                                        |
| --------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Nein         | `string[]` | Zusätzliche Provider-IDs, die als statische Auth-Aliasse für den Generierungs-Provider zählen sollen.                           |
| `authProviders` | Nein         | `string[]` | Provider-IDs, deren konfigurierte Auth-Profile als Auth für diesen Generierungs-Provider zählen sollen.                         |
| `configSignals` | Nein         | `object[]` | Leichtgewichtige, rein konfigurationsbasierte Verfügbarkeitssignale für lokale oder selbst gehostete Provider, die ohne Auth-Profile oder Env-Vars konfiguriert werden können. |
| `authSignals`   | Nein         | `object[]` | Explizite Auth-Signale. Wenn vorhanden, ersetzen diese die standardmäßige Signalmenge aus der Provider-ID, `aliases` und `authProviders`. |

Jeder `configSignals`-Eintrag unterstützt:

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                                                                                                      |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`    | Ja           | `string`   | Punktpfad zum Plugin-eigenen Konfigurationsobjekt, das geprüft werden soll, zum Beispiel `plugins.entries.example.config`.                                                     |
| `overlayPath` | Nein         | `string`   | Punktpfad innerhalb der Root-Konfiguration, dessen Objekt das Root-Objekt überlagern soll, bevor das Signal ausgewertet wird. Verwenden Sie dies für fähigkeitsspezifische Konfiguration wie `image`, `video` oder `music`. |
| `required`    | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, die konfigurierte Werte haben müssen. Zeichenfolgen dürfen nicht leer sein; Objekte und Arrays dürfen nicht leer sein.      |
| `requiredAny` | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, bei denen mindestens einer einen konfigurierten Wert haben muss.                                                            |
| `mode`        | Nein         | `object`   | Optionaler Zeichenfolgen-Moduswächter innerhalb der effektiven Konfiguration. Verwenden Sie dies, wenn rein konfigurationsbasierte Verfügbarkeit nur für einen Modus gilt.     |

Jeder `mode`-Wächter unterstützt:

| Feld         | Erforderlich | Typ        | Bedeutung                                                                       |
| ------------ | ------------ | ---------- | ------------------------------------------------------------------------------- |
| `path`       | Nein         | `string`   | Punktpfad innerhalb der effektiven Konfiguration. Standardwert ist `mode`.       |
| `default`    | Nein         | `string`   | Moduswert, der verwendet wird, wenn die Konfiguration den Pfad auslässt.         |
| `allowed`    | Nein         | `string[]` | Wenn vorhanden, besteht das Signal nur, wenn der effektive Modus einer dieser Werte ist. |
| `disallowed` | Nein         | `string[]` | Wenn vorhanden, schlägt das Signal fehl, wenn der effektive Modus einer dieser Werte ist. |

Jeder `authSignals`-Eintrag unterstützt:

| Feld              | Erforderlich | Typ      | Bedeutung                                                                                                                                                              |
| ----------------- | ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string` | Provider-ID, die in konfigurierten Auth-Profilen geprüft werden soll.                                                                                                  |
| `providerBaseUrl` | Nein         | `object` | Optionaler Wächter, durch den das Signal nur zählt, wenn der referenzierte konfigurierte Provider eine erlaubte Basis-URL verwendet. Verwenden Sie dies, wenn ein Auth-Alias nur für bestimmte APIs gültig ist. |

Jeder `providerBaseUrl`-Wächter unterstützt:

| Feld              | Erforderlich | Typ        | Bedeutung                                                                                                                                       |
| ----------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string`   | Provider-Konfigurations-ID, deren `baseUrl` geprüft werden soll.                                                                                |
| `defaultBaseUrl`  | Nein         | `string`   | Basis-URL, die angenommen wird, wenn die Provider-Konfiguration `baseUrl` auslässt.                                                             |
| `allowedBaseUrls` | Ja           | `string[]` | Erlaubte Basis-URLs für dieses Auth-Signal. Das Signal wird ignoriert, wenn die konfigurierte oder standardmäßige Basis-URL keinem dieser normalisierten Werte entspricht. |

## Referenz für Tool-Metadaten

`toolMetadata` verwendet dieselben Formen für `configSignals` und `authSignals` wie
Metadaten für Generierungs-Provider, nach Tool-Namen geschlüsselt. `contracts.tools` deklariert
die Eigentümerschaft. `toolMetadata` deklariert leichtgewichtige Verfügbarkeitsnachweise, damit OpenClaw
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
lädt das besitzende Plugin, wenn der Tool-Vertrag zur Policy passt. Für Hot-Path-
Tools, deren Factory von Auth/Konfiguration abhängt, sollten Plugin-Autoren
`toolMetadata` deklarieren, statt den Core die Laufzeit importieren zu lassen, um nachzufragen.

## Referenz für providerAuthChoices

Jeder `providerAuthChoices`-Eintrag beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.
Provider-Einrichtungslisten verwenden diese Manifest-Auswahlen, aus Deskriptoren abgeleitete Einrichtungs-
Auswahlen und Installationskatalog-Metadaten, ohne die Provider-Laufzeit zu laden.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                              |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                              |
| `method`              | Ja           | `string`                                        | Auth-Methoden-ID, an die weitergeleitet werden soll.                                                   |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Auswahl-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                          |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Beschriftung. Wenn ausgelassen, fällt OpenClaw auf `choiceId` zurück.                  |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                      |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.              |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistentenauswahlen aus, erlaubt aber weiterhin die manuelle CLI-Auswahl.      |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Legacy-Auswahl-IDs, die Benutzer zu dieser Ersatzauswahl umleiten sollen.                              |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlen.                                              |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Beschriftung für diese Gruppe.                                                         |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                       |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit einem Flag.                                    |
| `cliFlag`             | Nein         | `string`                                        | CLI-Flag-Name, z. B. `--openrouter-api-key`.                                                           |
| `cliOption`           | Nein         | `string`                                        | Vollständige CLI-Optionsform, z. B. `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                     |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | Onboarding-Oberflächen, auf denen diese Auswahl erscheinen soll. Wenn ausgelassen, ist der Standard `["text-inference"]`. |

## Referenz für commandAliases

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                         |
| ------------ | ------------ | ----------------- | --------------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                         |
| `kind`       | Nein         | `"runtime-slash"` | Markiert den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.               |
| `cliCommand` | Nein         | `string`          | Zugehöriger Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen wird, falls vorhanden. |

## activation-Referenz

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Control-Plane-Ereignisse
es in einen Aktivierungs-/Ladeplan aufnehmen sollten.

Dieser Block ist Planner-Metadaten, keine Lifecycle-API. Er registriert kein
Runtime-Verhalten, ersetzt nicht `register(...)` und verspricht nicht, dass
Plugin-Code bereits ausgeführt wurde. Der Aktivierungs-Planner verwendet diese Felder, um
Kandidaten-Plugins einzugrenzen, bevor er auf vorhandene Manifest-Ownership-
Metadaten wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks zurückfällt.

Bevorzugen Sie die engste Metadatenform, die Ownership bereits beschreibt. Verwenden Sie
`providers`, `channels`, `commandAliases`, Setup-Deskriptoren oder `contracts`,
wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planner-
Hinweise, die sich nicht durch diese Ownership-Felder darstellen lassen.
Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Runtime-Aliase wie `claude-cli`,
`codex-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist nur für
eingebettete Agent-Harness-IDs gedacht, die nicht bereits ein Ownership-Feld haben.

Dieser Block enthält nur Metadaten. Er registriert kein Runtime-Verhalten und ersetzt
nicht `register(...)`, `setupEntry` oder andere Runtime-/Plugin-Einstiegspunkte.
Aktuelle Consumer verwenden ihn als Eingrenzungshinweis vor breiterem Plugin-Laden, daher
kostet fehlende Nicht-Startup-Aktivierungsmetadaten normalerweise nur Leistung; sie
sollten die Korrektheit nicht ändern, solange Manifest-Ownership-Fallbacks weiterhin existieren.

Jedes Plugin sollte `activation.onStartup` bewusst setzen. Setzen Sie es nur dann auf `true`,
wenn das Plugin während des Gateway-Starts ausgeführt werden muss. Setzen Sie es auf `false`, wenn
das Plugin beim Start inaktiv ist und nur durch engere Trigger geladen werden sollte.
Wird `onStartup` weggelassen, wird das Plugin nicht mehr implizit beim Start geladen; verwenden Sie explizite
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
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                                |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Eingebettete Agent-Harness-Runtime-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliase.              |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                                 |
| `onChannels`       | Nein         | `string[]`                                           | Channel-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                                 |
| `onRoutes`         | Nein         | `string[]`                                           | Routenarten, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollten.                                                                                                                 |
| `onConfigPaths`    | Nein         | `string[]`                                           | Root-relative Konfigurationspfade, die dieses Plugin in Startup-/Ladepläne aufnehmen sollten, wenn der Pfad vorhanden und nicht explizit deaktiviert ist.                                    |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Capability-Hinweise, die von der Control-Plane-Aktivierungsplanung verwendet werden. Bevorzugen Sie nach Möglichkeit engere Felder.                                                   |

Aktuelle Live-Consumer:

- Gateway-Startup-Planung verwendet `activation.onStartup` für expliziten Startup-
  Import
- durch Befehle ausgelöste CLI-Planung fällt auf legacy
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Agent-Runtime-Startup-Planung verwendet `activation.onAgentHarnesses` für
  eingebettete Harnesses und `cliBackends[]` auf oberster Ebene für CLI-Runtime-Aliase
- durch Channels ausgelöste Setup-/Channel-Planung fällt auf legacy `channels[]`-
  Ownership zurück, wenn explizite Channel-Aktivierungsmetadaten fehlen
- Startup-Plugin-Planung verwendet `activation.onConfigPaths` für Nicht-Channel-Root-
  Konfigurationsflächen wie den `browser`-Block des gebündelten Browser-Plugins
- durch Provider ausgelöste Setup-/Runtime-Planung fällt auf legacy
  `providers[]` und `cliBackends[]`-Ownership auf oberster Ebene zurück, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

Planner-Diagnosen können explizite Aktivierungshinweise von Manifest-
Ownership-Fallback unterscheiden. Beispielsweise bedeutet `activation-command-hint`, dass
`activation.onCommands` gepasst hat, während `manifest-command-alias` bedeutet, dass der
Planner stattdessen `commandAliases`-Ownership verwendet hat. Diese Reason-Labels sind für
Host-Diagnosen und Tests; Plugin-Autoren sollten weiterhin die Metadaten deklarieren,
die Ownership am besten beschreiben.

## qaRunners-Referenz

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb
des gemeinsamen `openclaw qa`-Root beiträgt. Halten Sie diese Metadaten günstig und statisch; die Plugin-
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

| Feld          | Erforderlich | Typ      | Bedeutung                                                            |
| ------------- | ------------ | -------- | -------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl, der unterhalb von `openclaw qa` eingehängt wird, zum Beispiel `matrix`. |
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
Backends. `setup.cliBackends` ist die setup-spezifische Deskriptoroberfläche für
Control-Plane-/Setup-Flows, die ausschließlich Metadaten bleiben sollten.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
deskriptororientierte Lookup-Oberfläche für Setup-Erkennung. Wenn der Deskriptor nur
das Kandidaten-Plugin eingrenzt und Setup weiterhin umfangreichere Runtime-Hooks zur Setup-Zeit
benötigt, setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als
Fallback-Ausführungspfad bei.

OpenClaw bezieht außerdem `setup.providers[].envVars` in generische Provider-Auth- und
Env-Var-Lookups ein. `providerAuthEnvVars` bleibt während des Deprecation-Zeitfensters
über einen Kompatibilitätsadapter unterstützt, aber nicht gebündelte Plugins, die es weiterhin verwenden,
erhalten eine Manifest-Diagnose. Neue Plugins sollten Setup-/Status-Env-Metadaten
in `setup.providers[].envVars` ablegen.

OpenClaw kann außerdem einfache Setup-Auswahlen aus `setup.providers[].authMethods`
ableiten, wenn kein Setup-Eintrag verfügbar ist oder wenn `setup.requiresRuntime: false`
deklariert, dass Setup-Runtime unnötig ist. Explizite `providerAuthChoices`-Einträge bleiben
für benutzerdefinierte Labels, CLI-Flags, Onboarding-Scope und Assistant-Metadaten bevorzugt.

Setzen Sie `requiresRuntime: false` nur, wenn diese Deskriptoren für die
Setup-Oberfläche ausreichen. OpenClaw behandelt explizites `false` als reinen Deskriptorvertrag
und führt `setup-api` oder `openclaw.setupEntry` für Setup-Lookup nicht aus. Wenn
ein reines Deskriptor-Plugin dennoch einen dieser Setup-Runtime-Einträge ausliefert,
meldet OpenClaw eine additive Diagnose und ignoriert ihn weiterhin. Ein weggelassenes
`requiresRuntime` behält legacy Fallback-Verhalten bei, damit vorhandene Plugins, die
Deskriptoren ohne das Flag hinzugefügt haben, nicht brechen.

Da Setup-Lookup Plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte
`setup.providers[].id`- und `setup.cliBackends[]`-Werte über alle
erkannten Plugins hinweg eindeutig bleiben. Mehrdeutige Ownership schlägt geschlossen fehl, statt einen
Gewinner aus der Erkennungsreihenfolge auszuwählen.

Wenn Setup-Runtime ausgeführt wird, melden Setup-Registry-Diagnosen Deskriptor-
Drift, wenn `setup-api` einen Provider oder ein CLI-Backend registriert, den bzw. das die Manifest-
Deskriptoren nicht deklarieren, oder wenn ein Deskriptor keine passende Runtime-
Registrierung hat. Diese Diagnosen sind additiv und lehnen legacy Plugins nicht ab.

### setup.providers-Referenz

| Feld           | Erforderlich | Typ        | Bedeutung                                                                                         |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding offengelegt wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods`  | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Provider unterstützt, ohne die vollständige Runtime zu laden. |
| `envVars`      | Nein         | `string[]` | Env-Vars, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Runtime lädt.   |
| `authEvidence` | Nein         | `object[]` | Günstige lokale Auth-Evidence-Prüfungen für Provider, die sich über nicht geheime Marker authentifizieren können. |

`authEvidence` ist für Provider-eigene lokale Anmeldedatenmarker vorgesehen, die
ohne Laden von Runtime-Code verifiziert werden können. Diese Prüfungen müssen
kostengünstig und lokal bleiben: keine Netzwerkaufrufe, keine Lesezugriffe auf
Keychain oder Secret-Manager, keine Shell-Befehle und keine Provider-API-Probes.

Unterstützte Evidence-Einträge:

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                                    |
| ------------------ | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja           | `string`   | Derzeit `local-file-with-env`.                                                                                               |
| `fileEnvVar`       | Nein         | `string`   | Umgebungsvariable, die einen expliziten Pfad zur Anmeldedatendatei enthält.                                                  |
| `fallbackPaths`    | Nein         | `string[]` | Lokale Pfade zu Anmeldedatendateien, die geprüft werden, wenn `fileEnvVar` fehlt oder leer ist. Unterstützt `${HOME}` und `${APPDATA}`. |
| `requiresAnyEnv`   | Nein         | `string[]` | Mindestens eine der aufgeführten Umgebungsvariablen muss nicht leer sein, bevor die Evidence gültig ist.                     |
| `requiresAllEnv`   | Nein         | `string[]` | Jede aufgeführte Umgebungsvariable muss nicht leer sein, bevor die Evidence gültig ist.                                      |
| `credentialMarker` | Ja           | `string`   | Nicht geheimer Marker, der zurückgegeben wird, wenn die Evidence vorhanden ist.                                               |
| `source`           | Nein         | `string`   | Für Benutzer sichtbares Quellenlabel für Auth-/Statusausgaben.                                                               |

### setup-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                      |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding bereitgestellt werden.                           |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit für deskriptorbasierte Setup-Suche. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins gehören.                            |
| `requiresRuntime`  | Nein         | `boolean`  | Ob Setup nach der Deskriptorsuche weiterhin `setup-api`-Ausführung benötigt.                                   |

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

| Feld          | Typ        | Bedeutung                                             |
| ------------- | ---------- | ----------------------------------------------------- |
| `label`       | `string`   | Für Benutzer sichtbares Feldlabel.                    |
| `help`        | `string`   | Kurzer Hilfetext.                                     |
| `tags`        | `string[]` | Optionale UI-Tags.                                    |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.                      |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel.           |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.                 |

## contracts-Referenz

Verwenden Sie `contracts` nur für statische Metadaten zur Capability-Zuständigkeit, die OpenClaw
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

| Feld                             | Typ        | Bedeutung                                                                 |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Extension-Factory-IDs des Codex-App-Servers, derzeit `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-IDs, für die ein gebündeltes Plugin Tool-Result-Middleware registrieren darf. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Auth-Profile diesem Plugin gehört.  |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                          |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-Transcription-Provider-IDs, die diesem Plugin gehören.           |
| `realtimeVoiceProviders`         | `string[]` | Realtime-Voice-Provider-IDs, die diesem Plugin gehören.                  |
| `memoryEmbeddingProviders`       | `string[]` | Memory-Embedding-Provider-IDs, die diesem Plugin gehören.                |
| `mediaUnderstandingProviders`    | `string[]` | Media-Understanding-Provider-IDs, die diesem Plugin gehören.             |
| `imageGenerationProviders`       | `string[]` | Image-Generation-Provider-IDs, die diesem Plugin gehören.                |
| `videoGenerationProviders`       | `string[]` | Video-Generation-Provider-IDs, die diesem Plugin gehören.                |
| `webFetchProviders`              | `string[]` | Web-Fetch-Provider-IDs, die diesem Plugin gehören.                       |
| `webSearchProviders`             | `string[]` | Web-Search-Provider-IDs, die diesem Plugin gehören.                      |
| `migrationProviders`             | `string[]` | Import-Provider-IDs, die diesem Plugin für `openclaw migrate` gehören.   |
| `tools`                          | `string[]` | Agent-Tool-Namen, die diesem Plugin gehören.                             |

`contracts.embeddedExtensionFactories` bleibt für gebündelte, nur für den Codex-App-Server bestimmte
Extension-Factories erhalten. Gebündelte Tool-Result-Transformationen sollten stattdessen
`contracts.agentToolResultMiddleware` deklarieren und sich mit
`api.registerAgentToolResultMiddleware(...)` registrieren. Externe Plugins können keine
Tool-Result-Middleware registrieren, da die Schnittstelle vertrauenswürdige Tool-Ausgaben
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
integrierter Adapter wie `local`. Eigenständige CLI-Pfade verwenden diesen Manifest-Contract,
um nur das zuständige Plugin zu laden, bevor die vollständige Gateway-Runtime
Provider registriert hat.

## mediaUnderstandingProviderMetadata-Referenz

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Media-Understanding-Provider
Standardmodelle, Auto-Auth-Fallback-Priorität oder native Dokumentunterstützung hat, die
generische Core-Helfer benötigen, bevor die Runtime lädt. Schlüssel müssen auch in
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Von diesem Provider bereitgestellte Medien-Capabilities.                  |
| `defaultModels`        | `Record<string, string>`            | Capability-zu-Modell-Standards, die verwendet werden, wenn die Konfiguration kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden bei automatischem, an Anmeldedaten gebundenem Provider-Fallback früher sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Vom Provider unterstützte native Dokumenteingaben.                         |

## channelConfigs-Referenz

Verwenden Sie `channelConfigs`, wenn ein Channel-Plugin kostengünstige Konfigurationsmetadaten benötigt, bevor
die Runtime lädt. Schreibgeschützte Channel-Setup-/Status-Erkennung kann diese Metadaten
direkt für konfigurierte externe Channels verwenden, wenn kein Setup-Eintrag verfügbar ist oder
wenn `setup.requiresRuntime: false` deklariert, dass Setup-Runtime unnötig ist.

`channelConfigs` ist Plugin-Manifest-Metadaten, kein neuer Top-Level-Abschnitt der Benutzerkonfiguration.
Benutzer konfigurieren Channel-Instanzen weiterhin unter `channels.<channel-id>`.
OpenClaw liest Manifest-Metadaten, um zu entscheiden, welchem Plugin dieser konfigurierte
Channel gehört, bevor Plugin-Runtime-Code ausgeführt wird.

Für ein Channel-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche
Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten auch passende
`channelConfigs`-Einträge deklarieren. Ohne sie kann OpenClaw das Plugin weiterhin laden, aber
Konfigurationsschema, Setup und Control-UI-Oberflächen auf Cold Paths können die
Form der Channel-eigenen Optionen erst kennen, wenn die Plugin-Runtime ausgeführt wird.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und
`nativeSkillsAutoEnabled` können statische `auto`-Standards für Command-Konfigurationsprüfungen
deklarieren, die vor dem Laden der Channel-Runtime ausgeführt werden. Gebündelte Channels können
dieselben Standards auch über `package.json#openclaw.channel.commands` zusammen mit
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

| Feld          | Typ                      | Bedeutung                                                                                |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema für `channels.<id>`. Erforderlich für jeden deklarierten Kanalkonfigurationseintrag. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Labels/Platzhalter/Sensitivitätshinweise für diesen Kanalkonfigurationsabschnitt. |
| `label`       | `string`                 | Kanal-Label, das in Auswahl- und Inspect-Oberflächen übernommen wird, wenn Runtime-Metadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspect- und Katalogoberflächen.                             |
| `commands`    | `object`                 | Statische native Befehls- und native Skill-Auto-Defaults für Konfigurationsprüfungen vor der Runtime. |
| `preferOver`  | `string[]`               | Legacy- oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

### Ein anderes Kanal-Plugin ersetzen

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Besitzer für eine Kanal-ID ist, die
ein anderes Plugin ebenfalls bereitstellen kann. Häufige Fälle sind eine umbenannte Plugin-ID, ein
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
Runtime-Konfiguration, damit ein Plugin den Kanal und seine Tools besitzt. Eine explizite
Benutzerauswahl hat weiterhin Vorrang: Wenn der Benutzer beide Plugins explizit aktiviert,
behält OpenClaw diese Auswahl bei und meldet Diagnosen zu doppelten Kanälen/Tools, statt
die angeforderte Plugin-Menge stillschweigend zu ändern.

Beschränken Sie `preferOver` auf Plugin-IDs, die wirklich denselben Kanal bereitstellen können.
Es ist kein allgemeines Prioritätsfeld und benennt keine Benutzerkonfigurationsschlüssel um.

## modelSupport-Referenz

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

OpenClaw wendet diese Rangfolge an:

- explizite `provider/model`-Referenzen verwenden die zugehörigen `providers`-Manifestmetadaten
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte
  Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                               |
| --------------- | ---------- | ----------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden. |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach Entfernung des Profilsuffixes gegen Kurzform-Modell-IDs abgeglichen werden. |

## modelCatalog-Referenz

Verwenden Sie `modelCatalog`, wenn OpenClaw Provider-Modellmetadaten kennen soll, bevor
die Plugin-Runtime geladen wird. Dies ist die Manifest-eigene Quelle für feste Katalogzeilen,
Provider-Aliasse, Unterdrückungsregeln und Discovery-Modus. Die Runtime-Aktualisierung
gehört weiterhin in den Provider-Runtime-Code, aber das Manifest teilt dem Kern mit, wann Runtime
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

| Feld           | Typ                                                      | Bedeutung                                                                                                  |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Schlüssel sollten auch in `providers` der obersten Ebene erscheinen. |
| `aliases`      | `Record<string, object>`                                 | Provider-Aliasse, die für Katalog- oder Unterdrückungsplanung zu einem eigenen Provider aufgelöst werden sollen. |
| `suppressions` | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus Provider-spezifischem Grund unterdrückt.      |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Ob der Provider-Katalog aus Manifestmetadaten gelesen, in den Cache aktualisiert werden kann oder Runtime erfordert. |

`aliases` ist an der Provider-Besitzsuche für die Modellkatalogplanung beteiligt.
Alias-Ziele müssen Provider der obersten Ebene sein, die demselben Plugin gehören. Wenn eine
Provider-gefilterte Liste einen Alias verwendet, kann OpenClaw das zugehörige Manifest lesen und
Alias-API-/Basis-URL-Overrides anwenden, ohne die Provider-Runtime zu laden.
Aliasse erweitern ungefilterte Katalogauflistungen nicht; breite Listen geben nur die zugehörigen
kanonischen Provider-Zeilen aus.

`suppressions` ersetzt den alten Provider-Runtime-Hook `suppressBuiltInModel`.
Unterdrückungseinträge werden nur berücksichtigt, wenn der Provider dem Plugin gehört oder
als `modelCatalog.aliases`-Schlüssel deklariert ist, der auf einen eigenen Provider zeigt. Runtime-
Unterdrückungs-Hooks werden während der Modellauflösung nicht mehr aufgerufen.

Provider-Felder:

| Feld      | Typ                      | Bedeutung                                                           |
| --------- | ------------------------ | ------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionale Standard-Basis-URL für Modelle in diesem Provider-Katalog. |
| `api`     | `ModelApi`               | Optionaler Standard-API-Adapter für Modelle in diesem Provider-Katalog. |
| `headers` | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten. |
| `models`  | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.      |

Modellfelder:

| Feld            | Typ                                                            | Bedeutung                                                                  |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                    |
| `name`          | `string`                                                       | Optionaler Anzeigename.                                                    |
| `api`           | `ModelApi`                                                     | Optionaler API-Override pro Modell.                                        |
| `baseUrl`       | `string`                                                       | Optionaler Basis-URL-Override pro Modell.                                  |
| `headers`       | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                     |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitäten, die das Modell akzeptiert.                                    |
| `reasoning`     | `boolean`                                                      | Ob das Modell Reasoning-Verhalten bereitstellt.                            |
| `contextWindow` | `number`                                                       | Native Provider-Kontextfenstergröße.                                       |
| `contextTokens` | `number`                                                       | Optionale effektive Runtime-Kontextobergrenze, wenn sie von `contextWindow` abweicht. |
| `maxTokens`     | `number`                                                       | Maximale Ausgabetokens, sofern bekannt.                                    |
| `cost`          | `object`                                                       | Optionale Preise in USD pro Million Tokens, einschließlich optionalem `tieredPricing`. |
| `compat`        | `object`                                                       | Optionale Kompatibilitätsflags passend zur OpenClaw-Modellkonfigurationskompatibilität. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Auflistungsstatus. Nur unterdrücken, wenn die Zeile überhaupt nicht erscheinen darf. |
| `statusReason`  | `string`                                                       | Optionaler Grund, der bei nicht verfügbarem Status angezeigt wird.         |
| `replaces`      | `string[]`                                                     | Ältere Provider-lokale Modell-IDs, die dieses Modell ersetzt.              |
| `replacedBy`    | `string`                                                       | Provider-lokale Ersatzmodell-ID für veraltete Zeilen.                      |
| `tags`          | `string[]`                                                     | Stabile Tags, die von Auswahlkomponenten und Filtern verwendet werden.     |

Unterdrückungsfelder:

| Feld                       | Typ        | Bedeutung                                                                                                  |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-ID für die zu unterdrückende Upstream-Zeile. Muss diesem Plugin gehören oder als eigener Alias deklariert sein. |
| `model`                    | `string`   | Provider-lokale Modell-ID, die unterdrückt werden soll.                                                    |
| `reason`                   | `string`   | Optionale Meldung, die angezeigt wird, wenn die unterdrückte Zeile direkt angefordert wird.                |
| `when.baseUrlHosts`        | `string[]` | Optionale Liste effektiver Provider-Basis-URL-Hosts, die erforderlich sind, bevor die Unterdrückung greift. |
| `when.providerConfigApiIn` | `string[]` | Optionale Liste exakter Provider-Konfigurationswerte für `api`, die erforderlich sind, bevor die Unterdrückung greift. |

Legen Sie keine rein runtimebezogenen Daten in `modelCatalog` ab. Verwenden Sie `static` nur, wenn Manifestzeilen vollständig genug sind, damit providergefilterte Listen- und Auswahloberflächen Registry-/Runtime-Ermittlung überspringen können. Verwenden Sie `refreshable`, wenn Manifestzeilen nützliche auflistbare Startwerte oder Ergänzungen sind, ein Refresh/Cache später aber weitere Zeilen hinzufügen kann; refreshable-Zeilen sind für sich genommen nicht maßgeblich. Verwenden Sie `runtime`, wenn OpenClaw die Provider-Runtime laden muss, um die Liste zu kennen.

## modelIdNormalization-Referenz

Verwenden Sie `modelIdNormalization` für kostengünstige, vom Provider verantwortete Model-ID-Bereinigung, die vor dem Laden der Provider-Runtime erfolgen muss. Dadurch bleiben Aliase wie kurze Modellnamen, providerlokale Legacy-IDs und Proxy-Präfixregeln im Manifest des zuständigen Plugins statt in Core-Tabellen für die Modellauswahl.

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

| Feld                                 | Typ                     | Bedeutung                                                                                           |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Groß-/kleinschreibungsunabhängige exakte Model-ID-Aliase. Werte werden wie geschrieben zurückgegeben. |
| `stripPrefixes`                      | `string[]`              | Präfixe, die vor der Alias-Suche entfernt werden; nützlich bei Legacy-Duplizierung von Provider/Modell. |
| `prefixWhenBare`                     | `string`                | Präfix, das hinzugefügt wird, wenn die normalisierte Model-ID noch kein `/` enthält.                 |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Bedingte Präfixregeln für Bare-IDs nach der Alias-Suche, nach `modelPrefix` und `prefix` indiziert. |

## providerEndpoints-Referenz

Verwenden Sie `providerEndpoints` für die Endpunktklassifizierung, die generische Request-Richtlinien vor dem Laden der Provider-Runtime kennen müssen. Core verantwortet weiterhin die Bedeutung jeder `endpointClass`; Plugin-Manifeste verantworten die Metadaten zu Host und Basis-URL.

Endpunktfelder:

| Feld                           | Typ        | Bedeutung                                                                                                 |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekannte Core-Endpunktklasse, etwa `openrouter`, `moonshot-native` oder `google-vertex`.                  |
| `hosts`                        | `string[]` | Exakte Hostnamen, die der Endpunktklasse zugeordnet werden.                                               |
| `hostSuffixes`                 | `string[]` | Host-Suffixe, die der Endpunktklasse zugeordnet werden. Stellen Sie `.` voran, um nur Domain-Suffixe abzugleichen. |
| `baseUrls`                     | `string[]` | Exakte normalisierte HTTP(S)-Basis-URLs, die der Endpunktklasse zugeordnet werden.                        |
| `googleVertexRegion`           | `string`   | Statische Google-Vertex-Region für exakte globale Hosts.                                                  |
| `googleVertexRegionHostSuffix` | `string`   | Suffix, das aus passenden Hosts entfernt wird, um das Google-Vertex-Regionspräfix offenzulegen.           |

## providerRequest-Referenz

Verwenden Sie `providerRequest` für kostengünstige Metadaten zur Request-Kompatibilität, die generische Request-Richtlinien benötigen, ohne die Provider-Runtime zu laden. Belassen Sie verhaltensspezifisches Payload-Rewriting in Provider-Runtime-Hooks oder gemeinsam genutzten Provider-Family-Helfern.

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

| Feld                  | Typ          | Bedeutung                                                                                 |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `family`              | `string`     | Provider-Family-Label, das von generischen Entscheidungen zur Request-Kompatibilität und Diagnosen verwendet wird. |
| `compatibilityFamily` | `"moonshot"` | Optionaler Provider-Family-Kompatibilitätsbereich für gemeinsame Request-Helfer.           |
| `openAICompletions`   | `object`     | OpenAI-kompatible Flags für Completions-Requests, derzeit `supportsStreamingUsage`.        |

## modelPricing-Referenz

Verwenden Sie `modelPricing`, wenn ein Provider Preisverhalten auf Control-Plane-Ebene vor dem Laden der Runtime benötigt. Der Gateway-Preiscache liest diese Metadaten, ohne Provider-Runtime-Code zu importieren.

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
| `external`   | `boolean`         | Setzen Sie dies für lokale/selbst gehostete Provider, die niemals OpenRouter- oder LiteLLM-Preise abrufen sollen, auf `false`. |
| `openRouter` | `false \| object` | Mapping für die OpenRouter-Preisabfrage. `false` deaktiviert die OpenRouter-Abfrage für diesen Provider.   |
| `liteLLM`    | `false \| object` | Mapping für die LiteLLM-Preisabfrage. `false` deaktiviert die LiteLLM-Abfrage für diesen Provider.         |

Quellfelder:

| Feld                       | Typ                | Bedeutung                                                                                                             |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe Katalog-Provider-ID, wenn sie von der OpenClaw-Provider-ID abweicht, zum Beispiel `z-ai` für einen `zai`-Provider. |
| `passthroughProviderModel` | `boolean`          | Behandelt Model-IDs mit Schrägstrich als verschachtelte Provider/Modell-Referenzen; nützlich für Proxy-Provider wie OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Zusätzliche Model-ID-Varianten für externe Kataloge. `version-dots` versucht gepunktete Versions-IDs wie `claude-opus-4.6`. |

### OpenClaw Provider Index

Der OpenClaw Provider Index ist von OpenClaw verantwortete Vorschaumetadaten für Provider, deren Plugins möglicherweise noch nicht installiert sind. Er ist nicht Teil eines Plugin-Manifests. Plugin-Manifeste bleiben die maßgebliche Quelle für installierte Plugins. Der Provider Index ist der interne Fallback-Vertrag, den zukünftige Oberflächen für installierbare Provider und Modellauswahl vor der Installation nutzen, wenn ein Provider-Plugin nicht installiert ist.

Reihenfolge der Katalogautorität:

1. Benutzerkonfiguration.
2. `modelCatalog` des installierten Plugin-Manifests.
3. Modellkatalog-Cache aus explizitem Refresh.
4. Vorschauzeilen des OpenClaw Provider Index.

Der Provider Index darf keine Secrets, aktivierten Zustände, Runtime-Hooks oder Live-Modell-Daten enthalten, die kontospezifisch sind. Seine Vorschaukataloge verwenden dieselbe `modelCatalog`-Provider-Zeilenform wie Plugin-Manifeste, sollten aber auf stabile Anzeigemetadaten beschränkt bleiben, sofern Runtime-Adapter-Felder wie `api`, `baseUrl`, Preise oder Kompatibilitäts-Flags nicht absichtlich mit dem installierten Plugin-Manifest synchron gehalten werden. Provider mit Live-`/models`-Ermittlung sollten aktualisierte Zeilen über den expliziten Modellkatalog-Cache-Pfad schreiben, statt normale Auflistung oder Onboarding Provider-APIs aufrufen zu lassen.

Provider-Index-Einträge können außerdem Metadaten zu installierbaren Plugins für Provider enthalten, deren Plugin aus Core herausgelöst wurde oder anderweitig noch nicht installiert ist. Diese Metadaten spiegeln das Muster des Kanalkatalogs wider: Paketname, npm-Installationsspezifikation, erwartete Integrität und kostengünstige Labels für Auth-Auswahl reichen aus, um eine installierbare Setup-Option anzuzeigen. Sobald das Plugin installiert ist, gewinnt sein Manifest und der Provider-Index-Eintrag für diesen Provider wird ignoriert.

Legacy-Top-Level-Capability-Schlüssel sind veraltet. Verwenden Sie `openclaw doctor --fix`, um `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; normales Manifest-Laden behandelt diese Top-Level-Felder nicht mehr als Capability-Verantwortung.

## Manifest im Vergleich zu package.json

Die beiden Dateien haben unterschiedliche Aufgaben:

| Datei                  | Verwenden für                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Ermittlung, Konfigurationsvalidierung, Auth-Auswahl-Metadaten und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code läuft |
| `package.json`         | npm-Metadaten, Dependency-Installation und den `openclaw`-Block, der für Einstiegspunkte, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wohin ein Metadatum gehört, verwenden Sie diese Regel:

- Wenn OpenClaw es vor dem Laden von Plugin-Code kennen muss, legen Sie es in `openclaw.plugin.json` ab
- Wenn es um Paketierung, Einstiegspunktdateien oder npm-Installationsverhalten geht, legen Sie es in `package.json` ab

### package.json-Felder, die die Ermittlung beeinflussen

Einige Plugin-Metadaten vor der Runtime liegen bewusst in `package.json` unter dem `openclaw`-Block statt in `openclaw.plugin.json`.
`openclaw.bundle` und `openclaw.bundle.json` sind keine OpenClaw-Plugin-Verträge; native Plugins müssen `openclaw.plugin.json` plus die unten unterstützten `package.json#openclaw`-Felder verwenden.

Wichtige Beispiele:

| Feld                                                                                       | Bedeutung                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Deklariert native Plugin-Einstiegspunkte. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                                      |
| `openclaw.runtimeExtensions`                                                               | Deklariert gebaute JavaScript-Runtime-Einstiegspunkte für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                 |
| `openclaw.setupEntry`                                                                      | Leichtgewichtiger, nur für die Einrichtung verwendeter Einstiegspunkt, der während Onboarding, verzögertem Kanalstart und schreibgeschützter Kanalstatus-/SecretRef-Erkennung genutzt wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                                               | Deklariert den gebauten JavaScript-Einrichtungs-Einstiegspunkt für installierte Pakete. Erfordert `setupEntry`, muss existieren und muss innerhalb des Plugin-Paketverzeichnisses bleiben.            |
| `openclaw.channel`                                                                         | Günstige Kanal-Katalogmetadaten wie Bezeichnungen, Dokumentationspfade, Aliase und Auswahltext.                                                                                                       |
| `openclaw.channel.commands`                                                                | Statische native Befehle und Metadaten für native Skill-Autostandards, die von Konfigurations-, Audit- und Befehlslistenoberflächen verwendet werden, bevor die Kanal-Runtime geladen wird.           |
| `openclaw.channel.configuredState`                                                         | Leichtgewichtige Checker-Metadaten für den konfigurierten Zustand, die die Frage „existiert eine reine Env-Einrichtung bereits?“ beantworten können, ohne die vollständige Kanal-Runtime zu laden.    |
| `openclaw.channel.persistedAuthState`                                                      | Leichtgewichtige Checker-Metadaten für persistierten Authentifizierungsstatus, die die Frage „ist bereits etwas angemeldet?“ beantworten können, ohne die vollständige Kanal-Runtime zu laden.         |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installations-/Update-Hinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                                     |
| `openclaw.install.defaultChoice`                                                           | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                                       |
| `openclaw.install.minHostVersion`                                                          | Minimal unterstützte OpenClaw-Hostversion unter Verwendung einer semver-Untergrenze wie `>=2026.3.22` oder `>=2026.5.1-beta.1`.                                                                       |
| `openclaw.install.expectedIntegrity`                                                       | Erwarteter npm-dist-Integritätsstring wie `sha512-...`; Installations- und Update-Flows verifizieren das abgerufene Artefakt dagegen.                                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Ermöglicht das Laden von nur für die Einrichtung verwendeten Kanaloberflächen vor dem vollständigen Kanal-Plugin während des Starts.                                                                   |

Manifestmetadaten entscheiden, welche Provider-/Kanal-/Einrichtungsoptionen im
Onboarding angezeigt werden, bevor die Runtime geladen wird. `package.json#openclaw.install` teilt dem
Onboarding mit, wie dieses Plugin abgerufen oder aktiviert wird, wenn der Benutzer eine dieser
Optionen auswählt. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der
Manifest-Registry für nicht gebündelte Plugin-Quellen durchgesetzt. Ungültige Werte werden abgelehnt;
neuere, aber gültige Werte überspringen externe Plugins auf älteren Hosts. Gebündelte Quell-
Plugins gelten als gemeinsam mit dem Host-Checkout versioniert.

Offizielle Install-on-Demand-Metadaten sollten `clawhubSpec` verwenden, wenn das Plugin auf
ClawHub veröffentlicht ist; Onboarding behandelt dies als bevorzugte Remote-Quelle und
zeichnet ClawHub-Artefaktfakten nach der Installation auf. `npmSpec` bleibt die Kompatibilitäts-
Ausweichlösung für Pakete, die noch nicht zu ClawHub gewechselt sind.

Exakte npm-Versionspinnung befindet sich bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalog-
Einträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Update-Flows
geschlossen fehlschlagen, wenn das abgerufene npm-Artefakt nicht mehr zur gepinnten Version passt.
Interaktives Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige Registry-npm-Spezifikationen an,
einschließlich bloßer Paketnamen und dist-tags. Katalogdiagnosen können
exakte, gleitende, integritätsgepinnte, fehlende Integrität, Paketnamen-
Nichtübereinstimmungen und ungültige Standardauswahlquellen unterscheiden. Sie warnen auch, wenn
`expectedIntegrity` vorhanden ist, es aber keine gültige npm-Quelle gibt, die dadurch gepinnt werden kann.
Wenn `expectedIntegrity` vorhanden ist,
erzwingen Installations-/Update-Flows sie; wenn sie ausgelassen wird, wird die Registry-Auflösung
ohne Integritätspin aufgezeichnet.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Kanalliste
oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige
Runtime zu laden. Der Einrichtungseintrag sollte Kanalmetadaten sowie einrichtungssichere Konfigurations-,
Status- und Geheimnisadapter bereitstellen; belassen Sie Netzwerkclients, Gateway-Listener und
Transport-Runtimes im Haupterweiterungs-Einstiegspunkt.

Runtime-Einstiegspunktfelder setzen Paketgrenzenprüfungen für Quell-
Einstiegspunktfelder nicht außer Kraft. Zum Beispiel kann `openclaw.runtimeExtensions` einen
ausbrechenden `openclaw.extensions`-Pfad nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es macht
nicht beliebige defekte Konfigurationen installierbar. Heute erlaubt es Installations-
Flows nur, bestimmte veraltete Upgrade-Fehler gebündelter Plugins wiederherzustellen, wie einen
fehlenden Pfad zu einem gebündelten Plugin oder einen veralteten `channels.<id>`-Eintrag für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und verweisen Operatoren
auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadatum für ein kleines Checker-
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
Ja/Nein-Authentifizierungsprüfung benötigen, bevor das vollständige Kanal-Plugin geladen wird. Persistierter Authentifizierungsstatus ist
kein konfigurierter Kanalzustand: Verwenden Sie diese Metadaten nicht, um Plugins automatisch zu aktivieren,
Runtime-Abhängigkeiten zu reparieren oder zu entscheiden, ob eine Kanal-Runtime geladen werden soll.
Der Ziel-Export sollte eine kleine Funktion sein, die nur persistierten Zustand liest; leiten Sie
ihn nicht durch den vollständigen Kanal-Runtime-Barrel.

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

OpenClaw entdeckt Plugins aus mehreren Wurzeln (gebündelt, globale Installation, Workspace, explizite per Konfiguration ausgewählte Pfade). Wenn zwei Entdeckungen dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Priorität** beibehalten; Duplikate mit niedrigerer Priorität werden verworfen, statt daneben geladen zu werden.

Priorität, von der höchsten zur niedrigsten:

1. **Per Konfiguration ausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` gepinnt ist
2. **Gebündelt** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Globale Installation** — Plugins, die im globalen OpenClaw-Plugin-Stamm installiert sind
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace entdeckt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich durch ein lokales zu überschreiben, pinnen Sie es über `plugins.entries.<id>`, sodass es aufgrund der Priorität gewinnt, statt sich auf Workspace-Erkennung zu verlassen.
- Verworfene Duplikate werden protokolliert, damit Doctor und Startdiagnosen auf die verworfene Kopie verweisen können.
- Per Konfiguration ausgewählte Duplikat-Überschreibungen werden in Diagnosen als explizite Überschreibungen formuliert, warnen aber weiterhin, damit veraltete Forks und versehentliche Überschattungen sichtbar bleiben.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema ausliefern**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Runtime.
- Wenn Sie ein gebündeltes Plugin mit neuen Konfigurationsschlüsseln erweitern oder forken, aktualisieren Sie gleichzeitig das `openclaw.plugin.json`-`configSchema` dieses Plugins. Schemas gebündelter Plugins sind strikt, daher wird das Hinzufügen von `plugins.entries.<id>.config.myNewKey` in der Benutzerkonfiguration ohne Hinzufügen von `myNewKey` zu `configSchema.properties` abgelehnt, bevor die Plugin-Runtime geladen wird.

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
  müssen auf **entdeckbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, wird die Konfiguration beibehalten und
  in Doctor und Logs eine **Warnung** angezeigt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration) für das vollständige `plugins.*`-Schema.

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge. Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der Erkennung + Validierung.
- Native Manifeste werden mit JSON5 geparst, daher werden Kommentare, nachgestellte Kommas und nicht in Anführungszeichen gesetzte Schlüssel akzeptiert, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie benutzerdefinierte Top-Level-Schlüssel.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerCatalogEntry` muss leichtgewichtig bleiben und sollte keinen umfangreichen Laufzeitcode importieren; verwenden Sie es für statische Provider-Katalogmetadaten oder eng gefasste Discovery-Deskriptoren, nicht für die Ausführung zur Anfragezeit. `providerDiscoveryEntry` ist die ältere Schreibweise und funktioniert weiterhin für bestehende Plugins.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory`, `kind: "context-engine"` über `plugins.slots.contextEngine` (Standardwert `legacy`).
- Deklarieren Sie die exklusive Plugin-Art in diesem Manifest. `OpenClawPluginDefinition.kind` im Laufzeit-Einstieg ist veraltet und bleibt nur als Kompatibilitäts-Fallback für ältere Plugins erhalten.
- Env-var-Metadaten (`setup.providers[].envVars`, das veraltete `providerAuthEnvVars` und `channelEnvVars`) sind rein deklarativ. Status, Audit, Validierung der Cron-Zustellung und andere schreibgeschützte Oberflächen wenden weiterhin Plugin-Vertrauen und die effektive Aktivierungsrichtlinie an, bevor sie eine Env-var als konfiguriert behandeln.
- Für Laufzeit-Assistent-Metadaten, die Provider-Code erfordern, siehe [Provider-Laufzeit-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Allowlist-Anforderungen des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Verwandt

<CardGroup cols={3}>
  <Card title="Plugins erstellen" href="/de/plugins/building-plugins" icon="rocket">
    Erste Schritte mit Plugins.
  </Card>
  <Card title="Plugin-Architektur" href="/de/plugins/architecture" icon="diagram-project">
    Interne Architektur und Capability-Modell.
  </Card>
  <Card title="SDK-Übersicht" href="/de/plugins/sdk-overview" icon="book">
    Referenz zum Plugin-SDK und Subpath-Importe.
  </Card>
</CardGroup>
