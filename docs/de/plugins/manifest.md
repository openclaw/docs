---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema veröffentlichen oder Validierungsfehler des Plugins beheben.
summary: Anforderungen an Plugin-Manifest und JSON-Schema (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-07-12T01:55:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Diese Seite behandelt das **native OpenClaw-Plugin-Manifest** `openclaw.plugin.json`. Informationen zu kompatiblen Bundle-Strukturen (Codex, Claude, Cursor) finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden stattdessen eigene Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder die standardmäßige Claude-Komponentenstruktur ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Strukturen automatisch, validiert sie jedoch nicht anhand des unten beschriebenen Schemas für `openclaw.plugin.json`. Bei einem kompatiblen Bundle liest OpenClaw die Bundle-Metadaten, die deklarierten Skill-Stammverzeichnisse, die Claude-Befehlsstammverzeichnisse, die Standardwerte aus Claude-`settings.json`, die Claude-LSP-Standardwerte und die unterstützten Hook-Pakete, sofern die Struktur den Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** `openclaw.plugin.json` im **Plugin-Stammverzeichnis** enthalten. OpenClaw liest diese Datei, um die Konfiguration zu validieren, **ohne Plugin-Code auszuführen**. Ein fehlendes oder ungültiges Manifest verhindert die Konfigurationsvalidierung und wird als Plugin-Fehler behandelt.

Den vollständigen Leitfaden zum Plugin-System finden Sie unter [Plugins](/de/tools/plugin), Informationen zum nativen Funktionsmodell und aktuelle Hinweise zur externen Kompatibilität unter [Funktionsmodell](/de/plugins/architecture#public-capability-model).

## Zweck dieser Datei

`openclaw.plugin.json` enthält Metadaten, die OpenClaw **vor dem Laden Ihres Plugin-Codes** liest. Alle darin enthaltenen Angaben müssen sich ohne Start der Plugin-Laufzeit mit geringem Aufwand prüfen lassen.

**Verwenden Sie die Datei für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurationsoberfläche
- Metadaten für Authentifizierung, Onboarding und Einrichtung (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Authentifizierungsoptionen)
- Aktivierungshinweise für Steuerungsebenen-Oberflächen
- Zuordnung abgekürzter Modellfamilien
- statische Momentaufnahmen der Funktionszuständigkeit (`contracts`)
- Metadaten für den QA-Runner, die der gemeinsame Host `openclaw qa` prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie die Datei nicht für:** die Registrierung von Laufzeitverhalten, die Deklaration von Code-Einstiegspunkten oder npm-Installationsmetadaten. Diese Angaben gehören in Ihren Plugin-Code und in `package.json`.

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

## Referenz der Felder auf oberster Ebene

| Feld                                 | Erforderlich | Typ                          | Bedeutung                                                                                                                                                                                                                                                                 |
| ------------------------------------ | ------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                     | Kanonische Plugin-ID. Diese ID wird in `plugins.entries.<id>` verwendet.                                                                                                                                                                                                  |
| `configSchema`                       | Ja           | `object`                     | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                                                                  |
| `requiresPlugins`                    | Nein         | `string[]`                   | Plugin-IDs, deren Plugins ebenfalls installiert sein müssen, damit dieses Plugin wirksam wird. Bei der Erkennung bleibt das Plugin ladbar, es wird jedoch eine Warnung ausgegeben, wenn ein erforderliches Plugin fehlt.                                                    |
| `enabledByDefault`                   | Nein         | `true`                       | Kennzeichnet ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie das Feld weg oder legen Sie einen anderen Wert als `true` fest, damit das Plugin standardmäßig deaktiviert bleibt.                                                                            |
| `enabledByDefaultOnPlatforms`        | Nein         | `string[]`                   | Kennzeichnet ein gebündeltes Plugin nur auf den aufgeführten Node.js-Plattformen als standardmäßig aktiviert, beispielsweise `["darwin"]`. Eine explizite Konfiguration hat weiterhin Vorrang.                                                                             |
| `legacyPluginIds`                    | Nein         | `string[]`                   | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                   | Provider-IDs, bei deren Erwähnung in Authentifizierung, Konfiguration oder Modellreferenzen dieses Plugin automatisch aktiviert werden soll.                                                                                                                              |
| `kind`                               | Nein         | `PluginKind \| PluginKind[]` | Deklariert eine oder mehrere exklusive Plugin-Arten (`"memory"`, `"context-engine"`), die von `plugins.slots.*` verwendet werden. Ein Plugin, dem beide Slots gehören, deklariert beide Arten in einem einzigen Array.                                                       |
| `channels`                           | Nein         | `string[]`                   | Kanal-IDs, die diesem Plugin gehören. Wird für die Erkennung und Konfigurationsvalidierung verwendet.                                                                                                                                                                      |
| `providers`                          | Nein         | `string[]`                   | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                                                                  |
| `providerCatalogEntry`               | Nein         | `string`                     | Pfad zu einem schlanken Provider-Katalogmodul relativ zum Plugin-Stammverzeichnis für manifestbezogene Metadaten des Provider-Katalogs, die geladen werden können, ohne die vollständige Plugin-Laufzeit zu aktivieren.                                                     |
| `modelSupport`                       | Nein         | `object`                     | Manifesteigene Kurzform-Metadaten zu Modellfamilien, die zum automatischen Laden des Plugins vor der Laufzeit verwendet werden.                                                                                                                                            |
| `modelCatalog`                       | Nein         | `object`                     | Deklarative Modellkatalog-Metadaten für Provider, die diesem Plugin gehören. Dies ist der Steuerungsebenenvertrag für zukünftige schreibgeschützte Auflistungen, Onboarding, Modellauswahlfelder, Aliasse und Unterdrückung, ohne die Plugin-Laufzeit zu laden.                |
| `modelPricing`                       | Nein         | `object`                     | Providereigene Richtlinie für die externe Preisabfrage. Verwenden Sie sie, um lokale oder selbst gehostete Provider von entfernten Preiskatalogen auszunehmen oder Provider-Referenzen OpenRouter-/LiteLLM-Katalog-IDs zuzuordnen, ohne Provider-IDs im Kern fest zu codieren. |
| `modelIdNormalization`               | Nein         | `object`                     | Providereigene Bereinigung von Modell-ID-Aliassen und -Präfixen, die vor dem Laden der Provider-Laufzeit ausgeführt werden muss.                                                                                                                                           |
| `providerEndpoints`                  | Nein         | `object[]`                   | Manifesteigene Metadaten zu Endpoint-Hosts und `baseUrl` für Provider-Routen, die der Kern klassifizieren muss, bevor die Provider-Laufzeit geladen wird.                                                                                                                   |
| `providerRequest`                    | Nein         | `object`                     | Leichtgewichtige Metadaten zu Provider-Familien und Anfragekompatibilität, die von generischen Anfragerichtlinien verwendet werden, bevor die Provider-Laufzeit geladen wird.                                                                                              |
| `secretProviderIntegrations`         | Nein         | `Record<string, object>`     | Deklarative Voreinstellungen für SecretRef-Ausführungs-Provider, die Einrichtungs- oder Installationsoberflächen anbieten können, ohne providerspezifische Integrationen im Kern fest zu codieren.                                                                          |
| `cliBackends`                        | Nein         | `string[]`                   | IDs der CLI-Inferenz-Backends, die diesem Plugin gehören. Wird für die automatische Aktivierung beim Start anhand expliziter Konfigurationsreferenzen verwendet.                                                                                                           |
| `syntheticAuthRefs`                  | Nein         | `string[]`                   | Referenzen auf Provider oder CLI-Backends, deren plugineigener Hook für synthetische Authentifizierung während der initialen Modellerkennung geprüft werden soll, bevor die Laufzeit geladen wird.                                                                          |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                   | Platzhalterwerte für API-Schlüssel im Besitz gebündelter Plugins, die einen nicht geheimen lokalen, OAuth-basierten oder umgebungsbezogenen Anmeldedatenstatus darstellen.                                                                                                 |
| `commandAliases`                     | Nein         | `object[]`                   | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit pluginbezogene Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                                                                                    |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`   | Veraltete Kompatibilitätsmetadaten zu Umgebungsvariablen für die Abfrage der Provider-Authentifizierung und des Provider-Status. Verwenden Sie für neue Plugins vorzugsweise `setup.providers[].envVars`; OpenClaw liest diese während des Übergangszeitraums weiterhin.       |
| `providerUsageAuthEnvVars`           | Nein         | `Record<string, string[]>`   | Provider-Anmeldedaten ausschließlich für Nutzung und Abrechnung. OpenClaw verwendet diese Namen zur Nutzungsermittlung und Bereinigung geheimer Daten, jedoch niemals für die Inferenzauthentifizierung.                                                                    |
| `providerAuthAliases`                | Nein         | `Record<string, string>`     | Provider-IDs, die für die Authentifizierungsabfrage eine andere Provider-ID wiederverwenden sollen, beispielsweise ein Coding-Provider, der den API-Schlüssel und die Authentifizierungsprofile des Basis-Providers gemeinsam nutzt.                                        |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`   | Leichtgewichtige Metadaten zu Kanal-Umgebungsvariablen, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für umgebungsgesteuerte Kanaleinrichtungs- oder Authentifizierungsoberflächen, die generische Start-/Konfigurationshilfen berücksichtigen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                   | Leichtgewichtige Metadaten zu Authentifizierungsoptionen für Onboarding-Auswahlfelder, die Ermittlung des bevorzugten Providers und die einfache Verknüpfung von CLI-Flags.                                                                                                 |
| `activation`                         | Nein         | `object`                     | Leichtgewichtige Metadaten für die Aktivierungsplanung beim Start sowie für durch Provider, Befehle, Kanäle, Routen und Funktionen ausgelöstes Laden. Nur Metadaten; die Plugin-Laufzeit ist weiterhin für das tatsächliche Verhalten zuständig.                             |
| `setup`                              | Nein         | `object`                     | Leichtgewichtige Beschreibungen für Einrichtung und Onboarding, die Erkennungs- und Einrichtungsoberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                                              |
| `qaRunners`                          | Nein         | `object[]`                   | Leichtgewichtige Beschreibungen für QA-Runner, die vom gemeinsam genutzten Host `openclaw qa` verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                                                                     |
| `contracts`                          | Nein         | `object`                     | Statische Momentaufnahme der Funktionszuständigkeiten für externe Authentifizierungs-Hooks, Einbettungen, Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bild-/Video-/Musikerzeugung, Webabruf, Websuche, Worker-Provider, Dokument-/Webinhaltextraktion und Werkzeugzuständigkeit. |
| `configContracts`                    | Nein         | `object`                     | Manifesteigenes Konfigurationsverhalten, das von generischen Kernhilfen genutzt wird: Erkennung gefährlicher Flags, SecretRef-Migrationsziele und Eingrenzung veralteter Konfigurationspfade. Siehe [Referenz zu configContracts](#configcontracts-reference).                 |
| `mediaUnderstandingProviderMetadata` | Nein     | `Record<string, object>`     | Aufwandsarme Standardwerte für das Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                                                       |
| `imageGenerationProviderMetadata`    | Nein     | `Record<string, object>`     | Aufwandsarme Authentifizierungsmetadaten für die Bildgenerierung für Provider-IDs, die in `contracts.imageGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Schutzprüfungen für Basis-URLs.                                   |
| `videoGenerationProviderMetadata`    | Nein     | `Record<string, object>`     | Aufwandsarme Authentifizierungsmetadaten für die Videogenerierung für Provider-IDs, die in `contracts.videoGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Schutzprüfungen für Basis-URLs.                                  |
| `musicGenerationProviderMetadata`    | Nein     | `Record<string, object>`     | Aufwandsarme Authentifizierungsmetadaten für die Musikgenerierung für Provider-IDs, die in `contracts.musicGenerationProviders` deklariert sind, einschließlich Provider-eigener Authentifizierungsaliase und Schutzprüfungen für Basis-URLs.                                  |
| `toolMetadata`                       | Nein     | `Record<string, object>`     | Aufwandsarme Verfügbarkeitsmetadaten für Plugin-eigene Werkzeuge, die in `contracts.tools` deklariert sind. Verwenden Sie diese, wenn ein Werkzeug die Laufzeit nicht laden soll, solange keine Konfigurations-, Umgebungs- oder Authentifizierungsnachweise vorliegen.          |
| `channelConfigs`                     | Nein     | `Record<string, object>`     | Manifest-eigene Metadaten zur Kanalkonfiguration, die vor dem Laden der Laufzeit in die Ermittlungs- und Validierungsoberflächen eingebunden werden.                                                                                                                         |
| `skills`                             | Nein     | `string[]`                   | Zu ladende Skill-Verzeichnisse, relativ zum Plugin-Stammverzeichnis.                                                                                                                                                                                                        |
| `name`                               | Nein     | `string`                     | Für Menschen lesbarer Plugin-Name.                                                                                                                                                                                                                                          |
| `description`                        | Nein     | `string`                     | Kurze Zusammenfassung, die auf Plugin-Oberflächen angezeigt wird.                                                                                                                                                                                                           |
| `catalog`                            | Nein     | `object`                     | Optionale Darstellungshinweise für Plugin-Katalogoberflächen. Diese Metadaten installieren oder aktivieren kein Plugin und gewähren ihm kein Vertrauen.                                                                                                                     |
| `icon`                               | Nein     | `string`                     | HTTPS-Bild-URL für Marketplace-/Katalogkarten. ClawHub akzeptiert jede gültige `https://`-URL und verwendet das standardmäßige Plugin-Symbol, wenn diese Angabe fehlt oder ungültig ist.                                                                                     |
| `version`                            | Nein     | `string`                     | Informative Plugin-Version.                                                                                                                                                                                                                                                 |
| `uiHints`                            | Nein     | `Record<string, object>`     | UI-Beschriftungen, Platzhalter und Hinweise zur Vertraulichkeit von Konfigurationsfeldern.                                                                                                                                                                                   |

## Katalogreferenz

`catalog` stellt optionale Anzeigehinweise für Plugin-Browser bereit. Hosts können diese Hinweise ignorieren. Sie installieren oder aktivieren das Plugin niemals und ändern weder sein Laufzeitverhalten noch seine Vertrauensstufe.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Feld       | Typ       | Bedeutung                                                                                          |
| ---------- | --------- | -------------------------------------------------------------------------------------------------- |
| `featured` | `boolean` | Gibt an, ob Katalogoberflächen dieses Plugin besonders hervorheben sollen.                         |
| `order`    | `number`  | Aufsteigender Anzeigehinweis für kuratierte Plugins; niedrigere Werte werden weiter vorn angezeigt. |

## Referenz für Metadaten von Generierungs-Providern

Die Metadatenfelder für Generierungs-Provider beschreiben statische Authentifizierungssignale für Provider, die in der entsprechenden Liste `contracts.*GenerationProviders` deklariert sind. OpenClaw liest diese Felder, bevor die Provider-Laufzeit geladen wird, damit Kernwerkzeuge entscheiden können, ob ein Generierungs-Provider verfügbar ist, ohne jedes Provider-Plugin zu importieren.

Verwenden Sie diese Felder nur für kostengünstig prüfbare, deklarative Fakten. Transport, Anfragetransformationen, Token-Aktualisierung, Validierung von Anmeldedaten und das eigentliche Generierungsverhalten verbleiben in der Plugin-Laufzeit.

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

| Feld                   | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                 |
| ---------------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Nein         | `string[]` | Zusätzliche Provider-IDs, die als statische Authentifizierungsaliase für den Generierungs-Provider gelten sollen.                                                                                          |
| `authProviders`        | Nein         | `string[]` | Provider-IDs, deren konfigurierte Authentifizierungsprofile als Authentifizierung für diesen Generierungs-Provider gelten sollen.                                                                          |
| `configSignals`        | Nein         | `object[]` | Kostengünstig prüfbare, ausschließlich konfigurationsbasierte Verfügbarkeitssignale für lokale oder selbst gehostete Provider, die ohne Authentifizierungsprofile oder Umgebungsvariablen konfiguriert werden können. |
| `authSignals`          | Nein         | `object[]` | Explizite Authentifizierungssignale. Falls vorhanden, ersetzen sie die Standardsignalmenge aus der Provider-ID, `aliases` und `authProviders`.                                                              |
| `referenceAudioInputs` | Nein         | `boolean`  | Nur für die Videogenerierung. Auf `true` setzen, wenn der Provider Referenzaudio-Assets akzeptiert; andernfalls blendet `video_generate` Audioreferenzparameter aus.                                        |

Jeder `configSignals`-Eintrag unterstützt:

| Feld             | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                                                                                             |
| ---------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Ja           | `string`   | Punktpfad zum zu prüfenden, Plugin-eigenen Konfigurationsobjekt, zum Beispiel `plugins.entries.example.config`.                                                                                                                                                                        |
| `overlayPath`    | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objekt die Eigenschaften des Stammobjekts überlagern soll, bevor das Signal ausgewertet wird. Verwenden Sie dies für funktionsspezifische Konfigurationen wie `image`, `video` oder `music`.                                           |
| `overlayMapPath` | Nein         | `string`   | Punktpfad innerhalb der Stammkonfiguration, dessen Objektwerte jeweils die Eigenschaften des Stammobjekts überlagern sollen. Verwenden Sie dies für benannte Kontenzuordnungen wie `accounts`, bei denen jedes konfigurierte Konto die Voraussetzung erfüllen soll.                       |
| `required`       | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, die konfigurierte Werte enthalten müssen. Zeichenfolgen dürfen nicht leer sein; Objekte und Arrays ebenfalls nicht.                                                                                                                 |
| `requiredAny`    | Nein         | `string[]` | Punktpfade innerhalb der effektiven Konfiguration, von denen mindestens einer einen konfigurierten Wert enthalten muss.                                                                                                                                                                 |
| `mode`           | Nein         | `object`   | Optionale Modusbedingung für Zeichenfolgen innerhalb der effektiven Konfiguration. Verwenden Sie diese, wenn die ausschließlich konfigurationsbasierte Verfügbarkeit nur für einen Modus gilt.                                                                                          |

Jede `mode`-Bedingung unterstützt:

| Feld         | Erforderlich | Typ        | Bedeutung                                                                                                                          |
| ------------ | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `path`       | Nein         | `string`   | Punktpfad innerhalb der effektiven Konfiguration. Standardwert ist `mode`.                                                         |
| `default`    | Nein         | `string`   | Zu verwendender Moduswert, wenn der Pfad in der Konfiguration fehlt.                                                               |
| `allowed`    | Nein         | `string[]` | Falls vorhanden, gilt das Signal nur, wenn der effektive Modus einem dieser Werte entspricht.                                      |
| `disallowed` | Nein         | `string[]` | Falls vorhanden, gilt das Signal nicht, wenn der effektive Modus einem dieser Werte entspricht.                                    |

Jeder `authSignals`-Eintrag unterstützt:

| Feld              | Erforderlich | Typ      | Bedeutung                                                                                                                                                                                                             |
| ----------------- | ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string` | In konfigurierten Authentifizierungsprofilen zu prüfende Provider-ID.                                                                                                                                                  |
| `providerBaseUrl` | Nein         | `object` | Optionale Bedingung, durch die das Signal nur dann gilt, wenn der referenzierte konfigurierte Provider eine zulässige Basis-URL verwendet. Verwenden Sie dies, wenn ein Authentifizierungsalias nur für bestimmte APIs gültig ist. |

Jede `providerBaseUrl`-Bedingung unterstützt:

| Feld              | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                 |
| ----------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja           | `string`   | ID der Provider-Konfiguration, deren `baseUrl` geprüft werden soll.                                                                                                                                       |
| `defaultBaseUrl`  | Nein         | `string`   | Anzunehmende Basis-URL, wenn `baseUrl` in der Provider-Konfiguration fehlt.                                                                                                                               |
| `allowedBaseUrls` | Ja           | `string[]` | Zulässige Basis-URLs für dieses Authentifizierungssignal. Das Signal wird ignoriert, wenn die konfigurierte oder standardmäßige Basis-URL keinem dieser normalisierten Werte entspricht.                   |

## Referenz für Werkzeugmetadaten

`toolMetadata` verwendet dieselben Formen für `configSignals` und `authSignals` wie die Metadaten für Generierungs-Provider, indiziert nach Werkzeugname. `contracts.tools` deklariert die Zuständigkeit. `toolMetadata` deklariert kostengünstig prüfbare Verfügbarkeitsnachweise, damit OpenClaw den Import einer Plugin-Laufzeit vermeiden kann, wenn deren Werkzeug-Factory lediglich `null` zurückgeben würde.

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

`toolMetadata`-Einträge akzeptieren zusätzlich zu den oben beschriebenen gemeinsamen Feldern `configSignals`/`authSignals` auch `optional` (kennzeichnet das Werkzeug als für die Plugin-Aktivierung nicht erforderlich) und `replaySafe` (kennzeichnet die Werkzeugausführung nach einem unvollständigen Modelldurchlauf als sicher wiederholbar).

Wenn ein Werkzeug keine `toolMetadata` besitzt, behält OpenClaw das bestehende Verhalten bei und lädt das zuständige Plugin, wenn der Werkzeugvertrag den Richtlinien entspricht. Für Werkzeuge in häufig ausgeführten Pfaden, deren Factory von Authentifizierung oder Konfiguration abhängt, sollten Plugin-Autoren `toolMetadata` deklarieren, anstatt den Kern die Laufzeit importieren zu lassen, um dies abzufragen.

## Referenz für providerAuthChoices

Jeder `providerAuthChoices`-Eintrag beschreibt eine Auswahlmöglichkeit für das Onboarding oder die Authentifizierung. OpenClaw liest diese, bevor die Provider-Laufzeit geladen wird. Listen zur Provider-Einrichtung verwenden diese Manifestauswahlmöglichkeiten, aus Deskriptoren abgeleitete Einrichtungsoptionen und Metadaten des Installationskatalogs, ohne die Provider-Laufzeit zu laden.

| Feld                  | Erforderlich | Typ                                                                   | Bedeutung                                                                                                               |
| --------------------- | ------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                                              | Provider-ID, zu der diese Auswahl gehört.                                                                               |
| `method`              | Ja           | `string`                                                              | ID der Authentifizierungsmethode, an die weitergeleitet werden soll.                                                    |
| `choiceId`            | Ja           | `string`                                                              | Stabile ID der Authentifizierungsauswahl, die vom Onboarding und von CLI-Abläufen verwendet wird.                       |
| `choiceLabel`         | Nein         | `string`                                                              | Für Benutzer sichtbare Bezeichnung. Wenn sie fehlt, greift OpenClaw auf `choiceId` zurück.                              |
| `choiceHint`          | Nein         | `string`                                                              | Kurzer Hilfetext für die Auswahl.                                                                                       |
| `assistantPriority`   | Nein         | `number`                                                              | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahllisten weiter vorne einsortiert.                  |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                                        | Blendet die Option in Assistentenauswahllisten aus, ermöglicht aber weiterhin die manuelle Auswahl über die CLI.        |
| `deprecatedChoiceIds` | Nein         | `string[]`                                                            | Veraltete Auswahl-IDs, die Benutzer zu dieser Ersatzauswahl weiterleiten sollen.                                        |
| `groupId`             | Nein         | `string`                                                              | Optionale Gruppen-ID zum Gruppieren zusammengehöriger Auswahlmöglichkeiten.                                             |
| `groupLabel`          | Nein         | `string`                                                              | Für Benutzer sichtbare Bezeichnung dieser Gruppe.                                                                       |
| `groupHint`           | Nein         | `string`                                                              | Kurzer Hilfetext für die Gruppe.                                                                                        |
| `onboardingFeatured`  | Nein         | `boolean`                                                             | Zeigt diese Gruppe in der hervorgehobenen Ebene der interaktiven Onboarding-Auswahl vor dem Eintrag „Mehr …“ an.        |
| `optionKey`           | Nein         | `string`                                                              | Interner Optionsschlüssel für einfache Authentifizierungsabläufe mit einem einzelnen Flag.                              |
| `cliFlag`             | Nein         | `string`                                                              | Name des CLI-Flags, beispielsweise `--openrouter-api-key`.                                                              |
| `cliOption`           | Nein         | `string`                                                              | Vollständige Form der CLI-Option, beispielsweise `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Nein         | `string`                                                              | In der CLI-Hilfe verwendete Beschreibung.                                                                               |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Onboarding-Oberflächen, in denen diese Auswahl erscheinen soll. Wenn nicht angegeben, gilt `["text-inference"]`.        |

## Referenz zu `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Namen für einen Laufzeitbefehl besitzt, den Benutzer irrtümlich in `plugins.allow` eintragen oder als CLI-Stammbefehl ausführen könnten. OpenClaw verwendet diese Metadaten für Diagnosen, ohne den Laufzeitcode des Plugins zu importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                                       |
| ------------ | ------------ | ----------------- | ----------------------------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                                       |
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Slash-Befehl im Chat statt als CLI-Stammbefehl.                      |
| `cliCommand` | Nein         | `string`          | Zugehöriger CLI-Stammbefehl, der für CLI-Vorgänge vorgeschlagen werden soll, sofern vorhanden.  |

## Referenz zu `activation`

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, bei welchen Ereignissen der Steuerungsebene es in einen Aktivierungs-/Ladeplan aufgenommen werden soll.

Dieser Block enthält Planer-Metadaten und ist keine Lebenszyklus-API. Er registriert kein Laufzeitverhalten, ersetzt `register(...)` nicht und garantiert nicht, dass Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um die infrage kommenden Plugins einzugrenzen, bevor er auf bestehende Besitzmetadaten des Manifests wie `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks zurückgreift.

Bevorzugen Sie die spezifischsten Metadaten, die den Besitz bereits beschreiben. Verwenden Sie `providers`, `channels`, `commandAliases`, Einrichtungsdeskriptoren oder `contracts`, wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Planerhinweise, die sich nicht durch diese Besitzfelder darstellen lassen. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Laufzeit-Aliasse wie `claude-cli`, `my-cli` oder `google-gemini-cli`; `activation.onAgentHarnesses` ist ausschließlich für IDs eingebetteter Agent-Harnesses vorgesehen, für die noch kein Besitzfeld vorhanden ist.

Jedes Plugin sollte `activation.onStartup` bewusst festlegen. Setzen Sie den Wert nur dann auf `true`, wenn das Plugin beim Start des Gateway ausgeführt werden muss. Setzen Sie ihn auf `false`, wenn das Plugin beim Start inaktiv ist und nur durch spezifischere Auslöser geladen werden soll. Wird `onStartup` weggelassen, wird das Plugin beim Start nicht mehr implizit geladen; verwenden Sie explizite Aktivierungsmetadaten für den Start, Kanäle, Konfiguration, Agent-Harnesses, Speicher oder andere spezifischere Aktivierungsauslöser.

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

| Feld               | Erforderlich | Typ                                                  | Bedeutung                                                                                                                                                                                                    |
| ------------------ | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Nein         | `boolean`                                            | Explizite Aktivierung beim Start des Gateway. Jedes Plugin sollte dies festlegen. `true` importiert das Plugin beim Start; `false` lässt es beim Start verzögert, sofern kein anderer passender Auslöser das Laden erfordert. |
| `onProviders`      | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                                |
| `onAgentHarnesses` | Nein         | `string[]`                                           | Laufzeit-IDs eingebetteter Agent-Harnesses, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen. Verwenden Sie `cliBackends` auf oberster Ebene für CLI-Backend-Aliasse.                           |
| `onCommands`       | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                                 |
| `onChannels`       | Nein         | `string[]`                                           | Kanal-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                                   |
| `onRoutes`         | Nein         | `string[]`                                           | Routentypen, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                                                                                                                                 |
| `onConfigPaths`    | Nein         | `string[]`                                           | Auf das Stammverzeichnis bezogene Konfigurationspfade, die dieses Plugin in Start-/Ladepläne aufnehmen sollen, wenn der Pfad vorhanden und nicht ausdrücklich deaktiviert ist.                             |
| `onCapabilities`   | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Fähigkeitshinweise für die Aktivierungsplanung der Steuerungsebene. Bevorzugen Sie nach Möglichkeit spezifischere Felder.                                                                         |

Aktuelle aktive Verbraucher:

- Die Startplanung des Gateway verwendet `activation.onStartup` für den expliziten Import beim Start.
- Die durch Befehle ausgelöste CLI-Planung greift ersatzweise auf das veraltete `commandAliases[].cliCommand` oder `commandAliases[].name` zurück.
- Die Startplanung der Agent-Laufzeit verwendet `activation.onAgentHarnesses` für eingebettete Harnesses und `cliBackends[]` auf oberster Ebene für CLI-Laufzeit-Aliasse.
- Die durch Kanäle ausgelöste Einrichtungs-/Kanalplanung greift ersatzweise auf den veralteten Besitz über `channels[]` zurück, wenn explizite Metadaten zur Kanalaktivierung fehlen.
- Die Plugin-Planung beim Start verwendet `activation.onConfigPaths` für kanalunabhängige Stammkonfigurationsbereiche wie den Block `browser` des gebündelten Browser-Plugins.
- Die durch Provider ausgelöste Einrichtungs-/Laufzeitplanung greift ersatzweise auf den veralteten Besitz über `providers[]` und `cliBackends[]` auf oberster Ebene zurück, wenn explizite Metadaten zur Provider-Aktivierung fehlen.

Planerdiagnosen können explizite Aktivierungshinweise von Rückgriffen auf den Manifestbesitz unterscheiden. Beispielsweise bedeutet `activation-command-hint`, dass `activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der Planer stattdessen den Besitz über `commandAliases` verwendete. Diese Begründungsbezeichnungen sind für Hostdiagnosen und Tests vorgesehen; Plugin-Autoren sollten weiterhin die Metadaten deklarieren, die den Besitz am besten beschreiben.

## Referenz zu `qaRunners`

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb des gemeinsamen Stammbefehls `openclaw qa` bereitstellt. Halten Sie diese Metadaten leichtgewichtig und statisch; die Plugin-Laufzeit ist weiterhin für die eigentliche CLI-Registrierung über eine leichtgewichtige `runtime-api.ts`-Oberfläche verantwortlich, die entsprechende `qaRunnerCliRegistrations` exportiert. Eine optionale `adapterFactory` stellt den Transport gemeinsamen QA-Szenarien bereit, ohne den Runner des registrierten Befehls zu ändern.

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

| Feld          | Erforderlich | Typ      | Bedeutung                                                                                     |
| ------------- | ------------ | -------- | --------------------------------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl unterhalb von `openclaw qa`, beispielsweise `matrix`.                             |
| `description` | Nein         | `string` | Ersatzhilfetext, der verwendet wird, wenn der gemeinsame Host einen Platzhalterbefehl benötigt. |

Die ID `adapterFactory` muss mit `commandName` übereinstimmen. Exportieren Sie keine Registrierungen
für Befehle, die nicht im Manifest vorhanden sind.

## setup-Referenz

Verwenden Sie `setup`, wenn Einrichtungs- und Onboarding-Oberflächen kostengünstige, Plugin-eigene Metadaten benötigen, bevor die Laufzeit geladen wird.

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

`cliBackends` auf oberster Ebene bleibt gültig und beschreibt weiterhin CLI-Inferenz-Backends. `setup.cliBackends` ist die einrichtungsspezifische Deskriptoroberfläche für Steuerungsebenen- und Einrichtungsabläufe, die ausschließlich auf Metadaten basieren sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte, deskriptorbasierte Suchoberfläche für die Einrichtungserkennung. Wenn der Deskriptor nur das infrage kommende Plugin eingrenzt und die Einrichtung weiterhin umfangreichere Laufzeit-Hooks für die Einrichtungsphase benötigt, setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als Ausweich-Ausführungspfad bei.

OpenClaw berücksichtigt `setup.providers[].envVars` außerdem bei generischen Suchen nach Provider-Authentifizierung und Umgebungsvariablen. `providerAuthEnvVars` wird während des Übergangszeitraums weiterhin über einen Kompatibilitätsadapter unterstützt, nicht gebündelte Plugins, die es noch verwenden, erhalten jedoch eine Manifestdiagnose. Neue Plugins sollten Umgebungsmetadaten für Einrichtung und Status in `setup.providers[].envVars` ablegen.

Verwenden Sie `providerUsageAuthEnvVars`, wenn Zugangsdaten auf Abrechnungs- oder Organisationsebene `resolveUsageAuth` aktivieren müssen, ohne zu Inferenzzugangsdaten zu werden. Diese Namen werden in die Blockierung von Workspace-dotenv-Werten, die Entfernung aus ACP-Kindprozessen, die Filterung von Geheimnissen in der Sandbox und die umfassende Bereinigung von Geheimnissen einbezogen. Die Provider-Laufzeit liest und klassifiziert den Wert weiterhin innerhalb von `resolveUsageAuth`.

OpenClaw kann außerdem einfache Einrichtungsoptionen aus `setup.providers[].authMethods` ableiten, wenn kein Einrichtungseintrag verfügbar ist oder wenn `setup.requiresRuntime: false` erklärt, dass keine Einrichtungslaufzeit erforderlich ist. Explizite `providerAuthChoices`-Einträge werden weiterhin für benutzerdefinierte Bezeichnungen, CLI-Flags, den Onboarding-Geltungsbereich und Assistentenmetadaten bevorzugt.

Setzen Sie `requiresRuntime: false` nur, wenn diese Deskriptoren für die Einrichtungsoberfläche ausreichen. OpenClaw behandelt ein explizites `false` als ausschließlich deskriptorbasierten Vertrag und führt für die Einrichtungssuche weder `setup-api` noch `openclaw.setupEntry` aus. Wenn ein ausschließlich deskriptorbasiertes Plugin dennoch einen dieser Laufzeiteinträge für die Einrichtung bereitstellt, meldet OpenClaw eine zusätzliche Diagnose und ignoriert ihn weiterhin. Wird `requiresRuntime` weggelassen, bleibt das bisherige Ausweichverhalten erhalten, sodass vorhandene Plugins, die Deskriptoren ohne dieses Flag hinzugefügt haben, nicht beschädigt werden.

Da die Einrichtungssuche Plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte Werte von `setup.providers[].id` und `setup.cliBackends[]` über alle erkannten Plugins hinweg eindeutig bleiben. Bei mehrdeutiger Zuständigkeit schlägt der Vorgang sicher fehl, statt anhand der Erkennungsreihenfolge einen Gewinner auszuwählen.

Wenn die Einrichtungslaufzeit ausgeführt wird, melden Diagnosen der Einrichtungsregistrierung Deskriptorabweichungen, falls `setup-api` einen Provider oder ein CLI-Backend registriert, den beziehungsweise das die Manifestdeskriptoren nicht deklarieren, oder falls für einen Deskriptor keine passende Laufzeitregistrierung vorhanden ist. Diese Diagnosen sind zusätzlich und weisen ältere Plugins nicht zurück.

### Referenz zu setup.providers

| Feld           | Erforderlich | Typ        | Bedeutung                                                                                                    |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `id`           | Ja           | `string`   | Während der Einrichtung oder des Onboardings bereitgestellte Provider-ID. Normalisierte IDs müssen global eindeutig sein. |
| `authMethods`  | Nein         | `string[]` | IDs der Einrichtungs-/Authentifizierungsmethoden, die dieser Provider unterstützt, ohne die vollständige Laufzeit zu laden. |
| `envVars`      | Nein         | `string[]` | Umgebungsvariablen, die generische Einrichtungs-/Statusoberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |
| `authEvidence` | Nein         | `object[]` | Kostengünstige lokale Prüfungen auf Authentifizierungsnachweise für Provider, die sich über nicht geheime Markierungen authentifizieren können. |

`authEvidence` ist für Provider-eigene lokale Zugangsdatenmarkierungen vorgesehen, die ohne Laden von Laufzeitcode überprüft werden können. Diese Prüfungen müssen kostengünstig und lokal bleiben: keine Netzwerkaufrufe, keine Lesezugriffe auf Schlüsselbünde oder Geheimnisverwaltungen, keine Shell-Befehle und keine Provider-API-Prüfungen.

Unterstützte Nachweiseinträge:

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                      |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja           | `string`   | Derzeit `local-file-with-env`.                                                                                 |
| `fileEnvVar`       | Nein         | `string`   | Umgebungsvariable, die einen expliziten Pfad zu einer Zugangsdaten-Datei enthält.                              |
| `fallbackPaths`    | Nein         | `string[]` | Lokale Pfade zu Zugangsdaten-Dateien, die geprüft werden, wenn `fileEnvVar` fehlt oder leer ist. Unterstützt `${HOME}` und `${APPDATA}`. |
| `requiresAnyEnv`   | Nein         | `string[]` | Mindestens eine aufgeführte Umgebungsvariable muss einen nicht leeren Wert enthalten, damit der Nachweis gültig ist. |
| `requiresAllEnv`   | Nein         | `string[]` | Jede aufgeführte Umgebungsvariable muss einen nicht leeren Wert enthalten, damit der Nachweis gültig ist.      |
| `credentialMarker` | Ja           | `string`   | Nicht geheime Markierung, die zurückgegeben wird, wenn der Nachweis vorhanden ist.                             |
| `source`           | Nein         | `string`   | Benutzerseitig sichtbare Quellenbezeichnung für Authentifizierungs-/Statusausgaben.                            |

### setup-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                                     |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Während der Einrichtung und des Onboardings bereitgestellte Provider-Einrichtungsdeskriptoren.                |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs für die Einrichtungsphase, die für die deskriptorbasierte Einrichtungssuche verwendet werden. Normalisierte IDs müssen global eindeutig sein. |
| `configMigrations` | Nein         | `string[]` | IDs der Konfigurationsmigrationen, die der Einrichtungsoberfläche dieses Plugins zugeordnet sind.             |
| `requiresRuntime`  | Nein         | `boolean`  | Gibt an, ob die Einrichtung nach der Deskriptorsuche weiterhin die Ausführung von `setup-api` benötigt.       |

## uiHints-Referenz

`uiHints` ist eine Zuordnung von Konfigurationsfeldnamen zu kleinen Darstellungshinweisen. Schlüssel können Punkte für verschachtelte Konfigurationsfelder verwenden, aber kein Pfadsegment darf `__proto__`, `constructor` oder `prototype` lauten; die Einrichtung weist solche Namen zurück.

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
| `label`       | `string`   | Benutzerseitig sichtbare Feldbezeichnung.      |
| `help`        | `string`   | Kurzer Hilfetext.                              |
| `tags`        | `string[]` | Optionale UI-Schlagwörter.                     |
| `advanced`    | `boolean`  | Kennzeichnet das Feld als erweitert.           |
| `sensitive`   | `boolean`  | Kennzeichnet das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.          |

## contracts-Referenz

Verwenden Sie `contracts` nur für statische Metadaten zur Zuständigkeit für Fähigkeiten, die OpenClaw lesen kann, ohne die Plugin-Laufzeit zu importieren.

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
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Jede Liste ist optional:

| Feld                             | Typ        | Bedeutung                                                                                                                                       |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Factory-IDs für Codex-App-Server-Erweiterungen, derzeit `codex-app-server`.                                                                      |
| `agentToolResultMiddleware`      | `string[]` | Runtime-IDs, für die dieses Plugin Middleware für Tool-Ergebnisse registrieren darf.                                                            |
| `trustedToolPolicies`            | `string[]` | Plugin-lokale IDs vertrauenswürdiger Richtlinien vor der Tool-Ausführung, die ein installiertes Plugin registrieren darf. Gebündelte Plugins dürfen Richtlinien ohne dieses Feld registrieren. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Authentifizierungsprofile diesem Plugin zugeordnet ist.                                                    |
| `embeddingProviders`             | `string[]` | IDs allgemeiner Embedding-Provider, die diesem Plugin zur wiederverwendbaren Erzeugung von Vektor-Embeddings einschließlich Speicher zugeordnet sind. |
| `speechProviders`                | `string[]` | IDs der Sprach-Provider, die diesem Plugin zugeordnet sind.                                                                                     |
| `realtimeTranscriptionProviders` | `string[]` | IDs der Echtzeit-Transkriptions-Provider, die diesem Plugin zugeordnet sind.                                                                    |
| `realtimeVoiceProviders`         | `string[]` | IDs der Echtzeit-Sprach-Provider, die diesem Plugin zugeordnet sind.                                                                            |
| `memoryEmbeddingProviders`       | `string[]` | Veraltete IDs speicherspezifischer Embedding-Provider, die diesem Plugin zugeordnet sind.                                                       |
| `mediaUnderstandingProviders`    | `string[]` | IDs der Provider für Medienverständnis, die diesem Plugin zugeordnet sind.                                                                      |
| `transcriptSourceProviders`      | `string[]` | IDs der Provider für Transkriptquellen, die diesem Plugin zugeordnet sind.                                                                      |
| `documentExtractors`             | `string[]` | IDs der Extraktor-Provider für Dokumente (beispielsweise PDF), die diesem Plugin zugeordnet sind.                                               |
| `imageGenerationProviders`       | `string[]` | IDs der Provider für Bilderzeugung, die diesem Plugin zugeordnet sind.                                                                          |
| `videoGenerationProviders`       | `string[]` | IDs der Provider für Videoerzeugung, die diesem Plugin zugeordnet sind.                                                                         |
| `musicGenerationProviders`       | `string[]` | IDs der Provider für Musikerzeugung, die diesem Plugin zugeordnet sind.                                                                         |
| `webContentExtractors`           | `string[]` | IDs der Provider für die Inhaltsextraktion aus Webseiten, die diesem Plugin zugeordnet sind.                                                    |
| `webFetchProviders`              | `string[]` | IDs der Provider für Webabrufe, die diesem Plugin zugeordnet sind.                                                                              |
| `webSearchProviders`             | `string[]` | IDs der Provider für Websuchen, die diesem Plugin zugeordnet sind.                                                                              |
| `workerProviders`                | `string[]` | IDs der Cloud-Worker-Provider, die diesem Plugin für die Bereitstellung und den profilgestützten Lease-Lebenszyklus zugeordnet sind.             |
| `usageProviders`                 | `string[]` | Provider-IDs, deren Hooks für Nutzungsauthentifizierung und Nutzungssnapshots diesem Plugin zugeordnet sind.                                    |
| `migrationProviders`             | `string[]` | IDs der Import-Provider, die diesem Plugin für `openclaw migrate` zugeordnet sind.                                                               |
| `gatewayMethodDispatch`          | `string[]` | Reservierte Berechtigung für authentifizierte Plugin-HTTP-Routen, die Gateway-Methoden prozessintern weiterleiten.                              |
| `tools`                          | `string[]` | Namen der Agent-Tools, die diesem Plugin zugeordnet sind.                                                                                        |

`contracts.embeddedExtensionFactories` bleibt für gebündelte Erweiterungs-Factorys erhalten, die ausschließlich für den Codex-App-Server bestimmt sind. Gebündelte Transformationen von Tool-Ergebnissen sollten stattdessen `contracts.agentToolResultMiddleware` deklarieren und sich mit `api.registerAgentToolResultMiddleware(...)` registrieren. Installierte Plugins dürfen dieselbe Middleware-Schnittstelle nur verwenden, wenn sie ausdrücklich aktiviert ist, und nur für Runtimes, die sie in `contracts.agentToolResultMiddleware` deklarieren.

Installierte Plugins, die die vom Host als vertrauenswürdig eingestufte Richtlinienebene vor der Tool-Ausführung benötigen, müssen jede registrierte lokale ID in `contracts.trustedToolPolicies` deklarieren und ausdrücklich aktiviert sein. Für gebündelte Plugins bleibt der bestehende Pfad für vertrauenswürdige Richtlinien erhalten; installierte Plugins mit nicht deklarierten Richtlinien-IDs werden jedoch vor der Registrierung abgewiesen. Richtlinien-IDs gelten nur innerhalb des registrierenden Plugins, sodass zwei Plugins jeweils `workflow-budget` deklarieren und registrieren dürfen; ein einzelnes Plugin darf dieselbe lokale ID nicht zweimal registrieren.

Runtime-Registrierungen über `api.registerTool(...)` müssen mit `contracts.tools` übereinstimmen. Die Tool-Erkennung verwendet diese Liste, um nur die Plugin-Runtimes zu laden, denen die angeforderten Tools zugeordnet sein können.

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten `contracts.externalAuthProviders` deklarieren; nicht deklarierte Hooks für externe Authentifizierung werden ignoriert.

Provider-Plugins, die sowohl `resolveUsageAuth` als auch `fetchUsageSnapshot` implementieren, sollten jede automatisch erkannte Provider-ID in `contracts.usageProviders` deklarieren. Die Nutzungserkennung liest diesen Vertrag vor dem Laden des Runtime-Codes und überprüft anschließend beide Hooks, nachdem ausschließlich die deklarierten zuständigen Plugins geladen wurden.

Allgemeine Embedding-Provider sollten für jeden mit `api.registerEmbeddingProvider(...)` registrierten Adapter `contracts.embeddingProviders` deklarieren. Verwenden Sie den allgemeinen Vertrag für die wiederverwendbare Vektorerzeugung, einschließlich der von der Speichersuche verwendeten Provider. `contracts.memoryEmbeddingProviders` ist eine veraltete speicherspezifische Kompatibilitätsschnittstelle und bleibt nur bestehen, während vorhandene Provider zur generischen Embedding-Provider-Schnittstelle migrieren.

Worker-Provider müssen jede ID aus `api.registerWorkerProvider(...)` in `contracts.workerProviders` deklarieren. Der Kern speichert die dauerhafte Absicht, bevor er `provision` aufruft; Provider validieren ihre Einstellungen vor der externen Zuweisung, und wiederholte Aufrufe mit derselben Vorgangs-ID müssen denselben Lease übernehmen. Der Kern speichert außerdem diesen validierten Einstellungssnapshot und übergibt ihn zusammen mit `leaseId` an `inspect({ leaseId, profile })` und `destroy({ leaseId, profile })`, auch nachdem das benannte Profil geändert oder entfernt wurde. Die Zerstörung ist idempotent, die Inspektion gibt die abgeschlossene Status-Union `active` / `destroyed` / `unknown` zurück, und auf privates SSH-Schlüsselmaterial wird ausschließlich über `SecretRef` verwiesen. Bereitgestellte SSH-Endpunkte müssen außerdem einen öffentlichen `hostKey` aus einer vertrauenswürdigen Bereitstellungsausgabe enthalten, und zwar exakt im Format `algorithm base64` ohne Hostnamen oder Kommentar, damit der Kern den Host vor dem Verbindungsaufbau anheften kann. Provider, die dynamische Identitätsreferenzen ausstellen, können das maßgebliche `resolveSshIdentity({ leaseId, profile, keyRef })` implementieren; Provider ohne diese Implementierung verwenden den generischen Secret-Resolver des Kerns. Ein maßgebliches `unknown` kennzeichnet einen aktiven lokalen Datensatz als verwaist; nach einer gespeicherten Zerstörungsanforderung bestätigt es den Abbau.

`contracts.gatewayMethodDispatch` akzeptiert derzeit `"authenticated-request"`. Dies ist eine API-Hygienesperre für native Plugin-HTTP-Routen, die absichtlich Gateway-Methoden der Steuerungsebene prozessintern weiterleiten, und keine Sandbox gegen bösartige native Plugins. Verwenden Sie sie nur für sorgfältig geprüfte gebündelte oder für Betreiber vorgesehene Oberflächen, die bereits eine Gateway-HTTP-Authentifizierung erfordern. Eine berechtigte Route bleibt bei geschlossener Annahme von Gateway-Stammaufgaben nur dann erreichbar, wenn sie zusätzlich `auth: "gateway"` und die routenspezifische Angabe `gatewayRuntimeScopeSurface: "trusted-operator"` deklariert; gewöhnliche benachbarte Routen desselben Plugins verbleiben hinter der Annahmegrenze. Dadurch bleiben der Sperrstatus und die Wiederaufnahme erreichbar, ohne dem gesamten Plugin eine Umgehung der Annahmeprüfung zu gewähren. Begrenzen Sie Parsing und Antwortgestaltung außerhalb der Weiterleitung; wesentliche oder verändernde Arbeiten müssen die Weiterleitung von Gateway-Methoden durchlaufen, die für die Durchsetzung von Annahme und Geltungsbereich zuständig ist.

## Referenz für configContracts

Verwenden Sie `configContracts` für manifestgesteuertes Konfigurationsverhalten, das generische Kern-Hilfsfunktionen benötigen, ohne die Plugin-Runtime zu importieren: Erkennung gefährlicher Flags, Migrationsziele für SecretRef und Eingrenzung veralteter Konfigurationspfade.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| Feld                          | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                                                            |
| ----------------------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Nein         | `string[]` | Konfigurationspfade relativ zum Stamm, die darauf hinweisen, dass die Kompatibilitätsmigrationen dieses Plugins während der Einrichtung anwendbar sein könnten. Dadurch können generische Runtime-Konfigurationslesevorgänge alle Einrichtungsoberflächen von Plugins überspringen, wenn die Konfiguration nie auf das Plugin verweist. |
| `compatibilityRuntimePaths`   | Nein         | `string[]` | Kompatibilitätspfade relativ zum Stamm, die dieses Plugin während der Runtime bedienen kann, bevor der Plugin-Code vollständig aktiviert wird. Verwenden Sie dies für veraltete Oberflächen, um die Kandidatenmenge gebündelter Plugins einzugrenzen, ohne jede kompatible Plugin-Runtime zu importieren. |
| `dangerousFlags`              | Nein         | `object[]` | Konfigurationsliterale, die `openclaw doctor` bei Aktivierung als unsicher oder gefährlich kennzeichnen sollte. Siehe unten.                                                                                                                         |
| `secretInputs`                | Nein         | `object`   | Konfigurationspfade unter `plugins.entries.<id>.config`, die die Zielregistrierung für SecretRef-Migration und -Prüfung als geheimnisförmige Zeichenfolgen behandeln sollte. Siehe unten.                                                            |

Jeder Eintrag in `dangerousFlags` unterstützt:

| Feld     | Erforderlich | Typ                                   | Bedeutung                                                                                                                      |
| -------- | ------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `path`   | Ja           | `string`                              | Durch Punkte getrennter Konfigurationspfad relativ zu `plugins.entries.<id>.config`. Unterstützt `*`-Platzhalter für Karten-/Arraysegmente. |
| `equals` | Ja           | `string \| number \| boolean \| null` | Exakter Literalwert, der diesen Konfigurationswert als gefährlich kennzeichnet.                                                |

`secretInputs` unterstützt:

| Feld                    | Erforderlich | Typ        | Bedeutung                                                                                                                                                                                                                           |
| ----------------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Nein         | `boolean`  | Überschreibt die standardmäßige Aktivierung des gebündelten Plugins bei der Entscheidung, ob diese SecretRef-Oberfläche aktiv ist. Verwenden Sie dies, wenn das Plugin gebündelt ist, die Oberfläche jedoch inaktiv bleiben soll, bis sie ausdrücklich in der Konfiguration aktiviert wird. |
| `paths`                 | Ja           | `object[]` | Konfigurationspfade in Secret-Form, jeweils mit `path` (durch Punkte getrennt, relativ zu `plugins.entries.<id>.config`, unterstützt `*`-Platzhalter) und optional `expected` (derzeit nur `"string"`).                                  |

## Referenz zu mediaUnderstandingProviderMetadata

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Provider für Medienverständnis über Standardmodelle, eine Fallback-Priorität für automatische Authentifizierung oder native Dokumentunterstützung verfügt, die generische Core-Hilfsfunktionen vor dem Laden der Laufzeit benötigen. Schlüssel müssen außerdem in `contracts.mediaUnderstandingProviders` deklariert werden.

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

Jeder Provider-Eintrag kann Folgendes enthalten:

| Feld                   | Typ                                                              | Bedeutung                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Von diesem Provider bereitgestellte Medienfunktionen.                                                                         |
| `defaultModels`        | `Record<string, string>`                                         | Standardzuordnungen von Funktionen zu Modellen, die verwendet werden, wenn die Konfiguration kein Modell angibt.              |
| `autoPriority`         | `Record<string, number>`                                         | Niedrigere Zahlen werden beim automatischen, Anmeldedaten-basierten Provider-Fallback früher einsortiert.                      |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Vom Provider unterstützte native Dokumenteingaben.                                                                            |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Modellspezifische Überschreibungen je Dokumenttyp. Setzen Sie `image: false`, um die bildbasierte Extraktion für diesen Dokumenttyp zu deaktivieren. |

## Referenz zu channelConfigs

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin vor dem Laden der Laufzeit kostengünstige Konfigurationsmetadaten benötigt. Die schreibgeschützte Ermittlung von Kanaleinrichtung und -status kann diese Metadaten direkt für konfigurierte externe Kanäle verwenden, wenn kein Einrichtungseintrag verfügbar ist oder wenn `setup.requiresRuntime: false` deklariert, dass keine Einrichtungslaufzeit erforderlich ist.

`channelConfigs` sind Metadaten des Plugin-Manifests und kein neuer Konfigurationsabschnitt auf oberster Ebene für Benutzer. Benutzer konfigurieren Kanalinstanzen weiterhin unter `channels.<channel-id>`. OpenClaw liest die Manifestmetadaten, um vor der Ausführung des Plugin-Laufzeitcodes zu bestimmen, welches Plugin für den konfigurierten Kanal zuständig ist.

Bei einem Kanal-Plugin beschreiben `configSchema` und `channelConfigs` unterschiedliche Pfade:

- `configSchema` validiert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` validiert `channels.<channel-id>`

Nicht gebündelte Plugins, die `channels[]` deklarieren, sollten außerdem entsprechende `channelConfigs`-Einträge deklarieren. Ohne diese kann OpenClaw das Plugin weiterhin laden, aber Konfigurationsschema-, Einrichtungs- und Control-UI-Oberflächen im Kaltpfad können die Form der kanaleigenen Optionen erst erkennen, nachdem die Plugin-Laufzeit ausgeführt wurde.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` und `nativeSkillsAutoEnabled` können statische `auto`-Standardwerte für Prüfungen der Befehlskonfiguration deklarieren, die vor dem Laden der Kanallaufzeit ausgeführt werden. Gebündelte Kanäle können dieselben Standardwerte außerdem über `package.json#openclaw.channel.commands` zusammen mit ihren übrigen paketeigenen Kanal-Katalogmetadaten veröffentlichen.

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
      "description": "Matrix-Homeserver-Verbindung",
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

| Feld          | Typ                      | Bedeutung                                                                                                                    |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanalkonfigurationseintrag erforderlich.                             |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen, Platzhalter und Hinweise auf sensible Werte für diesen Kanalkonfigurationsabschnitt.             |
| `label`       | `string`                 | Kanalbeschriftung, die in Auswahl- und Inspektionsoberflächen übernommen wird, wenn die Laufzeitmetadaten noch nicht bereitstehen. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                                                             |
| `commands`    | `object`                 | Statische automatische Standardwerte für native Befehle und native Skills bei Konfigurationsprüfungen vor der Laufzeit.      |
| `preferOver`  | `string[]`               | Ältere oder nachrangige Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll.                                 |

### Ersetzen eines anderen Kanal-Plugins

Verwenden Sie `preferOver`, wenn Ihr Plugin der bevorzugte Zuständige für eine Kanal-ID ist, die auch von einem anderen Plugin bereitgestellt werden kann. Typische Fälle sind eine umbenannte Plugin-ID, ein eigenständiges Plugin, das ein gebündeltes Plugin ersetzt, oder ein gepflegter Fork, der aus Gründen der Konfigurationskompatibilität dieselbe Kanal-ID beibehält.

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

Wenn `channels.chat` konfiguriert ist, berücksichtigt OpenClaw sowohl die Kanal-ID als auch die bevorzugte Plugin-ID. Wenn das nachrangige Plugin nur ausgewählt wurde, weil es gebündelt oder standardmäßig aktiviert ist, deaktiviert OpenClaw es in der effektiven Laufzeitkonfiguration, sodass genau ein Plugin für den Kanal und dessen Werkzeuge zuständig ist. Eine ausdrückliche Benutzerauswahl hat weiterhin Vorrang: Wenn der Benutzer beide Plugins ausdrücklich aktiviert (über `plugins.allow` oder eine substanzielle `plugins.entries`-Konfiguration), behält OpenClaw diese Auswahl bei und meldet Diagnosen zu doppelten Kanälen und Werkzeugen, statt die angeforderte Plugin-Auswahl stillschweigend zu ändern.

Beschränken Sie `preferOver` auf Plugin-IDs, die tatsächlich denselben Kanal bereitstellen können. Es ist kein allgemeines Prioritätsfeld und benennt keine Benutzerkonfigurationsschlüssel um.

## Referenz zu modelSupport

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin vor dem Laden der Plugin-Laufzeit aus verkürzten Modell-IDs wie `gpt-5.6-sol` oder `claude-sonnet-4.6` ableiten soll.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet folgende Rangfolge an:

- Explizite `provider/model`-Referenzen verwenden die zugehörigen `providers`-Manifestmetadaten.
- `modelPatterns` haben Vorrang vor `modelPrefixes`.
- Wenn sowohl ein nicht gebündeltes als auch ein gebündeltes Plugin übereinstimmen, hat das nicht gebündelte Plugin Vorrang.
- Verbleibende Mehrdeutigkeiten werden ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt.

Felder:

| Feld            | Typ        | Bedeutung                                                                                           |
| --------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mithilfe von `startsWith` mit verkürzten Modell-IDs abgeglichen werden.                 |
| `modelPatterns` | `string[]` | Quellen regulärer Ausdrücke, die nach dem Entfernen des Profilsuffixes mit verkürzten Modell-IDs abgeglichen werden. |

`modelPatterns`-Einträge werden über `compileSafeRegex` kompiliert, das Muster mit verschachtelten Wiederholungen ablehnt (beispielsweise `(a+)+$`). Muster, die die Sicherheitsprüfung nicht bestehen, werden ebenso wie syntaktisch ungültige reguläre Ausdrücke stillschweigend übersprungen. Halten Sie Muster einfach und vermeiden Sie verschachtelte Quantifizierer.

## Referenz zu modelCatalog

Verwenden Sie `modelCatalog`, wenn OpenClaw die Modellmetadaten eines Providers vor dem Laden der Plugin-Laufzeit kennen soll. Dies ist die Manifest-eigene Quelle für feste Katalogzeilen, Provider-Aliasse, Unterdrückungsregeln und den Ermittlungsmodus. Die Laufzeitaktualisierung verbleibt weiterhin im Provider-Laufzeitcode, aber das Manifest teilt dem Core mit, wann die Laufzeit erforderlich ist.

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
        "reason": "nicht in Azure OpenAI Responses verfügbar"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Felder auf oberster Ebene:

| Feld             | Typ                                                      | Bedeutung                                                                                                                      |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `providers`      | `Record<string, object>`                                 | Katalogzeilen für Provider-IDs, die diesem Plugin gehören. Schlüssel sollten auch im obersten `providers`-Eintrag erscheinen. |
| `aliases`        | `Record<string, object>`                                 | Provider-Aliasse, die für die Katalog- oder Unterdrückungsplanung zu einem zugehörigen Provider aufgelöst werden sollen.        |
| `suppressions`   | `object[]`                                               | Modellzeilen aus einer anderen Quelle, die dieses Plugin aus einem Provider-spezifischen Grund unterdrückt.                    |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Gibt an, ob der Provider-Katalog aus Manifestmetadaten gelesen, im Cache aktualisiert werden kann oder die Laufzeit benötigt.  |
| `runtimeAugment` | `boolean`                                                | Nur auf `true` setzen, wenn die Provider-Laufzeit nach der Manifest-/Konfigurationsplanung Katalogzeilen ergänzen muss.         |

`aliases` wird bei der Ermittlung der Provider-Zuständigkeit für die Modellkatalogplanung berücksichtigt. Aliasziele müssen Provider auf oberster Ebene sein, die demselben Plugin gehören. Wenn eine nach Provider gefilterte Liste einen Alias verwendet, kann OpenClaw das zugehörige Manifest lesen und Überschreibungen für Alias-API/Basis-URL anwenden, ohne die Provider-Laufzeit zu laden. Aliasse erweitern ungefilterte Katalogauflistungen nicht; umfassende Listen geben nur die zugehörigen kanonischen Provider-Zeilen aus.

`suppressions` ersetzt den alten Provider-Laufzeit-Hook `suppressBuiltInModel`. Unterdrückungseinträge werden nur berücksichtigt, wenn der Provider dem Plugin gehört oder als Schlüssel unter `modelCatalog.aliases` deklariert ist, der auf einen zugehörigen Provider verweist. Laufzeit-Hooks zur Unterdrückung werden bei der Modellauflösung nicht mehr aufgerufen.

Provider-Felder:

| Feld                  | Typ                      | Bedeutung                                                                                                                                                                                                                                            |
| --------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | Optionale standardmäßige Basis-URL für Modelle in diesem Provider-Katalog.                                                                                                                                                                           |
| `api`                 | `ModelApi`               | Optionaler standardmäßiger API-Adapter für Modelle in diesem Provider-Katalog.                                                                                                                                                                       |
| `headers`             | `Record<string, string>` | Optionale statische Header, die für diesen Provider-Katalog gelten.                                                                                                                                                                                   |
| `defaultUtilityModel` | `string`                 | Optionale, vom Provider empfohlene ID eines kleinen Modells für kurze interne Hilfsaufgaben (Titel, Fortschrittsbeschreibung). Wird verwendet, wenn `agents.defaults.utilityModel` nicht gesetzt ist und dieser Provider das primäre Modell des Agenten bereitstellt. |
| `models`              | `object[]`               | Erforderliche Modellzeilen. Zeilen ohne `id` werden ignoriert.                                                                                                                                                                                        |

Modellfelder:

| Feld               | Typ                                                            | Bedeutung                                                                                           |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Provider-lokale Modell-ID ohne das Präfix `provider/`.                                              |
| `name`             | `string`                                                       | Optionaler Anzeigename.                                                                             |
| `api`              | `ModelApi`                                                     | Optionale API-Überschreibung pro Modell.                                                            |
| `baseUrl`          | `string`                                                       | Optionale Überschreibung der Basis-URL pro Modell.                                                  |
| `headers`          | `Record<string, string>`                                       | Optionale statische Header pro Modell.                                                              |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalitäten, die das Modell akzeptiert. Andere Werte werden stillschweigend verworfen.              |
| `reasoning`        | `boolean`                                                      | Gibt an, ob das Modell Reasoning-Verhalten bereitstellt.                                            |
| `contextWindow`    | `number`                                                       | Natives Kontextfenster des Providers.                                                               |
| `contextTokens`    | `number`                                                       | Optionale effektive Laufzeitbegrenzung des Kontexts, wenn sie von `contextWindow` abweicht.          |
| `maxTokens`        | `number`                                                       | Maximale Anzahl an Ausgabe-Token, sofern bekannt.                                                   |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Optionale Überschreibungen der Modell-ID oder von Parametern je Denkstufe.                           |
| `cost`             | `object`                                                       | Optionale Preise in USD pro Million Token, einschließlich optionalem `tieredPricing`.                |
| `compat`           | `object`                                                       | Optionale Kompatibilitätsflags, die der Kompatibilität der OpenClaw-Modellkonfiguration entsprechen. |
| `mediaInput`       | `object`                                                       | Optionale Eingabekonfiguration je Modalität, derzeit nur für Bilder.                                |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Auflistungsstatus. Nur unterdrücken, wenn die Zeile überhaupt nicht erscheinen darf.                |
| `statusReason`     | `string`                                                       | Optionaler Grund, der bei einem nicht verfügbaren Status angezeigt wird.                            |
| `replaces`         | `string[]`                                                     | Ältere Provider-lokale Modell-IDs, die dieses Modell ersetzt.                                       |
| `replacedBy`       | `string`                                                       | Provider-lokale ID des Ersatzmodells für veraltete Zeilen.                                          |
| `tags`             | `string[]`                                                     | Stabile Tags, die von Auswahlfeldern und Filtern verwendet werden.                                  |

Unterdrückungsfelder:

| Feld                       | Typ        | Bedeutung                                                                                                                            |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | Provider-ID der zu unterdrückenden Upstream-Zeile. Muss diesem Plugin gehören oder als zugehöriger Alias deklariert sein.            |
| `model`                    | `string`   | Provider-lokale ID des zu unterdrückenden Modells.                                                                                    |
| `reason`                   | `string`   | Optionale Meldung, die angezeigt wird, wenn die unterdrückte Zeile direkt angefordert wird.                                          |
| `when.baseUrlHosts`        | `string[]` | Optionale Liste effektiver Hosts der Provider-Basis-URL, die erforderlich sind, bevor die Unterdrückung angewendet wird.             |
| `when.providerConfigApiIn` | `string[]` | Optionale Liste exakter `api`-Werte der Provider-Konfiguration, die erforderlich sind, bevor die Unterdrückung angewendet wird.      |

Legen Sie keine ausschließlich zur Laufzeit verfügbaren Daten in `modelCatalog` ab. Verwenden Sie `static` nur, wenn die Manifestzeilen vollständig genug sind, damit nach Provider gefilterte Listen und Auswahloberflächen die Registry-/Laufzeiterkennung überspringen können. Verwenden Sie `refreshable`, wenn Manifestzeilen nützliche, auflistbare Ausgangsdaten oder Ergänzungen sind, eine Aktualisierung oder ein Cache jedoch später weitere Zeilen hinzufügen kann; aktualisierbare Zeilen sind für sich genommen nicht maßgeblich. Verwenden Sie `runtime`, wenn OpenClaw die Provider-Laufzeit laden muss, um die Liste zu ermitteln.

## Referenz zu modelIdNormalization

Verwenden Sie `modelIdNormalization` für einfache, dem Provider zugehörige Bereinigungen von Modell-IDs, die vor dem Laden der Provider-Laufzeit erfolgen müssen. Dadurch verbleiben Aliasse wie kurze Modellnamen, ältere Provider-lokale IDs und Proxy-Präfixregeln im Manifest des zugehörigen Plugins statt in den zentralen Tabellen zur Modellauswahl.

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

| Feld                                 | Typ                     | Bedeutung                                                                                                        |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Exakte, nicht nach Groß-/Kleinschreibung unterscheidende Modell-ID-Aliasse. Werte werden wie angegeben zurückgegeben. |
| `stripPrefixes`                      | `string[]`              | Präfixe, die vor der Aliassuche entfernt werden; nützlich bei älteren Dopplungen von Provider und Modell.         |
| `prefixWhenBare`                     | `string`                | Präfix, das hinzugefügt wird, wenn die normalisierte Modell-ID noch kein `/` enthält.                             |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Bedingte Präfixregeln für IDs ohne Präfix nach der Aliassuche, geschlüsselt nach `modelPrefix` und `prefix`.      |

## Referenz zu providerEndpoints

Verwenden Sie `providerEndpoints` für die Endpunktklassifizierung, die generische Anfragerichtlinien vor dem Laden der Provider-Laufzeit kennen müssen. Der Core definiert weiterhin die Bedeutung jeder `endpointClass`; Plugin-Manifeste definieren die Host- und Basis-URL-Metadaten.

Offiziell externalisierte Provider-Plugins sind von der Core-Distribution ausgeschlossen, daher sind ihre Manifeste erst nach der Installation sichtbar. Ihre `providerEndpoints` müssen außerdem in `scripts/lib/official-external-provider-catalog.json` gespiegelt werden, damit die Endpunktklassifizierung auch ohne das Plugin weiterhin funktioniert; ein Vertragstest erzwingt diese Spiegelung.

Endpunktfelder:

| Feld                           | Typ        | Bedeutung                                                                                                 |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekannte zentrale Endpunktklasse, beispielsweise `openrouter`, `moonshot-native` oder `google-vertex`.   |
| `hosts`                        | `string[]` | Exakte Hostnamen, die der Endpunktklasse zugeordnet werden.                                               |
| `hostSuffixes`                 | `string[]` | Hostsuffixe, die der Endpunktklasse zugeordnet werden. Stellen Sie für einen ausschließlichen Abgleich von Domainsuffixen einen `.` voran. |
| `baseUrls`                     | `string[]` | Exakte normalisierte HTTP(S)-Basis-URLs, die der Endpunktklasse zugeordnet werden.                        |
| `googleVertexRegion`           | `string`   | Statische Google-Vertex-Region für exakte globale Hosts.                                                  |
| `googleVertexRegionHostSuffix` | `string`   | Suffix, das von übereinstimmenden Hosts entfernt wird, um das Präfix der Google-Vertex-Region freizulegen. |

## Referenz zu providerRequest

Verwenden Sie `providerRequest` für kostengünstige Metadaten zur Anfragekompatibilität, die generische Anfragerichtlinien benötigen, ohne die Provider-Laufzeit zu laden. Belassen Sie verhaltensspezifische Umschreibungen der Nutzlast in Laufzeit-Hooks des Providers oder gemeinsamen Hilfsfunktionen der Provider-Familie.

```json
{
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

| Feld                  | Typ          | Bedeutung                                                                                       |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Bezeichnung der Provider-Familie, die für generische Entscheidungen zur Anfragekompatibilität und für Diagnosen verwendet wird. |
| `compatibilityFamily` | `"moonshot"` | Optionaler Kompatibilitätsbereich der Provider-Familie für gemeinsame Anfragehilfsfunktionen.   |
| `openAICompletions`   | `object`     | Flags für OpenAI-kompatible Vervollständigungsanfragen, derzeit `supportsStreamingUsage`.        |

## Referenz zu secretProviderIntegrations

Verwenden Sie `secretProviderIntegrations`, wenn ein Plugin eine wiederverwendbare Voreinstellung für einen SecretRef-Exec-Provider veröffentlichen kann. OpenClaw liest diese Metadaten, bevor die Plugin-Laufzeit geladen wird, speichert die Plugin-Zuständigkeit unter `secrets.providers.<alias>.pluginIntegration` und überlässt die eigentliche Auflösung von Geheimnissen der SecretRef-Laufzeit. Voreinstellungen werden nur für gebündelte Plugins und installierte Plugins bereitgestellt, die in den verwalteten Installationsstammverzeichnissen für Plugins gefunden wurden, beispielsweise bei Installationen über Git und ClawHub.

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

Der Schlüssel der Zuordnung ist die Integrations-ID. Wenn `providerAlias` nicht angegeben ist, verwendet OpenClaw die Integrations-ID als Alias des SecretRef-Providers. Provider-Aliasse müssen dem regulären Muster für Aliasse von SecretRef-Providern entsprechen, beispielsweise `team-secrets` oder `onepassword-work`.

Wenn ein Betreiber die Voreinstellung auswählt, schreibt OpenClaw eine Provider-Referenz wie die folgende:

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

Beim Start oder erneuten Laden löst OpenClaw diesen Provider auf, indem es die aktuellen Metadaten des Plugin-Manifests lädt, prüft, ob das zuständige Plugin installiert und aktiv ist, und den Exec-Befehl aus dem Manifest erzeugt. Durch das Deaktivieren oder Entfernen des Plugins wird der Provider für aktive SecretRefs widerrufen. Betreiber, die eine eigenständige Exec-Konfiguration wünschen, können weiterhin manuelle Provider mit `command` und `args` direkt eintragen.

Derzeit werden nur Voreinstellungen mit `source: "exec"` unterstützt. `command` muss `${node}` sein und `args[0]` muss ein relativ zum Plugin-Stammverzeichnis angegebenes Auflösungsskript mit `./` sein. OpenClaw ersetzt diese Angaben beim Start oder erneuten Laden durch die aktuelle ausführbare Node-Datei und den absoluten Skriptpfad innerhalb des Plugins. Node-Optionen wie `--require`, `--import`, `--loader`, `--env-file`, `--eval` und `--print` sind nicht Teil des Vertrags für Manifest-Voreinstellungen. Betreiber, die Befehle außerhalb von Node benötigen, können eigenständige manuelle Exec-Provider direkt konfigurieren.

OpenClaw leitet `trustedDirs` für Manifest-Voreinstellungen aus dem Plugin-Stammverzeichnis und bei `${node}`-Voreinstellungen zusätzlich aus dem Verzeichnis der aktuellen ausführbaren Node-Datei ab. Im Manifest angegebene `trustedDirs` werden ignoriert. Andere Optionen des Exec-Providers wie `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` und `allowInsecurePath` werden an die reguläre Konfiguration des SecretRef-Exec-Providers weitergereicht.

## Referenz zu modelPricing

Verwenden Sie `modelPricing`, wenn ein Provider das Preisverhalten der Steuerungsebene festlegen muss, bevor die Laufzeit geladen wird. Der Preis-Cache des Gateway liest diese Metadaten, ohne den Laufzeitcode des Providers zu importieren.

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

| Feld         | Typ               | Bedeutung                                                                                              |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | Setzen Sie den Wert für lokale oder selbst gehostete Provider, die niemals Preisdaten von OpenRouter oder LiteLLM abrufen sollen, auf `false`. |
| `openRouter` | `false \| object` | Zuordnung für die OpenRouter-Preisabfrage. `false` deaktiviert die OpenRouter-Abfrage für diesen Provider. |
| `liteLLM`    | `false \| object` | Zuordnung für die LiteLLM-Preisabfrage. `false` deaktiviert die LiteLLM-Abfrage für diesen Provider.    |

Quellfelder:

| Feld                       | Typ                | Bedeutung                                                                                                               |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Provider-ID des externen Katalogs, wenn sie von der OpenClaw-Provider-ID abweicht, beispielsweise `z-ai` für einen `zai`-Provider. |
| `passthroughProviderModel` | `boolean`          | Behandelt Modell-IDs mit Schrägstrichen als verschachtelte Provider-/Modellreferenzen; dies ist für Proxy-Provider wie OpenRouter nützlich. |
| `modelIdTransforms`        | `"version-dots"[]` | Zusätzliche Modell-ID-Varianten des externen Katalogs. `version-dots` versucht Version-IDs mit Punkten wie `claude-opus-4.6`. |

### OpenClaw-Provider-Index

Der OpenClaw-Provider-Index enthält OpenClaw-eigene Vorschaumetadaten für Provider, deren Plugins möglicherweise noch nicht installiert sind. Er ist nicht Teil eines Plugin-Manifests. Plugin-Manifeste bleiben die maßgebliche Quelle für installierte Plugins. Der Provider-Index ist der interne Rückfallvertrag, den künftige Oberflächen für installierbare Provider und die Modellauswahl vor der Installation verwenden werden, wenn ein Provider-Plugin nicht installiert ist.

Rangfolge der Katalogquellen:

1. Benutzerkonfiguration.
2. `modelCatalog` des installierten Plugin-Manifests.
3. Modellkatalog-Cache aus einer expliziten Aktualisierung.
4. Vorschauzeilen des OpenClaw-Provider-Index.

Der Provider-Index darf keine Geheimnisse, Aktivierungszustände, Laufzeit-Hooks oder aktuellen kontospezifischen Modelldaten enthalten. Seine Vorschaukataloge verwenden dieselbe Zeilenstruktur für `modelCatalog`-Provider wie Plugin-Manifeste, sollten jedoch auf stabile Anzeigemetadaten beschränkt bleiben, sofern Laufzeitadapter-Felder wie `api`, `baseUrl`, Preise oder Kompatibilitätsflags nicht absichtlich mit dem installierten Plugin-Manifest synchron gehalten werden. Provider mit dynamischer `/models`-Ermittlung sollten aktualisierte Zeilen über den expliziten Cache-Pfad des Modellkatalogs schreiben, statt bei der normalen Auflistung oder Einrichtung Provider-APIs aufzurufen.

Einträge des Provider-Index können außerdem Metadaten für installierbare Plugins enthalten, wenn das Plugin eines Providers aus dem Kern ausgelagert wurde oder aus anderen Gründen noch nicht installiert ist. Diese Metadaten entsprechen dem Muster des Kanalkatalogs: Paketname, npm-Installationsangabe, erwartete Integrität und einfache Bezeichnungen für Authentifizierungsoptionen reichen aus, um eine installierbare Einrichtungsoption anzuzeigen. Sobald das Plugin installiert ist, hat dessen Manifest Vorrang und der Eintrag im Provider-Index wird für diesen Provider ignoriert.

`openclaw doctor --fix` migriert eine kleine, abgeschlossene Gruppe veralteter Manifest-Fähigkeitsschlüssel auf oberster Ebene nach `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` und `tools`. Keiner dieser Schlüssel oder irgendeine andere Fähigkeitsliste wird noch als Manifest-Feld der obersten Ebene gelesen; das normale Laden von Manifesten erkennt sie nur unter `contracts`.

## Manifest im Vergleich zu package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwendungszweck                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Ermittlung, Konfigurationsvalidierung, Metadaten für Authentifizierungsoptionen und UI-Hinweise, die verfügbar sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und der `openclaw`-Block für Einstiegspunkte, Installationsbedingungen, Einrichtung oder Katalogmetadaten |

Wenn Sie nicht sicher sind, wohin bestimmte Metadaten gehören, verwenden Sie diese Regel:

- Wenn OpenClaw sie kennen muss, bevor Plugin-Code geladen wird, tragen Sie sie in `openclaw.plugin.json` ein.
- Wenn sie die Paketierung, Einstiegsdateien oder das Installationsverhalten von npm betreffen, tragen Sie sie in `package.json` ein.

### package.json-Felder, die die Ermittlung beeinflussen

Einige Plugin-Metadaten für die Phase vor der Laufzeit befinden sich absichtlich im `openclaw`-Block von `package.json` statt in `openclaw.plugin.json`. `openclaw.bundle` und `openclaw.bundle.json` sind keine Verträge für OpenClaw-Plugins; native Plugins müssen `openclaw.plugin.json` sowie die unten aufgeführten unterstützten `package.json#openclaw`-Felder verwenden.

Wichtige Beispiele:

| Feld                                                                                       | Bedeutung                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Deklariert native Plugin-Einstiegspunkte. Sie müssen innerhalb des Plugin-Paketverzeichnisses verbleiben.                                                                                                                                       |
| `openclaw.runtimeExtensions`                                                               | Deklariert die erstellten JavaScript-Laufzeit-Einstiegspunkte für installierte Pakete. Sie müssen innerhalb des Plugin-Paketverzeichnisses verbleiben.                                                                                           |
| `openclaw.setupEntry`                                                                      | Schlanker, ausschließlich für die Einrichtung vorgesehener Einstiegspunkt, der beim Onboarding, beim verzögerten Kanalstart und bei der schreibgeschützten Ermittlung des Kanalstatus bzw. von SecretRefs verwendet wird. Er muss innerhalb des Plugin-Paketverzeichnisses verbleiben. |
| `openclaw.runtimeSetupEntry`                                                               | Deklariert den erstellten JavaScript-Einrichtungs-Einstiegspunkt für installierte Pakete. Erfordert `setupEntry`, muss vorhanden sein und innerhalb des Plugin-Paketverzeichnisses verbleiben.                                                     |
| `openclaw.channel`                                                                         | Ressourcenschonende Metadaten des Kanalkatalogs, etwa Bezeichnungen, Dokumentationspfade, Aliase und Auswahltexte.                                                                                                                               |
| `openclaw.channel.commands`                                                                | Statische Metadaten für native Befehle und automatische Standardwerte nativer Skills, die von Konfigurations-, Prüfungs- und Befehlslistenoberflächen verwendet werden, bevor die Kanallaufzeit geladen wird.                                      |
| `openclaw.channel.configuredState`                                                         | Schlanke Metadaten zur Prüfung des Konfigurationsstatus, mit denen sich die Frage „Ist bereits eine ausschließlich umgebungsbasierte Einrichtung vorhanden?“ beantworten lässt, ohne die vollständige Kanallaufzeit zu laden.                     |
| `openclaw.channel.persistedAuthState`                                                      | Schlanke Metadaten zur Prüfung des gespeicherten Authentifizierungsstatus, mit denen sich die Frage „Ist bereits irgendwo eine Anmeldung aktiv?“ beantworten lässt, ohne die vollständige Kanallaufzeit zu laden.                                 |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installations-/Aktualisierungshinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                                                                       |
| `openclaw.install.defaultChoice`                                                           | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                                                                                |
| `openclaw.install.minHostVersion`                                                          | Unterstützte Mindestversion des OpenClaw-Hosts unter Verwendung einer semver-Untergrenze wie `>=2026.3.22` oder `>=2026.5.1-beta.1`.                                                                                                            |
| `openclaw.compat.pluginApi`                                                                | Von diesem Paket mindestens benötigter Versionsbereich der OpenClaw-Plugin-API unter Verwendung einer semver-Untergrenze wie `>=2026.5.27`.                                                                                                     |
| `openclaw.install.expectedIntegrity`                                                       | Erwartete npm-Dist-Integritätszeichenfolge wie `sha512-...`; Installations- und Aktualisierungsabläufe gleichen das abgerufene Artefakt damit ab.                                                                                               |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Ermöglicht einen eng begrenzten Wiederherstellungspfad durch Neuinstallation eines gebündelten Plugins, wenn die Konfiguration ungültig ist.                                                                                                    |
| `openclaw.install.requiredPlatformPackages`                                                | npm-Paketaliase, die vorhanden sein müssen, wenn ihre Plattformbeschränkungen in der Sperrdatei zum aktuellen Host passen.                                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Ermöglicht das Laden von Kanaloberflächen der Einrichtungslaufzeit vor dem Lauschen und verschiebt anschließend das vollständige konfigurierte Kanal-Plugin bis zur Aktivierung nach Beginn des Lauschens.                                       |

Manifestmetadaten bestimmen, welche Provider-, Kanal- und Einrichtungsoptionen beim Onboarding angezeigt werden, bevor die Laufzeit geladen wird. `package.json#openclaw.install` teilt dem Onboarding mit, wie dieses Plugin abgerufen oder aktiviert werden soll, wenn die Person eine dieser Optionen auswählt. Verschieben Sie Installationshinweise nicht in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird bei der Installation und beim Laden der Manifestregistrierung für nicht gebündelte Plugin-Quellen durchgesetzt. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte führen dazu, dass externe Plugins auf älteren Hosts übersprungen werden. Bei gebündelten Quell-Plugins wird davon ausgegangen, dass sie gemeinsam mit dem Host-Checkout versioniert sind.

`openclaw.install.requiredPlatformPackages` ist für npm-Pakete vorgesehen, die erforderliche native Binärdateien über optionale, plattformspezifische Aliase bereitstellen. Führen Sie für jeden unterstützten Plattformalias den reinen npm-Paketnamen auf. Während der npm-Installation prüft OpenClaw nur den deklarierten Alias, dessen Plattformbeschränkungen in der Sperrdatei zum aktuellen Host passen. Wenn npm Erfolg meldet, diesen Alias jedoch auslässt, wiederholt OpenClaw den Vorgang einmal mit einem neuen Cache und setzt die Installation zurück, falls der Alias weiterhin fehlt.

`openclaw.compat.pluginApi` wird während der Paketinstallation für nicht gebündelte Plugin-Quellen durchgesetzt. Verwenden Sie dieses Feld für die Mindestversion der OpenClaw-Plugin-SDK-/Laufzeit-API, gegen die das Paket erstellt wurde. Es kann strenger als `minHostVersion` sein, wenn ein Plugin-Paket eine neuere API benötigt, für andere Abläufe jedoch weiterhin einen niedrigeren Installationshinweis beibehält. Bei der offiziellen OpenClaw-Versionssynchronisierung werden vorhandene Mindestversionen der offiziellen Plugin-API standardmäßig auf die OpenClaw-Versionsnummer angehoben. Bei reinen Plugin-Veröffentlichungen kann jedoch eine niedrigere Mindestversion beibehalten werden, wenn das Paket ältere Hosts bewusst unterstützt. Verwenden Sie nicht allein die Paketversion als Kompatibilitätsvertrag. `peerDependencies.openclaw` bleibt eine npm-Paketmetadatenangabe; OpenClaw verwendet den Vertrag `openclaw.compat.pluginApi` für Entscheidungen zur Installationskompatibilität.

Offizielle Metadaten für die bedarfsgesteuerte Installation sollten `clawhubSpec` verwenden, wenn das Plugin auf ClawHub veröffentlicht ist. Das Onboarding behandelt dies als bevorzugte Remote-Quelle und zeichnet nach der Installation Informationen zum ClawHub-Artefakt auf. `npmSpec` bleibt der Kompatibilitäts-Rückfall für Pakete, die noch nicht zu ClawHub migriert wurden.

Die exakte Festlegung der npm-Version befindet sich bereits in `npmSpec`, beispielsweise `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Offizielle externe Katalogeinträge sollten exakte Spezifikationen mit `expectedIntegrity` kombinieren, damit Aktualisierungsabläufe sicher fehlschlagen, falls das abgerufene npm-Artefakt nicht mehr mit der festgelegten Veröffentlichung übereinstimmt. Das interaktive Onboarding bietet aus Kompatibilitätsgründen weiterhin vertrauenswürdige npm-Spezifikationen aus der Registry an, darunter reine Paketnamen und Dist-Tags. Die Katalogdiagnose kann zwischen exakten, variablen, integritätsgebundenen, ohne Integritätsangabe versehenen, hinsichtlich des Paketnamens abweichenden und ungültigen Standardauswahlquellen unterscheiden. Sie warnt außerdem, wenn `expectedIntegrity` vorhanden ist, aber keine gültige npm-Quelle existiert, an die es gebunden werden kann. Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations- und Aktualisierungsabläufe dessen Einhaltung. Wenn es fehlt, wird die Registry-Auflösung ohne Integritätsbindung aufgezeichnet.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status-, Kanallisten- oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige Laufzeit zu laden. Der Einrichtungseinstiegspunkt sollte Kanalmetadaten sowie einrichtungssichere Adapter für Konfiguration, Status und Geheimnisse bereitstellen. Netzwerkclients, Gateway-Listener und Transportlaufzeiten gehören dagegen in den Haupteinstiegspunkt der Erweiterung.

Felder für Laufzeit-Einstiegspunkte setzen Paketgrenzprüfungen für Felder von Quell-Einstiegspunkten nicht außer Kraft. Beispielsweise kann `openclaw.runtimeExtensions` einen aus dem Paket herausführenden Pfad in `openclaw.extensions` nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es macht nicht beliebige fehlerhafte Konfigurationen installierbar. Derzeit ermöglicht es Installationsabläufen lediglich, sich von bestimmten veralteten Fehlern bei Upgrades gebündelter Plugins zu erholen, etwa von einem fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten Eintrag `channels.<id>` für dasselbe gebündelte Plugin. Nicht damit zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und verweisen Betreiber auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` sind Paketmetadaten für ein kleines Prüfmodul:

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

Verwenden Sie dieses Feld, wenn Einrichtungs-, Doctor-, Status- oder schreibgeschützte Anwesenheitsabläufe eine ressourcenschonende Ja/Nein-Prüfung des Authentifizierungsstatus benötigen, bevor das vollständige Kanal-Plugin geladen wird. Der gespeicherte Authentifizierungsstatus ist nicht der konfigurierte Kanalstatus: Verwenden Sie diese Metadaten nicht, um Plugins automatisch zu aktivieren, Laufzeitabhängigkeiten zu reparieren oder zu entscheiden, ob eine Kanallaufzeit geladen werden soll. Der Zielexport sollte eine kleine Funktion sein, die ausschließlich gespeicherten Zustand liest. Leiten Sie sie nicht durch das Laufzeit-Barrel des vollständigen Kanals.

`openclaw.channel.configuredState` verwendet dieselbe Struktur für ressourcenschonende Prüfungen eines ausschließlich umgebungsbasierten Konfigurationsstatus:

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

Verwenden Sie dieses Feld, wenn ein Kanal seinen Konfigurationsstatus anhand von Umgebungsvariablen oder anderen kleinen Eingaben außerhalb der Laufzeit bestimmen kann. Wenn die Prüfung eine vollständige Konfigurationsauflösung oder die tatsächliche Kanallaufzeit benötigt, belassen Sie diese Logik stattdessen im Plugin-Hook `config.hasConfiguredState`.

## Ermittlungsrangfolge (doppelte Plugin-IDs)

OpenClaw ermittelt Plugins aus drei Stammverzeichnissen, die in dieser Reihenfolge geprüft werden: mit OpenClaw ausgelieferte gebündelte Plugins, das globale Installationsstammverzeichnis (`~/.openclaw/extensions`) und das Stammverzeichnis des aktuellen Arbeitsbereichs (`<workspace>/.openclaw/extensions`) sowie alle expliziten Einträge in `plugins.load.paths`.

Wenn zwei ermittelte Plugins dieselbe `id` verwenden, wird nur das Manifest mit der **höchsten Priorität** beibehalten. Duplikate mit niedrigerer Priorität werden verworfen, statt parallel dazu geladen zu werden. Die Priorität lautet von der höchsten zur niedrigsten:

1. **Per Konfiguration ausgewählt** — ein explizit in `plugins.entries.<id>` festgelegter Pfad
2. **Globale Installation, die einem nachverfolgten Installationsdatensatz entspricht** — ein über `openclaw plugin install`/`openclaw plugin update` installiertes Plugin, das die Installationsnachverfolgung von OpenClaw für dieselbe ID erkennt, selbst wenn die ID auch zu einem gebündelten Plugin gehört
3. **Gebündelt** — mit OpenClaw ausgelieferte Plugins
4. **Arbeitsbereich** — relativ zum aktuellen Arbeitsbereich ermittelte Plugins
5. Jeder andere ermittelte Kandidat

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins, die ohne Nachverfolgung im Arbeitsbereich oder globalen Stammverzeichnis liegt, überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin zu überschreiben, führen Sie entweder `openclaw plugin install` für diese ID aus, sodass die nachverfolgte globale Installation eine höhere Priorität als die gebündelte Kopie erhält, oder legen Sie über `plugins.entries.<id>` einen bestimmten Pfad fest, sodass dieser aufgrund der konfigurationsbasierten Priorität Vorrang erhält.
- Verworfene Duplikate werden protokolliert, damit Doctor und die Startdiagnose auf die verworfene Kopie verweisen können.
- Konfigurationsbedingt ausgewählte Überschreibungen von Duplikaten werden in der Diagnose als explizite Überschreibungen bezeichnet, lösen jedoch weiterhin eine Warnung aus, damit veraltete Forks und unbeabsichtigte Überschattungen sichtbar bleiben.

## Anforderungen an das JSON-Schema

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen und Schreiben der Konfiguration validiert, nicht zur Laufzeit.
- Wenn Sie ein mitgeliefertes Plugin um neue Konfigurationsschlüssel erweitern oder davon einen Fork erstellen, aktualisieren Sie gleichzeitig das `configSchema` dieses Plugins in `openclaw.plugin.json`. Schemas mitgelieferter Plugins sind strikt. Wenn Sie daher `plugins.entries.<id>.config.myNewKey` zur Benutzerkonfiguration hinzufügen, ohne `myNewKey` zu `configSchema.properties` hinzuzufügen, wird die Konfiguration abgelehnt, bevor die Plugin-Laufzeit geladen wird.

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

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, sofern die Kanal-ID nicht durch ein Plugin-Manifest deklariert wird. Wenn dieselbe ID auch in `plugins.allow`, `plugins.entries` oder `plugins.installs` vorkommt (ein Plugin, auf das verwiesen wird, das derzeit jedoch nicht gefunden werden kann), stuft OpenClaw dies stattdessen zu einer **Warnung** herab.
- Verweise auf unbekannte Plugin-IDs in `plugins.entries.<id>`, `plugins.allow` und `plugins.deny` sind **Warnungen** („veralteter Konfigurationseintrag wird ignoriert“) und keine Fehler, damit Upgrades sowie entfernte oder umbenannte Plugins den Start des Gateways nicht blockieren.
- Ein Verweis auf eine unbekannte Plugin-ID in `plugins.slots.memory` ist ein **Fehler**. Eine Ausnahme bildet das bekannte offizielle externe Plugin `memory-lancedb`, für das stattdessen eine Warnung ausgegeben wird.
- Wenn ein Plugin installiert ist, aber ein fehlerhaftes oder fehlendes Manifest oder Schema aufweist, schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration vorhanden, das Plugin jedoch **deaktiviert** ist, bleibt die Konfiguration erhalten und in Doctor sowie in den Protokollen wird eine **Warnung** ausgegeben.

Das vollständige `plugins.*`-Schema finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich solcher, die aus dem lokalen Dateisystem geladen werden. Zur Laufzeit wird das Plugin-Modul weiterhin separat geladen; das Manifest dient ausschließlich der Erkennung und Validierung.
- Native Manifeste werden mit JSON5 geparst. Daher sind Kommentare, nachgestellte Kommas und Schlüssel ohne Anführungszeichen zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Der Manifest-Loader liest nur dokumentierte Manifestfelder. Vermeiden Sie benutzerdefinierte Schlüssel auf oberster Ebene.
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerCatalogEntry` muss schlank bleiben und sollte keinen umfangreichen Laufzeitcode importieren. Verwenden Sie es für statische Metadaten des Provider-Katalogs oder eng begrenzte Erkennungsdeskriptoren, nicht für die Ausführung während einer Anfrage.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory` (Standardwert `memory-core`), `kind: "context-engine"` über `plugins.slots.contextEngine` (Standardwert `legacy`).
- Deklarieren Sie die exklusive Plugin-Art in diesem Manifest. `OpenClawPluginDefinition.kind` im Laufzeiteinstieg ist veraltet und bleibt nur als Kompatibilitäts-Fallback für ältere Plugins erhalten.
- Metadaten für Umgebungsvariablen (`setup.providers[].envVars`, das veraltete `providerAuthEnvVars` und `channelEnvVars`) sind ausschließlich deklarativ. Status, Audit, Validierung der Cron-Zustellung und andere schreibgeschützte Oberflächen wenden weiterhin die Vertrauens- und effektiven Aktivierungsrichtlinien für Plugins an, bevor eine Umgebungsvariable als konfiguriert gilt.
- Laufzeit-Metadaten für Assistenten, die Provider-Code erfordern, finden Sie unter [Provider-Laufzeit-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und sämtliche Anforderungen an die Zulassungsliste des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` und `pnpm rebuild <package>`).

## Verwandte Themen

<CardGroup cols={3}>
  <Card title="Plugins erstellen" href="/de/plugins/building-plugins" icon="rocket">
    Erste Schritte mit Plugins.
  </Card>
  <Card title="Plugin-Architektur" href="/de/plugins/architecture" icon="diagram-project">
    Interne Architektur und Funktionsmodell.
  </Card>
  <Card title="SDK-Übersicht" href="/de/plugins/sdk-overview" icon="book">
    Plugin-SDK-Referenz und Subpfadimporte.
  </Card>
</CardGroup>
